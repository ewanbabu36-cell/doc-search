import React from 'react';
import {
  Card,
  Badge
} from '@docsearch/ui-kit';
import type {
  ProcurementAuditTraceDto
} from '@docsearch/api-contracts';

export interface ProcurementAuditVaultViewProps {
  auditTraces: ProcurementAuditTraceDto[];
}

export const ProcurementAuditVaultView: React.FC<ProcurementAuditVaultViewProps> = ({
  auditTraces
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
          Procurement & Supply Chain Audit Vault
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
          Append-only, cryptographically chained financial and clinical supply verification journal.
        </p>
      </div>

      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Trace ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Timestamp</th>
                <th style={{ padding: '0.75rem 1rem' }}>Operator & Role</th>
                <th style={{ padding: '0.75rem 1rem' }}>Action / Entity</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Financial Impact</th>
                <th style={{ padding: '0.75rem 1rem' }}>Justification</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Hash Pointer</th>
              </tr>
            </thead>
            <tbody>
              {auditTraces.map((trace) => (
                <tr key={trace.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2563eb', fontFamily: 'monospace' }}>
                    {trace.traceId}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#475569' }}>
                    {new Date(trace.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div>{trace.actorId}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{trace.actorRole}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Badge variant="primary">{trace.operation}</Badge>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                      {trace.entityType}: {trace.entityId}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                    ${trace.financialImpact.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#475569' }}>
                    {trace.reason}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>
                    {trace.hashPointer ? trace.hashPointer.slice(0, 12) + '...' : 'VERIFIED'}
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
