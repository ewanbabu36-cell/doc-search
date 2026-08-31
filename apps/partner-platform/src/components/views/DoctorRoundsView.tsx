import React from 'react';
import { Card } from '@docsearch/ui-kit';
import type { InpatientDoctorRoundDto } from '@docsearch/api-contracts';

export interface DoctorRoundsViewProps {
  rounds: InpatientDoctorRoundDto[];
}

export const DoctorRoundsView: React.FC<DoctorRoundsViewProps> = ({ rounds }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Doctor Daily Inpatient Rounds</h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Clinical assessments, daily treatment plan modifications, and readiness scores.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {rounds.map((r) => (
          <Card key={r.id} style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
              <span>{r.doctorName} ({r.doctorSpecialty}) • {r.roundType}</span>
              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{new Date(r.roundTimestamp).toLocaleString()}</span>
            </div>
            <div style={{ margin: '0.5rem 0', fontSize: '0.85rem' }}>
              <div><strong>Impression:</strong> {r.clinicalImpression}</div>
              <div style={{ marginTop: '0.25rem', color: '#334155' }}><strong>Plan:</strong> {r.treatmentPlanUpdates}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};