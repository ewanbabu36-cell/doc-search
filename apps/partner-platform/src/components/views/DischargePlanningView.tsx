import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { InpatientDischargePlanDto, InpatientAdmissionDto } from '@docsearch/api-contracts';

export interface DischargePlanningViewProps {
  plans: InpatientDischargePlanDto[];
  admissions: InpatientAdmissionDto[];
  onOpenCreatePlan: (adm: InpatientAdmissionDto) => void;
}

export const DischargePlanningView: React.FC<DischargePlanningViewProps> = ({ plans }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Inpatient Discharge Planning</h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Proactive readiness coordination, medication reconciliation, and follow-up planning.</p>
      </div>
      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Patient</th>
              <th style={{ padding: '0.75rem 1rem' }}>Target Date</th>
              <th style={{ padding: '0.75rem 1rem' }}>Readiness</th>
              <th style={{ padding: '0.75rem 1rem' }}>Clearances</th>
              <th style={{ padding: '0.75rem 1rem' }}>Coordinator</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Patient Ref: {p.patientId}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{new Date(p.targetDischargeDate).toLocaleDateString()}</td>
                <td style={{ padding: '0.75rem 1rem' }}><Badge variant="success">{p.readinessStatus}</Badge></td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>Billing: {p.isBillingCleared ? '✅' : '⏳'} • Summary: {p.isDischargeSummaryFinalized ? '✅' : '⏳'}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{p.coordinatorName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};