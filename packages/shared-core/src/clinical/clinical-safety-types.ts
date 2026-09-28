/**
 * DOC SEARCH — Clinical Safety Types & Contracts
 * Enforces untrusted-by-default STT transcription safety, physiological bounding,
 * and Indian pharmacy formulary validation.
 */

export type ClinicalSafetyStatus = 'VALID' | 'UNCERTAIN' | 'REQUIRES_CONFIRMATION' | 'REJECTED';

export type ClinicalEntityType = 'MEDICATION' | 'VITAL' | 'LAB_VALUE' | 'DOSAGE' | 'FREQUENCY';

export type ClinicalSafetyFlag =
  | 'INVALID_VITAL_VALUE'
  | 'SPO2_OUT_OF_PHYSIOLOGICAL_RANGE'
  | 'INVALID_BLOOD_PRESSURE'
  | 'INVERTED_BLOOD_PRESSURE'
  | 'INVALID_HEART_RATE'
  | 'INVALID_TEMPERATURE'
  | 'INVALID_RESPIRATORY_RATE'
  | 'INVALID_GLUCOSE_VALUE'
  | 'EXACT_MEDICINE_MATCH'
  | 'FUZZY_MEDICINE_MATCH'
  | 'AMBIGUOUS_MEDICINE_MATCH'
  | 'UNKNOWN_MEDICINE'
  | 'HIGH_RISK_SCHEDULE_H1'
  | 'HIGH_RISK_SCHEDULE_X'
  | 'UNUSUAL_DOSAGE'
  | 'UNKNOWN_FREQUENCY'
  | 'PHYSIOLOGICAL_OUTLIER';

export interface ClinicalVitalBounds {
  min: number;
  max: number;
  criticalLow?: number;
  criticalHigh?: number;
  unit: string;
  name: string;
}

export interface ClinicalExtractedEntity {
  type: ClinicalEntityType;
  rawText: string;
  normalizedValue?: string | number | Record<string, unknown> | undefined;
  candidateMatch?: string | undefined;
  confidence?: number | undefined;
  status: ClinicalSafetyStatus;
  flags: ClinicalSafetyFlag[];
  unit?: string | undefined;
  range?: { min: number; max: number; unit: string } | undefined;
  reason?: string | undefined;
}

export interface ClinicalSafetyReport {
  status: ClinicalSafetyStatus;
  safetyFlags: ClinicalSafetyFlag[];
  entities: ClinicalExtractedEntity[];
  requiresConfirmation: boolean;
  suggestedAction: 'PROCEED' | 'VERIFY_WITH_CLINICIAN' | 'REJECT_INVALID_DATA';
  summary: string;
}

export interface ClinicalValidationOptions {
  strictMode?: boolean;
  allowExperimentalDrugs?: boolean;
  patientAgeYears?: number;
}
