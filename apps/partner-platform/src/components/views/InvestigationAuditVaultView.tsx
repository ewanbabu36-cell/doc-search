import React, { useState } from 'react';
import {
  Card,
  Input,
  Select,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import type { InvestigationAuditTraceDto } from '@docsearch/api-contracts';

export interface InvestigationAuditVaultViewProps {
  auditTraces: InvestigationAuditTraceDto[];
}

export const InvestigationAuditVaultView: React.FC<InvestigationAuditVaultViewProps> = ({
  auditTraces
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filtered = auditTraces.filter((trace) => {
    if (actionFilter !== 'ALL' && trace.action !== actionFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        trace.traceId.toLowerCase().includes(q) ||
        trace.actorId.toLowerCase().includes(q) ||
        trace.actorRole.toLowerCase().includes(q) ||
        trace.action.toLowerCase().includes(q) ||
        trace.justification.toLowerCase().includes(q) ||
        (trace.orderId && trace.orderId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 700 }}>
          🔒 Investigation Cryptographic Audit Vault & Compliance Ledger
        </h3>
        <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #64748b)', fontSize: '0.875rem' }}>
          Append-only tamper-evident record of all laboratory orders, phlebotomy accessions, result verifications, and clinical amendments.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter audit ledger by trace ID, actor, role, action, or justification..."
        />
        <Select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          options={[
            { label: 'All Audited Actions', value: 'ALL' },
            { label: 'Investigation Ordered', value: 'INVESTIGATION_ORDERED' },
            { label: 'Specimen Collected', value: 'SPECIMEN_COLLECTED' },
            { label: 'Specimen Rejected', value: 'SPECIMEN_REJECTED' },
            { label: 'Results Entered', value: 'RESULTS_ENTERED' },
            { label: 'Critical Result Flagged', value: 'CRITICAL_RESULT_FLAGGED' },
            { label: 'Results Verified', value: 'RESULTS_VERIFIED' },
            { label: 'Report Finalized', value: 'REPORT_FINALIZED' },
            { label: 'Doctor Reviewed', value: 'RESULTS_REVIEWED_BY_DOCTOR' },
            { label: 'Result Amended', value: 'RESULT_AMENDED' },
            { label: 'Order Cancelled', value: 'INVESTIGATION_ORDER_CANCELLED' }
          ]}
        />
      </div>

      <Card title={`Audit Event Stream (${filtered.length})`} padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trace ID / Timestamp</TableHead>
                <TableHead>Actor & Role</TableHead>
                <TableHead>Clinical Action</TableHead>
                <TableHead>Target Entity</TableHead>
                <TableHead>Justification & Compliance Notes</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--ds-color-text-muted)' }}>
                    No audit records match the current filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((trace) => (
                  <TableRow key={trace.id}>
                    <TableCell>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--ds-color-primary, #2563eb)' }}>
                        {trace.traceId}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                        {new Date(trace.occurredAt).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>{trace.actorId}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                        {trace.actorRole}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          trace.action.includes('CRITICAL') || trace.action.includes('REJECTED') || trace.action.includes('CANCELLED')
                            ? 'danger'
                            : trace.action.includes('VERIFIED') || trace.action.includes('REVIEWED')
                            ? 'success'
                            : 'neutral'
                        }
                      >
                        {trace.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{trace.targetEntity}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                        ID: {trace.targetEntityId.slice(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', maxWidth: '300px' }}>
                      {trace.justification}
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">{trace.operationStatus}</Badge>
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
