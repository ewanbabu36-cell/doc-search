import crypto from 'node:crypto';
import { getDatabase, getTestDatabase, revocations, users, tenants, sessions, branches, eq, and } from '@docsearch/database';
import { createLogger, ErrorCode } from '@docsearch/shared-core';
import type { VerifiedTokenClaims } from '@docsearch/auth';

const logger = createLogger('session-revocation-service');

export interface RevocationCheckResult {
  revoked: boolean;
  reason?: string | undefined;
  code?: string | undefined;
}

export class SessionRevocationService {
  private userRevocations = new Map<string, number>(); // userId -> revokedAt timestamp ms
  private tenantRevocations = new Map<string, number>(); // tenantId -> revokedAt timestamp ms
  private branchRevocations = new Map<string, number>(); // branchId -> revokedAt timestamp ms
  private sessionRevocations = new Set<string>(); // sessionId
  private globalFrozen = false;
  private globalFreezeReason = '';

  constructor() {
    if (getTestDatabase?.() || process.env['DATABASE_URL']) {
      this.syncFromDatabase().catch((err) => {
        logger.warn('Failed initial sync from database for revocations:', { error: String(err) });
      });
    }
  }

  /**
   * Syncs existing unexpired revocations from PostgreSQL database into fast memory cache
   */
  async syncFromDatabase(): Promise<void> {
    const db = getDatabase();
    if (!db) return;

    try {
      const rows = await db
        .select()
        .from(revocations)
        .where(eq(revocations.targetType, 'USER'));

      for (const row of rows) {
        const time = new Date(row.revokedAt).getTime();
        const current = this.userRevocations.get(row.targetId) || 0;
        if (time > current) {
          this.userRevocations.set(row.targetId, time);
        }
      }

      const tenantRows = await db
        .select()
        .from(revocations)
        .where(eq(revocations.targetType, 'TENANT'));

      for (const row of tenantRows) {
        const time = new Date(row.revokedAt).getTime();
        const current = this.tenantRevocations.get(row.targetId) || 0;
        if (time > current) {
          this.tenantRevocations.set(row.targetId, time);
        }
      }

      const branchRows = await db
        .select()
        .from(revocations)
        .where(eq(revocations.targetType, 'BRANCH'));

      for (const row of branchRows) {
        const time = new Date(row.revokedAt).getTime();
        const current = this.branchRevocations.get(row.targetId) || 0;
        if (time > current) {
          this.branchRevocations.set(row.targetId, time);
        }
      }

      const sessionRows = await db
        .select()
        .from(revocations)
        .where(eq(revocations.targetType, 'SESSION'));

      for (const row of sessionRows) {
        this.sessionRevocations.add(row.targetId);
      }

      const freezeRows = await db
        .select()
        .from(revocations)
        .where(eq(revocations.targetType, 'GLOBAL_FREEZE'));

      if (freezeRows.length > 0) {
        const latestFreeze = freezeRows.sort(
          (a, b) => new Date(b.revokedAt).getTime() - new Date(a.revokedAt).getTime()
        )[0];
        if (latestFreeze && latestFreeze.targetId === 'ENGAGED') {
          this.globalFrozen = true;
          this.globalFreezeReason = latestFreeze.reason || 'Emergency Maintenance';
        }
      }

      logger.info('Synchronized revocation store from PostgreSQL database.', {
        usersCount: this.userRevocations.size,
        tenantsCount: this.tenantRevocations.size,
        branchesCount: this.branchRevocations.size,
        sessionsCount: this.sessionRevocations.size,
        globalFrozen: this.globalFrozen
      });
    } catch (err) {
      logger.warn('Could not sync revocations from DB table (might not exist yet):', { error: String(err) });
    }
  }

  /**
   * Checks whether the token claims or calling entity have been revoked or suspended
   */
  async isRevoked(claims: VerifiedTokenClaims): Promise<RevocationCheckResult> {
    if (this.globalFrozen) {
      return {
        revoked: true,
        reason: `Access blocked: Global administrative freeze active (${this.globalFreezeReason || 'Emergency Maintenance'})`,
        code: ErrorCode.FORBIDDEN
      };
    }

    const tokenIssuedMs = (claims.iat || 0) * 1000;
    const userId = claims.sub;
    const tenantId = claims.tenantId;
    const branchId = claims.branchId;
    const sessionId = (claims as any).sessionId;

    // 1. Session ID Check
    if (sessionId && this.sessionRevocations.has(sessionId)) {
      return {
        revoked: true,
        reason: 'Session has been explicitly terminated. Please re-authenticate.',
        code: ErrorCode.UNAUTHORIZED
      };
    }

    // 2. User Revocation Check (Memory Cache - by userId or email)
    const email = claims.email;
    const userRevokedAt =
      this.userRevocations.get(userId) ??
      (email ? this.userRevocations.get(email) : undefined);
    if (userRevokedAt !== undefined && tokenIssuedMs <= userRevokedAt) {
      return {
        revoked: true,
        reason: 'User account session has been revoked or user suspended by DOC SEARCH HQ.',
        code: ErrorCode.UNAUTHORIZED
      };
    }

    // 3. Tenant Revocation Check (Memory Cache)
    if (tenantId) {
      const tenantRevokedAt = this.tenantRevocations.get(tenantId);
      if (tenantRevokedAt !== undefined && tokenIssuedMs <= tenantRevokedAt) {
        return {
          revoked: true,
          reason: 'Partner facility access has been suspended by DOC SEARCH HQ.',
          code: ErrorCode.TENANT_ACCESS_DENIED
        };
      }
    }

    // 4. Branch / Facility Revocation Check (Memory Cache)
    if (branchId) {
      const branchRevokedAt = this.branchRevocations.get(branchId);
      if (branchRevokedAt !== undefined && tokenIssuedMs <= branchRevokedAt) {
        return {
          revoked: true,
          reason: 'Facility / branch access has been suspended by DOC SEARCH HQ.',
          code: ErrorCode.BRANCH_ACCESS_DENIED
        };
      }
    }

    // 5. Authoritative Database Verification (Fallback Check if not yet in cache)
    const db = getDatabase();
    if (db) {
      try {
        if (tenantId) {
          const [t] = await db.select({ status: tenants.status }).from(tenants).where(eq(tenants.id, tenantId)).limit(1);
          if (t && (t.status === 'SUSPENDED' || t.status === 'INACTIVE')) {
            this.tenantRevocations.set(tenantId, Date.now());
            return {
              revoked: true,
              reason: `Partner organization status is ${t.status}. Access denied.`,
              code: ErrorCode.TENANT_ACCESS_DENIED
            };
          }
        }

        if (branchId && branchId.length === 36) {
          const [b] = await db.select({ status: branches.status }).from(branches).where(eq(branches.id, branchId)).limit(1);
          if (b && (b.status === 'SUSPENDED' || b.status === 'INACTIVE')) {
            this.branchRevocations.set(branchId, Date.now());
            return {
              revoked: true,
              reason: `Facility / branch status is ${b.status}. Access denied.`,
              code: ErrorCode.BRANCH_ACCESS_DENIED
            };
          }
        }

        if (userId && !userId.startsWith('partner-') && userId.length === 36) {
          const [u] = await db.select({ status: users.status }).from(users).where(eq(users.id, userId)).limit(1);
          if (u && (u.status === 'SUSPENDED' || u.status === 'INACTIVE')) {
            this.userRevocations.set(userId, Date.now());
            return {
              revoked: true,
              reason: `User account is ${u.status}. Access denied.`,
              code: ErrorCode.UNAUTHORIZED
            };
          }
        }
      } catch (err) {
        // Fallback to cache
      }
    }

    return { revoked: false };
  }

  /**
   * Immediately revokes all active tokens and sessions for a user
   */
  async revokeUser(userId: string, reason = 'User suspended by HQ', actor = 'DOC SEARCH Founder Command'): Promise<void> {
    const now = Date.now();
    this.userRevocations.set(userId, now);

    const db = getDatabase();
    if (db) {
      try {
        await db.insert(revocations).values({
          id: crypto.randomUUID(),
          targetType: 'USER',
          targetId: userId,
          reason,
          revokedBy: actor,
          revokedAt: new Date(now),
          createdAt: new Date(now)
        });

        if (userId.length === 36) {
          try {
            await db.update(users).set({ status: 'SUSPENDED', updatedAt: new Date(now) }).where(eq(users.id, userId));
            await db.update(sessions).set({ revokedAt: new Date(now) }).where(eq(sessions.userId, userId));
          } catch {}
        }
      } catch (err) {
        logger.error('Failed to persist user revocation to DB:', { userId, error: err instanceof Error ? err.message : String(err) });
      }
    }

    logger.info('User session revoked:', { userId, reason, actor });
  }

  /**
   * Immediately revokes all active tokens and sessions for an entire tenant/partner
   */
  async revokeTenant(tenantId: string, reason = 'Partner suspended by HQ', actor = 'DOC SEARCH Founder Command'): Promise<void> {
    const now = Date.now();
    this.tenantRevocations.set(tenantId, now);

    const db = getDatabase();
    if (db) {
      try {
        await db.insert(revocations).values({
          id: crypto.randomUUID(),
          targetType: 'TENANT',
          targetId: tenantId,
          reason,
          revokedBy: actor,
          revokedAt: new Date(now),
          createdAt: new Date(now)
        });

        if (tenantId.length === 36) {
          try {
            await db.update(tenants).set({ status: 'SUSPENDED', updatedAt: new Date(now) }).where(eq(tenants.id, tenantId));
            await db.update(sessions).set({ revokedAt: new Date(now) }).where(eq(sessions.tenantId, tenantId));
          } catch {}
        }
      } catch (err) {
        logger.error('Failed to persist tenant revocation to DB:', { tenantId, error: err instanceof Error ? err.message : String(err) });
      }
    }

    logger.info('Tenant/Partner revoked:', { tenantId, reason, actor });
  }

  /**
   * Immediately terminates a specific session
   */
  async revokeSession(sessionId: string, reason = 'Explicit session logout', actor = 'User'): Promise<void> {
    const now = Date.now();
    this.sessionRevocations.add(sessionId);

    const db = getDatabase();
    if (db) {
      try {
        await db.insert(revocations).values({
          id: crypto.randomUUID(),
          targetType: 'SESSION',
          targetId: sessionId,
          reason,
          revokedBy: actor,
          revokedAt: new Date(now),
          createdAt: new Date(now)
        });

        if (sessionId.length === 36) {
          try {
            await db.update(sessions).set({ revokedAt: new Date(now) }).where(eq(sessions.id, sessionId));
          } catch {}
        }
      } catch (err) {
        logger.error('Failed to persist session revocation to DB:', { sessionId, error: err instanceof Error ? err.message : String(err) });
      }
    }
  }

  /**
   * Immediately revokes all active tokens and sessions for a specific facility / branch
   */
  async revokeBranch(branchId: string, reason = 'Branch suspended by HQ', actor = 'DOC SEARCH Founder Command'): Promise<void> {
    const now = Date.now();
    this.branchRevocations.set(branchId, now);

    const db = getDatabase();
    if (db) {
      try {
        await db.insert(revocations).values({
          id: crypto.randomUUID(),
          targetType: 'BRANCH',
          targetId: branchId,
          reason,
          revokedBy: actor,
          revokedAt: new Date(now),
          createdAt: new Date(now)
        });

        if (branchId.length === 36) {
          try {
            await db.update(branches).set({ status: 'SUSPENDED', updatedAt: new Date(now) }).where(eq(branches.id, branchId));
          } catch {}
        }
      } catch (err) {
        logger.error('Failed to persist branch revocation to DB:', { branchId, error: err instanceof Error ? err.message : String(err) });
      }
    }

    logger.info('Branch revoked:', { branchId, reason, actor });
  }

  /**
   * Sets emergency global freeze
   */
  setGlobalFreeze(frozen: boolean, reason = 'Emergency kill-switch triggered by Founder'): void {
    this.globalFrozen = frozen;
    this.globalFreezeReason = reason;
    const db = getDatabase();
    if (db) {
      db.insert(revocations)
        .values({
          id: crypto.randomUUID(),
          targetType: 'GLOBAL_FREEZE',
          targetId: frozen ? 'ENGAGED' : 'RELEASED',
          reason,
          revokedBy: 'DOC SEARCH Founder Command',
          revokedAt: new Date(),
          createdAt: new Date()
        })
        .catch(() => {});
    }
    logger.warn(`GLOBAL FREEZE IS NOW ${frozen ? 'ENGAGED ⚠️' : 'RELEASED 🟢'}: ${reason}`);
  }

  isGlobalFrozen(): boolean {
    return this.globalFrozen;
  }

  /**
   * Clears in-memory revocation caches only (simulates process restart where memory resets but DB persists)
   */
  clearMemoryCache(): void {
    this.userRevocations.clear();
    this.tenantRevocations.clear();
    this.branchRevocations.clear();
    this.sessionRevocations.clear();
    this.globalFrozen = false;
    this.globalFreezeReason = '';
  }

  /**
   * Clears in-memory revocation caches and resets database state (useful for test resets)
   */
  clearAll(): void {
    this.userRevocations.clear();
    this.tenantRevocations.clear();
    this.branchRevocations.clear();
    this.sessionRevocations.clear();
    this.globalFrozen = false;
    this.globalFreezeReason = '';
    const db = getDatabase();
    if (db) {
      try {
        db.update(tenants).set({ status: 'ACTIVE' }).catch?.(() => {});
        db.update(branches).set({ status: 'ACTIVE' }).catch?.(() => {});
        db.delete(revocations).catch?.(() => {});
      } catch {}
    }
  }

  async unrevokeTenant(tenantId: string): Promise<void> {
    this.tenantRevocations.delete(tenantId);
    const db = getDatabase();
    if (db && tenantId.length === 36) {
      try {
        await db.update(tenants).set({ status: 'ACTIVE', updatedAt: new Date() }).where(eq(tenants.id, tenantId));
        await db.delete(revocations).where(and(eq(revocations.targetType, 'TENANT'), eq(revocations.targetId, tenantId)));
      } catch {}
    }
  }

  async unrevokeBranch(branchId: string): Promise<void> {
    this.branchRevocations.delete(branchId);
    const db = getDatabase();
    if (db && branchId.length === 36) {
      try {
        await db.update(branches).set({ status: 'ACTIVE', updatedAt: new Date() }).where(eq(branches.id, branchId));
        await db.delete(revocations).where(and(eq(revocations.targetType, 'BRANCH'), eq(revocations.targetId, branchId)));
      } catch {}
    }
  }

  async unrevokeUser(userIdOrEmail: string): Promise<void> {
    this.userRevocations.delete(userIdOrEmail);
    const db = getDatabase();
    if (db) {
      try {
        if (userIdOrEmail.length === 36) {
          await db.update(users).set({ status: 'ACTIVE', updatedAt: new Date() }).where(eq(users.id, userIdOrEmail));
        }
        await db.delete(revocations).where(and(eq(revocations.targetType, 'USER'), eq(revocations.targetId, userIdOrEmail)));
      } catch {}
    }
  }
}

export const sessionRevocationService = new SessionRevocationService();
