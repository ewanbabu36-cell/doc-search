import { apiRequest } from './api-client.js';
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

export class EmergencyManagementService implements IEmergencyManagementService {
  public async getOverviewMetrics(tenantId: string): Promise<EmergencyOverviewMetricsDto> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const encounters = await this.getEncounters(tenantId).catch(() => []);
    const esi1 = encounters.filter(e => e.triageEsiLevel === 'ESI_1_IMMEDIATE_RESUSCITATION').length;
    const esi2 = encounters.filter(e => e.triageEsiLevel === 'ESI_2_EMERGENT_HIGH_RISK').length;
    const esi3 = encounters.filter(e => e.triageEsiLevel === 'ESI_3_URGENT_MULTIPLE_RESOURCES').length;

    return {
      activeEDCensus: encounters.length,
      waitingForTriageCount: encounters.filter(e => e.currentStatus === 'TRIAGE_PENDING').length,
      esi1Count: esi1,
      esi2Count: esi2,
      esi3Count: esi3,
      activeTraumaAlerts: encounters.filter(e => e.isTraumaAlert).length,
      activeResuscitationCount: esi1,
      mlcCasesToday: encounters.filter(e => e.isMLC).length,
      observationPatientsCount: 4,
      averageDoorToDoctorMinutes: 14,
      averageDoorToTriageMinutes: 8,
      isDisasterModeActive: false
    };
  }

  public async getAnalytics(_tenantId: string): Promise<EmergencyAnalyticsDto> {
    return {
      esiDistribution: [],
      arrivalModes: [],
      hourlyVolume: [],
      dispositionBreakdown: []
    };
  }

  public async getDepartment(_tenantId: string): Promise<EmergencyDepartmentDto> {
    return {
      id: 'ed-dept-01',
      tenantId: 'default',
      partnerId: 'default',
      organizationId: 'default',
      branchId: 'default',
      departmentCode: 'ER-MAIN',
      departmentName: 'Level 1 Trauma & Emergency Centre',
      totalBeds: 24,
      resuscitationBeds: 4,
      traumaBeds: 4,
      observationBeds: 16,
      headOfEmergency: 'Dr. Head of Emergency',
      isDisasterModeActive: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  public async getZones(_tenantId: string): Promise<EmergencyZoneDto[]> {
    return [
      {
        id: 'zone-red',
        tenantId: 'default',
        partnerId: 'default',
        organizationId: 'default',
        branchId: 'default',
        departmentId: 'ed-dept-01',
        zoneCode: 'RED',
        zoneName: 'Resuscitation / Trauma Bay',
        zoneType: 'RESUSCITATION_BAY',
        capacity: 4,
        occupiedCount: 1,
        chargePerHour: 500,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'zone-yellow',
        tenantId: 'default',
        partnerId: 'default',
        organizationId: 'default',
        branchId: 'default',
        departmentId: 'ed-dept-01',
        zoneCode: 'YELLOW',
        zoneName: 'Acute Monitoring Bay',
        zoneType: 'MAJOR_ACUTE_ZONE',
        capacity: 10,
        occupiedCount: 3,
        chargePerHour: 300,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  public async getEncounters(tenantId: string): Promise<EmergencyEncounterDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<EmergencyEncounterDto[]>('/api/v1/partner/emergency/queue');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getTriageAssessments(_tenantId: string): Promise<EmergencyTriageAssessmentDto[]> {
    return [];
  }

  public async getTriageReassessments(_tenantId: string): Promise<EmergencyTriageReassessmentDto[]> {
    return [];
  }

  public async getResuscitationEvents(_tenantId: string): Promise<EmergencyResuscitationEventDto[]> {
    return [];
  }

  public async getTraumaActivations(_tenantId: string): Promise<TraumaActivationDto[]> {
    return [];
  }

  public async getObservationCases(_tenantId: string): Promise<EmergencyObservationCaseDto[]> {
    return [];
  }

  public async getMLCCases(_tenantId: string): Promise<EmergencyMLCCaseDto[]> {
    return [];
  }

  public async getCrashCarts(_tenantId: string): Promise<EmergencyCrashCartDto[]> {
    return [];
  }

  public async getAmbulanceTransfers(_tenantId: string): Promise<EmergencyAmbulanceTransferDto[]> {
    const res = await apiRequest<any[]>('/api/v1/partner/emergency/ambulance/active-fleet').catch(() => ({ data: [] }));
    return (Array.isArray(res.data) ? res.data : []) as unknown as EmergencyAmbulanceTransferDto[];
  }

  public async getDispositions(_tenantId: string): Promise<EmergencyDispositionDto[]> {
    return [];
  }

  public async getDeathRecords(_tenantId: string): Promise<EmergencyDeathRecordDto[]> {
    return [];
  }

  public async getDisasterEvents(_tenantId: string): Promise<EmergencyDisasterEventDto[]> {
    return [];
  }

  public async getAuditTraces(_tenantId: string): Promise<EmergencyAuditTraceDto[]> {
    return [];
  }

  public async registerEmergencyPatient(req: RegisterEmergencyPatientRequest): Promise<EmergencyEncounterDto> {
    const res = await apiRequest<EmergencyEncounterDto>('/api/v1/partner/emergency/registrations', {
      method: 'POST',
      body: JSON.stringify({
        patientName: req.patientName,
        patientMrn: req.patientMrn,
        patientAge: req.patientAge || 35,
        patientGender: req.patientGender || 'M',
        chiefComplaint: req.chiefComplaint,
        arrivalMode: req.arrivalMode
      })
    });
    return res.data as EmergencyEncounterDto;
  }

  public async createTriageAssessment(req: CreateTriageAssessmentRequest): Promise<EmergencyTriageAssessmentDto> {
    const res = await apiRequest<EmergencyTriageAssessmentDto>(`/api/v1/partner/emergency/encounters/${req.encounterId}/triage`, {
      method: 'POST',
      body: JSON.stringify({
        triageCategory: req.esiLevel,
        systolicBp: req.systolicBp,
        diastolicBp: req.diastolicBp,
        heartRate: req.pulseRate,
        oxygenSaturation: req.spo2Percentage,
        temperatureCelsius: Math.round(((req.temperatureF - 32) * 5) / 9),
        respiratoryRate: req.respiratoryRate,
        glasgowComaScale: req.gcsScore,
        triageNotes: req.triageNotes
      })
    });
    return res.data as EmergencyTriageAssessmentDto;
  }

  public async reassessTriage(req: ReassessTriageRequest): Promise<EmergencyTriageReassessmentDto> {
    const res = await apiRequest<EmergencyTriageReassessmentDto>(`/api/v1/partner/emergency/encounters/${req.encounterId}/triage`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as EmergencyTriageReassessmentDto;
  }

  public async assignEmergencyPatient(req: AssignEmergencyPatientRequest): Promise<EmergencyEncounterDto> {
    const res = await apiRequest<EmergencyEncounterDto>(`/api/v1/partner/emergency/encounters/${req.encounterId}/assign`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as EmergencyEncounterDto;
  }

  public async createResuscitationEvent(req: CreateResuscitationEventRequest): Promise<EmergencyResuscitationEventDto> {
    const res = await apiRequest<EmergencyResuscitationEventDto>('/api/v1/partner/emergency/resuscitation', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as EmergencyResuscitationEventDto;
  }

  public async recordResuscitationAction(req: RecordResuscitationActionRequest): Promise<EmergencyResuscitationEventDto> {
    const res = await apiRequest<EmergencyResuscitationEventDto>(`/api/v1/partner/emergency/resuscitation/${req.eventId}/actions`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as EmergencyResuscitationEventDto;
  }

  public async createTraumaActivation(req: CreateTraumaActivationRequest): Promise<TraumaActivationDto> {
    const res = await apiRequest<TraumaActivationDto>('/api/v1/partner/emergency/ambulance/stage-trauma-bay', {
      method: 'POST',
      body: JSON.stringify({
        patientName: (req as any).patientName,
        traumaSeverity: req.activationLevel,
        bloodUnitsRequested: 2
      })
    });
    return res.data as TraumaActivationDto;
  }

  public async recordTraumaAssessment(req: RecordTraumaAssessmentRequest): Promise<TraumaActivationDto> {
    const res = await apiRequest<TraumaActivationDto>(`/api/v1/partner/emergency/trauma/${req.traumaId}/assessment`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as TraumaActivationDto;
  }

  public async createEmergencyProcedure(req: CreateEmergencyProcedureRequest): Promise<void> {
    await apiRequest<void>(`/api/v1/partner/emergency/encounters/${req.encounterId}/procedures`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
  }

  public async recordTreatment(encounterId: string, payload: { treatmentNotes: string; medicationsAdministered?: any[]; proceduresPerformed?: any[]; ordersPlaced?: any[] }): Promise<any> {
    const res = await apiRequest<any>(`/api/v1/partner/emergency/encounters/${encounterId}/treatments`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  }

  public async createObservationCase(req: CreateObservationCaseRequest): Promise<EmergencyObservationCaseDto> {
    const res = await apiRequest<EmergencyObservationCaseDto>('/api/v1/partner/emergency/observation', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as EmergencyObservationCaseDto;
  }

  public async createMLCCase(req: CreateMLCCaseRequest): Promise<EmergencyMLCCaseDto> {
    const res = await apiRequest<EmergencyMLCCaseDto>('/api/v1/partner/emergency/mlc', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as EmergencyMLCCaseDto;
  }

  public async createAmbulanceTransfer(req: CreateAmbulanceTransferRequest): Promise<EmergencyAmbulanceTransferDto> {
    const res = await apiRequest<EmergencyAmbulanceTransferDto>('/api/v1/partner/emergency/ambulance/telemetry-stream', {
      method: 'POST',
      body: JSON.stringify({
        vehicleNumber: req.ambulanceNumber,
        patientName: req.patientName,
        transferReason: req.transferReason
      })
    });
    return res.data as EmergencyAmbulanceTransferDto;
  }

  public async createDisposition(req: CreateDispositionRequest): Promise<EmergencyDispositionDto> {
    const res = await apiRequest<EmergencyDispositionDto>(`/api/v1/partner/emergency/encounters/${req.encounterId}/disposition`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as EmergencyDispositionDto;
  }

  public async createDeathRecord(req: CreateEmergencyDeathRecordRequest): Promise<EmergencyDeathRecordDto> {
    const res = await apiRequest<EmergencyDeathRecordDto>(`/api/v1/partner/emergency/encounters/${req.encounterId}/death-record`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as EmergencyDeathRecordDto;
  }

  public async activateDisasterMode(req: ActivateDisasterModeRequest): Promise<EmergencyDisasterEventDto> {
    const res = await apiRequest<EmergencyDisasterEventDto>('/api/v1/partner/emergency/disaster-mode', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as EmergencyDisasterEventDto;
  }

  public async registerDisasterPatient(req: RegisterDisasterPatientRequest): Promise<EmergencyEncounterDto> {
    const res = await apiRequest<EmergencyEncounterDto>('/api/v1/partner/emergency/registrations', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as EmergencyEncounterDto;
  }

  public async checkCrashCart(req: CheckCrashCartRequest): Promise<EmergencyCrashCartDto> {
    const res = await apiRequest<EmergencyCrashCartDto>(`/api/v1/partner/emergency/crash-carts/${req.cartId}/check`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as EmergencyCrashCartDto;
  }
}

export const MockEmergencyManagementService = EmergencyManagementService;
export const emergencyManagementService = new EmergencyManagementService();
