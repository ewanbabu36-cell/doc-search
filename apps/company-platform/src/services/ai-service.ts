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

import { apiCall, isMockFallbackAllowed } from './api-client.js';

export class AIService implements IAIService {
  private models: AIModelDto[] = [...mockAIModels];
  private policies: AIGovernancePolicyDto[] = [...mockGovernancePolicies];
  private promptTemplates: AIPromptTemplateDto[] = [...mockPromptTemplates];
  private promptVersions: AIPromptVersionDto[] = [...mockPromptVersions];
  private quotas: AIUsageQuotaDto[] = [...mockAIUsageQuotas];
  private usageRecords: AIUsageRecordDto[] = [...mockAIUsageRecords];
  private traces: AIAuditTraceDto[] = [...mockAIAuditTraces];
  private safetyEvents: AISafetyEventDto[] = [...mockAISafetyEvents];

  constructor(_apiUrl?: string | undefined) {}

  async getModels(): Promise<AIModelDto[]> {
    try {
      return await apiCall<AIModelDto[]>('/api/v1/company/ai/models');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.models];
    }
  }

  async getModelById(id: string): Promise<AIModelDto | null> {
    try {
      return await apiCall<AIModelDto>(`/api/v1/company/ai/models/${id}`);
    } catch (error: any) {
      if (error?.statusCode === 404) return null;
      if (!isMockFallbackAllowed()) throw error;
      const m = this.models.find((item) => item.id === id);
      return m ? { ...m } : null;
    }
  }

  async updateModel(
    id: string,
    req: UpdateAIModelRequest,
    _actorEmail = 'lead.mlops@docsearch.internal'
  ): Promise<AIModelDto> {
    try {
      return await apiCall<AIModelDto>(`/api/v1/company/ai/models/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(req)
      });
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
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
  }

  async getGovernancePolicies(): Promise<AIGovernancePolicyDto[]> {
    try {
      return await apiCall<AIGovernancePolicyDto[]>('/api/v1/company/ai/policies');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.policies];
    }
  }

  async getGovernancePolicyById(id: string): Promise<AIGovernancePolicyDto | null> {
    try {
      return await apiCall<AIGovernancePolicyDto>(`/api/v1/company/ai/policies/${id}`);
    } catch (error: any) {
      if (error?.statusCode === 404) return null;
      if (!isMockFallbackAllowed()) throw error;
      const p = this.policies.find((item) => item.id === id);
      return p ? { ...p } : null;
    }
  }

  async transitionGovernancePolicy(
    id: string,
    req: TransitionGovernancePolicyRequest,
    actorEmail = 'cmo.safety@docsearch.internal'
  ): Promise<AIGovernancePolicyDto> {
    try {
      return await apiCall<AIGovernancePolicyDto>(`/api/v1/company/ai/policies/${id}/transition`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
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
  }

  async getPromptTemplates(): Promise<AIPromptTemplateDto[]> {
    try {
      return await apiCall<AIPromptTemplateDto[]>('/api/v1/company/ai/prompts');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.promptTemplates];
    }
  }

  async getPromptTemplateById(id: string): Promise<AIPromptTemplateDto | null> {
    try {
      return await apiCall<AIPromptTemplateDto>(`/api/v1/company/ai/prompts/${id}`);
    } catch (error: any) {
      if (error?.statusCode === 404) return null;
      if (!isMockFallbackAllowed()) throw error;
      const pt = this.promptTemplates.find((item) => item.id === id);
      return pt ? { ...pt } : null;
    }
  }

  async getPromptVersions(promptTemplateId: string): Promise<AIPromptVersionDto[]> {
    try {
      return await apiCall<AIPromptVersionDto[]>(`/api/v1/company/ai/prompts/${promptTemplateId}/versions`);
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return this.promptVersions.filter((v) => v.promptTemplateId === promptTemplateId);
    }
  }

  async approvePromptVersion(
    req: ApprovePromptVersionRequest,
    actorEmail = 'cmo.safety@docsearch.internal'
  ): Promise<AIPromptVersionDto> {
    try {
      return await apiCall<AIPromptVersionDto>('/api/v1/company/ai/prompts/versions/approve', {
        method: 'POST',
        body: JSON.stringify(req)
      });
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
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
  }

  async getUsageQuotas(): Promise<AIUsageQuotaDto[]> {
    try {
      return await apiCall<AIUsageQuotaDto[]>('/api/v1/company/ai/quotas');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.quotas];
    }
  }

  async getUsageRecords(): Promise<AIUsageRecordDto[]> {
    try {
      return await apiCall<AIUsageRecordDto[]>('/api/v1/company/ai/usage-records');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.usageRecords];
    }
  }

  async getAuditTraces(): Promise<AIAuditTraceDto[]> {
    try {
      return await apiCall<AIAuditTraceDto[]>('/api/v1/company/ai/audit');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.traces];
    }
  }

  async getSafetyEvents(): Promise<AISafetyEventDto[]> {
    try {
      return await apiCall<AISafetyEventDto[]>('/api/v1/company/ai/safety-events');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.safetyEvents];
    }
  }

  async acknowledgeSafetyEvent(
    req: AcknowledgeSafetyEventRequest,
    actorEmail = 'ai.governance@docsearch.internal'
  ): Promise<AISafetyEventDto> {
    try {
      return await apiCall<AISafetyEventDto>('/api/v1/company/ai/safety-events/acknowledge', {
        method: 'POST',
        body: JSON.stringify(req)
      });
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
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
  }

  async resolveSafetyEvent(
    req: ResolveSafetyEventRequest,
    _actorEmail = 'cmo.safety@docsearch.internal'
  ): Promise<AISafetyEventDto> {
    try {
      return await apiCall<AISafetyEventDto>('/api/v1/company/ai/safety-events/resolve', {
        method: 'POST',
        body: JSON.stringify(req)
      });
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
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
}

export const aiService = new AIService();
