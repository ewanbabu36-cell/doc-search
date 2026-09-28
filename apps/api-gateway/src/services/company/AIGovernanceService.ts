import { aiGovernanceRepository } from '../../repositories/company/AIGovernanceRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class AIGovernanceService {
  async getModels(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return aiGovernanceRepository.getModels(tx);
    });
  }

  async getModelById(id: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return aiGovernanceRepository.getModelById(id, tx);
    });
  }

  async updateModel(id: string, data: any, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return aiGovernanceRepository.updateModel(id, data, tx);
    });
  }

  async getPolicies(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return aiGovernanceRepository.getPolicies(tx);
    });
  }

  async getPolicyById(id: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return aiGovernanceRepository.getPolicyById(id, tx);
    });
  }

  async transitionPolicy(id: string, toStatus: string, reason: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const email = (session as any).email || session.userId || 'founder@docsearch.health';
      return aiGovernanceRepository.transitionPolicy(id, toStatus, reason, email, tx);
    });
  }

  async getPromptTemplates(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return aiGovernanceRepository.getPromptTemplates(tx);
    });
  }

  async getPromptTemplateById(id: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return aiGovernanceRepository.getPromptTemplateById(id, tx);
    });
  }

  async getPromptVersions(promptTemplateId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return aiGovernanceRepository.getPromptVersions(promptTemplateId, tx);
    });
  }

  async approvePromptVersion(data: any, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const email = (session as any).email || session.userId || 'cmo.safety@docsearch.internal';
      return aiGovernanceRepository.approvePromptVersion(data, email, tx);
    });
  }

  async getUsageQuotas(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return aiGovernanceRepository.getUsageQuotas(tx);
    });
  }

  async getUsageRecords(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return aiGovernanceRepository.getUsageRecords(tx);
    });
  }

  async getAuditTraces(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return aiGovernanceRepository.getAuditTraces(tx);
    });
  }

  async getSafetyEvents(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return aiGovernanceRepository.getSafetyEvents(tx);
    });
  }

  async acknowledgeSafetyEvent(eventId: string, reason: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const email = (session as any).email || session.userId || 'ai.governance@docsearch.internal';
      return aiGovernanceRepository.acknowledgeSafetyEvent(eventId, reason, email, tx);
    });
  }

  async resolveSafetyEvent(eventId: string, resolutionStatus: string, notes: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const email = (session as any).email || session.userId || 'cmo.safety@docsearch.internal';
      return aiGovernanceRepository.resolveSafetyEvent(eventId, resolutionStatus, notes, email, tx);
    });
  }
}

export const aiGovernanceService = new AIGovernanceService();
