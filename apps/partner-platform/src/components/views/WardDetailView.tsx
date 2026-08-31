import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { InpatientWardDto, InpatientBedDto } from '@docsearch/api-contracts';

export interface WardDetailViewProps {
  ward: InpatientWardDto | null;
  beds: InpatientBedDto[];
  onBack: () => void;
  onOpenEditWard: () => void;
  onOpenCreateBed: () => void;
}

export const WardDetailView: React.FC<WardDetailViewProps> = ({ ward, beds, onBack, onOpenEditWard, onOpenCreateBed }) => {
  if (!ward) return null;
  const wardBeds = beds.filter((b) => b.wardId === ward.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="outline" size="sm" onClick={onBack}>← Back to Wards</Button>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{ward.wardName} ({ward.wardCode})</h2>
          <Badge variant={ward.isActive ? 'success' : 'danger'}>{ward.isActive ? 'Active' : 'Inactive'}</Badge>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="outline" onClick={onOpenEditWard}>Edit Ward Details</Button>
          <Button variant="primary" onClick={onOpenCreateBed}>+ Add Bed to Ward</Button>
        </div>
      </div>

      <Card style={{ padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
          <div><strong>Building / Floor:</strong> {ward.building} ({ward.floor})</div>
          <div><strong>Nursing Station:</strong> {ward.nursingStationName}</div>
          <div><strong>Care Level:</strong> {ward.careLevel}</div>
          <div><strong>Total Beds:</strong> {wardBeds.length}</div>
        </div>
      </Card>

      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>Rostered Beds ({wardBeds.length})</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Bed Code</th>
              <th style={{ padding: '0.75rem 1rem' }}>Class & Type</th>
              <th style={{ padding: '0.75rem 1rem' }}>Tariff</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>Patient</th>
            </tr>
          </thead>
          <tbody>
            {wardBeds.map((b) => (
              <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2563eb' }}>{b.bedCode}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{b.bedClass} ({b.bedType})</td>
                <td style={{ padding: '0.75rem 1rem' }}>${b.dailyChargeRate}/day</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <Badge variant={b.status === 'AVAILABLE' ? 'success' : b.status === 'OCCUPIED' ? 'neutral' : 'warning'}>{b.status}</Badge>
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>{b.currentPatientName || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};