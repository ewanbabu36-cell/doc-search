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

export const mockQualityStandards: QualityStandardDto[] = [
  {
    id: 'qs111111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    chapter: 'AAC_ACCESS_ASSESSMENT_CONTINUITY',
    standardCode: 'AAC.1',
    standardTitle: 'Registration, Admission & Transfer Process',
    description: 'The organization has a well-defined registration, admission and transfer process with standardized clinical handover protocols.',
    measurableElementsCount: 6,
    complianceScorePct: 98.5,
    status: 'FULLY_COMPLIANT',
    assignedLead: 'Dr. Suresh Menon (Clinical Quality Lead)',
    lastAuditDate: '2026-07-20'
  },
  {
    id: 'qs111111-1111-4111-8111-111111111102',
    tenantId: '11111111-1111-4111-8111-111111111111',
    chapter: 'COP_CARE_OF_PATIENTS',
    standardCode: 'COP.3',
    standardTitle: 'Care of Vulnerable & High-Risk Patients',
    description: 'Uniform care provided to high-risk patients (pediatric, elderly, ICU, restraints) adhering to evidence-based clinical practice guidelines.',
    measurableElementsCount: 8,
    complianceScorePct: 96.0,
    status: 'FULLY_COMPLIANT',
    assignedLead: 'Dr. Vivek Mehra (Chief Medical Officer)',
    lastAuditDate: '2026-08-05'
  },
  {
    id: 'qs111111-1111-4111-8111-111111111103',
    tenantId: '11111111-1111-4111-8111-111111111111',
    chapter: 'MOM_MANAGEMENT_OF_MEDICATION',
    standardCode: 'MOM.5',
    standardTitle: 'High-Alert & Look-Alike Sound-Alike (LASA) Medications',
    description: 'The organization has standard procedures for identification, physical segregation, dual-signoff verification and dispensing of high-alert medications.',
    measurableElementsCount: 7,
    complianceScorePct: 94.2,
    status: 'PARTIALLY_COMPLIANT',
    assignedLead: 'Pharm. Sunita Patil (Chief Pharmacist)',
    lastAuditDate: '2026-08-12'
  },
  {
    id: 'qs111111-1111-4111-8111-111111111104',
    tenantId: '11111111-1111-4111-8111-111111111111',
    chapter: 'HIC_HOSPITAL_INFECTION_CONTROL',
    standardCode: 'HIC.1',
    standardTitle: 'Comprehensive Infection Control Program & Committee',
    description: 'Infection prevention and control program overseen by multi-disciplinary committee with active HAI surveillance and antibiotic stewardship.',
    measurableElementsCount: 10,
    complianceScorePct: 99.0,
    status: 'FULLY_COMPLIANT',
    assignedLead: 'Dr. Radhika Sharma (Infection Control Officer)',
    lastAuditDate: '2026-08-18'
  },
  {
    id: 'qs111111-1111-4111-8111-111111111105',
    tenantId: '11111111-1111-4111-8111-111111111111',
    chapter: 'PSQ_PATIENT_SAFETY_QUALITY',
    standardCode: 'PSQ.2',
    standardTitle: 'Incident Reporting, Sentinel Events & RCA',
    description: 'Non-punitive incident reporting system with mandatory Root Cause Analysis (RCA) for all sentinel events and high-severity incidents within 48 hours.',
    measurableElementsCount: 6,
    complianceScorePct: 97.5,
    status: 'FULLY_COMPLIANT',
    assignedLead: 'Dr. Alok Verma (Quality Director)',
    lastAuditDate: '2026-08-22'
  }
];

export const mockHospitalIncidents: HospitalIncidentDto[] = [
  {
    id: 'inc11111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    incidentNumber: 'INC-2026-0842',
    category: 'MEDICATION_ERROR',
    sacScore: 'SAC_2_MAJOR',
    status: 'RCA_IN_PROGRESS',
    patientInvolved: true,
    patientMrn: 'MRN-2026-4401',
    patientName: 'Kavita Joshi',
    departmentName: 'Inpatient Medical Ward 3',
    locationDetail: 'Bed 308-A',
    incidentDateTime: '2026-08-28T14:15:00.000Z',
    reportedByStaff: 'Staff Nurse Anjali Shinde',
    reportedByRole: 'WARD_NURSE',
    briefSummary: 'Look-alike sound-alike (LASA) substitution: Cefotaxime 1g administered instead of Cefepime 1g.',
    detailedDescription: 'During midday intravenous antibiotic administration, Cefotaxime vial was drawn from ward stock box due to visual similarity of packaging label. Pharmacist double-check step was bypassed during shift handover rush.',
    immediateActionTaken: 'Infusion halted after 20ml; attending physician Dr. Nair informed immediately; vitals and renal parameters monitored q1h; patient stable with no adverse hemodynamics.',
    patientHarmLevel: 'MILD_TRANSIENT_HARM',
    isSentinelEvent: false,
    investigatingQualityOfficer: 'Dr. Radhika Sharma (Quality Committee)',
    rcaRequired: true,
    createdAt: '2026-08-28T14:45:00.000Z'
  },
  {
    id: 'inc11111-1111-4111-8111-111111111102',
    tenantId: '11111111-1111-4111-8111-111111111111',
    patientInvolved: true,
    patientMrn: 'MRN-2026-7782',
    patientName: 'Ramanathan Iyer (78M)',
    incidentNumber: 'INC-2026-0839',
    category: 'PATIENT_FALL',
    sacScore: 'SAC_3_MODERATE',
    status: 'CAPA_FORMULATED',
    departmentName: 'Geriatric Ward 2',
    locationDetail: 'Washroom 204',
    incidentDateTime: '2026-08-26T03:30:00.000Z',
    reportedByStaff: 'Staff Nurse Mary Joseph',
    reportedByRole: 'WARD_NURSE',
    briefSummary: 'Unassisted nocturnal fall in washroom; Morse Fall Score 65 (High Risk).',
    detailedDescription: 'Elderly patient attempted unassisted transfer to washroom at 03:30. Bed rails were lowered by attendant without informing nursing station. Patient slipped on wet tile; sustained superficial contusion on left forearm.',
    immediateActionTaken: 'Attending doctor examined patient; emergency X-ray left arm rule out fracture (normal); ice pack applied; yellow high-fall-risk wristband and bed alarm re-engaged.',
    patientHarmLevel: 'MILD_TRANSIENT_HARM',
    isSentinelEvent: false,
    investigatingQualityOfficer: 'Dr. Suresh Menon (Patient Safety Officer)',
    rcaRequired: false,
    createdAt: '2026-08-26T04:00:00.000Z'
  },
  {
    id: 'inc11111-1111-4111-8111-111111111103',
    tenantId: '11111111-1111-4111-8111-111111111111',
    incidentNumber: 'INC-2026-0831',
    category: 'NEEDLE_STICK_SHARPS',
    sacScore: 'SAC_3_MODERATE',
    status: 'CLOSED',
    patientInvolved: true,
    patientMrn: 'MRN-2026-1190',
    patientName: 'Sanjay Deshmukh',
    departmentName: 'Emergency Department (ED)',
    locationDetail: 'Trauma Bay 2',
    incidentDateTime: '2026-08-22T19:40:00.000Z',
    reportedByStaff: 'Dr. Arvind Saxena (Junior Resident)',
    reportedByRole: 'DOCTOR',
    briefSummary: 'Hollow-bore needle stick injury during emergency arterial blood gas (ABG) sampling.',
    detailedDescription: 'During resuscitation of an agitated trauma patient, safety guard cap slipped while recapping ABG needle resulting in puncture to right index finger.',
    immediateActionTaken: 'Wound washed under running water with soap for 5 mins; source blood drawn for HIV/HBsAg/HCV rapid panel (non-reactive); PEP counselling done; Tenofovir+Lamivudine+Dolutegravir starter pack given within 45 mins.',
    patientHarmLevel: 'NO_HARM_NEAR_MISS',
    isSentinelEvent: false,
    investigatingQualityOfficer: 'Dr. Radhika Sharma (Infection Control Officer)',
    rcaRequired: false,
    closedAt: '2026-08-23T11:00:00.000Z',
    createdAt: '2026-08-22T20:00:00.000Z'
  }
];

export const mockIncidentRcas: IncidentRcaDto[] = [
  {
    id: 'rca11111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    rcaCode: 'RCA-2026-009',
    incidentId: 'inc11111-1111-4111-8111-111111111101',
    incidentNumber: 'INC-2026-0842',
    leadInvestigator: 'Dr. Radhika Sharma (Quality Committee Chair)',
    investigationTeam: [
      'Dr. Radhika Sharma (Quality Committee)',
      'Pharm. Sunita Patil (Head of Pharmacy)',
      'Sister Sarala Devi (Nursing Supervisor)',
      'Dr. Suresh Menon (Inpatient Clinical Lead)'
    ],
    fiveWhysAnalysis: [
      {
        step: 1,
        whyQuestion: 'Why was Cefotaxime administered instead of Cefepime?',
        becauseAnswer: 'The nurse picked Cefotaxime from the antibiotic bin without noticing the fine print differences.'
      },
      {
        step: 2,
        whyQuestion: 'Why did the nurse misidentify the vial?',
        becauseAnswer: 'Both vials share identical white caps, purple striping and identical 10ml vial geometry.'
      },
      {
        step: 3,
        whyQuestion: 'Why were LASA medications co-located in the same bin?',
        becauseAnswer: 'Ward stock replenishment placed newly arrived stock in generic antibiotic drawer without LASA tall-man lettering.'
      },
      {
        step: 4,
        whyQuestion: 'Why was independent double-check not performed?',
        becauseAnswer: 'The second nurse was responding to a code yellow emergency in the adjacent room.'
      },
      {
        step: 5,
        whyQuestion: 'Why is there no barcode scanning verification at bedside?',
        becauseAnswer: 'Ward 3 bedside eMAR barcode scanners were undergoing battery dock calibration.'
      }
    ],
    fishboneCategories: {
      people: ['Fatigued nurse during shift handover', 'Second nurse called to urgent code'],
      process: ['Bypassed independent double-check checklist', 'No tall-man lettering on ward shelf bin'],
      equipment: ['Bedside barcode scanner dock down for maintenance'],
      environment: ['High distraction during peak admission hour (14:00)'],
      management: ['Pharmacy stock binning protocol lacked visual LASA segregation stickers']
    },
    rootCauseStatement: 'Systemic failure in LASA physical segregation at ward level combined with lack of bedside barcode scanning during high-distraction shift handover period.',
    contributingFactors: 'Manufacturer packaging similarity (CefoTAXime vs CefePIME), concurrent ward emergency, and delayed barcode scanner battery deployment.',
    status: 'APPROVED_BY_COMMITTEE',
    completedDate: '2026-08-29',
    createdAt: '2026-08-28T18:00:00.000Z'
  }
];

export const mockQualityCapas: QualityCapaDto[] = [
  {
    id: 'capa1111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    capaCode: 'CAPA-2026-041',
    incidentId: 'inc11111-1111-4111-8111-111111111101',
    incidentNumber: 'INC-2026-0842',
    title: 'Ward LASA Medication Segregation & Tall-Man Lettering Overhaul',
    actionDescription: 'Physically segregate all LASA antibiotic pairs with high-visibility fluorescent orange dividers and mandate Tall-Man lettering (cefoTAXime vs cefePIME) on all storage bins.',
    actionType: 'SYSTEMIC_REDESIGN',
    assignedOwner: 'Pharm. Sunita Patil (Pharmacy Head)',
    targetCompletionDate: '2026-09-05',
    verificationMetric: '100% compliance on unannounced weekly pharmacy bin audits for 8 consecutive weeks.',
    status: 'IN_PROGRESS',
    createdAt: '2026-08-29T10:00:00.000Z'
  },
  {
    id: 'capa1111-1111-4111-8111-111111111102',
    tenantId: '11111111-1111-4111-8111-111111111111',
    capaCode: 'CAPA-2026-038',
    incidentId: 'inc11111-1111-4111-8111-111111111102',
    incidentNumber: 'INC-2026-0839',
    title: 'Mandatory Non-Skid Bathroom Flooring & Attendant Night Protocol',
    actionDescription: 'Install high-traction anti-skid floor mats in all Ward 2 bathrooms and institute mandatory attendant sign-off on fall precaution education during evening rounds.',
    actionType: 'PREVENTIVE',
    assignedOwner: 'Sister Sarala Devi (Nursing Supervisor)',
    targetCompletionDate: '2026-08-31',
    verificationMetric: 'Zero unassisted washroom falls in Geriatric Ward for 90 days.',
    status: 'COMPLETED',
    completedDate: '2026-08-30',
    verifiedBy: 'Dr. Suresh Menon (Patient Safety Officer)',
    verifiedDate: '2026-08-30',
    createdAt: '2026-08-26T12:00:00.000Z'
  }
];

export const mockHaiSurveillances: HaiSurveillanceDto[] = [
  {
    id: 'hai11111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    surveillanceCode: 'HAI-2026-018',
    patientId: 'p1111111-1111-4111-8111-111111111101',
    patientMrn: 'MRN-2026-3391',
    patientName: 'Harish Chandra (64M)',
    departmentName: 'Intensive Care Unit (ICU-A)',
    haiType: 'CLABSI',
    diagnosisDate: '2026-08-24',
    pathogenIsolated: 'Klebsiella pneumoniae (ESBL producing)',
    antibioticSensitivity: 'Sensitive to Meropenem, Colistin; Resistant to Ceftriaxone, Ciprofloxacin',
    invasiveDeviceName: 'Right Internal Jugular Triple-Lumen Central Venous Catheter (CVC)',
    deviceInsertionDate: '2026-08-16',
    deviceDaysAtInfection: 8,
    hicInterventionTaken: 'CVC removed and tip cultured; chlorhexidine dressing re-educated; contact isolation initiated; Meropenem IV started.',
    outcomeStatus: 'ONGOING_TREATMENT',
    reportedToInfectionControlCommittee: true,
    createdAt: '2026-08-24T16:00:00.000Z'
  },
  {
    id: 'hai11111-1111-4111-8111-111111111102',
    tenantId: '11111111-1111-4111-8111-111111111111',
    surveillanceCode: 'HAI-2026-017',
    patientId: 'p1111111-1111-4111-8111-111111111102',
    patientMrn: 'MRN-2026-5512',
    patientName: 'Sunita Mehra (52F)',
    departmentName: 'Surgical ICU (SICU)',
    haiType: 'CAUTI',
    diagnosisDate: '2026-08-19',
    pathogenIsolated: 'Pseudomonas aeruginosa (>10^5 CFU/mL)',
    antibioticSensitivity: 'Sensitive to Piperacillin-Tazobactam, Amikacin',
    invasiveDeviceName: '14 Fr Foley Silicone Urinary Catheter',
    deviceInsertionDate: '2026-08-12',
    deviceDaysAtInfection: 7,
    hicInterventionTaken: 'Foley catheter exchanged under strict aseptic technique; closed drainage drainage bag unobstructed; targeted Piperacillin-Tazobactam therapy.',
    outcomeStatus: 'RESOLVED',
    reportedToInfectionControlCommittee: true,
    createdAt: '2026-08-19T11:30:00.000Z'
  }
];

export const mockHaiDeviceDays: HaiDeviceDaysDto = {
  id: 'dd111111-1111-4111-8111-111111111101',
  tenantId: '11111111-1111-4111-8111-111111111111',
  departmentName: 'Hospital Wide (Fleet Aggregate)',
  monthYear: '2026-08',
  centralLineDays: 1420,
  clabsiCount: 2,
  clabsiRatePer1000Days: 1.41,
  urinaryCatheterDays: 1850,
  cautiCount: 3,
  cautiRatePer1000Days: 1.62,
  ventilatorDays: 680,
  vapCount: 1,
  vapRatePer1000Days: 1.47,
  surgicalProceduresCount: 420,
  ssiCount: 4,
  ssiPercentage: 0.95
};

export const mockPatientIsolations: PatientIsolationDto[] = [
  {
    id: 'iso11111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    isolationCode: 'ISO-2026-031',
    patientMrn: 'MRN-2026-3391',
    patientName: 'Harish Chandra',
    departmentName: 'Intensive Care Unit (ICU-A)',
    roomBedNumber: 'Isolation Room 01',
    precautionType: 'CONTACT',
    indicatedReasonOrPathogen: 'ESBL Klebsiella in Blood & CVC tip',
    startDate: '2026-08-24',
    assignedNurseLead: 'Sister Preeti Varma',
    isActive: true,
    createdAt: '2026-08-24T17:00:00.000Z'
  },
  {
    id: 'iso11111-1111-4111-8111-111111111102',
    tenantId: '11111111-1111-4111-8111-111111111111',
    isolationCode: 'ISO-2026-030',
    patientMrn: 'MRN-2026-9902',
    patientName: 'Zahir Khan',
    departmentName: 'Pulmonology Isolation Ward',
    roomBedNumber: 'Negative Pressure Room 102',
    precautionType: 'AIRBORNE',
    indicatedReasonOrPathogen: 'Sputum GeneXpert Positive Pulmonary Tuberculosis',
    startDate: '2026-08-20',
    assignedNurseLead: 'Sister Sarala Devi',
    isActive: true,
    createdAt: '2026-08-20T09:00:00.000Z'
  }
];

export const mockHandHygieneAudits: HandHygieneAuditDto[] = [
  {
    id: 'hha11111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    auditCode: 'HHA-2026-08-101',
    auditDate: '2026-08-30',
    departmentName: 'Intensive Care Unit (ICU-A)',
    staffCategory: 'DOCTOR',
    whoMoment: 'BEFORE_CLEAN_ASEPTIC_PROCEDURE',
    actionTaken: 'RUB_PERFORMED',
    isCompliant: true,
    auditedByOfficer: 'Sister Preeti Varma (Infection Control Nurse)',
    notes: 'Standard 30-sec alcoholic hand rub performed prior to CVC line dressing change.'
  },
  {
    id: 'hha11111-1111-4111-8111-111111111102',
    tenantId: '11111111-1111-4111-8111-111111111111',
    auditCode: 'HHA-2026-08-102',
    auditDate: '2026-08-30',
    departmentName: 'Emergency Department (ED)',
    staffCategory: 'WARD_ASSISTANT',
    whoMoment: 'AFTER_TOUCHING_PATIENT_SURROUNDINGS',
    actionTaken: 'MISSED_OPPORTUNITY',
    isCompliant: false,
    auditedByOfficer: 'Dr. Radhika Sharma',
    notes: 'Exited cubicle after adjusting bed rails without sanitizing hands. Immediate on-spot coaching provided.'
  }
];

export const mockEnvironmentalSwabs: EnvironmentalMicroSwabDto[] = [
  {
    id: 'swab1111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    sampleNumber: 'SWAB-2026-OT1-081',
    sampleType: 'OT_AIR_SETTLE_PLATE',
    locationDescription: 'Modular Operation Theatre 01 — Air Settle Plate Center',
    collectionDate: '2026-08-25',
    collectedBy: 'Lab Tech Deepali Patil',
    cfuCountPerPlateOrMl: 2,
    pathogensFound: 'Coagulase-Negative Staphylococci (Skin Commensal)',
    permissibleThreshold: '< 10 CFU/plate in ultraclean laminar airflow OT',
    resultStatus: 'SATISFACTORY_PASS',
    correctiveFoggingDone: false,
    microbiologistSignOff: 'Dr. Anil Saxena (Senior Microbiologist)',
    createdAt: '2026-08-25T14:00:00.000Z'
  },
  {
    id: 'swab1111-1111-4111-8111-111111111102',
    tenantId: '11111111-1111-4111-8111-111111111111',
    sampleNumber: 'SWAB-2026-RO-042',
    sampleType: 'DIALYSIS_WATER_ENDOTOXIN',
    locationDescription: 'Hemodialysis Central RO Water Treatment Loop Port 3',
    collectionDate: '2026-08-22',
    collectedBy: 'Lab Tech Deepali Patil',
    cfuCountPerPlateOrMl: 12,
    pathogensFound: 'Non-fermenting Gram-Negative Bacilli (Trace)',
    permissibleThreshold: '< 50 CFU/mL & < 0.25 EU/mL endotoxin (AAMI Standard)',
    resultStatus: 'SATISFACTORY_PASS',
    correctiveFoggingDone: false,
    microbiologistSignOff: 'Dr. Anil Saxena (Senior Microbiologist)',
    createdAt: '2026-08-22T16:30:00.000Z'
  }
];

export const mockNeedleStickLogs: NeedleStickOccupationalLogDto[] = [
  {
    id: 'ns111111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    incidentCode: 'PEP-2026-007',
    exposedStaffName: 'Dr. Arvind Saxena',
    staffRole: 'JUNIOR_RESIDENT_EMERGENCY',
    departmentName: 'Emergency Department',
    exposureDateTime: '2026-08-22T19:40:00.000Z',
    sourcePatientKnown: true,
    sourcePatientHivStatus: 'NEGATIVE',
    sourcePatientHbsAgStatus: 'NEGATIVE',
    sourcePatientHcvStatus: 'NEGATIVE',
    pepInitiatedWithinGoldenHour: true,
    pepRegimenDetails: 'Tenofovir 300mg + Lamivudine 300mg + Dolutegravir 50mg daily x 28 days starter course.',
    followUpSerologyDue: '2026-10-05 (6 weeks repeat)',
    counselorName: 'Dr. Radhika Sharma (Infection Control Officer)',
    createdAt: '2026-08-22T20:30:00.000Z'
  }
];

export const mockBmwLogs: BiomedicalWasteLogDto[] = [
  {
    id: 'bmw11111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    logDate: '2026-08-30',
    departmentName: 'Hospital Wide Central Waste Facility',
    yellowBagWeightKg: 142.5,
    redBagWeightKg: 198.0,
    whiteTranslucentWeightKg: 18.5,
    blueBagWeightKg: 45.0,
    totalDailyWeightKg: 404.0,
    pcbManifestBarcode: 'PCB-MH-2026-88129',
    handedOverToVendorName: 'Medicare Environmental Management Pvt Ltd',
    hospitalSupervisorName: 'Mr. Ramesh Kulkarni (Housekeeping Lead)'
  }
];

export const mockQualityOverviewMetrics: QualityOverviewMetricsDto = {
  overallNabhCompliancePct: 97.4,
  openIncidentsCount: 4,
  sentinelEventsCount: 0,
  clabsiRateFleet: 1.41,
  cautiRateFleet: 1.62,
  vapRateFleet: 1.47,
  ssiRateFleetPct: 0.95,
  handHygieneCompliancePct: 91.8,
  activeIsolatedPatientsCount: 2,
  openCapaActionsCount: 3,
  overdueCapaCount: 0,
  satisfactorySwabsRatePct: 99.2
};

export const mockQualityAuditTraces: QualityAuditTraceDto[] = [
  {
    id: 'tr111111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    traceNumber: 'TRACE-QUAL-08819',
    action: 'REPORT_INCIDENT',
    entityType: 'HOSPITAL_INCIDENT',
    entityId: 'inc11111-1111-4111-8111-111111111101',
    entityCode: 'INC-2026-0842',
    actorName: 'Staff Nurse Anjali Shinde',
    actorRole: 'WARD_NURSE',
    justification: 'Reported LASA antibiotic medication error on patient in Ward 3',
    integrityHash: 'a7b8f9e0134a415a77b819f09e86c123d7a8fbb56284f1a2384a8619114b3017',
    timestamp: '2026-08-28T14:45:00.000Z'
  },
  {
    id: 'tr111111-1111-4111-8111-111111111102',
    tenantId: '11111111-1111-4111-8111-111111111111',
    traceNumber: 'TRACE-QUAL-08820',
    action: 'APPROVE_RCA',
    entityType: 'INCIDENT_RCA',
    entityId: 'rca11111-1111-4111-8111-111111111101',
    entityCode: 'RCA-2026-009',
    actorName: 'Dr. Radhika Sharma',
    actorRole: 'QUALITY_CHAIR',
    justification: 'Completed 5-whys and fishbone diagram for INC-2026-0842 medication error',
    integrityHash: 'b4a8e29188f110c498321a117b8f9e0134a415a77b819f09e86c123d7a8fbb56',
    timestamp: '2026-08-29T10:00:00.000Z'
  }
];
