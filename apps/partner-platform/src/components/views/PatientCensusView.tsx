import React, { useState } from 'react';
import { Card, Input, Badge } from '@docsearch/ui-kit';
import type { InpatientAdmissionDto } from '@docsearch/api-contracts';

export interface PatientCensusViewProps {
  admissions: InpatientAdmissionDto[];
}

export const PatientCensusView: React.FC<PatientCensusViewProps> = ({ admissions }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = admissions.filter((a) =>
    a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.patientMrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.wardName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Hospital Daily Patient Census</h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Official active patient roster across all medical wards.</p>
      </div>
      <Card style={{ padding: '1rem' }}>
        <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search patient census..." />
      </Card>
      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Patient Name</th>
              <th style={{ padding: '0.75rem 1rem' }}>MRN</th>
              <th style={{ padding: '0.75rem 1rem' }}>Ward & Bed</th>
              <th style={{ padding: '0.75rem 1rem' }}>Attending Doctor</th>
              <th style={{ padding: '0.75rem 1rem' }}>Admitted Date</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((adm) => (
              <tr key={adm.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{adm.patientName}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{adm.patientMrn}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{adm.wardName} ({adm.bedCode})</td>
                <td style={{ padding: '0.75rem 1rem' }}>{adm.attendingConsultantName}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{new Date(adm.admissionDateTime).toLocaleDateString()}</td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}><Badge variant="success">{adm.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};