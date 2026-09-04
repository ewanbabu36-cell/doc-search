import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';

const logger = createLogger('voice-rate-limiter');

interface RateLimitBucket {
  timestamps: number[];
}

interface AbuseTracker {
  violationTimestamps: number[];
  lockedUntil: number | null;
}

export interface VoiceRateLimitConfig {
  userLimitPerMinute: number;
  tenantLimitPerMinute: number;
  violationThreshold: number;
  violationWindowMs: number;
  lockoutDurationMs: number;
}

export const DEFAULT_VOICE_RATE_LIMIT_CONFIG: VoiceRateLimitConfig = {
  userLimitPerMinute: 20,
  tenantLimitPerMinute: 150,
  violationThreshold: 5,
  violationWindowMs: 10 * 60 * 1000, // 10 minutes
  lockoutDurationMs: 15 * 60 * 1000  // 15 minutes
};

export class VoiceRateLimiter {
  private userBuckets = new Map<string, RateLimitBucket>();
  private tenantBuckets = new Map<string, RateLimitBucket>();
  private abuseTrackers = new Map<string, AbuseTracker>();
  private config: VoiceRateLimitConfig;

  constructor(config: Partial<VoiceRateLimitConfig> = {}) {
    this.config = { ...DEFAULT_VOICE_RATE_LIMIT_CONFIG, ...config };
  }

  /**
   * Evaluates if a voice request is allowed under rate limits and abuse lockout policies.
   */
  checkLimit(userId: string, tenantId: string): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    // Check abuse lockout first
    const abuseKey = `${tenantId}:${userId}`;
    const abuseTracker = this.abuseTrackers.get(abuseKey);
    if (abuseTracker?.lockedUntil && abuseTracker.lockedUntil > now) {
      const retryAfterSeconds = Math.ceil((abuseTracker.lockedUntil - now) / 1000);
      logger.warn('Voice request blocked by security abuse lockout', {
        userId,
        tenantId,
        retryAfterSeconds
      });
      throw new AppError({
        message: `Voice access temporarily suspended due to repeated security policy violations. Retry in ${retryAfterSeconds}s.`,
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        statusCode: 429
      });
    }

    // Check user sliding-window rate limit
    let userBucket = this.userBuckets.get(userId);
    if (!userBucket) {
      userBucket = { timestamps: [] };
      this.userBuckets.set(userId, userBucket);
    }
    userBucket.timestamps = userBucket.timestamps.filter((ts) => ts > oneMinuteAgo);

    if (userBucket.timestamps.length >= this.config.userLimitPerMinute) {
      const oldest = userBucket.timestamps[0] ?? now;
      const retryAfterSeconds = Math.max(1, Math.ceil((oldest + 60 * 1000 - now) / 1000));
      logger.warn('Voice user rate limit exceeded', { userId, retryAfterSeconds });
      throw new AppError({
        message: `Voice rate limit exceeded (${this.config.userLimitPerMinute} req/min). Please wait ${retryAfterSeconds}s.`,
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        statusCode: 429
      });
    }

    // Check tenant sliding-window rate limit
    let tenantBucket = this.tenantBuckets.get(tenantId);
    if (!tenantBucket) {
      tenantBucket = { timestamps: [] };
      this.tenantBuckets.set(tenantId, tenantBucket);
    }
    tenantBucket.timestamps = tenantBucket.timestamps.filter((ts) => ts > oneMinuteAgo);

    if (tenantBucket.timestamps.length >= this.config.tenantLimitPerMinute) {
      const oldest = tenantBucket.timestamps[0] ?? now;
      const retryAfterSeconds = Math.max(1, Math.ceil((oldest + 60 * 1000 - now) / 1000));
      logger.warn('Voice tenant rate limit exceeded', { tenantId, retryAfterSeconds });
      throw new AppError({
        message: `Organization voice rate limit exceeded (${this.config.tenantLimitPerMinute} req/min). Please wait ${retryAfterSeconds}s.`,
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        statusCode: 429
      });
    }

    // Consume 1 credit for user and tenant
    userBucket.timestamps.push(now);
    tenantBucket.timestamps.push(now);
  }

  /**
   * Records a security violation (prompt injection, cross-tenant attempt, unauthorized tool invocation).
   * Multiple violations trigger temporary abuse lockout.
   */
  recordViolation(userId: string, tenantId: string): void {
    const now = Date.now();
    const abuseKey = `${tenantId}:${userId}`;
    let tracker = this.abuseTrackers.get(abuseKey);

    if (!tracker) {
      tracker = { violationTimestamps: [], lockedUntil: null };
      this.abuseTrackers.set(abuseKey, tracker);
    }

    const windowStart = now - this.config.violationWindowMs;
    tracker.violationTimestamps = tracker.violationTimestamps.filter((ts) => ts > windowStart);
    tracker.violationTimestamps.push(now);

    if (tracker.violationTimestamps.length >= this.config.violationThreshold) {
      tracker.lockedUntil = now + this.config.lockoutDurationMs;
      logger.error('Abuse lockout activated for voice client', {
        userId,
        tenantId,
        violations: tracker.violationTimestamps.length,
        lockoutDurationSeconds: this.config.lockoutDurationMs / 1000
      });
    }
  }

  /**
   * Resets all internal trackers (for test suite isolation).
   */
  reset(): void {
    this.userBuckets.clear();
    this.tenantBuckets.clear();
    this.abuseTrackers.clear();
  }
}

export const voiceRateLimiter = new VoiceRateLimiter();
