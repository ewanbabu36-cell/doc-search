import { buildApp } from './app.js';
import { env } from './config/env.js';
import { createLogger } from '@docsearch/shared-core';
import { closeDatabase } from '@docsearch/database';

const logger = createLogger('api-gateway-server');

async function start(): Promise<void> {
  try {
    const app = await buildApp();

    await app.listen({ port: env.PORT, host: env.HOST });
    logger.info(`Doc Search API Gateway running at http://${env.HOST}:${env.PORT}`);

    // Graceful Shutdown
    const signals = ['SIGINT', 'SIGTERM'];
    for (const signal of signals) {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, initiating graceful shutdown...`);
        await app.close();
        await closeDatabase();
        process.exit(0);
      });
    }
  } catch (err) {
    logger.error('Failed to start API Gateway', err);
    process.exit(1);
  }
}

start();
