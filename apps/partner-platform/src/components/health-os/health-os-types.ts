import type { OrganizationWorkspaceType } from '../auth/HospitalStaffLogin.js';

export type HealthOSModuleKey =
  | 'billing-revenue-cycle'
  | 'encounters-visits'
  | 'clinical-consultation'
  | 'pharmacy-medication'
  | 'clinical-investigation'
  | 'inpatient-management'
  | 'staff-administration'
  | 'emergency-trauma'
  | 'ot-management'
  | 'radiology-pacs'
  | 'blood-bank'
  | 'telemedicine-rpm'
  | 'abdm-fhir'
  | 'ai-cdss'
  | 'whatsapp-portal'
  | 'executive-command-center'
  | 'offers-rewards-hub'
  | 'patient-registration'
  | 'patient-portal';

export type HealthOSCategory = 'CORE' | 'CLINICAL' | 'OPERATIONS' | 'DIAGNOSTICS' | 'EXECUTIVE';

export type StaffRolePersona =
  | 'DOCTOR'
  | 'NURSE'
  | 'RECEPTIONIST'
  | 'CASHIER'
  | 'PHARMACIST'
  | 'LAB_TECHNICIAN'
  | 'RADIOLOGIST'
  | 'HOSPITAL_ADMIN';

export interface HealthOSAppItem {
  id: HealthOSModuleKey;
  label: string;
  shortLabel: string;
  category: HealthOSCategory;
  icon: string;
  gradient: string;
  route: string;
  description: string;
  badge?: string;
  isCoreHomeApp?: boolean;
  applicableProfiles: OrganizationWorkspaceType[];
  applicableRoles?: StaffRolePersona[];
}

export interface HealthOSRecentTask {
  id: HealthOSModuleKey;
  app: HealthOSAppItem;
  lastActiveTime: string;
  timestamp: number;
}

export type PatientAcuityLevel = 'ROUTINE' | 'URGENT' | 'EMERGENCY';

export interface PatientVitalsSummary {
  systolicBp?: number;
  diastolicBp?: number;
  bp?: string;
  pulseBpm?: number;
  pulse?: number;
  spo2Percentage?: number;
  spo2?: number;
  temperatureCelsius?: number;
  temp?: number;
  respiratoryRate?: number;
  news2Score?: number;
  news2?: number;
  recordedAt?: string;
}

export interface ActivePatientTab {
  encounterId: string;
  patientId: string;
  patientName: string;
  mrn: string;
  acuity: PatientAcuityLevel;
  draftNotes?: Record<string, any>;
  activeSubModule?: string;
  bedNumber?: string;
  ageGender?: string;
  gender?: string;
  age?: number | string;
  abhaId?: string;
  allergies?: string[];
  vitals?: PatientVitalsSummary;
  chronicConditions?: string[];
  department?: string;
  attendingDoctor?: string;
  chiefComplaint?: string;
}

export type SlideOverTrayType = 'QUICK_RX' | 'QUICK_LAB' | 'INSTANT_SETTLE' | 'QUICK_VITALS' | null;
