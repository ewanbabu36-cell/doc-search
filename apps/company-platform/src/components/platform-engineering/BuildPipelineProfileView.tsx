import React from 'react';
import type { BuildPipelineDto, BuildRunDto } from '@docsearch/api-contracts';
import {
  Card,
  Button,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface BuildPipelineProfileViewProps {
  pipeline: BuildPipelineDto;
  runs: BuildRunDto[];
  onBack: () => void;
  onRunBuild: () => void;
}

export const BuildPipelineProfileView: React.FC<BuildPipelineProfileViewProps> = ({
  pipeline,
  runs,
  onBack,
  onRunBuild
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Button variant="outline" size="sm" onClick={onBack}>
              ← Back to Pipelines
            </Button>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              {pipeline.pipelineName}
            </h1>
            <Badge variant="primary">{pipeline.pipelineType}</Badge>
            <Badge variant={pipeline.status === 'ACTIVE' ? 'success' : 'neutral'}>{pipeline.status}</Badge>
          </div>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-color-text-muted)' }}>
            Code: {pipeline.pipelineCode} • Definition: {pipeline.definitionReference}
          </span>
        </div>
        <Button variant="primary" size="sm" onClick={onRunBuild}>
          ▶ Trigger Build Run
        </Button>
      </div>

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <Card title="Orchestration Configuration" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
            <div>
              <strong style={{ color: 'var(--ds-color-text-muted)' }}>Project Scope: </strong>
              <span>{pipeline.projectName ?? 'Monorepo'}</span>
            </div>
            <div>
              <strong style={{ color: 'var(--ds-color-text-muted)' }}>Trigger Type: </strong>
              <Badge variant="neutral">{pipeline.triggerType}</Badge>
            </div>
            <div>
              <strong style={{ color: 'var(--ds-color-text-muted)' }}>Default Environment: </strong>
              <span>{pipeline.defaultEnvironment}</span>
            </div>
            <div>
              <strong style={{ color: 'var(--ds-color-text-muted)' }}>Execution Timeout: </strong>
              <span>{pipeline.timeoutSeconds} seconds</span>
            </div>
            <div>
              <strong style={{ color: 'var(--ds-color-text-muted)' }}>Owner: </strong>
              <span>{pipeline.ownerEmail}</span>
            </div>
          </div>
        </Card>

        <Card title="Turborepo Task Graph" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
            <div style={{ padding: '8px', borderRadius: '4px', backgroundColor: 'var(--ds-color-surface-subtle)', fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem' }}>
              <div>^build: packages/shared-core $\rightarrow$ packages/database $\rightarrow$ packages/api-contracts $\rightarrow$ packages/ui-kit $\rightarrow$ packages/auth</div>
              <div style={{ marginTop: '4px' }}>$\rightarrow$ apps/company-platform, apps/partner-platform, apps/api-gateway</div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
              Outputs cached in local and remote Turborepo cache.
            </span>
          </div>
        </Card>
      </div>

      {/* Pipeline Execution History */}
      <Card
        title="Execution Run History"
        subtitle={`Recent runs for ${pipeline.pipelineCode}`}
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run Code</TableHead>
                <TableHead>Commit & Branch</TableHead>
                <TableHead>Triggered By</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Tasks (Pass / Fail)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No recorded runs for this pipeline.
                  </TableCell>
                </TableRow>
              ) : (
                runs.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {r.runCode}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      <span style={{ fontFamily: 'var(--ds-font-mono)' }}>{r.commitReference}</span> ({r.branchReference})
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {r.triggeredByEmail}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {r.durationMs ? `${(r.durationMs / 1000).toFixed(1)}s` : '—'}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      <span style={{ color: 'var(--ds-color-success)', fontWeight: '700' }}>{r.successfulTaskCount}</span>
                      {' / '}
                      <span style={{ color: r.failedTaskCount > 0 ? 'var(--ds-color-danger)' : 'var(--ds-color-text-muted)', fontWeight: '700' }}>
                        {r.failedTaskCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'SUCCEEDED' ? 'success' : r.status === 'FAILED' ? 'danger' : 'neutral'}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                      {new Date(r.startedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
