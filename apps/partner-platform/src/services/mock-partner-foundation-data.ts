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

export const MOCK_OPERATIONAL_PARTNERS: OperationalPartnerDto[] = [
  {
    id: '22222222-2222-4222-8222-222222222201',
    tenantId: MOCK_TENANT_ID,
    partnerCode: 'PART-APEX-001',
    legalBusinessName: 'Doc Search Healthcare Network LLC — Sample Data',
    partnerType: 'CLINIC_NETWORK',
    contactEmail: 'admin@docsearch.docsearch.health',
    contactPhone: '+1 (555) 019-2831',
    status: 'ACTIVE',
    onboardingMetadata: {
      accreditation: 'AAAHC_OUTPATIENT',
      onboardingCompletedAt: '2026-01-15T09:00:00Z'
    },
    contractReference: 'contract://docsearch/partner/apex-2026-v2.pdf',
    subscriptionReference: 'sub_apex_ent_2026',
    metadata: { state: 'CA', facilitiesCount: 3 },
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-02-01T10:30:00.000Z'
  },
  {
    id: '22222222-2222-4222-8222-222222222202',
    tenantId: MOCK_TENANT_ID,
    partnerCode: 'PART-METRO-002',
    legalBusinessName: 'Metro Regional Hospital Group Inc. — Sample Data',
    partnerType: 'HOSPITAL_SYSTEM',
    contactEmail: 'operations@metroregional.docsearch.health',
    contactPhone: '+1 (555) 014-9922',
    status: 'ACTIVE',
    onboardingMetadata: {
      accreditation: 'JOINT_COMMISSION',
      onboardingCompletedAt: '2026-02-01T11:00:00Z'
    },
    contractReference: 'contract://docsearch/partner/metro-2026-hosp.pdf',
    subscriptionReference: 'sub_metro_hosp_2026',
    metadata: { state: 'NY', facilitiesCount: 2 },
    createdAt: '2026-02-01T11:00:00.000Z',
    updatedAt: '2026-02-15T14:20:00.000Z'
  },
  {
    id: '22222222-2222-4222-8222-222222222203',
    tenantId: MOCK_TENANT_ID,
    partnerCode: 'PART-VALLEY-003',
    legalBusinessName: 'Valley Integrated Health Partners — Sample Data',
    partnerType: 'INTEGRATED_HEALTHCARE',
    contactEmail: 'director@valleyhealth.docsearch.health',
    contactPhone: '+1 (555) 018-4411',
    status: 'ONBOARDING',
    onboardingMetadata: {
      accreditation: 'PENDING_SURVEY',
      stage: 'FACILITY_CREDENTIALING'
    },
    contractReference: 'contract://docsearch/partner/valley-stage1.pdf',
    subscriptionReference: 'sub_valley_trial',
    metadata: { state: 'TX', facilitiesCount: 1 },
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z'
  }
];

export const MOCK_OPERATIONAL_ORGANIZATIONS: OperationalOrganizationDto[] = [
  {
    id: '33333333-3333-4333-8333-333333333301',
    tenantId: MOCK_TENANT_ID,
    partnerId: '22222222-2222-4222-8222-222222222201',
    partnerName: 'Doc Search Healthcare Network LLC',
    organizationCode: 'ORG-APEX-CLINIC',
    organizationName: 'Apex Multi-Specialty Clinics — Sample Data',
    organizationType: 'CLINIC',
    legalEntityReference: 'le-corp-delaware-apex',
    contactEmail: 'clinic.ops@docsearch.docsearch.health',
    contactPhone: '+1 (555) 019-2832',
    status: 'ACTIVE',
    facilityCount: 2,
    metadata: { specialization: 'Primary Care & Cardiology' },
    createdAt: '2026-01-16T10:00:00.000Z',
    updatedAt: '2026-01-16T10:00:00.000Z'
  },
  {
    id: '33333333-3333-4333-8333-333333333302',
    tenantId: MOCK_TENANT_ID,
    partnerId: '22222222-2222-4222-8222-222222222201',
    partnerName: 'Doc Search Healthcare Network LLC',
    organizationCode: 'ORG-APEX-SURG',
    organizationName: 'Apex Ambulatory Surgery Pavilion — Sample Data',
    organizationType: 'CLINIC',
    legalEntityReference: 'le-corp-delaware-apex',
    contactEmail: 'surg.center@docsearch.docsearch.health',
    contactPhone: '+1 (555) 019-2835',
    status: 'ACTIVE',
    facilityCount: 1,
    metadata: { specialization: 'Day Surgery & Orthopedics' },
    createdAt: '2026-01-20T14:00:00.000Z',
    updatedAt: '2026-01-20T14:00:00.000Z'
  },
  {
    id: '33333333-3333-4333-8333-333333333303',
    tenantId: MOCK_TENANT_ID,
    partnerId: '22222222-2222-4222-8222-222222222202',
    partnerName: 'Metro Regional Hospital Group Inc.',
    organizationCode: 'ORG-METRO-MAIN',
    organizationName: 'Metro City Central Hospital — Sample Data',
    organizationType: 'HOSPITAL',
    legalEntityReference: 'le-corp-metro-hosp-ny',
    contactEmail: 'chief.admin@metroregional.docsearch.health',
    contactPhone: '+1 (555) 014-9923',
    status: 'ACTIVE',
    facilityCount: 2,
    metadata: { beds: 350, traumaLevel: 'LEVEL_1' },
    createdAt: '2026-02-02T09:00:00.000Z',
    updatedAt: '2026-02-02T09:00:00.000Z'
  },
  {
    id: '33333333-3333-4333-8333-333333333304',
    tenantId: MOCK_TENANT_ID,
    partnerId: '22222222-2222-4222-8222-222222222203',
    partnerName: 'Valley Integrated Health Partners',
    organizationCode: 'ORG-VALLEY-COMM',
    organizationName: 'Valley Community Medical Center — Sample Data',
    organizationType: 'CLINIC',
    legalEntityReference: 'le-corp-valley-tx',
    contactEmail: 'intake@valleyhealth.docsearch.health',
    contactPhone: '+1 (555) 018-4412',
    status: 'ACTIVE',
    facilityCount: 1,
    metadata: { primaryCare: true },
    createdAt: '2026-03-01T08:30:00.000Z',
    updatedAt: '2026-03-01T08:30:00.000Z'
  }
];

export const MOCK_OPERATIONAL_FACILITIES: OperationalFacilityDto[] = [
  {
    id: '44444444-4444-4444-8444-444444444401',
    tenantId: MOCK_TENANT_ID,
    partnerId: '22222222-2222-4222-8222-222222222201',
    organizationId: '33333333-3333-4333-8333-333333333301',
    organizationName: 'Apex Multi-Specialty Clinics',
    facilityCode: 'FAC-APEX-DOWNTOWN',
    facilityName: 'Apex Downtown Care Center — Sample Branch',
    facilityType: 'OUTPATIENT_CLINIC',
    addressStreet: '100 Medical Plaza Way, Suite 400',
    addressCity: 'San Francisco',
    addressState: 'CA',
    addressPostalCode: '94102',
    addressCountry: 'US',
    contactEmail: 'downtown@docsearch.docsearch.health',
    contactPhone: '+1 (555) 019-2841',
    status: 'ACTIVE',
    metadata: { consultationRooms: 12, triageChairs: 3 },
    createdAt: '2026-01-16T11:00:00.000Z',
    updatedAt: '2026-01-16T11:00:00.000Z'
  },
  {
    id: '44444444-4444-4444-8444-444444444402',
    tenantId: MOCK_TENANT_ID,
    partnerId: '22222222-2222-4222-8222-222222222201',
    organizationId: '33333333-3333-4333-8333-333333333301',
    organizationName: 'Apex Multi-Specialty Clinics',
    facilityCode: 'FAC-APEX-WEST',
    facilityName: 'Apex Westside Family Health — Sample Branch',
    facilityType: 'OUTPATIENT_CLINIC',
    addressStreet: '450 Sunset Boulevard',
    addressCity: 'San Francisco',
    addressState: 'CA',
    addressPostalCode: '94116',
    addressCountry: 'US',
    contactEmail: 'westside@docsearch.docsearch.health',
    contactPhone: '+1 (555) 019-2842',
    status: 'ACTIVE',
    metadata: { consultationRooms: 8, triageChairs: 2 },
    createdAt: '2026-01-18T09:30:00.000Z',
    updatedAt: '2026-01-18T09:30:00.000Z'
  },
  {
    id: '44444444-4444-4444-8444-444444444403',
    tenantId: MOCK_TENANT_ID,
    partnerId: '22222222-2222-4222-8222-222222222201',
    organizationId: '33333333-3333-4333-8333-333333333302',
    organizationName: 'Apex Ambulatory Surgery Pavilion',
    facilityCode: 'FAC-APEX-SURG-MAIN',
    facilityName: 'Apex Surgical Suite 1 — Sample Facility',
    facilityType: 'AMBULATORY_SURGERY',
    addressStreet: '820 Health Parkway',
    addressCity: 'Daly City',
    addressState: 'CA',
    addressPostalCode: '94015',
    addressCountry: 'US',
    contactEmail: 'surgical.main@docsearch.docsearch.health',
    contactPhone: '+1 (555) 019-2845',
    status: 'ACTIVE',
    metadata: { operatingTheatres: 4, recoveryBeds: 16 },
    createdAt: '2026-01-21T10:00:00.000Z',
    updatedAt: '2026-01-21T10:00:00.000Z'
  },
  {
    id: '44444444-4444-4444-8444-444444444404',
    tenantId: MOCK_TENANT_ID,
    partnerId: '22222222-2222-4222-8222-222222222202',
    organizationId: '33333333-3333-4333-8333-333333333303',
    organizationName: 'Metro City Central Hospital',
    facilityCode: 'FAC-METRO-MAIN-CAMPUS',
    facilityName: 'Metro Central Main Campus — Sample Hospital',
    facilityType: 'INPATIENT_HOSPITAL',
    addressStreet: '500 Lexington Avenue',
    addressCity: 'New York',
    addressState: 'NY',
    addressPostalCode: '10017',
    addressCountry: 'US',
    contactEmail: 'admissions@metroregional.docsearch.health',
    contactPhone: '+1 (555) 014-9930',
    status: 'ACTIVE',
    metadata: { floors: 14, emergencyBeds: 40 },
    createdAt: '2026-02-02T10:00:00.000Z',
    updatedAt: '2026-02-02T10:00:00.000Z'
  },
  {
    id: '44444444-4444-4444-8444-444444444405',
    tenantId: MOCK_TENANT_ID,
    partnerId: '22222222-2222-4222-8222-222222222202',
    organizationId: '33333333-3333-4333-8333-333333333303',
    organizationName: 'Metro City Central Hospital',
    facilityCode: 'FAC-METRO-DIAG-EAST',
    facilityName: 'Metro East Diagnostic Center — Sample Facility',
    facilityType: 'DIAGNOSTIC_CENTER',
    addressStreet: '120 3rd Avenue',
    addressCity: 'New York',
    addressState: 'NY',
    addressPostalCode: '10003',
    addressCountry: 'US',
    contactEmail: 'diagnostics@metroregional.docsearch.health',
    contactPhone: '+1 (555) 014-9935',
    status: 'ACTIVE',
    metadata: { mriUnits: 2, ctScanners: 2 },
    createdAt: '2026-02-05T12:00:00.000Z',
    updatedAt: '2026-02-05T12:00:00.000Z'
  }
];

export const MOCK_OPERATIONAL_SUBSCRIPTIONS: OperationalSubscriptionDto[] = [
  {
    id: '55555555-5555-4555-8555-555555555501',
    tenantId: MOCK_TENANT_ID,
    partnerId: '22222222-2222-4222-8222-222222222201',
    organizationId: '33333333-3333-4333-8333-333333333301',
    organizationName: 'Apex Multi-Specialty Clinics',
    planReference: 'plan-enterprise-clinic-pro',
    enabledModules: ['OPD', 'EMR', 'RX', 'LAB', 'APPOINTMENTS', 'BILLING'],
    entitlementStatus: 'ACTIVE',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    expiryDate: '2027-01-01T00:00:00.000Z',
    metadata: { maxDoctorSeats: 25, storageGb: 500 },
    createdAt: '2026-01-16T10:00:00.000Z',
    updatedAt: '2026-01-16T10:00:00.000Z'
  },
  {
    id: '55555555-5555-4555-8555-555555555502',
    tenantId: MOCK_TENANT_ID,
    partnerId: '22222222-2222-4222-8222-222222222201',
    organizationId: '33333333-3333-4333-8333-333333333302',
    organizationName: 'Apex Ambulatory Surgery Pavilion',
    planReference: 'plan-ambulatory-surgery-v1',
    enabledModules: ['OPD', 'EMR', 'RX', 'BILLING'],
    entitlementStatus: 'ACTIVE',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    expiryDate: '2027-01-01T00:00:00.000Z',
    metadata: { maxDoctorSeats: 10 },
    createdAt: '2026-01-20T14:00:00.000Z',
    updatedAt: '2026-01-20T14:00:00.000Z'
  },
  {
    id: '55555555-5555-4555-8555-555555555503',
    tenantId: MOCK_TENANT_ID,
    partnerId: '22222222-2222-4222-8222-222222222202',
    organizationId: '33333333-3333-4333-8333-333333333303',
    organizationName: 'Metro City Central Hospital',
    planReference: 'plan-hospital-complete-enterprise',
    enabledModules: ['OPD', 'EMR', 'RX', 'LAB', 'PHARMACY', 'BILLING', 'APPOINTMENTS', 'ANALYTICS'],
    entitlementStatus: 'ACTIVE',
    effectiveDate: '2026-02-01T00:00:00.000Z',
    expiryDate: '2027-02-01T00:00:00.000Z',
    metadata: { maxDoctorSeats: 150, bedTracking: true },
    createdAt: '2026-02-02T09:00:00.000Z',
    updatedAt: '2026-02-02T09:00:00.000Z'
  }
];

export const MOCK_OPERATIONAL_AUDIT_TRACES: OperationalAuditTraceDto[] = [
  {
    id: '66666666-6666-4666-8666-666666666601',
    traceId: 'op-tr-9021',
    tenantId: MOCK_TENANT_ID,
    partnerId: '22222222-2222-4222-8222-222222222201',
    organizationId: '33333333-3333-4333-8333-333333333301',
    branchId: '44444444-4444-4444-8444-444444444401',
    actorId: 'usr-admin-apex',
    actorRole: 'PARTNER_ADMIN',
    action: 'BRANCH_FACILITY_REGISTERED',
    targetEntity: 'operational_facilities',
    targetEntityId: 'FAC-APEX-DOWNTOWN',
    justification: 'Commissioned new outpatient branch facility for Downtown San Francisco clinic',
    operationStatus: 'SUCCESS',
    correlationId: 'corr-op-fac-001',
    metadata: { ipAddress: '10.0.4.12' },
    occurredAt: '2026-01-16T11:00:00.000Z'
  },
  {
    id: '66666666-6666-4666-8666-666666666602',
    traceId: 'op-tr-9022',
    tenantId: MOCK_TENANT_ID,
    partnerId: '22222222-2222-4222-8222-222222222202',
    organizationId: '33333333-3333-4333-8333-333333333303',
    actorId: 'usr-admin-metro',
    actorRole: 'HOSPITAL_ADMIN',
    action: 'ORGANIZATION_ONBOARDED',
    targetEntity: 'operational_organizations',
    targetEntityId: 'ORG-METRO-MAIN',
    justification: 'Completed hospital system entity setup and linked enterprise plan',
    operationStatus: 'SUCCESS',
    correlationId: 'corr-op-org-002',
    metadata: { ipAddress: '10.0.4.55' },
    occurredAt: '2026-02-02T09:00:00.000Z'
  },
  {
    id: '66666666-6666-4666-8666-666666666603',
    traceId: 'op-tr-9023',
    tenantId: MOCK_TENANT_ID,
    partnerId: '22222222-2222-4222-8222-222222222201',
    organizationId: '33333333-3333-4333-8333-333333333301',
    actorId: 'usr-admin-apex',
    actorRole: 'CLINIC_ADMIN',
    action: 'ENTITLEMENT_MODULES_VERIFIED',
    targetEntity: 'operational_subscriptions',
    targetEntityId: 'plan-enterprise-clinic-pro',
    justification: 'Operational module activation for OPD, EMR, e-Rx, and Diagnostic Orders',
    operationStatus: 'SUCCESS',
    correlationId: 'corr-op-sub-001',
    metadata: { ipAddress: '10.0.4.12' },
    occurredAt: '2026-02-10T15:30:00.000Z'
  }
];

export const MOCK_PANEL_CONTEXT: PanelContextDto = {
  activeTenantId: MOCK_TENANT_ID,
  activeTenantName: MOCK_TENANT_NAME,
  activePartnerId: '22222222-2222-4222-8222-222222222201',
  activePartnerName: 'Doc Search Healthcare Network LLC',
  activeOrganizationId: '33333333-3333-4333-8333-333333333301',
  activeOrganizationName: 'Apex Multi-Specialty Clinics',
  activeFacilityId: '44444444-4444-4444-8444-444444444401',
  activeFacilityName: 'Apex Downtown Care Center',
  userRole: 'PARTNER_ADMIN',
  userEmail: 'admin@docsearch.docsearch.health'
};

export const MOCK_PARTNER_FOUNDATION_OVERVIEW: PartnerFoundationOverviewDto = {
  totalPartnersCount: MOCK_OPERATIONAL_PARTNERS.length,
  activePartnersCount: MOCK_OPERATIONAL_PARTNERS.filter((p) => p.status === 'ACTIVE').length,
  totalOrganizationsCount: MOCK_OPERATIONAL_ORGANIZATIONS.length,
  clinicCount: MOCK_OPERATIONAL_ORGANIZATIONS.filter((o) => o.organizationType === 'CLINIC').length,
  hospitalCount: MOCK_OPERATIONAL_ORGANIZATIONS.filter((o) => o.organizationType === 'HOSPITAL').length,
  totalFacilitiesCount: MOCK_OPERATIONAL_FACILITIES.length,
  activeFacilitiesCount: MOCK_OPERATIONAL_FACILITIES.filter((f) => f.status === 'ACTIVE').length,
  operationalSubscriptionsCount: MOCK_OPERATIONAL_SUBSCRIPTIONS.length,
  activeSubscriptionsCount: MOCK_OPERATIONAL_SUBSCRIPTIONS.filter((s) => s.entitlementStatus === 'ACTIVE').length
};
