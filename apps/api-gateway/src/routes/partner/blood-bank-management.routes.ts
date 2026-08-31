import { type FastifyPluginAsync } from 'fastify';
import { bloodBankManagementService } from '../../services/partner/BloodBankManagementService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import {
  type RegisterDonorInput,
  type CollectDonationInput,
  type SeparateComponentsInput,
  type RecordBloodTestInput,
  type CreateBloodRequestInput,
  type PerformCrossmatchInput,
  type IssueBloodUnitInput,
  type RecordTransfusionInput
} from '../../repositories/partner/BloodBankManagementRepository.js';

export const bloodBankManagementRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Blood Inventory
  fastify.get(
    '/api/v1/partner/blood-bank/inventory',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request) => {
      const query = request.query as { bloodGroup?: string; componentType?: string; status?: string };
      const data = await bloodBankManagementService.getInventory(request.session, query?.bloodGroup, query?.componentType, query?.status);
      return { success: true, data };
    }
  );

  // 2. Donor Registration
  fastify.post(
    '/api/v1/partner/blood-bank/donors',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<RegisterDonorInput, 'tenantId'>;
      const data = await bloodBankManagementService.registerDonor(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 3. Collect Donation
  fastify.post(
    '/api/v1/partner/blood-bank/donations',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<CollectDonationInput, 'tenantId'>;
      const data = await bloodBankManagementService.collectDonation(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 4. Separate Components
  fastify.post(
    '/api/v1/partner/blood-bank/components/separate',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<SeparateComponentsInput, 'tenantId'>;
      const data = await bloodBankManagementService.separateComponents(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 5. Record TTI Tests
  fastify.post(
    '/api/v1/partner/blood-bank/tests',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<RecordBloodTestInput, 'tenantId' | 'testedBy'>;
      const data = await bloodBankManagementService.recordBloodTest(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 6. Create Blood Request
  fastify.post(
    '/api/v1/partner/blood-bank/requests',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<CreateBloodRequestInput, 'tenantId'>;
      const data = await bloodBankManagementService.createBloodRequest(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 7. Perform Crossmatch
  fastify.post(
    '/api/v1/partner/blood-bank/crossmatch',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<PerformCrossmatchInput, 'tenantId' | 'technicianId'>;
      const data = await bloodBankManagementService.performCrossmatch(payload, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'REQUEST_NOT_FOUND', message: 'Blood request not found' } };
      }
      return { success: true, data };
    }
  );

  // 8. Issue Blood Unit
  fastify.post(
    '/api/v1/partner/blood-bank/issue',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<IssueBloodUnitInput, 'tenantId' | 'issuedBy'>;
      const data = await bloodBankManagementService.issueBloodUnit(payload, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'REQUEST_NOT_FOUND', message: 'Blood request not found' } };
      }
      return { success: true, data };
    }
  );

  // 9. Record Transfusion
  fastify.post(
    '/api/v1/partner/blood-bank/transfusions',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<RecordTransfusionInput, 'tenantId' | 'transfusedByNurse'>;
      const data = await bloodBankManagementService.recordTransfusion(payload, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'REQUEST_NOT_FOUND', message: 'Blood request not found' } };
      }
      return { success: true, data };
    }
  );

  // 10. Patient Transfusion History
  fastify.get(
    '/api/v1/partner/patients/:id/transfusion-history',
    {
      preHandler: [authenticate, requirePermission('clinical:patients', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await bloodBankManagementService.getPatientTransfusionHistory(request.session, id);
      return { success: true, data };
    }
  );
};
