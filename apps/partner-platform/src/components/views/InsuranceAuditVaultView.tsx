import React, { useState } from 'react';
import {
  Card,
  Input,
  Badge
} from '@docsearch/ui-kit';
import type {
  InsuranceAuditTraceDto
} from '@docsearch/api-contracts';

export interface InsuranceAuditVaultViewProps {
  auditTraces: InsuranceAuditTraceDto[];
}

export const InsuranceAuditVaultView: React.FC<InsuranceAuditVaultViewProps> = ({
  auditTraces
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = auditTraces.filter((t) =>
    t.traceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.operation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.actorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
          Insurance Financial Audit Vault & Cryptographic Journal
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
          Append-only tamper-evident audit ledger capturing every eligibility query, pre-authorization, EDI claim mutation, denial appeal, and bank settlement.
        </p>
      </div>

      <Card style={{ padding: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
          Search Audit Events by Trace ID, Operation, Actor, Entity ID, or Rationale
        </label>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="e.g. TRACE-INS, CLAIM_SUBMITTED, Bob Rivera"
        />
      </Card>

      <Card style={{ padding: '0' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.875rem 1rem' }}>Trace ID</th>
                <th style={{ padding: '0.875rem 1rem' }}>Operation</th>
                <th style={{ padding: '0.875rem 1rem' }}>Entity</th>
                <th style={{ padding: '0.875rem 1rem' }}>Actor</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Financial Impact</th>
                <th style={{ padding: '0.875rem 1rem' }}>Reason / Cryptographic Hash</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((trace) => (
                <tr key={trace.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.875rem 1rem', fontFamily: 'monospace', fontWeight: 600, color: '#2563eb' }}>
                    {trace.traceId}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <Badge variant="primary">{trace.operation}</Badge>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div><strong>{trace.entityType}</strong></div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{trace.entityId.slice(0, 8)}...</div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div>{trace.actorId}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{trace.actorRole}</div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                    {trace.financialImpact && trace.financialImpact > 0 ? `$${trace.financialImpact.toFixed(2)}` : '—'}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ fontSize: '0.85rem' }}>{trace.reason}</div>
                    {trace.hashPointer && (
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                        Hash: {trace.hashPointer}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontSize: '0.8rem', color: '#64748b' }}>
                    {new Date(trace.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
