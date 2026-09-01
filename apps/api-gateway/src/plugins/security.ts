import type { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from '../config/env.js';

export async function registerSecurityPlugins(app: FastifyInstance): Promise<void> {
  // 1. Security Headers via Helmet
  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false
  });

  // 2. Production & Development CORS Configuration
  const isWildcard = env.CORS_ORIGIN === '*' || !env.CORS_ORIGIN;
  const configuredOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);

  await app.register(cors, {
    origin: isWildcard
      ? (_origin, cb) => {
          // Allow all incoming origins dynamically in cloud (Railway, localhost, custom domains)
          cb(null, true);
        }
      : configuredOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-tenant-id', 'x-branch-id', 'x-correlation-id']
  });

  // 3. Rate Limiting
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_TIME_WINDOW,
    errorResponseBuilder: () => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Rate limit quota exceeded.',
        details: []
      },
      timestamp: new Date().toISOString()
    })
  });
}
