import type {
  MRDepartmentDto,
  MedicalRecordIndexDto,
  MedicalRecordCompletionTaskDto,
  ICDCodeItemDto,
  MedicalDiagnosisCodeDto,
  CodingReviewDto,
  ClinicalDocumentationQueryDto,
  ReleaseOfInformationRequestDto,
  LegalRecordRequestDto,
  MedicalRecordLegalHoldDto,
  BirthRegistryRecordDto,
  DeathRegistryRecordDto,
  MedicalRecordAuditTraceDto,
  MRDOverviewMetricsDto,
  MRDAnalyticsDto
} from '@docsearch/api-contracts';

const T_ID = '11111111-1111-4111-8111-111111111111';
const P_ID = '22222222-2222-4222-8222-222222222222';
const O_ID = '33333333-3333-4333-8333-333333333333';
const B_ID = '44444444-4444-4444-8444-444444444444';

export const mockMRDepartment: MRDepartmentDto = {
  id: 'mrd-001',
  tenantId: T_ID,
  partnerId: P_ID,
  organizationId: O_ID,
  branchId: B_ID,
  departmentCode: 'HIM-MRD-MAIN',
  departmentName: 'Health Information Management & Medical Records Central Division',
  headOfMrdName: '',
  leadHIMOfficerName: '',
  leadCodingAuditorName: '',
  physicalVaultLocation: 'Basement Level B2, Archival Vault Suite A-12',
  totalIndexedRecords: 0,
  isActive: true,
  createdAt: '2026-08-01T08:00:00.000Z',
  updatedAt: '2026-08-01T08:00:00.000Z'
};

export const mockMedicalRecords: MedicalRecordIndexDto[] = [];

export const mockCompletionTasks: MedicalRecordCompletionTaskDto[] = [];

export const mockICD10Catalog: ICDCodeItemDto[] = [];

export const mockDiagnosisCodes: MedicalDiagnosisCodeDto[] = [];

export const mockCodingReviews: CodingReviewDto[] = [];

export const mockClinicalQueries: ClinicalDocumentationQueryDto[] = [];

export const mockROIRequests: ReleaseOfInformationRequestDto[] = [];

export const mockLegalRequests: LegalRecordRequestDto[] = [];

export const mockLegalHolds: MedicalRecordLegalHoldDto[] = [];

export const mockBirthRecords: BirthRegistryRecordDto[] = [];

export const mockMRDDeathRecords: DeathRegistryRecordDto[] = [];

export const mockMRDAuditTraces: MedicalRecordAuditTraceDto[] = [];

export const mockMRDOverviewMetrics: MRDOverviewMetricsDto = {
  totalActiveRecords: 0,
  incompleteChartsCount: 0,
  pendingCodingQueueCount: 0,
  activeQueriesCount: 0,
  pendingROIRequestsCount: 0,
  activeLegalHoldsCount: 0,
  averageCodingTurnaroundHours: 0,
  codingAccuracyRatePercent: 100
};

export const mockMRDAnalytics: MRDAnalyticsDto = {
  topDiagnosesICD: [],
  chartCompletionRates: [],
  queryResolutionTimeDays: [],
  roiVolumeByType: []
};
