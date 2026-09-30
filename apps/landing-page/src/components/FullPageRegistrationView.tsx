import React, { useState, useEffect } from 'react';
import { DocSearchLogo } from '@docsearch/ui-kit';
import {
  getPromotionalCampaign,
  fetchPromotionalCampaignRemote,
  calculateCampaignMetrics,
  type PromotionalCampaignConfig,
  type CampaignCalculatedMetrics
} from '@docsearch/shared-core';

export type HealthcareFacilityType = 'PATHOLOGY' | 'CLINIC' | 'PHARMACY' | 'HOSPITAL' | 'DIAGNOSTIC_CENTRE';

export interface ProfileModule {
  id: string;
  name: string;
  default: boolean;
}

export interface ProfilePlan {
  id: string;
  code: string;
  name: string;
  price: number;
  billingInterval: string;
  badge: string;
  description: string;
  recommended: boolean;
}

export interface HealthcareProfileConfig {
  id: HealthcareFacilityType;
  label: string;
  icon: string;
  badge: string;
  description: string;
  modules: ProfileModule[];
  plans: ProfilePlan[];
}

export const HEALTHCARE_PROFILE_PRESETS: Record<HealthcareFacilityType, HealthcareProfileConfig> = {
  HOSPITAL: {
    id: 'HOSPITAL',
    label: 'Multi-Specialty Hospital',
    icon: '🏥',
    badge: 'Inpatient Beds & OT',
    description: 'Inpatient ADT bed matrix, nursing flowsheets, OT surgical scheduling, ICU vitals, TPA cashless pre-auth & ABDM kiosk.',
    modules: [
      { id: 'hosp_adt_beds', name: 'IPD Admission-Discharge-Transfer (ADT) & Visual Bed Matrix', default: true },
      { id: 'hosp_ot_roster', name: 'Operation Theatre (OT) Surgical Rostering & PAC Clearance', default: true },
      { id: 'hosp_icu_flowsheets', name: 'ICU 24-Hour Digital Flowsheet & Critical Vitals Charting', default: true },
      { id: 'hosp_tpa_claims', name: 'TPA Cashless Pre-Auth & IRDAI NHCX FHIR Bridge (98% Approval)', default: true },
      { id: 'hosp_emergency_code_blue', name: 'Emergency & Code Blue Instant Audio-Visual Broadcast', default: true },
      { id: 'hosp_abdm_kiosk', name: 'ABDM 2.0 Scan & Share Fast OPD Token Kiosk', default: true },
      { id: 'hosp_mrd_icd10', name: 'MRD ICD-10 Medical Coding & Forensic MLC Registry', default: true },
      { id: 'hosp_blood_bank', name: 'Blood Bank Component Cross-Matching & PRBC Inventory', default: true }
    ],
    plans: [
      {
        id: 'hosp-free-yr1',
        code: 'HOSPITAL_FREE_YR1',
        name: 'Hospital Founding Partner (1st Year Free)',
        price: 0,
        billingInterval: 'ANNUAL',
        badge: '🎁 1st Year Free',
        description: '100% Free for 365 Days - Complete Multi-Specialty Hospital HIS: All departments & modules pre-selected and unlocked. Renews at ₹30,000/yr from Year 2.',
        recommended: true
      },
      {
        id: 'hosp-annual-yr2',
        code: 'HOSPITAL_ANNUAL_YR2',
        name: 'Multi-Specialty Hospital Annual Plan',
        price: 30000,
        billingInterval: 'ANNUAL',
        badge: '⭐ Year 2: ₹30,000/yr',
        description: 'All-inclusive Multi-Specialty HIS: Inpatient ADT Bed Matrix, OT Rostering, ICU Flowsheets, TPA IRDAI NHCX Cashless Bridge, ABDM Kiosk, MRD ICD-10 & Blood Bank.',
        recommended: false
      }
    ]
  },
  CLINIC: {
    id: 'CLINIC',
    label: 'Doctor OPD Clinic',
    icon: '🩺',
    badge: 'OPD EMR & AI Scribe',
    description: 'Ambient AI voice scribe, digital prescription pad with generic switcher, WhatsApp Rx dispatch & ABHA scan check-in.',
    modules: [
      { id: 'clinic_ai_scribe', name: 'Ambient AI Voice Scribe (Converts Doctor-Patient Speech into EMR)', default: true },
      { id: 'clinic_rx_pad', name: '1-Click Digital Prescription Pad with Brand Safety & Generics', default: true },
      { id: 'clinic_whatsapp_rx', name: 'WhatsApp High-Res PDF Prescription Dispatch to Patient', default: true },
      { id: 'clinic_abha_qr', name: 'ABHA 2.0 QR Scan & Share Instant OPD Check-in under 5 Seconds', default: true },
      { id: 'clinic_ddi_shield', name: 'Real-Time AI Drug-Drug Conflict Interception (DDI Shield)', default: true },
      { id: 'clinic_telemedicine', name: 'HD Video Tele-Consultation with Instant UPI Payment Link', default: false },
      { id: 'clinic_multi_doctor', name: 'Automated Multi-Doctor Consultation Room Rostering', default: false }
    ],
    plans: [
      {
        id: 'clinic-free-yr1',
        code: 'CLINIC_FREE_YR1',
        name: 'Clinic Founding Partner (1st Year Free)',
        price: 0,
        billingInterval: 'ANNUAL',
        badge: '🎁 1st Year Free',
        description: '100% Free for 365 Days - Patient token queue, digital prescription pad, ambient AI voice scribe, WhatsApp Rx & ABHA QR scan. Renews at ₹20,000/yr from Year 2.',
        recommended: true
      },
      {
        id: 'clinic-annual-yr2',
        code: 'CLINIC_ANNUAL_YR2',
        name: 'Doctor OPD Clinic Annual Plan',
        price: 20000,
        billingInterval: 'ANNUAL',
        badge: '⭐ Year 2: ₹20,000/yr',
        description: 'Full Doctor OPD Practice Suite: Ambient AI Clinical Voice Scribe, WhatsApp Rx Dispatch, Jan Aushadhi Generic Switcher, ABHA 2.0 QR Scan & DDI Conflict Shield.',
        recommended: false
      }
    ]
  },
  PATHOLOGY: {
    id: 'PATHOLOGY',
    label: 'Pathology Lab',
    icon: '🧪',
    badge: 'Diagnostic LIMS',
    description: 'Phlebotomy sample barcodes, bi-directional analyzer interfacing, NABL WhatsApp PDFs & doctor e-sign.',
    modules: [
      { id: 'barcoding', name: 'Phlebotomy Barcode Intake & Sample Tracking', default: true },
      { id: 'analyzer_sync', name: 'Bi-Directional Lab Machine / Analyzer Interface', default: true },
      { id: 'whatsapp_dispatch', name: 'WhatsApp NABL PDF Report Dispatch (Patient Direct)', default: true },
      { id: 'digital_sign', name: 'Pathologist Digital Signature on Lab Reports', default: true },
      { id: 'doctor_referral', name: 'Doctor Referral Commission Split & B2B Ledger', default: false },
      { id: 'home_collection', name: 'Home Sample Collection & Phlebotomist GPS Tracking', default: false }
    ],
    plans: [
      {
        id: 'path-free-yr1',
        code: 'PATHOLOGY_FREE_YR1',
        name: 'Pathology Founding Partner (1st Year Free)',
        price: 0,
        billingInterval: 'ANNUAL',
        badge: '🎁 1st Year Free',
        description: '100% Free for 365 Days - Phlebotomy sample barcodes, bi-directional analyzer sync, WhatsApp NABL reports & doctor e-sign. Renews at ₹10,000/yr from Year 2.',
        recommended: true
      },
      {
        id: 'path-annual-yr2',
        code: 'PATHOLOGY_ANNUAL_YR2',
        name: 'Pathology Lab LIMS Annual Plan',
        price: 10000,
        billingInterval: 'ANNUAL',
        badge: '⭐ Year 2: ₹10,000/yr',
        description: 'Full LIMS suite: Multi-collection centers, bi-directional analyzer sync, automated WhatsApp reports, doctor referral ledger & NABL logs.',
        recommended: false
      }
    ]
  },
  PHARMACY: {
    id: 'PHARMACY',
    label: 'Pharmacy & Chemist',
    icon: '💊',
    badge: 'Retail POS & Drug License',
    description: 'High-speed POS billing, batch/expiry radar, Jan Aushadhi generic switcher, Schedule H1 drug register & supplier inwarding.',
    modules: [
      { id: 'pharma_barcode_pos', name: 'High-Speed Barcode Billing & Thermal Receipt Print', default: true },
      { id: 'pharma_expiry_radar', name: 'Automated Batch & Expiry Radar (30/60/90 Days Alerts)', default: true },
      { id: 'pharma_generic_finder', name: 'Jan Aushadhi & PMBJP Generic Alternate Recommender', default: true },
      { id: 'pharma_schedule_h1', name: 'Schedule H & H1 Narcotics Digital Compliance Register', default: true },
      { id: 'pharma_whatsapp_refills', name: 'WhatsApp Invoice PDF & Patient Medication Refill Reminders', default: true },
      { id: 'pharma_supplier_orders', name: 'Supplier Purchase Orders & Automated GST Tax Inwarding', default: false },
      { id: 'pharma_abdm_erx', name: 'ABDM 2.0 e-Prescription QR Scan & Dispense', default: false }
    ],
    plans: [
      {
        id: 'pharma-free-yr1',
        code: 'PHARMACY_FREE_YR1',
        name: 'Pharmacy Founding Partner (1st Year Free)',
        price: 0,
        billingInterval: 'ANNUAL',
        badge: '🎁 1st Year Free',
        description: '100% Free for 365 Days - High-speed barcode POS, batch/expiry radar, Jan Aushadhi generic switcher & Schedule H1 narcotics register. Renews at ₹10,000/yr from Year 2.',
        recommended: true
      },
      {
        id: 'pharma-annual-yr2',
        code: 'PHARMACY_ANNUAL_YR2',
        name: 'Pharmacy & Chemist Annual Plan',
        price: 10000,
        billingInterval: 'ANNUAL',
        badge: '⭐ Year 2: ₹10,000/yr',
        description: 'Full Chemist POS suite: Automated batch/expiry radar, PMBJP generic switcher, supplier purchase inwarding, WhatsApp bills & Schedule H1 narcotics register.',
        recommended: false
      }
    ]
  },
  DIAGNOSTIC_CENTRE: {
    id: 'DIAGNOSTIC_CENTRE',
    label: 'Radiology & Imaging Centre',
    icon: '🩻',
    badge: 'DICOM PACS & Scans',
    description: 'Zero-footprint web DICOM viewer, speech-to-text reporting, WhatsApp scan links, AERB & PNDT compliance registers.',
    modules: [
      { id: 'radio_dicom_viewer', name: 'Zero-Footprint Web DICOM Viewer with 200+ Image Tools', default: true },
      { id: 'radio_speech_reporting', name: 'Radiologist Speech-to-Text Structured Voice Reporting', default: true },
      { id: 'radio_whatsapp_dicom', name: 'Secure WhatsApp Diagnostic Scan & DICOM Cloud Link for Patients', default: true },
      { id: 'radio_mwl_sync', name: 'Modality Worklist (MWL) & DICOM CT/MRI Machine Sync', default: true },
      { id: 'radio_aerb_pndt', name: 'AERB & PNDT Automated Regulatory Compliance Audit Registers', default: true },
      { id: 'radio_doctor_referral', name: 'Doctor Referral Commission Split & B2B Ledger', default: false },
      { id: 'radio_ai_cad', name: 'AI Computer-Aided Chest X-Ray Nodule Detection', default: false }
    ],
    plans: [
      {
        id: 'radio-free-yr1',
        code: 'RADIOLOGY_FREE_YR1',
        name: 'Radiology Founding Partner (1st Year Free)',
        price: 0,
        billingInterval: 'ANNUAL',
        badge: '🎁 1st Year Free',
        description: '100% Free for 365 Days - Zero-footprint web DICOM viewer, speech-to-text reporting & WhatsApp scan links. Renews at ₹20,000/yr from Year 2.',
        recommended: true
      },
      {
        id: 'radio-annual-yr2',
        code: 'RADIOLOGY_ANNUAL_YR2',
        name: 'Radiology & PACS Annual Plan',
        price: 20000,
        billingInterval: 'ANNUAL',
        badge: '⭐ Year 2: ₹20,000/yr',
        description: 'Complete Imaging suite: Cloud PACS, DICOM CT/MRI machine sync, speech-to-text structured reporting & WhatsApp scan links.',
        recommended: false
      }
    ]
  }
};

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

export interface RegistrationFormPolicy {
  showPlanSelection: boolean;
  showModuleSelection?: boolean;
  allowAdvancePayment: boolean;
  defaultPlanTier: string;
  bannerNotice: string;
  allowedFacilityTypes: HealthcareFacilityType[];
  fieldRules: RegistrationFormFieldRules;
}

export interface FullPageRegistrationViewProps {
  onBackToHome: () => void;
  onOpenLogin: () => void;
  partnerPortalUrl?: string;
  companyPortalUrl?: string;
}

export const FullPageRegistrationView: React.FC<FullPageRegistrationViewProps> = ({
  onBackToHome,
  onOpenLogin,
  partnerPortalUrl = ((import.meta as any)?.env?.VITE_PARTNER_URL as string) || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5173' : '/partner/')
}) => {
  // Campaign & Policy States
  const [campaign, setCampaign] = useState<PromotionalCampaignConfig>(getPromotionalCampaign());
  const [metrics, setMetrics] = useState<CampaignCalculatedMetrics>(calculateCampaignMetrics(campaign));
  const [formPolicy, setFormPolicy] = useState<RegistrationFormPolicy>({
    showPlanSelection: true,
    showModuleSelection: false,
    allowAdvancePayment: true,
    defaultPlanTier: 'EARLY_BIRD_FREE_LIFETIME',
    bannerNotice: '⚡ Verified ABDM & NABL Compliance Onboarding Desk',
    allowedFacilityTypes: ['HOSPITAL', 'CLINIC', 'PATHOLOGY', 'PHARMACY'],
    fieldRules: {
      ownerAadhaar: 'OPTIONAL',
      aadhaarDocUpload: 'HIDDEN',
      clinicalLicense: 'MANDATORY',
      licenseDocUpload: 'MANDATORY',
      gstinNumber: 'OPTIONAL',
      bedCapacity: 'OPTIONAL',
      mobileWhatsapp: 'MANDATORY',
      cityState: 'MANDATORY',
      passwordCreation: 'MANDATORY'
    }
  });

  // Sync campaign & policy from backend API
  useEffect(() => {
    let mounted = true;
    const syncData = async () => {
      try {
        const promo = await fetchPromotionalCampaignRemote();
        if (mounted) {
          setCampaign(promo);
          setMetrics(calculateCampaignMetrics(promo));
        }
      } catch {}

      try {
        const res = await fetch('/api/v1/auth/registration-form-config');
        if (res.ok) {
          const json = await res.json();
          if (mounted && json.success && json.data) {
            setFormPolicy(json.data);
          }
        }
      } catch {}
    };

    syncData();
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncData();
      }
    }, 60000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  // Form Field States
  // Profile Pre-Template States (Departments, Modules & 2-Plan Template)
  const [category, setCategory] = useState<HealthcareFacilityType>('CLINIC');
  const initialPreset = HEALTHCARE_PROFILE_PRESETS.CLINIC;
  const [selectedModules, setSelectedModules] = useState<string[]>(
    initialPreset.modules.filter((m) => m.default).map((m) => m.name)
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPreset.plans[0]?.id || 'clinic-free-yr1');

  const currentPreset = HEALTHCARE_PROFILE_PRESETS[category] || HEALTHCARE_PROFILE_PRESETS.CLINIC;
  const currentPlan: ProfilePlan = (currentPreset.plans.find((p) => p.id === selectedPlanId) || currentPreset.plans[0])!;

  const handleCategorySelect = (cat: HealthcareFacilityType) => {
    setCategory(cat);
    const preset = HEALTHCARE_PROFILE_PRESETS[cat];
    if (preset) {
      // MULTI-SPECIALTY HOSPITAL: All 8 departments & modules PRE-SELECTED by default!
      const defaultMods = cat === 'HOSPITAL'
        ? preset.modules.map((m) => m.name)
        : preset.modules.filter((m) => m.default).map((m) => m.name);
      setSelectedModules(defaultMods);
      setSelectedPlanId(preset.plans[0]?.id || 'plan-free');
    }
  };

  const toggleModule = (modName: string) => {
    setSelectedModules((prev) =>
      prev.includes(modName) ? prev.filter((m) => m !== modName) : [...prev, modName]
    );
  };

  const [facilityName, setFacilityName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ownerAadhaar, setOwnerAadhaar] = useState('');
  const [aadhaarDocName, setAadhaarDocName] = useState('');
  const [aadhaarDocData, setAadhaarDocData] = useState('');
  const [clinicalLicense, setClinicalLicense] = useState('');
  const [licenseDocName, setLicenseDocName] = useState('');
  const [licenseDocData, setLicenseDocData] = useState('');
  const [gstin, setGstin] = useState('');
  const [bedCapacity, setBedCapacity] = useState('20');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Status & Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<any | null>(null);

  // File Handlers
  const handleAadhaarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAadhaarDocName(file.name);
    const reader = new FileReader();
    reader.onload = () => setAadhaarDocData(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLicenseDocName(file.name);
    const reader = new FileReader();
    reader.onload = () => setLicenseDocData(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic Validations
    if (!facilityName.trim()) {
      setErrorMessage('Please enter your Hospital / Clinic / Lab / Pharmacy facility name.');
      return;
    }
    if (!ownerName.trim()) {
      setErrorMessage('Please enter the primary Doctor / Owner / Administrator name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid official healthcare email address.');
      return;
    }
    if (formPolicy.fieldRules.mobileWhatsapp === 'MANDATORY') {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10) {
        setErrorMessage('A valid 10-digit Mobile / WhatsApp number is mandatory.');
        return;
      }
    }

    // Password validation if mandatory
    let finalPassword = password;
    if (formPolicy.fieldRules.passwordCreation === 'MANDATORY') {
      if (!password || password.length < 6) {
        setErrorMessage('Please create a secure password of at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Password and Confirm Password do not match.');
        return;
      }
    } else {
      if (!finalPassword) {
        finalPassword = `DocSearch@${Math.floor(100000 + Math.random() * 900000)}`;
      }
    }

    // Mobile Number Validation
    if (phone.trim() && (phone.trim().length !== 10 || !/^[6-9]/.test(phone.trim()))) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).');
      return;
    }
    if (formPolicy.fieldRules.mobileWhatsapp === 'MANDATORY' && !phone.trim()) {
      setErrorMessage('Mobile / WhatsApp Number is mandatory under current HQ registration policy.');
      return;
    }

    // License Validation
    if (formPolicy.fieldRules.clinicalLicense === 'MANDATORY' && !clinicalLicense.trim()) {
      setErrorMessage('Clinical Registration / State Medical Council / Drug License number is mandatory.');
      return;
    }
    if (formPolicy.fieldRules.licenseDocUpload === 'MANDATORY' && !licenseDocName) {
      setErrorMessage('Please upload a copy of your Clinical / Drug License certificate.');
      return;
    }

    // Aadhaar Validation
    const cleanAadhaar = ownerAadhaar.replace(/[^0-9]/g, '');
    if (formPolicy.fieldRules.ownerAadhaar === 'MANDATORY') {
      if (!cleanAadhaar || cleanAadhaar.length !== 12) {
        setErrorMessage('12-digit Owner Aadhaar Card number is required for official verification.');
        return;
      }
    }
    if (formPolicy.fieldRules.aadhaarDocUpload === 'MANDATORY' && !aadhaarDocName) {
      setErrorMessage('Please upload your Aadhaar Card document copy.');
      return;
    }

    // City / State Validation
    if (formPolicy.fieldRules.cityState === 'MANDATORY' && !city.trim()) {
      setErrorMessage('Please provide your operational City.');
      return;
    }

    if (!termsAccepted) {
      setErrorMessage('Please accept the Terms of Service & Privacy Policy.');
      return;
    }

    setIsSubmitting(true);

    try {
      const partnerId = `DS-PARTNER-${Math.floor(1000 + Math.random() * 9000)}`;
      const isFree = currentPlan.price === 0;
      const requestedPlan = {
        id: currentPlan.id,
        code: currentPlan.code,
        tier: isFree ? 'FOUNDING' : 'ANNUAL',
        planName: currentPlan.name,
        name: currentPlan.name,
        price: currentPlan.price,
        monthlyFee: isFree ? 0 : Math.round(currentPlan.price / 12),
        billingInterval: currentPlan.billingInterval || 'ANNUAL',
        billingFrequency: currentPlan.billingInterval || 'ANNUAL',
        durationDays: 365,
        isFree,
        features: selectedModules,
        requestedAt: new Date().toISOString()
      };

      const newPartner = {
        id: partnerId,
        name: ownerName.trim(),
        email: email.trim().toLowerCase(),
        password: finalPassword,
        phone: phone.trim(),
        facilityName: facilityName.trim(),
        category,
        tier: currentPlan.code,
        planName: currentPlan.name,
        monthlyFee: currentPlan.price,
        requestedPlan,
        accessibleFeatures: selectedModules,
        features: selectedModules,
        clinicalLicense: clinicalLicense.trim(),
        licenseDocFileName: licenseDocName || undefined,
        licenseDocDataUrl: licenseDocData || undefined,
        aadhaarNumber: cleanAadhaar || undefined,
        aadhaarDocFileName: aadhaarDocName || undefined,
        aadhaarDocDataUrl: aadhaarDocData || undefined,
        gstinNumber: gstin.trim() || undefined,
        bedCapacity: category === 'HOSPITAL' ? parseInt(bedCapacity, 10) || 20 : undefined,
        city: city.trim(),
        state,
        referralCode: `DOC-REF-${Math.floor(100000 + Math.random() * 900000)}`,
        registeredAt: new Date().toISOString(),
        status: 'PENDING_APPROVAL',
        kycStatus: 'PENDING_ADMIN_VERIFICATION'
      };

      // Persist to backend and queue in Company HQ Verification Queue
      try {
        const verificationItem = {
          id: `KYC-${newPartner.id}`,
          partnerId: newPartner.id,
          partnerName: newPartner.facilityName,
          partnerType: newPartner.category,
          tenantSlug: newPartner.facilityName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          facilityName: newPartner.facilityName,
          category: newPartner.category,
          submittedBy: newPartner.name,
          submittedAt: new Date().toISOString(),
          status: 'PENDING_APPROVAL',
          requestedPlan,
          details: {
            'Facility Name': newPartner.facilityName,
            'Owner / Prop': newPartner.name,
            'Owner Aadhaar Number': cleanAadhaar ? `XXXX-XXXX-${cleanAadhaar.slice(-4)}` : 'Not Provided / Hidden',
            'Registered Email': newPartner.email,
            'Contact Phone': newPartner.phone || 'N/A',
            'Facility License': newPartner.clinicalLicense || 'N/A',
            'City & State': `${newPartner.city}, ${newPartner.state}`,
            'Requested Plan': `${requestedPlan.planName} (${isFree ? '₹0 / 365 Days Free' : `₹${requestedPlan.price.toLocaleString('en-IN')}/yr`})`,
            'Onboarding Tier': currentPlan.name,
            'Plan Fee': isFree ? '₹0 (1st Year Free Pioneer Offer)' : `₹${currentPlan.price.toLocaleString('en-IN')}/yr`,
            'Granted Modules': `${selectedModules.length} Modules: ${selectedModules.join(', ')}`
          },
          documents: [
            ...(licenseDocName ? [{
              documentId: `doc-lic-${newPartner.id}`,
              documentName: licenseDocName,
              documentType: 'Clinical / Drug License Proof',
              dataUrl: licenseDocData || undefined,
              documentDataUrl: licenseDocData || undefined
            }] : []),
            ...(aadhaarDocName ? [{
              documentId: `doc-adh-${newPartner.id}`,
              documentName: aadhaarDocName,
              documentType: 'Owner Government Aadhaar Card (KYC)',
              dataUrl: aadhaarDocData || undefined,
              documentDataUrl: aadhaarDocData || undefined
            }] : [])
          ]
        };

        const apiBase = ((import.meta as any)?.env?.VITE_API_URL as string) || '';
        const regEndpoint = `${apiBase}/api/v1/auth/self-register`;
        const res = await fetch(regEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partner: newPartner,
            verificationItem
          })
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          throw new Error(
            errBody?.error?.message || errBody?.message || `Backend self-registration failed (HTTP ${res.status})`
          );
        }
        const resJson = await res.json();
        console.info('[Self-Registration] Staged partner lead saved to PostgreSQL:', resJson);

        // Save sanitized metadata to local storage ONLY after authoritative backend acceptance
        try {
          const raw = localStorage.getItem('docsearch_registered_partners');
          const list = raw ? JSON.parse(raw) : [];
          const { password: _redactedPassword, ...sanitizedPartner } = newPartner;
          list.push(sanitizedPartner);
          localStorage.setItem('docsearch_registered_partners', JSON.stringify(list));
        } catch {}
      } catch (networkErr: any) {
        if ((import.meta as any)?.env?.VITE_ENABLE_MOCK_FALLBACK !== 'true') {
          throw networkErr;
        }
        console.warn('[Self-Registration] Network sync notice (localStorage fallback active):', networkErr);
      }

      const { password: _omitPassword, ...safeRegistrationResult } = newPartner;
      setRegistrationSuccess(safeRegistrationResult as any);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to complete registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOfferActive = campaign.status === 'ACTIVE' && !metrics.isExpired && !metrics.isLocked;

  // Render Success Screen
  if (registrationSuccess) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0A0F1D',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}
      >
        <div
          style={{
            maxWidth: '680px',
            width: '100%',
            backgroundColor: '#0F172A',
            border: '2px solid #10B981',
            borderRadius: '24px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 25px 60px rgba(16, 185, 129, 0.25)'
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid #10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              margin: '0 auto 24px'
            }}
          >
            🎉
          </div>

          <span
            style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: '999px',
              backgroundColor: '#065F46',
              color: '#A7F3D0',
              fontWeight: 800,
              fontSize: '0.8125rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '16px'
            }}
          >
            VIP Founder Grant Activated
          </span>

          <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: '0 0 12px' }}>
            Congratulations, {registrationSuccess.name}!
          </h1>
          <p style={{ fontSize: '1.0625rem', color: '#CBD5E1', margin: '0 0 28px', lineHeight: 1.5 }}>
            Your healthcare facility <strong>{registrationSuccess.facilityName}</strong> has been successfully registered under the
            <strong style={{ color: '#34D399' }}> Limited-Time ₹0 Early-Bird Allocation (Free for Now — Locked In Before Standard Pricing Rolls Out)</strong>.
          </p>

          <div
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'left',
              marginBottom: '28px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Facility Category</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                {registrationSuccess.category}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Registered Email</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
                {registrationSuccess.email}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Plan & Fee</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 900, color: '#34D399', marginTop: '2px' }}>
                {registrationSuccess.planName} (₹{registrationSuccess.monthlyFee.toLocaleString('en-IN')})
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Accessible Modules</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>
                🟢 {registrationSuccess.features?.length || 0} Modules Activated
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Your Referral Code</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>
                {registrationSuccess.referralCode}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <a
              href={`${partnerPortalUrl}?token=${registrationSuccess.id}&auth=${encodeURIComponent(JSON.stringify(registrationSuccess))}`}
              style={{
                padding: '14px 32px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#FFFFFF',
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>🏥 Launch Partner Workspace Now</span>
              <span>➔</span>
            </a>

            <button
              type="button"
              onClick={onBackToHome}
              style={{
                padding: '14px 24px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#CBD5E1',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0A0F1D',
        color: '#F8FAFC',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* 1. TOP NAVIGATION HEADER */}
      <header
        style={{
          height: '70px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            type="button"
            onClick={onBackToHome}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#CBD5E1',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>←</span>
            <span>Back to Home</span>
          </button>

          <DocSearchLogo
            variant="compact"
            size="md"
            badgeText="ONBOARDING DESK"
            redirectUrl="/"
            onClick={onBackToHome}
          />
        </div>

        {/* Compliance & Sign-in Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#94A3B8' }}>
            <span>🛡️ ABDM M1-M3 Certified</span>
            <span>•</span>
            <span>🔒 256-Bit SSL Encrypted</span>
          </div>

          <button
            type="button"
            onClick={onOpenLogin}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: '#60A5FA',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer'
            }}
          >
            Already Registered? Sign In ➔
          </button>
        </div>
      </header>

      {/* 2. MAIN 2-COLUMN FULL-PAGE WORKSPACE */}
      <main
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(360px, 480px) 1fr',
          minHeight: 'calc(100vh - 70px)',
          maxWidth: '1600px',
          width: '100%',
          margin: '0 auto'
        }}
      >
        {/* LEFT COLUMN: HIGHLIGHTED LAUNCH OFFER & REFERRAL PROGRAM SHOWCASE */}
        <aside
          style={{
            backgroundColor: '#0F172A',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '36px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            overflowY: 'auto'
          }}
        >
          {/* Highlighted Launch Offer Showcase Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
              border: '2px solid rgba(16, 185, 129, 0.45)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#065F46',
                  color: '#A7F3D0',
                  fontSize: '0.6875rem',
                  fontWeight: 900,
                  padding: '3px 8px',
                  borderRadius: '999px',
                  textTransform: 'uppercase'
                }}
              >
                ● {isOfferActive ? 'Active Launch Grant' : 'Special Standard Grant'}
              </span>

              <span
                style={{
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '0.6875rem',
                  fontWeight: 900,
                  padding: '3px 8px',
                  borderRadius: '999px'
                }}
              >
                100% OFF (Code: LAUNCH100)
              </span>
            </div>

            <h2 style={{ fontSize: '1.375rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 6px' }}>
              VIP Early-Adopter ₹0 Launch License (Free for Now — Limited Early Window)
            </h2>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: '#34D399' }}>₹0</span>
              <span style={{ fontSize: '1rem', color: '#94A3B8' }}>/ Month Launch Tier (Free for Now)</span>
              <s style={{ fontSize: '0.9375rem', color: '#EF4444', marginLeft: '4px' }}>₹4,999/mo standard</s>
            </div>

            {/* Urgency Progress Bar */}
            <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                <span style={{ color: '#CBD5E1', fontWeight: 700 }}>Free Founder Allocations:</span>
                <span style={{ color: '#34D399', fontWeight: 900 }}>
                  {metrics.claimedCount} / {campaign.targetSeats} Claimed ({metrics.percentageClaimed}%)
                </span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${metrics.percentageClaimed}%`,
                    background: 'linear-gradient(90deg, #10B981, #38BDF8)',
                    borderRadius: '999px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem' }}>
                <span style={{ color: '#F87171', fontWeight: 700 }}>⚠️ Only {metrics.remainingSeats} Seats Left</span>
                <span style={{ color: '#F59E0B', fontWeight: 800 }}>
                  ⏳ Closes in {metrics.daysLeft}d {metrics.hoursLeft}h
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.8125rem', color: '#CBD5E1', margin: 0, lineHeight: 1.4 }}>
              Register your hospital, clinic, lab or pharmacy today to permanently lock in ₹0 software fees for life!
            </p>
          </div>

          {/* Highlighted Partner Referral Bounty Card */}
          <div
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
              border: '1.5px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '20px',
              padding: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '1.5rem' }}>💰</span>
              <div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#FCD34D', margin: 0 }}>
                  Partner Referral Bounty Program
                </h3>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Direct Bank Transfer Payouts</span>
              </div>
            </div>

            <p style={{ fontSize: '0.8125rem', color: '#CBD5E1', margin: '0 0 14px', lineHeight: 1.4 }}>
              Once registered, share your invite code with fellow healthcare facilities across India and earn:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🩺</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#E2E8F0' }}>Refer Doctor / Clinic</span>
                </div>
                <span style={{ fontSize: '0.9375rem', fontWeight: 900, color: '#38BDF8' }}>₹10,000</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(168, 85, 247, 0.3)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🔬</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#E2E8F0' }}>Refer Pathology Lab</span>
                </div>
                <span style={{ fontSize: '0.9375rem', fontWeight: 900, color: '#C084FC' }}>₹5,000</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>💊</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#E2E8F0' }}>Refer Pharmacy / Store</span>
                </div>
                <span style={{ fontSize: '0.9375rem', fontWeight: 900, color: '#34D399' }}>₹5,000</span>
              </div>
            </div>

            <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontStyle: 'italic', lineHeight: 1.3 }}>
              * Terms & Conditions apply: Payouts credited after referral verification & 30 days active usage.
            </div>
          </div>

          {/* Included Features List */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '20px'
            }}
          >
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '12px' }}>
              ✨ What&apos;s Included In Free Setup:
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8125rem', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Complete OPD Chamber & AI Voice Scribe</li>
              <li>LIS Auto-Analyzer Bidirectional Interfacing</li>
              <li>FEFO Pharmacy POS with Scheduled Drug Registers</li>
              <li>ABDM M1, M2 & M3 National Health Stack</li>
              <li>Unlimited Patient Records & Digital Prescriptions</li>
              <li>Free Cloud Backups & Dedicated Onboarding RM</li>
            </ul>
          </div>
        </aside>

        {/* RIGHT COLUMN: FULL-PAGE REGISTRATION FORM */}
        <section
          style={{
            padding: '36px 48px',
            overflowY: 'auto'
          }}
        >
          <div style={{ maxWidth: '840px', margin: '0 auto' }}>
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0 0 6px', color: '#FFFFFF' }}>
                Universal Healthcare Facility Registration
              </h1>
              <p style={{ fontSize: '0.9375rem', color: '#94A3B8', margin: 0 }}>
                Fill in your clinical credentials below to claim your ₹0 VIP Early-Bird seat.
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1.5px solid #EF4444',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  color: '#FCA5A5',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Step 1: Select Facility Category */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800, color: '#E2E8F0', marginBottom: '10px' }}>
                  1. Select Facility Category <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '10px'
                  }}
                >
                  {[
                    { id: 'HOSPITAL', label: 'Hospital HIS', icon: '🏥' },
                    { id: 'CLINIC', label: 'Doctor Clinic / OPD', icon: '🩺' },
                    { id: 'PATHOLOGY', label: 'Pathology Lab / LIS', icon: '🔬' },
                    { id: 'PHARMACY', label: 'Pharmacy / Chemist', icon: '💊' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat.id as HealthcareFacilityType)}
                      style={{
                        padding: '14px 12px',
                        borderRadius: '12px',
                        border: category === cat.id ? '2px solid #10B981' : '1px solid rgba(255, 255, 255, 0.12)',
                        backgroundColor: category === cat.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                        color: category === cat.id ? '#6EE7B7' : '#94A3B8',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 800,
                        fontSize: '0.8125rem'
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Choose Subscription Plan (2-Plan Template: 1st Year Free vs Year 2 Renewal) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 800, color: '#E2E8F0', margin: 0 }}>
                    2. Choose Subscription Plan Tier <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <span style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 700 }}>
                    🎁 1st Year 100% Free for All Profiles
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  {currentPreset.plans.map((p) => {
                    const isSelected = selectedPlanId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlanId(p.id)}
                        style={{
                          backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(30, 41, 59, 0.6)',
                          border: isSelected ? '2px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '14px',
                          padding: '16px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: p.price === 0 ? '#065F46' : 'rgba(56, 189, 248, 0.2)',
                            color: p.price === 0 ? '#A7F3D0' : '#38BDF8'
                          }}>
                            {p.badge}
                          </span>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            color: isSelected ? '#10B981' : '#64748B'
                          }}>
                            {isSelected ? '✓ Selected' : 'Select'}
                          </span>
                        </div>

                        <div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
                            {p.name}
                          </div>
                          <p style={{ fontSize: '0.78125rem', color: '#94A3B8', margin: '4px 0 0', lineHeight: 1.35 }}>
                            {p.description}
                          </p>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: p.price === 0 ? '#34D399' : '#FCD34D' }}>
                            ₹{p.price.toLocaleString('en-IN')}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                            {p.price === 0 ? '/ 1st Year (Free)' : '/ Year (from Year 2)'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Profile-Specific Departments & Accessible Modules (Pre-Template, controlled dynamically by HQ) */}
              {formPolicy.showModuleSelection && (
                <div style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label style={{ fontSize: '0.875rem', color: '#CBD5E1', fontWeight: 800, margin: 0 }}>
                        3. {currentPreset.label.toUpperCase()} DEPARTMENTS & ACCESSIBLE MODULES:
                      </label>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34D399', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        🟢 {selectedModules.length} Granted
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F87171', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        🔴 {currentPreset.modules.length - selectedModules.length} Locked
                      </span>
                    </div>

                    {/* Quick Actions */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedModules(currentPreset.modules.map((m) => m.name))}
                        style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38BDF8', color: '#38BDF8', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        ✓ Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedModules(
                          category === 'HOSPITAL'
                            ? currentPreset.modules.map((m) => m.name)
                            : currentPreset.modules.filter((m) => m.default).map((m) => m.name)
                        )}
                        style={{ backgroundColor: '#1E293B', border: '1px solid #475569', color: '#CBD5E1', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        ⚡ Default Essentials
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedModules([])}
                        style={{ backgroundColor: '#1E293B', border: '1px solid #475569', color: '#94A3B8', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        🔒 Lock All
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                    {currentPreset.modules.map((mod) => {
                      const isChecked = selectedModules.includes(mod.name);
                      return (
                        <div
                          key={mod.id}
                          onClick={() => toggleModule(mod.name)}
                          style={{
                            backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                            border: isChecked ? '1.5px solid #10B981' : '1px solid #334155',
                            borderRadius: '10px',
                            padding: '12px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.12s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              style={{ width: '18px', height: '18px', accentColor: '#10B981', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: isChecked ? '#F8FAFC' : '#94A3B8' }}>
                              {mod.name}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              color: isChecked ? '#34D399' : '#F87171'
                            }}
                          >
                            {isChecked ? 'ACTIVE' : 'LOCKED'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 4: Facility & Owner Identity */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px'
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                    Facility / Hospital Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={facilityName}
                    onChange={(e) => setFacilityName(e.target.value)}
                    placeholder="e.g. LifeCare Multispecialty Hospital"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                    Chief Doctor / Owner / Admin Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Kumar, MD"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              {/* Step 5: Contact Details (Email & Phone) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px'
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                    Official Email Address <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@lifecare.com"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                    Mobile / WhatsApp Number (10-Digit Mobile) {formPolicy.fieldRules.mobileWhatsapp === 'MANDATORY' && <span style={{ color: '#EF4444' }}>*</span>}
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '14px', color: '#38BDF8', fontWeight: 800, fontSize: '0.9rem' }}>+91</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      required={formPolicy.fieldRules.mobileWhatsapp === 'MANDATORY'}
                      value={phone}
                      onChange={(e) => {
                        let digits = e.target.value.replace(/\D/g, '');
                        if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
                        else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
                        setPhone(digits.slice(0, 10));
                      }}
                      placeholder="98765 43210"
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 52px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Step 6: Password Creation (If Mandatory) */}
              {formPolicy.fieldRules.passwordCreation === 'MANDATORY' ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '16px'
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                      Create Secure Password <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                      Confirm Password <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    fontSize: '0.8125rem',
                    color: '#93C5FD'
                  }}
                >
                  ℹ️ Auto-Generate Credentials Active: A secure password and instant login link will be generated automatically.
                </div>
              )}

              {/* Step 7: Regulatory Licenses & Certifications (Dynamic HQ Policy) */}
              <div
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#E2E8F0' }}>
                  7. Regulatory Licensure & KYC Verification
                </div>

                {/* Clinical License Number & Upload */}
                {formPolicy.fieldRules.clinicalLicense !== 'HIDDEN' && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '16px'
                    }}
                  >
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                        Clinical / Medical Council / Drug License Number {formPolicy.fieldRules.clinicalLicense === 'MANDATORY' && <span style={{ color: '#EF4444' }}>*</span>}
                      </label>
                      <input
                        type="text"
                        required={formPolicy.fieldRules.clinicalLicense === 'MANDATORY'}
                        value={clinicalLicense}
                        onChange={(e) => setClinicalLicense(e.target.value)}
                        placeholder="e.g. MH/2026/DOC/4891"
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#FFFFFF',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    {formPolicy.fieldRules.licenseDocUpload !== 'HIDDEN' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                          Upload License Certificate {formPolicy.fieldRules.licenseDocUpload === 'MANDATORY' && <span style={{ color: '#EF4444' }}>*</span>}
                        </label>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          required={formPolicy.fieldRules.licenseDocUpload === 'MANDATORY'}
                          onChange={handleLicenseUpload}
                          style={{
                            width: '100%',
                            padding: '9px 14px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#94A3B8',
                            fontSize: '0.8125rem'
                          }}
                        />
                        {licenseDocName && (
                          <span style={{ fontSize: '0.75rem', color: '#34D399', marginTop: '4px', display: 'block' }}>
                            ✓ Attached: {licenseDocName}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Owner Aadhaar Number & Upload */}
                {formPolicy.fieldRules.ownerAadhaar !== 'HIDDEN' && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '16px'
                    }}
                  >
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                        Owner Aadhaar Card (12 Digits) {formPolicy.fieldRules.ownerAadhaar === 'MANDATORY' && <span style={{ color: '#EF4444' }}>*</span>}
                      </label>
                      <input
                        type="text"
                        maxLength={12}
                        required={formPolicy.fieldRules.ownerAadhaar === 'MANDATORY'}
                        value={ownerAadhaar}
                        onChange={(e) => setOwnerAadhaar(e.target.value)}
                        placeholder="XXXX XXXX 1234"
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#FFFFFF',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    {formPolicy.fieldRules.aadhaarDocUpload !== 'HIDDEN' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                          Upload Aadhaar Copy {formPolicy.fieldRules.aadhaarDocUpload === 'MANDATORY' && <span style={{ color: '#EF4444' }}>*</span>}
                        </label>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          required={formPolicy.fieldRules.aadhaarDocUpload === 'MANDATORY'}
                          onChange={handleAadhaarUpload}
                          style={{
                            width: '100%',
                            padding: '9px 14px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#94A3B8',
                            fontSize: '0.8125rem'
                          }}
                        />
                        {aadhaarDocName && (
                          <span style={{ fontSize: '0.75rem', color: '#34D399', marginTop: '4px', display: 'block' }}>
                            ✓ Attached: {aadhaarDocName}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* GSTIN & Bed Capacity */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '16px'
                  }}
                >
                  {formPolicy.fieldRules.gstinNumber !== 'HIDDEN' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                        GSTIN / Tax ID {formPolicy.fieldRules.gstinNumber === 'MANDATORY' && <span style={{ color: '#EF4444' }}>*</span>}
                      </label>
                      <input
                        type="text"
                        required={formPolicy.fieldRules.gstinNumber === 'MANDATORY'}
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value)}
                        placeholder="27AAAAA0000A1Z5"
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#FFFFFF',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                  )}

                  {category === 'HOSPITAL' && formPolicy.fieldRules.bedCapacity !== 'HIDDEN' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                        Operational Bed Capacity {formPolicy.fieldRules.bedCapacity === 'MANDATORY' && <span style={{ color: '#EF4444' }}>*</span>}
                      </label>
                      <input
                        type="number"
                        min={1}
                        required={formPolicy.fieldRules.bedCapacity === 'MANDATORY'}
                        value={bedCapacity}
                        onChange={(e) => setBedCapacity(e.target.value)}
                        placeholder="e.g. 50"
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#FFFFFF',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Step 6: Operational Location */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px'
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                    City {formPolicy.fieldRules.cityState === 'MANDATORY' && <span style={{ color: '#EF4444' }}>*</span>}
                  </label>
                  <input
                    type="text"
                    required={formPolicy.fieldRules.cityState === 'MANDATORY'}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai, Pune, Delhi"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                    State / UT
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#0F172A',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: '0.875rem'
                    }}
                  >
                    {['Maharashtra', 'Delhi', 'Karnataka', 'Gujarat', 'Tamil Nadu', 'Uttar Pradesh', 'Rajasthan', 'Telangana', 'West Bengal', 'Kerala', 'Other State'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="terms-check"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  style={{ marginTop: '3px' }}
                />
                <label htmlFor="terms-check" style={{ fontSize: '0.8125rem', color: '#94A3B8', lineHeight: 1.4 }}>
                  I certify that I am the authorized representative of this healthcare facility. I agree to the{' '}
                  <span style={{ color: '#38BDF8', textDecoration: 'underline' }}>Terms of Service</span>,{' '}
                  <span style={{ color: '#38BDF8', textDecoration: 'underline' }}>Privacy Policy</span>, and{' '}
                  <span style={{ color: '#38BDF8', textDecoration: 'underline' }}>Partner Referral Code of Conduct</span>.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '18px',
                  borderRadius: '14px',
                  border: 'none',
                  background: isSubmitting
                    ? '#64748B'
                    : 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)',
                  color: '#FFFFFF',
                  fontSize: '1.125rem',
                  fontWeight: 900,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 10px 30px rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.15s ease'
                }}
              >
                {isSubmitting ? (
                  <span>⏳ Provisioning Healthcare Workspace...</span>
                ) : (
                  <>
                    <span>🚀 Complete Registration & Claim ₹0 VIP Allocation</span>
                    <span style={{ fontSize: '1.25rem' }}>➔</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};
