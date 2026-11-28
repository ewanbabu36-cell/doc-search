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
  boolean
} from 'drizzle-orm/pg-core';
import { tenants } from '../core/tenants.js';
import {
  clinicalSchema,
  operationalPartners,
  operationalOrganizations,
  operationalFacilities,
  doctorProfiles,
  patients,
  encounters,
  consultations
} from './foundation.js';

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
 * 4.15 controlled_substance_records (CDSCO Form 20B/21B Register)
 * Statutory append-only controlled substances register complying with CDSCO Rules 1945
 * for Schedule H1, Schedule X, and Schedule H drugs.
 */
export const pharmacySchema = pgSchema('pharmacy');

export const controlledSubstanceRecords = pharmacySchema.table(
  'controlled_substance_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').references(() => operationalPartners.id, { onDelete: 'set null' }),
    organizationId: uuid('organization_id').references(() => operationalOrganizations.id, { onDelete: 'set null' }),
    branchId: uuid('branch_id').references(() => operationalFacilities.id, { onDelete: 'set null' }),
    dispenseDate: varchar('dispense_date', { length: 50 }).notNull(),
    invoiceNumber: varchar('invoice_number', { length: 100 }).notNull(),
    prescriptionId: varchar('prescription_id', { length: 100 }),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientUhid: varchar('patient_uhid', { length: 100 }),
    patientAddress: text('patient_address').notNull().default('Hospital OPD Patient'),
    patientPhone: varchar('patient_phone', { length: 50 }).notNull(),
    doctorName: varchar('doctor_name', { length: 255 }).notNull(),
    doctorRegNumber: varchar('doctor_reg_number', { length: 100 }).notNull(), // MCI / NMC / SMC Reg
    hospitalName: varchar('hospital_name', { length: 255 }),
    drugName: varchar('drug_name', { length: 255 }).notNull(),
    scheduleType: varchar('schedule_type', { length: 50 }).notNull().default('SCHEDULE_H1'), // SCHEDULE_H1, SCHEDULE_X, SCHEDULE_H
    batchNumber: varchar('batch_number', { length: 100 }).notNull(),
    expiryDate: varchar('expiry_date', { length: 50 }),
    quantityDispensed: varchar('quantity_dispensed', { length: 100 }).notNull(),
    pharmacistLicense: varchar('pharmacist_license', { length: 100 }),
    pharmacistName: varchar('pharmacist_name', { length: 255 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ctrl_sub_tenant').on(table.tenantId),
    index('idx_ctrl_sub_invoice').on(table.invoiceNumber),
    index('idx_ctrl_sub_drug').on(table.drugName),
    index('idx_ctrl_sub_schedule').on(table.scheduleType),
    index('idx_ctrl_sub_doctor_reg').on(table.doctorRegNumber),
    index('idx_ctrl_sub_date').on(table.dispenseDate)
  ]
);

export const pharmacyControlledSubstances = clinicalSchema.table(
  'pharmacy_controlled_substances',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id').references(() => operationalPartners.id, { onDelete: 'set null' }),
    organizationId: uuid('organization_id').references(() => operationalOrganizations.id, { onDelete: 'set null' }),
    branchId: uuid('branch_id').references(() => operationalFacilities.id, { onDelete: 'set null' }),
    dispenseDate: varchar('dispense_date', { length: 50 }).notNull(),
    invoiceNumber: varchar('invoice_number', { length: 100 }).notNull(),
    prescriptionId: varchar('prescription_id', { length: 100 }),
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientUhid: varchar('patient_uhid', { length: 100 }),
    patientAddress: text('patient_address').notNull().default('Hospital OPD Patient'),
    patientPhone: varchar('patient_phone', { length: 50 }).notNull(),
    doctorName: varchar('doctor_name', { length: 255 }).notNull(),
    doctorRegNumber: varchar('doctor_reg_number', { length: 100 }).notNull(),
    hospitalName: varchar('hospital_name', { length: 255 }),
    drugName: varchar('drug_name', { length: 255 }).notNull(),
    scheduleType: varchar('schedule_type', { length: 50 }).notNull().default('SCHEDULE_H1'),
    batchNumber: varchar('batch_number', { length: 100 }).notNull(),
    expiryDate: varchar('expiry_date', { length: 50 }),
    quantityDispensed: varchar('quantity_dispensed', { length: 100 }).notNull(),
    pharmacistLicense: varchar('pharmacist_license', { length: 100 }),
    pharmacistName: varchar('pharmacist_name', { length: 255 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_pharm_ctrl_tenant').on(table.tenantId),
    index('idx_pharm_ctrl_invoice').on(table.invoiceNumber),
    index('idx_pharm_ctrl_drug').on(table.drugName),
    index('idx_pharm_ctrl_schedule').on(table.scheduleType),
    index('idx_pharm_ctrl_doctor_reg').on(table.doctorRegNumber),
    index('idx_pharm_ctrl_date').on(table.dispenseDate)
  ]
);

export type ControlledSubstanceRecord = typeof controlledSubstanceRecords.$inferSelect;
export type NewControlledSubstanceRecord = typeof controlledSubstanceRecords.$inferInsert;
export type PharmacyControlledSubstance = typeof pharmacyControlledSubstances.$inferSelect;
export type NewPharmacyControlledSubstance = typeof pharmacyControlledSubstances.$inferInsert;

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
    index('idx_bill_pmt_received').on(table.receivedAt),
    index('idx_bill_pmt_tenant_ref').on(table.tenantId, table.referenceNumber)
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

