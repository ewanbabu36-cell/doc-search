import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Badge
} from '@docsearch/ui-kit';
import type {
  InsuranceSettlementDto
} from '@docsearch/api-contracts';

export interface SettlementManagementViewProps {
  settlements: InsuranceSettlementDto[];
  onOpenRecordSettlement?: () => void;
  onOpenReconcileSettlement: (settlement: InsuranceSettlementDto) => void;
}

export const SettlementManagementView: React.FC<SettlementManagementViewProps> = ({
  settlements,
  onOpenReconcileSettlement
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = settlements.filter((s) =>
    s.settlementReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.payerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Insurance Payer Settlements & Remittance Credits
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Direct deposit electronic funds transfers (EFT), batch wire advices, and settlement ledger vouchers.
          </p>
        </div>
      </div>

      <Card style={{ padding: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
          Search Settlements by Batch Ref, Claim #, Patient, or Insurer
        </label>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="e.g. EFT-TPA, CLM-2026, Marcus Holloway"
        />
      </Card>

      <Card style={{ padding: '0' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.875rem 1rem' }}>Settlement Ref</th>
                <th style={{ padding: '0.875rem 1rem' }}>Claim # / Patient</th>
                <th style={{ padding: '0.875rem 1rem' }}>Payer</th>
                <th style={{ padding: '0.875rem 1rem' }}>EFT / Bank Voucher</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Settlement Amount</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((settle) => (
                <tr key={settle.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#2563eb' }}>
                    {settle.settlementReference}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ fontWeight: 600 }}>{settle.claimNumber}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{settle.patientName}</div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>{settle.payerName}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div>{settle.eftTransactionNumber || 'Direct Deposit'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{settle.paymentReference}</div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                    ${settle.settlementAmount.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                    <Badge variant={settle.status === 'RECONCILED' ? 'success' : 'primary'}>
                      {settle.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                    {settle.status !== 'RECONCILED' && (
                      <Button variant="primary" size="sm" onClick={() => onOpenReconcileSettlement(settle)}>
                        Reconcile
                      </Button>
                    )}
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
