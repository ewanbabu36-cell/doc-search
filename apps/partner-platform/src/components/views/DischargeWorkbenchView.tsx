import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { InpatientAdmissionDto } from '@docsearch/api-contracts';

export interface DischargeWorkbenchViewProps {
  admissions: InpatientAdmissionDto[];
  onOpenApproveDischarge: (adm: InpatientAdmissionDto) => void;
  onOpenCompleteDischarge: (adm: InpatientAdmissionDto) => void;
  onOpenFinalizeSummary: (adm: InpatientAdmissionDto) => void;
}

export const DischargeWorkbenchView: React.FC<DischargeWorkbenchViewProps> = ({
  admissions,
  onOpenApproveDischarge,
  onOpenCompleteDischarge,
  onOpenFinalizeSummary
}) => {
  const planned = admissions.filter((a) => a.status === 'DISCHARGE_PLANNED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Discharge Authorization & Clearance Workbench</h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Consolidated multi-department clearances (Clinical, Pharmacy, Billing, TPA Insurance).</p>
      </div>
      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Patient & MRN</th>
              <th style={{ padding: '0.75rem 1rem' }}>Ward & Bed</th>
              <th style={{ padding: '0.75rem 1rem' }}>Clearances</th>
              <th style={{ padding: '0.75rem 1rem' }}>Summary Sealed</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {planned.map((adm) => (
              <tr key={adm.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{adm.patientName} ({adm.patientMrn})</td>
                <td style={{ padding: '0.75rem 1rem' }}>{adm.wardName} (Bed {adm.bedCode})</td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                  Clinical: {adm.clinicalClearance ? '✅' : '⏳'} | Billing: {adm.billingCleared ? '✅' : '⏳'} | Insurance: {adm.insuranceCleared ? '✅' : '⏳'}
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <Badge variant={adm.dischargeSummaryFinalized ? 'success' : 'warning'}>
                    {adm.dischargeSummaryFinalized ? 'Finalized' : 'Draft'}
                  </Badge>
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    {!adm.dischargeSummaryFinalized && (
                      <Button variant="outline" size="sm" onClick={() => onOpenFinalizeSummary(adm)}>Seal Summary</Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => onOpenApproveDischarge(adm)}>Clearances</Button>
                    <Button variant="primary" size="sm" onClick={() => onOpenCompleteDischarge(adm)}>Discharge & Release Bed</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};