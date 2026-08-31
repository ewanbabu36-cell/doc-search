import { z } from 'zod';

export const SecurityRoleTypeSchema = z.enum([
  'SYSTEM',
  'COMPANY',
  'CUSTOM',
  'SERVICE'
]);
export type SecurityRoleType = z.infer<typeof SecurityRoleTypeSchema>;

export const SecurityScopeTypeSchema = z.enum([
  'PLATFORM',
  'COMPANY',
  'BRANCH',
  'PARTNER',
  'RESOURCE'
]);
export type SecurityScopeType = z.infer<typeof SecurityScopeTypeSchema>;

export const SecurityPermissionActionSchema = z.enum([
  'READ',
  'CREATE',
  'UPDATE',
  'DELETE',
  'APPROVE',
  'EXPORT',
  'MANAGE'
]);
export type SecurityPermissionAction = z.infer<typeof SecurityPermissionActionSchema>;

export const SecurityRiskLevelSchema = z.enum([
  'LOW',
  'MODERATE',
  'HIGH',
  'CRITICAL'
]);
export type SecurityRiskLevel = z.infer<typeof SecurityRiskLevelSchema>;

export const SecurityPolicyTypeSchema = z.enum([
  'ACCESS_CONTROL',
  'PASSWORD_SECURITY',
  'SESSION_SECURITY',
  'API_SECURITY',
  'DATA_ACCESS',
  'EXPORT_CONTROL',
  'PRIVILEGE_ESCALATION',
  'AUDIT_RETENTION',
  'BREAK_GLASS_ACCESS'
]);
export type SecurityPolicyType = z.infer<typeof SecurityPolicyTypeSchema>;

export const SecurityPolicyEnforcementSchema = z.enum([
  'ADVISORY',
  'ENFORCED',
  'BLOCKING'
]);
export type SecurityPolicyEnforcement = z.infer<typeof SecurityPolicyEnforcementSchema>;

export const SecurityPolicySeveritySchema = z.enum([
  'INFO',
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
]);
export type SecurityPolicySeverity = z.infer<typeof SecurityPolicySeveritySchema>;

export const SecurityPolicyStatusSchema = z.enum([
  'DRAFT',
  'UNDER_REVIEW',
  'ACTIVE',
  'SUSPENDED',
  'RETIRED'
]);
export type SecurityPolicyStatus = z.infer<typeof SecurityPolicyStatusSchema>;

export const SecuritySessionStatusSchema = z.enum([
  'ACTIVE',
  'IDLE',
  'TERMINATED',
  'EXPIRED'
]);
export type SecuritySessionStatus = z.infer<typeof SecuritySessionStatusSchema>;

export const SecurityCredentialTypeSchema = z.enum([
  'API_KEY',
  'SERVICE_TOKEN',
  'WEBHOOK_SECRET_REFERENCE',
  'INTEGRATION_CREDENTIAL_REFERENCE'
]);
export type SecurityCredentialType = z.infer<typeof SecurityCredentialTypeSchema>;

export const SecurityCredentialStatusSchema = z.enum([
  'ACTIVE',
  'PENDING_ROTATION',
  'EXPIRED',
  'REVOKED'
]);
export type SecurityCredentialStatus = z.infer<typeof SecurityCredentialStatusSchema>;

export const SecurityIncidentCategorySchema = z.enum([
  'UNAUTHORIZED_ACCESS_ATTEMPT',
  'PRIVILEGE_ABUSE',
  'POLICY_VIOLATION',
  'SUSPICIOUS_SESSION',
  'CREDENTIAL_EXPOSURE_RISK',
  'ANOMALOUS_EXPORT'
]);
export type SecurityIncidentCategory = z.infer<typeof SecurityIncidentCategorySchema>;

export const SecurityIncidentSeveritySchema = z.enum([
  'INFO',
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
]);
export type SecurityIncidentSeverity = z.infer<typeof SecurityIncidentSeveritySchema>;

export const SecurityIncidentStatusSchema = z.enum([
  'OPEN',
  'INVESTIGATING',
  'CONTAINED',
  'RESOLVED',
  'FALSE_POSITIVE'
]);
export type SecurityIncidentStatus = z.infer<typeof SecurityIncidentStatusSchema>;

export const SecurityAuditVerificationStatusSchema = z.enum([
  'VERIFIED_VALID',
  'ANOMALY_DETECTED',
  'PENDING_INVESTIGATION',
  'DISPUTED'
]);
export type SecurityAuditVerificationStatus = z.infer<typeof SecurityAuditVerificationStatusSchema>;

// DTOs
export const SecurityRoleDtoSchema = z.object({
  id: z.string().uuid(),
  roleCode: z.string().min(2),
  roleName: z.string().min(2),
  description: z.string(),
  roleType: SecurityRoleTypeSchema,
  scopeType: SecurityScopeTypeSchema,
  status: z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']).default('ACTIVE'),
  isSystemRole: z.boolean().default(false),
  permissionCount: z.number().int().min(0).default(0),
  userCount: z.number().int().min(0).default(0),
  createdById: z.string().uuid().optional(),
  createdByEmail: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type SecurityRoleDto = z.infer<typeof SecurityRoleDtoSchema>;

export const SecurityPermissionDtoSchema = z.object({
  id: z.string().uuid(),
  permissionCode: z.string().min(2),
  permissionName: z.string().min(2),
  domain: z.string().min(2),
  resource: z.string().min(2),
  action: SecurityPermissionActionSchema,
  description: z.string(),
  riskLevel: SecurityRiskLevelSchema,
  status: z.enum(['ACTIVE', 'DEPRECATED']).default('ACTIVE'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type SecurityPermissionDto = z.infer<typeof SecurityPermissionDtoSchema>;

export const SecurityRolePermissionDtoSchema = z.object({
  id: z.string().uuid(),
  roleId: z.string().uuid(),
  roleCode: z.string().optional(),
  permissionId: z.string().uuid(),
  permissionCode: z.string().optional(),
  permissionName: z.string().optional(),
  action: SecurityPermissionActionSchema.optional(),
  riskLevel: SecurityRiskLevelSchema.optional(),
  grantedById: z.string().uuid().optional(),
  grantedByEmail: z.string(),
  grantedAt: z.string().datetime()
});
export type SecurityRolePermissionDto = z.infer<typeof SecurityRolePermissionDtoSchema>;

export const SecurityUserRoleDtoSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  userEmail: z.string().email(),
  userName: z.string().optional(),
  roleId: z.string().uuid(),
  roleCode: z.string(),
  roleName: z.string(),
  scopeType: SecurityScopeTypeSchema,
  scopeReference: z.string(),
  assignedById: z.string().uuid().optional(),
  assignedByEmail: z.string(),
  assignedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'EXPIRED']).default('ACTIVE'),
  isHighRisk: z.boolean().default(false)
});
export type SecurityUserRoleDto = z.infer<typeof SecurityUserRoleDtoSchema>;

export const SecurityPolicyDtoSchema = z.object({
  id: z.string().uuid(),
  policyCode: z.string().min(2),
  name: z.string().min(2),
  description: z.string(),
  policyType: SecurityPolicyTypeSchema,
  severity: SecurityPolicySeveritySchema,
  status: SecurityPolicyStatusSchema,
  rules: z.array(z.string()).default([]),
  enforcementMode: SecurityPolicyEnforcementSchema,
  effectiveDate: z.string().datetime().optional(),
  expirationDate: z.string().datetime().optional(),
  ownerId: z.string().uuid().optional(),
  ownerEmail: z.string(),
  approvedById: z.string().uuid().optional(),
  approvedByEmail: z.string().optional(),
  approvedAt: z.string().datetime().optional(),
  version: z.string().default('1.0.0'),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type SecurityPolicyDto = z.infer<typeof SecurityPolicyDtoSchema>;

export const SecuritySessionDtoSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string(),
  userId: z.string().uuid(),
  userEmail: z.string().email(),
  authenticationMethod: z.string(),
  ipHash: z.string(),
  deviceFingerprintHash: z.string(),
  userAgentSummary: z.string(),
  scope: SecurityScopeTypeSchema,
  status: SecuritySessionStatusSchema,
  startedAt: z.string().datetime(),
  lastActivityAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  terminatedAt: z.string().datetime().optional(),
  terminationReason: z.string().optional(),
  metadata: z.record(z.unknown()).default({})
});
export type SecuritySessionDto = z.infer<typeof SecuritySessionDtoSchema>;

export const SecurityCredentialDtoSchema = z.object({
  id: z.string().uuid(),
  credentialCode: z.string(),
  credentialType: SecurityCredentialTypeSchema,
  ownerType: z.string(),
  ownerReference: z.string(),
  status: SecurityCredentialStatusSchema,
  createdById: z.string().uuid().optional(),
  createdByEmail: z.string(),
  createdAt: z.string().datetime(),
  lastRotatedAt: z.string().datetime().optional(),
  nextRotationDue: z.string().datetime().optional(),
  revokedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({})
});
export type SecurityCredentialDto = z.infer<typeof SecurityCredentialDtoSchema>;

export const SecurityIncidentDtoSchema = z.object({
  id: z.string().uuid(),
  incidentCode: z.string(),
  category: SecurityIncidentCategorySchema,
  severity: SecurityIncidentSeveritySchema,
  title: z.string().min(3),
  description: z.string(),
  source: z.string(),
  status: SecurityIncidentStatusSchema,
  assignedToId: z.string().uuid().optional(),
  assignedToEmail: z.string().optional(),
  detectedAt: z.string().datetime(),
  acknowledgedAt: z.string().datetime().optional(),
  resolvedAt: z.string().datetime().optional(),
  resolutionNotes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type SecurityIncidentDto = z.infer<typeof SecurityIncidentDtoSchema>;

export const SecurityAuditVerificationDtoSchema = z.object({
  id: z.string().uuid(),
  verificationCode: z.string(),
  auditEventReference: z.string(),
  verificationType: z.string(),
  verificationStatus: SecurityAuditVerificationStatusSchema,
  verifiedById: z.string().uuid().optional(),
  verifiedByEmail: z.string(),
  verifiedAt: z.string().datetime(),
  evidenceReference: z.string(),
  notes: z.string(),
  createdAt: z.string().datetime()
});
export type SecurityAuditVerificationDto = z.infer<typeof SecurityAuditVerificationDtoSchema>;

export const SecurityOverviewDtoSchema = z.object({
  activeRolesCount: z.number().int().min(0),
  totalPermissionsCount: z.number().int().min(0),
  activePoliciesCount: z.number().int().min(0),
  openIncidentsCount: z.number().int().min(0),
  activeSessionsCount: z.number().int().min(0),
  credentialsPendingRotationCount: z.number().int().min(0),
  verifiedAuditCount: z.number().int().min(0),
  telemetryStatus: z.string()
});
export type SecurityOverviewDto = z.infer<typeof SecurityOverviewDtoSchema>;

// Requests
export const CreateRoleRequestSchema = z.object({
  roleCode: z.string().min(2),
  roleName: z.string().min(2),
  description: z.string().min(5),
  roleType: SecurityRoleTypeSchema,
  scopeType: SecurityScopeTypeSchema,
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateRoleRequest = z.infer<typeof CreateRoleRequestSchema>;

export const UpdateRoleRequestSchema = z.object({
  roleName: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']).optional(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type UpdateRoleRequest = z.infer<typeof UpdateRoleRequestSchema>;

export const AssignPermissionRequestSchema = z.object({
  roleId: z.string().uuid(),
  permissionId: z.string().uuid(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type AssignPermissionRequest = z.infer<typeof AssignPermissionRequestSchema>;

export const AssignUserRoleRequestSchema = z.object({
  userId: z.string().uuid(),
  userEmail: z.string().email(),
  roleId: z.string().uuid(),
  scopeType: SecurityScopeTypeSchema,
  scopeReference: z.string().min(2),
  expiresAt: z.string().datetime().optional(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type AssignUserRoleRequest = z.infer<typeof AssignUserRoleRequestSchema>;

export const RevokeUserRoleRequestSchema = z.object({
  userRoleId: z.string().uuid(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type RevokeUserRoleRequest = z.infer<typeof RevokeUserRoleRequestSchema>;

export const CreateSecurityPolicyRequestSchema = z.object({
  policyCode: z.string().min(2),
  name: z.string().min(2),
  description: z.string().min(5),
  policyType: SecurityPolicyTypeSchema,
  severity: SecurityPolicySeveritySchema,
  rules: z.array(z.string()).min(1),
  enforcementMode: SecurityPolicyEnforcementSchema,
  ownerEmail: z.string().email(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateSecurityPolicyRequest = z.infer<typeof CreateSecurityPolicyRequestSchema>;

export const TransitionSecurityPolicyRequestSchema = z.object({
  toStatus: SecurityPolicyStatusSchema,
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type TransitionSecurityPolicyRequest = z.infer<typeof TransitionSecurityPolicyRequestSchema>;

export const TerminateSessionRequestSchema = z.object({
  sessionId: z.string(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type TerminateSessionRequest = z.infer<typeof TerminateSessionRequestSchema>;

export const RotateCredentialRequestSchema = z.object({
  credentialCode: z.string(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type RotateCredentialRequest = z.infer<typeof RotateCredentialRequestSchema>;

export const RevokeCredentialRequestSchema = z.object({
  credentialCode: z.string(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type RevokeCredentialRequest = z.infer<typeof RevokeCredentialRequestSchema>;

export const CreateSecurityIncidentRequestSchema = z.object({
  category: SecurityIncidentCategorySchema,
  severity: SecurityIncidentSeveritySchema,
  title: z.string().min(3),
  description: z.string().min(5),
  source: z.string(),
  actorEmail: z.string().email()
});
export type CreateSecurityIncidentRequest = z.infer<typeof CreateSecurityIncidentRequestSchema>;

export const AcknowledgeSecurityIncidentRequestSchema = z.object({
  incidentId: z.string().uuid(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type AcknowledgeSecurityIncidentRequest = z.infer<typeof AcknowledgeSecurityIncidentRequestSchema>;

export const ResolveSecurityIncidentRequestSchema = z.object({
  incidentId: z.string().uuid(),
  resolutionStatus: SecurityIncidentStatusSchema,
  resolutionNotes: z.string().min(3),
  actorEmail: z.string().email()
});
export type ResolveSecurityIncidentRequest = z.infer<typeof ResolveSecurityIncidentRequestSchema>;

export const VerifyAuditEventRequestSchema = z.object({
  auditEventReference: z.string(),
  verificationType: z.string(),
  verificationStatus: SecurityAuditVerificationStatusSchema,
  evidenceReference: z.string(),
  notes: z.string().min(3),
  actorEmail: z.string().email()
});
export type VerifyAuditEventRequest = z.infer<typeof VerifyAuditEventRequestSchema>;
