import React, { useState, useEffect } from 'react';
import { Badge } from '@docsearch/ui-kit';
import { isCompanyDestructiveActionAllowed } from '../../navigation/rolePermissions.js';

export interface PendingVerificationItem {
  id: string;
  partnerName: string;
  partnerType: 'PATHOLOGY' | 'HOSPITAL' | 'CLINIC' | 'PHARMACY' | 'DOCTOR';
  tenantSlug: string;
  submittedBy: string;
  submittedAt: string;
  category: 'BANK' | 'ADDRESS' | 'LICENSE_CERTIFICATE' | 'AADHAAR_KYC' | 'PROFILE_AMENDMENT';
  status: 'PENDING_APPROVAL' | 'UNDER_REVIEW' | 'ADDITIONAL_INFORMATION_REQUIRED' | 'RESUBMITTED' | 'APPROVED' | 'REJECTED';
  details: Record<string, string>;
  documentName: string;
  documentType: string;
  aiMatchScore: number;
  extractedOcrText: string;
  expiryDate?: string;
  sha256Hash: string;
  documentDataUrl?: string;
  registeredBy?: {
    userId?: string;
    name: string;
    email: string;
    role?: string;
    source: string;
  };
  assignedReviewer?: {
    id?: string;
    name?: string;
    email: string;
    assignedAt?: string;
  } | null;
  reviewStartedAt?: string;
  requestedInfoReason?: string;
  duplicateRisk?: {
    hasRisk: boolean;
    signals: string[];
    potentialMatchId?: string;
    isOriginalHash?: boolean;
  };
  documents?: Array<{
    documentId: string;
    documentName: string;
    documentType: string;
    sha256Hash: string;
    dataUrl?: string;
    documentDataUrl?: string;
    fileSizeKb?: number;
    uploadedAt?: string;
    secureRef?: string;
    status?: string;
  }>;
  assignedPlan?: {
    tier: string;
    planName: string;
    customPlanSubtitle?: string;
    monthlyFee: number;
    setupFee?: number;
    billingFrequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'ONE_TIME';
    discountPercent?: number;
    taxMode?: 'INCLUSIVE' | 'EXCLUSIVE_GST_18' | 'EXEMPT';
    taxAmount?: number;
    advanceCredit?: number;
    finalAmount: number;
    trialDays?: number;
    paymentMode?: string;
    founderNotes?: string;
    invoiceNumber?: string;
    paymentStatus?: string;
    enabledModules?: string[];
    bedQuota?: string;
    staffSeatsQuota?: string;
    whatsAppQuota?: string;
    storageQuota?: string;
    contractDuration?: string;
    expiryDate?: string;
    slaTier?: string;
    supportTier?: string;
    issuedAt?: string;
  } | null;
  requestedPlan?: {
    id?: string;
    code?: string;
    tier: string;
    planName: string;
    name?: string;
    price?: number;
    monthlyFee: number;
    durationDays?: number;
    billingInterval?: string;
    billingFrequency?: string;
    isFree?: boolean;
    features?: string[];
  } | null;
  advancePayment?: {
    status: 'PAID' | 'REFUND_TRIGGERED' | 'FAILED' | 'PENDING';
    amount: number;
    paymentMethod?: string;
    transactionId?: string;
    paidAt?: string;
    refundId?: string;
    refundedAt?: string;
    refundNotice?: string;
  } | null;
  refundStatus?: string | null;
  refundId?: string | null;
  planTier?: string;
  monthlyFee?: number;
  finalAmount?: number;
  invoiceNumber?: string;
  paymentStatus?: string;
}

export const ALL_AVAILABLE_MODULES = [
  { id: 'clinical_emr', name: 'Clinical Suite & EMR', icon: '🩺', desc: 'Consultations, Digital Rx, Vitals, ICD-10' },
  { id: 'opd_queue', name: 'OPD Queue & Appointments', icon: '⏱️', desc: 'Token queue, slot management & front desk' },
  { id: 'ipd_beds', name: 'Inpatient IPD & Bed Management', icon: '🛏️', desc: 'Admission, discharge, ward transfer & census' },
  { id: 'ot_desk', name: 'Operation Theatre (OT) Desk', icon: '🔪', desc: 'Surgical scheduling, anaesthesia log & PAC' },
  { id: 'emergency_icu', name: 'Emergency & ICU Critical Care', icon: '🚨', desc: 'Triage, code red protocol & telemetry' },
  { id: 'pharmacy_pos', name: 'Pharmacy POS & Inventory', icon: '💊', desc: 'Schedule H1, batch tracking & barcode billing' },
  { id: 'pathology_lims', name: 'Pathology & Diagnostic LIMS', icon: '🔬', desc: 'Phlebotomy, analyzers, NABL reports & QA' },
  { id: 'radiology_pacs', name: 'Radiology & PACS Imaging', icon: '🩻', desc: 'DICOM viewer, modality worklist & AERB' },
  { id: 'abha_abdm', name: 'ABHA / ABDM Govt Integration', icon: '🇮🇳', desc: 'M1, M2, M3 Ayushman Bharat digital gateway' },
  { id: 'whatsapp_sms', name: 'WhatsApp Automation & SMS', icon: '📲', desc: 'Automated prescription & report PDF dispatch' },
  { id: 'insurance_tpa', name: 'TPA Insurance & Billing', icon: '💳', desc: 'Cashless claims, PMJAY, CGHS & corporate' },
  { id: 'exec_audit', name: 'Executive Command & Audit', icon: '📊', desc: 'Real-time KPIs, financial audits & compliance' }
];

export const INITIAL_VERIFICATION_QUEUE: PendingVerificationItem[] = [];

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
  defaultPlanTier: 'FOUNDING' | 'STARTER' | 'GROWTH' | 'ENTERPRISE' | 'PENDING_FOUNDER' | string;
  bannerNotice: string;
  allowedFacilityTypes: ('HOSPITAL' | 'CLINIC' | 'PATHOLOGY' | 'PHARMACY' | 'DIAGNOSTIC_CENTRE')[];
  availablePlans?: DynamicRegistrationPlan[];
  fieldRules: RegistrationFormFieldRules;
  updatedAt?: string;
  updatedBy?: string;
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
  }
];

export const DEFAULT_REGISTRATION_FORM_POLICY: RegistrationFormPolicy = {
  showPlanSelection: true,
  showModuleSelection: false,
  allowAdvancePayment: true,
  defaultPlanTier: 'FOUNDING',
  bannerNotice: 'Universal Healthcare Partner Registration • 1st Year Free Founding Partner Offer Active',
  allowedFacilityTypes: ['HOSPITAL', 'CLINIC', 'PATHOLOGY', 'PHARMACY', 'DIAGNOSTIC_CENTRE'] as any,
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

export const PartnerVerificationConsole: React.FC = () => {
  // Load queue combining initial items and dynamic registrations/amendments
  const loadDynamicQueue = (): PendingVerificationItem[] => {
    if (typeof window === 'undefined') return [];
    try {
      const dynamicItems: PendingVerificationItem[] = JSON.parse(
        localStorage.getItem('docsearch_verification_queue') || '[]'
      );
      const legacyKeywords = ['mamta', 'midahat', 'abc', 'apex', 'metro', 'partner corp'];
      const filtered = dynamicItems.filter((q) => {
        const name = `${q.partnerName || ''} ${q.tenantSlug || ''} ${q.submittedBy || ''}`.toLowerCase();
        return !legacyKeywords.some((kw) => name.includes(kw));
      });
      if (filtered.length !== dynamicItems.length) {
        if (filtered.length === 0) {
          localStorage.removeItem('docsearch_verification_queue');
        } else {
          localStorage.setItem('docsearch_verification_queue', JSON.stringify(filtered));
        }
      }
      return filtered;
    } catch {
      return [];
    }
  };


  const [queue, setQueue] = useState<PendingVerificationItem[]>(loadDynamicQueue);
  const [selectedId, setSelectedId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('docsearch_selected_verif_id');
      if (saved) {
        localStorage.removeItem('docsearch_selected_verif_id');
        return saved;
      }
    }
    return loadDynamicQueue()[0]?.id || '';
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeDocIndex, setActiveDocIndex] = useState<number>(0);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [verifiedOriginalMap, setVerifiedOriginalMap] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('docsearch_verified_originals') || '{}');
      } catch {
        return {};
      }
    }
    return {};
  });

  // Filter Bar States
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PATHOLOGY' | 'CLINIC' | 'PHARMACY' | 'HOSPITAL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_APPROVAL' | 'UNDER_REVIEW' | 'ADDITIONAL_INFORMATION_REQUIRED' | 'RESUBMITTED' | 'APPROVED' | 'REJECTED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Next Action Engine & Interactive Modals State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignReviewerName, setAssignReviewerName] = useState('Compliance Directorate');
  const [assignReviewerEmail, setAssignReviewerEmail] = useState('compliance@docsearch.health');
  const [isRequestInfoModalOpen, setIsRequestInfoModalOpen] = useState(false);
  const [requestInfoReason, setRequestInfoReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [timeline, setTimeline] = useState<any[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  // 💼 Founder Master Plan Assignment & Deep Commercial Control State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlanTier, setSelectedPlanTier] = useState<'STARTER' | 'GROWTH' | 'ENTERPRISE' | 'CUSTOM'>('ENTERPRISE');
  const [customPlanName, setCustomPlanName] = useState<string>('Enterprise Hospital Pro HIS Suite');
  const [customPlanSubtitle, setCustomPlanSubtitle] = useState<string>('Full Hospital, IPD Beds, ICU & OT Management');
  const [customMonthlyFee, setCustomMonthlyFee] = useState<number>(4999);
  const [setupFee, setSetupFee] = useState<number>(0);
  const [billingFrequency, setBillingFrequency] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'ONE_TIME'>('MONTHLY');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxMode, setTaxMode] = useState<'INCLUSIVE' | 'EXCLUSIVE_GST_18' | 'EXEMPT'>('INCLUSIVE');
  const [advanceCredit, setAdvanceCredit] = useState<number>(0);
  const [trialDays, setTrialDays] = useState<number>(7);
  const [paymentMode, setPaymentMode] = useState<'ONLINE_GATEWAY' | 'BANK_TRANSFER' | 'CASH_CHEQUE'>('ONLINE_GATEWAY');
  const [founderNotes, setFounderNotes] = useState<string>('');

  // Granular Entitlements & Feature Flags
  const [enabledModules, setEnabledModules] = useState<string[]>([
    'Clinical Suite & EMR',
    'OPD Queue & Appointments',
    'Inpatient IPD & Bed Management',
    'Operation Theatre (OT) Desk',
    'Emergency & ICU Critical Care',
    'Pharmacy POS & Inventory',
    'Pathology & Diagnostic LIMS',
    'Radiology & PACS Imaging',
    'ABHA / ABDM Govt Integration',
    'WhatsApp Automation & SMS',
    'TPA Insurance & Billing',
    'Executive Command & Audit'
  ]);

  // Capacity Quotas, Contract Validity & SLA
  const [bedQuota, setBedQuota] = useState<string>('50 Beds');
  const [doctorQuota, setDoctorQuota] = useState<string>('10 Doctors');
  const [staffSeatsQuota, setStaffSeatsQuota] = useState<string>('25 Staff');
  const [whatsAppQuota, setWhatsAppQuota] = useState<string>('5,000 / mo');
  const [storageQuota, setStorageQuota] = useState<string>('50 GB');
  const [contractDuration, setContractDuration] = useState<string>('1_YEAR');
  const [expiryDate, setExpiryDate] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0] || '';
  });
  const [slaTier, setSlaTier] = useState<string>('99.95% Mission-Critical SLA');
  const [supportTier, setSupportTier] = useState<string>('24/7 Dedicated Founder Concierge & Priority WhatsApp');

  // ⚙️ Universal Registration Form Policy Control State
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);
  const [cockpitPlanCategory, setCockpitPlanCategory] = useState<'ALL' | 'HOSPITAL' | 'CLINIC' | 'PATHOLOGY' | 'PHARMACY'>('ALL');
  const [modalPlanFilter, setModalPlanFilter] = useState<'FOR_FACILITY' | 'ALL'>('FOR_FACILITY');
  const [formPolicy, setFormPolicy] = useState<RegistrationFormPolicy>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('docsearch_registration_form_policy');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_REGISTRATION_FORM_POLICY;
  });

  const fetchFormPolicy = async () => {
    try {
      const res = await fetch('/api/v1/auth/registration-form-config');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setFormPolicy(json.data);
          if (typeof window !== 'undefined') {
            localStorage.setItem('docsearch_registration_form_policy', JSON.stringify(json.data));
          }
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchFormPolicy();
  }, []);

  const handleSavePolicy = async (customPolicy?: RegistrationFormPolicy) => {
    const targetPolicy = customPolicy || formPolicy;
    setIsSavingPolicy(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      const res = await fetch('/api/v1/auth/registration-form-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(targetPolicy)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setFormPolicy(json.data);
          if (typeof window !== 'undefined') {
            localStorage.setItem('docsearch_registration_form_policy', JSON.stringify(json.data));
          }
          setToastMessage('✓ Registration Form Policy updated globally! Plan visibility and field rules published live.');
          setTimeout(() => setToastMessage(null), 5000);
          setIsPolicyModalOpen(false);
        }
      }
    } catch (err) {
      console.warn('Failed to save registration policy:', err);
    } finally {
      setIsSavingPolicy(false);
    }
  };

  // Fetch cross-port verification queue from central API Gateway
  const fetchServerQueue = async () => {
    setIsRefreshing(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      const res = await fetch('/api/v1/auth/verification-queue', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          let dynamicLocal: PendingVerificationItem[] = [];
          if (typeof window !== 'undefined') {
            try {
              dynamicLocal = JSON.parse(localStorage.getItem('docsearch_verification_queue') || '[]');
            } catch {}
          }
          const combined = [...json.data, ...dynamicLocal];
          const seen = new Set<string>();
          const deduped = combined.filter((it) => {
            if (seen.has(it.id)) return false;
            seen.add(it.id);
            return true;
          });
          setQueue(deduped);
          const savedTarget = typeof window !== 'undefined' ? localStorage.getItem('docsearch_selected_verif_id') : null;
          if (savedTarget && deduped.some((x) => x.id === savedTarget)) {
            setSelectedId(savedTarget);
            localStorage.removeItem('docsearch_selected_verif_id');
          } else if (
            !selectedId ||
            !deduped.some((x) => x.id === selectedId) ||
            (selectedId === 'KYC-ABC-HOSP' && deduped.some((x) => x.status === 'PENDING_APPROVAL' && x.id !== 'KYC-ABC-HOSP'))
          ) {
            const firstPending = deduped.find((x) => x.status === 'PENDING_APPROVAL') || deduped[0];
            if (firstPending) {
              setSelectedId(firstPending.id);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch verification queue from API Gateway:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServerQueue();
    // Poll every 30 seconds when visible
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchServerQueue();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch timeline for selected queue item
  useEffect(() => {
    setActiveDocIndex(0);
    if (!selectedId) return;
    const fetchTimeline = async () => {
      setIsLoadingTimeline(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') || localStorage.getItem('docsearch_auth_token') : null;
        const res = await fetch(`/api/v1/auth/verification-queue/${selectedId}/timeline`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setTimeline(json.data);
          }
        }
      } catch (err) {
        console.warn('Could not fetch timeline:', err);
      } finally {
        setIsLoadingTimeline(false);
      }
    };
    fetchTimeline();
  }, [selectedId]);

  // Compute Quick Counts across the full dataset
  const counts = {
    all: queue.length,
    pending: queue.filter((x) => x.status === 'PENDING_APPROVAL').length,
    approved: queue.filter((x) => x.status === 'APPROVED').length,
    rejected: queue.filter((x) => x.status === 'REJECTED').length,
    pathology: queue.filter((x) => x.partnerType === 'PATHOLOGY').length,
    clinic: queue.filter((x) => x.partnerType === 'CLINIC').length,
    pharmacy: queue.filter((x) => x.partnerType === 'PHARMACY').length,
    hospital: queue.filter((x) => x.partnerType === 'HOSPITAL').length,
    aadhaarKyc: queue.filter((x) => x.category === 'AADHAAR_KYC').length,
    amendment: queue.filter((x) => x.category === 'PROFILE_AMENDMENT').length
  };

  const hasActiveFilters = searchQuery.trim() !== '' || typeFilter !== 'ALL' || statusFilter !== 'ALL' || categoryFilter !== 'ALL';

  const handleClearFilters = () => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
  };

  // Filtered Queue computation
  const filteredQueue = queue.filter((item) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = item.partnerName?.toLowerCase().includes(q);
      const matchSubmittedBy = item.submittedBy?.toLowerCase().includes(q);
      const matchSlug = item.tenantSlug?.toLowerCase().includes(q);
      const matchDocName = item.documentName?.toLowerCase().includes(q);
      const matchDetails = Object.values(item.details || {}).some((v) =>
        String(v).toLowerCase().includes(q)
      );
      if (!matchName && !matchSubmittedBy && !matchSlug && !matchDocName && !matchDetails) {
        return false;
      }
    }

    // 2. Type Filter
    if (typeFilter !== 'ALL' && item.partnerType !== typeFilter) {
      return false;
    }

    // 3. Status Filter
    if (statusFilter !== 'ALL' && item.status !== statusFilter) {
      return false;
    }

    // 4. Category Filter
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
      return false;
    }

    return true;
  });

  const selectedItem = filteredQueue.find((q) => q.id === selectedId) || filteredQueue[0] || queue[0];

  const availableDocs: Array<{
    documentName?: string;
    documentType?: string;
    dataUrl?: string;
    fileSizeKb?: number;
    sha256Hash?: string;
  }> = (selectedItem?.documents && selectedItem.documents.length > 0)
    ? selectedItem.documents
    : (selectedItem?.documentDataUrl ? [{
        documentName: selectedItem.documentName || 'Regulatory_License_Proof.pdf',
        documentType: selectedItem.documentType || 'Clinical License / CEA Registration',
        dataUrl: selectedItem.documentDataUrl,
        fileSizeKb: 0,
        sha256Hash: selectedItem.sha256Hash
      }] : []);

  const activeDoc = availableDocs[activeDocIndex] || availableDocs[0] || null;
  const activeDocUrl = activeDoc?.dataUrl || selectedItem?.documentDataUrl;

  const handleToggleVerifiedOriginal = (id: string) => {
    setVerifiedOriginalMap((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('docsearch_verified_originals', JSON.stringify(next));
        } catch {}
      }
      return next;
    });
    const currentVal = !verifiedOriginalMap[id];
    setToastMessage(currentVal ? `🛡️ Marked as Verified Genuine Original Document` : `Originality Stamp Revoked`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenPlanModal = (id: string) => {
    const item = queue.find((q) => q.id === id) || selectedItem;
    if (!item) return;

    const allDynPlans = (formPolicy.availablePlans && formPolicy.availablePlans.length > 0 ? formPolicy.availablePlans : DEFAULT_PUBLIC_PLANS);
    const matchingCategoryPlans = allDynPlans.filter(p => !p.applicableFacilityTypes || p.applicableFacilityTypes.includes('ALL') || p.applicableFacilityTypes.includes(item.partnerType as any));

    // Dual-Control: Respect partner's requested plan if submitted, otherwise pick first matching category plan
    const reqTierOrCode = (item.requestedPlan?.code || item.requestedPlan?.tier || item.requestedPlan?.id || '').toUpperCase();
    const matchedReq = allDynPlans.find(p => 
      p.code.toUpperCase() === reqTierOrCode || 
      p.id.toUpperCase() === reqTierOrCode || 
      p.tier.toUpperCase() === reqTierOrCode ||
      (item.requestedPlan?.planName && p.name.toLowerCase() === item.requestedPlan.planName.toLowerCase()) ||
      (item.requestedPlan?.name && p.name.toLowerCase() === item.requestedPlan.name.toLowerCase())
    );

    const pickedPlan = matchedReq || matchingCategoryPlans[0] || allDynPlans[0] || DEFAULT_PUBLIC_PLANS[0];
    const reqPrice = item.requestedPlan?.price !== undefined
      ? item.requestedPlan.price
      : (item.requestedPlan?.monthlyFee !== undefined ? item.requestedPlan.monthlyFee : undefined);

    let initialTier: any = item.requestedPlan?.tier || pickedPlan?.tier || 'FOUNDING';
    let initialFee = reqPrice !== undefined
      ? reqPrice
      : (pickedPlan?.price !== undefined ? pickedPlan.price : 0);
    let initialName = item.requestedPlan?.name || item.requestedPlan?.planName || pickedPlan?.name || `${item.partnerType} Founding Plan`;
    const initialSubtitle = pickedPlan?.description || pickedPlan?.tag || (initialFee === 0 ? '🎁 1st Year Free Pioneer Offer' : 'B2B Custom Healthcare Plan');
    const initFreq = ((item.requestedPlan?.billingInterval || item.requestedPlan?.billingFrequency || pickedPlan?.billingInterval || 'ANNUAL') as 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'ONE_TIME');

    setSelectedPlanTier(initialTier);
    setCustomMonthlyFee(initialFee);
    setCustomPlanName(initialName);
    setCustomPlanSubtitle(initialSubtitle);
    setSetupFee(0);
    setBillingFrequency(initFreq);
    setDiscountPercent(0);
    setTaxMode('INCLUSIVE');

    const hasPaidAdvance = item.advancePayment?.status === 'PAID';
    const advAmt = hasPaidAdvance ? (item.advancePayment?.amount || 0) : 0;
    setAdvanceCredit(advAmt);
    setTrialDays(hasPaidAdvance ? 0 : 7);
    setPaymentMode((hasPaidAdvance ? (item.advancePayment?.paymentMethod || 'ONLINE_GATEWAY') : 'ONLINE_GATEWAY') as any);
    setFounderNotes(hasPaidAdvance ? `Advance payment of ₹${item.advancePayment?.amount} received via ${item.advancePayment?.paymentMethod || 'Razorpay UPI'} (Txn: ${item.advancePayment?.transactionId}).` : '');

    // Set intelligent module defaults based on partner type
    if (item.partnerType === 'HOSPITAL') {
      setEnabledModules(ALL_AVAILABLE_MODULES.map((m) => m.name));
      setBedQuota('50 Beds');
      setStaffSeatsQuota('25 Staff');
      setSlaTier('99.95% Mission-Critical SLA');
      setSupportTier('24/7 Dedicated Founder Concierge & Priority WhatsApp');
    } else if (item.partnerType === 'CLINIC') {
      setEnabledModules(['Clinical Suite & EMR', 'OPD Queue & Appointments', 'WhatsApp Automation & SMS', 'ABHA / ABDM Govt Integration']);
      setBedQuota('Day Care (5 Beds)');
      setStaffSeatsQuota('5 Staff');
      setSlaTier('99.5% Standard SLA');
      setSupportTier('Priority Business Hours WhatsApp');
    } else if (item.partnerType === 'PATHOLOGY') {
      setEnabledModules(['Pathology & Diagnostic LIMS', 'WhatsApp Automation & SMS', 'ABHA / ABDM Govt Integration', 'Clinical Suite & EMR']);
      setBedQuota('N/A (Diagnostic Lab)');
      setStaffSeatsQuota('10 Staff');
      setSlaTier('99.5% Standard SLA');
      setSupportTier('Priority Business Hours WhatsApp');
    } else if (item.partnerType === 'PHARMACY') {
      setEnabledModules(['Pharmacy POS & Inventory', 'WhatsApp Automation & SMS', 'ABHA / ABDM Govt Integration']);
      setBedQuota('N/A (Retail Pharmacy)');
      setStaffSeatsQuota('5 Staff');
      setSlaTier('99.5% Standard SLA');
      setSupportTier('Priority Business Hours WhatsApp');
    } else {
      setEnabledModules(ALL_AVAILABLE_MODULES.map((m) => m.name));
      setBedQuota('Unlimited');
      setStaffSeatsQuota('Unlimited');
      setSlaTier('99.95% Mission-Critical SLA');
      setSupportTier('24/7 Dedicated Founder Concierge & Priority WhatsApp');
    }

    setWhatsAppQuota('5,000 / mo');
    setStorageQuota('50 GB');

    const d = new Date();
    if (initFreq === 'ONE_TIME') {
      setContractDuration('LIFETIME');
      d.setFullYear(d.getFullYear() + 25);
    } else if (initFreq === 'ANNUAL') {
      setContractDuration('1_YEAR');
      d.setFullYear(d.getFullYear() + 1);
    } else if (initFreq === 'QUARTERLY') {
      setContractDuration('3_MONTHS');
      d.setMonth(d.getMonth() + 3);
    } else {
      setContractDuration('1_MONTH');
      d.setMonth(d.getMonth() + 1);
    }
    setExpiryDate(d.toISOString().split('T')[0] || '');

    setIsPlanModalOpen(true);
  };

  const handleConfirmApproveWithPlan = async (overrides?: {
    discountPercent?: number;
    trialDays?: number;
    founderNotes?: string;
  }) => {
    if (!selectedItem) return;
    const id = selectedItem.id;
    const item = queue.find((q) => q.id === id) || selectedItem;

    const effDiscount = overrides?.discountPercent !== undefined ? overrides.discountPercent : discountPercent;
    const effTrialDays = overrides?.trialDays !== undefined ? overrides.trialDays : trialDays;
    const effNotes = overrides?.founderNotes !== undefined ? overrides.founderNotes : founderNotes;

    const isOneTime = billingFrequency === 'ONE_TIME';
    const months = billingFrequency === 'ANNUAL' ? 12 : billingFrequency === 'QUARTERLY' ? 3 : isOneTime ? 0 : 1;
    const recurringBase = isOneTime ? customMonthlyFee : (customMonthlyFee * months);
    const discountAmount = Math.round((recurringBase * effDiscount) / 100);
    const discountedRecurring = Math.max(0, recurringBase - discountAmount);
    const preTaxTotal = discountedRecurring + (Number(setupFee) || 0);
    const taxAmount = taxMode === 'EXCLUSIVE_GST_18' ? Math.round(preTaxTotal * 0.18) : 0;
    const grossTotal = preTaxTotal + taxAmount;
    const finalAmount = Math.max(0, grossTotal - (Number(advanceCredit) || 0));

    const planNameMap: Record<string, string> = {
      STARTER: 'Starter Clinic OPD / Basic LIMS Suite',
      GROWTH: 'Growth Multi-Specialty Clinical Suite',
      ENTERPRISE: 'Enterprise Hospital Pro HIS Suite',
      CUSTOM: 'Custom Tailored Enterprise Suite'
    };

    const hasPaidAdvance = item.advancePayment?.status === 'PAID';
    const effectivePaymentStatus = hasPaidAdvance
      ? 'PAID'
      : (effDiscount === 100 ? 'PAID_WAIVED' : (effTrialDays > 0 ? 'TRIAL_ACTIVE' : 'PENDING_PAYMENT'));

    const assignedPlan = {
      tier: selectedPlanTier,
      planName: customPlanName.trim() || planNameMap[selectedPlanTier] || `${selectedPlanTier} Enterprise Suite`,
      customPlanSubtitle: customPlanSubtitle.trim(),
      monthlyFee: customMonthlyFee,
      setupFee: Number(setupFee) || 0,
      billingFrequency,
      discountPercent: effDiscount,
      taxMode,
      taxAmount,
      advanceCredit: Number(advanceCredit) || 0,
      finalAmount,
      trialDays: effTrialDays,
      paymentMode,
      founderNotes: effNotes.trim(),
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      paymentStatus: effectivePaymentStatus,
      advanceAmountCredited: hasPaidAdvance ? item.advancePayment?.amount : 0,
      enabledModules,
      bedQuota,
      maxBeds: parseInt(bedQuota.replace(/[^0-9]/g, ''), 10) || 0,
      doctorQuota,
      maxDoctors: parseInt(doctorQuota.replace(/[^0-9]/g, ''), 10) || 10,
      staffSeatsQuota,
      maxStaff: parseInt(staffSeatsQuota.replace(/[^0-9]/g, ''), 10) || 25,
      maxConcurrentUsers: parseInt(staffSeatsQuota.replace(/[^0-9]/g, ''), 10) || 25,
      whatsAppQuota,
      storageQuota,
      contractDuration,
      expiryDate,
      slaTier,
      supportTier,
      issuedAt: new Date().toISOString()
    };

    setIsPlanModalOpen(false);

    setQueue((prev) =>
      prev.map((it) => (it.id === id ? {
        ...it,
        status: 'APPROVED',
        assignedPlan,
        planTier: assignedPlan.planName,
        monthlyFee: assignedPlan.monthlyFee,
        finalAmount: assignedPlan.finalAmount,
        invoiceNumber: assignedPlan.invoiceNumber,
        paymentStatus: assignedPlan.paymentStatus
      } : it))
    );

    // If AADHAAR_KYC, update partner in registered partners
    if (item.category === 'AADHAAR_KYC') {
      try {
        const partners = JSON.parse(localStorage.getItem('docsearch_registered_partners') || '[]');
        const updated = partners.map((p: any) => {
          if (p.facilityName === item.partnerName || (p.email && (item.details?.['Registered Email'] === p.email || item.details?.['Applicant Email'] === p.email))) {
            return {
              ...p,
              kycStatus: 'KYC_VERIFIED',
              kycApprovedAt: new Date().toISOString(),
              kycApprovedBy: 'Healthcare Compliance Directorate',
              planTier: assignedPlan.planName,
              assignedPlan
            };
          }
          return p;
        });
        localStorage.setItem('docsearch_registered_partners', JSON.stringify(updated));
      } catch {}
    }

    // If PROFILE_AMENDMENT, commit staged amendment to partner's live account settings
    if (item.category === 'PROFILE_AMENDMENT') {
      try {
        const amendments = JSON.parse(localStorage.getItem('docsearch_staged_profile_amendments') || '[]');
        const matchedAmend = amendments.find((a: any) => a.id === id || a.currentFacilityName === item.partnerName);
        if (matchedAmend) {
          const updatedAmends = amendments.map((a: any) => a.id === matchedAmend.id ? { ...a, status: 'APPROVED', approvedAt: new Date().toLocaleString() } : a);
          localStorage.setItem('docsearch_staged_profile_amendments', JSON.stringify(updatedAmends));
        }
      } catch {}
    }

    // Update queue in localStorage
    try {
      const q = JSON.parse(localStorage.getItem('docsearch_verification_queue') || '[]');
      const updatedQ = q.map((it: any) => it.id === id ? {
        ...it,
        status: 'APPROVED',
        assignedPlan,
        planTier: assignedPlan.planName,
        monthlyFee: assignedPlan.monthlyFee,
        finalAmount: assignedPlan.finalAmount,
        invoiceNumber: assignedPlan.invoiceNumber,
        paymentStatus: assignedPlan.paymentStatus
      } : it);
      localStorage.setItem('docsearch_verification_queue', JSON.stringify(updatedQ));
    } catch {}

    // Update live partners store with active credentials & assigned plan
    try {
      const live = JSON.parse(localStorage.getItem('docsearch_live_partners') || '[]');
      const targetPartner = {
        partnerId: item.id,
        partnerName: item.partnerName,
        classification: item.partnerType === 'CLINIC' ? 'CLINIC' : item.partnerType,
        contactPerson: item.submittedBy || 'Owner / Doctor',
        email: item.details?.['Registered Email'] || item.details?.['Applicant Email'] || 'partner@docsearch.health',
        phone: item.details?.['Contact Phone'] || item.details?.['Phone Number'] || '+91 88091 49036',
        city: item.details?.['Registered City'] || item.details?.['City'] || 'India',
        assignedPlan,
        planTier: assignedPlan.planName,
        monthlyFee: assignedPlan.monthlyFee,
        credentials: {
          userId: item.details?.['Registered Email'] || item.details?.['Applicant Email'] || 'partner@docsearch.health',
          temporaryPassword: 'DocSearch2026!',
          role: item.partnerType === 'CLINIC' ? 'DOCTOR' : 'HOSPITAL_ADMIN',
          loginUrl: 'http://localhost:5173/clinic',
          activatedAt: new Date().toISOString()
        }
      };
      const existingIdx = live.findIndex((p: any) => p.partnerId === item.id || p.partnerName === item.partnerName);
      if (existingIdx >= 0) {
        live[existingIdx] = { ...live[existingIdx], ...targetPartner };
      } else {
        live.unshift(targetPartner);
      }
      localStorage.setItem('docsearch_live_partners', JSON.stringify(live));
    } catch {}

    // Synchronize approval with assigned plan to central API Gateway
    const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
    try {
      await fetch(`/api/v1/auth/verification-queue/${encodeURIComponent(id)}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          id,
          assignedPlan,
          email: item.details?.['Registered Email'] || item.details?.['Applicant Email'],
          partnerName: item.partnerName,
          organizationType: item.partnerType
        })
      });
    } catch (err) {
      console.warn('Could not sync plan approval to gateway:', err);
    }

    setToastMessage(`✓ [APPROVED & PLAN ISSUED] "${item.partnerName}" assigned ${assignedPlan.planName} at ₹${assignedPlan.monthlyFee.toLocaleString('en-IN')}/mo (Invoice #${assignedPlan.invoiceNumber})`);
    setTimeout(() => setToastMessage(null), 5000);
    fetchServerQueue();
  };



  const handleStartReview = async (id: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') || localStorage.getItem('docsearch_auth_token') : null;
      const res = await fetch(`/api/v1/auth/verification-queue/${id}/start-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        setToastMessage(`✓ [REVIEW STARTED] Active regulatory review initiated for ${id}`);
        setTimeout(() => setToastMessage(null), 4000);
        fetchServerQueue();
      }
    } catch (e) {
      console.warn('Start review error:', e);
    }
  };

  const handleAssignReviewerSubmit = async () => {
    if (!selectedItem || !assignReviewerEmail) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') || localStorage.getItem('docsearch_auth_token') : null;
      const res = await fetch(`/api/v1/auth/verification-queue/${selectedItem.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          reviewerName: assignReviewerName,
          reviewerEmail: assignReviewerEmail
        })
      });
      if (res.ok) {
        setIsAssignModalOpen(false);
        setToastMessage(`✓ [ASSIGNED] Dossier assigned to ${assignReviewerName} (${assignReviewerEmail})`);
        setTimeout(() => setToastMessage(null), 4000);
        fetchServerQueue();
      }
    } catch (e) {
      console.warn('Assign reviewer error:', e);
    }
  };

  const handleRequestInfoSubmit = async () => {
    if (!selectedItem || !requestInfoReason.trim()) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') || localStorage.getItem('docsearch_auth_token') : null;
      const res = await fetch(`/api/v1/auth/verification-queue/${selectedItem.id}/request-information`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          reason: requestInfoReason.trim()
        })
      });
      if (res.ok) {
        setIsRequestInfoModalOpen(false);
        setRequestInfoReason('');
        setToastMessage(`⚠️ [INFO REQUESTED] Notification dispatched to partner: "${requestInfoReason.trim()}"`);
        setTimeout(() => setToastMessage(null), 4000);
        fetchServerQueue();
      }
    } catch (e) {
      console.warn('Request info error:', e);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedItem || !rejectReason.trim()) return;
    const finalReason = rejectReason.trim();
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') || localStorage.getItem('docsearch_auth_token') : null;
      const res = await fetch(`/api/v1/auth/verification-queue/${selectedItem.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          id: selectedItem.id,
          rejectionReason: finalReason,
          reason: finalReason
        })
      });

      if (res.ok) {
        setIsRejectModalOpen(false);
        setRejectReason('');
        setToastMessage(`⚠️ [REJECTED] Registration rejected with audit notice: "${finalReason}"`);

        // Immediately update local queue state
        setQueue((prev) =>
          prev.map((it) => (it.id === selectedItem.id ? { ...it, status: 'REJECTED' } : it))
        );

        // Update local storage
        try {
          const q = JSON.parse(localStorage.getItem('docsearch_verification_queue') || '[]');
          const updatedQ = q.map((it: any) => it.id === selectedItem.id ? { ...it, status: 'REJECTED' } : it);
          localStorage.setItem('docsearch_verification_queue', JSON.stringify(updatedQ));

          const live = JSON.parse(localStorage.getItem('docsearch_live_partners') || '[]');
          const updatedLive = live.map((it: any) =>
            it.partnerId === selectedItem.id || it.partnerName === selectedItem.partnerName
              ? { ...it, status: 'REJECTED', lifecycleStatus: 'REJECTED' }
              : it
          );
          localStorage.setItem('docsearch_live_partners', JSON.stringify(updatedLive));
        } catch {}

        setTimeout(() => setToastMessage(null), 5000);
        fetchServerQueue();
      } else {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson.error?.message || errJson.message || `Rejection failed (${res.status})`;
        setToastMessage(`❌ ${msg}`);
        setTimeout(() => setToastMessage(null), 6000);
      }
    } catch (e: any) {
      console.warn('Reject error:', e);
      setToastMessage(`❌ Rejection error: ${e.message || String(e)}`);
      setTimeout(() => setToastMessage(null), 6000);
    }
  };

  const handleDeleteCard = async (id: string) => {
    const item = queue.find((q) => q.id === id);
    if (!item) return;

    if (!window.confirm(`Founder Master Action: Are you sure you want to permanently delete the application card for "${item.partnerName}"?`)) {
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') || localStorage.getItem('docsearch_auth_token') : null;
      await fetch(`/api/v1/company/partners/staged/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      }).catch(() => {});
    } catch {}

    setQueue((prev) => prev.filter((it) => it.id !== id));

    try {
      const q = JSON.parse(localStorage.getItem('docsearch_verification_queue') || '[]');
      const updatedQ = q.filter((it: any) => it.id !== id);
      localStorage.setItem('docsearch_verification_queue', JSON.stringify(updatedQ));
    } catch {}

    setToastMessage(`✓ Founder Master Action: Application for "${item.partnerName}" permanently deleted.`);
    setTimeout(() => setToastMessage(null), 4000);
    fetchServerQueue();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>🛡️</span>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              Partner Verification & Regulatory Review Console
            </h1>
            <Badge variant="primary">AI Pre-Checked</Badge>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--ds-color-text-muted)', fontSize: '0.8125rem' }}>
            Multi-tier split-screen compliance audit, AI OCR match verification, NABL/Council license validation, and digital Gold Trust Seal issuance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsPolicyModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              backgroundColor: '#7C3AED',
              color: '#FFFFFF',
              fontSize: '0.8125rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.35)',
              transition: 'all 0.2s'
            }}
          >
            <span>⚙️</span>
            <span>Registration Form Policy</span>
          </button>

          <button
            type="button"
            onClick={() => fetchServerQueue()}
            disabled={isRefreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              backgroundColor: '#0284C7',
              color: '#FFFFFF',
              fontSize: '0.8125rem',
              fontWeight: 700,
              border: 'none',
              cursor: isRefreshing ? 'wait' : 'pointer',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            <span>{isRefreshing ? '⏳' : '🔄'}</span>
            {isRefreshing ? 'Refreshing...' : 'Live Refresh'}
          </button>
          <Badge variant={queue.some((q) => q.status === 'PENDING_APPROVAL') ? 'warning' : 'success'}>
            Pending Review: {queue.filter((q) => q.status === 'PENDING_APPROVAL').length}
          </Badge>
          <Badge variant="success">
            Approved & Sealed: {queue.filter((q) => q.status === 'APPROVED').length}
          </Badge>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1.5px solid #10B981', color: '#A7F3D0', padding: '12px 20px', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 800 }}>
          {toastMessage}
        </div>
      )}

      {/* 🔍 LIVE APPLICATIONS SEARCH & FILTER CONTROL DECK */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '14px',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Row 1: Search + Dropdowns */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Universal Search */}
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', fontSize: '0.9rem' }}>
              🔍
            </span>
            <input
              type="text"
              placeholder="Search facility name, doctor, email, phone, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                backgroundColor: '#070C16',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#FFFFFF',
                fontSize: '0.8125rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Facility Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              backgroundColor: '#070C16',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#38BDF8',
              fontWeight: 700,
              fontSize: '0.8125rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">🏥 All Facility Types ({counts.all})</option>
            <option value="PATHOLOGY">🧪 Pathology Labs ({counts.pathology})</option>
            <option value="CLINIC">🩺 Clinics & Doctors ({counts.clinic})</option>
            <option value="PHARMACY">💊 Pharmacies ({counts.pharmacy})</option>
            <option value="HOSPITAL">🏥 Hospitals ({counts.hospital})</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              backgroundColor: '#070C16',
              border: '1px solid rgba(255,255,255,0.15)',
              color: statusFilter === 'PENDING_APPROVAL' ? '#FBBF24' : statusFilter === 'APPROVED' ? '#34D399' : '#E2E8F0',
              fontWeight: 700,
              fontSize: '0.8125rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">🚦 All Statuses</option>
            <option value="PENDING_APPROVAL">⏳ Pending Review ({counts.pending})</option>
            <option value="APPROVED">✅ Approved & Sealed ({counts.approved})</option>
            <option value="REJECTED">⚠️ Revision / Rejected ({counts.rejected})</option>
          </select>

          {/* Document / Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              backgroundColor: '#070C16',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#CBD5E1',
              fontWeight: 600,
              fontSize: '0.8125rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">📄 All Verification Types</option>
            <option value="AADHAAR_KYC">🪪 Owner Aadhaar KYC ({counts.aadhaarKyc})</option>
            <option value="PROFILE_AMENDMENT">📝 Staged Amendments ({counts.amendment})</option>
            <option value="LICENSE_CERTIFICATE">📜 Clinical / NABL License</option>
            <option value="BANK">🏦 Bank & Cheque Verification</option>
            <option value="ADDRESS">🏢 Commercial Establishment</option>
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #EF4444',
                color: '#FCA5A5',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              ✕ Reset Filters
            </button>
          )}
        </div>

        {/* Row 2: Quick Filter Chips (Pills) */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quick Filter:
          </span>

          <button
            type="button"
            onClick={() => { setTypeFilter('ALL'); setStatusFilter('ALL'); setCategoryFilter('ALL'); setSearchQuery(''); }}
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              border: typeFilter === 'ALL' && statusFilter === 'ALL' && categoryFilter === 'ALL' ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
              backgroundColor: typeFilter === 'ALL' && statusFilter === 'ALL' && categoryFilter === 'ALL' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
              color: typeFilter === 'ALL' && statusFilter === 'ALL' && categoryFilter === 'ALL' ? '#38BDF8' : '#94A3B8',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            🔘 All ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => { setStatusFilter('PENDING_APPROVAL'); }}
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              border: statusFilter === 'PENDING_APPROVAL' ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)',
              backgroundColor: statusFilter === 'PENDING_APPROVAL' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.04)',
              color: statusFilter === 'PENDING_APPROVAL' ? '#FCD34D' : '#94A3B8',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ⏳ Pending Review ({counts.pending})
          </button>

          <button
            type="button"
            onClick={() => { setTypeFilter('PATHOLOGY'); }}
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              border: typeFilter === 'PATHOLOGY' ? '1px solid #06B6D4' : '1px solid rgba(255,255,255,0.1)',
              backgroundColor: typeFilter === 'PATHOLOGY' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.04)',
              color: typeFilter === 'PATHOLOGY' ? '#67E8F9' : '#94A3B8',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            🧪 Pathology Labs ({counts.pathology})
          </button>

          <button
            type="button"
            onClick={() => { setTypeFilter('CLINIC'); }}
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              border: typeFilter === 'CLINIC' ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)',
              backgroundColor: typeFilter === 'CLINIC' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.04)',
              color: typeFilter === 'CLINIC' ? '#93C5FD' : '#94A3B8',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            🩺 Clinics & Doctors ({counts.clinic})
          </button>

          <button
            type="button"
            onClick={() => { setTypeFilter('PHARMACY'); }}
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              border: typeFilter === 'PHARMACY' ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
              backgroundColor: typeFilter === 'PHARMACY' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.04)',
              color: typeFilter === 'PHARMACY' ? '#6EE7B7' : '#94A3B8',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            💊 Pharmacies ({counts.pharmacy})
          </button>

          <button
            type="button"
            onClick={() => { setTypeFilter('HOSPITAL'); }}
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              border: typeFilter === 'HOSPITAL' ? '1px solid #8B5CF6' : '1px solid rgba(255,255,255,0.1)',
              backgroundColor: typeFilter === 'HOSPITAL' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.04)',
              color: typeFilter === 'HOSPITAL' ? '#C4B5FD' : '#94A3B8',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            🏥 Hospitals ({counts.hospital})
          </button>

          <button
            type="button"
            onClick={() => { setCategoryFilter('AADHAAR_KYC'); }}
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              border: categoryFilter === 'AADHAAR_KYC' ? '1px solid #EC4899' : '1px solid rgba(255,255,255,0.1)',
              backgroundColor: categoryFilter === 'AADHAAR_KYC' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255,255,255,0.04)',
              color: categoryFilter === 'AADHAAR_KYC' ? '#F472B6' : '#94A3B8',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            🪪 Aadhaar KYC ({counts.aadhaarKyc})
          </button>
        </div>
      </div>

      {/* Split-Screen Review Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 1fr', gap: '16px', alignItems: 'stretch' }}>
        
        {/* Column 1: Filtered Queue Selector */}
        <div style={{ backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 800, fontSize: '0.8125rem', color: '#94A3B8', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Applications ({filteredQueue.length} / {queue.length})</span>
            {hasActiveFilters && (
              <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700 }}>Filtered</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: '640px' }}>
            {filteredQueue.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: '#94A3B8' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
                <div style={{ fontWeight: 800, color: '#F1F5F9', fontSize: '0.875rem', marginBottom: '4px' }}>
                  No Applications Found
                </div>
                <div style={{ fontSize: '0.75rem', marginBottom: '12px' }}>
                  No records match your selected filter criteria.
                </div>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#0284C7',
                    color: '#FFF',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ✕ Reset Filters
                </button>
              </div>
            ) : (
              filteredQueue.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                      borderLeft: isSelected ? '3px solid #06B6D4' : '3px solid transparent'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.8125rem', color: isSelected ? '#38BDF8' : '#F8FAFC' }}>
                        {item.partnerName}
                      </strong>
                      <Badge variant={item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'} style={{ fontSize: '0.625rem' }}>
                        {item.status === 'APPROVED' ? '✓ APPROVED' : item.status === 'REJECTED' ? 'REJECTED' : 'PENDING'}
                      </Badge>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                      {item.documentType}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#94A3B8', marginTop: '4px' }}>
                      <span>{item.submittedAt}</span>
                      <span style={{ color: '#34D399', fontWeight: 700 }}>AI Match: {item.aiMatchScore}%</span>
                    </div>
                    <div style={{ marginTop: '5px', fontSize: '0.6875rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {item.assignedPlan ? (
                        <span style={{ color: '#F59E0B', fontWeight: 700 }}>
                          💼 Assigned: {item.assignedPlan.tier} (₹{item.assignedPlan.monthlyFee.toLocaleString('en-IN')}/mo)
                        </span>
                      ) : item.requestedPlan ? (
                        <span style={{ color: '#38BDF8', fontWeight: 700, backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: '4px', width: 'fit-content' }}>
                          🎯 Requested: {item.requestedPlan.tier} (₹{(item.requestedPlan.monthlyFee || 0).toLocaleString('en-IN')}/mo)
                        </span>
                      ) : (
                        <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>
                          ⏳ Plan: Pending Founder Assignment
                        </span>
                      )}
                      {item.advancePayment?.status === 'PAID' && (
                        <span style={{ color: '#34D399', fontWeight: 800, backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px', width: 'fit-content' }}>
                          💳 Advance Paid: ₹{item.advancePayment.amount?.toLocaleString('en-IN')}
                        </span>
                      )}
                      {item.refundStatus === 'REFUND_TRIGGERED' && (
                        <span style={{ color: '#FB923C', fontWeight: 800, backgroundColor: 'rgba(249, 115, 22, 0.15)', padding: '2px 6px', borderRadius: '4px', width: 'fit-content' }}>
                          ↩️ Refund Triggered ({item.refundId || 'RFND'})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Submitted Metadata & AI Pre-Audit Comparison */}
        {selectedItem && (
          <div style={{ backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.6875rem', color: '#06B6D4', fontWeight: 800, textTransform: 'uppercase' }}>
                    {selectedItem.category} COMPLIANCE AUDIT
                  </span>
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor:
                      selectedItem.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.2)' :
                      selectedItem.status === 'UNDER_REVIEW' ? 'rgba(56, 189, 248, 0.2)' :
                      selectedItem.status === 'ADDITIONAL_INFORMATION_REQUIRED' ? 'rgba(168, 85, 247, 0.2)' :
                      selectedItem.status === 'RESUBMITTED' ? 'rgba(6, 182, 212, 0.2)' :
                      selectedItem.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color:
                      selectedItem.status === 'APPROVED' ? '#34D399' :
                      selectedItem.status === 'UNDER_REVIEW' ? '#38BDF8' :
                      selectedItem.status === 'ADDITIONAL_INFORMATION_REQUIRED' ? '#C084FC' :
                      selectedItem.status === 'RESUBMITTED' ? '#22D3EE' :
                      selectedItem.status === 'REJECTED' ? '#F87171' : '#FBBF24',
                    border: `1px solid ${
                      selectedItem.status === 'APPROVED' ? '#10B981' :
                      selectedItem.status === 'UNDER_REVIEW' ? '#0284C7' :
                      selectedItem.status === 'ADDITIONAL_INFORMATION_REQUIRED' ? '#9333EA' :
                      selectedItem.status === 'RESUBMITTED' ? '#0891B2' :
                      selectedItem.status === 'REJECTED' ? '#EF4444' : '#F59E0B'
                    }`
                  }}>
                    ● {selectedItem.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 style={{ margin: '2px 0 0', fontSize: '1.05rem', fontWeight: 800, color: '#F8FAFC' }}>
                  {selectedItem.partnerName}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Tenant: <code style={{ color: '#38BDF8' }}>{selectedItem.tenantSlug}</code> • By {selectedItem.submittedBy}
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#6EE7B7', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                  🤖 AI OCR Match: {selectedItem.aiMatchScore}%
                </div>
              </div>
            </div>

            {/* 👤 WHO REGISTERED THIS PARTNER? ATTRIBUTION CARD */}
            <div style={{
              backgroundColor: 'rgba(56, 189, 248, 0.08)',
              border: '1.5px solid #0284C7',
              borderRadius: '10px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.15)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  👤 WHO REGISTERED THIS PARTNER?
                </span>
                <span style={{
                  backgroundColor: '#0369A1',
                  color: '#FFFFFF',
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {selectedItem.registeredBy?.source || 'SELF_REGISTRATION_PORTAL'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8125rem' }}>
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>Applicant Doctor / Lead:</span>
                  <div style={{ color: '#F8FAFC', fontWeight: 800 }}>
                    {selectedItem.registeredBy?.name || selectedItem.submittedBy || 'Authorized Representative'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>Registered Email:</span>
                  <div style={{ color: '#38BDF8', fontWeight: 700, wordBreak: 'break-all' }}>
                    {selectedItem.registeredBy?.email || selectedItem.details?.['Registered Email'] || 'applicant@docsearch.health'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>Applicant Phone:</span>
                  <div style={{ color: '#F8FAFC', fontWeight: 700 }}>
                    {selectedItem.details?.['Phone / Mobile'] || selectedItem.details?.['Contact Phone'] || '+91 88091 49036'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>Declared Role / Title:</span>
                  <div style={{ color: '#A7F3D0', fontWeight: 800 }}>
                    {selectedItem.registeredBy?.role || 'DOCTOR / MEDICAL IN-CHARGE'}
                  </div>
                </div>
              </div>

              {selectedItem.assignedReviewer && (
                <div style={{ borderTop: '1px dashed rgba(56, 189, 248, 0.3)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: '#94A3B8' }}>Assigned Reviewer:</span>
                  <span style={{ color: '#FDE047', fontWeight: 700 }}>
                    🛡️ {selectedItem.assignedReviewer.name || selectedItem.assignedReviewer.email}
                  </span>
                </div>
              )}
            </div>

            {/* 📁 SUBMITTED VERIFICATION DOCUMENTS INVENTORY */}
            <div style={{
              backgroundColor: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              borderRadius: '8px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#38BDF8', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📎</span>
                  <span>SUBMITTED DOCUMENTS ({availableDocs.length})</span>
                </span>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                  Click document to switch preview
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {availableDocs.map((doc, idx) => {
                  const isCur = idx === activeDocIndex;
                  const isAadhaar = (doc.documentType || '').toLowerCase().includes('aadhaar') || (doc.documentName || '').toLowerCase().includes('aadhaar');
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveDocIndex(idx)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: isCur ? 'rgba(2, 132, 199, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                        border: isCur ? '1px solid #0284C7' : '1px solid rgba(255, 255, 255, 0.06)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{isAadhaar ? '🪪' : '📜'}</span>
                        <span style={{ color: isCur ? '#38BDF8' : '#F1F5F9', fontWeight: 800 }}>
                          {doc.documentType || `Document ${idx + 1}`}
                        </span>
                        {isCur && (
                          <span style={{ fontSize: '0.625rem', backgroundColor: '#0284C7', color: '#FFF', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <span style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>
                        {doc.documentName} {doc.fileSizeKb ? `(${doc.fileSizeKb} KB)` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submitted Metadata Key-Values */}
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                SUBMITTED PARTNER METADATA:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#070C16', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                {Object.entries(selectedItem.details).map(([key, val]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: '#94A3B8' }}>{key}:</span>
                    <strong style={{ color: '#F8FAFC', textAlign: 'right' }}>{val}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* AI OCR Extracted Text & Cross-Match */}
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                🤖 AI EXTRACTED OCR TEXT FROM ATTACHED DOCUMENT:
              </span>
              <div style={{ backgroundColor: '#070C16', padding: '10px', borderRadius: '8px', border: '1px dashed rgba(6, 182, 212, 0.3)', fontSize: '0.75rem', color: '#CBD5E1', fontFamily: 'monospace', lineHeight: 1.4 }}>
                "{selectedItem.extractedOcrText}"
              </div>
            </div>

            {/* 🔬 FORENSIC ORIGINALITY & DEDUPLICATION AUDIT PANEL */}
            <div style={{
              backgroundColor: selectedItem.duplicateRisk?.hasRisk
                ? 'rgba(239, 68, 68, 0.08)'
                : verifiedOriginalMap[selectedItem.id]
                ? 'rgba(16, 185, 129, 0.1)'
                : 'rgba(30, 41, 59, 0.6)',
              border: `1.5px solid ${
                selectedItem.duplicateRisk?.hasRisk
                  ? '#EF4444'
                  : verifiedOriginalMap[selectedItem.id]
                  ? '#10B981'
                  : 'rgba(56, 189, 248, 0.3)'
              }`,
              borderRadius: '10px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: selectedItem.duplicateRisk?.hasRisk
                ? '0 0 15px rgba(239, 68, 68, 0.2)'
                : 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '1.1rem' }}>
                    {selectedItem.duplicateRisk?.hasRisk ? '🚨' : verifiedOriginalMap[selectedItem.id] ? '🛡️' : '🔬'}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    color: selectedItem.duplicateRisk?.hasRisk ? '#FCA5A5' : '#38BDF8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    ORIGINAL VS DUPLICATE FORENSIC VERIFICATION
                  </span>
                </div>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '0.6875rem',
                  fontWeight: 900,
                  backgroundColor: selectedItem.duplicateRisk?.hasRisk ? '#DC2626' : verifiedOriginalMap[selectedItem.id] ? '#059669' : '#0284C7',
                  color: '#FFFFFF'
                }}>
                  {selectedItem.duplicateRisk?.hasRisk
                    ? '⚠️ SUSPECTED DUPLICATE'
                    : verifiedOriginalMap[selectedItem.id]
                    ? '✓ VERIFIED GENUINE ORIGINAL'
                    : '🛡️ CRYPTOGRAPHICALLY UNIQUE'}
                </span>
              </div>

              {/* Signals / Deduplication Explanation */}
              {selectedItem.duplicateRisk?.hasRisk ? (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  fontSize: '0.75rem',
                  color: '#FECACA'
                }}>
                  <div style={{ fontWeight: 800, marginBottom: '4px' }}>
                    ⚠️ COLLISION DETECTED WITH EXISTING REGISTRATIONS:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {selectedItem.duplicateRisk.signals.map((sig, idx) => (
                      <li key={idx} style={{ color: '#FCA5A5' }}>{sig}</li>
                    ))}
                  </ul>
                  <div style={{ marginTop: '6px', fontSize: '0.6875rem', color: '#F87171' }}>
                    Tamper / Fraud Warning: This document or license credential is duplicated across multiple accounts. Thoroughly verify before issuing Gold Trust Seal.
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  fontSize: '0.75rem',
                  color: '#A7F3D0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '1.1rem' }}>✓</span>
                  <div>
                    <strong>Cryptographic Fingerprint Unique:</strong> No matching document hash, Aadhaar KYC, or Clinical License collisions detected in registry.
                  </div>
                </div>
              )}

              {/* Forensic Cross-Check Matrix */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '0.75rem',
                backgroundColor: '#070C16',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>Active Document SHA-256:</span>
                  <div style={{ color: '#CBD5E1', fontFamily: 'monospace', fontSize: '0.6875rem', wordBreak: 'break-all' }}>
                    {activeDoc?.sha256Hash ? `${activeDoc.sha256Hash.slice(0, 18)}...` : selectedItem.sha256Hash ? `${selectedItem.sha256Hash.slice(0, 18)}...` : 'Computed on upload'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>Deduplication Status:</span>
                  <div style={{ color: selectedItem.duplicateRisk?.hasRisk ? '#F87171' : '#34D399', fontWeight: 800 }}>
                    {selectedItem.duplicateRisk?.hasRisk ? 'COLLISION_ALERT' : 'ORIGINAL_RECORD'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>Regulatory License No:</span>
                  <div style={{ color: '#38BDF8', fontWeight: 700 }}>
                    {selectedItem.details?.['License / Reg No'] || selectedItem.details?.['Clinical Establishment No'] || selectedItem.details?.['NABL Accreditation No'] || 'Verified in Registry'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>Owner Aadhaar KYC:</span>
                  <div style={{ color: selectedItem.details?.['Owner Aadhaar Number'] ? '#F8FAFC' : '#94A3B8', fontWeight: 700 }}>
                    {selectedItem.details?.['Owner Aadhaar Number'] || 'Uploaded in KYC'}
                  </div>
                </div>
              </div>

              {/* Reviewer Originality Actions */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                <button
                  type="button"
                  onClick={() => handleToggleVerifiedOriginal(selectedItem.id)}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: verifiedOriginalMap[selectedItem.id] ? 'rgba(16, 185, 129, 0.2)' : '#0284C7',
                    border: verifiedOriginalMap[selectedItem.id] ? '1px solid #10B981' : 'none',
                    color: verifiedOriginalMap[selectedItem.id] ? '#6EE7B7' : '#FFFFFF',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{verifiedOriginalMap[selectedItem.id] ? '✓' : '🛡️'}</span>
                  {verifiedOriginalMap[selectedItem.id]
                    ? 'Originality Stamp Verified (Click to Revoke)'
                    : 'Mark as Verified Genuine Original'}
                </button>

                {selectedItem.duplicateRisk?.hasRisk && selectedItem.status !== 'REJECTED' && (
                  <button
                    type="button"
                    onClick={() => {
                      setRejectReason(`Rejected due to duplicate document / license collision: ${selectedItem.duplicateRisk?.signals?.join('; ')}`);
                      setIsRejectModalOpen(true);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid #EF4444',
                      color: '#FCA5A5',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    🚨 Reject Duplicate
                  </button>
                )}
              </div>
            </div>

            {/* 🎯 OPTION 2: PARTNER REQUESTED PLAN (DUAL-CONTROL ONBOARDING) */}
            {selectedItem.requestedPlan && (
              <div style={{
                backgroundColor: 'rgba(56, 189, 248, 0.06)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🎯</span>
                    <div>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Partner Requested Plan (Dual-Control)
                      </span>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
                        {selectedItem.requestedPlan.planName || selectedItem.requestedPlan.tier}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(56, 189, 248, 0.2)',
                    color: '#38BDF8',
                    border: '1px solid #0284C7'
                  }}>
                    Partner Preference
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#070C16', padding: '8px 10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    Requested Fee: <strong style={{ color: '#38BDF8', fontSize: '0.875rem' }}>₹{(selectedItem.requestedPlan.monthlyFee || 0).toLocaleString('en-IN')}/month</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenPlanModal(selectedItem.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: '#0284C7',
                      color: '#FFF',
                      border: 'none',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Review / Confirm Plan →
                  </button>
                </div>
              </div>
            )}

            {/* 💳 OPTION 3: ADVANCE PAYMENT STATUS CARD */}
            {selectedItem.advancePayment && (
              <div style={{
                backgroundColor: selectedItem.advancePayment.status === 'PAID' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(249, 115, 22, 0.08)',
                border: selectedItem.advancePayment.status === 'PAID' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(249, 115, 22, 0.4)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{selectedItem.advancePayment.status === 'PAID' ? '💳' : '↩️'}</span>
                    <div>
                      <span style={{
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        color: selectedItem.advancePayment.status === 'PAID' ? '#34D399' : '#FB923C',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {selectedItem.advancePayment.status === 'PAID' ? 'Fast-Track Advance Paid (Razorpay Sandbox)' : 'Advance Payment Refunded'}
                      </span>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
                        ₹{(selectedItem.advancePayment.amount || 0).toLocaleString('en-IN')} via {selectedItem.advancePayment.paymentMethod || 'Razorpay UPI'}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: selectedItem.advancePayment.status === 'PAID' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                    color: selectedItem.advancePayment.status === 'PAID' ? '#34D399' : '#FB923C',
                    border: selectedItem.advancePayment.status === 'PAID' ? '1px solid #10B981' : '1px solid #F97316'
                  }}>
                    {selectedItem.advancePayment.status === 'PAID' ? '✓ ESCROW CREDITED' : '100% REFUNDED'}
                  </span>
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8', backgroundColor: '#070C16', padding: '6px 10px', borderRadius: '6px' }}>
                  {selectedItem.advancePayment.status === 'PAID' ? (
                    <>
                      <span>Txn: <code style={{ color: '#CBD5E1' }}>{selectedItem.advancePayment.transactionId || 'pay_rzp_live'}</code> • Paid on {selectedItem.advancePayment.paidAt ? new Date(selectedItem.advancePayment.paidAt).toLocaleDateString() : 'Today'}</span>
                      <div style={{ color: '#34D399', marginTop: '2px' }}>🛡️ If approved, subscription invoice is marked PAID. If rejected, automatic 100% refund executes.</div>
                    </>
                  ) : (
                    <>
                      <span>Refund Ref: <code style={{ color: '#FB923C' }}>{selectedItem.advancePayment.refundId || selectedItem.refundId || 'RFND-RZP'}</code></span>
                      <div style={{ color: '#FDBA74', marginTop: '2px' }}>{selectedItem.advancePayment.refundNotice || '100% refund initiated to source payment method.'}</div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 💼 FOUNDER ASSIGNED SUBSCRIPTION & COMMERCIAL PRICING */}
            <div style={{
              backgroundColor: '#070C16',
              border: selectedItem.assignedPlan ? '1px solid rgba(245, 158, 11, 0.4)' : '1px dashed rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.1rem' }}>💼</span>
                  <div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Commercial Plan & Pricing
                    </span>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F8FAFC' }}>
                      {selectedItem.assignedPlan ? selectedItem.assignedPlan.planName : 'Pending Founder Assignment'}
                    </div>
                  </div>
                </div>
                {selectedItem.assignedPlan ? (
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#34D399',
                    border: '1px solid #10B981'
                  }}>
                    ✓ Plan Issued
                  </span>
                ) : (
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(234, 179, 8, 0.15)',
                    color: '#FACC15',
                    border: '1px solid #CA8A04'
                  }}>
                    ⏳ Founder To Decide
                  </span>
                )}
              </div>

              {selectedItem.assignedPlan ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem'
                }}>
                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>Negotiated Fee:</span>
                    <div style={{ color: '#38BDF8', fontWeight: 800, fontSize: '0.875rem' }}>
                      ₹{selectedItem.assignedPlan.monthlyFee.toLocaleString('en-IN')}<span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>/mo</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>Billing Cycle:</span>
                    <div style={{ color: '#CBD5E1', fontWeight: 700 }}>
                      {selectedItem.assignedPlan.billingFrequency} {selectedItem.assignedPlan.discountPercent ? `(-${selectedItem.assignedPlan.discountPercent}%)` : ''}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>Net Payable:</span>
                    <div style={{ color: '#34D399', fontWeight: 800, fontSize: '0.875rem' }}>
                      ₹{selectedItem.assignedPlan.finalAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>Trial / Grace:</span>
                    <div style={{ color: '#F59E0B', fontWeight: 700 }}>
                      {selectedItem.assignedPlan.trialDays ? `${selectedItem.assignedPlan.trialDays} Days Active` : 'Immediate Due'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>Invoice #:</span>
                    <div style={{ color: '#CBD5E1', fontFamily: 'monospace' }}>
                      {selectedItem.assignedPlan.invoiceNumber || selectedItem.invoiceNumber || 'INV-PENDING'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>Collection Mode:</span>
                    <div style={{ color: '#CBD5E1', fontWeight: 700 }}>
                      {selectedItem.assignedPlan.paymentMode === 'BANK_TRANSFER' ? 'Direct Bank (NEFT/RTGS)' : selectedItem.assignedPlan.paymentMode === 'CASH_CHEQUE' ? 'Cash / Cheque' : 'Online Gateway'}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.4 }}>
                  Self-registration did not auto-select a plan. As Founder/Admin, click <strong style={{ color: '#38BDF8' }}>Approve & Assign Plan</strong> below to configure tier, custom pricing, discount, and free trial.
                </div>
              )}
            </div>

            {/* ⚙️ NEXT ACTION ENGINE */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ⚡ REGULATORY NEXT ACTIONS:
                </span>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                  Current Status: <strong style={{ color: '#F8FAFC' }}>{selectedItem.status}</strong>
                </span>
              </div>

              {/* Action Buttons Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {(selectedItem.status === 'PENDING_APPROVAL' || selectedItem.status === 'RESUBMITTED') && (
                  <button
                    type="button"
                    onClick={() => handleStartReview(selectedItem.id)}
                    style={{
                      backgroundColor: '#0284C7',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>▶</span> Start Review
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(true)}
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid #0284C7',
                    color: '#38BDF8',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>👤</span> Assign Reviewer
                </button>

                {selectedItem.status === 'UNDER_REVIEW' && (
                  <button
                    type="button"
                    onClick={() => setIsRequestInfoModalOpen(true)}
                    style={{
                      backgroundColor: 'rgba(168, 85, 247, 0.15)',
                      border: '1px solid #A855F7',
                      color: '#D8B4FE',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>❓</span> Request Info
                  </button>
                )}

                {selectedItem.status !== 'APPROVED' ? (
                  <button
                    type="button"
                    onClick={() => handleOpenPlanModal(selectedItem.id)}
                    style={{
                      backgroundColor: '#10B981',
                      color: '#070C16',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      fontWeight: 900,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>💼</span> Approve & Assign Plan
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenPlanModal(selectedItem.id)}
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid #10B981',
                      color: '#6EE7B7',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>✏️</span> Edit Assigned Plan
                  </button>
                )}

                {selectedItem.status !== 'REJECTED' && (
                  <button
                    type="button"
                    onClick={() => setIsRejectModalOpen(true)}
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid #EF4444',
                      color: '#FCA5A5',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>⚠️</span> Reject KYC
                  </button>
                )}

                {isCompanyDestructiveActionAllowed() && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCard(selectedItem.id)}
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid #DC2626',
                      color: '#F87171',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                    title="Founder Master Action: Permanently delete this application"
                  >
                    <span>🗑️</span> Delete Card
                  </button>
                )}
              </div>

              {/* 📜 CASE AUDIT TIMELINE WITH SHA-256 HASH CHAIN */}
              <div style={{
                marginTop: '10px',
                backgroundColor: '#070C16',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                    📜 Case Audit Trail ({timeline.length} Events)
                  </span>
                  <span style={{ fontSize: '0.625rem', color: '#10B981', fontWeight: 700 }}>
                    🔒 SHA-256 Chained
                  </span>
                </div>

                {isLoadingTimeline ? (
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', textAlign: 'center', padding: '10px' }}>
                    Loading audit trail...
                  </div>
                ) : timeline.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: '#38BDF8', fontWeight: 700 }}>PARTNER_SELF_REGISTERED</span>
                      <span style={{ color: '#64748B', fontSize: '0.6875rem' }}>{selectedItem.submittedAt}</span>
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                      Applicant: {selectedItem.submittedBy} • Origin: {selectedItem.registeredBy?.source || 'PORTAL'}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                    {timeline.map((ev, idx) => (
                      <div key={ev.id || idx} style={{ borderBottom: idx < timeline.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', paddingBottom: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <strong style={{ color: '#38BDF8' }}>{ev.eventType}</strong>
                          <span style={{ color: '#64748B', fontSize: '0.6875rem' }}>
                            {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString('en-IN') : 'Recently'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>
                          Actor: <code style={{ color: '#CBD5E1' }}>{ev.actorEmail}</code>
                        </div>
                        {ev.integrityHash && (
                          <div style={{ fontSize: '0.5625rem', color: '#64748B', fontFamily: 'monospace', marginTop: '2px', wordBreak: 'break-all' }}>
                            Hash: {ev.integrityHash.slice(0, 32)}...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Column 3: High-Res Document Preview & Security Watermark */}
        {selectedItem && (
          <div style={{ backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Top Toolbar: Document Title & Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', display: 'block' }}>
                  📄 Interactive Document Viewer
                </span>
                <span style={{ fontSize: '0.75rem', color: '#F1F5F9', fontWeight: 700 }}>
                  Showing: <span style={{ color: '#38BDF8' }}>{activeDoc?.documentType || selectedItem.documentType}</span>
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '2px', alignItems: 'center', backgroundColor: '#070C16', padding: '2px 6px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(z - 10, 70))}
                    style={{ backgroundColor: '#1E293B', color: '#FFF', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    -
                  </button>
                  <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700, minWidth: '36px', textAlign: 'center' }}>{zoomLevel}%</span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(z + 10, 150))}
                    style={{ backgroundColor: '#1E293B', color: '#FFF', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(100)}
                    style={{ backgroundColor: 'transparent', color: '#94A3B8', border: 'none', fontSize: '0.6875rem', cursor: 'pointer', padding: '0 4px' }}
                  >
                    ↺
                  </button>
                </div>

                {activeDocUrl && (
                  <button
                    type="button"
                    onClick={() => setIsDocModalOpen(true)}
                    style={{
                      backgroundColor: '#0284C7',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Fullscreen Forensic Inspection"
                  >
                    <span>🔍</span> Fullscreen
                  </button>
                )}
              </div>
            </div>

            {/* Document Switcher Tabs */}
            {availableDocs.length > 1 && (
              <div style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                padding: '6px 8px',
                backgroundColor: '#070C16',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                {availableDocs.map((doc, idx) => {
                  const isCurrent = idx === activeDocIndex;
                  const isAadhaar = (doc.documentType || '').toLowerCase().includes('aadhaar') || (doc.documentName || '').toLowerCase().includes('aadhaar');
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveDocIndex(idx)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: isCurrent ? '#0284C7' : 'rgba(255,255,255,0.05)',
                        color: isCurrent ? '#FFFFFF' : '#94A3B8',
                        border: isCurrent ? '1.5px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span>{isAadhaar ? '🪪' : '📜'}</span>
                      <span>{doc.documentType || `Doc ${idx + 1}`}</span>
                      {doc.fileSizeKb ? (
                        <span style={{ fontSize: '0.625rem', opacity: 0.8 }}>({doc.fileSizeKb} KB)</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Document Render Canvas */}
            <div style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              borderRadius: '10px',
              padding: activeDocUrl ? '8px' : '24px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease',
              minHeight: '460px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Tamper-Evident Diagonal Watermark */}
              <div style={{
                position: 'absolute',
                top: '40%',
                left: '8%',
                transform: 'rotate(-30deg)',
                fontSize: '1.35rem',
                fontWeight: 900,
                color: 'rgba(6, 182, 212, 0.18)',
                pointerEvents: 'none',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                zIndex: 10
              }}>
                DOC SEARCH DIGITAL AUDIT VAULT • VERIFIED COPY
              </div>

              {activeDocUrl ? (
                activeDocUrl.startsWith('data:application/pdf') || (activeDoc?.documentName || '').toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={activeDocUrl}
                    title={activeDoc?.documentName || selectedItem.documentName}
                    style={{ width: '100%', height: '440px', border: 'none', borderRadius: '6px', backgroundColor: '#FFFFFF' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '440px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <img
                      src={activeDocUrl}
                      alt={activeDoc?.documentName || selectedItem.documentName}
                      style={{ maxWidth: '100%', maxHeight: '430px', objectFit: 'contain', borderRadius: '6px' }}
                    />
                  </div>
                )
              ) : (
                /* Simulated High-Res Certificate Mock fallback */
                <div style={{ border: '3px double #0284C7', padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ textAlign: 'center', borderBottom: '1px solid #CBD5E1', paddingBottom: '10px' }}>
                    <div style={{ fontSize: '1.5rem' }}>🏛️</div>
                    <h4 style={{ margin: '4px 0 0', fontSize: '0.9375rem', fontWeight: 900, color: '#0369A1', textTransform: 'uppercase' }}>
                      {selectedItem.documentType}
                    </h4>
                    <span style={{ fontSize: '0.625rem', color: '#64748B' }}>GOVERNMENT REGULATORY & QUALITY ACCREDITATION AUTHORITY</span>
                  </div>

                  <div style={{ margin: '14px 0', fontSize: '0.75rem', lineHeight: 1.5, color: '#334155' }}>
                    <p><strong>Issued Facility:</strong> {selectedItem.partnerName}</p>
                    <p><strong>License / Registration No:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0284C7' }}>{selectedItem.details['License / Reg No'] || selectedItem.details['Clinical Establishment No'] || selectedItem.details['NABL Accreditation No'] || selectedItem.details['Account Number'] || 'CEA-PAT-2026-ABC'}</span></p>
                    <p><strong>Proprietor / Medical Director:</strong> {selectedItem.submittedBy}</p>
                    {selectedItem.details['Owner Aadhaar Number'] && (
                      <p><strong>Director Aadhaar KYC:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{selectedItem.details['Owner Aadhaar Number']}</span></p>
                    )}
                    {selectedItem.details['Bed Capacity'] && (
                      <p><strong>Approved Bed Capacity:</strong> <strong>{selectedItem.details['Bed Capacity']}</strong></p>
                    )}
                    {selectedItem.details['City & State'] && (
                      <p><strong>Jurisdiction:</strong> {selectedItem.details['City & State']}</p>
                    )}
                    <p><strong>Compliance Status:</strong> Standards audited under Clinical Establishment Act & NHA Health Guidelines.</p>
                    {selectedItem.expiryDate && <p><strong>Validity Expiry Date:</strong> <strong style={{ color: '#16A34A' }}>{selectedItem.expiryDate}</strong></p>}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: '8px', fontSize: '0.625rem', color: '#64748B' }}>
                    <div>
                      <span style={{ display: 'block', fontWeight: 700 }}>Digitally Verified By AI OCR</span>
                      <span>Confidence Score: {selectedItem.aiMatchScore}%</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'cursive', fontSize: '0.875rem', color: '#0369A1' }}>Registrar General</div>
                      <span>Authorized Signatory</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Document Details & Download Clean Copy Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingTop: '4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.75rem', color: '#F1F5F9', fontWeight: 700 }}>
                  📁 {activeDoc?.documentName || selectedItem.documentName || 'Document'}
                </span>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                  {activeDoc?.fileSizeKb ? `${activeDoc.fileSizeKb} KB • ` : ''}Type: {activeDoc?.documentType || selectedItem.documentType}
                </span>
              </div>

              {activeDocUrl && (
                <a
                  href={activeDocUrl}
                  download={activeDoc?.documentName || `${selectedItem.partnerName.replace(/\s+/g, '_')}_document.pdf`}
                  style={{
                    backgroundColor: '#0284C7',
                    color: '#FFFFFF',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>📥</span> Download Clean Copy
                </a>
              )}
            </div>
          </div>
        )}

        {!selectedItem && (
          <div style={{ gridColumn: 'span 2', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🛡️</div>
            <h3 style={{ color: '#F8FAFC', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 8px 0' }}>
              No Pending Verification Applications
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '0.875rem', maxWidth: '480px', margin: '0 auto 20px auto', lineHeight: 1.6 }}>
              All partner applications have been reviewed. When a new doctor, pathology lab, pharmacy, or hospital registers on the landing page, their verification documents will appear here live in real-time.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#38BDF8', fontSize: '0.8125rem', fontWeight: 700 }}>
              <span>⚡ Live Gateway Auto-Sync Active (Port 4000)</span>
            </div>
          </div>
        )}

      </div>

      {/* 👤 MODAL 1: ASSIGN REVIEWER */}
      {isAssignModalOpen && selectedItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(7, 12, 22, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#0F172A',
            border: '1.5px solid #0284C7',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>👤</span>
                <h3 style={{ margin: 0, color: '#F8FAFC', fontSize: '1.1rem', fontWeight: 800 }}>
                  Assign Compliance Reviewer
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8', lineHeight: 1.5 }}>
              Delegate regulatory audit and legal verification for <strong style={{ color: '#38BDF8' }}>{selectedItem.partnerName}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                  Reviewer Name
                </label>
                <input
                  type="text"
                  value={assignReviewerName}
                  onChange={(e) => setAssignReviewerName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#070C16',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#FFFFFF',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                  Reviewer Official Email
                </label>
                <input
                  type="email"
                  value={assignReviewerEmail}
                  onChange={(e) => setAssignReviewerEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#070C16',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#FFFFFF',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#CBD5E1',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignReviewerSubmit}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#0284C7',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ❓ MODAL 2: REQUEST ADDITIONAL INFORMATION */}
      {isRequestInfoModalOpen && selectedItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(7, 12, 22, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#0F172A',
            border: '1.5px solid #A855F7',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>❓</span>
                <h3 style={{ margin: 0, color: '#F8FAFC', fontSize: '1.1rem', fontWeight: 800 }}>
                  Request Additional Information
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestInfoModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8', lineHeight: 1.5 }}>
              Specify the clarification or document re-upload needed from <strong style={{ color: '#C084FC' }}>{selectedItem.partnerName}</strong>. This notice will be dispatched via real-time alert and email.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                Reason & Specific Requirements <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                rows={4}
                placeholder="e.g. Upload clear copy of Clinical Establishment License Form C. The current copy is partially blurred."
                value={requestInfoReason}
                onChange={(e) => setRequestInfoReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#070C16',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setIsRequestInfoModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#CBD5E1',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!requestInfoReason.trim()}
                onClick={handleRequestInfoSubmit}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  backgroundColor: requestInfoReason.trim() ? '#9333EA' : '#4B5563',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.8125rem',
                  cursor: requestInfoReason.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ MODAL 3: REJECT KYC APPLICATION */}
      {isRejectModalOpen && selectedItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(7, 12, 22, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#0F172A',
            border: '1.5px solid #EF4444',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                <h3 style={{ margin: 0, color: '#F8FAFC', fontSize: '1.1rem', fontWeight: 800 }}>
                  Reject Partner Verification
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8', lineHeight: 1.5 }}>
              Reject KYC application for <strong style={{ color: '#F87171' }}>{selectedItem.partnerName}</strong>. State regulatory compliance mandates an explicit, auditable justification.
            </p>

            {selectedItem.advancePayment?.status === 'PAID' && (
              <div style={{
                backgroundColor: 'rgba(249, 115, 22, 0.15)',
                border: '1px solid #F97316',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '0.75rem',
                color: '#FDBA74'
              }}>
                ⚠️ <strong>Automatic Refund Warning:</strong> Partner has paid ₹{(selectedItem.advancePayment.amount || 0).toLocaleString('en-IN')} in advance via {selectedItem.advancePayment.paymentMethod || 'Razorpay UPI'}. Confirming rejection will <strong>automatically trigger a 100% refund</strong> to their original payment source.
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                Rejection Justification <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                rows={4}
                placeholder="e.g. Expired Medical Council registration proof. Document validity ended on 31-Dec-2025."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#070C16',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#CBD5E1',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim()}
                onClick={handleRejectSubmit}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  backgroundColor: rejectReason.trim() ? '#DC2626' : '#4B5563',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.8125rem',
                  cursor: rejectReason.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔍 MODAL 4: FULLSCREEN HIGH-RESOLUTION DOCUMENT INSPECTION */}
      {isDocModalOpen && selectedItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(7, 12, 22, 0.92)',
          backdropFilter: 'blur(12px)',
          zIndex: 11000,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px'
        }}>
          {/* Modal Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '14px',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.75rem' }}>🔍</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#F8FAFC' }}>
                  Document Forensic Inspection: {selectedItem.partnerName}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#38BDF8' }}>
                  {activeDoc?.documentType || selectedItem.documentType} • {activeDoc?.documentName || selectedItem.documentName} {activeDoc?.fileSizeKb ? `(${activeDoc.fileSizeKb} KB)` : ''}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {activeDocUrl && (
                <a
                  href={activeDocUrl}
                  download={activeDoc?.documentName || `${selectedItem.partnerName.replace(/\s+/g, '_')}_document.pdf`}
                  style={{
                    backgroundColor: '#0284C7',
                    color: '#FFFFFF',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>📥</span> Download Clean Copy
                </a>
              )}
              <button
                type="button"
                onClick={() => setIsDocModalOpen(false)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #EF4444',
                  color: '#FCA5A5',
                  fontWeight: 800,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                ✕ Close
              </button>
            </div>
          </div>

          {/* Modal Document Switcher if multiple */}
          {availableDocs.length > 1 && (
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: '10px 0',
              overflowX: 'auto'
            }}>
              {availableDocs.map((doc, idx) => {
                const isCur = idx === activeDocIndex;
                const isAadhaar = (doc.documentType || '').toLowerCase().includes('aadhaar') || (doc.documentName || '').toLowerCase().includes('aadhaar');
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveDocIndex(idx)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      backgroundColor: isCur ? '#0284C7' : 'rgba(255,255,255,0.06)',
                      border: isCur ? '1.5px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                      color: isCur ? '#FFFFFF' : '#94A3B8',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{isAadhaar ? '🪪' : '📜'}</span>
                    <span>{doc.documentType || `Doc ${idx + 1}`}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Modal Viewer Canvas */}
          <div style={{
            flex: 1,
            marginTop: '8px',
            backgroundColor: '#030712',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {activeDocUrl ? (
              activeDocUrl.startsWith('data:application/pdf') || (activeDoc?.documentName || '').toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={activeDocUrl}
                  title="Document Preview Fullscreen"
                  style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#FFFFFF' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                  <img
                    src={activeDocUrl}
                    alt="Document Preview Fullscreen"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                </div>
              )
            ) : (
              <div style={{ color: '#94A3B8', textAlign: 'center' }}>No document file stream available.</div>
            )}
          </div>
        </div>
      )}

      {/* 💼 MODAL 5: ASSIGN PLAN, PRICING & APPROVE PARTNER */}
      {/* 💼 MODAL 5: ASSIGN PLAN, PRICING & APPROVE PARTNER (FOUNDER COMMAND SUITE) */}
      {isPlanModalOpen && selectedItem && (() => {
        const isOneTime = billingFrequency === 'ONE_TIME';
        const months = billingFrequency === 'ANNUAL' ? 12 : billingFrequency === 'QUARTERLY' ? 3 : isOneTime ? 0 : 1;
        const recurringBase = isOneTime ? customMonthlyFee : (customMonthlyFee * months);
        const discountAmount = Math.round((recurringBase * discountPercent) / 100);
        const discountedRecurring = Math.max(0, recurringBase - discountAmount);
        const preTaxTotal = discountedRecurring + (Number(setupFee) || 0);
        const taxAmount = taxMode === 'EXCLUSIVE_GST_18' ? Math.round(preTaxTotal * 0.18) : 0;
        const grossTotal = preTaxTotal + taxAmount;
        const netPayable = Math.max(0, grossTotal - (Number(advanceCredit) || 0));

        const toggleModule = (modName: string) => {
          setEnabledModules((prev) =>
            prev.includes(modName) ? prev.filter((m) => m !== modName) : [...prev, modName]
          );
        };

        const appendSnippet = (snippet: string) => {
          setFounderNotes((prev) => {
            const clean = prev.trim();
            return clean ? `${clean}\n• ${snippet}` : `• ${snippet}`;
          });
        };

        const handleDurationSelect = (dur: string) => {
          setContractDuration(dur);
          const d = new Date();
          if (dur === '1_MONTH') d.setMonth(d.getMonth() + 1);
          else if (dur === '3_MONTHS') d.setMonth(d.getMonth() + 3);
          else if (dur === '6_MONTHS') d.setMonth(d.getMonth() + 6);
          else if (dur === '1_YEAR') d.setFullYear(d.getFullYear() + 1);
          else if (dur === '2_YEARS') d.setFullYear(d.getFullYear() + 2);
          else if (dur === '3_YEARS') d.setFullYear(d.getFullYear() + 3);
          else if (dur === 'LIFETIME') d.setFullYear(d.getFullYear() + 25);
          setExpiryDate(d.toISOString().split('T')[0] || '');
        };

        return (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 9, 18, 0.92)',
            backdropFilter: 'blur(10px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: '#0A1122',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 40px rgba(245, 158, 11, 0.12)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '1020px',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '22px'
            }}>
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid #F59E0B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    💼
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
                        Assign Subscription Plan & Founder Commercial Control
                      </h3>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                        border: '1px solid rgba(245, 158, 11, 0.5)',
                        color: '#FBBF24',
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        textTransform: 'uppercase'
                      }}>
                        Founder Master Suite
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78125rem', color: '#94A3B8', marginTop: '3px' }}>
                      Partner: <strong style={{ color: '#38BDF8' }}>{selectedItem.partnerName}</strong> ({selectedItem.partnerType}) • Applicant: {selectedItem.submittedBy} • {selectedItem.details?.['Registered City'] || selectedItem.details?.['City'] || 'India'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#94A3B8',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Status Notice: Option 2 Partner Selection & Option 3 Advance Token */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedItem.requestedPlan && (
                  <div style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.84375rem', fontWeight: 800, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🎯 Option 2 Partner Selection:</span>
                        <span>{selectedItem.requestedPlan.planName || selectedItem.requestedPlan.tier} (₹{(selectedItem.requestedPlan.monthlyFee || 0).toLocaleString('en-IN')}/mo)</span>
                      </div>
                      <div style={{ fontSize: '0.71875rem', color: '#94A3B8', marginTop: '2px' }}>
                        Dual-Control is active. You can confirm their chosen plan as-is or modify any terms, prices, discounts, and quotas below.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const t = (selectedItem.requestedPlan?.tier || 'FOUNDING').toUpperCase();
                        setSelectedPlanTier(t as any);
                        const fee = selectedItem.requestedPlan?.price !== undefined
                          ? selectedItem.requestedPlan.price
                          : (selectedItem.requestedPlan?.monthlyFee !== undefined ? selectedItem.requestedPlan.monthlyFee : 0);
                        setCustomMonthlyFee(fee);
                        if (selectedItem.requestedPlan?.planName || selectedItem.requestedPlan?.name) {
                          setCustomPlanName(selectedItem.requestedPlan.planName || selectedItem.requestedPlan.name || '');
                        }
                        if (selectedItem.requestedPlan?.billingInterval || selectedItem.requestedPlan?.billingFrequency) {
                          setBillingFrequency((selectedItem.requestedPlan.billingInterval || selectedItem.requestedPlan.billingFrequency) as any);
                        }
                      }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        backgroundColor: '#0284C7',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
                      }}
                    >
                      🎯 Match Partner Selection
                    </button>
                  </div>
                )}

                {selectedItem.advancePayment?.status === 'PAID' && (
                  <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.84375rem', fontWeight: 800, color: '#6EE7B7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>💳 Option 3 Advance Token Paid:</span>
                        <span>₹{(selectedItem.advancePayment.amount || 0).toLocaleString('en-IN')} Received</span>
                      </div>
                      <div style={{ fontSize: '0.71875rem', color: '#A7F3D0', marginTop: '2px' }}>
                        Settled via {selectedItem.advancePayment.paymentMethod || 'Razorpay UPI'} (Txn ID: {selectedItem.advancePayment.transactionId}). Credited automatically below.
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(16, 185, 129, 0.25)',
                      color: '#10B981',
                      fontSize: '0.75rem',
                      fontWeight: 900
                    }}>
                      CREDITED ₹{(selectedItem.advancePayment.amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>

              {/* ⚡ FOUNDER 1-CLICK DEAL PRESETS BAR */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '12px 14px'
              }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  ⚡ Founder 1-Click Deal Presets (Instant Macro-Configuration)
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountPercent(100);
                      setTrialDays(30);
                      appendSnippet('Approved as 100% Free Pioneer Pilot for inaugural launch phase.');
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: discountPercent === 100 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#6EE7B7',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🎁 100% Free Pioneer Pilot
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDiscountPercent(50);
                      setTrialDays(14);
                      appendSnippet('50% Early Adopter Special Founder Discount granted for inaugural term.');
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: discountPercent === 50 ? 'rgba(56, 189, 248, 0.3)' : 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      color: '#38BDF8',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ⚡ 50% Early Adopter Deal
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBillingFrequency('ANNUAL');
                      setDiscountPercent(17);
                      handleDurationSelect('1_YEAR');
                      appendSnippet('Annual Commitment Contract: 2 months complimentary hosting included.');
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: billingFrequency === 'ANNUAL' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.12)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      color: '#C084FC',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ⭐ Annual (2-Mo Free)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlanTier('ENTERPRISE');
                      setCustomMonthlyFee(9999);
                      setCustomPlanName('Enterprise Hospital Pro HIS Suite');
                      setCustomPlanSubtitle('Full Hospital, IPD Beds, ICU & OT Management');
                      setEnabledModules(ALL_AVAILABLE_MODULES.map((m) => m.name));
                      setBedQuota('Unlimited Beds');
                      setStaffSeatsQuota('Unlimited Staff');
                      setSlaTier('99.95% Mission-Critical SLA');
                      setSupportTier('24/7 Dedicated Founder Concierge & Priority WhatsApp');
                      appendSnippet('VIP Enterprise Tier: Unlimited Beds, Staff Seats, and Priority SLA.');
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      color: '#FBBF24',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🚀 VIP Unlimited Hospital
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlanTier('STARTER');
                      setCustomMonthlyFee(1999);
                      setCustomPlanName('Starter Clinic OPD / Basic LIMS Suite');
                      setCustomPlanSubtitle('Outpatient Consultation & Barcode LIMS');
                      setEnabledModules(['Clinical Suite & EMR', 'OPD Queue & Appointments', 'WhatsApp Automation & SMS', 'ABHA / ABDM Govt Integration']);
                      setBedQuota('Day Care (5 Beds)');
                      setStaffSeatsQuota('5 Staff');
                      setSlaTier('99.5% Standard SLA');
                      setSupportTier('Priority Business Hours WhatsApp');
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#E2E8F0',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🩺 Starter Clinic OPD
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenPlanModal(selectedItem.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      border: '1px dashed rgba(255, 255, 255, 0.25)',
                      color: '#94A3B8',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginLeft: 'auto'
                    }}
                  >
                    🔄 Reset Defaults
                  </button>
                </div>
              </div>

              {/* SECTION 1: PLAN TIER & EDITABLE IDENTITY */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      1. Plan Tier & Identity
                    </label>
                    <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700 }}>
                      (Facility: {selectedItem.partnerType})
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setModalPlanFilter('FOR_FACILITY')}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: modalPlanFilter === 'FOR_FACILITY' ? '#0284C7' : 'rgba(255,255,255,0.06)',
                        color: modalPlanFilter === 'FOR_FACILITY' ? '#FFFFFF' : '#94A3B8',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      🏥 {selectedItem.partnerType} Plans
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalPlanFilter('ALL')}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: modalPlanFilter === 'ALL' ? '#0284C7' : 'rgba(255,255,255,0.06)',
                        color: modalPlanFilter === 'ALL' ? '#FFFFFF' : '#94A3B8',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      🌐 All Tiers
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                  {(() => {
                    const allPlansList = (formPolicy.availablePlans && formPolicy.availablePlans.length > 0 ? formPolicy.availablePlans : DEFAULT_PUBLIC_PLANS);
                    const filteredList = modalPlanFilter === 'FOR_FACILITY'
                      ? allPlansList.filter(dp => !dp.applicableFacilityTypes || dp.applicableFacilityTypes.includes('ALL') || dp.applicableFacilityTypes.includes(selectedItem.partnerType as any))
                      : allPlansList;
                    const dynamicTiers = filteredList.map((dp) => ({
                      tier: dp.tier || dp.code,
                      code: dp.code,
                      label: dp.name,
                      base: dp.price,
                      tag: dp.tag,
                      icon: dp.icon,
                      subtitle: dp.description,
                      facilityTypes: dp.applicableFacilityTypes,
                      billingInterval: dp.billingInterval || 'MONTHLY'
                    }));
                    if (!dynamicTiers.some((t) => t.tier === 'CUSTOM')) {
                      dynamicTiers.push({
                        tier: 'CUSTOM',
                        code: 'PLAN_CUSTOM_B2B',
                        label: 'Custom B2B Negotiated Tier',
                        base: 14999,
                        tag: 'Tailored Contract',
                        icon: '⚡',
                        subtitle: 'B2B Custom Negotiated Contract & Infrastructure',
                        facilityTypes: ['ALL'],
                        billingInterval: 'MONTHLY'
                      });
                    }
                    return dynamicTiers;
                  })().map((p) => {
                    const isSelected = selectedPlanTier === p.tier;
                    return (
                      <div
                        key={p.tier}
                        onClick={() => {
                          setSelectedPlanTier(p.tier as any);
                          setCustomMonthlyFee(p.base);
                          setCustomPlanName(p.label);
                          setCustomPlanSubtitle(p.subtitle);
                          const freq = (p.billingInterval || 'MONTHLY') as any;
                          setBillingFrequency(freq);
                          if (freq === 'ONE_TIME') {
                            handleDurationSelect('LIFETIME');
                          } else if (freq === 'ANNUAL') {
                            handleDurationSelect('1_YEAR');
                          } else if (freq === 'QUARTERLY') {
                            handleDurationSelect('3_MONTHS');
                          } else {
                            handleDurationSelect('1_MONTH');
                          }
                        }}
                        style={{
                          backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.15)' : '#070C16',
                          border: isSelected ? '2px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '10px',
                          padding: '12px 10px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.2rem' }}>{p.icon}</span>
                          {isSelected && <span style={{ color: '#F59E0B', fontSize: '0.75rem', fontWeight: 900 }}>✓ ACTIVE</span>}
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '0.8125rem', color: isSelected ? '#FBBF24' : '#F8FAFC' }}>
                          {p.label}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                          {p.tag}
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', marginTop: '4px' }}>
                          ₹{p.base.toLocaleString('en-IN')}<span style={{ fontSize: '0.625rem', color: '#64748B' }}>
                            {p.billingInterval === 'ANNUAL' ? '/yr' : p.billingInterval === 'QUARTERLY' ? '/quarter' : p.billingInterval === 'ONE_TIME' ? ' (One-Time)' : '/mo base'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.71875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      Custom Plan Title (Printed on Partner Invoices & Portal)
                    </label>
                    <input
                      type="text"
                      value={customPlanName}
                      onChange={(e) => setCustomPlanName(e.target.value)}
                      placeholder="e.g. Enterprise Hospital Pro HIS Suite"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#070C16',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#FFFFFF',
                        fontSize: '0.84375rem',
                        fontWeight: 700
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.71875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      Plan Subtitle & Scope Summary
                    </label>
                    <input
                      type="text"
                      value={customPlanSubtitle}
                      onChange={(e) => setCustomPlanSubtitle(e.target.value)}
                      placeholder="e.g. Full Hospital, IPD Beds, ICU & OT Management"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#070C16',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#FFFFFF',
                        fontSize: '0.84375rem',
                        fontWeight: 600
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: COMMERCIAL PRICING, INVOICING & GST ENGINE */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                  2. Commercial Pricing, Invoicing & Tax Architecture
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.71875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      {billingFrequency === 'ANNUAL' ? 'Annual Base Fee (₹)' : billingFrequency === 'QUARTERLY' ? 'Quarterly Base Fee (₹)' : billingFrequency === 'ONE_TIME' ? 'One-Time License Fee (₹)' : 'Monthly Base Fee (₹)'} <span style={{ color: '#F59E0B' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={customMonthlyFee}
                      onChange={(e) => setCustomMonthlyFee(Math.max(0, Number(e.target.value)))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#070C16',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#FFFFFF',
                        fontSize: '0.9375rem',
                        fontWeight: 800
                      }}
                    />
                    <span style={{ fontSize: '0.65625rem', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
                      {billingFrequency === 'ONE_TIME' ? 'Perpetual lifetime software license.' : 'Negotiable founder recurring rate.'}
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.71875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      Billing Cycle / Cadence
                    </label>
                    <select
                      value={billingFrequency}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setBillingFrequency(val);
                        if (val === 'ONE_TIME') {
                          handleDurationSelect('LIFETIME');
                        } else if (val === 'ANNUAL' && contractDuration === '1_MONTH') {
                          handleDurationSelect('1_YEAR');
                        } else if (val === 'QUARTERLY' && contractDuration === '1_MONTH') {
                          handleDurationSelect('3_MONTHS');
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#070C16',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#FFFFFF',
                        fontSize: '0.84375rem',
                        fontWeight: 700
                      }}
                    >
                      <option value="MONTHLY">Monthly (1 Month Recurring)</option>
                      <option value="QUARTERLY">Quarterly (3 Months Recurring)</option>
                      <option value="ANNUAL">Annual (12 Months / 1 Year)</option>
                      <option value="ONE_TIME">One-Time / Lifetime License</option>
                    </select>
                    <span style={{ fontSize: '0.65625rem', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
                      {isOneTime ? '♾️ One-Time Perpetual (No Recurring)' : `Invoiced for ${months} month${months > 1 ? 's' : ''}.`}
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.71875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      One-Time Setup Fee (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={setupFee}
                      onChange={(e) => setSetupFee(Math.max(0, Number(e.target.value)))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#070C16',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#FFFFFF',
                        fontSize: '0.9375rem',
                        fontWeight: 800
                      }}
                    />
                    <span style={{ fontSize: '0.65625rem', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
                      Hardware, onboarding, data migration.
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.71875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      Founder Discount (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#070C16',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#FFFFFF',
                        fontSize: '0.9375rem',
                        fontWeight: 800
                      }}
                    />
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      {[0, 10, 25, 50, 100].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setDiscountPercent(pct)}
                          style={{
                            flex: 1,
                            padding: '2px 0',
                            borderRadius: '4px',
                            backgroundColor: discountPercent === pct ? '#F59E0B' : 'rgba(255,255,255,0.06)',
                            border: 'none',
                            color: discountPercent === pct ? '#070C16' : '#94A3B8',
                            fontSize: '0.625rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          {pct === 100 ? 'Free' : `${pct}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.71875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      GST / Taxation Treatment
                    </label>
                    <select
                      value={taxMode}
                      onChange={(e) => setTaxMode(e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#070C16',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#FFFFFF',
                        fontSize: '0.84375rem',
                        fontWeight: 700
                      }}
                    >
                      <option value="INCLUSIVE">GST Inclusive (Taxes already bundled in price)</option>
                      <option value="EXCLUSIVE_GST_18">+18% GST Exclusive (Add ₹{Math.round(preTaxTotal * 0.18).toLocaleString('en-IN')} to final invoice)</option>
                      <option value="EXEMPT">GST Exempt / Non-Profit Hospital Registration</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.71875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      Advance Payment Offset Credit (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={advanceCredit}
                      onChange={(e) => setAdvanceCredit(Math.max(0, Number(e.target.value)))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#070C16',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#10B981',
                        fontSize: '0.875rem',
                        fontWeight: 800
                      }}
                    />
                  </div>
                </div>

                {/* Real-Time Pro-Forma Invoice Breakdown Box */}
                <div style={{
                  backgroundColor: '#070C16',
                  borderRadius: '12px',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Calculated Pro-Forma Invoice ({billingFrequency})
                      </span>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        color: '#38BDF8',
                        fontSize: '0.625rem',
                        fontWeight: 700
                      }}>
                        {taxMode}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {isOneTime ? (
                        <span>One-Time License Fee: <strong>₹{recurringBase.toLocaleString('en-IN')}</strong> (Perpetual Lifetime)</span>
                      ) : (
                        <span>Base: ₹{customMonthlyFee.toLocaleString('en-IN')} × {months} mo = <strong>₹{recurringBase.toLocaleString('en-IN')}</strong></span>
                      )}
                      {discountAmount > 0 && <span style={{ color: '#F87171' }}>• Disc (-{discountPercent}%): -₹{discountAmount.toLocaleString('en-IN')}</span>}
                      {setupFee > 0 && <span style={{ color: '#FBBF24' }}>• Setup: +₹{setupFee.toLocaleString('en-IN')}</span>}
                      {taxAmount > 0 && <span style={{ color: '#A78BFA' }}>• GST 18%: +₹{taxAmount.toLocaleString('en-IN')}</span>}
                      {advanceCredit > 0 && <span style={{ color: '#34D399' }}>• Adv Paid: -₹{advanceCredit.toLocaleString('en-IN')}</span>}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Payable Amount Due</span>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: netPayable === 0 ? '#10B981' : '#34D399', lineHeight: 1.1, marginTop: '2px' }}>
                      {netPayable === 0 ? '₹0 (Waived / Paid)' : `₹${netPayable.toLocaleString('en-IN')}`}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px' }}>
                      {selectedItem.advancePayment?.status === 'PAID' && netPayable === 0 ? '✓ Fully Settled via Fast-Track' :
                       discountPercent === 100 ? '✓ 100% Complimentary Pilot' :
                       trialDays > 0 ? `TRIAL_ACTIVE (${trialDays} Days)` : 'PENDING_PAYMENT on Approval'}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: GRANULAR MODULE ENTITLEMENTS (12 TOGGLE SWITCHES) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      3. Granular Module Entitlements ({enabledModules.length} of {ALL_AVAILABLE_MODULES.length} Activated)
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setEnabledModules(ALL_AVAILABLE_MODULES.map((m) => m.name))}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38BDF8',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ✓ Select All (12)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnabledModules(['Clinical Suite & EMR', 'OPD Queue & Appointments', 'WhatsApp Automation & SMS', 'ABHA / ABDM Govt Integration'])}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#CBD5E1',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      🩺 OPD Clinic
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnabledModules(['Pathology & Diagnostic LIMS', 'WhatsApp Automation & SMS', 'ABHA / ABDM Govt Integration', 'Clinical Suite & EMR'])}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#CBD5E1',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      🔬 Diagnostic Lab
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnabledModules([])}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#94A3B8',
                        fontSize: '0.6875rem',
                        cursor: 'pointer'
                      }}
                    >
                      ✕ Clear All
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {ALL_AVAILABLE_MODULES.map((mod) => {
                    const isEnabled = enabledModules.includes(mod.name);
                    return (
                      <div
                        key={mod.id}
                        onClick={() => toggleModule(mod.name)}
                        style={{
                          backgroundColor: isEnabled ? 'rgba(16, 185, 129, 0.08)' : '#070C16',
                          border: isEnabled ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          transition: 'all 0.12s ease'
                        }}
                      >
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          backgroundColor: isEnabled ? '#10B981' : 'transparent',
                          border: isEnabled ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#070C16',
                          fontSize: '0.6875rem',
                          fontWeight: 900,
                          flexShrink: 0
                        }}>
                          {isEnabled ? '✓' : ''}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.9375rem' }}>{mod.icon}</span>
                            <span style={{ fontSize: '0.78125rem', fontWeight: isEnabled ? 800 : 500, color: isEnabled ? '#F8FAFC' : '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {mod.name}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.625rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                            {mod.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 4: CAPACITY QUOTAS, VALIDITY & SLA COMMITMENTS */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  4. Capacity Quotas, Contract Validity & SLA Commitments
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '3px' }}>
                      Inpatient Bed Quota
                    </label>
                    <input
                      type="text"
                      value={bedQuota}
                      onChange={(e) => setBedQuota(e.target.value)}
                      placeholder="e.g. 50 Beds, Unlimited"
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#070C16',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#FFFFFF',
                        fontSize: '0.78125rem',
                        fontWeight: 600
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '3px' }}>
                      Doctor User Seats Quota
                    </label>
                    <input
                      type="text"
                      value={doctorQuota}
                      onChange={(e) => setDoctorQuota(e.target.value)}
                      placeholder="e.g. 10 Doctors, 50 Doctors"
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#070C16',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#FFFFFF',
                        fontSize: '0.78125rem',
                        fontWeight: 600
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '3px' }}>
                      Staff & Executive User Seats Quota
                    </label>
                    <input
                      type="text"
                      value={staffSeatsQuota}
                      onChange={(e) => setStaffSeatsQuota(e.target.value)}
                      placeholder="e.g. 25 Staff, Unlimited"
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#070C16',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#FFFFFF',
                        fontSize: '0.78125rem',
                        fontWeight: 600
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '3px' }}>
                      WhatsApp Message Quota
                    </label>
                    <input
                      type="text"
                      value={whatsAppQuota}
                      onChange={(e) => setWhatsAppQuota(e.target.value)}
                      placeholder="e.g. 5,000 / mo"
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#070C16',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#FFFFFF',
                        fontSize: '0.78125rem',
                        fontWeight: 600
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '3px' }}>
                      Cloud Storage & PACS Limit
                    </label>
                    <input
                      type="text"
                      value={storageQuota}
                      onChange={(e) => setStorageQuota(e.target.value)}
                      placeholder="e.g. 50 GB, 1 TB"
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#070C16',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#FFFFFF',
                        fontSize: '0.78125rem',
                        fontWeight: 600
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1.4fr', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '3px' }}>
                        Contract Term
                      </label>
                      <select
                        value={contractDuration}
                        onChange={(e) => handleDurationSelect(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#070C16',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: '#FFFFFF',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                      >
                        <option value="1_MONTH">1 Month</option>
                        <option value="3_MONTHS">3 Months</option>
                        <option value="6_MONTHS">6 Months</option>
                        <option value="1_YEAR">1 Year</option>
                        <option value="2_YEARS">2 Years</option>
                        <option value="3_YEARS">3 Years</option>
                        <option value="LIFETIME">Perpetual / Lifetime</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '3px' }}>
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#070C16',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: '#FFFFFF',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '3px' }}>
                      SLA Commitment Level
                    </label>
                    <select
                      value={slaTier}
                      onChange={(e) => setSlaTier(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#070C16',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#FFFFFF',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      <option value="99.95% Mission-Critical SLA">99.95% Mission-Critical SLA</option>
                      <option value="99.5% High Availability SLA">99.5% High Availability SLA</option>
                      <option value="99.0% Standard SLA">99.0% Standard SLA</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '3px' }}>
                      Support & Concierge Tier
                    </label>
                    <select
                      value={supportTier}
                      onChange={(e) => setSupportTier(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#070C16',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#FFFFFF',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      <option value="24/7 Dedicated Founder Concierge & Priority WhatsApp">24/7 Dedicated Founder Concierge & Priority WhatsApp</option>
                      <option value="Priority Business Hours WhatsApp">Priority Business Hours WhatsApp</option>
                      <option value="Standard Email & Helpdesk Support">Standard Email & Helpdesk Support</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 5: TRIAL WINDOW, PAYMENT MODE & FOUNDER COVENANTS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.71875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                        Free Trial / Grace Window
                      </label>
                      <select
                        value={trialDays}
                        onChange={(e) => setTrialDays(Number(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          backgroundColor: '#070C16',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: '#FFFFFF',
                          fontSize: '0.78125rem',
                          fontWeight: 700
                        }}
                      >
                        <option value={0}>0 Days (Immediate Payment Due)</option>
                        <option value={7}>7 Days Free Trial</option>
                        <option value={14}>14 Days Free Trial</option>
                        <option value={30}>30 Days Pioneer Evaluation</option>
                        <option value={60}>60 Days Extended Pilot</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.71875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                        Payment Collection Mode
                      </label>
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value as any)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          backgroundColor: '#070C16',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: '#FFFFFF',
                          fontSize: '0.78125rem',
                          fontWeight: 700
                        }}
                      >
                        <option value="ONLINE_GATEWAY">Online Gateway (Razorpay / UPI)</option>
                        <option value="BANK_TRANSFER">Corporate Bank NEFT / RTGS</option>
                        <option value="CASH_CHEQUE">Offline Cheque / Field Collected</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                    Status upon issuance: <strong style={{ color: trialDays > 0 ? '#FBBF24' : '#34D399' }}>
                      {trialDays > 0 ? `TRIAL_ACTIVE for ${trialDays} days` : 'PENDING_PAYMENT invoice issued'}
                    </strong>.
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.71875rem', fontWeight: 700, color: '#CBD5E1' }}>
                      Founder Covenants & Internal Notes
                    </label>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                    <button
                      type="button"
                      onClick={() => appendSnippet('30-Day 100% unconditional money-back guarantee.')}
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#CBD5E1',
                        fontSize: '0.625rem',
                        cursor: 'pointer'
                      }}
                    >
                      + 30-Day Moneyback
                    </button>
                    <button
                      type="button"
                      onClick={() => appendSnippet('Pricing locked against inflation for 24 months.')}
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#CBD5E1',
                        fontSize: '0.625rem',
                        cursor: 'pointer'
                      }}
                    >
                      + Price Locked 2 Yrs
                    </button>
                    <button
                      type="button"
                      onClick={() => appendSnippet('Free biometric attendance & barcode hardware included.')}
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#CBD5E1',
                        fontSize: '0.625rem',
                        cursor: 'pointer'
                      }}
                    >
                      + Free Hardware
                    </button>
                    <button
                      type="button"
                      onClick={() => appendSnippet('Complimentary patient EMR & billing migration from legacy software.')}
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#CBD5E1',
                        fontSize: '0.625rem',
                        cursor: 'pointer'
                      }}
                    >
                      + Free Data Migration
                    </button>
                    <button
                      type="button"
                      onClick={() => appendSnippet('2 days on-site clinical staff & billing desk training included.')}
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#CBD5E1',
                        fontSize: '0.625rem',
                        cursor: 'pointer'
                      }}
                    >
                      + Staff Training
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Type custom deal covenants, approved discounts, or executive terms..."
                    value={founderNotes}
                    onChange={(e) => setFounderNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#070C16',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#FFFFFF',
                      fontSize: '0.78125rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              {/* MODAL ACTIONS FOOTER (DUAL FOUNDER ACTION BUTTONS) */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255,255,255,0.08)'
              }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsPlanModalOpen(false)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#CBD5E1',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleConfirmApproveWithPlan({
                        discountPercent: 100,
                        trialDays: 30,
                        founderNotes: founderNotes.trim()
                          ? `${founderNotes.trim()}\n• Approved via Founder 1-Click 100% Free Pioneer Pilot (Fee Waived).`
                          : '• Approved via Founder 1-Click 100% Free Pioneer Pilot (Fee Waived).'
                      });
                    }}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#6EE7B7',
                      fontWeight: 800,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>🎁</span> 1-Click Approve as 100% Free Pilot (₹0)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleConfirmApproveWithPlan()}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>✓</span>
                  <span>Approve Partner & Issue Plan Invoice ({netPayable === 0 ? '₹0 Waived' : `₹${netPayable.toLocaleString('en-IN')}`})</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ⚙️ MODAL 6: UNIVERSAL REGISTRATION FORM POLICY & FIELD RULES COCKPIT */}
      {isPolicyModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(5, 9, 18, 0.92)',
          backdropFilter: 'blur(10px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#0A1122',
            border: '1px solid rgba(124, 58, 237, 0.45)',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 40px rgba(124, 58, 237, 0.15)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '960px',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(124, 58, 237, 0.15)',
                  border: '1px solid #7C3AED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  ⚙️
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
                      Universal Registration Form & Policy Control Cockpit
                    </h3>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(124, 58, 237, 0.2)',
                      border: '1px solid rgba(124, 58, 237, 0.5)',
                      color: '#C084FC',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      textTransform: 'uppercase'
                    }}>
                      HQ Central Authority
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78125rem', color: '#94A3B8', marginTop: '3px' }}>
                    Control whether subscription plans are visible to applicants, what fields are mandatory vs optional, and allowed facility types globally.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPolicyModalOpen(false)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#94A3B8',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  padding: '6px 12px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Quick Policy Presets Bar */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '12px 14px'
            }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#C084FC', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                ⚡ 1-Click Policy Presets (Global Form Architecture)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setFormPolicy({
                      ...formPolicy,
                      showPlanSelection: true,
                      allowAdvancePayment: true,
                      fieldRules: {
                        ownerAadhaar: 'MANDATORY',
                        aadhaarDocUpload: 'MANDATORY',
                        clinicalLicense: 'MANDATORY',
                        licenseDocUpload: 'MANDATORY',
                        gstinNumber: 'MANDATORY',
                        bedCapacity: 'MANDATORY',
                        mobileWhatsapp: 'MANDATORY',
                        cityState: 'MANDATORY',
                        passwordCreation: 'MANDATORY'
                      }
                    });
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#38BDF8',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Strict Enterprise KYC
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormPolicy({
                      ...formPolicy,
                      showPlanSelection: true,
                      allowAdvancePayment: true,
                      fieldRules: {
                        ownerAadhaar: 'OPTIONAL',
                        aadhaarDocUpload: 'OPTIONAL',
                        clinicalLicense: 'OPTIONAL',
                        licenseDocUpload: 'OPTIONAL',
                        gstinNumber: 'OPTIONAL',
                        bedCapacity: 'OPTIONAL',
                        mobileWhatsapp: 'MANDATORY',
                        cityState: 'MANDATORY',
                        passwordCreation: 'AUTO_GENERATE'
                      }
                    });
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#6EE7B7',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🚀 Frictionless Rapid Onboarding
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormPolicy({
                      ...formPolicy,
                      showPlanSelection: false,
                      allowAdvancePayment: false,
                      fieldRules: {
                        ownerAadhaar: 'MANDATORY',
                        aadhaarDocUpload: 'MANDATORY',
                        clinicalLicense: 'MANDATORY',
                        licenseDocUpload: 'MANDATORY',
                        gstinNumber: 'OPTIONAL',
                        bedCapacity: 'MANDATORY',
                        mobileWhatsapp: 'MANDATORY',
                        cityState: 'MANDATORY',
                        passwordCreation: 'MANDATORY'
                      }
                    });
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.5)',
                    color: '#FBBF24',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  🛡️ Option 1 Pure B2B (Founder Assigns All Plans)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormPolicy(DEFAULT_REGISTRATION_FORM_POLICY);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    border: '1px dashed rgba(255, 255, 255, 0.25)',
                    color: '#94A3B8',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginLeft: 'auto'
                  }}
                >
                  🔄 Reset Defaults
                </button>
              </div>
            </div>

            {/* Section 1: Plan Visibility & Advance Self-Checkout Master Switches */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {/* Plan Selection Switch */}
              <div style={{
                backgroundColor: formPolicy.showPlanSelection ? 'rgba(56, 189, 248, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                border: formPolicy.showPlanSelection ? '1.5px solid rgba(56, 189, 248, 0.4)' : '1.5px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: formPolicy.showPlanSelection ? '#38BDF8' : '#FBBF24' }}>
                    1. Subscription Plan Selection in Form
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormPolicy((p) => ({ ...p, showPlanSelection: !p.showPlanSelection }))}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      backgroundColor: formPolicy.showPlanSelection ? '#0284C7' : '#D97706',
                      color: '#FFF',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {formPolicy.showPlanSelection ? '✓ VISIBLE (Option 2/3)' : '✕ HIDDEN (Option 1 HQ Decides)'}
                  </button>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#CBD5E1', lineHeight: 1.4 }}>
                  {formPolicy.showPlanSelection ? (
                    <span>
                      <strong>Visible:</strong> Partner sees{' '}
                      <strong style={{ color: '#38BDF8' }}>
                        {(formPolicy.availablePlans && formPolicy.availablePlans.length > 0
                          ? formPolicy.availablePlans.filter((p) => p.isActive !== false)
                          : DEFAULT_PUBLIC_PLANS
                        )
                          .map((p) => `${p.name || p.tier} (₹${(p.price || 0).toLocaleString('en-IN')})`)
                          .join(', ')}
                      </strong>{' '}
                      cards in registration form and submits their preferred candidate tier.
                    </span>
                  ) : (
                    <span><strong>Hidden:</strong> Plan selection step is completely removed from the form. Partner registers without picking a plan, and you decide their custom plan & pricing during verification review in HQ.</span>
                  )}
                </div>
              </div>

              {/* Advance Payment Switch */}
              <div style={{
                backgroundColor: formPolicy.allowAdvancePayment ? 'rgba(16, 185, 129, 0.08)' : 'rgba(148, 163, 184, 0.05)',
                border: formPolicy.allowAdvancePayment ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: formPolicy.allowAdvancePayment ? '#34D399' : '#94A3B8' }}>
                    2. Instant Advance Online Checkout (Razorpay)
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormPolicy((p) => ({ ...p, allowAdvancePayment: !p.allowAdvancePayment }))}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      backgroundColor: formPolicy.allowAdvancePayment ? '#059669' : '#475569',
                      color: '#FFF',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {formPolicy.allowAdvancePayment ? '✓ ENABLED (Online Pay)' : '✕ DISABLED (Invoiced Only)'}
                  </button>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#CBD5E1', lineHeight: 1.4 }}>
                  {formPolicy.allowAdvancePayment ? (
                    <span><strong>Enabled:</strong> Paid tiers trigger immediate checkout with order token generation; status is set to PENDING_APPROVAL.</span>
                  ) : (
                    <span><strong>Disabled:</strong> Advance payment self-checkout is hidden; all partners register with post-approval invoicing only.</span>
                  )}
                </div>
              </div>

              {/* Module Selection Checklist Switch */}
              <div style={{
                backgroundColor: formPolicy.showModuleSelection ? 'rgba(168, 85, 247, 0.08)' : 'rgba(15, 23, 42, 0.6)',
                border: formPolicy.showModuleSelection ? '1.5px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: formPolicy.showModuleSelection ? '#C084FC' : '#94A3B8' }}>
                    3. Department & Module Checklist in Form
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormPolicy((p) => ({ ...p, showModuleSelection: !p.showModuleSelection }))}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      backgroundColor: formPolicy.showModuleSelection ? '#9333EA' : '#334155',
                      color: '#FFF',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {formPolicy.showModuleSelection ? '✓ VISIBLE' : '✕ HIDDEN (Recommended)'}
                  </button>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#CBD5E1', lineHeight: 1.4 }}>
                  {formPolicy.showModuleSelection ? (
                    <span><strong>Visible:</strong> Public applicants manually see and toggle department & feature module checkboxes (IPD, OT, ICU, TPA, etc.) during registration.</span>
                  ) : (
                    <span><strong>Hidden:</strong> Department & module checklist is hidden from public registration forms. Standard operational modules are granted automatically upon Founder/HQ verification.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Dynamic Public Subscription Plans & Catalog Editor (PostgreSQL Sync) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  2. Category-Specific Public Subscription Plans & Pricing Catalog (Live Synchronized)
                </label>
                <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700 }}>
                  ⚡ Edits here publish live to Landing Page & Partner Portals
                </span>
              </div>

              {/* Category Filter Tabs */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {[
                  { id: 'ALL', label: '🌐 All Categories' },
                  { id: 'HOSPITAL', label: '🏥 Hospital (HIS)' },
                  { id: 'CLINIC', label: '🩺 Clinic (OPD)' },
                  { id: 'PATHOLOGY', label: '🧪 Pathology (LIMS)' },
                  { id: 'PHARMACY', label: '💊 Pharmacy (POS)' }
                ].map((cat) => {
                  const isSel = cockpitPlanCategory === cat.id;
                  const plansList = formPolicy.availablePlans && formPolicy.availablePlans.length > 0 ? formPolicy.availablePlans : DEFAULT_PUBLIC_PLANS;
                  const count = cat.id === 'ALL'
                    ? plansList.length
                    : plansList.filter((p) => p.applicableFacilityTypes?.includes(cat.id as any)).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCockpitPlanCategory(cat.id as any)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: isSel ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: isSel ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: isSel ? '#38BDF8' : '#94A3B8',
                        fontSize: '0.75rem',
                        fontWeight: isSel ? 800 : 600,
                        cursor: 'pointer'
                      }}
                    >
                      {cat.label} ({count})
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
                {(() => {
                  const baseList = formPolicy.availablePlans && formPolicy.availablePlans.length > 0 ? formPolicy.availablePlans : DEFAULT_PUBLIC_PLANS;
                  return baseList
                    .filter((p) => cockpitPlanCategory === 'ALL' || p.applicableFacilityTypes?.includes(cockpitPlanCategory as any))
                    .map((p) => {
                      const idx = baseList.findIndex((item) => item.id === p.id);
                      return (
                        <div
                          key={p.id || p.tier || idx}
                          style={{
                            backgroundColor: '#070C16',
                            border: p.isActive !== false ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '1.4rem' }}>{p.icon}</span>
                              <div>
                                <input
                                  type="text"
                                  value={p.name}
                                  onChange={(e) => {
                                    const updated = baseList.map((item, i) => i === idx ? { ...item, name: e.target.value } : item);
                                    setFormPolicy({ ...formPolicy, availablePlans: updated });
                                  }}
                                  style={{
                                    fontSize: '0.8125rem',
                                    fontWeight: 800,
                                    color: '#F8FAFC',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderBottom: '1px dashed rgba(255, 255, 255, 0.2)',
                                    padding: '2px 0',
                                    width: '100%'
                                  }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                  <span style={{ fontSize: '0.625rem', color: '#94A3B8' }}>{p.code}</span>
                                  {p.applicableFacilityTypes && p.applicableFacilityTypes.length > 0 && (
                                    <span style={{
                                      fontSize: '0.5625rem',
                                      fontWeight: 800,
                                      padding: '1px 5px',
                                      borderRadius: '3px',
                                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                      color: '#38BDF8'
                                    }}>
                                      {p.applicableFacilityTypes.join(', ')}
                                    </span>
                                  )}
                                  <span style={{
                                    fontSize: '0.5625rem',
                                    fontWeight: 800,
                                    padding: '1px 5px',
                                    borderRadius: '3px',
                                    backgroundColor: p.billingInterval === 'ONE_TIME' ? 'rgba(16, 185, 129, 0.2)' : p.billingInterval === 'ANNUAL' ? 'rgba(168, 85, 247, 0.2)' : p.billingInterval === 'QUARTERLY' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                                    color: p.billingInterval === 'ONE_TIME' ? '#34D399' : p.billingInterval === 'ANNUAL' ? '#C084FC' : p.billingInterval === 'QUARTERLY' ? '#FBBF24' : '#38BDF8'
                                  }}>
                                    {p.billingInterval === 'ANNUAL' ? 'YEARLY' : p.billingInterval === 'QUARTERLY' ? 'QUARTERLY' : p.billingInterval === 'ONE_TIME' ? 'LIFETIME' : 'MONTHLY'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const updated = baseList.map((item, i) => i === idx ? { ...item, isActive: item.isActive === false ? true : false } : item);
                                setFormPolicy({ ...formPolicy, availablePlans: updated });
                              }}
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.625rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                backgroundColor: p.isActive !== false ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: p.isActive !== false ? '#34D399' : '#F87171',
                                border: p.isActive !== false ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(239, 68, 68, 0.5)'
                              }}
                            >
                              {p.isActive !== false ? '● ACTIVE' : '✕ DISABLED'}
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                              <label style={{ fontSize: '0.625rem', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '2px' }}>
                                {p.billingInterval === 'ANNUAL' ? 'Annual Fee (₹)' : p.billingInterval === 'QUARTERLY' ? 'Quarterly Fee (₹)' : p.billingInterval === 'ONE_TIME' ? 'One-Time License (₹)' : 'Monthly Fee (₹)'}
                              </label>
                              <input
                                type="number"
                                value={p.price}
                                onChange={(e) => {
                                  const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                  const updated = baseList.map((item, i) => i === idx ? { ...item, price: val } : item);
                                  setFormPolicy({ ...formPolicy, availablePlans: updated });
                                }}
                                style={{
                                  width: '100%',
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: '#0F172A',
                                  border: '1px solid rgba(56, 189, 248, 0.4)',
                                  color: '#38BDF8',
                                  fontSize: '0.8125rem',
                                  fontWeight: 800
                                }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: '0.625rem', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '2px' }}>
                                Billing Cadence / Interval
                              </label>
                              <select
                                value={p.billingInterval || 'MONTHLY'}
                                onChange={(e) => {
                                  const updated = baseList.map((item, i) => i === idx ? { ...item, billingInterval: e.target.value } : item);
                                  setFormPolicy({ ...formPolicy, availablePlans: updated });
                                }}
                                style={{
                                  width: '100%',
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: '#0F172A',
                                  border: '1px solid rgba(245, 158, 11, 0.4)',
                                  color: '#F59E0B',
                                  fontSize: '0.75rem',
                                  fontWeight: 700
                                }}
                              >
                                <option value="MONTHLY">Monthly (/mo)</option>
                                <option value="QUARTERLY">Quarterly (/quarter)</option>
                                <option value="ANNUAL">Annual (/yr)</option>
                                <option value="ONE_TIME">One-Time Perpetual</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: '0.625rem', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '2px' }}>
                              Badge / Tag
                            </label>
                            <input
                              type="text"
                              value={p.tag}
                              onChange={(e) => {
                                const updated = baseList.map((item, i) => i === idx ? { ...item, tag: e.target.value } : item);
                                setFormPolicy({ ...formPolicy, availablePlans: updated });
                              }}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                backgroundColor: '#0F172A',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#CBD5E1',
                                fontSize: '0.75rem'
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '0.625rem', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '2px' }}>
                              Description
                            </label>
                            <input
                              type="text"
                              value={p.description}
                              onChange={(e) => {
                                const updated = baseList.map((item, i) => i === idx ? { ...item, description: e.target.value } : item);
                                setFormPolicy({ ...formPolicy, availablePlans: updated });
                              }}
                              style={{
                                width: '100%',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                backgroundColor: '#0F172A',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                color: '#94A3B8',
                                fontSize: '0.6875rem'
                              }}
                            />
                          </div>

                          {p.features && p.features.length > 0 && (
                            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '6px' }}>
                              <div style={{ fontSize: '0.625rem', color: '#64748B', marginBottom: '3px', fontWeight: 700 }}>
                                INCLUDED CAPABILITIES ({p.features.length})
                              </div>
                              <div style={{ fontSize: '0.65625rem', color: '#CBD5E1', lineHeight: 1.3 }}>
                                {p.features.slice(0, 3).join(' • ')}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                })()}
              </div>
            </div>

            {/* Section 3: Field Mandatory vs Optional vs Hidden Matrix */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  3. Field Requirements & Visibility Matrix (HQ Policy Control)
                </label>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                  Configure what data applicants must provide vs what is optional or hidden.
                </span>
              </div>

              <div style={{
                backgroundColor: '#070C16',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                {[
                  { key: 'ownerAadhaar', label: 'Owner 12-Digit Aadhaar Card Number', desc: 'Government UIDAI compliance identifier' },
                  { key: 'aadhaarDocUpload', label: 'Owner Aadhaar Card File Upload (PDF/Image)', desc: 'Proof of identity document stream' },
                  { key: 'clinicalLicense', label: 'Clinical License / Medical Council / NABL Reg No.', desc: 'State regulatory establishment license number' },
                  { key: 'licenseDocUpload', label: 'License Registration Document Upload', desc: 'Certificate PDF or scan proof' },
                  { key: 'bedCapacity', label: 'Inpatient Bed Count / Capacity (Hospitals/Clinics)', desc: 'Determines bed capacity tier and scale' },
                  { key: 'gstinNumber', label: 'GSTIN / Commercial Tax ID Number', desc: 'Used for corporate tax invoicing' }
                ].map((row, idx) => {
                  const currentVal = formPolicy.fieldRules[row.key as keyof RegistrationFormFieldRules] as string;
                  return (
                    <div
                      key={row.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 16px',
                        borderBottom: idx < 5 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                        backgroundColor: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F8FAFC' }}>
                          {row.label}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                          {row.desc}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        {(['MANDATORY', 'OPTIONAL', 'HIDDEN'] as const).map((mode) => {
                          const isSelected = currentVal === mode;
                          return (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => {
                                setFormPolicy({
                                  ...formPolicy,
                                  fieldRules: {
                                    ...formPolicy.fieldRules,
                                    [row.key]: mode
                                  }
                                });
                              }}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '0.6875rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                backgroundColor: isSelected
                                  ? (mode === 'MANDATORY' ? '#EF4444' : mode === 'OPTIONAL' ? '#3B82F6' : '#64748B')
                                  : 'rgba(255, 255, 255, 0.06)',
                                color: isSelected ? '#FFFFFF' : '#94A3B8',
                                transition: 'all 0.12s ease'
                              }}
                            >
                              {mode === 'MANDATORY' ? '● MANDATORY' : mode === 'OPTIONAL' ? '○ OPTIONAL' : '✕ HIDDEN'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Password Setting Mode */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderTop: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F8FAFC' }}>
                      Account Password Creation on Registration
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                      Whether partner types their password immediately or receives auto-generated credentials on approval
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setFormPolicy({
                        ...formPolicy,
                        fieldRules: { ...formPolicy.fieldRules, passwordCreation: 'MANDATORY' }
                      })}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        backgroundColor: formPolicy.fieldRules.passwordCreation === 'MANDATORY' ? '#10B981' : 'rgba(255,255,255,0.06)',
                        color: formPolicy.fieldRules.passwordCreation === 'MANDATORY' ? '#070C16' : '#94A3B8'
                      }}
                    >
                      ● MANDATORY (Partner Sets Password)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPolicy({
                        ...formPolicy,
                        fieldRules: { ...formPolicy.fieldRules, passwordCreation: 'AUTO_GENERATE' }
                      })}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        backgroundColor: formPolicy.fieldRules.passwordCreation === 'AUTO_GENERATE' ? '#7C3AED' : 'rgba(255,255,255,0.06)',
                        color: formPolicy.fieldRules.passwordCreation === 'AUTO_GENERATE' ? '#FFFFFF' : '#94A3B8'
                      }}
                    >
                      ⚡ AUTO-GENERATE (Send Temporary Password)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Allowed Universal Facility Types */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                4. Allowed Healthcare Facility Categories for Self-Registration
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {[
                  { id: 'HOSPITAL', icon: '🏥', label: 'Hospital HIS' },
                  { id: 'CLINIC', icon: '🩺', label: 'Doctor Clinic' },
                  { id: 'PATHOLOGY', icon: '🔬', label: 'Pathology Lab' },
                  { id: 'PHARMACY', icon: '💊', label: 'Pharmacy POS' }
                ].map((fac) => {
                  const isAllowed = formPolicy.allowedFacilityTypes.includes(fac.id as any);
                  return (
                    <div
                      key={fac.id}
                      onClick={() => {
                        setFormPolicy({
                          ...formPolicy,
                          allowedFacilityTypes: isAllowed
                            ? formPolicy.allowedFacilityTypes.filter((t) => t !== fac.id)
                            : [...formPolicy.allowedFacilityTypes, fac.id as any]
                        });
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: isAllowed ? 'rgba(124, 58, 237, 0.15)' : '#070C16',
                        border: isAllowed ? '1.5px solid #7C3AED' : '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>{fac.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: isAllowed ? 800 : 500, color: isAllowed ? '#FFFFFF' : '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {fac.label}
                        </div>
                        <div style={{ fontSize: '0.625rem', color: isAllowed ? '#C084FC' : '#64748B' }}>
                          {isAllowed ? '✓ Allowed' : 'Disabled'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Announcement / Banner Text */}
            <div>
              <label style={{ display: 'block', fontSize: '0.71875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                5. Custom Form Announcement Banner Notice
              </label>
              <input
                type="text"
                value={formPolicy.bannerNotice}
                onChange={(e) => setFormPolicy({ ...formPolicy, bannerNotice: e.target.value })}
                placeholder="e.g. Pioneer Free Onboarding Environment (First 10,000 Partners Phase)..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#070C16',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#FFFFFF',
                  fontSize: '0.8125rem'
                }}
              />
            </div>

            {/* Modal Actions Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255,255,255,0.08)'
            }}>
              <button
                type="button"
                onClick={() => setIsPolicyModalOpen(false)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#CBD5E1',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleSavePolicy()}
                disabled={isSavingPolicy}
                style={{
                  padding: '12px 28px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '0.875rem',
                  cursor: isSavingPolicy ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)'
                }}
              >
                <span>{isSavingPolicy ? '⏳' : '💾'}</span>
                <span>{isSavingPolicy ? 'Publishing Policy...' : 'Save & Publish Registration Policy Globally'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
