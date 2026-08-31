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
import {
  MOCK_TENANT_ID,
  MOCK_OPERATIONAL_PARTNERS,
  MOCK_OPERATIONAL_ORGANIZATIONS,
  MOCK_OPERATIONAL_FACILITIES,
  MOCK_OPERATIONAL_SUBSCRIPTIONS,
  MOCK_OPERATIONAL_AUDIT_TRACES,
  MOCK_PANEL_CONTEXT,
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

export class PartnerFoundationService implements IPartnerFoundationService {
  private partners: OperationalPartnerDto[] = [...MOCK_OPERATIONAL_PARTNERS];
  private organizations: OperationalOrganizationDto[] = [...MOCK_OPERATIONAL_ORGANIZATIONS];
  private facilities: OperationalFacilityDto[] = [...MOCK_OPERATIONAL_FACILITIES];
  private subscriptions: OperationalSubscriptionDto[] = [...MOCK_OPERATIONAL_SUBSCRIPTIONS];
  private auditTraces: OperationalAuditTraceDto[] = [...MOCK_OPERATIONAL_AUDIT_TRACES];
  private context: PanelContextDto = { ...MOCK_PANEL_CONTEXT };

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
    if (tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${tenantId}`);
    }
    return {
      ...MOCK_PARTNER_FOUNDATION_OVERVIEW,
      totalPartnersCount: this.partners.length,
      activePartnersCount: this.partners.filter((p) => p.status === 'ACTIVE').length,
      totalOrganizationsCount: this.organizations.length,
      clinicCount: this.organizations.filter((o) => o.organizationType === 'CLINIC').length,
      hospitalCount: this.organizations.filter((o) => o.organizationType === 'HOSPITAL').length,
      totalFacilitiesCount: this.facilities.length,
      activeFacilitiesCount: this.facilities.filter((f) => f.status === 'ACTIVE').length,
      operationalSubscriptionsCount: this.subscriptions.length,
      activeSubscriptionsCount: this.subscriptions.filter((s) => s.entitlementStatus === 'ACTIVE').length
    };
  }

  async getPanelContext(): Promise<PanelContextDto> {
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
    if (tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${tenantId}`);
    }
    return [...this.partners];
  }

  async getPartnerById(tenantId: string, partnerId: string): Promise<OperationalPartnerDto | null> {
    if (tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${tenantId}`);
    }
    return this.partners.find((p) => p.id === partnerId) ?? null;
  }

  async createPartner(req: CreateOperationalPartnerRequest): Promise<OperationalPartnerDto> {
    if (req.tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Cannot create partner in foreign tenant ${req.tenantId}`);
    }

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
    if (tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${tenantId}`);
    }
    if (partnerId) {
      return this.organizations.filter((o) => o.partnerId === partnerId);
    }
    return [...this.organizations];
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
    if (tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${tenantId}`);
    }
    return this.facilities.filter((f) => {
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
    if (tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${tenantId}`);
    }
    if (partnerId) {
      return this.subscriptions.filter((s) => s.partnerId === partnerId);
    }
    return [...this.subscriptions];
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
    if (req.tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${req.tenantId}`);
    }
    return this.auditTraces.filter((t) => {
      if (t.tenantId !== req.tenantId) return false;
      if (req.partnerId && t.partnerId !== req.partnerId) return false;
      if (req.organizationId && t.organizationId !== req.organizationId) return false;
      if (req.branchId && t.branchId !== req.branchId) return false;
      return true;
    });
  }
}

export const partnerFoundationService = new PartnerFoundationService();
