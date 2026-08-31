import React from 'react';
import { Card } from '@docsearch/ui-kit';
import type { InpatientAdmissionDto } from '@docsearch/api-contracts';

export interface PatientLocationViewProps {
  admissions: InpatientAdmissionDto[];
}

export const PatientLocationView: React.FC<PatientLocationViewProps> = ({ admissions }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Patient Location Tracker</h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Tracking active room assignments and transfer trajectories.</p>
      </div>
      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Patient</th>
              <th style={{ padding: '0.75rem 1rem' }}>Current Ward</th>
              <th style={{ padding: '0.75rem 1rem' }}>Bed Code</th>
              <th style={{ padding: '0.75rem 1rem' }}>Admission Date</th>
            </tr>
          </thead>
          <tbody>
            {admissions.map((a) => (
              <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{a.patientName}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{a.wardName}</td>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2563eb' }}>{a.bedCode}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{new Date(a.admissionDateTime).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};