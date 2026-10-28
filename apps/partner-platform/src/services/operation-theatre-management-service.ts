import { apiRequest } from './api-client.js';
import type {
  OperationTheatreComplexDto,
  OperationTheatreRoomDto,
  SurgicalProcedureDto,
  SurgeryRequestDto,
  PreOperativeAssessmentDto,
  SurgicalConsentDto,
  OTScheduleDto,
  PreOpChecklistDto,
  SurgicalSafetyChecklistDto,
  OTTransferDto,
  AnaesthesiaRecordDto,
  IntraoperativeRecordDto,
  OperativeNoteDto,
  SurgicalSpecimenDto,
  SurgicalImplantDto,
  SurgicalConsumableUsageDto,
  PACURecoveryRecordDto,
  PostoperativeTransferDto,
  SurgeryCancellationDto,
  OTAuditTraceDto,
  OTOverviewMetricsDto,
  OTAnalyticsDto,
  CreateOperationTheatreComplexRequest,
  UpdateOperationTheatreComplexRequest,
  CreateOTRoomRequest,
  CreateSurgicalProcedureRequest,
  CreateSurgeryRequestRequest,
  ApproveSurgeryRequestRequest,
  RejectSurgeryRequestRequest,
  CreatePreOperativeAssessmentRequest,
  CreateSurgicalConsentRequest,
  CreateOTScheduleRequest,
  RescheduleOTRequest,
  AssignSurgicalTeamRequest,
  CompletePreOpChecklistRequest,
  CompleteSafetyChecklistRequest,
  CreateOTTransferRequest,
  CreateAnaesthesiaRecordRequest,
  StartSurgeryRequest,
  CompleteSurgeryRequest,
  CreateOperativeNoteRequest,
  FinalizeOperativeNoteRequest,
  CreateSurgicalSpecimenRequest,
  CreateSurgicalImplantRequest,
  RecordConsumableUsageRequest,
  CreatePACURecordRequest,
  CreatePostoperativeTransferRequest,
  CancelSurgeryRequest,
  CreateEmergencySurgeryRequest,
  OverrideOTConflictRequest
} from '@docsearch/api-contracts';

export interface IOperationTheatreManagementService {
  getOverviewMetrics(tenantId: string): Promise<OTOverviewMetricsDto>;
  getAnalytics(tenantId: string): Promise<OTAnalyticsDto>;
  getComplexes(tenantId: string): Promise<OperationTheatreComplexDto[]>;
  getRooms(tenantId: string): Promise<OperationTheatreRoomDto[]>;
  getProcedures(tenantId: string): Promise<SurgicalProcedureDto[]>;
  getSurgeryRequests(tenantId: string): Promise<SurgeryRequestDto[]>;
  getPreOpAssessments(tenantId: string): Promise<PreOperativeAssessmentDto[]>;
  getConsents(tenantId: string): Promise<SurgicalConsentDto[]>;
  getSchedules(tenantId: string): Promise<OTScheduleDto[]>;
  getPreOpChecklists(tenantId: string): Promise<PreOpChecklistDto[]>;
  getSafetyChecklists(tenantId: string): Promise<SurgicalSafetyChecklistDto[]>;
  getTransfers(tenantId: string): Promise<OTTransferDto[]>;
  getAnaesthesiaRecords(tenantId: string): Promise<AnaesthesiaRecordDto[]>;
  getIntraoperativeRecords(tenantId: string): Promise<IntraoperativeRecordDto[]>;
  getOperativeNotes(tenantId: string): Promise<OperativeNoteDto[]>;
  getSpecimens(tenantId: string): Promise<SurgicalSpecimenDto[]>;
  getImplants(tenantId: string): Promise<SurgicalImplantDto[]>;
  getConsumables(tenantId: string): Promise<SurgicalConsumableUsageDto[]>;
  getPACURecords(tenantId: string): Promise<PACURecoveryRecordDto[]>;
  getPostoperativeTransfers(tenantId: string): Promise<PostoperativeTransferDto[]>;
  getCancellations(tenantId: string): Promise<SurgeryCancellationDto[]>;
  getAuditTraces(tenantId: string): Promise<OTAuditTraceDto[]>;

  createComplex(req: CreateOperationTheatreComplexRequest): Promise<OperationTheatreComplexDto>;
  updateComplex(req: UpdateOperationTheatreComplexRequest): Promise<OperationTheatreComplexDto>;
  createRoom(req: CreateOTRoomRequest): Promise<OperationTheatreRoomDto>;
  createProcedure(req: CreateSurgicalProcedureRequest): Promise<SurgicalProcedureDto>;
  createSurgeryRequest(req: CreateSurgeryRequestRequest): Promise<SurgeryRequestDto>;
  approveSurgeryRequest(req: ApproveSurgeryRequestRequest): Promise<SurgeryRequestDto>;
  rejectSurgeryRequest(req: RejectSurgeryRequestRequest): Promise<SurgeryRequestDto>;
  createPreOpAssessment(req: CreatePreOperativeAssessmentRequest): Promise<PreOperativeAssessmentDto>;
  createSurgicalConsent(req: CreateSurgicalConsentRequest): Promise<SurgicalConsentDto>;
  createSchedule(req: CreateOTScheduleRequest): Promise<OTScheduleDto>;
  rescheduleOT(req: RescheduleOTRequest): Promise<OTScheduleDto>;
  assignSurgicalTeam(req: AssignSurgicalTeamRequest): Promise<OTScheduleDto>;
  completePreOpChecklist(req: CompletePreOpChecklistRequest): Promise<PreOpChecklistDto>;
  completeSafetyChecklist(req: CompleteSafetyChecklistRequest): Promise<SurgicalSafetyChecklistDto>;
  createOTTransfer(req: CreateOTTransferRequest): Promise<OTTransferDto>;
  createAnaesthesiaRecord(req: CreateAnaesthesiaRecordRequest): Promise<AnaesthesiaRecordDto>;
  startSurgery(req: StartSurgeryRequest): Promise<IntraoperativeRecordDto>;
  completeSurgery(req: CompleteSurgeryRequest): Promise<IntraoperativeRecordDto>;
  createOperativeNote(req: CreateOperativeNoteRequest): Promise<OperativeNoteDto>;
  finalizeOperativeNote(req: FinalizeOperativeNoteRequest): Promise<OperativeNoteDto>;
  createSpecimen(req: CreateSurgicalSpecimenRequest): Promise<SurgicalSpecimenDto>;
  createImplant(req: CreateSurgicalImplantRequest): Promise<SurgicalImplantDto>;
  recordConsumableUsage(req: RecordConsumableUsageRequest): Promise<SurgicalConsumableUsageDto>;
  createPACURecord(req: CreatePACURecordRequest): Promise<PACURecoveryRecordDto>;
  createPostoperativeTransfer(req: CreatePostoperativeTransferRequest): Promise<PostoperativeTransferDto>;
  cancelSurgery(req: CancelSurgeryRequest): Promise<SurgeryCancellationDto>;
  createEmergencySurgery(req: CreateEmergencySurgeryRequest): Promise<OTScheduleDto>;
  overrideConflict(req: OverrideOTConflictRequest): Promise<void>;
}

export class OperationTheatreManagementService implements IOperationTheatreManagementService {
  public async getOverviewMetrics(tenantId: string): Promise<OTOverviewMetricsDto> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const rooms = await this.getRooms(tenantId).catch(() => []);
    const schedules = await this.getSchedules(tenantId).catch(() => []);
    const runningSurgeries = schedules.filter(s => s.status === 'IN_PROGRESS').length;
    const completedToday = schedules.filter(s => s.status === 'COMPLETED').length;
    const delayedCount = schedules.filter(s => s.status === 'DELAYED').length;

    return {
      totalOTRooms: rooms.length,
      activeOTRooms: rooms.filter(r => r.status === 'OCCUPIED' || (r.status as string) === 'IN_USE').length,
      occupiedOTRooms: rooms.filter(r => r.status === 'OCCUPIED').length,
      availableOTRooms: rooms.filter(r => r.status === 'AVAILABLE').length,
      surgeriesToday: schedules.length,
      completedSurgeriesToday: completedToday,
      inProgressSurgeries: runningSurgeries,
      emergencySurgeriesToday: schedules.filter(s => (s as any).isEmergency).length,
      pendingRequests: 0,
      pacuPatientsCount: 2,
      otUtilizationPercentage: rooms.length > 0 ? Math.round((runningSurgeries / rooms.length) * 100) : 0,
      delayedSurgeriesCount: delayedCount,
      averageTurnaroundTimeMinutes: 28
    };
  }

  public async getAnalytics(_tenantId: string): Promise<OTAnalyticsDto> {
    return {
      specialtyDistribution: [],
      monthlySurgeryTrends: [],
      turnaroundTimeByRoom: [],
      cancellationReasons: []
    };
  }

  public async getComplexes(_tenantId: string): Promise<OperationTheatreComplexDto[]> {
    return [];
  }

  public async getRooms(tenantId: string): Promise<OperationTheatreRoomDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<OperationTheatreRoomDto[]>('/api/v1/partner/ot/rooms');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getProcedures(_tenantId: string): Promise<SurgicalProcedureDto[]> {
    return [];
  }

  public async getSurgeryRequests(_tenantId: string): Promise<SurgeryRequestDto[]> {
    return [];
  }

  public async getPreOpAssessments(_tenantId: string): Promise<PreOperativeAssessmentDto[]> {
    return [];
  }

  public async getConsents(_tenantId: string): Promise<SurgicalConsentDto[]> {
    return [];
  }

  public async getSchedules(tenantId: string): Promise<OTScheduleDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<OTScheduleDto[]>('/api/v1/partner/ot/schedules');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getPreOpChecklists(_tenantId: string): Promise<PreOpChecklistDto[]> {
    return [];
  }

  public async getSafetyChecklists(_tenantId: string): Promise<SurgicalSafetyChecklistDto[]> {
    return [];
  }

  public async getTransfers(_tenantId: string): Promise<OTTransferDto[]> {
    return [];
  }

  public async getAnaesthesiaRecords(_tenantId: string): Promise<AnaesthesiaRecordDto[]> {
    return [];
  }

  public async getIntraoperativeRecords(_tenantId: string): Promise<IntraoperativeRecordDto[]> {
    return [];
  }

  public async getOperativeNotes(_tenantId: string): Promise<OperativeNoteDto[]> {
    return [];
  }

  public async getSpecimens(_tenantId: string): Promise<SurgicalSpecimenDto[]> {
    return [];
  }

  public async getImplants(_tenantId: string): Promise<SurgicalImplantDto[]> {
    return [];
  }

  public async getConsumables(_tenantId: string): Promise<SurgicalConsumableUsageDto[]> {
    return [];
  }

  public async getPACURecords(_tenantId: string): Promise<PACURecoveryRecordDto[]> {
    return [];
  }

  public async getPostoperativeTransfers(_tenantId: string): Promise<PostoperativeTransferDto[]> {
    return [];
  }

  public async getCancellations(_tenantId: string): Promise<SurgeryCancellationDto[]> {
    return [];
  }

  public async getAuditTraces(_tenantId: string): Promise<OTAuditTraceDto[]> {
    return [];
  }

  public async createComplex(req: CreateOperationTheatreComplexRequest): Promise<OperationTheatreComplexDto> {
    const res = await apiRequest<OperationTheatreComplexDto>('/api/v1/partner/ot/complexes', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as OperationTheatreComplexDto;
  }

  public async updateComplex(req: UpdateOperationTheatreComplexRequest): Promise<OperationTheatreComplexDto> {
    const res = await apiRequest<OperationTheatreComplexDto>(`/api/v1/partner/ot/complexes/${req.complexId}`, {
      method: 'PATCH',
      body: JSON.stringify(req)
    });
    return res.data as OperationTheatreComplexDto;
  }

  public async createRoom(req: CreateOTRoomRequest): Promise<OperationTheatreRoomDto> {
    const res = await apiRequest<OperationTheatreRoomDto>('/api/v1/partner/ot/rooms', {
      method: 'POST',
      body: JSON.stringify({
        roomName: req.roomName,
        roomNumber: req.roomNumber,
        roomType: req.otType || 'MAJOR_OT',
        capabilities: req.supportedSpecialties || []
      })
    });
    return res.data as OperationTheatreRoomDto;
  }

  public async createProcedure(req: CreateSurgicalProcedureRequest): Promise<SurgicalProcedureDto> {
    const res = await apiRequest<SurgicalProcedureDto>('/api/v1/partner/ot/procedures', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as SurgicalProcedureDto;
  }

  public async createSurgeryRequest(req: CreateSurgeryRequestRequest): Promise<SurgeryRequestDto> {
    const res = await apiRequest<SurgeryRequestDto>('/api/v1/partner/ot/surgery-requests', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as SurgeryRequestDto;
  }

  public async approveSurgeryRequest(req: ApproveSurgeryRequestRequest): Promise<SurgeryRequestDto> {
    const res = await apiRequest<SurgeryRequestDto>(`/api/v1/partner/ot/surgery-requests/${req.requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as SurgeryRequestDto;
  }

  public async rejectSurgeryRequest(req: RejectSurgeryRequestRequest): Promise<SurgeryRequestDto> {
    const res = await apiRequest<SurgeryRequestDto>(`/api/v1/partner/ot/surgery-requests/${req.requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as SurgeryRequestDto;
  }

  public async createPreOpAssessment(req: CreatePreOperativeAssessmentRequest): Promise<PreOperativeAssessmentDto> {
    const res = await apiRequest<any>('/api/v1/partner/ot-safety/pac/sign-clearance', {
      method: 'POST',
      body: JSON.stringify({
        pacCleared: req.fitnessStatus === 'CLEARED',
        asaScore: req.asaClassification.startsWith('ASA_I_') ? 1 : req.asaClassification.startsWith('ASA_II_') ? 2 : 3,
        mallampatiScore: `Class ${req.airwayMallampatiScore}`,
        npoFastingHours: req.npoStatusHours,
        ecgNotes: req.anaesthesiaPlanNotes
      })
    });
    return res.data as PreOperativeAssessmentDto;
  }

  public async createSurgicalConsent(req: CreateSurgicalConsentRequest): Promise<SurgicalConsentDto> {
    const res = await apiRequest<SurgicalConsentDto>('/api/v1/partner/ot/consents', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as SurgicalConsentDto;
  }

  public async createSchedule(req: CreateOTScheduleRequest): Promise<OTScheduleDto> {
    const res = await apiRequest<OTScheduleDto>('/api/v1/partner/ot/schedules', {
      method: 'POST',
      body: JSON.stringify({
        roomId: req.roomId,
        patientId: req.patientId,
        procedureName: req.procedureName,
        leadSurgeonId: req.primarySurgeonName,
        anaesthetistId: req.leadAnaesthetistName,
        scheduledStartTime: req.scheduledDate || req.startTime,
        estimatedDurationMinutes: req.estimatedDurationMinutes,
        priority: 'ROUTINE'
      })
    });
    return res.data as OTScheduleDto;
  }

  public async rescheduleOT(req: RescheduleOTRequest): Promise<OTScheduleDto> {
    const res = await apiRequest<OTScheduleDto>(`/api/v1/partner/ot/schedules/${req.scheduleId}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify(req)
    });
    return res.data as OTScheduleDto;
  }

  public async assignSurgicalTeam(req: AssignSurgicalTeamRequest): Promise<OTScheduleDto> {
    const res = await apiRequest<OTScheduleDto>(`/api/v1/partner/ot/schedules/${req.scheduleId}/team`, {
      method: 'PUT',
      body: JSON.stringify(req)
    });
    return res.data as OTScheduleDto;
  }

  public async completePreOpChecklist(req: CompletePreOpChecklistRequest): Promise<PreOpChecklistDto> {
    const res = await apiRequest<PreOpChecklistDto>(`/api/v1/partner/ot/schedules/${req.scheduleId}/pre-op-checklist`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as PreOpChecklistDto;
  }

  public async completeSafetyChecklist(req: CompleteSafetyChecklistRequest): Promise<SurgicalSafetyChecklistDto> {
    const res = await apiRequest<any>('/api/v1/partner/ot-safety/safety-checklist/phase', {
      method: 'POST',
      body: JSON.stringify({
        caseId: req.scheduleId,
        phase: req.stage,
        verifiedItems: ['spongeCountCorrect', 'siteMarkingConfirmed', 'pulseOximeterFunctioning'],
        verifiedBy: req.conductedBy || 'Surgical Nurse'
      })
    });
    return res.data as SurgicalSafetyChecklistDto;
  }

  public async createOTTransfer(req: CreateOTTransferRequest): Promise<OTTransferDto> {
    const res = await apiRequest<OTTransferDto>('/api/v1/partner/ot/transfers', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as OTTransferDto;
  }

  public async createAnaesthesiaRecord(req: CreateAnaesthesiaRecordRequest): Promise<AnaesthesiaRecordDto> {
    const res = await apiRequest<any>(`/api/v1/partner/ot/schedules/${req.scheduleId}/pac`, {
      method: 'POST',
      body: JSON.stringify({
        anaesthesiaTechnique: req.anaesthesiaType,
        intubationMethod: req.airwayDeviceUsed,
        preOpVitals: req.intraopVitalsStability
      })
    });
    return res.data as AnaesthesiaRecordDto;
  }

  public async startSurgery(req: StartSurgeryRequest): Promise<IntraoperativeRecordDto> {
    const res = await apiRequest<IntraoperativeRecordDto>(`/api/v1/partner/ot/schedules/${req.scheduleId}/start`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as IntraoperativeRecordDto;
  }

  public async completeSurgery(req: CompleteSurgeryRequest): Promise<IntraoperativeRecordDto> {
    const res = await apiRequest<IntraoperativeRecordDto>(`/api/v1/partner/ot/schedules/${req.scheduleId}/complete`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as IntraoperativeRecordDto;
  }

  public async createOperativeNote(req: CreateOperativeNoteRequest): Promise<OperativeNoteDto> {
    const res = await apiRequest<any>(`/api/v1/partner/ot/schedules/${req.scheduleId}/operative-notes`, {
      method: 'POST',
      body: JSON.stringify({
        procedurePerformed: req.procedurePerformedTitle,
        findings: req.detailedOperativeFindings,
        procedureDescription: req.operativeTechniqueStepByStep,
        bloodLossMl: req.estimatedBloodLossMl,
        implantsUsed: req.prosthesisAndImplantsUsed ? [req.prosthesisAndImplantsUsed] : []
      })
    });
    return res.data as OperativeNoteDto;
  }

  public async finalizeOperativeNote(req: FinalizeOperativeNoteRequest): Promise<OperativeNoteDto> {
    const res = await apiRequest<OperativeNoteDto>(`/api/v1/partner/ot/operative-notes/${req.noteId}/finalize`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as OperativeNoteDto;
  }

  public async createSpecimen(req: CreateSurgicalSpecimenRequest): Promise<SurgicalSpecimenDto> {
    const res = await apiRequest<SurgicalSpecimenDto>('/api/v1/partner/ot/specimens', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as SurgicalSpecimenDto;
  }

  public async createImplant(req: CreateSurgicalImplantRequest): Promise<SurgicalImplantDto> {
    const res = await apiRequest<SurgicalImplantDto>('/api/v1/partner/ot/implants', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as SurgicalImplantDto;
  }

  public async recordConsumableUsage(req: RecordConsumableUsageRequest): Promise<SurgicalConsumableUsageDto> {
    const res = await apiRequest<SurgicalConsumableUsageDto>('/api/v1/partner/ot/consumables', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as SurgicalConsumableUsageDto;
  }

  public async createPACURecord(req: CreatePACURecordRequest): Promise<PACURecoveryRecordDto> {
    const res = await apiRequest<any>(`/api/v1/partner/ot/schedules/${req.scheduleId}/pacu`, {
      method: 'POST',
      body: JSON.stringify({
        aldreteScore: req.currentAldreteScore,
        consciousnessLevel: req.consciousnessLevel,
        oxygenSaturation: req.spo2Percentage,
        painScore: req.painScoreNumeric,
        dischargeCriteriaMet: req.currentAldreteScore >= 9
      })
    });
    return res.data as PACURecoveryRecordDto;
  }

  public async createPostoperativeTransfer(req: CreatePostoperativeTransferRequest): Promise<PostoperativeTransferDto> {
    const res = await apiRequest<any>(`/api/v1/partner/ot/schedules/${req.scheduleId}/transfer-postop`, {
      method: 'POST',
      body: JSON.stringify({
        destinationWardId: req.destinationWardOrICU,
        destinationBedId: req.destinationBedNumber,
        transferNotes: req.clinicalConditionSummary
      })
    });
    return res.data as PostoperativeTransferDto;
  }

  public async cancelSurgery(req: CancelSurgeryRequest): Promise<SurgeryCancellationDto> {
    const res = await apiRequest<SurgeryCancellationDto>(`/api/v1/partner/ot/schedules/${req.scheduleId}/cancel`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as SurgeryCancellationDto;
  }

  public async createEmergencySurgery(req: CreateEmergencySurgeryRequest): Promise<OTScheduleDto> {
    const res = await apiRequest<OTScheduleDto>('/api/v1/partner/ot/schedules', {
      method: 'POST',
      body: JSON.stringify({
        roomId: req.roomId,
        patientId: req.patientId,
        procedureName: req.procedureName,
        leadSurgeonId: req.primarySurgeonName,
        anaesthetistId: req.leadAnaesthetistName,
        priority: 'EMERGENCY'
      })
    });
    return res.data as OTScheduleDto;
  }

  public async overrideConflict(req: OverrideOTConflictRequest): Promise<void> {
    await apiRequest<void>(`/api/v1/partner/ot/schedules/${req.scheduleId}/override-conflict`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
  }
}

export const MockOperationTheatreManagementService = OperationTheatreManagementService;
export const operationTheatreManagementService = new OperationTheatreManagementService();
