import crypto from 'node:crypto';
import {
  getDatabase,
  hospitalIncidentReports,
  incidentRcaInvestigations,
  qualityCapaActions,
  desc,
  eq,
  and
} from '@docsearch/database';
import { type SessionContext, ScopeGuard } from '@docsearch/auth';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import { auditRepository } from '../../repositories/core/AuditRepository.js';

export interface ReportIncidentInput {
  category: string;
  sacScore?: string | undefined; // SAC_1_EXTREME, SAC_2_HIGH, SAC_3_MODERATE, SAC_4_LOW
  briefSummary: string;
  detailedDescription: string;
  immediateActionTaken: string;
  departmentName: string;
  locationDetail: string;
  incidentDateTime?: Date | undefined;
  patientInvolved?: boolean | undefined;
  patientMrn?: string | undefined;
  patientName?: string | undefined;
  patientHarmLevel?: string | undefined;
  isSentinelEvent?: boolean | undefined;
  branchId?: string | undefined;
}

export interface ConductRcaInput {
  leadInvestigator: string;
  investigationTeam: string[];
  fiveWhysAnalysis: { step: number; whyQuestion: string; becauseAnswer: string }[];
  fishboneCategories: {
    people: string[];
    process: string[];
    equipment: string[];
    environment: string[];
    management: string[];
  };
  rootCauseStatement: string;
  contributingFactors: string;
}

export interface AssignCapaInput {
  title: string;
  actionDescription: string;
  actionType: 'CORRECTIVE' | 'PREVENTIVE';
  assignedOwner: string;
  targetCompletionDate: string;
  verificationMetric: string;
}

export class IncidentCapaService {
  /**
   * Reports an operational, clinical, or security incident with SAC score risk matrix.
   */
  async reportIncident(
    input: ReportIncidentInput,
    session: SessionContext,
    db = getDatabase()
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const tenantId = scope.tenantId;
    const branchId = input.branchId || scope.branchId || '11111111-1111-4111-8111-111111111111';

    const incidentNumber = `INC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const reportedByStaff = session.actorEmail || session.userId || 'STAFF';
    const reportedByRole = (session.roles && session.roles[0]) || 'CLINICAL_STAFF';

    const [incident] = await db
      .insert(hospitalIncidentReports)
      .values({
        id: crypto.randomUUID(),
        tenantId,
        partnerId: tenantId,
        organizationId: tenantId,
        branchId,
        incidentNumber,
        category: input.category,
        sacScore: input.sacScore || 'SAC_3_MODERATE',
        status: 'REPORTED',
        patientInvolved: Boolean(input.patientInvolved),
        patientMrn: input.patientMrn || null,
        patientName: input.patientName || null,
        departmentName: input.departmentName,
        locationDetail: input.locationDetail,
        incidentDateTime: input.incidentDateTime || new Date(),
        reportedByStaff,
        reportedByRole,
        briefSummary: input.briefSummary,
        detailedDescription: input.detailedDescription,
        immediateActionTaken: input.immediateActionTaken,
        patientHarmLevel: input.patientHarmLevel || 'NO_HARM_NEAR_MISS',
        isSentinelEvent: Boolean(input.isSentinelEvent),
        rcaRequired: input.sacScore === 'SAC_1_EXTREME' || input.sacScore === 'SAC_2_HIGH' || Boolean(input.isSentinelEvent)
      })
      .returning();

    if (!incident) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Failed to record incident report.',
        statusCode: 500
      });
    }

    await auditRepository.recordEvent({
      eventType: 'INCIDENT_REPORTED',
      resourceType: 'hospital_incident',
      resourceId: incident.id,
      tenantId,
      branchId,
      metadata: {
        incidentNumber,
        category: input.category,
        sacScore: incident.sacScore,
        isSentinelEvent: incident.isSentinelEvent
      }
    }, session, db);

    return incident;
  }

  /**
   * Lists incidents scoped to tenant with optional status/category filter.
   */
  async getIncidents(
    filter: { status?: string | undefined; category?: string | undefined; limit?: number | undefined },
    session: SessionContext,
    db = getDatabase()
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const conditions = [eq(hospitalIncidentReports.tenantId, scope.tenantId)];

    if (filter.status) {
      conditions.push(eq(hospitalIncidentReports.status, filter.status));
    }
    if (filter.category) {
      conditions.push(eq(hospitalIncidentReports.category, filter.category));
    }

    const limit = Math.min(filter.limit || 50, 100);

    return db
      .select()
      .from(hospitalIncidentReports)
      .where(and(...conditions))
      .orderBy(desc(hospitalIncidentReports.createdAt))
      .limit(limit);
  }

  /**
   * Retrieves an incident along with its linked RCA investigation and CAPA actions.
   */
  async getIncidentDetails(incidentId: string, session: SessionContext, db = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);

    const [incident] = await db
      .select()
      .from(hospitalIncidentReports)
      .where(
        and(
          eq(hospitalIncidentReports.id, incidentId),
          eq(hospitalIncidentReports.tenantId, scope.tenantId)
        )
      )
      .limit(1);

    if (!incident) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: 'Incident not found in tenant scope.',
        statusCode: 404
      });
    }

    const rcas = await db
      .select()
      .from(incidentRcaInvestigations)
      .where(
        and(
          eq(incidentRcaInvestigations.incidentId, incidentId),
          eq(incidentRcaInvestigations.tenantId, scope.tenantId)
        )
      );

    const capas = await db
      .select()
      .from(qualityCapaActions)
      .where(
        and(
          eq(qualityCapaActions.incidentId, incidentId),
          eq(qualityCapaActions.tenantId, scope.tenantId)
        )
      )
      .orderBy(desc(qualityCapaActions.createdAt));

    return {
      incident,
      rca: rcas[0] || null,
      capaActions: capas
    };
  }

  /**
   * Conducts a structured Root Cause Analysis (5-Whys and Fishbone) for an incident.
   */
  async conductRca(
    incidentId: string,
    input: ConductRcaInput,
    session: SessionContext,
    db = getDatabase()
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);

    const [incident] = await db
      .select()
      .from(hospitalIncidentReports)
      .where(
        and(
          eq(hospitalIncidentReports.id, incidentId),
          eq(hospitalIncidentReports.tenantId, scope.tenantId)
        )
      )
      .limit(1);

    if (!incident) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: 'Incident not found in tenant scope.',
        statusCode: 404
      });
    }

    const rcaCode = `RCA-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const [rca] = await db
      .insert(incidentRcaInvestigations)
      .values({
        id: crypto.randomUUID(),
        tenantId: scope.tenantId,
        partnerId: scope.tenantId,
        organizationId: scope.tenantId,
        branchId: incident.branchId,
        rcaCode,
        incidentId: incident.id,
        incidentNumber: incident.incidentNumber,
        leadInvestigator: input.leadInvestigator,
        investigationTeam: input.investigationTeam,
        fiveWhysAnalysis: input.fiveWhysAnalysis,
        fishboneCategories: input.fishboneCategories,
        rootCauseStatement: input.rootCauseStatement,
        contributingFactors: input.contributingFactors,
        status: 'COMPLETED',
        completedDate: new Date().toISOString()
      })
      .returning();

    if (!rca) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Failed to record RCA investigation.',
        statusCode: 500
      });
    }

    await db
      .update(hospitalIncidentReports)
      .set({ status: 'INVESTIGATING', updatedAt: new Date() })
      .where(eq(hospitalIncidentReports.id, incident.id));

    await auditRepository.recordEvent({
      eventType: 'INCIDENT_RCA_CONDUCTED',
      resourceType: 'rca_investigation',
      resourceId: rca.id,
      tenantId: scope.tenantId,
      branchId: incident.branchId,
      metadata: {
        incidentNumber: incident.incidentNumber,
        rcaCode,
        leadInvestigator: input.leadInvestigator
      }
    }, session, db);

    return rca;
  }

  /**
   * Assigns a Corrective or Preventive Action (CAPA) to an incident.
   */
  async assignCapa(
    incidentId: string,
    input: AssignCapaInput,
    session: SessionContext,
    db = getDatabase()
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);

    const [incident] = await db
      .select()
      .from(hospitalIncidentReports)
      .where(
        and(
          eq(hospitalIncidentReports.id, incidentId),
          eq(hospitalIncidentReports.tenantId, scope.tenantId)
        )
      )
      .limit(1);

    if (!incident) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: 'Incident not found in tenant scope.',
        statusCode: 404
      });
    }

    const capaCode = `CAPA-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const [capa] = await db
      .insert(qualityCapaActions)
      .values({
        id: crypto.randomUUID(),
        tenantId: scope.tenantId,
        partnerId: scope.tenantId,
        organizationId: scope.tenantId,
        branchId: incident.branchId,
        capaCode,
        incidentId: incident.id,
        incidentNumber: incident.incidentNumber,
        title: input.title,
        actionDescription: input.actionDescription,
        actionType: input.actionType,
        assignedOwner: input.assignedOwner,
        targetCompletionDate: input.targetCompletionDate,
        verificationMetric: input.verificationMetric,
        status: 'ACTIVE'
      })
      .returning();

    if (!capa) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Failed to record CAPA action.',
        statusCode: 500
      });
    }

    await db
      .update(hospitalIncidentReports)
      .set({ status: 'CAPA_ACTIVE', updatedAt: new Date() })
      .where(eq(hospitalIncidentReports.id, incident.id));

    await auditRepository.recordEvent({
      eventType: 'INCIDENT_CAPA_ASSIGNED',
      resourceType: 'capa_action',
      resourceId: capa.id,
      tenantId: scope.tenantId,
      branchId: incident.branchId,
      metadata: {
        incidentNumber: incident.incidentNumber,
        capaCode,
        actionType: input.actionType,
        assignedOwner: input.assignedOwner
      }
    }, session, db);

    return capa;
  }

  /**
   * Verifies and marks a CAPA action completed, closing the incident if all CAPAs are resolved.
   */
  async verifyCapa(
    capaId: string,
    verificationNotes: string,
    session: SessionContext,
    db = getDatabase()
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);

    const [capa] = await db
      .select()
      .from(qualityCapaActions)
      .where(
        and(
          eq(qualityCapaActions.id, capaId),
          eq(qualityCapaActions.tenantId, scope.tenantId)
        )
      )
      .limit(1);

    if (!capa) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: 'CAPA action not found in tenant scope.',
        statusCode: 404
      });
    }

    const verifiedBy = session.actorEmail || session.userId || 'QUALITY_OFFICER';
    const verifiedDate = new Date().toISOString();

    const [updatedCapa] = await db
      .update(qualityCapaActions)
      .set({
        status: 'VERIFIED',
        completedDate: verifiedDate,
        verifiedBy,
        verifiedDate,
        updatedAt: new Date()
      })
      .where(eq(qualityCapaActions.id, capa.id))
      .returning();

    if (!updatedCapa) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Failed to update CAPA action.',
        statusCode: 500
      });
    }

    // Check if other CAPAs for this incident are all completed/verified
    if (capa.incidentId) {
      const allCapas = await db
        .select({ status: qualityCapaActions.status })
        .from(qualityCapaActions)
        .where(
          and(
            eq(qualityCapaActions.incidentId, capa.incidentId),
            eq(qualityCapaActions.tenantId, scope.tenantId)
          )
        );

      const allVerified = allCapas.every((c) => c.status === 'VERIFIED');
      if (allVerified) {
        await db
          .update(hospitalIncidentReports)
          .set({ status: 'CLOSED', closedAt: new Date(), updatedAt: new Date() })
          .where(eq(hospitalIncidentReports.id, capa.incidentId));
      }
    }

    await auditRepository.recordEvent({
      eventType: 'CAPA_ACTION_VERIFIED',
      resourceType: 'capa_action',
      resourceId: capa.id,
      tenantId: scope.tenantId,
      branchId: capa.branchId,
      metadata: {
        capaCode: capa.capaCode,
        verifiedBy,
        verificationNotes
      }
    }, session, db);

    return updatedCapa;
  }
}

export const incidentCapaService = new IncidentCapaService();
