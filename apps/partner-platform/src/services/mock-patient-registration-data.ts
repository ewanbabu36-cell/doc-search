import type {
  PatientDto,
  PatientDuplicateCandidateDto,
  PatientMergeEventDto,
  PatientRegistrationAuditTraceDto,
  PatientRegistrationOverviewDto
} from '@docsearch/api-contracts';
import { MOCK_TENANT_ID } from './mock-partner-foundation-data.js';

const MOCK_PARTNER_ID = '22222222-2222-4222-8222-222222222201';
const MOCK_ORG_APEX_ID = '33333333-3333-4333-8333-333333333301';
const MOCK_FAC_DOWNTOWN_ID = '44444444-4444-4444-8444-444444444401';
const MOCK_FAC_WESTSIDE_ID = '44444444-4444-4444-8444-444444444402';

export const MOCK_PATIENTS: PatientDto[] = [
  {
    id: '99999999-1111-4999-8111-999999999901',
    tenantId: MOCK_TENANT_ID,
    partnerId: MOCK_PARTNER_ID,
    organizationId: MOCK_ORG_APEX_ID,
    organizationName: 'Apex Multi-Specialty Clinics',
    branchId: MOCK_FAC_DOWNTOWN_ID,
    branchName: 'Apex Downtown Care Center',
    mrn: 'DS-ORG001-000001',
    patientCode: 'PAT-001',
    firstName: 'Eleanor',
    lastName: 'Vance',
    fullName: 'Eleanor Vance — Sample Patient',
    dateOfBirth: '1984-06-15',
    gender: 'FEMALE',
    bloodGroup: 'O_POSITIVE',
    maritalStatus: 'MARRIED',
    nationality: 'American',
    preferredLanguage: 'English',
    occupation: 'Architectural Consultant',
    status: 'ACTIVE',
    registrationSource: 'RECEPTION_DESK',
    primaryContact: {
      id: '81111111-1111-4111-8111-111111111101',
      tenantId: MOCK_TENANT_ID,
      partnerId: MOCK_PARTNER_ID,
      patientId: '99999999-1111-4999-8111-999999999901',
      primaryMobile: '+1 (555) 234-5678',
      email: 'e.vance@example.docsearch.health',
      preferredContactMethod: 'MOBILE',
      metadata: {},
      createdAt: '2026-01-18T10:00:00.000Z',
      updatedAt: '2026-01-18T10:00:00.000Z'
    },
    primaryAddress: {
      id: '82222222-1111-4222-8111-222222222201',
      tenantId: MOCK_TENANT_ID,
      partnerId: MOCK_PARTNER_ID,
      patientId: '99999999-1111-4999-8111-999999999901',
      addressType: 'RESIDENTIAL',
      addressLine1: '742 Evergreen Terrace — Sample Ref',
      city: 'Springfield',
      state: 'CA',
      country: 'USA',
      postalCode: '97477',
      isPrimary: true,
      metadata: {},
      createdAt: '2026-01-18T10:00:00.000Z',
      updatedAt: '2026-01-18T10:00:00.000Z'
    },
    emergencyContacts: [
      {
        id: '83333333-1111-4333-8111-333333333301',
        tenantId: MOCK_TENANT_ID,
        partnerId: MOCK_PARTNER_ID,
        patientId: '99999999-1111-4999-8111-999999999901',
        contactName: 'Arthur Vance',
        relationship: 'SPOUSE',
        primaryPhone: '+1 (555) 234-9999',
        isPrimary: true,
        metadata: {},
        createdAt: '2026-01-18T10:00:00.000Z',
        updatedAt: '2026-01-18T10:00:00.000Z'
      }
    ],
    identifiers: [
      {
        id: '84444444-1111-4444-8111-444444444401',
        tenantId: MOCK_TENANT_ID,
        partnerId: MOCK_PARTNER_ID,
        organizationId: MOCK_ORG_APEX_ID,
        patientId: '99999999-1111-4999-8111-999999999901',
        identifierType: 'MRN',
        identifierValue: 'DS-ORG001-000001',
        issuingAuthority: 'Apex Health Alliance',
        status: 'ACTIVE',
        metadata: {},
        createdAt: '2026-01-18T10:00:00.000Z',
        updatedAt: '2026-01-18T10:00:00.000Z'
      },
      {
        id: '84444444-1111-4444-8111-444444444402',
        tenantId: MOCK_TENANT_ID,
        partnerId: MOCK_PARTNER_ID,
        organizationId: MOCK_ORG_APEX_ID,
        patientId: '99999999-1111-4999-8111-999999999901',
        identifierType: 'DRIVER_LICENSE_REF',
        identifierValue: 'DL-CA-992182-SAMPLE-REF',
        issuingAuthority: 'State DMV',
        status: 'ACTIVE',
        metadata: {},
        createdAt: '2026-01-18T10:00:00.000Z',
        updatedAt: '2026-01-18T10:00:00.000Z'
      }
    ],
    consents: [
      {
        id: '85555555-1111-4555-8111-555555555501',
        tenantId: MOCK_TENANT_ID,
        partnerId: MOCK_PARTNER_ID,
        organizationId: MOCK_ORG_APEX_ID,
        patientId: '99999999-1111-4999-8111-999999999901',
        consentType: 'GENERAL_REGISTRATION',
        consentStatus: 'GRANTED',
        effectiveDate: '2026-01-18T10:00:00.000Z',
        recordedBy: 'reception-desk-01',
        auditReference: 'CNS-REG-001',
        metadata: {},
        createdAt: '2026-01-18T10:00:00.000Z',
        updatedAt: '2026-01-18T10:00:00.000Z'
      },
      {
        id: '85555555-1111-4555-8111-555555555502',
        tenantId: MOCK_TENANT_ID,
        partnerId: MOCK_PARTNER_ID,
        organizationId: MOCK_ORG_APEX_ID,
        patientId: '99999999-1111-4999-8111-999999999901',
        consentType: 'COMMUNICATION_SMS_EMAIL',
        consentStatus: 'GRANTED',
        effectiveDate: '2026-01-18T10:00:00.000Z',
        recordedBy: 'reception-desk-01',
        auditReference: 'CNS-COM-001',
        metadata: {},
        createdAt: '2026-01-18T10:00:00.000Z',
        updatedAt: '2026-01-18T10:00:00.000Z'
      }
    ],
    insurancePolicies: [
      {
        id: '86666666-1111-4666-8111-666666666601',
        tenantId: MOCK_TENANT_ID,
        partnerId: MOCK_PARTNER_ID,
        organizationId: MOCK_ORG_APEX_ID,
        patientId: '99999999-1111-4999-8111-999999999901',
        payerName: 'Apex Blue Horizon PPO',
        policyNumber: 'POL-9921001-SAMPLE',
        memberId: 'MEM-8812-SAMPLE',
        planName: 'Comprehensive Executive Care Tier 1',
        tpaName: 'National Health TPA Services',
        coverageType: 'PRIMARY',
        eligibilityStatus: 'ACTIVE',
        coverageStartDate: '2026-01-01T00:00:00.000Z',
        coverageEndDate: '2026-12-31T23:59:59.000Z',
        metadata: {},
        createdAt: '2026-01-18T10:00:00.000Z',
        updatedAt: '2026-01-18T10:00:00.000Z'
      }
    ],
    metadata: { triagePriority: 'ROUTINE', notes: 'Prefers morning appointments' },
    createdAt: '2026-01-18T10:00:00.000Z',
    updatedAt: '2026-01-18T10:00:00.000Z'
  },
  {
    id: '99999999-1111-4999-8111-999999999902',
    tenantId: MOCK_TENANT_ID,
    partnerId: MOCK_PARTNER_ID,
    organizationId: MOCK_ORG_APEX_ID,
    organizationName: 'Apex Multi-Specialty Clinics',
    branchId: MOCK_FAC_DOWNTOWN_ID,
    branchName: 'Apex Downtown Care Center',
    mrn: 'DS-ORG001-000002',
    patientCode: 'PAT-002',
    firstName: 'David',
    lastName: 'Miller',
    fullName: 'David Miller — Sample Patient',
    dateOfBirth: '1972-11-20',
    gender: 'MALE',
    bloodGroup: 'A_POSITIVE',
    maritalStatus: 'SINGLE',
    nationality: 'American',
    preferredLanguage: 'English',
    occupation: 'Financial Analyst',
    status: 'ACTIVE',
    registrationSource: 'RECEPTION_DESK',
    primaryContact: {
      id: '81111111-1111-4111-8111-111111111102',
      tenantId: MOCK_TENANT_ID,
      partnerId: MOCK_PARTNER_ID,
      patientId: '99999999-1111-4999-8111-999999999902',
      primaryMobile: '+1 (555) 876-5432',
      email: 'd.miller@example.docsearch.health',
      preferredContactMethod: 'MOBILE',
      metadata: {},
      createdAt: '2026-01-20T14:30:00.000Z',
      updatedAt: '2026-01-20T14:30:00.000Z'
    },
    primaryAddress: {
      id: '82222222-1111-4222-8111-222222222202',
      tenantId: MOCK_TENANT_ID,
      partnerId: MOCK_PARTNER_ID,
      patientId: '99999999-1111-4999-8111-999999999902',
      addressType: 'RESIDENTIAL',
      addressLine1: '1204 Pine Valley Rd — Sample Ref',
      city: 'Downtown',
      state: 'CA',
      country: 'USA',
      postalCode: '90210',
      isPrimary: true,
      metadata: {},
      createdAt: '2026-01-20T14:30:00.000Z',
      updatedAt: '2026-01-20T14:30:00.000Z'
    },
    emergencyContacts: [
      {
        id: '83333333-1111-4333-8111-333333333302',
        tenantId: MOCK_TENANT_ID,
        partnerId: MOCK_PARTNER_ID,
        patientId: '99999999-1111-4999-8111-999999999902',
        contactName: 'Karen Miller',
        relationship: 'SIBLING',
        primaryPhone: '+1 (555) 876-0001',
        isPrimary: true,
        metadata: {},
        createdAt: '2026-01-20T14:30:00.000Z',
        updatedAt: '2026-01-20T14:30:00.000Z'
      }
    ],
    identifiers: [
      {
        id: '84444444-1111-4444-8111-444444444403',
        tenantId: MOCK_TENANT_ID,
        partnerId: MOCK_PARTNER_ID,
        organizationId: MOCK_ORG_APEX_ID,
        patientId: '99999999-1111-4999-8111-999999999902',
        identifierType: 'MRN',
        identifierValue: 'DS-ORG001-000002',
        issuingAuthority: 'Apex Health Alliance',
        status: 'ACTIVE',
        metadata: {},
        createdAt: '2026-01-20T14:30:00.000Z',
        updatedAt: '2026-01-20T14:30:00.000Z'
      }
    ],
    consents: [
      {
        id: '85555555-1111-4555-8111-555555555503',
        tenantId: MOCK_TENANT_ID,
        partnerId: MOCK_PARTNER_ID,
        organizationId: MOCK_ORG_APEX_ID,
        patientId: '99999999-1111-4999-8111-999999999902',
        consentType: 'GENERAL_REGISTRATION',
        consentStatus: 'GRANTED',
        effectiveDate: '2026-01-20T14:30:00.000Z',
        recordedBy: 'reception-desk-02',
        auditReference: 'CNS-REG-002',
        metadata: {},
        createdAt: '2026-01-20T14:30:00.000Z',
        updatedAt: '2026-01-20T14:30:00.000Z'
      }
    ],
    insurancePolicies: [
      {
        id: '86666666-1111-4666-8111-666666666602',
        tenantId: MOCK_TENANT_ID,
        partnerId: MOCK_PARTNER_ID,
        organizationId: MOCK_ORG_APEX_ID,
        patientId: '99999999-1111-4999-8111-999999999902',
        payerName: 'Kaiser Commercial Choice',
        policyNumber: 'POL-4412998-SAMPLE',
        memberId: 'MEM-1142-SAMPLE',
        planName: 'Gold Standard Network',
        coverageType: 'PRIMARY',
        eligibilityStatus: 'ACTIVE',
        coverageStartDate: '2026-01-01T00:00:00.000Z',
        coverageEndDate: '2026-12-31T23:59:59.000Z',
        metadata: {},
        createdAt: '2026-01-20T14:30:00.000Z',
        updatedAt: '2026-01-20T14:30:00.000Z'
      }
    ],
    metadata: {},
    createdAt: '2026-01-20T14:30:00.000Z',
    updatedAt: '2026-01-20T14:30:00.000Z'
  },
  {
    id: '99999999-1111-4999-8111-999999999903',
    tenantId: MOCK_TENANT_ID,
    partnerId: MOCK_PARTNER_ID,
    organizationId: MOCK_ORG_APEX_ID,
    organizationName: 'Apex Multi-Specialty Clinics',
    branchId: MOCK_FAC_WESTSIDE_ID,
    branchName: 'Apex Westside Urgent Care',
    mrn: 'DS-ORG001-000003',
    patientCode: 'PAT-003',
    firstName: 'Sophia',
    lastName: 'Patel',
    fullName: 'Sophia Patel — Sample Patient',
    dateOfBirth: '1995-03-08',
    gender: 'FEMALE',
    bloodGroup: 'B_POSITIVE',
    maritalStatus: 'SINGLE',
    nationality: 'American',
    preferredLanguage: 'English',
    occupation: 'Software Engineer',
    status: 'ACTIVE',
    registrationSource: 'ONLINE_PORTAL',
    primaryContact: {
      id: '81111111-1111-4111-8111-111111111103',
      tenantId: MOCK_TENANT_ID,
      partnerId: MOCK_PARTNER_ID,
      patientId: '99999999-1111-4999-8111-999999999903',
      primaryMobile: '+1 (555) 432-1098',
      email: 's.patel@example.docsearch.health',
      preferredContactMethod: 'MOBILE',
      metadata: {},
      createdAt: '2026-02-01T09:15:00.000Z',
      updatedAt: '2026-02-01T09:15:00.000Z'
    },
    primaryAddress: {
      id: '82222222-1111-4222-8111-222222222203',
      tenantId: MOCK_TENANT_ID,
      partnerId: MOCK_PARTNER_ID,
      patientId: '99999999-1111-4999-8111-999999999903',
      addressType: 'RESIDENTIAL',
      addressLine1: '88 Mission Street — Sample Ref',
      city: 'Westside',
      state: 'CA',
      country: 'USA',
      postalCode: '94105',
      isPrimary: true,
      metadata: {},
      createdAt: '2026-02-01T09:15:00.000Z',
      updatedAt: '2026-02-01T09:15:00.000Z'
    },
    emergencyContacts: [
      {
        id: '83333333-1111-4333-8111-333333333303',
        tenantId: MOCK_TENANT_ID,
        partnerId: MOCK_PARTNER_ID,
        patientId: '99999999-1111-4999-8111-999999999903',
        contactName: 'Raj Patel',
        relationship: 'PARENT',
        primaryPhone: '+1 (555) 432-8877',
        isPrimary: true,
        metadata: {},
        createdAt: '2026-02-01T09:15:00.000Z',
        updatedAt: '2026-02-01T09:15:00.000Z'
      }
    ],
    identifiers: [
      {
        id: '84444444-1111-4444-8111-444444444404',
        tenantId: MOCK_TENANT_ID,
        partnerId: MOCK_PARTNER_ID,
        organizationId: MOCK_ORG_APEX_ID,
        patientId: '99999999-1111-4999-8111-999999999903',
        identifierType: 'MRN',
        identifierValue: 'DS-ORG001-000003',
        issuingAuthority: 'Apex Health Alliance',
        status: 'ACTIVE',
        metadata: {},
        createdAt: '2026-02-01T09:15:00.000Z',
        updatedAt: '2026-02-01T09:15:00.000Z'
      }
    ],
    consents: [
      {
        id: '85555555-1111-4555-8111-555555555504',
        tenantId: MOCK_TENANT_ID,
        partnerId: MOCK_PARTNER_ID,
        organizationId: MOCK_ORG_APEX_ID,
        patientId: '99999999-1111-4999-8111-999999999903',
        consentType: 'GENERAL_REGISTRATION',
        consentStatus: 'GRANTED',
        effectiveDate: '2026-02-01T09:15:00.000Z',
        recordedBy: 'self-service-portal',
        auditReference: 'CNS-WEB-003',
        metadata: {},
        createdAt: '2026-02-01T09:15:00.000Z',
        updatedAt: '2026-02-01T09:15:00.000Z'
      }
    ],
    insurancePolicies: [],
    metadata: { paymentType: 'SELF_PAY' },
    createdAt: '2026-02-01T09:15:00.000Z',
    updatedAt: '2026-02-01T09:15:00.000Z'
  },
  {
    id: '99999999-1111-4999-8111-999999999904',
    tenantId: MOCK_TENANT_ID,
    partnerId: MOCK_PARTNER_ID,
    organizationId: MOCK_ORG_APEX_ID,
    organizationName: 'Apex Multi-Specialty Clinics',
    branchId: MOCK_FAC_DOWNTOWN_ID,
    branchName: 'Apex Downtown Care Center',
    mrn: 'DS-ORG001-000004',
    patientCode: 'PAT-004',
    firstName: 'Eleanore',
    lastName: 'Vance',
    fullName: 'Eleanore Vance — Sample Duplicate',
    dateOfBirth: '1984-06-15',
    gender: 'FEMALE',
    bloodGroup: 'O_POSITIVE',
    maritalStatus: 'MARRIED',
    nationality: 'American',
    preferredLanguage: 'English',
    occupation: 'Designer',
    status: 'DUPLICATE_REVIEW',
    registrationSource: 'RECEPTION_DESK',
    primaryContact: {
      id: '81111111-1111-4111-8111-111111111104',
      tenantId: MOCK_TENANT_ID,
      partnerId: MOCK_PARTNER_ID,
      patientId: '99999999-1111-4999-8111-999999999904',
      primaryMobile: '+1 (555) 234-5678',
      email: 'e.vance84@example.docsearch.health',
      preferredContactMethod: 'MOBILE',
      metadata: {},
      createdAt: '2026-02-15T11:00:00.000Z',
      updatedAt: '2026-02-15T11:00:00.000Z'
    },
    primaryAddress: {
      id: '82222222-1111-4222-8111-222222222204',
      tenantId: MOCK_TENANT_ID,
      partnerId: MOCK_PARTNER_ID,
      patientId: '99999999-1111-4999-8111-999999999904',
      addressType: 'RESIDENTIAL',
      addressLine1: '742 Evergreen Ter — Sample Ref',
      city: 'Springfield',
      state: 'CA',
      country: 'USA',
      postalCode: '97477',
      isPrimary: true,
      metadata: {},
      createdAt: '2026-02-15T11:00:00.000Z',
      updatedAt: '2026-02-15T11:00:00.000Z'
    },
    emergencyContacts: [],
    identifiers: [
      {
        id: '84444444-1111-4444-8111-444444444405',
        tenantId: MOCK_TENANT_ID,
        partnerId: MOCK_PARTNER_ID,
        organizationId: MOCK_ORG_APEX_ID,
        patientId: '99999999-1111-4999-8111-999999999904',
        identifierType: 'MRN',
        identifierValue: 'DS-ORG001-000004',
        issuingAuthority: 'Apex Health Alliance',
        status: 'ACTIVE',
        metadata: {},
        createdAt: '2026-02-15T11:00:00.000Z',
        updatedAt: '2026-02-15T11:00:00.000Z'
      }
    ],
    consents: [],
    insurancePolicies: [],
    metadata: { flag: 'Potential duplicate candidate with PAT-001' },
    createdAt: '2026-02-15T11:00:00.000Z',
    updatedAt: '2026-02-15T11:00:00.000Z'
  }
];

export const MOCK_PATIENT_DUPLICATE_CANDIDATES: PatientDuplicateCandidateDto[] = [
  {
    id: '71111111-1111-4111-8111-111111111101',
    tenantId: MOCK_TENANT_ID,
    partnerId: MOCK_PARTNER_ID,
    organizationId: MOCK_ORG_APEX_ID,
    sourcePatientId: '99999999-1111-4999-8111-999999999904',
    sourcePatientName: 'Eleanore Vance (PAT-004)',
    sourceMrn: 'DS-ORG001-000004',
    matchedPatientId: '99999999-1111-4999-8111-999999999901',
    matchedPatientName: 'Eleanor Vance (PAT-001)',
    matchedMrn: 'DS-ORG001-000001',
    confidenceScore: 94.5,
    matchCategory: 'HIGH_CONFIDENCE',
    matchingSignals: [
      'Exact Date of Birth Match (1984-06-15)',
      'Exact Mobile Phone Match (+1 (555) 234-5678)',
      'Normalized Levenshtein Name Match: Eleanor vs Eleanore (95% similarity)',
      'Matching Postal Code (97477)'
    ],
    reviewStatus: 'PENDING_REVIEW',
    metadata: {},
    createdAt: '2026-02-15T11:05:00.000Z',
    updatedAt: '2026-02-15T11:05:00.000Z'
  }
];

export const MOCK_PATIENT_MERGE_EVENTS: PatientMergeEventDto[] = [
  {
    id: '72222222-1111-4222-8111-222222222201',
    tenantId: MOCK_TENANT_ID,
    partnerId: MOCK_PARTNER_ID,
    organizationId: MOCK_ORG_APEX_ID,
    canonicalPatientId: '99999999-1111-4999-8111-999999999902',
    canonicalMrn: 'DS-ORG001-000002',
    mergedPatientId: '99999999-1111-4999-8111-999999999900',
    mergedMrn: 'DS-ORG001-000000',
    actorId: 'usr-admin-apex',
    actorRole: 'HOSPITAL_REGISTRAR',
    mergeReason: 'Consolidated duplicate identity created during emergency walk-in triage with verified historical MRN',
    mergedSnapshot: {
      mergedPatientName: 'David J. Miller',
      dateOfBirth: '1972-11-20',
      reason: 'Confirmed single identity with driver license verification'
    },
    correlationId: 'corr-merge-2026-001',
    mergedAt: '2026-01-25T16:00:00.000Z'
  }
];

export const MOCK_PATIENT_REGISTRATION_AUDIT_TRACES: PatientRegistrationAuditTraceDto[] = [
  {
    id: '73333333-1111-4333-8111-333333333301',
    traceId: 'pat-tr-3001',
    tenantId: MOCK_TENANT_ID,
    partnerId: MOCK_PARTNER_ID,
    organizationId: MOCK_ORG_APEX_ID,
    branchId: MOCK_FAC_DOWNTOWN_ID,
    patientId: '99999999-1111-4999-8111-999999999901',
    actorId: 'reception-desk-01',
    actorRole: 'FRONT_DESK_RECEPTIONIST',
    action: 'PATIENT_REGISTERED',
    targetEntity: 'patients',
    targetEntityId: 'DS-ORG001-000001',
    justification: 'Completed standard outpatient registration and assigned deterministic MRN',
    operationStatus: 'SUCCESS',
    correlationId: 'corr-pat-001',
    metadata: {},
    occurredAt: '2026-01-18T10:00:00.000Z'
  },
  {
    id: '73333333-1111-4333-8111-333333333302',
    traceId: 'pat-tr-3002',
    tenantId: MOCK_TENANT_ID,
    partnerId: MOCK_PARTNER_ID,
    organizationId: MOCK_ORG_APEX_ID,
    branchId: MOCK_FAC_DOWNTOWN_ID,
    patientId: '99999999-1111-4999-8111-999999999901',
    actorId: 'reception-desk-01',
    actorRole: 'FRONT_DESK_RECEPTIONIST',
    action: 'CONSENT_RECORDED',
    targetEntity: 'patient_consents',
    targetEntityId: 'CNS-REG-001',
    justification: 'Executed General Treatment and Communication consent directives',
    operationStatus: 'SUCCESS',
    correlationId: 'corr-pat-002',
    metadata: {},
    occurredAt: '2026-01-18T10:05:00.000Z'
  },
  {
    id: '73333333-1111-4333-8111-333333333303',
    traceId: 'pat-tr-3003',
    tenantId: MOCK_TENANT_ID,
    partnerId: MOCK_PARTNER_ID,
    organizationId: MOCK_ORG_APEX_ID,
    branchId: MOCK_FAC_DOWNTOWN_ID,
    patientId: '99999999-1111-4999-8111-999999999904',
    actorId: 'mpi-duplicate-detector',
    actorRole: 'SYSTEM_SERVICE',
    action: 'DUPLICATE_CANDIDATE_FLAGGED',
    targetEntity: 'patient_duplicate_candidates',
    targetEntityId: '71111111-1111-4111-8111-111111111101',
    justification: 'Automated probabilistic matcher identified 94.5% duplicate confidence with PAT-001',
    operationStatus: 'SUCCESS',
    correlationId: 'corr-pat-003',
    metadata: {},
    occurredAt: '2026-02-15T11:05:00.000Z'
  }
];

export const MOCK_PATIENT_REGISTRATION_OVERVIEW: PatientRegistrationOverviewDto = {
  totalPatientsCount: MOCK_PATIENTS.length,
  activePatientsCount: MOCK_PATIENTS.filter((p) => p.status === 'ACTIVE').length,
  newRegistrationsTodayCount: 2,
  pendingDuplicateReviewsCount: MOCK_PATIENT_DUPLICATE_CANDIDATES.filter((c) => c.reviewStatus === 'PENDING_REVIEW').length,
  mergedRecordsCount: MOCK_PATIENT_MERGE_EVENTS.length,
  insuredPatientsCount: MOCK_PATIENTS.filter((p) => p.insurancePolicies.length > 0).length,
  activeConsentsCount: MOCK_PATIENTS.reduce((sum, p) => sum + p.consents.filter((c) => c.consentStatus === 'GRANTED').length, 0)
};
