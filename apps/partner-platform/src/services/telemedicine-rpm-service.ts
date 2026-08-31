import type {
  TeleconsultationSessionDto,
  WaitingRoomQueueItemDto,
  IotConnectedDeviceDto,
  RpmTelemetryObservationDto,
  RpmVitalBreachAlertDto,
  TelemedicineOverviewMetricsDto,
  TelehealthAuditTraceDto,
  ScheduleTeleconsultationRequest,
  RegisterIotDeviceRequest,
  EnrollRpmPatientRequest,
  AcknowledgeVitalBreachRequest
} from '@docsearch/api-contracts';

import {
  mockTelemedicineMetrics,
  mockTeleconsultationSessions,
  mockWaitingRoomQueue,
  mockIotDevices,
  mockTelemetryObservations,
  mockVitalBreachAlerts,
  mockTelehealthAuditTraces
} from './mock-telemedicine-rpm-data.js';

export interface ITelemedicineRpmService {
  getOverviewMetrics(tenantId: string): Promise<TelemedicineOverviewMetricsDto>;
  getSessions(tenantId: string): Promise<TeleconsultationSessionDto[]>;
  scheduleSession(tenantId: string, payload: ScheduleTeleconsultationRequest): Promise<TeleconsultationSessionDto>;

  getWaitingRoomQueue(tenantId: string): Promise<WaitingRoomQueueItemDto[]>;
  admitPatientFromWaitingRoom(tenantId: string, queueItemId: string): Promise<TeleconsultationSessionDto>;

  getIotDevices(tenantId: string): Promise<IotConnectedDeviceDto[]>;
  registerIotDevice(tenantId: string, payload: RegisterIotDeviceRequest): Promise<IotConnectedDeviceDto>;

  getTelemetryObservations(tenantId: string): Promise<RpmTelemetryObservationDto[]>;
  getVitalBreachAlerts(tenantId: string): Promise<RpmVitalBreachAlertDto[]>;
  acknowledgeVitalBreach(tenantId: string, payload: AcknowledgeVitalBreachRequest): Promise<RpmVitalBreachAlertDto>;

  enrollRpmPatient(tenantId: string, payload: EnrollRpmPatientRequest): Promise<void>;
  getAuditTraces(tenantId: string): Promise<TelehealthAuditTraceDto[]>;
}

export class TelemedicineRpmService implements ITelemedicineRpmService {
  private metrics: TelemedicineOverviewMetricsDto = { ...mockTelemedicineMetrics };
  private sessions: TeleconsultationSessionDto[] = [...mockTeleconsultationSessions];
  private waitingQueue: WaitingRoomQueueItemDto[] = [...mockWaitingRoomQueue];
  private devices: IotConnectedDeviceDto[] = [...mockIotDevices];
  private telemetry: RpmTelemetryObservationDto[] = [...mockTelemetryObservations];
  private breachAlerts: RpmVitalBreachAlertDto[] = [...mockVitalBreachAlerts];
  private auditTraces: TelehealthAuditTraceDto[] = [...mockTelehealthAuditTraces];

  private appendAudit(
    action: string,
    entityType: string,
    entityId: string,
    entityCode: string,
    justification: string,
    actorName = 'Dr. Sanjay Gupta (Consultant)',
    actorRole = 'TELEHEALTH_PHYSICIAN'
  ) {
    const traceNumber = `TRACE-TELE-${Math.floor(10000 + Math.random() * 90000)}`;
    const trace: TelehealthAuditTraceDto = {
      id: crypto.randomUUID(),
      tenantId: '11111111-1111-4111-8111-111111111111',
      traceNumber,
      action,
      entityType,
      entityId,
      entityCode,
      actorName,
      actorRole,
      justification,
      integrityHash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      timestamp: new Date().toISOString()
    };
    this.auditTraces.unshift(trace);
  }

  async getOverviewMetrics(_tenantId: string): Promise<TelemedicineOverviewMetricsDto> {
    return { ...this.metrics };
  }

  async getSessions(_tenantId: string): Promise<TeleconsultationSessionDto[]> {
    return [...this.sessions];
  }

  async scheduleSession(_tenantId: string, payload: ScheduleTeleconsultationRequest): Promise<TeleconsultationSessionDto> {
    const apptNum = `TELE-2026-08-${Math.floor(100 + Math.random() * 900)}`;
    const roomId = `ROOM-WEBRTC-${Math.floor(1000 + Math.random() * 9000)}`;

    const newSession: TeleconsultationSessionDto = {
      id: crypto.randomUUID(),
      tenantId: '11111111-1111-4111-8111-111111111111',
      appointmentNumber: apptNum,
      patientMrn: payload.patientMrn,
      patientName: payload.patientName,
      doctorName: payload.doctorName,
      specialtyName: payload.specialtyName,
      scheduledStartTime: payload.scheduledStartTime,
      actualStartTime: null,
      actualEndTime: null,
      callDurationSeconds: 0,
      webrtcRoomId: roomId,
      status: 'SCHEDULED',
      consultationFeeInr: payload.consultationFeeInr,
      paymentStatus: 'PAID',
      clinicalSoapSummary: null,
      ePrescriptionGenerated: false,
      createdAt: new Date().toISOString()
    };

    this.sessions.unshift(newSession);
    this.metrics.activeTeleconsultationsToday += 1;
    this.appendAudit('SCHEDULE_TELECONSULTATION', 'TELEHEALTH_SESSION', newSession.id, apptNum, `Scheduled virtual session for ${payload.patientName} with ${payload.doctorName}`);
    return newSession;
  }

  async getWaitingRoomQueue(_tenantId: string): Promise<WaitingRoomQueueItemDto[]> {
    return [...this.waitingQueue];
  }

  async admitPatientFromWaitingRoom(_tenantId: string, queueItemId: string): Promise<TeleconsultationSessionDto> {
    const queueIdx = this.waitingQueue.findIndex((q) => q.id === queueItemId);
    const item = this.waitingQueue[queueIdx];
    if (!item) throw new Error('Queue item not found');

    this.waitingQueue.splice(queueIdx, 1);
    this.metrics.patientsInVirtualWaitingRoom = Math.max(0, this.metrics.patientsInVirtualWaitingRoom - 1);

    const session = this.sessions[0];
    if (!session) throw new Error('No sessions available');

    session.status = 'CALL_IN_PROGRESS';
    session.actualStartTime = new Date().toISOString();

    this.appendAudit('ADMIT_PATIENT_FROM_WAITING_ROOM', 'TELEHEALTH_SESSION', session.id, session.appointmentNumber, `Admitted ${item.patientName} to WebRTC Room ${session.webrtcRoomId}`);
    return session;
  }

  async getIotDevices(_tenantId: string): Promise<IotConnectedDeviceDto[]> {
    return [...this.devices];
  }

  async registerIotDevice(_tenantId: string, payload: RegisterIotDeviceRequest): Promise<IotConnectedDeviceDto> {
    const newDevice: IotConnectedDeviceDto = {
      id: crypto.randomUUID(),
      deviceSerial: payload.deviceSerial,
      deviceModel: payload.deviceModel,
      deviceType: payload.deviceType,
      patientMrn: payload.patientMrn,
      patientName: payload.patientName,
      connectionProtocol: payload.connectionProtocol,
      batteryLevelPct: 100,
      lastSyncTimestamp: new Date().toISOString(),
      syncStatus: 'ONLINE_ACTIVE'
    };

    this.devices.unshift(newDevice);
    this.metrics.connectedIotDevicesCount += 1;
    this.appendAudit('REGISTER_IOT_DEVICE', 'IOT_DEVICE', newDevice.id, payload.deviceSerial, `Paired ${payload.deviceModel} for patient ${payload.patientName}`);
    return newDevice;
  }

  async getTelemetryObservations(_tenantId: string): Promise<RpmTelemetryObservationDto[]> {
    return [...this.telemetry];
  }

  async getVitalBreachAlerts(_tenantId: string): Promise<RpmVitalBreachAlertDto[]> {
    return [...this.breachAlerts];
  }

  async acknowledgeVitalBreach(_tenantId: string, payload: AcknowledgeVitalBreachRequest): Promise<RpmVitalBreachAlertDto> {
    const breach = this.breachAlerts.find((b) => b.id === payload.alertId);
    if (!breach) throw new Error('Vital breach not found');

    breach.status = payload.escalateToVideoCall ? 'ESCALATED_CONSULTANT_CALL' : 'RESOLVED';
    breach.resolutionNotes = payload.clinicalActionTaken;

    this.appendAudit('ACKNOWLEDGE_VITAL_BREACH', 'VITAL_BREACH', breach.id, breach.vitalParameter, payload.clinicalActionTaken, payload.acknowledgedBy);
    return { ...breach };
  }

  async enrollRpmPatient(_tenantId: string, payload: EnrollRpmPatientRequest): Promise<void> {
    this.metrics.activeEnrolledRpmPatients += 1;
    this.appendAudit('ENROLL_RPM_PATIENT', 'RPM_ENROLLMENT', crypto.randomUUID(), payload.careProgram, `Enrolled ${payload.patientName} into ${payload.careProgram} cohort`, payload.attendingPhysician);
  }

  async getAuditTraces(_tenantId: string): Promise<TelehealthAuditTraceDto[]> {
    return [...this.auditTraces];
  }
}

export const telemedicineRpmService = new TelemedicineRpmService();
