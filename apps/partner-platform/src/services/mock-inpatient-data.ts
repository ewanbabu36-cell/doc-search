import type {
  InpatientUnitDto,
  InpatientWardDto,
  InpatientBedDto,
  InpatientAdmissionRequestDto,
  InpatientAdmissionDto,
  InpatientTransferDto,
  InpatientNursingAssessmentDto,
  InpatientVitalObservationDto,
  InpatientDoctorRoundDto,
  InpatientDischargePlanDto,
  InpatientDischargeSummaryDto,
  InpatientBedTurnaroundDto,
  InpatientBedBlockDto,
  InpatientAuditTraceDto,
  InpatientOverviewMetricsDto,
  InpatientAnalyticsDto
} from '@docsearch/api-contracts';

export const mockInpatientUnits: InpatientUnitDto[] = [];
export const mockInpatientWards: InpatientWardDto[] = [];
export const mockInpatientBeds: InpatientBedDto[] = [];
export const mockInpatientAdmissionRequests: InpatientAdmissionRequestDto[] = [];
export const mockInpatientAdmissions: InpatientAdmissionDto[] = [];
export const mockInpatientTransfers: InpatientTransferDto[] = [];
export const mockInpatientNursingAssessments: InpatientNursingAssessmentDto[] = [];
export const mockInpatientVitalObservations: InpatientVitalObservationDto[] = [];
export const mockInpatientDoctorRounds: InpatientDoctorRoundDto[] = [];
export const mockInpatientDischargePlans: InpatientDischargePlanDto[] = [];
export const mockInpatientDischargeSummaries: InpatientDischargeSummaryDto[] = [];
export const mockInpatientBedTurnarounds: InpatientBedTurnaroundDto[] = [];
export const mockInpatientBedBlocks: InpatientBedBlockDto[] = [];
export const mockInpatientAuditTraces: InpatientAuditTraceDto[] = [];

export const mockInpatientOverviewMetrics: InpatientOverviewMetricsDto = {
  totalInpatients: 0,
  admissionsToday: 0,
  dischargesToday: 0,
  pendingAdmissions: 0,
  totalBeds: 0,
  availableBeds: 0,
  occupiedBeds: 0,
  reservedBeds: 0,
  blockedBeds: 0,
  cleaningBeds: 0,
  occupancyRatePercentage: 0,
  icuOccupancyRatePercentage: 0,
  averageLengthOfStayDays: 0,
  transferBacklog: 0,
  dischargeBacklog: 0,
  cleaningBacklog: 0,
  criticalAlertsCount: 0
};

export const mockInpatientAnalytics: InpatientAnalyticsDto = {
  wardOccupancy: [],
  dailyAdmissionDischargeTrends: [],
  lengthOfStayDistribution: [],
  careLevelUtilization: []
};
