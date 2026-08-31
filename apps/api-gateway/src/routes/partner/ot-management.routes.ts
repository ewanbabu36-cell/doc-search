import { type FastifyPluginAsync } from 'fastify';
import { otManagementService } from '../../services/partner/OTManagementService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import {
  type CreateOTRoomInput,
  type CreateSurgeryBookingInput,
  type RecordPACAssessmentInput,
  type RecordOperativeNotesInput,
  type RecordPACURecoveryInput,
  type TransferPostOpInput
} from '../../repositories/partner/OTManagementRepository.js';

export const otManagementRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. OT Rooms
  fastify.get(
    '/api/v1/partner/ot/rooms',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request) => {
      const data = await otManagementService.getOTRooms(request.session);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/ot/rooms',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<CreateOTRoomInput, 'tenantId'>;
      const data = await otManagementService.createOTRoom(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 2. OT Schedules & Surgery Booking
  fastify.get(
    '/api/v1/partner/ot/schedules',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request) => {
      const query = request.query as { status?: string; date?: string };
      const data = await otManagementService.getSchedules(request.session, query?.status, query?.date);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/ot/schedules',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<CreateSurgeryBookingInput, 'tenantId'>;
      const data = await otManagementService.createSurgeryBooking(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 3. Pre-Operative PAC Clearance
  fastify.post(
    '/api/v1/partner/ot/schedules/:id/pac',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = request.body as Omit<RecordPACAssessmentInput, 'tenantId' | 'scheduleId' | 'anaesthetistId'>;
      const data = await otManagementService.recordPACAssessment({
        ...payload,
        scheduleId: id
      }, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'SCHEDULE_NOT_FOUND', message: 'Surgery schedule not found' } };
      }
      return { success: true, data };
    }
  );

  // 4. Intra-Operative Notes
  fastify.post(
    '/api/v1/partner/ot/schedules/:id/operative-notes',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = request.body as Omit<RecordOperativeNotesInput, 'tenantId' | 'scheduleId' | 'surgeonId'>;
      const data = await otManagementService.recordOperativeNotes({
        ...payload,
        scheduleId: id
      }, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'SCHEDULE_NOT_FOUND', message: 'Surgery schedule not found' } };
      }
      return { success: true, data };
    }
  );

  // 5. PACU Post-Operative Recovery
  fastify.post(
    '/api/v1/partner/ot/schedules/:id/pacu',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = request.body as Omit<RecordPACURecoveryInput, 'tenantId' | 'scheduleId' | 'pacuNurseId'>;
      const data = await otManagementService.recordPACURecovery({
        ...payload,
        scheduleId: id
      }, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'SCHEDULE_NOT_FOUND', message: 'Surgery schedule not found' } };
      }
      return { success: true, data };
    }
  );

  // 6. Post-Op Transfer
  fastify.post(
    '/api/v1/partner/ot/schedules/:id/transfer-postop',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'update')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = request.body as Omit<TransferPostOpInput, 'tenantId' | 'scheduleId' | 'transferredBy'>;
      const data = await otManagementService.transferPostOp({
        ...payload,
        scheduleId: id
      }, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'SCHEDULE_NOT_FOUND', message: 'Surgery schedule not found' } };
      }
      return { success: true, data };
    }
  );

  // 7. Patient Surgical History
  fastify.get(
    '/api/v1/partner/patients/:id/surgical-history',
    {
      preHandler: [authenticate, requirePermission('clinical:patients', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await otManagementService.getPatientSurgicalHistory(request.session, id);
      return { success: true, data };
    }
  );
};
