import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { InpatientTransferDto } from '@docsearch/api-contracts';

export interface TransferDetailViewProps {
  transfer: InpatientTransferDto | null;
  onBack: () => void;
}

export const TransferDetailView: React.FC<TransferDetailViewProps> = ({ transfer, onBack }) => {
  if (!transfer) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Button variant="outline" size="sm" onClick={onBack}>← Back</Button>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Transfer Record — {transfer.transferNumber}</h2>
        <Badge variant="neutral">{transfer.status}</Badge>
      </div>
      <Card style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
          <div><strong>Patient:</strong> {transfer.patientName} ({transfer.patientMrn})</div>
          <div><strong>Source Location:</strong> {transfer.sourceWardName} ({transfer.sourceBedCode})</div>
          <div><strong>Destination Location:</strong> {transfer.destinationWardName} ({transfer.destinationBedCode || 'Pending Bed'})</div>
          <div><strong>Transport:</strong> {transfer.transportRequirement}</div>
          <div><strong>Requested By:</strong> {transfer.requestingDoctorName}</div>
        </div>
      </Card>
    </div>
  );
};