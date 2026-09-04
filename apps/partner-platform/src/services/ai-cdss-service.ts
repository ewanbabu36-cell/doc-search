import type {
  SepsisNews2AlertDto,
  DdiInteractionAssessmentDto,
  RenalDoseAdjustmentDto,
  AmbientAiSoapTranscriptDto,
  DiagnosticPanicValueAlertDto,
  CdssOverviewMetricsDto,
  CdssAuditTraceDto,
  AcknowledgeSepsisAlertRequest,
  EvaluateDdiRequest,
  OverrideDdiWarningRequest,
  GenerateAmbientSoapRequest,
  AcknowledgePanicValueRequest
} from '@docsearch/api-contracts';
import { apiRequest } from './api-client.js';

export interface IAiCdssService {
  getOverviewMetrics(tenantId: string): Promise<CdssOverviewMetricsDto>;
  getSepsisAlerts(tenantId: string): Promise<SepsisNews2AlertDto[]>;
  acknowledgeSepsisAlert(tenantId: string, payload: AcknowledgeSepsisAlertRequest): Promise<SepsisNews2AlertDto>;

  getDdiAssessments(tenantId: string): Promise<DdiInteractionAssessmentDto[]>;
  evaluateDdi(tenantId: string, payload: EvaluateDdiRequest): Promise<DdiInteractionAssessmentDto[]>;
  overrideDdiWarning(tenantId: string, payload: OverrideDdiWarningRequest): Promise<void>;

  getRenalDoseAdjustments(tenantId: string): Promise<RenalDoseAdjustmentDto[]>;

  getAmbientSoapTranscripts(tenantId: string): Promise<AmbientAiSoapTranscriptDto[]>;
  generateAmbientSoap(tenantId: string, payload: GenerateAmbientSoapRequest): Promise<AmbientAiSoapTranscriptDto>;

  getPanicValues(tenantId: string): Promise<DiagnosticPanicValueAlertDto[]>;
  acknowledgePanicValue(tenantId: string, payload: AcknowledgePanicValueRequest): Promise<DiagnosticPanicValueAlertDto>;

  getAuditTraces(tenantId: string): Promise<CdssAuditTraceDto[]>;
}

function mapSepsisAlert(row: Record<string, unknown>): SepsisNews2AlertDto {
  return {
    id: String(row['id'] ?? ''),
    tenantId: String(row['tenantId'] ?? ''),
    patientMrn: String(row['patientMrn'] ?? ''),
    patientName: String(row['patientName'] ?? ''),
    bedNumber: String(row['bedNumber'] ?? ''),
    wardName: String(row['wardName'] ?? ''),
    news2Score: Number(row['news2Score'] ?? 0),
    qsofaScore: Number(row['qsofaScore'] ?? 0),
    riskGrade: (row['riskGrade'] as SepsisNews2AlertDto['riskGrade']) ?? 'LOW_RISK_0_4',
    respiratoryRate: Number(row['respiratoryRate'] ?? 0),
    spO2Pct: Number(row['spO2Pct'] ?? 0),
    requiresSupplementalO2: Boolean(row['requiresSupplementalO2']),
    systolicBp: Number(row['systolicBp'] ?? 0),
    pulseRate: Number(row['pulseRate'] ?? 0),
    temperatureCelsius: Number(row['temperatureCelsius'] ?? 0),
    consciousnessLevel: (row['consciousnessLevel'] as SepsisNews2AlertDto['consciousnessLevel']) ?? 'ALERT',
    serumLactateMmolL: row['serumLactateMmolL'] != null ? Number(row['serumLactateMmolL']) : null,
    bundleChecklist: row['bundleChecklist'] as SepsisNews2AlertDto['bundleChecklist'],
    alertStatus: (row['alertStatus'] as SepsisNews2AlertDto['alertStatus']) ?? 'TRIGGERED_ACTIVE',
    triggeredAt: typeof row['triggeredAt'] === 'string' ? row['triggeredAt'] : (row['triggeredAt'] ? new Date(row['triggeredAt'] as string | number | Date).toISOString() : new Date().toISOString()),
    acknowledgedBy: (row['acknowledgedBy'] as string | null | undefined) ?? null
  };
}

function mapDdi(row: Record<string, unknown>): DdiInteractionAssessmentDto {
  return {
    id: String(row['id'] ?? ''),
    drugA: String(row['drugA'] ?? ''),
    drugB: String(row['drugB'] ?? ''),
    severityLevel: row['severityLevel'] as DdiInteractionAssessmentDto['severityLevel'],
    clinicalConsequence: String(row['clinicalConsequence'] ?? ''),
    mechanism: String(row['mechanism'] ?? ''),
    recommendedManagement: String(row['recommendedManagement'] ?? ''),
    evidenceReference: String(row['evidenceReference'] ?? '')
  };
}

function mapSoap(row: Record<string, unknown>): AmbientAiSoapTranscriptDto {
  return {
    id: String(row['id'] ?? ''),
    patientMrn: String(row['patientMrn'] ?? ''),
    patientName: String(row['patientName'] ?? ''),
    doctorName: String(row['doctorName'] ?? ''),
    specialtyName: String(row['specialtyName'] ?? ''),
    encounterTimestamp: typeof row['encounterTimestamp'] === 'string' ? row['encounterTimestamp'] : (row['encounterTimestamp'] ? new Date(row['encounterTimestamp'] as string | number | Date).toISOString() : new Date().toISOString()),
    audioDurationSeconds: Number(row['audioDurationSeconds'] || 0),
    rawTranscriptExcerpt: String(row['rawTranscriptExcerpt'] ?? ''),
    soapNote: row['soapNote'] as AmbientAiSoapTranscriptDto['soapNote'],
    suggestedIcd10Codes: (row['suggestedIcd10Codes'] as AmbientAiSoapTranscriptDto['suggestedIcd10Codes']) || [],
    suggestedPrescriptions: (row['suggestedPrescriptions'] as AmbientAiSoapTranscriptDto['suggestedPrescriptions']) || [],
    reviewStatus: row['reviewStatus'] as AmbientAiSoapTranscriptDto['reviewStatus']
  };
}

function mapPanic(row: Record<string, unknown>): DiagnosticPanicValueAlertDto {
  return {
    id: String(row['id'] ?? ''),
    patientMrn: String(row['patientMrn'] ?? ''),
    patientName: String(row['patientName'] ?? ''),
    location: String(row['location'] ?? ''),
    testName: String(row['testName'] ?? ''),
    measuredValue: String(row['measuredValue'] ?? ''),
    referenceNormalRange: String(row['referenceNormalRange'] ?? ''),
    panicThreshold: String(row['panicThreshold'] ?? ''),
    category: row['category'] as DiagnosticPanicValueAlertDto['category'],
    urgencyLevel: row['urgencyLevel'] as DiagnosticPanicValueAlertDto['urgencyLevel'],
    clinicalRiskSummary: String(row['clinicalRiskSummary'] ?? ''),
    communicatedToDoctor: Boolean(row['communicatedToDoctor']),
    doctorName: String(row['doctorName'] ?? ''),
    alertTimestamp: typeof row['alertTimestamp'] === 'string' ? row['alertTimestamp'] : (row['alertTimestamp'] ? new Date(row['alertTimestamp'] as string | number | Date).toISOString() : new Date().toISOString()),
    acknowledgementTimestamp: row['acknowledgementTimestamp'] ? (typeof row['acknowledgementTimestamp'] === 'string' ? row['acknowledgementTimestamp'] : new Date(row['acknowledgementTimestamp'] as string | number | Date).toISOString()) : null
  };
}

function mapAudit(row: Record<string, unknown>): CdssAuditTraceDto {
  return {
    id: String(row['id'] ?? ''),
    tenantId: String(row['tenantId'] ?? ''),
    traceNumber: String(row['traceNumber'] ?? ''),
    action: row['action'] as CdssAuditTraceDto['action'],
    entityType: row['entityType'] as CdssAuditTraceDto['entityType'],
    entityId: String(row['entityId'] ?? ''),
    entityCode: String(row['entityCode'] ?? ''),
    actorName: String(row['actorName'] ?? ''),
    actorRole: String(row['actorRole'] ?? ''),
    justification: String(row['justification'] ?? ''),
    integrityHash: String(row['integrityHash'] ?? ''),
    timestamp: typeof row['timestamp'] === 'string' ? row['timestamp'] : (row['timestamp'] ? new Date(row['timestamp'] as string | number | Date).toISOString() : new Date().toISOString())
  };
}

export class AiCdssService implements IAiCdssService {
  async getOverviewMetrics(_tenantId: string): Promise<CdssOverviewMetricsDto> {
    const res = await apiRequest<CdssOverviewMetricsDto>('/api/v1/partner/ai-copilot/overview');
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to fetch CDSS overview metrics');
    }
    return res.data;
  }

  async getSepsisAlerts(_tenantId: string): Promise<SepsisNews2AlertDto[]> {
    const res = await apiRequest<Record<string, unknown>[]>('/api/v1/partner/ai-copilot/sepsis/alerts');
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to fetch sepsis alerts');
    }
    return res.data.map(mapSepsisAlert);
  }

  async acknowledgeSepsisAlert(_tenantId: string, payload: AcknowledgeSepsisAlertRequest): Promise<SepsisNews2AlertDto> {
    const res = await apiRequest<Record<string, unknown>>(
      `/api/v1/partner/ai-copilot/sepsis/alerts/${payload.alertId}/acknowledge`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }
    );
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to acknowledge sepsis alert');
    }
    return mapSepsisAlert(res.data);
  }

  async getDdiAssessments(_tenantId: string): Promise<DdiInteractionAssessmentDto[]> {
    const res = await apiRequest<Record<string, unknown>[]>('/api/v1/partner/ai-copilot/ddi');
    if (!res.success || !res.data) {
      return [];
    }
    return res.data.map(mapDdi);
  }

  async evaluateDdi(_tenantId: string, payload: EvaluateDdiRequest): Promise<DdiInteractionAssessmentDto[]> {
    const res = await apiRequest<Record<string, unknown> | Record<string, unknown>[]>(
      '/api/v1/partner/ai-copilot/ddi/evaluate',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to evaluate DDI interactions');
    }
    const items = Array.isArray(res.data) ? res.data : [res.data];
    return items.map(mapDdi);
  }

  async overrideDdiWarning(_tenantId: string, payload: OverrideDdiWarningRequest): Promise<void> {
    const res = await apiRequest<void>(
      '/api/v1/partner/ai-copilot/ddi/override',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );
    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to override DDI warning');
    }
  }

  async getRenalDoseAdjustments(_tenantId: string): Promise<RenalDoseAdjustmentDto[]> {
    return [];
  }

  async getAmbientSoapTranscripts(_tenantId: string): Promise<AmbientAiSoapTranscriptDto[]> {
    const res = await apiRequest<Record<string, unknown>[]>('/api/v1/partner/ai-copilot/ambient-scribe/soap');
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to fetch ambient SOAP transcripts');
    }
    return res.data.map(mapSoap);
  }

  async generateAmbientSoap(_tenantId: string, payload: GenerateAmbientSoapRequest): Promise<AmbientAiSoapTranscriptDto> {
    const res = await apiRequest<Record<string, unknown>>(
      '/api/v1/partner/ai-copilot/ambient-scribe/soap',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to generate ambient SOAP note');
    }
    return mapSoap(res.data);
  }

  async getPanicValues(_tenantId: string): Promise<DiagnosticPanicValueAlertDto[]> {
    const res = await apiRequest<Record<string, unknown>[]>('/api/v1/partner/ai-copilot/panic-values');
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to fetch critical panic values');
    }
    return res.data.map(mapPanic);
  }

  async acknowledgePanicValue(_tenantId: string, payload: AcknowledgePanicValueRequest): Promise<DiagnosticPanicValueAlertDto> {
    const res = await apiRequest<Record<string, unknown>>(
      `/api/v1/partner/ai-copilot/panic-values/${payload.panicAlertId}/acknowledge`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }
    );
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to acknowledge panic value alert');
    }
    return mapPanic(res.data);
  }

  async getAuditTraces(_tenantId: string): Promise<CdssAuditTraceDto[]> {
    const res = await apiRequest<Record<string, unknown>[]>('/api/v1/partner/ai-copilot/audit-traces');
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to fetch CDSS audit traces');
    }
    return res.data.map(mapAudit);
  }
}

export const aiCdssService = new AiCdssService();

