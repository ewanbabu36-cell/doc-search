import type {
  OperationalPartnerDto,
  OperationalOrganizationDto,
  OperationalFacilityDto,
  OperationalSubscriptionDto,
  OperationalAuditTraceDto,
  PartnerFoundationOverviewDto,
  PanelContextDto,
  CreateOperationalPartnerRequest,
  UpdateOperationalPartnerRequest,
  CreateOperationalOrganizationRequest,
  UpdateOperationalOrganizationRequest,
  CreateOperationalFacilityRequest,
  UpdateOperationalFacilityRequest,
  UpdateOperationalSubscriptionRequest,
  QueryOperationalAuditRequest
} from '@docsearch/api-contracts';
import { apiCall, isMockFallbackAllowed } from './api-client.js';
import { hospitalEventBus } from './hospital-event-bus.js';
import {
  MOCK_OPERATIONAL_PARTNERS,
  MOCK_OPERATIONAL_ORGANIZATIONS,
  MOCK_OPERATIONAL_FACILITIES,
  MOCK_OPERATIONAL_SUBSCRIPTIONS,
  MOCK_OPERATIONAL_AUDIT_TRACES,
  MOCK_PANEL_CONTEXT,
  MOCK_TENANT_ID,
  MOCK_PARTNER_FOUNDATION_OVERVIEW
} from './mock-partner-foundation-data.js';

export interface IPartnerFoundationService {
  getOverview(tenantId: string): Promise<PartnerFoundationOverviewDto>;
  getPanelContext(): Promise<PanelContextDto>;
  setPanelContext(newContext: Partial<PanelContextDto>): Promise<PanelContextDto>;
  getPartners(tenantId: string): Promise<OperationalPartnerDto[]>;
  getPartnerById(tenantId: string, partnerId: string): Promise<OperationalPartnerDto | null>;
  createPartner(req: CreateOperationalPartnerRequest): Promise<OperationalPartnerDto>;
  updatePartner(req: UpdateOperationalPartnerRequest): Promise<OperationalPartnerDto>;
  getOrganizations(tenantId: string, partnerId?: string): Promise<OperationalOrganizationDto[]>;
  createOrganization(req: CreateOperationalOrganizationRequest): Promise<OperationalOrganizationDto>;
  updateOrganization(req: UpdateOperationalOrganizationRequest): Promise<OperationalOrganizationDto>;
  getFacilities(tenantId: string, partnerId?: string, organizationId?: string): Promise<OperationalFacilityDto[]>;
  createFacility(req: CreateOperationalFacilityRequest): Promise<OperationalFacilityDto>;
  updateFacility(req: UpdateOperationalFacilityRequest): Promise<OperationalFacilityDto>;
  getSubscriptions(tenantId: string, partnerId?: string): Promise<OperationalSubscriptionDto[]>;
  updateSubscription(req: UpdateOperationalSubscriptionRequest): Promise<OperationalSubscriptionDto>;
  getAuditTraces(req: QueryOperationalAuditRequest): Promise<OperationalAuditTraceDto[]>;
}

const resolveInitialPanelContext = (): PanelContextDto => {
  if (typeof window !== 'undefined') {
    try {
      const stored =
        window.localStorage?.getItem('docsearch_partner_staff_auth') ||
        window.localStorage?.getItem('docsearch_user_session');
      if (stored) {
        const u = JSON.parse(stored);
        const resolvedTId = u.tenantId || u.partnerId;
        if (resolvedTId && typeof resolvedTId === 'string' && resolvedTId.trim().length > 0) {
          return {
            activeTenantId: resolvedTId,
            activeTenantName: u.tenantName || MOCK_PANEL_CONTEXT.activeTenantName,
            activePartnerId: u.partnerId || resolvedTId,
            activePartnerName: u.tenantName || 'Doc Search Healthcare Partner',
            activeOrganizationId: u.organizationId || '',
            activeOrganizationName: u.organizationName || u.tenantName || 'Healthcare Facility',
            activeFacilityId: u.facilityId || u.branchId || '',
            activeFacilityName: u.facilityName || u.tenantName || 'Primary Facility',
            userRole: u.role || 'HOSPITAL_DIRECTOR',
            userEmail: u.email || ''
          };
        }
      }
    } catch {}
  }
  return { ...MOCK_PANEL_CONTEXT };
};

export class PartnerFoundationService implements IPartnerFoundationService {
  private partners: OperationalPartnerDto[] = [...MOCK_OPERATIONAL_PARTNERS];
  private organizations: OperationalOrganizationDto[] = [...MOCK_OPERATIONAL_ORGANIZATIONS];
  private facilities: OperationalFacilityDto[] = [...MOCK_OPERATIONAL_FACILITIES];
  private subscriptions: OperationalSubscriptionDto[] = [...MOCK_OPERATIONAL_SUBSCRIPTIONS];
  private auditTraces: OperationalAuditTraceDto[] = [...MOCK_OPERATIONAL_AUDIT_TRACES];
  private context: PanelContextDto = resolveInitialPanelContext();
  private inMemoryInvitations: Map<string, ClinicInvitationDto[]> = new Map();
  private inMemoryPreferredPartners: Map<string, ClinicPreferredPartnersDto> = new Map();

  private addAuditTrace(
    tenantId: string,
    partnerId: string,
    organizationId: string | undefined,
    branchId: string | undefined,
    actorId: string,
    actorRole: string,
    action: string,
    targetEntity: string,
    targetEntityId: string,
    justification: string,
    operationStatus: 'SUCCESS' | 'FAILURE' | 'DENIED' = 'SUCCESS'
  ) {
    const trace: OperationalAuditTraceDto = {
      id: crypto.randomUUID(),
      traceId: `op-tr-${Math.floor(1000 + Math.random() * 9000)}`,
      tenantId,
      partnerId,
      organizationId,
      branchId,
      actorId,
      actorRole,
      action,
      targetEntity,
      targetEntityId,
      justification,
      operationStatus,
      correlationId: `corr-op-${Date.now()}`,
      metadata: {},
      occurredAt: new Date().toISOString()
    };
    this.auditTraces.unshift(trace);
  }

  async getOverview(tenantId: string): Promise<PartnerFoundationOverviewDto> {
    try {
      return await apiCall<PartnerFoundationOverviewDto>('/api/v1/partner/foundation/overview');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return {
        ...MOCK_PARTNER_FOUNDATION_OVERVIEW,
        totalPartnersCount: this.partners.filter((p) => p.tenantId === tenantId).length,
        activePartnersCount: this.partners.filter((p) => p.tenantId === tenantId && p.status === 'ACTIVE').length,
        totalOrganizationsCount: this.organizations.filter((o) => o.tenantId === tenantId).length,
        clinicCount: this.organizations.filter((o) => o.tenantId === tenantId && o.organizationType === 'CLINIC').length,
        hospitalCount: this.organizations.filter((o) => o.tenantId === tenantId && o.organizationType === 'HOSPITAL').length,
        totalFacilitiesCount: this.facilities.filter((f) => f.tenantId === tenantId).length,
        activeFacilitiesCount: this.facilities.filter((f) => f.tenantId === tenantId && f.status === 'ACTIVE').length,
        operationalSubscriptionsCount: this.subscriptions.filter((s) => s.tenantId === tenantId).length,
        activeSubscriptionsCount: this.subscriptions.filter((s) => s.tenantId === tenantId && s.entitlementStatus === 'ACTIVE').length
      };
    }
  }

  async getPanelContext(): Promise<PanelContextDto> {
    if (this.context.activeTenantId === MOCK_TENANT_ID) {
      const fresh = resolveInitialPanelContext();
      if (fresh.activeTenantId !== MOCK_TENANT_ID) {
        this.context = { ...this.context, ...fresh };
      }
    }
    return { ...this.context };
  }

  async setPanelContext(newContext: Partial<PanelContextDto>): Promise<PanelContextDto> {
    this.context = {
      ...this.context,
      ...newContext
    };
    return { ...this.context };
  }

  async getPartners(tenantId: string): Promise<OperationalPartnerDto[]> {
    try {
      return await apiCall<OperationalPartnerDto[]>('/api/v1/partner/foundation/partners');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return this.partners.filter((p) => p.tenantId === tenantId);
    }
  }

  async getPartnerById(tenantId: string, partnerId: string): Promise<OperationalPartnerDto | null> {
    try {
      const partners = await this.getPartners(tenantId);
      return partners.find((p) => p.id === partnerId) ?? null;
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return this.partners.find((p) => p.id === partnerId && p.tenantId === tenantId) ?? null;
    }
  }

  async createPartner(req: CreateOperationalPartnerRequest): Promise<OperationalPartnerDto> {
    try {
      return await apiCall<OperationalPartnerDto>('/api/v1/partner/foundation/partners', {
        method: 'POST',
        body: JSON.stringify(req)
      });
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      const partner: OperationalPartnerDto = {
        id: crypto.randomUUID(),
        tenantId: req.tenantId,
        partnerCode: req.partnerCode,
        legalBusinessName: req.legalBusinessName,
        partnerType: req.partnerType,
        contactEmail: req.contactEmail,
        contactPhone: req.contactPhone,
        status: 'ONBOARDING',
        onboardingMetadata: { stage: 'INITIATED', createdBy: req.actorId },
        contractReference: req.contractReference,
        subscriptionReference: req.subscriptionReference,
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.partners.push(partner);
      this.addAuditTrace(
        req.tenantId,
        partner.id,
        undefined,
        undefined,
        req.actorId,
        req.actorRole,
        'OPERATIONAL_PARTNER_ONBOARDED',
        'operational_partners',
        partner.partnerCode,
        req.reason
      );
      return partner;
    }
  }

  async updatePartner(req: UpdateOperationalPartnerRequest): Promise<OperationalPartnerDto> {
    const p = this.partners.find((item) => item.id === req.partnerId && item.tenantId === req.tenantId);
    if (!p) {
      throw new Error(`Partner not found or inaccessible under tenant ${req.tenantId}`);
    }
    if (req.status) p.status = req.status;
    if (req.contactEmail) p.contactEmail = req.contactEmail;
    if (req.contactPhone) p.contactPhone = req.contactPhone;
    if (req.contractReference) p.contractReference = req.contractReference;
    if (req.subscriptionReference) p.subscriptionReference = req.subscriptionReference;
    p.updatedAt = new Date().toISOString();

    this.addAuditTrace(
      req.tenantId,
      p.id,
      undefined,
      undefined,
      req.actorId,
      req.actorRole,
      'OPERATIONAL_PARTNER_UPDATED',
      'operational_partners',
      p.partnerCode,
      req.reason
    );
    return { ...p };
  }

  async getOrganizations(tenantId: string, partnerId?: string): Promise<OperationalOrganizationDto[]> {
    try {
      const q = partnerId ? `?partnerId=${encodeURIComponent(partnerId)}` : '';
      const list = await apiCall<OperationalOrganizationDto[]>(`/api/v1/partner/foundation/organizations${q}`);
      if (Array.isArray(list) && list.length > 0) return list;
    } catch {}
    const orgs = this.organizations.filter((o) => o.tenantId === tenantId);
    if (partnerId) {
      const matched = orgs.filter((o) => o.partnerId === partnerId);
      if (matched.length > 0) return matched;
    }
    return orgs;
  }

  async createOrganization(req: CreateOperationalOrganizationRequest): Promise<OperationalOrganizationDto> {
    const parentPartner = this.partners.find((p) => p.id === req.partnerId && p.tenantId === req.tenantId);
    if (!parentPartner) {
      throw new Error(`[Hierarchy Violation] Invalid or cross-partner reference. Partner ${req.partnerId} not found under tenant.`);
    }

    const org: OperationalOrganizationDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      partnerName: parentPartner.legalBusinessName,
      organizationCode: req.organizationCode,
      organizationName: req.organizationName,
      organizationType: req.organizationType,
      legalEntityReference: req.legalEntityReference,
      contactEmail: req.contactEmail,
      contactPhone: req.contactPhone,
      status: 'ACTIVE',
      facilityCount: 0,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.organizations.push(org);

    // Automatically establish operational subscription entitlement linkage
    const sub: OperationalSubscriptionDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: org.id,
      organizationName: org.organizationName,
      planReference: org.organizationType === 'HOSPITAL' ? 'plan-hospital-starter' : 'plan-clinic-standard',
      enabledModules: org.organizationType === 'HOSPITAL'
        ? ['OPD', 'EMR', 'RX', 'LAB', 'PHARMACY', 'BILLING', 'APPOINTMENTS']
        : ['OPD', 'EMR', 'RX', 'BILLING', 'APPOINTMENTS'],
      entitlementStatus: 'ACTIVE',
      effectiveDate: new Date().toISOString(),
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.subscriptions.push(sub);

    this.addAuditTrace(
      req.tenantId,
      req.partnerId,
      org.id,
      undefined,
      req.actorId,
      req.actorRole,
      'OPERATIONAL_ORGANIZATION_CREATED',
      'operational_organizations',
      org.organizationCode,
      req.reason
    );
    return org;
  }

  async updateOrganization(req: UpdateOperationalOrganizationRequest): Promise<OperationalOrganizationDto> {
    const org = this.organizations.find(
      (o) => o.id === req.organizationId && o.partnerId === req.partnerId && o.tenantId === req.tenantId
    );
    if (!org) {
      throw new Error(`[Hierarchy Violation] Organization ${req.organizationId} not found under partner ${req.partnerId}.`);
    }
    if (req.organizationName) org.organizationName = req.organizationName;
    if (req.status) org.status = req.status;
    if (req.contactEmail) org.contactEmail = req.contactEmail;
    if (req.contactPhone) org.contactPhone = req.contactPhone;
    org.updatedAt = new Date().toISOString();

    this.addAuditTrace(
      req.tenantId,
      req.partnerId,
      org.id,
      undefined,
      req.actorId,
      req.actorRole,
      'OPERATIONAL_ORGANIZATION_UPDATED',
      'operational_organizations',
      org.organizationCode,
      req.reason
    );
    return { ...org };
  }

  async getFacilities(tenantId: string, partnerId?: string, organizationId?: string): Promise<OperationalFacilityDto[]> {
    try {
      const params = new URLSearchParams();
      if (partnerId) params.append('partnerId', partnerId);
      if (organizationId) params.append('organizationId', organizationId);
      const q = params.toString() ? `?${params.toString()}` : '';
      const list = await apiCall<OperationalFacilityDto[]>(`/api/v1/partner/foundation/facilities${q}`);
      if (Array.isArray(list) && list.length > 0) return list;
    } catch {}
    return this.facilities.filter((f) => {
      if (f.tenantId !== tenantId) return false;
      if (partnerId && f.partnerId !== partnerId) return false;
      if (organizationId && f.organizationId !== organizationId) return false;
      return true;
    });
  }

  async createFacility(req: CreateOperationalFacilityRequest): Promise<OperationalFacilityDto> {
    const org = this.organizations.find(
      (o) => o.id === req.organizationId && o.partnerId === req.partnerId && o.tenantId === req.tenantId
    );
    if (!org) {
      throw new Error(`[Hierarchy Violation] Cannot create branch: Organization ${req.organizationId} does not belong to partner ${req.partnerId}.`);
    }

    const fac: OperationalFacilityDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      organizationName: org.organizationName,
      facilityCode: req.facilityCode,
      facilityName: req.facilityName,
      facilityType: req.facilityType,
      addressStreet: req.addressStreet,
      addressCity: req.addressCity,
      addressState: req.addressState,
      addressPostalCode: req.addressPostalCode,
      addressCountry: req.addressCountry,
      contactEmail: req.contactEmail,
      contactPhone: req.contactPhone,
      status: 'ACTIVE',
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.facilities.push(fac);
    org.facilityCount += 1;

    this.addAuditTrace(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      fac.id,
      req.actorId,
      req.actorRole,
      'OPERATIONAL_FACILITY_BRANCH_REGISTERED',
      'operational_facilities',
      fac.facilityCode,
      req.reason
    );
    return fac;
  }

  async updateFacility(req: UpdateOperationalFacilityRequest): Promise<OperationalFacilityDto> {
    const fac = this.facilities.find(
      (f) => f.id === req.facilityId && f.organizationId === req.organizationId && f.partnerId === req.partnerId
    );
    if (!fac) {
      throw new Error(`[Hierarchy Violation] Facility ${req.facilityId} not found under organization ${req.organizationId}.`);
    }
    if (req.status) fac.status = req.status;
    if (req.contactEmail) fac.contactEmail = req.contactEmail;
    if (req.contactPhone) fac.contactPhone = req.contactPhone;
    fac.updatedAt = new Date().toISOString();

    this.addAuditTrace(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      fac.id,
      req.actorId,
      req.actorRole,
      'OPERATIONAL_FACILITY_UPDATED',
      'operational_facilities',
      fac.facilityCode,
      req.reason
    );
    return { ...fac };
  }

  async getSubscriptions(tenantId: string, partnerId?: string): Promise<OperationalSubscriptionDto[]> {
    const subs = this.subscriptions.filter((s) => s.tenantId === tenantId);
    if (partnerId) {
      return subs.filter((s) => s.partnerId === partnerId);
    }
    return subs;
  }

  async updateSubscription(req: UpdateOperationalSubscriptionRequest): Promise<OperationalSubscriptionDto> {
    const sub = this.subscriptions.find(
      (s) => s.organizationId === req.organizationId && s.partnerId === req.partnerId && s.tenantId === req.tenantId
    );
    if (!sub) {
      throw new Error(`Operational subscription for organization ${req.organizationId} not found.`);
    }
    sub.planReference = req.planReference;
    sub.enabledModules = req.enabledModules;
    sub.entitlementStatus = req.entitlementStatus;
    if (req.expiryDate) sub.expiryDate = req.expiryDate;
    sub.updatedAt = new Date().toISOString();

    this.addAuditTrace(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      undefined,
      req.actorId,
      req.actorRole,
      'OPERATIONAL_SUBSCRIPTION_ENTITLEMENT_UPDATED',
      'operational_subscriptions',
      sub.planReference,
      req.reason
    );
    return { ...sub };
  }

  async getAuditTraces(req: QueryOperationalAuditRequest): Promise<OperationalAuditTraceDto[]> {
    return this.auditTraces.filter((t) => {
      if (t.tenantId !== req.tenantId) return false;
      if (req.partnerId && t.partnerId !== req.partnerId) return false;
      if (req.organizationId && t.organizationId !== req.organizationId) return false;
      if (req.branchId && t.branchId !== req.branchId) return false;
      return true;
    });
  }

  /**
   * Solo Clinic Exclusive Partner Tie-Up Management
   * Links a solo practitioner clinic to an exclusive pathology lab and chemist
   */
  getPreferredPartners(clinicId: string = 'default-clinic'): ClinicPreferredPartnersDto {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`docsearch_preferred_partners_${clinicId}`);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    if (this.inMemoryPreferredPartners.has(clinicId)) {
      return this.inMemoryPreferredPartners.get(clinicId)!;
    }
    const defaultPartners: ClinicPreferredPartnersDto = {
      clinicId,
      exclusiveLab: {
        partnerId: 'lab-partner-01',
        partnerName: 'Shree Ram Diagnostics & Pathology',
        partnerType: 'PATHOLOGY',
        partnerCode: 'LAB-SHREE-RAM-01',
        phone: '+91 98350 11223',
        address: 'Opposite Sadar Hospital, Main Road',
        status: 'LINKED',
        linkedAt: '2026-01-15T10:00:00Z'
      },
      exclusivePharmacy: {
        partnerId: 'pharm-partner-01',
        partnerName: 'City Medicos & Chemist POS',
        partnerType: 'PHARMACY',
        partnerCode: 'PHARM-CITY-MED-01',
        phone: '+91 94310 99887',
        address: 'Shop #4, Metro Commercial Complex',
        status: 'LINKED',
        linkedAt: '2026-01-15T10:00:00Z'
      }
    };
    this.inMemoryPreferredPartners.set(clinicId, defaultPartners);
    return defaultPartners;
  }

  setPreferredPartners(clinicId: string = 'default-clinic', partners: Partial<ClinicPreferredPartnersDto>): ClinicPreferredPartnersDto {
    const current = this.getPreferredPartners(clinicId);
    const updated: ClinicPreferredPartnersDto = {
      ...current,
      ...partners,
      clinicId
    };
    this.inMemoryPreferredPartners.set(clinicId, updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`docsearch_preferred_partners_${clinicId}`, JSON.stringify(updated));
      } catch {}
    }
    return updated;
  }

  /**
   * 1-Click Mutual Handshake Protocol for Pharmacy & Pathology Portals
   */
  getIncomingClinicInvitations(partnerType: 'PHARMACY' | 'PATHOLOGY'): ClinicInvitationDto[] {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`docsearch_clinic_invitations_${partnerType}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          this.inMemoryInvitations.set(partnerType, parsed);
          return parsed;
        }
      } catch {}
    }

    if (this.inMemoryInvitations.has(partnerType)) {
      return this.inMemoryInvitations.get(partnerType)!;
    }

    const defaultInvitations: ClinicInvitationDto[] = [
      {
        invitationId: 'inv-clinic-sharma-01',
        clinicId: 'clinic-sharma',
        clinicName: 'Dr. Sharma Clinic',
        doctorName: 'Dr. Vivek Sharma (MD, Cardiology)',
        specialty: 'Cardiology & General Medicine',
        clinicCode: 'CLINIC-SHARMA-2026',
        address: 'Opposite Sadar Hospital, Metro Pillar 42, Civil Lines',
        phone: '+91 98350 11223',
        targetPartnerType: partnerType,
        status: 'PENDING',
        sentAt: 'Today, 09:15 AM'
      }
    ];
    this.inMemoryInvitations.set(partnerType, defaultInvitations);
    return defaultInvitations;
  }

  acceptClinicInvitation(
    invitationIdOrCode: string,
    partnerType: 'PHARMACY' | 'PATHOLOGY',
    partnerDetails?: { partnerId?: string; partnerName?: string; partnerCode?: string; phone?: string; address?: string }
  ): { success: boolean; message: string; invitation?: ClinicInvitationDto } {
    const list = this.getIncomingClinicInvitations(partnerType);
    const normalizedTarget = (invitationIdOrCode || '').trim().toUpperCase();

    let target = list.find(
      (inv) =>
        inv.invitationId.toUpperCase() === normalizedTarget ||
        inv.clinicCode.toUpperCase() === normalizedTarget
    );

    // If code was entered manually and not yet in incoming list, create it dynamically
    if (!target) {
      if (normalizedTarget === 'CLINIC-SHARMA-2026' || normalizedTarget.startsWith('CLINIC-')) {
        target = {
          invitationId: `inv-custom-${Date.now()}`,
          clinicId: 'clinic-sharma',
          clinicName: normalizedTarget === 'CLINIC-SHARMA-2026' ? 'Dr. Sharma Clinic' : `Clinic (${normalizedTarget})`,
          doctorName: 'Dr. Vivek Sharma (MD, Cardiology)',
          specialty: 'Cardiology & General Medicine',
          clinicCode: normalizedTarget,
          address: 'Opposite Sadar Hospital, Metro Pillar 42, Civil Lines',
          phone: '+91 98350 11223',
          targetPartnerType: partnerType,
          status: 'PENDING',
          sentAt: 'Just now'
        };
        list.unshift(target);
      } else {
        return {
          success: false,
          message: `Clinic invitation code "${invitationIdOrCode}" not found. Please verify the code.`
        };
      }
    }

    target.status = 'ACCEPTED';
    target.respondedAt = new Date().toISOString();
    target.isPaused = false;
    this.inMemoryInvitations.set(partnerType, list);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`docsearch_clinic_invitations_${partnerType}`, JSON.stringify(list));
      } catch {}
    }

    // Sync into Clinic Preferred Partners
    if (partnerType === 'PHARMACY') {
      const pharmInfo: PreferredPartnerDto = {
        partnerId: partnerDetails?.partnerId || 'pharm-partner-01',
        partnerName: partnerDetails?.partnerName || 'City Medicos & Chemist POS',
        partnerType: 'PHARMACY',
        partnerCode: partnerDetails?.partnerCode || 'PHARM-CITY-MED-01',
        phone: partnerDetails?.phone || '+91 94310 99887',
        address: partnerDetails?.address || 'Shop #4, Metro Commercial Complex',
        status: 'LINKED',
        linkedAt: new Date().toISOString()
      };
      this.setPreferredPartners(target.clinicId, { exclusivePharmacy: pharmInfo });
    } else if (partnerType === 'PATHOLOGY') {
      const labInfo: PreferredPartnerDto = {
        partnerId: partnerDetails?.partnerId || 'lab-partner-01',
        partnerName: partnerDetails?.partnerName || 'Shree Ram Diagnostics & Pathology',
        partnerType: 'PATHOLOGY',
        partnerCode: partnerDetails?.partnerCode || 'LAB-SHREE-RAM-01',
        phone: partnerDetails?.phone || '+91 98350 11223',
        address: partnerDetails?.address || 'Opposite Sadar Hospital, Main Road',
        status: 'LINKED',
        linkedAt: new Date().toISOString()
      };
      this.setPreferredPartners(target.clinicId, { exclusiveLab: labInfo });
    }

    // Emit live cross-module events
    try {
      hospitalEventBus.publish(
        'PARTNER_INVITATION_ACCEPTED',
        `${partnerType}_ACTIVITY_HUB`,
        {
          clinicId: target.clinicId,
          clinicName: target.clinicName,
          partnerType,
          partnerDetails,
          acceptedAt: new Date().toISOString()
        },
        `✓ ${target.clinicName} tie-up accepted by ${partnerDetails?.partnerName || partnerType}`
      );
    } catch {}

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('docsearch_partner_links_updated', {
            detail: { clinicId: target.clinicId, partnerType }
          })
        );
      } catch {}
    }

    return {
      success: true,
      message: `✓ Successfully linked with ${target.clinicName}! Digital requisitions will now route directly to your counter.`,
      invitation: target
    };
  }

  declineClinicInvitation(
    invitationIdOrCode: string,
    partnerType: 'PHARMACY' | 'PATHOLOGY'
  ): { success: boolean; message: string } {
    const list = this.getIncomingClinicInvitations(partnerType);
    const normalizedTarget = (invitationIdOrCode || '').trim().toUpperCase();

    const target = list.find(
      (inv) =>
        inv.invitationId.toUpperCase() === normalizedTarget ||
        inv.clinicCode.toUpperCase() === normalizedTarget
    );

    if (!target) {
      return { success: false, message: 'Invitation not found.' };
    }

    target.status = 'DECLINED';
    target.respondedAt = new Date().toISOString();
    this.inMemoryInvitations.set(partnerType, list);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`docsearch_clinic_invitations_${partnerType}`, JSON.stringify(list));
      } catch {}
    }

    try {
      hospitalEventBus.publish(
        'PARTNER_INVITATION_DECLINED',
        `${partnerType}_ACTIVITY_HUB`,
        { clinicId: target.clinicId, clinicName: target.clinicName, partnerType },
        `✕ Invitation from ${target.clinicName} declined by ${partnerType}`
      );
    } catch {}

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('docsearch_partner_links_updated', {
            detail: { clinicId: target.clinicId, partnerType }
          })
        );
      } catch {}
    }

    return { success: true, message: `Invitation from ${target.clinicName} declined.` };
  }

  getLinkedClinics(partnerType: 'PHARMACY' | 'PATHOLOGY'): ClinicInvitationDto[] {
    const list = this.getIncomingClinicInvitations(partnerType);
    return list.filter((inv) => inv.status === 'ACCEPTED');
  }

  togglePartnerConnectionStatus(clinicId: string, partnerType: 'PHARMACY' | 'PATHOLOGY', isPaused: boolean): boolean {
    const list = this.getIncomingClinicInvitations(partnerType);
    const target = list.find((inv) => inv.clinicId === clinicId);
    if (target) {
      target.isPaused = isPaused;
      this.inMemoryInvitations.set(partnerType, list);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`docsearch_clinic_invitations_${partnerType}`, JSON.stringify(list));
          window.dispatchEvent(
            new CustomEvent('docsearch_partner_links_updated', {
              detail: { clinicId, partnerType, isPaused }
            })
          );
        } catch {}
      }
      return true;
    }
    return false;
  }

  disconnectClinic(clinicId: string, partnerType: 'PHARMACY' | 'PATHOLOGY'): boolean {
    const list = this.getIncomingClinicInvitations(partnerType);
    const updated = list.filter((inv) => inv.clinicId !== clinicId);
    this.inMemoryInvitations.set(partnerType, updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`docsearch_clinic_invitations_${partnerType}`, JSON.stringify(updated));
        window.dispatchEvent(
          new CustomEvent('docsearch_partner_links_updated', {
            detail: { clinicId, partnerType }
          })
        );
      } catch {}
    }
    return true;
  }
}

export interface ClinicInvitationDto {
  invitationId: string;
  clinicId: string;
  clinicName: string;
  doctorName: string;
  specialty: string;
  clinicCode: string;
  address: string;
  phone: string;
  targetPartnerType: 'PHARMACY' | 'PATHOLOGY';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  sentAt: string;
  respondedAt?: string;
  isPaused?: boolean;
}

export interface PreferredPartnerDto {
  partnerId: string;
  partnerName: string;
  partnerType: 'PATHOLOGY' | 'PHARMACY' | 'RADIOLOGY';
  partnerCode: string;
  phone?: string;
  address?: string;
  status: 'LINKED' | 'PENDING' | 'DISCONNECTED';
  linkedAt: string;
}

export interface ClinicPreferredPartnersDto {
  clinicId: string;
  exclusiveLab?: PreferredPartnerDto;
  exclusivePharmacy?: PreferredPartnerDto;
}

export const partnerFoundationService = new PartnerFoundationService();
