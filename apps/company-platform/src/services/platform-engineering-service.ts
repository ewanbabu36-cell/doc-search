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
  PlatformOverviewDto,
  CreatePlatformProjectRequest,
  CreateBuildPipelineRequest,
  ExecuteBuildPipelineRequest,
  CancelBuildRunRequest,
  PromoteDeploymentRequest,
  RollbackDeploymentRequest,
  RegisterArtifactRequest,
  CreatePackageReleaseRequest,
  PromotePackageReleaseRequest,
  DeprecatePackageReleaseRequest,
  UpdateEnvironmentConfigurationRequest,
  CreatePlatformIncidentRequest,
  AcknowledgePlatformIncidentRequest,
  ResolvePlatformIncidentRequest
} from '@docsearch/api-contracts';
import {
  MOCK_PLATFORM_OVERVIEW,
  MOCK_PLATFORM_PROJECTS,
  MOCK_BUILD_PIPELINES,
  MOCK_BUILD_RUNS,
  MOCK_CICD_PIPELINES,
  MOCK_CICD_RUNS,
  MOCK_ARTIFACT_REPOSITORIES,
  MOCK_ARTIFACTS,
  MOCK_PLATFORM_ENVIRONMENTS,
  MOCK_ENVIRONMENT_CONFIGURATIONS,
  MOCK_DEPENDENCY_NODES,
  MOCK_DEPENDENCY_EDGES,
  MOCK_PACKAGE_RELEASES,
  MOCK_PLATFORM_DEPLOYMENTS,
  MOCK_DEVEX_METRICS,
  MOCK_PLATFORM_INCIDENTS,
  MOCK_PLATFORM_AUDIT_TRACES
} from './mock-platform-engineering-data.js';

export interface IPlatformEngineeringService {
  getPlatformOverview(): Promise<PlatformOverviewDto>;
  getProjects(): Promise<PlatformProjectDto[]>;
  createProject(req: CreatePlatformProjectRequest): Promise<PlatformProjectDto>;
  getBuildPipelines(): Promise<BuildPipelineDto[]>;
  createBuildPipeline(req: CreateBuildPipelineRequest): Promise<BuildPipelineDto>;
  executeBuildPipeline(req: ExecuteBuildPipelineRequest): Promise<BuildRunDto>;
  cancelBuildRun(req: CancelBuildRunRequest): Promise<BuildRunDto>;
  getBuildRuns(): Promise<BuildRunDto[]>;
  getCICDPipelines(): Promise<CICDPipelineDto[]>;
  getCICDRuns(): Promise<CICDRunDto[]>;
  getArtifactRepositories(): Promise<ArtifactRepositoryDto[]>;
  getArtifacts(): Promise<ArtifactDto[]>;
  registerArtifact(req: RegisterArtifactRequest): Promise<ArtifactDto>;
  getEnvironments(): Promise<EnvironmentDto[]>;
  getEnvironmentConfigurations(environmentId?: string): Promise<EnvironmentConfigurationDto[]>;
  updateEnvironmentConfiguration(req: UpdateEnvironmentConfigurationRequest): Promise<EnvironmentConfigurationDto>;
  getDependencyNodes(): Promise<DependencyNodeDto[]>;
  getDependencyEdges(): Promise<DependencyEdgeDto[]>;
  getPackageReleases(): Promise<PackageReleaseDto[]>;
  createPackageRelease(req: CreatePackageReleaseRequest): Promise<PackageReleaseDto>;
  promotePackageRelease(req: PromotePackageReleaseRequest): Promise<PackageReleaseDto>;
  deprecatePackageRelease(req: DeprecatePackageReleaseRequest): Promise<PackageReleaseDto>;
  getDeployments(): Promise<DeploymentDto[]>;
  promoteDeployment(req: PromoteDeploymentRequest): Promise<DeploymentDto>;
  rollbackDeployment(req: RollbackDeploymentRequest): Promise<DeploymentDto>;
  getDevExMetrics(): Promise<DeveloperExperienceMetricDto[]>;
  getPlatformIncidents(): Promise<PlatformIncidentDto[]>;
  createPlatformIncident(req: CreatePlatformIncidentRequest): Promise<PlatformIncidentDto>;
  acknowledgePlatformIncident(req: AcknowledgePlatformIncidentRequest): Promise<PlatformIncidentDto>;
  resolvePlatformIncident(req: ResolvePlatformIncidentRequest): Promise<PlatformIncidentDto>;
  getPlatformAuditTraces(): Promise<PlatformAuditTraceDto[]>;
}

export class PlatformEngineeringService implements IPlatformEngineeringService {
  private projects: PlatformProjectDto[] = [...MOCK_PLATFORM_PROJECTS];
  private buildPipelines: BuildPipelineDto[] = [...MOCK_BUILD_PIPELINES];
  private buildRuns: BuildRunDto[] = [...MOCK_BUILD_RUNS];
  private cicdPipelines: CICDPipelineDto[] = [...MOCK_CICD_PIPELINES];
  private cicdRuns: CICDRunDto[] = [...MOCK_CICD_RUNS];
  private artifactRepositories: ArtifactRepositoryDto[] = [...MOCK_ARTIFACT_REPOSITORIES];
  private artifacts: ArtifactDto[] = [...MOCK_ARTIFACTS];
  private environments: EnvironmentDto[] = [...MOCK_PLATFORM_ENVIRONMENTS];
  private environmentConfigurations: EnvironmentConfigurationDto[] = [...MOCK_ENVIRONMENT_CONFIGURATIONS];
  private dependencyNodes: DependencyNodeDto[] = [...MOCK_DEPENDENCY_NODES];
  private dependencyEdges: DependencyEdgeDto[] = [...MOCK_DEPENDENCY_EDGES];
  private packageReleases: PackageReleaseDto[] = [...MOCK_PACKAGE_RELEASES];
  private deployments: DeploymentDto[] = [...MOCK_PLATFORM_DEPLOYMENTS];
  private devexMetrics: DeveloperExperienceMetricDto[] = [...MOCK_DEVEX_METRICS];
  private incidents: PlatformIncidentDto[] = [...MOCK_PLATFORM_INCIDENTS];
  private auditTraces: PlatformAuditTraceDto[] = [...MOCK_PLATFORM_AUDIT_TRACES];

  async getPlatformOverview(): Promise<PlatformOverviewDto> {
    return {
      ...MOCK_PLATFORM_OVERVIEW,
      activeProjectsCount: this.projects.filter((p) => p.status === 'ACTIVE').length,
      buildPipelinesCount: this.buildPipelines.filter((b) => b.status === 'ACTIVE').length,
      recentBuildRunsCount: this.buildRuns.length,
      failedBuildRunsCount: this.buildRuns.filter((r) => r.status === 'FAILED').length,
      artifactRepositoriesCount: this.artifactRepositories.length,
      activeEnvironmentsCount: this.environments.filter((e) => e.status === 'HEALTHY').length,
      pendingReleasesCount: this.packageReleases.filter((r) => r.status === 'CANDIDATE').length,
      openIncidentsCount: this.incidents.filter((i) => i.status === 'OPEN').length
    };
  }

  async getProjects(): Promise<PlatformProjectDto[]> {
    return [...this.projects];
  }

  async createProject(req: CreatePlatformProjectRequest): Promise<PlatformProjectDto> {
    const newProj: PlatformProjectDto = {
      id: `proj0001-0000-0000-0000-${String(Date.now()).slice(-12)}`,
      projectCode: req.projectCode,
      projectName: req.projectName,
      description: req.description,
      repositoryReference: req.repositoryReference,
      defaultBranch: req.defaultBranch,
      projectType: req.projectType,
      status: 'ACTIVE',
      ownerEmail: req.ownerEmail,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.projects.unshift(newProj);
    this.recordAuditTrace(req.actorEmail, 'PLATFORM_PROJECT_CREATED', newProj.projectCode, req.reason);
    return newProj;
  }

  async getBuildPipelines(): Promise<BuildPipelineDto[]> {
    return [...this.buildPipelines];
  }

  async createBuildPipeline(req: CreateBuildPipelineRequest): Promise<BuildPipelineDto> {
    const proj = this.projects.find((p) => p.id === req.projectId);
    const newPipe: BuildPipelineDto = {
      id: `pipe0001-0000-0000-0000-${String(Date.now()).slice(-12)}`,
      pipelineCode: req.pipelineCode,
      projectId: req.projectId,
      projectName: proj?.projectName,
      pipelineName: req.pipelineName,
      pipelineType: req.pipelineType,
      definitionReference: req.definitionReference,
      triggerType: req.triggerType,
      status: 'ACTIVE',
      defaultEnvironment: req.defaultEnvironment,
      timeoutSeconds: req.timeoutSeconds,
      ownerEmail: req.ownerEmail,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.buildPipelines.unshift(newPipe);
    this.recordAuditTrace(req.actorEmail, 'BUILD_PIPELINE_CREATED', newPipe.pipelineCode, req.reason);
    return newPipe;
  }

  async executeBuildPipeline(req: ExecuteBuildPipelineRequest): Promise<BuildRunDto> {
    const pipe = this.buildPipelines.find((p) => p.id === req.pipelineId);
    if (!pipe) throw new Error('Build pipeline not found');
    const newRun: BuildRunDto = {
      id: `brun0001-0000-0000-0000-${String(Date.now()).slice(-12)}`,
      runCode: `BR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(this.buildRuns.length + 1).padStart(3, '0')}`,
      pipelineId: req.pipelineId,
      pipelineName: pipe.pipelineName,
      commitReference: req.commitReference,
      branchReference: req.branchReference,
      triggeredByEmail: req.actorEmail,
      status: 'SUCCEEDED',
      startedAt: new Date().toISOString(),
      completedAt: new Date(Date.now() + 120000).toISOString(),
      durationMs: 120000,
      failedTaskCount: 0,
      successfulTaskCount: 11,
      artifactReference: `art-dist-${String(Date.now()).slice(-6)}`,
      logReference: `s3://build-logs/br-${String(Date.now()).slice(-6)}.log`,
      environment: req.environment,
      metadata: { executedBySim: true }
    };
    this.buildRuns.unshift(newRun);
    this.recordAuditTrace(req.actorEmail, 'BUILD_PIPELINE_EXECUTED', newRun.runCode, req.reason);
    return newRun;
  }

  async cancelBuildRun(req: CancelBuildRunRequest): Promise<BuildRunDto> {
    const idx = this.buildRuns.findIndex((r) => r.id === req.runId);
    const existing = idx !== -1 ? this.buildRuns[idx] : undefined;
    if (!existing) throw new Error('Build run not found');
    const updated: BuildRunDto = {
      ...existing,
      status: 'CANCELLED',
      completedAt: new Date().toISOString()
    };
    this.buildRuns[idx] = updated;
    this.recordAuditTrace(req.actorEmail, 'BUILD_RUN_CANCELLED', updated.runCode, req.reason);
    return updated;
  }

  async getBuildRuns(): Promise<BuildRunDto[]> {
    return [...this.buildRuns];
  }

  async getCICDPipelines(): Promise<CICDPipelineDto[]> {
    return [...this.cicdPipelines];
  }

  async getCICDRuns(): Promise<CICDRunDto[]> {
    return [...this.cicdRuns];
  }

  async getArtifactRepositories(): Promise<ArtifactRepositoryDto[]> {
    return [...this.artifactRepositories];
  }

  async getArtifacts(): Promise<ArtifactDto[]> {
    return [...this.artifacts];
  }

  async registerArtifact(req: RegisterArtifactRequest): Promise<ArtifactDto> {
    const repo = this.artifactRepositories.find((r) => r.id === req.repositoryId);
    const newArt: ArtifactDto = {
      id: `art00001-0000-0000-0000-${String(Date.now()).slice(-12)}`,
      artifactCode: req.artifactCode,
      repositoryId: req.repositoryId,
      repositoryName: repo?.name,
      packageName: req.packageName,
      version: req.version,
      artifactType: req.artifactType,
      digest: req.digest,
      sizeBytes: req.sizeBytes,
      buildRunId: req.buildRunId,
      status: 'RELEASED',
      publishedAt: new Date().toISOString(),
      retentionUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {}
    };
    this.artifacts.unshift(newArt);
    this.recordAuditTrace(req.actorEmail, 'ARTIFACT_REGISTERED', newArt.artifactCode, req.reason);
    return newArt;
  }

  async getEnvironments(): Promise<EnvironmentDto[]> {
    return [...this.environments];
  }

  async getEnvironmentConfigurations(environmentId?: string): Promise<EnvironmentConfigurationDto[]> {
    if (environmentId) {
      return this.environmentConfigurations.filter((c) => c.environmentId === environmentId);
    }
    return [...this.environmentConfigurations];
  }

  async updateEnvironmentConfiguration(req: UpdateEnvironmentConfigurationRequest): Promise<EnvironmentConfigurationDto> {
    const idx = this.environmentConfigurations.findIndex(
      (c) => c.environmentId === req.environmentId && c.configurationKey === req.configurationKey
    );
    const env = this.environments.find((e) => e.id === req.environmentId);
    if (idx !== -1) {
      const existing = this.environmentConfigurations[idx];
      if (!existing) throw new Error('Configuration not found');
      const updated: EnvironmentConfigurationDto = {
        ...existing,
        valueReference: req.valueReference,
        valueType: req.valueType,
        classification: req.classification,
        secretReference: req.secretReference,
        lastRotatedAt: req.secretReference ? new Date().toISOString() : existing.lastRotatedAt,
        updatedByEmail: req.actorEmail,
        updatedAt: new Date().toISOString()
      };
      this.environmentConfigurations[idx] = updated;
      this.recordAuditTrace(req.actorEmail, 'ENVIRONMENT_CONFIG_UPDATED', `${env?.environmentCode ?? ''} / ${updated.configurationKey}`, req.reason);
      return updated;
    } else {
      const newConfig: EnvironmentConfigurationDto = {
        id: `econf001-0000-0000-0000-${String(Date.now()).slice(-12)}`,
        environmentId: req.environmentId,
        environmentCode: env?.environmentCode,
        configurationCode: `CONF-${env?.environmentCode ?? 'ENV'}-${req.configurationKey.toUpperCase().replace(/_/g, '-')}`,
        configurationKey: req.configurationKey,
        valueReference: req.valueReference,
        valueType: req.valueType,
        classification: req.classification,
        secretReference: req.secretReference,
        status: 'ACTIVE',
        lastRotatedAt: req.secretReference ? new Date().toISOString() : undefined,
        updatedByEmail: req.actorEmail,
        updatedAt: new Date().toISOString(),
        metadata: {}
      };
      this.environmentConfigurations.unshift(newConfig);
      this.recordAuditTrace(req.actorEmail, 'ENVIRONMENT_CONFIG_CREATED', `${env?.environmentCode ?? ''} / ${newConfig.configurationKey}`, req.reason);
      return newConfig;
    }
  }

  async getDependencyNodes(): Promise<DependencyNodeDto[]> {
    return [...this.dependencyNodes];
  }

  async getDependencyEdges(): Promise<DependencyEdgeDto[]> {
    return [...this.dependencyEdges];
  }

  async getPackageReleases(): Promise<PackageReleaseDto[]> {
    return [...this.packageReleases];
  }

  async createPackageRelease(req: CreatePackageReleaseRequest): Promise<PackageReleaseDto> {
    const newRel: PackageReleaseDto = {
      id: `rel00001-0000-0000-0000-${String(Date.now()).slice(-12)}`,
      releaseCode: req.releaseCode,
      packageName: req.packageName,
      version: req.version,
      releaseType: req.releaseType,
      status: 'CANDIDATE',
      artifactReference: req.artifactReference,
      commitReference: req.commitReference,
      releaseNotesReference: req.releaseNotesReference,
      releasedByEmail: req.actorEmail,
      releasedAt: new Date().toISOString(),
      metadata: {}
    };
    this.packageReleases.unshift(newRel);
    this.recordAuditTrace(req.actorEmail, 'PACKAGE_RELEASE_CREATED', `${newRel.packageName}@${newRel.version}`, req.reason);
    return newRel;
  }

  async promotePackageRelease(req: PromotePackageReleaseRequest): Promise<PackageReleaseDto> {
    const idx = this.packageReleases.findIndex((r) => r.id === req.releaseId);
    const existing = idx !== -1 ? this.packageReleases[idx] : undefined;
    if (!existing) throw new Error('Package release not found');
    const updated: PackageReleaseDto = {
      ...existing,
      status: 'RELEASED',
      releasedAt: new Date().toISOString()
    };
    this.packageReleases[idx] = updated;
    this.recordAuditTrace(req.actorEmail, 'PACKAGE_RELEASE_PROMOTED', `${updated.packageName}@${updated.version}`, req.reason);
    return updated;
  }

  async deprecatePackageRelease(req: DeprecatePackageReleaseRequest): Promise<PackageReleaseDto> {
    const idx = this.packageReleases.findIndex((r) => r.id === req.releaseId);
    const existing = idx !== -1 ? this.packageReleases[idx] : undefined;
    if (!existing) throw new Error('Package release not found');
    const updated: PackageReleaseDto = {
      ...existing,
      status: 'DEPRECATED',
      deprecationDate: new Date().toISOString()
    };
    this.packageReleases[idx] = updated;
    this.recordAuditTrace(req.actorEmail, 'PACKAGE_RELEASE_DEPRECATED', `${updated.packageName}@${updated.version}`, req.reason);
    return updated;
  }

  async getDeployments(): Promise<DeploymentDto[]> {
    return [...this.deployments];
  }

  async promoteDeployment(req: PromoteDeploymentRequest): Promise<DeploymentDto> {
    const env = this.environments.find((e) => e.id === req.targetEnvironmentId);
    if (!env) throw new Error('Target environment not found');
    const newDep: DeploymentDto = {
      id: `dep00001-0000-0000-0000-${String(Date.now()).slice(-12)}`,
      deploymentCode: `DEP-${env.environmentCode}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(this.deployments.length + 1).padStart(2, '0')}`,
      environmentId: req.targetEnvironmentId,
      environmentName: env.environmentName,
      environmentType: env.environmentType,
      artifactReference: req.artifactReference,
      commitReference: req.commitReference,
      deploymentStrategy: req.deploymentStrategy,
      status: 'DEPLOYED',
      startedAt: new Date().toISOString(),
      completedAt: new Date(Date.now() + 180000).toISOString(),
      deployedByEmail: req.actorEmail,
      metadata: { auditedPromotion: true }
    };
    this.deployments.unshift(newDep);
    this.recordAuditTrace(req.actorEmail, 'DEPLOYMENT_PROMOTED', `${newDep.deploymentCode} -> ${env.environmentCode}`, req.reason);
    return newDep;
  }

  async rollbackDeployment(req: RollbackDeploymentRequest): Promise<DeploymentDto> {
    const dep = this.deployments.find((d) => d.id === req.deploymentId);
    if (!dep) throw new Error('Deployment not found');
    const rolledBack: DeploymentDto = {
      id: `dep00001-0000-0000-0000-${String(Date.now()).slice(-12)}`,
      deploymentCode: `DEP-ROLLBACK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(this.deployments.length + 1).padStart(2, '0')}`,
      environmentId: dep.environmentId,
      environmentName: dep.environmentName,
      environmentType: dep.environmentType,
      artifactReference: req.rollbackArtifactReference,
      commitReference: dep.commitReference,
      deploymentStrategy: 'ROLLING',
      status: 'ROLLED_BACK',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      deployedByEmail: req.actorEmail,
      rollbackReference: dep.deploymentCode,
      metadata: { rollbackTarget: dep.deploymentCode }
    };
    this.deployments.unshift(rolledBack);
    this.recordAuditTrace(req.actorEmail, 'DEPLOYMENT_ROLLED_BACK', `${dep.deploymentCode} rolled back to ${req.rollbackArtifactReference}`, req.reason);
    return rolledBack;
  }

  async getDevExMetrics(): Promise<DeveloperExperienceMetricDto[]> {
    return [...this.devexMetrics];
  }

  async getPlatformIncidents(): Promise<PlatformIncidentDto[]> {
    return [...this.incidents];
  }

  async createPlatformIncident(req: CreatePlatformIncidentRequest): Promise<PlatformIncidentDto> {
    const newInc: PlatformIncidentDto = {
      id: `pinc0001-0000-0000-0000-${String(Date.now()).slice(-12)}`,
      incidentCode: `INC-PLT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(this.incidents.length + 1).padStart(2, '0')}`,
      category: req.category,
      severity: req.severity,
      title: req.title,
      description: req.description,
      source: req.source,
      status: 'OPEN',
      detectedAt: new Date().toISOString(),
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.incidents.unshift(newInc);
    this.recordAuditTrace(req.actorEmail, 'PLATFORM_INCIDENT_CREATED', newInc.incidentCode, req.reason);
    return newInc;
  }

  async acknowledgePlatformIncident(req: AcknowledgePlatformIncidentRequest): Promise<PlatformIncidentDto> {
    const idx = this.incidents.findIndex((i) => i.id === req.incidentId);
    const existing = idx !== -1 ? this.incidents[idx] : undefined;
    if (!existing) throw new Error('Incident not found');
    const updated: PlatformIncidentDto = {
      ...existing,
      status: 'INVESTIGATING',
      assignedToEmail: req.assignedToEmail,
      acknowledgedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.incidents[idx] = updated;
    this.recordAuditTrace(req.actorEmail, 'PLATFORM_INCIDENT_ACKNOWLEDGED', updated.incidentCode, req.reason);
    return updated;
  }

  async resolvePlatformIncident(req: ResolvePlatformIncidentRequest): Promise<PlatformIncidentDto> {
    const idx = this.incidents.findIndex((i) => i.id === req.incidentId);
    const existing = idx !== -1 ? this.incidents[idx] : undefined;
    if (!existing) throw new Error('Incident not found');
    const updated: PlatformIncidentDto = {
      ...existing,
      status: 'RESOLVED',
      resolvedAt: new Date().toISOString(),
      resolutionNotes: req.resolutionNotes,
      updatedAt: new Date().toISOString()
    };
    this.incidents[idx] = updated;
    this.recordAuditTrace(req.actorEmail, 'PLATFORM_INCIDENT_RESOLVED', updated.incidentCode, req.reason);
    return updated;
  }

  async getPlatformAuditTraces(): Promise<PlatformAuditTraceDto[]> {
    return [...this.auditTraces];
  }

  private recordAuditTrace(actorEmail: string, action: string, resourceReference: string, reason: string) {
    const trace: PlatformAuditTraceDto = {
      id: `ptrc0001-0000-0000-0000-${String(Date.now()).slice(-12)}`,
      traceId: `TR-PLT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(this.auditTraces.length + 1).padStart(3, '0')}`,
      actorEmail,
      action,
      resourceReference,
      environment: 'DEVELOPMENT',
      operationStatus: 'SUCCESS',
      occurredAt: new Date().toISOString(),
      correlationReference: `CORR-${String(Date.now()).slice(-8)}`,
      evidenceReference: `s3://audit-traces/platform-${String(Date.now()).slice(-8)}.json`,
      reason,
      metadata: {}
    };
    this.auditTraces.unshift(trace);
  }
}

export const platformEngineeringService = new PlatformEngineeringService();
