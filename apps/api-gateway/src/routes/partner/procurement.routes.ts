import type { FastifyPluginAsync } from 'fastify';
import { ProcurementService } from '../../services/partner/ProcurementService.js';
import { authenticate } from '../../plugins/auth-guard.js';

const service = new ProcurementService();

export const procurementRoutes: FastifyPluginAsync = async (app) => {
  // 1. Overview & Analytics
  app.get(
    '/api/v1/partner/procurement/overview',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getOverviewMetrics(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/procurement/analytics',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getAnalytics(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // 2. Vendors
  app.get(
    '/api/v1/partner/procurement/vendors',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getVendors(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/procurement/vendors',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.createVendor(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 3. Items
  app.get(
    '/api/v1/partner/procurement/items',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getItems(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/procurement/items',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.createItem(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 4. Purchase Requisitions
  app.get(
    '/api/v1/partner/procurement/requisitions',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getRequisitions(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/procurement/requisitions',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.createRequisition(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/procurement/requisitions/:id/approve',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const data = await service.approveRequisition(tenantId, id, userId);
      return reply.send({ success: true, data });
    }
  );

  // 5. Purchase Orders
  app.get(
    '/api/v1/partner/procurement/purchase-orders',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getPurchaseOrders(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/procurement/purchase-orders',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.createPurchaseOrder(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/procurement/purchase-orders/:id/approve',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const data = await service.approvePurchaseOrder(tenantId, id, userId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/procurement/purchase-orders/emergency',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.createEmergencyPurchase(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 6. Goods Receipts (GRN)
  app.get(
    '/api/v1/partner/procurement/goods-receipts',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getGoodsReceipts(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/procurement/goods-receipts',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.createGoodsReceipt(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 7. Inspections
  app.get(
    '/api/v1/partner/procurement/inspections',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getInspections(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/procurement/inspections',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.createInspection(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 8. Invoices
  app.get(
    '/api/v1/partner/procurement/invoices',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getInvoices(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/procurement/invoices',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.createInvoice(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 9. 3-Way Matching
  app.get(
    '/api/v1/partner/procurement/invoices/matches',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getInvoiceMatches(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/procurement/invoices/match',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.matchPurchaseInvoice(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 10. Vendor Returns
  app.get(
    '/api/v1/partner/procurement/returns',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getVendorReturns(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/procurement/returns',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.createVendorReturn(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 11. Audit Traces
  app.get(
    '/api/v1/partner/procurement/audit-traces',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getAuditTraces(tenantId);
      return reply.send({ success: true, data });
    }
  );
};
