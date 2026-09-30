import type {
  BloodBankFacilityDto,
  BloodDonorDto,
  BloodDonorScreeningDto,
  BloodDonationDto,
  BloodTestRecordDto,
  BloodComponentDto,
  BloodRequestDto,
  BloodCrossmatchDto,
  BloodIssueDto,
  TransfusionRecordDto,
  TransfusionReactionDto,
  BloodQualityCheckDto,
  BloodStorageTemperatureLogDto,
  BloodDiscardRecordDto,
  BloodBankAuditTraceDto,
  BloodBankOverviewMetricsDto,
  BloodBankAnalyticsDto
} from '@docsearch/api-contracts';

const T_ID = '11111111-1111-4111-8111-111111111111';
const P_ID = '22222222-2222-4222-8222-222222222222';
const O_ID = '33333333-3333-4333-8333-333333333333';
const B_ID = '44444444-4444-4444-8444-444444444444';

export const mockBloodBankFacility: BloodBankFacilityDto = {
  id: 'bbf-001',
  tenantId: T_ID,
  partnerId: P_ID,
  organizationId: O_ID,
  branchId: B_ID,
  facilityCode: 'BB-CENTRAL-01',
  facilityName: 'Blood Bank & Transfusion Medicine Unit',
  licenseNumber: 'FDA-BB-LIC-2026/8892',
  medicalDirectorName: '',
  headTechnologistName: '',
  storageLocationName: 'Blood Bank Suite',
  totalAvailableUnits: 0,
  quarantineUnits: 0,
  isActive: true,
  createdAt: '2026-08-01T08:00:00.000Z',
  updatedAt: '2026-08-01T08:00:00.000Z'
};

export const mockBloodDonors: BloodDonorDto[] = [];

export const mockDonorScreenings: BloodDonorScreeningDto[] = [];

export const mockBloodDonations: BloodDonationDto[] = [];

export const mockBloodTests: BloodTestRecordDto[] = [];

export const mockBloodComponents: BloodComponentDto[] = [];

export const mockBloodRequests: BloodRequestDto[] = [];

export const mockCrossmatches: BloodCrossmatchDto[] = [];

export const mockBloodIssues: BloodIssueDto[] = [];

export const mockTransfusions: TransfusionRecordDto[] = [];

export const mockReactions: TransfusionReactionDto[] = [];

export const mockQualityChecks: BloodQualityCheckDto[] = [];

export const mockTemperatureLogs: BloodStorageTemperatureLogDto[] = [];

export const mockDiscards: BloodDiscardRecordDto[] = [];

export const mockBloodBankAuditTraces: BloodBankAuditTraceDto[] = [];

export const mockBloodBankOverviewMetrics: BloodBankOverviewMetricsDto = {
  totalAvailableUnits: 0,
  quarantineUnitsCount: 0,
  prbcStockCount: 0,
  plateletStockCount: 0,
  ffpStockCount: 0,
  pendingRequestsCount: 0,
  activeCrossmatchesCount: 0,
  todaysTransfusionsCount: 0,
  reactionCasesUnderReview: 0,
  criticalLowBloodGroups: []
};

export const mockBloodBankAnalytics: BloodBankAnalyticsDto = {
  inventoryByBloodGroup: [],
  transfusionsByDepartment: [],
  monthlyDonationTrends: [],
  wastageReasons: []
};
