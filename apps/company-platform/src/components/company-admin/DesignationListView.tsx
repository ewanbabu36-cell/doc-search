import React from 'react';
import type { DesignationDto } from '@docsearch/api-contracts';
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

export interface DesignationListViewProps {
  designations: DesignationDto[];
}

export const DesignationListView: React.FC<DesignationListViewProps> = ({ designations }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card
        title="Corporate Job Titles & Designation Banding"
        subtitle="Executive titles, engineering tracks, clinical leadership bands, and job families"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Designation Code</TableHead>
                <TableHead>Official Title</TableHead>
                <TableHead>Band Level</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Job Family</TableHead>
                <TableHead>Executive Officer</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {designations.map((d) => (
                <TableRow key={d.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {d.designationCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{d.title}</strong>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        d.bandLevel === 'EXECUTIVE'
                          ? 'primary'
                          : d.bandLevel === 'DIRECTOR' || d.bandLevel === 'PRINCIPAL'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {d.bandLevel}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {d.departmentName ?? 'General'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {d.jobFamily}
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.isExecutive ? 'primary' : 'neutral'}>
                      {d.isExecutive ? 'OFFICER' : 'STAFF'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {d.status}
                    </Badge>
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
