import { type HealthOSAppItem, type StaffRolePersona } from './health-os-types.js';
import type { OrganizationWorkspaceType } from '../auth/HospitalStaffLogin.js';

export { type StaffRolePersona } from './health-os-types.js';

/**
 * Normalizes any role string (e.g. 'CARDIOLOGIST', 'FRONT_DESK_EXECUTIVE', 'CHIEF_NURSE')
 * into an authoritative StaffRolePersona.
 */
export function resolveStaffPersona(role?: string): StaffRolePersona {
  const r = (role || '').toUpperCase();
  if (!r) return 'DOCTOR';
  if (
    r.includes('ADMIN') ||
    r.includes('EXECUTIVE') ||
    r.includes('DIRECTOR') ||
    r.includes('SUPER') ||
    r.includes('FOUNDER') ||
    r.includes('MANAGEMENT') ||
    r.includes('CMO') ||
    r.includes('SUPERINTENDENT')
  ) {
    return 'HOSPITAL_ADMIN';
  }
  if (r.includes('NURSE') || r.includes('WARD') || r.includes('MATRON') || r.includes('SISTER')) {
    return 'NURSE';
  }
  if (r.includes('PHARMAC') || r.includes('CHEMIST') || r.includes('DRUGGIST') || r.includes('DISPENSER') || r.includes('AUSHADHI')) {
    return 'PHARMACIST';
  }
  if (
    r.includes('RADIO') ||
    r.includes('IMAG') ||
    r.includes('XRAY') ||
    r.includes('X-RAY') ||
    r.includes('CT') ||
    r.includes('MRI') ||
    r.includes('SONO') ||
    r.includes('SCAN')
  ) {
    return 'RADIOLOGIST';
  }
  if (
    r.includes('LAB') ||
    r.includes('PATHO') ||
    r.includes('PHLEBOTOM') ||
    r.includes('BIOCHEM') ||
    r.includes('MICROBIO') ||
    r.includes('HISTOPATH') ||
    r.includes('TECHNICIAN')
  ) {
    return 'LAB_TECHNICIAN';
  }
  if (r.includes('CASHIER') || r.includes('BILLING') || r.includes('ACCOUNTS') || r.includes('FINANCE')) {
    return 'CASHIER';
  }
  if (
    r.includes('RECEPT') ||
    r.includes('FRONT') ||
    r.includes('DESK') ||
    r.includes('REGISTR') ||
    r.includes('TOKEN') ||
    r.includes('CLERK') ||
    r.includes('ADMISSION')
  ) {
    return 'RECEPTIONIST';
  }
  // Default to DOCTOR for all clinicians, physicians, surgeons, specialists, consultants
  return 'DOCTOR';
}

export const HEALTH_OS_APPS: HealthOSAppItem[] = [
  // --- 1. BILLING & COLLECTIONS ---
  {
    id: 'billing-revenue-cycle',
    label: 'Billing & Cashier Collections',
    shortLabel: 'Billing',
    category: 'CORE',
    icon: '💳',
    gradient: 'from-blue-600 to-indigo-700',
    route: '/partner/billing',
    description: 'OPD receipt billing, cashier counter collections, refunds & TPA claims',
    badge: '₹1.48L Today',
    isCoreHomeApp: true,
    applicableProfiles: ['HOSPITAL', 'CLINIC', 'PATHOLOGY', 'PHARMACY', 'DIAGNOSTIC_CENTRE', 'ENTERPRISE_COMMAND'],
    applicableRoles: ['CASHIER', 'RECEPTIONIST', 'HOSPITAL_ADMIN'],
  },

  // --- 2. APPOINTMENTS & OPD QUEUE ---
  {
    id: 'encounters-visits',
    label: 'Appointments & OPD Queue',
    shortLabel: 'OPD Queue',
    category: 'CORE',
    icon: '📅',
    gradient: 'from-sky-500 to-blue-600',
    route: '/partner/clinical/encounters',
    description: 'Token calling system, patient check-in & waiting room TV sync',
    badge: 'Token #42',
    isCoreHomeApp: true,
    applicableProfiles: ['HOSPITAL', 'CLINIC', 'ENTERPRISE_COMMAND'],
    applicableRoles: ['DOCTOR', 'NURSE', 'RECEPTIONIST', 'CASHIER', 'RADIOLOGIST', 'HOSPITAL_ADMIN'],
  },

  // --- 3. CLINICAL CONSULTATION & SMART RX PAD ---
  {
    id: 'clinical-consultation',
    label: 'Clinical Consultation & Smart Rx Pad',
    shortLabel: 'Smart Rx Pad',
    category: 'CORE',
    icon: '🩺',
    gradient: 'from-emerald-500 to-teal-700',
    route: '/partner/clinical/consultations',
    description: 'Digital EMR desk, voice scribe, ICD-10 notes & rapid prescription pad',
    badge: 'Active Desk',
    isCoreHomeApp: true,
    applicableProfiles: ['HOSPITAL', 'CLINIC', 'ENTERPRISE_COMMAND'],
    applicableRoles: ['DOCTOR', 'HOSPITAL_ADMIN'],
  },

  // --- 4. PHARMACY DISPENSARY & LIVE STOCK ---
  {
    id: 'pharmacy-medication',
    label: 'Pharmacy Dispensary & Live Stock',
    shortLabel: 'Pharmacy POS',
    category: 'CORE',
    icon: '💊',
    gradient: 'from-purple-600 to-indigo-800',
    route: '/partner/pharmacy',
    description: 'Real-time medicine batch stock, Schedule H1 drug register & dispensing',
    badge: 'Stock Live',
    isCoreHomeApp: true,
    applicableProfiles: ['HOSPITAL', 'PHARMACY', 'ENTERPRISE_COMMAND'],
    applicableRoles: ['PHARMACIST', 'HOSPITAL_ADMIN'],
  },

  // --- 5. DIAGNOSTIC PATHOLOGY & LIMS ---
  {
    id: 'clinical-investigation',
    label: 'Diagnostic Pathology & Lab',
    shortLabel: 'Lab & LIMS',
    category: 'CORE',
    icon: '🧪',
    gradient: 'from-amber-500 to-orange-600',
    route: '/partner/lab',
    description: 'Diagnostic specimen collection, barcode accession & verified lab reports',
    badge: '18 Orders',
    isCoreHomeApp: true,
    applicableProfiles: ['HOSPITAL', 'PATHOLOGY', 'DIAGNOSTIC_CENTRE', 'ENTERPRISE_COMMAND'],
    applicableRoles: ['LAB_TECHNICIAN', 'RADIOLOGIST', 'HOSPITAL_ADMIN'],
  },

  // --- 6. INPATIENT WARD & BED CENSUS ---
  {
    id: 'inpatient-management',
    label: 'Inpatient Ward & Bed Census',
    shortLabel: 'Inpatient Ward',
    category: 'CORE',
    icon: '🛏️',
    gradient: 'from-rose-500 to-red-700',
    route: '/partner/inpatient',
    description: 'Bed census HUD, nurse rounds, admission-discharge-transfer (ADT) & ICU',
    badge: '82% Occupied',
    isCoreHomeApp: true,
    applicableProfiles: ['HOSPITAL', 'ENTERPRISE_COMMAND'],
    applicableRoles: ['NURSE', 'DOCTOR', 'HOSPITAL_ADMIN'],
  },

  // --- 7. SETTINGS & ADMINISTRATION ---
  {
    id: 'staff-administration',
    label: 'Facility Settings & Staff Roster',
    shortLabel: 'Settings & Admin',
    category: 'CORE',
    icon: '⚙️',
    gradient: 'from-slate-700 to-slate-900',
    route: '/partner/executive',
    description: 'Doctor duty scheduling, department configuration & role security',
    badge: 'Config',
    isCoreHomeApp: true,
    applicableProfiles: ['HOSPITAL', 'CLINIC', 'PATHOLOGY', 'PHARMACY', 'DIAGNOSTIC_CENTRE', 'ENTERPRISE_COMMAND'],
    applicableRoles: ['HOSPITAL_ADMIN'],
  },

  // --- 8. PATIENT REGISTRATION & FRONT DESK ---
  {
    id: 'patient-registration',
    label: 'Patient Registration & Front Desk',
    shortLabel: 'Registration',
    category: 'OPERATIONS',
    icon: '📋',
    gradient: 'from-teal-600 to-emerald-800',
    route: '/partner/registration',
    description: 'Fast OPD registration, biometric ABHA lookup & photo capture',
    applicableProfiles: ['HOSPITAL', 'CLINIC', 'PATHOLOGY', 'ENTERPRISE_COMMAND'],
    applicableRoles: ['RECEPTIONIST', 'HOSPITAL_ADMIN'],
  },

  // --- 9. PATIENT HEALTH 360 & ABHA LOCKER ---
  {
    id: 'patient-portal',
    label: 'Patient Health 360 & ABHA Locker',
    shortLabel: 'Patient 360',
    category: 'CLINICAL',
    icon: '👤',
    gradient: 'from-sky-600 to-blue-800',
    route: '/partner/patient-portal',
    description: 'Self-service digital health records, active prescriptions, appointments & ABHA',
    badge: 'ABHA Linked',
    isCoreHomeApp: true,
    applicableProfiles: ['HOSPITAL', 'CLINIC', 'PATHOLOGY', 'PHARMACY', 'ENTERPRISE_COMMAND'],
    applicableRoles: ['DOCTOR', 'RECEPTIONIST', 'HOSPITAL_ADMIN'],
  },

  // --- 10. EMERGENCY & MANCHESTER TRIAGE ---
  {
    id: 'emergency-trauma',
    label: 'Emergency & Manchester Triage',
    shortLabel: 'Emergency',
    category: 'CLINICAL',
    icon: '🚨',
    gradient: 'from-red-600 to-rose-900',
    route: '/partner/emergency',
    description: '5-level Manchester triage, trauma resuscitation & red-alert bed sync',
    badge: 'Code Blue Ready',
    applicableProfiles: ['HOSPITAL', 'ENTERPRISE_COMMAND'],
    applicableRoles: ['DOCTOR', 'NURSE', 'HOSPITAL_ADMIN'],
  },

  // --- 11. RADIOLOGY IMAGING & DICOM PACS ---
  {
    id: 'radiology-pacs',
    label: 'Radiology Imaging & DICOM PACS',
    shortLabel: 'Radiology',
    category: 'DIAGNOSTICS',
    icon: '🩻',
    gradient: 'from-cyan-600 to-blue-800',
    route: '/partner/radiology',
    description: 'X-Ray, CT, MRI study viewer with web DICOM zero-footprint viewer',
    applicableProfiles: ['HOSPITAL', 'DIAGNOSTIC_CENTRE', 'ENTERPRISE_COMMAND'],
    applicableRoles: ['RADIOLOGIST', 'DOCTOR', 'HOSPITAL_ADMIN'],
  },

  // --- 12. OPERATION THEATRE SUITES ---
  {
    id: 'ot-management',
    label: 'Operation Theatre & Surgery Suites',
    shortLabel: 'OT Suites',
    category: 'CLINICAL',
    icon: '🔪',
    gradient: 'from-violet-600 to-purple-800',
    route: '/partner/ot',
    description: 'Surgical scheduling, anaesthesia charts, PAC clearances & post-op recovery',
    applicableProfiles: ['HOSPITAL', 'ENTERPRISE_COMMAND'],
    applicableRoles: ['DOCTOR', 'NURSE', 'HOSPITAL_ADMIN'],
  },

  // --- 13. BLOOD BANK & DONOR TRANSFUSION ---
  {
    id: 'blood-bank',
    label: 'Blood Bank & Donor Transfusion',
    shortLabel: 'Blood Bank',
    category: 'OPERATIONS',
    icon: '🩸',
    gradient: 'from-red-700 to-rose-950',
    route: '/partner/blood-bank',
    description: 'Cross-matching, component inventory (PRBC, FFP, Platelets) & transfusion safety',
    applicableProfiles: ['HOSPITAL', 'ENTERPRISE_COMMAND'],
    applicableRoles: ['DOCTOR', 'NURSE', 'HOSPITAL_ADMIN'],
  },

  // --- 14. TELEMEDICINE & REMOTE CLINIC ---
  {
    id: 'telemedicine-rpm',
    label: 'Telemedicine & Remote Monitoring',
    shortLabel: 'Telehealth',
    category: 'CLINICAL',
    icon: '📹',
    gradient: 'from-blue-500 to-indigo-600',
    route: '/partner/telemedicine',
    description: 'Encrypted HD video consultations with real-time patient vitals HUD',
    applicableProfiles: ['HOSPITAL', 'CLINIC', 'ENTERPRISE_COMMAND'],
    applicableRoles: ['DOCTOR', 'HOSPITAL_ADMIN'],
  },

  // --- 15. ABDM AYUSHMAN BHARAT GATEWAY ---
  {
    id: 'abdm-fhir',
    label: 'ABDM Ayushman Bharat & FHIR Gate',
    shortLabel: 'ABDM FHIR',
    category: 'OPERATIONS',
    icon: '🇮🇳',
    gradient: 'from-orange-500 to-amber-700',
    route: '/partner/abdm',
    description: 'ABHA creation, Scan & Share counter QR and Ayushman PM-JAY claims',
    applicableProfiles: ['HOSPITAL', 'CLINIC', 'PATHOLOGY', 'ENTERPRISE_COMMAND'],
    applicableRoles: ['RECEPTIONIST', 'DOCTOR', 'LAB_TECHNICIAN', 'HOSPITAL_ADMIN'],
  },

  // --- 16. AI CLINICAL COPILOT & CDSS ---
  {
    id: 'ai-cdss',
    label: 'AI Clinical Decision Support (CDSS)',
    shortLabel: 'AI Copilot',
    category: 'CLINICAL',
    icon: '🧠',
    gradient: 'from-indigo-600 to-purple-800',
    route: '/partner/ai-cdss',
    description: 'Evidence-based differential diagnoses, antibiotic stewardship & drug interactions',
    applicableProfiles: ['HOSPITAL', 'CLINIC', 'ENTERPRISE_COMMAND'],
    applicableRoles: ['DOCTOR', 'RADIOLOGIST', 'HOSPITAL_ADMIN'],
  },

  // --- 17. WHATSAPP PATIENT AUTOMATED DISPATCH ---
  {
    id: 'whatsapp-portal',
    label: 'WhatsApp Patient Automated Dispatch',
    shortLabel: 'WhatsApp Hub',
    category: 'OPERATIONS',
    icon: '💬',
    gradient: 'from-emerald-600 to-green-700',
    route: '/partner/whatsapp',
    description: 'Instant PDF prescriptions, lab result dispatch & appointment reminders',
    applicableProfiles: ['HOSPITAL', 'CLINIC', 'PATHOLOGY', 'PHARMACY', 'ENTERPRISE_COMMAND'],
    applicableRoles: ['RECEPTIONIST', 'PHARMACIST', 'LAB_TECHNICIAN', 'HOSPITAL_ADMIN'],
  },

  // --- 18. EXECUTIVE COMMAND & ANALYTICS ---
  {
    id: 'executive-command-center',
    label: 'Executive Command & Operations Analytics',
    shortLabel: 'Analytics',
    category: 'EXECUTIVE',
    icon: '📊',
    gradient: 'from-slate-800 to-zinc-950',
    route: '/partner/analytics',
    description: 'Facility EBITDA, turnaround times, average wait times & doctor occupancy',
    applicableProfiles: ['HOSPITAL', 'PATHOLOGY', 'ENTERPRISE_COMMAND'],
    applicableRoles: ['HOSPITAL_ADMIN'],
  },

  // --- 19. FACTORY-DIRECT WHOLESALE SOURCING DEPOT ---
  {
    id: 'offers-rewards-hub',
    label: 'Factory-Direct Sourcing Depot (40%-70% Off)',
    shortLabel: 'Sourcing Depot',
    category: 'EXECUTIVE',
    icon: '🎁',
    gradient: 'from-amber-600 to-yellow-700',
    route: '/partner/rewards',
    description: 'Wholesale factory-rate medicine, pathology reagents and surgical replenishment',
    applicableProfiles: ['HOSPITAL', 'CLINIC', 'PATHOLOGY', 'PHARMACY', 'ENTERPRISE_COMMAND'],
    applicableRoles: ['PHARMACIST', 'HOSPITAL_ADMIN'],
  },
];

/**
 * Filter all applications strictly matching the active organization profile.
 * Prevents cross-contamination between Hospital, Clinic, Pathology, and Pharmacy.
 */
export function getAppsForProfile(profile: OrganizationWorkspaceType = 'HOSPITAL'): HealthOSAppItem[] {
  const normalized = profile.toUpperCase() as OrganizationWorkspaceType;
  return HEALTH_OS_APPS.filter((app) => app.applicableProfiles.includes(normalized));
}

/**
 * Filter applications matching both the organization profile AND the staff user's role.
 * Enforces HIPAA Minimum Necessary and NABH least-privilege scoping.
 */
export function getAppsForStaff(
  profile: OrganizationWorkspaceType = 'HOSPITAL',
  role?: string
): HealthOSAppItem[] {
  const orgApps = getAppsForProfile(profile);
  const persona = resolveStaffPersona(role);

  // SuperAdmins, Medical Directors and Hospital Administrators see everything in their facility
  if (persona === 'HOSPITAL_ADMIN') {
    return orgApps;
  }

  // Counter & Clinical staff see only applications explicitly granted to their role
  return orgApps.filter(
    (app) => !app.applicableRoles || app.applicableRoles.includes(persona)
  );
}

/**
 * Filter profile- and role-specific core homescreen applications.
 */
export function getCoreAppsForStaff(
  profile: OrganizationWorkspaceType = 'HOSPITAL',
  role?: string
): HealthOSAppItem[] {
  const persona = resolveStaffPersona(role);
  const staffApps = getAppsForStaff(profile, role);

  // Standalone Specialized Facilities retain domain-specific home apps
  switch (profile) {
    case 'CLINIC':
      return staffApps.filter((a) =>
        ['clinical-consultation', 'encounters-visits', 'patient-portal', 'billing-revenue-cycle', 'abdm-fhir', 'telemedicine-rpm'].includes(a.id)
      );

    case 'PATHOLOGY':
      return staffApps.filter((a) =>
        ['clinical-investigation', 'patient-registration', 'whatsapp-portal', 'abdm-fhir', 'offers-rewards-hub'].includes(a.id)
      );

    case 'PHARMACY':
      return staffApps.filter((a) =>
        ['pharmacy-medication', 'whatsapp-portal', 'offers-rewards-hub', 'patient-portal'].includes(a.id)
      );

    case 'HOSPITAL':
    default:
      // Multi-Specialty Hospital: Tailor homescreen strictly to staff persona
      switch (persona) {
        case 'DOCTOR':
          return staffApps.filter((a) =>
            ['clinical-consultation', 'encounters-visits', 'patient-portal', 'telemedicine-rpm'].includes(a.id)
          );

        case 'NURSE':
          return staffApps.filter((a) =>
            ['inpatient-management', 'emergency-trauma', 'encounters-visits'].includes(a.id)
          );

        case 'RECEPTIONIST':
          return staffApps.filter((a) =>
            ['patient-registration', 'encounters-visits', 'patient-portal'].includes(a.id)
          );

        case 'CASHIER':
          return staffApps.filter((a) =>
            ['billing-revenue-cycle', 'encounters-visits'].includes(a.id)
          );

        case 'PHARMACIST':
          return staffApps.filter((a) =>
            ['pharmacy-medication', 'whatsapp-portal', 'offers-rewards-hub'].includes(a.id)
          );

        case 'LAB_TECHNICIAN':
          return staffApps.filter((a) =>
            ['clinical-investigation', 'patient-registration', 'whatsapp-portal'].includes(a.id)
          );

        case 'RADIOLOGIST':
          return staffApps.filter((a) =>
            ['radiology-pacs', 'encounters-visits', 'clinical-investigation', 'ai-cdss'].includes(a.id)
          );

        case 'HOSPITAL_ADMIN':
        default:
          return staffApps.filter((a) =>
            [
              'inpatient-management',
              'encounters-visits',
              'clinical-consultation',
              'billing-revenue-cycle',
              'pharmacy-medication',
              'clinical-investigation',
              'staff-administration',
            ].includes(a.id)
          );
      }
  }
}

/**
 * Backward compatibility alias for legacy callers.
 */
export function getCoreAppsForProfile(profile: OrganizationWorkspaceType = 'HOSPITAL'): HealthOSAppItem[] {
  return getCoreAppsForStaff(profile, 'HOSPITAL_ADMIN');
}
