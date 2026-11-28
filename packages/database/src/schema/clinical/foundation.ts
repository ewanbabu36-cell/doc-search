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
    operatingModel: varchar('operating_model', { length: 64 }),
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
    operatingModel: varchar('operating_model', { length: 64 }),
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
    uhid: varchar('uhid', { length: 100 }),
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
    uniqueIndex('idx_patients_tenant_mrn').on(table.tenantId, table.mrn),
    uniqueIndex('idx_patients_tenant_uhid').on(table.tenantId, table.uhid)
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
    index('idx_patient_contacts_email').on(table.email),
    uniqueIndex('idx_patient_contacts_tenant_primary_mobile_uidx').on(table.tenantId, table.primaryMobile)
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
