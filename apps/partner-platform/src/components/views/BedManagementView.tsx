import React, { useState } from 'react';
import { Card, Button, Input, Select, Badge } from '@docsearch/ui-kit';
import type { InpatientBedDto, InpatientWardDto } from '@docsearch/api-contracts';

export interface BedManagementViewProps {
  beds: InpatientBedDto[];
  wards: InpatientWardDto[];
  onOpenCreateBed: () => void;
  onOpenEditBed: (bed: InpatientBedDto) => void;
  onOpenBlockBed: (bed: InpatientBedDto) => void;
  onOpenReserveBed: (bed: InpatientBedDto) => void;
  onOpenReleaseBed: (bed: InpatientBedDto) => void;
}

export const BedManagementView: React.FC<BedManagementViewProps> = ({
  beds,
  wards,
  onOpenCreateBed,
  onOpenEditBed,
  onOpenBlockBed,
  onOpenReserveBed,
  onOpenReleaseBed
}) => {
  const [selectedWard, setSelectedWard] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = beds.filter((b) => {
    const matchWard = selectedWard === 'ALL' || b.wardId === selectedWard;
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchSearch = b.bedCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.currentPatientName && b.currentPatientName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchWard && matchStatus && matchSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Visual Bed Master & Roster Board
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Interactive ward-by-ward bed roster with live status, telemetry support, and blocking control.
          </p>
        </div>
        <Button variant="primary" onClick={onOpenCreateBed}>+ Register Bed</Button>
      </div>

      <Card style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search bed code or patient..." />
        </div>
        <div style={{ width: '220px' }}>
          <Select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            options={[{ value: 'ALL', label: 'All Wards' }, ...wards.map((w) => ({ value: w.id, label: w.wardName }))]}
          />
        </div>
        <div style={{ width: '180px' }}>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'AVAILABLE', label: 'Available' },
              { value: 'OCCUPIED', label: 'Occupied' },
              { value: 'RESERVED', label: 'Reserved' },
              { value: 'CLEANING', label: 'Cleaning' },
              { value: 'BLOCKED', label: 'Blocked / Maintenance' }
            ]}
          />
        </div>
      </Card>

      {/* Bed Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {filtered.map((bed) => (
          <Card key={bed.id} style={{ padding: '1rem', borderTop: `4px solid ${bed.status === 'AVAILABLE' ? '#16a34a' : bed.status === 'OCCUPIED' ? '#2563eb' : bed.status === 'CLEANING' ? '#ca8a04' : '#dc2626'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{bed.bedCode}</strong>
              <Badge variant={bed.status === 'AVAILABLE' ? 'success' : bed.status === 'OCCUPIED' ? 'neutral' : bed.status === 'CLEANING' ? 'warning' : 'danger'}>
                {bed.status}
              </Badge>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{bed.wardName} • {bed.bedClass}</div>
            <div style={{ margin: '0.5rem 0', fontSize: '0.85rem' }}>
              {bed.status === 'OCCUPIED' && (
                <div>👤 <strong>{bed.currentPatientName}</strong> ({bed.currentPatientMrn})</div>
              )}
              {bed.status === 'AVAILABLE' && <div style={{ color: '#16a34a' }}>✅ Ready for new admission</div>}
              {bed.status === 'CLEANING' && <div style={{ color: '#ca8a04' }}>🧹 Sanitization in progress</div>}
              {bed.status === 'BLOCKED' && <div style={{ color: '#dc2626' }}>⚠️ {bed.notes || 'Maintenance block'}</div>}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <Button variant="outline" size="sm" onClick={() => onOpenEditBed(bed)}>Edit</Button>
              {bed.status === 'AVAILABLE' && (
                <>
                  <Button variant="primary" size="sm" onClick={() => onOpenReserveBed(bed)}>Reserve</Button>
                  <Button variant="outline" size="sm" onClick={() => onOpenBlockBed(bed)}>Block</Button>
                </>
              )}
              {bed.status === 'OCCUPIED' && (
                <Button variant="outline" size="sm" onClick={() => onOpenReleaseBed(bed)}>Release Bed</Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};