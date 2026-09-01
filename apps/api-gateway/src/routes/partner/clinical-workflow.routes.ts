import { type FastifyPluginAsync } from 'fastify';
import { clinicalWorkflowService } from '../../services/partner/ClinicalWorkflowService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import {
  type CreatePatientInput,
  type CreateEncounterInput,
  type SaveConsultationInput
} from '../../repositories/partner/ClinicalWorkflowRepository.js';

export const clinicalWorkflowRoutes: FastifyPluginAsync = async (fastify) => {
  // ==========================================
  // 1. PATIENT REGISTRATION & MPI
  // ==========================================
  
  // GET /api/v1/partner/patients
  fastify.get(
    '/api/v1/partner/patients',
    {
      preHandler: [authenticate, requirePermission('clinical:patients', 'read')]
    },
    async (request) => {
      const query = (request.query as { q?: string })?.q;
      const data = await clinicalWorkflowService.searchPatients(request.session, query);
      return { success: true, data };
    }
  );

  // Alias /api/v1/partner/clinical/patients
  fastify.get(
    '/api/v1/partner/clinical/patients',
    {
      preHandler: [authenticate, requirePermission('clinical:patients', 'read')]
    },
    async (request) => {
      const query = (request.query as { q?: string })?.q;
      const data = await clinicalWorkflowService.searchPatients(request.session, query);
      return { success: true, data };
    }
  );

  // POST /api/v1/partner/patients
  fastify.post(
    '/api/v1/partner/patients',
    {
      preHandler: [authenticate, requirePermission('clinical:patients', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<CreatePatientInput, 'tenantId'>;
      const data = await clinicalWorkflowService.createPatient(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/clinical/patients',
    {
      preHandler: [authenticate, requirePermission('clinical:patients', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<CreatePatientInput, 'tenantId'>;
      const data = await clinicalWorkflowService.createPatient(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // GET /api/v1/partner/patients/:id
  fastify.get(
    '/api/v1/partner/patients/:id',
    {
      preHandler: [authenticate, requirePermission('clinical:patients', 'read')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await clinicalWorkflowService.searchPatients(request.session);
      const found = data.find(p => p.id === id);
      if (!found) {
        reply.status(404);
        return { success: false, error: { code: 'PATIENT_NOT_FOUND', message: 'Patient not found' } };
      }
      return { success: true, data: found };
    }
  );

  // PATCH /api/v1/partner/patients/:id
  fastify.patch(
    '/api/v1/partner/patients/:id',
    {
      preHandler: [authenticate, requirePermission('clinical:patients', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const payload = request.body as Partial<CreatePatientInput>;
      return { success: true, data: { id, ...payload, updatedAt: new Date().toISOString() } };
    }
  );

  // ==========================================
  // 2. ENCOUNTERS & OPD QUEUE
  // ==========================================

  // GET /api/v1/partner/encounters
  fastify.get(
    '/api/v1/partner/encounters',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request) => {
      const status = (request.query as { status?: string })?.status;
      const data = await clinicalWorkflowService.getEncounters(request.session, status);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/clinical/encounters',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request) => {
      const status = (request.query as { status?: string })?.status;
      const data = await clinicalWorkflowService.getEncounters(request.session, status);
      return { success: true, data };
    }
  );

  // POST /api/v1/partner/encounters
  fastify.post(
    '/api/v1/partner/encounters',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<CreateEncounterInput, 'tenantId'>;
      const data = await clinicalWorkflowService.checkInEncounter(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/clinical/encounters/check-in',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<CreateEncounterInput, 'tenantId'>;
      const data = await clinicalWorkflowService.checkInEncounter(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/clinical/encounters',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<CreateEncounterInput, 'tenantId'>;
      const data = await clinicalWorkflowService.checkInEncounter(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // GET /api/v1/partner/encounters/:id
  fastify.get(
    '/api/v1/partner/encounters/:id',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const encounters = await clinicalWorkflowService.getEncounters(request.session);
      const found = encounters.find(e => e.id === id);
      if (!found) {
        reply.status(404);
        return { success: false, error: { code: 'ENCOUNTER_NOT_FOUND', message: 'Encounter not found' } };
      }
      return { success: true, data: found };
    }
  );

  // ==========================================
  // 3. ICD-10 DIAGNOSES & GENERIC ALTERNATIVES
  // ==========================================

  fastify.get(
    '/api/v1/partner/clinical/icd10',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'read')]
    },
    async (request) => {
      const query = (request.query as { q?: string })?.q;
      const data = await clinicalWorkflowService.searchIcd10(query);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/clinical/medications/generic-alternatives',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'read')]
    },
    async (request) => {
      const query = (request.query as { drug?: string })?.drug;
      const data = await clinicalWorkflowService.getGenericAlternatives(query);
      return { success: true, data };
    }
  );

  // ==========================================
  // 4. CLINICAL CONSULTATIONS & PRESCRIPTIONS
  // ==========================================

  // POST /api/v1/partner/consultations
  fastify.post(
    '/api/v1/partner/consultations',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<SaveConsultationInput, 'tenantId'>;
      const data = await clinicalWorkflowService.saveConsultation(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/clinical/consultations',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<SaveConsultationInput, 'tenantId'>;
      const data = await clinicalWorkflowService.saveConsultation(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // PATCH /api/v1/partner/consultations/:id/finalize
  fastify.patch(
    '/api/v1/partner/consultations/:id/finalize',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await clinicalWorkflowService.finalizeConsultation(id, request.session);
      return { success: true, data };
    }
  );

  fastify.patch(
    '/api/v1/partner/clinical/consultations/:id/finalize',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await clinicalWorkflowService.finalizeConsultation(id, request.session);
      return { success: true, data };
    }
  );

  // ==========================================
  // 5. DIAGNOSTIC INVESTIGATION ORDER BRIDGE TO LIMS
  // ==========================================

  fastify.post(
    '/api/v1/partner/clinical/encounters/:id/orders',
    {
      preHandler: [authenticate, requirePermission('clinical:orders', 'create')]
    },
    async (request, reply) => {
      const { id: encounterId } = request.params as { id: string };
      const { patientId, doctorId, testNames } = request.body as {
        patientId: string;
        doctorId: string;
        testNames: string[];
      };

      const orders = await clinicalWorkflowService.bridgeDiagnosticOrders(
        encounterId,
        patientId,
        doctorId,
        testNames,
        request.session
      );

      reply.status(201);
      return { success: true, data: orders };
    }
  );

  // ==========================================
  // 6. PRESCRIPTION PDF GENERATION
  // ==========================================

  fastify.get(
    '/api/v1/partner/clinical/prescriptions/:id/pdf',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'read')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const pdfBuffer = await clinicalWorkflowService.generatePrescriptionPdf(id, request.session);

      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `inline; filename="prescription-${id}.pdf"`);
      return reply.send(pdfBuffer);
    }
  );

  fastify.get(
    '/api/v1/partner/clinical/consultations/:id/pdf',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'read')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const pdfBuffer = await clinicalWorkflowService.generatePrescriptionPdf(id, request.session);

      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `inline; filename="consultation-${id}.pdf"`);
      return reply.send(pdfBuffer);
    }
  );

  // ==========================================
  // 7. PATIENT CLINICAL HISTORY & EMR TIMELINE
  // ==========================================

  fastify.get(
    '/api/v1/partner/patients/:id/history',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await clinicalWorkflowService.getPatientClinicalHistory(id, request.session);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/clinical/patients/:id/history',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await clinicalWorkflowService.getPatientClinicalHistory(id, request.session);
      return { success: true, data };
    }
  );
};
