import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { pharmacyManagementService } from '../../services/partner/PharmacyManagementService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import {
  type CreateMedicationInput,
  type ReceiveStockInput,
  type DispenseInput
} from '../../repositories/partner/PharmacyManagementRepository.js';

export const CreateMedicationSchema = z.object({
  medicationCode: z.string().trim().min(1, 'medicationCode is mandatory'),
  name: z.string().trim().min(1, 'name is mandatory'),
  genericName: z.string().optional().default(''),
  brandName: z.string().optional(),
  dosageForm: z.string().optional().default('TABLET'),
  strength: z.string().optional().default('500mg'),
  category: z.string().optional(),
  scheduleType: z.string().optional(),
  unitPrice: z.number().nonnegative().optional().default(10.0),
  unitOfMeasure: z.string().optional(),
  isHighAlert: z.boolean().optional(),
  isLasam: z.boolean().optional()
});

export const ReceiveStockSchema = z.object({
  medicationId: z.string().trim().min(1, 'medicationId is mandatory'),
  batchNumber: z.string().trim().min(1, 'batchNumber is mandatory'),
  manufacturer: z.string().optional().default('Standard Pharma'),
  manufacturingDate: z.string().optional().default('2026-01-01'),
  expiryDate: z.string().trim().min(1, 'expiryDate is mandatory'),
  quantity: z.number().positive().optional(),
  receivedQuantity: z.number().positive().optional(),
  unitCost: z.number().nonnegative().optional(),
  unitCostPrice: z.number().nonnegative().optional(),
  supplierReference: z.string().optional(),
  supplierName: z.string().optional(),
  invoiceNumber: z.string().optional()
}).refine(
  (data) => (data.quantity !== undefined && data.quantity > 0) || (data.receivedQuantity !== undefined && data.receivedQuantity > 0),
  { message: 'quantity or receivedQuantity must be a positive number' }
);

export const DispenseItemSchema = z.object({
  medicationId: z.string().optional(),
  drugCode: z.string().optional(),
  prescriptionItemId: z.string().optional(),
  batchId: z.string().optional(),
  quantity: z.number().positive('quantity must be a positive number'),
  unit: z.string().optional(),
  unitPrice: z.number().nonnegative().optional()
});

export const DispenseSchema = z.object({
  encounterId: z.string().optional(),
  patientId: z.string().trim().min(1, 'patientId is mandatory'),
  doctorId: z.string().optional(),
  prescriptionId: z.string().optional(),
  isPartial: z.boolean().optional(),
  items: z.array(DispenseItemSchema).min(1, 'At least one medication item is mandatory for dispensing')
});

export const pharmacyManagementRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Medicine Master Catalog
  fastify.get(
    '/api/v1/partner/pharmacy/medications',
    {
      preHandler: [authenticate, requirePermission('pharmacy:medications', 'read')]
    },
    async (request) => {
      const query = (request.query as { q?: string })?.q;
      const data = await pharmacyManagementService.getMedications(request.session, query);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/pharmacy/medications',
    {
      preHandler: [authenticate, requirePermission('pharmacy:medications', 'create')]
    },
    async (request, reply) => {
      const parseResult = CreateMedicationSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          message: 'Invalid medication payload: ' + parseResult.error.issues.map((i) => i.message).join('; '),
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400,
          details: parseResult.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      const medInput: Omit<CreateMedicationInput, 'tenantId'> = {
        medicationCode: parseResult.data.medicationCode,
        name: parseResult.data.name,
        genericName: parseResult.data.genericName || parseResult.data.name,
        dosageForm: parseResult.data.dosageForm,
        strength: parseResult.data.strength,
        unitPrice: parseResult.data.unitPrice,
        ...(parseResult.data.brandName ? { brandName: parseResult.data.brandName } : {}),
        ...(parseResult.data.category ? { category: parseResult.data.category } : {}),
        ...(parseResult.data.scheduleType ? { scheduleType: parseResult.data.scheduleType } : {})
      };
      const data = await pharmacyManagementService.createMedication(medInput, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 1.5 Pharmacy Prescription Worklist Queue
  fastify.get(
    '/api/v1/partner/pharmacy/prescriptions',
    {
      preHandler: [authenticate, requirePermission('pharmacy:orders', 'read')]
    },
    async (request) => {
      const status = (request.query as { status?: string })?.status;
      const data = await pharmacyManagementService.getPrescriptionQueue(request.session, status);
      return { success: true, data };
    }
  );

  // 2. Batch Inventory & FEFO
  fastify.get(
    '/api/v1/partner/pharmacy/batches',
    {
      preHandler: [authenticate, requirePermission('pharmacy:inventory', 'read')]
    },
    async (request) => {
      const medicationId = (request.query as { medicationId?: string })?.medicationId;
      const data = await pharmacyManagementService.getBatches(request.session, medicationId);
      return { success: true, data };
    }
  );

  // 3. Stock Procurement / Goods Receipt
  fastify.post(
    '/api/v1/partner/pharmacy/batches/receive-stock',
    {
      preHandler: [authenticate, requirePermission('pharmacy:inventory', 'create')]
    },
    async (request, reply) => {
      const parseResult = ReceiveStockSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          message: 'Invalid stock receipt payload: ' + parseResult.error.issues.map((i) => i.message).join('; '),
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400,
          details: parseResult.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      const q = parseResult.data.quantity ?? parseResult.data.receivedQuantity!;
      const cost = parseResult.data.unitCost ?? parseResult.data.unitCostPrice ?? 0;
      const supplierRef = parseResult.data.supplierReference ?? parseResult.data.invoiceNumber;
      const payload: Omit<ReceiveStockInput, 'tenantId'> = {
        medicationId: parseResult.data.medicationId,
        batchNumber: parseResult.data.batchNumber,
        manufacturer: parseResult.data.manufacturer,
        manufacturingDate: parseResult.data.manufacturingDate,
        expiryDate: parseResult.data.expiryDate,
        quantity: q,
        unitCost: cost,
        ...(supplierRef ? { supplierReference: supplierRef } : {})
      };
      const data = await pharmacyManagementService.receiveStock(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 4. POS Dispensing & Billing
  fastify.post(
    '/api/v1/partner/pharmacy/dispense',
    {
      preHandler: [authenticate, requirePermission('pharmacy:dispense', 'create')]
    },
    async (request, reply) => {
      const parseResult = DispenseSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          message: 'Invalid dispensing payload: ' + parseResult.error.issues.map((i) => i.message).join('; '),
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400,
          details: parseResult.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      const payload = parseResult.data as unknown as Omit<DispenseInput, 'tenantId' | 'pharmacistId' | 'pharmacistName'>;
      const data = await pharmacyManagementService.dispense(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 5. Stock Movement Ledger
  fastify.get(
    '/api/v1/partner/pharmacy/stock-movements',
    {
      preHandler: [authenticate, requirePermission('pharmacy:inventory', 'read')]
    },
    async (request) => {
      const medicationId = (request.query as { medicationId?: string })?.medicationId;
      const data = await pharmacyManagementService.getStockMovements(request.session, medicationId);
      return { success: true, data };
    }
  );

  // 6. Patient Medication History
  fastify.get(
    '/api/v1/partner/patients/:id/medication-history',
    {
      preHandler: [authenticate, requirePermission('pharmacy:medications', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await pharmacyManagementService.getPatientMedicationHistory(request.session, id);
      return { success: true, data };
    }
  );
};
