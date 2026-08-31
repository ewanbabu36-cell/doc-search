import React from 'react';
import { Card } from '@docsearch/ui-kit';
import type { InpatientDischargeSummaryDto } from '@docsearch/api-contracts';

export interface DischargeSummaryViewProps {
  summaries: InpatientDischargeSummaryDto[];
}

export const DischargeSummaryView: React.FC<DischargeSummaryViewProps> = ({ summaries }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Finalized Discharge Summaries</h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Archived, consultant-signed electronic discharge summaries.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {summaries.map((s) => (
          <Card key={s.id} style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{s.patientName} ({s.patientMrn}) — {s.summaryNumber}</strong>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Discharged: {new Date(s.dischargeDate).toLocaleDateString()}</span>
            </div>
            <div style={{ fontSize: '0.85rem', margin: '0.5rem 0' }}>
              <div><strong>Final Diagnosis:</strong> {s.finalPrimaryDiagnosis}</div>
              <div style={{ marginTop: '0.25rem' }}><strong>Hospital Course:</strong> {s.hospitalCourseSummary}</div>
              <div style={{ marginTop: '0.25rem' }}><strong>Discharge Rx:</strong> {s.dischargeMedicationAdvice}</div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Signed by {s.attendingConsultantName}</div>
          </Card>
        ))}
      </div>
    </div>
  );
};