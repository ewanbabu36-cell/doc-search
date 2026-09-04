import type { AiCapabilityDefinition } from './types.js';

export class AiCapabilityRegistry {
  private capabilities: Map<string, AiCapabilityDefinition> = new Map();

  constructor() {
    this.registerBaselineCapabilities();
  }

  /**
   * Registers all 9 role-scoped approved capabilities according to the frozen architecture baseline.
   */
  private registerBaselineCapabilities(): void {
    const baseline: AiCapabilityDefinition[] = [
      // 1. OWNER AI
      {
        id: 'OWNER_REVENUE_INTELLIGENCE',
        name: 'Owner Revenue Intelligence',
        description: 'Executive-level aggregated revenue run-rate and financial performance indicators',
        category: 'FINANCIAL',
        requiredPermission: 'billing:invoices:read',
        requiredEntitlement: 'MODULE_AI_COPILOT',
        allowedRoles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'OWNER', 'HOSPITAL_OWNER'],
        allowedScope: 'TENANT',
        allowedTools: ['get_owner_revenue_summary'],
        humanApprovalRequired: false,
        auditRequired: true,
        status: 'ACTIVE',
        version: '1.0.0'
      },
      {
        id: 'OWNER_ORGANIZATION_ANALYTICS',
        name: 'Owner Organization Analytics',
        description: 'Cross-facility operational trends and executive summaries',
        category: 'OPERATIONAL',
        requiredPermission: 'partners:read',
        requiredEntitlement: 'MODULE_AI_COPILOT',
        allowedRoles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'OWNER', 'HOSPITAL_OWNER'],
        allowedScope: 'TENANT',
        allowedTools: ['get_owner_revenue_summary'],
        humanApprovalRequired: false,
        auditRequired: true,
        status: 'ACTIVE',
        version: '1.0.0'
      },

      // 2. MANAGER AI
      {
        id: 'MANAGER_OPERATIONAL_OVERVIEW',
        name: 'Manager Operational Overview',
        description: 'Daily department queues, bed occupancy, and facility operational overview',
        category: 'OPERATIONAL',
        requiredPermission: 'clinical:encounters:read',
        requiredEntitlement: 'MODULE_AI_COPILOT',
        allowedRoles: ['HOSPITAL_ADMIN', 'CLINIC_ADMIN', 'BRANCH_MANAGER', 'OPERATIONS_MANAGER', 'SUPER_ADMIN'],
        allowedScope: 'BRANCH',
        allowedTools: ['get_manager_operations_summary'],
        humanApprovalRequired: false,
        auditRequired: true,
        status: 'ACTIVE',
        version: '1.0.0'
      },
      {
        id: 'MANAGER_INVENTORY_ALERTS',
        name: 'Manager Inventory Alerts',
        description: 'Facility stock reorder levels and department supply utilization',
        category: 'OPERATIONAL',
        requiredPermission: 'inventory:read',
        requiredEntitlement: 'MODULE_AI_COPILOT',
        allowedRoles: ['HOSPITAL_ADMIN', 'CLINIC_ADMIN', 'BRANCH_MANAGER', 'OPERATIONS_MANAGER', 'SUPER_ADMIN'],
        allowedScope: 'BRANCH',
        allowedTools: ['get_manager_operations_summary'],
        humanApprovalRequired: false,
        auditRequired: true,
        status: 'ACTIVE',
        version: '1.0.0'
      },

      // 3. DOCTOR AI
      {
        id: 'DOCTOR_ENCOUNTER_SUMMARY',
        name: 'Doctor Patient History Summarization',
        description: 'Synthesizes past consultation notes, medical history, and clinical encounters',
        category: 'CLINICAL',
        requiredPermission: 'clinical:consultations:read',
        requiredEntitlement: 'MODULE_AI_COPILOT',
        allowedRoles: [
          'DOCTOR',
          'PHYSICIAN',
          'ATTENDING_PHYSICIAN',
          'CONSULTANT',
          'CARDIOLOGIST',
          'CARDIOLOGY_HOD',
          'SURGEON',
          'SUPER_ADMIN'
        ],
        allowedScope: 'BRANCH',
        allowedTools: ['get_patient_clinical_history'],
        humanApprovalRequired: false,
        auditRequired: true,
        status: 'ACTIVE',
        version: '1.0.0'
      },
      {
        id: 'DOCTOR_CLINICAL_DOCUMENTATION',
        name: 'Doctor Clinical Documentation Assistant',
        description: 'Assists with drafting consultation notes and patient follow-up care plans',
        category: 'CLINICAL',
        requiredPermission: 'clinical:consultations:create',
        requiredEntitlement: 'MODULE_AI_COPILOT',
        allowedRoles: [
          'DOCTOR',
          'PHYSICIAN',
          'ATTENDING_PHYSICIAN',
          'CONSULTANT',
          'CARDIOLOGIST',
          'CARDIOLOGY_HOD',
          'SURGEON',
          'SUPER_ADMIN'
        ],
        allowedScope: 'BRANCH',
        allowedTools: ['get_patient_clinical_history', 'get_clinical_transcript'],
        humanApprovalRequired: true,
        auditRequired: true,
        status: 'ACTIVE',
        version: '1.0.0'
      },
      {
        id: 'CLINICAL_AMBIENT_SCRIBE',
        name: 'Ambient Clinical Scribe',
        description: 'Transcribes clinical dialogues into structured SOAP notes with ICD-10 suggestions',
        category: 'CLINICAL',
        requiredPermission: 'ai_copilot:soap:generate',
        requiredEntitlement: 'MODULE_AI_COPILOT',
        allowedRoles: [
          'DOCTOR',
          'PHYSICIAN',
          'ATTENDING_PHYSICIAN',
          'CONSULTANT',
          'CARDIOLOGIST',
          'CARDIOLOGY_HOD',
          'SUPER_ADMIN'
        ],
        allowedScope: 'BRANCH',
        allowedTools: ['get_clinical_transcript', 'get_patient_vitals'],
        humanApprovalRequired: true,
        auditRequired: true,
        status: 'ACTIVE',
        version: '1.0.0'
      },
      {
        id: 'DRUG_INTERACTION_CDSS',
        name: 'Drug-Drug Interaction CDSS Guard',
        description: 'Real-time pharmacodynamic check evaluating interactions between active medications and new prescriptions',
        category: 'CLINICAL',
        requiredPermission: 'ai_copilot:ddi:evaluate',
        requiredEntitlement: 'MODULE_AI_COPILOT',
        allowedRoles: [
          'DOCTOR',
          'PHYSICIAN',
          'ATTENDING_PHYSICIAN',
          'PHARMACIST',
          'CARDIOLOGY_HOD',
          'SUPER_ADMIN'
        ],
        allowedScope: 'BRANCH',
        allowedTools: ['lookup_drug_interactions'],
        humanApprovalRequired: false,
        auditRequired: true,
        status: 'ACTIVE',
        version: '1.0.0'
      },

      // 4. NURSE AI
      {
        id: 'NURSE_PATIENT_PREPARATION',
        name: 'Nurse Patient Triage & Preparation',
        description: 'Assists nursing staff with triage vital trends, care checklists, and ward prep',
        category: 'CLINICAL',
        requiredPermission: 'clinical:vitals:read',
        requiredEntitlement: 'MODULE_AI_COPILOT',
        allowedRoles: ['NURSE', 'STAFF_NURSE', 'HEAD_NURSE', 'ICU_NURSE', 'ICU_INTENSIVIST', 'SUPER_ADMIN'],
        allowedScope: 'BRANCH',
        allowedTools: ['get_nurse_care_checklist', 'get_patient_vitals'],
        humanApprovalRequired: false,
        auditRequired: true,
        status: 'ACTIVE',
        version: '1.0.0'
      },
      {
        id: 'SEPSIS_EARLY_WARNING_CDSS',
        name: 'NEWS2 Sepsis Early Warning CDSS',
        description: 'Surveillance engine calculating NEWS2 scores and triggering Sepsis 6 Care Bundles',
        category: 'CLINICAL',
        requiredPermission: 'ai_copilot:sepsis:evaluate',
        requiredEntitlement: 'MODULE_AI_COPILOT',
        allowedRoles: [
          'DOCTOR',
          'PHYSICIAN',
          'ATTENDING_PHYSICIAN',
          'NURSE',
          'ICU_INTENSIVIST',
          'CARDIOLOGY_HOD',
          'SUPER_ADMIN'
        ],
        allowedScope: 'BRANCH',
        allowedTools: ['get_patient_vitals'],
        humanApprovalRequired: true,
        auditRequired: true,
        status: 'ACTIVE',
        version: '1.0.0'
      },

      // 5. RECEPTION AI
      {
        id: 'RECEPTION_APPOINTMENT_ASSISTANCE',
        name: 'Reception Appointment & Queue Navigation',
        description: 'Assists front desk with doctor schedule lookups and slot allocation',
        category: 'OPERATIONAL',
        requiredPermission: 'appointments:read',
        requiredEntitlement: 'MODULE_AI_COPILOT',
        allowedRoles: ['RECEPTIONIST', 'FRONT_DESK', 'REGISTRATION_CLERK', 'SUPER_ADMIN'],
        allowedScope: 'BRANCH',
        allowedTools: ['get_reception_queue_schedule'],
        humanApprovalRequired: false,
        auditRequired: true,
        status: 'ACTIVE',
        version: '1.0.0'
      },
      {
        id: 'RECEPTION_PATIENT_REGISTRATION',
        name: 'Reception Patient Demographic Check-In',
        description: 'Assists with patient registration workflow and intake guidance',
        category: 'OPERATIONAL',
        requiredPermission: 'patients:create',
        requiredEntitlement: 'MODULE_AI_COPILOT',
        allowedRoles: ['RECEPTIONIST', 'FRONT_DESK', 'REGISTRATION_CLERK', 'SUPER_ADMIN'],
        allowedScope: 'BRANCH',
        allowedTools: ['get_reception_queue_schedule'],
        humanApprovalRequired: false,
        auditRequired: true,
        status: 'ACTIVE',
        version: '1.0.0'
      },

      // 6. PHARMACY AI
      {
        id: 'PHARMACY_PRESCRIPTION_ASSISTANCE',
        name: 'Pharmacy Prescription Dispensing Verification',
        description: 'Verifies formulary availability and dispensing guidelines for prescriptions',
        category: 'CLINICAL',
        requiredPermission: 'pharmacy:dispense:read',
        requiredEntitlement: 'MODULE_AI_COPILOT',
        allowedRoles: ['PHARMACIST', 'PHARMACY_MANAGER', 'DISPENSER', 'SUPER_ADMIN'],
        allowedScope: 'BRANCH',
        allowedTools: ['get_pharmacy_inventory_status', 'lookup_drug_interactions'],
        humanApprovalRequired: false,
        auditRequired: true,
        status: 'ACTIVE',
        version: '1.0.0'
      },
      {
        id: 'PHARMACY_INVENTORY_ALERTS',
        name: 'Pharmacy Batch Expiry & Stock Radar',
        description: 'Monitors near-expiry batches and minimum safety stock levels',
        category: 'OPERATIONAL',
        requiredPermission: 'pharmacy:inventory:read',
        requiredEntitlement: 'MODULE_AI_COPILOT',
        allowedRoles: ['PHARMACIST', 'PHARMACY_MANAGER', 'DISPENSER', 'SUPER_ADMIN'],
        allowedScope: 'BRANCH',
        allowedTools: ['get_pharmacy_inventory_status'],
        humanApprovalRequired: false,
        auditRequired: true,
        status: 'ACTIVE',
        version: '1.0.0'
      },

      // 7. LAB AI
      {
        id: 'LAB_SAMPLE_WORKFLOW',
        name: 'Lab Specimen Accessioning & Queue Assistant',
        description: 'Monitors pending laboratory investigation orders and accession workflow',
        category: 'DIAGNOSTIC',
        requiredPermission: 'lab:orders:read',
        requiredEntitlement: 'MODULE_AI_COPILOT',
        allowedRoles: ['LAB_TECHNICIAN', 'PATHOLOGIST', 'BIOCHEMIST', 'LAB_MANAGER', 'SUPER_ADMIN'],
        allowedScope: 'BRANCH',
        allowedTools: ['get_lab_pending_orders'],
        humanApprovalRequired: false,
        auditRequired: true,
        status: 'ACTIVE',
        version: '1.0.0'
      },
      {
        id: 'DIAGNOSTIC_PANIC_ALERT',
        name: 'Critical Diagnostic Panic Value Alert',
        description: 'Broadcasts critical lab and diagnostic panic thresholds to clinical care teams',
        category: 'DIAGNOSTIC',
        requiredPermission: 'ai_copilot:panic:read',
        requiredEntitlement: 'MODULE_AI_COPILOT',
        allowedRoles: [
          'DOCTOR',
          'PHYSICIAN',
          'ATTENDING_PHYSICIAN',
          'LAB_TECHNICIAN',
          'NURSE',
          'CARDIOLOGY_HOD',
          'SUPER_ADMIN'
        ],
        allowedScope: 'BRANCH',
        allowedTools: ['lookup_critical_lab_values'],
        humanApprovalRequired: true,
        auditRequired: true,
        status: 'ACTIVE',
        version: '1.0.0'
      },

      // 8. FINANCE AI
      {
        id: 'FINANCE_BILLING_ANALYTICS',
        name: 'Finance Invoicing & Claim Reconciliation Assistant',
        description: 'Analyzes outstanding patient ledger balances, insurance claims, and collection trends',
        category: 'FINANCIAL',
        requiredPermission: 'billing:invoices:read',
        requiredEntitlement: 'MODULE_AI_COPILOT',
        allowedRoles: ['FINANCE_MANAGER', 'BILLING_CLERK', 'ACCOUNTANT', 'FINANCE_CONTROLLER', 'SUPER_ADMIN'],
        allowedScope: 'TENANT',
        allowedTools: ['get_finance_outstanding_invoices'],
        humanApprovalRequired: false,
        auditRequired: true,
        status: 'ACTIVE',
        version: '1.0.0'
      },

      // 9. PATIENT AI
      {
        id: 'PATIENT_VISIT_GUIDANCE',
        name: 'Patient Appointment Reminders & Visit Guidance',
        description: 'Provides personal appointment schedules and safe clinic visit preparation instructions',
        category: 'OPERATIONAL',
        requiredPermission: 'patient:portal:read',
        requiredEntitlement: 'MODULE_AI_COPILOT',
        allowedRoles: ['PATIENT', 'PATIENT_PORTAL_USER', 'SUPER_ADMIN'],
        allowedScope: 'BRANCH',
        allowedTools: ['get_patient_personal_appointments'],
        humanApprovalRequired: false,
        auditRequired: true,
        status: 'ACTIVE',
        version: '1.0.0'
      }
    ];

    for (const cap of baseline) {
      this.capabilities.set(cap.id, cap);
    }
  }

  public registerCapability(capability: AiCapabilityDefinition): void {
    this.capabilities.set(capability.id, capability);
  }

  public getCapability(id: string): AiCapabilityDefinition | undefined {
    return this.capabilities.get(id);
  }

  public listCapabilities(): AiCapabilityDefinition[] {
    return Array.from(this.capabilities.values());
  }

  public isToolAllowedForCapability(capabilityId: string, toolId: string): boolean {
    const capability = this.getCapability(capabilityId);
    if (!capability || capability.status !== 'ACTIVE') {
      return false;
    }
    return capability.allowedTools.includes(toolId);
  }
}

export const capabilityRegistry = new AiCapabilityRegistry();
