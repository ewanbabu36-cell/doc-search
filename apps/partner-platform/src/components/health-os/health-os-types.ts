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
  | 'patient-registration';

export type HealthOSCategory = 'CORE' | 'CLINICAL' | 'OPERATIONS' | 'DIAGNOSTICS' | 'EXECUTIVE';

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
}

export interface HealthOSRecentTask {
  id: HealthOSModuleKey;
  app: HealthOSAppItem;
  lastActiveTime: string;
  timestamp: number;
}
