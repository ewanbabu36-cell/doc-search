import type {
  QualityStandardDto,
  HospitalIncidentDto,
  IncidentRcaDto,
  QualityCapaDto,
  HaiSurveillanceDto,
  HaiDeviceDaysDto,
  PatientIsolationDto,
  HandHygieneAuditDto,
  EnvironmentalMicroSwabDto,
  NeedleStickOccupationalLogDto,
  BiomedicalWasteLogDto,
  QualityOverviewMetricsDto,
  QualityAuditTraceDto
} from '@docsearch/api-contracts';

const TENANT_ID = '11111111-1111-4111-8111-111111111111';

export const mockQualityStandards: QualityStandardDto[] = [
  {
    id: 'f1000000-0000-0000-0000-000000000001',
    tenantId: TENANT_ID,
    chapter: 'HIC_HOSPITAL_INFECTION_CONTROL',
    standardCode: 'HIC.1',
    standardTitle: 'Infection Prevention and Control Program',
    description: 'The hospital has a comprehensive and multidisciplinary infection control program with trained surveillance team.',
    measurableElementsCount: 8,
    complianceScorePct: 96.0,
    status: 'FULLY_COMPLIANT',
    assignedLead: 'Dr. Sunita Deshmukh (Microbiologist & HICC Chair)',
    lastAuditDate: '2026-09-15'
  },
  {
    id: 'f1000000-0000-0000-0000-000000000002',
    tenantId: TENANT_ID,
    chapter: 'HIC_HOSPITAL_INFECTION_CONTROL',
    standardCode: 'HIC.3',
    standardTitle: 'Surveillance of Device-Associated Infections',
    description: 'Active daily surveillance of CAUTI, CLABSI, VAP, and SSI with calculation of rates per 1,000 device days.',
    measurableElementsCount: 6,
    complianceScorePct: 92.5,
    status: 'FULLY_COMPLIANT',
    assignedLead: 'Sr. Mary Kurian (Infection Control Nurse - ICN)',
    lastAuditDate: '2026-09-20'
  }
];

export const mockHospitalIncidents: HospitalIncidentDto[] = [
  {
    id: 'g1000000-0000-0000-0000-000000000001',
    tenantId: TENANT_ID,
    incidentNumber: 'INC-2026-0091',
    category: 'HEALTHCARE_ASSOCIATED_INFECTION',
    sacScore: 'SAC_3_MODERATE',
    status: 'CAPA_IMPLEMENTATION',
    patientInvolved: true,
    patientMrn: 'MRN-2026-9102',
    patientName: 'Mohd. Rafiq',
    departmentName: 'Intensive Care Unit (ICU-A)',
    locationDetail: 'ICU-A Bed 05',
    incidentDateTime: '2026-10-02T14:30:00Z',
    reportedByStaff: 'Sr. Mary Kurian (ICN)',
    reportedByRole: 'INFECTION_CONTROL_NURSE',
    briefSummary: 'Automated CAUTI flagged: Urine culture positive for ESBL Klebsiella on Day 6 of Foley Catheter.',
    detailedDescription: 'Patient admitted with acute pancreatitis on 2026-09-26. Foley catheter inserted on admission. On 2026-10-02 (Day 6), patient developed fever 38.9°C with cloudy urine. Urine culture grew >10^5 CFU/mL Klebsiella pneumoniae resistant to Ceftriaxone & Ciprofloxacin, sensitive to Meropenem & Fosfomycin.',
    immediateActionTaken: 'Catheter promptly removed under aseptic precautions; bladder scan protocol instituted. Treating intensivist initiated Fosfomycin. HICC automated log created.',
    patientHarmLevel: 'MODERATE_PROLONGED_HOSPITALIZATION',
    isSentinelEvent: false,
    investigatingQualityOfficer: 'Dr. Sunita Deshmukh',
    rcaRequired: true,
    closedAt: null,
    createdAt: '2026-10-02T15:00:00Z'
  }
];

export const mockIncidentRcas: IncidentRcaDto[] = [];
export const mockQualityCapas: QualityCapaDto[] = [];

export const mockHaiSurveillances: HaiSurveillanceDto[] = [
  {
    id: 'h1000000-0000-0000-0000-000000000001',
    tenantId: TENANT_ID,
    surveillanceCode: 'HAI-2026-CAUTI-01',
    patientId: 'p1000000-0000-0000-0000-000000000001',
    patientMrn: 'MRN-2026-9102',
    patientName: 'Mohd. Rafiq',
    departmentName: 'Intensive Care Unit (ICU-A)',
    haiType: 'CAUTI',
    diagnosisDate: '2026-10-02',
    pathogenIsolated: 'Klebsiella pneumoniae (ESBL Producer)',
    antibioticSensitivity: 'Sensitive: Meropenem, Fosfomycin, Amikacin | Resistant: Ceftriaxone, Levofloxacin',
    invasiveDeviceName: 'Foley Urinary Catheter 16 Fr',
    deviceInsertionDate: '2026-09-26',
    deviceDaysAtInfection: 6,
    hicInterventionTaken: 'Urinary catheter removed; daily bundle audit checklist enforced; Fosfomycin oral initiated.',
    outcomeStatus: 'ONGOING_TREATMENT',
    reportedToInfectionControlCommittee: true,
    createdAt: '2026-10-02T14:45:00Z'
  },
  {
    id: 'h1000000-0000-0000-0000-000000000002',
    tenantId: TENANT_ID,
    surveillanceCode: 'HAI-2026-CLABSI-01',
    patientId: 'p1000000-0000-0000-0000-000000000002',
    patientMrn: 'MRN-2026-4421',
    patientName: 'Anita Sharma',
    departmentName: 'Intensive Care Unit (ICU-A)',
    haiType: 'CLABSI',
    diagnosisDate: '2026-09-28',
    pathogenIsolated: 'Staphylococcus epidermidis (MRSE)',
    antibioticSensitivity: 'Sensitive: Vancomycin, Linezolid, Daptomycin | Resistant: Oxacillin, Erythromycin',
    invasiveDeviceName: 'Triple Lumen Central Venous Catheter (Right IJV)',
    deviceInsertionDate: '2026-09-20',
    deviceDaysAtInfection: 8,
    hicInterventionTaken: 'CVC removed and tip cultured; peripheral blood cultures (2 sets) cleared after 72h IV Linezolid.',
    outcomeStatus: 'RESOLVED',
    reportedToInfectionControlCommittee: true,
    createdAt: '2026-09-28T11:30:00Z'
  },
  {
    id: 'h1000000-0000-0000-0000-000000000003',
    tenantId: TENANT_ID,
    surveillanceCode: 'HAI-2026-VAP-01',
    patientId: 'p1000000-0000-0000-0000-000000000003',
    patientMrn: 'MRN-2026-7812',
    patientName: 'Subhash Chandra',
    departmentName: 'Intensive Care Unit (ICU-A)',
    haiType: 'VAP',
    diagnosisDate: '2026-09-22',
    pathogenIsolated: 'Pseudomonas aeruginosa (Multi-Drug Resistant)',
    antibioticSensitivity: 'Sensitive: Colistin, Ceftazidime-Avibactam | Resistant: Meropenem, Piperacillin-Tazobactam',
    invasiveDeviceName: 'Endotracheal Tube 8.0 mm with Subglottic Suction',
    deviceInsertionDate: '2026-09-17',
    deviceDaysAtInfection: 5,
    hicInterventionTaken: 'Inhalational Colistin + IV Ceftazidime-Avibactam started; daily sedation vacation successful, extubated on Day 8.',
    outcomeStatus: 'RESOLVED',
    reportedToInfectionControlCommittee: true,
    createdAt: '2026-09-22T09:15:00Z'
  }
];

export const mockHaiDeviceDays: HaiDeviceDaysDto = {
  id: 'hai-dev-001',
  tenantId: TENANT_ID,
  departmentName: 'Intensive Care Complex & Wards',
  monthYear: '2026-09',
  centralLineDays: 412,
  clabsiCount: 1,
  clabsiRatePer1000Days: 2.43,
  urinaryCatheterDays: 680,
  cautiCount: 2,
  cautiRatePer1000Days: 2.94,
  ventilatorDays: 310,
  vapCount: 1,
  vapRatePer1000Days: 3.23,
  surgicalProceduresCount: 180,
  ssiCount: 2,
  ssiPercentage: 1.11
};

export const mockPatientIsolations: PatientIsolationDto[] = [
  {
    id: 'i1000000-0000-0000-0000-000000000001',
    tenantId: TENANT_ID,
    isolationCode: 'ISO-2026-042',
    patientMrn: 'MRN-2026-9102',
    patientName: 'Mohd. Rafiq',
    departmentName: 'Intensive Care Unit (ICU-A)',
    roomBedNumber: 'ICU-A Bed 05',
    precautionType: 'CONTACT',
    indicatedReasonOrPathogen: 'ESBL-producing Klebsiella pneumoniae in Urine',
    startDate: '2026-10-02',
    endDate: null,
    assignedNurseLead: 'Sr. Mary Kurian (ICN)',
    isActive: true,
    createdAt: '2026-10-02T15:10:00Z'
  }
];

export const mockHandHygieneAudits: HandHygieneAuditDto[] = [];
export const mockEnvironmentalSwabs: EnvironmentalMicroSwabDto[] = [];
export const mockNeedleStickLogs: NeedleStickOccupationalLogDto[] = [];

export const mockBmwLogs: BiomedicalWasteLogDto[] = [
  {
    id: 'j1000000-0000-0000-0000-000000000001',
    tenantId: TENANT_ID,
    logDate: '2026-10-04',
    departmentName: 'Hospital Wide Central Waste Facility',
    yellowBagWeightKg: 145.5,
    redBagWeightKg: 188.2,
    whiteTranslucentWeightKg: 16.4,
    blueBagWeightKg: 44.8,
    totalDailyWeightKg: 394.9,
    pcbManifestBarcode: 'PCB-MH-2026-88129',
    handedOverToVendorName: 'Medicare Environmental Management Pvt Ltd (CBMWTF)',
    hospitalSupervisorName: 'Mr. Ramesh Kulkarni (Housekeeping Lead)'
  },
  {
    id: 'j1000000-0000-0000-0000-000000000002',
    tenantId: TENANT_ID,
    logDate: '2026-10-03',
    departmentName: 'Hospital Wide Central Waste Facility',
    yellowBagWeightKg: 138.0,
    redBagWeightKg: 175.5,
    whiteTranslucentWeightKg: 14.2,
    blueBagWeightKg: 39.0,
    totalDailyWeightKg: 366.7,
    pcbManifestBarcode: 'PCB-MH-2026-88118',
    handedOverToVendorName: 'Medicare Environmental Management Pvt Ltd (CBMWTF)',
    hospitalSupervisorName: 'Mr. Ramesh Kulkarni (Housekeeping Lead)'
  },
  {
    id: 'j1000000-0000-0000-0000-000000000003',
    tenantId: TENANT_ID,
    logDate: '2026-10-02',
    departmentName: 'Hospital Wide Central Waste Facility',
    yellowBagWeightKg: 152.0,
    redBagWeightKg: 190.0,
    whiteTranslucentWeightKg: 18.0,
    blueBagWeightKg: 42.5,
    totalDailyWeightKg: 402.5,
    pcbManifestBarcode: 'PCB-MH-2026-88104',
    handedOverToVendorName: 'Medicare Environmental Management Pvt Ltd (CBMWTF)',
    hospitalSupervisorName: 'Mr. Ramesh Kulkarni (Housekeeping Lead)'
  }
];

export const mockQualityOverviewMetrics: QualityOverviewMetricsDto = {
  overallNabhCompliancePct: 94.6,
  openIncidentsCount: 1,
  sentinelEventsCount: 0,
  clabsiRateFleet: 2.43,
  cautiRateFleet: 2.94,
  vapRateFleet: 3.23,
  ssiRateFleetPct: 1.11,
  handHygieneCompliancePct: 88.5,
  activeIsolatedPatientsCount: 1,
  openCapaActionsCount: 2,
  overdueCapaCount: 0,
  satisfactorySwabsRatePct: 98.2
};

export const mockQualityAuditTraces: QualityAuditTraceDto[] = [];
