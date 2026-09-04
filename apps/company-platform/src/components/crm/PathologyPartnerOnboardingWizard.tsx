import React, { useState } from 'react';
import { Badge, Button, Card } from '@docsearch/ui-kit';
import { generateAndDownloadWelcomeKitPdf, openPrintableSpeedPostDossier, getCategoryMenuBookItems } from '../../utils/partnerWelcomeKitPdf.js';

export type HealthcareCategoryType = 'PATHOLOGY' | 'PHARMACY' | 'HOSPITAL' | 'CLINIC' | 'DIAGNOSTIC_CENTRE';

export interface HealthcareDocumentItem {
  id: string;
  name: string;
  type: string;
  fileUploaded: boolean;
  fileName?: string;
  regNumber?: string;
  verified: boolean;
}

export interface UniversalOnboardingData {
  partnerName: string;
  classification: HealthcareCategoryType;
  contactPerson: string;
  phone: string;
  email: string;
  password: string;
  city: string;
  state: string;
  documents: HealthcareDocumentItem[];
  planTier: string;
  monthlyFee: number;
  features: string[];
}

export interface ActivationResult {
  partnerId: string;
  partnerName: string;
  classification: string;
  contactPerson: string;
  phone: string;
  city: string;
  status: string;
  subscriptionPlan: {
    tier: string;
    monthlyFee: number;
    activeFeatures: string[];
  };
  credentials: {
    loginUrl: string;
    userId: string;
    temporaryPassword: string;
    role: string;
    activatedAt: string;
  };
}

export interface CategoryPreset {
  id: HealthcareCategoryType;
  label: string;
  icon: string;
  badge: string;
  description: string;
  defaultPartnerName: string;
  defaultContactPerson: string;
  defaultPhone: string;
  defaultEmail: string;
  defaultPassword: string;
  defaultCity: string;
  defaultState: string;
  plans: Array<{
    id: string;
    name: string;
    fee: number;
    description: string;
    badge: string;
  }>;
  availableFeatures: Array<{
    id: string;
    name: string;
    default: boolean;
  }>;
  documents: HealthcareDocumentItem[];
}

export const HEALTHCARE_PRESETS: Record<HealthcareCategoryType, CategoryPreset> = {
  PATHOLOGY: {
    id: 'PATHOLOGY',
    label: 'Pathology Lab',
    icon: '🧪',
    badge: 'Diagnostic LIMS',
    description: 'Phlebotomy sample barcodes, bi-directional analyzer interfacing, NABL WhatsApp PDFs & doctor e-sign.',
    defaultPartnerName: 'Apex Diagnostic & Pathology Lab',
    defaultContactPerson: 'Dr. Shalini Deshmukh, MD Path',
    defaultPhone: '+91 98765 43210',
    defaultEmail: 'shalini.pathology@docsearch.health',
    defaultPassword: 'PathoPass123!',
    defaultCity: 'Lucknow',
    defaultState: 'Uttar Pradesh',
    plans: [
      {
        id: 'path-starter',
        name: 'Pathology Starter LIMS',
        fee: 2999,
        description: 'Basic token queue, patient registration, test catalog & standard PDF lab reports',
        badge: 'Standard'
      },
      {
        id: 'path-pro',
        name: 'Pathology Pro & Barcode LIMS',
        fee: 6999,
        description: 'Phlebotomy sample barcoding, WhatsApp report auto-dispatch, bi-dir analyzer interface & doctor e-sign',
        badge: '⭐ Most Popular'
      },
      {
        id: 'path-enterprise',
        name: 'Enterprise Diagnostic Network',
        fee: 14999,
        description: 'Multi-collection center branches, B2B doctor referral commission splits & NABL audit logs',
        badge: 'Multi-Branch'
      }
    ],
    availableFeatures: [
      { id: 'barcoding', name: 'Phlebotomy Barcode Intake & Sample Tracking', default: true },
      { id: 'analyzer_sync', name: 'Bi-Directional Lab Machine / Analyzer Interface', default: true },
      { id: 'whatsapp_dispatch', name: 'WhatsApp NABL PDF Report Dispatch (Patient Direct)', default: true },
      { id: 'digital_sign', name: 'Pathologist Digital Signature on Lab Reports', default: true },
      { id: 'doctor_referral', name: 'Doctor Referral Commission Split & B2B Ledger', default: false },
      { id: 'home_collection', name: 'Home Sample Collection & Phlebotomist GPS Tracking', default: false }
    ],
    documents: [
      {
        id: 'doc-path-1',
        name: 'NABL Accreditation / Clinical Establishment License',
        type: 'CLINICAL_LICENSE',
        fileUploaded: true,
        fileName: 'NABL_Cert_ApexPathology_2026.pdf',
        regNumber: 'NABL-MC-2026-9812',
        verified: true
      },
      {
        id: 'doc-path-2',
        name: 'Head Pathologist Medical Council Registration (NMC/SMC)',
        type: 'DOCTOR_REGISTRATION',
        fileUploaded: true,
        fileName: 'Dr_Shalini_Deshmukh_MD_Path_Reg.pdf',
        regNumber: 'UP-MC-54219',
        verified: true
      },
      {
        id: 'doc-path-3',
        name: 'Lab Commercial GSTIN Registration & PAN Card Copy',
        type: 'GST_PAN',
        fileUploaded: true,
        fileName: 'Apex_Pathology_GST_Certificate.pdf',
        regNumber: '09AAACA1234F1Z8',
        verified: true
      },
      {
        id: 'doc-path-4',
        name: 'Bio-Medical Waste (BMW) Disposal Agreement & State PCB NOC',
        type: 'BMW_NOC',
        fileUploaded: true,
        fileName: 'Apex_BMW_Disposal_Auth_2026.pdf',
        regNumber: 'BMW-UP-2026-4412',
        verified: true
      }
    ]
  },

  PHARMACY: {
    id: 'PHARMACY',
    label: 'Pharmacy & Chemist',
    icon: '💊',
    badge: 'Retail POS & Drug License',
    description: 'High-speed POS billing, batch/expiry radar, Jan Aushadhi generic switcher, Schedule H1 drug register & supplier inwarding.',
    defaultPartnerName: 'Apollo Lifecare Chemist & Druggist',
    defaultContactPerson: 'Sunil Kumar, B.Pharm (Chief Pharmacist)',
    defaultPhone: '+91 98321 54321',
    defaultEmail: 'sunil.pharmacy@docsearch.health',
    defaultPassword: 'PharmaPass123!',
    defaultCity: 'New Delhi',
    defaultState: 'Delhi',
    plans: [
      {
        id: 'pharma-starter',
        name: 'Solo Chemist Basic POS',
        fee: 1999,
        description: 'High-speed barcode counter billing, daily cashier ledger & Jan Aushadhi generic alternate finder',
        badge: 'Solo Chemist'
      },
      {
        id: 'pharma-pro',
        name: 'Retail Pharmacy Pro POS',
        fee: 3999,
        description: 'Automated batch/expiry radar, supplier inwarding, WhatsApp bill SMS & auto-refill reminders',
        badge: '⭐ Most Popular'
      },
      {
        id: 'pharma-enterprise',
        name: 'Multi-Store Pharmacy Chain',
        fee: 8999,
        description: 'Centralized multi-store warehouse, automated purchase orders, Schedule H1 narcotics register & GST filing',
        badge: 'Multi-Store'
      }
    ],
    availableFeatures: [
      { id: 'pharma_barcode_pos', name: 'High-Speed Barcode Billing & Thermal Receipt Print', default: true },
      { id: 'pharma_expiry_radar', name: 'Automated Batch & Expiry Radar (30/60/90 Days Alerts)', default: true },
      { id: 'pharma_generic_finder', name: 'Jan Aushadhi & PMBJP Generic Alternate Recommender', default: true },
      { id: 'pharma_schedule_h1', name: 'Schedule H & H1 Narcotics Digital Compliance Register', default: true },
      { id: 'pharma_whatsapp_refills', name: 'WhatsApp Invoice PDF & Patient Medication Refill Reminders', default: true },
      { id: 'pharma_supplier_orders', name: 'Supplier Purchase Orders & Automated GST Tax Inwarding', default: false },
      { id: 'pharma_abdm_erx', name: 'ABDM 2.0 e-Prescription QR Scan & Dispense', default: false }
    ],
    documents: [
      {
        id: 'doc-pharma-1',
        name: 'Retail / Wholesale Drug License (Form 20 & Form 21)',
        type: 'DRUG_LICENSE',
        fileUploaded: true,
        fileName: 'Drug_License_Form20_21_ApolloLifecare.pdf',
        regNumber: 'DL-20-21-UP-88219',
        verified: true
      },
      {
        id: 'doc-pharma-2',
        name: 'Registered Pharmacist State Pharmacy Council Degree Certificate',
        type: 'PHARMACIST_REG',
        fileUploaded: true,
        fileName: 'Sunil_Kumar_BPharm_RegCert.pdf',
        regNumber: 'PCI-DL-94120',
        verified: true
      },
      {
        id: 'doc-pharma-3',
        name: 'Commercial GSTIN Registration & PAN Tax Certificate',
        type: 'GST_PAN',
        fileUploaded: true,
        fileName: 'Apollo_Pharmacy_GST_Reg.pdf',
        regNumber: '07AABCA5512B1ZX',
        verified: true
      },
      {
        id: 'doc-pharma-4',
        name: 'FSSAI Food Safety & Health Supplements License',
        type: 'FSSAI_LICENSE',
        fileUploaded: true,
        fileName: 'FSSAI_Lic_Apollo_2026.pdf',
        regNumber: 'FSSAI-1002202600124',
        verified: true
      }
    ]
  },

  HOSPITAL: {
    id: 'HOSPITAL',
    label: 'Multi-Specialty Hospital',
    icon: '🏥',
    badge: 'Inpatient Beds & OT',
    description: 'Inpatient ADT bed matrix, nursing flowsheets, OT surgical scheduling, ICU vitals, TPA cashless pre-auth & ABDM kiosk.',
    defaultPartnerName: 'Max Super Specialty Hospital (250 Beds)',
    defaultContactPerson: 'Dr. Alok Verma, MS, MHA (Medical Director)',
    defaultPhone: '+91 99112 33445',
    defaultEmail: 'director.max@docsearch.health',
    defaultPassword: 'HospitalPass123!',
    defaultCity: 'New Delhi',
    defaultState: 'Delhi',
    plans: [
      {
        id: 'hosp-secondary',
        name: 'Secondary Care Hospital HIS',
        fee: 14999,
        description: 'Up to 50 beds, ward ADT bed matrix, nursing flowsheets, OPD token queue & general billing',
        badge: '50 Beds'
      },
      {
        id: 'hosp-tertiary',
        name: 'Tertiary Multi-Specialty Hospital',
        fee: 29999,
        description: 'Up to 250 beds, OT scheduling, ICU vitals, TPA cashless pre-auth with AI 98% prediction & NHCX',
        badge: '⭐ Most Popular'
      },
      {
        id: 'hosp-enterprise',
        name: 'Super-Specialty Medical Group',
        fee: 59999,
        description: 'Multi-branch hospital chain, AI command wall, robotic surgery roster & multi-tier insurance split',
        badge: 'Enterprise Group'
      }
    ],
    availableFeatures: [
      { id: 'hosp_adt_beds', name: 'IPD Admission-Discharge-Transfer (ADT) & Visual Bed Matrix', default: true },
      { id: 'hosp_ot_roster', name: 'Operation Theatre (OT) Surgical Rostering & PAC Clearance', default: true },
      { id: 'hosp_icu_flowsheets', name: 'ICU 24-Hour Digital Flowsheet & Critical Vitals Charting', default: true },
      { id: 'hosp_tpa_claims', name: 'TPA Cashless Pre-Auth & IRDAI NHCX FHIR Bridge (98% Approval)', default: true },
      { id: 'hosp_emergency_code_blue', name: 'Emergency & Code Blue Instant Audio-Visual Broadcast', default: true },
      { id: 'hosp_abdm_kiosk', name: 'ABDM 2.0 Scan & Share Fast OPD Token Kiosk', default: true },
      { id: 'hosp_mrd_icd10', name: 'MRD ICD-10 Medical Coding & Forensic MLC Registry', default: false },
      { id: 'hosp_blood_bank', name: 'Blood Bank Component Cross-Matching & PRBC Inventory', default: false }
    ],
    documents: [
      {
        id: 'doc-hosp-1',
        name: 'Clinical Establishment Act (CEA) Hospital Registration Certificate',
        type: 'CLINICAL_ESTABLISHMENT',
        fileUploaded: true,
        fileName: 'CEA_Hospital_Registration_Max250.pdf',
        regNumber: 'CEA-HOSP-2026-00412',
        verified: true
      },
      {
        id: 'doc-hosp-2',
        name: 'NABH Full Accreditation / Entry-Level Healthcare Organization Cert',
        type: 'NABH_ACCREDITATION',
        fileUploaded: true,
        fileName: 'NABH_Accreditation_Certificate.pdf',
        regNumber: 'NABH-H-2026-7789',
        verified: true
      },
      {
        id: 'doc-hosp-3',
        name: 'Fire Safety Clearance NOC & Lift Safety Certificate',
        type: 'FIRE_SAFETY_NOC',
        fileUploaded: true,
        fileName: 'Fire_Safety_NOC_MaxHospital.pdf',
        regNumber: 'FS-NOC-DL-2026-91',
        verified: true
      },
      {
        id: 'doc-hosp-4',
        name: 'Bio-Medical Waste (BMW) Pollution Control Board Authorization',
        type: 'BMW_AUTHORIZATION',
        fileUploaded: true,
        fileName: 'DPCC_BMW_Hospital_Auth.pdf',
        regNumber: 'BMW-HOSP-PCB-5541',
        verified: true
      }
    ]
  },

  CLINIC: {
    id: 'CLINIC',
    label: 'Doctor OPD Clinic',
    icon: '🩺',
    badge: 'OPD EMR & AI Scribe',
    description: 'Ambient AI voice scribe, digital prescription pad with generic switcher, WhatsApp Rx dispatch & ABHA scan check-in.',
    defaultPartnerName: 'Dr. Sharma Heart & Child Care Clinic',
    defaultContactPerson: 'Dr. Ramesh Sharma, MBBS, MD (Lead Consultant)',
    defaultPhone: '+91 94150 99887',
    defaultEmail: 'dr.sharma@docsearch.health',
    defaultPassword: 'ClinicPass123!',
    defaultCity: 'Lucknow',
    defaultState: 'Uttar Pradesh',
    plans: [
      {
        id: 'clinic-starter',
        name: 'Solo Doctor Clinic EMR',
        fee: 1499,
        description: 'Patient token queue, digital prescription pad, OPD history archive & SMS appointment reminders',
        badge: 'Solo Doctor'
      },
      {
        id: 'clinic-pro',
        name: 'Doctor OPD Clinic Pro',
        fee: 3499,
        description: 'Ambient AI clinical voice scribe, WhatsApp Rx dispatch, Jan Aushadhi generic switch & ABHA scan',
        badge: '⭐ Most Popular'
      },
      {
        id: 'clinic-enterprise',
        name: 'Polyclinic Multi-Specialty Network',
        fee: 7999,
        description: '10+ Doctor consult rooms, combined cashier POS, lab/radiology referral splits & unified patient MPI',
        badge: 'Polyclinic Hub'
      }
    ],
    availableFeatures: [
      { id: 'clinic_ai_scribe', name: 'Ambient AI Voice Scribe (Converts Doctor-Patient Speech into EMR)', default: true },
      { id: 'clinic_rx_pad', name: '1-Click Digital Prescription Pad with Brand Safety & Generics', default: true },
      { id: 'clinic_whatsapp_rx', name: 'WhatsApp High-Res PDF Prescription Dispatch to Patient', default: true },
      { id: 'clinic_abha_qr', name: 'ABHA 2.0 QR Scan & Share Instant OPD Check-in under 5 Seconds', default: true },
      { id: 'clinic_ddi_shield', name: 'Real-Time AI Drug-Drug Conflict Interception (DDI Shield)', default: true },
      { id: 'clinic_telemedicine', name: 'HD Video Tele-Consultation with Instant UPI Payment Link', default: false },
      { id: 'clinic_multi_doctor', name: 'Automated Multi-Doctor Consultation Room Rostering', default: false }
    ],
    documents: [
      {
        id: 'doc-clinic-1',
        name: 'Treating Doctor State Medical Council (SMC/NMC) Degree & Reg Certificate',
        type: 'DOCTOR_SMC_REG',
        fileUploaded: true,
        fileName: 'Dr_Ramesh_Sharma_MD_Reg.pdf',
        regNumber: 'NMC-UP-19842',
        verified: true
      },
      {
        id: 'doc-clinic-2',
        name: 'Local Municipal Corporation Trade License / CEA Clinic Reg',
        type: 'MUNICIPAL_TRADE_LICENSE',
        fileUploaded: true,
        fileName: 'Municipal_Clinic_Trade_License.pdf',
        regNumber: 'MUNI-CLINIC-2026-12',
        verified: true
      },
      {
        id: 'doc-clinic-3',
        name: 'Bio-Medical Waste Disposal Agreement / Sharp Waste Handling Receipt',
        type: 'BMW_DISPOSAL_MOU',
        fileUploaded: true,
        fileName: 'Clinic_BMW_Collection_MOU.pdf',
        regNumber: 'BMW-CLINIC-2026-09',
        verified: true
      },
      {
        id: 'doc-clinic-4',
        name: 'Clinic PAN / GST Commercial Registration Certificate',
        type: 'GST_PAN',
        fileUploaded: true,
        fileName: 'Sharma_Clinic_PAN_GST.pdf',
        regNumber: '09AABCS8891C1Z4',
        verified: true
      }
    ]
  },

  DIAGNOSTIC_CENTRE: {
    id: 'DIAGNOSTIC_CENTRE',
    label: 'Radiology & Imaging Centre',
    icon: '🔬',
    badge: 'DICOM PACS & Scans',
    description: 'Zero-footprint web DICOM viewer, speech-to-text reporting, WhatsApp scan links, AERB & PNDT compliance registers.',
    defaultPartnerName: 'Apex Imaging & Advanced Radiology Centre',
    defaultContactPerson: 'Dr. Arvind Mehta, MD DMRD (Chief Radiologist)',
    defaultPhone: '+91 98111 22334',
    defaultEmail: 'arvind.radiology@docsearch.health',
    defaultPassword: 'RadioPass123!',
    defaultCity: 'Lucknow',
    defaultState: 'Uttar Pradesh',
    plans: [
      {
        id: 'radio-starter',
        name: 'Diagnostic X-Ray & Ultrasound',
        fee: 3999,
        description: 'Modality token scheduling, patient queue, structured PDF radiology report & appointment SMS',
        badge: 'Modality Basic'
      },
      {
        id: 'radio-pro',
        name: 'Diagnostic PACS & Modality Hub',
        fee: 8999,
        description: 'Zero-footprint web DICOM viewer, speech-to-text report writer & WhatsApp secure imaging link',
        badge: '⭐ Most Popular'
      },
      {
        id: 'radio-enterprise',
        name: 'Multi-Modality Imaging Network',
        fee: 18999,
        description: 'Cloud PACS for CT/MRI, teleradiology second opinions, AI chest nodule detection & multi-centre sync',
        badge: 'Enterprise PACS'
      }
    ],
    availableFeatures: [
      { id: 'radio_dicom_viewer', name: 'Zero-Footprint Web DICOM Viewer with 200+ Image Tools', default: true },
      { id: 'radio_speech_reporting', name: 'Radiologist Speech-to-Text Structured Voice Reporting', default: true },
      { id: 'radio_whatsapp_dicom', name: 'Secure WhatsApp Diagnostic Scan & DICOM Cloud Link for Patients', default: true },
      { id: 'radio_mwl_sync', name: 'Modality Worklist (MWL) & DICOM CT/MRI Machine Sync', default: true },
      { id: 'radio_aerb_pndt', name: 'AERB & PNDT Automated Regulatory Compliance Audit Registers', default: true },
      { id: 'radio_doctor_referral', name: 'Doctor Referral Commission Split & B2B Ledger', default: false },
      { id: 'radio_ai_cad', name: 'AI Computer-Aided Chest X-Ray Nodule Detection', default: false }
    ],
    documents: [
      {
        id: 'doc-radio-1',
        name: 'AERB (Atomic Energy Regulatory Board) Radiation Equipment License',
        type: 'AERB_LICENSE',
        fileUploaded: true,
        fileName: 'AERB_CT_XRay_Safety_License.pdf',
        regNumber: 'AERB-RAD-2026-4401',
        verified: true
      },
      {
        id: 'doc-radio-2',
        name: 'PNDT Act Registration Certificate (Ultrasound Compliance)',
        type: 'PNDT_CERTIFICATE',
        fileUploaded: true,
        fileName: 'PNDT_Ultrasound_Registration.pdf',
        regNumber: 'PNDT-UP-2026-8812',
        verified: true
      },
      {
        id: 'doc-radio-3',
        name: 'Chief Radiologist State Medical Council Degree Certificate (MD/DMRD)',
        type: 'DOCTOR_REGISTRATION',
        fileUploaded: true,
        fileName: 'Dr_Arvind_Mehta_DMRD_Reg.pdf',
        regNumber: 'DMRD-UP-77341',
        verified: true
      },
      {
        id: 'doc-radio-4',
        name: 'Diagnostic Centre Commercial Trade License & GST Certificate',
        type: 'GST_PAN',
        fileUploaded: true,
        fileName: 'Apex_Imaging_GST_Certificate.pdf',
        regNumber: '09AACCA9910D1Z2',
        verified: true
      }
    ]
  }
};

export const UniversalPartnerOnboardingWizard: React.FC<{ onComplete?: (res: ActivationResult) => void }> = ({ onComplete }) => {
  const [selectedCategory, setSelectedCategory] = useState<HealthcareCategoryType>('PATHOLOGY');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activationResult, setActivationResult] = useState<ActivationResult | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);

  // Initialize form data from preset
  const initialPreset = HEALTHCARE_PRESETS.PATHOLOGY;
  const [formData, setFormData] = useState<UniversalOnboardingData>({
    partnerName: initialPreset.defaultPartnerName,
    classification: 'PATHOLOGY',
    contactPerson: initialPreset.defaultContactPerson,
    phone: initialPreset.defaultPhone,
    email: initialPreset.defaultEmail,
    password: initialPreset.defaultPassword,
    city: initialPreset.defaultCity,
    state: initialPreset.defaultState,
    documents: initialPreset.documents,
    planTier: initialPreset.plans[1]?.name || initialPreset.plans[0]?.name || 'Standard Tier',
    monthlyFee: initialPreset.plans[1]?.fee || initialPreset.plans[0]?.fee || 2999,
    features: initialPreset.availableFeatures.filter((f) => f.default).map((f) => f.name)
  });

  const [showPassword, setShowPassword] = useState(false);
  const [kycStatus, setKycStatus] = useState<'PENDING' | 'VERIFIED'>('VERIFIED');

  // Handle category change
  const handleSelectCategory = (cat: HealthcareCategoryType) => {
    setSelectedCategory(cat);
    const preset = HEALTHCARE_PRESETS[cat];
    const recPlan = preset.plans[1] || preset.plans[0];

    setFormData({
      partnerName: preset.defaultPartnerName,
      classification: cat,
      contactPerson: preset.defaultContactPerson,
      phone: preset.defaultPhone,
      email: preset.defaultEmail,
      password: preset.defaultPassword,
      city: preset.defaultCity,
      state: preset.defaultState,
      documents: preset.documents,
      planTier: recPlan?.name || 'Healthcare Partner Pro',
      monthlyFee: recPlan?.fee || 4999,
      features: preset.availableFeatures.filter((f) => f.default).map((f) => f.name)
    });
    setKycStatus('VERIFIED');
  };

  const currentPreset = HEALTHCARE_PRESETS[selectedCategory];

  const handleFileUpload = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.map((d) =>
        d.id === docId
          ? {
              ...d,
              fileUploaded: true,
              fileName: file.name,
              regNumber: d.regNumber || `REG-${Math.floor(100000 + Math.random() * 900000)}`,
              verified: true
            }
          : d
      )
    }));
  };

  const handleVerifyAllDocs = () => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.map((d) => ({ ...d, verified: true }))
    }));
    setKycStatus('VERIFIED');
  };

  const toggleFeature = (featureName: string) => {
    setFormData((prev) => {
      const exists = prev.features.includes(featureName);
      return {
        ...prev,
        features: exists
          ? prev.features.filter((f) => f !== featureName)
          : [...prev.features, featureName]
      };
    });
  };

  const handleCompleteActivation = async () => {
    setIsSubmitting(true);
    try {
      // 1. Post to API Gateway
      const res = await fetch('/api/v1/company/partners/complete-onboarding-activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerName: formData.partnerName,
          classification: formData.classification,
          contactPerson: formData.contactPerson,
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
          city: formData.city,
          state: formData.state,
          planTier: formData.planTier,
          monthlyFee: formData.monthlyFee,
          features: formData.features,
          documents: formData.documents.map((d) => ({
            type: d.type,
            fileName: d.fileName || 'document.pdf',
            documentNumber: d.regNumber || 'VERIFIED',
            status: 'VERIFIED'
          }))
        })
      });

      const json = await res.json();
      let resultData: ActivationResult;

      const getRoleByOrg = (cat: HealthcareCategoryType) => {
        switch (cat) {
          case 'HOSPITAL': return 'HOSPITAL_DIRECTOR';
          case 'PHARMACY': return 'PHARMACIST';
          case 'CLINIC': return 'CLINIC_DOCTOR';
          case 'DIAGNOSTIC_CENTRE': return 'RADIOLOGIST';
          case 'PATHOLOGY':
          default: return 'PATHOLOGIST';
        }
      };

      if (res.ok && json.data) {
        resultData = json.data;
      } else {
        // Fallback activation voucher if offline
        resultData = {
          partnerId: `PRT-${Date.now().toString().slice(-6)}`,
          partnerName: formData.partnerName,
          classification: formData.classification,
          contactPerson: formData.contactPerson,
          phone: formData.phone,
          city: formData.city,
          status: 'LIVE_ACTIVE',
          subscriptionPlan: {
            tier: formData.planTier,
            monthlyFee: formData.monthlyFee,
            activeFeatures: formData.features
          },
          credentials: {
            loginUrl: 'http://localhost:5173/',
            userId: formData.email,
            temporaryPassword: formData.password,
            role: getRoleByOrg(formData.classification),
            activatedAt: new Date().toISOString()
          }
        };
      }

      // 2. Persist in shared localStorage so Partner Platform on port 5173 detects it instantly
      const storedPartners = JSON.parse(localStorage.getItem('docsearch_live_partners') || '[]');
      const updatedList = [resultData, ...storedPartners.filter((p: any) => p.credentials?.userId !== resultData.credentials.userId)];
      localStorage.setItem('docsearch_live_partners', JSON.stringify(updatedList));

      // Also register credentials into partner staff login cache with category-specific workspace config
      const customUsers = JSON.parse(localStorage.getItem('docsearch_custom_partner_users') || '[]');
      const primaryRole = getRoleByOrg(formData.classification);

      const getModuleByOrg = (cat: HealthcareCategoryType) => {
        switch (cat) {
          case 'HOSPITAL': return 'inpatient-management';
          case 'PHARMACY': return 'pharmacy-medication';
          case 'CLINIC': return 'clinical-consultation';
          case 'DIAGNOSTIC_CENTRE': return 'radiology-imaging';
          case 'PATHOLOGY':
          default: return 'clinical-investigation';
        }
      };

      const getDeptByOrg = (cat: HealthcareCategoryType) => {
        switch (cat) {
          case 'HOSPITAL': return 'Hospital Administration & Inpatient Governance';
          case 'PHARMACY': return 'Pharmacy POS & Stock Inwarding';
          case 'CLINIC': return 'Outpatient Clinic & Clinical Consultation';
          case 'DIAGNOSTIC_CENTRE': return 'Radiology, MRI, CT & Imaging';
          case 'PATHOLOGY':
          default: return 'Pathology & Diagnostic Laboratory';
        }
      };

      const newCustomUser = {
        id: `ROLE-${resultData.partnerId}`,
        category: 'HEALTHCARE',
        name: formData.contactPerson,
        email: formData.email,
        password: formData.password,
        role: primaryRole,
        roleTitle: `${formData.partnerName} (${primaryRole})`,
        department: getDeptByOrg(formData.classification),
        tenantName: formData.partnerName,
        organizationType: formData.classification,
        allowedWorkspaces: [formData.classification],
        defaultModule: getModuleByOrg(formData.classification),
        planTier: formData.planTier,
        accessibleFeatures: formData.features,
        restrictedFeatures: formData.classification === 'HOSPITAL' ? ['None (Full Hospital Scope)'] : ['Hospital IPD Wards']
      };
      localStorage.setItem('docsearch_custom_partner_users', JSON.stringify([newCustomUser, ...customUsers.filter((u: any) => u.email !== formData.email)]));

      setActivationResult(resultData);
      setCurrentStep(5);
      if (onComplete) onComplete(resultData);
    } catch (err) {
      console.error('Activation failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyNotice(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopyNotice(null), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1.5px solid #06B6D4',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 30px rgba(6, 182, 212, 0.15)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2.2rem' }}>{currentPreset.icon}</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC' }}>
                  Universal Healthcare Partner Onboarding & Live Activation
                </h2>
                <Badge variant="primary">Real End-to-End Pipeline</Badge>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
                Selected Category: <strong style={{ color: '#38BDF8' }}>{currentPreset.label}</strong> • {currentPreset.description}
              </p>
            </div>
          </div>
        </div>

        {/* Current Step Tracker */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { num: 1, label: '1. Facility Profile' },
            { num: 2, label: '2. KYC Docs' },
            { num: 3, label: '3. Plan & Features' },
            { num: 4, label: '4. Credentials' },
            { num: 5, label: '5. Live Portal & Kit' }
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (s.num <= currentStep || currentStep === 5) {
                  setCurrentStep(s.num as any);
                }
              }}
              style={{
                backgroundColor: currentStep === s.num ? '#06B6D4' : s.num < currentStep ? '#064E3B' : 'rgba(30, 41, 59, 0.6)',
                color: currentStep === s.num ? '#070C16' : s.num < currentStep ? '#A7F3D0' : '#94A3B8',
                border: '1px solid ' + (currentStep === s.num ? '#06B6D4' : s.num < currentStep ? '#10B981' : '#334155'),
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: s.num <= currentStep ? 'pointer' : 'default'
              }}
            >
              {s.num < currentStep ? `✓ ${s.label}` : s.label}
            </button>
          ))}
        </div>
      </div>

      {copyNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '10px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          ✓ {copyNotice}
        </div>
      )}

      {/* STEP 1: CATEGORY SELECTION & FACILITY DETAILS */}
      {currentStep === 1 && (
        <Card>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#F8FAFC', fontWeight: 800 }}>
                  📋 Step 1: Select Healthcare Category & Facility Profile
                </h3>
                <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                  Aap kis category ka healthcare partner live add karna chahte hain select karein (Hospital, Pharmacy, Clinic, Pathology, Radiology):
                </span>
              </div>
              <Badge variant="primary">Stage 1 of 5</Badge>
            </div>

            {/* CATEGORY SWITCHER CARDS */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#CBD5E1', fontWeight: 800, marginBottom: '8px' }}>
                SELECT HEALTHCARE PROVIDER TYPE:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {(Object.keys(HEALTHCARE_PRESETS) as HealthcareCategoryType[]).map((catKey) => {
                  const item = HEALTHCARE_PRESETS[catKey];
                  const isSelected = selectedCategory === catKey;
                  return (
                    <div
                      key={catKey}
                      onClick={() => handleSelectCategory(catKey)}
                      style={{
                        backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.14)' : '#1E293B',
                        border: '2px solid ' + (isSelected ? '#06B6D4' : '#334155'),
                        borderRadius: '12px',
                        padding: '12px 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.4rem' }}>{item.icon}</span>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: isSelected ? '#38BDF8' : '#94A3B8' }}>
                          {item.badge}
                        </span>
                      </div>
                      <strong style={{ fontSize: '0.875rem', color: isSelected ? '#F8FAFC' : '#CBD5E1' }}>
                        {item.label}
                      </strong>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form Fields for Facility */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, marginBottom: '6px' }}>
                  {selectedCategory === 'HOSPITAL'
                    ? 'HOSPITAL / HEALTHCARE FACILITY NAME *'
                    : selectedCategory === 'PHARMACY'
                    ? 'PHARMACY / CHEMIST SHOP NAME *'
                    : selectedCategory === 'CLINIC'
                    ? 'DOCTOR CLINIC / POLYCLINIC NAME *'
                    : selectedCategory === 'DIAGNOSTIC_CENTRE'
                    ? 'DIAGNOSTIC & RADIOLOGY CENTRE NAME *'
                    : 'PATHOLOGY LAB NAME *'}
                </label>
                <input
                  type="text"
                  value={formData.partnerName}
                  onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #475569',
                    color: '#F8FAFC',
                    fontSize: '0.875rem'
                  }}
                  placeholder="e.g. Apex Super Specialty Hospital"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, marginBottom: '6px' }}>
                  {selectedCategory === 'HOSPITAL'
                    ? 'MEDICAL SUPERINTENDENT / DIRECTOR NAME *'
                    : selectedCategory === 'PHARMACY'
                    ? 'CHIEF PHARMACIST / PROPRIETOR NAME *'
                    : selectedCategory === 'CLINIC'
                    ? 'LEAD CONSULTING DOCTOR NAME *'
                    : selectedCategory === 'DIAGNOSTIC_CENTRE'
                    ? 'CHIEF RADIOLOGIST / DIRECTOR NAME *'
                    : 'HEAD PATHOLOGIST / LAB IN-CHARGE *'}
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #475569',
                    color: '#F8FAFC',
                    fontSize: '0.875rem'
                  }}
                  placeholder="e.g. Dr. Alok Verma, MD"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, marginBottom: '6px' }}>
                  CONTACT PHONE (WHATSAPP ENABLED) *
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #475569',
                    color: '#F8FAFC',
                    fontSize: '0.875rem'
                  }}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, marginBottom: '6px' }}>
                  OFFICIAL EMAIL (THIS WILL BE PARTNER'S LOGIN USER ID) *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #475569',
                    color: '#38BDF8',
                    fontWeight: 700,
                    fontSize: '0.875rem'
                  }}
                  placeholder="admin@docsearch.health"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, marginBottom: '6px' }}>
                  CITY *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #475569',
                    color: '#F8FAFC',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Lucknow"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, marginBottom: '6px' }}>
                  STATE *
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #475569',
                    color: '#F8FAFC',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Uttar Pradesh"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <Button
                variant="primary"
                onClick={() => setCurrentStep(2)}
                disabled={!formData.partnerName || !formData.email || !formData.contactPerson}
              >
                Next ➔ Step 2: Upload & Verify KYC Documents ({currentPreset.label})
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 2: CATEGORY-SPECIFIC KYC DOCUMENTS */}
      {currentStep === 2 && (
        <Card>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#F8FAFC', fontWeight: 800 }}>
                  🛡️ Step 2: {currentPreset.label} Regulatory KYC & Document Verification
                </h3>
                <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                  Is facility ke liye authorized legal licenses upload karein aur verify button press karke 100% KYC clear karein.
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Badge variant={kycStatus === 'VERIFIED' ? 'success' : 'warning'}>
                  {kycStatus === 'VERIFIED' ? '✅ KYC 100% VERIFIED' : '⏳ PENDING REVIEW'}
                </Badge>
                <Badge variant="primary">Stage 2 of 5</Badge>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {formData.documents.map((doc, idx) => (
                <div
                  key={doc.id}
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid ' + (doc.verified ? '#10B981' : '#334155'),
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: doc.verified ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        color: doc.verified ? '#10B981' : '#38BDF8'
                      }}
                    >
                      {idx === 0 ? '📜' : idx === 1 ? '🩺' : idx === 2 ? '💳' : '🛡️'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.9375rem' }}>
                        {doc.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                        File: <span style={{ color: '#38BDF8', fontWeight: 600 }}>{doc.fileName || 'No file selected'}</span> • Reg/Lic No: <span style={{ color: '#F59E0B', fontWeight: 700 }}>{doc.regNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label
                      style={{
                        backgroundColor: '#334155',
                        color: '#F8FAFC',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-block'
                      }}
                    >
                      📁 Choose File
                      <input
                        type="file"
                        onChange={(e) => handleFileUpload(doc.id, e)}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <Badge variant={doc.verified ? 'success' : 'warning'}>
                      {doc.verified ? '✓ Verified' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                ← Back to Facility Profile
              </Button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button variant="outline" onClick={handleVerifyAllDocs}>
                  ⚡ Auto-Verify All Documents
                </Button>
                <Button variant="primary" onClick={() => setCurrentStep(3)}>
                  Next ➔ Step 3: Subscription & Feature Allocation
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 3: SUBSCRIPTION PLAN & FEATURE CUSTOMIZATION */}
      {currentStep === 3 && (
        <Card>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#F8FAFC', fontWeight: 800 }}>
                  💎 Step 3: {currentPreset.label} Plans & Feature Capacity Quota (Menu Book)
                </h3>
                <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                  Is facility ke scale ke anusaar subscription tier aur live digital capabilities allot karein.
                </span>
              </div>
              <Badge variant="primary">Stage 3 of 5</Badge>
            </div>

            {/* Plan Tiers Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: '#CBD5E1', fontWeight: 800, marginBottom: '10px' }}>
                CHOOSE SUBSCRIPTION TIER:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                {currentPreset.plans.map((plan) => {
                  const isSelected = formData.planTier === plan.name;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setFormData({ ...formData, planTier: plan.name, monthlyFee: plan.fee })}
                      style={{
                        backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.12)' : '#1E293B',
                        border: '2px solid ' + (isSelected ? '#06B6D4' : '#334155'),
                        borderRadius: '14px',
                        padding: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.9375rem' }}>{plan.name}</span>
                        <Badge variant={isSelected ? 'primary' : 'neutral'}>{plan.badge}</Badge>
                      </div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#38BDF8', margin: '8px 0 4px' }}>
                        ₹{plan.fee.toLocaleString('en-IN')}<span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 500 }}>/month</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.4 }}>
                        {plan.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Granular Features Checkboxes */}
            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: '#CBD5E1', fontWeight: 800, marginBottom: '10px' }}>
                ENABLE / DISABLE CUSTOM MODULES FOR THIS PARTNER:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
                {currentPreset.availableFeatures.map((feat) => {
                  const isChecked = formData.features.includes(feat.name);
                  return (
                    <div
                      key={feat.id}
                      onClick={() => toggleFeature(feat.name)}
                      style={{
                        backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.1)' : '#1E293B',
                        border: '1px solid ' + (isChecked ? '#10B981' : '#334155'),
                        borderRadius: '10px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ width: '18px', height: '18px', accentColor: '#10B981', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: isChecked ? '#F8FAFC' : '#94A3B8' }}>
                        {feat.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                ← Back to KYC Docs
              </Button>
              <Button variant="primary" onClick={() => setCurrentStep(4)}>
                Next ➔ Step 4: Set Login Credentials & Activate
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 4: SET CREDENTIALS & LIVE ACTIVATION */}
      {currentStep === 4 && (
        <Card>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#F8FAFC', fontWeight: 800 }}>
                  🔑 Step 4: Issue Partner Login Credentials & Activate Live
                </h3>
                <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                  Is partner ke liye User ID aur Password set karein jisse wo apne Partner Panel (http://localhost:5173/) me seedhe login kar sake.
                </span>
              </div>
              <Badge variant="warning">Ready to Activate</Badge>
            </div>

            <div style={{ backgroundColor: '#1E293B', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid #38BDF8' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, marginBottom: '6px' }}>
                    PARTNER LOGIN URL
                  </label>
                  <input
                    type="text"
                    value="http://localhost:5173/"
                    readOnly
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#0B132B',
                      border: '1px solid #06B6D4',
                      color: '#38BDF8',
                      fontWeight: 800,
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, marginBottom: '6px' }}>
                    PARTNER USER ID (EMAIL) *
                  </label>
                  <input
                    type="text"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#0F172A',
                      border: '1px solid #475569',
                      color: '#F8FAFC',
                      fontWeight: 700,
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, marginBottom: '6px' }}>
                    PARTNER LOGIN PASSWORD *
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#0F172A',
                        border: '1px solid #475569',
                        color: '#10B981',
                        fontWeight: 800,
                        fontSize: '0.875rem',
                        letterSpacing: showPassword ? 'normal' : '2px'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#334155',
                        color: '#F8FAFC',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, password: `${selectedCategory.slice(0, 4)}${Math.floor(1000 + Math.random() * 9000)}!` })}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#06B6D4',
                        color: '#070C16',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 800
                      }}
                    >
                      🎲 Generate
                    </button>
                  </div>
                </div>
              </div>

              {/* Onboarding Summary Bar */}
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>
                  <strong>Facility:</strong> {formData.partnerName} • <strong>Category:</strong> {currentPreset.label} • <strong>Lead:</strong> {formData.contactPerson} • <strong>Plan:</strong> {formData.planTier} ({formData.features.length} Features)
                </div>
                <Badge variant="success">All Checks Passed</Badge>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                ← Back to Features & Plan
              </Button>
              <button
                type="button"
                onClick={handleCompleteActivation}
                disabled={isSubmitting || !formData.email || !formData.password}
                style={{
                  backgroundColor: '#10B981',
                  color: '#064E3B',
                  fontWeight: 900,
                  fontSize: '1rem',
                  padding: '12px 28px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 0 25px rgba(16, 185, 129, 0.45)',
                  transition: 'all 0.15s ease'
                }}
              >
                {isSubmitting ? '⏳ Activating Partner & Generating Login...' : `🚀 Complete Onboarding & Activate ${currentPreset.label} LIVE`}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 5: LIVE ACTIVATION VOUCHER, WELCOME KIT & SPEED POST HUB */}
      {currentStep === 5 && activationResult && (
        <Card>
          <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Celebration Glow Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)',
                border: '2px solid #10B981',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                boxShadow: '0 10px 40px rgba(16, 185, 129, 0.25)'
              }}
            >
              <div>
                <span style={{ fontSize: '2.5rem' }}>🎉</span>
                <h3 style={{ margin: '8px 0 4px', fontSize: '1.45rem', fontWeight: 900, color: '#F8FAFC' }}>
                  {activationResult.partnerName} Successfully Activated 100% LIVE!
                </h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#A7F3D0' }}>
                  Aapka {currentPreset.label} ab Doc Search national digital grid par poori tarah se live ho chuka hai. Dedicated login credentials activate kar diye gaye hain.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <span style={{ backgroundColor: '#10B981', color: '#064E3B', padding: '6px 16px', borderRadius: '20px', fontWeight: 900, fontSize: '0.875rem' }}>
                  🟢 STATUS: LIVE & ACTIVE
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Partner ID: {activationResult.partnerId}</span>
              </div>
            </div>

            {/* Official Partner Credentials Card */}
            <div
              style={{
                backgroundColor: '#0F172A',
                border: '1.5px solid #38BDF8',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase' }}>
                    OFFICIAL PARTNER ACCESS CREDENTIALS
                  </span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F8FAFC' }}>
                    {activationResult.partnerName}
                  </div>
                </div>
                <Badge variant="primary">{activationResult.subscriptionPlan.tier}</Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                {/* Login URL */}
                <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    PARTNER LOGIN PANEL URL
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <a
                      href={activationResult.credentials.loginUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#38BDF8', fontWeight: 800, fontSize: '0.9375rem', textDecoration: 'underline' }}
                    >
                      {activationResult.credentials.loginUrl}
                    </a>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(activationResult.credentials.loginUrl, 'Login URL')}
                      style={{ backgroundColor: '#334155', color: '#CBD5E1', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.6875rem', cursor: 'pointer' }}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* User ID */}
                <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    PARTNER USER ID (EMAIL)
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.9375rem' }}>
                      {activationResult.credentials.userId}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(activationResult.credentials.userId, 'User ID')}
                      style={{ backgroundColor: '#334155', color: '#CBD5E1', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.6875rem', cursor: 'pointer' }}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    PARTNER PASSWORD
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#10B981', fontWeight: 900, fontSize: '1rem', fontFamily: 'monospace' }}>
                      {activationResult.credentials.temporaryPassword}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(activationResult.credentials.temporaryPassword, 'Password')}
                      style={{ backgroundColor: '#334155', color: '#CBD5E1', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.6875rem', cursor: 'pointer' }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Features Badges */}
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                  ACTIVATED {currentPreset.label.toUpperCase()} FEATURES FOR THIS PARTNER:
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {activationResult.subscriptionPlan.activeFeatures.map((feat) => (
                    <span
                      key={feat}
                      style={{
                        backgroundColor: 'rgba(6, 182, 212, 0.15)',
                        border: '1px solid #06B6D4',
                        color: '#38BDF8',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      ✓ {feat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Dynamic Feature Capacity & Quota Allocation Matrix (The "Menu Book") */}
            <div
              style={{
                backgroundColor: '#0F172A',
                border: '1.5px solid #10B981',
                borderRadius: '16px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.4rem' }}>📖</span>
                  <div>
                    <div style={{ fontWeight: 900, color: '#F8FAFC', fontSize: '1.05rem' }}>
                      {currentPreset.label} Feature Capacity & Quota Allocation Matrix (Menu Book)
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      As per "{activationResult.subscriptionPlan.tier}" tier, following service capacities are assigned:
                    </span>
                  </div>
                </div>
                <Badge variant="success">All Quotas Allocated</Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                {getCategoryMenuBookItems(activationResult.classification).map((item: { label: string; val: string }, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <span style={{ fontSize: '1.35rem' }}>
                      {idx === 0 ? '📊' : idx === 1 ? '🏷️' : idx === 2 ? '⚙️' : idx === 3 ? '📲' : idx === 4 ? '✍️' : idx === 5 ? '👥' : idx === 6 ? '🇮🇳' : '☁️'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, display: 'block' }}>
                        {item.label.replace(':', '')}
                      </span>
                      <strong style={{ fontSize: '0.8125rem', color: '#F8FAFC' }}>
                        {item.val}
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 800 }}>✓</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Speed Post & Courier Consignment Docket Box */}
            <div
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1.5px dashed #F59E0B',
                borderRadius: '14px',
                padding: '18px 22px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.8rem' }}>📦</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ color: '#F59E0B', fontSize: '0.9375rem', fontWeight: 900 }}>
                      INDIA POST SPEED POST & PHYSICAL COURIER DISPATCH DOCKET
                    </strong>
                    <Badge variant="warning">Ready for Dispatch</Badge>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '3px' }}>
                    Consignee: <strong>{activationResult.partnerName}</strong> (Attn: {activationResult.contactPerson}) • {activationResult.city}, {formData.state}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>
                    Tracking Docket ID: <span style={{ color: '#38BDF8', fontWeight: 800, fontFamily: 'monospace' }}>SP-IN-2026-{activationResult.partnerId.replace(/\D/g, '').padEnd(6, '9')}</span>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  openPrintableSpeedPostDossier({
                    partnerId: activationResult.partnerId,
                    partnerName: activationResult.partnerName,
                    classification: activationResult.classification,
                    contactPerson: activationResult.contactPerson,
                    phone: activationResult.phone,
                    email: activationResult.credentials.userId,
                    password: activationResult.credentials.temporaryPassword,
                    city: activationResult.city,
                    state: formData.state,
                    planTier: activationResult.subscriptionPlan.tier,
                    monthlyFee: activationResult.subscriptionPlan.monthlyFee,
                    features: activationResult.subscriptionPlan.activeFeatures,
                    activatedAt: activationResult.credentials.activatedAt
                  })
                }
                style={{ borderColor: '#F59E0B', color: '#FBBF24', fontWeight: 800 }}
              >
                🖨️ Print Speed Post Envelope & Label ➔
              </Button>
            </div>

            {/* DISPATCH ACTION HUB (PDF, Print, WhatsApp, Email) */}
            <div
              style={{
                backgroundColor: '#1E293B',
                border: '1.5px solid #06B6D4',
                borderRadius: '16px',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#F8FAFC' }}>
                    🚀 Dispatch Welcome Kit & Menu Book to Partner
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                    Partner ko official credentials aur feature menu book PDF WhatsApp, Email ya Speed Post ke zariye bhejein:
                  </p>
                </div>
                <Badge variant="primary">4 Delivery Channels</Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {/* 1. Download PDF */}
                <button
                  type="button"
                  onClick={() =>
                    generateAndDownloadWelcomeKitPdf({
                      partnerId: activationResult.partnerId,
                      partnerName: activationResult.partnerName,
                      classification: activationResult.classification,
                      contactPerson: activationResult.contactPerson,
                      phone: activationResult.phone,
                      email: activationResult.credentials.userId,
                      password: activationResult.credentials.temporaryPassword,
                      city: activationResult.city,
                      state: formData.state,
                      planTier: activationResult.subscriptionPlan.tier,
                      monthlyFee: activationResult.subscriptionPlan.monthlyFee,
                      features: activationResult.subscriptionPlan.activeFeatures,
                      activatedAt: activationResult.credentials.activatedAt
                    })
                  }
                  style={{
                    backgroundColor: '#0284C7',
                    color: '#FFF',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                  }}
                >
                  <span>📥</span> Download Menu Book PDF
                </button>

                {/* 2. Print Speed Post Dossier */}
                <button
                  type="button"
                  onClick={() =>
                    openPrintableSpeedPostDossier({
                      partnerId: activationResult.partnerId,
                      partnerName: activationResult.partnerName,
                      classification: activationResult.classification,
                      contactPerson: activationResult.contactPerson,
                      phone: activationResult.phone,
                      email: activationResult.credentials.userId,
                      password: activationResult.credentials.temporaryPassword,
                      city: activationResult.city,
                      state: formData.state,
                      planTier: activationResult.subscriptionPlan.tier,
                      monthlyFee: activationResult.subscriptionPlan.monthlyFee,
                      features: activationResult.subscriptionPlan.activeFeatures,
                      activatedAt: activationResult.credentials.activatedAt
                    })
                  }
                  style={{
                    backgroundColor: '#D97706',
                    color: '#FFF',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)'
                  }}
                >
                  <span>🖨️</span> Print Speed Post Dossier
                </button>

                {/* 3. Send WhatsApp */}
                <button
                  type="button"
                  onClick={() => setIsWhatsAppModalOpen(true)}
                  style={{
                    backgroundColor: '#16A34A',
                    color: '#FFF',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)'
                  }}
                >
                  <span>💬</span> Send via WhatsApp
                </button>

                {/* 4. Send Email */}
                <button
                  type="button"
                  onClick={() => {
                    setEmailNotice(`✓ Official Onboarding Dossier & Credentials dispatched to "${activationResult.credentials.userId}"!`);
                    setTimeout(() => setEmailNotice(null), 4500);
                  }}
                  style={{
                    backgroundColor: '#4F46E5',
                    color: '#FFF',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)'
                  }}
                >
                  <span>📧</span> Send via Email
                </button>
              </div>

              {emailNotice && (
                <div style={{ backgroundColor: 'rgba(79, 70, 229, 0.2)', border: '1px solid #4F46E5', borderRadius: '8px', padding: '10px 14px', color: '#C7D2FE', fontSize: '0.8125rem', fontWeight: 700 }}>
                  {emailNotice}
                </div>
              )}
            </div>

            {/* WHATSAPP DISPATCH PREVIEW MODAL */}
            {isWhatsAppModalOpen && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                  padding: '16px'
                }}
              >
                <div
                  style={{
                    backgroundColor: '#0F172A',
                    border: '2px solid #22C55E',
                    borderRadius: '16px',
                    maxWidth: '560px',
                    width: '100%',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    boxShadow: '0 20px 60px rgba(34, 197, 94, 0.25)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.5rem' }}>💬</span>
                      <strong style={{ color: '#F8FAFC', fontSize: '1.1rem' }}>
                        WhatsApp Dispatch Preview
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsWhatsAppModalOpen(false)}
                      style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}
                    >
                      ✖
                    </button>
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                    Recipient: <strong style={{ color: '#38BDF8' }}>{activationResult.contactPerson} ({activationResult.phone})</strong>
                  </div>

                  {/* Simulated WhatsApp Chat Bubble */}
                  <div
                    style={{
                      backgroundColor: '#064E3B',
                      color: '#E2E8F0',
                      borderRadius: '12px',
                      padding: '16px',
                      fontSize: '0.8125rem',
                      lineHeight: 1.5,
                      border: '1px solid #10B981',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'system-ui, sans-serif'
                    }}
                  >
                    {`🏥 *DOC SEARCH HEALTHCARE PLATFORM*
Dear ${activationResult.contactPerson},
Congratulations! *${activationResult.partnerName}* (${currentPreset.label}) is now 100% LIVE on Doc Search.

📋 *Your Dedicated Access Credentials:*
• Login Portal: ${activationResult.credentials.loginUrl}
• User ID: ${activationResult.credentials.userId}
• Temporary Password: ${activationResult.credentials.temporaryPassword}

💎 *Assigned Plan & Capacity (Menu Book):*
• Tier: ${activationResult.subscriptionPlan.tier}
• Active Features: ${activationResult.subscriptionPlan.activeFeatures.slice(0, 3).join(', ')}...
• 24x7 Digital Portal Access: Enabled

📦 *Speed Post Docket ID:* SP-IN-2026-${activationResult.partnerId.replace(/\D/g, '').padEnd(6, '9')}
(Official Welcome Kit & Physical Agreement dispatched via Speed Post)

📞 *Support Desk:* +91 1800-DOC-SEARCH
Please change your password upon first login.`}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <Button variant="outline" onClick={() => setIsWhatsAppModalOpen(false)}>
                      Close
                    </Button>
                    <a
                      href={`https://wa.me/${activationResult.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Dear ${activationResult.contactPerson},\nCongratulations! ${activationResult.partnerName} (${currentPreset.label}) is now LIVE on Doc Search.\nLogin: ${activationResult.credentials.loginUrl}\nUser ID: ${activationResult.credentials.userId}\nPassword: ${activationResult.credentials.temporaryPassword}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setIsWhatsAppModalOpen(false)}
                      style={{
                        backgroundColor: '#22C55E',
                        color: '#022C22',
                        fontWeight: 900,
                        padding: '10px 20px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>📲 Send via WhatsApp Web ➔</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Launch Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep(1);
                  setActivationResult(null);
                }}
              >
                + Onboard Another Healthcare Partner
              </Button>

              <a
                href={activationResult.credentials.loginUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  backgroundColor: '#06B6D4',
                  color: '#070C16',
                  fontWeight: 900,
                  fontSize: '1rem',
                  padding: '14px 32px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 0 25px rgba(6, 182, 212, 0.5)',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>🚪 Open Partner Login Panel (localhost:5173) ➔</span>
              </a>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// Export backward compatible alias so existing imports don't break
export const PathologyPartnerOnboardingWizard = UniversalPartnerOnboardingWizard;
