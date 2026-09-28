import type {
  BiomedicalAssetDto,
  AssetTransferDto,
  PpmScheduleDto,
  BreakdownWorkOrderDto,
  CalibrationRecordDto,
  SafetyTestRecordDto,
  SparePartDto,
  SparePartUsageDto,
  VendorServiceVisitDto,
  CondemnationRecordDto,
  BiomedicalIncidentDto,
  BiomedicalAuditTraceDto,
  AssetOverviewMetricsDto,
  AssetDowntimeAnalyticsDto
} from '@docsearch/api-contracts';

export const mockBiomedicalAssets: BiomedicalAssetDto[] = [];

export const mockAssetTransfers: AssetTransferDto[] = [];

export const mockPpmSchedules: PpmScheduleDto[] = [];

export const mockBreakdownWorkOrders: BreakdownWorkOrderDto[] = [];

export const mockCalibrationRecords: CalibrationRecordDto[] = [];

export const mockSafetyTestRecords: SafetyTestRecordDto[] = [];

export const mockSpareParts: SparePartDto[] = [];

export const mockSparePartUsages: SparePartUsageDto[] = [];

export const mockVendorVisits: VendorServiceVisitDto[] = [];

export const mockCondemnations: CondemnationRecordDto[] = [];

export const mockBiomedicalIncidents: BiomedicalIncidentDto[] = [];

export const mockBiomedicalAuditTraces: BiomedicalAuditTraceDto[] = [];

export const mockBiomedicalOverviewMetrics: AssetOverviewMetricsDto = {
  totalAssetsCount: 0,
  inServiceCount: 0,
  underMaintenanceCount: 0,
  breakdownCount: 0,
  criticalLifeSupportCount: 0,
  ppmOverdueCount: 0,
  calibrationDueNext30Days: 0,
  openWorkOrdersCount: 0,
  emergencyWorkOrdersCount: 0,
  overallFleetUptimePercentage: 100
};

export const mockDowntimeAnalytics: AssetDowntimeAnalyticsDto = {
  meanTimeToRepairHours: 0,
  meanTimeBetweenFailuresHours: 0,
  totalDowntimeHoursMonth: 0,
  fleetUptimePct: 100,
  downtimeByDepartment: {},
  breakdownsByCategory: {},
  annualMaintenanceSpend: {
    sparePartsCost: 0,
    vendorContractCost: 0,
    inHouseLaborCost: 0,
    budgetAllocated: 0
  }
};
