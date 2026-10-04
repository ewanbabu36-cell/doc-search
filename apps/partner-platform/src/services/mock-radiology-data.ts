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
  hodRadiologistName: '',
  chiefTechnologistName: '',
  locationDescription: 'Imaging Pavilion',
  totalModalitiesCount: 0,
  isActive: true,
  createdAt: '2026-01-10T08:00:00.000Z'
};

const now = new Date();
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000).toISOString();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();

export const mockRadiologyModalities: RadiologyModalityDto[] = [
  {
    id: 'mod-ct-01',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    modalityCode: 'CT-64-SOMATOM',
    modalityName: 'Siemens Somatom Definition 64-Slice CT',
    modalityType: 'COMPUTED_TOMOGRAPHY_CT',
    roomNumber: 'CT Suite 1 (Ground Floor - ER Direct Access)',
    manufacturerAndModel: 'Siemens Healthineers Somatom Def-64',
    aetitle: 'SOMATOM_CT01',
    ipAddress: '192.168.10.45',
    dicomPort: 104,
    status: 'AVAILABLE',
    isAvailable: true,
    createdAt: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'mod-xr-01',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    modalityCode: 'XR-DIGITAL-01',
    modalityName: 'Philips DigitalDiagnost C90 Ceiling DR',
    modalityType: 'X_RAY_DIGITAL_RADIOGRAPHY',
    roomNumber: 'X-Ray Room 1 (OPD/ER)',
    manufacturerAndModel: 'Philips Healthcare DigitalDiagnost C90',
    aetitle: 'PHILIPS_DR01',
    ipAddress: '192.168.10.46',
    dicomPort: 104,
    status: 'AVAILABLE',
    isAvailable: true,
    createdAt: '2026-01-10T08:00:00.000Z'
  }
];

export const mockRadiologyProcedureCatalog: RadiologyProcedureCatalogDto[] = [
  {
    id: 'proc-001',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    procedureCode: 'CT-HEAD-NC',
    procedureName: 'Non-Contrast Computed Tomography Head / Brain (NCCT)',
    modalityType: 'COMPUTED_TOMOGRAPHY_CT',
    bodyPart: 'Brain / Cranium',
    requiresContrast: false,
    estimatedDurationMinutes: 15,
    preparationInstructions: 'Remove all metallic jewelry and hairpins. Screen for acute trauma / GCS.',
    priceAmount: 4500,
    isActive: true,
    createdAt: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'proc-002',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    procedureCode: 'XR-CHEST-PA',
    procedureName: 'Chest Radiograph PA View (Digital X-Ray)',
    modalityType: 'X_RAY_DIGITAL_RADIOGRAPHY',
    bodyPart: 'Thorax / Lungs',
    requiresContrast: false,
    estimatedDurationMinutes: 10,
    preparationInstructions: 'Deep inspiration on exposure. Shield abdomen if female of reproductive age.',
    priceAmount: 850,
    isActive: true,
    createdAt: '2026-01-10T08:00:00.000Z'
  }
];

export const mockRadiologyProcedures = mockRadiologyProcedureCatalog;

export const mockRadiologyOrders: RadiologyOrderDto[] = [
  {
    id: 'ord-rad-001',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    orderNumber: 'RAD-2026-8812',
    patientId: 'pat-rad-01',
    patientName: 'Kamla Devi',
    patientMrn: 'MRN-2026-8812',
    encounterId: 'ee-er-101',
    orderingDoctorName: 'Dr. Marcus Vance, MD',
    orderingDepartment: 'Emergency Trauma Triage (Bay 1)',
    procedureId: 'proc-001',
    procedureName: 'Non-Contrast Computed Tomography Head / Brain (NCCT)',
    modalityType: 'COMPUTED_TOMOGRAPHY_CT',
    priority: 'STAT_EMERGENCY_IMMEDIATE',
    clinicalIndication: 'Acute Fall with Loss of Consciousness; GCS drop from 14 to 10; Left pupil dilated (Anisocoria); Rule out Acute Intracranial Hemorrhage',
    requiresContrast: false,
    status: 'IN_PROGRESS',
    orderedAt: minutesAgo(14)
  },
  {
    id: 'ord-rad-002',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    orderNumber: 'RAD-2026-9041',
    patientId: 'pat-rad-02',
    patientName: 'Ramesh Verma',
    patientMrn: 'MRN-2026-9041',
    encounterId: 'ee-er-102',
    orderingDoctorName: 'Dr. Evelyn Reed, MD',
    orderingDepartment: 'Emergency Resuscitation Bay 2',
    procedureId: 'proc-002',
    procedureName: 'Chest Radiograph PA View (Digital X-Ray)',
    modalityType: 'X_RAY_DIGITAL_RADIOGRAPHY',
    priority: 'STAT_EMERGENCY_IMMEDIATE',
    clinicalIndication: 'Sudden Pleuritic Chest Pain, Cyanosis & Desaturation to 84%; Diminished right breath sounds; Rule out Tension Pneumothorax',
    requiresContrast: false,
    status: 'IN_PROGRESS',
    orderedAt: minutesAgo(24)
  },
  {
    id: 'ord-rad-003',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    orderNumber: 'RAD-2026-9104',
    patientId: 'pat-rad-03',
    patientName: 'Vikram Malhotra',
    patientMrn: 'MRN-2026-9104',
    encounterId: 'ee-er-103',
    orderingDoctorName: 'Dr. Arthur Pendelton, MD',
    orderingDepartment: 'Orthopedic ER',
    procedureId: 'proc-002',
    procedureName: 'Right Wrist AP & Lateral Radiograph',
    modalityType: 'X_RAY_DIGITAL_RADIOGRAPHY',
    priority: 'URGENT_WITHIN_4_HOURS',
    clinicalIndication: 'FOOSH Injury; Dinner fork deformity; Assess radial inclination, volar tilt and Cobb angle',
    requiresContrast: false,
    status: 'COMPLETED',
    orderedAt: hoursAgo(1)
  }
];

export const mockRadiologyAppointments: RadiologyAppointmentDto[] = [];
export const mockRadiologyPreparationRecords: RadiologyPreparationRecordDto[] = [];

export const mockRadiologyStudies: RadiologyStudyDto[] = [
  {
    id: 'std-rad-001',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    studyInstanceUid: '1.2.840.10008.5.1.4.1.1.2.20261004.8812001',
    accessionNumber: 'ACC-CT-2026-1049',
    orderId: 'ord-rad-001',
    patientName: 'Kamla Devi',
    patientMrn: 'MRN-2026-8812',
    modalityType: 'COMPUTED_TOMOGRAPHY_CT',
    studyDescription: 'CT Head / Brain Non-Contrast (Trauma Protocol)',
    studyDateTime: minutesAgo(12),
    seriesCount: 4,
    instancesCount: 168,
    radiationDoseDlpMgyCm: 720,
    contrastAdministeredMl: 0,
    technologistName: 'Ravi Teja, R.T.(R)(CT)',
    pacsViewerUrl: '#dicom-viewer?study=1.2.840.10008.8812001',
    pacsSyncStatus: 'SYNCED',
    status: 'ACQUIRED',
    createdAt: minutesAgo(12)
  },
  {
    id: 'std-rad-002',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    studyInstanceUid: '1.2.840.10008.5.1.4.1.1.1.20261004.9041002',
    accessionNumber: 'ACC-XR-2026-9041',
    orderId: 'ord-rad-002',
    patientName: 'Ramesh Verma',
    patientMrn: 'MRN-2026-9041',
    modalityType: 'X_RAY_DIGITAL_RADIOGRAPHY',
    studyDescription: 'Chest PA Digital Radiograph',
    studyDateTime: minutesAgo(20),
    seriesCount: 1,
    instancesCount: 2,
    radiationDoseDlpMgyCm: 12,
    contrastAdministeredMl: 0,
    technologistName: 'Ravi Teja, R.T.(R)(CT)',
    pacsViewerUrl: '#dicom-viewer?study=1.2.840.10008.9041002',
    pacsSyncStatus: 'SYNCED',
    status: 'ACQUIRED',
    createdAt: minutesAgo(20)
  }
];

export const mockRadiologyReports: RadiologyReportDto[] = [
  {
    id: 'rep-rad-001',
    tenantId,
    partnerId,
    organizationId,
    branchId,
    reportNumber: 'RAD-REP-2026-0044',
    studyId: 'std-rad-001',
    orderId: 'ord-rad-001',
    patientName: 'Kamla Devi',
    patientMrn: 'MRN-2026-8812',
    modalityType: 'COMPUTED_TOMOGRAPHY_CT',
    procedureName: 'CT Head / Brain Non-Contrast',
    clinicalHistory: 'Head injury with anisocoria',
    imagingTechnique: 'Axial helical non-contrast CT from skull base to vertex',
    findings: 'Hyperdense crescent-shaped extra-axial collection (60-80 HU) measuring 14mm in maximum thickness over the right fronto-parietal convexity with 6.2mm midline shift to the left.',
    impression: 'Acute Right Fronto-Parietal Subdural Hematoma with 6.2mm subfalcine herniation shift. EMERGENCY NEUROSURGICAL EVACUATION INDICATED.',
    hasCriticalFinding: true,
    reportingRadiologistName: 'Dr. Alok Verma, MD (Senior Radiologist)',
    status: 'DRAFT',
    version: 1,
    createdAt: minutesAgo(5)
  }
];

export const mockRadiologyCriticalFindings: RadiologyCriticalFindingDto[] = [];
export const mockRadiologyQualityEvents: RadiologyQualityEventDto[] = [];
export const mockRadiologyAuditTraces: RadiologyAuditTraceDto[] = [];

export const mockRadiologyMetrics: RadiologyOverviewMetricsDto = {
  todaysOrdersCount: 14,
  pendingStudiesCount: 2,
  completedScansCount: 12,
  pendingReportsCount: 2,
  criticalFindingsCount: 1,
  modalityOnlinePercent: 100,
  averageTurnaroundMinutes: 24,
  emergencyQueueCount: 2
};

export const mockRadiologyAnalytics: RadiologyAnalyticsDto = {
  studiesByModality: [
    { modality: 'COMPUTED_TOMOGRAPHY_CT', count: 6 },
    { modality: 'X_RAY_DIGITAL_RADIOGRAPHY', count: 8 }
  ],
  reportsByRadiologist: [
    { radiologist: 'Dr. Alok Verma, MD', count: 10 },
    { radiologist: 'Dr. Neha Patel, DNB', count: 4 }
  ],
  turnaroundTimeTrendHours: [
    { date: '2026-10-01', avgHours: 0.35 },
    { date: '2026-10-02', avgHours: 0.42 },
    { date: '2026-10-03', avgHours: 0.38 },
    { date: '2026-10-04', avgHours: 0.31 }
  ],
  qualityEventsByType: [
    { type: 'MOTION_ARTIFACT', count: 1 }
  ]
};
