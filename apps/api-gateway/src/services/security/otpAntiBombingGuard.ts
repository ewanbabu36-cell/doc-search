import crypto from 'node:crypto';
import { getDatabase, platformSettings, eq } from '@docsearch/database';
import { createLogger, distributedCache } from '@docsearch/shared-core';

const logger = createLogger('otp-anti-bombing-guard');

/**
 * DOC SEARCH SMS & OTP Anti-Bombing / Brute-Force Defense Guard
 * Prevents automated scripts and hackers from flooding SMS gateways,
 * incurring huge telco bills, or conducting phone number enumeration attacks.
 */

interface OtpRateRecord {
  lastRequestedAt: number;
  attemptsInWindow: number;
  blockedUntil: number;
}

interface StoredOtpRecord {
  hash: string;
  expiresAt: number;
  attempts: number;
}

class OtpAntiBombingGuard {
  // In-memory buckets (can be backed by Redis in distributed cluster)
  private phoneBuckets = new Map<string, OtpRateRecord>();
  private ipBuckets = new Map<string, { count: number; windowStart: number }>();
  private otpStore = new Map<string, StoredOtpRecord>();

  // Configuration constants
  private readonly COOLDOWN_SECONDS = 60; // Minimum 60s between OTP requests
  private readonly MAX_PER_PHONE_HOUR = 5; // Max 5 OTPs per phone in 1 hour
  private readonly HOUR_WINDOW_MS = 60 * 60 * 1000;
  private readonly MAX_PER_IP_MINUTE = 5; // Max 5 requests per IP per minute

  /**
   * Validates whether an OTP request is permitted for the given phone & IP.
   * Throws an error or returns a rejection reason if rate limit or cooldown is violated.
   */
  public checkOtpAllowed(
    phone: string,
    clientIp: string
  ): { allowed: boolean; retryAfterSeconds?: number; reason?: string } {
    const now = Date.now();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    // 1. Check IP rate limit (Anti-Bot Spray Defense)
    const ipRecord = this.ipBuckets.get(clientIp) || { count: 0, windowStart: now };
    if (now - ipRecord.windowStart > 60000) {
      ipRecord.count = 0;
      ipRecord.windowStart = now;
    }
    if (ipRecord.count >= this.MAX_PER_IP_MINUTE) {
      const waitSec = Math.ceil((60000 - (now - ipRecord.windowStart)) / 1000);
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, waitSec),
        reason: 'Too many OTP requests from this network. Bot protection active. Please try again later.'
      };
    }

    // 2. Check Phone specific bucket
    const phoneRecord = this.phoneBuckets.get(cleanPhone);
    if (phoneRecord) {
      // Check hard block
      if (phoneRecord.blockedUntil > now) {
        const remainingSec = Math.ceil((phoneRecord.blockedUntil - now) / 1000);
        return {
          allowed: false,
          retryAfterSeconds: remainingSec,
          reason: `Too many attempts for this number. Temporarily blocked for ${remainingSec} seconds.`
        };
      }

      // Check 60-second cooldown
      const elapsedSinceLast = Math.floor((now - phoneRecord.lastRequestedAt) / 1000);
      if (elapsedSinceLast < this.COOLDOWN_SECONDS) {
        const waitSec = this.COOLDOWN_SECONDS - elapsedSinceLast;
        return {
          allowed: false,
          retryAfterSeconds: waitSec,
          reason: `Please wait ${waitSec} seconds before requesting a new OTP.`
        };
      }

      // Check hourly quota
      if (now - phoneRecord.lastRequestedAt < this.HOUR_WINDOW_MS) {
        if (phoneRecord.attemptsInWindow >= this.MAX_PER_PHONE_HOUR) {
          phoneRecord.blockedUntil = now + 15 * 60 * 1000; // 15-minute lockout
          return {
            allowed: false,
            retryAfterSeconds: 900,
            reason: 'Hourly OTP limit reached for this number. Please wait 15 minutes.'
          };
        }
      } else {
        // Reset window
        phoneRecord.attemptsInWindow = 0;
      }
    }

    return { allowed: true };
  }

  /**
   * Records that an OTP was successfully dispatched.
   */
  public recordOtpDispatched(phone: string, clientIp: string): void {
    const now = Date.now();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    // Update IP bucket
    const ipRecord = this.ipBuckets.get(clientIp) || { count: 0, windowStart: now };
    ipRecord.count += 1;
    this.ipBuckets.set(clientIp, ipRecord);

    // Update Phone bucket
    const phoneRecord = this.phoneBuckets.get(cleanPhone) || {
      lastRequestedAt: 0,
      attemptsInWindow: 0,
      blockedUntil: 0
    };
    phoneRecord.lastRequestedAt = now;
    phoneRecord.attemptsInWindow += 1;
    this.phoneBuckets.set(cleanPhone, phoneRecord);
    void this.persistState(`OTP_BUCKET_PHONE:${cleanPhone}`, phoneRecord, 3600);
    void this.persistState(`OTP_BUCKET_IP:${clientIp}`, this.ipBuckets.get(clientIp), 120);
  }

  private async readState<T>(key: string): Promise<T | null> {
    try {
      const cached = await distributedCache.get<T>(key);
      if (cached !== null) return cached;
    } catch (err) {
      logger.warn('distributedCache read fallback for OTP state', { key, error: String(err) });
    }
    try {
      const db = getDatabase();
      if (!db) return null;
      const [row] = await db.select().from(platformSettings).where(eq(platformSettings.key, key)).limit(1);
      if (row?.value) {
        const val = row.value as T;
        void distributedCache.set(key, val, { ttlSeconds: 300 }).catch(() => {});
        return val;
      }
    } catch (err) {
      logger.warn('PostgreSQL OTP state lookup failed, using in-memory fallback', { key, error: String(err) });
    }
    return null;
  }

  private async persistState(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (value === undefined) return;
    try {
      await distributedCache.set(key, value, { ttlSeconds });
    } catch (err) {
      logger.warn('distributedCache write fallback for OTP state', { key, error: String(err) });
    }
    try {
      const db = getDatabase();
      if (!db) return;
      await db
        .insert(platformSettings)
        .values({
          key,
          value: value as Record<string, unknown>,
          updatedBy: 'otp-anti-bombing-guard'
        })
        .onConflictDoUpdate({
          target: platformSettings.key,
          set: {
            value: value as Record<string, unknown>,
            updatedBy: 'otp-anti-bombing-guard',
            updatedAt: new Date()
          }
        });
    } catch (err) {
      logger.warn('PostgreSQL OTP state persist failed', { key, error: String(err) });
    }
  }

  private async deleteState(key: string): Promise<void> {
    try {
      await distributedCache.del(key);
    } catch (err) {
      logger.warn('distributedCache delete failed for OTP state', { key, error: String(err) });
    }
    try {
      const db = getDatabase();
      if (!db) return;
      await db.delete(platformSettings).where(eq(platformSettings.key, key));
    } catch (err) {
      logger.warn('PostgreSQL OTP state delete failed', { key, error: String(err) });
    }
  }

  public async checkOtpAllowedAsync(
    phone: string,
    clientIp: string
  ): Promise<{ allowed: boolean; retryAfterSeconds?: number; reason?: string }> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const remoteIp = await this.readState<{ count: number; windowStart: number }>(`OTP_BUCKET_IP:${clientIp}`);
    if (remoteIp && !this.ipBuckets.has(clientIp)) {
      this.ipBuckets.set(clientIp, remoteIp);
    }
    const remotePhone = await this.readState<OtpRateRecord>(`OTP_BUCKET_PHONE:${cleanPhone}`);
    if (remotePhone && !this.phoneBuckets.has(cleanPhone)) {
      this.phoneBuckets.set(cleanPhone, remotePhone);
    }
    return this.checkOtpAllowed(phone, clientIp);
  }

  public async recordOtpDispatchedAsync(phone: string, clientIp: string): Promise<void> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    await this.checkOtpAllowedAsync(phone, clientIp);
    this.recordOtpDispatched(phone, clientIp);
    await Promise.all([
      this.persistState(`OTP_BUCKET_PHONE:${cleanPhone}`, this.phoneBuckets.get(cleanPhone), 3600),
      this.persistState(`OTP_BUCKET_IP:${clientIp}`, this.ipBuckets.get(clientIp), 120)
    ]);
  }

  public async generateAndStoreOtpAsync(phone: string): Promise<string> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const otp = this.generateAndStoreOtp(phone);
    await this.persistState(`OTP_STORE:${cleanPhone}`, this.otpStore.get(cleanPhone), 300);
    return otp;
  }

  public async verifyStoredOtpAsync(phone: string, inputOtp: string): Promise<boolean> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!this.otpStore.has(cleanPhone)) {
      const remoteOtp = await this.readState<StoredOtpRecord>(`OTP_STORE:${cleanPhone}`);
      if (remoteOtp) {
        this.otpStore.set(cleanPhone, remoteOtp);
      }
    }
    const verified = this.verifyStoredOtp(phone, inputOtp);
    if (verified || !this.otpStore.has(cleanPhone)) {
      await this.deleteState(`OTP_STORE:${cleanPhone}`);
    } else {
      await this.persistState(`OTP_STORE:${cleanPhone}`, this.otpStore.get(cleanPhone), 300);
    }
    return verified;
  }

  /**
   * Generates a cryptographically random 6-digit OTP, hashes it with SHA-256,
   * and stores it with a 5-minute expiry window. (AUTH-001)
   */
  public generateAndStoreOtp(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const otp = crypto.randomInt(100000, 1000000).toString();
    const hash = crypto.createHash('sha256').update(otp).digest('hex');
    const record: StoredOtpRecord = {
      hash,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minute TTL
      attempts: 0
    };
    this.otpStore.set(cleanPhone, record);
    void this.persistState(`OTP_STORE:${cleanPhone}`, record, 300);
    return otp;
  }

  /**
   * Verifies an entered OTP against the stored SHA-256 hash.
   * Enforces 3 maximum attempts per OTP and invalidates on success.
   */
  public verifyStoredOtp(phone: string, inputOtp: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const record = this.otpStore.get(cleanPhone);
    if (!record) return false;
    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(cleanPhone);
      return false;
    }
    record.attempts += 1;
    if (record.attempts > 3) {
      this.otpStore.delete(cleanPhone);
      return false;
    }
    const inputHash = crypto.createHash('sha256').update(inputOtp).digest('hex');
    if (crypto.timingSafeEqual(Buffer.from(inputHash, 'utf8'), Buffer.from(record.hash, 'utf8'))) {
      this.otpStore.delete(cleanPhone);
      return true;
    }
    return false;
  }

  /**
   * Clean up old entries periodically to prevent memory leaks.
   */
  public cleanupStaleEntries(): void {
    const now = Date.now();
    for (const [phone, rec] of this.phoneBuckets.entries()) {
      if (now - rec.lastRequestedAt > this.HOUR_WINDOW_MS && rec.blockedUntil < now) {
        this.phoneBuckets.delete(phone);
      }
    }
    for (const [ip, rec] of this.ipBuckets.entries()) {
      if (now - rec.windowStart > 120000) {
        this.ipBuckets.delete(ip);
      }
    }
  }
}

export const otpAntiBombingGuard = new OtpAntiBombingGuard();
