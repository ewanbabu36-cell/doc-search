import React from 'react';
import { Card } from '@docsearch/ui-kit';
import type { InpatientVitalObservationDto } from '@docsearch/api-contracts';

export interface VitalObservationViewProps {
  vitals: InpatientVitalObservationDto[];
}

export const VitalObservationView: React.FC<VitalObservationViewProps> = ({ vitals }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Inpatient Vitals & Observations Log</h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Periodic telemetry charts, blood pressure, SpO2, and glucose measurements.</p>
      </div>
      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Time</th>
              <th style={{ padding: '0.75rem 1rem' }}>Blood Pressure</th>
              <th style={{ padding: '0.75rem 1rem' }}>Heart Rate</th>
              <th style={{ padding: '0.75rem 1rem' }}>SpO2</th>
              <th style={{ padding: '0.75rem 1rem' }}>Temp</th>
              <th style={{ padding: '0.75rem 1rem' }}>Recorded By</th>
            </tr>
          </thead>
          <tbody>
            {vitals.map((v) => (
              <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.75rem 1rem' }}>{new Date(v.recordedAt).toLocaleString()}</td>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{v.systolicBpMmHg}/{v.diastolicBpMmHg} mmHg</td>
                <td style={{ padding: '0.75rem 1rem' }}>{v.pulseBpm} BPM</td>
                <td style={{ padding: '0.75rem 1rem', color: '#16a34a', fontWeight: 600 }}>{v.spo2Percentage}%</td>
                <td style={{ padding: '0.75rem 1rem' }}>{v.temperatureCelsius}°C</td>
                <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{v.recordedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};