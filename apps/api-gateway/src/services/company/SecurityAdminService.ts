import { securityAdminRepository } from '../../repositories/company/SecurityAdminRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class SecurityAdminService {
  async getOverview(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return securityAdminRepository.getOverview(tx);
    });
  }

  async getRoles(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return securityAdminRepository.getRoles(tx);
    });
  }

  async getPermissions(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return securityAdminRepository.getPermissions(tx);
    });
  }

  async getPolicies(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return securityAdminRepository.getPolicies(tx);
    });
  }

  async getSessions(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return securityAdminRepository.getSessions(tx);
    });
  }

  async terminateSession(sessionId: string, reason: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return securityAdminRepository.terminateSession(sessionId, reason, session.actorEmail || 'security.lead@docsearch.internal', tx);
    });
  }

  async getCredentials(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return securityAdminRepository.getCredentials(tx);
    });
  }

  async rotateCredential(credentialCode: string, reason: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return securityAdminRepository.rotateCredential(credentialCode, reason, session.actorEmail || 'security.lead@docsearch.internal', tx);
    });
  }

  async revokeCredential(credentialCode: string, reason: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return securityAdminRepository.revokeCredential(credentialCode, reason, session.actorEmail || 'security.lead@docsearch.internal', tx);
    });
  }

  async getIncidents(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return securityAdminRepository.getIncidents(tx);
    });
  }

  async acknowledgeIncident(incidentId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return securityAdminRepository.acknowledgeIncident(incidentId, session.actorEmail || 'security.lead@docsearch.internal', tx);
    });
  }

  async resolveIncident(incidentId: string, resolutionNotes: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return securityAdminRepository.resolveIncident(incidentId, resolutionNotes, session.actorEmail || 'security.lead@docsearch.internal', tx);
    });
  }

  async getAuditVerifications(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return securityAdminRepository.getAuditVerifications(tx);
    });
  }

  async verifyAuditEvent(data: {
    auditEventReference: string;
    verificationType: string;
    verificationStatus: string;
    evidenceReference: string;
    notes: string;
  }, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return securityAdminRepository.verifyAuditEvent({
        ...data,
        actorEmail: session.actorEmail || 'security.lead@docsearch.internal'
      }, tx);
    });
  }
}

export const securityAdminService = new SecurityAdminService();
