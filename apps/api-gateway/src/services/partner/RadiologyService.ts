import { radiologyRepository, type FindRadiologyOrdersParams } from '../../repositories/partner/RadiologyRepository.js';

export interface RadiologyInputRecord {
  [key: string]: unknown;
  id?: string | undefined;
  tenantId?: string | undefined;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  orderNumber?: string | undefined;
  orderId?: string | undefined;
  patientId?: string | undefined;
  patientName?: string | undefined;
  patientMrn?: string | undefined;
  encounterId?: string | undefined;
  orderingDoctorName?: string | undefined;
  orderingDepartment?: string | undefined;
  procedureId?: string | undefined;
  procedureName?: string | undefined;
  modalityType?: string | undefined;
  modalityCode?: string | undefined;
  modalityName?: string | undefined;
  modalityId?: string | undefined;
  priority?: string | undefined;
  clinicalIndication?: string | undefined;
  requiresContrast?: boolean | undefined;
  status?: string | undefined;
  orderedAt?: string | undefined;
  appointmentCode?: string | undefined;
  roomNumber?: string | undefined;
  scheduledStart?: string | undefined;
  scheduledEnd?: string | undefined;
  scheduledDateTime?: string | undefined;
  newScheduledDateTime?: string | undefined;
  newModalityCode?: string | undefined;
  newRoomNumber?: string | undefined;
  assignedTechnologistName?: string | undefined;
  technologistAssigned?: string | undefined;
  rescheduleJustification?: string | undefined;
  cancellationReason?: string | undefined;
  preparationCode?: string | undefined;
  isPatientReady?: boolean | undefined;
  accessionNumber?: string | undefined;
  studyInstanceUid?: string | undefined;
  pacsViewerUrl?: string | undefined;
  reportNumber?: string | undefined;
  studyId?: string | undefined;
  findings?: string | undefined;
  amendedFindings?: string | undefined;
  impression?: string | undefined;
  amendedImpression?: string | undefined;
  recommendations?: string | undefined;
  verifyingRadiologistName?: string | undefined;
  reportingRadiologistName?: string | undefined;
  amendmentReason?: string | undefined;
  alertCode?: string | undefined;
  severity?: string | undefined;
  flaggedByRadiologist?: string | undefined;
  notifiedRecipient?: string | undefined;
  acknowledgedBy?: string | undefined;
  acknowledgedByDoctor?: string | undefined;
  acknowledgmentNotes?: string | undefined;
  clinicalActionNotes?: string | undefined;
  eventCode?: string | undefined;
}
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import crypto from 'crypto';

export class RadiologyService {
  // 1. Overview & Analytics
  async getOverviewMetrics(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return radiologyRepository.getOverviewMetrics(session.tenantId, tx);
    });
  }

  async getAnalytics(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async () => {
      return radiologyRepository.getAnalytics(session.tenantId);
    });
  }

  // 2. Department & Modalities & Procedures
  async getDepartment(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return radiologyRepository.getDepartment(session.tenantId, tx);
    });
  }

  async getModalities(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return radiologyRepository.getModalities(session.tenantId, tx);
    });
  }

  async getProcedures(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return radiologyRepository.getProcedures(session.tenantId, tx);
    });
  }

  // 3. Orders
  async getOrders(params: Omit<FindRadiologyOrdersParams, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return radiologyRepository.findManyOrders({ ...params, tenantId: session.tenantId }, tx);
    });
  }

  async getOrderById(orderId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const order = await radiologyRepository.findOrderById(orderId, session.tenantId, tx);
      if (!order) {
        throw AppError.notFound('Radiology order not found or does not belong to this tenant');
      }
      if (session.dataScope === 'branch' && order.branchId && session.branchId && order.branchId !== session.branchId) {
        throw AppError.forbidden('Branch access denied', ErrorCode.BRANCH_ACCESS_DENIED);
      }
      return order;
    });
  }

  async createOrder(data: RadiologyInputRecord, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const orderNumber = (data.orderNumber as string) || `RAD-ORD-${Date.now().toString(36).toUpperCase()}`;
      const order = await radiologyRepository.createOrder(
        {
          ...data,
          orderNumber,
          tenantId: session.tenantId,
          partnerId: data.partnerId || session.tenantId,
          organizationId: data.organizationId || session.tenantId,
          branchId: session.branchId || data.branchId
        },
        tx
      );

      // Record in canonical audit
      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_ORDER_CREATED',
          resourceType: 'radiology_order',
          resourceId: order.id as string,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: {
            orderNumber: order.orderNumber,
            patientName: order.patientName,
            procedureName: order.procedureName,
            modalityType: order.modalityType,
            priority: order.priority
          }
        },
        session,
        tx
      );

      // Record in radiology audit traces
      const integrityHash = crypto.createHash('sha256').update(JSON.stringify({ orderId: order.id, orderNumber, ts: Date.now() })).digest('hex');
      await radiologyRepository.createAuditTrace(
        {
          tenantId: session.tenantId,
          partnerId: data.partnerId || session.tenantId,
          organizationId: data.organizationId || session.tenantId,
          branchId: session.branchId || data.branchId,
          traceNumber: `RAD-TRC-${Date.now().toString(36).toUpperCase()}`,
          actorId: session.userId,
          actorName: session.userId,
          actorRole: session.roles[0] || 'DOCTOR',
          action: 'RADIOLOGY_ORDER_CREATED',
          entityType: 'radiology_order',
          entityId: order.id,
          entityCode: order.orderNumber,
          justification: (order.clinicalIndication as string) || 'Clinical Imaging Requested',
          ipAddress: '127.0.0.1',
          integrityHash,
          previousHash: 'GENESIS_HASH_RAD_000',
          newState: order
        },
        tx
      );

      return order;
    });
  }

  async updateOrderStatus(orderId: string, fromStatus: string, toStatus: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      // Validate valid transitions
      const validTransitions: Record<string, string[]> = {
        DRAFT: ['ORDERED', 'CANCELLED'],
        ORDERED: ['SCHEDULED', 'IN_PROGRESS', 'CANCELLED'],
        SCHEDULED: ['IN_PROGRESS', 'CANCELLED', 'COMPLETED'],
        IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
        COMPLETED: ['REPORTED', 'VERIFIED'],
        REPORTED: ['VERIFIED', 'AMENDED'],
        VERIFIED: ['AMENDED']
      };

      const allowedNext = validTransitions[fromStatus] || [];
      if (!allowedNext.includes(toStatus)) {
        throw AppError.badRequest(`Invalid state transition from ${fromStatus} to ${toStatus}`);
      }

      const updated = await radiologyRepository.updateOrderStatus(orderId, session.tenantId, fromStatus, toStatus, tx);
      if (!updated) {
        throw AppError.badRequest(`Cannot transition order from ${fromStatus} to ${toStatus}`);
      }

      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_ORDER_UPDATED',
          resourceType: 'radiology_order',
          resourceId: orderId,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { fromStatus, toStatus }
        },
        session,
        tx
      );

      return updated;
    });
  }

  // 4. Appointments & Scheduling
  async getAppointments(session: SessionContext, branchId?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return radiologyRepository.findAppointments(session.tenantId, branchId || session.branchId, tx);
    });
  }

  async scheduleAppointment(data: RadiologyInputRecord, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const appointmentCode = (data.appointmentCode as string) || `RAD-APT-${Date.now().toString(36).toUpperCase()}`;
      const appointment = await radiologyRepository.createAppointment(
        {
          ...data,
          appointmentCode,
          tenantId: session.tenantId,
          partnerId: data.partnerId || session.tenantId,
          organizationId: data.organizationId || session.tenantId,
          branchId: session.branchId || data.branchId,
          modalityId: data.modalityId || 'm1111111-1111-4111-8111-111111111101',
          modalityName: data.modalityName || data.modalityCode || 'CT Scanner',
          scheduledStart: data.scheduledStart ? new Date(data.scheduledStart as string) : new Date(),
          scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd as string) : new Date(Date.now() + 1800000),
          assignedTechnologistName: data.assignedTechnologistName || data.technologistAssigned || 'Senior Technologist'
        },
        tx
      );

      // Also update order status to SCHEDULED if orderId is present
      if (data.orderId) {
        await radiologyRepository.updateOrderStatus(data.orderId as string, session.tenantId, 'ORDERED', 'SCHEDULED', tx).catch(() => {});
      }

      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_SCHEDULED',
          resourceType: 'radiology_appointment',
          resourceId: appointment.id as string,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { appointmentCode: appointment.appointmentCode, orderId: data.orderId, scheduledDateTime: data.scheduledDateTime }
        },
        session,
        tx
      );

      return appointment;
    });
  }

  async rescheduleAppointment(appointmentId: string, data: RadiologyInputRecord, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const updated = await radiologyRepository.updateAppointment(
        appointmentId,
        session.tenantId,
        {
          scheduledStart: data.newScheduledDateTime ? new Date(data.newScheduledDateTime as string) : new Date(),
          modalityName: data.newModalityCode || undefined,
          roomNumber: data.newRoomNumber || undefined,
          status: 'SCHEDULED'
        },
        tx
      );

      if (!updated) {
        throw AppError.notFound('Appointment not found');
      }

      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_RESCHEDULED',
          resourceType: 'radiology_appointment',
          resourceId: appointmentId,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { newScheduledDateTime: data.newScheduledDateTime, justification: data.rescheduleJustification }
        },
        session,
        tx
      );

      return updated;
    });
  }

  async cancelAppointment(appointmentId: string, data: RadiologyInputRecord, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const updated = await radiologyRepository.updateAppointment(
        appointmentId,
        session.tenantId,
        {
          status: 'CANCELLED'
        },
        tx
      );

      if (!updated) {
        throw AppError.notFound('Appointment not found');
      }

      if (data.orderId) {
        await radiologyRepository.updateOrderStatus(data.orderId as string, session.tenantId, 'SCHEDULED', 'CANCELLED', tx).catch(() => {});
      }

      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_CANCELLED',
          resourceType: 'radiology_appointment',
          resourceId: appointmentId,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { cancellationReason: data.cancellationReason }
        },
        session,
        tx
      );

      return updated;
    });
  }

  // 5. Preparation Records & Safety Gates
  async getPreparationRecords(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return radiologyRepository.findPreparationRecords(session.tenantId, tx);
    });
  }

  async recordPreparation(data: RadiologyInputRecord, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const preparationCode = (data.preparationCode as string) || `RAD-PRP-${Date.now().toString(36).toUpperCase()}`;
      const record = await radiologyRepository.createPreparationRecord(
        {
          ...data,
          preparationCode,
          tenantId: session.tenantId,
          partnerId: data.partnerId || session.tenantId,
          organizationId: data.organizationId || session.tenantId,
          branchId: session.branchId || data.branchId
        },
        tx
      );

      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_PREPARATION_RECORDED',
          resourceType: 'radiology_preparation',
          resourceId: record.id as string,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { preparationCode: record.preparationCode, orderId: data.orderId, isPatientReady: data.isPatientReady }
        },
        session,
        tx
      );

      return record;
    });
  }

  // 6. Studies & DICOM/PACS
  async getStudies(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return radiologyRepository.findStudies(session.tenantId, tx);
    });
  }

  async getStudyById(studyId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const study = await radiologyRepository.findStudyById(studyId, session.tenantId, tx);
      if (!study) {
        throw AppError.notFound('Study not found');
      }
      return study;
    });
  }

  async completeStudyAcquisition(data: RadiologyInputRecord, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const accessionNumber = (data.accessionNumber as string) || `RAD-ACC-${Date.now().toString(36).toUpperCase()}`;
      const studyInstanceUid = (data.studyInstanceUid as string) || `1.2.840.113619.2.${Date.now()}.${Math.floor(Math.random() * 100000)}`;
      const pacsViewerUrl = (data.pacsViewerUrl as string) || `https://pacs.docsearch.internal/viewer?studyUID=${studyInstanceUid}&accession=${accessionNumber}`;

      const study = await radiologyRepository.createStudy(
        {
          ...data,
          accessionNumber,
          studyInstanceUid,
          pacsViewerUrl,
          tenantId: session.tenantId,
          partnerId: data.partnerId || session.tenantId,
          organizationId: data.organizationId || session.tenantId,
          branchId: session.branchId || data.branchId,
          status: 'ACQUIRED'
        },
        tx
      );

      // Update order status to COMPLETED
      if (data.orderId) {
        await radiologyRepository.updateOrderStatus(data.orderId as string, session.tenantId, 'SCHEDULED', 'COMPLETED', tx).catch(() => {
          radiologyRepository.updateOrderStatus(data.orderId as string, session.tenantId, 'IN_PROGRESS', 'COMPLETED', tx).catch(() => {});
        });
      }

      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_STUDY_ACQUIRED',
          resourceType: 'radiology_study',
          resourceId: study.id as string,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { accessionNumber: study.accessionNumber, studyInstanceUid: study.studyInstanceUid, modalityType: study.modalityType }
        },
        session,
        tx
      );

      return study;
    });
  }

  // 7. Reports & Lifecycle
  async getReports(session: SessionContext, studyId?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return radiologyRepository.findReports(session.tenantId, studyId, tx);
    });
  }

  async getReportById(reportId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const report = await radiologyRepository.findReportById(reportId, session.tenantId, tx);
      if (!report) {
        throw AppError.notFound('Radiology report not found');
      }
      return report;
    });
  }

  async createReportDraft(data: RadiologyInputRecord, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const reportNumber = (data.reportNumber as string) || `RAD-RPT-${Date.now().toString(36).toUpperCase()}`;
      const report = await radiologyRepository.createReport(
        {
          ...data,
          reportNumber,
          status: 'DRAFT',
          tenantId: session.tenantId,
          partnerId: data.partnerId || session.tenantId,
          organizationId: data.organizationId || session.tenantId,
          branchId: session.branchId || data.branchId
        },
        tx
      );

      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_REPORT_CREATED',
          resourceType: 'radiology_report',
          resourceId: report.id as string,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { reportNumber: report.reportNumber, studyId: data.studyId }
        },
        session,
        tx
      );

      return report;
    });
  }

  async finalizeReport(reportId: string, data: RadiologyInputRecord, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const verifyingRadiologistName = (data.verifyingRadiologistName as string) || session.userId || 'Dr. Verifying Radiologist, MD';
      const finalized = await radiologyRepository.finalizeReport(reportId, session.tenantId, verifyingRadiologistName, tx);

      if (!finalized) {
        throw AppError.notFound('Report not found or not in valid state for finalization');
      }

      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_REPORT_FINALIZED',
          resourceType: 'radiology_report',
          resourceId: reportId,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { reportNumber: finalized.reportNumber, verifyingRadiologistName }
        },
        session,
        tx
      );

      return finalized;
    });
  }

  async amendReport(reportId: string, data: RadiologyInputRecord, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const reason = (data.amendmentReason as string) || '';
      if (!reason || reason.trim().length < 5) {
        throw AppError.badRequest('Amendment requires a detailed justification reason');
      }

      const amended = await radiologyRepository.amendReport(
        reportId,
        session.tenantId,
        reason,
        (data.findings as string) || (data.amendedFindings as string) || '',
        (data.impression as string) || (data.amendedImpression as string) || '',
        (data.recommendations as string) || '',
        (data.verifyingRadiologistName as string) || (data.reportingRadiologistName as string) || session.userId || 'Dr. Amending Radiologist, MD',
        tx
      );

      if (!amended) {
        throw AppError.notFound('Report not found for amendment');
      }

      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_REPORT_AMENDED',
          resourceType: 'radiology_report',
          resourceId: reportId,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { reportNumber: amended.reportNumber, version: amended.version, amendmentReason: reason }
        },
        session,
        tx
      );

      return amended;
    });
  }

  // 8. Critical Findings
  async getCriticalFindings(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return radiologyRepository.findCriticalFindings(session.tenantId, tx);
    });
  }

  async recordCriticalFinding(data: RadiologyInputRecord, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const alertCode = (data.alertCode as string) || `RAD-CRT-${Date.now().toString(36).toUpperCase()}`;
      const finding = await radiologyRepository.createCriticalFinding(
        {
          ...data,
          alertCode,
          status: (data.status as string) || 'FLAGGED_PENDING_NOTIFICATION',
          tenantId: session.tenantId,
          partnerId: data.partnerId || session.tenantId,
          organizationId: data.organizationId || session.tenantId,
          branchId: session.branchId || data.branchId
        },
        tx
      );

      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_CRITICAL_FLAGGED',
          resourceType: 'radiology_critical_finding',
          resourceId: finding.id as string,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { alertCode: finding.alertCode, severity: finding.severity, reportId: data['reportId'] as string }
        },
        session,
        tx
      );

      return finding;
    });
  }

  async acknowledgeCriticalFinding(findingId: string, data: RadiologyInputRecord, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const acknowledgedBy = (data.acknowledgedBy as string) || (data.acknowledgedByDoctor as string) || session.userId || 'Attending Physician';
      const acknowledgedTimestamp = new Date();
      const updated = await radiologyRepository.acknowledgeCriticalFinding(
        findingId,
        session.tenantId,
        acknowledgedBy,
        acknowledgedTimestamp,
        (data.acknowledgmentNotes as string) || (data.clinicalActionNotes as string) || '',
        tx
      );

      if (!updated) {
        throw AppError.notFound('Critical finding alert not found');
      }

      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_CRITICAL_RESULT_ACKNOWLEDGED',
          resourceType: 'radiology_critical_finding',
          resourceId: findingId,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { alertCode: updated.alertCode, acknowledgedBy, notes: data.acknowledgmentNotes || data.clinicalActionNotes }
        },
        session,
        tx
      );

      return updated;
    });
  }

  // 9. Quality Events & Audit Traces
  async getQualityEvents(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return radiologyRepository.findQualityEvents(session.tenantId, tx);
    });
  }

  async recordQualityEvent(data: RadiologyInputRecord, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const eventCode = (data.eventCode as string) || `RAD-QLT-${Date.now().toString(36).toUpperCase()}`;
      const event = await radiologyRepository.createQualityEvent(
        {
          ...data,
          eventCode,
          tenantId: session.tenantId,
          partnerId: data.partnerId || session.tenantId,
          organizationId: data.organizationId || session.tenantId,
          branchId: session.branchId || data.branchId
        },
        tx
      );

      return event;
    });
  }

  async getAuditTraces(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return radiologyRepository.findAuditTraces(session.tenantId, tx);
    });
  }
}

export const radiologyService = new RadiologyService();
