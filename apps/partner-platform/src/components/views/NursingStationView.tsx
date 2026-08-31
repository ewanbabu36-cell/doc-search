import React, { useState } from 'react';
import { Card, Button, Select, Badge } from '@docsearch/ui-kit';
import type { InpatientAdmissionDto, InpatientWardDto } from '@docsearch/api-contracts';

export interface NursingStationViewProps {
  admissions: InpatientAdmissionDto[];
  wards: InpatientWardDto[];
  onOpenNursingAssessment: (adm: InpatientAdmissionDto) => void;
  onOpenNursingNote: (adm: InpatientAdmissionDto) => void;
  onOpenCarePlan: (adm: InpatientAdmissionDto) => void;
  onOpenRecordVital: (adm: InpatientAdmissionDto) => void;
  onSelectAdmission: (id: string) => void;
}

export const NursingStationView: React.FC<NursingStationViewProps> = ({
  admissions,
  wards,
  onOpenNursingAssessment,
  onOpenNursingNote,
  onOpenCarePlan,
  onOpenRecordVital,
  onSelectAdmission
}) => {
  const [selectedWard, setSelectedWard] = useState('ALL');

  const filtered = admissions.filter((a) => selectedWard === 'ALL' || a.wardId === selectedWard);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Nursing Station Operational Workbench</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Shift handover, bedside vitals recording, and nursing care plan execution.</p>
        </div>
        <div style={{ width: '220px' }}>
          <Select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            options={[{ value: 'ALL', label: 'All Nursing Stations' }, ...wards.map((w) => ({ value: w.id, label: w.nursingStationName }))]}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
        {filtered.map((adm) => (
          <Card key={adm.id} style={{ padding: '1rem', borderLeft: '4px solid #2563eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{adm.patientName}</strong>
              <Badge variant="neutral">Bed: {adm.bedCode}</Badge>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{adm.patientMrn} • {adm.wardName}</div>
            <div style={{ fontSize: '0.85rem', margin: '0.5rem 0', color: '#334155' }}>
              <strong>Diagnosis:</strong> {adm.primaryDiagnosis}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              <Button variant="primary" size="sm" onClick={() => onOpenRecordVital(adm)}>Chart Vitals</Button>
              <Button variant="outline" size="sm" onClick={() => onOpenNursingAssessment(adm)}>Assessment</Button>
              <Button variant="outline" size="sm" onClick={() => onOpenNursingNote(adm)}>Add Note</Button>
              <Button variant="outline" size="sm" onClick={() => onOpenCarePlan(adm)}>Care Plan</Button>
              <Button variant="outline" size="sm" onClick={() => onSelectAdmission(adm.id)}>Full Chart</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};