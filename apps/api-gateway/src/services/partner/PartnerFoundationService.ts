import { partnerFoundationRepository, type CreatePartnerData } from '../../repositories/partner/PartnerFoundationRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class PartnerFoundationService {
  async getOverview(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return partnerFoundationRepository.getOverview(session.tenantId, tx);
    });
  }

  async getPartners(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return partnerFoundationRepository.getPartners(session.tenantId, tx);
    });
  }

  async createPartner(data: Omit<CreatePartnerData, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const created = await partnerFoundationRepository.createPartner({
        ...data,
        tenantId: session.tenantId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'PARTNER_FOUNDATION_CREATED',
        resourceType: 'partner_profile',
        resourceId: created.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { tradeName: created.tradeName }
      }, session, tx);

      return created;
    });
  }
}

export const partnerFoundationService = new PartnerFoundationService();
