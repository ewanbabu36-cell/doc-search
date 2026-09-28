import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { executiveService } from '../../services/company/ExecutiveService.js';
import { operationsService } from '../../services/company/OperationsService.js';
import { authenticate, requireRoles } from '../../plugins/auth-guard.js';

const AcknowledgeEmergencySchema = z.object({
  id: z.string().min(1)
});

const VerifyDoctorSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['APPROVED', 'REJECTED'])
});

export const executiveRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/v1/company/executive/overview',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request) => {
      const summary = await executiveService.getOverview(request.session);
      return { success: true, data: summary };
    }
  );

  fastify.get(
    '/api/v1/company/executive/operations',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request) => {
      const operations = await operationsService.getDailyOperations(request.session);
      return { success: true, data: operations };
    }
  );

  fastify.post(
    '/api/v1/company/executive/operations/acknowledge-emergency',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request) => {
      const parsed = AcknowledgeEmergencySchema.parse(request.body);
      const result = await operationsService.acknowledgeEmergency(parsed.id, request.session);
      return { success: true, data: result };
    }
  );

  fastify.post(
    '/api/v1/company/executive/operations/verify-doctor',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request) => {
      const parsed = VerifyDoctorSchema.parse(request.body);
      const result = await operationsService.verifyDoctor(parsed.id, parsed.status, request.session);
      return { success: true, data: result };
    }
  );

  fastify.post(
    '/api/v1/company/executive/operations/process-payouts',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request) => {
      const result = await operationsService.processPayouts(request.session);
      return { success: true, data: result };
    }
  );
};
