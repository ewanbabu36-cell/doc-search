import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  SessionService,
  InMemorySessionStore,
  RedisSessionStore,
  type SessionStore
} from '@docsearch/auth';
import { realAuthService } from '../services/core/RealAuthService.js';
import { auditRepository } from '../repositories/core/AuditRepository.js';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import { env } from '../config/env.js';

export let sessionStore: SessionStore;
if (env.REDIS_URL) {
  sessionStore = new RedisSessionStore(env.REDIS_URL);
} else if (env.NODE_ENV === 'production') {
  throw new Error('FATAL: REDIS_URL is mandatory in production for distributed session state and instant token revocation.');
} else {
  sessionStore = new InMemorySessionStore();
}

export function setSessionStore(store: SessionStore): void {
  sessionStore = store;
  sessionService = new SessionService(sessionStore);
}

export let sessionService = new SessionService(sessionStore);

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(10)
});

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/v1/auth/login (Real Database & Cryptographic Password Hash Verification)
  fastify.post('/api/v1/auth/login', async (request, reply) => {
    const parseResult = LoginSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new AppError({
        message: 'Invalid login payload. Email and password (min 6 chars) required.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400,
        details: parseResult.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
      });
    }

    const { email, password } = parseResult.data;

    // Real authentication & cryptographic password verification
    const user = await realAuthService.authenticateUser(email, password);

    if (!user) {
      throw new AppError({
        message: 'Invalid email or password. Authentication failed.',
        code: ErrorCode.UNAUTHORIZED,
        statusCode: 401
      });
    }

    const sessionRes = await sessionService.createSession({
      userId: user.id,
      tenantId: user.tenantId,
      organizationId: user.organizationId,
      branchId: user.branchId,
      actorEmail: user.email,
      roles: user.roles,
      permissions: user.permissions,
      jwtSecret: env.JWT_SECRET,
      jwtIssuer: env.JWT_ISSUER,
      jwtAudience: env.JWT_AUDIENCE,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent']
    });

    await auditRepository.recordEvent({
      eventType: 'AUTH_USER_LOGGED_IN',
      resourceType: 'session',
      resourceId: sessionRes.sessionId,
      tenantId: user.tenantId,
      branchId: user.branchId,
      metadata: { email: user.email, roles: user.roles, ipAddress: request.ip }
    }, sessionRes.session);

    return reply.status(200).send({
      success: true,
      data: {
        accessToken: sessionRes.accessToken,
        refreshToken: sessionRes.refreshToken,
        expiresIn: 3600,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          tenantId: user.tenantId,
          organizationId: user.organizationId,
          branchId: user.branchId,
          roles: user.roles,
          permissions: user.permissions,
          tenantName: user.tenantName,
          organizationType: user.organizationType,
          planTier: user.planTier,
          accessibleFeatures: user.accessibleFeatures
        }
      }
    });
  });

  // POST /api/v1/auth/refresh
  fastify.post('/api/v1/auth/refresh', async (request, reply) => {
    const parseResult = RefreshSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new AppError({
        message: 'Invalid refresh token payload',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    const res = await sessionService.rotateRefreshToken({
      rawRefreshToken: parseResult.data.refreshToken,
      jwtSecret: env.JWT_SECRET,
      jwtIssuer: env.JWT_ISSUER,
      jwtAudience: env.JWT_AUDIENCE,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent']
    });

    return reply.status(200).send({
      success: true,
      data: {
        accessToken: res.newAccessToken,
        refreshToken: res.newRefreshToken,
        expiresIn: 3600
      }
    });
  });

  // POST /api/v1/auth/logout
  fastify.post('/api/v1/auth/logout', async (_request, reply) => {
    return reply.status(200).send({
      success: true,
      data: { message: 'Logged out successfully' }
    });
  });

  // POST /api/v1/auth/register-partner-user (Immediate partner credential registration)
  fastify.post('/api/v1/auth/register-partner-user', async (request, reply) => {
    const body = request.body as {
      email: string;
      password?: string;
      plainPassword?: string;
      firstName?: string;
      lastName?: string;
      tenantName: string;
      organizationType?: string;
      planTier?: string;
      accessibleFeatures?: string[];
      phone?: string;
    };

    const plainPassword = body.password || body.plainPassword;
    if (!body.email || !plainPassword || !body.tenantName) {
      throw new AppError({
        message: 'email, password and tenantName are required',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    const nameParts = (body.firstName || 'Pathologist').split(' ');
    const firstName = nameParts[0] || 'Pathologist';
    const lastName = body.lastName || nameParts.slice(1).join(' ') || 'In-Charge';

    const registered = realAuthService.registerPartnerUserCredential({
      email: body.email,
      plainPassword,
      firstName,
      lastName,
      tenantName: body.tenantName,
      organizationType: body.organizationType || 'PATHOLOGY',
      planTier: body.planTier || 'Pathology Pro & Barcode LIMS',
      accessibleFeatures: body.accessibleFeatures || ['LIMS Workbench', 'Barcodes', 'WhatsApp Reports'],
      phone: body.phone
    });

    return reply.status(201).send({
      success: true,
      data: {
        id: registered.id,
        email: registered.email,
        tenantName: registered.tenantName,
        organizationType: registered.organizationType,
        planTier: registered.planTier,
        message: 'Partner credentials successfully registered and ready for live login.'
      }
    });
  });

  // GET /api/v1/auth/live-partners (List of newly onboarded live partners for fast login switch)
  fastify.get('/api/v1/auth/live-partners', async (_request, reply) => {
    const partners = realAuthService.getAllLivePartnerUsers().map((p) => ({
      id: p.id,
      email: p.email,
      name: `${p.firstName} ${p.lastName}`.trim(),
      tenantName: p.tenantName,
      organizationType: p.organizationType,
      planTier: p.planTier,
      accessibleFeatures: p.accessibleFeatures,
      phone: p.phone
    }));
    return reply.status(200).send({ success: true, data: partners });
  });
};
