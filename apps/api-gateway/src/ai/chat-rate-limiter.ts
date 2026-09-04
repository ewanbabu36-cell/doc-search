import { createLogger } from '@docsearch/shared-core';

const logger = createLogger('chat-rate-limiter');

export interface RateLimitResult {
  allowed: boolean;
  reason?: string | undefined;
  retryAfterSeconds?: number | undefined;
  remaining?: number | undefined;
  limit?: number | undefined;
}

interface WindowRecord {
  timestamps: number[];
  securityViolations: number[];
  lockedUntil?: number | undefined;
}

export class ChatRateLimiter {
  private userWindows = new Map<string, WindowRecord>();
  private tenantWindows = new Map<string, WindowRecord>();

  private readonly userWindowMs = 60 * 1000; // 1 minute
  private readonly userMaxRequests = 30;

  private readonly tenantWindowMs = 60 * 1000; // 1 minute
  private readonly tenantMaxRequests = 300;

  private readonly securityViolationThreshold = 5;
  private readonly securityViolationWindowMs = 5 * 60 * 1000; // 5 minutes
  private readonly lockoutDurationMs = 15 * 60 * 1000; // 15 minutes

  /**
   * Check whether a chat execution request is permitted by rate limits.
   */
  checkLimit(tenantId: string, userId: string): RateLimitResult {
    const now = Date.now();

    // 1. Check User Lockout
    const userKey = `${tenantId}:${userId}`;
    let userRecord = this.userWindows.get(userKey);
    if (!userRecord) {
      userRecord = { timestamps: [], securityViolations: [] };
      this.userWindows.set(userKey, userRecord);
    }

    if (userRecord.lockedUntil && now < userRecord.lockedUntil) {
      const retryAfter = Math.ceil((userRecord.lockedUntil - now) / 1000);
      logger.warn('User is locked out due to repeated security violations', { tenantId, userId, retryAfter });
      return {
        allowed: false,
        reason: 'USER_LOCKED_OUT_SECURITY_VIOLATIONS',
        retryAfterSeconds: retryAfter,
        limit: this.userMaxRequests,
        remaining: 0
      };
    }

    // 2. Clean expired user timestamps
    userRecord.timestamps = userRecord.timestamps.filter((ts) => now - ts < this.userWindowMs);
    if (userRecord.timestamps.length >= this.userMaxRequests) {
      const oldest = userRecord.timestamps[0] ?? now;
      const retryAfter = Math.ceil((this.userWindowMs - (now - oldest)) / 1000);
      logger.warn('User rate limit exceeded', { tenantId, userId, retryAfter });
      return {
        allowed: false,
        reason: 'USER_RATE_LIMIT_EXCEEDED',
        retryAfterSeconds: Math.max(1, retryAfter),
        limit: this.userMaxRequests,
        remaining: 0
      };
    }

    // 3. Check Tenant Limits
    let tenantRecord = this.tenantWindows.get(tenantId);
    if (!tenantRecord) {
      tenantRecord = { timestamps: [], securityViolations: [] };
      this.tenantWindows.set(tenantId, tenantRecord);
    }

    tenantRecord.timestamps = tenantRecord.timestamps.filter((ts) => now - ts < this.tenantWindowMs);
    if (tenantRecord.timestamps.length >= this.tenantMaxRequests) {
      const oldest = tenantRecord.timestamps[0] ?? now;
      const retryAfter = Math.ceil((this.tenantWindowMs - (now - oldest)) / 1000);
      logger.warn('Tenant rate limit exceeded', { tenantId, retryAfter });
      return {
        allowed: false,
        reason: 'TENANT_RATE_LIMIT_EXCEEDED',
        retryAfterSeconds: Math.max(1, retryAfter),
        limit: this.tenantMaxRequests,
        remaining: 0
      };
    }

    // Record request timestamp
    userRecord.timestamps.push(now);
    tenantRecord.timestamps.push(now);

    return {
      allowed: true,
      remaining: this.userMaxRequests - userRecord.timestamps.length,
      limit: this.userMaxRequests
    };
  }

  /**
   * Record a security violation (e.g. prompt injection, unauthorized cross-tenant attempt).
   * 5 violations within 5 minutes triggers a 15-minute lockout.
   */
  recordSecurityViolation(tenantId: string, userId: string): void {
    const now = Date.now();
    const userKey = `${tenantId}:${userId}`;
    let userRecord = this.userWindows.get(userKey);
    if (!userRecord) {
      userRecord = { timestamps: [], securityViolations: [] };
      this.userWindows.set(userKey, userRecord);
    }

    userRecord.securityViolations = userRecord.securityViolations.filter(
      (ts) => now - ts < this.securityViolationWindowMs
    );
    userRecord.securityViolations.push(now);

    if (userRecord.securityViolations.length >= this.securityViolationThreshold) {
      userRecord.lockedUntil = now + this.lockoutDurationMs;
      logger.error('Security abuse threshold reached: locking user out', {
        tenantId,
        userId,
        lockedUntil: new Date(userRecord.lockedUntil).toISOString()
      });
    }
  }

  reset(): void {
    this.userWindows.clear();
    this.tenantWindows.clear();
  }
}

export const chatRateLimiter = new ChatRateLimiter();
