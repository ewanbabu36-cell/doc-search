import React from 'react';
import {
  Card,
  Badge,
  Button
} from '@docsearch/ui-kit';
import type {
  PatientInsuranceHistoryDto
} from '@docsearch/api-contracts';

export interface PatientInsuranceHistoryViewProps {
  history: PatientInsuranceHistoryDto | null;
  onSelectClaim: (claimId: string) => void;
}

export const PatientInsuranceHistoryView: React.FC<PatientInsuranceHistoryViewProps> = ({
  history,
  onSelectClaim
}) => {
  if (!history) {
    return (
      <Card style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#64748b' }}>Select a patient to inspect their longitudinal insurance claims ledger.</p>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
          Longitudinal Patient Insurance History & Coverage Dossier
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
          Cumulative healthcare benefit utilization, claim history, and out-of-pocket liabilities for {history.patientName} ({history.patientMrn}).
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <Card style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Billed to Insurers</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginTop: '0.2rem' }}>
            ${history.totalClaimed.toFixed(2)}
          </div>
        </Card>

        <Card style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Payer Approved & Settled</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a', marginTop: '0.2rem' }}>
            ${history.totalApproved.toFixed(2)}
          </div>
        </Card>

        <Card style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Patient Copay Paid</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2563eb', marginTop: '0.2rem' }}>
            ${history.totalPatientPaid.toFixed(2)}
          </div>
        </Card>

        <Card style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Pending Payer Adjudication</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#d97706', marginTop: '0.2rem' }}>
            ${history.totalPendingPayer.toFixed(2)}
          </div>
        </Card>
      </div>

      {/* Patient Claims History */}
      <Card style={{ padding: '1.25rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
          Historical Insurance Claims
        </h3>
        {history.claims.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No claims recorded for this patient.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem' }}>Claim #</th>
                  <th style={{ padding: '0.5rem' }}>Payer</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Billed</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Approved</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Copay</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {history.claims.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.6rem 0.5rem', fontWeight: 600, color: '#2563eb' }}>{c.claimNumber}</td>
                    <td style={{ padding: '0.6rem 0.5rem' }}>{c.payerName}</td>
                    <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: 600 }}>${c.totalClaimAmount.toFixed(2)}</td>
                    <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>${c.approvedAmount.toFixed(2)}</td>
                    <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', color: '#d97706' }}>${c.patientResponsibility.toFixed(2)}</td>
                    <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                      <Badge variant={c.status === 'APPROVED' || c.status === 'SETTLED' ? 'success' : c.status === 'DENIED' ? 'danger' : 'primary'}>
                        {c.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                      <Button variant="outline" size="sm" onClick={() => onSelectClaim(c.id)}>
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
