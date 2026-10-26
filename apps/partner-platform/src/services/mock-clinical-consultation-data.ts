import type {
  ConsultationDto,
  ConsultationVitalsDto,
  ConsultationExaminationDto,
  ConsultationDiagnosisDto,
  ConsultationMedicationDto,
  ConsultationInstructionDto,
  ConsultationFollowUpDto,
  ConsultationAuditTraceDto,
  ConsultationOverviewDto
} from '@docsearch/api-contracts';

/**
 * Strict Production Clinic Pilot Mode Guard
 * When VITE_APP_ENV === 'production' or running in production pilot mode,
 * mock fallback data ('Aman Verma', 'Sunita Sharma', etc.) is permanently disabled.
 */
export const isProductionClinicPilot = (): boolean => {
  if (typeof window !== 'undefined') {
    const override = window.localStorage?.getItem('docsearch_pilot_mode');
    if (override === 'production') return true;
    if (override === 'mock') return false;
  }
  const appEnv = (import.meta as any)?.env?.['VITE_APP_ENV'];
  const mode = (import.meta as any)?.env?.['MODE'];
  const nodeEnv = typeof process !== 'undefined' ? (process.env as any)?.['VITE_APP_ENV'] || (process.env as any)?.['NODE_ENV'] : '';
  return appEnv === 'production' || mode === 'production' || nodeEnv === 'production';
};

/**
 * Filter out mock demo patients from any data arrays in production
 */
export const filterRealClinicalPatients = <T extends { patientName?: string; name?: string }>(records: T[]): T[] => {
  if (!isProductionClinicPilot() || !Array.isArray(records)) return records;
  const mockNames = ['aman verma', 'sunita sharma', 'eleanor vance', 'david miller', 'sophia martinez'];
  return records.filter((r) => {
    const name = (r.patientName || r.name || '').toLowerCase().trim();
    return !mockNames.some((mock) => name.includes(mock));
  });
};

export const MOCK_CONSULTATION_VITALS: ConsultationVitalsDto[] = [];
export const MOCK_CONSULTATION_EXAMINATIONS: ConsultationExaminationDto[] = [];
export const MOCK_CONSULTATION_DIAGNOSES: ConsultationDiagnosisDto[] = [];
export const MOCK_CONSULTATION_MEDICATIONS: ConsultationMedicationDto[] = [];
export const MOCK_CONSULTATION_INSTRUCTIONS: ConsultationInstructionDto[] = [];
export const MOCK_CONSULTATION_FOLLOWUPS: ConsultationFollowUpDto[] = [];
export const MOCK_CONSULTATIONS: ConsultationDto[] = [];
export const MOCK_CONSULTATION_AUDIT_TRACES: ConsultationAuditTraceDto[] = [];

export const MOCK_CONSULTATION_OVERVIEW: ConsultationOverviewDto = {
  totalConsultationsCount: 0,
  completedTodayCount: 0,
  activeConsultationsCount: 0,
  draftConsultationsCount: 0,
  inProgressConsultationsCount: 0,
  followUpsRequiredCount: 0,
  uncompletedNotesCount: 0,
  amendedCount: 0
};
