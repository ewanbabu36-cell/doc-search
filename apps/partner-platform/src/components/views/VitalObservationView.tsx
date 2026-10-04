import React from 'react';
import { Card } from '@docsearch/ui-kit';
import type { InpatientVitalObservationDto } from '@docsearch/api-contracts';

export interface VitalObservationViewProps {
  vitals: InpatientVitalObservationDto[];
}

export const VitalObservationView: React.FC<VitalObservationViewProps> = ({ vitals = [] }) => {
  const safeVitals = Array.isArray(vitals) ? vitals : [];

  const calculateNews2 = (v: InpatientVitalObservationDto) => {
    let score = 0;
    const rr = v.respiratoryRateBpm || 18;
    const o2 = v.spo2Percentage || 98;
    const sBp = v.systolicBpMmHg || 120;
    const hr = v.pulseBpm || 76;
    const temp = v.temperatureCelsius || 37.0;

    if (rr <= 8) score += 3;
    else if (rr >= 9 && rr <= 11) score += 1;
    else if (rr >= 21 && rr <= 24) score += 2;
    else if (rr >= 25) score += 3;

    if (o2 <= 91) score += 3;
    else if (o2 >= 92 && o2 <= 93) score += 2;
    else if (o2 >= 94 && o2 <= 95) score += 1;

    if (sBp <= 90) score += 3;
    else if (sBp >= 91 && sBp <= 100) score += 2;
    else if (sBp >= 101 && sBp <= 110) score += 1;
    else if (sBp >= 220) score += 3;

    if (hr <= 40) score += 3;
    else if (hr >= 41 && hr <= 50) score += 1;
    else if (hr >= 91 && hr <= 110) score += 1;
    else if (hr >= 111 && hr <= 130) score += 2;
    else if (hr >= 131) score += 3;

    if (temp <= 35.0) score += 3;
    else if (temp >= 35.1 && temp <= 36.0) score += 1;
    else if (temp >= 38.1 && temp <= 39.0) score += 1;
    else if (temp >= 39.1) score += 2;

    const isSepticShockRisk = sBp <= 90 && hr >= 110 && (temp >= 38.0 || temp <= 36.0 || rr >= 22);
    return { score, isSepticShockRisk, isHighRisk: score >= 5 || isSepticShockRisk };
  };

  const hasActiveHighRisk = safeVitals.some((v) => calculateNews2(v).isHighRisk);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--ds-color-text-primary, #f8fafc)' }}>Inpatient Vitals & Observations Log</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Dynamic NEWS2 Early Warning Engine, Sepsis Triad surveillance, and telemetry log.</p>
        </div>
        {hasActiveHighRisk && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1.5px solid #EF4444', borderRadius: '8px', padding: '6px 12px', color: '#F87171', fontSize: '0.75rem', fontWeight: 800 }}>
            🚨 ACTIVE SEPSIS RISK PROTOCOL DISPATCHED
          </div>
        )}
      </div>

      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Time</th>
              <th style={{ padding: '0.75rem 1rem' }}>Blood Pressure</th>
              <th style={{ padding: '0.75rem 1rem' }}>Heart Rate</th>
              <th style={{ padding: '0.75rem 1rem' }}>SpO2</th>
              <th style={{ padding: '0.75rem 1rem' }}>Temp</th>
              <th style={{ padding: '0.75rem 1rem' }}>NEWS2 & Risk</th>
              <th style={{ padding: '0.75rem 1rem' }}>Recorded By</th>
            </tr>
          </thead>
          <tbody>
            {safeVitals.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>No vital signs recorded yet.</td>
              </tr>
            ) : (
              safeVitals.map((v) => {
                const evalResult = calculateNews2(v);
                return (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: evalResult.isHighRisk ? '#FEF2F2' : undefined }}>
                    <td style={{ padding: '0.75rem 1rem' }}>{v.recordedAt ? new Date(v.recordedAt).toLocaleString() : 'N/A'}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: (v.systolicBpMmHg || 120) <= 90 ? '#DC2626' : undefined }}>
                      {v.systolicBpMmHg}/{v.diastolicBpMmHg} mmHg
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: (v.pulseBpm || 76) >= 110 ? '#DC2626' : undefined }}>
                      {v.pulseBpm} BPM
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: (v.spo2Percentage || 98) <= 92 ? '#DC2626' : '#16a34a', fontWeight: 600 }}>
                      {v.spo2Percentage}%
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>{v.temperatureCelsius}°C</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {evalResult.isSepticShockRisk ? (
                        <span style={{ backgroundColor: '#EF4444', color: '#FFF', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800 }}>
                          🚨 SEPTIC SHOCK ({evalResult.score})
                        </span>
                      ) : evalResult.isHighRisk ? (
                        <span style={{ backgroundColor: '#DC2626', color: '#FFF', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800 }}>
                          ⚠️ HIGH RISK ({evalResult.score})
                        </span>
                      ) : (
                        <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                          ✓ Stable ({evalResult.score})
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{v.recordedBy}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};