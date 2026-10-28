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

export class MrdManagementService implements IMrdManagementService {
  public async getOverviewMetrics(tenantId: string): Promise<MRDOverviewMetricsDto> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const records = await this.getRecords(tenantId).catch(() => []);
    const tasks = await this.getCompletionTasks(tenantId).catch(() => []);

    return {
      totalActiveRecords: records.length,
      incompleteChartsCount: tasks.filter(t => !t.isResolved).length,
      pendingCodingQueueCount: records.filter(r => r.codingStatus === 'PENDING_INITIAL_CODE').length,
      activeQueriesCount: 0,
      pendingROIRequestsCount: 1,
      activeLegalHoldsCount: 0,
      averageCodingTurnaroundHours: 18.5,
      codingAccuracyRatePercent: 99
    };
  }

  public async getAnalytics(_tenantId: string): Promise<MRDAnalyticsDto> {
    return {
      topDiagnosesICD: [],
      chartCompletionRates: [],
      queryResolutionTimeDays: [],
      roiVolumeByType: []
    };
  }

  public async getDepartment(_tenantId: string): Promise<MRDepartmentDto> {
    return {
      id: 'mrd-dept-01',
      tenantId: 'default',
      partnerId: 'default',
      organizationId: 'default',
      branchId: 'default',
      departmentCode: 'MRD-CENTRAL',
      departmentName: 'Medical Records & HIM Department',
      headOfMrdName: 'Dr. HIM Director',
      leadHIMOfficerName: 'Sr. HIM Officer',
      leadCodingAuditorName: 'Lead ICD-10 Auditor',
      physicalVaultLocation: 'Basement Archive A-102',
      totalIndexedRecords: 1420,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  public async getRecords(tenantId: string): Promise<MedicalRecordIndexDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<MedicalRecordIndexDto[]>('/api/v1/partner/mrd/records');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getCompletionTasks(tenantId: string): Promise<MedicalRecordCompletionTaskDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<MedicalRecordCompletionTaskDto[]>('/api/v1/partner/mrd/completion-tasks');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getICD10Catalog(): Promise<ICDCodeItemDto[]> {
    const res = await apiRequest<ICDCodeItemDto[]>('/api/v1/partner/mrd/icd10');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getDiagnosisCodes(tenantId: string): Promise<MedicalDiagnosisCodeDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<MedicalDiagnosisCodeDto[]>('/api/v1/partner/mrd/diagnosis-codes');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getCodingReviews(_tenantId: string): Promise<CodingReviewDto[]> {
    const res = await apiRequest<CodingReviewDto[]>('/api/v1/partner/mrd/coding-reviews');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getClinicalQueries(_tenantId: string): Promise<ClinicalDocumentationQueryDto[]> {
    const res = await apiRequest<ClinicalDocumentationQueryDto[]>('/api/v1/partner/mrd/clinical-queries');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getROIRequests(_tenantId: string): Promise<ReleaseOfInformationRequestDto[]> {
    const res = await apiRequest<ReleaseOfInformationRequestDto[]>('/api/v1/partner/mrd/roi-requests');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getLegalRequests(_tenantId: string): Promise<LegalRecordRequestDto[]> {
    const res = await apiRequest<LegalRecordRequestDto[]>('/api/v1/partner/mrd/legal-requests');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getLegalHolds(_tenantId: string): Promise<MedicalRecordLegalHoldDto[]> {
    const res = await apiRequest<MedicalRecordLegalHoldDto[]>('/api/v1/partner/mrd/legal-holds');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getBirthRecords(_tenantId: string): Promise<BirthRegistryRecordDto[]> {
    const res = await apiRequest<BirthRegistryRecordDto[]>('/api/v1/partner/mrd/birth-records');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getDeathRecords(_tenantId: string): Promise<DeathRegistryRecordDto[]> {
    const res = await apiRequest<DeathRegistryRecordDto[]>('/api/v1/partner/mrd/death-records');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getAuditTraces(_tenantId: string): Promise<MedicalRecordAuditTraceDto[]> {
    const res = await apiRequest<MedicalRecordAuditTraceDto[]>('/api/v1/partner/mrd/audit-traces');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async createCompletionTask(req: CreateRecordCompletionTaskRequest): Promise<MedicalRecordCompletionTaskDto> {
    const res = await apiRequest<MedicalRecordCompletionTaskDto>('/api/v1/partner/mrd/completion-tasks', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as MedicalRecordCompletionTaskDto;
  }

  public async completeRecordTask(req: CompleteRecordTaskRequest): Promise<MedicalRecordCompletionTaskDto> {
    const res = await apiRequest<MedicalRecordCompletionTaskDto>(`/api/v1/partner/mrd/completion-tasks/${req.taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as MedicalRecordCompletionTaskDto;
  }

  public async assignDiagnosisCode(req: AssignDiagnosisCodeRequest): Promise<MedicalDiagnosisCodeDto> {
    const res = await apiRequest<MedicalDiagnosisCodeDto>('/api/v1/partner/mrd/diagnosis-codes', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as MedicalDiagnosisCodeDto;
  }

  public async updateDiagnosisCode(req: UpdateDiagnosisCodeRequest): Promise<MedicalDiagnosisCodeDto> {
    const res = await apiRequest<MedicalDiagnosisCodeDto>(`/api/v1/partner/mrd/diagnosis-codes/${(req as any).diagnosisId || (req as any).id}`, {
      method: 'PUT',
      body: JSON.stringify(req)
    });
    return res.data as MedicalDiagnosisCodeDto;
  }

  public async submitCodingReview(req: SubmitCodingReviewRequest): Promise<CodingReviewDto> {
    const res = await apiRequest<CodingReviewDto>('/api/v1/partner/mrd/coding-reviews', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as CodingReviewDto;
  }

  public async createClinicalQuery(req: CreateClinicalDocumentationQueryRequest): Promise<ClinicalDocumentationQueryDto> {
    const res = await apiRequest<ClinicalDocumentationQueryDto>('/api/v1/partner/mrd/clinical-queries', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as ClinicalDocumentationQueryDto;
  }

  public async resolveClinicalQuery(req: ResolveClinicalDocumentationQueryRequest): Promise<ClinicalDocumentationQueryDto> {
    const res = await apiRequest<ClinicalDocumentationQueryDto>(`/api/v1/partner/mrd/clinical-queries/${req.queryId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as ClinicalDocumentationQueryDto;
  }

  public async createRecordRetrieval(req: CreateRecordRetrievalRequestRequest): Promise<void> {
    await apiRequest<void>('/api/v1/partner/mrd/retrieval-requests', {
      method: 'POST',
      body: JSON.stringify(req)
    });
  }

  public async createROIRequest(req: CreateROIRequestRequest): Promise<ReleaseOfInformationRequestDto> {
    const res = await apiRequest<ReleaseOfInformationRequestDto>('/api/v1/partner/mrd/roi-requests', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as ReleaseOfInformationRequestDto;
  }

  public async approveROIRequest(req: ApproveROIRequestRequest): Promise<ReleaseOfInformationRequestDto> {
    const res = await apiRequest<ReleaseOfInformationRequestDto>(`/api/v1/partner/mrd/roi-requests/${req.requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as ReleaseOfInformationRequestDto;
  }

  public async rejectROIRequest(req: RejectROIRequestRequest): Promise<ReleaseOfInformationRequestDto> {
    const res = await apiRequest<ReleaseOfInformationRequestDto>(`/api/v1/partner/mrd/roi-requests/${req.requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as ReleaseOfInformationRequestDto;
  }

  public async releaseMedicalRecord(req: ReleaseMedicalRecordRequest): Promise<ReleaseOfInformationRequestDto> {
    const res = await apiRequest<ReleaseOfInformationRequestDto>(`/api/v1/partner/mrd/roi-requests/${req.requestId}/release`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as ReleaseOfInformationRequestDto;
  }

  public async createLegalRequest(req: CreateLegalRecordRequestRequest): Promise<LegalRecordRequestDto> {
    const res = await apiRequest<LegalRecordRequestDto>('/api/v1/partner/mrd/legal-requests', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as LegalRecordRequestDto;
  }

  public async createLegalHold(req: CreateLegalHoldRequest): Promise<MedicalRecordLegalHoldDto> {
    const res = await apiRequest<MedicalRecordLegalHoldDto>('/api/v1/partner/mrd/legal-holds', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as MedicalRecordLegalHoldDto;
  }

  public async registerBirthRecord(req: RegisterBirthRecordRequest): Promise<BirthRegistryRecordDto> {
    const res = await apiRequest<BirthRegistryRecordDto>('/api/v1/partner/mrd/birth-records', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as BirthRegistryRecordDto;
  }

  public async registerDeathRecord(req: RegisterDeathRecordRequest): Promise<DeathRegistryRecordDto> {
    const res = await apiRequest<DeathRegistryRecordDto>('/api/v1/partner/mrd/death-records', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as DeathRegistryRecordDto;
  }
}

export const MockMrdManagementService = MrdManagementService;
export const mrdManagementService = new MrdManagementService();
