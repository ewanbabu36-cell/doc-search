import { type HealthOSAppItem } from './health-os-types.js';
import type { OrganizationWorkspaceType } from '../auth/HospitalStaffLogin.js';

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
 * Filter profile-specific core homescreen applications.
 */
export function getCoreAppsForProfile(profile: OrganizationWorkspaceType = 'HOSPITAL'): HealthOSAppItem[] {
  const apps = getAppsForProfile(profile);

  // Profile-specific home application layouts
  switch (profile) {
    case 'CLINIC':
      return apps.filter((a) =>
        ['clinical-consultation', 'encounters-visits', 'patient-portal', 'billing-revenue-cycle', 'abdm-fhir', 'telemedicine-rpm', 'staff-administration'].includes(a.id)
      );

    case 'PATHOLOGY':
      return apps.filter((a) =>
        ['clinical-investigation', 'patient-registration', 'billing-revenue-cycle', 'whatsapp-portal', 'abdm-fhir', 'staff-administration', 'offers-rewards-hub'].includes(a.id)
      );

    case 'PHARMACY':
      return apps.filter((a) =>
        ['pharmacy-medication', 'billing-revenue-cycle', 'whatsapp-portal', 'staff-administration', 'offers-rewards-hub', 'patient-portal'].includes(a.id)
      );

    case 'HOSPITAL':
    default:
      return apps.filter((a) =>
        ['inpatient-management', 'encounters-visits', 'clinical-consultation', 'billing-revenue-cycle', 'pharmacy-medication', 'clinical-investigation', 'staff-administration'].includes(a.id)
      );
  }
}
