import type {
  PartnerProfileDto,
  PartnerTransitionHistoryDto
} from '@docsearch/api-contracts';

/**
 * Isolated development preview fixture data for B2B Healthcare Partners.
 * Clearly labeled as Sample / Live Telemetry data.
 * Note: Never contains PHI/PII, doctor credentials, or patient records.
 */
export const mockPartnerProfiles: PartnerProfileDto[] = [
  {
    id: '11111111-1111-4111-a111-111111111111',
    tenantId: '22222222-2222-4222-a222-222222222222',
    tenantSlug: 'metro-health-alliance',
    legalName: 'Metro Health Alliance Group LLC',
    tradeName: 'Metro Health Alliance',
    partnerType: 'HOSPITAL_NETWORK',
    lifecycleStatus: 'ACTIVE',
    verificationStatus: 'VERIFIED',
    onboardingStep: 'COMPLETED',
    onboardingProgressPercent: 100,
    primaryContact: {
      name: 'Eleanor Vance',
      email: 'eleanor.vance@sample-metrohealth.org',
      phone: '+1 (555) 234-5678',
      roleTitle: 'VP of Health Informatics'
    },
    branchCount: 6,
    userCount: 42,
    metadata: {
      licenseRegion: 'US-EAST',
      tier: 'ENTERPRISE_NETWORK'
    },
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-08-20T14:30:00.000Z'
  },
  {
    id: '33333333-3333-4333-a333-333333333333',
    tenantId: '44444444-4444-4444-a444-444444444444',
    tenantSlug: 'apex-surgical-centers',
    legalName: 'Apex Ambulatory Surgery Holdings Inc.',
    tradeName: 'Apex Surgical Centers',
    partnerType: 'SURGICAL_CENTER',
    lifecycleStatus: 'VERIFICATION',
    verificationStatus: 'IN_REVIEW',
    onboardingStep: 'SECURITY_VERIFICATION',
    onboardingProgressPercent: 65,
    primaryContact: {
      name: 'Marcus Thorne',
      email: 'm.thorne@sample-apexsurg.com',
      phone: '+1 (555) 345-6789',
      roleTitle: 'Chief Medical Operations Officer'
    },
    branchCount: 2,
    userCount: 14,
    metadata: {
      licenseRegion: 'US-CENTRAL',
      tier: 'SURGICAL_SPECIALTY'
    },
    createdAt: '2026-06-10T11:20:00.000Z',
    updatedAt: '2026-08-28T16:45:00.000Z'
  },
  {
    id: '55555555-5555-4555-a555-555555555555',
    tenantId: '66666666-6666-4666-a666-666666666666',
    tenantSlug: 'biocore-pathology-labs',
    legalName: 'BioCore Diagnostics & Pathology Corp.',
    tradeName: 'BioCore Pathology',
    partnerType: 'DIAGNOSTIC_LAB',
    lifecycleStatus: 'ONBOARDING',
    verificationStatus: 'PENDING',
    onboardingStep: 'BRANCH_CONFIGURATION',
    onboardingProgressPercent: 35,
    primaryContact: {
      name: 'Dr. Sarah Lin',
      email: 'sarah.lin@sample-biocorelabs.net',
      phone: '+1 (555) 456-7890',
      roleTitle: 'Director of Laboratory Systems'
    },
    branchCount: 4,
    userCount: 8,
    metadata: {
      licenseRegion: 'US-WEST',
      tier: 'DIAGNOSTIC_STANDARD'
    },
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-25T10:15:00.000Z'
  },
  {
    id: '77777777-7777-4777-a777-777777777777',
    tenantId: '88888888-8888-4888-a888-888888888888',
    tenantSlug: 'summit-family-clinics',
    legalName: 'Summit Primary Care Physicians Network LLC',
    tradeName: 'Summit Family Clinics',
    partnerType: 'CLINIC_GROUP',
    lifecycleStatus: 'PROSPECT',
    verificationStatus: 'PENDING',
    onboardingStep: 'ORGANIZATION_PROFILE',
    onboardingProgressPercent: 10,
    primaryContact: {
      name: 'Rachel Sterling',
      email: 'rsterling@sample-summitclinics.org',
      phone: '+1 (555) 567-8901',
      roleTitle: 'Executive Practice Director'
    },
    branchCount: 1,
    userCount: 3,
    metadata: {
      licenseRegion: 'US-SOUTH',
      tier: 'CLINIC_STANDARD'
    },
    createdAt: '2026-08-18T13:40:00.000Z',
    updatedAt: '2026-08-27T09:20:00.000Z'
  }
];

export const mockPartnerTransitionHistory: Record<string, PartnerTransitionHistoryDto[]> = {
  '11111111-1111-4111-a111-111111111111': [
    {
      id: 'h-101',
      partnerId: '11111111-1111-4111-a111-111111111111',
      fromStatus: 'LEAD',
      toStatus: 'PROSPECT',
      actorEmail: 'partner.sales@docsearch.internal',
      reason: 'Completed discovery call and agreed to SaaS evaluation terms',
      timestamp: '2026-01-15T09:30:00.000Z'
    },
    {
      id: 'h-102',
      partnerId: '11111111-1111-4111-a111-111111111111',
      fromStatus: 'PROSPECT',
      toStatus: 'ONBOARDING',
      actorEmail: 'onboarding.lead@docsearch.internal',
      reason: 'Enterprise contract signed; provisioned tenant workspace and branch hierarchy',
      timestamp: '2026-01-20T14:00:00.000Z'
    },
    {
      id: 'h-103',
      partnerId: '11111111-1111-4111-a111-111111111111',
      fromStatus: 'ONBOARDING',
      toStatus: 'VERIFICATION',
      actorEmail: 'compliance.officer@docsearch.internal',
      reason: 'Facility licensing and Business Associate Agreement (BAA) submitted for verification',
      timestamp: '2026-02-01T11:15:00.000Z'
    },
    {
      id: 'h-104',
      partnerId: '11111111-1111-4111-a111-111111111111',
      fromStatus: 'VERIFICATION',
      toStatus: 'ACTIVE',
      actorEmail: 'security.lead@docsearch.internal',
      reason: 'Security checklist validated and multi-branch data isolation verified',
      timestamp: '2026-02-10T16:45:00.000Z'
    }
  ],
  '33333333-3333-4333-a333-333333333333': [
    {
      id: 'h-201',
      partnerId: '33333333-3333-4333-a333-333333333333',
      fromStatus: 'LEAD',
      toStatus: 'PROSPECT',
      actorEmail: 'partner.sales@docsearch.internal',
      reason: 'Qualified ambulatory surgery center network prospect',
      timestamp: '2026-06-10T11:30:00.000Z'
    },
    {
      id: 'h-202',
      partnerId: '33333333-3333-4333-a333-333333333333',
      fromStatus: 'PROSPECT',
      toStatus: 'ONBOARDING',
      actorEmail: 'onboarding.lead@docsearch.internal',
      reason: 'Tenant initialized with surgical centers branch scope',
      timestamp: '2026-07-01T10:00:00.000Z'
    },
    {
      id: 'h-203',
      partnerId: '33333333-3333-4333-a333-333333333333',
      fromStatus: 'ONBOARDING',
      toStatus: 'VERIFICATION',
      actorEmail: 'compliance.officer@docsearch.internal',
      reason: 'BAA executed; awaiting final security officer verification sign-off',
      timestamp: '2026-08-15T15:30:00.000Z'
    }
  ]
};
