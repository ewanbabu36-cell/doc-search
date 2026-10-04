import type { PartnerModuleKey } from '../components/PartnerPlatformShell.js';
import type { StaffPermissions } from '../types/partner-staff-rbac.js';
import { getRoleTemplate } from './partnerRoleTemplates.js';

export const PARTNER_ROLE_MODULE_PERMISSIONS: Record<string, PartnerModuleKey[] | ['*']> = {
  // 1. Hospital Directors & Executive Leadership
  SUPER_ADMIN: ['*'],
  HOSPITAL_DIRECTOR: ['*'],
  HOSPITAL_ADMIN: ['*'],
  ORGANIZATION_ADMIN: ['*'],
  FOUNDER: ['*'],
  OWNER: ['*'],
  ADMINISTRATOR: ['*'],
  EXECUTIVE_ADMIN: ['*'],
  CENTRE_MANAGER: ['*'],
  PHARMACY_DIRECTOR: ['*'],
  CLINICAL_DIRECTOR: [
    'executive-command-center',
    'ai-chat-assistant',
    'doctor-management',
    'clinical-consultation',
    'inpatient-management',
    'operation-theatre-management',
    'emergency-trauma',
    'medical-records',
    'blood-bank-transfusion',
    'clinical-investigation',
    'radiology-imaging',
    'quality-incident-infection-control',
    'ai-clinical-cdss',
    'telemedicine-rpm',
    'staff-administration'
  ],
  HEAD_OF_DEPARTMENT: [
    'executive-command-center',
    'ai-chat-assistant',
    'doctor-management',
    'clinical-consultation',
    'inpatient-management',
    'operation-theatre-management',
    'emergency-trauma',
    'medical-records',
    'blood-bank-transfusion',
    'clinical-investigation',
    'radiology-imaging',
    'quality-incident-infection-control',
    'ai-clinical-cdss',
    'telemedicine-rpm'
  ],
  CHIEF_MEDICAL_OFFICER: [
    'executive-command-center',
    'ai-chat-assistant',
    'doctor-management',
    'clinical-consultation',
    'inpatient-management',
    'operation-theatre-management',
    'emergency-trauma',
    'medical-records',
    'blood-bank-transfusion',
    'clinical-investigation',
    'radiology-imaging',
    'quality-incident-infection-control',
    'ai-clinical-cdss',
    'telemedicine-rpm',
    'staff-administration'
  ],

  // 2. Surgical & Specialists
  SURGEON: [
    'operation-theatre-management',
    'clinical-consultation',
    'inpatient-management',
    'clinical-investigation',
    'radiology-imaging',
    'blood-bank-transfusion',
    'ai-clinical-cdss',
    'ai-chat-assistant',
    'telemedicine-rpm',
    'whatsapp-patient-portal',
    'encounters-visits'
  ],
  DOCTOR: [
    'clinical-consultation',
    'encounters-visits',
    'inpatient-management',
    'clinical-investigation',
    'radiology-imaging',
    'ai-clinical-cdss',
    'ai-chat-assistant',
    'telemedicine-rpm',
    'whatsapp-patient-portal',
    'opd-one-flow-express',
    'help-desk-exit-hub'
  ],
  ATTENDING_DOCTOR: [
    'clinical-consultation',
    'encounters-visits',
    'inpatient-management',
    'clinical-investigation',
    'radiology-imaging',
    'ai-clinical-cdss',
    'ai-chat-assistant',
    'telemedicine-rpm',
    'whatsapp-patient-portal'
  ],
  CONSULTANT_PHYSICIAN: [
    'clinical-consultation',
    'encounters-visits',
    'inpatient-management',
    'clinical-investigation',
    'radiology-imaging',
    'ai-clinical-cdss',
    'ai-chat-assistant',
    'telemedicine-rpm',
    'whatsapp-patient-portal'
  ],
  CARDIOLOGIST: [
    'clinical-consultation',
    'encounters-visits',
    'inpatient-management',
    'clinical-investigation',
    'radiology-imaging',
    'ai-clinical-cdss',
    'ai-chat-assistant',
    'telemedicine-rpm',
    'whatsapp-patient-portal'
  ],
  PEDIATRICIAN: [
    'clinical-consultation',
    'encounters-visits',
    'inpatient-management',
    'clinical-investigation',
    'ai-clinical-cdss',
    'ai-chat-assistant',
    'telemedicine-rpm',
    'whatsapp-patient-portal'
  ],
  GYNECOLOGIST: [
    'clinical-consultation',
    'encounters-visits',
    'inpatient-management',
    'clinical-investigation',
    'radiology-imaging',
    'ai-clinical-cdss',
    'ai-chat-assistant',
    'telemedicine-rpm',
    'whatsapp-patient-portal'
  ],
  ORTHOPEDIC_SURGEON: [
    'clinical-consultation',
    'encounters-visits',
    'operation-theatre-management',
    'inpatient-management',
    'clinical-investigation',
    'radiology-imaging',
    'ai-clinical-cdss',
    'ai-chat-assistant',
    'telemedicine-rpm',
    'whatsapp-patient-portal'
  ],
  NEPHROLOGIST: [
    'clinical-consultation',
    'inpatient-management',
    'clinical-investigation',
    'ai-clinical-cdss',
    'ai-chat-assistant',
    'telemedicine-rpm'
  ],
  ONCOLOGIST: [
    'clinical-consultation',
    'inpatient-management',
    'clinical-investigation',
    'radiology-imaging',
    'ai-clinical-cdss',
    'ai-chat-assistant',
    'telemedicine-rpm'
  ],
  NEUROLOGIST: [
    'clinical-consultation',
    'inpatient-management',
    'radiology-imaging',
    'ai-clinical-cdss',
    'ai-chat-assistant',
    'telemedicine-rpm'
  ],
  OPHTHALMOLOGIST: [
    'clinical-consultation',
    'operation-theatre-management',
    'encounters-visits',
    'patient-registration',
    'ai-clinical-cdss',
    'ai-chat-assistant',
    'telemedicine-rpm'
  ],
  DENTIST: [
    'clinical-consultation',
    'encounters-visits',
    'patient-registration',
    'radiology-imaging',
    'ai-clinical-cdss',
    'ai-chat-assistant'
  ],
  AYURVEDIC_VAIDYA: [
    'clinical-consultation',
    'encounters-visits',
    'patient-registration',
    'pharmacy-medication',
    'ai-clinical-cdss',
    'ai-chat-assistant'
  ],
  PULMONOLOGIST: [
    'clinical-consultation',
    'inpatient-management',
    'radiology-imaging',
    'ai-clinical-cdss',
    'ai-chat-assistant',
    'telemedicine-rpm'
  ],
  PSYCHIATRIST: [
    'clinical-consultation',
    'inpatient-management',
    'encounters-visits',
    'patient-registration',
    'ai-clinical-cdss',
    'ai-chat-assistant',
    'telemedicine-rpm'
  ],
  DERMATOLOGIST: [
    'clinical-consultation',
    'encounters-visits',
    'patient-registration',
    'ai-clinical-cdss',
    'ai-chat-assistant',
    'telemedicine-rpm'
  ],
  CLINIC_DOCTOR: [
    'clinic-home',
    'clinical-consultation',
    'opd-one-flow-express',
    'pharmacy-medication',
    'billing-revenue-cycle',
    'encounters-visits',
    'patient-registration',
    'nurse-triage-station',
    'doctor-management',
    'staff-administration',
    'ai-clinical-cdss',
    'ai-chat-assistant',
    'telemedicine-rpm',
    'abdm-fhir-gateway',
    'whatsapp-patient-portal',
    'my-smart-desk'
  ],
  CLINIC_FRONT_DESK: [
    'clinic-home',
    'patient-registration',
    'encounters-visits',
    'doctor-management',
    'billing-revenue-cycle',
    'abdm-fhir-gateway',
    'whatsapp-patient-portal',
    'my-smart-desk'
  ],
  CLINIC_NURSE: [
    'clinic-home',
    'nurse-triage-station',
    'patient-registration',
    'encounters-visits',
    'my-smart-desk'
  ],
  CLINIC_ACCOUNTANT: [
    'clinic-home',
    'billing-revenue-cycle',
    'patient-registration',
    'my-smart-desk'
  ],

  // 3. Emergency Care
  EMERGENCY_PHYSICIAN: [
    'emergency-trauma',
    'inpatient-management',
    'nurse-triage-station',
    'encounters-visits',
    'clinical-consultation',
    'patient-registration',
    'ai-chat-assistant'
  ],
  EMERGENCY_PARAMEDIC: [
    'emergency-trauma',
    'nurse-triage-station',
    'encounters-visits',
    'patient-registration',
    'ai-chat-assistant'
  ],

  // 4. Nursing
  NURSE: [
    'nurse-triage-station',
    'inpatient-management',
    'emergency-trauma',
    'encounters-visits',
    'blood-bank-transfusion',
    'dietary-kitchen-management',
    'ai-chat-assistant'
  ],
  STAFF_NURSE: [
    'nurse-triage-station',
    'inpatient-management',
    'emergency-trauma',
    'encounters-visits',
    'blood-bank-transfusion',
    'dietary-kitchen-management',
    'ai-chat-assistant'
  ],
  CHARGE_NURSE: [
    'nurse-triage-station',
    'inpatient-management',
    'emergency-trauma',
    'encounters-visits',
    'blood-bank-transfusion',
    'dietary-kitchen-management',
    'ai-chat-assistant'
  ],
  ICU_NURSE: [
    'nurse-triage-station',
    'inpatient-management',
    'emergency-trauma',
    'encounters-visits',
    'blood-bank-transfusion',
    'dietary-kitchen-management',
    'ai-chat-assistant'
  ],
  TRIAGE_NURSE: [
    'nurse-triage-station',
    'emergency-trauma',
    'encounters-visits',
    'inpatient-management',
    'ai-chat-assistant'
  ],
  OT_SCRUB_NURSE: [
    'operation-theatre-management',
    'inpatient-management',
    'encounters-visits',
    'ai-chat-assistant'
  ],
  DIALYSIS_TECHNICIAN: [
    'clinical-consultation',
    'inpatient-management',
    'patient-registration',
    'encounters-visits'
  ],
  PHYSIOTHERAPIST: [
    'clinical-consultation',
    'inpatient-management',
    'patient-registration',
    'encounters-visits'
  ],
  DIETITIAN_NUTRITIONIST: [
    'dietary-kitchen-management',
    'inpatient-management',
    'patient-registration'
  ],

  // 5. Diagnostics, LIMS & Imaging
  LAB_DIRECTOR: [
    'pathology-home',
    'patient-registration',
    'clinical-investigation',
    'billing-revenue-cycle',
    'blood-bank-transfusion',
    'whatsapp-patient-portal',
    'abdm-fhir-gateway',
    'ai-chat-assistant',
    'staff-administration',
    'organization-foundation',
    'doctor-management',
    'offers-rewards-hub',
    'account-plan-features',
    'my-smart-desk'
  ],
  SENIOR_LAB_TECH: [
    'pathology-home',
    'patient-registration',
    'clinical-investigation',
    'billing-revenue-cycle',
    'blood-bank-transfusion',
    'whatsapp-patient-portal'
  ],
  PATHOLOGIST: [
    'pathology-home',
    'patient-registration',
    'clinical-investigation',
    'billing-revenue-cycle',
    'blood-bank-transfusion',
    'whatsapp-patient-portal',
    'abdm-fhir-gateway',
    'ai-chat-assistant',
    'staff-administration',
    'organization-foundation',
    'doctor-management',
    'offers-rewards-hub',
    'account-plan-features',
    'my-smart-desk'
  ],
  LAB_TECHNICIAN: [
    'pathology-home',
    'patient-registration',
    'clinical-investigation',
    'whatsapp-patient-portal'
  ],
  PHLEBOTOMIST: [
    'pathology-home',
    'patient-registration',
    'clinical-investigation'
  ],
  RADIOLOGIST: [
    'diagnostic-home',
    'patient-registration',
    'radiology-imaging',
    'encounters-visits',
    'clinical-investigation',
    'billing-revenue-cycle',
    'insurance-claims',
    'whatsapp-patient-portal',
    'abdm-fhir-gateway',
    'ai-chat-assistant',
    'staff-administration',
    'organization-foundation',
    'doctor-management',
    'offers-rewards-hub',
    'account-plan-features',
    'my-smart-desk'
  ],
  RADIOGRAPHER_CT_MRI: [
    'radiology-imaging',
    'encounters-visits',
    'patient-registration'
  ],
  BLOOD_BANK_OFFICER: [
    'blood-bank-transfusion',
    'patient-registration',
    'clinical-investigation'
  ],

  // 6. Pharmacy POS & Medication
  CHIEF_PHARMACIST: [
    'pharmacy-home',
    'pharmacy-medication',
    'procurement-supply-chain',
    'patient-registration',
    'billing-revenue-cycle',
    'whatsapp-patient-portal',
    'staff-administration',
    'organization-foundation',
    'offers-rewards-hub',
    'account-plan-features',
    'my-smart-desk'
  ],
  DISPENSING_PHARMACIST: [
    'pharmacy-home',
    'pharmacy-medication',
    'procurement-supply-chain',
    'whatsapp-patient-portal'
  ],
  PHARMACIST: [
    'pharmacy-home',
    'pharmacy-medication',
    'procurement-supply-chain',
    'patient-registration',
    'billing-revenue-cycle',
    'whatsapp-patient-portal',
    'staff-administration',
    'organization-foundation',
    'offers-rewards-hub',
    'account-plan-features',
    'my-smart-desk'
  ],
  JAN_AUSHADHI_OPERATOR: [
    'pharmacy-medication',
    'procurement-supply-chain',
    'whatsapp-patient-portal'
  ],

  // 7. Revenue, Registration, Insurance & Records
  BILLING_MANAGER: [
    'billing-revenue-cycle',
    'insurance-claims',
    'patient-registration',
    'whatsapp-patient-portal',
    'staff-administration'
  ],
  BILLING_OFFICER: [
    'billing-revenue-cycle',
    'insurance-claims',
    'whatsapp-patient-portal'
  ],
  CASHIER_BILLING_OFFICER: [
    'billing-revenue-cycle',
    'insurance-claims',
    'whatsapp-patient-portal'
  ],
  CASHIER_POS: [
    'billing-revenue-cycle',
    'insurance-claims',
    'whatsapp-patient-portal'
  ],
  TPA_OFFICER: [
    'insurance-claims',
    'billing-revenue-cycle',
    'patient-registration'
  ],
  MRD_OFFICER: [
    'medical-records',
    'patient-registration'
  ],
  RECEPTIONIST: [
    'clinic-home',
    'hospital-home',
    'patient-registration',
    'encounters-visits',
    'billing-revenue-cycle',
    'doctor-management',
    'abdm-fhir-gateway',
    'whatsapp-patient-portal',
    'my-smart-desk'
  ],
  FRONT_DESK: [
    'clinic-home',
    'hospital-home',
    'patient-registration',
    'encounters-visits',
    'billing-revenue-cycle',
    'doctor-management',
    'abdm-fhir-gateway',
    'whatsapp-patient-portal',
    'my-smart-desk'
  ],
  FRONT_DESK_EXECUTIVE: [
    'clinic-home',
    'hospital-home',
    'patient-registration',
    'encounters-visits',
    'billing-revenue-cycle',
    'doctor-management',
    'abdm-fhir-gateway',
    'whatsapp-patient-portal',
    'my-smart-desk'
  ],
  FRONT_DESK_LEAD: [
    'clinic-home',
    'hospital-home',
    'patient-registration',
    'encounters-visits',
    'billing-revenue-cycle',
    'doctor-management',
    'abdm-fhir-gateway',
    'whatsapp-patient-portal',
    'my-smart-desk'
  ],
  FRONT_DESK_RECEPTIONIST: [
    'clinic-home',
    'hospital-home',
    'patient-registration',
    'encounters-visits',
    'billing-revenue-cycle',
    'doctor-management',
    'abdm-fhir-gateway',
    'whatsapp-patient-portal',
    'my-smart-desk'
  ],
  LAB_RECEPTIONIST: [
    'pathology-home',
    'diagnostic-home',
    'patient-registration',
    'clinical-investigation',
    'billing-revenue-cycle',
    'whatsapp-patient-portal',
    'my-smart-desk'
  ],

  // 8. Hospital Engineering, Quality & Supply
  BIOMEDICAL_ENGINEER: [
    'asset-biomedical-maintenance',
    'ai-chat-assistant'
  ],
  NABH_QUALITY_MANAGER: [
    'quality-incident-infection-control',
    'organization-foundation',
    'medical-records',
    'ai-chat-assistant'
  ],
  INFECTION_CONTROL_OFFICER: [
    'quality-incident-infection-control',
    'organization-foundation',
    'ai-chat-assistant'
  ],
  PROCUREMENT_SUPPLY_MANAGER: [
    'procurement-supply-chain',
    'asset-biomedical-maintenance'
  ],

  // 9. Cross-Platform Headquarters Roles
  PRODUCT_MANAGER: ['*'],
  FINANCE_ADMIN: [
    'billing-revenue-cycle',
    'insurance-claims',
    'procurement-supply-chain'
  ],
  GROWTH_SALES: [
    'patient-registration',
    'whatsapp-patient-portal',
    'clinical-consultation'
  ],
  SECURITY_CISO: [
    'organization-foundation',
    'staff-administration',
    'quality-incident-infection-control'
  ],
  COMPLIANCE_OFFICER: [
    'quality-incident-infection-control',
    'medical-records',
    'abdm-fhir-gateway'
  ],
  CUSTOMER_SUCCESS: [
    'whatsapp-patient-portal',
    'encounters-visits',
    'patient-registration'
  ],
  DEVOPS_ENGINEER: [
    'asset-biomedical-maintenance',
    'abdm-fhir-gateway'
  ]
};

function normalizeRoleKey(role?: string): string {
  if (!role) return '';
  return role.trim().toUpperCase().replace(/[\s-]+/g, '_');
}

export function isPartnerModuleAllowed(
  moduleKey: PartnerModuleKey,
  role?: string,
  userPermissions?: StaffPermissions
): boolean {
  if (!role) return false;
  if (moduleKey === 'offers-rewards-hub' || moduleKey === 'account-plan-features' || moduleKey === 'my-smart-desk') {
    return true;
  }

  // 1. Dynamic Tier 4 RBAC: If staff has explicitly configured accessibleModules, evaluate against it
  if (userPermissions?.accessibleModules && userPermissions.accessibleModules.length > 0) {
    if (userPermissions.accessibleModules.includes(moduleKey)) return true;

    // Home overview mappings for custom module permissions
    if (moduleKey === 'pathology-home') {
      return userPermissions.accessibleModules.includes('clinical-investigation');
    }
    if (moduleKey === 'clinic-home') {
      return (
        userPermissions.accessibleModules.includes('clinical-consultation') ||
        userPermissions.accessibleModules.includes('patient-registration') ||
        userPermissions.accessibleModules.includes('nurse-triage-station')
      );
    }
    if (moduleKey === 'pharmacy-home') {
      return userPermissions.accessibleModules.includes('pharmacy-medication');
    }
    if (moduleKey === 'diagnostic-home') {
      return (
        userPermissions.accessibleModules.includes('radiology-imaging') ||
        userPermissions.accessibleModules.includes('clinical-investigation')
      );
    }
    if (moduleKey === 'hospital-home') {
      return (
        userPermissions.accessibleModules.includes('inpatient-management') ||
        userPermissions.accessibleModules.includes('emergency-trauma') ||
        userPermissions.accessibleModules.includes('clinical-consultation')
      );
    }
    if (moduleKey === 'enterprise-home') {
      return userPermissions.accessibleModules.includes('executive-command-center');
    }

    // If accessibleModules is explicitly configured and does not match, reject
    return false;
  }

  // 2. Fallback to Role Template Defaults
  if (moduleKey === 'pathology-home') {
    return isPartnerModuleAllowed('clinical-investigation', role);
  }
  if (moduleKey === 'clinic-home') {
    return isPartnerModuleAllowed('clinical-consultation', role) || isPartnerModuleAllowed('patient-registration', role);
  }
  if (moduleKey === 'pharmacy-home') {
    return isPartnerModuleAllowed('pharmacy-medication', role);
  }
  if (moduleKey === 'diagnostic-home') {
    return isPartnerModuleAllowed('radiology-imaging', role) || isPartnerModuleAllowed('clinical-investigation', role);
  }
  if (moduleKey === 'hospital-home') {
    return isPartnerModuleAllowed('inpatient-management', role) || isPartnerModuleAllowed('emergency-trauma', role) || isPartnerModuleAllowed('clinical-consultation', role);
  }
  if (moduleKey === 'hospital-closed-loop') {
    return isPartnerModuleAllowed('hospital-home', role) || isPartnerModuleAllowed('clinical-consultation', role);
  }
  if (moduleKey === 'enterprise-home') {
    return isPartnerModuleAllowed('executive-command-center', role);
  }
  if (moduleKey === 'staff-administration') {
    const norm = normalizeRoleKey(role);
    const authorizedAdminRoles = [
      'SUPER_ADMIN',
      'HOSPITAL_ADMIN',
      'HOSPITAL_DIRECTOR',
      'CLINICAL_DIRECTOR',
      'LAB_DIRECTOR',
      'PHARMACY_DIRECTOR',
      'CHIEF_MEDICAL_OFFICER',
      'FOUNDER',
      'OWNER',
      'EXECUTIVE_ADMIN',
      'ADMINISTRATOR',
      'CENTRE_MANAGER',
      'CLINIC_DOCTOR',
      'CLINIC_OWNER',
      'CLINIC_ADMIN'
    ];
    if (
      authorizedAdminRoles.includes(norm) ||
      norm.endsWith('_ADMIN') ||
      norm.endsWith('_DIRECTOR') ||
      norm.endsWith('_OWNER') ||
      norm === 'CLINIC_DOCTOR' ||
      norm === 'CLINIC_OWNER'
    ) {
      return true;
    }
    // Check if explicitly configured in role permissions map
    const explicitPerms = PARTNER_ROLE_MODULE_PERMISSIONS[norm] || PARTNER_ROLE_MODULE_PERMISSIONS[role];
    if (explicitPerms) {
      const perms = explicitPerms as string[];
      return perms.includes('*') || perms.includes('staff-administration');
    }
    return false;
  }
  const normalized = normalizeRoleKey(role);
  const permissions = PARTNER_ROLE_MODULE_PERMISSIONS[normalized] || PARTNER_ROLE_MODULE_PERMISSIONS[role];
  if (permissions) {
    const perms = permissions as string[];
    if (perms.includes('*')) {
      return true;
    }
    return perms.includes(moduleKey);
  }
  const tpl = getRoleTemplate(role);
  if (tpl) {
    const perms = tpl.allowedModules as string[];
    if (perms.includes('*')) {
      return true;
    }
    return perms.includes(moduleKey);
  }
  // Default fallback: allow basic patient registration/consultation if role not mapped
  return ['patient-registration', 'clinical-consultation'].includes(moduleKey);
}

export function getAllowedModulesForRole(role?: string): PartnerModuleKey[] {
  if (!role) return [];
  const normalized = normalizeRoleKey(role);
  const permissions = PARTNER_ROLE_MODULE_PERMISSIONS[normalized] || PARTNER_ROLE_MODULE_PERMISSIONS[role];
  if (permissions) {
    const perms = permissions as string[];
    if (perms.includes('*')) {
      return [
        'pathology-home',
        'clinic-home',
        'pharmacy-home',
        'diagnostic-home',
        'hospital-home',
        'enterprise-home',
        'executive-command-center',
        'ai-chat-assistant',
        'organization-foundation',
        'staff-administration',
        'doctor-management',
        'patient-registration',
        'encounters-visits',
        'clinical-consultation',
        'clinical-investigation',
        'pharmacy-medication',
        'inpatient-management',
        'operation-theatre-management',
        'emergency-trauma',
        'medical-records',
        'blood-bank-transfusion',
        'radiology-imaging',
        'dietary-kitchen-management',
        'asset-biomedical-maintenance',
        'quality-incident-infection-control',
        'abdm-fhir-gateway',
        'ai-clinical-cdss',
        'telemedicine-rpm',
        'whatsapp-patient-portal',
        'billing-revenue-cycle',
        'insurance-claims',
        'procurement-supply-chain'
      ];
    }
    return permissions as PartnerModuleKey[];
  }
  const tpl = getRoleTemplate(role);
  if (tpl) {
    if ((tpl.allowedModules as any[]).includes('*')) {
      return [
        'pathology-home',
        'clinic-home',
        'pharmacy-home',
        'diagnostic-home',
        'hospital-home',
        'enterprise-home',
        'executive-command-center',
        'ai-chat-assistant',
        'organization-foundation',
        'staff-administration',
        'doctor-management',
        'patient-registration',
        'encounters-visits',
        'clinical-consultation',
        'clinical-investigation',
        'pharmacy-medication',
        'inpatient-management',
        'operation-theatre-management',
        'emergency-trauma',
        'medical-records',
        'blood-bank-transfusion',
        'radiology-imaging',
        'dietary-kitchen-management',
        'asset-biomedical-maintenance',
        'quality-incident-infection-control',
        'abdm-fhir-gateway',
        'ai-clinical-cdss',
        'telemedicine-rpm',
        'whatsapp-patient-portal',
        'billing-revenue-cycle',
        'insurance-claims',
        'procurement-supply-chain'
      ];
    }
    return tpl.allowedModules as PartnerModuleKey[];
  }
  return ['patient-registration', 'clinical-consultation'];
}

/**
 * Role Isolation Persona Gate: Checks if the user has Executive / Multi-Desk clearance.
 * Only Hospital Directors, Chief Medical Officers, Administrators, and Founders
 * are permitted to switch between clinical, nursing, pharmacy, and diagnostic desks.
 * Operational staff (Doctors, Nurses, Pharmacists, Cashiers) are strictly locked to their single station.
 */
export function isHospitalExecutive(userRole?: string): boolean {
  if (!userRole && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('docsearch_partner_staff_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        userRole = parsed.role;
      }
    } catch {
      // ignore
    }
  }
  if (!userRole) return false;
  const upper = userRole.toUpperCase();
  const execRoles = new Set([
    'SUPER_ADMIN',
    'HOSPITAL_ADMIN',
    'HOSPITAL_DIRECTOR',
    'FOUNDER',
    'OWNER',
    'EXECUTIVE_ADMIN',
    'ADMINISTRATOR',
    'CHIEF_MEDICAL_OFFICER',
    'CLINICAL_DIRECTOR',
    'CENTRE_MANAGER'
  ]);
  return execRoles.has(upper) || upper === '*' || upper.includes('ADMIN') || upper.includes('DIRECTOR') || upper.includes('FOUNDER') || upper.includes('OWNER');
}

/**
 * Returns the default locked desk perspective for a hospital staff role.
 */
export function getRoleDefaultPerspective(userRole?: string): 'DOCTOR' | 'NURSE' | 'PHARMACY' | 'LAB' | 'BILLING' | 'FRONT_DESK' | 'AUTO' {
  if (!userRole) return 'DOCTOR';
  if (isHospitalExecutive(userRole)) return 'AUTO';
  const upper = userRole.toUpperCase();
  if (upper.includes('FRONT') || upper.includes('RECEPT') || upper.includes('TOKEN') || upper.includes('CLERK') || upper.includes('INTAKE')) return 'FRONT_DESK';
  if (upper.includes('NURSE')) return 'NURSE';
  if (upper.includes('PHARMAC') || upper.includes('AUSHADHI')) return 'PHARMACY';
  if (upper.includes('LAB') || upper.includes('PATHO') || upper.includes('RADIO') || upper.includes('PHLEBOTOM')) return 'LAB';
  if (upper.includes('BILL') || upper.includes('CASH') || upper.includes('ACCOUNTS') || upper.includes('FINANCE')) return 'BILLING';
  return 'DOCTOR';
}

/**
 * Destructive Action Authorization Guard: Soft Deletion, Module Reset, Branch Termination.
 * Prevents junior staff without administrative authority from executing destructive data actions.
 */
export function isDestructiveActionAllowed(userRole?: string): boolean {
  if (!userRole && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('docsearch_partner_staff_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        userRole = parsed.role;
      }
    } catch {
      // ignore
    }
  }
  if (!userRole) return false;
  const upper = userRole.toUpperCase();
  const allowedRoles = new Set([
    'SUPER_ADMIN',
    'HOSPITAL_ADMIN',
    'HOSPITAL_DIRECTOR',
    'FOUNDER',
    'OWNER',
    'EXECUTIVE_ADMIN',
    'ADMINISTRATOR',
    'CHIEF_MEDICAL_OFFICER',
    'CLINICAL_DIRECTOR',
    'PHARMACY_DIRECTOR',
    'LAB_DIRECTOR',
    'CENTRE_MANAGER',
    'CLINIC_DOCTOR',
    'CLINIC_OWNER'
  ]);
  return allowedRoles.has(upper) || upper === '*' || upper.includes('ADMIN') || upper.includes('DIRECTOR') || upper.includes('OWNER') || upper.includes('CLINIC_DOCTOR');
}

/**
 * Theft Protection Guard: Financial Bill Cancellation & Credit Note Authorization.
 * Restricts cancelling invoices, issuing credit notes, or voiding financial drafts
 * to prevent cash skimming at the billing counter.
 */
export function isBillCancellationAllowed(userRole?: string): boolean {
  if (isDestructiveActionAllowed(userRole)) return true;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('docsearch_partner_staff_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.permissions?.canCancelOrRefundBills === true) return true;
        if (isDestructiveActionAllowed(parsed?.role)) return true;
      }
    } catch {}
  }
  return false;
}

/**
 * Theft Protection Guard: Arbitrary Billing Discount Authorization.
 * Prevents unauthorized cashiers from applying discretionary discounts without supervisor approval.
 */
export function isDiscountAllowed(userRole?: string): boolean {
  if (isDestructiveActionAllowed(userRole)) return true;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('docsearch_partner_staff_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.permissions?.canGiveDiscounts === true) return true;
        if (isDestructiveActionAllowed(parsed?.role)) return true;
      }
    } catch {}
  }
  return false;
}

/**
 * Theft Protection Guard: Anti-Poaching Patient Contact Masking.
 * Masks 10-digit patient mobile numbers unless the user is a Doctor, Clinic Owner,
 * Administrator, or explicitly granted `canViewFullPhoneNumber: true`.
 */
export function isFullPhoneViewAllowed(userRole?: string): boolean {
  if (isDestructiveActionAllowed(userRole)) return true;
  const upper = (userRole || '').toUpperCase();
  if (upper.includes('DOCTOR') || upper.includes('PHYSICIAN') || upper.includes('CLINICIAN')) return true;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('docsearch_partner_staff_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.permissions?.canViewFullPhoneNumber === true) return true;
        if (isDestructiveActionAllowed(parsed?.role)) return true;
        const parsedRole = (parsed?.role || '').toUpperCase();
        if (parsedRole.includes('DOCTOR') || parsedRole.includes('PHYSICIAN') || parsedRole.includes('CLINICIAN')) return true;
      }
    } catch {}
  }
  return false;
}

/**
 * Authoritative list of licensed medical clinician roles permitted to use clinical diagnosis and prescribing tools.
 */
export const CLINICIAN_ROLES = [
  'DOCTOR',
  'CLINIC_DOCTOR',
  'ATTENDING_PHYSICIAN',
  'ATTENDING_DOCTOR',
  'PHYSICIAN',
  'CONSULTANT',
  'CONSULTANT_PHYSICIAN',
  'SURGEON',
  'CARDIOLOGIST',
  'CARDIOLOGY_HOD',
  'PEDIATRICIAN',
  'GYNECOLOGIST',
  'ORTHOPEDIC_SURGEON',
  'NEPHROLOGIST',
  'ONCOLOGIST',
  'NEUROLOGIST',
  'OPHTHALMOLOGIST',
  'DENTIST',
  'AYURVEDIC_VAIDYA',
  'PULMONOLOGIST',
  'PSYCHIATRIST',
  'DERMATOLOGIST',
  'EMERGENCY_PHYSICIAN',
  'CHIEF_MEDICAL_OFFICER',
  'CLINICAL_DIRECTOR',
  'HOSPITAL_DIRECTOR',
  'SUPER_ADMIN'
];

/**
 * Checks whether a given role is an authorized medical clinician.
 */
export function isClinicianRole(userRole?: string): boolean {
  if (!userRole) return false;
  const norm = normalizeRoleKey(userRole);
  if (norm === 'SUPER_ADMIN' || norm === 'HOSPITAL_DIRECTOR' || norm === 'CLINICAL_DIRECTOR') return true;
  if (CLINICIAN_ROLES.includes(norm)) return true;
  return norm.includes('DOCTOR') || norm.includes('PHYSICIAN') || norm.includes('SURGEON');
}

/**
 * Strict Role-Based Access Guard for Ambient AI Clinical Voice Scribe.
 * Only practicing medical doctors, surgeons, specialists, and hospital clinical executives
 * are permitted to activate or use the AI Voice Scribe capsule.
 * Non-clinical roles (Pharmacist, Lab Tech, Pathologist, Nurse, Front Desk, Cashier) are strictly prohibited.
 */
export function isVoiceScribeAllowed(userRole?: string, userPermissions?: StaffPermissions): boolean {
  if (!userRole) return false;
  const norm = normalizeRoleKey(userRole);
  if (norm === 'SUPER_ADMIN') return true;

  // Strict blacklist: operational non-prescribing roles
  const nonClinicianRoles = [
    'PATHOLOGIST',
    'LAB_DIRECTOR',
    'SENIOR_LAB_TECH',
    'LAB_TECHNICIAN',
    'PHLEBOTOMIST',
    'RADIOLOGY_TECHNICIAN',
    'CHIEF_PHARMACIST',
    'DISPENSING_PHARMACIST',
    'PHARMACIST',
    'JAN_AUSHADHI_OPERATOR',
    'RECEPTIONIST',
    'FRONT_DESK',
    'HELP_DESK',
    'BILLING_MANAGER',
    'BILLING_OFFICER',
    'CASHIER_BILLING_OFFICER',
    'CASHIER_POS',
    'TPA_OFFICER',
    'MRD_OFFICER',
    'NURSE',
    'STAFF_NURSE',
    'CHARGE_NURSE',
    'ICU_NURSE',
    'TRIAGE_NURSE',
    'OT_SCRUB_NURSE',
    'DIALYSIS_TECHNICIAN',
    'PHYSIOTHERAPIST',
    'DIETITIAN_NUTRITIONIST',
    'ACCOUNTANT',
    'SECURITY',
    'DRIVER',
    'STORE_MANAGER',
    'PURCHASE_OFFICER'
  ];

  if (nonClinicianRoles.includes(norm)) {
    return false;
  }

  // Must be a recognized clinician or have ai-clinical-cdss module permission
  if (isClinicianRole(userRole)) return true;
  return isPartnerModuleAllowed('ai-clinical-cdss', userRole, userPermissions);
}

/**
 * Authoritative Partner Profile Capability Matrix (Workstream 1 & 2).
 * Intersects facility/partner profile capabilities with staff role permissions so a profile
 * never exposes unentitled modules (e.g., Pathology never exposes Inpatient/OT/Pharmacy POS;
 * Pharmacy never exposes Clinical Consultation/Lab/Radiology).
 */
export const PARTNER_PROFILE_ALLOWED_MODULES: Record<string, PartnerModuleKey[]> = {
  PATHOLOGY: [
    'pathology-home',
    'clinical-investigation',
    'patient-registration',
    'billing-revenue-cycle',
    'staff-administration',
    'quality-incident-infection-control',
    'organization-foundation',
    'account-plan-features',
    'offers-rewards-hub',
    'my-smart-desk'
  ],
  PHARMACY: [
    'pharmacy-home',
    'pharmacy-medication',
    'billing-revenue-cycle',
    'procurement-supply-chain',
    'staff-administration',
    'quality-incident-infection-control',
    'organization-foundation',
    'account-plan-features',
    'offers-rewards-hub',
    'my-smart-desk'
  ],
  DIAGNOSTIC_CENTRE: [
    'diagnostic-home',
    'radiology-imaging',
    'clinical-investigation',
    'patient-registration',
    'billing-revenue-cycle',
    'staff-administration',
    'quality-incident-infection-control',
    'organization-foundation',
    'account-plan-features',
    'offers-rewards-hub',
    'my-smart-desk'
  ],
  CLINIC: [
    'clinic-home',
    'clinical-consultation',
    'encounters-visits',
    'patient-registration',
    'nurse-triage-station',
    'doctor-management',
    'billing-revenue-cycle',
    'pharmacy-medication',
    'clinical-investigation',
    'radiology-imaging',
    'ai-clinical-cdss',
    'ai-chat-assistant',
    'telemedicine-rpm',
    'abdm-fhir-gateway',
    'whatsapp-patient-portal',
    'staff-administration',
    'organization-foundation',
    'account-plan-features',
    'offers-rewards-hub',
    'my-smart-desk'
  ],
  HOSPITAL: [
    'hospital-home',
    'enterprise-home',
    'executive-command-center',
    'clinical-consultation',
    'encounters-visits',
    'patient-registration',
    'nurse-triage-station',
    'inpatient-management',
    'operation-theatre-management',
    'emergency-trauma',
    'medical-records',
    'blood-bank-transfusion',
    'clinical-investigation',
    'radiology-imaging',
    'pharmacy-medication',
    'dietary-kitchen-management',
    'asset-biomedical-maintenance',
    'quality-incident-infection-control',
    'abdm-fhir-gateway',
    'ai-clinical-cdss',
    'ai-chat-assistant',
    'telemedicine-rpm',
    'whatsapp-patient-portal',
    'billing-revenue-cycle',
    'insurance-claims',
    'procurement-supply-chain',
    'doctor-management',
    'staff-administration',
    'organization-foundation',
    'account-plan-features',
    'offers-rewards-hub',
    'my-smart-desk'
  ],
  ENTERPRISE_COMMAND: [
    'hospital-home',
    'enterprise-home',
    'executive-command-center',
    'clinical-consultation',
    'encounters-visits',
    'patient-registration',
    'nurse-triage-station',
    'inpatient-management',
    'operation-theatre-management',
    'emergency-trauma',
    'medical-records',
    'blood-bank-transfusion',
    'clinical-investigation',
    'radiology-imaging',
    'pharmacy-medication',
    'dietary-kitchen-management',
    'asset-biomedical-maintenance',
    'quality-incident-infection-control',
    'abdm-fhir-gateway',
    'ai-clinical-cdss',
    'ai-chat-assistant',
    'telemedicine-rpm',
    'whatsapp-patient-portal',
    'billing-revenue-cycle',
    'insurance-claims',
    'procurement-supply-chain',
    'doctor-management',
    'staff-administration',
    'organization-foundation',
    'account-plan-features',
    'offers-rewards-hub',
    'my-smart-desk'
  ],
  RESTRICTED: [
    'account-plan-features',
    'organization-foundation'
  ]
};

export function resolveCanonicalProfileKey(facilityType?: string | null): string {
  if (!facilityType || typeof facilityType !== 'string') return 'RESTRICTED';
  const normFacility = facilityType.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (!normFacility || normFacility === 'UNKNOWN' || normFacility === 'INVALID' || normFacility === 'RESTRICTED') {
    return 'RESTRICTED';
  }
  if (normFacility.includes('PATHOLOGY') || normFacility === 'LABORATORY' || normFacility === 'DIAGNOSTIC_LAB' || normFacility.endsWith('_LAB')) {
    return 'PATHOLOGY';
  }
  if (normFacility.includes('PHARMACY') || normFacility === 'CHEMIST' || normFacility === 'DRUGSTORE' || normFacility === 'DISPENSARY') {
    return 'PHARMACY';
  }
  if (normFacility.includes('DIAGNOSTIC') || normFacility.includes('RADIOLOGY') || normFacility.includes('IMAGING') || normFacility === 'PACS') {
    return 'DIAGNOSTIC_CENTRE';
  }
  if (normFacility.includes('CLINIC') || normFacility.includes('DOCTOR') || normFacility === 'SOLO_PRACTICE' || normFacility === 'INDIVIDUAL_PRACTICE') {
    return 'CLINIC';
  }
  if (normFacility.includes('HOSPITAL') || normFacility === 'NURSING_HOME' || normFacility === 'SURGICAL_CENTER' || normFacility === 'MULTI_SPECIALTY') {
    return 'HOSPITAL';
  }
  if (normFacility === 'ENTERPRISE_COMMAND' || normFacility === 'ENTERPRISE') {
    return 'ENTERPRISE_COMMAND';
  }
  return 'RESTRICTED';
}

export function isWorkspaceAllowedForPartnerProfile(
  targetWorkspace: string,
  facilityType?: string | null,
  allowedWorkspaces?: string[]
): boolean {
  const profileKey = resolveCanonicalProfileKey(facilityType);
  if (profileKey === 'RESTRICTED') return false;

  const profileAllowedWorkspaces: Record<string, string[]> = {
    PATHOLOGY: ['PATHOLOGY'],
    PHARMACY: ['PHARMACY'],
    DIAGNOSTIC_CENTRE: ['DIAGNOSTIC_CENTRE'],
    CLINIC: ['CLINIC'],
    HOSPITAL: ['HOSPITAL', 'CLINIC', 'PHARMACY', 'PATHOLOGY', 'DIAGNOSTIC_CENTRE', 'ENTERPRISE_COMMAND'],
    ENTERPRISE_COMMAND: ['HOSPITAL', 'CLINIC', 'PHARMACY', 'PATHOLOGY', 'DIAGNOSTIC_CENTRE', 'ENTERPRISE_COMMAND']
  };

  const allowedByProfile = profileAllowedWorkspaces[profileKey] || [];
  if (!allowedByProfile.includes(targetWorkspace)) {
    return false;
  }

  if (Array.isArray(allowedWorkspaces) && allowedWorkspaces.length > 0) {
    return allowedWorkspaces.includes(targetWorkspace);
  }

  return true;
}

/**
 * Single authoritative capability intersection for UI visibility (CAP-01):
 * EffectiveAccess = PartnerProfile ∩ OperatingModel ∩ Plan/Entitlement ∩ StaffRole ∩ RolePermission
 * Role wildcard ('*') NEVER overrides PartnerProfile restrictions.
 */
export function isModuleAllowedForPartnerProfile(
  moduleKey: PartnerModuleKey,
  facilityType?: string | null,
  role?: string,
  userPermissions?: StaffPermissions,
  entitledFeatures?: string[]
): boolean {
  const roleAllowed = isPartnerModuleAllowed(moduleKey, role, userPermissions);
  if (!roleAllowed) return false;

  // Always allow account plan & organization foundation self-service for authenticated role holders
  if (moduleKey === 'account-plan-features' || moduleKey === 'organization-foundation') {
    return true;
  }

  const profileKey = resolveCanonicalProfileKey(facilityType);
  const allowedList = PARTNER_PROFILE_ALLOWED_MODULES[profileKey];
  if (!allowedList || !allowedList.includes(moduleKey)) {
    return false;
  }

  // Optional entitlement intersection if explicit entitledFeatures list is provided
  if (Array.isArray(entitledFeatures) && entitledFeatures.length > 0 && !entitledFeatures.includes('*')) {
    const moduleEntitlementMap: Partial<Record<PartnerModuleKey, string[]>> = {
      'inpatient-management': ['IPD_ADT', 'Inpatient ADT', 'Inpatient Bed Matrix', 'Inpatient'],
      'operation-theatre-management': ['OT_SURGERY', 'Operation Theatres', 'OT Surgical'],
      'emergency-trauma': ['EMERGENCY_TRIAGE', 'Emergency', 'Trauma'],
      'radiology-imaging': ['RADIOLOGY_RIS', 'DICOM', 'Radiology', 'PACS']
    };
    const requiredTokens = moduleEntitlementMap[moduleKey];
    if (requiredTokens) {
      const joined = entitledFeatures.join(' ').toUpperCase();
      const hasMatch = requiredTokens.some((token) => joined.includes(token.toUpperCase()));
      if (!hasMatch && profileKey !== 'HOSPITAL' && profileKey !== 'DIAGNOSTIC_CENTRE') {
        return false;
      }
    }
  }

  return true;
}

/**
 * Checks whether a Pharmacy / Hospital tenant is entitled to Wholesale B2B distribution features
 * (Form 20B/21B Wholesale Drug License, B2B Khata Credit Ledger, Bulk Distributor Invoice Ingest).
 */
export function isWholesalePharmacyEntitled(
  facilityType?: string,
  planCode?: string,
  entitledFeatures?: string[]
): boolean {
  const profileKey = resolveCanonicalProfileKey(facilityType);
  if (profileKey !== 'PHARMACY' && profileKey !== 'HOSPITAL' && profileKey !== 'ENTERPRISE_COMMAND') {
    return false;
  }

  const upperFacility = (facilityType || '').toUpperCase();
  if (upperFacility === 'PHARMACY_WHOLESALE' || upperFacility.includes('WHOLESALE')) {
    return true;
  }

  if (Array.isArray(entitledFeatures)) {
    if (
      entitledFeatures.includes('PHARMACY_WHOLESALE') ||
      entitledFeatures.includes('WHOLESALE_DISTRIBUTION')
    ) {
      return true;
    }
  }

  const upperPlan = (planCode || '').toUpperCase();
  if (upperPlan.includes('WHOLESALE')) {
    return true;
  }

  return false;
}


