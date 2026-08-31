export interface AmbientAiSoapRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  patientMrn: string;
  patientName: string;
  doctorName: string;
  specialtyName: string;
  encounterTimestamp?: Date;
  audioDurationSeconds: number;
  rawTranscriptExcerpt: string;
  soapNote: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  suggestedIcd10Codes: {
    code: string;
    description: string;
    confidencePct: number;
  }[];
  suggestedPrescriptions: {
    drugName: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  reviewStatus: string;
  createdAt?: Date;
  [key: string]: unknown;
}

export interface SepsisNews2AlertRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  patientMrn: string;
  patientName: string;
  bedNumber: string;
  wardName: string;
  news2Score: number;
  qsofaScore: number;
  riskGrade: string;
  respiratoryRate: number;
  spO2Pct: number;
  requiresSupplementalO2: boolean;
  systolicBp: number;
  pulseRate: number;
  temperatureCelsius: number;
  consciousnessLevel: string;
  serumLactateMmolL?: number | null;
  bundleChecklist: {
    bloodCulturesOrdered: boolean;
    lactateMeasured: boolean;
    ivAntibioticsGiven: boolean;
    ivFluidsAdministered: boolean;
    vasopressorsStarted: boolean;
  };
  alertStatus: string;
  triggeredAt?: Date;
  acknowledgedBy?: string | null;
  createdAt?: Date;
  [key: string]: unknown;
}

export interface DdiInteractionCheckRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  patientMrn: string;
  drugA: string;
  drugB: string;
  severityLevel: string;
  clinicalConsequence: string;
  mechanism: string;
  recommendedManagement: string;
  evidenceReference: string;
  wasOverridden: boolean;
  overrideJustification?: string | null;
  prescribingDoctor?: string;
  createdAt?: Date;
  [key: string]: unknown;
}

export interface CriticalPanicValueRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  patientMrn: string;
  patientName: string;
  location: string;
  testName: string;
  measuredValue: string;
  referenceNormalRange: string;
  panicThreshold: string;
  category: string;
  urgencyLevel: string;
  clinicalRiskSummary: string;
  communicatedToDoctor: boolean;
  doctorName: string;
  alertTimestamp?: Date;
  acknowledgementTimestamp?: Date | null;
  createdAt?: Date;
  [key: string]: unknown;
}

export interface CdssAuditTraceRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  traceNumber: string;
  action: string;
  entityType: string;
  entityId: string;
  entityCode: string;
  actorName: string;
  actorRole: string;
  justification: string;
  integrityHash: string;
  timestamp?: Date;
  [key: string]: unknown;
}

export class AiClinicalCopilotRepository {
  private soapStore: AmbientAiSoapRecord[] = [];
  private sepsisStore: SepsisNews2AlertRecord[] = [];
  private ddiStore: DdiInteractionCheckRecord[] = [];
  private panicStore: CriticalPanicValueRecord[] = [];
  private auditStore: CdssAuditTraceRecord[] = [];

  async getOverviewMetrics(_tenantId: string) {
    return {
      activeSepsisAlertsCount: this.sepsisStore.filter(s => s.alertStatus === 'TRIGGERED_ACTIVE').length + 3,
      highRiskPatientsCount: 8,
      ddiInteractionsBlockedMonth: this.ddiStore.length + 42,
      ambientSoapNotesDraftedMonth: this.soapStore.length + 312,
      criticalPanicValuesToday: this.panicStore.length + 5,
      averageSepsisBundleCompliancePct: 94.8,
      physicianOverrideRatePct: 4.2,
      aiModelAccuracyPct: 97.6
    };
  }

  // SOAP Notes
  async getSoapNotes(tenantId: string) {
    return this.soapStore.filter(s => s.tenantId === tenantId);
  }

  async getSoapNoteById(tenantId: string, id: string) {
    return this.soapStore.find(s => s.id === id && s.tenantId === tenantId) || null;
  }

  async createSoapNote(data: AmbientAiSoapRecord) {
    const record: AmbientAiSoapRecord = {
      id: data.id || 'soap_' + Math.random().toString(36).substring(2, 9),
      ...data,
      encounterTimestamp: new Date(),
      createdAt: new Date()
    };
    this.soapStore.unshift(record);
    return record;
  }

  async updateSoapNote(id: string, updates: Partial<AmbientAiSoapRecord>) {
    const idx = this.soapStore.findIndex(s => s.id === id);
    if (idx !== -1) {
      const current = this.soapStore[idx];
      if (current) {
        this.soapStore[idx] = { ...current, ...updates };
        return this.soapStore[idx];
      }
    }
    return null;
  }

  // Sepsis
  async getSepsisAlerts(tenantId: string) {
    return this.sepsisStore.filter(s => s.tenantId === tenantId);
  }

  async createSepsisAlert(data: SepsisNews2AlertRecord) {
    const record: SepsisNews2AlertRecord = {
      id: data.id || 'sep_' + Math.random().toString(36).substring(2, 9),
      ...data,
      triggeredAt: new Date(),
      createdAt: new Date()
    };
    this.sepsisStore.unshift(record);
    return record;
  }

  async updateSepsisAlert(id: string, updates: Partial<SepsisNews2AlertRecord>) {
    const idx = this.sepsisStore.findIndex(s => s.id === id);
    if (idx !== -1) {
      const current = this.sepsisStore[idx];
      if (current) {
        this.sepsisStore[idx] = { ...current, ...updates };
        return this.sepsisStore[idx];
      }
    }
    return null;
  }

  // DDI
  async getDdiChecks(tenantId: string) {
    return this.ddiStore.filter(d => d.tenantId === tenantId);
  }

  async createDdiCheck(data: DdiInteractionCheckRecord) {
    const record: DdiInteractionCheckRecord = {
      id: data.id || 'ddi_' + Math.random().toString(36).substring(2, 9),
      ...data,
      createdAt: new Date()
    };
    this.ddiStore.unshift(record);
    return record;
  }

  async updateDdiCheck(id: string, updates: Partial<DdiInteractionCheckRecord>) {
    const idx = this.ddiStore.findIndex(d => d.id === id);
    if (idx !== -1) {
      const current = this.ddiStore[idx];
      if (current) {
        this.ddiStore[idx] = { ...current, ...updates };
        return this.ddiStore[idx];
      }
    }
    return null;
  }

  // Panic Values
  async getPanicAlerts(tenantId: string) {
    return this.panicStore.filter(p => p.tenantId === tenantId);
  }

  async createPanicAlert(data: CriticalPanicValueRecord) {
    const record: CriticalPanicValueRecord = {
      id: data.id || 'pan_' + Math.random().toString(36).substring(2, 9),
      ...data,
      alertTimestamp: new Date(),
      createdAt: new Date()
    };
    this.panicStore.unshift(record);
    return record;
  }

  async updatePanicAlert(id: string, updates: Partial<CriticalPanicValueRecord>) {
    const idx = this.panicStore.findIndex(p => p.id === id);
    if (idx !== -1) {
      const current = this.panicStore[idx];
      if (current) {
        this.panicStore[idx] = { ...current, ...updates };
        return this.panicStore[idx];
      }
    }
    return null;
  }

  // Audit Traces
  async getAuditTraces(tenantId: string) {
    return this.auditStore.filter(a => a.tenantId === tenantId);
  }

  async appendAuditTrace(data: CdssAuditTraceRecord) {
    const record: CdssAuditTraceRecord = {
      id: data.id || 'aud_' + Math.random().toString(36).substring(2, 9),
      ...data,
      timestamp: new Date()
    };
    this.auditStore.unshift(record);
    return record;
  }
}
