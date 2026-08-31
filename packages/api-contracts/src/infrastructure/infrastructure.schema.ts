import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const InfrastructureProjectTypeSchema = z.enum([
  'PLATFORM',
  'API',
  'DATABASE',
  'INFRASTRUCTURE',
  'OBSERVABILITY',
  'DISASTER_RECOVERY'
]);
export type InfrastructureProjectType = z.infer<typeof InfrastructureProjectTypeSchema>;

export const InfrastructureProjectStatusSchema = z.enum([
  'ACTIVE',
  'MAINTENANCE',
  'DEPRECATED',
  'ARCHIVED'
]);
export type InfrastructureProjectStatus = z.infer<typeof InfrastructureProjectStatusSchema>;

export const InfrastructureClusterTypeSchema = z.enum([
  'APPLICATION',
  'DATABASE',
  'WORKER',
  'OBSERVABILITY',
  'DR'
]);
export type InfrastructureClusterType = z.infer<typeof InfrastructureClusterTypeSchema>;

export const InfrastructureOrchestrationTypeSchema = z.enum([
  'KUBERNETES',
  'CONTAINER',
  'VM_CLUSTER',
  'MANAGED_SERVICE',
  'OTHER'
]);
export type InfrastructureOrchestrationType = z.infer<typeof InfrastructureOrchestrationTypeSchema>;

export const InfrastructureClusterStatusSchema = z.enum([
  'HEALTHY',
  'DEGRADED',
  'UNAVAILABLE',
  'MAINTENANCE',
  'PROVISIONING'
]);
export type InfrastructureClusterStatus = z.infer<typeof InfrastructureClusterStatusSchema>;

export const InfrastructureNodeTypeSchema = z.enum([
  'COMPUTE',
  'DATABASE',
  'WORKER',
  'CACHE',
  'QUEUE',
  'INGRESS',
  'OBSERVABILITY'
]);
export type InfrastructureNodeType = z.infer<typeof InfrastructureNodeTypeSchema>;

export const InfrastructureServiceTypeSchema = z.enum([
  'API',
  'WEB',
  'WORKER',
  'DATABASE',
  'QUEUE',
  'CACHE',
  'SCHEDULER',
  'OBSERVABILITY'
]);
export type InfrastructureServiceType = z.infer<typeof InfrastructureServiceTypeSchema>;

export const InfrastructureDatabaseTypeSchema = z.enum([
  'POSTGRESQL',
  'MYSQL',
  'REDIS',
  'DOCUMENT_DB',
  'OTHER'
]);
export type InfrastructureDatabaseType = z.infer<typeof InfrastructureDatabaseTypeSchema>;

export const DatabaseReplicationModeSchema = z.enum([
  'SINGLE_REGION',
  'MULTI_REGION',
  'PRIMARY_REPLICA',
  'ACTIVE_PASSIVE'
]);
export type DatabaseReplicationMode = z.infer<typeof DatabaseReplicationModeSchema>;

export const ConnectionPoolStatusSchema = z.enum([
  'HEALTHY',
  'SATURATED',
  'DEGRADED',
  'UNAVAILABLE',
  'UNKNOWN'
]);
export type ConnectionPoolStatus = z.infer<typeof ConnectionPoolStatusSchema>;

export const InfrastructureRegionStatusSchema = z.enum([
  'ACTIVE',
  'DEGRADED',
  'MAINTENANCE',
  'UNAVAILABLE'
]);
export type InfrastructureRegionStatus = z.infer<typeof InfrastructureRegionStatusSchema>;

export const InfrastructureReplicationStatusSchema = z.enum([
  'HEALTHY',
  'DEGRADED',
  'BROKEN',
  'PAUSED',
  'UNKNOWN'
]);
export type InfrastructureReplicationStatus = z.infer<typeof InfrastructureReplicationStatusSchema>;

export const InfrastructureHealthStatusSchema = z.enum([
  'HEALTHY',
  'DEGRADED',
  'UNAVAILABLE',
  'UNKNOWN',
  'PENDING_TELEMETRY_PIPELINE'
]);
export type InfrastructureHealthStatus = z.infer<typeof InfrastructureHealthStatusSchema>;

export const InfrastructureAlertSeveritySchema = z.enum([
  'INFO',
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
]);
export type InfrastructureAlertSeverity = z.infer<typeof InfrastructureAlertSeveritySchema>;

export const InfrastructureAlertStatusSchema = z.enum([
  'OPEN',
  'ACKNOWLEDGED',
  'INVESTIGATING',
  'RESOLVED',
  'FALSE_POSITIVE'
]);
export type InfrastructureAlertStatus = z.infer<typeof InfrastructureAlertStatusSchema>;

export const InfrastructureIncidentCategorySchema = z.enum([
  'CLUSTER_FAILURE',
  'NODE_FAILURE',
  'DATABASE_FAILURE',
  'CONNECTION_POOL_EXHAUSTION',
  'REGION_OUTAGE',
  'REPLICATION_FAILURE',
  'BACKUP_FAILURE',
  'RESTORE_FAILURE',
  'SERVICE_DEGRADATION',
  'NETWORK_FAILURE',
  'CAPACITY_EXHAUSTION',
  'DR_FAILURE',
  'FAILOVER_FAILURE',
  'MONITORING_FAILURE'
]);
export type InfrastructureIncidentCategory = z.infer<typeof InfrastructureIncidentCategorySchema>;

export const BackupTypeSchema = z.enum([
  'FULL',
  'INCREMENTAL',
  'SNAPSHOT',
  'ARCHIVE'
]);
export type BackupType = z.infer<typeof BackupTypeSchema>;

export const BackupStatusSchema = z.enum([
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'EXPIRED',
  'PURGED'
]);
export type BackupStatus = z.infer<typeof BackupStatusSchema>;

export const BackupVerificationStatusSchema = z.enum([
  'PENDING',
  'VERIFIED',
  'FAILED',
  'NOT_VERIFIED'
]);
export type BackupVerificationStatus = z.infer<typeof BackupVerificationStatusSchema>;

export const RestoreVerificationTypeSchema = z.enum([
  'AUTOMATED',
  'MANUAL',
  'DR_REHEARSAL'
]);
export type RestoreVerificationType = z.infer<typeof RestoreVerificationTypeSchema>;

export const RestoreVerificationStatusSchema = z.enum([
  'PENDING',
  'RUNNING',
  'PASSED',
  'FAILED',
  'CANCELLED'
]);
export type RestoreVerificationStatus = z.infer<typeof RestoreVerificationStatusSchema>;

export const DRFailoverStrategySchema = z.enum([
  'MANUAL',
  'SEMI_AUTOMATED',
  'AUTOMATED'
]);
export type DRFailoverStrategy = z.infer<typeof DRFailoverStrategySchema>;

export const DRPlanStatusSchema = z.enum([
  'DRAFT',
  'ACTIVE',
  'UNDER_REVIEW',
  'DEPRECATED'
]);
export type DRPlanStatus = z.infer<typeof DRPlanStatusSchema>;

export const DRDrillTypeSchema = z.enum([
  'TABLETOP',
  'FAILOVER_SIMULATION',
  'RESTORE_TEST',
  'REGION_FAILOVER',
  'FULL_DR_REHEARSAL'
]);
export type DRDrillType = z.infer<typeof DRDrillTypeSchema>;

export const DRDrillStatusSchema = z.enum([
  'SCHEDULED',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
]);
export type DRDrillStatus = z.infer<typeof DRDrillStatusSchema>;

export const DRDrillResultSchema = z.enum([
  'PASSED',
  'PASSED_WITH_FINDINGS',
  'FAILED',
  'NOT_EVALUATED'
]);
export type DRDrillResult = z.infer<typeof DRDrillResultSchema>;

export const FailoverTriggerTypeSchema = z.enum([
  'MANUAL',
  'AUTOMATED',
  'DRILL',
  'INCIDENT'
]);
export type FailoverTriggerType = z.infer<typeof FailoverTriggerTypeSchema>;

export const FailoverStatusSchema = z.enum([
  'REQUESTED',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
  'ROLLED_BACK',
  'CANCELLED'
]);
export type FailoverStatus = z.infer<typeof FailoverStatusSchema>;

export const InfrastructureAuditStatusSchema = z.enum([
  'SUCCESS',
  'FAILURE',
  'DENIED',
  'SIMULATED'
]);
export type InfrastructureAuditStatus = z.infer<typeof InfrastructureAuditStatusSchema>;

// ==========================================
// DTOs
// ==========================================

export const InfrastructureProjectDtoSchema = z.object({
  id: z.string().uuid(),
  projectCode: z.string().min(2),
  projectName: z.string().min(2),
  description: z.string(),
  projectType: InfrastructureProjectTypeSchema,
  repositoryReference: z.string(),
  ownerEmail: z.string().email(),
  status: InfrastructureProjectStatusSchema,
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type InfrastructureProjectDto = z.infer<typeof InfrastructureProjectDtoSchema>;

export const InfrastructureClusterDtoSchema = z.object({
  id: z.string().uuid(),
  clusterCode: z.string().min(2),
  clusterName: z.string().min(2),
  provider: z.string(), // e.g. AWS_EKS, GCP_GKE, LOCAL_DOCKER
  regionId: z.string().uuid(),
  regionCode: z.string().optional(),
  environment: z.string().default('PRODUCTION'),
  clusterType: InfrastructureClusterTypeSchema,
  orchestrationType: InfrastructureOrchestrationTypeSchema,
  status: InfrastructureClusterStatusSchema,
  nodeCount: z.number().int().min(0).default(0),
  versionReference: z.string(),
  ownerEmail: z.string().email(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type InfrastructureClusterDto = z.infer<typeof InfrastructureClusterDtoSchema>;

export const InfrastructureNodeDtoSchema = z.object({
  id: z.string().uuid(),
  nodeCode: z.string().min(2),
  clusterId: z.string().uuid(),
  clusterName: z.string().optional(),
  nodeName: z.string().min(2),
  nodeType: InfrastructureNodeTypeSchema,
  instanceReference: z.string(), // e.g. m6i.xlarge, c6g.2xlarge
  cpuCapacity: z.string(), // e.g. "4 vCPU"
  memoryCapacity: z.string(), // e.g. "16 GiB"
  status: z.enum(['READY', 'NOT_READY', 'DRAINING', 'PROVISIONING']),
  availabilityZoneReference: z.string(),
  environment: z.string().default('PRODUCTION'),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type InfrastructureNodeDto = z.infer<typeof InfrastructureNodeDtoSchema>;

export const InfrastructureServiceDtoSchema = z.object({
  id: z.string().uuid(),
  serviceCode: z.string().min(2),
  serviceName: z.string().min(2),
  serviceType: InfrastructureServiceTypeSchema,
  clusterId: z.string().uuid(),
  clusterName: z.string().optional(),
  environment: z.string().default('PRODUCTION'),
  status: z.enum(['RUNNING', 'DEGRADED', 'STOPPED', 'RESTARTING']),
  healthStatus: InfrastructureHealthStatusSchema,
  versionReference: z.string(),
  ownerEmail: z.string().email(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type InfrastructureServiceDto = z.infer<typeof InfrastructureServiceDtoSchema>;

export const InfrastructureDatabaseDtoSchema = z.object({
  id: z.string().uuid(),
  databaseCode: z.string().min(2),
  databaseName: z.string().min(2),
  databaseType: InfrastructureDatabaseTypeSchema,
  clusterId: z.string().uuid().optional(),
  regionId: z.string().uuid(),
  regionCode: z.string().optional(),
  environment: z.string().default('PRODUCTION'),
  status: z.enum(['ONLINE', 'DEGRADED', 'MAINTENANCE', 'FAILOVER_IN_PROGRESS', 'OFFLINE']),
  engineVersion: z.string(), // e.g. PostgreSQL 16.2
  replicationMode: DatabaseReplicationModeSchema,
  backupPolicyId: z.string().uuid().optional(),
  backupPolicyName: z.string().optional(),
  ownerEmail: z.string().email(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type InfrastructureDatabaseDto = z.infer<typeof InfrastructureDatabaseDtoSchema>;

export const DatabaseConnectionPoolDtoSchema = z.object({
  id: z.string().uuid(),
  poolCode: z.string().min(2),
  databaseId: z.string().uuid(),
  databaseName: z.string().optional(),
  environment: z.string().default('PRODUCTION'),
  maxConnections: z.number().int().min(1),
  activeConnections: z.number().int().min(0),
  idleConnections: z.number().int().min(0),
  waitingConnections: z.number().int().min(0),
  connectionTimeoutMs: z.number().int().min(100),
  status: ConnectionPoolStatusSchema,
  lastCheckedAt: z.string().datetime(),
  metadata: z.record(z.unknown()).default({})
});
export type DatabaseConnectionPoolDto = z.infer<typeof DatabaseConnectionPoolDtoSchema>;

export const InfrastructureRegionDtoSchema = z.object({
  id: z.string().uuid(),
  regionCode: z.string().min(2),
  regionName: z.string().min(2),
  provider: z.string(), // AWS, GCP, Azure, OnPrem
  geographicReference: z.string(), // e.g. North Virginia (US), Ohio (US)
  status: InfrastructureRegionStatusSchema,
  isPrimary: z.boolean().default(false),
  isDrRegion: z.boolean().default(false),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type InfrastructureRegionDto = z.infer<typeof InfrastructureRegionDtoSchema>;

export const InfrastructureReplicationLinkDtoSchema = z.object({
  id: z.string().uuid(),
  replicationCode: z.string().min(2),
  sourceRegionId: z.string().uuid(),
  sourceRegionCode: z.string().optional(),
  targetRegionId: z.string().uuid(),
  targetRegionCode: z.string().optional(),
  sourceDatabaseId: z.string().uuid(),
  sourceDatabaseName: z.string().optional(),
  targetDatabaseId: z.string().uuid(),
  targetDatabaseName: z.string().optional(),
  replicationMode: DatabaseReplicationModeSchema,
  status: InfrastructureReplicationStatusSchema,
  lagReference: z.string().default('0s (Synchronous Multi-AZ)'),
  lastVerifiedAt: z.string().datetime(),
  failureCount: z.number().int().min(0).default(0),
  metadata: z.record(z.unknown()).default({})
});
export type InfrastructureReplicationLinkDto = z.infer<typeof InfrastructureReplicationLinkDtoSchema>;

export const InfrastructureHealthSnapshotDtoSchema = z.object({
  id: z.string().uuid(),
  resourceType: z.string(),
  resourceReference: z.string(),
  environment: z.string().default('PRODUCTION'),
  healthStatus: InfrastructureHealthStatusSchema,
  availabilityStatus: z.string(),
  cpuUtilizationReference: z.string(),
  memoryUtilizationReference: z.string(),
  latencyReference: z.string(),
  errorRateReference: z.string(),
  checkedAt: z.string().datetime(),
  checkSource: z.string(),
  sourceStatus: z.string().default('PENDING_TELEMETRY_PIPELINE'),
  metadata: z.record(z.unknown()).default({})
});
export type InfrastructureHealthSnapshotDto = z.infer<typeof InfrastructureHealthSnapshotDtoSchema>;

export const InfrastructureAlertDtoSchema = z.object({
  id: z.string().uuid(),
  alertCode: z.string().min(2),
  resourceType: z.string(),
  resourceReference: z.string(),
  severity: InfrastructureAlertSeveritySchema,
  alertType: z.string(),
  title: z.string().min(2),
  description: z.string(),
  status: InfrastructureAlertStatusSchema,
  detectedAt: z.string().datetime(),
  acknowledgedAt: z.string().datetime().optional(),
  resolvedAt: z.string().datetime().optional(),
  assignedToEmail: z.string().optional(),
  resolutionNotes: z.string().optional(),
  metadata: z.record(z.unknown()).default({})
});
export type InfrastructureAlertDto = z.infer<typeof InfrastructureAlertDtoSchema>;

export const InfrastructureIncidentDtoSchema = z.object({
  id: z.string().uuid(),
  incidentCode: z.string().min(2),
  category: InfrastructureIncidentCategorySchema,
  severity: InfrastructureAlertSeveritySchema,
  title: z.string().min(2),
  description: z.string(),
  source: z.string(),
  environment: z.string().default('PRODUCTION'),
  resourceReference: z.string(),
  status: z.enum(['OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'FALSE_POSITIVE']),
  assignedToEmail: z.string().optional(),
  detectedAt: z.string().datetime(),
  acknowledgedAt: z.string().datetime().optional(),
  containedAt: z.string().datetime().optional(),
  resolvedAt: z.string().datetime().optional(),
  resolutionNotes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type InfrastructureIncidentDto = z.infer<typeof InfrastructureIncidentDtoSchema>;

export const BackupPolicyDtoSchema = z.object({
  id: z.string().uuid(),
  policyCode: z.string().min(2),
  policyName: z.string().min(2),
  resourceType: z.string(),
  scheduleReference: z.string(), // e.g. "Every 6 hours + Continuous WAL"
  retentionDays: z.number().int().min(1),
  retentionPolicy: z.string(),
  encryptionReference: z.string(), // e.g. "AES-256-GCM (AWS KMS)"
  crossRegionEnabled: z.boolean().default(true),
  immutableBackupEnabled: z.boolean().default(true),
  status: z.enum(['ACTIVE', 'PAUSED', 'DEPRECATED']),
  ownerEmail: z.string().email(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type BackupPolicyDto = z.infer<typeof BackupPolicyDtoSchema>;

export const BackupRecordDtoSchema = z.object({
  id: z.string().uuid(),
  backupCode: z.string().min(2),
  policyId: z.string().uuid(),
  policyName: z.string().optional(),
  resourceReference: z.string(),
  environment: z.string().default('PRODUCTION'),
  backupType: BackupTypeSchema,
  status: BackupStatusSchema,
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  sizeReference: z.string(), // e.g. "42.8 GB"
  storageReference: z.string(), // e.g. "s3://docsearch-immutable-backups/prod/..."
  checksumReference: z.string(),
  retentionUntil: z.string().datetime(),
  verificationStatus: BackupVerificationStatusSchema,
  metadata: z.record(z.unknown()).default({})
});
export type BackupRecordDto = z.infer<typeof BackupRecordDtoSchema>;

export const RestoreVerificationDtoSchema = z.object({
  id: z.string().uuid(),
  verificationCode: z.string().min(2),
  backupId: z.string().uuid(),
  backupCode: z.string().optional(),
  targetEnvironment: z.string().default('DISASTER_RECOVERY'),
  verificationType: RestoreVerificationTypeSchema,
  status: RestoreVerificationStatusSchema,
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  verifiedByEmail: z.string().email(),
  evidenceReference: z.string(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({})
});
export type RestoreVerificationDto = z.infer<typeof RestoreVerificationDtoSchema>;

export const DisasterRecoveryPlanDtoSchema = z.object({
  id: z.string().uuid(),
  planCode: z.string().min(2),
  planName: z.string().min(2),
  scope: z.string(),
  primaryRegionId: z.string().uuid(),
  primaryRegionCode: z.string().optional(),
  drRegionId: z.string().uuid(),
  drRegionCode: z.string().optional(),
  rtoMinutes: z.number().int().min(1), // e.g. 15
  rpoMinutes: z.number().int().min(1), // e.g. 5
  failoverStrategy: DRFailoverStrategySchema,
  runbookReference: z.string(),
  lastReviewedAt: z.string().datetime(),
  nextReviewDue: z.string().datetime(),
  status: DRPlanStatusSchema,
  ownerEmail: z.string().email(),
  metadata: z.record(z.unknown()).default({})
});
export type DisasterRecoveryPlanDto = z.infer<typeof DisasterRecoveryPlanDtoSchema>;

export const DisasterRecoveryDrillDtoSchema = z.object({
  id: z.string().uuid(),
  drillCode: z.string().min(2),
  planId: z.string().uuid(),
  planName: z.string().optional(),
  drillType: DRDrillTypeSchema,
  scheduledAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  status: DRDrillStatusSchema,
  expectedRtoMinutes: z.number().int().min(1),
  actualRtoMinutesReference: z.string().optional(),
  expectedRpoMinutes: z.number().int().min(1),
  actualRpoReference: z.string().optional(),
  result: DRDrillResultSchema,
  findingsReference: z.string().optional(),
  evidenceReference: z.string().optional(),
  conductedByEmail: z.string().email(),
  metadata: z.record(z.unknown()).default({})
});
export type DisasterRecoveryDrillDto = z.infer<typeof DisasterRecoveryDrillDtoSchema>;

export const FailoverEventDtoSchema = z.object({
  id: z.string().uuid(),
  failoverCode: z.string().min(2),
  planId: z.string().uuid(),
  planName: z.string().optional(),
  sourceRegionId: z.string().uuid(),
  sourceRegionCode: z.string().optional(),
  targetRegionId: z.string().uuid(),
  targetRegionCode: z.string().optional(),
  environment: z.string().default('PRODUCTION'),
  triggerType: FailoverTriggerTypeSchema,
  status: FailoverStatusSchema,
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  initiatedByEmail: z.string().email(),
  rollbackReference: z.string().optional(),
  reason: z.string(),
  metadata: z.record(z.unknown()).default({})
});
export type FailoverEventDto = z.infer<typeof FailoverEventDtoSchema>;

export const InfrastructureAuditTraceDtoSchema = z.object({
  id: z.string().uuid(),
  traceId: z.string().min(2),
  actorEmail: z.string().email(),
  action: z.string().min(2),
  resourceReference: z.string(),
  environment: z.string().default('PRODUCTION'),
  operationStatus: InfrastructureAuditStatusSchema,
  occurredAt: z.string().datetime(),
  correlationReference: z.string(),
  evidenceReference: z.string(),
  reason: z.string().min(2),
  metadata: z.record(z.unknown()).default({})
});
export type InfrastructureAuditTraceDto = z.infer<typeof InfrastructureAuditTraceDtoSchema>;

export const InfrastructureOverviewDtoSchema = z.object({
  totalRegionsCount: z.number().int().min(0),
  totalClustersCount: z.number().int().min(0),
  totalNodesCount: z.number().int().min(0),
  totalServicesCount: z.number().int().min(0),
  totalDatabasesCount: z.number().int().min(0),
  activeAlertsCount: z.number().int().min(0),
  openIncidentsCount: z.number().int().min(0),
  backupPoliciesCount: z.number().int().min(0),
  activeDrPlansCount: z.number().int().min(0),
  telemetryStatus: z.string()
});
export type InfrastructureOverviewDto = z.infer<typeof InfrastructureOverviewDtoSchema>;

// ==========================================
// Requests
// ==========================================

export const CreateInfrastructureProjectRequestSchema = z.object({
  projectCode: z.string().min(2),
  projectName: z.string().min(2),
  description: z.string().min(5),
  projectType: InfrastructureProjectTypeSchema,
  repositoryReference: z.string().min(2),
  ownerEmail: z.string().email(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateInfrastructureProjectRequest = z.infer<typeof CreateInfrastructureProjectRequestSchema>;

export const CreateClusterRequestSchema = z.object({
  clusterCode: z.string().min(2),
  clusterName: z.string().min(2),
  provider: z.string().min(2),
  regionId: z.string().uuid(),
  environment: z.string().default('PRODUCTION'),
  clusterType: InfrastructureClusterTypeSchema,
  orchestrationType: InfrastructureOrchestrationTypeSchema,
  versionReference: z.string().min(2),
  ownerEmail: z.string().email(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateClusterRequest = z.infer<typeof CreateClusterRequestSchema>;

export const CreateNodeRequestSchema = z.object({
  nodeCode: z.string().min(2),
  clusterId: z.string().uuid(),
  nodeName: z.string().min(2),
  nodeType: InfrastructureNodeTypeSchema,
  instanceReference: z.string().min(2),
  cpuCapacity: z.string().min(2),
  memoryCapacity: z.string().min(2),
  availabilityZoneReference: z.string().min(2),
  environment: z.string().default('PRODUCTION'),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateNodeRequest = z.infer<typeof CreateNodeRequestSchema>;

export const CreateInfrastructureServiceRequestSchema = z.object({
  serviceCode: z.string().min(2),
  serviceName: z.string().min(2),
  serviceType: InfrastructureServiceTypeSchema,
  clusterId: z.string().uuid(),
  environment: z.string().default('PRODUCTION'),
  versionReference: z.string().min(2),
  ownerEmail: z.string().email(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateInfrastructureServiceRequest = z.infer<typeof CreateInfrastructureServiceRequestSchema>;

export const CreateInfrastructureDatabaseRequestSchema = z.object({
  databaseCode: z.string().min(2),
  databaseName: z.string().min(2),
  databaseType: InfrastructureDatabaseTypeSchema,
  clusterId: z.string().uuid().optional(),
  regionId: z.string().uuid(),
  environment: z.string().default('PRODUCTION'),
  engineVersion: z.string().min(2),
  replicationMode: DatabaseReplicationModeSchema,
  ownerEmail: z.string().email(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateInfrastructureDatabaseRequest = z.infer<typeof CreateInfrastructureDatabaseRequestSchema>;

export const UpdateConnectionPoolRequestSchema = z.object({
  poolId: z.string().uuid(),
  maxConnections: z.number().int().min(1),
  connectionTimeoutMs: z.number().int().min(100),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type UpdateConnectionPoolRequest = z.infer<typeof UpdateConnectionPoolRequestSchema>;

export const CreateRegionRequestSchema = z.object({
  regionCode: z.string().min(2),
  regionName: z.string().min(2),
  provider: z.string().min(2),
  geographicReference: z.string().min(2),
  isPrimary: z.boolean().default(false),
  isDrRegion: z.boolean().default(false),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateRegionRequest = z.infer<typeof CreateRegionRequestSchema>;

export const CreateReplicationLinkRequestSchema = z.object({
  replicationCode: z.string().min(2),
  sourceRegionId: z.string().uuid(),
  targetRegionId: z.string().uuid(),
  sourceDatabaseId: z.string().uuid(),
  targetDatabaseId: z.string().uuid(),
  replicationMode: DatabaseReplicationModeSchema,
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateReplicationLinkRequest = z.infer<typeof CreateReplicationLinkRequestSchema>;

export const RunHealthProbeRequestSchema = z.object({
  resourceType: z.string().min(2),
  resourceReference: z.string().min(2),
  environment: z.string().default('PRODUCTION'),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type RunHealthProbeRequest = z.infer<typeof RunHealthProbeRequestSchema>;

export const CreateInfrastructureAlertRequestSchema = z.object({
  resourceType: z.string().min(2),
  resourceReference: z.string().min(2),
  severity: InfrastructureAlertSeveritySchema,
  alertType: z.string().min(2),
  title: z.string().min(2),
  description: z.string().min(5),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateInfrastructureAlertRequest = z.infer<typeof CreateInfrastructureAlertRequestSchema>;

export const CreateInfrastructureIncidentRequestSchema = z.object({
  category: InfrastructureIncidentCategorySchema,
  severity: InfrastructureAlertSeveritySchema,
  title: z.string().min(2),
  description: z.string().min(5),
  source: z.string().min(2),
  environment: z.string().default('PRODUCTION'),
  resourceReference: z.string().min(2),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateInfrastructureIncidentRequest = z.infer<typeof CreateInfrastructureIncidentRequestSchema>;

export const AcknowledgeInfrastructureIncidentRequestSchema = z.object({
  incidentId: z.string().uuid(),
  assignedToEmail: z.string().email(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type AcknowledgeInfrastructureIncidentRequest = z.infer<typeof AcknowledgeInfrastructureIncidentRequestSchema>;

export const ResolveInfrastructureIncidentRequestSchema = z.object({
  incidentId: z.string().uuid(),
  resolutionNotes: z.string().min(5),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type ResolveInfrastructureIncidentRequest = z.infer<typeof ResolveInfrastructureIncidentRequestSchema>;

export const CreateBackupPolicyRequestSchema = z.object({
  policyCode: z.string().min(2),
  policyName: z.string().min(2),
  resourceType: z.string().min(2),
  scheduleReference: z.string().min(2),
  retentionDays: z.number().int().min(1),
  retentionPolicy: z.string().min(2),
  encryptionReference: z.string().min(2),
  crossRegionEnabled: z.boolean().default(true),
  immutableBackupEnabled: z.boolean().default(true),
  ownerEmail: z.string().email(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateBackupPolicyRequest = z.infer<typeof CreateBackupPolicyRequestSchema>;

export const TriggerBackupRequestSchema = z.object({
  policyId: z.string().uuid(),
  resourceReference: z.string().min(2),
  backupType: BackupTypeSchema,
  environment: z.string().default('PRODUCTION'),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type TriggerBackupRequest = z.infer<typeof TriggerBackupRequestSchema>;

export const VerifyBackupRequestSchema = z.object({
  backupId: z.string().uuid(),
  targetEnvironment: z.string().default('DISASTER_RECOVERY'),
  verificationType: RestoreVerificationTypeSchema,
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type VerifyBackupRequest = z.infer<typeof VerifyBackupRequestSchema>;

export const CreateDRPlanRequestSchema = z.object({
  planCode: z.string().min(2),
  planName: z.string().min(2),
  scope: z.string().min(2),
  primaryRegionId: z.string().uuid(),
  drRegionId: z.string().uuid(),
  rtoMinutes: z.number().int().min(1),
  rpoMinutes: z.number().int().min(1),
  failoverStrategy: DRFailoverStrategySchema,
  runbookReference: z.string().min(2),
  ownerEmail: z.string().email(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateDRPlanRequest = z.infer<typeof CreateDRPlanRequestSchema>;

export const ScheduleDRDrillRequestSchema = z.object({
  planId: z.string().uuid(),
  drillType: DRDrillTypeSchema,
  scheduledAt: z.string().datetime(),
  expectedRtoMinutes: z.number().int().min(1),
  expectedRpoMinutes: z.number().int().min(1),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type ScheduleDRDrillRequest = z.infer<typeof ScheduleDRDrillRequestSchema>;

export const ExecuteDRDrillRequestSchema = z.object({
  drillId: z.string().uuid(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type ExecuteDRDrillRequest = z.infer<typeof ExecuteDRDrillRequestSchema>;

export const InitiateFailoverRequestSchema = z.object({
  planId: z.string().uuid(),
  environment: z.string().default('PRODUCTION'),
  triggerType: FailoverTriggerTypeSchema,
  actorEmail: z.string().email(),
  reason: z.string().min(5)
});
export type InitiateFailoverRequest = z.infer<typeof InitiateFailoverRequestSchema>;

export const RollbackFailoverRequestSchema = z.object({
  failoverEventId: z.string().uuid(),
  actorEmail: z.string().email(),
  reason: z.string().min(5)
});
export type RollbackFailoverRequest = z.infer<typeof RollbackFailoverRequestSchema>;

export const GenerateInfrastructureAuditReportRequestSchema = z.object({
  reportName: z.string().min(2),
  environment: z.string().default('PRODUCTION'),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type GenerateInfrastructureAuditReportRequest = z.infer<typeof GenerateInfrastructureAuditReportRequestSchema>;
