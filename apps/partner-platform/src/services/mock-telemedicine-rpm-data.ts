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
  activeTeleconsultationsToday: 18,
  patientsInVirtualWaitingRoom: 4,
  activeEnrolledRpmPatients: 240,
  connectedIotDevicesCount: 310,
  vitalBreachesAlertsToday: 3,
  averageCallDurationMins: 14.5,
  patientSatisfactionScorePct: 97.8,
  remoteAdherenceRatePct: 94.2
};

export const mockTeleconsultationSessions: TeleconsultationSessionDto[] = [
  {
    id: 'tcs-1111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    appointmentNumber: 'TELE-2026-08-001',
    patientMrn: 'MRN-2026-9021',
    patientName: 'Gopal Krishna',
    doctorName: 'Dr. Sanjay Gupta',
    specialtyName: 'Cardiology Tele-Followup',
    scheduledStartTime: '2026-08-30T07:00:00.000Z',
    actualStartTime: '2026-08-30T07:02:00.000Z',
    actualEndTime: null,
    callDurationSeconds: 420,
    webrtcRoomId: 'ROOM-WEBRTC-CARDIO-9021',
    status: 'CALL_IN_PROGRESS',
    consultationFeeInr: 800.0,
    paymentStatus: 'PAID',
    clinicalSoapSummary: 'Follow-up on post-PCI medication titration. Vitals stable on home BP cuff (122/78).',
    ePrescriptionGenerated: true,
    createdAt: '2026-08-30T06:00:00.000Z'
  },
  {
    id: 'tcs-1111-1111-4111-8111-111111111102',
    tenantId: '11111111-1111-4111-8111-111111111111',
    appointmentNumber: 'TELE-2026-08-002',
    patientMrn: 'MRN-2026-8819',
    patientName: 'Meenakshi Sundaram',
    doctorName: 'Dr. Vivek Mehra',
    specialtyName: 'Post-Op Surgical Followup',
    scheduledStartTime: '2026-08-30T07:30:00.000Z',
    actualStartTime: null,
    actualEndTime: null,
    callDurationSeconds: 0,
    webrtcRoomId: 'ROOM-WEBRTC-SURG-8819',
    status: 'PATIENT_IN_WAITING_ROOM',
    consultationFeeInr: 750.0,
    paymentStatus: 'INSURANCE_COVERED',
    clinicalSoapSummary: null,
    ePrescriptionGenerated: false,
    createdAt: '2026-08-30T06:15:00.000Z'
  }
];

export const mockWaitingRoomQueue: WaitingRoomQueueItemDto[] = [
  {
    id: 'wr-1',
    patientMrn: 'MRN-2026-8819',
    patientName: 'Meenakshi Sundaram',
    doctorName: 'Dr. Vivek Mehra',
    queuePosition: 1,
    estimatedWaitTimeMins: 4,
    joinedAt: '2026-08-30T06:45:00.000Z',
    vitalsPreCheckCompleted: true,
    audioVideoTestStatus: 'PASS'
  },
  {
    id: 'wr-2',
    patientMrn: 'MRN-2026-7782',
    patientName: 'Ramanathan Iyer',
    doctorName: 'Dr. Sanjay Gupta',
    queuePosition: 2,
    estimatedWaitTimeMins: 12,
    joinedAt: '2026-08-30T06:50:00.000Z',
    vitalsPreCheckCompleted: true,
    audioVideoTestStatus: 'PASS'
  }
];

export const mockIotDevices: IotConnectedDeviceDto[] = [
  {
    id: 'iot-1',
    deviceSerial: 'SN-OX-BLE-9921',
    deviceModel: 'Masimo MightySat BLE Pulse Oximeter',
    deviceType: 'PULSE_OXIMETER',
    patientMrn: 'MRN-2026-9021',
    patientName: 'Gopal Krishna',
    connectionProtocol: 'BLUETOOTH_BLE',
    batteryLevelPct: 88,
    lastSyncTimestamp: '2026-08-30T06:55:00.000Z',
    syncStatus: 'ONLINE_ACTIVE'
  },
  {
    id: 'iot-2',
    deviceSerial: 'SN-BP-WIFI-4412',
    deviceModel: 'Omron Platinum Wireless Blood Pressure Monitor',
    deviceType: 'BLOOD_PRESSURE_MONITOR',
    patientMrn: 'MRN-2026-9021',
    patientName: 'Gopal Krishna',
    connectionProtocol: 'WIFI_DIRECT',
    batteryLevelPct: 95,
    lastSyncTimestamp: '2026-08-30T06:50:00.000Z',
    syncStatus: 'ONLINE_ACTIVE'
  },
  {
    id: 'iot-3',
    deviceSerial: 'SN-CGM-4G-1029',
    deviceModel: 'Dexcom G7 Continuous Glucose Monitor',
    deviceType: 'GLUCOMETER_CGM',
    patientMrn: 'MRN-2026-8819',
    patientName: 'Meenakshi Sundaram',
    connectionProtocol: 'CELLULAR_4G_GATEWAY',
    batteryLevelPct: 76,
    lastSyncTimestamp: '2026-08-30T06:58:00.000Z',
    syncStatus: 'ONLINE_ACTIVE'
  }
];

export const mockTelemetryObservations: RpmTelemetryObservationDto[] = [
  {
    id: 'obs-1',
    patientMrn: 'MRN-2026-9021',
    patientName: 'Gopal Krishna',
    deviceType: 'BLOOD_PRESSURE_MONITOR',
    timestamp: '2026-08-30T06:50:00.000Z',
    readings: { systolicBp: 122, diastolicBp: 78, pulseRateBpm: 66 },
    breachSeverity: 'NORMAL_BASELINE',
    isManualEntry: false
  },
  {
    id: 'obs-2',
    patientMrn: 'MRN-2026-9021',
    patientName: 'Gopal Krishna',
    deviceType: 'PULSE_OXIMETER',
    timestamp: '2026-08-30T06:55:00.000Z',
    readings: { spO2Pct: 97, pulseRateBpm: 65 },
    breachSeverity: 'NORMAL_BASELINE',
    isManualEntry: false
  },
  {
    id: 'obs-3',
    patientMrn: 'MRN-2026-8819',
    patientName: 'Meenakshi Sundaram',
    deviceType: 'GLUCOMETER_CGM',
    timestamp: '2026-08-30T06:58:00.000Z',
    readings: { glucoseMgDl: 238 },
    breachSeverity: 'WARNING_AMBER',
    isManualEntry: false
  }
];

export const mockVitalBreachAlerts: RpmVitalBreachAlertDto[] = [
  {
    id: 'vba-1',
    patientMrn: 'MRN-2026-8819',
    patientName: 'Meenakshi Sundaram',
    careProgram: 'DIABETES_INTENSIVE_CARE',
    vitalParameter: 'Blood Glucose (Post-Prandial CGM)',
    measuredValue: '238 mg/dL',
    thresholdRule: 'Continuous Glucose > 200 mg/dL for > 2 hours',
    severity: 'WARNING_AMBER',
    alertTimestamp: '2026-08-30T06:58:00.000Z',
    status: 'UNACKNOWLEDGED_URGENT',
    assignedClinician: 'Dr. Vivek Mehra',
    resolutionNotes: null
  },
  {
    id: 'vba-2',
    patientMrn: 'MRN-2026-3391',
    patientName: 'Harish Chandra',
    careProgram: 'HEART_FAILURE_CHF',
    vitalParameter: 'Body Weight (Dry Weight Gain)',
    measuredValue: '+2.8 kg in 48h',
    thresholdRule: 'Weight gain > 2.0 kg in 48h (Fluid overload suspicion)',
    severity: 'CRITICAL_RED_ALERT',
    alertTimestamp: '2026-08-30T05:30:00.000Z',
    status: 'ESCALATED_CONSULTANT_CALL',
    assignedClinician: 'Dr. Sanjay Gupta',
    resolutionNotes: 'Advised extra 20mg Torsemide dose and scheduled teleconsultation at 08:30.'
  }
];

export const mockTelehealthAuditTraces: TelehealthAuditTraceDto[] = [
  {
    id: 'th-tr-1111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    traceNumber: 'TRACE-TELE-08991',
    action: 'WEBRTC_SESSION_INITIATED',
    entityType: 'TELECONSULTATION',
    entityId: 'tcs-1111-1111-4111-8111-111111111101',
    entityCode: 'TELE-2026-08-001',
    actorName: 'Dr. Sanjay Gupta',
    actorRole: 'CONSULTANT_CARDIOLOGIST',
    justification: 'Encrypted DTLS-SRTP video stream connected with patient for remote follow-up.',
    integrityHash: 'a1e8c04298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852f881',
    timestamp: '2026-08-30T07:02:00.000Z'
  }
];
