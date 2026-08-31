import {
  pgSchema,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  integer,
  numeric,
  boolean,
  type AnyPgColumn
} from 'drizzle-orm/pg-core';
import { tenants } from '../core/tenants.js';
import { branches } from '../core/branches.js';

export const clinicalSchema = pgSchema('clinical');

/**
 * Phase 2 Baseline: Facility Registry (Historical)
 */
export const facilityRegistry = clinicalSchema.table('facility_registry', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: uuid('branch_id')
    .notNull()
    .references(() => branches.id, { onDelete: 'cascade' }),
  facilityType: varchar('facility_type', { length: 50 }).notNull().default('OUTPATIENT'),
  licenseNumber: varchar('license_number', { length: 100 }),
  operationalConfig: jsonb('operational_config').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

/**
 * Phase 2.1: Operational Partners
 * Represents the top-level partner entity in the operational hierarchy.
 */
export const operationalPartners = clinicalSchema.table(
  'operational_partners',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerCode: varchar('partner_code', { length: 100 }).notNull().unique(),
    legalBusinessName: varchar('legal_business_name', { length: 255 }).notNull(),
    partnerType: varchar('partner_type', { length: 50 }).notNull().default('CLINIC_NETWORK'), // CLINIC_NETWORK, HOSPITAL_SYSTEM, INTEGRATED_HEALTHCARE, ENTERPRISE
    contactEmail: varchar('contact_email', { length: 255 }).notNull(),
    contactPhone: varchar('contact_phone', { length: 50 }),
    status: varchar('status', { length: 50 }).notNull().default('ONBOARDING'), // ONBOARDING, ACTIVE, SUSPENDED, INACTIVE, TERMINATED
    onboardingMetadata: jsonb('onboarding_metadata').default({}),
    contractReference: varchar('contract_reference', { length: 255 }),
    subscriptionReference: varchar('subscription_reference', { length: 255 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_op_partners_tenant').on(table.tenantId),
    index('idx_op_partners_status').on(table.status),
    index('idx_op_partners_type').on(table.partnerType)
  ]
);

/**
 * Phase 2.1: Operational Organizations
 * Represents operational Clinic or Hospital entities belonging strictly to one Partner.
 */
export const operationalOrganizations = clinicalSchema.table(
  'operational_organizations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationCode: varchar('organization_code', { length: 100 }).notNull().unique(),
    organizationName: varchar('organization_name', { length: 255 }).notNull(),
    organizationType: varchar('organization_type', { length: 50 }).notNull().default('CLINIC'), // CLINIC, HOSPITAL
    legalEntityReference: varchar('legal_entity_reference', { length: 255 }),
    contactEmail: varchar('contact_email', { length: 255 }).notNull(),
    contactPhone: varchar('contact_phone', { length: 50 }),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, SUSPENDED, INACTIVE
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_op_orgs_tenant').on(table.tenantId),
    index('idx_op_orgs_partner').on(table.partnerId),
    index('idx_op_orgs_type').on(table.organizationType),
    index('idx_op_orgs_status').on(table.status)
  ]
);

/**
 * Phase 2.1: Operational Facilities / Branches
 * Represents physical facility branches under a specific Organization.
 */
export const operationalFacilities = clinicalSchema.table(
  'operational_facilities',
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
    facilityCode: varchar('facility_code', { length: 100 }).notNull().unique(),
    facilityName: varchar('facility_name', { length: 255 }).notNull(),
    facilityType: varchar('facility_type', { length: 50 }).notNull().default('OUTPATIENT_CLINIC'), // OUTPATIENT_CLINIC, INPATIENT_HOSPITAL, DIAGNOSTIC_CENTER, SPECIALTY_CENTER, AMBULATORY_SURGERY
    addressStreet: text('address_street').notNull(),
    addressCity: varchar('address_city', { length: 100 }).notNull(),
    addressState: varchar('address_state', { length: 100 }).notNull(),
    addressPostalCode: varchar('address_postal_code', { length: 20 }).notNull(),
    addressCountry: varchar('address_country', { length: 100 }).notNull().default('US'),
    contactEmail: varchar('contact_email', { length: 255 }).notNull(),
    contactPhone: varchar('contact_phone', { length: 50 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, COMMISSIONING, MAINTENANCE, CLOSED
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_op_facilities_tenant').on(table.tenantId),
    index('idx_op_facilities_partner').on(table.partnerId),
    index('idx_op_facilities_org').on(table.organizationId),
    index('idx_op_facilities_status').on(table.status),
    index('idx_op_facilities_type').on(table.facilityType)
  ]
);

/**
 * Phase 2.1: Operational Subscriptions & Entitlements
 * Links operational organizations to subscribed platform features and active operational modules.
 */
export const operationalSubscriptions = clinicalSchema.table(
  'operational_subscriptions',
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
    planReference: varchar('plan_reference', { length: 100 }).notNull(),
    enabledModules: jsonb('enabled_modules').notNull().default([]), // ['OPD', 'EMR', 'RX', 'LAB', 'PHARMACY', 'BILLING', 'APPOINTMENTS']
    entitlementStatus: varchar('entitlement_status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, RESTRICTED, SUSPENDED, EXPIRED
    effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull(),
    expiryDate: timestamp('expiry_date', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_op_sub_org').on(table.organizationId),
    index('idx_op_sub_tenant').on(table.tenantId),
    index('idx_op_sub_partner').on(table.partnerId),
    index('idx_op_sub_status').on(table.entitlementStatus)
  ]
);

/**
 * Phase 2.1: Operational Audit Traces
 * Immutable audit trace capturing operational mutations across Partner, Organization, and Branch boundaries.
 */
export const operationalAuditTraces = clinicalSchema.table(
  'operational_audit_traces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    traceId: varchar('trace_id', { length: 100 }).notNull().unique(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id').references((): AnyPgColumn => operationalOrganizations.id, { onDelete: 'set null' }),
    branchId: uuid('branch_id').references((): AnyPgColumn => operationalFacilities.id, { onDelete: 'set null' }),
    actorId: varchar('actor_id', { length: 100 }).notNull(),
    actorRole: varchar('actor_role', { length: 50 }).notNull(),
    action: varchar('action', { length: 100 }).notNull(),
    targetEntity: varchar('target_entity', { length: 100 }).notNull(),
    targetEntityId: varchar('target_entity_id', { length: 100 }).notNull(),
    justification: text('justification').notNull(),
    operationStatus: varchar('operation_status', { length: 50 }).notNull().default('SUCCESS'), // SUCCESS, FAILURE, DENIED
    correlationId: varchar('correlation_id', { length: 100 }).notNull(),
    metadata: jsonb('metadata').default({}),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_op_audit_tenant').on(table.tenantId),
    index('idx_op_audit_partner').on(table.partnerId),
    index('idx_op_audit_org').on(table.organizationId),
    index('idx_op_audit_branch').on(table.branchId),
    index('idx_op_audit_status').on(table.operationStatus),
    index('idx_op_audit_occurred').on(table.occurredAt)
  ]
);

/**
 * Phase 2.2: Operational Departments
 * Represents clinical, diagnostic, pharmaceutical, surgical, or administrative departments.
 */
export const operationalDepartments = clinicalSchema.table(
  'operational_departments',
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
    branchId: uuid('branch_id').references((): AnyPgColumn => operationalFacilities.id, { onDelete: 'set null' }),
    departmentCode: varchar('department_code', { length: 100 }).notNull().unique(),
    departmentName: varchar('department_name', { length: 255 }).notNull(),
    parentDepartmentId: uuid('parent_department_id').references((): AnyPgColumn => operationalDepartments.id, {
      onDelete: 'set null'
    }),
    departmentHeadId: varchar('department_head_id', { length: 100 }),
    departmentHeadName: varchar('department_head_name', { length: 255 }),
    costCenterCode: varchar('cost_center_code', { length: 100 }),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, INACTIVE, RESTRUCTURED
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_op_dept_tenant').on(table.tenantId),
    index('idx_op_dept_org').on(table.organizationId),
    index('idx_op_dept_branch').on(table.branchId),
    index('idx_op_dept_parent').on(table.parentDepartmentId),
    index('idx_op_dept_status').on(table.status)
  ]
);

/**
 * Phase 2.2: Operational Staff Directory
 * Master operational registry for doctors, nurses, receptionists, lab technicians, pharmacists, and billing officers.
 */
export const operationalStaff = clinicalSchema.table(
  'operational_staff',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id')
      .notNull()
      .references(() => operationalDepartments.id, { onDelete: 'cascade' }),
    staffCode: varchar('staff_code', { length: 100 }).notNull().unique(),
    fullName: varchar('fullName', { length: 255 }).notNull(),
    workEmail: varchar('work_email', { length: 255 }).notNull(),
    workPhone: varchar('work_phone', { length: 50 }),
    staffType: varchar('staff_type', { length: 50 }).notNull().default('DOCTOR'), // DOCTOR, NURSE, RECEPTIONIST, LAB_TECHNICIAN, PHARMACIST, BILLING_OFFICER, ADMINISTRATIVE, OPERATIONAL_SUPPORT
    primaryRole: varchar('primary_role', { length: 100 }).notNull().default('ATTENDING_PHYSICIAN'),
    employmentType: varchar('employment_type', { length: 50 }).notNull().default('FULL_TIME'), // FULL_TIME, PART_TIME, CONTRACTOR, VISITING_CONSULTANT, INTERN
    employmentStatus: varchar('employment_status', { length: 50 }).notNull().default('ACTIVE'), // INVITED, ACTIVE, ON_LEAVE, SUSPENDED, TRANSFERRED, TERMINATED
    joiningDate: timestamp('joining_date', { withTimezone: true }).notNull(),
    professionalProfileRef: varchar('professional_profile_ref', { length: 255 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_op_staff_tenant').on(table.tenantId),
    index('idx_op_staff_org').on(table.organizationId),
    index('idx_op_staff_branch').on(table.branchId),
    index('idx_op_staff_dept').on(table.departmentId),
    index('idx_op_staff_type').on(table.staffType),
    index('idx_op_staff_status').on(table.employmentStatus),
    index('idx_op_staff_email').on(table.workEmail)
  ]
);

/**
 * Phase 2.2: Staff Role & Data Scope Assignments
 * Explicit role and hierarchical data scope bindings.
 */
export const staffRoleAssignments = clinicalSchema.table(
  'staff_role_assignments',
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
    branchId: uuid('branch_id').references((): AnyPgColumn => operationalFacilities.id, { onDelete: 'set null' }),
    departmentId: uuid('department_id').references((): AnyPgColumn => operationalDepartments.id, { onDelete: 'set null' }),
    staffId: uuid('staff_id')
      .notNull()
      .references(() => operationalStaff.id, { onDelete: 'cascade' }),
    roleCode: varchar('role_code', { length: 100 }).notNull(),
    dataScope: varchar('data_scope', { length: 50 }).notNull().default('BRANCH'), // COMPANY, PARTNER, ORGANIZATION, BRANCH, DEPARTMENT, ASSIGNED, SELF
    isPrimary: varchar('is_primary', { length: 10 }).notNull().default('TRUE'),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    assignedBy: varchar('assigned_by', { length: 100 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_staff_roles_tenant').on(table.tenantId),
    index('idx_staff_roles_staff').on(table.staffId),
    index('idx_staff_roles_role').on(table.roleCode),
    index('idx_staff_roles_scope').on(table.dataScope)
  ]
);

/**
 * Phase 2.2: Staff Professional Credentials & Licensing
 * Audited medical, nursing, pharmacy, or diagnostic licensing records.
 */
export const staffCredentials = clinicalSchema.table(
  'staff_credentials',
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
    staffId: uuid('staff_id')
      .notNull()
      .references(() => operationalStaff.id, { onDelete: 'cascade' }),
    credentialType: varchar('credential_type', { length: 50 }).notNull(), // MEDICAL_LICENSE, SPECIALTY_BOARD_CERTIFICATION, NURSING_LICENSE, PHARMACY_LICENSE, LAB_TECH_CERTIFICATE, BLS_ACLS_CERTIFICATE, DEA_REGISTRATION
    registrationNumber: varchar('registration_number', { length: 100 }).notNull(),
    issuingAuthority: varchar('issuing_authority', { length: 255 }).notNull(),
    issueDate: timestamp('issue_date', { withTimezone: true }).notNull(),
    expiryDate: timestamp('expiry_date', { withTimezone: true }).notNull(),
    verificationStatus: varchar('verification_status', { length: 50 }).notNull().default('PENDING'), // PENDING, VERIFIED, EXPIRED, REVOKED
    verificationReference: varchar('verification_reference', { length: 255 }),
    documentReference: varchar('document_reference', { length: 255 }),
    verifiedBy: varchar('verified_by', { length: 100 }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_staff_cred_tenant').on(table.tenantId),
    index('idx_staff_cred_staff').on(table.staffId),
    index('idx_staff_cred_type').on(table.credentialType),
    index('idx_staff_cred_status').on(table.verificationStatus),
    index('idx_staff_cred_expiry').on(table.expiryDate)
  ]
);

/**
 * Phase 2.2: Staff Transfers
 * Audited movement between departments, branches, or organizations.
 */
export const staffTransfers = clinicalSchema.table(
  'staff_transfers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    staffId: uuid('staff_id')
      .notNull()
      .references(() => operationalStaff.id, { onDelete: 'cascade' }),
    fromOrganizationId: uuid('from_organization_id')
      .notNull()
      .references(() => operationalOrganizations.id, { onDelete: 'cascade' }),
    toOrganizationId: uuid('to_organization_id')
      .notNull()
      .references(() => operationalOrganizations.id, { onDelete: 'cascade' }),
    fromBranchId: uuid('from_branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    toBranchId: uuid('to_branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    fromDepartmentId: uuid('from_department_id')
      .notNull()
      .references(() => operationalDepartments.id, { onDelete: 'cascade' }),
    toDepartmentId: uuid('to_department_id')
      .notNull()
      .references(() => operationalDepartments.id, { onDelete: 'cascade' }),
    transferType: varchar('transfer_type', { length: 50 }).notNull().default('INTRA_BRANCH'), // DEPARTMENT_TRANSFER, BRANCH_TRANSFER, ORGANIZATION_TRANSFER, TEMPORARY_SECONDMENT
    transferStatus: varchar('transfer_status', { length: 50 }).notNull().default('COMPLETED'), // REQUESTED, APPROVED, COMPLETED, CANCELLED
    effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull(),
    authorizedBy: varchar('authorized_by', { length: 100 }).notNull(),
    justification: text('justification').notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_staff_trans_tenant').on(table.tenantId),
    index('idx_staff_trans_staff').on(table.staffId),
    index('idx_staff_trans_type').on(table.transferType),
    index('idx_staff_trans_status').on(table.transferStatus)
  ]
);

/**
 * Phase 2.2: Operational Staff Audit Traces
 * Immutable audit logs specifically for staff mutations, transfers, role assignments, and credentialing.
 */
export const operationalStaffAuditTraces = clinicalSchema.table(
  'operational_staff_audit_traces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    traceId: varchar('trace_id', { length: 100 }).notNull().unique(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id').references((): AnyPgColumn => operationalOrganizations.id, { onDelete: 'set null' }),
    branchId: uuid('branch_id').references((): AnyPgColumn => operationalFacilities.id, { onDelete: 'set null' }),
    departmentId: uuid('department_id').references((): AnyPgColumn => operationalDepartments.id, { onDelete: 'set null' }),
    staffId: uuid('staff_id').references((): AnyPgColumn => operationalStaff.id, { onDelete: 'set null' }),
    actorId: varchar('actor_id', { length: 100 }).notNull(),
    actorRole: varchar('actor_role', { length: 50 }).notNull(),
    action: varchar('action', { length: 100 }).notNull(),
    targetEntity: varchar('target_entity', { length: 100 }).notNull(),
    targetEntityId: varchar('target_entity_id', { length: 100 }).notNull(),
    justification: text('justification').notNull(),
    operationStatus: varchar('operation_status', { length: 50 }).notNull().default('SUCCESS'), // SUCCESS, FAILURE, DENIED
    correlationId: varchar('correlation_id', { length: 100 }).notNull(),
    metadata: jsonb('metadata').default({}),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_op_staff_audit_tenant').on(table.tenantId),
    index('idx_op_staff_audit_partner').on(table.partnerId),
    index('idx_op_staff_audit_org').on(table.organizationId),
    index('idx_op_staff_audit_staff').on(table.staffId),
    index('idx_op_staff_audit_status').on(table.operationStatus),
    index('idx_op_staff_audit_occurred').on(table.occurredAt)
  ]
);

/**
 * Phase 2.3: Doctor Profiles
 * Operational doctor clinical profile linked 1-1 with an operational staff member.
 */
export const doctorProfiles = clinicalSchema.table(
  'doctor_profiles',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id')
      .notNull()
      .references(() => operationalDepartments.id, { onDelete: 'cascade' }),
    staffId: uuid('staff_id')
      .notNull()
      .references(() => operationalStaff.id, { onDelete: 'cascade' }),
    doctorCode: varchar('doctor_code', { length: 100 }).notNull().unique(),
    medicalLicenseNumber: varchar('medical_license_number', { length: 100 }).notNull(),
    qualification: varchar('qualification', { length: 255 }).notNull(), // e.g. MBBS, MD (Cardiology), FACC
    experienceYears: integer('experience_years').notNull().default(0),
    primarySpecialty: varchar('primary_specialty', { length: 100 }).notNull(),
    subSpecialties: jsonb('sub_specialties').notNull().default([]), // array of strings
    consultationModes: jsonb('consultation_modes').notNull().default(['IN_PERSON']), // ['IN_PERSON', 'TELEHEALTH', 'WALK_IN']
    telehealthEligible: varchar('telehealth_eligible', { length: 10 }).notNull().default('TRUE'),
    bioSummary: text('bio_summary'),
    availabilityStatus: varchar('availability_status', { length: 50 }).notNull().default('AVAILABLE'), // AVAILABLE, BUSY, ON_LEAVE, BLOCKED, TEMPORARILY_UNAVAILABLE
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, INACTIVE, SUSPENDED, ON_LEAVE
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_doc_prof_staff').on(table.staffId),
    index('idx_doc_prof_tenant').on(table.tenantId),
    index('idx_doc_prof_org').on(table.organizationId),
    index('idx_doc_prof_branch').on(table.branchId),
    index('idx_doc_prof_dept').on(table.departmentId),
    index('idx_doc_prof_specialty').on(table.primarySpecialty),
    index('idx_doc_prof_status').on(table.status)
  ]
);

/**
 * Phase 2.3: Doctor Specializations
 * Specialty catalog and department associations.
 */
export const doctorSpecializations = clinicalSchema.table(
  'doctor_specializations',
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
    departmentId: uuid('department_id')
      .notNull()
      .references(() => operationalDepartments.id, { onDelete: 'cascade' }),
    specialtyCode: varchar('specialty_code', { length: 100 }).notNull().unique(),
    specialtyName: varchar('specialty_name', { length: 255 }).notNull(),
    isSurgical: varchar('is_surgical', { length: 10 }).notNull().default('FALSE'),
    opdConfig: jsonb('opd_config').notNull().default({ defaultSlotDuration: 15, maxDailyPatients: 30 }),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, INACTIVE
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_doc_spec_tenant').on(table.tenantId),
    index('idx_doc_spec_org').on(table.organizationId),
    index('idx_doc_spec_dept').on(table.departmentId),
    index('idx_doc_spec_status').on(table.status)
  ]
);

/**
 * Phase 2.3: Doctor Schedules (Weekly recurring OPD hours)
 */
export const doctorSchedules = clinicalSchema.table(
  'doctor_schedules',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    doctorId: uuid('doctor_id')
      .notNull()
      .references(() => doctorProfiles.id, { onDelete: 'cascade' }),
    dayOfWeek: varchar('day_of_week', { length: 20 }).notNull(), // MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
    shiftName: varchar('shift_name', { length: 100 }).notNull().default('MORNING_OPD'),
    startTime: varchar('start_time', { length: 10 }).notNull(), // e.g. "09:00"
    endTime: varchar('end_time', { length: 10 }).notNull(), // e.g. "13:00"
    slotDurationMinutes: integer('slot_duration_minutes').notNull().default(15),
    maxPatientsPerSlot: integer('max_patients_per_slot').notNull().default(1),
    bufferTimeMinutes: integer('buffer_time_minutes').notNull().default(0),
    consultationMode: varchar('consultation_mode', { length: 50 }).notNull().default('IN_PERSON'), // IN_PERSON, TELEHEALTH, HYBRID, WALK_IN
    roomNumber: varchar('room_number', { length: 50 }),
    isActive: varchar('is_active', { length: 10 }).notNull().default('TRUE'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_doc_sched_tenant').on(table.tenantId),
    index('idx_doc_sched_doc').on(table.doctorId),
    index('idx_doc_sched_branch').on(table.branchId),
    index('idx_doc_sched_day').on(table.dayOfWeek)
  ]
);

/**
 * Phase 2.3: Doctor Schedule Breaks
 */
export const doctorScheduleBreaks = clinicalSchema.table(
  'doctor_schedule_breaks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => doctorSchedules.id, { onDelete: 'cascade' }),
    breakName: varchar('break_name', { length: 100 }).notNull().default('LUNCH_BREAK'),
    startTime: varchar('start_time', { length: 10 }).notNull(), // e.g. "12:00"
    endTime: varchar('end_time', { length: 10 }).notNull(), // e.g. "12:30"
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_doc_sched_brk_tenant').on(table.tenantId),
    index('idx_doc_sched_brk_sched').on(table.scheduleId)
  ]
);

/**
 * Phase 2.3: Doctor Leaves & Calendar Exclusions
 */
export const doctorLeaves = clinicalSchema.table(
  'doctor_leaves',
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
    branchId: uuid('branch_id').references((): AnyPgColumn => operationalFacilities.id, { onDelete: 'set null' }),
    doctorId: uuid('doctor_id')
      .notNull()
      .references(() => doctorProfiles.id, { onDelete: 'cascade' }),
    leaveType: varchar('leave_type', { length: 50 }).notNull().default('PLANNED_LEAVE'), // PLANNED_LEAVE, EMERGENCY_LEAVE, MEDICAL_LEAVE, CONFERENCE, CASUAL_LEAVE
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    reason: text('reason').notNull(),
    approvalStatus: varchar('approval_status', { length: 50 }).notNull().default('APPROVED'), // PENDING, APPROVED, REJECTED, CANCELLED
    approvedBy: varchar('approved_by', { length: 100 }),
    affectedSlotsCount: integer('affected_slots_count').notNull().default(0),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_doc_leave_tenant').on(table.tenantId),
    index('idx_doc_leave_doc').on(table.doctorId),
    index('idx_doc_leave_status').on(table.approvalStatus),
    index('idx_doc_leave_dates').on(table.startDate, table.endDate)
  ]
);

/**
 * Phase 2.3: OPD Slots
 * Discrete operational appointment/consultation slots generated from schedule rules.
 */
export const opdSlots = clinicalSchema.table(
  'opd_slots',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    doctorId: uuid('doctor_id')
      .notNull()
      .references(() => doctorProfiles.id, { onDelete: 'cascade' }),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => doctorSchedules.id, { onDelete: 'cascade' }),
    slotDate: varchar('slot_date', { length: 20 }).notNull(), // YYYY-MM-DD
    startTime: varchar('start_time', { length: 10 }).notNull(), // "09:00"
    endTime: varchar('end_time', { length: 10 }).notNull(), // "09:15"
    consultationMode: varchar('consultation_mode', { length: 50 }).notNull().default('IN_PERSON'), // IN_PERSON, TELEHEALTH, WALK_IN
    bookingStatus: varchar('booking_status', { length: 50 }).notNull().default('AVAILABLE'), // AVAILABLE, BOOKED, BLOCKED, LEAVE_CONFLICT
    blockReason: text('block_reason'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_opd_slot_tenant').on(table.tenantId),
    index('idx_opd_slot_doc_date').on(table.doctorId, table.slotDate),
    index('idx_opd_slot_branch').on(table.branchId),
    index('idx_opd_slot_status').on(table.bookingStatus)
  ]
);

/**
 * Phase 2.3: Consultation Fee Matrices
 * Hierarchical price schedules for consultations across Organization, Branch, Specialty, or Doctor scopes.
 */
export const consultationFeeMatrices = clinicalSchema.table(
  'consultation_fee_matrices',
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
    branchId: uuid('branch_id').references((): AnyPgColumn => operationalFacilities.id, { onDelete: 'set null' }),
    doctorId: uuid('doctor_id').references((): AnyPgColumn => doctorProfiles.id, { onDelete: 'set null' }),
    specialtyCode: varchar('specialty_code', { length: 100 }),
    consultationType: varchar('consultation_type', { length: 50 }).notNull().default('NEW_PATIENT'), // NEW_PATIENT, FOLLOW_UP, TELECONSULTATION, EMERGENCY, SECOND_OPINION
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    baseFeeAmount: numeric('base_fee_amount', { precision: 10, scale: 2 }).notNull(),
    followUpValidityDays: integer('follow_up_validity_days').notNull().default(14),
    effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull(),
    expiryDate: timestamp('expiry_date', { withTimezone: true }),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, INACTIVE, DEPRECATED
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_fee_mat_tenant').on(table.tenantId),
    index('idx_fee_mat_org').on(table.organizationId),
    index('idx_fee_mat_doc').on(table.doctorId),
    index('idx_fee_mat_type').on(table.consultationType),
    index('idx_fee_mat_status').on(table.status)
  ]
);

/**
 * Phase 2.3: Doctor & OPD Audit Traces
 * Immutable audit logs specifically for doctor profile modifications, schedule creation, leaves, slot blocking, and fee alterations.
 */
export const doctorOpdAuditTraces = clinicalSchema.table(
  'doctor_opd_audit_traces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    traceId: varchar('trace_id', { length: 100 }).notNull().unique(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id').references((): AnyPgColumn => operationalOrganizations.id, { onDelete: 'set null' }),
    branchId: uuid('branch_id').references((): AnyPgColumn => operationalFacilities.id, { onDelete: 'set null' }),
    doctorId: uuid('doctor_id').references((): AnyPgColumn => doctorProfiles.id, { onDelete: 'set null' }),
    actorId: varchar('actor_id', { length: 100 }).notNull(),
    actorRole: varchar('actor_role', { length: 50 }).notNull(),
    action: varchar('action', { length: 100 }).notNull(),
    targetEntity: varchar('target_entity', { length: 100 }).notNull(),
    targetEntityId: varchar('target_entity_id', { length: 100 }).notNull(),
    justification: text('justification').notNull(),
    operationStatus: varchar('operation_status', { length: 50 }).notNull().default('SUCCESS'), // SUCCESS, FAILURE, DENIED
    correlationId: varchar('correlation_id', { length: 100 }).notNull(),
    metadata: jsonb('metadata').default({}),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_doc_opd_audit_tenant').on(table.tenantId),
    index('idx_doc_opd_audit_partner').on(table.partnerId),
    index('idx_doc_opd_audit_org').on(table.organizationId),
    index('idx_doc_opd_audit_doc').on(table.doctorId),
    index('idx_doc_opd_audit_status').on(table.operationStatus),
    index('idx_doc_opd_audit_occurred').on(table.occurredAt)
  ]
);

/**
 * Phase 2.4: Master Patient Index (MPI) - Patients Registry
 */
export const patients = clinicalSchema.table(
  'patients',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    mrn: varchar('mrn', { length: 100 }).notNull(),
    patientCode: varchar('patient_code', { length: 100 }).notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    middleName: varchar('middle_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    preferredName: varchar('preferred_name', { length: 100 }),
    dateOfBirth: varchar('date_of_birth', { length: 50 }).notNull(), // YYYY-MM-DD
    gender: varchar('gender', { length: 50 }).notNull(), // MALE, FEMALE, OTHER, UNKNOWN
    bloodGroup: varchar('blood_group', { length: 20 }), // A_POSITIVE, A_NEGATIVE, B_POSITIVE, B_NEGATIVE, AB_POSITIVE, AB_NEGATIVE, O_POSITIVE, O_NEGATIVE, UNKNOWN
    maritalStatus: varchar('marital_status', { length: 50 }), // SINGLE, MARRIED, DIVORCED, WIDOWED, OTHER
    nationality: varchar('nationality', { length: 100 }),
    preferredLanguage: varchar('preferred_language', { length: 100 }).notNull().default('English'),
    occupation: varchar('occupation', { length: 150 }),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, INACTIVE, DECEASED, MERGED, DUPLICATE_REVIEW, BLOCKED
    registrationSource: varchar('registration_source', { length: 100 }).notNull().default('RECEPTION_DESK'), // RECEPTION_DESK, ONLINE_PORTAL, EMERGENCY_TRANSFER, REFERRAL
    mergedIntoPatientId: uuid('merged_into_patient_id').references((): AnyPgColumn => patients.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_patients_tenant').on(table.tenantId),
    index('idx_patients_partner').on(table.partnerId),
    index('idx_patients_org').on(table.organizationId),
    index('idx_patients_branch').on(table.branchId),
    index('idx_patients_mrn').on(table.mrn),
    index('idx_patients_status').on(table.status),
    index('idx_patients_dob').on(table.dateOfBirth),
    index('idx_patients_name').on(table.lastName, table.firstName),
    uniqueIndex('idx_patients_tenant_mrn').on(table.tenantId, table.mrn)
  ]
);

/**
 * Phase 2.4: Patient Contact Information
 */
export const patientContacts = clinicalSchema.table(
  'patient_contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    primaryMobile: varchar('primary_mobile', { length: 50 }).notNull(),
    alternateMobile: varchar('alternate_mobile', { length: 50 }),
    email: varchar('email', { length: 255 }),
    preferredContactMethod: varchar('preferred_contact_method', { length: 50 }).notNull().default('MOBILE'), // MOBILE, EMAIL, SMS, WHATSAPP
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_patient_contacts_tenant').on(table.tenantId),
    index('idx_patient_contacts_patient').on(table.patientId),
    index('idx_patient_contacts_mobile').on(table.primaryMobile),
    index('idx_patient_contacts_email').on(table.email)
  ]
);

/**
 * Phase 2.4: Patient Addresses
 */
export const patientAddresses = clinicalSchema.table(
  'patient_addresses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    addressType: varchar('address_type', { length: 50 }).notNull().default('RESIDENTIAL'), // RESIDENTIAL, PERMANENT, TEMPORARY, WORK
    addressLine1: varchar('address_line1', { length: 255 }).notNull(),
    addressLine2: varchar('address_line2', { length: 255 }),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 100 }).notNull(),
    country: varchar('country', { length: 100 }).notNull().default('USA'),
    postalCode: varchar('postal_code', { length: 50 }).notNull(),
    isPrimary: varchar('is_primary', { length: 10 }).notNull().default('TRUE'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_patient_addresses_tenant').on(table.tenantId),
    index('idx_patient_addresses_patient').on(table.patientId),
    index('idx_patient_addresses_city').on(table.city)
  ]
);

/**
 * Phase 2.4: Patient Emergency Contacts
 */
export const patientEmergencyContacts = clinicalSchema.table(
  'patient_emergency_contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => operationalPartners.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    contactName: varchar('contact_name', { length: 255 }).notNull(),
    relationship: varchar('relationship', { length: 100 }).notNull(), // SPOUSE, PARENT, SIBLING, CHILD, GUARDIAN, FRIEND, OTHER
    primaryPhone: varchar('primary_phone', { length: 50 }).notNull(),
    alternatePhone: varchar('alternate_phone', { length: 50 }),
    address: text('address'),
    isPrimary: varchar('is_primary', { length: 10 }).notNull().default('TRUE'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_patient_emerg_tenant').on(table.tenantId),
    index('idx_patient_emerg_patient').on(table.patientId)
  ]
);

/**
 * Phase 2.4: Patient Identifiers Registry
 */
export const patientIdentifiers = clinicalSchema.table(
  'patient_identifiers',
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
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    identifierType: varchar('identifier_type', { length: 50 }).notNull(), // MRN, NATIONAL_HEALTH_ID, DRIVER_LICENSE_REF, PASSPORT_REF, INSURANCE_MEMBER_ID, EXTERNAL_HOSPITAL_ID
    identifierValue: varchar('identifier_value', { length: 255 }).notNull(),
    issuingAuthority: varchar('issuing_authority', { length: 255 }),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, REVOKED, EXPIRED, SUPERSEDED
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_patient_ident_tenant').on(table.tenantId),
    index('idx_patient_ident_patient').on(table.patientId),
    index('idx_patient_ident_val').on(table.identifierType, table.identifierValue)
  ]
);

/**
 * Phase 2.4: Patient Consent Directives
 */
export const patientConsents = clinicalSchema.table(
  'patient_consents',
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
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    consentType: varchar('consent_type', { length: 50 }).notNull(), // GENERAL_REGISTRATION, COMMUNICATION_SMS_EMAIL, DATA_SHARING_HIE, TREATMENT_DISCLOSURE, TELEHEALTH_CONSENT
    consentStatus: varchar('consent_status', { length: 50 }).notNull().default('GRANTED'), // GRANTED, REVOKED, EXPIRED, PENDING
    effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull().defaultNow(),
    expiryDate: timestamp('expiry_date', { withTimezone: true }),
    recordedBy: varchar('recorded_by', { length: 255 }).notNull(),
    auditReference: varchar('audit_reference', { length: 255 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_patient_consents_tenant').on(table.tenantId),
    index('idx_patient_consents_patient').on(table.patientId),
    index('idx_patient_consents_type').on(table.consentType)
  ]
);

/**
 * Phase 2.4: Patient Insurance & TPA Policies
 */
export const patientInsurancePolicies = clinicalSchema.table(
  'patient_insurance_policies',
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
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    payerName: varchar('payer_name', { length: 255 }).notNull(),
    policyNumber: varchar('policy_number', { length: 100 }).notNull(),
    memberId: varchar('member_id', { length: 100 }).notNull(),
    planName: varchar('plan_name', { length: 255 }).notNull(),
    tpaName: varchar('tpa_name', { length: 255 }),
    coverageType: varchar('coverage_type', { length: 50 }).notNull().default('PRIMARY'), // PRIMARY, SECONDARY, TERTIARY
    eligibilityStatus: varchar('eligibility_status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, EXPIRED, VERIFICATION_PENDING, INACTIVE
    coverageStartDate: timestamp('coverage_start_date', { withTimezone: true }).notNull(),
    coverageEndDate: timestamp('coverage_end_date', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_patient_ins_tenant').on(table.tenantId),
    index('idx_patient_ins_patient').on(table.patientId),
    index('idx_patient_ins_policy').on(table.policyNumber)
  ]
);

/**
 * Phase 2.4: Duplicate Patient Candidates
 */
export const patientDuplicateCandidates = clinicalSchema.table(
  'patient_duplicate_candidates',
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
    sourcePatientId: uuid('source_patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    matchedPatientId: uuid('matched_patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    confidenceScore: numeric('confidence_score', { precision: 5, scale: 2 }).notNull(),
    matchCategory: varchar('match_category', { length: 50 }).notNull(), // EXACT_MATCH, HIGH_CONFIDENCE, POSSIBLE_MATCH
    matchingSignals: jsonb('matching_signals').default([]),
    reviewStatus: varchar('review_status', { length: 50 }).notNull().default('PENDING_REVIEW'), // PENDING_REVIEW, RESOLVED_MERGED, RESOLVED_DISTINCT, DISMISSED
    reviewedBy: varchar('reviewed_by', { length: 255 }),
    reviewNotes: text('review_notes'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_patient_dup_tenant').on(table.tenantId),
    index('idx_patient_dup_source').on(table.sourcePatientId),
    index('idx_patient_dup_matched').on(table.matchedPatientId),
    index('idx_patient_dup_status').on(table.reviewStatus)
  ]
);

/**
 * Phase 2.4: Patient Merge Events Ledger
 */
export const patientMergeEvents = clinicalSchema.table(
  'patient_merge_events',
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
    canonicalPatientId: uuid('canonical_patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    mergedPatientId: uuid('merged_patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    actorId: varchar('actor_id', { length: 255 }).notNull(),
    actorRole: varchar('actor_role', { length: 100 }).notNull(),
    mergeReason: text('merge_reason').notNull(),
    mergedSnapshot: jsonb('merged_snapshot').default({}),
    correlationId: varchar('correlation_id', { length: 255 }).notNull(),
    mergedAt: timestamp('merged_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_patient_merge_tenant').on(table.tenantId),
    index('idx_patient_merge_canonical').on(table.canonicalPatientId),
    index('idx_patient_merge_merged').on(table.mergedPatientId)
  ]
);

/**
 * Phase 2.4: Patient Registration Audit Traces
 */
export const patientRegistrationAuditTraces = clinicalSchema.table(
  'patient_registration_audit_traces',
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
    branchId: uuid('branch_id')
      .references(() => operationalFacilities.id, { onDelete: 'set null' }),
    patientId: uuid('patient_id'),
    actorId: varchar('actor_id', { length: 100 }).notNull(),
    actorRole: varchar('actor_role', { length: 50 }).notNull(),
    action: varchar('action', { length: 100 }).notNull(),
    targetEntity: varchar('target_entity', { length: 100 }).notNull(),
    targetEntityId: varchar('target_entity_id', { length: 100 }).notNull(),
    justification: text('justification').notNull(),
    operationStatus: varchar('operation_status', { length: 50 }).notNull().default('SUCCESS'), // SUCCESS, FAILURE, DENIED
    correlationId: varchar('correlation_id', { length: 100 }).notNull(),
    metadata: jsonb('metadata').default({}),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_patient_audit_tenant').on(table.tenantId),
    index('idx_patient_audit_partner').on(table.partnerId),
    index('idx_patient_audit_org').on(table.organizationId),
    index('idx_patient_audit_patient').on(table.patientId),
    index('idx_patient_audit_status').on(table.operationStatus),
    index('idx_patient_audit_occurred').on(table.occurredAt)
  ]
);


/**
 * Phase 2.5: Clinical Encounters & Visits Registry
 */
export const encounters = clinicalSchema.table(
  'encounters',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id')
      .notNull()
      .references(() => operationalDepartments.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    doctorId: uuid('doctor_id')
      .references(() => doctorProfiles.id, { onDelete: 'set null' }),
    opdSlotId: uuid('opd_slot_id')
      .references(() => opdSlots.id, { onDelete: 'set null' }),
    encounterNumber: varchar('encounter_number', { length: 100 }).notNull(),
    encounterType: varchar('encounter_type', { length: 50 }).notNull().default('OPD'), // OPD, IPD, EMERGENCY, FOLLOW_UP, TELECONSULTATION, WALK_IN
    status: varchar('status', { length: 50 }).notNull().default('REGISTERED'), // REGISTERED, CHECKED_IN, WAITING, IN_CONSULTATION, COMPLETED, CANCELLED, NO_SHOW, REFERRED, ADMITTED
    priority: varchar('priority', { length: 50 }).notNull().default('ROUTINE'), // ROUTINE, URGENT, EMERGENCY
    consultationMode: varchar('consultation_mode', { length: 50 }).notNull().default('PHYSICAL'), // PHYSICAL, TELEHEALTH, HOME_VISIT
    chiefComplaint: text('chief_complaint').notNull(),
    visitReason: text('visit_reason'),
    triageNotes: text('triage_notes'),
    referralSource: varchar('referral_source', { length: 255 }),
    registeredAt: timestamp('registered_at', { withTimezone: true }).notNull().defaultNow(),
    checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
    consultationStartedAt: timestamp('consultation_started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancellationReason: text('cancellation_reason'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_encounters_tenant').on(table.tenantId),
    index('idx_encounters_partner').on(table.partnerId),
    index('idx_encounters_org').on(table.organizationId),
    index('idx_encounters_branch').on(table.branchId),
    index('idx_encounters_dept').on(table.departmentId),
    index('idx_encounters_patient').on(table.patientId),
    index('idx_encounters_doctor').on(table.doctorId),
    index('idx_encounters_number').on(table.encounterNumber),
    index('idx_encounters_status').on(table.status),
    index('idx_encounters_registered').on(table.registeredAt),
    uniqueIndex('idx_encounters_tenant_number').on(table.tenantId, table.encounterNumber)
  ]
);

/**
 * Phase 2.5: Real-time OPD & Department Encounter Queues
 */
export const encounterQueues = clinicalSchema.table(
  'encounter_queues',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id')
      .notNull()
      .references(() => operationalDepartments.id, { onDelete: 'cascade' }),
    doctorId: uuid('doctor_id')
      .references(() => doctorProfiles.id, { onDelete: 'set null' }),
    encounterId: uuid('encounter_id')
      .notNull()
      .references(() => encounters.id, { onDelete: 'cascade' }),
    tokenNumber: varchar('token_number', { length: 50 }).notNull(), // Q-001, Q-002...
    queueDate: varchar('queue_date', { length: 50 }).notNull(), // YYYY-MM-DD
    queueStatus: varchar('queue_status', { length: 50 }).notNull().default('WAITING'), // WAITING, CALLED, IN_PROGRESS, SERVED, MISSED, CANCELLED
    estimatedWaitMinutes: integer('estimated_wait_minutes').notNull().default(15),
    calledAt: timestamp('called_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_enc_queue_tenant').on(table.tenantId),
    index('idx_enc_queue_org').on(table.organizationId),
    index('idx_enc_queue_branch').on(table.branchId),
    index('idx_enc_queue_dept').on(table.departmentId),
    index('idx_enc_queue_doc').on(table.doctorId),
    index('idx_enc_queue_status').on(table.queueStatus),
    index('idx_enc_queue_date').on(table.queueDate)
  ]
);

/**
 * Phase 2.5: Clinical Encounter Referrals
 */
export const encounterReferrals = clinicalSchema.table(
  'encounter_referrals',
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
    encounterId: uuid('encounter_id')
      .notNull()
      .references(() => encounters.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    referralType: varchar('referral_type', { length: 50 }).notNull().default('INTERNAL_SPECIALIST'), // INTERNAL_DEPARTMENT, INTERNAL_SPECIALIST, EXTERNAL_HOSPITAL, DIAGNOSTIC_CENTER
    referringDoctorId: uuid('referring_doctor_id')
      .references(() => doctorProfiles.id, { onDelete: 'set null' }),
    destinationDepartmentId: uuid('destination_department_id')
      .references(() => operationalDepartments.id, { onDelete: 'set null' }),
    destinationDoctorId: uuid('destination_doctor_id')
      .references(() => doctorProfiles.id, { onDelete: 'set null' }),
    destinationFacilityName: varchar('destination_facility_name', { length: 255 }),
    clinicalSummary: text('clinical_summary').notNull(),
    urgency: varchar('urgency', { length: 50 }).notNull().default('ROUTINE'), // ROUTINE, URGENT, STAT
    referralStatus: varchar('referral_status', { length: 50 }).notNull().default('PENDING'), // PENDING, ACCEPTED, COMPLETED, DECLINED
    referredAt: timestamp('referred_at', { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_enc_ref_tenant').on(table.tenantId),
    index('idx_enc_ref_enc').on(table.encounterId),
    index('idx_enc_ref_patient').on(table.patientId),
    index('idx_enc_ref_status').on(table.referralStatus)
  ]
);

/**
 * Phase 2.5: Encounter Mutation Audit Traces
 */
export const encounterAuditTraces = clinicalSchema.table(
  'encounter_audit_traces',
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
    branchId: uuid('branch_id')
      .references(() => operationalFacilities.id, { onDelete: 'set null' }),
    encounterId: uuid('encounter_id'),
    patientId: uuid('patient_id'),
    actorId: varchar('actor_id', { length: 100 }).notNull(),
    actorRole: varchar('actor_role', { length: 50 }).notNull(),
    action: varchar('action', { length: 100 }).notNull(),
    targetEntity: varchar('target_entity', { length: 100 }).notNull(),
    targetEntityId: varchar('target_entity_id', { length: 100 }).notNull(),
    justification: text('justification').notNull(),
    operationStatus: varchar('operation_status', { length: 50 }).notNull().default('SUCCESS'), // SUCCESS, FAILURE, DENIED
    correlationId: varchar('correlation_id', { length: 100 }).notNull(),
    metadata: jsonb('metadata').default({}),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_enc_audit_tenant').on(table.tenantId),
    index('idx_enc_audit_partner').on(table.partnerId),
    index('idx_enc_audit_org').on(table.organizationId),
    index('idx_enc_audit_enc').on(table.encounterId),
    index('idx_enc_audit_patient').on(table.patientId),
    index('idx_enc_audit_status').on(table.operationStatus),
    index('idx_enc_audit_occurred').on(table.occurredAt)
  ]
);

export type OperationalPartner = typeof operationalPartners.$inferSelect;
export type NewOperationalPartner = typeof operationalPartners.$inferInsert;

export type OperationalOrganization = typeof operationalOrganizations.$inferSelect;
export type NewOperationalOrganization = typeof operationalOrganizations.$inferInsert;

export type OperationalFacility = typeof operationalFacilities.$inferSelect;
export type NewOperationalFacility = typeof operationalFacilities.$inferInsert;

export type OperationalSubscription = typeof operationalSubscriptions.$inferSelect;
export type NewOperationalSubscription = typeof operationalSubscriptions.$inferInsert;

export type OperationalAuditTrace = typeof operationalAuditTraces.$inferSelect;
export type NewOperationalAuditTrace = typeof operationalAuditTraces.$inferInsert;

export type OperationalDepartment = typeof operationalDepartments.$inferSelect;
export type NewOperationalDepartment = typeof operationalDepartments.$inferInsert;

export type OperationalStaff = typeof operationalStaff.$inferSelect;
export type NewOperationalStaff = typeof operationalStaff.$inferInsert;

export type StaffRoleAssignment = typeof staffRoleAssignments.$inferSelect;
export type NewStaffRoleAssignment = typeof staffRoleAssignments.$inferInsert;

export type StaffCredential = typeof staffCredentials.$inferSelect;
export type NewStaffCredential = typeof staffCredentials.$inferInsert;

export type StaffTransfer = typeof staffTransfers.$inferSelect;
export type NewStaffTransfer = typeof staffTransfers.$inferInsert;

export type OperationalStaffAuditTrace = typeof operationalStaffAuditTraces.$inferSelect;
export type NewOperationalStaffAuditTrace = typeof operationalStaffAuditTraces.$inferInsert;

export type DoctorProfile = typeof doctorProfiles.$inferSelect;
export type NewDoctorProfile = typeof doctorProfiles.$inferInsert;

export type DoctorSpecialization = typeof doctorSpecializations.$inferSelect;
export type NewDoctorSpecialization = typeof doctorSpecializations.$inferInsert;

export type DoctorSchedule = typeof doctorSchedules.$inferSelect;
export type NewDoctorSchedule = typeof doctorSchedules.$inferInsert;

export type DoctorScheduleBreak = typeof doctorScheduleBreaks.$inferSelect;
export type NewDoctorScheduleBreak = typeof doctorScheduleBreaks.$inferInsert;

export type DoctorLeave = typeof doctorLeaves.$inferSelect;
export type NewDoctorLeave = typeof doctorLeaves.$inferInsert;

export type OpdSlot = typeof opdSlots.$inferSelect;
export type NewOpdSlot = typeof opdSlots.$inferInsert;

export type ConsultationFeeMatrix = typeof consultationFeeMatrices.$inferSelect;
export type NewConsultationFeeMatrix = typeof consultationFeeMatrices.$inferInsert;

export type DoctorOpdAuditTrace = typeof doctorOpdAuditTraces.$inferSelect;
export type NewDoctorOpdAuditTrace = typeof doctorOpdAuditTraces.$inferInsert;

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;

export type PatientContact = typeof patientContacts.$inferSelect;
export type NewPatientContact = typeof patientContacts.$inferInsert;

export type PatientAddress = typeof patientAddresses.$inferSelect;
export type NewPatientAddress = typeof patientAddresses.$inferInsert;

export type PatientEmergencyContact = typeof patientEmergencyContacts.$inferSelect;
export type NewPatientEmergencyContact = typeof patientEmergencyContacts.$inferInsert;

export type PatientIdentifier = typeof patientIdentifiers.$inferSelect;
export type NewPatientIdentifier = typeof patientIdentifiers.$inferInsert;

export type PatientConsent = typeof patientConsents.$inferSelect;
export type NewPatientConsent = typeof patientConsents.$inferInsert;

export type PatientInsurancePolicy = typeof patientInsurancePolicies.$inferSelect;
export type NewPatientInsurancePolicy = typeof patientInsurancePolicies.$inferInsert;

export type PatientDuplicateCandidate = typeof patientDuplicateCandidates.$inferSelect;
export type NewPatientDuplicateCandidate = typeof patientDuplicateCandidates.$inferInsert;

export type PatientMergeEvent = typeof patientMergeEvents.$inferSelect;
export type NewPatientMergeEvent = typeof patientMergeEvents.$inferInsert;

export type PatientRegistrationAuditTrace = typeof patientRegistrationAuditTraces.$inferSelect;
export type NewPatientRegistrationAuditTrace = typeof patientRegistrationAuditTraces.$inferInsert;

export type Encounter = typeof encounters.$inferSelect;
export type NewEncounter = typeof encounters.$inferInsert;

export type EncounterQueue = typeof encounterQueues.$inferSelect;
export type NewEncounterQueue = typeof encounterQueues.$inferInsert;

export type EncounterReferral = typeof encounterReferrals.$inferSelect;
export type NewEncounterReferral = typeof encounterReferrals.$inferInsert;

/**
 * Phase 2.6: Canonical Clinical Consultations attached to Encounters
 */
export const consultations = clinicalSchema.table(
  'consultations',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    encounterId: uuid('encounter_id')
      .notNull()
      .references(() => encounters.id, { onDelete: 'cascade' }),
    doctorId: uuid('doctor_id')
      .notNull()
      .references(() => doctorProfiles.id, { onDelete: 'cascade' }),
    consultationNumber: varchar('consultation_number', { length: 100 }).notNull(),
    consultationStatus: varchar('consultation_status', { length: 50 }).notNull().default('DRAFT'), // DRAFT, STARTED, IN_PROGRESS, READY_FOR_COMPLETION, COMPLETED, CANCELLED
    consultationType: varchar('consultation_type', { length: 50 }).notNull().default('OPD_CONSULTATION'), // OPD_CONSULTATION, TELECONSULTATION, EMERGENCY_EVALUATION, FOLLOW_UP_REVIEW, INPATIENT_ROUNDS
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    chiefComplaint: text('chief_complaint').notNull(),
    historyOfPresentIllness: text('history_of_present_illness'),
    medicalHistory: text('medical_history'),
    surgicalHistory: text('surgical_history'),
    familyHistory: text('family_history'),
    socialHistory: text('social_history'),
    allergySummary: text('allergy_summary'),
    medicationHistory: text('medication_history'),
    examinationSummary: text('examination_summary'),
    clinicalAssessment: text('clinical_assessment'),
    treatmentPlan: text('treatment_plan'),
    patientInstructions: text('patient_instructions'),
    followUpRequired: boolean('follow_up_required').notNull().default(false),
    followUpNotes: text('follow_up_notes'),
    version: integer('version').notNull().default(1),
    isAmended: boolean('is_amended').notNull().default(false),
    amendmentReason: text('amendment_reason'),
    createdBy: varchar('created_by', { length: 100 }).notNull(),
    updatedBy: varchar('updated_by', { length: 100 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_consultations_tenant').on(table.tenantId),
    index('idx_consultations_partner').on(table.partnerId),
    index('idx_consultations_org').on(table.organizationId),
    index('idx_consultations_branch').on(table.branchId),
    index('idx_consultations_patient').on(table.patientId),
    index('idx_consultations_encounter').on(table.encounterId),
    index('idx_consultations_doctor').on(table.doctorId),
    index('idx_consultations_status').on(table.consultationStatus),
    uniqueIndex('idx_consultations_tenant_number').on(table.tenantId, table.consultationNumber)
  ]
);

/**
 * Phase 2.6: Structured Clinical Vitals and Observations
 */
export const consultationVitals = clinicalSchema.table(
  'consultation_vitals',
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
    consultationId: uuid('consultation_id')
      .notNull()
      .references(() => consultations.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    temperatureCelsius: varchar('temperature_celsius', { length: 20 }),
    pulseBpm: integer('pulse_bpm'),
    respiratoryRateBpm: integer('respiratory_rate_bpm'),
    systolicBp: integer('systolic_bp'),
    diastolicBp: integer('diastolic_bp'),
    oxygenSaturationPercent: integer('oxygen_saturation_percent'),
    weightKg: varchar('weight_kg', { length: 20 }),
    heightCm: varchar('height_cm', { length: 20 }),
    bmi: varchar('bmi', { length: 20 }),
    painScore: integer('pain_score'), // 0-10
    clinicalNotes: text('clinical_notes'),
    recordedBy: varchar('recorded_by', { length: 100 }).notNull(),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_cons_vitals_tenant').on(table.tenantId),
    index('idx_cons_vitals_cons').on(table.consultationId),
    index('idx_cons_vitals_patient').on(table.patientId)
  ]
);

/**
 * Phase 2.6: System-by-System Clinical Examinations
 */
export const consultationExaminations = clinicalSchema.table(
  'consultation_examinations',
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
    consultationId: uuid('consultation_id')
      .notNull()
      .references(() => consultations.id, { onDelete: 'cascade' }),
    generalAppearance: text('general_appearance'),
    cardiovascular: text('cardiovascular'),
    respiratory: text('respiratory'),
    abdomen: text('abdomen'),
    neurological: text('neurological'),
    musculoskeletal: text('musculoskeletal'),
    skin: text('skin'),
    ent: text('ent'),
    eyes: text('eyes'),
    otherFindings: text('other_findings'),
    freeTextFindings: text('free_text_findings'),
    examinedBy: varchar('examined_by', { length: 100 }).notNull(),
    examinedAt: timestamp('examined_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_cons_exam_tenant').on(table.tenantId),
    index('idx_cons_exam_cons').on(table.consultationId)
  ]
);

/**
 * Phase 2.6: Clinical Diagnoses
 */
export const consultationDiagnoses = clinicalSchema.table(
  'consultation_diagnoses',
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
    consultationId: uuid('consultation_id')
      .notNull()
      .references(() => consultations.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    diagnosisCode: varchar('diagnosis_code', { length: 50 }).notNull(),
    diagnosisName: varchar('diagnosis_name', { length: 255 }).notNull(),
    diagnosisType: varchar('diagnosis_type', { length: 50 }).notNull().default('PRIMARY'), // PRIMARY, SECONDARY, DIFFERENTIAL, PROVISIONAL
    clinicalStatus: varchar('clinical_status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, RESOLVED, CHRONIC, INACTIVE
    certainty: varchar('certainty', { length: 50 }).notNull().default('CONFIRMED'), // CONFIRMED, SUSPECTED, RULED_OUT
    isPrimary: boolean('is_primary').notNull().default(false),
    notes: text('notes'),
    recordedBy: varchar('recorded_by', { length: 100 }).notNull(),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_cons_diag_tenant').on(table.tenantId),
    index('idx_cons_diag_cons').on(table.consultationId),
    index('idx_cons_diag_patient').on(table.patientId),
    index('idx_cons_diag_type').on(table.diagnosisType)
  ]
);

/**
 * Phase 2.6: Prescription & Medication Orders
 */
export const consultationMedications = clinicalSchema.table(
  'consultation_medications',
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
    consultationId: uuid('consultation_id')
      .notNull()
      .references(() => consultations.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    medicationName: varchar('medication_name', { length: 255 }).notNull(),
    genericName: varchar('generic_name', { length: 255 }),
    strength: varchar('strength', { length: 100 }).notNull(),
    dosage: varchar('dosage', { length: 100 }).notNull(),
    route: varchar('route', { length: 50 }).notNull().default('ORAL'), // ORAL, INHALATION, TOPICAL, INTRAVENOUS, SUBCUTANEOUS, OPHTHALMIC, OTIC
    frequency: varchar('frequency', { length: 100 }).notNull(), // e.g. "ONCE_DAILY", "TWICE_DAILY", "TID", "QID", "PRN"
    duration: integer('duration').notNull(),
    durationUnit: varchar('duration_unit', { length: 50 }).notNull().default('DAYS'), // DAYS, WEEKS, MONTHS
    quantity: integer('quantity').notNull().default(1),
    instructions: text('instructions'),
    beforeAfterFood: varchar('before_after_food', { length: 50 }).notNull().default('AFTER_FOOD'), // BEFORE_FOOD, AFTER_FOOD, WITH_FOOD, ANYTIME
    asNeeded: boolean('as_needed').notNull().default(false),
    indication: varchar('indication', { length: 255 }),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, DISCONTINUED, COMPLETED, CANCELLED
    prescribedBy: varchar('prescribed_by', { length: 100 }).notNull(),
    prescribedAt: timestamp('prescribed_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_cons_med_tenant').on(table.tenantId),
    index('idx_cons_med_cons').on(table.consultationId),
    index('idx_cons_med_patient').on(table.patientId),
    index('idx_cons_med_status').on(table.status)
  ]
);

/**
 * Phase 2.6: Structured Clinical Instructions
 */
export const consultationInstructions = clinicalSchema.table(
  'consultation_instructions',
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
    consultationId: uuid('consultation_id')
      .notNull()
      .references(() => consultations.id, { onDelete: 'cascade' }),
    patientInstruction: text('patient_instruction'),
    dietInstruction: text('diet_instruction'),
    activityInstruction: text('activity_instruction'),
    warningSignInstruction: text('warning_sign_instruction'),
    homeCareInstruction: text('home_care_instruction'),
    followUpInstruction: text('follow_up_instruction'),
    instructionPriority: varchar('instruction_priority', { length: 50 }).notNull().default('ROUTINE'), // ROUTINE, IMPORTANT, CRITICAL
    recordedBy: varchar('recorded_by', { length: 100 }).notNull(),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_cons_inst_tenant').on(table.tenantId),
    index('idx_cons_inst_cons').on(table.consultationId)
  ]
);

/**
 * Phase 2.6: Consultation Follow-up Recommendations
 */
export const consultationFollowups = clinicalSchema.table(
  'consultation_followups',
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
    consultationId: uuid('consultation_id')
      .notNull()
      .references(() => consultations.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    followUpRequired: boolean('follow_up_required').notNull().default(true),
    recommendedDate: varchar('recommended_date', { length: 50 }),
    recommendedWindow: varchar('recommended_window', { length: 100 }), // e.g. "AFTER_1_WEEK", "AFTER_2_WEEKS", "AFTER_1_MONTH"
    reason: text('reason').notNull(),
    notes: text('notes'),
    status: varchar('status', { length: 50 }).notNull().default('PENDING'), // PENDING, SCHEDULED, COMPLETED, CANCELLED
    recordedBy: varchar('recorded_by', { length: 100 }).notNull(),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_cons_fol_tenant').on(table.tenantId),
    index('idx_cons_fol_cons').on(table.consultationId),
    index('idx_cons_fol_patient').on(table.patientId),
    index('idx_cons_fol_status').on(table.status)
  ]
);

/**
 * Phase 2.6: Consultation Mutation & Clinical Document Audit Traces
 */
export const consultationAuditTraces = clinicalSchema.table(
  'consultation_audit_traces',
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
    branchId: uuid('branch_id')
      .references(() => operationalFacilities.id, { onDelete: 'set null' }),
    patientId: uuid('patient_id'),
    encounterId: uuid('encounter_id'),
    consultationId: uuid('consultation_id'),
    actorId: varchar('actor_id', { length: 100 }).notNull(),
    actorRole: varchar('actor_role', { length: 50 }).notNull(),
    action: varchar('action', { length: 100 }).notNull(),
    targetEntity: varchar('target_entity', { length: 100 }).notNull(),
    targetEntityId: varchar('target_entity_id', { length: 100 }).notNull(),
    previousSnapshot: jsonb('previous_snapshot'),
    newSnapshot: jsonb('new_snapshot'),
    justification: text('justification').notNull(),
    operationStatus: varchar('operation_status', { length: 50 }).notNull().default('SUCCESS'),
    correlationId: varchar('correlation_id', { length: 100 }).notNull(),
    metadata: jsonb('metadata').default({}),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_cons_audit_tenant').on(table.tenantId),
    index('idx_cons_audit_partner').on(table.partnerId),
    index('idx_cons_audit_org').on(table.organizationId),
    index('idx_cons_audit_cons').on(table.consultationId),
    index('idx_cons_audit_patient').on(table.patientId),
    index('idx_cons_audit_status').on(table.operationStatus),
    index('idx_cons_audit_occurred').on(table.occurredAt)
  ]
);

export type Consultation = typeof consultations.$inferSelect;
export type NewConsultation = typeof consultations.$inferInsert;

export type ConsultationVitals = typeof consultationVitals.$inferSelect;
export type NewConsultationVitals = typeof consultationVitals.$inferInsert;

export type ConsultationExamination = typeof consultationExaminations.$inferSelect;
export type NewConsultationExamination = typeof consultationExaminations.$inferInsert;

export type ConsultationDiagnosis = typeof consultationDiagnoses.$inferSelect;
export type NewConsultationDiagnosis = typeof consultationDiagnoses.$inferInsert;

export type ConsultationMedication = typeof consultationMedications.$inferSelect;
export type NewConsultationMedication = typeof consultationMedications.$inferInsert;

export type ConsultationInstruction = typeof consultationInstructions.$inferSelect;
export type NewConsultationInstruction = typeof consultationInstructions.$inferInsert;

export type ConsultationFollowup = typeof consultationFollowups.$inferSelect;
export type NewConsultationFollowup = typeof consultationFollowups.$inferInsert;

export type ConsultationAuditTrace = typeof consultationAuditTraces.$inferSelect;
export type NewConsultationAuditTrace = typeof consultationAuditTraces.$inferInsert;

/**
 * ============================================================================
 * PHASE 2.7: CLINICAL ORDERS, LABORATORY & DIAGNOSTIC INVESTIGATION MANAGEMENT
 * ============================================================================
 */

/**
 * Phase 2.7: Master Investigation Catalog
 */
export const investigationCatalog = clinicalSchema.table(
  'investigation_catalog',
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
    branchId: uuid('branch_id')
      .references(() => operationalFacilities.id, { onDelete: 'set null' }),
    testCode: varchar('test_code', { length: 100 }).notNull(),
    testName: varchar('test_name', { length: 255 }).notNull(),
    shortName: varchar('short_name', { length: 100 }),
    category: varchar('category', { length: 50 }).notNull(), // HEMATOLOGY, BIOCHEMISTRY, MICROBIOLOGY, IMMUNOLOGY, PATHOLOGY, RADIOLOGY, CARDIOLOGY, ENDOCRINOLOGY, GENERAL
    specimenType: varchar('specimen_type', { length: 50 }).notNull().default('WHOLE_BLOOD'), // WHOLE_BLOOD, SERUM, PLASMA, URINE, STOOL, SPUTUM, SWAB, CSF, TISSUE, NONE
    department: varchar('department', { length: 100 }).notNull(),
    clinicalDescription: text('clinical_description'),
    preparationRequirements: text('preparation_requirements'),
    fastingRequired: boolean('fasting_required').notNull().default(false),
    turnaroundTargetHours: integer('turnaround_target_hours').notNull().default(24),
    sampleVolume: varchar('sample_volume', { length: 100 }),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, INACTIVE, RETIRED
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_inv_cat_tenant').on(table.tenantId),
    index('idx_inv_cat_org').on(table.organizationId),
    index('idx_inv_cat_code').on(table.testCode),
    index('idx_inv_cat_category').on(table.category),
    index('idx_inv_cat_status').on(table.status)
  ]
);

/**
 * Phase 2.7: Investigation Panels
 */
export const investigationPanels = clinicalSchema.table(
  'investigation_panels',
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
    panelCode: varchar('panel_code', { length: 100 }).notNull(),
    panelName: varchar('panel_name', { length: 255 }).notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    description: text('description'),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, INACTIVE
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_inv_pan_tenant').on(table.tenantId),
    index('idx_inv_pan_org').on(table.organizationId),
    index('idx_inv_pan_code').on(table.panelCode),
    index('idx_inv_pan_category').on(table.category)
  ]
);

/**
 * Phase 2.7: Investigation Panel Items Linker
 */
export const investigationPanelItems = clinicalSchema.table(
  'investigation_panel_items',
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
    panelId: uuid('panel_id')
      .notNull()
      .references(() => investigationPanels.id, { onDelete: 'cascade' }),
    investigationId: uuid('investigation_id')
      .notNull()
      .references(() => investigationCatalog.id, { onDelete: 'cascade' }),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_inv_pan_items_tenant').on(table.tenantId),
    index('idx_inv_pan_items_panel').on(table.panelId),
    index('idx_inv_pan_items_inv').on(table.investigationId)
  ]
);

/**
 * Phase 2.7: Investigation Orders
 */
export const investigationOrders = clinicalSchema.table(
  'investigation_orders',
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
    branchId: uuid('branch_id')
      .references(() => operationalFacilities.id, { onDelete: 'set null' }),
    orderNumber: varchar('order_number', { length: 100 }).notNull().unique(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    encounterId: uuid('encounter_id')
      .notNull()
      .references(() => encounters.id, { onDelete: 'cascade' }),
    consultationId: uuid('consultation_id')
      .references(() => consultations.id, { onDelete: 'set null' }),
    orderingDoctorId: uuid('ordering_doctor_id')
      .notNull()
      .references(() => doctorProfiles.id, { onDelete: 'cascade' }),
    investigationId: uuid('investigation_id')
      .notNull()
      .references(() => investigationCatalog.id, { onDelete: 'cascade' }),
    panelId: uuid('panel_id')
      .references(() => investigationPanels.id, { onDelete: 'set null' }),
    priority: varchar('priority', { length: 50 }).notNull().default('ROUTINE'), // ROUTINE, URGENT, STAT, EMERGENCY
    clinicalIndication: text('clinical_indication').notNull(),
    diagnosisContext: text('diagnosis_context'),
    specimenType: varchar('specimen_type', { length: 50 }).notNull().default('WHOLE_BLOOD'),
    fastingConfirmed: boolean('fasting_confirmed').notNull().default(false),
    status: varchar('status', { length: 50 }).notNull().default('ORDERED'), // ORDERED, ACKNOWLEDGED, SAMPLE_REQUIRED, SAMPLE_COLLECTED, PROCESSING, RESULT_READY, VERIFIED, REVIEWED, CANCELLED
    isAbnormal: boolean('is_abnormal').notNull().default(false),
    isCritical: boolean('is_critical').notNull().default(false),
    orderedAt: timestamp('ordered_at', { withTimezone: true }).notNull().defaultNow(),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    sampleCollectedAt: timestamp('sample_collected_at', { withTimezone: true }),
    processingStartedAt: timestamp('processing_started_at', { withTimezone: true }),
    resultEnteredAt: timestamp('result_entered_at', { withTimezone: true }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancellationReason: text('cancellation_reason'),
    cancelledBy: varchar('cancelled_by', { length: 100 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_inv_ord_tenant').on(table.tenantId),
    index('idx_inv_ord_org').on(table.organizationId),
    index('idx_inv_ord_patient').on(table.patientId),
    index('idx_inv_ord_encounter').on(table.encounterId),
    index('idx_inv_ord_cons').on(table.consultationId),
    index('idx_inv_ord_doctor').on(table.orderingDoctorId),
    index('idx_inv_ord_status').on(table.status),
    index('idx_inv_ord_priority').on(table.priority),
    index('idx_inv_ord_critical').on(table.isCritical)
  ]
);

/**
 * Phase 2.7: Investigation Specimens
 */
export const investigationSpecimens = clinicalSchema.table(
  'investigation_specimens',
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
    orderId: uuid('order_id')
      .notNull()
      .references(() => investigationOrders.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    accessionNumber: varchar('accession_number', { length: 100 }).notNull().unique(),
    specimenType: varchar('specimen_type', { length: 50 }).notNull(),
    containerType: varchar('container_type', { length: 100 }),
    collectionSite: varchar('collection_site', { length: 100 }),
    collectionStatus: varchar('collection_status', { length: 50 }).notNull().default('PENDING'), // PENDING, COLLECTED, RECEIVED_IN_LAB, REJECTED
    collectedAt: timestamp('collected_at', { withTimezone: true }),
    collectedBy: varchar('collected_by', { length: 100 }),
    receivedInLabAt: timestamp('received_in_lab_at', { withTimezone: true }),
    receivedBy: varchar('received_by', { length: 100 }),
    rejectionStatus: boolean('rejection_status').notNull().default(false),
    rejectionReason: text('rejection_reason'),
    rejectedAt: timestamp('rejected_at', { withTimezone: true }),
    rejectedBy: varchar('rejected_by', { length: 100 }),
    collectionNotes: text('collection_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_inv_spec_tenant').on(table.tenantId),
    index('idx_inv_spec_order').on(table.orderId),
    index('idx_inv_spec_patient').on(table.patientId),
    index('idx_inv_spec_status').on(table.collectionStatus),
    index('idx_inv_spec_accession').on(table.accessionNumber)
  ]
);

/**
 * Phase 2.7: Investigation Results
 */
export const investigationResults = clinicalSchema.table(
  'investigation_results',
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
    orderId: uuid('order_id')
      .notNull()
      .references(() => investigationOrders.id, { onDelete: 'cascade' }),
    specimenId: uuid('specimen_id')
      .references(() => investigationSpecimens.id, { onDelete: 'set null' }),
    parameterCode: varchar('parameter_code', { length: 100 }).notNull(),
    parameterName: varchar('parameter_name', { length: 255 }).notNull(),
    resultValue: text('result_value').notNull(),
    numericValue: numeric('numeric_value', { precision: 12, scale: 4 }),
    unit: varchar('unit', { length: 50 }),
    referenceRange: varchar('reference_range', { length: 100 }),
    referenceMin: numeric('reference_min', { precision: 12, scale: 4 }),
    referenceMax: numeric('reference_max', { precision: 12, scale: 4 }),
    criticalMin: numeric('critical_min', { precision: 12, scale: 4 }),
    criticalMax: numeric('critical_max', { precision: 12, scale: 4 }),
    abnormalFlag: varchar('abnormal_flag', { length: 50 }).notNull().default('NORMAL'), // NORMAL, LOW, HIGH, ABNORMAL, CRITICAL_LOW, CRITICAL_HIGH
    isCritical: boolean('is_critical').notNull().default(false),
    qualitativeInterpretation: text('qualitative_interpretation'),
    resultStatus: varchar('result_status', { length: 50 }).notNull().default('DRAFT'), // DRAFT, COMPLETED, VERIFIED, AMENDED, RETRACTED
    enteredBy: varchar('entered_by', { length: 100 }).notNull(),
    enteredAt: timestamp('entered_at', { withTimezone: true }).notNull().defaultNow(),
    verifiedBy: varchar('verified_by', { length: 100 }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_inv_res_tenant').on(table.tenantId),
    index('idx_inv_res_order').on(table.orderId),
    index('idx_inv_res_code').on(table.parameterCode),
    index('idx_inv_res_flag').on(table.abnormalFlag),
    index('idx_inv_res_status').on(table.resultStatus)
  ]
);

/**
 * Phase 2.7: Diagnostic Investigation Reports
 */
export const investigationReports = clinicalSchema.table(
  'investigation_reports',
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
    orderId: uuid('order_id')
      .notNull()
      .references(() => investigationOrders.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    reportNumber: varchar('report_number', { length: 100 }).notNull().unique(),
    reportTitle: varchar('report_title', { length: 255 }).notNull(),
    clinicalFindings: text('clinical_findings'),
    impression: text('impression'),
    recommendations: text('recommendations'),
    reportingClinician: varchar('reporting_clinician', { length: 100 }).notNull(),
    verifyingPathologist: varchar('verifying_pathologist', { length: 100 }),
    reportStatus: varchar('report_status', { length: 50 }).notNull().default('DRAFT'), // DRAFT, PRELIMINARY, FINAL, AMENDED, CANCELLED
    reportVersion: integer('report_version').notNull().default(1),
    finalizedAt: timestamp('finalized_at', { withTimezone: true }),
    reviewedByDoctorAt: timestamp('reviewed_by_doctor_at', { withTimezone: true }),
    reviewingDoctor: varchar('reviewing_doctor', { length: 100 }),
    doctorReviewNotes: text('doctor_review_notes'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_inv_rep_tenant').on(table.tenantId),
    index('idx_inv_rep_order').on(table.orderId),
    index('idx_inv_rep_patient').on(table.patientId),
    index('idx_inv_rep_number').on(table.reportNumber),
    index('idx_inv_rep_status').on(table.reportStatus)
  ]
);

/**
 * Phase 2.7: Investigation Result Amendments (Immutable Audit of Modifications)
 */
export const investigationResultAmendments = clinicalSchema.table(
  'investigation_result_amendments',
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
    orderId: uuid('order_id')
      .notNull()
      .references(() => investigationOrders.id, { onDelete: 'cascade' }),
    resultId: uuid('result_id')
      .notNull()
      .references(() => investigationResults.id, { onDelete: 'cascade' }),
    reportId: uuid('report_id')
      .references(() => investigationReports.id, { onDelete: 'set null' }),
    amendmentNumber: integer('amendment_number').notNull().default(1),
    previousValue: text('previous_value').notNull(),
    newValue: text('new_value').notNull(),
    previousAbnormalFlag: varchar('previous_abnormal_flag', { length: 50 }),
    newAbnormalFlag: varchar('new_abnormal_flag', { length: 50 }),
    reason: text('reason').notNull(),
    amendedBy: varchar('amended_by', { length: 100 }).notNull(),
    amendedRole: varchar('amended_role', { length: 50 }).notNull(),
    amendedAt: timestamp('amended_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_inv_amend_tenant').on(table.tenantId),
    index('idx_inv_amend_order').on(table.orderId),
    index('idx_inv_amend_result').on(table.resultId)
  ]
);

/**
 * Phase 2.7: Investigation Audit Traces (Cryptographic Append-Only Ledger)
 */
export const investigationAuditTraces = clinicalSchema.table(
  'investigation_audit_traces',
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
    branchId: uuid('branch_id')
      .references(() => operationalFacilities.id, { onDelete: 'set null' }),
    orderId: uuid('order_id'),
    patientId: uuid('patient_id'),
    actorId: varchar('actor_id', { length: 100 }).notNull(),
    actorRole: varchar('actor_role', { length: 50 }).notNull(),
    action: varchar('action', { length: 100 }).notNull(),
    targetEntity: varchar('target_entity', { length: 100 }).notNull(),
    targetEntityId: varchar('target_entity_id', { length: 100 }).notNull(),
    previousSnapshot: jsonb('previous_snapshot'),
    newSnapshot: jsonb('new_snapshot'),
    justification: text('justification').notNull(),
    operationStatus: varchar('operation_status', { length: 50 }).notNull().default('SUCCESS'),
    correlationId: varchar('correlation_id', { length: 100 }).notNull(),
    metadata: jsonb('metadata').default({}),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_inv_audit_tenant').on(table.tenantId),
    index('idx_inv_audit_partner').on(table.partnerId),
    index('idx_inv_audit_org').on(table.organizationId),
    index('idx_inv_audit_order').on(table.orderId),
    index('idx_inv_audit_patient').on(table.patientId),
    index('idx_inv_audit_action').on(table.action),
    index('idx_inv_audit_status').on(table.operationStatus),
    index('idx_inv_audit_occurred').on(table.occurredAt)
  ]
);

export type InvestigationCatalog = typeof investigationCatalog.$inferSelect;
export type NewInvestigationCatalog = typeof investigationCatalog.$inferInsert;

export type InvestigationPanel = typeof investigationPanels.$inferSelect;
export type NewInvestigationPanel = typeof investigationPanels.$inferInsert;

export type InvestigationPanelItem = typeof investigationPanelItems.$inferSelect;
export type NewInvestigationPanelItem = typeof investigationPanelItems.$inferInsert;

export type InvestigationOrder = typeof investigationOrders.$inferSelect;
export type NewInvestigationOrder = typeof investigationOrders.$inferInsert;

export type InvestigationSpecimen = typeof investigationSpecimens.$inferSelect;
export type NewInvestigationSpecimen = typeof investigationSpecimens.$inferInsert;

export type InvestigationResult = typeof investigationResults.$inferSelect;
export type NewInvestigationResult = typeof investigationResults.$inferInsert;

export type InvestigationReport = typeof investigationReports.$inferSelect;
export type NewInvestigationReport = typeof investigationReports.$inferInsert;

export type InvestigationResultAmendment = typeof investigationResultAmendments.$inferSelect;
export type NewInvestigationResultAmendment = typeof investigationResultAmendments.$inferInsert;

export type InvestigationAuditTrace = typeof investigationAuditTraces.$inferSelect;
export type NewInvestigationAuditTrace = typeof investigationAuditTraces.$inferInsert;

/**
 * ============================================================================
 * Phase 2.8: Pharmacy, Medication Dispensing & Inventory Management Schema
 * ============================================================================
 */

/**
 * 4.1 medication_catalog
 * Master medication catalog with generic/brand mapping and controlled substance indicators.
 */
export const medicationCatalog = clinicalSchema.table(
  'medication_catalog',
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
    medicationCode: varchar('medication_code', { length: 50 }).notNull(),
    genericName: varchar('generic_name', { length: 255 }).notNull(),
    brandName: varchar('brand_name', { length: 255 }).notNull(),
    strength: varchar('strength', { length: 100 }).notNull(),
    dosageForm: varchar('dosage_form', { length: 100 }).notNull(), // TABLET, CAPSULE, SYRUP, INJECTION, OINTMENT, DROPS, INHALER, SUPPOSITORY, PATCH, IV_FLUID
    route: varchar('route', { length: 100 }).notNull().default('ORAL'), // ORAL, INTRAVENOUS, INTRAMUSCULAR, SUBCUTANEOUS, TOPICAL, INHALATION, OPHTHALMIC, OTIC, NASAL, RECTAL
    packSize: integer('pack_size').notNull().default(1),
    unitOfMeasure: varchar('unit_of_measure', { length: 50 }).notNull().default('TABLET'),
    manufacturer: varchar('manufacturer', { length: 255 }).notNull(),
    category: varchar('category', { length: 100 }).notNull().default('GENERAL'), // ANTIBIOTIC, ANALGESIC, CARDIOVASCULAR, ANTIDIABETIC, RESPIRATORY, GASTROINTESTINAL, PSYCHIATRIC, DERMATOLOGICAL, ONCOLOGY, CONTROLLED_SUBSTANCE, GENERAL
    controlledMedication: boolean('controlled_medication').notNull().default(false),
    prescriptionRequired: boolean('prescription_required').notNull().default(true),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, INACTIVE, DISCONTINUED, RESTRICTED
    therapeuticClass: varchar('therapeutic_class', { length: 255 }),
    storageConditions: varchar('storage_conditions', { length: 255 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_med_cat_tenant').on(table.tenantId),
    index('idx_med_cat_partner').on(table.partnerId),
    index('idx_med_cat_org').on(table.organizationId),
    index('idx_med_cat_code').on(table.medicationCode),
    index('idx_med_cat_generic').on(table.genericName),
    index('idx_med_cat_brand').on(table.brandName),
    index('idx_med_cat_category').on(table.category),
    index('idx_med_cat_controlled').on(table.controlledMedication),
    index('idx_med_cat_status').on(table.status),
    uniqueIndex('idx_med_cat_tenant_code').on(table.tenantId, table.medicationCode)
  ]
);

/**
 * 4.2 medication_catalog_variants
 * Packaging and formulation variations for catalog medications.
 */
export const medicationCatalogVariants = clinicalSchema.table(
  'medication_catalog_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    medicationId: uuid('medication_id')
      .notNull()
      .references(() => medicationCatalog.id, { onDelete: 'cascade' }),
    variantCode: varchar('variant_code', { length: 50 }).notNull(),
    variantName: varchar('variant_name', { length: 255 }).notNull(),
    strength: varchar('strength', { length: 100 }).notNull(),
    dosageForm: varchar('dosage_form', { length: 100 }).notNull(),
    packConfiguration: varchar('pack_configuration', { length: 100 }).notNull(), // e.g. "Blister pack of 10 x 10"
    barcode: varchar('barcode', { length: 100 }),
    alternateIdentifier: varchar('alternate_identifier', { length: 100 }),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_med_var_tenant').on(table.tenantId),
    index('idx_med_var_medication').on(table.medicationId),
    index('idx_med_var_barcode').on(table.barcode),
    uniqueIndex('idx_med_var_tenant_code').on(table.tenantId, table.variantCode)
  ]
);

/**
 * 4.3 pharmacy_prescriptions
 * Canonical pharmacy fulfillment orders linked to clinical encounters and digital prescriptions.
 */
export const pharmacyPrescriptions = clinicalSchema.table(
  'pharmacy_prescriptions',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    prescriptionNumber: varchar('prescription_number', { length: 50 }).notNull(),
    sourcePrescriptionId: varchar('source_prescription_id', { length: 100 }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    encounterId: uuid('encounter_id')
      .notNull()
      .references(() => encounters.id, { onDelete: 'cascade' }),
    consultationId: uuid('consultation_id').references(() => consultations.id, { onDelete: 'set null' }),
    prescribingDoctorId: uuid('prescribing_doctor_id')
      .notNull()
      .references(() => doctorProfiles.id, { onDelete: 'cascade' }),
    priority: varchar('priority', { length: 50 }).notNull().default('ROUTINE'), // STAT, EMERGENCY, URGENT, ROUTINE
    status: varchar('status', { length: 50 }).notNull().default('CREATED'), // CREATED, RECEIVED_BY_PHARMACY, UNDER_REVIEW, VERIFIED, STOCK_RESERVED, READY_FOR_DISPENSING, PARTIALLY_DISPENSED, DISPENSED, COMPLETED, CANCELLED, REJECTED, EXPIRED
    prescriptionType: varchar('prescription_type', { length: 50 }).notNull().default('OUTPATIENT'), // OUTPATIENT, INPATIENT, EMERGENCY, DISCHARGE
    verifiedByPharmacistId: varchar('verified_by_pharmacist_id', { length: 255 }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    verificationNotes: text('verification_notes'),
    prescribedAt: timestamp('prescribed_at', { withTimezone: true }).notNull().defaultNow(),
    expiryAt: timestamp('expiry_at', { withTimezone: true }),
    notes: text('notes'),
    cancellationReason: text('cancellation_reason'),
    cancelledBy: varchar('cancelled_by', { length: 255 }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_rx_tenant').on(table.tenantId),
    index('idx_rx_partner').on(table.partnerId),
    index('idx_rx_org').on(table.organizationId),
    index('idx_rx_branch').on(table.branchId),
    index('idx_rx_patient').on(table.patientId),
    index('idx_rx_encounter').on(table.encounterId),
    index('idx_rx_doctor').on(table.prescribingDoctorId),
    index('idx_rx_status').on(table.status),
    index('idx_rx_priority').on(table.priority),
    uniqueIndex('idx_rx_tenant_number').on(table.tenantId, table.prescriptionNumber)
  ]
);

/**
 * 4.4 pharmacy_prescription_items
 * Individual medication order line items within a pharmacy prescription.
 */
export const pharmacyPrescriptionItems = clinicalSchema.table(
  'pharmacy_prescription_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    prescriptionId: uuid('prescription_id')
      .notNull()
      .references(() => pharmacyPrescriptions.id, { onDelete: 'cascade' }),
    medicationId: uuid('medication_id')
      .notNull()
      .references(() => medicationCatalog.id, { onDelete: 'cascade' }),
    prescribedQuantity: integer('prescribed_quantity').notNull(),
    unit: varchar('unit', { length: 50 }).notNull().default('TABLET'),
    dosage: varchar('dosage', { length: 100 }).notNull(),
    frequency: varchar('frequency', { length: 100 }).notNull(),
    route: varchar('route', { length: 100 }).notNull().default('ORAL'),
    duration: integer('duration').notNull(),
    durationUnit: varchar('duration_unit', { length: 20 }).notNull().default('DAYS'),
    prn: boolean('prn').notNull().default(false),
    prnIndication: varchar('prn_indication', { length: 255 }),
    substitutionAllowed: boolean('substitution_allowed').notNull().default(true),
    substitutionReason: varchar('substitution_reason', { length: 255 }),
    fulfillmentStatus: varchar('fulfillment_status', { length: 50 }).notNull().default('PENDING'), // PENDING, RESERVED, PARTIALLY_DISPENSED, FULFILLED, CANCELLED
    dispensedQuantity: integer('dispensed_quantity').notNull().default(0),
    remainingQuantity: integer('remaining_quantity').notNull(),
    instructions: text('instructions'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_rx_item_tenant').on(table.tenantId),
    index('idx_rx_item_prescription').on(table.prescriptionId),
    index('idx_rx_item_medication').on(table.medicationId),
    index('idx_rx_item_status').on(table.fulfillmentStatus)
  ]
);

/**
 * 4.5 pharmacy_inventory
 * Current branch-level aggregated stock per medication with reorder thresholds.
 */
export const pharmacyInventory = clinicalSchema.table(
  'pharmacy_inventory',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    medicationId: uuid('medication_id')
      .notNull()
      .references(() => medicationCatalog.id, { onDelete: 'cascade' }),
    availableQuantity: integer('available_quantity').notNull().default(0),
    reservedQuantity: integer('reserved_quantity').notNull().default(0),
    damagedQuantity: integer('damaged_quantity').notNull().default(0),
    expiredQuantity: integer('expired_quantity').notNull().default(0),
    reorderLevel: integer('reorder_level').notNull().default(50),
    reorderQuantity: integer('reorder_quantity').notNull().default(200),
    lastStockMovementAt: timestamp('last_stock_movement_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_pharm_inv_tenant').on(table.tenantId),
    index('idx_pharm_inv_org').on(table.organizationId),
    index('idx_pharm_inv_branch').on(table.branchId),
    index('idx_pharm_inv_medication').on(table.medicationId),
    uniqueIndex('idx_pharm_inv_branch_med').on(table.branchId, table.medicationId)
  ]
);

/**
 * 4.6 pharmacy_batches
 * Granular batch-level tracking with manufacturing, expiry, and FEFO allocation state.
 */
export const pharmacyBatches = clinicalSchema.table(
  'pharmacy_batches',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    medicationId: uuid('medication_id')
      .notNull()
      .references(() => medicationCatalog.id, { onDelete: 'cascade' }),
    batchNumber: varchar('batch_number', { length: 100 }).notNull(),
    manufacturer: varchar('manufacturer', { length: 255 }).notNull(),
    manufacturingDate: timestamp('manufacturing_date', { withTimezone: true }).notNull(),
    expiryDate: timestamp('expiry_date', { withTimezone: true }).notNull(),
    receivedQuantity: integer('received_quantity').notNull(),
    availableQuantity: integer('available_quantity').notNull(),
    reservedQuantity: integer('reserved_quantity').notNull().default(0),
    unitCost: numeric('unit_cost', { precision: 10, scale: 2 }).notNull().default('0.00'),
    purchaseReference: varchar('purchase_reference', { length: 100 }),
    supplierReference: varchar('supplier_reference', { length: 100 }),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, LOW_STOCK, NEAR_EXPIRY, EXPIRED, BLOCKED, DEPLETED
    blockReason: text('block_reason'),
    blockedBy: varchar('blocked_by', { length: 255 }),
    blockedAt: timestamp('blocked_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_pharm_batch_tenant').on(table.tenantId),
    index('idx_pharm_batch_branch').on(table.branchId),
    index('idx_pharm_batch_medication').on(table.medicationId),
    index('idx_pharm_batch_number').on(table.batchNumber),
    index('idx_pharm_batch_expiry').on(table.expiryDate),
    index('idx_pharm_batch_status').on(table.status),
    uniqueIndex('idx_pharm_batch_branch_med_num').on(table.branchId, table.medicationId, table.batchNumber)
  ]
);

/**
 * 4.7 pharmacy_stock_movements
 * Append-only immutable inventory ledger documenting receipts, dispensing, adjustments, and returns.
 */
export const pharmacyStockMovements = clinicalSchema.table(
  'pharmacy_stock_movements',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    medicationId: uuid('medication_id')
      .notNull()
      .references(() => medicationCatalog.id, { onDelete: 'cascade' }),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => pharmacyBatches.id, { onDelete: 'cascade' }),
    movementType: varchar('movement_type', { length: 50 }).notNull(), // RECEIPT, DISPENSE, RETURN, ADJUSTMENT, TRANSFER_IN, TRANSFER_OUT, DAMAGE, EXPIRY, REVERSAL
    quantity: integer('quantity').notNull(),
    beforeQuantity: integer('before_quantity').notNull(),
    afterQuantity: integer('after_quantity').notNull(),
    actorId: varchar('actor_id', { length: 255 }).notNull(),
    actorRole: varchar('actor_role', { length: 100 }).notNull(),
    reason: varchar('reason', { length: 255 }).notNull(),
    correlationId: varchar('correlation_id', { length: 100 }).notNull(),
    referenceType: varchar('reference_type', { length: 100 }), // PRESCRIPTION, DISPENSING, PURCHASE_ORDER, STOCK_ADJUSTMENT, RETURN
    referenceId: varchar('reference_id', { length: 100 }),
    metadata: jsonb('metadata').default({}),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_stock_mov_tenant').on(table.tenantId),
    index('idx_stock_mov_branch').on(table.branchId),
    index('idx_stock_mov_medication').on(table.medicationId),
    index('idx_stock_mov_batch').on(table.batchId),
    index('idx_stock_mov_type').on(table.movementType),
    index('idx_stock_mov_occurred').on(table.occurredAt)
  ]
);

/**
 * 4.8 pharmacy_stock_reservations
 * Temporary reservation of batch stock against active prescriptions before physical dispensing.
 */
export const pharmacyStockReservations = clinicalSchema.table(
  'pharmacy_stock_reservations',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    prescriptionId: uuid('prescription_id')
      .notNull()
      .references(() => pharmacyPrescriptions.id, { onDelete: 'cascade' }),
    prescriptionItemId: uuid('prescription_item_id')
      .notNull()
      .references(() => pharmacyPrescriptionItems.id, { onDelete: 'cascade' }),
    medicationId: uuid('medication_id')
      .notNull()
      .references(() => medicationCatalog.id, { onDelete: 'cascade' }),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => pharmacyBatches.id, { onDelete: 'cascade' }),
    reservedQuantity: integer('reserved_quantity').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, FULFILLED, RELEASED, EXPIRED
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_stock_res_tenant').on(table.tenantId),
    index('idx_stock_res_branch').on(table.branchId),
    index('idx_stock_res_prescription').on(table.prescriptionId),
    index('idx_stock_res_batch').on(table.batchId),
    index('idx_stock_res_status').on(table.status)
  ]
);

/**
 * 4.9 pharmacy_dispensing
 * Canonical dispensing transaction record with pharmacist electronic sign-off and verification metadata.
 */
export const pharmacyDispensing = clinicalSchema.table(
  'pharmacy_dispensing',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    dispensingNumber: varchar('dispensing_number', { length: 50 }).notNull(),
    prescriptionId: uuid('prescription_id')
      .notNull()
      .references(() => pharmacyPrescriptions.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    pharmacistId: varchar('pharmacist_id', { length: 255 }).notNull(),
    pharmacistName: varchar('pharmacist_name', { length: 255 }).notNull(),
    dispensingStatus: varchar('dispensing_status', { length: 50 }).notNull().default('DISPENSED'), // PENDING, VERIFIED, PARTIALLY_DISPENSED, DISPENSED, CANCELLED, REVERSED
    dispensingMode: varchar('dispensing_mode', { length: 50 }).notNull().default('OUTPATIENT_COUNTER'), // OUTPATIENT_COUNTER, BEDSIDE_IPD, EMERGENCY_CRITICAL, HOME_DELIVERY
    counselingProvided: boolean('counseling_provided').notNull().default(true),
    counselingNotes: text('counseling_notes'),
    dispensedAt: timestamp('dispensed_at', { withTimezone: true }).notNull().defaultNow(),
    reversalReason: text('reversal_reason'),
    reversedBy: varchar('reversed_by', { length: 255 }),
    reversedAt: timestamp('reversed_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_disp_tenant').on(table.tenantId),
    index('idx_disp_partner').on(table.partnerId),
    index('idx_disp_org').on(table.organizationId),
    index('idx_disp_branch').on(table.branchId),
    index('idx_disp_prescription').on(table.prescriptionId),
    index('idx_disp_patient').on(table.patientId),
    index('idx_disp_status').on(table.dispensingStatus),
    uniqueIndex('idx_disp_tenant_number').on(table.tenantId, table.dispensingNumber)
  ]
);

/**
 * 4.10 pharmacy_dispensing_items
 * Granular batch-deducted medication items fulfilled within a dispensing transaction.
 */
export const pharmacyDispensingItems = clinicalSchema.table(
  'pharmacy_dispensing_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    dispensingId: uuid('dispensing_id')
      .notNull()
      .references(() => pharmacyDispensing.id, { onDelete: 'cascade' }),
    prescriptionItemId: uuid('prescription_item_id')
      .notNull()
      .references(() => pharmacyPrescriptionItems.id, { onDelete: 'cascade' }),
    medicationId: uuid('medication_id')
      .notNull()
      .references(() => medicationCatalog.id, { onDelete: 'cascade' }),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => pharmacyBatches.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull(),
    unit: varchar('unit', { length: 50 }).notNull(),
    dosageInstructions: text('dosage_instructions').notNull(),
    isSubstituted: boolean('is_substituted').notNull().default(false),
    substitutedMedicationId: uuid('substituted_medication_id').references(() => medicationCatalog.id, { onDelete: 'set null' }),
    pharmacistNotes: text('pharmacist_notes'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_disp_item_tenant').on(table.tenantId),
    index('idx_disp_item_dispensing').on(table.dispensingId),
    index('idx_disp_item_prescription_item').on(table.prescriptionItemId),
    index('idx_disp_item_batch').on(table.batchId)
  ]
);

/**
 * 4.11 pharmacy_returns
 * Managed returns workflow for unconsumed or recalled medications.
 */
export const pharmacyReturns = clinicalSchema.table(
  'pharmacy_returns',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    returnNumber: varchar('return_number', { length: 50 }).notNull(),
    dispensingId: uuid('dispensing_id')
      .notNull()
      .references(() => pharmacyDispensing.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    medicationId: uuid('medication_id')
      .notNull()
      .references(() => medicationCatalog.id, { onDelete: 'cascade' }),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => pharmacyBatches.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull(),
    returnReason: varchar('return_reason', { length: 100 }).notNull(), // PATIENT_DISCONTINUED, ADVERSE_REACTION, PACKAGING_DEFECT, DOSAGE_CHANGE, EXPIRED_RETURN, PATIENT_DECEASED, OTHER
    condition: varchar('condition', { length: 50 }).notNull().default('INTACT_SEALED'), // INTACT_SEALED, OPENED_UNUSABLE, DAMAGED, COMPROMISED
    disposition: varchar('disposition', { length: 50 }).notNull().default('RESTOCK'), // RESTOCK, QUARANTINE_FOR_DESTRUCTION, RETURN_TO_MANUFACTURER
    actorId: varchar('actor_id', { length: 255 }).notNull(),
    actorRole: varchar('actor_role', { length: 100 }).notNull(),
    notes: text('notes'),
    metadata: jsonb('metadata').default({}),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_return_tenant').on(table.tenantId),
    index('idx_return_branch').on(table.branchId),
    index('idx_return_dispensing').on(table.dispensingId),
    index('idx_return_patient').on(table.patientId),
    uniqueIndex('idx_return_tenant_number').on(table.tenantId, table.returnNumber)
  ]
);

/**
 * 4.12 pharmacy_stock_adjustments
 * Audited manual stock adjustments for damage, physical count discrepancies, and write-offs.
 */
export const pharmacyStockAdjustments = clinicalSchema.table(
  'pharmacy_stock_adjustments',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    adjustmentNumber: varchar('adjustment_number', { length: 50 }).notNull(),
    medicationId: uuid('medication_id')
      .notNull()
      .references(() => medicationCatalog.id, { onDelete: 'cascade' }),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => pharmacyBatches.id, { onDelete: 'cascade' }),
    reason: varchar('reason', { length: 50 }).notNull(), // DAMAGE, EXPIRY, COUNT_CORRECTION, LOSS, FOUND, SYSTEM_CORRECTION, OTHER
    justification: text('justification').notNull(),
    beforeQuantity: integer('before_quantity').notNull(),
    adjustmentQuantity: integer('adjustment_quantity').notNull(), // positive (addition) or negative (deduction)
    afterQuantity: integer('after_quantity').notNull(),
    actorId: varchar('actor_id', { length: 255 }).notNull(),
    actorRole: varchar('actor_role', { length: 100 }).notNull(),
    approvedBy: varchar('approved_by', { length: 255 }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_adj_tenant').on(table.tenantId),
    index('idx_adj_branch').on(table.branchId),
    index('idx_adj_medication').on(table.medicationId),
    index('idx_adj_batch').on(table.batchId),
    index('idx_adj_reason').on(table.reason),
    uniqueIndex('idx_adj_tenant_number').on(table.tenantId, table.adjustmentNumber)
  ]
);

/**
 * 4.13 pharmacy_substitution_requests
 * Formal medication substitution tracking preserving original clinical orders and doctor approval.
 */
export const pharmacySubstitutionRequests = clinicalSchema.table(
  'pharmacy_substitution_requests',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    prescriptionId: uuid('prescription_id')
      .notNull()
      .references(() => pharmacyPrescriptions.id, { onDelete: 'cascade' }),
    prescriptionItemId: uuid('prescription_item_id')
      .notNull()
      .references(() => pharmacyPrescriptionItems.id, { onDelete: 'cascade' }),
    originalMedicationId: uuid('original_medication_id')
      .notNull()
      .references(() => medicationCatalog.id, { onDelete: 'cascade' }),
    requestedMedicationId: uuid('requested_medication_id')
      .notNull()
      .references(() => medicationCatalog.id, { onDelete: 'cascade' }),
    reason: varchar('reason', { length: 255 }).notNull(), // OUT_OF_STOCK, GENERIC_EQUIVALENT, THERAPEUTIC_ALTERNATIVE, COST_OPTIMIZATION, FORMULATION_UNAVAILABLE
    justification: text('justification').notNull(),
    pharmacistId: varchar('pharmacist_id', { length: 255 }).notNull(),
    pharmacistName: varchar('pharmacist_name', { length: 255 }).notNull(),
    doctorApprovalRequired: boolean('doctor_approval_required').notNull().default(true),
    status: varchar('status', { length: 50 }).notNull().default('PENDING_APPROVAL'), // PENDING_APPROVAL, APPROVED, REJECTED, CANCELLED
    approvedByDoctorId: varchar('approved_by_doctor_id', { length: 255 }),
    approvedByDoctorName: varchar('approved_by_doctor_name', { length: 255 }),
    approvalNotes: text('approval_notes'),
    actionedAt: timestamp('actioned_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_sub_req_tenant').on(table.tenantId),
    index('idx_sub_req_branch').on(table.branchId),
    index('idx_sub_req_prescription').on(table.prescriptionId),
    index('idx_sub_req_status').on(table.status)
  ]
);

/**
 * 4.14 pharmacy_audit_traces
 * Tamper-evident append-only audit stream capturing all dispensing, stock movements, and clinical substitutions.
 */
export const pharmacyAuditTraces = clinicalSchema.table(
  'pharmacy_audit_traces',
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
    traceId: varchar('trace_id', { length: 100 }).notNull().unique(),
    correlationId: varchar('correlation_id', { length: 100 }).notNull(),
    actorId: varchar('actor_id', { length: 255 }).notNull(),
    actorRole: varchar('actor_role', { length: 100 }).notNull(),
    action: varchar('action', { length: 100 }).notNull(), // MEDICATION_CREATED, MEDICATION_UPDATED, PRESCRIPTION_RECEIVED, PRESCRIPTION_VERIFIED, STOCK_RESERVED, MEDICATION_DISPENSED, PARTIAL_DISPENSED, SUBSTITUTION_REQUESTED, SUBSTITUTION_APPROVED, SUBSTITUTION_REJECTED, STOCK_RECEIVED, STOCK_ADJUSTED, STOCK_TRANSFERRED, BATCH_BLOCKED, BATCH_UNBLOCKED, MEDICATION_RETURNED, DISPENSING_REVERSED, PRESCRIPTION_CANCELLED
    targetEntity: varchar('target_entity', { length: 100 }).notNull(), // MEDICATION_CATALOG, PHARMACY_PRESCRIPTION, PHARMACY_BATCH, PHARMACY_INVENTORY, PHARMACY_DISPENSING, PHARMACY_RETURN, PHARMACY_STOCK_ADJUSTMENT, PHARMACY_SUBSTITUTION
    targetEntityId: varchar('target_entity_id', { length: 100 }).notNull(),
    prescriptionId: uuid('prescription_id').references(() => pharmacyPrescriptions.id, { onDelete: 'set null' }),
    patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'set null' }),
    previousSnapshot: jsonb('previous_snapshot'),
    newSnapshot: jsonb('new_snapshot'),
    justification: text('justification').notNull(),
    operationStatus: varchar('operation_status', { length: 50 }).notNull().default('SUCCESS'),
    metadata: jsonb('metadata').default({}),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_pharm_audit_tenant').on(table.tenantId),
    index('idx_pharm_audit_partner').on(table.partnerId),
    index('idx_pharm_audit_org').on(table.organizationId),
    index('idx_pharm_audit_branch').on(table.branchId),
    index('idx_pharm_audit_prescription').on(table.prescriptionId),
    index('idx_pharm_audit_patient').on(table.patientId),
    index('idx_pharm_audit_action').on(table.action),
    index('idx_pharm_audit_occurred').on(table.occurredAt)
  ]
);

export type MedicationCatalog = typeof medicationCatalog.$inferSelect;
export type NewMedicationCatalog = typeof medicationCatalog.$inferInsert;

export type MedicationCatalogVariant = typeof medicationCatalogVariants.$inferSelect;
export type NewMedicationCatalogVariant = typeof medicationCatalogVariants.$inferInsert;

export type PharmacyPrescription = typeof pharmacyPrescriptions.$inferSelect;
export type NewPharmacyPrescription = typeof pharmacyPrescriptions.$inferInsert;

export type PharmacyPrescriptionItem = typeof pharmacyPrescriptionItems.$inferSelect;
export type NewPharmacyPrescriptionItem = typeof pharmacyPrescriptionItems.$inferInsert;

export type PharmacyInventory = typeof pharmacyInventory.$inferSelect;
export type NewPharmacyInventory = typeof pharmacyInventory.$inferInsert;

export type PharmacyBatch = typeof pharmacyBatches.$inferSelect;
export type NewPharmacyBatch = typeof pharmacyBatches.$inferInsert;

export type PharmacyStockMovement = typeof pharmacyStockMovements.$inferSelect;
export type NewPharmacyStockMovement = typeof pharmacyStockMovements.$inferInsert;

export type PharmacyStockReservation = typeof pharmacyStockReservations.$inferSelect;
export type NewPharmacyStockReservation = typeof pharmacyStockReservations.$inferInsert;

export type PharmacyDispensing = typeof pharmacyDispensing.$inferSelect;
export type NewPharmacyDispensing = typeof pharmacyDispensing.$inferInsert;

export type PharmacyDispensingItem = typeof pharmacyDispensingItems.$inferSelect;
export type NewPharmacyDispensingItem = typeof pharmacyDispensingItems.$inferInsert;

export type PharmacyReturn = typeof pharmacyReturns.$inferSelect;
export type NewPharmacyReturn = typeof pharmacyReturns.$inferInsert;

export type PharmacyStockAdjustment = typeof pharmacyStockAdjustments.$inferSelect;
export type NewPharmacyStockAdjustment = typeof pharmacyStockAdjustments.$inferInsert;

export type PharmacySubstitutionRequest = typeof pharmacySubstitutionRequests.$inferSelect;
export type NewPharmacySubstitutionRequest = typeof pharmacySubstitutionRequests.$inferInsert;

export type PharmacyAuditTrace = typeof pharmacyAuditTraces.$inferSelect;
export type NewPharmacyAuditTrace = typeof pharmacyAuditTraces.$inferInsert;

/**
 * ============================================================================
 * PHASE 2.9: BILLING, CHARGES, PAYMENTS & REVENUE CYCLE MANAGEMENT (RCM)
 * ============================================================================
 */

/**
 * 5.1 billing_service_catalog
 * Master billable service & procedure catalog.
 */
export const billingServiceCatalog = clinicalSchema.table(
  'billing_service_catalog',
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
    serviceCode: varchar('service_code', { length: 100 }).notNull(),
    serviceName: varchar('service_name', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 100 }).notNull().default('GENERAL'), // CONSULTATION, INVESTIGATION, PHARMACY, PROCEDURE, ROOM_BED, EMERGENCY, NURSING, PACKAGE, GENERAL
    department: varchar('department', { length: 100 }),
    serviceType: varchar('service_type', { length: 100 }).notNull().default('STANDARD'),
    unit: varchar('unit', { length: 50 }).notNull().default('SERVICE'),
    basePrice: numeric('base_price', { precision: 12, scale: 2 }).notNull().default('0.00'),
    taxable: boolean('taxable').notNull().default(false),
    taxCode: varchar('tax_code', { length: 50 }),
    active: boolean('active').notNull().default(true),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_bill_catalog_tenant').on(table.tenantId),
    index('idx_bill_catalog_org').on(table.organizationId),
    index('idx_bill_catalog_branch').on(table.branchId),
    index('idx_bill_catalog_code').on(table.serviceCode),
    index('idx_bill_catalog_category').on(table.category),
    index('idx_bill_catalog_active').on(table.active)
  ]
);

/**
 * 5.2 billing_price_lists
 * Organization/branch-specific fee schedules and pricing tiers.
 */
export const billingPriceLists = clinicalSchema.table(
  'billing_price_lists',
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
    priceListCode: varchar('price_list_code', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, INACTIVE, DRAFT
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_price_lists_tenant').on(table.tenantId),
    index('idx_price_lists_branch').on(table.branchId),
    index('idx_price_lists_code').on(table.priceListCode),
    index('idx_price_lists_status').on(table.status)
  ]
);

/**
 * 5.3 billing_price_list_items
 * Specific rate overrides per service catalog item.
 */
export const billingPriceListItems = clinicalSchema.table(
  'billing_price_list_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    priceListId: uuid('price_list_id')
      .notNull()
      .references(() => billingPriceLists.id, { onDelete: 'cascade' }),
    serviceCatalogId: uuid('service_catalog_id')
      .notNull()
      .references(() => billingServiceCatalog.id, { onDelete: 'cascade' }),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    discountAllowed: boolean('discount_allowed').notNull().default(true),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_price_items_tenant').on(table.tenantId),
    index('idx_price_items_list').on(table.priceListId),
    index('idx_price_items_service').on(table.serviceCatalogId)
  ]
);

/**
 * 5.4 billing_charges
 * Canonical charge capture header originating from clinical, diagnostic, or pharmacy domains.
 */
export const billingCharges = clinicalSchema.table(
  'billing_charges',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    encounterId: uuid('encounter_id').references(() => encounters.id, { onDelete: 'set null' }),
    consultationId: uuid('consultation_id').references(() => consultations.id, { onDelete: 'set null' }),
    sourceDomain: varchar('source_domain', { length: 100 }).notNull(), // CLINICAL_CONSULTATION, CLINICAL_INVESTIGATION, PHARMACY, PROCEDURE, REGISTRATION, EMERGENCY, IPD, GENERAL
    sourceEntityId: varchar('source_entity_id', { length: 100 }),
    chargeNumber: varchar('charge_number', { length: 100 }).notNull().unique(),
    status: varchar('status', { length: 50 }).notNull().default('CAPTURED'), // PENDING, CAPTURED, INVOICED, CANCELLED, REVERSED
    subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull().default('0.00'),
    discountTotal: numeric('discount_total', { precision: 12, scale: 2 }).notNull().default('0.00'),
    taxTotal: numeric('tax_total', { precision: 12, scale: 2 }).notNull().default('0.00'),
    grandTotal: numeric('grand_total', { precision: 12, scale: 2 }).notNull().default('0.00'),
    capturedBy: varchar('captured_by', { length: 255 }).notNull(),
    capturedAt: timestamp('captured_at', { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_bill_charges_tenant').on(table.tenantId),
    index('idx_bill_charges_branch').on(table.branchId),
    index('idx_bill_charges_patient').on(table.patientId),
    index('idx_bill_charges_encounter').on(table.encounterId),
    index('idx_bill_charges_source').on(table.sourceDomain, table.sourceEntityId),
    index('idx_bill_charges_status').on(table.status),
    index('idx_bill_charges_number').on(table.chargeNumber)
  ]
);

/**
 * 5.5 billing_charge_items
 * Individual line items associated with a charge header.
 */
export const billingChargeItems = clinicalSchema.table(
  'billing_charge_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    chargeId: uuid('charge_id')
      .notNull()
      .references(() => billingCharges.id, { onDelete: 'cascade' }),
    serviceCatalogId: uuid('service_catalog_id').references(() => billingServiceCatalog.id, { onDelete: 'set null' }),
    description: varchar('description', { length: 255 }).notNull(),
    quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull().default('1.00'),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    grossAmount: numeric('gross_amount', { precision: 12, scale: 2 }).notNull(),
    discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
    taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
    netAmount: numeric('net_amount', { precision: 12, scale: 2 }).notNull(),
    sourceReference: varchar('source_reference', { length: 255 }),
    orderingDoctorId: varchar('ordering_doctor_id', { length: 255 }),
    departmentId: varchar('department_id', { length: 255 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_charge_items_tenant').on(table.tenantId),
    index('idx_charge_items_charge').on(table.chargeId),
    index('idx_charge_items_service').on(table.serviceCatalogId)
  ]
);

/**
 * 5.6 billing_invoices
 * Official commercial invoice with status lifecycle and balance tracking.
 */
export const billingInvoices = clinicalSchema.table(
  'billing_invoices',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    encounterId: uuid('encounter_id').references(() => encounters.id, { onDelete: 'set null' }),
    invoiceNumber: varchar('invoice_number', { length: 100 }).notNull().unique(),
    invoiceType: varchar('invoice_type', { length: 50 }).notNull().default('OPD'), // OPD, IPD, EMERGENCY, PHARMACY, DIAGNOSTICS, GENERAL
    status: varchar('status', { length: 50 }).notNull().default('DRAFT'), // DRAFT, ISSUED, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED, VOIDED
    subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull().default('0.00'),
    discountTotal: numeric('discount_total', { precision: 12, scale: 2 }).notNull().default('0.00'),
    taxTotal: numeric('tax_total', { precision: 12, scale: 2 }).notNull().default('0.00'),
    roundingAdjustment: numeric('rounding_adjustment', { precision: 8, scale: 2 }).notNull().default('0.00'),
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
    paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
    dueAmount: numeric('due_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    issuedAt: timestamp('issued_at', { withTimezone: true }),
    dueAt: timestamp('due_at', { withTimezone: true }),
    finalizedAt: timestamp('finalized_at', { withTimezone: true }),
    finalizedBy: varchar('finalized_by', { length: 255 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_bill_inv_tenant').on(table.tenantId),
    index('idx_bill_inv_branch').on(table.branchId),
    index('idx_bill_inv_patient').on(table.patientId),
    index('idx_bill_inv_encounter').on(table.encounterId),
    index('idx_bill_inv_number').on(table.invoiceNumber),
    index('idx_bill_inv_status').on(table.status),
    index('idx_bill_inv_issued').on(table.issuedAt),
    index('idx_bill_inv_due').on(table.dueAt)
  ]
);

/**
 * 5.7 billing_invoice_items
 * Individual line items billed on an invoice.
 */
export const billingInvoiceItems = clinicalSchema.table(
  'billing_invoice_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => billingInvoices.id, { onDelete: 'cascade' }),
    chargeId: uuid('charge_id').references(() => billingCharges.id, { onDelete: 'set null' }),
    chargeItemId: uuid('charge_item_id').references(() => billingChargeItems.id, { onDelete: 'set null' }),
    serviceCatalogId: uuid('service_catalog_id').references(() => billingServiceCatalog.id, { onDelete: 'set null' }),
    serviceCode: varchar('service_code', { length: 100 }).notNull(),
    description: varchar('description', { length: 255 }).notNull(),
    quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull().default('1.00'),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    grossAmount: numeric('gross_amount', { precision: 12, scale: 2 }).notNull(),
    discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
    taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
    netAmount: numeric('net_amount', { precision: 12, scale: 2 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_inv_items_tenant').on(table.tenantId),
    index('idx_inv_items_invoice').on(table.invoiceId),
    index('idx_inv_items_charge').on(table.chargeId)
  ]
);

/**
 * 5.8 billing_discounts
 * Authorized discounts applied at invoice or line-item level.
 */
export const billingDiscounts = clinicalSchema.table(
  'billing_discounts',
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
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => billingInvoices.id, { onDelete: 'cascade' }),
    invoiceItemId: uuid('invoice_item_id').references(() => billingInvoiceItems.id, { onDelete: 'set null' }),
    discountType: varchar('discount_type', { length: 50 }).notNull(), // PERCENTAGE, FIXED_AMOUNT
    discountValue: numeric('discount_value', { precision: 10, scale: 2 }).notNull(),
    discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).notNull(),
    reason: varchar('reason', { length: 255 }).notNull(),
    approvedBy: varchar('approved_by', { length: 255 }).notNull(),
    createdBy: varchar('created_by', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_bill_disc_tenant').on(table.tenantId),
    index('idx_bill_disc_invoice').on(table.invoiceId),
    index('idx_bill_disc_item').on(table.invoiceItemId)
  ]
);

/**
 * 5.9 billing_payments
 * Money collected across various payment channels.
 */
export const billingPayments = clinicalSchema.table(
  'billing_payments',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id').references(() => billingInvoices.id, { onDelete: 'set null' }),
    paymentNumber: varchar('payment_number', { length: 100 }).notNull().unique(),
    paymentMethod: varchar('payment_method', { length: 50 }).notNull(), // CASH, CARD, UPI, BANK_TRANSFER, WALLET, CHEQUE, ONLINE, OTHER
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    referenceNumber: varchar('reference_number', { length: 255 }),
    status: varchar('status', { length: 50 }).notNull().default('SUCCESS'), // PENDING, SUCCESS, FAILED, REVERSED, REFUNDED, PARTIALLY_REFUNDED
    receivedBy: varchar('received_by', { length: 255 }).notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    notes: text('notes'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_bill_pmt_tenant').on(table.tenantId),
    index('idx_bill_pmt_branch').on(table.branchId),
    index('idx_bill_pmt_patient').on(table.patientId),
    index('idx_bill_pmt_invoice').on(table.invoiceId),
    index('idx_bill_pmt_number').on(table.paymentNumber),
    index('idx_bill_pmt_status').on(table.status),
    index('idx_bill_pmt_received').on(table.receivedAt)
  ]
);

/**
 * 5.10 billing_payment_allocations
 * Mapping of payments to one or more invoices.
 */
export const billingPaymentAllocations = clinicalSchema.table(
  'billing_payment_allocations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    paymentId: uuid('payment_id')
      .notNull()
      .references(() => billingPayments.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => billingInvoices.id, { onDelete: 'cascade' }),
    allocatedAmount: numeric('allocated_amount', { precision: 12, scale: 2 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_pmt_alloc_tenant').on(table.tenantId),
    index('idx_pmt_alloc_pmt').on(table.paymentId),
    index('idx_pmt_alloc_inv').on(table.invoiceId)
  ]
);

/**
 * 5.11 billing_receipts
 * Official numbered receipts issued upon successful payment capture.
 */
export const billingReceipts = clinicalSchema.table(
  'billing_receipts',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    paymentId: uuid('payment_id')
      .notNull()
      .references(() => billingPayments.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id').references(() => billingInvoices.id, { onDelete: 'set null' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    receiptNumber: varchar('receipt_number', { length: 100 }).notNull().unique(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
    issuedBy: varchar('issued_by', { length: 255 }).notNull(),
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
    status: varchar('status', { length: 50 }).notNull().default('ISSUED'), // ISSUED, CANCELLED, REPRINTED
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_bill_rcpt_tenant').on(table.tenantId),
    index('idx_bill_rcpt_branch').on(table.branchId),
    index('idx_bill_rcpt_payment').on(table.paymentId),
    index('idx_bill_rcpt_invoice').on(table.invoiceId),
    index('idx_bill_rcpt_number').on(table.receiptNumber)
  ]
);

/**
 * 5.12 billing_refunds
 * Authorized refunds referencing original payment transactions.
 */
export const billingRefunds = clinicalSchema.table(
  'billing_refunds',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    paymentId: uuid('payment_id')
      .notNull()
      .references(() => billingPayments.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id').references(() => billingInvoices.id, { onDelete: 'set null' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    refundNumber: varchar('refund_number', { length: 100 }).notNull().unique(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    reason: text('reason').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('REQUESTED'), // REQUESTED, APPROVED, PROCESSING, COMPLETED, REJECTED, CANCELLED
    approvedBy: varchar('approved_by', { length: 255 }),
    processedBy: varchar('processed_by', { length: 255 }),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    notes: text('notes'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_bill_rfnd_tenant').on(table.tenantId),
    index('idx_bill_rfnd_branch').on(table.branchId),
    index('idx_bill_rfnd_payment').on(table.paymentId),
    index('idx_bill_rfnd_invoice').on(table.invoiceId),
    index('idx_bill_rfnd_number').on(table.refundNumber),
    index('idx_bill_rfnd_status').on(table.status)
  ]
);

/**
 * 5.13 billing_credit_notes
 * Credit notes issued against finalized invoices.
 */
export const billingCreditNotes = clinicalSchema.table(
  'billing_credit_notes',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => billingInvoices.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    creditNoteNumber: varchar('credit_note_number', { length: 100 }).notNull().unique(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    reason: text('reason').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('ISSUED'), // ISSUED, APPLIED, VOIDED
    approvedBy: varchar('approved_by', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_bill_cr_tenant').on(table.tenantId),
    index('idx_bill_cr_branch').on(table.branchId),
    index('idx_bill_cr_invoice').on(table.invoiceId),
    index('idx_bill_cr_number').on(table.creditNoteNumber)
  ]
);

/**
 * 5.14 billing_debit_adjustments
 * Supplementary charge adjustments applied to an invoice.
 */
export const billingDebitAdjustments = clinicalSchema.table(
  'billing_debit_adjustments',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => billingInvoices.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    adjustmentNumber: varchar('adjustment_number', { length: 100 }).notNull().unique(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    reason: text('reason').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('APPLIED'), // APPLIED, VOIDED
    approvedBy: varchar('approved_by', { length: 255 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_bill_dr_tenant').on(table.tenantId),
    index('idx_bill_dr_branch').on(table.branchId),
    index('idx_bill_dr_invoice').on(table.invoiceId),
    index('idx_bill_dr_number').on(table.adjustmentNumber)
  ]
);

/**
 * 5.15 billing_advances
 * Unallocated advance deposits held for patient encounters.
 */
export const billingAdvances = clinicalSchema.table(
  'billing_advances',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    encounterId: uuid('encounter_id').references(() => encounters.id, { onDelete: 'set null' }),
    advanceNumber: varchar('advance_number', { length: 100 }).notNull().unique(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    availableAmount: numeric('available_amount', { precision: 12, scale: 2 }).notNull(),
    paymentId: uuid('payment_id').references(() => billingPayments.id, { onDelete: 'set null' }),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, FULLY_UTILIZED, REFUNDED
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_bill_adv_tenant').on(table.tenantId),
    index('idx_bill_adv_branch').on(table.branchId),
    index('idx_bill_adv_patient').on(table.patientId),
    index('idx_bill_adv_encounter').on(table.encounterId),
    index('idx_bill_adv_status').on(table.status)
  ]
);

/**
 * 5.16 billing_cashier_sessions
 * Workstation cashier shift sessions with drawer floats and totals.
 */
export const billingCashierSessions = clinicalSchema.table(
  'billing_cashier_sessions',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    cashierId: varchar('cashier_id', { length: 255 }).notNull(),
    cashierName: varchar('cashier_name', { length: 255 }).notNull(),
    sessionNumber: varchar('session_number', { length: 100 }).notNull().unique(),
    openingBalance: numeric('opening_balance', { precision: 12, scale: 2 }).notNull().default('0.00'),
    cashReceived: numeric('cash_received', { precision: 12, scale: 2 }).notNull().default('0.00'),
    cashRefunded: numeric('cash_refunded', { precision: 12, scale: 2 }).notNull().default('0.00'),
    expectedClosingBalance: numeric('expected_closing_balance', { precision: 12, scale: 2 }).notNull().default('0.00'),
    closingBalance: numeric('closing_balance', { precision: 12, scale: 2 }),
    status: varchar('status', { length: 50 }).notNull().default('OPEN'), // OPEN, CLOSED, RECONCILIATION_PENDING, RECONCILED
    openedAt: timestamp('opened_at', { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    notes: text('notes'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_cash_sess_tenant').on(table.tenantId),
    index('idx_cash_sess_branch').on(table.branchId),
    index('idx_cash_sess_cashier').on(table.cashierId),
    index('idx_cash_sess_status').on(table.status),
    index('idx_cash_sess_opened').on(table.openedAt)
  ]
);

/**
 * 5.17 billing_reconciliations
 * End-of-shift reconciliation and cash variance reporting.
 */
export const billingReconciliations = clinicalSchema.table(
  'billing_reconciliations',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    cashierSessionId: uuid('cashier_session_id')
      .notNull()
      .references(() => billingCashierSessions.id, { onDelete: 'cascade' }),
    expectedAmount: numeric('expected_amount', { precision: 12, scale: 2 }).notNull(),
    actualAmount: numeric('actual_amount', { precision: 12, scale: 2 }).notNull(),
    variance: numeric('variance', { precision: 12, scale: 2 }).notNull().default('0.00'),
    status: varchar('status', { length: 50 }).notNull().default('MATCHED'), // MATCHED, DISCREPANCY, RESOLVED
    reconciledBy: varchar('reconciled_by', { length: 255 }).notNull(),
    reconciledAt: timestamp('reconciled_at', { withTimezone: true }).notNull().defaultNow(),
    remarks: text('remarks'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_reconcil_tenant').on(table.tenantId),
    index('idx_reconcil_branch').on(table.branchId),
    index('idx_reconcil_session').on(table.cashierSessionId),
    index('idx_reconcil_status').on(table.status)
  ]
);

/**
 * 5.18 billing_financial_transactions
 * Append-only general ledger for all financial movements.
 */
export const billingFinancialTransactions = clinicalSchema.table(
  'billing_financial_transactions',
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
    branchId: uuid('branch_id')
      .notNull()
      .references(() => operationalFacilities.id, { onDelete: 'cascade' }),
    transactionNumber: varchar('transaction_number', { length: 100 }).notNull().unique(),
    transactionType: varchar('transaction_type', { length: 50 }).notNull(), // CHARGE, INVOICE, PAYMENT, REFUND, CREDIT_NOTE, DEBIT_ADJUSTMENT, ADVANCE_DEPOSIT, ADVANCE_APPLICATION
    referenceType: varchar('reference_type', { length: 50 }).notNull(), // INVOICE, PAYMENT, REFUND, CHARGE, ADVANCE, CREDIT_NOTE, DEBIT_ADJUSTMENT
    referenceId: varchar('reference_id', { length: 100 }).notNull(),
    patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'set null' }),
    debit: numeric('debit', { precision: 12, scale: 2 }).notNull().default('0.00'),
    credit: numeric('credit', { precision: 12, scale: 2 }).notNull().default('0.00'),
    balanceImpact: numeric('balance_impact', { precision: 12, scale: 2 }).notNull().default('0.00'),
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    actorId: varchar('actor_id', { length: 255 }).notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    notes: text('notes'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_fin_tx_tenant').on(table.tenantId),
    index('idx_fin_tx_branch').on(table.branchId),
    index('idx_fin_tx_type').on(table.transactionType),
    index('idx_fin_tx_ref').on(table.referenceType, table.referenceId),
    index('idx_fin_tx_patient').on(table.patientId),
    index('idx_fin_tx_occurred').on(table.occurredAt)
  ]
);

/**
 * 5.19 billing_audit_traces
 * Tamper-evident append-only audit trail capturing all financial mutations and authorization decisions.
 */
export const billingAuditTraces = clinicalSchema.table(
  'billing_audit_traces',
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
    traceId: varchar('trace_id', { length: 100 }).notNull().unique(),
    correlationId: varchar('correlation_id', { length: 100 }).notNull(),
    actorId: varchar('actor_id', { length: 255 }).notNull(),
    actorRole: varchar('actor_role', { length: 100 }).notNull(),
    operation: varchar('operation', { length: 100 }).notNull(), // CHARGE_CAPTURED, INVOICE_CREATED, INVOICE_FINALIZED, DISCOUNT_APPLIED, PAYMENT_RECEIVED, PAYMENT_ALLOCATED, RECEIPT_ISSUED, REFUND_REQUESTED, REFUND_APPROVED, REFUND_COMPLETED, INVOICE_VOIDED, CREDIT_NOTE_CREATED, DEBIT_ADJUSTMENT_CREATED, CASHIER_OPENED, CASHIER_CLOSED, RECONCILIATION_COMPLETED
    entityType: varchar('entity_type', { length: 100 }).notNull(), // SERVICE_CATALOG, PRICE_LIST, CHARGE, INVOICE, PAYMENT, RECEIPT, REFUND, CREDIT_NOTE, DEBIT_ADJUSTMENT, ADVANCE, CASHIER_SESSION, RECONCILIATION
    entityId: varchar('entity_id', { length: 100 }).notNull(),
    patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'set null' }),
    invoiceId: uuid('invoice_id').references(() => billingInvoices.id, { onDelete: 'set null' }),
    beforeSnapshot: jsonb('before_snapshot'),
    afterSnapshot: jsonb('after_snapshot'),
    financialImpact: numeric('financial_impact', { precision: 12, scale: 2 }).default('0.00'),
    reason: text('reason').notNull(),
    operationStatus: varchar('operation_status', { length: 50 }).notNull().default('SUCCESS'),
    metadata: jsonb('metadata').default({}),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_bill_audit_tenant').on(table.tenantId),
    index('idx_bill_audit_branch').on(table.branchId),
    index('idx_bill_audit_patient').on(table.patientId),
    index('idx_bill_audit_invoice').on(table.invoiceId),
    index('idx_bill_audit_operation').on(table.operation),
    index('idx_bill_audit_entity').on(table.entityType, table.entityId),
    index('idx_bill_audit_time').on(table.timestamp)
  ]
);

export type BillingServiceCatalog = typeof billingServiceCatalog.$inferSelect;
export type NewBillingServiceCatalog = typeof billingServiceCatalog.$inferInsert;

export type BillingPriceList = typeof billingPriceLists.$inferSelect;
export type NewBillingPriceList = typeof billingPriceLists.$inferInsert;

export type BillingPriceListItem = typeof billingPriceListItems.$inferSelect;
export type NewBillingPriceListItem = typeof billingPriceListItems.$inferInsert;

export type BillingCharge = typeof billingCharges.$inferSelect;
export type NewBillingCharge = typeof billingCharges.$inferInsert;

export type BillingChargeItem = typeof billingChargeItems.$inferSelect;
export type NewBillingChargeItem = typeof billingChargeItems.$inferInsert;

export type BillingInvoice = typeof billingInvoices.$inferSelect;
export type NewBillingInvoice = typeof billingInvoices.$inferInsert;

export type BillingInvoiceItem = typeof billingInvoiceItems.$inferSelect;
export type NewBillingInvoiceItem = typeof billingInvoiceItems.$inferInsert;

export type BillingDiscount = typeof billingDiscounts.$inferSelect;
export type NewBillingDiscount = typeof billingDiscounts.$inferInsert;

export type BillingPayment = typeof billingPayments.$inferSelect;
export type NewBillingPayment = typeof billingPayments.$inferInsert;

export type BillingPaymentAllocation = typeof billingPaymentAllocations.$inferSelect;
export type NewBillingPaymentAllocation = typeof billingPaymentAllocations.$inferInsert;

export type BillingReceipt = typeof billingReceipts.$inferSelect;
export type NewBillingReceipt = typeof billingReceipts.$inferInsert;

export type BillingRefund = typeof billingRefunds.$inferSelect;
export type NewBillingRefund = typeof billingRefunds.$inferInsert;

export type BillingCreditNote = typeof billingCreditNotes.$inferSelect;
export type NewBillingCreditNote = typeof billingCreditNotes.$inferInsert;

export type BillingDebitAdjustment = typeof billingDebitAdjustments.$inferSelect;
export type NewBillingDebitAdjustment = typeof billingDebitAdjustments.$inferInsert;

export type BillingAdvance = typeof billingAdvances.$inferSelect;
export type NewBillingAdvance = typeof billingAdvances.$inferInsert;

export type BillingCashierSession = typeof billingCashierSessions.$inferSelect;
export type NewBillingCashierSession = typeof billingCashierSessions.$inferInsert;

export type BillingReconciliation = typeof billingReconciliations.$inferSelect;
export type NewBillingReconciliation = typeof billingReconciliations.$inferInsert;

export type BillingFinancialTransaction = typeof billingFinancialTransactions.$inferSelect;
export type NewBillingFinancialTransaction = typeof billingFinancialTransactions.$inferInsert;

export type BillingAuditTrace = typeof billingAuditTraces.$inferSelect;
export type NewBillingAuditTrace = typeof billingAuditTraces.$inferInsert;

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

// ============================================================================
// PHASE 2.15: MEDICAL RECORDS DEPARTMENT (MRD), HIM & ICD-10 SCHEMAS
// ============================================================================

export const mrDepartments = clinicalSchema.table(
  'mr_departments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    departmentCode: varchar('department_code', { length: 64 }).notNull(),
    departmentName: varchar('department_name', { length: 255 }).notNull(),
    headOfMrdName: varchar('head_of_mrd_name', { length: 255 }).notNull(),
    leadHIMOfficerName: varchar('lead_him_officer_name', { length: 255 }).notNull(),
    leadCodingAuditorName: varchar('lead_coding_auditor_name', { length: 255 }).notNull(),
    physicalVaultLocation: varchar('physical_vault_location', { length: 255 }).notNull(),
    totalIndexedRecords: integer('total_indexed_records').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_mrd_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_mrd_code_branch').on(table.tenantId, table.branchId, table.departmentCode)
  ]
);

export const medicalRecordIndexes = clinicalSchema.table(
  'medical_record_indexes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    recordNumber: varchar('record_number', { length: 64 }).notNull(),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    encounterId: uuid('encounter_id').notNull(),
    encounterNumber: varchar('encounter_number', { length: 64 }).notNull(),
    encounterType: varchar('encounter_type', { length: 64 }).notNull(),
    admissionDate: timestamp('admission_date', { withTimezone: true }).notNull(),
    dischargeDate: timestamp('discharge_date', { withTimezone: true }),
    primaryAttendingDoctor: varchar('primary_attending_doctor', { length: 255 }).notNull(),
    completionStatus: varchar('completion_status', { length: 64 }).notNull().default('OPEN'),
    codingStatus: varchar('coding_status', { length: 64 }).notNull().default('PENDING_INITIAL_CODE'),
    storageType: varchar('storage_type', { length: 64 }).notNull().default('DIGITAL_ONLY_EHR'),
    physicalShelfNumber: varchar('physical_shelf_number', { length: 64 }),
    physicalBoxNumber: varchar('physical_box_number', { length: 64 }),
    isLegalHoldActive: boolean('is_legal_hold_active').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_mri_tenant_patient').on(table.tenantId, table.patientId),
    index('idx_mri_tenant_encounter').on(table.tenantId, table.encounterId),
    uniqueIndex('idx_mri_record_num').on(table.tenantId, table.recordNumber)
  ]
);

export const medicalRecordCompletionTasks = clinicalSchema.table(
  'medical_record_completion_tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    recordId: uuid('record_id').notNull().references(() => medicalRecordIndexes.id, { onDelete: 'cascade' }),
    taskCode: varchar('task_code', { length: 64 }).notNull(),
    deficiencyType: varchar('deficiency_type', { length: 255 }).notNull(),
    responsibleStaffName: varchar('responsible_staff_name', { length: 255 }).notNull(),
    responsibleStaffRole: varchar('responsible_staff_role', { length: 64 }).notNull(),
    description: text('description').notNull(),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    isResolved: boolean('is_resolved').notNull().default(false),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolvedByStaff: varchar('resolved_by_staff', { length: 255 }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_mrct_tenant_record').on(table.tenantId, table.recordId),
    uniqueIndex('idx_mrct_task_code').on(table.tenantId, table.taskCode)
  ]
);

export const medicalDiagnosisCodes = clinicalSchema.table(
  'medical_diagnosis_codes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    recordId: uuid('record_id').notNull().references(() => medicalRecordIndexes.id, { onDelete: 'cascade' }),
    icdCode: varchar('icd_code', { length: 32 }).notNull(),
    icdDescription: text('icd_description').notNull(),
    codeType: varchar('code_type', { length: 64 }).notNull().default('PRIMARY_DIAGNOSIS'),
    poaIndicator: varchar('poa_indicator', { length: 64 }).notNull().default('YES_PRESENT_ON_ADMISSION'),
    sequencingOrder: integer('sequencing_order').notNull().default(1),
    assignedByCoder: varchar('assigned_by_coder', { length: 255 }).notNull(),
    coderNotes: text('coder_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_mdc_tenant_record').on(table.tenantId, table.recordId),
    index('idx_mdc_code').on(table.tenantId, table.icdCode)
  ]
);

export const codingReviews = clinicalSchema.table(
  'coding_reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    recordId: uuid('record_id').notNull().references(() => medicalRecordIndexes.id, { onDelete: 'cascade' }),
    reviewNumber: varchar('review_number', { length: 64 }).notNull(),
    reviewerName: varchar('reviewer_name', { length: 255 }).notNull(),
    reviewerRole: varchar('reviewer_role', { length: 64 }).notNull(),
    reviewLevel: varchar('review_level', { length: 64 }).notNull(),
    status: varchar('status', { length: 64 }).notNull().default('CODED_AWAITING_REVIEW'),
    findingsAndErrorsNotes: text('findings_and_errors_notes').notNull(),
    codingAccuracyScorePercent: integer('coding_accuracy_score_percent').notNull().default(100),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_cr_tenant_record').on(table.tenantId, table.recordId),
    uniqueIndex('idx_cr_review_num').on(table.tenantId, table.reviewNumber)
  ]
);

export const clinicalDocumentationQueries = clinicalSchema.table(
  'clinical_documentation_queries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    recordId: uuid('record_id').notNull().references(() => medicalRecordIndexes.id, { onDelete: 'cascade' }),
    queryNumber: varchar('query_number', { length: 64 }).notNull(),
    queryTitle: varchar('query_title', { length: 255 }).notNull(),
    initiatedByCoder: varchar('initiated_by_coder', { length: 255 }).notNull(),
    assignedDoctorName: varchar('assigned_doctor_name', { length: 255 }).notNull(),
    clinicalReason: text('clinical_reason').notNull(),
    supportingDocumentationSnippet: text('supporting_documentation_snippet').notNull(),
    clinicianClarificationResponse: text('clinician_clarification_response'),
    status: varchar('status', { length: 64 }).notNull().default('OPEN'),
    initiatedAt: timestamp('initiated_at', { withTimezone: true }).defaultNow().notNull(),
    respondedAt: timestamp('responded_at', { withTimezone: true })
  },
  (table) => [
    index('idx_cdq_tenant_record').on(table.tenantId, table.recordId),
    uniqueIndex('idx_cdq_query_num').on(table.tenantId, table.queryNumber)
  ]
);

export const releaseOfInformationRequests = clinicalSchema.table(
  'release_of_information_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    requestNumber: varchar('request_number', { length: 64 }).notNull(),
    recordId: uuid('record_id').notNull().references(() => medicalRecordIndexes.id, { onDelete: 'cascade' }),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    requestType: varchar('request_type', { length: 64 }).notNull(),
    requestorName: varchar('requestor_name', { length: 255 }).notNull(),
    requestorOrganization: varchar('requestor_organization', { length: 255 }),
    purposeOfRequest: text('purpose_of_request').notNull(),
    authorizedByOfficer: varchar('authorized_by_officer', { length: 255 }),
    status: varchar('status', { length: 64 }).notNull().default('REQUESTED'),
    deliveryMethod: varchar('delivery_method', { length: 64 }).notNull().default('ELECTRONIC_SECURE_PORTAL'),
    requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow().notNull(),
    releasedAt: timestamp('released_at', { withTimezone: true })
  },
  (table) => [
    index('idx_roi_tenant_record').on(table.tenantId, table.recordId),
    uniqueIndex('idx_roi_req_num').on(table.tenantId, table.requestNumber)
  ]
);

export const legalRecordRequests = clinicalSchema.table(
  'legal_record_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    legalRequestNumber: varchar('legal_request_number', { length: 64 }).notNull(),
    recordId: uuid('record_id').notNull().references(() => medicalRecordIndexes.id, { onDelete: 'cascade' }),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    courtOrAgencyName: varchar('court_or_agency_name', { length: 255 }).notNull(),
    legalNoticeReferenceNumber: varchar('legal_notice_reference_number', { length: 64 }).notNull(),
    officerInChargeName: varchar('officer_in_charge_name', { length: 255 }).notNull(),
    subpoenaDetails: text('subpoena_details').notNull(),
    isPreservationOrder: boolean('is_preservation_order').notNull().default(false),
    legalHoldApplied: boolean('legal_hold_applied').notNull().default(false),
    servedAt: timestamp('served_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_lrr_tenant_record').on(table.tenantId, table.recordId),
    uniqueIndex('idx_lrr_req_num').on(table.tenantId, table.legalRequestNumber)
  ]
);

export const medicalRecordLegalHolds = clinicalSchema.table(
  'medical_record_legal_holds',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    holdCode: varchar('hold_code', { length: 64 }).notNull(),
    recordId: uuid('record_id').notNull().references(() => medicalRecordIndexes.id, { onDelete: 'cascade' }),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    legalMatterTitle: varchar('legal_matter_title', { length: 255 }).notNull(),
    reasonForHold: text('reason_for_hold').notNull(),
    authorizedByLegalCounsel: varchar('authorized_by_legal_counsel', { length: 255 }).notNull(),
    status: varchar('status', { length: 64 }).notNull().default('ACTIVE_LEGAL_HOLD'),
    appliedAt: timestamp('applied_at', { withTimezone: true }).defaultNow().notNull(),
    releasedAt: timestamp('released_at', { withTimezone: true })
  },
  (table) => [
    index('idx_mrlh_tenant_record').on(table.tenantId, table.recordId),
    uniqueIndex('idx_mrlh_hold_code').on(table.tenantId, table.holdCode)
  ]
);

export const birthRegistryRecords = clinicalSchema.table(
  'birth_registry_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    birthRegistrationNumber: varchar('birth_registration_number', { length: 64 }).notNull(),
    motherEncounterId: uuid('mother_encounter_id').notNull(),
    motherPatientName: varchar('mother_patient_name', { length: 255 }).notNull(),
    motherMrn: varchar('mother_mrn', { length: 64 }).notNull(),
    babyNameOrIdentifier: varchar('baby_name_or_identifier', { length: 255 }).notNull(),
    birthTimestamp: timestamp('birth_timestamp', { withTimezone: true }).notNull(),
    deliveryType: varchar('delivery_type', { length: 64 }).notNull(),
    gender: varchar('gender', { length: 32 }).notNull(),
    birthWeightKg: numeric('birth_weight_kg', { precision: 4, scale: 2 }).notNull(),
    attendingObstetrician: varchar('attending_obstetrician', { length: 255 }).notNull(),
    attendingPaediatrician: varchar('attending_paediatrician', { length: 255 }).notNull(),
    birthCertificateReferenceNumber: varchar('birth_certificate_reference_number', { length: 64 }).notNull(),
    governmentPortalNotified: boolean('government_portal_notified').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_brr_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_brr_reg_num').on(table.tenantId, table.birthRegistrationNumber)
  ]
);

export const deathRegistryRecords = clinicalSchema.table(
  'death_registry_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    deathRegistrationNumber: varchar('death_registration_number', { length: 64 }).notNull(),
    encounterId: uuid('encounter_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    declaredDeadTimestamp: timestamp('declared_dead_timestamp', { withTimezone: true }).notNull(),
    declaringPhysician: varchar('declaring_physician', { length: 255 }).notNull(),
    primaryCauseOfDeath: text('primary_cause_of_death').notNull(),
    secondaryCauses: text('secondary_causes'),
    deathCertificateNumber: varchar('death_certificate_number', { length: 64 }).notNull(),
    coronerPoliceInformed: boolean('coroner_police_informed').notNull().default(false),
    statutoryDeathPortalNotified: boolean('statutory_death_portal_notified').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_drr_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_drr_reg_num').on(table.tenantId, table.deathRegistrationNumber)
  ]
);

export const medicalRecordAuditEvents = clinicalSchema.table(
  'medical_record_audit_events',
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
    index('idx_mrae_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_mrae_trace_num').on(table.tenantId, table.traceNumber)
  ]
);

export type MRDepartment = typeof mrDepartments.$inferSelect;
export type MedicalRecordIndex = typeof medicalRecordIndexes.$inferSelect;
export type MedicalRecordCompletionTask = typeof medicalRecordCompletionTasks.$inferSelect;
export type MedicalDiagnosisCode = typeof medicalDiagnosisCodes.$inferSelect;
export type CodingReview = typeof codingReviews.$inferSelect;
export type ClinicalDocumentationQuery = typeof clinicalDocumentationQueries.$inferSelect;
export type ReleaseOfInformationRequest = typeof releaseOfInformationRequests.$inferSelect;
export type LegalRecordRequest = typeof legalRecordRequests.$inferSelect;
export type MedicalRecordLegalHold = typeof medicalRecordLegalHolds.$inferSelect;
export type BirthRegistryRecord = typeof birthRegistryRecords.$inferSelect;
export type DeathRegistryRecord = typeof deathRegistryRecords.$inferSelect;
export type MedicalRecordAuditEvent = typeof medicalRecordAuditEvents.$inferSelect;

// ============================================================================
// PHASE 2.16: BLOOD BANK & TRANSFUSION MEDICINE SCHEMAS
// ============================================================================

export const bloodBanks = clinicalSchema.table(
  'blood_banks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    facilityCode: varchar('facility_code', { length: 64 }).notNull(),
    facilityName: varchar('facility_name', { length: 255 }).notNull(),
    licenseNumber: varchar('license_number', { length: 128 }).notNull(),
    medicalDirectorName: varchar('medical_director_name', { length: 255 }).notNull(),
    headTechnologistName: varchar('head_technologist_name', { length: 255 }).notNull(),
    storageLocationName: varchar('storage_location_name', { length: 255 }).notNull(),
    totalAvailableUnits: integer('total_available_units').notNull().default(0),
    quarantineUnits: integer('quarantine_units').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bb_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_bb_code_branch').on(table.tenantId, table.branchId, table.facilityCode)
  ]
);

export const bloodDonors = clinicalSchema.table(
  'blood_donors',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    donorCode: varchar('donor_code', { length: 64 }).notNull(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    gender: varchar('gender', { length: 32 }).notNull(),
    dateOfBirth: timestamp('date_of_birth', { withTimezone: true }).notNull(),
    bloodGroup: varchar('blood_group', { length: 32 }).notNull(),
    contactNumber: varchar('contact_number', { length: 64 }).notNull(),
    email: varchar('email', { length: 255 }),
    donorType: varchar('donor_type', { length: 64 }).notNull().default('VOLUNTARY_NON_REMUNERATED'),
    eligibilityStatus: varchar('eligibility_status', { length: 64 }).notNull().default('ELIGIBLE_FOR_DONATION'),
    deferralReason: text('deferral_reason'),
    deferralEndDate: timestamp('deferral_end_date', { withTimezone: true }),
    totalDonationsCount: integer('total_donations_count').notNull().default(0),
    lastDonationDate: timestamp('last_donation_date', { withTimezone: true }),
    nextEligibleDate: timestamp('next_eligible_date', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bd_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_bd_code').on(table.tenantId, table.donorCode)
  ]
);

export const bloodDonorScreenings = clinicalSchema.table(
  'blood_donor_screenings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    screeningCode: varchar('screening_code', { length: 64 }).notNull(),
    donorId: uuid('donor_id').notNull().references(() => bloodDonors.id, { onDelete: 'cascade' }),
    donorName: varchar('donor_name', { length: 255 }).notNull(),
    weightKg: numeric('weight_kg', { precision: 5, scale: 2 }).notNull(),
    hemoglobinGdl: numeric('hemoglobin_gdl', { precision: 4, scale: 1 }).notNull(),
    systolicBp: integer('systolic_bp').notNull(),
    diastolicBp: integer('diastolic_bp').notNull(),
    pulseBpm: integer('pulse_bpm').notNull(),
    temperatureF: numeric('temperature_f', { precision: 4, scale: 1 }).notNull(),
    medicalHistoryCleared: boolean('medical_history_cleared').notNull().default(true),
    screeningNurseName: varchar('screening_nurse_name', { length: 255 }).notNull(),
    eligibilityDecision: varchar('eligibility_decision', { length: 64 }).notNull(),
    remarks: text('remarks'),
    screenedAt: timestamp('screened_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bds_tenant_donor').on(table.tenantId, table.donorId),
    uniqueIndex('idx_bds_code').on(table.tenantId, table.screeningCode)
  ]
);

export const bloodDonations = clinicalSchema.table(
  'blood_donations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    donationNumber: varchar('donation_number', { length: 64 }).notNull(),
    donorId: uuid('donor_id').notNull().references(() => bloodDonors.id, { onDelete: 'cascade' }),
    donorName: varchar('donor_name', { length: 255 }).notNull(),
    bloodGroup: varchar('blood_group', { length: 32 }).notNull(),
    donationType: varchar('donation_type', { length: 64 }).notNull(),
    collectedVolumeMl: integer('collected_volume_ml').notNull().default(450),
    anticoagulantType: varchar('anticoagulant_type', { length: 64 }).notNull().default('CPDA-1'),
    phlebotomistName: varchar('phlebotomist_name', { length: 255 }).notNull(),
    collectionLocation: varchar('collection_location', { length: 255 }).notNull(),
    unitStatus: varchar('unit_status', { length: 64 }).notNull().default('QUARANTINED'),
    bagBarcode: varchar('bag_barcode', { length: 128 }).notNull(),
    collectedAt: timestamp('collected_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bdn_tenant_donor').on(table.tenantId, table.donorId),
    uniqueIndex('idx_bdn_number').on(table.tenantId, table.donationNumber)
  ]
);

export const bloodTests = clinicalSchema.table(
  'blood_tests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    testCode: varchar('test_code', { length: 64 }).notNull(),
    donationId: uuid('donation_id').notNull().references(() => bloodDonations.id, { onDelete: 'cascade' }),
    unitBarcode: varchar('unit_barcode', { length: 128 }).notNull(),
    aboGroupingResult: varchar('abo_grouping_result', { length: 32 }).notNull(),
    rhFactorResult: varchar('rh_factor_result', { length: 32 }).notNull(),
    antibodyScreen: varchar('antibody_screen', { length: 64 }).notNull().default('NEGATIVE'),
    hivResult: varchar('hiv_result', { length: 32 }).notNull().default('NON_REACTIVE'),
    hBsAgResult: varchar('hbsag_result', { length: 32 }).notNull().default('NON_REACTIVE'),
    hcvResult: varchar('hcv_result', { length: 32 }).notNull().default('NON_REACTIVE'),
    syphilisVDRLResult: varchar('syphilis_vdrl_result', { length: 32 }).notNull().default('NON_REACTIVE'),
    malariaResult: varchar('malaria_result', { length: 32 }).notNull().default('NEGATIVE'),
    testingTechnicianName: varchar('testing_technician_name', { length: 255 }).notNull(),
    pathologistSignOffName: varchar('pathologist_sign_off_name', { length: 255 }).notNull(),
    isPassedForRelease: boolean('is_passed_for_release').notNull().default(false),
    testedAt: timestamp('tested_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bt_tenant_donation').on(table.tenantId, table.donationId),
    uniqueIndex('idx_bt_code').on(table.tenantId, table.testCode)
  ]
);

export const bloodComponents = clinicalSchema.table(
  'blood_components',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    componentCode: varchar('component_code', { length: 64 }).notNull(),
    donationId: uuid('donation_id').notNull().references(() => bloodDonations.id, { onDelete: 'cascade' }),
    componentType: varchar('component_type', { length: 64 }).notNull(),
    bloodGroup: varchar('blood_group', { length: 32 }).notNull(),
    volumeMl: integer('volume_ml').notNull(),
    storageLocation: varchar('storage_location', { length: 255 }).notNull(),
    storageTemperatureTargetC: varchar('storage_temperature_target_c', { length: 32 }).notNull(),
    expiryDate: timestamp('expiry_date', { withTimezone: true }).notNull(),
    status: varchar('status', { length: 64 }).notNull().default('QUARANTINED'),
    preparedByTechnician: varchar('prepared_by_technician', { length: 255 }).notNull(),
    releasedByPathologist: varchar('released_by_pathologist', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bc_tenant_donation').on(table.tenantId, table.donationId),
    uniqueIndex('idx_bc_code').on(table.tenantId, table.componentCode)
  ]
);

export const bloodRequests = clinicalSchema.table(
  'blood_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    requestCode: varchar('request_code', { length: 64 }).notNull(),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    encounterId: uuid('encounter_id').notNull(),
    requestingDepartment: varchar('requesting_department', { length: 255 }).notNull(),
    orderingPhysicianName: varchar('ordering_physician_name', { length: 255 }).notNull(),
    requestedComponentType: varchar('requested_component_type', { length: 64 }).notNull(),
    patientBloodGroup: varchar('patient_blood_group', { length: 32 }).notNull(),
    quantityUnits: integer('quantity_units').notNull().default(1),
    urgency: varchar('urgency', { length: 64 }).notNull().default('ROUTINE_SCHEDULED_OT'),
    clinicalIndication: text('clinical_indication').notNull(),
    requiredByTimestamp: timestamp('required_by_timestamp', { withTimezone: true }).notNull(),
    status: varchar('status', { length: 64 }).notNull().default('PENDING_CROSSMATCH'),
    requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_br_tenant_patient').on(table.tenantId, table.patientId),
    uniqueIndex('idx_br_code').on(table.tenantId, table.requestCode)
  ]
);

export const bloodCrossmatches = clinicalSchema.table(
  'blood_crossmatches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    crossmatchCode: varchar('crossmatch_code', { length: 64 }).notNull(),
    requestId: uuid('request_id').notNull().references(() => bloodRequests.id, { onDelete: 'cascade' }),
    componentId: uuid('component_id').notNull().references(() => bloodComponents.id, { onDelete: 'cascade' }),
    componentCode: varchar('component_code', { length: 64 }).notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientBloodGroup: varchar('patient_blood_group', { length: 32 }).notNull(),
    donorBloodGroup: varchar('donor_blood_group', { length: 32 }).notNull(),
    majorCrossmatchResult: varchar('major_crossmatch_result', { length: 32 }).notNull(),
    minorCrossmatchResult: varchar('minor_crossmatch_result', { length: 32 }).notNull(),
    coombsTestResult: varchar('coombs_test_result', { length: 32 }).notNull().default('NEGATIVE'),
    overallResult: varchar('overall_result', { length: 64 }).notNull().default('COMPATIBLE'),
    testingTechnicianName: varchar('testing_technician_name', { length: 255 }).notNull(),
    verifiedByPathologist: varchar('verified_by_pathologist', { length: 255 }).notNull(),
    crossmatchedAt: timestamp('crossmatched_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
  },
  (table) => [
    index('idx_bxm_tenant_request').on(table.tenantId, table.requestId),
    uniqueIndex('idx_bxm_code').on(table.tenantId, table.crossmatchCode)
  ]
);

export const bloodIssues = clinicalSchema.table(
  'blood_issues',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    issueCode: varchar('issue_code', { length: 64 }).notNull(),
    requestId: uuid('request_id').notNull().references(() => bloodRequests.id, { onDelete: 'cascade' }),
    componentId: uuid('component_id').notNull().references(() => bloodComponents.id, { onDelete: 'cascade' }),
    componentCode: varchar('component_code', { length: 64 }).notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    destinationDepartment: varchar('destination_department', { length: 255 }).notNull(),
    issuingTechnicianName: varchar('issuing_technician_name', { length: 255 }).notNull(),
    receivingNurseName: varchar('receiving_nurse_name', { length: 255 }).notNull(),
    transportBoxTemperatureC: varchar('transport_box_temperature_c', { length: 32 }).notNull(),
    issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bi_tenant_request').on(table.tenantId, table.requestId),
    uniqueIndex('idx_bi_code').on(table.tenantId, table.issueCode)
  ]
);

export const transfusionRecords = clinicalSchema.table(
  'transfusion_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    transfusionCode: varchar('transfusion_code', { length: 64 }).notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    encounterId: uuid('encounter_id').notNull(),
    componentCode: varchar('component_code', { length: 64 }).notNull(),
    componentType: varchar('component_type', { length: 64 }).notNull(),
    bloodGroup: varchar('blood_group', { length: 32 }).notNull(),
    administeredByNurse: varchar('administered_by_nurse', { length: 255 }).notNull(),
    supervisingDoctorName: varchar('supervising_doctor_name', { length: 255 }).notNull(),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }),
    preTransfusionPulse: integer('pre_transfusion_pulse').notNull(),
    preTransfusionBp: varchar('pre_transfusion_bp', { length: 32 }).notNull(),
    preTransfusionTempF: numeric('pre_transfusion_temp_f', { precision: 4, scale: 1 }).notNull(),
    postTransfusionPulse: integer('post_transfusion_pulse'),
    postTransfusionBp: varchar('post_transfusion_bp', { length: 32 }),
    postTransfusionTempF: numeric('post_transfusion_temp_f', { precision: 4, scale: 1 }),
    adverseReactionNoted: boolean('adverse_reaction_noted').notNull().default(false),
    status: varchar('status', { length: 64 }).notNull().default('IN_PROGRESS'),
    outcomeNotes: text('outcome_notes')
  },
  (table) => [
    index('idx_tr_tenant_encounter').on(table.tenantId, table.encounterId),
    uniqueIndex('idx_tr_code').on(table.tenantId, table.transfusionCode)
  ]
);

export const transfusionReactions = clinicalSchema.table(
  'transfusion_reactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    reactionReportCode: varchar('reaction_report_code', { length: 64 }).notNull(),
    transfusionId: uuid('transfusion_id').notNull().references(() => transfusionRecords.id, { onDelete: 'cascade' }),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    componentCode: varchar('component_code', { length: 64 }).notNull(),
    severity: varchar('severity', { length: 64 }).notNull(),
    symptomsObserved: text('symptoms_observed').notNull(),
    immediateInterventions: text('immediate_interventions').notNull(),
    notifiedPhysicianName: varchar('notified_physician_name', { length: 255 }).notNull(),
    clericalCheckConfirmedMatching: boolean('clerical_check_confirmed_matching').notNull().default(true),
    postReactionUrineHemoglobin: varchar('post_reaction_urine_hemoglobin', { length: 64 }),
    directAntiglobulinTestDAT: varchar('direct_antiglobulin_test_dat', { length: 64 }),
    investigationOutcome: text('investigation_outcome'),
    status: varchar('status', { length: 64 }).notNull().default('REPORTED'),
    reportedAt: timestamp('reported_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_trx_tenant_transfusion').on(table.tenantId, table.transfusionId),
    uniqueIndex('idx_trx_code').on(table.tenantId, table.reactionReportCode)
  ]
);

export const bloodQualityChecks = clinicalSchema.table(
  'blood_quality_checks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    qcCode: varchar('qc_code', { length: 64 }).notNull(),
    equipmentName: varchar('equipment_name', { length: 255 }).notNull(),
    checkType: varchar('check_type', { length: 64 }).notNull(),
    parameterMeasured: varchar('parameter_measured', { length: 255 }).notNull(),
    expectedStandard: varchar('expected_standard', { length: 255 }).notNull(),
    actualReading: varchar('actual_reading', { length: 255 }).notNull(),
    isPassed: boolean('is_passed').notNull().default(true),
    technicianName: varchar('technician_name', { length: 255 }).notNull(),
    checkedAt: timestamp('checked_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bqc_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_bqc_code').on(table.tenantId, table.qcCode)
  ]
);

export const bloodTemperatureLogs = clinicalSchema.table(
  'blood_temperature_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    unitLocation: varchar('unit_location', { length: 255 }).notNull(),
    storageUnitType: varchar('storage_unit_type', { length: 64 }).notNull(),
    recordedTemperatureC: numeric('recorded_temperature_c', { precision: 4, scale: 1 }).notNull(),
    targetMinC: numeric('target_min_c', { precision: 4, scale: 1 }).notNull(),
    targetMaxC: numeric('target_max_c', { precision: 4, scale: 1 }).notNull(),
    isExcursion: boolean('is_excursion').notNull().default(false),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_btl_tenant_location').on(table.tenantId, table.unitLocation)
  ]
);

export const bloodDiscardRecords = clinicalSchema.table(
  'blood_discard_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    discardCode: varchar('discard_code', { length: 64 }).notNull(),
    componentCode: varchar('component_code', { length: 64 }).notNull(),
    componentType: varchar('component_type', { length: 64 }).notNull(),
    bloodGroup: varchar('blood_group', { length: 32 }).notNull(),
    reason: varchar('reason', { length: 64 }).notNull(),
    authorizedByPathologist: varchar('authorized_by_pathologist', { length: 255 }).notNull(),
    disposalMethod: varchar('disposal_method', { length: 255 }).notNull(),
    discardedAt: timestamp('discarded_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bdr_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_bdr_code').on(table.tenantId, table.discardCode)
  ]
);

export const bloodBankAuditEvents = clinicalSchema.table(
  'blood_bank_audit_events',
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
    index('idx_bbae_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_bbae_trace_num').on(table.tenantId, table.traceNumber)
  ]
);

export type BloodBankFacility = typeof bloodBanks.$inferSelect;
export type BloodDonor = typeof bloodDonors.$inferSelect;
export type BloodDonorScreening = typeof bloodDonorScreenings.$inferSelect;
export type BloodDonation = typeof bloodDonations.$inferSelect;
export type BloodTest = typeof bloodTests.$inferSelect;
export type BloodComponent = typeof bloodComponents.$inferSelect;
export type BloodRequest = typeof bloodRequests.$inferSelect;
export type BloodCrossmatch = typeof bloodCrossmatches.$inferSelect;
export type BloodIssue = typeof bloodIssues.$inferSelect;
export type TransfusionRecord = typeof transfusionRecords.$inferSelect;
export type TransfusionReaction = typeof transfusionReactions.$inferSelect;
export type BloodQualityCheck = typeof bloodQualityChecks.$inferSelect;
export type BloodTemperatureLog = typeof bloodTemperatureLogs.$inferSelect;
export type BloodDiscardRecord = typeof bloodDiscardRecords.$inferSelect;
export type BloodBankAuditEvent = typeof bloodBankAuditEvents.$inferSelect;

// ============================================================================
// PHASE 2.17: RADIOLOGY, IMAGING & PACS / RIS SCHEMAS
// ============================================================================

export const radiologyDepartments = clinicalSchema.table(
  'radiology_departments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    departmentCode: varchar('department_code', { length: 64 }).notNull(),
    departmentName: varchar('department_name', { length: 255 }).notNull(),
    hodRadiologistName: varchar('hod_radiologist_name', { length: 255 }).notNull(),
    chiefTechnologistName: varchar('chief_technologist_name', { length: 255 }).notNull(),
    locationDescription: text('location_description').notNull(),
    totalModalitiesCount: integer('total_modalities_count').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_rd_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_rd_code').on(table.tenantId, table.departmentCode)
  ]
);

export const radiologyModalities = clinicalSchema.table(
  'radiology_modalities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    modalityCode: varchar('modality_code', { length: 64 }).notNull(),
    modalityName: varchar('modality_name', { length: 255 }).notNull(),
    modalityType: varchar('modality_type', { length: 64 }).notNull(),
    roomNumber: varchar('room_number', { length: 64 }).notNull(),
    manufacturerAndModel: varchar('manufacturer_and_model', { length: 255 }).notNull(),
    aetitle: varchar('aetitle', { length: 64 }).notNull(),
    ipAddress: varchar('ip_address', { length: 64 }).notNull(),
    dicomPort: integer('dicom_port').notNull().default(104),
    status: varchar('status', { length: 64 }).notNull().default('AVAILABLE'),
    isAvailable: boolean('is_available').notNull().default(true),
    lastCalibrationDate: timestamp('last_calibration_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_rm_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_rm_code').on(table.tenantId, table.modalityCode)
  ]
);

export const radiologyProcedureCatalog = clinicalSchema.table(
  'radiology_procedure_catalog',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    procedureCode: varchar('procedure_code', { length: 64 }).notNull(),
    procedureName: varchar('procedure_name', { length: 255 }).notNull(),
    modalityType: varchar('modality_type', { length: 64 }).notNull(),
    bodyPart: varchar('body_part', { length: 128 }).notNull(),
    requiresContrast: boolean('requires_contrast').notNull().default(false),
    estimatedDurationMinutes: integer('estimated_duration_minutes').notNull().default(30),
    preparationInstructions: text('preparation_instructions').notNull(),
    cptCodeReference: varchar('cpt_code_reference', { length: 64 }),
    priceAmount: numeric('price_amount', { precision: 10, scale: 2 }).notNull().default('0.00'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_rpc_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_rpc_code').on(table.tenantId, table.procedureCode)
  ]
);

export const radiologyOrders = clinicalSchema.table(
  'radiology_orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    orderNumber: varchar('order_number', { length: 64 }).notNull(),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    encounterId: uuid('encounter_id').notNull(),
    orderingDoctorName: varchar('ordering_doctor_name', { length: 255 }).notNull(),
    orderingDepartment: varchar('ordering_department', { length: 255 }).notNull(),
    procedureId: varchar('procedure_id', { length: 64 }).notNull(),
    procedureName: varchar('procedure_name', { length: 255 }).notNull(),
    modalityType: varchar('modality_type', { length: 64 }).notNull(),
    priority: varchar('priority', { length: 64 }).notNull().default('ROUTINE_ELECTIVE'),
    clinicalIndication: text('clinical_indication').notNull(),
    requiresContrast: boolean('requires_contrast').notNull().default(false),
    pregnancyScreeningResult: varchar('pregnancy_screening_result', { length: 64 }),
    renalEgfrResult: varchar('renal_egfr_result', { length: 64 }),
    knownAllergies: text('known_allergies'),
    status: varchar('status', { length: 64 }).notNull().default('ORDERED'),
    scheduledTime: timestamp('scheduled_time', { withTimezone: true }),
    orderedAt: timestamp('ordered_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_ro_tenant_patient').on(table.tenantId, table.patientId),
    uniqueIndex('idx_ro_number').on(table.tenantId, table.orderNumber)
  ]
);

export const radiologyAppointments = clinicalSchema.table(
  'radiology_appointments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    appointmentCode: varchar('appointment_code', { length: 64 }).notNull(),
    orderId: uuid('order_id').notNull().references(() => radiologyOrders.id, { onDelete: 'cascade' }),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    modalityId: uuid('modality_id').notNull().references(() => radiologyModalities.id, { onDelete: 'cascade' }),
    modalityName: varchar('modality_name', { length: 255 }).notNull(),
    roomNumber: varchar('room_number', { length: 64 }).notNull(),
    scheduledStart: timestamp('scheduled_start', { withTimezone: true }).notNull(),
    scheduledEnd: timestamp('scheduled_end', { withTimezone: true }).notNull(),
    assignedTechnologistName: varchar('assigned_technologist_name', { length: 255 }).notNull(),
    status: varchar('status', { length: 64 }).notNull().default('SCHEDULED'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_ra_tenant_modality').on(table.tenantId, table.modalityId),
    uniqueIndex('idx_ra_code').on(table.tenantId, table.appointmentCode)
  ]
);

export const radiologyPreparationRecords = clinicalSchema.table(
  'radiology_preparation_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    preparationCode: varchar('preparation_code', { length: 64 }).notNull(),
    orderId: uuid('order_id').notNull().references(() => radiologyOrders.id, { onDelete: 'cascade' }),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    fastingConfirmed: boolean('fasting_confirmed').notNull().default(false),
    mriMetalScreeningCleared: boolean('mri_metal_screening_cleared').notNull().default(true),
    pregnancyStatusConfirmedNegative: boolean('pregnancy_status_confirmed_negative').notNull().default(true),
    renalEgfrAdequate: boolean('renal_egfr_adequate').notNull().default(true),
    ivCannulaSecured: boolean('iv_cannula_secured').notNull().default(false),
    informedConsentSigned: boolean('informed_consent_signed').notNull().default(true),
    preparationNurseName: varchar('preparation_nurse_name', { length: 255 }).notNull(),
    isReadyForScan: boolean('is_ready_for_scan').notNull().default(true),
    checkedAt: timestamp('checked_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_rpr_tenant_order').on(table.tenantId, table.orderId),
    uniqueIndex('idx_rpr_code').on(table.tenantId, table.preparationCode)
  ]
);

export const radiologyStudies = clinicalSchema.table(
  'radiology_studies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    studyInstanceUid: varchar('study_instance_uid', { length: 128 }).notNull(),
    accessionNumber: varchar('accession_number', { length: 64 }).notNull(),
    orderId: uuid('order_id').notNull().references(() => radiologyOrders.id, { onDelete: 'cascade' }),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    modalityType: varchar('modality_type', { length: 64 }).notNull(),
    studyDescription: text('study_description').notNull(),
    studyDateTime: timestamp('study_date_time', { withTimezone: true }).defaultNow().notNull(),
    seriesCount: integer('series_count').notNull().default(1),
    instancesCount: integer('instances_count').notNull().default(1),
    radiationDoseDlpMgyCm: numeric('radiation_dose_dlp_mgy_cm', { precision: 8, scale: 2 }),
    contrastAdministeredMl: numeric('contrast_administered_ml', { precision: 6, scale: 1 }),
    technologistName: varchar('technologist_name', { length: 255 }).notNull(),
    pacsViewerUrl: text('pacs_viewer_url').notNull(),
    pacsSyncStatus: varchar('pacs_sync_status', { length: 64 }).notNull().default('SYNCED'),
    status: varchar('status', { length: 64 }).notNull().default('ACQUIRED'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_rs_tenant_order').on(table.tenantId, table.orderId),
    uniqueIndex('idx_rs_acc_num').on(table.tenantId, table.accessionNumber)
  ]
);

export const radiologyReports = clinicalSchema.table(
  'radiology_reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    reportNumber: varchar('report_number', { length: 64 }).notNull(),
    studyId: uuid('study_id').notNull().references(() => radiologyStudies.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id').notNull().references(() => radiologyOrders.id, { onDelete: 'cascade' }),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    modalityType: varchar('modality_type', { length: 64 }).notNull(),
    procedureName: varchar('procedure_name', { length: 255 }).notNull(),
    clinicalHistory: text('clinical_history').notNull(),
    imagingTechnique: text('imaging_technique').notNull(),
    comparisonStudyReference: text('comparison_study_reference'),
    findings: text('findings').notNull(),
    impression: text('impression').notNull(),
    recommendations: text('recommendations'),
    hasCriticalFinding: boolean('has_critical_finding').notNull().default(false),
    reportingRadiologistName: varchar('reporting_radiologist_name', { length: 255 }).notNull(),
    verifyingRadiologistName: varchar('verifying_radiologist_name', { length: 255 }),
    status: varchar('status', { length: 64 }).notNull().default('DRAFT'),
    version: integer('version').notNull().default(1),
    finalizedAt: timestamp('finalized_at', { withTimezone: true }),
    amendmentReason: text('amendment_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_rr_tenant_study').on(table.tenantId, table.studyId),
    uniqueIndex('idx_rr_number').on(table.tenantId, table.reportNumber)
  ]
);

export const radiologyCriticalFindings = clinicalSchema.table(
  'radiology_critical_findings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    alertCode: varchar('alert_code', { length: 64 }).notNull(),
    reportId: uuid('report_id').notNull().references(() => radiologyReports.id, { onDelete: 'cascade' }),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    orderingDoctorName: varchar('ordering_doctor_name', { length: 255 }).notNull(),
    orderingDepartment: varchar('ordering_department', { length: 255 }).notNull(),
    findingDescription: text('finding_description').notNull(),
    severity: varchar('severity', { length: 64 }).notNull(),
    flaggedByRadiologist: varchar('flagged_by_radiologist', { length: 255 }).notNull(),
    notifiedRecipient: varchar('notified_recipient', { length: 255 }).notNull(),
    acknowledgedBy: varchar('acknowledged_by', { length: 255 }),
    acknowledgedTimestamp: timestamp('acknowledged_timestamp', { withTimezone: true }),
    status: varchar('status', { length: 64 }).notNull().default('FLAGGED_PENDING_NOTIFICATION'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_rcf_tenant_report').on(table.tenantId, table.reportId),
    uniqueIndex('idx_rcf_code').on(table.tenantId, table.alertCode)
  ]
);

export const radiologyQualityEvents = clinicalSchema.table(
  'radiology_quality_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    eventCode: varchar('event_code', { length: 64 }).notNull(),
    studyId: uuid('study_id').notNull().references(() => radiologyStudies.id, { onDelete: 'cascade' }),
    modalityType: varchar('modality_type', { length: 64 }).notNull(),
    eventType: varchar('event_type', { length: 64 }).notNull(),
    reasonDescription: text('reason_description').notNull(),
    technologistName: varchar('technologist_name', { length: 255 }).notNull(),
    correctiveActionTaken: text('corrective_action_taken').notNull(),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_rqe_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_rqe_code').on(table.tenantId, table.eventCode)
  ]
);

export const radiologyAuditTraces = clinicalSchema.table(
  'radiology_audit_traces',
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
    index('idx_rad_at_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_rad_at_num').on(table.tenantId, table.traceNumber)
  ]
);

export type RadiologyDepartment = typeof radiologyDepartments.$inferSelect;
export type RadiologyModality = typeof radiologyModalities.$inferSelect;
export type RadiologyProcedure = typeof radiologyProcedureCatalog.$inferSelect;
export type RadiologyOrder = typeof radiologyOrders.$inferSelect;
export type RadiologyAppointment = typeof radiologyAppointments.$inferSelect;
export type RadiologyPreparationRecord = typeof radiologyPreparationRecords.$inferSelect;
export type RadiologyStudy = typeof radiologyStudies.$inferSelect;
export type RadiologyReport = typeof radiologyReports.$inferSelect;
export type RadiologyCriticalFinding = typeof radiologyCriticalFindings.$inferSelect;
export type RadiologyQualityEvent = typeof radiologyQualityEvents.$inferSelect;
export type RadiologyAuditTrace = typeof radiologyAuditTraces.$inferSelect;

/**
 * ============================================================================
 * Phase 2.18: Dietary & Kitchen Management Schema
 * ============================================================================
 */

export const dietaryDepartments = clinicalSchema.table(
  'dietary_departments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    departmentCode: varchar('department_code', { length: 64 }).notNull(),
    departmentName: varchar('department_name', { length: 255 }).notNull(),
    headOfDietetics: varchar('head_of_dietetics', { length: 255 }).notNull(),
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 64 }),
    status: varchar('status', { length: 64 }).notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_dd_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_dd_code').on(table.tenantId, table.departmentCode)
  ]
);

export const dietaryKitchens = clinicalSchema.table(
  'dietary_kitchens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    kitchenCode: varchar('kitchen_code', { length: 64 }).notNull(),
    kitchenName: varchar('kitchen_name', { length: 255 }).notNull(),
    kitchenType: varchar('kitchen_type', { length: 64 }).notNull().default('CENTRAL'),
    location: varchar('location', { length: 255 }).notNull(),
    dailyCapacity: integer('daily_capacity').notNull().default(500),
    operatingHours: varchar('operating_hours', { length: 128 }).notNull().default('05:00 - 22:00'),
    responsibleManager: varchar('responsible_manager', { length: 255 }).notNull(),
    contactPhone: varchar('contact_phone', { length: 64 }).notNull(),
    foodSafetyStatus: varchar('food_safety_status', { length: 128 }).notNull().default('COMPLIANT_HACCP'),
    status: varchar('status', { length: 64 }).notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_dk_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_dk_code').on(table.tenantId, table.kitchenCode)
  ]
);

export const dietaryDietTypes = clinicalSchema.table(
  'dietary_diet_types',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    dietCode: varchar('diet_code', { length: 64 }).notNull(),
    dietName: varchar('diet_name', { length: 255 }).notNull(),
    category: varchar('category', { length: 64 }).notNull(),
    clinicalPurpose: text('clinical_purpose').notNull(),
    allowedFoods: text('allowed_foods').notNull(),
    restrictedFoods: text('restricted_foods').notNull(),
    allergensToAvoid: jsonb('allergens_to_avoid').notNull().default([]),
    targetCalories: integer('target_calories').notNull().default(2000),
    targetProteinGrams: numeric('target_protein_grams', { precision: 8, scale: 2 }).notNull().default('70.00'),
    targetCarbsGrams: numeric('target_carbs_grams', { precision: 8, scale: 2 }).notNull().default('250.00'),
    targetFatGrams: numeric('target_fat_grams', { precision: 8, scale: 2 }).notNull().default('60.00'),
    sodiumRestrictedMg: numeric('sodium_restricted_mg', { precision: 8, scale: 2 }),
    fluidRestrictedMl: numeric('fluid_restricted_ml', { precision: 8, scale: 2 }),
    texture: varchar('texture', { length: 64 }).notNull().default('REGULAR'),
    mealFrequencyPerDay: integer('meal_frequency_per_day').notNull().default(4),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_ddt_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_ddt_code').on(table.tenantId, table.dietCode)
  ]
);

export const dietaryFoodItems = clinicalSchema.table(
  'dietary_food_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    itemCode: varchar('item_code', { length: 64 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    category: varchar('category', { length: 64 }).notNull(),
    unit: varchar('unit', { length: 32 }).notNull().default('SERVING'),
    caloriesPerUnit: numeric('calories_per_unit', { precision: 8, scale: 2 }).notNull().default('150.00'),
    proteinPerUnit: numeric('protein_per_unit', { precision: 8, scale: 2 }).notNull().default('5.00'),
    carbsPerUnit: numeric('carbs_per_unit', { precision: 8, scale: 2 }).notNull().default('20.00'),
    fatPerUnit: numeric('fat_per_unit', { precision: 8, scale: 2 }).notNull().default('3.00'),
    allergens: jsonb('allergens').notNull().default([]),
    storageType: varchar('storage_type', { length: 64 }).notNull().default('DRY'),
    procurementRefId: varchar('procurement_ref_id', { length: 64 }),
    estimatedUnitCost: numeric('estimated_unit_cost', { precision: 10, scale: 2 }).notNull().default('50.00'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_dfi_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_dfi_code').on(table.tenantId, table.itemCode)
  ]
);

export const dietaryAssessments = clinicalSchema.table(
  'dietary_assessments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    assessmentNumber: varchar('assessment_number', { length: 64 }).notNull(),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    admissionId: varchar('admission_id', { length: 64 }),
    wardName: varchar('ward_name', { length: 128 }).notNull(),
    roomBedNumber: varchar('room_bed_number', { length: 64 }).notNull(),
    attendingDoctor: varchar('attending_doctor', { length: 255 }).notNull(),
    dietitianName: varchar('dietitian_name', { length: 255 }).notNull(),
    assessmentDate: varchar('assessment_date', { length: 32 }).notNull(),
    weightKg: numeric('weight_kg', { precision: 6, scale: 2 }).notNull(),
    heightCm: numeric('height_cm', { precision: 6, scale: 2 }).notNull(),
    bmi: numeric('bmi', { precision: 6, scale: 2 }).notNull(),
    nutritionalRiskScore: varchar('nutritional_risk_score', { length: 64 }).notNull(),
    clinicalCondition: text('clinical_condition').notNull(),
    foodAllergies: jsonb('food_allergies').notNull().default([]),
    foodIntolerances: jsonb('food_intolerances').notNull().default([]),
    culturalReligiousPreferences: varchar('cultural_religious_preferences', { length: 255 }),
    swallowingDifficulty: boolean('swallowing_difficulty').notNull().default(false),
    feedingRoute: varchar('feeding_route', { length: 64 }).notNull().default('ORAL'),
    fluidRestrictionMl: numeric('fluid_restriction_ml', { precision: 8, scale: 2 }),
    specialInstructions: text('special_instructions'),
    status: varchar('status', { length: 64 }).notNull().default('COMPLETED'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_da_tenant_patient').on(table.tenantId, table.patientId),
    uniqueIndex('idx_da_num').on(table.tenantId, table.assessmentNumber)
  ]
);

export const dietaryOrders = clinicalSchema.table(
  'dietary_orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    orderNumber: varchar('order_number', { length: 64 }).notNull(),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    admissionId: varchar('admission_id', { length: 64 }),
    wardName: varchar('ward_name', { length: 128 }).notNull(),
    roomBedNumber: varchar('room_bed_number', { length: 64 }).notNull(),
    dietTypeId: uuid('diet_type_id').notNull().references(() => dietaryDietTypes.id, { onDelete: 'cascade' }),
    dietTypeName: varchar('diet_type_name', { length: 255 }).notNull(),
    dietCategory: varchar('diet_category', { length: 64 }).notNull(),
    mealFrequency: varchar('meal_frequency', { length: 64 }).notNull().default('4 Meals / Day'),
    startDate: varchar('start_date', { length: 32 }).notNull(),
    endDate: varchar('end_date', { length: 32 }),
    fluidRestrictionMl: numeric('fluid_restriction_ml', { precision: 8, scale: 2 }),
    texture: varchar('texture', { length: 64 }).notNull().default('REGULAR'),
    feedingRoute: varchar('feeding_route', { length: 64 }).notNull().default('ORAL'),
    priority: varchar('priority', { length: 64 }).notNull().default('ROUTINE'),
    isNpo: boolean('is_npo').notNull().default(false),
    specialInstructions: text('special_instructions'),
    allergyWarnings: jsonb('allergy_warnings').notNull().default([]),
    orderingDoctor: varchar('ordering_doctor', { length: 255 }).notNull(),
    reviewedByDietitian: varchar('reviewed_by_dietitian', { length: 255 }),
    status: varchar('status', { length: 64 }).notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_do_tenant_patient').on(table.tenantId, table.patientId),
    uniqueIndex('idx_do_num').on(table.tenantId, table.orderNumber)
  ]
);

export const dietaryDietPlans = clinicalSchema.table(
  'dietary_diet_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    planCode: varchar('plan_code', { length: 64 }).notNull(),
    orderId: uuid('order_id').notNull().references(() => dietaryOrders.id, { onDelete: 'cascade' }),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    wardBed: varchar('ward_bed', { length: 128 }).notNull(),
    planDate: varchar('plan_date', { length: 32 }).notNull(),
    dietTypeName: varchar('diet_type_name', { length: 255 }).notNull(),
    breakfastItems: text('breakfast_items').notNull(),
    midMorningItems: text('mid_morning_items'),
    lunchItems: text('lunch_items').notNull(),
    eveningSnackItems: text('evening_snack_items'),
    dinnerItems: text('dinner_items').notNull(),
    bedtimeSnackItems: text('bedtime_snack_items'),
    totalEstimatedCalories: integer('total_estimated_calories').notNull().default(2000),
    totalEstimatedProtein: numeric('total_estimated_protein', { precision: 8, scale: 2 }).notNull().default('75.00'),
    specialPrepNotes: text('special_prep_notes'),
    status: varchar('status', { length: 64 }).notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_ddp_tenant_order').on(table.tenantId, table.orderId),
    uniqueIndex('idx_ddp_code').on(table.tenantId, table.planCode)
  ]
);

export const dietaryMenuTemplates = clinicalSchema.table(
  'dietary_menu_templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    templateCode: varchar('template_code', { length: 64 }).notNull(),
    templateName: varchar('template_name', { length: 255 }).notNull(),
    dietCategory: varchar('diet_category', { length: 64 }).notNull(),
    mealSlot: varchar('meal_slot', { length: 64 }).notNull(),
    menuItemsDescription: text('menu_items_description').notNull(),
    ingredientList: jsonb('ingredient_list').notNull().default([]),
    portionSize: varchar('portion_size', { length: 64 }).notNull().default('1 Portion'),
    estimatedCalories: integer('estimated_calories').notNull().default(500),
    estimatedCost: numeric('estimated_cost', { precision: 10, scale: 2 }).notNull().default('120.00'),
    kitchenId: uuid('kitchen_id').notNull().references(() => dietaryKitchens.id, { onDelete: 'cascade' }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_dmt_tenant_kitchen').on(table.tenantId, table.kitchenId),
    uniqueIndex('idx_dmt_code').on(table.tenantId, table.templateCode)
  ]
);

export const dietaryMealSchedules = clinicalSchema.table(
  'dietary_meal_schedules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    scheduleCode: varchar('schedule_code', { length: 64 }).notNull(),
    orderId: uuid('order_id').notNull().references(() => dietaryOrders.id, { onDelete: 'cascade' }),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    wardName: varchar('ward_name', { length: 128 }).notNull(),
    roomBedNumber: varchar('room_bed_number', { length: 64 }).notNull(),
    mealDate: varchar('meal_date', { length: 32 }).notNull(),
    mealSlot: varchar('meal_slot', { length: 64 }).notNull(),
    dietTypeName: varchar('diet_type_name', { length: 255 }).notNull(),
    itemsToServe: text('items_to_serve').notNull(),
    scheduledDispatchTime: varchar('scheduled_dispatch_time', { length: 32 }).notNull(),
    status: varchar('status', { length: 64 }).notNull().default('SCHEDULED'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_dms_tenant_order').on(table.tenantId, table.orderId),
    uniqueIndex('idx_dms_code').on(table.tenantId, table.scheduleCode)
  ]
);

export const dietaryProductionPlans = clinicalSchema.table(
  'dietary_production_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    planNumber: varchar('plan_number', { length: 64 }).notNull(),
    kitchenId: uuid('kitchen_id').notNull().references(() => dietaryKitchens.id, { onDelete: 'cascade' }),
    kitchenName: varchar('kitchen_name', { length: 255 }).notNull(),
    productionDate: varchar('production_date', { length: 32 }).notNull(),
    mealSlot: varchar('meal_slot', { length: 64 }).notNull(),
    totalPatientsCount: integer('total_patients_count').notNull().default(0),
    regularMealsCount: integer('regular_meals_count').notNull().default(0),
    therapeuticMealsCount: integer('therapeutic_meals_count').notNull().default(0),
    npoCount: integer('npo_count').notNull().default(0),
    specialAllergyCount: integer('special_allergy_count').notNull().default(0),
    status: varchar('status', { length: 64 }).notNull().default('PLANNED'),
    releasedBy: varchar('released_by', { length: 255 }),
    releasedAt: varchar('released_at', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_dpp_tenant_kitchen').on(table.tenantId, table.kitchenId),
    uniqueIndex('idx_dpp_num').on(table.tenantId, table.planNumber)
  ]
);

export const dietaryPreparationRecords = clinicalSchema.table(
  'dietary_preparation_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    batchNumber: varchar('batch_number', { length: 64 }).notNull(),
    productionPlanId: uuid('production_plan_id').notNull().references(() => dietaryProductionPlans.id, { onDelete: 'cascade' }),
    dietCategory: varchar('diet_category', { length: 64 }).notNull(),
    foodItemName: varchar('food_item_name', { length: 255 }).notNull(),
    quantityPrepared: numeric('quantity_prepared', { precision: 8, scale: 2 }).notNull(),
    unit: varchar('unit', { length: 32 }).notNull().default('SERVINGS'),
    headChef: varchar('head_chef', { length: 255 }).notNull(),
    cookingTemperatureC: numeric('cooking_temperature_c', { precision: 5, scale: 1 }),
    holdingTemperatureC: numeric('holding_temperature_c', { precision: 5, scale: 1 }),
    startTime: varchar('start_time', { length: 32 }).notNull(),
    completionTime: varchar('completion_time', { length: 32 }),
    status: varchar('status', { length: 64 }).notNull().default('PREPARED'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_dpr_tenant_prod').on(table.tenantId, table.productionPlanId),
    uniqueIndex('idx_dpr_batch').on(table.tenantId, table.batchNumber)
  ]
);

export const dietaryQualityChecks = clinicalSchema.table(
  'dietary_quality_checks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    checkCode: varchar('check_code', { length: 64 }).notNull(),
    batchNumber: varchar('batch_number', { length: 64 }).notNull(),
    kitchenName: varchar('kitchen_name', { length: 255 }).notNull(),
    hygieneCheckPassed: boolean('hygiene_check_passed').notNull().default(true),
    temperatureCheckPassed: boolean('temperature_check_passed').notNull().default(true),
    holdingTempC: numeric('holding_temp_c', { precision: 5, scale: 1 }).notNull().default('65.0'),
    allergenSegregationPassed: boolean('allergen_segregation_passed').notNull().default(true),
    packagingIntegrityPassed: boolean('packaging_integrity_passed').notNull().default(true),
    inspectorName: varchar('inspector_name', { length: 255 }).notNull(),
    inspectorRole: varchar('inspector_role', { length: 64 }).notNull().default('FOOD_SAFETY_OFFICER'),
    qualityStatus: varchar('quality_status', { length: 64 }).notNull().default('PASSED'),
    notes: text('notes'),
    inspectedAt: varchar('inspected_at', { length: 64 }).notNull()
  },
  (table) => [
    index('idx_dqc_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_dqc_code').on(table.tenantId, table.checkCode)
  ]
);

export const dietaryTrayAssemblies = clinicalSchema.table(
  'dietary_tray_assemblies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    trayBarcode: varchar('tray_barcode', { length: 64 }).notNull(),
    orderId: uuid('order_id').notNull().references(() => dietaryOrders.id, { onDelete: 'cascade' }),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    wardName: varchar('ward_name', { length: 128 }).notNull(),
    roomBedNumber: varchar('room_bed_number', { length: 64 }).notNull(),
    mealSlot: varchar('meal_slot', { length: 64 }).notNull(),
    dietTypeName: varchar('diet_type_name', { length: 255 }).notNull(),
    itemsIncluded: text('items_included').notNull(),
    allergyNotice: text('allergy_notice'),
    assembledByStaff: varchar('assembled_by_staff', { length: 255 }).notNull(),
    isVerified: boolean('is_verified').notNull().default(true),
    verifiedBy: varchar('verified_by', { length: 255 }),
    assemblyTime: varchar('assembly_time', { length: 64 }).notNull(),
    status: varchar('status', { length: 64 }).notNull().default('VERIFIED')
  },
  (table) => [
    index('idx_dta_tenant_order').on(table.tenantId, table.orderId),
    uniqueIndex('idx_dta_barcode').on(table.tenantId, table.trayBarcode)
  ]
);

export const dietaryMealDispatches = clinicalSchema.table(
  'dietary_meal_dispatches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    dispatchCode: varchar('dispatch_code', { length: 64 }).notNull(),
    trayBarcode: varchar('tray_barcode', { length: 64 }).notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    wardName: varchar('ward_name', { length: 128 }).notNull(),
    roomBedNumber: varchar('room_bed_number', { length: 64 }).notNull(),
    mealSlot: varchar('meal_slot', { length: 64 }).notNull(),
    dietTypeName: varchar('diet_type_name', { length: 255 }).notNull(),
    deliveryPersonName: varchar('delivery_person_name', { length: 255 }).notNull(),
    dispatchedAt: varchar('dispatched_at', { length: 64 }).notNull(),
    deliveredAt: varchar('delivered_at', { length: 64 }),
    receivedBy: varchar('received_by', { length: 255 }),
    deliveryStatus: varchar('delivery_status', { length: 64 }).notNull().default('DISPATCHED'),
    exceptionReason: text('exception_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_dmd_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_dmd_code').on(table.tenantId, table.dispatchCode)
  ]
);

export const dietarySafetyAlerts = clinicalSchema.table(
  'dietary_safety_alerts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    alertCode: varchar('alert_code', { length: 64 }).notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    wardBed: varchar('ward_bed', { length: 128 }).notNull(),
    alertType: varchar('alert_type', { length: 64 }).notNull(),
    severity: varchar('severity', { length: 64 }).notNull().default('HIGH'),
    description: text('description').notNull(),
    isResolved: boolean('is_resolved').notNull().default(false),
    resolvedBy: varchar('resolved_by', { length: 255 }),
    resolvedAt: varchar('resolved_at', { length: 64 }),
    resolutionNotes: text('resolution_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_dsa_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_dsa_code').on(table.tenantId, table.alertCode)
  ]
);

export const dietaryWasteRecords = clinicalSchema.table(
  'dietary_waste_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    wasteCode: varchar('waste_code', { length: 64 }).notNull(),
    kitchenName: varchar('kitchen_name', { length: 255 }).notNull(),
    mealDate: varchar('meal_date', { length: 32 }).notNull(),
    mealSlot: varchar('meal_slot', { length: 64 }).notNull(),
    preparedQuantity: numeric('prepared_quantity', { precision: 8, scale: 2 }).notNull(),
    servedQuantity: numeric('served_quantity', { precision: 8, scale: 2 }).notNull(),
    wastedQuantity: numeric('wasted_quantity', { precision: 8, scale: 2 }).notNull(),
    unit: varchar('unit', { length: 32 }).notNull().default('KG'),
    reason: varchar('reason', { length: 64 }).notNull().default('OVERPRODUCTION'),
    estimatedCostLoss: numeric('estimated_cost_loss', { precision: 10, scale: 2 }).notNull().default('0.00'),
    reportedBy: varchar('reported_by', { length: 255 }).notNull(),
    recordedAt: varchar('recorded_at', { length: 64 }).notNull()
  },
  (table) => [
    index('idx_dwr_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_dwr_code').on(table.tenantId, table.wasteCode)
  ]
);

export const dietaryCostRecords = clinicalSchema.table(
  'dietary_cost_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    costCode: varchar('cost_code', { length: 64 }).notNull(),
    recordDate: varchar('record_date', { length: 32 }).notNull(),
    wardName: varchar('ward_name', { length: 128 }).notNull(),
    dietCategory: varchar('diet_category', { length: 64 }).notNull(),
    totalMealsServed: integer('total_meals_served').notNull().default(0),
    ingredientCostTotal: numeric('ingredient_cost_total', { precision: 10, scale: 2 }).notNull().default('0.00'),
    laborCostEstimate: numeric('labor_cost_estimate', { precision: 10, scale: 2 }).notNull().default('0.00'),
    wasteCostTotal: numeric('waste_cost_total', { precision: 10, scale: 2 }).notNull().default('0.00'),
    costPerMealAverage: numeric('cost_per_meal_average', { precision: 10, scale: 2 }).notNull().default('0.00'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_dcr_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_dcr_code').on(table.tenantId, table.costCode)
  ]
);

export const dietaryProcurementReferences = clinicalSchema.table(
  'dietary_procurement_references',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    requisitionRefNumber: varchar('requisition_ref_number', { length: 64 }).notNull(),
    ingredientName: varchar('ingredient_name', { length: 255 }).notNull(),
    quantityRequested: numeric('quantity_requested', { precision: 8, scale: 2 }).notNull(),
    unit: varchar('unit', { length: 32 }).notNull().default('KG'),
    urgency: varchar('urgency', { length: 64 }).notNull().default('ROUTINE'),
    vendorRef: varchar('vendor_ref', { length: 255 }),
    status: varchar('status', { length: 64 }).notNull().default('SUGGESTED'),
    requestedBy: varchar('requested_by', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_dpr_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_dpr_req').on(table.tenantId, table.requisitionRefNumber)
  ]
);

export const dietaryBillingReferences = clinicalSchema.table(
  'dietary_billing_references',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    chargeCode: varchar('charge_code', { length: 64 }).notNull(),
    patientId: uuid('patient_id').notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    dietTypeName: varchar('diet_type_name', { length: 255 }).notNull(),
    chargeCategory: varchar('charge_category', { length: 64 }).notNull(),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull().default('0.00'),
    billingStatus: varchar('billing_status', { length: 64 }).notNull().default('PENDING'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_dbr_tenant_patient').on(table.tenantId, table.patientId),
    uniqueIndex('idx_dbr_charge').on(table.tenantId, table.chargeCode)
  ]
);

export const dietaryAuditTraces = clinicalSchema.table(
  'dietary_audit_traces',
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
    index('idx_dat_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_dat_num').on(table.tenantId, table.traceNumber)
  ]
);

export type DietaryDepartment = typeof dietaryDepartments.$inferSelect;
export type DietaryKitchen = typeof dietaryKitchens.$inferSelect;
export type DietaryDietType = typeof dietaryDietTypes.$inferSelect;
export type DietaryFoodItem = typeof dietaryFoodItems.$inferSelect;
export type DietaryAssessment = typeof dietaryAssessments.$inferSelect;
export type DietaryOrder = typeof dietaryOrders.$inferSelect;
export type DietaryDietPlan = typeof dietaryDietPlans.$inferSelect;
export type DietaryMenuTemplate = typeof dietaryMenuTemplates.$inferSelect;
export type DietaryMealSchedule = typeof dietaryMealSchedules.$inferSelect;
export type DietaryProductionPlan = typeof dietaryProductionPlans.$inferSelect;
export type DietaryPreparationRecord = typeof dietaryPreparationRecords.$inferSelect;
export type DietaryQualityCheck = typeof dietaryQualityChecks.$inferSelect;
export type DietaryTrayAssembly = typeof dietaryTrayAssemblies.$inferSelect;
export type DietaryMealDispatch = typeof dietaryMealDispatches.$inferSelect;
export type DietarySafetyAlert = typeof dietarySafetyAlerts.$inferSelect;
export type DietaryWasteRecord = typeof dietaryWasteRecords.$inferSelect;
export type DietaryCostRecord = typeof dietaryCostRecords.$inferSelect;
export type DietaryProcurementReference = typeof dietaryProcurementReferences.$inferSelect;
export type DietaryBillingReference = typeof dietaryBillingReferences.$inferSelect;
export type DietaryAuditTrace = typeof dietaryAuditTraces.$inferSelect;

// ============================================================================

// ============================================================================
// Phase 2.19: Hospital Asset & Biomedical Equipment Maintenance (HTM)
// ============================================================================

export const biomedicalAssets = clinicalSchema.table(
  'biomedical_assets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    assetCode: varchar('asset_code', { length: 64 }).notNull(),
    assetName: varchar('asset_name', { length: 255 }).notNull(),
    modelNumber: varchar('model_number', { length: 128 }).notNull(),
    serialNumber: varchar('serial_number', { length: 128 }).notNull(),
    manufacturer: varchar('manufacturer', { length: 128 }).notNull(),
    category: varchar('category', { length: 64 }).notNull(),
    riskCriticality: varchar('risk_criticality', { length: 64 }).notNull(),
    operationalStatus: varchar('operational_status', { length: 64 }).notNull().default('IN_SERVICE'),
    departmentName: varchar('department_name', { length: 128 }).notNull(),
    physicalLocation: varchar('physical_location', { length: 255 }).notNull(),
    installationDate: varchar('installation_date', { length: 32 }).notNull(),
    purchaseDate: varchar('purchase_date', { length: 32 }).notNull(),
    purchaseCost: numeric('purchase_cost', { precision: 12, scale: 2 }).notNull(),
    currentValue: numeric('current_value', { precision: 12, scale: 2 }).notNull(),
    warrantyExpiryDate: varchar('warranty_expiry_date', { length: 32 }),
    contractType: varchar('contract_type', { length: 64 }).notNull().default('WARRANTY_OEM'),
    contractVendorName: varchar('contract_vendor_name', { length: 255 }).notNull(),
    contractExpiryDate: varchar('contract_expiry_date', { length: 32 }),
    ppmFrequency: varchar('ppm_frequency', { length: 64 }).notNull().default('QUARTERLY'),
    lastPpmDate: varchar('last_ppm_date', { length: 32 }),
    nextPpmDueDate: varchar('next_ppm_due_date', { length: 32 }).notNull(),
    calibrationFrequencyMonths: integer('calibration_frequency_months').notNull().default(12),
    lastCalibrationDate: varchar('last_calibration_date', { length: 32 }),
    nextCalibrationDueDate: varchar('next_calibration_due_date', { length: 32 }).notNull(),
    calibrationStatus: varchar('calibration_status', { length: 64 }).notNull().default('CALIBRATED_PASS'),
    electricalSafetyCertified: boolean('electrical_safety_certified').notNull().default(true),
    qrCodeIdentifier: varchar('qr_code_identifier', { length: 128 }).notNull(),
    responsibleBiomedicalEngineer: varchar('responsible_biomedical_engineer', { length: 128 }).notNull(),
    uptimePercentage: numeric('uptime_percentage', { precision: 5, scale: 2 }).notNull().default('99.50'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bma_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_bma_code').on(table.tenantId, table.assetCode)
  ]
);

export const biomedicalAssetTransfers = clinicalSchema.table(
  'biomedical_asset_transfers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    assetId: uuid('asset_id').notNull(),
    assetCode: varchar('asset_code', { length: 64 }).notNull(),
    assetName: varchar('asset_name', { length: 255 }).notNull(),
    fromDepartment: varchar('from_department', { length: 128 }).notNull(),
    fromLocation: varchar('from_location', { length: 255 }).notNull(),
    toDepartment: varchar('to_department', { length: 128 }).notNull(),
    toLocation: varchar('to_location', { length: 255 }).notNull(),
    transferReason: text('transfer_reason').notNull(),
    initiatedBy: varchar('initiated_by', { length: 128 }).notNull(),
    approvedBy: varchar('approved_by', { length: 128 }).notNull(),
    transferDate: varchar('transfer_date', { length: 32 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('COMPLETED'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bat_tenant_asset').on(table.tenantId, table.assetId)
  ]
);

export const biomedicalPpmSchedules = clinicalSchema.table(
  'biomedical_ppm_schedules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    scheduleCode: varchar('schedule_code', { length: 64 }).notNull(),
    assetId: uuid('asset_id').notNull(),
    assetCode: varchar('asset_code', { length: 64 }).notNull(),
    assetName: varchar('asset_name', { length: 255 }).notNull(),
    departmentName: varchar('department_name', { length: 128 }).notNull(),
    frequency: varchar('frequency', { length: 64 }).notNull(),
    scheduledDueDate: varchar('scheduled_due_date', { length: 32 }).notNull(),
    assignedEngineer: varchar('assigned_engineer', { length: 128 }).notNull(),
    tasksChecklist: jsonb('tasks_checklist').notNull().$type<string[]>(),
    status: varchar('status', { length: 64 }).notNull().default('SCHEDULED'),
    completedDate: varchar('completed_date', { length: 32 }),
    servicingNotes: text('servicing_notes'),
    partsReplaced: jsonb('parts_replaced').$type<string[]>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bps_tenant_asset').on(table.tenantId, table.assetId),
    uniqueIndex('idx_bps_code').on(table.tenantId, table.scheduleCode)
  ]
);

export const biomedicalWorkOrders = clinicalSchema.table(
  'biomedical_work_orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    workOrderNumber: varchar('work_order_number', { length: 64 }).notNull(),
    assetId: uuid('asset_id').notNull(),
    assetCode: varchar('asset_code', { length: 64 }).notNull(),
    assetName: varchar('asset_name', { length: 255 }).notNull(),
    departmentName: varchar('department_name', { length: 128 }).notNull(),
    roomBedLocation: varchar('room_bed_location', { length: 255 }).notNull(),
    reportedByClinician: varchar('reported_by_clinician', { length: 128 }).notNull(),
    reportedTime: timestamp('reported_time', { withTimezone: true }).notNull(),
    problemDescription: text('problem_description').notNull(),
    priority: varchar('priority', { length: 64 }).notNull().default('ROUTINE'),
    status: varchar('status', { length: 64 }).notNull().default('OPEN_REPORTED'),
    assignedEngineer: varchar('assigned_engineer', { length: 128 }),
    assignedTime: timestamp('assigned_time', { withTimezone: true }),
    clinicalImpactLevel: varchar('clinical_impact_level', { length: 64 }).notNull(),
    rootCauseAnalysis: text('root_cause_analysis'),
    correctiveActionTaken: text('corrective_action_taken'),
    sparePartsCost: numeric('spare_parts_cost', { precision: 10, scale: 2 }).notNull().default('0'),
    laborHours: numeric('labor_hours', { precision: 5, scale: 2 }).notNull().default('0'),
    downtimeHours: numeric('downtime_hours', { precision: 6, scale: 2 }).notNull().default('0'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    verifiedByClinicianName: varchar('verified_by_clinician_name', { length: 128 }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bwo_tenant_asset').on(table.tenantId, table.assetId),
    uniqueIndex('idx_bwo_num').on(table.tenantId, table.workOrderNumber)
  ]
);

export const biomedicalCalibrationRecords = clinicalSchema.table(
  'biomedical_calibration_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    certificateNumber: varchar('certificate_number', { length: 64 }).notNull(),
    assetId: uuid('asset_id').notNull(),
    assetCode: varchar('asset_code', { length: 64 }).notNull(),
    assetName: varchar('asset_name', { length: 255 }).notNull(),
    calibrationDate: varchar('calibration_date', { length: 32 }).notNull(),
    validUntilDate: varchar('valid_until_date', { length: 32 }).notNull(),
    calibratedByAgency: varchar('calibrated_by_agency', { length: 128 }).notNull(),
    leadMetrologistName: varchar('lead_metrologist_name', { length: 128 }).notNull(),
    traceableStandardsUsed: text('traceable_standards_used').notNull(),
    tolerancesObserved: text('tolerances_observed').notNull(),
    status: varchar('status', { length: 64 }).notNull().default('CALIBRATED_PASS'),
    safetyTestPassed: boolean('safety_test_passed').notNull().default(true),
    certificateUrl: varchar('certificate_url', { length: 512 }),
    remarks: text('remarks').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bcr_tenant_asset').on(table.tenantId, table.assetId),
    uniqueIndex('idx_bcr_cert').on(table.tenantId, table.certificateNumber)
  ]
);

export const biomedicalSafetyTestRecords = clinicalSchema.table(
  'biomedical_safety_test_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    testCode: varchar('test_code', { length: 64 }).notNull(),
    assetId: uuid('asset_id').notNull(),
    assetCode: varchar('asset_code', { length: 64 }).notNull(),
    assetName: varchar('asset_name', { length: 255 }).notNull(),
    testType: varchar('test_type', { length: 64 }).notNull(),
    testStandard: varchar('test_standard', { length: 64 }).notNull(),
    earthResistanceOhms: numeric('earth_resistance_ohms', { precision: 6, scale: 3 }),
    chassisLeakageMicroAmps: numeric('chassis_leakage_micro_amps', { precision: 8, scale: 2 }),
    patientLeakageMicroAmps: numeric('patient_leakage_micro_amps', { precision: 8, scale: 2 }),
    insulationResistanceMOhm: numeric('insulation_resistance_m_ohm', { precision: 8, scale: 2 }),
    testedByEngineer: varchar('tested_by_engineer', { length: 128 }).notNull(),
    testDate: varchar('test_date', { length: 32 }).notNull(),
    testPassed: boolean('test_passed').notNull().default(true),
    remarks: text('remarks').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bstr_tenant_asset').on(table.tenantId, table.assetId),
    uniqueIndex('idx_bstr_code').on(table.tenantId, table.testCode)
  ]
);

export const biomedicalSpareParts = clinicalSchema.table(
  'biomedical_spare_parts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    partCode: varchar('part_code', { length: 64 }).notNull(),
    partName: varchar('part_name', { length: 255 }).notNull(),
    compatibleModels: jsonb('compatible_models').notNull().$type<string[]>(),
    manufacturer: varchar('manufacturer', { length: 128 }).notNull(),
    quantityOnHand: integer('quantity_on_hand').notNull().default(0),
    minimumThresholdQuantity: integer('minimum_threshold_quantity').notNull().default(2),
    unitCost: numeric('unit_cost', { precision: 10, scale: 2 }).notNull(),
    storageBinLocation: varchar('storage_bin_location', { length: 64 }).notNull(),
    isCriticalSpare: boolean('is_critical_spare').notNull().default(false),
    leadTimeDays: integer('lead_time_days').notNull().default(7),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bsp_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_bsp_code').on(table.tenantId, table.partCode)
  ]
);

export const biomedicalSparePartUsages = clinicalSchema.table(
  'biomedical_spare_part_usages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    usageCode: varchar('usage_code', { length: 64 }).notNull(),
    workOrderId: uuid('work_order_id'),
    assetId: uuid('asset_id').notNull(),
    assetCode: varchar('asset_code', { length: 64 }).notNull(),
    partId: uuid('part_id').notNull(),
    partCode: varchar('part_code', { length: 64 }).notNull(),
    partName: varchar('part_name', { length: 255 }).notNull(),
    quantityUsed: integer('quantity_used').notNull(),
    unitCost: numeric('unit_cost', { precision: 10, scale: 2 }).notNull(),
    totalCost: numeric('total_cost', { precision: 10, scale: 2 }).notNull(),
    usedByEngineer: varchar('used_by_engineer', { length: 128 }).notNull(),
    usageDate: varchar('usage_date', { length: 32 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bspu_tenant_asset').on(table.tenantId, table.assetId),
    uniqueIndex('idx_bspu_code').on(table.tenantId, table.usageCode)
  ]
);

export const biomedicalVendorVisits = clinicalSchema.table(
  'biomedical_vendor_visits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    visitCode: varchar('visit_code', { length: 64 }).notNull(),
    assetId: uuid('asset_id').notNull(),
    assetCode: varchar('asset_code', { length: 64 }).notNull(),
    assetName: varchar('asset_name', { length: 255 }).notNull(),
    vendorName: varchar('vendor_name', { length: 255 }).notNull(),
    serviceEngineerName: varchar('service_engineer_name', { length: 128 }).notNull(),
    contactPhone: varchar('contact_phone', { length: 32 }).notNull(),
    visitType: varchar('visit_type', { length: 64 }).notNull(),
    visitDate: varchar('visit_date', { length: 32 }).notNull(),
    serviceReportNumber: varchar('service_report_number', { length: 64 }).notNull(),
    serviceSummary: text('service_summary').notNull(),
    serviceCost: numeric('service_cost', { precision: 10, scale: 2 }).notNull().default('0'),
    vendorPerformanceRating: integer('vendor_performance_rating').notNull().default(5),
    hospitalSupervisorName: varchar('hospital_supervisor_name', { length: 128 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bvv_tenant_asset').on(table.tenantId, table.assetId),
    uniqueIndex('idx_bvv_code').on(table.tenantId, table.visitCode)
  ]
);

export const biomedicalCondemnations = clinicalSchema.table(
  'biomedical_condemnations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    condemnationCode: varchar('condemnation_code', { length: 64 }).notNull(),
    assetId: uuid('asset_id').notNull(),
    assetCode: varchar('asset_code', { length: 64 }).notNull(),
    assetName: varchar('asset_name', { length: 255 }).notNull(),
    departmentName: varchar('department_name', { length: 128 }).notNull(),
    purchaseYear: varchar('purchase_year', { length: 16 }).notNull(),
    cumulativeMaintenanceCost: numeric('cumulative_maintenance_cost', { precision: 12, scale: 2 }).notNull(),
    reasonForCondemnation: text('reason_for_condemnation').notNull(),
    condemnationBoardChairman: varchar('condemnation_board_chairman', { length: 128 }).notNull(),
    estimatedScrapValue: numeric('estimated_scrap_value', { precision: 10, scale: 2 }).notNull(),
    hazardousDisposalProtocol: text('hazardous_disposal_protocol'),
    status: varchar('status', { length: 64 }).notNull().default('PROPOSED'),
    approvedDate: varchar('approved_date', { length: 32 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bmc_tenant_asset').on(table.tenantId, table.assetId),
    uniqueIndex('idx_bmc_code').on(table.tenantId, table.condemnationCode)
  ]
);

export const biomedicalIncidents = clinicalSchema.table(
  'biomedical_incidents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    incidentCode: varchar('incident_code', { length: 64 }).notNull(),
    assetId: uuid('asset_id').notNull(),
    assetCode: varchar('asset_code', { length: 64 }).notNull(),
    assetName: varchar('asset_name', { length: 255 }).notNull(),
    departmentName: varchar('department_name', { length: 128 }).notNull(),
    incidentDateTime: timestamp('incident_date_time', { withTimezone: true }).notNull(),
    severity: varchar('severity', { length: 64 }).notNull(),
    patientInvolved: boolean('patient_involved').notNull().default(false),
    patientMrn: varchar('patient_mrn', { length: 64 }),
    incidentSummary: text('incident_summary').notNull(),
    initialActionTaken: text('initial_action_taken').notNull(),
    investigatingOfficer: varchar('investigating_officer', { length: 128 }).notNull(),
    rootCause: text('root_cause'),
    capaActionPlan: text('capa_action_plan'),
    isResolved: boolean('is_resolved').notNull().default(false),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bmi_tenant_asset').on(table.tenantId, table.assetId),
    uniqueIndex('idx_bmi_code').on(table.tenantId, table.incidentCode)
  ]
);

export const biomedicalProcurementReferences = clinicalSchema.table(
  'biomedical_procurement_references',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    requisitionRefNumber: varchar('requisition_ref_number', { length: 64 }).notNull(),
    partName: varchar('part_name', { length: 255 }).notNull(),
    quantityRequested: integer('quantity_requested').notNull(),
    urgency: varchar('urgency', { length: 32 }).notNull().default('ROUTINE'),
    vendorRef: varchar('vendor_ref', { length: 255 }),
    requestedBy: varchar('requested_by', { length: 128 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('SUBMITTED_TO_PURCHASING'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bmpr_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_bmpr_num').on(table.tenantId, table.requisitionRefNumber)
  ]
);

export const biomedicalAuditTraces = clinicalSchema.table(
  'biomedical_audit_traces',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    traceNumber: varchar('trace_number', { length: 64 }).notNull(),
    action: varchar('action', { length: 64 }).notNull(),
    entityType: varchar('entity_type', { length: 64 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    entityCode: varchar('entity_code', { length: 64 }).notNull(),
    actorName: varchar('actor_name', { length: 128 }).notNull(),
    actorRole: varchar('actor_role', { length: 64 }).notNull(),
    justification: text('justification').notNull(),
    integrityHash: varchar('integrity_hash', { length: 128 }).notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bmat_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_bmat_num').on(table.tenantId, table.traceNumber)
  ]
);

export type BiomedicalAsset = typeof biomedicalAssets.$inferSelect;
export type BiomedicalAssetTransfer = typeof biomedicalAssetTransfers.$inferSelect;
export type BiomedicalPpmSchedule = typeof biomedicalPpmSchedules.$inferSelect;
export type BiomedicalWorkOrder = typeof biomedicalWorkOrders.$inferSelect;
export type BiomedicalCalibrationRecord = typeof biomedicalCalibrationRecords.$inferSelect;
export type BiomedicalSafetyTestRecord = typeof biomedicalSafetyTestRecords.$inferSelect;
export type BiomedicalSparePart = typeof biomedicalSpareParts.$inferSelect;
export type BiomedicalSparePartUsage = typeof biomedicalSparePartUsages.$inferSelect;
export type BiomedicalVendorVisit = typeof biomedicalVendorVisits.$inferSelect;
export type BiomedicalCondemnation = typeof biomedicalCondemnations.$inferSelect;
export type BiomedicalIncident = typeof biomedicalIncidents.$inferSelect;
export type BiomedicalProcurementReference = typeof biomedicalProcurementReferences.$inferSelect;
export type BiomedicalAuditTrace = typeof biomedicalAuditTraces.$inferSelect;


// ============================================================================
// Phase 2.20: Hospital Quality, Incident & Infection Control (NABH / JCI)
// ============================================================================

export const qualityAccreditationStandards = clinicalSchema.table(
  'quality_accreditation_standards',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    chapter: varchar('chapter', { length: 64 }).notNull(),
    standardCode: varchar('standard_code', { length: 32 }).notNull(),
    standardTitle: varchar('standard_title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    measurableElementsCount: integer('measurable_elements_count').notNull().default(5),
    complianceScorePct: numeric('compliance_score_pct', { precision: 5, scale: 2 }).notNull().default('100.00'),
    status: varchar('status', { length: 32 }).notNull().default('FULLY_COMPLIANT'),
    assignedLead: varchar('assigned_lead', { length: 128 }).notNull(),
    lastAuditDate: varchar('last_audit_date', { length: 32 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_qas_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_qas_code').on(table.tenantId, table.standardCode)
  ]
);

export const hospitalIncidentReports = clinicalSchema.table(
  'hospital_incident_reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    incidentNumber: varchar('incident_number', { length: 64 }).notNull(),
    category: varchar('category', { length: 64 }).notNull(),
    sacScore: varchar('sac_score', { length: 32 }).notNull().default('SAC_3_MODERATE'),
    status: varchar('status', { length: 32 }).notNull().default('REPORTED'),
    patientInvolved: boolean('patient_involved').notNull().default(false),
    patientMrn: varchar('patient_mrn', { length: 64 }),
    patientName: varchar('patient_name', { length: 255 }),
    departmentName: varchar('department_name', { length: 128 }).notNull(),
    locationDetail: varchar('location_detail', { length: 255 }).notNull(),
    incidentDateTime: timestamp('incident_date_time', { withTimezone: true }).notNull(),
    reportedByStaff: varchar('reported_by_staff', { length: 128 }).notNull(),
    reportedByRole: varchar('reported_by_role', { length: 64 }).notNull(),
    briefSummary: varchar('brief_summary', { length: 512 }).notNull(),
    detailedDescription: text('detailed_description').notNull(),
    immediateActionTaken: text('immediate_action_taken').notNull(),
    patientHarmLevel: varchar('patient_harm_level', { length: 64 }).notNull().default('NO_HARM_NEAR_MISS'),
    isSentinelEvent: boolean('is_sentinel_event').notNull().default(false),
    investigatingQualityOfficer: varchar('investigating_quality_officer', { length: 128 }),
    rcaRequired: boolean('rca_required').notNull().default(false),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_hir_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_hir_num').on(table.tenantId, table.incidentNumber)
  ]
);

export const incidentRcaInvestigations = clinicalSchema.table(
  'incident_rca_investigations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    rcaCode: varchar('rca_code', { length: 64 }).notNull(),
    incidentId: uuid('incident_id').notNull().references(() => hospitalIncidentReports.id),
    incidentNumber: varchar('incident_number', { length: 64 }).notNull(),
    leadInvestigator: varchar('lead_investigator', { length: 128 }).notNull(),
    investigationTeam: jsonb('investigation_team').notNull().$type<string[]>(),
    fiveWhysAnalysis: jsonb('five_whys_analysis').notNull().$type<{ step: number; whyQuestion: string; becauseAnswer: string }[]>(),
    fishboneCategories: jsonb('fishbone_categories').notNull().$type<{
      people: string[];
      process: string[];
      equipment: string[];
      environment: string[];
      management: string[];
    }>(),
    rootCauseStatement: text('root_cause_statement').notNull(),
    contributingFactors: text('contributing_factors').notNull(),
    status: varchar('status', { length: 32 }).notNull().default('IN_PROGRESS'),
    completedDate: varchar('completed_date', { length: 32 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_iri_tenant_inc').on(table.tenantId, table.incidentId),
    uniqueIndex('idx_iri_code').on(table.tenantId, table.rcaCode)
  ]
);

export const qualityCapaActions = clinicalSchema.table(
  'quality_capa_actions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    capaCode: varchar('capa_code', { length: 64 }).notNull(),
    incidentId: uuid('incident_id'),
    incidentNumber: varchar('incident_number', { length: 64 }),
    title: varchar('title', { length: 255 }).notNull(),
    actionDescription: text('action_description').notNull(),
    actionType: varchar('action_type', { length: 32 }).notNull().default('CORRECTIVE'),
    assignedOwner: varchar('assigned_owner', { length: 128 }).notNull(),
    targetCompletionDate: varchar('target_completion_date', { length: 32 }).notNull(),
    verificationMetric: text('verification_metric').notNull(),
    status: varchar('status', { length: 32 }).notNull().default('PENDING'),
    completedDate: varchar('completed_date', { length: 32 }),
    verifiedBy: varchar('verified_by', { length: 128 }),
    verifiedDate: varchar('verified_date', { length: 32 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_qca_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_qca_code').on(table.tenantId, table.capaCode)
  ]
);

export const haiSurveillanceRecords = clinicalSchema.table(
  'hai_surveillance_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    surveillanceCode: varchar('surveillance_code', { length: 64 }).notNull(),
    patientId: uuid('patient_id').notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    departmentName: varchar('department_name', { length: 128 }).notNull(),
    haiType: varchar('hai_type', { length: 32 }).notNull(),
    diagnosisDate: varchar('diagnosis_date', { length: 32 }).notNull(),
    pathogenIsolated: varchar('pathogen_isolated', { length: 255 }).notNull(),
    antibioticSensitivity: text('antibiotic_sensitivity').notNull(),
    invasiveDeviceName: varchar('invasive_device_name', { length: 255 }).notNull(),
    deviceInsertionDate: varchar('device_insertion_date', { length: 32 }).notNull(),
    deviceDaysAtInfection: integer('device_days_at_infection').notNull(),
    hicInterventionTaken: text('hic_intervention_taken').notNull(),
    outcomeStatus: varchar('outcome_status', { length: 32 }).notNull().default('ONGOING_TREATMENT'),
    reportedToInfectionControlCommittee: boolean('reported_to_icc').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_hsr_tenant_patient').on(table.tenantId, table.patientId),
    uniqueIndex('idx_hsr_code').on(table.tenantId, table.surveillanceCode)
  ]
);

export const haiDeviceDayLogs = clinicalSchema.table(
  'hai_device_day_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    departmentName: varchar('department_name', { length: 128 }).notNull(),
    monthYear: varchar('month_year', { length: 16 }).notNull(),
    centralLineDays: integer('central_line_days').notNull().default(0),
    clabsiCount: integer('clabsi_count').notNull().default(0),
    clabsiRatePer1000Days: numeric('clabsi_rate', { precision: 5, scale: 2 }).notNull().default('0.00'),
    urinaryCatheterDays: integer('urinary_catheter_days').notNull().default(0),
    cautiCount: integer('cauti_count').notNull().default(0),
    cautiRatePer1000Days: numeric('cauti_rate', { precision: 5, scale: 2 }).notNull().default('0.00'),
    ventilatorDays: integer('ventilator_days').notNull().default(0),
    vapCount: integer('vap_count').notNull().default(0),
    vapRatePer1000Days: numeric('vap_rate', { precision: 5, scale: 2 }).notNull().default('0.00'),
    surgicalProceduresCount: integer('surgical_procedures_count').notNull().default(0),
    ssiCount: integer('ssi_count').notNull().default(0),
    ssiPercentage: numeric('ssi_percentage', { precision: 5, scale: 2 }).notNull().default('0.00'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_hddl_tenant_dept').on(table.tenantId, table.departmentName, table.monthYear)
  ]
);

export const patientIsolationRecords = clinicalSchema.table(
  'patient_isolation_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    isolationCode: varchar('isolation_code', { length: 64 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    departmentName: varchar('department_name', { length: 128 }).notNull(),
    roomBedNumber: varchar('room_bed_number', { length: 64 }).notNull(),
    precautionType: varchar('precaution_type', { length: 32 }).notNull(),
    indicatedReasonOrPathogen: varchar('indicated_reason', { length: 255 }).notNull(),
    startDate: varchar('start_date', { length: 32 }).notNull(),
    endDate: varchar('end_date', { length: 32 }),
    assignedNurseLead: varchar('assigned_nurse_lead', { length: 128 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_pir_tenant_mrn').on(table.tenantId, table.patientMrn),
    uniqueIndex('idx_pir_code').on(table.tenantId, table.isolationCode)
  ]
);

export const handHygieneAudits = clinicalSchema.table(
  'hand_hygiene_audits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    auditCode: varchar('audit_code', { length: 64 }).notNull(),
    auditDate: varchar('audit_date', { length: 32 }).notNull(),
    departmentName: varchar('department_name', { length: 128 }).notNull(),
    staffCategory: varchar('staff_category', { length: 32 }).notNull(),
    whoMoment: varchar('who_moment', { length: 64 }).notNull(),
    actionTaken: varchar('action_taken', { length: 32 }).notNull(),
    isCompliant: boolean('is_compliant').notNull().default(true),
    auditedByOfficer: varchar('audited_by_officer', { length: 128 }).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_hha_tenant_dept').on(table.tenantId, table.departmentName),
    uniqueIndex('idx_hha_code').on(table.tenantId, table.auditCode)
  ]
);

export const environmentalMicroSwabs = clinicalSchema.table(
  'environmental_micro_swabs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    sampleNumber: varchar('sample_number', { length: 64 }).notNull(),
    sampleType: varchar('sample_type', { length: 64 }).notNull(),
    locationDescription: varchar('location_description', { length: 255 }).notNull(),
    collectionDate: varchar('collection_date', { length: 32 }).notNull(),
    collectedBy: varchar('collected_by', { length: 128 }).notNull(),
    cfuCountPerPlateOrMl: integer('cfu_count').notNull(),
    pathogensFound: varchar('pathogens_found', { length: 255 }).notNull(),
    permissibleThreshold: varchar('permissible_threshold', { length: 128 }).notNull(),
    resultStatus: varchar('result_status', { length: 32 }).notNull().default('SATISFACTORY_PASS'),
    correctiveFoggingDone: boolean('corrective_fogging_done').notNull().default(false),
    microbiologistSignOff: varchar('microbiologist_sign_off', { length: 128 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_ems_tenant_sample').on(table.tenantId, table.sampleType),
    uniqueIndex('idx_ems_num').on(table.tenantId, table.sampleNumber)
  ]
);

export const needleStickOccupationalLogs = clinicalSchema.table(
  'needle_stick_occupational_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    incidentCode: varchar('incident_code', { length: 64 }).notNull(),
    exposedStaffName: varchar('exposed_staff_name', { length: 128 }).notNull(),
    staffRole: varchar('staff_role', { length: 64 }).notNull(),
    departmentName: varchar('department_name', { length: 128 }).notNull(),
    exposureDateTime: timestamp('exposure_date_time', { withTimezone: true }).notNull(),
    sourcePatientKnown: boolean('source_patient_known').notNull().default(true),
    sourcePatientHivStatus: varchar('source_hiv_status', { length: 32 }).notNull().default('UNKNOWN'),
    sourcePatientHbsAgStatus: varchar('source_hbsag_status', { length: 32 }).notNull().default('UNKNOWN'),
    sourcePatientHcvStatus: varchar('source_hcv_status', { length: 32 }).notNull().default('UNKNOWN'),
    pepInitiatedWithinGoldenHour: boolean('pep_initiated_golden_hour').notNull().default(true),
    pepRegimenDetails: text('pep_regimen_details').notNull(),
    followUpSerologyDue: varchar('follow_up_serology_due', { length: 32 }).notNull(),
    counselorName: varchar('counselor_name', { length: 128 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_nsol_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_nsol_code').on(table.tenantId, table.incidentCode)
  ]
);

export const biomedicalWasteLogs = clinicalSchema.table(
  'biomedical_waste_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    logDate: varchar('log_date', { length: 32 }).notNull(),
    departmentName: varchar('department_name', { length: 128 }).notNull(),
    yellowBagWeightKg: numeric('yellow_kg', { precision: 6, scale: 2 }).notNull(),
    redBagWeightKg: numeric('red_kg', { precision: 6, scale: 2 }).notNull(),
    whiteTranslucentWeightKg: numeric('white_kg', { precision: 6, scale: 2 }).notNull(),
    blueBagWeightKg: numeric('blue_kg', { precision: 6, scale: 2 }).notNull(),
    totalDailyWeightKg: numeric('total_kg', { precision: 6, scale: 2 }).notNull(),
    pcbManifestBarcode: varchar('pcb_manifest_barcode', { length: 64 }).notNull(),
    handedOverToVendorName: varchar('handed_over_vendor', { length: 255 }).notNull(),
    hospitalSupervisorName: varchar('hospital_supervisor', { length: 128 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bmwl_tenant_date').on(table.tenantId, table.logDate)
  ]
);

export const qualityProcurementReferences = clinicalSchema.table(
  'quality_procurement_references',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    requisitionRefNumber: varchar('requisition_ref_number', { length: 64 }).notNull(),
    itemDescription: varchar('item_description', { length: 255 }).notNull(),
    quantityRequested: integer('quantity_requested').notNull(),
    urgency: varchar('urgency', { length: 32 }).notNull().default('ROUTINE'),
    requestedBy: varchar('requested_by', { length: 128 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('SUBMITTED'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_qpr_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_qpr_num').on(table.tenantId, table.requisitionRefNumber)
  ]
);

export const qualityAuditTraces = clinicalSchema.table(
  'quality_audit_traces',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    traceNumber: varchar('trace_number', { length: 64 }).notNull(),
    action: varchar('action', { length: 64 }).notNull(),
    entityType: varchar('entity_type', { length: 64 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    entityCode: varchar('entity_code', { length: 64 }).notNull(),
    actorName: varchar('actor_name', { length: 128 }).notNull(),
    actorRole: varchar('actor_role', { length: 64 }).notNull(),
    justification: text('justification').notNull(),
    integrityHash: varchar('integrity_hash', { length: 128 }).notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_quat_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_quat_num').on(table.tenantId, table.traceNumber)
  ]
);

export type QualityAccreditationStandard = typeof qualityAccreditationStandards.$inferSelect;
export type HospitalIncidentReport = typeof hospitalIncidentReports.$inferSelect;
export type IncidentRcaInvestigation = typeof incidentRcaInvestigations.$inferSelect;
export type QualityCapaAction = typeof qualityCapaActions.$inferSelect;
export type HaiSurveillanceRecord = typeof haiSurveillanceRecords.$inferSelect;
export type HaiDeviceDayLog = typeof haiDeviceDayLogs.$inferSelect;
export type PatientIsolationRecord = typeof patientIsolationRecords.$inferSelect;
export type HandHygieneAudit = typeof handHygieneAudits.$inferSelect;
export type EnvironmentalMicroSwab = typeof environmentalMicroSwabs.$inferSelect;
export type NeedleStickOccupationalLog = typeof needleStickOccupationalLogs.$inferSelect;
export type BiomedicalWasteLog = typeof biomedicalWasteLogs.$inferSelect;
export type QualityProcurementReference = typeof qualityProcurementReferences.$inferSelect;
export type QualityAuditTrace = typeof qualityAuditTraces.$inferSelect;


// ============================================================================
// Phase 3.1: Hospital Executive Command Center & AI Predictive Operations
// ============================================================================

export const executiveCommandSnapshots = clinicalSchema.table(
  'executive_command_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    hospitalName: varchar('hospital_name', { length: 255 }).notNull(),
    snapshotTimestamp: timestamp('snapshot_timestamp', { withTimezone: true }).defaultNow().notNull(),
    surgeLevel: varchar('surge_level', { length: 32 }).notNull().default('NORMAL_GREEN'),
    activeEmergencyCodes: jsonb('active_emergency_codes').notNull().$type<{
      codeType: string;
      location: string;
      declaredAt: string;
      status: 'ACTIVE' | 'STANDBY' | 'RESOLVED';
    }[]>(),
    totalBeds: integer('total_beds').notNull(),
    occupiedBeds: integer('occupied_beds').notNull(),
    bedOccupancyPct: numeric('bed_occupancy_pct', { precision: 5, scale: 2 }).notNull(),
    availableBedsCount: integer('available_beds_count').notNull(),
    icuBedsTotal: integer('icu_beds_total').notNull(),
    icuBedsOccupied: integer('icu_beds_occupied').notNull(),
    icuOccupancyPct: numeric('icu_occupancy_pct', { precision: 5, scale: 2 }).notNull(),
    ventilatorsTotal: integer('ventilators_total').notNull(),
    ventilatorsInUse: integer('ventilators_in_use').notNull(),
    ventilatorUtilizationPct: numeric('ventilator_util_pct', { precision: 5, scale: 2 }).notNull(),
    edTriageWaitingCount: integer('ed_triage_waiting').notNull(),
    edHoldForAdmissionCount: integer('ed_hold_admission').notNull(),
    edNedocsScore: integer('ed_nedocs_score').notNull(),
    edNedocsStatus: varchar('ed_nedocs_status', { length: 64 }).notNull(),
    otSuitesActive: integer('ot_suites_active').notNull(),
    otSuitesTotal: integer('ot_suites_total').notNull(),
    otUtilizationPct: numeric('ot_util_pct', { precision: 5, scale: 2 }).notNull(),
    surgeriesInProgressCount: integer('surgeries_in_progress').notNull(),
    surgeriesDelayedCount: integer('surgeries_delayed').notNull(),
    dailyRevenueVelocityInr: numeric('daily_rev_velocity', { precision: 12, scale: 2 }).notNull(),
    unbilledChargesRiskInr: numeric('unbilled_risk', { precision: 12, scale: 2 }).notNull(),
    claimsDenialRiskCount: integer('claims_denial_risk_count').notNull(),
    statLabOrdersPending: integer('stat_lab_pending').notNull(),
    statRadiologyOrdersPending: integer('stat_rad_pending').notNull(),
    criticalBloodUnitsAlertCount: integer('critical_blood_alert_count').notNull(),
    criticalConsumablesStockoutRiskCount: integer('critical_consumables_risk_count').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_ecs_tenant_branch').on(table.tenantId, table.branchId),
    index('idx_ecs_timestamp').on(table.snapshotTimestamp)
  ]
);

export const hospitalSurgeEvents = clinicalSchema.table(
  'hospital_surge_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    surgeEventCode: varchar('surge_event_code', { length: 64 }).notNull(),
    surgeLevel: varchar('surge_level', { length: 32 }).notNull(),
    emergencyCodeType: varchar('emergency_code_type', { length: 64 }),
    location: varchar('location', { length: 255 }).notNull(),
    justification: text('justification').notNull(),
    declaredBy: varchar('declared_by', { length: 128 }).notNull(),
    declaredAt: timestamp('declared_at', { withTimezone: true }).defaultNow().notNull(),
    status: varchar('status', { length: 32 }).notNull().default('ACTIVE'),
    resolvedBy: varchar('resolved_by', { length: 128 }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    outcomeNotes: text('outcome_notes')
  },
  (table) => [
    index('idx_hse_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_hse_code').on(table.tenantId, table.surgeEventCode)
  ]
);

export const predictiveBedForecasts = clinicalSchema.table(
  'predictive_bed_forecasts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    forecastWindow: varchar('forecast_window', { length: 32 }).notNull(),
    specialtyName: varchar('specialty_name', { length: 128 }).notNull(),
    currentOccupied: integer('current_occupied').notNull(),
    capacityLimit: integer('capacity_limit').notNull(),
    predictedAdmissions: integer('predicted_admissions').notNull(),
    predictedDischarges: integer('predicted_discharges').notNull(),
    netProjectedDemand: integer('net_projected_demand').notNull(),
    projectedOccupancyPct: numeric('projected_occ_pct', { precision: 5, scale: 2 }).notNull(),
    predictedBottleneckLevel: varchar('bottleneck_level', { length: 32 }).notNull().default('LOW'),
    aiConfidencePct: numeric('ai_confidence_pct', { precision: 5, scale: 2 }).notNull().default('92.50'),
    recommendedAction: text('recommended_action').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_pbf_tenant_spec').on(table.tenantId, table.specialtyName, table.forecastWindow)
  ]
);

export const whatIfSimulationRuns = clinicalSchema.table(
  'what_if_simulation_runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    scenarioName: varchar('scenario_name', { length: 255 }).notNull(),
    surgeType: varchar('surge_type', { length: 64 }).notNull(),
    durationHours: integer('duration_hours').notNull().default(48),
    divertElectiveSurgeries: boolean('divert_elective').notNull().default(false),
    fastTrackDischargeBonus: boolean('fast_track_discharge').notNull().default(false),
    simulatedOccupancyPeakPct: numeric('sim_occupancy_peak', { precision: 5, scale: 2 }).notNull(),
    simulatedIcuDeficitBeds: integer('sim_icu_deficit').notNull(),
    simulatedVentilatorShortageCount: integer('sim_vent_shortage').notNull(),
    simulatedEdWaitTimePeakMins: integer('sim_ed_wait_peak').notNull(),
    simulatedDailyFinancialImpactInr: numeric('sim_financial_impact', { precision: 12, scale: 2 }).notNull(),
    aiRecommendations: jsonb('ai_recommendations').notNull().$type<string[]>(),
    runBy: varchar('run_by', { length: 128 }).notNull().default('System AI Modeler'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_wisr_tenant_branch').on(table.tenantId, table.branchId)
  ]
);

export const executiveAuditTraces = clinicalSchema.table(
  'executive_audit_traces',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    traceNumber: varchar('trace_number', { length: 64 }).notNull(),
    action: varchar('action', { length: 64 }).notNull(),
    entityType: varchar('entity_type', { length: 64 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    entityCode: varchar('entity_code', { length: 64 }).notNull(),
    actorName: varchar('actor_name', { length: 128 }).notNull(),
    actorRole: varchar('actor_role', { length: 64 }).notNull(),
    justification: text('justification').notNull(),
    integrityHash: varchar('integrity_hash', { length: 128 }).notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_exat_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_exat_num').on(table.tenantId, table.traceNumber)
  ]
);

export type ExecutiveCommandSnapshot = typeof executiveCommandSnapshots.$inferSelect;
export type HospitalSurgeEvent = typeof hospitalSurgeEvents.$inferSelect;
export type PredictiveBedForecast = typeof predictiveBedForecasts.$inferSelect;
export type WhatIfSimulationRun = typeof whatIfSimulationRuns.$inferSelect;
export type ExecutiveAuditTrace = typeof executiveAuditTraces.$inferSelect;


// ============================================================================
// Phase 3.2: ABDM (Ayushman Bharat Digital Mission) & FHIR R4 National Gateway
// ============================================================================

export const patientAbhaAccounts = clinicalSchema.table(
  'patient_abha_accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    patientId: uuid('patient_id').notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    abhaNumber: varchar('abha_number', { length: 32 }).notNull(),
    abhaAddress: varchar('abha_address', { length: 128 }).notNull(),
    mobileNumber: varchar('mobile_number', { length: 32 }).notNull(),
    gender: varchar('gender', { length: 8 }).notNull(),
    dateOfBirth: varchar('date_of_birth', { length: 32 }).notNull(),
    address: text('address').notNull(),
    kycStatus: varchar('kyc_status', { length: 32 }).notNull().default('VERIFIED_AADHAAR'),
    abhaCardQrPayload: text('abha_card_qr_payload').notNull(),
    linkedCareContextsCount: integer('linked_care_contexts_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_paa_tenant_patient').on(table.tenantId, table.patientId),
    uniqueIndex('idx_paa_abha_addr').on(table.tenantId, table.abhaAddress)
  ]
);

export const abdmCareContextMappings = clinicalSchema.table(
  'abdm_care_context_mappings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    abhaAddress: varchar('abha_address', { length: 128 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    careContextType: varchar('care_context_type', { length: 64 }).notNull(),
    careContextReference: varchar('care_context_ref', { length: 64 }).notNull(),
    displayTitle: varchar('display_title', { length: 255 }).notNull(),
    encounterDate: varchar('encounter_date', { length: 32 }).notNull(),
    doctorName: varchar('doctor_name', { length: 128 }).notNull(),
    departmentName: varchar('department_name', { length: 128 }).notNull(),
    isLinkedToAbdm: boolean('is_linked_abdm').notNull().default(true),
    fhirBundleId: varchar('fhir_bundle_id', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_accm_tenant_abha').on(table.tenantId, table.abhaAddress),
    uniqueIndex('idx_accm_ref').on(table.tenantId, table.careContextReference)
  ]
);

export const abdmConsentArtefacts = clinicalSchema.table(
  'abdm_consent_artefacts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    consentRequestId: varchar('consent_request_id', { length: 64 }).notNull(),
    artefactId: varchar('artefact_id', { length: 64 }).notNull(),
    patientAbhaAddress: varchar('patient_abha_address', { length: 128 }).notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    requesterHipOrHiu: varchar('requester_hip_hiu', { length: 255 }).notNull(),
    purposeCode: varchar('purpose_code', { length: 32 }).notNull(),
    purposeDescription: varchar('purpose_description', { length: 255 }).notNull(),
    dateFrom: varchar('date_from', { length: 32 }).notNull(),
    dateTo: varchar('date_to', { length: 32 }).notNull(),
    dataEraseDate: varchar('data_erase_date', { length: 32 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('GRANTED'),
    grantedAt: timestamp('granted_at', { withTimezone: true }),
    linkedCareContextRefs: jsonb('linked_care_context_refs').notNull().$type<string[]>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_aca_tenant_abha').on(table.tenantId, table.patientAbhaAddress),
    uniqueIndex('idx_aca_artefact').on(table.tenantId, table.artefactId)
  ]
);

export const fhirBundlesRepository = clinicalSchema.table(
  'fhir_bundles_repository',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    bundleId: varchar('bundle_id', { length: 64 }).notNull(),
    profileType: varchar('profile_type', { length: 64 }).notNull(),
    patientAbhaAddress: varchar('patient_abha_address', { length: 128 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    careContextRef: varchar('care_context_ref', { length: 64 }).notNull(),
    documentDate: varchar('document_date', { length: 32 }).notNull(),
    authorPractitionerHprId: varchar('author_hpr_id', { length: 64 }).notNull(),
    authorPractitionerName: varchar('author_practitioner_name', { length: 128 }).notNull(),
    facilityHfrId: varchar('facility_hfr_id', { length: 64 }).notNull(),
    fhirJsonPayload: text('fhir_json_payload').notNull(),
    validationStatus: varchar('validation_status', { length: 32 }).notNull().default('VALID_FHIR_R4'),
    digitalSignatureHash: varchar('digital_signature_hash', { length: 128 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_fbr_tenant_care_ctx').on(table.tenantId, table.careContextRef),
    uniqueIndex('idx_fbr_bundle').on(table.tenantId, table.bundleId)
  ]
);

export const abdmAuditTraces = clinicalSchema.table(
  'abdm_audit_traces',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    traceNumber: varchar('trace_number', { length: 64 }).notNull(),
    action: varchar('action', { length: 64 }).notNull(),
    entityType: varchar('entity_type', { length: 64 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    entityCode: varchar('entity_code', { length: 64 }).notNull(),
    actorName: varchar('actor_name', { length: 128 }).notNull(),
    actorRole: varchar('actor_role', { length: 64 }).notNull(),
    justification: text('justification').notNull(),
    integrityHash: varchar('integrity_hash', { length: 128 }).notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_abtr_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_abtr_num').on(table.tenantId, table.traceNumber)
  ]
);

export type PatientAbhaAccount = typeof patientAbhaAccounts.$inferSelect;
export type AbdmCareContextMapping = typeof abdmCareContextMappings.$inferSelect;
export type AbdmConsentArtefact = typeof abdmConsentArtefacts.$inferSelect;
export type FhirBundleRecord = typeof fhirBundlesRepository.$inferSelect;
export type AbdmAuditTrace = typeof abdmAuditTraces.$inferSelect;


// ============================================================================
// Phase 3.3: AI Clinical Co-Pilot, Sepsis & Drug Interaction CDSS Engine
// ============================================================================

export const sepsisNews2Alerts = clinicalSchema.table(
  'sepsis_news2_alerts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    bedNumber: varchar('bed_number', { length: 64 }).notNull(),
    wardName: varchar('ward_name', { length: 128 }).notNull(),
    news2Score: integer('news2_score').notNull(),
    qsofaScore: integer('qsofa_score').notNull(),
    riskGrade: varchar('risk_grade', { length: 64 }).notNull(),
    respiratoryRate: integer('respiratory_rate').notNull(),
    spO2Pct: integer('spo2_pct').notNull(),
    requiresSupplementalO2: boolean('req_supp_o2').notNull().default(false),
    systolicBp: integer('systolic_bp').notNull(),
    pulseRate: integer('pulse_rate').notNull(),
    temperatureCelsius: numeric('temperature_c', { precision: 4, scale: 1 }).notNull(),
    consciousnessLevel: varchar('consciousness_level', { length: 32 }).notNull().default('ALERT'),
    serumLactateMmolL: numeric('serum_lactate', { precision: 4, scale: 2 }),
    bundleChecklist: jsonb('bundle_checklist').notNull().$type<{
      bloodCulturesOrdered: boolean;
      lactateMeasured: boolean;
      ivAntibioticsGiven: boolean;
      ivFluidsAdministered: boolean;
      vasopressorsStarted: boolean;
    }>(),
    alertStatus: varchar('alert_status', { length: 32 }).notNull().default('TRIGGERED_ACTIVE'),
    triggeredAt: timestamp('triggered_at', { withTimezone: true }).defaultNow().notNull(),
    acknowledgedBy: varchar('acknowledged_by', { length: 128 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_sna_tenant_patient').on(table.tenantId, table.patientMrn),
    index('idx_sna_triggered').on(table.triggeredAt)
  ]
);

export const ddiDrugInteractionChecks = clinicalSchema.table(
  'ddi_drug_interaction_checks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    drugA: varchar('drug_a', { length: 255 }).notNull(),
    drugB: varchar('drug_b', { length: 255 }).notNull(),
    severityLevel: varchar('severity_level', { length: 64 }).notNull(),
    clinicalConsequence: text('clinical_consequence').notNull(),
    mechanism: text('mechanism').notNull(),
    recommendedManagement: text('recommended_management').notNull(),
    evidenceReference: varchar('evidence_ref', { length: 255 }).notNull(),
    wasOverridden: boolean('was_overridden').notNull().default(false),
    overrideJustification: text('override_justification'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_ddi_tenant_patient').on(table.tenantId, table.patientMrn)
  ]
);

export const ambientAiScribeTranscripts = clinicalSchema.table(
  'ambient_ai_scribe_transcripts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    doctorName: varchar('doctor_name', { length: 128 }).notNull(),
    specialtyName: varchar('specialty_name', { length: 128 }).notNull(),
    encounterTimestamp: timestamp('encounter_ts', { withTimezone: true }).defaultNow().notNull(),
    audioDurationSeconds: integer('audio_duration_sec').notNull().default(180),
    rawTranscriptExcerpt: text('raw_transcript').notNull(),
    soapNote: jsonb('soap_note').notNull().$type<{
      subjective: string;
      objective: string;
      assessment: string;
      plan: string;
    }>(),
    suggestedIcd10Codes: jsonb('suggested_icd10').notNull().$type<{
      code: string;
      description: string;
      confidencePct: number;
    }[]>(),
    suggestedPrescriptions: jsonb('suggested_prescriptions').notNull().$type<{
      drugName: string;
      dosage: string;
      frequency: string;
      duration: string;
    }[]>(),
    reviewStatus: varchar('review_status', { length: 32 }).notNull().default('AI_DRAFTED'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_aast_tenant_patient').on(table.tenantId, table.patientMrn)
  ]
);

export const criticalPanicValueAlerts = clinicalSchema.table(
  'critical_panic_value_alerts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    location: varchar('location', { length: 255 }).notNull(),
    testName: varchar('test_name', { length: 128 }).notNull(),
    measuredValue: varchar('measured_value', { length: 64 }).notNull(),
    referenceNormalRange: varchar('normal_range', { length: 64 }).notNull(),
    panicThreshold: varchar('panic_threshold', { length: 64 }).notNull(),
    category: varchar('category', { length: 64 }).notNull(),
    urgencyLevel: varchar('urgency_level', { length: 64 }).notNull(),
    clinicalRiskSummary: text('clinical_risk_summary').notNull(),
    communicatedToDoctor: boolean('communicated_to_doc').notNull().default(true),
    doctorName: varchar('doctor_name', { length: 128 }).notNull(),
    alertTimestamp: timestamp('alert_timestamp', { withTimezone: true }).defaultNow().notNull(),
    acknowledgementTimestamp: timestamp('ack_timestamp', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_cpva_tenant_patient').on(table.tenantId, table.patientMrn)
  ]
);

export const cdssAuditTraces = clinicalSchema.table(
  'cdss_audit_traces',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    traceNumber: varchar('trace_number', { length: 64 }).notNull(),
    action: varchar('action', { length: 64 }).notNull(),
    entityType: varchar('entity_type', { length: 64 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    entityCode: varchar('entity_code', { length: 64 }).notNull(),
    actorName: varchar('actor_name', { length: 128 }).notNull(),
    actorRole: varchar('actor_role', { length: 64 }).notNull(),
    justification: text('justification').notNull(),
    integrityHash: varchar('integrity_hash', { length: 128 }).notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_cdsstr_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_cdsstr_num').on(table.tenantId, table.traceNumber)
  ]
);

export type SepsisNews2Alert = typeof sepsisNews2Alerts.$inferSelect;
export type DdiDrugInteractionCheck = typeof ddiDrugInteractionChecks.$inferSelect;
export type AmbientAiSoapTranscript = typeof ambientAiScribeTranscripts.$inferSelect;
export type CriticalPanicValueAlert = typeof criticalPanicValueAlerts.$inferSelect;
export type CdssAuditTrace = typeof cdssAuditTraces.$inferSelect;


// ============================================================================
// Phase 3.4: Telemedicine, Virtual Consultations & IoT Remote Patient Monitoring (RPM)
// ============================================================================

export const teleconsultationSessions = clinicalSchema.table(
  'teleconsultation_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    appointmentNumber: varchar('appointment_number', { length: 64 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    doctorName: varchar('doctor_name', { length: 128 }).notNull(),
    specialtyName: varchar('specialty_name', { length: 128 }).notNull(),
    scheduledStartTime: timestamp('sched_start_time', { withTimezone: true }).notNull(),
    actualStartTime: timestamp('actual_start_time', { withTimezone: true }),
    actualEndTime: timestamp('actual_end_time', { withTimezone: true }),
    callDurationSeconds: integer('call_duration_sec').notNull().default(0),
    webrtcRoomId: varchar('webrtc_room_id', { length: 128 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('SCHEDULED'),
    consultationFeeInr: numeric('consultation_fee', { precision: 10, scale: 2 }).notNull().default('800.00'),
    paymentStatus: varchar('payment_status', { length: 32 }).notNull().default('PAID'),
    clinicalSoapSummary: text('clinical_soap_summary'),
    ePrescriptionGenerated: boolean('e_rx_generated').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_tcs_tenant_patient').on(table.tenantId, table.patientMrn),
    uniqueIndex('idx_tcs_room').on(table.tenantId, table.webrtcRoomId)
  ]
);

export const iotConnectedDevices = clinicalSchema.table(
  'iot_connected_devices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    deviceSerial: varchar('device_serial', { length: 128 }).notNull(),
    deviceModel: varchar('device_model', { length: 128 }).notNull(),
    deviceType: varchar('device_type', { length: 64 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    connectionProtocol: varchar('conn_protocol', { length: 64 }).notNull().default('BLUETOOTH_BLE'),
    batteryLevelPct: integer('battery_pct').notNull().default(100),
    lastSyncTimestamp: timestamp('last_sync_ts', { withTimezone: true }).defaultNow().notNull(),
    syncStatus: varchar('sync_status', { length: 32 }).notNull().default('ONLINE_ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_icd_tenant_patient').on(table.tenantId, table.patientMrn),
    uniqueIndex('idx_icd_serial').on(table.tenantId, table.deviceSerial)
  ]
);

export const rpmVitalBreachAlerts = clinicalSchema.table(
  'rpm_vital_breach_alerts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    careProgram: varchar('care_program', { length: 64 }).notNull(),
    vitalParameter: varchar('vital_param', { length: 128 }).notNull(),
    measuredValue: varchar('measured_value', { length: 64 }).notNull(),
    thresholdRule: text('threshold_rule').notNull(),
    severity: varchar('severity', { length: 32 }).notNull().default('WARNING_AMBER'),
    alertTimestamp: timestamp('alert_ts', { withTimezone: true }).defaultNow().notNull(),
    status: varchar('status', { length: 32 }).notNull().default('UNACKNOWLEDGED_URGENT'),
    assignedClinician: varchar('assigned_clinician', { length: 128 }).notNull(),
    resolutionNotes: text('resolution_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_rvba_tenant_patient').on(table.tenantId, table.patientMrn),
    index('idx_rvba_alert_ts').on(table.alertTimestamp)
  ]
);

export const telehealthAuditTraces = clinicalSchema.table(
  'telehealth_audit_traces',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    traceNumber: varchar('trace_number', { length: 64 }).notNull(),
    action: varchar('action', { length: 64 }).notNull(),
    entityType: varchar('entity_type', { length: 64 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    entityCode: varchar('entity_code', { length: 64 }).notNull(),
    actorName: varchar('actor_name', { length: 128 }).notNull(),
    actorRole: varchar('actor_role', { length: 64 }).notNull(),
    justification: text('justification').notNull(),
    integrityHash: varchar('integrity_hash', { length: 128 }).notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_thtr_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_thtr_num').on(table.tenantId, table.traceNumber)
  ]
);

export type TeleconsultationSession = typeof teleconsultationSessions.$inferSelect;
export type IotConnectedDevice = typeof iotConnectedDevices.$inferSelect;
export type RpmVitalBreachAlert = typeof rpmVitalBreachAlerts.$inferSelect;
export type TelehealthAuditTrace = typeof telehealthAuditTraces.$inferSelect;


// ============================================================================
// Phase 3.5: WhatsApp Conversational Bot & Patient Self-Service Portal
// ============================================================================

export const whatsappConversations = clinicalSchema.table(
  'whatsapp_conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    phoneNumber: varchar('phone_number', { length: 32 }).notNull(),
    lastMessageSnippet: text('last_msg_snippet').notNull(),
    unreadCount: integer('unread_count').notNull().default(0),
    assignedAgent: varchar('assigned_agent', { length: 128 }),
    botActive: boolean('bot_active').notNull().default(true),
    lastActivityTimestamp: timestamp('last_activity_ts', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_wac_tenant_phone').on(table.tenantId, table.phoneNumber),
    index('idx_wac_tenant_patient').on(table.tenantId, table.patientMrn)
  ]
);

export const whatsappDocumentDispatches = clinicalSchema.table(
  'whatsapp_document_dispatches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    phoneNumber: varchar('phone_number', { length: 32 }).notNull(),
    documentType: varchar('document_type', { length: 64 }).notNull(),
    documentNumber: varchar('document_number', { length: 64 }).notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    fileSizeKb: integer('file_size_kb').notNull().default(240),
    dispatchChannel: varchar('dispatch_channel', { length: 64 }).notNull().default('WHATSAPP_CLOUD_API'),
    deliveryStatus: varchar('delivery_status', { length: 32 }).notNull().default('DISPATCHED_READ'),
    dispatchedAt: timestamp('dispatched_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_wdd_tenant_patient').on(table.tenantId, table.patientMrn)
  ]
);

export const liveQueueTokens = clinicalSchema.table(
  'live_queue_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    tokenNumber: varchar('token_number', { length: 32 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }).notNull(),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    doctorName: varchar('doctor_name', { length: 128 }).notNull(),
    departmentName: varchar('department_name', { length: 128 }).notNull(),
    roomNumber: varchar('room_number', { length: 32 }).notNull(),
    currentTokenServing: varchar('curr_token_serving', { length: 32 }).notNull(),
    estimatedWaitMinutes: integer('est_wait_mins').notNull().default(15),
    queueStatus: varchar('queue_status', { length: 32 }).notNull().default('WAITING_IN_LOBBY'),
    lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_lqt_tenant_token').on(table.tenantId, table.tokenNumber),
    index('idx_lqt_tenant_doctor').on(table.tenantId, table.doctorName)
  ]
);

export const whatsappPortalAuditTraces = clinicalSchema.table(
  'whatsapp_portal_audit_traces',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    traceNumber: varchar('trace_number', { length: 64 }).notNull(),
    action: varchar('action', { length: 64 }).notNull(),
    entityType: varchar('entity_type', { length: 64 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    entityCode: varchar('entity_code', { length: 64 }).notNull(),
    actorName: varchar('actor_name', { length: 128 }).notNull(),
    actorRole: varchar('actor_role', { length: 64 }).notNull(),
    justification: text('justification').notNull(),
    integrityHash: varchar('integrity_hash', { length: 128 }).notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_wpatr_tenant_branch').on(table.tenantId, table.branchId),
    uniqueIndex('idx_wpatr_num').on(table.tenantId, table.traceNumber)
  ]
);

export type WhatsappConversation = typeof whatsappConversations.$inferSelect;
export type WhatsappDocumentDispatch = typeof whatsappDocumentDispatches.$inferSelect;
export type LiveQueueToken = typeof liveQueueTokens.$inferSelect;
export type WhatsappPortalAuditTrace = typeof whatsappPortalAuditTraces.$inferSelect;

export type NewRadiologyOrder = typeof radiologyOrders.$inferInsert;
