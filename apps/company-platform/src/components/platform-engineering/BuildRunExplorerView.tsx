import React, { useState } from 'react';
import type { BuildRunDto } from '@docsearch/api-contracts';
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

export interface BuildRunExplorerViewProps {
  runs: BuildRunDto[];
  onCancelRun: (runId: string, reason: string) => Promise<void>;
}

export const BuildRunExplorerView: React.FC<BuildRunExplorerViewProps> = ({
  runs,
  onCancelRun
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredRuns = runs.filter((r) => {
    const matchesSearch =
      r.runCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.commitReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.branchReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.triggeredByEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Filter Bar */}
      <Card padding="md">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search runs by code, commit, branch, or author..."
            style={{ flex: '1', minWidth: '240px' }}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Run Statuses' },
              { value: 'SUCCEEDED', label: 'Succeeded' },
              { value: 'RUNNING', label: 'Running' },
              { value: 'FAILED', label: 'Failed' },
              { value: 'CANCELLED', label: 'Cancelled' },
              { value: 'QUEUED', label: 'Queued' }
            ]}
          />
        </div>
      </Card>

      {/* Build Runs Table */}
      <Card
        title="Build Run Explorer"
        subtitle="Historical Turborepo execution logs, task durations, and artifact links"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run Code</TableHead>
                <TableHead>Pipeline Name</TableHead>
                <TableHead>Commit & Branch</TableHead>
                <TableHead>Triggered By</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Tasks (Pass / Fail)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRuns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No build runs matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRuns.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {r.runCode}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>
                      {r.pipelineName ?? 'Build Pipeline'}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      <span style={{ fontFamily: 'var(--ds-font-mono)' }}>{r.commitReference}</span> ({r.branchReference})
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {r.triggeredByEmail}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{r.environment}</Badge>
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
                      <Badge
                        variant={
                          r.status === 'SUCCEEDED'
                            ? 'success'
                            : r.status === 'FAILED'
                            ? 'danger'
                            : r.status === 'RUNNING'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.status === 'RUNNING' ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => void onCancelRun(r.id, 'User manually cancelled build')}
                        >
                          Cancel
                        </Button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', fontFamily: 'var(--ds-font-mono)' }}>
                          {r.logReference ? 'Logged' : '—'}
                        </span>
                      )}
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
