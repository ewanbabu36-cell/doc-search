import type {
  ContentItemDto,
  NotificationTemplateDto,
  DispatchRecordDto
} from '@docsearch/api-contracts';

/**
 * Isolated development preview fixtures for Communication & Content.
 * Note: Zero fake delivery stats, zero fake business metrics.
 * Clearly designated as Sample / Live Telemetry data.
 */

export const mockContentItems: ContentItemDto[] = [
  {
    id: 'cnt-001-1111-4111-a111-111111111111',
    title: 'Platform Maintenance Notice: Database Security Hash Indexing',
    slug: 'maintenance-2026-q3-hash-indexing',
    type: 'OPERATIONAL_BULLETIN',
    status: 'PUBLISHED',
    targetAudience: 'ALL_PARTNERS',
    targetPartnerIds: [],
    summary: 'Scheduled 15-minute maintenance window on Sunday 02:00 UTC for PostgreSQL immutable audit chain compaction.',
    bodyMarkdown: `### Overview
Doc Search Platform Engineering will perform scheduled database index optimizations on the \`core.audit_events\` immutable table.

### Impact
- **Maintenance Horizon:** Sunday, September 6, 2026, 02:00–02:15 UTC.
- **Service Availability:** Read-only mode during migration; zero clinical data loss.
- **Action Required:** None. Automatic failover tested and verified.`,
    versionTag: 'v1.3.4',
    pinned: true,
    publishedAt: '2026-08-28T12:00:00.000Z',
    authorEmail: 'platform.ops@docsearch.internal',
    metadata: {
      maintenanceWindowMinutes: 15
    },
    createdAt: '2026-08-28T10:00:00.000Z',
    updatedAt: '2026-08-28T12:00:00.000Z'
  },
  {
    id: 'cnt-002-2222-4222-a222-222222222222',
    title: 'Release Broadcast: Fastify FHIR R4 Interoperability Gateway v1.4.0',
    slug: 'release-broadcast-v1-4-0-fhir-gateway',
    type: 'RELEASE_BROADCAST',
    status: 'PUBLISHED',
    targetAudience: 'ENTERPRISE_TIER_ONLY',
    targetPartnerIds: [],
    summary: 'Introducing bidirectional HL7 FHIR R4 Observations and DiagnosticReport webhook connectors with strict tenant isolation.',
    bodyMarkdown: `### Release Highlights v1.4.0
We are excited to deliver the Fastify FHIR R4 Interoperability Gateway for Enterprise Healthcare Partners.

### Key Capabilities
- **Bidirectional Ingestion:** Real-time ingestion of FHIR R4 Observation resources.
- **Tenant Isolation:** Automatic validation of tenant and branch scopes before routing.
- **Rate-Limiting:** Configurable burst quotas protected by Fastify rate-limiter middleware.`,
    versionTag: 'v1.4.0',
    pinned: false,
    publishedAt: '2026-08-25T15:30:00.000Z',
    authorEmail: 'product.release@docsearch.internal',
    metadata: {
      targetProduct: 'Doc Search Enterprise Healthcare Platform'
    },
    createdAt: '2026-08-24T14:00:00.000Z',
    updatedAt: '2026-08-25T15:30:00.000Z'
  },
  {
    id: 'cnt-003-3333-4333-a333-333333333333',
    title: 'Executive Announcement: Multi-Branch Hospital Network Governance',
    slug: 'announcement-multi-branch-governance',
    type: 'PLATFORM_ANNOUNCEMENT',
    status: 'SCHEDULED',
    targetAudience: 'ALL_PARTNERS',
    targetPartnerIds: [],
    summary: 'Enhanced organization hierarchy controls enabling centralized health system CISO oversight with isolated facility data silos.',
    bodyMarkdown: `### Centralized Platform Governance
Doc Search introduces advanced multi-branch hierarchy controls designed specifically for multi-facility hospital systems.`,
    versionTag: 'v1.4.1',
    pinned: false,
    scheduledFor: '2026-09-10T14:00:00.000Z',
    authorEmail: 'executive.comms@docsearch.internal',
    metadata: {},
    createdAt: '2026-08-29T09:00:00.000Z',
    updatedAt: '2026-08-29T09:00:00.000Z'
  }
];

export const mockNotificationTemplates: NotificationTemplateDto[] = [
  {
    id: 'tmpl-001',
    code: 'PARTNER_ONBOARDING_INVITATION',
    name: 'Healthcare Partner Onboarding & BAA Sign-off',
    channel: 'EMAIL_NOTIFICATION',
    subjectTemplate: 'Welcome to Doc Search — Complete Enterprise Onboarding for {{partnerName}}',
    bodyTemplate: 'Dear {{primaryContactName}}, your organization {{partnerName}} has been provisioned on Doc Search. Please access your BAA agreement at {{onboardingLink}}.',
    variables: ['partnerName', 'primaryContactName', 'onboardingLink'],
    status: 'ACTIVE',
    createdAt: '2026-06-01T10:00:00.000Z',
    updatedAt: '2026-08-15T10:00:00.000Z'
  },
  {
    id: 'tmpl-002',
    code: 'SECURITY_MAINTENANCE_BANNER',
    name: 'Operational Maintenance In-App Broadcast',
    channel: 'IN_APP_BANNER',
    subjectTemplate: 'Notice: {{maintenanceTitle}} scheduled for {{maintenanceDate}}',
    bodyTemplate: 'Scheduled maintenance will occur on {{maintenanceDate}}. Expected duration: {{durationMinutes}} minutes. Platform read-only mode will be active.',
    variables: ['maintenanceTitle', 'maintenanceDate', 'durationMinutes'],
    status: 'ACTIVE',
    createdAt: '2026-07-10T11:00:00.000Z',
    updatedAt: '2026-08-20T14:00:00.000Z'
  },
  {
    id: 'tmpl-003',
    code: 'SLA_BREACH_WARNING_WEBHOOK',
    name: 'SLA Escalation Alert Webhook',
    channel: 'API_WEBHOOK',
    subjectTemplate: 'Alert: Support Case {{ticketNumber}} SLA Warning',
    bodyTemplate: '{"event": "SLA_WARNING", "ticketNumber": "{{ticketNumber}}", "priority": "{{priority}}", "due": "{{resolutionDue}}"}',
    variables: ['ticketNumber', 'priority', 'resolutionDue'],
    status: 'ACTIVE',
    createdAt: '2026-08-01T09:00:00.000Z',
    updatedAt: '2026-08-01T09:00:00.000Z'
  }
];

export const mockDispatchRecords: DispatchRecordDto[] = [
  {
    id: 'disp-001',
    contentItemId: 'cnt-001-1111-4111-a111-111111111111',
    contentItemTitle: 'Platform Maintenance Notice: Database Security Hash Indexing',
    partnerId: '11111111-1111-4111-a111-111111111111',
    partnerTradeName: 'Metro Health Alliance',
    recipientEmail: 'eleanor.v@sample-metrohealth.org',
    channel: 'IN_APP_BANNER',
    deliveryStatus: 'DELIVERED',
    dispatchedAt: '2026-08-28T12:01:00.000Z',
    deliveredAt: '2026-08-28T12:01:02.000Z',
    metadata: {},
    createdAt: '2026-08-28T12:01:00.000Z'
  },
  {
    id: 'disp-002',
    contentItemId: 'cnt-002-2222-4222-a222-222222222222',
    contentItemTitle: 'Release Broadcast: Fastify FHIR R4 Interoperability Gateway v1.4.0',
    partnerId: '33333333-3333-4333-a333-333333333333',
    partnerTradeName: 'Apex Surgical Centers',
    recipientEmail: 'marcus.t@sample-apexsurg.com',
    channel: 'EMAIL_NOTIFICATION',
    deliveryStatus: 'DELIVERED',
    dispatchedAt: '2026-08-25T15:31:00.000Z',
    deliveredAt: '2026-08-25T15:31:05.000Z',
    metadata: {},
    createdAt: '2026-08-25T15:31:00.000Z'
  }
];
