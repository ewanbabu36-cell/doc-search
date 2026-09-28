import { randomUUID } from 'node:crypto';
import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import { getDatabase, auditEvents } from '@docsearch/database';
import { clinicalWorkflowService } from '../../services/partner/ClinicalWorkflowService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import { requireModuleCommercialAccess } from '../../plugins/commercial-guard.js';
import { enforceIdempotency } from '../../plugins/idempotency.js';
import {
  type CreatePatientInput,
  type CreateEncounterInput,
  type SaveConsultationInput,
  type CreateQueueTokenInput,
  type CreatePrescriptionInput
} from '../../repositories/partner/ClinicalWorkflowRepository.js';

export const CreatePatientSchema = z.object({
  firstName: z.string().trim().min(1, 'firstName is required'),
  lastName: z.string().trim().min(1, 'lastName is required'),
  gender: z.string().trim().min(1, 'gender is required'),
  dateOfBirth: z.string().trim().optional(),
  mobileNumber: z.string().trim().optional(),
  bloodGroup: z.string().trim().optional(),
  partnerId: z.string().trim().optional(),
  organizationId: z.string().trim().optional(),
  branchId: z.string().trim().optional(),
  departmentId: z.string().trim().optional(),
  tenantId: z.string().trim().optional(),
  mrn: z.string().trim().optional()
});

export const CreateEncounterSchema = z.object({
  patientId: z.string().trim().min(1, 'patientId is required'),
  doctorId: z.string().trim().optional(),
  encounterType: z.string().trim().optional(),
  status: z.string().trim().optional(),
  chiefComplaint: z.string().trim().optional(),
  visitType: z.string().trim().optional(),
  partnerId: z.string().trim().optional(),
  organizationId: z.string().trim().optional(),
  branchId: z.string().trim().optional(),
  departmentId: z.string().trim().optional(),
  tenantId: z.string().trim().optional()
});

export const UpdateEncounterStatusSchema = z.object({
  status: z.string().trim().min(1, 'status is required')
});

export const CheckoutEncounterSchema = z.object({
  forceDischarge: z.boolean().optional().default(false),
  overrideReason: z.string().trim().optional(),
  notes: z.string().trim().optional()
}).refine((data) => {
  if (data.forceDischarge && (!data.overrideReason || data.overrideReason.length < 5)) {
    return false;
  }
  return true;
}, {
  message: 'A valid override reason (minimum 5 characters) is required when force discharge is requested.',
  path: ['overrideReason']
});

export const CreateQueueTokenSchema = z.object({
  encounterId: z.string().trim().min(1, 'encounterId is required'),
  doctorId: z.string().trim().optional(),
  branchId: z.string().trim().optional(),
  departmentId: z.string().trim().optional(),
  queueDate: z.string().trim().optional(),
  estimatedWaitMinutes: z.number().int().positive().optional(),
  metadata: z.record(z.any()).optional()
});

export const SaveConsultationSchema = z.object({
  encounterId: z.string().trim().min(1, 'encounterId is required'),
  patientId: z.string().trim().min(1, 'patientId is required'),
  doctorId: z.string().trim().optional(),
  status: z.string().trim().optional(),
  chiefComplaint: z.string().trim().optional(),
  historyOfPresentIllness: z.string().trim().optional(),
  pastMedicalHistory: z.string().trim().optional(),
  examinationNotes: z.string().trim().optional(),
  assessmentNotes: z.string().trim().optional(),
  planNotes: z.string().trim().optional(),
  vitals: z.record(z.any()).optional(),
  diagnoses: z.union([z.array(z.string()), z.array(z.record(z.any()))]).optional(),
  medications: z.array(z.record(z.any())).optional(),
  prescriptions: z.array(z.record(z.any())).optional(),
  investigations: z.union([
    z.array(z.string()),
    z.array(z.record(z.any())),
    z.record(z.any())
  ]).optional(),
  labInvestigations: z.union([
    z.array(z.string()),
    z.array(z.record(z.any())),
    z.record(z.any())
  ]).optional(),
  followUpAdvice: z.string().trim().optional(),
  partnerId: z.string().trim().optional(),
  organizationId: z.string().trim().optional(),
  branchId: z.string().trim().optional()
}).passthrough();

export const CreatePrescriptionSchema = z.object({
  patientId: z.string().trim().min(1, 'patientId is required'),
  encounterId: z.string().trim().optional(),
  consultationId: z.string().trim().optional(),
  prescribingDoctorId: z.string().trim().optional(),
  doctorId: z.string().trim().optional(),
  priority: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  items: z.array(z.object({
    medicationId: z.string().trim().optional(),
    medicationName: z.string().trim().optional(),
    dosage: z.string().trim().optional(),
    frequency: z.string().trim().optional(),
    route: z.string().trim().optional(),
    duration: z.union([z.number(), z.string()]).optional(),
    durationUnit: z.string().trim().optional(),
    prescribedQuantity: z.union([z.number(), z.string()]).optional(),
    quantity: z.union([z.number(), z.string()]).optional(),
    instructions: z.string().trim().optional()
  })).optional()
});

export const BridgeOrdersSchema = z.object({
  patientId: z.string().trim().min(1, 'patientId is required'),
  doctorId: z.string().trim().min(1, 'doctorId is required'),
  testNames: z.array(z.string().trim().min(1)).min(1, 'At least one testName is required')
});

export const CreateAppointmentSchema = z.object({
  patientId: z.string().trim().min(1, 'patientId is required'),
  doctorId: z.string().trim().min(1, 'doctorId is required'),
  slotTime: z.string().trim().min(1, 'slotTime is required'),
  branchId: z.string().trim().optional(),
  departmentId: z.string().trim().optional(),
  appointmentType: z.string().trim().optional(),
  reason: z.string().trim().optional(),
  metadata: z.record(z.any()).optional()
});

export const RescheduleAppointmentSchema = z.object({
  newSlotTime: z.string().trim().min(1, 'newSlotTime is required'),
  reason: z.string().trim().optional()
});

export const CancelAppointmentSchema = z.object({
  reason: z.string().trim().optional()
});

export const RecordEncounterVitalsSchema = z.object({
  systolicBp: z.number({ required_error: 'systolicBp is required' }).min(40).max(300),
  diastolicBp: z.number({ required_error: 'diastolicBp is required' }).min(20).max(200),
  pulseRateBpm: z.number({ required_error: 'pulseRateBpm is required' }).min(20).max(300),
  temperatureFahrenheit: z.number().optional(),
  respiratoryRate: z.number().optional(),
  oxygenSaturationPercent: z.number().min(0).max(100).optional(),
  weightKg: z.number().optional(),
  heightCm: z.number().optional(),
  bmi: z.number().optional(),
  randomBloodSugarMgDl: z.number().optional(),
  notes: z.string().trim().optional(),
  recordedBy: z.string().trim().optional()
});

export const CreateOpdPaymentSchema = z.object({
  amount: z.number({ required_error: 'amount is required' }).positive('Payment amount must be greater than zero'),
  paymentMethod: z.string().trim().optional(),
  consultationFee: z.number().optional(),
  registrationFee: z.number().optional(),
  notes: z.string().trim().optional(),
  collectedBy: z.string().trim().optional()
});

export const CreateReferralSchema = z.object({
  patientId: z.string().trim().min(1, 'patientId is required'),
  encounterId: z.string().trim().min(1, 'encounterId is required'),
  referralType: z.string().trim().min(1, 'referralType is required'),
  referringDoctorId: z.string().trim().optional(),
  destinationDepartmentId: z.string().trim().optional(),
  destinationDoctorId: z.string().trim().optional(),
  destinationFacilityName: z.string().trim().optional(),
  clinicalSummary: z.string().trim().min(1, 'clinicalSummary is required'),
  urgency: z.string().trim().optional()
});

export const UpdateReferralStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'COMPLETED']),
  notes: z.string().trim().optional()
});

export const CreateClinicalAlertSchema = z.object({
  patientMrn: z.string().trim().min(1, 'patientMrn is required'),
  patientName: z.string().trim().min(1, 'patientName is required'),
  category: z.string().trim().min(1, 'category is required'),
  urgencyLevel: z.string().trim().min(1, 'urgencyLevel is required'),
  clinicalRiskSummary: z.string().trim().min(1, 'clinicalRiskSummary is required'),
  testName: z.string().trim().optional(),
  measuredValue: z.string().trim().optional(),
  normalRange: z.string().trim().optional(),
  referenceNormalRange: z.string().trim().optional(),
  panicThreshold: z.string().trim().optional(),
  doctorName: z.string().trim().optional(),
  location: z.string().trim().optional(),
  branchId: z.string().trim().optional()
});

export const AcknowledgeClinicalAlertSchema = z.object({
  doctorName: z.string().trim().optional()
});

export const CreateFollowUpSchema = z.object({
  patientId: z.string().trim().min(1, 'patientId is required'),
  consultationId: z.string().trim().optional(),
  encounterId: z.string().trim().optional(),
  doctorId: z.string().trim().optional(),
  recommendedDate: z.string().trim().optional(),
  followUpDate: z.string().trim().optional(),
  reason: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  recordedBy: z.string().trim().optional()
});

export const ConvertFollowUpToAppointmentSchema = z.object({
  doctorId: z.string().trim().optional(),
  slotTime: z.string().trim().min(1, 'slotTime is required'),
  departmentId: z.string().trim().optional()
});

function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const parsed = schema.safeParse(body || {});
  if (!parsed.success) {
    throw new AppError({
      message: parsed.error.issues.map((i) => i.message).join('; '),
      code: ErrorCode.VALIDATION_ERROR,
      statusCode: 400
    });
  }
  return parsed.data;
}

function stripUndefined<T extends Record<string, any>>(obj: T): any {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

export const clinicalWorkflowRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', requireModuleCommercialAccess('CLINICAL_EMR'));

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
      const qObj = (request.query || {}) as { q?: string; tenantId?: string; branchId?: string; departmentId?: string };
      const data = await clinicalWorkflowService.searchPatients(request.session, qObj.q, {
        tenantId: qObj.tenantId,
        branchId: qObj.branchId,
        departmentId: qObj.departmentId
      });
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
      const qObj = (request.query || {}) as { q?: string; tenantId?: string; branchId?: string; departmentId?: string };
      const data = await clinicalWorkflowService.searchPatients(request.session, qObj.q, {
        tenantId: qObj.tenantId,
        branchId: qObj.branchId,
        departmentId: qObj.departmentId
      });
      return { success: true, data };
    }
  );

  // POST /api/v1/partner/patients
  fastify.post(
    '/api/v1/partner/patients',
    {
      preHandler: [authenticate, requirePermission('clinical:patients', 'create'), enforceIdempotency]
    },
    async (request, reply) => {
      const payload = validateBody(CreatePatientSchema, request.body) as Omit<CreatePatientInput, 'tenantId'>;
      const data = await clinicalWorkflowService.createPatient(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/clinical/patients',
    {
      preHandler: [authenticate, requirePermission('clinical:patients', 'create'), enforceIdempotency]
    },
    async (request, reply) => {
      const payload = validateBody(CreatePatientSchema, request.body) as Omit<CreatePatientInput, 'tenantId'>;
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

  // GET /api/v1/partner/clinical/patients/:id (Clinical namespace alias)
  fastify.get(
    '/api/v1/partner/clinical/patients/:id',
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
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = request.body as Partial<CreatePatientInput>;
      const updated = await clinicalWorkflowService.updatePatient(id, payload, request.session);
      if (!updated) {
        reply.status(404);
        return { success: false, error: { code: 'PATIENT_NOT_FOUND', message: 'Patient not found' } };
      }
      return { success: true, data: updated };
    }
  );

  fastify.patch(
    '/api/v1/partner/clinical/patients/:id',
    {
      preHandler: [authenticate, requirePermission('clinical:patients', 'update')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = request.body as Partial<CreatePatientInput>;
      const updated = await clinicalWorkflowService.updatePatient(id, payload, request.session);
      if (!updated) {
        reply.status(404);
        return { success: false, error: { code: 'PATIENT_NOT_FOUND', message: 'Patient not found' } };
      }
      return { success: true, data: updated };
    }
  );

  // ==========================================
  // 1.1 PHI EXPORT AUDIT LOGGING (BUG-009)
  // ==========================================
  const handlePhiExport = async (request: any, reply: any) => {
    const { format = 'json', reason = 'CLINICAL_EXPORT' } = (request.query as { format?: string; reason?: string }) || {};
    const patients = await clinicalWorkflowService.searchPatients(request.session);
    const patientIds = patients.map((p) => p.id);

    // Emit structured PHI audit log into core.audit_events
    try {
      const db: any = getDatabase();
      if (db) {
        await db.insert(auditEvents).values({
          id: randomUUID(),
          tenantId: request.session.tenantId,
          branchId: request.session.branchId || null,
          actorId: request.session.userId,
          eventType: 'PHI_EXPORT',
          resourceType: 'PATIENT_EXPORT',
          resourceId: `export_${Date.now()}`,
          correlationId: request.id || 'unknown',
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']?.slice(0, 500) || 'unknown',
          metadata: {
            action: 'PHI_EXPORT',
            recordCount: patients.length,
            patientIds: patientIds.slice(0, 50),
            reason: String(reason).slice(0, 200),
            format,
            exportedAt: new Date().toISOString()
          }
        });
      }
    } catch (auditErr) {
      fastify.log.error({ err: auditErr }, 'Failed to log PHI export audit event');
    }

    if (format === 'csv') {
      const headers = ['id', 'mrn', 'firstName', 'lastName', 'gender', 'dateOfBirth', 'mobileNumber'];
      const csvRows = [headers.join(',')];
      for (const p of patients) {
        const pAny = p as any;
        const dob = p.dateOfBirth ? String(p.dateOfBirth) : '';
        const phone = pAny.mobileNumber || pAny.primaryPhone || '';
        csvRows.push([p.id, p.mrn, p.firstName, p.lastName, p.gender, dob, phone].join(','));
      }
      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', 'attachment; filename="patients-export.csv"');
      return reply.send(csvRows.join('\n'));
    }

    return {
      success: true,
      data: {
        recordCount: patients.length,
        patients
      }
    };
  };

  fastify.get(
    '/api/v1/partner/clinical/patients/export',
    {
      preHandler: [authenticate, requirePermission('clinical:patients', 'read')]
    },
    handlePhiExport
  );

  fastify.get(
    '/api/v1/partner/patients/export',
    {
      preHandler: [authenticate, requirePermission('clinical:patients', 'read')]
    },
    handlePhiExport
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
      const payload = validateBody(CreateEncounterSchema, request.body) as Omit<CreateEncounterInput, 'tenantId'>;
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
      const payload = validateBody(CreateEncounterSchema, request.body) as Omit<CreateEncounterInput, 'tenantId'>;
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
      const payload = validateBody(CreateEncounterSchema, request.body) as Omit<CreateEncounterInput, 'tenantId'>;
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

  fastify.get(
    '/api/v1/partner/clinical/encounters/:id',
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

  // PATCH /api/v1/partner/encounters/:id/status
  fastify.patch(
    '/api/v1/partner/encounters/:id/status',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const { status } = validateBody(UpdateEncounterStatusSchema, request.body);
      const data = await clinicalWorkflowService.updateEncounterStatus(id, status, request.session);
      return { success: true, data };
    }
  );

  fastify.patch(
    '/api/v1/partner/clinical/encounters/:id/status',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const { status } = validateBody(UpdateEncounterStatusSchema, request.body);
      const data = await clinicalWorkflowService.updateEncounterStatus(id, status, request.session);
      return { success: true, data };
    }
  );

  // ==========================================
  // 3. OPERATIONAL QUEUE & TOKEN MANAGEMENT
  // ==========================================

  // POST /api/v1/partner/clinical/queues/tokens & alias /queue-tokens
  const createQueueTokenHandler = async (request: any, reply: any) => {
    const payload = validateBody(CreateQueueTokenSchema, request.body) as Omit<CreateQueueTokenInput, 'tenantId'>;
    const data = await clinicalWorkflowService.createQueueToken(payload, request.session);
    reply.status(201);
    return { success: true, data };
  };

  fastify.post(
    '/api/v1/partner/clinical/queues/tokens',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    createQueueTokenHandler
  );

  fastify.post(
    '/api/v1/partner/clinical/queue-tokens',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    createQueueTokenHandler
  );

  // GET /api/v1/partner/clinical/queues
  fastify.get(
    '/api/v1/partner/clinical/queues',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request) => {
      const q = request.query as { branchId?: string; doctorId?: string; queueDate?: string; queueStatus?: string };
      const data = await clinicalWorkflowService.getQueue(q || {}, request.session);
      return { success: true, data };
    }
  );

  // PATCH /api/v1/partner/clinical/queues/:id/call
  fastify.patch(
    '/api/v1/partner/clinical/queues/:id/call',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await clinicalWorkflowService.callQueueToken(id, request.session);
      return { success: true, data };
    }
  );

  // PATCH /api/v1/partner/clinical/encounters/:id/call
  fastify.patch(
    '/api/v1/partner/clinical/encounters/:id/call',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      try {
        const data = await clinicalWorkflowService.callQueueToken(id, request.session);
        return { success: true, data };
      } catch {
        const data = await clinicalWorkflowService.updateEncounterStatus(id, 'IN_CONSULTATION', request.session);
        return { success: true, data };
      }
    }
  );

  // PATCH /api/v1/partner/clinical/queues/:id/start
  fastify.patch(
    '/api/v1/partner/clinical/queues/:id/start',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await clinicalWorkflowService.startQueueToken(id, request.session);
      return { success: true, data };
    }
  );

  // PATCH /api/v1/partner/clinical/queues/:id/complete
  fastify.patch(
    '/api/v1/partner/clinical/queues/:id/complete',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await clinicalWorkflowService.completeQueueToken(id, request.session);
      return { success: true, data };
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

  // GET /api/v1/partner/consultations
  fastify.get(
    '/api/v1/partner/consultations',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'read')]
    },
    async (request) => {
      const query = (request.query as { doctorId?: string; patientId?: string; encounterId?: string; status?: string; searchTerm?: string }) || {};
      const data = await clinicalWorkflowService.searchConsultations(query, request.session);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/clinical/consultations',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'read')]
    },
    async (request) => {
      const query = (request.query as { doctorId?: string; patientId?: string; encounterId?: string; status?: string; searchTerm?: string }) || {};
      const data = await clinicalWorkflowService.searchConsultations(query, request.session);
      return { success: true, data };
    }
  );

  // GET /api/v1/partner/consultations/overview
  fastify.get(
    '/api/v1/partner/consultations/overview',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'read')]
    },
    async (request) => {
      const data = await clinicalWorkflowService.getConsultationOverview(request.session);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/clinical/consultations/overview',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'read')]
    },
    async (request) => {
      const data = await clinicalWorkflowService.getConsultationOverview(request.session);
      return { success: true, data };
    }
  );

  // GET /api/v1/partner/consultations/encounter/:encounterId
  fastify.get(
    '/api/v1/partner/consultations/encounter/:encounterId',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'read')]
    },
    async (request, reply) => {
      const { encounterId } = request.params as { encounterId: string };
      const data = await clinicalWorkflowService.getConsultationByEncounter(encounterId, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'CONSULTATION_NOT_FOUND', message: 'Consultation not found for encounter' } };
      }
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/clinical/consultations/encounter/:encounterId',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'read')]
    },
    async (request, reply) => {
      const { encounterId } = request.params as { encounterId: string };
      const data = await clinicalWorkflowService.getConsultationByEncounter(encounterId, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'CONSULTATION_NOT_FOUND', message: 'Consultation not found for encounter' } };
      }
      return { success: true, data };
    }
  );

  // GET /api/v1/partner/consultations/:id
  fastify.get(
    '/api/v1/partner/consultations/:id',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'read')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await clinicalWorkflowService.getConsultationById(id, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'CONSULTATION_NOT_FOUND', message: 'Consultation not found' } };
      }
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/clinical/consultations/:id',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'read')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await clinicalWorkflowService.getConsultationById(id, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'CONSULTATION_NOT_FOUND', message: 'Consultation not found' } };
      }
      return { success: true, data };
    }
  );

  // POST /api/v1/partner/consultations
  fastify.post(
    '/api/v1/partner/consultations',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'create'), enforceIdempotency]
    },
    async (request, reply) => {
      const payload = validateBody(SaveConsultationSchema, request.body) as Omit<SaveConsultationInput, 'tenantId'>;
      const data = await clinicalWorkflowService.saveConsultation(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/clinical/consultations',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'create'), enforceIdempotency]
    },
    async (request, reply) => {
      const payload = validateBody(SaveConsultationSchema, request.body) as Omit<SaveConsultationInput, 'tenantId'>;
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

  // POST /api/v1/partner/consultations/:id/complete
  fastify.post(
    '/api/v1/partner/consultations/:id/complete',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'update'), enforceIdempotency]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const doctorId = (request.body as any)?.doctorId;
      const data = await clinicalWorkflowService.completeConsultationWorkflow(id, doctorId, request.session);
      return { success: true, data };
    }
  );

  // POST /api/v1/partner/clinical/consultations/:id/complete
  fastify.post(
    '/api/v1/partner/clinical/consultations/:id/complete',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'update'), enforceIdempotency]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const doctorId = (request.body as any)?.doctorId;
      const data = await clinicalWorkflowService.completeConsultationWorkflow(id, doctorId, request.session);
      return { success: true, data };
    }
  );

  // POST /api/v1/partner/consultations/:id/retry-orders
  fastify.post(
    '/api/v1/partner/consultations/:id/retry-orders',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await clinicalWorkflowService.retryDownstreamOrders(id, request.session);
      return { success: true, data };
    }
  );

  // POST /api/v1/partner/clinical/consultations/:id/retry-orders
  fastify.post(
    '/api/v1/partner/clinical/consultations/:id/retry-orders',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await clinicalWorkflowService.retryDownstreamOrders(id, request.session);
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
      const { patientId, doctorId, testNames } = validateBody(BridgeOrdersSchema, request.body);

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
  // 6. PRESCRIPTIONS (POSTGRESQL-BACKED)
  // ==========================================

  fastify.post(
    '/api/v1/partner/prescriptions',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'create')]
    },
    async (request, reply) => {
      const payload = validateBody(CreatePrescriptionSchema, request.body) as Omit<CreatePrescriptionInput, 'tenantId'>;
      const data = await clinicalWorkflowService.createPrescription(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/clinical/prescriptions',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'create')]
    },
    async (request, reply) => {
      const payload = validateBody(CreatePrescriptionSchema, request.body) as Omit<CreatePrescriptionInput, 'tenantId'>;
      const data = await clinicalWorkflowService.createPrescription(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // ==========================================
  // 6. PRESCRIPTION PDF GENERATION
  // ==========================================

  fastify.get(
    '/api/v1/partner/clinical/prescriptions/:id/pdf',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'print')]
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
      preHandler: [authenticate, requirePermission('clinical:consultations', 'print')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const pdfBuffer = await clinicalWorkflowService.generateConsultationPdf(id, request.session);

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

  // ==========================================
  // 8. CENTRAL EXIT HUB & PATIENT CHECKOUT
  // ==========================================

  fastify.get(
    '/api/v1/partner/clinical/exit-hub/patients',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request) => {
      const search = (request.query as any)?.search as string | undefined;
      const data = await clinicalWorkflowService.getExitHubPatients(request.session, search);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/clinical/encounters/:id/checkout',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = validateBody(CheckoutEncounterSchema, request.body || {});
      const data = await clinicalWorkflowService.checkoutEncounter(id, body, request.session);
      return { success: true, data };
    }
  );

  // ==========================================
  // 9. OPD CORE: APPOINTMENT LIFECYCLE
  // ==========================================

  // POST /api/v1/partner/clinical/appointments
  fastify.post(
    '/api/v1/partner/clinical/appointments',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create'), enforceIdempotency]
    },
    async (request, reply) => {
      const payload = stripUndefined(validateBody(CreateAppointmentSchema, request.body));
      const data = await clinicalWorkflowService.createAppointment(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // GET /api/v1/partner/clinical/appointments
  fastify.get(
    '/api/v1/partner/clinical/appointments',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request) => {
      const query = (request.query || {}) as { doctorId?: string; patientId?: string; startDate?: string; endDate?: string; status?: string; branchId?: string; departmentId?: string };
      const data = await clinicalWorkflowService.getAppointments(request.session, query);
      return { success: true, data };
    }
  );

  // GET /api/v1/partner/clinical/appointments/:id
  fastify.get(
    '/api/v1/partner/clinical/appointments/:id',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await clinicalWorkflowService.getAppointmentById(id, request.session);
      return { success: true, data };
    }
  );

  // PUT /api/v1/partner/clinical/appointments/:id/reschedule
  fastify.put(
    '/api/v1/partner/clinical/appointments/:id/reschedule',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const { newSlotTime, reason } = validateBody(RescheduleAppointmentSchema, request.body);
      const data = await clinicalWorkflowService.rescheduleAppointment(id, newSlotTime, request.session, reason);
      return { success: true, data };
    }
  );

  // PUT /api/v1/partner/clinical/appointments/:id/cancel
  fastify.put(
    '/api/v1/partner/clinical/appointments/:id/cancel',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const { reason } = validateBody(CancelAppointmentSchema, request.body || {});
      const data = await clinicalWorkflowService.cancelAppointment(id, reason || 'Patient requested cancellation', request.session);
      return { success: true, data };
    }
  );

  // POST /api/v1/partner/clinical/appointments/:id/check-in
  fastify.post(
    '/api/v1/partner/clinical/appointments/:id/check-in',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await clinicalWorkflowService.checkInAppointment(id, request.session);
      return { success: true, data };
    }
  );

  // ==========================================
  // 10. OPD CORE: TRIAGE VITALS & CDSS
  // ==========================================

  // POST /api/v1/partner/clinical/encounters/:id/vitals
  fastify.post(
    '/api/v1/partner/clinical/encounters/:id/vitals',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'update')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = stripUndefined(validateBody(RecordEncounterVitalsSchema, request.body));
      const pulse = payload.pulseBpm ?? payload.pulseRateBpm ?? 72;
      const data = await clinicalWorkflowService.recordEncounterVitals(id, {
        ...payload,
        pulseBpm: pulse
      }, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // GET /api/v1/partner/clinical/encounters/:id/vitals
  fastify.get(
    '/api/v1/partner/clinical/encounters/:id/vitals',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await clinicalWorkflowService.getEncounterVitals(id, request.session);
      return { success: true, data };
    }
  );

  // ==========================================
  // 11. OPD CORE: PAYMENT & BILLING
  // ==========================================

  // POST /api/v1/partner/clinical/encounters/:id/payments
  fastify.post(
    '/api/v1/partner/clinical/encounters/:id/payments',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'update')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = stripUndefined(validateBody(CreateOpdPaymentSchema, request.body));
      const data = await clinicalWorkflowService.createOpdPayment(id, payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // GET /api/v1/partner/clinical/invoices/:id
  fastify.get(
    '/api/v1/partner/clinical/invoices/:id',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await clinicalWorkflowService.getOpdInvoice(id, request.session);
      return { success: true, data };
    }
  );

  // ==========================================
  // 12. OPD CORE: REFERRALS & CARE HANDOFF
  // ==========================================

  // POST /api/v1/partner/clinical/referrals
  fastify.post(
    '/api/v1/partner/clinical/referrals',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'create')]
    },
    async (request, reply) => {
      const payload = stripUndefined(validateBody(CreateReferralSchema, request.body));
      const data = await clinicalWorkflowService.createReferral(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // GET /api/v1/partner/clinical/referrals
  fastify.get(
    '/api/v1/partner/clinical/referrals',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'read')]
    },
    async (request) => {
      const query = (request.query || {}) as { patientId?: string; encounterId?: string; status?: string };
      const data = await clinicalWorkflowService.getReferrals(request.session, query);
      return { success: true, data };
    }
  );

  // PUT /api/v1/partner/clinical/referrals/:id/status
  fastify.put(
    '/api/v1/partner/clinical/referrals/:id/status',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const { status, notes } = validateBody(UpdateReferralStatusSchema, request.body);
      const data = await clinicalWorkflowService.updateReferralStatus(id, status, request.session, notes);
      return { success: true, data };
    }
  );

  // ==========================================
  // 13. OPD CORE: CLINICAL ALERTS & CDSS PANIC VALUES
  // ==========================================

  // POST /api/v1/partner/clinical/alerts
  fastify.post(
    '/api/v1/partner/clinical/alerts',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'create')]
    },
    async (request, reply) => {
      const payload = stripUndefined(validateBody(CreateClinicalAlertSchema, request.body));
      const data = await clinicalWorkflowService.createClinicalAlert(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // GET /api/v1/partner/clinical/patients/:patientMrn/alerts
  fastify.get(
    '/api/v1/partner/clinical/patients/:patientMrn/alerts',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'read')]
    },
    async (request) => {
      const { patientMrn } = request.params as { patientMrn: string };
      const data = await clinicalWorkflowService.getPatientClinicalAlerts(patientMrn, request.session);
      return { success: true, data };
    }
  );

  // PUT /api/v1/partner/clinical/alerts/:id/acknowledge
  fastify.put(
    '/api/v1/partner/clinical/alerts/:id/acknowledge',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const { doctorName } = validateBody(AcknowledgeClinicalAlertSchema, request.body || {});
      const data = await clinicalWorkflowService.acknowledgeClinicalAlert(id, doctorName || 'Attending Physician', request.session);
      return { success: true, data };
    }
  );

  // ==========================================
  // 13B. OPD CORE: PATIENT ALLERGY REGISTRY & CONTRAINDICATIONS
  // ==========================================

  // GET /api/v1/partner/clinical/patients/:id/allergies
  const getPatientAllergiesHandler = async (request: any) => {
    const { id } = request.params as { id: string };
    const data = await clinicalWorkflowService.getPatientAllergies(id, request.session);
    return { success: true, data };
  };

  fastify.get(
    '/api/v1/partner/clinical/patients/:id/allergies',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'read')]
    },
    getPatientAllergiesHandler
  );
  fastify.get(
    '/api/v1/partner/patients/:id/allergies',
    {
      preHandler: [authenticate, requirePermission('clinical:patients', 'read')]
    },
    getPatientAllergiesHandler
  );

  // POST /api/v1/partner/clinical/patients/:id/allergies
  const recordPatientAllergyHandler = async (request: any) => {
    const { id } = request.params as { id: string };
    const body = (request.body || {}) as any;
    if (!body.allergen) {
      throw new AppError({ message: 'Allergen name is required', statusCode: 400 });
    }
    const data = await clinicalWorkflowService.recordPatientAllergy(id, body, request.session);
    return { success: true, data };
  };

  fastify.post(
    '/api/v1/partner/clinical/patients/:id/allergies',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'create')]
    },
    recordPatientAllergyHandler
  );
  fastify.post(
    '/api/v1/partner/patients/:id/allergies',
    {
      preHandler: [authenticate, requirePermission('clinical:patients', 'update')]
    },
    recordPatientAllergyHandler
  );

  // PATCH /api/v1/partner/clinical/patients/:id/allergies/:allergyId
  const updatePatientAllergyStatusHandler = async (request: any) => {
    const { id, allergyId } = request.params as { id: string; allergyId: string };
    const body = (request.body || {}) as any;
    const status = body.status || 'RESOLVED';
    const data = await clinicalWorkflowService.updatePatientAllergyStatus(id, allergyId, status, request.session);
    return { success: true, data };
  };

  fastify.patch(
    '/api/v1/partner/clinical/patients/:id/allergies/:allergyId',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'update')]
    },
    updatePatientAllergyStatusHandler
  );
  fastify.patch(
    '/api/v1/partner/patients/:id/allergies/:allergyId',
    {
      preHandler: [authenticate, requirePermission('clinical:patients', 'update')]
    },
    updatePatientAllergyStatusHandler
  );

  // ==========================================
  // 14. OPD CORE: FOLLOW-UP RECOMMENDATIONS & CONVERSION
  // ==========================================

  // POST /api/v1/partner/clinical/follow-ups
  fastify.post(
    '/api/v1/partner/clinical/follow-ups',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'create')]
    },
    async (request, reply) => {
      const payload = stripUndefined(validateBody(CreateFollowUpSchema, request.body));
      const data = await clinicalWorkflowService.createFollowUp(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // GET /api/v1/partner/clinical/follow-ups
  fastify.get(
    '/api/v1/partner/clinical/follow-ups',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'read')]
    },
    async (request) => {
      const query = (request.query || {}) as { patientId?: string; doctorId?: string };
      const data = await clinicalWorkflowService.getFollowUps(request.session, query);
      return { success: true, data };
    }
  );

  // POST /api/v1/partner/clinical/follow-ups/:id/convert-to-appointment
  fastify.post(
    '/api/v1/partner/clinical/follow-ups/:id/convert-to-appointment',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = stripUndefined(validateBody(ConvertFollowUpToAppointmentSchema, request.body));
      const data = await clinicalWorkflowService.convertFollowUpToAppointment(id, payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // ==========================================
  // 15. OPD CORE: PRESCRIPTION FINALIZATION & IMMUTABILITY
  // ==========================================

  // POST /api/v1/partner/clinical/prescriptions/:id/finalize
  fastify.post(
    '/api/v1/partner/clinical/prescriptions/:id/finalize',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await clinicalWorkflowService.finalizePrescription(id, request.session);
      return { success: true, data };
    }
  );

  // ==========================================
  // 16. OPD CORE: DOCTOR OPD WORKSPACE
  // ==========================================

  // GET /api/v1/partner/clinical/doctor-workspace
  fastify.get(
    '/api/v1/partner/clinical/doctor-workspace',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'read')]
    },
    async (request) => {
      const query = (request.query || {}) as { doctorId?: string; branchId?: string };
      const doctorId = query.doctorId || request.session.userId;
      const data = await clinicalWorkflowService.getDoctorOpdWorkspace(doctorId, request.session, query.branchId);
      return { success: true, data };
    }
  );
};
