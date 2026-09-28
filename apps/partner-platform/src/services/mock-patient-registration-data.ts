import type {
  PatientDto,
  PatientDuplicateCandidateDto,
  PatientMergeEventDto,
  PatientRegistrationAuditTraceDto,
  PatientRegistrationOverviewDto
} from '@docsearch/api-contracts';

export const MOCK_PATIENTS: PatientDto[] = [];
export const MOCK_PATIENT_DUPLICATE_CANDIDATES: PatientDuplicateCandidateDto[] = [];
export const MOCK_PATIENT_MERGE_EVENTS: PatientMergeEventDto[] = [];
export const MOCK_PATIENT_REGISTRATION_AUDIT_TRACES: PatientRegistrationAuditTraceDto[] = [];

export const MOCK_PATIENT_REGISTRATION_OVERVIEW: PatientRegistrationOverviewDto = {
  totalPatientsCount: 0,
  activePatientsCount: 0,
  newRegistrationsTodayCount: 0,
  pendingDuplicateReviewsCount: 0,
  mergedRecordsCount: 0,
  insuredPatientsCount: 0,
  activeConsentsCount: 0
};
