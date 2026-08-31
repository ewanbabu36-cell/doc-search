import React from 'react';
import type { CICDRunDto } from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface CICDRunExplorerViewProps {
  runs: CICDRunDto[];
}

export const CICDRunExplorerView: React.FC<CICDRunExplorerViewProps> = ({
  runs
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card
        title="CI/CD Execution Runs & Stages"
        subtitle="Automated testing, container build, and deployment promotion stages"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run Code</TableHead>
                <TableHead>Pipeline Code</TableHead>
                <TableHead>Commit & Branch</TableHead>
                <TableHead>Current / Final Stage</TableHead>
                <TableHead>Runner</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Deployment Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {r.runCode}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>
                    {r.pipelineCode ?? 'CICD-PIPELINE'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    <span style={{ fontFamily: 'var(--ds-font-mono)' }}>{r.commitReference}</span> ({r.branchReference})
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{r.stage}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {r.runnerReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {r.durationMs ? `${(r.durationMs / 1000).toFixed(1)}s` : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.status === 'PASSED'
                          ? 'success'
                          : r.status === 'FAILED'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {r.deploymentReference ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
