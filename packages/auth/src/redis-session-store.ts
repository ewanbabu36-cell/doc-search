import { Redis } from 'ioredis';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import type { SessionStore, StoredSession } from './session-service.js';

const logger = createLogger('redis-session-store');

export interface RedisSessionStoreOptions {
  keyPrefix?: string;
  defaultTtlSeconds?: number;
}

export class RedisSessionStore implements SessionStore {
  private client: Redis;
  private prefix: string;
  private defaultTtlSeconds: number;

  constructor(redisOrUrl: Redis | string, options: RedisSessionStoreOptions = {}) {
    this.prefix = options.keyPrefix ?? 'docsearch:session:';
    this.defaultTtlSeconds = options.defaultTtlSeconds ?? 30 * 24 * 3600; // 30 days

    if (typeof redisOrUrl === 'string') {
      this.client = new Redis(redisOrUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 5) return null;
          return Math.min(times * 100, 2000);
        }
      });
    } else {
      this.client = redisOrUrl;
    }

    this.client.on('error', (err) => {
      logger.error('Redis connection error in session store', err);
    });
  }

  private idKey(id: string): string {
    return `${this.prefix}id:${id}`;
  }

  private tokenKey(hashedToken: string): string {
    return `${this.prefix}token:${hashedToken}`;
  }

  private familyKey(familyId: string): string {
    return `${this.prefix}family:${familyId}`;
  }

  private serialize(session: StoredSession): string {
    return JSON.stringify({
      ...session,
      expiresAt: session.expiresAt.toISOString(),
      revokedAt: session.revokedAt ? session.revokedAt.toISOString() : null,
      lastUsedAt: session.lastUsedAt.toISOString(),
      createdAt: session.createdAt.toISOString()
    });
  }

  private deserialize(raw: string): StoredSession {
    const data = JSON.parse(raw);
    return {
      ...data,
      expiresAt: new Date(data.expiresAt),
      revokedAt: data.revokedAt ? new Date(data.revokedAt) : null,
      lastUsedAt: new Date(data.lastUsedAt),
      createdAt: new Date(data.createdAt)
    };
  }

  private getTtlSeconds(session: StoredSession): number {
    const remainingMs = session.expiresAt.getTime() - Date.now();
    const calculated = Math.ceil(remainingMs / 1000);
    return Math.max(1, isNaN(calculated) || calculated <= 0 ? this.defaultTtlSeconds : calculated);
  }

  async saveSession(session: StoredSession): Promise<void> {
    try {
      const ttl = this.getTtlSeconds(session);
      const serialized = this.serialize(session);

      const pipeline = this.client.pipeline();
      pipeline.set(this.idKey(session.id), serialized, 'EX', ttl);
      pipeline.set(this.tokenKey(session.refreshTokenHash), session.id, 'EX', ttl);
      pipeline.sadd(this.familyKey(session.tokenFamilyId), session.id);
      pipeline.expire(this.familyKey(session.tokenFamilyId), ttl);

      const results = await pipeline.exec();
      if (results) {
        for (const [err] of results) {
          if (err) throw err;
        }
      }
    } catch (err) {
      logger.error('Failed to save session to Redis', err);
      throw new AppError({
        message: 'Session persistence failed. Distributed session store unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async findSessionByTokenHash(hashedToken: string): Promise<StoredSession | null> {
    try {
      const sessionId = await this.client.get(this.tokenKey(hashedToken));
      if (!sessionId) return null;
      return await this.findSessionById(sessionId);
    } catch (err) {
      logger.error('Failed to lookup session by token hash in Redis', err);
      throw new AppError({
        message: 'Session verification failed. Distributed session store unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async findSessionById(sessionId: string): Promise<StoredSession | null> {
    try {
      const raw = await this.client.get(this.idKey(sessionId));
      if (!raw) return null;
      return this.deserialize(raw);
    } catch (err) {
      logger.error('Failed to lookup session by id in Redis', err);
      throw new AppError({
        message: 'Session lookup failed. Distributed session store unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async updateSession(session: StoredSession): Promise<void> {
    try {
      const ttl = this.getTtlSeconds(session);
      const serialized = this.serialize(session);

      const pipeline = this.client.pipeline();
      pipeline.set(this.idKey(session.id), serialized, 'EX', ttl);
      pipeline.set(this.tokenKey(session.refreshTokenHash), session.id, 'EX', ttl);
      pipeline.sadd(this.familyKey(session.tokenFamilyId), session.id);
      pipeline.expire(this.familyKey(session.tokenFamilyId), ttl);

      const results = await pipeline.exec();
      if (results) {
        for (const [err] of results) {
          if (err) throw err;
        }
      }
    } catch (err) {
      logger.error('Failed to update session in Redis', err);
      throw new AppError({
        message: 'Session update failed. Distributed session store unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async revokeSessionFamily(tokenFamilyId: string, reason: string): Promise<void> {
    try {
      const sessionIds = await this.client.smembers(this.familyKey(tokenFamilyId));
      const now = new Date();

      for (const id of sessionIds) {
        const session = await this.findSessionById(id);
        if (session && !session.revokedAt) {
          session.revokedAt = now;
          await this.updateSession(session);
        }
      }
      logger.info(`Revoked session family ${tokenFamilyId}: ${reason}`);
    } catch (err) {
      logger.error('Failed to revoke session family in Redis', err);
      throw new AppError({
        message: 'Session revocation failed. Distributed session store unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async revokeSession(sessionId: string, reason: string): Promise<void> {
    try {
      const session = await this.findSessionById(sessionId);
      if (session) {
        session.revokedAt = new Date();
        await this.updateSession(session);
        logger.info(`Revoked session ${sessionId}: ${reason}`);
      }
    } catch (err) {
      logger.error('Failed to revoke session in Redis', err);
      throw new AppError({
        message: 'Session revocation failed. Distributed session store unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async close(): Promise<void> {
    await this.client.quit();
  }
}
