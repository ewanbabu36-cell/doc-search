import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const PlatformProjectTypeSchema = z.enum([
  'MONOREPO',
  'BACKEND_SERVICE',
  'FRONTEND_APPLICATION',
  'SHARED_LIBRARY',
  'INFRASTRUCTURE_IAC'
]);
export type PlatformProjectType = z.infer<typeof PlatformProjectTypeSchema>;

export const PlatformProjectStatusSchema = z.enum([
  'ACTIVE',
  'ARCHIVED',
  'MAINTENANCE',
  'DEPRECATED'
]);
export type PlatformProjectStatus = z.infer<typeof PlatformProjectStatusSchema>;

export const BuildPipelineTypeSchema = z.enum([
  'BUILD',
  'TYPECHECK',
  'LINT',
  'TEST',
  'PACKAGE',
  'FULL_VALIDATION'
]);
export type BuildPipelineType = z.infer<typeof BuildPipelineTypeSchema>;

export const BuildTriggerTypeSchema = z.enum([
  'MANUAL',
  'GIT_PUSH',
  'PULL_REQUEST',
  'SCHEDULED_CRON',
  'WEBHOOK'
]);
export type BuildTriggerType = z.infer<typeof BuildTriggerTypeSchema>;

export const BuildPipelineStatusSchema = z.enum([
  'ACTIVE',
  'PAUSED',
  'DISABLED'
]);
export type BuildPipelineStatus = z.infer<typeof BuildPipelineStatusSchema>;

export const BuildRunStatusSchema = z.enum([
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'TIMED_OUT'
]);
export type BuildRunStatus = z.infer<typeof BuildRunStatusSchema>;

export const CICDProviderSchema = z.enum([
  'GITHUB_ACTIONS',
  'GITLAB_CI',
  'TURBOREPO_REMOTE',
  'CUSTOM_RUNNER'
]);
export type CICDProvider = z.infer<typeof CICDProviderSchema>;

export const CICDTriggerPolicySchema = z.enum([
  'ON_PUSH_MAIN',
  'ON_PULL_REQUEST',
  'TAG_RELEASE',
  'MANUAL_DISPATCH'
]);
export type CICDTriggerPolicy = z.infer<typeof CICDTriggerPolicySchema>;

export const CICDPipelineStatusSchema = z.enum([
  'ACTIVE',
  'PAUSED',
  'DISABLED'
]);
export type CICDPipelineStatus = z.infer<typeof CICDPipelineStatusSchema>;

export const CICDRunStatusSchema = z.enum([
  'QUEUED',
  'IN_PROGRESS',
  'PASSED',
  'FAILED',
  'CANCELLED',
  'SKIPPED'
]);
export type CICDRunStatus = z.infer<typeof CICDRunStatusSchema>;

export const CICDStageSchema = z.enum([
  'LINT_AND_TYPECHECK',
  'UNIT_TESTS',
  'INTEGRATION_TESTS',
  'BUILD_ARTIFACTS',
  'SECURITY_SCAN',
  'STAGING_DEPLOY',
  'PRODUCTION_PROMOTE'
]);
export type CICDStage = z.infer<typeof CICDStageSchema>;

export const ArtifactRepositoryTypeSchema = z.enum([
  'DOCKER_OCI',
  'NPM_REGISTRY',
  'PYPI_INDEX',
  'MAVEN_JAR',
  'GENERIC_BLOB'
]);
export type ArtifactRepositoryType = z.infer<typeof ArtifactRepositoryTypeSchema>;

export const ArtifactRepositoryProviderSchema = z.enum([
  'GHCR_IO',
  'AWS_ECR',
  'GOOGLE_GAR',
  'INTERNAL_VERDACCIO'
]);
export type ArtifactRepositoryProvider = z.infer<typeof ArtifactRepositoryProviderSchema>;

export const ArtifactTypeSchema = z.enum([
  'CONTAINER_IMAGE',
  'NPM_PACKAGE',
  'TARBALL_BUNDLE',
  'BINARY_EXECUTABLE'
]);
export type ArtifactType = z.infer<typeof ArtifactTypeSchema>;

export const ArtifactStatusSchema = z.enum([
  'ACTIVE',
  'RELEASED',
  'DEPRECATED',
  'RETAINED',
  'PURGED'
]);
export type ArtifactStatus = z.infer<typeof ArtifactStatusSchema>;

export const PlatformEnvironmentTypeSchema = z.enum([
  'LOCAL',
  'DEVELOPMENT',
  'TEST',
  'STAGING',
  'PRODUCTION',
  'DISASTER_RECOVERY'
]);
export type PlatformEnvironmentType = z.infer<typeof PlatformEnvironmentTypeSchema>;

export const PlatformEnvironmentStatusSchema = z.enum([
  'HEALTHY',
  'DEGRADED',
  'MAINTENANCE',
  'DEPLOYING',
  'OFFLINE'
]);
export type PlatformEnvironmentStatus = z.infer<typeof PlatformEnvironmentStatusSchema>;

export const ConfigurationValueTypeSchema = z.enum([
  'STRING',
  'INTEGER',
  'BOOLEAN',
  'JSON_DOCUMENT',
  'VAULT_SECRET_POINTER'
]);
export type ConfigurationValueType = z.infer<typeof ConfigurationValueTypeSchema>;

export const ConfigurationClassificationSchema = z.enum([
  'PUBLIC',
  'INTERNAL',
  'CONFIDENTIAL',
  'RESTRICTED',
  'PHI_RESTRICTED'
]);
export type ConfigurationClassification = z.infer<typeof ConfigurationClassificationSchema>;

export const ConfigurationStatusSchema = z.enum([
  'ACTIVE',
  'PENDING_ROTATION',
  'DEPRECATED'
]);
export type ConfigurationStatus = z.infer<typeof ConfigurationStatusSchema>;

export const DependencyNodeTypeSchema = z.enum([
  'APPLICATION',
  'WORKSPACE_PACKAGE',
  'EXTERNAL_NPM_PACKAGE',
  'SERVICE',
  'INFRASTRUCTURE_MODULE'
]);
export type DependencyNodeType = z.infer<typeof DependencyNodeTypeSchema>;

export const DependencyTypeSchema = z.enum([
  'RUNTIME',
  'DEV_DEPENDENCY',
  'PEER_DEPENDENCY',
  'WORKSPACE_LINK',
  'SERVICE_RPC'
]);
export type DependencyType = z.infer<typeof DependencyTypeSchema>;

export const PackageReleaseTypeSchema = z.enum([
  'PATCH',
  'MINOR',
  'MAJOR',
  'HOTFIX'
]);
export type PackageReleaseType = z.infer<typeof PackageReleaseTypeSchema>;

export const PackageReleaseStatusSchema = z.enum([
  'DRAFT',
  'CANDIDATE',
  'RELEASED',
  'DEPRECATED',
  'YANKED'
]);
export type PackageReleaseStatus = z.infer<typeof PackageReleaseStatusSchema>;

export const DeploymentStrategySchema = z.enum([
  'ROLLING',
  'BLUE_GREEN',
  'CANARY',
  'RECREATE'
]);
export type DeploymentStrategy = z.infer<typeof DeploymentStrategySchema>;

export const DeploymentStatusSchema = z.enum([
  'PENDING_APPROVAL',
  'IN_PROGRESS',
  'DEPLOYED',
  'FAILED',
  'ROLLED_BACK',
  'CANCELLED'
]);
export type DeploymentStatus = z.infer<typeof DeploymentStatusSchema>;

export const DevExMetricTypeSchema = z.enum([
  'BUILD_DURATION',
  'CI_DURATION',
  'DEPLOYMENT_FREQUENCY',
  'DEPLOYMENT_LEAD_TIME',
  'FAILED_BUILD_RATE',
  'FAILED_DEPLOYMENT_RATE',
  'PIPELINE_SUCCESS_RATE',
  'MEAN_TIME_TO_RECOVERY',
  'QUEUE_TIME',
  'TEST_EXECUTION_DURATION',
  'PACKAGE_RELEASE_FREQUENCY'
]);
export type DevExMetricType = z.infer<typeof DevExMetricTypeSchema>;

export const PlatformIncidentCategorySchema = z.enum([
  'BUILD_FAILURE',
  'CI_FAILURE',
  'DEPLOYMENT_FAILURE',
  'ARTIFACT_FAILURE',
  'CONFIGURATION_ERROR',
  'DEPENDENCY_FAILURE',
  'ENVIRONMENT_OUTAGE',
  'RELEASE_FAILURE',
  'PIPELINE_TIMEOUT',
  'PLATFORM_DEGRADATION'
]);
export type PlatformIncidentCategory = z.infer<typeof PlatformIncidentCategorySchema>;

export const PlatformIncidentSeveritySchema = z.enum([
  'INFO',
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
]);
export type PlatformIncidentSeverity = z.infer<typeof PlatformIncidentSeveritySchema>;

export const PlatformIncidentStatusSchema = z.enum([
  'OPEN',
  'INVESTIGATING',
  'CONTAINED',
  'RESOLVED',
  'FALSE_POSITIVE'
]);
export type PlatformIncidentStatus = z.infer<typeof PlatformIncidentStatusSchema>;

export const PlatformAuditStatusSchema = z.enum([
  'SUCCESS',
  'FAILURE',
  'DENIED',
  'SIMULATED'
]);
export type PlatformAuditStatus = z.infer<typeof PlatformAuditStatusSchema>;

// ==========================================
// DTOs
// ==========================================

export const PlatformProjectDtoSchema = z.object({
  id: z.string().uuid(),
  projectCode: z.string().min(2),
  projectName: z.string().min(2),
  description: z.string(),
  repositoryReference: z.string(),
  defaultBranch: z.string().default('main'),
  projectType: PlatformProjectTypeSchema,
  status: PlatformProjectStatusSchema,
  ownerEmail: z.string().email(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type PlatformProjectDto = z.infer<typeof PlatformProjectDtoSchema>;

export const BuildPipelineDtoSchema = z.object({
  id: z.string().uuid(),
  pipelineCode: z.string().min(2),
  projectId: z.string().uuid(),
  projectName: z.string().optional(),
  pipelineName: z.string().min(2),
  pipelineType: BuildPipelineTypeSchema,
  definitionReference: z.string(),
  triggerType: BuildTriggerTypeSchema,
  status: BuildPipelineStatusSchema,
  defaultEnvironment: PlatformEnvironmentTypeSchema.default('DEVELOPMENT'),
  timeoutSeconds: z.number().int().min(10).default(600),
  ownerEmail: z.string().email(),
  lastRunStatus: BuildRunStatusSchema.optional(),
  lastRunAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type BuildPipelineDto = z.infer<typeof BuildPipelineDtoSchema>;

export const BuildRunDtoSchema = z.object({
  id: z.string().uuid(),
  runCode: z.string().min(2),
  pipelineId: z.string().uuid(),
  pipelineName: z.string().optional(),
  commitReference: z.string(),
  branchReference: z.string(),
  triggeredByEmail: z.string().email(),
  status: BuildRunStatusSchema,
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  durationMs: z.number().int().min(0).optional(),
  failedTaskCount: z.number().int().min(0).default(0),
  successfulTaskCount: z.number().int().min(0).default(0),
  artifactReference: z.string().optional(),
  logReference: z.string().optional(),
  environment: PlatformEnvironmentTypeSchema.default('DEVELOPMENT'),
  metadata: z.record(z.unknown()).default({})
});
export type BuildRunDto = z.infer<typeof BuildRunDtoSchema>;

export const CICDPipelineDtoSchema = z.object({
  id: z.string().uuid(),
  pipelineCode: z.string().min(2),
  provider: CICDProviderSchema,
  repositoryReference: z.string(),
  workflowReference: z.string(),
  triggerPolicy: CICDTriggerPolicySchema,
  status: CICDPipelineStatusSchema,
  ownerEmail: z.string().email(),
  lastRunAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type CICDPipelineDto = z.infer<typeof CICDPipelineDtoSchema>;

export const CICDRunDtoSchema = z.object({
  id: z.string().uuid(),
  runCode: z.string().min(2),
  pipelineId: z.string().uuid(),
  pipelineCode: z.string().optional(),
  commitReference: z.string(),
  branchReference: z.string(),
  status: CICDRunStatusSchema,
  stage: CICDStageSchema,
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  durationMs: z.number().int().min(0).optional(),
  runnerReference: z.string().default('TURBO_RUNNER_CLOUD'),
  failureReason: z.string().optional(),
  artifactReference: z.string().optional(),
  deploymentReference: z.string().optional(),
  metadata: z.record(z.unknown()).default({})
});
export type CICDRunDto = z.infer<typeof CICDRunDtoSchema>;

export const ArtifactRepositoryDtoSchema = z.object({
  id: z.string().uuid(),
  repositoryCode: z.string().min(2),
  name: z.string().min(2),
  repositoryType: ArtifactRepositoryTypeSchema,
  provider: ArtifactRepositoryProviderSchema,
  endpointReference: z.string(),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'READ_ONLY']),
  retentionPolicyReference: z.string().default('90_DAYS_RETENTION'),
  ownerEmail: z.string().email(),
  artifactsCount: z.number().int().min(0).default(0),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type ArtifactRepositoryDto = z.infer<typeof ArtifactRepositoryDtoSchema>;

export const ArtifactDtoSchema = z.object({
  id: z.string().uuid(),
  artifactCode: z.string().min(2),
  repositoryId: z.string().uuid(),
  repositoryName: z.string().optional(),
  packageName: z.string().min(2),
  version: z.string().min(1),
  artifactType: ArtifactTypeSchema,
  digest: z.string(), // sha256 reference
  sizeBytes: z.number().int().min(0),
  buildRunId: z.string().uuid().optional(),
  status: ArtifactStatusSchema,
  publishedAt: z.string().datetime(),
  retentionUntil: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({})
});
export type ArtifactDto = z.infer<typeof ArtifactDtoSchema>;

export const EnvironmentDtoSchema = z.object({
  id: z.string().uuid(),
  environmentCode: z.string().min(2),
  environmentName: z.string().min(2),
  environmentType: PlatformEnvironmentTypeSchema,
  status: PlatformEnvironmentStatusSchema,
  regionReference: z.string().default('us-east-1'),
  deploymentPolicyReference: z.string(),
  ownerEmail: z.string().email(),
  activeVersion: z.string().optional(),
  configurationsCount: z.number().int().min(0).default(0),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type EnvironmentDto = z.infer<typeof EnvironmentDtoSchema>;

export const EnvironmentConfigurationDtoSchema = z.object({
  id: z.string().uuid(),
  environmentId: z.string().uuid(),
  environmentCode: z.string().optional(),
  configurationCode: z.string().min(2),
  configurationKey: z.string().min(2),
  valueReference: z.string(),
  valueType: ConfigurationValueTypeSchema,
  classification: ConfigurationClassificationSchema,
  secretReference: z.string().optional(), // vault://platform/...
  status: ConfigurationStatusSchema,
  lastRotatedAt: z.string().datetime().optional(),
  updatedByEmail: z.string().email(),
  updatedAt: z.string().datetime(),
  metadata: z.record(z.unknown()).default({})
});
export type EnvironmentConfigurationDto = z.infer<typeof EnvironmentConfigurationDtoSchema>;

export const EnvironmentVariableReferenceDtoSchema = z.object({
  key: z.string(),
  valueReference: z.string(),
  isSecret: z.boolean(),
  classification: ConfigurationClassificationSchema
});
export type EnvironmentVariableReferenceDto = z.infer<typeof EnvironmentVariableReferenceDtoSchema>;

export const DependencyNodeDtoSchema = z.object({
  id: z.string().uuid(),
  nodeCode: z.string().min(2),
  nodeType: DependencyNodeTypeSchema,
  name: z.string().min(2),
  version: z.string().min(1),
  repositoryReference: z.string().optional(),
  status: z.enum(['HEALTHY', 'UPGRADE_AVAILABLE', 'SECURITY_HOLD', 'DEPRECATED']),
  dependenciesCount: z.number().int().min(0).default(0),
  dependentsCount: z.number().int().min(0).default(0),
  metadata: z.record(z.unknown()).default({})
});
export type DependencyNodeDto = z.infer<typeof DependencyNodeDtoSchema>;

export const DependencyEdgeDtoSchema = z.object({
  id: z.string().uuid(),
  sourceNodeId: z.string().uuid(),
  sourceNodeName: z.string().optional(),
  targetNodeId: z.string().uuid(),
  targetNodeName: z.string().optional(),
  dependencyType: DependencyTypeSchema,
  versionConstraint: z.string().default('^1.0.0'),
  isDevDependency: z.boolean().default(false),
  status: z.enum(['SATISFIED', 'OUTDATED', 'CONFLICT']),
  metadata: z.record(z.unknown()).default({})
});
export type DependencyEdgeDto = z.infer<typeof DependencyEdgeDtoSchema>;

export const PackageReleaseDtoSchema = z.object({
  id: z.string().uuid(),
  releaseCode: z.string().min(2),
  packageName: z.string().min(2),
  version: z.string().min(1),
  releaseType: PackageReleaseTypeSchema,
  status: PackageReleaseStatusSchema,
  artifactReference: z.string().optional(),
  commitReference: z.string(),
  releaseNotesReference: z.string(),
  releasedByEmail: z.string().email(),
  releasedAt: z.string().datetime(),
  deprecationDate: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({})
});
export type PackageReleaseDto = z.infer<typeof PackageReleaseDtoSchema>;

export const DeploymentDtoSchema = z.object({
  id: z.string().uuid(),
  deploymentCode: z.string().min(2),
  environmentId: z.string().uuid(),
  environmentName: z.string().optional(),
  environmentType: PlatformEnvironmentTypeSchema.optional(),
  artifactReference: z.string(),
  releaseReference: z.string().optional(),
  commitReference: z.string(),
  deploymentStrategy: DeploymentStrategySchema,
  status: DeploymentStatusSchema,
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  deployedByEmail: z.string().email(),
  rollbackReference: z.string().optional(),
  failureReason: z.string().optional(),
  metadata: z.record(z.unknown()).default({})
});
export type DeploymentDto = z.infer<typeof DeploymentDtoSchema>;

export const DeveloperExperienceMetricDtoSchema = z.object({
  id: z.string().uuid(),
  metricType: DevExMetricTypeSchema,
  metricName: z.string().min(2),
  numericValue: z.number(),
  unit: z.string(),
  evaluationPeriod: z.string(),
  sourceStatus: z.string().default('PENDING_TELEMETRY_PIPELINE'),
  recordedAt: z.string().datetime(),
  metadata: z.record(z.unknown()).default({})
});
export type DeveloperExperienceMetricDto = z.infer<typeof DeveloperExperienceMetricDtoSchema>;

export const PlatformIncidentDtoSchema = z.object({
  id: z.string().uuid(),
  incidentCode: z.string().min(2),
  category: PlatformIncidentCategorySchema,
  severity: PlatformIncidentSeveritySchema,
  title: z.string().min(2),
  description: z.string(),
  source: z.string(),
  status: PlatformIncidentStatusSchema,
  assignedToEmail: z.string().optional(),
  detectedAt: z.string().datetime(),
  acknowledgedAt: z.string().datetime().optional(),
  resolvedAt: z.string().datetime().optional(),
  resolutionNotes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type PlatformIncidentDto = z.infer<typeof PlatformIncidentDtoSchema>;

export const PlatformAuditTraceDtoSchema = z.object({
  id: z.string().uuid(),
  traceId: z.string().min(2),
  actorEmail: z.string().email(),
  action: z.string().min(2),
  resourceReference: z.string(),
  environment: PlatformEnvironmentTypeSchema.default('DEVELOPMENT'),
  operationStatus: PlatformAuditStatusSchema,
  occurredAt: z.string().datetime(),
  correlationReference: z.string(),
  evidenceReference: z.string(),
  reason: z.string().min(2),
  metadata: z.record(z.unknown()).default({})
});
export type PlatformAuditTraceDto = z.infer<typeof PlatformAuditTraceDtoSchema>;

export const PlatformOverviewDtoSchema = z.object({
  activeProjectsCount: z.number().int().min(0),
  buildPipelinesCount: z.number().int().min(0),
  recentBuildRunsCount: z.number().int().min(0),
  failedBuildRunsCount: z.number().int().min(0),
  artifactRepositoriesCount: z.number().int().min(0),
  activeEnvironmentsCount: z.number().int().min(0),
  pendingReleasesCount: z.number().int().min(0),
  openIncidentsCount: z.number().int().min(0),
  telemetryStatus: z.string()
});
export type PlatformOverviewDto = z.infer<typeof PlatformOverviewDtoSchema>;

// ==========================================
// Requests
// ==========================================

export const CreatePlatformProjectRequestSchema = z.object({
  projectCode: z.string().min(2),
  projectName: z.string().min(2),
  description: z.string().min(5),
  repositoryReference: z.string().min(2),
  defaultBranch: z.string().default('main'),
  projectType: PlatformProjectTypeSchema,
  ownerEmail: z.string().email(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreatePlatformProjectRequest = z.infer<typeof CreatePlatformProjectRequestSchema>;

export const CreateBuildPipelineRequestSchema = z.object({
  pipelineCode: z.string().min(2),
  projectId: z.string().uuid(),
  pipelineName: z.string().min(2),
  pipelineType: BuildPipelineTypeSchema,
  definitionReference: z.string().min(2),
  triggerType: BuildTriggerTypeSchema,
  defaultEnvironment: PlatformEnvironmentTypeSchema.default('DEVELOPMENT'),
  timeoutSeconds: z.number().int().min(10).default(600),
  ownerEmail: z.string().email(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateBuildPipelineRequest = z.infer<typeof CreateBuildPipelineRequestSchema>;

export const ExecuteBuildPipelineRequestSchema = z.object({
  pipelineId: z.string().uuid(),
  branchReference: z.string().min(1).default('main'),
  commitReference: z.string().min(7),
  environment: PlatformEnvironmentTypeSchema.default('DEVELOPMENT'),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type ExecuteBuildPipelineRequest = z.infer<typeof ExecuteBuildPipelineRequestSchema>;

export const CancelBuildRunRequestSchema = z.object({
  runId: z.string().uuid(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CancelBuildRunRequest = z.infer<typeof CancelBuildRunRequestSchema>;

export const PromoteDeploymentRequestSchema = z.object({
  targetEnvironmentId: z.string().uuid(),
  artifactReference: z.string().min(2),
  commitReference: z.string().min(7),
  deploymentStrategy: DeploymentStrategySchema,
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type PromoteDeploymentRequest = z.infer<typeof PromoteDeploymentRequestSchema>;

export const RollbackDeploymentRequestSchema = z.object({
  deploymentId: z.string().uuid(),
  rollbackArtifactReference: z.string().min(2),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type RollbackDeploymentRequest = z.infer<typeof RollbackDeploymentRequestSchema>;

export const RegisterArtifactRequestSchema = z.object({
  artifactCode: z.string().min(2),
  repositoryId: z.string().uuid(),
  packageName: z.string().min(2),
  version: z.string().min(1),
  artifactType: ArtifactTypeSchema,
  digest: z.string().min(8),
  sizeBytes: z.number().int().min(1),
  buildRunId: z.string().uuid().optional(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type RegisterArtifactRequest = z.infer<typeof RegisterArtifactRequestSchema>;

export const CreatePackageReleaseRequestSchema = z.object({
  releaseCode: z.string().min(2),
  packageName: z.string().min(2),
  version: z.string().min(1),
  releaseType: PackageReleaseTypeSchema,
  commitReference: z.string().min(7),
  releaseNotesReference: z.string().min(2),
  artifactReference: z.string().optional(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreatePackageReleaseRequest = z.infer<typeof CreatePackageReleaseRequestSchema>;

export const PromotePackageReleaseRequestSchema = z.object({
  releaseId: z.string().uuid(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type PromotePackageReleaseRequest = z.infer<typeof PromotePackageReleaseRequestSchema>;

export const DeprecatePackageReleaseRequestSchema = z.object({
  releaseId: z.string().uuid(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type DeprecatePackageReleaseRequest = z.infer<typeof DeprecatePackageReleaseRequestSchema>;

export const UpdateEnvironmentConfigurationRequestSchema = z.object({
  environmentId: z.string().uuid(),
  configurationKey: z.string().min(2),
  valueReference: z.string().min(1),
  valueType: ConfigurationValueTypeSchema,
  classification: ConfigurationClassificationSchema,
  secretReference: z.string().optional(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type UpdateEnvironmentConfigurationRequest = z.infer<typeof UpdateEnvironmentConfigurationRequestSchema>;

export const CreatePlatformIncidentRequestSchema = z.object({
  category: PlatformIncidentCategorySchema,
  severity: PlatformIncidentSeveritySchema,
  title: z.string().min(2),
  description: z.string().min(5),
  source: z.string().min(2),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreatePlatformIncidentRequest = z.infer<typeof CreatePlatformIncidentRequestSchema>;

export const AcknowledgePlatformIncidentRequestSchema = z.object({
  incidentId: z.string().uuid(),
  assignedToEmail: z.string().email(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type AcknowledgePlatformIncidentRequest = z.infer<typeof AcknowledgePlatformIncidentRequestSchema>;

export const ResolvePlatformIncidentRequestSchema = z.object({
  incidentId: z.string().uuid(),
  resolutionNotes: z.string().min(5),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type ResolvePlatformIncidentRequest = z.infer<typeof ResolvePlatformIncidentRequestSchema>;

export const GeneratePlatformAuditReportRequestSchema = z.object({
  reportName: z.string().min(2),
  environment: PlatformEnvironmentTypeSchema,
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type GeneratePlatformAuditReportRequest = z.infer<typeof GeneratePlatformAuditReportRequestSchema>;
