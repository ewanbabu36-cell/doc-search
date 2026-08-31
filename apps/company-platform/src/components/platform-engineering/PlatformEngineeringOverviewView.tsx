import React from 'react';
import type {
  PlatformOverviewDto,
  PlatformProjectDto,
  BuildPipelineDto,
  DeploymentDto,
  PlatformIncidentDto
} from '@docsearch/api-contracts';
import { Card, Badge, Alert } from '@docsearch/ui-kit';

export interface PlatformEngineeringOverviewViewProps {
  overview: PlatformOverviewDto;
  projects: PlatformProjectDto[];
  pipelines: BuildPipelineDto[];
  deployments: DeploymentDto[];
  incidents: PlatformIncidentDto[];
}

export const PlatformEngineeringOverviewView: React.FC<PlatformEngineeringOverviewViewProps> = ({
  overview,
  projects,
  pipelines,
  deployments,
  incidents
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Telemetry Notice */}
      <Alert type="info" title="Live Telemetry — Live Telemetry">
        Live platform telemetry, CI/CD runner streams, and build cluster logs are simulated via sample data fixtures. <strong>Live platform telemetry is not connected.</strong> No synthetic uptime or fake production reliability scores are fabricated.
      </Alert>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Active Projects
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              {overview.activeProjectsCount}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              Turborepo Monorepo Root
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Build Pipelines
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-primary)' }}>
              {overview.buildPipelinesCount}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              Orchestrated Tasks
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Recent Build Runs
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              {overview.recentBuildRunsCount}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              {overview.failedBuildRunsCount > 0 ? (
                <span style={{ color: 'var(--ds-color-danger)', fontWeight: '600' }}>
                  {overview.failedBuildRunsCount} build failure recorded
                </span>
              ) : (
                'All recent builds green'
              )}
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Active Environments
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-success)' }}>
              {overview.activeEnvironmentsCount}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              Local, Dev, Stg, Prod, DR
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Platform Incidents
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: overview.openIncidentsCount > 0 ? 'var(--ds-color-warning)' : 'var(--ds-color-text-primary)' }}>
              {overview.openIncidentsCount}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              Open triage alerts
            </span>
          </div>
        </Card>
      </div>

      {/* Grid of Platform Engineering Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Monorepo Projects */}
        <Card title="Monorepo Projects & Workspaces" subtitle="Turborepo orchestration root and workspace packages" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {projects.map((p) => (
              <div
                key={p.id}
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--ds-color-surface-subtle)',
                  border: '1px solid var(--ds-color-border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-primary)' }}>{p.projectName}</strong>
                    <Badge variant="primary">{p.projectType}</Badge>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', fontFamily: 'var(--ds-font-mono)' }}>
                    {p.repositoryReference} ({p.defaultBranch})
                  </span>
                </div>
                <Badge variant={p.status === 'ACTIVE' ? 'success' : 'neutral'}>{p.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Build Pipelines */}
        <Card title="Build Pipeline Tasks" subtitle="Turborepo pipeline tasks configured in monorepo" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pipelines.slice(0, 4).map((pipe) => (
              <div
                key={pipe.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--ds-color-surface-subtle)',
                  border: '1px solid var(--ds-color-border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-primary)' }}>
                    {pipe.pipelineName}
                  </strong>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)', fontFamily: 'var(--ds-font-mono)' }}>
                      {pipe.definitionReference}
                    </span>
                  </div>
                </div>
                <Badge variant={pipe.lastRunStatus === 'SUCCEEDED' ? 'success' : 'warning'}>
                  {pipe.lastRunStatus ?? pipe.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Active Deployments */}
        <Card title="Recent Workload Deployments" subtitle="Latest promotions across environment clusters" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {deployments.map((d) => (
              <div
                key={d.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--ds-color-surface-subtle)',
                  border: '1px solid var(--ds-color-border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-primary)' }}>
                    {d.environmentName ?? d.environmentType}
                  </strong>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                    {d.deploymentCode} • Strategy: {d.deploymentStrategy}
                  </div>
                </div>
                <Badge variant={d.status === 'DEPLOYED' ? 'success' : 'neutral'}>
                  {d.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Platform Incidents */}
        <Card title="Platform Incidents & Degradation" subtitle="Engineering alerts and build degradation notices" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {incidents.length === 0 ? (
              <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                Zero active platform incidents.
              </span>
            ) : (
              incidents.map((inc) => (
                <div
                  key={inc.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--ds-color-surface-subtle)',
                    border: '1px solid var(--ds-color-border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-primary)' }}>
                      {inc.title}
                    </strong>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                      {inc.incidentCode} • Category: {inc.category}
                    </div>
                  </div>
                  <Badge variant={inc.status === 'RESOLVED' ? 'success' : 'danger'}>
                    {inc.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
