import React, { useState, useEffect } from 'react';
import type {
  PlatformOverviewDto,
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
  PlatformEnvironmentType,
  DeploymentStrategy
} from '@docsearch/api-contracts';
import { platformEngineeringService } from '../../services/platform-engineering-service.js';
import { PlatformEngineeringOverviewView } from './PlatformEngineeringOverviewView.js';
import { BuildPipelineListView } from './BuildPipelineListView.js';
import { BuildPipelineProfileView } from './BuildPipelineProfileView.js';
import { BuildRunExplorerView } from './BuildRunExplorerView.js';
import { CICDPipelineListView } from './CICDPipelineListView.js';
import { CICDRunExplorerView } from './CICDRunExplorerView.js';
import { ArtifactRepositoryListView } from './ArtifactRepositoryListView.js';
import { ArtifactExplorerView } from './ArtifactExplorerView.js';
import { EnvironmentListView } from './EnvironmentListView.js';
import { EnvironmentConfigurationView } from './EnvironmentConfigurationView.js';
import { DependencyGraphView } from './DependencyGraphView.js';
import { DependencyNodeProfileView } from './DependencyNodeProfileView.js';
import { PackageReleaseListView } from './PackageReleaseListView.js';
import { DeploymentListView } from './DeploymentListView.js';
import { DeveloperExperienceView } from './DeveloperExperienceView.js';
import { PlatformIncidentCenterView } from './PlatformIncidentCenterView.js';
import { PlatformAuditTraceView } from './PlatformAuditTraceView.js';
import { Tabs, Badge, Spinner, ErrorState } from '@docsearch/ui-kit';

type ActiveTab =
  | 'overview'
  | 'build'
  | 'build-runs'
  | 'cicd'
  | 'artifacts'
  | 'environments'
  | 'configs'
  | 'dependencies'
  | 'releases'
  | 'deployments'
  | 'devex'
  | 'incidents'
  | 'audit';

export const PlatformEngineeringDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [overview, setOverview] = useState<PlatformOverviewDto | null>(null);
  const [projects, setProjects] = useState<PlatformProjectDto[]>([]);
  const [pipelines, setPipelines] = useState<BuildPipelineDto[]>([]);
  const [buildRuns, setBuildRuns] = useState<BuildRunDto[]>([]);
  const [cicdPipelines, setCicdPipelines] = useState<CICDPipelineDto[]>([]);
  const [cicdRuns, setCicdRuns] = useState<CICDRunDto[]>([]);
  const [artifactRepositories, setArtifactRepositories] = useState<ArtifactRepositoryDto[]>([]);
  const [artifacts, setArtifacts] = useState<ArtifactDto[]>([]);
  const [environments, setEnvironments] = useState<EnvironmentDto[]>([]);
  const [configurations, setConfigurations] = useState<EnvironmentConfigurationDto[]>([]);
  const [dependencyNodes, setDependencyNodes] = useState<DependencyNodeDto[]>([]);
  const [dependencyEdges, setDependencyEdges] = useState<DependencyEdgeDto[]>([]);
  const [packageReleases, setPackageReleases] = useState<PackageReleaseDto[]>([]);
  const [deployments, setDeployments] = useState<DeploymentDto[]>([]);
  const [devexMetrics, setDevexMetrics] = useState<DeveloperExperienceMetricDto[]>([]);
  const [incidents, setIncidents] = useState<PlatformIncidentDto[]>([]);
  const [auditTraces, setAuditTraces] = useState<PlatformAuditTraceDto[]>([]);

  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        overviewRes,
        projectsRes,
        pipelinesRes,
        buildRunsRes,
        cicdPipeRes,
        cicdRunsRes,
        reposRes,
        artifactsRes,
        environmentsRes,
        configsRes,
        nodesRes,
        edgesRes,
        releasesRes,
        deploymentsRes,
        devexRes,
        incidentsRes,
        tracesRes
      ] = await Promise.all([
        platformEngineeringService.getPlatformOverview(),
        platformEngineeringService.getProjects(),
        platformEngineeringService.getBuildPipelines(),
        platformEngineeringService.getBuildRuns(),
        platformEngineeringService.getCICDPipelines(),
        platformEngineeringService.getCICDRuns(),
        platformEngineeringService.getArtifactRepositories(),
        platformEngineeringService.getArtifacts(),
        platformEngineeringService.getEnvironments(),
        platformEngineeringService.getEnvironmentConfigurations(),
        platformEngineeringService.getDependencyNodes(),
        platformEngineeringService.getDependencyEdges(),
        platformEngineeringService.getPackageReleases(),
        platformEngineeringService.getDeployments(),
        platformEngineeringService.getDevExMetrics(),
        platformEngineeringService.getPlatformIncidents(),
        platformEngineeringService.getPlatformAuditTraces()
      ]);
      setOverview(overviewRes);
      setProjects(projectsRes);
      setPipelines(pipelinesRes);
      setBuildRuns(buildRunsRes);
      setCicdPipelines(cicdPipeRes);
      setCicdRuns(cicdRunsRes);
      setArtifactRepositories(reposRes);
      setArtifacts(artifactsRes);
      setEnvironments(environmentsRes);
      setConfigurations(configsRes);
      setDependencyNodes(nodesRes);
      setDependencyEdges(edgesRes);
      setPackageReleases(releasesRes);
      setDeployments(deploymentsRes);
      setDevexMetrics(devexRes);
      setIncidents(incidentsRes);
      setAuditTraces(tracesRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load platform engineering control plane');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleExecuteBuild = async (
    pipelineId: string,
    branch: string,
    commit: string,
    env: PlatformEnvironmentType,
    reason: string
  ) => {
    const run = await platformEngineeringService.executeBuildPipeline({
      pipelineId,
      branchReference: branch,
      commitReference: commit,
      environment: env,
      actorEmail: 'platform.lead@docsearch.internal',
      reason
    });
    setBuildRuns((prev) => [run, ...prev]);
  };

  const handleCancelBuildRun = async (runId: string, reason: string) => {
    const updated = await platformEngineeringService.cancelBuildRun({
      runId,
      actorEmail: 'platform.lead@docsearch.internal',
      reason
    });
    setBuildRuns((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handlePromoteDeployment = async (
    targetEnvId: string,
    artifactRef: string,
    commitRef: string,
    strategy: DeploymentStrategy,
    reason: string
  ) => {
    const dep = await platformEngineeringService.promoteDeployment({
      targetEnvironmentId: targetEnvId,
      artifactReference: artifactRef,
      commitReference: commitRef,
      deploymentStrategy: strategy,
      actorEmail: 'platform.lead@docsearch.internal',
      reason
    });
    setDeployments((prev) => [dep, ...prev]);
  };

  const handleRollbackDeployment = async (deploymentId: string, rollbackArtifactRef: string, reason: string) => {
    const dep = await platformEngineeringService.rollbackDeployment({
      deploymentId,
      rollbackArtifactReference: rollbackArtifactRef,
      actorEmail: 'platform.lead@docsearch.internal',
      reason
    });
    setDeployments((prev) => [dep, ...prev]);
  };

  const handlePromoteRelease = async (releaseId: string, reason: string) => {
    const updated = await platformEngineeringService.promotePackageRelease({
      releaseId,
      actorEmail: 'platform.lead@docsearch.internal',
      reason
    });
    setPackageReleases((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleAcknowledgeIncident = async (incidentId: string, assignedToEmail: string, reason: string) => {
    const updated = await platformEngineeringService.acknowledgePlatformIncident({
      incidentId,
      assignedToEmail,
      actorEmail: 'platform.lead@docsearch.internal',
      reason
    });
    setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleResolveIncident = async (incidentId: string, resolutionNotes: string, reason: string) => {
    const updated = await platformEngineeringService.resolvePlatformIncident({
      incidentId,
      resolutionNotes,
      actorEmail: 'platform.lead@docsearch.internal',
      reason
    });
    setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  if (isLoading && !overview) {
    return (
      <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Spinner size="lg" />
        <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Loading Platform Engineering control plane...
        </span>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <ErrorState title="Platform Engineering Control Plane Unavailable" message={error} onRetry={loadData} />
    );
  }

  // Drilldown: Pipeline Profile
  if (selectedPipelineId) {
    const pipe = pipelines.find((p) => p.id === selectedPipelineId);
    if (pipe) {
      return (
        <BuildPipelineProfileView
          pipeline={pipe}
          runs={buildRuns.filter((r) => r.pipelineId === pipe.id)}
          onBack={() => setSelectedPipelineId(null)}
          onRunBuild={() => {
            void handleExecuteBuild(pipe.id, 'main', '7a9c8f2', pipe.defaultEnvironment, 'Triggered from pipeline profile');
          }}
        />
      );
    }
  }

  // Drilldown: Dependency Node Profile
  if (selectedNodeId) {
    const node = dependencyNodes.find((n) => n.id === selectedNodeId);
    if (node) {
      return (
        <DependencyNodeProfileView
          node={node}
          incomingEdges={dependencyEdges.filter((e) => e.targetNodeId === node.id)}
          outgoingEdges={dependencyEdges.filter((e) => e.sourceNodeId === node.id)}
          onBack={() => setSelectedNodeId(null)}
        />
      );
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              Platform Engineering
            </h1>
            
            <Badge variant="warning">Production View</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
            Turborepo build orchestration, CI/CD automation, artifact registry, environment configuration matrices, dependency graphs, and DevEx telemetry
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'overview',
            label: '📊 Overview'
          },
          {
            id: 'build',
            label: '🏗️ Build & Turborepo',
            badge: <Badge variant="neutral">{pipelines.length}</Badge>
          },
          {
            id: 'build-runs',
            label: '📜 Build Runs',
            badge: <Badge variant="neutral">{buildRuns.length}</Badge>
          },
          {
            id: 'cicd',
            label: '🔄 CI/CD Pipelines',
            badge: <Badge variant="neutral">{cicdPipelines.length}</Badge>
          },
          {
            id: 'artifacts',
            label: '📦 Artifact Registry',
            badge: <Badge variant="neutral">{artifacts.length}</Badge>
          },
          {
            id: 'environments',
            label: '🌐 Environments',
            badge: <Badge variant="neutral">{environments.length}</Badge>
          },
          {
            id: 'configs',
            label: '🔑 Env Configurations',
            badge: <Badge variant="neutral">{configurations.length}</Badge>
          },
          {
            id: 'dependencies',
            label: '🕸️ Dependency Graph',
            badge: <Badge variant="neutral">{dependencyNodes.length}</Badge>
          },
          {
            id: 'releases',
            label: '🏷️ Package Releases',
            badge: <Badge variant={packageReleases.filter((r) => r.status === 'CANDIDATE').length > 0 ? 'warning' : 'neutral'}>{packageReleases.length}</Badge>
          },
          {
            id: 'deployments',
            label: '🚀 Deployments',
            badge: <Badge variant="neutral">{deployments.length}</Badge>
          },
          {
            id: 'devex',
            label: '👨‍💻 DevEx Metrics',
            badge: <Badge variant="neutral">{devexMetrics.length}</Badge>
          },
          {
            id: 'incidents',
            label: '🚨 Incidents',
            badge: <Badge variant={incidents.filter((i) => i.status === 'OPEN').length > 0 ? 'danger' : 'neutral'}>{incidents.length}</Badge>
          },
          {
            id: 'audit',
            label: '🔍 Audit Trace',
            badge: <Badge variant="neutral">{auditTraces.length}</Badge>
          }
        ]}
        activeTabId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as ActiveTab)}
      />

      {/* Tab Contents */}
      {activeTab === 'overview' && overview && (
        <PlatformEngineeringOverviewView
          overview={overview}
          projects={projects}
          pipelines={pipelines}
          deployments={deployments}
          incidents={incidents}
        />
      )}

      {activeTab === 'build' && (
        <BuildPipelineListView
          pipelines={pipelines}
          onSelectPipeline={(id) => setSelectedPipelineId(id)}
          onExecuteBuild={handleExecuteBuild}
        />
      )}

      {activeTab === 'build-runs' && (
        <BuildRunExplorerView
          runs={buildRuns}
          onCancelRun={handleCancelBuildRun}
        />
      )}

      {activeTab === 'cicd' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <CICDPipelineListView pipelines={cicdPipelines} />
          <CICDRunExplorerView runs={cicdRuns} />
        </div>
      )}

      {activeTab === 'artifacts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <ArtifactRepositoryListView repositories={artifactRepositories} />
          <ArtifactExplorerView artifacts={artifacts} />
        </div>
      )}

      {activeTab === 'environments' && (
        <EnvironmentListView
          environments={environments}
          onSelectEnvironment={(_id) => setActiveTab('configs')}
        />
      )}

      {activeTab === 'configs' && (
        <EnvironmentConfigurationView configurations={configurations} />
      )}

      {activeTab === 'dependencies' && (
        <DependencyGraphView
          nodes={dependencyNodes}
          edges={dependencyEdges}
          onSelectNode={(id) => setSelectedNodeId(id)}
        />
      )}

      {activeTab === 'releases' && (
        <PackageReleaseListView
          releases={packageReleases}
          onPromoteRelease={handlePromoteRelease}
        />
      )}

      {activeTab === 'deployments' && (
        <DeploymentListView
          deployments={deployments}
          environments={environments}
          onPromoteDeployment={handlePromoteDeployment}
          onRollbackDeployment={handleRollbackDeployment}
        />
      )}

      {activeTab === 'devex' && (
        <DeveloperExperienceView metrics={devexMetrics} />
      )}

      {activeTab === 'incidents' && (
        <PlatformIncidentCenterView
          incidents={incidents}
          onAcknowledgeIncident={handleAcknowledgeIncident}
          onResolveIncident={handleResolveIncident}
        />
      )}

      {activeTab === 'audit' && (
        <PlatformAuditTraceView auditTraces={auditTraces} />
      )}
    </div>
  );
};
