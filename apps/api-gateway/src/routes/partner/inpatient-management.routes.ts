import { type FastifyPluginAsync } from 'fastify';
import { inpatientManagementService } from '../../services/partner/InpatientManagementService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import {
  type CreateWardInput,
  type CreateBedInput,
  type CreateAdmissionInput,
  type TransferBedInput,
  type NursingNoteInput,
  type DischargeInput
} from '../../repositories/partner/InpatientManagementRepository.js';

export const inpatientManagementRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Wards
  fastify.get(
    '/api/v1/partner/inpatient/wards',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request) => {
      const data = await inpatientManagementService.getWards(request.session);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/inpatient/wards',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<CreateWardInput, 'tenantId'>;
      const data = await inpatientManagementService.createWard(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 2. Beds & Bed Board
  fastify.get(
    '/api/v1/partner/inpatient/beds',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request) => {
      const query = request.query as { wardId?: string; status?: string };
      const data = await inpatientManagementService.getBeds(request.session, query?.wardId, query?.status);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/inpatient/beds',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<CreateBedInput, 'tenantId'>;
      const data = await inpatientManagementService.createBed(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 3. IPD Admissions
  fastify.get(
    '/api/v1/partner/inpatient/admissions',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request) => {
      const query = request.query as { status?: string; patientId?: string };
      const data = await inpatientManagementService.getAdmissions(request.session, query?.status, query?.patientId);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/inpatient/admissions',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<CreateAdmissionInput, 'tenantId'>;
      const data = await inpatientManagementService.createAdmission(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 4. Bed Transfers
  fastify.post(
    '/api/v1/partner/inpatient/transfers',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<TransferBedInput, 'tenantId' | 'transferredBy'>;
      const data = await inpatientManagementService.transferBed(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 5. Nursing Care & Notes
  fastify.post(
    '/api/v1/partner/inpatient/nursing-notes',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<NursingNoteInput, 'tenantId' | 'nurseId'>;
      const data = await inpatientManagementService.recordNursingNote(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/inpatient/nursing-notes',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request) => {
      const query = request.query as { admissionId?: string; patientId?: string };
      const data = await inpatientManagementService.getNursingNotes(request.session, query?.admissionId, query?.patientId);
      return { success: true, data };
    }
  );

  // 6. Discharge Patient & Release Bed
  fastify.post(
    '/api/v1/partner/inpatient/admissions/:id/discharge',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const payload = request.body as Omit<DischargeInput, 'tenantId' | 'admissionId' | 'dischargingDoctorId'>;
      const data = await inpatientManagementService.dischargePatient({
        ...payload,
        admissionId: id
      }, request.session);
      return { success: true, data };
    }
  );

  // 7. Patient Inpatient History
  fastify.get(
    '/api/v1/partner/patients/:id/inpatient-history',
    {
      preHandler: [authenticate, requirePermission('clinical:patients', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await inpatientManagementService.getAdmissions(request.session, undefined, id);
      return { success: true, data };
    }
  );
};
