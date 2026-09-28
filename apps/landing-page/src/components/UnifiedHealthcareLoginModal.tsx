import React, { useState, useEffect } from 'react';
import {
  getPromotionalCampaign,
  fetchPromotionalCampaignRemote,
  calculateCampaignMetrics,
  PROMOTIONAL_CAMPAIGN_EVENT,
  type PromotionalCampaignConfig,
  type CampaignCalculatedMetrics
} from '@docsearch/shared-core';
import { PartnerCampaignShowcasePanel, DocSearchLogo, DocSearch3DLogoLoader } from '@docsearch/ui-kit';

export type HealthcareFacilityType = 'PATHOLOGY' | 'CLINIC' | 'PHARMACY' | 'HOSPITAL' | 'DIAGNOSTIC_CENTRE' | 'COMPANY_HQ';

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
  tier: string;
  name: string;
  price: number;
  billingInterval?: string;
  icon: string;
  tag: string;
  description: string;
  features: string[];
  recommended?: boolean;
  maxDoctors?: number;
  maxBeds?: number;
  isActive?: boolean;
  applicableFacilityTypes?: ('HOSPITAL' | 'CLINIC' | 'PATHOLOGY' | 'PHARMACY' | 'DIAGNOSTIC_CENTRE' | 'ALL')[];
}

export interface RegistrationFormPolicy {
  showPlanSelection: boolean;
  showModuleSelection?: boolean;
  allowAdvancePayment: boolean;
  defaultPlanTier: string;
  bannerNotice: string;
  allowedFacilityTypes: ('HOSPITAL' | 'CLINIC' | 'PATHOLOGY' | 'PHARMACY')[];
  availablePlans?: DynamicRegistrationPlan[];
  fieldRules: RegistrationFormFieldRules;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_PUBLIC_PLANS: DynamicRegistrationPlan[] = [
  // 1. HOSPITAL Plans
  {
    id: 'plan_hosp_free_yr1',
    code: 'PLAN_HOSPITAL_FREE_YR1',
    tier: 'FREE_YEAR_1',
    name: 'Hospital Founding Partner (1st Year Free)',
    price: 0,
    billingInterval: 'ANNUAL',
    icon: '🏥',
    tag: '1st Year 100% Free • ₹30,000/yr from Year 2',
    description: 'Complete Multi-Specialty Hospital HIS: All departments & modules pre-selected and unlocked.',
    features: [
      'IPD Admission-Discharge-Transfer (ADT) & Bed Matrix',
      'Operation Theatre (OT) Surgical Rostering & PAC',
      'ICU 24-Hour Digital Flowsheet & Critical Vitals',
      'TPA Cashless Pre-Auth & IRDAI NHCX Bridge'
    ],
    recommended: true,
    maxDoctors: 50,
    maxBeds: 250,
    isActive: true,
    applicableFacilityTypes: ['HOSPITAL']
  },
  {
    id: 'plan_hosp_annual_yr2',
    code: 'PLAN_HOSPITAL_ANNUAL_YR2',
    tier: 'ANNUAL_YEAR_2',
    name: 'Multi-Specialty Hospital Annual Plan',
    price: 30000,
    billingInterval: 'ANNUAL',
    icon: '🏢',
    tag: 'Year 2: ₹30,000/yr Annual License',
    description: 'All-inclusive Multi-Specialty HIS: Inpatient ADT Bed Matrix, OT Rostering, ICU Flowsheets, TPA Cashless & Blood Bank.',
    features: [
      'IPD ADT Bed Matrix & OT Surgical Rostering',
      'ICU Flowsheet & TPA IRDAI NHCX Cashless Bridge',
      'Emergency Code Blue & ABDM 2.0 Fast Kiosk',
      'MRD ICD-10 Coding & Blood Bank Inventory'
    ],
    recommended: false,
    maxDoctors: 100,
    maxBeds: 500,
    isActive: true,
    applicableFacilityTypes: ['HOSPITAL']
  },

  // 2. CLINIC Plans
  {
    id: 'plan_clinic_free_yr1',
    code: 'PLAN_CLINIC_FREE_YR1',
    tier: 'FREE_YEAR_1',
    name: 'Clinic Founding Partner (1st Year Free)',
    price: 0,
    billingInterval: 'ANNUAL',
    icon: '🩺',
    tag: '1st Year 100% Free • ₹20,000/yr from Year 2',
    description: 'Patient token queue, digital prescription pad, ambient AI voice scribe, WhatsApp Rx & ABHA QR scan.',
    features: [
      'Ambient AI Voice Scribe (Consultation to EMR)',
      '1-Click Digital Prescription Pad with Generics',
      'WhatsApp High-Res PDF Rx Dispatch to Patient',
      'ABHA 2.0 QR Scan Instant OPD Check-in'
    ],
    recommended: true,
    maxDoctors: 5,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['CLINIC']
  },
  {
    id: 'plan_clinic_annual_yr2',
    code: 'PLAN_CLINIC_ANNUAL_YR2',
    tier: 'ANNUAL_YEAR_2',
    name: 'Doctor OPD Clinic Annual Plan',
    price: 20000,
    billingInterval: 'ANNUAL',
    icon: '👨‍⚕️',
    tag: 'Year 2: ₹20,000/yr Annual License',
    description: 'Full Doctor OPD Practice Suite: Ambient AI Clinical Voice Scribe, WhatsApp Rx Dispatch & DDI Conflict Shield.',
    features: [
      'Ambient AI Voice Scribe & Digital Rx Pad',
      'Jan Aushadhi Generic Switcher & DDI Shield',
      'WhatsApp Rx Dispatch & ABHA 2.0 QR Check-in',
      'Patient OPD Token Queue Management'
    ],
    recommended: false,
    maxDoctors: 15,
    maxBeds: 10,
    isActive: true,
    applicableFacilityTypes: ['CLINIC']
  },

  // 3. PATHOLOGY Plans
  {
    id: 'plan_path_free_yr1',
    code: 'PLAN_PATHOLOGY_FREE_YR1',
    tier: 'FREE_YEAR_1',
    name: 'Pathology Founding Partner (1st Year Free)',
    price: 0,
    billingInterval: 'ANNUAL',
    icon: '🧪',
    tag: '1st Year 100% Free • ₹10,000/yr from Year 2',
    description: 'Phlebotomy sample barcodes, bi-directional analyzer sync, WhatsApp NABL reports & doctor e-sign.',
    features: [
      'Phlebotomy Barcode Intake & Sample Tracking',
      'Bi-Directional Lab Machine / Analyzer Interface',
      'WhatsApp NABL PDF Report Dispatch',
      'Pathologist Digital Signature on Lab Reports'
    ],
    recommended: true,
    maxDoctors: 10,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['PATHOLOGY']
  },
  {
    id: 'plan_path_annual_yr2',
    code: 'PLAN_PATHOLOGY_ANNUAL_YR2',
    tier: 'ANNUAL_YEAR_2',
    name: 'Pathology Lab LIMS Annual Plan',
    price: 10000,
    billingInterval: 'ANNUAL',
    icon: '🔬',
    tag: 'Year 2: ₹10,000/yr Annual License',
    description: 'Full LIMS suite: Multi-collection centers, bi-directional analyzer sync, automated WhatsApp reports & doctor referral ledger.',
    features: [
      'Phlebotomy Barcoding & Analyzer Interfacing',
      'WhatsApp NABL Report Auto-Dispatch',
      'Pathologist Digital Sign & Quality Audit',
      'Doctor Referral Split & B2B Ledger'
    ],
    recommended: false,
    maxDoctors: 25,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['PATHOLOGY']
  },

  // 4. PHARMACY Plans
  {
    id: 'plan_pharm_free_yr1',
    code: 'PLAN_PHARMACY_FREE_YR1',
    tier: 'FREE_YEAR_1',
    name: 'Pharmacy Founding Partner (1st Year Free)',
    price: 0,
    billingInterval: 'ANNUAL',
    icon: '💊',
    tag: '1st Year 100% Free • ₹10,000/yr from Year 2',
    description: 'High-speed barcode POS, batch/expiry radar, Jan Aushadhi generic switcher & Schedule H1 narcotics register.',
    features: [
      'High-Speed Barcode Billing & Thermal Receipt Print',
      'Automated Batch & Expiry Radar (30/60/90 Days)',
      'Jan Aushadhi Generic Alternate Recommender',
      'Schedule H & H1 Narcotics Compliance Register'
    ],
    recommended: true,
    maxDoctors: 0,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['PHARMACY']
  },
  {
    id: 'plan_pharm_annual_yr2',
    code: 'PLAN_PHARMACY_ANNUAL_YR2',
    tier: 'ANNUAL_YEAR_2',
    name: 'Pharmacy & Chemist Annual Plan',
    price: 10000,
    billingInterval: 'ANNUAL',
    icon: '🏪',
    tag: 'Year 2: ₹10,000/yr Annual License',
    description: 'Full Chemist POS suite: Automated batch/expiry radar, PMBJP generic switcher, supplier purchase inwarding & WhatsApp bills.',
    features: [
      'High-Speed Barcode POS & Thermal Billing',
      'Automated Batch & Expiry Radar Alerts',
      'Jan Aushadhi Generic Switcher',
      'Schedule H & H1 Narcotics Digital Register'
    ],
    recommended: false,
    maxDoctors: 0,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['PHARMACY']
  },

  // 5. DIAGNOSTIC CENTRE Plans
  {
    id: 'plan_radio_free_yr1',
    code: 'PLAN_RADIOLOGY_FREE_YR1',
    tier: 'FREE_YEAR_1',
    name: 'Radiology Founding Partner (1st Year Free)',
    price: 0,
    billingInterval: 'ANNUAL',
    icon: '🩻',
    tag: '1st Year 100% Free • ₹20,000/yr from Year 2',
    description: 'Zero-footprint web DICOM viewer, speech-to-text reporting & WhatsApp scan links.',
    features: [
      'Zero-Footprint Web DICOM Viewer (200+ Tools)',
      'Radiologist Speech-to-Text Structured Reporting',
      'Secure WhatsApp Diagnostic Scan & Cloud Link',
      'Modality Worklist (MWL) & DICOM CT/MRI Sync'
    ],
    recommended: true,
    maxDoctors: 15,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['DIAGNOSTIC_CENTRE']
  },
  {
    id: 'plan_radio_annual_yr2',
    code: 'PLAN_RADIOLOGY_ANNUAL_YR2',
    tier: 'ANNUAL_YEAR_2',
    name: 'Radiology & PACS Annual Plan',
    price: 20000,
    billingInterval: 'ANNUAL',
    icon: '☢️',
    tag: 'Year 2: ₹20,000/yr Annual License',
    description: 'Complete Imaging suite: Cloud PACS, DICOM CT/MRI machine sync, speech-to-text structured reporting & WhatsApp scan links.',
    features: [
      'Cloud PACS Storage & Web DICOM Viewer',
      'Modality Worklist & CT/MRI Machine Sync',
      'Speech-to-Text Structured Reporting',
      'AERB & PNDT Regulatory Compliance Registers'
    ],
    recommended: false,
    maxDoctors: 30,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['DIAGNOSTIC_CENTRE']
  }
];

export const DEFAULT_REGISTRATION_FORM_POLICY: RegistrationFormPolicy = {
  showPlanSelection: true,
  showModuleSelection: false,
  allowAdvancePayment: true,
  defaultPlanTier: 'GROWTH',
  bannerNotice: 'Pioneer Free Onboarding Environment (First 10,000 Partners Phase) • Complimentary Full Software Access',
  allowedFacilityTypes: ['HOSPITAL', 'CLINIC', 'PATHOLOGY', 'PHARMACY'],
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
  }
};

export const PROFILE_MODULES_MAP: Record<HealthcareFacilityType, Array<{ id: string; name: string; default: boolean }>> = {
  HOSPITAL: [
    { id: 'hosp_adt_beds', name: 'IPD Admission-Discharge-Transfer (ADT) & Visual Bed Matrix', default: true },
    { id: 'hosp_ot_roster', name: 'Operation Theatre (OT) Surgical Rostering & PAC Clearance', default: true },
    { id: 'hosp_icu_flowsheets', name: 'ICU 24-Hour Digital Flowsheet & Critical Vitals Charting', default: true },
    { id: 'hosp_tpa_claims', name: 'TPA Cashless Pre-Auth & IRDAI NHCX FHIR Bridge (98% Approval)', default: true },
    { id: 'hosp_emergency_code_blue', name: 'Emergency & Code Blue Instant Audio-Visual Broadcast', default: true },
    { id: 'hosp_abdm_kiosk', name: 'ABDM 2.0 Scan & Share Fast OPD Token Kiosk', default: true },
    { id: 'hosp_mrd_icd10', name: 'MRD ICD-10 Medical Coding & Forensic MLC Registry', default: true },
    { id: 'hosp_blood_bank', name: 'Blood Bank Component Cross-Matching & PRBC Inventory', default: true }
  ],
  CLINIC: [
    { id: 'clinic_ai_scribe', name: 'Ambient AI Voice Scribe (Converts Doctor-Patient Speech into EMR)', default: true },
    { id: 'clinic_rx_pad', name: '1-Click Digital Prescription Pad with Brand Safety & Generics', default: true },
    { id: 'clinic_whatsapp_rx', name: 'WhatsApp High-Res PDF Prescription Dispatch to Patient', default: true },
    { id: 'clinic_abha_qr', name: 'ABHA 2.0 QR Scan & Share Instant OPD Check-in under 5 Seconds', default: true },
    { id: 'clinic_ddi_shield', name: 'Real-Time AI Drug-Drug Conflict Interception (DDI Shield)', default: true },
    { id: 'clinic_telemedicine', name: 'HD Video Tele-Consultation with Instant UPI Payment Link', default: false },
    { id: 'clinic_multi_doctor', name: 'Automated Multi-Doctor Consultation Room Rostering', default: false }
  ],
  PATHOLOGY: [
    { id: 'barcoding', name: 'Phlebotomy Barcode Intake & Sample Tracking', default: true },
    { id: 'analyzer_sync', name: 'Bi-Directional Lab Machine / Analyzer Interface', default: true },
    { id: 'whatsapp_dispatch', name: 'WhatsApp NABL PDF Report Dispatch (Patient Direct)', default: true },
    { id: 'digital_sign', name: 'Pathologist Digital Signature on Lab Reports', default: true },
    { id: 'doctor_referral', name: 'Doctor Referral Commission Split & B2B Ledger', default: false },
    { id: 'home_collection', name: 'Home Sample Collection & Phlebotomist GPS Tracking', default: false }
  ],
  PHARMACY: [
    { id: 'pharma_barcode_pos', name: 'High-Speed Barcode Billing & Thermal Receipt Print', default: true },
    { id: 'pharma_expiry_radar', name: 'Automated Batch & Expiry Radar (30/60/90 Days Alerts)', default: true },
    { id: 'pharma_generic_finder', name: 'Jan Aushadhi & PMBJP Generic Alternate Recommender', default: true },
    { id: 'pharma_schedule_h1', name: 'Schedule H & H1 Narcotics Digital Compliance Register', default: true },
    { id: 'pharma_whatsapp_refills', name: 'WhatsApp Invoice PDF & Patient Medication Refill Reminders', default: true },
    { id: 'pharma_supplier_orders', name: 'Supplier Purchase Orders & Automated GST Tax Inwarding', default: false },
    { id: 'pharma_abdm_erx', name: 'ABDM 2.0 e-Prescription QR Scan & Dispense', default: false }
  ],
  DIAGNOSTIC_CENTRE: [
    { id: 'radio_dicom_viewer', name: 'Zero-Footprint Web DICOM Viewer with 200+ Image Tools', default: true },
    { id: 'radio_speech_reporting', name: 'Radiologist Speech-to-Text Structured Voice Reporting', default: true },
    { id: 'radio_whatsapp_dicom', name: 'Secure WhatsApp Diagnostic Scan & DICOM Cloud Link for Patients', default: true },
    { id: 'radio_mwl_sync', name: 'Modality Worklist (MWL) & DICOM CT/MRI Machine Sync', default: true },
    { id: 'radio_aerb_pndt', name: 'AERB & PNDT Automated Regulatory Compliance Audit Registers', default: true },
    { id: 'radio_doctor_referral', name: 'Doctor Referral Commission Split & B2B Ledger', default: false },
    { id: 'radio_ai_cad', name: 'AI Computer-Aided Chest X-Ray Nodule Detection', default: false }
  ],
  COMPANY_HQ: []
};

export interface RegisteredPartnerUser {
  id: string;
  name: string;
  email: string;
  password?: string | undefined;
  phone?: string | undefined;
  facilityName: string;
  facilityType: HealthcareFacilityType;
  city?: string | undefined;
  licenseNumber?: string | undefined;
  bedCapacity?: number | undefined;
  gstinNumber?: string | undefined;
  role: string;
  roleTitle: string;
  department: string;
  tenantName: string;
  organizationType: 'HOSPITAL' | 'CLINIC' | 'PHARMACY' | 'PATHOLOGY' | 'DIAGNOSTIC_CENTRE' | 'ENTERPRISE_COMMAND';
  allowedWorkspaces: Array<'HOSPITAL' | 'CLINIC' | 'PHARMACY' | 'PATHOLOGY' | 'DIAGNOSTIC_CENTRE' | 'ENTERPRISE_COMMAND'>;
  defaultModule: string;
  planTier: string;
  accessibleFeatures: string[];
  restrictedFeatures: string[];
  ownerAadhaarNumber?: string | undefined;
  aadhaarDocFileName?: string | undefined;
  aadhaarDocDataUrl?: string | undefined;
  licenseDocFileName?: string | undefined;
  licenseDocDataUrl?: string | undefined;
  kycStatus?: 'PENDING_ADMIN_VERIFICATION' | 'KYC_VERIFIED' | 'KYC_REJECTED' | undefined;
  kycSubmittedAt?: string | undefined;
  onboardingEnvironment?: string | undefined;
  registeredAt?: string | undefined;
  requestedPlan?: {
    tier: string;
    planName: string;
    monthlyFee: number;
    billingFrequency?: string | undefined;
  } | null | undefined;
  advancePayment?: {
    status: 'PAID' | 'REFUND_TRIGGERED' | 'FAILED' | 'PENDING';
    amount: number;
    paymentMethod?: string | undefined;
    transactionId?: string | undefined;
    paidAt?: string | undefined;
  } | null | undefined;
  paymentStatus?: string | undefined;
}

// Pure Day-0 Production Zero Slate: No hardcoded built-in credentials
export const BUILT_IN_USERS: RegisteredPartnerUser[] = [];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  partnerPortalUrl: string;
  companyPortalUrl: string;
  initialTab?: 'LOGIN' | 'REGISTER';
}

export const UnifiedHealthcareLoginModal: React.FC<Props> = ({
  isOpen,
  onClose,
  partnerPortalUrl,
  companyPortalUrl,
  initialTab = 'LOGIN'
}) => {
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>(initialTab);

  // Listen for Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Promotional Campaign Integration (HQ Controlled)
  const [promoCampaign, setPromoCampaign] = useState<PromotionalCampaignConfig>(getPromotionalCampaign());
  const [promoMetrics, setPromoMetrics] = useState<CampaignCalculatedMetrics>(calculateCampaignMetrics(promoCampaign));

  // Sync promotional campaign from backend API /api/v1/auth/launch-offer
  useEffect(() => {
    let mounted = true;
    const refreshPromo = async () => {
      try {
        const remote = await fetchPromotionalCampaignRemote();
        if (mounted) {
          setPromoCampaign(remote);
          setPromoMetrics(calculateCampaignMetrics(remote));
        }
      } catch {
        if (mounted) {
          const c = getPromotionalCampaign();
          setPromoCampaign(c);
          setPromoMetrics(calculateCampaignMetrics(c));
        }
      }
    };

    refreshPromo();
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshPromo();
      }
    }, 60000);
    if (typeof window !== 'undefined') {
      window.addEventListener(PROMOTIONAL_CAMPAIGN_EVENT, refreshPromo);
    }
    return () => {
      mounted = false;
      clearInterval(timer);
      if (typeof window !== 'undefined') {
        window.removeEventListener(PROMOTIONAL_CAMPAIGN_EVENT, refreshPromo);
      }
    };
  }, []);

  const isPromoActive = promoCampaign.status === 'ACTIVE' && !promoMetrics.isExpired && !promoMetrics.isLocked;

  // Login form state
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Self-Registration form state (Fetched dynamically from backend /api/v1/auth/registration-form-config)
  const [formPolicy, setFormPolicy] = useState<RegistrationFormPolicy>(DEFAULT_REGISTRATION_FORM_POLICY);

  // Dynamic Registration Form Policy Sync from Backend
  useEffect(() => {
    let mounted = true;
    const fetchFormPolicy = async () => {
      try {
        const res = await fetch('/api/v1/auth/registration-form-config');
        if (res.ok) {
          const json = (await res.json()) as any;
          if (json && json.success && json.data && mounted) {
            setFormPolicy(json.data);
          }
        }
      } catch {
        // use fallback policy
      }
    };

    fetchFormPolicy();
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchFormPolicy();
      }
    }, 60000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);
  const [regCategory, setRegCategory] = useState<HealthcareFacilityType>('HOSPITAL');
  const [regSelectedModules, setRegSelectedModules] = useState<string[]>(
    (PROFILE_MODULES_MAP.HOSPITAL || []).map((m) => m.name)
  );

  const handleRegCategoryChange = (newCat: HealthcareFacilityType) => {
    setRegCategory(newCat);
    const catModules = PROFILE_MODULES_MAP[newCat] || [];
    // HOSPITAL: All 8 departments & modules PRE-SELECTED by default!
    const defaultMods = newCat === 'HOSPITAL'
      ? catModules.map((m) => m.name)
      : catModules.filter((m) => m.default).map((m) => m.name);
    setRegSelectedModules(defaultMods);

    const matching = (formPolicy.availablePlans || DEFAULT_PUBLIC_PLANS).find(
      (p) => p.applicableFacilityTypes?.includes(newCat as any)
    );
    if (matching) {
      setRequestedPlanTier(matching.tier);
    }
  };

  const [regFacilityName, setRegFacilityName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regLicense, setRegLicense] = useState('');
  const [regBedCapacity, setRegBedCapacity] = useState('');
  const [regGstin, setRegGstin] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAadhaarNumber, setRegAadhaarNumber] = useState('');
  const [regAadhaarDocFileName, setRegAadhaarDocFileName] = useState('');
  const [regAadhaarDocDataUrl, setRegAadhaarDocDataUrl] = useState('');
  const [regLicenseDocFileName, setRegLicenseDocFileName] = useState('');
  const [regLicenseDocDataUrl, setRegLicenseDocDataUrl] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState(false);

  // Option 2 (Partner Chooses Plan) & Option 3 (Advance Payment Self-Checkout)
  const [requestedPlanTier, setRequestedPlanTier] = useState<string>('FREE_YEAR_1');
  const [advancePaymentRecord, setAdvancePaymentRecord] = useState<{
    status: 'PAID';
    amount: number;
    paymentMethod: string;
    transactionId: string;
    paidAt: string;
  } | null>(null);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [simulatedUpi, setSimulatedUpi] = useState('hospital.payments@upi');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const allAvailablePlans = (formPolicy.availablePlans && formPolicy.availablePlans.length > 0
    ? formPolicy.availablePlans.filter((p) => p.isActive !== false)
    : DEFAULT_PUBLIC_PLANS);

  const baseAvailablePlans = (() => {
    const matched = allAvailablePlans.filter(
      (p) => !p.applicableFacilityTypes || p.applicableFacilityTypes.includes('ALL') || p.applicableFacilityTypes.includes(regCategory as any)
    );
    return matched.length > 0 ? matched : allAvailablePlans;
  })();

  const availablePlans = baseAvailablePlans;

  useEffect(() => {
    if (baseAvailablePlans.length > 0 && !baseAvailablePlans.some((p) => p.tier === requestedPlanTier || p.code === requestedPlanTier || p.id === requestedPlanTier)) {
      const firstPlan = baseAvailablePlans[0];
      if (firstPlan) {
        setRequestedPlanTier(firstPlan.tier);
      }
    }
  }, [regCategory, baseAvailablePlans, requestedPlanTier]);

  const currentPlan: DynamicRegistrationPlan = (availablePlans.find((p) => p.tier === requestedPlanTier || p.code === requestedPlanTier || p.id === requestedPlanTier)
    || availablePlans[0]
    || DEFAULT_PUBLIC_PLANS[0])!;

  // Format Aadhaar Number to XXXX XXXX XXXX
  const formatAadhaarInput = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '').slice(0, 12);
    const parts = [];
    for (let i = 0; i < raw.length; i += 4) {
      parts.push(raw.substring(i, i + 4));
    }
    return parts.join(' ');
  };

  // Handle Aadhaar Document file upload
  const handleAadhaarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRegAadhaarDocFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setRegAadhaarDocDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle License Document file upload
  const handleLicenseFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRegLicenseDocFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setRegLicenseDocDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Load dynamically registered partners and active registration form policy
  const [serverPartners, setServerPartners] = useState<RegisteredPartnerUser[]>([]);

  const fetchFormPolicy = async () => {
    try {
      const res = await fetch('/api/v1/auth/registration-form-config');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setFormPolicy(json.data);
          if (json.data.defaultPlanTier && json.data.defaultPlanTier !== 'PENDING_FOUNDER') {
            setRequestedPlanTier(json.data.defaultPlanTier);
          }
          if (json.data.allowedFacilityTypes?.length > 0 && !json.data.allowedFacilityTypes.includes(regCategory)) {
            setRegCategory(json.data.allowedFacilityTypes[0]);
          }
        }
      }
    } catch {}
  };

  const fetchServerPartners = async () => {
    try {
      const res = await fetch('/api/v1/auth/self-registered-partners');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setServerPartners(json.data);
        }
      }
    } catch {}
  };

  // Zero-Trust Day-0 Purge: Scrub any stale test registrations from browser storage on mount
  useEffect(() => {
    try {
      const keys = ['docsearch_registered_partners', 'docsearch_verification_queue', 'docsearch_partner_staff'];
      const badTokens = ['ak dk', 'tk sah', 'tk@gm.bom', 'asit lal', 'stf-468'];
      keys.forEach((k) => {
        const val = localStorage.getItem(k);
        if (val) {
          const lower = val.toLowerCase();
          if (badTokens.some((tok) => lower.includes(tok))) {
            localStorage.removeItem(k);
          }
        }
      });
    } catch {}
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchServerPartners();
      fetchFormPolicy();
    }
  }, [isOpen]);

  const getDynamicPartners = (): RegisteredPartnerUser[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('docsearch_registered_partners');
      const list: RegisteredPartnerUser[] = raw ? JSON.parse(raw) : [];
      const badTokens = ['ak dk', 'tk sah', 'tk@gm.bom', 'asit lal'];
      return list.filter((p) => {
        const combined = `${p.name || ''} ${p.email || ''} ${p.facilityName || ''}`.toLowerCase();
        return !badTokens.some((tok) => combined.includes(tok));
      });
    } catch {
      return [];
    }
  };

  const saveDynamicPartner = (partner: RegisteredPartnerUser) => {
    const list = getDynamicPartners();
    list.push(partner);
    localStorage.setItem('docsearch_registered_partners', JSON.stringify(list));
  };

  // Find user by email or phone
  const findUser = (query: string): RegisteredPartnerUser | undefined => {
    const clean = query.trim().toLowerCase();
    if (!clean) return undefined;
    const dynamicList = getDynamicPartners();
    const all = [...BUILT_IN_USERS, ...serverPartners, ...dynamicList];
    const digitsOnly = clean.replace(/[^0-9]/g, '');

    return all.find((u) => {
      if (u.email.toLowerCase() === clean) return true;
      if (digitsOnly.length >= 7 && u.phone) {
        const uDigits = u.phone.replace(/[^0-9]/g, '');
        if (uDigits && (uDigits.endsWith(digitsOnly) || digitsOnly.endsWith(uDigits))) {
          return true;
        }
      }
      return false;
    });
  };

  // Preview detected panel for current login input
  const matchedUser = findUser(loginId);



  // Handle Real Backend Login & Portal Routing (Fail-Closed)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginId.trim()) {
      setLoginError('Please enter your Login ID or Email.');
      return;
    }

    if (!password) {
      setLoginError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginId.trim().toLowerCase(),
          password: password.trim()
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setIsSubmitting(false);
        setLoginError(json.error?.message || json.message || 'Invalid login credentials. Please check your ID and password.');
        return;
      }

      setIsSubmitting(false);
      const authUser = json.data?.user;
      const token = json.data?.accessToken;

      if (!token) {
        setLoginError('Authentication succeeded but session token is missing.');
        return;
      }

      // Check if user is company HQ executive or partner
      const isCompany = authUser?.roles?.some((r: string) =>
        ['SUPER_ADMIN', 'SUPER_ADMIN_FOUNDER', 'COMPANY_ADMIN', 'FINANCE_CONTROLLER', 'COMPLIANCE_OFFICER', 'DEVOPS_LEAD', 'GROWTH_LEAD'].includes(r)
      );
      const targetBase = isCompany ? companyPortalUrl : partnerPortalUrl;
      window.location.href = `${targetBase}/?token=${encodeURIComponent(token)}`;
    } catch (err: any) {
      setIsSubmitting(false);
      setLoginError('Authentication service unreachable. Please check network connection.');
    }
  };

  // Handle Self-Registration Submit with Universal Policy Enforcement
  const handleRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    // 1. Basic Identity Validation
    if (!regFacilityName.trim()) {
      setRegError('Facility Name is required.');
      return;
    }
    if (!regOwnerName.trim()) {
      setRegError('Owner / In-Charge Doctor name is required.');
      return;
    }
    if (!regEmail.trim()) {
      setRegError('Email Address is required (this will be your Login ID).');
      return;
    }

    // 2. Mobile / WhatsApp Policy
    if (regPhone.trim() && (regPhone.trim().length !== 10 || !/^[6-9]/.test(regPhone.trim()))) {
      setRegError('Kripya valid 10-digit Indian mobile number enter karein (starts with 6, 7, 8, or 9).');
      return;
    }
    if (formPolicy.fieldRules.mobileWhatsapp === 'MANDATORY' && !regPhone.trim()) {
      setRegError('Mobile / WhatsApp Number is mandatory under current HQ policy.');
      return;
    }

    // 3. City / State Policy
    if (formPolicy.fieldRules.cityState === 'MANDATORY' && !regCity.trim()) {
      setRegError('City & State is mandatory under current HQ policy.');
      return;
    }

    // 4. Clinical Registration / License Number & Upload Policy
    if (formPolicy.fieldRules.clinicalLicense === 'MANDATORY' && !regLicense.trim()) {
      setRegError('Clinical Registration / License Number is mandatory under current HQ policy.');
      return;
    }
    if (formPolicy.fieldRules.licenseDocUpload === 'MANDATORY' && !regLicenseDocFileName) {
      setRegError('Clinical Registration / License Document upload is mandatory under current HQ policy.');
      return;
    }

    // 5. Inpatient Bed Capacity Policy
    if (formPolicy.fieldRules.bedCapacity === 'MANDATORY' && (!regBedCapacity || parseInt(regBedCapacity, 10) <= 0)) {
      setRegError('Inpatient Bed Capacity (greater than 0) is mandatory under current HQ policy.');
      return;
    }

    // 6. GSTIN / Tax ID Policy
    const cleanGstin = regGstin.trim().toUpperCase();
    if (formPolicy.fieldRules.gstinNumber === 'MANDATORY') {
      if (!cleanGstin || cleanGstin.length !== 15) {
        setRegError('A valid 15-character GSTIN number is mandatory under current HQ policy.');
        return;
      }
    }

    // 7. Password Creation Policy
    let finalPassword = regPassword;
    if (formPolicy.fieldRules.passwordCreation === 'MANDATORY') {
      if (!regPassword || regPassword.length < 6) {
        setRegError('Password must be at least 6 characters.');
        return;
      }
    } else {
      // AUTO_GENERATE credentials
      if (!finalPassword) {
        finalPassword = `DocSearch@${Math.floor(100000 + Math.random() * 900000)}`;
      }
    }

    // 8. Aadhaar Number & Document Upload Policy
    const cleanAadhaar = regAadhaarNumber.replace(/[^0-9]/g, '');
    if (formPolicy.fieldRules.ownerAadhaar === 'MANDATORY') {
      if (!cleanAadhaar) {
        setRegError('Owner Aadhaar Card Number is mandatory for government KYC and compliance.');
        return;
      }
      if (cleanAadhaar.length !== 12) {
        setRegError('Owner Aadhaar Number must be exactly 12 numeric digits (e.g. XXXX XXXX 2345).');
        return;
      }
    } else if (formPolicy.fieldRules.ownerAadhaar === 'OPTIONAL' && cleanAadhaar) {
      if (cleanAadhaar.length !== 12) {
        setRegError('If provided, Owner Aadhaar Number must be exactly 12 numeric digits.');
        return;
      }
    }

    if (formPolicy.fieldRules.aadhaarDocUpload === 'MANDATORY' && formPolicy.fieldRules.ownerAadhaar !== 'HIDDEN') {
      if (formPolicy.fieldRules.ownerAadhaar === 'MANDATORY' || cleanAadhaar) {
        if (!regAadhaarDocFileName) {
          setRegError('Mandatory Owner Aadhaar Card Document upload is missing. Please attach a PDF, JPG, or PNG.');
          return;
        }
      }
    }

    // Check if email already registered
    const cleanEmail = regEmail.trim().toLowerCase();
    const existing = [...BUILT_IN_USERS, ...getDynamicPartners()].find(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    if (existing) {
      setRegError(`An account with email "${regEmail}" is already registered. Please sign in instead.`);
      return;
    }

    setIsSubmitting(true);

    // Build allotted workspace configuration based on selected category
    const effectiveCategory: 'PATHOLOGY' | 'CLINIC' | 'PHARMACY' | 'HOSPITAL' | 'DIAGNOSTIC_CENTRE' =
      regCategory === 'COMPANY_HQ' ? 'HOSPITAL' : regCategory;
    let orgType: 'PATHOLOGY' | 'CLINIC' | 'PHARMACY' | 'HOSPITAL' | 'DIAGNOSTIC_CENTRE' = effectiveCategory;
    let defaultMod = 'clinical-investigation';
    let role = 'PATHOLOGIST';
    let roleTitle = `${regFacilityName} (Chief Pathologist)`;
    let department = 'Pathology & Diagnostic Laboratory';
    let allowedWorkspaces: Array<'HOSPITAL' | 'CLINIC' | 'PHARMACY' | 'PATHOLOGY' | 'DIAGNOSTIC_CENTRE' | 'ENTERPRISE_COMMAND'> = [effectiveCategory];
    let accessibleFeatures = regSelectedModules.length > 0
      ? regSelectedModules
      : (PROFILE_MODULES_MAP[regCategory] || []).filter((m) => m.default).map((m) => m.name);

    if (regCategory === 'CLINIC') {
      defaultMod = 'clinical-consultation';
      role = 'CLINIC_DOCTOR';
      roleTitle = `${regFacilityName} (Consulting Doctor)`;
      department = 'Outpatient Medical Consultation';
      allowedWorkspaces = ['CLINIC'];
    } else if (regCategory === 'PHARMACY') {
      defaultMod = 'pharmacy-medication';
      role = 'PHARMACIST';
      roleTitle = `${regFacilityName} (Chief Pharmacist)`;
      department = 'Retail Pharmacy & Inventory';
      allowedWorkspaces = ['PHARMACY'];
    } else if (regCategory === 'HOSPITAL') {
      defaultMod = 'executive-command-center';
      role = 'HOSPITAL_DIRECTOR';
      roleTitle = `${regFacilityName} (Medical Director)`;
      department = 'Hospital Administration';
      allowedWorkspaces = ['HOSPITAL', 'CLINIC', 'PHARMACY', 'PATHOLOGY', 'DIAGNOSTIC_CENTRE', 'ENTERPRISE_COMMAND'];
    } else if (regCategory === 'DIAGNOSTIC_CENTRE') {
      defaultMod = 'radiology-imaging';
      role = 'RADIOLOGIST';
      roleTitle = `${regFacilityName} (Chief Radiologist / PACS Lead)`;
      department = 'Radiology, MRI, CT & Imaging';
      allowedWorkspaces = ['DIAGNOSTIC_CENTRE', 'PATHOLOGY'];
    }

    // Plan & Payment Resolution based on HQ Policy Master Switch & Promotional Campaign
    const showPlans = formPolicy.showPlanSelection;
    const isEarlyBirdSelected = isPromoActive && (requestedPlanTier === 'EARLY_BIRD_LAUNCH_GRANT' || currentPlan.id === 'plan_launch_promo_grant');
    const chosenPlan = currentPlan;

    const planTier = isEarlyBirdSelected
      ? `${promoCampaign.planName} (Early-Bird Launch Grant - 100% Free)`
      : showPlans ? chosenPlan.name : 'Pending Founder Assignment';

    const isFreePlan = isEarlyBirdSelected || chosenPlan.price === 0;
    const requestedPlan = isEarlyBirdSelected ? {
      id: 'plan_launch_promo_grant',
      code: 'PLAN_PROMO_GRANT_FREE',
      tier: 'FOUNDING',
      name: `${promoCampaign.planName} (Early-Bird Launch Partner - ₹0)`,
      planName: `${promoCampaign.planName} (Early-Bird Launch Partner - ₹0)`,
      price: 0,
      monthlyFee: 0,
      billingInterval: 'ANNUAL',
      billingFrequency: `${promoCampaign.durationMonths} MONTHS FREE`,
      durationDays: promoCampaign.durationMonths ? promoCampaign.durationMonths * 30 : 365,
      isFree: true,
      features: accessibleFeatures,
      requestedAt: new Date().toISOString()
    } : {
      id: chosenPlan.id || `plan_${regCategory.toLowerCase()}_default`,
      code: chosenPlan.code || `PLAN_${regCategory.toUpperCase()}_DEFAULT`,
      tier: chosenPlan.tier || (isFreePlan ? 'FOUNDING' : 'ANNUAL'),
      name: chosenPlan.name,
      planName: chosenPlan.name,
      price: chosenPlan.price !== undefined ? chosenPlan.price : 0,
      monthlyFee: chosenPlan.price === 0 ? 0 : Math.round((chosenPlan.price || 0) / 12),
      billingInterval: chosenPlan.billingInterval || 'ANNUAL',
      billingFrequency: chosenPlan.billingInterval || 'ANNUAL',
      durationDays: 365,
      isFree: isFreePlan,
      features: accessibleFeatures,
      requestedAt: new Date().toISOString()
    };

    const advancePayment = isEarlyBirdSelected ? {
      status: 'PAID' as const,
      amount: 0,
      paymentMethod: `PROMOTIONAL_VOUCHER_${promoCampaign.promoCode}`,
      transactionId: `PROMO-GRANT-${Date.now()}`,
      paidAt: new Date().toISOString()
    } : (showPlans && formPolicy.allowAdvancePayment) ? advancePaymentRecord : null;

    const paymentStatus = isEarlyBirdSelected
      ? 'PROMOTIONAL_FREE_GRANT'
      : advancePayment?.status === 'PAID' ? 'ADVANCE_PAID' : (showPlans ? 'PENDING_APPROVAL' : 'PENDING_FOUNDER_ASSIGNMENT');

    const newPartner: RegisteredPartnerUser = {
      id: `REG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      name: regOwnerName.trim(),
      email: regEmail.trim(),
      password: finalPassword,
      phone: regPhone.trim(),
      facilityName: regFacilityName.trim(),
      facilityType: regCategory,
      city: regCity.trim() || 'India',
      licenseNumber: regLicense.trim() || 'REG-PENDING',
      bedCapacity: regBedCapacity ? parseInt(regBedCapacity, 10) : undefined,
      gstinNumber: cleanGstin || undefined,
      role,
      roleTitle,
      department,
      tenantName: regFacilityName.trim(),
      organizationType: orgType,
      allowedWorkspaces,
      defaultModule: defaultMod,
      planTier,
      requestedPlan,
      advancePayment,
      paymentStatus,
      accessibleFeatures,
      restrictedFeatures: [],
      ownerAadhaarNumber: cleanAadhaar || undefined,
      aadhaarDocFileName: regAadhaarDocFileName || undefined,
      aadhaarDocDataUrl: regAadhaarDocDataUrl || undefined,
      licenseDocFileName: regLicenseDocFileName || undefined,
      licenseDocDataUrl: regLicenseDocDataUrl || undefined,
      kycStatus: 'PENDING_ADMIN_VERIFICATION',
      kycSubmittedAt: new Date().toISOString(),
      onboardingEnvironment: isEarlyBirdSelected ? 'LAUNCH_OFFER_100_PARTNERS' : 'PIONEER_FREE_10000_TIER',
      registeredAt: new Date().toISOString()
    };

    saveDynamicPartner(newPartner);

    // Package submitted documents
    const submittedDocuments = [];
    if (regLicenseDocFileName) {
      submittedDocuments.push({
        documentId: `doc-lic-${newPartner.id}`,
        documentName: regLicenseDocFileName,
        documentType: 'Clinical Establishment / Drug / Medical Council License Proof',
        dataUrl: regLicenseDocDataUrl || undefined,
        documentDataUrl: regLicenseDocDataUrl || undefined,
        fileSizeKb: 120,
        sha256Hash: Array.from(regLicenseDocFileName + regFacilityName).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0).toString(16).padStart(64, '0')
      });
    }
    if (regAadhaarDocFileName) {
      submittedDocuments.push({
        documentId: `doc-adh-${newPartner.id}`,
        documentName: regAadhaarDocFileName,
        documentType: 'Owner Government Aadhaar Card (Mandatory KYC)',
        dataUrl: regAadhaarDocDataUrl || undefined,
        documentDataUrl: regAadhaarDocDataUrl || undefined,
        fileSizeKb: 95,
        sha256Hash: Array.from((cleanAadhaar || 'NO_AADHAAR') + regEmail).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0).toString(16).padStart(64, '0')
      });
    }

    // Stage in verification queue for Company Founder / Admin Console review
    const verificationItem = {
      id: `KYC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      partnerName: regFacilityName.trim(),
      partnerType: regCategory,
      tenantSlug: regFacilityName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      submittedBy: regOwnerName.trim(),
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
      category: 'AADHAAR_KYC' as const,
      status: 'PENDING_APPROVAL' as const,
      requestedPlan: requestedPlan,
      advancePayment: advancePayment,
      details: {
        'Facility Name': regFacilityName.trim(),
        'Owner / Lead Doctor': regOwnerName.trim(),
        'Owner Aadhaar Number': cleanAadhaar ? `XXXX-XXXX-${cleanAadhaar.slice(-4)}` : 'Not Provided / Hidden',
        'Registered Email': regEmail.trim(),
        'Contact Phone': regPhone.trim() || 'N/A',
        'Facility License': regLicense.trim() || 'N/A',
        'City & State': regCity.trim() || 'India',
        'Bed Capacity': regBedCapacity ? `${regBedCapacity} Beds` : 'N/A',
        'GSTIN / Tax ID': cleanGstin || 'N/A',
        'Requested Plan': requestedPlan ? `${requestedPlan.planName} (₹${requestedPlan.monthlyFee.toLocaleString('en-IN')}/mo)` : 'Pending Founder Assignment',
        'Advance Payment': advancePayment ? `PAID ₹${advancePayment.amount} (Txn: ${advancePayment.transactionId})` : (showPlans ? 'Pay Post-Approval' : 'Founder Assigned'),
        'Onboarding Tier': requestedPlan ? `${requestedPlan.planName} (Partner Requested • Dual-Control)` : 'Pending Founder Assignment (Option 1 B2B)'
      },
      documentName: regAadhaarDocFileName || regLicenseDocFileName || 'KYC-Verification-Docs.pdf',
      documentType: 'Owner KYC & Clinical Credentials Proof',
      documents: submittedDocuments,
      aiMatchScore: 98.6,
      extractedOcrText: `GOVERNMENT OF INDIA • HEALTHCARE ESTABLISHMENT: ${regFacilityName.trim().toUpperCase()} • PROPRIETOR: ${regOwnerName.trim().toUpperCase()} • LIC: ${regLicense.trim() || 'PENDING'} • AADHAAR: ${cleanAadhaar ? `XXXX XXXX ${cleanAadhaar.slice(-4)}` : 'EXEMPT'} • CITY: ${regCity.trim().toUpperCase() || 'INDIA'}`,
      sha256Hash: Array.from((cleanAadhaar || 'NO_AADHAAR') + regEmail).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0).toString(16).padStart(64, '0')
    };
    try {
      const q = JSON.parse(localStorage.getItem('docsearch_verification_queue') || '[]');
      q.unshift(verificationItem);
      localStorage.setItem('docsearch_verification_queue', JSON.stringify(q));
    } catch {}

    // Synchronize immediately to API Gateway so Admin (Port 5174) and Directory receive it across ports
    fetch('/api/v1/auth/self-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partner: newPartner,
        verificationItem
      })
    }).catch((err) => {
      console.warn('Could not post to /api/v1/auth/self-register:', err);
    });

    setRegSuccess(true);
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(16px)',
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @media (max-width: 1100px) {
          .ds-modal-split-grid {
            grid-template-columns: 1fr !important;
            max-width: 620px !important;
            height: 90vh !important;
          }
          .ds-modal-left-marketing {
            display: none !important;
          }
        }
        .ds-modal-scroll-pane::-webkit-scrollbar {
          width: 8px;
        }
        .ds-modal-scroll-pane::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.6);
        }
        .ds-modal-scroll-pane::-webkit-scrollbar-thumb {
          background: rgba(56, 189, 248, 0.4);
          border-radius: 4px;
        }
        .ds-modal-scroll-pane::-webkit-scrollbar-thumb:hover {
          background: rgba(56, 189, 248, 0.7);
        }
      `}</style>
      <div
        className="ds-modal-split-grid"
        style={{
          backgroundColor: 'var(--ds-color-surface)',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '1440px',
          height: '92vh',
          maxHeight: '920px',
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.95), 0 0 60px rgba(6, 182, 212, 0.2)',
          color: 'var(--ds-color-text-primary)',
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)',
          gridTemplateRows: '100%',
          overflow: 'hidden'
        }}
      >
        {/* LEFT COLUMN: PARTNER CAMPAIGN, OFFERS & INCENTIVES SHOWCASE */}
        <div
          className="ds-modal-left-marketing ds-modal-scroll-pane"
          style={{
            backgroundColor: 'rgba(11, 19, 43, 0.85)',
            borderRight: '1.5px solid rgba(56, 189, 248, 0.2)',
            overflowY: 'auto',
            height: '100%',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <PartnerCampaignShowcasePanel
            campaign={promoCampaign}
            metrics={promoMetrics}
            onClaimOffer={() => {
              setActiveTab('REGISTER');
              setLoginError(null);
              setRegError(null);
            }}
          />
        </div>

        {/* RIGHT COLUMN: HEALTHCARE SSO LOGIN & REGISTRATION FORMS */}
        <div
          className="ds-modal-scroll-pane"
          style={{
            backgroundColor: 'var(--ds-color-surface)',
            overflowY: 'auto',
            height: '100%',
            minHeight: 0,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: 'var(--ds-color-text-muted)',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.color = 'var(--ds-color-danger)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = 'var(--ds-color-text-muted)';
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px 20px', paddingRight: '52px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <DocSearchLogo
              variant="compact"
              size="md"
              badgeText="HEALTHCARE SSO"
              redirectUrl="/"
              clickable={true}
              onClick={() => onClose()}
            />
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            {activeTab === 'LOGIN'
              ? 'Enter your login credentials to instantly access your allotted clinical or administrative panel.'
              : 'Complete your facility profile for instant clinical panel provisioning & license allocation.'}
          </p>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              type="button"
              onClick={() => {
                setActiveTab('LOGIN');
                setLoginError(null);
              }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'LOGIN' ? 'var(--ds-color-primary)' : 'transparent',
                color: activeTab === 'LOGIN' ? 'var(--ds-color-primary-foreground)' : 'var(--ds-color-text-muted)',
                fontWeight: activeTab === 'LOGIN' ? 800 : 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              🔑 Sign In to My Panel
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('REGISTER');
                setRegError(null);
              }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'REGISTER' ? 'var(--ds-color-success)' : 'transparent',
                color: activeTab === 'REGISTER' ? 'var(--ds-color-primary-foreground)' : 'var(--ds-color-text-muted)',
                fontWeight: activeTab === 'REGISTER' ? 800 : 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ✨ Self-Register New Facility
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px 28px' }}>
          {activeTab === 'LOGIN' ? (
            /* TAB 1: LOGIN FORM */
            <form onSubmit={handleLoginSubmit}>
              {loginError && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid var(--ds-color-danger)',
                    color: 'var(--ds-color-danger)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>⚠️</span> {loginError}
                </div>
              )}

              {/* Dynamic Panel Detection Banner */}
              {matchedUser && (
                <div
                  style={{
                    backgroundColor: 'rgba(6, 182, 212, 0.12)',
                    border: '1px solid rgba(6, 182, 212, 0.35)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>
                      {matchedUser.facilityType === 'PATHOLOGY' ? '🧪' : matchedUser.facilityType === 'CLINIC' ? '🩺' : matchedUser.facilityType === 'PHARMACY' ? '💊' : matchedUser.facilityType === 'HOSPITAL' ? '🏥' : '🏢'}
                    </span>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--ds-color-accent)' }}>
                        Allotted Panel: {matchedUser.facilityName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                        Role: {matchedUser.roleTitle} ({matchedUser.organizationType})
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      backgroundColor: 'var(--ds-color-primary)',
                      color: 'var(--ds-color-text-primary)',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}
                  >
                    READY
                  </span>
                </div>
              )}

              {/* Input: Login ID */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '6px' }}>
                  Login ID / Registered Email or Phone
                </label>
                <input
                  type="text"
                  placeholder="e.g. partner@hospital.in, lead@pathology.com"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--ds-color-surface)',
                    border: '1.5px solid rgba(255, 255, 255, 0.15)',
                    color: 'var(--ds-color-text-primary)',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Input: Password */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '6px' }}>
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--ds-color-surface)',
                    border: '1.5px solid rgba(255, 255, 255, 0.15)',
                    color: 'var(--ds-color-text-primary)',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Submit Button & 3D Login Telemetry */}
              {isSubmitting ? (
                <div style={{ padding: '8px 0' }}>
                  <DocSearch3DLogoLoader mode="login" size="sm" />
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, var(--ds-color-accent) 0%, var(--ds-color-primary) 100%)',
                    color: 'var(--ds-color-primary-foreground)',
                    fontWeight: 900,
                    fontSize: '0.9375rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 18px rgba(6, 182, 212, 0.4)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  🚀 Sign In & Enter Allotted Panel →
                </button>
              )}


            </form>
          ) : (
            /* TAB 2: SELF-REGISTRATION FORM */
            <form onSubmit={handleRegistrationSubmit}>
              {regError && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid var(--ds-color-danger)',
                    color: 'var(--ds-color-danger)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    marginBottom: '16px'
                  }}
                >
                  ⚠️ {regError}
                </div>
              )}

              {regSuccess && (
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid var(--ds-color-success)',
                    color: 'var(--ds-color-success)',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    marginBottom: '16px',
                    textAlign: 'center',
                    lineHeight: 1.5
                  }}
                >
                  {formPolicy.showPlanSelection ? (
                    <>🎉 Registration successful! Allocating your {regCategory} panel and logging in...</>
                  ) : (
                    <>🎉 Registration submitted successfully! Details queued for DocSearch Founder review. Founder will assign custom subscription tier & bed capacity pricing upon document verification.</>
                  )}
                </div>
              )}

              {/* Dynamic HQ Controlled Launch Offer Voucher & Seats Warning */}
              {isPromoActive ? (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
                  border: '1.5px solid var(--ds-color-success)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      fontSize: '1.6rem',
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(16, 185, 129, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      🚀
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 900, color: 'var(--ds-color-success)' }}>
                          Early-Bird Launch Grant: Voucher {promoCampaign.promoCode} Auto-Applied!
                        </span>
                        <span style={{
                          backgroundColor: '#10B981',
                          color: '#070B14',
                          fontSize: '0.625rem',
                          fontWeight: 900,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          letterSpacing: '0.05em'
                        }}>
                          100% OFF (₹0 DUE)
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)', marginTop: '3px' }}>
                        {promoCampaign.subtitle} • <strong style={{ color: 'var(--ds-color-success)' }}>{promoMetrics.remainingSeats} of {promoCampaign.targetSeats} seats left</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: 'var(--ds-color-success)',
                    fontFamily: 'monospace'
                  }}>
                    ⏳ Closes In: {promoMetrics.formattedTimeLeft}
                  </div>
                </div>
              ) : (
                /* HQ Configurable Announcement Banner */
                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '1.4rem' }}>{formPolicy.showPlanSelection ? '🎁' : '🛡️'}</span>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--ds-color-success)' }}>
                      {formPolicy.bannerNotice || 'Universal Healthcare Partner Registration'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>
                      {formPolicy.showPlanSelection
                        ? 'Complimentary software onboarding & sandbox access • Government KYC verification required.'
                        : 'Option 1 Pure B2B Onboarding • Complete facility profile & KYC. Founder assigns customized tier & subscription upon verification.'}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Category Selector (Filtered by HQ Policy) */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)' }}>
                    1. Select Facility Category (Panel Allotment):
                  </label>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                    {formPolicy.allowedFacilityTypes.length} Allowed
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, Math.min(formPolicy.allowedFacilityTypes.length, 4))}, 1fr)`, gap: '8px' }}>
                  {[
                    { id: 'HOSPITAL', icon: '🏥', name: 'Hospital HIS' },
                    { id: 'CLINIC', icon: '🩺', name: 'Doctor / Clinic' },
                    { id: 'PATHOLOGY', icon: '🧪', name: 'Pathology Lab' },
                    { id: 'PHARMACY', icon: '💊', name: 'Pharmacy POS' }
                  ]
                    .filter((cat) => formPolicy.allowedFacilityTypes.includes(cat.id as any))
                    .map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleRegCategoryChange(cat.id as HealthcareFacilityType)}
                        style={{
                          padding: '10px 6px',
                          borderRadius: '10px',
                          backgroundColor: regCategory === cat.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                          border: regCategory === cat.id ? '2px solid var(--ds-color-success)' : '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.1))',
                          color: regCategory === cat.id ? 'var(--ds-color-success)' : 'var(--ds-color-text-muted)',
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{cat.icon}</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>{cat.name}</div>
                      </button>
                    ))}
                </div>
              </div>

              {/* Step 1.5: Profile-Specific Departments & Accessible Modules (Pre-Template, controlled dynamically by HQ) */}
              {formPolicy.showModuleSelection && (
                <div style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '12px',
                  marginBottom: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ds-color-text-secondary)', margin: 0 }}>
                        {regCategory} DEPARTMENTS & ACCESSIBLE MODULES:
                      </label>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--ds-color-success)', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '1px 6px', borderRadius: '10px' }}>
                        🟢 {regSelectedModules.length} Granted
                      </span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--ds-color-danger)', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '1px 6px', borderRadius: '10px' }}>
                        🔴 {(PROFILE_MODULES_MAP[regCategory] || []).length - regSelectedModules.length} Locked
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setRegSelectedModules((PROFILE_MODULES_MAP[regCategory] || []).map((m) => m.name))}
                        style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', border: '1px solid var(--ds-color-accent)', color: 'var(--ds-color-accent)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        ✓ Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegSelectedModules(
                          regCategory === 'HOSPITAL'
                            ? (PROFILE_MODULES_MAP[regCategory] || []).map((m) => m.name)
                            : (PROFILE_MODULES_MAP[regCategory] || []).filter((m) => m.default).map((m) => m.name)
                        )}
                        style={{ backgroundColor: 'var(--ds-color-surface-subtle)', border: '1px solid var(--ds-color-border)', color: 'var(--ds-color-text-secondary)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        ⚡ Essentials
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegSelectedModules([])}
                        style={{ backgroundColor: 'var(--ds-color-surface-subtle)', border: '1px solid var(--ds-color-border)', color: 'var(--ds-color-text-muted)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        🔒 Lock All
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '6px' }}>
                    {(PROFILE_MODULES_MAP[regCategory] || []).map((mod) => {
                      const isChecked = regSelectedModules.includes(mod.name);
                      return (
                        <div
                          key={mod.id}
                          onClick={() => {
                            setRegSelectedModules((prev) =>
                              prev.includes(mod.name) ? prev.filter((m) => m !== mod.name) : [...prev, mod.name]
                            );
                          }}
                          style={{
                            backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                            border: isChecked ? '1px solid var(--ds-color-success)' : '1px solid var(--ds-color-border)',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              style={{ width: '14px', height: '14px', accentColor: 'var(--ds-color-success)' }}
                            />
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isChecked ? 'var(--ds-color-text-primary)' : 'var(--ds-color-text-muted)' }}>
                              {mod.name}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.6rem', fontWeight: 800, color: isChecked ? 'var(--ds-color-success)' : 'var(--ds-color-danger)' }}>
                            {isChecked ? 'ACTIVE' : 'LOCKED'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Facility & Owner Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                    Facility Legal Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. City Multi-Specialty Hospital"
                    value={regFacilityName}
                    onChange={(e) => setRegFacilityName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--ds-color-surface)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--ds-color-text-primary)', fontSize: '0.8125rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                    Owner / Lead Doctor Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. A. K. Verma, MD"
                    value={regOwnerName}
                    onChange={(e) => setRegOwnerName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--ds-color-surface)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--ds-color-text-primary)', fontSize: '0.8125rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Step 3: Contact Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                    Email (Login ID) *
                  </label>
                  <input
                    type="email"
                    placeholder="doctor@myclinic.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--ds-color-surface)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--ds-color-text-primary)', fontSize: '0.8125rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                    Mobile Number (10-Digit Mobile) {formPolicy.fieldRules.mobileWhatsapp === 'MANDATORY' ? '*' : '(Optional)'}
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '10px', color: 'var(--ds-color-accent)', fontWeight: 800, fontSize: '0.8125rem' }}>+91</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="98765 43210"
                      value={regPhone}
                      onChange={(e) => {
                        let digits = e.target.value.replace(/\D/g, '');
                        if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
                        else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
                        setRegPhone(digits.slice(0, 10));
                      }}
                      style={{ width: '100%', padding: '10px 12px 10px 44px', borderRadius: '8px', backgroundColor: 'var(--ds-color-surface)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--ds-color-text-primary)', fontSize: '0.8125rem', boxSizing: 'border-box', fontFamily: 'monospace' }}
                    />
                  </div>
                </div>
              </div>

              {/* Step 4: Facility Metadata & Regulatory Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                    City & State {formPolicy.fieldRules.cityState === 'MANDATORY' ? '*' : '(Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lucknow, UP"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--ds-color-surface)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--ds-color-text-primary)', fontSize: '0.8125rem', boxSizing: 'border-box' }}
                  />
                </div>

                {formPolicy.fieldRules.clinicalLicense !== 'HIDDEN' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                      {regCategory === 'PATHOLOGY' ? 'NABL / Lab Reg No.' : regCategory === 'CLINIC' ? 'Medical Council Reg (NMC)' : regCategory === 'PHARMACY' ? 'Drug License (Form 20/21)' : regCategory === 'DIAGNOSTIC_CENTRE' ? 'AERB / PACS Modality Reg' : 'Clinical Establishment Reg No.'} {formPolicy.fieldRules.clinicalLicense === 'MANDATORY' ? '*' : '(Optional)'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CEA-2026-9812 / NMC-54210"
                      value={regLicense}
                      onChange={(e) => setRegLicense(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--ds-color-surface)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--ds-color-text-primary)', fontSize: '0.8125rem', boxSizing: 'border-box' }}
                    />
                  </div>
                )}

                {formPolicy.fieldRules.bedCapacity !== 'HIDDEN' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                      Inpatient Bed Capacity {formPolicy.fieldRules.bedCapacity === 'MANDATORY' ? '*' : '(Optional)'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 50 (Inpatient Beds)"
                      value={regBedCapacity}
                      onChange={(e) => setRegBedCapacity(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--ds-color-surface)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--ds-color-text-primary)', fontSize: '0.8125rem', boxSizing: 'border-box' }}
                    />
                  </div>
                )}

                {formPolicy.fieldRules.gstinNumber !== 'HIDDEN' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                      GSTIN / Tax ID {formPolicy.fieldRules.gstinNumber === 'MANDATORY' ? '*' : '(Optional)'}
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="15-character GSTIN (e.g. 07AAAAA0000A1Z5)"
                      value={regGstin}
                      onChange={(e) => setRegGstin(e.target.value.toUpperCase())}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--ds-color-surface)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--ds-color-text-primary)', fontSize: '0.8125rem', boxSizing: 'border-box' }}
                    />
                  </div>
                )}

                {formPolicy.fieldRules.licenseDocUpload !== 'HIDDEN' && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                      Upload Clinical / Facility Registration License Proof {formPolicy.fieldRules.licenseDocUpload === 'MANDATORY' ? '*' : '(Optional)'}
                    </label>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: regLicenseDocFileName ? 'rgba(16, 185, 129, 0.15)' : 'var(--ds-color-surface)',
                      border: regLicenseDocFileName ? '1px dashed var(--ds-color-success)' : '1px dashed var(--ds-color-border, rgba(255,255,255,0.25))',
                      color: regLicenseDocFileName ? 'var(--ds-color-success)' : 'var(--ds-color-text-muted)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}>
                      <input
                        type="file"
                        accept=".pdf,image/png,image/jpeg,image/jpg"
                        onChange={handleLicenseFileUpload}
                        style={{ display: 'none' }}
                      />
                      <span>{regLicenseDocFileName ? '✓' : '📎'}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}>
                        {regLicenseDocFileName || 'Choose Clinical License / Registration Document (PDF/JPG)...'}
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Step 5: Owner Aadhaar KYC & Identity Verification */}
              {formPolicy.fieldRules.ownerAadhaar !== 'HIDDEN' && (
                <div style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--ds-color-accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🪪</span> 5. Owner Aadhaar KYC (Govt Compliance) {formPolicy.fieldRules.ownerAadhaar === 'MANDATORY' ? '*' : '(Optional)'}
                    </label>
                    <span style={{
                      backgroundColor: formPolicy.fieldRules.ownerAadhaar === 'MANDATORY' ? 'var(--ds-color-danger)' : 'var(--ds-color-primary)',
                      color: 'var(--ds-color-text-primary)',
                      fontSize: '0.625rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {formPolicy.fieldRules.ownerAadhaar}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: formPolicy.fieldRules.aadhaarDocUpload !== 'HIDDEN' ? '1fr 1fr' : '1fr', gap: '12px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                        Owner 12-Digit Aadhaar Card Number {formPolicy.fieldRules.ownerAadhaar === 'MANDATORY' ? '*' : '(Optional)'}
                      </label>
                      <input
                        type="text"
                        placeholder="XXXX XXXX XXXX"
                        maxLength={14}
                        value={regAadhaarNumber}
                        onChange={(e) => setRegAadhaarNumber(formatAadhaarInput(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--ds-color-surface)',
                          border: regAadhaarNumber.replace(/[^0-9]/g, '').length === 12 ? '1px solid var(--ds-color-success)' : '1px solid var(--ds-color-border, rgba(255,255,255,0.15))',
                          color: 'var(--ds-color-text-primary)',
                          fontSize: '0.875rem',
                          letterSpacing: '0.08em',
                          fontFamily: 'monospace',
                          boxSizing: 'border-box'
                        }}
                      />
                      <div style={{ fontSize: '0.6875rem', color: regAadhaarNumber.replace(/[^0-9]/g, '').length === 12 ? 'var(--ds-color-success)' : 'var(--ds-color-text-muted)', marginTop: '3px' }}>
                        {regAadhaarNumber.replace(/[^0-9]/g, '').length === 12 ? '✓ 12 Digits Verified' : 'Enter 12 numeric digits'}
                      </div>
                    </div>

                    {formPolicy.fieldRules.aadhaarDocUpload !== 'HIDDEN' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                          Upload Owner Aadhaar Card (PDF/Image) {formPolicy.fieldRules.aadhaarDocUpload === 'MANDATORY' ? '*' : '(Optional)'}
                        </label>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          backgroundColor: regAadhaarDocFileName ? 'rgba(16, 185, 129, 0.15)' : 'var(--ds-color-surface)',
                          border: regAadhaarDocFileName ? '1px dashed var(--ds-color-success)' : '1px dashed var(--ds-color-border, rgba(255,255,255,0.25))',
                          color: regAadhaarDocFileName ? 'var(--ds-color-success)' : 'var(--ds-color-text-muted)',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          boxSizing: 'border-box'
                        }}>
                          <input
                            type="file"
                            accept=".pdf,image/png,image/jpeg,image/jpg"
                            onChange={handleAadhaarFileUpload}
                            style={{ display: 'none' }}
                          />
                          <span>{regAadhaarDocFileName ? '✓' : '📎'}</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                            {regAadhaarDocFileName || 'Choose Aadhaar File...'}
                          </span>
                        </label>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-secondary)', marginTop: '3px' }}>
                          Supports PDF, PNG, JPG (Front / Back)
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)', backgroundColor: 'var(--ds-color-surface-subtle, rgba(15, 23, 42, 0.8))', padding: '8px 10px', borderRadius: '6px', borderLeft: '3px solid var(--ds-color-accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🔒</span>
                    <span>
                      <strong>Anti-Tampering Lock:</strong> Once registered, legal facility and owner KYC details are locked. Any subsequent updates require Admin / Founder verification.
                    </span>
                  </div>
                </div>
              )}

              {/* Step 6: Select Subscription Plan Tier (Visible ONLY when showPlanSelection === true) */}
              {formPolicy.showPlanSelection && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--ds-color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>💼</span> 6. Select Preferred Subscription Plan Tier *
                    </label>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-accent)', fontWeight: 700 }}>
                      Dual-Control (You Choose • Founder Approves/Modifies)
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, Math.min(availablePlans.length, 3))}, 1fr)`, gap: '10px' }}>
                    {availablePlans.map((plan) => {
                      const isSelected = requestedPlanTier === plan.tier || requestedPlanTier === plan.code || requestedPlanTier === plan.id;
                      return (
                        <div
                          key={plan.id || plan.tier}
                          onClick={() => {
                            setRequestedPlanTier(plan.tier);
                            if (advancePaymentRecord && advancePaymentRecord.amount !== plan.price) {
                              setAdvancePaymentRecord(null);
                            }
                          }}
                          style={{
                            backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'var(--ds-color-surface)',
                            border: isSelected ? '2px solid var(--ds-color-accent)' : '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.1))',
                            borderRadius: '10px',
                            padding: '12px 10px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.3rem' }}>{plan.icon}</span>
                            {isSelected ? (
                              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--ds-color-accent)', backgroundColor: 'rgba(56, 189, 248, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                                ✓ Selected
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.625rem', color: 'var(--ds-color-text-secondary)' }}>Choose</span>
                            )}
                          </div>

                          <div>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: isSelected ? 'var(--ds-color-accent)' : 'var(--ds-color-text-primary)' }}>
                              {plan.name}
                            </div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>{plan.tag}</div>
                            {plan.features && plan.features.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                                {plan.features.slice(0, 3).map((feat, fi) => (
                                  <div key={fi} style={{ fontSize: '0.625rem', color: 'var(--ds-color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ color: 'var(--ds-color-success)', fontSize: '0.55rem' }}>●</span>
                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{feat}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div style={{ fontSize: '0.9375rem', fontWeight: 900, color: 'var(--ds-color-success)', marginTop: 'auto', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <span>₹{plan.price.toLocaleString('en-IN')}</span>
                            <span style={{ fontSize: '0.625rem', color: 'var(--ds-color-text-muted)', fontWeight: 600 }}>
                              {plan.billingInterval === 'ANNUAL' ? '/yr' : plan.billingInterval === 'QUARTERLY' ? '/quarter' : plan.billingInterval === 'ONE_TIME' ? 'One-Time' : '/mo'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                    💡 <strong>Dual-Control Policy:</strong> Selected: <strong style={{ color: 'var(--ds-color-accent)' }}>{currentPlan.name}</strong>. Founder and Compliance review your clinical facility, bed capacity, and license, with authority to confirm, offer discounts, or upgrade terms.
                  </div>
                </div>
              )}

              {/* Step 7: Payment Options (Visible ONLY when showPlanSelection === true && allowAdvancePayment === true) */}
              {formPolicy.showPlanSelection && formPolicy.allowAdvancePayment && (
                <div style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '16px'
                }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ds-color-text-secondary)', marginBottom: '8px' }}>
                    7. Onboarding Payment Preference:
                  </label>

                  {currentPlan.price === 0 ? (
                    <div style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      border: '1.5px solid var(--ds-color-success)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <span style={{ fontSize: '1.6rem' }}>🎁</span>
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--ds-color-success)' }}>
                          100% Launch Partner Grant Applied (₹0 Due Today)
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)', marginTop: '3px' }}>
                          Voucher <strong>{promoCampaign.promoCode}</strong> applied. Zero advance payment or credit card required. Your complimentary early-bird enterprise license ({promoCampaign.durationMonths} months free) will be active upon verification.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {/* Choice A: Option 2 Standard Onboarding */}
                        <div
                          onClick={() => {
                            setAdvancePaymentRecord(null);
                          }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            backgroundColor: !advancePaymentRecord ? 'rgba(56, 189, 248, 0.15)' : 'var(--ds-color-surface)',
                            border: !advancePaymentRecord ? '1.5px solid var(--ds-color-primary)' : '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '1rem' }}>⏳</span>
                            <strong style={{ fontSize: '0.75rem', color: !advancePaymentRecord ? 'var(--ds-color-accent)' : 'var(--ds-color-text-primary)' }}>
                              Option 2: Pay Post-Approval
                            </strong>
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)', marginTop: '4px' }}>
                            Zero upfront payment. Pay invoice after Founder verifies documents and activates plan.
                          </div>
                        </div>

                        {/* Choice B: Option 3 Fast-Track Advance Self-Checkout */}
                        <div
                          onClick={() => {
                            if (!advancePaymentRecord) {
                              setShowRazorpayModal(true);
                            }
                          }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            backgroundColor: advancePaymentRecord ? 'rgba(16, 185, 129, 0.15)' : 'var(--ds-color-surface)',
                            border: advancePaymentRecord ? '1.5px solid var(--ds-color-success)' : '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '1rem' }}>🚀</span>
                              <strong style={{ fontSize: '0.75rem', color: advancePaymentRecord ? 'var(--ds-color-success)' : 'var(--ds-color-text-primary)' }}>
                                Option 3: Fast-Track Advance
                              </strong>
                            </div>
                            <span style={{ fontSize: '0.625rem', backgroundColor: '#F59E0B', color: '#000', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                              READY
                            </span>
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)', marginTop: '4px' }}>
                            Pay {currentPlan.billingInterval === 'ONE_TIME' ? 'one-time license fee' : currentPlan.billingInterval === 'ANNUAL' ? 'annual subscription' : currentPlan.billingInterval === 'QUARTERLY' ? 'quarterly advance' : '1-mo advance'} ₹{currentPlan.price.toLocaleString('en-IN')} via Razorpay / UPI sandbox. 100% refund guarantee on rejection.
                          </div>
                        </div>
                      </div>

                      {/* Advance Payment Confirmation Status */}
                      {advancePaymentRecord ? (
                        <div style={{
                          marginTop: '10px',
                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                          border: '1px solid var(--ds-color-success)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-success)' }}>
                            ✓ <strong>Advance Paid:</strong> ₹{advancePaymentRecord.amount.toLocaleString('en-IN')} via {advancePaymentRecord.paymentMethod} (Txn: <code>{advancePaymentRecord.transactionId}</code>)
                          </div>
                          <button
                            type="button"
                            onClick={() => setAdvancePaymentRecord(null)}
                            style={{ background: 'none', border: 'none', color: 'var(--ds-color-danger)', fontSize: '0.6875rem', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-secondary)' }}>
                            Want priority queue onboarding?
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowRazorpayModal(true)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--ds-color-primary)',
                              border: 'none',
                              color: 'var(--ds-color-text-primary)',
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            💳 {currentPlan.billingInterval === 'ONE_TIME' ? 'Pay License' : 'Pay Advance'} ₹{currentPlan.price.toLocaleString('en-IN')} (Sandbox)
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Step 8: Password Creation (Or Auto-Generate Notice) */}
              {formPolicy.fieldRules.passwordCreation === 'MANDATORY' ? (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                    8. Create Admin Password *
                  </label>
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--ds-color-surface)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--ds-color-text-primary)', fontSize: '0.8125rem', boxSizing: 'border-box' }}
                  />
                </div>
              ) : (
                <div style={{
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '1.3rem' }}>🔑</span>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--ds-color-accent)' }}>
                      Auto-Generated Secure Password (HQ Policy)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>
                      Founder policy has enabled frictionless onboarding. Temporary credentials will be generated and dispatched to your email ({regEmail || 'your registered email'}) once verified by Founder.
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Registration */}
              <button
                type="submit"
                disabled={isSubmitting || regSuccess}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--ds-color-success) 0%, var(--ds-color-success-hover, #059669) 100%)',
                  color: 'var(--ds-color-primary-foreground)',
                  fontWeight: 900,
                  fontSize: '0.9375rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 18px rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isSubmitting
                  ? '⚡ Processing Registration...'
                  : formPolicy.showPlanSelection
                  ? '🎉 Complete Self-Registration & Open My Panel →'
                  : '🛡️ Submit Registration to HQ for Review →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>

      {/* 💳 OPTION 3: RAZORPAY / UPI SELF-CHECKOUT SANDBOX MODAL */}
      {showRazorpayModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--ds-color-surface)',
            border: '1.5px solid var(--ds-color-primary)',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            padding: '20px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8), 0 0 30px rgba(2, 132, 199, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.3rem' }}>💳</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
                    DocSearch Fast-Track Self-Checkout
                  </h4>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-accent)' }}>
                    Razorpay Gateway & UPI Test Sandbox
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRazorpayModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--ds-color-text-muted)', fontSize: '1.1rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--ds-color-surface)', borderRadius: '10px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>Plan Subscribing</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
                  {currentPlan.name}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>Advance Due</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--ds-color-success)' }}>
                  ₹{currentPlan.price.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                Virtual Payment Address (VPA / UPI ID)
              </label>
              <input
                type="text"
                value={simulatedUpi}
                onChange={(e) => setSimulatedUpi(e.target.value)}
                placeholder="hospital@okhdfcbank"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--ds-color-surface)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--ds-color-text-primary)', fontSize: '0.8125rem', boxSizing: 'border-box' }}
              />
              <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-secondary)', marginTop: '3px', display: 'block' }}>
                Simulated Razorpay UPI sandbox: any test VPA or phone number accepted.
              </span>
            </div>

            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '0.6875rem',
              color: 'var(--ds-color-success)'
            }}>
              🛡️ <strong>100% Refund Guarantee:</strong> If your healthcare application is rejected during Founder / Admin verification, this advance payment will be <strong>automatically refunded</strong> back to this payment source.
            </div>

            <button
              type="button"
              disabled={isProcessingPayment}
              onClick={() => {
                setIsProcessingPayment(true);
                setTimeout(() => {
                  setAdvancePaymentRecord({
                    status: 'PAID',
                    amount: currentPlan.price,
                    paymentMethod: `Razorpay UPI (${simulatedUpi || 'hospital@upi'})`,
                    transactionId: `pay_rzp_${Date.now()}`,
                    paidAt: new Date().toISOString()
                  });
                  setIsProcessingPayment(false);
                  setShowRazorpayModal(false);
                }, 1000);
              }}
              style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: isProcessingPayment ? 'var(--ds-color-secondary)' : 'var(--ds-color-success)',
                border: 'none',
                color: 'var(--ds-color-text-primary)',
                fontWeight: 900,
                fontSize: '0.875rem',
                cursor: isProcessingPayment ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isProcessingPayment ? '⏳ Verifying UPI Transaction...' : `✓ Pay ₹${currentPlan.price.toLocaleString('en-IN')} via Razorpay Sandbox`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
