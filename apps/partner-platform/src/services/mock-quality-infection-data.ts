import type {
  QualityStandardDto,
  HospitalIncidentDto,
  IncidentRcaDto,
  QualityCapaDto,
  HaiSurveillanceDto,
  HaiDeviceDaysDto,
  PatientIsolationDto,
  HandHygieneAuditDto,
  EnvironmentalMicroSwabDto,
  NeedleStickOccupationalLogDto,
  BiomedicalWasteLogDto,
  QualityOverviewMetricsDto,
  QualityAuditTraceDto
} from '@docsearch/api-contracts';

export const mockQualityStandards: QualityStandardDto[] = [];

export const mockHospitalIncidents: HospitalIncidentDto[] = [];

export const mockIncidentRcas: IncidentRcaDto[] = [];

export const mockQualityCapas: QualityCapaDto[] = [];

export const mockHaiSurveillances: HaiSurveillanceDto[] = [];

export const mockHaiDeviceDays: HaiDeviceDaysDto = {
  id: 'hai-dev-001',
  tenantId: '11111111-1111-4111-8111-111111111111',
  departmentName: 'Infection Control Unit',
  monthYear: '2026-09',
  centralLineDays: 0,
  clabsiCount: 0,
  clabsiRatePer1000Days: 0,
  urinaryCatheterDays: 0,
  cautiCount: 0,
  cautiRatePer1000Days: 0,
  ventilatorDays: 0,
  vapCount: 0,
  vapRatePer1000Days: 0,
  surgicalProceduresCount: 0,
  ssiCount: 0,
  ssiPercentage: 0
};

export const mockPatientIsolations: PatientIsolationDto[] = [];

export const mockHandHygieneAudits: HandHygieneAuditDto[] = [];

export const mockEnvironmentalSwabs: EnvironmentalMicroSwabDto[] = [];

export const mockNeedleStickLogs: NeedleStickOccupationalLogDto[] = [];

export const mockBmwLogs: BiomedicalWasteLogDto[] = [];

export const mockQualityOverviewMetrics: QualityOverviewMetricsDto = {
  overallNabhCompliancePct: 100,
  openIncidentsCount: 0,
  sentinelEventsCount: 0,
  clabsiRateFleet: 0,
  cautiRateFleet: 0,
  vapRateFleet: 0,
  ssiRateFleetPct: 0,
  handHygieneCompliancePct: 100,
  activeIsolatedPatientsCount: 0,
  openCapaActionsCount: 0,
  overdueCapaCount: 0,
  satisfactorySwabsRatePct: 100
};

export const mockQualityAuditTraces: QualityAuditTraceDto[] = [];
