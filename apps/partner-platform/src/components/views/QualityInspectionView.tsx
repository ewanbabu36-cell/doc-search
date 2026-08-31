import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Badge
} from '@docsearch/ui-kit';
import type {
  ProcurementInspectionDto,
  GoodsReceiptDto
} from '@docsearch/api-contracts';

export interface QualityInspectionViewProps {
  inspections: ProcurementInspectionDto[];
  pendingReceipts: GoodsReceiptDto[];
  onOpenInspectGRN: (grn: GoodsReceiptDto) => void;
}

export const QualityInspectionView: React.FC<QualityInspectionViewProps> = ({
  inspections,
  pendingReceipts,
  onOpenInspectGRN
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = inspections.filter((i) =>
    i.inspectionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.grnNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
          Quality Inspection & Quarantine Management (QC)
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
          Clinical compliance verification, Certificate of Analysis (CoA) checks, physical seal inspections, and quarantine isolation.
        </p>
      </div>

      {pendingReceipts.length > 0 && (
        <Card style={{ padding: '1.25rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
          <div style={{ fontWeight: 600, color: '#92400e', marginBottom: '0.5rem' }}>
            ⚠️ Goods Receipts Awaiting Quality Inspection ({pendingReceipts.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pendingReceipts.map((grn) => (
              <div key={grn.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{grn.grnNumber} (PO: {grn.poNumber} — {grn.vendorName})</span>
                <Button variant="primary" size="sm" onClick={() => onOpenInspectGRN(grn)}>
                  Start Inspection
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card style={{ padding: '1rem' }}>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search inspection reports..."
        />
      </Card>

      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Report #</th>
                <th style={{ padding: '0.75rem 1rem' }}>GRN #</th>
                <th style={{ padding: '0.75rem 1rem' }}>Inspector</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Passed / Inspected</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Inspection Observations</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((qc) => (
                <tr key={qc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2563eb' }}>
                    {qc.inspectionNumber}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{qc.grnNumber}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>{qc.inspectorId}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>
                    <span style={{ color: '#16a34a' }}>{qc.totalPassedQuantity}</span> / {qc.totalInspectedQuantity}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <Badge variant={qc.status === 'PASSED' ? 'success' : 'danger'}>{qc.status}</Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#475569' }}>
                    {qc.notes || 'Routine checklist passed.'}
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
