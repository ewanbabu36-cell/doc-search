import type { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { AppError, ErrorCode } from '@docsearch/shared-core';
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
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-request-id',
      'x-tenant-id',
      'x-branch-id',
      'x-correlation-id',
      'x-idempotency-key',
      'x-razorpay-signature',
      'x-razorpay-event-id'
    ]
  });

  // 3. Hospital NAT-Safe Rate Limiting
  // Authenticated clinical staff are keyed by tenantId:userId (5,000 req/min quota)
  // Unauthenticated public traffic is keyed by IP (60 req/min quota for brute-force defense)
  await app.register(rateLimit, {
    timeWindow: env.RATE_LIMIT_TIME_WINDOW || 60000,
    allowList: (request) =>
      request.url === '/health' ||
      request.url === '/healthz' ||
      request.url.startsWith('/api/v1/partner/billing/webhooks'),
    keyGenerator: (request) => {
      // 1. If session is already verified and attached
      if (request.session?.userId) {
        return `auth:${request.session.tenantId}:${request.session.userId}`;
      }
      // 2. If Authorization header contains Bearer JWT token, extract sub & tenantId
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.slice(7).trim();
          const parts = token.split('.');
          if (parts.length === 3 && parts[1]) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
            if (payload.sub && payload.tenantId) {
              return `auth:${payload.tenantId}:${payload.sub}`;
            }
          }
        } catch {
          // fallback to IP on parse error
        }
      }
      // 3. Fallback to client IP for unauthenticated traffic
      return `ip:${request.ip}`;
    },
    max: (request) => {
      const authHeader = request.headers.authorization;
      if (request.session?.userId || (authHeader && authHeader.startsWith('Bearer '))) {
        // High throughput quota for authenticated clinical staff in hospitals
        return 5000;
      }
      // Strict anti-abuse / anti-spray quota for unauthenticated public traffic
      return env.RATE_LIMIT_MAX || 60;
    },
    errorResponseBuilder: (_request, context) => {
      return new AppError({
        message: `Too many requests. Rate limit quota exceeded. Retry in ${context.after}. Hospital staff: contact system administrator.`,
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        statusCode: 429,
        details: [{ message: `Retry after ${context.after}`, after: context.after, max: context.max }]
      });
    }
  });
}
