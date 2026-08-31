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

import {
  mockOTComplexes,
  mockOTRooms,
  mockSurgicalProcedures,
  mockSurgeryRequests,
  mockPreOpAssessments,
  mockSurgicalConsents,
  mockOTSchedules,
  mockPreOpChecklists,
  mockSurgicalSafetyChecklists,
  mockOTTransfers,
  mockAnaesthesiaRecords,
  mockIntraoperativeRecords,
  mockOperativeNotes,
  mockSurgicalSpecimens,
  mockSurgicalImplants,
  mockSurgicalConsumables,
  mockPACURecords,
  mockPostoperativeTransfers,
  mockSurgeryCancellations,
  mockOTAuditTraces,
  mockOTOverviewMetrics,
  mockOTAnalytics
} from './mock-operation-theatre-data.js';

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

export class MockOperationTheatreManagementService implements IOperationTheatreManagementService {
  private complexes: OperationTheatreComplexDto[] = [...mockOTComplexes];
  private rooms: OperationTheatreRoomDto[] = [...mockOTRooms];
  private procedures: SurgicalProcedureDto[] = [...mockSurgicalProcedures];
  private requests: SurgeryRequestDto[] = [...mockSurgeryRequests];
  private preOpAssessments: PreOperativeAssessmentDto[] = [...mockPreOpAssessments];
  private consents: SurgicalConsentDto[] = [...mockSurgicalConsents];
  private schedules: OTScheduleDto[] = [...mockOTSchedules];
  private preOpChecklists: PreOpChecklistDto[] = [...mockPreOpChecklists];
  private safetyChecklists: SurgicalSafetyChecklistDto[] = [...mockSurgicalSafetyChecklists];
  private transfers: OTTransferDto[] = [...mockOTTransfers];
  private anaesthesiaRecords: AnaesthesiaRecordDto[] = [...mockAnaesthesiaRecords];
  private intraopRecords: IntraoperativeRecordDto[] = [...mockIntraoperativeRecords];
  private operativeNotes: OperativeNoteDto[] = [...mockOperativeNotes];
  private specimens: SurgicalSpecimenDto[] = [...mockSurgicalSpecimens];
  private implants: SurgicalImplantDto[] = [...mockSurgicalImplants];
  private consumables: SurgicalConsumableUsageDto[] = [...mockSurgicalConsumables];
  private pacuRecords: PACURecoveryRecordDto[] = [...mockPACURecords];
  private postOpTransfers: PostoperativeTransferDto[] = [...mockPostoperativeTransfers];
  private cancellations: SurgeryCancellationDto[] = [...mockSurgeryCancellations];
  private auditTraces: OTAuditTraceDto[] = [...mockOTAuditTraces];

  private addTrace(actorName: string, actorRole: string, action: string, entityType: string, entityCode: string, justification: string) {
    const trace: OTAuditTraceDto = {
      id: 'aud-' + Math.random().toString(36).substring(2, 9),
      tenantId: '11111111-1111-4111-8111-111111111111',
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      traceNumber: `TRACE-OT-${Date.now().toString().slice(-8)}`,
      actorId: 'usr-ot-officer',
      actorName,
      actorRole,
      action,
      entityType,
      entityId: entityCode,
      entityCode,
      justification,
      ipAddress: '127.0.0.1',
      integrityHash: 'sha256-' + Math.random().toString(36).substring(2, 18),
      newState: { status: action, entityCode },
      previousHash: 'sha256-genesis',
      timestamp: new Date().toISOString()
    };
    this.auditTraces.unshift(trace);
  }

  async getOverviewMetrics(tenantId: string): Promise<OTOverviewMetricsDto> {
    const totalOTRooms = this.rooms.filter((r) => r.tenantId === tenantId).length;
    const occupiedOTRooms = this.rooms.filter((r) => r.tenantId === tenantId && r.status === 'OCCUPIED').length;
    const availableOTRooms = this.rooms.filter((r) => r.tenantId === tenantId && r.status === 'AVAILABLE').length;
    const surgeriesToday = this.schedules.filter((s) => s.tenantId === tenantId).length;
    const completedSurgeriesToday = this.schedules.filter((s) => s.tenantId === tenantId && s.status === 'COMPLETED').length;
    const inProgressSurgeries = this.schedules.filter((s) => s.tenantId === tenantId && s.status === 'IN_PROGRESS').length;
    const emergencySurgeriesToday = this.schedules.filter((s) => s.tenantId === tenantId && s.isEmergency).length;
    const pendingRequests = this.requests.filter((r) => r.tenantId === tenantId && (r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW')).length;
    const pacuPatientsCount = this.pacuRecords.filter((p) => p.tenantId === tenantId && p.status === 'RECOVERING').length;
    const otUtilizationPercentage = totalOTRooms > 0 ? Math.round((occupiedOTRooms / totalOTRooms) * 1000) / 10 : 0;
    return {
      ...mockOTOverviewMetrics,
      totalOTRooms,
      activeOTRooms: totalOTRooms,
      occupiedOTRooms,
      availableOTRooms,
      surgeriesToday,
      completedSurgeriesToday,
      inProgressSurgeries,
      emergencySurgeriesToday,
      pendingRequests,
      pacuPatientsCount,
      otUtilizationPercentage
    };
  }

  async getAnalytics(_tenantId: string): Promise<OTAnalyticsDto> {
    return { ...mockOTAnalytics };
  }

  async getComplexes(tenantId: string): Promise<OperationTheatreComplexDto[]> {
    return this.complexes.filter((c) => c.tenantId === tenantId);
  }

  async getRooms(tenantId: string): Promise<OperationTheatreRoomDto[]> {
    try {
      const res = await apiRequest<OperationTheatreRoomDto[]>('/api/v1/partner/ot/rooms');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    return this.rooms.filter((r) => r.tenantId === tenantId);
  }

  async getProcedures(tenantId: string): Promise<SurgicalProcedureDto[]> {
    return this.procedures.filter((p) => p.tenantId === tenantId);
  }

  async getSurgeryRequests(tenantId: string): Promise<SurgeryRequestDto[]> {
    return this.requests.filter((r) => r.tenantId === tenantId);
  }

  async getPreOpAssessments(tenantId: string): Promise<PreOperativeAssessmentDto[]> {
    return this.preOpAssessments.filter((p) => p.tenantId === tenantId);
  }

  async getConsents(tenantId: string): Promise<SurgicalConsentDto[]> {
    return this.consents.filter((c) => c.tenantId === tenantId);
  }

  async getSchedules(tenantId: string): Promise<OTScheduleDto[]> {
    try {
      const res = await apiRequest<OTScheduleDto[]>('/api/v1/partner/ot/schedules');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    return this.schedules.filter((s) => s.tenantId === tenantId);
  }

  async getPreOpChecklists(tenantId: string): Promise<PreOpChecklistDto[]> {
    return this.preOpChecklists.filter((p) => p.tenantId === tenantId);
  }

  async getSafetyChecklists(tenantId: string): Promise<SurgicalSafetyChecklistDto[]> {
    return this.safetyChecklists.filter((s) => s.tenantId === tenantId);
  }

  async getTransfers(tenantId: string): Promise<OTTransferDto[]> {
    return this.transfers.filter((t) => t.tenantId === tenantId);
  }

  async getAnaesthesiaRecords(tenantId: string): Promise<AnaesthesiaRecordDto[]> {
    return this.anaesthesiaRecords.filter((a) => a.tenantId === tenantId);
  }

  async getIntraoperativeRecords(tenantId: string): Promise<IntraoperativeRecordDto[]> {
    return this.intraopRecords.filter((i) => i.tenantId === tenantId);
  }

  async getOperativeNotes(tenantId: string): Promise<OperativeNoteDto[]> {
    return this.operativeNotes.filter((o) => o.tenantId === tenantId);
  }

  async getSpecimens(tenantId: string): Promise<SurgicalSpecimenDto[]> {
    return this.specimens.filter((s) => s.tenantId === tenantId);
  }

  async getImplants(tenantId: string): Promise<SurgicalImplantDto[]> {
    return this.implants.filter((i) => i.tenantId === tenantId);
  }

  async getConsumables(tenantId: string): Promise<SurgicalConsumableUsageDto[]> {
    return this.consumables.filter((c) => c.tenantId === tenantId);
  }

  async getPACURecords(tenantId: string): Promise<PACURecoveryRecordDto[]> {
    return this.pacuRecords.filter((p) => p.tenantId === tenantId);
  }

  async getPostoperativeTransfers(tenantId: string): Promise<PostoperativeTransferDto[]> {
    return this.postOpTransfers.filter((p) => p.tenantId === tenantId);
  }

  async getCancellations(tenantId: string): Promise<SurgeryCancellationDto[]> {
    return this.cancellations.filter((c) => c.tenantId === tenantId);
  }

  async getAuditTraces(tenantId: string): Promise<OTAuditTraceDto[]> {
    return this.auditTraces.filter((a) => a.tenantId === tenantId);
  }

  async createComplex(req: CreateOperationTheatreComplexRequest): Promise<OperationTheatreComplexDto> {
    const newComplex: OperationTheatreComplexDto = {
      id: 'otc-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      complexCode: req.complexCode,
      complexName: req.complexName,
      building: req.building,
      floor: req.floor,
      totalRooms: 0,
      activeRooms: 0,
      operatingHours: req.operatingHours || '24/7',
      hasLaminarAirflow: req.hasLaminarAirflow ?? true,
      hasCentralSterileSupply: req.hasCentralSterileSupply ?? true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.complexes.push(newComplex);
    this.addTrace('OT Administrator', 'ADMINISTRATOR', 'CREATE_COMPLEX', 'OT_COMPLEX', newComplex.complexCode, 'OT Complex registered');
    return newComplex;
  }

  async updateComplex(req: UpdateOperationTheatreComplexRequest): Promise<OperationTheatreComplexDto> {
    const idx = this.complexes.findIndex((c) => c.id === req.complexId);
    if (idx === -1) throw new Error('OT Complex not found');
    const existing = this.complexes[idx];
    if (!existing) throw new Error('OT Complex not found');
    const updated: OperationTheatreComplexDto = {
      ...existing,
      complexName: req.complexName ?? existing.complexName,
      operatingHours: req.operatingHours ?? existing.operatingHours,
      hasLaminarAirflow: req.hasLaminarAirflow ?? existing.hasLaminarAirflow,
      hasCentralSterileSupply: req.hasCentralSterileSupply ?? existing.hasCentralSterileSupply,
      isActive: req.isActive ?? existing.isActive,
      updatedAt: new Date().toISOString()
    };
    this.complexes[idx] = updated;
    this.addTrace('OT Administrator', 'ADMINISTRATOR', 'UPDATE_COMPLEX', 'OT_COMPLEX', updated.complexCode, 'OT Complex configuration updated');
    return updated;
  }

  async createRoom(req: CreateOTRoomRequest): Promise<OperationTheatreRoomDto> {
    const complex = this.complexes.find((c) => c.id === req.complexId);
    const newRoom: OperationTheatreRoomDto = {
      id: 'otr-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      complexId: req.complexId,
      complexName: complex?.complexName || 'Main OT Complex',
      roomNumber: req.roomNumber,
      roomName: req.roomName,
      otType: req.otType,
      status: 'AVAILABLE',
      primarySpecialty: req.primarySpecialty,
      supportedSpecialties: req.supportedSpecialties || [req.primarySpecialty],
      hasPendantSystem: req.hasPendantSystem ?? true,
      hasCardiacMonitor: req.hasCardiacMonitor ?? true,
      hasAnaesthesiaWorkstation: req.hasAnaesthesiaWorkstation ?? true,
      hasC臂Fluoroscopy: true,
      hasLaminarFlow: req.hasLaminarFlow ?? true,
      hasHepaFilter: req.hasHepaFilter ?? true,
      hourlyRate: req.hourlyRate,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.rooms.push(newRoom);
    if (complex) {
      complex.totalRooms += 1;
      complex.activeRooms += 1;
    }
    this.addTrace('OT Manager', 'OT_MANAGER', 'CREATE_OT_ROOM', 'OT_ROOM', newRoom.roomNumber, 'OT Suite commissioned');
    return newRoom;
  }

  async createProcedure(req: CreateSurgicalProcedureRequest): Promise<SurgicalProcedureDto> {
    const newProc: SurgicalProcedureDto = {
      id: 'prc-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      procedureCode: req.procedureCode,
      procedureName: req.procedureName,
      specialty: req.specialty,
      category: req.category,
      defaultDurationMinutes: req.defaultDurationMinutes,
      recommendedAnaesthesia: req.recommendedAnaesthesia,
      requiresImplant: req.requiresImplant ?? false,
      requiresBloodCrossmatch: req.requiresBloodCrossmatch ?? false,
      requiresICUStay: req.requiresICUStay ?? false,
      baseProcedureCharge: req.baseProcedureCharge,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.procedures.push(newProc);
    this.addTrace('Clinical Director', 'CLINICAL_DIRECTOR', 'CREATE_PROCEDURE', 'SURGICAL_PROCEDURE', newProc.procedureCode, 'Surgical catalog entry added');
    return newProc;
  }

  async createSurgeryRequest(req: CreateSurgeryRequestRequest): Promise<SurgeryRequestDto> {
    const newReq: SurgeryRequestDto = {
      id: 'req-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      requestNumber: `REQ-SURG-${Date.now().toString().slice(-6)}`,
      patientId: req.patientId,
      patientName: req.patientName,
      patientMrn: req.patientMrn,
      patientAge: req.patientAge || 45,
      patientGender: req.patientGender || 'M',
      encounterId: req.encounterId,
      admissionId: req.admissionId,
      requestingDoctorName: req.requestingDoctorName,
      primarySurgeonName: req.primarySurgeonName,
      specialty: req.specialty,
      procedureId: req.procedureId,
      procedureName: req.procedureName,
      preOperativeDiagnosis: req.preOperativeDiagnosis,
      clinicalIndication: req.clinicalIndication,
      category: req.category,
      priority: req.priority || 'ROUTINE',
      isEmergency: req.isEmergency ?? false,
      proposedSurgeryDate: req.proposedSurgeryDate,
      estimatedDurationMinutes: req.estimatedDurationMinutes,
      requiredAnaesthesia: req.requiredAnaesthesia,
      implantRequirementDetails: req.implantRequirementDetails,
      bloodComponentsRequired: req.bloodComponentsRequired,
      specialEquipmentRequired: req.specialEquipmentRequired,
      pacClearanceStatus: 'PENDING',
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.requests.unshift(newReq);
    this.addTrace(req.requestingDoctorName, 'PHYSICIAN', 'CREATE_SURGERY_REQUEST', 'SURGERY_REQUEST', newReq.requestNumber, req.clinicalIndication);
    return newReq;
  }

  async approveSurgeryRequest(req: ApproveSurgeryRequestRequest): Promise<SurgeryRequestDto> {
    const r = this.requests.find((x) => x.id === req.requestId);
    if (!r) throw new Error('Surgery request not found');
    r.status = 'APPROVED';
    r.decisionNotes = req.decisionNotes;
    r.updatedAt = new Date().toISOString();
    this.addTrace(req.approverName, req.approverRole, 'APPROVE_SURGERY_REQUEST', 'SURGERY_REQUEST', r.requestNumber, req.decisionNotes);
    return r;
  }

  async rejectSurgeryRequest(req: RejectSurgeryRequestRequest): Promise<SurgeryRequestDto> {
    const r = this.requests.find((x) => x.id === req.requestId);
    if (!r) throw new Error('Surgery request not found');
    r.status = 'REJECTED';
    r.decisionNotes = req.reason;
    r.updatedAt = new Date().toISOString();
    this.addTrace(req.rejectorName, 'CHIEF_SURGEON', 'REJECT_SURGERY_REQUEST', 'SURGERY_REQUEST', r.requestNumber, req.reason);
    return r;
  }

  async createPreOpAssessment(req: CreatePreOperativeAssessmentRequest): Promise<PreOperativeAssessmentDto> {
    const newAssess: PreOperativeAssessmentDto = {
      id: 'pac-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      surgeryRequestId: req.surgeryRequestId,
      patientId: req.patientId,
      patientName: req.patientName,
      assessedByAnaesthetist: req.assessedByAnaesthetist,
      assessmentDate: new Date().toISOString(),
      asaClassification: req.asaClassification,
      airwayMallampatiScore: req.airwayMallampatiScore,
      npoStatusHours: req.npoStatusHours,
      cardiacClearanceGiven: req.cardiacClearanceGiven,
      respiratoryClearanceGiven: req.respiratoryClearanceGiven,
      allergiesNoted: req.allergiesNoted,
      currentMedicationsNoted: req.currentMedicationsNoted,
      lastHaemoglobinGdl: req.lastHaemoglobinGdl,
      coagulationProfileStatus: 'Normal (INR 1.05)',
      bloodArrangementUnits: req.bloodArrangementUnits,
      fitnessStatus: req.fitnessStatus,
      anaesthesiaPlanNotes: req.anaesthesiaPlanNotes,
      riskFactorsSummary: req.riskFactorsSummary,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.preOpAssessments.unshift(newAssess);

    const surgReq = this.requests.find((r) => r.id === req.surgeryRequestId);
    if (surgReq) {
      surgReq.pacClearanceStatus = req.fitnessStatus;
      surgReq.updatedAt = new Date().toISOString();
    }
    this.addTrace(req.assessedByAnaesthetist, 'ANAESTHETIST', 'CREATE_PREOP_ASSESSMENT', 'PAC_ASSESSMENT', newAssess.id, req.anaesthesiaPlanNotes);
    return newAssess;
  }

  async createSurgicalConsent(req: CreateSurgicalConsentRequest): Promise<SurgicalConsentDto> {
    const newConsent: SurgicalConsentDto = {
      id: 'cns-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      surgeryRequestId: req.surgeryRequestId,
      patientId: req.patientId,
      patientName: req.patientName,
      consentNumber: `CNS-${Date.now().toString().slice(-6)}`,
      procedureConsentGiven: req.procedureConsentGiven,
      anaesthesiaConsentGiven: req.anaesthesiaConsentGiven,
      bloodTransfusionConsentGiven: req.bloodTransfusionConsentGiven,
      highRiskConsentGiven: req.highRiskConsentGiven,
      implantConsentGiven: req.implantConsentGiven,
      consentingPersonName: req.consentingPersonName,
      relationshipToPatient: req.relationshipToPatient,
      counselledByDoctor: req.counselledByDoctor,
      witnessName: req.witnessName,
      isSignedDigitally: true,
      consentTimestamp: new Date().toISOString(),
      status: 'VALID_SIGNED',
      notes: req.notes,
      createdAt: new Date().toISOString()
    };
    this.consents.unshift(newConsent);
    this.addTrace(req.counselledByDoctor, 'SURGEON', 'CREATE_SURGICAL_CONSENT', 'SURGICAL_CONSENT', newConsent.consentNumber, 'Consent executed and witnessed');
    return newConsent;
  }

  async createSchedule(req: CreateOTScheduleRequest): Promise<OTScheduleDto> {
    const room = this.rooms.find((r) => r.id === req.roomId);
    if (!room) throw new Error('OT Room not found');
    if (room.status === 'OCCUPIED' && !req.isEmergency) {
      throw new Error('OT Room is currently occupied. Use emergency override if indicated.');
    }

    const newSchedule: OTScheduleDto = {
      id: 'ots-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      scheduleNumber: `SCH-OT-${Date.now().toString().slice(-6)}`,
      surgeryRequestId: req.surgeryRequestId,
      patientId: req.patientId,
      patientName: req.patientName,
      patientMrn: req.patientMrn,
      procedureName: req.procedureName,
      roomId: req.roomId,
      roomName: room.roomName,
      scheduledDate: req.scheduledDate,
      startTime: req.startTime,
      endTime: req.endTime,
      estimatedDurationMinutes: req.estimatedDurationMinutes,
      primarySurgeonName: req.primarySurgeonName,
      assistantSurgeonName: req.assistantSurgeonName,
      leadAnaesthetistName: req.leadAnaesthetistName,
      anaesthesiaTechName: req.anaesthesiaTechName,
      scrubNurseName: req.scrubNurseName,
      circulatingNurseName: req.circulatingNurseName,
      isEmergency: req.isEmergency,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.schedules.unshift(newSchedule);

    const surgReq = this.requests.find((r) => r.id === req.surgeryRequestId);
    if (surgReq) {
      surgReq.status = 'SCHEDULED';
      surgReq.updatedAt = new Date().toISOString();
    }
    room.status = 'RESERVED';
    this.addTrace(req.primarySurgeonName, 'THEATRE_COORDINATOR', 'CREATE_OT_SCHEDULE', 'OT_SCHEDULE', newSchedule.scheduleNumber, 'OT slot booked');
    return newSchedule;
  }

  async rescheduleOT(req: RescheduleOTRequest): Promise<OTScheduleDto> {
    const sched = this.schedules.find((s) => s.id === req.scheduleId);
    if (!sched) throw new Error('OT Schedule not found');
    const room = this.rooms.find((r) => r.id === req.newRoomId);
    sched.roomId = req.newRoomId;
    sched.roomName = room?.roomName || sched.roomName;
    sched.startTime = req.newStartTime;
    sched.endTime = req.newEndTime;
    sched.status = 'RESCHEDULED';
    sched.delayReason = req.reason;
    sched.updatedAt = new Date().toISOString();
    this.addTrace(req.rescheduledBy, 'THEATRE_COORDINATOR', 'RESCHEDULE_OT', 'OT_SCHEDULE', sched.scheduleNumber, req.reason);
    return sched;
  }

  async assignSurgicalTeam(req: AssignSurgicalTeamRequest): Promise<OTScheduleDto> {
    const sched = this.schedules.find((s) => s.id === req.scheduleId);
    if (!sched) throw new Error('OT Schedule not found');
    sched.primarySurgeonName = req.primarySurgeonName;
    sched.assistantSurgeonName = req.assistantSurgeonName;
    sched.leadAnaesthetistName = req.leadAnaesthetistName;
    sched.scrubNurseName = req.scrubNurseName;
    sched.circulatingNurseName = req.circulatingNurseName;
    sched.updatedAt = new Date().toISOString();
    this.addTrace(req.assignedBy, 'OT_MANAGER', 'ASSIGN_SURGICAL_TEAM', 'OT_SCHEDULE', sched.scheduleNumber, 'Surgical team assigned');
    return sched;
  }

  async completePreOpChecklist(req: CompletePreOpChecklistRequest): Promise<PreOpChecklistDto> {
    const newChecklist: PreOpChecklistDto = {
      id: 'pck-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      scheduleId: req.scheduleId,
      patientId: req.patientId,
      verifiedByNurse: req.verifiedByNurse,
      patientIdentityVerified: req.patientIdentityVerified,
      surgicalSiteMarked: req.surgicalSiteMarked,
      consentVerified: req.consentVerified,
      npoVerified: req.npoVerified,
      allergiesChecked: req.allergiesChecked,
      preOpVitalsChecked: req.preOpVitalsChecked,
      labReportsAvailable: req.labReportsAvailable,
      imagingAvailable: req.imagingAvailable,
      bloodReservedAndChecked: req.bloodReservedAndChecked,
      implantsVerifiedInOT: req.implantsVerifiedInOT,
      denturesJewelryRemoved: req.denturesJewelryRemoved,
      preMedicationAdministered: req.preMedicationAdministered,
      isClearedForOT: req.isClearedForOT,
      notes: req.notes,
      completedAt: new Date().toISOString()
    };
    this.preOpChecklists.unshift(newChecklist);
    this.addTrace(req.verifiedByNurse, 'STAFF_NURSE', 'COMPLETE_PREOP_CHECKLIST', 'PREOP_CHECKLIST', newChecklist.id, 'Pre-operative verification complete');
    return newChecklist;
  }

  async completeSafetyChecklist(req: CompleteSafetyChecklistRequest): Promise<SurgicalSafetyChecklistDto> {
    const newSafety: SurgicalSafetyChecklistDto = {
      id: 'ssc-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      scheduleId: req.scheduleId,
      patientId: req.patientId,
      stage: req.stage,
      conductedBy: req.conductedBy,
      conductedRole: req.conductedRole,
      patientConfirmed: req.patientConfirmed,
      siteMarkingConfirmed: req.siteMarkingConfirmed,
      anaesthesiaMachineChecked: req.anaesthesiaMachineChecked,
      pulseOximeterFunctioning: req.pulseOximeterFunctioning,
      knownAllergyConfirmed: req.knownAllergyConfirmed,
      difficultAirwayRiskEvaluated: req.difficultAirwayRiskEvaluated,
      bloodLossRiskEvaluated: req.bloodLossRiskEvaluated,
      teamIntroducedRoles: req.teamIntroducedRoles,
      antibioticProphylaxisGiven: req.antibioticProphylaxisGiven,
      essentialImagingDisplayed: req.essentialImagingDisplayed,
      spongeCountCorrect: req.spongeCountCorrect,
      needleCountCorrect: req.needleCountCorrect,
      instrumentCountCorrect: req.instrumentCountCorrect,
      specimenProperlyLabeled: req.specimenProperlyLabeled,
      equipmentIssuesIdentified: req.equipmentIssuesIdentified,
      recoveryConcernsAddressed: req.recoveryConcernsAddressed,
      isExceptionOverridden: req.isExceptionOverridden,
      overrideReason: req.overrideReason,
      timestamp: new Date().toISOString()
    };
    this.safetyChecklists.unshift(newSafety);
    this.addTrace(req.conductedBy, req.conductedRole, 'COMPLETE_SAFETY_CHECKLIST', 'WHO_SURGICAL_SAFETY', `${newSafety.scheduleId}-${req.stage}`, `WHO ${req.stage} executed`);
    return newSafety;
  }

  async createOTTransfer(req: CreateOTTransferRequest): Promise<OTTransferDto> {
    const room = this.rooms.find((r) => r.id === req.destinationRoomId);
    const newTransfer: OTTransferDto = {
      id: 'trf-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      transferNumber: `TRF-OT-${Date.now().toString().slice(-6)}`,
      scheduleId: req.scheduleId,
      patientId: req.patientId,
      patientName: req.patientName,
      sourceLocation: req.sourceLocation,
      destinationRoomId: req.destinationRoomId,
      destinationRoomName: room?.roomName || 'OT Suite',
      transportStaffName: req.transportStaffName,
      handoverGivenBy: req.handoverGivenBy,
      handoverReceivedBy: req.handoverReceivedBy,
      departureTime: new Date().toISOString(),
      arrivalTime: new Date().toISOString(),
      patientConditionOnArrival: req.patientConditionOnArrival || 'STABLE',
      status: 'COMPLETED',
      createdAt: new Date().toISOString()
    };
    this.transfers.unshift(newTransfer);
    this.addTrace(req.handoverReceivedBy, 'OT_RECEIVING_NURSE', 'CREATE_OT_TRANSFER', 'OT_TRANSFER', newTransfer.transferNumber, 'Patient transferred into OT holding bay');
    return newTransfer;
  }

  async createAnaesthesiaRecord(req: CreateAnaesthesiaRecordRequest): Promise<AnaesthesiaRecordDto> {
    const newAnaesth: AnaesthesiaRecordDto = {
      id: 'ans-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      scheduleId: req.scheduleId,
      patientId: req.patientId,
      leadAnaesthetist: req.leadAnaesthetist,
      anaesthesiaType: req.anaesthesiaType,
      inductionTime: new Date().toISOString(),
      intubationDetails: 'Endotracheal intubation successful on first attempt',
      airwayDeviceUsed: req.airwayDeviceUsed,
      administeredAgentsSummary: req.administeredAgentsSummary,
      ivFluidsAdministeredMl: req.ivFluidsAdministeredMl,
      bloodTransfusedUnits: req.bloodTransfusedUnits,
      estimatedIntraopBloodLossMl: req.estimatedIntraopBloodLossMl,
      intraopVitalsStability: req.intraopVitalsStability,
      postAnaesthesiaAldreteScore: req.postAnaesthesiaAldreteScore,
      createdAt: new Date().toISOString()
    };
    this.anaesthesiaRecords.unshift(newAnaesth);
    this.addTrace(req.leadAnaesthetist, 'ANAESTHETIST', 'CREATE_ANAESTHESIA_RECORD', 'ANAESTHESIA_RECORD', newAnaesth.id, 'Anaesthesia induction and management recorded');
    return newAnaesth;
  }

  async startSurgery(req: StartSurgeryRequest): Promise<IntraoperativeRecordDto> {
    const sched = this.schedules.find((s) => s.id === req.scheduleId);
    if (!sched) throw new Error('OT Schedule not found');
    sched.status = 'IN_PROGRESS';
    sched.updatedAt = new Date().toISOString();

    const room = this.rooms.find((r) => r.id === sched.roomId);
    if (room) {
      room.status = 'OCCUPIED';
      room.currentSurgeryId = sched.id;
      room.currentPatientName = sched.patientName;
      room.updatedAt = new Date().toISOString();
    }

    const newIntraop: IntraoperativeRecordDto = {
      id: 'iop-' + Math.random().toString(36).substring(2, 9),
      tenantId: sched.tenantId,
      partnerId: sched.partnerId,
      organizationId: sched.organizationId,
      branchId: sched.branchId,
      scheduleId: sched.id,
      patientId: sched.patientId,
      patientName: sched.patientName,
      procedureName: sched.procedureName,
      primarySurgeon: sched.primarySurgeonName,
      assistantSurgeon: sched.assistantSurgeonName,
      scrubNurse: sched.scrubNurseName,
      circulatingNurse: sched.circulatingNurseName,
      incisionTime: new Date().toISOString(),
      surgicalApproach: req.surgicalApproach,
      intraoperativeFindings: 'Procedure in progress; initial exploration clear',
      procedureDetails: req.notes || 'Incision made under sterile conditions',
      specimensCollectedCount: 0,
      implantsPlacedCount: 0,
      spongeCountVerified: true,
      needleCountVerified: true,
      instrumentCountVerified: true,
      closureTechnique: 'Pending closure',
      patientConditionPostSurgery: 'IN_PROGRESS',
      status: 'IN_PROGRESS',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.intraopRecords.unshift(newIntraop);
    this.addTrace(req.startedBy, 'PRIMARY_SURGEON', 'START_SURGERY', 'INTRAOPERATIVE_RECORD', newIntraop.id, 'Surgical incision made');
    return newIntraop;
  }

  async completeSurgery(req: CompleteSurgeryRequest): Promise<IntraoperativeRecordDto> {
    const sched = this.schedules.find((s) => s.id === req.scheduleId);
    if (!sched) throw new Error('OT Schedule not found');
    sched.status = 'COMPLETED';
    sched.updatedAt = new Date().toISOString();

    const room = this.rooms.find((r) => r.id === sched.roomId);
    if (room) {
      room.status = 'CLEANING';
      room.currentSurgeryId = undefined;
      room.currentPatientName = undefined;
      room.lastCleanedAt = new Date().toISOString();
      room.updatedAt = new Date().toISOString();
    }

    const intraop = this.intraopRecords.find((i) => i.scheduleId === req.scheduleId);
    if (!intraop) throw new Error('Intraoperative record not found');
    intraop.closureTime = new Date().toISOString();
    intraop.intraoperativeFindings = req.intraoperativeFindings;
    intraop.procedureDetails = req.procedureDetails;
    intraop.closureTechnique = req.closureTechnique;
    intraop.patientConditionPostSurgery = req.patientConditionPostSurgery;
    intraop.spongeCountVerified = req.spongeCountVerified;
    intraop.needleCountVerified = req.needleCountVerified;
    intraop.instrumentCountVerified = req.instrumentCountVerified;
    intraop.status = 'COMPLETED';
    intraop.updatedAt = new Date().toISOString();

    this.addTrace(req.completedBy, 'PRIMARY_SURGEON', 'COMPLETE_SURGERY', 'INTRAOPERATIVE_RECORD', intraop.id, 'Surgical closure complete and counts verified');
    return intraop;
  }

  async createOperativeNote(req: CreateOperativeNoteRequest): Promise<OperativeNoteDto> {
    try {
      const res = await apiRequest<OperativeNoteDto>(`/api/v1/partner/ot/schedules/${req.scheduleId}/operative-notes`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    const newNote: OperativeNoteDto = {
      id: 'opn-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      scheduleId: req.scheduleId,
      noteNumber: `OPN-${Date.now().toString().slice(-6)}`,
      patientId: req.patientId,
      patientName: req.patientName,
      patientMrn: req.patientMrn,
      primarySurgeonName: req.primarySurgeonName,
      preOperativeDiagnosis: req.preOperativeDiagnosis,
      postOperativeDiagnosis: req.postOperativeDiagnosis,
      procedurePerformedTitle: req.procedurePerformedTitle,
      detailedOperativeFindings: req.detailedOperativeFindings,
      operativeTechniqueStepByStep: req.operativeTechniqueStepByStep,
      estimatedBloodLossMl: req.estimatedBloodLossMl,
      tissueSpecimensSentForBiopsy: req.tissueSpecimensSentForBiopsy,
      prosthesisAndImplantsUsed: req.prosthesisAndImplantsUsed,
      postOperativeInstructions: req.postOperativeInstructions,
      isFinalized: false,
      versionNumber: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.operativeNotes.unshift(newNote);
    this.addTrace(req.primarySurgeonName, 'PRIMARY_SURGEON', 'CREATE_OPERATIVE_NOTE', 'OPERATIVE_NOTE', newNote.noteNumber, 'Operative note drafted');
    return newNote;
  }

  async finalizeOperativeNote(req: FinalizeOperativeNoteRequest): Promise<OperativeNoteDto> {
    const note = this.operativeNotes.find((n) => n.id === req.noteId);
    if (!note) throw new Error('Operative note not found');
    note.isFinalized = true;
    note.finalizedBy = req.finalizedBy;
    note.finalizedAt = new Date().toISOString();
    note.updatedAt = new Date().toISOString();
    this.addTrace(req.finalizedBy, 'PRIMARY_SURGEON', 'FINALIZE_OPERATIVE_NOTE', 'OPERATIVE_NOTE', note.noteNumber, 'Operative note digitally sealed');
    return note;
  }

  async createSpecimen(req: CreateSurgicalSpecimenRequest): Promise<SurgicalSpecimenDto> {
    const newSpecimen: SurgicalSpecimenDto = {
      id: 'spc-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      specimenNumber: `SPC-SURG-${Date.now().toString().slice(-6)}`,
      scheduleId: req.scheduleId,
      patientId: req.patientId,
      patientName: req.patientName,
      anatomicOriginSite: req.anatomicOriginSite,
      specimenDescription: req.specimenDescription,
      fixativeUsed: req.fixativeUsed,
      orderedInvestigation: req.orderedInvestigation,
      destinationLab: req.destinationLab,
      collectedBySurgeon: req.collectedBySurgeon,
      collectionTime: new Date().toISOString(),
      labelVerifiedByNurse: req.labelVerifiedByNurse,
      labHandoverStatus: 'TRANSIT_TO_LAB',
      createdAt: new Date().toISOString()
    };
    this.specimens.unshift(newSpecimen);
    this.addTrace(req.collectedBySurgeon, 'SURGEON', 'CREATE_SURGICAL_SPECIMEN', 'SURGICAL_SPECIMEN', newSpecimen.specimenNumber, req.specimenDescription);
    return newSpecimen;
  }

  async createImplant(req: CreateSurgicalImplantRequest): Promise<SurgicalImplantDto> {
    const newImplant: SurgicalImplantDto = {
      id: 'imp-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      implantTrackingNumber: `IMP-${Date.now().toString().slice(-6)}`,
      scheduleId: req.scheduleId,
      patientId: req.patientId,
      patientName: req.patientName,
      implantName: req.implantName,
      implantType: req.implantType,
      manufacturerName: req.manufacturerName,
      modelNumber: req.modelNumber,
      serialOrLotNumber: req.serialOrLotNumber,
      anatomicPlacementSite: req.anatomicPlacementSite,
      implantedBySurgeon: req.implantedBySurgeon,
      implantTimestamp: new Date().toISOString(),
      supplierOrVendor: req.supplierOrVendor,
      unitCost: req.unitCost,
      status: 'IMPLANTED',
      createdAt: new Date().toISOString()
    };
    this.implants.unshift(newImplant);
    this.addTrace(req.implantedBySurgeon, 'SURGEON', 'CREATE_SURGICAL_IMPLANT', 'SURGICAL_IMPLANT', newImplant.implantTrackingNumber, `Implant ${req.implantName} placed`);
    return newImplant;
  }

  async recordConsumableUsage(req: RecordConsumableUsageRequest): Promise<SurgicalConsumableUsageDto> {
    const newConsumable: SurgicalConsumableUsageDto = {
      id: 'csm-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      scheduleId: req.scheduleId,
      patientId: req.patientId,
      itemCode: req.itemCode,
      itemName: req.itemName,
      batchNumber: req.batchNumber,
      quantityUsed: req.quantityUsed,
      unitOfMeasure: req.unitOfMeasure,
      unitPrice: req.unitPrice,
      totalCost: req.quantityUsed * req.unitPrice,
      recordedBy: req.recordedBy,
      inventoryDeductionStatus: 'DEDUCTED',
      usedAt: new Date().toISOString()
    };
    this.consumables.unshift(newConsumable);
    this.addTrace(req.recordedBy, 'SCRUB_NURSE', 'RECORD_CONSUMABLE_USAGE', 'SURGICAL_CONSUMABLE', newConsumable.id, `Consumed ${req.quantityUsed} of ${req.itemName}`);
    return newConsumable;
  }

  async createPACURecord(req: CreatePACURecordRequest): Promise<PACURecoveryRecordDto> {
    try {
      const res = await apiRequest<PACURecoveryRecordDto>(`/api/v1/partner/ot/schedules/${req.scheduleId}/pacu`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    const newPACU: PACURecoveryRecordDto = {
      id: 'pcu-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      scheduleId: req.scheduleId,
      patientId: req.patientId,
      patientName: req.patientName,
      patientMrn: req.patientMrn,
      recoveryBedNumber: req.recoveryBedNumber,
      pacuNurseName: req.pacuNurseName,
      arrivalTime: new Date().toISOString(),
      initialAldreteScore: req.initialAldreteScore,
      currentAldreteScore: req.currentAldreteScore,
      consciousnessLevel: req.consciousnessLevel,
      airwayStatus: req.airwayStatus,
      oxygenSupportLpm: req.oxygenSupportLpm,
      spo2Percentage: req.spo2Percentage,
      systolicBpMmHg: req.systolicBpMmHg,
      diastolicBpMmHg: req.diastolicBpMmHg,
      heartRateBpm: req.heartRateBpm,
      painScoreNumeric: req.painScoreNumeric,
      nauseaVomitingStatus: req.nauseaVomitingStatus,
      woundDrainOutputMl: 0,
      status: 'RECOVERING',
      dischargeCriteriaMet: req.currentAldreteScore >= 9,
      authorizedTransferDestination: req.authorizedTransferDestination,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.pacuRecords.unshift(newPACU);
    this.addTrace(req.pacuNurseName, 'PACU_NURSE', 'CREATE_PACU_RECORD', 'PACU_RECORD', newPACU.id, 'Patient admitted to PACU recovery bay');
    return newPACU;
  }

  async createPostoperativeTransfer(req: CreatePostoperativeTransferRequest): Promise<PostoperativeTransferDto> {
    try {
      const res = await apiRequest<PostoperativeTransferDto>(`/api/v1/partner/ot/schedules/${req.scheduleId}/transfer-postop`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    const newTransfer: PostoperativeTransferDto = {
      id: 'ptr-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      transferNumber: `PTR-${Date.now().toString().slice(-6)}`,
      scheduleId: req.scheduleId,
      patientId: req.patientId,
      patientName: req.patientName,
      originLocation: req.originLocation,
      destinationWardOrICU: req.destinationWardOrICU,
      destinationBedNumber: req.destinationBedNumber,
      transferringNurse: req.transferringNurse,
      receivingNurse: req.receivingNurse,
      clinicalConditionSummary: req.clinicalConditionSummary,
      transferTime: new Date().toISOString(),
      status: 'COMPLETED',
      createdAt: new Date().toISOString()
    };
    this.postOpTransfers.unshift(newTransfer);

    const pacu = this.pacuRecords.find((p) => p.scheduleId === req.scheduleId);
    if (pacu) {
      pacu.status = 'TRANSFERRED';
      pacu.dischargedAt = new Date().toISOString();
      pacu.updatedAt = new Date().toISOString();
    }
    this.addTrace(req.transferringNurse, 'PACU_NURSE', 'CREATE_POSTOP_TRANSFER', 'POSTOP_TRANSFER', newTransfer.transferNumber, 'Patient transferred to inpatient post-op unit');
    return newTransfer;
  }

  async cancelSurgery(req: CancelSurgeryRequest): Promise<SurgeryCancellationDto> {
    const sched = this.schedules.find((s) => s.id === req.scheduleId);
    if (!sched) throw new Error('OT Schedule not found');
    sched.status = 'CANCELLED';
    sched.delayReason = req.cancellationReason;
    sched.updatedAt = new Date().toISOString();

    const room = this.rooms.find((r) => r.id === sched.roomId);
    if (room && room.status === 'RESERVED') {
      room.status = 'AVAILABLE';
      room.updatedAt = new Date().toISOString();
    }

    const cancellation: SurgeryCancellationDto = {
      id: 'cnl-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: sched.partnerId,
      organizationId: sched.organizationId,
      branchId: sched.branchId,
      cancellationNumber: `CNL-${Date.now().toString().slice(-6)}`,
      scheduleId: sched.id,
      patientId: sched.patientId,
      patientName: sched.patientName,
      procedureName: sched.procedureName,
      cancellationReason: req.cancellationReason,
      cancelledBy: req.cancelledBy,
      cancelledByRole: req.cancelledByRole,
      reschedulingRequested: req.reschedulingRequested,
      notes: req.notes,
      cancelledAt: new Date().toISOString()
    };
    this.cancellations.unshift(cancellation);
    this.addTrace(req.cancelledBy, req.cancelledByRole, 'CANCEL_SURGERY', 'SURGERY_CANCELLATION', cancellation.cancellationNumber, req.cancellationReason);
    return cancellation;
  }

  async createEmergencySurgery(req: CreateEmergencySurgeryRequest): Promise<OTScheduleDto> {
    const room = this.rooms.find((r) => r.id === req.roomId);
    if (!room) throw new Error('OT Room not found');

    const emergencySchedule: OTScheduleDto = {
      id: 'ots-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      scheduleNumber: `EMERG-OT-${Date.now().toString().slice(-6)}`,
      surgeryRequestId: 'req-emerg-' + Math.random().toString(36).substring(2, 7),
      patientId: req.patientId,
      patientName: req.patientName,
      patientMrn: req.patientMrn,
      procedureName: req.procedureName,
      roomId: req.roomId,
      roomName: room.roomName,
      scheduledDate: new Date().toISOString(),
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
      estimatedDurationMinutes: 120,
      primarySurgeonName: req.primarySurgeonName,
      leadAnaesthetistName: req.leadAnaesthetistName,
      scrubNurseName: 'Emergency Scrub Nurse',
      circulatingNurseName: 'Emergency Circulating Nurse',
      isEmergency: true,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.schedules.unshift(emergencySchedule);
    room.status = 'OCCUPIED';
    room.currentSurgeryId = emergencySchedule.id;
    room.currentPatientName = req.patientName;
    this.addTrace(req.emergencyAuthorizationBy, 'CHIEF_TRAUMA_SURGEON', 'CREATE_EMERGENCY_SURGERY', 'EMERGENCY_OT', emergencySchedule.scheduleNumber, req.emergencyIndication);
    return emergencySchedule;
  }

  async overrideConflict(req: OverrideOTConflictRequest): Promise<void> {
    this.addTrace(req.authorizedBy, req.authorizedRole, 'OVERRIDE_OT_CONFLICT', 'OT_CONFLICT_OVERRIDE', req.scheduleId, `${req.conflictType}: ${req.justification}`);
  }
}

export const operationTheatreManagementService = new MockOperationTheatreManagementService();