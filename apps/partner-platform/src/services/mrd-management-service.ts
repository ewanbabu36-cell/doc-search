import { apiRequest } from './api-client.js';
import type {
  MRDepartmentDto,
  MedicalRecordIndexDto,
  MedicalRecordCompletionTaskDto,
  ICDCodeItemDto,
  MedicalDiagnosisCodeDto,
  CodingReviewDto,
  ClinicalDocumentationQueryDto,
  ReleaseOfInformationRequestDto,
  LegalRecordRequestDto,
  MedicalRecordLegalHoldDto,
  BirthRegistryRecordDto,
  DeathRegistryRecordDto,
  MedicalRecordAuditTraceDto,
  MRDOverviewMetricsDto,
  MRDAnalyticsDto,
  CreateRecordCompletionTaskRequest,
  CompleteRecordTaskRequest,
  AssignDiagnosisCodeRequest,
  UpdateDiagnosisCodeRequest,
  SubmitCodingReviewRequest,
  CreateClinicalDocumentationQueryRequest,
  ResolveClinicalDocumentationQueryRequest,
  CreateRecordRetrievalRequestRequest,
  CreateROIRequestRequest,
  ApproveROIRequestRequest,
  RejectROIRequestRequest,
  ReleaseMedicalRecordRequest,
  CreateLegalRecordRequestRequest,
  CreateLegalHoldRequest,
  RegisterBirthRecordRequest,
  RegisterDeathRecordRequest
} from '@docsearch/api-contracts';

import {
  mockMRDepartment,
  mockMedicalRecords,
  mockCompletionTasks,
  mockICD10Catalog,
  mockDiagnosisCodes,
  mockCodingReviews,
  mockClinicalQueries,
  mockROIRequests,
  mockLegalRequests,
  mockLegalHolds,
  mockBirthRecords,
  mockMRDDeathRecords,
  mockMRDAuditTraces,
  mockMRDOverviewMetrics,
  mockMRDAnalytics
} from './mock-mrd-data.js';

export interface IMrdManagementService {
  getOverviewMetrics(tenantId: string): Promise<MRDOverviewMetricsDto>;
  getAnalytics(tenantId: string): Promise<MRDAnalyticsDto>;
  getDepartment(tenantId: string): Promise<MRDepartmentDto>;
  getRecords(tenantId: string): Promise<MedicalRecordIndexDto[]>;
  getCompletionTasks(tenantId: string): Promise<MedicalRecordCompletionTaskDto[]>;
  getICD10Catalog(): Promise<ICDCodeItemDto[]>;
  getDiagnosisCodes(tenantId: string): Promise<MedicalDiagnosisCodeDto[]>;
  getCodingReviews(tenantId: string): Promise<CodingReviewDto[]>;
  getClinicalQueries(tenantId: string): Promise<ClinicalDocumentationQueryDto[]>;
  getROIRequests(tenantId: string): Promise<ReleaseOfInformationRequestDto[]>;
  getLegalRequests(tenantId: string): Promise<LegalRecordRequestDto[]>;
  getLegalHolds(tenantId: string): Promise<MedicalRecordLegalHoldDto[]>;
  getBirthRecords(tenantId: string): Promise<BirthRegistryRecordDto[]>;
  getDeathRecords(tenantId: string): Promise<DeathRegistryRecordDto[]>;
  getAuditTraces(tenantId: string): Promise<MedicalRecordAuditTraceDto[]>;

  createCompletionTask(req: CreateRecordCompletionTaskRequest): Promise<MedicalRecordCompletionTaskDto>;
  completeRecordTask(req: CompleteRecordTaskRequest): Promise<MedicalRecordCompletionTaskDto>;
  assignDiagnosisCode(req: AssignDiagnosisCodeRequest): Promise<MedicalDiagnosisCodeDto>;
  updateDiagnosisCode(req: UpdateDiagnosisCodeRequest): Promise<MedicalDiagnosisCodeDto>;
  submitCodingReview(req: SubmitCodingReviewRequest): Promise<CodingReviewDto>;
  createClinicalQuery(req: CreateClinicalDocumentationQueryRequest): Promise<ClinicalDocumentationQueryDto>;
  resolveClinicalQuery(req: ResolveClinicalDocumentationQueryRequest): Promise<ClinicalDocumentationQueryDto>;
  createRecordRetrieval(req: CreateRecordRetrievalRequestRequest): Promise<void>;
  createROIRequest(req: CreateROIRequestRequest): Promise<ReleaseOfInformationRequestDto>;
  approveROIRequest(req: ApproveROIRequestRequest): Promise<ReleaseOfInformationRequestDto>;
  rejectROIRequest(req: RejectROIRequestRequest): Promise<ReleaseOfInformationRequestDto>;
  releaseMedicalRecord(req: ReleaseMedicalRecordRequest): Promise<ReleaseOfInformationRequestDto>;
  createLegalRequest(req: CreateLegalRecordRequestRequest): Promise<LegalRecordRequestDto>;
  createLegalHold(req: CreateLegalHoldRequest): Promise<MedicalRecordLegalHoldDto>;
  registerBirthRecord(req: RegisterBirthRecordRequest): Promise<BirthRegistryRecordDto>;
  registerDeathRecord(req: RegisterDeathRecordRequest): Promise<DeathRegistryRecordDto>;
}

export class MockMrdManagementService implements IMrdManagementService {
  private department: MRDepartmentDto = { ...mockMRDepartment };
  private records: MedicalRecordIndexDto[] = [...mockMedicalRecords];
  private completionTasks: MedicalRecordCompletionTaskDto[] = [...mockCompletionTasks];
  private diagnosisCodes: MedicalDiagnosisCodeDto[] = [...mockDiagnosisCodes];
  private codingReviews: CodingReviewDto[] = [...mockCodingReviews];
  private clinicalQueries: ClinicalDocumentationQueryDto[] = [...mockClinicalQueries];
  private roiRequests: ReleaseOfInformationRequestDto[] = [...mockROIRequests];
  private legalRequests: LegalRecordRequestDto[] = [...mockLegalRequests];
  private legalHolds: MedicalRecordLegalHoldDto[] = [...mockLegalHolds];
  private birthRecords: BirthRegistryRecordDto[] = [...mockBirthRecords];
  private deathRecords: DeathRegistryRecordDto[] = [...mockMRDDeathRecords];
  private auditTraces: MedicalRecordAuditTraceDto[] = [...mockMRDAuditTraces];

  private addTrace(actorName: string, actorRole: string, action: string, entityType: string, entityCode: string, justification: string) {
    const trace: MedicalRecordAuditTraceDto = {
      id: 'maud-' + Math.random().toString(36).substring(2, 9),
      tenantId: '11111111-1111-4111-8111-111111111111',
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      traceNumber: `TRACE-MRD-${Date.now().toString().slice(-8)}`,
      actorId: 'usr-mrd-staff',
      actorName,
      actorRole,
      action,
      entityType,
      entityId: entityCode,
      entityCode,
      justification,
      ipAddress: '127.0.0.1',
      integrityHash: 'sha256-' + Math.random().toString(36).substring(2, 18),
      previousHash: 'sha256-genesis',
      newState: { status: action, entityCode },
      timestamp: new Date().toISOString()
    };
    this.auditTraces.unshift(trace);
  }

  async getOverviewMetrics(tenantId: string): Promise<MRDOverviewMetricsDto> {
    const records = this.records.filter((r) => r.tenantId === tenantId);
    const incompleteChartsCount = records.filter((r) => r.completionStatus === 'INCOMPLETE' || r.completionStatus === 'OPEN').length;
    const pendingCodingQueueCount = records.filter((r) => r.codingStatus === 'PENDING_INITIAL_CODE' || r.codingStatus === 'CODED_AWAITING_REVIEW').length;
    const activeQueriesCount = this.clinicalQueries.filter((q) => q.tenantId === tenantId && (q.status === 'OPEN' || q.status === 'SENT_TO_CLINICIAN')).length;
    const pendingROIRequestsCount = this.roiRequests.filter((roi) => roi.tenantId === tenantId && (roi.status === 'REQUESTED' || roi.status === 'UNDER_LEGAL_REVIEW')).length;
    const activeLegalHoldsCount = this.legalHolds.filter((lh) => lh.tenantId === tenantId && lh.status === 'ACTIVE_LEGAL_HOLD').length;

    return {
      ...mockMRDOverviewMetrics,
      totalActiveRecords: records.length,
      incompleteChartsCount,
      pendingCodingQueueCount,
      activeQueriesCount,
      pendingROIRequestsCount,
      activeLegalHoldsCount
    };
  }

  async getAnalytics(_tenantId: string): Promise<MRDAnalyticsDto> {
    return { ...mockMRDAnalytics };
  }

  async getDepartment(tenantId: string): Promise<MRDepartmentDto> {
    return { ...this.department, tenantId };
  }

  async getRecords(tenantId: string): Promise<MedicalRecordIndexDto[]> {
    try {
      const res = await apiRequest<MedicalRecordIndexDto[]>('/api/v1/partner/mrd/records');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    return this.records.filter((r) => r.tenantId === tenantId);
  }

  async getCompletionTasks(tenantId: string): Promise<MedicalRecordCompletionTaskDto[]> {
    return this.completionTasks.filter((t) => t.tenantId === tenantId);
  }

  async getICD10Catalog(): Promise<ICDCodeItemDto[]> {
    try {
      const res = await apiRequest<ICDCodeItemDto[]>('/api/v1/partner/mrd/icd10/search');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    return [...mockICD10Catalog];
  }

  async getDiagnosisCodes(tenantId: string): Promise<MedicalDiagnosisCodeDto[]> {
    return this.diagnosisCodes.filter((d) => d.tenantId === tenantId);
  }

  async getCodingReviews(tenantId: string): Promise<CodingReviewDto[]> {
    return this.codingReviews.filter((c) => c.tenantId === tenantId);
  }

  async getClinicalQueries(tenantId: string): Promise<ClinicalDocumentationQueryDto[]> {
    return this.clinicalQueries.filter((q) => q.tenantId === tenantId);
  }

  async getROIRequests(tenantId: string): Promise<ReleaseOfInformationRequestDto[]> {
    return this.roiRequests.filter((r) => r.tenantId === tenantId);
  }

  async getLegalRequests(tenantId: string): Promise<LegalRecordRequestDto[]> {
    return this.legalRequests.filter((l) => l.tenantId === tenantId);
  }

  async getLegalHolds(tenantId: string): Promise<MedicalRecordLegalHoldDto[]> {
    return this.legalHolds.filter((h) => h.tenantId === tenantId);
  }

  async getBirthRecords(tenantId: string): Promise<BirthRegistryRecordDto[]> {
    return this.birthRecords.filter((b) => b.tenantId === tenantId);
  }

  async getDeathRecords(tenantId: string): Promise<DeathRegistryRecordDto[]> {
    return this.deathRecords.filter((d) => d.tenantId === tenantId);
  }

  async getAuditTraces(tenantId: string): Promise<MedicalRecordAuditTraceDto[]> {
    return this.auditTraces.filter((a) => a.tenantId === tenantId);
  }

  async createCompletionTask(req: CreateRecordCompletionTaskRequest): Promise<MedicalRecordCompletionTaskDto> {
    const newTask: MedicalRecordCompletionTaskDto = {
      id: 'task-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      recordId: req.recordId,
      taskCode: `DEF-${Date.now().toString().slice(-6)}`,
      deficiencyType: req.deficiencyType,
      responsibleStaffName: req.responsibleStaffName,
      responsibleStaffRole: req.responsibleStaffRole,
      description: req.description,
      dueDate: req.dueDate,
      isResolved: false,
      createdAt: new Date().toISOString()
    };
    this.completionTasks.unshift(newTask);

    const rec = this.records.find((r) => r.id === req.recordId);
    if (rec && rec.completionStatus === 'COMPLETED') {
      rec.completionStatus = 'INCOMPLETE';
      rec.updatedAt = new Date().toISOString();
    }
    this.addTrace(req.responsibleStaffName, 'HIM_ANALYST', 'CREATE_DEFICIENCY_TASK', 'RECORD_TASK', newTask.taskCode, req.description);
    return newTask;
  }

  async completeRecordTask(req: CompleteRecordTaskRequest): Promise<MedicalRecordCompletionTaskDto> {
    const task = this.completionTasks.find((t) => t.id === req.taskId);
    if (!task) throw new Error('Completion task not found');

    task.isResolved = true;
    task.resolvedAt = new Date().toISOString();
    task.resolvedByStaff = req.resolvedByStaff;
    task.notes = req.notes;

    const remaining = this.completionTasks.filter((t) => t.recordId === task.recordId && !t.isResolved);
    if (remaining.length === 0) {
      const rec = this.records.find((r) => r.id === task.recordId);
      if (rec) {
        rec.completionStatus = 'COMPLETED';
        rec.updatedAt = new Date().toISOString();
      }
    }
    this.addTrace(req.resolvedByStaff, 'CLINICAL_STAFF', 'RESOLVE_DEFICIENCY_TASK', 'RECORD_TASK', task.taskCode, req.notes || 'Deficiency resolved');
    return task;
  }

  async assignDiagnosisCode(req: AssignDiagnosisCodeRequest): Promise<MedicalDiagnosisCodeDto> {
    try {
      const res = await apiRequest<MedicalDiagnosisCodeDto>(`/api/v1/partner/mrd/records/${req.recordId}/diagnoses`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    const newCode: MedicalDiagnosisCodeDto = {
      id: 'mdc-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      recordId: req.recordId,
      icdCode: req.icdCode,
      icdDescription: req.icdDescription,
      codeType: req.codeType,
      poaIndicator: req.poaIndicator,
      sequencingOrder: req.sequencingOrder,
      assignedByCoder: req.assignedByCoder,
      coderNotes: req.coderNotes,
      createdAt: new Date().toISOString()
    };
    this.diagnosisCodes.unshift(newCode);

    const rec = this.records.find((r) => r.id === req.recordId);
    if (rec) {
      rec.codingStatus = 'CODED_AWAITING_REVIEW';
      rec.updatedAt = new Date().toISOString();
    }
    this.addTrace(req.assignedByCoder, 'CODING_SPECIALIST', 'ASSIGN_ICD10_CODE', 'DIAGNOSIS_CODE', req.icdCode, `Assigned ${req.icdCode} as ${req.codeType}`);
    return newCode;
  }

  async updateDiagnosisCode(req: UpdateDiagnosisCodeRequest): Promise<MedicalDiagnosisCodeDto> {
    const code = this.diagnosisCodes.find((d) => d.id === req.diagnosisId);
    if (!code) throw new Error('Diagnosis code not found');

    code.icdCode = req.icdCode;
    code.icdDescription = req.icdDescription;
    code.codeType = req.codeType;
    code.poaIndicator = req.poaIndicator;

    this.addTrace(req.updatedByCoder, 'CODING_SPECIALIST', 'REVISE_ICD10_CODE', 'DIAGNOSIS_CODE', req.icdCode, req.reasonForRevision);
    return code;
  }

  async submitCodingReview(req: SubmitCodingReviewRequest): Promise<CodingReviewDto> {
    try {
      const res = await apiRequest<CodingReviewDto>(`/api/v1/partner/mrd/records/${req.recordId}/reviews`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    const newReview: CodingReviewDto = {
      id: 'cr-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      recordId: req.recordId,
      reviewNumber: `REV-${Date.now().toString().slice(-6)}`,
      reviewerName: req.reviewerName,
      reviewerRole: req.reviewerRole,
      reviewLevel: req.reviewLevel,
      status: req.status,
      findingsAndErrorsNotes: req.findingsAndErrorsNotes,
      codingAccuracyScorePercent: req.codingAccuracyScorePercent,
      reviewedAt: new Date().toISOString()
    };
    this.codingReviews.unshift(newReview);

    const rec = this.records.find((r) => r.id === req.recordId);
    if (rec) {
      rec.codingStatus = req.status;
      rec.updatedAt = new Date().toISOString();
    }
    this.addTrace(req.reviewerName, 'CODING_AUDITOR', 'SUBMIT_CODING_REVIEW', 'CODING_REVIEW', newReview.reviewNumber, req.findingsAndErrorsNotes);
    return newReview;
  }

  async createClinicalQuery(req: CreateClinicalDocumentationQueryRequest): Promise<ClinicalDocumentationQueryDto> {
    const newQuery: ClinicalDocumentationQueryDto = {
      id: 'cdq-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      recordId: req.recordId,
      queryNumber: `CDQ-${Date.now().toString().slice(-6)}`,
      queryTitle: req.queryTitle,
      initiatedByCoder: req.initiatedByCoder,
      assignedDoctorName: req.assignedDoctorName,
      clinicalReason: req.clinicalReason,
      supportingDocumentationSnippet: req.supportingDocumentationSnippet,
      status: 'SENT_TO_CLINICIAN',
      initiatedAt: new Date().toISOString()
    };
    this.clinicalQueries.unshift(newQuery);
    this.addTrace(req.initiatedByCoder, 'CODING_SPECIALIST', 'INITIATE_CLINICAL_QUERY', 'CLINICAL_QUERY', newQuery.queryNumber, req.clinicalReason);
    return newQuery;
  }

  async resolveClinicalQuery(req: ResolveClinicalDocumentationQueryRequest): Promise<ClinicalDocumentationQueryDto> {
    const query = this.clinicalQueries.find((q) => q.id === req.queryId);
    if (!query) throw new Error('Clinical documentation query not found');

    query.clinicianClarificationResponse = req.clinicianClarificationResponse;
    query.status = req.status;
    query.respondedAt = new Date().toISOString();

    this.addTrace(req.resolvedByDoctor, 'ATTENDING_PHYSICIAN', 'RESPOND_CLINICAL_QUERY', 'CLINICAL_QUERY', query.queryNumber, req.clinicianClarificationResponse);
    return query;
  }

  async createRecordRetrieval(req: CreateRecordRetrievalRequestRequest): Promise<void> {
    this.addTrace(req.requestedByStaff, 'HIM_OFFICER', 'RETRIEVE_PHYSICAL_RECORD', 'MEDICAL_RECORD', req.recordId, `Department: ${req.departmentPurpose}`);
  }

  async createROIRequest(req: CreateROIRequestRequest): Promise<ReleaseOfInformationRequestDto> {
    const newROI: ReleaseOfInformationRequestDto = {
      id: 'roi-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      requestNumber: `ROI-${Date.now().toString().slice(-6)}`,
      recordId: req.recordId,
      patientName: req.patientName,
      patientMrn: req.patientMrn,
      requestType: req.requestType,
      requestorName: req.requestorName,
      requestorOrganization: req.requestorOrganization,
      purposeOfRequest: req.purposeOfRequest,
      status: 'REQUESTED',
      deliveryMethod: req.deliveryMethod,
      requestedAt: new Date().toISOString()
    };
    this.roiRequests.unshift(newROI);
    this.addTrace(req.requestorName, 'ROI_APPLICANT', 'SUBMIT_ROI_REQUEST', 'ROI_REQUEST', newROI.requestNumber, req.purposeOfRequest);
    return newROI;
  }

  async approveROIRequest(req: ApproveROIRequestRequest): Promise<ReleaseOfInformationRequestDto> {
    const roi = this.roiRequests.find((r) => r.id === req.requestId);
    if (!roi) throw new Error('ROI request not found');

    roi.status = 'APPROVED';
    roi.authorizedByOfficer = req.authorizedByOfficer;

    this.addTrace(req.authorizedByOfficer, 'HIM_OFFICER', 'APPROVE_ROI_REQUEST', 'ROI_REQUEST', roi.requestNumber, req.notes || 'Identity and authorization verified');
    return roi;
  }

  async rejectROIRequest(req: RejectROIRequestRequest): Promise<ReleaseOfInformationRequestDto> {
    const roi = this.roiRequests.find((r) => r.id === req.requestId);
    if (!roi) throw new Error('ROI request not found');

    roi.status = 'REJECTED';
    this.addTrace(req.rejectedByOfficer, 'HIM_OFFICER', 'REJECT_ROI_REQUEST', 'ROI_REQUEST', roi.requestNumber, req.rejectionReason);
    return roi;
  }

  async releaseMedicalRecord(req: ReleaseMedicalRecordRequest): Promise<ReleaseOfInformationRequestDto> {
    const roi = this.roiRequests.find((r) => r.id === req.requestId);
    if (!roi) throw new Error('ROI request not found');

    roi.status = 'DISCLOSED_AND_RELEASED';
    roi.releasedAt = new Date().toISOString();

    this.addTrace(req.releasedByOfficer, 'HIM_OFFICER', 'DISCLOSE_MEDICAL_RECORD', 'ROI_REQUEST', roi.requestNumber, req.releaseNotes);
    return roi;
  }

  async createLegalRequest(req: CreateLegalRecordRequestRequest): Promise<LegalRecordRequestDto> {
    const newLegal: LegalRecordRequestDto = {
      id: 'lrr-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      legalRequestNumber: `LEGAL-${Date.now().toString().slice(-6)}`,
      recordId: req.recordId,
      patientName: req.patientName,
      courtOrAgencyName: req.courtOrAgencyName,
      legalNoticeReferenceNumber: req.legalNoticeReferenceNumber,
      officerInChargeName: req.officerInChargeName,
      subpoenaDetails: req.subpoenaDetails,
      isPreservationOrder: req.isPreservationOrder,
      legalHoldApplied: req.isPreservationOrder,
      servedAt: new Date().toISOString()
    };
    this.legalRequests.unshift(newLegal);

    if (req.isPreservationOrder) {
      const rec = this.records.find((r) => r.id === req.recordId);
      if (rec) {
        rec.isLegalHoldActive = true;
        rec.updatedAt = new Date().toISOString();
      }
    }
    this.addTrace(req.officerInChargeName, 'LEGAL_OFFICER', 'SERVE_LEGAL_REQUEST', 'LEGAL_REQUEST', newLegal.legalRequestNumber, req.subpoenaDetails);
    return newLegal;
  }

  async createLegalHold(req: CreateLegalHoldRequest): Promise<MedicalRecordLegalHoldDto> {
    const newHold: MedicalRecordLegalHoldDto = {
      id: 'mrlh-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      holdCode: `HOLD-${Date.now().toString().slice(-6)}`,
      recordId: req.recordId,
      patientName: req.patientName,
      legalMatterTitle: req.legalMatterTitle,
      reasonForHold: req.reasonForHold,
      authorizedByLegalCounsel: req.authorizedByLegalCounsel,
      status: 'ACTIVE_LEGAL_HOLD',
      appliedAt: new Date().toISOString()
    };
    this.legalHolds.unshift(newHold);

    const rec = this.records.find((r) => r.id === req.recordId);
    if (rec) {
      rec.isLegalHoldActive = true;
      rec.updatedAt = new Date().toISOString();
    }
    this.addTrace(req.authorizedByLegalCounsel, 'HOSPITAL_LEGAL_COUNSEL', 'APPLY_LEGAL_HOLD', 'LEGAL_HOLD', newHold.holdCode, req.reasonForHold);
    return newHold;
  }

  async registerBirthRecord(req: RegisterBirthRecordRequest): Promise<BirthRegistryRecordDto> {
    const newBirth: BirthRegistryRecordDto = {
      id: 'brr-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      birthRegistrationNumber: `BR-${Date.now().toString().slice(-6)}`,
      motherEncounterId: req.motherEncounterId,
      motherPatientName: req.motherPatientName,
      motherMrn: req.motherMrn,
      babyNameOrIdentifier: req.babyNameOrIdentifier,
      birthTimestamp: req.birthTimestamp,
      deliveryType: req.deliveryType,
      gender: req.gender,
      birthWeightKg: req.birthWeightKg,
      attendingObstetrician: req.attendingObstetrician,
      attendingPaediatrician: req.attendingPaediatrician,
      birthCertificateReferenceNumber: `MUNI-BR-${Date.now().toString().slice(-6)}`,
      governmentPortalNotified: true,
      createdAt: new Date().toISOString()
    };
    this.birthRecords.unshift(newBirth);
    this.addTrace(req.attendingObstetrician, 'ATTENDING_OBSTETRICIAN', 'REGISTER_BIRTH', 'BIRTH_RECORD', newBirth.birthRegistrationNumber, `Baby: ${req.babyNameOrIdentifier}`);
    return newBirth;
  }

  async registerDeathRecord(req: RegisterDeathRecordRequest): Promise<DeathRegistryRecordDto> {
    const newDeath: DeathRegistryRecordDto = {
      id: 'drr-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      deathRegistrationNumber: `DR-${Date.now().toString().slice(-6)}`,
      encounterId: req.encounterId,
      patientName: req.patientName,
      patientMrn: req.patientMrn,
      declaredDeadTimestamp: req.declaredDeadTimestamp,
      declaringPhysician: req.declaringPhysician,
      primaryCauseOfDeath: req.primaryCauseOfDeath,
      secondaryCauses: req.secondaryCauses,
      deathCertificateNumber: req.deathCertificateNumber,
      coronerPoliceInformed: req.coronerPoliceInformed,
      statutoryDeathPortalNotified: true,
      createdAt: new Date().toISOString()
    };
    this.deathRecords.unshift(newDeath);
    this.addTrace(req.declaringPhysician, 'DECLARING_PHYSICIAN', 'REGISTER_DEATH_CERTIFICATE', 'DEATH_RECORD', newDeath.deathRegistrationNumber, req.primaryCauseOfDeath);
    return newDeath;
  }
}

export const mrdManagementService = new MockMrdManagementService();
