import React, { useState } from 'react';
import type {
  ComplianceFrameworkDto,
  ComplianceFrameworkType
} from '@docsearch/api-contracts';
import {
  Card,
  Input,
  Select,
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

export interface ComplianceFrameworkListViewProps {
  frameworks: ComplianceFrameworkDto[];
  onSelectFramework: (frameworkId: string) => void;
}

export const ComplianceFrameworkListView: React.FC<ComplianceFrameworkListViewProps> = ({
  frameworks,
  onSelectFramework
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ComplianceFrameworkType | 'ALL'>('ALL');

  const filtered = frameworks.filter((f) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !f.frameworkCode.toLowerCase().includes(q) &&
        !f.name.toLowerCase().includes(q) &&
        !f.description.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (typeFilter !== 'ALL' && f.frameworkType !== typeFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Search & Filters */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Search Frameworks
            </label>
            <Input
              placeholder="Search by framework code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Framework Type
            </label>
            <Select
              options={[
                { label: 'All Framework Types', value: 'ALL' },
                { label: 'HIPAA', value: 'HIPAA' },
                { label: 'SOC 2', value: 'SOC2' },
                { label: 'Internal Control', value: 'INTERNAL_CONTROL' },
                { label: 'Data Governance', value: 'DATA_GOVERNANCE' }
              ]}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ComplianceFrameworkType | 'ALL')}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Framework Code & Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Controls Total</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No compliance frameworks match filter.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <code style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                          {f.frameworkCode}
                        </code>
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>{f.name}</strong>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="primary">{f.frameworkType}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', fontFamily: 'var(--ds-font-mono)' }}>
                      v{f.version}
                    </TableCell>
                    <TableCell style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                      {f.controlCount}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--ds-color-success)', fontWeight: '700' }}>
                        {f.verifiedControlCount}
                      </span>{' '}
                      / {f.controlCount}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {f.ownerEmail}
                    </TableCell>
                    <TableCell>
                      <Badge variant={f.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {f.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => onSelectFramework(f.id)}>
                        Inspect Controls
                      </Button>
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
