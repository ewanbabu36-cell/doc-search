import crypto from 'node:crypto';
import { getDatabase, aiIncidents, auditEvents, eq, desc } from '@docsearch/database';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import type { SessionContext } from '@docsearch/auth';

export type AiIncidentType =
  | 'HALLUCINATION'
  | 'PROMPT_INJECTION'
  | 'BIAS_DRIFT'
  | 'PRIVACY_BREACH'
  | 'SAFETY_VIOLATION'
  | 'REGULATORY_BREACH';

export interface ReportAiIncidentInput {
  incidentType: AiIncidentType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  model?: string;
  promptTemplate?: string;
  description: string;
}

export interface ConductAiRcaInput {
  rootCause: string;
}

export interface AssignAiCapaInput {
  capaAction: string;
  preventiveMeasure: string;
  capaId?: string;
}

export class AiIncidentAndCapaService {
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
   * 1. Reports a new AI governance incident.
   */
  async reportIncident(session: SessionContext, input: ReportAiIncidentInput) {
    const tenantId = this.toUuid(session.tenantId);
    const safeBranchId = session.branchId && this.isUuid(session.branchId) ? session.branchId : null;
    const incidentCode = `AI-INC-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    if (!input.description || input.description.trim().length < 10) {
      throw new AppError({
        message: 'A descriptive incident summary of at least 10 characters is required for AI governance.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    const [created] = await this.db
      .insert(aiIncidents)
      .values({
        id: crypto.randomUUID(),
        tenantId,
        incidentCode,
        incidentType: input.incidentType,
        severity: input.severity,
        status: 'OPEN',
        model: input.model || 'UNKNOWN',
        promptTemplate: input.promptTemplate,
        description: input.description,
        reportedBy: session.userId || 'AI_MONITOR',
        reportedAt: new Date()
      })
      .returning();

    if (!created) {
      throw new AppError({
        message: 'Failed to record AI incident',
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        statusCode: 500
      });
    }

    await this.db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      tenantId,
      branchId: safeBranchId,
      actorId: this.toUuid(session.userId || 'AI_MONITOR'),
      eventType: 'AI_INCIDENT_REPORTED',
      resourceType: 'AI_INCIDENT',
      resourceId: created.id,
      metadata: {
        incidentCode,
        rawActorId: session.userId || 'AI_MONITOR',
        incidentType: input.incidentType,
        severity: input.severity
      },
      integrityHash: crypto.createHash('sha256').update(created.id).digest('hex')
    });

    return created;
  }

  /**
   * 2. Conducts Root Cause Analysis (RCA) on the AI incident.
   */
  async conductRca(session: SessionContext, incidentId: string, input: ConductAiRcaInput) {
    const tenantId = this.toUuid(session.tenantId);
    const safeBranchId = session.branchId && this.isUuid(session.branchId) ? session.branchId : null;
    const incident = await this.getIncidentOrThrow(tenantId, incidentId, session.isSuperAdmin);

    if (!input.rootCause || input.rootCause.trim().length < 10) {
      throw new AppError({
        message: 'Root Cause Analysis documentation of at least 10 characters is mandatory.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    const [updated] = await this.db
      .update(aiIncidents)
      .set({
        rootCause: input.rootCause,
        status: 'RCA_COMPLETED'
      })
      .where(eq(aiIncidents.id, incident.id))
      .returning();

    await this.db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      tenantId: incident.tenantId,
      branchId: safeBranchId,
      actorId: this.toUuid(session.userId || 'AI_MONITOR'),
      eventType: 'AI_INCIDENT_RCA_CONDUCTED',
      resourceType: 'AI_INCIDENT',
      resourceId: incident.id,
      metadata: { incidentCode: incident.incidentCode, rawActorId: session.userId || 'AI_MONITOR' },
      integrityHash: crypto.createHash('sha256').update(incident.id + ':rca').digest('hex')
    });

    return updated;
  }

  /**
   * 3. Assigns Corrective & Preventive Action (CAPA) linked to the Phase 14 enterprise CAPA engine.
   */
  async assignCapa(session: SessionContext, incidentId: string, input: AssignAiCapaInput) {
    const tenantId = this.toUuid(session.tenantId);
    const safeBranchId = session.branchId && this.isUuid(session.branchId) ? session.branchId : null;
    const incident = await this.getIncidentOrThrow(tenantId, incidentId, session.isSuperAdmin);

    if (!input.capaAction || !input.preventiveMeasure) {
      throw new AppError({
        message: 'Both CAPA action and preventive measure documentation are required.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    const safeCapaId = input.capaId ? this.toUuid(input.capaId) : null;

    const [updated] = await this.db
      .update(aiIncidents)
      .set({
        capaAction: input.capaAction,
        preventiveMeasure: input.preventiveMeasure,
        capaId: safeCapaId,
        status: 'CAPA_ASSIGNED'
      })
      .where(eq(aiIncidents.id, incident.id))
      .returning();

    await this.db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      tenantId: incident.tenantId,
      branchId: safeBranchId,
      actorId: this.toUuid(session.userId || 'AI_MONITOR'),
      eventType: 'AI_INCIDENT_CAPA_ASSIGNED',
      resourceType: 'AI_INCIDENT',
      resourceId: incident.id,
      metadata: { incidentCode: incident.incidentCode, rawActorId: session.userId || 'AI_MONITOR' },
      integrityHash: crypto.createHash('sha256').update(incident.id + ':capa').digest('hex')
    });

    return updated;
  }

  /**
   * 4. Verifies corrective controls and closes the incident.
   */
  async verifyAndClose(session: SessionContext, incidentId: string) {
    const tenantId = this.toUuid(session.tenantId);
    const safeBranchId = session.branchId && this.isUuid(session.branchId) ? session.branchId : null;
    const incident = await this.getIncidentOrThrow(tenantId, incidentId, session.isSuperAdmin);

    if (incident.status !== 'CAPA_ASSIGNED') {
      throw new AppError({
        message: `Incident cannot be closed before CAPA assignment. Current status: ${incident.status}`,
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }

    const [updated] = await this.db
      .update(aiIncidents)
      .set({
        status: 'CLOSED',
        resolvedBy: session.userId || 'AI_SAFETY_OFFICER',
        resolvedAt: new Date()
      })
      .where(eq(aiIncidents.id, incident.id))
      .returning();

    await this.db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      tenantId: incident.tenantId,
      branchId: safeBranchId,
      actorId: this.toUuid(session.userId || 'AI_SAFETY_OFFICER'),
      eventType: 'AI_INCIDENT_CLOSED',
      resourceType: 'AI_INCIDENT',
      resourceId: incident.id,
      metadata: { incidentCode: incident.incidentCode, rawActorId: session.userId || 'AI_SAFETY_OFFICER' },
      integrityHash: crypto.createHash('sha256').update(incident.id + ':closed').digest('hex')
    });

    return updated;
  }

  /**
   * Lists incidents for tenant or HQ.
   */
  async listIncidents(session: SessionContext) {
    if (session.isSuperAdmin) {
      return await this.db
        .select()
        .from(aiIncidents)
        .orderBy(desc(aiIncidents.reportedAt))
        .limit(50);
    }
    return await this.db
      .select()
      .from(aiIncidents)
      .where(eq(aiIncidents.tenantId, this.toUuid(session.tenantId)))
      .orderBy(desc(aiIncidents.reportedAt))
      .limit(50);
  }

  private async getIncidentOrThrow(tenantId: string, incidentId: string, isSuperAdmin?: boolean) {
    if (!this.isUuid(incidentId)) {
      throw new AppError({
        message: 'AI incident record not found.',
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const [found] = await this.db
      .select()
      .from(aiIncidents)
      .where(eq(aiIncidents.id, incidentId))
      .limit(1);

    if (!found) {
      throw new AppError({
        message: 'AI incident record not found.',
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    if (!isSuperAdmin && found.tenantId !== tenantId) {
      throw new AppError({
        message: 'Cross-tenant incident access prohibited.',
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    return found;
  }
}

export const aiIncidentAndCapaService = new AiIncidentAndCapaService();
