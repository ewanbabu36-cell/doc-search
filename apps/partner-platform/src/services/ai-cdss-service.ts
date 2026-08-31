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

import {
  mockCdssOverviewMetrics,
  mockSepsisAlerts,
  mockDdiAssessments,
  mockRenalDoseAdjustments,
  mockAmbientSoapTranscripts,
  mockPanicValues,
  mockCdssAuditTraces
} from './mock-ai-cdss-data.js';

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

export class AiCdssService implements IAiCdssService {
  private metrics: CdssOverviewMetricsDto = { ...mockCdssOverviewMetrics };
  private sepsisAlerts: SepsisNews2AlertDto[] = [...mockSepsisAlerts];
  private ddiAssessments: DdiInteractionAssessmentDto[] = [...mockDdiAssessments];
  private renalAdjustments: RenalDoseAdjustmentDto[] = [...mockRenalDoseAdjustments];
  private soapTranscripts: AmbientAiSoapTranscriptDto[] = [...mockAmbientSoapTranscripts];
  private panicValues: DiagnosticPanicValueAlertDto[] = [...mockPanicValues];
  private auditTraces: CdssAuditTraceDto[] = [...mockCdssAuditTraces];

  private appendAudit(
    action: string,
    entityType: string,
    entityId: string,
    entityCode: string,
    justification: string,
    actorName = 'Dr. Sanjay Gupta (Consultant)',
    actorRole = 'ATTENDING_PHYSICIAN'
  ) {
    const traceNumber = `TRACE-CDSS-${Math.floor(10000 + Math.random() * 90000)}`;
    const trace: CdssAuditTraceDto = {
      id: crypto.randomUUID(),
      tenantId: '11111111-1111-4111-8111-111111111111',
      traceNumber,
      action,
      entityType,
      entityId,
      entityCode,
      actorName,
      actorRole,
      justification,
      integrityHash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      timestamp: new Date().toISOString()
    };
    this.auditTraces.unshift(trace);
  }

  async getOverviewMetrics(_tenantId: string): Promise<CdssOverviewMetricsDto> {
    return { ...this.metrics };
  }

  async getSepsisAlerts(_tenantId: string): Promise<SepsisNews2AlertDto[]> {
    return [...this.sepsisAlerts];
  }

  async acknowledgeSepsisAlert(_tenantId: string, payload: AcknowledgeSepsisAlertRequest): Promise<SepsisNews2AlertDto> {
    const alert = this.sepsisAlerts.find((a) => a.id === payload.alertId);
    if (!alert) throw new Error('Sepsis alert not found');

    alert.alertStatus = 'ACKNOWLEDGED_RRT_EN_ROUTE';
    alert.acknowledgedBy = payload.acknowledgedBy;
    alert.bundleChecklist.bloodCulturesOrdered = true;
    alert.bundleChecklist.ivAntibioticsGiven = true;
    alert.bundleChecklist.ivFluidsAdministered = true;

    this.appendAudit('ACKNOWLEDGE_SEPSIS_ALERT', 'SEPSIS_ALERT', alert.id, `NEWS2-${alert.news2Score}`, payload.clinicalActionTaken, payload.acknowledgedBy);
    return { ...alert };
  }

  async getDdiAssessments(_tenantId: string): Promise<DdiInteractionAssessmentDto[]> {
    return [...this.ddiAssessments];
  }

  async evaluateDdi(_tenantId: string, payload: EvaluateDdiRequest): Promise<DdiInteractionAssessmentDto[]> {
    const matched = this.ddiAssessments.filter((d) =>
      payload.activeMedications.some((m) => m.toLowerCase().includes(d.drugA.toLowerCase().split(' ')[0] || '')) ||
      payload.newMedicationToPrescribe.toLowerCase().includes(d.drugB.toLowerCase().split(' ')[0] || '')
    );
    const fallback = this.ddiAssessments[0];
    return matched.length > 0 ? matched : (fallback ? [fallback] : []);
  }

  async overrideDdiWarning(_tenantId: string, payload: OverrideDdiWarningRequest): Promise<void> {
    this.metrics.physicianOverrideRatePct += 0.1;
    this.appendAudit('OVERRIDE_DDI_WARNING', 'DDI_CHECK', payload.interactionId, 'OVERRIDE_APPROVED', payload.clinicalJustification, payload.prescribingDoctor);
  }

  async getRenalDoseAdjustments(_tenantId: string): Promise<RenalDoseAdjustmentDto[]> {
    return [...this.renalAdjustments];
  }

  async getAmbientSoapTranscripts(_tenantId: string): Promise<AmbientAiSoapTranscriptDto[]> {
    return [...this.soapTranscripts];
  }

  async generateAmbientSoap(_tenantId: string, payload: GenerateAmbientSoapRequest): Promise<AmbientAiSoapTranscriptDto> {
    const newSoap: AmbientAiSoapTranscriptDto = {
      id: crypto.randomUUID(),
      patientMrn: payload.patientMrn,
      patientName: payload.patientName,
      doctorName: payload.doctorName,
      specialtyName: payload.specialtyName,
      encounterTimestamp: new Date().toISOString(),
      audioDurationSeconds: 160,
      rawTranscriptExcerpt: payload.clinicalDialogueTranscript,
      soapNote: {
        subjective: "Patient reports recent onset fatigue and mild dry cough for 3 days. Denies shortness of breath or chest pain.",
        objective: "Vitals: Pulse 76 bpm, BP 122/78 mmHg, Temp 37.1 C. Chest: Bilateral vesicular breath sounds without rhonchi or wheeze.",
        assessment: "1. Acute Upper Respiratory Tract Infection (Viral). 2. Normotensive on current regimen.",
        plan: "1. Symptomatic care with Steam inhalation & warm saline gargles. 2. Paracetamol 650mg SOS. 3. Review if fever persists beyond 48 hours."
      },
      suggestedIcd10Codes: [
        { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified', confidencePct: 96.2 }
      ],
      suggestedPrescriptions: [
        { drugName: 'Paracetamol 650mg', dosage: '1 Tablet', frequency: 'TDS Post-meals', duration: '3 Days' },
        { drugName: 'Cetirizine 10mg', dosage: '1 Tablet', frequency: 'OD Night', duration: '5 Days' }
      ],
      reviewStatus: 'AI_DRAFTED'
    };

    this.soapTranscripts.unshift(newSoap);
    this.metrics.ambientSoapNotesDraftedMonth += 1;
    this.appendAudit('GENERATE_AMBIENT_SOAP', 'SOAP_TRANSCRIPT', newSoap.id, payload.patientMrn, 'Ambient AI conversation translated to structured SOAP note', payload.doctorName);
    return newSoap;
  }

  async getPanicValues(_tenantId: string): Promise<DiagnosticPanicValueAlertDto[]> {
    return [...this.panicValues];
  }

  async acknowledgePanicValue(_tenantId: string, payload: AcknowledgePanicValueRequest): Promise<DiagnosticPanicValueAlertDto> {
    const panic = this.panicValues.find((p) => p.id === payload.panicAlertId);
    if (!panic) throw new Error('Panic value alert not found');

    panic.acknowledgementTimestamp = new Date().toISOString();
    panic.communicatedToDoctor = true;

    this.appendAudit('ACKNOWLEDGE_PANIC_VALUE', 'PANIC_ALERT', panic.id, panic.testName, payload.immediateIntervention, payload.acknowledgedByDoctor);
    return { ...panic };
  }

  async getAuditTraces(_tenantId: string): Promise<CdssAuditTraceDto[]> {
    return [...this.auditTraces];
  }
}

export const aiCdssService = new AiCdssService();
