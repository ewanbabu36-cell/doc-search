export type CanonicalWorkspaceType =
  | 'HOSPITAL'
  | 'CLINIC'
  | 'PHARMACY'
  | 'PATHOLOGY'
  | 'DIAGNOSTIC_CENTRE'
  | 'ENTERPRISE_COMMAND'
  | 'RESTRICTED';

export type CanonicalRoleType =
  | 'HOSPITAL_DIRECTOR'
  | 'CLINIC_DOCTOR'
  | 'PHARMACIST'
  | 'PATHOLOGIST'
  | 'RADIOLOGIST'
  | 'HOSPITAL_ADMIN'
  | 'SUPER_ADMIN'
  | 'RESTRICTED';

export type CanonicalCrmPartnerType =
  | 'HOSPITAL_NETWORK'
  | 'CLINIC_GROUP'
  | 'PHARMACY'
  | 'DIAGNOSTIC_LAB'
  | 'DIAGNOSTIC_CENTRE'
  | 'RESTRICTED';

export interface NormalizedFacilityProfile {
  workspace: CanonicalWorkspaceType;
  primaryRole: CanonicalRoleType;
  crmType: CanonicalCrmPartnerType;
  facilityCategoryName: string;
  defaultModule: string;
  defaultPlanTier: string;
  allowedWorkspaces: CanonicalWorkspaceType[];
  accessibleFeatures: string[];
  isRestricted?: boolean;
}

export const CANONICAL_FACILITY_PROFILES: Record<CanonicalWorkspaceType, NormalizedFacilityProfile> = {
  PATHOLOGY: {
    workspace: 'PATHOLOGY',
    primaryRole: 'PATHOLOGIST',
    crmType: 'DIAGNOSTIC_LAB',
    facilityCategoryName: 'Pathology & Diagnostic Laboratory',
    defaultModule: 'clinical-investigation',
    defaultPlanTier: 'Pathology Pro & Barcode LIMS',
    allowedWorkspaces: ['PATHOLOGY'],
    accessibleFeatures: [
      'LIMS Testing Workbench',
      'Barcodes & Phlebotomy Accession',
      'WhatsApp Report Delivery',
      'ABDM 2.0 Diagnostic Link'
    ],
    isRestricted: false
  },
  CLINIC: {
    workspace: 'CLINIC',
    primaryRole: 'CLINIC_DOCTOR',
    crmType: 'CLINIC_GROUP',
    facilityCategoryName: 'Outpatient Clinic & Doctor Practice',
    defaultModule: 'clinical-consultation',
    defaultPlanTier: 'Doctor OPD Clinic Pro',
    allowedWorkspaces: ['CLINIC'],
    accessibleFeatures: [
      'OPD Reception & Tokens',
      'Nurse Vitals & Triage',
      'Doctor OPD Desk & EMR',
      'AI Voice Scribe & CDSS',
      'Clinic Dispensary POS',
      'Instant UPI & Billing',
      'WhatsApp Digital Rx',
      'ABDM Scan & Share'
    ],
    isRestricted: false
  },
  PHARMACY: {
    workspace: 'PHARMACY',
    primaryRole: 'PHARMACIST',
    crmType: 'PHARMACY',
    facilityCategoryName: 'Retail & Hospital Pharmacy',
    defaultModule: 'pharmacy-medication',
    defaultPlanTier: 'Retail Pharmacy POS Suite',
    allowedWorkspaces: ['PHARMACY'],
    accessibleFeatures: [
      'OPD Rx Queue',
      'Pharmacy POS Counter',
      'Stock Inward & Batch Expiry',
      'Drug Formulary Catalog',
      'Schedule H1 Compliance Register',
      'WhatsApp Bill & Receipt'
    ],
    isRestricted: false
  },
  DIAGNOSTIC_CENTRE: {
    workspace: 'DIAGNOSTIC_CENTRE',
    primaryRole: 'RADIOLOGIST',
    crmType: 'DIAGNOSTIC_CENTRE',
    facilityCategoryName: 'Radiology & Diagnostic Imaging',
    defaultModule: 'radiology-imaging',
    defaultPlanTier: 'Diagnostic PACS & Modality Hub',
    allowedWorkspaces: ['DIAGNOSTIC_CENTRE'],
    accessibleFeatures: [
      'Web DICOM PACS',
      'Modality Scheduling',
      'Cashless TPA Pre-Auth',
      'Diagnostic Billing POS',
      'WhatsApp Imaging Reports'
    ],
    isRestricted: false
  },
  HOSPITAL: {
    workspace: 'HOSPITAL',
    primaryRole: 'HOSPITAL_DIRECTOR',
    crmType: 'HOSPITAL_NETWORK',
    facilityCategoryName: 'Multi-Specialty Inpatient Hospital',
    defaultModule: 'hospital-home',
    defaultPlanTier: 'Multi-Specialty Hospital Suite',
    allowedWorkspaces: ['HOSPITAL', 'CLINIC', 'PHARMACY', 'PATHOLOGY', 'DIAGNOSTIC_CENTRE', 'ENTERPRISE_COMMAND'],
    accessibleFeatures: [
      'Multi-Department HIS & Closed Loop',
      'Inpatient ADT & Bed Management',
      'Emergency & Trauma Care (ER)',
      'Operation Theatres (OT)',
      'Blood Bank & Transfusion',
      'Doctor OPD Desk & EMR',
      'Pathology Laboratory LIMS',
      'Radiology & DICOM PACS',
      'Hospital Pharmacy POS',
      'Billing POS & Multi-Party UPI',
      'TPA Cashless Claims & NHCX',
      'NABH Quality & Infection Control'
    ],
    isRestricted: false
  },
  ENTERPRISE_COMMAND: {
    workspace: 'ENTERPRISE_COMMAND',
    primaryRole: 'SUPER_ADMIN',
    crmType: 'HOSPITAL_NETWORK',
    facilityCategoryName: 'Enterprise Command & Multi-Facility Network',
    defaultModule: 'executive-command-center',
    defaultPlanTier: 'Enterprise Network Command',
    allowedWorkspaces: ['HOSPITAL', 'CLINIC', 'PHARMACY', 'PATHOLOGY', 'DIAGNOSTIC_CENTRE', 'ENTERPRISE_COMMAND'],
    accessibleFeatures: [
      'Executive Command Center & KPI',
      'Multi-Facility Governance',
      'Enterprise Inpatient Census',
      'Enterprise Revenue & Escrow',
      'Global Audit & Compliance'
    ],
    isRestricted: false
  },
  RESTRICTED: {
    workspace: 'RESTRICTED',
    primaryRole: 'RESTRICTED',
    crmType: 'RESTRICTED',
    facilityCategoryName: 'Restricted — Facility Profile Verification Required',
    defaultModule: 'account-plan-features',
    defaultPlanTier: 'Restricted — Profile Verification Required',
    allowedWorkspaces: [],
    accessibleFeatures: [],
    isRestricted: true
  }
};

export const RESTRICTED_FACILITY_PROFILE: NormalizedFacilityProfile = CANONICAL_FACILITY_PROFILES.RESTRICTED;

/**
 * Universal facility profile normalizer (CAP-03 Fail-Closed).
 * Accepts a known facility type or canonical identifier and maps it to its canonical workspace,
 * primary role, CRM type, and default scoped features.
 * If rawType is null, undefined, empty, unknown, or invalid, fails closed to RESTRICTED_FACILITY_PROFILE
 * with zero operating-model workspaces/features (never escalates to HOSPITAL).
 */
export function normalizeFacilityProfile(rawType?: string | null): NormalizedFacilityProfile {
  if (!rawType || typeof rawType !== 'string') {
    return RESTRICTED_FACILITY_PROFILE;
  }

  const cleaned = rawType.toUpperCase().trim().replace(/[\s-]+/g, '_');
  if (!cleaned || cleaned === 'UNKNOWN' || cleaned === 'INVALID' || cleaned === 'NULL' || cleaned === 'UNDEFINED') {
    return RESTRICTED_FACILITY_PROFILE;
  }

  // 1. Pathology / Lab matching
  if (
    cleaned === 'PATHOLOGY' ||
    cleaned === 'DIAGNOSTIC_LAB' ||
    cleaned === 'LAB' ||
    cleaned === 'LABORATORY' ||
    cleaned === 'CLINICAL_LAB' ||
    cleaned === 'PATH_LAB' ||
    cleaned.includes('PATHOLOGY') ||
    cleaned.endsWith('_LAB') ||
    cleaned === 'TPL_DIAGNOSTIC_LAB'
  ) {
    return CANONICAL_FACILITY_PROFILES.PATHOLOGY;
  }

  // 2. Pharmacy / Chemist / Wholesale Pharmacy matching
  if (
    cleaned === 'PHARMACY' ||
    cleaned === 'PHARMACY_WHOLESALE' ||
    cleaned === 'WHOLESALE_PHARMACY' ||
    cleaned === 'CHEMIST' ||
    cleaned === 'DRUGSTORE' ||
    cleaned === 'DISPENSARY' ||
    cleaned.includes('PHARMACY') ||
    cleaned === 'TPL_RETAIL_PHARMACY'
  ) {
    return CANONICAL_FACILITY_PROFILES.PHARMACY;
  }

  // 3. Radiology / Imaging / Diagnostic Centre matching
  if (
    cleaned === 'DIAGNOSTIC_CENTRE' ||
    cleaned === 'DIAGNOSTIC_CENTER' ||
    cleaned === 'RADIOLOGY' ||
    cleaned === 'IMAGING' ||
    cleaned === 'IMAGING_CENTRE' ||
    cleaned === 'IMAGING_CENTER' ||
    cleaned === 'PACS' ||
    cleaned === 'SCAN_CENTER' ||
    cleaned.includes('RADIOLOGY') ||
    cleaned === 'TPL_DIAGNOSTIC_CENTRE'
  ) {
    return CANONICAL_FACILITY_PROFILES.DIAGNOSTIC_CENTRE;
  }

  // 4. Clinic / Doctor OPD / Solo Practitioner matching
  if (
    cleaned === 'CLINIC' ||
    cleaned === 'CLINIC_GROUP' ||
    cleaned === 'CLINIC_OPD' ||
    cleaned === 'INDIVIDUAL_PRACTICE' ||
    cleaned === 'DOCTOR' ||
    cleaned === 'SOLO_PRACTICE' ||
    cleaned === 'DENTAL_CLINIC' ||
    cleaned === 'AYUSH_WELLNESS' ||
    cleaned === 'EYE_CARE' ||
    cleaned === 'PHYSIOTHERAPY' ||
    cleaned === 'COMBO_CLINIC_PATHOLOGY' ||
    cleaned === 'COMBO_CLINIC_PHARMACY' ||
    cleaned.includes('CLINIC') ||
    cleaned === 'TPL_CLINIC_OPD'
  ) {
    return CANONICAL_FACILITY_PROFILES.CLINIC;
  }

  // 5. Hospital / Inpatient / Surgical / Hospital Network matching
  if (
    cleaned === 'HOSPITAL' ||
    cleaned === 'HOSPITAL_NETWORK' ||
    cleaned === 'HOSPITAL_SYSTEM' ||
    cleaned === 'SURGICAL_CENTER' ||
    cleaned === 'SURGICAL_CENTRE' ||
    cleaned === 'NURSING_HOME' ||
    cleaned === 'HEALTHCARE_SYSTEM' ||
    cleaned === 'MULTI_SPECIALTY' ||
    cleaned === 'MULTI_SPECIALTY_HOSPITAL' ||
    cleaned === 'SUPER_SPECIALTY' ||
    cleaned === 'SUPER_SPECIALTY_HOSPITAL' ||
    cleaned === 'GENERAL_HOSPITAL' ||
    cleaned === 'MATERNITY_HOSPITAL' ||
    cleaned === 'TPL_MULTI_SPECIALTY_HOSPITAL'
  ) {
    return CANONICAL_FACILITY_PROFILES.HOSPITAL;
  }

  if (cleaned === 'ENTERPRISE_COMMAND' || cleaned === 'ENTERPRISE') {
    return CANONICAL_FACILITY_PROFILES.ENTERPRISE_COMMAND;
  }

  // CAP-03 Fail-closed: Never grant HOSPITAL privileges for unknown/invalid/tampered input
  return RESTRICTED_FACILITY_PROFILE;
}

// ============================================================================
// 2-TIER HOSPITAL MODEL: FREE OPD FOUNDATION vs PAID COMPLETE SUITE
// ============================================================================

export const HOSPITAL_FREE_TIER_NAME = 'Hospital Foundation (Free OPD Core)';
export const HOSPITAL_PRO_TIER_NAME = 'Hospital Complete Enterprise Suite';

export const FREE_HOSPITAL_FEATURES = [
  'OPD Reception & Tokens',
  'ABHA Scan & Share QR Kiosk',
  'Nurse Vitals Station',
  'Doctor OPD Desk & EMR',
  'OPD Cashier & Dynamic UPI',
  'WhatsApp Digital Rx (Free Pass)',
  'Doctor OPD Rosters (Max 5 Doctors)'
];

export const PRO_HOSPITAL_FEATURES = [
  'Multi-Department HIS & Closed Loop',
  'Inpatient ADT & Bed Management (50+ Beds)',
  'Emergency & Trauma Care (ER Code Blue)',
  'Operation Theatres (OT Rostering & PAC)',
  'TPA Cashless Claims & IRDAI NHCX Bridge',
  'Blood Bank & Component Cross-Match',
  'Doctor OPD Desk & EMR',
  'Pathology Laboratory LIMS & Thermal Barcode',
  'Radiology Web DICOM PACS Viewer',
  'Hospital Inpatient Pharmacy POS',
  'Consolidated IPD Billing Ledger',
  'Executive Command Center & KPI Analytics',
  'NABH Quality & Infection Control (HAI)'
];

/**
 * Modules strictly locked under the Free Hospital OPD Tier.
 * Clicking any of these modules in Free mode displays a PRO badge and triggers the Upgrade Showcase.
 */
export const LOCKED_HOSPITAL_MODULES_FOR_FREE_TIER: readonly string[] = [
  'inpatient-management',
  'operation-theatre-management',
  'emergency-trauma',
  'insurance-claims',
  'blood-bank-transfusion',
  'radiology-imaging',
  'executive-command-center',
  'quality-incident-infection-control',
  'dietary-kitchen-management',
  'medical-records',
  'procurement-supply-chain',
  'asset-biomedical-maintenance'
];

/**
 * Checks if a given hospital account is on the Free tier.
 */
export function isHospitalFreeTier(planTier?: string): boolean {
  if (!planTier) return true; // Default to Free for unassigned hospital
  const norm = planTier.trim().toUpperCase();
  if (norm.includes('COMPLETE') || norm.includes('ENTERPRISE') || norm.includes('PRO') || norm.includes('GROWTH') || norm.includes('FOUNDING')) {
    return false;
  }
  return norm.includes('FREE') || norm.includes('FOUNDATION') || norm.includes('OPD') || norm.includes('STARTER');
}

/**
 * Checks if a specific module is soft-locked for a Free Hospital account.
 */
export function isHospitalModuleLocked(moduleKey: string, planTier?: string): boolean {
  if (!isHospitalFreeTier(planTier)) {
    return false; // Paid tier has zero locks
  }
  return LOCKED_HOSPITAL_MODULES_FOR_FREE_TIER.includes(moduleKey);
}

/**
 * Canonical server-side Partner Profile -> Allowed Commercial Modules Matrix (POST-REM-CAP-03).
 * Used by commercial-guard.ts to enforce strict profile-level module boundaries even if a
 * tenant license has manual overrides in metadata.includedModules.
 */
export const PARTNER_PROFILE_ALLOWED_MODULES: Readonly<Record<string, readonly string[]>> = {
  PATHOLOGY: [
    'OPERATIONS',
    'PATHOLOGY',
    'PATHOLOGY_LIMS',
    'LAB',
    'BILLING',
    'TPA_INSURANCE',
    'STAFF',
    'PATIENTS',
    'APPOINTMENTS',
    'ABDM',
    'WHATSAPP'
  ],
  DIAGNOSTIC_LAB: [
    'OPERATIONS',
    'PATHOLOGY',
    'PATHOLOGY_LIMS',
    'LAB',
    'BILLING',
    'TPA_INSURANCE',
    'STAFF',
    'PATIENTS',
    'APPOINTMENTS',
    'ABDM',
    'WHATSAPP'
  ],
  PHARMACY: [
    'OPERATIONS',
    'PHARMACY',
    'PHARMACY_POS',
    'BILLING',
    'TPA_INSURANCE',
    'STAFF',
    'PATIENTS',
    'WHATSAPP'
  ],
  PHARMACY_WHOLESALE: [
    'OPERATIONS',
    'PHARMACY',
    'PHARMACY_WHOLESALE',
    'BILLING',
    'TPA_INSURANCE',
    'STAFF',
    'PATIENTS',
    'WHATSAPP'
  ],
  CLINIC: [
    'OPERATIONS',
    'CLINICAL_EMR',
    'CLINICAL',
    'OPD',
    'OPD_QUEUE',
    'BILLING',
    'TPA_INSURANCE',
    'STAFF',
    'PATIENTS',
    'APPOINTMENTS',
    'ABDM',
    'WHATSAPP',
    'AI_COPILOT',
    'MODULE_AI_COPILOT'
  ],
  CLINIC_OPD: [
    'OPERATIONS',
    'CLINICAL_EMR',
    'CLINICAL',
    'OPD',
    'OPD_QUEUE',
    'BILLING',
    'TPA_INSURANCE',
    'STAFF',
    'PATIENTS',
    'APPOINTMENTS',
    'ABDM',
    'WHATSAPP',
    'AI_COPILOT',
    'MODULE_AI_COPILOT'
  ],
  COMBO_CLINIC_PATHOLOGY: [
    'OPERATIONS',
    'CLINICAL_EMR',
    'CLINICAL',
    'OPD',
    'OPD_QUEUE',
    'PATHOLOGY',
    'PATHOLOGY_LIMS',
    'LAB',
    'BILLING',
    'TPA_INSURANCE',
    'STAFF',
    'PATIENTS',
    'APPOINTMENTS',
    'ABDM',
    'WHATSAPP',
    'AI_COPILOT',
    'MODULE_AI_COPILOT'
  ],
  COMBO_CLINIC_PHARMACY: [
    'OPERATIONS',
    'CLINICAL_EMR',
    'CLINICAL',
    'OPD',
    'OPD_QUEUE',
    'PHARMACY',
    'PHARMACY_POS',
    'BILLING',
    'TPA_INSURANCE',
    'STAFF',
    'PATIENTS',
    'APPOINTMENTS',
    'ABDM',
    'WHATSAPP',
    'AI_COPILOT',
    'MODULE_AI_COPILOT'
  ],
  DIAGNOSTIC_CENTRE: [
    'OPERATIONS',
    'RADIOLOGY',
    'RADIOLOGY_PACS',
    'PATHOLOGY',
    'PATHOLOGY_LIMS',
    'LAB',
    'BILLING',
    'TPA_INSURANCE',
    'STAFF',
    'PATIENTS',
    'APPOINTMENTS',
    'ABDM',
    'WHATSAPP'
  ],
  RADIOLOGY: [
    'OPERATIONS',
    'RADIOLOGY',
    'RADIOLOGY_PACS',
    'PATHOLOGY',
    'PATHOLOGY_LIMS',
    'LAB',
    'BILLING',
    'TPA_INSURANCE',
    'STAFF',
    'PATIENTS',
    'APPOINTMENTS',
    'ABDM',
    'WHATSAPP'
  ],
  HOSPITAL: [
    'OPERATIONS',
    'CLINICAL_EMR',
    'CLINICAL',
    'OPD',
    'OPD_QUEUE',
    'INPATIENT',
    'INPATIENT_IPD',
    'EMERGENCY',
    'EMERGENCY_ICU',
    'OT',
    'OT_SURGERY',
    'PATHOLOGY',
    'PATHOLOGY_LIMS',
    'LAB',
    'RADIOLOGY',
    'RADIOLOGY_PACS',
    'PHARMACY',
    'PHARMACY_POS',
    'PHARMACY_WHOLESALE',
    'BILLING',
    'TPA_INSURANCE',
    'BLOOD_BANK',
    'MRD',
    'DIETARY',
    'STAFF',
    'PATIENTS',
    'APPOINTMENTS',
    'ABDM',
    'WHATSAPP',
    'AI_COPILOT',
    'MODULE_AI_COPILOT',
    'EXECUTIVE_COMMAND'
  ],
  ENTERPRISE_COMMAND: [
    'OPERATIONS',
    'CLINICAL_EMR',
    'CLINICAL',
    'OPD',
    'OPD_QUEUE',
    'INPATIENT',
    'INPATIENT_IPD',
    'EMERGENCY',
    'EMERGENCY_ICU',
    'OT',
    'OT_SURGERY',
    'PATHOLOGY',
    'PATHOLOGY_LIMS',
    'LAB',
    'RADIOLOGY',
    'RADIOLOGY_PACS',
    'PHARMACY',
    'PHARMACY_POS',
    'PHARMACY_WHOLESALE',
    'BILLING',
    'TPA_INSURANCE',
    'BLOOD_BANK',
    'MRD',
    'DIETARY',
    'STAFF',
    'PATIENTS',
    'APPOINTMENTS',
    'ABDM',
    'WHATSAPP',
    'AI_COPILOT',
    'MODULE_AI_COPILOT',
    'EXECUTIVE_COMMAND'
  ],
  RESTRICTED: []
};

export function isModuleAllowedForPartnerProfile(rawPartnerType: string | null | undefined, moduleCode: string): boolean {
  if (!rawPartnerType || typeof rawPartnerType !== 'string') {
    return false;
  }
  const cleanedKey = rawPartnerType.toUpperCase().trim().replace(/[\s-]+/g, '_');
  const normMod = String(moduleCode || '').toUpperCase().trim();
  if (!normMod) return false;

  let allowed: readonly string[] = [];
  if (Object.prototype.hasOwnProperty.call(PARTNER_PROFILE_ALLOWED_MODULES, cleanedKey)) {
    allowed = PARTNER_PROFILE_ALLOWED_MODULES[cleanedKey] || [];
  } else {
    const profile = normalizeFacilityProfile(cleanedKey);
    if (profile.isRestricted || profile.workspace === 'RESTRICTED') {
      return false;
    }
    allowed = PARTNER_PROFILE_ALLOWED_MODULES[profile.workspace] || [];
  }

  if (allowed.includes(normMod)) return true;

  // Map granular sub-feature codes to their canonical parent module boundary
  if (normMod.startsWith('PHARMACY_WHOLESALE')) {
    return allowed.includes('PHARMACY_WHOLESALE');
  }
  if (normMod.startsWith('PHARMACY_')) {
    return allowed.includes('PHARMACY_POS');
  }
  if (normMod.startsWith('LAB_') || normMod.startsWith('PATHOLOGY_')) {
    return allowed.includes('PATHOLOGY_LIMS') || allowed.includes('PATHOLOGY') || allowed.includes('LAB');
  }
  if (normMod.startsWith('RADIOLOGY_')) {
    return allowed.includes('RADIOLOGY_PACS') || allowed.includes('RADIOLOGY');
  }
  if (normMod.startsWith('INPATIENT_')) {
    return allowed.includes('INPATIENT_IPD') || allowed.includes('INPATIENT');
  }
  if (normMod.startsWith('CLINICAL_') || normMod.startsWith('OPD_')) {
    return allowed.includes('CLINICAL_EMR') || allowed.includes('CLINICAL') || allowed.includes('OPD');
  }
  if (normMod.startsWith('BILLING_') || normMod.startsWith('INSURANCE_')) {
    return allowed.includes('BILLING') || allowed.includes('TPA_INSURANCE');
  }
  if (normMod.startsWith('ABDM')) {
    return allowed.includes('ABDM') || allowed.includes('ABDM_GATEWAY');
  }
  if (normMod.startsWith('WHATSAPP')) {
    return allowed.includes('WHATSAPP') || allowed.includes('WHATSAPP_AUTOMATION');
  }

  return false;
}
