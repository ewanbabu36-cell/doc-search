import React from 'react';
import { Card } from '@docsearch/ui-kit';
import type { InpatientNursingAssessmentDto } from '@docsearch/api-contracts';

export interface NursingCareViewProps {
  assessments: InpatientNursingAssessmentDto[];
}

export const NursingCareView: React.FC<NursingCareViewProps> = ({ assessments }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Inpatient Nursing Care Documentation</h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Assessment logs, risk scale charts, and clinical summaries.</p>
      </div>
      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Time & Shift</th>
              <th style={{ padding: '0.75rem 1rem' }}>Nurse</th>
              <th style={{ padding: '0.75rem 1rem' }}>Assessment Type</th>
              <th style={{ padding: '0.75rem 1rem' }}>Morse Fall / Braden</th>
              <th style={{ padding: '0.75rem 1rem' }}>Clinical Summary</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((a) => (
              <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.75rem 1rem' }}>{new Date(a.createdAt).toLocaleString()} ({a.shiftType})</td>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{a.assessedBy}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{a.assessmentType}</td>
                <td style={{ padding: '0.75rem 1rem' }}>Fall: {a.fallRiskScore} • Braden: {a.pressureInjuryRiskScore}</td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#475569' }}>{a.nursingSummary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};