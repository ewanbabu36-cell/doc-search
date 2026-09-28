import { type FastifyPluginAsync } from 'fastify';
import { inpatientManagementService } from '../../services/partner/InpatientManagementService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import { requireModuleCommercialAccess } from '../../plugins/commercial-guard.js';
import {
  type CreateWardInput,
  type CreateBedInput,
  type CreateAdmissionInput,
  type CreateAdmissionRequestInput,
  type TransferBedInput,
  type NursingNoteInput,
  type DischargeInput,
  type CreateDoctorRoundInput,
  type RecordVitalObservationInput
} from '../../repositories/partner/InpatientManagementRepository.js';

export const inpatientManagementRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', requireModuleCommercialAccess('INPATIENT_IPD'));

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

  // 2b. Admission Requests
  fastify.get(
    '/api/v1/partner/inpatient/admission-requests',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request) => {
      const query = request.query as { status?: string; branchId?: string; tenantId?: string; departmentId?: string };
      const data = await inpatientManagementService.getAdmissionRequests(request.session, query?.status, {
        tenantId: query?.tenantId,
        branchId: query?.branchId,
        departmentId: query?.departmentId
      });
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/inpatient/admission-requests',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<CreateAdmissionRequestInput, 'tenantId'>;
      const data = await inpatientManagementService.createAdmissionRequest(payload, request.session);
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

  // 8. Doctor Daily Rounds
  fastify.post(
    '/api/v1/partner/inpatient/rounds',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<CreateDoctorRoundInput, 'tenantId'>;
      const data = await inpatientManagementService.createDoctorRound(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/inpatient/rounds',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request) => {
      const query = request.query as { admissionId?: string; patientId?: string };
      const data = await inpatientManagementService.getDoctorRounds(request.session, query?.admissionId, query?.patientId);
      return { success: true, data };
    }
  );

  // 9. Inpatient Vitals & Observations
  fastify.post(
    '/api/v1/partner/inpatient/vitals',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<RecordVitalObservationInput, 'tenantId' | 'recordedBy'>;
      const data = await inpatientManagementService.recordVitalObservation(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/inpatient/vitals',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request) => {
      const query = request.query as { admissionId?: string; patientId?: string };
      const data = await inpatientManagementService.getVitalObservations(request.session, query?.admissionId, query?.patientId);
      return { success: true, data };
    }
  );

  // 10. Discharge Summary Document
  fastify.get(
    '/api/v1/partner/inpatient/admissions/:id/discharge-summary',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await inpatientManagementService.getDischargeSummary(request.session, id);
      return { success: true, data };
    }
  );

  // 11. Consolidated IPD Billing
  fastify.get(
    '/api/v1/partner/inpatient/admissions/:id/billing-summary',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await inpatientManagementService.getIpdBillingSummary(request.session, id);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/inpatient/admissions/:id/generate-bill',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await inpatientManagementService.generateConsolidatedIpdBill(request.session, id);
      reply.status(201);
      return { success: true, data };
    }
  );
};
