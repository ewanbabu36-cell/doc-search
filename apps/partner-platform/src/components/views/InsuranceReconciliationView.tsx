import React, { useState } from 'react';
import {
  Card,
  Input,
  Badge
} from '@docsearch/ui-kit';
import type {
  InsuranceReconciliationDto
} from '@docsearch/api-contracts';

export interface InsuranceReconciliationViewProps {
  reconciliations: InsuranceReconciliationDto[];
}

export const InsuranceReconciliationView: React.FC<InsuranceReconciliationViewProps> = ({
  reconciliations
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = reconciliations.filter((r) =>
    r.reconciliationReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.payerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Insurance Ledger Reconciliations & Treasury Audits
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Audited financial matching between expected adjudicated claim tariffs, received bank remittances, and approved write-offs.
          </p>
        </div>
      </div>

      <Card style={{ padding: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
          Search Reconciliations by Reference, Claim #, or Payer
        </label>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="e.g. REC-INS-2026, CLM-2026, Apex TPA"
        />
      </Card>

      <Card style={{ padding: '0' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.875rem 1rem' }}>Reconciliation Ref</th>
                <th style={{ padding: '0.875rem 1rem' }}>Claim # / Payer</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Expected</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Received</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Variance</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Outcome</th>
                <th style={{ padding: '0.875rem 1rem' }}>Auditor / Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rec) => (
                <tr key={rec.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#2563eb' }}>
                    {rec.reconciliationReference}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ fontWeight: 600 }}>{rec.claimNumber}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{rec.payerName}</div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                    ${rec.expectedAmount.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>
                    ${rec.receivedAmount.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                    <span style={{ color: Math.abs(rec.variance) < 0.01 ? '#16a34a' : '#dc2626' }}>
                      {rec.variance >= 0 ? `+$${rec.variance.toFixed(2)}` : `-$${Math.abs(rec.variance).toFixed(2)}`}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                    <Badge variant={rec.reconciliationStatus === 'MATCHED' ? 'success' : 'warning'}>
                      {rec.reconciliationStatus}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{rec.resolvedBy}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{rec.reason || 'Verified'}</div>
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
