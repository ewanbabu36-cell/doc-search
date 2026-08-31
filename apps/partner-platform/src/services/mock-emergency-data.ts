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
  EmergencyAnalyticsDto
} from '@docsearch/api-contracts';

const T_ID = '11111111-1111-4111-8111-111111111111';
const P_ID = '22222222-2222-4222-8222-222222222222';
const O_ID = '33333333-3333-4333-8333-333333333333';
const B_ID = '44444444-4444-4444-8444-444444444444';

export const mockEmergencyDepartment: EmergencyDepartmentDto = {
  id: 'ed-001',
  tenantId: T_ID,
  partnerId: P_ID,
  organizationId: O_ID,
  branchId: B_ID,
  departmentCode: 'ED-TRAUMA-MAIN',
  departmentName: 'Apex Emergency & Level 1 Trauma Center',
  totalBeds: 28,
  resuscitationBeds: 4,
  traumaBeds: 6,
  observationBeds: 10,
  headOfEmergency: 'Dr. Evelyn Reed, MD (Emergency Medicine)',
  isDisasterModeActive: false,
  isActive: true,
  createdAt: '2026-08-01T08:00:00.000Z',
  updatedAt: '2026-08-01T08:00:00.000Z'
};

export const mockEmergencyZones: EmergencyZoneDto[] = [
  {
    id: 'ez-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    departmentId: 'ed-001',
    zoneCode: 'RED-RESUS',
    zoneName: 'Red Zone / Resuscitation Bay (Code Blue / ESI 1)',
    zoneType: 'RESUSCITATION_BAY',
    capacity: 4,
    occupiedCount: 1,
    chargePerHour: 2500,
    isActive: true,
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-01T08:00:00.000Z'
  },
  {
    id: 'ez-002',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    departmentId: 'ed-001',
    zoneCode: 'TRAUMA-SUITE',
    zoneName: 'Trauma Resuscitation & Shock Suite (Bay 1-6)',
    zoneType: 'TRAUMA_SUITE',
    capacity: 6,
    occupiedCount: 2,
    chargePerHour: 2200,
    isActive: true,
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-01T08:00:00.000Z'
  },
  {
    id: 'ez-003',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    departmentId: 'ed-001',
    zoneCode: 'YELLOW-ACUTE',
    zoneName: 'Yellow Zone / Major Acute Care (ESI 2-3)',
    zoneType: 'MAJOR_ACUTE_ZONE',
    capacity: 10,
    occupiedCount: 5,
    chargePerHour: 1500,
    isActive: true,
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-01T08:00:00.000Z'
  },
  {
    id: 'ez-004',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    departmentId: 'ed-001',
    zoneCode: 'GREEN-FAST',
    zoneName: 'Green Zone / Urgent Fast Track (ESI 4-5)',
    zoneType: 'MINOR_TREATMENT_FAST_TRACK',
    capacity: 8,
    occupiedCount: 3,
    chargePerHour: 800,
    isActive: true,
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-01T08:00:00.000Z'
  },
  {
    id: 'ez-005',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    departmentId: 'ed-001',
    zoneCode: 'OBS-UNIT',
    zoneName: 'Clinical Decision & Extended Observation Unit',
    zoneType: 'OBSERVATION_UNIT',
    capacity: 10,
    occupiedCount: 4,
    chargePerHour: 1200,
    isActive: true,
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-01T08:00:00.000Z'
  }
];

export const mockEmergencyEncounters: EmergencyEncounterDto[] = [
  {
    id: 'ee-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    encounterNumber: 'EMG-2026-001',
    patientId: 'pat-emg-101',
    patientName: 'David K. Miller',
    patientMrn: 'MRN-772101',
    isUnknownPatient: false,
    patientGender: 'M',
    patientAge: 54,
    arrivalMode: 'AMBULANCE_GROUND',
    broughtBy: 'Paramedic Unit 12 (City EMS)',
    referralSource: 'Scene of Road Traffic Accident',
    chiefComplaint: 'Severe polytrauma, flail chest, pelvic instability following high-speed motorcycle crash',
    arrivalTimestamp: '2026-08-29T10:15:00.000Z',
    registrationTimestamp: '2026-08-29T10:16:00.000Z',
    currentStatus: 'IN_TREATMENT',
    currentZoneId: 'ez-002',
    currentZoneName: 'Trauma Resuscitation Suite',
    currentBedNumber: 'TRAUMA-BAY-01',
    assignedPhysicianName: 'Dr. Evelyn Reed, MD',
    assignedNurseName: 'Nurse Mark Hopkins, RN',
    triageEsiLevel: 'ESI_1_IMMEDIATE_RESUSCITATION',
    isTraumaAlert: true,
    isCodeBlue: false,
    isMLC: true,
    mlcCaseNumber: 'MLC-2026-0442',
    createdAt: '2026-08-29T10:15:00.000Z',
    updatedAt: '2026-08-29T10:30:00.000Z'
  },
  {
    id: 'ee-002',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    encounterNumber: 'EMG-2026-002',
    patientId: 'pat-emg-102',
    patientName: 'Unknown Male #402',
    patientMrn: 'MRN-UNKWN-402',
    isUnknownPatient: true,
    temporaryIdentifier: 'TAG-RED-402',
    patientGender: 'M',
    patientAge: 40,
    arrivalMode: 'POLICE_ESCORT',
    broughtBy: 'Inspector R. Sharma (Metro Police)',
    chiefComplaint: 'Brought unconscious from public transit hub; pinpoint pupils, shallow respirations',
    arrivalTimestamp: '2026-08-29T10:45:00.000Z',
    registrationTimestamp: '2026-08-29T10:46:00.000Z',
    currentStatus: 'RESUSCITATION',
    currentZoneId: 'ez-001',
    currentZoneName: 'Red Zone / Resuscitation Bay',
    currentBedNumber: 'RESUS-BAY-02',
    assignedPhysicianName: 'Dr. Marcus Webb, MD',
    assignedNurseName: 'Nurse Sarah Connor',
    triageEsiLevel: 'ESI_1_IMMEDIATE_RESUSCITATION',
    isTraumaAlert: false,
    isCodeBlue: true,
    isMLC: true,
    mlcCaseNumber: 'MLC-2026-0443',
    createdAt: '2026-08-29T10:45:00.000Z',
    updatedAt: '2026-08-29T11:00:00.000Z'
  },
  {
    id: 'ee-003',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    encounterNumber: 'EMG-2026-003',
    patientId: 'pat-emg-103',
    patientName: 'Hannah Abbott',
    patientMrn: 'MRN-881290',
    isUnknownPatient: false,
    patientGender: 'F',
    patientAge: 68,
    arrivalMode: 'WALK_IN',
    broughtBy: 'Spouse (Robert Abbott)',
    chiefComplaint: 'Acute retrosternal crushing chest pain radiating to left jaw, diaphoresis x 45 min',
    arrivalTimestamp: '2026-08-29T11:00:00.000Z',
    registrationTimestamp: '2026-08-29T11:02:00.000Z',
    currentStatus: 'IN_TREATMENT',
    currentZoneId: 'ez-003',
    currentZoneName: 'Yellow Zone / Major Acute Care',
    currentBedNumber: 'ACUTE-BED-04',
    assignedPhysicianName: 'Dr. Evelyn Reed, MD',
    assignedNurseName: 'Nurse Elena Gilbert',
    triageEsiLevel: 'ESI_2_EMERGENT_HIGH_RISK',
    isTraumaAlert: false,
    isCodeBlue: false,
    isMLC: false,
    createdAt: '2026-08-29T11:00:00.000Z',
    updatedAt: '2026-08-29T11:15:00.000Z'
  },
  {
    id: 'ee-004',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    encounterNumber: 'EMG-2026-004',
    patientId: 'pat-emg-104',
    patientName: 'Liam Gallagher',
    patientMrn: 'MRN-332910',
    isUnknownPatient: false,
    patientGender: 'M',
    patientAge: 29,
    arrivalMode: 'WALK_IN',
    broughtBy: 'Self',
    chiefComplaint: 'Deep laceration right forearm with active bleeding from domestic power tool injury',
    arrivalTimestamp: '2026-08-29T11:20:00.000Z',
    registrationTimestamp: '2026-08-29T11:22:00.000Z',
    currentStatus: 'IN_TREATMENT',
    currentZoneId: 'ez-004',
    currentZoneName: 'Green Zone / Urgent Fast Track',
    currentBedNumber: 'FAST-BED-02',
    assignedPhysicianName: 'Dr. Marcus Webb, MD',
    assignedNurseName: 'Nurse Mark Hopkins, RN',
    triageEsiLevel: 'ESI_4_LESS_URGENT_ONE_RESOURCE',
    isTraumaAlert: false,
    isCodeBlue: false,
    isMLC: false,
    createdAt: '2026-08-29T11:20:00.000Z',
    updatedAt: '2026-08-29T11:25:00.000Z'
  }
];

export const mockTriageAssessments: EmergencyTriageAssessmentDto[] = [
  {
    id: 'eta-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    encounterId: 'ee-001',
    patientId: 'pat-emg-101',
    patientName: 'David K. Miller',
    triageNurseName: 'Nurse Mark Hopkins, RN',
    esiLevel: 'ESI_1_IMMEDIATE_RESUSCITATION',
    chiefComplaint: 'High-speed motor vehicle collision; shock state with unstable pelvis',
    painScore: 10,
    systolicBp: 80,
    diastolicBp: 50,
    pulseRate: 138,
    respiratoryRate: 32,
    temperatureF: 97.4,
    spo2Percentage: 89,
    gcsScore: 9,
    bloodGlucoseMgDl: 140,
    allergiesNoted: 'NKDA',
    highRiskIndicators: 'Hemorrhagic shock, severe thoracic trauma, pelvic fracture',
    sepsisScreenPositive: false,
    strokeScreenPositive: false,
    stemiScreenPositive: false,
    triageNotes: 'Immediate transfer to Trauma Bay 1. Massive Transfusion Protocol placed on standby.',
    timestamp: '2026-08-29T10:16:00.000Z'
  },
  {
    id: 'eta-002',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    encounterId: 'ee-003',
    patientId: 'pat-emg-103',
    patientName: 'Hannah Abbott',
    triageNurseName: 'Nurse Elena Gilbert',
    esiLevel: 'ESI_2_EMERGENT_HIGH_RISK',
    chiefComplaint: 'Typical angina with radiation, diaphoresis, dyspnea',
    painScore: 8,
    systolicBp: 158,
    diastolicBp: 96,
    pulseRate: 98,
    respiratoryRate: 20,
    temperatureF: 98.6,
    spo2Percentage: 96,
    gcsScore: 15,
    bloodGlucoseMgDl: 118,
    allergiesNoted: 'Sulfa Drugs',
    highRiskIndicators: 'Suspected Acute Coronary Syndrome / STEMI',
    sepsisScreenPositive: false,
    strokeScreenPositive: false,
    stemiScreenPositive: true,
    triageNotes: 'Immediate 12-lead ECG and Troponin I ordered; cardiology notification sent.',
    timestamp: '2026-08-29T11:03:00.000Z'
  }
];

export const mockTriageReassessments: EmergencyTriageReassessmentDto[] = [
  {
    id: 'etr-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    encounterId: 'ee-003',
    reassessedByNurse: 'Nurse Elena Gilbert',
    previousEsi: 'ESI_3_URGENT_MULTIPLE_RESOURCES',
    newEsi: 'ESI_2_EMERGENT_HIGH_RISK',
    justification: 'ECG demonstrates ST elevations in II, III, aVF (Inferior STEMI); acuity escalated.',
    reassessmentVitalsSummary: 'BP: 152/94, HR: 104, SpO2: 97% on 2L NC, Pain: 8/10',
    timestamp: '2026-08-29T11:10:00.000Z'
  }
];

export const mockResuscitationEvents: EmergencyResuscitationEventDto[] = [
  {
    id: 'ere-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    encounterId: 'ee-002',
    patientName: 'Unknown Male #402',
    eventNumber: 'CODE-BLUE-2026-012',
    locationBay: 'Resuscitation Bay 2',
    teamLeaderName: 'Dr. Marcus Webb, MD',
    initialRhythm: 'ASYSTOLE',
    startTime: '2026-08-29T10:46:00.000Z',
    endTime: '2026-08-29T11:04:00.000Z',
    cprDurationMinutes: 18,
    shocksDeliveredCount: 2,
    airwaySecuredType: 'Endotracheal Tube 8.0mm cuffed via direct video laryngoscopy',
    medicationsAdministeredSummary: 'Epinephrine 1mg IV x 3, Amiodarone 300mg IV, Naloxone 2mg IV',
    roscAchieved: true,
    finalOutcome: 'ROSC Achieved; Sinus Tachycardia @ 110 bpm; transferred to Medical ICU',
    notes: 'ACLS algorithm followed. Spontaneous circulation returned at minute 18 after 2nd defibrillation shock following rhythm shift to VF.',
    createdAt: '2026-08-29T10:46:00.000Z'
  }
];

export const mockTraumaActivations: TraumaActivationDto[] = [
  {
    id: 'tra-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    encounterId: 'ee-001',
    patientName: 'David K. Miller',
    activationNumber: 'TRAUMA-ACT-2026-088',
    activationLevel: 'LEVEL_1_HIGHEST_TRAUMA_ALERT',
    mechanismOfInjury: 'High speed motorcycle vs SUV, thrown 15 feet',
    timeOfInjury: '2026-08-29T09:45:00.000Z',
    traumaTeamLeader: 'Dr. Evelyn Reed, MD (Trauma Attending)',
    airwayStatus: 'Intubated in ED Bay 1, bilateral breath sounds present',
    breathingStatus: 'Tension pneumothorax right relieved with immediate 28Fr chest tube',
    circulationStatus: 'Hypotensive shock; Pelvic binder placed; 2 Units PRBC infusing via Rapid Infuser',
    disabilityGcs: 9,
    exposureFindings: 'Large degloving wound right thigh, open right femur fracture with active bleeding',
    fastScanPositive: true,
    pelvicBinderApplied: true,
    massiveTransfusionActivated: true,
    specialistConsultsCalled: 'Orthopaedic Trauma Surgeon, Vascular Surgery, Interventional Radiology',
    dispositionPlan: 'Stat transfer to OT-04 for exploratory laparotomy and external fixation',
    activatedAt: '2026-08-29T10:16:00.000Z'
  }
];

export const mockObservationCases: EmergencyObservationCaseDto[] = [
  {
    id: 'eoc-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    encounterId: 'ee-004',
    patientName: 'Liam Gallagher',
    observationBedNumber: 'OBS-BED-03',
    admissionReason: 'Post-tendon exploration and wound repair under local anaesthesia; monitoring for compartment syndrome',
    attendingDoctor: 'Dr. Marcus Webb, MD',
    startedAt: '2026-08-29T11:45:00.000Z',
    clinicalProgressSummary: 'Radial pulse palpable +2, capillary refill < 2s, pain controlled on oral analgesics',
    hoursInObservation: 3.5,
    status: 'ACTIVE_MONITORING',
    finalDecisionNotes: 'Plan for discharge home with outpatient orthopaedic follow-up in 48 hours'
  }
];

export const mockMLCCases: EmergencyMLCCaseDto[] = [
  {
    id: 'mlc-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    encounterId: 'ee-001',
    patientName: 'David K. Miller',
    mlcNumber: 'MLC-2026-0442',
    caseType: 'ROAD_TRAFFIC_ACCIDENT',
    policeStation: 'City Central Police Station',
    policeOfficerName: 'Sub-Inspector Arvind Rao',
    policeBadgeNumber: 'BADGE-88219',
    firNumber: 'FIR-2026/891',
    injuryDescription: 'Multiple grievous blunt injuries, open pelvic and right lower extremity fractures consistent with vehicular trauma',
    evidenceItemsCollected: 'Blood samples for toxicology, personal belongings sealed in custody locker',
    chainOfCustodyCustodian: 'Nurse Mark Hopkins, RN',
    governmentNotificationSent: true,
    registeredByDoctor: 'Dr. Evelyn Reed, MD',
    timestamp: '2026-08-29T10:20:00.000Z'
  }
];

export const mockCrashCarts: EmergencyCrashCartDto[] = [
  {
    id: 'ecc-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    cartCode: 'CART-RESUS-01',
    locationZone: 'Resuscitation Suite (Red Zone)',
    sealNumber: 'SEAL-998124',
    isSealIntact: true,
    lastCheckedAt: '2026-08-29T07:00:00.000Z',
    lastCheckedBy: 'Staff Nurse Jennifer Adams',
    defibrillatorBatteryPercent: 100,
    oxygenCylinderPressurePsi: 2000,
    hasExpiredItems: false,
    status: 'READY'
  },
  {
    id: 'ecc-002',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    cartCode: 'CART-TRAUMA-02',
    locationZone: 'Trauma Bay 1-6',
    sealNumber: 'SEAL-998125',
    isSealIntact: true,
    lastCheckedAt: '2026-08-29T07:15:00.000Z',
    lastCheckedBy: 'Staff Nurse Jennifer Adams',
    defibrillatorBatteryPercent: 95,
    oxygenCylinderPressurePsi: 1950,
    hasExpiredItems: false,
    status: 'READY'
  }
];

export const mockAmbulanceTransfers: EmergencyAmbulanceTransferDto[] = [
  {
    id: 'eat-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    encounterId: 'ee-001',
    transferCode: 'AMB-TRF-2026-018',
    patientName: 'David K. Miller',
    ambulanceNumber: 'EMS-MEDIC-04',
    transportType: 'INBOUND_RECEIVAL',
    sendingFacility: 'Accident Scene (Highway Mile 14)',
    receivingFacility: 'Apex Level 1 Trauma Center',
    accompanyingParamedic: 'Paramedic Sarah Jenkins',
    transferReason: 'Field triage categorized as Level 1 Trauma; telemetry transmit completed en route',
    departureTime: '2026-08-29T10:00:00.000Z',
    arrivalTime: '2026-08-29T10:15:00.000Z',
    status: 'ARRIVED_HANDOVER_COMPLETE'
  }
];

export const mockDispositions: EmergencyDispositionDto[] = [
  {
    id: 'edr-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    encounterId: 'ee-001',
    patientName: 'David K. Miller',
    outcome: 'OPERATION_THEATRE_STAT',
    authorizingPhysician: 'Dr. Evelyn Reed, MD',
    destinationWardOrFacility: 'OT Suite 04 (Emergency OT)',
    clinicalSummary: 'Hemoperitoneum on FAST with unstable pelvis; cleared for stat damage control surgery.',
    followUpInstructions: 'Surgical consent signed by trauma team lead in view of emergency life-saving priority.',
    dispositionTimestamp: '2026-08-29T10:45:00.000Z'
  }
];

export const mockDeathRecords: EmergencyDeathRecordDto[] = [
  {
    id: 'edead-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    encounterId: 'ee-002',
    deathCertificateNumber: 'DTH-ED-2026-004',
    patientName: 'Unknown Male #399',
    isBroughtDead: true,
    declaredDeadTimestamp: '2026-08-28T22:15:00.000Z',
    declaringPhysician: 'Dr. Marcus Webb, MD',
    primaryCauseOfDeath: 'Severe traumatic head injury with irreversible brainstem herniation',
    secondaryCauses: 'Fatal pedestrian road accident',
    mortuaryHandoverStaff: 'Mortuary Tech S. Patil',
    policeInformed: true,
    notes: 'Brought dead by highway patrol. Body preserved in Cold Chamber 04 pending inquest and identification.'
  }
];

export const mockDisasterEvents: EmergencyDisasterEventDto[] = [
  {
    id: 'ede-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    incidentCode: 'MCI-2026-METRO-FIRE',
    disasterType: 'Industrial Chemical Plant Explosion & Fire',
    incidentCommanderName: 'Dr. Evelyn Reed (Incident Commander)',
    totalVictimsCount: 24,
    criticalVictimsCount: 6,
    activatedAt: '2026-08-27T14:00:00.000Z',
    isDeactivated: true,
    deactivatedAt: '2026-08-27T20:30:00.000Z'
  }
];

export const mockAuditTraces: EmergencyAuditTraceDto[] = [
  {
    id: 'eaud-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    traceNumber: 'TRACE-ED-00918201',
    actorId: 'usr-dr-evelyn',
    actorName: 'Dr. Evelyn Reed',
    actorRole: 'TRAUMA_ATTENDING',
    action: 'ACTIVATE_TRAUMA_LEVEL_1',
    entityType: 'TRAUMA_ACTIVATION',
    entityId: 'tra-001',
    entityCode: 'TRAUMA-ACT-2026-088',
    justification: 'High speed vehicular crash with hypovolemic shock (ESI 1)',
    ipAddress: '10.0.5.10',
    integrityHash: 'sha256-4c919a0bcdef882190',
    previousHash: 'sha256-genesis',
    newState: { status: 'LEVEL_1_HIGHEST_TRAUMA_ALERT' },
    timestamp: '2026-08-29T10:16:00.000Z'
  },
  {
    id: 'eaud-002',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    traceNumber: 'TRACE-ED-00918202',
    actorId: 'usr-dr-marcus',
    actorName: 'Dr. Marcus Webb',
    actorRole: 'EMERGENCY_PHYSICIAN',
    action: 'CODE_BLUE_ROSC_ACHIEVED',
    entityType: 'RESUSCITATION_EVENT',
    entityId: 'ere-001',
    entityCode: 'CODE-BLUE-2026-012',
    justification: 'Successful defibrillation and return of spontaneous circulation',
    ipAddress: '10.0.5.14',
    integrityHash: 'sha256-91bca8817290adcf22',
    previousHash: 'sha256-4c919a0bcdef882190',
    newState: { status: 'ROSC_ACHIEVED' },
    timestamp: '2026-08-29T11:04:00.000Z'
  }
];

export const mockOverviewMetrics: EmergencyOverviewMetricsDto = {
  activeEDCensus: 14,
  waitingForTriageCount: 1,
  esi1Count: 2,
  esi2Count: 4,
  esi3Count: 5,
  activeTraumaAlerts: 1,
  activeResuscitationCount: 1,
  mlcCasesToday: 3,
  observationPatientsCount: 4,
  averageDoorToDoctorMinutes: 12.5,
  averageDoorToTriageMinutes: 3.2,
  isDisasterModeActive: false
};

export const mockAnalytics: EmergencyAnalyticsDto = {
  esiDistribution: [
    { esiLevel: 'ESI 1 (Immediate)', count: 8 },
    { esiLevel: 'ESI 2 (Emergent)', count: 24 },
    { esiLevel: 'ESI 3 (Urgent)', count: 42 },
    { esiLevel: 'ESI 4 (Less Urgent)', count: 36 },
    { esiLevel: 'ESI 5 (Non-Urgent)', count: 18 }
  ],
  arrivalModes: [
    { mode: 'Walk-In', count: 68 },
    { mode: 'Ambulance Ground', count: 44 },
    { mode: 'Police Escort', count: 8 },
    { mode: 'Inter-Facility Transfer', count: 8 }
  ],
  hourlyVolume: [
    { hourLabel: '00:00 - 04:00', count: 14 },
    { hourLabel: '04:00 - 08:00', count: 18 },
    { hourLabel: '08:00 - 12:00', count: 38 },
    { hourLabel: '12:00 - 16:00', count: 42 },
    { hourLabel: '16:00 - 20:00', count: 56 },
    { hourLabel: '20:00 - 00:00', count: 32 }
  ],
  dispositionBreakdown: [
    { outcome: 'Discharged Home', count: 72 },
    { outcome: 'IPD Ward Admission', count: 28 },
    { outcome: 'ICU / HDU Admission', count: 14 },
    { outcome: 'Stat OT / Surgery', count: 8 },
    { outcome: 'Inter-Hospital Transfer', count: 4 },
    { outcome: 'Deceased / LAMA', count: 2 }
  ]
};
