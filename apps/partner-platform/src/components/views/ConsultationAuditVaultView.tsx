import React, { useState } from 'react';
import type {
  ConsultationAuditTraceDto
} from '@docsearch/api-contracts';
import {
  Card,
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  Badge,
  Input
} from '@docsearch/ui-kit';

export interface ConsultationAuditVaultViewProps {
  auditTraces: ConsultationAuditTraceDto[];
}

export const ConsultationAuditVaultView: React.FC<ConsultationAuditVaultViewProps> = ({
  auditTraces
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = auditTraces.filter((trace) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      trace.traceId.toLowerCase().includes(q) ||
      trace.action.toLowerCase().includes(q) ||
      trace.actorId.toLowerCase().includes(q) ||
      trace.actorRole.toLowerCase().includes(q) ||
      trace.justification.toLowerCase().includes(q) ||
      trace.targetEntity.toLowerCase().includes(q)
    );
  });

  const getActionBadge = (action: string) => {
    if (action.includes('CREATED') || action.includes('STARTED')) {
      return <Badge variant="primary">{action}</Badge>;
    }
    if (action.includes('COMPLETED')) {
      return <Badge variant="success">{action}</Badge>;
    }
    if (action.includes('AMENDED')) {
      return <Badge variant="warning">{action}</Badge>;
    }
    if (action.includes('REMOVED') || action.includes('DISCONTINUED')) {
      return <Badge variant="danger">{action}</Badge>;
    }
    return <Badge variant="neutral">{action}</Badge>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 700 }}>
              🛡️ Clinical Documentation Audit Vault
            </h3>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
              Append-only cryptographic trace of every consultation initialization, vitals entry, diagnosis addition, prescription order, completion signature, and clinical amendment.
            </p>
          </div>

          <div style={{ minWidth: '260px' }}>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search trace ID, clinician, action, justification..."
            />
          </div>
        </div>
      </Card>

      <Card title={`Audit Events Stream (${filtered.length})`} padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trace ID</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor & Role</TableHead>
                <TableHead>Clinical Action</TableHead>
                <TableHead>Target Entity</TableHead>
                <TableHead>Clinical Justification & Audit Rationale</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No consultation audit traces recorded.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--ds-color-primary)' }}>
                      {row.traceId}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                      {new Date(row.occurredAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>{row.actorId}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{row.actorRole}</div>
                    </TableCell>
                    <TableCell>
                      {getActionBadge(row.action)}
                    </TableCell>
                    <TableCell>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{row.targetEntity}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>ID: {row.targetEntityId.slice(0, 8)}...</div>
                    </TableCell>
                    <TableCell>
                      <div style={{ maxWidth: '300px', fontSize: '0.8125rem', color: 'var(--ds-color-text-primary)' }}>
                        {row.justification}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.operationStatus === 'SUCCESS' ? 'success' : 'danger'}>
                        {row.operationStatus}
                      </Badge>
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
