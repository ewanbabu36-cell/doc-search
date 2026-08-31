import React, { useState } from 'react';
import { Card, Button, Input, Badge } from '@docsearch/ui-kit';
import type { InpatientWardDto } from '@docsearch/api-contracts';

export interface WardDirectoryViewProps {
  wards: InpatientWardDto[];
  onOpenCreateWard: () => void;
  onSelectWard: (w: InpatientWardDto) => void;
}

export const WardDirectoryView: React.FC<WardDirectoryViewProps> = ({ wards, onOpenCreateWard, onSelectWard }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = wards.filter((w) =>
    w.wardCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.wardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.building.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Inpatient Ward Directory</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Facility unit structure, care level designations, and floor rosters.</p>
        </div>
        <Button variant="primary" onClick={onOpenCreateWard}>+ Add Ward</Button>
      </div>

      <Card style={{ padding: '1rem' }}>
        <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search wards by name, code, building..." />
      </Card>

      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Ward Code</th>
              <th style={{ padding: '0.75rem 1rem' }}>Ward Name</th>
              <th style={{ padding: '0.75rem 1rem' }}>Type & Care Level</th>
              <th style={{ padding: '0.75rem 1rem' }}>Building & Floor</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Capacity</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => (
              <tr key={w.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2563eb' }}>{w.wardCode}</td>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{w.wardName}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{w.wardType} • <Badge variant="neutral">{w.careLevel}</Badge></td>
                <td style={{ padding: '0.75rem 1rem' }}>{w.building} ({w.floor})</td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>{w.totalBeds} Beds</td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                  <Button variant="outline" size="sm" onClick={() => onSelectWard(w)}>Manage</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};