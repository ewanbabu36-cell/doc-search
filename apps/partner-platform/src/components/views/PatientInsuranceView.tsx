import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Badge
} from '@docsearch/ui-kit';
import type {
  InsurancePatientPolicyDto
} from '@docsearch/api-contracts';

export interface PatientInsuranceViewProps {
  policies: InsurancePatientPolicyDto[];
  onOpenRegisterPolicy: () => void;
  onOpenVerifyEligibility: (policy: InsurancePatientPolicyDto) => void;
  onOpenCreateAuth: (policy: InsurancePatientPolicyDto) => void;
  onOpenCreateClaim: (policy: InsurancePatientPolicyDto) => void;
}

export const PatientInsuranceView: React.FC<PatientInsuranceViewProps> = ({
  policies,
  onOpenRegisterPolicy,
  onOpenVerifyEligibility,
  onOpenCreateAuth,
  onOpenCreateClaim
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = policies.filter((p) =>
    p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patientMrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.payerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Patient Insurance Policies & Cards
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Active beneficiary coverage records, card verification audit states, and real-time eligibility triggers.
          </p>
        </div>
        <Button variant="primary" onClick={onOpenRegisterPolicy}>
          + Enroll Patient Policy
        </Button>
      </div>

      <Card style={{ padding: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
          Search by Patient Name, MRN, Member ID, Policy #, or Insurer
        </label>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="e.g. Eleanor Vance, MRN-2026-00891, MEM-BS-99081"
        />
      </Card>

      <Card style={{ padding: '0' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.875rem 1rem' }}>Patient / MRN</th>
                <th style={{ padding: '0.875rem 1rem' }}>Payer & Plan</th>
                <th style={{ padding: '0.875rem 1rem' }}>Member ID / Policy #</th>
                <th style={{ padding: '0.875rem 1rem' }}>Subscriber</th>
                <th style={{ padding: '0.875rem 1rem' }}>Priority</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Coverage</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((policy) => (
                <tr key={policy.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{policy.patientName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{policy.patientMrn}</div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ fontWeight: 500 }}>{policy.payerName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#2563eb' }}>{policy.planName}</div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div><strong>Mem:</strong> {policy.memberId}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Pol: {policy.policyNumber}</div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div>{policy.subscriberName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{policy.subscriberRelationship}</div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <Badge variant={policy.priority === 'PRIMARY' ? 'primary' : 'neutral'}>
                      {policy.priority}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                    <Badge variant={policy.coverageStatus === 'ACTIVE' ? 'success' : 'warning'}>
                      {policy.coverageStatus}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                      <Button variant="outline" size="sm" onClick={() => onOpenVerifyEligibility(policy)}>
                        270 Check
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onOpenCreateAuth(policy)}>
                        Pre-Auth
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => onOpenCreateClaim(policy)}>
                        Claim
                      </Button>
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
