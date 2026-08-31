import type {
  PlatformProjectDto,
  BuildPipelineDto,
  BuildRunDto,
  CICDPipelineDto,
  CICDRunDto,
  ArtifactRepositoryDto,
  ArtifactDto,
  EnvironmentDto,
  EnvironmentConfigurationDto,
  DependencyNodeDto,
  DependencyEdgeDto,
  PackageReleaseDto,
  DeploymentDto,
  DeveloperExperienceMetricDto,
  PlatformIncidentDto,
  PlatformAuditTraceDto,
  PlatformOverviewDto
} from '@docsearch/api-contracts';

export const MOCK_PLATFORM_OVERVIEW: PlatformOverviewDto = {
  activeProjectsCount: 1,
  buildPipelinesCount: 6,
  recentBuildRunsCount: 18,
  failedBuildRunsCount: 1,
  artifactRepositoriesCount: 3,
  activeEnvironmentsCount: 5,
  pendingReleasesCount: 1,
  openIncidentsCount: 1,
  telemetryStatus: 'Live platform telemetry is not connected. Displaying Live Telemetry sample data.'
};

export const MOCK_PLATFORM_PROJECTS: PlatformProjectDto[] = [
  {
    id: 'proj0001-0000-0000-0000-000000000001',
    projectCode: 'DOC_SEARCH_MONOREPO',
    projectName: 'Doc Search Enterprise Monorepo',
    description: 'Enterprise healthcare SaaS monorepo orchestrating 12 packages and applications via Turborepo and pnpm workspaces.',
    repositoryReference: 'github.com/docsearch/docsearch-enterprise',
    defaultBranch: 'main',
    projectType: 'MONOREPO',
    status: 'ACTIVE',
    ownerEmail: 'platform.eng@docsearch.internal',
    metadata: { turboVersion: '2.0.14', pnpmVersion: '9.7.1', nodeVersion: '20.14.0' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T10:00:00.000Z'
  }
];

export const MOCK_BUILD_PIPELINES: BuildPipelineDto[] = [
  {
    id: 'pipe0001-0000-0000-0000-000000000001',
    pipelineCode: 'PIPE-TURBO-VALIDATE',
    projectId: 'proj0001-0000-0000-0000-000000000001',
    projectName: 'Doc Search Enterprise Monorepo',
    pipelineName: 'Turborepo Full Monorepo Quality Gate',
    pipelineType: 'FULL_VALIDATION',
    definitionReference: 'turbo.json#validate',
    triggerType: 'PULL_REQUEST',
    status: 'ACTIVE',
    defaultEnvironment: 'DEVELOPMENT',
    timeoutSeconds: 900,
    ownerEmail: 'lead.devops@docsearch.internal',
    lastRunStatus: 'SUCCEEDED',
    lastRunAt: '2026-08-29T10:45:00.000Z',
    metadata: { parallelTasks: 4, cache: true },
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-08-29T10:45:00.000Z'
  },
  {
    id: 'pipe0001-0000-0000-0000-000000000002',
    pipelineCode: 'PIPE-TURBO-TYPECHECK',
    projectId: 'proj0001-0000-0000-0000-000000000001',
    projectName: 'Doc Search Enterprise Monorepo',
    pipelineName: 'Workspace TypeScript Strict Typecheck',
    pipelineType: 'TYPECHECK',
    definitionReference: 'pnpm -r typecheck',
    triggerType: 'GIT_PUSH',
    status: 'ACTIVE',
    defaultEnvironment: 'DEVELOPMENT',
    timeoutSeconds: 300,
    ownerEmail: 'lead.frontend@docsearch.internal',
    lastRunStatus: 'SUCCEEDED',
    lastRunAt: '2026-08-29T11:15:00.000Z',
    metadata: { exactOptionalPropertyTypes: true },
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-08-29T11:15:00.000Z'
  },
  {
    id: 'pipe0001-0000-0000-0000-000000000003',
    pipelineCode: 'PIPE-TURBO-LINT',
    projectId: 'proj0001-0000-0000-0000-000000000001',
    projectName: 'Doc Search Enterprise Monorepo',
    pipelineName: 'ESLint 9 Flat Config Strict Linter',
    pipelineType: 'LINT',
    definitionReference: 'eslint .',
    triggerType: 'GIT_PUSH',
    status: 'ACTIVE',
    defaultEnvironment: 'DEVELOPMENT',
    timeoutSeconds: 300,
    ownerEmail: 'lead.devops@docsearch.internal',
    lastRunStatus: 'SUCCEEDED',
    lastRunAt: '2026-08-29T11:18:00.000Z',
    metadata: { zeroWarningPolicy: true },
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-08-29T11:18:00.000Z'
  },
  {
    id: 'pipe0001-0000-0000-0000-000000000004',
    pipelineCode: 'PIPE-TURBO-BUILD',
    projectId: 'proj0001-0000-0000-0000-000000000001',
    projectName: 'Doc Search Enterprise Monorepo',
    pipelineName: 'Multi-target Workspace Bundler & Compilation',
    pipelineType: 'BUILD',
    definitionReference: 'pnpm -r build',
    triggerType: 'GIT_PUSH',
    status: 'ACTIVE',
    defaultEnvironment: 'DEVELOPMENT',
    timeoutSeconds: 600,
    ownerEmail: 'platform.eng@docsearch.internal',
    lastRunStatus: 'SUCCEEDED',
    lastRunAt: '2026-08-29T11:20:00.000Z',
    metadata: { targets: 11, distClean: true },
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-08-29T11:20:00.000Z'
  },
  {
    id: 'pipe0001-0000-0000-0000-000000000005',
    pipelineCode: 'PIPE-PACKAGE-DIST',
    projectId: 'proj0001-0000-0000-0000-000000000001',
    projectName: 'Doc Search Enterprise Monorepo',
    pipelineName: 'NPM & OCI Artifact Packaging Engine',
    pipelineType: 'PACKAGE',
    definitionReference: 'scripts/package-artifacts.sh',
    triggerType: 'MANUAL',
    status: 'ACTIVE',
    defaultEnvironment: 'STAGING',
    timeoutSeconds: 600,
    ownerEmail: 'release.manager@docsearch.internal',
    lastRunStatus: 'SUCCEEDED',
    lastRunAt: '2026-08-28T16:00:00.000Z',
    metadata: { signArtifacts: true },
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-08-28T16:00:00.000Z'
  }
];

export const MOCK_BUILD_RUNS: BuildRunDto[] = [
  {
    id: 'brun0001-0000-0000-0000-000000000001',
    runCode: 'BR-20260829-001',
    pipelineId: 'pipe0001-0000-0000-0000-000000000001',
    pipelineName: 'Turborepo Full Monorepo Quality Gate',
    commitReference: '7a9c8f2',
    branchReference: 'main',
    triggeredByEmail: 'lead.devops@docsearch.internal',
    status: 'SUCCEEDED',
    startedAt: '2026-08-29T11:15:00.000Z',
    completedAt: '2026-08-29T11:17:42.000Z',
    durationMs: 162000,
    failedTaskCount: 0,
    successfulTaskCount: 11,
    artifactReference: 'art-001-monorepo-core',
    logReference: 's3://build-logs/br-20260829-001.log',
    environment: 'DEVELOPMENT',
    metadata: { cachedTasks: 7, uncachedTasks: 4 }
  },
  {
    id: 'brun0001-0000-0000-0000-000000000002',
    runCode: 'BR-20260829-002',
    pipelineId: 'pipe0001-0000-0000-0000-000000000004',
    pipelineName: 'Multi-target Workspace Bundler & Compilation',
    commitReference: '4b1e5a8',
    branchReference: 'feat/domain-13-platform-eng',
    triggeredByEmail: 'platform.eng@docsearch.internal',
    status: 'SUCCEEDED',
    startedAt: '2026-08-29T11:18:00.000Z',
    completedAt: '2026-08-29T11:20:15.000Z',
    durationMs: 135000,
    failedTaskCount: 0,
    successfulTaskCount: 11,
    artifactReference: 'art-002-company-platform-dist',
    logReference: 's3://build-logs/br-20260829-002.log',
    environment: 'DEVELOPMENT',
    metadata: { parallelWorkers: 4 }
  },
  {
    id: 'brun0001-0000-0000-0000-000000000003',
    runCode: 'BR-20260828-089',
    pipelineId: 'pipe0001-0000-0000-0000-000000000003',
    pipelineName: 'ESLint 9 Flat Config Strict Linter',
    commitReference: '2c3d4e5',
    branchReference: 'fix/lint-assertions',
    triggeredByEmail: 'lead.devops@docsearch.internal',
    status: 'FAILED',
    startedAt: '2026-08-28T18:10:00.000Z',
    completedAt: '2026-08-28T18:11:12.000Z',
    durationMs: 72000,
    failedTaskCount: 1,
    successfulTaskCount: 10,
    logReference: 's3://build-logs/br-20260828-089.log',
    environment: 'DEVELOPMENT',
    metadata: { failureSummary: 'Forbidden non-null assertions in service layer' }
  }
];

export const MOCK_CICD_PIPELINES: CICDPipelineDto[] = [
  {
    id: 'cicd0001-0000-0000-0000-000000000001',
    pipelineCode: 'CICD-ENTERPRISE-PROD',
    provider: 'GITHUB_ACTIONS',
    repositoryReference: 'docsearch/docsearch-enterprise',
    workflowReference: '.github/workflows/production-deploy.yml',
    triggerPolicy: 'TAG_RELEASE',
    status: 'ACTIVE',
    ownerEmail: 'lead.devops@docsearch.internal',
    lastRunAt: '2026-08-28T14:30:00.000Z',
    metadata: { requiredApprovals: 2, canRollback: true },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-28T14:30:00.000Z'
  },
  {
    id: 'cicd0001-0000-0000-0000-000000000002',
    pipelineCode: 'CICD-STAGING-NIGHTLY',
    provider: 'GITHUB_ACTIONS',
    repositoryReference: 'docsearch/docsearch-enterprise',
    workflowReference: '.github/workflows/staging-nightly.yml',
    triggerPolicy: 'ON_PUSH_MAIN',
    status: 'ACTIVE',
    ownerEmail: 'qa.lead@docsearch.internal',
    lastRunAt: '2026-08-29T02:00:00.000Z',
    metadata: { automatedHealthCheck: true },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T02:00:00.000Z'
  }
];

export const MOCK_CICD_RUNS: CICDRunDto[] = [
  {
    id: 'crun0001-0000-0000-0000-000000000001',
    runCode: 'CR-20260829-001',
    pipelineId: 'cicd0001-0000-0000-0000-000000000002',
    pipelineCode: 'CICD-STAGING-NIGHTLY',
    commitReference: '7a9c8f2',
    branchReference: 'main',
    status: 'PASSED',
    stage: 'STAGING_DEPLOY',
    startedAt: '2026-08-29T02:00:00.000Z',
    completedAt: '2026-08-29T02:18:20.000Z',
    durationMs: 1100000,
    runnerReference: 'RUNNER-GHA-SELFHOSTED-01',
    artifactReference: 'pkg-company-platform-v1.0.0',
    deploymentReference: 'DEP-STG-20260829-01',
    metadata: { auditPassed: true }
  },
  {
    id: 'crun0001-0000-0000-0000-000000000002',
    runCode: 'CR-20260828-044',
    pipelineId: 'cicd0001-0000-0000-0000-000000000001',
    pipelineCode: 'CICD-ENTERPRISE-PROD',
    commitReference: '9d8e7f6',
    branchReference: 'refs/tags/v1.0.0',
    status: 'PASSED',
    stage: 'PRODUCTION_PROMOTE',
    startedAt: '2026-08-28T14:30:00.000Z',
    completedAt: '2026-08-28T14:52:10.000Z',
    durationMs: 1330000,
    runnerReference: 'RUNNER-GHA-PROD-ISOLATED',
    artifactReference: 'art-oci-company-platform-1.0.0',
    deploymentReference: 'DEP-PROD-20260828-01',
    metadata: { blueGreenSwitched: true }
  }
];

export const MOCK_ARTIFACT_REPOSITORIES: ArtifactRepositoryDto[] = [
  {
    id: 'repo0001-0000-0000-0000-000000000001',
    repositoryCode: 'GHCR-DOCSEARCH-CONTAINERS',
    name: 'GitHub Container Registry (Doc Search OCI)',
    repositoryType: 'DOCKER_OCI',
    provider: 'GHCR_IO',
    endpointReference: 'ghcr.io/docsearch/containers',
    status: 'ACTIVE',
    retentionPolicyReference: 'RETAIN_LAST_50_TAGS',
    ownerEmail: 'devops.lead@docsearch.internal',
    artifactsCount: 24,
    metadata: { vulnerabilityScan: 'ENABLED', immutability: 'ENFORCED' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T10:00:00.000Z'
  },
  {
    id: 'repo0001-0000-0000-0000-000000000002',
    repositoryCode: 'NPM-DOCSEARCH-INTERNAL',
    name: 'Internal Verdaccio NPM Registry',
    repositoryType: 'NPM_REGISTRY',
    provider: 'INTERNAL_VERDACCIO',
    endpointReference: 'npm.registry.internal.docsearch.net',
    status: 'ACTIVE',
    retentionPolicyReference: 'IMMUTABLE_SEMVER',
    ownerEmail: 'frontend.lead@docsearch.internal',
    artifactsCount: 42,
    metadata: { authMethod: 'MTLS_AND_TOKEN', scopedOnly: '@docsearch/*' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T10:00:00.000Z'
  }
];

export const MOCK_ARTIFACTS: ArtifactDto[] = [
  {
    id: 'art00001-0000-0000-0000-000000000001',
    artifactCode: 'ART-UI-KIT-1.0.0',
    repositoryId: 'repo0001-0000-0000-0000-000000000002',
    repositoryName: 'Internal Verdaccio NPM Registry',
    packageName: '@docsearch/ui-kit',
    version: '1.0.0',
    artifactType: 'NPM_PACKAGE',
    digest: 'sha256:4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b',
    sizeBytes: 1248000,
    buildRunId: 'brun0001-0000-0000-0000-000000000001',
    status: 'RELEASED',
    publishedAt: '2026-08-28T14:35:00.000Z',
    retentionUntil: '2028-08-28T00:00:00.000Z',
    metadata: { bundleTarget: 'ES2022', typesIncluded: true }
  },
  {
    id: 'art00001-0000-0000-0000-000000000002',
    artifactCode: 'ART-AUTH-1.0.0',
    repositoryId: 'repo0001-0000-0000-0000-000000000002',
    repositoryName: 'Internal Verdaccio NPM Registry',
    packageName: '@docsearch/auth',
    version: '1.0.0',
    artifactType: 'NPM_PACKAGE',
    digest: 'sha256:7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e',
    sizeBytes: 480000,
    buildRunId: 'brun0001-0000-0000-0000-000000000001',
    status: 'RELEASED',
    publishedAt: '2026-08-28T14:36:00.000Z',
    retentionUntil: '2028-08-28T00:00:00.000Z',
    metadata: { zeroPlaintextKeys: true }
  },
  {
    id: 'art00001-0000-0000-0000-000000000003',
    artifactCode: 'ART-DATABASE-1.0.0',
    repositoryId: 'repo0001-0000-0000-0000-000000000002',
    repositoryName: 'Internal Verdaccio NPM Registry',
    packageName: '@docsearch/database',
    version: '1.0.0',
    artifactType: 'NPM_PACKAGE',
    digest: 'sha256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    sizeBytes: 2150000,
    buildRunId: 'brun0001-0000-0000-0000-000000000001',
    status: 'RELEASED',
    publishedAt: '2026-08-28T14:37:00.000Z',
    retentionUntil: '2028-08-28T00:00:00.000Z',
    metadata: { migrationsIncluded: 12 }
  },
  {
    id: 'art00001-0000-0000-0000-000000000004',
    artifactCode: 'ART-COMPANY-PLATFORM-OCI-1.0.0',
    repositoryId: 'repo0001-0000-0000-0000-000000000001',
    repositoryName: 'GitHub Container Registry (Doc Search OCI)',
    packageName: 'docsearch/company-platform',
    version: '1.0.0',
    artifactType: 'CONTAINER_IMAGE',
    digest: 'sha256:9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b',
    sizeBytes: 84500000,
    buildRunId: 'brun0001-0000-0000-0000-000000000002',
    status: 'RELEASED',
    publishedAt: '2026-08-28T14:40:00.000Z',
    retentionUntil: '2027-08-28T00:00:00.000Z',
    metadata: { baseImage: 'node:20-alpine', nonRootUser: 'node' }
  }
];

export const MOCK_PLATFORM_ENVIRONMENTS: EnvironmentDto[] = [
  {
    id: 'env00001-0000-0000-0000-000000000001',
    environmentCode: 'ENV-LOCAL',
    environmentName: 'Local Development Environment',
    environmentType: 'LOCAL',
    status: 'HEALTHY',
    regionReference: 'local-workstation',
    deploymentPolicyReference: 'DEVELOPER_LOCAL_VITE',
    ownerEmail: 'developer@docsearch.internal',
    activeVersion: 'v1.0.0-dev',
    configurationsCount: 8,
    metadata: { hotReload: true },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T10:00:00.000Z'
  },
  {
    id: 'env00001-0000-0000-0000-000000000002',
    environmentCode: 'ENV-DEV',
    environmentName: 'Cloud Development Cluster',
    environmentType: 'DEVELOPMENT',
    status: 'HEALTHY',
    regionReference: 'us-east-1a',
    deploymentPolicyReference: 'AUTO_DEPLOY_BRANCH_MAIN',
    ownerEmail: 'devops.lead@docsearch.internal',
    activeVersion: 'v1.0.0-rc.12',
    configurationsCount: 14,
    metadata: { clusterProvider: 'EKS' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T10:00:00.000Z'
  },
  {
    id: 'env00001-0000-0000-0000-000000000003',
    environmentCode: 'ENV-STAGING',
    environmentName: 'Staging & Pre-production Preview',
    environmentType: 'STAGING',
    status: 'HEALTHY',
    regionReference: 'us-east-1b',
    deploymentPolicyReference: 'NIGHTLY_OR_PROMOTION',
    ownerEmail: 'qa.lead@docsearch.internal',
    activeVersion: 'v1.0.0',
    configurationsCount: 16,
    metadata: { syntheticTraffic: true },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T10:00:00.000Z'
  },
  {
    id: 'env00001-0000-0000-0000-000000000004',
    environmentCode: 'ENV-PROD',
    environmentName: 'Primary Production Healthcare Cluster',
    environmentType: 'PRODUCTION',
    status: 'HEALTHY',
    regionReference: 'us-east-1-multi-az',
    deploymentPolicyReference: 'BLUE_GREEN_WITH_CANARY_APPROVAL',
    ownerEmail: 'platform.security@docsearch.internal',
    activeVersion: 'v1.0.0',
    configurationsCount: 22,
    metadata: { hipaaCompliantZone: true, multiAz: true },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T10:00:00.000Z'
  },
  {
    id: 'env00001-0000-0000-0000-000000000005',
    environmentCode: 'ENV-DR',
    environmentName: 'Disaster Recovery Warm Standby',
    environmentType: 'DISASTER_RECOVERY',
    status: 'HEALTHY',
    regionReference: 'us-west-2-dr',
    deploymentPolicyReference: 'AUTOMATED_FAILOVER_MIRROR',
    ownerEmail: 'platform.security@docsearch.internal',
    activeVersion: 'v1.0.0',
    configurationsCount: 22,
    metadata: { syncRpoMinutes: 5, rtoMinutes: 15 },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T10:00:00.000Z'
  }
];

export const MOCK_ENVIRONMENT_CONFIGURATIONS: EnvironmentConfigurationDto[] = [
  {
    id: 'econf001-0000-0000-0000-000000000001',
    environmentId: 'env00001-0000-0000-0000-000000000004',
    environmentCode: 'ENV-PROD',
    configurationCode: 'CONF-PROD-DB-CONN',
    configurationKey: 'DATABASE_URL_SECRET_REF',
    valueReference: 'vault://platform/prod/postgres_connection_uri',
    valueType: 'VAULT_SECRET_POINTER',
    classification: 'RESTRICTED',
    secretReference: 'vault://platform/prod/postgres_connection_uri',
    status: 'ACTIVE',
    lastRotatedAt: '2026-08-01T00:00:00.000Z',
    updatedByEmail: 'platform.security@docsearch.internal',
    updatedAt: '2026-08-01T00:00:00.000Z',
    metadata: { rotationIntervalDays: 90 }
  },
  {
    id: 'econf001-0000-0000-0000-000000000002',
    environmentId: 'env00001-0000-0000-0000-000000000004',
    environmentCode: 'ENV-PROD',
    configurationCode: 'CONF-PROD-FASTIFY-PORT',
    configurationKey: 'FASTIFY_PORT',
    valueReference: '3000',
    valueType: 'INTEGER',
    classification: 'INTERNAL',
    status: 'ACTIVE',
    updatedByEmail: 'devops.lead@docsearch.internal',
    updatedAt: '2026-01-10T00:00:00.000Z',
    metadata: {}
  },
  {
    id: 'econf001-0000-0000-0000-000000000003',
    environmentId: 'env00001-0000-0000-0000-000000000004',
    environmentCode: 'ENV-PROD',
    configurationCode: 'CONF-PROD-JWT-KEY',
    configurationKey: 'AUTH_JWT_SIGNING_KEY_REF',
    valueReference: 'vault://platform/prod/jwt_private_key_ed25519',
    valueType: 'VAULT_SECRET_POINTER',
    classification: 'RESTRICTED',
    secretReference: 'vault://platform/prod/jwt_private_key_ed25519',
    status: 'ACTIVE',
    lastRotatedAt: '2026-07-15T00:00:00.000Z',
    updatedByEmail: 'platform.security@docsearch.internal',
    updatedAt: '2026-07-15T00:00:00.000Z',
    metadata: { algorithm: 'Ed25519' }
  }
];

export const MOCK_DEPENDENCY_NODES: DependencyNodeDto[] = [
  {
    id: 'node0001-0000-0000-0000-000000000001',
    nodeCode: 'NODE-APP-COMPANY-PLATFORM',
    nodeType: 'APPLICATION',
    name: 'apps/company-platform',
    version: '1.0.0',
    repositoryReference: 'apps/company-platform',
    status: 'HEALTHY',
    dependenciesCount: 5,
    dependentsCount: 0,
    metadata: { framework: 'React 18 + Vite' }
  },
  {
    id: 'node0001-0000-0000-0000-000000000002',
    nodeCode: 'NODE-APP-API-GATEWAY',
    nodeType: 'APPLICATION',
    name: 'apps/api-gateway',
    version: '1.0.0',
    repositoryReference: 'apps/api-gateway',
    status: 'HEALTHY',
    dependenciesCount: 4,
    dependentsCount: 0,
    metadata: { framework: 'Fastify 4' }
  },
  {
    id: 'node0001-0000-0000-0000-000000000003',
    nodeCode: 'NODE-APP-PARTNER-PLATFORM',
    nodeType: 'APPLICATION',
    name: 'apps/partner-platform',
    version: '1.0.0',
    repositoryReference: 'apps/partner-platform',
    status: 'HEALTHY',
    dependenciesCount: 4,
    dependentsCount: 0,
    metadata: { framework: 'React 18 + Vite' }
  },
  {
    id: 'node0001-0000-0000-0000-000000000004',
    nodeCode: 'NODE-PKG-UI-KIT',
    nodeType: 'WORKSPACE_PACKAGE',
    name: '@docsearch/ui-kit',
    version: '1.0.0',
    repositoryReference: 'packages/ui-kit',
    status: 'HEALTHY',
    dependenciesCount: 1,
    dependentsCount: 2,
    metadata: { components: 38 }
  },
  {
    id: 'node0001-0000-0000-0000-000000000005',
    nodeCode: 'NODE-PKG-DATABASE',
    nodeType: 'WORKSPACE_PACKAGE',
    name: '@docsearch/database',
    version: '1.0.0',
    repositoryReference: 'packages/database',
    status: 'HEALTHY',
    dependenciesCount: 2,
    dependentsCount: 2,
    metadata: { tables: 98, orm: 'Drizzle' }
  },
  {
    id: 'node0001-0000-0000-0000-000000000006',
    nodeCode: 'NODE-PKG-API-CONTRACTS',
    nodeType: 'WORKSPACE_PACKAGE',
    name: '@docsearch/api-contracts',
    version: '1.0.0',
    repositoryReference: 'packages/api-contracts',
    status: 'HEALTHY',
    dependenciesCount: 1,
    dependentsCount: 3,
    metadata: { validator: 'Zod' }
  },
  {
    id: 'node0001-0000-0000-0000-000000000007',
    nodeCode: 'NODE-PKG-AUTH',
    nodeType: 'WORKSPACE_PACKAGE',
    name: '@docsearch/auth',
    version: '1.0.0',
    repositoryReference: 'packages/auth',
    status: 'HEALTHY',
    dependenciesCount: 2,
    dependentsCount: 3,
    metadata: { rbac: true }
  },
  {
    id: 'node0001-0000-0000-0000-000000000008',
    nodeCode: 'NODE-PKG-SHARED-CORE',
    nodeType: 'WORKSPACE_PACKAGE',
    name: '@docsearch/shared-core',
    version: '1.0.0',
    repositoryReference: 'packages/shared-core',
    status: 'HEALTHY',
    dependenciesCount: 0,
    dependentsCount: 4,
    metadata: { primitives: true }
  }
];

export const MOCK_DEPENDENCY_EDGES: DependencyEdgeDto[] = [
  {
    id: 'edge0001-0000-0000-0000-000000000001',
    sourceNodeId: 'node0001-0000-0000-0000-000000000001',
    sourceNodeName: 'apps/company-platform',
    targetNodeId: 'node0001-0000-0000-0000-000000000004',
    targetNodeName: '@docsearch/ui-kit',
    dependencyType: 'WORKSPACE_LINK',
    versionConstraint: 'workspace:*',
    isDevDependency: false,
    status: 'SATISFIED',
    metadata: {}
  },
  {
    id: 'edge0001-0000-0000-0000-000000000002',
    sourceNodeId: 'node0001-0000-0000-0000-000000000001',
    sourceNodeName: 'apps/company-platform',
    targetNodeId: 'node0001-0000-0000-0000-000000000006',
    targetNodeName: '@docsearch/api-contracts',
    dependencyType: 'WORKSPACE_LINK',
    versionConstraint: 'workspace:*',
    isDevDependency: false,
    status: 'SATISFIED',
    metadata: {}
  },
  {
    id: 'edge0001-0000-0000-0000-000000000003',
    sourceNodeId: 'node0001-0000-0000-0000-000000000001',
    sourceNodeName: 'apps/company-platform',
    targetNodeId: 'node0001-0000-0000-0000-000000000007',
    targetNodeName: '@docsearch/auth',
    dependencyType: 'WORKSPACE_LINK',
    versionConstraint: 'workspace:*',
    isDevDependency: false,
    status: 'SATISFIED',
    metadata: {}
  },
  {
    id: 'edge0001-0000-0000-0000-000000000004',
    sourceNodeId: 'node0001-0000-0000-0000-000000000002',
    sourceNodeName: 'apps/api-gateway',
    targetNodeId: 'node0001-0000-0000-0000-000000000005',
    targetNodeName: '@docsearch/database',
    dependencyType: 'WORKSPACE_LINK',
    versionConstraint: 'workspace:*',
    isDevDependency: false,
    status: 'SATISFIED',
    metadata: {}
  }
];

export const MOCK_PACKAGE_RELEASES: PackageReleaseDto[] = [
  {
    id: 'rel00001-0000-0000-0000-000000000001',
    releaseCode: 'REL-20260828-V1.0.0',
    packageName: 'docsearch-enterprise-monorepo',
    version: '1.0.0',
    releaseType: 'MAJOR',
    status: 'RELEASED',
    artifactReference: 'art-oci-company-platform-1.0.0',
    commitReference: '9d8e7f6',
    releaseNotesReference: 'docs/releases/v1.0.0.md - Initial Phase 1 Production Release of Doc Search Healthcare Platform',
    releasedByEmail: 'release.manager@docsearch.internal',
    releasedAt: '2026-08-28T14:30:00.000Z',
    metadata: { signedBy: 'GPG:0x9A4B3C2D1E0F' }
  },
  {
    id: 'rel00001-0000-0000-0000-000000000002',
    releaseCode: 'REL-20260829-V1.0.1-RC1',
    packageName: 'docsearch-enterprise-monorepo',
    version: '1.0.1-rc.1',
    releaseType: 'PATCH',
    status: 'CANDIDATE',
    artifactReference: 'art-002-company-platform-dist',
    commitReference: '7a9c8f2',
    releaseNotesReference: 'docs/releases/v1.0.1-rc.1.md - Platform Engineering Domain #13 Control Plane Integration',
    releasedByEmail: 'lead.devops@docsearch.internal',
    releasedAt: '2026-08-29T11:20:00.000Z',
    metadata: { targetEnvironment: 'STAGING' }
  }
];

export const MOCK_PLATFORM_DEPLOYMENTS: DeploymentDto[] = [
  {
    id: 'dep00001-0000-0000-0000-000000000001',
    deploymentCode: 'DEP-PROD-20260828-01',
    environmentId: 'env00001-0000-0000-0000-000000000004',
    environmentName: 'Primary Production Healthcare Cluster',
    environmentType: 'PRODUCTION',
    artifactReference: 'art-oci-company-platform-1.0.0',
    releaseReference: 'REL-20260828-V1.0.0',
    commitReference: '9d8e7f6',
    deploymentStrategy: 'BLUE_GREEN',
    status: 'DEPLOYED',
    startedAt: '2026-08-28T14:45:00.000Z',
    completedAt: '2026-08-28T14:52:10.000Z',
    deployedByEmail: 'release.manager@docsearch.internal',
    metadata: { healthCheckPassed: true, zeroDowntime: true }
  },
  {
    id: 'dep00001-0000-0000-0000-000000000002',
    deploymentCode: 'DEP-STG-20260829-01',
    environmentId: 'env00001-0000-0000-0000-000000000003',
    environmentName: 'Staging & Pre-production Preview',
    environmentType: 'STAGING',
    artifactReference: 'art-002-company-platform-dist',
    releaseReference: 'REL-20260829-V1.0.1-RC1',
    commitReference: '7a9c8f2',
    deploymentStrategy: 'ROLLING',
    status: 'DEPLOYED',
    startedAt: '2026-08-29T11:25:00.000Z',
    completedAt: '2026-08-29T11:28:40.000Z',
    deployedByEmail: 'lead.devops@docsearch.internal',
    metadata: { automatedRollbackReady: true }
  }
];

export const MOCK_DEVEX_METRICS: DeveloperExperienceMetricDto[] = [
  {
    id: 'devx0001-0000-0000-0000-000000000001',
    metricType: 'BUILD_DURATION',
    metricName: 'Average Turborepo Build Duration',
    numericValue: 142000,
    unit: 'MS',
    evaluationPeriod: 'LAST_7_DAYS',
    sourceStatus: 'PENDING_TELEMETRY_PIPELINE',
    recordedAt: '2026-08-29T10:00:00.000Z',
    metadata: { target: '< 180000 MS' }
  },
  {
    id: 'devx0001-0000-0000-0000-000000000002',
    metricType: 'CI_DURATION',
    metricName: 'Average CI Pipeline Duration',
    numericValue: 285000,
    unit: 'MS',
    evaluationPeriod: 'LAST_7_DAYS',
    sourceStatus: 'PENDING_TELEMETRY_PIPELINE',
    recordedAt: '2026-08-29T10:00:00.000Z',
    metadata: { target: '< 300000 MS' }
  },
  {
    id: 'devx0001-0000-0000-0000-000000000003',
    metricType: 'DEPLOYMENT_FREQUENCY',
    metricName: 'Deployment Frequency',
    numericValue: 4,
    unit: 'RUNS_PER_DAY',
    evaluationPeriod: 'LAST_7_DAYS',
    sourceStatus: 'PENDING_TELEMETRY_PIPELINE',
    recordedAt: '2026-08-29T10:00:00.000Z',
    metadata: { target: '> 2 PER_DAY' }
  },
  {
    id: 'devx0001-0000-0000-0000-000000000004',
    metricType: 'PIPELINE_SUCCESS_RATE',
    metricName: 'Build & CI Success Rate',
    numericValue: 96,
    unit: 'PERCENT',
    evaluationPeriod: 'LAST_7_DAYS',
    sourceStatus: 'PENDING_TELEMETRY_PIPELINE',
    recordedAt: '2026-08-29T10:00:00.000Z',
    metadata: { target: '> 95%' }
  }
];

export const MOCK_PLATFORM_INCIDENTS: PlatformIncidentDto[] = [
  {
    id: 'pinc0001-0000-0000-0000-000000000001',
    incidentCode: 'INC-PLT-20260828-01',
    category: 'BUILD_FAILURE',
    severity: 'MEDIUM',
    title: 'ESLint Non-null Assertion Rule Violation in Service Layer',
    description: 'Build pipeline failed due to strict ESLint TypeScript rules disallowing non-null assertions.',
    source: 'PIPE-TURBO-LINT',
    status: 'RESOLVED',
    assignedToEmail: 'lead.devops@docsearch.internal',
    detectedAt: '2026-08-28T18:10:00.000Z',
    acknowledgedAt: '2026-08-28T18:12:00.000Z',
    resolvedAt: '2026-08-28T18:30:00.000Z',
    resolutionNotes: 'Replaced non-null assertions with safe undefined checks in service layer.',
    metadata: {},
    createdAt: '2026-08-28T18:10:00.000Z',
    updatedAt: '2026-08-28T18:30:00.000Z'
  },
  {
    id: 'pinc0001-0000-0000-0000-000000000002',
    incidentCode: 'INC-PLT-20260829-01',
    category: 'CONFIGURATION_ERROR',
    severity: 'LOW',
    title: 'Vault Secret Rotation Reminder for Staging Database Pointer',
    description: 'Staging database pointer reference is scheduled for routine 90-day rotation within 7 days.',
    source: 'VAULT_LIFECYCLE_MONITOR',
    status: 'OPEN',
    assignedToEmail: 'platform.security@docsearch.internal',
    detectedAt: '2026-08-29T08:00:00.000Z',
    metadata: {},
    createdAt: '2026-08-29T08:00:00.000Z',
    updatedAt: '2026-08-29T08:00:00.000Z'
  }
];

export const MOCK_PLATFORM_AUDIT_TRACES: PlatformAuditTraceDto[] = [
  {
    id: 'ptrc0001-0000-0000-0000-000000000001',
    traceId: 'TR-PLT-20260828-001',
    actorEmail: 'release.manager@docsearch.internal',
    action: 'PRODUCTION_DEPLOYMENT_PROMOTED',
    resourceReference: 'DEP-PROD-20260828-01',
    environment: 'PRODUCTION',
    operationStatus: 'SUCCESS',
    occurredAt: '2026-08-28T14:45:00.000Z',
    correlationReference: 'REL-20260828-V1.0.0',
    evidenceReference: 's3://audit-evidence/deploy-prod-20260828.json',
    reason: 'Initial Phase 1 production release approval',
    metadata: {}
  },
  {
    id: 'ptrc0001-0000-0000-0000-000000000002',
    actorEmail: 'lead.devops@docsearch.internal',
    traceId: 'TR-PLT-20260829-001',
    action: 'BUILD_PIPELINE_EXECUTED',
    resourceReference: 'PIPE-TURBO-VALIDATE',
    environment: 'DEVELOPMENT',
    operationStatus: 'SUCCESS',
    occurredAt: '2026-08-29T11:15:00.000Z',
    correlationReference: 'BR-20260829-001',
    evidenceReference: 's3://audit-evidence/build-run-20260829-001.json',
    reason: 'Monorepo quality gate verification before release candidate promotion',
    metadata: {}
  }
];
