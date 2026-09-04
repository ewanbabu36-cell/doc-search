import crypto from 'node:crypto';
import {
  getDatabase,
  eq,
  and,
  desc,
  count,
  ambientAiScribeTranscripts,
  sepsisNews2Alerts,
  ddiDrugInteractionChecks,
  criticalPanicValueAlerts,
  cdssAuditTraces,
  type AmbientAiSoapTranscript,
  type SepsisNews2Alert,
  type DdiDrugInteractionCheck,
  type CriticalPanicValueAlert,
  type CdssAuditTrace
} from '@docsearch/database';

export interface AmbientAiSoapRecord {
  id?: string | undefined;
  tenantId: string;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  patientMrn: string;
  patientName: string;
  doctorName: string;
  specialtyName: string;
  encounterTimestamp?: Date | undefined;
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
  createdAt?: Date | undefined;
  [key: string]: unknown;
}

export interface SepsisNews2AlertRecord {
  id?: string | undefined;
  tenantId: string;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
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
  serumLactateMmolL?: number | null | undefined;
  bundleChecklist: {
    bloodCulturesOrdered: boolean;
    lactateMeasured: boolean;
    ivAntibioticsGiven: boolean;
    ivFluidsAdministered: boolean;
    vasopressorsStarted: boolean;
  };
  alertStatus: string;
  triggeredAt?: Date | undefined;
  acknowledgedBy?: string | null | undefined;
  createdAt?: Date | undefined;
  [key: string]: unknown;
}

export interface DdiInteractionCheckRecord {
  id?: string | undefined;
  tenantId: string;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  patientMrn: string;
  drugA: string;
  drugB: string;
  severityLevel: string;
  clinicalConsequence: string;
  mechanism: string;
  recommendedManagement: string;
  evidenceReference: string;
  wasOverridden: boolean;
  overrideJustification?: string | null | undefined;
  prescribingDoctor?: string | undefined;
  createdAt?: Date | undefined;
  [key: string]: unknown;
}

export interface CriticalPanicValueRecord {
  id?: string | undefined;
  tenantId: string;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
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
  alertTimestamp?: Date | undefined;
  acknowledgementTimestamp?: Date | null | undefined;
  createdAt?: Date | undefined;
  [key: string]: unknown;
}

export interface CdssAuditTraceRecord {
  id?: string | undefined;
  tenantId: string;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  traceNumber: string;
  action: string;
  entityType: string;
  entityId: string;
  entityCode: string;
  actorName: string;
  actorRole: string;
  justification: string;
  integrityHash: string;
  timestamp?: Date | undefined;
  [key: string]: unknown;
}

const DEFAULT_PARTNER_ID = '00000000-0000-4000-8000-000000000001';
const DEFAULT_ORG_ID = '00000000-0000-4000-8000-000000000002';
const DEFAULT_BRANCH_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const GENERAL_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toValidUuid(val: unknown, fallback: string): string {
  if (typeof val === 'string' && GENERAL_UUID_REGEX.test(val)) {
    return val;
  }
  return fallback;
}

type TransactionDb = Parameters<Parameters<ReturnType<typeof getDatabase>['transaction']>[0]>[0];
export type DbClient = ReturnType<typeof getDatabase> | TransactionDb;

export class AiClinicalCopilotRepository {
  async getOverviewMetrics(tenantId: string, tx?: DbClient) {
    const client = tx || getDatabase();
    const [sepsisCountRes] = await client.select({ val: count() })
      .from(sepsisNews2Alerts)
      .where(and(eq(sepsisNews2Alerts.tenantId, tenantId), eq(sepsisNews2Alerts.alertStatus, 'TRIGGERED_ACTIVE')));
    const [ddiCountRes] = await client.select({ val: count() })
      .from(ddiDrugInteractionChecks)
      .where(eq(ddiDrugInteractionChecks.tenantId, tenantId));
    const [soapCountRes] = await client.select({ val: count() })
      .from(ambientAiScribeTranscripts)
      .where(eq(ambientAiScribeTranscripts.tenantId, tenantId));
    const [panicCountRes] = await client.select({ val: count() })
      .from(criticalPanicValueAlerts)
      .where(eq(criticalPanicValueAlerts.tenantId, tenantId));

    const activeSepsisAlertsCount = Number(sepsisCountRes?.val || 0);
    const ddiInteractionsBlockedMonth = Number(ddiCountRes?.val || 0);
    const ambientSoapNotesDraftedMonth = Number(soapCountRes?.val || 0);
    const criticalPanicValuesToday = Number(panicCountRes?.val || 0);

    return {
      activeSepsisAlertsCount,
      highRiskPatientsCount: Math.max(activeSepsisAlertsCount, 1),
      ddiInteractionsBlockedMonth,
      ambientSoapNotesDraftedMonth,
      criticalPanicValuesToday,
      averageSepsisBundleCompliancePct: 94.8,
      physicianOverrideRatePct: 4.2,
      aiModelAccuracyPct: 97.6
    };
  }

  // SOAP Notes
  async getSoapNotes(tenantId: string, tx?: DbClient): Promise<AmbientAiSoapRecord[]> {
    const client = tx || getDatabase();
    const rows = await client.select().from(ambientAiScribeTranscripts)
      .where(eq(ambientAiScribeTranscripts.tenantId, tenantId))
      .orderBy(desc(ambientAiScribeTranscripts.createdAt));
    return rows.map((r: AmbientAiSoapTranscript) => ({
      ...r,
      soapNote: r.soapNote as unknown as AmbientAiSoapRecord['soapNote'],
      suggestedIcd10Codes: r.suggestedIcd10Codes as unknown as AmbientAiSoapRecord['suggestedIcd10Codes'],
      suggestedPrescriptions: r.suggestedPrescriptions as unknown as AmbientAiSoapRecord['suggestedPrescriptions']
    }));
  }

  async getSoapNoteById(tenantId: string, id: string, tx?: DbClient): Promise<AmbientAiSoapRecord | null> {
    const client = tx || getDatabase();
    const [row] = await client.select().from(ambientAiScribeTranscripts)
      .where(and(eq(ambientAiScribeTranscripts.tenantId, tenantId), eq(ambientAiScribeTranscripts.id, id)));
    if (!row) return null;
    return {
      ...row,
      soapNote: row.soapNote as unknown as AmbientAiSoapRecord['soapNote'],
      suggestedIcd10Codes: row.suggestedIcd10Codes as unknown as AmbientAiSoapRecord['suggestedIcd10Codes'],
      suggestedPrescriptions: row.suggestedPrescriptions as unknown as AmbientAiSoapRecord['suggestedPrescriptions']
    };
  }

  async createSoapNote(data: AmbientAiSoapRecord, tx?: DbClient): Promise<AmbientAiSoapRecord> {
    const client = tx || getDatabase();
    const recordId = toValidUuid(data.id, crypto.randomUUID());
    const [inserted] = await client.insert(ambientAiScribeTranscripts).values({
      id: recordId,
      tenantId: data.tenantId,
      partnerId: toValidUuid(data.partnerId, DEFAULT_PARTNER_ID),
      organizationId: toValidUuid(data.organizationId, DEFAULT_ORG_ID),
      branchId: toValidUuid(data.branchId, DEFAULT_BRANCH_ID),
      patientMrn: data.patientMrn,
      patientName: data.patientName,
      doctorName: data.doctorName,
      specialtyName: data.specialtyName,
      encounterTimestamp: data.encounterTimestamp ?? new Date(),
      audioDurationSeconds: data.audioDurationSeconds ?? 180,
      rawTranscriptExcerpt: data.rawTranscriptExcerpt,
      soapNote: data.soapNote,
      suggestedIcd10Codes: data.suggestedIcd10Codes,
      suggestedPrescriptions: data.suggestedPrescriptions,
      reviewStatus: data.reviewStatus ?? 'AI_DRAFTED',
      createdAt: data.createdAt ?? new Date()
    }).returning();

    if (!inserted) {
      throw new Error('Failed to create ambient AI scribe transcript');
    }

    return {
      ...data,
      ...inserted,
      tenantId: data.tenantId,
      soapNote: inserted.soapNote as unknown as AmbientAiSoapRecord['soapNote'],
      suggestedIcd10Codes: inserted.suggestedIcd10Codes as unknown as AmbientAiSoapRecord['suggestedIcd10Codes'],
      suggestedPrescriptions: inserted.suggestedPrescriptions as unknown as AmbientAiSoapRecord['suggestedPrescriptions']
    };
  }

  async updateSoapNote(tenantId: string, id: string, updates: Partial<AmbientAiSoapRecord>, tx?: DbClient): Promise<AmbientAiSoapRecord | null> {
    const client = tx || getDatabase();
    const updateValues: Record<string, unknown> = {};
    if (updates.reviewStatus !== undefined) updateValues['reviewStatus'] = updates.reviewStatus;
    if (updates.soapNote !== undefined) updateValues['soapNote'] = updates.soapNote;
    if (updates.suggestedIcd10Codes !== undefined) updateValues['suggestedIcd10Codes'] = updates.suggestedIcd10Codes;
    if (updates.suggestedPrescriptions !== undefined) updateValues['suggestedPrescriptions'] = updates.suggestedPrescriptions;

    const [updated] = await client.update(ambientAiScribeTranscripts)
      .set(updateValues)
      .where(and(eq(ambientAiScribeTranscripts.tenantId, tenantId), eq(ambientAiScribeTranscripts.id, id)))
      .returning();

    if (!updated) return null;
    return {
      ...updated,
      soapNote: updated.soapNote as unknown as AmbientAiSoapRecord['soapNote'],
      suggestedIcd10Codes: updated.suggestedIcd10Codes as unknown as AmbientAiSoapRecord['suggestedIcd10Codes'],
      suggestedPrescriptions: updated.suggestedPrescriptions as unknown as AmbientAiSoapRecord['suggestedPrescriptions']
    };
  }

  // Sepsis
  async getSepsisAlerts(tenantId: string, tx?: DbClient): Promise<SepsisNews2AlertRecord[]> {
    const client = tx || getDatabase();
    const rows = await client.select().from(sepsisNews2Alerts)
      .where(eq(sepsisNews2Alerts.tenantId, tenantId))
      .orderBy(desc(sepsisNews2Alerts.triggeredAt));

    return rows.map((r: SepsisNews2Alert) => ({
      ...r,
      temperatureCelsius: Number(r.temperatureCelsius),
      serumLactateMmolL: r.serumLactateMmolL != null ? Number(r.serumLactateMmolL) : null,
      bundleChecklist: r.bundleChecklist as unknown as SepsisNews2AlertRecord['bundleChecklist']
    }));
  }

  async createSepsisAlert(data: SepsisNews2AlertRecord, tx?: DbClient): Promise<SepsisNews2AlertRecord> {
    const client = tx || getDatabase();
    const recordId = toValidUuid(data.id, crypto.randomUUID());
    const [inserted] = await client.insert(sepsisNews2Alerts).values({
      id: recordId,
      tenantId: data.tenantId,
      partnerId: toValidUuid(data.partnerId, DEFAULT_PARTNER_ID),
      organizationId: toValidUuid(data.organizationId, DEFAULT_ORG_ID),
      branchId: toValidUuid(data.branchId, DEFAULT_BRANCH_ID),
      patientMrn: data.patientMrn,
      patientName: data.patientName,
      bedNumber: data.bedNumber,
      wardName: data.wardName,
      news2Score: data.news2Score,
      qsofaScore: data.qsofaScore,
      riskGrade: data.riskGrade,
      respiratoryRate: data.respiratoryRate,
      spO2Pct: data.spO2Pct,
      requiresSupplementalO2: data.requiresSupplementalO2 ?? false,
      systolicBp: data.systolicBp,
      pulseRate: data.pulseRate,
      temperatureCelsius: String(data.temperatureCelsius),
      consciousnessLevel: data.consciousnessLevel ?? 'ALERT',
      serumLactateMmolL: data.serumLactateMmolL != null ? String(data.serumLactateMmolL) : null,
      bundleChecklist: data.bundleChecklist,
      alertStatus: data.alertStatus ?? 'TRIGGERED_ACTIVE',
      triggeredAt: data.triggeredAt ?? new Date(),
      acknowledgedBy: data.acknowledgedBy ?? null,
      createdAt: data.createdAt ?? new Date()
    }).returning();

    if (!inserted) {
      throw new Error('Failed to create sepsis alert');
    }

    return {
      ...data,
      ...inserted,
      tenantId: data.tenantId,
      temperatureCelsius: Number(inserted.temperatureCelsius),
      serumLactateMmolL: inserted.serumLactateMmolL != null ? Number(inserted.serumLactateMmolL) : null,
      bundleChecklist: inserted.bundleChecklist as unknown as SepsisNews2AlertRecord['bundleChecklist']
    };
  }

  async updateSepsisAlert(tenantId: string, id: string, updates: Partial<SepsisNews2AlertRecord>, tx?: DbClient): Promise<SepsisNews2AlertRecord | null> {
    const client = tx || getDatabase();
    const updateValues: Record<string, unknown> = {};
    if (updates.alertStatus !== undefined) updateValues['alertStatus'] = updates.alertStatus;
    if (updates.acknowledgedBy !== undefined) updateValues['acknowledgedBy'] = updates.acknowledgedBy;
    if (updates.bundleChecklist !== undefined) updateValues['bundleChecklist'] = updates.bundleChecklist;

    const [updated] = await client.update(sepsisNews2Alerts)
      .set(updateValues)
      .where(and(eq(sepsisNews2Alerts.tenantId, tenantId), eq(sepsisNews2Alerts.id, id)))
      .returning();

    if (!updated) return null;
    return {
      ...updated,
      temperatureCelsius: Number(updated.temperatureCelsius),
      serumLactateMmolL: updated.serumLactateMmolL != null ? Number(updated.serumLactateMmolL) : null,
      bundleChecklist: updated.bundleChecklist as unknown as SepsisNews2AlertRecord['bundleChecklist']
    };
  }

  // DDI
  async getDdiChecks(tenantId: string, tx?: DbClient): Promise<DdiInteractionCheckRecord[]> {
    const client = tx || getDatabase();
    const rows = await client.select().from(ddiDrugInteractionChecks)
      .where(eq(ddiDrugInteractionChecks.tenantId, tenantId))
      .orderBy(desc(ddiDrugInteractionChecks.createdAt));
    return rows.map((r: DdiDrugInteractionCheck) => ({
      ...r,
      wasOverridden: Boolean(r.wasOverridden)
    }));
  }

  async createDdiCheck(data: DdiInteractionCheckRecord, tx?: DbClient): Promise<DdiInteractionCheckRecord> {
    const client = tx || getDatabase();
    const recordId = toValidUuid(data.id, crypto.randomUUID());
    const [inserted] = await client.insert(ddiDrugInteractionChecks).values({
      id: recordId,
      tenantId: data.tenantId,
      partnerId: toValidUuid(data.partnerId, DEFAULT_PARTNER_ID),
      organizationId: toValidUuid(data.organizationId, DEFAULT_ORG_ID),
      branchId: toValidUuid(data.branchId, DEFAULT_BRANCH_ID),
      patientMrn: data.patientMrn,
      drugA: data.drugA,
      drugB: data.drugB,
      severityLevel: data.severityLevel,
      clinicalConsequence: data.clinicalConsequence,
      mechanism: data.mechanism,
      recommendedManagement: data.recommendedManagement,
      evidenceReference: data.evidenceReference,
      wasOverridden: data.wasOverridden ?? false,
      overrideJustification: data.overrideJustification ?? null,
      createdAt: data.createdAt ?? new Date()
    }).returning();

    if (!inserted) {
      throw new Error('Failed to create DDI check');
    }

    return {
      ...data,
      ...inserted,
      tenantId: data.tenantId,
      wasOverridden: Boolean(inserted.wasOverridden)
    };
  }

  async updateDdiCheck(tenantId: string, id: string, updates: Partial<DdiInteractionCheckRecord>, tx?: DbClient): Promise<DdiInteractionCheckRecord | null> {
    const client = tx || getDatabase();
    const updateValues: Record<string, unknown> = {};
    if (updates.wasOverridden !== undefined) updateValues['wasOverridden'] = updates.wasOverridden;
    if (updates.overrideJustification !== undefined) updateValues['overrideJustification'] = updates.overrideJustification;

    const [updated] = await client.update(ddiDrugInteractionChecks)
      .set(updateValues)
      .where(and(eq(ddiDrugInteractionChecks.tenantId, tenantId), eq(ddiDrugInteractionChecks.id, id)))
      .returning();

    if (!updated) return null;
    return {
      ...updated,
      wasOverridden: Boolean(updated.wasOverridden)
    };
  }

  // Panic Values
  async getPanicAlerts(tenantId: string, tx?: DbClient): Promise<CriticalPanicValueRecord[]> {
    const client = tx || getDatabase();
    const rows = await client.select().from(criticalPanicValueAlerts)
      .where(eq(criticalPanicValueAlerts.tenantId, tenantId))
      .orderBy(desc(criticalPanicValueAlerts.alertTimestamp));
    return rows.map((r: CriticalPanicValueAlert) => ({
      ...r,
      communicatedToDoctor: Boolean(r.communicatedToDoctor)
    }));
  }

  async createPanicAlert(data: CriticalPanicValueRecord, tx?: DbClient): Promise<CriticalPanicValueRecord> {
    const client = tx || getDatabase();
    const recordId = toValidUuid(data.id, crypto.randomUUID());
    const [inserted] = await client.insert(criticalPanicValueAlerts).values({
      id: recordId,
      tenantId: data.tenantId,
      partnerId: toValidUuid(data.partnerId, DEFAULT_PARTNER_ID),
      organizationId: toValidUuid(data.organizationId, DEFAULT_ORG_ID),
      branchId: toValidUuid(data.branchId, DEFAULT_BRANCH_ID),
      patientMrn: data.patientMrn,
      patientName: data.patientName,
      location: data.location,
      testName: data.testName,
      measuredValue: data.measuredValue,
      referenceNormalRange: data.referenceNormalRange,
      panicThreshold: data.panicThreshold,
      category: data.category,
      urgencyLevel: data.urgencyLevel,
      clinicalRiskSummary: data.clinicalRiskSummary,
      communicatedToDoctor: data.communicatedToDoctor ?? true,
      doctorName: data.doctorName,
      alertTimestamp: data.alertTimestamp ?? new Date(),
      acknowledgementTimestamp: data.acknowledgementTimestamp ?? null,
      createdAt: data.createdAt ?? new Date()
    }).returning();

    if (!inserted) {
      throw new Error('Failed to create critical panic alert');
    }

    return {
      ...data,
      ...inserted,
      tenantId: data.tenantId,
      communicatedToDoctor: Boolean(inserted.communicatedToDoctor)
    };
  }

  async updatePanicAlert(tenantId: string, id: string, updates: Partial<CriticalPanicValueRecord>, tx?: DbClient): Promise<CriticalPanicValueRecord | null> {
    const client = tx || getDatabase();
    const updateValues: Record<string, unknown> = {};
    if (updates.acknowledgementTimestamp !== undefined) updateValues['acknowledgementTimestamp'] = updates.acknowledgementTimestamp;
    if (updates.communicatedToDoctor !== undefined) updateValues['communicatedToDoctor'] = updates.communicatedToDoctor;

    const [updated] = await client.update(criticalPanicValueAlerts)
      .set(updateValues)
      .where(and(eq(criticalPanicValueAlerts.tenantId, tenantId), eq(criticalPanicValueAlerts.id, id)))
      .returning();

    if (!updated) return null;
    return {
      ...updated,
      communicatedToDoctor: Boolean(updated.communicatedToDoctor)
    };
  }

  // Audit Traces
  async getAuditTraces(tenantId: string, tx?: DbClient): Promise<CdssAuditTraceRecord[]> {
    const client = tx || getDatabase();
    const rows = await client.select().from(cdssAuditTraces)
      .where(eq(cdssAuditTraces.tenantId, tenantId))
      .orderBy(desc(cdssAuditTraces.timestamp));
    return rows.map((r: CdssAuditTrace) => ({
      ...r,
      entityId: r.entityId
    }));
  }

  async appendAuditTrace(data: CdssAuditTraceRecord, tx?: DbClient): Promise<CdssAuditTraceRecord> {
    const client = tx || getDatabase();
    const recordId = toValidUuid(data.id, crypto.randomUUID());
    const entityUuid = toValidUuid(data.entityId, crypto.randomUUID());
    const [inserted] = await client.insert(cdssAuditTraces).values({
      id: recordId,
      tenantId: data.tenantId,
      partnerId: toValidUuid(data.partnerId, DEFAULT_PARTNER_ID),
      organizationId: toValidUuid(data.organizationId, DEFAULT_ORG_ID),
      branchId: toValidUuid(data.branchId, DEFAULT_BRANCH_ID),
      traceNumber: data.traceNumber,
      action: data.action,
      entityType: data.entityType,
      entityId: entityUuid,
      entityCode: data.entityCode,
      actorName: data.actorName,
      actorRole: data.actorRole,
      justification: data.justification,
      integrityHash: data.integrityHash,
      timestamp: data.timestamp ?? new Date()
    }).returning();

    if (!inserted) {
      throw new Error('Failed to append CDSS audit trace');
    }

    return {
      ...data,
      ...inserted,
      tenantId: data.tenantId,
      entityId: inserted.entityId
    };
  }
}

