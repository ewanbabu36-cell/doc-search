import React from 'react';
import type { CICDPipelineDto } from '@docsearch/api-contracts';
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

export interface CICDPipelineListViewProps {
  pipelines: CICDPipelineDto[];
}

export const CICDPipelineListView: React.FC<CICDPipelineListViewProps> = ({
  pipelines
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card
        title="CI/CD Workflows & Provider Abstraction"
        subtitle="Automated GitHub Actions and cloud runner configurations"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pipeline Code</TableHead>
                <TableHead>CI/CD Provider</TableHead>
                <TableHead>Repository Reference</TableHead>
                <TableHead>Workflow File</TableHead>
                <TableHead>Trigger Policy</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Last Run</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pipelines.map((p) => (
                <TableRow key={p.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {p.pipelineCode}
                  </TableCell>
                  <TableCell>
                    <Badge variant="primary">{p.provider}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {p.repositoryReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {p.workflowReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {p.triggerPolicy}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {p.ownerEmail}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    {p.lastRunAt ? new Date(p.lastRunAt).toLocaleString() : '—'}
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
