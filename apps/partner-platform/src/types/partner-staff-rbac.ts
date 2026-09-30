export type PartnerCategory =
  | 'PATHOLOGY'
  | 'PHARMACY'
  | 'INDEPENDENT_CLINIC'
  | 'MULTI_SPECIALITY_HOSPITAL'
  | 'DIAGNOSTIC_CENTRE';

export interface PartnerCategoryInfo {
  id: PartnerCategory;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  defaultDepartment: string;
}

export const PARTNER_CATEGORIES: Record<PartnerCategory, PartnerCategoryInfo> = {
  PATHOLOGY: {
    id: 'PATHOLOGY',
    label: 'Diagnostic Pathology Laboratory',
    shortLabel: 'Pathology Lab',
    icon: '🔬',
    description: 'Standalone or chain diagnostic center specializing in blood tests, imaging, and LIS reports.',
    defaultDepartment: 'Diagnostic Pathology & LIS'
  },
  PHARMACY: {
    id: 'PHARMACY',
    label: 'Retail & Hospital Pharmacy',
    shortLabel: 'Pharmacy',
    icon: '💊',
    description: 'Retail chemist, dispensary, wholesale pharma, and scheduled drug inventory operations.',
    defaultDepartment: 'Pharmacy & Drug Dispensary'
  },
  INDEPENDENT_CLINIC: {
    id: 'INDEPENDENT_CLINIC',
    label: 'Independent Doctor Clinic / Polyclinic',
    shortLabel: 'Clinic',
    icon: '🩺',
    description: 'Single-doctor or group practice outpatient clinic offering OPD appointments and e-prescriptions.',
    defaultDepartment: 'Outpatient Clinic & Consultation'
  },
  MULTI_SPECIALITY_HOSPITAL: {
    id: 'MULTI_SPECIALITY_HOSPITAL',
    label: 'Multi-Speciality Hospital',
    shortLabel: 'Hospital',
    icon: '🏥',
    description: 'Full-fledged inpatient healthcare facility with ICU, OT, Emergency, Wards, and TPA claims.',
    defaultDepartment: 'Main Hospital Inpatient & Emergency'
  },
  DIAGNOSTIC_CENTRE: {
    id: 'DIAGNOSTIC_CENTRE',
    label: 'Radiology & Diagnostic Imaging Centre',
    shortLabel: 'Radiology / Imaging',
    icon: '☢️',
    description: 'Advanced diagnostic imaging modalities including X-Ray, Ultrasound, CT, MRI, and PACS reporting.',
    defaultDepartment: 'Radiology & Imaging Diagnostics'
  }
};

export interface StaffPermissions {
  // 1. Data-Theft Protection
  canExportPatientData: boolean;
  canViewFullPhoneNumber: boolean;

  // 2. Financial & Cash Reconciliation
  canGiveDiscounts: boolean;
  maxDiscountPercent: number;
  canCancelOrRefundBills: boolean;
  requiresShiftHandoverSignoff: boolean;

  // 3. Clinical & Legal Compliance
  canSignLabReports: boolean;
  canSignPrescriptions: boolean;
  canDispenseRestrictedDrugs: boolean;

  // 4. Access & Session Lifecycle
  canAccessAfterHours: boolean;
  isAccessRevoked: boolean;
  revokedAt?: string | undefined;
  revokedReason?: string | undefined;

  // 5. Accessible Module Slugs
  accessibleModules: string[];
}

export interface RolePresetDefinition {
  key: string;
  title: string;
  staffType: 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'LAB_TECHNICIAN' | 'PHARMACIST' | 'BILLING_OFFICER' | 'ADMINISTRATIVE' | 'OPERATIONAL_SUPPORT';
  category: PartnerCategory;
  description: string;
  defaultPermissions: StaffPermissions;
}

export const ROLE_PRESETS: Record<string, RolePresetDefinition> = {
  // 🔬 PATHOLOGY ROLES
  PATHOLOGIST_MD: {
    key: 'PATHOLOGIST_MD',
    title: 'Consultant Pathologist (MD / Signatory)',
    staffType: 'DOCTOR',
    category: 'PATHOLOGY',
    description: 'Authorized medical doctor responsible for verifying and digitally signing diagnostic lab reports (NABL).',
    defaultPermissions: {
      canExportPatientData: false,
      canViewFullPhoneNumber: true,
      canGiveDiscounts: false,
      maxDiscountPercent: 0,
      canCancelOrRefundBills: false,
      requiresShiftHandoverSignoff: false,
      canSignLabReports: true,
      canSignPrescriptions: false,
      canDispenseRestrictedDrugs: false,
      canAccessAfterHours: true,
      isAccessRevoked: false,
      accessibleModules: ['clinical-investigation', 'blood-bank', 'teleconsult-desk']
    }
  },
  LAB_TECHNICIAN_SR: {
    key: 'LAB_TECHNICIAN_SR',
    title: 'Senior Medical Laboratory Technician',
    staffType: 'LAB_TECHNICIAN',
    category: 'PATHOLOGY',
    description: 'Processes blood/tissue samples, operates hematology & biochemistry analyzers, and enters test parameters.',
    defaultPermissions: {
      canExportPatientData: false,
      canViewFullPhoneNumber: false,
      canGiveDiscounts: false,
      maxDiscountPercent: 0,
      canCancelOrRefundBills: false,
      requiresShiftHandoverSignoff: false,
      canSignLabReports: false,
      canSignPrescriptions: false,
      canDispenseRestrictedDrugs: false,
      canAccessAfterHours: false,
      isAccessRevoked: false,
      accessibleModules: ['clinical-investigation', 'inventory-supplies']
    }
  },
  PHLEBOTOMIST: {
    key: 'PHLEBOTOMIST',
    title: 'Phlebotomist / Home Sample Collector',
    staffType: 'OPERATIONAL_SUPPORT',
    category: 'PATHOLOGY',
    description: 'Performs patient blood draws, home collections, barcode vacutainer tagging, and cold-chain sample drop-off.',
    defaultPermissions: {
      canExportPatientData: false,
      canViewFullPhoneNumber: true,
      canGiveDiscounts: false,
      maxDiscountPercent: 0,
      canCancelOrRefundBills: false,
      requiresShiftHandoverSignoff: true,
      canSignLabReports: false,
      canSignPrescriptions: false,
      canDispenseRestrictedDrugs: false,
      canAccessAfterHours: false,
      isAccessRevoked: false,
      accessibleModules: ['clinical-investigation']
    }
  },
  LAB_RECEPTIONIST: {
    key: 'LAB_RECEPTIONIST',
    title: 'Diagnostic Counter & Test Booking Lead',
    staffType: 'RECEPTIONIST',
    category: 'PATHOLOGY',
    description: 'Registers patients for blood tests, issues test barcode tokens, collects upfront fees, and prints sealed lab reports.',
    defaultPermissions: {
      canExportPatientData: false,
      canViewFullPhoneNumber: false,
      canGiveDiscounts: true,
      maxDiscountPercent: 5,
      canCancelOrRefundBills: false,
      requiresShiftHandoverSignoff: true,
      canSignLabReports: false,
      canSignPrescriptions: false,
      canDispenseRestrictedDrugs: false,
      canAccessAfterHours: false,
      isAccessRevoked: false,
      accessibleModules: ['patient-registration', 'hospital-billing', 'clinical-investigation']
    }
  },

  // 💊 PHARMACY ROLES
  CHIEF_PHARMACIST: {
    key: 'CHIEF_PHARMACIST',
    title: 'Chief Registered Pharmacist (Superintendent)',
    staffType: 'PHARMACIST',
    category: 'PHARMACY',
    description: 'Licensed pharmacist holding State Pharmacy Council registration. Supervises narcotic registers, purchase orders, and audits.',
    defaultPermissions: {
      canExportPatientData: true,
      canViewFullPhoneNumber: true,
      canGiveDiscounts: true,
      maxDiscountPercent: 15,
      canCancelOrRefundBills: true,
      requiresShiftHandoverSignoff: true,
      canSignLabReports: false,
      canSignPrescriptions: false,
      canDispenseRestrictedDrugs: true,
      canAccessAfterHours: true,
      isAccessRevoked: false,
      accessibleModules: ['pharmacy-medication', 'inventory-supplies', 'hospital-billing']
    }
  },
  DISPENSING_CHEMIST: {
    key: 'DISPENSING_CHEMIST',
    title: 'Dispensing Chemist / Counter Executive',
    staffType: 'PHARMACIST',
    category: 'PHARMACY',
    description: 'Validates doctor prescriptions, scans drug barcodes, verifies dosage frequency, and dispenses OTC/Rx meds.',
    defaultPermissions: {
      canExportPatientData: false,
      canViewFullPhoneNumber: false,
      canGiveDiscounts: true,
      maxDiscountPercent: 5,
      canCancelOrRefundBills: false,
      requiresShiftHandoverSignoff: true,
      canSignLabReports: false,
      canSignPrescriptions: false,
      canDispenseRestrictedDrugs: false,
      canAccessAfterHours: false,
      isAccessRevoked: false,
      accessibleModules: ['pharmacy-medication', 'hospital-billing']
    }
  },
  INVENTORY_STORE_MGR: {
    key: 'INVENTORY_STORE_MGR',
    title: 'Pharmacy Inventory & Wholesale Manager',
    staffType: 'OPERATIONAL_SUPPORT',
    category: 'PHARMACY',
    description: 'Oversees stock receipt, batch & expiry monitoring, supplier wholesale GRNs, and returned medication logistics.',
    defaultPermissions: {
      canExportPatientData: false,
      canViewFullPhoneNumber: false,
      canGiveDiscounts: false,
      maxDiscountPercent: 0,
      canCancelOrRefundBills: false,
      requiresShiftHandoverSignoff: false,
      canSignLabReports: false,
      canSignPrescriptions: false,
      canDispenseRestrictedDrugs: false,
      canAccessAfterHours: false,
      isAccessRevoked: false,
      accessibleModules: ['inventory-supplies']
    }
  },
  PHARMACY_CASHIER: {
    key: 'PHARMACY_CASHIER',
    title: 'Pharmacy Cashier & POS Operator',
    staffType: 'BILLING_OFFICER',
    category: 'PHARMACY',
    description: 'Handles cash, UPI QR scans, card terminals, and generates GST pharmaceutical tax invoices.',
    defaultPermissions: {
      canExportPatientData: false,
      canViewFullPhoneNumber: false,
      canGiveDiscounts: false,
      maxDiscountPercent: 0,
      canCancelOrRefundBills: false,
      requiresShiftHandoverSignoff: true,
      canSignLabReports: false,
      canSignPrescriptions: false,
      canDispenseRestrictedDrugs: false,
      canAccessAfterHours: false,
      isAccessRevoked: false,
      accessibleModules: ['hospital-billing']
    }
  },

  // 🩺 INDEPENDENT CLINIC ROLES
  CLINIC_DOCTOR: {
    key: 'CLINIC_DOCTOR',
    title: 'Consultant Doctor / Clinical Specialist',
    staffType: 'DOCTOR',
    category: 'INDEPENDENT_CLINIC',
    description: 'Licensed medical practitioner running outpatient consultation, clinical diagnosis, and digital prescriptions.',
    defaultPermissions: {
      canExportPatientData: true,
      canViewFullPhoneNumber: true,
      canGiveDiscounts: true,
      maxDiscountPercent: 100,
      canCancelOrRefundBills: true,
      requiresShiftHandoverSignoff: false,
      canSignLabReports: false,
      canSignPrescriptions: true,
      canDispenseRestrictedDrugs: true,
      canAccessAfterHours: true,
      isAccessRevoked: false,
      accessibleModules: ['doctor-management', 'encounters-visits', 'clinical-consultation', 'clinical-investigation', 'teleconsult-desk']
    }
  },
  CLINIC_FRONT_DESK: {
    key: 'CLINIC_FRONT_DESK',
    title: 'Clinic Front Desk & Appointment Lead',
    staffType: 'RECEPTIONIST',
    category: 'INDEPENDENT_CLINIC',
    description: 'Manages walk-in appointments, issues OPD queue tokens with voice caller, verifies ABHA QR, and handles check-ins.',
    defaultPermissions: {
      canExportPatientData: false,
      canViewFullPhoneNumber: false,
      canGiveDiscounts: false,
      maxDiscountPercent: 0,
      canCancelOrRefundBills: false,
      requiresShiftHandoverSignoff: true,
      canSignLabReports: false,
      canSignPrescriptions: false,
      canDispenseRestrictedDrugs: false,
      canAccessAfterHours: false,
      isAccessRevoked: false,
      accessibleModules: ['patient-registration', 'encounters-visits', 'hospital-billing']
    }
  },
  CLINIC_NURSE: {
    key: 'CLINIC_NURSE',
    title: 'Clinic Staff Nurse / Triage Assistant',
    staffType: 'NURSE',
    category: 'INDEPENDENT_CLINIC',
    description: 'Records pre-consultation vitals (BP, Pulse, SpO2, Temp, Weight), assists in minor procedures, and administers injections.',
    defaultPermissions: {
      canExportPatientData: false,
      canViewFullPhoneNumber: false,
      canGiveDiscounts: false,
      maxDiscountPercent: 0,
      canCancelOrRefundBills: false,
      requiresShiftHandoverSignoff: false,
      canSignLabReports: false,
      canSignPrescriptions: false,
      canDispenseRestrictedDrugs: false,
      canAccessAfterHours: false,
      isAccessRevoked: false,
      accessibleModules: ['nurse-triage-station', 'encounters-visits']
    }
  },
  CLINIC_ACCOUNTANT: {
    key: 'CLINIC_ACCOUNTANT',
    title: 'Clinic Accountant & Cashier',
    staffType: 'BILLING_OFFICER',
    category: 'INDEPENDENT_CLINIC',
    description: 'Handles daily OPD fees collection, UPI settlements, expense logging, and day-end cash reconciliation.',
    defaultPermissions: {
      canExportPatientData: false,
      canViewFullPhoneNumber: false,
      canGiveDiscounts: true,
      maxDiscountPercent: 10,
      canCancelOrRefundBills: false,
      requiresShiftHandoverSignoff: true,
      canSignLabReports: false,
      canSignPrescriptions: false,
      canDispenseRestrictedDrugs: false,
      canAccessAfterHours: false,
      isAccessRevoked: false,
      accessibleModules: ['hospital-billing']
    }
  },

  // 🏥 MULTI-SPECIALITY HOSPITAL ROLES
  HOSPITAL_SPECIALIST: {
    key: 'HOSPITAL_SPECIALIST',
    title: 'Attending Consultant / Chief Surgeon',
    staffType: 'DOCTOR',
    category: 'MULTI_SPECIALITY_HOSPITAL',
    description: 'Senior medical consultant overseeing inpatient rounds, surgical procedures, and emergency admissions.',
    defaultPermissions: {
      canExportPatientData: false,
      canViewFullPhoneNumber: true,
      canGiveDiscounts: false,
      maxDiscountPercent: 0,
      canCancelOrRefundBills: false,
      requiresShiftHandoverSignoff: false,
      canSignLabReports: false,
      canSignPrescriptions: true,
      canDispenseRestrictedDrugs: true,
      canAccessAfterHours: true,
      isAccessRevoked: false,
      accessibleModules: ['doctor-management', 'inpatient-management', 'clinical-consultation', 'clinical-investigation', 'radiology-imaging', 'teleconsult-desk']
    }
  },
  RMO_RESIDENT: {
    key: 'RMO_RESIDENT',
    title: 'Resident Medical Officer (RMO / ICU)',
    staffType: 'DOCTOR',
    category: 'MULTI_SPECIALITY_HOSPITAL',
    description: '24/7 on-duty hospital resident doctor attending to ward emergencies, clinical charting, and ICU telemetry.',
    defaultPermissions: {
      canExportPatientData: false,
      canViewFullPhoneNumber: true,
      canGiveDiscounts: false,
      maxDiscountPercent: 0,
      canCancelOrRefundBills: false,
      requiresShiftHandoverSignoff: false,
      canSignLabReports: false,
      canSignPrescriptions: true,
      canDispenseRestrictedDrugs: true,
      canAccessAfterHours: true,
      isAccessRevoked: false,
      accessibleModules: ['inpatient-management', 'emergency-triage', 'nurse-triage-station', 'clinical-investigation', 'radiology-imaging']
    }
  },
  STAFF_NURSE: {
    key: 'STAFF_NURSE',
    title: 'Inpatient Ward / ICU Staff Nurse',
    staffType: 'NURSE',
    category: 'MULTI_SPECIALITY_HOSPITAL',
    description: 'Monitors bedside vitals, executes medication charts, updates IPD notes, and flags clinical escalations.',
    defaultPermissions: {
      canExportPatientData: false,
      canViewFullPhoneNumber: false,
      canGiveDiscounts: false,
      maxDiscountPercent: 0,
      canCancelOrRefundBills: false,
      requiresShiftHandoverSignoff: false,
      canSignLabReports: false,
      canSignPrescriptions: false,
      canDispenseRestrictedDrugs: false,
      canAccessAfterHours: true,
      isAccessRevoked: false,
      accessibleModules: ['inpatient-management', 'nurse-triage-station', 'emergency-triage']
    }
  },
  TPA_DESK_LEAD: {
    key: 'TPA_DESK_LEAD',
    title: 'TPA & Health Insurance Desk Executive',
    staffType: 'ADMINISTRATIVE',
    category: 'MULTI_SPECIALITY_HOSPITAL',
    description: 'Processes cashless pre-authorizations, NHCX claims, query resolutions, and final settlement dossiers with insurers.',
    defaultPermissions: {
      canExportPatientData: false,
      canViewFullPhoneNumber: true,
      canGiveDiscounts: false,
      maxDiscountPercent: 0,
      canCancelOrRefundBills: false,
      requiresShiftHandoverSignoff: false,
      canSignLabReports: false,
      canSignPrescriptions: false,
      canDispenseRestrictedDrugs: false,
      canAccessAfterHours: false,
      isAccessRevoked: false,
      accessibleModules: ['insurance-tpa', 'hospital-billing']
    }
  },
  OT_TECHNICIAN: {
    key: 'OT_TECHNICIAN',
    title: 'Operation Theatre & Anaesthesia Technician',
    staffType: 'OPERATIONAL_SUPPORT',
    category: 'MULTI_SPECIALITY_HOSPITAL',
    description: 'Prepares sterile surgical equipment, assists surgeons during procedures, and manages biomedical gas supplies.',
    defaultPermissions: {
      canExportPatientData: false,
      canViewFullPhoneNumber: false,
      canGiveDiscounts: false,
      maxDiscountPercent: 0,
      canCancelOrRefundBills: false,
      requiresShiftHandoverSignoff: false,
      canSignLabReports: false,
      canSignPrescriptions: false,
      canDispenseRestrictedDrugs: false,
      canAccessAfterHours: false,
      isAccessRevoked: false,
      accessibleModules: ['inpatient-management', 'asset-biomedical']
    }
  },
  HOSPITAL_BILLING_LEAD: {
    key: 'HOSPITAL_BILLING_LEAD',
    title: 'Hospital Central Billing & Cashier Lead',
    staffType: 'BILLING_OFFICER',
    category: 'MULTI_SPECIALITY_HOSPITAL',
    description: 'Manages multi-department billing consolidation, advances, bed charges, package billing, and discharge clearance.',
    defaultPermissions: {
      canExportPatientData: false,
      canViewFullPhoneNumber: false,
      canGiveDiscounts: true,
      maxDiscountPercent: 10,
      canCancelOrRefundBills: false,
      requiresShiftHandoverSignoff: true,
      canSignLabReports: false,
      canSignPrescriptions: false,
      canDispenseRestrictedDrugs: false,
      canAccessAfterHours: false,
      isAccessRevoked: false,
      accessibleModules: ['hospital-billing', 'inpatient-management', 'insurance-tpa']
    }
  },
  HOSPITAL_ADMIN: {
    key: 'HOSPITAL_ADMIN',
    title: 'Hospital Operations Director / Medical Admin',
    staffType: 'ADMINISTRATIVE',
    category: 'MULTI_SPECIALITY_HOSPITAL',
    description: 'Full administrative oversight across departments, staff rosters, audit logs, and facility operational analytics.',
    defaultPermissions: {
      canExportPatientData: true,
      canViewFullPhoneNumber: true,
      canGiveDiscounts: true,
      maxDiscountPercent: 100,
      canCancelOrRefundBills: true,
      requiresShiftHandoverSignoff: false,
      canSignLabReports: false,
      canSignPrescriptions: false,
      canDispenseRestrictedDrugs: false,
      canAccessAfterHours: true,
      isAccessRevoked: false,
      accessibleModules: [
        'inpatient-management',
        'doctor-management',
        'nurse-triage-station',
        'emergency-triage',
        'hospital-billing',
        'insurance-tpa',
        'pharmacy-medication',
        'clinical-investigation',
        'blood-bank',
        'asset-biomedical',
        'staff-management'
      ]
    }
  },

  // ☢️ RADIOLOGY & DIAGNOSTIC IMAGING ROLES
  RADIOLOGIST_MD: {
    key: 'RADIOLOGIST_MD',
    title: 'Consultant Radiologist (MD Radiodiagnosis)',
    staffType: 'DOCTOR',
    category: 'DIAGNOSTIC_CENTRE',
    description: 'Licensed medical radiologist interpreting X-ray, Ultrasound, CT, MRI, and signing diagnostic imaging reports.',
    defaultPermissions: {
      canExportPatientData: false,
      canViewFullPhoneNumber: true,
      canGiveDiscounts: false,
      maxDiscountPercent: 0,
      canCancelOrRefundBills: false,
      requiresShiftHandoverSignoff: false,
      canSignLabReports: true,
      canSignPrescriptions: false,
      canDispenseRestrictedDrugs: false,
      canAccessAfterHours: true,
      isAccessRevoked: false,
      accessibleModules: ['radiology-imaging', 'clinical-investigation', 'teleconsult-desk']
    }
  },
  RADIOGRAPHER_TECH: {
    key: 'RADIOGRAPHER_TECH',
    title: 'Radiographer / Medical Imaging Technologist',
    staffType: 'OPERATIONAL_SUPPORT',
    category: 'DIAGNOSTIC_CENTRE',
    description: 'Performs patient positioning, radiation safety (AERB), modality acquisition (CT/MRI/X-ray), and PACS uploads.',
    defaultPermissions: {
      canExportPatientData: false,
      canViewFullPhoneNumber: false,
      canGiveDiscounts: false,
      maxDiscountPercent: 0,
      canCancelOrRefundBills: false,
      requiresShiftHandoverSignoff: false,
      canSignLabReports: false,
      canSignPrescriptions: false,
      canDispenseRestrictedDrugs: false,
      canAccessAfterHours: false,
      isAccessRevoked: false,
      accessibleModules: ['radiology-imaging', 'asset-biomedical']
    }
  },
  MODALITY_COORDINATOR: {
    key: 'MODALITY_COORDINATOR',
    title: 'Modality Scheduling & Patient Consent Lead',
    staffType: 'RECEPTIONIST',
    category: 'DIAGNOSTIC_CENTRE',
    description: 'Coordinates appointment slots for CT/MRI/USG, verifies contrast creatinine safety reports, and issues tokens.',
    defaultPermissions: {
      canExportPatientData: false,
      canViewFullPhoneNumber: false,
      canGiveDiscounts: true,
      maxDiscountPercent: 5,
      canCancelOrRefundBills: false,
      requiresShiftHandoverSignoff: true,
      canSignLabReports: false,
      canSignPrescriptions: false,
      canDispenseRestrictedDrugs: false,
      canAccessAfterHours: false,
      isAccessRevoked: false,
      accessibleModules: ['patient-registration', 'hospital-billing', 'radiology-imaging']
    }
  }
};

export const AVAILABLE_MODULES: { id: string; label: string; icon: string; category: string }[] = [
  { id: 'patient-registration', label: 'Patient Registration & Token Desk', icon: '⚡', category: 'Front Desk' },
  { id: 'encounters-visits', label: 'OPD Queue & Appointments', icon: '📋', category: 'Clinical OPD' },
  { id: 'doctor-management', label: 'Doctor Express OPD Desk', icon: '🩺', category: 'Clinical OPD' },
  { id: 'nurse-triage-station', label: 'Nurse Vitals & Triage Station', icon: '❤️', category: 'Nursing' },
  { id: 'inpatient-management', label: 'Inpatient (ADT) & Bed Board', icon: '🛏️', category: 'Inpatient IPD' },
  { id: 'emergency-triage', label: 'Emergency & Red-Zone Triage', icon: '🚨', category: 'Emergency' },
  { id: 'pharmacy-medication', label: 'Pharmacy & Dispensing Counter', icon: '💊', category: 'Pharmacy' },
  { id: 'clinical-investigation', label: 'Diagnostic Pathology & LIS Reports', icon: '🔬', category: 'Diagnostics' },
  { id: 'radiology-imaging', label: 'Radiology PACS & DICOM Imaging', icon: '☢️', category: 'Diagnostics' },
  { id: 'hospital-billing', label: 'Cashier POS & Central Invoicing', icon: '💰', category: 'Billing' },
  { id: 'insurance-tpa', label: 'TPA Claims & NHCX Gateway', icon: '🛡️', category: 'Billing' },
  { id: 'inventory-supplies', label: 'Procurement & Stock Inventory', icon: '📦', category: 'Operations' },
  { id: 'blood-bank', label: 'Blood Bank Command Center', icon: '🩸', category: 'Operations' },
  { id: 'asset-biomedical', label: 'Biomedical Asset Maintenance', icon: '⚙️', category: 'Operations' },
  { id: 'teleconsult-desk', label: 'Teleconsultation Video Desk', icon: '📹', category: 'Clinical OPD' },
  { id: 'staff-management', label: 'Staff Administration & Directory', icon: '👥', category: 'Administration' }
];

export function getRolesForCategory(category: PartnerCategory): RolePresetDefinition[] {
  return Object.values(ROLE_PRESETS).filter((r) => r.category === category);
}

export function getPartnerCategoryForWorkspace(
  workspace?: string,
  partnerType?: string
): PartnerCategory | null {
  const target = (workspace || partnerType || '').toUpperCase().trim();
  if (target.includes('PHARMAC')) return 'PHARMACY';
  if (target.includes('RADIOLOG') || target.includes('IMAGING') || target.includes('DIAGNOSTIC_CENTRE')) return 'DIAGNOSTIC_CENTRE';
  if (target.includes('PATHOLOG') || target.includes('LAB') || target.includes('DIAGNOSTIC')) return 'PATHOLOGY';
  if (target.includes('CLINIC')) return 'INDEPENDENT_CLINIC';
  if (target.includes('HOSPITAL')) return 'MULTI_SPECIALITY_HOSPITAL';
  return null; // Enterprise Command / Multi-facility Super Admin
}

export function getDefaultPermissionsForRole(_category: PartnerCategory, roleKey: string): StaffPermissions {
  const preset = ROLE_PRESETS[roleKey];
  if (preset) {
    return JSON.parse(JSON.stringify(preset.defaultPermissions));
  }
  // Generic fallback if unknown
  return {
    canExportPatientData: false,
    canViewFullPhoneNumber: false,
    canGiveDiscounts: false,
    maxDiscountPercent: 0,
    canCancelOrRefundBills: false,
    requiresShiftHandoverSignoff: false,
    canSignLabReports: false,
    canSignPrescriptions: false,
    canDispenseRestrictedDrugs: false,
    canAccessAfterHours: false,
    isAccessRevoked: false,
    accessibleModules: ['patient-registration', 'hospital-billing']
  };
}
