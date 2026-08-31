import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { InpatientBedDto, InpatientWardDto } from '@docsearch/api-contracts';

export interface BedAvailabilityViewProps {
  beds: InpatientBedDto[];
  wards: InpatientWardDto[];
}

export const BedAvailabilityView: React.FC<BedAvailabilityViewProps> = ({ beds, wards }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
          Real-Time Bed Availability & Ward Capacity
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
          Breakdown of vacant, occupied, and quarantined beds across departments.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {wards.map((w) => {
          const wardBeds = beds.filter((b) => b.wardId === w.id);
          const avail = wardBeds.filter((b) => b.status === 'AVAILABLE').length;
          const occ = wardBeds.filter((b) => b.status === 'OCCUPIED').length;
          const blk = wardBeds.filter((b) => b.status === 'BLOCKED').length;
          return (
            <Card key={w.id} style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{w.wardName}</strong>
                <Badge variant={avail > 0 ? 'success' : 'danger'}>{avail} Vacant</Badge>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>{w.building} • {w.floor}</div>
              <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Total: {wardBeds.length}</span>
                <span style={{ color: '#2563eb' }}>Occupied: {occ}</span>
                <span style={{ color: '#dc2626' }}>Blocked: {blk}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};