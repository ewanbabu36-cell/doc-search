import { salesMarketingRepository } from '../../repositories/company/SalesMarketingRepository.js';
import { partnerRepository } from '../../repositories/company/PartnerRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { partnerService, type CreatePartnerOnboardingInput } from './PartnerService.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';
import { AppError, ErrorCode } from '@docsearch/shared-core';

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

  async checkLeadDuplicate(leadId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const lead = await salesMarketingRepository.getLeadById(leadId, tx);
      if (!lead) {
        throw AppError.notFound(`Lead ${leadId} not found`);
      }
      return salesMarketingRepository.checkDuplicates(
        {
          email: lead.contactEmail,
          phone: lead.contactPhone || undefined,
          organizationName: lead.organizationName,
          leadId
        },
        tx
      );
    });
  }

  async convertLeadToPartner(
    leadId: string,
    partnerData: Partial<CreatePartnerOnboardingInput> & {
      linkToPartnerId?: string;
      forceCreate?: boolean;
      skipDuplicateCheck?: boolean;
      notes?: string;
    },
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const lead = await salesMarketingRepository.getLeadById(leadId, tx);
      if (!lead) {
        throw AppError.notFound(`Lead ${leadId} not found`);
      }

      // 1. Check for explicit linking to an existing partner
      if (partnerData.linkToPartnerId) {
        const existingPartner = await partnerRepository.findById(partnerData.linkToPartnerId, tx);
        if (!existingPartner) {
          throw AppError.notFound(`Target partner ${partnerData.linkToPartnerId} for linking not found`);
        }

        await salesMarketingRepository.updateLead(
          leadId,
          {
            status: 'CONVERTED',
            notes: (lead.notes || '') + `\nLinked to existing Partner ${existingPartner.id} (${existingPartner.tradeName}) on ${new Date().toISOString()}`,
            metadata: {
              ...((lead.metadata as Record<string, any>) || {}),
              convertedPartnerId: existingPartner.id,
              convertedTenantId: existingPartner.tenantId,
              convertedAt: new Date().toISOString(),
              linkedReason: partnerData.notes || 'Manually resolved duplicate linking'
            }
          },
          tx
        );

        await auditRepository.recordEvent(
          {
            eventType: 'LEAD_LINKED_TO_PARTNER',
            resourceType: 'sales_leads',
            resourceId: leadId,
            tenantId: existingPartner.tenantId,
            metadata: {
              leadId,
              partnerId: existingPartner.id,
              organizationName: lead.organizationName,
              linkedBy: session.actorEmail
            }
          },
          session,
          tx
        );

        return {
          leadId,
          leadStatus: 'CONVERTED',
          partner: existingPartner,
          tenantId: existingPartner.tenantId,
          linkedToExisting: true
        };
      }

      // 2. Duplicate Detection Guard
      if (!partnerData.skipDuplicateCheck && !partnerData.forceCreate) {
        const dupCheck = await salesMarketingRepository.checkDuplicates(
          {
            email: partnerData.primaryContactEmail || lead.contactEmail,
            phone: partnerData.primaryContactPhone || lead.contactPhone || undefined,
            organizationName: partnerData.tradeName || partnerData.legalName || lead.organizationName,
            leadId
          },
          tx
        );

        if (dupCheck.hasDuplicate) {
          throw new AppError({
            message: `Possible duplicate partner detected for lead "${lead.organizationName}". Link to existing partner or specify forceCreate=true.`,
            code: ErrorCode.CONFLICT,
            statusCode: 409,
            details: dupCheck.duplicates as any
          });
        }
      }

      const onboardingInput: CreatePartnerOnboardingInput = {
        legalName: partnerData.legalName || lead.organizationName,
        tradeName: partnerData.tradeName || lead.organizationName,
        partnerType: partnerData.partnerType || 'HOSPITAL_NETWORK',
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

      // Tamper-evident Audit record
      await auditRepository.recordEvent(
        {
          eventType: 'LEAD_CONVERTED_TO_PARTNER',
          resourceType: 'sales_leads',
          resourceId: leadId,
          tenantId: partnerResult.tenantId,
          metadata: {
            leadId,
            partnerId: partnerResult.partner.id,
            organizationName: partnerResult.partner.legalName,
            convertedBy: session.actorEmail
          }
        },
        session,
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

