import crypto from 'node:crypto';
import { eq, desc } from 'drizzle-orm';
import type {
  DynamicLicenceRuleDto,
  DynamicOfferDto,
  WorkflowApprovalDto,
  WorkflowDefinitionDto,
  WorkflowInstanceDto,
  WorkflowTransitionLogDto,
  WorkflowVersionDto
} from '@docsearch/api-contracts';
import { getDatabase } from '../client.js';
import {
  workflowDefinitions,
  workflowInstances,
  workflowRequirementInstances,
  workflowApprovals,
  workflowTransitionLogs
} from '../schema/workflow-schema.js';
import {
  SEED_DYNAMIC_OFFERS,
  SEED_LICENCE_RULES,
  SEED_WORKFLOW_DEFINITIONS
} from '../seeds/workflow-seeds.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toUuid(idOrSeed: string): string {
  if (UUID_REGEX.test(idOrSeed)) {
    return idOrSeed.toLowerCase();
  }
  const hash = crypto.createHash('sha256').update(`wf:${idOrSeed}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export interface IWorkflowRepository {
  getDefinitions(orgType?: string): Promise<WorkflowDefinitionDto[]>;
  getDefinitionByCode(code: string, version?: number): Promise<{ definition: WorkflowDefinitionDto; version: WorkflowVersionDto } | null>;
  createOrUpdateDefinition(definition: WorkflowDefinitionDto): Promise<WorkflowDefinitionDto>;
  createVersion(workflowCode: string, version: WorkflowVersionDto): Promise<WorkflowVersionDto>;

  getInstances(filter?: { workflowCode?: string; status?: string; tenantId?: string }): Promise<WorkflowInstanceDto[]>;
  getInstanceById(id: string, tenantId?: string): Promise<WorkflowInstanceDto | null>;
  createInstance(instance: WorkflowInstanceDto): Promise<WorkflowInstanceDto>;
  updateInstance(instance: WorkflowInstanceDto): Promise<WorkflowInstanceDto>;

  recordApproval(approval: WorkflowApprovalDto): Promise<WorkflowApprovalDto>;
  appendAuditLog(log: WorkflowTransitionLogDto): Promise<void>;

  getOffers(): Promise<DynamicOfferDto[]>;
  updateOffer(offer: DynamicOfferDto): Promise<DynamicOfferDto>;

  getLicenceRules(orgType?: string): Promise<DynamicLicenceRuleDto[]>;
  updateLicenceRule(rule: DynamicLicenceRuleDto): Promise<DynamicLicenceRuleDto>;
}

export class WorkflowRepository implements IWorkflowRepository {
  private definitions: WorkflowDefinitionDto[] = JSON.parse(JSON.stringify(SEED_WORKFLOW_DEFINITIONS));
  private offers: DynamicOfferDto[] = JSON.parse(JSON.stringify(SEED_DYNAMIC_OFFERS));
  private licenceRules: DynamicLicenceRuleDto[] = JSON.parse(JSON.stringify(SEED_LICENCE_RULES));

  constructor() {
    // Legitimate zero-state: do not seed fabricated demo hospital instances (e.g. INST-HOSP-AIIMS-01).
    // All workflow instances, approvals, requirement evaluations, and transition logs are persisted in PostgreSQL.
  }

  private resolveDb() {
    return getDatabase();
  }

  private resolveInstanceTenantUuid(instance: WorkflowInstanceDto): string | null {
    const rawTenant =
      (instance as any).tenantId ||
      (instance.contextData as any)?.tenantId ||
      (UUID_REGEX.test(instance.entityId) ? instance.entityId : null);
    if (!rawTenant) return null;
    return toUuid(String(rawTenant));
  }

  private mapRowToDto(row: typeof workflowInstances.$inferSelect): WorkflowInstanceDto {
    const ctx = (row.contextData && typeof row.contextData === 'object') ? (row.contextData as Record<string, any>) : {};
    const snapshot = ctx['__workflowInstanceDto'] && typeof ctx['__workflowInstanceDto'] === 'object'
      ? (ctx['__workflowInstanceDto'] as WorkflowInstanceDto)
      : null;

    const cleanContext = { ...ctx };
    delete cleanContext['__workflowInstanceDto'];

    if (snapshot) {
      return {
        ...snapshot,
        id: snapshot.id || row.id,
        tenantId: (snapshot as any).tenantId || row.tenantId || undefined,
        workflowId: snapshot.workflowId || row.workflowId,
        workflowCode: row.workflowCode,
        workflowVersion: row.workflowVersion,
        organizationType: row.organizationType as any,
        entityId: row.entityId,
        entityName: row.entityName,
        currentStageId: snapshot.currentStageId || row.currentStageId,
        currentStageCode: row.currentStageCode,
        currentStageName: row.currentStageName,
        status: row.status as any,
        contextData: cleanContext,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString()
      } as WorkflowInstanceDto;
    }

    return {
      id: row.id,
      tenantId: row.tenantId || undefined,
      workflowId: row.workflowId,
      workflowCode: row.workflowCode,
      workflowVersion: row.workflowVersion,
      organizationType: row.organizationType as any,
      entityId: row.entityId,
      entityName: row.entityName,
      currentStageId: row.currentStageId,
      currentStageCode: row.currentStageCode,
      currentStageName: row.currentStageName,
      status: row.status as any,
      contextData: cleanContext,
      requirements: [],
      pendingApprovals: [],
      allowedTransitions: [],
      auditHistory: [],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    } as unknown as WorkflowInstanceDto;
  }

  async getDefinitions(orgType?: string): Promise<WorkflowDefinitionDto[]> {
    if (orgType && orgType !== 'ALL') {
      return this.definitions.filter((d) => d.organizationType.toUpperCase() === orgType.toUpperCase());
    }
    return this.definitions;
  }

  async getDefinitionByCode(
    code: string,
    version?: number
  ): Promise<{ definition: WorkflowDefinitionDto; version: WorkflowVersionDto } | null> {
    const def = this.definitions.find((d) => d.code === code);
    if (!def) return null;

    const targetVerNum = version || def.activeVersion;
    const ver = def.versions.find((v: WorkflowVersionDto) => v.version === targetVerNum) || def.versions[0];
    if (!ver) return null;

    return { definition: def, version: ver };
  }

  async createOrUpdateDefinition(definition: WorkflowDefinitionDto): Promise<WorkflowDefinitionDto> {
    const idx = this.definitions.findIndex((d) => d.code === definition.code);
    if (idx >= 0) {
      this.definitions[idx] = definition;
    } else {
      this.definitions.push(definition);
    }
    const db = this.resolveDb();
    await db
      .insert(workflowDefinitions)
      .values({
        id: toUuid(definition.id || definition.code),
        code: definition.code,
        name: definition.name,
        description: definition.description || null,
        entityType: definition.entityType,
        organizationType: definition.organizationType,
        activeVersion: definition.activeVersion,
        status: definition.status
      })
      .onConflictDoNothing();
    return definition;
  }

  async createVersion(workflowCode: string, version: WorkflowVersionDto): Promise<WorkflowVersionDto> {
    const def = this.definitions.find((d) => d.code === workflowCode);
    if (!def) throw new Error(`Workflow definition ${workflowCode} not found.`);

    def.versions = def.versions.filter((v: WorkflowVersionDto) => v.version !== version.version);
    def.versions.push(version);
    def.activeVersion = version.version;
    def.updatedAt = new Date().toISOString();
    return version;
  }

  async getInstances(filter?: { workflowCode?: string; status?: string; tenantId?: string }): Promise<WorkflowInstanceDto[]> {
    const db = this.resolveDb();
    const rows = await db
      .select()
      .from(workflowInstances)
      .orderBy(desc(workflowInstances.updatedAt));

    let list: WorkflowInstanceDto[] = rows.map((r: typeof workflowInstances.$inferSelect) => this.mapRowToDto(r));
    if (filter?.tenantId) {
      const targetTenantUuid = toUuid(filter.tenantId);
      list = list.filter((i: any) => {
        const instTenantRaw = i.tenantId || i.contextData?.tenantId;
        const instTenantUuid = instTenantRaw ? toUuid(String(instTenantRaw)) : null;
        return instTenantRaw === filter.tenantId || instTenantUuid === targetTenantUuid || i.entityId === filter.tenantId;
      });
    }
    if (filter?.workflowCode && filter.workflowCode !== 'ALL') {
      list = list.filter((i: WorkflowInstanceDto) => i.workflowCode === filter.workflowCode);
    }
    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter((i: WorkflowInstanceDto) => i.status === filter.status);
    }
    return list;
  }

  async getInstanceById(id: string, tenantId?: string): Promise<WorkflowInstanceDto | null> {
    const db = this.resolveDb();
    const rows = await db
      .select()
      .from(workflowInstances)
      .orderBy(desc(workflowInstances.updatedAt));

    for (const row of rows) {
      const dto = this.mapRowToDto(row);
      const idMatch = dto.id === id || row.id === toUuid(id) || dto.entityId === id;
      if (!idMatch) continue;

      if (tenantId) {
        const instTenantRaw = (dto as any).tenantId || (dto.contextData as any)?.tenantId || row.tenantId;
        const targetTenantUuid = toUuid(tenantId);
        const instTenantUuid = instTenantRaw ? toUuid(String(instTenantRaw)) : null;
        if (instTenantRaw && instTenantRaw !== tenantId && instTenantUuid !== targetTenantUuid && dto.entityId !== tenantId) {
          return null;
        }
      }
      return dto;
    }
    return null;
  }

  async createInstance(instance: WorkflowInstanceDto): Promise<WorkflowInstanceDto> {
    const db = this.resolveDb();
    const dbId = toUuid(instance.id);
    const tenantUuid = this.resolveInstanceTenantUuid(instance);
    const enrichedDto: WorkflowInstanceDto = {
      ...instance,
      ...(tenantUuid && !(instance as any).tenantId ? { tenantId: tenantUuid } : {})
    } as any;

    const storedContext = {
      ...(instance.contextData || {}),
      ...(tenantUuid ? { tenantId: (instance as any).tenantId || tenantUuid } : {}),
      __workflowInstanceDto: enrichedDto
    };

    await db
      .delete(workflowInstances)
      .where(eq(workflowInstances.id, dbId));

    await db.insert(workflowInstances).values({
      id: dbId,
      tenantId: tenantUuid,
      workflowId: toUuid(instance.workflowId || instance.workflowCode),
      workflowCode: instance.workflowCode,
      workflowVersion: instance.workflowVersion || 1,
      organizationType: instance.organizationType,
      entityId: instance.entityId,
      entityName: instance.entityName,
      currentStageId: toUuid(instance.currentStageId || instance.currentStageCode),
      currentStageCode: instance.currentStageCode,
      currentStageName: instance.currentStageName,
      status: instance.status,
      contextData: storedContext,
      createdAt: instance.createdAt ? new Date(instance.createdAt) : new Date(),
      updatedAt: instance.updatedAt ? new Date(instance.updatedAt) : new Date()
    });

    if (Array.isArray(instance.requirements)) {
      await db.delete(workflowRequirementInstances).where(eq(workflowRequirementInstances.instanceId, dbId));
      for (const req of instance.requirements) {
        await db.insert(workflowRequirementInstances).values({
          id: toUuid(`${dbId}:${req.requirementCode}`),
          instanceId: dbId,
          requirementId: req.requirementId || req.requirementCode,
          requirementCode: req.requirementCode,
          name: req.name,
          requirementType: req.requirementType || (req as any).type || 'DOCUMENT',
          isFulfilled: Boolean(req.isFulfilled),
          fulfilledAt: req.fulfilledAt ? new Date(req.fulfilledAt) : null,
          fulfilledBy: req.fulfilledBy || null,
          data: req.data || null,
          evaluationResult: req.evaluationResult || null
        }).onConflictDoNothing();
      }
    }

    return enrichedDto;
  }

  async updateInstance(instance: WorkflowInstanceDto): Promise<WorkflowInstanceDto> {
    const db = this.resolveDb();
    const dbId = toUuid(instance.id);
    const existing = await this.getInstanceById(instance.id);
    const existingTenant = (existing as any)?.tenantId || (existing?.contextData as any)?.tenantId;
    const incomingTenant = (instance as any).tenantId || (instance.contextData as any)?.tenantId;

    if (existingTenant && incomingTenant && toUuid(String(existingTenant)) !== toUuid(String(incomingTenant))) {
      throw new Error(`Cross-tenant workflow instance update denied for instance ${instance.id}.`);
    }

    const tenantUuid = this.resolveInstanceTenantUuid(instance) || (existingTenant ? toUuid(String(existingTenant)) : null);
    const enrichedDto: WorkflowInstanceDto = {
      ...instance,
      updatedAt: new Date().toISOString(),
      ...(existingTenant || incomingTenant ? { tenantId: incomingTenant || existingTenant } : {})
    } as any;

    const storedContext = {
      ...(instance.contextData || {}),
      ...(existingTenant || incomingTenant ? { tenantId: incomingTenant || existingTenant } : {}),
      __workflowInstanceDto: enrichedDto
    };

    if (existing) {
      await db
        .update(workflowInstances)
        .set({
          tenantId: tenantUuid,
          currentStageId: toUuid(instance.currentStageId || instance.currentStageCode),
          currentStageCode: instance.currentStageCode,
          currentStageName: instance.currentStageName,
          status: instance.status,
          contextData: storedContext,
          updatedAt: new Date()
        })
        .where(eq(workflowInstances.id, dbId));
    } else {
      await this.createInstance(enrichedDto);
    }

    if (Array.isArray(instance.requirements)) {
      await db.delete(workflowRequirementInstances).where(eq(workflowRequirementInstances.instanceId, dbId));
      for (const req of instance.requirements) {
        await db.insert(workflowRequirementInstances).values({
          id: toUuid(`${dbId}:${req.requirementCode}`),
          instanceId: dbId,
          requirementId: req.requirementId || req.requirementCode,
          requirementCode: req.requirementCode,
          name: req.name,
          requirementType: req.requirementType || (req as any).type || 'DOCUMENT',
          isFulfilled: Boolean(req.isFulfilled),
          fulfilledAt: req.fulfilledAt ? new Date(req.fulfilledAt) : null,
          fulfilledBy: req.fulfilledBy || null,
          data: req.data || null,
          evaluationResult: req.evaluationResult || null
        }).onConflictDoNothing();
      }
    }

    return enrichedDto;
  }

  async recordApproval(approval: WorkflowApprovalDto): Promise<WorkflowApprovalDto> {
    const db = this.resolveDb();
    const approvalUuid = toUuid(approval.id);
    const instanceUuid = toUuid(approval.instanceId);
    await db.delete(workflowApprovals).where(eq(workflowApprovals.id, approvalUuid));
    await db.insert(workflowApprovals).values({
      id: approvalUuid,
      instanceId: instanceUuid,
      transitionId: toUuid(approval.transitionId || 'DEFAULT_TRANSITION'),
      requiredRole: approval.requiredRole,
      status: approval.status,
      approvedBy: approval.approvedBy || null,
      approvedAt: approval.approvedAt ? new Date(approval.approvedAt) : null,
      comments: approval.comments || null
    });
    return approval;
  }

  async appendAuditLog(log: WorkflowTransitionLogDto): Promise<void> {
    const db = this.resolveDb();
    const logUuid = toUuid(log.id || `${log.instanceId}:${log.transitionCode}:${log.timestamp}`);
    await db.insert(workflowTransitionLogs).values({
      id: logUuid,
      instanceId: toUuid(log.instanceId),
      workflowId: toUuid(log.workflowId || 'DEFAULT_WORKFLOW'),
      version: log.version || 1,
      fromStageCode: log.fromStageCode,
      toStageCode: log.toStageCode,
      transitionCode: log.transitionCode,
      actorEmail: log.actorEmail,
      actorRole: log.actorRole,
      rulesEvaluated: log.rulesEvaluated || [],
      requirementsEvaluated: log.requirementsEvaluated || [],
      actionsExecuted: log.actionsExecuted || [],
      reason: log.reason || null,
      timestamp: log.timestamp ? new Date(log.timestamp) : new Date()
    }).onConflictDoNothing();
  }

  async getOffers(): Promise<DynamicOfferDto[]> {
    return this.offers;
  }

  async updateOffer(offer: DynamicOfferDto): Promise<DynamicOfferDto> {
    const idx = this.offers.findIndex((o) => o.code === offer.code || o.id === offer.id);
    if (idx >= 0) {
      this.offers[idx] = offer;
    } else {
      this.offers.push(offer);
    }
    return offer;
  }

  async getLicenceRules(orgType?: string): Promise<DynamicLicenceRuleDto[]> {
    if (orgType && orgType !== 'ALL') {
      return this.licenceRules.filter((r) => r.organizationType.toUpperCase() === orgType.toUpperCase());
    }
    return this.licenceRules;
  }

  async updateLicenceRule(rule: DynamicLicenceRuleDto): Promise<DynamicLicenceRuleDto> {
    const idx = this.licenceRules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) {
      this.licenceRules[idx] = rule;
    } else {
      this.licenceRules.push(rule);
    }
    return rule;
  }
}
