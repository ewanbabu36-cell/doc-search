import {
  getDatabase,
  sessions,
  users,
  tenants,
  revocations,
  eq
} from '@docsearch/database';
import type { SessionStore, StoredSession } from '@docsearch/auth';
import type { RoleType } from '@docsearch/api-contracts';
import { createLogger } from '@docsearch/shared-core';
import crypto from 'node:crypto';
import { toDeterministicUuid } from '../../repositories/company/PartnerOnboardingRepository.js';

const logger = createLogger('postgres-session-store');

export class PostgresSessionStore implements SessionStore {
  private memoryCache = new Map<string, StoredSession>();

  async saveSession(session: StoredSession): Promise<void> {
    // 1. Always store in fast in-memory cache
    this.memoryCache.set(session.id, { ...session });

    // 2. Persist to PostgreSQL core.sessions
    const db = getDatabase();
    if (!db) return;

    try {
      const userUuid = session.userId.length === 36 ? session.userId : toDeterministicUuid(session.userId);
      const tenantUuid = session.tenantId.length === 36 ? session.tenantId : toDeterministicUuid(session.tenantId);
      const sessionUuid = session.id.length === 36 ? session.id : toDeterministicUuid(session.id);
      const familyUuid = session.tokenFamilyId.length === 36 ? session.tokenFamilyId : toDeterministicUuid(session.tokenFamilyId);

      // Ensure user exists in core.users
      try {
        await db.insert(users).values({
          id: userUuid,
          email: session.actorEmail.toLowerCase().trim(),
          firstName: 'Authorized',
          lastName: 'User',
          status: 'ACTIVE',
          isEmailVerified: true
        }).onConflictDoNothing();
      } catch {}

      // Ensure tenant exists in core.tenants
      try {
        await db.insert(tenants).values({
          id: tenantUuid,
          name: session.tenantId,
          slug: `tenant-${tenantUuid.slice(0, 8)}`,
          status: 'ACTIVE'
        }).onConflictDoNothing();
      } catch {}

      await db
        .insert(sessions)
        .values({
          id: sessionUuid,
          userId: userUuid,
          tenantId: tenantUuid,
          branchId: session.branchId && session.branchId.length === 36 ? session.branchId : null,
          tokenFamilyId: familyUuid,
          refreshTokenHash: session.refreshTokenHash,
          expiresAt: session.expiresAt,
          revokedAt: session.revokedAt || null,
          lastUsedAt: session.lastUsedAt || new Date(),
          ipAddress: session.ipAddress ? session.ipAddress.slice(0, 45) : null,
          userAgent: session.userAgent ? session.userAgent.slice(0, 500) : null,
          createdAt: session.createdAt || new Date(),
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: sessions.refreshTokenHash,
          set: {
            lastUsedAt: session.lastUsedAt || new Date(),
            revokedAt: session.revokedAt || null,
            updatedAt: new Date()
          }
        });

      logger.info('Session saved to PostgreSQL core.sessions', { sessionId: session.id, userId: session.userId });
    } catch (err) {
      logger.error('Failed to save session to PostgreSQL:', { error: String(err), sessionId: session.id });
    }
  }

  async findSessionByTokenHash(hashedToken: string): Promise<StoredSession | null> {
    // 1. Check memory cache first
    for (const session of this.memoryCache.values()) {
      if (session.refreshTokenHash === hashedToken) {
        return { ...session };
      }
    }

    // 2. Query PostgreSQL core.sessions
    const db = getDatabase();
    if (!db) return null;

    try {
      const rows = await db
        .select()
        .from(sessions)
        .where(eq(sessions.refreshTokenHash, hashedToken))
        .limit(1);

      if (!rows || rows.length === 0 || !rows[0]) {
        return null;
      }

      const row = rows[0];

      // Rehydrate user info from core.users
      let userEmail = 'user@partner.local';
      let roles: RoleType[] = ['DOCTOR'];
      let permissions: string[] = ['clinical:patients:read'];

      try {
        const [u] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
        if (u) {
          userEmail = u.email;
          const meta = (u.metadata || {}) as Record<string, any>;
          if (Array.isArray(meta['roles'])) roles = meta['roles'] as RoleType[];
          if (Array.isArray(meta['permissions'])) permissions = meta['permissions'];
        }
      } catch {}

      const restoredSession: StoredSession = {
        id: row.id,
        userId: row.userId,
        tenantId: row.tenantId,
        branchId: row.branchId || undefined,
        roles,
        permissions,
        actorEmail: userEmail,
        tokenFamilyId: row.tokenFamilyId,
        refreshTokenHash: row.refreshTokenHash,
        expiresAt: new Date(row.expiresAt),
        revokedAt: row.revokedAt ? new Date(row.revokedAt) : null,
        lastUsedAt: new Date(row.lastUsedAt),
        ipAddress: row.ipAddress || undefined,
        userAgent: row.userAgent || undefined,
        createdAt: new Date(row.createdAt)
      };

      this.memoryCache.set(restoredSession.id, { ...restoredSession });
      return restoredSession;
    } catch (err) {
      logger.error('Failed to find session by token hash in PostgreSQL:', { error: String(err) });
      return null;
    }
  }

  async findSessionById(sessionId: string): Promise<StoredSession | null> {
    const cached = this.memoryCache.get(sessionId);
    if (cached) return { ...cached };

    const db = getDatabase();
    if (!db) return null;

    try {
      const sessionUuid = sessionId.length === 36 ? sessionId : toDeterministicUuid(sessionId);
      const rows = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionUuid))
        .limit(1);

      if (!rows || rows.length === 0 || !rows[0]) {
        return null;
      }

      const row = rows[0];
      let userEmail = 'user@partner.local';
      let roles: RoleType[] = ['DOCTOR'];
      let permissions: string[] = ['clinical:patients:read'];

      try {
        const [u] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
        if (u) {
          userEmail = u.email;
          const meta = (u.metadata || {}) as Record<string, any>;
          if (Array.isArray(meta['roles'])) roles = meta['roles'] as RoleType[];
          if (Array.isArray(meta['permissions'])) permissions = meta['permissions'];
        }
      } catch {}

      const restoredSession: StoredSession = {
        id: row.id,
        userId: row.userId,
        tenantId: row.tenantId,
        branchId: row.branchId || undefined,
        roles,
        permissions,
        actorEmail: userEmail,
        tokenFamilyId: row.tokenFamilyId,
        refreshTokenHash: row.refreshTokenHash,
        expiresAt: new Date(row.expiresAt),
        revokedAt: row.revokedAt ? new Date(row.revokedAt) : null,
        lastUsedAt: new Date(row.lastUsedAt),
        ipAddress: row.ipAddress || undefined,
        userAgent: row.userAgent || undefined,
        createdAt: new Date(row.createdAt)
      };

      this.memoryCache.set(restoredSession.id, { ...restoredSession });
      return restoredSession;
    } catch {
      return null;
    }
  }

  async updateSession(session: StoredSession): Promise<void> {
    this.memoryCache.set(session.id, { ...session });

    const db = getDatabase();
    if (!db) return;

    try {
      const sessionUuid = session.id.length === 36 ? session.id : toDeterministicUuid(session.id);
      await db
        .update(sessions)
        .set({
          refreshTokenHash: session.refreshTokenHash,
          lastUsedAt: session.lastUsedAt || new Date(),
          revokedAt: session.revokedAt || null,
          ipAddress: session.ipAddress ? session.ipAddress.slice(0, 45) : null,
          userAgent: session.userAgent ? session.userAgent.slice(0, 500) : null,
          updatedAt: new Date()
        })
        .where(eq(sessions.id, sessionUuid));
    } catch (err) {
      logger.error('Failed to update session in PostgreSQL:', { error: String(err), sessionId: session.id });
    }
  }

  async revokeSessionFamily(tokenFamilyId: string, reason: string): Promise<void> {
    const now = new Date();
    for (const session of this.memoryCache.values()) {
      if (session.tokenFamilyId === tokenFamilyId) {
        session.revokedAt = now;
      }
    }

    const db = getDatabase();
    if (!db) return;

    try {
      const familyUuid = tokenFamilyId.length === 36 ? tokenFamilyId : toDeterministicUuid(tokenFamilyId);
      await db
        .update(sessions)
        .set({
          revokedAt: now,
          updatedAt: now
        })
        .where(eq(sessions.tokenFamilyId, familyUuid));

      await db.insert(revocations).values({
        id: crypto.randomUUID(),
        targetType: 'SESSION_FAMILY',
        targetId: tokenFamilyId,
        reason,
        revokedBy: 'System Revocation',
        revokedAt: now,
        createdAt: now
      });
    } catch (err) {
      logger.error('Failed to revoke session family in PostgreSQL:', { error: String(err), tokenFamilyId });
    }
  }

  async revokeSession(sessionId: string, reason: string): Promise<void> {
    const now = new Date();
    const s = this.memoryCache.get(sessionId);
    if (s) {
      s.revokedAt = now;
    }

    const db = getDatabase();
    if (!db) return;

    try {
      const sessionUuid = sessionId.length === 36 ? sessionId : toDeterministicUuid(sessionId);
      await db
        .update(sessions)
        .set({
          revokedAt: now,
          updatedAt: now
        })
        .where(eq(sessions.id, sessionUuid));

      await db.insert(revocations).values({
        id: crypto.randomUUID(),
        targetType: 'SESSION',
        targetId: sessionId,
        reason,
        revokedBy: 'User or Admin',
        revokedAt: now,
        createdAt: now
      });
    } catch (err) {
      logger.error('Failed to revoke session in PostgreSQL:', { error: String(err), sessionId });
    }
  }
}
