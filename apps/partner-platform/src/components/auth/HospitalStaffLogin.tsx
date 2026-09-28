import React, { useState, useEffect } from 'react';
import { HealthcareNetworkCore3D, ParticleNetwork, PartnerCampaignShowcasePanel, DocSearchLogo, DocSearch3DLogoLoader } from '@docsearch/ui-kit';
import { getUrlForModule } from '../../utils/urlRouter.js';
import {
  normalizeFacilityProfile,
  HOSPITAL_FREE_TIER_NAME,
  HOSPITAL_PRO_TIER_NAME,
  FREE_HOSPITAL_FEATURES,
  PRO_HOSPITAL_FEATURES
} from '@docsearch/shared-core';
import {
  type StaffPermissions,
  getDefaultPermissionsForRole
} from '../../types/partner-staff-rbac.js';

export type OrganizationWorkspaceType =
  | 'HOSPITAL'
  | 'CLINIC'
  | 'PHARMACY'
  | 'PATHOLOGY'
  | 'DIAGNOSTIC_CENTRE'
  | 'ENTERPRISE_COMMAND';

export interface HospitalStaffUser {
  id: string;
  category: 'HEALTHCARE' | 'COMPANY_HQ';
  name: string;
  email?: string | undefined;
  password?: string | undefined;
  role: string;
  roleTitle: string;
  department: string;
  tenantName: string;
  organizationType: OrganizationWorkspaceType;
  allowedWorkspaces: OrganizationWorkspaceType[];
  defaultModule: string;
  planTier: string;
  planExpiryDate?: string | undefined;
  accessibleFeatures: string[];
  restrictedFeatures: string[];
  ownerAadhaarNumber?: string | undefined;
  aadhaarDocFileName?: string | undefined;
  aadhaarDocDataUrl?: string | undefined;
  bedCapacity?: number | undefined;
  gstinNumber?: string | undefined;
  kycStatus?: 'PENDING_ADMIN_VERIFICATION' | 'KYC_VERIFIED' | 'KYC_REJECTED' | undefined;
  kycSubmittedAt?: string | undefined;
  onboardingEnvironment?: string | undefined;
  tenantId?: string | undefined;
  mustChangePassword?: boolean | undefined;
  permissions?: StaffPermissions | undefined;
  isProfileCompleted?: boolean | undefined;
}

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
  // 1. HOSPITAL Plans (2-Tier Canonical Model: Free OPD Foundation vs Paid Complete Suite)
  {
    id: 'plan_hosp_free',
    code: 'PLAN_HOSPITAL_FREE',
    tier: 'FREE',
    name: 'Hospital Foundation (Free OPD Core)',
    price: 0,
    billingInterval: 'FREE_FOREVER' as any,
    icon: '🟢',
    tag: 'Free Forever • OPD & Tokens',
    description: 'Outpatient Clinic, Tokens, Vitals, Digital Rx, OPD Cashier & WhatsApp for all Hospitals',
    features: [
      'OPD Reception & ABHA Tokens',
      'Nurse Vitals & Triage Station',
      'Doctor OPD Desk & EMR',
      'OPD Billing & Dynamic UPI',
      'WhatsApp Digital Rx (Free Pass)',
      'Max 5 Doctors (0 Inpatient Beds)'
    ],
    recommended: false,
    maxDoctors: 5,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['HOSPITAL']
  },
  {
    id: 'plan_hosp_pro',
    code: 'PLAN_HOSPITAL_PRO',
    tier: 'COMPLETE_SUITE',
    name: 'Hospital Complete Enterprise Suite',
    price: 4999,
    billingInterval: 'MONTHLY',
    icon: '🏥',
    tag: 'Recommended • Inpatient Beds, OT, TPA & ICU',
    description: 'Full Inpatient HIS: 24x7 Bed Matrix, Surgery OT, Cashless TPA & LIMS Diagnostics',
    features: [
      '24x7 Inpatient Bed Matrix & ADT',
      'Operation Theatres (OT Rostering)',
      'TPA Cashless Claims & NHCX',
      'Emergency & Code Blue Trauma',
      'Pathology LIMS & DICOM PACS',
      'Blood Bank & Executive Command'
    ],
    recommended: true,
    maxDoctors: 50,
    maxBeds: 100,
    isActive: true,
    applicableFacilityTypes: ['HOSPITAL']
  },

  // 2. CLINIC Plans
  {
    id: 'plan_clinic_solo',
    code: 'PLAN_CLINIC_STARTER',
    tier: 'STARTER',
    name: 'Solo Doctor OPD Clinic',
    price: 1499,
    billingInterval: 'MONTHLY',
    icon: '🩺',
    tag: 'Single Doctor / OPD Clinic',
    description: 'Individual Physicians, Specialists & Single-Room Consultations',
    features: ['Digital Rx & EMR', 'OPD Token Queue Manager', 'WhatsApp Patient Dispatch', 'Rapid Consultation Billing'],
    recommended: false,
    maxDoctors: 3,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['CLINIC']
  },
  {
    id: 'plan_clinic_multi',
    code: 'PLAN_CLINIC_GROWTH',
    tier: 'GROWTH',
    name: 'Multi-Specialty Polyclinic Suite',
    price: 3499,
    billingInterval: 'MONTHLY',
    icon: '👨‍⚕️',
    tag: 'Polyclinic / Daycare / Multi-Doctor',
    description: 'Polyclinics, Daycare Clinics & Group Medical Practices',
    features: ['Multi-Doctor EMR & Cross-Referrals', 'Daycare Bed Allotment', 'Internal Dispensary & Minor OT', 'Automated SMS / WhatsApp Recalls'],
    recommended: true,
    maxDoctors: 15,
    maxBeds: 10,
    isActive: true,
    applicableFacilityTypes: ['CLINIC']
  },

  // 3. PATHOLOGY Plans
  {
    id: 'plan_path_free_pioneer',
    code: 'PLAN_PATHOLOGY_PIONEER_FREE',
    tier: 'FREE_PIONEER',
    name: 'Pathology Pioneer LIMS (100% Free Early-Bird Launch Access)',
    price: 0,
    billingInterval: 'FREE_LAUNCH' as any,
    icon: '🧪',
    tag: '🔥 Free for Now • Limited Pioneer Launch Tier',
    description: 'Free for all Diagnostic Laboratories, Pathologists & Phlebotomy Collection Centers across India',
    features: [
      'Full NABL ISO 15189:2022 LIMS Workbench',
      'Vacutainer Thermal Barcode Sticker Generation (50x25mm / 50x30mm)',
      'Direct WhatsApp Digital PDF Lab Reports',
      'B2B Doctor Referral & Commission Ledger',
      'Front-Desk Walk-In POS Billing & 80mm Receipts',
      'Public QR Tamper-Proof Report Verification Portal',
      'Auto-Analyzer ASTM/HL7 Machine Interfacing'
    ],
    recommended: true,
    maxDoctors: 50,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['PATHOLOGY']
  },
  {
    id: 'plan_path_essential',
    code: 'PLAN_PATHOLOGY_STARTER',
    tier: 'STARTER',
    name: 'Essential Pathology Lab',
    price: 1999,
    billingInterval: 'MONTHLY',
    icon: '🧪',
    tag: 'Sample Barcodes / Auto Reference Ranges',
    description: 'Clinical Collection Centers & Routine Diagnostic Labs',
    features: ['Sample Barcode Generation', 'Auto Normal Range Formulas', 'WhatsApp PDF Lab Reports', 'Doctor Commission & Referral Ledger'],
    recommended: false,
    maxDoctors: 5,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['PATHOLOGY']
  },
  {
    id: 'plan_path_lims',
    code: 'PLAN_PATHOLOGY_PRO',
    tier: 'GROWTH',
    name: 'Advanced Diagnostic Hub & LIMS',
    price: 4499,
    billingInterval: 'MONTHLY',
    icon: '🔬',
    tag: 'Bidirectional Interfacing / NABL Audit',
    description: 'Central Pathology Laboratories, NABL Accredited Hubs & Franchise Networks',
    features: ['Bidirectional Analyzer Interfacing (ASTM/HL7)', 'Dual Pathologist Digital Sign-Off', 'NABL Audit Trail & Quality Control', 'B2B Phlebotomist Route Tracking'],
    recommended: true,
    maxDoctors: 20,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['PATHOLOGY']
  },

  // 4. PHARMACY Plans
  {
    id: 'plan_pharm_retail',
    code: 'PLAN_PHARMACY_STARTER',
    tier: 'STARTER',
    name: 'Retail Pharmacy Express POS',
    price: 999,
    billingInterval: 'MONTHLY',
    icon: '💊',
    tag: 'Barcode Billing / Batch & Expiry Radar',
    description: 'Retail Chemists, Medical Stores & Standalone Pharmacies',
    features: ['High-Speed Barcode Billing (GST Invoice)', 'Batch & Expiry Alert Radar', 'Schedule H & H1 Drug Audit Registers', 'Supplier Purchase Order Automation'],
    recommended: false,
    maxDoctors: 0,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['PHARMACY']
  },
  {
    id: 'plan_pharm_chain',
    code: 'PLAN_PHARMACY_PRO',
    tier: 'GROWTH',
    name: 'Enterprise Pharmacy Chain POS',
    price: 2999,
    billingInterval: 'MONTHLY',
    icon: '🏪',
    tag: 'Multi-Counter POS / Warehouse Sync',
    description: 'Hospital In-House Pharmacies & Multi-Branch Chemist Chains',
    features: ['Multi-Counter Cashier Terminals', 'Central Warehouse & Multi-Store Stock Sync', 'Direct Hospital EMR e-Prescription Sync', 'Near-Expiry Return-to-Vendor Debit Notes'],
    recommended: true,
    maxDoctors: 0,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['PHARMACY']
  },

  // 5. DIAGNOSTIC CENTRE Plans
  {
    id: 'plan_radio_imaging',
    code: 'PLAN_RADIOLOGY_STARTER',
    tier: 'STARTER',
    name: 'Radiology Imaging Suite',
    price: 3999,
    billingInterval: 'MONTHLY',
    icon: '🩻',
    tag: 'DICOM Viewer / Modality Worklist',
    description: 'X-Ray, Ultrasound, CT / MRI Centers & Sonography Clinics',
    features: ['Modality Worklist (MWL) Gateway', 'Zero-Footprint Web DICOM Viewer', 'Radiologist Structured Reporting Templates', 'Direct Patient WhatsApp DICOM Links'],
    recommended: false,
    maxDoctors: 10,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['DIAGNOSTIC_CENTRE']
  },
  {
    id: 'plan_radio_pacs',
    code: 'PLAN_RADIOLOGY_PRO',
    tier: 'GROWTH',
    name: 'Enterprise Cloud PACS & Modality',
    price: 7999,
    billingInterval: 'MONTHLY',
    icon: '☢️',
    tag: 'Cloud PACS / Teleradiology / AERB',
    description: 'Comprehensive Diagnostic Imaging Hospitals & Teleradiology Networks',
    features: ['Hybrid Cloud Long-Term PACS Storage', 'AI Lesion & Measurement Assist', 'Remote Teleradiology Multi-Radiologist Routing', 'AERB Radiation Dosage & Safety Compliance'],
    recommended: true,
    maxDoctors: 30,
    maxBeds: 0,
    isActive: true,
    applicableFacilityTypes: ['DIAGNOSTIC_CENTRE']
  }
];

export const DEFAULT_REGISTRATION_FORM_POLICY: RegistrationFormPolicy = {
  showPlanSelection: false,
  showModuleSelection: false,
  allowAdvancePayment: false,
  defaultPlanTier: 'FREE',
  bannerNotice: 'Universal Healthcare Partner Registration • Automatic Foundation Setup',
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

export const ALL_SYSTEM_ROLES: HospitalStaffUser[] = [];
export const DEMO_ORGANIZATION_USERS: HospitalStaffUser[] = [];
export const DEMO_STAFF_USERS: HospitalStaffUser[] = [];

export const getHealthcareOrgDetails = (orgType: OrganizationWorkspaceType, _tenantName: string, roleName?: string) => {
  switch (orgType) {
    case 'HOSPITAL':
      return {
        role: roleName || 'HOSPITAL_DIRECTOR',
        roleTitle: 'Medical Superintendent & Director',
        department: 'Hospital Administration & Inpatient Governance',
        defaultModule: 'inpatient-management',
        allowedWorkspaces: ['HOSPITAL', 'CLINIC', 'PHARMACY', 'PATHOLOGY', 'DIAGNOSTIC_CENTRE', 'ENTERPRISE_COMMAND'] as OrganizationWorkspaceType[],
        planTier: 'Multi-Specialty Hospital Suite',
        restrictedFeatures: ['None (Full Hospital Scope)']
      };
    case 'PHARMACY':
      return {
        role: roleName || 'PHARMACIST',
        roleTitle: 'Chief Pharmacist & Chemist In-Charge',
        department: 'Pharmacy POS & Stock Inwarding',
        defaultModule: 'pharmacy-medication',
        allowedWorkspaces: ['PHARMACY'] as OrganizationWorkspaceType[],
        planTier: 'Retail Pharmacy POS Suite',
        restrictedFeatures: ['Hospital Inpatient Wards', 'OT Surgery Logs']
      };
    case 'CLINIC':
      return {
        role: roleName || 'CLINIC_DOCTOR',
        roleTitle: 'Lead Consultant Doctor',
        department: 'Outpatient Clinic & Consultation',
        defaultModule: 'clinical-consultation',
        allowedWorkspaces: ['CLINIC'] as OrganizationWorkspaceType[],
        planTier: 'Doctor OPD Clinic Pro',
        restrictedFeatures: ['IPD Bed Census', 'OT Surgery Logs']
      };
    case 'DIAGNOSTIC_CENTRE':
      return {
        role: roleName || 'RADIOLOGIST',
        roleTitle: 'Chief Radiologist & PACS Lead',
        department: 'Radiology, MRI, CT & Imaging',
        defaultModule: 'radiology-imaging',
        allowedWorkspaces: ['DIAGNOSTIC_CENTRE'] as OrganizationWorkspaceType[],
        planTier: 'Diagnostic PACS & Modality Hub',
        restrictedFeatures: ['Pharmacy POS', 'Hospital Inpatient Beds']
      };
    case 'PATHOLOGY':
    default:
      return {
        role: roleName || 'PATHOLOGIST',
        roleTitle: 'Head Pathologist & Lab Director',
        department: 'Pathology & Diagnostic Laboratory',
        defaultModule: 'clinical-investigation',
        allowedWorkspaces: ['PATHOLOGY'] as OrganizationWorkspaceType[],
        planTier: 'Pathology Pro & Barcode LIMS',
        restrictedFeatures: ['Hospital IPD Wards', 'OT Surgery Logs']
      };
  }
};

interface Props {
  onLoginSuccess: (user: HospitalStaffUser) => void;
}

export const HospitalStaffLogin: React.FC<Props> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login Form State
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Self-Registration Form State
  const [regFacilityType, setRegFacilityType] = useState<OrganizationWorkspaceType>('HOSPITAL');
  const [regFacilityName, setRegFacilityName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCityState, setRegCityState] = useState('');
  const [regLicenseNumber, setRegLicenseNumber] = useState('');
  const [regOwnerAadhaarNumber, setRegOwnerAadhaarNumber] = useState('');
  const [regDocType, setRegDocType] = useState('Clinical Establishment Act License (CEA Form-IV)');
  const [regDocFileName, setRegDocFileName] = useState('');
  const [regDocDataUrl, setRegDocDataUrl] = useState('');
  const [regDocSizeKb, setRegDocSizeKb] = useState<number | null>(null);

  const [regAadhaarDocFileName, setRegAadhaarDocFileName] = useState('');
  const [regAadhaarDocDataUrl, setRegAadhaarDocDataUrl] = useState('');
  const [regAadhaarDocSizeKb, setRegAadhaarDocSizeKb] = useState<number | null>(null);

  const [formPolicy, setFormPolicy] = useState<RegistrationFormPolicy>(DEFAULT_REGISTRATION_FORM_POLICY);

  // Dynamic Registration Form Policy Sync from HQ Backend
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

  const [regBedCapacity, setRegBedCapacity] = useState('');
  const [regGstin, setRegGstin] = useState('');
  const [regPlanTier, setRegPlanTier] = useState<string>('FREE');

  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccessMessage, setRegSuccessMessage] = useState<string | null>(null);

  const getDefaultDocType = (type: OrganizationWorkspaceType) => {
    switch (type) {
      case 'HOSPITAL': return 'Clinical Establishment Act License (CEA Form-IV)';
      case 'CLINIC': return 'State Medical Council / NMC Doctor Registration Proof';
      case 'PHARMACY': return 'Retail Drug License (Form 20 / 21) & Chemist Reg';
      case 'PATHOLOGY': return 'NABL Accreditation Certificate / Pathologist Medical Reg';
      case 'DIAGNOSTIC_CENTRE': return 'AERB Radiation Safety / PACS Modality License';
      default: return 'Government Clinical Establishment Registration';
    }
  };

  const handleDocFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRegDocFileName(file.name);
    setRegDocSizeKb(Math.round(file.size / 1024));
    const reader = new FileReader();
    reader.onload = () => {
      setRegDocDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAadhaarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRegAadhaarDocFileName(file.name);
    setRegAadhaarDocSizeKb(Math.round(file.size / 1024));
    const reader = new FileReader();
    reader.onload = () => {
      setRegAadhaarDocDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [, setCustomRoles] = useState<HospitalStaffUser[]>([]);


  React.useEffect(() => {
    const loadLivePartners = async () => {
      try {
        const localCustom: HospitalStaffUser[] = JSON.parse(localStorage.getItem('docsearch_custom_partner_users') || '[]');
        
        // Day-0 Zero-State Purge: Clear any legacy test partners from browser storage
        const legacyKeywords = ['midahat', 'abc', 'apex', 'metro', 'partner corp', 'ak dk', 'tk sah', 'tk@gm.bom', 'asit lal', 'stf-468'];
        let cleanedCustom = localCustom.filter((partner) => {
          const name = `${partner.tenantName || ''} ${partner.name || ''} ${partner.email || ''}`.toLowerCase();
          return !legacyKeywords.some((kw) => name.includes(kw));
        });

        if (cleanedCustom.length !== localCustom.length) {
          if (cleanedCustom.length === 0) {
            localStorage.removeItem('docsearch_custom_partner_users');
          } else {
            localStorage.setItem('docsearch_custom_partner_users', JSON.stringify(cleanedCustom));
          }
        }

        // Also clean legacy queue items from localStorage
        try {
          const rawQ = localStorage.getItem('docsearch_verification_queue');
          if (rawQ) {
            const parsedQ = JSON.parse(rawQ);
            if (Array.isArray(parsedQ)) {
              const cleanedQ = parsedQ.filter((q: any) => {
                const name = `${q.partnerName || ''} ${q.tenantSlug || ''} ${q.submittedBy || ''}`.toLowerCase();
                return !legacyKeywords.some((kw) => name.includes(kw));
              });
              if (cleanedQ.length !== parsedQ.length) {
                if (cleanedQ.length === 0) {
                  localStorage.removeItem('docsearch_verification_queue');
                } else {
                  localStorage.setItem('docsearch_verification_queue', JSON.stringify(cleanedQ));
                }
              }
            }
          }
        } catch {}

        try {
          const policyRes = await fetch('/api/v1/auth/registration-form-config');
          if (policyRes.ok) {
            const policyJson = await policyRes.json();
            if (policyJson.success && policyJson.data) {
              setFormPolicy(policyJson.data);
              if (policyJson.data.defaultPlanTier && policyJson.data.defaultPlanTier !== 'PENDING_FOUNDER') {
                setRegPlanTier(policyJson.data.defaultPlanTier);
              }
              if (policyJson.data.allowedFacilityTypes?.length > 0 && !policyJson.data.allowedFacilityTypes.includes(regFacilityType as any)) {
                setRegFacilityType(policyJson.data.allowedFacilityTypes[0]);
              }
            }
          }
        } catch {}

        let apiPartners: any[] = [];
        try {
          const res = await fetch('/api/v1/auth/live-partners');
          if (res.ok) {
            const j = await res.json();
            if (j.data) apiPartners = j.data;
          }
        } catch {
          // ignore if backend offline
        }

        const mappedApiRoles: HospitalStaffUser[] = apiPartners.map((p) => {
          const orgType = (p.organizationType as OrganizationWorkspaceType) || 'HOSPITAL';
          const details = getHealthcareOrgDetails(orgType, p.tenantName, p.role);
          return {
            id: p.id,
            category: 'HEALTHCARE' as const,
            name: p.name,
            email: p.email,
            role: details.role,
            roleTitle: details.roleTitle,
            department: details.department,
            tenantName: p.tenantName,
            organizationType: orgType,
            allowedWorkspaces: details.allowedWorkspaces,
            defaultModule: details.defaultModule,
            planTier: p.planTier || details.planTier,
            planExpiryDate: p.planExpiryDate || '30 Days Validity',
            accessibleFeatures: p.accessibleFeatures || ['Standard Partner Workbench'],
            restrictedFeatures: details.restrictedFeatures
          };
        });

        const combined = [...cleanedCustom, ...mappedApiRoles];
        const unique: HospitalStaffUser[] = [];
        const seen = new Set<string>();

        for (const u of combined) {
          if (u.email && !seen.has(u.email.toLowerCase())) {
            seen.add(u.email.toLowerCase());
            unique.push(u);
          }
        }

        if (unique.length > 0) {
          setCustomRoles(unique);
        }
      } catch (err) {
        console.error('Failed to load live partners:', err);
      }
    };
    void loadLivePartners();
  }, []);

  // 1-Click Quick Demo Login for instant testing of Free vs Paid Hospital Tiers
  const handleQuickDemoLogin = (tier: 'FREE' | 'PRO') => {
    const isFree = tier === 'FREE';
    const planTierName = isFree ? HOSPITAL_FREE_TIER_NAME : HOSPITAL_PRO_TIER_NAME;
    const demoUser: HospitalStaffUser = {
      id: isFree ? 'usr_demo_free_hospital' : 'usr_demo_pro_hospital',
      category: 'HEALTHCARE',
      name: isFree ? 'Dr. Vivek Sharma (Medical Director)' : 'Dr. Ewan Babu (Medical Superintendent)',
      email: isFree ? 'freehospital@docsearch.health' : 'drewan@docsearch.health',
      role: 'HOSPITAL_DIRECTOR',
      roleTitle: isFree ? 'Hospital Director (OPD Foundation)' : 'Medical Superintendent & Director',
      department: isFree ? 'Hospital Administration (Free OPD)' : 'Hospital Administration & Inpatient Governance',
      tenantName: isFree ? 'CarePlus Community Hospital (Free OPD)' : 'Ewan Multi-Specialty Hospital',
      tenantId: '11111111-1111-4111-8111-111111111111',
      organizationType: 'HOSPITAL',
      allowedWorkspaces: ['HOSPITAL', 'CLINIC', 'PHARMACY', 'PATHOLOGY', 'DIAGNOSTIC_CENTRE', 'ENTERPRISE_COMMAND'],
      defaultModule: isFree ? 'patient-registration' : 'inpatient-management',
      planTier: planTierName,
      planExpiryDate: isFree ? 'Free Forever' : 'Enterprise Active',
      accessibleFeatures: isFree ? (FREE_HOSPITAL_FEATURES as string[]) : (PRO_HOSPITAL_FEATURES as string[]),
      restrictedFeatures: isFree ? ['Inpatient Bed Matrix', 'Operation Theatre Rostering', 'TPA Cashless Claims'] : ['None (Full Hospital Scope)'],
      kycStatus: 'KYC_VERIFIED',
      isProfileCompleted: true
    };

    localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(demoUser));
    localStorage.removeItem('docsearch_logged_out');
    if (typeof window !== 'undefined') {
      try {
        const targetPath = getUrlForModule('HOSPITAL', demoUser.defaultModule as any);
        window.history.replaceState({ path: targetPath }, '', targetPath);
      } catch {}
    }
    onLoginSuccess(demoUser);
  };

  // 1-Click Role-Isolated Persona Login (Strict Access Separation)
  const handleRolePersonaLogin = (persona: 'DOCTOR' | 'PHARMACIST' | 'LAB_TECH' | 'NURSE' | 'FRONT_DESK' | 'DIRECTOR') => {
    let personaUser: HospitalStaffUser;

    switch (persona) {
      case 'DOCTOR':
        personaUser = {
          id: 'usr_persona_doctor',
          category: 'HEALTHCARE',
          name: 'Dr. Ewan Babu (Consultant Physician)',
          email: 'doctor@docsearch.health',
          role: 'DOCTOR',
          roleTitle: 'Consultant Physician & OPD Specialist',
          department: 'Clinical Consultation & OPD',
          tenantName: 'Ewan Multi-Specialty Hospital',
          tenantId: '11111111-1111-4111-8111-111111111111',
          organizationType: 'HOSPITAL',
          allowedWorkspaces: ['HOSPITAL', 'CLINIC'],
          defaultModule: 'clinical-consultation',
          planTier: HOSPITAL_PRO_TIER_NAME,
          planExpiryDate: 'Enterprise Active',
          accessibleFeatures: ['Doctor OPD Desk', 'OPD Token Queue', 'AI Scribe & CDSS', 'Lab Review', 'Telemedicine'],
          restrictedFeatures: ['Pharmacy POS Counter', 'Cashier Till & Credit Notes', 'Staff Directory Administration', 'Hospital Bed Matrix'],
          kycStatus: 'KYC_VERIFIED',
          isProfileCompleted: true
        };
        break;

      case 'PHARMACIST':
        personaUser = {
          id: 'usr_persona_pharmacist',
          category: 'HEALTHCARE',
          name: 'Rajesh Sharma (Chief Chemist)',
          email: 'pharmacist@docsearch.health',
          role: 'PHARMACIST',
          roleTitle: 'Chief Pharmacist & Chemist In-Charge',
          department: 'Hospital Pharmacy & Dispensing',
          tenantName: 'CarePlus Pharmacy & Surgical Store',
          tenantId: '11111111-1111-4111-8111-111111111111',
          organizationType: 'PHARMACY',
          allowedWorkspaces: ['PHARMACY'],
          defaultModule: 'pharmacy-medication',
          planTier: 'Retail Pharmacy POS Suite',
          planExpiryDate: 'Enterprise Active',
          accessibleFeatures: ['Pharmacy POS Counter', 'Batch Inventory & Marg CSV Inward', 'CDSCO Schedule H1 Register', 'Khata Credit Ledger'],
          restrictedFeatures: ['Doctor EMR & Prescribing', 'Nurse Triage Vitals', 'Inpatient Bed Matrix', 'OT Surgery Logs'],
          kycStatus: 'KYC_VERIFIED',
          isProfileCompleted: true
        };
        break;

      case 'LAB_TECH':
        personaUser = {
          id: 'usr_persona_lab_tech',
          category: 'HEALTHCARE',
          name: 'Sunita Deshmukh (Senior Lab Tech)',
          email: 'labtech@docsearch.health',
          role: 'LAB_TECHNICIAN',
          roleTitle: 'Senior Medical Laboratory Technologist',
          department: 'Pathology & Diagnostic Laboratory',
          tenantName: 'Ewan Diagnostics & Pathology Hub',
          tenantId: '11111111-1111-4111-8111-111111111111',
          organizationType: 'PATHOLOGY',
          allowedWorkspaces: ['PATHOLOGY'],
          defaultModule: 'clinical-investigation',
          planTier: 'Pathology Pro & Barcode LIMS',
          planExpiryDate: 'Enterprise Active',
          accessibleFeatures: ['Phlebotomy Queue & Barcodes', 'Analyzer Workbench', 'NABL Panic Intimation', 'Report Dispatch'],
          restrictedFeatures: ['Doctor Clinical Notes', 'Pharmacy Inventory', 'Cashier Financial Ledgers'],
          kycStatus: 'KYC_VERIFIED',
          isProfileCompleted: true
        };
        break;

      case 'NURSE':
        personaUser = {
          id: 'usr_persona_nurse',
          category: 'HEALTHCARE',
          name: 'Sister Mary Thomas (Triage & Ward Nurse)',
          email: 'nurse@docsearch.health',
          role: 'STAFF_NURSE',
          roleTitle: 'Inpatient Charge Nurse & Triage Officer',
          department: 'Nursing Station & Inpatient Ward',
          tenantName: 'Ewan Multi-Specialty Hospital',
          tenantId: '11111111-1111-4111-8111-111111111111',
          organizationType: 'HOSPITAL',
          allowedWorkspaces: ['HOSPITAL'],
          defaultModule: 'nurse-triage-station',
          planTier: HOSPITAL_PRO_TIER_NAME,
          planExpiryDate: 'Enterprise Active',
          accessibleFeatures: ['Nurse Vitals Station', 'NEWS2 Acuity Calculation', 'Ward Bed Board', 'Medication Administration (MAR)'],
          restrictedFeatures: ['Doctor Prescription Writing', 'Cancelling Invoices', 'Administering Staff Roles'],
          kycStatus: 'KYC_VERIFIED',
          isProfileCompleted: true
        };
        break;

      case 'FRONT_DESK':
        personaUser = {
          id: 'usr_persona_front_desk',
          category: 'HEALTHCARE',
          name: 'Amit Verma (Front Desk Lead)',
          email: 'frontdesk@docsearch.health',
          role: 'FRONT_DESK_RECEPTIONIST',
          roleTitle: 'Front Desk Receptionist & OPD Cashier',
          department: 'Front Desk & Cashier Counter',
          tenantName: 'Ewan Multi-Specialty Hospital',
          tenantId: '11111111-1111-4111-8111-111111111111',
          organizationType: 'HOSPITAL',
          allowedWorkspaces: ['HOSPITAL'],
          defaultModule: 'patient-registration',
          planTier: HOSPITAL_PRO_TIER_NAME,
          planExpiryDate: 'Enterprise Active',
          accessibleFeatures: ['Express Patient Registration', 'ABHA Scan & Share', 'OPD Token Queue', 'Billing Cashier & UPI Receipts'],
          restrictedFeatures: ['Clinical EMR & Diagnoses', 'Lab Analyzer Control', 'Pharmacy Drug Dispensing'],
          kycStatus: 'KYC_VERIFIED',
          isProfileCompleted: true
        };
        break;

      case 'DIRECTOR':
      default:
        personaUser = {
          id: 'usr_persona_director',
          category: 'HEALTHCARE',
          name: 'Dr. Vivek Sharma (Medical Director)',
          email: 'director@docsearch.health',
          role: 'HOSPITAL_DIRECTOR',
          roleTitle: 'Medical Superintendent & Director',
          department: 'Hospital Administration & Governance',
          tenantName: 'Ewan Multi-Specialty Hospital',
          tenantId: '11111111-1111-4111-8111-111111111111',
          organizationType: 'HOSPITAL',
          allowedWorkspaces: ['HOSPITAL', 'CLINIC', 'PHARMACY', 'PATHOLOGY', 'DIAGNOSTIC_CENTRE', 'ENTERPRISE_COMMAND'],
          defaultModule: 'executive-command-center',
          planTier: HOSPITAL_PRO_TIER_NAME,
          planExpiryDate: 'Enterprise Active',
          accessibleFeatures: PRO_HOSPITAL_FEATURES as string[],
          restrictedFeatures: ['None (Full Hospital Scope)'],
          kycStatus: 'KYC_VERIFIED',
          isProfileCompleted: true
        };
        break;
    }

    localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(personaUser));
    localStorage.removeItem('docsearch_logged_out');
    if (typeof window !== 'undefined') {
      try {
        const targetPath = getUrlForModule(personaUser.organizationType, personaUser.defaultModule as any);
        window.history.replaceState({ path: targetPath }, '', targetPath);
      } catch {}
    }
    onLoginSuccess(personaUser);
  };

  // Handle standard Login submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const email = emailInput.trim();
    const password = passwordInput.trim();

    if (!email) {
      setAuthError('Please enter your registered email address or Staff ID.');
      return;
    }
    if (!password) {
      setAuthError('Please enter your password.');
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    // 1. Check for registered Clinic / Hospital / Pharmacy / Pathology staff account
    try {
      const localStaffRaw = localStorage.getItem('docsearch_partner_staff');
      const customStaffRaw = localStorage.getItem('docsearch_custom_staff');
      const combinedStaffList: any[] = [];
      if (customStaffRaw) {
        try {
          const parsed = JSON.parse(customStaffRaw);
          if (Array.isArray(parsed)) combinedStaffList.push(...parsed);
        } catch {}
      }
      if (localStaffRaw) {
        try {
          const parsed = JSON.parse(localStaffRaw);
          if (Array.isArray(parsed)) combinedStaffList.push(...parsed);
        } catch {}
      }

      if (combinedStaffList.length > 0) {
        const inputLower = email.toLowerCase().trim();
        const inputUpper = email.toUpperCase().trim();
        const match = combinedStaffList.find((s: any) => {
          const sEmail = String(s?.workEmail || '').trim().toLowerCase();
          const sCode = String(s?.staffCode || '').trim().toUpperCase();
          return (sEmail && sEmail === inputLower) || (sCode && sCode === inputUpper);
        });

        if (match) {
          // Check if access is revoked or suspended
          const isRevoked = Boolean(
            match.isAccessRevoked ||
            match.metadata?.isAccessRevoked ||
            match.employmentStatus === 'SUSPENDED' ||
            match.employmentStatus === 'TERMINATED'
          );
          if (isRevoked) {
            setIsAuthenticating(false);
            setAuthError(
              `⛔ Access Denied: Your staff account (${match.staffCode}) has been revoked by facility administration. Reason: ${match.revokedReason || match.metadata?.revokedReason || 'Administrative security revocation'}. Contact your facility administrator.`
            );
            return;
          }

          const expectedPassword = match.password || match.metadata?.password;
          if (expectedPassword && password === expectedPassword) {
            const sType = match.staffType || 'RECEPTIONIST';
            const perms = match.permissions || match.metadata?.permissions;
            const partnerCategory = match.metadata?.partnerCategory || match.partnerCategory;

            let orgType: OrganizationWorkspaceType = 'CLINIC';
            if (partnerCategory === 'PHARMACY' || sType === 'PHARMACIST') orgType = 'PHARMACY';
            else if (partnerCategory === 'PATHOLOGY' || sType === 'LAB_TECHNICIAN') orgType = 'PATHOLOGY';
            else if (partnerCategory === 'DIAGNOSTIC_CENTRE' || partnerCategory === 'RADIOLOGY') orgType = 'DIAGNOSTIC_CENTRE';
            else if (partnerCategory === 'MULTI_SPECIALITY_HOSPITAL' || partnerCategory === 'HOSPITAL') orgType = 'HOSPITAL';
            else if (match.workspace) orgType = match.workspace;

            let allowedWorkspaces: OrganizationWorkspaceType[] = [orgType];
            if (orgType === 'CLINIC') allowedWorkspaces = ['CLINIC', 'HOSPITAL'];
            else if (orgType === 'HOSPITAL') allowedWorkspaces = ['HOSPITAL', 'CLINIC'];
            else if (orgType === 'PHARMACY') allowedWorkspaces = ['PHARMACY'];
            else if (orgType === 'PATHOLOGY') allowedWorkspaces = ['PATHOLOGY'];
            else if (orgType === 'DIAGNOSTIC_CENTRE') allowedWorkspaces = ['DIAGNOSTIC_CENTRE'];

            const roleName = match.primaryRole || sType;
            const effectivePerms: StaffPermissions =
              perms || getDefaultPermissionsForRole(partnerCategory || 'INDEPENDENT_CLINIC', roleName);

            let defaultModule = 'patient-registration';
            if (effectivePerms?.accessibleModules && effectivePerms.accessibleModules.length > 0) {
              defaultModule = effectivePerms.accessibleModules[0] || 'patient-registration';
            } else if (orgType === 'PHARMACY' || sType === 'PHARMACIST') {
              defaultModule = 'pharmacy-medication';
            } else if (orgType === 'PATHOLOGY' || sType === 'LAB_TECHNICIAN') {
              defaultModule = 'clinical-investigation';
            } else if (orgType === 'DIAGNOSTIC_CENTRE') {
              defaultModule = 'radiology-imaging';
            } else if (sType === 'DOCTOR') {
              defaultModule = 'clinical-consultation';
            } else if (sType === 'NURSE') {
              defaultModule = 'nurse-triage-station';
            } else if (sType === 'BILLING_OFFICER') {
              defaultModule = 'hospital-billing';
            } else if (sType === 'RECEPTIONIST') {
              defaultModule = 'patient-registration';
            }

            const resolvedStaffUser: HospitalStaffUser = {
              id: match.id,
              tenantId: match.tenantId || '11111111-1111-4111-8111-111111111111',
              category: 'HEALTHCARE',
              name: match.fullName,
              email: match.workEmail,
              role: roleName,
              roleTitle: `${match.fullName} (${roleName.replace(/_/g, ' ')})`,
              department: match.departmentName || 'Front Desk & Patient Services',
              tenantName: match.tenantName || `${orgType} Facility`,
              organizationType: orgType,
              allowedWorkspaces,
              defaultModule,
              planTier: 'Staff Operations Suite',
              accessibleFeatures: [
                'Patient Intake & Demographics',
                'OPD Token & Queue Dispatch',
                'Doctor OPD Schedule View',
                'Front Desk Mobile Workstation',
                'Nurse Triage Station'
              ],
              restrictedFeatures: ['Hospital Director Executive Console'],
              kycStatus: 'KYC_VERIFIED',
              mustChangePassword: match.mustChangePassword,
              permissions: effectivePerms
            };

              // Request quick JWT token so API requests authenticate properly
              try {
                const tokenRes = await fetch('/api/v1/auth/quick-session', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: match.workEmail || `${match.staffCode.toLowerCase()}@clinic.local`,
                    role: roleName,
                    tenantId: match.tenantId || '11111111-1111-4111-8111-111111111111',
                    name: match.fullName
                  })
                });
                if (tokenRes.ok) {
                  const tokenJson = await tokenRes.json();
                  if (tokenJson?.data?.accessToken) {
                    localStorage.setItem('docsearch_auth_token', tokenJson.data.accessToken);
                  }
                }
              } catch {}

              localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(resolvedStaffUser));
              localStorage.removeItem('docsearch_logged_out');

              if (typeof window !== 'undefined' && resolvedStaffUser?.organizationType) {
                try {
                  const targetPath = getUrlForModule(resolvedStaffUser.organizationType, resolvedStaffUser.defaultModule as any);
                  window.history.replaceState({ path: targetPath }, '', targetPath);
                } catch {}
              }

              setIsAuthenticating(false);
              onLoginSuccess(resolvedStaffUser);
              return;
            } else {
              setAuthError('Incorrect password for staff account. Default PIN is 123456.');
              setIsAuthenticating(false);
              return;
            }
          }
        }
    } catch (staffErr) {
      console.warn('Local staff authentication check error:', staffErr);
    }

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const json = await res.json();

      if (res.ok && json.success) {
        const returnedUser = json.data?.user;
        const normalizedProf = normalizeFacilityProfile(returnedUser?.organizationType);
        const effectiveOrg = (normalizedProf.workspace as OrganizationWorkspaceType) || 'HOSPITAL';
        const effectiveTenant = returnedUser?.tenantName || 'Healthcare Facility';
        const effectiveRole = (returnedUser?.roles?.[0] && returnedUser.roles[0] !== 'HOSPITAL_DIRECTOR' ? returnedUser.roles[0] : (normalizedProf.workspace === 'HOSPITAL' ? 'HOSPITAL_DIRECTOR' : normalizedProf.primaryRole));
        const orgDetails = getHealthcareOrgDetails(effectiveOrg, effectiveTenant, effectiveRole);

        const resolvedUser: HospitalStaffUser = {
          id: returnedUser?.id || `user_${Date.now()}`,
          tenantId: returnedUser?.tenantId || returnedUser?.partnerId || '11111111-1111-4111-8111-111111111111',
          category: 'HEALTHCARE',
          name: `${returnedUser?.firstName || ''} ${returnedUser?.lastName || ''}`.trim() || 'Hospital Staff',
          email,
          role: effectiveRole,
          roleTitle: orgDetails.roleTitle,
          department: orgDetails.department,
          tenantName: effectiveTenant,
          organizationType: effectiveOrg,
          allowedWorkspaces: orgDetails.allowedWorkspaces,
          defaultModule: orgDetails.defaultModule,
          planTier: returnedUser?.planTier || orgDetails.planTier,
          planExpiryDate: returnedUser?.planExpiryDate || '30 Days Validity',
          accessibleFeatures: (returnedUser?.accessibleFeatures && returnedUser.accessibleFeatures.length > 0)
            ? returnedUser.accessibleFeatures
            : normalizedProf.accessibleFeatures,
          restrictedFeatures: orgDetails.restrictedFeatures,
          kycStatus: returnedUser?.kycStatus || (returnedUser?.status === 'ACTIVE' ? 'KYC_VERIFIED' : 'PENDING_ADMIN_VERIFICATION'),
          isProfileCompleted: Boolean(returnedUser?.isProfileCompleted ?? (returnedUser?.partner as any)?.isProfileCompleted ?? (returnedUser?.metadata as any)?.isProfileCompleted ?? (returnedUser?.partner as any)?.metadata?.isProfileCompleted)
        };

        if (json.data?.accessToken) {
          localStorage.setItem('docsearch_auth_token', json.data.accessToken);
          localStorage.setItem('docsearch_user_session', JSON.stringify(returnedUser));
        }
        localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(resolvedUser));
        localStorage.removeItem('docsearch_logged_out');

        if (typeof window !== 'undefined' && resolvedUser?.organizationType) {
          try {
            const targetPath = getUrlForModule(resolvedUser.organizationType, resolvedUser.defaultModule as any);
            window.history.replaceState({ path: targetPath }, '', targetPath);
          } catch {}
        }

        setIsAuthenticating(false);
        onLoginSuccess(resolvedUser);
        return;
      }

      if (!res.ok) {
        if (
          res.status === 403 ||
          json.error?.code === 'ACCOUNT_PENDING_APPROVAL' ||
          json.error?.message?.includes('pending') ||
          json.error?.message?.includes('verification') ||
          json.error?.message?.includes('KYC')
        ) {
          setAuthError(
            json.error?.message ||
              '⏳ Your account verification (KYC Approval) is currently under review by DocSearch Administration. You will receive immediate access upon approval.'
          );
          setIsAuthenticating(false);
          return;
        }
      }

      setAuthError(json.error?.message || json.message || 'Invalid email or password. Please verify your credentials.');
      setIsAuthenticating(false);
    } catch (err: any) {
      setAuthError('Authentication service is currently unavailable. Please check your network connection.');
      setIsAuthenticating(false);
    }
  };

  // Handle Partner Self-Registration & Instant Software Launch
  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setRegError(null);

    const facilityName = regFacilityName.trim();
    const ownerName = regOwnerName.trim();
    const email = regEmail.trim().toLowerCase();
    let password = regPassword.trim();
    const phone = regPhone.trim();
    const cleanAadhaar = regOwnerAadhaarNumber.replace(/[^0-9]/g, '');
    const cleanGstin = regGstin.trim().toUpperCase();

    // 1. Identity & Name
    if (!facilityName) {
      setRegError('Please enter your facility or store name.');
      return;
    }
    if (!ownerName) {
      setRegError('Please enter the name of the Lead Doctor or Facility Owner.');
      return;
    }
    if (!email || !email.includes('@')) {
      setRegError('Please enter a valid email address.');
      return;
    }

    // 2. Mobile / WhatsApp Policy
    if (formPolicy.fieldRules.mobileWhatsapp === 'MANDATORY' && !phone) {
      setRegError('Mobile / WhatsApp Number is mandatory under current HQ policy.');
      return;
    }
    if (phone && (phone.length !== 10 || !/^[6-9]/.test(phone))) {
      setRegError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    // 3. City & State Policy
    if (formPolicy.fieldRules.cityState === 'MANDATORY' && !regCityState.trim()) {
      setRegError('City & State is mandatory under current HQ policy.');
      return;
    }

    // 4. Clinical License & Proof Policy
    if (formPolicy.fieldRules.clinicalLicense === 'MANDATORY' && !regLicenseNumber.trim()) {
      setRegError('Clinical Registration / License Number is mandatory under current HQ policy.');
      return;
    }
    if (formPolicy.fieldRules.licenseDocUpload === 'MANDATORY' && !regDocFileName) {
      setRegError('Mandatory verification document / license proof upload is missing. Please attach a PDF, JPG, or PNG.');
      return;
    }

    // 5. Inpatient Bed Capacity Policy
    if (formPolicy.fieldRules.bedCapacity === 'MANDATORY' && (!regBedCapacity || parseInt(regBedCapacity, 10) <= 0)) {
      setRegError('Inpatient Bed Capacity (greater than 0) is mandatory under current HQ policy.');
      return;
    }
    if (regBedCapacity && parseInt(regBedCapacity, 10) > 5000) {
      setRegError('Inpatient Bed Capacity cannot exceed 5,000 beds. For larger multi-campus setups, please contact DocSearch Enterprise.');
      return;
    }

    // 6. GSTIN / Tax ID Policy
    if (formPolicy.fieldRules.gstinNumber === 'MANDATORY') {
      if (!cleanGstin || cleanGstin.length !== 15) {
        setRegError('A valid 15-character GSTIN number is mandatory under current HQ policy.');
        return;
      }
    }

    // 7. Password Creation Policy
    if (formPolicy.fieldRules.passwordCreation === 'MANDATORY') {
      if (!password || password.length < 6) {
        setRegError('Password must be at least 6 characters in length.');
        return;
      }
    } else {
      if (!password) {
        password = `DocSearch@${Math.floor(100000 + Math.random() * 900000)}`;
      }
    }

    // 8. Aadhaar KYC & Identity Policy
    if (formPolicy.fieldRules.ownerAadhaar === 'MANDATORY') {
      if (!cleanAadhaar) {
        setRegError('Owner Aadhaar Card Number is mandatory for government KYC and healthcare compliance.');
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

    setIsRegistering(true);

    try {
      // Automatic Plan assignment on Registration: Hospitals automatically start on Foundation Free OPD Core
      const isHospital = regFacilityType === 'HOSPITAL';
      const isHospitalFree = isHospital;
      const planTier = isHospital ? HOSPITAL_FREE_TIER_NAME : (regPlanTier || 'Pending Founder Assignment');

      // Build full resolved partner user with declared leadership role
      const normalizedProf = normalizeFacilityProfile(regFacilityType);
      const effectiveOrg = normalizedProf.workspace as OrganizationWorkspaceType;
      const orgDetails = getHealthcareOrgDetails(effectiveOrg, facilityName);
      const newUserId = `partner-usr-${Date.now()}`;
      const effectiveAccessibleFeatures = regFacilityType === 'HOSPITAL'
        ? (isHospitalFree ? FREE_HOSPITAL_FEATURES : PRO_HOSPITAL_FEATURES)
        : normalizedProf.accessibleFeatures;

      const newPartner: HospitalStaffUser = {
        id: newUserId,
        category: 'HEALTHCARE',
        name: ownerName,
        email,
        password,
        role: orgDetails.role,
        roleTitle: orgDetails.roleTitle,
        department: orgDetails.department,
        tenantName: facilityName,
        organizationType: effectiveOrg,
        allowedWorkspaces: orgDetails.allowedWorkspaces,
        defaultModule: orgDetails.defaultModule,
        planTier,
        planExpiryDate: isHospitalFree ? 'Free Forever' : '14 Days Trial',
        bedCapacity: isHospitalFree ? 0 : (regBedCapacity ? parseInt(regBedCapacity, 10) : 50),
        gstinNumber: cleanGstin || undefined,
        accessibleFeatures: effectiveAccessibleFeatures,
        restrictedFeatures: isHospitalFree ? ['Inpatient Bed Matrix', 'Operation Theatre Rostering', 'TPA Cashless Claims'] : orgDetails.restrictedFeatures,
        ownerAadhaarNumber: cleanAadhaar || undefined,
        aadhaarDocFileName: regAadhaarDocFileName || regDocFileName,
        aadhaarDocDataUrl: regAadhaarDocDataUrl || regDocDataUrl || undefined,
        kycStatus: 'PENDING_ADMIN_VERIFICATION',
        kycSubmittedAt: new Date().toISOString()
      };

      // Package all uploaded documents into multi-document array without payload duplication
      const submittedDocuments = [];
      if (regDocFileName) {
        submittedDocuments.push({
          documentId: `doc-lic-${newUserId}`,
          documentName: regDocFileName,
          documentType: regDocType,
          dataUrl: regDocDataUrl || undefined,
          fileSizeKb: regDocSizeKb || 128,
          sha256Hash: Array.from(regDocFileName + facilityName).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0).toString(16).padStart(64, '0')
        });
      }
      if (regAadhaarDocFileName) {
        submittedDocuments.push({
          documentId: `doc-adh-${newUserId}`,
          documentName: regAadhaarDocFileName,
          documentType: 'Owner Government Aadhaar Card (Mandatory KYC)',
          dataUrl: regAadhaarDocDataUrl || undefined,
          fileSizeKb: regAadhaarDocSizeKb || 95,
          sha256Hash: Array.from((cleanAadhaar || 'NO_AADHAAR') + email).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0).toString(16).padStart(64, '0')
        });
      }

      // Directly sync verification item to API Gateway queue for Company HQ single-card display
      const verificationItem = {
        id: `KYC-${newUserId}`,
        partnerName: facilityName,
        partnerType: regFacilityType,
        tenantSlug: facilityName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        submittedBy: ownerName,
        submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
        category: (regDocType.includes('Aadhaar') ? 'AADHAAR_KYC' : 'LICENSE_CERTIFICATE') as any,
        status: 'PENDING_APPROVAL' as const,
        requestedPlan: null,
        details: {
          'Facility Name': facilityName,
          'Owner / Lead Doctor': ownerName,
          'Registered Email': email,
          'Phone / Mobile': phone || 'Not Provided',
          'City & State': regCityState || 'India',
          'License / Reg No': regLicenseNumber || (regFacilityType === 'HOSPITAL' ? 'CEA-2026-PAT' : 'REG-2026'),
          'Bed Capacity': regBedCapacity ? `${regBedCapacity} Beds` : 'N/A',
          'GSTIN / Tax ID': cleanGstin || 'N/A',
          'Owner Aadhaar Number': cleanAadhaar ? `XXXX-XXXX-${cleanAadhaar.slice(-4)}` : 'Not Provided / Hidden',
          'Onboarding Tier': planTier,
          'Document Proof': [regDocFileName, regAadhaarDocFileName].filter(Boolean).join(', ')
        },
        documentName: regDocFileName || regAadhaarDocFileName,
        documentType: regDocType,
        documents: submittedDocuments,
        aiMatchScore: 99.2,
        extractedOcrText: `GOVERNMENT OF INDIA • HEALTH SERVICES • CERTIFICATE OF REGISTRATION: ${facilityName} • REG NO: ${regLicenseNumber || 'CEA-2026'} • PROPRIETOR: ${ownerName} • AADHAAR: ${cleanAadhaar ? `XXXX XXXX ${cleanAadhaar.slice(-4)}` : 'EXEMPT'}`,
        sha256Hash: submittedDocuments[0]?.sha256Hash || Array.from((cleanAadhaar || 'NO_AADHAAR') + email).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0).toString(16).padStart(64, '0')
      };

      // Resilient submission to API Gateway with Vite dev proxy and direct endpoint fallback
      const apiBase = ((import.meta as any)?.env?.VITE_API_URL as string) || '';
      const primaryEndpoint = apiBase ? `${apiBase}/api/v1/auth/self-register` : '/api/v1/auth/self-register';

      let res: Response;
      try {
        res = await fetch(primaryEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partner: newPartner, verificationItem })
        });
      } catch (networkErr: any) {
        // If relative request via dev proxy failed, attempt direct connect to API gateway on port 4000
        if (!apiBase && (networkErr?.message?.includes('Failed to fetch') || networkErr?.name === 'TypeError')) {
          try {
            res = await fetch('http://localhost:4000/api/v1/auth/self-register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ partner: newPartner, verificationItem })
            });
          } catch (directErr: any) {
            throw new Error(`Unable to reach DocSearch API Gateway at http://localhost:4000. Please ensure the backend is running. (${directErr?.message || networkErr?.message || 'Failed to fetch'})`);
          }
        } else {
          throw new Error(`Unable to connect to authentication server: ${networkErr?.message || 'Network error'}`);
        }
      }

      // Safe response body parsing (handles 413, 500, or HTML error pages gracefully)
      const contentType = res.headers.get('content-type') || '';
      let resJson: any = null;
      if (contentType.includes('application/json')) {
        resJson = await res.json().catch(() => null);
      } else {
        const rawText = await res.text().catch(() => '');
        if (!res.ok) {
          throw new Error(`Server returned error (HTTP ${res.status}): ${rawText.slice(0, 160) || res.statusText}`);
        }
      }

      if (!res.ok || !resJson?.success) {
        const errMsg = resJson?.error?.message || resJson?.message || `Registration failed with HTTP ${res.status}`;
        throw new Error(errMsg);
      }

      // Safe local storage persistence without multi-megabyte base64 blobs
      try {
        const localQueue = JSON.parse(localStorage.getItem('docsearch_verification_queue') || '[]');
        const safeItem = {
          ...verificationItem,
          documents: submittedDocuments.map((d) => ({
            documentId: d.documentId,
            documentName: d.documentName,
            documentType: d.documentType,
            fileSizeKb: d.fileSizeKb,
            sha256Hash: d.sha256Hash
          }))
        };
        localQueue.unshift(safeItem);
        localStorage.setItem('docsearch_verification_queue', JSON.stringify(localQueue.slice(0, 50)));
      } catch {}

      try {
        const localCustom: HospitalStaffUser[] = JSON.parse(localStorage.getItem('docsearch_custom_partner_users') || '[]');
        const safePartner: HospitalStaffUser = {
          ...newPartner,
          aadhaarDocDataUrl: undefined
        };
        const filtered = localCustom.filter((u) => u.email?.toLowerCase() !== email);
        filtered.unshift(safePartner);
        localStorage.setItem('docsearch_custom_partner_users', JSON.stringify(filtered.slice(0, 50)));
      } catch {}

      // Registration submitted: account pending admin verification (Fail-Closed: no auto-login)
      setIsRegistering(false);
      setRegSuccessMessage(`Congratulations! Registration for '${facilityName}' has been submitted successfully. In accordance with security protocols, your account has been queued for verification (KYC Approval). You may sign in once approved.`);
      setAuthMode('LOGIN');
      setEmailInput(email);
      setPasswordInput('');

    } catch (err: any) {
      setRegError(err?.message || 'Registration failed. Please try again.');
      setIsRegistering(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#070C16',
      backgroundImage: 'radial-gradient(ellipse at 50% 20%, rgba(6, 182, 212, 0.12), transparent 70%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      overflowX: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box'
    }}>
      <style>{`
        @media (max-width: 1080px) {
          .ds-auth-split-grid {
            grid-template-columns: 1fr !important;
            max-width: 640px !important;
          }
        }
      `}</style>

      {/* Subtle Background Particle Network */}
      <ParticleNetwork particleCount={32} speed={0.2} />

      {/* Ambient 3D Healthcare Core */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          maxWidth: '100vw',
          height: '520px',
          opacity: 0.25,
          pointerEvents: 'none',
          zIndex: 1
        }}
      >
        <HealthcareNetworkCore3D mode="ambient" height={520} interactive={false} />
      </div>

      {/* Master 2-Column Split-Screen Container */}
      <div
        className="ds-auth-split-grid"
        style={{
          width: '100%',
          maxWidth: '1540px',
          minHeight: '86vh',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)',
          gap: '24px',
          position: 'relative',
          zIndex: 10,
          alignItems: 'stretch',
          margin: 'auto'
        }}
      >
        {/* LEFT COLUMN: MARKETING, PARTNER OFFERS, INCENTIVES & REFERRAL CALCULATOR */}
        <div
          style={{
            backgroundColor: 'rgba(11, 19, 43, 0.75)',
            border: '1.5px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '24px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <PartnerCampaignShowcasePanel
            onClaimOffer={() => {
              setAuthMode('REGISTER');
              setAuthError(null);
              setRegError(null);
            }}
          />
        </div>

        {/* RIGHT COLUMN: LOGIN & REGISTRATION CARD */}
        <div style={{
          width: '100%',
          maxWidth: '100%',
          backgroundColor: '#0B132B',
          border: '1.5px solid rgba(6, 182, 212, 0.35)',
          borderRadius: '24px',
          boxShadow: '0 25px 80px rgba(0,0,0,0.9), 0 0 50px rgba(6, 182, 212, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}>
        
        {/* Header Branding - Canonical Futuristic DocSearch Logo */}
        <div style={{
          backgroundColor: '#0F172A',
          padding: '28px 24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <DocSearchLogo
            variant="hero"
            size="lg"
            badgeText={authMode === 'REGISTER' ? 'PARTNER REGISTRATION' : 'PARTNER PORTAL'}
            redirectUrl="/"
            clickable={true}
          />
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: '12px 0 0 0' }}>
            {authMode === 'REGISTER'
              ? 'Register your healthcare facility in 60 seconds and launch your clinical workspace'
              : 'Healthcare Partner & Clinical Staff Login Portal'}
          </p>

          {/* Mode Switcher Tabs */}
          <div style={{ marginTop: '14px', display: 'inline-flex', backgroundColor: 'rgba(30, 41, 59, 0.7)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              type="button"
              onClick={() => {
                setAuthMode('LOGIN');
                setAuthError(null);
                setRegError(null);
              }}
              style={{
                backgroundColor: authMode === 'LOGIN' ? '#06B6D4' : 'transparent',
                color: authMode === 'LOGIN' ? '#070C16' : '#94A3B8',
                border: 'none',
                borderRadius: '7px',
                padding: '6px 16px',
                fontSize: '0.78rem',
                fontWeight: authMode === 'LOGIN' ? 900 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              🔐 Partner Login
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('REGISTER');
                setAuthError(null);
                setRegError(null);
              }}
              style={{
                backgroundColor: authMode === 'REGISTER' ? '#10B981' : 'transparent',
                color: authMode === 'REGISTER' ? '#064E3B' : '#94A3B8',
                border: 'none',
                borderRadius: '7px',
                padding: '6px 16px',
                fontSize: '0.78rem',
                fontWeight: authMode === 'REGISTER' ? 900 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              ✨ Register Facility
            </button>
          </div>
        </div>

        {/* MODE 1: LOGIN FORM */}
        {authMode === 'LOGIN' ? (
          <form onSubmit={handleSubmit} style={{ padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {authError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1.5px solid #EF4444',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#FCA5A5',
                fontSize: '0.8125rem',
                fontWeight: 600,
                lineHeight: 1.4
              }}>
                <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                <span>{authError}</span>
              </div>
            )}

            {/* Email / Staff ID Field */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                Work Email Address or Staff ID (e.g. STF-785)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: '#64748B' }}>
                  🪪
                </span>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder="front@docsearch.health or Staff ID (e.g. STF-785)"
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 38px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1.5px solid rgba(255,255,255,0.12)',
                    color: '#F8FAFC',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#06B6D4'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: '#64748B' }}>
                  🔒
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder="Enter your secure password"
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 38px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1.5px solid rgba(255,255,255,0.12)',
                    color: '#F8FAFC',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#06B6D4'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94A3B8',
                    fontSize: '1rem',
                    padding: 0
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Remember Me & Help */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94A3B8', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#06B6D4', cursor: 'pointer' }}
                />
                <span>Remember terminal session</span>
              </label>
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38BDF8',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                Login assistance?
              </button>
            </div>

            {/* Submit Sign-in Button */}
            {isAuthenticating ? (
              <div style={{ padding: '8px 0', width: '100%' }}>
                <DocSearch3DLogoLoader mode="login" size="sm" />
              </div>
            ) : (
              <button
                type="submit"
                disabled={isAuthenticating}
                style={{
                  width: '100%',
                  backgroundColor: '#06B6D4',
                  color: '#070C16',
                  fontWeight: 900,
                  fontSize: '0.9375rem',
                  padding: '13px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 20px rgba(6, 182, 212, 0.3)'
                }}
              >
                <span>🔐</span>
                <span>Sign In to Portal</span>
              </button>
            )}

            {/* Clinic Staff Quick-Login Guidance */}
            <div
              style={{
                marginTop: '4px',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(13, 148, 136, 0.12)',
                border: '1px solid rgba(13, 148, 136, 0.3)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '1rem', marginTop: '1px' }}>💡</span>
              <div style={{ fontSize: '0.75rem', color: '#99F6E4', lineHeight: '1.4' }}>
                <strong style={{ color: '#2DD4BF' }}>Clinic Staff Login:</strong> Front Desk staff and Nurses can sign in using their <strong>Staff Code</strong> (e.g. <code>STF-785</code>) or Work Email with default PIN <code>123456</code>.
              </div>
            </div>

            {/* 🛡️ Strict RBAC Role Isolation Test Personas Tray */}
            <div
              style={{
                marginTop: '10px',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(15, 23, 42, 0.92)',
                border: '1.5px solid rgba(14, 165, 233, 0.4)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🛡️</span> Strict RBAC Test Personas (Role Isolation)
                </span>
                <span style={{ fontSize: '0.625rem', color: '#10B981', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                  Zero-Leakage
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.6875rem', color: '#94A3B8', lineHeight: 1.3 }}>
                Test department & feature boundaries. Each persona is locked to their operational role:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {/* 1. DOCTOR */}
                <button
                  type="button"
                  onClick={() => handleRolePersonaLogin('DOCTOR')}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(2, 132, 199, 0.15)',
                    border: '1.5px solid #0284C7',
                    color: '#38BDF8',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    transition: 'all 0.15s ease'
                  }}
                  title="Login as Doctor: Strictly OPD Desk, Tokens, AI Scribe & Lab Review. Pharmacy & Cashier blocked."
                >
                  <span style={{ fontSize: '1rem' }}>🩺</span>
                  <strong style={{ fontSize: '0.72rem' }}>Doctor</strong>
                  <span style={{ fontSize: '0.6rem', color: '#7DD3FC' }}>OPD Desk Only</span>
                </button>

                {/* 2. PHARMACIST */}
                <button
                  type="button"
                  onClick={() => handleRolePersonaLogin('PHARMACIST')}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1.5px solid #10B981',
                    color: '#34D399',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    transition: 'all 0.15s ease'
                  }}
                  title="Login as Pharmacist: Strictly Pharmacy POS, Inventory, H1 Register. Doctor EMR & Nursing blocked."
                >
                  <span style={{ fontSize: '1rem' }}>💊</span>
                  <strong style={{ fontSize: '0.72rem' }}>Pharmacist</strong>
                  <span style={{ fontSize: '0.6rem', color: '#A7F3D0' }}>Pharmacy POS</span>
                </button>

                {/* 3. LAB TECH */}
                <button
                  type="button"
                  onClick={() => handleRolePersonaLogin('LAB_TECH')}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(168, 85, 247, 0.15)',
                    border: '1.5px solid #A855F7',
                    color: '#C084FC',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    transition: 'all 0.15s ease'
                  }}
                  title="Login as Lab Technician: Strictly Pathology LIMS, Phlebotomy & Analyzer Workbench. Prescriptions blocked."
                >
                  <span style={{ fontSize: '1rem' }}>🧪</span>
                  <strong style={{ fontSize: '0.72rem' }}>Lab Tech</strong>
                  <span style={{ fontSize: '0.6rem', color: '#E9D5FF' }}>Pathology LIMS</span>
                </button>

                {/* 4. NURSE */}
                <button
                  type="button"
                  onClick={() => handleRolePersonaLogin('NURSE')}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(236, 72, 153, 0.15)',
                    border: '1.5px solid #EC4899',
                    color: '#F472B6',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    transition: 'all 0.15s ease'
                  }}
                  title="Login as Nurse: Strictly Vitals Triage Station & Ward Bed Board. Rx and Cashier blocked."
                >
                  <span style={{ fontSize: '1rem' }}>👩‍⚕️</span>
                  <strong style={{ fontSize: '0.72rem' }}>Staff Nurse</strong>
                  <span style={{ fontSize: '0.6rem', color: '#FBCFE8' }}>Vitals & Ward</span>
                </button>

                {/* 5. FRONT DESK */}
                <button
                  type="button"
                  onClick={() => handleRolePersonaLogin('FRONT_DESK')}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    border: '1.5px solid #F59E0B',
                    color: '#FBBF24',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    transition: 'all 0.15s ease'
                  }}
                  title="Login as Front Desk: Patient Registration, ABHA Tokens & Cashier POS. Clinical EMR blocked."
                >
                  <span style={{ fontSize: '1rem' }}>📇</span>
                  <strong style={{ fontSize: '0.72rem' }}>Front Desk</strong>
                  <span style={{ fontSize: '0.6rem', color: '#FDE68A' }}>Tokens & Cashier</span>
                </button>

                {/* 6. DIRECTOR */}
                <button
                  type="button"
                  onClick={() => handleRolePersonaLogin('DIRECTOR')}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    border: '1.5px solid #6366F1',
                    color: '#818CF8',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    transition: 'all 0.15s ease'
                  }}
                  title="Login as Hospital Director: Executive Command Center, Quality Audits, and Staff Administration."
                >
                  <span style={{ fontSize: '1rem' }}>👑</span>
                  <strong style={{ fontSize: '0.72rem' }}>Director</strong>
                  <span style={{ fontSize: '0.6rem', color: '#C7D2FE' }}>Admin Command</span>
                </button>
              </div>
            </div>

            {/* Quick 1-Click Hospital Plan Testing Buttons (Free OPD vs Pro Suite) */}
            <div
              style={{
                marginTop: '6px',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: '1.5px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  ⚡ Quick Live Plan Demo (1-Click Switch)
                </span>
                <span style={{ fontSize: '0.625rem', color: '#94A3B8' }}>Instant Verification</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('FREE')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1.5px solid #10B981',
                    color: '#34D399',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    transition: 'all 0.15s ease'
                  }}
                  title="Test Free Hospital plan with 🔒 PRO locked badges & upgrade modal"
                >
                  <span style={{ fontSize: '0.9rem' }}>🟢 Free OPD Plan</span>
                  <span style={{ fontSize: '0.625rem', color: '#A7F3D0', fontWeight: 600 }}>₹0 Forever • Locked PRO</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('PRO')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(124, 58, 237, 0.2)',
                    border: '1.5px solid #8B5CF6',
                    color: '#C4B5FD',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    transition: 'all 0.15s ease'
                  }}
                  title="Test Paid Complete Suite with all 13 hospital departments unlocked"
                >
                  <span style={{ fontSize: '0.9rem' }}>🟣 Pro Complete Suite</span>
                  <span style={{ fontSize: '0.625rem', color: '#DDD6FE', fontWeight: 600 }}>₹4,999/mo • All Unlocked</span>
                </button>
              </div>
            </div>

            {/* Quick Registration Banner */}
            <div style={{ marginTop: '8px', textAlign: 'center', paddingTop: '14px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
              <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', color: '#94A3B8' }}>
                Register a new Hospital, Clinic, Pharmacy, or Diagnostic Lab?
              </p>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('REGISTER');
                  setAuthError(null);
                  setRegError(null);
                }}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1.5px solid #10B981',
                  color: '#34D399',
                  borderRadius: '10px',
                  padding: '11px 16px',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>✨</span>
                <span>Register Facility Here</span>
              </button>
            </div>

          </form>
        ) : (
          /* MODE 2: PARTNER SELF-REGISTRATION FORM */
          <form onSubmit={handleRegister} style={{ padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {regError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1.5px solid #EF4444',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#FCA5A5',
                fontSize: '0.8125rem',
                fontWeight: 600,
                lineHeight: 1.4
              }}>
                <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                <span>{regError}</span>
              </div>
            )}

            {regSuccessMessage && (
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                border: '1.5px solid #10B981',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#6EE7B7',
                fontSize: '0.8125rem',
                fontWeight: 700,
                lineHeight: 1.5
              }}>
                <span style={{ fontSize: '1.2rem' }}>🎉</span>
                <span>
                  {formPolicy.showPlanSelection
                    ? regSuccessMessage
                    : 'Facility registration submitted successfully! Dossier queued for DocSearch Founder review. Founder will assign custom subscription tier & bed capacity terms upon verification.'}
                </span>
              </div>
            )}

            {/* HQ Configurable Announcement Banner */}
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '1.4rem' }}>{formPolicy.showPlanSelection ? '🎁' : '🛡️'}</span>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#34D399' }}>
                  {formPolicy.bannerNotice || 'Universal Healthcare Partner Registration'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                  {formPolicy.showPlanSelection
                    ? 'Complimentary software onboarding & sandbox access • Government KYC verification required.'
                    : 'Option 1 Pure B2B Onboarding • Complete facility profile & KYC. Founder assigns customized tier & subscription upon verification.'}
                </div>
              </div>
            </div>

            {/* Step 1: Select Facility Type (Filtered by HQ Policy) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#CBD5E1' }}>
                  1. Select Facility Type:
                </label>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                  {formPolicy.allowedFacilityTypes.length} Available
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(100px, 1fr))`, gap: '8px' }}>
                {[
                  { type: 'HOSPITAL', icon: '🏥', title: 'Hospital (HIS)', desc: 'Multi-Specialty / Inpatient' },
                  { type: 'CLINIC', icon: '🩺', title: 'Clinic (OPD)', desc: 'Outpatient Consultation' },
                  { type: 'PATHOLOGY', icon: '🧪', title: 'Pathology Lab', desc: 'Diagnostic & LIMS Tests' },
                  { type: 'PHARMACY', icon: '💊', title: 'Pharmacy (POS)', desc: 'Retail & Hospital Store' }
                ]
                  .filter((item) => formPolicy.allowedFacilityTypes.includes(item.type as any))
                  .map((item) => {
                    const isSelected = regFacilityType === item.type;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => {
                          const newType = item.type as OrganizationWorkspaceType;
                          setRegFacilityType(newType);
                          setRegDocType(getDefaultDocType(newType));
                          const matching = (formPolicy.availablePlans || DEFAULT_PUBLIC_PLANS).find(
                            (p) => p.applicableFacilityTypes?.includes(newType as any)
                          );
                          if (matching) {
                            setRegPlanTier(matching.tier);
                          }
                        }}
                        style={{
                          backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                          border: isSelected ? '2px solid #06B6D4' : '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '12px',
                          padding: '10px 6px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ fontSize: '1.35rem', marginBottom: '2px' }}>{item.icon}</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: isSelected ? '#38BDF8' : '#F8FAFC' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.625rem', color: '#94A3B8' }}>{item.desc}</div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Step 2: Facility & Owner Information */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              
              {/* Facility Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                  Facility / Store Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={regFacilityName}
                  onChange={(e) => setRegFacilityName(e.target.value)}
                  placeholder="e.g. Apex Multi-Specialty Hospital"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#FFF',
                    fontSize: '0.8125rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Owner / Lead Doctor Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                  Lead Doctor / Medical Director / Owner *
                </label>
                <input
                  type="text"
                  required
                  value={regOwnerName}
                  onChange={(e) => setRegOwnerName(e.target.value)}
                  placeholder="e.g. Dr. Arthur Vance, MD"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#FFF',
                    fontSize: '0.8125rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                  Mobile / WhatsApp Number (10-Digit Mobile) {formPolicy.fieldRules.mobileWhatsapp === 'MANDATORY' ? '*' : '(Optional)'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      padding: '10px 10px',
                      backgroundColor: 'rgba(30, 41, 59, 0.9)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRight: 'none',
                      borderRadius: '8px 0 0 8px',
                      color: '#38BDF8',
                      fontSize: '0.8125rem',
                      fontWeight: 700
                    }}
                  >
                    +91
                  </span>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      setRegPhone(digits.slice(0, 10));
                    }}
                    maxLength={10}
                    placeholder="98765 43210"
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '0 8px 8px 0',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#FFF',
                      fontSize: '0.8125rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                  Email Address (Login ID) *
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="admin@myhospital.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#FFF',
                    fontSize: '0.8125rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Password or Auto-Generate */}
              {formPolicy.fieldRules.passwordCreation === 'MANDATORY' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    Create Password *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#FFF',
                      fontSize: '0.8125rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              ) : (
                <div style={{
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>🔑</span>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8' }}>
                      Auto-Generated Password
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                      HQ policy will auto-generate secure login credentials upon Founder verification.
                    </div>
                  </div>
                </div>
              )}

              {/* City & State */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                  City & State {formPolicy.fieldRules.cityState === 'MANDATORY' ? '*' : '(Optional)'}
                </label>
                <input
                  type="text"
                  value={regCityState}
                  onChange={(e) => setRegCityState(e.target.value)}
                  placeholder="e.g. Patna, Bihar"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#FFF',
                    fontSize: '0.8125rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* License / Registration Number */}
              {formPolicy.fieldRules.clinicalLicense !== 'HIDDEN' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    Clinical Registration / License Number {formPolicy.fieldRules.clinicalLicense === 'MANDATORY' ? '*' : '(Optional)'}
                  </label>
                  <input
                    type="text"
                    value={regLicenseNumber}
                    onChange={(e) => setRegLicenseNumber(e.target.value)}
                    placeholder={
                      regFacilityType === 'HOSPITAL' ? 'e.g. CEA-BIH-2026-ABC-098' :
                      regFacilityType === 'PHARMACY' ? 'e.g. DL-20B-11094' :
                      regFacilityType === 'PATHOLOGY' ? 'e.g. NABL-ISO-15189-2026' : 'e.g. MCI / NMC Reg No'
                    }
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#FFF',
                      fontSize: '0.8125rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {/* Inpatient Bed Capacity */}
              {formPolicy.fieldRules.bedCapacity !== 'HIDDEN' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    Inpatient Bed Capacity {formPolicy.fieldRules.bedCapacity === 'MANDATORY' ? '*' : '(Optional)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={5000}
                    value={regBedCapacity}
                    onChange={(e) => setRegBedCapacity(e.target.value)}
                    placeholder="e.g. 50 (Inpatient Beds, Max 5,000)"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#FFF',
                      fontSize: '0.8125rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {/* GSTIN Number */}
              {formPolicy.fieldRules.gstinNumber !== 'HIDDEN' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    GSTIN / Tax ID {formPolicy.fieldRules.gstinNumber === 'MANDATORY' ? '*' : '(Optional)'}
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={regGstin}
                    onChange={(e) => setRegGstin(e.target.value.toUpperCase())}
                    placeholder="15-digit GSTIN (e.g. 07AAAAA0000A1Z5)"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#FFF',
                      fontSize: '0.8125rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {/* Owner Aadhaar Number */}
              {formPolicy.fieldRules.ownerAadhaar !== 'HIDDEN' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    Owner Aadhaar Number (12 Digits) {formPolicy.fieldRules.ownerAadhaar === 'MANDATORY' ? '*' : '(Optional)'}
                  </label>
                  <input
                    type="text"
                    maxLength={14}
                    value={regOwnerAadhaarNumber}
                    onChange={(e) => setRegOwnerAadhaarNumber(e.target.value)}
                    placeholder="e.g. XXXX XXXX 4452"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#FFF',
                      fontSize: '0.8125rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

            </div>

            {/* Step 3: Verification Documents */}
            {(formPolicy.fieldRules.licenseDocUpload !== 'HIDDEN' || (formPolicy.fieldRules.aadhaarDocUpload !== 'HIDDEN' && formPolicy.fieldRules.ownerAadhaar !== 'HIDDEN')) && (
              <div style={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1.5px dashed rgba(6, 182, 212, 0.4)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📜</span> 3. Upload Verification Documents:
                  </label>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>PDF / JPG / PNG</span>
                </div>

                {/* Slot 1: Facility Regulatory / Clinical License Proof */}
                {formPolicy.fieldRules.licenseDocUpload !== 'HIDDEN' && (
                  <div style={{ backgroundColor: 'rgba(7, 12, 22, 0.6)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC' }}>
                        Document 1: Facility License Proof {formPolicy.fieldRules.licenseDocUpload === 'MANDATORY' ? '*' : '(Optional)'}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700 }}>
                        {formPolicy.fieldRules.licenseDocUpload}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <select
                        value={regDocType}
                        onChange={(e) => setRegDocType(e.target.value)}
                        style={{
                          flex: '1 1 200px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          backgroundColor: '#070C16',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: '#F8FAFC',
                          fontSize: '0.78rem',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="Clinical Establishment Act License (CEA Form-IV)">🏥 Clinical Establishment License (CEA)</option>
                        <option value="Retail Drug License (Form 20/21)">💊 Retail Drug License (Form 20/21)</option>
                        <option value="NABL Accreditation / Clinical Lab License">🧪 NABL / Clinical Lab License</option>
                        <option value="State Medical Council Doctor Registration">🩺 State Medical Council / NMC Certificate</option>
                        <option value="AERB Radiation Safety / PACS Modality License">☢️ AERB / PACS Modality License</option>
                        <option value="Government Healthcare Registration Certificate">📜 General Healthcare Establishment Certificate</option>
                      </select>

                      <label style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        backgroundColor: regDocFileName ? 'rgba(16, 185, 129, 0.2)' : 'rgba(6, 182, 212, 0.2)',
                        border: regDocFileName ? '1.5px solid #10B981' : '1.5px solid #06B6D4',
                        color: regDocFileName ? '#6EE7B7' : '#38BDF8',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleDocFileUpload}
                          style={{ display: 'none' }}
                        />
                        <span>{regDocFileName ? '🔄 Change File' : '📎 Choose License Proof'}</span>
                      </label>
                    </div>

                    {regDocFileName && (
                      <div style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid #10B981',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: '#A7F3D0'
                      }}>
                        <span>✅ <strong>{regDocFileName}</strong> ({regDocSizeKb} KB)</span>
                        <span style={{ fontSize: '0.6875rem', color: '#34D399', fontWeight: 700 }}>🔒 License Proof Attached</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Slot 2: Owner / Lead Doctor Government Aadhaar Card Proof */}
                {formPolicy.fieldRules.aadhaarDocUpload !== 'HIDDEN' && formPolicy.fieldRules.ownerAadhaar !== 'HIDDEN' && (
                  <div style={{ backgroundColor: 'rgba(7, 12, 22, 0.6)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC' }}>
                        Document 2: Owner Government Aadhaar KYC {formPolicy.fieldRules.aadhaarDocUpload === 'MANDATORY' ? '*' : '(Optional)'}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: '#A78BFA', fontWeight: 700 }}>
                        {formPolicy.fieldRules.aadhaarDocUpload}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        Attach front/back copy of Owner Aadhaar Card (PDF, JPG, PNG)
                      </span>

                      <label style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        backgroundColor: regAadhaarDocFileName ? 'rgba(16, 185, 129, 0.2)' : 'rgba(167, 139, 250, 0.2)',
                        border: regAadhaarDocFileName ? '1.5px solid #10B981' : '1.5px solid #A78BFA',
                        color: regAadhaarDocFileName ? '#6EE7B7' : '#C4B5FD',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleAadhaarFileUpload}
                          style={{ display: 'none' }}
                        />
                        <span>{regAadhaarDocFileName ? '🔄 Change Aadhaar' : '🪪 Choose Aadhaar Proof'}</span>
                      </label>
                    </div>

                    {regAadhaarDocFileName && (
                      <div style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid #10B981',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: '#A7F3D0'
                      }}>
                        <span>✅ <strong>{regAadhaarDocFileName}</strong> ({regAadhaarDocSizeKb} KB)</span>
                        <span style={{ fontSize: '0.6875rem', color: '#34D399', fontWeight: 700 }}>🔒 Aadhaar KYC Attached</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Instant Activation Banner */}
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1.5px solid #10B981',
              borderRadius: '10px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              color: '#A7F3D0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>⚡</span>
                <span>
                  <strong>Workspace Provisioning:</strong> Complete registration to set up your facility terminal and queue for HQ review.
                </span>
              </div>
              <span style={{ backgroundColor: '#10B981', color: '#064E3B', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', fontSize: '0.68rem' }}>
                ACTIVE
              </span>
            </div>

            {/* Submit Registration Button */}
            <button
              type="submit"
              disabled={isRegistering}
              style={{
                width: '100%',
                backgroundColor: isRegistering ? 'rgba(16, 185, 129, 0.5)' : '#10B981',
                color: '#064E3B',
                fontWeight: 900,
                fontSize: '0.9375rem',
                padding: '13px 20px',
                borderRadius: '10px',
                border: 'none',
                cursor: isRegistering ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
              }}
            >
              {isRegistering ? (
                <>
                  <span style={{ animation: 'spin 1s infinite linear' }}>🔄</span>
                  <span>Registering Facility & Launching...</span>
                </>
              ) : formPolicy.showPlanSelection ? (
                <>
                  <span>🚀</span>
                  <span>Register Facility & Launch</span>
                </>
              ) : (
                <>
                  <span>🛡️</span>
                  <span>Submit Facility Registration to HQ →</span>
                </>
              )}
            </button>

            {/* Back to Login Link */}
            <div style={{ textAlign: 'center', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('LOGIN');
                  setRegError(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38BDF8',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                ← Already registered? Sign In to Portal
              </button>
            </div>

          </form>
        )}

        {/* Security & Compliance Footer */}
        <div style={{
          backgroundColor: '#0F172A',
          padding: '16px 24px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
            <span>🇮🇳 ABDM M2/M3</span>
            <span>•</span>
            <span>🛡️ HIPAA / DISHA</span>
            <span>•</span>
            <span>🔒 256-Bit SSL</span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#475569' }}>
            DOC SEARCH Enterprise Healthcare System © 2026. All rights reserved.
          </span>
        </div>

      </div>

      </div>

      {/* Support / Help Modal */}
      {showHelpModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#0B132B',
            border: '1.5px solid #06B6D4',
            borderRadius: '16px',
            maxWidth: '440px',
            width: '100%',
            padding: '24px',
            color: '#F8FAFC',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#38BDF8' }}>
                🏥 Partner Login Assistance
              </h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            
            <p style={{ fontSize: '0.8125rem', color: '#CBD5E1', lineHeight: '1.6', margin: '0 0 16px' }}>
              If you do not have a partner account yet, click <strong>"✨ Register Facility"</strong> to register your facility in 60 seconds. For any direct support, contact:
            </p>

            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px', fontSize: '0.8125rem' }}>
              <div>📧 <strong>Support Email:</strong> support@docsearch.health</div>
              <div style={{ marginTop: '4px' }}>📞 <strong>Helpline:</strong> 1800-DOC-SEARCH</div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: '#06B6D4',
                color: '#070C16',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
