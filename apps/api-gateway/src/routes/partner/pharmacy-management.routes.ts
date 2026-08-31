import { type FastifyPluginAsync } from 'fastify';
import { pharmacyManagementService } from '../../services/partner/PharmacyManagementService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import {
  type CreateMedicationInput,
  type ReceiveStockInput,
  type DispenseInput
} from '../../repositories/partner/PharmacyManagementRepository.js';

export const pharmacyManagementRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Medicine Master Catalog
  fastify.get(
    '/api/v1/partner/pharmacy/medications',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'read')]
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
      preHandler: [authenticate, requirePermission('clinical:consultations', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<CreateMedicationInput, 'tenantId'>;
      const data = await pharmacyManagementService.createMedication(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 1.5 Pharmacy Prescription Worklist Queue
  fastify.get(
    '/api/v1/partner/pharmacy/prescriptions',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'read')]
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
      preHandler: [authenticate, requirePermission('clinical:consultations', 'read')]
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
      preHandler: [authenticate, requirePermission('clinical:consultations', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<ReceiveStockInput, 'tenantId'>;
      const data = await pharmacyManagementService.receiveStock(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 4. POS Dispensing & Billing
  fastify.post(
    '/api/v1/partner/pharmacy/dispense',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<DispenseInput, 'tenantId' | 'pharmacistId' | 'pharmacistName'>;
      const data = await pharmacyManagementService.dispense(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 5. Stock Movement Ledger
  fastify.get(
    '/api/v1/partner/pharmacy/stock-movements',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'read')]
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
      preHandler: [authenticate, requirePermission('clinical:consultations', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await pharmacyManagementService.getPatientMedicationHistory(request.session, id);
      return { success: true, data };
    }
  );
};
