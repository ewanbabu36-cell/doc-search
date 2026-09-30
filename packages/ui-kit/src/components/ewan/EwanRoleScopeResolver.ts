/**
 * EWAN — DOC SEARCH SYSTEM MASTER TRAINER
 * Role Scope Resolver & Context-Aware Boundary Enforcement Engine.
 *
 * MISSION:
 * Enforces strict, zero-hallucination role boundaries, context awareness, and verified
 * operational workflows across DOC SEARCH Hospital SaaS.
 *
 * ABSOLUTE RULE:
 * Real DOC SEARCH implementation, database, entitlements, and RBAC remain the source of truth.
 * Ewan is NOT allowed to invent system behavior or bypass role boundaries.
 */

export type EwanRoleCategory =
  | 'FRONT_DESK'
  | 'CLINICAL'
  | 'NURSING'
  | 'PHARMACY'
  | 'DIAGNOSTICS'
  | 'BILLING'
  | 'EXECUTIVE'
  | 'GENERAL';

export interface EwanUserContext {
  id?: string | undefined;
  name?: string | undefined;
  email?: string | undefined;
  role?: string | undefined;
  roleTitle?: string | undefined;
  department?: string | undefined;
  tenantName?: string | undefined;
  tenantId?: string | undefined;
  organizationType?: string | undefined;
  accessibleFeatures?: string[] | undefined;
  restrictedFeatures?: string[] | undefined;
  permissions?: Record<string, boolean> | string[] | undefined;
}

export interface EwanRoleScopeEvaluation {
  resolvedRole: string;
  category: EwanRoleCategory;
  categoryLabel: string;
  isBoundaryViolation: boolean;
  boundaryMessage?: string | undefined;
  handoffGuidance?: {
    boundaryNote: string;
    steps: string[];
    nextActionUrl?: string | undefined;
  } | undefined;
  verifiedGuidance?: {
    title: string;
    summary: string;
    steps: string[];
    actionKey?: string | undefined;
  } | undefined;
  mode: 'NORMAL' | 'BOUNDARY_REDIRECT' | 'ROLE_SCOPE' | 'NEXT_STEP' | 'TROUBLESHOOT' | 'JAILBREAK_REFUSED' | 'UNKNOWN';
  rawResponseText?: string | undefined;
}

interface RolePreset {
  category: EwanRoleCategory;
  categoryLabel: string;
  defaultTitle: string;
  accessibleFeatures: string[];
  restrictedFeatures: string[];
  defaultHandoffs: {
    doctorHandoff?: { boundaryNote: string; steps: string[] };
    pharmacyHandoff?: { boundaryNote: string; steps: string[] };
    billingHandoff?: { boundaryNote: string; steps: string[] };
  };
}

export const EWAN_ROLE_PRESETS: Record<string, RolePreset> = {
  RECEPTIONIST: {
    category: 'FRONT_DESK',
    categoryLabel: 'Front Desk & Reception',
    defaultTitle: 'Front Desk Receptionist',
    accessibleFeatures: [
      'Patient Demographic Entry & MPI Lookup',
      'ABDM Counter QR & ABHA Creation / Verification',
      'Doctor Appointment Booking & Slot Scheduling',
      'Fast 30s OPD Token Generation & Thermal Slip Print',
      'OPD Check-in Status Tracking & TV Queue Calling',
      'WhatsApp Appointment & Token Dispatch'
    ],
    restrictedFeatures: [
      'Clinical Consultation & SOAP Notes',
      'Digital e-Prescriptions (Rx)',
      'Lab & Radiology Investigation Ordering',
      'Financial Ledger & GST Invoice Final Edits'
    ],
    defaultHandoffs: {
      doctorHandoff: {
        boundaryNote:
          'Consultation Doctor-role workflow ka part hai. Aapke current Reception scope mein main patient ko Doctor stage tak correctly process/handoff karne ka verified workflow bata sakta hoon.',
        steps: [
          '1. Step 1 (Demographics & MPI): Patient name & 10-digit mobile number enter karke existing records search karein.',
          '2. Step 2 (ABHA Verification): ABHA address verify karein ya new ABHA card create karein.',
          '3. Step 3 (Doctor & Slot Selection): Department aur Doctor select karke OPD Queue Token generate karein.',
          '4. Step 4 (Thermal Slip & Transfer): Thermal Token Slip print karein aur patient ko Doctor OPD waiting queue mein transfer karein (TV calling screen par live display hoga).'
        ]
      },
      pharmacyHandoff: {
        boundaryNote:
          'Pharmacy POS aur medicine dispensing Pharmacy-role ka part hai. Reception se patient token generate karke Doctor desk par bhejta hai, jahan se Rx Pharmacy ko route hoti hai.',
        steps: [
          '1. Step 1: Patient ka OPD token check karein.',
          '2. Step 2: Patient ko Doctor desk complete karne ki guidance dein.',
          '3. Step 3: Doctor dwara Rx finalize hone ke baad Pharmacy counter forward karein.'
        ]
      }
    }
  },
  FRONT_DESK_LEAD: {
    category: 'FRONT_DESK',
    categoryLabel: 'Front Desk & Reception',
    defaultTitle: 'Front Desk Lead & OPD Incharge',
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
    defaultHandoffs: {
      doctorHandoff: {
        boundaryNote:
          'Consultation Doctor-role workflow ka part hai. Aapke current Reception scope mein main patient ko Doctor stage tak correctly process/handoff karne ka verified workflow bata sakta hoon.',
        steps: [
          '1. Step 1 (Demographics & MPI): Patient name & 10-digit mobile number enter karke existing records search karein.',
          '2. Step 2 (ABHA Verification): ABHA address verify karein ya new ABHA card create karein.',
          '3. Step 3 (Doctor & Slot Selection): Department aur Doctor select karke OPD Queue Token generate karein.',
          '4. Step 4 (Thermal Slip & Transfer): Thermal Token Slip print karein aur patient ko Doctor OPD waiting queue mein transfer karein (TV calling screen par live display hoga).'
        ]
      }
    }
  },
  DOCTOR: {
    category: 'CLINICAL',
    categoryLabel: 'Clinical & Specialist Care',
    defaultTitle: 'Attending Doctor / Physician',
    accessibleFeatures: [
      'Patient EMR, Vitals, Allergies & Active Problem List',
      'Digital SOAP Notes (Subjective, Objective, Assessment, Plan)',
      'Digital e-Prescription (Rx) with Smart Dosage & Duration',
      'Drug-Drug Interaction (DDI) & CDSS Safety Alerts',
      'Ambient AI Voice Scribe Dictation',
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
    defaultHandoffs: {}
  },
  ATTENDING_DOCTOR: {
    category: 'CLINICAL',
    categoryLabel: 'Clinical & Specialist Care',
    defaultTitle: 'Attending Doctor / Consultant Physician',
    accessibleFeatures: [
      'Patient EMR, Vitals, Allergies & Active Problem List',
      'Digital SOAP Notes (Subjective, Objective, Assessment, Plan)',
      'Digital e-Prescription (Rx) with Smart Dosage & Duration',
      'Drug-Drug Interaction (DDI) & CDSS Safety Alerts',
      'Ambient AI Voice Scribe Dictation',
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
    defaultHandoffs: {}
  },
  SURGEON: {
    category: 'CLINICAL',
    categoryLabel: 'Clinical & Specialist Care',
    defaultTitle: 'Specialist Surgeon & OT Incharge',
    accessibleFeatures: [
      'OT Surgery Scheduling & PAC Clearance',
      'Operative Surgical Notes & Implant Documentation',
      'Blood Bank Cross-Match Requests',
      'Pre-Op CT/MRI PACS DICOM Review',
      'Clinical Consultation & Surgical Rx'
    ],
    restrictedFeatures: [
      'Retail Pharmacy Billing',
      'General Cashier Reconciliation'
    ],
    defaultHandoffs: {}
  },
  CHARGE_NURSE: {
    category: 'NURSING',
    categoryLabel: 'Nursing & Ward Care',
    defaultTitle: 'Charge Nurse / Ward Incharge',
    accessibleFeatures: [
      'Inpatient Bed Status & Ward Census Overview',
      'Bedside Vital Signs Recording (BP, SpO2, Pulse, Temp, NEWS2)',
      'Bedside eMAR Medication Administration Record & Dispense Confirm',
      'Emergency Crash Cart Checklist & Narcotic Drug Logbook',
      'Inpatient Shift Handover SBAR Protocol & Doctor Round Assistance'
    ],
    restrictedFeatures: [
      'Independent Clinical Diagnosis Formulation',
      'Primary Drug Prescription Authoring',
      'Final IPD Financial Discharge Settlement'
    ],
    defaultHandoffs: {
      doctorHandoff: {
        boundaryNote:
          'Prescription authoring aur primary clinical diagnosis Doctor-role ka part hai. Aapke Nursing scope mein Vitals capture (BP, Pulse, NEWS2), Triage scoring aur Doctor rounds support karne ka verified workflow available hai.',
        steps: [
          '1. Step 1: Patient ke vitals (BP, SpO2, Pulse, Temp) capture karein.',
          '2. Step 2: NEWS2 clinical deterioration score calculate karein.',
          '3. Step 3: Triage vitals alert Doctor OPD Desk / Ward round ko forward karein.'
        ]
      }
    }
  },
  PHARMACIST: {
    category: 'PHARMACY',
    categoryLabel: 'Pharmacy & Dispensing',
    defaultTitle: 'Hospital Pharmacist & POS Cashier',
    accessibleFeatures: [
      'Doctor Digital e-Prescription Queue & Barcode Scan',
      'Medicine Dispense Confirmation with Batch Expiry (FIFO)',
      'Schedule H & H1 Drug Dispensing Statutory Register',
      'Retail Pharmacy POS Cash & Dynamic UPI QR Billing',
      'Pharmacy Stock Reorder Alert & Near-Expiry Alerts'
    ],
    restrictedFeatures: [
      'Modifying Doctor Prescribed Dosages Without Clarification',
      'Primary Patient Demographic Creation',
      'Altering Inpatient Bed Allocations'
    ],
    defaultHandoffs: {}
  },
  PATHOLOGIST: {
    category: 'DIAGNOSTICS',
    categoryLabel: 'Pathology & LIMS Diagnostics',
    defaultTitle: 'Consultant Pathologist & Lab Director',
    accessibleFeatures: [
      'LIMS Test Sample Barcode Accessioning & Status Tracking',
      'Direct Analyzer Machine Interface (LIS ASTM / HL7)',
      'Quantitative & Qualitative Test Result Entry',
      'Critical Panic Value Red Alert Broadcast to Attending Doctor',
      'Digital Pathologist Report Authorization & Sign-Off'
    ],
    restrictedFeatures: [
      'Independent Clinical Prescription Writing',
      'Retail Pharmacy Bill Settlement',
      'General Hospital Cashier Ledger Balancing'
    ],
    defaultHandoffs: {
      pharmacyHandoff: {
        boundaryNote:
          'Pharmacy billing aur medicine dispensing Pharmacy-role ka part hai. Lab technicians specimen analysis aur report release tak perform karte hain.',
        steps: [
          '1. Step 1: Specimen barcode scan karke test values finalize karein.',
          '2. Step 2: Digital report sign-off karein jo patient portal par sync hoti hai.',
          '3. Step 3: Patient ko Pharmacy counter par forward karein.'
        ]
      }
    }
  },
  BILLING_EXECUTIVE: {
    category: 'BILLING',
    categoryLabel: 'Billing, Cashier & Revenue Cycle',
    defaultTitle: 'Cashier & Billing Desk Executive',
    accessibleFeatures: [
      'OPD Consultation Fee Collection & Dynamic UPI QR Generation',
      'Cash, Card, UPI, and Split Payment Settlement',
      'B2C Tax Invoice Printing with CEA & GST Statutory Details',
      'IPD Advance Deposit Receipting & Interim Estimate Slip',
      'Daily Cash Drawer Reconciliation & Shift Handover'
    ],
    restrictedFeatures: [
      'Modifying Clinical Records or Diagnosis Codes',
      'Authorizing Pharmacy Medicine Returns Without Pharmacist Approval',
      'Initiating Patient Discharge Without Doctor Clearance'
    ],
    defaultHandoffs: {}
  },
  SUPER_ADMIN: {
    category: 'EXECUTIVE',
    categoryLabel: 'Executive & System Administration',
    defaultTitle: 'Super Administrator / System Architect',
    accessibleFeatures: [
      'SaaS Subscription Plans & Quotas',
      'Partner KYC 1-Click Verification',
      'Staff RBAC Security & Forensic Watermark Trace',
      'Cluster Infrastructure Telemetry & Safe CRUD'
    ],
    restrictedFeatures: [],
    defaultHandoffs: {}
  }
};

/**
 * Normalizes any arbitrary role string to a known category.
 */
export function normalizeRoleCategory(role?: string): {
  normalizedRole: string;
  category: EwanRoleCategory;
  categoryLabel: string;
  roleTitle: string;
} {
  if (!role) {
    return {
      normalizedRole: 'RECEPTIONIST',
      category: 'FRONT_DESK',
      categoryLabel: 'Front Desk & Reception',
      roleTitle: 'Front Desk Receptionist'
    };
  }

  const clean = role.trim().toUpperCase().replace(/[\s-]+/g, '_');

  // Direct hit in presets
  if (EWAN_ROLE_PRESETS[clean]) {
    const p = EWAN_ROLE_PRESETS[clean]!;
    return {
      normalizedRole: clean,
      category: p.category,
      categoryLabel: p.categoryLabel,
      roleTitle: p.defaultTitle
    };
  }

  // Front desk
  if (clean.includes('RECEPTION') || clean.includes('FRONT_DESK') || clean.includes('CLERK') || clean.includes('INTAKE')) {
    return {
      normalizedRole: 'RECEPTIONIST',
      category: 'FRONT_DESK',
      categoryLabel: 'Front Desk & Reception',
      roleTitle: 'Front Desk Receptionist'
    };
  }

  // Doctor / Clinical
  if (
    clean.includes('DOCTOR') ||
    clean.includes('PHYSICIAN') ||
    clean.includes('SURGEON') ||
    clean.includes('CARDIOLOGIST') ||
    clean.includes('CONSULTANT') ||
    clean.includes('CLINICAL')
  ) {
    return {
      normalizedRole: 'DOCTOR',
      category: 'CLINICAL',
      categoryLabel: 'Clinical & Specialist Care',
      roleTitle: 'Attending Doctor'
    };
  }

  // Nursing
  if (clean.includes('NURSE') || clean.includes('TRIAGE')) {
    return {
      normalizedRole: 'CHARGE_NURSE',
      category: 'NURSING',
      categoryLabel: 'Nursing & Ward Care',
      roleTitle: 'Staff Nurse'
    };
  }

  // Pharmacy
  if (clean.includes('PHARMAC') || clean.includes('DISPENS')) {
    return {
      normalizedRole: 'PHARMACIST',
      category: 'PHARMACY',
      categoryLabel: 'Pharmacy & Dispensing',
      roleTitle: 'Hospital Pharmacist'
    };
  }

  // Diagnostics / Lab
  if (clean.includes('LAB') || clean.includes('PATHOLOG') || clean.includes('RADIO') || clean.includes('LIMS')) {
    return {
      normalizedRole: 'PATHOLOGIST',
      category: 'DIAGNOSTICS',
      categoryLabel: 'Pathology & LIMS Diagnostics',
      roleTitle: 'Lab Technician'
    };
  }

  // Billing / Cashier
  if (clean.includes('BILL') || clean.includes('CASH') || clean.includes('FINANCE') || clean.includes('ACCOUNT')) {
    return {
      normalizedRole: 'BILLING_EXECUTIVE',
      category: 'BILLING',
      categoryLabel: 'Billing, Cashier & Revenue Cycle',
      roleTitle: 'Cashier & Billing Executive'
    };
  }

  // Executive / Admin
  if (
    clean.includes('ADMIN') ||
    clean.includes('DIRECTOR') ||
    clean.includes('OWNER') ||
    clean.includes('EXECUTIVE') ||
    clean.includes('MANAGER')
  ) {
    return {
      normalizedRole: 'SUPER_ADMIN',
      category: 'EXECUTIVE',
      categoryLabel: 'Executive & System Administration',
      roleTitle: 'Hospital Administrator'
    };
  }

  return {
    normalizedRole: 'RECEPTIONIST',
    category: 'GENERAL',
    categoryLabel: 'General Hospital Operations',
    roleTitle: 'Hospital Staff User'
  };
}

/**
 * Checks if query contains prompt injection or jailbreak attempts.
 */
export function isJailbreakAttempt(raw: string): boolean {
  const q = raw.toLowerCase();
  const patterns = [
    /ignore\s+(all\s+)?(previous|prior|above|system)\s+instructions/i,
    /disregard\s+(all\s+)?(rules|role|safety|boundaries)/i,
    /pretend\s+(you\s+are|to\s+be)\s+(a\s+)?(super\s*admin|ceo|founder|doctor|god)/i,
    /act\s+as\s+(a\s+)?(super\s*admin|ceo|unrestricted|jailbreak)/i,
    /you\s+are\s+now\s+in\s+(developer|dan|jailbreak)\s+mode/i,
    /bypass\s+(rbac|security|restrictions|role)/i,
    /reveal\s+(system\s+prompt|hidden\s+instructions)/i,
    /i\s+am\s+(the\s+)?(ceo|boss|admin|owner)\s*,\s*(override|teach|give)/i
  ];
  return patterns.some((p) => p.test(q));
}

/**
 * Checks if user is asking "What can I do?" or for their role scope.
 */
export function isRoleScopeQuery(raw: string): boolean {
  const q = raw.toLowerCase();
  return (
    /kya(-|\s*)kya\s+kar\s+sakta/i.test(q) ||
    /main\s+kya\s+kar\s+sakta/i.test(q) ||
    /mera\s+role/i.test(q) ||
    /my\s+role/i.test(q) ||
    /meri\s+permission/i.test(q) ||
    /my\s+permissions/i.test(q) ||
    /what\s+can\s+i\s+do/i.test(q) ||
    /role\s+scope/i.test(q) ||
    /accessible\s+features/i.test(q)
  );
}

/**
 * Checks if user is asking "What should I do next?" / Next Best Step.
 */
export function isNextStepQuery(raw: string): boolean {
  const q = raw.toLowerCase();
  return (
    /ab\s+kya\s+karna/i.test(q) ||
    /next\s+step/i.test(q) ||
    /agla\s+kadam/i.test(q) ||
    /what\s+(should\s+i\s+do\s+)?next/i.test(q) ||
    /aage\s+kya\s+karein/i.test(q) ||
    /next\s+action/i.test(q)
  );
}

/**
 * Checks if user is asking for troubleshooting / "Kaam nahi kar raha".
 */
export function isTroubleshootingQuery(raw: string): boolean {
  const q = raw.toLowerCase();
  return (
    /kaam\s+nahi\s+kar\s+raha/i.test(q) ||
    /stuck/i.test(q) ||
    /print\s+block/i.test(q) ||
    /cannot\s+print/i.test(q) ||
    /profile\s+update\s+required/i.test(q) ||
    /error/i.test(q) ||
    /troubleshoot/i.test(q) ||
    /problem/i.test(q) ||
    /khatam\s+nahi\s+ho\s+raha/i.test(q)
  );
}

/**
 * Checks if the target topic or intent is Doctor Consultation / Clinical Prescription.
 */
export function isClinicalConsultationIntent(raw: string): boolean {
  const q = raw.toLowerCase();
  return (
    /doctor\s+consultation/i.test(q) ||
    /consultation\s+kaise/i.test(q) ||
    /patient\s+consultation/i.test(q) ||
    /soap\s+note/i.test(q) ||
    /prescription\s+kaise\s+(likh|ban|final)/i.test(q) ||
    /digital\s+rx/i.test(q) ||
    /clinical\s+emr/i.test(q) ||
    /doctor\s+opd\s+desk/i.test(q) ||
    /diagnos(is|e)/i.test(q)
  );
}

/**
 * Main Evaluation Engine: Evaluates incoming query against role context, active module, and active patient.
 */
export function evaluateEwanRoleScope(
  rawQuery: string,
  user?: EwanUserContext | undefined,
  _currentPlatform: string = 'PARTNER_PLATFORM',
  activeModule?: string | undefined,
  _activeTab?: string | undefined,
  activePatient?: { id: string; name: string; uhid?: string; status?: string } | undefined
): EwanRoleScopeEvaluation {
  const cleanQuery = rawQuery.trim();
  const { normalizedRole, category, categoryLabel, roleTitle } = normalizeRoleCategory(user?.role);
  const preset = EWAN_ROLE_PRESETS[normalizedRole] || EWAN_ROLE_PRESETS['RECEPTIONIST']!;

  // 1. Anti-Jailbreak Guard
  if (isJailbreakAttempt(cleanQuery)) {
    return {
      resolvedRole: normalizedRole,
      category,
      categoryLabel,
      isBoundaryViolation: true,
      mode: 'JAILBREAK_REFUSED',
      boundaryMessage: `⛔ Security Alert: Role boundary override attempts are strictly prohibited. Aapka active authenticated session role: **${user?.roleTitle || roleTitle}** (${normalizedRole}). DOC SEARCH system permissions are strictly enforced by the backend RBAC firewall.`,
      rawResponseText: `⛔ Security Alert: Role boundary override attempts are strictly prohibited.\nAapka active session role: **${user?.roleTitle || roleTitle}** (${normalizedRole}).\nSystem permissions and workflow bounds cannot be altered via chat.`
    };
  }

  // 2. Role Scope Query ("Main kya-kya kar sakta hoon?")
  if (isRoleScopeQuery(cleanQuery)) {
    const accessible = user?.accessibleFeatures && user.accessibleFeatures.length > 0
      ? user.accessibleFeatures
      : preset.accessibleFeatures;
    const restricted = user?.restrictedFeatures && user.restrictedFeatures.length > 0
      ? user.restrictedFeatures
      : preset.restrictedFeatures;

    const formattedAccessible = accessible.map((f, i) => `${i + 1}. ✅ ${f}`).join('\n');
    const formattedRestricted = restricted.map((f, i) => `${i + 1}. ⛔ ${f}`).join('\n');

    const text = `📋 **Aapka Operational Role Scope: ${user?.roleTitle || roleTitle} (${categoryLabel})**

### ✅ Permitted Workflows (Aap ye sab kar sakte hain):
${formattedAccessible}

### ⛔ Restricted Boundaries (Ye aapke role mein allowed nahi hain):
${formattedRestricted}

💡 *Note: Agar aapko kisi restricted module ka access chahiye toh hospital Super Administrator se RBAC role update karwayein.*`;

    return {
      resolvedRole: normalizedRole,
      category,
      categoryLabel,
      isBoundaryViolation: false,
      mode: 'ROLE_SCOPE',
      rawResponseText: text
    };
  }

  // 3. Next Best Step ("Ab kya karna hai?")
  if (isNextStepQuery(cleanQuery)) {
    let nextStepTitle = 'Next Best Operational Step';
    let nextStepSummary = '';
    let steps: string[] = [];

    if (activeModule === 'patient-registration') {
      nextStepTitle = 'OPD Reception Next Step';
      nextStepSummary = activePatient
        ? `Patient **${activePatient.name}** register ho chuka hai. Ab agla kadam token print aur queue handoff hai.`
        : 'Patient registration form complete karein aur token issue karein.';
      steps = [
        '1. Step 1: Patient details verify karke "Generate Token" button dabayein.',
        '2. Step 2: Thermal printer se 2-inch OPD slip print karein aur patient ko dein.',
        '3. Step 3: OPD Queue TV Calling display par patient ka token transfer verify karein.',
        '4. Step 4: Patient ko respective Doctor room ya waiting area mein guide karein.'
      ];
    } else if (activeModule === 'clinical-consultation') {
      nextStepTitle = 'Doctor OPD Desk Next Step';
      nextStepSummary = activePatient
        ? `Patient **${activePatient.name}** ke consultation workstation par hain.`
        : 'OPD Queue se patient select karke consultation start karein.';
      steps = [
        '1. Step 1: Patient ke Triage Vitals aur Chief Complaints note karein.',
        '2. Step 2: ICD-10 provisional diagnosis enter karein.',
        '3. Step 3: Smart Rx se medicines add karein (CDSS Drug-Drug interaction check automatic hoga).',
        '4. Step 4: "Sign & Finalize Rx" click karein — parchi Pharmacy aur patient ke WhatsApp par instant chali jayegi.'
      ];
    } else if (activeModule === 'pharmacy-medication') {
      nextStepTitle = 'Pharmacy Dispense Next Step';
      nextStepSummary = 'Doctor Rx Queue se patient select karein aur dispense complete karein.';
      steps = [
        '1. Step 1: "Doctor Rx Queue" se patient select karein ya prescription barcode scan karein.',
        '2. Step 2: FIFO batch selection aur expiry date confirm karein.',
        '3. Step 3: Schedule H/H1 medicine hone par statutory log confirm karein.',
        '4. Step 4: "Print GST Bill" dabayein aur Dynamic UPI QR se payment collect karein.'
      ];
    } else if (activeModule === 'billing-revenue-cycle') {
      nextStepTitle = 'Billing & Cashier Next Step';
      nextStepSummary = 'Pending consultation/IPD invoice clear karein.';
      steps = [
        '1. Step 1: Patient MRN ya Phone dalkar pending dues fetch karein.',
        '2. Step 2: Dynamic UPI QR screen par dikhayein.',
        '3. Step 3: Payment confirm hone par B2C Tax Invoice print karein.'
      ];
    } else {
      nextStepTitle = `${categoryLabel} Operational Step`;
      nextStepSummary = `Current module (${activeModule || 'Dashboard'}) mein aapke role ke anusaar agla verified step:`;
      steps = [
        '1. Step 1: Active task ya patient selection verify karein.',
        '2. Step 2: Mandated data fields fill karke save karein.',
        '3. Step 3: Next department ko handoff verify karein.'
      ];
    }

    return {
      resolvedRole: normalizedRole,
      category,
      categoryLabel,
      isBoundaryViolation: false,
      mode: 'NEXT_STEP',
      verifiedGuidance: {
        title: nextStepTitle,
        summary: nextStepSummary,
        steps
      },
      rawResponseText: `⚡ **${nextStepTitle}**\n${nextStepSummary}\n\n${steps.join('\n')}`
    };
  }

  // 4. Troubleshooting Query ("Kaam nahi kar raha?")
  if (isTroubleshootingQuery(cleanQuery)) {
    return {
      resolvedRole: normalizedRole,
      category,
      categoryLabel,
      isBoundaryViolation: false,
      mode: 'TROUBLESHOOT',
      verifiedGuidance: {
        title: '⚠️ System Troubleshooting & Statutory Safety Guards',
        summary: 'DOC SEARCH mein aam taur par aane wale blockages aur unka instant solution:',
        steps: [
          '1. Print Blockage (Statutory Guard): Agar bill ya report print nahi ho rahi, toh Hospital Profile mein Legal Name, CEA License No ya PIN code missing hai. "Update Profile" par click karein aur license save karein — print turant unlock hoga.',
          '2. Role Restriction (403 Forbidden): Agar koi tab open nahi ho raha, toh aapke active role ko wo feature allowed nahi hai. Executive Command Center se Super Admin permission update kar sakte hain.',
          '3. Patient Queue Not Showing: Refresh button dabayein ya OPD roster mein check karein ki Doctor OPD room active hai ya nahi.',
          '4. Thermal Slip Not Printing: Browser print dialog mein paper size "58mm / 80mm Roll" aur margins "None" set karein.'
        ]
      },
      rawResponseText: `⚠️ **System Troubleshooting & Statutory Safety Guards**\n\n1. **Print Blockage (Statutory Guard)**: Agar print block ho raha hai toh Legal Name & CEA License No update karein.\n2. **403 Access Restriction**: Out-of-scope module ko access karne ke liye Super Admin se RBAC update karwayein.\n3. **Queue Refresh**: LiveSync button se instant update karein.\n4. **Thermal Printer**: Margins "None" aur 58mm/80mm roll select karein.`
    };
  }

  // 5. CRITICAL TEST SCENARIO: Receptionist asking Doctor Consultation
  // "Doctor consultation kaise complete karte hain?" / "Patient consultation kaise complete karun?"
  if (isClinicalConsultationIntent(cleanQuery)) {
    if (category === 'FRONT_DESK') {
      // MANDATORY BOUNDARY ENFORCEMENT & REDIRECTION
      const handoff = preset.defaultHandoffs.doctorHandoff!;
      return {
        resolvedRole: normalizedRole,
        category,
        categoryLabel,
        isBoundaryViolation: true,
        mode: 'BOUNDARY_REDIRECT',
        boundaryMessage: handoff.boundaryNote,
        handoffGuidance: {
          boundaryNote: handoff.boundaryNote,
          steps: handoff.steps,
          nextActionUrl: 'patient-registration'
        },
        rawResponseText: `🛡️ **Role Scope Boundary Enforced**\n\n${handoff.boundaryNote}\n\n### 📋 Verified Receptionist Handoff Workflow:\n${handoff.steps.join('\n')}`
      };
    }

    if (category === 'CLINICAL' || category === 'EXECUTIVE') {
      // AUTHORIZED DOCTOR WORKFLOW
      return {
        resolvedRole: normalizedRole,
        category,
        categoryLabel,
        isBoundaryViolation: false,
        mode: 'NORMAL',
        verifiedGuidance: {
          title: '🩺 Doctor OPD Desk: Patient Consultation Workflow',
          summary: 'Doctor consultation workstation, diagnosis, CDSS medicine safety aur 1-click WhatsApp Rx guidance.',
          steps: [
            '1. Step 1 (Doctor Desk): Sidebar ya top menu se "Doctor OPD Desk" (`clinical-consultation`) tab kholein.',
            '2. Step 2 (Select Patient): OPD Waiting Queue se active patient select karein — pichhle vitals, allergies aur complaints auto-load hongi.',
            '3. Step 3 (SOAP & Diagnosis): Chief complaints, ICD-10 diagnosis aur clinical notes fill karein (ya AI Voice Dictation use karein).',
            '4. Step 4 (Smart Rx & CDSS): Medicine box mein medicine select karein — dosage auto-suggest hoga aur Drug-Drug Interaction (DDI) guard check karega.',
            '5. Step 5 (Sign & Finalize Rx): "Sign & Finalize Rx" par click karein — digital signed parchi Pharmacy POS aur patient ke WhatsApp par turant dispatch ho jayegi.'
          ],
          actionKey: 'open-doctor-desk'
        },
        rawResponseText: `🩺 **Doctor OPD Desk: Patient Consultation Workflow**\n\n1. Step 1: "Doctor OPD Desk" tab kholein.\n2. Step 2: Waiting Queue se patient select karein.\n3. Step 3: Chief complaints, ICD-10 aur SOAP notes enter karein.\n4. Step 4: Smart Rx se medicines add karein (automatic CDSS interaction check).\n5. Step 5: "Sign & Finalize Rx" dabayein — parchi Pharmacy & WhatsApp chali jayegi.`
      };
    }

    // Other roles asking doctor consultation (e.g. Lab, Pharmacy)
    return {
      resolvedRole: normalizedRole,
      category,
      categoryLabel,
      isBoundaryViolation: true,
      mode: 'BOUNDARY_REDIRECT',
      boundaryMessage: `Consultation Doctor-role workflow ka part hai. Aapka current role (${roleTitle}) clinical prescriptions finalize karne ke liye authorized nahi hai.`,
      handoffGuidance: {
        boundaryNote: `Consultation Doctor-role workflow ka part hai. Aapka current role (${roleTitle}) clinical prescriptions finalize karne ke liye authorized nahi hai.`,
        steps: [
          '1. Step 1: Patient ko Doctor OPD Desk par consult complete karne dein.',
          '2. Step 2: Doctor dwara Rx finalize hone par aapke respective department mein data synchronize hoga.'
        ]
      },
      rawResponseText: `Consultation Doctor-role workflow ka part hai. Aapka current role (${roleTitle}) clinical prescriptions finalize karne ke liye authorized nahi hai.`
    };
  }

  // 6. Lab Technician asking Pharmacy Billing
  if (/pharmacy.*(bill|pos|dispens)/i.test(cleanQuery) && category === 'DIAGNOSTICS') {
    return {
      resolvedRole: normalizedRole,
      category,
      categoryLabel,
      isBoundaryViolation: true,
      mode: 'BOUNDARY_REDIRECT',
      boundaryMessage: 'Pharmacy billing aur medicine dispensing Pharmacy-role ka part hai. Lab diagnostic scope mein specimen testing aur report authorization perform hoti hai.',
      handoffGuidance: {
        boundaryNote: 'Pharmacy billing aur medicine dispensing Pharmacy-role ka part hai. Lab diagnostic scope mein specimen testing aur report authorization perform hoti hai.',
        steps: [
          '1. Step 1: Pathology / Radiology test values verify karke report release karein.',
          '2. Step 2: Patient ko Pharmacy counter guide karein jahan Doctor Rx ke mutabiq medicines dispense hongi.'
        ]
      },
      rawResponseText: `Pharmacy billing Pharmacy-role ka part hai. Lab technicians report release tak perform karte hain.`
    };
  }

  // 7. Check if query is completely unknown / non-existent feature
  if (
    /bitcoin|crypto|fake\s*admission|bypass\s*bill|hack|illegal|dark\s*web/i.test(cleanQuery)
  ) {
    return {
      resolvedRole: normalizedRole,
      category,
      categoryLabel,
      isBoundaryViolation: false,
      mode: 'UNKNOWN',
      rawResponseText: `UNKNOWN: Yeh action DOC SEARCH ke verified operational workflow ka part nahi hai ya system mein configured nahi hai. Kripya hospital administrator se sampark karein.`
    };
  }

  // Default normal query evaluation (to be paired with knowledge base search)
  return {
    resolvedRole: normalizedRole,
    category,
    categoryLabel,
    isBoundaryViolation: false,
    mode: 'NORMAL'
  };
}
