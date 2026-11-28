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
  procurementVendors,
  procurementItems,
  purchaseInvoices
} from './acute-care-ipd-ot-ed.js';
import {
  radiologyOrders
} from './specialty-mrd-blood-ris-diet.js';

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

/**
 * Enterprise Declarative Partitioned Schema Tables (10M+ Daily Capacity)
 */
export const appointmentsPartitioned = clinicalSchema.table(
  'appointments_partitioned',
  {
    id: uuid('id').defaultRandom().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    branchId: uuid('branch_id'),
    patientId: uuid('patient_id').notNull(),
    doctorId: uuid('doctor_id').notNull(),
    department: varchar('department', { length: 100 }),
    slotTime: timestamp('slot_time', { withTimezone: true }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('SCHEDULED'),
    appointmentType: varchar('appointment_type', { length: 50 }).notNull().default('CONSULTATION'),
    queueToken: varchar('queue_token', { length: 50 }),
    consultationFee: numeric('consultation_fee', { precision: 12, scale: 2 }).notNull().default('0.00'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_apt_tenant_created').on(table.tenantId, table.createdAt),
    index('idx_apt_doctor_slot').on(table.doctorId, table.slotTime)
  ]
);

export const billingInvoicesPartitioned = clinicalSchema.table(
  'billing_invoices_partitioned',
  {
    id: uuid('id').defaultRandom().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    branchId: uuid('branch_id'),
    patientId: uuid('patient_id').notNull(),
    invoiceNumber: varchar('invoice_number', { length: 100 }).notNull(),
    subtotalAmount: numeric('subtotal_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
    discountAmount: numeric('discount_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
    taxAmount: numeric('tax_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
    totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
    paymentStatus: varchar('payment_status', { length: 50 }).notNull().default('PENDING'),
    paymentMode: varchar('payment_mode', { length: 50 }),
    currency: varchar('currency', { length: 10 }).notNull().default('INR'),
    idempotencyKey: varchar('idempotency_key', { length: 128 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_inv_tenant_created').on(table.tenantId, table.createdAt)
  ]
);

export const financialTransactionsPartitioned = clinicalSchema.table(
  'financial_transactions_partitioned',
  {
    id: uuid('id').defaultRandom().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    invoiceId: uuid('invoice_id'),
    transactionType: varchar('transaction_type', { length: 50 }).notNull(),
    gatewayProvider: varchar('gateway_provider', { length: 50 }).notNull(),
    gatewayRefId: varchar('gateway_ref_id', { length: 255 }),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('SUCCESS'),
    reconciliationStatus: varchar('reconciliation_status', { length: 50 }).notNull().default('SETTLED'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_fin_tenant_created').on(table.tenantId, table.createdAt)
  ]
);

export type AppointmentPartitioned = typeof appointmentsPartitioned.$inferSelect;
export type BillingInvoicePartitioned = typeof billingInvoicesPartitioned.$inferSelect;
export type FinancialTransactionPartitioned = typeof financialTransactionsPartitioned.$inferSelect;

// ============================================================================
// PHASE 11: FINANCE + COMMERCIAL ADVANCED ENGINE SCHEMAS
// ============================================================================

export const billingPackages = clinicalSchema.table(
  'billing_packages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id'),
    packageCode: varchar('package_code', { length: 64 }).notNull(),
    packageName: varchar('package_name', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 64 }).notNull().default('GENERAL'),
    totalPrice: numeric('total_price', { precision: 12, scale: 2 }).notNull().default('0.00'),
    validityDays: integer('validity_days').notNull().default(365),
    isActive: boolean('is_active').notNull().default(true),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bp_tenant').on(table.tenantId),
    uniqueIndex('idx_bp_code').on(table.tenantId, table.packageCode)
  ]
);

export const billingPackageItems = clinicalSchema.table(
  'billing_package_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    packageId: uuid('package_id').notNull().references(() => billingPackages.id, { onDelete: 'cascade' }),
    serviceCatalogId: uuid('service_catalog_id'),
    serviceCode: varchar('service_code', { length: 64 }).notNull(),
    serviceName: varchar('service_name', { length: 255 }).notNull(),
    quantityIncluded: integer('quantity_included').notNull().default(1),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull().default('0.00'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_bpi_tenant_pkg').on(table.tenantId, table.packageId)
  ]
);

export const patientPackages = clinicalSchema.table(
  'patient_packages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id'),
    patientId: uuid('patient_id').notNull(),
    packageId: uuid('package_id').notNull().references(() => billingPackages.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id'),
    packageNumber: varchar('package_number', { length: 64 }).notNull(),
    purchasedAt: timestamp('purchased_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    status: varchar('status', { length: 64 }).notNull().default('ACTIVE'),
    totalPrice: numeric('total_price', { precision: 12, scale: 2 }).notNull().default('0.00'),
    notes: text('notes'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_pp_tenant_pat').on(table.tenantId, table.patientId),
    uniqueIndex('idx_pp_code').on(table.tenantId, table.packageNumber)
  ]
);

export const patientPackageConsumptions = clinicalSchema.table(
  'patient_package_consumptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    patientPackageId: uuid('patient_package_id').notNull().references(() => patientPackages.id, { onDelete: 'cascade' }),
    packageItemId: uuid('package_item_id'),
    encounterId: uuid('encounter_id'),
    serviceCode: varchar('service_code', { length: 64 }).notNull(),
    serviceName: varchar('service_name', { length: 255 }).notNull(),
    quantityConsumed: integer('quantity_consumed').notNull().default(1),
    consumedAt: timestamp('consumed_at', { withTimezone: true }).defaultNow().notNull(),
    recordedBy: varchar('recorded_by', { length: 255 }).notNull(),
    notes: text('notes')
  },
  (table) => [
    index('idx_ppc_tenant_pp').on(table.tenantId, table.patientPackageId)
  ]
);

export const patientCreditAccounts = clinicalSchema.table(
  'patient_credit_accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id'),
    patientId: uuid('patient_id').notNull(),
    creditLimit: numeric('credit_limit', { precision: 12, scale: 2 }).notNull().default('0.00'),
    outstandingBalance: numeric('outstanding_balance', { precision: 12, scale: 2 }).notNull().default('0.00'),
    status: varchar('status', { length: 64 }).notNull().default('ACTIVE'),
    authorizedBy: varchar('authorized_by', { length: 255 }).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('idx_pca_tenant_patient').on(table.tenantId, table.patientId)
  ]
);

export const purchaseInvoicePayments = clinicalSchema.table(
  'purchase_invoice_payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id'),
    purchaseInvoiceId: uuid('purchase_invoice_id').notNull().references(() => purchaseInvoices.id, { onDelete: 'cascade' }),
    paymentNumber: varchar('payment_number', { length: 64 }).notNull(),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    paymentMethod: varchar('payment_method', { length: 50 }).notNull().default('BANK_TRANSFER'),
    referenceNumber: varchar('reference_number', { length: 255 }),
    paidAt: timestamp('paid_at', { withTimezone: true }).defaultNow().notNull(),
    paidBy: varchar('paid_by', { length: 255 }).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_pip_tenant_pinv').on(table.tenantId, table.purchaseInvoiceId),
    uniqueIndex('idx_pip_number').on(table.tenantId, table.paymentNumber)
  ]
);

export const billingEodClosings = clinicalSchema.table(
  'billing_eod_closings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    closingDate: varchar('closing_date', { length: 10 }).notNull(),
    grossBilling: numeric('gross_billing', { precision: 14, scale: 2 }).notNull().default('0.00'),
    discountTotal: numeric('discount_total', { precision: 14, scale: 2 }).notNull().default('0.00'),
    taxTotal: numeric('tax_total', { precision: 14, scale: 2 }).notNull().default('0.00'),
    netBilling: numeric('net_billing', { precision: 14, scale: 2 }).notNull().default('0.00'),
    totalCollected: numeric('total_collected', { precision: 14, scale: 2 }).notNull().default('0.00'),
    cashCollected: numeric('cash_collected', { precision: 14, scale: 2 }).notNull().default('0.00'),
    digitalCollected: numeric('digital_collected', { precision: 14, scale: 2 }).notNull().default('0.00'),
    totalRefunded: numeric('total_refunded', { precision: 14, scale: 2 }).notNull().default('0.00'),
    creditIssued: numeric('credit_issued', { precision: 14, scale: 2 }).notNull().default('0.00'),
    arCollected: numeric('ar_collected', { precision: 14, scale: 2 }).notNull().default('0.00'),
    apPaid: numeric('ap_paid', { precision: 14, scale: 2 }).notNull().default('0.00'),
    departmentBreakdown: jsonb('department_breakdown').default({}),
    varianceTotal: numeric('variance_total', { precision: 14, scale: 2 }).notNull().default('0.00'),
    exceptionsCount: integer('exceptions_count').notNull().default(0),
    status: varchar('status', { length: 50 }).notNull().default('CLOSED'),
    closedBy: varchar('closed_by', { length: 255 }).notNull(),
    closedAt: timestamp('closed_at', { withTimezone: true }).defaultNow().notNull(),
    reopenedBy: varchar('reopened_by', { length: 255 }),
    reopenedAt: timestamp('reopened_at', { withTimezone: true }),
    reopenReason: text('reopen_reason'),
    notes: text('notes'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('idx_eod_tenant_branch_date').on(table.tenantId, table.branchId, table.closingDate)
  ]
);

export const gstTaxRates = clinicalSchema.table(
  'gst_tax_rates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    taxCategory: varchar('tax_category', { length: 64 }).notNull(),
    hsnSacCode: varchar('hsn_sac_code', { length: 32 }).notNull(),
    cgstRatePercent: numeric('cgst_rate_percent', { precision: 5, scale: 2 }).notNull().default('0.00'),
    sgstRatePercent: numeric('sgst_rate_percent', { precision: 5, scale: 2 }).notNull().default('0.00'),
    igstRatePercent: numeric('igst_rate_percent', { precision: 5, scale: 2 }).notNull().default('0.00'),
    isExempt: boolean('is_exempt').notNull().default(false),
    description: text('description'),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).defaultNow().notNull(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('idx_gst_tenant_cat').on(table.tenantId, table.taxCategory)
  ]
);

export type BillingPackage = typeof billingPackages.$inferSelect;
export type BillingPackageItem = typeof billingPackageItems.$inferSelect;
export type PatientPackage = typeof patientPackages.$inferSelect;
export type PatientPackageConsumption = typeof patientPackageConsumptions.$inferSelect;
export type PatientCreditAccount = typeof patientCreditAccounts.$inferSelect;
export type PurchaseInvoicePayment = typeof purchaseInvoicePayments.$inferSelect;
export type BillingEodClosing = typeof billingEodClosings.$inferSelect;
export type GstTaxRate = typeof gstTaxRates.$inferSelect;

/**
 * ============================================================================
 * PHASE 12: SUPPLY CHAIN MANAGEMENT (HOSPITAL + PHARMACY + LIMS/PATHOLOGY)
 * ============================================================================
 */

/**
 * 1. Supply Chain Warehouses & Departmental Stores
 */
export const supplyChainWarehouses = clinicalSchema.table(
  'supply_chain_warehouses',
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
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 50 }).notNull().default('DEPARTMENTAL'), // CENTRAL, DEPARTMENTAL, SUB_STORE, TRANSIT
    departmentId: uuid('department_id').references(() => operationalDepartments.id, { onDelete: 'set null' }),
    departmentName: varchar('department_name', { length: 150 }).notNull(), // PHARMACY, LIMS, IPD, OT, ICU, EMERGENCY, BLOOD_BANK, DIETARY, HOUSEKEEPING, BIOMEDICAL, CENTRAL
    location: text('location'),
    isColdChain: boolean('is_cold_chain').notNull().default(false),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, INACTIVE
    managerName: varchar('manager_name', { length: 150 }),
    contactNumber: varchar('contact_number', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_sc_wh_tenant').on(table.tenantId),
    index('idx_sc_wh_org').on(table.organizationId),
    index('idx_sc_wh_code').on(table.code),
    index('idx_sc_wh_dept').on(table.departmentName),
    index('idx_sc_wh_status').on(table.status),
    uniqueIndex('idx_sc_wh_tenant_code').on(table.tenantId, table.code)
  ]
);

/**
 * 2. Supply Chain Storage Locations (Racks, Bins, Shelves, Cold Chambers)
 */
export const supplyChainLocations = clinicalSchema.table(
  'supply_chain_locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => supplyChainWarehouses.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 50 }).notNull(),
    zone: varchar('zone', { length: 50 }),
    aisle: varchar('aisle', { length: 50 }),
    rack: varchar('rack', { length: 50 }),
    shelf: varchar('shelf', { length: 50 }),
    bin: varchar('bin', { length: 50 }),
    isTemperatureControlled: boolean('is_temperature_controlled').notNull().default(false),
    minTempCelsius: numeric('min_temp_celsius', { precision: 5, scale: 2 }),
    maxTempCelsius: numeric('max_temp_celsius', { precision: 5, scale: 2 }),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, FULL, MAINTENANCE
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_sc_loc_tenant').on(table.tenantId),
    index('idx_sc_loc_wh').on(table.warehouseId),
    index('idx_sc_loc_code').on(table.code)
  ]
);

/**
 * 3. Supply Chain Inventory (Aggregated Stock Levels per Item per Warehouse)
 */
export const supplyChainInventory = clinicalSchema.table(
  'supply_chain_inventory',
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
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => supplyChainWarehouses.id, { onDelete: 'cascade' }),
    procurementItemId: uuid('procurement_item_id')
      .notNull()
      .references(() => procurementItems.id, { onDelete: 'cascade' }),
    itemCode: varchar('item_code', { length: 50 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    currentStock: integer('current_stock').notNull().default(0),
    reservedStock: integer('reserved_stock').notNull().default(0),
    availableStock: integer('available_stock').notNull().default(0),
    reorderLevel: integer('reorder_level').notNull().default(10),
    safetyStock: integer('safety_stock').notNull().default(5),
    minStock: integer('min_stock').notNull().default(5),
    maxStock: integer('max_stock').notNull().default(500),
    unitOfMeasure: varchar('unit_of_measure', { length: 50 }).notNull().default('UNIT'),
    lastRestockedAt: timestamp('last_restocked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_sc_inv_tenant').on(table.tenantId),
    index('idx_sc_inv_wh').on(table.warehouseId),
    index('idx_sc_inv_item').on(table.procurementItemId),
    index('idx_sc_inv_code').on(table.itemCode),
    uniqueIndex('idx_sc_inv_wh_item').on(table.warehouseId, table.procurementItemId)
  ]
);

/**
 * 4. Supply Chain Batches (Batch/Lot specific tracking with Expiry & Quarantines)
 */
export const supplyChainBatches = clinicalSchema.table(
  'supply_chain_batches',
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
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => supplyChainWarehouses.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id').references(() => supplyChainLocations.id, { onDelete: 'set null' }),
    procurementItemId: uuid('procurement_item_id')
      .notNull()
      .references(() => procurementItems.id, { onDelete: 'cascade' }),
    itemCode: varchar('item_code', { length: 50 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    batchNumber: varchar('batch_number', { length: 100 }).notNull(),
    expiryDate: timestamp('expiry_date', { withTimezone: true }).notNull(),
    mfgDate: timestamp('mfg_date', { withTimezone: true }),
    initialQuantity: integer('initial_quantity').notNull().default(0),
    currentQuantity: integer('current_quantity').notNull().default(0),
    reservedQuantity: integer('reserved_quantity').notNull().default(0),
    availableQuantity: integer('available_quantity').notNull().default(0),
    unitCost: numeric('unit_cost', { precision: 12, scale: 2 }).notNull().default('0.00'),
    mrp: numeric('mrp', { precision: 12, scale: 2 }),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, NEAR_EXPIRY, EXPIRED, QUARANTINED, RECALLED, DEPLETED
    quarantineReason: text('quarantine_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_sc_batch_tenant').on(table.tenantId),
    index('idx_sc_batch_wh').on(table.warehouseId),
    index('idx_sc_batch_item').on(table.procurementItemId),
    index('idx_sc_batch_num').on(table.batchNumber),
    index('idx_sc_batch_exp').on(table.expiryDate),
    index('idx_sc_batch_status').on(table.status),
    uniqueIndex('idx_sc_batch_wh_item_num').on(table.warehouseId, table.procurementItemId, table.batchNumber)
  ]
);

/**
 * 5. Supply Chain Stock Ledger (Immutable append-only movement journal)
 */
export const supplyChainStockLedger = clinicalSchema.table(
  'supply_chain_stock_ledger',
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
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => supplyChainWarehouses.id, { onDelete: 'cascade' }),
    procurementItemId: uuid('procurement_item_id')
      .notNull()
      .references(() => procurementItems.id, { onDelete: 'cascade' }),
    batchId: uuid('batch_id').references(() => supplyChainBatches.id, { onDelete: 'set null' }),
    itemCode: varchar('item_code', { length: 50 }).notNull(),
    batchNumber: varchar('batch_number', { length: 100 }),
    movementType: varchar('movement_type', { length: 50 }).notNull(), // GRN_RECEIPT, CONSUMPTION, TRANSFER_OUT, TRANSFER_IN, ADJUSTMENT_ADD, ADJUSTMENT_DEDUCT, RETURN_TO_VENDOR, RECALL_QUARANTINE, CYCLE_COUNT_ADJUSTMENT
    quantity: integer('quantity').notNull(), // signed integer
    balanceBefore: integer('balance_before').notNull(),
    balanceAfter: integer('balance_after').notNull(),
    referenceType: varchar('reference_type', { length: 50 }).notNull(), // GRN, PO, REQUISITION, TRANSFER, CONSUMPTION, STOCK_COUNT, RECALL, ADJUSTMENT
    referenceId: varchar('reference_id', { length: 100 }).notNull(),
    departmentName: varchar('department_name', { length: 150 }),
    performedBy: varchar('performed_by', { length: 150 }).notNull(),
    performedRole: varchar('performed_role', { length: 100 }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_sc_ledg_tenant').on(table.tenantId),
    index('idx_sc_ledg_wh').on(table.warehouseId),
    index('idx_sc_ledg_item').on(table.procurementItemId),
    index('idx_sc_ledg_batch').on(table.batchId),
    index('idx_sc_ledg_type').on(table.movementType),
    index('idx_sc_ledg_ref').on(table.referenceType, table.referenceId)
  ]
);

/**
 * 6. Supply Chain Inter-Store Transfers
 */
export const supplyChainTransfers = clinicalSchema.table(
  'supply_chain_transfers',
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
    transferNumber: varchar('transfer_number', { length: 100 }).notNull().unique(),
    sourceWarehouseId: uuid('source_warehouse_id')
      .notNull()
      .references(() => supplyChainWarehouses.id, { onDelete: 'cascade' }),
    sourceWarehouseName: varchar('source_warehouse_name', { length: 255 }).notNull(),
    destinationWarehouseId: uuid('destination_warehouse_id')
      .notNull()
      .references(() => supplyChainWarehouses.id, { onDelete: 'cascade' }),
    destinationWarehouseName: varchar('destination_warehouse_name', { length: 255 }).notNull(),
    requestingDepartment: varchar('requesting_department', { length: 150 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('REQUESTED'), // REQUESTED, APPROVED, DISPATCHED, IN_TRANSIT, RECEIVED, REJECTED, CANCELLED
    requestedBy: varchar('requested_by', { length: 150 }).notNull(),
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
    approvedBy: varchar('approved_by', { length: 150 }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    dispatchedBy: varchar('dispatched_by', { length: 150 }),
    dispatchedAt: timestamp('dispatched_at', { withTimezone: true }),
    receivedBy: varchar('received_by', { length: 150 }),
    receivedAt: timestamp('received_at', { withTimezone: true }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_sc_trf_tenant').on(table.tenantId),
    index('idx_sc_trf_num').on(table.transferNumber),
    index('idx_sc_trf_src').on(table.sourceWarehouseId),
    index('idx_sc_trf_dst').on(table.destinationWarehouseId),
    index('idx_sc_trf_status').on(table.status)
  ]
);

/**
 * 7. Supply Chain Transfer Line Items
 */
export const supplyChainTransferItems = clinicalSchema.table(
  'supply_chain_transfer_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    transferId: uuid('transfer_id')
      .notNull()
      .references(() => supplyChainTransfers.id, { onDelete: 'cascade' }),
    procurementItemId: uuid('procurement_item_id')
      .notNull()
      .references(() => procurementItems.id, { onDelete: 'cascade' }),
    batchId: uuid('batch_id').references(() => supplyChainBatches.id, { onDelete: 'set null' }),
    itemCode: varchar('item_code', { length: 50 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    batchNumber: varchar('batch_number', { length: 100 }),
    requestedQuantity: integer('requested_quantity').notNull(),
    dispatchedQuantity: integer('dispatched_quantity').notNull().default(0),
    receivedQuantity: integer('received_quantity').notNull().default(0),
    unit: varchar('unit', { length: 50 }).notNull().default('UNIT'),
    status: varchar('status', { length: 50 }).notNull().default('PENDING'), // PENDING, DISPATCHED, RECEIVED, DISCREPANCY
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_sc_trf_item_tenant').on(table.tenantId),
    index('idx_sc_trf_item_trf').on(table.transferId),
    index('idx_sc_trf_item_proc').on(table.procurementItemId)
  ]
);

/**
 * 8. Supply Chain Consumptions (Clinical & Departmental Material Consumption)
 */
export const supplyChainConsumptions = clinicalSchema.table(
  'supply_chain_consumptions',
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
    consumptionNumber: varchar('consumption_number', { length: 100 }).notNull().unique(),
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => supplyChainWarehouses.id, { onDelete: 'cascade' }),
    departmentName: varchar('department_name', { length: 150 }).notNull(), // PHARMACY, LIMS, IPD, OT, ICU, EMERGENCY, BLOOD_BANK, DIETARY, HOUSEKEEPING, BIOMEDICAL
    patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'set null' }),
    encounterId: uuid('encounter_id').references(() => encounters.id, { onDelete: 'set null' }),
    procedureName: varchar('procedure_name', { length: 255 }),
    consumedBy: varchar('consumed_by', { length: 150 }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }).notNull().defaultNow(),
    totalCost: numeric('total_cost', { precision: 14, scale: 2 }).notNull().default('0.00'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_sc_csm_tenant').on(table.tenantId),
    index('idx_sc_csm_wh').on(table.warehouseId),
    index('idx_sc_csm_num').on(table.consumptionNumber),
    index('idx_sc_csm_dept').on(table.departmentName),
    index('idx_sc_csm_pat').on(table.patientId),
    index('idx_sc_csm_enc').on(table.encounterId)
  ]
);

/**
 * 9. Supply Chain Consumption Line Items
 */
export const supplyChainConsumptionItems = clinicalSchema.table(
  'supply_chain_consumption_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    consumptionId: uuid('consumption_id')
      .notNull()
      .references(() => supplyChainConsumptions.id, { onDelete: 'cascade' }),
    procurementItemId: uuid('procurement_item_id')
      .notNull()
      .references(() => procurementItems.id, { onDelete: 'cascade' }),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => supplyChainBatches.id, { onDelete: 'cascade' }),
    itemCode: varchar('item_code', { length: 50 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    batchNumber: varchar('batch_number', { length: 100 }).notNull(),
    quantity: integer('quantity').notNull(),
    unitCost: numeric('unit_cost', { precision: 12, scale: 2 }).notNull().default('0.00'),
    totalCost: numeric('total_cost', { precision: 14, scale: 2 }).notNull().default('0.00'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_sc_csm_item_tenant').on(table.tenantId),
    index('idx_sc_csm_item_csm').on(table.consumptionId),
    index('idx_sc_csm_item_proc').on(table.procurementItemId),
    index('idx_sc_csm_item_batch').on(table.batchId)
  ]
);

/**
 * 10. Supply Chain Stock Counts & Cycle Audits
 */
export const supplyChainStockCounts = clinicalSchema.table(
  'supply_chain_stock_counts',
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
    countNumber: varchar('count_number', { length: 100 }).notNull().unique(),
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => supplyChainWarehouses.id, { onDelete: 'cascade' }),
    countType: varchar('count_type', { length: 50 }).notNull().default('CYCLE'), // CYCLE, ANNUAL, SPOT_CHECK, BLIND
    status: varchar('status', { length: 50 }).notNull().default('PLANNED'), // PLANNED, IN_PROGRESS, REVIEW_REQUIRED, RECONCILED, CANCELLED
    initiatedBy: varchar('initiated_by', { length: 150 }).notNull(),
    conductedBy: varchar('conducted_by', { length: 150 }),
    reconciledBy: varchar('reconciled_by', { length: 150 }),
    initiatedAt: timestamp('initiated_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    reconciledAt: timestamp('reconciled_at', { withTimezone: true }),
    totalExpectedQuantity: integer('total_expected_quantity').notNull().default(0),
    totalCountedQuantity: integer('total_counted_quantity').notNull().default(0),
    totalVarianceQuantity: integer('total_variance_quantity').notNull().default(0),
    totalVarianceValue: numeric('total_variance_value', { precision: 14, scale: 2 }).notNull().default('0.00'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_sc_cnt_tenant').on(table.tenantId),
    index('idx_sc_cnt_wh').on(table.warehouseId),
    index('idx_sc_cnt_num').on(table.countNumber),
    index('idx_sc_cnt_status').on(table.status)
  ]
);

/**
 * 11. Supply Chain Stock Count Items
 */
export const supplyChainStockCountItems = clinicalSchema.table(
  'supply_chain_stock_count_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    stockCountId: uuid('stock_count_id')
      .notNull()
      .references(() => supplyChainStockCounts.id, { onDelete: 'cascade' }),
    procurementItemId: uuid('procurement_item_id')
      .notNull()
      .references(() => procurementItems.id, { onDelete: 'cascade' }),
    batchId: uuid('batch_id').references(() => supplyChainBatches.id, { onDelete: 'set null' }),
    itemCode: varchar('item_code', { length: 50 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    batchNumber: varchar('batch_number', { length: 100 }),
    expectedQuantity: integer('expected_quantity').notNull(),
    countedQuantity: integer('counted_quantity'),
    varianceQuantity: integer('variance_quantity').notNull().default(0),
    varianceValue: numeric('variance_value', { precision: 12, scale: 2 }).notNull().default('0.00'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_sc_cnt_item_tenant').on(table.tenantId),
    index('idx_sc_cnt_item_cnt').on(table.stockCountId),
    index('idx_sc_cnt_item_proc').on(table.procurementItemId)
  ]
);

/**
 * 12. Supply Chain Batch Recalls & Quarantines
 */
export const supplyChainRecalls = clinicalSchema.table(
  'supply_chain_recalls',
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
    recallNumber: varchar('recall_number', { length: 100 }).notNull().unique(),
    procurementItemId: uuid('procurement_item_id')
      .notNull()
      .references(() => procurementItems.id, { onDelete: 'cascade' }),
    itemCode: varchar('item_code', { length: 50 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    batchNumber: varchar('batch_number', { length: 100 }).notNull(),
    vendorId: uuid('vendor_id').references(() => procurementVendors.id, { onDelete: 'set null' }),
    recallClass: varchar('recall_class', { length: 50 }).notNull().default('CLASS_II'), // CLASS_I, CLASS_II, CLASS_III, INTERNAL_QUARANTINE
    reason: text('reason').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, INVESTIGATING, COMPLETED, REVOKED
    initiatedBy: varchar('initiated_by', { length: 150 }).notNull(),
    totalQuarantinedQuantity: integer('total_quarantined_quantity').notNull().default(0),
    dispositionAction: varchar('disposition_action', { length: 50 }).notNull().default('PENDING'), // RETURN_TO_VENDOR, DESTROYED, RELEASED, PENDING
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_sc_rcl_tenant').on(table.tenantId),
    index('idx_sc_rcl_item').on(table.procurementItemId),
    index('idx_sc_rcl_batch').on(table.batchNumber),
    index('idx_sc_rcl_num').on(table.recallNumber),
    index('idx_sc_rcl_status').on(table.status)
  ]
);

export type SupplyChainWarehouse = typeof supplyChainWarehouses.$inferSelect;
export type NewSupplyChainWarehouse = typeof supplyChainWarehouses.$inferInsert;

export type SupplyChainLocation = typeof supplyChainLocations.$inferSelect;
export type NewSupplyChainLocation = typeof supplyChainLocations.$inferInsert;

export type SupplyChainInventory = typeof supplyChainInventory.$inferSelect;
export type NewSupplyChainInventory = typeof supplyChainInventory.$inferInsert;

export type SupplyChainBatch = typeof supplyChainBatches.$inferSelect;
export type NewSupplyChainBatch = typeof supplyChainBatches.$inferInsert;

export type SupplyChainStockLedger = typeof supplyChainStockLedger.$inferSelect;
export type NewSupplyChainStockLedger = typeof supplyChainStockLedger.$inferInsert;

export type SupplyChainTransfer = typeof supplyChainTransfers.$inferSelect;
export type NewSupplyChainTransfer = typeof supplyChainTransfers.$inferInsert;

export type SupplyChainTransferItem = typeof supplyChainTransferItems.$inferSelect;
export type NewSupplyChainTransferItem = typeof supplyChainTransferItems.$inferInsert;

export type SupplyChainConsumption = typeof supplyChainConsumptions.$inferSelect;
export type NewSupplyChainConsumption = typeof supplyChainConsumptions.$inferInsert;

export type SupplyChainConsumptionItem = typeof supplyChainConsumptionItems.$inferSelect;
export type NewSupplyChainConsumptionItem = typeof supplyChainConsumptionItems.$inferInsert;

export type SupplyChainStockCount = typeof supplyChainStockCounts.$inferSelect;
export type NewSupplyChainStockCount = typeof supplyChainStockCounts.$inferInsert;

export type SupplyChainStockCountItem = typeof supplyChainStockCountItems.$inferSelect;
export type NewSupplyChainStockCountItem = typeof supplyChainStockCountItems.$inferInsert;

export type SupplyChainRecall = typeof supplyChainRecalls.$inferSelect;
export type NewSupplyChainRecall = typeof supplyChainRecalls.$inferInsert;

/**
 * ============================================================================
 * COMMERCIAL HEGEMONY & REVENUE GENERATION PILLARS
 * Standards: Practo / Apollo 24/7 / Tata 1mg / Epic Systems / Bajaj Finserv Health
 * ============================================================================
 */

// 1. Surgery Financing & 0% Checkout EMI Engine (vs Practo Care & Bajaj Finserv Health)
export const surgeryEmiApplications = clinicalSchema.table('surgery_emi_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  organizationId: uuid('organization_id'),
  partnerId: uuid('partner_id'),
  patientId: uuid('patient_id'),
  patientName: varchar('patient_name', { length: 255 }).notNull(),
  patientPhone: varchar('patient_phone', { length: 50 }).notNull(),
  procedureName: varchar('procedure_name', { length: 255 }).notNull(),
  packageAmount: numeric('package_amount', { precision: 12, scale: 2 }).notNull(),
  downPayment: numeric('down_payment', { precision: 12, scale: 2 }).default('0.00'),
  loanAmount: numeric('loan_amount', { precision: 12, scale: 2 }).notNull(),
  tenureMonths: integer('tenure_months').notNull(),
  monthlyEmiAmount: numeric('monthly_emi_amount', { precision: 12, scale: 2 }).notNull(),
  subventionRatePct: numeric('subvention_rate_pct', { precision: 5, scale: 2 }).default('3.50'),
  subventionAmount: numeric('subvention_amount', { precision: 12, scale: 2 }).notNull(),
  financingPartner: varchar('financing_partner', { length: 50 }).notNull().default('BAJAJ_FINSERV'),
  cibilScoreBand: varchar('cibil_score_band', { length: 50 }).default('750_EXCELLENT'),
  status: varchar('status', { length: 50 }).notNull().default('PRE_APPROVED'),
  loanReferenceNumber: varchar('loan_reference_number', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const surgeryConciergeLeads = clinicalSchema.table('surgery_concierge_leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  organizationId: uuid('organization_id'),
  patientName: varchar('patient_name', { length: 255 }).notNull(),
  patientPhone: varchar('patient_phone', { length: 50 }).notNull(),
  procedureName: varchar('procedure_name', { length: 255 }).notNull(),
  specialty: varchar('specialty', { length: 100 }).notNull(),
  surgeonName: varchar('surgeon_name', { length: 255 }).notNull(),
  packageCost: numeric('package_cost', { precision: 12, scale: 2 }).notNull(),
  stage: varchar('stage', { length: 50 }).notNull().default('CONSULTATION'),
  emiOpted: boolean('emi_opted').default(false),
  emiTenureMonths: integer('emi_tenure_months'),
  monthlyEmiAmount: numeric('monthly_emi_amount', { precision: 12, scale: 2 }),
  tpaApprovedAmount: numeric('tpa_approved_amount', { precision: 12, scale: 2 }).default('0.00'),
  otDate: varchar('ot_date', { length: 100 }),
  otRoom: varchar('ot_room', { length: 100 }),
  bedAssigned: varchar('bed_assigned', { length: 100 }),
  careBuddy: varchar('care_buddy', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// 2. Doctor Revenue Share & NMC-Compliant Split Payout Ledger (vs KareXpert & Practo Ray)
export const doctorPayoutConfigurations = clinicalSchema.table('doctor_payout_configurations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  organizationId: uuid('organization_id'),
  doctorId: uuid('doctor_id'),
  doctorName: varchar('doctor_name', { length: 255 }).notNull(),
  opdConsultationCutPct: numeric('opd_consultation_cut_pct', { precision: 5, scale: 2 }).default('70.00'),
  hospitalFacilityUsageCutPct: numeric('hospital_facility_usage_cut_pct', { precision: 5, scale: 2 }).default('30.00'),
  ipdProcedureCutPct: numeric('ipd_procedure_cut_pct', { precision: 5, scale: 2 }).default('75.00'),
  emergencyNightSurgeBonusPct: numeric('emergency_night_surge_bonus_pct', { precision: 5, scale: 2 }).default('50.00'),
  tdsRatePct: numeric('tds_rate_pct', { precision: 5, scale: 2 }).default('10.00'),
  fixedRoomRentalDeduction: numeric('fixed_room_rental_deduction', { precision: 12, scale: 2 }).default('150.00'),
  nmcComplianceTag: varchar('nmc_compliance_tag', { length: 100 }).default('CLINICAL_FACILITY_INFRASTRUCTURE_USAGE'),
  status: varchar('status', { length: 50 }).default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const doctorSettlementVouchers = clinicalSchema.table('doctor_settlement_vouchers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  organizationId: uuid('organization_id'),
  voucherNumber: varchar('voucher_number', { length: 100 }).notNull().unique(),
  doctorId: uuid('doctor_id'),
  doctorName: varchar('doctor_name', { length: 255 }).notNull(),
  settlementCycle: varchar('settlement_cycle', { length: 50 }).default('EOD_DAILY'),
  periodStartDate: timestamp('period_start_date', { withTimezone: true }).notNull(),
  periodEndDate: timestamp('period_end_date', { withTimezone: true }).notNull(),
  totalConsultationsCount: integer('total_consultations_count').default(0),
  grossConsultationBilled: numeric('gross_consultation_billed', { precision: 12, scale: 2 }).notNull(),
  facilityUsageFeeDeducted: numeric('facility_usage_fee_deducted', { precision: 12, scale: 2 }).notNull(),
  tdsDeducted: numeric('tds_deducted', { precision: 12, scale: 2 }).notNull(),
  netPayableToDoctor: numeric('net_payable_to_doctor', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).default('GENERATED'),
  nmcEthicsDeclaration: text('nmc_ethics_declaration'),
  transactionReference: varchar('transaction_reference', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// 3. Recurring Subscription & Chronic Care Pass (vs Apollo Circle & Tata 1mg Care Plan)
export const patientCarePasses = clinicalSchema.table('patient_care_passes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  patientId: uuid('patient_id'),
  patientName: varchar('patient_name', { length: 255 }).notNull(),
  patientPhone: varchar('patient_phone', { length: 50 }).notNull(),
  passCode: varchar('pass_code', { length: 100 }).notNull(),
  passTier: varchar('pass_tier', { length: 100 }).notNull(),
  annualFee: numeric('annual_fee', { precision: 12, scale: 2 }).notNull(),
  unlimitedOpdFollowupsActive: boolean('unlimited_opd_followups_active').default(true),
  pharmacyDiscountPct: numeric('pharmacy_discount_pct', { precision: 5, scale: 2 }).default('15.00'),
  freeHomeCollectionAllowance: integer('free_home_collection_allowance').default(12),
  freeHomeCollectionUsed: integer('free_home_collection_used').default(0),
  status: varchar('status', { length: 50 }).default('ACTIVE'),
  autoDebitWebhookActive: boolean('auto_debit_webhook_active').default(true),
  churnRisk: varchar('churn_risk', { length: 50 }).default('LOW'),
  expiryDate: timestamp('expiry_date', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const patientHealthWallets = clinicalSchema.table('patient_health_wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  patientId: uuid('patient_id'),
  patientPhone: varchar('patient_phone', { length: 50 }).notNull(),
  walletBalance: numeric('wallet_balance', { precision: 12, scale: 2 }).default('0.00'),
  bonusCreditBalance: numeric('bonus_credit_balance', { precision: 12, scale: 2 }).default('0.00'),
  totalSavedLifetime: numeric('total_saved_lifetime', { precision: 12, scale: 2 }).default('0.00'),
  status: varchar('status', { length: 50 }).default('ACTIVE'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// 4. Pharmacy Margin Optimization & PMBJP Generic Substitution (vs Tata 1mg & PharmEasy)
export const pharmacyGenericSubstitutions = clinicalSchema.table('pharmacy_generic_substitutions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  brandMedicationName: varchar('brand_medication_name', { length: 255 }).notNull(),
  brandComposition: varchar('brand_composition', { length: 255 }).notNull(),
  brandPackSize: varchar('brand_pack_size', { length: 100 }),
  brandMrp: numeric('brand_mrp', { precision: 12, scale: 2 }).notNull(),
  pmbjpGenericName: varchar('pmbjp_generic_name', { length: 255 }).notNull(),
  pmbjpGenericCode: varchar('pmbjp_generic_code', { length: 100 }).notNull(),
  pmbjpMrp: numeric('pmbjp_mrp', { precision: 12, scale: 2 }).notNull(),
  patientSavingsPct: numeric('patient_savings_pct', { precision: 5, scale: 2 }).notNull(),
  hospitalMarginPct: numeric('hospital_margin_pct', { precision: 5, scale: 2 }).notNull(),
  inStockBatchesCount: integer('in_stock_batches_count').default(4),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const pharmacyChronicRefillRadars = clinicalSchema.table('pharmacy_chronic_refill_radars', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  patientId: uuid('patient_id'),
  patientName: varchar('patient_name', { length: 255 }).notNull(),
  patientPhone: varchar('patient_phone', { length: 50 }).notNull(),
  medicationName: varchar('medication_name', { length: 255 }).notNull(),
  dailyDosagePills: integer('daily_dosage_pills').default(1),
  daysSupplied: integer('days_supplied').default(30),
  dispensedDate: timestamp('dispensed_date', { withTimezone: true }).notNull(),
  exhaustionDueDate: timestamp('exhaustion_due_date', { withTimezone: true }).notNull(),
  daysRemaining: integer('days_remaining').default(3),
  whatsappRefillDispatched: boolean('whatsapp_refill_dispatched').default(false),
  reorderStatus: varchar('reorder_status', { length: 50 }).default('RADAR_ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// 5. Home Diagnostics & Phlebotomist Logistics Fleet (vs Apollo 24/7 & Tata 1mg Labs)
export const phlebotomistFleets = clinicalSchema.table('phlebotomist_fleets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  phlebotomistName: varchar('phlebotomist_name', { length: 255 }).notNull(),
  mobileNumber: varchar('mobile_number', { length: 50 }).notNull(),
  currentGeoZone: varchar('current_geo_zone', { length: 100 }).notNull(),
  assignedVehicle: varchar('assigned_vehicle', { length: 50 }).default('TWO_WHEELER_EV'),
  dutyStatus: varchar('duty_status', { length: 50 }).default('ON_DUTY'),
  todayPickupsCompleted: integer('today_pickups_completed').default(0),
  totalEarningsToday: numeric('total_earnings_today', { precision: 12, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const homeCollectionOrders = clinicalSchema.table('home_collection_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  orderNumber: varchar('order_number', { length: 100 }).notNull().unique(),
  patientName: varchar('patient_name', { length: 255 }).notNull(),
  patientPhone: varchar('patient_phone', { length: 50 }).notNull(),
  patientAddress: text('patient_address').notNull(),
  geoZone: varchar('geo_zone', { length: 100 }).notNull(),
  testsRequested: text('tests_requested').notNull(),
  scheduledSlot: varchar('scheduled_slot', { length: 100 }).notNull(),
  phlebotomistId: uuid('phlebotomist_id'),
  phlebotomistName: varchar('phlebotomist_name', { length: 255 }),
  vacutainerBarcode: varchar('vacutainer_barcode', { length: 100 }),
  coldChainCelsius: numeric('cold_chain_celsius', { precision: 4, scale: 1 }).default('4.0'),
  coldChainStatus: varchar('cold_chain_status', { length: 50 }).default('OPTIMAL_CHILLED'),
  convenienceSurchargeFee: numeric('convenience_surcharge_fee', { precision: 12, scale: 2 }).default('150.00'),
  phlebotomistSplitFee: numeric('phlebotomist_split_fee', { precision: 12, scale: 2 }).default('90.00'),
  labSplitFee: numeric('lab_split_fee', { precision: 12, scale: 2 }).default('60.00'),
  status: varchar('status', { length: 50 }).default('SCHEDULED'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// 6. RCM Revenue Cycle Defense & Pre-Auth Scrubber (vs Epic Systems & KareXpert)
export const rcmPreauthScrubberRules = clinicalSchema.table('rcm_preauth_scrubber_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  ruleCode: varchar('rule_code', { length: 100 }).notNull().unique(),
  ruleCategory: varchar('rule_category', { length: 100 }).notNull(),
  severity: varchar('severity', { length: 50 }).notNull().default('CRITICAL_DENIAL_RISK'),
  description: text('description').notNull(),
  irdaiNormReference: varchar('irdai_norm_reference', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const rcmClaimScrubLogs = clinicalSchema.table('rcm_claim_scrub_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  claimNumber: varchar('claim_number', { length: 100 }).notNull(),
  patientUhid: varchar('patient_uhid', { length: 100 }).notNull(),
  patientName: varchar('patient_name', { length: 255 }).notNull(),
  procedureName: varchar('procedure_name', { length: 255 }).notNull(),
  proposedClaimAmount: numeric('proposed_claim_amount', { precision: 12, scale: 2 }).notNull(),
  scrubberScore: integer('scrubber_score').notNull().default(85),
  denialProbabilityPct: numeric('denial_probability_pct', { precision: 5, scale: 2 }).notNull().default('12.50'),
  flaggedViolationsCount: integer('flagged_violations_count').notNull().default(0),
  detectedLeakageAmount: numeric('detected_leakage_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  findings: jsonb('findings').default([]),
  scrubStatus: varchar('scrub_status', { length: 50 }).default('CLEAN_SUBMIT_APPROVED'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Complete Commercial Hegemony Tables

export const doctorVolumePayoutTiers = clinicalSchema.table('doctor_volume_payout_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  doctorId: uuid('doctor_id'),
  doctorName: varchar('doctor_name', { length: 255 }).notNull(),
  tierLabel: varchar('tier_label', { length: 100 }).notNull(),
  minConsultations: integer('min_consultations').notNull(),
  maxConsultations: integer('max_consultations').notNull(),
  doctorSplitPct: numeric('doctor_split_pct', { precision: 5, scale: 2 }).notNull(),
  clinicMarginPct: numeric('clinic_margin_pct', { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const patientFamilyHealthMembers = clinicalSchema.table('patient_family_health_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  primaryPatientId: uuid('primary_patient_id'),
  primaryPatientPhone: varchar('primary_patient_phone', { length: 50 }).notNull(),
  memberName: varchar('member_name', { length: 255 }).notNull(),
  relationship: varchar('relationship', { length: 50 }).notNull(),
  memberPhone: varchar('member_phone', { length: 50 }),
  memberAge: integer('member_age'),
  monthlySpendLimit: numeric('monthly_spend_limit', { precision: 12, scale: 2 }).default('5000.00'),
  currentMonthSpent: numeric('current_month_spent', { precision: 12, scale: 2 }).default('0.00'),
  walletSpendingEnabled: boolean('wallet_spending_enabled').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const pharmacyB2bPurchaseOrders = clinicalSchema.table('pharmacy_b2b_purchase_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  poNumber: varchar('po_number', { length: 100 }).notNull().unique(),
  vendorName: varchar('vendor_name', { length: 255 }).notNull(),
  paymentTerms: varchar('payment_terms', { length: 50 }).default('NET_30'),
  totalItemsCount: integer('total_items_count').default(1),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  gstInputCredit: numeric('gst_input_credit', { precision: 12, scale: 2 }).notNull(),
  expectedGrossMarginPct: numeric('expected_gross_margin_pct', { precision: 5, scale: 2 }).default('28.50'),
  status: varchar('status', { length: 50 }).default('PO_GENERATED'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const pharmacyRtvDebitNotes = clinicalSchema.table('pharmacy_rtv_debit_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  debitNoteNumber: varchar('debit_note_number', { length: 100 }).notNull().unique(),
  vendorName: varchar('vendor_name', { length: 255 }).notNull(),
  medicationName: varchar('medication_name', { length: 255 }).notNull(),
  batchNumber: varchar('batch_number', { length: 100 }).notNull(),
  expiryDate: timestamp('expiry_date', { withTimezone: true }).notNull(),
  daysToExpiry: integer('days_to_expiry').notNull(),
  quantity: integer('quantity').notNull(),
  debitAmount: numeric('debit_amount', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).default('DEBIT_NOTE_DISPATCHED'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const diagnosticHealthPackages = clinicalSchema.table('diagnostic_health_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  packageCode: varchar('package_code', { length: 100 }).notNull().unique(),
  packageName: varchar('package_name', { length: 255 }).notNull(),
  parametersCount: integer('parameters_count').notNull(),
  packageMrp: numeric('package_mrp', { precision: 12, scale: 2 }).notNull(),
  bundledTestNames: jsonb('bundled_test_names').default([]),
  fastingRequired: boolean('fasting_required').default(true),
  vialsRequired: jsonb('vials_required').default([]),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const corporateTpaClients = clinicalSchema.table('corporate_tpa_clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  clientCode: varchar('client_code', { length: 100 }).notNull().unique(),
  clientName: varchar('client_name', { length: 255 }).notNull(),
  clientType: varchar('client_type', { length: 50 }).default('CORPORATE_TPA'),
  creditLimit: numeric('credit_limit', { precision: 12, scale: 2 }).notNull(),
  outstandingReceivable: numeric('outstanding_receivable', { precision: 12, scale: 2 }).default('0.00'),
  aging0To30Days: numeric('aging_0_30_days', { precision: 12, scale: 2 }).default('0.00'),
  aging31To60Days: numeric('aging_31_60_days', { precision: 12, scale: 2 }).default('0.00'),
  aging61To90Days: numeric('aging_61_90_days', { precision: 12, scale: 2 }).default('0.00'),
  aging90PlusDays: numeric('aging_90_plus_days', { precision: 12, scale: 2 }).default('0.00'),
  nhcxPayerCode: varchar('nhcx_payer_code', { length: 100 }),
  contractValidUntil: timestamp('contract_valid_until', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const saasCommunicationWallets = clinicalSchema.table('saas_communication_wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().unique(),
  walletBalance: numeric('wallet_balance', { precision: 12, scale: 2 }).default('2500.00'),
  smsRate: numeric('sms_rate', { precision: 5, scale: 2 }).default('0.20'),
  whatsappRate: numeric('whatsapp_rate', { precision: 5, scale: 2 }).default('0.75'),
  totalSmsSent: integer('total_sms_sent').default(1240),
  totalWhatsappSent: integer('total_whatsapp_sent').default(3410),
  autoRechargeThreshold: numeric('auto_recharge_threshold', { precision: 12, scale: 2 }).default('500.00'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const saasMarketplaceAddons = clinicalSchema.table('saas_marketplace_addons', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  addonCode: varchar('addon_code', { length: 100 }).notNull(),
  addonName: varchar('addon_name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  monthlyFee: numeric('monthly_fee', { precision: 12, scale: 2 }).notNull(),
  isEnabled: boolean('is_enabled').default(false),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const prescriptionTemplates = clinicalSchema.table('prescription_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  doctorId: uuid('doctor_id'),
  templateCode: varchar('template_code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  icon: varchar('icon', { length: 50 }).default('🩺'),
  category: varchar('category', { length: 100 }).notNull(),
  chiefComplaint: text('chief_complaint'),
  diagnosis: varchar('diagnosis', { length: 255 }).notNull(),
  icd10Code: varchar('icd10_code', { length: 50 }),
  treatmentPlan: text('treatment_plan'),
  medications: jsonb('medications').default([]),
  labTests: jsonb('lab_tests').default([]),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export type PrescriptionTemplate = typeof prescriptionTemplates.$inferSelect;
export type NewPrescriptionTemplate = typeof prescriptionTemplates.$inferInsert;

export const vacutainerTubeCatalog = clinicalSchema.table('vacutainer_tube_catalog', {
  id: uuid('id').primaryKey().defaultRandom(),
  tubeKey: varchar('tube_key', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  additive: varchar('additive', { length: 100 }).notNull(),
  colorName: varchar('color_name', { length: 100 }).notNull(),
  capHex: varchar('cap_hex', { length: 50 }).notNull(),
  glowHex: varchar('glow_hex', { length: 50 }).notNull(),
  volume: varchar('volume', { length: 50 }).notNull(),
  inversions: varchar('inversions', { length: 50 }).notNull(),
  commonTests: jsonb('common_tests').default([]),
  keywords: jsonb('keywords').default([]),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export type VacutainerTubeCatalogItem = typeof vacutainerTubeCatalog.$inferSelect;
export type NewVacutainerTubeCatalogItem = typeof vacutainerTubeCatalog.$inferInsert;






