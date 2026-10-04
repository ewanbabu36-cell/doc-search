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
  facilityName: 'Blood Bank & Transfusion Medicine Unit',
  licenseNumber: 'FDA-BB-LIC-2026/8892',
  medicalDirectorName: '',
  headTechnologistName: '',
  storageLocationName: 'Blood Bank Suite',
  totalAvailableUnits: 0,
  quarantineUnits: 0,
  isActive: true,
  createdAt: '2026-08-01T08:00:00.000Z',
  updatedAt: '2026-08-01T08:00:00.000Z'
};

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000).toISOString();
const hoursAhead = (h: number) => new Date(now.getTime() + h * 3600 * 1000).toISOString();
const daysAhead = (d: number) => new Date(now.getTime() + d * 86400 * 1000).toISOString();

export const mockBloodDonors: BloodDonorDto[] = [
  {
    id: 'bd-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    donorCode: 'DNR-9901',
    fullName: 'Rahul Sharma',
    dateOfBirth: '1992-05-14',
    gender: 'MALE',
    bloodGroup: 'O_POSITIVE',
    contactNumber: '+91 98110 44210',
    email: 'rahul.sharma@example.com',
    donorType: 'VOLUNTARY_NON_REMUNERATED',
    eligibilityStatus: 'ELIGIBLE_FOR_DONATION',
    totalDonationsCount: 6,
    lastDonationDate: hoursAgo(2160),
    nextEligibleDate: daysAhead(60),
    createdAt: '2024-01-10T10:00:00.000Z'
  },
  {
    id: 'bd-002',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    donorCode: 'DNR-9902',
    fullName: 'Ananya Deshmukh',
    dateOfBirth: '1996-11-20',
    gender: 'FEMALE',
    bloodGroup: 'A_POSITIVE',
    contactNumber: '+91 97200 88123',
    email: 'ananya.d@example.com',
    donorType: 'VOLUNTARY_NON_REMUNERATED',
    eligibilityStatus: 'ELIGIBLE_FOR_DONATION',
    totalDonationsCount: 4,
    lastDonationDate: hoursAgo(1440),
    nextEligibleDate: daysAhead(45),
    createdAt: '2024-03-15T11:30:00.000Z'
  }
];

export const mockDonorScreenings: BloodDonorScreeningDto[] = [];

export const mockBloodDonations: BloodDonationDto[] = [];

export const mockBloodTests: BloodTestRecordDto[] = [];

export const mockBloodComponents: BloodComponentDto[] = [
  {
    id: 'bc-prbc-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    componentCode: 'PRBC-2026-08-001',
    donationId: 'bdn-001',
    componentType: 'PACKED_RED_BLOOD_CELLS_PRBC',
    bloodGroup: 'O_NEGATIVE',
    volumeMl: 280,
    storageLocation: 'Blood Refrigerator #1 (Shelf A)',
    storageTemperatureTargetC: '2°C to 6°C',
    expiryDate: daysAhead(32),
    status: 'ISSUED_TO_DEPARTMENT',
    preparedByTechnician: 'Samantha Ray, SBB',
    releasedByPathologist: 'Dr. Evelyn Reed, MD',
    createdAt: hoursAgo(72)
  },
  {
    id: 'bc-prbc-002',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    componentCode: 'PRBC-2026-08-002',
    donationId: 'bdn-002',
    componentType: 'PACKED_RED_BLOOD_CELLS_PRBC',
    bloodGroup: 'O_POSITIVE',
    volumeMl: 300,
    storageLocation: 'Blood Refrigerator #1 (Shelf B)',
    storageTemperatureTargetC: '2°C to 6°C',
    expiryDate: daysAhead(28),
    status: 'RELEASED_USABLE',
    preparedByTechnician: 'Samantha Ray, SBB',
    releasedByPathologist: 'Dr. Evelyn Reed, MD',
    createdAt: hoursAgo(96)
  },
  {
    id: 'bc-prbc-003',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    componentCode: 'PRBC-2026-08-003',
    donationId: 'bdn-003',
    componentType: 'PACKED_RED_BLOOD_CELLS_PRBC',
    bloodGroup: 'A_POSITIVE',
    volumeMl: 290,
    storageLocation: 'Blood Refrigerator #2 (Shelf A)',
    storageTemperatureTargetC: '2°C to 6°C',
    expiryDate: daysAhead(30),
    status: 'RELEASED_USABLE',
    preparedByTechnician: 'Samantha Ray, SBB',
    releasedByPathologist: 'Dr. Evelyn Reed, MD',
    createdAt: hoursAgo(80)
  },
  {
    id: 'bc-prbc-004',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    componentCode: 'PRBC-2026-08-004',
    donationId: 'bdn-004',
    componentType: 'PACKED_RED_BLOOD_CELLS_PRBC',
    bloodGroup: 'B_POSITIVE',
    volumeMl: 310,
    storageLocation: 'Blood Refrigerator #2 (Shelf B)',
    storageTemperatureTargetC: '2°C to 6°C',
    expiryDate: daysAhead(25),
    status: 'RELEASED_USABLE',
    preparedByTechnician: 'Samantha Ray, SBB',
    releasedByPathologist: 'Dr. Evelyn Reed, MD',
    createdAt: hoursAgo(100)
  },
  {
    id: 'bc-sdp-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    componentCode: 'SDP-2026-09-001',
    donationId: 'bdn-005',
    componentType: 'SINGLE_DONOR_PLATELETS_SDP',
    bloodGroup: 'A_POSITIVE',
    volumeMl: 250,
    storageLocation: 'Flatbed Agitator Shaker #1',
    storageTemperatureTargetC: '20°C to 24°C',
    expiryDate: hoursAhead(16),
    status: 'RELEASED_USABLE',
    preparedByTechnician: 'Samantha Ray, SBB',
    releasedByPathologist: 'Dr. Evelyn Reed, MD',
    createdAt: hoursAgo(104)
  },
  {
    id: 'bc-sdp-002',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    componentCode: 'SDP-2026-09-002',
    donationId: 'bdn-006',
    componentType: 'SINGLE_DONOR_PLATELETS_SDP',
    bloodGroup: 'O_POSITIVE',
    volumeMl: 260,
    storageLocation: 'Flatbed Agitator Shaker #1',
    storageTemperatureTargetC: '20°C to 24°C',
    expiryDate: hoursAhead(38),
    status: 'RELEASED_USABLE',
    preparedByTechnician: 'Samantha Ray, SBB',
    releasedByPathologist: 'Dr. Evelyn Reed, MD',
    createdAt: hoursAgo(82)
  },
  {
    id: 'bc-rdp-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    componentCode: 'RDP-2026-09-008',
    donationId: 'bdn-007',
    componentType: 'RANDOM_DONOR_PLATELETS_RDP',
    bloodGroup: 'B_POSITIVE',
    volumeMl: 65,
    storageLocation: 'Flatbed Agitator Shaker #2',
    storageTemperatureTargetC: '20°C to 24°C',
    expiryDate: hoursAhead(70),
    status: 'RELEASED_USABLE',
    preparedByTechnician: 'Samantha Ray, SBB',
    releasedByPathologist: 'Dr. Evelyn Reed, MD',
    createdAt: hoursAgo(50)
  },
  {
    id: 'bc-ffp-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    componentCode: 'FFP-2026-08-012',
    donationId: 'bdn-008',
    componentType: 'FRESH_FROZEN_PLASMA_FFP',
    bloodGroup: 'AB_POSITIVE',
    volumeMl: 220,
    storageLocation: 'Plasma Deep Freezer -40°C',
    storageTemperatureTargetC: '-30°C to -40°C',
    expiryDate: daysAhead(310),
    status: 'RELEASED_USABLE',
    preparedByTechnician: 'Samantha Ray, SBB',
    releasedByPathologist: 'Dr. Evelyn Reed, MD',
    createdAt: hoursAgo(200)
  }
];

export const mockBloodRequests: BloodRequestDto[] = [
  {
    id: 'breq-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    requestCode: 'REQ-882101',
    patientId: 'pat-001',
    patientName: 'David K. Miller',
    patientMrn: 'MRN-772101',
    encounterId: 'ee-001',
    requestingDepartment: 'Emergency Resuscitation Bay 1',
    orderingPhysicianName: 'Dr. Marcus Vance, MD',
    requestedComponentType: 'PACKED_RED_BLOOD_CELLS_PRBC',
    patientBloodGroup: 'O_NEGATIVE',
    quantityUnits: 2,
    urgency: 'STAT_EMERGENCY_IMMEDIATE',
    clinicalIndication: 'Severe Hemorrhagic Shock secondary to Polytrauma; Hemoglobin 5.2 g/dL',
    requiredByTimestamp: hoursAhead(1),
    status: 'COMPLETED',
    requestedAt: minutesAgo(40)
  },
  {
    id: 'breq-002',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    requestCode: 'REQ-882102',
    patientId: 'pat-002',
    patientName: 'Priya Sharma',
    patientMrn: 'MRN-882041',
    encounterId: 'ee-002',
    requestingDepartment: 'Hemato-Oncology Ward (Bed 402)',
    orderingPhysicianName: 'Dr. Sunita Kapoor, MD',
    requestedComponentType: 'SINGLE_DONOR_PLATELETS_SDP',
    patientBloodGroup: 'A_POSITIVE',
    quantityUnits: 1,
    urgency: 'URGENT_WITHIN_2_HOURS',
    clinicalIndication: 'AML Induction Chemotherapy Nadir; Platelet count 9,000/µL with active epistaxis',
    requiredByTimestamp: hoursAhead(2),
    status: 'PENDING_CROSSMATCH',
    requestedAt: minutesAgo(25)
  }
];

export const mockCrossmatches: BloodCrossmatchDto[] = [
  {
    id: 'xm-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    crossmatchCode: 'XM-2026-901',
    requestId: 'breq-001',
    componentId: 'bc-prbc-001',
    componentCode: 'PRBC-2026-08-001',
    patientName: 'David K. Miller',
    patientBloodGroup: 'O_NEGATIVE',
    donorBloodGroup: 'O_NEGATIVE',
    majorCrossmatchResult: 'COMPATIBLE',
    minorCrossmatchResult: 'COMPATIBLE',
    coombsTestResult: 'NEGATIVE',
    overallResult: 'COMPATIBLE',
    testingTechnicianName: 'Samantha Ray, SBB',
    verifiedByPathologist: 'Dr. Evelyn Reed, MD',
    crossmatchedAt: minutesAgo(35),
    expiresAt: hoursAhead(48)
  }
];

export const mockBloodIssues: BloodIssueDto[] = [
  {
    id: 'bi-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    issueCode: 'ISS-9011',
    requestId: 'breq-001',
    componentId: 'bc-prbc-001',
    componentCode: 'PRBC-2026-08-001',
    patientName: 'David K. Miller',
    patientMrn: 'MRN-772101',
    destinationDepartment: 'Emergency Resuscitation Bay 1',
    issuingTechnicianName: 'Samantha Ray, SBB',
    receivingNurseName: 'Nurse Mark Hopkins, RN',
    transportBoxTemperatureC: '4.2°C',
    issuedAt: minutesAgo(14)
  },
  {
    id: 'bi-002',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    issueCode: 'ISS-9012',
    requestId: 'breq-002',
    componentId: 'bc-sdp-001',
    componentCode: 'SDP-2026-09-001',
    patientName: 'Priya Sharma',
    patientMrn: 'MRN-882041',
    destinationDepartment: 'Hemato-Oncology Ward (Bed 402)',
    issuingTechnicianName: 'Samantha Ray, SBB',
    receivingNurseName: 'Nurse Sunita James, RN',
    transportBoxTemperatureC: '21.5°C',
    issuedAt: minutesAgo(27)
  }
];

export const mockTransfusions: TransfusionRecordDto[] = [
  {
    id: 'tr-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    transfusionCode: 'TXF-88101',
    patientName: 'David K. Miller',
    patientMrn: 'MRN-772101',
    encounterId: 'ee-001',
    componentCode: 'PRBC-2026-08-001',
    componentType: 'PACKED_RED_BLOOD_CELLS_PRBC',
    bloodGroup: 'O_NEGATIVE',
    administeredByNurse: 'Nurse Mark Hopkins, RN',
    supervisingDoctorName: 'Dr. Marcus Vance, MD',
    startTime: minutesAgo(8),
    preTransfusionPulse: 114,
    preTransfusionBp: '90/58',
    preTransfusionTempF: 98.4,
    adverseReactionNoted: false,
    status: 'IN_PROGRESS'
  },
  {
    id: 'tr-002',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    transfusionCode: 'TXF-88099',
    patientName: 'Sunita Rao',
    patientMrn: 'MRN-442110',
    encounterId: 'ee-003',
    componentCode: 'FFP-2026-08-012',
    componentType: 'FRESH_FROZEN_PLASMA_FFP',
    bloodGroup: 'AB_POSITIVE',
    administeredByNurse: 'Nurse Rita Sen, RN',
    supervisingDoctorName: 'Dr. Evelyn Reed, MD',
    startTime: hoursAgo(3),
    endTime: hoursAgo(1),
    preTransfusionPulse: 78,
    preTransfusionBp: '120/80',
    preTransfusionTempF: 98.6,
    postTransfusionPulse: 80,
    postTransfusionBp: '122/82',
    postTransfusionTempF: 98.7,
    adverseReactionNoted: false,
    status: 'COMPLETED_UNEVENTFUL',
    outcomeNotes: 'Transfusion completed uneventfully; coagulopathy corrected.'
  }
];

export const mockReactions: TransfusionReactionDto[] = [];

export const mockQualityChecks: BloodQualityCheckDto[] = [];

export const mockTemperatureLogs: BloodStorageTemperatureLogDto[] = [];

export const mockDiscards: BloodDiscardRecordDto[] = [];

export const mockBloodBankAuditTraces: BloodBankAuditTraceDto[] = [];

export const mockBloodBankOverviewMetrics: BloodBankOverviewMetricsDto = {
  totalAvailableUnits: 8,
  quarantineUnitsCount: 1,
  prbcStockCount: 4,
  plateletStockCount: 3,
  ffpStockCount: 1,
  pendingRequestsCount: 1,
  activeCrossmatchesCount: 1,
  todaysTransfusionsCount: 2,
  reactionCasesUnderReview: 0,
  criticalLowBloodGroups: ['O_NEGATIVE', 'AB_NEGATIVE']
};

export const mockBloodBankAnalytics: BloodBankAnalyticsDto = {
  inventoryByBloodGroup: [
    { group: 'O_POSITIVE', count: 2 },
    { group: 'O_NEGATIVE', count: 1 },
    { group: 'A_POSITIVE', count: 2 },
    { group: 'B_POSITIVE', count: 2 },
    { group: 'AB_POSITIVE', count: 1 }
  ],
  transfusionsByDepartment: [
    { department: 'Emergency Resuscitation', count: 14 },
    { department: 'Hemato-Oncology', count: 9 },
    { department: 'Operation Theatre', count: 8 },
    { department: 'Medical ICU', count: 5 }
  ],
  monthlyDonationTrends: [
    { month: 'June', count: 42 },
    { month: 'July', count: 58 },
    { month: 'August', count: 64 },
    { month: 'September', count: 71 }
  ],
  wastageReasons: [
    { reason: 'Platelet Shelf-Life Expiry (5 days)', count: 3 },
    { reason: 'Broken Cold-Chain (>30m Bedside Delay)', count: 1 }
  ]
};
