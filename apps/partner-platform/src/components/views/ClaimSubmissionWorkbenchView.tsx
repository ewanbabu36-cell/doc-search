import { TpaClaimPredictorStudio } from './TpaClaimPredictorStudio.js';
import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Badge
} from '@docsearch/ui-kit';
import type {
  InsuranceClaimDto,
  InsuranceClaimSubmissionDto
} from '@docsearch/api-contracts';

export interface ClaimSubmissionWorkbenchViewProps {
  claims: InsuranceClaimDto[];
  submissions: InsuranceClaimSubmissionDto[];
  onOpenSubmitClaim: (claim: InsuranceClaimDto) => void;
  onOpenValidateClaim: (claim: InsuranceClaimDto) => void;
}

export const ClaimSubmissionWorkbenchView: React.FC<ClaimSubmissionWorkbenchViewProps> = ({
  claims,
  submissions,
  onOpenSubmitClaim,
  onOpenValidateClaim
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const readyClaims = claims.filter((c) => c.status === 'READY_FOR_SUBMISSION' || c.status === 'DRAFT');
  const filtered = readyClaims.filter((c) =>
    c.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.payerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Claim Submission & Electronic EDI Clearinghouse
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Pre-flight scrubbers, batch generation, and electronic dispatch for commercial claims awaiting payer transmission.
          </p>
        </div>
      </div>

      <Card style={{ padding: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
          Search Claims Ready for Transmission
        </label>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="e.g. CLM-2026, Eleanor Vance, BlueShield"
        />
      </Card>

      <TpaClaimPredictorStudio />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left: Queue of Ready Claims */}
        <Card style={{ padding: '0' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>
            Claims Awaiting Transmission ({filtered.length})
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
              Zero claims pending transmission. All generated claims are submitted or adjudicated.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Claim #</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Patient</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Payer</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((claim) => (
                    <tr key={claim.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2563eb' }}>
                        {claim.claimNumber}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div>{claim.patientName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{claim.patientMrn}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>{claim.payerName}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                        ${claim.totalClaimAmount.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <Button variant="outline" size="sm" onClick={() => onOpenValidateClaim(claim)}>
                            Scrub
                          </Button>
                          <Button variant="primary" size="sm" onClick={() => onOpenSubmitClaim(claim)}>
                            Submit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Right: Recent Transmission Audit Batches */}
        <Card style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
            Recent Clearinghouse Transmissions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            {submissions.slice(0, 4).map((sub) => (
              <div key={sub.id} style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>{sub.submissionNumber}</span>
                  <Badge variant="primary">{sub.transmissionStatus}</Badge>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Claim: {sub.claimNumber} • {sub.transmissionBatchId}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.2rem' }}>
                  {sub.payerAcknowledgement || 'Accepted by gateway'}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
