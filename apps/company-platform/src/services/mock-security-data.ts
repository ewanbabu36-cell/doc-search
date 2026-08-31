import type {
  SecurityRoleDto,
  SecurityPermissionDto,
  SecurityRolePermissionDto,
  SecurityUserRoleDto,
  SecurityPolicyDto,
  SecuritySessionDto,
  SecurityCredentialDto,
  SecurityIncidentDto,
  SecurityAuditVerificationDto,
  SecurityOverviewDto
} from '@docsearch/api-contracts';

/**
 * Isolated development preview fixtures for Security / RBAC / Policy / Audit.
 * CRITICAL SECURITY & PRIVACY RULES:
 * - Never store or expose raw passwords, raw API secrets, or access tokens.
 * - Zero PHI: no patient identifiers, MRNs, or clinical notes.
 * - All development fixtures explicitly labeled "Live Telemetry — Live Telemetry".
 * - Live security telemetry explicitly marked "Live security telemetry is not connected."
 */

export const mockSecurityRoles: SecurityRoleDto[] = [
  {
    id: 'sec-role-001',
    roleCode: 'SUPER_ADMIN',
    roleName: 'Platform Super Administrator',
    description: 'Unrestricted enterprise administrative access across all platform services, tenants, and infrastructure settings.',
    roleType: 'SYSTEM',
    scopeType: 'PLATFORM',
    status: 'ACTIVE',
    isSystemRole: true,
    permissionCount: 42,
    userCount: 3,
    createdById: '11111111-1111-4111-a111-111111111111',
    createdByEmail: 'system.bootstrap@docsearch.internal',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'sec-role-002',
    roleCode: 'COMPANY_ADMIN',
    roleName: 'Company Platform Operator',
    description: 'Internal operations, commercial management, partner onboarding, and customer success leadership.',
    roleType: 'COMPANY',
    scopeType: 'COMPANY',
    status: 'ACTIVE',
    isSystemRole: true,
    permissionCount: 28,
    userCount: 8,
    createdById: '11111111-1111-4111-a111-111111111111',
    createdByEmail: 'system.bootstrap@docsearch.internal',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-10T00:00:00.000Z'
  },
  {
    id: 'sec-role-003',
    roleCode: 'CLINICAL_SAFETY_OFFICER',
    roleName: 'Clinical AI Safety & Governance Lead',
    description: 'Authority to review and approve AI models, prompt templates, and clinical safety boundary policies.',
    roleType: 'COMPANY',
    scopeType: 'COMPANY',
    status: 'ACTIVE',
    isSystemRole: false,
    permissionCount: 14,
    userCount: 2,
    createdById: '11111111-1111-4111-a111-111111111111',
    createdByEmail: 'cmo.safety@docsearch.internal',
    createdAt: '2026-04-15T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z'
  },
  {
    id: 'sec-role-004',
    roleCode: 'SECURITY_AUDITOR',
    roleName: 'Compliance & Security Auditor',
    description: 'Read-only administrative inspection of immutable audit streams, session telemetry, and verification signatures.',
    roleType: 'CUSTOM',
    scopeType: 'COMPANY',
    status: 'ACTIVE',
    isSystemRole: false,
    permissionCount: 10,
    userCount: 4,
    createdById: '11111111-1111-4111-a111-111111111111',
    createdByEmail: 'ciso.security@docsearch.internal',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-08-25T00:00:00.000Z'
  }
];

export const mockSecurityPermissions: SecurityPermissionDto[] = [
  {
    id: 'perm-001',
    permissionCode: 'security:manage',
    permissionName: 'Manage Platform Security Governance',
    domain: 'SECURITY',
    resource: 'SECURITY_CONFIGURATION',
    action: 'MANAGE',
    description: 'Full administrative modification of security controls, sessions, and credentials.',
    riskLevel: 'CRITICAL',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'perm-002',
    permissionCode: 'role:manage',
    permissionName: 'Manage RBAC Roles',
    domain: 'SECURITY',
    resource: 'ROLES',
    action: 'MANAGE',
    description: 'Create, update, and deprecate enterprise role definitions.',
    riskLevel: 'HIGH',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'perm-003',
    permissionCode: 'permission:assign',
    permissionName: 'Assign Permissions to Roles',
    domain: 'SECURITY',
    resource: 'ROLE_PERMISSIONS',
    action: 'APPROVE',
    description: 'Grant or revoke permissions attached to existing security roles.',
    riskLevel: 'CRITICAL',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'perm-004',
    permissionCode: 'security-policy:approve',
    permissionName: 'Approve Security Policies',
    domain: 'SECURITY',
    resource: 'POLICIES',
    action: 'APPROVE',
    description: 'Sign off on mandatory security and access control policies.',
    riskLevel: 'HIGH',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'perm-005',
    permissionCode: 'audit:verify',
    permissionName: 'Verify Audit Integrity',
    domain: 'AUDIT',
    resource: 'AUDIT_EVENTS',
    action: 'APPROVE',
    description: 'Record cryptographic audit trail verifications and compliance evidence.',
    riskLevel: 'MODERATE',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'perm-006',
    permissionCode: 'session:terminate',
    permissionName: 'Privileged Session Termination',
    domain: 'SECURITY',
    resource: 'SESSIONS',
    action: 'DELETE',
    description: 'Forcefully invalidate active operator or service authentication sessions.',
    riskLevel: 'HIGH',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'perm-007',
    permissionCode: 'credential:revoke',
    permissionName: 'Revoke Security Credentials',
    domain: 'SECURITY',
    resource: 'CREDENTIALS',
    action: 'DELETE',
    description: 'Immediately revoke API keys and service token references.',
    riskLevel: 'HIGH',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'perm-008',
    permissionCode: 'security-incident:resolve',
    permissionName: 'Resolve Security Incidents',
    domain: 'SECURITY',
    resource: 'INCIDENTS',
    action: 'MANAGE',
    description: 'Acknowledge, investigate, and close operational security alerts.',
    riskLevel: 'HIGH',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

export const mockSecurityRolePermissions: SecurityRolePermissionDto[] = [
  {
    id: 'srp-001',
    roleId: 'sec-role-001',
    roleCode: 'SUPER_ADMIN',
    permissionId: 'perm-001',
    permissionCode: 'security:manage',
    permissionName: 'Manage Platform Security Governance',
    action: 'MANAGE',
    riskLevel: 'CRITICAL',
    grantedByEmail: 'system.bootstrap@docsearch.internal',
    grantedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'srp-002',
    roleId: 'sec-role-001',
    roleCode: 'SUPER_ADMIN',
    permissionId: 'perm-002',
    permissionCode: 'role:manage',
    permissionName: 'Manage RBAC Roles',
    action: 'MANAGE',
    riskLevel: 'HIGH',
    grantedByEmail: 'system.bootstrap@docsearch.internal',
    grantedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'srp-003',
    roleId: 'sec-role-004',
    roleCode: 'SECURITY_AUDITOR',
    permissionId: 'perm-005',
    permissionCode: 'audit:verify',
    permissionName: 'Verify Audit Integrity',
    action: 'APPROVE',
    riskLevel: 'MODERATE',
    grantedByEmail: 'ciso.security@docsearch.internal',
    grantedAt: '2026-05-01T00:00:00.000Z'
  }
];

export const mockSecurityUserRoles: SecurityUserRoleDto[] = [
  {
    id: 'sur-001',
    userId: '11111111-1111-4111-a111-111111111111',
    userEmail: 'executive.lead@docsearch.internal',
    userName: 'Executive Lead',
    roleId: 'sec-role-001',
    roleCode: 'SUPER_ADMIN',
    roleName: 'Platform Super Administrator',
    scopeType: 'PLATFORM',
    scopeReference: 'GLOBAL-PLATFORM-HQ',
    assignedByEmail: 'system.bootstrap@docsearch.internal',
    assignedAt: '2026-01-01T00:00:00.000Z',
    status: 'ACTIVE',
    isHighRisk: true
  },
  {
    id: 'sur-002',
    userId: '22222222-2222-4222-a222-222222222222',
    userEmail: 'cmo.safety@docsearch.internal',
    userName: 'Chief Medical Safety Officer',
    roleId: 'sec-role-003',
    roleCode: 'CLINICAL_SAFETY_OFFICER',
    roleName: 'Clinical AI Safety & Governance Lead',
    scopeType: 'COMPANY',
    scopeReference: 'DOC-SEARCH-HQ',
    assignedByEmail: 'executive.lead@docsearch.internal',
    assignedAt: '2026-04-15T00:00:00.000Z',
    status: 'ACTIVE',
    isHighRisk: false
  },
  {
    id: 'sur-003',
    userId: '33333333-3333-4333-a333-333333333333',
    userEmail: 'auditor.lead@external-soc2.org',
    userName: 'External SOC2 Lead Auditor',
    roleId: 'sec-role-004',
    roleCode: 'SECURITY_AUDITOR',
    roleName: 'Compliance & Security Auditor',
    scopeType: 'COMPANY',
    scopeReference: 'DOC-SEARCH-HQ',
    assignedByEmail: 'executive.lead@docsearch.internal',
    assignedAt: '2026-08-01T00:00:00.000Z',
    expiresAt: '2026-11-01T00:00:00.000Z',
    status: 'ACTIVE',
    isHighRisk: false
  }
];

export const mockSecurityPolicies: SecurityPolicyDto[] = [
  {
    id: 'sec-pol-001',
    policyCode: 'POL-SEC-MFA-001',
    name: 'Mandatory Multi-Factor Authentication Policy',
    description: 'Enforces hardware security key (FIDO2/WebAuthn) or TOTP MFA for all Company Platform administrative accounts.',
    policyType: 'PASSWORD_SECURITY',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    rules: [
      'MFA enrollment required prior to first administrative action.',
      'Session max lifetime capped at 8 hours.',
      'Re-authentication required for privileged credential or policy changes.'
    ],
    enforcementMode: 'BLOCKING',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    ownerEmail: 'ciso.security@docsearch.internal',
    approvedByEmail: 'executive.lead@docsearch.internal',
    approvedAt: '2026-01-01T00:00:00.000Z',
    version: '1.0.0',
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'sec-pol-002',
    policyCode: 'POL-SEC-CRED-ROTATION-002',
    name: '90-Day Integration Credential Rotation Mandate',
    description: 'Automates rotation warnings for partner API keys and service tokens exceeding 90 days of continuous active lifecycle.',
    policyType: 'API_SECURITY',
    severity: 'HIGH',
    status: 'ACTIVE',
    rules: [
      'Automated warning emitted at 75 days.',
      'Automatic deprecation enforcement at 90 days.',
      'Cryptographic reference-only token tracking.'
    ],
    enforcementMode: 'ENFORCED',
    effectiveDate: '2026-02-01T00:00:00.000Z',
    ownerEmail: 'ciso.security@docsearch.internal',
    approvedByEmail: 'executive.lead@docsearch.internal',
    approvedAt: '2026-02-01T00:00:00.000Z',
    version: '1.1.0',
    metadata: {},
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z'
  }
];

export const mockSecuritySessions: SecuritySessionDto[] = [
  {
    id: 'sess-001',
    sessionId: 'sess-20260829-918273',
    userId: '11111111-1111-4111-a111-111111111111',
    userEmail: 'executive.lead@docsearch.internal',
    authenticationMethod: 'FIDO2_HARDWARE_KEY',
    ipHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    deviceFingerprintHash: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    userAgentSummary: 'macOS / Chrome 128 / Hardware Token',
    scope: 'PLATFORM',
    status: 'ACTIVE',
    startedAt: '2026-08-29T08:00:00.000Z',
    lastActivityAt: '2026-08-29T13:20:00.000Z',
    expiresAt: '2026-08-29T16:00:00.000Z',
    metadata: {}
  },
  {
    id: 'sess-002',
    sessionId: 'sess-20260829-482910',
    userId: '33333333-3333-4333-a333-333333333333',
    userEmail: 'auditor.lead@external-soc2.org',
    authenticationMethod: 'TOTP_MFA',
    ipHash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    deviceFingerprintHash: '35a9e381b1a27567549b5f8a6f783c167ebf80963bac71010b9fff1040711f0c',
    userAgentSummary: 'Windows 11 / Edge 128 / Read-Only Auditor',
    scope: 'COMPANY',
    status: 'ACTIVE',
    startedAt: '2026-08-29T11:00:00.000Z',
    lastActivityAt: '2026-08-29T12:45:00.000Z',
    expiresAt: '2026-08-29T19:00:00.000Z',
    metadata: {}
  }
];

export const mockSecurityCredentials: SecurityCredentialDto[] = [
  {
    id: 'cred-001',
    credentialCode: 'CRED-API-METROHEALTH-PROD',
    credentialType: 'API_KEY',
    ownerType: 'PARTNER',
    ownerReference: 'Metro Health Alliance (Tier 1)',
    status: 'ACTIVE',
    createdByEmail: 'ciso.security@docsearch.internal',
    createdAt: '2026-06-01T00:00:00.000Z',
    lastRotatedAt: '2026-06-01T00:00:00.000Z',
    nextRotationDue: '2026-08-30T00:00:00.000Z',
    expiresAt: '2026-09-01T00:00:00.000Z',
    metadata: {
      keyFingerprint: 'sha256:8f43...9b12',
      rateLimitTier: 'ENTERPRISE_5000_RPS'
    }
  },
  {
    id: 'cred-002',
    credentialCode: 'CRED-SVC-FHIR-CONNECTOR',
    credentialType: 'SERVICE_TOKEN',
    ownerType: 'INTERNAL_SERVICE',
    ownerReference: 'DocSearch FHIR Interop Gateway',
    status: 'ACTIVE',
    createdByEmail: 'platform.lead@docsearch.internal',
    createdAt: '2026-07-01T00:00:00.000Z',
    lastRotatedAt: '2026-07-01T00:00:00.000Z',
    nextRotationDue: '2026-10-01T00:00:00.000Z',
    metadata: {
      keyFingerprint: 'sha256:1a9c...77df'
    }
  }
];

export const mockSecurityIncidents: SecurityIncidentDto[] = [
  {
    id: 'inc-001',
    incidentCode: 'SEC-INC-2026-08-01',
    category: 'POLICY_VIOLATION',
    severity: 'MEDIUM',
    title: 'Anomalous Export Volume Threshold Triggered',
    description: 'Aggregated analytics report batch export attempted outside standard operating hours; request throttled by POL-SEC-EXPORT-001 gate.',
    source: 'Fastify API Gateway Rate Limiter',
    status: 'OPEN',
    assignedToEmail: 'security.lead@docsearch.internal',
    detectedAt: '2026-08-29T03:15:00.000Z',
    metadata: {
      ipOrigin: 'Sample Subnet Mask'
    },
    createdAt: '2026-08-29T03:15:00.000Z',
    updatedAt: '2026-08-29T03:15:00.000Z'
  },
  {
    id: 'inc-002',
    incidentCode: 'SEC-INC-2026-08-02',
    category: 'CREDENTIAL_EXPOSURE_RISK',
    severity: 'LOW',
    title: 'Approaching 90-Day Key Rotation Lifecycle Threshold',
    description: 'Partner API key CRED-API-METROHEALTH-PROD is scheduled for rotation within 48 hours.',
    source: 'Credential Lifecycle Daemon',
    status: 'INVESTIGATING',
    assignedToEmail: 'ciso.security@docsearch.internal',
    detectedAt: '2026-08-28T09:00:00.000Z',
    acknowledgedAt: '2026-08-28T10:00:00.000Z',
    metadata: {},
    createdAt: '2026-08-28T09:00:00.000Z',
    updatedAt: '2026-08-28T10:00:00.000Z'
  }
];

export const mockSecurityAuditVerifications: SecurityAuditVerificationDto[] = [
  {
    id: 'verif-001',
    verificationCode: 'VERIF-SOC2-2026-Q3-01',
    auditEventReference: 'evt-20260829-001842',
    verificationType: 'IMMUTABLE_HASH_VERIFICATION',
    verificationStatus: 'VERIFIED_VALID',
    verifiedByEmail: 'auditor.lead@external-soc2.org',
    verifiedAt: '2026-08-29T12:00:00.000Z',
    evidenceReference: 'EVID-SOC2-CC6.1-AUDIT-CHAIN-08',
    notes: 'Cryptographic SHA-256 hash chain validated against immutable PostgreSQL Write-Ahead Log backup.',
    createdAt: '2026-08-29T12:00:00.000Z'
  }
];

export const mockSecurityOverview: SecurityOverviewDto = {
  activeRolesCount: 4,
  totalPermissionsCount: 8,
  activePoliciesCount: 2,
  openIncidentsCount: 2,
  activeSessionsCount: 2,
  credentialsPendingRotationCount: 1,
  verifiedAuditCount: 1,
  telemetryStatus: 'Live security telemetry is not connected.'
};
