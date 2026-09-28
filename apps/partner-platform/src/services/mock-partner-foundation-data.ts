import type {
  OperationalPartnerDto,
  OperationalOrganizationDto,
  OperationalFacilityDto,
  OperationalSubscriptionDto,
  OperationalAuditTraceDto,
  PartnerFoundationOverviewDto,
  PanelContextDto
} from '@docsearch/api-contracts';

export const MOCK_TENANT_ID = '11111111-1111-4111-8111-111111111111';
export const MOCK_TENANT_NAME = 'Doc Search Production Healthcare Network';

export const MOCK_OPERATIONAL_PARTNERS: OperationalPartnerDto[] = [];
export const MOCK_OPERATIONAL_ORGANIZATIONS: OperationalOrganizationDto[] = [];
export const MOCK_OPERATIONAL_FACILITIES: OperationalFacilityDto[] = [];
export const MOCK_OPERATIONAL_SUBSCRIPTIONS: OperationalSubscriptionDto[] = [];
export const MOCK_OPERATIONAL_AUDIT_TRACES: OperationalAuditTraceDto[] = [];

export const MOCK_PANEL_CONTEXT: PanelContextDto = {
  activeTenantId: MOCK_TENANT_ID,
  activeTenantName: MOCK_TENANT_NAME,
  activePartnerId: '',
  activePartnerName: 'Doc Search System Network',
  activeOrganizationId: '',
  activeOrganizationName: 'Doc Search System HQ',
  activeFacilityId: '',
  activeFacilityName: 'Doc Search Central Cloud',
  userRole: 'HOSPITAL_DIRECTOR',
  userEmail: ''
};

export const MOCK_PARTNER_FOUNDATION_OVERVIEW: PartnerFoundationOverviewDto = {
  totalPartnersCount: 0,
  activePartnersCount: 0,
  totalOrganizationsCount: 0,
  clinicCount: 0,
  hospitalCount: 0,
  totalFacilitiesCount: 0,
  activeFacilitiesCount: 0,
  operationalSubscriptionsCount: 0,
  activeSubscriptionsCount: 0
};
