import type {
  AIModelDto,
  AIGovernancePolicyDto,
  AIPromptTemplateDto,
  AIPromptVersionDto,
  AIUsageQuotaDto,
  AIUsageRecordDto,
  AIAuditTraceDto,
  AISafetyEventDto,
  UpdateAIModelRequest,
  TransitionGovernancePolicyRequest,
  ApprovePromptVersionRequest,
  AcknowledgeSafetyEventRequest,
  ResolveSafetyEventRequest
} from '@docsearch/api-contracts';
import {
  mockAIModels,
  mockGovernancePolicies,
  mockPromptTemplates,
  mockPromptVersions,
  mockAIUsageQuotas,
  mockAIUsageRecords,
  mockAIAuditTraces,
  mockAISafetyEvents
} from './mock-ai-data.js';

export interface IAIService {
  getModels(): Promise<AIModelDto[]>;
  getModelById(id: string): Promise<AIModelDto | null>;
  updateModel(id: string, req: UpdateAIModelRequest, actorEmail?: string): Promise<AIModelDto>;

  getGovernancePolicies(): Promise<AIGovernancePolicyDto[]>;
  getGovernancePolicyById(id: string): Promise<AIGovernancePolicyDto | null>;
  transitionGovernancePolicy(
    id: string,
    req: TransitionGovernancePolicyRequest,
    actorEmail?: string
  ): Promise<AIGovernancePolicyDto>;

  getPromptTemplates(): Promise<AIPromptTemplateDto[]>;
  getPromptTemplateById(id: string): Promise<AIPromptTemplateDto | null>;
  getPromptVersions(promptTemplateId: string): Promise<AIPromptVersionDto[]>;
  approvePromptVersion(
    req: ApprovePromptVersionRequest,
    actorEmail?: string
  ): Promise<AIPromptVersionDto>;

  getUsageQuotas(): Promise<AIUsageQuotaDto[]>;
  getUsageRecords(): Promise<AIUsageRecordDto[]>;

  getAuditTraces(): Promise<AIAuditTraceDto[]>;

  getSafetyEvents(): Promise<AISafetyEventDto[]>;
  acknowledgeSafetyEvent(
    req: AcknowledgeSafetyEventRequest,
    actorEmail?: string
  ): Promise<AISafetyEventDto>;
  resolveSafetyEvent(
    req: ResolveSafetyEventRequest,
    actorEmail?: string
  ): Promise<AISafetyEventDto>;
}

export class AIService implements IAIService {
  private readonly apiUrl?: string | undefined;
  private models: AIModelDto[] = [...mockAIModels];
  private policies: AIGovernancePolicyDto[] = [...mockGovernancePolicies];
  private promptTemplates: AIPromptTemplateDto[] = [...mockPromptTemplates];
  private promptVersions: AIPromptVersionDto[] = [...mockPromptVersions];
  private quotas: AIUsageQuotaDto[] = [...mockAIUsageQuotas];
  private usageRecords: AIUsageRecordDto[] = [...mockAIUsageRecords];
  private traces: AIAuditTraceDto[] = [...mockAIAuditTraces];
  private safetyEvents: AISafetyEventDto[] = [...mockAISafetyEvents];

  constructor(apiUrl?: string | undefined) {
    this.apiUrl = apiUrl;
  }

  async getModels(): Promise<AIModelDto[]> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/ai/models`);
      if (!res.ok) throw new Error(`Failed to fetch AI models: ${res.statusText}`);
      return (await res.json()) as AIModelDto[];
    }
    return [...this.models];
  }

  async getModelById(id: string): Promise<AIModelDto | null> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/ai/models/${id}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Failed to fetch AI model: ${res.statusText}`);
      return (await res.json()) as AIModelDto;
    }
    const m = this.models.find((item) => item.id === id);
    return m ? { ...m } : null;
  }

  async updateModel(
    id: string,
    req: UpdateAIModelRequest,
    _actorEmail = 'lead.mlops@docsearch.internal'
  ): Promise<AIModelDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/ai/models/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`Failed to update AI model: ${res.statusText}`);
      return (await res.json()) as AIModelDto;
    }

    const idx = this.models.findIndex((item) => item.id === id);
    const m = this.models[idx];
    if (idx === -1 || !m) throw new Error(`Model ${id} not found`);

    const updated: AIModelDto = {
      ...m,
      ...(req.modelName ? { modelName: req.modelName } : {}),
      ...(req.description ? { description: req.description } : {}),
      ...(req.lifecycleStatus ? { lifecycleStatus: req.lifecycleStatus } : {}),
      ...(req.deploymentStatus ? { deploymentStatus: req.deploymentStatus } : {}),
      ...(req.approvedForProduction !== undefined ? { approvedForProduction: req.approvedForProduction } : {}),
      ...(req.approvedForClinicalContext !== undefined ? { approvedForClinicalContext: req.approvedForClinicalContext } : {}),
      updatedAt: new Date().toISOString()
    };
    this.models[idx] = updated;
    return { ...updated };
  }

  async getGovernancePolicies(): Promise<AIGovernancePolicyDto[]> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/ai/policies`);
      if (!res.ok) throw new Error(`Failed to fetch AI policies: ${res.statusText}`);
      return (await res.json()) as AIGovernancePolicyDto[];
    }
    return [...this.policies];
  }

  async getGovernancePolicyById(id: string): Promise<AIGovernancePolicyDto | null> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/ai/policies/${id}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Failed to fetch AI policy: ${res.statusText}`);
      return (await res.json()) as AIGovernancePolicyDto;
    }
    const p = this.policies.find((item) => item.id === id);
    return p ? { ...p } : null;
  }

  async transitionGovernancePolicy(
    id: string,
    req: TransitionGovernancePolicyRequest,
    actorEmail = 'cmo.safety@docsearch.internal'
  ): Promise<AIGovernancePolicyDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/ai/policies/${id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`Failed to transition AI policy: ${res.statusText}`);
      return (await res.json()) as AIGovernancePolicyDto;
    }

    const idx = this.policies.findIndex((item) => item.id === id);
    const p = this.policies[idx];
    if (idx === -1 || !p) throw new Error(`Policy ${id} not found`);

    const updated: AIGovernancePolicyDto = {
      ...p,
      status: req.toStatus,
      approvedAt: req.toStatus === 'APPROVED' ? new Date().toISOString() : p.approvedAt,
      approvedByEmail: req.toStatus === 'APPROVED' ? actorEmail : p.approvedByEmail,
      updatedAt: new Date().toISOString()
    };
    this.policies[idx] = updated;
    return { ...updated };
  }

  async getPromptTemplates(): Promise<AIPromptTemplateDto[]> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/ai/prompts`);
      if (!res.ok) throw new Error(`Failed to fetch prompt templates: ${res.statusText}`);
      return (await res.json()) as AIPromptTemplateDto[];
    }
    return [...this.promptTemplates];
  }

  async getPromptTemplateById(id: string): Promise<AIPromptTemplateDto | null> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/ai/prompts/${id}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Failed to fetch prompt template: ${res.statusText}`);
      return (await res.json()) as AIPromptTemplateDto;
    }
    const pt = this.promptTemplates.find((item) => item.id === id);
    return pt ? { ...pt } : null;
  }

  async getPromptVersions(promptTemplateId: string): Promise<AIPromptVersionDto[]> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/ai/prompts/${promptTemplateId}/versions`);
      if (!res.ok) throw new Error(`Failed to fetch prompt versions: ${res.statusText}`);
      return (await res.json()) as AIPromptVersionDto[];
    }
    return this.promptVersions.filter((v) => v.promptTemplateId === promptTemplateId);
  }

  async approvePromptVersion(
    req: ApprovePromptVersionRequest,
    actorEmail = 'cmo.safety@docsearch.internal'
  ): Promise<AIPromptVersionDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/ai/prompts/versions/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`Failed to approve prompt version: ${res.statusText}`);
      return (await res.json()) as AIPromptVersionDto;
    }

    const idx = this.promptVersions.findIndex((v) => v.id === req.promptVersionId);
    const pv = this.promptVersions[idx];
    if (idx === -1 || !pv) throw new Error(`Prompt version ${req.promptVersionId} not found`);

    const updated: AIPromptVersionDto = {
      ...pv,
      approvalStatus: req.approvalStatus,
      approvedAt: req.approvalStatus === 'APPROVED_FOR_PRODUCTION' ? new Date().toISOString() : undefined,
      approvedByEmail: req.approvalStatus === 'APPROVED_FOR_PRODUCTION' ? actorEmail : undefined,
      effectiveAt: req.approvalStatus === 'APPROVED_FOR_PRODUCTION' ? new Date().toISOString() : undefined
    };
    this.promptVersions[idx] = updated;
    return { ...updated };
  }

  async getUsageQuotas(): Promise<AIUsageQuotaDto[]> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/ai/quotas`);
      if (!res.ok) throw new Error(`Failed to fetch AI quotas: ${res.statusText}`);
      return (await res.json()) as AIUsageQuotaDto[];
    }
    return [...this.quotas];
  }

  async getUsageRecords(): Promise<AIUsageRecordDto[]> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/ai/usage-records`);
      if (!res.ok) throw new Error(`Failed to fetch AI usage records: ${res.statusText}`);
      return (await res.json()) as AIUsageRecordDto[];
    }
    return [...this.usageRecords];
  }

  async getAuditTraces(): Promise<AIAuditTraceDto[]> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/ai/traces`);
      if (!res.ok) throw new Error(`Failed to fetch AI audit traces: ${res.statusText}`);
      return (await res.json()) as AIAuditTraceDto[];
    }
    return [...this.traces];
  }

  async getSafetyEvents(): Promise<AISafetyEventDto[]> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/ai/safety-events`);
      if (!res.ok) throw new Error(`Failed to fetch AI safety events: ${res.statusText}`);
      return (await res.json()) as AISafetyEventDto[];
    }
    return [...this.safetyEvents];
  }

  async acknowledgeSafetyEvent(
    req: AcknowledgeSafetyEventRequest,
    actorEmail = 'ai.governance@docsearch.internal'
  ): Promise<AISafetyEventDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/ai/safety-events/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`Failed to acknowledge safety event: ${res.statusText}`);
      return (await res.json()) as AISafetyEventDto;
    }

    const idx = this.safetyEvents.findIndex((e) => e.id === req.eventId);
    const evt = this.safetyEvents[idx];
    if (idx === -1 || !evt) throw new Error(`Safety event ${req.eventId} not found`);

    const updated: AISafetyEventDto = {
      ...evt,
      status: 'ACKNOWLEDGED',
      acknowledgedByEmail: actorEmail,
      acknowledgedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.safetyEvents[idx] = updated;
    return { ...updated };
  }

  async resolveSafetyEvent(
    req: ResolveSafetyEventRequest,
    _actorEmail = 'cmo.safety@docsearch.internal'
  ): Promise<AISafetyEventDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/ai/safety-events/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`Failed to resolve safety event: ${res.statusText}`);
      return (await res.json()) as AISafetyEventDto;
    }

    const idx = this.safetyEvents.findIndex((e) => e.id === req.eventId);
    const evt = this.safetyEvents[idx];
    if (idx === -1 || !evt) throw new Error(`Safety event ${req.eventId} not found`);

    const updated: AISafetyEventDto = {
      ...evt,
      status: req.resolutionStatus,
      updatedAt: new Date().toISOString()
    };
    this.safetyEvents[idx] = updated;
    return { ...updated };
  }
}

export const aiService = new AIService();
