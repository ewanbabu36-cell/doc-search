import {
  pgSchema,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  type AnyPgColumn
} from 'drizzle-orm/pg-core';
import { tenants } from '../core/tenants.js';
import { users } from '../core/users.js';

export const companySchema = pgSchema('company');

export const partnerAgreements = companySchema.table('partner_agreements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull().default('DRAFT'),
  termsVersion: varchar('terms_version', { length: 20 }).notNull(),
  config: jsonb('config').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

/**
 * Phase 1: CRM & Partner Profiles
 */
export const partnerProfiles = companySchema.table(
  'partner_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerType: varchar('partner_type', { length: 50 }).notNull().default('HOSPITAL_NETWORK'),
    lifecycleStatus: varchar('lifecycle_status', { length: 50 }).notNull().default('LEAD'),
    verificationStatus: varchar('verification_status', { length: 50 }).notNull().default('PENDING'),
    onboardingStep: varchar('onboarding_step', { length: 50 }).notNull().default('ORGANIZATION_PROFILE'),
    onboardingProgressPercent: integer('onboarding_progress_percent').notNull().default(0),
    legalName: varchar('legal_name', { length: 255 }).notNull(),
    tradeName: varchar('trade_name', { length: 255 }).notNull(),
    primaryContactName: varchar('primary_contact_name', { length: 100 }).notNull(),
    primaryContactEmail: varchar('primary_contact_email', { length: 255 }).notNull(),
    primaryContactPhone: varchar('primary_contact_phone', { length: 50 }),
    primaryContactRole: varchar('primary_contact_role', { length: 100 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_partner_profiles_tenant_id').on(table.tenantId),
    index('idx_partner_profiles_status').on(table.lifecycleStatus),
    index('idx_partner_profiles_type').on(table.partnerType),
    index('idx_partner_profiles_verification').on(table.verificationStatus)
  ]
);

/**
 * Phase 1: Partner Lifecycle State Transition Audit
 */
export const partnerLifecycleTransitions = companySchema.table(
  'partner_lifecycle_transitions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => partnerProfiles.id, { onDelete: 'cascade' }),
    fromStatus: varchar('from_status', { length: 50 }).notNull(),
    toStatus: varchar('to_status', { length: 50 }).notNull(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    actorEmail: varchar('actor_email', { length: 255 }).notNull(),
    reason: text('reason').notNull(),
    metadata: jsonb('metadata').default({}),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_partner_transitions_partner_id').on(table.partnerId),
    index('idx_partner_transitions_time').on(table.timestamp)
  ]
);

/**
 * Phase 1: Product Catalog
 */
export const products = companySchema.table(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    category: varchar('category', { length: 50 }).notNull().default('CORE_PLATFORM'),
    status: varchar('status', { length: 50 }).notNull().default('DRAFT'),
    version: varchar('version', { length: 20 }).notNull().default('1.0.0'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_products_code').on(table.code),
    index('idx_products_status').on(table.status),
    index('idx_products_category').on(table.category)
  ]
);

/**
 * Phase 1: Plans (belonging to a Product)
 */
export const plans = companySchema.table(
  'plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('DRAFT'),
    version: varchar('version', { length: 20 }).notNull().default('1.0.0'),
    effectiveDate: timestamp('effective_date', { withTimezone: true }),
    expirationDate: timestamp('expiration_date', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_plans_product_code_version').on(table.productId, table.code, table.version),
    index('idx_plans_product_id').on(table.productId),
    index('idx_plans_status').on(table.status)
  ]
);

/**
 * Phase 1: Features Registry
 */
export const features = companySchema.table(
  'features',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    category: varchar('category', { length: 50 }).notNull().default('MODULE_ACCESS'),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_features_code').on(table.code),
    index('idx_features_category').on(table.category),
    index('idx_features_status').on(table.status)
  ]
);

/**
 * Phase 1: Plan-Entitlement Mapping
 */
export const planEntitlements = companySchema.table(
  'plan_entitlements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id, { onDelete: 'cascade' }),
    featureId: uuid('feature_id')
      .notNull()
      .references(() => features.id, { onDelete: 'cascade' }),
    entitlementType: varchar('entitlement_type', { length: 50 }).notNull().default('FEATURE_ACCESS'),
    value: jsonb('value').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_plan_entitlements_plan_feature').on(table.planId, table.featureId),
    index('idx_plan_entitlements_plan_id').on(table.planId),
    index('idx_plan_entitlements_feature_id').on(table.featureId)
  ]
);

/**
 * Phase 1: Partner-Plan Assignments
 */
export const partnerPlanAssignments = companySchema.table(
  'partner_plan_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => partnerProfiles.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id, { onDelete: 'cascade' }),
    assignmentStatus: varchar('assignment_status', { length: 50 }).notNull().default('ACTIVE'),
    effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull().defaultNow(),
    expirationDate: timestamp('expiration_date', { withTimezone: true }),
    assignedById: uuid('assigned_by_id').references(() => users.id, { onDelete: 'set null' }),
    assignedByEmail: varchar('assigned_by_email', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_partner_plan_assignments_partner_product').on(table.partnerId, table.productId),
    index('idx_partner_plan_partner_id').on(table.partnerId),
    index('idx_partner_plan_plan_id').on(table.planId),
    index('idx_partner_plan_status').on(table.assignmentStatus)
  ]
);

/**
 * Phase 1: Commercial Subscriptions
 */
export const subscriptions = companySchema.table(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => partnerProfiles.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id, { onDelete: 'cascade' }),
    planVersion: varchar('plan_version', { length: 20 }).notNull().default('1.0.0'),
    status: varchar('status', { length: 50 }).notNull().default('PENDING'),
    billingCycle: varchar('billing_cycle', { length: 50 }).notNull().default('MONTHLY'),
    startDate: timestamp('start_date', { withTimezone: true }).notNull().defaultNow(),
    renewalDate: timestamp('renewal_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    cancellationDate: timestamp('cancellation_date', { withTimezone: true }),
    cancellationReason: text('cancellation_reason'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_subscriptions_partner_id').on(table.partnerId),
    index('idx_subscriptions_product_id').on(table.productId),
    index('idx_subscriptions_status').on(table.status)
  ]
);

/**
 * Phase 1: Partner Billing Accounts
 */
export const billingAccounts = companySchema.table(
  'billing_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => partnerProfiles.id, { onDelete: 'cascade' }),
    billingContactName: varchar('billing_contact_name', { length: 100 }).notNull(),
    billingEmail: varchar('billing_email', { length: 255 }).notNull(),
    taxIdReference: varchar('tax_id_reference', { length: 100 }),
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    billingCycle: varchar('billing_cycle', { length: 50 }).notNull().default('MONTHLY'),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_billing_accounts_partner_id').on(table.partnerId),
    index('idx_billing_accounts_status').on(table.status)
  ]
);

/**
 * Phase 1: Invoices
 */
export const invoices = companySchema.table(
  'invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    billingAccountId: uuid('billing_account_id')
      .notNull()
      .references(() => billingAccounts.id, { onDelete: 'cascade' }),
    subscriptionId: uuid('subscription_id').references(() => subscriptions.id, { onDelete: 'set null' }),
    invoiceNumber: varchar('invoice_number', { length: 100 }).notNull(),
    issueDate: timestamp('issue_date', { withTimezone: true }).notNull().defaultNow(),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    subtotal: varchar('subtotal', { length: 50 }).notNull().default('0.00'),
    taxAmount: varchar('tax_amount', { length: 50 }).notNull().default('0.00'),
    totalAmount: varchar('total_amount', { length: 50 }).notNull().default('0.00'),
    status: varchar('status', { length: 50 }).notNull().default('DRAFT'),
    notes: text('notes'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_invoices_number').on(table.invoiceNumber),
    index('idx_invoices_billing_account').on(table.billingAccountId),
    index('idx_invoices_subscription').on(table.subscriptionId),
    index('idx_invoices_status').on(table.status)
  ]
);

/**
 * Phase 1: Payment Records
 */
export const payments = companySchema.table(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    amount: varchar('amount', { length: 50 }).notNull(),
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    paymentStatus: varchar('payment_status', { length: 50 }).notNull().default('PENDING'),
    provider: varchar('provider', { length: 100 }).notNull().default('MANUAL_WIRE'),
    providerReference: varchar('provider_reference', { length: 255 }),
    paymentDate: timestamp('payment_date', { withTimezone: true }),
    failureReasonCode: varchar('failure_reason_code', { length: 100 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_payments_invoice_id').on(table.invoiceId),
    index('idx_payments_status').on(table.paymentStatus)
  ]
);

/**
 * Phase 1: Sales Leads
 */
export const salesLeads = companySchema.table(
  'sales_leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationName: varchar('organization_name', { length: 255 }).notNull(),
    contactName: varchar('contact_name', { length: 100 }).notNull(),
    contactEmail: varchar('contact_email', { length: 255 }).notNull(),
    contactPhone: varchar('contact_phone', { length: 50 }),
    contactRoleTitle: varchar('contact_role_title', { length: 100 }),
    source: varchar('source', { length: 50 }).notNull().default('INBOUND_WEB'),
    status: varchar('status', { length: 50 }).notNull().default('NEW'),
    assignedOwnerId: uuid('assigned_owner_id').references(() => users.id, { onDelete: 'set null' }),
    assignedOwnerEmail: varchar('assigned_owner_email', { length: 255 }).notNull(),
    notes: text('notes'),
    nextFollowUpDate: timestamp('next_follow_up_date', { withTimezone: true }),
    lastActivityDate: timestamp('last_activity_date', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_sales_leads_status').on(table.status),
    index('idx_sales_leads_owner').on(table.assignedOwnerEmail),
    index('idx_sales_leads_source').on(table.source)
  ]
);

/**
 * Phase 1: Sales Opportunities
 */
export const salesOpportunities = companySchema.table(
  'sales_opportunities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    partnerId: uuid('partner_id').references(() => partnerProfiles.id, { onDelete: 'set null' }),
    leadId: uuid('lead_id').references(() => salesLeads.id, { onDelete: 'set null' }),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
    targetPlanId: uuid('target_plan_id').references(() => plans.id, { onDelete: 'set null' }),
    stage: varchar('stage', { length: 50 }).notNull().default('QUALIFICATION'),
    priority: varchar('priority', { length: 50 }).notNull().default('MEDIUM'),
    assignedOwnerId: uuid('assigned_owner_id').references(() => users.id, { onDelete: 'set null' }),
    assignedOwnerEmail: varchar('assigned_owner_email', { length: 255 }).notNull(),
    expectedCloseDate: timestamp('expected_close_date', { withTimezone: true }),
    nextAction: text('next_action'),
    lostReason: text('lost_reason'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_sales_opp_partner_id').on(table.partnerId),
    index('idx_sales_opp_stage').on(table.stage),
    index('idx_sales_opp_owner').on(table.assignedOwnerEmail)
  ]
);

/**
 * Phase 1: Marketing Campaigns
 */
export const marketingCampaigns = companySchema.table(
  'marketing_campaigns',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 50 }).notNull().default('ENTERPRISE_HOSPITAL_OUTREACH'),
    status: varchar('status', { length: 50 }).notNull().default('DRAFT'),
    targetSegment: varchar('target_segment', { length: 255 }).notNull(),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    description: text('description').notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_campaigns_status').on(table.status),
    index('idx_campaigns_type').on(table.type)
  ]
);

/**
 * Phase 1: Marketing Activities
 */
export const marketingActivities = companySchema.table(
  'marketing_activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id').references(() => marketingCampaigns.id, { onDelete: 'set null' }),
    partnerId: uuid('partner_id').references(() => partnerProfiles.id, { onDelete: 'set null' }),
    leadId: uuid('lead_id').references(() => salesLeads.id, { onDelete: 'set null' }),
    activityType: varchar('activity_type', { length: 50 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    recordedByEmail: varchar('recorded_by_email', { length: 255 }).notNull(),
    activityDate: timestamp('activity_date', { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_marketing_act_campaign').on(table.campaignId),
    index('idx_marketing_act_partner').on(table.partnerId),
    index('idx_marketing_act_lead').on(table.leadId),
    index('idx_marketing_act_date').on(table.activityDate)
  ]
);

/**
 * Phase 1: Sales Tasks & Follow-ups
 */
export const salesTasks = companySchema.table(
  'sales_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    leadId: uuid('lead_id').references(() => salesLeads.id, { onDelete: 'set null' }),
    opportunityId: uuid('opportunity_id').references(() => salesOpportunities.id, { onDelete: 'set null' }),
    partnerId: uuid('partner_id').references(() => partnerProfiles.id, { onDelete: 'set null' }),
    assignedUserId: uuid('assigned_user_id').references(() => users.id, { onDelete: 'set null' }),
    assignedUserEmail: varchar('assigned_user_email', { length: 255 }).notNull(),
    priority: varchar('priority', { length: 50 }).notNull().default('MEDIUM'),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('OPEN'),
    completionDate: timestamp('completion_date', { withTimezone: true }),
    notes: text('notes'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_sales_tasks_assigned').on(table.assignedUserEmail),
    index('idx_sales_tasks_status').on(table.status),
    index('idx_sales_tasks_due').on(table.dueDate)
  ]
);

/**
 * Phase 1: Support Tickets
 */
export const supportTickets = companySchema.table(
  'support_tickets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ticketNumber: varchar('ticket_number', { length: 50 }).notNull(),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => partnerProfiles.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    category: varchar('category', { length: 50 }).notNull().default('TECHNICAL_INCIDENT'),
    priority: varchar('priority', { length: 50 }).notNull().default('MEDIUM'),
    status: varchar('status', { length: 50 }).notNull().default('OPEN'),
    slaStatus: varchar('sla_status', { length: 50 }).notNull().default('WITHIN_SLA'),
    assignedAgentId: uuid('assigned_agent_id').references(() => users.id, { onDelete: 'set null' }),
    assignedAgentEmail: varchar('assigned_agent_email', { length: 255 }).notNull(),
    submittedByEmail: varchar('submitted_by_email', { length: 255 }).notNull(),
    submittedByName: varchar('submitted_by_name', { length: 100 }).notNull(),
    slaResponseDue: timestamp('sla_response_due', { withTimezone: true }),
    slaResolutionDue: timestamp('sla_resolution_due', { withTimezone: true }),
    resolvedDate: timestamp('resolved_date', { withTimezone: true }),
    resolutionNotes: text('resolution_notes'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_support_ticket_number').on(table.ticketNumber),
    index('idx_support_tickets_partner').on(table.partnerId),
    index('idx_support_tickets_status').on(table.status),
    index('idx_support_tickets_priority').on(table.priority),
    index('idx_support_tickets_sla_status').on(table.slaStatus),
    index('idx_support_tickets_agent').on(table.assignedAgentEmail)
  ]
);

/**
 * Phase 1: Support Ticket Comments
 */
export const supportTicketComments = companySchema.table(
  'support_ticket_comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => supportTickets.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
    authorEmail: varchar('author_email', { length: 255 }).notNull(),
    authorName: varchar('author_name', { length: 100 }).notNull(),
    isInternalOnly: boolean('is_internal_only').notNull().default(false),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ticket_comments_ticket_id').on(table.ticketId),
    index('idx_ticket_comments_created_at').on(table.createdAt)
  ]
);

/**
 * Phase 1: Partner Health Profiles
 */
export const partnerHealthProfiles = companySchema.table(
  'partner_health_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => partnerProfiles.id, { onDelete: 'cascade' }),
    healthStatus: varchar('health_status', { length: 50 }).notNull().default('HEALTHY'),
    healthScore: integer('health_score').notNull().default(100),
    activeTicketsCount: integer('active_tickets_count').notNull().default(0),
    slaBreachCount: integer('sla_breach_count').notNull().default(0),
    lastQbrDate: timestamp('last_qbr_date', { withTimezone: true }),
    nextScheduledReview: timestamp('next_scheduled_review', { withTimezone: true }),
    riskFactors: jsonb('risk_factors').default([]),
    assignedSuccessLeadId: uuid('assigned_success_lead_id').references(() => users.id, { onDelete: 'set null' }),
    assignedSuccessLeadEmail: varchar('assigned_success_lead_email', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({}),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_partner_health_partner_id').on(table.partnerId),
    index('idx_partner_health_status').on(table.healthStatus)
  ]
);

/**
 * Phase 1: Success Check-ins & QBRs
 */
export const successCheckins = companySchema.table(
  'success_checkins',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => partnerProfiles.id, { onDelete: 'cascade' }),
    checkinType: varchar('checkin_type', { length: 50 }).notNull().default('QUARTERLY_BUSINESS_REVIEW'),
    status: varchar('status', { length: 50 }).notNull().default('SCHEDULED'),
    scheduledDate: timestamp('scheduled_date', { withTimezone: true }).notNull(),
    conductedDate: timestamp('conducted_date', { withTimezone: true }),
    hostLeadId: uuid('host_lead_id').references(() => users.id, { onDelete: 'set null' }),
    hostLeadEmail: varchar('host_lead_email', { length: 255 }).notNull(),
    attendeeNames: jsonb('attendee_names').default([]),
    summaryNotes: text('summary_notes'),
    actionItems: jsonb('action_items').default([]),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_success_checkins_partner').on(table.partnerId),
    index('idx_success_checkins_status').on(table.status),
    index('idx_success_checkins_date').on(table.scheduledDate)
  ]
);

/**
 * Phase 1: Communication Content Items (Announcements, Release Broadcasts, Bulletins)
 */
export const contentItems = companySchema.table(
  'content_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    type: varchar('type', { length: 50 }).notNull().default('PLATFORM_ANNOUNCEMENT'),
    status: varchar('status', { length: 50 }).notNull().default('DRAFT'),
    targetAudience: varchar('target_audience', { length: 50 }).notNull().default('ALL_PARTNERS'),
    targetPartnerIds: jsonb('target_partner_ids').default([]),
    summary: text('summary').notNull(),
    bodyMarkdown: text('body_markdown').notNull(),
    versionTag: varchar('version_tag', { length: 50 }),
    pinned: boolean('pinned').notNull().default(false),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
    authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
    authorEmail: varchar('author_email', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_content_items_slug').on(table.slug),
    index('idx_content_items_status').on(table.status),
    index('idx_content_items_type').on(table.type),
    index('idx_content_items_audience').on(table.targetAudience),
    index('idx_content_items_published').on(table.publishedAt)
  ]
);

/**
 * Phase 1: Notification Templates
 */
export const notificationTemplates = companySchema.table(
  'notification_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    channel: varchar('channel', { length: 50 }).notNull().default('EMAIL_NOTIFICATION'),
    subjectTemplate: varchar('subject_template', { length: 255 }).notNull(),
    bodyTemplate: text('body_template').notNull(),
    variables: jsonb('variables').default([]),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_notification_templates_code').on(table.code),
    index('idx_notification_templates_channel').on(table.channel),
    index('idx_notification_templates_status').on(table.status)
  ]
);

/**
 * Phase 1: Notification Dispatch & Delivery Tracking Records
 */
export const notificationDispatchRecords = companySchema.table(
  'notification_dispatch_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contentItemId: uuid('content_item_id')
      .notNull()
      .references(() => contentItems.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').references(() => partnerProfiles.id, { onDelete: 'set null' }),
    recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),
    channel: varchar('channel', { length: 50 }).notNull().default('IN_APP_BANNER'),
    deliveryStatus: varchar('delivery_status', { length: 50 }).notNull().default('PENDING'),
    dispatchedAt: timestamp('dispatched_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    failureReason: text('failure_reason'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_dispatch_records_item').on(table.contentItemId),
    index('idx_dispatch_records_status').on(table.deliveryStatus),
    index('idx_dispatch_records_partner').on(table.partnerId)
  ]
);

/**
 * Phase 1: Analytics & BI Saved Reports
 */
export const analyticsReports = companySchema.table(
  'analytics_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reportName: varchar('report_name', { length: 255 }).notNull(),
    code: varchar('code', { length: 100 }).notNull(),
    category: varchar('category', { length: 50 }).notNull().default('PLATFORM_USAGE'),
    description: text('description').notNull(),
    scheduleFrequency: varchar('schedule_frequency', { length: 50 }).notNull().default('WEEKLY'),
    lastGeneratedAt: timestamp('last_generated_at', { withTimezone: true }),
    outputFormat: varchar('output_format', { length: 50 }).notNull().default('JSON'),
    createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
    createdByEmail: varchar('created_by_email', { length: 255 }).notNull(),
    isArchived: boolean('is_archived').notNull().default(false),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_analytics_reports_code').on(table.code),
    index('idx_analytics_reports_category').on(table.category)
  ]
);

/**
 * Phase 1: Cross-Tenant Aggregated Analytics Snapshots
 */
export const analyticsSnapshots = companySchema.table(
  'analytics_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    metricCategory: varchar('metric_category', { length: 50 }).notNull(),
    dimension: varchar('dimension', { length: 100 }).notNull(),
    anonymizedCohort: varchar('anonymized_cohort', { length: 100 }).notNull(),
    sampleCount: integer('sample_count').notNull().default(0),
    aggregatedValue: varchar('aggregated_value', { length: 100 }).notNull(),
    unit: varchar('unit', { length: 50 }).notNull(),
    telemetryStatus: varchar('telemetry_status', { length: 50 }).notNull().default('PENDING_TELEMETRY_PIPELINE'),
    recordedDate: timestamp('recorded_date', { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_analytics_snapshots_cat').on(table.metricCategory),
    index('idx_analytics_snapshots_date').on(table.recordedDate)
  ]
);

/**
 * Phase 1: System Intelligence & Insight Center
 */
export const systemInsights = companySchema.table(
  'system_insights',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    severity: varchar('severity', { length: 50 }).notNull().default('INFO'),
    description: text('description').notNull(),
    recommendedAction: text('recommended_action').notNull(),
    sourceDomain: varchar('source_domain', { length: 100 }).notNull(),
    isAcknowledged: boolean('is_acknowledged').notNull().default(false),
    detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_system_insights_severity').on(table.severity),
    index('idx_system_insights_ack').on(table.isAcknowledged),
    index('idx_system_insights_date').on(table.detectedAt)
  ]
);

/**
 * Phase 1: AI Models Registry
 */
export const aiModels = companySchema.table(
  'ai_models',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: varchar('provider', { length: 100 }).notNull(),
    modelCode: varchar('model_code', { length: 100 }).notNull(),
    modelName: varchar('model_name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    modelFamily: varchar('model_family', { length: 100 }).notNull(),
    lifecycleStatus: varchar('lifecycle_status', { length: 50 }).notNull().default('DRAFT'),
    deploymentStatus: varchar('deployment_status', { length: 50 }).notNull().default('NOT_DEPLOYED'),
    capabilityClassification: varchar('capability_classification', { length: 50 }).notNull().default('SUMMARIZATION'),
    riskClassification: varchar('risk_classification', { length: 50 }).notNull().default('LOW_ADMINISTRATIVE'),
    contextWindow: integer('context_window').notNull().default(8192),
    supportedModalities: jsonb('supported_modalities').default(['TEXT']),
    approvedForProduction: boolean('approved_for_production').notNull().default(false),
    approvedForClinicalContext: boolean('approved_for_clinical_context').notNull().default(false),
    version: varchar('version', { length: 20 }).notNull().default('1.0.0'),
    releaseDate: timestamp('release_date', { withTimezone: true }),
    deprecationDate: timestamp('deprecation_date', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_ai_models_code').on(table.modelCode),
    index('idx_ai_models_lifecycle').on(table.lifecycleStatus),
    index('idx_ai_models_deployment').on(table.deploymentStatus),
    index('idx_ai_models_risk').on(table.riskClassification)
  ]
);

/**
 * Phase 1: AI Governance Policies
 */
export const aiGovernancePolicies = companySchema.table(
  'ai_governance_policies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    policyCode: varchar('policy_code', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    policyType: varchar('policy_type', { length: 50 }).notNull().default('CLINICAL_SAFETY_BOUNDARY'),
    riskLevel: varchar('risk_level', { length: 50 }).notNull().default('MODERATE_OPERATIONAL'),
    status: varchar('status', { length: 50 }).notNull().default('DRAFT'),
    rules: jsonb('rules').default([]),
    prohibitedUseCases: jsonb('prohibited_use_cases').default([]),
    allowedUseCases: jsonb('allowed_use_cases').default([]),
    humanOversightRequired: boolean('human_oversight_required').notNull().default(true),
    clinicalSafetyBoundary: text('clinical_safety_boundary').notNull(),
    approvalRequired: boolean('approval_required').notNull().default(true),
    approvedById: uuid('approved_by_id').references(() => users.id, { onDelete: 'set null' }),
    approvedByEmail: varchar('approved_by_email', { length: 255 }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    version: varchar('version', { length: 20 }).notNull().default('1.0.0'),
    effectiveDate: timestamp('effective_date', { withTimezone: true }),
    expirationDate: timestamp('expiration_date', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_ai_gov_policies_code').on(table.policyCode),
    index('idx_ai_gov_policies_status').on(table.status),
    index('idx_ai_gov_policies_type').on(table.policyType),
    index('idx_ai_gov_policies_risk').on(table.riskLevel)
  ]
);

/**
 * Phase 1: AI Prompt Templates
 */
export const aiPromptTemplates = companySchema.table(
  'ai_prompt_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    promptType: varchar('prompt_type', { length: 50 }).notNull().default('TASK'),
    status: varchar('status', { length: 50 }).notNull().default('DRAFT'),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    currentVersion: varchar('version', { length: 20 }).notNull().default('1.0.0'),
    variables: jsonb('variables').default([]),
    governancePolicyId: uuid('governance_policy_id').references(() => aiGovernancePolicies.id, { onDelete: 'set null' }),
    approvalStatus: varchar('approval_status', { length: 50 }).notNull().default('DRAFT'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_ai_prompt_templates_code').on(table.code),
    index('idx_ai_prompt_type').on(table.promptType),
    index('idx_ai_prompt_approval').on(table.approvalStatus),
    index('idx_ai_prompt_policy').on(table.governancePolicyId)
  ]
);

/**
 * Phase 1: AI Prompt Versions
 */
export const aiPromptVersions = companySchema.table(
  'ai_prompt_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    promptTemplateId: uuid('prompt_template_id')
      .notNull()
      .references(() => aiPromptTemplates.id, { onDelete: 'cascade' }),
    version: varchar('version', { length: 20 }).notNull(),
    promptContent: text('prompt_content').notNull(),
    changeSummary: text('change_summary').notNull(),
    createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
    createdByEmail: varchar('created_by_email', { length: 255 }).notNull(),
    approvalStatus: varchar('approval_status', { length: 50 }).notNull().default('DRAFT'),
    approvedById: uuid('approved_by_id').references(() => users.id, { onDelete: 'set null' }),
    approvedByEmail: varchar('approved_by_email', { length: 255 }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    effectiveAt: timestamp('effective_at', { withTimezone: true }),
    retiredAt: timestamp('retired_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_ai_prompt_versions_template_ver').on(table.promptTemplateId, table.version),
    index('idx_ai_prompt_versions_template').on(table.promptTemplateId),
    index('idx_ai_prompt_versions_status').on(table.approvalStatus)
  ]
);

/**
 * Phase 1: AI Usage Quotas
 */
export const aiUsageQuotas = companySchema.table(
  'ai_usage_quotas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scopeType: varchar('scope_type', { length: 50 }).notNull().default('PLATFORM'),
    scopeReference: varchar('scope_reference', { length: 100 }).notNull(),
    modelId: uuid('model_id').references(() => aiModels.id, { onDelete: 'set null' }),
    quotaType: varchar('quota_type', { length: 50 }).notNull().default('TOKENS'),
    limitValue: integer('limit_value').notNull(),
    warningThreshold: integer('warning_threshold').notNull(),
    period: varchar('period', { length: 50 }).notNull().default('MONTHLY'),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull().defaultNow(),
    expirationDate: timestamp('expiration_date', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ai_quotas_scope').on(table.scopeType, table.scopeReference),
    index('idx_ai_quotas_model').on(table.modelId),
    index('idx_ai_quotas_status').on(table.status)
  ]
);

/**
 * Phase 1: AI Usage Records
 */
export const aiUsageRecords = companySchema.table(
  'ai_usage_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    modelId: uuid('model_id')
      .notNull()
      .references(() => aiModels.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').references(() => partnerProfiles.id, { onDelete: 'set null' }),
    tenantScope: varchar('tenant_scope', { length: 100 }),
    environment: varchar('environment', { length: 50 }).notNull().default('PRODUCTION'),
    requestCount: integer('request_count').notNull().default(0),
    inputTokens: integer('input_tokens').notNull().default(0),
    outputTokens: integer('output_tokens').notNull().default(0),
    totalTokens: integer('total_tokens').notNull().default(0),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
    sourceStatus: varchar('source_status', { length: 50 }).notNull().default('PENDING_TELEMETRY_PIPELINE'),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_ai_usage_model').on(table.modelId),
    index('idx_ai_usage_partner').on(table.partnerId),
    index('idx_ai_usage_date').on(table.recordedAt)
  ]
);

/**
 * Phase 1: AI Audit Traces
 */
export const aiAuditTraces = companySchema.table(
  'ai_audit_traces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    traceId: varchar('trace_id', { length: 100 }).notNull(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    actorEmail: varchar('actor_email', { length: 255 }),
    partnerId: uuid('partner_id').references(() => partnerProfiles.id, { onDelete: 'set null' }),
    modelId: uuid('model_id')
      .notNull()
      .references(() => aiModels.id, { onDelete: 'cascade' }),
    modelVersion: varchar('model_version', { length: 20 }).notNull(),
    promptTemplateId: uuid('prompt_template_id').references(() => aiPromptTemplates.id, { onDelete: 'set null' }),
    promptVersion: varchar('prompt_version', { length: 20 }),
    governancePolicyId: uuid('governance_policy_id').references(() => aiGovernancePolicies.id, { onDelete: 'set null' }),
    safetyClassification: varchar('safety_classification', { length: 50 }).notNull(),
    requestStatus: varchar('request_status', { length: 50 }).notNull(),
    outcomeStatus: varchar('outcome_status', { length: 50 }).notNull(),
    humanReviewRequired: boolean('human_review_required').notNull().default(false),
    humanReviewStatus: varchar('human_review_status', { length: 50 }).notNull().default('NOT_REQUIRED'),
    environment: varchar('environment', { length: 50 }).notNull().default('PRODUCTION'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    uniqueIndex('uq_ai_audit_traces_trace_id').on(table.traceId),
    index('idx_ai_audit_traces_model').on(table.modelId),
    index('idx_ai_audit_traces_safety').on(table.safetyClassification),
    index('idx_ai_audit_traces_status').on(table.requestStatus),
    index('idx_ai_audit_traces_time').on(table.occurredAt)
  ]
);

/**
 * Phase 1: AI Safety Events
 */
export const aiSafetyEvents = companySchema.table(
  'ai_safety_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventCode: varchar('event_code', { length: 100 }).notNull(),
    severity: varchar('severity', { length: 50 }).notNull().default('INFO'),
    category: varchar('category', { length: 100 }).notNull(),
    modelId: uuid('model_id').references(() => aiModels.id, { onDelete: 'set null' }),
    promptTemplateId: uuid('prompt_template_id').references(() => aiPromptTemplates.id, { onDelete: 'set null' }),
    governancePolicyId: uuid('governance_policy_id').references(() => aiGovernancePolicies.id, { onDelete: 'set null' }),
    description: text('description').notNull(),
    recommendedAction: text('recommended_action').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('OPEN'),
    requiresHumanReview: boolean('requires_human_review').notNull().default(false),
    acknowledgedById: uuid('acknowledged_by_id').references(() => users.id, { onDelete: 'set null' }),
    acknowledgedByEmail: varchar('acknowledged_by_email', { length: 255 }),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_ai_safety_events_code').on(table.eventCode),
    index('idx_ai_safety_events_severity').on(table.severity),
    index('idx_ai_safety_events_status').on(table.status),
    index('idx_ai_safety_events_detected').on(table.detectedAt)
  ]
);

/**
 * Phase 1: Security Roles
 */
export const securityRoles = companySchema.table(
  'security_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roleCode: varchar('role_code', { length: 100 }).notNull(),
    roleName: varchar('role_name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    roleType: varchar('role_type', { length: 50 }).notNull().default('COMPANY'),
    scopeType: varchar('scope_type', { length: 50 }).notNull().default('COMPANY'),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    isSystemRole: boolean('is_system_role').notNull().default(false),
    createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
    createdByEmail: varchar('created_by_email', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_security_roles_code').on(table.roleCode),
    index('idx_security_roles_type').on(table.roleType),
    index('idx_security_roles_scope').on(table.scopeType),
    index('idx_security_roles_status').on(table.status)
  ]
);

/**
 * Phase 1: Security Permissions
 */
export const securityPermissions = companySchema.table(
  'security_permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    permissionCode: varchar('permission_code', { length: 100 }).notNull(),
    permissionName: varchar('permission_name', { length: 255 }).notNull(),
    domain: varchar('domain', { length: 100 }).notNull(),
    resource: varchar('resource', { length: 100 }).notNull(),
    action: varchar('action', { length: 50 }).notNull(),
    description: text('description').notNull(),
    riskLevel: varchar('risk_level', { length: 50 }).notNull().default('LOW'),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_security_permissions_code').on(table.permissionCode),
    index('idx_security_permissions_domain').on(table.domain),
    index('idx_security_permissions_action').on(table.action),
    index('idx_security_permissions_risk').on(table.riskLevel)
  ]
);

/**
 * Phase 1: Security Role Permissions
 */
export const securityRolePermissions = companySchema.table(
  'security_role_permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roleId: uuid('role_id')
      .notNull()
      .references(() => securityRoles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => securityPermissions.id, { onDelete: 'cascade' }),
    grantedById: uuid('granted_by_id').references(() => users.id, { onDelete: 'set null' }),
    grantedByEmail: varchar('granted_by_email', { length: 255 }).notNull(),
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_security_role_permissions').on(table.roleId, table.permissionId),
    index('idx_sec_role_perm_role').on(table.roleId),
    index('idx_sec_role_perm_perm').on(table.permissionId)
  ]
);

/**
 * Phase 1: Security User Roles
 */
export const securityUserRoles = companySchema.table(
  'security_user_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => securityRoles.id, { onDelete: 'cascade' }),
    scopeType: varchar('scope_type', { length: 50 }).notNull().default('COMPANY'),
    scopeReference: varchar('scope_reference', { length: 100 }).notNull(),
    assignedById: uuid('assigned_by_id').references(() => users.id, { onDelete: 'set null' }),
    assignedByEmail: varchar('assigned_by_email', { length: 255 }).notNull(),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE')
  },
  (table) => [
    index('idx_sec_user_roles_user').on(table.userId),
    index('idx_sec_user_roles_role').on(table.roleId),
    index('idx_sec_user_roles_status').on(table.status)
  ]
);

/**
 * Phase 1: Security Policies
 */
export const securityPolicies = companySchema.table(
  'security_policies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    policyCode: varchar('policy_code', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    policyType: varchar('policy_type', { length: 50 }).notNull().default('ACCESS_CONTROL'),
    severity: varchar('severity', { length: 50 }).notNull().default('MEDIUM'),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    rules: jsonb('rules').default([]),
    enforcementMode: varchar('enforcement_mode', { length: 50 }).notNull().default('ENFORCED'),
    effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull().defaultNow(),
    expirationDate: timestamp('expiration_date', { withTimezone: true }),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    approvedById: uuid('approved_by_id').references(() => users.id, { onDelete: 'set null' }),
    approvedByEmail: varchar('approved_by_email', { length: 255 }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    version: varchar('version', { length: 20 }).notNull().default('1.0.0'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_sec_policies_code').on(table.policyCode),
    index('idx_sec_policies_type').on(table.policyType),
    index('idx_sec_policies_status').on(table.status),
    index('idx_sec_policies_severity').on(table.severity)
  ]
);

/**
 * Phase 1: Security Sessions
 */
export const securitySessions = companySchema.table(
  'security_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: varchar('session_id', { length: 100 }).notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    userEmail: varchar('user_email', { length: 255 }).notNull(),
    authenticationMethod: varchar('authentication_method', { length: 50 }).notNull().default('PASSWORD_MFA'),
    ipHash: varchar('ip_hash', { length: 128 }).notNull(),
    deviceFingerprintHash: varchar('device_fingerprint_hash', { length: 128 }).notNull(),
    userAgentSummary: varchar('user_agent_summary', { length: 255 }).notNull(),
    scope: varchar('scope', { length: 50 }).notNull().default('COMPANY'),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    terminatedAt: timestamp('terminated_at', { withTimezone: true }),
    terminationReason: text('termination_reason'),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    uniqueIndex('uq_sec_sessions_id').on(table.sessionId),
    index('idx_sec_sessions_user').on(table.userId),
    index('idx_sec_sessions_status').on(table.status),
    index('idx_sec_sessions_expires').on(table.expiresAt)
  ]
);

/**
 * Phase 1: Security Credentials
 */
export const securityCredentials = companySchema.table(
  'security_credentials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    credentialCode: varchar('credential_code', { length: 100 }).notNull(),
    credentialType: varchar('credential_type', { length: 50 }).notNull().default('API_KEY'),
    ownerType: varchar('owner_type', { length: 50 }).notNull(),
    ownerReference: varchar('owner_reference', { length: 100 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
    createdByEmail: varchar('created_by_email', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastRotatedAt: timestamp('last_rotated_at', { withTimezone: true }),
    nextRotationDue: timestamp('next_rotation_due', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    uniqueIndex('uq_sec_credentials_code').on(table.credentialCode),
    index('idx_sec_credentials_type').on(table.credentialType),
    index('idx_sec_credentials_status').on(table.status),
    index('idx_sec_credentials_owner').on(table.ownerReference)
  ]
);

/**
 * Phase 1: Security Incidents
 */
export const securityIncidents = companySchema.table(
  'security_incidents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    incidentCode: varchar('incident_code', { length: 100 }).notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    severity: varchar('severity', { length: 50 }).notNull().default('MEDIUM'),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    source: varchar('source', { length: 100 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('OPEN'),
    assignedToId: uuid('assigned_to_id').references(() => users.id, { onDelete: 'set null' }),
    assignedToEmail: varchar('assigned_to_email', { length: 255 }),
    detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolutionNotes: text('resolution_notes'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_sec_incidents_code').on(table.incidentCode),
    index('idx_sec_incidents_severity').on(table.severity),
    index('idx_sec_incidents_status').on(table.status),
    index('idx_sec_incidents_detected').on(table.detectedAt)
  ]
);

/**
 * Phase 1: Security Audit Verifications
 */
export const securityAuditVerifications = companySchema.table(
  'security_audit_verifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    verificationCode: varchar('verification_code', { length: 100 }).notNull(),
    auditEventReference: varchar('audit_event_reference', { length: 100 }).notNull(),
    verificationType: varchar('verification_type', { length: 100 }).notNull(),
    verificationStatus: varchar('verification_status', { length: 50 }).notNull().default('VERIFIED_VALID'),
    verifiedById: uuid('verified_by_id').references(() => users.id, { onDelete: 'set null' }),
    verifiedByEmail: varchar('verified_by_email', { length: 255 }).notNull(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }).notNull().defaultNow(),
    evidenceReference: varchar('evidence_reference', { length: 255 }).notNull(),
    notes: text('notes').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_sec_audit_verif_code').on(table.verificationCode),
    index('idx_sec_audit_verif_ref').on(table.auditEventReference),
    index('idx_sec_audit_verif_status').on(table.verificationStatus)
  ]
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;

export type Feature = typeof features.$inferSelect;
export type NewFeature = typeof features.$inferInsert;

export type PlanEntitlement = typeof planEntitlements.$inferSelect;
export type NewPlanEntitlement = typeof planEntitlements.$inferInsert;

export type PartnerPlanAssignment = typeof partnerPlanAssignments.$inferSelect;
export type NewPartnerPlanAssignment = typeof partnerPlanAssignments.$inferInsert;

export type PartnerProfile = typeof partnerProfiles.$inferSelect;
export type NewPartnerProfile = typeof partnerProfiles.$inferInsert;

export type PartnerLifecycleTransition = typeof partnerLifecycleTransitions.$inferSelect;
export type NewPartnerLifecycleTransition = typeof partnerLifecycleTransitions.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type BillingAccount = typeof billingAccounts.$inferSelect;
export type NewBillingAccount = typeof billingAccounts.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type SalesLead = typeof salesLeads.$inferSelect;
export type NewSalesLead = typeof salesLeads.$inferInsert;

export type SalesOpportunity = typeof salesOpportunities.$inferSelect;
export type NewSalesOpportunity = typeof salesOpportunities.$inferInsert;

export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type NewMarketingCampaign = typeof marketingCampaigns.$inferInsert;

export type MarketingActivity = typeof marketingActivities.$inferSelect;
export type NewMarketingActivity = typeof marketingActivities.$inferInsert;

export type SalesTask = typeof salesTasks.$inferSelect;
export type NewSalesTask = typeof salesTasks.$inferInsert;

export type SupportTicket = typeof supportTickets.$inferSelect;
export type NewSupportTicket = typeof supportTickets.$inferInsert;

export type SupportTicketComment = typeof supportTicketComments.$inferSelect;
export type NewSupportTicketComment = typeof supportTicketComments.$inferInsert;

export type PartnerHealthProfile = typeof partnerHealthProfiles.$inferSelect;
export type NewPartnerHealthProfile = typeof partnerHealthProfiles.$inferInsert;

export type SuccessCheckin = typeof successCheckins.$inferSelect;
export type NewSuccessCheckin = typeof successCheckins.$inferInsert;

export type ContentItem = typeof contentItems.$inferSelect;
export type NewContentItem = typeof contentItems.$inferInsert;

export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type NewNotificationTemplate = typeof notificationTemplates.$inferInsert;

export type NotificationDispatchRecord = typeof notificationDispatchRecords.$inferSelect;
export type NewNotificationDispatchRecord = typeof notificationDispatchRecords.$inferInsert;

export type AnalyticsReport = typeof analyticsReports.$inferSelect;
export type NewAnalyticsReport = typeof analyticsReports.$inferInsert;

export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;
export type NewAnalyticsSnapshot = typeof analyticsSnapshots.$inferInsert;

export type SystemInsight = typeof systemInsights.$inferSelect;
export type NewSystemInsight = typeof systemInsights.$inferInsert;

export type AIModel = typeof aiModels.$inferSelect;
export type NewAIModel = typeof aiModels.$inferInsert;

export type AIGovernancePolicy = typeof aiGovernancePolicies.$inferSelect;
export type NewAIGovernancePolicy = typeof aiGovernancePolicies.$inferInsert;

export type AIPromptTemplate = typeof aiPromptTemplates.$inferSelect;
export type NewAIPromptTemplate = typeof aiPromptTemplates.$inferInsert;

export type AIPromptVersion = typeof aiPromptVersions.$inferSelect;
export type NewAIPromptVersion = typeof aiPromptVersions.$inferInsert;

export type AIUsageQuota = typeof aiUsageQuotas.$inferSelect;
export type NewAIUsageQuota = typeof aiUsageQuotas.$inferInsert;

export type AIUsageRecord = typeof aiUsageRecords.$inferSelect;
export type NewAIUsageRecord = typeof aiUsageRecords.$inferInsert;

export type AIAuditTrace = typeof aiAuditTraces.$inferSelect;
export type NewAIAuditTrace = typeof aiAuditTraces.$inferInsert;

export type AISafetyEvent = typeof aiSafetyEvents.$inferSelect;
export type NewAISafetyEvent = typeof aiSafetyEvents.$inferInsert;

export type SecurityRole = typeof securityRoles.$inferSelect;
export type NewSecurityRole = typeof securityRoles.$inferInsert;

export type SecurityPermission = typeof securityPermissions.$inferSelect;
export type NewSecurityPermission = typeof securityPermissions.$inferInsert;

export type SecurityRolePermission = typeof securityRolePermissions.$inferSelect;
export type NewSecurityRolePermission = typeof securityRolePermissions.$inferInsert;

export type SecurityUserRole = typeof securityUserRoles.$inferSelect;
export type NewSecurityUserRole = typeof securityUserRoles.$inferInsert;

export type SecurityPolicy = typeof securityPolicies.$inferSelect;
export type NewSecurityPolicy = typeof securityPolicies.$inferInsert;

export type SecuritySession = typeof securitySessions.$inferSelect;
export type NewSecuritySession = typeof securitySessions.$inferInsert;

export type SecurityCredential = typeof securityCredentials.$inferSelect;
export type NewSecurityCredential = typeof securityCredentials.$inferInsert;

export type SecurityIncident = typeof securityIncidents.$inferSelect;
export type NewSecurityIncident = typeof securityIncidents.$inferInsert;

export type SecurityAuditVerification = typeof securityAuditVerifications.$inferSelect;
export type NewSecurityAuditVerification = typeof securityAuditVerifications.$inferInsert;

/**
 * Phase 1 Domain #11: Compliance Frameworks
 */
export const complianceFrameworks = companySchema.table(
  'compliance_frameworks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    frameworkCode: varchar('framework_code', { length: 100 }).notNull().unique(),
    frameworkType: varchar('framework_type', { length: 50 }).notNull().default('HIPAA'),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    version: varchar('version', { length: 50 }).notNull().default('1.0.0'),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    effectiveDate: timestamp('effective_date', { withTimezone: true }),
    expirationDate: timestamp('expiration_date', { withTimezone: true }),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_comp_framework_type').on(table.frameworkType),
    index('idx_comp_framework_status').on(table.status),
    index('idx_comp_framework_code').on(table.frameworkCode)
  ]
);

/**
 * Phase 1 Domain #11: Compliance Controls
 */
export const complianceControls = companySchema.table(
  'compliance_controls',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    frameworkId: uuid('framework_id')
      .notNull()
      .references(() => complianceFrameworks.id, { onDelete: 'cascade' }),
    controlCode: varchar('control_code', { length: 100 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    controlCategory: varchar('control_category', { length: 100 }).notNull(),
    controlStatus: varchar('control_status', { length: 50 }).notNull().default('NOT_STARTED'),
    requirementSummary: text('requirement_summary').notNull(),
    implementationNotes: text('implementation_notes'),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    reviewDueDate: timestamp('review_due_date', { withTimezone: true }),
    lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_compliance_control_framework_code').on(table.frameworkId, table.controlCode),
    index('idx_comp_controls_framework').on(table.frameworkId),
    index('idx_comp_controls_status').on(table.controlStatus),
    index('idx_comp_controls_review_due').on(table.reviewDueDate)
  ]
);

/**
 * Phase 1 Domain #11: Compliance Evidence Registry
 */
export const complianceEvidence = companySchema.table(
  'compliance_evidence',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    evidenceCode: varchar('evidence_code', { length: 100 }).notNull().unique(),
    evidenceType: varchar('evidence_type', { length: 50 }).notNull().default('POLICY_DOCUMENT'),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    sourceDomain: varchar('source_domain', { length: 100 }).notNull(),
    sourceReference: varchar('source_reference', { length: 255 }).notNull(),
    evidenceStatus: varchar('evidence_status', { length: 50 }).notNull().default('DRAFT'),
    collectedAt: timestamp('collected_at', { withTimezone: true }).notNull().defaultNow(),
    validFrom: timestamp('valid_from', { withTimezone: true }),
    validUntil: timestamp('valid_until', { withTimezone: true }),
    submittedById: uuid('submitted_by_id').references(() => users.id, { onDelete: 'set null' }),
    submittedByEmail: varchar('submitted_by_email', { length: 255 }).notNull(),
    reviewedById: uuid('reviewed_by_id').references(() => users.id, { onDelete: 'set null' }),
    reviewedByEmail: varchar('reviewed_by_email', { length: 255 }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_comp_evidence_type').on(table.evidenceType),
    index('idx_comp_evidence_status').on(table.evidenceStatus),
    index('idx_comp_evidence_valid_until').on(table.validUntil),
    index('idx_comp_evidence_source_domain').on(table.sourceDomain)
  ]
);

/**
 * Phase 1 Domain #11: Compliance Control Mappings
 */
export const complianceControlMappings = companySchema.table(
  'compliance_control_mappings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    controlId: uuid('control_id')
      .notNull()
      .references(() => complianceControls.id, { onDelete: 'cascade' }),
    evidenceId: uuid('evidence_id')
      .notNull()
      .references(() => complianceEvidence.id, { onDelete: 'cascade' }),
    mappingStatus: varchar('mapping_status', { length: 50 }).notNull().default('ACTIVE'),
    mappingNotes: text('mapping_notes'),
    mappedById: uuid('mapped_by_id').references(() => users.id, { onDelete: 'set null' }),
    mappedByEmail: varchar('mapped_by_email', { length: 255 }).notNull(),
    mappedAt: timestamp('mapped_at', { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    uniqueIndex('uq_comp_mapping_ctrl_ev').on(table.controlId, table.evidenceId),
    index('idx_comp_mappings_control').on(table.controlId),
    index('idx_comp_mappings_evidence').on(table.evidenceId),
    index('idx_comp_mappings_status').on(table.mappingStatus)
  ]
);

/**
 * Phase 1 Domain #11: Data Classifications
 */
export const dataClassifications = companySchema.table(
  'data_classifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    classificationCode: varchar('classification_code', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    classificationLevel: varchar('classification_level', { length: 50 }).notNull().default('INTERNAL'),
    description: text('description').notNull(),
    handlingRequirements: jsonb('handling_requirements').default([]),
    exportAllowed: boolean('export_allowed').notNull().default(false),
    externalSharingAllowed: boolean('external_sharing_allowed').notNull().default(false),
    retentionRequired: boolean('retention_required').notNull().default(true),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_data_class_level').on(table.classificationLevel),
    index('idx_data_class_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #11: Data Retention Policies
 */
export const dataRetentionPolicies = companySchema.table(
  'data_retention_policies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    policyCode: varchar('policy_code', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    defaultRetentionDays: integer('default_retention_days').notNull().default(2555), // 7 years default for healthcare
    legalHoldSupported: boolean('legal_hold_supported').notNull().default(true),
    deletionMethod: varchar('deletion_method', { length: 100 }).notNull().default('CRYPTOGRAPHIC_ERASURE'),
    archiveBeforeDelete: boolean('archive_before_delete').notNull().default(true),
    approvalRequired: boolean('approval_required').notNull().default(true),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    effectiveDate: timestamp('effective_date', { withTimezone: true }),
    expirationDate: timestamp('expiration_date', { withTimezone: true }),
    version: varchar('version', { length: 50 }).notNull().default('1.0.0'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_retention_policy_status').on(table.status),
    index('idx_retention_policy_code').on(table.policyCode)
  ]
);

/**
 * Phase 1 Domain #11: Data Retention Rules
 */
export const dataRetentionRules = companySchema.table(
  'data_retention_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    retentionPolicyId: uuid('retention_policy_id')
      .notNull()
      .references(() => dataRetentionPolicies.id, { onDelete: 'cascade' }),
    dataDomain: varchar('data_domain', { length: 100 }).notNull(),
    resourceType: varchar('resource_type', { length: 100 }).notNull(),
    classificationLevel: varchar('classification_level', { length: 50 }).notNull().default('INTERNAL'),
    retentionDays: integer('retention_days').notNull(),
    legalHoldBehavior: varchar('legal_hold_behavior', { length: 100 }).notNull().default('SUSPEND_DELETION'),
    deletionBehavior: varchar('deletion_behavior', { length: 100 }).notNull().default('PURGE_AND_AUDIT'),
    archiveBehavior: varchar('archive_behavior', { length: 100 }).notNull().default('COLD_STORAGE_ENCRYPTED'),
    exceptionAllowed: boolean('exception_allowed').notNull().default(false),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_retention_rules_policy').on(table.retentionPolicyId),
    index('idx_retention_rules_domain').on(table.dataDomain),
    index('idx_retention_rules_class').on(table.classificationLevel)
  ]
);

/**
 * Phase 1 Domain #11: BAA Records
 */
export const baaRecords = companySchema.table(
  'baa_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    baaCode: varchar('baa_code', { length: 100 }).notNull().unique(),
    partnerId: uuid('partner_id').references(() => partnerProfiles.id, { onDelete: 'set null' }),
    partnerName: varchar('partner_name', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    effectiveDate: timestamp('effective_date', { withTimezone: true }),
    expirationDate: timestamp('expiration_date', { withTimezone: true }),
    signedReference: varchar('signed_reference', { length: 255 }).notNull(),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    reviewDueDate: timestamp('review_due_date', { withTimezone: true }),
    terminationDate: timestamp('termination_date', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_baa_records_partner').on(table.partnerId),
    index('idx_baa_records_status').on(table.status),
    index('idx_baa_records_exp').on(table.expirationDate),
    index('idx_baa_records_review').on(table.reviewDueDate)
  ]
);

/**
 * Phase 1 Domain #11: Governance Exceptions
 */
export const governanceExceptions = companySchema.table(
  'governance_exceptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    exceptionCode: varchar('exception_code', { length: 100 }).notNull().unique(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    frameworkId: uuid('framework_id').references(() => complianceFrameworks.id, { onDelete: 'set null' }),
    controlId: uuid('control_id').references(() => complianceControls.id, { onDelete: 'set null' }),
    requestedById: uuid('requested_by_id').references(() => users.id, { onDelete: 'set null' }),
    requestedByEmail: varchar('requested_by_email', { length: 255 }).notNull(),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('REQUESTED'),
    riskLevel: varchar('risk_level', { length: 50 }).notNull().default('MEDIUM'),
    justification: text('justification').notNull(),
    compensatingControls: text('compensating_controls').notNull(),
    requestedExpirationDate: timestamp('requested_expiration_date', { withTimezone: true }),
    approvedById: uuid('approved_by_id').references(() => users.id, { onDelete: 'set null' }),
    approvedByEmail: varchar('approved_by_email', { length: 255 }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    closureNotes: text('closure_notes'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_gov_exceptions_framework').on(table.frameworkId),
    index('idx_gov_exceptions_control').on(table.controlId),
    index('idx_gov_exceptions_status').on(table.status),
    index('idx_gov_exceptions_risk').on(table.riskLevel),
    index('idx_gov_exceptions_exp').on(table.requestedExpirationDate)
  ]
);

/**
 * Phase 1 Domain #11: Compliance Verifications
 */
export const complianceVerifications = companySchema.table(
  'compliance_verifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    verificationCode: varchar('verification_code', { length: 100 }).notNull().unique(),
    controlId: uuid('control_id')
      .notNull()
      .references(() => complianceControls.id, { onDelete: 'cascade' }),
    verificationType: varchar('verification_type', { length: 100 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('PENDING'),
    verifierId: uuid('verifier_id').references(() => users.id, { onDelete: 'set null' }),
    verifierEmail: varchar('verifier_email', { length: 255 }).notNull(),
    verificationDate: timestamp('verification_date', { withTimezone: true }).notNull().defaultNow(),
    evidenceReference: varchar('evidence_reference', { length: 255 }).notNull(),
    findings: text('findings').notNull(),
    remediationRequired: boolean('remediation_required').notNull().default(false),
    remediationDueDate: timestamp('remediation_due_date', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_comp_verif_control').on(table.controlId),
    index('idx_comp_verif_status').on(table.status),
    index('idx_comp_verif_date').on(table.verificationDate)
  ]
);

/**
 * Phase 1 Domain #11: Compliance Reports
 */
export const complianceReports = companySchema.table(
  'compliance_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reportCode: varchar('report_code', { length: 100 }).notNull().unique(),
    reportName: varchar('report_name', { length: 255 }).notNull(),
    frameworkType: varchar('framework_type', { length: 50 }).notNull().default('HIPAA'),
    reportingPeriodStart: timestamp('reporting_period_start', { withTimezone: true }).notNull(),
    reportingPeriodEnd: timestamp('reporting_period_end', { withTimezone: true }).notNull(),
    outputFormat: varchar('output_format', { length: 50 }).notNull().default('PDF_AND_JSON'),
    status: varchar('status', { length: 50 }).notNull().default('COMPLETED'),
    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
    generatedById: uuid('generated_by_id').references(() => users.id, { onDelete: 'set null' }),
    generatedByEmail: varchar('generated_by_email', { length: 255 }).notNull(),
    evidenceReference: varchar('evidence_reference', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_comp_reports_framework').on(table.frameworkType),
    index('idx_comp_reports_status').on(table.status),
    index('idx_comp_reports_gen_at').on(table.generatedAt)
  ]
);

export type ComplianceFramework = typeof complianceFrameworks.$inferSelect;
export type NewComplianceFramework = typeof complianceFrameworks.$inferInsert;

export type ComplianceControl = typeof complianceControls.$inferSelect;
export type NewComplianceControl = typeof complianceControls.$inferInsert;

export type ComplianceEvidence = typeof complianceEvidence.$inferSelect;
export type NewComplianceEvidence = typeof complianceEvidence.$inferInsert;

export type ComplianceControlMapping = typeof complianceControlMappings.$inferSelect;
export type NewComplianceControlMapping = typeof complianceControlMappings.$inferInsert;

export type DataClassificationEntity = typeof dataClassifications.$inferSelect;
export type NewDataClassificationEntity = typeof dataClassifications.$inferInsert;

export type DataRetentionPolicy = typeof dataRetentionPolicies.$inferSelect;
export type NewDataRetentionPolicy = typeof dataRetentionPolicies.$inferInsert;

export type DataRetentionRule = typeof dataRetentionRules.$inferSelect;
export type NewDataRetentionRule = typeof dataRetentionRules.$inferInsert;

export type BAARecord = typeof baaRecords.$inferSelect;
export type NewBAARecord = typeof baaRecords.$inferInsert;

export type GovernanceException = typeof governanceExceptions.$inferSelect;
export type NewGovernanceException = typeof governanceExceptions.$inferInsert;

export type ComplianceVerification = typeof complianceVerifications.$inferSelect;
export type NewComplianceVerification = typeof complianceVerifications.$inferInsert;

export type ComplianceReport = typeof complianceReports.$inferSelect;
export type NewComplianceReport = typeof complianceReports.$inferInsert;

/**
 * Phase 1 Domain #12: Integration Providers
 */
export const integrationProviders = companySchema.table(
  'integration_providers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    providerCode: varchar('provider_code', { length: 100 }).notNull().unique(),
    providerName: varchar('provider_name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    integrationType: varchar('integration_type', { length: 50 }).notNull().default('CUSTOM_REST_API'),
    protocol: varchar('protocol', { length: 50 }).notNull().default('REST_JSON'),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    documentationReference: varchar('documentation_reference', { length: 255 }).notNull(),
    supportReference: varchar('support_reference', { length: 255 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_int_prov_type').on(table.integrationType),
    index('idx_int_prov_protocol').on(table.protocol),
    index('idx_int_prov_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #12: Integration Endpoints
 */
export const integrationEndpoints = companySchema.table(
  'integration_endpoints',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    endpointCode: varchar('endpoint_code', { length: 100 }).notNull().unique(),
    providerId: uuid('provider_id')
      .notNull()
      .references(() => integrationProviders.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    baseUrlReference: varchar('base_url_reference', { length: 255 }).notNull(),
    environment: varchar('environment', { length: 50 }).notNull().default('PRODUCTION'),
    status: varchar('status', { length: 50 }).notNull().default('ONLINE'),
    authenticationMethod: varchar('authentication_method', { length: 50 }).notNull().default('BEARER_JWT'),
    healthCheckPathReference: varchar('health_check_path_reference', { length: 255 }),
    timeoutMs: integer('timeout_ms').notNull().default(5000),
    retryPolicy: varchar('retry_policy', { length: 100 }).notNull().default('EXPONENTIAL_BACKOFF_3X'),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_int_endpoints_prov').on(table.providerId),
    index('idx_int_endpoints_env').on(table.environment),
    index('idx_int_endpoints_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #12: API Routes
 */
export const apiRoutes = companySchema.table(
  'api_routes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    routeCode: varchar('route_code', { length: 100 }).notNull().unique(),
    method: varchar('method', { length: 20 }).notNull().default('GET'),
    pathPattern: varchar('path_pattern', { length: 255 }).notNull(),
    serviceName: varchar('service_name', { length: 100 }).notNull(),
    domain: varchar('domain', { length: 100 }).notNull(),
    version: varchar('version', { length: 50 }).notNull().default('v1'),
    environment: varchar('environment', { length: 50 }).notNull().default('PRODUCTION'),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    authenticationRequired: boolean('authentication_required').notNull().default(true),
    requiredPermission: varchar('required_permission', { length: 100 }),
    rateLimitPolicyId: uuid('rate_limit_policy_id'),
    description: text('description').notNull(),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_api_routes_service').on(table.serviceName),
    index('idx_api_routes_domain').on(table.domain),
    index('idx_api_routes_version').on(table.version),
    index('idx_api_routes_env').on(table.environment),
    index('idx_api_routes_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #12: API Versions
 */
export const apiVersions = companySchema.table(
  'api_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    apiName: varchar('api_name', { length: 100 }).notNull(),
    version: varchar('version', { length: 50 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    releaseDate: timestamp('release_date', { withTimezone: true }).notNull().defaultNow(),
    deprecationDate: timestamp('deprecation_date', { withTimezone: true }),
    sunsetDate: timestamp('sunset_date', { withTimezone: true }),
    breakingChange: boolean('breaking_change').notNull().default(false),
    migrationReference: varchar('migration_reference', { length: 255 }),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_api_versions_name_ver').on(table.apiName, table.version),
    index('idx_api_versions_name').on(table.apiName),
    index('idx_api_versions_status').on(table.status),
    index('idx_api_versions_sunset').on(table.sunsetDate)
  ]
);

/**
 * Phase 1 Domain #12: Integration Connections
 */
export const integrationConnections = companySchema.table(
  'integration_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    connectionCode: varchar('connection_code', { length: 100 }).notNull().unique(),
    providerId: uuid('provider_id')
      .notNull()
      .references(() => integrationProviders.id, { onDelete: 'cascade' }),
    endpointId: uuid('endpoint_id')
      .notNull()
      .references(() => integrationEndpoints.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').references(() => partnerProfiles.id, { onDelete: 'set null' }),
    tenantScope: varchar('tenant_scope', { length: 50 }).notNull().default('PLATFORM'),
    environment: varchar('environment', { length: 50 }).notNull().default('PRODUCTION'),
    status: varchar('status', { length: 50 }).notNull().default('CONNECTED'),
    lastSuccessAt: timestamp('last_success_at', { withTimezone: true }),
    lastFailureAt: timestamp('last_failure_at', { withTimezone: true }),
    lastHealthCheckAt: timestamp('last_health_check_at', { withTimezone: true }),
    failureCount: integer('failure_count').notNull().default(0),
    successCount: integer('success_count').notNull().default(0),
    healthStatus: varchar('health_status', { length: 50 }).notNull().default('PENDING_TELEMETRY_PIPELINE'),
    credentialReferenceId: uuid('credential_reference_id'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_int_conn_prov').on(table.providerId),
    index('idx_int_conn_partner').on(table.partnerId),
    index('idx_int_conn_status').on(table.status),
    index('idx_int_conn_health').on(table.healthStatus),
    index('idx_int_conn_check_at').on(table.lastHealthCheckAt)
  ]
);

/**
 * Phase 1 Domain #12: HL7 Endpoints
 */
export const hl7Endpoints = companySchema.table(
  'hl7_endpoints',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    endpointCode: varchar('endpoint_code', { length: 100 }).notNull().unique(),
    connectionId: uuid('connection_id')
      .notNull()
      .references(() => integrationConnections.id, { onDelete: 'cascade' }),
    hl7Version: varchar('hl7_version', { length: 50 }).notNull().default('HL7_V2_5_1'),
    messageTypes: jsonb('message_types').default([]),
    transportProtocol: varchar('transport_protocol', { length: 50 }).notNull().default('MLLP_TLS'),
    acknowledgementMode: varchar('acknowledgement_mode', { length: 50 }).notNull().default('ORIGINAL_MODE'),
    status: varchar('status', { length: 50 }).notNull().default('ONLINE'),
    facilityReference: varchar('facility_reference', { length: 255 }).notNull(),
    routingRules: jsonb('routing_rules').default([]),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_hl7_conn').on(table.connectionId),
    index('idx_hl7_version').on(table.hl7Version),
    index('idx_hl7_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #12: FHIR Capabilities
 */
export const fhirCapabilities = companySchema.table(
  'fhir_capabilities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    connectionId: uuid('connection_id')
      .notNull()
      .references(() => integrationConnections.id, { onDelete: 'cascade' }),
    fhirVersion: varchar('fhir_version', { length: 50 }).notNull().default('FHIR_R4'),
    capabilityMode: varchar('capability_mode', { length: 50 }).notNull().default('BRIDGE'),
    resourceTypes: jsonb('resource_types').default([]),
    searchSupported: boolean('search_supported').notNull().default(true),
    createSupported: boolean('create_supported').notNull().default(false),
    readSupported: boolean('read_supported').notNull().default(true),
    updateSupported: boolean('update_supported').notNull().default(false),
    deleteSupported: boolean('delete_supported').notNull().default(false),
    batchSupported: boolean('batch_supported').notNull().default(true),
    subscriptionSupported: boolean('subscription_supported').notNull().default(false),
    status: varchar('status', { length: 50 }).notNull().default('ONLINE'),
    capabilityReference: varchar('capability_reference', { length: 255 }).notNull(),
    lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_fhir_cap_conn').on(table.connectionId),
    index('idx_fhir_cap_ver').on(table.fhirVersion),
    index('idx_fhir_cap_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #12: FHIR Resource Configurations
 */
export const fhirResourceConfigurations = companySchema.table(
  'fhir_resource_configurations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    connectionId: uuid('connection_id')
      .notNull()
      .references(() => integrationConnections.id, { onDelete: 'cascade' }),
    resourceType: varchar('resource_type', { length: 100 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('ENABLED'),
    readEnabled: boolean('read_enabled').notNull().default(true),
    writeEnabled: boolean('write_enabled').notNull().default(false),
    searchEnabled: boolean('search_enabled').notNull().default(true),
    exportEnabled: boolean('export_enabled').notNull().default(false),
    validationMode: varchar('validation_mode', { length: 50 }).notNull().default('STRICT_US_CORE'),
    mappingReference: varchar('mapping_reference', { length: 255 }).notNull(),
    governancePolicyReference: varchar('governance_policy_reference', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_fhir_res_conn_type').on(table.connectionId, table.resourceType),
    index('idx_fhir_res_conn').on(table.connectionId),
    index('idx_fhir_res_type').on(table.resourceType),
    index('idx_fhir_res_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #12: Webhook Endpoints
 */
export const webhookEndpoints = companySchema.table(
  'webhook_endpoints',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    webhookCode: varchar('webhook_code', { length: 100 }).notNull().unique(),
    providerId: uuid('provider_id').references(() => integrationProviders.id, { onDelete: 'set null' }),
    connectionId: uuid('connection_id').references(() => integrationConnections.id, { onDelete: 'set null' }),
    endpointReference: varchar('endpoint_reference', { length: 255 }).notNull(),
    eventTypes: jsonb('event_types').default([]),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    authenticationMethod: varchar('authentication_method', { length: 50 }).notNull().default('WEBHOOK_HMAC_SIGNATURE'),
    retryPolicy: varchar('retry_policy', { length: 100 }).notNull().default('EXPONENTIAL_BACKOFF_5X'),
    maxRetryAttempts: integer('max_retry_attempts').notNull().default(5),
    timeoutMs: integer('timeout_ms').notNull().default(5000),
    lastDeliveryAt: timestamp('last_delivery_at', { withTimezone: true }),
    lastFailureAt: timestamp('last_failure_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_webhook_endpoints_prov').on(table.providerId),
    index('idx_webhook_endpoints_conn').on(table.connectionId),
    index('idx_webhook_endpoints_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #12: Webhook Deliveries
 */
export const webhookDeliveries = companySchema.table(
  'webhook_deliveries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    deliveryId: varchar('delivery_id', { length: 100 }).notNull().unique(),
    webhookEndpointId: uuid('webhook_endpoint_id')
      .notNull()
      .references(() => webhookEndpoints.id, { onDelete: 'cascade' }),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    deliveryStatus: varchar('delivery_status', { length: 50 }).notNull().default('DELIVERED'),
    attemptNumber: integer('attempt_number').notNull().default(1),
    responseStatus: integer('response_status'),
    latencyMs: integer('latency_ms'),
    failureReason: varchar('failure_reason', { length: 100 }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
    traceReference: varchar('trace_reference', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_webhook_deliv_endpoint').on(table.webhookEndpointId),
    index('idx_webhook_deliv_status').on(table.deliveryStatus),
    index('idx_webhook_deliv_created').on(table.createdAt),
    index('idx_webhook_deliv_retry').on(table.nextRetryAt)
  ]
);

/**
 * Phase 1 Domain #12: API Rate Limit Policies
 */
export const apiRateLimitPolicies = companySchema.table(
  'api_rate_limit_policies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    policyCode: varchar('policy_code', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    scopeType: varchar('scope_type', { length: 50 }).notNull().default('GLOBAL'),
    scopeReference: varchar('scope_reference', { length: 100 }).notNull().default('GLOBAL'),
    limitValue: integer('limit_value').notNull().default(1000),
    period: varchar('period', { length: 50 }).notNull().default('MINUTE'),
    burstLimit: integer('burst_limit').notNull().default(1500),
    action: varchar('action', { length: 50 }).notNull().default('BLOCK_429'),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    effectiveDate: timestamp('effective_date', { withTimezone: true }),
    expirationDate: timestamp('expiration_date', { withTimezone: true }),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_rate_limit_scope_type').on(table.scopeType),
    index('idx_rate_limit_scope_ref').on(table.scopeReference),
    index('idx_rate_limit_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #12: API Usage Records
 */
export const apiUsageRecords = companySchema.table(
  'api_usage_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    routeId: uuid('route_id')
      .notNull()
      .references(() => apiRoutes.id, { onDelete: 'cascade' }),
    connectionId: uuid('connection_id').references(() => integrationConnections.id, { onDelete: 'set null' }),
    tenantScope: varchar('tenant_scope', { length: 50 }).notNull().default('PLATFORM'),
    environment: varchar('environment', { length: 50 }).notNull().default('PRODUCTION'),
    requestCount: integer('request_count').notNull().default(0),
    successCount: integer('success_count').notNull().default(0),
    errorCount: integer('error_count').notNull().default(0),
    rateLimitedCount: integer('rate_limited_count').notNull().default(0),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
    sourceStatus: varchar('source_status', { length: 50 }).notNull().default('PENDING_TELEMETRY_PIPELINE'),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_api_usage_route').on(table.routeId),
    index('idx_api_usage_conn').on(table.connectionId),
    index('idx_api_usage_env').on(table.environment),
    index('idx_api_usage_recorded').on(table.recordedAt)
  ]
);

/**
 * Phase 1 Domain #12: Integration Health
 */
export const integrationHealth = companySchema.table(
  'integration_health',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    connectionId: uuid('connection_id')
      .notNull()
      .references(() => integrationConnections.id, { onDelete: 'cascade' }),
    healthStatus: varchar('health_status', { length: 50 }).notNull().default('PENDING_TELEMETRY_PIPELINE'),
    availabilityStatus: varchar('availability_status', { length: 50 }).notNull().default('TELEMETRY_PENDING'),
    latencyMs: integer('latency_ms'),
    consecutiveFailures: integer('consecutive_failures').notNull().default(0),
    lastSuccessAt: timestamp('last_success_at', { withTimezone: true }),
    lastFailureAt: timestamp('last_failure_at', { withTimezone: true }),
    checkedAt: timestamp('checked_at', { withTimezone: true }).notNull().defaultNow(),
    checkSource: varchar('check_source', { length: 100 }).notNull().default('GATEWAY_PROBE'),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_int_health_conn').on(table.connectionId),
    index('idx_int_health_status').on(table.healthStatus),
    index('idx_int_health_checked').on(table.checkedAt)
  ]
);

/**
 * Phase 1 Domain #12: Integration Incidents
 */
export const integrationIncidents = companySchema.table(
  'integration_incidents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    incidentCode: varchar('incident_code', { length: 100 }).notNull().unique(),
    connectionId: uuid('connection_id').references(() => integrationConnections.id, { onDelete: 'set null' }),
    providerId: uuid('provider_id').references(() => integrationProviders.id, { onDelete: 'set null' }),
    category: varchar('category', { length: 100 }).notNull(),
    severity: varchar('severity', { length: 50 }).notNull().default('MEDIUM'),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    source: varchar('source', { length: 100 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('OPEN'),
    assignedToId: uuid('assigned_to_id').references(() => users.id, { onDelete: 'set null' }),
    assignedToEmail: varchar('assigned_to_email', { length: 255 }),
    detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolutionNotes: text('resolution_notes'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_int_inc_conn').on(table.connectionId),
    index('idx_int_inc_prov').on(table.providerId),
    index('idx_int_inc_sev').on(table.severity),
    index('idx_int_inc_status').on(table.status),
    index('idx_int_inc_detected').on(table.detectedAt)
  ]
);

/**
 * Phase 1 Domain #12: Integration Credentials (Metadata & References Only)
 */
export const integrationCredentials = companySchema.table(
  'integration_credentials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    credentialCode: varchar('credential_code', { length: 100 }).notNull().unique(),
    credentialType: varchar('credential_type', { length: 100 }).notNull(),
    ownerType: varchar('owner_type', { length: 50 }).notNull().default('PROVIDER'),
    ownerReference: varchar('owner_reference', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    secretReference: varchar('secret_reference', { length: 255 }).notNull(), // vault path reference only
    createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
    createdByEmail: varchar('created_by_email', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastRotatedAt: timestamp('last_rotated_at', { withTimezone: true }),
    nextRotationDue: timestamp('next_rotation_due', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_int_cred_type').on(table.credentialType),
    index('idx_int_cred_status').on(table.status),
    index('idx_int_cred_owner_ref').on(table.ownerReference),
    index('idx_int_cred_next_rot').on(table.nextRotationDue)
  ]
);

/**
 * Phase 1 Domain #12: Integration Audit Traces
 */
export const integrationAuditTraces = companySchema.table(
  'integration_audit_traces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    traceId: varchar('trace_id', { length: 100 }).notNull().unique(),
    connectionId: uuid('connection_id').references(() => integrationConnections.id, { onDelete: 'set null' }),
    routeId: uuid('route_id').references(() => apiRoutes.id, { onDelete: 'set null' }),
    webhookDeliveryId: uuid('webhook_delivery_id').references(() => webhookDeliveries.id, { onDelete: 'set null' }),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    actorEmail: varchar('actor_email', { length: 255 }).notNull(),
    action: varchar('action', { length: 100 }).notNull(),
    operationStatus: varchar('operation_status', { length: 50 }).notNull().default('SUCCESS'),
    environment: varchar('environment', { length: 50 }).notNull().default('PRODUCTION'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    correlationReference: varchar('correlation_reference', { length: 255 }).notNull(),
    evidenceReference: varchar('evidence_reference', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_int_trace_conn').on(table.connectionId),
    index('idx_int_trace_route').on(table.routeId),
    index('idx_int_trace_status').on(table.operationStatus),
    index('idx_int_trace_occurred').on(table.occurredAt)
  ]
);

export type IntegrationProvider = typeof integrationProviders.$inferSelect;
export type NewIntegrationProvider = typeof integrationProviders.$inferInsert;

export type IntegrationEndpoint = typeof integrationEndpoints.$inferSelect;
export type NewIntegrationEndpoint = typeof integrationEndpoints.$inferInsert;

export type ApiRoute = typeof apiRoutes.$inferSelect;
export type NewApiRoute = typeof apiRoutes.$inferInsert;

export type ApiVersion = typeof apiVersions.$inferSelect;
export type NewApiVersion = typeof apiVersions.$inferInsert;

export type IntegrationConnection = typeof integrationConnections.$inferSelect;
export type NewIntegrationConnection = typeof integrationConnections.$inferInsert;

export type HL7Endpoint = typeof hl7Endpoints.$inferSelect;
export type NewHL7Endpoint = typeof hl7Endpoints.$inferInsert;

export type FHIRCapability = typeof fhirCapabilities.$inferSelect;
export type NewFHIRCapability = typeof fhirCapabilities.$inferInsert;

export type FHIRResourceConfiguration = typeof fhirResourceConfigurations.$inferSelect;
export type NewFHIRResourceConfiguration = typeof fhirResourceConfigurations.$inferInsert;

export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
export type NewWebhookEndpoint = typeof webhookEndpoints.$inferInsert;

export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;

export type ApiRateLimitPolicy = typeof apiRateLimitPolicies.$inferSelect;
export type NewApiRateLimitPolicy = typeof apiRateLimitPolicies.$inferInsert;

export type ApiUsageRecord = typeof apiUsageRecords.$inferSelect;
export type NewApiUsageRecord = typeof apiUsageRecords.$inferInsert;

export type IntegrationHealth = typeof integrationHealth.$inferSelect;
export type NewIntegrationHealth = typeof integrationHealth.$inferInsert;

export type IntegrationIncident = typeof integrationIncidents.$inferSelect;
export type NewIntegrationIncident = typeof integrationIncidents.$inferInsert;

export type IntegrationCredential = typeof integrationCredentials.$inferSelect;
export type NewIntegrationCredential = typeof integrationCredentials.$inferInsert;

export type IntegrationAuditTrace = typeof integrationAuditTraces.$inferSelect;
export type NewIntegrationAuditTrace = typeof integrationAuditTraces.$inferInsert;

/**
 * Phase 1 Domain #13: Platform Projects
 */
export const platformProjects = companySchema.table(
  'platform_projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectCode: varchar('project_code', { length: 100 }).notNull().unique(),
    projectName: varchar('project_name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    repositoryReference: varchar('repository_reference', { length: 255 }).notNull(),
    defaultBranch: varchar('default_branch', { length: 100 }).notNull().default('main'),
    projectType: varchar('project_type', { length: 50 }).notNull().default('MONOREPO'),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_plat_proj_status').on(table.status),
    index('idx_plat_proj_owner').on(table.ownerId),
    index('idx_plat_proj_type').on(table.projectType)
  ]
);

/**
 * Phase 1 Domain #13: Build Pipelines (Turborepo Orchestration)
 */
export const buildPipelines = companySchema.table(
  'build_pipelines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pipelineCode: varchar('pipeline_code', { length: 100 }).notNull().unique(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => platformProjects.id, { onDelete: 'cascade' }),
    pipelineName: varchar('pipeline_name', { length: 255 }).notNull(),
    pipelineType: varchar('pipeline_type', { length: 50 }).notNull().default('BUILD'),
    definitionReference: varchar('definition_reference', { length: 255 }).notNull(),
    triggerType: varchar('trigger_type', { length: 50 }).notNull().default('MANUAL'),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    defaultEnvironment: varchar('default_environment', { length: 50 }).notNull().default('DEVELOPMENT'),
    timeoutSeconds: integer('timeout_seconds').notNull().default(600),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_build_pipe_proj').on(table.projectId),
    index('idx_build_pipe_type').on(table.pipelineType),
    index('idx_build_pipe_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #13: Build Runs
 */
export const buildRuns = companySchema.table(
  'build_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    runCode: varchar('run_code', { length: 100 }).notNull().unique(),
    pipelineId: uuid('pipeline_id')
      .notNull()
      .references(() => buildPipelines.id, { onDelete: 'cascade' }),
    commitReference: varchar('commit_reference', { length: 100 }).notNull(),
    branchReference: varchar('branch_reference', { length: 100 }).notNull().default('main'),
    triggeredById: uuid('triggered_by_id').references(() => users.id, { onDelete: 'set null' }),
    triggeredByEmail: varchar('triggered_by_email', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('QUEUED'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    durationMs: integer('duration_ms'),
    failedTaskCount: integer('failed_task_count').notNull().default(0),
    successfulTaskCount: integer('successful_task_count').notNull().default(0),
    artifactReference: varchar('artifact_reference', { length: 255 }),
    logReference: varchar('log_reference', { length: 255 }),
    environment: varchar('environment', { length: 50 }).notNull().default('DEVELOPMENT'),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_build_runs_pipe').on(table.pipelineId),
    index('idx_build_runs_status').on(table.status),
    index('idx_build_runs_commit').on(table.commitReference),
    index('idx_build_runs_started').on(table.startedAt)
  ]
);

/**
 * Phase 1 Domain #13: CI/CD Pipelines
 */
export const cicdPipelines = companySchema.table(
  'cicd_pipelines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pipelineCode: varchar('pipeline_code', { length: 100 }).notNull().unique(),
    provider: varchar('provider', { length: 50 }).notNull().default('GITHUB_ACTIONS'),
    repositoryReference: varchar('repository_reference', { length: 255 }).notNull(),
    workflowReference: varchar('workflow_reference', { length: 255 }).notNull(),
    triggerPolicy: varchar('trigger_policy', { length: 50 }).notNull().default('ON_PUSH_MAIN'),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    lastRunAt: timestamp('last_run_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_cicd_pipe_prov').on(table.provider),
    index('idx_cicd_pipe_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #13: CI/CD Runs
 */
export const cicdRuns = companySchema.table(
  'cicd_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    runCode: varchar('run_code', { length: 100 }).notNull().unique(),
    pipelineId: uuid('pipeline_id')
      .notNull()
      .references(() => cicdPipelines.id, { onDelete: 'cascade' }),
    commitReference: varchar('commit_reference', { length: 100 }).notNull(),
    branchReference: varchar('branch_reference', { length: 100 }).notNull().default('main'),
    status: varchar('status', { length: 50 }).notNull().default('QUEUED'),
    stage: varchar('stage', { length: 50 }).notNull().default('LINT_AND_TYPECHECK'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    durationMs: integer('duration_ms'),
    runnerReference: varchar('runner_reference', { length: 100 }).notNull().default('TURBO_RUNNER_CLOUD'),
    failureReason: text('failure_reason'),
    artifactReference: varchar('artifact_reference', { length: 255 }),
    deploymentReference: varchar('deployment_reference', { length: 255 }),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_cicd_runs_pipe').on(table.pipelineId),
    index('idx_cicd_runs_status').on(table.status),
    index('idx_cicd_runs_stage').on(table.stage),
    index('idx_cicd_runs_started').on(table.startedAt)
  ]
);

/**
 * Phase 1 Domain #13: Artifact Repositories
 */
export const artifactRepositories = companySchema.table(
  'artifact_repositories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    repositoryCode: varchar('repository_code', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    repositoryType: varchar('repository_type', { length: 50 }).notNull().default('DOCKER_OCI'),
    provider: varchar('provider', { length: 50 }).notNull().default('GHCR_IO'),
    endpointReference: varchar('endpoint_reference', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    retentionPolicyReference: varchar('retention_policy_reference', { length: 100 }).notNull().default('90_DAYS_RETENTION'),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_artifact_repo_type').on(table.repositoryType),
    index('idx_artifact_repo_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #13: Artifacts
 */
export const platformArtifacts = companySchema.table(
  'platform_artifacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    artifactCode: varchar('artifact_code', { length: 100 }).notNull().unique(),
    repositoryId: uuid('repository_id')
      .notNull()
      .references(() => artifactRepositories.id, { onDelete: 'cascade' }),
    packageName: varchar('package_name', { length: 255 }).notNull(),
    version: varchar('version', { length: 50 }).notNull(),
    artifactType: varchar('artifact_type', { length: 50 }).notNull().default('CONTAINER_IMAGE'),
    digest: varchar('digest', { length: 255 }).notNull(),
    sizeBytes: integer('size_bytes').notNull().default(0),
    buildRunId: uuid('build_run_id').references(() => buildRuns.id, { onDelete: 'set null' }),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
    retentionUntil: timestamp('retention_until', { withTimezone: true }),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_artifacts_repo').on(table.repositoryId),
    index('idx_artifacts_pkg').on(table.packageName),
    index('idx_artifacts_status').on(table.status),
    index('idx_artifacts_published').on(table.publishedAt)
  ]
);

/**
 * Phase 1 Domain #13: Platform Environments
 */
export const platformEnvironments = companySchema.table(
  'platform_environments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    environmentCode: varchar('environment_code', { length: 100 }).notNull().unique(),
    environmentName: varchar('environment_name', { length: 255 }).notNull(),
    environmentType: varchar('environment_type', { length: 50 }).notNull().default('DEVELOPMENT'),
    status: varchar('status', { length: 50 }).notNull().default('HEALTHY'),
    regionReference: varchar('region_reference', { length: 100 }).notNull().default('us-east-1'),
    deploymentPolicyReference: varchar('deployment_policy_reference', { length: 100 }).notNull().default('AUTOMATED_PR_PREVIEW'),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_plat_env_type').on(table.environmentType),
    index('idx_plat_env_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #13: Environment Configurations (Reference-Only Secrets)
 */
export const environmentConfigurations = companySchema.table(
  'environment_configurations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    environmentId: uuid('environment_id')
      .notNull()
      .references(() => platformEnvironments.id, { onDelete: 'cascade' }),
    configurationCode: varchar('configuration_code', { length: 100 }).notNull().unique(),
    configurationKey: varchar('configuration_key', { length: 255 }).notNull(),
    valueReference: text('value_reference').notNull(),
    valueType: varchar('value_type', { length: 50 }).notNull().default('STRING'),
    classification: varchar('classification', { length: 50 }).notNull().default('INTERNAL'),
    secretReference: varchar('secret_reference', { length: 255 }), // vault://platform/...
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    lastRotatedAt: timestamp('last_rotated_at', { withTimezone: true }),
    updatedById: uuid('updated_by_id').references(() => users.id, { onDelete: 'set null' }),
    updatedByEmail: varchar('updated_by_email', { length: 255 }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_env_config_env').on(table.environmentId),
    index('idx_env_config_key').on(table.configurationKey),
    index('idx_env_config_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #13: Dependency Nodes
 */
export const dependencyNodes = companySchema.table(
  'dependency_nodes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    nodeCode: varchar('node_code', { length: 100 }).notNull().unique(),
    nodeType: varchar('node_type', { length: 50 }).notNull().default('WORKSPACE_PACKAGE'),
    name: varchar('name', { length: 255 }).notNull(),
    version: varchar('version', { length: 50 }).notNull(),
    repositoryReference: varchar('repository_reference', { length: 255 }),
    status: varchar('status', { length: 50 }).notNull().default('HEALTHY'),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_dep_nodes_type').on(table.nodeType),
    index('idx_dep_nodes_name').on(table.name),
    index('idx_dep_nodes_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #13: Dependency Edges
 */
export const dependencyEdges = companySchema.table(
  'dependency_edges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sourceNodeId: uuid('source_node_id')
      .notNull()
      .references(() => dependencyNodes.id, { onDelete: 'cascade' }),
    targetNodeId: uuid('target_node_id')
      .notNull()
      .references(() => dependencyNodes.id, { onDelete: 'cascade' }),
    dependencyType: varchar('dependency_type', { length: 50 }).notNull().default('RUNTIME'),
    versionConstraint: varchar('version_constraint', { length: 100 }).notNull().default('^1.0.0'),
    isDevDependency: boolean('is_dev_dependency').notNull().default(false),
    status: varchar('status', { length: 50 }).notNull().default('SATISFIED'),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_dep_edges_src').on(table.sourceNodeId),
    index('idx_dep_edges_target').on(table.targetNodeId),
    index('idx_dep_edges_type').on(table.dependencyType)
  ]
);

/**
 * Phase 1 Domain #13: Package Releases
 */
export const packageReleases = companySchema.table(
  'package_releases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    releaseCode: varchar('release_code', { length: 100 }).notNull().unique(),
    packageName: varchar('package_name', { length: 255 }).notNull(),
    version: varchar('version', { length: 50 }).notNull(),
    releaseType: varchar('release_type', { length: 50 }).notNull().default('MINOR'),
    status: varchar('status', { length: 50 }).notNull().default('RELEASED'),
    artifactReference: varchar('artifact_reference', { length: 255 }),
    commitReference: varchar('commit_reference', { length: 100 }).notNull(),
    releaseNotesReference: text('release_notes_reference').notNull(),
    releasedById: uuid('released_by_id').references(() => users.id, { onDelete: 'set null' }),
    releasedByEmail: varchar('released_by_email', { length: 255 }).notNull(),
    releasedAt: timestamp('released_at', { withTimezone: true }).notNull().defaultNow(),
    deprecationDate: timestamp('deprecation_date', { withTimezone: true }),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_pkg_rel_name').on(table.packageName),
    index('idx_pkg_rel_status').on(table.status),
    index('idx_pkg_rel_released_at').on(table.releasedAt)
  ]
);

/**
 * Phase 1 Domain #13: Platform Deployments
 */
export const platformDeployments = companySchema.table(
  'platform_deployments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    deploymentCode: varchar('deployment_code', { length: 100 }).notNull().unique(),
    environmentId: uuid('environment_id')
      .notNull()
      .references(() => platformEnvironments.id, { onDelete: 'cascade' }),
    artifactReference: varchar('artifact_reference', { length: 255 }).notNull(),
    releaseReference: varchar('release_reference', { length: 100 }),
    commitReference: varchar('commit_reference', { length: 100 }).notNull(),
    deploymentStrategy: varchar('deployment_strategy', { length: 50 }).notNull().default('ROLLING'),
    status: varchar('status', { length: 50 }).notNull().default('DEPLOYED'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    deployedById: uuid('deployed_by_id').references(() => users.id, { onDelete: 'set null' }),
    deployedByEmail: varchar('deployed_by_email', { length: 255 }).notNull(),
    rollbackReference: varchar('rollback_reference', { length: 100 }),
    failureReason: text('failure_reason'),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_plat_dep_env').on(table.environmentId),
    index('idx_plat_dep_status').on(table.status),
    index('idx_plat_dep_started').on(table.startedAt)
  ]
);

/**
 * Phase 1 Domain #13: Developer Experience Metrics
 */
export const developerExperienceMetrics = companySchema.table(
  'developer_experience_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    metricType: varchar('metric_type', { length: 100 }).notNull(),
    metricName: varchar('metric_name', { length: 255 }).notNull(),
    numericValue: integer('numeric_value').notNull().default(0),
    unit: varchar('unit', { length: 50 }).notNull().default('MS'),
    evaluationPeriod: varchar('evaluation_period', { length: 100 }).notNull().default('LAST_7_DAYS'),
    sourceStatus: varchar('source_status', { length: 50 }).notNull().default('PENDING_TELEMETRY_PIPELINE'),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_devex_type').on(table.metricType),
    index('idx_devex_recorded').on(table.recordedAt)
  ]
);

/**
 * Phase 1 Domain #13: Platform Incidents
 */
export const platformIncidents = companySchema.table(
  'platform_incidents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    incidentCode: varchar('incident_code', { length: 100 }).notNull().unique(),
    category: varchar('category', { length: 100 }).notNull(),
    severity: varchar('severity', { length: 50 }).notNull().default('MEDIUM'),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    source: varchar('source', { length: 100 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('OPEN'),
    assignedToId: uuid('assigned_to_id').references(() => users.id, { onDelete: 'set null' }),
    assignedToEmail: varchar('assigned_to_email', { length: 255 }),
    detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolutionNotes: text('resolution_notes'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_plat_inc_sev').on(table.severity),
    index('idx_plat_inc_status').on(table.status),
    index('idx_plat_inc_detected').on(table.detectedAt)
  ]
);

/**
 * Phase 1 Domain #13: Platform Audit Traces
 */
export const platformAuditTraces = companySchema.table(
  'platform_audit_traces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    traceId: varchar('trace_id', { length: 100 }).notNull().unique(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    actorEmail: varchar('actor_email', { length: 255 }).notNull(),
    action: varchar('action', { length: 100 }).notNull(),
    resourceReference: varchar('resource_reference', { length: 255 }).notNull(),
    environment: varchar('environment', { length: 50 }).notNull().default('DEVELOPMENT'),
    operationStatus: varchar('operation_status', { length: 50 }).notNull().default('SUCCESS'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    correlationReference: varchar('correlation_reference', { length: 255 }).notNull(),
    evidenceReference: varchar('evidence_reference', { length: 255 }).notNull(),
    reason: text('reason').notNull(),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_plat_trace_actor').on(table.actorEmail),
    index('idx_plat_trace_status').on(table.operationStatus),
    index('idx_plat_trace_occurred').on(table.occurredAt)
  ]
);

export type PlatformProject = typeof platformProjects.$inferSelect;
export type NewPlatformProject = typeof platformProjects.$inferInsert;

export type BuildPipeline = typeof buildPipelines.$inferSelect;
export type NewBuildPipeline = typeof buildPipelines.$inferInsert;

export type BuildRun = typeof buildRuns.$inferSelect;
export type NewBuildRun = typeof buildRuns.$inferInsert;

export type CICDPipeline = typeof cicdPipelines.$inferSelect;
export type NewCICDPipeline = typeof cicdPipelines.$inferInsert;

export type CICDRun = typeof cicdRuns.$inferSelect;
export type NewCICDRun = typeof cicdRuns.$inferInsert;

export type ArtifactRepository = typeof artifactRepositories.$inferSelect;
export type NewArtifactRepository = typeof artifactRepositories.$inferInsert;

export type PlatformArtifact = typeof platformArtifacts.$inferSelect;
export type NewPlatformArtifact = typeof platformArtifacts.$inferInsert;

export type PlatformEnvironment = typeof platformEnvironments.$inferSelect;
export type NewPlatformEnvironment = typeof platformEnvironments.$inferInsert;

export type EnvironmentConfiguration = typeof environmentConfigurations.$inferSelect;
export type NewEnvironmentConfiguration = typeof environmentConfigurations.$inferInsert;

export type DependencyNode = typeof dependencyNodes.$inferSelect;
export type NewDependencyNode = typeof dependencyNodes.$inferInsert;

export type DependencyEdge = typeof dependencyEdges.$inferSelect;
export type NewDependencyEdge = typeof dependencyEdges.$inferInsert;

export type PackageRelease = typeof packageReleases.$inferSelect;
export type NewPackageRelease = typeof packageReleases.$inferInsert;

export type PlatformDeployment = typeof platformDeployments.$inferSelect;
export type NewPlatformDeployment = typeof platformDeployments.$inferInsert;

export type DeveloperExperienceMetric = typeof developerExperienceMetrics.$inferSelect;
export type NewDeveloperExperienceMetric = typeof developerExperienceMetrics.$inferInsert;

export type PlatformIncident = typeof platformIncidents.$inferSelect;
export type NewPlatformIncident = typeof platformIncidents.$inferInsert;

export type PlatformAuditTrace = typeof platformAuditTraces.$inferSelect;
export type NewPlatformAuditTrace = typeof platformAuditTraces.$inferInsert;

/**
 * Phase 1 Domain #14: Infrastructure Projects
 */
export const infrastructureProjects = companySchema.table(
  'infrastructure_projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectCode: varchar('project_code', { length: 100 }).notNull().unique(),
    projectName: varchar('project_name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    projectType: varchar('project_type', { length: 50 }).notNull().default('PLATFORM'),
    repositoryReference: varchar('repository_reference', { length: 255 }).notNull(),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_infra_proj_status').on(table.status),
    index('idx_infra_proj_owner').on(table.ownerId),
    index('idx_infra_proj_type').on(table.projectType)
  ]
);

/**
 * Phase 1 Domain #14: Infrastructure Regions
 */
export const infrastructureRegions = companySchema.table(
  'infrastructure_regions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    regionCode: varchar('region_code', { length: 100 }).notNull().unique(),
    regionName: varchar('region_name', { length: 255 }).notNull(),
    provider: varchar('provider', { length: 50 }).notNull().default('AWS'),
    geographicReference: varchar('geographic_reference', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    isPrimary: boolean('is_primary').notNull().default(false),
    isDrRegion: boolean('is_dr_region').notNull().default(false),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_infra_reg_provider').on(table.provider),
    index('idx_infra_reg_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #14: Infrastructure Clusters
 */
export const infrastructureClusters = companySchema.table(
  'infrastructure_clusters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clusterCode: varchar('cluster_code', { length: 100 }).notNull().unique(),
    clusterName: varchar('cluster_name', { length: 255 }).notNull(),
    provider: varchar('provider', { length: 50 }).notNull().default('AWS_EKS'),
    regionId: uuid('region_id')
      .notNull()
      .references(() => infrastructureRegions.id, { onDelete: 'cascade' }),
    environment: varchar('environment', { length: 50 }).notNull().default('PRODUCTION'),
    clusterType: varchar('cluster_type', { length: 50 }).notNull().default('APPLICATION'),
    orchestrationType: varchar('orchestration_type', { length: 50 }).notNull().default('KUBERNETES'),
    status: varchar('status', { length: 50 }).notNull().default('HEALTHY'),
    nodeCount: integer('node_count').notNull().default(0),
    versionReference: varchar('version_reference', { length: 100 }).notNull(),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_infra_cluster_reg').on(table.regionId),
    index('idx_infra_cluster_env').on(table.environment),
    index('idx_infra_cluster_type').on(table.clusterType),
    index('idx_infra_cluster_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #14: Infrastructure Nodes
 */
export const infrastructureNodes = companySchema.table(
  'infrastructure_nodes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    nodeCode: varchar('node_code', { length: 100 }).notNull().unique(),
    clusterId: uuid('cluster_id')
      .notNull()
      .references(() => infrastructureClusters.id, { onDelete: 'cascade' }),
    nodeName: varchar('node_name', { length: 255 }).notNull(),
    nodeType: varchar('node_type', { length: 50 }).notNull().default('COMPUTE'),
    instanceReference: varchar('instance_reference', { length: 100 }).notNull(),
    cpuCapacity: varchar('cpu_capacity', { length: 50 }).notNull(),
    memoryCapacity: varchar('memory_capacity', { length: 50 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('READY'),
    availabilityZoneReference: varchar('availability_zone_reference', { length: 100 }).notNull(),
    environment: varchar('environment', { length: 50 }).notNull().default('PRODUCTION'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_infra_node_cluster').on(table.clusterId),
    index('idx_infra_node_type').on(table.nodeType),
    index('idx_infra_node_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #14: Infrastructure Services
 */
export const infrastructureServices = companySchema.table(
  'infrastructure_services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceCode: varchar('service_code', { length: 100 }).notNull().unique(),
    serviceName: varchar('service_name', { length: 255 }).notNull(),
    serviceType: varchar('service_type', { length: 50 }).notNull().default('API'),
    clusterId: uuid('cluster_id')
      .notNull()
      .references(() => infrastructureClusters.id, { onDelete: 'cascade' }),
    environment: varchar('environment', { length: 50 }).notNull().default('PRODUCTION'),
    status: varchar('status', { length: 50 }).notNull().default('RUNNING'),
    healthStatus: varchar('health_status', { length: 50 }).notNull().default('PENDING_TELEMETRY_PIPELINE'),
    versionReference: varchar('version_reference', { length: 100 }).notNull(),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_infra_svc_cluster').on(table.clusterId),
    index('idx_infra_svc_type').on(table.serviceType),
    index('idx_infra_svc_status').on(table.status),
    index('idx_infra_svc_health').on(table.healthStatus)
  ]
);

/**
 * Phase 1 Domain #14: Backup Policies
 */
export const backupPolicies = companySchema.table(
  'backup_policies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    policyCode: varchar('policy_code', { length: 100 }).notNull().unique(),
    policyName: varchar('policy_name', { length: 255 }).notNull(),
    resourceType: varchar('resource_type', { length: 100 }).notNull().default('POSTGRESQL_CLUSTER'),
    scheduleReference: varchar('schedule_reference', { length: 100 }).notNull(),
    retentionDays: integer('retention_days').notNull().default(30),
    retentionPolicy: varchar('retention_policy', { length: 100 }).notNull().default('30_DAYS_IMMUTABLE'),
    encryptionReference: varchar('encryption_reference', { length: 255 }).notNull(),
    crossRegionEnabled: boolean('cross_region_enabled').notNull().default(true),
    immutableBackupEnabled: boolean('immutable_backup_enabled').notNull().default(true),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_backup_pol_type').on(table.resourceType),
    index('idx_backup_pol_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #14: Infrastructure Databases
 */
export const infrastructureDatabases = companySchema.table(
  'infrastructure_databases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    databaseCode: varchar('database_code', { length: 100 }).notNull().unique(),
    databaseName: varchar('database_name', { length: 255 }).notNull(),
    databaseType: varchar('database_type', { length: 50 }).notNull().default('POSTGRESQL'),
    clusterId: uuid('cluster_id').references(() => infrastructureClusters.id, { onDelete: 'set null' }),
    regionId: uuid('region_id')
      .notNull()
      .references(() => infrastructureRegions.id, { onDelete: 'cascade' }),
    environment: varchar('environment', { length: 50 }).notNull().default('PRODUCTION'),
    status: varchar('status', { length: 50 }).notNull().default('ONLINE'),
    engineVersion: varchar('engine_version', { length: 100 }).notNull(),
    replicationMode: varchar('replication_mode', { length: 50 }).notNull().default('PRIMARY_REPLICA'),
    backupPolicyId: uuid('backup_policy_id').references(() => backupPolicies.id, { onDelete: 'set null' }),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_infra_db_reg').on(table.regionId),
    index('idx_infra_db_type').on(table.databaseType),
    index('idx_infra_db_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #14: Database Connection Pools
 */
export const databaseConnectionPools = companySchema.table(
  'database_connection_pools',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    poolCode: varchar('pool_code', { length: 100 }).notNull().unique(),
    databaseId: uuid('database_id')
      .notNull()
      .references(() => infrastructureDatabases.id, { onDelete: 'cascade' }),
    environment: varchar('environment', { length: 50 }).notNull().default('PRODUCTION'),
    maxConnections: integer('max_connections').notNull().default(100),
    activeConnections: integer('active_connections').notNull().default(0),
    idleConnections: integer('idle_connections').notNull().default(0),
    waitingConnections: integer('waiting_connections').notNull().default(0),
    connectionTimeoutMs: integer('connection_timeout_ms').notNull().default(5000),
    status: varchar('status', { length: 50 }).notNull().default('HEALTHY'),
    lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_db_pool_db').on(table.databaseId),
    index('idx_db_pool_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #14: Infrastructure Replication Links
 */
export const infrastructureReplicationLinks = companySchema.table(
  'infrastructure_replication_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    replicationCode: varchar('replication_code', { length: 100 }).notNull().unique(),
    sourceRegionId: uuid('source_region_id')
      .notNull()
      .references(() => infrastructureRegions.id, { onDelete: 'cascade' }),
    targetRegionId: uuid('target_region_id')
      .notNull()
      .references(() => infrastructureRegions.id, { onDelete: 'cascade' }),
    sourceDatabaseId: uuid('source_database_id')
      .notNull()
      .references(() => infrastructureDatabases.id, { onDelete: 'cascade' }),
    targetDatabaseId: uuid('target_database_id')
      .notNull()
      .references(() => infrastructureDatabases.id, { onDelete: 'cascade' }),
    replicationMode: varchar('replication_mode', { length: 50 }).notNull().default('PRIMARY_REPLICA'),
    status: varchar('status', { length: 50 }).notNull().default('HEALTHY'),
    lagReference: varchar('lag_reference', { length: 100 }).notNull().default('0s (Synchronous Multi-AZ)'),
    lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }).notNull().defaultNow(),
    failureCount: integer('failure_count').notNull().default(0),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_infra_repl_src').on(table.sourceDatabaseId),
    index('idx_infra_repl_target').on(table.targetDatabaseId),
    index('idx_infra_repl_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #14: Infrastructure Health Snapshots
 */
export const infrastructureHealthSnapshots = companySchema.table(
  'infrastructure_health_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    resourceType: varchar('resource_type', { length: 100 }).notNull(),
    resourceReference: varchar('resource_reference', { length: 255 }).notNull(),
    environment: varchar('environment', { length: 50 }).notNull().default('PRODUCTION'),
    healthStatus: varchar('health_status', { length: 50 }).notNull().default('PENDING_TELEMETRY_PIPELINE'),
    availabilityStatus: varchar('availability_status', { length: 100 }).notNull().default('TELEMETRY_PENDING'),
    cpuUtilizationReference: varchar('cpu_utilization_reference', { length: 100 }).notNull().default('N/A (Preview)'),
    memoryUtilizationReference: varchar('memory_utilization_reference', { length: 100 }).notNull().default('N/A (Preview)'),
    latencyReference: varchar('latency_reference', { length: 100 }).notNull().default('N/A (Preview)'),
    errorRateReference: varchar('error_rate_reference', { length: 100 }).notNull().default('0.00%'),
    checkedAt: timestamp('checked_at', { withTimezone: true }).notNull().defaultNow(),
    checkSource: varchar('check_source', { length: 100 }).notNull().default('INFRA_CONTROLLER'),
    sourceStatus: varchar('source_status', { length: 50 }).notNull().default('PENDING_TELEMETRY_PIPELINE'),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_infra_health_res').on(table.resourceReference),
    index('idx_infra_health_status').on(table.healthStatus),
    index('idx_infra_health_checked').on(table.checkedAt)
  ]
);

/**
 * Phase 1 Domain #14: Infrastructure Alerts
 */
export const infrastructureAlerts = companySchema.table(
  'infrastructure_alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    alertCode: varchar('alert_code', { length: 100 }).notNull().unique(),
    resourceType: varchar('resource_type', { length: 100 }).notNull(),
    resourceReference: varchar('resource_reference', { length: 255 }).notNull(),
    severity: varchar('severity', { length: 50 }).notNull().default('MEDIUM'),
    alertType: varchar('alert_type', { length: 100 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('OPEN'),
    detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    assignedToId: uuid('assigned_to_id').references(() => users.id, { onDelete: 'set null' }),
    assignedToEmail: varchar('assigned_to_email', { length: 255 }),
    resolutionNotes: text('resolution_notes'),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_infra_alert_sev').on(table.severity),
    index('idx_infra_alert_status').on(table.status),
    index('idx_infra_alert_detected').on(table.detectedAt)
  ]
);

/**
 * Phase 1 Domain #14: Infrastructure Incidents
 */
export const infrastructureIncidents = companySchema.table(
  'infrastructure_incidents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    incidentCode: varchar('incident_code', { length: 100 }).notNull().unique(),
    category: varchar('category', { length: 100 }).notNull(),
    severity: varchar('severity', { length: 50 }).notNull().default('HIGH'),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    source: varchar('source', { length: 100 }).notNull(),
    environment: varchar('environment', { length: 50 }).notNull().default('PRODUCTION'),
    resourceReference: varchar('resource_reference', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('OPEN'),
    assignedToId: uuid('assigned_to_id').references(() => users.id, { onDelete: 'set null' }),
    assignedToEmail: varchar('assigned_to_email', { length: 255 }),
    detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    containedAt: timestamp('contained_at', { withTimezone: true }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolutionNotes: text('resolution_notes'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_infra_inc_sev').on(table.severity),
    index('idx_infra_inc_status').on(table.status),
    index('idx_infra_inc_cat').on(table.category),
    index('idx_infra_inc_detected').on(table.detectedAt)
  ]
);

/**
 * Phase 1 Domain #14: Backup Records
 */
export const backupRecords = companySchema.table(
  'backup_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    backupCode: varchar('backup_code', { length: 100 }).notNull().unique(),
    policyId: uuid('policy_id')
      .notNull()
      .references(() => backupPolicies.id, { onDelete: 'cascade' }),
    resourceReference: varchar('resource_reference', { length: 255 }).notNull(),
    environment: varchar('environment', { length: 50 }).notNull().default('PRODUCTION'),
    backupType: varchar('backup_type', { length: 50 }).notNull().default('FULL'),
    status: varchar('status', { length: 50 }).notNull().default('SUCCEEDED'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    sizeReference: varchar('size_reference', { length: 100 }).notNull().default('42.8 GB'),
    storageReference: varchar('storage_reference', { length: 255 }).notNull(),
    checksumReference: varchar('checksum_reference', { length: 255 }).notNull(),
    retentionUntil: timestamp('retention_until', { withTimezone: true }).notNull(),
    verificationStatus: varchar('verification_status', { length: 50 }).notNull().default('VERIFIED'),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_backup_rec_policy').on(table.policyId),
    index('idx_backup_rec_status').on(table.status),
    index('idx_backup_rec_started').on(table.startedAt)
  ]
);

/**
 * Phase 1 Domain #14: Restore Verifications
 */
export const restoreVerifications = companySchema.table(
  'restore_verifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    verificationCode: varchar('verification_code', { length: 100 }).notNull().unique(),
    backupId: uuid('backup_id')
      .notNull()
      .references(() => backupRecords.id, { onDelete: 'cascade' }),
    targetEnvironment: varchar('target_environment', { length: 50 }).notNull().default('DISASTER_RECOVERY'),
    verificationType: varchar('verification_type', { length: 50 }).notNull().default('AUTOMATED'),
    status: varchar('status', { length: 50 }).notNull().default('PASSED'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    verifiedById: uuid('verified_by_id').references(() => users.id, { onDelete: 'set null' }),
    verifiedByEmail: varchar('verified_by_email', { length: 255 }).notNull(),
    evidenceReference: varchar('evidence_reference', { length: 255 }).notNull(),
    notes: text('notes'),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_rest_verif_backup').on(table.backupId),
    index('idx_rest_verif_status').on(table.status),
    index('idx_rest_verif_started').on(table.startedAt)
  ]
);

/**
 * Phase 1 Domain #14: Disaster Recovery Plans
 */
export const disasterRecoveryPlans = companySchema.table(
  'disaster_recovery_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    planCode: varchar('plan_code', { length: 100 }).notNull().unique(),
    planName: varchar('plan_name', { length: 255 }).notNull(),
    scope: varchar('scope', { length: 255 }).notNull(),
    primaryRegionId: uuid('primary_region_id')
      .notNull()
      .references(() => infrastructureRegions.id, { onDelete: 'cascade' }),
    drRegionId: uuid('dr_region_id')
      .notNull()
      .references(() => infrastructureRegions.id, { onDelete: 'cascade' }),
    rtoMinutes: integer('rto_minutes').notNull().default(15),
    rpoMinutes: integer('rpo_minutes').notNull().default(5),
    failoverStrategy: varchar('failover_strategy', { length: 50 }).notNull().default('SEMI_AUTOMATED'),
    runbookReference: varchar('runbook_reference', { length: 255 }).notNull(),
    lastReviewedAt: timestamp('last_reviewed_at', { withTimezone: true }).notNull().defaultNow(),
    nextReviewDue: timestamp('next_review_due', { withTimezone: true }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_dr_plan_status').on(table.status),
    index('idx_dr_plan_primary').on(table.primaryRegionId),
    index('idx_dr_plan_dr').on(table.drRegionId)
  ]
);

/**
 * Phase 1 Domain #14: Disaster Recovery Drills
 */
export const disasterRecoveryDrills = companySchema.table(
  'disaster_recovery_drills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    drillCode: varchar('drill_code', { length: 100 }).notNull().unique(),
    planId: uuid('plan_id')
      .notNull()
      .references(() => disasterRecoveryPlans.id, { onDelete: 'cascade' }),
    drillType: varchar('drill_type', { length: 50 }).notNull().default('FAILOVER_SIMULATION'),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    status: varchar('status', { length: 50 }).notNull().default('COMPLETED'),
    expectedRtoMinutes: integer('expected_rto_minutes').notNull().default(15),
    actualRtoMinutesReference: varchar('actual_rto_minutes_reference', { length: 100 }),
    expectedRpoMinutes: integer('expected_rpo_minutes').notNull().default(5),
    actualRpoReference: varchar('actual_rpo_reference', { length: 100 }),
    result: varchar('result', { length: 50 }).notNull().default('PASSED'),
    findingsReference: text('findings_reference'),
    evidenceReference: varchar('evidence_reference', { length: 255 }),
    conductedById: uuid('conducted_by_id').references(() => users.id, { onDelete: 'set null' }),
    conductedByEmail: varchar('conducted_by_email', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_dr_drill_plan').on(table.planId),
    index('idx_dr_drill_status').on(table.status),
    index('idx_dr_drill_result').on(table.result),
    index('idx_dr_drill_scheduled').on(table.scheduledAt)
  ]
);

/**
 * Phase 1 Domain #14: Failover Events
 */
export const failoverEvents = companySchema.table(
  'failover_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    failoverCode: varchar('failover_code', { length: 100 }).notNull().unique(),
    planId: uuid('plan_id')
      .notNull()
      .references(() => disasterRecoveryPlans.id, { onDelete: 'cascade' }),
    sourceRegionId: uuid('source_region_id')
      .notNull()
      .references(() => infrastructureRegions.id, { onDelete: 'cascade' }),
    targetRegionId: uuid('target_region_id')
      .notNull()
      .references(() => infrastructureRegions.id, { onDelete: 'cascade' }),
    environment: varchar('environment', { length: 50 }).notNull().default('PRODUCTION'),
    triggerType: varchar('trigger_type', { length: 50 }).notNull().default('DRILL'),
    status: varchar('status', { length: 50 }).notNull().default('COMPLETED'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    initiatedById: uuid('initiated_by_id').references(() => users.id, { onDelete: 'set null' }),
    initiatedByEmail: varchar('initiated_by_email', { length: 255 }).notNull(),
    rollbackReference: varchar('rollback_reference', { length: 100 }),
    reason: text('reason').notNull(),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_failover_plan').on(table.planId),
    index('idx_failover_status').on(table.status),
    index('idx_failover_started').on(table.startedAt)
  ]
);

/**
 * Phase 1 Domain #14: Infrastructure Audit Traces
 */
export const infrastructureAuditTraces = companySchema.table(
  'infrastructure_audit_traces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    traceId: varchar('trace_id', { length: 100 }).notNull().unique(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    actorEmail: varchar('actor_email', { length: 255 }).notNull(),
    action: varchar('action', { length: 100 }).notNull(),
    resourceReference: varchar('resource_reference', { length: 255 }).notNull(),
    environment: varchar('environment', { length: 50 }).notNull().default('PRODUCTION'),
    operationStatus: varchar('operation_status', { length: 50 }).notNull().default('SUCCESS'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    correlationReference: varchar('correlation_reference', { length: 255 }).notNull(),
    evidenceReference: varchar('evidence_reference', { length: 255 }).notNull(),
    reason: text('reason').notNull(),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_infra_trace_actor').on(table.actorEmail),
    index('idx_infra_trace_status').on(table.operationStatus),
    index('idx_infra_trace_occurred').on(table.occurredAt)
  ]
);

export type InfrastructureProject = typeof infrastructureProjects.$inferSelect;
export type NewInfrastructureProject = typeof infrastructureProjects.$inferInsert;

export type InfrastructureRegion = typeof infrastructureRegions.$inferSelect;
export type NewInfrastructureRegion = typeof infrastructureRegions.$inferInsert;

export type InfrastructureCluster = typeof infrastructureClusters.$inferSelect;
export type NewInfrastructureCluster = typeof infrastructureClusters.$inferInsert;

export type InfrastructureNode = typeof infrastructureNodes.$inferSelect;
export type NewInfrastructureNode = typeof infrastructureNodes.$inferInsert;

export type InfrastructureService = typeof infrastructureServices.$inferSelect;
export type NewInfrastructureService = typeof infrastructureServices.$inferInsert;

export type BackupPolicy = typeof backupPolicies.$inferSelect;
export type NewBackupPolicy = typeof backupPolicies.$inferInsert;

export type InfrastructureDatabase = typeof infrastructureDatabases.$inferSelect;
export type NewInfrastructureDatabase = typeof infrastructureDatabases.$inferInsert;

export type DatabaseConnectionPool = typeof databaseConnectionPools.$inferSelect;
export type NewDatabaseConnectionPool = typeof databaseConnectionPools.$inferInsert;

export type InfrastructureReplicationLink = typeof infrastructureReplicationLinks.$inferSelect;
export type NewInfrastructureReplicationLink = typeof infrastructureReplicationLinks.$inferInsert;

export type InfrastructureHealthSnapshot = typeof infrastructureHealthSnapshots.$inferSelect;
export type NewInfrastructureHealthSnapshot = typeof infrastructureHealthSnapshots.$inferInsert;

export type InfrastructureAlert = typeof infrastructureAlerts.$inferSelect;
export type NewInfrastructureAlert = typeof infrastructureAlerts.$inferInsert;

export type InfrastructureIncident = typeof infrastructureIncidents.$inferSelect;
export type NewInfrastructureIncident = typeof infrastructureIncidents.$inferInsert;

export type BackupRecord = typeof backupRecords.$inferSelect;
export type NewBackupRecord = typeof backupRecords.$inferInsert;

export type RestoreVerification = typeof restoreVerifications.$inferSelect;
export type NewRestoreVerification = typeof restoreVerifications.$inferInsert;

export type DisasterRecoveryPlan = typeof disasterRecoveryPlans.$inferSelect;
export type NewDisasterRecoveryPlan = typeof disasterRecoveryPlans.$inferInsert;

export type DisasterRecoveryDrill = typeof disasterRecoveryDrills.$inferSelect;
export type NewDisasterRecoveryDrill = typeof disasterRecoveryDrills.$inferInsert;

export type FailoverEvent = typeof failoverEvents.$inferSelect;
export type NewFailoverEvent = typeof failoverEvents.$inferInsert;

export type InfrastructureAuditTrace = typeof infrastructureAuditTraces.$inferSelect;
export type NewInfrastructureAuditTrace = typeof infrastructureAuditTraces.$inferInsert;

/**
 * Phase 1 Domain #15: Legal Entities
 */
export const legalEntities = companySchema.table(
  'legal_entities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entityCode: varchar('entity_code', { length: 100 }).notNull().unique(),
    entityName: varchar('entity_name', { length: 255 }).notNull(),
    entityType: varchar('entity_type', { length: 50 }).notNull().default('C_CORP'),
    jurisdiction: varchar('jurisdiction', { length: 100 }).notNull(),
    registrationNumber: varchar('registration_number', { length: 100 }).notNull(),
    incorporationDate: timestamp('incorporation_date', { withTimezone: true }).notNull(),
    taxIdentifierReference: varchar('tax_identifier_reference', { length: 100 }).notNull(),
    registeredAddress: text('registered_address').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    parentEntityId: uuid('parent_entity_id').references((): AnyPgColumn => legalEntities.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_legal_entities_type').on(table.entityType),
    index('idx_legal_entities_status').on(table.status),
    index('idx_legal_entities_parent').on(table.parentEntityId)
  ]
);

/**
 * Phase 1 Domain #15: Departments
 */
export const departments = companySchema.table(
  'departments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    departmentCode: varchar('department_code', { length: 100 }).notNull().unique(),
    departmentName: varchar('department_name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    costCenterCode: varchar('cost_center_code', { length: 50 }).notNull(),
    legalEntityId: uuid('legal_entity_id')
      .notNull()
      .references(() => legalEntities.id, { onDelete: 'cascade' }),
    parentDepartmentId: uuid('parent_department_id').references((): AnyPgColumn => departments.id, { onDelete: 'set null' }),
    leadEmployeeId: uuid('lead_employee_id'),
    leadEmail: varchar('lead_email', { length: 255 }),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_departments_entity').on(table.legalEntityId),
    index('idx_departments_status').on(table.status),
    index('idx_departments_cost_center').on(table.costCenterCode)
  ]
);

/**
 * Phase 1 Domain #15: Designations
 */
export const designations = companySchema.table(
  'designations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    designationCode: varchar('designation_code', { length: 100 }).notNull().unique(),
    title: varchar('title', { length: 255 }).notNull(),
    bandLevel: varchar('band_level', { length: 50 }).notNull().default('MID'),
    departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'set null' }),
    jobFamily: varchar('job_family', { length: 100 }).notNull(),
    isExecutive: boolean('is_executive').notNull().default(false),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_designations_band').on(table.bandLevel),
    index('idx_designations_dept').on(table.departmentId),
    index('idx_designations_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #15: Internal Employees
 */
export const internalEmployees = companySchema.table(
  'internal_employees',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    employeeCode: varchar('employee_code', { length: 100 }).notNull().unique(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    workEmail: varchar('work_email', { length: 255 }).notNull().unique(),
    legalEntityId: uuid('legal_entity_id')
      .notNull()
      .references(() => legalEntities.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id')
      .notNull()
      .references(() => departments.id, { onDelete: 'cascade' }),
    designationId: uuid('designation_id')
      .notNull()
      .references(() => designations.id, { onDelete: 'cascade' }),
    managerEmployeeId: uuid('manager_employee_id').references((): AnyPgColumn => internalEmployees.id, { onDelete: 'set null' }),
    employmentType: varchar('employment_type', { length: 50 }).notNull().default('FULL_TIME'),
    employmentStatus: varchar('employment_status', { length: 50 }).notNull().default('ACTIVE'),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_emp_legal_entity').on(table.legalEntityId),
    index('idx_emp_department').on(table.departmentId),
    index('idx_emp_designation').on(table.designationId),
    index('idx_emp_status').on(table.employmentStatus)
  ]
);

/**
 * Phase 1 Domain #15: Board Members
 */
export const boardMembers = companySchema.table(
  'board_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberCode: varchar('member_code', { length: 100 }).notNull().unique(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    roleType: varchar('role_type', { length: 50 }).notNull().default('INDEPENDENT_DIRECTOR'),
    representingEntity: varchar('representing_entity', { length: 255 }).notNull(),
    votingStatus: varchar('voting_status', { length: 50 }).notNull().default('VOTING'),
    termStartDate: timestamp('term_start_date', { withTimezone: true }).notNull(),
    termEndDate: timestamp('term_end_date', { withTimezone: true }),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_board_member_role').on(table.roleType),
    index('idx_board_member_status').on(table.status),
    index('idx_board_member_voting').on(table.votingStatus)
  ]
);

/**
 * Phase 1 Domain #15: Governance Committees
 */
export const governanceCommittees = companySchema.table(
  'governance_committees',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    committeeCode: varchar('committee_code', { length: 100 }).notNull().unique(),
    committeeName: varchar('committee_name', { length: 255 }).notNull(),
    committeeType: varchar('committee_type', { length: 50 }).notNull().default('AUDIT'),
    chairPersonId: uuid('chair_person_id'),
    chairEmail: varchar('chair_email', { length: 255 }).notNull(),
    charterReference: varchar('charter_reference', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_gov_comm_type').on(table.committeeType),
    index('idx_gov_comm_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #15: Committee Memberships
 */
export const committeeMemberships = companySchema.table(
  'committee_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    committeeId: uuid('committee_id')
      .notNull()
      .references(() => governanceCommittees.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id'),
    memberType: varchar('member_type', { length: 50 }).notNull().default('BOARD_MEMBER'),
    memberName: varchar('member_name', { length: 255 }).notNull(),
    memberEmail: varchar('member_email', { length: 255 }).notNull(),
    roleInCommittee: varchar('role_in_committee', { length: 50 }).notNull().default('REGULAR_MEMBER'),
    joinedDate: timestamp('joined_date', { withTimezone: true }).notNull().defaultNow(),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_comm_member_comm').on(table.committeeId),
    index('idx_comm_member_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #15: Corporate Policies
 */
export const corporatePolicies = companySchema.table(
  'corporate_policies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    policyCode: varchar('policy_code', { length: 100 }).notNull().unique(),
    title: varchar('title', { length: 255 }).notNull(),
    category: varchar('category', { length: 50 }).notNull().default('BYLAWS'),
    versionReference: varchar('version_reference', { length: 50 }).notNull().default('1.0.0'),
    legalEntityId: uuid('legal_entity_id').references(() => legalEntities.id, { onDelete: 'set null' }),
    approvedByBoardAt: timestamp('approved_by_board_at', { withTimezone: true }),
    reviewCycleMonths: integer('review_cycle_months').notNull().default(12),
    nextReviewDue: timestamp('next_review_due', { withTimezone: true }).notNull(),
    documentReference: varchar('document_reference', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_corp_policy_cat').on(table.category),
    index('idx_corp_policy_status').on(table.status),
    index('idx_corp_policy_review').on(table.nextReviewDue)
  ]
);

/**
 * Phase 1 Domain #15: Compliance Officers
 */
export const complianceOfficers = companySchema.table(
  'compliance_officers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    officerCode: varchar('officer_code', { length: 100 }).notNull().unique(),
    officerRole: varchar('officer_role', { length: 50 }).notNull().default('HIPAA_PRIVACY_OFFICER'),
    employeeId: uuid('employee_id').references(() => internalEmployees.id, { onDelete: 'set null' }),
    officerName: varchar('officer_name', { length: 255 }).notNull(),
    workEmail: varchar('work_email', { length: 255 }).notNull(),
    appointmentDate: timestamp('appointment_date', { withTimezone: true }).notNull().defaultNow(),
    regulatoryAuthorityReference: varchar('regulatory_authority_reference', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_comp_officer_role').on(table.officerRole),
    index('idx_comp_officer_status').on(table.status)
  ]
);

/**
 * Phase 1 Domain #15: Governance Events
 */
export const governanceEvents = companySchema.table(
  'governance_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventCode: varchar('event_code', { length: 100 }).notNull().unique(),
    eventType: varchar('event_type', { length: 50 }).notNull().default('BOARD_MEETING'),
    title: varchar('title', { length: 255 }).notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    organizerEmail: varchar('organizer_email', { length: 255 }).notNull(),
    minutesReference: varchar('minutes_reference', { length: 255 }),
    resolutionReference: varchar('resolution_reference', { length: 255 }),
    status: varchar('status', { length: 50 }).notNull().default('SCHEDULED'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_gov_event_type').on(table.eventType),
    index('idx_gov_event_status').on(table.status),
    index('idx_gov_event_scheduled').on(table.scheduledAt)
  ]
);

/**
 * Phase 1 Domain #15: Company Audit Traces
 */
export const companyAuditTraces = companySchema.table(
  'company_audit_traces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    traceId: varchar('trace_id', { length: 100 }).notNull().unique(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    actorEmail: varchar('actor_email', { length: 255 }).notNull(),
    action: varchar('action', { length: 100 }).notNull(),
    entityReference: varchar('entity_reference', { length: 255 }).notNull(),
    operationStatus: varchar('operation_status', { length: 50 }).notNull().default('SUCCESS'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    correlationReference: varchar('correlation_reference', { length: 255 }),
    evidenceReference: varchar('evidence_reference', { length: 255 }),
    reason: text('reason').notNull(),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    index('idx_company_trace_actor').on(table.actorEmail),
    index('idx_company_trace_status').on(table.operationStatus),
    index('idx_company_trace_occurred').on(table.occurredAt)
  ]
);

export type LegalEntity = typeof legalEntities.$inferSelect;
export type NewLegalEntity = typeof legalEntities.$inferInsert;

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;

export type Designation = typeof designations.$inferSelect;
export type NewDesignation = typeof designations.$inferInsert;

export type InternalEmployee = typeof internalEmployees.$inferSelect;
export type NewInternalEmployee = typeof internalEmployees.$inferInsert;

export type BoardMember = typeof boardMembers.$inferSelect;
export type NewBoardMember = typeof boardMembers.$inferInsert;

export type GovernanceCommittee = typeof governanceCommittees.$inferSelect;
export type NewGovernanceCommittee = typeof governanceCommittees.$inferInsert;

export type CommitteeMembership = typeof committeeMemberships.$inferSelect;
export type NewCommitteeMembership = typeof committeeMemberships.$inferInsert;

export type CorporatePolicy = typeof corporatePolicies.$inferSelect;
export type NewCorporatePolicy = typeof corporatePolicies.$inferInsert;

export type ComplianceOfficer = typeof complianceOfficers.$inferSelect;
export type NewComplianceOfficer = typeof complianceOfficers.$inferInsert;

export type GovernanceEvent = typeof governanceEvents.$inferSelect;
export type NewGovernanceEvent = typeof governanceEvents.$inferInsert;

export type CompanyAuditTrace = typeof companyAuditTraces.$inferSelect;
export type NewCompanyAuditTrace = typeof companyAuditTraces.$inferInsert;

