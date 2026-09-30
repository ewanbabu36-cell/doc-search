import type {
  EncounterDto,
  EncounterQueueDto,
  EncounterReferralDto,
  EncounterAuditTraceDto,
  EncounterOverviewDto
} from '@docsearch/api-contracts';

export const MOCK_ENCOUNTER_REFERRALS: EncounterReferralDto[] = [];
export const MOCK_ENCOUNTER_QUEUES: EncounterQueueDto[] = [];
export const MOCK_ENCOUNTERS: EncounterDto[] = [];
export const MOCK_ENCOUNTER_AUDIT_TRACES: EncounterAuditTraceDto[] = [];

export const MOCK_ENCOUNTER_OVERVIEW: EncounterOverviewDto = {
  totalEncountersTodayCount: 0,
  waitingQueueCount: 0,
  inConsultationCount: 0,
  completedTodayCount: 0,
  emergencyEncountersCount: 0,
  telehealthEncountersCount: 0,
  cancelledCount: 0
};
