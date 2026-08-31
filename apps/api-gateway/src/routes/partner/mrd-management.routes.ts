import { type FastifyPluginAsync } from 'fastify';
import { mrdManagementService } from '../../services/partner/MRDManagementService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import {
  type CreateMedicalRecordInput,
  type AssignICD10DiagnosisInput,
  type SubmitCodingReviewInput,
  type FinalizeMedicalRecordInput,
  type AmendMedicalRecordInput
} from '../../repositories/partner/MRDManagementRepository.js';

export const mrdManagementRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. ICD-10 Search
  fastify.get(
    '/api/v1/partner/mrd/icd10/search',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request) => {
      const query = request.query as { q?: string; category?: string };
      const data = await mrdManagementService.searchICD10(query?.q, query?.category);
      return { success: true, data };
    }
  );

  // 2. Medical Records List
  fastify.get(
    '/api/v1/partner/mrd/records',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request) => {
      const query = request.query as { patientId?: string; status?: string };
      const data = await mrdManagementService.getMedicalRecords(request.session, query?.patientId, query?.status);
      return { success: true, data };
    }
  );

  // 3. Create Medical Record Index
  fastify.post(
    '/api/v1/partner/mrd/records',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<CreateMedicalRecordInput, 'tenantId'>;
      const data = await mrdManagementService.createMedicalRecord(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 4. Assign ICD-10 Diagnosis
  fastify.post(
    '/api/v1/partner/mrd/records/:id/diagnoses',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = request.body as Omit<AssignICD10DiagnosisInput, 'tenantId' | 'recordId' | 'assignedByCoder'>;
      const data = await mrdManagementService.assignICD10Diagnosis({
        ...payload,
        recordId: id
      }, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'RECORD_NOT_FOUND', message: 'Medical record not found' } };
      }
      return { success: true, data };
    }
  );

  // 5. Submit Coding Review
  fastify.post(
    '/api/v1/partner/mrd/records/:id/reviews',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = request.body as Omit<SubmitCodingReviewInput, 'tenantId' | 'recordId'>;
      const data = await mrdManagementService.submitCodingReview({
        ...payload,
        recordId: id
      }, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'RECORD_NOT_FOUND', message: 'Medical record not found' } };
      }
      return { success: true, data };
    }
  );

  // 6. Finalize Medical Record
  fastify.post(
    '/api/v1/partner/mrd/records/:id/finalize',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'update')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = request.body as Omit<FinalizeMedicalRecordInput, 'tenantId' | 'recordId' | 'finalizedBy'>;
      const data = await mrdManagementService.finalizeMedicalRecord({
        ...payload,
        recordId: id
      }, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'RECORD_NOT_FOUND', message: 'Medical record not found' } };
      }
      return { success: true, data };
    }
  );

  // 7. Amend Finalized Record
  fastify.post(
    '/api/v1/partner/mrd/records/:id/amend',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'update')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = request.body as Omit<AmendMedicalRecordInput, 'tenantId' | 'recordId' | 'amendedBy'>;
      const data = await mrdManagementService.amendMedicalRecord({
        ...payload,
        recordId: id
      }, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'RECORD_NOT_FOUND', message: 'Medical record not found' } };
      }
      return { success: true, data };
    }
  );

  // 8. Patient Longitudinal MRD History
  fastify.get(
    '/api/v1/partner/patients/:id/mrd-history',
    {
      preHandler: [authenticate, requirePermission('clinical:patients', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await mrdManagementService.getPatientMRDHistory(request.session, id);
      return { success: true, data };
    }
  );
};
