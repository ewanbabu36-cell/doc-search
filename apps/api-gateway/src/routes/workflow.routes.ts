import type { FastifyPluginAsync } from 'fastify';
import {
  WorkflowEngine,
  PricingEngine,
  LicenceEngine,
  type PlanConfig
} from '@docsearch/shared-core';
import {
  workflowRepository
} from '@docsearch/database';
import type {
  DynamicOfferDto,
  DynamicPricingRequestDto,
  WorkflowDefinitionDto,
  WorkflowInstanceDto,
  WorkflowVersionDto
} from '@docsearch/api-contracts';

const DEFAULT_PLANS: Record<string, PlanConfig> = {
  HOSPITAL_ENTERPRISE: {
    code: 'HOSPITAL_ENTERPRISE',
    name: 'Hospital Enterprise Shield Pass',
    version: 1,
    currency: 'INR',
    baseMonthlyPriceInr: 49999,
    baseAnnualPriceInr: 499990,
    includedDoctorSeats: 25,
    additionalSeatPriceInr: 499,
    includedBranches: 1,
    additionalBranchPriceInr: 9999,
    taxRatePercent: 18
  },
  PATHOLOGY_PRO: {
    code: 'PATHOLOGY_PRO',
    name: 'Pathology Diagnostic Pro Suite',
    version: 1,
    currency: 'INR',
    baseMonthlyPriceInr: 14999,
    baseAnnualPriceInr: 149990,
    includedDoctorSeats: 5,
    additionalSeatPriceInr: 299,
    includedBranches: 1,
    additionalBranchPriceInr: 4999,
    taxRatePercent: 18
  },
  PHARMACY_STANDARD: {
    code: 'PHARMACY_STANDARD',
    name: 'Retail Pharmacy POS & Delivery Shield',
    version: 1,
    currency: 'INR',
    baseMonthlyPriceInr: 7999,
    baseAnnualPriceInr: 79990,
    includedDoctorSeats: 2,
    additionalSeatPriceInr: 199,
    includedBranches: 1,
    additionalBranchPriceInr: 2999,
    taxRatePercent: 18
  }
};

export const workflowRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. List all workflow definitions
  fastify.get('/definitions', async (request, reply) => {
    const { orgType } = request.query as { orgType?: string };
    const definitions = await workflowRepository.getDefinitions(orgType);
    return reply.send({ success: true, data: definitions });
  });

  // 2. Get workflow definition by code
  fastify.get('/definitions/:code', async (request, reply) => {
    const { code } = request.params as { code: string };
    const { version } = request.query as { version?: string };
    const verNum = version ? parseInt(version, 10) : undefined;
    const res = await workflowRepository.getDefinitionByCode(code, verNum);
    if (!res) {
      return reply.status(404).send({ success: false, error: `Workflow "${code}" not found.` });
    }
    return reply.send({ success: true, data: res });
  });

  // 3. Create or update workflow definition
  fastify.post('/definitions', async (request, reply) => {
    const body = request.body as WorkflowDefinitionDto;
    const updated = await workflowRepository.createOrUpdateDefinition(body);
    return reply.status(201).send({ success: true, data: updated });
  });

  // 4. Create new version for a workflow
  fastify.post('/definitions/:code/version', async (request, reply) => {
    const { code } = request.params as { code: string };
    const body = request.body as WorkflowVersionDto;
    const newVer = await workflowRepository.createVersion(code, body);
    return reply.status(201).send({ success: true, data: newVer });
  });

  // 5. List workflow instances
  fastify.get('/instances', async (request, reply) => {
    const query = request.query as { workflowCode?: string; status?: string };
    const instances = await workflowRepository.getInstances(query);

    // Re-evaluate allowed transitions and Go-Live Gate for each instance dynamically
    const enriched = await Promise.all(
      instances.map(async (inst) => {
        const defObj = await workflowRepository.getDefinitionByCode(inst.workflowCode, inst.workflowVersion);
        if (defObj) {
          inst.allowedTransitions = WorkflowEngine.evaluateAllowedTransitions(inst, defObj.version);
          inst.goLiveGateEvaluation = WorkflowEngine.evaluateGoLiveGate(inst, defObj.version);
        }
        return inst;
      })
    );

    return reply.send({ success: true, data: enriched });
  });

  // 6. Get instance by ID with dynamic evaluations
  fastify.get('/instances/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const inst = await workflowRepository.getInstanceById(id);
    if (!inst) {
      return reply.status(404).send({ success: false, error: `Workflow instance "${id}" not found.` });
    }

    const defObj = await workflowRepository.getDefinitionByCode(inst.workflowCode, inst.workflowVersion);
    if (defObj) {
      inst.allowedTransitions = WorkflowEngine.evaluateAllowedTransitions(inst, defObj.version);
      inst.goLiveGateEvaluation = WorkflowEngine.evaluateGoLiveGate(inst, defObj.version);
    }

    return reply.send({ success: true, data: inst });
  });

  // 7. Create new workflow instance
  fastify.post('/instances', async (request, reply) => {
    const body = request.body as {
      workflowCode: string;
      version?: number;
      entityId: string;
      entityName: string;
      organizationType: string;
      contextData?: Record<string, any>;
    };

    const defObj = await workflowRepository.getDefinitionByCode(body.workflowCode, body.version);
    if (!defObj) {
      return reply.status(400).send({ success: false, error: `Invalid workflow code "${body.workflowCode}".` });
    }

    const initialStage = defObj.version.stages.find((s) => s.isInitial) || defObj.version.stages[0]!;

    const newInst: WorkflowInstanceDto = {
      id: `INST-${body.workflowCode}-${Date.now()}`,
      workflowId: defObj.definition.id,
      workflowCode: defObj.definition.code,
      workflowVersion: defObj.version.version,
      organizationType: body.organizationType,
      entityId: body.entityId,
      entityName: body.entityName,
      currentStageId: initialStage.id,
      currentStageCode: initialStage.code,
      currentStageName: initialStage.name,
      status: 'IN_PROGRESS',
      contextData: body.contextData || {},
      requirements: [],
      pendingApprovals: [],
      allowedTransitions: [],
      auditHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    newInst.allowedTransitions = WorkflowEngine.evaluateAllowedTransitions(newInst, defObj.version);
    newInst.goLiveGateEvaluation = WorkflowEngine.evaluateGoLiveGate(newInst, defObj.version);

    await workflowRepository.createInstance(newInst);
    return reply.status(201).send({ success: true, data: newInst });
  });

  // 8. Execute State Transition
  fastify.post('/instances/:id/transition', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      transitionCode: string;
      actorEmail?: string;
      actorRole?: string;
      inputData?: Record<string, any>;
    };

    const inst = await workflowRepository.getInstanceById(id);
    if (!inst) {
      return reply.status(404).send({ success: false, error: `Workflow instance "${id}" not found.` });
    }

    const defObj = await workflowRepository.getDefinitionByCode(inst.workflowCode, inst.workflowVersion);
    if (!defObj) {
      return reply.status(500).send({ success: false, error: `Workflow version configuration missing.` });
    }

    const actor = {
      email: body.actorEmail || 'admin@docsearch.internal',
      role: body.actorRole || 'SUPER_ADMIN'
    };

    try {
      const result = await WorkflowEngine.executeTransition(
        inst,
        defObj.version,
        body.transitionCode,
        actor,
        body.inputData || {},
        async (action, instance, context) => {
          // Action dispatcher simulation
          return { success: true, summary: `Executed action ${action.name} successfully.` };
        }
      );

      await workflowRepository.updateInstance(result.updatedInstance);
      await workflowRepository.appendAuditLog(result.auditLog);

      return reply.send({ success: true, data: result.updatedInstance, auditLog: result.auditLog });
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message });
    }
  });

  // 9. Fulfill stage requirement
  fastify.post('/instances/:id/requirements/:requirementCode/fulfill', async (request, reply) => {
    const { id, requirementCode } = request.params as { id: string; requirementCode: string };
    const body = request.body as { actorEmail?: string; data?: Record<string, any> };

    const inst = await workflowRepository.getInstanceById(id);
    if (!inst) {
      return reply.status(404).send({ success: false, error: `Workflow instance "${id}" not found.` });
    }

    const defObj = await workflowRepository.getDefinitionByCode(inst.workflowCode, inst.workflowVersion);
    if (!defObj) {
      return reply.status(500).send({ success: false, error: `Workflow version configuration missing.` });
    }

    const updated = WorkflowEngine.fulfillRequirement(
      inst,
      defObj.version,
      requirementCode,
      body.actorEmail || 'admin@docsearch.internal',
      body.data || {}
    );

    await workflowRepository.updateInstance(updated);
    return reply.send({ success: true, data: updated });
  });

  // 10. Dynamic Offers
  fastify.get('/offers', async (request, reply) => {
    const offers = await workflowRepository.getOffers();
    return reply.send({ success: true, data: offers });
  });

  fastify.post('/offers', async (request, reply) => {
    const body = request.body as DynamicOfferDto;
    const updated = await workflowRepository.updateOffer(body);
    return reply.send({ success: true, data: updated });
  });

  // 11. Dynamic Licences
  fastify.get('/licences', async (request, reply) => {
    const { orgType } = request.query as { orgType?: string };
    const rules = await workflowRepository.getLicenceRules(orgType);
    return reply.send({ success: true, data: rules });
  });

  // 12. Dynamic Pricing Calculation Endpoint
  fastify.post('/pricing/calculate', async (request, reply) => {
    const body = request.body as DynamicPricingRequestDto;
    const planConfig = DEFAULT_PLANS[body.planCode] || DEFAULT_PLANS.HOSPITAL_ENTERPRISE!;
    const offers = await workflowRepository.getOffers();

    const result = PricingEngine.calculatePrice(body, planConfig, [], offers);
    return reply.send({ success: true, data: result });
  });
};
