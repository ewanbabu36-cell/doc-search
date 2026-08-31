import React, { useState } from 'react';
import type { BuildPipelineDto, PlatformEnvironmentType } from '@docsearch/api-contracts';
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';
import { RunBuildDialog } from './RunBuildDialog.js';

export interface BuildPipelineListViewProps {
  pipelines: BuildPipelineDto[];
  onSelectPipeline: (id: string) => void;
  onExecuteBuild: (pipelineId: string, branch: string, commit: string, env: PlatformEnvironmentType, reason: string) => Promise<void>;
}

export const BuildPipelineListView: React.FC<BuildPipelineListViewProps> = ({
  pipelines,
  onSelectPipeline,
  onExecuteBuild
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [activePipelineForRun, setActivePipelineForRun] = useState<BuildPipelineDto | null>(null);

  const filteredPipelines = pipelines.filter((pipe) => {
    const matchesSearch =
      pipe.pipelineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pipe.pipelineCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pipe.definitionReference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || pipe.pipelineType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Filter Bar */}
      <Card padding="md">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', flex: '1', minWidth: '280px' }}>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search pipelines by name, code, or command..."
            />
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Pipeline Types' },
                { value: 'FULL_VALIDATION', label: 'Full Validation' },
                { value: 'BUILD', label: 'Build / Compilation' },
                { value: 'TYPECHECK', label: 'Typecheck' },
                { value: 'LINT', label: 'Lint' },
                { value: 'TEST', label: 'Test' },
                { value: 'PACKAGE', label: 'Packaging' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Pipeline Table */}
      <Card
        title="Turborepo Build Pipelines"
        subtitle="Monorepo tasks and orchestrated quality gates"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pipeline Code</TableHead>
                <TableHead>Pipeline Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Definition Command</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Last Run Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPipelines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No build pipelines matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPipelines.map((pipe) => (
                  <TableRow key={pipe.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {pipe.pipelineCode}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => onSelectPipeline(pipe.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--ds-color-primary)',
                          fontWeight: '600',
                          cursor: 'pointer',
                          textAlign: 'left',
                          padding: 0,
                          fontSize: '0.8125rem'
                        }}
                      >
                        {pipe.pipelineName}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{pipe.pipelineType}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {pipe.definitionReference}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {pipe.triggerType}
                    </TableCell>
                    <TableCell>
                      <Badge variant={pipe.lastRunStatus === 'SUCCEEDED' ? 'success' : pipe.lastRunStatus === 'FAILED' ? 'danger' : 'neutral'}>
                        {pipe.lastRunStatus ?? 'PENDING'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={pipe.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {pipe.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSelectPipeline(pipe.id)}
                        >
                          Details
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setActivePipelineForRun(pipe)}
                        >
                          Run
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {activePipelineForRun && (
        <RunBuildDialog
          isOpen={Boolean(activePipelineForRun)}
          onClose={() => setActivePipelineForRun(null)}
          pipeline={activePipelineForRun}
          onExecuteBuild={onExecuteBuild}
        />
      )}
    </div>
  );
};
