import { apiRequest } from './api-client.js';
import type {
  InpatientOverviewMetricsDto,
  InpatientAnalyticsDto,
  InpatientUnitDto,
  InpatientWardDto,
  InpatientBedDto,
  InpatientAdmissionRequestDto,
  InpatientAdmissionDto,
  InpatientTransferDto,
  InpatientNursingAssessmentDto,
  InpatientVitalObservationDto,
  InpatientDoctorRoundDto,
  InpatientDischargePlanDto,
  InpatientDischargeSummaryDto,
  InpatientBedTurnaroundDto,
  InpatientBedBlockDto,
  InpatientAuditTraceDto,
  CreateWardRequest,
  UpdateWardRequest,
  CreateBedRequest,
  UpdateBedRequest,
  BlockBedRequest,
  CreateBedReservationRequest,
  CancelBedReservationRequest,
  CreateAdmissionRequest,
  ApproveAdmissionRequest,
  RejectAdmissionRequest,
  CancelAdmissionRequest,
  AllocateBedRequest,
  CreateTransferRequest,
  ApproveTransferRequest,
  CompleteTransferRequest,
  RecordNursingAssessmentRequest,
  RecordNursingNoteRequest,
  RecordCarePlanRequest,
  RecordVitalObservationRequest,
  RecordDoctorRoundRequest,
  CreateDischargePlanRequest,
  RequestDischargeRequest,
  ApproveDischargeRequest,
  CompleteDischargeRequest,
  FinalizeDischargeSummaryRequest,
  ReleaseBedRequest,
  CompleteCleaningRequest
} from '@docsearch/api-contracts';

import {
  mockInpatientUnits,
  mockInpatientWards,
  mockInpatientBeds,
  mockInpatientAdmissionRequests,
  mockInpatientAdmissions,
  mockInpatientTransfers,
  mockInpatientNursingAssessments,
  mockInpatientVitalObservations,
  mockInpatientDoctorRounds,
  mockInpatientDischargePlans,
  mockInpatientDischargeSummaries,
  mockInpatientBedTurnarounds,
  mockInpatientBedBlocks,
  mockInpatientAuditTraces,
  mockInpatientOverviewMetrics,
  mockInpatientAnalytics
} from './mock-inpatient-data.js';

export interface IInpatientManagementService {
  getOverviewMetrics(tenantId: string): Promise<InpatientOverviewMetricsDto>;
  getAnalytics(tenantId: string): Promise<InpatientAnalyticsDto>;
  getUnits(tenantId: string): Promise<InpatientUnitDto[]>;
  getWards(tenantId: string): Promise<InpatientWardDto[]>;
  getBeds(tenantId: string): Promise<InpatientBedDto[]>;
  getAdmissionRequests(tenantId: string): Promise<InpatientAdmissionRequestDto[]>;
  getAdmissions(tenantId: string): Promise<InpatientAdmissionDto[]>;
  getTransfers(tenantId: string): Promise<InpatientTransferDto[]>;
  getNursingAssessments(tenantId: string): Promise<InpatientNursingAssessmentDto[]>;
  getVitalObservations(tenantId: string): Promise<InpatientVitalObservationDto[]>;
  getDoctorRounds(tenantId: string): Promise<InpatientDoctorRoundDto[]>;
  getDischargePlans(tenantId: string): Promise<InpatientDischargePlanDto[]>;
  getDischargeSummaries(tenantId: string): Promise<InpatientDischargeSummaryDto[]>;
  getBedTurnarounds(tenantId: string): Promise<InpatientBedTurnaroundDto[]>;
  getBedBlocks(tenantId: string): Promise<InpatientBedBlockDto[]>;
  getAuditTraces(tenantId: string): Promise<InpatientAuditTraceDto[]>;
  createWard(req: CreateWardRequest): Promise<InpatientWardDto>;
  updateWard(req: UpdateWardRequest): Promise<InpatientWardDto>;
  createBed(req: CreateBedRequest): Promise<InpatientBedDto>;
  updateBed(req: UpdateBedRequest): Promise<InpatientBedDto>;
  blockBed(req: BlockBedRequest): Promise<InpatientBedDto>;
  createBedReservation(req: CreateBedReservationRequest): Promise<InpatientBedDto>;
  cancelBedReservation(req: CancelBedReservationRequest): Promise<InpatientBedDto>;
  createAdmissionRequest(req: CreateAdmissionRequest): Promise<InpatientAdmissionRequestDto>;
  approveAdmission(req: ApproveAdmissionRequest): Promise<InpatientAdmissionDto>;
  rejectAdmission(req: RejectAdmissionRequest): Promise<InpatientAdmissionRequestDto>;
  cancelAdmission(req: CancelAdmissionRequest): Promise<InpatientAdmissionRequestDto>;
  allocateBed(req: AllocateBedRequest): Promise<InpatientAdmissionDto>;
  createTransfer(req: CreateTransferRequest): Promise<InpatientTransferDto>;
  approveTransfer(req: ApproveTransferRequest): Promise<InpatientTransferDto>;
  completeTransfer(req: CompleteTransferRequest): Promise<InpatientTransferDto>;
  recordNursingAssessment(req: RecordNursingAssessmentRequest): Promise<InpatientNursingAssessmentDto>;
  recordNursingNote(req: RecordNursingNoteRequest): Promise<void>;
  recordCarePlan(req: RecordCarePlanRequest): Promise<void>;
  recordVitalObservation(req: RecordVitalObservationRequest): Promise<InpatientVitalObservationDto>;
  recordDoctorRound(req: RecordDoctorRoundRequest): Promise<InpatientDoctorRoundDto>;
  createDischargePlan(req: CreateDischargePlanRequest): Promise<InpatientDischargePlanDto>;
  requestDischarge(req: RequestDischargeRequest): Promise<void>;
  approveDischarge(req: ApproveDischargeRequest): Promise<void>;
  completeDischarge(req: CompleteDischargeRequest): Promise<InpatientAdmissionDto>;
  finalizeDischargeSummary(req: FinalizeDischargeSummaryRequest): Promise<InpatientDischargeSummaryDto>;
  releaseBed(req: ReleaseBedRequest): Promise<InpatientBedDto>;
  completeCleaning(req: CompleteCleaningRequest): Promise<InpatientBedDto>;
}

export class MockInpatientManagementService implements IInpatientManagementService {
  private units: InpatientUnitDto[] = [...mockInpatientUnits];
  private wards: InpatientWardDto[] = [...mockInpatientWards];
  private beds: InpatientBedDto[] = [...mockInpatientBeds];
  private requests: InpatientAdmissionRequestDto[] = [...mockInpatientAdmissionRequests];
  private admissions: InpatientAdmissionDto[] = [...mockInpatientAdmissions];
  private transfers: InpatientTransferDto[] = [...mockInpatientTransfers];
  private nursingAssessments: InpatientNursingAssessmentDto[] = [...mockInpatientNursingAssessments];
  private vitals: InpatientVitalObservationDto[] = [...mockInpatientVitalObservations];
  private rounds: InpatientDoctorRoundDto[] = [...mockInpatientDoctorRounds];
  private dischargePlans: InpatientDischargePlanDto[] = [...mockInpatientDischargePlans];
  private dischargeSummaries: InpatientDischargeSummaryDto[] = [...mockInpatientDischargeSummaries];
  private bedTurnarounds: InpatientBedTurnaroundDto[] = [...mockInpatientBedTurnarounds];
  private bedBlocks: InpatientBedBlockDto[] = [...mockInpatientBedBlocks];
  private auditTraces: InpatientAuditTraceDto[] = [...mockInpatientAuditTraces];

  private addTrace(actorName: string, actorRole: string, action: string, entityType: string, entityCode: string, justification: string) {
    const trace: InpatientAuditTraceDto = {
      id: 'aud-' + Math.random().toString(36).substring(2, 9),
      tenantId: '11111111-1111-4111-8111-111111111111',
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      traceNumber: `TRACE-IPD-${Date.now().toString().slice(-8)}`,
      actorId: 'usr-admin',
      actorName,
      actorRole,
      action,
      entityType,
      entityId: entityCode,
      entityCode,
      justification,
      newState: { status: action, entityCode },
      previousHash: 'sha256-genesis',
      ipAddress: '127.0.0.1',
      integrityHash: 'sha256-' + Math.random().toString(36).substring(2, 18),
      timestamp: new Date().toISOString()
    };
    this.auditTraces.unshift(trace);
  }

  async getOverviewMetrics(tenantId: string): Promise<InpatientOverviewMetricsDto> {
    const totalBeds = this.beds.filter((b) => b.tenantId === tenantId).length;
    const occupiedBeds = this.beds.filter((b) => b.tenantId === tenantId && b.status === 'OCCUPIED').length;
    const availableBeds = this.beds.filter((b) => b.tenantId === tenantId && b.status === 'AVAILABLE').length;
    const blockedBeds = this.beds.filter((b) => b.tenantId === tenantId && b.status === 'BLOCKED').length;
    const cleaningBeds = this.beds.filter((b) => b.tenantId === tenantId && b.status === 'CLEANING').length;
    const totalInpatients = this.admissions.filter((a) => a.tenantId === tenantId && (a.status === 'ADMITTED' || a.status === 'DISCHARGE_PLANNED')).length;
    const pendingAdmissions = this.requests.filter((r) => r.tenantId === tenantId && (r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW')).length;
    const transferBacklog = this.transfers.filter((t) => t.tenantId === tenantId && (t.status === 'REQUESTED' || t.status === 'APPROVED')).length;
    const dischargeBacklog = this.admissions.filter((a) => a.tenantId === tenantId && a.status === 'DISCHARGE_PLANNED' && !a.billingCleared).length;
    const occupancyRatePercentage = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    return {
      ...mockInpatientOverviewMetrics,
      totalBeds,
      occupiedBeds,
      availableBeds,
      blockedBeds,
      cleaningBeds,
      totalInpatients,
      pendingAdmissions,
      transferBacklog,
      dischargeBacklog,
      occupancyRatePercentage
    };
  }

  async getAnalytics(_tenantId: string): Promise<InpatientAnalyticsDto> {
    return { ...mockInpatientAnalytics };
  }

  async getUnits(tenantId: string): Promise<InpatientUnitDto[]> {
    return this.units.filter((u) => u.tenantId === tenantId);
  }

  async getWards(tenantId: string): Promise<InpatientWardDto[]> {
    try {
      const res = await apiRequest<InpatientWardDto[]>('/api/v1/partner/inpatient/wards');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    return this.wards.filter((w) => w.tenantId === tenantId);
  }

  async getBeds(tenantId: string): Promise<InpatientBedDto[]> {
    try {
      const res = await apiRequest<InpatientBedDto[]>('/api/v1/partner/inpatient/beds');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    return this.beds.filter((b) => b.tenantId === tenantId);
  }

  async getAdmissionRequests(tenantId: string): Promise<InpatientAdmissionRequestDto[]> {
    return this.requests.filter((r) => r.tenantId === tenantId);
  }

  async getAdmissions(tenantId: string): Promise<InpatientAdmissionDto[]> {
    try {
      const res = await apiRequest<InpatientAdmissionDto[]>('/api/v1/partner/inpatient/admissions');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    return this.admissions.filter((a) => a.tenantId === tenantId);
  }

  async getTransfers(tenantId: string): Promise<InpatientTransferDto[]> {
    return this.transfers.filter((t) => t.tenantId === tenantId);
  }

  async getNursingAssessments(tenantId: string): Promise<InpatientNursingAssessmentDto[]> {
    return this.nursingAssessments.filter((n) => n.tenantId === tenantId);
  }

  async getVitalObservations(tenantId: string): Promise<InpatientVitalObservationDto[]> {
    return this.vitals.filter((v) => v.tenantId === tenantId);
  }

  async getDoctorRounds(tenantId: string): Promise<InpatientDoctorRoundDto[]> {
    return this.rounds.filter((r) => r.tenantId === tenantId);
  }

  async getDischargePlans(tenantId: string): Promise<InpatientDischargePlanDto[]> {
    return this.dischargePlans.filter((d) => d.tenantId === tenantId);
  }

  async getDischargeSummaries(tenantId: string): Promise<InpatientDischargeSummaryDto[]> {
    return this.dischargeSummaries.filter((d) => d.tenantId === tenantId);
  }

  async getBedTurnarounds(tenantId: string): Promise<InpatientBedTurnaroundDto[]> {
    return this.bedTurnarounds.filter((b) => b.tenantId === tenantId);
  }

  async getBedBlocks(tenantId: string): Promise<InpatientBedBlockDto[]> {
    return this.bedBlocks.filter((b) => b.tenantId === tenantId);
  }

  async getAuditTraces(tenantId: string): Promise<InpatientAuditTraceDto[]> {
    return this.auditTraces.filter((a) => a.tenantId === tenantId);
  }

  async createWard(req: CreateWardRequest): Promise<InpatientWardDto> {
    const newWard: InpatientWardDto = {
      id: 'wrd-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      unitId: req.unitId,
      wardCode: req.wardCode,
      wardName: req.wardName,
      wardType: req.wardType,
      careLevel: req.careLevel,
      genderPolicy: req.genderPolicy || 'ALL',
      building: req.building,
      floor: req.floor,
      nursingStationName: req.nursingStationName,
      totalBeds: req.totalBeds,
      activeBeds: req.totalBeds,
      occupiedBeds: 0,
      blockedBeds: 0,
      cleaningBeds: 0,
      isolationCapable: req.isolationCapable ?? false,
      ventilatorCapable: req.ventilatorCapable ?? false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.wards.push(newWard);
    this.addTrace('Hospital Admin', 'ADMINISTRATOR', 'CREATE_WARD', 'INPATIENT_WARD', newWard.wardCode, 'Ward registered in roster');
    return newWard;
  }

  async updateWard(req: UpdateWardRequest): Promise<InpatientWardDto> {
    const index = this.wards.findIndex((w) => w.id === req.wardId);
    if (index === -1) throw new Error('Ward not found');
    const existing = this.wards[index];
    if (!existing) throw new Error('Ward not found');
    const updated: InpatientWardDto = {
      ...existing,
      wardName: req.wardName ?? existing.wardName,
      careLevel: req.careLevel ?? existing.careLevel,
      nursingStationName: req.nursingStationName ?? existing.nursingStationName,
      isolationCapable: req.isolationCapable ?? existing.isolationCapable,
      ventilatorCapable: req.ventilatorCapable ?? existing.ventilatorCapable,
      isActive: req.isActive ?? existing.isActive,
      updatedAt: new Date().toISOString()
    };
    this.wards[index] = updated;
    this.addTrace('Hospital Admin', 'ADMINISTRATOR', 'UPDATE_WARD', 'INPATIENT_WARD', updated.wardCode, 'Ward profile updated');
    return updated;
  }

  async createBed(req: CreateBedRequest): Promise<InpatientBedDto> {
    const ward = this.wards.find((w) => w.id === req.wardId);
    const newBed: InpatientBedDto = {
      id: 'bed-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      wardId: req.wardId,
      wardName: ward?.wardName || 'General Ward',
      bedCode: req.bedCode,
      bedNumber: req.bedNumber,
      bedType: req.bedType,
      bedClass: req.bedClass,
      status: 'AVAILABLE',
      genderEligibility: req.genderEligibility || 'ALL',
      hasOxygenPort: req.hasOxygenPort ?? true,
      hasSuctionPort: req.hasSuctionPort ?? true,
      hasVentilator: req.hasVentilator ?? false,
      hasCardiacMonitor: req.hasCardiacMonitor ?? false,
      dailyChargeRate: req.dailyChargeRate,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.beds.push(newBed);
    this.addTrace('Hospital Admin', 'ADMINISTRATOR', 'CREATE_BED', 'INPATIENT_BED', newBed.bedCode, 'Bed registered');
    return newBed;
  }

  async updateBed(req: UpdateBedRequest): Promise<InpatientBedDto> {
    const index = this.beds.findIndex((b) => b.id === req.bedId);
    if (index === -1) throw new Error('Bed not found');
    const existing = this.beds[index];
    if (!existing) throw new Error('Bed not found');
    const updated: InpatientBedDto = {
      ...existing,
      bedType: req.bedType ?? existing.bedType,
      bedClass: req.bedClass ?? existing.bedClass,
      hasOxygenPort: req.hasOxygenPort ?? existing.hasOxygenPort,
      hasSuctionPort: req.hasSuctionPort ?? existing.hasSuctionPort,
      hasVentilator: req.hasVentilator ?? existing.hasVentilator,
      hasCardiacMonitor: req.hasCardiacMonitor ?? existing.hasCardiacMonitor,
      dailyChargeRate: req.dailyChargeRate ?? existing.dailyChargeRate,
      isActive: req.isActive ?? existing.isActive,
      updatedAt: new Date().toISOString()
    };
    this.beds[index] = updated;
    this.addTrace('Hospital Admin', 'ADMINISTRATOR', 'UPDATE_BED', 'INPATIENT_BED', updated.bedCode, 'Bed updated');
    return updated;
  }

  async blockBed(req: BlockBedRequest): Promise<InpatientBedDto> {
    const bed = this.beds.find((b) => b.id === req.bedId);
    if (!bed) throw new Error('Bed not found');
    bed.status = 'BLOCKED';
    bed.notes = req.justificationNotes;
    bed.updatedAt = new Date().toISOString();
    const newBlock: InpatientBedBlockDto = {
      id: 'blk-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      bedId: req.bedId,
      bedCode: bed.bedCode,
      wardId: bed.wardId,
      blockNumber: `BLK-${Date.now().toString().slice(-6)}`,
      blockReason: req.blockReason,
      authorizedBy: req.authorizedBy,
      justificationNotes: req.justificationNotes,
      blockedFrom: new Date().toISOString(),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.bedBlocks.unshift(newBlock);
    this.addTrace(req.authorizedBy, 'SUPERVISOR', 'BLOCK_BED', 'INPATIENT_BED', bed.bedCode, req.justificationNotes);
    return bed;
  }

  async createBedReservation(req: CreateBedReservationRequest): Promise<InpatientBedDto> {
    const bed = this.beds.find((b) => b.id === req.bedId);
    if (!bed) throw new Error('Bed not found');
    bed.status = 'RESERVED';
    bed.currentPatientName = req.patientName;
    bed.currentPatientMrn = req.patientMrn;
    bed.updatedAt = new Date().toISOString();
    this.addTrace(req.reservedBy, 'ADT_OFFICER', 'RESERVE_BED', 'INPATIENT_BED', bed.bedCode, req.notes || 'Reserved for elective procedure');
    return bed;
  }

  async cancelBedReservation(req: CancelBedReservationRequest): Promise<InpatientBedDto> {
    const bed = this.beds.find((b) => b.status === 'RESERVED');
    if (!bed) throw new Error('No reserved bed found');
    bed.status = 'AVAILABLE';
    bed.currentPatientName = undefined;
    bed.currentPatientMrn = undefined;
    bed.updatedAt = new Date().toISOString();
    this.addTrace(req.cancelledBy, 'ADT_OFFICER', 'CANCEL_BED_RESERVATION', 'INPATIENT_BED', bed.bedCode, req.reason);
    return bed;
  }

  async createAdmissionRequest(req: CreateAdmissionRequest): Promise<InpatientAdmissionRequestDto> {
    try {
      const res = await apiRequest<InpatientAdmissionRequestDto>('/api/v1/partner/inpatient/admissions', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    const newReq: InpatientAdmissionRequestDto = {
      id: 'req-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      requestNumber: `REQ-ADM-${Date.now().toString().slice(-6)}`,
      patientId: req.patientId,
      patientName: req.patientName,
      patientMrn: req.patientMrn,
      referringDoctorName: req.referringDoctorName,
      admittingDoctorName: req.admittingDoctorName,
      department: req.department,
      specialty: req.specialty,
      requestedWardType: req.requestedWardType,
      requestedBedClass: req.requestedBedClass,
      admissionSource: req.admissionSource,
      priority: req.priority || 'ROUTINE',
      isEmergency: req.isEmergency ?? false,
      provisionalDiagnosis: req.provisionalDiagnosis,
      admissionReason: req.admissionReason,
      expectedLengthOfStayDays: req.expectedLengthOfStayDays || 3,
      insurancePreAuthRef: req.insurancePreAuthRef,
      status: 'SUBMITTED',
      decisionNotes: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.requests.unshift(newReq);
    this.addTrace(req.admittingDoctorName, 'PHYSICIAN', 'CREATE_ADMISSION_REQUEST', 'ADMISSION_REQUEST', newReq.requestNumber, req.admissionReason);
    return newReq;
  }

  async approveAdmission(req: ApproveAdmissionRequest): Promise<InpatientAdmissionDto> {
    const admissionReq = this.requests.find((r) => r.id === req.requestId);
    if (!admissionReq) throw new Error('Admission request not found');
    admissionReq.status = 'APPROVED';
    admissionReq.decisionNotes = `Approved by ${req.approverName}`;
    admissionReq.updatedAt = new Date().toISOString();

    const ward = this.wards.find((w) => w.id === req.allocatedWardId);
    const bed = this.beds.find((b) => b.id === req.allocatedBedId);
    if (bed) {
      bed.status = 'OCCUPIED';
      bed.currentPatientId = admissionReq.patientId;
      bed.currentPatientName = admissionReq.patientName;
      bed.currentPatientMrn = admissionReq.patientMrn;
      bed.currentAdmissionId = 'adm-' + admissionReq.id;
      bed.lastOccupiedAt = new Date().toISOString();
    }

    const newAdmission: InpatientAdmissionDto = {
      id: 'adm-' + admissionReq.id,
      tenantId: admissionReq.tenantId,
      partnerId: admissionReq.partnerId,
      organizationId: admissionReq.organizationId,
      branchId: admissionReq.branchId,
      admissionNumber: `ADM-${Date.now().toString().slice(-6)}`,
      admissionRequestId: admissionReq.id,
      patientId: admissionReq.patientId,
      patientName: admissionReq.patientName,
      patientMrn: admissionReq.patientMrn,
      patientAge: 45,
      patientGender: 'M',
      wardId: req.allocatedWardId,
      wardName: ward?.wardName || 'Inpatient Ward',
      bedId: req.allocatedBedId,
      bedCode: bed?.bedCode || 'BED-01',
      department: admissionReq.department,
      specialty: admissionReq.specialty,
      attendingConsultantName: admissionReq.admittingDoctorName,
      admittingDoctorName: admissionReq.admittingDoctorName,
      admissionDateTime: new Date().toISOString(),
      expectedDischargeDate: new Date(Date.now() + (admissionReq.expectedLengthOfStayDays || 3) * 24 * 3600 * 1000).toISOString(),
      primaryDiagnosis: admissionReq.provisionalDiagnosis,
      admissionType: admissionReq.isEmergency ? 'EMERGENCY' : 'ELECTIVE',
      admissionSource: admissionReq.admissionSource,
      isolationRequired: false,
      payerType: 'INSURANCE_TPA',
      payerName: 'Apex Health TPA',
      financialDepositAmount: 0,
      clinicalClearance: false,
      billingCleared: false,
      insuranceCleared: false,
      dischargeSummaryFinalized: false,
      status: 'ADMITTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.admissions.unshift(newAdmission);
    this.addTrace(req.approverName, req.approverRole, 'APPROVE_ADMISSION', 'INPATIENT_ADMISSION', newAdmission.admissionNumber, req.justification);
    return newAdmission;
  }

  async rejectAdmission(req: RejectAdmissionRequest): Promise<InpatientAdmissionRequestDto> {
    const r = this.requests.find((x) => x.id === req.requestId);
    if (!r) throw new Error('Admission request not found');
    r.status = 'REJECTED';
    r.decisionNotes = req.reason;
    r.updatedAt = new Date().toISOString();
    this.addTrace(req.rejectorName, 'CHIEF_MEDICAL_OFFICER', 'REJECT_ADMISSION_REQUEST', 'ADMISSION_REQUEST', r.requestNumber, req.reason);
    return r;
  }

  async cancelAdmission(req: CancelAdmissionRequest): Promise<InpatientAdmissionRequestDto> {
    const r = this.requests.find((x) => x.id === req.requestId);
    if (!r) throw new Error('Admission request not found');
    r.status = 'CANCELLED';
    r.decisionNotes = req.reason;
    r.updatedAt = new Date().toISOString();
    this.addTrace(req.cancelledBy, 'ADT_OFFICER', 'CANCEL_ADMISSION_REQUEST', 'ADMISSION_REQUEST', r.requestNumber, req.reason);
    return r;
  }

  async allocateBed(req: AllocateBedRequest): Promise<InpatientAdmissionDto> {
    const adm = this.admissions.find((a) => a.id === req.admissionId);
    if (!adm) throw new Error('Admission not found');
    const ward = this.wards.find((w) => w.id === req.wardId);
    const bed = this.beds.find((b) => b.id === req.bedId);
    if (bed) {
      bed.status = 'OCCUPIED';
      bed.currentPatientName = adm.patientName;
      bed.currentPatientMrn = adm.patientMrn;
    }
    adm.wardId = req.wardId;
    adm.wardName = ward?.wardName || adm.wardName;
    adm.bedId = req.bedId;
    adm.bedCode = bed?.bedCode || adm.bedCode;
    adm.updatedAt = new Date().toISOString();
    this.addTrace(req.allocatedBy, 'NURSE_SUPERVISOR', 'ALLOCATE_BED', 'INPATIENT_ADMISSION', adm.admissionNumber, 'Bed allocated');
    return adm;
  }

  async createTransfer(req: CreateTransferRequest): Promise<InpatientTransferDto> {
    const adm = this.admissions.find((a) => a.id === req.admissionId);
    if (!adm) throw new Error('Admission not found');
    const destWard = this.wards.find((w) => w.id === req.destinationWardId);
    const newTransfer: InpatientTransferDto = {
      id: 'trf-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      transferNumber: `TRF-${Date.now().toString().slice(-6)}`,
      admissionId: adm.id,
      patientId: adm.patientId,
      patientName: adm.patientName,
      patientMrn: adm.patientMrn,
      sourceWardId: adm.wardId,
      sourceWardName: adm.wardName,
      sourceBedId: adm.bedId,
      sourceBedCode: adm.bedCode,
      destinationWardId: req.destinationWardId,
      destinationWardName: destWard?.wardName || 'Destination Ward',
      transferType: req.transferType,
      priority: req.priority || 'ROUTINE',
      transferReason: req.transferReason,
      requestingDoctorName: req.requestingDoctorName,
      transportRequirement: req.transportRequirement || 'WHEELCHAIR',
      nursingHandoffNotes: req.nursingHandoffNotes,
      status: 'REQUESTED',
      requestedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.transfers.unshift(newTransfer);
    this.addTrace(req.requestingDoctorName, 'PHYSICIAN', 'CREATE_TRANSFER', 'INPATIENT_TRANSFER', newTransfer.transferNumber, req.transferReason);
    return newTransfer;
  }

  async approveTransfer(req: ApproveTransferRequest): Promise<InpatientTransferDto> {
    const trf = this.transfers.find((t) => t.id === req.transferId);
    if (!trf) throw new Error('Transfer not found');
    const bed = this.beds.find((b) => b.id === req.assignedBedId);
    trf.destinationBedId = req.assignedBedId;
    trf.destinationBedCode = bed?.bedCode || 'BED-02';
    trf.status = 'APPROVED';
    trf.approvedAt = new Date().toISOString();
    trf.updatedAt = new Date().toISOString();
    this.addTrace(req.approverName, 'NURSE_SUPERVISOR', 'APPROVE_TRANSFER', 'INPATIENT_TRANSFER', trf.transferNumber, req.justification);
    return trf;
  }

  async completeTransfer(req: CompleteTransferRequest): Promise<InpatientTransferDto> {
    try {
      const res = await apiRequest<InpatientTransferDto>('/api/v1/partner/inpatient/transfers', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    const trf = this.transfers.find((t) => t.id === req.transferId);
    if (!trf) throw new Error('Transfer not found');

    // Free source bed and route to cleaning
    const oldBed = this.beds.find((b) => b.id === trf.sourceBedId);
    if (oldBed) {
      oldBed.status = 'CLEANING';
      oldBed.currentPatientName = undefined;
      oldBed.currentPatientMrn = undefined;
      const turnaround: InpatientBedTurnaroundDto = {
        id: 'trn-' + Math.random().toString(36).substring(2, 9),
        tenantId: req.tenantId,
        partnerId: trf.partnerId,
        organizationId: trf.organizationId,
        branchId: trf.branchId,
        bedId: oldBed.id,
        bedCode: oldBed.bedCode,
        wardId: oldBed.wardId,
        turnaroundNumber: `CLN-${Date.now().toString().slice(-6)}`,
        cleaningType: 'TERMINAL_DISINFECTION',
        status: 'IN_PROGRESS',
        environmentalInspectionPassed: false,
        requestedAt: new Date().toISOString(),
        cleaningStartedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.bedTurnarounds.unshift(turnaround);
    }

    // Occupy destination bed
    const newBed = this.beds.find((b) => b.id === trf.destinationBedId);
    if (newBed) {
      newBed.status = 'OCCUPIED';
      newBed.currentPatientName = trf.patientName;
      newBed.currentPatientMrn = trf.patientMrn;
    }

    // Update admission record
    const adm = this.admissions.find((a) => a.id === trf.admissionId);
    if (adm) {
      adm.wardId = trf.destinationWardId;
      adm.wardName = trf.destinationWardName;
      adm.bedId = trf.destinationBedId || adm.bedId;
      adm.bedCode = trf.destinationBedCode || adm.bedCode;
    }

    trf.status = 'COMPLETED';
    trf.completedAt = new Date().toISOString();
    trf.updatedAt = new Date().toISOString();
    this.addTrace(req.completedBy, 'RECEIVING_NURSE', 'COMPLETE_TRANSFER', 'INPATIENT_TRANSFER', trf.transferNumber, 'Bedside handover verified');
    return trf;
  }

  async recordNursingAssessment(req: RecordNursingAssessmentRequest): Promise<InpatientNursingAssessmentDto> {
    const newAssessment: InpatientNursingAssessmentDto = {
      id: 'ass-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      admissionId: req.admissionId,
      patientId: req.patientId,
      assessedBy: req.assessedBy,
      shiftType: req.shiftType,
      assessmentType: req.assessmentType,
      fallRiskScore: req.fallRiskScore,
      fallRiskLevel: req.fallRiskLevel,
      pressureInjuryRiskScore: req.pressureInjuryRiskScore,
      pressureInjuryRiskLevel: req.pressureInjuryRiskLevel,
      painScore: req.painScore,
      consciousnessLevel: req.consciousnessLevel,
      mobilityStatus: req.mobilityStatus,
      dietaryIntakeLevel: req.dietaryIntakeLevel,
      nursingSummary: req.nursingSummary,
      createdAt: new Date().toISOString()
    };
    this.nursingAssessments.unshift(newAssessment);
    this.addTrace(req.assessedBy, 'STAFF_NURSE', 'RECORD_NURSING_ASSESSMENT', 'NURSING_ASSESSMENT', newAssessment.id, req.nursingSummary);
    return newAssessment;
  }

  async recordNursingNote(req: RecordNursingNoteRequest): Promise<void> {
    this.addTrace(req.authorName, 'STAFF_NURSE', 'RECORD_NURSING_NOTE', 'NURSING_NOTE', req.admissionId, req.noteContent);
  }

  async recordCarePlan(req: RecordCarePlanRequest): Promise<void> {
    this.addTrace(req.createdBy, 'CARE_COORDINATOR', 'RECORD_CARE_PLAN', 'CARE_PLAN', req.admissionId, req.nursingDiagnosis);
  }

  async recordVitalObservation(req: RecordVitalObservationRequest): Promise<InpatientVitalObservationDto> {
    const newVital: InpatientVitalObservationDto = {
      id: 'vit-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      admissionId: req.admissionId,
      patientId: req.patientId,
      recordedBy: req.recordedBy,
      temperatureCelsius: req.temperatureCelsius,
      pulseBpm: req.pulseBpm,
      respiratoryRateBpm: req.respiratoryRateBpm,
      systolicBpMmHg: req.systolicBpMmHg,
      diastolicBpMmHg: req.diastolicBpMmHg,
      spo2Percentage: req.spo2Percentage,
      bloodGlucoseMgDl: req.bloodGlucoseMgDl,
      painScaleScore: req.painScaleScore,
      gcsScore: req.gcsScore,
      isAbnormal: req.isAbnormal ?? false,
      notes: req.notes,
      recordedAt: new Date().toISOString()
    };
    this.vitals.unshift(newVital);
    this.addTrace(req.recordedBy, 'STAFF_NURSE', 'RECORD_VITAL_OBSERVATION', 'VITAL_OBSERVATION', newVital.id, req.notes || 'Telemetry recorded');
    return newVital;
  }

  async recordDoctorRound(req: RecordDoctorRoundRequest): Promise<InpatientDoctorRoundDto> {
    const newRound: InpatientDoctorRoundDto = {
      id: 'rnd-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      admissionId: req.admissionId,
      patientId: req.patientId,
      doctorName: req.doctorName,
      doctorSpecialty: req.doctorSpecialty,
      roundType: req.roundType,
      subjectiveAssessment: req.subjectiveAssessment,
      objectiveClinicalFindings: req.objectiveClinicalFindings,
      clinicalImpression: req.clinicalImpression,
      treatmentPlanUpdates: req.treatmentPlanUpdates,
      orderedInvestigationsSummary: req.orderedInvestigationsSummary,
      medicationAdjustments: req.medicationAdjustments,
      dischargeReadinessScore: req.dischargeReadinessScore || 70,
      roundTimestamp: new Date().toISOString()
    };
    this.rounds.unshift(newRound);
    this.addTrace(req.doctorName, 'ATTENDING_PHYSICIAN', 'RECORD_DOCTOR_ROUND', 'DOCTOR_ROUND', newRound.id, req.clinicalImpression);
    return newRound;
  }

  async createDischargePlan(req: CreateDischargePlanRequest): Promise<InpatientDischargePlanDto> {
    const newPlan: InpatientDischargePlanDto = {
      id: 'dp-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      admissionId: req.admissionId,
      patientId: req.patientId,
      targetDischargeDate: req.targetDischargeDate,
      readinessStatus: 'PLANNING',
      coordinatorName: req.coordinatorName,
      isMedicationReconciled: true,
      isNursingCareHandoverDone: true,
      isBillingCleared: false,
      isInsurancePreApproved: false,
      isDischargeSummaryFinalized: false,
      transportArrangement: req.transportArrangement || 'SELF_TRANSPORT',
      patientEducationSummary: req.patientEducationSummary,
      followUpInstructions: req.followUpInstructions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.dischargePlans.unshift(newPlan);
    const adm = this.admissions.find((a) => a.id === req.admissionId);
    if (adm) {
      adm.status = 'DISCHARGE_PLANNED';
    }
    this.addTrace(req.coordinatorName, 'DISCHARGE_COORDINATOR', 'CREATE_DISCHARGE_PLAN', 'DISCHARGE_PLAN', newPlan.id, 'Discharge roadmap initialized');
    return newPlan;
  }

  async requestDischarge(req: RequestDischargeRequest): Promise<void> {
    const adm = this.admissions.find((a) => a.id === req.admissionId);
    if (!adm) throw new Error('Admission not found');
    adm.status = 'DISCHARGE_PLANNED';
    adm.clinicalClearance = true;
    adm.updatedAt = new Date().toISOString();
    this.addTrace(req.requestingDoctorName, 'PHYSICIAN', 'REQUEST_DISCHARGE', 'INPATIENT_ADMISSION', adm.admissionNumber, 'Physician discharge order signed');
  }

  async approveDischarge(req: ApproveDischargeRequest): Promise<void> {
    const adm = this.admissions.find((a) => a.status === 'DISCHARGE_PLANNED');
    if (adm) {
      adm.clinicalClearance = req.clinicalClearance;
      adm.billingCleared = req.financialClearance;
      adm.insuranceCleared = req.insuranceClearance;
      adm.updatedAt = new Date().toISOString();
    }
    this.addTrace(req.authorizedBy, 'DISCHARGE_ADMIN', 'APPROVE_DISCHARGE_CLEARANCES', 'INPATIENT_ADMISSION', adm?.admissionNumber || 'ADM-ALL', 'Multi-department clearance certified');
  }

  async completeDischarge(req: CompleteDischargeRequest): Promise<InpatientAdmissionDto> {
    try {
      const res = await apiRequest<InpatientAdmissionDto>(`/api/v1/partner/inpatient/admissions/${req.admissionId}/discharge`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    const adm = this.admissions.find((a) => a.id === req.admissionId);
    if (!adm) throw new Error('Admission not found');
    adm.status = 'DISCHARGED';
    adm.actualDischargeDateTime = new Date().toISOString();
    adm.dischargeDisposition = req.dischargeDisposition;
    adm.updatedAt = new Date().toISOString();

    // Release bed & trigger housekeeping turnaround
    const bed = this.beds.find((b) => b.id === adm.bedId);
    if (bed) {
      bed.status = 'CLEANING';
      bed.currentPatientName = undefined;
      bed.currentPatientMrn = undefined;
      bed.currentAdmissionId = undefined;
      const turnaround: InpatientBedTurnaroundDto = {
        id: 'trn-' + Math.random().toString(36).substring(2, 9),
        tenantId: adm.tenantId,
        partnerId: adm.partnerId,
        organizationId: adm.organizationId,
        branchId: adm.branchId,
        bedId: bed.id,
        bedCode: bed.bedCode,
        wardId: bed.wardId,
        turnaroundNumber: `CLN-${Date.now().toString().slice(-6)}`,
        cleaningType: 'TERMINAL_DISINFECTION',
        status: 'IN_PROGRESS',
        environmentalInspectionPassed: false,
        requestedAt: new Date().toISOString(),
        cleaningStartedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.bedTurnarounds.unshift(turnaround);
    }

    this.addTrace(req.dischargedBy, 'DISCHARGE_OFFICER', 'COMPLETE_DISCHARGE', 'INPATIENT_ADMISSION', adm.admissionNumber, 'Discharge finalized & bed released');
    return adm;
  }

  async finalizeDischargeSummary(req: FinalizeDischargeSummaryRequest): Promise<InpatientDischargeSummaryDto> {
    const adm = this.admissions.find((a) => a.id === req.admissionId);
    if (adm) {
      adm.dischargeSummaryFinalized = true;
    }
    const summary: InpatientDischargeSummaryDto = {
      id: 'sum-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      summaryNumber: `DS-${Date.now().toString().slice(-6)}`,
      admissionId: req.admissionId,
      patientId: adm?.patientId || 'pat-001',
      patientName: adm?.patientName || 'Patient',
      patientMrn: adm?.patientMrn || 'MRN-001',
      attendingConsultantName: req.attendingConsultantName,
      admissionDate: adm?.admissionDateTime || new Date().toISOString(),
      dischargeDate: new Date().toISOString(),
      finalPrimaryDiagnosis: req.finalPrimaryDiagnosis,
      finalSecondaryDiagnosis: req.finalSecondaryDiagnosis,
      surgicalProceduresPerformed: req.surgicalProceduresPerformed,
      hospitalCourseSummary: req.hospitalCourseSummary,
      keyInvestigationFindings: req.keyInvestigationFindings,
      treatmentGiven: req.treatmentGiven,
      dischargeMedicationAdvice: req.dischargeMedicationAdvice,
      dietAndActivityAdvice: req.dietAndActivityAdvice,
      warningSignsToSeekImmediateCare: req.warningSignsToSeekImmediateCare,
      followUpAppointmentDate: req.followUpAppointmentDate,
      followUpDoctorName: req.followUpDoctorName,
      isFinalized: true,
      finalizedBy: req.finalizedBy,
      finalizedAt: new Date().toISOString(),
      versionNumber: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.dischargeSummaries.unshift(summary);
    this.addTrace(req.finalizedBy, 'ATTENDING_PHYSICIAN', 'FINALIZE_DISCHARGE_SUMMARY', 'DISCHARGE_SUMMARY', summary.summaryNumber, 'Summary sealed and signed');
    return summary;
  }

  async releaseBed(req: ReleaseBedRequest): Promise<InpatientBedDto> {
    const bed = this.beds.find((b) => b.id === req.bedId);
    if (!bed) throw new Error('Bed not found');
    bed.status = 'CLEANING';
    bed.currentPatientName = undefined;
    bed.currentPatientMrn = undefined;
    bed.currentAdmissionId = undefined;
    const turnaround: InpatientBedTurnaroundDto = {
      id: 'trn-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: bed.partnerId,
      organizationId: bed.organizationId,
      branchId: bed.branchId,
      bedId: bed.id,
      bedCode: bed.bedCode,
      wardId: bed.wardId,
      turnaroundNumber: `CLN-${Date.now().toString().slice(-6)}`,
      cleaningType: 'TERMINAL_DISINFECTION',
      status: 'IN_PROGRESS',
      environmentalInspectionPassed: false,
      requestedAt: new Date().toISOString(),
      cleaningStartedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.bedTurnarounds.unshift(turnaround);
    this.addTrace(req.releasedBy, 'NURSE_SUPERVISOR', 'RELEASE_BED', 'INPATIENT_BED', bed.bedCode, req.reason);
    return bed;
  }

  async completeCleaning(req: CompleteCleaningRequest): Promise<InpatientBedDto> {
    const trn = this.bedTurnarounds.find((t) => t.id === req.turnaroundId);
    if (!trn) throw new Error('Turnaround ticket not found');
    trn.status = 'AVAILABLE';
    trn.inspectedBy = req.inspectedBy;
    trn.environmentalInspectionPassed = req.passed;
    trn.cleaningCompletedAt = new Date().toISOString();

    const bed = this.beds.find((b) => b.id === trn.bedId);
    if (!bed) throw new Error('Bed not found for turnaround ticket');
    bed.status = 'AVAILABLE';
    bed.updatedAt = new Date().toISOString();
    this.addTrace(req.inspectedBy, 'INFECTION_CONTROL', 'COMPLETE_CLEANING', 'INPATIENT_BED', trn.bedCode, req.notes || 'Terminal disinfection certified');
    return bed;
  }
}

export const inpatientManagementService = new MockInpatientManagementService();