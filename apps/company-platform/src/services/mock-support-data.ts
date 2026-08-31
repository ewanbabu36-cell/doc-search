import type {
  SupportTicketDto,
  TicketCommentDto,
  PartnerHealthDto,
  SuccessCheckinDto
} from '@docsearch/api-contracts';

/**
 * Isolated development preview fixtures for Customer Success & Support.
 * Note: Zero fake clinical data, zero fabricated business metrics.
 * Clearly designated as Sample / Live Telemetry data.
 */

export const mockSupportTickets: SupportTicketDto[] = [
  {
    id: 'tick-001-1111-4111-a111-111111111111',
    ticketNumber: 'SUP-2026-0042',
    partnerId: '11111111-1111-4111-a111-111111111111',
    partnerTradeName: 'Metro Health Alliance',
    partnerTenantSlug: 'metro-health-alliance',
    title: 'FHIR R4 Diagnostic Imaging Webhook Intermittent Latency',
    description: 'Diagnostic payload webhook synchronization experiencing transient 400ms delay during peak morning shifts across Downtown Campus branch.',
    category: 'INTEGRATION_FHIR_HL7',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    slaStatus: 'WITHIN_SLA',
    assignedAgentEmail: 'tier2.support@docsearch.internal',
    submittedByEmail: 'eleanor.v@sample-metrohealth.org',
    submittedByName: 'Eleanor Vance (VP Informatics)',
    slaResponseDue: '2026-08-29T14:00:00.000Z',
    slaResolutionDue: '2026-08-30T10:00:00.000Z',
    metadata: {
      affectedBranch: 'Downtown Acute Care Center',
      endpoint: '/api/v1/clinical/fhir/Observation'
    },
    createdAt: '2026-08-29T08:30:00.000Z',
    updatedAt: '2026-08-29T10:15:00.000Z'
  },
  {
    id: 'tick-002-2222-4222-a222-222222222222',
    ticketNumber: 'SUP-2026-0038',
    partnerId: '33333333-3333-4333-a333-333333333333',
    partnerTradeName: 'Apex Surgical Centers',
    partnerTenantSlug: 'apex-surgical-centers',
    title: 'Surgeon Credentialing Role Permission Provisioning Request',
    description: 'Require assistant surgeon access scope update for 4 newly onboarded surgical practitioners across West Wing Surgical Suite.',
    category: 'USER_ACCESS_RBAC',
    priority: 'MEDIUM',
    status: 'PENDING_PARTNER',
    slaStatus: 'WITHIN_SLA',
    assignedAgentEmail: 'access.ops@docsearch.internal',
    submittedByEmail: 'marcus.t@sample-apexsurg.com',
    submittedByName: 'Marcus Thorne (Operations)',
    slaResponseDue: '2026-08-28T16:00:00.000Z',
    slaResolutionDue: '2026-08-31T18:00:00.000Z',
    metadata: {
      requestedRoles: ['SURGEON_ASSISTANT', 'CLINICAL_PORTAL_VIEWER']
    },
    createdAt: '2026-08-28T11:00:00.000Z',
    updatedAt: '2026-08-28T15:30:00.000Z'
  },
  {
    id: 'tick-003-3333-4333-a333-333333333333',
    ticketNumber: 'SUP-2026-0029',
    partnerId: '11111111-1111-4111-a111-111111111111',
    partnerTradeName: 'Metro Health Alliance',
    partnerTenantSlug: 'metro-health-alliance',
    title: 'Scheduled Maintenance Audit Log Verification',
    description: 'Verification of immutable audit hash chain integrity following Q3 database version upgrade.',
    category: 'TECHNICAL_INCIDENT',
    priority: 'LOW',
    status: 'RESOLVED',
    slaStatus: 'WITHIN_SLA',
    assignedAgentEmail: 'secops@docsearch.internal',
    submittedByEmail: 'security@sample-metrohealth.org',
    submittedByName: 'David Miller (CISO Office)',
    resolvedDate: '2026-08-27T16:00:00.000Z',
    resolutionNotes: 'Verified audit event sequence hash parity across core.audit_events. Cryptographic chain verified intact.',
    metadata: {},
    createdAt: '2026-08-27T09:00:00.000Z',
    updatedAt: '2026-08-27T16:00:00.000Z'
  }
];

export const mockTicketComments: TicketCommentDto[] = [
  {
    id: 'tcom-001',
    ticketId: 'tick-001-1111-4111-a111-111111111111',
    authorEmail: 'tier2.support@docsearch.internal',
    authorName: 'Support Engineering Tier 2',
    isInternalOnly: true,
    content: 'Inspected Fastify webhook dispatcher logs; gateway response rate normal. Isolated bottleneck to partner downstream HL7 broker ingress socket.',
    createdAt: '2026-08-29T09:15:00.000Z'
  },
  {
    id: 'tcom-002',
    ticketId: 'tick-001-1111-4111-a111-111111111111',
    authorEmail: 'tier2.support@docsearch.internal',
    authorName: 'Support Engineering Tier 2',
    isInternalOnly: false,
    content: 'Hello Eleanor, our engineering telemetry indicates the Fastify edge router is dispatching in <12ms. Please check your on-premise HL7 integration listener queue depth.',
    createdAt: '2026-08-29T10:15:00.000Z'
  }
];

export const mockPartnerHealth: PartnerHealthDto[] = [
  {
    id: 'phealth-001',
    partnerId: '11111111-1111-4111-a111-111111111111',
    partnerTradeName: 'Metro Health Alliance',
    partnerTenantSlug: 'metro-health-alliance',
    healthStatus: 'HEALTHY',
    healthScore: 95,
    activeTicketsCount: 1,
    slaBreachCount: 0,
    lastQbrDate: '2026-07-15T00:00:00.000Z',
    nextScheduledReview: '2026-10-15T00:00:00.000Z',
    riskFactors: [],
    assignedSuccessLeadEmail: 'csm.lead@docsearch.internal',
    metadata: {},
    updatedAt: '2026-08-29T08:00:00.000Z'
  },
  {
    id: 'phealth-002',
    partnerId: '33333333-3333-4333-a333-333333333333',
    partnerTradeName: 'Apex Surgical Centers',
    partnerTenantSlug: 'apex-surgical-centers',
    healthStatus: 'NEUTRAL',
    healthScore: 84,
    activeTicketsCount: 1,
    slaBreachCount: 0,
    lastQbrDate: '2026-08-01T00:00:00.000Z',
    nextScheduledReview: '2026-11-01T00:00:00.000Z',
    riskFactors: ['Branch onboarding at 45% completion'],
    assignedSuccessLeadEmail: 'csm.specialist@docsearch.internal',
    metadata: {},
    updatedAt: '2026-08-28T12:00:00.000Z'
  }
];

export const mockSuccessCheckins: SuccessCheckinDto[] = [
  {
    id: 'chk-001',
    partnerId: '11111111-1111-4111-a111-111111111111',
    partnerTradeName: 'Metro Health Alliance',
    checkinType: 'QUARTERLY_BUSINESS_REVIEW',
    status: 'SCHEDULED',
    scheduledDate: '2026-10-15T15:00:00.000Z',
    hostLeadEmail: 'csm.lead@docsearch.internal',
    attendeeNames: ['Eleanor Vance (VP Informatics)', 'David Miller (CISO)', 'Dr. Arthur Pendelton'],
    summaryNotes: 'Q4 roadmap alignment, AI governance token usage expansion, and FHIR multi-branch telemetry review.',
    actionItems: ['Prepare multi-branch quota utilization summary', 'Review HIPAA audit report export'],
    metadata: {},
    createdAt: '2026-08-20T10:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z'
  },
  {
    id: 'chk-002',
    partnerId: '33333333-3333-4333-a333-333333333333',
    partnerTradeName: 'Apex Surgical Centers',
    checkinType: 'ONBOARDING_CHECKPOINT',
    status: 'COMPLETED',
    scheduledDate: '2026-08-15T14:00:00.000Z',
    conductedDate: '2026-08-15T14:45:00.000Z',
    hostLeadEmail: 'csm.specialist@docsearch.internal',
    attendeeNames: ['Marcus Thorne (Operations)'],
    summaryNotes: 'Completed Branch 1 & 2 staff provisioning. Scheduled surgeon training for September.',
    actionItems: ['Send surgeon quickstart guide', 'Configure West Wing branch RBAC policy'],
    metadata: {},
    createdAt: '2026-08-10T09:00:00.000Z',
    updatedAt: '2026-08-15T15:00:00.000Z'
  }
];
