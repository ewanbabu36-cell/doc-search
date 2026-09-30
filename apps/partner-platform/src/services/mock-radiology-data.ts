import type {
  RadiologyDepartmentDto,
  RadiologyModalityDto,
  RadiologyProcedureCatalogDto,
  RadiologyOrderDto,
  RadiologyAppointmentDto,
  RadiologyPreparationRecordDto,
  RadiologyStudyDto,
  RadiologyReportDto,
  RadiologyCriticalFindingDto,
  RadiologyQualityEventDto,
  RadiologyAuditTraceDto,
  RadiologyOverviewMetricsDto,
  RadiologyAnalyticsDto
} from '@docsearch/api-contracts';

const tenantId = '11111111-1111-4111-8111-111111111111';
const partnerId = '22222222-2222-4222-8222-222222222222';
const organizationId = '33333333-3333-4333-8333-333333333333';
const branchId = '44444444-4444-4444-8444-444444444444';

export const mockRadiologyDepartment: RadiologyDepartmentDto = {
  id: 'rad-dept-001',
  tenantId,
  partnerId,
  organizationId,
  branchId,
  departmentCode: 'RAD-CENTRAL',
  departmentName: 'Department of Diagnostic & Interventional Imaging',
  hodRadiologistName: '',
  chiefTechnologistName: '',
  locationDescription: 'Imaging Pavilion',
  totalModalitiesCount: 0,
  isActive: true,
  createdAt: '2026-01-10T08:00:00.000Z'
};

export const mockRadiologyModalities: RadiologyModalityDto[] = [];

export const mockRadiologyProcedureCatalog: RadiologyProcedureCatalogDto[] = [];

export const mockRadiologyProcedures = mockRadiologyProcedureCatalog;

export const mockRadiologyOrders: RadiologyOrderDto[] = [];
export const mockRadiologyAppointments: RadiologyAppointmentDto[] = [];
export const mockRadiologyPreparationRecords: RadiologyPreparationRecordDto[] = [];
export const mockRadiologyStudies: RadiologyStudyDto[] = [];
export const mockRadiologyReports: RadiologyReportDto[] = [];
export const mockRadiologyCriticalFindings: RadiologyCriticalFindingDto[] = [];
export const mockRadiologyQualityEvents: RadiologyQualityEventDto[] = [];
export const mockRadiologyAuditTraces: RadiologyAuditTraceDto[] = [];

export const mockRadiologyMetrics: RadiologyOverviewMetricsDto = {
  todaysOrdersCount: 0,
  pendingStudiesCount: 0,
  completedScansCount: 0,
  pendingReportsCount: 0,
  criticalFindingsCount: 0,
  modalityOnlinePercent: 100,
  averageTurnaroundMinutes: 0,
  emergencyQueueCount: 0
};

export const mockRadiologyAnalytics: RadiologyAnalyticsDto = {
  studiesByModality: [],
  reportsByRadiologist: [],
  turnaroundTimeTrendHours: [],
  qualityEventsByType: []
};
