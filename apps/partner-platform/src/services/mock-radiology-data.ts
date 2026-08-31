import type {
  RadiologyDepartmentDto,
  RadiologyModalityDto,
  RadiologyProcedureCatalogDto,
  RadiologyOrderDto,
  RadiologyAppointmentDto,
  RadiologyPreparationRecordDto,
  RadiologyStudyDto,
  RadiologyReportDto,
  RadiologyCriticalFindingDto,
  RadiologyQualityEventDto,
  RadiologyAuditTraceDto,
  RadiologyOverviewMetricsDto,
  RadiologyAnalyticsDto
} from '@docsearch/api-contracts';

const tenantId = '11111111-1111-4111-8111-111111111111';
const partnerId = '22222222-2222-4222-8222-222222222222';
const organizationId = '33333333-3333-4333-8333-333333333333';
const branchId = '44444444-4444-4444-8444-444444444444';

export const mockRadiologyDepartment: RadiologyDepartmentDto = {
  id: 'rad-dept-001',
  tenantId,
  partnerId,
  organizationId,
  branchId,
  departmentCode: 'RAD-CENTRAL',
  departmentName: 'Department of Diagnostic & Interventional Imaging',
  hodRadiologistName: 'Dr. Evelyn Vance, MD, FACR',
  chiefTechnologistName: 'Arthur Dent, R.T.(R)(CT)(MR)',
  locationDescription: 'Imaging Pavilion, Ground Floor, Wing B',
  totalModalitiesCount: 8,
  isActive: true,
  createdAt: '2026-01-10T08:00:00.000Z'
};

export const mockRadiologyModalities: RadiologyModalityDto[] = [
  {
    id: 'mod-001',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    modalityCode: 'CT-SCANNER-01',
    modalityName: 'Siemens SOMATOM Force 128-Slice Dual Source CT',
    modalityType: 'COMPUTED_TOMOGRAPHY_CT',
    roomNumber: 'Room B-101 (CT Suite 1)',
    manufacturerAndModel: 'Siemens SOMATOM Force',
    aetitle: 'CT_FORCE_01',
    ipAddress: '192.168.10.101',
    dicomPort: 104,
    status: 'AVAILABLE',
    isAvailable: true,
    lastCalibrationDate: '2026-08-20T06:00:00.000Z',
    createdAt: '2026-01-15T09:00:00.000Z'
  },
  {
    id: 'mod-002',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    modalityCode: 'MRI-3T-01',
    modalityName: 'GE SIGNA Premier 3.0T High-Field MRI',
    modalityType: 'MAGNETIC_RESONANCE_IMAGING_MRI',
    roomNumber: 'Room B-104 (MRI Suite Alpha)',
    manufacturerAndModel: 'GE Healthcare SIGNA Premier 3.0T',
    aetitle: 'MRI_SIGNA_3T',
    ipAddress: '192.168.10.104',
    dicomPort: 104,
    status: 'BUSY',
    isAvailable: false,
    lastCalibrationDate: '2026-08-15T07:30:00.000Z',
    createdAt: '2026-01-15T09:30:00.000Z'
  },
  {
    id: 'mod-003',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    modalityCode: 'DR-XRAY-01',
    modalityName: 'Canon CXDI Digital Radiography Floor Stand',
    modalityType: 'X_RAY_DIGITAL_RADIOGRAPHY',
    roomNumber: 'Room B-108 (X-Ray Bay 1)',
    manufacturerAndModel: 'Canon CXDI-710C',
    aetitle: 'XRAY_CANON_01',
    ipAddress: '192.168.10.108',
    dicomPort: 104,
    status: 'AVAILABLE',
    isAvailable: true,
    lastCalibrationDate: '2026-08-25T05:00:00.000Z',
    createdAt: '2026-01-15T10:00:00.000Z'
  },
  {
    id: 'mod-004',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    modalityCode: 'USG-DOPPLER-01',
    modalityName: 'Philips EPIQ Elite Premium Ultrasound System',
    modalityType: 'ULTRASOUND_SONOGRAPHY_USG',
    roomNumber: 'Room B-112 (Ultrasound Suite 1)',
    manufacturerAndModel: 'Philips EPIQ Elite',
    aetitle: 'USG_EPIQ_01',
    ipAddress: '192.168.10.112',
    dicomPort: 104,
    status: 'AVAILABLE',
    isAvailable: true,
    lastCalibrationDate: '2026-08-28T08:00:00.000Z',
    createdAt: '2026-01-15T10:30:00.000Z'
  },
  {
    id: 'mod-005',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    modalityCode: 'MAMMO-3D-01',
    modalityName: 'Hologic Selenia Dimensions 3D Tomosynthesis',
    modalityType: 'MAMMOGRAPHY_DIGITAL',
    roomNumber: 'Room B-115 (Women Imaging Center)',
    manufacturerAndModel: 'Hologic Selenia Dimensions',
    aetitle: 'MAMMO_HOLOGIC_01',
    ipAddress: '192.168.10.115',
    dicomPort: 104,
    status: 'AVAILABLE',
    isAvailable: true,
    lastCalibrationDate: '2026-08-22T06:00:00.000Z',
    createdAt: '2026-01-15T11:00:00.000Z'
  },
  {
    id: 'mod-006',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    modalityCode: 'PORTABLE-XRAY-ED',
    modalityName: 'Carestream DRX-Revolution Mobile X-Ray',
    modalityType: 'PORTABLE_BEDSIDE_X_RAY',
    roomNumber: 'Mobile Unit (Emergency & ICU Dispatch)',
    manufacturerAndModel: 'Carestream DRX-Revolution',
    aetitle: 'MOB_CARESTREAM_01',
    ipAddress: '192.168.10.201',
    dicomPort: 104,
    status: 'AVAILABLE',
    isAvailable: true,
    lastCalibrationDate: '2026-08-27T04:00:00.000Z',
    createdAt: '2026-01-15T11:30:00.000Z'
  }
];

export const mockRadiologyProcedures: RadiologyProcedureCatalogDto[] = [
  {
    id: 'proc-001',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    procedureCode: 'CT-CHEST-CON',
    procedureName: 'CT Chest with IV Contrast',
    modalityType: 'COMPUTED_TOMOGRAPHY_CT',
    bodyPart: 'Thorax / Chest',
    requiresContrast: true,
    estimatedDurationMinutes: 20,
    preparationInstructions: 'NPO 4 hours prior. Check serum creatinine/eGFR within 30 days. IV cannula 20G.',
    cptCodeReference: '71260',
    priceAmount: 650.00,
    isActive: true,
    createdAt: '2026-01-20T08:00:00.000Z'
  },
  {
    id: 'proc-002',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    procedureCode: 'MRI-BRAIN-W-WO',
    procedureName: 'MRI Brain with and without IV Gadolinium Contrast',
    modalityType: 'MAGNETIC_RESONANCE_IMAGING_MRI',
    bodyPart: 'Head / Brain',
    requiresContrast: true,
    estimatedDurationMinutes: 45,
    preparationInstructions: 'Complete MRI metal screening. Remove all metallic items. Verify renal eGFR > 30.',
    cptCodeReference: '70553',
    priceAmount: 1100.00,
    isActive: true,
    createdAt: '2026-01-20T08:30:00.000Z'
  },
  {
    id: 'proc-003',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    procedureCode: 'XR-CHEST-PA-LAT',
    procedureName: 'X-Ray Chest PA and Lateral 2 Views',
    modalityType: 'X_RAY_DIGITAL_RADIOGRAPHY',
    bodyPart: 'Thorax / Chest',
    requiresContrast: false,
    estimatedDurationMinutes: 10,
    preparationInstructions: 'Remove metallic necklace/jewelry from chest area. Deep inspiratory breath-hold.',
    cptCodeReference: '71046',
    priceAmount: 120.00,
    isActive: true,
    createdAt: '2026-01-20T09:00:00.000Z'
  },
  {
    id: 'proc-004',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    procedureCode: 'USG-ABDOMEN-PELVIS',
    procedureName: 'Ultrasound Whole Abdomen and Pelvis',
    modalityType: 'ULTRASOUND_SONOGRAPHY_USG',
    bodyPart: 'Abdomen & Pelvis',
    requiresContrast: false,
    estimatedDurationMinutes: 30,
    preparationInstructions: 'Fast 6 hours prior to exam. Drink 1L water 1 hour prior to maintain full bladder.',
    cptCodeReference: '76700',
    priceAmount: 250.00,
    isActive: true,
    createdAt: '2026-01-20T09:30:00.000Z'
  },
  {
    id: 'proc-005',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    procedureCode: 'CT-ANGIO-PULM',
    procedureName: 'CT Angiography Pulmonary Arteries (PE Protocol)',
    modalityType: 'COMPUTED_TOMOGRAPHY_CT',
    bodyPart: 'Pulmonary Vascular Bed',
    requiresContrast: true,
    estimatedDurationMinutes: 15,
    preparationInstructions: 'STAT PE protocol. Rapid bolus IV contrast injection via 18G/20G power-injectable port.',
    cptCodeReference: '71275',
    priceAmount: 850.00,
    isActive: true,
    createdAt: '2026-01-20T10:00:00.000Z'
  }
];

export const mockRadiologyOrders: RadiologyOrderDto[] = [
  {
    id: 'ro-001',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    orderNumber: 'RO-2026-000841',
    patientId: 'pat-101',
    patientName: 'Eleanor Vance',
    patientMrn: 'MRN-782910',
    encounterId: 'enc-201',
    orderingDoctorName: 'Dr. Gregory House, MD',
    orderingDepartment: 'Emergency Department (Trauma)',
    procedureId: 'proc-005',
    procedureName: 'CT Angiography Pulmonary Arteries (PE Protocol)',
    modalityType: 'COMPUTED_TOMOGRAPHY_CT',
    priority: 'STAT_EMERGENCY_IMMEDIATE',
    clinicalIndication: 'Acute sudden pleuritic chest pain, tachypnea, tachycardia (HR 128), D-dimer elevated at 4.2 ug/mL.',
    requiresContrast: true,
    pregnancyScreeningResult: 'NEGATIVE',
    renalEgfrResult: '88 mL/min/1.73m2 (Normal)',
    knownAllergies: 'NKDA',
    status: 'COMPLETED',
    scheduledTime: '2026-08-29T10:15:00.000Z',
    orderedAt: '2026-08-29T10:00:00.000Z'
  },
  {
    id: 'ro-002',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    orderNumber: 'RO-2026-000842',
    patientId: 'pat-102',
    patientName: 'Robert Martinez',
    patientMrn: 'MRN-782911',
    encounterId: 'enc-202',
    orderingDoctorName: 'Dr. Meredith Grey, MD',
    orderingDepartment: 'Inpatient Medicine (Ward 3B)',
    procedureId: 'proc-002',
    procedureName: 'MRI Brain with and without IV Gadolinium Contrast',
    modalityType: 'MAGNETIC_RESONANCE_IMAGING_MRI',
    priority: 'URGENT_WITHIN_4_HOURS',
    clinicalIndication: 'Progressive left-sided weakness, cranial nerve VI palsy, rule out demyelinating disease vs SOL.',
    requiresContrast: true,
    pregnancyScreeningResult: 'N/A (Male)',
    renalEgfrResult: '74 mL/min/1.73m2',
    knownAllergies: 'Penicillin (Rash)',
    status: 'IN_PROGRESS',
    scheduledTime: '2026-08-29T11:00:00.000Z',
    orderedAt: '2026-08-29T09:15:00.000Z'
  },
  {
    id: 'ro-003',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    orderNumber: 'RO-2026-000843',
    patientId: 'pat-103',
    patientName: 'Clara Oswald',
    patientMrn: 'MRN-782912',
    encounterId: 'enc-203',
    orderingDoctorName: 'Dr. John Watson, MD',
    orderingDepartment: 'Outpatient Pulmonary Clinic',
    procedureId: 'proc-003',
    procedureName: 'X-Ray Chest PA and Lateral 2 Views',
    modalityType: 'X_RAY_DIGITAL_RADIOGRAPHY',
    priority: 'ROUTINE_ELECTIVE',
    clinicalIndication: 'Chronic productive cough for 3 weeks, low-grade fever, assess for consolidation or infiltrates.',
    requiresContrast: false,
    pregnancyScreeningResult: 'NEGATIVE',
    knownAllergies: 'NKDA',
    status: 'SCHEDULED',
    scheduledTime: '2026-08-29T14:30:00.000Z',
    orderedAt: '2026-08-29T08:30:00.000Z'
  }
];

export const mockRadiologyAppointments: RadiologyAppointmentDto[] = [
  {
    id: 'app-001',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    appointmentCode: 'APT-RAD-2026-0041',
    orderId: 'ro-001',
    patientName: 'Eleanor Vance',
    patientMrn: 'MRN-782910',
    modalityId: 'mod-001',
    modalityName: 'Siemens SOMATOM Force 128-Slice Dual Source CT',
    roomNumber: 'Room B-101 (CT Suite 1)',
    scheduledStart: '2026-08-29T10:15:00.000Z',
    scheduledEnd: '2026-08-29T10:35:00.000Z',
    assignedTechnologistName: 'Arthur Dent, R.T.(R)(CT)',
    status: 'COMPLETED',
    notes: 'Emergency STAT protocol executed smoothly with IV Omnipaque 350.',
    createdAt: '2026-08-29T10:05:00.000Z'
  },
  {
    id: 'app-002',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    appointmentCode: 'APT-RAD-2026-0042',
    orderId: 'ro-002',
    patientName: 'Robert Martinez',
    patientMrn: 'MRN-782911',
    modalityId: 'mod-002',
    modalityName: 'GE SIGNA Premier 3.0T High-Field MRI',
    roomNumber: 'Room B-104 (MRI Suite Alpha)',
    scheduledStart: '2026-08-29T11:00:00.000Z',
    scheduledEnd: '2026-08-29T11:45:00.000Z',
    assignedTechnologistName: 'Sarah Connor, R.T.(R)(MR)',
    status: 'IN_PROGRESS',
    notes: 'Patient positioned with head coil. T1, T2, FLAIR sequences running.',
    createdAt: '2026-08-29T09:30:00.000Z'
  }
];

export const mockRadiologyPreparationRecords: RadiologyPreparationRecordDto[] = [
  {
    id: 'prep-001',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    preparationCode: 'PREP-2026-0019',
    orderId: 'ro-001',
    patientName: 'Eleanor Vance',
    fastingConfirmed: true,
    mriMetalScreeningCleared: true,
    pregnancyStatusConfirmedNegative: true,
    renalEgfrAdequate: true,
    ivCannulaSecured: true,
    informedConsentSigned: true,
    preparationNurseName: 'Nurse Clara Oswald, RN',
    isReadyForScan: true,
    checkedAt: '2026-08-29T10:10:00.000Z'
  },
  {
    id: 'prep-002',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    preparationCode: 'PREP-2026-0020',
    orderId: 'ro-002',
    patientName: 'Robert Martinez',
    fastingConfirmed: true,
    mriMetalScreeningCleared: true,
    pregnancyStatusConfirmedNegative: true,
    renalEgfrAdequate: true,
    ivCannulaSecured: true,
    informedConsentSigned: true,
    preparationNurseName: 'Nurse Donna Noble, RN',
    isReadyForScan: true,
    checkedAt: '2026-08-29T10:45:00.000Z'
  }
];

export const mockRadiologyStudies: RadiologyStudyDto[] = [
  {
    id: 'study-001',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    studyInstanceUid: '1.2.840.113619.2.55.3.604688320.20260829.102500',
    accessionNumber: 'ACC-2026-00892',
    orderId: 'ro-001',
    patientName: 'Eleanor Vance',
    patientMrn: 'MRN-782910',
    modalityType: 'COMPUTED_TOMOGRAPHY_CT',
    studyDescription: 'CT Angiography Chest Pulmonary Embolism Protocol',
    studyDateTime: '2026-08-29T10:25:00.000Z',
    seriesCount: 4,
    instancesCount: 480,
    radiationDoseDlpMgyCm: 420.5,
    contrastAdministeredMl: 75.0,
    technologistName: 'Arthur Dent, R.T.(R)(CT)',
    pacsViewerUrl: 'https://pacs.docsearch.internal/viewer?study=1.2.840.113619.2.55.3.604688320.20260829.102500',
    pacsSyncStatus: 'SYNCED',
    status: 'REPORTED',
    createdAt: '2026-08-29T10:30:00.000Z'
  }
];

export const mockRadiologyReports: RadiologyReportDto[] = [
  {
    id: 'rep-001',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    reportNumber: 'REP-RAD-2026-00310',
    studyId: 'study-001',
    orderId: 'ro-001',
    patientName: 'Eleanor Vance',
    patientMrn: 'MRN-782910',
    modalityType: 'COMPUTED_TOMOGRAPHY_CT',
    procedureName: 'CT Angiography Pulmonary Arteries (PE Protocol)',
    clinicalHistory: '34-year-old female with acute severe pleuritic chest pain and tachycardia.',
    imagingTechnique: 'Helical CT imaging of the thorax performed from lung apices to adrenal glands following IV administration of 75 mL Omnipaque 350 utilizing bolus-tracking over main pulmonary artery.',
    comparisonStudyReference: 'Chest X-Ray 2026-08-15 (Normal).',
    findings: 'CRITICAL: Acute occlusive filling defect identified in the right main pulmonary artery extending into the right lower lobe interlobar branch. Moderate right ventricular strain noted with RV/LV ratio of 1.3. Left pulmonary arterial tree remains patent. No aortic dissection or pneumothorax.',
    impression: '1. ACUTE RIGHT MAIN PULMONARY EMBOLISM with right ventricular strain criteria.\n2. Urgent clinical notification delivered to Emergency Department attending physician.',
    recommendations: 'Immediate therapeutic anticoagulation / systemic thrombolytic or catheter-directed intervention consult.',
    hasCriticalFinding: true,
    reportingRadiologistName: 'Dr. Evelyn Vance, MD, FACR',
    verifyingRadiologistName: 'Dr. Evelyn Vance, MD, FACR',
    status: 'FINALIZED',
    version: 1,
    finalizedAt: '2026-08-29T10:55:00.000Z',
    createdAt: '2026-08-29T10:45:00.000Z'
  }
];

export const mockRadiologyCriticalFindings: RadiologyCriticalFindingDto[] = [
  {
    id: 'cf-001',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    alertCode: 'CRIT-RAD-2026-0014',
    reportId: 'rep-001',
    patientName: 'Eleanor Vance',
    patientMrn: 'MRN-782910',
    orderingDoctorName: 'Dr. Gregory House, MD',
    orderingDepartment: 'Emergency Department (Trauma)',
    findingDescription: 'Acute Occlusive Right Main Pulmonary Embolism with RV strain (RV/LV ratio 1.3)',
    severity: 'CRITICAL_IMMEDIATE_LIFE_THREATENING',
    flaggedByRadiologist: 'Dr. Evelyn Vance, MD, FACR',
    notifiedRecipient: 'Dr. Gregory House, MD (ED Attending)',
    acknowledgedBy: 'Dr. Gregory House, MD',
    acknowledgedTimestamp: '2026-08-29T11:02:00.000Z',
    status: 'ACKNOWLEDGED_BY_CLINICIAN',
    createdAt: '2026-08-29T10:56:00.000Z'
  }
];

export const mockRadiologyQualityEvents: RadiologyQualityEventDto[] = [
  {
    id: 'qe-001',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    eventCode: 'QE-RAD-2026-0008',
    studyId: 'study-001',
    modalityType: 'COMPUTED_TOMOGRAPHY_CT',
    eventType: 'MOTION_ARTIFACT',
    reasonDescription: 'Slight tachypneic motion on scout image prior to contrast injection. Patient reinstructed on breath-holding.',
    technologistName: 'Arthur Dent, R.T.(R)(CT)',
    correctiveActionTaken: 'Repeated non-contrast topogram with verified adequate inspiration before bolus trigger.',
    recordedAt: '2026-08-29T10:20:00.000Z'
  }
];

export const mockRadiologyAuditTraces: RadiologyAuditTraceDto[] = [
  {
    id: 'at-rad-001',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    traceNumber: 'TRACE-RAD-92817401',
    actorId: 'usr-dr-vance',
    actorName: 'Dr. Evelyn Vance, MD',
    actorRole: 'Radiologist',
    action: 'FINALIZED_AND_FLAGGED_CRITICAL',
    entityType: 'RADIOLOGY_REPORT',
    entityId: 'rep-001',
    entityCode: 'REP-RAD-2026-00310',
    justification: 'Finalized CT Pulmonary Angiogram report with critical PE finding and direct phone notification.',
    ipAddress: '192.168.10.45',
    integrityHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
    newState: { reportNumber: 'REP-RAD-2026-00310', status: 'FINALIZED', critical: true },
    timestamp: '2026-08-29T10:55:00.000Z'
  }
];

export const mockRadiologyMetrics: RadiologyOverviewMetricsDto = {
  todaysOrdersCount: 42,
  pendingStudiesCount: 6,
  completedScansCount: 36,
  pendingReportsCount: 4,
  criticalFindingsCount: 1,
  modalityOnlinePercent: 98.5,
  averageTurnaroundMinutes: 34.2,
  emergencyQueueCount: 2
};

export const mockRadiologyAnalytics: RadiologyAnalyticsDto = {
  studiesByModality: [
    { modality: 'CT', count: 18 },
    { modality: 'MRI', count: 12 },
    { modality: 'X-Ray', count: 48 },
    { modality: 'Ultrasound', count: 24 },
    { modality: 'Mammography', count: 8 }
  ],
  reportsByRadiologist: [
    { radiologist: 'Dr. Evelyn Vance, MD', count: 26 },
    { radiologist: 'Dr. Marcus Brody, MD', count: 22 },
    { radiologist: 'Dr. Aris Thorne, MD', count: 19 }
  ],
  turnaroundTimeTrendHours: [
    { date: '2026-08-25', avgHours: 0.8 },
    { date: '2026-08-26', avgHours: 0.7 },
    { date: '2026-08-27', avgHours: 0.6 },
    { date: '2026-08-28', avgHours: 0.55 },
    { date: '2026-08-29', avgHours: 0.52 }
  ],
  qualityEventsByType: [
    { type: 'Motion Artifact', count: 3 },
    { type: 'Repeat Exposure', count: 2 },
    { type: 'Protocol Deviation', count: 1 }
  ]
};
