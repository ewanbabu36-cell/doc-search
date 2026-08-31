import React from 'react';
import {
  Card
} from '@docsearch/ui-kit';
import type {
  InsuranceClaimDto,
  InsuranceSettlementDto,
  InsuranceOverviewMetricsDto
} from '@docsearch/api-contracts';

export interface RevenueCycleInsuranceViewProps {
  metrics: InsuranceOverviewMetricsDto;
  claims: InsuranceClaimDto[];
  settlements: InsuranceSettlementDto[];
}

export const RevenueCycleInsuranceView: React.FC<RevenueCycleInsuranceViewProps> = ({
  metrics,
  claims,
  settlements
}) => {
  const settledClaimsCount = claims.filter((c) => c.status === 'SETTLED').length;
  const approvedClaimsCount = claims.filter((c) => c.status === 'APPROVED').length;
  const deniedClaimsCount = claims.filter((c) => c.status === 'DENIED').length;
  const totalSettledAmount = settlements.reduce((sum, s) => sum + s.settlementAmount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
          Revenue Cycle Management (RCM) & Insurance Clearinghouse Integration
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
          Bridge between Commercial Billing Invoices and Third-Party Payer Claims & Remittance Banking.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <Card style={{ padding: '1.25rem', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Total Payer Claims Volume</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', marginTop: '0.25rem' }}>
            ${metrics.totalPayerVolumeUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            {claims.length} total institutional dossiers
          </div>
        </Card>

        <Card style={{ padding: '1.25rem', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>EFT Remittance Settled</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#16a34a', marginTop: '0.25rem' }}>
            ${totalSettledAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem' }}>
            {settledClaimsCount} claims fully settled
          </div>
        </Card>

        <Card style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Approved Awaiting Settlement</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#d97706', marginTop: '0.25rem' }}>
            ${metrics.outstandingPayerReceivables.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            {approvedClaimsCount} claims in payment queue
          </div>
        </Card>

        <Card style={{ padding: '1.25rem', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Denied / In Dispute</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#dc2626', marginTop: '0.25rem' }}>
            {deniedClaimsCount} Claims
          </div>
          <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}>
            {metrics.activeAppealsCount} active appeals under review
          </div>
        </Card>
      </div>

      <Card style={{ padding: '1.25rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 600, color: '#0f172a' }}>
          Institutional Revenue Cycle Workflow Architecture
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', textAlign: 'center' }}>
          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🏥</div>
            <strong style={{ fontSize: '0.9rem' }}>1. Point-of-Care</strong>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Encounter, Consultation, Lab & Pharmacy charge capture
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>💳</div>
            <strong style={{ fontSize: '0.9rem' }}>2. 270/271 Clearance</strong>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Eligibility, Copay & Pre-authorization verified
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📑</div>
            <strong style={{ fontSize: '0.9rem' }}>3. EDI 837 Scrubber</strong>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              ICD-10 / CPT validation and automated clearinghouse transmission
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>⚖️</div>
            <strong style={{ fontSize: '0.9rem' }}>4. ERA 835 Remittance</strong>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Payer EOB adjudication, copay allocation & denial appeals
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🏦</div>
            <strong style={{ fontSize: '0.9rem' }}>5. Bank Settlement</strong>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              EFT deposit voucher matching and audited zero-variance reconciliation
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
