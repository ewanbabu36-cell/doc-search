import type {
  SepsisNews2AlertDto,
  DdiInteractionAssessmentDto,
  RenalDoseAdjustmentDto,
  AmbientAiSoapTranscriptDto,
  DiagnosticPanicValueAlertDto,
  CdssOverviewMetricsDto,
  CdssAuditTraceDto
} from '@docsearch/api-contracts';

export const mockCdssOverviewMetrics: CdssOverviewMetricsDto = {
  activeSepsisAlertsCount: 0,
  highRiskPatientsCount: 0,
  ddiInteractionsBlockedMonth: 0,
  ambientSoapNotesDraftedMonth: 0,
  criticalPanicValuesToday: 0,
  averageSepsisBundleCompliancePct: 100,
  physicianOverrideRatePct: 0,
  aiModelAccuracyPct: 100
};

export const mockSepsisAlerts: SepsisNews2AlertDto[] = [];

export const mockDdiAssessments: DdiInteractionAssessmentDto[] = [];

export const mockRenalDoseAdjustments: RenalDoseAdjustmentDto[] = [];

export const mockAmbientSoapTranscripts: AmbientAiSoapTranscriptDto[] = [];

export const mockPanicValues: DiagnosticPanicValueAlertDto[] = [];

export const mockCdssAuditTraces: CdssAuditTraceDto[] = [];
