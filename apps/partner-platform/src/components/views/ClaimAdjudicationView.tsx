import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Badge
} from '@docsearch/ui-kit';
import type {
  InsuranceClaimDto,
  InsuranceClaimAdjudicationDto
} from '@docsearch/api-contracts';

export interface ClaimAdjudicationViewProps {
  claims: InsuranceClaimDto[];
  adjudications: InsuranceClaimAdjudicationDto[];
  onOpenAdjudicateClaim: (claim: InsuranceClaimDto) => void;
  onSelectClaim?: (claimId: string) => void;
}

export const ClaimAdjudicationView: React.FC<ClaimAdjudicationViewProps> = ({
  claims,
  adjudications,
  onOpenAdjudicateClaim
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const pendingAdjudication = claims.filter((c) => c.status === 'SUBMITTED' || c.status === 'ACKNOWLEDGED' || c.status === 'PROCESSING');
  const filtered = pendingAdjudication.filter((c) =>
    c.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.payerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Claim Adjudication & Explanation of Benefits (EOB)
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Process payer electronic remittance advice (ERA 835), approved tariff line items, and patient copay calculations.
          </p>
        </div>
      </div>

      <Card style={{ padding: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
          Search Claims Pending Adjudication
        </label>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="e.g. CLM-2026, Eleanor Vance, BlueShield"
        />
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left: Claims Pending Adjudication */}
        <Card style={{ padding: '0' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>
            Claims Awaiting Remittance Advice ({filtered.length})
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
              Zero submitted claims currently awaiting adjudication.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Claim #</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Patient</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Payer</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Billed</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((claim) => (
                    <tr key={claim.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2563eb' }}>
                        {claim.claimNumber}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>{claim.patientName}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{claim.payerName}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                        ${claim.totalClaimAmount.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <Badge variant="primary">{claim.status}</Badge>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <Button variant="primary" size="sm" onClick={() => onOpenAdjudicateClaim(claim)}>
                          Adjudicate
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Right: Adjudication Advice Feed */}
        <Card style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
            Processed Remittance Advice (EOBs)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            {adjudications.slice(0, 4).map((adj) => (
              <div key={adj.id} style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#166534' }}>
                  <span>{adj.adjudicationReference}</span>
                  <Badge variant="success">{adj.adjudicationStatus}</Badge>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '0.2rem' }}>
                  Claim: {adj.claimNumber} • Approved: ${adj.approvedAmount.toFixed(2)}
                </div>
                {adj.payerRemarks && (
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.2rem', fontStyle: 'italic' }}>
                    &ldquo;{adj.payerRemarks}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
