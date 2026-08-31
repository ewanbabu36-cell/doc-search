import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Badge
} from '@docsearch/ui-kit';
import type {
  InsuranceClaimAppealDto
} from '@docsearch/api-contracts';

export interface ClaimAppealsViewProps {
  appeals: InsuranceClaimAppealDto[];
  onOpenResolveAppeal: (appeal: InsuranceClaimAppealDto) => void;
}

export const ClaimAppealsView: React.FC<ClaimAppealsViewProps> = ({
  appeals,
  onOpenResolveAppeal
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = appeals.filter((a) =>
    a.appealNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.payerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Claim Dispute Appeals Pipeline
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Multi-level grievance reconsiderations, medical justification hearings, and recovered revenue tracking.
          </p>
        </div>
      </div>

      <Card style={{ padding: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
          Search Appeals by Number, Claim #, Patient, or Insurer
        </label>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="e.g. APL-2026, CLM-2026, Sophia Lin"
        />
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
        {filtered.map((appeal) => (
          <Card key={appeal.id} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2563eb' }}>
                  {appeal.appealNumber} (Level {appeal.appealLevel})
                </span>
                <Badge
                  variant={
                    appeal.status === 'APPROVED' || appeal.status === 'PARTIALLY_OVERTURNED'
                      ? 'success'
                      : appeal.status === 'UPHELD_DENIED'
                      ? 'danger'
                      : 'warning'
                  }
                >
                  {appeal.status}
                </Badge>
              </div>

              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 600, color: '#0f172a' }}>
                {appeal.patientName}
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                Claim: {appeal.claimNumber} • {appeal.payerName}
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', margin: '0.75rem 0' }}>
                <div><strong>Clinical Rebuttal:</strong> {appeal.appealReason}</div>
                {appeal.supportingDocumentsSummary && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>
                    📎 Evidence: {appeal.supportingDocumentsSummary}
                  </div>
                )}
                {appeal.recoveredAmount > 0 && (
                  <div style={{ color: '#16a34a', fontWeight: 600, marginTop: '0.4rem' }}>
                    Recovered Revenue: ${appeal.recoveredAmount.toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Submitted: {new Date(appeal.submittedAt).toLocaleDateString()}
              </span>
              {appeal.status === 'UNDER_REVIEW' && (
                <Button variant="primary" size="sm" onClick={() => onOpenResolveAppeal(appeal)}>
                  Record Payer Decision
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
