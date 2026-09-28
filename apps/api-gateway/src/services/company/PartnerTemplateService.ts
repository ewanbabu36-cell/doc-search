import {
  getDatabase,
  partnerTemplates,
  templateVersions,
  partnerCapabilities,
  operationalDepartments,
  operationalPartners,
  operationalOrganizations,
  roles,
  users,
  partnerProfiles,
  partnerGovernanceOverrides,
  partnerConfigurationVersions,
  tenants,
  eq,
  and,
  desc
} from '@docsearch/database';
import { createLogger, AppError } from '@docsearch/shared-core';
import { capabilityEngine } from './CapabilityAndDependencyEngine.js';
import { toDeterministicUuid } from '../../repositories/company/PartnerOnboardingRepository.js';

const logger = createLogger('partner-template-service');

export async function ensureTenantExists(tenantId: string, name = 'Partner Organization'): Promise<void> {
  const db = getDatabase();
  if (!db) return;
  try {
    await db
      .insert(tenants)
      .values({
        id: tenantId,
        name: name,
        slug: `tenant-${tenantId.slice(0, 8)}`,
        status: 'ACTIVE'
      })
      .onConflictDoNothing();

    await db
      .insert(operationalPartners)
      .values({
        id: tenantId,
        tenantId: tenantId,
        partnerCode: `PARTNER-${tenantId.slice(0, 8)}`,
        legalBusinessName: name,
        partnerType: 'HOSPITAL_SYSTEM',
        contactEmail: `admin@${tenantId.slice(0, 8)}.docsearch.local`,
        status: 'ACTIVE'
      })
      .onConflictDoNothing();

    await db
      .insert(operationalOrganizations)
      .values({
        id: tenantId,
        tenantId: tenantId,
        partnerId: tenantId,
        organizationCode: `ORG-${tenantId.slice(0, 8)}`,
        organizationName: name,
        contactEmail: `admin@${tenantId.slice(0, 8)}.docsearch.local`,
        status: 'ACTIVE'
      })
      .onConflictDoNothing();
  } catch {}
}

export async function ensureUserExists(userId: string, email = 'founder@docsearch.health'): Promise<void> {
  const db = getDatabase();
  if (!db) return;
  try {
    await db
      .insert(users)
      .values({
        id: userId,
        email,
        firstName: 'Doctor',
        lastName: 'ShahAlam',
        status: 'ACTIVE',
        isEmailVerified: true
      })
      .onConflictDoNothing();
  } catch {}
}

export interface TemplateBlueprint {
  code: string;
  name: string;
  category: 'CLINIC' | 'HOSPITAL' | 'DIAGNOSTICS' | 'PHARMACY' | 'HEALTHCARE_GROUP' | 'SPECIALTY';
  description: string;
  supportedProfiles: string[];
  capabilities: string[];
  departments: Array<{ code: string; name: string; parentCode?: string; capabilities: string[] }>;
  defaultRoles: Array<{
    code: string;
    name: string;
    description: string;
    dataScope: string;
    branchScope: string;
    permissions: string[];
    permissionPacks: string[];
  }>;
  permissionPacks: string[];
  features: string[];
  limits: {
    maxBeds: number;
    maxDoctors: number;
    maxBranches: number;
    storageQuotaGb: number;
    monthlyWhatsAppCredits: number;
  };
  policies: any[];
}

export const INITIAL_MASTER_TEMPLATES: TemplateBlueprint[] = [
  // 1. Clinic Basic
  {
    code: 'TPL_CLINIC_BASIC',
    name: 'Clinic Basic',
    category: 'CLINIC',
    description: 'Entry outpatient practice management with basic OPD queue, patient EMR and billing receipts.',
    supportedProfiles: ['CLINIC'],
    capabilities: ['OPD', 'BILLING', 'COMMUNICATION'],
    departments: [
      { code: 'OPD_RECEPTION', name: 'Reception & Patient Desk', capabilities: ['OPD'] },
      { code: 'OPD_CLINIC', name: 'General Outpatient Clinic', capabilities: ['OPD'] },
      { code: 'BILLING_CASHIER', name: 'Accounts & Cashier', capabilities: ['BILLING'] }
    ],
    defaultRoles: [
      {
        code: 'CLINIC_ADMIN',
        name: 'Clinic Administrator',
        description: 'Complete operational and billing administrative access for clinic',
        dataScope: 'PARTNER',
        branchScope: 'ALL_BRANCHES',
        permissions: ['*'],
        permissionPacks: ['PACK_OPD_BASIC', 'PACK_BILLING_DESK']
      },
      {
        code: 'DOCTOR',
        name: 'Attending Physician',
        description: 'Clinical consultation, prescription authoring and patient history view',
        dataScope: 'ASSIGNED',
        branchScope: 'ASSIGNED_BRANCH',
        permissions: ['patient:record:view', 'patient:record:create', 'clinical:consultation:author', 'clinical:prescription:sign'],
        permissionPacks: ['PACK_CLINICAL_DOCS']
      },
      {
        code: 'RECEPTIONIST',
        name: 'Front Desk Receptionist',
        description: 'Patient check-in, token distribution and appointment scheduling',
        dataScope: 'BRANCH',
        branchScope: 'ASSIGNED_BRANCH',
        permissions: ['patient:record:view', 'patient:record:create', 'appointment:token:create', 'billing:invoice:view'],
        permissionPacks: ['PACK_RECEPTION_DESK']
      }
    ],
    permissionPacks: ['PACK_OPD_BASIC', 'PACK_CLINICAL_DOCS', 'PACK_RECEPTION_DESK', 'PACK_BILLING_DESK'],
    features: ['opd.queue', 'patient.emr', 'prescription.basic', 'billing.invoices', 'whatsapp.alerts'],
    limits: {
      maxBeds: 0,
      maxDoctors: 3,
      maxBranches: 1,
      storageQuotaGb: 10,
      monthlyWhatsAppCredits: 500
    },
    policies: []
  },

  // 2. Clinic Pro
  {
    code: 'TPL_CLINIC_PRO',
    name: 'Clinic Pro',
    category: 'CLINIC',
    description: 'Advanced multi-doctor polyclinic with AI voice scribe, retail pharmacy POS and lab investigations.',
    supportedProfiles: ['CLINIC', 'PHARMACY', 'LABORATORY'],
    capabilities: ['OPD', 'PHARMACY', 'LABORATORY', 'BILLING', 'AI', 'COMMUNICATION', 'INTEGRATION'],
    departments: [
      { code: 'OPD_RECEPTION', name: 'Reception & Queue Management', capabilities: ['OPD'] },
      { code: 'OPD_CONSULTATION', name: 'Clinical Consultation Suites', capabilities: ['OPD', 'AI'] },
      { code: 'CLINIC_PHARMACY', name: 'In-House Dispensary', capabilities: ['PHARMACY'] },
      { code: 'CLINIC_SAMPLE_COLLECTION', name: 'Diagnostic Collection Bay', capabilities: ['LABORATORY'] },
      { code: 'BILLING_FINANCE', name: 'Billing & TPA Desk', capabilities: ['BILLING'] }
    ],
    defaultRoles: [
      {
        code: 'CLINIC_ADMIN',
        name: 'Clinic Administrator',
        description: 'Complete operational administrative access',
        dataScope: 'PARTNER',
        branchScope: 'ALL_BRANCHES',
        permissions: ['*'],
        permissionPacks: ['PACK_OPD_BASIC', 'PACK_CLINICAL_DOCS', 'PACK_PHARMACY_OPERATOR', 'PACK_BILLING_DESK']
      },
      {
        code: 'DOCTOR',
        name: 'Consultant Doctor',
        description: 'Consultations, AI voice ambient scribe, investigations and e-prescriptions',
        dataScope: 'ASSIGNED',
        branchScope: 'ASSIGNED_BRANCH',
        permissions: ['patient:record:view', 'clinical:consultation:author', 'clinical:prescription:sign', 'ai:scribe:use'],
        permissionPacks: ['PACK_CLINICAL_DOCS']
      },
      {
        code: 'PHARMACIST',
        name: 'Clinical Pharmacist',
        description: 'Prescription dispensing, batch inventory tracking and purchase management',
        dataScope: 'DEPARTMENT',
        branchScope: 'ASSIGNED_BRANCH',
        permissions: ['pharmacy:dispense:create', 'pharmacy:stock:view', 'pharmacy:stock:adjust'],
        permissionPacks: ['PACK_PHARMACY_OPERATOR']
      }
    ],
    permissionPacks: ['PACK_OPD_BASIC', 'PACK_CLINICAL_DOCS', 'PACK_PHARMACY_OPERATOR', 'PACK_LAB_TECH', 'PACK_BILLING_DESK'],
    features: ['opd.queue', 'patient.emr', 'ai.ambient_scribe', 'pharmacy.pos', 'lab.orders', 'billing.invoices', 'abdm.abha'],
    limits: {
      maxBeds: 5,
      maxDoctors: 10,
      maxBranches: 2,
      storageQuotaGb: 50,
      monthlyWhatsAppCredits: 2000
    },
    policies: []
  },

  // 3. Hospital Standard
  {
    code: 'TPL_HOSPITAL_STANDARD',
    name: 'Hospital Standard',
    category: 'HOSPITAL',
    description: 'Mid-sized 50-bed community hospital with OPD, IPD ward management, OT surgery and 24x7 emergency desk.',
    supportedProfiles: ['HOSPITAL', 'PHARMACY', 'LABORATORY'],
    capabilities: ['OPD', 'IPD', 'EMERGENCY', 'OT', 'PHARMACY', 'LABORATORY', 'BILLING', 'MRD', 'COMMUNICATION', 'INTEGRATION'],
    departments: [
      { code: 'HOSP_EMERGENCY', name: 'Emergency & Casualty', capabilities: ['EMERGENCY'] },
      { code: 'HOSP_OPD', name: 'Outpatient Specialty Clinics', capabilities: ['OPD'] },
      { code: 'HOSP_IPD_WARDS', name: 'Inpatient General & Private Wards', capabilities: ['IPD'] },
      { code: 'HOSP_OT', name: 'Operation Theatre Block', capabilities: ['OT', 'IPD'] },
      { code: 'HOSP_PHARMACY', name: 'Central Hospital Pharmacy', capabilities: ['PHARMACY'] },
      { code: 'HOSP_LAB', name: 'Diagnostic Laboratory', capabilities: ['LABORATORY'] },
      { code: 'HOSP_BILLING', name: 'Hospital Invoicing & TPA Desk', capabilities: ['BILLING'] },
      { code: 'HOSP_MRD', name: 'Medical Records Department', capabilities: ['MRD'] }
    ],
    defaultRoles: [
      {
        code: 'HOSPITAL_ADMIN',
        name: 'Hospital Director / Admin',
        description: 'Complete operational command over hospital departments',
        dataScope: 'PARTNER',
        branchScope: 'ALL_BRANCHES',
        permissions: ['*'],
        permissionPacks: ['PACK_EXECUTIVE_AUDIT', 'PACK_BILLING_DESK']
      },
      {
        code: 'HEAD_OF_DEPARTMENT',
        name: 'Department Head',
        description: 'Departmental operational authority, doctor rosters and critical report sign-off',
        dataScope: 'DEPARTMENT',
        branchScope: 'ASSIGNED_BRANCH',
        permissions: ['patient:record:view', 'clinical:consultation:author', 'staff:roster:view', 'lab:result:validate'],
        permissionPacks: ['PACK_CLINICAL_DOCS']
      },
      {
        code: 'NURSE',
        name: 'Staff Ward Nurse',
        description: 'Vitals tracking, bed rounds, medication administration and nursing notes',
        dataScope: 'DEPARTMENT',
        branchScope: 'ASSIGNED_BRANCH',
        permissions: ['patient:record:view', 'clinical:vitals:record', 'inpatient:bed:manage'],
        permissionPacks: ['PACK_NURSING_CORE']
      }
    ],
    permissionPacks: ['PACK_OPD_BASIC', 'PACK_CLINICAL_DOCS', 'PACK_NURSING_CORE', 'PACK_PHARMACY_OPERATOR', 'PACK_LAB_TECH', 'PACK_BILLING_DESK', 'PACK_EXECUTIVE_AUDIT'],
    features: ['opd.queue', 'inpatient.bed_management', 'emergency.triage', 'ot.scheduling', 'pharmacy.pos', 'lab.lims', 'tpa.insurance', 'abdm.abha'],
    limits: {
      maxBeds: 50,
      maxDoctors: 25,
      maxBranches: 1,
      storageQuotaGb: 200,
      monthlyWhatsAppCredits: 5000
    },
    policies: []
  },

  // 4. Hospital Enterprise
  {
    code: 'TPL_HOSPITAL_ENTERPRISE',
    name: 'Hospital Enterprise',
    category: 'HOSPITAL',
    description: 'Tier-1 tertiary care hospital network with ICU critical care, Cath Lab, PACS Radiology, Blood Bank, AI and TPA auto-adjudication.',
    supportedProfiles: ['HOSPITAL', 'PHARMACY', 'LABORATORY', 'SPECIALTY'],
    capabilities: [
      'OPD', 'IPD', 'EMERGENCY', 'ICU', 'OT', 'LABORATORY', 'PATHOLOGY', 'RADIOLOGY',
      'PHARMACY', 'BLOOD_BANK', 'MRD', 'DIETARY', 'BILLING', 'FINANCE', 'HR', 'CRM',
      'ANALYTICS', 'SUPPORT', 'COMMUNICATION', 'AI', 'INTEGRATION'
    ],
    departments: [
      { code: 'ENT_EMERGENCY', name: 'Trauma & Emergency Centre', capabilities: ['EMERGENCY'] },
      { code: 'ENT_ICU_CCU', name: 'Critical Care (ICU, CCU, NICU)', capabilities: ['ICU', 'IPD'] },
      { code: 'ENT_SURGERY_OT', name: 'Modular Surgical OT Complex', capabilities: ['OT', 'IPD'] },
      { code: 'ENT_OPD_COMPLEX', name: 'Super-Specialty OPD Complex', capabilities: ['OPD'] },
      { code: 'ENT_IPD_WARDS', name: 'Executive Inpatient Towers', capabilities: ['IPD'] },
      { code: 'ENT_RADIOLOGY', name: 'Advanced PACS Imaging & MRI', capabilities: ['RADIOLOGY'] },
      { code: 'ENT_PATHOLOGY', name: 'NABL Accredited Pathology Lab', capabilities: ['LABORATORY', 'PATHOLOGY'] },
      { code: 'ENT_BLOOD_BANK', name: 'Licensed Blood Transfusion Unit', capabilities: ['BLOOD_BANK'] },
      { code: 'ENT_PHARMACY_HUB', name: 'Central Hospital Pharmacy Hub', capabilities: ['PHARMACY'] },
      { code: 'ENT_FINANCE', name: 'Corporate Billing & TPA Desk', capabilities: ['BILLING', 'FINANCE'] },
      { code: 'ENT_MRD_AUDIT', name: 'NABH Quality & MRD Department', capabilities: ['MRD', 'ANALYTICS'] }
    ],
    defaultRoles: [
      {
        code: 'HOSPITAL_DIRECTOR',
        name: 'Medical Director / CEO',
        description: 'Ultimate executive authority with multi-branch analytics and compliance controls',
        dataScope: 'PARTNER',
        branchScope: 'ALL_BRANCHES',
        permissions: ['*'],
        permissionPacks: ['PACK_EXECUTIVE_AUDIT', 'PACK_BILLING_DESK']
      },
      {
        code: 'SURGEON',
        name: 'Chief Consultant Surgeon',
        description: 'Operation theatre scheduling, pre/post-op notes, and surgical safety checks',
        dataScope: 'ASSIGNED',
        branchScope: 'ALL_BRANCHES',
        permissions: ['patient:record:view', 'clinical:ot:schedule', 'clinical:consultation:author', 'radiology:dicom:view'],
        permissionPacks: ['PACK_CLINICAL_DOCS']
      },
      {
        code: 'SENIOR_RECEPTION_MANAGER',
        name: 'Senior Reception Manager',
        description: 'Front office supervisor managing intake tokens, appointments and payment viewing',
        dataScope: 'BRANCH',
        branchScope: 'ASSIGNED_BRANCH',
        permissions: [
          'patient:record:view', 'patient:record:create', 'patient:record:edit',
          'appointment:token:view', 'appointment:token:create', 'appointment:token:edit',
          'billing:invoice:view'
        ],
        permissionPacks: ['PACK_RECEPTION_DESK']
      },
      {
        code: 'PATHOLOGIST',
        name: 'Consultant Pathologist',
        description: 'LIMS test sign-off, critical panic alert dispatch and histology reports',
        dataScope: 'DEPARTMENT',
        branchScope: 'ALL_BRANCHES',
        permissions: ['lab:order:view', 'lab:result:enter', 'lab:result:validate', 'lab:report:release'],
        permissionPacks: ['PACK_LAB_TECH']
      }
    ],
    permissionPacks: ['PACK_OPD_BASIC', 'PACK_CLINICAL_DOCS', 'PACK_NURSING_CORE', 'PACK_PHARMACY_OPERATOR', 'PACK_LAB_TECH', 'PACK_BILLING_DESK', 'PACK_EXECUTIVE_AUDIT'],
    features: ['opd.queue', 'inpatient.bed_management', 'emergency.triage', 'icu.telemetry', 'ot.scheduling', 'pacs.dicom', 'lims.pathology', 'blood_bank.transfusion', 'tpa.nhcx', 'ai.cdss', 'abdm.m1_m2_m3'],
    limits: {
      maxBeds: 500,
      maxDoctors: 150,
      maxBranches: 5,
      storageQuotaGb: 2000,
      monthlyWhatsAppCredits: 50000
    },
    policies: []
  },

  // 5. Diagnostic Lab
  {
    code: 'TPL_DIAGNOSTIC_LAB',
    name: 'Diagnostic Lab',
    category: 'DIAGNOSTICS',
    description: 'Standalone pathology laboratory with barcode accessioning, analyzer interfacing and WhatsApp reports.',
    supportedProfiles: ['LABORATORY'],
    capabilities: ['LABORATORY', 'PATHOLOGY', 'BILLING', 'COMMUNICATION', 'INTEGRATION'],
    departments: [
      { code: 'LAB_SAMPLE_INTAKE', name: 'Phlebotomy & Sample Reception', capabilities: ['LABORATORY'] },
      { code: 'LAB_BIOCHEMISTRY', name: 'Biochemistry & Hematology', capabilities: ['LABORATORY'] },
      { code: 'LAB_MICROBIOLOGY', name: 'Microbiology & Serology', capabilities: ['PATHOLOGY'] },
      { code: 'LAB_BILLING', name: 'Cash Counter & Test Booking', capabilities: ['BILLING'] }
    ],
    defaultRoles: [
      {
        code: 'LAB_DIRECTOR',
        name: 'Laboratory Director',
        description: 'Complete operational and quality control over diagnostic laboratory',
        dataScope: 'PARTNER',
        branchScope: 'ALL_BRANCHES',
        permissions: ['*'],
        permissionPacks: ['PACK_LAB_TECH', 'PACK_BILLING_DESK']
      },
      {
        code: 'LAB_TECHNICIAN',
        name: 'Medical Laboratory Technician',
        description: 'Barcode scanning, analyzer testing and numeric result entry',
        dataScope: 'DEPARTMENT',
        branchScope: 'ASSIGNED_BRANCH',
        permissions: ['lab:order:view', 'lab:sample:collect', 'lab:result:enter'],
        permissionPacks: ['PACK_LAB_TECH']
      }
    ],
    permissionPacks: ['PACK_LAB_TECH', 'PACK_BILLING_DESK'],
    features: ['lab.lims', 'barcode.accessioning', 'analyzer.integration', 'whatsapp.reports', 'billing.invoices'],
    limits: {
      maxBeds: 0,
      maxDoctors: 5,
      maxBranches: 2,
      storageQuotaGb: 100,
      monthlyWhatsAppCredits: 10000
    },
    policies: []
  },

  // 6. Diagnostic + Radiology
  {
    code: 'TPL_DIAGNOSTIC_RADIOLOGY',
    name: 'Diagnostic + Radiology',
    category: 'DIAGNOSTICS',
    description: 'Integrated imaging and pathology diagnostic centre with DICOM server, MRI, CT and Lab suites.',
    supportedProfiles: ['LABORATORY', 'SPECIALTY'],
    capabilities: ['LABORATORY', 'PATHOLOGY', 'RADIOLOGY', 'BILLING', 'COMMUNICATION', 'INTEGRATION'],
    departments: [
      { code: 'DIAG_INTAKE', name: 'Patient Booking & Registration', capabilities: ['BILLING'] },
      { code: 'DIAG_RADIOLOGY', name: 'Radiology Imaging (X-Ray, CT, MRI)', capabilities: ['RADIOLOGY'] },
      { code: 'DIAG_PATHOLOGY', name: 'Central Automated Lab', capabilities: ['LABORATORY', 'PATHOLOGY'] }
    ],
    defaultRoles: [
      {
        code: 'RADIOLOGIST',
        name: 'Consultant Radiologist',
        description: 'DICOM image review, multi-planar reconstruction and radiologist report authoring',
        dataScope: 'DEPARTMENT',
        branchScope: 'ALL_BRANCHES',
        permissions: ['radiology:dicom:view', 'radiology:reporting:author', 'radiology:report:release'],
        permissionPacks: ['PACK_LAB_TECH']
      }
    ],
    permissionPacks: ['PACK_LAB_TECH', 'PACK_BILLING_DESK'],
    features: ['pacs.dicom', 'radiology.reporting', 'lab.lims', 'billing.invoices', 'whatsapp.reports'],
    limits: {
      maxBeds: 0,
      maxDoctors: 15,
      maxBranches: 3,
      storageQuotaGb: 1000,
      monthlyWhatsAppCredits: 15000
    },
    policies: []
  },

  // 7. Retail Pharmacy
  {
    code: 'TPL_RETAIL_PHARMACY',
    name: 'Retail Pharmacy',
    category: 'PHARMACY',
    description: 'Independent retail chemist with Schedule H1 register, barcode POS, expiry tracking and GST invoicing.',
    supportedProfiles: ['PHARMACY'],
    capabilities: ['PHARMACY', 'BILLING', 'COMMUNICATION'],
    departments: [
      { code: 'PHARM_COUNTER', name: 'Retail Dispensing Counter', capabilities: ['PHARMACY'] },
      { code: 'PHARM_STOCK', name: 'Stock & Wholesale Receiving', capabilities: ['PHARMACY'] }
    ],
    defaultRoles: [
      {
        code: 'PHARMACY_MANAGER',
        name: 'Registered Pharmacist & Store Incharge',
        description: 'Complete control over drug formulary, stock adjustments and sales ledger',
        dataScope: 'PARTNER',
        branchScope: 'ASSIGNED_BRANCH',
        permissions: ['*'],
        permissionPacks: ['PACK_PHARMACY_OPERATOR', 'PACK_BILLING_DESK']
      }
    ],
    permissionPacks: ['PACK_PHARMACY_OPERATOR', 'PACK_BILLING_DESK'],
    features: ['pharmacy.pos', 'inventory.stock', 'schedule_h1.register', 'gst.invoicing'],
    limits: {
      maxBeds: 0,
      maxDoctors: 0,
      maxBranches: 1,
      storageQuotaGb: 20,
      monthlyWhatsAppCredits: 2000
    },
    policies: []
  },

  // 8. Hospital Pharmacy
  {
    code: 'TPL_HOSPITAL_PHARMACY',
    name: 'Hospital Pharmacy',
    category: 'PHARMACY',
    description: 'Inpatient and emergency hospital dispensary supporting ward indenting, nursing requisitions and bed billing.',
    supportedProfiles: ['PHARMACY'],
    capabilities: ['PHARMACY', 'BILLING', 'IPD', 'COMMUNICATION'],
    departments: [
      { code: 'HOSP_PHARM_CENTRAL', name: 'Central Hospital Pharmacy Store', capabilities: ['PHARMACY'] },
      { code: 'HOSP_PHARM_EMERGENCY', name: 'Emergency Crash Dispensary', capabilities: ['PHARMACY'] }
    ],
    defaultRoles: [
      {
        code: 'HOSPITAL_PHARMACIST',
        name: 'Hospital Dispensing Pharmacist',
        description: 'Fulfills doctor electronic prescriptions and nurse ward indent requests',
        dataScope: 'DEPARTMENT',
        branchScope: 'ASSIGNED_BRANCH',
        permissions: ['pharmacy:dispense:create', 'pharmacy:stock:view'],
        permissionPacks: ['PACK_PHARMACY_OPERATOR']
      }
    ],
    permissionPacks: ['PACK_PHARMACY_OPERATOR', 'PACK_BILLING_DESK'],
    features: ['pharmacy.pos', 'ward.indenting', 'inpatient.bed_billing', 'stock.batch_tracking'],
    limits: {
      maxBeds: 200,
      maxDoctors: 10,
      maxBranches: 1,
      storageQuotaGb: 100,
      monthlyWhatsAppCredits: 10000
    },
    policies: []
  },

  // 9. Healthcare Group
  {
    code: 'TPL_HEALTHCARE_GROUP',
    name: 'Healthcare Group',
    category: 'HEALTHCARE_GROUP',
    description: 'Multi-entity enterprise healthcare conglomerate managing multiple hospitals, polyclinics, pharmacy chains and central diagnostic labs.',
    supportedProfiles: ['HEALTHCARE_GROUP', 'HOSPITAL', 'CLINIC', 'LABORATORY', 'PHARMACY'],
    capabilities: [
      'OPD', 'IPD', 'EMERGENCY', 'ICU', 'OT', 'LABORATORY', 'PATHOLOGY', 'RADIOLOGY',
      'PHARMACY', 'BLOOD_BANK', 'MRD', 'DIETARY', 'BILLING', 'FINANCE', 'HR', 'CRM',
      'ANALYTICS', 'SUPPORT', 'COMMUNICATION', 'AI', 'INTEGRATION'
    ],
    departments: [
      { code: 'GRP_HQ', name: 'Corporate HQ Directorate', capabilities: ['ANALYTICS', 'FINANCE', 'CRM'] },
      { code: 'GRP_HOSPITALS', name: 'Hospital Operations Cluster', capabilities: ['HOSPITAL'] },
      { code: 'GRP_CLINICS', name: 'Outreach Clinic Network', capabilities: ['CLINIC'] },
      { code: 'GRP_DIAGNOSTICS', name: 'Central Lab Network', capabilities: ['LABORATORY', 'RADIOLOGY'] },
      { code: 'GRP_PHARMACIES', name: 'Retail Pharmacy Chain', capabilities: ['PHARMACY'] }
    ],
    defaultRoles: [
      {
        code: 'GROUP_SUPER_ADMIN',
        name: 'Group Executive Officer',
        description: 'Highest authority across all healthcare network entities and branches',
        dataScope: 'PARTNER',
        branchScope: 'ALL_BRANCHES',
        permissions: ['*'],
        permissionPacks: ['PACK_EXECUTIVE_AUDIT', 'PACK_BILLING_DESK']
      }
    ],
    permissionPacks: ['PACK_OPD_BASIC', 'PACK_CLINICAL_DOCS', 'PACK_NURSING_CORE', 'PACK_PHARMACY_OPERATOR', 'PACK_LAB_TECH', 'PACK_BILLING_DESK', 'PACK_EXECUTIVE_AUDIT'],
    features: ['all.enterprise_suite'],
    limits: {
      maxBeds: 2000,
      maxDoctors: 500,
      maxBranches: 25,
      storageQuotaGb: 10000,
      monthlyWhatsAppCredits: 200000
    },
    policies: []
  },

  // 10. Specialty Centre
  {
    code: 'TPL_SPECIALTY_CENTRE',
    name: 'Specialty Centre',
    category: 'SPECIALTY',
    description: 'Focused single-specialty hospital or institute (e.g. Cardiac, Eye Care, Dental, Dialysis, Oncology or IVF).',
    supportedProfiles: ['SPECIALTY', 'CLINIC'],
    capabilities: ['OPD', 'IPD', 'OT', 'PHARMACY', 'BILLING', 'COMMUNICATION', 'INTEGRATION'],
    departments: [
      { code: 'SPEC_RECEPTION', name: 'Specialty Reception & Counselling', capabilities: ['OPD'] },
      { code: 'SPEC_PROCEDURE', name: 'Procedure & Minor OT Suite', capabilities: ['OT'] },
      { code: 'SPEC_DAYCARE', name: 'Daycare Recovery Bays', capabilities: ['IPD'] },
      { code: 'SPEC_PHARMACY', name: 'Specialty Pharmacy Counter', capabilities: ['PHARMACY'] }
    ],
    defaultRoles: [
      {
        code: 'SPECIALTY_DIRECTOR',
        name: 'Institute Director & Specialist',
        description: 'Complete specialty clinical governance and patient management',
        dataScope: 'PARTNER',
        branchScope: 'ALL_BRANCHES',
        permissions: ['*'],
        permissionPacks: ['PACK_CLINICAL_DOCS', 'PACK_BILLING_DESK']
      }
    ],
    permissionPacks: ['PACK_OPD_BASIC', 'PACK_CLINICAL_DOCS', 'PACK_PHARMACY_OPERATOR', 'PACK_BILLING_DESK'],
    features: ['opd.specialty', 'procedure.scheduling', 'daycare.beds', 'specialty.prescriptions', 'billing.invoices'],
    limits: {
      maxBeds: 25,
      maxDoctors: 15,
      maxBranches: 2,
      storageQuotaGb: 150,
      monthlyWhatsAppCredits: 5000
    },
    policies: []
  }
];

export class PartnerTemplateService {
  private templatesMemory = new Map<string, any>();
  private versionsMemory = new Map<string, any[]>();

  constructor() {
    this.seedMasterTemplates().catch(() => {});
  }

  async seedMasterTemplates(): Promise<void> {
    const db = getDatabase();
    for (const blueprint of INITIAL_MASTER_TEMPLATES) {
      const tplId = toDeterministicUuid(blueprint.code);
      this.templatesMemory.set(blueprint.code, {
        id: tplId,
        code: blueprint.code,
        name: blueprint.name,
        category: blueprint.category,
        description: blueprint.description,
        isSystem: true,
        status: 'ACTIVE',
        currentVersion: 1
      });

      const verId = toDeterministicUuid(`${blueprint.code}-v1`);
      const verObj = {
        id: verId,
        templateId: tplId,
        versionNumber: 1,
        status: 'PUBLISHED',
        supportedProfiles: blueprint.supportedProfiles,
        capabilities: blueprint.capabilities,
        departments: blueprint.departments,
        defaultRoles: blueprint.defaultRoles,
        permissionPacks: blueprint.permissionPacks,
        features: blueprint.features,
        limits: blueprint.limits,
        policies: blueprint.policies,
        changeSummary: 'Baseline certified v1 blueprint',
        createdBy: 'DocSearch Directorate'
      };

      this.versionsMemory.set(tplId, [verObj]);

      if (db) {
        try {
          await db
            .insert(partnerTemplates)
            .values({
              id: tplId,
              code: blueprint.code,
              name: blueprint.name,
              category: blueprint.category,
              description: blueprint.description,
              isSystem: true,
              status: 'ACTIVE',
              currentVersion: 1
            })
            .onConflictDoNothing({ target: partnerTemplates.code });

          await db
            .insert(templateVersions)
            .values(verObj)
            .onConflictDoNothing();
        } catch (err) {
          // Non-fatal seed warning
        }
      }
    }
  }

  async getTemplates(category?: string): Promise<any[]> {
    const db = getDatabase();
    let list: any[] = [];
    if (db) {
      try {
        const rows = await db.select().from(partnerTemplates);
        if (rows.length > 0) {
          list = rows;
        }
      } catch {}
    }

    // Always merge in master blueprints from memory so system templates are never eclipsed
    const masterList = Array.from(this.templatesMemory.values());
    for (const m of masterList) {
      if (!list.some((t) => t.code === m.code)) {
        list.push(m);
      }
    }

    if (category && category !== 'ALL') {
      list = list.filter((t) => t.category.toUpperCase() === category.toUpperCase());
    }
    return list;
  }

  async getTemplateById(templateIdOrCode: string): Promise<any | null> {
    const db = getDatabase();
    const needle = templateIdOrCode.trim();
    const targetUuid = toDeterministicUuid(needle);

    if (db) {
      try {
        const [tpl] = await db
          .select()
          .from(partnerTemplates)
          .where(eq(partnerTemplates.id, targetUuid));

        if (tpl) {
          const versions = await db
            .select()
            .from(templateVersions)
            .where(eq(templateVersions.templateId, tpl.id))
            .orderBy(desc(templateVersions.versionNumber));
          return { ...tpl, versions };
        }
      } catch {}
    }

    const memTpl =
      this.templatesMemory.get(needle) ||
      Array.from(this.templatesMemory.values()).find((t) => t.id === needle || t.id === targetUuid);

    if (memTpl) {
      const versions = this.versionsMemory.get(memTpl.id) || [];
      return { ...memTpl, versions };
    }

    return null;
  }

  async createTemplateVersion(
    templateId: string,
    payload: {
      capabilities?: string[];
      departments?: any[];
      defaultRoles?: any[];
      permissionPacks?: string[];
      features?: string[];
      limits?: any;
      policies?: any[];
      changeSummary: string;
      supportedProfiles?: string[];
    },
    actor = 'founder@docsearch.health'
  ): Promise<any> {
    const tpl = await this.getTemplateById(templateId);
    if (!tpl) {
      throw new AppError({ message: `Template ${templateId} not found`, statusCode: 404 });
    }

    const nextVerNumber = (tpl.currentVersion || 1) + 1;
    const db = getDatabase();

    const newVersion = {
      id: toDeterministicUuid(`${tpl.code}-v${nextVerNumber}`),
      templateId: tpl.id,
      versionNumber: nextVerNumber,
      status: 'PUBLISHED',
      supportedProfiles: payload.supportedProfiles || tpl.versions?.[0]?.supportedProfiles || ['HOSPITAL'],
      capabilities: payload.capabilities || tpl.versions?.[0]?.capabilities || [],
      departments: payload.departments || tpl.versions?.[0]?.departments || [],
      defaultRoles: payload.defaultRoles || tpl.versions?.[0]?.defaultRoles || [],
      permissionPacks: payload.permissionPacks || tpl.versions?.[0]?.permissionPacks || [],
      features: payload.features || tpl.versions?.[0]?.features || [],
      limits: payload.limits || tpl.versions?.[0]?.limits || {},
      policies: payload.policies || tpl.versions?.[0]?.policies || [],
      changeSummary: payload.changeSummary,
      createdBy: actor,
      createdAt: new Date()
    };

    if (db) {
      await db.insert(templateVersions).values(newVersion as any);
      await db
        .update(partnerTemplates)
        .set({ currentVersion: nextVerNumber, updatedAt: new Date() })
        .where(eq(partnerTemplates.id, tpl.id));
    }

    const verList = this.versionsMemory.get(tpl.id) || [];
    verList.unshift(newVersion);
    this.versionsMemory.set(tpl.id, verList);
    tpl.currentVersion = nextVerNumber;

    return newVersion;
  }

  /**
   * Applies an authoritative blueprint template to a partner.
   * Directly configures partner_capabilities, operational departments, default roles and quotas.
   */
  async applyTemplateToPartner(
    partnerId: string,
    templateIdOrCode: string,
    versionNumber?: number,
    actor = 'founder@docsearch.health'
  ): Promise<{ success: boolean; appliedVersion: number; configurationVersion: number; message: string }> {
    const tpl = await this.getTemplateById(templateIdOrCode);
    if (!tpl) {
      throw new AppError({ message: `Template ${templateIdOrCode} not found`, statusCode: 404 });
    }

    const targetVersion =
      versionNumber !== undefined
        ? tpl.versions.find((v: any) => v.versionNumber === versionNumber)
        : tpl.versions?.[0];

    if (!targetVersion) {
      throw new AppError({ message: `Template version not found`, statusCode: 404 });
    }

    const db = getDatabase();
    const pUuid = toDeterministicUuid(partnerId);

    // 1. Validate capability dependencies
    const check = capabilityEngine.validateCapabilityDependencies(targetVersion.capabilities || []);
    if (!check.valid) {
      throw new AppError({
        message: `Cannot apply template: ${check.conflicts[0]?.message}`,
        statusCode: 400
      });
    }

    if (db) {
      try {
        await ensureTenantExists(pUuid, partnerId);
        // A. Update partner_profiles with applied template info and active profiles
        await db
          .update(partnerProfiles)
          .set({
            appliedTemplateId: tpl.id,
            appliedTemplateVersion: targetVersion.versionNumber,
            activeProfiles: targetVersion.supportedProfiles,
            updatedAt: new Date()
          })
          .where(eq(partnerProfiles.id, pUuid));

        // B. Activate capabilities in partner_capabilities
        for (const capCode of targetVersion.capabilities || []) {
          const [existingCap] = await db
            .select()
            .from(partnerCapabilities)
            .where(
              and(
                eq(partnerCapabilities.tenantId, pUuid),
                eq(partnerCapabilities.capabilityCode, capCode)
              )
            );
          if (existingCap) {
            if (existingCap.isHqOverride) {
              continue; // HQ override strictly takes precedence over template blueprint
            }
            await db
              .update(partnerCapabilities)
              .set({ status: 'ACTIVE', updatedBy: actor, updatedAt: new Date() })
              .where(eq(partnerCapabilities.id, existingCap.id));
          } else {
            await db
              .insert(partnerCapabilities)
              .values({
                id: crypto.randomUUID(),
                partnerId,
                tenantId: pUuid,
                capabilityCode: capCode,
                status: 'ACTIVE',
                isHqOverride: false,
                updatedBy: actor
              });
          }
        }

        // C. Populate departments in operationalDepartments
        for (const dept of targetVersion.departments || []) {
          const deptCode = `${partnerId.substring(0, 8)}-${dept.code}`;
          await db
            .insert(operationalDepartments)
            .values({
              id: crypto.randomUUID(),
              tenantId: pUuid,
              partnerId: pUuid,
              organizationId: pUuid,
              departmentCode: deptCode,
              departmentName: dept.name,
              status: 'ACTIVE'
            })
            .onConflictDoNothing({ target: operationalDepartments.departmentCode });
        }

        // D. Create custom roles in core.roles
        for (const r of targetVersion.defaultRoles || []) {
          const roleCode = `${partnerId.substring(0, 8)}_${r.code}`;
          await db
            .insert(roles)
            .values({
              id: crypto.randomUUID(),
              tenantId: pUuid,
              name: r.name,
              code: roleCode,
              description: r.description,
              isSystem: false
            })
            .onConflictDoNothing({ target: [roles.tenantId, roles.code] });
        }

        // E. Configure limits & quotas in partner_governance_overrides
        if (targetVersion.limits) {
          await db
            .insert(partnerGovernanceOverrides)
            .values({
              id: crypto.randomUUID(),
              partnerId,
              tenantId: pUuid,
              moduleCode: 'GENERAL_QUOTA',
              status: 'ACTIVE',
              maxBeds: targetVersion.limits.maxBeds || 0,
              maxDoctorSeats: targetVersion.limits.maxDoctors || 10,
              storageQuotaGb: targetVersion.limits.storageQuotaGb || 50,
              monthlyWhatsAppCredits: targetVersion.limits.monthlyWhatsAppCredits || 2000,
              updatedBy: actor,
              reason: `Applied from template "${tpl.name}" v${targetVersion.versionNumber}`
            })
            .onConflictDoUpdate({
              target: [partnerGovernanceOverrides.tenantId, partnerGovernanceOverrides.moduleCode],
              set: {
                maxBeds: targetVersion.limits.maxBeds || 0,
                maxDoctorSeats: targetVersion.limits.maxDoctors || 10,
                storageQuotaGb: targetVersion.limits.storageQuotaGb || 50,
                monthlyWhatsAppCredits: targetVersion.limits.monthlyWhatsAppCredits || 2000,
                updatedBy: actor,
                updatedAt: new Date()
              }
            });
        }

        // F. Capture initial configuration snapshot
        await db
          .insert(partnerConfigurationVersions)
          .values({
            id: crypto.randomUUID(),
            tenantId: pUuid,
            partnerId,
            versionNumber: 1,
            appliedTemplateId: tpl.id,
            appliedTemplateVersion: targetVersion.versionNumber,
            snapshot: {
              templateCode: tpl.code,
              templateVersion: targetVersion.versionNumber,
              capabilities: targetVersion.capabilities,
              departments: targetVersion.departments,
              roles: targetVersion.defaultRoles,
              limits: targetVersion.limits
            },
            diffSummary: `Initial blueprint application of template "${tpl.name}" (v${targetVersion.versionNumber})`,
            changeReason: `Template Application: ${tpl.name}`,
            changedBy: actor
          })
          .onConflictDoNothing();
      } catch (err) {
        logger.warn('Error during template application to database: ' + String(err));
      }
    }

    return {
      success: true,
      configurationVersion: 1,
      appliedVersion: targetVersion.versionNumber,
      message: `Template "${tpl.name}" (v${targetVersion.versionNumber}) successfully applied to partner ${partnerId}.`
    };
  }

  /**
   * Saves a partner's customized configuration as a brand new reusable blueprint template
   */
  async savePartnerAsTemplate(
    partnerId: string,
    templateName: string,
    templateCode: string,
    category: 'CLINIC' | 'HOSPITAL' | 'DIAGNOSTICS' | 'PHARMACY' | 'HEALTHCARE_GROUP' | 'SPECIALTY' = 'HOSPITAL',
    actor = 'founder@docsearch.health'
  ): Promise<any> {
    const db = getDatabase();
    const pUuid = toDeterministicUuid(partnerId);

    let activeCaps: string[] = [];
    let deptList: any[] = [];
    let roleList: any[] = [];
    let quotas: any = { maxBeds: 50, maxDoctors: 15, maxBranches: 1, storageQuotaGb: 100, monthlyWhatsAppCredits: 5000 };

    if (db) {
      try {
        const caps = await db
          .select()
          .from(partnerCapabilities)
          .where(and(eq(partnerCapabilities.tenantId, pUuid), eq(partnerCapabilities.status, 'ACTIVE')));
        activeCaps = caps.map((c) => c.capabilityCode);

        const depts = await db
          .select()
          .from(operationalDepartments)
          .where(and(eq(operationalDepartments.tenantId, pUuid), eq(operationalDepartments.status, 'ACTIVE')));
        deptList = depts.map((d) => ({ code: d.departmentCode, name: d.departmentName, capabilities: [] }));

        const rList = await db
          .select()
          .from(roles)
          .where(eq(roles.tenantId, pUuid));
        roleList = rList.map((r) => ({ code: r.code, name: r.name, description: r.description, dataScope: 'BRANCH', permissions: [] }));

        const [gov] = await db
          .select()
          .from(partnerGovernanceOverrides)
          .where(eq(partnerGovernanceOverrides.tenantId, pUuid));
        if (gov) {
          quotas = {
            maxBeds: gov.maxBeds || 0,
            maxDoctors: gov.maxDoctorSeats || 10,
            maxBranches: 1,
            storageQuotaGb: gov.storageQuotaGb || 50,
            monthlyWhatsAppCredits: gov.monthlyWhatsAppCredits || 2000
          };
        }
      } catch {}
    }

    if (activeCaps.length === 0) {
      activeCaps = ['OPD', 'IPD', 'PHARMACY', 'LABORATORY', 'BILLING'];
    }

    const tplId = toDeterministicUuid(templateCode);
    const newTpl = {
      id: tplId,
      code: templateCode.toUpperCase().trim(),
      name: templateName.trim(),
      description: `Cloned from partner ${partnerId} configuration on ${new Date().toISOString()}`,
      category,
      isSystem: false,
      status: 'ACTIVE',
      currentVersion: 1
    };

    const verId = toDeterministicUuid(`${templateCode}-v1`);
    const newVer = {
      id: verId,
      templateId: tplId,
      versionNumber: 1,
      status: 'PUBLISHED',
      supportedProfiles: [category],
      capabilities: activeCaps,
      departments: deptList,
      defaultRoles: roleList,
      permissionPacks: ['PACK_OPD_BASIC', 'PACK_CLINICAL_DOCS', 'PACK_BILLING_DESK'],
      features: ['opd.queue', 'billing.invoices'],
      limits: quotas,
      policies: [],
      changeSummary: `Custom template captured from partner ${partnerId}`,
      createdBy: actor
    };

    if (db) {
      await db.insert(partnerTemplates).values(newTpl).onConflictDoNothing();
      await db.insert(templateVersions).values(newVer).onConflictDoNothing();
    }

    this.templatesMemory.set(newTpl.code, newTpl);
    this.versionsMemory.set(tplId, [newVer]);

    return {
      template: newTpl,
      version: newVer
    };
  }
}

export const partnerTemplateService = new PartnerTemplateService();
