/**
 * DOC SEARCH — Horizontal Real-Time Pub/Sub Socket Gateway
 * 
 * Enables seamless cross-worker and multi-instance event synchronization using Redis Pub/Sub.
 * Solves multi-counter OPD queue desync, bed allocation race updates, and instant emergency alerts.
 * Operates in multi-core cluster mode with zero-crash in-memory EventEmitter fallback when Redis is absent.
 */

import { Redis } from 'ioredis';
import { EventEmitter } from 'node:events';
import { createLogger } from '@docsearch/shared-core';

const logger = createLogger('horizontal-socket-gateway');

export interface ClusterEvent<T = any> {
  eventType: string;
  tenantId: string;
  payload: T;
  timestamp: string;
  originWorkerPid: number;
}

export type EventCallback<T = any> = (event: ClusterEvent<T>) => void;

export class HorizontalSocketGateway {
  private pubClient: Redis | null = null;
  private subClient: Redis | null = null;
  private isPubConnected = false;
  private isSubConnected = false;
  private localEmitter = new EventEmitter();
  private messagesDispatched = 0;
  private activeListenersCount = 0;

  constructor() {
    this.localEmitter.setMaxListeners(500);
    this.initPubSub();
  }

  private initPubSub(): void {
    const redisUrl = process.env['REDIS_URL'] || 'redis://127.0.0.1:6379';
    const enableRedis = process.env['ENABLE_REDIS'] !== 'false';

    if (!enableRedis) {
      logger.info('[PUBSUB] Redis disabled via ENABLE_REDIS=false. Using Local EventEmitter Gateway.');
      return;
    }

    try {
      const options = {
        lazyConnect: true,
        connectTimeout: 1500,
        maxRetriesPerRequest: 1,
        retryStrategy: (times: number) => (times > 3 ? null : Math.min(times * 500, 2000))
      };

      this.pubClient = new Redis(redisUrl, options);
      this.subClient = new Redis(redisUrl, options);

      this.pubClient.on('connect', () => {
        this.isPubConnected = true;
        logger.info('[PUBSUB] Redis Publisher connected on worker PID ' + process.pid);
      });
      this.pubClient.on('error', () => {
        this.isPubConnected = false;
      });

      this.subClient.on('connect', async () => {
        this.isSubConnected = true;
        logger.info('[PUBSUB] Redis Subscriber connected on worker PID ' + process.pid);
        try {
          // Subscribe to all docsearch event channels
          await this.subClient!.psubscribe('docsearch:events:*');
          logger.info('[PUBSUB] Pattern subscribed to docsearch:events:*');
        } catch (err: any) {
          logger.warn('[PUBSUB] Subscription error: ' + err?.message);
        }
      });

      this.subClient.on('pmessage', (_pattern, channel, message) => {
        try {
          const parsed = JSON.parse(message) as ClusterEvent;
          this.dispatchLocal(parsed);
        } catch (err: any) {
          logger.warn('[PUBSUB] Failed to decode incoming cluster event on ' + channel + ': ' + err?.message);
        }
      });

      this.subClient.on('error', () => {
        this.isSubConnected = false;
      });

      // Async connection attempt
      this.pubClient.connect().catch(() => {
        this.isPubConnected = false;
      });
      this.subClient.connect().catch(() => {
        this.isSubConnected = false;
      });
    } catch (err: any) {
      logger.info('[PUBSUB] Redis not active. Seamlessly running in Local In-Process Mode: ' + err?.message);
      this.isPubConnected = false;
      this.isSubConnected = false;
    }
  }

  /**
   * Broadcast an event across all cluster workers and connected terminals.
   */
  async broadcast<T = any>(tenantId: string, eventType: string, payload: T): Promise<void> {
    const event: ClusterEvent<T> = {
      eventType,
      tenantId,
      payload,
      timestamp: new Date().toISOString(),
      originWorkerPid: process.pid
    };

    this.messagesDispatched++;
    const channel = `docsearch:events:${tenantId}`;

    if (this.isPubConnected && this.pubClient) {
      try {
        await this.pubClient.publish(channel, JSON.stringify(event));
        return;
      } catch (err: any) {
        logger.warn('[PUBSUB] Publish to Redis failed, falling back to local dispatch: ' + err?.message);
      }
    }

    // In-memory local dispatch fallback
    this.dispatchLocal(event);
  }

  /**
   * Subscribe to events for a specific tenant and eventType (or wildcard '*' for all).
   */
  subscribe<T = any>(tenantId: string, eventType: string, callback: EventCallback<T>): () => void {
    const eventKey = `${tenantId}:${eventType}`;
    this.localEmitter.on(eventKey, callback);
    this.activeListenersCount++;

    return () => {
      this.localEmitter.off(eventKey, callback);
      this.activeListenersCount = Math.max(0, this.activeListenersCount - 1);
    };
  }

  /**
   * Internal local dispatcher to registered listeners on this worker node.
   */
  private dispatchLocal(event: ClusterEvent): void {
    // 1. Dispatch to exact tenant and eventType
    this.localEmitter.emit(`${event.tenantId}:${event.eventType}`, event);
    // 2. Dispatch to tenant wildcard
    this.localEmitter.emit(`${event.tenantId}:*`, event);
    // 3. Dispatch to global wildcard
    this.localEmitter.emit(`*:*`, event);
  }

  /**
   * Realtime telemetry.
   */
  getTelemetry() {
    return {
      mode: this.isPubConnected && this.isSubConnected ? 'REDIS_PUBSUB' : 'LOCAL_EVENT_EMITTER',
      isPubConnected: this.isPubConnected,
      isSubConnected: this.isSubConnected,
      workerPid: process.pid,
      messagesDispatched: this.messagesDispatched,
      activeListenersCount: this.activeListenersCount
    };
  }

  async close(): Promise<void> {
    if (this.pubClient) {
      try {
        await this.pubClient.quit();
      } catch {
        // ignore
      }
    }
    if (this.subClient) {
      try {
        await this.subClient.quit();
      } catch {
        // ignore
      }
    }
    this.localEmitter.removeAllListeners();
  }
}

export const horizontalSocketGateway = new HorizontalSocketGateway();
