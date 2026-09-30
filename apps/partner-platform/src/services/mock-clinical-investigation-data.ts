import type {
  InvestigationCatalogDto,
  InvestigationPanelDto,
  InvestigationOrderDto,
  InvestigationSpecimenDto,
  InvestigationResultDto,
  InvestigationReportDto,
  InvestigationResultAmendmentDto,
  InvestigationAuditTraceDto,
  InvestigationOverviewDto
} from '@docsearch/api-contracts';


/**
 * Phase 2.7: Master Investigation Catalog Mock Fixtures
 * Classification: Operational Live Telemetry (.docsearch.health)
 */
export const MOCK_INVESTIGATION_CATALOG: InvestigationCatalogDto[] = [];

/**
 * Phase 2.7: Investigation Panels Mock Fixtures
 */
export const MOCK_INVESTIGATION_PANELS: InvestigationPanelDto[] = [];

/**
 * Phase 2.7: Investigation Results Fixtures
 */
export const MOCK_INVESTIGATION_RESULTS: InvestigationResultDto[] = [];

/**
 * Phase 2.7: Diagnostic Reports Mock Fixtures
 */
export const MOCK_INVESTIGATION_REPORTS: InvestigationReportDto[] = [];

/**
 * Phase 2.7: Result Amendments Mock Fixtures
 */
export const MOCK_INVESTIGATION_AMENDMENTS: InvestigationResultAmendmentDto[] = [];

/**
 * Phase 2.7: Investigation Specimens Mock Fixtures
 */
export const MOCK_INVESTIGATION_SPECIMENS: InvestigationSpecimenDto[] = [];

/**
 * Phase 2.7: Investigation Orders Mock Fixtures
 */
export const MOCK_INVESTIGATION_ORDERS: InvestigationOrderDto[] = [];

/**
 * Phase 2.7: Investigation Audit Traces Mock Fixtures
 */
export const MOCK_INVESTIGATION_AUDIT_TRACES: InvestigationAuditTraceDto[] = [];

export const MOCK_INVESTIGATION_OVERVIEW: InvestigationOverviewDto = {
  todayOrdersCount: 0,
  pendingCollectionsCount: 0,
  processingCount: 0,
  resultsReadyCount: 0,
  criticalResultsCount: 0,
  awaitingVerificationCount: 0,
  awaitingDoctorReviewCount: 0,
  completedInvestigationsCount: 0
};
