import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Badge
} from '@docsearch/ui-kit';
import type {
  InsuranceClaimDto
} from '@docsearch/api-contracts';

export interface ClaimDirectoryViewProps {
  claims: InsuranceClaimDto[];
  onOpenCreateClaim: () => void;
  onSelectClaim: (claimId: string) => void;
  onOpenSubmitClaim: (claim: InsuranceClaimDto) => void;
}

export const ClaimDirectoryView: React.FC<ClaimDirectoryViewProps> = ({
  claims,
  onOpenCreateClaim,
  onSelectClaim,
  onOpenSubmitClaim
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = claims.filter((c) => {
    const matchesSearch =
      c.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.patientMrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.payerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.primaryDiagnosisCode && c.primaryDiagnosisCode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Insurance Claims Directory
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Complete lifecycle management of commercial health claims, EDI transmissions, adjudications, and dispute status.
          </p>
        </div>
        <Button variant="primary" onClick={onOpenCreateClaim}>
          + Generate Healthcare Claim
        </Button>
      </div>

      <Card style={{ padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
              Search Claims by Claim #, Patient Name, MRN, Payer, or ICD-10
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g. CLM-2026, Eleanor, I10"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
              Lifecycle Status
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Claim States' },
                { value: 'READY_FOR_SUBMISSION', label: 'Ready for Submission' },
                { value: 'SUBMITTED', label: 'Submitted to Payer' },
                { value: 'ACKNOWLEDGED', label: 'EDI Acknowledged' },
                { value: 'APPROVED', label: 'Approved by Payer' },
                { value: 'PARTIALLY_APPROVED', label: 'Partially Approved' },
                { value: 'DENIED', label: 'Denied' },
                { value: 'APPEAL_SUBMITTED', label: 'Appeal In Progress' },
                { value: 'SETTLED', label: 'Settled & Paid' }
              ]}
            />
          </div>
        </div>
      </Card>

      <Card style={{ padding: '0' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.875rem 1rem' }}>Claim #</th>
                <th style={{ padding: '0.875rem 1rem' }}>Patient / MRN</th>
                <th style={{ padding: '0.875rem 1rem' }}>Payer & Policy</th>
                <th style={{ padding: '0.875rem 1rem' }}>Claim Type</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Billed</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Approved</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((claim) => (
                <tr key={claim.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#2563eb' }}>
                    {claim.claimNumber}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{claim.patientName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{claim.patientMrn}</div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div>{claim.payerName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Pol: {claim.policyNumber}</div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <Badge variant="primary">{claim.claimType}</Badge>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                    ${claim.totalClaimAmount.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>
                    ${claim.approvedAmount.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                    <Badge
                      variant={
                        claim.status === 'APPROVED' || claim.status === 'SETTLED'
                          ? 'success'
                          : claim.status === 'DENIED'
                          ? 'danger'
                          : claim.status === 'SUBMITTED'
                          ? 'primary'
                          : 'warning'
                      }
                    >
                      {claim.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                      <Button variant="outline" size="sm" onClick={() => onSelectClaim(claim.id)}>
                        Inspect
                      </Button>
                      {claim.status === 'READY_FOR_SUBMISSION' && (
                        <Button variant="primary" size="sm" onClick={() => onOpenSubmitClaim(claim)}>
                          Submit
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
