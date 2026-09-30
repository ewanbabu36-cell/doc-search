import { AppError, ErrorCode } from '@docsearch/shared-core';
import type { SessionContext } from '@docsearch/auth';

export interface TrainingQueryInput {
  workflowCode: string;
  queryText?: string;
  targetModule?: string;
}

export interface TrainingGuidanceResponse {
  workflowCode: string;
  workflowTitle: string;
  prefixLabel: string;
  isImplemented: boolean;
  requiredRole: string[];
  requiredPermissions: string[];
  prerequisites: string[];
  steps: Array<{
    stepNumber: number;
    title: string;
    instructions: string;
    targetComponent: string;
    deterministicValidations: string[];
  }>;
  safetyCautions: string[];
}

interface WorkflowDefinition {
  code: string;
  title: string;
  module: string;
  allowedRoles: string[];
  requiredPermissions: string[];
  prerequisites: string[];
  steps: Array<{
    stepNumber: number;
    title: string;
    instructions: string;
    targetComponent: string;
    deterministicValidations: string[];
  }>;
  safetyCautions: string[];
}

const REGISTERED_WORKFLOWS: Record<string, WorkflowDefinition> = {
  PATIENT_REGISTRATION: {
    code: 'PATIENT_REGISTRATION',
    title: 'Patient Demographic & UHID Registration',
    module: 'FRONT_DESK',
    allowedRoles: ['FRONT_DESK', 'RECEPTIONIST', 'NURSE', 'DOCTOR', 'PARTNER_ADMIN', 'SUPER_ADMIN'],
    requiredPermissions: ['patient:create', 'reception:write'],
    prerequisites: ['Active branch workstation session', 'Patient government identity or contact number'],
    steps: [
      {
        stepNumber: 1,
        title: 'Open Patient Registration Form',
        instructions: 'Click the "New Patient" button on the Top Workspace Bar or Front Desk Dashboard.',
        targetComponent: 'PatientRegistrationModal / FullPageRegistrationView',
        deterministicValidations: ['Phone number validation (+91 standard)', 'First name & gender mandatory']
      },
      {
        stepNumber: 2,
        title: 'Input Demographics & Address',
        instructions: 'Enter patient full name, age/DOB, gender, mobile number, and address details.',
        targetComponent: 'DemographicsInputSection',
        deterministicValidations: ['Age > 0 and <= 130', 'Valid pin code check']
      },
      {
        stepNumber: 3,
        title: 'Generate UHID & Print Token',
        instructions: 'Click "Save & Generate UHID". System issues immutable UHID and prints barcode sticker.',
        targetComponent: 'UhidTokenActionPanel',
        deterministicValidations: ['Cryptographic UHID uniqueness check in PostgreSQL', 'Audit trail logged']
      }
    ],
    safetyCautions: ['Never overwrite an existing patient without verifying identity to prevent duplicate UHIDs.']
  },

  OPD_CONSULTATION: {
    code: 'OPD_CONSULTATION',
    title: 'Outpatient Doctor Consultation & Clinical Note',
    module: 'CLINICAL',
    allowedRoles: ['DOCTOR', 'PHYSICIAN', 'ATTENDING_PHYSICIAN', 'SURGEON', 'CARDIOLOGY_HOD', 'SUPER_ADMIN'],
    requiredPermissions: ['clinical:write', 'ai_copilot:soap:generate'],
    prerequisites: ['Active patient token in OPD Queue', 'Patient vitals recorded by nursing staff'],
    steps: [
      {
        stepNumber: 1,
        title: 'Call Patient from Queue',
        instructions: 'In SoloDoctorOpdCockpit or Consultation Desk, click "Call Next" or select patient from active queue.',
        targetComponent: 'SoloDoctorOpdCockpitView / ActiveQueueList',
        deterministicValidations: ['Encounter status changes to IN_CONSULTATION', 'Timer initiates']
      },
      {
        stepNumber: 2,
        title: 'Review Patient 360 & Record Symptoms',
        instructions: 'Review longitudinal medical history. Enter chief complaints or use Ambient AI Scribe dictation.',
        targetComponent: 'ClinicalConsultationDomainManager / AmbientScribeWidget',
        deterministicValidations: ['Patient 360 longitudinal record loaded from PostgreSQL', 'Doctor review required for AI drafts']
      },
      {
        stepNumber: 3,
        title: 'Issue Prescription & Investigation Orders',
        instructions: 'Add medications with dosage, frequency, and duration. Order required lab tests or radiology.',
        targetComponent: 'PrescriptionPad / OrderEntrySection',
        deterministicValidations: ['Drug-drug interaction check evaluated', 'Schedule H1 / X regulatory constraints verified']
      },
      {
        stepNumber: 4,
        title: 'Sign and Finalize Encounter',
        instructions: 'Review prescription summary, click "Sign & Complete". Prescriptions route to Pharmacy & Lab.',
        targetComponent: 'ConsultationSignOffButton',
        deterministicValidations: ['Doctor digital signature stamped', 'Immutable audit hash generated']
      }
    ],
    safetyCautions: ['Always verify critical drug allergies before signing electronic prescriptions.']
  },

  LAB_SAMPLE_COLLECTION: {
    code: 'LAB_SAMPLE_COLLECTION',
    title: 'LIMS Specimen Collection & Barcode Accessioning',
    module: 'PATHOLOGY',
    allowedRoles: ['LAB_TECHNICIAN', 'PHLEBOTOMIST', 'PATHOLOGIST', 'PARTNER_ADMIN', 'SUPER_ADMIN'],
    requiredPermissions: ['lab:accession', 'lab:write'],
    prerequisites: ['Active investigation order generated by clinician or billing', 'Vacutainer/swab supplies ready'],
    steps: [
      {
        stepNumber: 1,
        title: 'Scan Order Barcode',
        instructions: 'Scan order barcode or search by patient UHID in the LIMS Workstation.',
        targetComponent: 'LabDiagnosticsWorklist / BarcodeScannerListener',
        deterministicValidations: ['Order status must be ORDERED or PAID', 'Specimen requirements verified']
      },
      {
        stepNumber: 2,
        title: 'Collect Specimen & Print Barcode',
        instructions: 'Collect specimen per standard phlebotomy guidelines. Affix printed barcode on vial.',
        targetComponent: 'SampleAccessionDialog',
        deterministicValidations: ['Barcode accession ID unique constraint', 'Collection timestamp recorded']
      },
      {
        stepNumber: 3,
        title: 'Dispatch to Analyzer / Bench',
        instructions: 'Mark sample as "COLLECTED" and transfer to pathology bench or bidirectional analyzer rack.',
        targetComponent: 'LimsSpecimenDispatchBoard',
        deterministicValidations: ['Chain of custody transfer event logged', 'Sample status transition to IN_TRANSIT']
      }
    ],
    safetyCautions: ['Verify two patient identifiers (Name & DOB/UHID) before venipuncture.']
  },

  PHARMACY_DISPENSING: {
    code: 'PHARMACY_DISPENSING',
    title: 'Pharmacy Retail Dispensing & Batch Deduction',
    module: 'PHARMACY',
    allowedRoles: ['PHARMACIST', 'CHIEF_PHARMACIST', 'PARTNER_ADMIN', 'SUPER_ADMIN'],
    requiredPermissions: ['pharmacy:dispense', 'pharmacy:write'],
    prerequisites: ['Active prescription or OTC request', 'Adequate batch stock in pharmacy store'],
    steps: [
      {
        stepNumber: 1,
        title: 'Load Prescription in POS',
        instructions: 'Enter Prescription Code or Patient UHID in Pharmacy POS workstation.',
        targetComponent: 'PharmacyDomainManager / PrescriptionSelector',
        deterministicValidations: ['Prescription verified against attending doctor', 'Not previously dispensed']
      },
      {
        stepNumber: 2,
        title: 'Select Batches via FEFO',
        instructions: 'System automatically suggests batches by First-Expiry-First-Out (FEFO). Scan medication strips.',
        targetComponent: 'BatchSelectionGrid / HardwareBarcodeListener',
        deterministicValidations: ['Expired batches hard-blocked', 'Stock balance checked atomically in PostgreSQL']
      },
      {
        stepNumber: 3,
        title: 'Dispense & Settle Payment',
        instructions: 'Confirm quantities, select payment method (Cash/Card/UPI), and click "Dispense & Print Bill".',
        targetComponent: 'PharmacyCheckoutButton',
        deterministicValidations: ['Atomic stock ledger deduction', 'Invoice generated with SAC/HSN codes']
      }
    ],
    safetyCautions: ['Never dispense Schedule X drugs without hardcopy physical prescription retention per CDSCO rules.']
  },

  INPATIENT_BED_ADMISSION: {
    code: 'INPATIENT_BED_ADMISSION',
    title: 'Inpatient (IPD) Admission & Bed Allocation',
    module: 'INPATIENT_ADT',
    allowedRoles: ['ADMISSION_DESK', 'NURSE', 'DOCTOR', 'PARTNER_ADMIN', 'SUPER_ADMIN'],
    requiredPermissions: ['inpatient:admit', 'adt:write'],
    prerequisites: ['Doctor admission advice order', 'Available bed in target ward'],
    steps: [
      {
        stepNumber: 1,
        title: 'Select Admission Order',
        instructions: 'Open Inpatient ADT Console and search patient UHID with active admission advice.',
        targetComponent: 'InpatientAdtConsole / AdmissionAdviceQueue',
        deterministicValidations: ['Admission advice verified', 'Patient not currently admitted in another bed']
      },
      {
        stepNumber: 2,
        title: 'Select Ward & Available Bed',
        instructions: 'Review interactive bed matrix and select available bed with green indicator.',
        targetComponent: 'SmartHospitalIotBedOrchestrationView / BedMatrix',
        deterministicValidations: ['Bed status must be VACANT_CLEANED', 'Bed reservation lock engaged']
      },
      {
        stepNumber: 3,
        title: 'Confirm Admission & Notify Ward',
        instructions: 'Assign attending consultant, enter emergency contact, and click "Admit Patient".',
        targetComponent: 'ConfirmAdmissionButton',
        deterministicValidations: ['Encounter status updated to ADMITTED', 'Ward nursing station notified via event bus']
      }
    ],
    safetyCautions: ['Confirm patient infection isolation requirements prior to general ward allocation.']
  },

  BILLING_INVOICE_GENERATION: {
    code: 'BILLING_INVOICE_GENERATION',
    title: 'Billing Invoice Settlement & Receipting',
    module: 'BILLING',
    allowedRoles: ['BILLING_CLERK', 'CASHIER', 'ACCOUNTANT', 'PARTNER_ADMIN', 'SUPER_ADMIN'],
    requiredPermissions: ['billing:create', 'billing:write'],
    prerequisites: ['Unbilled services, orders, or consultations for patient encounter'],
    steps: [
      {
        stepNumber: 1,
        title: 'Aggregate Encounter Unbilled Line Items',
        instructions: 'Open Billing Desk, search UHID or encounter ID to pull all unbilled orders.',
        targetComponent: 'BillingManagementView / UnbilledItemsTable',
        deterministicValidations: ['Line item prices pulled from active approved Tariff rate list', 'No duplicate billing']
      },
      {
        stepNumber: 2,
        title: 'Apply Approved Discount or TPA Co-Pay',
        instructions: 'If applicable, select authorized discount category with mandatory reason remarks.',
        targetComponent: 'DiscountAuthorizationPanel',
        deterministicValidations: ['Discounts > 10% require partner admin dual authorization', 'GST calculated correctly']
      },
      {
        stepNumber: 3,
        title: 'Collect Payment & Print Receipt',
        instructions: 'Record payment breakdown (Cash, Card, UPI, TPA Credit) and finalize invoice.',
        targetComponent: 'FinalizeInvoiceButton',
        deterministicValidations: ['Payment total matches invoice amount', 'EOD Galla ledger updated']
      }
    ],
    safetyCautions: ['Refunds require supervisor maker-checker approval; cashier cannot self-approve refunds.']
  },

  SHIFT_HANDOVER: {
    code: 'SHIFT_HANDOVER',
    title: 'Clinical Shift Handover & SBAR Sign-Off',
    module: 'CLINICAL_OPERATIONS',
    allowedRoles: ['NURSE', 'DOCTOR', 'ATTENDING_PHYSICIAN', 'PARTNER_ADMIN', 'SUPER_ADMIN'],
    requiredPermissions: ['clinical:read', 'clinical:write'],
    prerequisites: ['Active ward or ICU shift ending'],
    steps: [
      {
        stepNumber: 1,
        title: 'Review SBAR Shift Summary',
        instructions: 'Open Shift Handover View. Review Situation, Background, Assessment, and Recommendation.',
        targetComponent: 'ShiftHandoverSignOffView / SbarSummaryCard',
        deterministicValidations: ['All admitted patients accounted for', 'Pending stat orders flagged']
      },
      {
        stepNumber: 2,
        title: 'Dual Clinician Verification',
        instructions: 'Outgoing and incoming staff jointly review high-risk patients and ventilator settings.',
        targetComponent: 'DualClinicianSignOffSection',
        deterministicValidations: ['Both incoming and outgoing user credentials verified', 'Digital sign-off captured']
      }
    ],
    safetyCautions: ['Verbally confirm critical lab results and NPO status for scheduled surgical patients.']
  }
};

export class EwannameStaffTrainerService {
  /**
   * Generates role-verified, context-aware operational guidance.
   */
  async getGuidance(session: SessionContext, input: TrainingQueryInput): Promise<TrainingGuidanceResponse> {
    const code = (input.workflowCode || '').toUpperCase().trim();
    const workflow = REGISTERED_WORKFLOWS[code];

    // 1. Check if the requested feature exists in DOC SEARCH
    if (!workflow) {
      throw new AppError({
        message: `FEATURE NOT IMPLEMENTED: The requested workflow "${input.workflowCode}" does not exist in DOC SEARCH. Ewanname AI trainer strictly guides real, implemented platform features.`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    // 2. Role & Permission Verification Gate (Fail-Closed)
    if (!session.isSuperAdmin) {
      const userRoles = session.roles || [];
      const userPermissions = session.permissions || [];

      const hasRole = userRoles.some((r) => workflow.allowedRoles.includes(r));
      const hasPerm = workflow.requiredPermissions.some((p) => userPermissions.includes(p));

      if (!hasRole && !hasPerm) {
        throw new AppError({
          message: `Access denied: Your assigned role (${userRoles.join(', ') || 'NONE'}) does not have permission to execute the "${workflow.title}" workflow. Required roles: ${workflow.allowedRoles.join(', ')}.`,
          code: ErrorCode.FORBIDDEN,
          statusCode: 403
        });
      }
    }

    // 3. Return exact step-by-step guidance
    return {
      workflowCode: workflow.code,
      workflowTitle: workflow.title,
      prefixLabel: 'AI OPERATIONAL GUIDANCE — EWANNAME TRAINER',
      isImplemented: true,
      requiredRole: workflow.allowedRoles,
      requiredPermissions: workflow.requiredPermissions,
      prerequisites: workflow.prerequisites,
      steps: workflow.steps,
      safetyCautions: workflow.safetyCautions
    };
  }

  /**
   * Lists all implemented workflows available for training.
   */
  async listAvailableWorkflows() {
    return Object.values(REGISTERED_WORKFLOWS).map((w) => ({
      code: w.code,
      title: w.title,
      module: w.module,
      allowedRoles: w.allowedRoles
    }));
  }
}

export const ewannameStaffTrainerService = new EwannameStaffTrainerService();
