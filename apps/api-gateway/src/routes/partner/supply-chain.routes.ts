import type { FastifyPluginAsync } from 'fastify';
import { SupplyChainService } from '../../services/partner/SupplyChainService.js';
import { authenticate } from '../../plugins/auth-guard.js';
import { requireModuleCommercialAccess } from '../../plugins/commercial-guard.js';

const service = new SupplyChainService();

export const supplyChainRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireModuleCommercialAccess('OPERATIONS'));

  // 1. Overview & KPI Metrics (Zero-state compliant: 0s for empty accounts)
  app.get(
    '/api/v1/partner/supply-chain/metrics',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getMetrics(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // 2. Warehouses
  app.get(
    '/api/v1/partner/supply-chain/warehouses',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const query = request.query as Record<string, string>;
      const data = await service.getWarehouses(tenantId, query);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/supply-chain/warehouses',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId } = request.session;
      const body = (request.body || {}) as any;
      const data = await service.createWarehouse(tenantId, { ...body, branchId });
      return reply.status(201).send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/supply-chain/warehouses/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const { id } = request.params as { id: string };
      const data = await service.getWarehouseById(tenantId, id);
      return reply.send({ success: true, data });
    }
  );

  // Storage Locations inside Warehouse
  app.get(
    '/api/v1/partner/supply-chain/warehouses/:warehouseId/locations',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const { warehouseId } = request.params as { warehouseId: string };
      const data = await service.getLocations(tenantId, warehouseId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/supply-chain/warehouses/:warehouseId/locations',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const { warehouseId } = request.params as { warehouseId: string };
      const body = (request.body || {}) as any;
      const data = await service.createLocation(tenantId, warehouseId, body);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 3. Vendors
  app.get(
    '/api/v1/partner/supply-chain/vendors',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getVendors(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/supply-chain/vendors',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId } = request.session;
      const body = (request.body || {}) as any;
      const data = await service.createVendor(tenantId, { ...body, branchId });
      return reply.status(201).send({ success: true, data });
    }
  );

  // 4. Item Master
  app.get(
    '/api/v1/partner/supply-chain/items',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const { category } = request.query as { category?: string };
      const data = await service.getItems(tenantId, category);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/supply-chain/items',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId } = request.session;
      const body = (request.body || {}) as any;
      const data = await service.createItem(tenantId, { ...body, branchId });
      return reply.status(201).send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/supply-chain/items/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const { id } = request.params as { id: string };
      const data = await service.getItemById(tenantId, id);
      return reply.send({ success: true, data });
    }
  );

  // 5. Purchase Requisitions
  app.get(
    '/api/v1/partner/supply-chain/requisitions',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getRequisitions(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/supply-chain/requisitions',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId } = request.session;
      const body = (request.body || {}) as any;
      const data = await service.createRequisition(tenantId, { ...body, branchId });
      return reply.status(201).send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/supply-chain/requisitions/:id/approve',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const data = await service.approveRequisition(tenantId, id, userId);
      return reply.send({ success: true, data });
    }
  );

  // 6. Purchase Orders
  app.get(
    '/api/v1/partner/supply-chain/purchase-orders',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getPurchaseOrders(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/supply-chain/purchase-orders',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId } = request.session;
      const body = (request.body || {}) as any;
      const data = await service.createPurchaseOrder(tenantId, { ...body, branchId });
      return reply.status(201).send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/supply-chain/purchase-orders/:id/approve',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const data = await service.approvePurchaseOrder(tenantId, id, userId);
      return reply.send({ success: true, data });
    }
  );

  // 7. Goods Receipt Notes (GRN)
  app.get(
    '/api/v1/partner/supply-chain/goods-receipts',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getGoodsReceipts(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/supply-chain/goods-receipts',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const body = (request.body || {}) as any;
      const data = await service.createGoodsReceipt(tenantId, {
        ...body,
        receivedBy: body['receivedBy'] || userId,
        branchId
      });
      return reply.status(201).send({ success: true, data });
    }
  );

  // 8. Inventory & Batches
  app.get(
    '/api/v1/partner/supply-chain/inventory',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const { warehouseId } = request.query as { warehouseId?: string };
      const data = await service.getInventory(tenantId, warehouseId);
      return reply.send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/supply-chain/batches',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const { warehouseId, procurementItemId } = request.query as { warehouseId?: string; procurementItemId?: string };
      const data = await service.getBatches(tenantId, warehouseId, procurementItemId);
      return reply.send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/supply-chain/batches/fefo',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const { warehouseId, procurementItemId } = request.query as { warehouseId: string; procurementItemId: string };
      const data = await service.getFefoBatches(tenantId, warehouseId, procurementItemId);
      return reply.send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/supply-chain/stock-ledger',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const { warehouseId, procurementItemId } = request.query as { warehouseId?: string; procurementItemId?: string };
      const data = await service.getStockLedger(tenantId, warehouseId, procurementItemId);
      return reply.send({ success: true, data });
    }
  );

  // 9. Department Consumption (OT, LIMS, IPD, ICU, Pharmacy, etc.)
  app.post(
    '/api/v1/partner/supply-chain/consumptions',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const body = (request.body || {}) as any;
      const data = await service.recordConsumption(tenantId, {
        ...body,
        consumedBy: body['consumedBy'] || userId,
        branchId
      });
      return reply.status(201).send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/supply-chain/consumptions',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const { departmentName } = request.query as { departmentName?: string };
      const data = await service.getConsumptions(tenantId, departmentName);
      return reply.send({ success: true, data });
    }
  );

  // 10. Inter-Store Transfers
  app.post(
    '/api/v1/partner/supply-chain/transfers',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const body = (request.body || {}) as any;
      const data = await service.requestTransfer(tenantId, {
        ...body,
        requestedBy: body['requestedBy'] || userId,
        branchId
      });
      return reply.status(201).send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/supply-chain/transfers',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getTransfers(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/supply-chain/transfers/:id/approve',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const data = await service.approveTransfer(tenantId, id, userId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/supply-chain/transfers/:id/dispatch',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const data = await service.dispatchTransfer(tenantId, id, userId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/supply-chain/transfers/:id/receive',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const data = await service.receiveTransfer(tenantId, id, userId);
      return reply.send({ success: true, data });
    }
  );

  // 11. Batch Recalls & Quarantines
  app.post(
    '/api/v1/partner/supply-chain/recalls',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const body = (request.body || {}) as any;
      const data = await service.initiateBatchRecall(tenantId, {
        ...body,
        initiatedBy: body['initiatedBy'] || userId,
        branchId
      });
      return reply.status(201).send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/supply-chain/recalls',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getRecalls(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // 12. Physical Stock Counts & Cycle Audits
  app.post(
    '/api/v1/partner/supply-chain/stock-counts',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const body = (request.body || {}) as any;
      const data = await service.initiateStockCount(tenantId, {
        ...body,
        initiatedBy: body['initiatedBy'] || userId,
        branchId
      });
      return reply.status(201).send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/supply-chain/stock-counts',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getStockCounts(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/supply-chain/stock-counts/:id/record',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const body = (request.body || {}) as any;
      const data = await service.recordStockCountResults(tenantId, id, {
        ...body,
        conductedBy: body['conductedBy'] || userId
      });
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/supply-chain/stock-counts/:id/reconcile',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const data = await service.reconcileStockCount(tenantId, id, userId);
      return reply.send({ success: true, data });
    }
  );

  // 13. Expiry Dashboard & Reorder Alerts
  app.get(
    '/api/v1/partner/supply-chain/expiry-dashboard',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const { days } = request.query as { days?: string };
      const data = await service.getExpiryAlerts(tenantId, days ? parseInt(days, 10) : 30);
      return reply.send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/supply-chain/reorder-alerts',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getReorderAlerts(tenantId);
      return reply.send({ success: true, data });
    }
  );
};
