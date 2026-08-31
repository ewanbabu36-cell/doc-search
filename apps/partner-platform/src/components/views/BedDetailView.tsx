import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { InpatientBedDto } from '@docsearch/api-contracts';

export interface BedDetailViewProps {
  bed: InpatientBedDto | null;
  onBack: () => void;
}

export const BedDetailView: React.FC<BedDetailViewProps> = ({ bed, onBack }) => {
  if (!bed) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Button variant="outline" size="sm" onClick={onBack}>← Back</Button>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Bed Details — {bed.bedCode}</h2>
        <Badge variant={bed.status === 'AVAILABLE' ? 'success' : 'neutral'}>{bed.status}</Badge>
      </div>
      <Card style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
          <div><strong>Ward:</strong> {bed.wardName}</div>
          <div><strong>Bed Class:</strong> {bed.bedClass}</div>
          <div><strong>Daily Tariff:</strong> ${bed.dailyChargeRate}</div>
          <div><strong>Ventilator Supported:</strong> {bed.hasVentilator ? 'Yes' : 'No'}</div>
          <div><strong>Cardiac Monitor:</strong> {bed.hasCardiacMonitor ? 'Yes' : 'No'}</div>
          <div><strong>Current Patient:</strong> {bed.currentPatientName || 'None (Vacant)'}</div>
        </div>
      </Card>
    </div>
  );
};