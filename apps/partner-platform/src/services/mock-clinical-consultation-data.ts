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
