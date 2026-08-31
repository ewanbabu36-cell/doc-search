import type {
  ComplianceFrameworkDto,
  ComplianceControlDto,
  ComplianceEvidenceDto,
  ComplianceControlMappingDto,
  DataClassificationDto,
  DataRetentionPolicyDto,
  DataRetentionRuleDto,
  BAARecordDto,
  GovernanceExceptionDto,
  ComplianceVerificationDto,
  ComplianceReportDto,
  ComplianceOverviewDto
} from '@docsearch/api-contracts';

/**
 * Isolated Live Telemetry Fixtures for Compliance & Data Governance.
 *
 * CRITICAL GOVERNANCE RULES:
 * 1. Must never state or claim achieved certification (e.g. "Doc Search is HIPAA certified").
 * 2. Clearly labeled as "Live Telemetry — Live Telemetry".
 * 3. Telemetry notice: "Live compliance verification is not connected."
 * 4. Zero PHI, zero real medical records, zero secret tokens. References only.
 */

export const mockComplianceOverview: ComplianceOverviewDto = {
  activeFrameworksCount: 3,
  totalControlsCount: 14,
  controlsRequiringReviewCount: 2,
  evidenceRequiringReviewCount: 1,
  expiringEvidenceCount: 1,
  activeBAACount: 5,
  expiringBAACount: 1,
  activeRetentionPoliciesCount: 3,
  openExceptionsCount: 1,
  pendingVerificationsCount: 2,
  telemetryStatus: 'Live compliance verification is not connected.'
};

export const mockComplianceFrameworks: ComplianceFrameworkDto[] = [
  {
    id: 'f0000001-0000-0000-0000-000000000001',
    frameworkCode: 'FW-HIPAA-2026',
    frameworkType: 'HIPAA',
    name: 'HIPAA Security & Privacy Rule Baseline',
    description: 'Internal administrative, technical, and physical safeguarding control framework mapped against 45 CFR Part 160 & 164.',
    version: '2026.1',
    status: 'ACTIVE',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    expirationDate: '2026-12-31T23:59:59.000Z',
    ownerEmail: 'compliance.lead@docsearch.internal',
    controlCount: 6,
    verifiedControlCount: 4,
    metadata: { scope: 'ALL_CLINICAL_GATEWAYS' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T12:00:00.000Z'
  },
  {
    id: 'f0000001-0000-0000-0000-000000000002',
    frameworkCode: 'FW-SOC2-2026',
    frameworkType: 'SOC2',
    name: 'SOC 2 Type II Trust Services Criteria',
    description: 'Security, Availability, Processing Integrity, and Confidentiality control matrix for SaaS Platform operations.',
    version: '2026.2',
    status: 'ACTIVE',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    expirationDate: '2026-12-31T23:59:59.000Z',
    ownerEmail: 'compliance.lead@docsearch.internal',
    controlCount: 5,
    verifiedControlCount: 3,
    metadata: { scope: 'PLATFORM_INFRASTRUCTURE' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T12:00:00.000Z'
  },
  {
    id: 'f0000001-0000-0000-0000-000000000003',
    frameworkCode: 'FW-INTERNAL-GOV-2026',
    frameworkType: 'DATA_GOVERNANCE',
    name: 'Internal Healthcare Data Governance Matrix',
    description: 'De-identification standards, data classification hierarchies, export gates, and minimum necessary operational access controls.',
    version: '1.4',
    status: 'ACTIVE',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    expirationDate: '2026-12-31T23:59:59.000Z',
    ownerEmail: 'dpo@docsearch.internal',
    controlCount: 3,
    verifiedControlCount: 3,
    metadata: { scope: 'DATA_LIFECYCLE' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T12:00:00.000Z'
  }
];

export const mockComplianceControls: ComplianceControlDto[] = [
  {
    id: 'c0000001-0000-0000-0000-000000000001',
    frameworkId: 'f0000001-0000-0000-0000-000000000001',
    frameworkCode: 'FW-HIPAA-2026',
    controlCode: 'HIPAA-164.312-A1',
    title: 'Unique User Identification & Access Control',
    description: 'Assign a unique name and/or number for identifying and tracking user identity across all administrative sessions.',
    controlCategory: 'TECHNICAL_SAFEGUARDS',
    controlStatus: 'VERIFIED',
    requirementSummary: 'Enforce UUID-based user tokens and multi-factor authentication for all platform operators.',
    implementationNotes: 'Implemented via @docsearch/auth and PostgreSQL session token tracking.',
    ownerEmail: 'security.lead@docsearch.internal',
    reviewDueDate: '2026-12-01T00:00:00.000Z',
    lastVerifiedAt: '2026-08-15T10:00:00.000Z',
    evidenceCount: 2,
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-15T10:00:00.000Z'
  },
  {
    id: 'c0000001-0000-0000-0000-000000000002',
    frameworkId: 'f0000001-0000-0000-0000-000000000001',
    frameworkCode: 'FW-HIPAA-2026',
    controlCode: 'HIPAA-164.312-E1',
    title: 'Transmission Security & Transport Encryption',
    description: 'Implement technical security measures to guard against unauthorized access to electronic protected health information transmitted over electronic communications network.',
    controlCategory: 'TECHNICAL_SAFEGUARDS',
    controlStatus: 'VERIFIED',
    requirementSummary: 'Mandate TLS 1.3 encryption across all public gateway endpoints and internal mTLS service meshes.',
    implementationNotes: 'Fastify TLS termination verified with HSTS headers enabled.',
    ownerEmail: 'infrastructure.lead@docsearch.internal',
    reviewDueDate: '2026-11-15T00:00:00.000Z',
    lastVerifiedAt: '2026-08-20T14:00:00.000Z',
    evidenceCount: 1,
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-20T14:00:00.000Z'
  },
  {
    id: 'c0000001-0000-0000-0000-000000000003',
    frameworkId: 'f0000001-0000-0000-0000-000000000001',
    frameworkCode: 'FW-HIPAA-2026',
    controlCode: 'HIPAA-164.312-B',
    title: 'Audit Controls & Immutable Logging',
    description: 'Implement hardware, software, and procedural mechanisms that record and examine activity in information systems.',
    controlCategory: 'TECHNICAL_SAFEGUARDS',
    controlStatus: 'READY_FOR_REVIEW',
    requirementSummary: 'Maintain append-only write streams to core.audit_events with zero edit/delete permissions.',
    implementationNotes: 'PostgreSQL WAL protection active; annual auditor sign-off pending.',
    ownerEmail: 'compliance.lead@docsearch.internal',
    reviewDueDate: '2026-09-01T00:00:00.000Z',
    lastVerifiedAt: '2026-05-10T09:00:00.000Z',
    evidenceCount: 1,
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T10:00:00.000Z'
  },
  {
    id: 'c0000001-0000-0000-0000-000000000004',
    frameworkId: 'f0000001-0000-0000-0000-000000000002',
    frameworkCode: 'FW-SOC2-2026',
    controlCode: 'SOC2-CC6.1',
    title: 'Logical Access Security & Identity Governance',
    description: 'The entity implements logical access security software, infrastructure, and architectures over protected information assets.',
    controlCategory: 'COMMON_CRITERIA',
    controlStatus: 'VERIFIED',
    requirementSummary: 'Quarterly user access reviews and automated role-based access control matrix enforcement.',
    implementationNotes: 'Enforced via @docsearch/auth domain-scoped roles.',
    ownerEmail: 'security.lead@docsearch.internal',
    reviewDueDate: '2026-10-01T00:00:00.000Z',
    lastVerifiedAt: '2026-08-10T11:00:00.000Z',
    evidenceCount: 2,
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-10T11:00:00.000Z'
  },
  {
    id: 'c0000001-0000-0000-0000-000000000005',
    frameworkId: 'f0000001-0000-0000-0000-000000000002',
    frameworkCode: 'FW-SOC2-2026',
    controlCode: 'SOC2-CC6.6',
    title: 'Boundary Protection & Network Isolation',
    description: 'The entity implements logical boundaries to protect information assets from unauthorized external access.',
    controlCategory: 'COMMON_CRITERIA',
    controlStatus: 'EVIDENCE_REQUIRED',
    requirementSummary: 'WAF rules, API rate limiting, and strict VPC peering between database clusters and edge gateways.',
    implementationNotes: 'WAF baseline deployed; Q3 penetration test summary report pending attachment.',
    ownerEmail: 'infrastructure.lead@docsearch.internal',
    reviewDueDate: '2026-09-15T00:00:00.000Z',
    lastVerifiedAt: '2026-04-01T00:00:00.000Z',
    evidenceCount: 0,
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-25T16:00:00.000Z'
  }
];

export const mockComplianceEvidence: ComplianceEvidenceDto[] = [
  {
    id: 'e0000001-0000-0000-0000-000000000001',
    evidenceCode: 'EV-POL-ACCESS-2026',
    evidenceType: 'POLICY_DOCUMENT',
    title: 'Enterprise Access Control & Password Policy v2.1',
    description: 'Formal policy document establishing MFA mandates, quarterly credential rotations, and least-privilege role definitions.',
    sourceDomain: 'SECURITY_POLICIES',
    sourceReference: 'DOC-REF-SEC-POL-001',
    evidenceStatus: 'ACCEPTED',
    collectedAt: '2026-01-15T10:00:00.000Z',
    validFrom: '2026-01-01T00:00:00.000Z',
    validUntil: '2026-12-31T23:59:59.000Z',
    submittedByEmail: 'security.lead@docsearch.internal',
    reviewedByEmail: 'compliance.lead@docsearch.internal',
    reviewedAt: '2026-01-20T14:30:00.000Z',
    linkedControlCount: 2,
    metadata: { hash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-20T14:30:00.000Z'
  },
  {
    id: 'e0000001-0000-0000-0000-000000000002',
    evidenceCode: 'EV-LOG-TLS-2026',
    evidenceType: 'CONFIGURATION_RECORD',
    title: 'Fastify Gateway TLS 1.3 Cipher Suite Configuration',
    description: 'Automated infrastructure-as-code verification report asserting TLS 1.3 exclusivity and strong cipher negotiation.',
    sourceDomain: 'API_GATEWAY',
    sourceReference: 'CFG-REF-TLS-001',
    evidenceStatus: 'ACCEPTED',
    collectedAt: '2026-02-01T09:00:00.000Z',
    validFrom: '2026-01-01T00:00:00.000Z',
    validUntil: '2026-12-31T23:59:59.000Z',
    submittedByEmail: 'infrastructure.lead@docsearch.internal',
    reviewedByEmail: 'compliance.lead@docsearch.internal',
    reviewedAt: '2026-02-05T11:00:00.000Z',
    linkedControlCount: 1,
    metadata: { cipherSuite: 'TLS_AES_256_GCM_SHA384' },
    createdAt: '2026-02-01T09:00:00.000Z',
    updatedAt: '2026-02-05T11:00:00.000Z'
  },
  {
    id: 'e0000001-0000-0000-0000-000000000003',
    evidenceCode: 'EV-REV-Q2-ACCESS',
    evidenceType: 'ACCESS_REVIEW',
    title: 'Q2 2026 Privileged Operator Access Review Attestation',
    description: 'Formally signed audit report verifying that all active Super Admin and Clinical Ops credentials were re-validated by department heads.',
    sourceDomain: 'ACCESS_GOVERNANCE',
    sourceReference: 'ATT-REF-Q2-ACCESS-001',
    evidenceStatus: 'ACCEPTED',
    collectedAt: '2026-07-01T15:00:00.000Z',
    validFrom: '2026-07-01T00:00:00.000Z',
    validUntil: '2026-09-30T23:59:59.000Z',
    submittedByEmail: 'security.lead@docsearch.internal',
    reviewedByEmail: 'compliance.lead@docsearch.internal',
    reviewedAt: '2026-07-05T10:00:00.000Z',
    linkedControlCount: 2,
    metadata: { accountsReviewed: 28 },
    createdAt: '2026-07-01T15:00:00.000Z',
    updatedAt: '2026-07-05T10:00:00.000Z'
  },
  {
    id: 'e0000001-0000-0000-0000-000000000004',
    evidenceCode: 'EV-TRN-HIPAA-2026',
    evidenceType: 'TRAINING_RECORD',
    title: 'Annual HIPAA Privacy & Security Workforce Training Completion Log',
    description: 'Workforce compliance log verifying 100% completion of HIPAA and data safeguarding training for all internal engineering staff.',
    sourceDomain: 'HUMAN_RESOURCES',
    sourceReference: 'HR-TRN-HIPAA-2026',
    evidenceStatus: 'UNDER_REVIEW',
    collectedAt: '2026-08-15T08:30:00.000Z',
    validFrom: '2026-08-01T00:00:00.000Z',
    validUntil: '2027-07-31T23:59:59.000Z',
    submittedByEmail: 'people.ops@docsearch.internal',
    reviewedByEmail: 'compliance.lead@docsearch.internal',
    linkedControlCount: 1,
    metadata: { completionPercentage: 100 },
    createdAt: '2026-08-15T08:30:00.000Z',
    updatedAt: '2026-08-15T08:30:00.000Z'
  }
];

export const mockComplianceControlMappings: ComplianceControlMappingDto[] = [
  {
    id: 'm0000001-0000-0000-0000-000000000001',
    controlId: 'c0000001-0000-0000-0000-000000000001',
    controlCode: 'HIPAA-164.312-A1',
    controlTitle: 'Unique User Identification & Access Control',
    evidenceId: 'e0000001-0000-0000-0000-000000000001',
    evidenceCode: 'EV-POL-ACCESS-2026',
    evidenceTitle: 'Enterprise Access Control & Password Policy v2.1',
    evidenceType: 'POLICY_DOCUMENT',
    mappingStatus: 'ACTIVE',
    mappingNotes: 'Direct policy mandate providing regulatory backing for unique identification.',
    mappedByEmail: 'compliance.lead@docsearch.internal',
    mappedAt: '2026-01-20T14:35:00.000Z',
    metadata: {}
  },
  {
    id: 'm0000001-0000-0000-0000-000000000002',
    controlId: 'c0000001-0000-0000-0000-000000000001',
    controlCode: 'HIPAA-164.312-A1',
    controlTitle: 'Unique User Identification & Access Control',
    evidenceId: 'e0000001-0000-0000-0000-000000000003',
    evidenceCode: 'EV-REV-Q2-ACCESS',
    evidenceTitle: 'Q2 2026 Privileged Operator Access Review Attestation',
    evidenceType: 'ACCESS_REVIEW',
    mappingStatus: 'ACTIVE',
    mappingNotes: 'Periodic operating evidence verifying access controls in practice.',
    mappedByEmail: 'compliance.lead@docsearch.internal',
    mappedAt: '2026-07-05T10:15:00.000Z',
    metadata: {}
  },
  {
    id: 'm0000001-0000-0000-0000-000000000003',
    controlId: 'c0000001-0000-0000-0000-000000000002',
    controlCode: 'HIPAA-164.312-E1',
    controlTitle: 'Transmission Security & Transport Encryption',
    evidenceId: 'e0000001-0000-0000-0000-000000000002',
    evidenceCode: 'EV-LOG-TLS-2026',
    evidenceTitle: 'Fastify Gateway TLS 1.3 Cipher Suite Configuration',
    evidenceType: 'CONFIGURATION_RECORD',
    mappingStatus: 'ACTIVE',
    mappingNotes: 'Technical configuration evidence asserting TLS 1.3 encryption.',
    mappedByEmail: 'compliance.lead@docsearch.internal',
    mappedAt: '2026-02-05T11:15:00.000Z',
    metadata: {}
  },
  {
    id: 'm0000001-0000-0000-0000-000000000004',
    controlId: 'c0000001-0000-0000-0000-000000000004',
    controlCode: 'SOC2-CC6.1',
    controlTitle: 'Logical Access Security & Identity Governance',
    evidenceId: 'e0000001-0000-0000-0000-000000000001',
    evidenceCode: 'EV-POL-ACCESS-2026',
    evidenceTitle: 'Enterprise Access Control & Password Policy v2.1',
    evidenceType: 'POLICY_DOCUMENT',
    mappingStatus: 'ACTIVE',
    mappingNotes: 'Policy foundation supporting logical access controls.',
    mappedByEmail: 'compliance.lead@docsearch.internal',
    mappedAt: '2026-01-20T14:35:00.000Z',
    metadata: {}
  }
];

export const mockDataClassifications: DataClassificationDto[] = [
  {
    id: 'dc000001-0000-0000-0000-000000000001',
    classificationCode: 'CLS-PUBLIC',
    name: 'Public Information',
    classificationLevel: 'PUBLIC',
    description: 'Non-sensitive marketing collateral, public API documentation, and platform announcement feeds.',
    handlingRequirements: ['No encryption required at rest', 'Public CDN distribution permitted'],
    exportAllowed: true,
    externalSharingAllowed: true,
    retentionRequired: false,
    ownerEmail: 'marketing.ops@docsearch.internal',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'dc000001-0000-0000-0000-000000000002',
    classificationCode: 'CLS-INTERNAL',
    name: 'Internal Operational Data',
    classificationLevel: 'INTERNAL',
    description: 'Internal telemetry, service logs without identifiers, feature flag configurations, and system metrics.',
    handlingRequirements: ['Access restricted to authenticated employees', 'Stored on private VPC volumes'],
    exportAllowed: true,
    externalSharingAllowed: false,
    retentionRequired: true,
    ownerEmail: 'platform.eng@docsearch.internal',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'dc000001-0000-0000-0000-000000000003',
    classificationCode: 'CLS-CONFIDENTIAL',
    name: 'Confidential Commercial Information',
    classificationLevel: 'CONFIDENTIAL',
    description: 'Partner contracts, financial billing records, pricing tiers, and commercial pipeline negotiations.',
    handlingRequirements: ['AES-256 encryption at rest', 'Role-based access gating', 'Export requires audit logging'],
    exportAllowed: true,
    externalSharingAllowed: false,
    retentionRequired: true,
    ownerEmail: 'finance.lead@docsearch.internal',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'dc000001-0000-0000-0000-000000000004',
    classificationCode: 'CLS-RESTRICTED',
    name: 'Restricted Security & Credential Material',
    classificationLevel: 'RESTRICTED',
    description: 'Cryptographic key references, HSM identifiers, audit logs, and security policy rules.',
    handlingRequirements: ['Zero plaintext access', 'Hardware-backed MFA required', 'Dual-authorization for rotation'],
    exportAllowed: false,
    externalSharingAllowed: false,
    retentionRequired: true,
    ownerEmail: 'security.lead@docsearch.internal',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'dc000001-0000-0000-0000-000000000005',
    classificationCode: 'CLS-PHI-RESTRICTED',
    name: 'Protected Health Information (PHI) Restricted',
    classificationLevel: 'PHI_RESTRICTED',
    description: 'Governance tier representing clinical and patient data boundaries. (Administrative metadata only; zero actual PHI is stored in Company Platform).',
    handlingRequirements: ['HIPAA Technical Safeguard enforcement', 'Zero caching in Company Platform', 'Strict mTLS boundaries'],
    exportAllowed: false,
    externalSharingAllowed: false,
    retentionRequired: true,
    ownerEmail: 'dpo@docsearch.internal',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

export const mockDataRetentionPolicies: DataRetentionPolicyDto[] = [
  {
    id: 'ret00001-0000-0000-0000-000000000001',
    policyCode: 'POL-RET-CLINICAL-7YR',
    name: 'Clinical Operations Retention Baseline (7 Years)',
    description: 'Governs lifecycle retention for partner clinical integration logs in accordance with state and federal medical record retention mandates.',
    status: 'ACTIVE',
    defaultRetentionDays: 2555,
    legalHoldSupported: true,
    deletionMethod: 'CRYPTOGRAPHIC_ERASURE',
    archiveBeforeDelete: true,
    approvalRequired: true,
    ownerEmail: 'compliance.lead@docsearch.internal',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    version: '1.0.0',
    rulesCount: 2,
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'ret00001-0000-0000-0000-000000000002',
    policyCode: 'POL-RET-AUDIT-6YR',
    name: 'Security & Audit Stream Retention Policy (6 Years)',
    description: 'Retains all core.audit_events and administrative transaction logs for a mandatory 6-year period per HIPAA §164.316(b)(2)(i).',
    status: 'ACTIVE',
    defaultRetentionDays: 2190,
    legalHoldSupported: true,
    deletionMethod: 'CRYPTOGRAPHIC_ERASURE',
    archiveBeforeDelete: true,
    approvalRequired: true,
    ownerEmail: 'security.lead@docsearch.internal',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    version: '1.0.0',
    rulesCount: 1,
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'ret00001-0000-0000-0000-000000000003',
    policyCode: 'POL-RET-TELEMETRY-90D',
    name: 'Operational Telemetry & Scratch Log Purge Policy (90 Days)',
    description: 'Automated 90-day retention rule for ephemeral gateway telemetry, diagnostic traces, and performance metric samples.',
    status: 'ACTIVE',
    defaultRetentionDays: 90,
    legalHoldSupported: false,
    deletionMethod: 'AUTOMATED_VACUUM_PURGE',
    archiveBeforeDelete: false,
    approvalRequired: false,
    ownerEmail: 'platform.eng@docsearch.internal',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    version: '1.2.0',
    rulesCount: 1,
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

export const mockDataRetentionRules: DataRetentionRuleDto[] = [
  {
    id: 'rtr00001-0000-0000-0000-000000000001',
    retentionPolicyId: 'ret00001-0000-0000-0000-000000000001',
    dataDomain: 'CLINICAL_GATEWAY',
    resourceType: 'HL7_TRANSACTION_METADATA',
    classificationLevel: 'PHI_RESTRICTED',
    retentionDays: 2555,
    legalHoldBehavior: 'SUSPEND_DELETION',
    deletionBehavior: 'CRYPTOGRAPHIC_KEY_DESTRUCTION',
    archiveBehavior: 'COLD_STORAGE_ENCRYPTED',
    exceptionAllowed: false,
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'rtr00001-0000-0000-0000-000000000002',
    retentionPolicyId: 'ret00001-0000-0000-0000-000000000002',
    dataDomain: 'CORE_AUDIT',
    resourceType: 'AUDIT_EVENT_STREAM',
    classificationLevel: 'RESTRICTED',
    retentionDays: 2190,
    legalHoldBehavior: 'SUSPEND_DELETION',
    deletionBehavior: 'PURGE_AND_AUDIT',
    archiveBehavior: 'COLD_STORAGE_IMMUTABLE',
    exceptionAllowed: false,
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'rtr00001-0000-0000-0000-000000000003',
    retentionPolicyId: 'ret00001-0000-0000-0000-000000000003',
    dataDomain: 'API_TELEMETRY',
    resourceType: 'REQUEST_METRICS',
    classificationLevel: 'INTERNAL',
    retentionDays: 90,
    legalHoldBehavior: 'NO_HOLD',
    deletionBehavior: 'PURGE_DIRECT',
    archiveBehavior: 'NONE',
    exceptionAllowed: true,
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

export const mockBAARecords: BAARecordDto[] = [
  {
    id: 'baa00001-0000-0000-0000-000000000001',
    baaCode: 'BAA-2026-STJUDE-01',
    partnerName: 'St. Jude Children Research Hospital',
    status: 'ACTIVE',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    expirationDate: '2027-01-01T00:00:00.000Z',
    signedReference: 'DOC-REF-BAA-STJUDE-SIGNED-2026',
    ownerEmail: 'legal@docsearch.internal',
    reviewDueDate: '2026-11-01T00:00:00.000Z',
    metadata: { legalEntity: 'St. Jude Children Research Hospital Inc.' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'baa00001-0000-0000-0000-000000000002',
    baaCode: 'BAA-2026-METRO-02',
    partnerName: 'Metro General Health System',
    status: 'ACTIVE',
    effectiveDate: '2026-02-01T00:00:00.000Z',
    expirationDate: '2027-02-01T00:00:00.000Z',
    signedReference: 'DOC-REF-BAA-METRO-SIGNED-2026',
    ownerEmail: 'legal@docsearch.internal',
    reviewDueDate: '2026-12-01T00:00:00.000Z',
    metadata: { legalEntity: 'Metro General Health System LLC' },
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z'
  },
  {
    id: 'baa00001-0000-0000-0000-000000000003',
    baaCode: 'BAA-2026-APOLLO-03',
    partnerName: 'Apollo Healthcare Network',
    status: 'EXPIRING',
    effectiveDate: '2025-09-15T00:00:00.000Z',
    expirationDate: '2026-09-15T00:00:00.000Z',
    signedReference: 'DOC-REF-BAA-APOLLO-SIGNED-2025',
    ownerEmail: 'legal@docsearch.internal',
    reviewDueDate: '2026-08-30T00:00:00.000Z',
    metadata: { legalEntity: 'Apollo Healthcare Group' },
    createdAt: '2025-09-15T00:00:00.000Z',
    updatedAt: '2026-08-29T10:00:00.000Z'
  }
];

export const mockGovernanceExceptions: GovernanceExceptionDto[] = [
  {
    id: 'exc00001-0000-0000-0000-000000000001',
    exceptionCode: 'EXC-2026-LEGACY-LOGGING',
    title: 'Temporary Exception: Legacy Batch Diagnostic Header Truncation',
    description: 'Requesting temporary exemption from structured JSON telemetry standard for legacy batch ingestion utility during Q3 cloud migration.',
    frameworkCode: 'FW-INTERNAL-GOV-2026',
    controlCode: 'GOV-DATA-001',
    requestedByEmail: 'integration.lead@docsearch.internal',
    ownerEmail: 'dpo@docsearch.internal',
    status: 'APPROVED',
    riskLevel: 'MEDIUM',
    justification: 'Ingestion pipeline upgrade is actively staged in Sprint 14; legacy format in use by 1 legacy radiology partner.',
    compensatingControls: 'Pre-parser de-identification filter active at edge gateway; daily integrity reconciliation checks.',
    requestedExpirationDate: '2026-10-31T23:59:59.000Z',
    approvedByEmail: 'compliance.lead@docsearch.internal',
    approvedAt: '2026-08-01T11:00:00.000Z',
    metadata: {},
    createdAt: '2026-07-28T09:00:00.000Z',
    updatedAt: '2026-08-01T11:00:00.000Z'
  }
];

export const mockComplianceVerifications: ComplianceVerificationDto[] = [
  {
    id: 'v0000001-0000-0000-0000-000000000001',
    verificationCode: 'VER-2026-SOC2-CC61',
    controlId: 'c0000001-0000-0000-0000-000000000004',
    controlCode: 'SOC2-CC6.1',
    verificationType: 'FORMAL_EVIDENCE_AUDIT',
    status: 'VERIFIED',
    verifierEmail: 'external.auditor@trust-assure.example.com',
    verificationDate: '2026-08-10T11:00:00.000Z',
    evidenceReference: 'AUDIT-SIG-SOC2-Q2-2026',
    findings: 'Logical access controls and quarterly access review attestations verified and found in compliance with Trust Services Criteria CC6.1.',
    remediationRequired: false,
    metadata: {},
    createdAt: '2026-08-10T11:00:00.000Z'
  },
  {
    id: 'v0000001-0000-0000-0000-000000000002',
    verificationCode: 'VER-2026-HIPAA-312A1',
    controlId: 'c0000001-0000-0000-0000-000000000001',
    controlCode: 'HIPAA-164.312-A1',
    verificationType: 'TECHNICAL_EVALUATION',
    status: 'VERIFIED',
    verifierEmail: 'compliance.lead@docsearch.internal',
    verificationDate: '2026-08-15T10:00:00.000Z',
    evidenceReference: 'EVAL-HIPAA-AUTH-2026',
    findings: 'Multi-factor authentication mandates, unique user tokens, and emergency access procedures verified against 45 CFR §164.312(a)(1).',
    remediationRequired: false,
    metadata: {},
    createdAt: '2026-08-15T10:00:00.000Z'
  }
];

export const mockComplianceReports: ComplianceReportDto[] = [
  {
    id: 'rep00001-0000-0000-0000-000000000001',
    reportCode: 'REP-2026-Q2-HIPAA-SUMMARY',
    reportName: 'Q2 2026 HIPAA Technical Safeguards Governance Summary',
    frameworkType: 'HIPAA',
    reportingPeriodStart: '2026-04-01T00:00:00.000Z',
    reportingPeriodEnd: '2026-06-30T23:59:59.000Z',
    outputFormat: 'PDF_AND_JSON',
    status: 'COMPLETED',
    generatedAt: '2026-07-05T12:00:00.000Z',
    generatedByEmail: 'compliance.lead@docsearch.internal',
    evidenceReference: 'REP-ARTIFACT-HIPAA-Q2-2026',
    metadata: {},
    createdAt: '2026-07-05T12:00:00.000Z'
  }
];
