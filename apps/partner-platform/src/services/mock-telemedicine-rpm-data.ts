import type {
  TeleconsultationSessionDto,
  WaitingRoomQueueItemDto,
  IotConnectedDeviceDto,
  RpmTelemetryObservationDto,
  RpmVitalBreachAlertDto,
  TelemedicineOverviewMetricsDto,
  TelehealthAuditTraceDto
} from '@docsearch/api-contracts';

export const mockTelemedicineMetrics: TelemedicineOverviewMetricsDto = {
  activeTeleconsultationsToday: 0,
  patientsInVirtualWaitingRoom: 0,
  activeEnrolledRpmPatients: 0,
  connectedIotDevicesCount: 0,
  vitalBreachesAlertsToday: 0,
  averageCallDurationMins: 0,
  patientSatisfactionScorePct: 100,
  remoteAdherenceRatePct: 100
};

export const mockTeleconsultationSessions: TeleconsultationSessionDto[] = [];

export const mockWaitingRoomQueue: WaitingRoomQueueItemDto[] = [];

export const mockIotDevices: IotConnectedDeviceDto[] = [];

export const mockTelemetryObservations: RpmTelemetryObservationDto[] = [];

export const mockVitalBreachAlerts: RpmVitalBreachAlertDto[] = [];

export const mockTelehealthAuditTraces: TelehealthAuditTraceDto[] = [];
