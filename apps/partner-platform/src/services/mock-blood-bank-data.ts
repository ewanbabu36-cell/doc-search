import type {
  BloodBankFacilityDto,
  BloodDonorDto,
  BloodDonorScreeningDto,
  BloodDonationDto,
  BloodTestRecordDto,
  BloodComponentDto,
  BloodRequestDto,
  BloodCrossmatchDto,
  BloodIssueDto,
  TransfusionRecordDto,
  TransfusionReactionDto,
  BloodQualityCheckDto,
  BloodStorageTemperatureLogDto,
  BloodDiscardRecordDto,
  BloodBankAuditTraceDto,
  BloodBankOverviewMetricsDto,
  BloodBankAnalyticsDto
} from '@docsearch/api-contracts';

const T_ID = '11111111-1111-4111-8111-111111111111';
const P_ID = '22222222-2222-4222-8222-222222222222';
const O_ID = '33333333-3333-4333-8333-333333333333';
const B_ID = '44444444-4444-4444-8444-444444444444';

export const mockBloodBankFacility: BloodBankFacilityDto = {
  id: 'bbf-001',
  tenantId: T_ID,
  partnerId: P_ID,
  organizationId: O_ID,
  branchId: B_ID,
  facilityCode: 'BB-CENTRAL-01',
  facilityName: 'Apex Regional Blood Bank & Transfusion Medicine Center',
  licenseNumber: 'FDA-BB-LIC-2026/8892',
  medicalDirectorName: 'Dr. Alistair Vance, MD (Transfusion Specialist)',
  headTechnologistName: 'Samantha Ray, SBB(ASCP)',
  storageLocationName: 'Central Blood Bank Suite, Level 1 East Wing',
  totalAvailableUnits: 248,
  quarantineUnits: 18,
  isActive: true,
  createdAt: '2026-08-01T08:00:00.000Z',
  updatedAt: '2026-08-01T08:00:00.000Z'
};

export const mockBloodDonors: BloodDonorDto[] = [
  {
    id: 'bd-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    donorCode: 'DNR-2026-00441',
    fullName: 'Alexander Wright',
    gender: 'MALE',
    dateOfBirth: '1992-05-14T00:00:00.000Z',
    bloodGroup: 'O_NEGATIVE',
    contactNumber: '+1 (555) 382-9912',
    email: 'alex.wright@example.com',
    donorType: 'VOLUNTARY_NON_REMUNERATED',
    eligibilityStatus: 'ELIGIBLE_FOR_DONATION',
    totalDonationsCount: 14,
    lastDonationDate: '2026-05-10T10:00:00.000Z',
    nextEligibleDate: '2026-08-10T00:00:00.000Z',
    createdAt: '2026-08-01T09:00:00.000Z'
  },
  {
    id: 'bd-002',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    donorCode: 'DNR-2026-00442',
    fullName: 'Maria Rodriguez',
    gender: 'FEMALE',
    dateOfBirth: '1998-11-23T00:00:00.000Z',
    bloodGroup: 'A_POSITIVE',
    contactNumber: '+1 (555) 749-1102',
    email: 'm.rodriguez@example.com',
    donorType: 'REPLACEMENT_FAMILY',
    eligibilityStatus: 'ELIGIBLE_FOR_DONATION',
    totalDonationsCount: 3,
    lastDonationDate: '2026-04-18T14:30:00.000Z',
    nextEligibleDate: '2026-08-18T00:00:00.000Z',
    createdAt: '2026-08-05T11:00:00.000Z'
  },
  {
    id: 'bd-003',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    donorCode: 'DNR-2026-00443',
    fullName: 'Jonathan Reed',
    gender: 'MALE',
    dateOfBirth: '1985-03-09T00:00:00.000Z',
    bloodGroup: 'B_POSITIVE',
    contactNumber: '+1 (555) 882-3490',
    donorType: 'VOLUNTARY_NON_REMUNERATED',
    eligibilityStatus: 'TEMPORARILY_DEFERRED',
    deferralReason: 'Low hemoglobin screening (< 12.5 g/dL)',
    deferralEndDate: '2026-09-15T00:00:00.000Z',
    totalDonationsCount: 6,
    lastDonationDate: '2026-03-01T09:00:00.000Z',
    nextEligibleDate: '2026-09-15T00:00:00.000Z',
    createdAt: '2026-08-10T14:00:00.000Z'
  }
];

export const mockDonorScreenings: BloodDonorScreeningDto[] = [
  {
    id: 'bds-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    screeningCode: 'SCR-2026-0891',
    donorId: 'bd-001',
    donorName: 'Alexander Wright',
    weightKg: 78.5,
    hemoglobinGdl: 14.8,
    systolicBp: 122,
    diastolicBp: 78,
    pulseBpm: 70,
    temperatureF: 98.4,
    medicalHistoryCleared: true,
    screeningNurseName: 'Nurse Clara Oswald, RN',
    eligibilityDecision: 'ELIGIBLE_FOR_DONATION',
    remarks: 'Donor in excellent clinical health. Vitals optimal for whole blood donation.',
    screenedAt: '2026-08-29T08:30:00.000Z'
  }
];

export const mockBloodDonations: BloodDonationDto[] = [
  {
    id: 'bdn-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    donationNumber: 'DON-2026-01041',
    donorId: 'bd-001',
    donorName: 'Alexander Wright',
    bloodGroup: 'O_NEGATIVE',
    donationType: 'VOLUNTARY_NON_REMUNERATED',
    collectedVolumeMl: 450,
    anticoagulantType: 'CPDA-1 (63ml)',
    phlebotomistName: 'Marcus Miller, CPT',
    collectionLocation: 'Main Donation Suite Donor Chair #3',
    unitStatus: 'RELEASED_USABLE',
    bagBarcode: 'BAG-2026-08-O-NEG-001',
    collectedAt: '2026-08-29T09:00:00.000Z'
  }
];

export const mockBloodTests: BloodTestRecordDto[] = [
  {
    id: 'bt-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    testCode: 'TST-2026-00912',
    donationId: 'bdn-001',
    unitBarcode: 'BAG-2026-08-O-NEG-001',
    aboGroupingResult: 'O',
    rhFactorResult: 'NEGATIVE',
    antibodyScreen: 'NEGATIVE',
    hivResult: 'NON_REACTIVE',
    hBsAgResult: 'NON_REACTIVE',
    hcvResult: 'NON_REACTIVE',
    syphilisVDRLResult: 'NON_REACTIVE',
    malariaResult: 'NEGATIVE',
    testingTechnicianName: 'Samantha Ray, SBB',
    pathologistSignOffName: 'Dr. Alistair Vance, MD',
    isPassedForRelease: true,
    testedAt: '2026-08-29T11:00:00.000Z'
  }
];

export const mockBloodComponents: BloodComponentDto[] = [
  {
    id: 'bc-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    componentCode: 'PRBC-2026-08-001',
    donationId: 'bdn-001',
    componentType: 'PACKED_RED_BLOOD_CELLS_PRBC',
    bloodGroup: 'O_NEGATIVE',
    volumeMl: 280,
    storageLocation: 'Blood Refrigerator #1 (Shelf 2, Bin A)',
    storageTemperatureTargetC: '2°C to 6°C',
    expiryDate: '2026-10-10T23:59:59.000Z',
    status: 'RELEASED_USABLE',
    preparedByTechnician: 'Samantha Ray, SBB',
    releasedByPathologist: 'Dr. Alistair Vance, MD',
    createdAt: '2026-08-29T12:00:00.000Z'
  },
  {
    id: 'bc-002',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    componentCode: 'FFP-2026-08-001',
    donationId: 'bdn-001',
    componentType: 'FRESH_FROZEN_PLASMA_FFP',
    bloodGroup: 'O_NEGATIVE',
    volumeMl: 200,
    storageLocation: 'Deep Freezer #2 (Drawer 1)',
    storageTemperatureTargetC: '-30°C to -40°C',
    expiryDate: '2027-08-29T23:59:59.000Z',
    status: 'RELEASED_USABLE',
    preparedByTechnician: 'Samantha Ray, SBB',
    releasedByPathologist: 'Dr. Alistair Vance, MD',
    createdAt: '2026-08-29T12:15:00.000Z'
  },
  {
    id: 'bc-003',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    componentCode: 'PLT-2026-08-001',
    donationId: 'bdn-001',
    componentType: 'RANDOM_DONOR_PLATELETS_RDP',
    bloodGroup: 'O_NEGATIVE',
    volumeMl: 55,
    storageLocation: 'Platelet Agitator Incubator #1',
    storageTemperatureTargetC: '20°C to 24°C',
    expiryDate: '2026-09-03T23:59:59.000Z',
    status: 'RELEASED_USABLE',
    preparedByTechnician: 'Samantha Ray, SBB',
    releasedByPathologist: 'Dr. Alistair Vance, MD',
    createdAt: '2026-08-29T12:30:00.000Z'
  }
];

export const mockBloodRequests: BloodRequestDto[] = [
  {
    id: 'breq-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    requestCode: 'REQ-2026-00412',
    patientId: 'pat-emg-101',
    patientName: 'David K. Miller',
    patientMrn: 'MRN-772101',
    encounterId: 'ee-001',
    requestingDepartment: 'Emergency & Trauma Center (Resus Bay 1)',
    orderingPhysicianName: 'Dr. Evelyn Reed, MD',
    requestedComponentType: 'PACKED_RED_BLOOD_CELLS_PRBC',
    patientBloodGroup: 'O_NEGATIVE',
    quantityUnits: 2,
    urgency: 'STAT_EMERGENCY_IMMEDIATE',
    clinicalIndication: 'Massive blood loss secondary to high-velocity pelvic fracture and polytrauma.',
    requiredByTimestamp: '2026-08-29T13:30:00.000Z',
    status: 'RESERVED',
    requestedAt: '2026-08-29T12:45:00.000Z'
  }
];

export const mockCrossmatches: BloodCrossmatchDto[] = [
  {
    id: 'bxm-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    crossmatchCode: 'XM-2026-00891',
    requestId: 'breq-001',
    componentId: 'bc-001',
    componentCode: 'PRBC-2026-08-001',
    patientName: 'David K. Miller',
    patientBloodGroup: 'O_NEGATIVE',
    donorBloodGroup: 'O_NEGATIVE',
    majorCrossmatchResult: 'COMPATIBLE',
    minorCrossmatchResult: 'COMPATIBLE',
    coombsTestResult: 'NEGATIVE',
    overallResult: 'COMPATIBLE',
    testingTechnicianName: 'Samantha Ray, SBB',
    verifiedByPathologist: 'Dr. Alistair Vance, MD',
    crossmatchedAt: '2026-08-29T13:00:00.000Z',
    expiresAt: '2026-09-01T13:00:00.000Z'
  }
];

export const mockBloodIssues: BloodIssueDto[] = [
  {
    id: 'bi-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    issueCode: 'ISS-2026-00381',
    requestId: 'breq-001',
    componentId: 'bc-001',
    componentCode: 'PRBC-2026-08-001',
    patientName: 'David K. Miller',
    patientMrn: 'MRN-772101',
    destinationDepartment: 'Emergency & Trauma Resuscitation Bay 1',
    issuingTechnicianName: 'Samantha Ray, SBB',
    receivingNurseName: 'Nurse Mark Hopkins, RN',
    transportBoxTemperatureC: '4.2°C',
    issuedAt: '2026-08-29T13:10:00.000Z'
  }
];

export const mockTransfusions: TransfusionRecordDto[] = [
  {
    id: 'tr-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    transfusionCode: 'TXF-2026-00219',
    patientName: 'David K. Miller',
    patientMrn: 'MRN-772101',
    encounterId: 'ee-001',
    componentCode: 'PRBC-2026-08-001',
    componentType: 'PACKED_RED_BLOOD_CELLS_PRBC',
    bloodGroup: 'O_NEGATIVE',
    administeredByNurse: 'Nurse Mark Hopkins, RN',
    supervisingDoctorName: 'Dr. Evelyn Reed, MD',
    startTime: '2026-08-29T13:20:00.000Z',
    preTransfusionPulse: 118,
    preTransfusionBp: '90/60',
    preTransfusionTempF: 98.2,
    adverseReactionNoted: false,
    status: 'IN_PROGRESS',
    outcomeNotes: 'Transfusion running smoothly via rapid infuser with blood warmer.'
  }
];

export const mockReactions: TransfusionReactionDto[] = [
  {
    id: 'trx-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    reactionReportCode: 'RXN-2026-0012',
    transfusionId: 'tr-001',
    patientName: 'Eleanor Vance',
    patientMrn: 'MRN-449102',
    componentCode: 'PLT-2026-08-099',
    severity: 'MILD_ALLERGIC_FEBRILE',
    symptomsObserved: 'Urticaria and mild rigors 15 minutes post-platelet infusion.',
    immediateInterventions: 'Transfusion stopped immediately; IV Diphenhydramine 25mg administered.',
    notifiedPhysicianName: 'Dr. Arthur Pendelton, MD',
    clericalCheckConfirmedMatching: true,
    postReactionUrineHemoglobin: 'Negative for free hemoglobin',
    directAntiglobulinTestDAT: 'Negative',
    investigationOutcome: 'Febrile non-hemolytic transfusion reaction (FNHTR). Patient recovered uneventfully.',
    status: 'CLOSED_RESOLVED',
    reportedAt: '2026-08-28T16:00:00.000Z'
  }
];

export const mockQualityChecks: BloodQualityCheckDto[] = [
  {
    id: 'bqc-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    qcCode: 'QC-2026-08-029',
    equipmentName: 'Helmer Blood Bank Refrigerator #1',
    checkType: 'DAILY_TEMPERATURE_CALIBRATION',
    parameterMeasured: 'Chamber Temperature Sensor vs Calibrated Reference Probe',
    expectedStandard: '4.0°C ± 1.0°C',
    actualReading: '3.8°C',
    isPassed: true,
    technicianName: 'Samantha Ray, SBB',
    checkedAt: '2026-08-29T07:00:00.000Z'
  }
];

export const mockTemperatureLogs: BloodStorageTemperatureLogDto[] = [
  {
    id: 'btl-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    unitLocation: 'Blood Refrigerator #1 (PRBC & Whole Blood)',
    storageUnitType: 'BLOOD_BANK_REFRIGERATOR_4C',
    recordedTemperatureC: 3.8,
    targetMinC: 2.0,
    targetMaxC: 6.0,
    isExcursion: false,
    recordedAt: '2026-08-29T12:00:00.000Z'
  },
  {
    id: 'btl-002',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    unitLocation: 'Deep Freezer #2 (Plasma Storage)',
    storageUnitType: 'DEEP_FREEZER_MINUS_40C',
    recordedTemperatureC: -36.5,
    targetMinC: -40.0,
    targetMaxC: -30.0,
    isExcursion: false,
    recordedAt: '2026-08-29T12:00:00.000Z'
  }
];

export const mockDiscards: BloodDiscardRecordDto[] = [
  {
    id: 'bdr-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    discardCode: 'DISC-2026-0044',
    componentCode: 'PLT-2026-08-012',
    componentType: 'RANDOM_DONOR_PLATELETS_RDP',
    bloodGroup: 'B_NEGATIVE',
    reason: 'EXPIRATION_DATE_EXCEEDED',
    authorizedByPathologist: 'Dr. Alistair Vance, MD',
    disposalMethod: 'Autoclave sterilization & regulated biohazard incineration',
    discardedAt: '2026-08-28T18:00:00.000Z'
  }
];

export const mockBloodBankAuditTraces: BloodBankAuditTraceDto[] = [
  {
    id: 'bba-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    traceNumber: 'TRACE-BB-00881901',
    actorId: 'usr-bb-sbb',
    actorName: 'Samantha Ray, SBB',
    actorRole: 'SENIOR_BLOOD_BANK_TECHNOLOGIST',
    action: 'RELEASE_BLOOD_UNIT',
    entityType: 'BLOOD_UNIT',
    entityId: 'bdn-001',
    entityCode: 'BAG-2026-08-O-NEG-001',
    justification: 'Infectious markers non-reactive; ABO/Rh confirmed O Negative',
    ipAddress: '10.0.9.14',
    integrityHash: 'sha256-4c919a0bb009182390a',
    previousHash: 'sha256-genesis',
    newState: { status: 'RELEASED_USABLE' },
    timestamp: '2026-08-29T12:00:00.000Z'
  }
];

export const mockBloodBankOverviewMetrics: BloodBankOverviewMetricsDto = {
  totalAvailableUnits: 248,
  quarantineUnitsCount: 18,
  prbcStockCount: 120,
  plateletStockCount: 38,
  ffpStockCount: 90,
  pendingRequestsCount: 4,
  activeCrossmatchesCount: 2,
  todaysTransfusionsCount: 8,
  reactionCasesUnderReview: 0,
  criticalLowBloodGroups: ['O_NEGATIVE', 'AB_NEGATIVE']
};

export const mockBloodBankAnalytics: BloodBankAnalyticsDto = {
  inventoryByBloodGroup: [
    { group: 'O Positive', count: 74 },
    { group: 'A Positive', count: 62 },
    { group: 'B Positive', count: 58 },
    { group: 'AB Positive', count: 24 },
    { group: 'O Negative', count: 12 },
    { group: 'A Negative', count: 8 },
    { group: 'B Negative', count: 6 },
    { group: 'AB Negative', count: 4 }
  ],
  transfusionsByDepartment: [
    { department: 'Emergency & Trauma', count: 42 },
    { department: 'Operation Theatre', count: 38 },
    { department: 'Inpatient (IPD/ICU)', count: 26 },
    { department: 'Labour & Delivery', count: 14 }
  ],
  monthlyDonationTrends: [
    { month: 'May 2026', count: 180 },
    { month: 'Jun 2026', count: 210 },
    { month: 'Jul 2026', count: 235 },
    { month: 'Aug 2026', count: 258 }
  ],
  wastageReasons: [
    { reason: 'Platelet Expiry (5-day limit)', count: 8 },
    { reason: 'Hemolysis / Bag Leak', count: 2 },
    { reason: 'Seropositive Testing Discard', count: 1 }
  ]
};
