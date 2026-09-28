import type {
  OperationTheatreComplexDto,
  OperationTheatreRoomDto,
  SurgicalProcedureDto,
  SurgeryRequestDto,
  PreOperativeAssessmentDto,
  SurgicalConsentDto,
  OTScheduleDto,
  PreOpChecklistDto,
  SurgicalSafetyChecklistDto,
  OTTransferDto,
  AnaesthesiaRecordDto,
  IntraoperativeRecordDto,
  OperativeNoteDto,
  SurgicalSpecimenDto,
  SurgicalImplantDto,
  SurgicalConsumableUsageDto,
  PACURecoveryRecordDto,
  PostoperativeTransferDto,
  SurgeryCancellationDto,
  OTAuditTraceDto,
  OTOverviewMetricsDto,
  OTAnalyticsDto
} from '@docsearch/api-contracts';

export const mockOTComplexes: OperationTheatreComplexDto[] = [];
export const mockOTRooms: OperationTheatreRoomDto[] = [];

export const mockSurgicalProcedures: SurgicalProcedureDto[] = [];

export const mockSurgeryRequests: SurgeryRequestDto[] = [];
export const mockPreOpAssessments: PreOperativeAssessmentDto[] = [];
export const mockSurgicalConsents: SurgicalConsentDto[] = [];
export const mockOTSchedules: OTScheduleDto[] = [];
export const mockPreOpChecklists: PreOpChecklistDto[] = [];
export const mockSurgicalSafetyChecklists: SurgicalSafetyChecklistDto[] = [];
export const mockOTTransfers: OTTransferDto[] = [];
export const mockAnaesthesiaRecords: AnaesthesiaRecordDto[] = [];
export const mockIntraoperativeRecords: IntraoperativeRecordDto[] = [];
export const mockOperativeNotes: OperativeNoteDto[] = [];
export const mockSurgicalSpecimens: SurgicalSpecimenDto[] = [];
export const mockSurgicalImplants: SurgicalImplantDto[] = [];
export const mockSurgicalConsumables: SurgicalConsumableUsageDto[] = [];
export const mockPACURecords: PACURecoveryRecordDto[] = [];
export const mockPostoperativeTransfers: PostoperativeTransferDto[] = [];
export const mockSurgeryCancellations: SurgeryCancellationDto[] = [];
export const mockOTAuditTraces: OTAuditTraceDto[] = [];

export const mockOTOverviewMetrics: OTOverviewMetricsDto = {
  totalOTRooms: 0,
  activeOTRooms: 0,
  occupiedOTRooms: 0,
  availableOTRooms: 0,
  surgeriesToday: 0,
  completedSurgeriesToday: 0,
  inProgressSurgeries: 0,
  emergencySurgeriesToday: 0,
  pendingRequests: 0,
  pacuPatientsCount: 0,
  otUtilizationPercentage: 0,
  delayedSurgeriesCount: 0,
  averageTurnaroundTimeMinutes: 0
};

export const mockOTAnalytics: OTAnalyticsDto = {
  specialtyDistribution: [],
  monthlySurgeryTrends: [],
  turnaroundTimeByRoom: [],
  cancellationReasons: []
};
