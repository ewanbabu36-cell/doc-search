import type {
  ExecutiveCommandSnapshotDto,
  PredictiveBedForecastDto,
  EdNedocsHourlyDto,
  OtSuiteEfficiencyDto,
  PatientAcuityHeatmapItemDto,
  RcmLeakageRiskItemDto,
  CriticalConsumableRunoutDto,
  WhatIfScenarioResultDto,
  ExecutiveAuditTraceDto
} from '@docsearch/api-contracts';

export const mockExecutiveSnapshot: ExecutiveCommandSnapshotDto = {
  tenantId: '11111111-1111-4111-8111-111111111111',
  hospitalName: 'Apex Multi-Specialty Hospital & Research Institute (Main Campus)',
  snapshotTimestamp: new Date().toISOString(),
  surgeLevel: 'BUSY_YELLOW',
  activeEmergencyCodes: [
    {
      codeType: 'CODE_BLUE_CARDIAC_ARREST',
      location: 'Inpatient Medical Ward 3 — Bed 304',
      declaredAt: '2026-08-30T06:15:00.000Z',
      status: 'STANDBY'
    }
  ],
  totalBeds: 450,
  occupiedBeds: 402,
  bedOccupancyPct: 89.33,
  availableBedsCount: 48,
  icuBedsTotal: 60,
  icuBedsOccupied: 56,
  icuOccupancyPct: 93.33,
  ventilatorsTotal: 35,
  ventilatorsInUse: 31,
  ventilatorUtilizationPct: 88.57,
  edTriageWaitingCount: 14,
  edHoldForAdmissionCount: 6,
  edNedocsScore: 118,
  edNedocsStatus: 'Busy & Approaching Overcrowding',
  otSuitesActive: 9,
  otSuitesTotal: 10,
  otUtilizationPct: 90.0,
  surgeriesInProgressCount: 8,
  surgeriesDelayedCount: 1,
  dailyRevenueVelocityInr: 4825000.0,
  unbilledChargesRiskInr: 345000.0,
  claimsDenialRiskCount: 4,
  statLabOrdersPending: 7,
  statRadiologyOrdersPending: 3,
  criticalBloodUnitsAlertCount: 1,
  criticalConsumablesStockoutRiskCount: 2
};

export const mockPredictiveBedForecasts: PredictiveBedForecastDto[] = [
  {
    id: 'pbf11111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    forecastWindow: 'NEXT_24_HOURS',
    specialtyName: 'Critical Care & ICUs (MICU / SICU)',
    currentOccupied: 56,
    capacityLimit: 60,
    predictedAdmissions: 9,
    predictedDischarges: 4,
    netProjectedDemand: 61,
    projectedOccupancyPct: 101.67,
    predictedBottleneckLevel: 'CRITICAL_BLOCKER',
    aiConfidencePct: 94.8,
    recommendedAction: 'Expedite step-down of 3 stable post-op CABG patients to High Dependency Unit (HDU 2).'
  },
  {
    id: 'pbf11111-1111-4111-8111-111111111102',
    tenantId: '11111111-1111-4111-8111-111111111111',
    forecastWindow: 'NEXT_24_HOURS',
    specialtyName: 'Cardiology & CCU',
    currentOccupied: 42,
    capacityLimit: 48,
    predictedAdmissions: 6,
    predictedDischarges: 5,
    netProjectedDemand: 43,
    projectedOccupancyPct: 89.58,
    predictedBottleneckLevel: 'MODERATE',
    aiConfidencePct: 91.2,
    recommendedAction: 'Maintain fast-track discharge round at 11:00 AM to free 3 beds ahead of scheduled cath lab admissions.'
  },
  {
    id: 'pbf11111-1111-4111-8111-111111111103',
    tenantId: '11111111-1111-4111-8111-111111111111',
    forecastWindow: 'NEXT_24_HOURS',
    specialtyName: 'General Surgery & Orthopedics',
    currentOccupied: 88,
    capacityLimit: 100,
    predictedAdmissions: 14,
    predictedDischarges: 12,
    netProjectedDemand: 90,
    projectedOccupancyPct: 90.0,
    predictedBottleneckLevel: 'LOW',
    aiConfidencePct: 93.5,
    recommendedAction: 'Adequate ward capacity available for elective orthopedic joint replacement cohort.'
  }
];

export const mockEdNedocsHourly: EdNedocsHourlyDto[] = [
  { hourTimestamp: '02:00', totalPatientsInEd: 12, admittedPatientsWaitingBed: 2, resuscitationBedsOccupied: 1, longestWaitTimeMins: 22, nedocsScore: 65, surgeCategory: 'NORMAL_GREEN', predictedArrivalsNext4Hours: 10 },
  { hourTimestamp: '04:00', totalPatientsInEd: 10, admittedPatientsWaitingBed: 3, resuscitationBedsOccupied: 1, longestWaitTimeMins: 28, nedocsScore: 72, surgeCategory: 'NORMAL_GREEN', predictedArrivalsNext4Hours: 14 },
  { hourTimestamp: '06:00', totalPatientsInEd: 16, admittedPatientsWaitingBed: 4, resuscitationBedsOccupied: 2, longestWaitTimeMins: 45, nedocsScore: 102, surgeCategory: 'BUSY_YELLOW', predictedArrivalsNext4Hours: 24 },
  { hourTimestamp: '08:00', totalPatientsInEd: 26, admittedPatientsWaitingBed: 6, resuscitationBedsOccupied: 3, longestWaitTimeMins: 68, nedocsScore: 118, surgeCategory: 'BUSY_YELLOW', predictedArrivalsNext4Hours: 32 }
];

export const mockOtSuiteEfficiencies: OtSuiteEfficiencyDto[] = [
  { otRoomId: 'ot-1', otRoomName: 'Modular OT 1 (Cardiac Hybrid)', suiteType: 'CARDIAC_HYBRID', casesScheduledToday: 3, casesCompletedToday: 1, casesInProgress: 1, averageTurnaroundTimeMins: 24, utilizationRatePct: 94.5, onTimeStartRatePct: 100.0, scheduleStatus: 'ON_SCHEDULE', nextScheduledSpecialty: 'Cardiothoracic (Off-Pump CABG)' },
  { otRoomId: 'ot-2', otRoomName: 'Modular OT 2 (Neuro Navigation)', suiteType: 'NEURO_STEALTH', casesScheduledToday: 2, casesCompletedToday: 0, casesInProgress: 1, averageTurnaroundTimeMins: 35, utilizationRatePct: 91.0, onTimeStartRatePct: 100.0, scheduleStatus: 'ON_SCHEDULE', nextScheduledSpecialty: 'Neurosurgery (Craniotomy)' },
  { otRoomId: 'ot-3', otRoomName: 'Modular OT 3 (Orthopedic Laminar)', suiteType: 'ORTHO_LAMINAR', casesScheduledToday: 4, casesCompletedToday: 2, casesInProgress: 1, averageTurnaroundTimeMins: 18, utilizationRatePct: 96.0, onTimeStartRatePct: 95.0, scheduleStatus: 'ON_SCHEDULE', nextScheduledSpecialty: 'Joint Replacement (Bilateral TKR)' },
  { otRoomId: 'ot-4', otRoomName: 'OT 4 (Dedicated Emergency / Trauma)', suiteType: 'EMERGENCY_DEDICATED', casesScheduledToday: 4, casesCompletedToday: 1, casesInProgress: 1, averageTurnaroundTimeMins: 15, utilizationRatePct: 88.0, onTimeStartRatePct: 100.0, scheduleStatus: 'ON_SCHEDULE', nextScheduledSpecialty: 'Emergency Laparotomy' }
];

export const mockPatientAcuityHeatmap: PatientAcuityHeatmapItemDto[] = [
  { bedId: 'b-304', bedNumber: 'Bed 304', wardName: 'Medical Ward 3', patientName: 'Gopal Krishna', patientMrn: 'MRN-2026-9021', deteriorationScore: 8, acuityLevel: 'CRITICAL_DETERIORATING_RED', primaryRiskTrigger: 'SpO2 86% on 4L O2, Tachycardia 128 bpm', icuTransferProbabilityPct: 88.0, attendingPhysician: 'Dr. Suresh Menon', lastVitalsSync: '5 mins ago' },
  { bedId: 'b-212', bedNumber: 'Bed 212', wardName: 'Surgical HDU', patientName: 'Meenakshi Sundaram', patientMrn: 'MRN-2026-8819', deteriorationScore: 6, acuityLevel: 'HIGH_RISK_AMBER', primaryRiskTrigger: 'BP 90/58, Urine Output < 20ml/hr', icuTransferProbabilityPct: 62.0, attendingPhysician: 'Dr. Vivek Mehra', lastVitalsSync: '12 mins ago' },
  { bedId: 'b-108', bedNumber: 'Bed 108', wardName: 'Cardio Ward 1', patientName: 'Rajendra Prasad', patientMrn: 'MRN-2026-6642', deteriorationScore: 3, acuityLevel: 'MODERATE_YELLOW', primaryRiskTrigger: 'Intermittent PVCs on Telemetry', icuTransferProbabilityPct: 18.0, attendingPhysician: 'Dr. Sanjay Gupta', lastVitalsSync: '20 mins ago' },
  { bedId: 'b-102', bedNumber: 'Bed 102', wardName: 'Orthopedic Ward', patientName: 'Pooja Hegde', patientMrn: 'MRN-2026-4412', deteriorationScore: 1, acuityLevel: 'STABLE_GREEN', primaryRiskTrigger: 'Normal Baseline Vitals', icuTransferProbabilityPct: 2.0, attendingPhysician: 'Dr. Arvind Saxena', lastVitalsSync: '25 mins ago' }
];

export const mockRcmLeakageRisks: RcmLeakageRiskItemDto[] = [
  { id: 'rcm-1', patientMrn: 'MRN-2026-7782', patientName: 'Ramanathan Iyer', departmentName: 'Cath Lab & OT', potentialLeakageType: 'UNAPPROVED_HIGH_COST_IMPLANT', estimatedRiskAmountInr: 185000.0, riskProbabilityPct: 92.0, suggestedCorrection: 'Upload drug-eluting stent lot sticker and obtain retroactive TPA pre-auth addendum before discharge.', detectedAt: '2026-08-30T05:30:00.000Z' },
  { id: 'rcm-2', patientMrn: 'MRN-2026-3391', patientName: 'Harish Chandra', departmentName: 'Intensive Care Unit (ICU-A)', potentialLeakageType: 'INCOMPLETE_PRE_AUTH_EXTENSION', estimatedRiskAmountInr: 120000.0, riskProbabilityPct: 85.0, suggestedCorrection: 'Submit 48-hour ventilator continuation clinical justification letter to Star Health Insurance.', detectedAt: '2026-08-30T04:15:00.000Z' },
  { id: 'rcm-3', patientMrn: 'MRN-2026-5512', patientName: 'Sunita Mehra', departmentName: 'Surgical ICU', potentialLeakageType: 'UNBILLED_DIAGNOSTIC_ORDER', estimatedRiskAmountInr: 40000.0, riskProbabilityPct: 95.0, suggestedCorrection: 'Post-op Bedside 2D Echocardiogram performed at 22:00 not posted to billing ledger.', detectedAt: '2026-08-30T03:00:00.000Z' }
];

export const mockCriticalConsumableRunouts: CriticalConsumableRunoutDto[] = [
  { skuCode: 'BB-PRBC-O-NEG', itemName: 'Packed Red Blood Cells (O-Negative Universal Donor)', category: 'BLOOD_UNIT', currentStockUnits: 4, dailyBurnRateUnits: 3, projectedRunoutDays: 1.3, urgencyLevel: 'CRITICAL_RUNOUT_24H', vendorLeadTimeDays: 1, autoReplenishmentStatus: 'Emergency Donor Drive Alert Sent' },
  { skuCode: 'MED-NORAD-4MG', itemName: 'Noradrenaline 4mg/2ml Inotropes', category: 'LIFE_SAVING_DRUG', currentStockUnits: 42, dailyBurnRateUnits: 18, projectedRunoutDays: 2.3, urgencyLevel: 'WARNING_RUNOUT_72H', vendorLeadTimeDays: 1, autoReplenishmentStatus: 'PO-2026-8819 Dispatched' },
  { skuCode: 'O2-CYL-D-TYPE', itemName: 'High-Pressure Medical Oxygen Cylinders (D-Type Backup)', category: 'OXYGEN_CYLINDER', currentStockUnits: 28, dailyBurnRateUnits: 5, projectedRunoutDays: 5.6, urgencyLevel: 'ADEQUATE_BUFFER', vendorLeadTimeDays: 1, autoReplenishmentStatus: 'Manifold Bulk Supply Active' }
];

export const mockWhatIfScenarioResults: WhatIfScenarioResultDto[] = [
  {
    scenarioId: 'scen-1111-1111-4111-8111-111111111101',
    scenarioName: 'Simulation: Mass Casualty Multi-Vehicle Collision (45 Trauma Patients)',
    simulatedOccupancyPeakPct: 98.4,
    simulatedIcuDeficitBeds: 5,
    simulatedVentilatorShortageCount: 3,
    simulatedEdWaitTimePeakMins: 110,
    simulatedDailyFinancialImpactInr: 2200000.0,
    aiRecommendations: [
      'Activate Disaster Code Black surge protocol.',
      'Divert non-urgent elective surgeries in OT 3 and OT 5 for 24 hours.',
      'Convert 8 recovery PACU beds into emergency trauma overflow resuscitation bays.',
      'Recall off-duty orthopedic and neurotrauma surgical teams.'
    ],
    generatedAt: '2026-08-30T06:00:00.000Z'
  }
];

export const mockExecutiveAuditTraces: ExecutiveAuditTraceDto[] = [
  {
    id: 'ex-tr-1111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    traceNumber: 'TRACE-EXEC-09901',
    action: 'SURGE_LEVEL_UPDATE',
    entityType: 'HOSPITAL_SURGE',
    entityId: 'surge-1',
    entityCode: 'SURGE-2026-08-30',
    actorName: 'Dr. Alok Verma',
    actorRole: 'CHIEF_MEDICAL_OFFICER',
    justification: 'Elevated hospital surge status to BUSY_YELLOW due to 93% ICU occupancy and ED morning rush.',
    integrityHash: 'c8f9e0134a415a77b819f09e86c123d7a8fbb56284f1a2384a8619114b3017a9',
    timestamp: '2026-08-30T06:15:00.000Z'
  }
];
