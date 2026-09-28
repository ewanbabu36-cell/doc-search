import type { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from '../config/env.js';

export async function registerSecurityPlugins(app: FastifyInstance): Promise<void> {
  // 1. Security Headers via Helmet
  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"]
      }
    } : false,
    crossOriginEmbedderPolicy: false,
    xContentTypeOptions: true,
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    hidePoweredBy: true
  });

  // 2. Production & Development CORS Configuration
  const isWildcard = env.CORS_ORIGIN === '*' || !env.CORS_ORIGIN;
  const configuredOrigins = env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean) : [];

  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile applications, healthcheck, server-to-server)
      if (!origin) {
        return cb(null, true);
      }
      if (isWildcard && env.NODE_ENV !== 'production') {
        return cb(null, true);
      }
      if (configuredOrigins.includes(origin)) {
        return cb(null, true);
      }
      // In development / non-production, permit all local interfaces and private LAN development
      if (env.NODE_ENV !== 'production') {
        if (
          origin.startsWith('http://localhost:') ||
          origin.startsWith('https://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          origin.startsWith('https://127.0.0.1:') ||
          origin.startsWith('http://10.') ||
          origin.startsWith('http://192.168.') ||
          origin.startsWith('http://172.') ||
          origin === 'http://localhost' ||
          origin === 'https://localhost' ||
          origin === 'http://127.0.0.1' ||
          origin === 'https://127.0.0.1'
        ) {
          return cb(null, true);
        }
      }
      // In production, allow trusted domain patterns
      if (
        origin.endsWith('.docsearch.health') ||
        origin === 'https://docsearch.health' ||
        origin === 'http://docsearch.health'
      ) {
        return cb(null, true);
      }
      // Standard CORS rejection (graceful 403 / header exclusion without unhandled 500 error)
      return cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
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
      request.url.startsWith('/api/v1/auth/launch-offer') ||
      request.url.startsWith('/api/v1/auth/registration-form-config') ||
      request.url.startsWith('/api/v1/auth/self-registered-partners') ||
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
        return 10000;
      }
      // Strict anti-abuse / anti-spray quota for unauthenticated public traffic
      return env.RATE_LIMIT_MAX || 100;
    },
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true
    },
    errorResponseBuilder: (request, context) => {
      const retryAfterSeconds = Math.max(1, Math.ceil(context.ttl / 1000));
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        errorCode: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded',
        retryAfter: retryAfterSeconds,
        requestId: request.id || 'unknown',
        details: [
          {
            message: `Rate limit exceeded. Retry in ${retryAfterSeconds} seconds.`,
            after: context.after,
            max: context.max
          }
        ]
      };
    }
  });
}
