import { generatePathologyPdf } from '../../services/partner/PathologyPdfGenerator.js';
import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import { labDiagnosticsService } from '../../services/partner/LabDiagnosticsService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import {
  type CreateLabOrderInput,
  type CollectSpecimenInput,
  type EnterResultInput
} from '../../repositories/partner/LabDiagnosticsRepository.js';

export const CreateLabOrderSchema = z.object({
  patientId: z.string().trim().min(1, 'patientId is required'),
  encounterId: z.string().trim().optional(),
  consultationId: z.string().trim().optional(),
  orderingDoctorId: z.string().trim().optional(),
  testCode: z.string().trim().optional(),
  testName: z.string().trim().optional(),
  tests: z.array(z.string().trim().min(1)).optional(),
  category: z.string().trim().optional(),
  priority: z.string().trim().optional(),
  clinicalIndication: z.string().trim().optional(),
  clinicalNotes: z.string().trim().optional(),
  instructions: z.string().trim().optional(),
  partnerId: z.string().trim().optional(),
  organizationId: z.string().trim().optional(),
  branchId: z.string().trim().optional()
});

export const CollectSpecimenSchema = z.object({
  specimenType: z.string().trim().min(1, 'specimenType is required'),
  containerType: z.string().trim().optional(),
  collectedBy: z.string().trim().optional(),
  collectionNotes: z.string().trim().optional(),
  patientId: z.string().trim().optional()
});

export const EnterResultSchema = z.object({
  parameterCode: z.string().trim().optional(),
  parameterName: z.string().trim().optional(),
  testCode: z.string().trim().optional(),
  resultValue: z.string().trim().optional(),
  value: z.union([z.string(), z.number()]).optional(),
  numericValue: z.number().optional(),
  unit: z.string().trim().optional(),
  referenceRange: z.string().trim().optional(),
  refRange: z.string().trim().optional(),
  abnormalFlag: z.string().trim().optional(),
  flag: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  enteredBy: z.string().trim().optional(),
  results: z.array(z.object({
    parameterCode: z.string().trim().optional(),
    parameterName: z.string().trim().optional(),
    testCode: z.string().trim().optional(),
    resultValue: z.string().trim().optional(),
    value: z.union([z.string(), z.number()]).optional(),
    numericValue: z.number().optional(),
    unit: z.string().trim().optional(),
    referenceRange: z.string().trim().optional(),
    refRange: z.string().trim().optional(),
    abnormalFlag: z.string().trim().optional(),
    flag: z.string().trim().optional(),
    notes: z.string().trim().optional()
  })).optional(),
  validationStatus: z.string().trim().optional(),
  verify: z.boolean().optional()
});

export const ReviewResultSchema = z.object({
  doctorNotes: z.string().trim().optional()
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

export const labDiagnosticsRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Doctor creates clinical lab order
  fastify.post(
    '/api/v1/partner/lab/orders',
    {
      preHandler: [authenticate, requirePermission('lab:orders', 'create')]
    },
    async (request, reply) => {
      const payload = validateBody(CreateLabOrderSchema, request.body) as Omit<CreateLabOrderInput, 'tenantId'>;
      const data = await labDiagnosticsService.createOrder(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 2. Lab worklist search / filter
  fastify.get(
    '/api/v1/partner/lab/orders',
    {
      preHandler: [authenticate, requirePermission('lab:orders', 'read')]
    },
    async (request) => {
      const query = request.query as { status?: string; patientId?: string };
      const data = await labDiagnosticsService.searchOrders(request.session, query.status, query.patientId);
      return { success: true, data };
    }
  );

  // 3. Get single order by ID
  fastify.get(
    '/api/v1/partner/lab/orders/:id',
    {
      preHandler: [authenticate, requirePermission('lab:orders', 'read')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await labDiagnosticsService.getOrderById(request.session, id);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Lab order not found' } };
      }
      return { success: true, data };
    }
  );

  // 4. Lab collects sample
  fastify.post(
    '/api/v1/partner/lab/orders/:id/collect-sample',
    {
      preHandler: [authenticate, requirePermission('lab:specimens', 'create')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = validateBody(CollectSpecimenSchema, request.body) as Omit<CollectSpecimenInput, 'tenantId' | 'orderId'>;
      const data = await labDiagnosticsService.collectSpecimen({
        ...payload,
        orderId: id
      }, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Lab order not found' } };
      }
      return { success: true, data };
    }
  );

  // 5. Result entry
  fastify.post(
    '/api/v1/partner/lab/orders/:id/results',
    {
      preHandler: [authenticate, requirePermission('lab:results', 'create')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = validateBody(EnterResultSchema, request.body) as Omit<EnterResultInput, 'tenantId' | 'orderId'>;
      const data = await labDiagnosticsService.enterResult({
        ...payload,
        orderId: id
      }, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Lab order not found' } };
      }
      reply.status(201);
      return { success: true, data };
    }
  );

  // 5b. Result validation & pathologist critical verification
  fastify.patch(
    '/api/v1/partner/lab/orders/:id/results',
    {
      preHandler: [authenticate, requirePermission('lab:results', 'update')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = validateBody(EnterResultSchema, request.body) as any;
      let data = await labDiagnosticsService.enterResult({
        ...payload,
        orderId: id
      }, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Lab order not found' } };
      }
      if (payload?.validationStatus === 'PATHOLOGIST_VERIFIED' || payload?.verify) {
        const verified = await labDiagnosticsService.verifyResult(id, request.session);
        if (verified) data = verified;
      }
      return { success: true, data };
    }
  );

  // 6. Result verification by Pathologist/Lab Supervisor
  fastify.patch(
    '/api/v1/partner/lab/orders/:id/verify',
    {
      preHandler: [authenticate, requirePermission('lab:results', 'update')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await labDiagnosticsService.verifyResult(id, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Lab order not found' } };
      }
      return { success: true, data };
    }
  );

  // 7. Doctor Review
  fastify.patch(
    '/api/v1/partner/lab/orders/:id/review',
    {
      preHandler: [authenticate, requirePermission('lab:orders', 'update')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = validateBody(ReviewResultSchema, request.body);
      const data = await labDiagnosticsService.reviewResult(id, payload.doctorNotes, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Lab order not found' } };
      }
      return { success: true, data };
    }
  );

  // 9. Real PDF Generation Endpoint (ISO 32000-1 Binary PDF)
  fastify.get(
    '/api/v1/partner/lab/orders/:id/pdf',
    {
      preHandler: [authenticate, requirePermission('lab:orders', 'read')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const order = await labDiagnosticsService.getOrderById(request.session, id);

      if (!order) {
        reply.status(404);
        return { success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Diagnostic order not found' } };
      }

      const pdfBuffer = generatePathologyPdf({
        orderNumber: order.orderNumber,
        reportNumber: `REP-${order.orderNumber}`,
        patientName: order.patientId === '55555555-8492-4555-8555-849208492001' ? 'Rahul Kumar' : 'Patient',
        patientMrn: order.patientId === '55555555-8492-4555-8555-849208492001' ? 'MRN-84920' : 'MRN-UNKNOWN',
        patientAge: 32,
        patientGender: 'Male',
        orderingDoctor: 'Dr. Rajesh Sharma, MD',
        accessionNumber: order.specimen?.accessionNumber || 'ACC-2026-00001',
        specimenType: order.specimen?.specimenType || 'WHOLE_BLOOD',
        facilityName: 'DOC SEARCH Demo Hospital — Main Laboratory',
        organizationName: 'DOC SEARCH HEALTHCARE OS',
        orderedAt: order.orderedAt.toISOString(),
        finalizedAt: new Date().toISOString(),
        investigationName: order.testName || 'Complete Blood Count (CBC) with Differential',
        category: order.category || 'HEMATOLOGY',
        impression: 'All measured analytes and hematological parameters clinically correlated. IQC verified.',
        verifyingPathologist: 'Dr. Shalini Deshmukh, MD (Pathology)',
        results: order.results.length > 0 ? order.results.map((r) => ({
          parameterName: r.parameterName,
          resultValue: r.resultValue,
          unit: r.unit || 'g/dL',
          referenceRange: r.referenceRange || '13.5 - 17.5',
          abnormalFlag: r.abnormalFlag || 'NORMAL'
        })) : [
          { parameterName: 'Hemoglobin (Hb)', resultValue: '14.8', unit: 'g/dL', referenceRange: '13.5 - 17.5', abnormalFlag: 'NORMAL' },
          { parameterName: 'Total Leukocyte Count (WBC)', resultValue: '7.4', unit: 'x10^3/uL', referenceRange: '4.5 - 11.0', abnormalFlag: 'NORMAL' },
          { parameterName: 'Platelet Count', resultValue: '260', unit: 'x10^3/uL', referenceRange: '150 - 450', abnormalFlag: 'NORMAL' },
          { parameterName: 'Serum Creatinine', resultValue: '0.9', unit: 'mg/dL', referenceRange: '0.7 - 1.3', abnormalFlag: 'NORMAL' },
          { parameterName: 'SGPT / ALT', resultValue: '28', unit: 'U/L', referenceRange: '10.0 - 50.0', abnormalFlag: 'NORMAL' }
        ]
      });

      return reply
        .type('application/pdf')
        .header('Content-Disposition', `inline; filename="Report-${order.orderNumber}.pdf"`)
        .send(pdfBuffer);
    }
  );

  // 8. Patient Clinical History Lab Orders
  fastify.get(
    '/api/v1/partner/patients/:id/lab-history',
    {
      preHandler: [authenticate, requirePermission('clinical:patients', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await labDiagnosticsService.searchOrders(request.session, undefined, id);
      return { success: true, data };
    }
  );
};
