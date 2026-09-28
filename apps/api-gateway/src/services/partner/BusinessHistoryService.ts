import { getDatabase, auditEvents, encounters, consultations, operationalStaff, operationalPartners, billingPayments, eq, and, desc } from '@docsearch/database';
import { type SessionContext, RBACEvaluator } from '@docsearch/auth';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { clinicalWorkflowRepository } from '../../repositories/partner/ClinicalWorkflowRepository.js';
import { labDiagnosticsRepository } from '../../repositories/partner/LabDiagnosticsRepository.js';
import { billingManagementRepository } from '../../repositories/partner/BillingManagementRepository.js';

const logger = createLogger('business-history-service');

export type HistoryAction = 'read' | 'print' | 'export' | 'share';

export interface HistoryRequestOptions {
  action?: HistoryAction;
  includeAuditTrail?: boolean;
  format?: 'json' | 'summary';
}

export class BusinessHistoryService {
  /**
   * Retrieves complete, structured domain business history for an entity,
   * enforcing strict tenant scoping and action-level authorization.
   *
   * Action principles enforced:
   * VIEW != EDIT != DELETE != SHARE != PRINT != EXPORT
   */
  async getEntityHistory(
    entityType: string,
    entityId: string,
    session: SessionContext,
    options: HistoryRequestOptions = {}
  ) {
    const tenantId = session.tenantId;
    if (!tenantId) {
      throw AppError.forbidden('Tenant context required for business history lookup');
    }

    const requestedAction = options.action || 'read';

    // 1. Enforce Action-Level Permissions
    this.enforceHistoryActionPermission(session, entityType, requestedAction);

    const db = getDatabase();
    if (!db) {
      throw new AppError({
        message: 'Database service unavailable for business history lookup',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }

    const normType = entityType.toLowerCase().replace(/[-_]/g, '');
    let entityData: any = null;
    let timelineEvents: any[] = [];

    switch (normType) {
      case 'patient': {
        const patient = await clinicalWorkflowRepository.getPatientById(tenantId, entityId, db);
        if (!patient) {
          throw AppError.notFound(`Patient ${entityId} not found`, ErrorCode.NOT_FOUND);
        }
        const history = await clinicalWorkflowRepository.getPatientClinicalHistory(tenantId, entityId, db);
        entityData = patient;
        timelineEvents = [
          ...history.encounters.map((e: any) => ({
            eventType: 'ENCOUNTER',
            timestamp: e.createdAt,
            title: `Encounter ${e.encounterNumber || e.id}`,
            status: e.status,
            data: e
          })),
          ...history.consultations.map((c: any) => ({
            eventType: 'CONSULTATION',
            timestamp: c.createdAt,
            title: `Consultation ${c.consultationNumber || c.id}`,
            status: c.status || 'FINALIZED',
            data: c
          })),
          ...history.prescriptions.map((p: any) => ({
            eventType: 'PRESCRIPTION',
            timestamp: p.createdAt,
            title: `Prescription ${p.prescriptionNumber || p.id}`,
            status: p.status,
            data: p
          })),
          ...history.labOrders.map((l: any) => ({
            eventType: 'LAB_ORDER',
            timestamp: l.orderedAt || l.createdAt,
            title: `Lab Order ${l.orderNumber || l.id}`,
            status: l.status,
            data: l
          }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        break;
      }

      case 'encounter': {
        const [enc] = await db
          .select()
          .from(encounters)
          .where(and(eq(encounters.tenantId, tenantId), eq(encounters.id, entityId)));
        if (!enc) {
          throw AppError.notFound(`Encounter ${entityId} not found`, ErrorCode.NOT_FOUND);
        }
        entityData = enc;

        const cons = await db
          .select()
          .from(consultations)
          .where(and(eq(consultations.tenantId, tenantId), eq(consultations.encounterId, entityId)));

        timelineEvents = [
          { eventType: 'ENCOUNTER_CHECKIN', timestamp: enc.createdAt, status: (enc as any).status || 'CHECKED_IN', data: enc },
          ...cons.map((c) => ({
            eventType: 'CONSULTATION_LINKED',
            timestamp: c.createdAt,
            status: (c as any).status || 'FINALIZED',
            data: c
          }))
        ];
        break;
      }

      case 'consultation': {
        const cons = await clinicalWorkflowRepository.getConsultationById(tenantId, entityId, db);
        if (!cons) {
          throw AppError.notFound(`Consultation ${entityId} not found`, ErrorCode.NOT_FOUND);
        }
        entityData = cons;
        timelineEvents = [
          { eventType: 'CONSULTATION_CREATED', timestamp: cons.createdAt, status: 'DRAFT', data: cons },
          ...(cons.status === 'FINALIZED' || (cons.status as string) === 'COMPLETED'
            ? [{ eventType: 'CONSULTATION_FINALIZED', timestamp: cons.updatedAt, status: cons.status, data: { doctorId: cons.doctorId } }]
            : [])
        ];
        break;
      }

      case 'prescription': {
        const rx = await clinicalWorkflowRepository.getPrescriptionById(tenantId, entityId, db);
        if (!rx) {
          throw AppError.notFound(`Prescription ${entityId} not found`, ErrorCode.NOT_FOUND);
        }
        entityData = rx;
        timelineEvents = [
          { eventType: 'PRESCRIPTION_ISSUED', timestamp: rx.createdAt, status: rx.status, data: rx }
        ];
        break;
      }

      case 'laborder':
      case 'lab':
      case 'pathology': {
        const lab = await labDiagnosticsRepository.getOrderById(tenantId, entityId, db);
        if (!lab) {
          throw AppError.notFound(`Lab order ${entityId} not found`, ErrorCode.NOT_FOUND);
        }
        entityData = lab;
        timelineEvents = [
          { eventType: 'ORDER_PLACED', timestamp: lab.orderedAt || new Date(), status: 'PENDING', data: { testName: lab.testName } },
          ...(lab.specimen ? [{ eventType: 'SPECIMEN_COLLECTED', timestamp: lab.orderedAt, status: 'COLLECTED', data: { specimen: lab.specimen } }] : []),
          ...(lab.results && lab.results.length > 0 ? [{ eventType: 'RESULTS_ENTERED', timestamp: lab.orderedAt, status: 'RESULT_ENTERED', data: { results: lab.results } }] : []),
          ...(lab.status === 'VERIFIED' ? [{ eventType: 'PATHOLOGIST_VERIFIED', timestamp: (lab as any).updatedAt || lab.orderedAt, status: 'VERIFIED', data: {} }] : []),
          ...(lab.status === 'CANCELLED' ? [{ eventType: 'ORDER_CANCELLED', timestamp: (lab as any).updatedAt || lab.orderedAt, status: 'CANCELLED', data: {} }] : [])
        ];
        break;
      }

      case 'invoice':
      case 'billing': {
        const inv = await billingManagementRepository.getInvoiceById(tenantId, entityId, db);
        if (!inv) {
          throw AppError.notFound(`Invoice ${entityId} not found`, ErrorCode.NOT_FOUND);
        }
        entityData = inv;
        let payments: any[] = [];
        try {
          payments = await db
            .select()
            .from(billingPayments)
            .where(and(eq(billingPayments.tenantId, tenantId), eq(billingPayments.invoiceId, entityId)));
        } catch {
          payments = inv.payments || [];
        }

        timelineEvents = [
          { eventType: 'INVOICE_GENERATED', timestamp: inv.createdAt, status: inv.status, data: { totalAmount: inv.totalAmount } },
          ...payments.map((p: any) => ({
            eventType: 'PAYMENT_COLLECTED',
            timestamp: p.createdAt || p.receivedAt || new Date(),
            status: p.status || 'PAID',
            data: { amount: p.amount, mode: p.paymentMethod || p.paymentMode, reference: p.paymentNumber }
          })),
          ...(inv.status === 'VOIDED' || (inv.status as string) === 'CANCELLED'
            ? [{ eventType: 'INVOICE_VOIDED', timestamp: inv.updatedAt, status: inv.status, data: { reason: (inv.metadata as any)?.void_reason } }]
            : [])
        ];
        break;
      }

      case 'staff': {
        const [st] = await db
          .select()
          .from(operationalStaff)
          .where(and(eq(operationalStaff.tenantId, tenantId), eq(operationalStaff.id, entityId)));
        if (!st) {
          throw AppError.notFound(`Staff member ${entityId} not found`, ErrorCode.NOT_FOUND);
        }
        entityData = st;
        timelineEvents = [
          { eventType: 'STAFF_ONBOARDED', timestamp: st.createdAt, status: (st as any).status || 'ACTIVE', data: { role: (st as any).staffRole || (st as any).role || 'STAFF' } }
        ];
        break;
      }

      case 'partner':
      case 'facility': {
        const [pt] = await db
          .select()
          .from(operationalPartners)
          .where(and(eq(operationalPartners.tenantId, tenantId), eq(operationalPartners.id, entityId)));
        if (!pt) {
          throw AppError.notFound(`Partner ${entityId} not found`, ErrorCode.NOT_FOUND);
        }
        entityData = pt;
        timelineEvents = [
          { eventType: 'PARTNER_CREATED', timestamp: pt.createdAt || new Date(), status: pt.status || 'ACTIVE' }
        ];
        break;
      }

      default:
        throw AppError.badRequest(`Unsupported business history entity type: "${entityType}"`);
    }

    // 2. Fetch Immutable Cryptographic Audit Log for this Resource
    let auditRecords: any[] = [];
    try {
      auditRecords = await db
        .select()
        .from(auditEvents)
        .where(
          and(
            eq(auditEvents.tenantId, tenantId),
            eq(auditEvents.resourceId, entityId)
          )
        )
        .orderBy(desc(auditEvents.timestamp))
        .limit(100);
    } catch (auditErr) {
      logger.warn('Failed to query cryptographic audit events for entity', { entityId, error: String(auditErr) });
    }

    // 3. Intercept & Record Audit for Governed Actions (PRINT, EXPORT, SHARE)
    if (requestedAction === 'print' || requestedAction === 'export' || requestedAction === 'share') {
      await auditRepository.recordEvent({
        eventType: `BUSINESS_HISTORY_${requestedAction.toUpperCase()}`,
        resourceType: entityType,
        resourceId: entityId,
        tenantId,
        branchId: session.branchId,
        metadata: {
          requestedAction,
          actorEmail: session.actorEmail,
          userId: session.userId,
          recordsReturned: timelineEvents.length
        }
      }, session, db);
    }

    return {
      success: true,
      entityType,
      entityId,
      action: requestedAction,
      currentEntity: entityData,
      timelineEvents,
      auditLogSummary: {
        totalAuditEvents: auditRecords.length,
        latestIntegrityHash: auditRecords[0]?.integrityHash || null,
        events: auditRecords.map((r) => ({
          id: r.id,
          eventType: r.eventType,
          actorId: r.actorId,
          timestamp: r.timestamp,
          integrityHash: r.integrityHash,
          previousHash: r.previousHash,
          metadata: r.metadata
        }))
      }
    };
  }

  /**
   * Action-level permission enforcement ensuring:
   * VIEW != EDIT != DELETE != SHARE != PRINT != EXPORT
   */
  private enforceHistoryActionPermission(
    session: SessionContext,
    entityType: string,
    action: HistoryAction
  ): void {
    if (session.isSuperAdmin) {
      return;
    }

    const norm = entityType.toLowerCase();

    // Map entity to relevant permission resource
    let resource = 'business:history';
    if (norm.includes('patient')) resource = 'clinical:patients';
    else if (norm.includes('encounter')) resource = 'clinical:encounters';
    else if (norm.includes('consultation')) resource = 'clinical:consultations';
    else if (norm.includes('prescription')) resource = 'clinical:prescriptions';
    else if (norm.includes('lab') || norm.includes('pathology')) resource = 'lab:orders';
    else if (norm.includes('invoice') || norm.includes('billing')) resource = 'billing:invoices';
    else if (norm.includes('staff')) resource = 'staff:management';

    switch (action) {
      case 'read': {
        const canRead =
          RBACEvaluator.hasPermission(session, 'business:history:read') ||
          RBACEvaluator.hasPermission(session, `${resource}:read`) ||
          RBACEvaluator.hasPermission(session, `${resource}:view`);
        if (!canRead) {
          throw new AppError({
            message: `Access denied: Insufficient permissions to read business history for ${entityType}`,
            code: ErrorCode.INSUFFICIENT_PERMISSIONS,
            statusCode: 403
          });
        }
        break;
      }

      case 'print': {
        const canPrint =
          RBACEvaluator.hasPermission(session, 'business:history:print') ||
          RBACEvaluator.hasPermission(session, `${resource}:print`);
        if (!canPrint) {
          throw new AppError({
            message: `Access denied: Insufficient permissions to print business history for ${entityType}`,
            code: ErrorCode.INSUFFICIENT_PERMISSIONS,
            statusCode: 403
          });
        }
        break;
      }

      case 'export': {
        const canExport =
          RBACEvaluator.hasPermission(session, 'business:history:export') ||
          RBACEvaluator.hasPermission(session, `${resource}:export`) ||
          RBACEvaluator.hasPermission(session, `${resource}:download`);
        if (!canExport) {
          throw new AppError({
            message: `Access denied: Insufficient permissions to export business history for ${entityType}`,
            code: ErrorCode.INSUFFICIENT_PERMISSIONS,
            statusCode: 403
          });
        }
        break;
      }

      case 'share': {
        const canShare =
          RBACEvaluator.hasPermission(session, 'business:history:share') ||
          RBACEvaluator.hasPermission(session, `${resource}:share`);
        if (!canShare) {
          throw new AppError({
            message: `Access denied: Insufficient permissions to share business history for ${entityType}`,
            code: ErrorCode.INSUFFICIENT_PERMISSIONS,
            statusCode: 403
          });
        }
        break;
      }

      default:
        throw AppError.badRequest(`Unknown history action: "${action}"`);
    }
  }
}

export const businessHistoryService = new BusinessHistoryService();
