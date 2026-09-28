import type {
  EmergencyDepartmentDto,
  EmergencyZoneDto,
  EmergencyEncounterDto,
  EmergencyTriageAssessmentDto,
  EmergencyTriageReassessmentDto,
  EmergencyResuscitationEventDto,
  TraumaActivationDto,
  EmergencyObservationCaseDto,
  EmergencyMLCCaseDto,
  EmergencyCrashCartDto,
  EmergencyAmbulanceTransferDto,
  EmergencyDispositionDto,
  EmergencyDeathRecordDto,
  EmergencyDisasterEventDto,
  EmergencyAuditTraceDto,
  EmergencyOverviewMetricsDto,
  EmergencyAnalyticsDto
} from '@docsearch/api-contracts';

const T_ID = '11111111-1111-4111-8111-111111111111';
const P_ID = '22222222-2222-4222-8222-222222222222';
const O_ID = '33333333-3333-4333-8333-333333333333';
const B_ID = '44444444-4444-4444-8444-444444444444';

export const mockEmergencyDepartment: EmergencyDepartmentDto = {
  id: 'ed-001',
  tenantId: T_ID,
  partnerId: P_ID,
  organizationId: O_ID,
  branchId: B_ID,
  departmentCode: 'ED-TRAUMA-MAIN',
  departmentName: 'Emergency Department',
  totalBeds: 0,
  resuscitationBeds: 0,
  traumaBeds: 0,
  observationBeds: 0,
  headOfEmergency: '',
  isDisasterModeActive: false,
  isActive: true,
  createdAt: '2026-08-01T08:00:00.000Z',
  updatedAt: '2026-08-01T08:00:00.000Z'
};

export const mockEmergencyZones: EmergencyZoneDto[] = [];
export const mockEmergencyEncounters: EmergencyEncounterDto[] = [];
export const mockTriageAssessments: EmergencyTriageAssessmentDto[] = [];
export const mockTriageReassessments: EmergencyTriageReassessmentDto[] = [];
export const mockResuscitationEvents: EmergencyResuscitationEventDto[] = [];
export const mockTraumaActivations: TraumaActivationDto[] = [];
export const mockObservationCases: EmergencyObservationCaseDto[] = [];
export const mockMLCCases: EmergencyMLCCaseDto[] = [];
export const mockCrashCarts: EmergencyCrashCartDto[] = [];
export const mockAmbulanceTransfers: EmergencyAmbulanceTransferDto[] = [];
export const mockDispositions: EmergencyDispositionDto[] = [];
export const mockDeathRecords: EmergencyDeathRecordDto[] = [];
export const mockDisasterEvents: EmergencyDisasterEventDto[] = [];
export const mockAuditTraces: EmergencyAuditTraceDto[] = [];

export const mockOverviewMetrics: EmergencyOverviewMetricsDto = {
  isDisasterModeActive: false,
  activeEDCensus: 0,
  waitingForTriageCount: 0,
  esi1Count: 0,
  esi2Count: 0,
  esi3Count: 0,
  activeTraumaAlerts: 0,
  activeResuscitationCount: 0,
  mlcCasesToday: 0,
  observationPatientsCount: 0,
  averageDoorToDoctorMinutes: 0,
  averageDoorToTriageMinutes: 0
};

export const mockAnalytics: EmergencyAnalyticsDto = {
  esiDistribution: [],
  arrivalModes: [],
  hourlyVolume: [],
  dispositionBreakdown: []
};
