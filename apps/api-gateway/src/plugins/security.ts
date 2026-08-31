import type { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from '../config/env.js';
import { AppError } from '@docsearch/shared-core';

export async function registerSecurityPlugins(app: FastifyInstance): Promise<void> {
  // 1. Security Headers via Helmet
  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false
  });

  // 2. Strict CORS Configuration
  const isWildcard = env.CORS_ORIGIN === '*';
  if (env.NODE_ENV === 'production' && isWildcard) {
    throw AppError.badRequest('CORS policy error: Wildcard origin with credentials is forbidden in production');
  }

  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);

  await app.register(cors, {
    origin: isWildcard ? false : allowedOrigins,
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
