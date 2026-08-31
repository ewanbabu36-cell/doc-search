import { apiRequest } from './api-client.js';
import type {
  RadiologyDepartmentDto,
  RadiologyModalityDto,
  RadiologyProcedureCatalogDto,
  RadiologyOrderDto,
  RadiologyAppointmentDto,
  RadiologyPreparationRecordDto,
  RadiologyStudyDto,
  RadiologyReportDto,
  RadiologyCriticalFindingDto,
  RadiologyQualityEventDto,
  RadiologyAuditTraceDto,
  RadiologyOverviewMetricsDto,
  RadiologyAnalyticsDto,
  CreateRadiologyOrderRequest,
  ScheduleRadiologyStudyRequest,
  RescheduleRadiologyStudyRequest,
  CancelRadiologyStudyRequest,
  RecordPreparationRequest,
  StartRadiologyProcedureRequest,
  CompleteRadiologyProcedureRequest,
  CreateRadiologyReportRequest,
  FinalizeRadiologyReportRequest,
  AmendRadiologyReportRequest,
  RecordCriticalFindingRequest,
  AcknowledgeCriticalFindingRequest,
  CreatePacsReferenceRequest
} from '@docsearch/api-contracts';

import {
  mockRadiologyDepartment,
  mockRadiologyModalities,
  mockRadiologyProcedures,
  mockRadiologyOrders,
  mockRadiologyAppointments,
  mockRadiologyPreparationRecords,
  mockRadiologyStudies,
  mockRadiologyReports,
  mockRadiologyCriticalFindings,
  mockRadiologyQualityEvents,
  mockRadiologyAuditTraces,
  mockRadiologyMetrics,
  mockRadiologyAnalytics
} from './mock-radiology-data.js';

export interface IRadiologyManagementService {
  getOverviewMetrics(tenantId: string): Promise<RadiologyOverviewMetricsDto>;
  getAnalytics(tenantId: string): Promise<RadiologyAnalyticsDto>;
  getDepartment(tenantId: string): Promise<RadiologyDepartmentDto>;
  getModalities(tenantId: string): Promise<RadiologyModalityDto[]>;
  getProcedures(tenantId: string): Promise<RadiologyProcedureCatalogDto[]>;
  getOrders(tenantId: string): Promise<RadiologyOrderDto[]>;
  getAppointments(tenantId: string): Promise<RadiologyAppointmentDto[]>;
  getPreparationRecords(tenantId: string): Promise<RadiologyPreparationRecordDto[]>;
  getStudies(tenantId: string): Promise<RadiologyStudyDto[]>;
  getReports(tenantId: string): Promise<RadiologyReportDto[]>;
  getCriticalFindings(tenantId: string): Promise<RadiologyCriticalFindingDto[]>;
  getQualityEvents(tenantId: string): Promise<RadiologyQualityEventDto[]>;
  getAuditTraces(tenantId: string): Promise<RadiologyAuditTraceDto[]>;

  createOrder(req: CreateRadiologyOrderRequest): Promise<RadiologyOrderDto>;
  scheduleStudy(req: ScheduleRadiologyStudyRequest): Promise<RadiologyAppointmentDto>;
  rescheduleStudy(req: RescheduleRadiologyStudyRequest): Promise<RadiologyAppointmentDto>;
  cancelStudy(req: CancelRadiologyStudyRequest): Promise<RadiologyOrderDto>;
  recordPreparation(req: RecordPreparationRequest): Promise<RadiologyPreparationRecordDto>;
  startProcedure(req: StartRadiologyProcedureRequest): Promise<RadiologyOrderDto>;
  completeProcedure(req: CompleteRadiologyProcedureRequest): Promise<RadiologyStudyDto>;
  createReport(req: CreateRadiologyReportRequest): Promise<RadiologyReportDto>;
  finalizeReport(req: FinalizeRadiologyReportRequest): Promise<RadiologyReportDto>;
  amendReport(req: AmendRadiologyReportRequest): Promise<RadiologyReportDto>;
  recordCriticalFinding(req: RecordCriticalFindingRequest): Promise<RadiologyCriticalFindingDto>;
  acknowledgeCriticalFinding(req: AcknowledgeCriticalFindingRequest): Promise<RadiologyCriticalFindingDto>;
  createPacsReference(req: CreatePacsReferenceRequest): Promise<RadiologyStudyDto>;
}

class RadiologyManagementService implements IRadiologyManagementService {
  private modalities: RadiologyModalityDto[] = [...mockRadiologyModalities];
  private procedures: RadiologyProcedureCatalogDto[] = [...mockRadiologyProcedures];
  private orders: RadiologyOrderDto[] = [...mockRadiologyOrders];
  private appointments: RadiologyAppointmentDto[] = [...mockRadiologyAppointments];
  private preps: RadiologyPreparationRecordDto[] = [...mockRadiologyPreparationRecords];
  private studies: RadiologyStudyDto[] = [...mockRadiologyStudies];
  private reports: RadiologyReportDto[] = [...mockRadiologyReports];
  private criticalFindings: RadiologyCriticalFindingDto[] = [...mockRadiologyCriticalFindings];
  private qualityEvents: RadiologyQualityEventDto[] = [...mockRadiologyQualityEvents];
  private auditTraces: RadiologyAuditTraceDto[] = [...mockRadiologyAuditTraces];

  private createTrace(
    tenantId: string,
    partnerId: string,
    organizationId: string,
    branchId: string,
    action: string,
    entityType: string,
    entityId: string,
    entityCode: string,
    justification: string,
    newState: Record<string, unknown>
  ): void {
    const trace: RadiologyAuditTraceDto = {
      id: `rad-at-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId,
      partnerId,
      organizationId,
      branchId,
      traceNumber: `RAD-TRC-${Date.now().toString().slice(-6)}`,
      actorId: 'usr-partner-admin-01',
      actorName: 'Dr. Vikram Malhotra',
      actorRole: 'HOD_RADIOLOGIST',
      action,
      entityType,
      entityId,
      entityCode,
      justification,
      ipAddress: '192.168.1.105',
      integrityHash: `sha256-${Math.random().toString(36).substring(2, 18)}`,
      previousHash: `sha256-${Math.random().toString(36).substring(2, 18)}`,
      newState,
      timestamp: new Date().toISOString()
    };
    this.auditTraces.unshift(trace);
  }

  async getOverviewMetrics(tenantId: string): Promise<RadiologyOverviewMetricsDto> {
    try {
      const res = await apiRequest<RadiologyOverviewMetricsDto>('/api/v1/partner/radiology/overview');
      if (res.success && res.data) return res.data;
    } catch {
      // fallback
    }
    const tenantOrders = this.orders.filter((o) => o.tenantId === tenantId);
    const tenantStudies = this.studies.filter((s) => s.tenantId === tenantId);
    const tenantReports = this.reports.filter((r) => r.tenantId === tenantId);
    const tenantCriticals = this.criticalFindings.filter((c) => c.tenantId === tenantId);

    return {
      ...mockRadiologyMetrics,
      todaysOrdersCount: tenantOrders.length,
      pendingStudiesCount: tenantStudies.filter((s) => s.status === 'ACQUIRED').length,
      completedScansCount: tenantStudies.length,
      pendingReportsCount: tenantReports.filter((r) => r.status === 'DRAFT' || r.status === 'DICTATED').length,
      criticalFindingsCount: tenantCriticals.filter((c) => c.status === 'FLAGGED_PENDING_NOTIFICATION').length
    };
  }

  async getAnalytics(_tenantId: string): Promise<RadiologyAnalyticsDto> {
    try {
      const res = await apiRequest<RadiologyAnalyticsDto>('/api/v1/partner/radiology/analytics');
      if (res.success && res.data) return res.data;
    } catch {
      // fallback
    }
    return { ...mockRadiologyAnalytics };
  }

  async getDepartment(tenantId: string): Promise<RadiologyDepartmentDto> {
    try {
      const res = await apiRequest<RadiologyDepartmentDto>('/api/v1/partner/radiology/department');
      if (res.success && res.data) return res.data;
    } catch {
      // fallback
    }
    return { ...mockRadiologyDepartment, tenantId };
  }

  async getModalities(tenantId: string): Promise<RadiologyModalityDto[]> {
    try {
      const res = await apiRequest<RadiologyModalityDto[]>('/api/v1/partner/radiology/modalities');
      if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) return res.data;
    } catch {
      // fallback
    }
    return this.modalities.filter((m) => m.tenantId === tenantId);
  }

  async getProcedures(tenantId: string): Promise<RadiologyProcedureCatalogDto[]> {
    try {
      const res = await apiRequest<RadiologyProcedureCatalogDto[]>('/api/v1/partner/radiology/procedures');
      if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) return res.data;
    } catch {
      // fallback
    }
    return this.procedures.filter((p) => p.tenantId === tenantId);
  }

  async getOrders(tenantId: string): Promise<RadiologyOrderDto[]> {
    try {
      const res = await apiRequest<RadiologyOrderDto[]>('/api/v1/partner/radiology/orders');
      if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) return res.data;
    } catch {
      // fallback
    }
    return this.orders.filter((o) => o.tenantId === tenantId);
  }

  async getAppointments(tenantId: string): Promise<RadiologyAppointmentDto[]> {
    try {
      const res = await apiRequest<RadiologyAppointmentDto[]>('/api/v1/partner/radiology/appointments');
      if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) return res.data;
    } catch {
      // fallback
    }
    return this.appointments.filter((a) => a.tenantId === tenantId);
  }

  async getPreparationRecords(tenantId: string): Promise<RadiologyPreparationRecordDto[]> {
    try {
      const res = await apiRequest<RadiologyPreparationRecordDto[]>('/api/v1/partner/radiology/preparation-records');
      if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) return res.data;
    } catch {
      // fallback
    }
    return this.preps.filter((p) => p.tenantId === tenantId);
  }

  async getStudies(tenantId: string): Promise<RadiologyStudyDto[]> {
    try {
      const res = await apiRequest<RadiologyStudyDto[]>('/api/v1/partner/radiology/studies');
      if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) return res.data;
    } catch {
      // fallback
    }
    return this.studies.filter((s) => s.tenantId === tenantId);
  }

  async getReports(tenantId: string): Promise<RadiologyReportDto[]> {
    try {
      const res = await apiRequest<RadiologyReportDto[]>('/api/v1/partner/radiology/reports');
      if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) return res.data;
    } catch {
      // fallback
    }
    return this.reports.filter((r) => r.tenantId === tenantId);
  }

  async getCriticalFindings(tenantId: string): Promise<RadiologyCriticalFindingDto[]> {
    try {
      const res = await apiRequest<RadiologyCriticalFindingDto[]>('/api/v1/partner/radiology/critical-findings');
      if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) return res.data;
    } catch {
      // fallback
    }
    return this.criticalFindings.filter((c) => c.tenantId === tenantId);
  }

  async getQualityEvents(tenantId: string): Promise<RadiologyQualityEventDto[]> {
    try {
      const res = await apiRequest<RadiologyQualityEventDto[]>('/api/v1/partner/radiology/quality-events');
      if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) return res.data;
    } catch {
      // fallback
    }
    return this.qualityEvents.filter((q) => q.tenantId === tenantId);
  }

  async getAuditTraces(tenantId: string): Promise<RadiologyAuditTraceDto[]> {
    try {
      const res = await apiRequest<RadiologyAuditTraceDto[]>('/api/v1/partner/radiology/audit-traces');
      if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) return res.data;
    } catch {
      // fallback
    }
    return this.auditTraces.filter((t) => t.tenantId === tenantId);
  }

  async createOrder(req: CreateRadiologyOrderRequest): Promise<RadiologyOrderDto> {
    try {
      const res = await apiRequest<RadiologyOrderDto>('/api/v1/partner/radiology/orders', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        this.orders.unshift(res.data);
        return res.data;
      }
    } catch {
      // fallback
    }
    const orderNumber = `RAD-ORD-${Date.now().toString().slice(-6)}`;
    const newOrder: RadiologyOrderDto = {
      id: `rad-ord-${Date.now()}`,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      orderNumber,
      patientId: req.patientId,
      patientName: req.patientName,
      patientMrn: req.patientMrn,
      encounterId: req.encounterId,
      orderingDoctorName: req.orderingDoctorName,
      orderingDepartment: req.orderingDepartment,
      procedureId: req.procedureId,
      procedureName: req.procedureName,
      modalityType: req.modalityType,
      priority: req.priority,
      clinicalIndication: req.clinicalIndication,
      requiresContrast: req.requiresContrast,
      pregnancyScreeningResult: req.pregnancyScreeningResult ?? 'NOT_APPLICABLE',
      renalEgfrResult: req.renalEgfrResult ?? 'NOT_REQUIRED',
      knownAllergies: req.knownAllergies ?? 'None reported',
      status: 'ORDERED',
      orderedAt: new Date().toISOString()
    };
    this.orders.unshift(newOrder);
    this.createTrace(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      req.branchId,
      'CREATE_ORDER',
      'RADIOLOGY_ORDER',
      newOrder.id,
      newOrder.orderNumber,
      'Clinical imaging order created',
      newOrder as unknown as Record<string, unknown>
    );
    return newOrder;
  }

  async scheduleStudy(req: ScheduleRadiologyStudyRequest): Promise<RadiologyAppointmentDto> {
    try {
      const res = await apiRequest<RadiologyAppointmentDto>('/api/v1/partner/radiology/appointments', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        this.appointments.unshift(res.data);
        return res.data;
      }
    } catch {
      // fallback
    }
    const order = this.orders.find((o) => o.id === req.orderId);
    if (order) order.status = 'SCHEDULED';

    const newApp: RadiologyAppointmentDto = {
      id: `rad-apt-${Date.now()}`,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      appointmentCode: `RAD-APT-${Date.now().toString().slice(-6)}`,
      orderId: req.orderId,
      patientName: req.patientName,
      patientMrn: req.patientMrn,
      modalityId: req.modalityId,
      modalityName: req.modalityName,
      roomNumber: req.roomNumber,
      scheduledStart: req.scheduledStart,
      scheduledEnd: req.scheduledEnd,
      assignedTechnologistName: req.assignedTechnologistName,
      notes: req.notes,
      status: 'SCHEDULED',
      createdAt: new Date().toISOString()
    };
    this.appointments.unshift(newApp);
    this.createTrace(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      req.branchId,
      'SCHEDULE_STUDY',
      'RADIOLOGY_APPOINTMENT',
      newApp.id,
      newApp.appointmentCode,
      'Study scheduled with modality assignment',
      newApp as unknown as Record<string, unknown>
    );
    return newApp;
  }

  async rescheduleStudy(req: RescheduleRadiologyStudyRequest): Promise<RadiologyAppointmentDto> {
    try {
      const res = await apiRequest<RadiologyAppointmentDto>(`/api/v1/partner/radiology/appointments/${req.appointmentId}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) return res.data;
    } catch {
      // fallback
    }
    const app = this.appointments.find((a) => a.id === req.appointmentId);
    if (app) {
      app.scheduledStart = req.newScheduledStart;
      app.scheduledEnd = req.newScheduledEnd;
      app.status = 'SCHEDULED';
      return app;
    }
    return {
      id: req.appointmentId,
      tenantId: req.tenantId,
      partnerId: req.tenantId,
      organizationId: req.tenantId,
      branchId: req.tenantId,
      appointmentCode: 'RAD-APT-RESCHEDULED',
      orderId: 'rad-ord-unknown',
      patientName: 'Patient',
      patientMrn: 'MRN-00000',
      modalityId: 'mod-001',
      modalityName: 'CT Scanner',
      roomNumber: 'Room 101',
      scheduledStart: req.newScheduledStart,
      scheduledEnd: req.newScheduledEnd,
      assignedTechnologistName: req.rescheduledByStaff,
      status: 'SCHEDULED',
      createdAt: new Date().toISOString()
    };
  }

  async cancelStudy(req: CancelRadiologyStudyRequest): Promise<RadiologyOrderDto> {
    try {
      const res = await apiRequest<RadiologyOrderDto>(`/api/v1/partner/radiology/appointments/${req.orderId}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) return res.data;
    } catch {
      // fallback
    }
    const app = this.appointments.find((a) => a.orderId === req.orderId);
    if (app) app.status = 'CANCELLED';
    const order = this.orders.find((o) => o.id === req.orderId);
    if (order) {
      order.status = 'CANCELLED';
      return order;
    }
    return {
      id: req.orderId,
      tenantId: req.tenantId,
      partnerId: req.tenantId,
      organizationId: req.tenantId,
      branchId: req.tenantId,
      orderNumber: 'RAD-ORD-CANCELLED',
      patientId: 'patient-unknown',
      patientName: 'Patient',
      patientMrn: 'MRN-00000',
      encounterId: 'encounter-unknown',
      orderingDoctorName: 'Doctor',
      orderingDepartment: 'Radiology',
      procedureId: 'proc-001',
      procedureName: 'Cancelled Study',
      modalityType: 'COMPUTED_TOMOGRAPHY_CT',
      priority: 'ROUTINE_ELECTIVE',
      clinicalIndication: req.cancellationReason,
      requiresContrast: false,
      status: 'CANCELLED',
      orderedAt: new Date().toISOString()
    };
  }

  async recordPreparation(req: RecordPreparationRequest): Promise<RadiologyPreparationRecordDto> {
    try {
      const res = await apiRequest<RadiologyPreparationRecordDto>('/api/v1/partner/radiology/preparation-records', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        this.preps.unshift(res.data);
        return res.data;
      }
    } catch {
      // fallback
    }
    const newPrep: RadiologyPreparationRecordDto = {
      id: `rad-prp-${Date.now()}`,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      preparationCode: `RAD-PRP-${Date.now().toString().slice(-6)}`,
      orderId: req.orderId,
      patientName: req.patientName,
      fastingConfirmed: req.fastingConfirmed,
      mriMetalScreeningCleared: req.mriMetalScreeningCleared,
      pregnancyStatusConfirmedNegative: req.pregnancyStatusConfirmedNegative,
      renalEgfrAdequate: req.renalEgfrAdequate,
      ivCannulaSecured: req.ivCannulaSecured,
      informedConsentSigned: req.informedConsentSigned,
      preparationNurseName: req.preparationNurseName,
      isReadyForScan: req.isReadyForScan,
      checkedAt: new Date().toISOString()
    };
    this.preps.unshift(newPrep);
    return newPrep;
  }

  async startProcedure(req: StartRadiologyProcedureRequest): Promise<RadiologyOrderDto> {
    try {
      const res = await apiRequest<RadiologyOrderDto>(`/api/v1/partner/radiology/orders/${req.orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ fromStatus: 'SCHEDULED', toStatus: 'IN_PROGRESS' })
      });
      if (res.success && res.data) return res.data;
    } catch {
      // fallback
    }
    const order = this.orders.find((o) => o.id === req.orderId);
    if (order) {
      order.status = 'IN_PROGRESS';
      return order;
    }
    return {
      id: req.orderId,
      tenantId: req.tenantId,
      partnerId: req.tenantId,
      organizationId: req.tenantId,
      branchId: req.tenantId,
      orderNumber: 'RAD-ORD-INPROGRESS',
      patientId: 'patient-unknown',
      patientName: 'Patient',
      patientMrn: 'MRN-00000',
      encounterId: 'encounter-unknown',
      orderingDoctorName: 'Doctor',
      orderingDepartment: 'Radiology',
      procedureId: 'proc-001',
      procedureName: 'Imaging Scan',
      modalityType: 'COMPUTED_TOMOGRAPHY_CT',
      priority: 'ROUTINE_ELECTIVE',
      clinicalIndication: 'Routine scan',
      requiresContrast: false,
      status: 'IN_PROGRESS',
      orderedAt: new Date().toISOString()
    };
  }

  async completeProcedure(req: CompleteRadiologyProcedureRequest): Promise<RadiologyStudyDto> {
    try {
      const res = await apiRequest<RadiologyStudyDto>('/api/v1/partner/radiology/studies', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        this.studies.unshift(res.data);
        return res.data;
      }
    } catch {
      // fallback
    }
    const order = this.orders.find((o) => o.id === req.orderId);
    if (order) order.status = 'COMPLETED';

    const newStudy: RadiologyStudyDto = {
      id: `rad-std-${Date.now()}`,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      studyInstanceUid: `1.2.840.113619.2.${Date.now()}`,
      accessionNumber: `RAD-ACC-${Date.now().toString().slice(-6)}`,
      orderId: req.orderId,
      patientName: req.patientName,
      patientMrn: req.patientMrn,
      modalityType: req.modalityType,
      studyDescription: req.studyDescription,
      studyDateTime: new Date().toISOString(),
      seriesCount: req.seriesCount,
      instancesCount: req.instancesCount,
      radiationDoseDlpMgyCm: req.radiationDoseDlpMgyCm,
      contrastAdministeredMl: req.contrastAdministeredMl,
      technologistName: req.technologistName,
      pacsViewerUrl: 'https://pacs.docsearch.internal/viewer',
      pacsSyncStatus: 'SYNCED',
      status: 'ACQUIRED',
      createdAt: new Date().toISOString()
    };
    this.studies.unshift(newStudy);
    return newStudy;
  }

  async createReport(req: CreateRadiologyReportRequest): Promise<RadiologyReportDto> {
    try {
      const res = await apiRequest<RadiologyReportDto>('/api/v1/partner/radiology/reports', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        this.reports.unshift(res.data);
        return res.data;
      }
    } catch {
      // fallback
    }
    const newReport: RadiologyReportDto = {
      id: `rad-rpt-${Date.now()}`,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      reportNumber: `RAD-RPT-${Date.now().toString().slice(-6)}`,
      studyId: req.studyId,
      orderId: req.orderId,
      patientName: req.patientName,
      patientMrn: req.patientMrn,
      modalityType: req.modalityType,
      procedureName: req.procedureName,
      clinicalHistory: req.clinicalHistory,
      imagingTechnique: req.imagingTechnique,
      comparisonStudyReference: req.comparisonStudyReference,
      findings: req.findings,
      impression: req.impression,
      recommendations: req.recommendations,
      hasCriticalFinding: req.hasCriticalFinding,
      reportingRadiologistName: req.reportingRadiologistName,
      status: 'DRAFT',
      version: 1,
      createdAt: new Date().toISOString()
    };
    this.reports.unshift(newReport);
    return newReport;
  }

  async finalizeReport(req: FinalizeRadiologyReportRequest): Promise<RadiologyReportDto> {
    try {
      const res = await apiRequest<RadiologyReportDto>(`/api/v1/partner/radiology/reports/${req.reportId}/finalize`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) return res.data;
    } catch {
      // fallback
    }
    const report = this.reports.find((r) => r.id === req.reportId);
    if (report) {
      report.status = 'FINALIZED';
      report.verifyingRadiologistName = req.verifyingRadiologistName;
      report.finalizedAt = new Date().toISOString();
      return report;
    }
    return {
      id: req.reportId,
      tenantId: req.tenantId,
      partnerId: req.tenantId,
      organizationId: req.tenantId,
      branchId: req.tenantId,
      reportNumber: 'RAD-RPT-FINAL',
      studyId: 'study-001',
      orderId: 'order-001',
      patientName: 'Patient',
      patientMrn: 'MRN-00000',
      modalityType: 'COMPUTED_TOMOGRAPHY_CT',
      procedureName: 'Procedure',
      clinicalHistory: 'History',
      imagingTechnique: 'Technique',
      findings: 'Findings',
      impression: 'Impression',
      hasCriticalFinding: false,
      reportingRadiologistName: req.verifyingRadiologistName,
      verifyingRadiologistName: req.verifyingRadiologistName,
      status: 'FINALIZED',
      version: 1,
      finalizedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
  }

  async amendReport(req: AmendRadiologyReportRequest): Promise<RadiologyReportDto> {
    try {
      const res = await apiRequest<RadiologyReportDto>(`/api/v1/partner/radiology/reports/${req.reportId}/amend`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) return res.data;
    } catch {
      // fallback
    }
    const report = this.reports.find((r) => r.id === req.reportId);
    if (report) {
      report.status = 'AMENDED';
      report.version += 1;
      report.amendmentReason = req.amendmentReason;
      report.findings = req.amendedFindings;
      report.impression = req.amendedImpression;
      report.verifyingRadiologistName = req.reportingRadiologistName;
      report.finalizedAt = new Date().toISOString();
      return report;
    }
    return {
      id: req.reportId,
      tenantId: req.tenantId,
      partnerId: req.tenantId,
      organizationId: req.tenantId,
      branchId: req.tenantId,
      reportNumber: 'RAD-RPT-AMENDED',
      studyId: 'study-001',
      orderId: 'order-001',
      patientName: 'Patient',
      patientMrn: 'MRN-00000',
      modalityType: 'COMPUTED_TOMOGRAPHY_CT',
      procedureName: 'Procedure',
      clinicalHistory: 'History',
      imagingTechnique: 'Technique',
      findings: req.amendedFindings,
      impression: req.amendedImpression,
      hasCriticalFinding: false,
      reportingRadiologistName: req.reportingRadiologistName,
      verifyingRadiologistName: req.reportingRadiologistName,
      status: 'AMENDED',
      version: 2,
      amendmentReason: req.amendmentReason,
      finalizedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
  }

  async recordCriticalFinding(req: RecordCriticalFindingRequest): Promise<RadiologyCriticalFindingDto> {
    try {
      const res = await apiRequest<RadiologyCriticalFindingDto>('/api/v1/partner/radiology/critical-findings', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        this.criticalFindings.unshift(res.data);
        return res.data;
      }
    } catch {
      // fallback
    }
    const newFinding: RadiologyCriticalFindingDto = {
      id: `rad-cf-${Date.now()}`,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      alertCode: `RAD-CRT-${Date.now().toString().slice(-6)}`,
      reportId: req.reportId,
      patientName: req.patientName,
      patientMrn: req.patientMrn,
      orderingDoctorName: req.orderingDoctorName,
      orderingDepartment: req.orderingDepartment,
      findingDescription: req.findingDescription,
      severity: req.severity,
      flaggedByRadiologist: req.flaggedByRadiologist,
      notifiedRecipient: req.notifiedRecipient,
      status: 'FLAGGED_PENDING_NOTIFICATION',
      createdAt: new Date().toISOString()
    };
    this.criticalFindings.unshift(newFinding);
    return newFinding;
  }

  async acknowledgeCriticalFinding(req: AcknowledgeCriticalFindingRequest): Promise<RadiologyCriticalFindingDto> {
    try {
      const res = await apiRequest<RadiologyCriticalFindingDto>(`/api/v1/partner/radiology/critical-findings/${req.alertId}/acknowledge`, {
        method: 'PATCH',
        body: JSON.stringify({
          acknowledgedBy: req.acknowledgedByDoctor,
          acknowledgmentNotes: req.clinicalActionNotes
        })
      });
      if (res.success && res.data) return res.data;
    } catch {
      // fallback
    }
    const finding = this.criticalFindings.find((f) => f.id === req.alertId);
    if (finding) {
      finding.status = 'ACKNOWLEDGED_BY_CLINICIAN';
      finding.acknowledgedBy = req.acknowledgedByDoctor;
      finding.acknowledgedTimestamp = new Date().toISOString();
      return finding;
    }
    return {
      id: req.alertId,
      tenantId: req.tenantId,
      partnerId: req.tenantId,
      organizationId: req.tenantId,
      branchId: req.tenantId,
      alertCode: 'RAD-CRT-ACK',
      reportId: 'report-001',
      patientName: 'Patient',
      patientMrn: 'MRN-00000',
      orderingDoctorName: 'Doctor',
      orderingDepartment: 'Emergency',
      findingDescription: 'Critical Finding',
      severity: 'CRITICAL_IMMEDIATE_LIFE_THREATENING',
      flaggedByRadiologist: 'Radiologist',
      notifiedRecipient: 'Attending Physician',
      status: 'ACKNOWLEDGED_BY_CLINICIAN',
      acknowledgedBy: req.acknowledgedByDoctor,
      acknowledgedTimestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
  }

  async createPacsReference(req: CreatePacsReferenceRequest): Promise<RadiologyStudyDto> {
    const study = this.studies.find((s) => s.id === req.studyId);
    if (study) {
      study.pacsViewerUrl = req.pacsViewerUrl;
      study.pacsSyncStatus = req.syncStatus;
      return study;
    }
    return {
      id: req.studyId,
      tenantId: req.tenantId,
      partnerId: req.tenantId,
      organizationId: req.tenantId,
      branchId: req.tenantId,
      studyInstanceUid: '1.2.840.113619.2.001',
      accessionNumber: 'RAD-ACC-PACS',
      orderId: 'order-001',
      patientName: 'Patient',
      patientMrn: 'MRN-00000',
      modalityType: 'COMPUTED_TOMOGRAPHY_CT',
      studyDescription: 'PACS Study',
      studyDateTime: new Date().toISOString(),
      seriesCount: 2,
      instancesCount: 120,
      technologistName: 'Technologist',
      pacsViewerUrl: req.pacsViewerUrl,
      pacsSyncStatus: req.syncStatus,
      status: 'ACQUIRED',
      createdAt: new Date().toISOString()
    };
  }
}

export const radiologyManagementService: IRadiologyManagementService = new RadiologyManagementService();
