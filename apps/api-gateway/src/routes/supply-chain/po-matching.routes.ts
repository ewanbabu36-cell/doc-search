import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { threeWayPoMatchingService } from '../../services/supply-chain/ThreeWayPoMatchingService.js';
import { authenticate, requireRoles } from '../../plugins/auth-guard.js';

const SUPPLY_CHAIN_FINANCE_ROLES = [
  'FINANCE_MANAGER',
  'HOSPITAL_ADMIN',
  'SUPER_ADMIN',
  'COMPANY_ADMIN'
] as const;

export const poMatchingRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. List 3-Way PO Matching Discrepancies
  fastify.get('/api/v1/supply-chain/matching/discrepancies', { preHandler: [authenticate, requireRoles(...SUPPLY_CHAIN_FINANCE_ROLES)] }, async (request) => {
    const query = (request.query as Record<string, string>) || {};
    const discrepancies = threeWayPoMatchingService.getDiscrepancies(query['status'] || query['exceptionType']);
    return {
      success: true,
      data: discrepancies
    };
  });

  // 2. List Automated Reorder Point (ROP) Alerts
  fastify.get('/api/v1/supply-chain/rop/alerts', { preHandler: [authenticate, requireRoles(...SUPPLY_CHAIN_FINANCE_ROLES)] }, async () => {
    const alerts = threeWayPoMatchingService.getRopAlerts();
    return {
      success: true,
      data: alerts
    };
  });

  // 3. Reconcile Discrepancy
  const ReconcileSchema = z.object({
    discrepancyId: z.string(),
    action: z.enum(['APPROVE_UNDER_TOLERANCE', 'REJECT_RAISE_CDN']),
    notes: z.string().optional()
  });

  // 🛡️ Guarded: Only authorized Finance Managers and Admins can reconcile invoice discrepancies
  fastify.post('/api/v1/supply-chain/matching/reconcile', { preHandler: [authenticate, requireRoles(...SUPPLY_CHAIN_FINANCE_ROLES)] }, async (request) => {
    const parsed = ReconcileSchema.parse(request.body || {});
    const result = threeWayPoMatchingService.reconcileDiscrepancy({
      discrepancyId: parsed.discrepancyId,
      action: parsed.action,
      notes: parsed.notes
    });
    return {
      success: result.success,
      data: result
    };
  });

  // 4. Trigger Auto-PO from ROP Alert
  const AutoPoSchema = z.object({
    sku: z.string()
  });

  // 🛡️ Guarded: Triggering automated purchase orders requires Finance/Admin role authority
  fastify.post('/api/v1/supply-chain/rop/auto-po', { preHandler: [authenticate, requireRoles(...SUPPLY_CHAIN_FINANCE_ROLES)] }, async (request) => {
    const parsed = AutoPoSchema.parse(request.body || {});
    const result = threeWayPoMatchingService.triggerAutoPurchaseOrder(parsed.sku);
    return {
      success: result.success,
      data: result
    };
  });
};
