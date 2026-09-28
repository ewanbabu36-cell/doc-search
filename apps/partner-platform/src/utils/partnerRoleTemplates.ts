import type { PartnerModuleKey } from '../components/PartnerPlatformShell.js';
import type { StaffDataScope } from '@docsearch/api-contracts';

export type RoleCategory =
  | 'EXECUTIVE'
  | 'CLINICAL'
  | 'NURSING'
  | 'FRONT_DESK'
  | 'DIAGNOSTICS'
  | 'PHARMACY'
  | 'BILLING'
  | 'QUALITY_FACILITY';

export interface PartnerRoleTemplate {
  id: string;
  roleCode: string;
  templateName: string;
  icon: string;
  category: RoleCategory;
  categoryLabel: string;
  defaultDataScope: StaffDataScope;
  defaultModule: PartnerModuleKey;
  allowedModules: PartnerModuleKey[] | ['*'];
  description: string;
  accessibleFeatures: string[];
  restrictedFeatures: string[];
  defaultReason: string;
  isCustom?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_PARTNER_ROLE_TEMPLATES: PartnerRoleTemplate[] = [
  // ==========================================
  // 1. FRONT DESK & PATIENT REGISTRATION
  // ==========================================
  {
    id: 'TPL-FRONT-DESK-LEAD',
    roleCode: 'FRONT_DESK_LEAD',
    templateName: 'Front Desk Lead & OPD Incharge',
    icon: '🏢',
    category: 'FRONT_DESK',
    categoryLabel: 'Front Desk & Reception',
    defaultDataScope: 'BRANCH',
    defaultModule: 'patient-registration',
    allowedModules: [
      'patient-registration',
      'encounters-visits',
      'doctor-management',
      'abdm-fhir-gateway',
      'whatsapp-patient-portal'
    ],
    description: 'Oversees patient intake, OPD token queue broadcasts, ABDM ABHA counter verification, and doctor OPD roster scheduling.',
    accessibleFeatures: [
      'Walk-in Patient Demographics & Registration',
      'Master Patient Index (MPI) Lookup',
      'ABDM ABHA Creation & KYC Verification (Aadhaar/OTP)',
      'OPD Live Queue Tokens & TV Broadcast Calling',
      'Hospital Doctor OPD Slot Scheduling',
      'WhatsApp Appointment & Token Dispatch'
    ],
    restrictedFeatures: [
      'Clinical Consultation & SOAP Notes',
      'Digital e-Prescriptions',
      'Lab & Radiology Investigation Ordering',
      'Financial Ledger & GST Invoice Edits'
    ],
    defaultReason: 'Assigned as Front Desk Lead to manage OPD patient reception and queue dispatch.'
  },
  {
    id: 'TPL-RECEPTIONIST',
    roleCode: 'RECEPTIONIST',
    templateName: 'Front Desk Receptionist',
    icon: '🛎️',
    category: 'FRONT_DESK',
    categoryLabel: 'Front Desk & Reception',
    defaultDataScope: 'BRANCH',
    defaultModule: 'patient-registration',
    allowedModules: [
      'patient-registration',
      'encounters-visits',
      'doctor-management',
      'abdm-fhir-gateway',
      'whatsapp-patient-portal'
    ],
    description: 'Registers patients at counter, generates OPD queue tokens, verifies ABHA address, and sends WhatsApp booking slips.',
    accessibleFeatures: [
      'Patient Demographic Entry',
      'ABDM Counter QR Token Generation',
      'Doctor Appointment Booking',
      'OPD Check-in Status Tracking'
    ],
    restrictedFeatures: [
      'Clinical EMR Access',
      'Prescription Writing',
      'Direct Cashier Settlement'
    ],
    defaultReason: 'Standard Front Desk Receptionist assignment for OPD intake.'
  },

  // ==========================================
  // 2. CLINICAL DOCTORS & SPECIALISTS
  // ==========================================
  {
    id: 'TPL-ATTENDING-DOCTOR',
    roleCode: 'ATTENDING_DOCTOR',
    templateName: 'Attending Doctor / Consultant Physician',
    icon: '🩺',
    category: 'CLINICAL',
    categoryLabel: 'Clinical & Specialist Care',
    defaultDataScope: 'DEPARTMENT',
    defaultModule: 'clinical-consultation',
    allowedModules: [
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
    description: 'Performs patient consultations, digital SOAP notes, AI voice dictation, e-prescriptions, lab test ordering, and inpatient ward rounds.',
    accessibleFeatures: [
      'Patient EMR, Vitals, Allergies & Active Problem List',
      'Digital SOAP Notes (Subjective, Objective, Assessment, Plan)',
      'Digital e-Prescription (Rx) with Dosage & Duration',
      'Ambient AI Voice Scribe Dictation',
      'Drug-Drug Interaction (DDI) & CDSS Safety Alerts',
      'Web PACS DICOM Radiology Viewer',
      'Lab & Investigation Ordering & Result Verification',
      'Telemedicine Video Consultations & RPM Telemetry',
      'IPD Ward Daily Progress Notes & Discharge Summary'
    ],
    restrictedFeatures: [
      'Cash Collection & GST Tax Invoicing',
      'Wholesale Pharmacy Marg ERP Inwarding',
      'Staff Role Assignment & HR Administration'
    ],
    defaultReason: 'Authorized Attending Doctor privileges for department clinical consultations and inpatient care.'
  },
  {
    id: 'TPL-SURGEON',
    roleCode: 'SURGEON',
    templateName: 'Specialist Surgeon & OT Incharge',
    icon: '🔪',
    category: 'CLINICAL',
    categoryLabel: 'Clinical & Specialist Care',
    defaultDataScope: 'DEPARTMENT',
    defaultModule: 'operation-theatre-management',
    allowedModules: [
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
    description: 'Surgical consultations, Pre-Op evaluations, Operation Theatre rostering, Intra-Op notes, and Blood Bank cross-match requisitions.',
    accessibleFeatures: [
      'OT Surgery Scheduling & PAC Clearance',
      'Operative Surgical Notes & Implant Documentation',
      'Blood Bank Cross-Match Requests',
      'Pre-Op CT/MRI PACS DICOM Review'
    ],
    restrictedFeatures: [
      'Retail Pharmacy Billing',
      'General Cashier Reconciliation'
    ],
    defaultReason: 'Designated Surgeon privileges for OT operative care and clinical consultations.'
  },
  {
    id: 'TPL-CARDIOLOGIST',
    roleCode: 'CARDIOLOGIST',
    templateName: 'Interventional Cardiologist',
    icon: '❤️',
    category: 'CLINICAL',
    categoryLabel: 'Clinical & Specialist Care',
    defaultDataScope: 'DEPARTMENT',
    defaultModule: 'clinical-consultation',
    allowedModules: [
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
    description: 'Cardiology EMR, Cath lab notes, ECG/Echo DICOM imaging review, Troponin enzyme tracking, and cardiac rehabilitation.',
    accessibleFeatures: [
      'Cardiac EMR & Troponin Critical Alerts',
      'ECG & Echo DICOM Web Viewer',
      'Cardiac e-Prescriptions & CDSS Beta-Blocker Safety',
      'ICCU Ward Inpatient Rounds'
    ],
    restrictedFeatures: [
      'Retail Pharmacy Settlement'
    ],
    defaultReason: 'Specialist Cardiologist privileges for ICCU, Cath Lab, and cardiology OPD.'
  },
  {
    id: 'TPL-EMERGENCY-PHYSICIAN',
    roleCode: 'EMERGENCY_PHYSICIAN',
    templateName: 'Emergency & Trauma Physician',
    icon: '🚨',
    category: 'CLINICAL',
    categoryLabel: 'Clinical & Specialist Care',
    defaultDataScope: 'DEPARTMENT',
    defaultModule: 'emergency-trauma',
    allowedModules: [
      'emergency-trauma',
      'inpatient-management',
      'encounters-visits',
      'clinical-consultation',
      'patient-registration',
      'ai-chat-assistant'
    ],
    description: 'Acute emergency triage (Red/Yellow/Green), Code Blue activations, trauma resuscitation, and urgent emergency admissions.',
    accessibleFeatures: [
      'Rapid Emergency Triage & Bed Allotment',
      'Code Blue & STEMI Activations',
      'Emergency Drug Administration Logs',
      'Trauma Resuscitation Protocol Checklist'
    ],
    restrictedFeatures: [
      'Elective OPD Rostering',
      'Outpatient Insurance Pre-Auth'
    ],
    defaultReason: 'Emergency Physician assignment for 24x7 ER and trauma bay care.'
  },

  // ==========================================
  // 3. NURSING & INPATIENT CARE
  // ==========================================
  {
    id: 'TPL-CHARGE-NURSE',
    roleCode: 'CHARGE_NURSE',
    templateName: 'Charge Nurse / Ward Incharge',
    icon: '👩‍⚕️',
    category: 'NURSING',
    categoryLabel: 'Nursing & Ward Care',
    defaultDataScope: 'DEPARTMENT',
    defaultModule: 'inpatient-management',
    allowedModules: [
      'inpatient-management',
      'encounters-visits',
      'patient-registration',
      'emergency-trauma',
      'dietary-kitchen-management',
      'blood-bank-transfusion',
      'ai-chat-assistant'
    ],
    description: 'Ward bed management, nurse shift handovers, medication administration records (MAR), dietary orders, and blood transfusion tracking.',
    accessibleFeatures: [
      'Inpatient Ward Bed Allocation & Transfer',
      'Medication Administration Record (MAR) Charting',
      'Hourly Vitals & Fluid Balance Charts',
      'Patient Dietary Requisitions',
      'Blood Transfusion Bedside Verification'
    ],
    restrictedFeatures: [
      'Authorizing Drug Prescriptions',
      'Discharging Patients Without Doctor Sign-off',
      'Cash Settlement'
    ],
    defaultReason: 'Charge Nurse supervisory role for ward management and nursing administration.'
  },
  {
    id: 'TPL-STAFF-NURSE',
    roleCode: 'STAFF_NURSE',
    templateName: 'Staff Nurse',
    icon: '💉',
    category: 'NURSING',
    categoryLabel: 'Nursing & Ward Care',
    defaultDataScope: 'DEPARTMENT',
    defaultModule: 'inpatient-management',
    allowedModules: [
      'inpatient-management',
      'encounters-visits',
      'patient-registration',
      'emergency-trauma',
      'dietary-kitchen-management',
      'blood-bank-transfusion',
      'ai-chat-assistant'
    ],
    description: 'Routine bedside care, patient vitals logging, doctor order execution, and medication dispensing tracking.',
    accessibleFeatures: [
      'Bedside Vitals Logging (BP, HR, SpO2, Temp)',
      'Medication Dispensing Check-off',
      'Nursing Progress Notes',
      'Sample Collection Barcode Labeling'
    ],
    restrictedFeatures: [
      'Prescription Signing',
      'Discharge Authorization'
    ],
    defaultReason: 'Staff Nurse assignment for inpatient ward care.'
  },

  // ==========================================
  // 4. DIAGNOSTICS, LAB & RADIOLOGY
  // ==========================================
  {
    id: 'TPL-LAB-DIRECTOR',
    roleCode: 'LAB_DIRECTOR',
    templateName: 'Laboratory Director & Head Pathologist',
    icon: '🔬',
    category: 'DIAGNOSTICS',
    categoryLabel: 'Diagnostics & Laboratory',
    defaultDataScope: 'DEPARTMENT',
    defaultModule: 'clinical-investigation',
    allowedModules: [
      'clinical-investigation',
      'blood-bank-transfusion',
      'patient-registration',
      'whatsapp-patient-portal',
      'abdm-fhir-gateway',
      'ai-chat-assistant'
    ],
    description: 'NABL quality compliance, pathology lab result verification, critical alert authorization, and blood bank oversight.',
    accessibleFeatures: [
      'Diagnostic Result Digital Sign-off & NABL Formatting',
      'Automated Critical Value Alerts to Doctors',
      'Diagnostic Instrument Calibration & QC Logs',
      'Blood Bank Stock & Compatibility Reports',
      'WhatsApp Digital Lab PDF Report Delivery'
    ],
    restrictedFeatures: [
      'Clinical Prescription Writing',
      'Inpatient Ward Admissions'
    ],
    defaultReason: 'Laboratory Director appointment for pathology governance and NABL sign-off.'
  },
  {
    id: 'TPL-SENIOR-LAB-TECH',
    roleCode: 'SENIOR_LAB_TECH',
    templateName: 'Senior Lab Technician',
    icon: '🧪',
    category: 'DIAGNOSTICS',
    categoryLabel: 'Diagnostics & Laboratory',
    defaultDataScope: 'DEPARTMENT',
    defaultModule: 'clinical-investigation',
    allowedModules: [
      'clinical-investigation',
      'blood-bank-transfusion',
      'patient-registration',
      'whatsapp-patient-portal'
    ],
    description: 'Sample accessioning, analyzer machine interfacing, test parameter entry, and barcode printing.',
    accessibleFeatures: [
      'Sample Barcoding & Phlebotomy Accessioning',
      'Biochemistry / Hematology Value Entry',
      'WhatsApp Diagnostic Delivery Dispatch'
    ],
    restrictedFeatures: [
      'Final Doctor Consultation EMR',
      'Financial Cash Settlement'
    ],
    defaultReason: 'Senior Lab Technician role for diagnostics execution and sample processing.'
  },
  {
    id: 'TPL-RADIOLOGIST',
    roleCode: 'RADIOLOGIST',
    templateName: 'Consultant Radiologist',
    icon: '☢️',
    category: 'DIAGNOSTICS',
    categoryLabel: 'Diagnostics & Laboratory',
    defaultDataScope: 'DEPARTMENT',
    defaultModule: 'radiology-imaging',
    allowedModules: [
      'radiology-imaging',
      'clinical-consultation',
      'encounters-visits',
      'ai-chat-assistant'
    ],
    description: 'PACS imaging reporting, CT/MRI/Ultrasound film review, radiological measurements, and diagnostic impression authoring.',
    accessibleFeatures: [
      'PACS DICOM Web Viewer (CT, MRI, X-Ray)',
      'Radiology Structured Reporting Templates',
      'Tumour Measurement & Window Level Controls'
    ],
    restrictedFeatures: [
      'Pharmacy Dispensing',
      'Cash Desk Management'
    ],
    defaultReason: 'Consultant Radiologist role for imaging reporting.'
  },

  // ==========================================
  // 5. PHARMACY & MEDICATION
  // ==========================================
  {
    id: 'TPL-CHIEF-PHARMACIST',
    roleCode: 'CHIEF_PHARMACIST',
    templateName: 'Chief Pharmacist & Store Manager',
    icon: '💊',
    category: 'PHARMACY',
    categoryLabel: 'Pharmacy & Supply Chain',
    defaultDataScope: 'BRANCH',
    defaultModule: 'pharmacy-medication',
    allowedModules: [
      'pharmacy-medication',
      'procurement-supply-chain',
      'billing-revenue-cycle',
      'whatsapp-patient-portal'
    ],
    description: 'Pharmacy inventory control, wholesale purchase bills (Marg ERP), narcotic register, expiry audits, and retail POS dispensing.',
    accessibleFeatures: [
      'Wholesale Inwarding (Marg ERP CSV/PDF Import)',
      'Pharmacy POS Retail Dispensing & Batch Verification',
      'Drug Expiry & Near-Expiry Alert Radar',
      'Narcotic & Schedule H Drug Register',
      'GST Bill Print & WhatsApp Bill PDF Delivery'
    ],
    restrictedFeatures: [
      'Clinical Diagnostic Notes',
      'Patient IPD Bed Admissions'
    ],
    defaultReason: 'Chief Pharmacist role for inventory governance and retail medicine dispensing.'
  },
  {
    id: 'TPL-DISPENSING-PHARMACIST',
    roleCode: 'DISPENSING_PHARMACIST',
    templateName: 'Dispensing Pharmacist',
    icon: '📦',
    category: 'PHARMACY',
    categoryLabel: 'Pharmacy & Supply Chain',
    defaultDataScope: 'BRANCH',
    defaultModule: 'pharmacy-medication',
    allowedModules: [
      'pharmacy-medication',
      'billing-revenue-cycle',
      'whatsapp-patient-portal'
    ],
    description: 'Executes doctor e-prescriptions, scans drug barcodes, verifies dosage instructions, and prints POS receipts.',
    accessibleFeatures: [
      'Doctor e-Rx Prescription Dispensing',
      'Drug Barcode Scanning & Lot Validation',
      'Pharmacy POS Cash/UPI Receipt Generation'
    ],
    restrictedFeatures: [
      'Purchase Order Approval',
      'Clinical Diagnosis Edits'
    ],
    defaultReason: 'Dispensing Pharmacist assignment for counter medication sales.'
  },

  // ==========================================
  // 6. BILLING, FINANCE & INSURANCE
  // ==========================================
  {
    id: 'TPL-BILLING-MANAGER',
    roleCode: 'BILLING_MANAGER',
    templateName: 'Hospital Billing & Revenue Manager',
    icon: '📊',
    category: 'BILLING',
    categoryLabel: 'Billing & Revenue Cycle',
    defaultDataScope: 'BRANCH',
    defaultModule: 'billing-revenue-cycle',
    allowedModules: [
      'billing-revenue-cycle',
      'insurance-claims',
      'patient-registration',
      'whatsapp-patient-portal'
    ],
    description: 'Oversees hospital billing tariffs, day-end cashier settlements, GST tax reconciliation, and TPA cashless claims.',
    accessibleFeatures: [
      'Hospital Charge Master Tariff Configuration',
      'Day-End Cashier Cash/Card/UPI Reconciliation',
      'Comprehensive GST Tax Invoicing (B2B & B2C)',
      'TPA Insurance Pre-Authorization & Settlement',
      'Refund & Credit Note Authorization'
    ],
    restrictedFeatures: [
      'Writing Clinical Notes',
      'Altering Doctor Prescriptions'
    ],
    defaultReason: 'Billing Manager role for revenue cycle management and financial auditing.'
  },
  {
    id: 'TPL-CASHIER-BILLING-OFFICER',
    roleCode: 'CASHIER_BILLING_OFFICER',
    templateName: 'Cashier & Billing Counter Officer',
    icon: '💵',
    category: 'BILLING',
    categoryLabel: 'Billing & Revenue Cycle',
    defaultDataScope: 'BRANCH',
    defaultModule: 'billing-revenue-cycle',
    allowedModules: [
      'billing-revenue-cycle',
      'patient-registration',
      'whatsapp-patient-portal'
    ],
    description: 'Operates patient cashier billing counter, collects OPD/IPD payments (Cash, UPI, Card), and issues GST receipts.',
    accessibleFeatures: [
      'OPD/IPD Estimate & Bill Generation',
      'Cash, UPI & POS Card Payment Collection',
      'Receipt Printing & WhatsApp Invoice Delivery'
    ],
    restrictedFeatures: [
      'Tariff Price List Modification',
      'Clinical Medical History Access'
    ],
    defaultReason: 'Counter Cashier role for daily patient billing and cash collection.'
  },
  {
    id: 'TPL-TPA-OFFICER',
    roleCode: 'TPA_OFFICER',
    templateName: 'TPA & Ayushman Bharat Executive',
    icon: '🛡️',
    category: 'BILLING',
    categoryLabel: 'Billing & Revenue Cycle',
    defaultDataScope: 'BRANCH',
    defaultModule: 'insurance-claims',
    allowedModules: [
      'insurance-claims',
      'billing-revenue-cycle',
      'patient-registration'
    ],
    description: 'Coordinates cashless insurance pre-authorizations, Ayushman Bharat PM-JAY package claims, and corporate approvals.',
    accessibleFeatures: [
      'TPA Insurance Pre-Auth Portal Integration',
      'PM-JAY Scheme Benefit Package Mapping',
      'Claim Query Resubmission & Settlement Tracking'
    ],
    restrictedFeatures: [
      'Clinical Prescription Alteration',
      'Pharmacy Inventory Inwarding'
    ],
    defaultReason: 'TPA Executive assignment for cashless insurance operations.'
  },

  // ==========================================
  // 7. EXECUTIVE LEADERSHIP & GOVERNANCE
  // ==========================================
  {
    id: 'TPL-HOSPITAL-DIRECTOR',
    roleCode: 'HOSPITAL_DIRECTOR',
    templateName: 'Hospital Director / Medical Superintendent',
    icon: '👑',
    category: 'EXECUTIVE',
    categoryLabel: 'Executive Leadership',
    defaultDataScope: 'ORGANIZATION',
    defaultModule: 'executive-command-center',
    allowedModules: ['*'],
    description: 'Complete operational command across all 26 hospital modules, financial analytics, clinical oversight, and staff management.',
    accessibleFeatures: [
      'Real-time Executive Command Center & Bed Occupancy',
      'Full Staff Administration & Role Delegation',
      'Hospital Financial Profitability & MIS Dashboard',
      'Incident, Infection Control & Clinical Governance',
      'Unrestricted Access across all 26 Hospital Modules'
    ],
    restrictedFeatures: ['None (Full Hospital Authority)'],
    defaultReason: 'Executive Hospital Director credentials with full governance authority.'
  },
  {
    id: 'TPL-CHIEF-MEDICAL-OFFICER',
    roleCode: 'CHIEF_MEDICAL_OFFICER',
    templateName: 'Chief Medical Officer (CMO)',
    icon: '🏥',
    category: 'EXECUTIVE',
    categoryLabel: 'Executive Leadership',
    defaultDataScope: 'ORGANIZATION',
    defaultModule: 'executive-command-center',
    allowedModules: [
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
    description: 'Clinical governance, mortality & morbidity audits, NABH quality protocols, doctor credentialing, and clinical staff oversight.',
    accessibleFeatures: [
      'Clinical Governance Wall & Mortality Audits',
      'NABH Standard Protocol Compliance',
      'Doctor Credentialing & Department Privilege Review',
      'Emergency Break-Glass Clinical Access Approval'
    ],
    restrictedFeatures: [
      'Retail Cash Counter Collection',
      'Pharmacy Inward Invoicing'
    ],
    defaultReason: 'Chief Medical Officer credentials for clinical governance and medical administration.'
  },
  {
    id: 'TPL-HEAD-OF-DEPARTMENT',
    roleCode: 'HEAD_OF_DEPARTMENT',
    templateName: 'Head of Department (HOD)',
    icon: '👨‍💼',
    category: 'EXECUTIVE',
    categoryLabel: 'Executive Leadership',
    defaultDataScope: 'DEPARTMENT',
    defaultModule: 'executive-command-center',
    allowedModules: [
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
    description: 'Leads a clinical department (e.g. Cardiology, Orthopedics, Surgery), oversees duty rosters, ward admissions, and clinical audit.',
    accessibleFeatures: [
      'Department Doctor OPD & Night Duty Rostering',
      'Department Clinical Consultation Audits',
      'Inpatient Ward Rounds & Complex Case Reviews',
      'Cross-Consultation Approvals'
    ],
    restrictedFeatures: [
      'Direct Cashier Fee Collection',
      'Global Hospital Financial MIS'
    ],
    defaultReason: 'Head of Department appointment for clinical leadership and roster scheduling.'
  }
];

export const PARTNER_ROLE_TEMPLATES: PartnerRoleTemplate[] = DEFAULT_PARTNER_ROLE_TEMPLATES;

export const ROLE_TEMPLATES_STORAGE_KEY = 'docsearch_partner_role_templates';
export const ROLE_TEMPLATES_CHANGED_EVENT = 'docsearch:role-templates-changed';

export interface HospitalModuleOption {
  key: PartnerModuleKey;
  label: string;
  category: 'Desk & Intake' | 'Clinical & Wards' | 'Diagnostics & PACS' | 'Supply & Pharmacy' | 'Finance & Governance';
  description: string;
}

export const ALL_HOSPITAL_MODULES: HospitalModuleOption[] = [
  { key: 'patient-registration', label: 'Patient Registration (MPI & ABHA)', category: 'Desk & Intake', description: 'Patient intake, demographic entry, ABHA creation' },
  { key: 'encounters-visits', label: 'Encounters & OPD Queue', category: 'Desk & Intake', description: 'Live token management, OPD triage and queue dispatch' },
  { key: 'doctor-management', label: 'Doctor OPD Roster & Scheduling', category: 'Desk & Intake', description: 'Consultant rosters, slot availability and appointments' },
  { key: 'abdm-fhir-gateway', label: 'ABDM FHIR M1/M2/M3 Gateway', category: 'Desk & Intake', description: 'Scan & share counter QR, health records exchange' },
  { key: 'whatsapp-patient-portal', label: 'WhatsApp Patient Portal & SMS', category: 'Desk & Intake', description: 'Digital token slips, PDF reports, appointment alerts' },

  { key: 'clinical-consultation', label: 'Clinical Consultation EMR Desk', category: 'Clinical & Wards', description: 'SOAP notes, e-Prescriptions, problem lists, allergies' },
  { key: 'ai-clinical-cdss', label: 'AI Clinical CDSS & Voice Scribe', category: 'Clinical & Wards', description: 'Voice dictation, drug-drug interaction alerts' },
  { key: 'telemedicine-rpm', label: 'Telemedicine & RPM Telemetry', category: 'Clinical & Wards', description: 'Video consults, remote patient telemetry' },
  { key: 'inpatient-management', label: 'Inpatient Ward (IPD) Management', category: 'Clinical & Wards', description: 'Bed rounds, daily progress notes, discharge summary' },
  { key: 'operation-theatre-management', label: 'Operation Theatre (OT) & PAC', category: 'Clinical & Wards', description: 'Surgical scheduling, intra-op notes, PAC clearance' },
  { key: 'emergency-trauma', label: 'Emergency & Trauma Care (ER)', category: 'Clinical & Wards', description: 'Red/yellow/green triage, code blue, emergency bay' },
  { key: 'ai-chat-assistant', label: 'AI Clinical Copilot & Assistant', category: 'Clinical & Wards', description: 'Ambient conversational copilot for clinical workflow' },

  { key: 'clinical-investigation', label: 'Diagnostics & Pathology (LIMS)', category: 'Diagnostics & PACS', description: 'Lab order entry, analyzer results, NABL format' },
  { key: 'radiology-imaging', label: 'Radiology PACS Web DICOM Viewer', category: 'Diagnostics & PACS', description: 'CT, MRI, X-ray DICOM viewer and radiologist reporting' },
  { key: 'blood-bank-transfusion', label: 'Blood Bank & Transfusion', category: 'Diagnostics & PACS', description: 'Blood component inventory, cross-match, transfusion logs' },
  { key: 'medical-records', label: 'Medical Records (MRD) & ICD-10', category: 'Diagnostics & PACS', description: 'Discharge records vault, ICD-10 coding, compliance' },

  { key: 'pharmacy-medication', label: 'Pharmacy POS & Medication Store', category: 'Supply & Pharmacy', description: 'Retail dispensing, Marg ERP wholesale inwarding' },
  { key: 'procurement-supply-chain', label: 'Procurement & Supply Chain', category: 'Supply & Pharmacy', description: 'Purchase requisitions, vendor POs, stock audits' },
  { key: 'dietary-kitchen-management', label: 'Dietary & Nutrition Kitchen', category: 'Supply & Pharmacy', description: 'Patient meal requisitions, diet types, nutritional logs' },
  { key: 'asset-biomedical-maintenance', label: 'Biomedical Asset Maintenance', category: 'Supply & Pharmacy', description: 'Equipment preventive maintenance, breakdown logs' },

  { key: 'billing-revenue-cycle', label: 'Billing & Revenue Cycle (Cashier)', category: 'Finance & Governance', description: 'Counter payments, 18% GST invoicing, tariff master' },
  { key: 'insurance-claims', label: 'TPA & Insurance Claims (PM-JAY)', category: 'Finance & Governance', description: 'Cashless pre-auth, PM-JAY packages, settlement' },
  { key: 'executive-command-center', label: 'Executive Command Center', category: 'Finance & Governance', description: 'Live bed occupancy wall, hospital revenue MIS' },
  { key: 'organization-foundation', label: 'Hospital Foundation & Branches', category: 'Finance & Governance', description: 'Multi-facility setup, branches, license certificates' },
  { key: 'staff-administration', label: 'Staff Administration & HR', category: 'Finance & Governance', description: 'Staff directory, department hierarchy, role scopes' },
  { key: 'quality-incident-infection-control', label: 'NABH Quality & Infection Control', category: 'Finance & Governance', description: 'Incident reports, hospital infection surveillance' }
];

export function getAllRoleTemplates(): PartnerRoleTemplate[] {
  if (typeof window === 'undefined') {
    return DEFAULT_PARTNER_ROLE_TEMPLATES;
  }
  try {
    const raw = localStorage.getItem(ROLE_TEMPLATES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ROLE_TEMPLATES_STORAGE_KEY, JSON.stringify(DEFAULT_PARTNER_ROLE_TEMPLATES));
      return DEFAULT_PARTNER_ROLE_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load dynamic role templates from localStorage:', err);
  }
  return DEFAULT_PARTNER_ROLE_TEMPLATES;
}

export function saveAllRoleTemplates(templates: PartnerRoleTemplate[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ROLE_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    window.dispatchEvent(new CustomEvent(ROLE_TEMPLATES_CHANGED_EVENT, { detail: { templates } }));
  } catch (err) {
    console.error('Failed to save dynamic role templates to localStorage:', err);
  }
}

export function createRoleTemplate(newTpl: Omit<PartnerRoleTemplate, 'id'>): PartnerRoleTemplate {
  const current = getAllRoleTemplates();
  const cleanCode = newTpl.roleCode.trim().toUpperCase().replace(/[\s-]+/g, '_');
  const existingWithCode = current.find((t) => t.roleCode === cleanCode);
  if (existingWithCode) {
    throw new Error(`Role template with code "${cleanCode}" already exists.`);
  }

  const id = `TPL-CUSTOM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const created: PartnerRoleTemplate = {
    ...newTpl,
    id,
    roleCode: cleanCode,
    isCustom: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updated = [created, ...current];
  saveAllRoleTemplates(updated);
  return created;
}

export function updateRoleTemplate(id: string, updates: Partial<PartnerRoleTemplate>): PartnerRoleTemplate {
  const current = getAllRoleTemplates();
  const index = current.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error(`Role template with ID ${id} not found.`);
  }

  const existing = current[index]!;
  const newCode = updates.roleCode ? updates.roleCode.trim().toUpperCase().replace(/[\s-]+/g, '_') : existing.roleCode;

  if (newCode !== existing.roleCode) {
    const collision = current.find((t) => t.id !== id && t.roleCode === newCode);
    if (collision) {
      throw new Error(`Role template with code "${newCode}" already exists.`);
    }
  }

  const updatedTpl: PartnerRoleTemplate = {
    ...existing,
    ...updates,
    id: existing.id,
    roleCode: newCode,
    templateName: updates.templateName !== undefined ? updates.templateName : existing.templateName,
    icon: updates.icon !== undefined ? updates.icon : existing.icon,
    category: updates.category !== undefined ? updates.category : existing.category,
    categoryLabel: updates.categoryLabel !== undefined ? updates.categoryLabel : existing.categoryLabel,
    defaultDataScope: updates.defaultDataScope !== undefined ? updates.defaultDataScope : existing.defaultDataScope,
    defaultModule: updates.defaultModule !== undefined ? updates.defaultModule : existing.defaultModule,
    allowedModules: updates.allowedModules !== undefined ? updates.allowedModules : existing.allowedModules,
    description: updates.description !== undefined ? updates.description : existing.description,
    accessibleFeatures: updates.accessibleFeatures !== undefined ? updates.accessibleFeatures : existing.accessibleFeatures,
    restrictedFeatures: updates.restrictedFeatures !== undefined ? updates.restrictedFeatures : existing.restrictedFeatures,
    defaultReason: updates.defaultReason !== undefined ? updates.defaultReason : existing.defaultReason,
    updatedAt: new Date().toISOString()
  };

  current[index] = updatedTpl;
  saveAllRoleTemplates(current);
  return updatedTpl;
}

export function deleteRoleTemplate(id: string): boolean {
  const current = getAllRoleTemplates();
  const filtered = current.filter((t) => t.id !== id);
  if (filtered.length === current.length) {
    return false;
  }
  saveAllRoleTemplates(filtered);
  return true;
}

export function resetToDefaultTemplates(): PartnerRoleTemplate[] {
  saveAllRoleTemplates(DEFAULT_PARTNER_ROLE_TEMPLATES);
  return DEFAULT_PARTNER_ROLE_TEMPLATES;
}

export function getRoleTemplate(roleCodeOrId: string): PartnerRoleTemplate | undefined {
  if (!roleCodeOrId) return undefined;
  const clean = roleCodeOrId.trim().toUpperCase().replace(/[\s-]+/g, '_');
  const all = getAllRoleTemplates();
  return all.find((t) => t.roleCode === clean || t.id === roleCodeOrId || t.roleCode === roleCodeOrId);
}

export function getRoleTemplatesByCategory(category: RoleCategory): PartnerRoleTemplate[] {
  return getAllRoleTemplates().filter((t) => t.category === category);
}

export function getUniqueCategories(): { key: RoleCategory; label: string }[] {
  const seen = new Set<RoleCategory>();
  const list: { key: RoleCategory; label: string }[] = [];
  const all = getAllRoleTemplates();
  for (const t of all) {
    if (!seen.has(t.category)) {
      seen.add(t.category);
      list.push({ key: t.category, label: t.categoryLabel });
    }
  }
  return list;
}
