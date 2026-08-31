import type {
  MRDepartmentDto,
  MedicalRecordIndexDto,
  MedicalRecordCompletionTaskDto,
  ICDCodeItemDto,
  MedicalDiagnosisCodeDto,
  CodingReviewDto,
  ClinicalDocumentationQueryDto,
  ReleaseOfInformationRequestDto,
  LegalRecordRequestDto,
  MedicalRecordLegalHoldDto,
  BirthRegistryRecordDto,
  DeathRegistryRecordDto,
  MedicalRecordAuditTraceDto,
  MRDOverviewMetricsDto,
  MRDAnalyticsDto
} from '@docsearch/api-contracts';

const T_ID = '11111111-1111-4111-8111-111111111111';
const P_ID = '22222222-2222-4222-8222-222222222222';
const O_ID = '33333333-3333-4333-8333-333333333333';
const B_ID = '44444444-4444-4444-8444-444444444444';

export const mockMRDepartment: MRDepartmentDto = {
  id: 'mrd-001',
  tenantId: T_ID,
  partnerId: P_ID,
  organizationId: O_ID,
  branchId: B_ID,
  departmentCode: 'HIM-MRD-MAIN',
  departmentName: 'Health Information Management & Medical Records Central Division',
  headOfMrdName: 'Dr. Rebecca Sterling, RHIA (HIM Director)',
  leadHIMOfficerName: 'Marcus Chen, RHIT (HIM Manager)',
  leadCodingAuditorName: 'Priya Sundaram, CCS, CPC (Senior Coding Lead)',
  physicalVaultLocation: 'Basement Level B2, Archival Vault Suite A-12',
  totalIndexedRecords: 1420,
  isActive: true,
  createdAt: '2026-08-01T08:00:00.000Z',
  updatedAt: '2026-08-01T08:00:00.000Z'
};

export const mockMedicalRecords: MedicalRecordIndexDto[] = [
  {
    id: 'mr-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    recordNumber: 'MR-2026-00891',
    patientId: 'pat-ipd-101',
    patientName: 'Eleanor Vance',
    patientMrn: 'MRN-449102',
    encounterId: 'enc-ipd-001',
    encounterNumber: 'ADM-2026-00441',
    encounterType: 'INPATIENT_ADMISSION',
    admissionDate: '2026-08-20T10:30:00.000Z',
    dischargeDate: '2026-08-28T14:00:00.000Z',
    primaryAttendingDoctor: 'Dr. Arthur Pendelton, MD',
    completionStatus: 'COMPLETED',
    codingStatus: 'APPROVED_FINALIZED',
    storageType: 'HYBRID_SCANNED_AND_PHYSICAL',
    physicalShelfNumber: 'SHELF-MED-04',
    physicalBoxNumber: 'BOX-2026-08-A',
    isLegalHoldActive: false,
    createdAt: '2026-08-20T10:30:00.000Z',
    updatedAt: '2026-08-28T16:00:00.000Z'
  },
  {
    id: 'mr-002',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    recordNumber: 'MR-2026-00892',
    patientId: 'pat-emg-101',
    patientName: 'David K. Miller',
    patientMrn: 'MRN-772101',
    encounterId: 'ee-001',
    encounterNumber: 'EMG-2026-001',
    encounterType: 'EMERGENCY_TRAUMA',
    admissionDate: '2026-08-29T10:15:00.000Z',
    primaryAttendingDoctor: 'Dr. Evelyn Reed, MD',
    completionStatus: 'INCOMPLETE',
    codingStatus: 'CODED_AWAITING_REVIEW',
    storageType: 'DIGITAL_ONLY_EHR',
    isLegalHoldActive: true,
    createdAt: '2026-08-29T10:15:00.000Z',
    updatedAt: '2026-08-29T12:00:00.000Z'
  },
  {
    id: 'mr-003',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    recordNumber: 'MR-2026-00893',
    patientId: 'pat-ot-102',
    patientName: 'Robert Langdon',
    patientMrn: 'MRN-558291',
    encounterId: 'enc-ot-002',
    encounterNumber: 'SRG-2026-00912',
    encounterType: 'SURGICAL_OT',
    admissionDate: '2026-08-25T08:00:00.000Z',
    dischargeDate: '2026-08-29T11:00:00.000Z',
    primaryAttendingDoctor: 'Dr. Evelyn Reed, MD',
    completionStatus: 'UNDER_REVIEW',
    codingStatus: 'PENDING_INITIAL_CODE',
    storageType: 'DIGITAL_ONLY_EHR',
    isLegalHoldActive: false,
    createdAt: '2026-08-25T08:00:00.000Z',
    updatedAt: '2026-08-29T11:30:00.000Z'
  }
];

export const mockCompletionTasks: MedicalRecordCompletionTaskDto[] = [
  {
    id: 'task-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    recordId: 'mr-002',
    taskCode: 'DEF-2026-0182',
    deficiencyType: 'MISSING_OPERATIVE_NOTE_SIGNATURE',
    responsibleStaffName: 'Dr. Evelyn Reed, MD',
    responsibleStaffRole: 'ATTENDING_SURGEON',
    description: 'Post-laparotomy operative note awaiting final physician electronic signature.',
    dueDate: '2026-08-31T17:00:00.000Z',
    isResolved: false,
    notes: 'Reminder notification dispatched via provider portal.',
    createdAt: '2026-08-29T11:00:00.000Z'
  },
  {
    id: 'task-002',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    recordId: 'mr-003',
    taskCode: 'DEF-2026-0183',
    deficiencyType: 'PENDING_HISTOPATHOLOGY_REPORT',
    responsibleStaffName: 'Dr. Christopher Nolan (Lab Pathologist)',
    responsibleStaffRole: 'PATHOLOGY_DIRECTOR',
    description: 'Biopsy specimen pathology report pending histological confirmation.',
    dueDate: '2026-09-01T12:00:00.000Z',
    isResolved: false,
    createdAt: '2026-08-29T09:30:00.000Z'
  }
];

export const mockICD10Catalog: ICDCodeItemDto[] = [
  { id: 'icd-1', code: 'I21.0', shortDescription: 'STEMI of anterior wall', fullDescription: 'ST elevation (STEMI) myocardial infarction of anterior wall', chapter: 'Circulatory System', category: 'Ischemic Heart Diseases', isBillable: true },
  { id: 'icd-2', code: 'I21.1', shortDescription: 'STEMI of inferior wall', fullDescription: 'ST elevation (STEMI) myocardial infarction of inferior wall', chapter: 'Circulatory System', category: 'Ischemic Heart Diseases', isBillable: true },
  { id: 'icd-3', code: 'S82.201A', shortDescription: 'Closed fracture of right tibia shaft', fullDescription: 'Unspecified fracture of shaft of right tibia, initial encounter for closed fracture', chapter: 'Injury & Poisoning', category: 'Fractures of Lower Leg', isBillable: true },
  { id: 'icd-4', code: 'E11.9', shortDescription: 'Type 2 diabetes without complications', fullDescription: 'Type 2 diabetes mellitus without complications', chapter: 'Endocrine & Metabolic', category: 'Diabetes Mellitus', isBillable: true },
  { id: 'icd-5', code: 'I10', shortDescription: 'Essential hypertension', fullDescription: 'Essential (primary) hypertension', chapter: 'Circulatory System', category: 'Hypertensive Diseases', isBillable: true },
  { id: 'icd-6', code: 'J18.9', shortDescription: 'Pneumonia, unspecified organism', fullDescription: 'Pneumonia, unspecified organism', chapter: 'Respiratory System', category: 'Influenza & Pneumonia', isBillable: true },
  { id: 'icd-7', code: 'K35.80', shortDescription: 'Unspecified acute appendicitis', fullDescription: 'Unspecified acute appendicitis', chapter: 'Digestive System', category: 'Diseases of Appendix', isBillable: true },
  { id: 'icd-8', code: 'V29.9XXA', shortDescription: 'Motorcycle rider injured in collision', fullDescription: 'Motorcycle rider (driver) (passenger) injured in collision with unspecified transport vehicle in traffic accident', chapter: 'External Causes', category: 'Motorcycle Accident', isBillable: true }
];

export const mockDiagnosisCodes: MedicalDiagnosisCodeDto[] = [
  {
    id: 'mdc-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    recordId: 'mr-001',
    icdCode: 'K35.80',
    icdDescription: 'Unspecified acute appendicitis with localized peritonitis',
    codeType: 'PRIMARY_DIAGNOSIS',
    poaIndicator: 'YES_PRESENT_ON_ADMISSION',
    sequencingOrder: 1,
    assignedByCoder: 'Priya Sundaram, CCS',
    coderNotes: 'Matched operative findings and histopathology.',
    createdAt: '2026-08-28T15:00:00.000Z'
  },
  {
    id: 'mdc-002',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    recordId: 'mr-001',
    icdCode: 'E11.9',
    icdDescription: 'Type 2 diabetes mellitus without complications',
    codeType: 'COMORBIDITY',
    poaIndicator: 'YES_PRESENT_ON_ADMISSION',
    sequencingOrder: 2,
    assignedByCoder: 'Priya Sundaram, CCS',
    createdAt: '2026-08-28T15:05:00.000Z'
  },
  {
    id: 'mdc-003',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    recordId: 'mr-002',
    icdCode: 'S82.201A',
    icdDescription: 'Unspecified fracture of shaft of right tibia, initial encounter for closed fracture',
    codeType: 'PRIMARY_DIAGNOSIS',
    poaIndicator: 'YES_PRESENT_ON_ADMISSION',
    sequencingOrder: 1,
    assignedByCoder: 'Marcus Chen, RHIT',
    coderNotes: 'Polytrauma crash diagnosis.',
    createdAt: '2026-08-29T11:45:00.000Z'
  }
];

export const mockCodingReviews: CodingReviewDto[] = [
  {
    id: 'cr-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    recordId: 'mr-001',
    reviewNumber: 'REV-2026-0041',
    reviewerName: 'Dr. Rebecca Sterling, RHIA',
    reviewerRole: 'HIM_DIRECTOR',
    reviewLevel: 'SECOND_LEVEL_SENIOR_AUDIT',
    status: 'APPROVED_FINALIZED',
    findingsAndErrorsNotes: 'Principal diagnosis sequenced accurately. Comorbidities documented according to coding guidelines.',
    codingAccuracyScorePercent: 100,
    reviewedAt: '2026-08-28T16:30:00.000Z'
  }
];

export const mockClinicalQueries: ClinicalDocumentationQueryDto[] = [
  {
    id: 'cdq-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    recordId: 'mr-002',
    queryNumber: 'CDQ-2026-0104',
    queryTitle: 'Clarification regarding Acute Blood Loss Anemia vs Pre-existing Anemia',
    initiatedByCoder: 'Marcus Chen, RHIT',
    assignedDoctorName: 'Dr. Evelyn Reed, MD',
    clinicalReason: 'Hemoglobin dropped from 14.2 to 8.4 post-injury with 2 Units PRBC administered.',
    supportingDocumentationSnippet: 'ED Trauma Sheet indicates active pelvic hemorrhage; progress notes state "anemic state".',
    clinicianClarificationResponse: 'Confirmed Acute Post-Hemorrhagic Anemia secondary to pelvic fracture trauma.',
    status: 'RESOLVED',
    initiatedAt: '2026-08-29T11:15:00.000Z',
    respondedAt: '2026-08-29T12:00:00.000Z'
  }
];

export const mockROIRequests: ReleaseOfInformationRequestDto[] = [
  {
    id: 'roi-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    requestNumber: 'ROI-2026-0081',
    recordId: 'mr-001',
    patientName: 'Eleanor Vance',
    patientMrn: 'MRN-449102',
    requestType: 'PATIENT_SELF_REQUEST',
    requestorName: 'Eleanor Vance',
    purposeOfRequest: 'Personal health record archive and employer sick leave validation',
    authorizedByOfficer: 'Marcus Chen, RHIT',
    status: 'DISCLOSED_AND_RELEASED',
    deliveryMethod: 'ELECTRONIC_SECURE_PORTAL',
    requestedAt: '2026-08-28T17:00:00.000Z',
    releasedAt: '2026-08-29T09:00:00.000Z'
  }
];

export const mockLegalRequests: LegalRecordRequestDto[] = [
  {
    id: 'lrr-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    legalRequestNumber: 'LEGAL-2026-0019',
    recordId: 'mr-002',
    patientName: 'David K. Miller',
    courtOrAgencyName: 'Metropolitan District Magistrate Court',
    legalNoticeReferenceNumber: 'COURT-ORD-2026/4491',
    officerInChargeName: 'Sub-Inspector Arvind Rao',
    subpoenaDetails: 'Certified copy of MLC emergency admission and trauma surgeon operative notes for criminal vehicular investigation.',
    isPreservationOrder: true,
    legalHoldApplied: true,
    servedAt: '2026-08-29T11:30:00.000Z'
  }
];

export const mockLegalHolds: MedicalRecordLegalHoldDto[] = [
  {
    id: 'mrlh-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    holdCode: 'HOLD-2026-004',
    recordId: 'mr-002',
    patientName: 'David K. Miller',
    legalMatterTitle: 'State vs. Motorist (Vehicular Collision Case #4491)',
    reasonForHold: 'Statutory preservation of medical record in active court proceeding.',
    authorizedByLegalCounsel: 'Advocate Rajesh Mehta (Hospital Legal Counsel)',
    status: 'ACTIVE_LEGAL_HOLD',
    appliedAt: '2026-08-29T11:45:00.000Z'
  }
];

export const mockBirthRecords: BirthRegistryRecordDto[] = [
  {
    id: 'brr-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    birthRegistrationNumber: 'BR-2026-0012',
    motherEncounterId: 'enc-moth-101',
    motherPatientName: 'Sarah Jenkins',
    motherMrn: 'MRN-881902',
    babyNameOrIdentifier: 'Baby Boy Jenkins',
    birthTimestamp: '2026-08-28T04:22:00.000Z',
    deliveryType: 'Spontaneous Vaginal Delivery',
    gender: 'MALE',
    birthWeightKg: 3.45,
    attendingObstetrician: 'Dr. Meera Nambiar, MD (OB-GYN)',
    attendingPaediatrician: 'Dr. Anita Desai, MD (Paediatrics)',
    birthCertificateReferenceNumber: 'MUNI-BIRTH-2026/8812',
    governmentPortalNotified: true,
    createdAt: '2026-08-28T06:00:00.000Z'
  }
];

export const mockMRDDeathRecords: DeathRegistryRecordDto[] = [
  {
    id: 'drr-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    deathRegistrationNumber: 'DR-2026-0008',
    encounterId: 'ee-002',
    patientName: 'Unknown Male #399',
    patientMrn: 'MRN-UNKWN-399',
    declaredDeadTimestamp: '2026-08-28T22:15:00.000Z',
    declaringPhysician: 'Dr. Marcus Webb, MD',
    primaryCauseOfDeath: 'Severe traumatic brainstem injury with irreversible cardiac arrest',
    secondaryCauses: 'Pedestrian motor vehicle collision',
    deathCertificateNumber: 'DTH-ED-2026-004',
    coronerPoliceInformed: true,
    statutoryDeathPortalNotified: true,
    createdAt: '2026-08-29T08:00:00.000Z'
  }
];

export const mockMRDAuditTraces: MedicalRecordAuditTraceDto[] = [
  {
    id: 'maud-001',
    tenantId: T_ID,
    partnerId: P_ID,
    organizationId: O_ID,
    branchId: B_ID,
    traceNumber: 'TRACE-MRD-00998101',
    actorId: 'usr-mrd-lead',
    actorName: 'Priya Sundaram, CCS',
    actorRole: 'CODING_SPECIALIST',
    action: 'FINALIZE_ICD10_CODING',
    entityType: 'MEDICAL_RECORD',
    entityId: 'mr-001',
    entityCode: 'MR-2026-00891',
    justification: 'Discharge summary signed and coding audited with 100% accuracy',
    ipAddress: '10.0.8.22',
    integrityHash: 'sha256-4c919a0bcdMRD882190',
    previousHash: 'sha256-genesis',
    newState: { status: 'APPROVED_FINALIZED' },
    timestamp: '2026-08-28T16:35:00.000Z'
  }
];

export const mockMRDOverviewMetrics: MRDOverviewMetricsDto = {
  totalActiveRecords: 1420,
  incompleteChartsCount: 14,
  pendingCodingQueueCount: 8,
  activeQueriesCount: 3,
  pendingROIRequestsCount: 2,
  activeLegalHoldsCount: 1,
  averageCodingTurnaroundHours: 18.5,
  codingAccuracyRatePercent: 98
};

export const mockMRDAnalytics: MRDAnalyticsDto = {
  topDiagnosesICD: [
    { code: 'I21.0', title: 'STEMI Anterior Wall', count: 48 },
    { code: 'S82.201A', title: 'Fracture Right Tibia', count: 36 },
    { code: 'K35.80', title: 'Acute Appendicitis', count: 32 },
    { code: 'E11.9', title: 'Type 2 Diabetes', count: 64 },
    { code: 'I10', title: 'Essential Hypertension', count: 88 }
  ],
  chartCompletionRates: [
    { department: 'General Surgery', rate: 96 },
    { department: 'Emergency & Trauma', rate: 91 },
    { department: 'Internal Medicine', rate: 98 },
    { department: 'Cardiology', rate: 99 },
    { department: 'Orthopaedics', rate: 94 }
  ],
  queryResolutionTimeDays: [
    { specialty: 'Surgery', avgDays: 1.2 },
    { specialty: 'Trauma', avgDays: 0.8 },
    { specialty: 'Internal Med', avgDays: 1.5 },
    { specialty: 'Cardiology', avgDays: 0.5 }
  ],
  roiVolumeByType: [
    { type: 'Patient Direct', count: 112 },
    { type: 'Insurance / TPA', count: 84 },
    { type: 'Legal / Subpoena', count: 18 },
    { type: 'Regulatory / Govt', count: 12 }
  ]
};
