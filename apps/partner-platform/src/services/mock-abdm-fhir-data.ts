import type {
  AbhaAccountDto,
  AbdmCareContextDto,
  AbdmConsentArtefactDto,
  FhirBundleRecordDto,
  AbdmScanAndShareTokenDto,
  AbdmGatewayOverviewMetricsDto,
  AbdmAuditTraceDto
} from '@docsearch/api-contracts';

export const mockAbdmOverviewMetrics: AbdmGatewayOverviewMetricsDto = {
  bridgeStatus: 'CONNECTED_PRODUCTION',
  hfrFacilityId: 'IN-MH-HFR-90812',
  facilityName: 'Apex Multi-Specialty Hospital & Research Institute',
  totalLinkedAbhaCount: 14280,
  careContextsDiscoverableCount: 38450,
  activeConsentGrantsCount: 420,
  fhirBundlesGeneratedMonth: 1850,
  scanAndShareRegistrationsToday: 84,
  averagePushLatencyMs: 240,
  ecdhKeyExchangeSuccessPct: 99.8
};

export const mockAbhaAccounts: AbhaAccountDto[] = [
  {
    id: 'abha-acc-1111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    patientId: 'pat-1111-1111-4111-8111-111111111101',
    patientMrn: 'MRN-2026-9021',
    patientName: 'Gopal Krishna',
    abhaNumber: '91-4421-8890-1234',
    abhaAddress: 'gopal.krishna@abdm',
    mobileNumber: '+91 9876543210',
    gender: 'M',
    dateOfBirth: '1978-05-14',
    address: 'Flat 402, Shivam Residency, MG Road, Mumbai, Maharashtra 400001',
    kycStatus: 'VERIFIED_AADHAAR',
    abhaCardQrPayload: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%230f172a"/><text x="50" y="55" fill="white" font-size="10" text-anchor="middle">ABHA QR</text></svg>',
    linkedCareContextsCount: 4,
    createdAt: '2026-08-15T10:30:00.000Z'
  },
  {
    id: 'abha-acc-1111-1111-4111-8111-111111111102',
    tenantId: '11111111-1111-4111-8111-111111111111',
    patientId: 'pat-1111-1111-4111-8111-111111111102',
    patientMrn: 'MRN-2026-8819',
    patientName: 'Meenakshi Sundaram',
    abhaNumber: '91-8892-3341-9012',
    abhaAddress: 'meenakshi.s@abdm',
    mobileNumber: '+91 9820112233',
    gender: 'F',
    dateOfBirth: '1984-11-20',
    address: 'B-12, Green Glen Layout, Bellandur, Bengaluru, Karnataka 560103',
    kycStatus: 'VERIFIED_AADHAAR',
    abhaCardQrPayload: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%230f172a"/><text x="50" y="55" fill="white" font-size="10" text-anchor="middle">ABHA QR</text></svg>',
    linkedCareContextsCount: 2,
    createdAt: '2026-08-20T14:15:00.000Z'
  }
];

export const mockAbdmCareContexts: AbdmCareContextDto[] = [
  {
    id: 'cc-1111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    abhaAddress: 'gopal.krishna@abdm',
    patientMrn: 'MRN-2026-9021',
    patientName: 'Gopal Krishna',
    careContextType: 'OPD_CONSULTATION_VISIT',
    careContextReference: 'VISIT-OPD-2026-8819',
    displayTitle: 'Cardiology Consultation & Digital Prescription (Dr. Sanjay Gupta)',
    encounterDate: '2026-08-28',
    doctorName: 'Dr. Sanjay Gupta (HPR: HP-DOC-10293)',
    departmentName: 'Cardiology',
    isLinkedToAbdm: true,
    fhirBundleId: 'BUNDLE-RX-2026-08-28-001',
    createdAt: '2026-08-28T09:30:00.000Z'
  },
  {
    id: 'cc-1111-1111-4111-8111-111111111102',
    tenantId: '11111111-1111-4111-8111-111111111111',
    abhaAddress: 'gopal.krishna@abdm',
    patientMrn: 'MRN-2026-9021',
    patientName: 'Gopal Krishna',
    careContextType: 'DIAGNOSTIC_LAB_REPORT',
    careContextReference: 'DIAG-LAB-2026-4412',
    displayTitle: 'Comprehensive Metabolic Panel & Lipid Profile (NABL Verified)',
    encounterDate: '2026-08-28',
    doctorName: 'Dr. Neha Sharma (Biochemist)',
    departmentName: 'Central Clinical Biochemistry',
    isLinkedToAbdm: true,
    fhirBundleId: 'BUNDLE-LAB-2026-08-28-002',
    createdAt: '2026-08-28T11:45:00.000Z'
  },
  {
    id: 'cc-1111-1111-4111-8111-111111111103',
    tenantId: '11111111-1111-4111-8111-111111111111',
    abhaAddress: 'meenakshi.s@abdm',
    patientMrn: 'MRN-2026-8819',
    patientName: 'Meenakshi Sundaram',
    careContextType: 'IPD_DISCHARGE_EPISODE',
    careContextReference: 'IPD-DIS-2026-1049',
    displayTitle: 'Laparoscopic Cholecystectomy Inpatient Discharge Summary',
    encounterDate: '2026-08-29',
    doctorName: 'Dr. Vivek Mehra (HPR: HP-DOC-44812)',
    departmentName: 'General & GI Surgery',
    isLinkedToAbdm: true,
    fhirBundleId: 'BUNDLE-DIS-2026-08-29-003',
    createdAt: '2026-08-29T16:00:00.000Z'
  }
];

export const mockAbdmConsentArtefacts: AbdmConsentArtefactDto[] = [
  {
    id: 'art-1111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    consentRequestId: 'CR-2026-08-9901',
    artefactId: 'ART-ABDM-2026-77821',
    patientAbhaAddress: 'gopal.krishna@abdm',
    patientName: 'Gopal Krishna',
    requesterHipOrHiu: 'All India Institute of Medical Sciences (AIIMS HIU)',
    purposeCode: 'CARETREAT',
    purposeDescription: 'Outpatient Second Opinion & Cardiology Treatment Planning',
    dateFrom: '2025-01-01',
    dateTo: '2026-08-30',
    dataEraseDate: '2026-11-30',
    status: 'GRANTED',
    grantedAt: '2026-08-29T14:30:00.000Z',
    linkedCareContextRefs: ['VISIT-OPD-2026-8819', 'DIAG-LAB-2026-4412'],
    createdAt: '2026-08-29T14:00:00.000Z'
  }
];

export const mockFhirBundles: FhirBundleRecordDto[] = [
  {
    id: 'fbr-1111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    bundleId: 'BUNDLE-RX-2026-08-28-001',
    profileType: 'PRESCRIPTION_RECORD',
    patientAbhaAddress: 'gopal.krishna@abdm',
    patientMrn: 'MRN-2026-9021',
    careContextRef: 'VISIT-OPD-2026-8819',
    documentDate: '2026-08-28',
    authorPractitionerHprId: 'HP-DOC-10293',
    authorPractitionerName: 'Dr. Sanjay Gupta',
    facilityHfrId: 'IN-MH-HFR-90812',
    fhirJsonPayload: JSON.stringify({
      resourceType: 'Bundle',
      id: 'BUNDLE-RX-2026-08-28-001',
      meta: { profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/PrescriptionRecord'] },
      type: 'document',
      timestamp: '2026-08-28T09:30:00.000Z',
      entry: [
        {
          resource: {
            resourceType: 'Composition',
            status: 'final',
            type: { coding: [{ system: 'http://snomed.info/sct', code: '440545006', display: 'Prescription record' }] },
            subject: { reference: 'Patient/MRN-2026-9021', display: 'Gopal Krishna' }
          }
        },
        {
          resource: {
            resourceType: 'MedicationRequest',
            status: 'active',
            intent: 'order',
            medicationCodeableConcept: {
              coding: [{ system: 'http://snomed.info/sct', code: '318851002', display: 'Atorvastatin 20mg Tablet' }]
            },
            dosageInstruction: [{ text: '1 tablet orally at bedtime for 30 days' }]
          }
        }
      ]
    }, null, 2),
    validationStatus: 'VALID_FHIR_R4',
    digitalSignatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    createdAt: '2026-08-28T09:35:00.000Z'
  }
];

export const mockScanAndShareTokens: AbdmScanAndShareTokenDto[] = [
  {
    id: 'sst-1',
    tokenNumber: 'TKN-042',
    patientAbhaNumber: '91-4421-8890-1234',
    patientAbhaAddress: 'gopal.krishna@abdm',
    patientName: 'Gopal Krishna',
    gender: 'M',
    dob: '1978-05-14',
    mobile: '+91 9876543210',
    scannedCounterName: 'Registration Counter 03 (Fast-Track ABHA)',
    assignedOpdDepartment: 'Cardiology OPD',
    assignedDoctorName: 'Dr. Sanjay Gupta',
    status: 'CONVERTED_TO_APPOINTMENT',
    scannedAt: '2026-08-30T06:10:00.000Z'
  },
  {
    id: 'sst-2',
    tokenNumber: 'TKN-043',
    patientAbhaNumber: '91-7721-1122-3344',
    patientAbhaAddress: 'rajesh.patil@abdm',
    patientName: 'Rajesh Patil',
    gender: 'M',
    dob: '1982-03-22',
    mobile: '+91 9811223344',
    scannedCounterName: 'Registration Counter 01 (Lobby Kiosk)',
    assignedOpdDepartment: 'Orthopedics OPD',
    assignedDoctorName: 'Dr. Arvind Saxena',
    status: 'WAITING_AT_COUNTER',
    scannedAt: '2026-08-30T06:35:00.000Z'
  }
];

export const mockAbdmAuditTraces: AbdmAuditTraceDto[] = [
  {
    id: 'ab-tr-1111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    traceNumber: 'TRACE-ABDM-08819',
    action: 'CARE_CONTEXT_LINK_SUCCESS',
    entityType: 'CARE_CONTEXT',
    entityId: 'cc-1111-1111-4111-8111-111111111101',
    entityCode: 'VISIT-OPD-2026-8819',
    actorName: 'ABDM National Gateway Bridge',
    actorRole: 'SYSTEM_GATEWAY',
    justification: 'Patient linked care-context via ABDM OTP notification callback.',
    integrityHash: 'b4a1c55298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852a112',
    timestamp: '2026-08-28T09:36:00.000Z'
  }
];
