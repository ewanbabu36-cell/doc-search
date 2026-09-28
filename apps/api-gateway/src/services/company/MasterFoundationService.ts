import crypto from 'node:crypto';
import {
  getDatabase,
  tenants,
  partnerProfiles,
  partnerClassifications,
  partnerCapabilities,
  partnerConfigurationVersions,
  subscriptions,
  licenses,
  plans,
  eq,
  desc
} from '@docsearch/database';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import { toDeterministicUuid } from '../../repositories/company/PartnerOnboardingRepository.js';
import { licenseService } from './LicenseService.js';
import { entitlementService } from './EntitlementService.js';
import { capabilityEngine } from './CapabilityAndDependencyEngine.js';

const logger = createLogger('master-foundation-service');

// ============================================================================
// 1. SHARED IDENTIFIERS / ENUMS / CONTRACTS
// ============================================================================

export type CanonicalIndustryCode =
  | 'SOLO_DOCTOR_CLINIC'
  | 'MULTI_SPECIALITY_HOSPITAL'
  | 'PATHOLOGY'
  | 'RADIOLOGY'
  | 'PHARMACY_RETAIL'
  | 'PHARMACY_WHOLESALE'
  | 'DIAGNOSTIC_CENTRE'
  | 'HYBRID';

export type CanonicalOperatingModelCode =
  | 'SOLO'
  | 'CLINIC'
  | 'HOSPITAL'
  | 'DIAGNOSTIC_CENTER'
  | 'RETAIL_PHARMACY'
  | 'WHOLESALE_PHARMACY'
  | 'HYBRID';

export type CanonicalPermissionAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'DISPENSE'
  | 'VALIDATE'
  | 'BILL'
  | 'EXPORT'
  | 'CONFIGURE';

export type ConfigurationLifecycleStatus = 'DRAFT' | 'PUBLISHED' | 'SUPERSEDED';

export interface IndustryMasterDefinition {
  code: CanonicalIndustryCode;
  name: string;
  description: string;
  allowedOperatingModels: CanonicalOperatingModelCode[];
  defaultOperatingModel: CanonicalOperatingModelCode;
  allowedCapabilities: string[];
  allowedDepartments: string[];
  allowedRoleTemplates: string[];
  allowedFeatures: string[];
  allowedPlans: string[];
  version: string;
  status: 'ACTIVE' | 'INACTIVE';
  effectiveFrom: string;
}

export interface OperatingModelMasterDefinition {
  code: CanonicalOperatingModelCode;
  name: string;
  description: string;
  compatibleIndustries: CanonicalIndustryCode[];
  maxBranchesDefault: number;
  supportsMultiDepartment: boolean;
  supportsInpatientBeds: boolean;
  supportsB2bWholesale: boolean;
  supportsRetailCounterPos: boolean;
  version: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface DepartmentMasterDefinition {
  code: string;
  name: string;
  description: string;
  applicableIndustries: CanonicalIndustryCode[];
  applicableOperatingModels: CanonicalOperatingModelCode[];
  requiredCapabilities: string[];
  requiredFeatures: string[];
  defaultRoles: string[];
  permissions: string[];
  version: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PermissionMasterDefinition {
  code: string;
  resource: string;
  action: CanonicalPermissionAction;
  scope: 'TENANT' | 'BRANCH' | 'DEPARTMENT' | 'ASSIGNED';
  description: string;
  isGoverned: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  version: string;
}

export interface RoleTemplateMasterDefinition {
  code: string;
  name: string;
  description: string;
  applicableIndustries: CanonicalIndustryCode[];
  applicableOperatingModels: CanonicalOperatingModelCode[];
  departmentScope: 'PARTNER' | 'BRANCH' | 'DEPARTMENT' | 'ASSIGNED';
  requiredCapabilities: string[];
  permissionBundles: string[];
  explicitPermissions: string[];
  prohibitedActions: string[];
  version: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface FeatureMasterDefinition {
  code: string;
  name: string;
  description: string;
  capabilityCode: string;
  dependencies: Array<{
    code: string;
    type: 'CAPABILITY' | 'FEATURE' | 'PERMISSION';
  }>;
  entitlementRequired: string;
  requiredPermissions: string[];
  version: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PlanMasterDefinition {
  code: string;
  name: string;
  version: string;
  applicableIndustries: CanonicalIndustryCode[];
  applicableOperatingModels: CanonicalOperatingModelCode[];
  capabilities: string[];
  features: string[];
  limits: {
    maxDoctors: number;
    maxBeds: number;
    maxBranches: number;
    maxConcurrentUsers: number;
    storageQuotaGb: number;
    monthlyWhatsAppCredits: number;
  };
  dependencies: string[];
  effectiveFrom: string;
  effectiveTo: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

// ============================================================================
// 2. INDUSTRY MASTER CATALOG
// ============================================================================

export const INDUSTRY_MASTER_CATALOG: Record<CanonicalIndustryCode, IndustryMasterDefinition> = {
  SOLO_DOCTOR_CLINIC: {
    code: 'SOLO_DOCTOR_CLINIC',
    name: 'Solo Doctor & Outpatient Clinic',
    description: 'Outpatient consultation practice operated by an individual doctor or polyclinic group.',
    allowedOperatingModels: ['SOLO', 'CLINIC', 'HYBRID'],
    defaultOperatingModel: 'CLINIC',
    allowedCapabilities: [
      'PATIENT_REGISTRATION',
      'APPOINTMENT',
      'OPD',
      'BILLING',
      'REPORTING',
      'COMMUNICATION',
      'AI',
      'INTEGRATION',
      'HR'
    ],
    allowedDepartments: ['OPD_RECEPTION', 'OPD_CONSULTATION', 'BILLING_REVENUE_DESK', 'ADMINISTRATION_HR'],
    allowedRoleTemplates: ['DOCTOR', 'NURSE', 'RECEPTIONIST', 'BILLING', 'ADMIN', 'MANAGEMENT'],
    allowedFeatures: [
      'opd.registration',
      'opd.queue',
      'patient.emr',
      'clinical.prescription',
      'billing.invoices',
      'reporting.analytics',
      'ai.ambient_scribe',
      'whatsapp.alerts',
      'abdm.abha'
    ],
    allowedPlans: [
      'plan-clinic-free-yr1',
      'plan-clinic-annual-yr2',
      'plan-combo-clinic-lab-free-yr1',
      'plan-combo-clinic-pharma-free-yr1'
    ],
    version: '1.0.0',
    status: 'ACTIVE',
    effectiveFrom: '2026-01-01T00:00:00.000Z'
  },
  MULTI_SPECIALITY_HOSPITAL: {
    code: 'MULTI_SPECIALITY_HOSPITAL',
    name: 'Multi-Speciality Inpatient Hospital',
    description: 'Full-scale secondary/tertiary hospital with OPD, IPD, Emergency, ICU, OT, Lab, Radiology, and Pharmacy.',
    allowedOperatingModels: ['HOSPITAL', 'HYBRID'],
    defaultOperatingModel: 'HOSPITAL',
    allowedCapabilities: [
      'PATIENT_REGISTRATION',
      'APPOINTMENT',
      'OPD',
      'IPD',
      'EMERGENCY',
      'ICU',
      'OT',
      'LAB_ORDERING',
      'LAB_PROCESSING',
      'LAB_REPORT_VALIDATION',
      'LABORATORY',
      'PATHOLOGY',
      'RADIOLOGY',
      'PHARMACY_RETAIL',
      'PHARMACY_WHOLESALE',
      'PHARMACY',
      'BLOOD_BANK',
      'MRD',
      'DIETARY',
      'BILLING',
      'FINANCE',
      'INVENTORY',
      'REPORTING',
      'ANALYTICS',
      'HR',
      'COMMUNICATION',
      'AI',
      'INTEGRATION'
    ],
    allowedDepartments: [
      'OPD_RECEPTION',
      'OPD_CONSULTATION',
      'IPD_WARDS',
      'EMERGENCY_TRAUMA',
      'ICU_CRITICAL_CARE',
      'OPERATION_THEATRE',
      'PATHOLOGY_LAB',
      'RADIOLOGY_IMAGING',
      'RETAIL_PHARMACY_DISPENSARY',
      'BILLING_REVENUE_DESK',
      'MEDICAL_RECORDS_MRD',
      'ADMINISTRATION_HR'
    ],
    allowedRoleTemplates: [
      'DOCTOR',
      'NURSE',
      'RECEPTIONIST',
      'PHARMACIST',
      'DISPENSING_PHARMACIST',
      'LAB_TECHNICIAN',
      'PATHOLOGIST',
      'RADIOLOGY_TECHNICIAN',
      'RADIOLOGIST',
      'BILLING',
      'ADMIN',
      'INVENTORY',
      'MANAGEMENT'
    ],
    allowedFeatures: [
      'opd.registration',
      'opd.queue',
      'patient.emr',
      'clinical.prescription',
      'inpatient.adt',
      'clinical.icu.admit',
      'clinical.ot.schedule',
      'lab.orders',
      'lab.processing',
      'lab.result.validate',
      'radiology.pacs',
      'radiology.reporting',
      'pharmacy.pos',
      'pharmacy.dispense',
      'blood_bank.transfuse',
      'billing.invoices',
      'finance.refund.process',
      'inventory.ledger',
      'reporting.analytics',
      'ai.ambient_scribe',
      'whatsapp.alerts',
      'abdm.abha'
    ],
    allowedPlans: [
      'plan-hospital-free-yr1',
      'plan-hospital-annual-yr2',
      'plan-hospital-complete-yr1',
      'plan-hospital-complete-annual-yr2'
    ],
    version: '1.0.0',
    status: 'ACTIVE',
    effectiveFrom: '2026-01-01T00:00:00.000Z'
  },
  PATHOLOGY: {
    code: 'PATHOLOGY',
    name: 'Pathology & Clinical Diagnostic Laboratory',
    description: 'Standalone pathology, biochemistry, microbiology, and histopathology laboratory.',
    allowedOperatingModels: ['DIAGNOSTIC_CENTER', 'SOLO'],
    defaultOperatingModel: 'DIAGNOSTIC_CENTER',
    allowedCapabilities: [
      'PATIENT_REGISTRATION',
      'APPOINTMENT',
      'LAB_ORDERING',
      'LAB_PROCESSING',
      'LAB_REPORT_VALIDATION',
      'LABORATORY',
      'PATHOLOGY',
      'BILLING',
      'INVENTORY',
      'REPORTING',
      'COMMUNICATION',
      'INTEGRATION',
      'HR'
    ],
    allowedDepartments: ['OPD_RECEPTION', 'PATHOLOGY_LAB', 'BILLING_REVENUE_DESK', 'ADMINISTRATION_HR'],
    allowedRoleTemplates: ['LAB_TECHNICIAN', 'PATHOLOGIST', 'RECEPTIONIST', 'BILLING', 'ADMIN', 'INVENTORY', 'MANAGEMENT'],
    allowedFeatures: [
      'opd.registration',
      'lab.orders',
      'lab.processing',
      'lab.result.validate',
      'billing.invoices',
      'inventory.ledger',
      'reporting.analytics',
      'whatsapp.alerts',
      'abdm.abha'
    ],
    allowedPlans: ['plan-lab-free-yr1', 'plan-lab-annual-yr2'],
    version: '1.0.0',
    status: 'ACTIVE',
    effectiveFrom: '2026-01-01T00:00:00.000Z'
  },
  RADIOLOGY: {
    code: 'RADIOLOGY',
    name: 'Radiology & Diagnostic Imaging Center',
    description: 'Diagnostic imaging center providing X-Ray, Ultrasound, CT, MRI, and DICOM PACS reporting.',
    allowedOperatingModels: ['DIAGNOSTIC_CENTER'],
    defaultOperatingModel: 'DIAGNOSTIC_CENTER',
    allowedCapabilities: [
      'PATIENT_REGISTRATION',
      'APPOINTMENT',
      'RADIOLOGY',
      'BILLING',
      'REPORTING',
      'COMMUNICATION',
      'INTEGRATION',
      'HR'
    ],
    allowedDepartments: ['OPD_RECEPTION', 'RADIOLOGY_IMAGING', 'BILLING_REVENUE_DESK', 'ADMINISTRATION_HR'],
    allowedRoleTemplates: ['RADIOLOGY_TECHNICIAN', 'RADIOLOGIST', 'RECEPTIONIST', 'BILLING', 'ADMIN', 'MANAGEMENT'],
    allowedFeatures: [
      'opd.registration',
      'radiology.pacs',
      'radiology.reporting',
      'billing.invoices',
      'reporting.analytics',
      'whatsapp.alerts',
      'abdm.abha'
    ],
    allowedPlans: ['plan-diag-free-yr1', 'plan-diag-annual-yr2'],
    version: '1.0.0',
    status: 'ACTIVE',
    effectiveFrom: '2026-01-01T00:00:00.000Z'
  },
  DIAGNOSTIC_CENTRE: {
    code: 'DIAGNOSTIC_CENTRE',
    name: 'Integrated Pathology & Radiology Diagnostic Centre',
    description: 'Combined pathology LIMS and radiology PACS diagnostic imaging center.',
    allowedOperatingModels: ['DIAGNOSTIC_CENTER', 'HYBRID'],
    defaultOperatingModel: 'DIAGNOSTIC_CENTER',
    allowedCapabilities: [
      'PATIENT_REGISTRATION',
      'APPOINTMENT',
      'LAB_ORDERING',
      'LAB_PROCESSING',
      'LAB_REPORT_VALIDATION',
      'LABORATORY',
      'PATHOLOGY',
      'RADIOLOGY',
      'BILLING',
      'INVENTORY',
      'REPORTING',
      'COMMUNICATION',
      'INTEGRATION',
      'HR'
    ],
    allowedDepartments: [
      'OPD_RECEPTION',
      'PATHOLOGY_LAB',
      'RADIOLOGY_IMAGING',
      'BILLING_REVENUE_DESK',
      'ADMINISTRATION_HR'
    ],
    allowedRoleTemplates: [
      'LAB_TECHNICIAN',
      'PATHOLOGIST',
      'RADIOLOGY_TECHNICIAN',
      'RADIOLOGIST',
      'RECEPTIONIST',
      'BILLING',
      'ADMIN',
      'INVENTORY',
      'MANAGEMENT'
    ],
    allowedFeatures: [
      'opd.registration',
      'lab.orders',
      'lab.processing',
      'lab.result.validate',
      'radiology.pacs',
      'radiology.reporting',
      'billing.invoices',
      'inventory.ledger',
      'reporting.analytics',
      'whatsapp.alerts',
      'abdm.abha'
    ],
    allowedPlans: ['plan-diag-free-yr1', 'plan-diag-annual-yr2'],
    version: '1.0.0',
    status: 'ACTIVE',
    effectiveFrom: '2026-01-01T00:00:00.000Z'
  },
  PHARMACY_RETAIL: {
    code: 'PHARMACY_RETAIL',
    name: 'Retail Pharmacy & Chemist Dispensary',
    description: 'B2C retail pharmacy counter dispensing prescriptions, OTC medicines, and Schedule H1 tracking.',
    allowedOperatingModels: ['RETAIL_PHARMACY', 'SOLO'],
    defaultOperatingModel: 'RETAIL_PHARMACY',
    allowedCapabilities: [
      'PATIENT_REGISTRATION',
      'PHARMACY_RETAIL',
      'PHARMACY',
      'INVENTORY',
      'BILLING',
      'REPORTING',
      'COMMUNICATION',
      'HR'
    ],
    allowedDepartments: ['RETAIL_PHARMACY_DISPENSARY', 'BILLING_REVENUE_DESK', 'ADMINISTRATION_HR'],
    allowedRoleTemplates: ['PHARMACIST', 'DISPENSING_PHARMACIST', 'BILLING', 'INVENTORY', 'ADMIN', 'MANAGEMENT'],
    allowedFeatures: [
      'pharmacy.pos',
      'pharmacy.dispense',
      'inventory.ledger',
      'billing.invoices',
      'reporting.analytics',
      'whatsapp.alerts'
    ],
    allowedPlans: ['plan-pharma-free-yr1', 'plan-pharma-annual-yr2'],
    version: '1.0.0',
    status: 'ACTIVE',
    effectiveFrom: '2026-01-01T00:00:00.000Z'
  },
  PHARMACY_WHOLESALE: {
    code: 'PHARMACY_WHOLESALE',
    name: 'Wholesale Pharmaceutical Distributor & Stockist',
    description: 'B2B pharmaceutical distributor and stockist operating under Drug License Form 20B & 21B.',
    allowedOperatingModels: ['WHOLESALE_PHARMACY'],
    defaultOperatingModel: 'WHOLESALE_PHARMACY',
    allowedCapabilities: [
      'PHARMACY_WHOLESALE',
      'PHARMACY',
      'INVENTORY',
      'BILLING',
      'FINANCE',
      'REPORTING',
      'COMMUNICATION',
      'HR'
    ],
    allowedDepartments: ['WHOLESALE_DISTRIBUTION_HUB', 'BILLING_REVENUE_DESK', 'ADMINISTRATION_HR'],
    allowedRoleTemplates: ['WHOLESALE_PHARMACIST', 'PHARMACIST', 'INVENTORY', 'BILLING', 'ADMIN', 'MANAGEMENT'],
    allowedFeatures: [
      'pharmacy.wholesale',
      'inventory.ledger',
      'billing.invoices',
      'reporting.analytics',
      'whatsapp.alerts'
    ],
    allowedPlans: ['plan-pharma-wholesale-free-yr1', 'plan-pharma-wholesale-annual-yr2'],
    version: '1.0.0',
    status: 'ACTIVE',
    effectiveFrom: '2026-01-01T00:00:00.000Z'
  },
  HYBRID: {
    code: 'HYBRID',
    name: 'Hybrid Polyclinic & Integrated Healthcare Facility',
    description: 'Multi-vertical healthcare facility combining outpatient clinic with pathology lab or retail pharmacy.',
    allowedOperatingModels: ['HYBRID', 'CLINIC', 'HOSPITAL'],
    defaultOperatingModel: 'HYBRID',
    allowedCapabilities: [
      'PATIENT_REGISTRATION',
      'APPOINTMENT',
      'OPD',
      'LAB_ORDERING',
      'LAB_PROCESSING',
      'LAB_REPORT_VALIDATION',
      'LABORATORY',
      'PATHOLOGY',
      'PHARMACY_RETAIL',
      'PHARMACY',
      'INVENTORY',
      'BILLING',
      'REPORTING',
      'COMMUNICATION',
      'AI',
      'INTEGRATION',
      'HR'
    ],
    allowedDepartments: [
      'OPD_RECEPTION',
      'OPD_CONSULTATION',
      'PATHOLOGY_LAB',
      'RETAIL_PHARMACY_DISPENSARY',
      'BILLING_REVENUE_DESK',
      'ADMINISTRATION_HR'
    ],
    allowedRoleTemplates: [
      'DOCTOR',
      'NURSE',
      'RECEPTIONIST',
      'PHARMACIST',
      'DISPENSING_PHARMACIST',
      'LAB_TECHNICIAN',
      'PATHOLOGIST',
      'BILLING',
      'INVENTORY',
      'ADMIN',
      'MANAGEMENT'
    ],
    allowedFeatures: [
      'opd.registration',
      'opd.queue',
      'patient.emr',
      'clinical.prescription',
      'lab.orders',
      'lab.processing',
      'lab.result.validate',
      'pharmacy.pos',
      'pharmacy.dispense',
      'inventory.ledger',
      'billing.invoices',
      'reporting.analytics',
      'ai.ambient_scribe',
      'whatsapp.alerts',
      'abdm.abha'
    ],
    allowedPlans: [
      'plan-combo-clinic-lab-free-yr1',
      'plan-combo-clinic-lab-annual-yr2',
      'plan-combo-clinic-pharma-free-yr1',
      'plan-combo-clinic-pharma-annual-yr2'
    ],
    version: '1.0.0',
    status: 'ACTIVE',
    effectiveFrom: '2026-01-01T00:00:00.000Z'
  }
};

// ============================================================================
// 3. OPERATING MODEL MASTER CATALOG
// ============================================================================

export const OPERATING_MODEL_MASTER_CATALOG: Record<CanonicalOperatingModelCode, OperatingModelMasterDefinition> = {
  SOLO: {
    code: 'SOLO',
    name: 'Single-Practitioner / Solo Operation',
    description: 'Single-location practitioner-operated healthcare practice.',
    compatibleIndustries: ['SOLO_DOCTOR_CLINIC', 'PATHOLOGY', 'PHARMACY_RETAIL'],
    maxBranchesDefault: 1,
    supportsMultiDepartment: false,
    supportsInpatientBeds: false,
    supportsB2bWholesale: false,
    supportsRetailCounterPos: true,
    version: '1.0.0',
    status: 'ACTIVE'
  },
  CLINIC: {
    code: 'CLINIC',
    name: 'Outpatient Polyclinic Operation',
    description: 'Outpatient consultation & day-care clinic operating model without inpatient beds.',
    compatibleIndustries: ['SOLO_DOCTOR_CLINIC', 'HYBRID'],
    maxBranchesDefault: 2,
    supportsMultiDepartment: true,
    supportsInpatientBeds: false,
    supportsB2bWholesale: false,
    supportsRetailCounterPos: true,
    version: '1.0.0',
    status: 'ACTIVE'
  },
  HOSPITAL: {
    code: 'HOSPITAL',
    name: '24x7 Multi-Department Inpatient Hospital',
    description: 'Multi-department hospital operation with inpatient beds, wards, emergency, and OT.',
    compatibleIndustries: ['MULTI_SPECIALITY_HOSPITAL', 'HYBRID'],
    maxBranchesDefault: 5,
    supportsMultiDepartment: true,
    supportsInpatientBeds: true,
    supportsB2bWholesale: false,
    supportsRetailCounterPos: true,
    version: '1.0.0',
    status: 'ACTIVE'
  },
  DIAGNOSTIC_CENTER: {
    code: 'DIAGNOSTIC_CENTER',
    name: 'Diagnostic Collection, Accession & Reporting Hub',
    description: 'Laboratory and/or imaging diagnostic operation centered around specimen/study workflows.',
    compatibleIndustries: ['PATHOLOGY', 'RADIOLOGY', 'DIAGNOSTIC_CENTRE'],
    maxBranchesDefault: 5,
    supportsMultiDepartment: true,
    supportsInpatientBeds: false,
    supportsB2bWholesale: false,
    supportsRetailCounterPos: false,
    version: '1.0.0',
    status: 'ACTIVE'
  },
  RETAIL_PHARMACY: {
    code: 'RETAIL_PHARMACY',
    name: 'B2C Retail Prescription Counter Dispensary',
    description: 'Patient-facing retail pharmacy counter operation dispensing medications against prescriptions.',
    compatibleIndustries: ['PHARMACY_RETAIL'],
    maxBranchesDefault: 3,
    supportsMultiDepartment: false,
    supportsInpatientBeds: false,
    supportsB2bWholesale: false,
    supportsRetailCounterPos: true,
    version: '1.0.0',
    status: 'ACTIVE'
  },
  WHOLESALE_PHARMACY: {
    code: 'WHOLESALE_PHARMACY',
    name: 'B2B Pharmaceutical Distribution & Stockist Hub',
    description: 'Bulk B2B GST invoicing, Drug License 20B/21B verification, credit ledger, and batch dispatch.',
    compatibleIndustries: ['PHARMACY_WHOLESALE'],
    maxBranchesDefault: 3,
    supportsMultiDepartment: false,
    supportsInpatientBeds: false,
    supportsB2bWholesale: true,
    supportsRetailCounterPos: false,
    version: '1.0.0',
    status: 'ACTIVE'
  },
  HYBRID: {
    code: 'HYBRID',
    name: 'Hybrid Multi-Service Healthcare Operation',
    description: 'Integrated operating model combining outpatient clinic with diagnostics and/or pharmacy.',
    compatibleIndustries: ['HYBRID', 'SOLO_DOCTOR_CLINIC', 'MULTI_SPECIALITY_HOSPITAL', 'DIAGNOSTIC_CENTRE'],
    maxBranchesDefault: 5,
    supportsMultiDepartment: true,
    supportsInpatientBeds: true,
    supportsB2bWholesale: true,
    supportsRetailCounterPos: true,
    version: '1.0.0',
    status: 'ACTIVE'
  }
};

// ============================================================================
// 4. DEPARTMENT MASTER CATALOG
// ============================================================================

export const DEPARTMENT_MASTER_CATALOG: Record<string, DepartmentMasterDefinition> = {
  OPD_RECEPTION: {
    code: 'OPD_RECEPTION',
    name: 'Patient Registration & Reception Desk',
    description: 'Patient intake, UHID registration, appointments, and queue tokens.',
    applicableIndustries: ['SOLO_DOCTOR_CLINIC', 'MULTI_SPECIALITY_HOSPITAL', 'PATHOLOGY', 'RADIOLOGY', 'DIAGNOSTIC_CENTRE', 'HYBRID'],
    applicableOperatingModels: ['SOLO', 'CLINIC', 'HOSPITAL', 'DIAGNOSTIC_CENTER', 'HYBRID'],
    requiredCapabilities: ['PATIENT_REGISTRATION'],
    requiredFeatures: ['opd.registration'],
    defaultRoles: ['RECEPTIONIST'],
    permissions: ['patient:CREATE', 'patient:READ', 'appointment:CREATE', 'appointment:READ'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  OPD_CONSULTATION: {
    code: 'OPD_CONSULTATION',
    name: 'Outpatient Clinical Consultation',
    description: 'Doctor OPD consultation chambers, vitals triage, and digital e-prescriptions.',
    applicableIndustries: ['SOLO_DOCTOR_CLINIC', 'MULTI_SPECIALITY_HOSPITAL', 'HYBRID'],
    applicableOperatingModels: ['SOLO', 'CLINIC', 'HOSPITAL', 'HYBRID'],
    requiredCapabilities: ['OPD'],
    requiredFeatures: ['opd.queue', 'patient.emr'],
    defaultRoles: ['DOCTOR', 'NURSE'],
    permissions: ['patient:READ', 'consultation:CREATE', 'consultation:UPDATE', 'prescription:APPROVE'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  IPD_WARDS: {
    code: 'IPD_WARDS',
    name: 'Inpatient Wards & Bed Management',
    description: 'Inpatient admission, discharge, transfer (ADT), nursing stations, and ward rounds.',
    applicableIndustries: ['MULTI_SPECIALITY_HOSPITAL'],
    applicableOperatingModels: ['HOSPITAL', 'HYBRID'],
    requiredCapabilities: ['IPD'],
    requiredFeatures: ['inpatient.adt'],
    defaultRoles: ['DOCTOR', 'NURSE'],
    permissions: ['inpatient:CREATE', 'inpatient:READ', 'inpatient:UPDATE'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  EMERGENCY_TRAUMA: {
    code: 'EMERGENCY_TRAUMA',
    name: 'Emergency & Trauma Casualty',
    description: '24x7 emergency triage, resuscitation, and medico-legal intake.',
    applicableIndustries: ['MULTI_SPECIALITY_HOSPITAL'],
    applicableOperatingModels: ['HOSPITAL'],
    requiredCapabilities: ['EMERGENCY'],
    requiredFeatures: ['inpatient.adt'],
    defaultRoles: ['DOCTOR', 'NURSE'],
    permissions: ['emergency:CREATE', 'emergency:READ', 'emergency:UPDATE'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  ICU_CRITICAL_CARE: {
    code: 'ICU_CRITICAL_CARE',
    name: 'Intensive Critical Care Unit (ICU)',
    description: 'High-dependency critical care monitoring and ventilator beds.',
    applicableIndustries: ['MULTI_SPECIALITY_HOSPITAL'],
    applicableOperatingModels: ['HOSPITAL'],
    requiredCapabilities: ['ICU', 'IPD'],
    requiredFeatures: ['clinical.icu.admit'],
    defaultRoles: ['DOCTOR', 'NURSE'],
    permissions: ['icu:CREATE', 'icu:READ', 'icu:UPDATE'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  OPERATION_THEATRE: {
    code: 'OPERATION_THEATRE',
    name: 'Operation Theatre & Surgical Complex',
    description: 'Surgical theatre scheduling, pre-op PAC, anesthesia records, and OT notes.',
    applicableIndustries: ['MULTI_SPECIALITY_HOSPITAL'],
    applicableOperatingModels: ['HOSPITAL'],
    requiredCapabilities: ['OT', 'IPD'],
    requiredFeatures: ['clinical.ot.schedule'],
    defaultRoles: ['DOCTOR', 'NURSE'],
    permissions: ['ot:CREATE', 'ot:READ', 'ot:UPDATE'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  PATHOLOGY_LAB: {
    code: 'PATHOLOGY_LAB',
    name: 'Pathology & Clinical Laboratory',
    description: 'Phlebotomy collection, barcode accessioning, analyzer processing, and pathologist validation.',
    applicableIndustries: ['PATHOLOGY', 'DIAGNOSTIC_CENTRE', 'MULTI_SPECIALITY_HOSPITAL', 'HYBRID'],
    applicableOperatingModels: ['DIAGNOSTIC_CENTER', 'HOSPITAL', 'HYBRID', 'SOLO'],
    requiredCapabilities: ['LABORATORY'],
    requiredFeatures: ['lab.orders', 'lab.processing'],
    defaultRoles: ['LAB_TECHNICIAN', 'PATHOLOGIST'],
    permissions: ['lab:CREATE', 'lab:READ', 'lab:UPDATE', 'lab:VALIDATE'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  RADIOLOGY_IMAGING: {
    code: 'RADIOLOGY_IMAGING',
    name: 'Radiology & PACS Diagnostic Imaging',
    description: 'Modality acquisition (X-Ray, CT, MRI, USG), DICOM PACS, and radiologist reporting.',
    applicableIndustries: ['RADIOLOGY', 'DIAGNOSTIC_CENTRE', 'MULTI_SPECIALITY_HOSPITAL'],
    applicableOperatingModels: ['DIAGNOSTIC_CENTER', 'HOSPITAL', 'HYBRID'],
    requiredCapabilities: ['RADIOLOGY'],
    requiredFeatures: ['radiology.pacs', 'radiology.reporting'],
    defaultRoles: ['RADIOLOGY_TECHNICIAN', 'RADIOLOGIST'],
    permissions: ['radiology:CREATE', 'radiology:READ', 'radiology:UPDATE', 'radiology:VALIDATE'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  RETAIL_PHARMACY_DISPENSARY: {
    code: 'RETAIL_PHARMACY_DISPENSARY',
    name: 'Retail Pharmacy Counter & Dispensary',
    description: 'B2C retail prescription dispensing, FEFO batch deduction, and POS billing.',
    applicableIndustries: ['PHARMACY_RETAIL', 'MULTI_SPECIALITY_HOSPITAL', 'HYBRID'],
    applicableOperatingModels: ['RETAIL_PHARMACY', 'HOSPITAL', 'HYBRID', 'SOLO'],
    requiredCapabilities: ['PHARMACY_RETAIL'],
    requiredFeatures: ['pharmacy.pos', 'pharmacy.dispense'],
    defaultRoles: ['PHARMACIST', 'DISPENSING_PHARMACIST', 'INVENTORY'],
    permissions: ['pharmacy:READ', 'pharmacy:DISPENSE', 'inventory:UPDATE', 'billing:BILL'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  WHOLESALE_DISTRIBUTION_HUB: {
    code: 'WHOLESALE_DISTRIBUTION_HUB',
    name: 'B2B Pharmaceutical Wholesale Distribution Hub',
    description: 'Bulk B2B GST invoicing, Form 20B/21B compliance verification, and stockist dispatch.',
    applicableIndustries: ['PHARMACY_WHOLESALE'],
    applicableOperatingModels: ['WHOLESALE_PHARMACY'],
    requiredCapabilities: ['PHARMACY_WHOLESALE'],
    requiredFeatures: ['pharmacy.wholesale', 'inventory.ledger'],
    defaultRoles: ['WHOLESALE_PHARMACIST', 'INVENTORY', 'BILLING'],
    permissions: ['wholesale:CREATE', 'wholesale:READ', 'wholesale:BILL', 'inventory:UPDATE'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  BILLING_REVENUE_DESK: {
    code: 'BILLING_REVENUE_DESK',
    name: 'Billing, Cashier & TPA Revenue Desk',
    description: 'Invoicing, receipts, refunds, GST compliance, and TPA insurance claims.',
    applicableIndustries: [
      'SOLO_DOCTOR_CLINIC',
      'MULTI_SPECIALITY_HOSPITAL',
      'PATHOLOGY',
      'RADIOLOGY',
      'DIAGNOSTIC_CENTRE',
      'PHARMACY_RETAIL',
      'PHARMACY_WHOLESALE',
      'HYBRID'
    ],
    applicableOperatingModels: ['SOLO', 'CLINIC', 'HOSPITAL', 'DIAGNOSTIC_CENTER', 'RETAIL_PHARMACY', 'WHOLESALE_PHARMACY', 'HYBRID'],
    requiredCapabilities: ['BILLING'],
    requiredFeatures: ['billing.invoices'],
    defaultRoles: ['BILLING', 'ADMIN'],
    permissions: ['billing:CREATE', 'billing:READ', 'billing:BILL', 'billing:EXPORT'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  MEDICAL_RECORDS_MRD: {
    code: 'MEDICAL_RECORDS_MRD',
    name: 'Medical Records Department (MRD)',
    description: 'ICD-10 coding, discharge chart archival, and medico-legal records.',
    applicableIndustries: ['MULTI_SPECIALITY_HOSPITAL'],
    applicableOperatingModels: ['HOSPITAL'],
    requiredCapabilities: ['MRD'],
    requiredFeatures: ['patient.emr'],
    defaultRoles: ['ADMIN', 'MANAGEMENT'],
    permissions: ['mrd:READ', 'mrd:UPDATE', 'mrd:EXPORT'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  ADMINISTRATION_HR: {
    code: 'ADMINISTRATION_HR',
    name: 'Facility Administration, HR & Governance',
    description: 'Partner staff management, role assignments, rosters, and compliance governance.',
    applicableIndustries: [
      'SOLO_DOCTOR_CLINIC',
      'MULTI_SPECIALITY_HOSPITAL',
      'PATHOLOGY',
      'RADIOLOGY',
      'DIAGNOSTIC_CENTRE',
      'PHARMACY_RETAIL',
      'PHARMACY_WHOLESALE',
      'HYBRID'
    ],
    applicableOperatingModels: ['SOLO', 'CLINIC', 'HOSPITAL', 'DIAGNOSTIC_CENTER', 'RETAIL_PHARMACY', 'WHOLESALE_PHARMACY', 'HYBRID'],
    requiredCapabilities: ['HR'],
    requiredFeatures: ['reporting.analytics'],
    defaultRoles: ['ADMIN', 'MANAGEMENT'],
    permissions: ['staff:CREATE', 'staff:READ', 'staff:UPDATE', 'facility:CONFIGURE'],
    version: '1.0.0',
    status: 'ACTIVE'
  }
};

// ============================================================================
// 5. PERMISSION MASTER CATALOG
// ============================================================================

export const PERMISSION_MASTER_CATALOG: Record<string, PermissionMasterDefinition> = {
  'patient:CREATE': {
    code: 'patient:CREATE',
    resource: 'patient',
    action: 'CREATE',
    scope: 'BRANCH',
    description: 'Register new patients and generate UHID records',
    isGoverned: false,
    status: 'ACTIVE',
    version: '1.0.0'
  },
  'patient:READ': {
    code: 'patient:READ',
    resource: 'patient',
    action: 'READ',
    scope: 'BRANCH',
    description: 'View patient demographic and clinical records within authorized scope',
    isGoverned: false,
    status: 'ACTIVE',
    version: '1.0.0'
  },
  'patient:UPDATE': {
    code: 'patient:UPDATE',
    resource: 'patient',
    action: 'UPDATE',
    scope: 'BRANCH',
    description: 'Update patient demographics and clinical notes',
    isGoverned: false,
    status: 'ACTIVE',
    version: '1.0.0'
  },
  'patient:DELETE': {
    code: 'patient:DELETE',
    resource: 'patient',
    action: 'DELETE',
    scope: 'TENANT',
    description: 'Governed deletion/archival of duplicate patient records',
    isGoverned: true,
    status: 'ACTIVE',
    version: '1.0.0'
  },
  'prescription:APPROVE': {
    code: 'prescription:APPROVE',
    resource: 'prescription',
    action: 'APPROVE',
    scope: 'ASSIGNED',
    description: 'Author and digitally sign clinical prescriptions',
    isGoverned: true,
    status: 'ACTIVE',
    version: '1.0.0'
  },
  'pharmacy:DISPENSE': {
    code: 'pharmacy:DISPENSE',
    resource: 'pharmacy',
    action: 'DISPENSE',
    scope: 'DEPARTMENT',
    description: 'Execute atomic FEFO medication dispensing against prescriptions',
    isGoverned: true,
    status: 'ACTIVE',
    version: '1.0.0'
  },
  'lab:VALIDATE': {
    code: 'lab:VALIDATE',
    resource: 'lab',
    action: 'VALIDATE',
    scope: 'DEPARTMENT',
    description: 'Pathologist signatory validation and release of diagnostic lab reports',
    isGoverned: true,
    status: 'ACTIVE',
    version: '1.0.0'
  },
  'radiology:VALIDATE': {
    code: 'radiology:VALIDATE',
    resource: 'radiology',
    action: 'VALIDATE',
    scope: 'DEPARTMENT',
    description: 'Radiologist signatory validation and finalization of imaging reports',
    isGoverned: true,
    status: 'ACTIVE',
    version: '1.0.0'
  },
  'billing:BILL': {
    code: 'billing:BILL',
    resource: 'billing',
    action: 'BILL',
    scope: 'BRANCH',
    description: 'Generate invoices, collect payments, and issue financial receipts',
    isGoverned: false,
    status: 'ACTIVE',
    version: '1.0.0'
  },
  'billing:EXPORT': {
    code: 'billing:EXPORT',
    resource: 'billing',
    action: 'EXPORT',
    scope: 'TENANT',
    description: 'Export financial ledgers, GST returns, and audit reports',
    isGoverned: true,
    status: 'ACTIVE',
    version: '1.0.0'
  },
  'facility:CONFIGURE': {
    code: 'facility:CONFIGURE',
    resource: 'facility',
    action: 'CONFIGURE',
    scope: 'TENANT',
    description: 'Configure partner departments, staff roles, and operational settings',
    isGoverned: true,
    status: 'ACTIVE',
    version: '1.0.0'
  }
};

// ============================================================================
// 6. ROLE TEMPLATE MASTER CATALOG
// ============================================================================

export const ROLE_TEMPLATE_MASTER_CATALOG: Record<string, RoleTemplateMasterDefinition> = {
  DOCTOR: {
    code: 'DOCTOR',
    name: 'Attending / Consultant Physician',
    description: 'Clinical consultation, EMR documentation, investigation orders, and e-prescription sign-off.',
    applicableIndustries: ['SOLO_DOCTOR_CLINIC', 'MULTI_SPECIALITY_HOSPITAL', 'HYBRID'],
    applicableOperatingModels: ['SOLO', 'CLINIC', 'HOSPITAL', 'HYBRID'],
    departmentScope: 'ASSIGNED',
    requiredCapabilities: ['OPD'],
    permissionBundles: ['PACK_CLINICAL_DOCS', 'PACK_OPD_BASIC'],
    explicitPermissions: ['patient:READ', 'patient:UPDATE', 'prescription:APPROVE', 'clinical.prescription.sign', 'clinical.consultation.author'],
    prohibitedActions: ['invoice.refund', 'pharmacy.dispense', 'staff.payroll.manage'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  NURSE: {
    code: 'NURSE',
    name: 'Registered Clinical / Ward Nurse',
    description: 'Patient vitals triage, nursing care notes, and inpatient ward chart management.',
    applicableIndustries: ['SOLO_DOCTOR_CLINIC', 'MULTI_SPECIALITY_HOSPITAL', 'HYBRID'],
    applicableOperatingModels: ['CLINIC', 'HOSPITAL', 'HYBRID'],
    departmentScope: 'DEPARTMENT',
    requiredCapabilities: ['OPD'],
    permissionBundles: ['PACK_NURSING_CORE'],
    explicitPermissions: ['patient:READ', 'patient:UPDATE', 'clinical.vitals.record'],
    prohibitedActions: ['prescription:APPROVE', 'clinical.prescription.sign', 'invoice.refund', 'pharmacy.dispense'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  RECEPTIONIST: {
    code: 'RECEPTIONIST',
    name: 'Front Desk Receptionist',
    description: 'Patient UHID registration, appointment booking, and OPD token generation.',
    applicableIndustries: ['SOLO_DOCTOR_CLINIC', 'MULTI_SPECIALITY_HOSPITAL', 'PATHOLOGY', 'RADIOLOGY', 'DIAGNOSTIC_CENTRE', 'HYBRID'],
    applicableOperatingModels: ['SOLO', 'CLINIC', 'HOSPITAL', 'DIAGNOSTIC_CENTER', 'HYBRID'],
    departmentScope: 'BRANCH',
    requiredCapabilities: ['PATIENT_REGISTRATION'],
    permissionBundles: ['PACK_RECEPTION_DESK', 'PACK_OPD_BASIC'],
    explicitPermissions: ['patient:CREATE', 'patient:READ', 'appointment.create', 'appointment.view'],
    prohibitedActions: ['prescription:APPROVE', 'clinical.prescription.sign', 'lab:VALIDATE', 'radiology:VALIDATE', 'pharmacy:DISPENSE'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  PHARMACIST: {
    code: 'PHARMACIST',
    name: 'Registered Pharmacist',
    description: 'Medication dispensing, drug formulary management, and batch expiry control.',
    applicableIndustries: ['PHARMACY_RETAIL', 'PHARMACY_WHOLESALE', 'MULTI_SPECIALITY_HOSPITAL', 'HYBRID'],
    applicableOperatingModels: ['RETAIL_PHARMACY', 'WHOLESALE_PHARMACY', 'HOSPITAL', 'HYBRID', 'SOLO'],
    departmentScope: 'DEPARTMENT',
    requiredCapabilities: ['PHARMACY'],
    permissionBundles: ['PACK_PHARMACY_OPERATOR'],
    explicitPermissions: ['pharmacy:DISPENSE', 'pharmacy.dispense', 'pharmacy.stock.view', 'pharmacy.stock.adjust'],
    prohibitedActions: ['prescription:APPROVE', 'clinical.prescription.sign', 'lab:VALIDATE', 'radiology:VALIDATE'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  DISPENSING_PHARMACIST: {
    code: 'DISPENSING_PHARMACIST',
    name: 'Retail POS Dispensing Pharmacist',
    description: 'Retail counter prescription dispensing and patient medication counseling.',
    applicableIndustries: ['PHARMACY_RETAIL', 'MULTI_SPECIALITY_HOSPITAL', 'HYBRID'],
    applicableOperatingModels: ['RETAIL_PHARMACY', 'HOSPITAL', 'HYBRID', 'SOLO'],
    departmentScope: 'DEPARTMENT',
    requiredCapabilities: ['PHARMACY_RETAIL'],
    permissionBundles: ['PACK_PHARMACY_OPERATOR'],
    explicitPermissions: ['pharmacy:DISPENSE', 'pharmacy.dispense', 'pharmacy.stock.view'],
    prohibitedActions: ['prescription:APPROVE', 'clinical.prescription.sign', 'wholesale.invoice.create'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  WHOLESALE_PHARMACIST: {
    code: 'WHOLESALE_PHARMACIST',
    name: 'Wholesale Distribution Pharmacist (Form 20B/21B)',
    description: 'B2B pharmaceutical distribution compliance, bulk batch allocation, and GST invoicing.',
    applicableIndustries: ['PHARMACY_WHOLESALE'],
    applicableOperatingModels: ['WHOLESALE_PHARMACY'],
    departmentScope: 'DEPARTMENT',
    requiredCapabilities: ['PHARMACY_WHOLESALE'],
    permissionBundles: ['PACK_PHARMACY_OPERATOR', 'PACK_BILLING_DESK'],
    explicitPermissions: ['wholesale.invoice.create', 'pharmacy.stock.view', 'pharmacy.stock.adjust', 'billing:BILL'],
    prohibitedActions: ['pharmacy:DISPENSE', 'pharmacy.dispense', 'prescription:APPROVE'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  LAB_TECHNICIAN: {
    code: 'LAB_TECHNICIAN',
    name: 'Medical Laboratory Technician (MLT)',
    description: 'Sample collection, barcode accessioning, analyzer execution, and draft result entry.',
    applicableIndustries: ['PATHOLOGY', 'DIAGNOSTIC_CENTRE', 'MULTI_SPECIALITY_HOSPITAL', 'HYBRID'],
    applicableOperatingModels: ['DIAGNOSTIC_CENTER', 'HOSPITAL', 'HYBRID', 'SOLO'],
    departmentScope: 'DEPARTMENT',
    requiredCapabilities: ['LABORATORY'],
    permissionBundles: ['PACK_LAB_TECH'],
    explicitPermissions: ['lab.sample.accession', 'lab.order.view', 'lab.result.enter'],
    prohibitedActions: ['lab:VALIDATE', 'lab.result.validate', 'prescription:APPROVE', 'pharmacy:DISPENSE'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  PATHOLOGIST: {
    code: 'PATHOLOGIST',
    name: 'Consultant Pathologist (Authorized Signatory)',
    description: 'Diagnostic laboratory interpretation, critical value review, and final report validation.',
    applicableIndustries: ['PATHOLOGY', 'DIAGNOSTIC_CENTRE', 'MULTI_SPECIALITY_HOSPITAL', 'HYBRID'],
    applicableOperatingModels: ['DIAGNOSTIC_CENTER', 'HOSPITAL', 'HYBRID', 'SOLO'],
    departmentScope: 'DEPARTMENT',
    requiredCapabilities: ['LABORATORY', 'PATHOLOGY'],
    permissionBundles: ['PACK_LAB_TECH'],
    explicitPermissions: ['lab:VALIDATE', 'lab.result.validate', 'lab.order.view', 'lab.result.enter'],
    prohibitedActions: ['pharmacy:DISPENSE', 'invoice.refund'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  RADIOLOGY_TECHNICIAN: {
    code: 'RADIOLOGY_TECHNICIAN',
    name: 'Radiology & Modality Technician',
    description: 'Modality scheduling, patient positioning, and DICOM PACS study upload.',
    applicableIndustries: ['RADIOLOGY', 'DIAGNOSTIC_CENTRE', 'MULTI_SPECIALITY_HOSPITAL'],
    applicableOperatingModels: ['DIAGNOSTIC_CENTER', 'HOSPITAL', 'HYBRID'],
    departmentScope: 'DEPARTMENT',
    requiredCapabilities: ['RADIOLOGY'],
    permissionBundles: ['PACK_RADIOLOGY_TECH'],
    explicitPermissions: ['radiology.order.view', 'radiology.study.view', 'radiology.dicom.view'],
    prohibitedActions: ['radiology:VALIDATE', 'radiology.report.sign', 'prescription:APPROVE'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  RADIOLOGIST: {
    code: 'RADIOLOGIST',
    name: 'Consultant Radiologist (Authorized Signatory)',
    description: 'DICOM PACS study review, diagnostic imaging interpretation, and final report sign-off.',
    applicableIndustries: ['RADIOLOGY', 'DIAGNOSTIC_CENTRE', 'MULTI_SPECIALITY_HOSPITAL'],
    applicableOperatingModels: ['DIAGNOSTIC_CENTER', 'HOSPITAL', 'HYBRID'],
    departmentScope: 'DEPARTMENT',
    requiredCapabilities: ['RADIOLOGY'],
    permissionBundles: ['PACK_RADIOLOGY_TECH'],
    explicitPermissions: ['radiology:VALIDATE', 'radiology.report.sign', 'radiology.study.view'],
    prohibitedActions: ['pharmacy:DISPENSE', 'invoice.refund'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  BILLING: {
    code: 'BILLING',
    name: 'Billing & Revenue Officer',
    description: 'Patient invoicing, payment collection, GST billing, and TPA claims processing.',
    applicableIndustries: [
      'SOLO_DOCTOR_CLINIC',
      'MULTI_SPECIALITY_HOSPITAL',
      'PATHOLOGY',
      'RADIOLOGY',
      'DIAGNOSTIC_CENTRE',
      'PHARMACY_RETAIL',
      'PHARMACY_WHOLESALE',
      'HYBRID'
    ],
    applicableOperatingModels: ['SOLO', 'CLINIC', 'HOSPITAL', 'DIAGNOSTIC_CENTER', 'RETAIL_PHARMACY', 'WHOLESALE_PHARMACY', 'HYBRID'],
    departmentScope: 'BRANCH',
    requiredCapabilities: ['BILLING'],
    permissionBundles: ['PACK_BILLING_DESK'],
    explicitPermissions: ['billing:BILL', 'invoice.create', 'invoice.view', 'payment.collect'],
    prohibitedActions: ['prescription:APPROVE', 'clinical.prescription.sign', 'lab:VALIDATE', 'radiology:VALIDATE', 'pharmacy:DISPENSE'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  INVENTORY: {
    code: 'INVENTORY',
    name: 'Inventory & Supply Chain Controller',
    description: 'Purchase orders, GRN inward stock entry, batch reconciliation, and stock movement ledgers.',
    applicableIndustries: ['PHARMACY_RETAIL', 'PHARMACY_WHOLESALE', 'MULTI_SPECIALITY_HOSPITAL', 'PATHOLOGY', 'DIAGNOSTIC_CENTRE', 'HYBRID'],
    applicableOperatingModels: ['RETAIL_PHARMACY', 'WHOLESALE_PHARMACY', 'HOSPITAL', 'DIAGNOSTIC_CENTER', 'HYBRID'],
    departmentScope: 'BRANCH',
    requiredCapabilities: ['INVENTORY'],
    permissionBundles: ['PACK_PHARMACY_OPERATOR'],
    explicitPermissions: ['pharmacy.stock.view', 'pharmacy.stock.adjust', 'inventory.view', 'inventory.adjust'],
    prohibitedActions: ['prescription:APPROVE', 'clinical.prescription.sign', 'lab:VALIDATE', 'radiology:VALIDATE'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  ADMIN: {
    code: 'ADMIN',
    name: 'Facility Administrator',
    description: 'Partner organization administration, staff provisioning, and department configuration.',
    applicableIndustries: [
      'SOLO_DOCTOR_CLINIC',
      'MULTI_SPECIALITY_HOSPITAL',
      'PATHOLOGY',
      'RADIOLOGY',
      'DIAGNOSTIC_CENTRE',
      'PHARMACY_RETAIL',
      'PHARMACY_WHOLESALE',
      'HYBRID'
    ],
    applicableOperatingModels: ['SOLO', 'CLINIC', 'HOSPITAL', 'DIAGNOSTIC_CENTER', 'RETAIL_PHARMACY', 'WHOLESALE_PHARMACY', 'HYBRID'],
    departmentScope: 'PARTNER',
    requiredCapabilities: ['HR'],
    permissionBundles: ['PACK_OPD_BASIC', 'PACK_BILLING_DESK'],
    explicitPermissions: ['facility:CONFIGURE', 'staff:CREATE', 'staff:READ', 'staff:UPDATE', 'billing:EXPORT'],
    prohibitedActions: ['clinical.prescription.sign'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  MANAGEMENT: {
    code: 'MANAGEMENT',
    name: 'Executive Management & Medical Director',
    description: 'Executive MIS dashboards, financial analytics, compliance governance, and audit review.',
    applicableIndustries: [
      'SOLO_DOCTOR_CLINIC',
      'MULTI_SPECIALITY_HOSPITAL',
      'PATHOLOGY',
      'RADIOLOGY',
      'DIAGNOSTIC_CENTRE',
      'PHARMACY_RETAIL',
      'PHARMACY_WHOLESALE',
      'HYBRID'
    ],
    applicableOperatingModels: ['SOLO', 'CLINIC', 'HOSPITAL', 'DIAGNOSTIC_CENTER', 'RETAIL_PHARMACY', 'WHOLESALE_PHARMACY', 'HYBRID'],
    departmentScope: 'PARTNER',
    requiredCapabilities: ['REPORTING'],
    permissionBundles: ['PACK_EXECUTIVE_AUDIT', 'PACK_BILLING_DESK'],
    explicitPermissions: ['billing:EXPORT', 'facility:CONFIGURE', 'patient:READ'],
    prohibitedActions: [],
    version: '1.0.0',
    status: 'ACTIVE'
  }
};

// ============================================================================
// 7. FEATURE MASTER CATALOG
// ============================================================================

export const FEATURE_MASTER_CATALOG: Record<string, FeatureMasterDefinition> = {
  'opd.registration': {
    code: 'opd.registration',
    name: 'Patient UHID Registration & Intake',
    description: 'Patient registration, ABHA linking, and demographic intake.',
    capabilityCode: 'PATIENT_REGISTRATION',
    dependencies: [{ code: 'PATIENT_REGISTRATION', type: 'CAPABILITY' }],
    entitlementRequired: 'PATIENTS',
    requiredPermissions: ['patient:CREATE'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  'opd.queue': {
    code: 'opd.queue',
    name: 'OPD Appointment & Token Queue',
    description: 'Real-time outpatient token queue and consultation scheduling.',
    capabilityCode: 'OPD',
    dependencies: [
      { code: 'PATIENT_REGISTRATION', type: 'CAPABILITY' },
      { code: 'OPD', type: 'CAPABILITY' },
      { code: 'opd.registration', type: 'FEATURE' }
    ],
    entitlementRequired: 'OPD_QUEUE',
    requiredPermissions: ['patient:READ'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  'patient.emr': {
    code: 'patient.emr',
    name: 'Longitudinal Patient 360 & Digital EMR',
    description: 'Clinical consultation charting, vitals, diagnosis, and longitudinal patient record.',
    capabilityCode: 'OPD',
    dependencies: [
      { code: 'OPD', type: 'CAPABILITY' },
      { code: 'opd.registration', type: 'FEATURE' }
    ],
    entitlementRequired: 'CLINICAL_EMR',
    requiredPermissions: ['patient:READ'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  'clinical.prescription': {
    code: 'clinical.prescription',
    name: 'Digital e-Prescription Authoring',
    description: 'Doctor prescription authoring with clinical safety CDSS checks.',
    capabilityCode: 'OPD',
    dependencies: [
      { code: 'OPD', type: 'CAPABILITY' },
      { code: 'patient.emr', type: 'FEATURE' },
      { code: 'prescription:APPROVE', type: 'PERMISSION' }
    ],
    entitlementRequired: 'CLINICAL_EMR',
    requiredPermissions: ['prescription:APPROVE'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  'inpatient.adt': {
    code: 'inpatient.adt',
    name: 'Inpatient Admission, Discharge & Transfer (ADT)',
    description: 'Ward bed allocation, inpatient census, and ADT transitions.',
    capabilityCode: 'IPD',
    dependencies: [
      { code: 'OPD', type: 'CAPABILITY' },
      { code: 'IPD', type: 'CAPABILITY' }
    ],
    entitlementRequired: 'INPATIENT_ADT',
    requiredPermissions: ['inpatient:UPDATE'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  'clinical.icu.admit': {
    code: 'clinical.icu.admit',
    name: 'Intensive Care Unit (ICU) Admission & Telemetry',
    description: 'Critical care ICU bed allocation, ventilator monitoring, and vitals charting.',
    capabilityCode: 'ICU',
    dependencies: [
      { code: 'IPD', type: 'CAPABILITY' },
      { code: 'ICU', type: 'CAPABILITY' },
      { code: 'inpatient.adt', type: 'FEATURE' }
    ],
    entitlementRequired: 'INPATIENT_ADT',
    requiredPermissions: ['icu:UPDATE'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  'lab.orders': {
    code: 'lab.orders',
    name: 'Diagnostic Lab Test Ordering',
    description: 'Create and manage pathology & biochemistry diagnostic orders.',
    capabilityCode: 'LAB_ORDERING',
    dependencies: [{ code: 'LABORATORY', type: 'CAPABILITY' }],
    entitlementRequired: 'PATHOLOGY_LIMS',
    requiredPermissions: ['patient:READ'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  'lab.processing': {
    code: 'lab.processing',
    name: 'Specimen Accessioning & Analyzer Processing',
    description: 'Barcode specimen collection, accessioning, and analyzer worksheet entry.',
    capabilityCode: 'LAB_PROCESSING',
    dependencies: [
      { code: 'LABORATORY', type: 'CAPABILITY' },
      { code: 'lab.orders', type: 'FEATURE' }
    ],
    entitlementRequired: 'PATHOLOGY_LIMS',
    requiredPermissions: ['patient:READ'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  'lab.result.validate': {
    code: 'lab.result.validate',
    name: 'Pathologist Result Sign-off & Report Release',
    description: 'Authorized pathologist validation and digital signature of lab reports.',
    capabilityCode: 'LAB_REPORT_VALIDATION',
    dependencies: [
      { code: 'LABORATORY', type: 'CAPABILITY' },
      { code: 'LAB_PROCESSING', type: 'CAPABILITY' },
      { code: 'lab.processing', type: 'FEATURE' },
      { code: 'lab:VALIDATE', type: 'PERMISSION' }
    ],
    entitlementRequired: 'PATHOLOGY_LIMS',
    requiredPermissions: ['lab:VALIDATE'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  'radiology.pacs': {
    code: 'radiology.pacs',
    name: 'RIS Worklist & DICOM PACS Viewer',
    description: 'Modality study worklist and web DICOM imaging viewer.',
    capabilityCode: 'RADIOLOGY',
    dependencies: [{ code: 'RADIOLOGY', type: 'CAPABILITY' }],
    entitlementRequired: 'RADIOLOGY_PACS',
    requiredPermissions: ['patient:READ'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  'radiology.reporting': {
    code: 'radiology.reporting',
    name: 'Radiologist Study Interpretation & Finalization',
    description: 'Authorized radiologist structured reporting and sign-off.',
    capabilityCode: 'RADIOLOGY',
    dependencies: [
      { code: 'RADIOLOGY', type: 'CAPABILITY' },
      { code: 'radiology.pacs', type: 'FEATURE' },
      { code: 'radiology:VALIDATE', type: 'PERMISSION' }
    ],
    entitlementRequired: 'RADIOLOGY_PACS',
    requiredPermissions: ['radiology:VALIDATE'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  'pharmacy.pos': {
    code: 'pharmacy.pos',
    name: 'Retail Pharmacy POS Counter',
    description: 'Retail pharmacy point-of-sale counter and prescription queue.',
    capabilityCode: 'PHARMACY_RETAIL',
    dependencies: [{ code: 'PHARMACY', type: 'CAPABILITY' }],
    entitlementRequired: 'PHARMACY_POS',
    requiredPermissions: ['pharmacy:DISPENSE'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  'pharmacy.dispense': {
    code: 'pharmacy.dispense',
    name: 'Atomic FEFO Medication Dispensing',
    description: 'Dispense medications with automatic FEFO batch deduction and stock movement audit.',
    capabilityCode: 'PHARMACY_RETAIL',
    dependencies: [
      { code: 'PHARMACY', type: 'CAPABILITY' },
      { code: 'PHARMACY_RETAIL', type: 'CAPABILITY' },
      { code: 'pharmacy.pos', type: 'FEATURE' },
      { code: 'pharmacy:DISPENSE', type: 'PERMISSION' }
    ],
    entitlementRequired: 'PHARMACY_POS',
    requiredPermissions: ['pharmacy:DISPENSE'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  'pharmacy.wholesale': {
    code: 'pharmacy.wholesale',
    name: 'B2B Pharmaceutical Wholesale Invoicing & Stockist Ledger',
    description: 'Bulk B2B GST invoicing with Form 20B/21B buyer drug license validation.',
    capabilityCode: 'PHARMACY_WHOLESALE',
    dependencies: [
      { code: 'PHARMACY', type: 'CAPABILITY' },
      { code: 'PHARMACY_WHOLESALE', type: 'CAPABILITY' }
    ],
    entitlementRequired: 'PHARMACY_WHOLESALE',
    requiredPermissions: ['billing:BILL'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  'billing.invoices': {
    code: 'billing.invoices',
    name: 'Patient & Commercial Invoicing',
    description: 'Tariff billing, GST calculation, receipts, and payment reconciliation.',
    capabilityCode: 'BILLING',
    dependencies: [{ code: 'BILLING', type: 'CAPABILITY' }],
    entitlementRequired: 'BILLING',
    requiredPermissions: ['billing:BILL'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  'inventory.ledger': {
    code: 'inventory.ledger',
    name: 'Batch Inventory & Stock Movement Ledger',
    description: 'GRN purchase inward, batch expiry tracking, and stock ledger.',
    capabilityCode: 'INVENTORY',
    dependencies: [{ code: 'INVENTORY', type: 'CAPABILITY' }],
    entitlementRequired: 'OPERATIONS',
    requiredPermissions: ['patient:READ'],
    version: '1.0.0',
    status: 'ACTIVE'
  },
  'reporting.analytics': {
    code: 'reporting.analytics',
    name: 'Operational & Financial Reporting Analytics',
    description: 'Revenue, turnaround time, and regulatory compliance reports.',
    capabilityCode: 'REPORTING',
    dependencies: [{ code: 'REPORTING', type: 'CAPABILITY' }],
    entitlementRequired: 'OPERATIONS',
    requiredPermissions: ['billing:EXPORT'],
    version: '1.0.0',
    status: 'ACTIVE'
  }
};

// ============================================================================
// 8. PLAN MASTER CATALOG
// ============================================================================

export const PLAN_MASTER_CATALOG: Record<string, PlanMasterDefinition> = {
  'plan-clinic-free-yr1': {
    code: 'plan-clinic-free-yr1',
    name: 'Clinic OPD Starter (Year 1 Free)',
    version: '1.0.0',
    applicableIndustries: ['SOLO_DOCTOR_CLINIC', 'HYBRID'],
    applicableOperatingModels: ['SOLO', 'CLINIC', 'HYBRID'],
    capabilities: ['PATIENT_REGISTRATION', 'APPOINTMENT', 'OPD', 'BILLING', 'REPORTING', 'COMMUNICATION', 'AI', 'INTEGRATION', 'HR'],
    features: ['opd.registration', 'opd.queue', 'patient.emr', 'clinical.prescription', 'billing.invoices', 'reporting.analytics'],
    limits: { maxDoctors: 5, maxBeds: 0, maxBranches: 1, maxConcurrentUsers: 15, storageQuotaGb: 10, monthlyWhatsAppCredits: 500 },
    dependencies: ['OPD'],
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    effectiveTo: null,
    status: 'ACTIVE'
  },
  'plan-hospital-free-yr1': {
    code: 'plan-hospital-free-yr1',
    name: 'Hospital Foundation (OPD Core — Year 1 Free)',
    version: '1.0.0',
    applicableIndustries: ['MULTI_SPECIALITY_HOSPITAL'],
    applicableOperatingModels: ['HOSPITAL', 'HYBRID'],
    capabilities: ['PATIENT_REGISTRATION', 'APPOINTMENT', 'OPD', 'BILLING', 'REPORTING', 'COMMUNICATION', 'INTEGRATION', 'HR'],
    features: ['opd.registration', 'opd.queue', 'patient.emr', 'clinical.prescription', 'billing.invoices', 'reporting.analytics'],
    limits: { maxDoctors: 5, maxBeds: 0, maxBranches: 1, maxConcurrentUsers: 25, storageQuotaGb: 25, monthlyWhatsAppCredits: 1000 },
    dependencies: ['OPD'],
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    effectiveTo: null,
    status: 'ACTIVE'
  },
  'plan-hospital-complete-yr1': {
    code: 'plan-hospital-complete-yr1',
    name: 'Hospital Complete Enterprise Suite',
    version: '1.0.0',
    applicableIndustries: ['MULTI_SPECIALITY_HOSPITAL'],
    applicableOperatingModels: ['HOSPITAL', 'HYBRID'],
    capabilities: [
      'PATIENT_REGISTRATION',
      'APPOINTMENT',
      'OPD',
      'IPD',
      'EMERGENCY',
      'ICU',
      'OT',
      'LAB_ORDERING',
      'LAB_PROCESSING',
      'LAB_REPORT_VALIDATION',
      'LABORATORY',
      'PATHOLOGY',
      'RADIOLOGY',
      'PHARMACY_RETAIL',
      'PHARMACY',
      'BLOOD_BANK',
      'MRD',
      'DIETARY',
      'BILLING',
      'FINANCE',
      'INVENTORY',
      'REPORTING',
      'ANALYTICS',
      'HR',
      'COMMUNICATION',
      'AI',
      'INTEGRATION'
    ],
    features: [
      'opd.registration',
      'opd.queue',
      'patient.emr',
      'clinical.prescription',
      'lab.orders',
      'lab.processing',
      'lab.result.validate',
      'radiology.pacs',
      'radiology.reporting',
      'pharmacy.pos',
      'pharmacy.dispense',
      'billing.invoices',
      'inventory.ledger',
      'reporting.analytics'
    ],
    limits: { maxDoctors: 100, maxBeds: 500, maxBranches: 10, maxConcurrentUsers: 500, storageQuotaGb: 500, monthlyWhatsAppCredits: 10000 },
    dependencies: ['OPD', 'IPD'],
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    effectiveTo: null,
    status: 'ACTIVE'
  },
  'plan-lab-free-yr1': {
    code: 'plan-lab-free-yr1',
    name: 'Pathology & Barcode LIMS Pro (Year 1 Free)',
    version: '1.0.0',
    applicableIndustries: ['PATHOLOGY'],
    applicableOperatingModels: ['DIAGNOSTIC_CENTER', 'SOLO'],
    capabilities: ['PATIENT_REGISTRATION', 'APPOINTMENT', 'LAB_ORDERING', 'LAB_PROCESSING', 'LAB_REPORT_VALIDATION', 'LABORATORY', 'PATHOLOGY', 'BILLING', 'INVENTORY', 'REPORTING', 'COMMUNICATION', 'INTEGRATION', 'HR'],
    features: ['opd.registration', 'lab.orders', 'lab.processing', 'lab.result.validate', 'billing.invoices', 'inventory.ledger', 'reporting.analytics'],
    limits: { maxDoctors: 5, maxBeds: 0, maxBranches: 2, maxConcurrentUsers: 20, storageQuotaGb: 25, monthlyWhatsAppCredits: 1000 },
    dependencies: ['LABORATORY'],
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    effectiveTo: null,
    status: 'ACTIVE'
  },
  'plan-diag-free-yr1': {
    code: 'plan-diag-free-yr1',
    name: 'Diagnostic Centre PACS & LIMS Suite (Year 1 Free)',
    version: '1.0.0',
    applicableIndustries: ['RADIOLOGY', 'DIAGNOSTIC_CENTRE'],
    applicableOperatingModels: ['DIAGNOSTIC_CENTER', 'HYBRID'],
    capabilities: ['PATIENT_REGISTRATION', 'APPOINTMENT', 'LAB_ORDERING', 'LAB_PROCESSING', 'LAB_REPORT_VALIDATION', 'LABORATORY', 'PATHOLOGY', 'RADIOLOGY', 'BILLING', 'INVENTORY', 'REPORTING', 'COMMUNICATION', 'INTEGRATION', 'HR'],
    features: ['opd.registration', 'lab.orders', 'lab.processing', 'lab.result.validate', 'radiology.pacs', 'radiology.reporting', 'billing.invoices', 'inventory.ledger', 'reporting.analytics'],
    limits: { maxDoctors: 10, maxBeds: 0, maxBranches: 3, maxConcurrentUsers: 30, storageQuotaGb: 100, monthlyWhatsAppCredits: 2000 },
    dependencies: ['RADIOLOGY'],
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    effectiveTo: null,
    status: 'ACTIVE'
  },
  'plan-pharma-free-yr1': {
    code: 'plan-pharma-free-yr1',
    name: 'Retail Pharmacy POS & Inventory Suite (Year 1 Free)',
    version: '1.0.0',
    applicableIndustries: ['PHARMACY_RETAIL'],
    applicableOperatingModels: ['RETAIL_PHARMACY', 'SOLO'],
    capabilities: ['PATIENT_REGISTRATION', 'PHARMACY_RETAIL', 'PHARMACY', 'INVENTORY', 'BILLING', 'REPORTING', 'COMMUNICATION', 'HR'],
    features: ['pharmacy.pos', 'pharmacy.dispense', 'inventory.ledger', 'billing.invoices', 'reporting.analytics'],
    limits: { maxDoctors: 0, maxBeds: 0, maxBranches: 2, maxConcurrentUsers: 15, storageQuotaGb: 15, monthlyWhatsAppCredits: 1000 },
    dependencies: ['PHARMACY', 'PHARMACY_RETAIL'],
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    effectiveTo: null,
    status: 'ACTIVE'
  },
  'plan-pharma-wholesale-free-yr1': {
    code: 'plan-pharma-wholesale-free-yr1',
    name: 'Wholesale Pharma Distributor & B2B GST Suite (Year 1 Free)',
    version: '1.0.0',
    applicableIndustries: ['PHARMACY_WHOLESALE'],
    applicableOperatingModels: ['WHOLESALE_PHARMACY'],
    capabilities: ['PHARMACY_WHOLESALE', 'PHARMACY', 'INVENTORY', 'BILLING', 'FINANCE', 'REPORTING', 'COMMUNICATION', 'HR'],
    features: ['pharmacy.wholesale', 'inventory.ledger', 'billing.invoices', 'reporting.analytics'],
    limits: { maxDoctors: 0, maxBeds: 0, maxBranches: 3, maxConcurrentUsers: 25, storageQuotaGb: 25, monthlyWhatsAppCredits: 1500 },
    dependencies: ['PHARMACY', 'PHARMACY_WHOLESALE'],
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    effectiveTo: null,
    status: 'ACTIVE'
  }
};

// ============================================================================
// 9. MASTER FOUNDATION SERVICE (CENTRAL CONTROL PLANE RESOLVER)
// ============================================================================

export class MasterFoundationService {
  /**
   * Normalizes raw industry / partnerType identifiers to a CanonicalIndustryCode.
   * Returns null if rawIndustry is unknown/invalid (Fail-Closed).
   */
  normalizeIndustryCode(rawIndustry?: string | null, rawOperatingMode?: string | null): CanonicalIndustryCode | null {
    if (!rawIndustry || typeof rawIndustry !== 'string') {
      return null;
    }
    const cleaned = rawIndustry.toUpperCase().trim().replace(/[\s-]+/g, '_');
    const opClean = (rawOperatingMode || '').toUpperCase().trim().replace(/[\s-]+/g, '_');

    if (
      cleaned === 'PHARMACY_RETAIL' ||
      cleaned === 'RETAIL_PHARMACY' ||
      cleaned === 'CHEMIST' ||
      cleaned === 'DRUGSTORE' ||
      cleaned === 'DISPENSARY'
    ) {
      return 'PHARMACY_RETAIL';
    }

    if (
      cleaned === 'PHARMACY_WHOLESALE' ||
      cleaned === 'WHOLESALE_PHARMACY' ||
      cleaned.includes('WHOLESALE') ||
      (cleaned === 'PHARMACY' && (opClean === 'WHOLESALE_ONLY' || opClean === 'WHOLESALE_PHARMACY'))
    ) {
      return 'PHARMACY_WHOLESALE';
    }

    if (cleaned === 'PHARMACY') {
      return 'PHARMACY_RETAIL';
    }

    if (
      cleaned === 'PATHOLOGY' ||
      cleaned === 'DIAGNOSTIC_LAB' ||
      cleaned === 'LAB' ||
      cleaned === 'LABORATORY' ||
      cleaned === 'CLINICAL_LAB'
    ) {
      return 'PATHOLOGY';
    }

    if (cleaned === 'RADIOLOGY' || cleaned === 'IMAGING' || cleaned === 'IMAGING_CENTRE' || cleaned === 'IMAGING_CENTER') {
      return 'RADIOLOGY';
    }

    if (cleaned === 'DIAGNOSTIC_CENTRE' || cleaned === 'DIAGNOSTIC_CENTER') {
      return 'DIAGNOSTIC_CENTRE';
    }

    if (
      cleaned === 'HYBRID' ||
      cleaned === 'COMBO_CLINIC_PATHOLOGY' ||
      cleaned === 'COMBO_CLINIC_PHARMACY'
    ) {
      return 'HYBRID';
    }

    if (
      cleaned === 'SOLO_DOCTOR_CLINIC' ||
      cleaned === 'CLINIC' ||
      cleaned === 'CLINIC_GROUP' ||
      cleaned === 'CLINIC_OPD' ||
      cleaned === 'SOLO_PRACTICE' ||
      cleaned === 'INDIVIDUAL_PRACTICE' ||
      cleaned === 'DOCTOR'
    ) {
      return 'SOLO_DOCTOR_CLINIC';
    }

    if (
      cleaned === 'MULTI_SPECIALITY_HOSPITAL' ||
      cleaned === 'MULTI_SPECIALTY_HOSPITAL' ||
      cleaned === 'HOSPITAL' ||
      cleaned === 'HOSPITAL_NETWORK' ||
      cleaned === 'HOSPITAL_SYSTEM' ||
      cleaned === 'NURSING_HOME' ||
      cleaned === 'SURGICAL_CENTER' ||
      cleaned === 'ENTERPRISE_COMMAND'
    ) {
      return 'MULTI_SPECIALITY_HOSPITAL';
    }

    return null;
  }

  /**
   * Normalizes raw operating model string to a CanonicalOperatingModelCode.
   * Returns null if explicitly provided and invalid (Fail-Closed).
   */
  normalizeOperatingModelCode(
    rawOperatingModel?: string | null,
    fallbackIndustry?: CanonicalIndustryCode | null
  ): CanonicalOperatingModelCode | null {
    if (!rawOperatingModel || typeof rawOperatingModel !== 'string' || !rawOperatingModel.trim()) {
      if (fallbackIndustry && INDUSTRY_MASTER_CATALOG[fallbackIndustry]) {
        return INDUSTRY_MASTER_CATALOG[fallbackIndustry].defaultOperatingModel;
      }
      return null;
    }

    const cleaned = rawOperatingModel.toUpperCase().trim().replace(/[\s-]+/g, '_');
    if (cleaned === 'SOLO' || cleaned === 'SOLO_PRACTICE' || cleaned === 'INDIVIDUAL') return 'SOLO';
    if (cleaned === 'CLINIC' || cleaned === 'CLINIC_OPD' || cleaned === 'POLYCLINIC') return 'CLINIC';
    if (cleaned === 'HOSPITAL' || cleaned === 'INPATIENT_HOSPITAL' || cleaned === 'HOSPITAL_NETWORK') return 'HOSPITAL';
    if (cleaned === 'DIAGNOSTIC_CENTER' || cleaned === 'DIAGNOSTIC_CENTRE' || cleaned === 'DIAGNOSTIC_LAB') return 'DIAGNOSTIC_CENTER';
    if (cleaned === 'RETAIL_PHARMACY' || cleaned === 'RETAIL_ONLY' || cleaned === 'PHARMACY_RETAIL') return 'RETAIL_PHARMACY';
    if (cleaned === 'WHOLESALE_PHARMACY' || cleaned === 'WHOLESALE_ONLY' || cleaned === 'PHARMACY_WHOLESALE') return 'WHOLESALE_PHARMACY';
    if (cleaned === 'HYBRID' || cleaned === 'COMBO' || cleaned === 'MULTI_VERTICAL') return 'HYBRID';

    return null;
  }

  /**
   * Validates that an (Industry, OperatingModel) pair is supported by the authoritative Master Catalog.
   * Fails closed when either is unknown or when the combination is incompatible.
   */
  validateIndustryOperatingModel(
    rawIndustry?: string | null,
    rawOperatingModel?: string | null
  ): {
    valid: boolean;
    industry: CanonicalIndustryCode | null;
    operatingModel: CanonicalOperatingModelCode | null;
    industryDef?: IndustryMasterDefinition;
    operatingModelDef?: OperatingModelMasterDefinition;
    reason?: string;
  } {
    const industry = this.normalizeIndustryCode(rawIndustry, rawOperatingModel);
    if (!industry) {
      return {
        valid: false,
        industry: null,
        operatingModel: null,
        reason: `INVALID_INDUSTRY: Industry "${rawIndustry || 'UNKNOWN'}" is not a recognized healthcare industry classification.`
      };
    }

    const industryDef = INDUSTRY_MASTER_CATALOG[industry];
    if (!industryDef || industryDef.status !== 'ACTIVE') {
      return {
        valid: false,
        industry,
        operatingModel: null,
        reason: `INACTIVE_INDUSTRY: Industry "${industry}" is inactive or unavailable.`
      };
    }

    const operatingModel = this.normalizeOperatingModelCode(rawOperatingModel, industry);
    if (!operatingModel) {
      return {
        valid: false,
        industry,
        operatingModel: null,
        reason: `INVALID_OPERATING_MODEL: Operating model "${rawOperatingModel}" is not recognized.`
      };
    }

    const operatingModelDef = OPERATING_MODEL_MASTER_CATALOG[operatingModel];
    if (!operatingModelDef || operatingModelDef.status !== 'ACTIVE') {
      return {
        valid: false,
        industry,
        operatingModel,
        reason: `INACTIVE_OPERATING_MODEL: Operating model "${operatingModel}" is inactive.`
      };
    }

    const isAllowedByIndustry = industryDef.allowedOperatingModels.includes(operatingModel);
    const isCompatibleWithModel = operatingModelDef.compatibleIndustries.includes(industry);

    if (!isAllowedByIndustry || !isCompatibleWithModel) {
      return {
        valid: false,
        industry,
        operatingModel,
        reason: `UNSUPPORTED_INDUSTRY_OPERATING_MODEL_COMBINATION: Industry "${industry}" cannot operate under operating model "${operatingModel}". Allowed models for ${industry}: [${industryDef.allowedOperatingModels.join(', ')}].`
      };
    }

    return {
      valid: true,
      industry,
      operatingModel,
      industryDef,
      operatingModelDef
    };
  }

  /**
   * Resolves effective departments for a validated (Industry, OperatingModel, ActiveCapabilities) tuple.
   */
  resolveEffectiveDepartments(
    industry: CanonicalIndustryCode,
    operatingModel: CanonicalOperatingModelCode,
    activeCapabilities: string[]
  ): DepartmentMasterDefinition[] {
    const capSet = new Set(activeCapabilities.map((c) => c.toUpperCase()));
    const industryDef = INDUSTRY_MASTER_CATALOG[industry];
    if (!industryDef) return [];

    return Object.values(DEPARTMENT_MASTER_CATALOG).filter((dept) => {
      if (dept.status !== 'ACTIVE') return false;
      if (!industryDef.allowedDepartments.includes(dept.code)) return false;
      if (!dept.applicableIndustries.includes(industry)) return false;
      if (!dept.applicableOperatingModels.includes(operatingModel)) return false;
      return dept.requiredCapabilities.every((reqCap) => capSet.has(reqCap.toUpperCase()));
    });
  }

  /**
   * Resolves effective role templates for a validated (Industry, OperatingModel, ActiveCapabilities) tuple.
   */
  resolveEffectiveRoleTemplates(
    industry: CanonicalIndustryCode,
    operatingModel: CanonicalOperatingModelCode,
    activeCapabilities: string[]
  ): RoleTemplateMasterDefinition[] {
    const capSet = new Set(activeCapabilities.map((c) => c.toUpperCase()));
    const industryDef = INDUSTRY_MASTER_CATALOG[industry];
    if (!industryDef) return [];

    return Object.values(ROLE_TEMPLATE_MASTER_CATALOG).filter((role) => {
      if (role.status !== 'ACTIVE') return false;
      if (!industryDef.allowedRoleTemplates.includes(role.code)) return false;
      if (!role.applicableIndustries.includes(industry)) return false;
      if (!role.applicableOperatingModels.includes(operatingModel)) return false;
      return role.requiredCapabilities.every((reqCap) => capSet.has(reqCap.toUpperCase()));
    });
  }

  /**
   * Resolves effective features for a validated (Industry, OperatingModel, ActiveCapabilities) tuple.
   * Supports both (industry, operatingModel, activeCapabilities, grantedPermissions) and (industry, activeCapabilities, grantedPermissions).
   */
  resolveEffectiveFeatures(
    industry: CanonicalIndustryCode,
    operatingModelOrCapabilities: CanonicalOperatingModelCode | string[],
    capabilitiesOrPermissions?: string[],
    maybePermissions?: string[]
  ): Array<FeatureMasterDefinition & { enabled: boolean; blockedReason: string | null }> {
    const industryDef = INDUSTRY_MASTER_CATALOG[industry];
    if (!industryDef) return [];

    const activeCapabilities: string[] = Array.isArray(operatingModelOrCapabilities)
      ? operatingModelOrCapabilities
      : Array.isArray(capabilitiesOrPermissions)
        ? capabilitiesOrPermissions
        : [];

    const grantedPermissions: string[] = Array.isArray(operatingModelOrCapabilities)
      ? capabilitiesOrPermissions || ['*']
      : maybePermissions || ['*'];

    const results: Array<FeatureMasterDefinition & { enabled: boolean; blockedReason: string | null }> = [];

    for (const feat of Object.values(FEATURE_MASTER_CATALOG)) {
      if (feat.status !== 'ACTIVE') continue;
      if (!industryDef.allowedFeatures.includes(feat.code)) continue;

      const depEval = capabilityEngine.validateFeatureDependencies(feat.code, activeCapabilities, {
        activeFeatures: industryDef.allowedFeatures,
        grantedPermissions
      });

      results.push({
        ...feat,
        enabled: depEval.allowed,
        blockedReason: depEval.allowed ? null : depEval.reason || 'Feature dependency unmet'
      });
    }

    return results;
  }

  /**
   * Returns the complete Master Foundation Catalog (Industries, Operating Models,
   * Departments, Role Templates, Permissions, Capabilities, Features, Plans).
   */
  getMasterCatalog() {
    return {
      version: '1.0.0',
      industries: Object.values(INDUSTRY_MASTER_CATALOG),
      operatingModels: Object.values(OPERATING_MODEL_MASTER_CATALOG),
      departments: Object.values(DEPARTMENT_MASTER_CATALOG),
      roleTemplates: Object.values(ROLE_TEMPLATE_MASTER_CATALOG),
      permissions: Object.values(PERMISSION_MASTER_CATALOG),
      capabilities: capabilityEngine.getAllCapabilities(),
      features: Object.values(FEATURE_MASTER_CATALOG),
      plans: Object.values(PLAN_MASTER_CATALOG)
    };
  }

  /**
   * Resolves the authoritative runtime foundation state for a Partner / Tenant from PostgreSQL.
   * Fails closed if the partner/tenant is inactive, suspended, missing configuration, or has an invalid
   * Industry/Operating Model combination.
   */
  async resolveEffectivePartnerFoundation(
    partnerOrTenantId: string,
    overrides?: {
      industryOverride?: string;
      operatingModelOverride?: string;
    }
  ) {
    const db = getDatabase();
    const targetUuid =
      partnerOrTenantId.includes('-') && partnerOrTenantId.length === 36
        ? partnerOrTenantId
        : toDeterministicUuid(partnerOrTenantId);

    let partnerProfile: any = null;
    let tenantRow: any = null;
    let activeLicense: any = null;
    let activeSubscription: any = null;
    let activePlan: any = null;
    let dbCapabilities: any[] = [];
    let latestConfigVersion = 1;

    if (db) {
      try {
        const [tRow] = await db.select().from(tenants).where(eq(tenants.id, targetUuid)).limit(1);
        tenantRow = tRow || null;

        const [pRow] = await db
          .select()
          .from(partnerProfiles)
          .where(eq(partnerProfiles.tenantId, targetUuid))
          .limit(1);
        partnerProfile = pRow || null;

        const licRows = await db
          .select()
          .from(licenses)
          .where(eq(licenses.tenantId, targetUuid));
        activeLicense =
          licRows.find((l) =>
            ['ACTIVE', 'FREE_ACTIVE', 'EXPIRING_SOON', 'RENEWAL_WINDOW', 'GRACE_PERIOD'].includes(String(l.status).toUpperCase())
          ) || licRows[0] || null;

        if (partnerProfile) {
          const subRows = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.partnerId, partnerProfile.id));
          activeSubscription =
            subRows.find((s) => ['ACTIVE', 'FREE_ACTIVE', 'TRIAL'].includes(String(s.status).toUpperCase())) ||
            subRows[0] ||
            null;
        }

        const planIdToLookup = activeLicense?.planId || activeSubscription?.planId;
        if (planIdToLookup) {
          const [plRow] = await db.select().from(plans).where(eq(plans.id, planIdToLookup)).limit(1);
          activePlan = plRow || null;
        }

        dbCapabilities = await db
          .select()
          .from(partnerCapabilities)
          .where(eq(partnerCapabilities.tenantId, targetUuid));

        const [latestCfg] = await db
          .select()
          .from(partnerConfigurationVersions)
          .where(eq(partnerConfigurationVersions.tenantId, targetUuid))
          .orderBy(desc(partnerConfigurationVersions.versionNumber))
          .limit(1);
        if (latestCfg) {
          latestConfigVersion = latestCfg.versionNumber;
        } else if (partnerProfile?.configurationVersion) {
          latestConfigVersion = partnerProfile.configurationVersion;
        }
      } catch (err) {
        logger.warn('Database lookup warning in resolveEffectivePartnerFoundation', { error: String(err) });
      }
    }

    const pMeta = (partnerProfile?.metadata || {}) as Record<string, any>;
    const lMeta = (activeLicense?.metadata || {}) as Record<string, any>;

    const rawIndustry =
      overrides?.industryOverride ??
      pMeta['industry'] ??
      partnerProfile?.partnerType ??
      lMeta['partnerType'] ??
      lMeta['facilityType'] ??
      lMeta['organizationType'] ??
      null;

    const rawOperatingModel =
      overrides?.operatingModelOverride ??
      pMeta['operatingModel'] ??
      pMeta['operatingMode'] ??
      lMeta['operatingMode'] ??
      null;

    const validation = this.validateIndustryOperatingModel(rawIndustry, rawOperatingModel);

    const tenantStatus = String(tenantRow?.status || 'ACTIVE').toUpperCase();
    const partnerLifecycleStatus = String(partnerProfile?.lifecycleStatus || 'ACTIVE').toUpperCase();
    const isPartnerActive =
      tenantStatus === 'ACTIVE' &&
      partnerLifecycleStatus !== 'SUSPENDED' &&
      partnerLifecycleStatus !== 'TERMINATED' &&
      partnerLifecycleStatus !== 'REVOKED' &&
      partnerLifecycleStatus !== 'INACTIVE';

    if (!validation.valid || !validation.industry || !validation.operatingModel || !validation.industryDef) {
      return {
        isValid: false,
        isPartnerActive,
        reason: validation.reason || 'INVALID_PARTNER_CONFIGURATION',
        tenantId: targetUuid,
        partnerId: partnerProfile?.id || partnerOrTenantId,
        industry: validation.industry,
        operatingModel: validation.operatingModel,
        configurationVersion: latestConfigVersion,
        effectiveCapabilities: [] as string[],
        effectiveDepartments: [] as DepartmentMasterDefinition[],
        effectiveRoleTemplates: [] as RoleTemplateMasterDefinition[],
        effectiveFeatures: [] as FeatureMasterDefinition[]
      };
    }

    // Compute effective capabilities = Industry Allowed ∩ Plan/DB Active Capabilities
    const industryAllowedCaps = new Set(validation.industryDef.allowedCapabilities.map((c) => c.toUpperCase()));
    let activeCaps: string[];

    if (dbCapabilities.length > 0) {
      const now = new Date();
      activeCaps = dbCapabilities
        .filter((c) => {
          if (String(c.status).toUpperCase() !== 'ACTIVE') return false;
          if (c.trialEndsAt && new Date(c.trialEndsAt) < now) return false;
          return industryAllowedCaps.has(String(c.capabilityCode).toUpperCase());
        })
        .map((c) => String(c.capabilityCode).toUpperCase());
      // Always include foundational capabilities allowed by the industry if not explicitly disabled
      for (const baseCap of ['PATIENT_REGISTRATION', 'APPOINTMENT', 'BILLING', 'REPORTING', 'HR', 'INVENTORY', 'LAB_ORDERING', 'LAB_PROCESSING', 'LAB_REPORT_VALIDATION', 'PHARMACY_RETAIL', 'PHARMACY_WHOLESALE']) {
        const explicitlyDisabled = dbCapabilities.some(
          (c) => String(c.capabilityCode).toUpperCase() === baseCap && String(c.status).toUpperCase() === 'DISABLED'
        );
        if (!explicitlyDisabled && industryAllowedCaps.has(baseCap) && !activeCaps.includes(baseCap)) {
          activeCaps.push(baseCap);
        }
      }
    } else {
      activeCaps = Array.from(industryAllowedCaps);
    }

    const effectiveDepartments = this.resolveEffectiveDepartments(
      validation.industry,
      validation.operatingModel,
      activeCaps
    );
    const effectiveRoleTemplates = this.resolveEffectiveRoleTemplates(
      validation.industry,
      validation.operatingModel,
      activeCaps
    );
    const effectiveFeatures = this.resolveEffectiveFeatures(validation.industry, activeCaps);

    const licenseEval = activeLicense ? licenseService.evaluateLicenseStatus(activeLicense) : null;
    const isSignatureValid = activeLicense ? licenseService.verifyLicenseSignature(activeLicense) : false;

    return {
      isValid: isPartnerActive,
      isPartnerActive,
      reason: isPartnerActive ? null : `PARTNER_INACTIVE: Tenant status=${tenantStatus}, lifecycleStatus=${partnerLifecycleStatus}`,
      tenantId: targetUuid,
      partnerId: partnerProfile?.id || partnerOrTenantId,
      industry: validation.industry,
      operatingModel: validation.operatingModel,
      industryDefinition: validation.industryDef,
      operatingModelDefinition: validation.operatingModelDef,
      configurationVersion: latestConfigVersion,
      subscription: activeSubscription
        ? {
            id: activeSubscription.id,
            planId: activeSubscription.planId,
            planVersion: activeSubscription.planVersion,
            status: activeSubscription.status,
            startDate: activeSubscription.startDate,
            endDate: activeSubscription.endDate,
            renewalDate: activeSubscription.renewalDate
          }
        : null,
      license: activeLicense
        ? {
            id: activeLicense.id,
            licenseKey: activeLicense.licenseKey,
            status: licenseEval?.status || activeLicense.status,
            isAccessAllowed: Boolean(licenseEval?.isAccessAllowed && isSignatureValid),
            isSignatureValid,
            expiryDate: activeLicense.expiryDate,
            daysRemaining: licenseEval?.daysRemaining ?? 0
          }
        : null,
      plan: activePlan
        ? {
            id: activePlan.id,
            code: activePlan.code,
            name: activePlan.name,
            version: activePlan.version
          }
        : null,
      effectiveCapabilities: activeCaps,
      effectiveDepartments,
      effectiveRoleTemplates,
      effectiveFeatures
    };
  }

  /**
   * Configures a partner's authoritative Industry and Operating Model in PostgreSQL
   * and creates an immutable configuration version snapshot.
   */
  async configurePartnerFoundation(
    partnerOrTenantId: string,
    input: {
      industry: string;
      operatingModel: string;
      reason: string;
      lifecycleStatus?: ConfigurationLifecycleStatus;
    },
    actorEmail = 'founder@docsearch.health'
  ) {
    const validation = this.validateIndustryOperatingModel(input.industry, input.operatingModel);
    if (!validation.valid || !validation.industry || !validation.operatingModel || !validation.industryDef) {
      throw new AppError({
        message: validation.reason || 'Invalid Industry and Operating Model combination',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    const db = getDatabase();
    const targetUuid =
      partnerOrTenantId.includes('-') && partnerOrTenantId.length === 36
        ? partnerOrTenantId
        : toDeterministicUuid(partnerOrTenantId);

    let newVersionNumber = 1;
    const now = new Date();
    const desiredLifecycle: ConfigurationLifecycleStatus = input.lifecycleStatus || 'PUBLISHED';

    if (db) {
      // Ensure classification exists in partner_classifications
      await db
        .insert(partnerClassifications)
        .values({
          id: crypto.randomUUID(),
          code: validation.industry,
          label: validation.industryDef.name,
          description: validation.industryDef.description,
          category: 'HEALTHCARE_PROVIDER',
          defaultPlanCode: validation.industryDef.allowedPlans[0] || 'plan-clinic-free-yr1',
          status: 'ACTIVE',
          metadata: {
            version: validation.industryDef.version,
            allowedOperatingModels: validation.industryDef.allowedOperatingModels
          }
        })
        .onConflictDoNothing({ target: partnerClassifications.code });

      const [existingProfile] = await db
        .select()
        .from(partnerProfiles)
        .where(eq(partnerProfiles.tenantId, targetUuid))
        .limit(1);

      const history = await db
        .select()
        .from(partnerConfigurationVersions)
        .where(eq(partnerConfigurationVersions.tenantId, targetUuid))
        .orderBy(desc(partnerConfigurationVersions.versionNumber));

      if (history.length > 0 && history[0]) {
        newVersionNumber = history[0].versionNumber + 1;
      }

      // If publishing, mark previous PUBLISHED versions as SUPERSEDED in their snapshot metadata (preserving historical payload)
      if (desiredLifecycle === 'PUBLISHED' && history.length > 0) {
        for (const h of history) {
          const snap = (h.snapshot || {}) as Record<string, any>;
          if (snap['lifecycleStatus'] === 'PUBLISHED' || !snap['lifecycleStatus']) {
            await db
              .update(partnerConfigurationVersions)
              .set({
                snapshot: {
                  ...snap,
                  lifecycleStatus: 'SUPERSEDED',
                  effectiveTo: now.toISOString()
                }
              })
              .where(eq(partnerConfigurationVersions.id, h.id));
          }
        }
      }

      if (existingProfile && desiredLifecycle === 'PUBLISHED') {
        const currentMeta = (existingProfile.metadata || {}) as Record<string, any>;
        await db
          .update(partnerProfiles)
          .set({
            partnerType: validation.industry,
            configurationVersion: newVersionNumber,
            metadata: {
              ...currentMeta,
              industry: validation.industry,
              operatingModel: validation.operatingModel,
              operatingMode:
                validation.operatingModel === 'WHOLESALE_PHARMACY'
                  ? 'WHOLESALE_ONLY'
                  : validation.operatingModel === 'RETAIL_PHARMACY'
                    ? 'RETAIL_ONLY'
                    : validation.operatingModel
            },
            updatedAt: now
          })
          .where(eq(partnerProfiles.id, existingProfile.id));
      }

      const snapshotPayload = {
        industry: validation.industry,
        operatingModel: validation.operatingModel,
        lifecycleStatus: desiredLifecycle,
        effectiveFrom: now.toISOString(),
        effectiveTo: null,
        capabilities: validation.industryDef.allowedCapabilities,
        departments: validation.industryDef.allowedDepartments,
        roles: validation.industryDef.allowedRoleTemplates,
        features: validation.industryDef.allowedFeatures
      };

      await db.insert(partnerConfigurationVersions).values({
        id: crypto.randomUUID(),
        tenantId: targetUuid,
        partnerId: existingProfile?.id || partnerOrTenantId,
        versionNumber: newVersionNumber,
        snapshot: snapshotPayload,
        diffSummary: `v${newVersionNumber} [${desiredLifecycle}]: Industry=${validation.industry}, OperatingModel=${validation.operatingModel}`,
        changeReason: input.reason,
        changedBy: actorEmail
      });

      entitlementService.invalidateTenantCache(targetUuid);
    }

    return {
      tenantId: targetUuid,
      industry: validation.industry,
      operatingModel: validation.operatingModel,
      versionNumber: newVersionNumber,
      lifecycleStatus: desiredLifecycle,
      effectiveFrom: now.toISOString(),
      changeReason: input.reason,
      changedBy: actorEmail
    };
  }
}

export const masterFoundationService = new MasterFoundationService();
