import React, { useState } from 'react';
import { Card, Button, Input, Badge } from '@docsearch/ui-kit';
import type { InpatientTransferDto } from '@docsearch/api-contracts';

export interface TransferManagementViewProps {
  transfers: InpatientTransferDto[];
  onOpenApproveTransfer: (trf: InpatientTransferDto) => void;
  onOpenCompleteTransfer: (trf: InpatientTransferDto) => void;
  onSelectTransfer?: (trf: InpatientTransferDto) => void;
}

export const TransferManagementView: React.FC<TransferManagementViewProps> = ({
  transfers = [],
  onOpenApproveTransfer,
  onOpenCompleteTransfer,
  onSelectTransfer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const safeTransfers = Array.isArray(transfers) ? transfers : [];

  const filtered = safeTransfers.filter((t) => {
    if (!t) return false;
    const term = (searchTerm || '').toLowerCase();
    const num = (t.transferNumber || '').toLowerCase();
    const name = (t.patientName || '').toLowerCase();
    return num.includes(term) || name.includes(term);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Patient Transfers & Bed Movement</h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Inter-ward escalations, stepdown transfers, and bedside handoff completions.</p>
      </div>
      <Card style={{ padding: '1rem' }}>
        <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search transfers..." />
      </Card>
      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Transfer #</th>
              <th style={{ padding: '0.75rem 1rem' }}>Patient</th>
              <th style={{ padding: '0.75rem 1rem' }}>Source Ward</th>
              <th style={{ padding: '0.75rem 1rem' }}>Destination Ward</th>
              <th style={{ padding: '0.75rem 1rem' }}>Reason</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2563eb' }}>
                  {onSelectTransfer ? (
                    <button
                      type="button"
                      onClick={() => onSelectTransfer(t)}
                      style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                      title="View transfer details"
                    >
                      {t.transferNumber}
                    </button>
                  ) : (
                    t.transferNumber
                  )}
                </td>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t.patientName}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{t.sourceWardName} ({t.sourceBedCode})</td>
                <td style={{ padding: '0.75rem 1rem' }}>{t.destinationWardName} {t.destinationBedCode ? `(${t.destinationBedCode})` : ''}</td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#475569' }}>{t.transferReason}</td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                  <Badge variant={t.status === 'COMPLETED' ? 'success' : t.status === 'APPROVED' ? 'warning' : 'neutral'}>{t.status}</Badge>
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', display: 'flex', gap: '6px', justifyContent: 'center' }}>
                  {t.status === 'REQUESTED' && (
                    <Button variant="primary" size="sm" onClick={() => onOpenApproveTransfer(t)}>Approve Bed</Button>
                  )}
                  {t.status === 'APPROVED' && (
                    <Button variant="primary" size="sm" onClick={() => onOpenCompleteTransfer(t)}>Complete Handoff</Button>
                  )}
                  {onSelectTransfer && (
                    <Button variant="outline" size="sm" onClick={() => onSelectTransfer(t)}>View</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};