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
  hfrFacilityId: 'IN-DL-HFR-904128',
  facilityName: 'Apex Medicity Multi-Speciality Hospital & Trauma Centre',
  totalLinkedAbhaCount: 4821,
  careContextsDiscoverableCount: 12940,
  activeConsentGrantsCount: 184,
  fhirBundlesGeneratedMonth: 3218,
  scanAndShareRegistrationsToday: 94,
  averagePushLatencyMs: 128,
  ecdhKeyExchangeSuccessPct: 99.8
};

export const mockAbhaAccounts: AbhaAccountDto[] = [
  {
    id: '11111111-2222-3333-4444-555555555501',
    tenantId: '11111111-1111-4111-8111-111111111111',
    patientId: 'pat-40192',
    patientMrn: 'UHID-2026-8910',
    patientName: 'Kailash Chand Verma',
    abhaNumber: '91-4920-8812-4019',
    abhaAddress: 'kailash.verma@abdm',
    mobileNumber: '+91 98101 23456',
    gender: 'M',
    dateOfBirth: '1976-08-14',
    address: 'B-42, Hauz Khas Enclave, New Delhi, 110016',
    kycStatus: 'VERIFIED_AADHAAR',
    abhaCardQrPayload: 'ABHA:91-4920-8812-4019|VERIFIED|KAILASH_CHAND_VERMA',
    linkedCareContextsCount: 4,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: '11111111-2222-3333-4444-555555555502',
    tenantId: '11111111-1111-4111-8111-111111111111',
    patientId: 'pat-40193',
    patientMrn: 'UHID-2026-8911',
    patientName: 'Meenakshi Sundaram',
    abhaNumber: '91-8831-2940-5512',
    abhaAddress: 'meenakshi.s@sbx',
    mobileNumber: '+91 98450 98765',
    gender: 'F',
    dateOfBirth: '1984-03-22',
    address: '14, Anna Nagar 2nd Avenue, Chennai, 600040',
    kycStatus: 'VERIFIED_AADHAAR',
    abhaCardQrPayload: 'ABHA:91-8831-2940-5512|VERIFIED|MEENAKSHI_SUNDARAM',
    linkedCareContextsCount: 3,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString()
  },
  {
    id: '11111111-2222-3333-4444-555555555503',
    tenantId: '11111111-1111-4111-8111-111111111111',
    patientId: 'pat-40194',
    patientMrn: 'UHID-2026-8912',
    patientName: 'Ramesh Kumar Patel',
    abhaNumber: '91-3321-4456-7890',
    abhaAddress: 'ramesh.kumar@abdm',
    mobileNumber: '+91 97234 11223',
    gender: 'M',
    dateOfBirth: '1968-11-05',
    address: 'Plot 88, Navrangpura, Ahmedabad, 380009',
    kycStatus: 'VERIFIED_MOBILE',
    abhaCardQrPayload: 'ABHA:91-3321-4456-7890|VERIFIED|RAMESH_KUMAR_PATEL',
    linkedCareContextsCount: 5,
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString()
  }
];

export const mockAbdmCareContexts: AbdmCareContextDto[] = [
  {
    id: '22222222-1111-4222-8222-000000000001',
    tenantId: '11111111-1111-4111-8111-111111111111',
    abhaAddress: 'kailash.verma@abdm',
    patientMrn: 'UHID-2026-8910',
    patientName: 'Kailash Chand Verma',
    careContextType: 'OPD_CONSULTATION_VISIT',
    careContextReference: 'VISIT-OPD-2026-8819',
    displayTitle: 'Cardiology OPD Clinical Encounter & ECG Review',
    encounterDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    doctorName: 'Dr. Vivek Sharma, MD, DM',
    departmentName: 'Department of Cardiology',
    isLinkedToAbdm: true,
    fhirBundleId: 'bundle-fhir-r4-8819',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: '22222222-1111-4222-8222-000000000002',
    tenantId: '11111111-1111-4111-8111-111111111111',
    abhaAddress: 'ramesh.kumar@abdm',
    patientMrn: 'UHID-2026-8912',
    patientName: 'Ramesh Kumar Patel',
    careContextType: 'IPD_DISCHARGE_EPISODE',
    careContextReference: 'IPD-DISCH-2026-90412',
    displayTitle: 'Laparoscopic Cholecystectomy Post-Op Discharge Summary',
    encounterDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    doctorName: 'Dr. Vikram Malhotra, MS',
    departmentName: 'Department of General & Laparoscopic Surgery',
    isLinkedToAbdm: true,
    fhirBundleId: 'bundle-fhir-r4-90412',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: '22222222-1111-4222-8222-000000000003',
    tenantId: '11111111-1111-4111-8111-111111111111',
    abhaAddress: 'meenakshi.s@sbx',
    patientMrn: 'UHID-2026-8911',
    patientName: 'Meenakshi Sundaram',
    careContextType: 'DIAGNOSTIC_LAB_REPORT',
    careContextReference: 'LAB-2026-90410',
    displayTitle: 'Comprehensive Metabolic Panel (CMP) & CBC with ESR',
    encounterDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    doctorName: 'Dr. Ananya Roy, MD (Path)',
    departmentName: 'Department of Laboratory Medicine & Pathology',
    isLinkedToAbdm: true,
    fhirBundleId: 'bundle-fhir-r4-90410',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: '22222222-1111-4222-8222-000000000004',
    tenantId: '11111111-1111-4111-8111-111111111111',
    abhaAddress: 'kailash.verma@abdm',
    patientMrn: 'UHID-2026-8910',
    patientName: 'Kailash Chand Verma',
    careContextType: 'OPD_CONSULTATION_VISIT',
    careContextReference: 'RX-2026-7712',
    displayTitle: 'Cardiovascular Maintenance Prescription (Atorvastatin + Telmisartan)',
    encounterDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    doctorName: 'Dr. Vivek Sharma, MD, DM',
    departmentName: 'Department of Cardiology',
    isLinkedToAbdm: true,
    fhirBundleId: 'bundle-fhir-r4-7712',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  }
];

export const mockAbdmConsentArtefacts: AbdmConsentArtefactDto[] = [
  {
    id: '33333333-1111-4333-8333-000000000001',
    tenantId: '11111111-1111-4111-8111-111111111111',
    consentRequestId: 'CR-2026-9014',
    artefactId: 'ART-9921-8840',
    patientAbhaAddress: 'kailash.verma@abdm',
    patientName: 'Kailash Chand Verma',
    requesterHipOrHiu: 'All India Institute of Medical Sciences (HIU-AIIMS-01)',
    purposeCode: 'CARETREAT',
    purposeDescription: 'Specialist Cardiology Second Opinion & Longitudinal Review',
    dateFrom: new Date(Date.now() - 90 * 86400000).toISOString(),
    dateTo: new Date(Date.now() + 30 * 86400000).toISOString(),
    dataEraseDate: new Date(Date.now() + 60 * 86400000).toISOString(),
    status: 'GRANTED',
    grantedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    linkedCareContextRefs: ['VISIT-OPD-2026-8819', 'RX-2026-7712'],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: '33333333-1111-4333-8333-000000000002',
    tenantId: '11111111-1111-4111-8111-111111111111',
    consentRequestId: 'CR-2026-9015',
    artefactId: 'ART-9921-8841',
    patientAbhaAddress: 'meenakshi.s@sbx',
    patientName: 'Meenakshi Sundaram',
    requesterHipOrHiu: 'Tata Memorial Centre (HIU-TMC-02)',
    purposeCode: 'CARETREAT',
    purposeDescription: 'Oncology Baseline Staging & Biomarker Investigation Transfer',
    dateFrom: new Date(Date.now() - 60 * 86400000).toISOString(),
    dateTo: new Date(Date.now() + 45 * 86400000).toISOString(),
    dataEraseDate: new Date(Date.now() + 90 * 86400000).toISOString(),
    status: 'GRANTED',
    grantedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    linkedCareContextRefs: ['LAB-2026-90410'],
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
  }
];

export const mockFhirBundles: FhirBundleRecordDto[] = [
  {
    id: '44444444-1111-4444-8444-000000000001',
    tenantId: '11111111-1111-4111-8111-111111111111',
    bundleId: 'bundle-fhir-r4-8819',
    profileType: 'HEALTH_DOCUMENT',
    patientAbhaAddress: 'kailash.verma@abdm',
    patientMrn: 'UHID-2026-8910',
    careContextRef: 'VISIT-OPD-2026-8819',
    documentDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    authorPractitionerHprId: 'HPR-9041-8819-2016',
    authorPractitionerName: 'Dr. Vivek Sharma, MD, DM',
    facilityHfrId: 'IN-DL-HFR-904128',
    fhirJsonPayload: JSON.stringify(
      {
        resourceType: 'Bundle',
        id: 'bundle-fhir-r4-8819',
        meta: {
          profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPDConsultationRecordBundle']
        },
        type: 'document',
        timestamp: new Date().toISOString(),
        entry: [
          {
            resource: {
              resourceType: 'Composition',
              status: 'final',
              title: 'OPD Consultation Clinical Summary',
              subject: { reference: 'Patient/kailash.verma@abdm' },
              date: new Date().toISOString()
            }
          }
        ]
      },
      null,
      2
    ),
    validationStatus: 'VALID_FHIR_R4',
    digitalSignatureHash: 'SHA256:8F9A2B1C3D4E5F6A7B8C9D0E1F2A3B4C-NRCES-VERIFIED',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: '44444444-1111-4444-8444-000000000002',
    tenantId: '11111111-1111-4111-8111-111111111111',
    bundleId: 'bundle-fhir-r4-90410',
    profileType: 'DIAGNOSTIC_REPORT_LAB',
    patientAbhaAddress: 'meenakshi.s@sbx',
    patientMrn: 'UHID-2026-8911',
    careContextRef: 'LAB-2026-90410',
    documentDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    authorPractitionerHprId: 'HPR-9041-2940-1998',
    authorPractitionerName: 'Dr. Ananya Roy, MD (Path)',
    facilityHfrId: 'IN-DL-HFR-904128',
    fhirJsonPayload: JSON.stringify(
      {
        resourceType: 'Bundle',
        id: 'bundle-fhir-r4-90410',
        meta: {
          profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DiagnosticReportLabBundle']
        },
        type: 'document',
        timestamp: new Date().toISOString(),
        entry: [
          {
            resource: {
              resourceType: 'DiagnosticReport',
              status: 'final',
              code: { text: 'Complete Blood Count (CBC) & ESR Panel' },
              subject: { reference: 'Patient/meenakshi.s@sbx' }
            }
          }
        ]
      },
      null,
      2
    ),
    validationStatus: 'VALID_FHIR_R4',
    digitalSignatureHash: 'SHA256:7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E-NRCES-VERIFIED',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

export const mockScanAndShareTokens: AbdmScanAndShareTokenDto[] = [
  {
    id: '55555555-1111-4555-8555-000000000001',
    tokenNumber: 'TKN-042',
    patientAbhaNumber: '91-4920-8812-4019',
    patientAbhaAddress: 'kailash.verma@abdm',
    patientName: 'Kailash Chand Verma',
    gender: 'M',
    dob: '1976-08-14',
    mobile: '+91 98101 23456',
    scannedCounterName: 'Counter 1 (Main Lobby Express)',
    assignedOpdDepartment: 'Cardiology',
    assignedDoctorName: 'Dr. Vivek Sharma',
    status: 'WAITING_AT_COUNTER',
    scannedAt: new Date(Date.now() - 15 * 60000).toISOString()
  },
  {
    id: '55555555-1111-4555-8555-000000000002',
    tokenNumber: 'TKN-043',
    patientAbhaNumber: '91-8831-2940-5512',
    patientAbhaAddress: 'meenakshi.s@sbx',
    patientName: 'Meenakshi Sundaram',
    gender: 'F',
    dob: '1984-03-22',
    mobile: '+91 98450 98765',
    scannedCounterName: 'Counter 2 (FastTrack Registration)',
    assignedOpdDepartment: 'General Surgery',
    assignedDoctorName: 'Dr. Vikram Malhotra',
    status: 'CONVERTED_TO_APPOINTMENT',
    scannedAt: new Date(Date.now() - 8 * 60000).toISOString()
  }
];

export const mockAbdmAuditTraces: AbdmAuditTraceDto[] = [
  {
    id: '66666666-1111-4666-8666-000000000001',
    tenantId: '11111111-1111-4111-8111-111111111111',
    traceNumber: 'TRC-ABDM-9001',
    action: 'LINK_CARE_CONTEXT_M2',
    entityType: 'CARE_CONTEXT',
    entityId: '22222222-1111-4222-8222-000000000001',
    entityCode: 'VISIT-OPD-2026-8819',
    actorName: 'Gateway Daemon',
    actorRole: 'ABDM Bridge Engine',
    justification: 'National Health Authority M2 Discoverability sync succeeded',
    integrityHash: 'SHA256:ECDH-AES-GCM-256-OK',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString()
  },
  {
    id: '66666666-1111-4666-8666-000000000002',
    tenantId: '11111111-1111-4111-8111-111111111111',
    traceNumber: 'TRC-ABDM-9002',
    action: 'GENERATE_FHIR_R4_BUNDLE_M3',
    entityType: 'FHIR_BUNDLE',
    entityId: '44444444-1111-4444-8444-000000000001',
    entityCode: 'bundle-fhir-r4-8819',
    actorName: 'Dr. Vivek Sharma',
    actorRole: 'Consultant Cardiologist',
    justification: 'Signed clinical encounter bundle published to NRCES profile',
    integrityHash: 'SHA256:NRCES-PROFILE-M3-VALID',
    timestamp: new Date(Date.now() - 110 * 60000).toISOString()
  }
];
