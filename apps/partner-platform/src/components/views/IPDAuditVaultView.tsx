import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { InpatientAuditTraceDto } from '@docsearch/api-contracts';

export interface IPDAuditVaultViewProps {
  auditTraces: InpatientAuditTraceDto[];
}

export const IPDAuditVaultView: React.FC<IPDAuditVaultViewProps> = ({ auditTraces }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Inpatient Audit Vault</h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Cryptographically hash-linked audit records for all ADT and clinical documentation events.</p>
      </div>
      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Trace #</th>
              <th style={{ padding: '0.75rem 1rem' }}>Actor</th>
              <th style={{ padding: '0.75rem 1rem' }}>Action</th>
              <th style={{ padding: '0.75rem 1rem' }}>Entity</th>
              <th style={{ padding: '0.75rem 1rem' }}>Justification</th>
              <th style={{ padding: '0.75rem 1rem' }}>Hash Check</th>
            </tr>
          </thead>
          <tbody>
            {auditTraces.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2563eb' }}>{t.traceNumber}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{t.actorName} ({t.actorRole})</td>
                <td style={{ padding: '0.75rem 1rem' }}><Badge variant="neutral">{t.action}</Badge></td>
                <td style={{ padding: '0.75rem 1rem' }}>{t.entityType} ({t.entityCode})</td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#475569' }}>{t.justification}</td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>{t.integrityHash.slice(0, 10)}...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};