import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Badge
} from '@docsearch/ui-kit';
import type {
  InsuranceEligibilityCheckDto,
  InsurancePatientPolicyDto
} from '@docsearch/api-contracts';

export interface EligibilityWorkbenchViewProps {
  eligibilityChecks: InsuranceEligibilityCheckDto[];
  policies: InsurancePatientPolicyDto[];
  onOpenVerifyEligibility: (policy: InsurancePatientPolicyDto) => void;
}

export const EligibilityWorkbenchView: React.FC<EligibilityWorkbenchViewProps> = ({
  eligibilityChecks,
  policies,
  onOpenVerifyEligibility
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = eligibilityChecks.filter((e) =>
    e.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.patientMrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.payerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.checkReferenceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Real-Time Eligibility & Benefit Inquiries (ANSI 270/271)
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Instant electronic clearance for member coverage status, deductible consumption, copay rates, and pre-auth triggers.
          </p>
        </div>
        {policies.length > 0 && (
          <Button variant="primary" onClick={() => policies[0] && onOpenVerifyEligibility(policies[0])}>
            + Run Real-Time Query
          </Button>
        )}
      </div>

      <Card style={{ padding: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
          Search Inquiries by Patient, MRN, Payer, or Query Reference
        </label>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="e.g. ELIG-2026, Eleanor Vance, BlueShield"
        />
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {filtered.map((chk) => (
          <Card key={chk.id} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2563eb' }}>
                  {chk.checkReferenceNumber}
                </span>
                <Badge variant={chk.eligibilityStatus === 'ELIGIBLE' ? 'success' : 'warning'}>
                  {chk.eligibilityStatus}
                </Badge>
              </div>

              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 600, color: '#0f172a' }}>
                {chk.patientName}
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                {chk.patientMrn} • {chk.payerName}
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', margin: '0.75rem 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div><strong>Copay:</strong> {chk.copayPercentage}% (${chk.copayAmount.toFixed(2)})</div>
                  <div><strong>Deductible Rem:</strong> ${chk.deductibleRemaining.toFixed(2)}</div>
                  <div><strong>Annual Benefit Rem:</strong> ${chk.annualBenefitRemaining ? chk.annualBenefitRemaining.toFixed(2) : 'Unlimited'}</div>
                  <div><strong>Pre-Auth Req:</strong> {chk.preAuthRequired ? '⚠️ Yes' : 'No'}</div>
                </div>
                {chk.benefitsSummary && (
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.5rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.4rem' }}>
                    {chk.benefitsSummary}
                  </div>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', fontSize: '0.75rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
              <span>Checked by: {chk.checkedBy}</span>
              <span>{new Date(chk.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
