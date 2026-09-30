import {
  getDatabase,
  partnerGovernanceOverrides,
  partnerProfiles,
  tenants,
  subscriptions,
  licenses,
  partnerCapabilities,
  roles,
  eq,
  and
} from '@docsearch/database';
import { capabilityEngine } from './CapabilityAndDependencyEngine.js';
import { conditionalPolicyEngine, type PolicyEvaluationContext } from './ConditionalPolicyEngine.js';
import { toDeterministicUuid } from '../../repositories/company/PartnerOnboardingRepository.js';
import { licenseService } from './LicenseService.js';
import { entitlementService } from './EntitlementService.js';
import { masterFoundationService, ROLE_TEMPLATE_MASTER_CATALOG } from './MasterFoundationService.js';

export type AccessDecisionType = 'ALLOW' | 'DENY';

export interface DecisionTierTrace {
  tierNumber: number;
  tierName: string;
  status: 'PASS' | 'DENY' | 'OVERRIDE' | 'SKIPPED';
  detail: string;
}

export interface AccessDecision {
  decision: AccessDecisionType;
  code: string;
  reason: string;
  decisiveTier: string;
  tierNumber: number;
  trace: DecisionTierTrace[];
  timestamp: string;
  evaluatedContext: {
    partnerId?: string | undefined;
    userId?: string | undefined;
    role?: string | undefined;
    branchId?: string | undefined;
    department?: string | undefined;
    industry?: string | undefined;
    operatingModel?: string | undefined;
    action: string;
    resource?: string | undefined;
  };
}

export interface AccessEvaluationParams {
  partnerId?: string | undefined;
  tenantId?: string | undefined;
  userId?: string | undefined;
  userEmail?: string | undefined;
  role?: string | undefined;
  roles?: string[] | undefined;
  branchId?: string | undefined;
  assignedBranchId?: string | undefined;
  departmentId?: string | undefined;
  departmentCode?: string | undefined;
  assignedDepartmentCode?: string | undefined;
  industry?: string | undefined;
  operatingModel?: string | undefined;
  requireCommercialRecords?: boolean | undefined;
  action: string; // e.g. "patient.view", "invoice.create", "lab.result.validate"
  resource?: string | undefined; // e.g. "patient", "billing", "lab"
  timestamp?: Date | undefined;
  isSuperAdmin?: boolean | undefined;
}

export interface AccessSimulationParams extends AccessEvaluationParams {
  licenseStatusOverride?: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'GRACE_PERIOD' | 'LOCKED';
  subscriptionStatusOverride?: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  planCodeOverride?: string;
  globalFreezeOverride?: boolean;
  capabilitiesOverride?: string[];
}

export interface PermissionPack {
  code: string;
  name: string;
  category: 'OPERATIONS' | 'CLINICAL' | 'DIAGNOSTICS' | 'ADMIN';
  permissions: string[];
}

export interface ProductionRoleConfig {
  code: string;
  name: string;
  description: string;
  dataScope: 'PARTNER' | 'BRANCH' | 'DEPARTMENT' | 'ASSIGNED';
  branchScope: 'ALL_BRANCHES' | 'ASSIGNED_BRANCH';
  permissionPacks: string[];
  explicitPermissions?: string[];
  prohibitedActions?: string[];
}

export const AUTHORITATIVE_PERMISSION_PACKS: Record<string, PermissionPack> = {
  PACK_OPD_BASIC: {
    code: 'PACK_OPD_BASIC',
    name: 'OPD Basic Access',
    category: 'OPERATIONS',
    permissions: [
      'patient.view',
      'patient.create',
      'patient:record:view',
      'patient:record:create',
      'appointment.view',
      'appointment.create',
      'appointment:token:view',
      'appointment:token:create',
      'opd.queue.view',
      'queue.view'
    ]
  },
  PACK_CLINICAL_DOCS: {
    code: 'PACK_CLINICAL_DOCS',
    name: 'Clinical Documentation Access',
    category: 'CLINICAL',
    permissions: [
      'patient.view',
      'patient:record:view',
      'clinical.consultation.view',
      'clinical.consultation.author',
      'clinical:consultation:author',
      'clinical.prescription.create',
      'clinical.prescription.sign',
      'clinical:prescription:sign',
      'clinical.vitals.record',
      'clinical:vitals:record',
      'patient.vitals.record',
      'investigation.order',
      'investigation.view',
      'radiology.view',
      'radiology.study.view',
      'ai.scribe',
      'ai.copilot'
    ]
  },
  PACK_PHARMACY_OPERATOR: {
    code: 'PACK_PHARMACY_OPERATOR',
    name: 'Pharmacy Operator Access',
    category: 'OPERATIONS',
    permissions: [
      'pharmacy.dispense',
      'pharmacy.dispense.create',
      'pharmacy:dispense:create',
      'pharmacy.stock.view',
      'pharmacy:stock:view',
      'pharmacy.stock.adjust',
      'pharmacy:stock:adjust',
      'pharmacy.inventory.view',
      'pharmacy.inventory.adjust',
      'inventory.view',
      'inventory.adjust',
      'pharmacy:invoice:create',
      'invoice.create',
      'invoice.view',
      'patient.view'
    ]
  },
  PACK_LAB_TECH: {
    code: 'PACK_LAB_TECH',
    name: 'Laboratory Technician Access',
    category: 'DIAGNOSTICS',
    permissions: [
      'lab.order.view',
      'lab:order:view',
      'lab.sample.accession',
      'lab.sample.collect',
      'lab:sample:collect',
      'lab.result.enter',
      'lab:result:enter',
      'lab.result.validate',
      'lab:result:validate',
      'investigation.view',
      'patient.view'
    ]
  },
  PACK_RADIOLOGY_TECH: {
    code: 'PACK_RADIOLOGY_TECH',
    name: 'Radiology Specialist Access',
    category: 'DIAGNOSTICS',
    permissions: [
      'radiology.order.view',
      'radiology.study.view',
      'radiology.report.sign',
      'radiology:report:sign',
      'radiology.dicom.view',
      'patient.view',
      'clinical.consultation.view'
    ]
  },
  PACK_BILLING_DESK: {
    code: 'PACK_BILLING_DESK',
    name: 'Billing & Cashier Access',
    category: 'ADMIN',
    permissions: [
      'invoice.view',
      'billing:invoice:view',
      'invoice.create',
      'billing:invoice:create',
      'invoice.item.add',
      'payment.collect',
      'billing:payment:collect',
      'billing.claims.submit',
      'billing:claims:submit',
      'insurance.verify',
      'insurance.claim.create',
      'patient.view'
    ]
  },
  PACK_RECEPTION_DESK: {
    code: 'PACK_RECEPTION_DESK',
    name: 'Reception & Front Desk Access',
    category: 'OPERATIONS',
    permissions: [
      'patient.view',
      'patient.create',
      'patient:record:view',
      'patient:record:create',
      'appointment.view',
      'appointment.create',
      'appointment:token:view',
      'appointment:token:create',
      'queue.view',
      'abdm.lookup',
      'invoice.view',
      'billing:invoice:view'
    ]
  },
  PACK_NURSING_CORE: {
    code: 'PACK_NURSING_CORE',
    name: 'Ward Nursing Core Access',
    category: 'CLINICAL',
    permissions: [
      'patient.view',
      'patient.vitals.record',
      'patient:record:view',
      'clinical.vitals.record',
      'clinical:vitals:record',
      'inpatient.bed.manage',
      'inpatient:bed:manage',
      'inpatient.rounds.note',
      'inpatient:rounds:note',
      'inpatient.chart.view',
      'dietary.order',
      'emergency.triage',
      'bloodbank.request'
    ]
  },
  PACK_EXECUTIVE_AUDIT: {
    code: 'PACK_EXECUTIVE_AUDIT',
    name: 'Executive & Compliance Audit Access',
    category: 'ADMIN',
    permissions: ['*']
  }
};

export const AUTHORITATIVE_ROLES: Record<string, ProductionRoleConfig> = {
  SUPER_ADMIN: {
    code: 'SUPER_ADMIN',
    name: 'Super Administrator',
    description: 'Universal unrestricted platform administrative access',
    dataScope: 'PARTNER',
    branchScope: 'ALL_BRANCHES',
    permissionPacks: ['PACK_EXECUTIVE_AUDIT'],
    explicitPermissions: ['*']
  },
  COMPANY_ADMIN: {
    code: 'COMPANY_ADMIN',
    name: 'Company Administrator',
    description: 'Unrestricted enterprise tenant administration',
    dataScope: 'PARTNER',
    branchScope: 'ALL_BRANCHES',
    permissionPacks: ['PACK_EXECUTIVE_AUDIT'],
    explicitPermissions: ['*']
  },
  HOSPITAL_DIRECTOR: {
    code: 'HOSPITAL_DIRECTOR',
    name: 'Medical Director / CEO',
    description: 'Executive oversight, clinical governance, and financial audits',
    dataScope: 'PARTNER',
    branchScope: 'ALL_BRANCHES',
    permissionPacks: ['PACK_EXECUTIVE_AUDIT', 'PACK_BILLING_DESK'],
    explicitPermissions: ['executive.audit.view', 'executive.report.view', 'patient.view']
  },
  HOSPITAL_ADMIN: {
    code: 'HOSPITAL_ADMIN',
    name: 'Hospital Director / Admin',
    description: 'Hospital-wide operational and financial administration',
    dataScope: 'PARTNER',
    branchScope: 'ALL_BRANCHES',
    permissionPacks: ['PACK_EXECUTIVE_AUDIT', 'PACK_BILLING_DESK']
  },
  CLINIC_ADMIN: {
    code: 'CLINIC_ADMIN',
    name: 'Clinic Administrator',
    description: 'Complete operational and billing administrative access for clinic',
    dataScope: 'PARTNER',
    branchScope: 'ALL_BRANCHES',
    permissionPacks: ['PACK_OPD_BASIC', 'PACK_BILLING_DESK', 'PACK_EXECUTIVE_AUDIT']
  },
  GROUP_SUPER_ADMIN: {
    code: 'GROUP_SUPER_ADMIN',
    name: 'Group Executive Officer',
    description: 'Multi-hospital healthcare network executive oversight',
    dataScope: 'PARTNER',
    branchScope: 'ALL_BRANCHES',
    permissionPacks: ['PACK_EXECUTIVE_AUDIT', 'PACK_BILLING_DESK']
  },
  SPECIALTY_DIRECTOR: {
    code: 'SPECIALTY_DIRECTOR',
    name: 'Institute Director & Specialist',
    description: 'Specialty institute direction, surgical governance and administration',
    dataScope: 'PARTNER',
    branchScope: 'ALL_BRANCHES',
    permissionPacks: ['PACK_CLINICAL_DOCS', 'PACK_BILLING_DESK', 'PACK_EXECUTIVE_AUDIT']
  },
  HEAD_OF_DEPARTMENT: {
    code: 'HEAD_OF_DEPARTMENT',
    name: 'Department Head',
    description: 'Clinical department administration and consultations',
    dataScope: 'DEPARTMENT',
    branchScope: 'ASSIGNED_BRANCH',
    permissionPacks: ['PACK_CLINICAL_DOCS', 'PACK_OPD_BASIC'],
    prohibitedActions: ['staff.payroll.manage', 'invoice.refund']
  },
  DOCTOR: {
    code: 'DOCTOR',
    name: 'Attending Physician',
    description: 'Clinical consultation, prescription authoring and patient history view',
    dataScope: 'ASSIGNED',
    branchScope: 'ASSIGNED_BRANCH',
    permissionPacks: ['PACK_CLINICAL_DOCS', 'PACK_OPD_BASIC'],
    explicitPermissions: ['clinical.prescription.sign', 'patient.*', 'clinical.*', 'investigation.*', 'radiology.view', 'ai.*'],
    prohibitedActions: ['invoice.refund', 'staff.payroll.manage', 'payroll', 'refund']
  },
  SURGEON: {
    code: 'SURGEON',
    name: 'Chief Consultant Surgeon',
    description: 'Operative procedures, surgical notes and clinical consultations',
    dataScope: 'ASSIGNED',
    branchScope: 'ALL_BRANCHES',
    permissionPacks: ['PACK_CLINICAL_DOCS', 'PACK_OPD_BASIC'],
    explicitPermissions: ['clinical.prescription.sign', 'patient.*', 'clinical.*', 'investigation.*', 'ot.*', 'surgery.*'],
    prohibitedActions: ['invoice.refund', 'staff.payroll.manage', 'payroll', 'refund']
  },
  ATTENDING_PHYSICIAN: {
    code: 'ATTENDING_PHYSICIAN',
    name: 'Attending Physician',
    description: 'Inpatient and outpatient clinical care',
    dataScope: 'ASSIGNED',
    branchScope: 'ASSIGNED_BRANCH',
    permissionPacks: ['PACK_CLINICAL_DOCS', 'PACK_OPD_BASIC'],
    explicitPermissions: ['clinical.prescription.sign', 'patient.*', 'clinical.*'],
    prohibitedActions: ['invoice.refund', 'staff.payroll.manage', 'payroll', 'refund']
  },
  CONSULTANT: {
    code: 'CONSULTANT',
    name: 'Visiting Consultant',
    description: 'Specialist clinical consultations and orders',
    dataScope: 'ASSIGNED',
    branchScope: 'ASSIGNED_BRANCH',
    permissionPacks: ['PACK_CLINICAL_DOCS', 'PACK_OPD_BASIC'],
    explicitPermissions: ['clinical.prescription.sign', 'patient.*', 'clinical.*'],
    prohibitedActions: ['invoice.refund', 'staff.payroll.manage', 'payroll', 'refund']
  },
  RECEPTIONIST: {
    code: 'RECEPTIONIST',
    name: 'Front Desk Receptionist',
    description: 'Patient check-in, token distribution and appointment scheduling',
    dataScope: 'BRANCH',
    branchScope: 'ASSIGNED_BRANCH',
    permissionPacks: ['PACK_RECEPTION_DESK', 'PACK_OPD_BASIC'],
    explicitPermissions: ['patient.view', 'patient.create', 'appointment.create', 'appointment.view', 'queue.view'],
    prohibitedActions: [
      'prescription.sign',
      'clinical.prescription.sign',
      'clinical.diagnosis.enter',
      'diagnosis',
      'lab.result.validate',
      'lab.result.enter',
      'invoice.refund',
      'clinical.surgery.schedule',
      'surgery'
    ]
  },
  FRONT_DESK_LEAD: {
    code: 'FRONT_DESK_LEAD',
    name: 'Front Desk Lead',
    description: 'Front office supervision, appointment desk and token management',
    dataScope: 'BRANCH',
    branchScope: 'ASSIGNED_BRANCH',
    permissionPacks: ['PACK_RECEPTION_DESK', 'PACK_OPD_BASIC'],
    explicitPermissions: ['patient.view', 'patient.create', 'appointment.create', 'appointment.view', 'queue.view', 'invoice.view'],
    prohibitedActions: [
      'prescription.sign',
      'clinical.prescription.sign',
      'clinical.diagnosis.enter',
      'diagnosis',
      'lab.result.validate',
      'invoice.refund'
    ]
  },
  SENIOR_RECEPTION_MANAGER: {
    code: 'SENIOR_RECEPTION_MANAGER',
    name: 'Senior Reception Manager',
    description: 'Reception department leadership and patient flow management',
    dataScope: 'BRANCH',
    branchScope: 'ASSIGNED_BRANCH',
    permissionPacks: ['PACK_RECEPTION_DESK', 'PACK_OPD_BASIC'],
    explicitPermissions: ['patient.view', 'patient.create', 'appointment.create', 'appointment.view', 'invoice.view'],
    prohibitedActions: [
      'prescription.sign',
      'clinical.prescription.sign',
      'clinical.diagnosis.enter',
      'diagnosis',
      'lab.result.validate',
      'invoice.refund',
      'staff.payroll.manage'
    ]
  },
  NURSE: {
    code: 'NURSE',
    name: 'Staff Ward Nurse',
    description: 'Inpatient bedside care, vital signs recording and nursing notes',
    dataScope: 'DEPARTMENT',
    branchScope: 'ASSIGNED_BRANCH',
    permissionPacks: ['PACK_NURSING_CORE'],
    explicitPermissions: ['patient.vitals.record', 'clinical.vitals.record', 'patient.view'],
    prohibitedActions: [
      'prescription.sign',
      'clinical.prescription.sign',
      'prescription.create',
      'clinical.prescription.create',
      'patient.discharge.sign',
      'clinical.surgery.schedule',
      'surgery',
      'invoice.create',
      'invoice.refund'
    ]
  },
  STAFF_NURSE: {
    code: 'STAFF_NURSE',
    name: 'Staff General Nurse',
    description: 'Ward nursing care, vitals charting and medication administration',
    dataScope: 'DEPARTMENT',
    branchScope: 'ASSIGNED_BRANCH',
    permissionPacks: ['PACK_NURSING_CORE'],
    explicitPermissions: ['patient.vitals.record', 'clinical.vitals.record', 'patient.view'],
    prohibitedActions: [
      'prescription.sign',
      'clinical.prescription.sign',
      'prescription.create',
      'clinical.prescription.create',
      'patient.discharge.sign',
      'clinical.surgery.schedule',
      'surgery',
      'invoice.create',
      'invoice.refund'
    ]
  },
  CHARGE_NURSE: {
    code: 'CHARGE_NURSE',
    name: 'Charge Nurse',
    description: 'Shift nursing supervisor and ward bed coordinator',
    dataScope: 'DEPARTMENT',
    branchScope: 'ASSIGNED_BRANCH',
    permissionPacks: ['PACK_NURSING_CORE'],
    explicitPermissions: ['patient.vitals.record', 'clinical.vitals.record', 'patient.view'],
    prohibitedActions: [
      'prescription.sign',
      'clinical.prescription.sign',
      'patient.discharge.sign',
      'invoice.create',
      'invoice.refund'
    ]
  },
  ICU_NURSE: {
    code: 'ICU_NURSE',
    name: 'Critical Care ICU Nurse',
    description: 'Intensive care patient monitoring and vitals tracking',
    dataScope: 'DEPARTMENT',
    branchScope: 'ASSIGNED_BRANCH',
    permissionPacks: ['PACK_NURSING_CORE'],
    explicitPermissions: ['patient.vitals.record', 'clinical.vitals.record', 'patient.view'],
    prohibitedActions: [
      'prescription.sign',
      'clinical.prescription.sign',
      'patient.discharge.sign',
      'invoice.create',
      'invoice.refund'
    ]
  },
  HEAD_NURSE: {
    code: 'HEAD_NURSE',
    name: 'Nursing Superintendent / Head Nurse',
    description: 'Nursing station leadership and clinical care coordination',
    dataScope: 'DEPARTMENT',
    branchScope: 'ASSIGNED_BRANCH',
    permissionPacks: ['PACK_NURSING_CORE'],
    explicitPermissions: ['patient.vitals.record', 'clinical.vitals.record', 'patient.view'],
    prohibitedActions: [
      'prescription.sign',
      'clinical.prescription.sign',
      'patient.discharge.sign',
      'invoice.create',
      'invoice.refund'
    ]
  },
  PHARMACIST: {
    code: 'PHARMACIST',
    name: 'Clinical Pharmacist',
    description: 'Retail & inpatient prescription dispensing, stock audits',
    dataScope: 'DEPARTMENT',
    branchScope: 'ASSIGNED_BRANCH',
    permissionPacks: ['PACK_PHARMACY_OPERATOR'],
    explicitPermissions: ['pharmacy.dispense', 'pharmacy.stock.view', 'pharmacy.stock.adjust'],
    prohibitedActions: [
      'clinical.surgery.schedule',
      'surgery',
      'clinical.diagnosis.enter',
      'diagnosis',
      'patient.discharge.sign',
      'discharge',
      'clinical.prescription.sign',
      'prescription.sign'
    ]
  },
  DISPENSING_PHARMACIST: {
    code: 'DISPENSING_PHARMACIST',
    name: 'Dispensing Pharmacist',
    description: 'Medication dispensing, POS checkout and inventory verification',
    dataScope: 'DEPARTMENT',
    branchScope: 'ASSIGNED_BRANCH',
    permissionPacks: ['PACK_PHARMACY_OPERATOR'],
    explicitPermissions: ['pharmacy.dispense', 'pharmacy.stock.view'],
    prohibitedActions: [
      'clinical.surgery.schedule',
      'surgery',
      'clinical.diagnosis.enter',
      'diagnosis',
      'patient.discharge.sign',
      'discharge',
      'clinical.prescription.sign',
      'prescription.sign'
    ]
  },
  HOSPITAL_PHARMACIST: {
    code: 'HOSPITAL_PHARMACIST',
    name: 'Hospital Dispensing Pharmacist',
    description: 'Inpatient ward drug delivery and inventory tracking',
    dataScope: 'DEPARTMENT',
    branchScope: 'ASSIGNED_BRANCH',
    permissionPacks: ['PACK_PHARMACY_OPERATOR'],
    explicitPermissions: ['pharmacy.dispense', 'pharmacy.stock.view'],
    prohibitedActions: [
      'clinical.surgery.schedule',
      'surgery',
      'clinical.diagnosis.enter',
      'patient.discharge.sign',
      'clinical.prescription.sign'
    ]
  },
  PHARMACY_MANAGER: {
    code: 'PHARMACY_MANAGER',
    name: 'Pharmacy Manager & Store Incharge',
    description: 'Pharmacy inventory procurement, batch approvals and billing',
    dataScope: 'PARTNER',
    branchScope: 'ASSIGNED_BRANCH',
    permissionPacks: ['PACK_PHARMACY_OPERATOR', 'PACK_BILLING_DESK'],
    explicitPermissions: ['pharmacy.dispense', 'pharmacy.stock.view', 'pharmacy.stock.adjust', 'invoice.create'],
    prohibitedActions: [
      'clinical.surgery.schedule',
      'surgery',
      'clinical.diagnosis.enter',
      'diagnosis',
      'patient.discharge.sign',
      'discharge',
      'clinical.prescription.sign',
      'prescription.sign'
    ]
  },
  LAB_TECHNICIAN: {
    code: 'LAB_TECHNICIAN',
    name: 'Medical Laboratory Technician',
    description: 'Sample collection, barcode accession, analyzer execution',
    dataScope: 'DEPARTMENT',
    branchScope: 'ASSIGNED_BRANCH',
    permissionPacks: ['PACK_LAB_TECH'],
    explicitPermissions: ['lab.sample.accession', 'lab.order.view', 'lab.result.enter'],
    prohibitedActions: [
      'patient.discharge.sign',
      'discharge',
      'pharmacy.stock.adjust',
      'pharmacy.dispense',
      'clinical.prescription.sign',
      'prescription.sign',
      'clinical.surgery.schedule',
      'surgery'
    ]
  },
  SENIOR_LAB_TECH: {
    code: 'SENIOR_LAB_TECH',
    name: 'Senior Laboratory Technologist',
    description: 'Advanced diagnostic testing, accession and analyzer QC',
    dataScope: 'DEPARTMENT',
    branchScope: 'ASSIGNED_BRANCH',
    permissionPacks: ['PACK_LAB_TECH'],
    explicitPermissions: ['lab.sample.accession', 'lab.order.view', 'lab.result.enter', 'lab.result.validate'],
    prohibitedActions: [
      'patient.discharge.sign',
      'discharge',
      'pharmacy.stock.adjust',
      'pharmacy.dispense',
      'clinical.prescription.sign',
      'prescription.sign',
      'clinical.surgery.schedule',
      'surgery'
    ]
  },
  PATHOLOGIST: {
    code: 'PATHOLOGIST',
    name: 'Consultant Pathologist',
    description: 'Pathology reporting, slide reviews, and diagnostic validation',
    dataScope: 'DEPARTMENT',
    branchScope: 'ALL_BRANCHES',
    permissionPacks: ['PACK_LAB_TECH'],
    explicitPermissions: ['lab.sample.accession', 'lab.result.validate', 'lab.order.view'],
    prohibitedActions: [
      'patient.discharge.sign',
      'discharge',
      'pharmacy.stock.adjust',
      'pharmacy.dispense',
      'clinical.surgery.schedule',
      'surgery'
    ]
  },
  LAB_DIRECTOR: {
    code: 'LAB_DIRECTOR',
    name: 'Laboratory Director',
    description: 'Diagnostic wing leadership, compliance validation and billing',
    dataScope: 'PARTNER',
    branchScope: 'ALL_BRANCHES',
    permissionPacks: ['PACK_LAB_TECH', 'PACK_BILLING_DESK'],
    explicitPermissions: ['lab.sample.accession', 'lab.result.validate'],
    prohibitedActions: ['patient.discharge.sign', 'discharge', 'pharmacy.stock.adjust']
  },
  RADIOLOGIST: {
    code: 'RADIOLOGIST',
    name: 'Consultant Radiologist',
    description: 'PACS imaging interpretations, modality review and signing',
    dataScope: 'DEPARTMENT',
    branchScope: 'ALL_BRANCHES',
    permissionPacks: ['PACK_RADIOLOGY_TECH', 'PACK_LAB_TECH'],
    explicitPermissions: ['radiology.report.sign', 'radiology.study.view', 'patient.view', 'clinical.consultation.view'],
    prohibitedActions: [
      'pharmacy.stock.adjust',
      'pharmacy.dispense',
      'invoice.refund',
      'clinical.surgery.schedule',
      'surgery'
    ]
  },
  BILLING_CLERK: {
    code: 'BILLING_CLERK',
    name: 'Billing Clerk & Cashier',
    description: 'Patient invoicing, receipt generation and payment collection',
    dataScope: 'BRANCH',
    branchScope: 'ASSIGNED_BRANCH',
    permissionPacks: ['PACK_BILLING_DESK'],
    explicitPermissions: ['invoice.create', 'invoice.view', 'payment.collect'],
    prohibitedActions: [
      'clinical.diagnosis.enter',
      'diagnosis',
      'clinical.prescription.sign',
      'prescription.sign',
      'lab.result.validate',
      'pharmacy.dispense'
    ]
  },
  BILLING_OFFICER: {
    code: 'BILLING_OFFICER',
    name: 'Billing Officer',
    description: 'Patient billing, ledger posting and collection management',
    dataScope: 'BRANCH',
    branchScope: 'ASSIGNED_BRANCH',
    permissionPacks: ['PACK_BILLING_DESK'],
    explicitPermissions: ['invoice.create', 'invoice.view', 'payment.collect'],
    prohibitedActions: [
      'clinical.diagnosis.enter',
      'diagnosis',
      'clinical.prescription.sign',
      'prescription.sign',
      'lab.result.validate',
      'pharmacy.dispense'
    ]
  },
  BILLING_MANAGER: {
    code: 'BILLING_MANAGER',
    name: 'Billing & Revenue Manager',
    description: 'Revenue cycle management, tariff overrides and claim submissions',
    dataScope: 'PARTNER',
    branchScope: 'ASSIGNED_BRANCH',
    permissionPacks: ['PACK_BILLING_DESK'],
    explicitPermissions: ['invoice.create', 'invoice.view', 'payment.collect'],
    prohibitedActions: [
      'clinical.diagnosis.enter',
      'diagnosis',
      'clinical.prescription.sign',
      'prescription.sign',
      'lab.result.validate',
      'pharmacy.dispense'
    ]
  },
  TPA_OFFICER: {
    code: 'TPA_OFFICER',
    name: 'TPA & Insurance Claims Officer',
    description: 'Cashless claims management, pre-auth approvals and insurer submissions',
    dataScope: 'BRANCH',
    branchScope: 'ASSIGNED_BRANCH',
    permissionPacks: ['PACK_BILLING_DESK'],
    explicitPermissions: ['invoice.view', 'invoice.create'],
    prohibitedActions: [
      'clinical.diagnosis.enter',
      'diagnosis',
      'clinical.prescription.sign',
      'prescription.sign',
      'lab.result.validate',
      'pharmacy.dispense'
    ]
  },
  CASHIER: {
    code: 'CASHIER',
    name: 'Front Office Cashier',
    description: 'Cash and POS receipt collection and counter closing',
    dataScope: 'BRANCH',
    branchScope: 'ASSIGNED_BRANCH',
    permissionPacks: ['PACK_BILLING_DESK'],
    explicitPermissions: ['invoice.create', 'invoice.view', 'payment.collect'],
    prohibitedActions: [
      'clinical.diagnosis.enter',
      'diagnosis',
      'clinical.prescription.sign',
      'prescription.sign',
      'lab.result.validate',
      'pharmacy.dispense'
    ]
  }
};

const GOVERNED_ACTION_VERBS = new Set([
  'delete',
  'refund',
  'approve',
  'validate',
  'dispense',
  'export',
  'configure',
  'sign'
]);

const ACTION_VERB_EQUIVALENTS: Record<string, string[]> = {
  view: ['read'],
  read: ['view'],
  create: ['save', 'author', 'enter'],
  save: ['create'],
  edit: ['update'],
  update: ['edit'],
  sign: ['approve', 'validate'],
  approve: ['sign'],
  validate: ['sign', 'verify']
};

/**
 * Positive permission matcher (`PHASE1-AUD-04`):
 * Never allows arbitrary substring `.includes()` or 2-segment boundary matches.
 * Enforces exact resource:action match, equivalent action verb on the SAME resource,
 * or explicit `prefix.*` wildcard (except for governed verbs which require explicit action match or `*`).
 */
export function actionMatches(pattern: string, action: string): boolean {
  if (pattern === '*' || pattern === '*:*') return true;
  const pNorm = pattern.toLowerCase().replace(/:/g, '.').trim();
  const aNorm = action.toLowerCase().replace(/:/g, '.').trim();
  if (!pNorm || !aNorm) return false;
  if (pNorm === aNorm) return true;

  const aParts = aNorm.split('.');
  const aVerb = aParts[aParts.length - 1] || '';
  const isGovernedVerb = GOVERNED_ACTION_VERBS.has(aVerb);

  if (pNorm.endsWith('.*')) {
    const prefix = pNorm.slice(0, -2);
    if (aNorm === prefix || aNorm.startsWith(prefix + '.')) {
      // Governed verbs require explicit permission unless prefix is exact sub-domain match (e.g. clinical.prescription.*)
      if (isGovernedVerb && !prefix.includes('.')) {
        return false;
      }
      return true;
    }
  }

  // Canonical alias normalization (e.g., patient.record.view <-> patient.view, clinical.prescription.sign <-> prescription.sign, billing.invoice.view <-> invoice.view)
  const normalizeCanonicalDomain = (s: string) =>
    s
      .replace(/^patient\.record\./, 'patient.')
      .replace(/^clinical\.prescription\./, 'prescription.')
      .replace(/^clinical\.consultation\./, 'consultation.')
      .replace(/^clinical\.vitals\./, 'vitals.')
      .replace(/^patient\.vitals\./, 'vitals.')
      .replace(/^billing\.invoice\./, 'invoice.')
      .replace(/^billing\.payment\./, 'payment.')
      .replace(/^billing\.claims\./, 'claims.')
      .replace(/^pharmacy\.dispense\.create$/, 'pharmacy.dispense');

  const pCan = normalizeCanonicalDomain(pNorm);
  const aCan = normalizeCanonicalDomain(aNorm);
  if (pCan === aCan) return true;

  const pCanParts = pCan.split('.');
  const aCanParts = aCan.split('.');
  if (pCanParts.length >= 2 && aCanParts.length >= 2) {
    const pResource = pCanParts.slice(0, -1).join('.');
    const aResource = aCanParts.slice(0, -1).join('.');
    const pVerb = pCanParts[pCanParts.length - 1] || '';
    const aCanVerb = aCanParts[aCanParts.length - 1] || '';
    if (pResource === aResource) {
      if (pVerb === aCanVerb) return true;
      const eqVerbs = ACTION_VERB_EQUIVALENTS[aCanVerb] || [];
      if (eqVerbs.includes(pVerb)) return true;
    }
  }

  return false;
}

/**
 * Negative separation-of-duties prohibition matcher:
 * Blocks prohibited actions whether specified as exact action (`invoice.refund`) or domain keyword (`surgery`, `diagnosis`, `refund`, `payroll`).
 */
export function actionMatchesProhibited(prohibitedPattern: string, action: string): boolean {
  if (actionMatches(prohibitedPattern, action)) return true;
  const pNorm = prohibitedPattern.toLowerCase().replace(/:/g, '.').trim();
  const aNorm = action.toLowerCase().replace(/:/g, '.').trim();
  if (!pNorm.includes('.') && aNorm.split('.').includes(pNorm)) {
    return true;
  }
  if (aNorm.endsWith('.' + pNorm) || aNorm.startsWith(pNorm + '.')) {
    return true;
  }
  return false;
}

export function isBranchMatch(assignedBranch?: string, targetBranch?: string): boolean {
  if (!assignedBranch || !targetBranch) return true;
  if (assignedBranch === targetBranch) return true;
  const a = assignedBranch.toLowerCase().trim();
  const t = targetBranch.toLowerCase().trim();
  if (a === t) return true;
  if (a.startsWith(t) || t.startsWith(a)) return true;
  const aPrefix = a.split('-')[0];
  const tPrefix = t.split('-')[0];
  if (aPrefix && tPrefix && aPrefix === tPrefix) return true;
  return false;
}

export class EffectiveAccessEngine {
  /**
   * Resolves action name to associated Capability and Module category
   */
  private resolveActionToCapability(action: string): string {
    const act = action.toLowerCase().replace(/:/g, '.');
    if (act.startsWith('wholesale.') || act.startsWith('pharmacy.wholesale')) return 'PHARMACY_WHOLESALE';
    if (act.startsWith('patient.') || act.startsWith('appointment.') || act.startsWith('opd.') || act.startsWith('consultation.') || act.startsWith('prescription.') || act.startsWith('vitals.')) return 'OPD';
    if (act.startsWith('inpatient.') || act.startsWith('bed.') || act.startsWith('ward.')) return 'IPD';
    if (act.startsWith('emergency.') || act.startsWith('triage.')) return 'EMERGENCY';
    if (act.startsWith('icu.') || act.startsWith('clinical.icu.')) return 'ICU';
    if (act.startsWith('ot.') || act.startsWith('surgery.') || act.startsWith('clinical.ot.')) return 'OT';
    if (act.startsWith('lab.') || act.startsWith('sample.')) return 'LABORATORY';
    if (act.startsWith('pathology.')) return 'PATHOLOGY';
    if (act.startsWith('radiology.') || act.startsWith('dicom.') || act.startsWith('pacs.')) return 'RADIOLOGY';
    if (act.startsWith('pharmacy.') || act.startsWith('medicine.') || act.startsWith('dispense.')) return 'PHARMACY';
    if (act.startsWith('blood_bank.') || act.startsWith('bloodbank.') || act.startsWith('transfuse.') || act.startsWith('donor.')) return 'BLOOD_BANK';
    if (act.startsWith('mrd.')) return 'MRD';
    if (act.startsWith('dietary.')) return 'DIETARY';
    if (act.startsWith('invoice.') || act.startsWith('billing.') || act.startsWith('payment.')) return 'BILLING';
    if (act.startsWith('finance.') || act.startsWith('refund.') || act.startsWith('ledger.')) return 'FINANCE';
    if (act.startsWith('staff.') || act.startsWith('roster.') || act.startsWith('hr.') || act.startsWith('facility.')) return 'HR';
    if (act.startsWith('crm.') || act.startsWith('lead.')) return 'CRM';
    if (act.startsWith('analytics.') || act.startsWith('report.') || act.startsWith('reporting.')) return 'ANALYTICS';
    if (act.startsWith('support.') || act.startsWith('ticket.')) return 'SUPPORT';
    if (act.startsWith('whatsapp.') || act.startsWith('sms.')) return 'COMMUNICATION';
    if (act.startsWith('ai.') || act.startsWith('scribe.')) return 'AI';
    if (act.startsWith('abdm.') || act.startsWith('fhir.')) return 'INTEGRATION';
    return 'OPD';
  }

  /**
   * Evaluates runtime access using the authoritative 12-tier precedence order:
   * Partner -> Industry -> Operating Model -> Plan -> Subscription -> License -> Entitlement -> Capability -> Department -> Role -> Permission -> Data Scope
   */
  async evaluateAccess(params: AccessEvaluationParams): Promise<AccessDecision> {
    const trace: DecisionTierTrace[] = [];
    const now = params.timestamp || new Date();
    const action = params.action.trim();
    const targetCap = this.resolveActionToCapability(action);

    // Super Admin Fast-Path (only when explicitly evaluating superadmin role without specific non-admin role)
    if (params.isSuperAdmin && (!params.role || params.role === 'SUPER_ADMIN')) {
      trace.push({
        tierNumber: 0,
        tierName: 'TIER_0_SUPER_ADMIN',
        status: 'PASS',
        detail: 'Super Admin holds universal unrestricted override permissions'
      });
      return {
        decision: 'ALLOW',
        code: 'ALLOW_SUPER_ADMIN',
        reason: 'ALLOW — Granted unconditionally by Super Admin privilege',
        decisiveTier: 'TIER_0_SUPER_ADMIN',
        tierNumber: 0,
        trace,
        timestamp: now.toISOString(),
        evaluatedContext: {
          partnerId: params.partnerId,
          userId: params.userId,
          role: params.role,
          branchId: params.branchId,
          action
        }
      };
    }

    const db = getDatabase();
    const pUuid = params.tenantId || (params.partnerId ? toDeterministicUuid(params.partnerId) : undefined);

    // =========================================================================
    // TIER 1: GLOBAL / HQ SECURITY KILL SWITCHES
    // =========================================================================
    let globalFreeze = false;
    let billingFreeze = false;
    let commsFreeze = false;

    if (db && pUuid) {
      try {
        const [gov] = await db
          .select()
          .from(partnerGovernanceOverrides)
          .where(eq(partnerGovernanceOverrides.tenantId, pUuid));
        if (gov) {
          globalFreeze = Boolean(gov.globalFreeze);
          billingFreeze = Boolean(gov.billingFreeze);
          commsFreeze = Boolean(gov.communicationFreeze);
        }
      } catch {}
    }

    if (globalFreeze) {
      trace.push({
        tierNumber: 1,
        tierName: 'TIER_1_GLOBAL_KILL_SWITCH',
        status: 'DENY',
        detail: 'Global security freeze is active for this partner tenant.'
      });
      return {
        decision: 'DENY',
        code: 'DENY_GLOBAL_FREEZE',
        reason: 'DENY — HQ Global Security Freeze Active for partner tenant',
        decisiveTier: 'TIER_1_GLOBAL_KILL_SWITCH',
        tierNumber: 1,
        trace,
        timestamp: now.toISOString(),
        evaluatedContext: { ...params, action }
      };
    }

    if (billingFreeze && targetCap === 'BILLING') {
      trace.push({
        tierNumber: 1,
        tierName: 'TIER_1_BILLING_FREEZE',
        status: 'DENY',
        detail: 'Billing module kill switch is active.'
      });
      return {
        decision: 'DENY',
        code: 'DENY_BILLING_FREEZE',
        reason: 'DENY — HQ Billing Freeze Active',
        decisiveTier: 'TIER_1_BILLING_FREEZE',
        tierNumber: 1,
        trace,
        timestamp: now.toISOString(),
        evaluatedContext: { ...params, action }
      };
    }

    if (commsFreeze && (targetCap === 'TELEMEDICINE' || action.startsWith('communication:'))) {
      trace.push({
        tierNumber: 1,
        tierName: 'TIER_1_COMMUNICATION_FREEZE',
        status: 'DENY',
        detail: 'Communication module kill switch is active.'
      });
      return {
        decision: 'DENY',
        code: 'DENY_COMMUNICATION_FREEZE',
        reason: 'DENY — HQ Communication Freeze Active',
        decisiveTier: 'TIER_1_COMMUNICATION_FREEZE',
        tierNumber: 1,
        trace,
        timestamp: now.toISOString(),
        evaluatedContext: { ...params, action }
      };
    }

    trace.push({
      tierNumber: 1,
      tierName: 'TIER_1_GLOBAL_KILL_SWITCH',
      status: 'PASS',
      detail: 'No global or module kill switches triggered.'
    });

    // =========================================================================
    // TIER 2: PARTNER-LEVEL HQ OVERRIDE & ACTION RESTRICTIONS
    // =========================================================================
    if (db && pUuid) {
      try {
        const [modOverride] = await db
          .select()
          .from(partnerGovernanceOverrides)
          .where(
            and(
              eq(partnerGovernanceOverrides.tenantId, pUuid),
              eq(partnerGovernanceOverrides.moduleCode, targetCap)
            )
          );

        if (modOverride && modOverride.status === 'DISABLED') {
          trace.push({
            tierNumber: 2,
            tierName: 'TIER_2_HQ_PARTNER_RESTRICTION',
            status: 'DENY',
            detail: `HQ Governance restriction disabled module "${targetCap}". Reason: ${modOverride.reason || 'Restricted by HQ Directorate'}`
          });
          return {
            decision: 'DENY',
            code: 'DENY_HQ_PARTNER_RESTRICTION',
            reason: `DENY — HQ Partner Restriction on module ${targetCap} (${modOverride.reason || 'Restricted'})`,
            decisiveTier: 'TIER_2_HQ_PARTNER_RESTRICTION',
            tierNumber: 2,
            trace,
            timestamp: now.toISOString(),
            evaluatedContext: { ...params, action }
          };
        }
      } catch {}
    }

    trace.push({
      tierNumber: 2,
      tierName: 'TIER_2_HQ_PARTNER_RESTRICTION',
      status: 'PASS',
      detail: 'No HQ partner-level override restriction for this module.'
    });

    // =========================================================================
    // TIER 3: COMMERCIAL LICENSE VALIDITY, SIGNATURE & EXPIRY
    // =========================================================================
    let activeLicenseRow: any = null;
    if (db && pUuid) {
      try {
        const licRows = await db
          .select()
          .from(licenses)
          .where(eq(licenses.tenantId, pUuid));
        activeLicenseRow =
          licRows.find((l) =>
            ['ACTIVE', 'FREE_ACTIVE', 'EXPIRING_SOON', 'RENEWAL_WINDOW', 'GRACE_PERIOD'].includes(String(l.status).toUpperCase())
          ) || licRows[0] || null;
      } catch {}
    }

    if (params.requireCommercialRecords && !activeLicenseRow) {
      trace.push({
        tierNumber: 3,
        tierName: 'TIER_3_LICENSE_VALIDITY',
        status: 'DENY',
        detail: 'No commercial software license found for partner tenant (Fail-Closed).'
      });
      return {
        decision: 'DENY',
        code: 'DENY_LICENSE_MISSING',
        reason: 'DENY — No valid commercial software license provisioned for partner tenant',
        decisiveTier: 'TIER_3_LICENSE_VALIDITY',
        tierNumber: 3,
        trace,
        timestamp: now.toISOString(),
        evaluatedContext: { ...params, action }
      };
    }

    if (activeLicenseRow) {
      if (!licenseService.verifyLicenseSignature(activeLicenseRow)) {
        trace.push({
          tierNumber: 3,
          tierName: 'TIER_3_LICENSE_VALIDITY',
          status: 'DENY',
          detail: 'License cryptographic HMAC-SHA256 signature verification failed.'
        });
        return {
          decision: 'DENY',
          code: 'DENY_LICENSE_SIGNATURE_INVALID',
          reason: 'DENY — Commercial Software License HMAC Signature Invalid',
          decisiveTier: 'TIER_3_LICENSE_VALIDITY',
          tierNumber: 3,
          trace,
          timestamp: now.toISOString(),
          evaluatedContext: { ...params, action }
        };
      }

      const licEval = licenseService.evaluateLicenseStatus(activeLicenseRow, now);
      if (!licEval.isAccessAllowed) {
        const denyCode =
          licEval.status === 'LOCKED'
            ? 'DENY_LICENSE_LOCKED'
            : licEval.status === 'SUSPENDED' || licEval.status === 'REVOKED'
              ? 'DENY_LICENSE_SUSPENDED'
              : 'DENY_LICENSE_EXPIRED';
        trace.push({
          tierNumber: 3,
          tierName: 'TIER_3_LICENSE_VALIDITY',
          status: 'DENY',
          detail: `Partner commercial software license is ${licEval.status} (access allowed = false).`
        });
        return {
          decision: 'DENY',
          code: denyCode,
          reason: `DENY — Commercial Software License ${licEval.status}`,
          decisiveTier: 'TIER_3_LICENSE_VALIDITY',
          tierNumber: 3,
          trace,
          timestamp: now.toISOString(),
          evaluatedContext: { ...params, action }
        };
      }
    }

    trace.push({
      tierNumber: 3,
      tierName: 'TIER_3_LICENSE_VALIDITY',
      status: 'PASS',
      detail: 'Commercial license is active and valid.'
    });

    // =========================================================================
    // TIER 4: SUBSCRIPTION STATUS
    // =========================================================================
    let partnerProfileRow: any = null;
    let tenantRow: any = null;
    let activeSubscriptionRow: any = null;

    if (db && pUuid) {
      try {
        const [tRow] = await db.select().from(tenants).where(eq(tenants.id, pUuid)).limit(1);
        tenantRow = tRow || null;

        const [pRow] = await db
          .select()
          .from(partnerProfiles)
          .where(eq(partnerProfiles.tenantId, pUuid))
          .limit(1);
        partnerProfileRow = pRow || null;

        if (partnerProfileRow) {
          const subRows = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.partnerId, partnerProfileRow.id));
          activeSubscriptionRow =
            subRows.find((s) => ['ACTIVE', 'FREE_ACTIVE', 'TRIAL'].includes(String(s.status).toUpperCase())) ||
            subRows[0] ||
            null;
        }
      } catch {}
    }

    if (params.requireCommercialRecords && !activeSubscriptionRow) {
      trace.push({
        tierNumber: 4,
        tierName: 'TIER_4_SUBSCRIPTION_STATUS',
        status: 'DENY',
        detail: 'No active commercial subscription found for partner (Fail-Closed).'
      });
      return {
        decision: 'DENY',
        code: 'DENY_SUBSCRIPTION_MISSING',
        reason: 'DENY — No active commercial subscription found for partner',
        decisiveTier: 'TIER_4_SUBSCRIPTION_STATUS',
        tierNumber: 4,
        trace,
        timestamp: now.toISOString(),
        evaluatedContext: { ...params, action }
      };
    }

    if (activeSubscriptionRow) {
      const subStatus = String(activeSubscriptionRow.status || '').toUpperCase();
      if (['CANCELLED', 'EXPIRED', 'SUSPENDED', 'TERMINATED'].includes(subStatus)) {
        trace.push({
          tierNumber: 4,
          tierName: 'TIER_4_SUBSCRIPTION_STATUS',
          status: 'DENY',
          detail: `Partner subscription status is ${subStatus}.`
        });
        return {
          decision: 'DENY',
          code: 'DENY_SUBSCRIPTION_EXPIRED',
          reason: `DENY — Partner Subscription is ${subStatus}`,
          decisiveTier: 'TIER_4_SUBSCRIPTION_STATUS',
          tierNumber: 4,
          trace,
          timestamp: now.toISOString(),
          evaluatedContext: { ...params, action }
        };
      }
    }

    trace.push({
      tierNumber: 4,
      tierName: 'TIER_4_SUBSCRIPTION_STATUS',
      status: 'PASS',
      detail: 'Partner subscription is in good standing.'
    });

    // =========================================================================
    // TIER 5: INDUSTRY, OPERATING MODEL & COMMERCIAL PLAN ENTITLEMENT
    // =========================================================================
    const pMeta = (partnerProfileRow?.metadata || {}) as Record<string, any>;
    const lMeta = (activeLicenseRow?.metadata || {}) as Record<string, any>;
    const rawIndustry =
      params.industry ??
      pMeta['industry'] ??
      partnerProfileRow?.partnerType ??
      lMeta['partnerType'] ??
      lMeta['facilityType'] ??
      null;
    const rawOperatingModel =
      params.operatingModel ??
      pMeta['operatingModel'] ??
      pMeta['operatingMode'] ??
      lMeta['operatingMode'] ??
      null;

    if (rawIndustry !== null && rawIndustry !== undefined) {
      const indEval = masterFoundationService.validateIndustryOperatingModel(rawIndustry, rawOperatingModel);
      if (!indEval.valid || !indEval.industryDef) {
        trace.push({
          tierNumber: 5,
          tierName: 'TIER_5_PLAN_ENTITLEMENT',
          status: 'DENY',
          detail: indEval.reason || 'Invalid partner industry or operating model configuration.'
        });
        return {
          decision: 'DENY',
          code: 'DENY_INVALID_INDUSTRY_OPERATING_MODEL',
          reason: `DENY — ${indEval.reason || 'Invalid Industry/Operating Model'}`,
          decisiveTier: 'TIER_5_PLAN_ENTITLEMENT',
          tierNumber: 5,
          trace,
          timestamp: now.toISOString(),
          evaluatedContext: { ...params, action }
        };
      }

      if (!indEval.industryDef.allowedCapabilities.includes(targetCap)) {
        trace.push({
          tierNumber: 5,
          tierName: 'TIER_5_PLAN_ENTITLEMENT',
          status: 'DENY',
          detail: `Capability "${targetCap}" is outside the allowed boundary for industry "${indEval.industry}" (${indEval.operatingModel}).`
        });
        return {
          decision: 'DENY',
          code: 'DENY_INDUSTRY_CAPABILITY_BOUNDARY',
          reason: `DENY — Capability "${targetCap}" is not permitted for Industry "${indEval.industry}"`,
          decisiveTier: 'TIER_5_PLAN_ENTITLEMENT',
          tierNumber: 5,
          trace,
          timestamp: now.toISOString(),
          evaluatedContext: { ...params, action }
        };
      }
    }

    if (activeLicenseRow && pUuid) {
      const canAccessModule = await entitlementService.canAccess(pUuid, targetCap);
      if (!canAccessModule) {
        trace.push({
          tierNumber: 5,
          tierName: 'TIER_5_PLAN_ENTITLEMENT',
          status: 'DENY',
          detail: `Commercial plan "${activeLicenseRow.planId}" does not entitle capability "${targetCap}".`
        });
        return {
          decision: 'DENY',
          code: 'DENY_PLAN_ENTITLEMENT',
          reason: `DENY — Capability "${targetCap}" is not entitled in active commercial plan`,
          decisiveTier: 'TIER_5_PLAN_ENTITLEMENT',
          tierNumber: 5,
          trace,
          timestamp: now.toISOString(),
          evaluatedContext: { ...params, action }
        };
      }
    }

    trace.push({
      tierNumber: 5,
      tierName: 'TIER_5_PLAN_ENTITLEMENT',
      status: 'PASS',
      detail: 'Feature entitlement verified in commercial plan.'
    });

    // =========================================================================
    // TIER 6: PARTNER CAPABILITY MASTER & DEPENDENCIES
    // =========================================================================
    let capabilityActive = true;
    const overrideCaps = (params as AccessSimulationParams).capabilitiesOverride;
    let activePartnerCapCodes: string[] =
      Array.isArray(overrideCaps) && overrideCaps.length > 0
        ? overrideCaps.map((c) => c.toUpperCase())
        : [
            targetCap,
            ...(capabilityEngine.getCapability(targetCap)?.dependencies || []),
            'LABORATORY',
            'LAB_ORDERING',
            'LAB_PROCESSING',
            'LAB_REPORT_VALIDATION',
            'OPD',
            'PATIENT_REGISTRATION'
          ];
    const capExpiryMap: Record<string, string | Date | null | undefined> = {};
    const capStatusMap: Record<string, string> = {};

    if (!Array.isArray(overrideCaps) && db && pUuid) {
      try {
        const partnerCaps = await db
          .select()
          .from(partnerCapabilities)
          .where(eq(partnerCapabilities.tenantId, pUuid));

        if (partnerCaps.length > 0) {
          for (const pc of partnerCaps) {
            capStatusMap[pc.capabilityCode.toUpperCase()] = pc.status;
            if (pc.trialEndsAt) {
              capExpiryMap[pc.capabilityCode.toUpperCase()] = pc.trialEndsAt;
            }
          }
          activePartnerCapCodes = partnerCaps
            .filter((c) => c.status === 'ACTIVE' && (!c.trialEndsAt || new Date(c.trialEndsAt) >= now))
            .map((c) => c.capabilityCode.toUpperCase());

          const matchingCap = partnerCaps.find((c) => c.capabilityCode.toUpperCase() === targetCap.toUpperCase());
          if (!matchingCap || matchingCap.status !== 'ACTIVE' || (matchingCap.trialEndsAt && new Date(matchingCap.trialEndsAt) < now)) {
            capabilityActive = false;
          }
        } else {
          // Include prerequisites of targetCap when no partner_capabilities override table rows exist
          const capDef = capabilityEngine.getCapability(targetCap);
          if (capDef) {
            activePartnerCapCodes = [targetCap, ...capDef.dependencies];
          }
        }
      } catch {}
    }

    if (!capabilityActive) {
      trace.push({
        tierNumber: 6,
        tierName: 'TIER_6_PARTNER_CAPABILITY',
        status: 'DENY',
        detail: `Capability "${targetCap}" is disabled or expired for this partner.`
      });
      return {
        decision: 'DENY',
        code: 'DENY_CAPABILITY_DISABLED',
        reason: `DENY — Partner capability "${targetCap}" is disabled or expired`,
        decisiveTier: 'TIER_6_PARTNER_CAPABILITY',
        tierNumber: 6,
        trace,
        timestamp: now.toISOString(),
        evaluatedContext: { ...params, action }
      };
    }

    // Validate feature & capability dependency graph
    const depCheck = capabilityEngine.validateFeatureDependencies(action, activePartnerCapCodes, {
      asOf: now,
      capabilityExpiryMap: capExpiryMap,
      capabilityStatusMap: capStatusMap
    });
    if (!depCheck.allowed) {
      trace.push({
        tierNumber: 6,
        tierName: 'TIER_6_FEATURE_DEPENDENCY',
        status: 'DENY',
        detail: depCheck.reason || 'Feature dependency requirement missing.'
      });
      return {
        decision: 'DENY',
        code: depCheck.failureType === 'CIRCULAR_DEPENDENCY' ? 'DENY_CIRCULAR_DEPENDENCY' : 'DENY_DEPENDENCY_MISSING',
        reason: `DENY — ${depCheck.reason}`,
        decisiveTier: 'TIER_6_FEATURE_DEPENDENCY',
        tierNumber: 6,
        trace,
        timestamp: now.toISOString(),
        evaluatedContext: { ...params, action }
      };
    }

    trace.push({
      tierNumber: 6,
      tierName: 'TIER_6_PARTNER_CAPABILITY',
      status: 'PASS',
      detail: `Capability "${targetCap}" is active and all dependencies are satisfied.`
    });

    // =========================================================================
    // TIER 7: PARTNER CUSTOM CONFIGURATION & ACTIVE STATUS
    // =========================================================================
    const tenantStatusStr = String(tenantRow?.status || 'ACTIVE').toUpperCase();
    const partnerLifecycleStr = String(partnerProfileRow?.lifecycleStatus || 'ACTIVE').toUpperCase();
    if (
      tenantStatusStr !== 'ACTIVE' ||
      ['SUSPENDED', 'TERMINATED', 'REVOKED', 'INACTIVE'].includes(partnerLifecycleStr)
    ) {
      trace.push({
        tierNumber: 7,
        tierName: 'TIER_7_PARTNER_CONFIGURATION',
        status: 'DENY',
        detail: `Partner or tenant is inactive (tenantStatus=${tenantStatusStr}, lifecycleStatus=${partnerLifecycleStr}).`
      });
      return {
        decision: 'DENY',
        code: 'DENY_PARTNER_INACTIVE',
        reason: `DENY — Partner organization is inactive (${partnerLifecycleStr})`,
        decisiveTier: 'TIER_7_PARTNER_CONFIGURATION',
        tierNumber: 7,
        trace,
        timestamp: now.toISOString(),
        evaluatedContext: { ...params, action }
      };
    }

    trace.push({
      tierNumber: 7,
      tierName: 'TIER_7_PARTNER_CONFIGURATION',
      status: 'PASS',
      detail: 'Partner configuration verified.'
    });

    // =========================================================================
    // TIER 8: DEPARTMENT ASSIGNMENT & SCOPE
    // =========================================================================
    const userRoles = params.roles && params.roles.length > 0 ? params.roles : params.role ? [params.role] : [];
    const primaryRoleForDept = userRoles[0]?.toUpperCase();
    const roleCfgForDept = primaryRoleForDept
      ? AUTHORITATIVE_ROLES[primaryRoleForDept] || (ROLE_TEMPLATE_MASTER_CATALOG[primaryRoleForDept] as any)
      : undefined;
    const isDeptScopedRole =
      roleCfgForDept?.dataScope === 'DEPARTMENT' || roleCfgForDept?.departmentScope === 'DEPARTMENT';

    if (
      isDeptScopedRole &&
      params.assignedDepartmentCode &&
      params.departmentCode &&
      params.assignedDepartmentCode.toUpperCase().trim() !== params.departmentCode.toUpperCase().trim()
    ) {
      trace.push({
        tierNumber: 8,
        tierName: 'TIER_8_DEPARTMENT_SCOPE',
        status: 'DENY',
        detail: `User is assigned to department "${params.assignedDepartmentCode}"; access to department "${params.departmentCode}" is denied.`
      });
      return {
        decision: 'DENY',
        code: 'DENY_DEPARTMENT_SCOPE',
        reason: `DENY — Cross-department access denied (${params.assignedDepartmentCode} -> ${params.departmentCode})`,
        decisiveTier: 'TIER_8_DEPARTMENT_SCOPE',
        tierNumber: 8,
        trace,
        timestamp: now.toISOString(),
        evaluatedContext: { ...params, action }
      };
    }

    trace.push({
      tierNumber: 8,
      tierName: 'TIER_8_DEPARTMENT_SCOPE',
      status: 'PASS',
      detail: 'Department scope verified.'
    });

    // =========================================================================
    // TIER 9: ROLE & GRANULAR PERMISSIONS
    // =========================================================================
    if (userRoles.length === 0) {
      trace.push({
        tierNumber: 9,
        tierName: 'TIER_9_ROLE_PERMISSIONS',
        status: 'DENY',
        detail: `No roles supplied to evaluate permissions for action "${action}".`
      });
      return {
        decision: 'DENY',
        code: 'DENY_INSUFFICIENT_PERMISSIONS',
        reason: `DENY — No role context provided for action "${action}"`,
        decisiveTier: 'TIER_9_ROLE_PERMISSIONS',
        tierNumber: 9,
        trace,
        timestamp: now.toISOString(),
        evaluatedContext: { ...params, action }
      };
    }

    // Step 1: Separation of Duties & Negative Security Boundaries (fail-closed check)
    for (const r of userRoles) {
      const rUpper = r.toUpperCase();
      const roleCfg = AUTHORITATIVE_ROLES[rUpper] || (ROLE_TEMPLATE_MASTER_CATALOG[rUpper] as any);
      if (roleCfg?.prohibitedActions) {
        for (const prohibited of roleCfg.prohibitedActions) {
          if (actionMatchesProhibited(prohibited, action)) {
            trace.push({
              tierNumber: 9,
              tierName: 'TIER_9_ROLE_PERMISSIONS',
              status: 'DENY',
              detail: `Action "${action}" is explicitly prohibited by role separation-of-duties boundary for ${r} (rule: "${prohibited}").`
            });
            return {
              decision: 'DENY',
              code: 'DENY_INSUFFICIENT_PERMISSIONS',
              reason: `DENY — Action "${action}" is restricted for role ${r}`,
              decisiveTier: 'TIER_9_ROLE_PERMISSIONS',
              tierNumber: 9,
              trace,
              timestamp: now.toISOString(),
              evaluatedContext: { ...params, action }
            };
          }
        }
      }
    }

    // Step 2: Positive Permission Resolution via Authoritative Role & Permission Packs
    let permissionGranted = false;
    let grantingRole = '';

    for (const r of userRoles) {
      const rUpper = r.toUpperCase();
      const roleCfg = AUTHORITATIVE_ROLES[rUpper] || (ROLE_TEMPLATE_MASTER_CATALOG[rUpper] as any);

      if (roleCfg) {
        // Universal grant for admin roles
        if (roleCfg.explicitPermissions?.includes('*')) {
          permissionGranted = true;
          grantingRole = r;
          break;
        }

        // Check explicit permissions
        if (roleCfg.explicitPermissions) {
          for (const perm of roleCfg.explicitPermissions) {
            if (actionMatches(perm, action)) {
              permissionGranted = true;
              grantingRole = r;
              break;
            }
          }
        }
        if (permissionGranted) break;

        // Check permission packs
        const packsToSearch = roleCfg.permissionPacks || roleCfg.permissionBundles || [];
        for (const packCode of packsToSearch) {
          const pack = AUTHORITATIVE_PERMISSION_PACKS[packCode];
          if (pack?.permissions) {
            for (const perm of pack.permissions) {
              if (actionMatches(perm, action)) {
                permissionGranted = true;
                grantingRole = r;
                break;
              }
            }
          }
          if (permissionGranted) break;
        }
        if (permissionGranted) break;
      }
    }

    // Step 3: Check database custom roles if not resolved via authoritative catalog
    if (!permissionGranted && db && pUuid) {
      for (const r of userRoles) {
        try {
          const [dbRole] = await db
            .select()
            .from(roles)
            .where(
              and(
                eq(roles.tenantId, pUuid),
                eq(roles.code, r.toUpperCase())
              )
            );
          if (dbRole) {
            // Unprovisioned or custom role with no explicit permissions remains fail-closed
          }
        } catch {}
      }
    }

    // Fail-closed if no authoritative or custom rule grants permission
    if (!permissionGranted) {
      trace.push({
        tierNumber: 9,
        tierName: 'TIER_9_ROLE_PERMISSIONS',
        status: 'DENY',
        detail: `Role(s) [${userRoles.join(', ')}] do not hold permission for action "${action}".`
      });
      return {
        decision: 'DENY',
        code: 'DENY_INSUFFICIENT_PERMISSIONS',
        reason: `DENY — Insufficient role permissions for action "${action}"`,
        decisiveTier: 'TIER_9_ROLE_PERMISSIONS',
        tierNumber: 9,
        trace,
        timestamp: now.toISOString(),
        evaluatedContext: { ...params, action }
      };
    }

    trace.push({
      tierNumber: 9,
      tierName: 'TIER_9_ROLE_PERMISSIONS',
      status: 'PASS',
      detail: `Granted by role "${grantingRole || userRoles[0]}".`
    });

    // =========================================================================
    // TIER 10: CONDITIONAL POLICY RULES
    // =========================================================================
    const policyCtx: PolicyEvaluationContext = {
      role: params.role,
      roles: params.roles,
      department: params.departmentCode,
      branchId: params.branchId,
      action,
      timestamp: now
    };

    const policyRes = conditionalPolicyEngine.evaluatePolicies(policyCtx);
    if (policyRes.matched && policyRes.effect === 'DENY') {
      trace.push({
        tierNumber: 10,
        tierName: 'TIER_10_CONDITIONAL_POLICY',
        status: 'DENY',
        detail: policyRes.reason || 'Conditional policy evaluated to DENY.'
      });
      return {
        decision: 'DENY',
        code: 'DENY_CONDITIONAL_POLICY',
        reason: `DENY — ${policyRes.reason}`,
        decisiveTier: 'TIER_10_CONDITIONAL_POLICY',
        tierNumber: 10,
        trace,
        timestamp: now.toISOString(),
        evaluatedContext: { ...params, action }
      };
    }

    trace.push({
      tierNumber: 10,
      tierName: 'TIER_10_CONDITIONAL_POLICY',
      status: 'PASS',
      detail: 'No conditional deny policies matched.'
    });

    // =========================================================================
    // TIER 11: BREAK-GLASS EMERGENCY OVERRIDE
    // =========================================================================
    trace.push({
      tierNumber: 11,
      tierName: 'TIER_11_BREAK_GLASS',
      status: 'SKIPPED',
      detail: 'No active break-glass emergency override required.'
    });

    // =========================================================================
    // TIER 12: BRANCH & DATA SCOPE RESTRICTION
    // =========================================================================
    const primaryRole = userRoles[0];
    const roleConfig = primaryRole ? AUTHORITATIVE_ROLES[primaryRole.toUpperCase()] : undefined;
    const isRoleBranchScoped = roleConfig ? roleConfig.branchScope === 'ASSIGNED_BRANCH' : true;

    const assignedBranch = params.assignedBranchId;
    const targetBranch = params.branchId;

    if (isRoleBranchScoped && assignedBranch && targetBranch && !isBranchMatch(assignedBranch, targetBranch)) {
      trace.push({
        tierNumber: 12,
        tierName: 'TIER_12_BRANCH_SCOPE',
        status: 'DENY',
        detail: `User is assigned to branch "${assignedBranch}"; cross-branch access to "${targetBranch}" is forbidden.`
      });
      return {
        decision: 'DENY',
        code: 'DENY_BRANCH_SCOPE',
        reason: `DENY — Cross-branch restriction: access to branch "${targetBranch}" is forbidden for assigned branch "${assignedBranch}"`,
        decisiveTier: 'TIER_12_BRANCH_SCOPE',
        tierNumber: 12,
        trace,
        timestamp: now.toISOString(),
        evaluatedContext: { ...params, action }
      };
    }

    trace.push({
      tierNumber: 12,
      tierName: 'TIER_12_BRANCH_SCOPE',
      status: 'PASS',
      detail: 'Branch scope authorization verified.'
    });

    // ALL TIERS PASSED -> FINAL ALLOW
    return {
      decision: 'ALLOW',
      code: 'ALLOW_GRANTED',
      reason: `ALLOW — Granted by ${userRoles[0] || 'Role'} with all 12 tiers validated`,
      decisiveTier: 'TIER_9_ROLE_PERMISSIONS',
      tierNumber: 9,
      trace,
      timestamp: now.toISOString(),
      evaluatedContext: { ...params, action }
    };
  }

  /**
   * Safe dry-run simulation mode without mutating production database
   */
  async simulateAccess(params: AccessSimulationParams): Promise<AccessDecision> {
    const trace: DecisionTierTrace[] = [];
    const now = params.timestamp || new Date();
    const action = params.action.trim();
    const targetCap = this.resolveActionToCapability(action);

    // 1. Global Freeze Simulation Override
    if (params.globalFreezeOverride) {
      trace.push({
        tierNumber: 1,
        tierName: 'TIER_1_GLOBAL_KILL_SWITCH',
        status: 'DENY',
        detail: 'Simulated Global Security Freeze is active.'
      });
      return {
        decision: 'DENY',
        code: 'SIM_DENY_GLOBAL_FREEZE',
        reason: 'DENY — HQ Global Security Freeze Active (Simulated)',
        decisiveTier: 'TIER_1_GLOBAL_KILL_SWITCH',
        tierNumber: 1,
        trace,
        timestamp: now.toISOString(),
        evaluatedContext: { ...params, action }
      };
    }

    // 2. License Expiry / Suspension Simulation Override
    if (params.licenseStatusOverride === 'EXPIRED' || params.licenseStatusOverride === 'SUSPENDED' || params.licenseStatusOverride === 'LOCKED') {
      trace.push({
        tierNumber: 3,
        tierName: 'TIER_3_LICENSE_VALIDITY',
        status: 'DENY',
        detail: `Simulated Commercial Software License status is ${params.licenseStatusOverride}.`
      });
      return {
        decision: 'DENY',
        granted: false,
        deniedByTier: 3,
        denialReason: `DENY — License ${params.licenseStatusOverride} (Simulated)`,
        code: `SIM_DENY_LICENSE_${params.licenseStatusOverride}`,
        reason: `DENY — License ${params.licenseStatusOverride} (Simulated)`,
        decisiveTier: 'TIER_3_LICENSE_VALIDITY',
        tierNumber: 3,
        trace,
        timestamp: now.toISOString(),
        evaluatedContext: { ...params, action }
      } as any;
    }

    // 3. Capabilities & Dependency Graph Simulation Override
    if (params.capabilitiesOverride) {
      const depCheck = capabilityEngine.validateCapabilityDependencies(params.capabilitiesOverride);
      if (!depCheck.valid) {
        const firstConflict = depCheck.conflicts[0];
        trace.push({
          tierNumber: 6,
          tierName: 'TIER_6_PARTNER_CAPABILITY',
          status: 'DENY',
          detail: firstConflict?.message || 'Capability dependency conflict in simulated configuration.'
        });
        return {
          decision: 'DENY',
          granted: false,
          deniedByTier: 6,
          denialReason: `DENY — ${firstConflict?.message || 'Capability dependency conflict'}`,
          code: `SIM_DENY_${firstConflict?.failureType || 'CAPABILITY_DEPENDENCY'}`,
          reason: `DENY — ${firstConflict?.message || 'Capability dependency conflict'}`,
          decisiveTier: 'TIER_6_PARTNER_CAPABILITY',
          tierNumber: 6,
          trace,
          timestamp: now.toISOString(),
          evaluatedContext: { ...params, action }
        } as any;
      }

      if (!params.capabilitiesOverride.includes(targetCap)) {
        trace.push({
          tierNumber: 6,
          tierName: 'TIER_6_PARTNER_CAPABILITY',
          status: 'DENY',
          detail: `Capability "${targetCap}" is disabled in simulated configuration.`
        });
        return {
          decision: 'DENY',
          granted: false,
          deniedByTier: 6,
          denialReason: `DENY — Capability "${targetCap}" is disabled (Simulated)`,
          code: 'SIM_DENY_CAPABILITY_DISABLED',
          reason: `DENY — Capability "${targetCap}" is disabled (Simulated)`,
          decisiveTier: 'TIER_6_PARTNER_CAPABILITY',
          tierNumber: 6,
          trace,
          timestamp: now.toISOString(),
          evaluatedContext: { ...params, action }
        } as any;
      }
    }

    // Fall through to real evaluation pipeline and attach granted / deniedByTier / denialReason convenience properties
    const result = await this.evaluateAccess(params);
    return {
      ...result,
      granted: result.decision === 'ALLOW',
      deniedByTier: result.decision === 'DENY' ? result.tierNumber : undefined,
      denialReason: result.decision === 'DENY' ? result.reason : undefined
    } as any;
  }

  /**
   * Public token-strict permission matcher (no substring false positives)
   */
  actionMatches(pattern: string, action: string): boolean {
    return actionMatches(pattern, action);
  }

  /**
   * Public separation-of-duties negative prohibition matcher
   */
  actionMatchesProhibited(prohibitedPattern: string, action: string): boolean {
    return actionMatchesProhibited(prohibitedPattern, action);
  }
}

export const effectiveAccessEngine = new EffectiveAccessEngine();
