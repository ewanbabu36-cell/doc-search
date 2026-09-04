import type { SessionContext } from '@docsearch/auth';

export type PlatformRole =
  | 'OWNER'
  | 'MANAGER'
  | 'DOCTOR'
  | 'NURSE'
  | 'RECEPTION'
  | 'PHARMACY'
  | 'LAB'
  | 'FINANCE'
  | 'PATIENT';

export type RoleDataScope = 'ORGANIZATION' | 'BRANCH' | 'PATIENT_OWN';

export interface RoleDefinition {
  role: PlatformRole;
  systemRoles: string[];
  dataScope: RoleDataScope;
  permittedCapabilities: string[];
  permittedTools: string[];
  humanApprovalRequired: boolean;
  auditRequired: boolean;
}

export const ROLE_DEFINITIONS: Record<PlatformRole, RoleDefinition> = {
  OWNER: {
    role: 'OWNER',
    systemRoles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'OWNER', 'HOSPITAL_OWNER'],
    dataScope: 'ORGANIZATION',
    permittedCapabilities: ['OWNER_REVENUE_INTELLIGENCE', 'OWNER_ORGANIZATION_ANALYTICS'],
    permittedTools: ['get_owner_revenue_summary'],
    humanApprovalRequired: false,
    auditRequired: true
  },
  MANAGER: {
    role: 'MANAGER',
    systemRoles: ['HOSPITAL_ADMIN', 'CLINIC_ADMIN', 'BRANCH_MANAGER', 'OPERATIONS_MANAGER'],
    dataScope: 'BRANCH',
    permittedCapabilities: ['MANAGER_OPERATIONAL_OVERVIEW', 'MANAGER_INVENTORY_ALERTS'],
    permittedTools: ['get_manager_operations_summary'],
    humanApprovalRequired: false,
    auditRequired: true
  },
  DOCTOR: {
    role: 'DOCTOR',
    systemRoles: [
      'DOCTOR',
      'PHYSICIAN',
      'ATTENDING_PHYSICIAN',
      'CONSULTANT',
      'CARDIOLOGIST',
      'CARDIOLOGY_HOD',
      'SURGEON'
    ],
    dataScope: 'BRANCH',
    permittedCapabilities: [
      'DOCTOR_ENCOUNTER_SUMMARY',
      'DOCTOR_CLINICAL_DOCUMENTATION',
      'CLINICAL_AMBIENT_SCRIBE',
      'DRUG_INTERACTION_CDSS',
      'SEPSIS_EARLY_WARNING_CDSS'
    ],
    permittedTools: [
      'get_patient_clinical_history',
      'get_clinical_transcript',
      'lookup_drug_interactions',
      'get_patient_vitals'
    ],
    humanApprovalRequired: true,
    auditRequired: true
  },
  NURSE: {
    role: 'NURSE',
    systemRoles: ['NURSE', 'STAFF_NURSE', 'HEAD_NURSE', 'ICU_NURSE', 'ICU_INTENSIVIST'],
    dataScope: 'BRANCH',
    permittedCapabilities: ['NURSE_PATIENT_PREPARATION', 'SEPSIS_EARLY_WARNING_CDSS'],
    permittedTools: ['get_nurse_care_checklist', 'get_patient_vitals'],
    humanApprovalRequired: true,
    auditRequired: true
  },
  RECEPTION: {
    role: 'RECEPTION',
    systemRoles: ['RECEPTIONIST', 'FRONT_DESK', 'REGISTRATION_CLERK'],
    dataScope: 'BRANCH',
    permittedCapabilities: [
      'RECEPTION_APPOINTMENT_ASSISTANCE',
      'RECEPTION_PATIENT_REGISTRATION'
    ],
    permittedTools: ['get_reception_queue_schedule'],
    humanApprovalRequired: false,
    auditRequired: true
  },
  PHARMACY: {
    role: 'PHARMACY',
    systemRoles: ['PHARMACIST', 'PHARMACY_MANAGER', 'DISPENSER'],
    dataScope: 'BRANCH',
    permittedCapabilities: [
      'PHARMACY_PRESCRIPTION_ASSISTANCE',
      'PHARMACY_INVENTORY_ALERTS',
      'DRUG_INTERACTION_CDSS'
    ],
    permittedTools: ['get_pharmacy_inventory_status', 'lookup_drug_interactions'],
    humanApprovalRequired: false,
    auditRequired: true
  },
  LAB: {
    role: 'LAB',
    systemRoles: ['LAB_TECHNICIAN', 'PATHOLOGIST', 'BIOCHEMIST', 'LAB_MANAGER'],
    dataScope: 'BRANCH',
    permittedCapabilities: ['LAB_SAMPLE_WORKFLOW', 'DIAGNOSTIC_PANIC_ALERT'],
    permittedTools: ['get_lab_pending_orders', 'lookup_critical_lab_values'],
    humanApprovalRequired: true,
    auditRequired: true
  },
  FINANCE: {
    role: 'FINANCE',
    systemRoles: ['FINANCE_MANAGER', 'BILLING_CLERK', 'ACCOUNTANT', 'FINANCE_CONTROLLER'],
    dataScope: 'ORGANIZATION',
    permittedCapabilities: ['FINANCE_BILLING_ANALYTICS'],
    permittedTools: ['get_finance_outstanding_invoices'],
    humanApprovalRequired: false,
    auditRequired: true
  },
  PATIENT: {
    role: 'PATIENT',
    systemRoles: ['PATIENT', 'PATIENT_PORTAL_USER'],
    dataScope: 'PATIENT_OWN',
    permittedCapabilities: ['PATIENT_VISIT_GUIDANCE'],
    permittedTools: ['get_patient_personal_appointments'],
    humanApprovalRequired: false,
    auditRequired: true
  }
};

export interface ResolvedRoleContext {
  role: PlatformRole;
  dataScope: RoleDataScope;
  permittedCapabilities: string[];
  permittedTools: string[];
  humanApprovalRequired: boolean;
  auditRequired: boolean;
  patientMrn?: string | undefined;
}

/**
 * Resolves normalized server-side role context from authenticated SessionContext.
 * Deterministic mapping, never trusted from client arguments.
 */
export function resolveRoleContext(session: SessionContext): ResolvedRoleContext {
  const roles = session.roles || [];

  // Super admin inherits OWNER role with complete administrative visibility
  if (session.isSuperAdmin || roles.includes('SUPER_ADMIN') || roles.includes('COMPANY_ADMIN')) {
    const def = ROLE_DEFINITIONS.OWNER;
    return {
      role: def.role,
      dataScope: def.dataScope,
      permittedCapabilities: def.permittedCapabilities,
      permittedTools: def.permittedTools,
      humanApprovalRequired: def.humanApprovalRequired,
      auditRequired: def.auditRequired
    };
  }

  // Priority order matching
  for (const key of Object.keys(ROLE_DEFINITIONS) as PlatformRole[]) {
    const def = ROLE_DEFINITIONS[key];
    if (def && roles.some((r) => def.systemRoles.includes(r))) {
      return {
        role: def.role,
        dataScope: def.dataScope,
        permittedCapabilities: def.permittedCapabilities,
        permittedTools: def.permittedTools,
        humanApprovalRequired: def.humanApprovalRequired,
        auditRequired: def.auditRequired,
        patientMrn: def.role === 'PATIENT' ? session.userId : undefined
      };
    }
  }

  // Default fallback for general hospital staff if not explicitly matched
  const fallback = ROLE_DEFINITIONS.RECEPTION;
  return {
    role: fallback.role,
    dataScope: fallback.dataScope,
    permittedCapabilities: fallback.permittedCapabilities,
    permittedTools: fallback.permittedTools,
    humanApprovalRequired: fallback.humanApprovalRequired,
    auditRequired: fallback.auditRequired
  };
}
