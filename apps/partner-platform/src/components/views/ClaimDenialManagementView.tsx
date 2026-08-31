import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Badge
} from '@docsearch/ui-kit';
import type {
  InsuranceClaimDenialDto
} from '@docsearch/api-contracts';

export interface ClaimDenialManagementViewProps {
  denials: InsuranceClaimDenialDto[];
  onOpenCreateAppeal: (denial: InsuranceClaimDenialDto) => void;
}

export const ClaimDenialManagementView: React.FC<ClaimDenialManagementViewProps> = ({
  denials,
  onOpenCreateAppeal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filtered = denials.filter((d) => {
    const matchesSearch =
      d.denialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.denialCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || d.denialCategory === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Claim Denial Management & Root Cause Registry
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            CARC/RARC denial classification, appeal deadline tracking, and recovery pipeline management.
          </p>
        </div>
      </div>

      <Card style={{ padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
              Search Denials by Number, Claim #, Patient, or CARC Code
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g. DEN-2026, CO-16, Sophia Lin"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
              Root Cause Category
            </label>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Denial Categories' },
                { value: 'PRE_AUTH_MISSING', label: 'Missing Pre-Authorization' },
                { value: 'MEDICAL_NECESSITY', label: 'Medical Necessity Lacking' },
                { value: 'ELIGIBILITY_EXPIRED', label: 'Eligibility Expired' },
                { value: 'TIMELY_FILING', label: 'Timely Filing Exceeded' },
                { value: 'NON_COVERED_SERVICE', label: 'Non-Covered Service' },
                { value: 'CODING_DISCREPANCY', label: 'Coding / Unbundling Discrepancy' }
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
                <th style={{ padding: '0.875rem 1rem' }}>Denial #</th>
                <th style={{ padding: '0.875rem 1rem' }}>Claim # / Patient</th>
                <th style={{ padding: '0.875rem 1rem' }}>Payer</th>
                <th style={{ padding: '0.875rem 1rem' }}>CARC Code & Category</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Denied Amount</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Appeal Status</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((denial) => (
                <tr key={denial.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#dc2626' }}>
                    {denial.denialNumber}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ fontWeight: 600 }}>{claimNumberBadge(denial.claimNumber)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{denial.patientName}</div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>{denial.payerName}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ fontWeight: 600 }}>{denial.denialCode}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{denial.denialCategory.replace(/_/g, ' ')}</div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                    ${denial.deniedAmount.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                    <Badge variant={denial.status === 'APPEAL_RESOLVED' ? 'success' : denial.status === 'APPEAL_IN_PROGRESS' ? 'warning' : 'danger'}>
                      {denial.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                    {denial.status === 'ACTIVE' && denial.appealEligible ? (
                      <Button variant="primary" size="sm" onClick={() => onOpenCreateAppeal(denial)}>
                        Lodge Appeal
                      </Button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>In Progress</span>
                    )}
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

function claimNumberBadge(num: string) {
  return <span style={{ color: '#2563eb' }}>{num}</span>;
}
