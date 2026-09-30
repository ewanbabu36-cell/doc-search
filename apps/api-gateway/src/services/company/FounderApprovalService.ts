import { founderApprovalRepository } from '../../repositories/company/FounderApprovalRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';
import { AppError, createLogger } from '@docsearch/shared-core';

const logger = createLogger('founder-approval-service');

export class FounderApprovalService {
  private isFounder(session: SessionContext): boolean {
    const isSuperAdmin = Boolean(session.isSuperAdmin);
    const hasFounderRole = session.roles.some((r) =>
      ['SUPER_ADMIN_FOUNDER', 'FOUNDER', 'SUPER_ADMIN'].includes(r)
    );
    const email = (session.actorEmail || '').toLowerCase();
    const isFounderEmail = email === 'founder@docsearch.health' || email === 'meraj@docsearch.health';
    return isSuperAdmin || hasFounderRole || isFounderEmail;
  }

  async getApprovals(session: SessionContext, status?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return founderApprovalRepository.getApprovals(status, tx);
    });
  }

  async submitForm(
    payload: {
      entityType: string;
      taskTitle: string;
      payloadData: Record<string, unknown>;
      submitterName?: string;
    },
    session: SessionContext
  ) {
    const isFounderUser = this.isFounder(session);
    const submitterName = payload.submitterName || (isFounderUser ? 'MERAJ SHARIF' : session.userId || 'System Submitter');
    const submitterEmail = session.actorEmail || (isFounderUser ? 'founder@docsearch.health' : 'user@docsearch.health');
    const submitterRole = session.roles[0] || (isFounderUser ? 'SUPER_ADMIN' : 'EMPLOYEE');

    return withSecurityContext(getDatabase(), session, async (tx) => {
      const result = await founderApprovalRepository.submitRequest(
        {
          entityType: payload.entityType,
          taskTitle: payload.taskTitle,
          submitterName,
          submitterEmail,
          submitterRole,
          payloadData: payload.payloadData,
          isFounder: isFounderUser
        },
        tx
      );

      logger.info('Founder approval workflow triggered', {
        requestId: result.id,
        isImmediate: result.isImmediateCompleted,
        submitter: submitterEmail
      });

      return result;
    });
  }

  async approveRequest(id: string, session: SessionContext, remarks?: string) {
    if (!this.isFounder(session)) {
      throw AppError.forbidden(
        'Access Denied: Only Founder MERAJ SHARIF has the authority to approve form submissions and complete tasks.'
      );
    }

    return withSecurityContext(getDatabase(), session, async (tx) => {
      const result = await founderApprovalRepository.approveRequest(
        id,
        session.actorEmail || 'founder@docsearch.health',
        remarks,
        tx
      );

      logger.info('Request approved by Founder MERAJ SHARIF', {
        requestId: id,
        approver: session.actorEmail
      });

      return result;
    });
  }

  async rejectRequest(id: string, session: SessionContext, remarks: string) {
    if (!this.isFounder(session)) {
      throw AppError.forbidden(
        'Access Denied: Only Founder MERAJ SHARIF has the authority to reject form submissions.'
      );
    }

    return withSecurityContext(getDatabase(), session, async (tx) => {
      const result = await founderApprovalRepository.rejectRequest(
        id,
        session.actorEmail || 'founder@docsearch.health',
        remarks,
        tx
      );

      logger.info('Request rejected by Founder', {
        requestId: id,
        approver: session.actorEmail
      });

      return result;
    });
  }
}

export const founderApprovalService = new FounderApprovalService();
