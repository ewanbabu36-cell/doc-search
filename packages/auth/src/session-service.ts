import { randomUUID } from 'node:crypto';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import { generateRefreshToken, hashRefreshToken, signJwt } from './token-service.js';
import type { SessionContext } from './types.js';
import type { RoleType } from '@docsearch/api-contracts';

export interface StoredSession {
  id: string;
  userId: string;
  tenantId: string;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  roles: RoleType[];
  permissions: string[];
  actorEmail: string;
  tokenFamilyId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null | undefined;
  lastUsedAt: Date;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  createdAt: Date;
}

export interface SessionStore {
  saveSession(session: StoredSession): Promise<void>;
  findSessionByTokenHash(hashedToken: string): Promise<StoredSession | null>;
  findSessionById(sessionId: string): Promise<StoredSession | null>;
  updateSession(session: StoredSession): Promise<void>;
  revokeSessionFamily(tokenFamilyId: string, reason: string): Promise<void>;
  revokeSession(sessionId: string, reason: string): Promise<void>;
}

/**
 * In-memory fallback session store (for testing and local dev).
 */
export class InMemorySessionStore implements SessionStore {
  private sessions = new Map<string, StoredSession>();

  async saveSession(session: StoredSession): Promise<void> {
    this.sessions.set(session.id, { ...session });
  }

  async findSessionByTokenHash(hashedToken: string): Promise<StoredSession | null> {
    for (const session of this.sessions.values()) {
      if (session.refreshTokenHash === hashedToken) {
        return { ...session };
      }
    }
    return null;
  }

  async findSessionById(sessionId: string): Promise<StoredSession | null> {
    const s = this.sessions.get(sessionId);
    return s ? { ...s } : null;
  }

  async updateSession(session: StoredSession): Promise<void> {
    this.sessions.set(session.id, { ...session });
  }

  async revokeSessionFamily(tokenFamilyId: string, _reason: string): Promise<void> {
    const now = new Date();
    for (const session of this.sessions.values()) {
      if (session.tokenFamilyId === tokenFamilyId) {
        session.revokedAt = now;
      }
    }
  }

  async revokeSession(sessionId: string, _reason: string): Promise<void> {
    const s = this.sessions.get(sessionId);
    if (s) {
      s.revokedAt = new Date();
    }
  }
}

export interface CreateSessionParams {
  userId: string;
  tenantId: string;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  roles: RoleType[];
  permissions?: string[] | undefined;
  actorEmail: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  jwtSecret: string;
  jwtIssuer?: string | undefined;
  jwtAudience?: string | undefined;
  accessTokenExpiresInSeconds?: number | undefined;
  refreshTokenExpiresInDays?: number | undefined;
}

export interface RefreshTokenParams {
  rawRefreshToken: string;
  jwtSecret: string;
  jwtIssuer?: string | undefined;
  jwtAudience?: string | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  accessTokenExpiresInSeconds?: number | undefined;
}

export class SessionService {
  constructor(private store: SessionStore) {}

  /**
   * Initializes a new session, generates a refresh token family, and signs an access token.
   */
  async createSession(params: CreateSessionParams): Promise<{
    session: SessionContext;
    accessToken: string;
    refreshToken: string;
    sessionId: string;
  }> {
    const sessionId = randomUUID();
    const tokenFamilyId = randomUUID();
    const { token: rawRefreshToken, hashedToken } = generateRefreshToken();

    const refreshDays = params.refreshTokenExpiresInDays ?? 7;
    const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);

    const storedSession: StoredSession = {
      id: sessionId,
      userId: params.userId,
      tenantId: params.tenantId,
      organizationId: params.organizationId ?? params.tenantId,
      branchId: params.branchId,
      roles: params.roles,
      permissions: params.permissions ?? [],
      actorEmail: params.actorEmail,
      tokenFamilyId,
      refreshTokenHash: hashedToken,
      expiresAt,
      revokedAt: null,
      lastUsedAt: new Date(),
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      createdAt: new Date()
    };

    await this.store.saveSession(storedSession);

    const accessToken = signJwt(
      {
        sub: params.userId,
        email: params.actorEmail,
        tenantId: params.tenantId,
        organizationId: storedSession.organizationId,
        branchId: params.branchId,
        roles: params.roles,
        permissions: storedSession.permissions,
        tokenFamilyId,
        jti: sessionId
      },
      {
        secret: params.jwtSecret,
        expiresInSeconds: params.accessTokenExpiresInSeconds ?? 900,
        issuer: params.jwtIssuer,
        audience: params.jwtAudience
      }
    );

    const sessionContext: SessionContext = {
      userId: storedSession.userId,
      tenantId: storedSession.tenantId,
      organizationId: storedSession.organizationId,
      branchId: storedSession.branchId,
      roles: storedSession.roles,
      permissions: storedSession.permissions,
      dataScope: storedSession.roles.includes('SUPER_ADMIN')
        ? 'global'
        : storedSession.branchId
        ? 'branch'
        : 'tenant',
      sessionId: storedSession.id,
      actorEmail: storedSession.actorEmail,
      isSuperAdmin: storedSession.roles.includes('SUPER_ADMIN')
    };

    return {
      session: sessionContext,
      accessToken,
      refreshToken: rawRefreshToken,
      sessionId
    };
  }

  /**
   * Rotates refresh tokens on use:
   * 1. Hashes incoming token and looks up session.
   * 2. If token is expired or revoked -> DENY.
   * 3. REUSE DETECTION: If token was previously replaced/revoked, revoke the ENTIRE token family.
   * 4. Issues new rotated refresh token + new access token.
   */
  async rotateRefreshToken(params: RefreshTokenParams): Promise<{
    session: SessionContext;
    newAccessToken: string;
    newRefreshToken: string;
  }> {
    if (!params.rawRefreshToken) {
      throw AppError.unauthorized('Refresh token is mandatory', ErrorCode.UNAUTHORIZED);
    }

    const hashedIncoming = hashRefreshToken(params.rawRefreshToken);
    const session = await this.store.findSessionByTokenHash(hashedIncoming);

    if (!session) {
      // Possible token reuse or forged token
      throw AppError.unauthorized('Invalid or unrecognised refresh token', ErrorCode.TOKEN_INVALID);
    }

    // Reuse Detection: If session was already revoked, invalidate entire family!
    if (session.revokedAt) {
      await this.store.revokeSessionFamily(
        session.tokenFamilyId,
        'Suspicious refresh token reuse detected on revoked session'
      );
      throw new AppError({
        message: 'Security Alert: Refresh token reuse detected. All active sessions in this family have been terminated.',
        code: ErrorCode.UNAUTHORIZED,
        statusCode: 401
      });
    }

    // Expiration check
    if (session.expiresAt.getTime() < Date.now()) {
      await this.store.revokeSession(session.id, 'Refresh token expired');
      throw new AppError({
        message: 'Refresh token has expired. Please log in again.',
        code: ErrorCode.TOKEN_EXPIRED,
        statusCode: 401
      });
    }

    // Generate new rotated refresh token
    const { token: newRawRefreshToken, hashedToken: newHashedToken } = generateRefreshToken();

    // Update stored session with rotated hash
    session.refreshTokenHash = newHashedToken;
    session.lastUsedAt = new Date();
    if (params.ipAddress) session.ipAddress = params.ipAddress;
    if (params.userAgent) session.userAgent = params.userAgent;

    await this.store.updateSession(session);

    // Issue new access token
    const newAccessToken = signJwt(
      {
        sub: session.userId,
        email: session.actorEmail,
        tenantId: session.tenantId,
        organizationId: session.organizationId,
        branchId: session.branchId,
        roles: session.roles,
        permissions: session.permissions,
        tokenFamilyId: session.tokenFamilyId,
        jti: session.id
      },
      {
        secret: params.jwtSecret,
        expiresInSeconds: params.accessTokenExpiresInSeconds ?? 900,
        issuer: params.jwtIssuer,
        audience: params.jwtAudience
      }
    );

    const sessionContext: SessionContext = {
      userId: session.userId,
      tenantId: session.tenantId,
      organizationId: session.organizationId,
      branchId: session.branchId,
      roles: session.roles,
      permissions: session.permissions,
      dataScope: session.roles.includes('SUPER_ADMIN')
        ? 'global'
        : session.branchId
        ? 'branch'
        : 'tenant',
      sessionId: session.id,
      actorEmail: session.actorEmail,
      isSuperAdmin: session.roles.includes('SUPER_ADMIN')
    };

    return {
      session: sessionContext,
      newAccessToken,
      newRefreshToken: newRawRefreshToken
    };
  }

  /**
   * Explicitly revokes a session upon user logout.
   */
  async logout(sessionId: string): Promise<void> {
    await this.store.revokeSession(sessionId, 'User initiated logout');
  }
}
