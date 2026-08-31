import React, { useState } from 'react';
import {
  Card,
  Badge,
  Input,
  Select,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import type {
  PharmacyAuditTraceDto
} from '@docsearch/api-contracts';

export interface PharmacyAuditVaultViewProps {
  auditTraces: PharmacyAuditTraceDto[];
}

export const PharmacyAuditVaultView: React.FC<PharmacyAuditVaultViewProps> = ({
  auditTraces
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const filtered = auditTraces.filter((a) => {
    const matchesAction = actionFilter === 'ALL' || a.action.includes(actionFilter);
    const matchesSearch =
      searchTerm.trim() === '' ||
      a.traceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.actorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.justification.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700 }}>
          🔒 Pharmacy Regulatory Audit Vault
        </h2>
        <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #64748b)', fontSize: '0.875rem' }}>
          Cryptographically referenced append-only audit trail capturing all dispensing, verification, and narcotic movements.
        </p>
      </div>

      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Search Audit Stream
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Trace ID, actor, action, or justification..."
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Filter by Action Type
            </label>
            <Select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Audited Actions' },
                { value: 'PRESCRIPTION', label: 'Prescription Orders' },
                { value: 'VERIF', label: 'Pharmacist Verifications' },
                { value: 'DISPENS', label: 'Dispensing Fulfillment' },
                { value: 'CONTROLLED', label: 'Controlled Substance Custody' },
                { value: 'SUBSTITUTION', label: 'Substitutions' },
                { value: 'STOCK', label: 'Stock & Batch Actions' }
              ]}
            />
          </div>
        </div>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trace ID</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action Event</TableHead>
                <TableHead>Target Entity</TableHead>
                <TableHead>Authorized Actor</TableHead>
                <TableHead>Audit Justification</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((trace) => (
                <TableRow key={trace.id}>
                  <TableCell style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0369a1' }}>
                    {trace.traceId}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.85rem' }}>
                    {new Date(trace.occurredAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={trace.action.includes('CONTROLLED') ? 'danger' : 'neutral'}>
                      {trace.action.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.85rem' }}>
                    {trace.targetEntity}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.85rem' }}>
                    <div>{trace.actorId}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Role: {trace.actorRole}</div>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.85rem' }}>{trace.justification}</TableCell>
                  <TableCell>
                    <Badge variant={trace.operationStatus === 'SUCCESS' ? 'success' : 'danger'}>
                      {trace.operationStatus}
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
