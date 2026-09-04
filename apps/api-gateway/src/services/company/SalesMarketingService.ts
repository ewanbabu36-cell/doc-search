import { salesMarketingRepository } from '../../repositories/company/SalesMarketingRepository.js';
import { partnerService, type CreatePartnerOnboardingInput } from './PartnerService.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';
import { AppError } from '@docsearch/shared-core';

export class SalesMarketingService {
  async getLeads(status: string | undefined, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return salesMarketingRepository.getLeads(status, tx);
    });
  }

  async getLeadById(leadId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const lead = await salesMarketingRepository.getLeadById(leadId, tx);
      if (!lead) {
        throw AppError.notFound(`Lead ${leadId} not found`);
      }
      return lead;
    });
  }

  async createLead(
    leadData: {
      organizationName: string;
      contactName: string;
      contactEmail: string;
      contactPhone?: string;
      contactRoleTitle?: string;
      source?: string;
      status?: string;
      assignedOwnerId?: string;
      assignedOwnerEmail?: string;
      notes?: string;
      metadata?: Record<string, any>;
    },
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return salesMarketingRepository.createLead(leadData, tx);
    });
  }

  async updateLeadStatus(
    leadId: string,
    status: string,
    notes: string | undefined,
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const lead = await salesMarketingRepository.getLeadById(leadId, tx);
      if (!lead) {
        throw AppError.notFound(`Lead ${leadId} not found`);
      }
      return salesMarketingRepository.updateLead(
        leadId,
        {
          status,
          notes: notes !== undefined ? notes : lead.notes,
          lastActivityDate: new Date()
        },
        tx
      );
    });
  }

  async convertLeadToPartner(
    leadId: string,
    partnerData: Partial<CreatePartnerOnboardingInput>,
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const lead = await salesMarketingRepository.getLeadById(leadId, tx);
      if (!lead) {
        throw AppError.notFound(`Lead ${leadId} not found`);
      }

      const onboardingInput: CreatePartnerOnboardingInput = {
        legalName: partnerData.legalName || lead.organizationName,
        tradeName: partnerData.tradeName || lead.organizationName,
        primaryContactName: partnerData.primaryContactName || lead.contactName,
        primaryContactEmail: partnerData.primaryContactEmail || lead.contactEmail,
        primaryContactPhone: partnerData.primaryContactPhone || lead.contactPhone || undefined,
        primaryContactRole: partnerData.primaryContactRole || lead.contactRoleTitle || 'ADMIN',
        planId: partnerData.planId,
        planCode: partnerData.planCode || 'PLAN_HOSPITAL_PRO',
        billingCycle: partnerData.billingCycle || 'ANNUAL',
        isTrial: partnerData.isTrial || false,
        metadata: {
          convertedFromLeadId: leadId,
          ...((lead.metadata as Record<string, any>) || {}),
          ...(partnerData.metadata || {})
        }
      };

      // Call partner onboarding in the same transaction
      const partnerResult = await partnerService.createPartner(onboardingInput, session);

      // Update lead to CONVERTED
      await salesMarketingRepository.updateLead(
        leadId,
        {
          status: 'CONVERTED',
          notes: (lead.notes || '') + `\nConverted to Partner ${partnerResult.partner.id} on ${new Date().toISOString()}`,
          metadata: {
            ...((lead.metadata as Record<string, any>) || {}),
            convertedPartnerId: partnerResult.partner.id,
            convertedTenantId: partnerResult.tenantId,
            convertedAt: new Date().toISOString()
          }
        },
        tx
      );

      return {
        leadId,
        leadStatus: 'CONVERTED',
        ...partnerResult
      };
    });
  }

  async getOpportunities(stage: string | undefined, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return salesMarketingRepository.getOpportunities(stage, tx);
    });
  }

  async getCampaigns(status: string | undefined, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return salesMarketingRepository.getCampaigns(status, tx);
    });
  }
}

export const salesMarketingService = new SalesMarketingService();

