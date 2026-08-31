import type {
  LeadDto,
  OpportunityDto,
  CampaignDto,
  MarketingActivityDto,
  SalesTaskDto
} from '@docsearch/api-contracts';

/**
 * Isolated development preview fixtures for Sales & Marketing.
 * Note: Never contains fabricated revenue, profit, ARR/MRR, or real payment credentials.
 * Clearly designated as Sample / Live Telemetry data.
 */

export const mockLeads: LeadDto[] = [
  {
    id: 'lead-001-1111-4111-a111-111111111111',
    organizationName: 'St. Jude Regional Hospital System',
    contactName: 'Dr. Arthur Pendelton',
    contactEmail: 'arthur.p@sample-stjuderegional.org',
    contactPhone: '+1 (555) 789-0123',
    contactRoleTitle: 'Chief Information Officer',
    source: 'HEALTHCARE_CONFERENCE',
    status: 'DISCOVERY',
    assignedOwnerEmail: 'enterprise.sales@docsearch.internal',
    notes: 'Inquiring about multi-facility branch data isolation and HIPAA security controls for 8 regional facilities.',
    nextFollowUpDate: '2026-09-05T14:00:00.000Z',
    lastActivityDate: '2026-08-28T11:00:00.000Z',
    metadata: {
      facilityCountEstimate: 8
    },
    createdAt: '2026-08-10T09:00:00.000Z',
    updatedAt: '2026-08-28T11:00:00.000Z'
  },
  {
    id: 'lead-002-2222-4222-a222-222222222222',
    organizationName: 'Beacon Radiology & Imaging Network',
    contactName: 'Clara Oswald',
    contactEmail: 'c.oswald@sample-beaconrad.net',
    contactPhone: '+1 (555) 890-1234',
    contactRoleTitle: 'Director of Healthcare Operations',
    source: 'INBOUND_WEB',
    status: 'QUALIFIED',
    assignedOwnerEmail: 'lead.development@docsearch.internal',
    notes: 'Interested in FHIR R4 interoperability hub and Fastify API gateway webhooks for imaging center data sync.',
    nextFollowUpDate: '2026-09-02T10:30:00.000Z',
    lastActivityDate: '2026-08-25T16:20:00.000Z',
    metadata: {
      facilityCountEstimate: 3
    },
    createdAt: '2026-08-18T14:30:00.000Z',
    updatedAt: '2026-08-25T16:20:00.000Z'
  },
  {
    id: 'lead-003-3333-4333-a333-333333333333',
    organizationName: 'Horizon Community Healthcare',
    contactName: 'Elena Rostova',
    contactEmail: 'elena@sample-horizonhealth.org',
    contactPhone: '+1 (555) 901-2345',
    contactRoleTitle: 'VP Technology & Compliance',
    source: 'PARTNER_REFERRAL',
    status: 'NEW',
    assignedOwnerEmail: 'lead.development@docsearch.internal',
    notes: 'Referred by Apex Surgical Centers; evaluating Doc Search platform for community clinic network.',
    nextFollowUpDate: '2026-09-01T09:00:00.000Z',
    lastActivityDate: '2026-08-29T10:00:00.000Z',
    metadata: {},
    createdAt: '2026-08-29T10:00:00.000Z',
    updatedAt: '2026-08-29T10:00:00.000Z'
  }
];

export const mockOpportunities: OpportunityDto[] = [
  {
    id: 'opp-001-1111-4111-a111-111111111111',
    name: 'St. Jude 8-Facility Enterprise Expansion',
    leadId: 'lead-001-1111-4111-a111-111111111111',
    productId: 'prod-001-1111-4111-a111-111111111111',
    productName: 'Doc Search Enterprise Healthcare Platform',
    targetPlanId: 'plan-001-1111-4111-a111-111111111111',
    targetPlanName: 'Enterprise Hospital Network Tier',
    stage: 'PROPOSAL',
    priority: 'HIGH',
    assignedOwnerEmail: 'enterprise.sales@docsearch.internal',
    expectedCloseDate: '2026-09-30T00:00:00.000Z',
    nextAction: 'Deliver customized multi-branch BAA and enterprise governance proposal',
    metadata: {
      decisionMakers: ['Dr. Arthur Pendelton (CIO)', 'Legal Compliance Board']
    },
    createdAt: '2026-08-15T11:00:00.000Z',
    updatedAt: '2026-08-28T15:00:00.000Z'
  },
  {
    id: 'opp-002-2222-4222-a222-222222222222',
    name: 'Metro Health Alliance AI Platform Upgrade',
    partnerId: '11111111-1111-4111-a111-111111111111',
    partnerTradeName: 'Metro Health Alliance',
    productId: 'prod-002-2222-4222-a222-222222222222',
    productName: 'Doc Search Clinical AI & Governance Suite',
    targetPlanId: 'plan-003-3333-4333-a333-333333333333',
    targetPlanName: 'Clinical AI Enterprise Pack',
    stage: 'NEGOTIATION',
    priority: 'CRITICAL',
    assignedOwnerEmail: 'executive.sales@docsearch.internal',
    expectedCloseDate: '2026-09-15T00:00:00.000Z',
    nextAction: 'Finalize HIPAA AI governance addendum and monthly token quota entitlement',
    metadata: {
      contractAmendment: 'Addon AI Module'
    },
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-27T16:30:00.000Z'
  }
];

export const mockCampaigns: CampaignDto[] = [
  {
    id: 'camp-001',
    name: '2026 Q3 Enterprise Hospital Network Outreach',
    type: 'ENTERPRISE_HOSPITAL_OUTREACH',
    status: 'ACTIVE',
    targetSegment: 'Multi-facility hospital networks and healthcare systems (> 500 beds)',
    startDate: '2026-07-01T00:00:00.000Z',
    endDate: '2026-09-30T00:00:00.000Z',
    ownerEmail: 'marketing.lead@docsearch.internal',
    description: 'Executive briefing outreach highlighting multi-tenant security isolation, Fastify gateways, and BAA compliance.',
    metadata: {},
    createdAt: '2026-06-15T09:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z'
  },
  {
    id: 'camp-002',
    name: 'Diagnostic & Imaging Interoperability Showcase',
    type: 'DIGITAL_HEALTH_SHOWCASE',
    status: 'ACTIVE',
    targetSegment: 'Independent diagnostic imaging labs and pathology clinics',
    startDate: '2026-08-01T00:00:00.000Z',
    endDate: '2026-10-31T00:00:00.000Z',
    ownerEmail: 'growth.marketing@docsearch.internal',
    description: 'Educational webinar series on HL7 FHIR R4 connector modules and secure webhook subscriptions.',
    metadata: {},
    createdAt: '2026-07-20T11:00:00.000Z',
    updatedAt: '2026-08-25T14:00:00.000Z'
  }
];

export const mockMarketingActivities: MarketingActivityDto[] = [
  {
    id: 'mact-001',
    campaignId: 'camp-001',
    campaignName: '2026 Q3 Enterprise Hospital Network Outreach',
    leadId: 'lead-001-1111-4111-a111-111111111111',
    activityType: 'EXECUTIVE_DEMO',
    title: 'Enterprise Architecture & Security Deep Dive',
    description: 'Conducted live architectural overview of tenant branch scoping and RBAC evaluator for St. Jude Informatics team.',
    recordedByEmail: 'enterprise.sales@docsearch.internal',
    activityDate: '2026-08-28T11:00:00.000Z',
    metadata: {},
    createdAt: '2026-08-28T11:00:00.000Z'
  },
  {
    id: 'mact-002',
    partnerId: '11111111-1111-4111-a111-111111111111',
    partnerTradeName: 'Metro Health Alliance',
    activityType: 'PARTNER_DISCOVERY_CALL',
    title: 'AI Governance Add-on Discovery Meeting',
    description: 'Met with Eleanor Vance to review clinical AI safety prompt policies and token quota allocation.',
    recordedByEmail: 'executive.sales@docsearch.internal',
    activityDate: '2026-08-22T14:30:00.000Z',
    metadata: {},
    createdAt: '2026-08-22T14:30:00.000Z'
  }
];

export const mockSalesTasks: SalesTaskDto[] = [
  {
    id: 'task-001',
    title: 'Deliver Custom BAA & Security Whitepaper to St. Jude Regional',
    opportunityId: 'opp-001-1111-4111-a111-111111111111',
    relatedEntityName: 'St. Jude Regional Hospital System',
    assignedUserEmail: 'enterprise.sales@docsearch.internal',
    priority: 'HIGH',
    dueDate: '2026-09-02T17:00:00.000Z',
    status: 'OPEN',
    notes: 'Include architecture diagrams for multi-branch partition and token signature security.',
    metadata: {},
    createdAt: '2026-08-28T15:30:00.000Z',
    updatedAt: '2026-08-28T15:30:00.000Z'
  },
  {
    id: 'task-002',
    title: 'Coordinate Legal Review for Metro Health AI Addendum',
    opportunityId: 'opp-002-2222-4222-a222-222222222222',
    relatedEntityName: 'Metro Health Alliance',
    assignedUserEmail: 'executive.sales@docsearch.internal',
    priority: 'URGENT',
    dueDate: '2026-09-05T12:00:00.000Z',
    status: 'OPEN',
    notes: 'Ensure HIPAA safety policy limits match Enterprise Hospital Network requirements.',
    metadata: {},
    createdAt: '2026-08-27T17:00:00.000Z',
    updatedAt: '2026-08-27T17:00:00.000Z'
  },
  {
    id: 'task-003',
    title: 'Initial Discovery Follow-up with Beacon Radiology',
    leadId: 'lead-002-2222-4222-a222-222222222222',
    relatedEntityName: 'Beacon Radiology & Imaging Network',
    assignedUserEmail: 'lead.development@docsearch.internal',
    priority: 'MEDIUM',
    dueDate: '2026-09-02T10:30:00.000Z',
    status: 'OPEN',
    notes: 'Clarify FHIR R4 connector endpoints and webhook ingestion requirements.',
    metadata: {},
    createdAt: '2026-08-25T16:30:00.000Z',
    updatedAt: '2026-08-25T16:30:00.000Z'
  }
];
