import cluster, { type Worker } from 'node:cluster';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLogger } from '@docsearch/shared-core';

const logger = createLogger('api-gateway-cluster');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function startCluster(): void {
  if (cluster.isPrimary) {
    const totalCpus = os.cpus().length;
    const requestedWorkers = parseInt(process.env['CLUSTER_WORKERS'] || '', 10);
    const workerCount = !isNaN(requestedWorkers) && requestedWorkers > 0 ? requestedWorkers : totalCpus;

    logger.info(
      `================================================================================\n` +
      `🚀 DOC SEARCH HIGH-CONCURRENCY MULTI-CORE CLUSTER MANAGER\n` +
      `Target Scale: 10,000,000 Daily Transactions & 100k Partners\n` +
      `Primary Process PID: ${process.pid}\n` +
      `Total Host CPU Cores: ${totalCpus}\n` +
      `Active Worker Instances Forking: ${workerCount}\n` +
      `================================================================================`
    );

    cluster.setupPrimary({
      exec: path.join(__dirname, 'server.js')
    });

    // Fork initial workers
    for (let i = 0; i < workerCount; i++) {
      const worker = cluster.fork({ WORKER_INDEX: String(i) });
      logger.info(`[CLUSTER] Forked worker process #${i + 1} (PID: ${worker.process.pid})`);
    }

    cluster.on('online', (worker) => {
      logger.info(`[CLUSTER] Worker PID: ${worker.process.pid} is online and ready for traffic.`);
    });

    let isShuttingDown = false;

    // Self-healing automatic worker respawn
    cluster.on('exit', (worker, code, signal) => {
      if (isShuttingDown) {
        logger.info(`[CLUSTER] Worker PID: ${worker.process.pid} exited cleanly during cluster shutdown.`);
        return;
      }

      logger.warn(
        `[CLUSTER] Worker PID: ${worker.process.pid} died (code: ${code}, signal: ${signal}). Auto-healing: Spawning replacement worker immediately...`
      );
      const replacement = cluster.fork();
      logger.info(`[CLUSTER] Replacement worker spawned (PID: ${replacement.process.pid})`);
    });

    // Graceful Cluster Shutdown
    const shutdown = async (signalName: string) => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      logger.info(`[CLUSTER] Received ${signalName}. Initiating graceful rolling shutdown across all workers...`);

      const workerList = Object.values(cluster.workers || {}).filter(Boolean) as Worker[];
      for (const worker of workerList) {
        if (worker && worker.process && worker.process.pid) {
          logger.info(`[CLUSTER] Disconnecting worker PID: ${worker.process.pid}...`);
          worker.disconnect();
        }
      }

      setTimeout(() => {
        logger.warn('[CLUSTER] Forcefully killing remaining unresponsive workers...');
        for (const worker of workerList) {
          if (worker && !worker.isDead()) {
            worker.kill('SIGKILL');
          }
        }
        process.exit(0);
      }, 5000).unref();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Zero-Downtime Rolling Reload on SIGUSR2
    process.on('SIGUSR2', async () => {
      logger.info('[CLUSTER] Received SIGUSR2: Commencing zero-downtime rolling reload...');
      const workerList = Object.values(cluster.workers || {}).filter(Boolean) as Worker[];
      for (const oldWorker of workerList) {
        if (oldWorker) {
          const newWorker = cluster.fork();
          await new Promise<void>((resolve) => {
            newWorker.once('online', () => {
              logger.info(`[CLUSTER] New worker PID: ${newWorker.process.pid} ready. Disconnecting old worker PID: ${oldWorker.process.pid}`);
              oldWorker.disconnect();
              resolve();
            });
          });
        }
      }
      logger.info('[CLUSTER] Zero-downtime rolling reload completed successfully.');
    });
  }
}

// Auto-run if executed directly
if (cluster.isPrimary) {
  startCluster();
}
