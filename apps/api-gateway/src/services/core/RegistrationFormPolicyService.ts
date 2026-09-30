import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const POLICY_CONFIG_FILE = path.resolve(__dirname, '../../../data/registration_form_config.json');

export interface RegistrationFormFieldRules {
  ownerAadhaar: 'MANDATORY' | 'OPTIONAL' | 'HIDDEN';
  aadhaarDocUpload: 'MANDATORY' | 'OPTIONAL' | 'HIDDEN';
  clinicalLicense: 'MANDATORY' | 'OPTIONAL' | 'HIDDEN';
  licenseDocUpload: 'MANDATORY' | 'OPTIONAL' | 'HIDDEN';
  gstinNumber: 'MANDATORY' | 'OPTIONAL' | 'HIDDEN';
  bedCapacity: 'MANDATORY' | 'OPTIONAL' | 'HIDDEN';
  mobileWhatsapp: 'MANDATORY' | 'OPTIONAL';
  cityState: 'MANDATORY' | 'OPTIONAL';
  passwordCreation: 'MANDATORY' | 'AUTO_GENERATE';
}

export interface DynamicRegistrationPlan {
  id: string;
  code: string;
  tier: 'STARTER' | 'GROWTH' | 'ENTERPRISE' | 'CUSTOM' | string;
  name: string;
  price: number;
  billingInterval: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'ONE_TIME' | string;
  icon: string;
  tag: string;
  description: string;
  features: string[];
  recommended?: boolean;
  maxDoctors?: number;
  maxBeds?: number;
  isActive: boolean;
  applicableFacilityTypes?: (
    | 'HOSPITAL'
    | 'CLINIC'
    | 'PATHOLOGY'
    | 'PHARMACY'
    | 'DIAGNOSTIC_CENTRE'
    | 'PHARMACY_WHOLESALE'
    | 'ALL'
  )[];
}

export type AllowedRegistrationFacilityType =
  | 'HOSPITAL'
  | 'CLINIC'
  | 'PATHOLOGY'
  | 'PHARMACY'
  | 'DIAGNOSTIC_CENTRE'
  | 'PHARMACY_WHOLESALE';

export const CANONICAL_ALLOWED_FACILITY_TYPES: AllowedRegistrationFacilityType[] = [
  'HOSPITAL',
  'CLINIC',
  'PATHOLOGY',
  'PHARMACY',
  'DIAGNOSTIC_CENTRE',
  'PHARMACY_WHOLESALE'
];

export interface RegistrationFormPolicy {
  showPlanSelection: boolean;
  showModuleSelection?: boolean;
  allowAdvancePayment: boolean;
  defaultPlanTier: 'STARTER' | 'GROWTH' | 'ENTERPRISE' | 'PENDING_FOUNDER' | 'FREE' | string;
  bannerNotice: string;
  allowedFacilityTypes: AllowedRegistrationFacilityType[];
  availablePlans: DynamicRegistrationPlan[];
  fieldRules: RegistrationFormFieldRules;
  updatedAt: string;
  updatedBy: string;
}

export const DEFAULT_PUBLIC_PLANS: DynamicRegistrationPlan[] = [
  // 1. HOSPITAL Plans
  {
    id: 'plan-hosp-free-yr1',
    code: 'PLAN_HOSP_FREE_YR1',
    tier: 'FOUNDING',
    name: 'Hospital Founding Partner (1st Year Free)',
    price: 0,
    billingInterval: 'ANNUAL',
    icon: '🏥',
    tag: '🎁 1st Year Free • Inpatient Beds, OT & ICU',
    description: '100% Free for 365 Days - Complete Multi-Specialty Hospital HIS: Inpatient ADT Bed Matrix, OT Surgical Rostering, ICU Flowsheets, TPA IRDAI NHCX Bridge & ABDM Kiosk.',
    features: [
      'Universal Staff Directory & RBAC',
      'Inpatient ADT Bed Matrix (All Wards)',
      'OT Surgical Rostering & PAC Clearance',
      'ICU 24-Hour Digital Flowsheet',
      'TPA Cashless Pre-Auth & IRDAI NHCX Bridge',
      'Emergency & Code Blue Broadcast',
      'ABDM 2.0 Fast OPD Kiosk',
      'MRD ICD-10 Medical Coding',
      'Blood Bank Component Cross-Matching'
    ],
    recommended: true,
    maxDoctors: 50,
    maxBeds: 200,
    isActive: true,
    applicableFacilityTypes: ['HOSPITAL']
  },
  {
    id: 'plan-hosp-annual-yr2',
    code: 'PLAN_HOSP_ANNUAL_YR2',
    tier: 'ANNUAL',
    name: 'Multi-Specialty Hospital Annual Plan',
    price: 30000,
    billingInterval: 'ANNUAL',
    icon: '🏥',
    tag: '⭐ Year 2: ₹30,000/yr',
    description: 'All-inclusive Multi-Specialty Hospital Enterprise HIS: Inpatient Bed Matrix, OT, ICU, Cashless TPA Claims & Complete LIMS.',
    features: [
      'Universal Staff Directory & RBAC',
      'Inpatient ADT Bed Matrix (All Wards)',
      'OT Surgical Rostering & PAC Clearance',
      'ICU 24-Hour Digital Flowsheet',
      'TPA Cashless Pre-Auth & IRDAI NHCX Bridge',
      'Emergency & Code Blue Broadcast',
      'ABDM 2.0 Fast OPD Kiosk',
      'MRD ICD-10 Medical Coding',
      'Blood Bank Component Cross-Matching'
    ],
    recommended: false,
    maxDoctors: 100,
    maxBeds: 500,
    isActive: true,
    applicableFacilityTypes: ['HOSPITAL']
  },

  // 2. CLINIC Plans
  {
    id: 'plan-clinic-free-yr1',
    code: 'PLAN_CLINIC_FREE_YR1',
    tier: 'FOUNDING',
    name: 'Clinic Founding Partner (1st Year Free)',
    price: 0,
    billingInterval: 'ANNUAL',
    icon: '🩺',
    tag: '🎁 1st Year Free • Ambient AI Scribe & Rx',
    description: '100% Free for 365 Days - Ambient AI voice scribe, digital prescription pad, WhatsApp Rx & ABHA scan check-in.',
    features: [
      'Universal Staff Directory & RBAC',
      'Ambient AI Voice Scribe',
      'Digital Prescription Pad (Rx)',
      'WhatsApp High-Res PDF Rx Dispatch',
      'ABHA 2.0 QR Scan Fast OPD Check-in',
      'Real-Time Drug-Drug Interaction Shield'
    ],
    recommended: true,
    maxDoctors: 5,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['CLINIC']
  },
  {
    id: 'plan-clinic-annual-yr2',
    code: 'PLAN_CLINIC_ANNUAL_YR2',
    tier: 'ANNUAL',
    name: 'Doctor OPD Clinic Annual Plan',
    price: 20000,
    billingInterval: 'ANNUAL',
    icon: '👨‍⚕️',
    tag: '⭐ Year 2: ₹20,000/yr',
    description: 'Full Doctor OPD Practice Suite: Ambient AI Voice Scribe, WhatsApp Rx Dispatch, Jan Aushadhi Generic Switcher & DDI Shield.',
    features: [
      'Universal Staff Directory & RBAC',
      'Ambient AI Voice Scribe',
      'Digital Prescription Pad (Rx)',
      'WhatsApp High-Res PDF Rx Dispatch',
      'ABHA 2.0 QR Scan Fast OPD Check-in',
      'Real-Time Drug-Drug Interaction Shield',
      'Multi-Doctor Room Rostering & Central Cashier'
    ],
    recommended: false,
    maxDoctors: 15,
    maxBeds: 5,
    isActive: true,
    applicableFacilityTypes: ['CLINIC']
  },

  // 3. PATHOLOGY Plans
  {
    id: 'plan-path-free-yr1',
    code: 'PLAN_PATH_FREE_YR1',
    tier: 'FOUNDING',
    name: 'Pathology Founding Partner (1st Year Free)',
    price: 0,
    billingInterval: 'ANNUAL',
    icon: '🧪',
    tag: '🎁 1st Year Free • Barcode LIMS & Analyzer Sync',
    description: '100% Free for 365 Days - Phlebotomy sample barcodes, bi-directional analyzer sync, WhatsApp NABL reports & doctor e-sign.',
    features: [
      'Universal Staff Directory & RBAC',
      'Phlebotomy Sample Barcode Intake & Tracking',
      'Bi-Directional Lab Machine Analyzer Interface',
      'WhatsApp NABL Lab Report Auto-Dispatch',
      'Doctor Digital Signature on Lab Reports'
    ],
    recommended: true,
    maxDoctors: 5,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['PATHOLOGY']
  },
  {
    id: 'plan-path-annual-yr2',
    code: 'PLAN_PATH_ANNUAL_YR2',
    tier: 'ANNUAL',
    name: 'Pathology Lab LIMS Annual Plan',
    price: 10000,
    billingInterval: 'ANNUAL',
    icon: '🔬',
    tag: '⭐ Year 2: ₹10,000/yr',
    description: 'Full LIMS suite: Multi-collection centers, bi-directional analyzer sync, automated WhatsApp reports, doctor referral ledger & NABL logs.',
    features: [
      'Universal Staff Directory & RBAC',
      'Phlebotomy Sample Barcode Intake & Tracking',
      'Bi-Directional Lab Machine Analyzer Interface',
      'WhatsApp NABL Lab Report Auto-Dispatch',
      'Doctor Digital Signature on Lab Reports',
      'Multi-Collection Center Branches',
      'Doctor Referral B2B Commission Split & Ledger'
    ],
    recommended: false,
    maxDoctors: 20,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['PATHOLOGY']
  },

  // 4. PHARMACY Plans
  {
    id: 'plan-pharma-free-yr1',
    code: 'PLAN_PHARMA_FREE_YR1',
    tier: 'FOUNDING',
    name: 'Pharmacy Founding Partner (1st Year Free)',
    price: 0,
    billingInterval: 'ANNUAL',
    icon: '💊',
    tag: '🎁 1st Year Free • Barcode POS & Expiry Radar',
    description: '100% Free for 365 Days - High-speed barcode POS, batch/expiry radar, Jan Aushadhi generic switcher & Schedule H1 narcotics register.',
    features: [
      'Universal Staff Directory & RBAC',
      'High-Speed Barcode POS & Thermal Print',
      'Automated Batch & Expiry Radar',
      'Jan Aushadhi Generic Alternate Recommender',
      'Schedule H & H1 Narcotics Digital Register',
      'WhatsApp Invoice PDF & Auto-Refills'
    ],
    recommended: true,
    maxDoctors: 3,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['PHARMACY']
  },
  {
    id: 'plan-pharma-annual-yr2',
    code: 'PLAN_PHARMA_ANNUAL_YR2',
    tier: 'ANNUAL',
    name: 'Pharmacy & Chemist Annual Plan',
    price: 10000,
    billingInterval: 'ANNUAL',
    icon: '🏪',
    tag: '⭐ Year 2: ₹10,000/yr',
    description: 'Full Chemist POS suite: Automated batch/expiry radar, PMBJP generic switcher, supplier purchase inwarding, WhatsApp bills & Schedule H1 narcotics register.',
    features: [
      'Universal Staff Directory & RBAC',
      'High-Speed Barcode POS & Thermal Print',
      'Automated Batch & Expiry Radar',
      'Jan Aushadhi Generic Alternate Recommender',
      'Schedule H & H1 Narcotics Digital Register',
      'WhatsApp Invoice PDF & Auto-Refills',
      'Central Multi-Store Warehouse & Stock Transfer',
      'Supplier Purchase Orders & Automated GST Inwarding'
    ],
    recommended: false,
    maxDoctors: 10,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['PHARMACY']
  },

  // 5. DIAGNOSTIC CENTRE Plans
  {
    id: 'plan-radio-free-yr1',
    code: 'PLAN_RADIO_FREE_YR1',
    tier: 'FOUNDING',
    name: 'Radiology Founding Partner (1st Year Free)',
    price: 0,
    billingInterval: 'ANNUAL',
    icon: '🩻',
    tag: '🎁 1st Year Free • Web DICOM Viewer & Speech EMR',
    description: '100% Free for 365 Days - Zero-footprint web DICOM viewer, speech-to-text reporting & WhatsApp scan links.',
    features: [
      'Universal Staff Directory & RBAC',
      'Zero-Footprint Web DICOM Viewer',
      'Radiologist Speech-to-Text Reporting',
      'WhatsApp Diagnostic Scan & DICOM Links'
    ],
    recommended: true,
    maxDoctors: 5,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['DIAGNOSTIC_CENTRE']
  },
  {
    id: 'plan-radio-annual-yr2',
    code: 'PLAN_RADIO_ANNUAL_YR2',
    tier: 'ANNUAL',
    name: 'Radiology & PACS Annual Plan',
    price: 20000,
    billingInterval: 'ANNUAL',
    icon: '☢️',
    tag: '⭐ Year 2: ₹20,000/yr',
    description: 'Complete Imaging suite: Cloud PACS, DICOM CT/MRI machine sync, speech-to-text structured reporting & WhatsApp scan links.',
    features: [
      'Universal Staff Directory & RBAC',
      'Zero-Footprint Web DICOM Viewer',
      'Radiologist Speech-to-Text Reporting',
      'WhatsApp Diagnostic Scan & DICOM Links',
      'Cloud PACS & DICOM CT/MRI Machine Sync',
      'AERB & PNDT Automated Regulatory Registers'
    ],
    recommended: false,
    maxDoctors: 20,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['DIAGNOSTIC_CENTRE']
  },

  // 6. PHARMACY WHOLESALE / B2B DISTRIBUTION Plans
  {
    id: 'plan-pharma-wholesale-free-yr1',
    code: 'PLAN_PHARMA_WHOLESALE_FREE_YR1',
    tier: 'FOUNDING',
    name: 'Wholesale Distributor Founding Partner (1st Year Free)',
    price: 0,
    billingInterval: 'ANNUAL',
    icon: '📦',
    tag: '🎁 1st Year Free • B2B GST Distribution & Form 20B/21B',
    description: '100% Free for 365 Days - B2B wholesale distribution ledger, Form 20B/21B buyer Drug License validation, multi-batch GRN inwarding & cold-chain batch tracking.',
    features: [
      'Universal Staff Directory & RBAC',
      'Wholesale B2B GST Distribution & Buyer Drug License Verification',
      'Form 20B / 21B Regulatory Compliance Register',
      'Multi-Batch Cold-Chain & Expiry Radar',
      'Automated Supplier GRN & Credit Note Settlement'
    ],
    recommended: true,
    maxDoctors: 5,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['PHARMACY_WHOLESALE']
  },
  {
    id: 'plan-pharma-wholesale-annual-yr2',
    code: 'PLAN_PHARMA_WHOLESALE_ANNUAL_YR2',
    tier: 'ANNUAL',
    name: 'Wholesale Pharma Distributor Annual Plan',
    price: 25000,
    billingInterval: 'ANNUAL',
    icon: '🏭',
    tag: '⭐ Year 2: ₹25,000/yr',
    description: 'Enterprise B2B Wholesale Distribution suite: Multi-warehouse stock transfer, Form 20B/21B buyer verification, GST e-Invoice & credit limit governance.',
    features: [
      'Universal Staff Directory & RBAC',
      'Wholesale B2B GST Distribution & Buyer Drug License Verification',
      'Form 20B / 21B Regulatory Compliance Register',
      'Multi-Batch Cold-Chain & Expiry Radar',
      'Automated Supplier GRN & Credit Note Settlement',
      'Multi-Warehouse Stock Transfer & Credit Limit Governance'
    ],
    recommended: false,
    maxDoctors: 15,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['PHARMACY_WHOLESALE']
  }
];

export const DEFAULT_REGISTRATION_FORM_POLICY: RegistrationFormPolicy = {
  showPlanSelection: true,
  showModuleSelection: true,
  allowAdvancePayment: true,
  defaultPlanTier: 'FOUNDING',
  bannerNotice: 'Universal Healthcare Partner Registration • 1st Year Free Founding Partner Offer Active',
  allowedFacilityTypes: [...CANONICAL_ALLOWED_FACILITY_TYPES],
  availablePlans: DEFAULT_PUBLIC_PLANS,
  fieldRules: {
    ownerAadhaar: 'MANDATORY',
    aadhaarDocUpload: 'MANDATORY',
    clinicalLicense: 'MANDATORY',
    licenseDocUpload: 'MANDATORY',
    gstinNumber: 'OPTIONAL',
    bedCapacity: 'OPTIONAL',
    mobileWhatsapp: 'MANDATORY',
    cityState: 'MANDATORY',
    passwordCreation: 'MANDATORY'
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'DocSearch Founder Command'
};

export class RegistrationFormPolicyService {
  private inMemoryPolicy: RegistrationFormPolicy;

  constructor() {
    this.inMemoryPolicy = this.loadFromDisk();
  }

  private loadFromDisk(): RegistrationFormPolicy {
    try {
      if (fs.existsSync(POLICY_CONFIG_FILE)) {
        const raw = fs.readFileSync(POLICY_CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        const diskAllowed: AllowedRegistrationFacilityType[] = Array.isArray(parsed.allowedFacilityTypes)
          ? parsed.allowedFacilityTypes
          : [];
        const mergedAllowedFacilityTypes = Array.from(
          new Set<AllowedRegistrationFacilityType>([
            ...diskAllowed,
            ...CANONICAL_ALLOWED_FACILITY_TYPES
          ])
        );
        const diskPlans: DynamicRegistrationPlan[] = Array.isArray(parsed.availablePlans) && parsed.availablePlans.length > 0
          ? parsed.availablePlans
          : [];
        const existingPlanIds = new Set(diskPlans.map((p) => p.id));
        const mergedPlans = [
          ...diskPlans,
          ...DEFAULT_PUBLIC_PLANS.filter((p) => !existingPlanIds.has(p.id))
        ];

        return {
          ...DEFAULT_REGISTRATION_FORM_POLICY,
          ...parsed,
          allowedFacilityTypes: mergedAllowedFacilityTypes,
          availablePlans: mergedPlans,
          fieldRules: {
            ...DEFAULT_REGISTRATION_FORM_POLICY.fieldRules,
            ...(parsed.fieldRules || {})
          }
        };
      }
    } catch {
      // Fallback to defaults if read fails
    }
    return { ...DEFAULT_REGISTRATION_FORM_POLICY };
  }

  private async saveToDisk(policy: RegistrationFormPolicy): Promise<void> {
    try {
      const dir = path.dirname(POLICY_CONFIG_FILE);
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.writeFile(POLICY_CONFIG_FILE, JSON.stringify(policy, null, 2), 'utf-8');
    } catch {
      // Non-fatal disk write error
    }
  }

  public getPolicy(): RegistrationFormPolicy {
    return { ...this.inMemoryPolicy };
  }

  public updatePolicy(
    updates: Partial<RegistrationFormPolicy>,
    updatedBy = 'DocSearch Founder Command'
  ): RegistrationFormPolicy {
    const current = this.getPolicy();
    const updated: RegistrationFormPolicy = {
      ...current,
      ...updates,
      availablePlans: Array.isArray(updates.availablePlans) && updates.availablePlans.length > 0
        ? updates.availablePlans
        : current.availablePlans,
      fieldRules: {
        ...current.fieldRules,
        ...(updates.fieldRules || {})
      },
      allowedFacilityTypes: updates.allowedFacilityTypes || current.allowedFacilityTypes,
      updatedAt: new Date().toISOString(),
      updatedBy
    };

    this.inMemoryPolicy = updated;
    this.saveToDisk(updated);
    return updated;
  }

  public resetToDefaults(updatedBy = 'DocSearch Founder Command'): RegistrationFormPolicy {
    const updated = {
      ...DEFAULT_REGISTRATION_FORM_POLICY,
      updatedAt: new Date().toISOString(),
      updatedBy
    };
    this.inMemoryPolicy = updated;
    this.saveToDisk(updated);
    return updated;
  }
}

export interface CanonicalRequestedPlan {
  id: string;
  code: string;
  tier: string;
  planName: string;
  name: string;
  price: number;
  monthlyFee: number;
  durationDays: number;
  billingInterval: string;
  isFree: boolean;
  features: string[];
  icon?: string;
  description?: string;
}

export function resolveCanonicalRequestedPlan(
  facilityType: string,
  requestedPlan?: any,
  planTier?: string
): CanonicalRequestedPlan {
  const normType = String(facilityType || 'HOSPITAL').toUpperCase();
  const fallbackPlan: DynamicRegistrationPlan = DEFAULT_PUBLIC_PLANS[0]!;

  // Find default founding plan for this facility type
  const defaultFounding: DynamicRegistrationPlan = DEFAULT_PUBLIC_PLANS.find(
    (p) => p.tier === 'FOUNDING' && p.applicableFacilityTypes?.includes(normType as any)
  ) || fallbackPlan;

  // If client provided a requestedPlan
  if (requestedPlan && typeof requestedPlan === 'object') {
    const rawPrice = requestedPlan.price !== undefined ? Number(requestedPlan.price) : (requestedPlan.monthlyFee !== undefined ? Number(requestedPlan.monthlyFee) : defaultFounding.price);
    const planName = requestedPlan.planName || requestedPlan.name || defaultFounding.name;
    const tier = requestedPlan.tier || (rawPrice === 0 ? 'FOUNDING' : 'ANNUAL');
    const id = requestedPlan.id || defaultFounding.id;
    const code = requestedPlan.code || defaultFounding.code;
    const durationDays = requestedPlan.durationDays || 365;
    const billingInterval = requestedPlan.billingInterval || requestedPlan.billingFrequency || 'ANNUAL';
    const features = Array.isArray(requestedPlan.features) && requestedPlan.features.length > 0 ? requestedPlan.features : defaultFounding.features;

    return {
      id,
      code,
      tier,
      planName,
      name: planName,
      price: rawPrice,
      monthlyFee: rawPrice,
      durationDays,
      billingInterval,
      isFree: rawPrice === 0,
      features,
      icon: requestedPlan.icon || defaultFounding.icon,
      description: requestedPlan.description || defaultFounding.description
    };
  }

  // If client provided a planTier string
  if (planTier && typeof planTier === 'string') {
    const isFree = planTier.toLowerCase().includes('free') || planTier.toLowerCase().includes('founding');
    const matched: DynamicRegistrationPlan = DEFAULT_PUBLIC_PLANS.find((p) => {
      const matchType = p.applicableFacilityTypes?.includes(normType as any);
      if (!matchType) return false;
      if (isFree) return p.tier === 'FOUNDING' || p.price === 0;
      return p.name.toLowerCase().includes(planTier.toLowerCase()) || p.tier === planTier;
    }) || defaultFounding;

    return {
      id: matched.id,
      code: matched.code,
      tier: matched.tier,
      planName: matched.name,
      name: matched.name,
      price: matched.price,
      monthlyFee: matched.price,
      durationDays: 365,
      billingInterval: matched.billingInterval,
      isFree: matched.price === 0,
      features: matched.features,
      icon: matched.icon,
      description: matched.description
    };
  }

  // Fallback to default founding plan
  return {
    id: defaultFounding.id,
    code: defaultFounding.code,
    tier: defaultFounding.tier,
    planName: defaultFounding.name,
    name: defaultFounding.name,
    price: defaultFounding.price,
    monthlyFee: defaultFounding.price,
    durationDays: 365,
    billingInterval: defaultFounding.billingInterval,
    isFree: defaultFounding.price === 0,
    features: defaultFounding.features,
    icon: defaultFounding.icon,
    description: defaultFounding.description
  };
}

export const registrationFormPolicyService = new RegistrationFormPolicyService();

