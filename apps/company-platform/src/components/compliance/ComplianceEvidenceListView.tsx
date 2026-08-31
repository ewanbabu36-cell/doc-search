import React, { useState } from 'react';
import type {
  ComplianceEvidenceDto,
  EvidenceType,
  EvidenceStatus
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

export interface ComplianceEvidenceListViewProps {
  evidence: ComplianceEvidenceDto[];
  onSelectEvidence: (evidenceId: string) => void;
}

export const ComplianceEvidenceListView: React.FC<ComplianceEvidenceListViewProps> = ({
  evidence,
  onSelectEvidence
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<EvidenceType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<EvidenceStatus | 'ALL'>('ALL');

  const filtered = evidence.filter((e) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !e.evidenceCode.toLowerCase().includes(q) &&
        !e.title.toLowerCase().includes(q) &&
        !e.sourceDomain.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (typeFilter !== 'ALL' && e.evidenceType !== typeFilter) return false;
    if (statusFilter !== 'ALL' && e.evidenceStatus !== statusFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Search & Filters */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Search Evidence
            </label>
            <Input
              placeholder="Search by code, title, or source domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Evidence Type
            </label>
            <Select
              options={[
                { label: 'All Types', value: 'ALL' },
                { label: 'Policy Document', value: 'POLICY_DOCUMENT' },
                { label: 'Audit Log', value: 'AUDIT_LOG' },
                { label: 'Configuration Record', value: 'CONFIGURATION_RECORD' },
                { label: 'Access Review', value: 'ACCESS_REVIEW' },
                { label: 'Training Record', value: 'TRAINING_RECORD' },
                { label: 'BAA Document Reference', value: 'BAA_DOCUMENT' }
              ]}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as EvidenceType | 'ALL')}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Status
            </label>
            <Select
              options={[
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Accepted', value: 'ACCEPTED' },
                { label: 'Under Review', value: 'UNDER_REVIEW' },
                { label: 'Submitted', value: 'SUBMITTED' },
                { label: 'Draft', value: 'DRAFT' },
                { label: 'Rejected', value: 'REJECTED' },
                { label: 'Expired', value: 'EXPIRED' }
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as EvidenceStatus | 'ALL')}
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
                <TableHead>Evidence Code & Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source Domain</TableHead>
                <TableHead>Linked Controls</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No evidence records found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <code style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                          {e.evidenceCode}
                        </code>
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>{e.title}</strong>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="primary">{e.evidenceType}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {e.sourceDomain}
                    </TableCell>
                    <TableCell style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                      {e.linkedControlCount} controls
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                      {e.validUntil ? new Date(e.validUntil).toLocaleDateString() : 'Indefinite'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          e.evidenceStatus === 'ACCEPTED'
                            ? 'success'
                            : e.evidenceStatus === 'UNDER_REVIEW'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {e.evidenceStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => onSelectEvidence(e.id)}>
                        Inspect Evidence
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
