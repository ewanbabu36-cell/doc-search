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
import {
  clinicalSchema
} from './foundation.js';

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

export const imagingSeries = clinicalSchema.table(
  'imaging_series',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    studyId: uuid('study_id').notNull().references(() => radiologyStudies.id, { onDelete: 'cascade' }),
    seriesInstanceUid: varchar('series_instance_uid', { length: 128 }).notNull(),
    seriesNumber: integer('series_number').notNull().default(1),
    modality: varchar('modality', { length: 64 }).notNull(),
    seriesDescription: text('series_description').notNull(),
    numberOfInstances: integer('number_of_instances').notNull().default(1),
    bodyPartExamined: varchar('body_part_examined', { length: 128 }),
    protocolName: varchar('protocol_name', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_is_tenant_study').on(table.tenantId, table.studyId),
    uniqueIndex('idx_is_uid').on(table.tenantId, table.seriesInstanceUid)
  ]
);

export const imagingInstances = clinicalSchema.table(
  'imaging_instances',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    seriesId: uuid('series_id').notNull().references(() => imagingSeries.id, { onDelete: 'cascade' }),
    studyId: uuid('study_id').notNull().references(() => radiologyStudies.id, { onDelete: 'cascade' }),
    sopInstanceUid: varchar('sop_instance_uid', { length: 128 }).notNull(),
    sopClassUid: varchar('sop_class_uid', { length: 128 }).notNull().default('1.2.840.10008.5.1.4.1.1.7'),
    instanceNumber: integer('instance_number').notNull().default(1),
    rows: integer('rows'),
    columns: integer('columns'),
    bitsAllocated: integer('bits_allocated').default(16),
    bitsStored: integer('bits_stored').default(12),
    windowCenter: numeric('window_center', { precision: 8, scale: 2 }),
    windowWidth: numeric('window_width', { precision: 8, scale: 2 }),
    sliceThickness: numeric('slice_thickness', { precision: 6, scale: 2 }),
    sliceLocation: numeric('slice_location', { precision: 8, scale: 2 }),
    imageUrl: text('image_url').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_ii_tenant_series').on(table.tenantId, table.seriesId),
    uniqueIndex('idx_ii_uid').on(table.tenantId, table.sopInstanceUid)
  ]
);

export const radiologyReportAmendments = clinicalSchema.table(
  'radiology_report_amendments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    reportId: uuid('report_id').notNull().references(() => radiologyReports.id, { onDelete: 'cascade' }),
    amendmentNumber: varchar('amendment_number', { length: 64 }).notNull(),
    versionFrom: integer('version_from').notNull(),
    versionTo: integer('version_to').notNull(),
    previousFindings: text('previous_findings').notNull(),
    previousImpression: text('previous_impression').notNull(),
    amendedFindings: text('amended_findings').notNull(),
    amendedImpression: text('amended_impression').notNull(),
    reasonForAmendment: text('reason_for_amendment').notNull(),
    amendedByRadiologistName: varchar('amended_by_radiologist_name', { length: 255 }).notNull(),
    digitalSignature: text('digital_signature').notNull(),
    amendedAt: timestamp('amended_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_rra_tenant_report').on(table.tenantId, table.reportId),
    uniqueIndex('idx_rra_number').on(table.tenantId, table.amendmentNumber)
  ]
);

export type ImagingSeries = typeof imagingSeries.$inferSelect;
export type ImagingInstance = typeof imagingInstances.$inferSelect;
export type RadiologyReportAmendment = typeof radiologyReportAmendments.$inferSelect;
export type NewImagingSeries = typeof imagingSeries.$inferInsert;
export type NewImagingInstance = typeof imagingInstances.$inferInsert;
export type NewRadiologyReportAmendment = typeof radiologyReportAmendments.$inferInsert;

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

