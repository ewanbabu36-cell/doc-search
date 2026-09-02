import type {
  DynamicLicenceRuleDto,
  DynamicOfferDto,
  WorkflowApprovalDto,
  WorkflowDefinitionDto,
  WorkflowInstanceDto,
  WorkflowTransitionLogDto,
  WorkflowVersionDto
} from '@docsearch/api-contracts';
import {
  SEED_DYNAMIC_OFFERS,
  SEED_LICENCE_RULES,
  SEED_WORKFLOW_DEFINITIONS
} from '../seeds/workflow-seeds.js';

export interface IWorkflowRepository {
  getDefinitions(orgType?: string): Promise<WorkflowDefinitionDto[]>;
  getDefinitionByCode(code: string, version?: number): Promise<{ definition: WorkflowDefinitionDto; version: WorkflowVersionDto } | null>;
  createOrUpdateDefinition(definition: WorkflowDefinitionDto): Promise<WorkflowDefinitionDto>;
  createVersion(workflowCode: string, version: WorkflowVersionDto): Promise<WorkflowVersionDto>;
  
  getInstances(filter?: { workflowCode?: string; status?: string }): Promise<WorkflowInstanceDto[]>;
  getInstanceById(id: string): Promise<WorkflowInstanceDto | null>;
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
  private instances: WorkflowInstanceDto[] = [];
  private approvals: WorkflowApprovalDto[] = [];
  private auditLogs: WorkflowTransitionLogDto[] = [];
  private offers: DynamicOfferDto[] = JSON.parse(JSON.stringify(SEED_DYNAMIC_OFFERS));
  private licenceRules: DynamicLicenceRuleDto[] = JSON.parse(JSON.stringify(SEED_LICENCE_RULES));

  constructor() {
    // Seed initial instances
    this.seedInitialInstances();
  }

  private seedInitialInstances() {
    const hospDef = this.definitions.find((d) => d.code === 'HOSPITAL_LIFECYCLE');
    const hospVer = hospDef?.versions[0];
    if (hospDef && hospVer) {
      const initialStage = hospVer.stages[0]!;
      this.instances.push({
        id: 'INST-HOSP-AIIMS-01',
        workflowId: hospDef.id,
        workflowCode: hospDef.code,
        workflowVersion: hospVer.version,
        organizationType: 'HOSPITAL',
        entityId: 'AIIMS-NEW-DELHI',
        entityName: 'AIIMS Super Speciality Hospital Delhi',
        currentStageId: initialStage.id,
        currentStageCode: initialStage.code,
        currentStageName: initialStage.name,
        status: 'IN_PROGRESS',
        contextData: {
          customer: { is_new: true, tier: 'ENTERPRISE' },
          organization: { type: 'HOSPITAL', beds: 800, branches: 1 }
        },
        requirements: [
          {
            id: 'REQ-INST-01',
            instanceId: 'INST-HOSP-AIIMS-01',
            requirementId: initialStage.requirements[0]?.id || 'REQ-HOSP-01-01',
            requirementCode: 'ENTITY_REGISTRATION_DETAILS',
            name: 'Hospital Entity & GST Registration',
            requirementType: 'DOCUMENT',
            isFulfilled: true,
            fulfilledAt: '2026-09-01T10:00:00Z',
            fulfilledBy: 'admin@aiims.edu',
            data: { gstin: '07AAAAA0000A1Z5', entityType: 'GOVERNMENT_INSTITUTE' }
          }
        ],
        pendingApprovals: [],
        allowedTransitions: [],
        auditHistory: [],
        createdAt: '2026-09-01T10:00:00Z',
        updatedAt: '2026-09-01T10:00:00Z'
      });
    }
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
    const ver = def.versions.find((v) => v.version === targetVerNum) || def.versions[0];
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
    return definition;
  }

  async createVersion(workflowCode: string, version: WorkflowVersionDto): Promise<WorkflowVersionDto> {
    const def = this.definitions.find((d) => d.code === workflowCode);
    if (!def) throw new Error(`Workflow definition ${workflowCode} not found.`);

    def.versions = def.versions.filter((v) => v.version !== version.version);
    def.versions.push(version);
    def.activeVersion = version.version;
    def.updatedAt = new Date().toISOString();
    return version;
  }

  async getInstances(filter?: { workflowCode?: string; status?: string }): Promise<WorkflowInstanceDto[]> {
    let list = [...this.instances];
    if (filter?.workflowCode && filter.workflowCode !== 'ALL') {
      list = list.filter((i) => i.workflowCode === filter.workflowCode);
    }
    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter((i) => i.status === filter.status);
    }
    return list;
  }

  async getInstanceById(id: string): Promise<WorkflowInstanceDto | null> {
    const inst = this.instances.find((i) => i.id === id || i.entityId === id);
    return inst || null;
  }

  async createInstance(instance: WorkflowInstanceDto): Promise<WorkflowInstanceDto> {
    this.instances = [instance, ...this.instances.filter((i) => i.id !== instance.id)];
    return instance;
  }

  async updateInstance(instance: WorkflowInstanceDto): Promise<WorkflowInstanceDto> {
    const idx = this.instances.findIndex((i) => i.id === instance.id);
    if (idx >= 0) {
      this.instances[idx] = instance;
    } else {
      this.instances.push(instance);
    }
    return instance;
  }

  async recordApproval(approval: WorkflowApprovalDto): Promise<WorkflowApprovalDto> {
    this.approvals = [approval, ...this.approvals.filter((a) => a.id !== approval.id)];
    return approval;
  }

  async appendAuditLog(log: WorkflowTransitionLogDto): Promise<void> {
    this.auditLogs.unshift(log);
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
    const idx = this.licenceRules.findIndex((r) => r.id === rule.id || (r.organizationType === rule.organizationType && r.licenceTypeCode === rule.licenceTypeCode));
    if (idx >= 0) {
      this.licenceRules[idx] = rule;
    } else {
      this.licenceRules.push(rule);
    }
    return rule;
  }
}

export const workflowRepository = new WorkflowRepository();
