import { apiRequest, isMockFallbackAllowed } from './api-client.js';
import type {
  EmergencyDepartmentDto,
  EmergencyZoneDto,
  EmergencyEncounterDto,
  EmergencyTriageAssessmentDto,
  EmergencyTriageReassessmentDto,
  EmergencyResuscitationEventDto,
  TraumaActivationDto,
  EmergencyObservationCaseDto,
  EmergencyMLCCaseDto,
  EmergencyCrashCartDto,
  EmergencyAmbulanceTransferDto,
  EmergencyDispositionDto,
  EmergencyDeathRecordDto,
  EmergencyDisasterEventDto,
  EmergencyAuditTraceDto,
  EmergencyOverviewMetricsDto,
  EmergencyAnalyticsDto,
  RegisterEmergencyPatientRequest,
  CreateTriageAssessmentRequest,
  ReassessTriageRequest,
  AssignEmergencyPatientRequest,
  CreateResuscitationEventRequest,
  RecordResuscitationActionRequest,
  CreateTraumaActivationRequest,
  RecordTraumaAssessmentRequest,
  CreateEmergencyProcedureRequest,
  CreateObservationCaseRequest,
  CreateMLCCaseRequest,
  CreateAmbulanceTransferRequest,
  CreateDispositionRequest,
  CreateEmergencyDeathRecordRequest,
  ActivateDisasterModeRequest,
  RegisterDisasterPatientRequest,
  CheckCrashCartRequest
} from '@docsearch/api-contracts';

import {
  mockEmergencyDepartment,
  mockEmergencyZones,
  mockEmergencyEncounters,
  mockTriageAssessments,
  mockTriageReassessments,
  mockResuscitationEvents,
  mockTraumaActivations,
  mockObservationCases,
  mockMLCCases,
  mockCrashCarts,
  mockAmbulanceTransfers,
  mockDispositions,
  mockDeathRecords,
  mockDisasterEvents,
  mockAuditTraces,
  mockOverviewMetrics,
  mockAnalytics
} from './mock-emergency-data.js';

export interface IEmergencyManagementService {
  getOverviewMetrics(tenantId: string): Promise<EmergencyOverviewMetricsDto>;
  getAnalytics(tenantId: string): Promise<EmergencyAnalyticsDto>;
  getDepartment(tenantId: string): Promise<EmergencyDepartmentDto>;
  getZones(tenantId: string): Promise<EmergencyZoneDto[]>;
  getEncounters(tenantId: string): Promise<EmergencyEncounterDto[]>;
  getTriageAssessments(tenantId: string): Promise<EmergencyTriageAssessmentDto[]>;
  getTriageReassessments(tenantId: string): Promise<EmergencyTriageReassessmentDto[]>;
  getResuscitationEvents(tenantId: string): Promise<EmergencyResuscitationEventDto[]>;
  getTraumaActivations(tenantId: string): Promise<TraumaActivationDto[]>;
  getObservationCases(tenantId: string): Promise<EmergencyObservationCaseDto[]>;
  getMLCCases(tenantId: string): Promise<EmergencyMLCCaseDto[]>;
  getCrashCarts(tenantId: string): Promise<EmergencyCrashCartDto[]>;
  getAmbulanceTransfers(tenantId: string): Promise<EmergencyAmbulanceTransferDto[]>;
  getDispositions(tenantId: string): Promise<EmergencyDispositionDto[]>;
  getDeathRecords(tenantId: string): Promise<EmergencyDeathRecordDto[]>;
  getDisasterEvents(tenantId: string): Promise<EmergencyDisasterEventDto[]>;
  getAuditTraces(tenantId: string): Promise<EmergencyAuditTraceDto[]>;

  registerEmergencyPatient(req: RegisterEmergencyPatientRequest): Promise<EmergencyEncounterDto>;
  createTriageAssessment(req: CreateTriageAssessmentRequest): Promise<EmergencyTriageAssessmentDto>;
  reassessTriage(req: ReassessTriageRequest): Promise<EmergencyTriageReassessmentDto>;
  assignEmergencyPatient(req: AssignEmergencyPatientRequest): Promise<EmergencyEncounterDto>;
  createResuscitationEvent(req: CreateResuscitationEventRequest): Promise<EmergencyResuscitationEventDto>;
  recordResuscitationAction(req: RecordResuscitationActionRequest): Promise<EmergencyResuscitationEventDto>;
  createTraumaActivation(req: CreateTraumaActivationRequest): Promise<TraumaActivationDto>;
  recordTraumaAssessment(req: RecordTraumaAssessmentRequest): Promise<TraumaActivationDto>;
  createEmergencyProcedure(req: CreateEmergencyProcedureRequest): Promise<void>;
  recordTreatment(encounterId: string, payload: { treatmentNotes: string; medicationsAdministered?: any[]; proceduresPerformed?: any[]; ordersPlaced?: any[] }): Promise<any>;
  createObservationCase(req: CreateObservationCaseRequest): Promise<EmergencyObservationCaseDto>;
  createMLCCase(req: CreateMLCCaseRequest): Promise<EmergencyMLCCaseDto>;
  createAmbulanceTransfer(req: CreateAmbulanceTransferRequest): Promise<EmergencyAmbulanceTransferDto>;
  createDisposition(req: CreateDispositionRequest): Promise<EmergencyDispositionDto>;
  createDeathRecord(req: CreateEmergencyDeathRecordRequest): Promise<EmergencyDeathRecordDto>;
  activateDisasterMode(req: ActivateDisasterModeRequest): Promise<EmergencyDisasterEventDto>;
  registerDisasterPatient(req: RegisterDisasterPatientRequest): Promise<EmergencyEncounterDto>;
  checkCrashCart(req: CheckCrashCartRequest): Promise<EmergencyCrashCartDto>;
}

export class MockEmergencyManagementService implements IEmergencyManagementService {
  private department: EmergencyDepartmentDto = isMockFallbackAllowed() ? { ...mockEmergencyDepartment } : {
    ...mockEmergencyDepartment,
    totalBeds: 0,
    resuscitationBeds: 0,
    traumaBeds: 0,
    observationBeds: 0,
    isDisasterModeActive: false
  };
  private zones: EmergencyZoneDto[] = isMockFallbackAllowed() ? [...mockEmergencyZones] : [];
  private encounters: EmergencyEncounterDto[] = isMockFallbackAllowed() ? [...mockEmergencyEncounters] : [];
  private triageAssessments: EmergencyTriageAssessmentDto[] = isMockFallbackAllowed() ? [...mockTriageAssessments] : [];
  private triageReassessments: EmergencyTriageReassessmentDto[] = isMockFallbackAllowed() ? [...mockTriageReassessments] : [];
  private resuscitationEvents: EmergencyResuscitationEventDto[] = isMockFallbackAllowed() ? [...mockResuscitationEvents] : [];
  private traumaActivations: TraumaActivationDto[] = isMockFallbackAllowed() ? [...mockTraumaActivations] : [];
  private observationCases: EmergencyObservationCaseDto[] = isMockFallbackAllowed() ? [...mockObservationCases] : [];
  private mlcCases: EmergencyMLCCaseDto[] = isMockFallbackAllowed() ? [...mockMLCCases] : [];
  private crashCarts: EmergencyCrashCartDto[] = isMockFallbackAllowed() ? [...mockCrashCarts] : [];
  private transfers: EmergencyAmbulanceTransferDto[] = isMockFallbackAllowed() ? [...mockAmbulanceTransfers] : [];
  private dispositions: EmergencyDispositionDto[] = isMockFallbackAllowed() ? [...mockDispositions] : [];
  private deathRecords: EmergencyDeathRecordDto[] = isMockFallbackAllowed() ? [...mockDeathRecords] : [];
  private disasterEvents: EmergencyDisasterEventDto[] = isMockFallbackAllowed() ? [...mockDisasterEvents] : [];
  private auditTraces: EmergencyAuditTraceDto[] = isMockFallbackAllowed() ? [...mockAuditTraces] : [];

  private addTrace(actorName: string, actorRole: string, action: string, entityType: string, entityCode: string, justification: string, tenantId = '11111111-1111-4111-8111-111111111111') {
    const trace: EmergencyAuditTraceDto = {
      id: 'eaud-' + Math.random().toString(36).substring(2, 9),
      tenantId,
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      traceNumber: `TRACE-ED-${Date.now().toString().slice(-8)}`,
      actorId: 'usr-ed-officer',
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

  async getOverviewMetrics(tenantId: string): Promise<EmergencyOverviewMetricsDto> {
    const activeEncounters = this.encounters.filter((e) => e.tenantId === tenantId && !['DISCHARGED', 'ADMITTED', 'TRANSFERRED', 'DECEASED', 'CANCELLED'].includes(e.currentStatus));
    const waitingForTriageCount = activeEncounters.filter((e) => e.currentStatus === 'ARRIVED' || e.currentStatus === 'TRIAGE_PENDING').length;
    const esi1Count = activeEncounters.filter((e) => e.triageEsiLevel === 'ESI_1_IMMEDIATE_RESUSCITATION').length;
    const esi2Count = activeEncounters.filter((e) => e.triageEsiLevel === 'ESI_2_EMERGENT_HIGH_RISK').length;
    const esi3Count = activeEncounters.filter((e) => e.triageEsiLevel === 'ESI_3_URGENT_MULTIPLE_RESOURCES').length;
    const activeTraumaAlerts = activeEncounters.filter((e) => e.isTraumaAlert).length;
    const activeResuscitationCount = activeEncounters.filter((e) => e.isCodeBlue).length;
    const mlcCasesToday = activeEncounters.filter((e) => e.isMLC).length;
    const observationPatientsCount = this.observationCases.filter((o) => o.tenantId === tenantId && o.status === 'ACTIVE_MONITORING').length;

    const baseMetrics = isMockFallbackAllowed() ? mockOverviewMetrics : {
      ...mockOverviewMetrics,
      activeEDCensus: 0,
      waitingForTriageCount: 0,
      esi1Count: 0,
      esi2Count: 0,
      esi3Count: 0,
      activeTraumaAlerts: 0,
      activeResuscitationCount: 0,
      mlcCasesToday: 0,
      observationPatientsCount: 0,
      isDisasterModeActive: false,
      averageDoorToDoctorMinutes: 0,
      averageDoorToTriageMinutes: 0,
      averageLengthOfStayMinutes: 0,
      leftWithoutBeingSeenCount: 0,
      criticalBedOccupancyPercentage: 0
    };

    return {
      ...baseMetrics,
      activeEDCensus: activeEncounters.length,
      waitingForTriageCount,
      esi1Count,
      esi2Count,
      esi3Count,
      activeTraumaAlerts,
      activeResuscitationCount,
      mlcCasesToday,
      observationPatientsCount,
      isDisasterModeActive: this.department.isDisasterModeActive
    };
  }

  async getAnalytics(_tenantId: string): Promise<EmergencyAnalyticsDto> {
    return { ...mockAnalytics };
  }

  async getDepartment(tenantId: string): Promise<EmergencyDepartmentDto> {
    return { ...this.department, tenantId };
  }

  async getZones(tenantId: string): Promise<EmergencyZoneDto[]> {
    return this.zones.filter((z) => z.tenantId === tenantId);
  }

  async getEncounters(tenantId: string): Promise<EmergencyEncounterDto[]> {
    try {
      const res = await apiRequest<EmergencyEncounterDto[]>('/api/v1/partner/emergency/queue');
      if (res.success && Array.isArray(res.data)) {
        this.encounters = res.data;
        return res.data;
      }
      if (!isMockFallbackAllowed() && res.error) {
        throw new Error(res.error.message || 'Failed to fetch emergency queue from server');
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return this.encounters.filter((e) => e.tenantId === tenantId);
  }

  async getTriageAssessments(tenantId: string): Promise<EmergencyTriageAssessmentDto[]> {
    return this.triageAssessments.filter((t) => t.tenantId === tenantId);
  }

  async getTriageReassessments(tenantId: string): Promise<EmergencyTriageReassessmentDto[]> {
    return this.triageReassessments.filter((t) => t.tenantId === tenantId);
  }

  async getResuscitationEvents(tenantId: string): Promise<EmergencyResuscitationEventDto[]> {
    return this.resuscitationEvents.filter((r) => r.tenantId === tenantId);
  }

  async getTraumaActivations(tenantId: string): Promise<TraumaActivationDto[]> {
    return this.traumaActivations.filter((t) => t.tenantId === tenantId);
  }

  async getObservationCases(tenantId: string): Promise<EmergencyObservationCaseDto[]> {
    return this.observationCases.filter((o) => o.tenantId === tenantId);
  }

  async getMLCCases(tenantId: string): Promise<EmergencyMLCCaseDto[]> {
    return this.mlcCases.filter((m) => m.tenantId === tenantId);
  }

  async getCrashCarts(tenantId: string): Promise<EmergencyCrashCartDto[]> {
    return this.crashCarts.filter((c) => c.tenantId === tenantId);
  }

  async getAmbulanceTransfers(tenantId: string): Promise<EmergencyAmbulanceTransferDto[]> {
    return this.transfers.filter((t) => t.tenantId === tenantId);
  }

  async getDispositions(tenantId: string): Promise<EmergencyDispositionDto[]> {
    return this.dispositions.filter((d) => d.tenantId === tenantId);
  }

  async getDeathRecords(tenantId: string): Promise<EmergencyDeathRecordDto[]> {
    return this.deathRecords.filter((d) => d.tenantId === tenantId);
  }

  async getDisasterEvents(tenantId: string): Promise<EmergencyDisasterEventDto[]> {
    return this.disasterEvents.filter((d) => d.tenantId === tenantId);
  }

  async getAuditTraces(tenantId: string): Promise<EmergencyAuditTraceDto[]> {
    return this.auditTraces.filter((a) => a.tenantId === tenantId);
  }

  async registerEmergencyPatient(req: RegisterEmergencyPatientRequest): Promise<EmergencyEncounterDto> {
    try {
      const res = await apiRequest<EmergencyEncounterDto>('/api/v1/partner/emergency/registrations', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        return res.data;
      }
      if (!isMockFallbackAllowed()) {
        throw new Error(res.error?.message || 'Emergency registration rejected by server');
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) {
        throw err instanceof Error ? err : new Error('Emergency registration network error');
      }
    }
    const enc: EmergencyEncounterDto = {
      id: 'ee-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      encounterNumber: `EMG-${Date.now().toString().slice(-6)}`,
      patientId: 'pat-emg-' + Math.random().toString(36).substring(2, 7),
      patientName: req.patientName,
      patientMrn: req.patientMrn,
      isUnknownPatient: req.isUnknownPatient,
      temporaryIdentifier: req.temporaryIdentifier,
      patientGender: req.patientGender,
      patientAge: req.patientAge,
      arrivalMode: req.arrivalMode,
      broughtBy: req.broughtBy,
      referralSource: req.referralSource,
      chiefComplaint: req.chiefComplaint,
      arrivalTimestamp: new Date().toISOString(),
      registrationTimestamp: new Date().toISOString(),
      currentStatus: 'TRIAGE_PENDING',
      isTraumaAlert: false,
      isCodeBlue: false,
      isMLC: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.encounters.unshift(enc);
    this.addTrace(req.broughtBy, 'EMERGENCY_RECEPTION', 'REGISTER_EMERGENCY_PATIENT', 'EMERGENCY_ENCOUNTER', enc.encounterNumber, req.chiefComplaint);
    return enc;
  }

  async createTriageAssessment(req: CreateTriageAssessmentRequest): Promise<EmergencyTriageAssessmentDto> {
    try {
      const res = await apiRequest<EmergencyTriageAssessmentDto>(`/api/v1/partner/emergency/encounters/${req.encounterId}/triage`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        return res.data;
      }
      if (!isMockFallbackAllowed()) {
        throw new Error(res.error?.message || 'Triage assessment rejected by server');
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) {
        throw err instanceof Error ? err : new Error('Triage assessment network error');
      }
    }
    const newTriage: EmergencyTriageAssessmentDto = {
      id: 'eta-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      encounterId: req.encounterId,
      patientId: req.patientId,
      patientName: req.patientName,
      triageNurseName: req.triageNurseName,
      esiLevel: req.esiLevel,
      chiefComplaint: req.chiefComplaint,
      painScore: req.painScore,
      systolicBp: req.systolicBp,
      diastolicBp: req.diastolicBp,
      pulseRate: req.pulseRate,
      respiratoryRate: req.respiratoryRate,
      temperatureF: req.temperatureF,
      spo2Percentage: req.spo2Percentage,
      gcsScore: req.gcsScore,
      allergiesNoted: req.allergiesNoted,
      sepsisScreenPositive: req.sepsisScreenPositive,
      strokeScreenPositive: req.strokeScreenPositive,
      stemiScreenPositive: req.stemiScreenPositive,
      triageNotes: req.triageNotes,
      timestamp: new Date().toISOString()
    };
    this.triageAssessments.unshift(newTriage);

    const enc = this.encounters.find((e) => e.id === req.encounterId);
    if (enc) {
      enc.triageEsiLevel = req.esiLevel;
      enc.currentStatus = req.esiLevel === 'ESI_1_IMMEDIATE_RESUSCITATION' ? 'RESUSCITATION' : 'TRIAGED';
      enc.updatedAt = new Date().toISOString();
    }
    this.addTrace(req.triageNurseName, 'TRIAGE_NURSE', 'PERFORM_TRIAGE', 'TRIAGE_ASSESSMENT', newTriage.id, `Classified as ${req.esiLevel}`);
    return newTriage;
  }

  async reassessTriage(req: ReassessTriageRequest): Promise<EmergencyTriageReassessmentDto> {
    const enc = this.encounters.find((e) => e.id === req.encounterId);
    const prevEsi = enc?.triageEsiLevel || 'ESI_3_URGENT_MULTIPLE_RESOURCES';

    const newReassessment: EmergencyTriageReassessmentDto = {
      id: 'etr-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      encounterId: req.encounterId,
      reassessedByNurse: req.reassessedByNurse,
      previousEsi: prevEsi,
      newEsi: req.newEsi,
      justification: req.justification,
      reassessmentVitalsSummary: req.reassessmentVitalsSummary,
      timestamp: new Date().toISOString()
    };
    this.triageReassessments.unshift(newReassessment);

    if (enc) {
      enc.triageEsiLevel = req.newEsi;
      enc.updatedAt = new Date().toISOString();
    }
    this.addTrace(req.reassessedByNurse, 'TRIAGE_NURSE', 'REASSESS_TRIAGE', 'TRIAGE_REASSESSMENT', newReassessment.id, req.justification);
    return newReassessment;
  }

  async assignEmergencyPatient(req: AssignEmergencyPatientRequest): Promise<EmergencyEncounterDto> {
    const enc = this.encounters.find((e) => e.id === req.encounterId);
    if (!enc) throw new Error('Emergency encounter not found');
    const zone = this.zones.find((z) => z.id === req.zoneId);

    enc.currentZoneId = req.zoneId;
    enc.currentZoneName = zone?.zoneName || 'Emergency Acute Zone';
    enc.currentBedNumber = req.bedNumber;
    enc.assignedPhysicianName = req.assignedPhysicianName;
    enc.assignedNurseName = req.assignedNurseName;
    enc.currentStatus = 'IN_TREATMENT';
    enc.updatedAt = new Date().toISOString();

    this.addTrace(req.assignedBy, 'ED_COORDINATOR', 'ASSIGN_PATIENT', 'EMERGENCY_ENCOUNTER', enc.encounterNumber, `Assigned to ${req.bedNumber} (${zone?.zoneName})`);
    return enc;
  }

  async createResuscitationEvent(req: CreateResuscitationEventRequest): Promise<EmergencyResuscitationEventDto> {
    const newEvent: EmergencyResuscitationEventDto = {
      id: 'ere-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      encounterId: req.encounterId,
      patientName: req.patientName,
      eventNumber: `CODE-BLUE-${Date.now().toString().slice(-6)}`,
      locationBay: req.locationBay,
      teamLeaderName: req.teamLeaderName,
      initialRhythm: req.initialRhythm,
      startTime: new Date().toISOString(),
      cprDurationMinutes: 0,
      shocksDeliveredCount: 0,
      airwaySecuredType: req.airwaySecuredType,
      medicationsAdministeredSummary: '',
      roscAchieved: false,
      finalOutcome: 'IN_PROGRESS',
      notes: req.notes,
      createdAt: new Date().toISOString()
    };
    this.resuscitationEvents.unshift(newEvent);

    const enc = this.encounters.find((e) => e.id === req.encounterId);
    if (enc) {
      enc.isCodeBlue = true;
      enc.currentStatus = 'RESUSCITATION';
      enc.updatedAt = new Date().toISOString();
    }
    this.addTrace(req.teamLeaderName, 'RESUSCITATION_LEADER', 'CREATE_CODE_BLUE', 'RESUSCITATION_EVENT', newEvent.eventNumber, req.notes);
    return newEvent;
  }

  async recordResuscitationAction(req: RecordResuscitationActionRequest): Promise<EmergencyResuscitationEventDto> {
    const event = this.resuscitationEvents.find((e) => e.id === req.eventId);
    if (!event) throw new Error('Resuscitation event not found');

    event.cprDurationMinutes = req.cprDurationMinutes;
    event.shocksDeliveredCount = req.shocksDeliveredCount;
    event.medicationsAdministeredSummary = req.medicationsAdministeredSummary;
    event.roscAchieved = req.roscAchieved;
    event.finalOutcome = req.finalOutcome;
    event.endTime = new Date().toISOString();

    this.addTrace(req.recordedBy, 'RESUSCITATION_LEADER', 'LOG_RESUSCITATION_ACTION', 'RESUSCITATION_EVENT', event.eventNumber, req.actionTaken);
    return event;
  }

  async createTraumaActivation(req: CreateTraumaActivationRequest): Promise<TraumaActivationDto> {
    const newTrauma: TraumaActivationDto = {
      id: 'tra-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      encounterId: req.encounterId,
      patientName: req.patientName,
      activationNumber: `TRAUMA-ACT-${Date.now().toString().slice(-6)}`,
      activationLevel: req.activationLevel,
      mechanismOfInjury: req.mechanismOfInjury,
      timeOfInjury: req.timeOfInjury,
      traumaTeamLeader: req.traumaTeamLeader,
      airwayStatus: req.airwayStatus,
      breathingStatus: req.breathingStatus,
      circulationStatus: req.circulationStatus,
      disabilityGcs: req.disabilityGcs,
      exposureFindings: req.exposureFindings,
      fastScanPositive: req.fastScanPositive,
      pelvicBinderApplied: req.pelvicBinderApplied,
      massiveTransfusionActivated: req.massiveTransfusionActivated,
      specialistConsultsCalled: req.specialistConsultsCalled,
      dispositionPlan: req.dispositionPlan,
      activatedAt: new Date().toISOString()
    };
    this.traumaActivations.unshift(newTrauma);

    const enc = this.encounters.find((e) => e.id === req.encounterId);
    if (enc) {
      enc.isTraumaAlert = true;
      enc.currentStatus = 'IN_TREATMENT';
      enc.updatedAt = new Date().toISOString();
    }
    this.addTrace(req.traumaTeamLeader, 'TRAUMA_SURGEON', 'ACTIVATE_TRAUMA', 'TRAUMA_ACTIVATION', newTrauma.activationNumber, req.mechanismOfInjury);
    return newTrauma;
  }

  async recordTraumaAssessment(req: RecordTraumaAssessmentRequest): Promise<TraumaActivationDto> {
    const trauma = this.traumaActivations.find((t) => t.id === req.traumaId);
    if (!trauma) throw new Error('Trauma activation record not found');

    trauma.disabilityGcs = req.updatedGcs;
    trauma.exposureFindings += ` | Secondary: ${req.secondarySurveyFindings} (${req.fracturesIdentified})`;
    trauma.specialistConsultsCalled += ` | ${req.consultantSurgeonFindings}`;
    trauma.closedAt = new Date().toISOString();

    this.addTrace(req.recordedBy, 'TRAUMA_SURGEON', 'RECORD_TRAUMA_SECONDARY_SURVEY', 'TRAUMA_ACTIVATION', trauma.activationNumber, req.secondarySurveyFindings);
    return trauma;
  }

  async createEmergencyProcedure(req: CreateEmergencyProcedureRequest): Promise<void> {
    this.addTrace(req.performedByDoctor, 'EMERGENCY_PHYSICIAN', 'PERFORM_EMERGENCY_PROCEDURE', 'EMERGENCY_PROCEDURE', req.encounterId, `${req.procedureName}: ${req.indication}`);
  }

  async recordTreatment(encounterId: string, payload: { treatmentNotes: string; medicationsAdministered?: any[]; proceduresPerformed?: any[]; ordersPlaced?: any[] }): Promise<any> {
    try {
      const res = await apiRequest(`/api/v1/partner/emergency/encounters/${encodeURIComponent(encounterId)}/treatments`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success && res.data) {
        return res.data;
      }
      if (!isMockFallbackAllowed()) {
        throw new Error(res.error?.message || 'Emergency treatment rejected by server');
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) {
        throw err instanceof Error ? err : new Error('Emergency treatment network error');
      }
    }
    return { encounterId, ...payload, recordedAt: new Date().toISOString() };
  }

  async createObservationCase(req: CreateObservationCaseRequest): Promise<EmergencyObservationCaseDto> {
    const newCase: EmergencyObservationCaseDto = {
      id: 'eoc-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      encounterId: req.encounterId,
      patientName: req.patientName,
      observationBedNumber: req.observationBedNumber,
      admissionReason: req.admissionReason,
      attendingDoctor: req.attendingDoctor,
      startedAt: new Date().toISOString(),
      clinicalProgressSummary: req.clinicalProgressSummary,
      hoursInObservation: 0,
      status: 'ACTIVE_MONITORING'
    };
    this.observationCases.unshift(newCase);

    const enc = this.encounters.find((e) => e.id === req.encounterId);
    if (enc) {
      enc.currentStatus = 'OBSERVATION';
      enc.currentBedNumber = req.observationBedNumber;
      enc.updatedAt = new Date().toISOString();
    }
    this.addTrace(req.attendingDoctor, 'ATTENDING_PHYSICIAN', 'ADMIT_TO_OBSERVATION', 'OBSERVATION_CASE', newCase.id, req.admissionReason);
    return newCase;
  }

  async createMLCCase(req: CreateMLCCaseRequest): Promise<EmergencyMLCCaseDto> {
    const newMLC: EmergencyMLCCaseDto = {
      id: 'mlc-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      encounterId: req.encounterId,
      patientName: req.patientName,
      mlcNumber: `MLC-${Date.now().toString().slice(-6)}`,
      caseType: req.caseType,
      policeStation: req.policeStation,
      policeOfficerName: req.policeOfficerName,
      policeBadgeNumber: req.policeBadgeNumber,
      firNumber: req.firNumber,
      injuryDescription: req.injuryDescription,
      evidenceItemsCollected: req.evidenceItemsCollected,
      chainOfCustodyCustodian: req.chainOfCustodyCustodian,
      governmentNotificationSent: true,
      registeredByDoctor: req.registeredByDoctor,
      timestamp: new Date().toISOString()
    };
    this.mlcCases.unshift(newMLC);

    const enc = this.encounters.find((e) => e.id === req.encounterId);
    if (enc) {
      enc.isMLC = true;
      enc.mlcCaseNumber = newMLC.mlcNumber;
      enc.updatedAt = new Date().toISOString();
    }
    this.addTrace(req.registeredByDoctor, 'MEDICO_LEGAL_OFFICER', 'REGISTER_MLC_CASE', 'MLC_CASE', newMLC.mlcNumber, req.injuryDescription);
    return newMLC;
  }

  async createAmbulanceTransfer(req: CreateAmbulanceTransferRequest): Promise<EmergencyAmbulanceTransferDto> {
    const newTransfer: EmergencyAmbulanceTransferDto = {
      id: 'eat-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      encounterId: req.encounterId,
      transferCode: `AMB-TRF-${Date.now().toString().slice(-6)}`,
      patientName: req.patientName,
      ambulanceNumber: req.ambulanceNumber,
      transportType: req.transportType,
      sendingFacility: req.sendingFacility,
      receivingFacility: req.receivingFacility,
      accompanyingParamedic: req.accompanyingParamedic,
      transferReason: req.transferReason,
      departureTime: new Date().toISOString(),
      status: 'DISPATCHED'
    };
    this.transfers.unshift(newTransfer);
    this.addTrace(req.accompanyingParamedic, 'PARAMEDIC', 'DISPATCH_AMBULANCE_TRANSFER', 'AMBULANCE_TRANSFER', newTransfer.transferCode, req.transferReason);
    return newTransfer;
  }

  async createDisposition(req: CreateDispositionRequest): Promise<EmergencyDispositionDto> {
    try {
      const res = await apiRequest<EmergencyDispositionDto>(`/api/v1/partner/emergency/encounters/${req.encounterId}/disposition`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        return res.data;
      }
      if (!isMockFallbackAllowed()) {
        throw new Error(res.error?.message || 'Emergency disposition rejected by server');
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) {
        throw err instanceof Error ? err : new Error('Emergency disposition network error');
      }
    }
    const newDisp: EmergencyDispositionDto = {
      id: 'edr-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      encounterId: req.encounterId,
      patientName: req.patientName,
      outcome: req.outcome,
      authorizingPhysician: req.authorizingPhysician,
      destinationWardOrFacility: req.destinationWardOrFacility,
      clinicalSummary: req.clinicalSummary,
      followUpInstructions: req.followUpInstructions,
      dispositionTimestamp: new Date().toISOString()
    };
    this.dispositions.unshift(newDisp);

    const enc = this.encounters.find((e) => e.id === req.encounterId);
    if (enc) {
      enc.dispositionOutcome = req.outcome;
      if (req.outcome === 'DISCHARGE_HOME') enc.currentStatus = 'DISCHARGED';
      else if (req.outcome.startsWith('IPD_ADMISSION')) enc.currentStatus = 'ADMITTED';
      else if (req.outcome === 'OPERATION_THEATRE_STAT') enc.currentStatus = 'TRANSFERRED';
      else if (req.outcome === 'INTER_HOSPITAL_TRANSFER') enc.currentStatus = 'TRANSFERRED';
      else if (req.outcome === 'LEFT_AGAINST_MEDICAL_ADVICE') enc.currentStatus = 'LEFT_AGAINST_MEDICAL_ADVICE';
      else if (req.outcome.includes('DECEASED') || req.outcome.includes('DEAD')) enc.currentStatus = 'DECEASED';
      enc.updatedAt = new Date().toISOString();
    }
    this.addTrace(req.authorizingPhysician, 'EMERGENCY_PHYSICIAN', 'EXECUTE_DISPOSITION', 'EMERGENCY_DISPOSITION', newDisp.id, req.clinicalSummary);
    return newDisp;
  }

  async createDeathRecord(req: CreateEmergencyDeathRecordRequest): Promise<EmergencyDeathRecordDto> {
    const newDeath: EmergencyDeathRecordDto = {
      id: 'edead-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      encounterId: req.encounterId,
      deathCertificateNumber: `DTH-ED-${Date.now().toString().slice(-6)}`,
      patientName: req.patientName,
      isBroughtDead: req.isBroughtDead,
      declaredDeadTimestamp: new Date().toISOString(),
      declaringPhysician: req.declaringPhysician,
      primaryCauseOfDeath: req.primaryCauseOfDeath,
      mortuaryHandoverStaff: req.mortuaryHandoverStaff,
      policeInformed: req.policeInformed,
      notes: req.notes
    };
    this.deathRecords.unshift(newDeath);

    const enc = this.encounters.find((e) => e.id === req.encounterId);
    if (enc) {
      enc.currentStatus = 'DECEASED';
      enc.updatedAt = new Date().toISOString();
    }
    this.addTrace(req.declaringPhysician, 'DECLARING_PHYSICIAN', 'DECLARE_DEATH', 'DEATH_RECORD', newDeath.deathCertificateNumber, req.primaryCauseOfDeath);
    return newDeath;
  }

  async activateDisasterMode(req: ActivateDisasterModeRequest): Promise<EmergencyDisasterEventDto> {
    this.department.isDisasterModeActive = true;
    const newDisaster: EmergencyDisasterEventDto = {
      id: 'ede-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      incidentCode: `MCI-${Date.now().toString().slice(-6)}`,
      disasterType: req.disasterType,
      incidentCommanderName: req.incidentCommanderName,
      totalVictimsCount: 0,
      criticalVictimsCount: 0,
      activatedAt: new Date().toISOString(),
      isDeactivated: false
    };
    this.disasterEvents.unshift(newDisaster);
    this.addTrace(req.incidentCommanderName, 'INCIDENT_COMMANDER', 'ACTIVATE_DISASTER_MODE', 'DISASTER_EVENT', newDisaster.incidentCode, req.justification);
    return newDisaster;
  }

  async registerDisasterPatient(req: RegisterDisasterPatientRequest): Promise<EmergencyEncounterDto> {
    const enc: EmergencyEncounterDto = {
      id: 'ee-mci-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      encounterNumber: `MCI-PAT-${Date.now().toString().slice(-6)}`,
      patientId: 'pat-mci-' + Math.random().toString(36).substring(2, 7),
      patientName: `MCI Victim (${req.temporaryIdentifier})`,
      patientMrn: `MRN-MCI-${req.temporaryIdentifier}`,
      isUnknownPatient: true,
      temporaryIdentifier: req.temporaryIdentifier,
      patientGender: req.gender,
      patientAge: req.estimatedAge || 30,
      arrivalMode: 'MASS_CASUALTY_DISASTER',
      broughtBy: 'Mass Casualty Dispatch',
      chiefComplaint: `Mass Casualty Victim - Triage Tag: ${req.triageTagColor}`,
      arrivalTimestamp: new Date().toISOString(),
      registrationTimestamp: new Date().toISOString(),
      currentStatus: req.triageTagColor === 'RED_IMMEDIATE' ? 'RESUSCITATION' : 'IN_TREATMENT',
      currentZoneName: req.primaryZoneAssigned,
      triageEsiLevel: req.triageTagColor === 'RED_IMMEDIATE' ? 'ESI_1_IMMEDIATE_RESUSCITATION' : 'ESI_3_URGENT_MULTIPLE_RESOURCES',
      isTraumaAlert: true,
      isCodeBlue: false,
      isMLC: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.encounters.unshift(enc);
    this.addTrace('Disaster Triage Officer', 'TRIAGE_OFFICER', 'REGISTER_DISASTER_VICTIM', 'EMERGENCY_ENCOUNTER', enc.encounterNumber, `Triage Tag: ${req.triageTagColor}`);
    return enc;
  }

  async checkCrashCart(req: CheckCrashCartRequest): Promise<EmergencyCrashCartDto> {
    const cart = this.crashCarts.find((c) => c.id === req.cartId);
    if (!cart) throw new Error('Crash cart not found');

    cart.sealNumber = req.sealNumber;
    cart.isSealIntact = req.isSealIntact;
    cart.defibrillatorBatteryPercent = req.defibrillatorBatteryPercent;
    cart.oxygenCylinderPressurePsi = req.oxygenCylinderPressurePsi;
    cart.hasExpiredItems = req.hasExpiredItems;
    cart.lastCheckedAt = new Date().toISOString();
    cart.lastCheckedBy = req.checkedByStaff;
    cart.status = req.hasExpiredItems || !req.isSealIntact ? 'NEEDS_RESTOCKING' : 'READY';

    this.addTrace(req.checkedByStaff, 'STAFF_NURSE', 'CHECK_CRASH_CART', 'CRASH_CART', cart.cartCode, `Cart checked, status: ${cart.status}`);
    return cart;
  }
}

function mapToEmergencyEncounterDto(row: any): EmergencyEncounterDto {
  return {
    id: String(row.id || ''),
    tenantId: String(row.tenantId || ''),
    partnerId: String(row.partnerId || ''),
    organizationId: String(row.organizationId || ''),
    branchId: String(row.branchId || ''),
    encounterNumber: String(row.encounterNumber || row.emergencyNumber || `EMG-${String(row.id || '').slice(0, 6)}`),
    patientId: String(row.patientId || ''),
    patientName: String(row.patientName || row.patientId || 'Emergency Patient'),
    patientMrn: String(row.patientMrn || row.patientId || 'MRN-PENDING'),
    isUnknownPatient: Boolean(row.isUnknownPatient || (row.patientId && String(row.patientId).startsWith('UNKNOWN'))),
    temporaryIdentifier: row.temporaryIdentifier || undefined,
    patientGender: String(row.patientGender || 'OTHER'),
    patientAge: row.patientAge ? Number(row.patientAge) : undefined,
    arrivalMode: (['AMBULANCE', 'WALK_IN', 'POLICE', 'HELICOPTER', 'OTHER'].includes(row.arrivalMode) ? row.arrivalMode : 'WALK_IN') as any,
    broughtBy: String(row.broughtBy || 'Self / Attendant'),
    referralSource: row.referralSource || undefined,
    chiefComplaint: String(row.chiefComplaint || 'Emergency medical triage required'),
    arrivalTimestamp: typeof row.arrivedAt === 'string' ? row.arrivedAt : (row.arrivedAt ? new Date(row.arrivedAt).toISOString() : (row.arrivalTimestamp || new Date().toISOString())),
    registrationTimestamp: typeof row.createdAt === 'string' ? row.createdAt : (row.createdAt ? new Date(row.createdAt).toISOString() : (row.registrationTimestamp || new Date().toISOString())),
    currentStatus: (['REGISTERED', 'TRIAGED', 'IN_RESUSCITATION', 'IN_TRAUMA_BAY', 'UNDER_OBSERVATION', 'PROCEDURE_IN_PROGRESS', 'AWAITING_ADMISSION', 'AWAITING_TRANSFER', 'DISCHARGED', 'TRANSFERRED', 'ADMITTED', 'EXPIRED', 'LEFT_AGAINST_MEDICAL_ADVICE'].includes(row.currentStatus || row.status) ? (row.currentStatus || row.status) : 'REGISTERED') as any,
    currentZoneId: row.currentZoneId || undefined,
    currentZoneName: row.currentZoneName || undefined,
    currentBedNumber: row.currentBedNumber || undefined,
    assignedPhysicianName: row.assignedPhysicianName || row.assignedClinicianId || undefined,
    assignedNurseName: row.assignedNurseName || undefined,
    triageEsiLevel: row.triageEsiLevel || (row.priority === 'CRITICAL' ? 'ESI_1_IMMEDIATE_RESUSCITATION' : 'ESI_3_URGENT_MULTIPLE_RESOURCES'),
    isTraumaAlert: Boolean(row.isTraumaAlert),
    isCodeBlue: Boolean(row.isCodeBlue),
    isMLC: Boolean(row.isMLC),
    mlcCaseNumber: row.mlcCaseNumber || undefined,
    dispositionOutcome: row.dispositionOutcome || (row.disposition?.dispositionType ? (row.disposition.dispositionType === 'ADMIT_TO_WARD' ? 'ADMIT_TO_WARD' : row.disposition.dispositionType === 'ADMIT_TO_ICU' ? 'ADMIT_TO_ICU' : 'DISCHARGE_HOME') : undefined),
    createdAt: typeof row.createdAt === 'string' ? row.createdAt : (row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString()),
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : (row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString())
  };
}

export class EmergencyManagementService extends MockEmergencyManagementService implements IEmergencyManagementService {
  override async getEncounters(tenantId: string): Promise<EmergencyEncounterDto[]> {
    try {
      const res = await apiRequest<any[]>('/api/v1/partner/emergency/queue');
      if (res.success && Array.isArray(res.data)) {
        return res.data.map(mapToEmergencyEncounterDto);
      }
      if (!isMockFallbackAllowed()) {
        throw new Error(res.error?.message || 'Failed to fetch emergency queue from server');
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.getEncounters(tenantId);
  }

  override async registerEmergencyPatient(req: RegisterEmergencyPatientRequest): Promise<EmergencyEncounterDto> {
    try {
      const res = await apiRequest<any>('/api/v1/partner/emergency/registrations', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        return mapToEmergencyEncounterDto(res.data);
      }
      if (!isMockFallbackAllowed()) {
        throw new Error(res.error?.message || 'Emergency registration rejected by server');
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.registerEmergencyPatient(req);
  }

  override async createTriageAssessment(req: CreateTriageAssessmentRequest): Promise<EmergencyTriageAssessmentDto> {
    try {
      const res = await apiRequest<EmergencyTriageAssessmentDto>(`/api/v1/partner/emergency/encounters/${req.encounterId}/triage`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        return res.data;
      }
      if (!isMockFallbackAllowed()) {
        throw new Error(res.error?.message || 'Triage assessment rejected by server');
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.createTriageAssessment(req);
  }

  override async recordTreatment(encounterId: string, payload: { treatmentNotes: string; medicationsAdministered?: any[]; proceduresPerformed?: any[]; ordersPlaced?: any[] }): Promise<any> {
    try {
      const res = await apiRequest(`/api/v1/partner/emergency/encounters/${encodeURIComponent(encounterId)}/treatments`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success && res.data) {
        return res.data;
      }
      if (!isMockFallbackAllowed()) {
        throw new Error(res.error?.message || 'Emergency treatment rejected by server');
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.recordTreatment(encounterId, payload);
  }

  override async createDisposition(req: CreateDispositionRequest): Promise<EmergencyDispositionDto> {
    try {
      const res = await apiRequest<EmergencyDispositionDto>(`/api/v1/partner/emergency/encounters/${req.encounterId}/disposition`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        return res.data;
      }
      if (!isMockFallbackAllowed()) {
        throw new Error(res.error?.message || 'Emergency disposition rejected by server');
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.createDisposition(req);
  }
}

export const emergencyManagementService = new EmergencyManagementService();
