import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const TeleconsultationStatusEnum = z.enum([
  'SCHEDULED',
  'PATIENT_IN_WAITING_ROOM',
  'CALL_IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW'
]);
export type TeleconsultationStatus = z.infer<typeof TeleconsultationStatusEnum>;

export const IotDeviceTypeEnum = z.enum([
  'PULSE_OXIMETER',
  'BLOOD_PRESSURE_MONITOR',
  'GLUCOMETER_CGM',
  'ECG_PATCH_MONITOR',
  'SMART_WEIGHT_SCALE',
  'DIGITAL_SPIROMETER'
]);
export type IotDeviceType = z.infer<typeof IotDeviceTypeEnum>;

export const RpmCareProgramEnum = z.enum([
  'HYPERTENSION_MANAGEMENT',
  'DIABETES_INTENSIVE_CARE',
  'HEART_FAILURE_CHF',
  'COPD_ASTHMA_CARE',
  'HIGH_RISK_MATERNAL'
]);
export type RpmCareProgram = z.infer<typeof RpmCareProgramEnum>;

export const VitalBreachSeverityEnum = z.enum([
  'NORMAL_BASELINE',
  'WARNING_AMBER',
  'CRITICAL_RED_ALERT'
]);
export type VitalBreachSeverity = z.infer<typeof VitalBreachSeverityEnum>;

// ============================================================================
// DTOs
// ============================================================================

export const TeleconsultationSessionDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  appointmentNumber: z.string(),
  patientMrn: z.string(),
  patientName: z.string(),
  doctorName: z.string(),
  specialtyName: z.string(),
  scheduledStartTime: z.string(),
  actualStartTime: z.string().nullable().optional(),
  actualEndTime: z.string().nullable().optional(),
  callDurationSeconds: z.number().default(0),
  webrtcRoomId: z.string(),
  status: TeleconsultationStatusEnum,
  consultationFeeInr: z.number(),
  paymentStatus: z.enum(['PAID', 'PENDING', 'INSURANCE_COVERED']),
  clinicalSoapSummary: z.string().nullable().optional(),
  ePrescriptionGenerated: z.boolean().default(false),
  createdAt: z.string()
});
export type TeleconsultationSessionDto = z.infer<typeof TeleconsultationSessionDtoSchema>;

export const WaitingRoomQueueItemDtoSchema = z.object({
  id: z.string().uuid(),
  patientMrn: z.string(),
  patientName: z.string(),
  doctorName: z.string(),
  queuePosition: z.number(),
  estimatedWaitTimeMins: z.number(),
  joinedAt: z.string(),
  vitalsPreCheckCompleted: z.boolean(),
  audioVideoTestStatus: z.enum(['PASS', 'WARN', 'FAIL'])
});
export type WaitingRoomQueueItemDto = z.infer<typeof WaitingRoomQueueItemDtoSchema>;

export const IotConnectedDeviceDtoSchema = z.object({
  id: z.string().uuid(),
  deviceSerial: z.string(),
  deviceModel: z.string(),
  deviceType: IotDeviceTypeEnum,
  patientMrn: z.string(),
  patientName: z.string(),
  connectionProtocol: z.enum(['BLUETOOTH_BLE', 'WIFI_DIRECT', 'CELLULAR_4G_GATEWAY']),
  batteryLevelPct: z.number(),
  lastSyncTimestamp: z.string(),
  syncStatus: z.enum(['ONLINE_ACTIVE', 'IDLE_PAIRED', 'OFFLINE_DISCONNECTED'])
});
export type IotConnectedDeviceDto = z.infer<typeof IotConnectedDeviceDtoSchema>;

export const RpmTelemetryObservationDtoSchema = z.object({
  id: z.string().uuid(),
  patientMrn: z.string(),
  patientName: z.string(),
  deviceType: IotDeviceTypeEnum,
  timestamp: z.string(),
  readings: z.object({
    systolicBp: z.number().optional(),
    diastolicBp: z.number().optional(),
    pulseRateBpm: z.number().optional(),
    spO2Pct: z.number().optional(),
    glucoseMgDl: z.number().optional(),
    weightKg: z.number().optional(),
    pefrLMin: z.number().optional(),
    ecgRhythm: z.string().optional()
  }),
  breachSeverity: VitalBreachSeverityEnum,
  isManualEntry: z.boolean().default(false)
});
export type RpmTelemetryObservationDto = z.infer<typeof RpmTelemetryObservationDtoSchema>;

export const RpmVitalBreachAlertDtoSchema = z.object({
  id: z.string().uuid(),
  patientMrn: z.string(),
  patientName: z.string(),
  careProgram: RpmCareProgramEnum,
  vitalParameter: z.string(), // e.g. "Blood Pressure (Systolic)" or "SpO2"
  measuredValue: z.string(), // e.g. "188/112 mmHg" or "84%"
  thresholdRule: z.string(), // e.g. "Systolic > 180 mmHg (Hypertensive Crisis)"
  severity: VitalBreachSeverityEnum,
  alertTimestamp: z.string(),
  status: z.enum(['UNACKNOWLEDGED_URGENT', 'ACKNOWLEDGED_NURSE_TRIAGE', 'ESCALATED_CONSULTANT_CALL', 'RESOLVED']),
  assignedClinician: z.string(),
  resolutionNotes: z.string().nullable().optional()
});
export type RpmVitalBreachAlertDto = z.infer<typeof RpmVitalBreachAlertDtoSchema>;

export const TelemedicineOverviewMetricsDtoSchema = z.object({
  activeTeleconsultationsToday: z.number(),
  patientsInVirtualWaitingRoom: z.number(),
  activeEnrolledRpmPatients: z.number(),
  connectedIotDevicesCount: z.number(),
  vitalBreachesAlertsToday: z.number(),
  averageCallDurationMins: z.number(),
  patientSatisfactionScorePct: z.number(),
  remoteAdherenceRatePct: z.number()
});
export type TelemedicineOverviewMetricsDto = z.infer<typeof TelemedicineOverviewMetricsDtoSchema>;

export const TelehealthAuditTraceDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  traceNumber: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  entityCode: z.string(),
  actorName: z.string(),
  actorRole: z.string(),
  justification: z.string(),
  integrityHash: z.string(),
  timestamp: z.string()
});
export type TelehealthAuditTraceDto = z.infer<typeof TelehealthAuditTraceDtoSchema>;

// ============================================================================
// Request Schemas
// ============================================================================

export const ScheduleTeleconsultationRequestSchema = z.object({
  patientMrn: z.string(),
  patientName: z.string(),
  doctorName: z.string(),
  specialtyName: z.string(),
  scheduledStartTime: z.string(),
  consultationFeeInr: z.number().default(800)
});
export type ScheduleTeleconsultationRequest = z.infer<typeof ScheduleTeleconsultationRequestSchema>;

export const RegisterIotDeviceRequestSchema = z.object({
  deviceSerial: z.string(),
  deviceModel: z.string(),
  deviceType: IotDeviceTypeEnum,
  patientMrn: z.string(),
  patientName: z.string(),
  connectionProtocol: z.enum(['BLUETOOTH_BLE', 'WIFI_DIRECT', 'CELLULAR_4G_GATEWAY'])
});
export type RegisterIotDeviceRequest = z.infer<typeof RegisterIotDeviceRequestSchema>;

export const EnrollRpmPatientRequestSchema = z.object({
  patientMrn: z.string(),
  patientName: z.string(),
  careProgram: RpmCareProgramEnum,
  attendingPhysician: z.string(),
  vitalThresholds: z.object({
    systolicMax: z.number().default(160),
    diastolicMax: z.number().default(100),
    spO2Min: z.number().default(90),
    glucoseMax: z.number().default(200)
  })
});
export type EnrollRpmPatientRequest = z.infer<typeof EnrollRpmPatientRequestSchema>;

export const AcknowledgeVitalBreachRequestSchema = z.object({
  alertId: z.string().uuid(),
  acknowledgedBy: z.string(),
  clinicalActionTaken: z.string(),
  escalateToVideoCall: z.boolean().default(false)
});
export type AcknowledgeVitalBreachRequest = z.infer<typeof AcknowledgeVitalBreachRequestSchema>;
