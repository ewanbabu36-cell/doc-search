import { type FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../plugins/auth-guard.js';
import { ExecutiveMisService, executiveMisService } from '../../services/partner/ExecutiveMisService.js';
import type {
  DeclareSurgeEventRequest,
  ResolveSurgeEventRequest,
  OverrideBedAllocationRequest,
  InventoryShrinkageItemDto,
  WhatIfScenarioRequest
} from '@docsearch/api-contracts';

export const executiveMisRoutes: FastifyPluginAsync = async (app) => {
  const service: ExecutiveMisService = executiveMisService;

  // 1. Unified MIS & Revenue Leakage Dashboard Cockpit
  app.get(
    '/api/v1/partner/executive-mis/dashboard',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getExecutiveDashboard(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // 2. Department-Wise Billing Aggregation
  app.get(
    '/api/v1/partner/executive-mis/billing/department-wise',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getDepartmentWiseBilling(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // 3. Outstanding Unbilled Encounters
  app.get(
    '/api/v1/partner/executive-mis/billing/unbilled-encounters',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getUnbilledEncounters(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // 4. Resolve Unbilled Encounter (Charge Capture Correction)
  app.post(
    '/api/v1/partner/executive-mis/billing/unbilled-encounters/:encounterId/resolve',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, actorEmail } = request.session;
      const { encounterId } = request.params as { encounterId: string };
      const body = request.body as { resolutionNotes?: string } | undefined;
      const notes = body?.resolutionNotes || 'Unbilled charges reconciled and posted to billing ledger.';
      const data = await service.resolveUnbilledEncounter(tenantId, encounterId, notes, actorEmail || 'CFO / Billing Lead');
      return reply.send({ success: true, data });
    }
  );

  // 5. Insurance Claim Aging (Accounts Receivable Aging)
  app.get(
    '/api/v1/partner/executive-mis/insurance/claim-aging',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getInsuranceClaimAging(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // 6. Inventory Shrinkage & Stock Discrepancy Auditing
  app.get(
    '/api/v1/partner/executive-mis/inventory/shrinkage',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getInventoryShrinkage(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // 7. Record Physical Inventory Audit / Shrinkage Incident
  app.post(
    '/api/v1/partner/executive-mis/inventory/shrinkage-audit',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, actorEmail } = request.session;
      const item = request.body as InventoryShrinkageItemDto;
      const data = await service.recordShrinkageAudit(tenantId, item, actorEmail || 'Pharmacy Auditor');
      return reply.status(201).send({ success: true, data });
    }
  );

  // 8. Doctor Payout Calculations
  app.get(
    '/api/v1/partner/executive-mis/doctors/payouts',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const query = request.query as { period?: string };
      const data = await service.getDoctorPayouts(tenantId, query.period);
      return reply.send({ success: true, data });
    }
  );

  // 9. Approve Doctor Payout Settlement
  app.post(
    '/api/v1/partner/executive-mis/doctors/payouts/:doctorId/approve',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, actorEmail } = request.session;
      const { doctorId } = request.params as { doctorId: string };
      const data = await service.approveDoctorPayout(tenantId, doctorId, actorEmail || 'Hospital CFO');
      return reply.send({ success: true, data });
    }
  );

  // 10. Executive Command Snapshot
  app.get(
    '/api/v1/partner/executive-mis/command/snapshot',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getCommandSnapshot(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // 11. Declare Surge Event
  app.post(
    '/api/v1/partner/executive-mis/command/surge',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const payload = request.body as DeclareSurgeEventRequest;
      const data = await service.declareSurgeEvent(tenantId, payload);
      return reply.send({ success: true, data });
    }
  );

  // 12. Resolve Surge Event
  app.post(
    '/api/v1/partner/executive-mis/command/surge/resolve',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const payload = request.body as ResolveSurgeEventRequest;
      const data = await service.resolveSurgeEvent(tenantId, payload);
      return reply.send({ success: true, data });
    }
  );

  // 13. Bed Forecasts
  app.get(
    '/api/v1/partner/executive-mis/command/bed-forecasts',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getBedForecasts(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // 14. ED NEDOCS Overcrowding History
  app.get(
    '/api/v1/partner/executive-mis/command/ed-nedocs',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getEdNedocsHistory(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // 15. OT Suite Efficiencies
  app.get(
    '/api/v1/partner/executive-mis/command/ot-efficiencies',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getOtEfficiencies(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // 16. Patient Acuity Heatmap
  app.get(
    '/api/v1/partner/executive-mis/command/patient-acuity',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getPatientAcuityHeatmap(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // 17. RCM Revenue Leakage Risks
  app.get(
    '/api/v1/partner/executive-mis/command/rcm-risks',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getRcmLeakageRisks(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // 18. Critical Consumable Burn-Rates
  app.get(
    '/api/v1/partner/executive-mis/command/consumables',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getCriticalConsumables(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // 19. Run What-If Simulation
  app.post(
    '/api/v1/partner/executive-mis/command/what-if',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const payload = request.body as WhatIfScenarioRequest;
      const data = await service.runWhatIfSimulation(tenantId, payload);
      return reply.send({ success: true, data });
    }
  );

  // 20. What-If Simulation History
  app.get(
    '/api/v1/partner/executive-mis/command/what-if/history',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getSimulationHistory(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // 21. Bed Allocation Override
  app.post(
    '/api/v1/partner/executive-mis/command/bed-override',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const payload = request.body as OverrideBedAllocationRequest;
      await service.overrideBedAllocation(tenantId, payload);
      return reply.send({ success: true, message: 'Bed allocation overridden successfully.' });
    }
  );

  // 22. Executive Audit Vault
  app.get(
    '/api/v1/partner/executive-mis/audit-traces',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getAuditTraces(tenantId);
      return reply.send({ success: true, data });
    }
  );
};
