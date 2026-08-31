import { partnerRepository, type FindPartnersParams } from '../../repositories/company/PartnerRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase, type PartnerProfile, type NewPartnerProfile } from '@docsearch/database';
import { AppError, ErrorCode } from '@docsearch/shared-core';

export class PartnerService {
  async getPartners(params: FindPartnersParams, session: SessionContext): Promise<{ items: PartnerProfile[]; total: number }> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return partnerRepository.findMany(params, tx);
    });
  }

  async getPartnerById(partnerId: string, session: SessionContext): Promise<PartnerProfile> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const partner = await partnerRepository.findById(partnerId, tx);
      if (!partner) {
        throw AppError.notFound(`Partner ${partnerId} not found`);
      }
      return partner;
    });
  }

  async createPartner(data: Omit<NewPartnerProfile, 'id' | 'createdAt' | 'updatedAt'>, session: SessionContext): Promise<PartnerProfile> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const created = await partnerRepository.create(data as NewPartnerProfile, tx);

      // Audit event
      await auditRepository.recordEvent({
        eventType: 'PARTNER_CREATED',
        resourceType: 'PARTNER_PROFILE',
        resourceId: created.id,
        tenantId: created.tenantId,
        metadata: {
          legalName: created.legalName,
          partnerType: created.partnerType,
          lifecycleStatus: created.lifecycleStatus
        }
      }, session, tx);

      return created;
    });
  }

  async updatePartnerStatus(
    partnerId: string,
    fromStatus: string,
    toStatus: string,
    reason: string,
    session: SessionContext
  ): Promise<PartnerProfile> {
    // Valid state transitions check
    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      LEAD: ['PROSPECT', 'ONBOARDING'],
      PROSPECT: ['ONBOARDING', 'SUSPENDED'],
      ONBOARDING: ['VERIFICATION', 'ACTIVE', 'SUSPENDED'],
      VERIFICATION: ['ACTIVE', 'SUSPENDED'],
      ACTIVE: ['SUSPENDED', 'OFFBOARDED'],
      SUSPENDED: ['ACTIVE', 'OFFBOARDED'],
      OFFBOARDED: []
    };

    const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
    if (!allowed.includes(toStatus)) {
      throw new AppError({
        message: `Invalid partner status transition from ${fromStatus} to ${toStatus}. Allowed transitions: ${allowed.join(', ') || 'None'}`,
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }

    return withSecurityContext(getDatabase(), session, async (tx) => {
      const updated = await partnerRepository.updateStatus(
        partnerId,
        fromStatus,
        toStatus,
        session.userId || 'system',
        reason,
        tx
      );

      // Record audit
      await auditRepository.recordEvent({
        eventType: 'PARTNER_STATUS_UPDATED',
        resourceType: 'PARTNER_PROFILE',
        resourceId: partnerId,
        tenantId: updated.tenantId,
        metadata: {
          fromStatus,
          toStatus,
          reason
        }
      }, session, tx);

      return updated;
    });
  }
}

export const partnerService = new PartnerService();
