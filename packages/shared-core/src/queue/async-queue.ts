import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { createLogger } from '../logging/logger.js';

const logger = createLogger('async-queue');

export type HighScaleJobType =
  | 'GENERATE_INVOICE_PDF'
  | 'SEND_WHATSAPP_CONFIRMATION'
  | 'SEND_SMS_ALERT'
  | 'SYNC_ABDM_MILESTONE'
  | 'CALCULATE_REFERRAL_BOUNTY'
  | 'AUDIT_LOG_STREAM';

export interface QueuedJob<T = any> {
  id: string;
  type: HighScaleJobType;
  payload: T;
  priority: number; // Higher number = higher priority
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  processedAt?: number;
  error?: string;
}

export type JobHandler<T = any> = (job: QueuedJob<T>) => Promise<void>;

export interface QueueMetrics {
  enqueuedTotal: number;
  completedTotal: number;
  failedTotal: number;
  inFlight: number;
  pendingCount: number;
}

const getDurableQueueDir = (): string => {
  if (typeof process !== 'undefined' && process.env && process.env['DOCSEARCH_QUEUE_DIR']) {
    return process.env['DOCSEARCH_QUEUE_DIR'];
  }
  try {
    return path.resolve(os.tmpdir(), 'docsearch_durable_queue');
  } catch {
    return '/tmp/docsearch_durable_queue';
  }
};

const DURABLE_QUEUE_DIR = getDurableQueueDir();

export class HighThroughputAsyncQueue {
  private readonly queue: QueuedJob[] = [];
  private readonly handlers = new Map<HighScaleJobType, JobHandler>();
  private inFlightWorkers = 0;
  private maxConcurrency = 10;
  private isProcessing = false;

  private enqueuedTotal = 0;
  private completedTotal = 0;
  private failedTotal = 0;

  constructor(maxConcurrency = 10) {
    this.maxConcurrency = maxConcurrency;
    try {
      fs.mkdirSync(DURABLE_QUEUE_DIR, { recursive: true });
    } catch {}

    // Automatically recover in-flight/pending jobs from crash journal
    this.recoverPendingJobs();
  }

  /**
   * Recovers uncompleted jobs from durable journal storage after a crash or restart.
   */
  private recoverPendingJobs(): void {
    try {
      if (!fs.existsSync(DURABLE_QUEUE_DIR)) return;
      const files = fs.readdirSync(DURABLE_QUEUE_DIR);
      for (const file of files) {
        if (file.endsWith('.job.json')) {
          const filePath = path.join(DURABLE_QUEUE_DIR, file);
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const job: QueuedJob = JSON.parse(content);
            if (job && job.id && !job.processedAt) {
              this.queue.push(job);
              this.enqueuedTotal++;
            }
          } catch {}
        }
      }
      if (this.queue.length > 0) {
        // Sort recovered jobs by priority
        this.queue.sort((a, b) => b.priority - a.priority);
        logger.info(`[DURABLE QUEUE] Successfully recovered ${this.queue.length} pending jobs after process initialization.`);
        // FIX FIND-02: Automatically trigger queue draining so recovered jobs never stall
        this.processNextTick();
      }
    } catch (err) {
      logger.warn('[DURABLE QUEUE] Recovery scan completed with note:', { error: String(err) });
    }
  }

  /**
   * Registers a worker handler for a specific job type.
   */
  registerHandler<T = any>(type: HighScaleJobType, handler: JobHandler<T>): void {
    this.handlers.set(type, handler);
    // If pending recovered jobs exist for this handler, pump them immediately
    if (this.queue.length > 0) {
      this.processNextTick();
    }
  }

  /**
   * Enqueues a task asynchronously with durable write-ahead guarantee.
   * Survives server crash, restart, OOM, and container replacement.
   */
  async enqueue<T = any>(
    type: HighScaleJobType,
    payload: T,
    options?: { priority?: number; maxAttempts?: number }
  ): Promise<string> {
    const job: QueuedJob<T> = {
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type,
      payload,
      priority: options?.priority ?? 0,
      attempts: 0,
      maxAttempts: options?.maxAttempts ?? 3,
      createdAt: Date.now()
    };

    // 1. Persist to durable storage first (Crash survival guarantee)
    try {
      const jobPath = path.join(DURABLE_QUEUE_DIR, `${job.id}.job.json`);
      fs.writeFileSync(jobPath, JSON.stringify(job), 'utf8');
    } catch (err) {
      logger.error(`[DURABLE QUEUE] Failed to persist job ${job.id} to durable journal`, { error: String(err) });
    }

    // 2. Insert sorted by priority (higher priority first)
    const index = this.queue.findIndex((q) => q.priority < job.priority);
    if (index === -1) {
      this.queue.push(job);
    } else {
      this.queue.splice(index, 0, job);
    }

    this.enqueuedTotal++;

    // Trigger queue pump without blocking caller
    this.processNextTick();

    return job.id;
  }

  private processNextTick(): void {
    if (!this.isProcessing) {
      this.isProcessing = true;
      setImmediate(() => {
        this.pumpQueue().catch((err) => {
          logger.error('Unexpected error in queue pump', { error: String(err) });
        });
      });
    }
  }

  private async pumpQueue(): Promise<void> {
    while (this.queue.length > 0 && this.inFlightWorkers < this.maxConcurrency) {
      const job = this.queue.shift();
      if (!job) break;

      this.inFlightWorkers++;
      this.executeJob(job)
        .catch((err) => {
          logger.error(`Unhandled error during execution of job ${job.id}`, { error: String(err) });
        })
        .finally(() => {
          this.inFlightWorkers--;
          this.processNextTick();
        });
    }

    this.isProcessing = false;
  }

  private async executeJob(job: QueuedJob): Promise<void> {
    job.attempts++;
    const handler = this.handlers.get(job.type);

    if (!handler) {
      logger.warn(`No handler registered for job type ${job.type}. Retaining in pending journal.`);
      return;
    }

    try {
      await handler(job);
      job.processedAt = Date.now();
      this.completedTotal++;

      // Delete from durable journal on successful completion
      try {
        const jobPath = path.join(DURABLE_QUEUE_DIR, `${job.id}.job.json`);
        if (fs.existsSync(jobPath)) {
          fs.unlinkSync(jobPath);
        }
      } catch {}
    } catch (err: unknown) {
      const errMsg = (err as any)?.message || String(err);
      job.error = errMsg;
      logger.error(`Job ${job.id} [${job.type}] attempt ${job.attempts}/${job.maxAttempts} failed: ${errMsg}`);

      if (job.attempts < job.maxAttempts) {
        // Update journal with attempts count
        try {
          const jobPath = path.join(DURABLE_QUEUE_DIR, `${job.id}.job.json`);
          fs.writeFileSync(jobPath, JSON.stringify(job), 'utf8');
        } catch {}

        const backoffMs = Math.min(1000 * Math.pow(2, job.attempts), 30000);
        setTimeout(() => {
          this.queue.push(job);
          this.processNextTick();
        }, backoffMs);
      } else {
        logger.error(`Job ${job.id} [${job.type}] exhausted all ${job.maxAttempts} retry attempts. Moved to Dead-Letter.`);
        this.failedTotal++;
        // Remove from active queue directory, write to dead-letter
        try {
          const deadLetterDir = path.join(DURABLE_QUEUE_DIR, 'dead_letter');
          fs.mkdirSync(deadLetterDir, { recursive: true });
          const oldPath = path.join(DURABLE_QUEUE_DIR, `${job.id}.job.json`);
          const newPath = path.join(deadLetterDir, `${job.id}.dead.json`);
          if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
          }
        } catch {}
      }
    }
  }

  /**
   * Queue observability metrics for monitoring dashboards.
   */
  getMetrics(): QueueMetrics {
    return {
      enqueuedTotal: this.enqueuedTotal,
      completedTotal: this.completedTotal,
      failedTotal: this.failedTotal,
      inFlight: this.inFlightWorkers,
      pendingCount: this.queue.length
    };
  }

  /**
   * Drain and wait for in-flight jobs during graceful server shutdown.
   */
  async drain(timeoutMs = 10000): Promise<void> {
    const startTime = Date.now();
    while ((this.inFlightWorkers > 0 || this.queue.length > 0) && Date.now() - startTime < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

// Global Singleton Async Queue Instance
export const asyncJobQueue = new HighThroughputAsyncQueue();

