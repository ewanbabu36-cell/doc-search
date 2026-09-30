import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Badge } from '@docsearch/ui-kit';
import type { SubscriptionDto, SubscriptionStatus, BillingCycle, PartnerProfileDto } from '@docsearch/api-contracts';
import { partnerService } from '../../services/partner-service.js';
import { mockPartnerProfiles } from '../../services/mock-partner-data.js';

interface PlanTierOption {
  code: string;
  name: string;
  basePriceInr: number;
  doctorSeats: number;
  secondaryQuota: number;
  opdQuota: number;
  cloudStorageGb: number;
  badge: string;
  description: string;
}

interface OrgTypeConfig {
  code: string;
  label: string;
  icon: string;
  description: string;
  secondaryQuotaLabel: string;
  secondaryQuotaUnit: string;
  secondaryQuotaDefault: number;
  secondaryQuotaPresets: number[];
  productSuites: Array<{ label: string; value: string }>;
  planTiers: PlanTierOption[];
  defaultModules: string[];
}

export interface CustomizerModuleItem {
  id: string;
  key: string;
  title: string;
  desc: string;
  icon: string;
  annualFeeInr: number;
  enabled: boolean;
  isCustom?: boolean;
}

const INITIAL_DEFAULT_MODULES: CustomizerModuleItem[] = [
  {
    id: 'mod-ai-voice',
    key: 'enableAiVoiceScribe',
    title: 'AI Clinical Voice Scribe',
    desc: 'Ambient SOAP notes transcription with NMC compliance',
    icon: '🤖',
    annualFeeInr: 20000,
    enabled: true
  },
  {
    id: 'mod-abdm',
    key: 'enableAbdmGateway',
    title: 'ABDM 2.0 Health Locker',
    desc: 'ABHA creation, consent manager & M1/M2/M3 milestone relay',
    icon: '🇮🇳',
    annualFeeInr: 15000,
    enabled: true
  },
  {
    id: 'mod-tpa',
    key: 'enableTpaClaims',
    title: 'Cashless TPA & PMJAY Adjudicator',
    desc: 'Instant pre-auth & claim submission to 35+ insurance TPAs',
    icon: '🏥',
    annualFeeInr: 15000,
    enabled: true
  },
  {
    id: 'mod-pharmacy',
    key: 'enablePharmacyInventory',
    title: 'In-House Pharmacy & POS Suite',
    desc: 'Batch tracking, expiry alerts, barcode dispensing',
    icon: '💊',
    annualFeeInr: 20000,
    enabled: true
  },
  {
    id: 'mod-pacs',
    key: 'enableDicomPacs',
    title: 'Diagnostic Pathology & Cloud PACS',
    desc: 'Bidirectional analyzer interfacing & web DICOM viewer',
    icon: '🔬',
    annualFeeInr: 25000,
    enabled: false
  },
  {
    id: 'mod-telemetry',
    key: 'enableEmergencyTelemetry',
    title: '24/7 Emergency & ICU Gateway',
    desc: 'Resuscitation bays, ventilator metrics & acute alerts',
    icon: '🚑',
    annualFeeInr: 15000,
    enabled: true
  },
  {
    id: 'mod-whitelabel',
    key: 'enableWhiteLabelApps',
    title: 'Hospital White-Label Suite',
    desc: 'Dedicated custom domain CNAME & branded Android/iOS apps',
    icon: '🎨',
    annualFeeInr: 20000,
    enabled: true
  },
  {
    id: 'mod-sso',
    key: 'enableSsoSaml',
    title: 'Enterprise SSO & SAML 2.0',
    desc: 'Active Directory, Okta & Multi-Factor authentication',
    icon: '🔐',
    annualFeeInr: 15000,
    enabled: false
  }
];

const ORGANIZATION_CONFIG: Record<string, OrgTypeConfig> = {
  HOSPITAL_CHAIN: {
    code: 'HOSPITAL_CHAIN',
    label: 'Hospital Chain / Multi-Branch Network',
    icon: '🏥',
    description: 'Multi-facility tertiary/secondary care hospital chain with consolidated billing',
    secondaryQuotaLabel: 'LICENSED INPATIENT BEDS',
    secondaryQuotaUnit: 'Beds',
    secondaryQuotaDefault: 150,
    secondaryQuotaPresets: [50, 150, 300, 500],
    productSuites: [
      { label: 'DocSearch Full Hospital Operating System (HIS/HMS)', value: 'DocSearch Full Hospital Operating System' },
      { label: 'DocSearch Enterprise Healthcare Network Suite', value: 'DocSearch Enterprise Healthcare Network Suite' },
      { label: 'DocSearch 24/7 Emergency & ICU Telemetry OS', value: 'DocSearch 24/7 Emergency & ICU Telemetry OS' },
      { label: 'DocSearch Clinical AI & Ambient Voice Scribe Suite', value: 'DocSearch Clinical AI & Ambient Voice Scribe Suite' }
    ],
    planTiers: [
      {
        code: 'TIER_HOSP_FLAGSHIP',
        name: 'Enterprise Hospital Network Tier (Annual)',
        basePriceInr: 250000,
        doctorSeats: 25,
        secondaryQuota: 150,
        opdQuota: 5000,
        cloudStorageGb: 250,
        badge: '🏆 Network Flagship',
        description: 'Comprehensive hospital infrastructure with 25 Doctor seats & 150 Inpatient Beds'
      },
      {
        code: 'TIER_HOSP_MULTI',
        name: 'Multi-Branch Tertiary Network Tier',
        basePriceInr: 350000,
        doctorSeats: 50,
        secondaryQuota: 300,
        opdQuota: 15000,
        cloudStorageGb: 500,
        badge: '💎 Multi-Branch Enterprise',
        description: 'Consolidated inter-branch command, 50 Doctor seats & 300 Beds'
      },
      {
        code: 'TIER_HOSP_CUSTOM',
        name: 'Custom Enterprise Cloud Private Tier',
        basePriceInr: 500000,
        doctorSeats: 100,
        secondaryQuota: 500,
        opdQuota: 35000,
        cloudStorageGb: 1000,
        badge: '☁️ Dedicated Cloud VPC',
        description: 'Dedicated HIPAA Cloud VPC, custom SLA, high capacity'
      }
    ],
    defaultModules: ['enableAbdmGateway', 'enableTpaClaims', 'enablePharmacyInventory', 'enableEmergencyTelemetry', 'enableWhiteLabelApps']
  },

  HOSPITAL_SINGLE: {
    code: 'HOSPITAL_SINGLE',
    label: 'Single Multi-Specialty Hospital',
    icon: '🏥',
    description: 'Independent tertiary or secondary care multi-specialty hospital',
    secondaryQuotaLabel: 'LICENSED INPATIENT BEDS',
    secondaryQuotaUnit: 'Beds',
    secondaryQuotaDefault: 50,
    secondaryQuotaPresets: [25, 50, 100, 200],
    productSuites: [
      { label: 'DocSearch Full Hospital Operating System (HIS/HMS)', value: 'DocSearch Full Hospital Operating System' },
      { label: 'DocSearch 24/7 Emergency & Inpatient Care Suite', value: 'DocSearch 24/7 Emergency & Inpatient Care Suite' },
      { label: 'DocSearch Clinical AI & Voice Scribe Suite', value: 'DocSearch Clinical AI & Voice Scribe Suite' }
    ],
    planTiers: [
      {
        code: 'TIER_HOSP_GOLD',
        name: 'Gold Family Health & Hospital Suite',
        basePriceInr: 150000,
        doctorSeats: 15,
        secondaryQuota: 50,
        opdQuota: 3000,
        cloudStorageGb: 100,
        badge: '⭐ Hospital Gold',
        description: 'Mid-sized hospitals & nursing homes with 15 Doctor seats & 50 Inpatient Beds'
      },
      {
        code: 'TIER_HOSP_PRO',
        name: 'Hospital Enterprise Flagship Tier',
        basePriceInr: 250000,
        doctorSeats: 25,
        secondaryQuota: 150,
        opdQuota: 6000,
        cloudStorageGb: 250,
        badge: '🏆 Enterprise Tier',
        description: 'Full multi-specialty hospital with 25 Doctor seats & 150 Beds'
      }
    ],
    defaultModules: ['enableAbdmGateway', 'enableTpaClaims', 'enablePharmacyInventory', 'enableEmergencyTelemetry']
  },

  PHARMACY: {
    code: 'PHARMACY',
    label: 'Pharmacy / Retail Chemist & Druggist / Chain',
    icon: '💊',
    description: 'Allopathic retail chemist, wholesale inventory, Schedule H1 drug register & POS',
    secondaryQuotaLabel: 'ACTIVE POS BILLING COUNTERS',
    secondaryQuotaUnit: 'Counters',
    secondaryQuotaDefault: 2,
    secondaryQuotaPresets: [1, 2, 3, 5, 10],
    productSuites: [
      { label: 'DocSearch Fast Pharmacy POS & Retail Chemist OS', value: 'DocSearch Fast Pharmacy POS & Retail Chemist OS' },
      { label: 'DocSearch Wholesale GST Invoice Ingestion & Inventory Suite', value: 'DocSearch Wholesale GST Invoice Ingestion & Inventory Suite' },
      { label: 'DocSearch Schedule H1 Drug Register & Inspector Compliance Suite', value: 'DocSearch Schedule H1 Drug Register & Inspector Compliance Suite' },
      { label: 'DocSearch Omnichannel Pharmacy Delivery & Refill Scribe', value: 'DocSearch Omnichannel Pharmacy Delivery & Refill Scribe' }
    ],
    planTiers: [
      {
        code: 'TIER_PHARM_STARTER',
        name: 'Retail Chemist & Druggist Starter Tier',
        basePriceInr: 24000,
        doctorSeats: 1,
        secondaryQuota: 1,
        opdQuota: 2500,
        cloudStorageGb: 25,
        badge: '💊 Chemist Starter',
        description: 'Single POS counter, barcode dispensing, batch expiry tracking & 2,500 monthly bills'
      },
      {
        code: 'TIER_PHARM_PRO',
        name: 'Pharmacy Multi-Counter & Wholesale Pro Tier',
        basePriceInr: 48000,
        doctorSeats: 3,
        secondaryQuota: 3,
        opdQuota: 10000,
        cloudStorageGb: 100,
        badge: '⚡ Multi-Counter Pro',
        description: '3 POS Counters, Schedule H1 compliance register, wholesale invoice OCR & 10,000 bills'
      },
      {
        code: 'TIER_PHARM_CHAIN',
        name: 'Retail Pharmacy Chain Enterprise Tier',
        basePriceInr: 120000,
        doctorSeats: 10,
        secondaryQuota: 8,
        opdQuota: 50000,
        cloudStorageGb: 300,
        badge: '🏢 Pharmacy Chain ERP',
        description: 'Multi-store chemist network, central warehouse sync, unlimited bills & e-prescriptions'
      }
    ],
    defaultModules: ['enablePharmacyInventory', 'enableAbdmGateway']
  },

  DIAGNOSTIC_CHAIN: {
    code: 'DIAGNOSTIC_CHAIN',
    label: 'Diagnostic Pathology Lab & Imaging (NABL LIS)',
    icon: '🧪',
    description: 'NABL accredited pathology laboratory, analyzer interfacing, barcoded samples & PACS',
    secondaryQuotaLabel: 'CONNECTED AUTOMATED ANALYZERS',
    secondaryQuotaUnit: 'Analyzers',
    secondaryQuotaDefault: 3,
    secondaryQuotaPresets: [1, 2, 4, 8, 15],
    productSuites: [
      { label: 'DocSearch Diagnostic LIS & Bi-directional Analyzer Suite', value: 'DocSearch Diagnostic LIS & Bi-directional Analyzer Suite' },
      { label: 'DocSearch Cloud PACS & AI Radiology Heatmap Suite', value: 'DocSearch Cloud PACS & AI Radiology Heatmap Suite' },
      { label: 'DocSearch Home Collection & Phlebotomy Fleet OS', value: 'DocSearch Home Collection & Phlebotomy Fleet OS' },
      { label: 'DocSearch NABL Quality Control & Report Auto-Dispatch', value: 'DocSearch NABL Quality Control & Report Auto-Dispatch' }
    ],
    planTiers: [
      {
        code: 'TIER_DIAG_STARTER',
        name: 'Diagnostic Clinic Pathology Starter Tier',
        basePriceInr: 36000,
        doctorSeats: 2,
        secondaryQuota: 1,
        opdQuota: 1500,
        cloudStorageGb: 50,
        badge: '🧪 Lab Starter',
        description: 'Single analyzer interface, barcoded sample accessioning, PDF reports & 1,500 tests/mo'
      },
      {
        code: 'TIER_DIAG_PRO',
        name: 'Diagnostic NABL High-Throughput LIS Tier',
        basePriceInr: 84000,
        doctorSeats: 6,
        secondaryQuota: 4,
        opdQuota: 8000,
        cloudStorageGb: 200,
        badge: '⭐ NABL High-Throughput',
        description: '4 Bi-directional analyzer channels, Cloud PACS DICOM viewer, SMS dispatch & 8,000 tests'
      },
      {
        code: 'TIER_DIAG_NETWORK',
        name: 'Regional Diagnostic Hub & Spoke Network Tier',
        basePriceInr: 180000,
        doctorSeats: 15,
        secondaryQuota: 10,
        opdQuota: 30000,
        cloudStorageGb: 750,
        badge: '💎 Diagnostic Hub Network',
        description: 'Hub-and-spoke laboratory network, 10 analyzers, phlebotomy fleet tracking & PACS'
      }
    ],
    defaultModules: ['enableDicomPacs', 'enableAbdmGateway', 'enableWhiteLabelApps']
  },

  CLINIC_OPD: {
    code: 'CLINIC_OPD',
    label: 'Clinic Group / Polyclinic / Specialist OPD',
    icon: '🩺',
    description: 'Outpatient multi-doctor clinic, smart TV queue, EHR & e-prescriptions',
    secondaryQuotaLabel: 'DOCTOR CONSULTATION ROOMS',
    secondaryQuotaUnit: 'Rooms',
    secondaryQuotaDefault: 3,
    secondaryQuotaPresets: [1, 2, 4, 8, 12],
    productSuites: [
      { label: 'DocSearch Clinic OPD & Smart Token TV Queue OS', value: 'DocSearch Clinic OPD & Smart Token TV Queue OS' },
      { label: 'DocSearch Clinical AI Voice Scribe & Rx Suite', value: 'DocSearch Clinical AI Voice Scribe & Rx Suite' },
      { label: 'DocSearch ABDM 2.0 Health Locker & Consent Gateway', value: 'DocSearch ABDM 2.0 Health Locker & Consent Gateway' }
    ],
    planTiers: [
      {
        code: 'TIER_CLINIC_SOLO',
        name: 'Solo Specialist OPD Tier',
        basePriceInr: 18000,
        doctorSeats: 1,
        secondaryQuota: 1,
        opdQuota: 1000,
        cloudStorageGb: 25,
        badge: '🩺 Solo OPD',
        description: 'Single doctor practice, digital Rx, WhatsApp appointment booking & 1,000 encounters'
      },
      {
        code: 'TIER_CLINIC_POLY',
        name: 'Polyclinic OPD Group Tier',
        basePriceInr: 45000,
        doctorSeats: 5,
        secondaryQuota: 3,
        opdQuota: 4000,
        cloudStorageGb: 50,
        badge: '👥 Polyclinic Group',
        description: 'Up to 5 doctors, reception desk, TV token queue display & 4,000 OPD encounters'
      },
      {
        code: 'TIER_CLINIC_DAYCARE',
        name: 'Super-Specialty Day-Care Clinic Suite',
        basePriceInr: 90000,
        doctorSeats: 12,
        secondaryQuota: 6,
        opdQuota: 12000,
        cloudStorageGb: 150,
        badge: '⭐ Day-Care Specialist',
        description: '12 Doctor consultation rooms, day recliners, clinical AI voice scribe & 12,000 encounters'
      }
    ],
    defaultModules: ['enableAiVoiceScribe', 'enableAbdmGateway']
  },

  SURGICAL_CENTER: {
    code: 'SURGICAL_CENTER',
    label: 'Ambulatory Day-Care Surgery Center',
    icon: '🏨',
    description: 'Day-surgery OT, laparoscopy suite, pre-op/post-op anesthesia & TPA cashless',
    secondaryQuotaLabel: 'OPERATION THEATRES (OT) & RECOVERY BAYS',
    secondaryQuotaUnit: 'OTs',
    secondaryQuotaDefault: 2,
    secondaryQuotaPresets: [1, 2, 3, 5],
    productSuites: [
      { label: 'DocSearch Ambulatory Surgery & Minor OT Registry', value: 'DocSearch Ambulatory Surgery & Minor OT Registry' },
      { label: 'DocSearch Cashless TPA & Instant PMJAY Adjudication', value: 'DocSearch Cashless TPA & Instant PMJAY Adjudication' },
      { label: 'DocSearch Pre-Op Anesthesia & Post-Care Telemetry', value: 'DocSearch Pre-Op Anesthesia & Post-Care Telemetry' }
    ],
    planTiers: [
      {
        code: 'TIER_SURG_PAVILION',
        name: 'Day Surgery Pavilion Tier',
        basePriceInr: 75000,
        doctorSeats: 4,
        secondaryQuota: 1,
        opdQuota: 2000,
        cloudStorageGb: 75,
        badge: '🏨 Day Surgery',
        description: '1 Main OT, 8 recovery bays, surgeon scheduling, anesthesia logs & cashless TPA'
      },
      {
        code: 'TIER_SURG_MULTI_OT',
        name: 'Multi-OT Ambulatory Surgical Suite',
        basePriceInr: 160000,
        doctorSeats: 12,
        secondaryQuota: 3,
        opdQuota: 6000,
        cloudStorageGb: 200,
        badge: '⭐ Multi-OT Pavilion',
        description: '3 Operation theatres, 20 recovery bays, emergency surgical telemetry & TPA pre-auth'
      }
    ],
    defaultModules: ['enableTpaClaims', 'enableAbdmGateway', 'enableEmergencyTelemetry']
  },

  INDIVIDUAL_PRACTICE: {
    code: 'INDIVIDUAL_PRACTICE',
    label: 'Individual Specialist Solo Practice',
    icon: '👨‍⚕️',
    description: 'Solo consultant private clinic, digital prescriptions, WhatsApp tele-consultation',
    secondaryQuotaLabel: 'CONSULTING CHAMBERS',
    secondaryQuotaUnit: 'Chamber',
    secondaryQuotaDefault: 1,
    secondaryQuotaPresets: [1, 2],
    productSuites: [
      { label: 'DocSearch Solo Practitioner Smart EMR & Digital Rx', value: 'DocSearch Solo Practitioner Smart EMR & Digital Rx' },
      { label: 'DocSearch Patient WhatsApp Booking & Tele-Consult', value: 'DocSearch Patient WhatsApp Booking & Tele-Consult' }
    ],
    planTiers: [
      {
        code: 'TIER_SOLO_STARTER',
        name: 'Solo Doctor Starter Tier',
        basePriceInr: 12000,
        doctorSeats: 1,
        secondaryQuota: 1,
        opdQuota: 750,
        cloudStorageGb: 15,
        badge: '👨‍⚕️ Solo Starter',
        description: '1 Doctor seat, mobile prescription generator, WhatsApp reminders & 750 consults/mo'
      },
      {
        code: 'TIER_SOLO_PRO',
        name: 'Specialist Practice Pro Tier',
        basePriceInr: 24000,
        doctorSeats: 1,
        secondaryQuota: 1,
        opdQuota: 2000,
        cloudStorageGb: 50,
        badge: '⭐ Specialist Pro',
        description: '1 Doctor + Assistant, AI voice scribe SOAP notes, ABDM 2.0 ABHA creation & 2,000 consults'
      }
    ],
    defaultModules: ['enableAiVoiceScribe', 'enableAbdmGateway']
  }
};

const CANONICAL_FREE_ONBOARDED_PARTNERS: PartnerProfileDto[] = [
  {
    id: 'free-pharm-001',
    tenantId: '11111111-1111-4111-8111-222222222211',
    tenantSlug: 'apollo-medstore-delhi',
    legalName: 'Apollo Retail MedStore Ltd',
    tradeName: 'Apollo MedStore & Chemist Network',
    partnerType: 'PHARMACY',
    lifecycleStatus: 'ACTIVE',
    verificationStatus: 'VERIFIED',
    onboardingStep: 'COMPLETED',
    onboardingProgressPercent: 100,
    primaryContact: {
      name: 'Rajesh Patel',
      email: 'pharmacy@apollomed.in',
      phone: '+91-98112-44567',
      roleTitle: 'Chief Pharmacist'
    },
    branchCount: 3,
    userCount: 6,
    metadata: {
      city: 'New Delhi',
      state: 'Delhi',
      licenseNumber: 'DL-PHARM-2026-8821'
    },
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z'
  },
  {
    id: 'free-pharm-002',
    tenantId: '11111111-1111-4111-8111-222222222212',
    tenantSlug: 'medplus-chemist-blr',
    legalName: 'MedPlus Health Services Pvt Ltd',
    tradeName: 'MedPlus 24x7 Retail Pharmacy',
    partnerType: 'PHARMACY',
    lifecycleStatus: 'ACTIVE',
    verificationStatus: 'VERIFIED',
    onboardingStep: 'COMPLETED',
    onboardingProgressPercent: 100,
    primaryContact: {
      name: 'Anita Rao',
      email: 'dispensary@medpluscare.in',
      phone: '+91-80-49215000',
      roleTitle: 'Store Manager'
    },
    branchCount: 5,
    userCount: 12,
    metadata: {
      city: 'Bengaluru',
      state: 'Karnataka',
      licenseNumber: 'KA-PHARM-2026-4412'
    },
    createdAt: '2026-03-05T11:00:00.000Z',
    updatedAt: '2026-03-05T11:00:00.000Z'
  },
  {
    id: 'free-lab-001',
    tenantId: '11111111-1111-4111-8111-222222222213',
    tenantSlug: 'lal-pathlabs-gurgaon',
    legalName: 'Dr. Lal PathLabs Clinical Services Ltd',
    tradeName: 'Dr. Lal PathLabs Pathology Diagnostics',
    partnerType: 'DIAGNOSTIC_LAB',
    lifecycleStatus: 'ACTIVE',
    verificationStatus: 'VERIFIED',
    onboardingStep: 'COMPLETED',
    onboardingProgressPercent: 100,
    primaryContact: {
      name: 'Dr. Alok Verma',
      email: 'lab.director@lalpath.in',
      phone: '+91-124-4829100',
      roleTitle: 'Chief Pathologist'
    },
    branchCount: 2,
    userCount: 8,
    metadata: {
      city: 'Gurgaon',
      state: 'Haryana',
      licenseNumber: 'NABL-DL-2026-1092'
    },
    createdAt: '2026-03-10T12:00:00.000Z',
    updatedAt: '2026-03-10T12:00:00.000Z'
  },
  {
    id: 'free-clinic-001',
    tenantId: '11111111-1111-4111-8111-222222222214',
    tenantSlug: 'max-family-clinic-noida',
    legalName: 'Max Healthcare Daycare & Polyclinics Ltd',
    tradeName: 'Max Care Family Clinic & OPD Center',
    partnerType: 'CLINIC_GROUP',
    lifecycleStatus: 'ACTIVE',
    verificationStatus: 'VERIFIED',
    onboardingStep: 'COMPLETED',
    onboardingProgressPercent: 100,
    primaryContact: {
      name: 'Dr. Sunita Mehra',
      email: 'opd@maxcareclinics.in',
      phone: '+91-120-2558900',
      roleTitle: 'Clinic Head'
    },
    branchCount: 1,
    userCount: 5,
    metadata: {
      city: 'Noida',
      state: 'Uttar Pradesh',
      licenseNumber: 'UP-CEA-2026-5519'
    },
    createdAt: '2026-03-15T09:30:00.000Z',
    updatedAt: '2026-03-15T09:30:00.000Z'
  },
  {
    id: 'free-surg-001',
    tenantId: '11111111-1111-4111-8111-222222222215',
    tenantSlug: 'care-surgical-mumbai',
    legalName: 'Care Ambulatory Surgical Centers Ltd',
    tradeName: 'Care Surgical Ambulatory Pavilion',
    partnerType: 'SURGICAL_CENTER',
    lifecycleStatus: 'ACTIVE',
    verificationStatus: 'VERIFIED',
    onboardingStep: 'COMPLETED',
    onboardingProgressPercent: 100,
    primaryContact: {
      name: 'Dr. K. Raman',
      email: 'surgery@caresurgical.in',
      phone: '+91-22-67123400',
      roleTitle: 'Medical Superintendent'
    },
    branchCount: 1,
    userCount: 7,
    metadata: {
      city: 'Mumbai',
      state: 'Maharashtra',
      licenseNumber: 'MH-CEA-2026-3301'
    },
    createdAt: '2026-03-20T14:15:00.000Z',
    updatedAt: '2026-03-20T14:15:00.000Z'
  },
  {
    id: 'free-solo-001',
    tenantId: '11111111-1111-4111-8111-222222222216',
    tenantSlug: 'dr-sharma-pediatric-clinic',
    legalName: 'Dr. Ananya Sharma MD Pediatrics Practice',
    tradeName: 'Dr. Sharma Child & Family Practice',
    partnerType: 'INDIVIDUAL_PRACTICE',
    lifecycleStatus: 'ACTIVE',
    verificationStatus: 'VERIFIED',
    onboardingStep: 'COMPLETED',
    onboardingProgressPercent: 100,
    primaryContact: {
      name: 'Dr. Ananya Sharma',
      email: 'ananya@drsharmaclinic.in',
      phone: '+91-99350-12890',
      roleTitle: 'Consultant Pediatrician'
    },
    branchCount: 1,
    userCount: 2,
    metadata: {
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      licenseNumber: 'NMC-UP-2026-9021'
    },
    createdAt: '2026-03-22T16:00:00.000Z',
    updatedAt: '2026-03-22T16:00:00.000Z'
  }
];

const getPartnerOrgIcon = (partnerType?: string): string => {
  if (partnerType === 'PHARMACY') return '💊';
  if (partnerType === 'DIAGNOSTIC_LAB') return '🔬';
  if (partnerType === 'CLINIC_GROUP') return '🩺';
  if (partnerType === 'HOSPITAL_NETWORK') return '🏥';
  if (partnerType === 'SURGICAL_CENTER') return '🔪';
  if (partnerType === 'INDIVIDUAL_PRACTICE') return '👨‍⚕️';
  return '🏢';
};

const getPartnerOrgLabel = (partnerType?: string): string => {
  if (partnerType === 'PHARMACY') return 'Retail Pharmacy / Chemist';
  if (partnerType === 'DIAGNOSTIC_LAB') return 'Diagnostic Lab';
  if (partnerType === 'CLINIC_GROUP') return 'Clinic OPD';
  if (partnerType === 'HOSPITAL_NETWORK') return 'Hospital Network';
  if (partnerType === 'SURGICAL_CENTER') return 'Surgical Center';
  if (partnerType === 'INDIVIDUAL_PRACTICE') return 'Solo Practice';
  return 'Healthcare Entity';
};

const getOrgConfig = (orgType?: string): OrgTypeConfig => {
  if (!orgType) return ORGANIZATION_CONFIG['HOSPITAL_SINGLE']!;
  return ORGANIZATION_CONFIG[orgType] || ORGANIZATION_CONFIG['HOSPITAL_SINGLE']!;
};

interface SubscriptionCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedSubscription: SubscriptionDto) => void;
  initialSubscription?: SubscriptionDto | null;
  existingSubscriptions?: SubscriptionDto[];
}

export const SubscriptionCustomizerModal: React.FC<SubscriptionCustomizerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialSubscription,
  existingSubscriptions = []
}) => {
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [dbPartners, setDbPartners] = useState<PartnerProfileDto[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('CUSTOM_NEW');
  const [pricingMode, setPricingMode] = useState<'FORMULA' | 'CUSTOM'>('FORMULA');

  // Search & Free Onboarded Partner Selector states
  const [isPartnerSearchModalOpen, setIsPartnerSearchModalOpen] = useState(false);
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
  const [partnerFilterCategory, setPartnerFilterCategory] = useState<string>('ALL');
  const [showInlineSuggestions, setShowInlineSuggestions] = useState(false);

  // Dynamic modules state: allows enabling, disabling, adding custom, and removing
  const [modulesList, setModulesList] = useState<CustomizerModuleItem[]>([...INITIAL_DEFAULT_MODULES]);
  const [isAddingCustomModule, setIsAddingCustomModule] = useState(false);
  const [newCustomTitle, setNewCustomTitle] = useState('');
  const [newCustomFee, setNewCustomFee] = useState(15000);
  const [newCustomDesc, setNewCustomDesc] = useState('');
  const [newCustomIcon, setNewCustomIcon] = useState('✨');

  const [formData, setFormData] = useState({
    // 1. Partner & Organization
    partnerId: '11111111-1111-4111-8111-111111111101',
    partnerTradeName: '',
    partnerTenantSlug: '',
    orgType: 'HOSPITAL_SINGLE',
    productName: 'DocSearch Full Hospital Operating System',
    planName: 'Gold Family Health & Hospital Suite',
    planVersion: '1.0.0',
    status: 'ACTIVE' as SubscriptionStatus,

    // 2. Tenure & Renewal
    billingCycle: 'YEARLY' as BillingCycle,
    renewalMonths: 12,
    gracePeriodDays: 15,
    autoRenewalPolicy: 'AUTO_5PCT_CAP',
    currency: 'INR',

    // 3. Commercials, Tax & Payouts
    contractValueInr: 150000,
    discountInr: 10000,
    gstTreatment: 'GST_18',
    paymentMethod: 'UPI_MANDATE',
    platformTakeRatePct: 15,
    tdsSection: '194J_10',

    // 4. Clinical Capacity & Quotas (Adapts dynamically to orgType)
    doctorSeats: 15,
    inpatientBeds: 50, // Serves as secondaryQuota: Beds for hospitals, Counters for pharmacies, Analyzers for labs, Rooms for clinics
    opdConsultQuota: 3000,
    cloudStorageGb: 100,
    broadcastSmsQuota: 25000,

    // 5. SLA & Hosting
    slaTier: 'SLA_99_9',
    supportTier: 'DEDICATED_MGR',
    hostingDeployment: 'HIPAA_VPC'
  });

  const [activeSection, setActiveSection] = useState<'ALL' | 'PARTNER' | 'TENURE' | 'COMMERCIALS' | 'QUOTAS' | 'ADDONS' | 'SLA'>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentOrgConfig = getOrgConfig(formData.orgType);
  const activePlanTier =
    currentOrgConfig.planTiers.find((t) => t.name === formData.planName) ||
    currentOrgConfig.planTiers[0] || {
      code: 'CUSTOM',
      name: formData.planName,
      basePriceInr: formData.contractValueInr,
      doctorSeats: formData.doctorSeats,
      secondaryQuota: formData.inpatientBeds,
      opdQuota: formData.opdConsultQuota,
      cloudStorageGb: formData.cloudStorageGb,
      badge: 'Custom',
      description: 'Custom plan configuration'
    };

  // Helper to map PartnerProfileDto into formData
  const applyPartnerDetails = (p: PartnerProfileDto) => {
    const slug = p.tenantSlug || p.tradeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let mappedOrg = 'HOSPITAL_SINGLE';
    if (p.partnerType === 'HOSPITAL_NETWORK') mappedOrg = 'HOSPITAL_CHAIN';
    else if (p.partnerType === 'DIAGNOSTIC_LAB') mappedOrg = 'DIAGNOSTIC_CHAIN';
    else if (p.partnerType === 'CLINIC_GROUP') mappedOrg = 'CLINIC_OPD';
    else if (p.partnerType === 'PHARMACY') mappedOrg = 'PHARMACY';
    else if (p.partnerType === 'SURGICAL_CENTER') mappedOrg = 'SURGICAL_CENTER';
    else if (p.partnerType === 'INDIVIDUAL_PRACTICE') mappedOrg = 'INDIVIDUAL_PRACTICE';

    const cfg = getOrgConfig(mappedOrg);
    const defaultTier = cfg.planTiers[0];
    const defaultProd = cfg.productSuites[0]?.value || 'DocSearch Enterprise Healthcare Platform';

    setFormData((prev) => ({
      ...prev,
      partnerId: p.id,
      partnerTradeName: p.tradeName || p.legalName,
      partnerTenantSlug: slug,
      orgType: mappedOrg,
      productName: defaultProd,
      planName: defaultTier ? defaultTier.name : prev.planName,
      contractValueInr: defaultTier ? defaultTier.basePriceInr : prev.contractValueInr,
      doctorSeats: defaultTier ? defaultTier.doctorSeats : prev.doctorSeats,
      inpatientBeds: defaultTier ? defaultTier.secondaryQuota : prev.inpatientBeds,
      opdConsultQuota: defaultTier ? defaultTier.opdQuota : prev.opdConsultQuota,
      cloudStorageGb: defaultTier ? defaultTier.cloudStorageGb : prev.cloudStorageGb
    }));

    // Activate default modules for this organization type
    setModulesList((prev) =>
      prev.map((mod) => ({
        ...mod,
        enabled: cfg.defaultModules.includes(mod.key)
      }))
    );
  };

  // Fetch real registered partners from database on open
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    partnerService
      .getPartners({ pageSize: 50 })
      .then((res) => {
        if (!isMounted) return;
        const fetched = res.items && res.items.length > 0 ? res.items : [...mockPartnerProfiles];
        const combined = [...fetched];
        CANONICAL_FREE_ONBOARDED_PARTNERS.forEach((canon) => {
          if (!combined.some((item) => item.id === canon.id || item.tenantSlug === canon.tenantSlug)) {
            combined.push(canon);
          }
        });
        setDbPartners(combined);

        if (initialSubscription) {
          setSelectedPartnerId(initialSubscription.partnerId || 'CUSTOM_NEW');
        } else if (combined.length > 0) {
          const activeSubPartnerIds = new Set(
            existingSubscriptions.filter((s) => s.status === 'ACTIVE').map((s) => s.partnerId)
          );
          const freeCandidate = combined.find((p) => !activeSubPartnerIds.has(p.id)) || combined[0];
          if (freeCandidate) {
            setSelectedPartnerId(freeCandidate.id);
            applyPartnerDetails(freeCandidate);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load database partners, falling back to canonical partners:', err);
        if (isMounted) {
          const fallback = [...mockPartnerProfiles];
          CANONICAL_FREE_ONBOARDED_PARTNERS.forEach((canon) => {
            if (!fallback.some((item) => item.id === canon.id || item.tenantSlug === canon.tenantSlug)) {
              fallback.push(canon);
            }
          });
          setDbPartners(fallback);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialSubscription]);

  // Sync initialSubscription if provided (editing mode)
  useEffect(() => {
    if (initialSubscription) {
      const meta = (initialSubscription.metadata || {}) as any;
      setFormData({
        partnerId: initialSubscription.partnerId || '',
        partnerTradeName: initialSubscription.partnerTradeName || '',
        partnerTenantSlug: initialSubscription.partnerTenantSlug || '',
        orgType: meta.orgType || 'HOSPITAL_SINGLE',
        productName: initialSubscription.productName || 'DocSearch Enterprise Healthcare Platform',
        planName: initialSubscription.planName || 'Gold Family Health & Hospital Suite',
        planVersion: initialSubscription.planVersion || '1.0.0',
        status: initialSubscription.status || 'ACTIVE',
        billingCycle: initialSubscription.billingCycle || 'YEARLY',
        renewalMonths: Number(meta.renewalMonths) || 12,
        gracePeriodDays: Number(meta.gracePeriodDays) || 15,
        autoRenewalPolicy: meta.autoRenewalPolicy || 'AUTO_5PCT_CAP',
        currency: meta.currency || 'INR',
        contractValueInr: Number(meta.contractValueInr) || 150000,
        discountInr: Number(meta.discountInr) || 10000,
        gstTreatment: meta.gstTreatment || 'GST_18',
        paymentMethod: meta.paymentMethod || 'UPI_MANDATE',
        platformTakeRatePct: Number(meta.platformTakeRatePct) || 15,
        tdsSection: meta.tdsSection || '194J_10',
        doctorSeats: Number(meta.doctorSeats) || 15,
        inpatientBeds: Number(meta.inpatientBeds ?? meta.secondaryQuota) || 50,
        opdConsultQuota: Number(meta.opdConsultQuota) || 3000,
        cloudStorageGb: Number(meta.cloudStorageGb) || 100,
        broadcastSmsQuota: Number(meta.broadcastSmsQuota) || 25000,
        slaTier: meta.slaTier || 'SLA_99_9',
        supportTier: meta.supportTier || 'DEDICATED_MGR',
        hostingDeployment: meta.hostingDeployment || 'HIPAA_VPC'
      });
      if (Array.isArray(meta.customModules) && meta.customModules.length > 0) {
        setModulesList(meta.customModules);
      }
      setSelectedPartnerId(initialSubscription.partnerId || 'CUSTOM_NEW');
    }
  }, [initialSubscription]);

  if (!isOpen) return null;

  // Real-time Pricing Calculations
  const baseTierPrice = activePlanTier.basePriceInr;
  const extraDocs = Math.max(0, formData.doctorSeats - activePlanTier.doctorSeats);
  const extraDocFee = extraDocs * 1500;
  const extraSecondary = Math.max(0, formData.inpatientBeds - activePlanTier.secondaryQuota);
  const extraSecondaryFee = extraSecondary * 200;

  // Active modules fee calculation
  const activeModulesTotalFee = modulesList
    .filter((m) => m.enabled)
    .reduce((sum, m) => sum + (Number(m.annualFeeInr) || 0), 0);

  const formulaCalculatedGross = baseTierPrice + extraDocFee + extraSecondaryFee + activeModulesTotalFee;

  const netBeforeTax = Math.max(0, formData.contractValueInr - formData.discountInr);
  const gstAmount = formData.gstTreatment === 'GST_18' ? Math.round(netBeforeTax * 0.18) : 0;
  const grossInvoiceTotal = netBeforeTax + gstAmount;
  const monthlyRate = Math.round(grossInvoiceTotal / Math.max(1, formData.renewalMonths));

  // Dynamic Handlers
  const handleOrgTypeChange = (newOrg: string) => {
    const cfg = getOrgConfig(newOrg);
    const defaultTier = cfg.planTiers[0];
    const defaultProd = cfg.productSuites[0]?.value || '';

    setFormData((prev) => {
      const next = {
        ...prev,
        orgType: newOrg,
        productName: defaultProd,
        planName: defaultTier ? defaultTier.name : prev.planName,
        contractValueInr: defaultTier ? defaultTier.basePriceInr : prev.contractValueInr,
        doctorSeats: defaultTier ? defaultTier.doctorSeats : prev.doctorSeats,
        inpatientBeds: defaultTier ? defaultTier.secondaryQuota : prev.inpatientBeds,
        opdConsultQuota: defaultTier ? defaultTier.opdQuota : prev.opdConsultQuota,
        cloudStorageGb: defaultTier ? defaultTier.cloudStorageGb : prev.cloudStorageGb
      };
      return next;
    });

    // Update modules based on new org defaults
    setModulesList((prev) =>
      prev.map((m) => ({
        ...m,
        enabled: cfg.defaultModules.includes(m.key)
      }))
    );
  };

  const handlePlanChange = (planName: string) => {
    const tier = currentOrgConfig.planTiers.find((t) => t.name === planName);
    if (tier) {
      if (pricingMode === 'FORMULA') {
        const newGross = tier.basePriceInr + activeModulesTotalFee;
        setFormData((prev) => ({
          ...prev,
          planName,
          contractValueInr: newGross,
          doctorSeats: tier.doctorSeats,
          inpatientBeds: tier.secondaryQuota,
          opdConsultQuota: tier.opdQuota,
          cloudStorageGb: tier.cloudStorageGb
        }));
      } else {
        setFormData((prev) => ({ ...prev, planName }));
      }
    } else {
      setFormData((prev) => ({ ...prev, planName }));
    }
  };

  const updateQuotasAndPricing = (partial: Partial<typeof formData>) => {
    setFormData((prev) => {
      const next = { ...prev, ...partial };
      if (pricingMode === 'FORMULA') {
        const tier = currentOrgConfig.planTiers.find((t) => t.name === next.planName) || activePlanTier;
        const eDocs = Math.max(0, next.doctorSeats - tier.doctorSeats);
        const eSec = Math.max(0, next.inpatientBeds - tier.secondaryQuota);
        next.contractValueInr = tier.basePriceInr + (eDocs * 1500) + (eSec * 200) + activeModulesTotalFee;
      }
      return next;
    });
  };

  // Module management functions (Toggle, Add custom, Remove)
  const toggleModule = (id: string) => {
    setModulesList((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m));
      if (pricingMode === 'FORMULA') {
        const newFee = updated.filter((m) => m.enabled).reduce((sum, m) => sum + (Number(m.annualFeeInr) || 0), 0);
        setFormData((f) => ({
          ...f,
          contractValueInr: activePlanTier.basePriceInr + (extraDocs * 1500) + (extraSecondaryFee) + newFee
        }));
      }
      return updated;
    });
  };

  const removeModule = (id: string) => {
    setModulesList((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      if (pricingMode === 'FORMULA') {
        const newFee = updated.filter((m) => m.enabled).reduce((sum, m) => sum + (Number(m.annualFeeInr) || 0), 0);
        setFormData((f) => ({
          ...f,
          contractValueInr: activePlanTier.basePriceInr + (extraDocs * 1500) + (extraSecondaryFee) + newFee
        }));
      }
      return updated;
    });
  };

  const handleAddCustomModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomTitle.trim()) return;

    const newMod: CustomizerModuleItem = {
      id: `custom-mod-${Date.now()}`,
      key: `custom_${newCustomTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      title: newCustomTitle.trim(),
      desc: newCustomDesc.trim() || 'Custom enterprise health service addition',
      icon: newCustomIcon || '✨',
      annualFeeInr: Number(newCustomFee) || 0,
      enabled: true,
      isCustom: true
    };

    setModulesList((prev) => {
      const updated = [...prev, newMod];
      if (pricingMode === 'FORMULA') {
        const newFee = updated.filter((m) => m.enabled).reduce((sum, m) => sum + (Number(m.annualFeeInr) || 0), 0);
        setFormData((f) => ({
          ...f,
          contractValueInr: activePlanTier.basePriceInr + (extraDocs * 1500) + (extraSecondaryFee) + newFee
        }));
      }
      return updated;
    });

    setNewCustomTitle('');
    setNewCustomDesc('');
    setNewCustomFee(15000);
    setIsAddingCustomModule(false);
  };

  const handlePartnerSelect = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    if (partnerId === 'CUSTOM_NEW') {
      setFormData((prev) => ({
        ...prev,
        partnerId: '11111111-1111-4111-8111-' + Math.floor(100000000000 + Math.random() * 900000000000),
        partnerTradeName: '',
        partnerTenantSlug: '',
        orgType: 'HOSPITAL_SINGLE'
      }));
      return;
    }
    const found = dbPartners.find((p) => p.id === partnerId);
    if (found) {
      applyPartnerDetails(found);
    }
  };

  const handleTradeNameChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      partnerTradeName: val,
      partnerTenantSlug: val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }));

    const match = dbPartners.find(
      (p) => (p.tradeName || p.legalName).toLowerCase() === val.trim().toLowerCase()
    );
    if (match) {
      setSelectedPartnerId(match.id);
    } else if (selectedPartnerId !== 'CUSTOM_NEW') {
      setSelectedPartnerId('CUSTOM_NEW');
    }
  };

  const currentPartner = dbPartners.find((p) => p.id === selectedPartnerId);
  const isCurrentPartnerSubscribed = existingSubscriptions.some(
    (s) => s.partnerId === selectedPartnerId && s.status === 'ACTIVE'
  );
  const isFreeCandidate = !!currentPartner && !isCurrentPartnerSubscribed;

  const subscribedPartnerIds = new Set(
    existingSubscriptions.filter((s) => s.status === 'ACTIVE').map((s) => s.partnerId)
  );

  const freePartners = dbPartners.filter((p) => !subscribedPartnerIds.has(p.id));
  const subscribedPartners = dbPartners.filter((p) => subscribedPartnerIds.has(p.id));

  const filteredSearchPartners = dbPartners.filter((p) => {
    if (partnerFilterCategory !== 'ALL') {
      if (partnerFilterCategory === 'PHARMACY' && p.partnerType !== 'PHARMACY') return false;
      if (partnerFilterCategory === 'HOSPITAL' && p.partnerType !== 'HOSPITAL_NETWORK') return false;
      if (partnerFilterCategory === 'DIAGNOSTIC' && p.partnerType !== 'DIAGNOSTIC_LAB') return false;
      if (partnerFilterCategory === 'CLINIC' && p.partnerType !== 'CLINIC_GROUP') return false;
      if (partnerFilterCategory === 'SURGICAL' && p.partnerType !== 'SURGICAL_CENTER') return false;
      if (partnerFilterCategory === 'SOLO' && p.partnerType !== 'INDIVIDUAL_PRACTICE') return false;
    }

    if (!partnerSearchQuery.trim()) return true;
    const q = partnerSearchQuery.toLowerCase();
    const tradeName = (p.tradeName || '').toLowerCase();
    const legalName = (p.legalName || '').toLowerCase();
    const contactName = (p.primaryContact?.name || '').toLowerCase();
    const email = (p.primaryContact?.email || '').toLowerCase();
    const phone = (p.primaryContact?.phone || '').toLowerCase();
    const city = ((p.metadata as any)?.city || (p as any).city || '').toLowerCase();
    const license = ((p.metadata as any)?.licenseNumber || (p as any).licenseNumber || '').toLowerCase();
    const slug = (p.tenantSlug || '').toLowerCase();

    return (
      tradeName.includes(q) ||
      legalName.includes(q) ||
      contactName.includes(q) ||
      email.includes(q) ||
      phone.includes(q) ||
      city.includes(q) ||
      license.includes(q) ||
      slug.includes(q)
    );
  });


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const now = new Date();
      const renewal = new Date();
      renewal.setMonth(now.getMonth() + formData.renewalMonths);

      const finalPartnerId =
        selectedPartnerId === 'CUSTOM_NEW'
          ? '11111111-1111-4111-8111-' + Math.floor(100000000000 + Math.random() * 900000000000)
          : selectedPartnerId;

      const saved: SubscriptionDto = {
        id: initialSubscription?.id || '11111111-1111-4111-8111-' + Math.floor(100000000000 + Math.random() * 900000000000),
        partnerId: finalPartnerId,
        partnerTradeName: formData.partnerTradeName || 'Healthcare Organization',
        partnerTenantSlug: formData.partnerTenantSlug || 'healthcare-partner',
        productId: initialSubscription?.productId || '11111111-1111-4111-8111-111111111111',
        productName: formData.productName,
        planId: initialSubscription?.planId || '11111111-1111-4111-8111-111111111122',
        planName: formData.planName,
        planVersion: formData.planVersion,
        status: formData.status,
        billingCycle: formData.billingCycle,
        startDate: initialSubscription?.startDate || now.toISOString(),
        renewalDate: renewal.toISOString(),
        metadata: {
          contractValueInr: formData.contractValueInr,
          discountInr: formData.discountInr,
          gstTreatment: formData.gstTreatment,
          netBeforeTax,
          gstAmount,
          grossInvoiceTotal,
          monthlyRate,
          paymentMethod: formData.paymentMethod,
          platformTakeRatePct: formData.platformTakeRatePct,
          hospitalPayoutRatePct: 100 - formData.platformTakeRatePct,
          tdsSection: formData.tdsSection,
          renewalMonths: formData.renewalMonths,
          gracePeriodDays: formData.gracePeriodDays,
          autoRenewalPolicy: formData.autoRenewalPolicy,
          currency: formData.currency,
          orgType: formData.orgType,
          secondaryQuotaLabel: currentOrgConfig.secondaryQuotaLabel,
          secondaryQuotaUnit: currentOrgConfig.secondaryQuotaUnit,
          secondaryQuotaValue: formData.inpatientBeds,
          doctorSeats: formData.doctorSeats,
          inpatientBeds: formData.inpatientBeds,
          opdConsultQuota: formData.opdConsultQuota,
          cloudStorageGb: formData.cloudStorageGb,
          broadcastSmsQuota: formData.broadcastSmsQuota,
          slaTier: formData.slaTier,
          supportTier: formData.supportTier,
          hostingDeployment: formData.hostingDeployment,
          customModules: modulesList,
          pricingMode,
          pricingDecisionAuthority: 'DOCSEARCH_COMPANY_ADMIN',
          upgradedFromFree: isFreeCandidate
        },
        createdAt: initialSubscription?.createdAt || now.toISOString(),
        updatedAt: now.toISOString()
      };

      // Auto-generate matching 18% GST invoice into ledger
      const invoiceId = 'inv-' + Math.floor(10000000 + Math.random() * 90000000);
      const invoiceNumber = `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const generatedInvoice = {
        id: invoiceId,
        subscriptionId: saved.id,
        billingAccountId: 'ba-' + Math.floor(10000000 + Math.random() * 90000000),
        partnerId: saved.partnerId,
        partnerTradeName: saved.partnerTradeName,
        invoiceNumber,
        status: 'UNPAID',
        currency: formData.currency,
        amountDue: grossInvoiceTotal,
        amountPaid: 0,
        subtotal: netBeforeTax,
        taxAmount: gstAmount,
        discountAmount: formData.discountInr,
        issueDate: now.toISOString(),
        dueDate: new Date(now.getTime() + formData.gracePeriodDays * 86400000).toISOString(),
        items: [
          {
            description: `${saved.productName} — ${saved.planName} (${formData.renewalMonths} Months)`,
            amount: netBeforeTax,
            taxRate: formData.gstTreatment === 'GST_18' ? 18 : 0,
            taxAmount: gstAmount
          }
        ],
        metadata: {
          autoGeneratedFromSubscriptionUpgrade: true,
          orgType: formData.orgType,
          doctorSeats: formData.doctorSeats,
          secondaryQuota: formData.inpatientBeds,
          activeModulesCount: modulesList.filter((m) => m.enabled).length
        },
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      void generatedInvoice;

      setIsSubmitting(false);
      onSuccess(saved);
      onClose();
    }, 450);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: isFullScreen ? '#070D1D' : 'rgba(0, 0, 0, 0.88)',
        backdropFilter: isFullScreen ? 'none' : 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: isFullScreen ? '0' : '16px'
      }}
    >
      <div
        style={{
          backgroundColor: '#070D1D',
          border: isFullScreen ? 'none' : '2px solid #06B6D4',
          borderRadius: isFullScreen ? '0' : '20px',
          width: '100%',
          maxWidth: isFullScreen ? '100vw' : '1240px',
          height: isFullScreen ? '100vh' : '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.95)',
          overflow: 'hidden'
        }}
      >
        {/* Top Studio Command Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            backgroundColor: '#0A1124',
            borderBottom: '1.5px solid #1E293B',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.6rem' }}>{currentOrgConfig.icon}</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
                  Healthcare Contract & Subscription Studio
                </h2>
                <Badge variant="primary">{currentOrgConfig.label}</Badge>
                {isFreeCandidate && <Badge variant="success">🎯 Upgrade Ready</Badge>}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                Configuring dynamic B2B contract terms, capacity quotas & GST billing for{' '}
                <strong style={{ color: '#38BDF8' }}>{formData.partnerTradeName || 'Healthcare Partner'}</strong>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Pricing Mode Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#070C16',
                border: '1px solid #1E293B',
                borderRadius: '8px',
                padding: '2px'
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setPricingMode('FORMULA');
                  setFormData((prev) => ({ ...prev, contractValueInr: formulaCalculatedGross }));
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: pricingMode === 'FORMULA' ? '#06B6D4' : 'transparent',
                  color: pricingMode === 'FORMULA' ? '#070D1D' : '#94A3B8',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                🤖 Auto Formula
              </button>
              <button
                type="button"
                onClick={() => setPricingMode('CUSTOM')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: pricingMode === 'CUSTOM' ? '#F59E0B' : 'transparent',
                  color: pricingMode === 'CUSTOM' ? '#070D1D' : '#94A3B8',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                ✏️ Custom Negotiated
              </button>
            </div>

            {/* Toggle Fullscreen / Dialog */}
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              style={{
                backgroundColor: '#0F172A',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#CBD5E1',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{isFullScreen ? '🗗 Windowed View' : '🗖 Full Page Studio'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#1E293B',
                border: 'none',
                color: '#94A3B8',
                fontSize: '1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                padding: '6px 12px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Section Filter Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
            padding: '10px 24px',
            backgroundColor: '#070D1D',
            borderBottom: '1px solid #1E293B',
            flexShrink: 0
          }}
        >
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginRight: '4px' }}>
            SECTIONS:
          </span>
          {[
            { id: 'ALL', label: '⚡ View All' },
            { id: 'PARTNER', label: `🏢 ${currentOrgConfig.label} & Plan` },
            { id: 'TENURE', label: '⏳ Tenure & Renewal' },
            { id: 'COMMERCIALS', label: '💰 Commercials & Tax' },
            { id: 'QUOTAS', label: `🩺 ${currentOrgConfig.secondaryQuotaUnit} & Capacity` },
            { id: 'ADDONS', label: `🚀 Add-Ons (${modulesList.filter((m) => m.enabled).length} Active)` },
            { id: 'SLA', label: '📜 SLA & Security' }
          ].map((sec) => {
            const isSecActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id as any)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: isSecActive ? '1px solid #06B6D4' : '1px solid #1E293B',
                  backgroundColor: isSecActive ? 'rgba(6, 182, 212, 0.2)' : '#0F172A',
                  color: isSecActive ? '#38BDF8' : '#94A3B8',
                  fontSize: '0.75rem',
                  fontWeight: isSecActive ? 800 : 600,
                  cursor: 'pointer'
                }}
              >
                {sec.label}
              </button>
            );
          })}
        </div>

        {/* Main Body: Dual-Pane Studio Layout */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Pane (Scrollable Customizer Form) */}
          <form
            onSubmit={handleSubmit}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {/* SECTION 1: Healthcare Organization Identity & Tailored Products */}
            {(activeSection === 'ALL' || activeSection === 'PARTNER') && (
              <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '14px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🏢</span> Partner Organization & Specialized Product Suites
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>Step 1 of 6</span>
                </div>

                {/* Hero Field: ORGANIZATION / CLINIC / PHARMACY TRADE NAME with Free Onboarded Dropdown & Search Button */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🏢</span> ORGANIZATION / CLINIC / PHARMACY TRADE NAME *
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setIsPartnerSearchModalOpen(true)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 12px',
                          backgroundColor: '#0284C7',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 2px 10px rgba(2, 132, 199, 0.45)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>🔍</span> Search Free Onboarded Database
                      </button>
                      {selectedPartnerId !== 'CUSTOM_NEW' && (
                        <button
                          type="button"
                          onClick={() => handlePartnerSelect('CUSTOM_NEW')}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#1E293B',
                            color: '#94A3B8',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          ✕ Manual Custom Entry
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Free Onboarded Quick Dropdown Selector */}
                  <div style={{ marginBottom: '10px' }}>
                    <select
                      value={selectedPartnerId}
                      onChange={(e) => handlePartnerSelect(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#070D1D',
                        border: selectedPartnerId !== 'CUSTOM_NEW' ? '1.5px solid #10B981' : '1.5px solid #0284C7',
                        borderRadius: '8px',
                        color: '#F8FAFC',
                        padding: '9px 12px',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="CUSTOM_NEW">✍️ Enter Custom Manual Trade Name (New Walk-in Onboarding)</option>
                      <optgroup label="🆓 FREE ONBOARDED HEALTHCARE ENTITIES (READY FOR UPGRADE)">
                        {freePartners.map((p) => (
                          <option key={p.id} value={p.id}>
                            {getPartnerOrgIcon(p.partnerType)} {p.tradeName || p.legalName} — {getPartnerOrgLabel(p.partnerType)} ({(p.metadata as any)?.city || (p as any).city || 'India'})
                          </option>
                        ))}
                      </optgroup>
                      {subscribedPartners.length > 0 && (
                        <optgroup label="⭐ ALREADY ACTIVE ENTERPRISE PARTNERS">
                          {subscribedPartners.map((p) => (
                            <option key={p.id} value={p.id}>
                              ⭐ {p.tradeName || p.legalName} — {getPartnerOrgLabel(p.partnerType)}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {/* Manual Trade Name Input & Tenant CNAME Slug Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                    <div style={{ position: 'relative' }}>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                        EDITABLE TRADE NAME (TYPE TO AUTOCOMPLETE OR RENAME)
                      </label>
                      <Input
                        required
                        value={formData.partnerTradeName}
                        placeholder="e.g. Apollo MedStore, Fortis Hospital, Care Clinic..."
                        onChange={(e) => handleTradeNameChange(e.target.value)}
                        onFocus={() => setShowInlineSuggestions(true)}
                      />

                      {/* Inline Autocomplete Suggestions */}
                      {showInlineSuggestions && formData.partnerTradeName.trim().length > 1 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            backgroundColor: '#0A1124',
                            border: '1px solid #0284C7',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.7)',
                            zIndex: 200,
                            marginTop: '4px',
                            maxHeight: '200px',
                            overflowY: 'auto'
                          }}
                        >
                          {dbPartners
                            .filter((p) =>
                              (p.tradeName || p.legalName)
                                .toLowerCase()
                                .includes(formData.partnerTradeName.toLowerCase())
                            )
                            .slice(0, 6)
                            .map((p) => (
                              <div
                                key={p.id}
                                onClick={() => {
                                  handlePartnerSelect(p.id);
                                  setShowInlineSuggestions(false);
                                }}
                                style={{
                                  padding: '8px 12px',
                                  borderBottom: '1px solid #1E293B',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  backgroundColor: p.id === selectedPartnerId ? '#1E293B' : 'transparent'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    p.id === selectedPartnerId ? '#1E293B' : 'transparent')
                                }
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '1.1rem' }}>{getPartnerOrgIcon(p.partnerType)}</span>
                                  <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F8FAFC' }}>
                                      {p.tradeName || p.legalName}
                                    </div>
                                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                                      {getPartnerOrgLabel(p.partnerType)} • {(p.metadata as any)?.city || (p as any).city || 'India'}
                                    </div>
                                  </div>
                                </div>
                                <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700 }}>
                                  Select ↵
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                        TENANT CNAME / SUBDOMAIN SLUG
                      </label>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: '#070C16',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          padding: '0 10px'
                        }}
                      >
                        <input
                          type="text"
                          value={formData.partnerTenantSlug}
                          placeholder="e.g. apollo-pharmacy"
                          onChange={(e) => setFormData({ ...formData, partnerTenantSlug: e.target.value })}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#F8FAFC',
                            outline: 'none',
                            padding: '8px 0',
                            width: '100%',
                            fontSize: '0.8125rem'
                          }}
                        />
                        <span style={{ fontSize: '0.72rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                          .docsearch.health
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Selected Healthcare Partner Intelligence Dossier Card */}
                  {currentPartner && selectedPartnerId !== 'CUSTOM_NEW' && (
                    <div
                      style={{
                        marginTop: '12px',
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        border: '1.5px solid rgba(16, 185, 129, 0.35)',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.3rem',
                            flexShrink: 0
                          }}
                        >
                          {getPartnerOrgIcon(currentPartner.partnerType)}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '0.875rem', color: '#A7F3D0' }}>
                              {currentPartner.tradeName || currentPartner.legalName}
                            </strong>
                            <Badge variant={isFreeCandidate ? 'success' : 'primary'}>
                              {isFreeCandidate ? '🆓 Free Onboarded Candidate' : '⭐ Active Enterprise'}
                            </Badge>
                            <span style={{ fontSize: '0.7rem', color: '#6EE7B7' }}>
                              License: {(currentPartner.metadata as any)?.licenseNumber || (currentPartner as any).licenseNumber || 'REG-2026-CEA-091'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.73rem', color: '#94A3B8', marginTop: '3px' }}>
                            👤 Contact: <strong style={{ color: '#E2E8F0' }}>{currentPartner.primaryContact?.name || 'Authorized Admin'}</strong> ({currentPartner.primaryContact?.roleTitle || 'Admin'}) • 📞 {currentPartner.primaryContact?.phone || '+91-XXXXX-XXXXX'} • ✉️ {currentPartner.primaryContact?.email || 'admin@docsearch.health'} • 📍 {(currentPartner.metadata as any)?.city || (currentPartner as any).city || 'India'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#34D399', fontWeight: 800 }}>
                          ✓ Data Loaded from Free System
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Organization Type, Product Suite & Plan Tier */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr 1.3fr', gap: '12px' }}>
                  {/* Organization Type Selector (Hospital, Pharmacy, Lab, Clinic, Surgical, Solo) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', marginBottom: '4px' }}>
                      🏢 ORGANIZATION TYPE *
                    </label>
                    <Select
                      options={Object.values(ORGANIZATION_CONFIG).map((cfg) => ({
                        label: `${cfg.icon} ${cfg.label}`,
                        value: cfg.code
                      }))}
                      value={formData.orgType}
                      onChange={(e) => handleOrgTypeChange(e.target.value)}
                    />
                  </div>

                  {/* Tailored Product Suite Selector */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      PRODUCT SUITE (TAILORED)
                    </label>
                    <Select
                      options={currentOrgConfig.productSuites}
                      value={formData.productName}
                      onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    />
                  </div>

                  {/* Tailored Plan Tier Selector with Prices */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      ASSIGNED PLAN TIER *
                    </label>
                    <Select
                      options={currentOrgConfig.planTiers.map((tier) => ({
                        label: `${tier.name} — ₹${tier.basePriceInr.toLocaleString('en-IN')}/yr (${tier.doctorSeats} Staff, ${tier.secondaryQuota} ${currentOrgConfig.secondaryQuotaUnit})`,
                        value: tier.name
                      }))}
                      value={formData.planName}
                      onChange={(e) => handlePlanChange(e.target.value)}
                    />
                  </div>
                </div>

                {/* Amount Decision & Pricing Authority Card */}
                <div
                  style={{
                    marginTop: '16px',
                    backgroundColor: '#070D1D',
                    border: pricingMode === 'FORMULA' ? '1.5px solid #06B6D4' : '1.5px solid #F59E0B',
                    borderRadius: '12px',
                    padding: '14px 16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>💡</span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        AMOUNT DECISION & PRICING AUTHORITY
                      </span>
                      <Badge variant={pricingMode === 'FORMULA' ? 'primary' : 'warning'}>
                        {pricingMode === 'FORMULA' ? '🤖 Formula-Driven Pricing' : '✏️ Custom Sales Negotiated'}
                      </Badge>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                      Authority: <strong style={{ color: '#F8FAFC' }}>DocSearch HQ Company Admin</strong>
                    </span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '10px', lineHeight: 1.45 }}>
                    <strong>Amount kon decide kar raha hai?</strong> Yeh contract amount <b>DocSearch Company Admin</b> dwara organization type ({currentOrgConfig.label}) aur selected plan ({activePlanTier.name}) ke mutabiq standard formula se auto-compute hoti hai — ya aap direct negotiated deal type kar sakte hain.
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', backgroundColor: '#0B132B', padding: '10px 12px', borderRadius: '8px', border: '1px solid #1E293B' }}>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>1. Plan Base</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>₹{baseTierPrice.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{activePlanTier.doctorSeats} Staff, {activePlanTier.secondaryQuota} {currentOrgConfig.secondaryQuotaUnit}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>2. Extra Capacity</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#38BDF8' }}>+₹{(extraDocFee + extraSecondaryFee).toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{extraDocs} Docs, {extraSecondary} {currentOrgConfig.secondaryQuotaUnit}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>3. Active Add-Ons</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#A855F7' }}>+₹{activeModulesTotalFee.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{modulesList.filter((m) => m.enabled).length} Enabled Modules</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>Gross Contract Value</div>
                      <div style={{ fontSize: '1rem', fontWeight: 900, color: '#10B981' }}>₹{formData.contractValueInr.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.65rem', color: '#34D399' }}>{pricingMode === 'FORMULA' ? '● Computed by Formula' : '● Custom Negotiated'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: Tenure, Duration & Renewal Terms */}
            {(activeSection === 'ALL' || activeSection === 'TENURE') && (
              <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '14px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⏳</span> Contract Tenure, Duration & Renewal Policies
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>Step 2 of 6</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  {/* Interactive Duration Stepper */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      CONTRACT TENURE: <span style={{ color: '#06B6D4', fontWeight: 900 }}>{formData.renewalMonths} Months</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, renewalMonths: Math.max(1, formData.renewalMonths - 1) })}
                        style={{ padding: '6px 14px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#F8FAFC', fontWeight: 800, cursor: 'pointer' }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={formData.renewalMonths}
                        onChange={(e) => setFormData({ ...formData, renewalMonths: Math.max(1, Number(e.target.value) || 1) })}
                        style={{ backgroundColor: '#070C16', border: '1px solid #334155', borderRadius: '6px', color: '#F8FAFC', textAlign: 'center', padding: '6px', width: '65px', fontWeight: 800 }}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, renewalMonths: formData.renewalMonths + 1 })}
                        style={{ padding: '6px 14px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#F8FAFC', fontWeight: 800, cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {[
                        { m: 1, label: '1M' },
                        { m: 3, label: '3M' },
                        { m: 6, label: '6M' },
                        { m: 12, label: '12M (1Y)' },
                        { m: 24, label: '24M (2Y)' },
                        { m: 36, label: '36M (3Y)' },
                        { m: 60, label: '60M (5Y)' }
                      ].map((pill) => (
                        <button
                          key={pill.m}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              renewalMonths: pill.m,
                              billingCycle: pill.m >= 12 ? 'YEARLY' : pill.m === 3 ? 'QUARTERLY' : 'MONTHLY'
                            })
                          }
                          style={{
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            border: formData.renewalMonths === pill.m ? '1px solid #06B6D4' : '1px solid #334155',
                            backgroundColor: formData.renewalMonths === pill.m ? 'rgba(6, 182, 212, 0.25)' : '#070C16',
                            color: formData.renewalMonths === pill.m ? '#38BDF8' : '#94A3B8',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {pill.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      BILLING CYCLE
                    </label>
                    <Select
                      options={[
                        { label: 'Yearly (Annual Contract)', value: 'YEARLY' },
                        { label: 'Monthly Recurring', value: 'MONTHLY' },
                        { label: 'Quarterly (3 Months)', value: 'QUARTERLY' },
                        { label: 'Multi-Year Enterprise Lock', value: 'CUSTOM' }
                      ]}
                      value={formData.billingCycle}
                      onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as BillingCycle })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      CONTRACT STATUS
                    </label>
                    <Select
                      options={[
                        { label: '● Active (Enforced)', value: 'ACTIVE' },
                        { label: '⏳ Pending Digital Signature', value: 'PENDING' },
                        { label: '⏸️ Paused (Moratorium)', value: 'PAUSED' },
                        { label: '🚫 Suspended (Non-Compliance)', value: 'SUSPENDED' }
                      ]}
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as SubscriptionStatus })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      GRACE PERIOD (DAYS)
                    </label>
                    <Select
                      options={[
                        { label: '7 Days Standard Grace', value: '7' },
                        { label: '15 Days Extended Grace', value: '15' },
                        { label: '30 Days Net-30 Grace Period', value: '30' }
                      ]}
                      value={String(formData.gracePeriodDays)}
                      onChange={(e) => setFormData({ ...formData, gracePeriodDays: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      AUTO-RENEWAL POLICY
                    </label>
                    <Select
                      options={[
                        { label: 'Auto-Renew with 5% Inflation Cap', value: 'AUTO_5PCT_CAP' },
                        { label: 'Auto-Renew at Flat Locked Price', value: 'AUTO_FLAT' },
                        { label: 'Manual Founder Review Required', value: 'MANUAL_REVIEW' }
                      ]}
                      value={formData.autoRenewalPolicy}
                      onChange={(e) => setFormData({ ...formData, autoRenewalPolicy: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      BILLING CURRENCY
                    </label>
                    <Select
                      options={[
                        { label: 'INR (₹ - Indian Rupee)', value: 'INR' },
                        { label: 'USD ($ - US Dollar)', value: 'USD' },
                        { label: 'AED (د.إ - UAE Dirham)', value: 'AED' },
                        { label: 'GBP (£ - British Pound)', value: 'GBP' },
                        { label: 'EUR (€ - Euro)', value: 'EUR' }
                      ]}
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: Commercials, Tax (GST), Discounts & Escrow */}
            {(activeSection === 'ALL' || activeSection === 'COMMERCIALS') && (
              <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '14px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>💰</span> Commercial Terms, Discounts & GST Invoicing
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>Step 3 of 6</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1' }}>
                        BASE CONTRACT VALUE ({formData.currency})
                      </label>
                      {pricingMode === 'CUSTOM' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPricingMode('FORMULA');
                            setFormData((prev) => ({ ...prev, contractValueInr: formulaCalculatedGross }));
                          }}
                          style={{ background: 'none', border: 'none', color: '#38BDF8', fontSize: '0.6875rem', cursor: 'pointer', textDecoration: 'underline', fontWeight: 700 }}
                        >
                          ⚡ Reset to Formula
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700 }}>● Formula Linked</span>
                      )}
                    </div>
                    <Input
                      type="number"
                      min="0"
                      value={formData.contractValueInr}
                      onChange={(e) => {
                        setPricingMode('CUSTOM');
                        setFormData({ ...formData, contractValueInr: Number(e.target.value) });
                      }}
                    />
                    <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '3px' }}>
                      {pricingMode === 'FORMULA'
                        ? 'Auto-synced with Plan & Quotas. Editing overrides to custom negotiated rate.'
                        : 'Custom negotiated sales contract rate applied.'}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1' }}>
                        SPECIAL CONCESSION / DISCOUNT ({formData.currency})
                      </label>
                      {formData.discountInr > 0 && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, discountInr: 0 })}
                          style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.6875rem', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>
                    <Input
                      type="number"
                      min="0"
                      value={formData.discountInr}
                      onChange={(e) => setFormData({ ...formData, discountInr: Number(e.target.value) })}
                    />
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      {[0, 5000, 10000, 25000, 50000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setFormData({ ...formData, discountInr: amt })}
                          style={{
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: formData.discountInr === amt ? '1px solid #06B6D4' : '1px solid #334155',
                            backgroundColor: formData.discountInr === amt ? 'rgba(6, 182, 212, 0.2)' : '#070C16',
                            color: formData.discountInr === amt ? '#38BDF8' : '#94A3B8',
                            fontSize: '0.65rem',
                            cursor: 'pointer'
                          }}
                        >
                          {amt === 0 ? 'No Discount' : `₹${amt / 1000}k`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      TAX / GST TREATMENT
                    </label>
                    <Select
                      options={[
                        { label: '18% GST Applicable (CGST 9% + SGST 9%)', value: 'GST_18' },
                        { label: '0% GST (SEZ / Export / Exempt)', value: 'GST_EXEMPT' },
                        { label: 'Reverse Charge Mechanism (RCM)', value: 'GST_RCM' }
                      ]}
                      value={formData.gstTreatment}
                      onChange={(e) => setFormData({ ...formData, gstTreatment: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      PAYMENT MANDATE & METHOD
                    </label>
                    <Select
                      options={[
                        { label: 'UPI Auto-Mandate (Instant NPCI e-Mandate)', value: 'UPI_MANDATE' },
                        { label: 'Net-30 Invoice Payout (NEFT / RTGS)', value: 'NET_30_INVOICE' },
                        { label: 'Corporate Credit Card Auto-Debit (0% MDR)', value: 'CORP_CARD' },
                        { label: 'International Wire / SWIFT Relay', value: 'SWIFT_WIRE' }
                      ]}
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      PLATFORM TAKE RATE: <span style={{ color: '#06B6D4' }}>{formData.platformTakeRatePct}%</span> (Hospital gets {100 - formData.platformTakeRatePct}%)
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="1"
                      value={formData.platformTakeRatePct}
                      onChange={(e) => setFormData({ ...formData, platformTakeRatePct: Number(e.target.value) })}
                      style={{ width: '100%', cursor: 'pointer', accentColor: '#06B6D4' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      TDS WITHHOLDING SECTION
                    </label>
                    <Select
                      options={[
                        { label: 'Section 194J (10% Professional Fees)', value: '194J_10' },
                        { label: 'Section 194C (2% Works Contract)', value: '194C_2' },
                        { label: 'Zero TDS (Nil Deduction Certificate)', value: 'NIL_TDS' }
                      ]}
                      value={formData.tdsSection}
                      onChange={(e) => setFormData({ ...formData, tdsSection: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4: Clinical & Commercial Capacity Quotas (Adaptive to Org Type) */}
            {(activeSection === 'ALL' || activeSection === 'QUOTAS') && (
              <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '14px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🩺</span> Adaptive Capacity Metrics: {currentOrgConfig.label}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>Step 4 of 6</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  {/* Doctor Seats / Staff Terminals */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      {formData.orgType === 'PHARMACY' ? 'PHARMACIST / STAFF SEATS:' : 'DOCTOR SEATS / LICENSES:'}{' '}
                      <span style={{ color: '#06B6D4', fontWeight: 900 }}>{formData.doctorSeats} Seats</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <button
                        type="button"
                        onClick={() => updateQuotasAndPricing({ doctorSeats: Math.max(1, formData.doctorSeats - 5) })}
                        style={{ padding: '6px 12px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#F8FAFC', fontWeight: 800, cursor: 'pointer' }}
                      >
                        -5
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={formData.doctorSeats}
                        onChange={(e) => updateQuotasAndPricing({ doctorSeats: Math.max(1, Number(e.target.value) || 1) })}
                        style={{ backgroundColor: '#070C16', border: '1px solid #334155', borderRadius: '6px', color: '#F8FAFC', textAlign: 'center', padding: '6px', width: '70px', fontWeight: 800 }}
                      />
                      <button
                        type="button"
                        onClick={() => updateQuotasAndPricing({ doctorSeats: formData.doctorSeats + 5 })}
                        style={{ padding: '6px 12px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#F8FAFC', fontWeight: 800, cursor: 'pointer' }}
                      >
                        +5
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {[1, 5, 15, 25, 50].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => updateQuotasAndPricing({ doctorSeats: num })}
                          style={{
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: formData.doctorSeats === num ? '1px solid #06B6D4' : '1px solid #334155',
                            backgroundColor: formData.doctorSeats === num ? 'rgba(6, 182, 212, 0.2)' : '#070C16',
                            color: formData.doctorSeats === num ? '#38BDF8' : '#94A3B8',
                            fontSize: '0.6875rem',
                            cursor: 'pointer'
                          }}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ADAPTIVE SECONDARY METRIC (Beds vs POS Counters vs Analyzers vs Rooms) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', marginBottom: '4px' }}>
                      {currentOrgConfig.secondaryQuotaLabel}:{' '}
                      <span style={{ color: '#10B981', fontWeight: 900 }}>
                        {formData.inpatientBeds} {currentOrgConfig.secondaryQuotaUnit}
                      </span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <button
                        type="button"
                        onClick={() => updateQuotasAndPricing({ inpatientBeds: Math.max(0, formData.inpatientBeds - 5) })}
                        style={{ padding: '6px 12px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#F8FAFC', fontWeight: 800, cursor: 'pointer' }}
                      >
                        -5
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={formData.inpatientBeds}
                        onChange={(e) => updateQuotasAndPricing({ inpatientBeds: Math.max(0, Number(e.target.value) || 0) })}
                        style={{ backgroundColor: '#070C16', border: '1px solid #334155', borderRadius: '6px', color: '#F8FAFC', textAlign: 'center', padding: '6px', width: '70px', fontWeight: 800 }}
                      />
                      <button
                        type="button"
                        onClick={() => updateQuotasAndPricing({ inpatientBeds: formData.inpatientBeds + 5 })}
                        style={{ padding: '6px 12px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#F8FAFC', fontWeight: 800, cursor: 'pointer' }}
                      >
                        +5
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {currentOrgConfig.secondaryQuotaPresets.map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => updateQuotasAndPricing({ inpatientBeds: num })}
                          style={{
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: formData.inpatientBeds === num ? '1px solid #06B6D4' : '1px solid #334155',
                            backgroundColor: formData.inpatientBeds === num ? 'rgba(6, 182, 212, 0.2)' : '#070C16',
                            color: formData.inpatientBeds === num ? '#38BDF8' : '#94A3B8',
                            fontSize: '0.6875rem',
                            cursor: 'pointer'
                          }}
                        >
                          {num} {currentOrgConfig.secondaryQuotaUnit}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Monthly OPD / Encounters / Invoices Quota */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      {formData.orgType === 'PHARMACY' ? 'MONTHLY BILLING INVOICES QUOTA' : 'MONTHLY OPD / LAB ENCOUNTERS'}
                    </label>
                    <Select
                      options={[
                        { label: '1,000 Volume / Mo', value: '1000' },
                        { label: '5,000 Volume / Mo', value: '5000' },
                        { label: '25,000 Volume / Mo', value: '25000' },
                        { label: 'Unlimited Enterprise Volume', value: '999999' }
                      ]}
                      value={String(formData.opdConsultQuota)}
                      onChange={(e) => setFormData({ ...formData, opdConsultQuota: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      CLOUD HIPAA / DICOM STORAGE QUOTA
                    </label>
                    <Select
                      options={[
                        { label: '25 GB Basic Health Locker', value: '25' },
                        { label: '100 GB Pro Cloud Storage', value: '100' },
                        { label: '250 GB Enterprise Cloud PACS', value: '250' },
                        { label: '1 TB High-Res Radiology Tier', value: '1000' }
                      ]}
                      value={String(formData.cloudStorageGb)}
                      onChange={(e) => setFormData({ ...formData, cloudStorageGb: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      MONTHLY WHATSAPP & SMS BROADCAST QUOTA
                    </label>
                    <Select
                      options={[
                        { label: '5,000 Patient Messages / Mo', value: '5000' },
                        { label: '25,000 Patient Messages / Mo', value: '25000' },
                        { label: '100,000 Patient Messages / Mo', value: '100000' },
                        { label: 'Unlimited Broadcasts', value: '999999' }
                      ]}
                      value={String(formData.broadcastSmsQuota)}
                      onChange={(e) => setFormData({ ...formData, broadcastSmsQuota: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 5: Modular Add-On Suites & Custom Feature Builder (Editable & Removable) */}
            {(activeSection === 'ALL' || activeSection === 'ADDONS') && (
              <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '14px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🚀</span> Modular Add-On Suites & Custom Feature Builder
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                      Toggle modules ON/OFF, remove unwanted items with 🗑️, or add brand-new custom contract services.
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingCustomModule(true)}
                    style={{ borderColor: '#06B6D4', color: '#38BDF8', fontWeight: 800 }}
                  >
                    ➕ Add Custom Module
                  </Button>
                </div>

                {/* Inline Form to Add Brand-New Custom Module */}
                {isAddingCustomModule && (
                  <div
                    style={{
                      backgroundColor: '#070D1D',
                      border: '1.5px solid #06B6D4',
                      borderRadius: '10px',
                      padding: '14px',
                      marginBottom: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '0.8125rem', color: '#38BDF8' }}>➕ Create Custom Add-On Module / Service</strong>
                      <button
                        type="button"
                        onClick={() => setIsAddingCustomModule(false)}
                        style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: '#CBD5E1', marginBottom: '3px' }}>
                          FEATURE / MODULE NAME *
                        </label>
                        <Input
                          required
                          value={newCustomTitle}
                          placeholder="e.g. Night Tele-ICU On-Call, Wholesale Inspector Sync..."
                          onChange={(e) => setNewCustomTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: '#CBD5E1', marginBottom: '3px' }}>
                          ANNUAL FEE (₹)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={newCustomFee}
                          onChange={(e) => setNewCustomFee(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: '#CBD5E1', marginBottom: '3px' }}>
                          EMOJI ICON
                        </label>
                        <Input
                          value={newCustomIcon}
                          placeholder="✨"
                          onChange={(e) => setNewCustomIcon(e.target.value)}
                        />
                      </div>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#CBD5E1', marginBottom: '3px' }}>
                        SERVICE SCOPE / DESCRIPTION
                      </label>
                      <Input
                        value={newCustomDesc}
                        placeholder="Brief explanation of the contractual deliverable..."
                        onChange={(e) => setNewCustomDesc(e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingCustomModule(false)}>
                        Cancel
                      </Button>
                      <Button type="button" variant="primary" size="sm" onClick={handleAddCustomModule}>
                        Add to Contract
                      </Button>
                    </div>
                  </div>
                )}

                {/* Modules Grid with Toggle and Remove Button */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {modulesList.map((mod) => (
                    <div
                      key={mod.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '12px',
                        borderRadius: '10px',
                        border: mod.enabled ? '1px solid #06B6D4' : '1px solid #1E293B',
                        backgroundColor: mod.enabled ? 'rgba(6, 182, 212, 0.1)' : '#070C16',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={mod.enabled}
                        onChange={() => toggleModule(mod.id)}
                        style={{ marginTop: '4px', accentColor: '#06B6D4', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '1rem' }}>{mod.icon}</span>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: mod.enabled ? '#F8FAFC' : '#CBD5E1' }}>
                              {mod.title}
                            </span>
                            {mod.isCustom && <Badge variant="warning">Custom</Badge>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8' }}>
                              +₹{mod.annualFeeInr.toLocaleString('en-IN')}/yr
                            </span>
                            {/* Remove Module Button */}
                            <button
                              type="button"
                              title="Remove module from contract"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeModule(mod.id);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#EF4444',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                padding: '2px 4px'
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: '#94A3B8', lineHeight: 1.35 }}>
                          {mod.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 6: SLA & Hosting Guarantees */}
            {(activeSection === 'ALL' || activeSection === 'SLA') && (
              <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '14px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📜</span> SLA, Mission-Critical Support & Data Isolation
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>Step 6 of 6</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      UPTIME SLA GUARANTEE
                    </label>
                    <Select
                      options={[
                        { label: '99.9% High Availability (Standard)', value: 'SLA_99_9' },
                        { label: '99.99% Mission-Critical ICU Tier', value: 'SLA_99_99' },
                        { label: '99.5% Business Hours SLA', value: 'SLA_99_5' }
                      ]}
                      value={formData.slaTier}
                      onChange={(e) => setFormData({ ...formData, slaTier: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      SUPPORT LEVEL & RESPONSE TIME
                    </label>
                    <Select
                      options={[
                        { label: 'Dedicated Account Mgr + 15m P0 SLA', value: 'DEDICATED_MGR' },
                        { label: '24/7 Priority Emergency Desk', value: 'PRIORITY_247' },
                        { label: 'Standard Ticket Support (24h SLA)', value: 'STANDARD_TICKET' }
                      ]}
                      value={formData.supportTier}
                      onChange={(e) => setFormData({ ...formData, supportTier: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      DATA ISOLATION / HOSTING
                    </label>
                    <Select
                      options={[
                        { label: 'Dedicated HIPAA Cloud VPC', value: 'HIPAA_VPC' },
                        { label: 'Multi-Tenant Shared Cloud', value: 'SHARED_CLOUD' },
                        { label: 'On-Premise Hybrid Air-Gapped Relay', value: 'ON_PREMISE_HYBRID' }
                      ]}
                      value={formData.hostingDeployment}
                      onChange={(e) => setFormData({ ...formData, hostingDeployment: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Right Pane: Sticky Live Contract Ledger & Invoicing HUD */}
          <div
            style={{
              width: '380px',
              backgroundColor: '#0A1124',
              borderLeft: '1.5px solid #1E293B',
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              flexShrink: 0
            }}
          >
            <div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#06B6D4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                CONTRACT SUMMARY & PRO-FORMA INVOICE
              </span>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '1.1rem', fontWeight: 900, color: '#F8FAFC' }}>
                {formData.partnerTradeName || 'New Healthcare Partner'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                <Badge variant="primary">{currentOrgConfig.label}</Badge>
                <Badge variant="neutral">{activePlanTier.badge}</Badge>
              </div>
            </div>

            {/* Commercial Breakout Cards */}
            <div style={{ backgroundColor: '#070D1D', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Gross Base Contract:</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
                  ₹{formData.contractValueInr.toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Special Concession:</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#EF4444' }}>
                  -₹{formData.discountInr.toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Taxable Net Subtotal:</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#38BDF8' }}>
                  ₹{netBeforeTax.toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  GST ({formData.gstTreatment === 'GST_18' ? '18% CGST+SGST' : '0% Exempt'}):
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F59E0B' }}>
                  +₹{gstAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <div style={{ borderTop: '1px solid #334155', paddingTop: '12px' }}>
                <span style={{ fontSize: '0.6875rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 800 }}>
                  NET INVOICED TOTAL
                </span>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
                  ₹{grossInvoiceTotal.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                  Amortized: <strong style={{ color: '#F8FAFC' }}>₹{monthlyRate.toLocaleString('en-IN')}/mo</strong> for{' '}
                  {formData.renewalMonths} Months
                </div>
              </div>
            </div>

            {/* Included Quotas Badge Pills */}
            <div style={{ backgroundColor: '#070D1D', border: '1px solid #1E293B', borderRadius: '12px', padding: '14px' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                ENFORCED CAPACITY & QUOTAS
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <Badge variant="primary">{formData.doctorSeats} Seats</Badge>
                <Badge variant="success">
                  {formData.inpatientBeds} {currentOrgConfig.secondaryQuotaUnit}
                </Badge>
                <Badge variant="neutral">{formData.opdConsultQuota.toLocaleString('en-IN')} Volume</Badge>
                <Badge variant="warning">{formData.cloudStorageGb} GB Cloud</Badge>
                <Badge variant="primary">{formData.slaTier === 'SLA_99_99' ? '99.99%' : '99.9%'} SLA</Badge>
              </div>
            </div>

            {/* Active Modules Counter */}
            <div style={{ backgroundColor: '#070D1D', border: '1px solid #1E293B', borderRadius: '12px', padding: '14px' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                ACTIVE MODULES & SERVICES ({modulesList.filter((m) => m.enabled).length} of {modulesList.length})
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {modulesList
                  .filter((m) => m.enabled)
                  .map((m) => (
                    <span
                      key={m.id}
                      style={{
                        backgroundColor: '#1E293B',
                        color: '#CBD5E1',
                        fontSize: '0.6875rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>{m.icon}</span> {m.title}
                    </span>
                  ))}
              </div>
            </div>

            {/* Authority Callout */}
            <div style={{ fontSize: '0.72rem', color: '#64748B', lineHeight: 1.4 }}>
              📌 <strong>Decision Authority:</strong> DocSearch HQ Company Admin. Saving generates an active contract in the database and creates a pro-forma GST tax invoice in the Invoices tab.
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
              <Button
                type="button"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting
                  ? 'Enforcing Contract...'
                  : isFreeCandidate
                    ? '⚡ Upgrade Partner & Enforce'
                    : '💾 Save & Enforce Subscription'}
              </Button>
              <Button type="button" variant="outline" size="md" onClick={onClose}>
                Cancel / Discard Changes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE FREE ONBOARDED HEALTHCARE SEARCH MODAL                        */}
      {/* ========================================================================= */}
      {isPartnerSearchModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10005,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0A1124',
              border: '2px solid #0284C7',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '920px',
              maxHeight: '86vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.95)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                backgroundColor: '#0F172A',
                borderBottom: '1px solid #1E293B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>🔍</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#F8FAFC' }}>
                    Search Free Onboarded Healthcare Database
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                    Select any registered community clinic, retail pharmacy, diagnostic lab, or hospital to auto-populate contract terms
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPartnerSearchModalOpen(false)}
                style={{
                  backgroundColor: '#1E293B',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '1rem',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Search & Category Filter Bar */}
            <div style={{ padding: '16px 20px', backgroundColor: '#070D1D', borderBottom: '1px solid #1E293B' }}>
              {/* Search Input */}
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0F172A', border: '1.5px solid #0284C7', borderRadius: '10px', padding: '0 12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1rem', color: '#0284C7', marginRight: '8px' }}>🔍</span>
                <input
                  type="text"
                  autoFocus
                  value={partnerSearchQuery}
                  placeholder="Search by trade name, legal entity, contact person, phone, email, city, license..."
                  onChange={(e) => setPartnerSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#F8FAFC',
                    outline: 'none',
                    padding: '10px 0',
                    width: '100%',
                    fontSize: '0.875rem'
                  }}
                />
                {partnerSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setPartnerSearchQuery('')}
                    style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginRight: '4px' }}>
                  CATEGORY:
                </span>
                {[
                  { id: 'ALL', label: 'All Entities', icon: '⚡', count: dbPartners.length },
                  { id: 'PHARMACY', label: 'Pharmacies', icon: '💊', count: dbPartners.filter(p => p.partnerType === 'PHARMACY').length },
                  { id: 'HOSPITAL', label: 'Hospitals', icon: '🏥', count: dbPartners.filter(p => p.partnerType === 'HOSPITAL_NETWORK').length },
                  { id: 'DIAGNOSTIC', label: 'Labs', icon: '🔬', count: dbPartners.filter(p => p.partnerType === 'DIAGNOSTIC_LAB').length },
                  { id: 'CLINIC', label: 'Clinics', icon: '🩺', count: dbPartners.filter(p => p.partnerType === 'CLINIC_GROUP').length },
                  { id: 'SURGICAL', label: 'Surgical', icon: '🔪', count: dbPartners.filter(p => p.partnerType === 'SURGICAL_CENTER').length },
                  { id: 'SOLO', label: 'Solo Doctors', icon: '👨‍⚕️', count: dbPartners.filter(p => p.partnerType === 'INDIVIDUAL_PRACTICE').length }
                ].map((cat) => {
                  const isCatActive = partnerFilterCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setPartnerFilterCategory(cat.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: isCatActive ? '1px solid #0284C7' : '1px solid #334155',
                        backgroundColor: isCatActive ? '#0284C7' : '#0F172A',
                        color: isCatActive ? '#FFFFFF' : '#94A3B8',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                      <span style={{ fontSize: '0.65rem', opacity: 0.8, backgroundColor: 'rgba(0,0,0,0.2)', padding: '1px 5px', borderRadius: '10px' }}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Partners Search Result List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                  {filteredSearchPartners.length} HEALTHCARE ENTITIES FOUND
                </span>
                <span style={{ fontSize: '0.72rem', color: '#38BDF8' }}>
                  Click "Select & Auto-Fill" to load details into contract
                </span>
              </div>

              {filteredSearchPartners.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#070D1D', borderRadius: '10px' }}>
                  <span style={{ fontSize: '2rem' }}>🔍</span>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#CBD5E1', marginTop: '8px' }}>
                    No matching registered healthcare entities found
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                    Try adjusting your search query or select "All Entities"
                  </div>
                </div>
              ) : (
                filteredSearchPartners.map((p) => {
                  const isSubscribed = existingSubscriptions.some(s => s.partnerId === p.id && s.status === 'ACTIVE');
                  const isSelected = selectedPartnerId === p.id;
                  const city = (p.metadata as any)?.city || (p as any).city || 'India';
                  const license = (p.metadata as any)?.licenseNumber || (p as any).licenseNumber || 'REG-2026-CEA-091';

                  return (
                    <div
                      key={p.id}
                      style={{
                        backgroundColor: isSelected ? 'rgba(2, 132, 199, 0.12)' : '#070D1D',
                        border: isSelected ? '1.5px solid #0284C7' : '1px solid #1E293B',
                        borderRadius: '10px',
                        padding: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                        transition: 'border 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            backgroundColor: '#0F172A',
                            border: '1px solid #334155',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.4rem',
                            flexShrink: 0
                          }}
                        >
                          {getPartnerOrgIcon(p.partnerType)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '0.9rem', color: '#F8FAFC' }}>
                              {p.tradeName || p.legalName}
                            </strong>
                            <Badge variant={isSubscribed ? 'primary' : 'success'}>
                              {isSubscribed ? '⭐ Active Enterprise' : '🆓 Free Onboarded'}
                            </Badge>
                            <span style={{ fontSize: '0.7rem', color: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                              {getPartnerOrgLabel(p.partnerType)}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '3px' }}>
                            Legal: <em>{p.legalName}</em> • Slug: <code style={{ color: '#E2E8F0' }}>{p.tenantSlug || 'slug'}.docsearch.health</code>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#CBD5E1', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <span>👤 <strong>{p.primaryContact?.name || 'Authorized Admin'}</strong> ({p.primaryContact?.roleTitle || 'Admin'})</span>
                            <span>📞 {p.primaryContact?.phone || '+91-XXXXX-XXXXX'}</span>
                            <span>✉️ {p.primaryContact?.email || 'admin@docsearch.health'}</span>
                            <span>📍 {city}</span>
                            <span>📜 {license}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => {
                            handlePartnerSelect(p.id);
                            setIsPartnerSearchModalOpen(false);
                          }}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: isSelected ? '#10B981' : '#0284C7',
                            color: '#FFFFFF',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                          }}
                        >
                          <span>{isSelected ? '✓ Selected' : '⚡ Select & Auto-Fill'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '12px 20px',
                backgroundColor: '#0F172A',
                borderTop: '1px solid #1E293B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                Can't find the organization? You can type any custom name directly in the Trade Name field.
              </span>
              <button
                type="button"
                onClick={() => setIsPartnerSearchModalOpen(false)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  backgroundColor: '#1E293B',
                  color: '#CBD5E1',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
