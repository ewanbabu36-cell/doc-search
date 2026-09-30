import crypto from 'node:crypto';
import { getDatabase, aiAnomalyDetections, auditEvents, eq, and, desc } from '@docsearch/database';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import type { SessionContext } from '@docsearch/auth';

export interface RecordAnomalyInput {
  domain: 'CLINICAL' | 'LAB' | 'PHARMACY' | 'BILLING' | 'INVENTORY' | 'SECURITY' | 'OPERATIONS';
  title: string;
  description: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectionType: string;
  explanation: string;
  confidenceScore?: string;
  recommendation?: string;
  dataSnapshot?: Record<string, unknown>;
  branchId?: string;
}

export interface ReviewAnomalyInput {
  action: 'CONFIRM' | 'OVERRIDE' | 'DISMISS' | 'ACKNOWLEDGE';
  reviewRemarks: string;
}

export class ExplainableAiAndAnomalyService {
  private get db() {
    return getDatabase();
  }

  private isUuid(val?: string | null): boolean {
    return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
  }

  private toUuid(val: string): string {
    if (this.isUuid(val)) return val.trim();
    const hash = crypto.createHash('sha256').update(String(val || 'system')).digest('hex');
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
  }

  /**
   * Records an anomaly with full explainability metadata.
   */
  async detectAndRecordAnomaly(
    session: SessionContext,
    input: RecordAnomalyInput
  ) {
    const tenantId = this.toUuid(session.tenantId);
    const rawBranchId = input.branchId || session.branchId;
    const safeBranchId = rawBranchId && this.isUuid(rawBranchId) ? rawBranchId : null;
    const anomalyCode = `ANM-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const confidenceScore = input.confidenceScore || '0.95';
    const prefixLabel = 'ANOMALY DETECTED — HUMAN REVIEW REQUIRED';

    const [recorded] = await this.db
      .insert(aiAnomalyDetections)
      .values({
        id: crypto.randomUUID(),
        tenantId,
        branchId: safeBranchId,
        anomalyCode,
        domain: input.domain,
        title: input.title,
        description: input.description,
        severity: input.severity,
        detectionType: input.detectionType,
        explanation: input.explanation,
        confidenceScore,
        prefixLabel,
        dataSnapshot: input.dataSnapshot || {},
        recommendation: input.recommendation,
        humanReviewStatus: 'PENDING'
      })
      .returning();

    if (!recorded) {
      throw new AppError({
        message: 'Failed to record anomaly detection.',
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        statusCode: 500
      });
    }

    // Tamper-evident audit trace
    await this.db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      tenantId,
      branchId: safeBranchId,
      actorId: this.toUuid(session.userId || 'AI_MONITOR'),
      eventType: 'AI_ANOMALY_RECORDED',
      resourceType: 'AI_ANOMALY',
      resourceId: recorded.id,
      metadata: {
        anomalyCode,
        rawActorId: session.userId || 'AI_MONITOR',
        domain: input.domain,
        detectionType: input.detectionType,
        severity: input.severity,
        confidenceScore
      },
      integrityHash: crypto.createHash('sha256').update(recorded.id).digest('hex')
    });

    return recorded;
  }

  /**
   * Helper: Runs a deterministic Lab Delta Check between current value and previous value.
   */
  async evaluateLabDeltaCheck(
    session: SessionContext,
    params: {
      patientMrn: string;
      testName: string;
      currentValue: number;
      previousValue: number;
      unit: string;
      hoursApart: number;
    }
  ) {
    const delta = Math.abs(params.currentValue - params.previousValue);
    const percentChange = Math.round((delta / Math.max(params.previousValue, 0.001)) * 100);

    // Delta alert threshold: >= 50% shift within 48 hours for vital renal/electrolyte markers
    const isSignificant = percentChange >= 50 && params.hoursApart <= 48;

    if (isSignificant) {
      return await this.detectAndRecordAnomaly(session, {
        domain: 'LAB',
        title: `Delta Check Failure: Acute shift in ${params.testName}`,
        description: `${params.testName} shifted from ${params.previousValue} to ${params.currentValue} ${params.unit} (${percentChange}% change in ${params.hoursApart} hrs).`,
        severity: percentChange >= 100 ? 'CRITICAL' : 'HIGH',
        detectionType: 'LAB_DELTA_CHECK',
        confidenceScore: '0.98',
        explanation: `Historical baseline comparison identified a ${percentChange}% variation exceeding the 50% biological delta threshold within ${params.hoursApart} hours. Potential acute clinical deterioration or pre-analytical sample hemolyzation/mix-up.`,
        recommendation: 'Verify sample accession barcode and redraw STAT before escalating clinical intervention.',
        dataSnapshot: params
      });
    }

    return null;
  }

  /**
   * Helper: Evaluates Pharmacy Stock Leakage / Discrepancy.
   */
  async evaluatePharmacyStockDiscrepancy(
    session: SessionContext,
    params: {
      medicationName: string;
      batchNumber: string;
      systemQuantity: number;
      physicalQuantity: number;
      varianceValueInr: number;
    }
  ) {
    const variance = params.physicalQuantity - params.systemQuantity;
    if (variance < 0) {
      return await this.detectAndRecordAnomaly(session, {
        domain: 'PHARMACY',
        title: `Stock Discrepancy: Missing physical inventory for ${params.medicationName}`,
        description: `Physical count (${params.physicalQuantity}) is lower than system balance (${params.systemQuantity}) by ${Math.abs(variance)} units (₹${params.varianceValueInr}).`,
        severity: Math.abs(params.varianceValueInr) > 1000 ? 'HIGH' : 'MEDIUM',
        detectionType: 'STOCK_LEAKAGE',
        confidenceScore: '0.99',
        explanation: `Physical cycle count revealed an unaccounted shrinkage of ${Math.abs(variance)} units from batch ${params.batchNumber}. Discrepancy exceeds standard dispensary tolerance.`,
        recommendation: 'Conduct dispensary stock audit and review dispensing CCTV / batch movement logs.',
        dataSnapshot: params
      });
    }
    return null;
  }

  /**
   * Human review workflow: Acknowledge, Confirm, Override, or Dismiss an anomaly.
   */
  async reviewAnomaly(
    session: SessionContext,
    anomalyId: string,
    input: ReviewAnomalyInput
  ) {
    const tenantId = this.toUuid(session.tenantId);

    if (!input.reviewRemarks || input.reviewRemarks.trim().length < 5) {
      throw new AppError({
        message: 'Review remarks of at least 5 characters are mandatory for clinical/operational anomaly governance.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    if (!this.isUuid(anomalyId)) {
      throw new AppError({
        message: 'Anomaly detection record not found or cross-tenant boundary prohibited.',
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const [existing] = await this.db
      .select()
      .from(aiAnomalyDetections)
      .where(and(eq(aiAnomalyDetections.id, anomalyId), eq(aiAnomalyDetections.tenantId, tenantId)))
      .limit(1);

    if (!existing) {
      throw new AppError({
        message: 'Anomaly detection record not found or cross-tenant boundary prohibited.',
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const [updated] = await this.db
      .update(aiAnomalyDetections)
      .set({
        humanReviewStatus: input.action,
        reviewedBy: session.userId || 'AUTHORIZED_HUMAN',
        reviewRemarks: input.reviewRemarks,
        reviewedAt: new Date()
      })
      .where(eq(aiAnomalyDetections.id, anomalyId))
      .returning();

    // Audit human sign-off
    await this.db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      tenantId,
      branchId: existing.branchId && this.isUuid(existing.branchId) ? existing.branchId : null,
      actorId: this.toUuid(session.userId || 'AUTHORIZED_HUMAN'),
      eventType: `AI_ANOMALY_${input.action}`,
      resourceType: 'AI_ANOMALY',
      resourceId: anomalyId,
      metadata: {
        anomalyCode: existing.anomalyCode,
        rawActorId: session.userId || 'AUTHORIZED_HUMAN',
        action: input.action,
        remarks: input.reviewRemarks
      },
      integrityHash: crypto.createHash('sha256').update(anomalyId + ':' + input.action).digest('hex')
    });

    return updated;
  }

  /**
   * Lists anomalies for the partner's tenant.
   */
  async listAnomalies(session: SessionContext, filter?: { domain?: string; status?: string }) {
    const records = await this.db
      .select()
      .from(aiAnomalyDetections)
      .where(eq(aiAnomalyDetections.tenantId, session.tenantId))
      .orderBy(desc(aiAnomalyDetections.detectedAt));

    return records.filter((r) => {
      if (filter?.domain && r.domain !== filter.domain) return false;
      if (filter?.status && r.humanReviewStatus !== filter.status) return false;
      return true;
    });
  }
}

export const explainableAiAndAnomalyService = new ExplainableAiAndAnomalyService();
