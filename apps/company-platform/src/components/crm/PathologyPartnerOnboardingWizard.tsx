import React, { useState, useEffect } from 'react';
import { Badge, Button, Card, Spinner } from '@docsearch/ui-kit';
import { generateAndDownloadWelcomeKitPdf, openPrintableSpeedPostDossier, getCategoryMenuBookItems } from '../../utils/partnerWelcomeKitPdf.js';
import { partnerService } from '../../services/partner-service.js';

export type HealthcareCategoryType =
  | 'PATHOLOGY'
  | 'PHARMACY'
  | 'HOSPITAL'
  | 'CLINIC'
  | 'COMBO_CLINIC_PATHOLOGY'
  | 'COMBO_CLINIC_PHARMACY'
  | 'DIAGNOSTIC_CENTRE'
  | 'BLOOD_BANK'
  | 'DENTAL_CLINIC'
  | 'AYUSH_WELLNESS'
  | 'DIALYSIS_CENTRE'
  | 'EYE_CARE'
  | 'PHYSIOTHERAPY';

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
  streetAddress?: string;
  pincode?: string;
  agreementAccepted?: boolean;
  documents: HealthcareDocumentItem[];
  planTier: string;
  monthlyFee: number;
  features: string[];
  planId?: string;
  billingInterval?: string;
  quotas?: {
    maxDoctors?: number;
    maxBranches?: number;
    monthlyWhatsAppCredits?: number;
    storageQuotaGb?: number;
  };
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
    planExpiryDate?: string;
    expiryDate?: string;
  };
  credentials: {
    loginUrl: string;
    userId: string;
    temporaryPassword: string;
    role: string;
    activatedAt: string;
    planExpiryDate?: string;
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
    defaultPhone: '9876543210',
    defaultEmail: 'shalini.pathology@docsearch.health',
    defaultPassword: 'PathoPass123!',
    defaultCity: 'Lucknow',
    defaultState: 'Uttar Pradesh',
    plans: [
      {
        id: 'path-free-yr1',
        name: 'Pathology Founding Partner (1st Year Free)',
        fee: 0,
        description: '100% Free for 365 Days - Phlebotomy sample barcodes, bi-directional analyzer sync, WhatsApp NABL reports & doctor e-sign. Renews at ₹10,000/yr from Year 2.',
        badge: '🎁 1st Year Free'
      },
      {
        id: 'path-annual-yr2',
        name: 'Pathology Lab LIMS Annual Plan',
        fee: 10000,
        description: 'Full LIMS suite: Multi-collection centers, bi-directional analyzer sync, automated WhatsApp reports, doctor referral ledger & NABL logs.',
        badge: '⭐ Year 2: ₹10,000/yr'
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
    defaultPhone: '9832154321',
    defaultEmail: 'sunil.pharmacy@docsearch.health',
    defaultPassword: 'PharmaPass123!',
    defaultCity: 'New Delhi',
    defaultState: 'Delhi',
    plans: [
      {
        id: 'pharma-free-yr1',
        name: 'Pharmacy Founding Partner (1st Year Free)',
        fee: 0,
        description: '100% Free for 365 Days - High-speed barcode POS, batch/expiry radar, Jan Aushadhi generic switcher & Schedule H1 narcotics register. Renews at ₹10,000/yr from Year 2.',
        badge: '🎁 1st Year Free'
      },
      {
        id: 'pharma-annual-yr2',
        name: 'Pharmacy & Chemist Annual Plan',
        fee: 10000,
        description: 'Full Chemist POS suite: Automated batch/expiry radar, PMBJP generic switcher, supplier purchase inwarding, WhatsApp bills & Schedule H1 narcotics register.',
        badge: '⭐ Year 2: ₹10,000/yr'
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
    defaultPhone: '9911233445',
    defaultEmail: 'director.max@docsearch.health',
    defaultPassword: 'HospitalPass123!',
    defaultCity: 'New Delhi',
    defaultState: 'Delhi',
    plans: [
      {
        id: 'hosp-free-yr1',
        name: 'Hospital Founding Partner (1st Year Free)',
        fee: 0,
        description: '100% Free for 365 Days - Complete Multi-Specialty Hospital HIS: All departments & modules pre-selected and unlocked. Renews at ₹30,000/yr from Year 2.',
        badge: '🎁 1st Year Free'
      },
      {
        id: 'hosp-annual-yr2',
        name: 'Multi-Specialty Hospital Annual Plan',
        fee: 30000,
        description: 'All-inclusive Multi-Specialty HIS: Inpatient ADT Bed Matrix, OT Rostering, ICU Flowsheets, TPA IRDAI NHCX Cashless Bridge, ABDM Kiosk, MRD ICD-10 & Blood Bank.',
        badge: '⭐ Year 2: ₹30,000/yr'
      }
    ],
    availableFeatures: [
      { id: 'hosp_adt_beds', name: 'IPD Admission-Discharge-Transfer (ADT) & Visual Bed Matrix', default: true },
      { id: 'hosp_ot_roster', name: 'Operation Theatre (OT) Surgical Rostering & PAC Clearance', default: true },
      { id: 'hosp_icu_flowsheets', name: 'ICU 24-Hour Digital Flowsheet & Critical Vitals Charting', default: true },
      { id: 'hosp_tpa_claims', name: 'TPA Cashless Pre-Auth & IRDAI NHCX FHIR Bridge (98% Approval)', default: true },
      { id: 'hosp_emergency_code_blue', name: 'Emergency & Code Blue Instant Audio-Visual Broadcast', default: true },
      { id: 'hosp_abdm_kiosk', name: 'ABDM 2.0 Scan & Share Fast OPD Token Kiosk', default: true },
      { id: 'hosp_mrd_icd10', name: 'MRD ICD-10 Medical Coding & Forensic MLC Registry', default: true },
      { id: 'hosp_blood_bank', name: 'Blood Bank Component Cross-Matching & PRBC Inventory', default: true }
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
    defaultPhone: '9415099887',
    defaultEmail: 'dr.sharma@docsearch.health',
    defaultPassword: 'ClinicPass123!',
    defaultCity: 'Lucknow',
    defaultState: 'Uttar Pradesh',
    plans: [
      {
        id: 'clinic-free-yr1',
        name: 'Clinic Founding Partner (1st Year Free)',
        fee: 0,
        description: '100% Free for 365 Days - Patient token queue, digital prescription pad, ambient AI voice scribe, WhatsApp Rx & ABHA QR scan. Renews at ₹20,000/yr from Year 2.',
        badge: '🎁 1st Year Free'
      },
      {
        id: 'clinic-annual-yr2',
        name: 'Doctor OPD Clinic Annual Plan',
        fee: 20000,
        description: 'Full Doctor OPD Practice Suite: Ambient AI Clinical Voice Scribe, WhatsApp Rx Dispatch, Jan Aushadhi Generic Switcher, ABHA 2.0 QR Scan & DDI Conflict Shield.',
        badge: '⭐ Year 2: ₹20,000/yr'
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

  COMBO_CLINIC_PATHOLOGY: {
    id: 'COMBO_CLINIC_PATHOLOGY',
    label: 'Clinic + Pathology Combo',
    icon: '🩺🧪',
    badge: 'OPD & Lab Suite',
    description: 'Integrated doctor OPD consultations, ambient AI voice scribe, phlebotomy sample barcode tracking, automated analyzer sync & direct EMR lab report attachment.',
    defaultPartnerName: 'Lifecare Polyclinic & Diagnostic Lab',
    defaultContactPerson: 'Dr. A. K. Saxena, MD (Physician & Lab Director)',
    defaultPhone: '9810123456',
    defaultEmail: 'contact.lifecare@docsearch.health',
    defaultPassword: 'ComboPass123!',
    defaultCity: 'Lucknow',
    defaultState: 'Uttar Pradesh',
    plans: [
      {
        id: 'combo-cp-free-yr1',
        name: 'Clinic + Lab Founding Partner (1st Year Free)',
        fee: 0,
        description: '100% Free for 365 Days - Integrated OPD Rx + Lab Order Queue, WhatsApp reports & unified cashier. Renews at ₹25,000/yr from Year 2.',
        badge: '🎁 1st Year Free'
      },
      {
        id: 'combo-cp-annual-yr2',
        name: 'Clinic + Lab Combo Annual Plan',
        fee: 25000,
        description: 'Complete integrated suite: Doctor OPD Rx, phlebotomy barcoding, bi-directional analyzer sync, WhatsApp NABL reports & doctor referral splits.',
        badge: '⭐ Year 2: ₹25,000/yr'
      }
    ],
    availableFeatures: [
      { id: 'combo_staff_directory', name: 'Universal Staff Directory & RBAC', default: true },
      { id: 'combo_opd_rx', name: 'Doctor OPD Digital Prescription Pad with Brand Safety', default: true },
      { id: 'combo_lab_queue', name: 'Direct EMR Lab Order Queue & Sample Token', default: true },
      { id: 'combo_barcoding', name: 'Phlebotomy Sample Barcode Intake & Tracking', default: true },
      { id: 'combo_analyzer_sync', name: 'Bi-Directional Lab Machine / Analyzer Interface', default: true },
      { id: 'combo_whatsapp_reports', name: 'WhatsApp NABL Lab Report & Rx Auto-Dispatch', default: true },
      { id: 'combo_ai_scribe', name: 'Ambient AI Voice Scribe (Consultation to EMR)', default: false },
      { id: 'combo_commission_splits', name: 'Doctor-Lab Referral Commission Splits & Unified Cashier', default: false }
    ],
    documents: [
      {
        id: 'doc-combo-cp-1',
        name: 'Lead Consulting Doctor Medical Council (SMC/NMC) Reg Certificate',
        type: 'DOCTOR_SMC_REG',
        fileUploaded: true,
        fileName: 'Dr_AK_Saxena_MD_Reg.pdf',
        regNumber: 'NMC-UP-24190',
        verified: true
      },
      {
        id: 'doc-combo-cp-2',
        name: 'NABL Accreditation / Clinical Establishment License (LIMS Lab)',
        type: 'CLINICAL_LICENSE',
        fileUploaded: true,
        fileName: 'NABL_Lab_Accreditation_Lifecare.pdf',
        regNumber: 'NABL-MC-2026-4419',
        verified: true
      },
      {
        id: 'doc-combo-cp-3',
        name: 'Bio-Medical Waste (BMW) Disposal Agreement & State PCB NOC',
        type: 'BMW_NOC',
        fileUploaded: true,
        fileName: 'BMW_Disposal_Auth_Lifecare.pdf',
        regNumber: 'BMW-CP-2026-1182',
        verified: true
      },
      {
        id: 'doc-combo-cp-4',
        name: 'Commercial GSTIN Registration & PAN Card Copy',
        type: 'GST_PAN',
        fileUploaded: true,
        fileName: 'Lifecare_Clinic_Lab_GST_PAN.pdf',
        regNumber: '09AABCL9912D1Z8',
        verified: true
      }
    ]
  },

  COMBO_CLINIC_PHARMACY: {
    id: 'COMBO_CLINIC_PHARMACY',
    label: 'Clinic + Pharmacy Combo',
    icon: '🩺💊',
    badge: 'OPD & Chemist POS',
    description: 'Integrated doctor OPD consultation with automated electronic prescription routing to in-house chemist counter, batch/expiry radar & combined billing.',
    defaultPartnerName: 'Metro Health Clinic & Medicos',
    defaultContactPerson: 'Dr. Neha Gupta, MBBS & R.Ph (Clinical Lead)',
    defaultPhone: '9820234567',
    defaultEmail: 'contact.metromedicos@docsearch.health',
    defaultPassword: 'ComboPass123!',
    defaultCity: 'New Delhi',
    defaultState: 'Delhi',
    plans: [
      {
        id: 'combo-cpr-free-yr1',
        name: 'Clinic + Pharmacy Founding Partner (1st Year Free)',
        fee: 0,
        description: '100% Free for 365 Days - Integrated OPD e-Rx to chemist queue, POS billing & unified records. Renews at ₹25,000/yr from Year 2.',
        badge: '🎁 1st Year Free'
      },
      {
        id: 'combo-cpr-annual-yr2',
        name: 'Clinic + Pharmacy Combo Annual Plan',
        fee: 25000,
        description: 'Complete integrated suite: Doctor OPD e-Rx push, thermal POS cashier, batch/expiry radar, Jan Aushadhi generic switch & Schedule H1 narcotics register.',
        badge: '⭐ Year 2: ₹25,000/yr'
      }
    ],
    availableFeatures: [
      { id: 'combo_cpr_staff_directory', name: 'Universal Staff Directory & RBAC', default: true },
      { id: 'combo_cpr_opd_rx', name: 'Doctor OPD Prescription Pad with Brand Safety', default: true },
      { id: 'combo_cpr_dispense_queue', name: 'Zero-Lag Instant Dispense Queue to Chemist Counter', default: true },
      { id: 'combo_cpr_pos_billing', name: 'High-Speed Barcode POS Billing & Thermal Print', default: true },
      { id: 'combo_cpr_expiry_radar', name: 'Automated Batch & Expiry Radar (30/60/90 Days Alerts)', default: true },
      { id: 'combo_cpr_generic_finder', name: 'Jan Aushadhi Generic Alternate Recommender', default: true },
      { id: 'combo_cpr_schedule_h1', name: 'Schedule H & H1 Narcotics Digital Compliance Register', default: false },
      { id: 'combo_cpr_whatsapp', name: 'WhatsApp Unified Prescription & Tax Invoice Dispatch', default: false }
    ],
    documents: [
      {
        id: 'doc-combo-cpr-1',
        name: 'Consulting Doctor State Medical Council (SMC/NMC) Degree & Reg',
        type: 'DOCTOR_SMC_REG',
        fileUploaded: true,
        fileName: 'Dr_Neha_Gupta_MBBS_Reg.pdf',
        regNumber: 'NMC-DL-55219',
        verified: true
      },
      {
        id: 'doc-combo-cpr-2',
        name: 'Retail Drug License (Form 20 & Form 21) from State FDA',
        type: 'DRUG_LICENSE',
        fileUploaded: true,
        fileName: 'Drug_License_Form20_21_Metro.pdf',
        regNumber: 'DL-20-21-DL-33410',
        verified: true
      },
      {
        id: 'doc-combo-cpr-3',
        name: 'Registered Pharmacist State Pharmacy Council Degree Certificate',
        type: 'PHARMACIST_REG',
        fileUploaded: true,
        fileName: 'Pharmacist_PCI_Registration_Metro.pdf',
        regNumber: 'PCI-DL-11928',
        verified: true
      },
      {
        id: 'doc-combo-cpr-4',
        name: 'Commercial GSTIN Registration & PAN Tax Certificate',
        type: 'GST_PAN',
        fileUploaded: true,
        fileName: 'Metro_Clinic_Pharmacy_GST.pdf',
        regNumber: '07AABCM2291K1ZS',
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
    defaultPhone: '9811122334',
    defaultEmail: 'arvind.radiology@docsearch.health',
    defaultPassword: 'RadioPass123!',
    defaultCity: 'Lucknow',
    defaultState: 'Uttar Pradesh',
    plans: [
      {
        id: 'radio-free-yr1',
        name: 'Radiology Founding Partner (1st Year Free)',
        fee: 0,
        description: '100% Free for 365 Days - Zero-footprint web DICOM viewer, speech-to-text reporting & WhatsApp scan links. Renews at ₹20,000/yr from Year 2.',
        badge: '🎁 1st Year Free'
      },
      {
        id: 'radio-annual-yr2',
        name: 'Radiology & PACS Annual Plan',
        fee: 20000,
        description: 'Complete Imaging suite: Cloud PACS, DICOM CT/MRI machine sync, speech-to-text structured reporting & WhatsApp scan links.',
        badge: '⭐ Year 2: ₹20,000/yr'
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
  },

  BLOOD_BANK: {
    id: 'BLOOD_BANK',
    label: 'Blood Bank & Transfusion Centre',
    icon: '🩸',
    badge: 'NACO & Component Unit',
    description: 'Voluntary donor registry, component separation (PRBC, FFP, Platelets), cross-matching, cold chain logs & e-RaktKosh sync.',
    defaultPartnerName: 'Apex Regional Blood Centre & Component Separation Unit',
    defaultContactPerson: 'Dr. Neha Kapoor, MD Transfusion Medicine',
    defaultPhone: '9822233445',
    defaultEmail: 'blood.neha@docsearch.health',
    defaultPassword: 'BloodPass123!',
    defaultCity: 'Lucknow',
    defaultState: 'Uttar Pradesh',
    plans: [
      {
        id: 'blood-free-yr1',
        name: 'Blood Bank Founding Partner (1st Year Free)',
        fee: 0,
        description: '100% Free for 365 Days - Donor registry, component fractionation, cross-matching & e-RaktKosh sync. Renews at ₹20,000/yr from Year 2.',
        badge: '🎁 1st Year Free'
      },
      {
        id: 'blood-annual-yr2',
        name: 'Blood Bank & Transfusion Annual Plan',
        fee: 20000,
        description: 'Complete Transfusion suite: Voluntary donor registry, PRBC/FFP/Platelet component separation, Coombs cross-matching matrix & e-RaktKosh national sync.',
        badge: '⭐ Year 2: ₹20,000/yr'
      }
    ],
    availableFeatures: [
      { id: 'blood_donor_registry', name: 'Voluntary Donor Registry & Blood Donation Camp Scheduler', default: true },
      { id: 'blood_component_sep', name: 'Blood Component Fractionation (PRBC, FFP, Cryoprecipitate, Platelets)', default: true },
      { id: 'blood_cross_match', name: 'Cross-Matching & Coombs Compatibility Test Matrix', default: true },
      { id: 'blood_cold_chain', name: 'Real-Time Cold Chain IoT Temperature Alert System (2°C to 6°C)', default: true },
      { id: 'blood_eraktkosh', name: 'e-RaktKosh Central Government National Portal Live Inventory Sync', default: true },
      { id: 'blood_emergency_oneg', name: 'Emergency O-Negative Zero-Lag Trauma Broadcast', default: false },
      { id: 'blood_apheresis', name: 'Apheresis Single-Donor Platelet (SDP) Machine Interfacing', default: false }
    ],
    documents: [
      {
        id: 'doc-blood-1',
        name: 'State Drug Control Form 28C / 28E Blood Bank Operating License',
        type: 'DRUG_LICENSE',
        fileUploaded: true,
        fileName: 'Blood_Bank_Form28C_License.pdf',
        regNumber: 'BB-LIC-UP-2026-091',
        verified: true
      },
      {
        id: 'doc-blood-2',
        name: 'NACO & NBTC National Blood Transfusion Council Accreditation',
        type: 'NABH_ACCREDITATION',
        fileUploaded: true,
        fileName: 'NACO_Blood_Safety_Accreditation.pdf',
        regNumber: 'NACO-NBTC-2026-554',
        verified: true
      },
      {
        id: 'doc-blood-3',
        name: 'Transfusion Medicine Specialist State Medical Council Certificate (MD)',
        type: 'DOCTOR_REGISTRATION',
        fileUploaded: true,
        fileName: 'Dr_Neha_Kapoor_MD_Transfusion.pdf',
        regNumber: 'MCI-TRANS-44812',
        verified: true
      },
      {
        id: 'doc-blood-4',
        name: 'Blood Centre Commercial Registration & GST Certificate',
        type: 'GST_PAN',
        fileUploaded: true,
        fileName: 'Apex_Blood_Bank_GST.pdf',
        regNumber: '09AAACB7788K1Z3',
        verified: true
      }
    ]
  },

  DENTAL_CLINIC: {
    id: 'DENTAL_CLINIC',
    label: 'Dental Clinic & Maxillofacial Centre',
    icon: '🦷',
    badge: 'Odontogram & RVG',
    description: 'Interactive 32-tooth odontogram, RVG digital sensor X-ray capture, multi-chair rostering, procedure step pricing & dental recall SMS.',
    defaultPartnerName: 'Apex 32 Smiles Dental Clinic & Implant Centre',
    defaultContactPerson: 'Dr. Karan Grover, MDS (Orthodontics)',
    defaultPhone: '9833344556',
    defaultEmail: 'dental.karan@docsearch.health',
    defaultPassword: 'DentalPass123!',
    defaultCity: 'Lucknow',
    defaultState: 'Uttar Pradesh',
    plans: [
      {
        id: 'dental-free-yr1',
        name: 'Dental Founding Partner (1st Year Free)',
        fee: 0,
        description: '100% Free for 365 Days - Interactive 32-tooth odontogram, RVG sensor capture & chair rostering. Renews at ₹20,000/yr from Year 2.',
        badge: '🎁 1st Year Free'
      },
      {
        id: 'dental-annual-yr2',
        name: 'Dental Clinic Annual Plan',
        fee: 20000,
        description: 'Full Dental Clinic suite: 32-tooth odontogram, RVG sensor capture, multi-chair rostering & procedure step pricing.',
        badge: '⭐ Year 2: ₹20,000/yr'
      }
    ],
    availableFeatures: [
      { id: 'dental_odontogram', name: 'Interactive 32-Tooth Visual Odontogram & Treatment Planner', default: true },
      { id: 'dental_rvg_capture', name: 'Direct USB Intraoral Camera & RVG Sensor DICOM Capture', default: true },
      { id: 'dental_chair_roster', name: 'Multi-Chair Appointment Rostering & Patient SMS Recalls', default: true },
      { id: 'dental_procedure_pricing', name: 'Itemized Dental Procedure Steps & Lab Fabrication Slips', default: true },
      { id: 'dental_aligner_tracker', name: 'Orthodontic & Clear Aligner Treatment Progress Photo Archival', default: true },
      { id: 'dental_postop_whatsapp', name: 'Automated WhatsApp Post-Extraction Care Instructions', default: false },
      { id: 'dental_implant_inventory', name: 'Dental Biomaterial & Implant Inventory Serial Number Tracking', default: false }
    ],
    documents: [
      {
        id: 'doc-dental-1',
        name: 'State Dental Council (DCI) Specialist Registration Certificate (MDS)',
        type: 'DOCTOR_REGISTRATION',
        fileUploaded: true,
        fileName: 'Dr_Karan_Grover_MDS_Reg.pdf',
        regNumber: 'DCI-UP-2026-9921',
        verified: true
      },
      {
        id: 'doc-dental-2',
        name: 'Clinical Establishment Act Registration for Dental Clinic',
        type: 'CLINICAL_ESTABLISHMENT',
        fileUploaded: true,
        fileName: 'Dental_Clinical_Establishment_Reg.pdf',
        regNumber: 'CEA-DEN-2026-118',
        verified: true
      },
      {
        id: 'doc-dental-3',
        name: 'AERB Registration for Dental RVG / OPG X-Ray Unit',
        type: 'AERB_LICENSE',
        fileUploaded: true,
        fileName: 'AERB_Dental_RVG_Registration.pdf',
        regNumber: 'AERB-DENT-8841',
        verified: true
      },
      {
        id: 'doc-dental-4',
        name: 'Dental Clinic Trade License & Commercial GST Certificate',
        type: 'GST_PAN',
        fileUploaded: true,
        fileName: 'Apex_Dental_GST_Certificate.pdf',
        regNumber: '09AABCD3322E1Z8',
        verified: true
      }
    ]
  },

  AYUSH_WELLNESS: {
    id: 'AYUSH_WELLNESS',
    label: 'Ayush & Panchakarma Wellness Centre',
    icon: '🌿',
    badge: 'Ayurveda & Panchakarma',
    description: 'Nadi Pariksha & Prakriti assessment, Panchakarma therapy room scheduling, classical herbal dispensary POS & lifestyle diet plans.',
    defaultPartnerName: 'AyurVeda Wellness & Panchakarma Rejuvenation Centre',
    defaultContactPerson: 'Dr. Acharya Shrinivas, BAMS, MD Ayur',
    defaultPhone: '9844455667',
    defaultEmail: 'ayush.shrinivas@docsearch.health',
    defaultPassword: 'AyushPass123!',
    defaultCity: 'Lucknow',
    defaultState: 'Uttar Pradesh',
    plans: [
      {
        id: 'ayush-vaidya',
        name: 'Solo Ayush Vaidya Practice',
        fee: 1799,
        description: 'Tridosha assessment, herbal prescription pad & appointment scheduling',
        badge: 'Solo Vaidya'
      },
      {
        id: 'ayush-panchakarma',
        name: 'Panchakarma Centre & Dispensary',
        fee: 4299,
        description: 'Panchakarma therapy room scheduler, classical herbal dispensary POS & Pathya-Apathya diet plans',
        badge: '⭐ Most Popular'
      },
      {
        id: 'ayush-resort',
        name: 'Ayush Inpatient Hospital & Rejuvenation Resort',
        fee: 8999,
        description: 'Multi-bed Panchakarma IPD, therapist shifts, Ministry of Ayush quality registers & wellness packages',
        badge: 'Ayush Resort'
      }
    ],
    availableFeatures: [
      { id: 'ayush_prakriti_engine', name: 'Digital Prakriti & Vikriti Tridosha Assessment Engine', default: true },
      { id: 'ayush_panchakarma_roster', name: 'Panchakarma Therapy Room, Therapist & Equipment Scheduler', default: true },
      { id: 'ayush_herbal_pos', name: 'Classical Ayurvedic Herbal Dispensary & Kashayam POS', default: true },
      { id: 'ayush_pathya_diet', name: 'Personalized Pathya-Apathya Diet & Lifestyle Prescription Pad', default: true },
      { id: 'ayush_nabh_protocol', name: 'Ministry of Ayush NABH Quality Protocol Compliance Registers', default: true },
      { id: 'ayush_whatsapp_care', name: 'WhatsApp Daily Therapy Preparation Instructions for Patients', default: false },
      { id: 'ayush_autoimmune_tracker', name: 'Long-Term Chronic Autoimmune Reversal Longitudinal Tracker', default: false }
    ],
    documents: [
      {
        id: 'doc-ayush-1',
        name: 'Ministry of Ayush / State Ayurvedic Board Registration (BAMS/MD Ayur)',
        type: 'DOCTOR_REGISTRATION',
        fileUploaded: true,
        fileName: 'Acharya_Shrinivas_BAMS_Reg.pdf',
        regNumber: 'AYUR-UP-2026-3301',
        verified: true
      },
      {
        id: 'doc-ayush-2',
        name: 'Clinical Establishment Registration (Ayush Category)',
        type: 'CLINICAL_ESTABLISHMENT',
        fileUploaded: true,
        fileName: 'Ayush_Clinical_Establishment_Reg.pdf',
        regNumber: 'CEA-AYUSH-2026-441',
        verified: true
      },
      {
        id: 'doc-ayush-3',
        name: 'Ayurvedic Herbal Pharmacy / Dispensing Drug License',
        type: 'DRUG_LICENSE',
        fileUploaded: true,
        fileName: 'Ayurvedic_Dispensary_License.pdf',
        regNumber: 'AYUR-DISP-2026-12',
        verified: true
      },
      {
        id: 'doc-ayush-4',
        name: 'Ayush Centre Trade License & GST Certificate',
        type: 'GST_PAN',
        fileUploaded: true,
        fileName: 'AyurVeda_Wellness_GST.pdf',
        regNumber: '09AAACA4455B1Z9',
        verified: true
      }
    ]
  },

  DIALYSIS_CENTRE: {
    id: 'DIALYSIS_CENTRE',
    label: 'Dialysis & Renal Care Hub',
    icon: '💧',
    badge: 'Hemodialysis Stations',
    description: 'Real-time hemodialysis bed/station monitoring, Kt/V urea clearance calculator, dialyzer reuse barcoding, RO water quality logs.',
    defaultPartnerName: 'Apex Renal & Hemodialysis Care Hub',
    defaultContactPerson: 'Dr. Arvind Shenoy, MD, DM Nephrology',
    defaultPhone: '9855566778',
    defaultEmail: 'nephro.arvind@docsearch.health',
    defaultPassword: 'NephroPass123!',
    defaultCity: 'Lucknow',
    defaultState: 'Uttar Pradesh',
    plans: [
      {
        id: 'dialysis-clinic',
        name: 'Standalone Dialysis Centre (10 Stations)',
        fee: 5999,
        description: 'Hemodialysis station shift scheduler, patient pre/post weight log & session summary PDF',
        badge: 'Clinic Hub'
      },
      {
        id: 'dialysis-hub',
        name: 'Advanced Renal Hub & Critical Dialysis (25 Stations)',
        fee: 11999,
        description: 'Kt/V urea clearance adequacy calculator, dialyzer reuse barcode audit & RO water daily quality log',
        badge: '⭐ Most Popular'
      },
      {
        id: 'dialysis-network',
        name: 'Multi-Centre Dialysis Hospital Chain',
        fee: 24999,
        description: 'PMNDP national scheme sync, AV fistula surveillance, ICU CRRT sync & multi-branch renal network',
        badge: 'Renal Enterprise'
      }
    ],
    availableFeatures: [
      { id: 'dialysis_station_matrix', name: 'Real-Time Hemodialysis Station Bed Matrix & Shift Scheduler', default: true },
      { id: 'dialysis_ktv_calculator', name: 'Kt/V Urea Kinetic Clearance & Dialysis Adequacy Calculator', default: true },
      { id: 'dialysis_dialyzer_barcode', name: 'Dialyzer Reprocessing & Reuse Barcode Tracking (AAMI Compliant)', default: true },
      { id: 'dialysis_ro_water_log', name: 'Reverse Osmosis (RO) Water Quality & Endotoxin Daily Log', default: true },
      { id: 'dialysis_fistula_care', name: 'Arteriovenous (AV) Fistula Health & Cannulation Surveillance', default: true },
      { id: 'dialysis_pmndp_sync', name: 'PMNDP (Pradhan Mantri National Dialysis Programme) Portal Sync', default: false },
      { id: 'dialysis_dry_weight_alert', name: 'Automated WhatsApp Pre-Dialysis Dry Weight & Fluid Check Alerts', default: false }
    ],
    documents: [
      {
        id: 'doc-dialysis-1',
        name: 'Clinical Establishment Act Registration for Dialysis Facility',
        type: 'CLINICAL_ESTABLISHMENT',
        fileUploaded: true,
        fileName: 'Dialysis_Facility_CEA_Reg.pdf',
        regNumber: 'CEA-DIA-2026-778',
        verified: true
      },
      {
        id: 'doc-dialysis-2',
        name: 'Senior Nephrologist State Medical Council Degree Certificate (DM Nephro)',
        type: 'DOCTOR_REGISTRATION',
        fileUploaded: true,
        fileName: 'Dr_Arvind_Shenoy_DM_Nephro.pdf',
        regNumber: 'MCI-NEPH-88902',
        verified: true
      },
      {
        id: 'doc-dialysis-3',
        name: 'NABH Dialysis Quality & Bio-Medical Waste Authorization',
        type: 'NABH_ACCREDITATION',
        fileUploaded: true,
        fileName: 'Dialysis_NABH_BMW_Authorization.pdf',
        regNumber: 'NABH-DIA-2026-302',
        verified: true
      },
      {
        id: 'doc-dialysis-4',
        name: 'Dialysis Centre Trade License & GST Certificate',
        type: 'GST_PAN',
        fileUploaded: true,
        fileName: 'Apex_Renal_GST_Certificate.pdf',
        regNumber: '09AABCN6677D1Z1',
        verified: true
      }
    ]
  },

  EYE_CARE: {
    id: 'EYE_CARE',
    label: 'Eye Care & Laser Vision Hospital',
    icon: '👁️',
    badge: 'Ophthalmology & Lasik',
    description: 'Auto-refraction Snellen charts, IOL power biometry calculator, slit lamp imaging, cataract surgical package billing & optical POS.',
    defaultPartnerName: 'Apex Vision & Eye Laser Care Hospital',
    defaultContactPerson: 'Dr. Radhika Iyer, MS Ophthalmology',
    defaultPhone: '9866677889',
    defaultEmail: 'eye.radhika@docsearch.health',
    defaultPassword: 'EyePass123!',
    defaultCity: 'Lucknow',
    defaultState: 'Uttar Pradesh',
    plans: [
      {
        id: 'eye-clinic',
        name: 'Solo Optometry & Eye OPD',
        fee: 2499,
        description: 'Auto-refraction, digital prescription, spectacle power prescription & appointment queue',
        badge: 'Solo OPD'
      },
      {
        id: 'eye-hospital',
        name: 'Day Care Eye Hospital & Cataract Centre',
        fee: 6999,
        description: 'IOL power biometry SRK-T, slit lamp capture, cataract package billing & optical dispensary POS',
        badge: '⭐ Most Popular'
      },
      {
        id: 'eye-network',
        name: 'Tertiary Laser Eye Surgery Network',
        fee: 14999,
        description: 'Lasik refractive suite, diabetic retinopathy screening AI, glaucoma IOP progression & multi-branch optical sync',
        badge: 'Laser Network'
      }
    ],
    availableFeatures: [
      { id: 'eye_snellen_refraction', name: 'Digital Snellen Visual Acuity & Auto-Refraction Capture', default: true },
      { id: 'eye_slit_lamp_img', name: 'Slit Lamp Anterior Segment Photo & Retinal Fundus Attachment', default: true },
      { id: 'eye_biometry_srkt', name: 'IOL Power Biometry SRK-T Calculator for Cataract Surgeries', default: true },
      { id: 'eye_optical_pos', name: 'Optical Dispensing POS with Frame & Lens Prescription Sync', default: true },
      { id: 'eye_iop_glaucoma', name: 'Intraocular Pressure (IOP) Tonometry Glaucoma Progression Chart', default: true },
      { id: 'eye_whatsapp_eyedrops', name: 'WhatsApp Post-Operative Eye Drop Instillation Alarm Schedule', default: false },
      { id: 'eye_ai_retinopathy', name: 'Diabetic Retinopathy AI Screening Integration', default: false }
    ],
    documents: [
      {
        id: 'doc-eye-1',
        name: 'State Medical Council Eye Surgeon Registration Certificate (MS/DNB Opht)',
        type: 'DOCTOR_REGISTRATION',
        fileUploaded: true,
        fileName: 'Dr_Radhika_Iyer_MS_Ophth.pdf',
        regNumber: 'MCI-EYE-66712',
        verified: true
      },
      {
        id: 'doc-eye-2',
        name: 'Clinical Establishment Act Registration for Eye Hospital',
        type: 'CLINICAL_ESTABLISHMENT',
        fileUploaded: true,
        fileName: 'Eye_Hospital_CEA_Registration.pdf',
        regNumber: 'CEA-EYE-2026-904',
        verified: true
      },
      {
        id: 'doc-eye-3',
        name: 'Laser Eye Safety & NABH Eye Care Accreditation',
        type: 'NABH_ACCREDITATION',
        fileUploaded: true,
        fileName: 'NABH_Eye_Care_Safety_Cert.pdf',
        regNumber: 'NABH-EYE-2026-442',
        verified: true
      },
      {
        id: 'doc-eye-4',
        name: 'Optical & Eye Hospital Commercial Trade License & GST Certificate',
        type: 'GST_PAN',
        fileUploaded: true,
        fileName: 'Apex_Vision_GST_Certificate.pdf',
        regNumber: '09AABCI8899A1Z6',
        verified: true
      }
    ]
  },

  PHYSIOTHERAPY: {
    id: 'PHYSIOTHERAPY',
    label: 'Physiotherapy & Rehabilitation Clinic',
    icon: '🏃',
    badge: 'Sports Rehab & ROM',
    description: 'Range of motion (ROM) goniometry, muscle strength grading (MMT), customized exercise prescription videos & package billing.',
    defaultPartnerName: 'Apex Motion Physiotherapy & Sports Rehab Centre',
    defaultContactPerson: 'Dr. Pooja Mishra, BPT, MPT (Ortho Rehab)',
    defaultPhone: '9877788990',
    defaultEmail: 'physio.pooja@docsearch.health',
    defaultPassword: 'PhysioPass123!',
    defaultCity: 'Lucknow',
    defaultState: 'Uttar Pradesh',
    plans: [
      {
        id: 'physio-solo',
        name: 'Solo Physiotherapy Practice',
        fee: 1699,
        description: 'Patient assessment notes, exercise chart PDF, appointment scheduling & SMS alerts',
        badge: 'Solo Physio'
      },
      {
        id: 'physio-rehab',
        name: 'Advanced Sports Rehab & Electrotherapy',
        fee: 3999,
        description: 'Digital ROM goniometry, MRC muscle strength grading, multi-session package billing & exercise video pad',
        badge: '⭐ Most Popular'
      },
      {
        id: 'physio-network',
        name: 'Multi-Centre Neuro-Ortho Rehab Chain',
        fee: 7999,
        description: 'Biomechanical gait analysis, FIM functional independence meter, sports injury RTP certification & multi-clinic sync',
        badge: 'Rehab Chain'
      }
    ],
    availableFeatures: [
      { id: 'physio_rom_goniometry', name: 'Digital Goniometry Joint Range of Motion (ROM) & Flexibility Assessment', default: true },
      { id: 'physio_mrc_strength', name: 'Medical Research Council (MRC) Muscle Strength Grading Chart', default: true },
      { id: 'physio_exercise_pad', name: 'Custom Physical Therapy Video Regimen Prescription for Patients', default: true },
      { id: 'physio_package_billing', name: 'Multi-Session Treatment Package Billing with Punch-Card Tracking', default: true },
      { id: 'physio_ergonomic_report', name: 'Ergonomic & Postural Assessment Biomechanical Report', default: true },
      { id: 'physio_whatsapp_reminders', name: 'WhatsApp Daily Home Exercise Reminder with Video Links', default: false },
      { id: 'physio_fim_neuro', name: 'Post-Stroke Neuro-Rehabilitation Functional Independence Measure (FIM)', default: false }
    ],
    documents: [
      {
        id: 'doc-physio-1',
        name: 'Indian Association of Physiotherapists (IAP) Registration Certificate',
        type: 'DOCTOR_REGISTRATION',
        fileUploaded: true,
        fileName: 'Dr_Pooja_Mishra_IAP_Reg.pdf',
        regNumber: 'IAP-PT-2026-1104',
        verified: true
      },
      {
        id: 'doc-physio-2',
        name: 'Clinical Establishment Registration for Physiotherapy Facility',
        type: 'CLINICAL_ESTABLISHMENT',
        fileUploaded: true,
        fileName: 'Physiotherapy_Facility_CEA_Reg.pdf',
        regNumber: 'CEA-PHY-2026-882',
        verified: true
      },
      {
        id: 'doc-physio-3',
        name: 'Electrotherapy Equipment Safety & Calibration Certificate',
        type: 'AERB_LICENSE',
        fileUploaded: true,
        fileName: 'Electrotherapy_Safety_Calibration.pdf',
        regNumber: 'CAL-PHY-2026-004',
        verified: true
      },
      {
        id: 'doc-physio-4',
        name: 'Physiotherapy Centre Commercial Trade License & GST Certificate',
        type: 'GST_PAN',
        fileUploaded: true,
        fileName: 'Apex_Motion_GST_Certificate.pdf',
        regNumber: '09AABCP1122M1Z0',
        verified: true
      }
    ]
  }
};

export const sanitizeIndianPhone = (raw: string): string => {
  let digits = (raw || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 10);
};

export interface UniversalPartnerOnboardingWizardProps {
  onComplete?: (res: ActivationResult) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const UniversalPartnerOnboardingWizard: React.FC<UniversalPartnerOnboardingWizardProps> = ({
  onComplete,
  onClose,
  isModal
}) => {
  const [selectedCategory, setSelectedCategory] = useState<HealthcareCategoryType>('PATHOLOGY');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activationResult, setActivationResult] = useState<ActivationResult | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);

  // Dynamic Master Database Plans State
  const [dbPlans, setDbPlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState<boolean>(true);
  const [planMode, setPlanMode] = useState<'SELECT_EXISTING' | 'CREATE_CUSTOM'>('SELECT_EXISTING');
  const [customPlanForm, setCustomPlanForm] = useState({
    name: 'Custom Facility Tier',
    monthlyFee: 4999,
    billingInterval: 'MONTHLY',
    maxDoctors: 10,
    maxBranches: 1,
    storageGb: 25,
    monthlyWhatsAppCredits: 1000,
    badge: 'Custom Config'
  });

  const getFilteredCategoryPlans = (plans: any[], category: HealthcareCategoryType) => {
    return plans.filter((plan) => {
      const v = (plan.metadata?.vertical || '').toUpperCase();
      const c = (plan.code || '').toUpperCase();
      if (category === 'HOSPITAL') return v === 'HOSPITAL' || c.includes('HOSP');
      if (category === 'CLINIC') return v === 'CLINIC' || (c.includes('CLINIC') && !c.includes('COMBO'));
      if (category === 'PHARMACY') return v === 'PHARMACY' || c.includes('PHARMA');
      if (category === 'PATHOLOGY') return v === 'PATHOLOGY' || (c.includes('PATH') && !c.includes('COMBO'));
      if (category === 'COMBO_CLINIC_PATHOLOGY') return v === 'COMBO_CLINIC_PATHOLOGY' || c.includes('COMBO_CP');
      if (category === 'COMBO_CLINIC_PHARMACY') return v === 'COMBO_CLINIC_PHARMACY' || c.includes('COMBO_CPR');
      if (category === 'DIAGNOSTIC_CENTRE') return v === 'PATHOLOGY' || c.includes('PATH') || c.includes('RADIO') || c.includes('DIAG');
      return v === category || c.includes(category);
    });
  };

  // Fetch real plans & features from Database API
  useEffect(() => {
    let isMounted = true;
    async function loadLivePlansAndFeatures() {
      setIsLoadingPlans(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
        const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
        const plansRes = await fetch('/api/v1/company/plans', { headers })
          .then((r) => r.json())
          .catch(() => ({ success: false, data: [] }));

        if (isMounted) {
          if (plansRes.success && Array.isArray(plansRes.data) && plansRes.data.length > 0) {
            setDbPlans(plansRes.data);
            const catPlans = getFilteredCategoryPlans(plansRes.data, selectedCategory);
            const targetPlan = catPlans.find((p) => p.basePrice === 0 || p.metadata?.basePrice === 0 || (p.code || '').includes('FREE')) || catPlans[0] || plansRes.data[0];
            const planPrice = targetPlan ? (targetPlan.metadata?.basePrice ?? targetPlan.basePrice ?? 0) : 0;
            setFormData((prev) => ({
              ...prev,
              planTier: targetPlan.name,
              monthlyFee: planPrice,
              planId: targetPlan.id,
              billingInterval: targetPlan.billingInterval || 'ANNUAL',
              quotas: {
                maxDoctors: targetPlan.maxDoctors || targetPlan.metadata?.maxDoctors || 5,
                maxBranches: targetPlan.maxBranches || targetPlan.metadata?.maxBranches || 1,
                monthlyWhatsAppCredits: targetPlan.monthlyWhatsAppCredits || targetPlan.metadata?.whatsAppQuota || 1500,
                storageQuotaGb: targetPlan.storageQuotaGb || targetPlan.metadata?.storageGb || 20
              }
            }));
          }
        }
      } catch (err) {
        console.warn('Could not load live plans and features:', err);
      } finally {
        if (isMounted) setIsLoadingPlans(false);
      }
    }
    void loadLivePlansAndFeatures();
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize form data from preset (1st Year 100% Free Plan Default)
  const initialPreset = HEALTHCARE_PRESETS.PATHOLOGY;
  const [formData, setFormData] = useState<UniversalOnboardingData>({
    partnerName: initialPreset.defaultPartnerName,
    classification: 'PATHOLOGY',
    contactPerson: initialPreset.defaultContactPerson,
    phone: sanitizeIndianPhone(initialPreset.defaultPhone),
    email: initialPreset.defaultEmail,
    password: initialPreset.defaultPassword,
    city: initialPreset.defaultCity,
    state: initialPreset.defaultState,
    streetAddress: '',
    pincode: '',
    agreementAccepted: false,
    documents: initialPreset.documents,
    planTier: initialPreset.plans[0]?.name || 'Pathology Founding Partner (1st Year Free)',
    monthlyFee: initialPreset.plans[0]?.fee ?? 0,
    planId: initialPreset.plans[0]?.id || 'path-free-yr1',
    billingInterval: 'ANNUAL',
    features: initialPreset.availableFeatures.filter((f) => f.default).map((f) => f.name)
  });

  const [showPassword, setShowPassword] = useState(false);
  const [kycStatus, setKycStatus] = useState<'PENDING' | 'VERIFIED'>('VERIFIED');

  // Handle category change
  const handleSelectCategory = (cat: HealthcareCategoryType) => {
    setSelectedCategory(cat);
    const preset = HEALTHCARE_PRESETS[cat];
    const catPlans = getFilteredCategoryPlans(dbPlans, cat);
    // Find Plan 1 (Free 1st Year) or fallback to first plan
    const targetPlan = catPlans.find((p) => p.basePrice === 0 || p.metadata?.basePrice === 0 || (p.code || '').includes('FREE')) || catPlans[0];
    const planPrice = targetPlan ? (targetPlan.metadata?.basePrice ?? targetPlan.basePrice ?? 0) : preset.plans[0]?.fee ?? 0;
    const planName = targetPlan ? targetPlan.name : preset.plans[0]?.name || `${preset.label} Founding Partner (1st Year Free)`;

    // MULTI-SPECIALTY HOSPITAL: All departments and modules MUST BE PRE-SELECTED!
    const selectedFeatures = cat === 'HOSPITAL'
      ? preset.availableFeatures.map((f) => f.name)
      : preset.availableFeatures.filter((f) => f.default).map((f) => f.name);

    setFormData((prev) => ({
      ...prev,
      partnerName: preset.defaultPartnerName,
      classification: cat,
      contactPerson: preset.defaultContactPerson,
      phone: sanitizeIndianPhone(preset.defaultPhone),
      email: preset.defaultEmail,
      password: preset.defaultPassword,
      city: preset.defaultCity,
      state: preset.defaultState,
      streetAddress: prev.streetAddress || '',
      pincode: prev.pincode || '',
      agreementAccepted: false,
      documents: preset.documents,
      planTier: planName,
      monthlyFee: planPrice,
      planId: targetPlan?.id || preset.plans[0]?.id || 'dynamic-plan',
      billingInterval: targetPlan?.billingInterval || 'ANNUAL',
      quotas: {
        maxDoctors: targetPlan?.maxDoctors || targetPlan?.metadata?.maxDoctors || (cat === 'HOSPITAL' ? 50 : 5),
        maxBranches: targetPlan?.maxBranches || targetPlan?.metadata?.maxBranches || (cat === 'HOSPITAL' ? 3 : 1),
        monthlyWhatsAppCredits: targetPlan?.monthlyWhatsAppCredits || targetPlan?.metadata?.whatsAppQuota || (cat === 'HOSPITAL' ? 10000 : 1500),
        storageQuotaGb: targetPlan?.storageQuotaGb || targetPlan?.metadata?.storageGb || (cat === 'HOSPITAL' ? 200 : 20)
      },
      features: selectedFeatures
    }));
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
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('docsearch_company_token') || localStorage.getItem('docsearch_auth_token'))
        : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch('/api/v1/company/partners/complete-onboarding-activation', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          partnerName: formData.partnerName,
          classification: formData.classification,
          contactPerson: formData.contactPerson,
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
          city: formData.city,
          state: formData.state,
          streetAddress: formData.streetAddress || '',
          pincode: formData.pincode || '',
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
          case 'CLINIC':
          case 'COMBO_CLINIC_PATHOLOGY':
          case 'COMBO_CLINIC_PHARMACY': return 'CLINIC_DOCTOR';
          case 'DIAGNOSTIC_CENTRE': return 'RADIOLOGIST';
          case 'BLOOD_BANK': return 'BLOOD_BANK_OFFICER';
          case 'DENTAL_CLINIC': return 'DENTIST';
          case 'AYUSH_WELLNESS': return 'AYURVEDIC_VAIDYA';
          case 'DIALYSIS_CENTRE': return 'NEPHROLOGIST';
          case 'EYE_CARE': return 'OPHTHALMOLOGIST';
          case 'PHYSIOTHERAPY': return 'PHYSIOTHERAPIST';
          case 'PATHOLOGY':
          default: return 'PATHOLOGIST';
        }
      };

      const getCategoryLoginUrl = (cat: HealthcareCategoryType) => {
        switch (cat) {
          case 'HOSPITAL': return '/hospital';
          case 'PHARMACY': return '/pharmacy';
          case 'CLINIC':
          case 'COMBO_CLINIC_PATHOLOGY':
          case 'COMBO_CLINIC_PHARMACY': return '/clinic';
          case 'DIAGNOSTIC_CENTRE': return '/radiology';
          case 'BLOOD_BANK': return '/hospital/blood-bank';
          case 'DENTAL_CLINIC': return '/clinic/consultation';
          case 'AYUSH_WELLNESS': return '/clinic/consultation';
          case 'DIALYSIS_CENTRE': return '/hospital/inpatient';
          case 'EYE_CARE': return '/clinic/consultation';
          case 'PHYSIOTHERAPY': return '/clinic/consultation';
          case 'PATHOLOGY':
          default: return '/pathology';
        }
      };

      // Compute 365-day 1st Year Free renewal date
      const expiryDateObj = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const planExpiryFormatted = expiryDateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      if (res.ok && json.data) {
        resultData = {
          ...json.data,
          subscriptionPlan: {
            ...json.data.subscriptionPlan,
            planExpiryDate: json.data.subscriptionPlan?.planExpiryDate || json.data.subscriptionPlan?.expiryDate || planExpiryFormatted,
            expiryDate: json.data.subscriptionPlan?.expiryDate || planExpiryFormatted
          },
          credentials: {
            ...json.data.credentials,
            planExpiryDate: json.data.credentials?.planExpiryDate || json.data.subscriptionPlan?.expiryDate || planExpiryFormatted
          }
        };
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
            activeFeatures: formData.features,
            planExpiryDate: planExpiryFormatted,
            expiryDate: planExpiryFormatted
          },
          credentials: {
            loginUrl: `http://localhost:5173${getCategoryLoginUrl(formData.classification)}`,
            userId: formData.email,
            temporaryPassword: formData.password,
            role: getRoleByOrg(formData.classification),
            activatedAt: new Date().toISOString(),
            planExpiryDate: planExpiryFormatted
          }
        };
      }

      // 2. Persist in shared localStorage so Partner Platform on port 5173 detects it instantly
      const storedPartners = JSON.parse(localStorage.getItem('docsearch_live_partners') || '[]');
      const updatedList = [resultData, ...storedPartners.filter((p: any) => p.credentials?.userId !== resultData.credentials.userId)];
      localStorage.setItem('docsearch_live_partners', JSON.stringify(updatedList));

      // Also persist in docsearch_registered_partners for full Directory and CRM synchronization
      try {
        const storedRegPartners = JSON.parse(localStorage.getItem('docsearch_registered_partners') || '[]');
        const newRegEntry = {
          id: resultData.partnerId,
          facilityName: formData.partnerName,
          tradeName: formData.partnerName,
          legalName: formData.partnerName,
          name: formData.contactPerson,
          contactPerson: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          organizationType: formData.classification,
          partnerType: (
            formData.classification === 'HOSPITAL'
              ? 'HOSPITAL_NETWORK'
              : formData.classification === 'PHARMACY'
              ? 'PHARMACY'
              : formData.classification === 'PATHOLOGY' || formData.classification === 'DIAGNOSTIC_CENTRE'
              ? 'DIAGNOSTIC_LAB'
              : 'CLINIC_GROUP'
          ),
          planTier: formData.planTier,
          monthlyFee: formData.monthlyFee,
          features: formData.features,
          status: 'APPROVED',
          lifecycleStatus: 'ACTIVE',
          verificationStatus: 'VERIFIED',
          kycStatus: 'KYC_VERIFIED',
          onboardingStep: 'COMPLETED',
          onboardingProgressPercent: 100,
          city: formData.city,
          credentials: resultData.credentials,
          createdAt: new Date().toISOString()
        };
        const updatedRegList = [newRegEntry, ...storedRegPartners.filter((p: any) => p.email !== formData.email && p.id !== resultData.partnerId)];
        localStorage.setItem('docsearch_registered_partners', JSON.stringify(updatedRegList));
      } catch (e) {
        console.warn('Local storage sync error:', e);
      }

      // Also register credentials into partner staff login cache with category-specific workspace config
      const customUsers = JSON.parse(localStorage.getItem('docsearch_custom_partner_users') || '[]');
      const primaryRole = getRoleByOrg(formData.classification);

      const getModuleByOrg = (cat: HealthcareCategoryType) => {
        switch (cat) {
          case 'HOSPITAL': return 'inpatient-management';
          case 'PHARMACY': return 'pharmacy-medication';
          case 'CLINIC':
          case 'COMBO_CLINIC_PATHOLOGY':
          case 'COMBO_CLINIC_PHARMACY': return 'clinical-consultation';
          case 'DIAGNOSTIC_CENTRE': return 'radiology-imaging';
          case 'BLOOD_BANK': return 'blood-bank-transfusion';
          case 'DENTAL_CLINIC': return 'clinical-consultation';
          case 'AYUSH_WELLNESS': return 'clinical-consultation';
          case 'DIALYSIS_CENTRE': return 'inpatient-management';
          case 'EYE_CARE': return 'clinical-consultation';
          case 'PHYSIOTHERAPY': return 'clinical-consultation';
          case 'PATHOLOGY':
          default: return 'clinical-investigation';
        }
      };

      const getDeptByOrg = (cat: HealthcareCategoryType) => {
        switch (cat) {
          case 'COMBO_CLINIC_PATHOLOGY': return 'OPD Clinical Consultation & In-House Diagnostic Lab';
          case 'COMBO_CLINIC_PHARMACY': return 'OPD Clinical Consultation & In-House Pharmacy POS';
          case 'HOSPITAL': return 'Hospital Administration & Inpatient Governance';
          case 'PHARMACY': return 'Pharmacy POS & Stock Inwarding';
          case 'CLINIC': return 'Outpatient Clinic & Clinical Consultation';
          case 'DIAGNOSTIC_CENTRE': return 'Radiology, MRI, CT & Imaging';
          case 'BLOOD_BANK': return 'Blood Bank & Component Separation Unit';
          case 'DENTAL_CLINIC': return 'Dental Surgery & Maxillofacial Care';
          case 'AYUSH_WELLNESS': return 'Ayush, Panchakarma & Holistic Wellness';
          case 'DIALYSIS_CENTRE': return 'Nephrology & Hemodialysis Unit';
          case 'EYE_CARE': return 'Ophthalmology & Refractive Surgery';
          case 'PHYSIOTHERAPY': return 'Physiotherapy, Ergonomics & Sports Rehab';
          case 'PATHOLOGY':
          default: return 'Pathology & Diagnostic Laboratory';
        }
      };

      const getWorkspaceByOrg = (cat: HealthcareCategoryType): string[] => {
        switch (cat) {
          case 'HOSPITAL':
          case 'BLOOD_BANK':
          case 'DIALYSIS_CENTRE':
            return ['HOSPITAL'];
          case 'PHARMACY':
            return ['PHARMACY'];
          case 'PATHOLOGY':
            return ['PATHOLOGY'];
          case 'DIAGNOSTIC_CENTRE':
            return ['DIAGNOSTIC_CENTRE'];
          case 'COMBO_CLINIC_PATHOLOGY':
            return ['CLINIC', 'PATHOLOGY'];
          case 'COMBO_CLINIC_PHARMACY':
            return ['CLINIC', 'PHARMACY'];
          case 'CLINIC':
          case 'DENTAL_CLINIC':
          case 'AYUSH_WELLNESS':
          case 'EYE_CARE':
          case 'PHYSIOTHERAPY':
          default:
            return ['CLINIC'];
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
        allowedWorkspaces: getWorkspaceByOrg(formData.classification),
        defaultModule: getModuleByOrg(formData.classification),
        planTier: formData.planTier,
        planExpiryDate: resultData.credentials?.planExpiryDate || planExpiryFormatted,
        accessibleFeatures: formData.features,
        restrictedFeatures: formData.classification === 'HOSPITAL' ? ['None (Full Hospital Scope)'] : ['Hospital IPD Wards']
      };
      try {
        localStorage.setItem('docsearch_custom_partner_users', JSON.stringify([newCustomUser, ...customUsers.filter((u: any) => u.email !== formData.email)]));
      } catch {}
      // Also register in-memory in partnerService for instant CRM Directory display
      try {
        partnerService.addPartner({
          id: resultData.partnerId,
          tenantId: resultData.partnerId,
          tenantSlug: formData.partnerName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          legalName: formData.partnerName,
          tradeName: formData.partnerName,
          partnerType: (
            formData.classification === 'HOSPITAL'
              ? 'HOSPITAL_NETWORK'
              : formData.classification === 'PHARMACY'
              ? 'PHARMACY'
              : formData.classification === 'PATHOLOGY' || formData.classification === 'DIAGNOSTIC_CENTRE'
              ? 'DIAGNOSTIC_LAB'
              : 'CLINIC_GROUP'
          ) as any,
          lifecycleStatus: 'ACTIVE',
          verificationStatus: 'VERIFIED',
          onboardingStep: 'COMPLETED',
          onboardingProgressPercent: 100,
          primaryContact: {
            name: formData.contactPerson,
            email: formData.email,
            phone: formData.phone,
            roleTitle: primaryRole
          },
          branchCount: 1,
          userCount: 5,
          metadata: {
            classification: formData.classification,
            city: formData.city,
            planTier: formData.planTier,
            monthlyFee: formData.monthlyFee,
            activeFeatures: formData.features,
            temporaryPassword: resultData.credentials?.temporaryPassword,
            loginUrl: resultData.credentials?.loginUrl,
            activationVoucher: resultData.partnerId
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Failed to add to in-memory partnerService:', err);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('docsearch:partner_registered', { detail: resultData }));
        window.dispatchEvent(new Event('storage'));
      }

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: isModal ? '16px' : '20px' }}>
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
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                color: '#F87171',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.8125rem',
                fontWeight: 800,
                cursor: 'pointer',
                marginLeft: '8px'
              }}
              title="Close Onboarding Wizard"
            >
              ✕ Exit
            </button>
          )}
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
                  Aap kis category ka healthcare partner live add karna chahte hain select karein (Hospital, Clinic, Pathology, Pharmacy):
                </span>
              </div>
              <Badge variant="primary">Stage 1 of 5</Badge>
            </div>

            {/* CATEGORY SWITCHER CARDS (STRICT 4 CANONICAL PROFILES) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.75rem', color: '#CBD5E1', fontWeight: 800 }}>
                  CANONICAL HEALTHCARE PROFILES (4 KEY VERTICALS):
                </label>
                <span style={{ fontSize: '0.75rem', color: '#06B6D4', fontWeight: 700 }}>
                  Selected: <strong>{HEALTHCARE_PRESETS[selectedCategory]?.label}</strong>
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {(['HOSPITAL', 'CLINIC', 'PATHOLOGY', 'PHARMACY'] as HealthcareCategoryType[]).map((catKey) => {
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
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 0 15px rgba(6, 182, 212, 0.2)' : 'none'
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
                    ? 'DOCTOR CLINIC / PRACTICE NAME *'
                    : selectedCategory === 'COMBO_CLINIC_PATHOLOGY'
                    ? 'POLYCLINIC & PATHOLOGY LAB NAME *'
                    : selectedCategory === 'COMBO_CLINIC_PHARMACY'
                    ? 'CLINIC & PHARMACY NAME *'
                    : selectedCategory === 'DIAGNOSTIC_CENTRE'
                    ? 'DIAGNOSTIC & RADIOLOGY CENTRE NAME *'
                    : selectedCategory === 'BLOOD_BANK'
                    ? 'BLOOD BANK & TRANSFUSION CENTRE NAME *'
                    : selectedCategory === 'DENTAL_CLINIC'
                    ? 'DENTAL CLINIC & MAXILLOFACIAL CENTRE NAME *'
                    : selectedCategory === 'AYUSH_WELLNESS'
                    ? 'AYUSH & PANCHAKARMA WELLNESS CENTRE NAME *'
                    : selectedCategory === 'DIALYSIS_CENTRE'
                    ? 'DIALYSIS & RENAL CARE HUB NAME *'
                    : selectedCategory === 'EYE_CARE'
                    ? 'EYE CARE & LASER VISION HOSPITAL NAME *'
                    : selectedCategory === 'PHYSIOTHERAPY'
                    ? 'PHYSIOTHERAPY & REHAB CLINIC NAME *'
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
                    : selectedCategory === 'COMBO_CLINIC_PATHOLOGY'
                    ? 'LEAD CONSULTING DOCTOR / LAB DIRECTOR *'
                    : selectedCategory === 'COMBO_CLINIC_PHARMACY'
                    ? 'LEAD CONSULTING DOCTOR / CHIEF PHARMACIST *'
                    : selectedCategory === 'DIAGNOSTIC_CENTRE'
                    ? 'CHIEF RADIOLOGIST / DIRECTOR NAME *'
                    : selectedCategory === 'BLOOD_BANK'
                    ? 'TRANSFUSION MEDICINE MEDICAL OFFICER *'
                    : selectedCategory === 'DENTAL_CLINIC'
                    ? 'CHIEF DENTAL SURGEON / ORTHODONTIST *'
                    : selectedCategory === 'AYUSH_WELLNESS'
                    ? 'SENIOR AYURVEDIC VAIDYA / PANCHAKARMA LEAD *'
                    : selectedCategory === 'DIALYSIS_CENTRE'
                    ? 'CONSULTANT NEPHROLOGIST / CLINICAL LEAD *'
                    : selectedCategory === 'EYE_CARE'
                    ? 'CHIEF OPHTHALMOLOGIST / EYE SURGEON *'
                    : selectedCategory === 'PHYSIOTHERAPY'
                    ? 'CONSULTANT PHYSIOTHERAPIST / REHAB LEAD *'
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
                  CONTACT PHONE (STANDARD 10-DIGIT MOBILE) *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '12px',
                      color: '#38BDF8',
                      fontWeight: 800,
                      fontSize: '0.875rem',
                      userSelect: 'none',
                      pointerEvents: 'none'
                    }}
                  >
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={sanitizeIndianPhone(formData.phone)}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: sanitizeIndianPhone(e.target.value) });
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 48px',
                      borderRadius: '8px',
                      backgroundColor: '#1E293B',
                      border: formData.phone.length === 10 && /^[6-9]/.test(formData.phone)
                        ? '1px solid #10B981'
                        : formData.phone.length > 0
                        ? '1px solid #EF4444'
                        : '1px solid #475569',
                      color: '#F8FAFC',
                      fontSize: '0.875rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.04em'
                    }}
                    placeholder="9876543210"
                  />
                  {formData.phone.length > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        right: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: formData.phone.length === 10 && /^[6-9]/.test(formData.phone) ? '#10B981' : '#EF4444'
                      }}
                    >
                      {formData.phone.length === 10 && /^[6-9]/.test(formData.phone) ? '✓ 10-Digit' : `${formData.phone.length}/10`}
                    </span>
                  )}
                </div>
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
                  STREET ADDRESS / PREMISES *
                </label>
                <input
                  type="text"
                  value={formData.streetAddress || ''}
                  onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #475569',
                    color: '#F8FAFC',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Plot 42, Health City, Sector 5"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, marginBottom: '6px' }}>
                  PIN CODE (6 DIGITS) *
                </label>
                <input
                  type="text"
                  value={formData.pincode || ''}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  maxLength={6}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #475569',
                    color: '#F8FAFC',
                    fontSize: '0.875rem'
                  }}
                  placeholder="110001"
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
                disabled={!formData.partnerName || !formData.email || !formData.contactPerson || !formData.phone || formData.phone.length !== 10 || !/^[6-9]/.test(formData.phone)}
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
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Button variant="outline" onClick={handleVerifyAllDocs}>
                  ⚡ Auto-Verify All Documents
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setCurrentStep(3)}
                  disabled={formData.documents.some((d) => !d.verified)}
                  title={formData.documents.some((d) => !d.verified) ? 'Please verify all required regulatory documents first' : ''}
                >
                  Next ➔ Step 3: Subscription & Feature Allocation
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 3: SUBSCRIPTION PLAN & FEATURE CUSTOMIZATION (100% DYNAMIC - ZERO HARDCODED PRESETS) */}
      {currentStep === 3 && (
        <Card>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#F8FAFC', fontWeight: 800 }}>
                  💎 Step 3: Subscription Plan & Live Capabilities Allocation
                </h3>
                <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                  Select from authoritative master database plans or build a custom tier with self-selected pricing & capabilities.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('docsearch_switch_crm_tab', { detail: 'PLANS' }));
                    }
                  }}
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid #38BDF8',
                    color: '#38BDF8',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                  title="Open Master Subscription Plans Manager"
                >
                  ⚙️ Master Plans Manager ➔
                </button>
                <Badge variant="primary">Stage 3 of 5</Badge>
              </div>
            </div>

            {/* Mode Switcher: Live Master DB Plans vs Self-Configured Custom Plan */}
            <div style={{ display: 'flex', gap: '8px', padding: '4px', backgroundColor: '#0B1329', border: '1px solid #1E293B', borderRadius: '10px', width: 'fit-content' }}>
              <button
                type="button"
                onClick={() => setPlanMode('SELECT_EXISTING')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: planMode === 'SELECT_EXISTING' ? '1px solid #06B6D4' : '1px solid transparent',
                  backgroundColor: planMode === 'SELECT_EXISTING' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                  color: planMode === 'SELECT_EXISTING' ? '#38BDF8' : '#94A3B8',
                  fontWeight: 800,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                📋 Master Database Plans ({getFilteredCategoryPlans(dbPlans, selectedCategory).length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlanMode('CREATE_CUSTOM');
                  setFormData((prev) => ({
                    ...prev,
                    planTier: customPlanForm.name,
                    monthlyFee: customPlanForm.monthlyFee,
                    planId: 'custom-tier',
                    billingInterval: customPlanForm.billingInterval,
                    quotas: {
                      maxDoctors: customPlanForm.maxDoctors,
                      maxBranches: customPlanForm.maxBranches,
                      monthlyWhatsAppCredits: customPlanForm.monthlyWhatsAppCredits,
                      storageQuotaGb: customPlanForm.storageGb
                    }
                  }));
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: planMode === 'CREATE_CUSTOM' ? '1px solid #10B981' : '1px solid transparent',
                  backgroundColor: planMode === 'CREATE_CUSTOM' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                  color: planMode === 'CREATE_CUSTOM' ? '#34D399' : '#94A3B8',
                  fontWeight: 800,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                ✍️ Custom Plan & Pricing (Configure Myself)
              </button>
            </div>

            {/* Founding Partner 1st Year Free Launch Benefit */}
            <div style={{ padding: '14px 18px', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1.5px solid #10B981', borderRadius: '12px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.75rem' }}>🎁</span>
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#10B981' }}>
                    Founding Partner Launch Benefit: 1st Year 100% Free
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px' }}>
                    New onboarded partners pay ₹0 license fees for 365 days. Next year payment terms (Half-Yearly, 1Y, 2Y, 3Y, 5Y) are pre-configured and negotiable from HQ.
                  </div>
                </div>
              </div>
              <span style={{ backgroundColor: '#10B981', color: '#070C16', padding: '4px 12px', borderRadius: '6px', fontWeight: 900, fontSize: '0.75rem' }}>
                365 Days Free
              </span>
            </div>

            {/* Mode 1: Authoritative 2-Plan Template (STRICTLY FILTERED FOR SELECTED CATEGORY) */}
            {planMode === 'SELECT_EXISTING' && (() => {
              const filteredCategoryPlans = getFilteredCategoryPlans(dbPlans, selectedCategory);
              const displayPlans = filteredCategoryPlans.length > 0
                ? filteredCategoryPlans
                : currentPreset.plans.map((p) => ({
                    id: p.id,
                    name: p.name,
                    code: p.id.toUpperCase(),
                    description: p.description,
                    basePrice: p.fee,
                    billingInterval: 'ANNUAL',
                    maxDoctors: selectedCategory === 'HOSPITAL' ? (p.fee === 0 ? 50 : 100) : (p.fee === 0 ? 5 : 10),
                    maxBranches: selectedCategory === 'HOSPITAL' ? (p.fee === 0 ? 3 : 5) : (p.fee === 0 ? 1 : 2),
                    monthlyWhatsAppCredits: selectedCategory === 'HOSPITAL' ? (p.fee === 0 ? 10000 : 25000) : (p.fee === 0 ? 2500 : 10000),
                    storageQuotaGb: selectedCategory === 'HOSPITAL' ? (p.fee === 0 ? 200 : 500) : (p.fee === 0 ? 25 : 100),
                    metadata: {
                      basePrice: p.fee,
                      badge: p.badge,
                      vertical: selectedCategory,
                      isFirstYearFreeEligible: p.fee === 0
                    }
                  }));

              let renewalPriceText = '';
              if (selectedCategory === 'HOSPITAL') renewalPriceText = '₹30,000 / year';
              else if (selectedCategory === 'CLINIC') renewalPriceText = '₹20,000 / year';
              else if (selectedCategory === 'PHARMACY' || selectedCategory === 'PATHOLOGY') renewalPriceText = '₹10,000 / year';
              else renewalPriceText = '₹25,000 / year';

              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.8125rem', color: '#CBD5E1', fontWeight: 800 }}>
                      {currentPreset.label.toUpperCase()} SUBSCRIPTION PLANS (EXACTLY 2 PLANS - 1ST YEAR FREE & 2ND YEAR RENEWAL):
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#38BDF8' }}>
                      Selected: <strong>{formData.planTier}</strong>
                    </span>
                  </div>

                  {isLoadingPlans && filteredCategoryPlans.length === 0 ? (
                    <div style={{ padding: '30px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#94A3B8' }}>
                      <Spinner size="md" />
                      <span>Loading authoritative plans for {currentPreset.label}...</span>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                      {displayPlans.map((plan) => {
                        const isSelected = formData.planTier === plan.name || formData.planId === plan.id;
                        const planPrice = plan.metadata?.basePrice ?? plan.basePrice ?? 0;
                        const isFreeYear1 = planPrice === 0 || (plan.code || '').includes('FREE') || (plan.name || '').includes('Free');

                        return (
                          <div
                            key={plan.id}
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                planTier: plan.name,
                                monthlyFee: planPrice,
                                planId: plan.id,
                                billingInterval: plan.billingInterval || 'ANNUAL',
                                quotas: {
                                  maxDoctors: plan.maxDoctors || plan.metadata?.maxDoctors || (selectedCategory === 'HOSPITAL' ? (isFreeYear1 ? 50 : 100) : (isFreeYear1 ? 5 : 10)),
                                  maxBranches: plan.maxBranches || plan.metadata?.maxBranches || (selectedCategory === 'HOSPITAL' ? (isFreeYear1 ? 3 : 5) : (isFreeYear1 ? 1 : 2)),
                                  monthlyWhatsAppCredits: plan.monthlyWhatsAppCredits || plan.metadata?.whatsAppQuota || (selectedCategory === 'HOSPITAL' ? (isFreeYear1 ? 10000 : 25000) : (isFreeYear1 ? 2500 : 10000)),
                                  storageQuotaGb: plan.storageQuotaGb || plan.metadata?.storageGb || (selectedCategory === 'HOSPITAL' ? (isFreeYear1 ? 200 : 500) : (isFreeYear1 ? 25 : 100))
                                }
                              }))
                            }
                            style={{
                              backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.12)' : '#1E293B',
                              border: '2px solid ' + (isSelected ? '#06B6D4' : '#334155'),
                              borderRadius: '14px',
                              padding: '18px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              boxShadow: isSelected ? '0 0 20px rgba(6, 182, 212, 0.25)' : 'none'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '1rem' }}>{plan.name}</span>
                              <Badge variant={isSelected ? 'primary' : 'neutral'}>
                                {isFreeYear1 ? '🎁 1st Year Free' : `⭐ Year 2: ${renewalPriceText}`}
                              </Badge>
                            </div>

                            {/* Plan Pricing Display */}
                            <div style={{ marginTop: '12px', marginBottom: '10px' }}>
                              {isFreeYear1 ? (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                    <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10B981' }}>
                                      ₹0
                                    </span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34D399', backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '6px' }}>
                                      🎁 1st Year 100% Free
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                                    From 2nd Year Renewal: <strong style={{ color: '#38BDF8' }}>{renewalPriceText}</strong>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                    <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#38BDF8' }}>
                                      ₹{planPrice.toLocaleString('en-IN')}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>
                                      / year
                                    </span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                                      Standard Annual License
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                                    Commercial License (Payable from Year 2 onwards)
                                  </div>
                                </div>
                              )}
                            </div>

                            <p style={{ margin: '0 0 12px', fontSize: '0.8125rem', color: '#CBD5E1', lineHeight: 1.4 }}>
                              {plan.description || 'Enterprise healthcare module pack'}
                            </p>

                            {/* Live Quotas Pills & Staff Directory */}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderTop: '1px solid #334155', paddingTop: '10px', fontSize: '0.6875rem', color: '#CBD5E1' }}>
                              <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                👥 Staff Directory & RBAC
                              </span>
                              <span style={{ backgroundColor: '#0F172A', padding: '2px 6px', borderRadius: '4px' }}>
                                👨‍⚕️ {plan.maxDoctors || plan.metadata?.maxDoctors || (isFreeYear1 ? 5 : 10)} Doctors
                              </span>
                              <span style={{ backgroundColor: '#0F172A', padding: '2px 6px', borderRadius: '4px' }}>
                                🏢 {plan.maxBranches || plan.metadata?.maxBranches || (isFreeYear1 ? 1 : 2)} Branches
                              </span>
                              <span style={{ backgroundColor: '#0F172A', padding: '2px 6px', borderRadius: '4px' }}>
                                💬 {plan.monthlyWhatsAppCredits || plan.metadata?.whatsAppQuota || (isFreeYear1 ? 2500 : 10000)} WhatsApp
                              </span>
                              <span style={{ backgroundColor: '#0F172A', padding: '2px 6px', borderRadius: '4px' }}>
                                💾 {plan.storageQuotaGb || plan.metadata?.storageGb || (isFreeYear1 ? 25 : 100)} GB
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Mode 2: Interactive Custom Plan Builder */}
            {planMode === 'CREATE_CUSTOM' && (
              <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#34D399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>✍️</span> Custom Plan Builder (Self-Selected Commercials)
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      Enter your desired plan name, custom price, and specific limits for this healthcare facility.
                    </span>
                  </div>
                  <Badge variant="success">Customized Tier</Badge>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  {/* Custom Plan Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, marginBottom: '4px' }}>
                      CUSTOM PLAN NAME *
                    </label>
                    <input
                      type="text"
                      value={customPlanForm.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomPlanForm((prev) => ({ ...prev, name: val }));
                        setFormData((prev) => ({ ...prev, planTier: val }));
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        color: '#F8FAFC',
                        fontWeight: 700,
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  {/* Custom Monthly Fee */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, marginBottom: '4px' }}>
                      MONTHLY FEE (₹) *
                    </label>
                    <input
                      type="number"
                      value={customPlanForm.monthlyFee}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setCustomPlanForm((prev) => ({ ...prev, monthlyFee: val }));
                        setFormData((prev) => ({ ...prev, monthlyFee: val }));
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#1E293B',
                        border: '1px solid #10B981',
                        color: '#10B981',
                        fontWeight: 900,
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  {/* Billing Cadence */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, marginBottom: '4px' }}>
                      BILLING CADENCE
                    </label>
                    <select
                      value={customPlanForm.billingInterval}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomPlanForm((prev) => ({ ...prev, billingInterval: val }));
                        setFormData((prev) => ({ ...prev, billingInterval: val }));
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        color: '#F8FAFC',
                        fontWeight: 700,
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="MONTHLY">Monthly Billing</option>
                      <option value="QUARTERLY">Quarterly (3 Months)</option>
                      <option value="ANNUAL">Annual (12 Months)</option>
                    </select>
                  </div>

                  {/* Doctor Seats */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, marginBottom: '4px' }}>
                      DOCTOR / STAFF SEATS
                    </label>
                    <input
                      type="number"
                      value={customPlanForm.maxDoctors}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 1;
                        setCustomPlanForm((prev) => ({ ...prev, maxDoctors: val }));
                        setFormData((prev) => ({ ...prev, quotas: { ...prev.quotas, maxDoctors: val } }));
                      }}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#F8FAFC', fontWeight: 700, fontSize: '0.875rem' }}
                    />
                  </div>

                  {/* Branch Facilities */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, marginBottom: '4px' }}>
                      MAX FACILITIES / BRANCHES
                    </label>
                    <input
                      type="number"
                      value={customPlanForm.maxBranches}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 1;
                        setCustomPlanForm((prev) => ({ ...prev, maxBranches: val }));
                        setFormData((prev) => ({ ...prev, quotas: { ...prev.quotas, maxBranches: val } }));
                      }}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#F8FAFC', fontWeight: 700, fontSize: '0.875rem' }}
                    />
                  </div>

                  {/* WhatsApp Credits */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, marginBottom: '4px' }}>
                      MONTHLY WHATSAPP CREDITS
                    </label>
                    <input
                      type="number"
                      value={customPlanForm.monthlyWhatsAppCredits}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setCustomPlanForm((prev) => ({ ...prev, monthlyWhatsAppCredits: val }));
                        setFormData((prev) => ({ ...prev, quotas: { ...prev.quotas, monthlyWhatsAppCredits: val } }));
                      }}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#F8FAFC', fontWeight: 700, fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.8125rem', color: '#A7F3D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    ✓ Configured: <strong>{customPlanForm.name}</strong> @ <strong>₹{customPlanForm.monthlyFee.toLocaleString('en-IN')}/{customPlanForm.billingInterval.toLowerCase()}</strong> with {customPlanForm.maxDoctors} doctors & {customPlanForm.monthlyWhatsAppCredits} WhatsApp credits.
                  </span>
                  <span style={{ color: '#34D399', fontWeight: 800 }}>Ready to Allot</span>
                </div>
              </div>
            )}

            {/* Profile-Specific Departments & Accessible Modules (Pre-Template Driven) */}
            {(() => {
              const allAvailableFeatures = currentPreset.availableFeatures;

              return (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ fontSize: '0.8125rem', color: '#CBD5E1', fontWeight: 800, margin: 0 }}>
                        {currentPreset.label.toUpperCase()} DEPARTMENTS & ACCESSIBLE MODULES:
                      </label>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#34D399', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        🟢 {formData.features.length} Granted
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#F87171', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        🔴 {allAvailableFeatures.length - formData.features.length} Locked
                      </span>
                    </div>

                    {/* Quick Actions */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, features: allAvailableFeatures.map((f) => f.name) })}
                        style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38BDF8', color: '#38BDF8', borderRadius: '6px', padding: '3px 8px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        ✓ Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, features: allAvailableFeatures.filter((f) => f.default).map((f) => f.name) })}
                        style={{ backgroundColor: '#1E293B', border: '1px solid #475569', color: '#CBD5E1', borderRadius: '6px', padding: '3px 8px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        ⚡ Default Essentials
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, features: [] })}
                        style={{ backgroundColor: '#1E293B', border: '1px solid #475569', color: '#94A3B8', borderRadius: '6px', padding: '3px 8px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        🔒 Lock All
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
                    {allAvailableFeatures.map((feat) => {
                      const isChecked = formData.features.includes(feat.name);
                      return (
                        <div
                          key={feat.id}
                          onClick={() => toggleFeature(feat.name)}
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
                              {feat.name}
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
              );
            })()}

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

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, marginBottom: '6px' }}>
                    SUBSCRIPTION PLAN VALIDITY & RENEWAL
                  </label>
                  <div
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#0B132B',
                      border: '1px solid #10B981',
                      color: '#10B981',
                      fontWeight: 800,
                      fontSize: '0.875rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>🎁 365 Days Free (Valid till ~{new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})</span>
                    <span style={{ fontSize: '0.6875rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10B981', padding: '2px 6px', borderRadius: '4px' }}>Founding Partner (1st Year Free)</span>
                  </div>
                </div>
              </div>

              {/* Super Admin Explicit Feature Grant Audit Grid */}
              <div style={{ backgroundColor: '#0A1128', border: '1px solid #38BDF8', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 900, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      🔍 SUPER ADMIN FEATURE ALLOCATION AUDIT (SPECIFICALLY GRANTED VS LOCKED)
                    </span>
                  </div>
                  <Badge variant="primary">{formData.planTier} (₹{formData.monthlyFee.toLocaleString('en-IN')}/mo)</Badge>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {/* Active Granted Features Column */}
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34D399', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🟢</span> ACTIVE FEATURES GRANTED ({formData.features.length}):
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '140px', overflowY: 'auto' }}>
                      {formData.features.map((f, i) => (
                        <span key={i} style={{ fontSize: '0.75rem', color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#10B981', fontWeight: 900 }}>✓</span> {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Locked / Disabled Modules Column */}
                  <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F87171', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🔴</span> LOCKED / DISABLED MODULES ({currentPreset.availableFeatures.length - formData.features.length}):
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '140px', overflowY: 'auto' }}>
                      {currentPreset.availableFeatures.filter(f => !formData.features.includes(f.name)).length === 0 ? (
                        <span style={{ fontSize: '0.75rem', color: '#64748B', fontStyle: 'italic' }}>Zero locked modules — Full unrestricted suite granted!</span>
                      ) : (
                        currentPreset.availableFeatures.filter(f => !formData.features.includes(f.name)).map((f, i) => (
                          <span key={i} style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#EF4444', fontWeight: 900 }}>✕</span> {f.name} <span style={{ fontSize: '0.6875rem', color: '#EF4444', fontWeight: 700 }}>(Locked)</span>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* B2B Founding Partner Master Agreement Checkbox */}
              <div
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: formData.agreementAccepted ? '1px solid #10B981' : '1px solid #334155',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <input
                  type="checkbox"
                  id="b2b-agreement-check"
                  checked={!!formData.agreementAccepted}
                  onChange={(e) => setFormData({ ...formData, agreementAccepted: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#10B981', cursor: 'pointer' }}
                />
                <label htmlFor="b2b-agreement-check" style={{ fontSize: '0.8125rem', color: '#CBD5E1', cursor: 'pointer', lineHeight: '1.4' }}>
                  I confirm that this healthcare partner lead's legal identity and regulatory documents have been reviewed. I authorize the issuance of a <strong>1-Year 100% Free Founding Partner License (₹0 First Year)</strong> with dynamic renewal terms thereafter under Doc Search Master Service Agreement.
                </label>
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
                disabled={isSubmitting || !formData.email || !formData.password || !formData.agreementAccepted}
                style={{
                  backgroundColor: !formData.agreementAccepted ? '#475569' : '#10B981',
                  color: !formData.agreementAccepted ? '#94A3B8' : '#064E3B',
                  fontWeight: 900,
                  fontSize: '1rem',
                  padding: '12px 28px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: isSubmitting || !formData.agreementAccepted ? 'not-allowed' : 'pointer',
                  boxShadow: formData.agreementAccepted ? '0 0 25px rgba(16, 185, 129, 0.45)' : 'none',
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

                {/* Plan Validity & Expiry */}
                <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    PLAN VALIDITY & EXPIRY DATE
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#10B981', fontWeight: 900, fontSize: '0.9375rem' }}>
                      📅 {activationResult.credentials.planExpiryDate || activationResult.subscriptionPlan.expiryDate || '365 Days (1 Full Year Free)'}
                    </span>
                    <span style={{ fontSize: '0.6875rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10B981', padding: '3px 8px', borderRadius: '4px', fontWeight: 800 }}>Founding Partner (1st Year Free)</span>
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
                    planExpiryDate: activationResult.credentials.planExpiryDate || activationResult.subscriptionPlan.expiryDate,
                    activatedAt: activationResult.credentials.activatedAt,
                    loginUrl: activationResult.credentials.loginUrl
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
                      planExpiryDate: activationResult.credentials.planExpiryDate || activationResult.subscriptionPlan.expiryDate,
                      activatedAt: activationResult.credentials.activatedAt,
                      loginUrl: activationResult.credentials.loginUrl
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
                      planExpiryDate: activationResult.credentials.planExpiryDate || activationResult.subscriptionPlan.expiryDate,
                      activatedAt: activationResult.credentials.activatedAt,
                      loginUrl: activationResult.credentials.loginUrl
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

            {/* WHATSAPP DISPATCH PREVIEW INLINE FULL PANEL */}
            {isWhatsAppModalOpen && (
              <div
                style={{
                  backgroundColor: '#0F172A',
                  border: '2px solid #22C55E',
                  borderRadius: '16px',
                  width: '100%',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: '0 8px 24px rgba(34, 197, 94, 0.15)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.5rem' }}>💬</span>
                    <strong style={{ color: '#F8FAFC', fontSize: '1.1rem' }}>
                      WhatsApp Live Dispatch Message
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
• Plan Expiry & Renewal: ${activationResult.credentials.planExpiryDate || activationResult.subscriptionPlan.expiryDate || '365 Days Free (Founding Partner)'}
• 24x7 Digital Portal Access: Enabled

📦 *Speed Post Docket ID:* SP-IN-2026-${activationResult.partnerId.replace(/\D/g, '').padEnd(6, '9')}
(Official Welcome Kit & Physical Agreement dispatched via Speed Post)

📞 *Support Desk:* +91 1800-DOC-SEARCH
Please change your password upon first login.`}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <Button variant="outline" onClick={() => setIsWhatsAppModalOpen(false)}>
                    Close Preview
                  </Button>
                  <a
                    href={`https://wa.me/${(() => {
                      const d = (activationResult.phone || '').replace(/\D/g, '');
                      return d.length === 10 ? `91${d}` : d;
                    })()}?text=${encodeURIComponent(`Dear ${activationResult.contactPerson},\nCongratulations! ${activationResult.partnerName} (${currentPreset.label}) is now LIVE on Doc Search.\nLogin: ${activationResult.credentials.loginUrl}\nUser ID: ${activationResult.credentials.userId}\nPassword: ${activationResult.credentials.temporaryPassword}\nPlan Valid Till: ${activationResult.credentials.planExpiryDate || activationResult.subscriptionPlan.expiryDate || '365 Days Free'}`)}`}
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {onClose ? (
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('docsearch:navigate_directory'));
                      }
                      onClose();
                    }}
                    style={{ backgroundColor: '#10B981', border: 'none', fontWeight: 800, padding: '10px 20px', cursor: 'pointer' }}
                  >
                    ✓ Done & View in Directory
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('docsearch:navigate_directory'));
                      }
                      setCurrentStep(1);
                      setActivationResult(null);
                    }}
                    style={{ backgroundColor: '#10B981', border: 'none', fontWeight: 800, padding: '10px 20px', cursor: 'pointer' }}
                  >
                    ✓ Done & View in Directory
                  </Button>
                )}

                <a
                  href={activationResult.credentials.loginUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    backgroundColor: '#4F46E5',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    padding: '10px 18px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>🚪 Launch Partner Portal ({activationResult.credentials.loginUrl.replace('http://localhost:5173', '') || '/'}) ➔</span>
                </a>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// Export backward compatible alias so existing imports don't break
export const PathologyPartnerOnboardingWizard = UniversalPartnerOnboardingWizard;
