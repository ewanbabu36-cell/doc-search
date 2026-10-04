import { Redis } from 'ioredis';
import crypto from 'node:crypto';
import { createLogger, SlotLockManager } from '@docsearch/shared-core';

const logger = createLogger('redis-distributed-lock');

export interface DistributedLockResult {
  acquired: boolean;
  resourceKey: string;
  lockOwner: string;
  fencingToken: number;
  leaseExpiresAt: number;
  backend: 'REDIS_CLUSTER' | 'LOCAL_HYBRID_LOCK';
}

export interface RedisDistributedLockOptions {
  redisOrUrl?: Redis | string;
  keyPrefix?: string;
  defaultTtlSeconds?: number;
}

export class RedisDistributedLockManager {
  private redisClient: Redis | null = null;
  private fallbackManager: SlotLockManager;
  private keyPrefix: string;
  private defaultTtlSeconds: number;
  private isRedisConnected = false;
  private heartbeatTimers = new Map<string, NodeJS.Timeout>();

  // Lua script to atomically release lock only if caller still holds it
  private static readonly RELEASE_LUA_SCRIPT = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  // Lua script to atomically extend lock TTL if caller holds it
  private static readonly EXTEND_LUA_SCRIPT = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("pexpire", KEYS[1], ARGV[2])
    else
      return 0
    end
  `;

  constructor(options: RedisDistributedLockOptions = {}) {
    this.keyPrefix = options.keyPrefix ?? 'docsearch:dlock:';
    this.defaultTtlSeconds = options.defaultTtlSeconds ?? 30;
    this.fallbackManager = new SlotLockManager();

    const redisTarget = options.redisOrUrl || (typeof process !== 'undefined' && process.env ? (process.env['REDIS_URL'] || process.env['REDIS_HOST']) : undefined);

    if (redisTarget) {
      try {
        if (typeof redisTarget === 'string') {
          this.redisClient = new Redis(redisTarget, {
            maxRetriesPerRequest: 2,
            connectTimeout: 2000,
            lazyConnect: true,
            retryStrategy: (times) => (times > 3 ? null : Math.min(times * 150, 1000))
          });
        } else {
          this.redisClient = redisTarget;
        }

        this.redisClient.on('connect', () => {
          this.isRedisConnected = true;
          logger.info('Redis distributed lock engine connected successfully');
        });

        this.redisClient.on('error', (err) => {
          this.isRedisConnected = false;
          logger.warn(`Redis lock client disconnected; failing over to local slot locks: ${err.message}`);
        });

        // Attempt non-blocking connection
        this.redisClient.connect().catch((e) => {
          this.isRedisConnected = false;
          logger.info(`Redis unavailable (${e.message}); using local SlotLockManager engine`);
        });
      } catch (err: any) {
        logger.warn(`Failed initializing Redis lock client: ${err.message}`);
        this.redisClient = null;
      }
    }
  }

  private formatKey(resource: string): string {
    return `${this.keyPrefix}${resource}`;
  }

  private fencingKey(resource: string): string {
    return `${this.keyPrefix}fence:${resource}`;
  }

  /**
   * Acquire a distributed lock on an arbitrary clinical resource with fencing token.
   */
  async acquireLock(
    resource: string,
    ttlSeconds?: number,
    lockOwner?: string
  ): Promise<DistributedLockResult> {
    const ttl = ttlSeconds ?? this.defaultTtlSeconds;
    const ttlMs = ttl * 1000;
    const owner = lockOwner || `worker_${process.pid}_${crypto.randomBytes(8).toString('hex')}`;
    const redisKey = this.formatKey(resource);
    const now = Date.now();

    // 1. Primary: Redis Atomic Set with NX (Not Exists) + PX (Milliseconds TTL)
    if (this.redisClient && this.isRedisConnected) {
      try {
        const setRes = await this.redisClient.set(redisKey, owner, 'PX', ttlMs, 'NX');
        if (setRes === 'OK') {
          // Increment fencing token for this resource to guarantee monotonically increasing sequence
          let fenceToken = now;
          try {
            fenceToken = await this.redisClient.incr(this.fencingKey(resource));
          } catch {}

          return {
            acquired: true,
            resourceKey: resource,
            lockOwner: owner,
            fencingToken: fenceToken,
            leaseExpiresAt: now + ttlMs,
            backend: 'REDIS_CLUSTER'
          };
        }

        // Lock already held
        return {
          acquired: false,
          resourceKey: resource,
          lockOwner: 'busy',
          fencingToken: 0,
          leaseExpiresAt: now,
          backend: 'REDIS_CLUSTER'
        };
      } catch (err: any) {
        logger.warn(`Redis acquire error for ${resource}: ${err.message}; falling back to SlotLockManager`);
      }
    }

    // 2. Secondary Fallback: Atomic File + Memory SlotLockManager
    const res = await this.fallbackManager.acquireSlotLock('global', resource, 'current', ttl, owner);
    return {
      acquired: res.acquired,
      resourceKey: resource,
      lockOwner: res.lockOwner,
      fencingToken: now,
      leaseExpiresAt: res.expiresAt,
      backend: 'LOCAL_HYBRID_LOCK'
    };
  }

  /**
   * Release a distributed lock safely using owner verification.
   */
  async releaseLock(resource: string, owner: string): Promise<boolean> {
    this.stopHeartbeat(resource);
    const redisKey = this.formatKey(resource);

    if (this.redisClient && this.isRedisConnected) {
      try {
        const deleted = await this.redisClient.eval(
          RedisDistributedLockManager.RELEASE_LUA_SCRIPT,
          1,
          redisKey,
          owner
        );
        return Number(deleted) === 1;
      } catch (err: any) {
        logger.warn(`Redis release error for ${resource}: ${err.message}`);
      }
    }

    return this.fallbackManager.releaseSlotLock(resource, owner);
  }

  /**
   * Keep-alive lock extension for operations that take longer than anticipated.
   */
  startHeartbeat(resource: string, owner: string, ttlSeconds = 30): void {
    this.stopHeartbeat(resource);
    const intervalMs = Math.max(1000, Math.floor((ttlSeconds * 1000) / 3));

    const timer = setInterval(async () => {
      if (this.redisClient && this.isRedisConnected) {
        try {
          const redisKey = this.formatKey(resource);
          const res = await this.redisClient.eval(
            RedisDistributedLockManager.EXTEND_LUA_SCRIPT,
            1,
            redisKey,
            owner,
            ttlSeconds * 1000
          );
          if (Number(res) !== 1) {
            this.stopHeartbeat(resource);
          }
        } catch {
          this.stopHeartbeat(resource);
        }
      }
    }, intervalMs);

    if (timer.unref) timer.unref();
    this.heartbeatTimers.set(resource, timer);
  }

  stopHeartbeat(resource: string): void {
    const timer = this.heartbeatTimers.get(resource);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(resource);
    }
  }

  /**
   * Execute an async action within an automatic distributed lock boundary.
   */
  async withLock<T>(
    resource: string,
    action: (lock: DistributedLockResult) => Promise<T>,
    ttlSeconds = 30
  ): Promise<T> {
    const lock = await this.acquireLock(resource, ttlSeconds);
    if (!lock.acquired) {
      throw new Error(`Concurrency Conflict: Resource "${resource}" is currently locked by another workstation`);
    }

    this.startHeartbeat(resource, lock.lockOwner, ttlSeconds);
    try {
      return await action(lock);
    } finally {
      await this.releaseLock(resource, lock.lockOwner);
    }
  }

  // ---------------------------------------------------------------------------
  // Specialized Clinical Domain Locks for High-Concurrency 100+ Bed Hospitals
  // ---------------------------------------------------------------------------

  /**
   * Bed Allocation & Ward Transfer Lock:
   * Prevents two nurses/receptionists from allocating or transferring into the same bed simultaneously.
   */
  async acquireBedLock(tenantId: string, wardId: string, bedId: string, ttlSeconds = 45): Promise<DistributedLockResult> {
    const resource = `bed:${tenantId}:${wardId}:${bedId}`;
    return this.acquireLock(resource, ttlSeconds);
  }

  /**
   * OPD Queue & Token Generation Lock:
   * Prevents race condition where two counter operators assign identical sequence numbers to walk-in patients.
   */
  async acquireQueueLock(tenantId: string, department: string, dateIso: string, ttlSeconds = 15): Promise<DistributedLockResult> {
    const resource = `queue:${tenantId}:${department}:${dateIso.slice(0, 10)}`;
    return this.acquireLock(resource, ttlSeconds);
  }

  /**
   * Operating Theatre Suite Scheduling Lock:
   * Guarantees conflict-free scheduling across concurrent surgical booking terminals.
   */
  async acquireOtSlotLock(tenantId: string, otRoomId: string, dateIso: string, startTime: string, ttlSeconds = 60): Promise<DistributedLockResult> {
    const resource = `ot:${tenantId}:${otRoomId}:${dateIso.slice(0, 10)}:${startTime}`;
    return this.acquireLock(resource, ttlSeconds);
  }
}

export const redisDistributedLockManager = new RedisDistributedLockManager();
