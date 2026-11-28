import {
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  integer,
  numeric,
  boolean
} from 'drizzle-orm/pg-core';
import { tenants } from '../core/tenants.js';
import { branches } from '../core/branches.js';
import {
  clinicalSchema,
  operationalPartners,
  operationalOrganizations,
  operationalFacilities,
  operationalDepartments,
  patients,
  encounters
} from './foundation.js';
import {
  medicationCatalog,
  billingChargeItems,
  billingInvoices,
  billingInvoiceItems
} from './diagnostics-pharmacy-billing.js';

// ============================================================================
// PHASE 2.10: INSURANCE, TPA, CLAIMS & THIRD-PARTY PAYER MANAGEMENT
// ============================================================================

/**
 * 1. Insurance Payers (Commercial Payers, TPAs, Government Schemes, Corporates)
 */
export const insurancePayers = clinicalSchema.table(
  'insurance_payers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => operationalOrganizations.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => operationalFacilities.id, { onDelete: 'set null' }),
    payerCode: varchar('payer_code', { length: 50 }).notNull(),
    payerName: varchar('payer_name', { length: 255 }).notNull(),
    payerType: varchar('payer_type', { length: 50 }).notNull(), // COMMERCIAL_INSURANCE, TPA, GOVERNMENT_HEALTHCARE, CORPORATE_DIRECT, CASH_SELFPAY
    tpaName: varchar('tpa_name', { length: 255 }),
    contactPerson: varchar('contact_person', { length: 150 }),
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 50 }),
    claimSubmissionMode: varchar('claim_submission_mode', { length: 50 }).notNull().default('EDI_ELECTRONIC'), // EDI_ELECTRONIC, PAYER_PORTAL, API_DIRECT, PHYSICAL_BATCH
    electronicPayerId: varchar('electronic_payer_id', { length: 100 }),
    settlementPeriodDays: integer('settlement_period_days').notNull().default(30),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, SUSPENDED, INACTIVE, UNDER_REVIEW
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ins_payer_tenant').on(table.tenantId),
    index('idx_ins_payer_partner').on(table.partnerId),
    index('idx_ins_payer_org').on(table.organizationId),
    index('idx_ins_payer_code').on(table.payerCode),
    index('idx_ins_payer_status').on(table.status)
  ]
);

/**
 * 2. Insurance Plans (Benefit packages, coverage schedules, network tiers)
 */
export const insurancePlans = clinicalSchema.table(
  'insurance_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => operationalOrganizations.id, { onDelete: 'cascade' }),
    payerId: uuid('payer_id')
      .notNull()
      .references(() => insurancePayers.id, { onDelete: 'cascade' }),
    planCode: varchar('plan_code', { length: 50 }).notNull(),
    planName: varchar('plan_name', { length: 255 }).notNull(),
    planType: varchar('plan_type', { length: 50 }).notNull(), // COMPREHENSIVE, OPD_ONLY, IPD_CATASTROPHIC, DENTAL_VISION, SENIOR_GOLD, CORPORATE_CUSTOM
    networkType: varchar('network_type', { length: 50 }).notNull().default('TIER_1_IN_NETWORK'), // TIER_1_IN_NETWORK, TIER_2_PREFERRED, OUT_OF_NETWORK
    copayPercentage: numeric('copay_percentage', { precision: 5, scale: 2 }).notNull().default('0.00'),
    standardDeductible: numeric('standard_deductible', { precision: 12, scale: 2 }).notNull().default('0.00'),
    preAuthThreshold: numeric('pre_auth_threshold', { precision: 12, scale: 2 }).notNull().default('500.00'),
    authorizationRules: jsonb('authorization_rules').default({}),
    coverageRules: jsonb('coverage_rules').default({}),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, RETIRED, DRAFT
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ins_plan_tenant').on(table.tenantId),
    index('idx_ins_plan_payer').on(table.payerId),
    index('idx_ins_plan_code').on(table.planCode),
    index('idx_ins_plan_status').on(table.status)
  ]
);

/**
 * 3. Insurance Patient Policies (Policy enrollment, member cards, subscriber links)
 */
export const insurancePatientPolicies = clinicalSchema.table(
  'insurance_patient_policies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => operationalOrganizations.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => operationalFacilities.id, { onDelete: 'set null' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    payerId: uuid('payer_id')
      .notNull()
      .references(() => insurancePayers.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id')
      .notNull()
      .references(() => insurancePlans.id, { onDelete: 'cascade' }),
    memberId: varchar('member_id', { length: 100 }).notNull(),
    policyNumber: varchar('policy_number', { length: 100 }).notNull(),
    groupNumber: varchar('group_number', { length: 100 }),
    subscriberName: varchar('subscriber_name', { length: 255 }).notNull(),
    subscriberRelationship: varchar('subscriber_relationship', { length: 50 }).notNull().default('SELF'), // SELF, SPOUSE, CHILD, PARENT, EMPLOYEE, OTHER
    subscriberDob: timestamp('subscriber_dob', { withTimezone: true }),
    subscriberGender: varchar('subscriber_gender', { length: 20 }),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    priority: varchar('priority', { length: 20 }).notNull().default('PRIMARY'), // PRIMARY, SECONDARY, TERTIARY
    coverageStatus: varchar('coverage_status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, EXPIRED, LAPSED, TERMINATED
    verificationStatus: varchar('verification_status', { length: 50 }).notNull().default('PENDING'), // PENDING, VERIFIED, REJECTED, EXPIRED
    cardFrontUrl: varchar('card_front_url', { length: 500 }),
    cardBackUrl: varchar('card_back_url', { length: 500 }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    verifiedBy: varchar('verified_by', { length: 255 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ins_policy_tenant').on(table.tenantId),
    index('idx_ins_policy_patient').on(table.patientId),
    index('idx_ins_policy_payer').on(table.payerId),
    index('idx_ins_policy_plan').on(table.planId),
    index('idx_ins_policy_member').on(table.memberId),
    index('idx_ins_policy_status').on(table.coverageStatus)
  ]
);

/**
 * 4. Insurance Eligibility Checks (Real-time benefit verifications & copay/deductible quotes)
 */
export const insuranceEligibilityChecks = clinicalSchema.table(
  'insurance_eligibility_checks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => operationalOrganizations.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => operationalFacilities.id, { onDelete: 'set null' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    policyId: uuid('policy_id')
      .notNull()
      .references(() => insurancePatientPolicies.id, { onDelete: 'cascade' }),
    payerId: uuid('payer_id')
      .notNull()
      .references(() => insurancePayers.id, { onDelete: 'cascade' }),
    checkReferenceNumber: varchar('check_reference_number', { length: 100 }).notNull().unique(),
    eligibilityStatus: varchar('eligibility_status', { length: 50 }).notNull().default('PROCESSING'), // ELIGIBLE, PARTIALLY_ELIGIBLE, INELIGIBLE, PENDING, ERROR
    copayAmount: numeric('copay_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
    copayPercentage: numeric('copay_percentage', { precision: 5, scale: 2 }).notNull().default('0.00'),
    deductibleTotal: numeric('deductible_total', { precision: 12, scale: 2 }).notNull().default('0.00'),
    deductibleRemaining: numeric('deductible_remaining', { precision: 12, scale: 2 }).notNull().default('0.00'),
    annualBenefitLimit: numeric('annual_benefit_limit', { precision: 12, scale: 2 }),
    annualBenefitRemaining: numeric('annual_benefit_remaining', { precision: 12, scale: 2 }),
    preAuthRequired: boolean('pre_auth_required').notNull().default(false),
    benefitsSummary: text('benefits_summary'),
    payerResponsePayload: jsonb('payer_response_payload').default({}),
    checkedBy: varchar('checked_by', { length: 255 }).notNull(),
    checkedAt: timestamp('checked_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ins_elig_tenant').on(table.tenantId),
    index('idx_ins_elig_patient').on(table.patientId),
    index('idx_ins_elig_policy').on(table.policyId),
    index('idx_ins_elig_status').on(table.eligibilityStatus)
  ]
);

/**
 * 5. Insurance Authorizations (Prior-authorization requests, approvals & validity)
 */
export const insuranceAuthorizations = clinicalSchema.table(
  'insurance_authorizations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => operationalOrganizations.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => operationalFacilities.id, { onDelete: 'set null' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    policyId: uuid('policy_id')
      .notNull()
      .references(() => insurancePatientPolicies.id, { onDelete: 'cascade' }),
    payerId: uuid('payer_id')
      .notNull()
      .references(() => insurancePayers.id, { onDelete: 'cascade' }),
    encounterId: uuid('encounter_id').references(() => encounters.id, { onDelete: 'set null' }),
    authorizationNumber: varchar('authorization_number', { length: 100 }).notNull().unique(),
    requestedServices: text('requested_services').notNull(),
    diagnosisContext: text('diagnosis_context').notNull(),
    requestedAmount: numeric('requested_amount', { precision: 12, scale: 2 }).notNull(),
    approvedAmount: numeric('approved_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
    approvedUnits: integer('approved_units').default(1),
    status: varchar('status', { length: 50 }).notNull().default('REQUESTED'), // REQUESTED, SUBMITTED, PENDING, APPROVED, PARTIALLY_APPROVED, DENIED, EXPIRED, CANCELLED
    payerRemarks: text('payer_remarks'),
    validFrom: timestamp('valid_from', { withTimezone: true }).notNull().defaultNow(),
    validTo: timestamp('valid_to', { withTimezone: true }),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    adjudicatedAt: timestamp('adjudicated_at', { withTimezone: true }),
    submittedBy: varchar('submitted_by', { length: 255 }),
    adjudicatedBy: varchar('adjudicated_by', { length: 255 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ins_auth_tenant').on(table.tenantId),
    index('idx_ins_auth_patient').on(table.patientId),
    index('idx_ins_auth_payer').on(table.payerId),
    index('idx_ins_auth_number').on(table.authorizationNumber),
    index('idx_ins_auth_status').on(table.status)
  ]
);

/**
 * 6. Insurance Claims (Master healthcare claim dossier)
 */
export const insuranceClaims = clinicalSchema.table(
  'insurance_claims',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => operationalOrganizations.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => operationalFacilities.id, { onDelete: 'set null' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    policyId: uuid('policy_id')
      .notNull()
      .references(() => insurancePatientPolicies.id, { onDelete: 'cascade' }),
    payerId: uuid('payer_id')
      .notNull()
      .references(() => insurancePayers.id, { onDelete: 'cascade' }),
    encounterId: uuid('encounter_id').references(() => encounters.id, { onDelete: 'set null' }),
    invoiceId: uuid('invoice_id').references(() => billingInvoices.id, { onDelete: 'set null' }),
    authorizationId: uuid('authorization_id').references(() => insuranceAuthorizations.id, { onDelete: 'set null' }),
    claimNumber: varchar('claim_number', { length: 100 }).notNull().unique(),
    claimType: varchar('claim_type', { length: 50 }).notNull().default('OUTPATIENT'), // OUTPATIENT, INPATIENT, EMERGENCY, DAY_CARE, PHARMACY_DIRECT, DIAGNOSTIC_DIRECT
    submissionMode: varchar('submission_mode', { length: 50 }).notNull().default('ELECTRONIC_EDI'), // ELECTRONIC_EDI, PORTAL_UPLOAD, DIRECT_API, PAPER_MANUAL
    totalClaimAmount: numeric('total_claim_amount', { precision: 12, scale: 2 }).notNull(),
    approvedAmount: numeric('approved_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
    deniedAmount: numeric('denied_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
    patientResponsibility: numeric('patient_responsibility', { precision: 12, scale: 2 }).notNull().default('0.00'),
    adjustmentAmount: numeric('adjustment_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
    status: varchar('status', { length: 50 }).notNull().default('DRAFT'), // DRAFT, READY_FOR_SUBMISSION, SUBMITTED, ACKNOWLEDGED, PROCESSING, ADJUDICATED, PARTIALLY_APPROVED, APPROVED, DENIED, APPEAL_SUBMITTED, APPEAL_RESOLVED, SETTLED, CLOSED, CANCELLED
    primaryDiagnosisCode: varchar('primary_diagnosis_code', { length: 50 }),
    primaryDiagnosisDescription: text('primary_diagnosis_description'),
    attendingDoctorName: varchar('attending_doctor_name', { length: 255 }),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    submittedBy: varchar('submitted_by', { length: 255 }),
    adjudicatedAt: timestamp('adjudicated_at', { withTimezone: true }),
    adjudicatedBy: varchar('adjudicated_by', { length: 255 }),
    settledAt: timestamp('settled_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ins_claim_tenant').on(table.tenantId),
    index('idx_ins_claim_patient').on(table.patientId),
    index('idx_ins_claim_payer').on(table.payerId),
    index('idx_ins_claim_number').on(table.claimNumber),
    index('idx_ins_claim_status').on(table.status),
    index('idx_ins_claim_invoice').on(table.invoiceId)
  ]
);

/**
 * 7. Insurance Claim Items (Line-by-line itemized service adjudication)
 */
export const insuranceClaimItems = clinicalSchema.table(
  'insurance_claim_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    claimId: uuid('claim_id')
      .notNull()
      .references(() => insuranceClaims.id, { onDelete: 'cascade' }),
    invoiceItemId: uuid('invoice_item_id').references(() => billingInvoiceItems.id, { onDelete: 'set null' }),
    chargeItemId: uuid('charge_item_id').references(() => billingChargeItems.id, { onDelete: 'set null' }),
    serviceCode: varchar('service_code', { length: 50 }).notNull(),
    serviceDescription: text('service_description').notNull(),
    quantity: integer('quantity').notNull().default(1),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    billedAmount: numeric('billed_amount', { precision: 12, scale: 2 }).notNull(),
    allowedAmount: numeric('allowed_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
    approvedAmount: numeric('approved_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
    deniedAmount: numeric('denied_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
    patientResponsibility: numeric('patient_responsibility', { precision: 12, scale: 2 }).notNull().default('0.00'),
    denialReason: text('denial_reason'),
    denialCode: varchar('denial_code', { length: 50 }),
    status: varchar('status', { length: 50 }).notNull().default('PENDING'), // PENDING, APPROVED, PARTIALLY_APPROVED, DENIED
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ins_item_tenant').on(table.tenantId),
    index('idx_ins_item_claim').on(table.claimId),
    index('idx_ins_item_service').on(table.serviceCode)
  ]
);

/**
 * 8. Insurance Claim Submissions (Electronic EDI / Portal transmission records)
 */
export const insuranceClaimSubmissions = clinicalSchema.table(
  'insurance_claim_submissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    claimId: uuid('claim_id')
      .notNull()
      .references(() => insuranceClaims.id, { onDelete: 'cascade' }),
    submissionNumber: varchar('submission_number', { length: 100 }).notNull().unique(),
    transmissionBatchId: varchar('transmission_batch_id', { length: 100 }),
    submissionPayloadReference: text('submission_payload_reference'),
    transmissionStatus: varchar('transmission_status', { length: 50 }).notNull().default('QUEUED'), // QUEUED, TRANSMITTED, ACKNOWLEDGED, REJECTED, FAILED
    payerAcknowledgement: text('payer_acknowledgement'),
    acknowledgementReference: varchar('acknowledgement_reference', { length: 100 }),
    submittedBy: varchar('submitted_by', { length: 255 }).notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
    responseReceivedAt: timestamp('response_received_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ins_sub_tenant').on(table.tenantId),
    index('idx_ins_sub_claim').on(table.claimId),
    index('idx_ins_sub_batch').on(table.transmissionBatchId)
  ]
);

/**
 * 9. Insurance Claim Adjudications (Explanation of Benefits & Remittance Advice)
 */
export const insuranceClaimAdjudications = clinicalSchema.table(
  'insurance_claim_adjudications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    claimId: uuid('claim_id')
      .notNull()
      .references(() => insuranceClaims.id, { onDelete: 'cascade' }),
    adjudicationReference: varchar('adjudication_reference', { length: 100 }).notNull().unique(),
    adjudicationStatus: varchar('adjudication_status', { length: 50 }).notNull(), // APPROVED, PARTIALLY_APPROVED, DENIED
    totalBilled: numeric('total_billed', { precision: 12, scale: 2 }).notNull(),
    approvedAmount: numeric('approved_amount', { precision: 12, scale: 2 }).notNull(),
    deniedAmount: numeric('denied_amount', { precision: 12, scale: 2 }).notNull(),
    patientResponsibility: numeric('patient_responsibility', { precision: 12, scale: 2 }).notNull(),
    contractualAdjustment: numeric('contractual_adjustment', { precision: 12, scale: 2 }).notNull().default('0.00'),
    payerRemarks: text('payer_remarks'),
    eobDocumentUrl: varchar('eob_document_url', { length: 500 }),
    adjudicatedAt: timestamp('adjudicated_at', { withTimezone: true }).notNull().defaultNow(),
    adjudicatedBy: varchar('adjudicated_by', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ins_adj_tenant').on(table.tenantId),
    index('idx_ins_adj_claim').on(table.claimId),
    index('idx_ins_adj_status').on(table.adjudicationStatus)
  ]
);

/**
 * 10. Insurance Claim Denials (Structured denial classification & root cause ledger)
 */
export const insuranceClaimDenials = clinicalSchema.table(
  'insurance_claim_denials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    claimId: uuid('claim_id')
      .notNull()
      .references(() => insuranceClaims.id, { onDelete: 'cascade' }),
    claimItemId: uuid('claim_item_id').references(() => insuranceClaimItems.id, { onDelete: 'set null' }),
    denialNumber: varchar('denial_number', { length: 100 }).notNull().unique(),
    denialCode: varchar('denial_code', { length: 50 }).notNull(), // CO-16, CO-18, CO-50, PR-1, OA-23
    denialCategory: varchar('denial_category', { length: 50 }).notNull(), // MEDICAL_NECESSITY, PRE_AUTH_MISSING, ELIGIBILITY_EXPIRED, TIMELY_FILING, NON_COVERED_SERVICE, CODING_DISCREPANCY, DUPLICATE_CLAIM
    denialReason: text('denial_reason').notNull(),
    deniedAmount: numeric('denied_amount', { precision: 12, scale: 2 }).notNull(),
    appealEligible: boolean('appeal_eligible').notNull().default(true),
    appealDeadline: timestamp('appeal_deadline', { withTimezone: true }),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, APPEAL_IN_PROGRESS, APPEAL_RESOLVED, WRITTEN_OFF
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ins_denial_tenant').on(table.tenantId),
    index('idx_ins_denial_claim').on(table.claimId),
    index('idx_ins_denial_code').on(table.denialCode),
    index('idx_ins_denial_cat').on(table.denialCategory)
  ]
);

/**
 * 11. Insurance Claim Appeals (Dispute management, documentation & recovery pipeline)
 */
export const insuranceClaimAppeals = clinicalSchema.table(
  'insurance_claim_appeals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    claimId: uuid('claim_id')
      .notNull()
      .references(() => insuranceClaims.id, { onDelete: 'cascade' }),
    denialId: uuid('denial_id')
      .notNull()
      .references(() => insuranceClaimDenials.id, { onDelete: 'cascade' }),
    appealNumber: varchar('appeal_number', { length: 100 }).notNull().unique(),
    appealLevel: integer('appeal_level').notNull().default(1), // Level 1 (Initial Reconsideration), Level 2 (Formal Appeal), Level 3 (External Review)
    appealReason: text('appeal_reason').notNull(),
    supportingDocumentsSummary: text('supporting_documents_summary'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
    submittedBy: varchar('submitted_by', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('SUBMITTED'), // SUBMITTED, UNDER_REVIEW, APPROVED, PARTIALLY_OVERTURNED, UPHELD_DENIED
    outcomeNotes: text('outcome_notes'),
    recoveredAmount: numeric('recovered_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ins_appeal_tenant').on(table.tenantId),
    index('idx_ins_appeal_claim').on(table.claimId),
    index('idx_ins_appeal_denial').on(table.denialId),
    index('idx_ins_appeal_status').on(table.status)
  ]
);

/**
 * 12. Insurance Settlements (Payer remittance bank credits & electronic funds transfer)
 */
export const insuranceSettlements = clinicalSchema.table(
  'insurance_settlements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => operationalOrganizations.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => operationalFacilities.id, { onDelete: 'set null' }),
    payerId: uuid('payer_id')
      .notNull()
      .references(() => insurancePayers.id, { onDelete: 'cascade' }),
    claimId: uuid('claim_id')
      .notNull()
      .references(() => insuranceClaims.id, { onDelete: 'cascade' }),
    settlementReference: varchar('settlement_reference', { length: 100 }).notNull().unique(),
    eftTransactionNumber: varchar('eft_transaction_number', { length: 100 }),
    settlementAmount: numeric('settlement_amount', { precision: 12, scale: 2 }).notNull(),
    settlementDate: timestamp('settlement_date', { withTimezone: true }).notNull().defaultNow(),
    status: varchar('status', { length: 50 }).notNull().default('RECEIVED'), // RECEIVED, ALLOCATED, RECONCILED, DISPUTED
    paymentReference: varchar('payment_reference', { length: 100 }),
    recordedBy: varchar('recorded_by', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ins_settle_tenant').on(table.tenantId),
    index('idx_ins_settle_payer').on(table.payerId),
    index('idx_ins_settle_claim').on(table.claimId),
    index('idx_ins_settle_ref').on(table.settlementReference)
  ]
);

/**
 * 13. Insurance Reconciliations (Remittance variance tracking, underpayments & adjustments)
 */
export const insuranceReconciliations = clinicalSchema.table(
  'insurance_reconciliations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => operationalOrganizations.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => operationalFacilities.id, { onDelete: 'set null' }),
    settlementId: uuid('settlement_id')
      .notNull()
      .references(() => insuranceSettlements.id, { onDelete: 'cascade' }),
    claimId: uuid('claim_id')
      .notNull()
      .references(() => insuranceClaims.id, { onDelete: 'cascade' }),
    reconciliationReference: varchar('reconciliation_reference', { length: 100 }).notNull().unique(),
    expectedAmount: numeric('expected_amount', { precision: 12, scale: 2 }).notNull(),
    receivedAmount: numeric('received_amount', { precision: 12, scale: 2 }).notNull(),
    variance: numeric('variance', { precision: 12, scale: 2 }).notNull(),
    reconciliationStatus: varchar('reconciliation_status', { length: 50 }).notNull(), // MATCHED, VARIANCE_ACCEPTED, UNDERPAYMENT_DISPUTED, WRITE_OFF_AUTHORIZED
    reason: text('reason'),
    resolvedBy: varchar('resolved_by', { length: 255 }).notNull(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ins_rec_tenant').on(table.tenantId),
    index('idx_ins_rec_settle').on(table.settlementId),
    index('idx_ins_rec_claim').on(table.claimId),
    index('idx_ins_rec_status').on(table.reconciliationStatus)
  ]
);

/**
 * 14. Insurance Document Records (Insurance cards, pre-auth letters, discharge summaries)
 */
export const insuranceDocumentRecords = clinicalSchema.table(
  'insurance_document_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => operationalOrganizations.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => operationalFacilities.id, { onDelete: 'set null' }),
    claimId: uuid('claim_id').references(() => insuranceClaims.id, { onDelete: 'set null' }),
    policyId: uuid('policy_id').references(() => insurancePatientPolicies.id, { onDelete: 'set null' }),
    authorizationId: uuid('authorization_id').references(() => insuranceAuthorizations.id, { onDelete: 'set null' }),
    documentType: varchar('document_type', { length: 50 }).notNull(), // INSURANCE_CARD, PRE_AUTH_APPROVAL, DISCHARGE_SUMMARY, LAB_REPORT, ITEM_BILL, EOB_REMITTANCE, APPEAL_LETTER
    title: varchar('title', { length: 255 }).notNull(),
    fileUrl: varchar('file_url', { length: 500 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull().default('application/pdf'),
    fileSize: integer('file_size').notNull().default(0),
    uploadedBy: varchar('uploaded_by', { length: 255 }).notNull(),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ins_doc_tenant').on(table.tenantId),
    index('idx_ins_doc_claim').on(table.claimId),
    index('idx_ins_doc_policy').on(table.policyId)
  ]
);

/**
 * 15. Insurance Audit Traces (Append-only tamper-evident audit journal)
 */
export const insuranceAuditTraces = clinicalSchema.table(
  'insurance_audit_traces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    traceId: varchar('trace_id', { length: 100 }).notNull().unique(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => operationalOrganizations.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => operationalFacilities.id, { onDelete: 'set null' }),
    actorId: varchar('actor_id', { length: 255 }).notNull(),
    actorRole: varchar('actor_role', { length: 100 }).notNull(),
    operation: varchar('operation', { length: 100 }).notNull(), // PAYER_CREATED, PLAN_CONFIGURED, POLICY_REGISTERED, ELIGIBILITY_VERIFIED, PRE_AUTH_REQUESTED, PRE_AUTH_APPROVED, CLAIM_CREATED, CLAIM_SUBMITTED, CLAIM_ADJUDICATED, CLAIM_DENIED, APPEAL_SUBMITTED, SETTLEMENT_RECEIVED, RECONCILIATION_COMPLETED
    entityType: varchar('entity_type', { length: 50 }).notNull(), // PAYER, PLAN, POLICY, ELIGIBILITY, AUTHORIZATION, CLAIM, DENIAL, APPEAL, SETTLEMENT, RECONCILIATION
    entityId: varchar('entity_id', { length: 100 }).notNull(),
    patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'set null' }),
    claimId: uuid('claim_id').references(() => insuranceClaims.id, { onDelete: 'set null' }),
    beforeSnapshot: jsonb('before_snapshot'),
    afterSnapshot: jsonb('after_snapshot'),
    financialImpact: numeric('financial_impact', { precision: 12, scale: 2 }).default('0.00'),
    reason: text('reason').notNull(),
    ipAddress: varchar('ip_address', { length: 100 }),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
    operationStatus: varchar('operation_status', { length: 50 }).notNull().default('SUCCESS'),
    hashPointer: varchar('hash_pointer', { length: 128 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ins_audit_tenant').on(table.tenantId),
    index('idx_ins_audit_trace').on(table.traceId),
    index('idx_ins_audit_entity').on(table.entityType, table.entityId),
    index('idx_ins_audit_claim').on(table.claimId),
    index('idx_ins_audit_op').on(table.operation)
  ]
);

// Types exports for Phase 2.10
export type InsurancePayer = typeof insurancePayers.$inferSelect;
export type NewInsurancePayer = typeof insurancePayers.$inferInsert;

export type InsurancePlan = typeof insurancePlans.$inferSelect;
export type NewInsurancePlan = typeof insurancePlans.$inferInsert;

export type InsurancePatientPolicy = typeof insurancePatientPolicies.$inferSelect;
export type NewInsurancePatientPolicy = typeof insurancePatientPolicies.$inferInsert;

export type InsuranceEligibilityCheck = typeof insuranceEligibilityChecks.$inferSelect;
export type NewInsuranceEligibilityCheck = typeof insuranceEligibilityChecks.$inferInsert;

export type InsuranceAuthorization = typeof insuranceAuthorizations.$inferSelect;
export type NewInsuranceAuthorization = typeof insuranceAuthorizations.$inferInsert;

export type InsuranceClaim = typeof insuranceClaims.$inferSelect;
export type NewInsuranceClaim = typeof insuranceClaims.$inferInsert;

export type InsuranceClaimItem = typeof insuranceClaimItems.$inferSelect;
export type NewInsuranceClaimItem = typeof insuranceClaimItems.$inferInsert;

export type InsuranceClaimSubmission = typeof insuranceClaimSubmissions.$inferSelect;
export type NewInsuranceClaimSubmission = typeof insuranceClaimSubmissions.$inferInsert;

export type InsuranceClaimAdjudication = typeof insuranceClaimAdjudications.$inferSelect;
export type NewInsuranceClaimAdjudication = typeof insuranceClaimAdjudications.$inferInsert;

export type InsuranceClaimDenial = typeof insuranceClaimDenials.$inferSelect;
export type NewInsuranceClaimDenial = typeof insuranceClaimDenials.$inferInsert;

export type InsuranceClaimAppeal = typeof insuranceClaimAppeals.$inferSelect;
export type NewInsuranceClaimAppeal = typeof insuranceClaimAppeals.$inferInsert;

export type InsuranceSettlement = typeof insuranceSettlements.$inferSelect;
export type NewInsuranceSettlement = typeof insuranceSettlements.$inferInsert;

export type InsuranceReconciliation = typeof insuranceReconciliations.$inferSelect;
export type NewInsuranceReconciliation = typeof insuranceReconciliations.$inferInsert;

export type InsuranceDocumentRecord = typeof insuranceDocumentRecords.$inferSelect;
export type NewInsuranceDocumentRecord = typeof insuranceDocumentRecords.$inferInsert;

export type InsuranceAuditTrace = typeof insuranceAuditTraces.$inferSelect;
export type NewInsuranceAuditTrace = typeof insuranceAuditTraces.$inferInsert;

/**
 * ============================================================================
 * PHASE 2.11: PROCUREMENT, SUPPLY CHAIN & VENDOR MANAGEMENT
 * ============================================================================
 */

/**
 * 1. Procurement Vendors
 */
export const procurementVendors = clinicalSchema.table(
  'procurement_vendors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => operationalOrganizations.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => operationalFacilities.id, { onDelete: 'set null' }),
    vendorCode: varchar('vendor_code', { length: 50 }).notNull().unique(),
    legalName: varchar('legal_name', { length: 255 }).notNull(),
    tradeName: varchar('trade_name', { length: 255 }),
    vendorCategory: varchar('vendor_category', { length: 50 }).notNull().default('PHARMACEUTICALS'), // PHARMACEUTICALS, SURGICAL_DISPOSABLES, LABORATORY_REAGENTS, MEDICAL_EQUIPMENT, PPE_SAFETY, GENERAL_SUPPLIES, IT_BIOMEDICAL
    vendorType: varchar('vendor_type', { length: 50 }).notNull().default('DISTRIBUTOR'), // MANUFACTURER, DISTRIBUTOR, WHOLESALER, DIRECT_IMPORTER, LOCAL_SUPPLIER, SERVICE_PROVIDER
    contactPerson: varchar('contact_person', { length: 150 }),
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 50 }),
    address: text('address'),
    taxId: varchar('tax_id', { length: 100 }),
    gstNumber: varchar('gst_number', { length: 100 }),
    panNumber: varchar('pan_number', { length: 100 }),
    bankDetails: jsonb('bank_details').default({}),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, SUSPENDED, BLACKLISTED, INACTIVE
    riskClassification: varchar('risk_classification', { length: 50 }).notNull().default('LOW_RISK'), // LOW_RISK, MEDIUM_RISK, HIGH_RISK, CRITICAL
    rating: numeric('rating', { precision: 3, scale: 2 }).default('4.50'),
    paymentTermsDays: integer('payment_terms_days').notNull().default(30),
    leadTimeDays: integer('lead_time_days').notNull().default(3),
    minimumOrderValue: numeric('minimum_order_value', { precision: 12, scale: 2 }).default('0.00'),
    deliverySlaHours: integer('delivery_sla_hours').notNull().default(48),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_proc_vendor_tenant').on(table.tenantId),
    index('idx_proc_vendor_org').on(table.organizationId),
    index('idx_proc_vendor_code').on(table.vendorCode),
    index('idx_proc_vendor_category').on(table.vendorCategory),
    index('idx_proc_vendor_status').on(table.status)
  ]
);

/**
 * 2. Vendor Contacts
 */
export const procurementVendorContacts = clinicalSchema.table(
  'procurement_vendor_contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => procurementVendors.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 150 }).notNull(),
    designation: varchar('designation', { length: 100 }),
    department: varchar('department', { length: 100 }),
    phone: varchar('phone', { length: 50 }),
    email: varchar('email', { length: 255 }),
    isPrimary: boolean('is_primary').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_proc_vcontact_tenant').on(table.tenantId),
    index('idx_proc_vcontact_vendor').on(table.vendorId)
  ]
);

/**
 * 3. Vendor Documents
 */
export const procurementVendorDocuments = clinicalSchema.table(
  'procurement_vendor_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => procurementVendors.id, { onDelete: 'cascade' }),
    documentType: varchar('document_type', { length: 50 }).notNull(), // DRUG_LICENSE, GST_CERTIFICATE, ISO_CERTIFICATE, GMP_CERTIFICATE, NDA_CONTRACT, TARIFF_AGREEMENT
    documentName: varchar('document_name', { length: 255 }).notNull(),
    fileUrl: text('file_url').notNull(),
    expiryDate: timestamp('expiry_date', { withTimezone: true }),
    verificationStatus: varchar('verification_status', { length: 50 }).notNull().default('VERIFIED'), // PENDING, VERIFIED, EXPIRED, REJECTED
    uploadedBy: varchar('uploaded_by', { length: 150 }).notNull(),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_proc_vdoc_tenant').on(table.tenantId),
    index('idx_proc_vdoc_vendor').on(table.vendorId)
  ]
);

/**
 * 4. Vendor Contracts
 */
export const procurementVendorContracts = clinicalSchema.table(
  'procurement_vendor_contracts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => operationalOrganizations.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => operationalFacilities.id, { onDelete: 'set null' }),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => procurementVendors.id, { onDelete: 'cascade' }),
    contractNumber: varchar('contract_number', { length: 100 }).notNull().unique(),
    title: varchar('title', { length: 255 }).notNull(),
    version: integer('version').notNull().default(1),
    effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull(),
    expiryDate: timestamp('expiry_date', { withTimezone: true }).notNull(),
    renewalDate: timestamp('renewal_date', { withTimezone: true }),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // DRAFT, REVIEW, APPROVAL, ACTIVE, EXPIRING, EXPIRED, TERMINATED
    terms: text('terms'),
    slaDays: integer('sla_days').notNull().default(2),
    totalAgreedValue: numeric('total_agreed_value', { precision: 14, scale: 2 }).default('0.00'),
    approvedBy: varchar('approved_by', { length: 150 }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    documentUrl: text('document_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_proc_vcontract_tenant').on(table.tenantId),
    index('idx_proc_vcontract_org').on(table.organizationId),
    index('idx_proc_vcontract_vendor').on(table.vendorId),
    index('idx_proc_vcontract_status').on(table.status)
  ]
);

/**
 * 5. Vendor Contract Items
 */
export const procurementVendorContractItems = clinicalSchema.table(
  'procurement_vendor_contract_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    contractId: uuid('contract_id')
      .notNull()
      .references(() => procurementVendorContracts.id, { onDelete: 'cascade' }),
    itemCode: varchar('item_code', { length: 50 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    contractedUnitPrice: numeric('contracted_unit_price', { precision: 12, scale: 2 }).notNull(),
    discountPercentage: numeric('discount_percentage', { precision: 5, scale: 2 }).default('0.00'),
    taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('0.00'),
    minimumOrderQuantity: integer('minimum_order_quantity').default(1),
    deliveryLeadDays: integer('delivery_lead_days').default(3),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_proc_vcitem_tenant').on(table.tenantId),
    index('idx_proc_vcitem_contract').on(table.contractId)
  ]
);

/**
 * 6. Procurement Item Master Catalog
 */
export const procurementItems = clinicalSchema.table(
  'procurement_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => operationalOrganizations.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => operationalFacilities.id, { onDelete: 'set null' }),
    itemCode: varchar('item_code', { length: 50 }).notNull().unique(),
    sku: varchar('sku', { length: 50 }),
    barcode: varchar('barcode', { length: 100 }),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    genericName: varchar('generic_name', { length: 255 }),
    category: varchar('category', { length: 50 }).notNull().default('MEDICINE'), // MEDICINE, SURGICAL_CONSUMABLE, LAB_REAGENT, DIAGNOSTIC_KIT, MEDICAL_DEVICE, PPE_SUPPLY, GENERAL_HOSPITAL, IT_BIOMEDICAL
    subcategory: varchar('subcategory', { length: 100 }),
    unit: varchar('unit', { length: 50 }).notNull().default('UNIT'), // VIAL, BOX, PACK, PCS, ROLL, BOTTLE, AMPULE
    packSize: integer('pack_size').notNull().default(1),
    manufacturer: varchar('manufacturer', { length: 255 }),
    reorderLevel: integer('reorder_level').notNull().default(50),
    safetyStock: integer('safety_stock').notNull().default(20),
    minStock: integer('min_stock').notNull().default(10),
    maxStock: integer('max_stock').notNull().default(500),
    leadTimeDays: integer('lead_time_days').notNull().default(3),
    standardCost: numeric('standard_cost', { precision: 12, scale: 2 }).notNull().default('0.00'),
    isControlled: boolean('is_controlled').notNull().default(false),
    isExpiryApplicable: boolean('is_expiry_applicable').notNull().default(true),
    isBatchApplicable: boolean('is_batch_applicable').notNull().default(true),
    isSerialApplicable: boolean('is_serial_applicable').notNull().default(false),
    medicationCatalogId: uuid('medication_catalog_id').references(() => medicationCatalog.id, { onDelete: 'set null' }),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, INACTIVE, DISCONTINUED
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_proc_item_tenant').on(table.tenantId),
    index('idx_proc_item_org').on(table.organizationId),
    index('idx_proc_item_code').on(table.itemCode),
    index('idx_proc_item_cat').on(table.category),
    index('idx_proc_item_status').on(table.status)
  ]
);

/**
 * 7. Procurement Item Vendor Mappings
 */
export const procurementItemVendorMappings = clinicalSchema.table(
  'procurement_item_vendor_mappings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    procurementItemId: uuid('procurement_item_id')
      .notNull()
      .references(() => procurementItems.id, { onDelete: 'cascade' }),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => procurementVendors.id, { onDelete: 'cascade' }),
    vendorCatalogNumber: varchar('vendor_catalog_number', { length: 100 }),
    standardPrice: numeric('standard_price', { precision: 12, scale: 2 }).notNull(),
    discountRate: numeric('discount_rate', { precision: 5, scale: 2 }).default('0.00'),
    leadTimeDays: integer('lead_time_days').default(3),
    isPreferred: boolean('is_preferred').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_proc_ivmap_tenant').on(table.tenantId),
    index('idx_proc_ivmap_item').on(table.procurementItemId),
    index('idx_proc_ivmap_vendor').on(table.vendorId)
  ]
);

/**
 * 8. Purchase Requisitions
 */
export const purchaseRequisitions = clinicalSchema.table(
  'purchase_requisitions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => operationalOrganizations.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => operationalFacilities.id, { onDelete: 'set null' }),
    requisitionNumber: varchar('requisition_number', { length: 100 }).notNull().unique(),
    departmentId: uuid('department_id').references(() => operationalDepartments.id, { onDelete: 'set null' }),
    departmentName: varchar('department_name', { length: 150 }).notNull(),
    storeName: varchar('store_name', { length: 150 }).notNull(),
    requestedBy: varchar('requested_by', { length: 150 }).notNull(),
    requiredByDate: timestamp('required_by_date', { withTimezone: true }).notNull(),
    priority: varchar('priority', { length: 50 }).notNull().default('ROUTINE'), // ROUTINE, URGENT, EMERGENCY
    isEmergency: boolean('is_emergency').notNull().default(false),
    status: varchar('status', { length: 50 }).notNull().default('DRAFT'), // DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, PARTIALLY_APPROVED, REJECTED, CONVERTED_TO_PO, CANCELLED
    totalEstimatedAmount: numeric('total_estimated_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
    reason: text('reason').notNull(),
    justification: text('justification'),
    suggestedVendorId: uuid('suggested_vendor_id').references(() => procurementVendors.id, { onDelete: 'set null' }),
    suggestedVendorName: varchar('suggested_vendor_name', { length: 255 }),
    approvedBy: varchar('approved_by', { length: 150 }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_proc_req_tenant').on(table.tenantId),
    index('idx_proc_req_org').on(table.organizationId),
    index('idx_proc_req_num').on(table.requisitionNumber),
    index('idx_proc_req_status').on(table.status),
    index('idx_proc_req_priority').on(table.priority)
  ]
);

/**
 * 9. Purchase Requisition Items
 */
export const purchaseRequisitionItems = clinicalSchema.table(
  'purchase_requisition_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    requisitionId: uuid('requisition_id')
      .notNull()
      .references(() => purchaseRequisitions.id, { onDelete: 'cascade' }),
    procurementItemId: uuid('procurement_item_id')
      .notNull()
      .references(() => procurementItems.id, { onDelete: 'cascade' }),
    itemCode: varchar('item_code', { length: 50 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    quantity: integer('quantity').notNull(),
    approvedQuantity: integer('approved_quantity').default(0),
    unit: varchar('unit', { length: 50 }).notNull(),
    estimatedUnitPrice: numeric('estimated_unit_price', { precision: 12, scale: 2 }).notNull(),
    totalEstimatedCost: numeric('total_estimated_cost', { precision: 12, scale: 2 }).notNull(),
    remarks: text('remarks'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_proc_reqitem_tenant').on(table.tenantId),
    index('idx_proc_reqitem_req').on(table.requisitionId)
  ]
);

/**
 * 10. Procurement Approvals Workflow
 */
export const procurementApprovals = clinicalSchema.table(
  'procurement_approvals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    entityType: varchar('entity_type', { length: 50 }).notNull(), // REQUISITION, PURCHASE_ORDER, VENDOR_CONTRACT, VENDOR_RETURN, INVOICE_EXCEPTION, EMERGENCY_PURCHASE
    entityId: varchar('entity_id', { length: 100 }).notNull(),
    tier: integer('tier').notNull().default(1), // Level 1 (Dept Head), Level 2 (Finance/Purchase Mgr), Level 3 (Medical Director)
    approverRole: varchar('approver_role', { length: 100 }).notNull(),
    approverId: varchar('approver_id', { length: 150 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('PENDING'), // PENDING, APPROVED, REJECTED, DELEGATED, RETURNED_FOR_CORRECTION
    comments: text('comments'),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_proc_appr_tenant').on(table.tenantId),
    index('idx_proc_appr_entity').on(table.entityType, table.entityId),
    index('idx_proc_appr_status').on(table.status)
  ]
);

/**
 * 11. Purchase Orders
 */
export const purchaseOrders = clinicalSchema.table(
  'purchase_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => operationalOrganizations.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => operationalFacilities.id, { onDelete: 'set null' }),
    poNumber: varchar('po_number', { length: 100 }).notNull().unique(),
    requisitionId: uuid('requisition_id').references(() => purchaseRequisitions.id, { onDelete: 'set null' }),
    requisitionNumber: varchar('requisition_number', { length: 100 }),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => procurementVendors.id, { onDelete: 'cascade' }),
    vendorName: varchar('vendor_name', { length: 255 }).notNull(),
    contractId: uuid('contract_id').references(() => procurementVendorContracts.id, { onDelete: 'set null' }),
    contractNumber: varchar('contract_number', { length: 100 }),
    status: varchar('status', { length: 50 }).notNull().default('DRAFT'), // DRAFT, PENDING_APPROVAL, APPROVED, SENT_TO_VENDOR, ACKNOWLEDGED, PARTIALLY_RECEIVED, FULLY_RECEIVED, CLOSED, CANCELLED
    totalGrossAmount: numeric('total_gross_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
    totalDiscountAmount: numeric('total_discount_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
    totalTaxAmount: numeric('total_tax_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
    totalNetAmount: numeric('total_net_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
    deliveryLocation: text('delivery_location').notNull(),
    expectedDeliveryDate: timestamp('expected_delivery_date', { withTimezone: true }).notNull(),
    paymentTerms: varchar('payment_terms', { length: 100 }).notNull().default('NET_30'),
    shippingTerms: varchar('shipping_terms', { length: 100 }).default('FOB_DESTINATION'),
    isEmergency: boolean('is_emergency').notNull().default(false),
    approvedBy: varchar('approved_by', { length: 150 }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_proc_po_tenant').on(table.tenantId),
    index('idx_proc_po_org').on(table.organizationId),
    index('idx_proc_po_num').on(table.poNumber),
    index('idx_proc_po_vendor').on(table.vendorId),
    index('idx_proc_po_status').on(table.status)
  ]
);

/**
 * 12. Purchase Order Items
 */
export const purchaseOrderItems = clinicalSchema.table(
  'purchase_order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    purchaseOrderId: uuid('purchase_order_id')
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: 'cascade' }),
    procurementItemId: uuid('procurement_item_id')
      .notNull()
      .references(() => procurementItems.id, { onDelete: 'cascade' }),
    itemCode: varchar('item_code', { length: 50 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    orderedQuantity: integer('ordered_quantity').notNull(),
    receivedQuantity: integer('received_quantity').notNull().default(0),
    unit: varchar('unit', { length: 50 }).notNull(),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    grossAmount: numeric('gross_amount', { precision: 12, scale: 2 }).notNull(),
    discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default('0.00'),
    taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0.00'),
    netAmount: numeric('net_amount', { precision: 12, scale: 2 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('PENDING_RECEIPT'), // PENDING_RECEIPT, PARTIALLY_RECEIVED, FULLY_RECEIVED, CANCELLED
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_proc_poitem_tenant').on(table.tenantId),
    index('idx_proc_poitem_po').on(table.purchaseOrderId)
  ]
);

/**
 * 13. Goods Receipt Notes (GRN)
 */
export const goodsReceipts = clinicalSchema.table(
  'goods_receipts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => operationalOrganizations.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => operationalFacilities.id, { onDelete: 'set null' }),
    grnNumber: varchar('grn_number', { length: 100 }).notNull().unique(),
    purchaseOrderId: uuid('purchase_order_id')
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: 'cascade' }),
    poNumber: varchar('po_number', { length: 100 }).notNull(),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => procurementVendors.id, { onDelete: 'cascade' }),
    vendorName: varchar('vendor_name', { length: 255 }).notNull(),
    deliveryDocumentNumber: varchar('delivery_document_number', { length: 100 }),
    invoiceReferenceNumber: varchar('invoice_reference_number', { length: 100 }),
    receivedDate: timestamp('received_date', { withTimezone: true }).notNull(),
    receivingDepartment: varchar('receiving_department', { length: 150 }).notNull(),
    storeName: varchar('store_name', { length: 150 }).notNull(),
    receivedBy: varchar('received_by', { length: 150 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('PENDING_INSPECTION'), // PENDING_INSPECTION, INSPECTED_PASSED, INSPECTED_FAILED, PARTIALLY_ACCEPTED, COMPLETED, QUARANTINED
    totalReceivedItems: integer('total_received_items').notNull().default(0),
    totalAcceptedItems: integer('total_accepted_items').notNull().default(0),
    totalRejectedItems: integer('total_rejected_items').notNull().default(0),
    remarks: text('remarks'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_proc_grn_tenant').on(table.tenantId),
    index('idx_proc_grn_org').on(table.organizationId),
    index('idx_proc_grn_num').on(table.grnNumber),
    index('idx_proc_grn_po').on(table.purchaseOrderId),
    index('idx_proc_grn_status').on(table.status)
  ]
);

/**
 * 14. Goods Receipt Items
 */
export const goodsReceiptItems = clinicalSchema.table(
  'goods_receipt_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    goodsReceiptId: uuid('goods_receipt_id')
      .notNull()
      .references(() => goodsReceipts.id, { onDelete: 'cascade' }),
    purchaseOrderItemId: uuid('purchase_order_item_id')
      .notNull()
      .references(() => purchaseOrderItems.id, { onDelete: 'cascade' }),
    procurementItemId: uuid('procurement_item_id')
      .notNull()
      .references(() => procurementItems.id, { onDelete: 'cascade' }),
    itemCode: varchar('item_code', { length: 50 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    receivedQuantity: integer('received_quantity').notNull(),
    acceptedQuantity: integer('accepted_quantity').notNull().default(0),
    rejectedQuantity: integer('rejected_quantity').notNull().default(0),
    shortQuantity: integer('short_quantity').default(0),
    excessQuantity: integer('excess_quantity').default(0),
    damagedQuantity: integer('damaged_quantity').default(0),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    batchNumber: varchar('batch_number', { length: 100 }),
    expiryDate: timestamp('expiry_date', { withTimezone: true }),
    serialNumber: varchar('serial_number', { length: 100 }),
    barcode: varchar('barcode', { length: 100 }),
    mfgDate: timestamp('mfg_date', { withTimezone: true }),
    status: varchar('status', { length: 50 }).notNull().default('PENDING_QC'), // PENDING_QC, ACCEPTED, REJECTED, QUARANTINED
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_proc_gritem_tenant').on(table.tenantId),
    index('idx_proc_gritem_grn').on(table.goodsReceiptId)
  ]
);

/**
 * 15. Quality Inspections
 */
export const procurementInspections = clinicalSchema.table(
  'procurement_inspections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => operationalOrganizations.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => operationalFacilities.id, { onDelete: 'set null' }),
    inspectionNumber: varchar('inspection_number', { length: 100 }).notNull().unique(),
    goodsReceiptId: uuid('goods_receipt_id')
      .notNull()
      .references(() => goodsReceipts.id, { onDelete: 'cascade' }),
    grnNumber: varchar('grn_number', { length: 100 }).notNull(),
    inspectorId: varchar('inspector_id', { length: 150 }).notNull(),
    inspectionDate: timestamp('inspection_date', { withTimezone: true }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('PASSED'), // PENDING_INSPECTION, PASSED, FAILED, PARTIAL_PASS, QUARANTINED
    totalInspectedQuantity: integer('total_inspected_quantity').notNull(),
    totalPassedQuantity: integer('total_passed_quantity').notNull().default(0),
    totalFailedQuantity: integer('total_failed_quantity').notNull().default(0),
    totalQuarantinedQuantity: integer('total_quarantined_quantity').notNull().default(0),
    quarantineReason: text('quarantine_reason'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_proc_qc_tenant').on(table.tenantId),
    index('idx_proc_qc_org').on(table.organizationId),
    index('idx_proc_qc_grn').on(table.goodsReceiptId),
    index('idx_proc_qc_status').on(table.status)
  ]
);

/**
 * 16. Quality Inspection Items
 */
export const procurementInspectionItems = clinicalSchema.table(
  'procurement_inspection_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    inspectionId: uuid('inspection_id')
      .notNull()
      .references(() => procurementInspections.id, { onDelete: 'cascade' }),
    goodsReceiptItemId: uuid('goods_receipt_item_id')
      .notNull()
      .references(() => goodsReceiptItems.id, { onDelete: 'cascade' }),
    procurementItemId: uuid('procurement_item_id')
      .notNull()
      .references(() => procurementItems.id, { onDelete: 'cascade' }),
    itemCode: varchar('item_code', { length: 50 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    inspectedQuantity: integer('inspected_quantity').notNull(),
    passedQuantity: integer('passed_quantity').notNull().default(0),
    failedQuantity: integer('failed_quantity').notNull().default(0),
    quarantinedQuantity: integer('quarantined_quantity').notNull().default(0),
    defectCategory: varchar('defect_category', { length: 100 }), // PACKAGING_DAMAGE, EXPIRED_LOT, TEMPERATURE_BREACH, SPECIFICATION_MISMATCH, CONTAMINATION, MISSING_COA
    rejectionReason: text('rejection_reason'),
    checklist: jsonb('checklist').default({}),
    status: varchar('status', { length: 50 }).notNull().default('PASSED'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_proc_qcitem_tenant').on(table.tenantId),
    index('idx_proc_qcitem_qc').on(table.inspectionId)
  ]
);

/**
 * 17. Vendor Returns (RTV)
 */
export const vendorReturns = clinicalSchema.table(
  'vendor_returns',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => operationalOrganizations.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => operationalFacilities.id, { onDelete: 'set null' }),
    returnNumber: varchar('return_number', { length: 100 }).notNull().unique(),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => procurementVendors.id, { onDelete: 'cascade' }),
    vendorName: varchar('vendor_name', { length: 255 }).notNull(),
    goodsReceiptId: uuid('goods_receipt_id').references(() => goodsReceipts.id, { onDelete: 'set null' }),
    grnNumber: varchar('grn_number', { length: 100 }),
    purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id, { onDelete: 'set null' }),
    poNumber: varchar('po_number', { length: 100 }),
    status: varchar('status', { length: 50 }).notNull().default('DRAFT'), // DRAFT, REQUESTED, APPROVED, SENT, ACKNOWLEDGED, CREDIT_PENDING, CLOSED
    totalReturnAmount: numeric('total_return_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
    reason: text('reason').notNull(),
    vendorAcknowledgementRef: varchar('vendor_acknowledgement_ref', { length: 100 }),
    creditNoteRef: varchar('credit_note_ref', { length: 100 }),
    requestedBy: varchar('requested_by', { length: 150 }).notNull(),
    approvedBy: varchar('approved_by', { length: 150 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_proc_rtv_tenant').on(table.tenantId),
    index('idx_proc_rtv_org').on(table.organizationId),
    index('idx_proc_rtv_num').on(table.returnNumber),
    index('idx_proc_rtv_vendor').on(table.vendorId),
    index('idx_proc_rtv_status').on(table.status)
  ]
);

/**
 * 18. Vendor Return Items
 */
export const vendorReturnItems = clinicalSchema.table(
  'vendor_return_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    vendorReturnId: uuid('vendor_return_id')
      .notNull()
      .references(() => vendorReturns.id, { onDelete: 'cascade' }),
    procurementItemId: uuid('procurement_item_id')
      .notNull()
      .references(() => procurementItems.id, { onDelete: 'cascade' }),
    itemCode: varchar('item_code', { length: 50 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    returnQuantity: integer('return_quantity').notNull(),
    unitCost: numeric('unit_cost', { precision: 12, scale: 2 }).notNull(),
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
    batchNumber: varchar('batch_number', { length: 100 }),
    serialNumber: varchar('serial_number', { length: 100 }),
    reason: text('reason').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_proc_rtvitem_tenant').on(table.tenantId),
    index('idx_proc_rtvitem_rtv').on(table.vendorReturnId)
  ]
);

/**
 * 19. Purchase Invoices (Supplier Bills)
 */
export const purchaseInvoices = clinicalSchema.table(
  'purchase_invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => operationalOrganizations.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => operationalFacilities.id, { onDelete: 'set null' }),
    invoiceNumber: varchar('invoice_number', { length: 100 }).notNull().unique(),
    vendorInvoiceNumber: varchar('vendor_invoice_number', { length: 100 }).notNull(),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => procurementVendors.id, { onDelete: 'cascade' }),
    vendorName: varchar('vendor_name', { length: 255 }).notNull(),
    purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id, { onDelete: 'set null' }),
    poNumber: varchar('po_number', { length: 100 }),
    goodsReceiptId: uuid('goods_receipt_id').references(() => goodsReceipts.id, { onDelete: 'set null' }),
    grnNumber: varchar('grn_number', { length: 100 }),
    invoiceDate: timestamp('invoice_date', { withTimezone: true }).notNull(),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull().default('0.00'),
    taxAmount: numeric('tax_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
    discountAmount: numeric('discount_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
    totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
    paidAmount: numeric('paid_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
    outstandingAmount: numeric('outstanding_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
    matchingStatus: varchar('matching_status', { length: 50 }).notNull().default('PENDING_MATCH'), // PENDING_MATCH, MATCHED_2WAY, MATCHED_3WAY, VARIANCE_FLAGGED, APPROVED_MANUAL, REJECTED
    paymentStatus: varchar('payment_status', { length: 50 }).notNull().default('UNPAID'), // UNPAID, PARTIALLY_PAID, PAID, ON_HOLD, DISPUTED, CANCELLED
    paymentReference: varchar('payment_reference', { length: 100 }),
    paymentDueDate: timestamp('payment_due_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_proc_pinv_tenant').on(table.tenantId),
    index('idx_proc_pinv_org').on(table.organizationId),
    index('idx_proc_pinv_num').on(table.invoiceNumber),
    index('idx_proc_pinv_vendor').on(table.vendorId),
    index('idx_proc_pinv_status').on(table.paymentStatus),
    index('idx_proc_pinv_match').on(table.matchingStatus)
  ]
);

/**
 * 20. Purchase Invoice Matches (2-Way / 3-Way Engine)
 */
export const purchaseInvoiceMatches = clinicalSchema.table(
  'purchase_invoice_matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    purchaseInvoiceId: uuid('purchase_invoice_id')
      .notNull()
      .references(() => purchaseInvoices.id, { onDelete: 'cascade' }),
    purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id, { onDelete: 'set null' }),
    goodsReceiptId: uuid('goods_receipt_id').references(() => goodsReceipts.id, { onDelete: 'set null' }),
    matchingType: varchar('matching_type', { length: 50 }).notNull().default('THREE_WAY'), // TWO_WAY, THREE_WAY
    status: varchar('status', { length: 50 }).notNull().default('EXACT_MATCH'), // EXACT_MATCH, TOLERANCE_PASSED, PRICE_MISMATCH, QUANTITY_MISMATCH, TAX_MISMATCH, GRN_MISSING
    poAmount: numeric('po_amount', { precision: 14, scale: 2 }).default('0.00'),
    grnAmount: numeric('grn_amount', { precision: 14, scale: 2 }).default('0.00'),
    invoiceAmount: numeric('invoice_amount', { precision: 14, scale: 2 }).notNull(),
    quantityVariance: integer('quantity_variance').default(0),
    priceVariance: numeric('price_variance', { precision: 12, scale: 2 }).default('0.00'),
    taxVariance: numeric('tax_variance', { precision: 12, scale: 2 }).default('0.00'),
    totalVariance: numeric('total_variance', { precision: 12, scale: 2 }).default('0.00'),
    discrepancyDetails: text('discrepancy_details'),
    matchedBy: varchar('matched_by', { length: 150 }).notNull(),
    matchedAt: timestamp('matched_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_proc_match_tenant').on(table.tenantId),
    index('idx_proc_match_pinv').on(table.purchaseInvoiceId),
    index('idx_proc_match_status').on(table.status)
  ]
);

/**
 * 21. Procurement Exceptions & Variance Workflows
 */
export const procurementExceptions = clinicalSchema.table(
  'procurement_exceptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => operationalOrganizations.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => operationalFacilities.id, { onDelete: 'set null' }),
    exceptionNumber: varchar('exception_number', { length: 100 }).notNull().unique(),
    exceptionType: varchar('exception_type', { length: 50 }).notNull(), // PRICE_OVERCHARGE, QUANTITY_DISCREPANCY, QUALITY_FAILURE, DAMAGED_GOODS, UNAUTHORIZED_PO, DUPLICATE_BILLING, UNAPPROVED_EXPENSE
    severity: varchar('severity', { length: 50 }).notNull().default('MEDIUM'), // LOW, MEDIUM, HIGH, CRITICAL
    status: varchar('status', { length: 50 }).notNull().default('OPEN'), // OPEN, UNDER_INVESTIGATION, WAIVED_APPROVED, VENDOR_CREDITED, ESCALATED, CLOSED
    purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id, { onDelete: 'set null' }),
    goodsReceiptId: uuid('goods_receipt_id').references(() => goodsReceipts.id, { onDelete: 'set null' }),
    purchaseInvoiceId: uuid('purchase_invoice_id').references(() => purchaseInvoices.id, { onDelete: 'set null' }),
    vendorId: uuid('vendor_id').references(() => procurementVendors.id, { onDelete: 'set null' }),
    description: text('description').notNull(),
    varianceAmount: numeric('variance_amount', { precision: 12, scale: 2 }).default('0.00'),
    assignedTo: varchar('assigned_to', { length: 150 }),
    resolution: text('resolution'),
    resolvedBy: varchar('resolved_by', { length: 150 }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_proc_exc_tenant').on(table.tenantId),
    index('idx_proc_exc_org').on(table.organizationId),
    index('idx_proc_exc_num').on(table.exceptionNumber),
    index('idx_proc_exc_type').on(table.exceptionType),
    index('idx_proc_exc_status').on(table.status)
  ]
);

/**
 * 22. Procurement Audit Traces (Cryptographically chained tamper-evident journal)
 */
export const procurementAuditTraces = clinicalSchema.table(
  'procurement_audit_traces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    traceId: varchar('trace_id', { length: 100 }).notNull().unique(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => operationalOrganizations.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => operationalFacilities.id, { onDelete: 'set null' }),
    actorId: varchar('actor_id', { length: 255 }).notNull(),
    actorRole: varchar('actor_role', { length: 100 }).notNull(),
    operation: varchar('operation', { length: 100 }).notNull(), // VENDOR_REGISTERED, VENDOR_SUSPENDED, CONTRACT_APPROVED, REQUISITION_CREATED, REQUISITION_APPROVED, PO_ISSUED, GRN_PROCESSED, QC_PASSED, QC_REJECTED, RETURN_DISPATCHED, INVOICE_MATCHED, EXCEPTION_RESOLVED, EMERGENCY_PURCHASE
    entityType: varchar('entity_type', { length: 50 }).notNull(), // VENDOR, CONTRACT, ITEM, REQUISITION, PURCHASE_ORDER, GOODS_RECEIPT, INSPECTION, VENDOR_RETURN, INVOICE, EXCEPTION
    entityId: varchar('entity_id', { length: 100 }).notNull(),
    purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id, { onDelete: 'set null' }),
    goodsReceiptId: uuid('goods_receipt_id').references(() => goodsReceipts.id, { onDelete: 'set null' }),
    purchaseInvoiceId: uuid('purchase_invoice_id').references(() => purchaseInvoices.id, { onDelete: 'set null' }),
    vendorId: uuid('vendor_id').references(() => procurementVendors.id, { onDelete: 'set null' }),
    beforeSnapshot: jsonb('before_snapshot'),
    afterSnapshot: jsonb('after_snapshot'),
    financialImpact: numeric('financial_impact', { precision: 14, scale: 2 }).default('0.00'),
    reason: text('reason').notNull(),
    ipAddress: varchar('ip_address', { length: 100 }),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
    operationStatus: varchar('operation_status', { length: 50 }).notNull().default('SUCCESS'),
    hashPointer: varchar('hash_pointer', { length: 128 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_proc_audit_tenant').on(table.tenantId),
    index('idx_proc_audit_trace').on(table.traceId),
    index('idx_proc_audit_entity').on(table.entityType, table.entityId),
    index('idx_proc_audit_po').on(table.purchaseOrderId),
    index('idx_proc_audit_op').on(table.operation)
  ]
);

// Types exports for Phase 2.11
export type ProcurementVendor = typeof procurementVendors.$inferSelect;
export type NewProcurementVendor = typeof procurementVendors.$inferInsert;

export type ProcurementVendorContact = typeof procurementVendorContacts.$inferSelect;
export type NewProcurementVendorContact = typeof procurementVendorContacts.$inferInsert;

export type ProcurementVendorDocument = typeof procurementVendorDocuments.$inferSelect;
export type NewProcurementVendorDocument = typeof procurementVendorDocuments.$inferInsert;

export type ProcurementVendorContract = typeof procurementVendorContracts.$inferSelect;
export type NewProcurementVendorContract = typeof procurementVendorContracts.$inferInsert;

export type ProcurementVendorContractItem = typeof procurementVendorContractItems.$inferSelect;
export type NewProcurementVendorContractItem = typeof procurementVendorContractItems.$inferInsert;

export type ProcurementItem = typeof procurementItems.$inferSelect;
export type NewProcurementItem = typeof procurementItems.$inferInsert;

export type ProcurementItemVendorMapping = typeof procurementItemVendorMappings.$inferSelect;
export type NewProcurementItemVendorMapping = typeof procurementItemVendorMappings.$inferInsert;

export type PurchaseRequisition = typeof purchaseRequisitions.$inferSelect;
export type NewPurchaseRequisition = typeof purchaseRequisitions.$inferInsert;

export type PurchaseRequisitionItem = typeof purchaseRequisitionItems.$inferSelect;
export type NewPurchaseRequisitionItem = typeof purchaseRequisitionItems.$inferInsert;

export type ProcurementApproval = typeof procurementApprovals.$inferSelect;
export type NewProcurementApproval = typeof procurementApprovals.$inferInsert;

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert;

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type NewPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;

export type GoodsReceipt = typeof goodsReceipts.$inferSelect;
export type NewGoodsReceipt = typeof goodsReceipts.$inferInsert;

export type GoodsReceiptItem = typeof goodsReceiptItems.$inferSelect;
export type NewGoodsReceiptItem = typeof goodsReceiptItems.$inferInsert;

export type ProcurementInspection = typeof procurementInspections.$inferSelect;
export type NewProcurementInspection = typeof procurementInspections.$inferInsert;

export type ProcurementInspectionItem = typeof procurementInspectionItems.$inferSelect;
export type NewProcurementInspectionItem = typeof procurementInspectionItems.$inferInsert;

export type VendorReturn = typeof vendorReturns.$inferSelect;
export type NewVendorReturn = typeof vendorReturns.$inferInsert;

export type VendorReturnItem = typeof vendorReturnItems.$inferSelect;
export type NewVendorReturnItem = typeof vendorReturnItems.$inferInsert;

export type PurchaseInvoice = typeof purchaseInvoices.$inferSelect;
export type NewPurchaseInvoice = typeof purchaseInvoices.$inferInsert;

export type PurchaseInvoiceMatch = typeof purchaseInvoiceMatches.$inferSelect;
export type NewPurchaseInvoiceMatch = typeof purchaseInvoiceMatches.$inferInsert;

export type ProcurementException = typeof procurementExceptions.$inferSelect;
export type NewProcurementException = typeof procurementExceptions.$inferInsert;

export type ProcurementAuditTrace = typeof procurementAuditTraces.$inferSelect;
export type NewProcurementAuditTrace = typeof procurementAuditTraces.$inferInsert;




/**
 * ============================================================================
 * Phase 2.12: INPATIENT (IPD), WARD & BED MANAGEMENT (ADT)
 * ============================================================================
 */

/**
 * 1. Inpatient Clinical Units
 */
export const inpatientUnits = clinicalSchema.table(
  'inpatient_units',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    unitCode: varchar('unit_code', { length: 50 }).notNull(),
    unitName: varchar('unit_name', { length: 255 }).notNull(),
    unitType: varchar('unit_type', { length: 50 }).notNull().default('INPATIENT_DIVISION'), // CRITICAL_CARE, GENERAL_MEDICINE, SURGICAL_CARE, MATERNAL_CHILD, ISOLATION_UNIT
    specialty: varchar('specialty', { length: 100 }).notNull().default('MULTI_SPECIALTY'),
    building: varchar('building', { length: 100 }).notNull().default('Main Hospital Tower'),
    floor: varchar('floor', { length: 50 }).notNull().default('Level 3'),
    headNurseId: uuid('head_nurse_id'),
    clinicalDirectorId: uuid('clinical_director_id'),
    totalCapacity: integer('total_capacity').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    tenantBranchUnitIdx: index('inpatient_units_tenant_branch_idx').on(table.tenantId, table.branchId),
    unitCodeUnq: uniqueIndex('inpatient_units_code_unq').on(table.tenantId, table.branchId, table.unitCode)
  })
);

/**
 * 2. Inpatient Wards
 */
export const inpatientWards = clinicalSchema.table(
  'inpatient_wards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    unitId: uuid('unit_id').notNull().references(() => inpatientUnits.id, { onDelete: 'cascade' }),
    wardCode: varchar('ward_code', { length: 50 }).notNull(),
    wardName: varchar('ward_name', { length: 255 }).notNull(),
    wardType: varchar('ward_type', { length: 50 }).notNull(), // GENERAL, SEMI_PRIVATE, PRIVATE, DELUXE, ICU, HDU, CCU, NICU, PICU, ISOLATION, POST_OP, MATERNITY
    careLevel: varchar('care_level', { length: 50 }).notNull().default('TERTIARY_CARE'), // LEVEL_1_OBSERVATION, LEVEL_2_STEPDOWN, LEVEL_3_ICU
    genderPolicy: varchar('gender_policy', { length: 30 }).notNull().default('ALL'), // MALE_ONLY, FEMALE_ONLY, ALL, PEDIATRIC
    building: varchar('building', { length: 100 }).notNull(),
    floor: varchar('floor', { length: 50 }).notNull(),
    wing: varchar('wing', { length: 50 }).default('North Wing'),
    nursingStationName: varchar('nursing_station_name', { length: 100 }).notNull().default('Central Station'),
    isolationCapable: boolean('isolation_capable').notNull().default(false),
    ventilatorCapable: boolean('ventilator_capable').notNull().default(false),
    totalBeds: integer('total_beds').notNull().default(0),
    activeBeds: integer('active_beds').notNull().default(0),
    occupiedBeds: integer('occupied_beds').notNull().default(0),
    blockedBeds: integer('blocked_beds').notNull().default(0),
    cleaningBeds: integer('cleaning_beds').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    tenantBranchWardIdx: index('inpatient_wards_tenant_branch_idx').on(table.tenantId, table.branchId),
    wardCodeUnq: uniqueIndex('inpatient_wards_code_unq').on(table.tenantId, table.branchId, table.wardCode)
  })
);

/**
 * 3. Inpatient Rooms
 */
export const inpatientRooms = clinicalSchema.table(
  'inpatient_rooms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    wardId: uuid('ward_id').notNull().references(() => inpatientWards.id, { onDelete: 'cascade' }),
    roomNumber: varchar('room_number', { length: 50 }).notNull(),
    roomClass: varchar('room_class', { length: 50 }).notNull().default('STANDARD'), // STANDARD, SUITE, DELUXE_SUITE, ISOLATION_NEGATIVE_PRESSURE, ICU_BAY
    bedCount: integer('bed_count').notNull().default(1),
    isNegativePressure: boolean('is_negative_pressure').notNull().default(false),
    hasAttachedBath: boolean('has_attached_bath').notNull().default(true),
    hasMedicalGas: boolean('has_medical_gas').notNull().default(true),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    tenantBranchRoomIdx: index('inpatient_rooms_tenant_branch_idx').on(table.tenantId, table.branchId),
    roomNumUnq: uniqueIndex('inpatient_rooms_num_unq').on(table.tenantId, table.branchId, table.wardId, table.roomNumber)
  })
);

/**
 * 4. Inpatient Beds
 */
export const inpatientBeds = clinicalSchema.table(
  'inpatient_beds',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    wardId: uuid('ward_id').notNull().references(() => inpatientWards.id, { onDelete: 'cascade' }),
    roomId: uuid('room_id').references(() => inpatientRooms.id, { onDelete: 'set null' }),
    bedCode: varchar('bed_code', { length: 50 }).notNull(),
    bedNumber: varchar('bed_number', { length: 50 }).notNull(),
    bedType: varchar('bed_type', { length: 50 }).notNull().default('STANDARD_ELECTRIC'), // STANDARD_ELECTRIC, ICU_CRITICAL, PEDIATRIC_CRIB, ISOLATION_BED, BIRTHING_BED, BARIATRIC
    bedClass: varchar('bed_class', { length: 50 }).notNull().default('GENERAL'), // GENERAL, SEMI_PRIVATE, PRIVATE, DELUXE, ICU, HDU
    status: varchar('status', { length: 50 }).notNull().default('AVAILABLE'), // AVAILABLE, RESERVED, OCCUPIED, BLOCKED, MAINTENANCE, CLEANING, OUT_OF_SERVICE
    genderEligibility: varchar('gender_eligibility', { length: 30 }).notNull().default('ALL'), // ALL, MALE, FEMALE
    hasOxygenPort: boolean('has_oxygen_port').notNull().default(true),
    hasSuctionPort: boolean('has_suction_port').notNull().default(true),
    hasVentilator: boolean('has_ventilator').notNull().default(false),
    hasCardiacMonitor: boolean('has_cardiac_monitor').notNull().default(false),
    dailyChargeRate: numeric('daily_charge_rate', { precision: 12, scale: 2 }).notNull().default('150.00'),
    currentPatientId: uuid('current_patient_id'),
    currentAdmissionId: uuid('current_admission_id'),
    lastCleanedAt: timestamp('last_cleaned_at', { withTimezone: true }),
    lastOccupiedAt: timestamp('last_occupied_at', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    tenantBranchBedIdx: index('inpatient_beds_tenant_branch_idx').on(table.tenantId, table.branchId),
    wardBedIdx: index('inpatient_beds_ward_idx').on(table.wardId, table.status),
    bedCodeUnq: uniqueIndex('inpatient_beds_code_unq').on(table.tenantId, table.branchId, table.bedCode)
  })
);

/**
 * 5. Bed Status History
 */
export const inpatientBedStatusHistory = clinicalSchema.table(
  'inpatient_bed_status_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    bedId: uuid('bed_id').notNull().references(() => inpatientBeds.id, { onDelete: 'cascade' }),
    previousStatus: varchar('previous_status', { length: 50 }).notNull(),
    newStatus: varchar('new_status', { length: 50 }).notNull(),
    patientId: uuid('patient_id'),
    admissionId: uuid('admission_id'),
    changedBy: varchar('changed_by', { length: 255 }).notNull(),
    reason: text('reason').notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    bedHistoryIdx: index('inpatient_bed_status_history_bed_idx').on(table.bedId, table.timestamp)
  })
);

/**
 * 6. Bed Reservations
 */
export const inpatientBedReservations = clinicalSchema.table(
  'inpatient_bed_reservations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    reservationNumber: varchar('reservation_number', { length: 100 }).notNull(),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 100 }).notNull(),
    wardId: uuid('ward_id').notNull().references(() => inpatientWards.id, { onDelete: 'cascade' }),
    bedId: uuid('bed_id').notNull().references(() => inpatientBeds.id, { onDelete: 'cascade' }),
    admissionRequestId: uuid('admission_request_id'),
    reservedFrom: timestamp('reserved_from', { withTimezone: true }).notNull(),
    reservedUntil: timestamp('reserved_until', { withTimezone: true }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('CONFIRMED'), // PENDING, CONFIRMED, EXPIRED, CANCELLED, CONVERTED
    priority: varchar('priority', { length: 30 }).notNull().default('ROUTINE'), // ROUTINE, URGENT, STAT_EMERGENCY
    reservedBy: varchar('reserved_by', { length: 255 }).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    reservationNumUnq: uniqueIndex('inpatient_bed_reservations_num_unq').on(table.tenantId, table.reservationNumber),
    bedTimeIdx: index('inpatient_bed_reservations_bed_time_idx').on(table.bedId, table.status, table.reservedFrom)
  })
);

/**
 * 7. Inpatient Admission Requests
 */
export const inpatientAdmissionRequests = clinicalSchema.table(
  'inpatient_admission_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    requestNumber: varchar('request_number', { length: 100 }).notNull(),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 100 }).notNull(),
    encounterId: uuid('encounter_id'),
    referringDoctorName: varchar('referring_doctor_name', { length: 255 }).notNull(),
    admittingDoctorName: varchar('admitting_doctor_name', { length: 255 }).notNull(),
    department: varchar('department', { length: 100 }).notNull(),
    specialty: varchar('specialty', { length: 100 }).notNull(),
    requestedWardType: varchar('requested_ward_type', { length: 50 }).notNull().default('GENERAL'),
    requestedBedClass: varchar('requested_bed_class', { length: 50 }).notNull().default('GENERAL'),
    admissionSource: varchar('admission_source', { length: 50 }).notNull().default('OPD'), // OPD, EMERGENCY, DIRECT_TRANSFER, POST_OP, ELECTIVE_SURGERY
    priority: varchar('priority', { length: 30 }).notNull().default('ROUTINE'), // ROUTINE, URGENT, STAT_EMERGENCY
    isEmergency: boolean('is_emergency').notNull().default(false),
    provisionalDiagnosis: text('provisional_diagnosis').notNull(),
    admissionReason: text('admission_reason').notNull(),
    expectedLengthOfStayDays: integer('expected_length_of_stay_days').notNull().default(3),
    insurancePreAuthRef: varchar('insurance_pre_auth_ref', { length: 100 }),
    status: varchar('status', { length: 50 }).notNull().default('SUBMITTED'), // DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, BED_PENDING, BED_ASSIGNED, ADMITTED, REJECTED, CANCELLED
    decisionNotes: text('decision_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    reqNumUnq: uniqueIndex('inpatient_adm_req_num_unq').on(table.tenantId, table.requestNumber),
    tenantStatusIdx: index('inpatient_adm_req_status_idx').on(table.tenantId, table.branchId, table.status)
  })
);

/**
 * 8. Inpatient Admissions (ADT Master Canonical)
 */
export const inpatientAdmissions = clinicalSchema.table(
  'inpatient_admissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    admissionNumber: varchar('admission_number', { length: 100 }).notNull(),
    admissionRequestId: uuid('admission_request_id').references(() => inpatientAdmissionRequests.id, { onDelete: 'set null' }),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 100 }).notNull(),
    patientGender: varchar('patient_gender', { length: 20 }).notNull(),
    patientAge: integer('patient_age').notNull(),
    encounterId: uuid('encounter_id'),
    admittingDoctorName: varchar('admitting_doctor_name', { length: 255 }).notNull(),
    attendingConsultantName: varchar('attending_consultant_name', { length: 255 }).notNull(),
    department: varchar('department', { length: 100 }).notNull(),
    specialty: varchar('specialty', { length: 100 }).notNull(),
    wardId: uuid('ward_id').notNull().references(() => inpatientWards.id, { onDelete: 'cascade' }),
    wardName: varchar('ward_name', { length: 255 }).notNull(),
    bedId: uuid('bed_id').notNull().references(() => inpatientBeds.id, { onDelete: 'cascade' }),
    bedCode: varchar('bed_code', { length: 50 }).notNull(),
    admissionType: varchar('admission_type', { length: 50 }).notNull().default('ELECTIVE'), // ELECTIVE, EMERGENCY, URGENT, DIRECT_TRANSFER, POST_OP, DAY_CARE
    admissionSource: varchar('admission_source', { length: 50 }).notNull().default('OPD'),
    admissionDateTime: timestamp('admission_date_time', { withTimezone: true }).notNull().defaultNow(),
    expectedDischargeDate: timestamp('expected_discharge_date', { withTimezone: true }).notNull(),
    actualDischargeDateTime: timestamp('actual_discharge_date_time', { withTimezone: true }),
    primaryDiagnosis: text('primary_diagnosis').notNull(),
    secondaryDiagnosis: text('secondary_diagnosis'),
    isolationRequired: boolean('isolation_required').notNull().default(false),
    payerType: varchar('payer_type', { length: 50 }).notNull().default('SELF_PAY'), // SELF_PAY, INSURANCE_TPA, CORPORATE_SPONSOR, GOVERNMENT_SCHEME
    payerName: varchar('payer_name', { length: 255 }),
    insuranceClaimNumber: varchar('insurance_claim_number', { length: 100 }),
    financialDepositAmount: numeric('financial_deposit_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
    status: varchar('status', { length: 50 }).notNull().default('ADMITTED'), // PLANNED, ADMISSION_PENDING, ADMITTED, TRANSFER_PENDING, DISCHARGE_PLANNED, DISCHARGE_PENDING, DISCHARGED, CANCELLED
    dischargeDisposition: varchar('discharge_disposition', { length: 50 }), // HOME_ROUTINE, TRANSFERRED_FACILITY, AMA_LEFT_AGAINST_ADVICE, DECEASED, REHAB_CARE
    dischargeSummaryFinalized: boolean('discharge_summary_finalized').notNull().default(false),
    billingCleared: boolean('billing_cleared').notNull().default(false),
    insuranceCleared: boolean('insurance_cleared').notNull().default(false),
    clinicalClearance: boolean('clinical_clearance').notNull().default(false),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    admNumUnq: uniqueIndex('inpatient_admissions_num_unq').on(table.tenantId, table.admissionNumber),
    tenantPatientIdx: index('inpatient_admissions_patient_idx').on(table.tenantId, table.patientId, table.status),
    wardBedStatusIdx: index('inpatient_admissions_ward_bed_idx').on(table.wardId, table.bedId, table.status)
  })
);

/**
 * 9. Admission Approvals
 */
export const inpatientAdmissionApprovals = clinicalSchema.table(
  'inpatient_admission_approvals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    requestId: uuid('request_id').notNull().references(() => inpatientAdmissionRequests.id, { onDelete: 'cascade' }),
    approverId: uuid('approver_id'),
    approverName: varchar('approver_name', { length: 255 }).notNull(),
    approverRole: varchar('approver_role', { length: 100 }).notNull(),
    decision: varchar('decision', { length: 50 }).notNull(), // APPROVED, REJECTED, ESCALATED, CORRECTION_REQUIRED
    allocatedWardId: uuid('allocated_ward_id'),
    allocatedBedId: uuid('allocated_bed_id'),
    justification: text('justification').notNull(),
    decisionTimestamp: timestamp('decision_timestamp', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    requestApprovalIdx: index('inpatient_adm_approvals_req_idx').on(table.requestId)
  })
);

/**
 * 10. Inpatient Bed Allocations
 */
export const inpatientBedAllocations = clinicalSchema.table(
  'inpatient_bed_allocations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    admissionId: uuid('admission_id').notNull().references(() => inpatientAdmissions.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    wardId: uuid('ward_id').notNull().references(() => inpatientWards.id, { onDelete: 'cascade' }),
    bedId: uuid('bed_id').notNull().references(() => inpatientBeds.id, { onDelete: 'cascade' }),
    allocatedFrom: timestamp('allocated_from', { withTimezone: true }).notNull().defaultNow(),
    allocatedTo: timestamp('allocated_to', { withTimezone: true }),
    status: varchar('status', { length: 50 }).notNull().default('OCCUPIED'), // REQUESTED, RESERVED, ALLOCATED, OCCUPIED, RELEASE_PENDING, RELEASED, CANCELLED
    allocationType: varchar('allocation_type', { length: 50 }).notNull().default('ADMISSION'), // ADMISSION, TRANSFER_INTERNAL, ICU_STEPDOWN, ISOLATION_STEPUP, EMERGENCY_OVERFLOW
    allocatedBy: varchar('allocated_by', { length: 255 }).notNull(),
    releasedBy: varchar('released_by', { length: 255 }),
    releaseReason: text('release_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    admissionBedIdx: index('inpatient_bed_allocations_adm_bed_idx').on(table.admissionId, table.bedId, table.status)
  })
);

/**
 * 11. Patient Location History (Immutable)
 */
export const inpatientPatientLocations = clinicalSchema.table(
  'inpatient_patient_locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    admissionId: uuid('admission_id').notNull().references(() => inpatientAdmissions.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    wardId: uuid('ward_id').notNull().references(() => inpatientWards.id, { onDelete: 'cascade' }),
    wardName: varchar('ward_name', { length: 255 }).notNull(),
    bedId: uuid('bed_id').notNull().references(() => inpatientBeds.id, { onDelete: 'cascade' }),
    bedCode: varchar('bed_code', { length: 50 }).notNull(),
    roomNumber: varchar('room_number', { length: 50 }),
    locationStart: timestamp('location_start', { withTimezone: true }).notNull().defaultNow(),
    locationEnd: timestamp('location_end', { withTimezone: true }),
    movementType: varchar('movement_type', { length: 50 }).notNull().default('ADMISSION_ENTRY'), // ADMISSION_ENTRY, WARD_TRANSFER, BED_SHIFT, TEMPORARY_OT, TEMPORARY_DIAGNOSTICS, DISCHARGE_EXIT
    transferredBy: varchar('transferred_by', { length: 255 }).notNull(),
    clinicalJustification: text('clinical_justification')
  },
  (table) => ({
    patientLocationHistoryIdx: index('inpatient_patient_loc_adm_idx').on(table.admissionId, table.locationStart)
  })
);

/**
 * 12. Inpatient Transfers
 */
export const inpatientTransfers = clinicalSchema.table(
  'inpatient_transfers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    transferNumber: varchar('transfer_number', { length: 100 }).notNull(),
    admissionId: uuid('admission_id').notNull().references(() => inpatientAdmissions.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 100 }).notNull(),
    sourceWardId: uuid('source_ward_id').notNull().references(() => inpatientWards.id, { onDelete: 'cascade' }),
    sourceWardName: varchar('source_ward_name', { length: 255 }).notNull(),
    sourceBedId: uuid('source_bed_id').notNull().references(() => inpatientBeds.id, { onDelete: 'cascade' }),
    sourceBedCode: varchar('source_bed_code', { length: 50 }).notNull(),
    destinationWardId: uuid('destination_ward_id').notNull().references(() => inpatientWards.id, { onDelete: 'cascade' }),
    destinationWardName: varchar('destination_ward_name', { length: 255 }).notNull(),
    destinationBedId: uuid('destination_bed_id').references(() => inpatientBeds.id, { onDelete: 'set null' }),
    destinationBedCode: varchar('destination_bed_code', { length: 50 }),
    transferType: varchar('transfer_type', { length: 50 }).notNull().default('CLINICAL_ESCALATION'), // CLINICAL_ESCALATION, STEPDOWN, ISOLATION, PATIENT_REQUEST, GENDER_ALIGNMENT, POST_OPERATIVE
    priority: varchar('priority', { length: 30 }).notNull().default('ROUTINE'), // ROUTINE, URGENT, STAT_EMERGENCY
    transferReason: text('transfer_reason').notNull(),
    requestingDoctorName: varchar('requesting_doctor_name', { length: 255 }).notNull(),
    transportRequirement: varchar('transport_requirement', { length: 50 }).notNull().default('WHEELCHAIR'), // WHEELCHAIR, STRETCHER, OXYGEN_ESCORT, CRITICAL_CARE_TRANSPORT
    nursingHandoffNotes: text('nursing_handoff_notes'),
    status: varchar('status', { length: 50 }).notNull().default('REQUESTED'), // REQUESTED, APPROVED, BED_PENDING, READY_FOR_TRANSFER, IN_TRANSIT, COMPLETED, CANCELLED
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    transferNumUnq: uniqueIndex('inpatient_transfers_num_unq').on(table.tenantId, table.transferNumber),
    transferStatusIdx: index('inpatient_transfers_status_idx').on(table.tenantId, table.branchId, table.status)
  })
);

/**
 * 13. Inpatient Transfer Approvals
 */
export const inpatientTransferApprovals = clinicalSchema.table(
  'inpatient_transfer_approvals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    transferId: uuid('transfer_id').notNull().references(() => inpatientTransfers.id, { onDelete: 'cascade' }),
    approverName: varchar('approver_name', { length: 255 }).notNull(),
    approverRole: varchar('approver_role', { length: 100 }).notNull(),
    decision: varchar('decision', { length: 50 }).notNull(), // APPROVED, REJECTED
    assignedBedId: uuid('assigned_bed_id'),
    justification: text('justification').notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    transferApprovalIdx: index('inpatient_transfer_approvals_idx').on(table.transferId)
  })
);

/**
 * 14. Inpatient Care Teams
 */
export const inpatientCareTeams = clinicalSchema.table(
  'inpatient_care_teams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    admissionId: uuid('admission_id').notNull().references(() => inpatientAdmissions.id, { onDelete: 'cascade' }),
    staffId: uuid('staff_id'),
    staffName: varchar('staff_name', { length: 255 }).notNull(),
    role: varchar('role', { length: 100 }).notNull(), // ATTENDING_PHYSICIAN, PRIMARY_NURSE, CONSULTING_SPECIALIST, RESIDENT_DOCTOR, CLINICAL_PHARMACIST, DIETITIAN, PHYSIOTHERAPIST
    isPrimary: boolean('is_primary').notNull().default(false),
    assignedFrom: timestamp('assigned_from', { withTimezone: true }).notNull().defaultNow(),
    assignedTo: timestamp('assigned_to', { withTimezone: true }),
    notes: text('notes')
  },
  (table) => ({
    careTeamAdmIdx: index('inpatient_care_teams_adm_idx').on(table.admissionId, table.isPrimary)
  })
);

/**
 * 15. Inpatient Nursing Assessments
 */
export const inpatientNursingAssessments = clinicalSchema.table(
  'inpatient_nursing_assessments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    admissionId: uuid('admission_id').notNull().references(() => inpatientAdmissions.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    assessedBy: varchar('assessed_by', { length: 255 }).notNull(),
    shiftType: varchar('shift_type', { length: 50 }).notNull().default('MORNING_SHIFT'), // MORNING_SHIFT, EVENING_SHIFT, NIGHT_SHIFT
    assessmentType: varchar('assessment_type', { length: 50 }).notNull().default('INITIAL_ADMISSION'), // INITIAL_ADMISSION, SHIFT_HANDOVER, POST_PROCEDURE, CLINICAL_DETERIORATION
    fallRiskScore: integer('fall_risk_score').notNull().default(0), // Morse Fall Scale / Stratify
    fallRiskLevel: varchar('fall_risk_level', { length: 30 }).notNull().default('LOW'), // LOW, MEDIUM, HIGH
    pressureInjuryRiskScore: integer('pressure_injury_risk_score').notNull().default(20), // Braden Scale
    pressureInjuryRiskLevel: varchar('pressure_injury_risk_level', { length: 30 }).notNull().default('LOW'),
    painScore: integer('pain_score').notNull().default(0), // 0 to 10 scale
    consciousnessLevel: varchar('consciousness_level', { length: 50 }).notNull().default('ALERT'), // ALERT, VOICE_RESPONSIVE, PAIN_RESPONSIVE, UNRESPONSIVE (AVPU)
    mobilityStatus: varchar('mobility_status', { length: 50 }).notNull().default('INDEPENDENT'), // INDEPENDENT, ASSISTED_1_PERSON, ASSISTED_2_PERSON, BED_BOUND
    dietaryIntakeLevel: varchar('dietary_intake_level', { length: 50 }).notNull().default('NORMAL_ORAL'), // NORMAL_ORAL, DIABETIC_ORAL, NPO_FASTING, ENTERAL_TUBE, TOTAL_PARENTERAL
    nursingSummary: text('nursing_summary').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    nursingAssessAdmIdx: index('inpatient_nursing_assess_adm_idx').on(table.admissionId, table.createdAt)
  })
);

/**
 * 16. Inpatient Nursing Notes
 */
export const inpatientNursingNotes = clinicalSchema.table(
  'inpatient_nursing_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    admissionId: uuid('admission_id').notNull().references(() => inpatientAdmissions.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    authorName: varchar('author_name', { length: 255 }).notNull(),
    noteType: varchar('note_type', { length: 50 }).notNull().default('PROGRESS_NOTE'), // PROGRESS_NOTE, SHIFT_HANDOVER, INCIDENT_NOTE, DOCTOR_ORDER_EXECUTION, DISCHARGE_TEACHING
    shift: varchar('shift', { length: 50 }).notNull().default('DAY'),
    isCriticalFlag: boolean('is_critical_flag').notNull().default(false),
    noteContent: text('note_content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    nursingNotesAdmIdx: index('inpatient_nursing_notes_adm_idx').on(table.admissionId, table.createdAt)
  })
);

/**
 * 17. Inpatient Care Plans
 */
export const inpatientCarePlans = clinicalSchema.table(
  'inpatient_care_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    admissionId: uuid('admission_id').notNull().references(() => inpatientAdmissions.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    nursingDiagnosis: varchar('nursing_diagnosis', { length: 255 }).notNull(),
    expectedOutcome: text('expected_outcome').notNull(),
    interventions: text('interventions').notNull(),
    targetEvaluationDate: timestamp('target_evaluation_date', { withTimezone: true }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, GOAL_MET, REVISED, DISCONTINUED
    createdBy: varchar('created_by', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    carePlanAdmIdx: index('inpatient_care_plans_adm_idx').on(table.admissionId, table.status)
  })
);

/**
 * 18. Inpatient Vitals Observations
 */
export const inpatientVitalObservations = clinicalSchema.table(
  'inpatient_vital_observations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    admissionId: uuid('admission_id').notNull().references(() => inpatientAdmissions.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    recordedBy: varchar('recorded_by', { length: 255 }).notNull(),
    temperatureCelsius: numeric('temperature_celsius', { precision: 4, scale: 2 }), // e.g. 37.20
    pulseBpm: integer('pulse_bpm'), // e.g. 78
    respiratoryRateBpm: integer('respiratory_rate_bpm'), // e.g. 18
    systolicBpMmHg: integer('systolic_bp_mm_hg'), // e.g. 120
    diastolicBpMmHg: integer('diastolic_bp_mm_hg'), // e.g. 80
    spo2Percentage: integer('spo2_percentage'), // e.g. 98
    bloodGlucoseMgDl: numeric('blood_glucose_mg_dl', { precision: 6, scale: 2 }), // e.g. 110.00
    painScaleScore: integer('pain_scale_score'), // 0 to 10
    gcsScore: integer('gcs_score'), // Glasgow Coma Scale (3 to 15)
    isAbnormal: boolean('is_abnormal').notNull().default(false),
    abnormalDetails: text('abnormal_details'),
    notes: text('notes'),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    vitalObservationsAdmIdx: index('inpatient_vitals_adm_idx').on(table.admissionId, table.recordedAt)
  })
);

/**
 * 19. Inpatient Intake & Output Charting
 */
export const inpatientIntakeOutput = clinicalSchema.table(
  'inpatient_intake_output',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    admissionId: uuid('admission_id').notNull().references(() => inpatientAdmissions.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    recordedBy: varchar('recorded_by', { length: 255 }).notNull(),
    shift: varchar('shift', { length: 50 }).notNull().default('DAY'),
    intakeOralMl: integer('intake_oral_ml').notNull().default(0),
    intakeIvFluidMl: integer('intake_iv_fluid_ml').notNull().default(0),
    intakeTubeFeedingMl: integer('intake_tube_feeding_ml').notNull().default(0),
    intakeBloodProductMl: integer('intake_blood_product_ml').notNull().default(0),
    totalIntakeMl: integer('total_intake_ml').notNull().default(0),
    outputUrineMl: integer('output_urine_ml').notNull().default(0),
    outputDrainMl: integer('output_drain_ml').notNull().default(0),
    outputVomitusMl: integer('output_vomitus_ml').notNull().default(0),
    outputStoolMl: integer('output_stool_ml').notNull().default(0),
    totalOutputMl: integer('total_output_ml').notNull().default(0),
    netFluidBalanceMl: integer('net_fluid_balance_ml').notNull().default(0),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    intakeOutputAdmIdx: index('inpatient_io_adm_idx').on(table.admissionId, table.recordedAt)
  })
);

/**
 * 20. Inpatient Doctor Daily Rounds
 */
export const inpatientDoctorRounds = clinicalSchema.table(
  'inpatient_doctor_rounds',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    admissionId: uuid('admission_id').notNull().references(() => inpatientAdmissions.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    doctorName: varchar('doctor_name', { length: 255 }).notNull(),
    doctorSpecialty: varchar('doctor_specialty', { length: 100 }).notNull(),
    roundType: varchar('round_type', { length: 50 }).notNull().default('MORNING_PRIMARY_ROUND'), // MORNING_PRIMARY_ROUND, EVENING_REVIEW, CONSULTANT_SPECIALIST_ROUND, EMERGENCY_ESCALATION
    subjectiveAssessment: text('subjective_assessment').notNull(),
    objectiveClinicalFindings: text('objective_clinical_findings').notNull(),
    clinicalImpression: text('clinical_impression').notNull(),
    treatmentPlanUpdates: text('treatment_plan_updates').notNull(),
    orderedInvestigationsSummary: text('ordered_investigations_summary'),
    medicationAdjustments: text('medication_adjustments'),
    dischargeReadinessScore: integer('discharge_readiness_score').notNull().default(50), // 0 to 100
    expectedDischargeReviewDate: timestamp('expected_discharge_review_date', { withTimezone: true }),
    roundTimestamp: timestamp('round_timestamp', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    doctorRoundsAdmIdx: index('inpatient_rounds_adm_idx').on(table.admissionId, table.roundTimestamp)
  })
);

/**
 * 21. Inpatient Discharge Plans
 */
export const inpatientDischargePlans = clinicalSchema.table(
  'inpatient_discharge_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    admissionId: uuid('admission_id').notNull().references(() => inpatientAdmissions.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    targetDischargeDate: timestamp('target_discharge_date', { withTimezone: true }).notNull(),
    readinessStatus: varchar('readiness_status', { length: 50 }).notNull().default('PLANNING'), // NOT_STARTED, PLANNING, CLINICALLY_READY, FINANCIAL_PENDING, INSURANCE_PENDING, DOCUMENTATION_PENDING, READY_FOR_DISCHARGE, DISCHARGE_IN_PROGRESS, COMPLETED
    isMedicationReconciled: boolean('is_medication_reconciled').notNull().default(false),
    isNursingCareHandoverDone: boolean('is_nursing_care_handover_done').notNull().default(false),
    isBillingCleared: boolean('is_billing_cleared').notNull().default(false),
    isInsurancePreApproved: boolean('is_insurance_pre_approved').notNull().default(false),
    isDischargeSummaryFinalized: boolean('is_discharge_summary_finalized').notNull().default(false),
    transportArrangement: varchar('transport_arrangement', { length: 50 }).notNull().default('SELF_TRANSPORT'), // SELF_TRANSPORT, AMBULANCE_BASIC, AMBULANCE_ACLS, WHEELCHAIR_VAN
    patientEducationSummary: text('patient_education_summary'),
    followUpInstructions: text('follow_up_instructions'),
    coordinatorName: varchar('coordinator_name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    dischargePlansAdmIdx: index('inpatient_discharge_plans_adm_idx').on(table.admissionId, table.readinessStatus)
  })
);

/**
 * 22. Inpatient Discharge Requests & Authorizations
 */
export const inpatientDischargeRequests = clinicalSchema.table(
  'inpatient_discharge_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    requestNumber: varchar('request_number', { length: 100 }).notNull(),
    admissionId: uuid('admission_id').notNull().references(() => inpatientAdmissions.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    requestingDoctorName: varchar('requesting_doctor_name', { length: 255 }).notNull(),
    dischargeType: varchar('discharge_type', { length: 50 }).notNull().default('ROUTINE_HOME'), // ROUTINE_HOME, DISCHARGE_AGAINST_MEDICAL_ADVICE, TRANSFER_TO_OTHER_HOSPITAL, DECEASED, DAY_CARE_COMPLETED
    conditionAtDischarge: varchar('condition_at_discharge', { length: 50 }).notNull().default('STABLE_IMPROVED'), // STABLE_IMPROVED, RECOVERED, UNCHANGED, CRITICAL_TRANSFERRED, DECEASED
    clinicalClearance: boolean('clinical_clearance').notNull().default(false),
    clinicalClearanceDoctor: varchar('clinical_clearance_doctor', { length: 255 }),
    financialClearance: boolean('financial_clearance').notNull().default(false),
    financialClearanceOfficer: varchar('financial_clearance_officer', { length: 255 }),
    insuranceClearance: boolean('insurance_clearance').notNull().default(false),
    insuranceClearanceRef: varchar('insurance_clearance_ref', { length: 100 }),
    pharmacyMedDischarged: boolean('pharmacy_med_discharged').notNull().default(false),
    status: varchar('status', { length: 50 }).notNull().default('PENDING_CLEARANCE'), // PENDING_CLEARANCE, AUTHORIZED, REJECTED, DISCHARGED_COMPLETED, CANCELLED
    dischargeAuthorizedBy: varchar('discharge_authorized_by', { length: 255 }),
    authorizedAt: timestamp('authorized_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    dischargeReqNumUnq: uniqueIndex('inpatient_disch_req_num_unq').on(table.tenantId, table.requestNumber),
    dischargeReqAdmIdx: index('inpatient_disch_req_adm_idx').on(table.admissionId, table.status)
  })
);

/**
 * 23. Inpatient Structured Discharge Summaries
 */
export const inpatientDischargeSummaries = clinicalSchema.table(
  'inpatient_discharge_summaries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    summaryNumber: varchar('summary_number', { length: 100 }).notNull(),
    admissionId: uuid('admission_id').notNull().references(() => inpatientAdmissions.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 100 }).notNull(),
    admissionDate: timestamp('admission_date', { withTimezone: true }).notNull(),
    dischargeDate: timestamp('discharge_date', { withTimezone: true }).notNull(),
    attendingConsultantName: varchar('attending_consultant_name', { length: 255 }).notNull(),
    finalPrimaryDiagnosis: text('final_primary_diagnosis').notNull(),
    finalSecondaryDiagnosis: text('final_secondary_diagnosis'),
    surgicalProceduresPerformed: text('surgical_procedures_performed'),
    hospitalCourseSummary: text('hospital_course_summary').notNull(),
    keyInvestigationFindings: text('key_investigation_findings'),
    treatmentGiven: text('treatment_given').notNull(),
    dischargeMedicationAdvice: text('discharge_medication_advice').notNull(),
    dietAndActivityAdvice: text('diet_and_activity_advice').notNull(),
    warningSignsToSeekImmediateCare: text('warning_signs_to_seek_immediate_care').notNull(),
    followUpAppointmentDate: timestamp('follow_up_appointment_date', { withTimezone: true }),
    followUpDoctorName: varchar('follow_up_doctor_name', { length: 255 }),
    isFinalized: boolean('is_finalized').notNull().default(false),
    finalizedBy: varchar('finalized_by', { length: 255 }),
    finalizedAt: timestamp('finalized_at', { withTimezone: true }),
    versionNumber: integer('version_number').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    dischargeSumNumUnq: uniqueIndex('inpatient_disch_sum_num_unq').on(table.tenantId, table.summaryNumber),
    dischargeSumAdmIdx: index('inpatient_disch_sum_adm_idx').on(table.admissionId)
  })
);

/**
 * 24. Bed Turnaround & Housekeeping
 */
export const inpatientBedTurnaround = clinicalSchema.table(
  'inpatient_bed_turnaround',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    turnaroundNumber: varchar('turnaround_number', { length: 100 }).notNull(),
    bedId: uuid('bed_id').notNull().references(() => inpatientBeds.id, { onDelete: 'cascade' }),
    bedCode: varchar('bed_code', { length: 50 }).notNull(),
    wardId: uuid('ward_id').notNull().references(() => inpatientWards.id, { onDelete: 'cascade' }),
    vacatedByPatientId: uuid('vacated_by_patient_id'),
    cleaningType: varchar('cleaning_type', { length: 50 }).notNull().default('TERMINAL_DISCHARGE_DISINFECTION'), // ROUTINE_LINEN_CHANGE, TERMINAL_DISCHARGE_DISINFECTION, ISOLATION_FUMIGATION, MAINTENANCE_OVERHAUL
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
    assignedHousekeeper: varchar('assigned_housekeeper', { length: 255 }),
    cleaningStartedAt: timestamp('cleaning_started_at', { withTimezone: true }),
    cleaningCompletedAt: timestamp('cleaning_completed_at', { withTimezone: true }),
    status: varchar('status', { length: 50 }).notNull().default('PENDING_CLEANING'), // PENDING_CLEANING, IN_PROGRESS, INSPECTED_PASSED, AVAILABLE
    environmentalInspectionPassed: boolean('environmental_inspection_passed').notNull().default(false),
    inspectedBy: varchar('inspected_by', { length: 255 }),
    turnaroundDurationMinutes: integer('turnaround_duration_minutes').default(0),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    turnaroundNumUnq: uniqueIndex('inpatient_turnaround_num_unq').on(table.tenantId, table.turnaroundNumber),
    bedTurnaroundIdx: index('inpatient_turnaround_bed_idx').on(table.bedId, table.status)
  })
);

/**
 * 25. Bed Blocking & Maintenance
 */
export const inpatientBedBlocks = clinicalSchema.table(
  'inpatient_bed_blocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    blockNumber: varchar('block_number', { length: 100 }).notNull(),
    bedId: uuid('bed_id').notNull().references(() => inpatientBeds.id, { onDelete: 'cascade' }),
    bedCode: varchar('bed_code', { length: 50 }).notNull(),
    wardId: uuid('ward_id').notNull().references(() => inpatientWards.id, { onDelete: 'cascade' }),
    blockReason: varchar('block_reason', { length: 50 }).notNull(), // BIOMEDICAL_MAINTENANCE, INFECTION_CONTROL_QUARANTINE, FACILITY_RENOVATION, NURSE_STAFFING_SHORTAGE, RESERVED_VIP_EMERGENCY
    blockedFrom: timestamp('blocked_from', { withTimezone: true }).notNull().defaultNow(),
    blockedUntil: timestamp('blocked_until', { withTimezone: true }),
    authorizedBy: varchar('authorized_by', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE_BLOCKED'), // ACTIVE_BLOCKED, RELEASED_UNBLOCKED
    unblockedAt: timestamp('unblocked_at', { withTimezone: true }),
    unblockedBy: varchar('unblocked_by', { length: 255 }),
    justificationNotes: text('justification_notes').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    bedBlockNumUnq: uniqueIndex('inpatient_bed_blocks_num_unq').on(table.tenantId, table.blockNumber),
    bedBlockIdx: index('inpatient_bed_blocks_bed_idx').on(table.bedId, table.status)
  })
);

/**
 * 26. Inpatient Audit Vault (Cryptographic Hash-Linked Traces)
 */
export const inpatientAuditTraces = clinicalSchema.table(
  'inpatient_audit_traces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    traceNumber: varchar('trace_number', { length: 100 }).notNull(),
    actorId: uuid('actor_id'),
    actorName: varchar('actor_name', { length: 255 }).notNull(),
    actorRole: varchar('actor_role', { length: 100 }).notNull(),
    action: varchar('action', { length: 100 }).notNull(), // ADMISSION_REQUESTED, ADMISSION_APPROVED, BED_ALLOCATED, BED_TRANSFERRED, VITALS_CHARTED, ROUND_RECORDED, DISCHARGE_CLEARED, BED_RELEASED, BED_BLOCKED
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    entityCode: varchar('entity_code', { length: 100 }).notNull(),
    patientId: uuid('patient_id'),
    patientMrn: varchar('patient_mrn', { length: 100 }),
    previousState: jsonb('previous_state'),
    newState: jsonb('new_state').notNull(),
    justification: text('justification').notNull(),
    ipAddress: varchar('ip_address', { length: 50 }).notNull().default('127.0.0.1'),
    integrityHash: varchar('integrity_hash', { length: 255 }).notNull(),
    previousHash: varchar('previous_hash', { length: 255 }).notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    inpatientAuditTraceIdx: index('inpatient_audit_traces_tenant_entity_idx').on(table.tenantId, table.entityType, table.entityId)
  })
);

// Type Inference Exports
export type InpatientUnit = typeof inpatientUnits.$inferSelect;
export type NewInpatientUnit = typeof inpatientUnits.$inferInsert;

export type InpatientWard = typeof inpatientWards.$inferSelect;
export type NewInpatientWard = typeof inpatientWards.$inferInsert;

export type InpatientRoom = typeof inpatientRooms.$inferSelect;
export type NewInpatientRoom = typeof inpatientRooms.$inferInsert;

export type InpatientBed = typeof inpatientBeds.$inferSelect;
export type NewInpatientBed = typeof inpatientBeds.$inferInsert;

export type InpatientBedStatusHistory = typeof inpatientBedStatusHistory.$inferSelect;
export type NewInpatientBedStatusHistory = typeof inpatientBedStatusHistory.$inferInsert;

export type InpatientBedReservation = typeof inpatientBedReservations.$inferSelect;
export type NewInpatientBedReservation = typeof inpatientBedReservations.$inferInsert;

export type InpatientAdmissionRequest = typeof inpatientAdmissionRequests.$inferSelect;
export type NewInpatientAdmissionRequest = typeof inpatientAdmissionRequests.$inferInsert;

export type InpatientAdmission = typeof inpatientAdmissions.$inferSelect;
export type NewInpatientAdmission = typeof inpatientAdmissions.$inferInsert;

export type InpatientAdmissionApproval = typeof inpatientAdmissionApprovals.$inferSelect;
export type NewInpatientAdmissionApproval = typeof inpatientAdmissionApprovals.$inferInsert;

export type InpatientBedAllocation = typeof inpatientBedAllocations.$inferSelect;
export type NewInpatientBedAllocation = typeof inpatientBedAllocations.$inferInsert;

export type InpatientPatientLocation = typeof inpatientPatientLocations.$inferSelect;
export type NewInpatientPatientLocation = typeof inpatientPatientLocations.$inferInsert;

export type InpatientTransfer = typeof inpatientTransfers.$inferSelect;
export type NewInpatientTransfer = typeof inpatientTransfers.$inferInsert;

export type InpatientTransferApproval = typeof inpatientTransferApprovals.$inferSelect;
export type NewInpatientTransferApproval = typeof inpatientTransferApprovals.$inferInsert;

export type InpatientCareTeam = typeof inpatientCareTeams.$inferSelect;
export type NewInpatientCareTeam = typeof inpatientCareTeams.$inferInsert;

export type InpatientNursingAssessment = typeof inpatientNursingAssessments.$inferSelect;
export type NewInpatientNursingAssessment = typeof inpatientNursingAssessments.$inferInsert;

export type InpatientNursingNote = typeof inpatientNursingNotes.$inferSelect;
export type NewInpatientNursingNote = typeof inpatientNursingNotes.$inferInsert;

export type InpatientCarePlan = typeof inpatientCarePlans.$inferSelect;
export type NewInpatientCarePlan = typeof inpatientCarePlans.$inferInsert;

export type InpatientVitalObservation = typeof inpatientVitalObservations.$inferSelect;
export type NewInpatientVitalObservation = typeof inpatientVitalObservations.$inferInsert;

export type InpatientIntakeOutput = typeof inpatientIntakeOutput.$inferSelect;
export type NewInpatientIntakeOutput = typeof inpatientIntakeOutput.$inferInsert;

export type InpatientDoctorRound = typeof inpatientDoctorRounds.$inferSelect;
export type NewInpatientDoctorRound = typeof inpatientDoctorRounds.$inferInsert;

export type InpatientDischargePlan = typeof inpatientDischargePlans.$inferSelect;
export type NewInpatientDischargePlan = typeof inpatientDischargePlans.$inferInsert;

export type InpatientDischargeRequest = typeof inpatientDischargeRequests.$inferSelect;
export type NewInpatientDischargeRequest = typeof inpatientDischargeRequests.$inferInsert;

export type InpatientDischargeSummary = typeof inpatientDischargeSummaries.$inferSelect;
export type NewInpatientDischargeSummary = typeof inpatientDischargeSummaries.$inferInsert;

export type InpatientBedTurnaround = typeof inpatientBedTurnaround.$inferSelect;
export type NewInpatientBedTurnaround = typeof inpatientBedTurnaround.$inferInsert;

export type InpatientBedBlock = typeof inpatientBedBlocks.$inferSelect;
export type NewInpatientBedBlock = typeof inpatientBedBlocks.$inferInsert;

export type InpatientAuditTrace = typeof inpatientAuditTraces.$inferSelect;
export type NewInpatientAuditTrace = typeof inpatientAuditTraces.$inferInsert;

/**
 * ===============================================================================
 * Phase 2.13: Operation Theatre (OT) & Surgery Management
 * ===============================================================================
 */

export const operationTheatreComplexes = clinicalSchema.table(
  'operation_theatre_complexes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    complexCode: varchar('complex_code', { length: 50 }).notNull(),
    complexName: varchar('complex_name', { length: 255 }).notNull(),
    building: varchar('building', { length: 100 }).notNull(),
    floor: varchar('floor', { length: 50 }).notNull(),
    headOfOT: varchar('head_of_ot', { length: 255 }),
    totalRooms: integer('total_rooms').notNull().default(0),
    activeRooms: integer('active_rooms').notNull().default(0),
    operatingHours: varchar('operating_hours', { length: 100 }).notNull().default('24/7'),
    hasLaminarAirflow: boolean('has_laminar_airflow').notNull().default(true),
    hasCentralSterileSupply: boolean('has_central_sterile_supply').notNull().default(true),
    isActive: boolean('is_active').notNull().default(true),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ot_complexes_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_ot_complexes_code_tenant').on(table.tenantId, table.complexCode)
  ]
);

export const operationTheatreRooms = clinicalSchema.table(
  'operation_theatre_rooms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    complexId: uuid('complex_id')
      .notNull()
      .references(() => operationTheatreComplexes.id, { onDelete: 'cascade' }),
    roomNumber: varchar('room_number', { length: 50 }).notNull(),
    roomName: varchar('room_name', { length: 255 }).notNull(),
    otType: varchar('ot_type', { length: 50 }).notNull().default('MAJOR_OT'),
    status: varchar('status', { length: 50 }).notNull().default('AVAILABLE'),
    primarySpecialty: varchar('primary_specialty', { length: 100 }).notNull(),
    supportedSpecialties: jsonb('supported_specialties').default([]),
    hasPendantSystem: boolean('has_pendant_system').notNull().default(true),
    hasCardiacMonitor: boolean('has_cardiac_monitor').notNull().default(true),
    hasAnaesthesiaWorkstation: boolean('has_anaesthesia_workstation').notNull().default(true),
    hasC臂Fluoroscopy: boolean('has_c_arm_fluoroscopy').notNull().default(false),
    hasLaminarFlow: boolean('has_laminar_flow').notNull().default(true),
    hasHepaFilter: boolean('has_hepa_filter').notNull().default(true),
    lastCleanedAt: timestamp('last_cleaned_at', { withTimezone: true }),
    hourlyRate: numeric('hourly_rate', { precision: 12, scale: 2 }).notNull().default('0.00'),
    isActive: boolean('is_active').notNull().default(true),
    currentSurgeryId: uuid('current_surgery_id'),
    currentPatientName: varchar('current_patient_name', { length: 255 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ot_rooms_complex').on(table.complexId),
    index('idx_ot_rooms_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_ot_rooms_code_tenant').on(table.tenantId, table.complexId, table.roomNumber)
  ]
);

export const surgicalProcedures = clinicalSchema.table(
  'surgical_procedures',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    procedureCode: varchar('procedure_code', { length: 50 }).notNull(),
    procedureName: varchar('procedure_name', { length: 255 }).notNull(),
    specialty: varchar('specialty', { length: 100 }).notNull(),
    category: varchar('category', { length: 50 }).notNull().default('MAJOR_PROCEDURE'),
    defaultDurationMinutes: integer('default_duration_minutes').notNull().default(60),
    recommendedAnaesthesia: varchar('recommended_anaesthesia', { length: 50 }).notNull().default('GENERAL_ANAESTHESIA'),
    requiresImplant: boolean('requires_implant').notNull().default(false),
    requiresBloodCrossmatch: boolean('requires_blood_crossmatch').notNull().default(false),
    requiresICUStay: boolean('requires_icu_stay').notNull().default(false),
    baseProcedureCharge: numeric('base_procedure_charge', { precision: 12, scale: 2 }).notNull().default('0.00'),
    cptOrIcdCode: varchar('cpt_or_icd_code', { length: 50 }),
    isActive: boolean('is_active').notNull().default(true),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_surgical_procedures_tenant').on(table.tenantId, table.specialty),
    uniqueIndex('idx_surgical_procedures_code').on(table.tenantId, table.procedureCode)
  ]
);

export const surgicalProcedureRequirements = clinicalSchema.table(
  'surgical_procedure_requirements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    procedureId: uuid('procedure_id')
      .notNull()
      .references(() => surgicalProcedures.id, { onDelete: 'cascade' }),
    requirementType: varchar('requirement_type', { length: 50 }).notNull(), // EQUIPMENT, IMPLANT, CONSUMABLE, STAFF
    resourceName: varchar('resource_name', { length: 255 }).notNull(),
    quantity: integer('quantity').notNull().default(1),
    isMandatory: boolean('is_mandatory').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_proc_req_procedure').on(table.procedureId)
  ]
);

export const surgeryRequests = clinicalSchema.table(
  'surgery_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    requestNumber: varchar('request_number', { length: 50 }).notNull(),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 100 }).notNull(),
    patientAge: integer('patient_age').notNull().default(35),
    patientGender: varchar('patient_gender', { length: 20 }).notNull().default('M'),
    encounterId: uuid('encounter_id'),
    admissionId: uuid('admission_id'),
    requestingDoctorName: varchar('requesting_doctor_name', { length: 255 }).notNull(),
    primarySurgeonName: varchar('primary_surgeon_name', { length: 255 }).notNull(),
    specialty: varchar('specialty', { length: 100 }).notNull(),
    procedureId: uuid('procedure_id')
      .notNull()
      .references(() => surgicalProcedures.id),
    procedureName: varchar('procedure_name', { length: 255 }).notNull(),
    preOperativeDiagnosis: text('pre_operative_diagnosis').notNull(),
    clinicalIndication: text('clinical_indication').notNull(),
    category: varchar('category', { length: 50 }).notNull().default('ELECTIVE'),
    priority: varchar('priority', { length: 50 }).notNull().default('ROUTINE'),
    isEmergency: boolean('is_emergency').notNull().default(false),
    proposedSurgeryDate: timestamp('proposed_surgery_date', { withTimezone: true }).notNull(),
    estimatedDurationMinutes: integer('estimated_duration_minutes').notNull().default(60),
    requiredAnaesthesia: varchar('required_anaesthesia', { length: 50 }).notNull().default('GENERAL_ANAESTHESIA'),
    implantRequirementDetails: text('implant_requirement_details'),
    bloodComponentsRequired: varchar('blood_components_required', { length: 255 }),
    specialEquipmentRequired: text('special_equipment_required'),
    pacClearanceStatus: varchar('pac_clearance_status', { length: 50 }).notNull().default('PENDING'),
    status: varchar('status', { length: 50 }).notNull().default('SUBMITTED'),
    decisionNotes: text('decision_notes'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_surgery_req_tenant_branch').on(table.tenantId, table.branchId),
    index('idx_surgery_req_patient').on(table.patientId),
    uniqueIndex('idx_surgery_req_num_tenant').on(table.tenantId, table.requestNumber)
  ]
);

export const surgeryRequestItems = clinicalSchema.table(
  'surgery_request_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    requestId: uuid('request_id')
      .notNull()
      .references(() => surgeryRequests.id, { onDelete: 'cascade' }),
    procedureId: uuid('procedure_id')
      .notNull()
      .references(() => surgicalProcedures.id),
    procedureName: varchar('procedure_name', { length: 255 }).notNull(),
    isPrimary: boolean('is_primary').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_surgery_req_items_req').on(table.requestId)
  ]
);

export const preOperativeAssessments = clinicalSchema.table(
  'pre_operative_assessments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    surgeryRequestId: uuid('surgery_request_id')
      .notNull()
      .references(() => surgeryRequests.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    assessedByAnaesthetist: varchar('assessed_by_anaesthetist', { length: 255 }).notNull(),
    assessmentDate: timestamp('assessment_date', { withTimezone: true }).notNull().defaultNow(),
    asaClassification: varchar('asa_classification', { length: 50 }).notNull().default('ASA_I_NORMAL_HEALTHY'),
    airwayMallampatiScore: integer('airway_mallampati_score').notNull().default(1),
    npoStatusHours: integer('npo_status_hours').notNull().default(8),
    cardiacClearanceGiven: boolean('cardiac_clearance_given').notNull().default(true),
    respiratoryClearanceGiven: boolean('respiratory_clearance_given').notNull().default(true),
    allergiesNoted: text('allergies_noted'),
    currentMedicationsNoted: text('current_medications_noted'),
    lastHaemoglobinGdl: numeric('last_haemoglobin_gdl', { precision: 4, scale: 1 }),
    coagulationProfileStatus: varchar('coagulation_profile_status', { length: 100 }),
    bloodArrangementUnits: integer('blood_arrangement_units').notNull().default(0),
    fitnessStatus: varchar('fitness_status', { length: 50 }).notNull().default('CLEARED'),
    anaesthesiaPlanNotes: text('anaesthesia_plan_notes').notNull(),
    riskFactorsSummary: text('risk_factors_summary').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_preop_assess_request').on(table.surgeryRequestId),
    index('idx_preop_assess_patient').on(table.patientId)
  ]
);

export const surgicalConsents = clinicalSchema.table(
  'surgical_consents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    surgeryRequestId: uuid('surgery_request_id')
      .notNull()
      .references(() => surgeryRequests.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    consentNumber: varchar('consent_number', { length: 50 }).notNull(),
    procedureConsentGiven: boolean('procedure_consent_given').notNull().default(true),
    anaesthesiaConsentGiven: boolean('anaesthesia_consent_given').notNull().default(true),
    bloodTransfusionConsentGiven: boolean('blood_transfusion_consent_given').notNull().default(true),
    highRiskConsentGiven: boolean('high_risk_consent_given').notNull().default(false),
    implantConsentGiven: boolean('implant_consent_given').notNull().default(false),
    consentingPersonName: varchar('consenting_person_name', { length: 255 }).notNull(),
    relationshipToPatient: varchar('relationship_to_patient', { length: 100 }).notNull().default('SELF'),
    counselledByDoctor: varchar('counselled_by_doctor', { length: 255 }).notNull(),
    witnessName: varchar('witness_name', { length: 255 }).notNull(),
    isSignedDigitally: boolean('is_signed_digitally').notNull().default(true),
    consentTimestamp: timestamp('consent_timestamp', { withTimezone: true }).notNull().defaultNow(),
    status: varchar('status', { length: 50 }).notNull().default('VALID_SIGNED'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_surgical_consents_request').on(table.surgeryRequestId),
    index('idx_surgical_consents_patient').on(table.patientId),
    uniqueIndex('idx_surgical_consents_num').on(table.tenantId, table.consentNumber)
  ]
);

export const otSchedules = clinicalSchema.table(
  'ot_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    scheduleNumber: varchar('schedule_number', { length: 50 }).notNull(),
    surgeryRequestId: uuid('surgery_request_id')
      .notNull()
      .references(() => surgeryRequests.id),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 100 }).notNull(),
    procedureName: varchar('procedure_name', { length: 255 }).notNull(),
    roomId: uuid('room_id')
      .notNull()
      .references(() => operationTheatreRooms.id),
    scheduledDate: timestamp('scheduled_date', { withTimezone: true }).notNull(),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    estimatedDurationMinutes: integer('estimated_duration_minutes').notNull().default(60),
    primarySurgeonName: varchar('primary_surgeon_name', { length: 255 }).notNull(),
    assistantSurgeonName: varchar('assistant_surgeon_name', { length: 255 }),
    leadAnaesthetistName: varchar('lead_anaesthetist_name', { length: 255 }).notNull(),
    anaesthesiaTechName: varchar('anaesthesia_tech_name', { length: 255 }),
    scrubNurseName: varchar('scrub_nurse_name', { length: 255 }).notNull(),
    circulatingNurseName: varchar('circulating_nurse_name', { length: 255 }).notNull(),
    isEmergency: boolean('is_emergency').notNull().default(false),
    status: varchar('status', { length: 50 }).notNull().default('CONFIRMED'),
    delayReason: text('delay_reason'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ot_schedules_tenant_room').on(table.tenantId, table.roomId, table.startTime),
    index('idx_ot_schedules_patient').on(table.patientId),
    uniqueIndex('idx_ot_schedules_num').on(table.tenantId, table.scheduleNumber)
  ]
);

export const otScheduleStaff = clinicalSchema.table(
  'ot_schedule_staff',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => otSchedules.id, { onDelete: 'cascade' }),
    staffId: uuid('staff_id'),
    staffName: varchar('staff_name', { length: 255 }).notNull(),
    role: varchar('role', { length: 50 }).notNull(), // PRIMARY_SURGEON, ASSISTANT_SURGEON, LEAD_ANAESTHETIST, SCRUB_NURSE, CIRCULATING_NURSE
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ot_sched_staff').on(table.scheduleId)
  ]
);

export const otResourceAllocations = clinicalSchema.table(
  'ot_resource_allocations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => otSchedules.id, { onDelete: 'cascade' }),
    resourceType: varchar('resource_type', { length: 50 }).notNull(), // DEVICE, TRAY, BLOOD_UNIT, IMPLANT
    resourceCode: varchar('resource_code', { length: 100 }).notNull(),
    resourceName: varchar('resource_name', { length: 255 }).notNull(),
    quantity: integer('quantity').notNull().default(1),
    isSterilized: boolean('is_sterilized').notNull().default(true),
    sterilizationBatch: varchar('sterilization_batch', { length: 100 }),
    status: varchar('status', { length: 50 }).notNull().default('ALLOCATED'),
    allocatedAt: timestamp('allocated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ot_resource_sched').on(table.scheduleId)
  ]
);

export const preOpChecklists = clinicalSchema.table(
  'pre_op_checklists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => otSchedules.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    verifiedByNurse: varchar('verified_by_nurse', { length: 255 }).notNull(),
    patientIdentityVerified: boolean('patient_identity_verified').notNull().default(true),
    surgicalSiteMarked: boolean('surgical_site_marked').notNull().default(true),
    consentVerified: boolean('consent_verified').notNull().default(true),
    npoVerified: boolean('npo_verified').notNull().default(true),
    allergiesChecked: boolean('allergies_checked').notNull().default(true),
    preOpVitalsChecked: boolean('pre_op_vitals_checked').notNull().default(true),
    labReportsAvailable: boolean('lab_reports_available').notNull().default(true),
    imagingAvailable: boolean('imaging_available').notNull().default(true),
    bloodReservedAndChecked: boolean('blood_reserved_and_checked').notNull().default(true),
    implantsVerifiedInOT: boolean('implants_verified_in_ot').notNull().default(true),
    denturesJewelryRemoved: boolean('dentures_jewelry_removed').notNull().default(true),
    preMedicationAdministered: boolean('pre_medication_administered').notNull().default(true),
    isClearedForOT: boolean('is_cleared_for_ot').notNull().default(true),
    notes: text('notes'),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_preop_chk_schedule').on(table.scheduleId)
  ]
);

export const surgicalSafetyChecklists = clinicalSchema.table(
  'surgical_safety_checklists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => otSchedules.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    stage: varchar('stage', { length: 50 }).notNull(), // SIGN_IN, TIME_OUT, SIGN_OUT
    conductedBy: varchar('conducted_by', { length: 255 }).notNull(),
    conductedRole: varchar('conducted_role', { length: 100 }).notNull(),
    patientConfirmed: boolean('patient_confirmed').notNull().default(true),
    siteMarkingConfirmed: boolean('site_marking_confirmed').notNull().default(true),
    anaesthesiaMachineChecked: boolean('anaesthesia_machine_checked').notNull().default(true),
    pulseOximeterFunctioning: boolean('pulse_oximeter_functioning').notNull().default(true),
    knownAllergyConfirmed: boolean('known_allergy_confirmed').notNull().default(true),
    difficultAirwayRiskEvaluated: boolean('difficult_airway_risk_evaluated').notNull().default(true),
    bloodLossRiskEvaluated: boolean('blood_loss_risk_evaluated').notNull().default(true),
    teamIntroducedRoles: boolean('team_introduced_roles').notNull().default(true),
    antibioticProphylaxisGiven: boolean('antibiotic_prophylaxis_given').notNull().default(true),
    essentialImagingDisplayed: boolean('essential_imaging_displayed').notNull().default(true),
    spongeCountCorrect: boolean('sponge_count_correct').notNull().default(true),
    needleCountCorrect: boolean('needle_count_correct').notNull().default(true),
    instrumentCountCorrect: boolean('instrument_count_correct').notNull().default(true),
    specimenProperlyLabeled: boolean('specimen_properly_labeled').notNull().default(true),
    equipmentIssuesIdentified: boolean('equipment_issues_identified').notNull().default(false),
    recoveryConcernsAddressed: boolean('recovery_concerns_addressed').notNull().default(true),
    isExceptionOverridden: boolean('is_exception_overridden').default(false),
    overrideReason: text('override_reason'),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_who_safety_schedule').on(table.scheduleId, table.stage)
  ]
);

export const otTransfers = clinicalSchema.table(
  'ot_transfers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    transferNumber: varchar('transfer_number', { length: 50 }).notNull(),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => otSchedules.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    sourceLocation: varchar('source_location', { length: 255 }).notNull(),
    destinationRoomId: uuid('destination_room_id')
      .notNull()
      .references(() => operationTheatreRooms.id),
    destinationRoomName: varchar('destination_room_name', { length: 255 }).notNull(),
    transportStaffName: varchar('transport_staff_name', { length: 255 }).notNull(),
    handoverGivenBy: varchar('handover_given_by', { length: 255 }).notNull(),
    handoverReceivedBy: varchar('handover_received_by', { length: 255 }).notNull(),
    departureTime: timestamp('departure_time', { withTimezone: true }).notNull().defaultNow(),
    arrivalTime: timestamp('arrival_time', { withTimezone: true }),
    patientConditionOnArrival: varchar('patient_condition_on_arrival', { length: 100 }).notNull().default('STABLE'),
    status: varchar('status', { length: 50 }).notNull().default('COMPLETED'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ot_transfers_schedule').on(table.scheduleId),
    uniqueIndex('idx_ot_transfers_num').on(table.tenantId, table.transferNumber)
  ]
);

export const anaesthesiaRecords = clinicalSchema.table(
  'anaesthesia_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => otSchedules.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    leadAnaesthetist: varchar('lead_anaesthetist', { length: 255 }).notNull(),
    anaesthesiaType: varchar('anaesthesia_type', { length: 50 }).notNull().default('GENERAL_ANAESTHESIA'),
    inductionTime: timestamp('induction_time', { withTimezone: true }).notNull().defaultNow(),
    intubationDetails: varchar('intubation_details', { length: 255 }),
    airwayDeviceUsed: varchar('airway_device_used', { length: 100 }).notNull().default('ENDOTRACHEAL_TUBE'),
    administeredAgentsSummary: text('administered_agents_summary').notNull(),
    ivFluidsAdministeredMl: integer('iv_fluids_administered_ml').notNull().default(500),
    bloodTransfusedUnits: integer('blood_transfused_units').notNull().default(0),
    estimatedIntraopBloodLossMl: integer('estimated_intraop_blood_loss_ml').notNull().default(50),
    intraopVitalsStability: varchar('intraop_vitals_stability', { length: 100 }).notNull().default('HEMODYNAMICALLY_STABLE'),
    anaesthesiaEndTime: timestamp('anaesthesia_end_time', { withTimezone: true }),
    extubationTime: timestamp('extubation_time', { withTimezone: true }),
    intraoperativeComplications: text('intraoperative_complications'),
    postAnaesthesiaAldreteScore: integer('post_anaesthesia_aldrete_score').notNull().default(9),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_anaesthesia_rec_schedule').on(table.scheduleId)
  ]
);

export const intraoperativeRecords = clinicalSchema.table(
  'intraoperative_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => otSchedules.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    procedureName: varchar('procedure_name', { length: 255 }).notNull(),
    primarySurgeon: varchar('primary_surgeon', { length: 255 }).notNull(),
    assistantSurgeon: varchar('assistant_surgeon', { length: 255 }),
    scrubNurse: varchar('scrub_nurse', { length: 255 }).notNull(),
    circulatingNurse: varchar('circulating_nurse', { length: 255 }).notNull(),
    incisionTime: timestamp('incision_time', { withTimezone: true }).notNull().defaultNow(),
    closureTime: timestamp('closure_time', { withTimezone: true }),
    surgicalApproach: varchar('surgical_approach', { length: 255 }).notNull(),
    intraoperativeFindings: text('intraoperative_findings').notNull(),
    procedureDetails: text('procedure_details').notNull(),
    specimensCollectedCount: integer('specimens_collected_count').notNull().default(0),
    implantsPlacedCount: integer('implants_placed_count').notNull().default(0),
    spongeCountVerified: boolean('sponge_count_verified').notNull().default(true),
    needleCountVerified: boolean('needle_count_verified').notNull().default(true),
    instrumentCountVerified: boolean('instrument_count_verified').notNull().default(true),
    drainsPlaced: varchar('drains_placed', { length: 255 }),
    closureTechnique: text('closure_technique').notNull(),
    patientConditionPostSurgery: varchar('patient_condition_post_surgery', { length: 100 }).notNull().default('STABLE'),
    status: varchar('status', { length: 50 }).notNull().default('COMPLETED'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_intraop_rec_schedule').on(table.scheduleId)
  ]
);

export const operativeNotes = clinicalSchema.table(
  'operative_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => otSchedules.id, { onDelete: 'cascade' }),
    noteNumber: varchar('note_number', { length: 50 }).notNull(),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 100 }).notNull(),
    primarySurgeonName: varchar('primary_surgeon_name', { length: 255 }).notNull(),
    preOperativeDiagnosis: text('pre_operative_diagnosis').notNull(),
    postOperativeDiagnosis: text('post_operative_diagnosis').notNull(),
    procedurePerformedTitle: varchar('procedure_performed_title', { length: 255 }).notNull(),
    detailedOperativeFindings: text('detailed_operative_findings').notNull(),
    operativeTechniqueStepByStep: text('operative_technique_step_by_step').notNull(),
    estimatedBloodLossMl: integer('estimated_blood_loss_ml').notNull().default(50),
    tissueSpecimensSentForBiopsy: text('tissue_specimens_sent_for_biopsy'),
    prosthesisAndImplantsUsed: text('prosthesis_and_implants_used'),
    postOperativeInstructions: text('post_operative_instructions').notNull(),
    isFinalized: boolean('is_finalized').notNull().default(true),
    finalizedBy: varchar('finalized_by', { length: 255 }),
    finalizedAt: timestamp('finalized_at', { withTimezone: true }),
    versionNumber: integer('version_number').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_op_notes_schedule').on(table.scheduleId),
    uniqueIndex('idx_op_notes_num').on(table.tenantId, table.noteNumber)
  ]
);

export const otNursingNotes = clinicalSchema.table(
  'ot_nursing_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => otSchedules.id, { onDelete: 'cascade' }),
    nurseName: varchar('nurse_name', { length: 255 }).notNull(),
    nurseRole: varchar('nurse_role', { length: 50 }).notNull(), // SCRUB_NURSE, CIRCULATING_NURSE
    noteContent: text('note_content').notNull(),
    countsFinalVerified: boolean('counts_final_verified').notNull().default(true),
    skinConditionPostOp: varchar('skin_condition_post_op', { length: 100 }).notNull().default('INTACT'),
    cauteryPlateSiteInspection: varchar('cautery_plate_site_inspection', { length: 100 }).notNull().default('NO_BURNS_NORMAL'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ot_nursing_notes_schedule').on(table.scheduleId)
  ]
);

export const surgicalSpecimens = clinicalSchema.table(
  'surgical_specimens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    specimenNumber: varchar('specimen_number', { length: 50 }).notNull(),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => otSchedules.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    anatomicOriginSite: varchar('anatomic_origin_site', { length: 255 }).notNull(),
    specimenDescription: text('specimen_description').notNull(),
    fixativeUsed: varchar('fixative_used', { length: 100 }).notNull().default('10% BUFFERED FORMALIN'),
    orderedInvestigation: varchar('ordered_investigation', { length: 255 }).notNull(),
    destinationLab: varchar('destination_lab', { length: 255 }).notNull().default('HISTOPATHOLOGY_LAB'),
    collectedBySurgeon: varchar('collected_by_surgeon', { length: 255 }).notNull(),
    collectionTime: timestamp('collection_time', { withTimezone: true }).notNull().defaultNow(),
    labelVerifiedByNurse: varchar('label_verified_by_nurse', { length: 255 }).notNull(),
    labHandoverStatus: varchar('lab_handover_status', { length: 50 }).notNull().default('TRANSIT_TO_LAB'),
    labReceivedAt: timestamp('lab_received_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_specimens_schedule').on(table.scheduleId),
    uniqueIndex('idx_specimens_num').on(table.tenantId, table.specimenNumber)
  ]
);

export const surgicalImplants = clinicalSchema.table(
  'surgical_implants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    implantTrackingNumber: varchar('implant_tracking_number', { length: 50 }).notNull(),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => otSchedules.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    implantName: varchar('implant_name', { length: 255 }).notNull(),
    implantType: varchar('implant_type', { length: 100 }).notNull(),
    manufacturerName: varchar('manufacturer_name', { length: 255 }).notNull(),
    modelNumber: varchar('model_number', { length: 100 }).notNull(),
    serialOrLotNumber: varchar('serial_or_lot_number', { length: 100 }).notNull(),
    udiBarcode: varchar('udi_barcode', { length: 255 }),
    expiryDate: timestamp('expiry_date', { withTimezone: true }),
    anatomicPlacementSite: varchar('anatomic_placement_site', { length: 255 }).notNull(),
    implantedBySurgeon: varchar('implanted_by_surgeon', { length: 255 }).notNull(),
    implantTimestamp: timestamp('implant_timestamp', { withTimezone: true }).notNull().defaultNow(),
    supplierOrVendor: varchar('supplier_or_vendor', { length: 255 }).notNull(),
    unitCost: numeric('unit_cost', { precision: 12, scale: 2 }).notNull().default('0.00'),
    status: varchar('status', { length: 50 }).notNull().default('IMPLANTED'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_implants_schedule').on(table.scheduleId),
    uniqueIndex('idx_implants_track_num').on(table.tenantId, table.implantTrackingNumber)
  ]
);

export const surgicalConsumableUsage = clinicalSchema.table(
  'surgical_consumable_usage',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => otSchedules.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    itemCode: varchar('item_code', { length: 50 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    batchNumber: varchar('batch_number', { length: 100 }).notNull(),
    quantityUsed: numeric('quantity_used', { precision: 10, scale: 2 }).notNull().default('1.00'),
    unitOfMeasure: varchar('unit_of_measure', { length: 50 }).notNull().default('UNIT'),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull().default('0.00'),
    totalCost: numeric('total_cost', { precision: 12, scale: 2 }).notNull().default('0.00'),
    recordedBy: varchar('recorded_by', { length: 255 }).notNull(),
    inventoryDeductionStatus: varchar('inventory_deduction_status', { length: 50 }).notNull().default('DEDUCTED'),
    usedAt: timestamp('used_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_consumable_usage_schedule').on(table.scheduleId)
  ]
);

export const pacuRecoveryRecords = clinicalSchema.table(
  'pacu_recovery_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => otSchedules.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 100 }).notNull(),
    recoveryBedNumber: varchar('recovery_bed_number', { length: 50 }).notNull(),
    pacuNurseName: varchar('pacu_nurse_name', { length: 255 }).notNull(),
    arrivalTime: timestamp('arrival_time', { withTimezone: true }).notNull().defaultNow(),
    initialAldreteScore: integer('initial_aldrete_score').notNull().default(8),
    currentAldreteScore: integer('current_aldrete_score').notNull().default(9),
    consciousnessLevel: varchar('consciousness_level', { length: 100 }).notNull().default('AWAKE_ALERT'),
    airwayStatus: varchar('airway_status', { length: 100 }).notNull().default('PATENT_CLEAR'),
    oxygenSupportLpm: numeric('oxygen_support_lpm', { precision: 4, scale: 1 }).notNull().default('2.0'),
    spo2Percentage: integer('spo2_percentage').notNull().default(98),
    systolicBpMmHg: integer('systolic_bp_mm_hg').notNull().default(120),
    diastolicBpMmHg: integer('diastolic_bp_mm_hg').notNull().default(80),
    heartRateBpm: integer('heart_rate_bpm').notNull().default(75),
    painScoreNumeric: integer('pain_score_numeric').notNull().default(2),
    nauseaVomitingStatus: varchar('nausea_vomiting_status', { length: 100 }).notNull().default('NONE'),
    woundDrainOutputMl: integer('wound_drain_output_ml').notNull().default(0),
    status: varchar('status', { length: 50 }).notNull().default('RECOVERING'),
    dischargeCriteriaMet: boolean('discharge_criteria_met').notNull().default(false),
    authorizedTransferDestination: varchar('authorized_transfer_destination', { length: 100 }).notNull().default('INPATIENT_POST_OP_WARD'),
    dischargedAt: timestamp('discharged_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_pacu_rec_schedule').on(table.scheduleId),
    index('idx_pacu_rec_patient').on(table.patientId)
  ]
);

export const postoperativeOrders = clinicalSchema.table(
  'postoperative_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => otSchedules.id, { onDelete: 'cascade' }),
    orderedByDoctor: varchar('ordered_by_doctor', { length: 255 }).notNull(),
    medicationOrdersSummary: text('medication_orders_summary').notNull(),
    woundCareInstructions: text('wound_care_instructions').notNull(),
    drainCareInstructions: text('drain_care_instructions'),
    dietInstructions: varchar('diet_instructions', { length: 255 }).notNull().default('NPO_UNTIL_BOWEL_SOUNDS'),
    mobilizationInstructions: varchar('mobilization_instructions', { length: 255 }).notNull().default('BED_REST_24H'),
    vitalsMonitoringFrequency: varchar('vitals_monitoring_frequency', { length: 100 }).notNull().default('Q2H_FOR_6H'),
    specialPrecautions: text('special_precautions'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_postop_orders_schedule').on(table.scheduleId)
  ]
);

export const postoperativeTransfers = clinicalSchema.table(
  'postoperative_transfers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    transferNumber: varchar('transfer_number', { length: 50 }).notNull(),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => otSchedules.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    originLocation: varchar('origin_location', { length: 100 }).notNull().default('PACU_RECOVERY'),
    destinationWardOrICU: varchar('destination_ward_or_icu', { length: 255 }).notNull(),
    destinationBedNumber: varchar('destination_bed_number', { length: 50 }).notNull(),
    transferringNurse: varchar('transferring_nurse', { length: 255 }).notNull(),
    receivingNurse: varchar('receiving_nurse', { length: 255 }).notNull(),
    clinicalConditionSummary: text('clinical_condition_summary').notNull(),
    transferTime: timestamp('transfer_time', { withTimezone: true }).notNull().defaultNow(),
    status: varchar('status', { length: 50 }).notNull().default('COMPLETED'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_postop_transfers_schedule').on(table.scheduleId),
    uniqueIndex('idx_postop_transfers_num').on(table.tenantId, table.transferNumber)
  ]
);

export const surgeryCancellations = clinicalSchema.table(
  'surgery_cancellations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    cancellationNumber: varchar('cancellation_number', { length: 50 }).notNull(),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => otSchedules.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    procedureName: varchar('procedure_name', { length: 255 }).notNull(),
    cancellationReason: text('cancellation_reason').notNull(),
    cancelledBy: varchar('cancelled_by', { length: 255 }).notNull(),
    cancelledByRole: varchar('cancelled_by_role', { length: 100 }).notNull(),
    reschedulingRequested: boolean('rescheduling_requested').notNull().default(true),
    notes: text('notes'),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_surgery_cancel_schedule').on(table.scheduleId),
    uniqueIndex('idx_surgery_cancel_num').on(table.tenantId, table.cancellationNumber)
  ]
);

export const otAuditTraces = clinicalSchema.table(
  'ot_audit_traces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    traceNumber: varchar('trace_number', { length: 50 }).notNull(),
    actorId: varchar('actor_id', { length: 100 }).notNull(),
    actorName: varchar('actor_name', { length: 255 }).notNull(),
    actorRole: varchar('actor_role', { length: 100 }).notNull(),
    action: varchar('action', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: varchar('entity_id', { length: 100 }).notNull(),
    entityCode: varchar('entity_code', { length: 100 }).notNull(),
    justification: text('justification').notNull(),
    ipAddress: varchar('ip_address', { length: 50 }).notNull().default('127.0.0.1'),
    integrityHash: varchar('integrity_hash', { length: 255 }).notNull(),
    newState: jsonb('new_state').default({}),
    previousHash: varchar('previous_hash', { length: 255 }),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ot_audit_tenant').on(table.tenantId, table.action),
    uniqueIndex('idx_ot_audit_num').on(table.tenantId, table.traceNumber)
  ]
);

/**
 * Phase 2.13 Inferred Types
 */

export type OperationTheatreComplex = typeof operationTheatreComplexes.$inferSelect;
export type NewOperationTheatreComplex = typeof operationTheatreComplexes.$inferInsert;

export type OperationTheatreRoom = typeof operationTheatreRooms.$inferSelect;
export type NewOperationTheatreRoom = typeof operationTheatreRooms.$inferInsert;

export type SurgicalProcedure = typeof surgicalProcedures.$inferSelect;
export type NewSurgicalProcedure = typeof surgicalProcedures.$inferInsert;

export type SurgicalProcedureRequirement = typeof surgicalProcedureRequirements.$inferSelect;
export type NewSurgicalProcedureRequirement = typeof surgicalProcedureRequirements.$inferInsert;

export type SurgeryRequest = typeof surgeryRequests.$inferSelect;
export type NewSurgeryRequest = typeof surgeryRequests.$inferInsert;

export type SurgeryRequestItem = typeof surgeryRequestItems.$inferSelect;
export type NewSurgeryRequestItem = typeof surgeryRequestItems.$inferInsert;

export type PreOperativeAssessment = typeof preOperativeAssessments.$inferSelect;
export type NewPreOperativeAssessment = typeof preOperativeAssessments.$inferInsert;

export type SurgicalConsent = typeof surgicalConsents.$inferSelect;
export type NewSurgicalConsent = typeof surgicalConsents.$inferInsert;

export type OTSchedule = typeof otSchedules.$inferSelect;
export type NewOTSchedule = typeof otSchedules.$inferInsert;

export type OTScheduleStaff = typeof otScheduleStaff.$inferSelect;
export type NewOTScheduleStaff = typeof otScheduleStaff.$inferInsert;

export type OTResourceAllocation = typeof otResourceAllocations.$inferSelect;
export type NewOTResourceAllocation = typeof otResourceAllocations.$inferInsert;

export type PreOpChecklist = typeof preOpChecklists.$inferSelect;
export type NewPreOpChecklist = typeof preOpChecklists.$inferInsert;

export type SurgicalSafetyChecklist = typeof surgicalSafetyChecklists.$inferSelect;
export type NewSurgicalSafetyChecklist = typeof surgicalSafetyChecklists.$inferInsert;

export type OTTransfer = typeof otTransfers.$inferSelect;
export type NewOTTransfer = typeof otTransfers.$inferInsert;

export type AnaesthesiaRecord = typeof anaesthesiaRecords.$inferSelect;
export type NewAnaesthesiaRecord = typeof anaesthesiaRecords.$inferInsert;

export type IntraoperativeRecord = typeof intraoperativeRecords.$inferSelect;
export type NewIntraoperativeRecord = typeof intraoperativeRecords.$inferInsert;

export type OperativeNote = typeof operativeNotes.$inferSelect;
export type NewOperativeNote = typeof operativeNotes.$inferInsert;

export type OTNursingNote = typeof otNursingNotes.$inferSelect;
export type NewOTNursingNote = typeof otNursingNotes.$inferInsert;

export type SurgicalSpecimen = typeof surgicalSpecimens.$inferSelect;
export type NewSurgicalSpecimen = typeof surgicalSpecimens.$inferInsert;

export type SurgicalImplant = typeof surgicalImplants.$inferSelect;
export type NewSurgicalImplant = typeof surgicalImplants.$inferInsert;

export type SurgicalConsumableUsage = typeof surgicalConsumableUsage.$inferSelect;
export type NewSurgicalConsumableUsage = typeof surgicalConsumableUsage.$inferInsert;

export type PACURecoveryRecord = typeof pacuRecoveryRecords.$inferSelect;
export type NewPACURecoveryRecord = typeof pacuRecoveryRecords.$inferInsert;

export type PostoperativeOrder = typeof postoperativeOrders.$inferSelect;
export type NewPostoperativeOrder = typeof postoperativeOrders.$inferInsert;

export type PostoperativeTransfer = typeof postoperativeTransfers.$inferSelect;
export type NewPostoperativeTransfer = typeof postoperativeTransfers.$inferInsert;

export type SurgeryCancellation = typeof surgeryCancellations.$inferSelect;
export type NewSurgeryCancellation = typeof surgeryCancellations.$inferInsert;

export type OTAuditTrace = typeof otAuditTraces.$inferSelect;
export type NewOTAuditTrace = typeof otAuditTraces.$inferInsert;

// ============================================================================
// PHASE 2.14: EMERGENCY DEPARTMENT (ED) & TRAUMA CARE SCHEMAS
// ============================================================================

export const emergencyDepartments = clinicalSchema.table(
  'emergency_departments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    departmentCode: varchar('department_code', { length: 64 }).notNull(),
    departmentName: varchar('department_name', { length: 255 }).notNull(),
    totalBeds: integer('total_beds').notNull().default(20),
    resuscitationBeds: integer('resuscitation_beds').notNull().default(4),
    traumaBeds: integer('trauma_beds').notNull().default(4),
    observationBeds: integer('observation_beds').notNull().default(8),
    headOfEmergency: varchar('head_of_emergency', { length: 255 }).notNull(),
    isDisasterModeActive: boolean('is_disaster_mode_active').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_ed_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_ed_code_branch').on(table.tenantId, table.branchId, table.departmentCode)
  ]
);

export const emergencyZones = clinicalSchema.table(
  'emergency_zones',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    departmentId: uuid('department_id').notNull().references(() => emergencyDepartments.id, { onDelete: 'cascade' }),
    zoneCode: varchar('zone_code', { length: 64 }).notNull(),
    zoneName: varchar('zone_name', { length: 255 }).notNull(),
    zoneType: varchar('zone_type', { length: 64 }).notNull(),
    capacity: integer('capacity').notNull().default(4),
    occupiedCount: integer('occupied_count').notNull().default(0),
    chargePerHour: numeric('charge_per_hour', { precision: 12, scale: 2 }).notNull().default('0.00'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_ez_tenant_dept').on(table.tenantId, table.departmentId),
    uniqueIndex('idx_ez_code').on(table.tenantId, table.departmentId, table.zoneCode)
  ]
);

export const emergencyEncounters = clinicalSchema.table(
  'emergency_encounters',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    encounterNumber: varchar('encounter_number', { length: 64 }).notNull(),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    isUnknownPatient: boolean('is_unknown_patient').notNull().default(false),
    temporaryIdentifier: varchar('temporary_identifier', { length: 64 }),
    patientGender: varchar('patient_gender', { length: 32 }).notNull().default('UNKNOWN'),
    patientAge: integer('patient_age'),
    arrivalMode: varchar('arrival_mode', { length: 64 }).notNull().default('WALK_IN'),
    broughtBy: varchar('brought_by', { length: 255 }).notNull(),
    referralSource: text('referral_source'),
    chiefComplaint: text('chief_complaint').notNull(),
    arrivalTimestamp: timestamp('arrival_timestamp', { withTimezone: true }).defaultNow().notNull(),
    registrationTimestamp: timestamp('registration_timestamp', { withTimezone: true }).defaultNow().notNull(),
    currentStatus: varchar('current_status', { length: 64 }).notNull().default('ARRIVED'),
    currentZoneId: uuid('current_zone_id').references(() => emergencyZones.id),
    currentZoneName: varchar('current_zone_name', { length: 255 }),
    currentBedNumber: varchar('current_bed_number', { length: 64 }),
    assignedPhysicianName: varchar('assigned_physician_name', { length: 255 }),
    assignedNurseName: varchar('assigned_nurse_name', { length: 255 }),
    triageEsiLevel: varchar('triage_esi_level', { length: 64 }),
    isTraumaAlert: boolean('is_trauma_alert').notNull().default(false),
    isCodeBlue: boolean('is_code_blue').notNull().default(false),
    isMLC: boolean('is_mlc').notNull().default(false),
    mlcCaseNumber: varchar('mlc_case_number', { length: 64 }),
    dispositionOutcome: varchar('disposition_outcome', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_ee_tenant_branch').on(table.tenantId, table.branchId),
    index('idx_ee_status').on(table.tenantId, table.currentStatus),
    uniqueIndex('idx_ee_number').on(table.tenantId, table.encounterNumber)
  ]
);

export const emergencyTriageAssessments = clinicalSchema.table(
  'emergency_triage_assessments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    encounterId: uuid('encounter_id').notNull().references(() => emergencyEncounters.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    triageNurseName: varchar('triage_nurse_name', { length: 255 }).notNull(),
    esiLevel: varchar('esi_level', { length: 64 }).notNull(),
    chiefComplaint: text('chief_complaint').notNull(),
    painScore: integer('pain_score').notNull().default(0),
    systolicBp: integer('systolic_bp').notNull(),
    diastolicBp: integer('diastolic_bp').notNull(),
    pulseRate: integer('pulse_rate').notNull(),
    respiratoryRate: integer('respiratory_rate').notNull(),
    temperatureF: numeric('temperature_f', { precision: 5, scale: 2 }).notNull(),
    spo2Percentage: numeric('spo2_percentage', { precision: 5, scale: 2 }).notNull(),
    gcsScore: integer('gcs_score').notNull().default(15),
    bloodGlucoseMgDl: numeric('blood_glucose_mg_dl', { precision: 6, scale: 2 }),
    isPregnant: boolean('is_pregnant'),
    allergiesNoted: text('allergies_noted').notNull(),
    highRiskIndicators: text('high_risk_indicators'),
    sepsisScreenPositive: boolean('sepsis_screen_positive').notNull().default(false),
    strokeScreenPositive: boolean('stroke_screen_positive').notNull().default(false),
    stemiScreenPositive: boolean('stemi_screen_positive').notNull().default(false),
    triageNotes: text('triage_notes').notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_eta_tenant_encounter').on(table.tenantId, table.encounterId),
    index('idx_eta_esi').on(table.tenantId, table.esiLevel)
  ]
);

export const emergencyTriageReassessments = clinicalSchema.table(
  'emergency_triage_reassessments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    encounterId: uuid('encounter_id').notNull().references(() => emergencyEncounters.id, { onDelete: 'cascade' }),
    reassessedByNurse: varchar('reassessed_by_nurse', { length: 255 }).notNull(),
    previousEsi: varchar('previous_esi', { length: 64 }).notNull(),
    newEsi: varchar('new_esi', { length: 64 }).notNull(),
    justification: text('justification').notNull(),
    reassessmentVitalsSummary: text('reassessment_vitals_summary').notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_etr_tenant_encounter').on(table.tenantId, table.encounterId)
  ]
);

export const emergencyResuscitationEvents = clinicalSchema.table(
  'emergency_resuscitation_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    encounterId: uuid('encounter_id').notNull().references(() => emergencyEncounters.id, { onDelete: 'cascade' }),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    eventNumber: varchar('event_number', { length: 64 }).notNull(),
    locationBay: varchar('location_bay', { length: 255 }).notNull(),
    teamLeaderName: varchar('team_leader_name', { length: 255 }).notNull(),
    initialRhythm: varchar('initial_rhythm', { length: 64 }).notNull(),
    startTime: timestamp('start_time', { withTimezone: true }).defaultNow().notNull(),
    endTime: timestamp('end_time', { withTimezone: true }),
    cprDurationMinutes: integer('cpr_duration_minutes').notNull().default(0),
    shocksDeliveredCount: integer('shocks_delivered_count').notNull().default(0),
    airwaySecuredType: varchar('airway_secured_type', { length: 255 }).notNull(),
    medicationsAdministeredSummary: text('medications_administered_summary').notNull().default(''),
    roscAchieved: boolean('rosc_achieved').notNull().default(false),
    finalOutcome: varchar('final_outcome', { length: 255 }).notNull().default('IN_PROGRESS'),
    notes: text('notes').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_ere_tenant_encounter').on(table.tenantId, table.encounterId),
    uniqueIndex('idx_ere_event_number').on(table.tenantId, table.eventNumber)
  ]
);

export const traumaActivations = clinicalSchema.table(
  'trauma_activations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    encounterId: uuid('encounter_id').notNull().references(() => emergencyEncounters.id, { onDelete: 'cascade' }),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    activationNumber: varchar('activation_number', { length: 64 }).notNull(),
    activationLevel: varchar('activation_level', { length: 64 }).notNull(),
    mechanismOfInjury: text('mechanism_of_injury').notNull(),
    timeOfInjury: timestamp('time_of_injury', { withTimezone: true }).notNull(),
    traumaTeamLeader: varchar('trauma_team_leader', { length: 255 }).notNull(),
    airwayStatus: varchar('airway_status', { length: 255 }).notNull(),
    breathingStatus: varchar('breathing_status', { length: 255 }).notNull(),
    circulationStatus: varchar('circulation_status', { length: 255 }).notNull(),
    disabilityGcs: integer('disability_gcs').notNull().default(15),
    exposureFindings: text('exposure_findings').notNull(),
    fastScanPositive: boolean('fast_scan_positive').notNull().default(false),
    pelvicBinderApplied: boolean('pelvic_binder_applied').notNull().default(false),
    massiveTransfusionActivated: boolean('massive_transfusion_activated').notNull().default(false),
    specialistConsultsCalled: text('specialist_consults_called').notNull().default(''),
    dispositionPlan: text('disposition_plan').notNull().default(''),
    activatedAt: timestamp('activated_at', { withTimezone: true }).defaultNow().notNull(),
    closedAt: timestamp('closed_at', { withTimezone: true })
  },
  (table) => [
    index('idx_ta_tenant_encounter').on(table.tenantId, table.encounterId),
    uniqueIndex('idx_ta_activation_number').on(table.tenantId, table.activationNumber)
  ]
);

export const emergencyObservationCases = clinicalSchema.table(
  'emergency_observation_cases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    encounterId: uuid('encounter_id').notNull().references(() => emergencyEncounters.id, { onDelete: 'cascade' }),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    observationBedNumber: varchar('observation_bed_number', { length: 64 }).notNull(),
    admissionReason: text('admission_reason').notNull(),
    attendingDoctor: varchar('attending_doctor', { length: 255 }).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    clinicalProgressSummary: text('clinical_progress_summary').notNull(),
    hoursInObservation: numeric('hours_in_observation', { precision: 5, scale: 1 }).notNull().default('0.0'),
    status: varchar('status', { length: 64 }).notNull().default('ACTIVE_MONITORING'),
    finalDecisionNotes: text('final_decision_notes')
  },
  (table) => [
    index('idx_eoc_tenant_encounter').on(table.tenantId, table.encounterId)
  ]
);

export const emergencyMLCCases = clinicalSchema.table(
  'emergency_mlc_cases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    encounterId: uuid('encounter_id').notNull().references(() => emergencyEncounters.id, { onDelete: 'cascade' }),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    mlcNumber: varchar('mlc_number', { length: 64 }).notNull(),
    caseType: varchar('case_type', { length: 64 }).notNull(),
    policeStation: varchar('police_station', { length: 255 }).notNull(),
    policeOfficerName: varchar('police_officer_name', { length: 255 }).notNull(),
    policeBadgeNumber: varchar('police_badge_number', { length: 64 }),
    firNumber: varchar('fir_number', { length: 64 }),
    injuryDescription: text('injury_description').notNull(),
    evidenceItemsCollected: text('evidence_items_collected').notNull().default(''),
    chainOfCustodyCustodian: varchar('chain_of_custody_custodian', { length: 255 }).notNull(),
    governmentNotificationSent: boolean('government_notification_sent').notNull().default(false),
    registeredByDoctor: varchar('registered_by_doctor', { length: 255 }).notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_emlc_tenant_encounter').on(table.tenantId, table.encounterId),
    uniqueIndex('idx_emlc_number').on(table.tenantId, table.mlcNumber)
  ]
);

export const emergencyCrashCarts = clinicalSchema.table(
  'emergency_crash_carts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    cartCode: varchar('cart_code', { length: 64 }).notNull(),
    locationZone: varchar('location_zone', { length: 255 }).notNull(),
    sealNumber: varchar('seal_number', { length: 64 }).notNull(),
    isSealIntact: boolean('is_seal_intact').notNull().default(true),
    lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }).defaultNow().notNull(),
    lastCheckedBy: varchar('last_checked_by', { length: 255 }).notNull(),
    defibrillatorBatteryPercent: integer('defibrillator_battery_percent').notNull().default(100),
    oxygenCylinderPressurePsi: integer('oxygen_cylinder_pressure_psi').notNull().default(2000),
    hasExpiredItems: boolean('has_expired_items').notNull().default(false),
    status: varchar('status', { length: 64 }).notNull().default('READY')
  },
  (table) => [
    index('idx_ecc_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_ecc_cart_code').on(table.tenantId, table.branchId, table.cartCode)
  ]
);

export const emergencyAmbulanceTransfers = clinicalSchema.table(
  'emergency_ambulance_transfers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    encounterId: uuid('encounter_id').notNull().references(() => emergencyEncounters.id, { onDelete: 'cascade' }),
    transferCode: varchar('transfer_code', { length: 64 }).notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    ambulanceNumber: varchar('ambulance_number', { length: 64 }).notNull(),
    transportType: varchar('transport_type', { length: 64 }).notNull().default('INBOUND_RECEIVAL'),
    sendingFacility: varchar('sending_facility', { length: 255 }).notNull(),
    receivingFacility: varchar('receiving_facility', { length: 255 }).notNull(),
    accompanyingParamedic: varchar('accompanying_paramedic', { length: 255 }).notNull(),
    transferReason: text('transfer_reason').notNull(),
    departureTime: timestamp('departure_time', { withTimezone: true }).defaultNow().notNull(),
    arrivalTime: timestamp('arrival_time', { withTimezone: true }),
    status: varchar('status', { length: 64 }).notNull().default('DISPATCHED')
  },
  (table) => [
    index('idx_eat_tenant_encounter').on(table.tenantId, table.encounterId),
    uniqueIndex('idx_eat_transfer_code').on(table.tenantId, table.transferCode)
  ]
);

export const emergencyDispositionRecords = clinicalSchema.table(
  'emergency_disposition_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    encounterId: uuid('encounter_id').notNull().references(() => emergencyEncounters.id, { onDelete: 'cascade' }),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    outcome: varchar('outcome', { length: 64 }).notNull(),
    authorizingPhysician: varchar('authorizing_physician', { length: 255 }).notNull(),
    destinationWardOrFacility: varchar('destination_ward_or_facility', { length: 255 }),
    clinicalSummary: text('clinical_summary').notNull(),
    followUpInstructions: text('follow_up_instructions'),
    dispositionTimestamp: timestamp('disposition_timestamp', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_edr_tenant_encounter').on(table.tenantId, table.encounterId)
  ]
);

export const emergencyDeathRecords = clinicalSchema.table(
  'emergency_death_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    encounterId: uuid('encounter_id').notNull().references(() => emergencyEncounters.id, { onDelete: 'cascade' }),
    deathCertificateNumber: varchar('death_certificate_number', { length: 64 }).notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    isBroughtDead: boolean('is_brought_dead').notNull().default(false),
    declaredDeadTimestamp: timestamp('declared_dead_timestamp', { withTimezone: true }).defaultNow().notNull(),
    declaringPhysician: varchar('declaring_physician', { length: 255 }).notNull(),
    primaryCauseOfDeath: text('primary_cause_of_death').notNull(),
    secondaryCauses: text('secondary_causes'),
    mortuaryHandoverStaff: varchar('mortuary_handover_staff', { length: 255 }).notNull(),
    policeInformed: boolean('police_informed').notNull().default(false),
    notes: text('notes').notNull()
  },
  (table) => [
    index('idx_edead_tenant_encounter').on(table.tenantId, table.encounterId),
    uniqueIndex('idx_edead_cert_number').on(table.tenantId, table.deathCertificateNumber)
  ]
);

export const emergencyDisasterEvents = clinicalSchema.table(
  'emergency_disaster_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    incidentCode: varchar('incident_code', { length: 64 }).notNull(),
    disasterType: varchar('disaster_type', { length: 255 }).notNull(),
    incidentCommanderName: varchar('incident_commander_name', { length: 255 }).notNull(),
    totalVictimsCount: integer('total_victims_count').notNull().default(0),
    criticalVictimsCount: integer('critical_victims_count').notNull().default(0),
    activatedAt: timestamp('activated_at', { withTimezone: true }).defaultNow().notNull(),
    isDeactivated: boolean('is_deactivated').notNull().default(false),
    deactivatedAt: timestamp('deactivated_at', { withTimezone: true })
  },
  (table) => [
    index('idx_ede_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_ede_code').on(table.tenantId, table.incidentCode)
  ]
);

export const emergencyAuditTraces = clinicalSchema.table(
  'emergency_audit_traces',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    traceNumber: varchar('trace_number', { length: 64 }).notNull(),
    actorId: varchar('actor_id', { length: 64 }).notNull(),
    actorName: varchar('actor_name', { length: 255 }).notNull(),
    actorRole: varchar('actor_role', { length: 64 }).notNull(),
    action: varchar('action', { length: 64 }).notNull(),
    entityType: varchar('entity_type', { length: 64 }).notNull(),
    entityId: varchar('entity_id', { length: 64 }).notNull(),
    entityCode: varchar('entity_code', { length: 64 }).notNull(),
    justification: text('justification').notNull(),
    ipAddress: varchar('ip_address', { length: 64 }).notNull().default('127.0.0.1'),
    integrityHash: varchar('integrity_hash', { length: 255 }).notNull(),
    previousHash: varchar('previous_hash', { length: 255 }).notNull(),
    newState: jsonb('new_state').notNull().default({}),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_eatr_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_eatr_trace_num').on(table.tenantId, table.traceNumber)
  ]
);

export type EmergencyDepartment = typeof emergencyDepartments.$inferSelect;
export type EmergencyZone = typeof emergencyZones.$inferSelect;
export type EmergencyEncounter = typeof emergencyEncounters.$inferSelect;
export type EmergencyTriageAssessment = typeof emergencyTriageAssessments.$inferSelect;
export type EmergencyTriageReassessment = typeof emergencyTriageReassessments.$inferSelect;
export type EmergencyResuscitationEvent = typeof emergencyResuscitationEvents.$inferSelect;
export type TraumaActivation = typeof traumaActivations.$inferSelect;
export type EmergencyObservationCase = typeof emergencyObservationCases.$inferSelect;
export type EmergencyMLCCase = typeof emergencyMLCCases.$inferSelect;
export type EmergencyCrashCart = typeof emergencyCrashCarts.$inferSelect;
export type EmergencyAmbulanceTransfer = typeof emergencyAmbulanceTransfers.$inferSelect;
export type EmergencyDispositionRecord = typeof emergencyDispositionRecords.$inferSelect;
export type EmergencyDeathRecord = typeof emergencyDeathRecords.$inferSelect;
export type EmergencyDisasterEvent = typeof emergencyDisasterEvents.$inferSelect;
export type EmergencyAuditTrace = typeof emergencyAuditTraces.$inferSelect;

