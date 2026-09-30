import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { pharmacyManagementService } from '../../services/partner/PharmacyManagementService.js';
import { wholesaleInvoiceIngestionService } from '../../services/partner/WholesaleInvoiceIngestionService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import { requireModuleCommercialAccess, requireFeatureEntitlement } from '../../plugins/commercial-guard.js';
import { enforceIdempotency } from '../../plugins/idempotency.js';
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

export const SyncOfflineInvoicesSchema = z.object({
  invoices: z.array(
    z.object({
      clientInvoiceId: z.string().trim().min(1, 'clientInvoiceId is mandatory'),
      invoiceNumber: z.string().trim().min(1, 'invoiceNumber is mandatory'),
      patientName: z.string().trim().min(1, 'patientName is mandatory'),
      patientPhone: z.string().optional(),
      patientUhid: z.string().optional(),
      doctorName: z.string().optional(),
      doctorNmcReg: z.string().optional(),
      paymentMode: z.string().optional().default('CASH'),
      createdAt: z.string().optional().default(() => new Date().toISOString()),
      items: z.array(
        z.object({
          medicationId: z.string().optional(),
          batchId: z.string().optional(),
          batchNumber: z.string().optional(),
          quantity: z.number().positive(),
          unitPrice: z.number().nonnegative()
        })
      ).min(1, 'At least one item is mandatory'),
      grandTotal: z.number().nonnegative()
    })
  ).min(1, 'At least one invoice is required for sync')
});

export const CreateReturnSchema = z.object({
  dispensingId: z.string().trim().min(1, 'dispensingId is mandatory'),
  patientId: z.string().optional(),
  medicationId: z.string().optional(),
  batchId: z.string().optional(),
  quantity: z.number().positive('quantity must be positive'),
  returnReason: z.string().trim().min(1, 'returnReason is mandatory'),
  condition: z.enum(['INTACT_SEALED', 'OPENED_UNUSABLE', 'DAMAGED', 'COMPROMISED']).optional().default('INTACT_SEALED'),
  disposition: z.enum(['RESTOCK', 'QUARANTINE_FOR_DESTRUCTION', 'RETURN_TO_MANUFACTURER']).optional().default('RESTOCK'),
  notes: z.string().optional()
});

export const CreateStockAdjustmentSchema = z.object({
  medicationId: z.string().trim().min(1, 'medicationId is mandatory'),
  batchId: z.string().trim().min(1, 'batchId is mandatory'),
  reason: z.string().trim().min(1, 'reason is mandatory'),
  justification: z.string().trim().min(1, 'justification is mandatory'),
  adjustmentQuantity: z.number().int('adjustmentQuantity must be an integer'),
  approvedBy: z.string().optional()
});

export const CreateBatchRecallSchema = z.object({
  batchId: z.string().trim().min(1, 'batchId is mandatory'),
  reason: z.string().trim().min(1, 'reason is mandatory')
});

export const CreateWholesaleCustomerSchema = z.object({
  businessName: z.string().trim().min(1, 'businessName is mandatory'),
  customerType: z.string().optional().default('PHARMACY_RETAIL'),
  contactPerson: z.string().trim().min(1, 'contactPerson is mandatory'),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  billingAddress: z.string().trim().min(1, 'billingAddress is mandatory'),
  shippingAddress: z.string().optional(),
  gstin: z.string().optional(),
  dlNumber: z.string().trim().min(1, 'dlNumber is mandatory'),
  dlExpiryDate: z.string().optional(),
  creditTermsDays: z.number().nonnegative().optional(),
  creditLimit: z.number().nonnegative().optional()
});

export const CreateWholesaleSalesOrderSchema = z.object({
  customerId: z.string().trim().min(1, 'customerId is mandatory'),
  buyerName: z.string().optional(),
  buyerGstin: z.string().optional(),
  buyerDlNo: z.string().optional(),
  branchId: z.string().optional(),
  requestedDeliveryDate: z.string().optional(),
  paymentTerms: z.string().optional(),
  items: z.array(
    z.object({
      medicationId: z.string().trim().min(1, 'medicationId is mandatory'),
      batchId: z.string().optional(),
      quantity: z.number().positive('quantity must be positive'),
      unitPrice: z.number().nonnegative('unitPrice must be non-negative'),
      gstRate: z.number().nonnegative().optional(),
      discountPercent: z.number().nonnegative().optional()
    })
  ).min(1, 'At least one item is mandatory')
});

export const pharmacyManagementRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', requireModuleCommercialAccess('PHARMACY_POS'));

  // 0. Pharmacy Operational Overview
  fastify.get(
    '/api/v1/partner/pharmacy/overview',
    {
      preHandler: [authenticate, requirePermission('pharmacy:inventory', 'read')]
    },
    async (request) => {
      const data = await pharmacyManagementService.getInventorySnapshot(request.session);
      return { success: true, data };
    }
  );

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

  fastify.get(
    '/api/v1/partner/pharmacy/prescriptions/:id',
    {
      preHandler: [authenticate, requirePermission('pharmacy:orders', 'read')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await pharmacyManagementService.getPrescriptionById(request.session, id);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'NOT_FOUND', message: 'Prescription not found' } };
      }
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

  // 2.5 Live Aggregated Inventory
  fastify.get(
    '/api/v1/partner/pharmacy/inventory',
    {
      preHandler: [authenticate, requirePermission('pharmacy:inventory', 'read')]
    },
    async (request) => {
      const branchId = (request.query as { branchId?: string })?.branchId;
      const data = await pharmacyManagementService.getInventory(request.session, branchId);
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
      preHandler: [authenticate, requireFeatureEntitlement('PHARMACY_DISPENSE'), requirePermission('pharmacy:dispense', 'create'), enforceIdempotency]
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

  // 7. Wholesale Marg ERP Invoice Ingestion (CAP-04 Wholesale B2B Separated)
  fastify.post(
    '/api/v1/partner/pharmacy/invoices/ingest-wholesale',
    {
      preHandler: [authenticate, requirePermission('pharmacy:inventory', 'create')]
    },
    async (request, reply) => {
      const body = (request.body || {}) as {
        rawContent?: string;
        useSampleMargErp?: boolean;
        partnerId?: string;
        organizationId?: string;
        branchId?: string;
        tenantId?: string;
        buyerTenantId?: string;
        buyerDlNo?: string;
        wholesaleLicenseExpiry?: string;
      };

      const result = await wholesaleInvoiceIngestionService.ingestWholesaleInvoice(request.session, body);
      reply.status(201);
      return { success: true, data: result };
    }
  );

  // 7.5 Wholesale B2B Order & Dispatch Challan (CAP-04 Wholesale B2B Separated)
  fastify.post(
    '/api/v1/partner/pharmacy/wholesale/b2b-dispatch',
    {
      preHandler: [authenticate, requirePermission('pharmacy:inventory', 'create')]
    },
    async (request, reply) => {
      const body = (request.body || {}) as Parameters<typeof wholesaleInvoiceIngestionService.executeWholesaleB2bDispatch>[1];
      const result = await wholesaleInvoiceIngestionService.executeWholesaleB2bDispatch(request.session, body);
      reply.status(201);
      return { success: true, data: result };
    }
  );

  // 8. Dynamic Marg ERP Wholesale Bill Generator (Sample & Testing)
  fastify.post(
    '/api/v1/partner/pharmacy/invoices/generate-dynamic-sample',
    {
      preHandler: [authenticate, requirePermission('pharmacy:inventory', 'read')]
    },
    async (request, reply) => {
      const options = request.body as Parameters<typeof wholesaleInvoiceIngestionService.generateDynamicMargErpInvoice>[0];
      await wholesaleInvoiceIngestionService.enforceWholesalePharmacyB2bGovernance(request.session, {
        buyerDlNo: options?.buyerDlNo,
        distributorDlNo: options?.distributorDlNo
      });
      const csv = wholesaleInvoiceIngestionService.generateDynamicMargErpInvoice(options);
      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', 'attachment; filename="dynamic_marg_erp_invoice.csv"');
      return csv;
    }
  );

  fastify.get(
    '/api/v1/partner/pharmacy/invoices/sample-marg-erp',
    {
      preHandler: [authenticate, requirePermission('pharmacy:inventory', 'read')]
    },
    async (_request, reply) => {
      const csv = await wholesaleInvoiceIngestionService.loadSampleMargErpCsv();
      reply.header('Content-Type', 'text/csv');
      return csv;
    }
  );

  // 9. Inventory Snapshot for PWA Offline Cache
  fastify.get(
    '/api/v1/partner/pharmacy/inventory-snapshot',
    {
      preHandler: [authenticate, requirePermission('pharmacy:inventory', 'read')]
    },
    async (request) => {
      const data = await pharmacyManagementService.getInventorySnapshot(request.session);
      return { success: true, data };
    }
  );

  // 10. Background Sync for Offline Invoices
  fastify.post(
    '/api/v1/partner/pharmacy/sync-offline-invoices',
    {
      preHandler: [authenticate, requirePermission('pharmacy:dispense', 'create')]
    },
    async (request, reply) => {
      const parseResult = SyncOfflineInvoicesSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          message: 'Invalid offline sync payload: ' + parseResult.error.issues.map((i) => i.message).join('; '),
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400,
          details: parseResult.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      const result = await pharmacyManagementService.syncOfflineInvoices(parseResult.data.invoices, request.session);
      reply.status(200);
      return { success: true, data: result };
    }
  );

  // 11. Development / Test Mock Stock Seeding (Protected by Dev Guard & Auth)
  fastify.post(
    '/api/v1/partner/pharmacy/dev/seed-mock-stock',
    {
      preHandler: [authenticate, requirePermission('pharmacy:inventory', 'create')]
    },
    async (request, reply) => {
      if (process.env['NODE_ENV'] === 'production' && process.env['ALLOW_DEV_TEST_ENDPOINTS'] !== 'true') {
        throw AppError.forbidden('Development mock stock endpoints are disabled in production environments.');
      }
      const data = await pharmacyManagementService.seedDevMockStock(request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 12. Development / Test Mock Stock Cleanup (Removes ONLY DEVELOPMENT_TEST records)
  fastify.delete(
    '/api/v1/partner/pharmacy/dev/cleanup-mock-stock',
    {
      preHandler: [authenticate, requirePermission('pharmacy:inventory', 'create')]
    },
    async (request, reply) => {
      if (process.env['NODE_ENV'] === 'production' && process.env['ALLOW_DEV_TEST_ENDPOINTS'] !== 'true') {
        throw AppError.forbidden('Development mock stock endpoints are disabled in production environments.');
      }
      const data = await pharmacyManagementService.cleanupDevMockStock(request.session);
      reply.status(200);
      return { success: true, data };
    }
  );

  // 13. Pharmacy Returns
  fastify.post(
    '/api/v1/partner/pharmacy/returns',
    {
      preHandler: [authenticate, requirePermission('pharmacy:inventory', 'create')]
    },
    async (request, reply) => {
      const parseResult = CreateReturnSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          message: 'Invalid return payload: ' + parseResult.error.issues.map((i) => i.message).join('; '),
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400,
          details: parseResult.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      const data = await pharmacyManagementService.createReturn(parseResult.data, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/pharmacy/returns',
    {
      preHandler: [authenticate, requirePermission('pharmacy:inventory', 'read')]
    },
    async (request) => {
      const branchId = (request.query as { branchId?: string })?.branchId;
      const data = await pharmacyManagementService.getReturns(request.session, branchId);
      return { success: true, data };
    }
  );

  // 14. Stock Adjustments
  fastify.post(
    '/api/v1/partner/pharmacy/adjustments',
    {
      preHandler: [authenticate, requirePermission('pharmacy:inventory', 'create')]
    },
    async (request, reply) => {
      const parseResult = CreateStockAdjustmentSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          message: 'Invalid adjustment payload: ' + parseResult.error.issues.map((i) => i.message).join('; '),
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400,
          details: parseResult.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      const data = await pharmacyManagementService.createStockAdjustment(parseResult.data, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/pharmacy/adjustments',
    {
      preHandler: [authenticate, requirePermission('pharmacy:inventory', 'read')]
    },
    async (request) => {
      const branchId = (request.query as { branchId?: string })?.branchId;
      const data = await pharmacyManagementService.getAdjustments(request.session, branchId);
      return { success: true, data };
    }
  );

  // 15. Batch Recall & Quarantine
  fastify.post(
    '/api/v1/partner/pharmacy/recalls',
    {
      preHandler: [authenticate, requirePermission('pharmacy:inventory', 'create')]
    },
    async (request, reply) => {
      const parseResult = CreateBatchRecallSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          message: 'Invalid recall payload: ' + parseResult.error.issues.map((i) => i.message).join('; '),
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400,
          details: parseResult.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      const data = await pharmacyManagementService.createBatchRecall(parseResult.data.batchId, parseResult.data.reason, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/pharmacy/batches/:id/block',
    {
      preHandler: [authenticate, requirePermission('pharmacy:inventory', 'create')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const reason = ((request.body as any)?.reason || 'Manual administrative quarantine').trim();
      const data = await pharmacyManagementService.createBatchRecall(id, reason, request.session);
      reply.status(200);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/pharmacy/batches/:id/unblock',
    {
      preHandler: [authenticate, requirePermission('pharmacy:inventory', 'create')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await pharmacyManagementService.unblockBatch(id, request.session);
      reply.status(200);
      return { success: true, data };
    }
  );

  // 16. Wholesale Customers
  fastify.post(
    '/api/v1/partner/pharmacy/wholesale/customers',
    {
      preHandler: [authenticate, requireFeatureEntitlement('PHARMACY_WHOLESALE'), requirePermission('pharmacy:inventory', 'create')]
    },
    async (request, reply) => {
      const parseResult = CreateWholesaleCustomerSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          message: 'Invalid wholesale customer payload: ' + parseResult.error.issues.map((i) => i.message).join('; '),
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400,
          details: parseResult.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      const data = await wholesaleInvoiceIngestionService.createWholesaleCustomer(request.session, parseResult.data);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/pharmacy/wholesale/customers',
    {
      preHandler: [authenticate, requireFeatureEntitlement('PHARMACY_WHOLESALE'), requirePermission('pharmacy:inventory', 'read')]
    },
    async (request) => {
      const data = await wholesaleInvoiceIngestionService.getWholesaleCustomers(request.session);
      return { success: true, data };
    }
  );

  // 17. Wholesale Sales Orders
  fastify.post(
    '/api/v1/partner/pharmacy/wholesale/orders',
    {
      preHandler: [authenticate, requireFeatureEntitlement('PHARMACY_WHOLESALE'), requirePermission('pharmacy:inventory', 'create')]
    },
    async (request, reply) => {
      const parseResult = CreateWholesaleSalesOrderSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          message: 'Invalid wholesale order payload: ' + parseResult.error.issues.map((i) => i.message).join('; '),
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400,
          details: parseResult.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      const data = await wholesaleInvoiceIngestionService.createWholesaleSalesOrder(request.session, parseResult.data);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/pharmacy/wholesale/orders',
    {
      preHandler: [authenticate, requireFeatureEntitlement('PHARMACY_WHOLESALE'), requirePermission('pharmacy:inventory', 'read')]
    },
    async (request) => {
      const data = await wholesaleInvoiceIngestionService.getWholesaleSalesOrders(request.session);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/pharmacy/wholesale/orders/:id',
    {
      preHandler: [authenticate, requireFeatureEntitlement('PHARMACY_WHOLESALE'), requirePermission('pharmacy:inventory', 'read')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await wholesaleInvoiceIngestionService.getWholesaleSalesOrderById(request.session, id);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'NOT_FOUND', message: 'Wholesale order not found' } };
      }
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/pharmacy/wholesale/orders/:id/allocate',
    {
      preHandler: [authenticate, requireFeatureEntitlement('PHARMACY_WHOLESALE'), requirePermission('pharmacy:inventory', 'create')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await wholesaleInvoiceIngestionService.allocateWholesaleSalesOrder(request.session, id);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/pharmacy/wholesale/orders/:id/dispatch',
    {
      preHandler: [authenticate, requireFeatureEntitlement('PHARMACY_WHOLESALE'), requirePermission('pharmacy:inventory', 'create')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = (request.body || {}) as { transportMode?: string; vehicleNumber?: string; lrNumber?: string };
      const data = await wholesaleInvoiceIngestionService.dispatchWholesaleSalesOrder(request.session, id, body);
      reply.status(200);
      return { success: true, data };
    }
  );
};

