import React, { useState } from 'react';
import type {
  ComplianceControlDto,
  ComplianceControlStatus
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

export interface ComplianceControlListViewProps {
  controls: ComplianceControlDto[];
  onVerifyControl: (control: ComplianceControlDto) => void;
}

export const ComplianceControlListView: React.FC<ComplianceControlListViewProps> = ({
  controls,
  onVerifyControl
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComplianceControlStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const uniqueCategories = Array.from(new Set(controls.map((c) => c.controlCategory)));

  const filtered = controls.filter((c) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !c.controlCode.toLowerCase().includes(q) &&
        !c.title.toLowerCase().includes(q) &&
        !c.requirementSummary.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (statusFilter !== 'ALL' && c.controlStatus !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && c.controlCategory !== categoryFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Search & Filters */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Search Controls
            </label>
            <Input
              placeholder="Search by control code, title, or requirement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Control Status
            </label>
            <Select
              options={[
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Verified', value: 'VERIFIED' },
                { label: 'Ready for Review', value: 'READY_FOR_REVIEW' },
                { label: 'Evidence Required', value: 'EVIDENCE_REQUIRED' },
                { label: 'In Progress', value: 'IN_PROGRESS' },
                { label: 'Not Started', value: 'NOT_STARTED' },
                { label: 'Exception', value: 'EXCEPTION' }
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ComplianceControlStatus | 'ALL')}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Category
            </label>
            <Select
              options={[
                { label: 'All Categories', value: 'ALL' },
                ...uniqueCategories.map((cat) => ({ label: cat, value: cat }))
              ]}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
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
                <TableHead>Control Code & Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Requirement Assertion</TableHead>
                <TableHead>Evidence Attached</TableHead>
                <TableHead>Review Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No compliance controls match criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <code style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                          {c.controlCode}
                        </code>
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>{c.title}</strong>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{c.controlCategory}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', maxWidth: '300px' }}>
                      {c.requirementSummary}
                    </TableCell>
                    <TableCell style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                      {c.evidenceCount} artifacts
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                      {c.reviewDueDate ? new Date(c.reviewDueDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.controlStatus === 'VERIFIED'
                            ? 'success'
                            : c.controlStatus === 'READY_FOR_REVIEW'
                            ? 'primary'
                            : c.controlStatus === 'EVIDENCE_REQUIRED'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {c.controlStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => onVerifyControl(c)}>
                        Verify / Attest
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
