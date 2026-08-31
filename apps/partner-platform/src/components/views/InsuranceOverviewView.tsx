import React from 'react';
import {
  Card,
  Badge,
  Button
} from '@docsearch/ui-kit';
import type {
  InsuranceOverviewMetricsDto,
  InsuranceClaimDto,
  InsuranceAuthorizationDto,
  InsuranceEligibilityCheckDto
} from '@docsearch/api-contracts';

export interface InsuranceOverviewViewProps {
  metrics: InsuranceOverviewMetricsDto;
  claims: InsuranceClaimDto[];
  authorizations: InsuranceAuthorizationDto[];
  eligibilityChecks: InsuranceEligibilityCheckDto[];
  onOpenCreateClaim: () => void;
  onOpenCreatePayer: () => void;
  onOpenRegisterPolicy: () => void;
  onOpenCreateAuth: () => void;
  onSelectClaim: (claimId: string) => void;
  onOpenTab: (tabKey: string) => void;
}

export const InsuranceOverviewView: React.FC<InsuranceOverviewViewProps> = ({
  metrics,
  claims,
  authorizations,
  eligibilityChecks,
  onOpenCreateClaim,
  onOpenCreatePayer,
  onOpenRegisterPolicy,
  onOpenCreateAuth,
  onSelectClaim,
  onOpenTab
}) => {
  const recentClaims = claims.slice(0, 5);
  const pendingAuths = authorizations.filter((a) => a.status === 'REQUESTED' || a.status === 'PENDING').slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Quick Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            Insurance & Claims Command Center
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Third-party payer administration, real-time eligibility (270/271), pre-authorizations, EDI 837 claim scrubber & settlement reconciliations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={onOpenCreatePayer}>
            + Onboard Payer / TPA
          </Button>
          <Button variant="outline" onClick={onOpenRegisterPolicy}>
            + Enroll Patient Policy
          </Button>
          <Button variant="outline" onClick={onOpenCreateAuth}>
            + Request Pre-Auth
          </Button>
          <Button variant="primary" onClick={onOpenCreateClaim}>
            + Generate Claim
          </Button>
        </div>
      </div>

      {/* KPI Metrics Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <Card style={{ padding: '1.25rem', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Active Insured Patients
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', marginTop: '0.25rem' }}>
            {metrics.activeInsuredPatients}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem' }}>
            ● {metrics.eligibilityChecksToday} 270 queries today
          </div>
        </Card>

        <Card style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Pre-Auths Pending
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#d97706', marginTop: '0.25rem' }}>
            {metrics.authorizationsPending}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Awaiting medical board review
          </div>
        </Card>

        <Card style={{ padding: '1.25rem', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Claims in Pipeline
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#7c3aed', marginTop: '0.25rem' }}>
            {metrics.claimsReadyForSubmission + metrics.claimsSubmitted + metrics.claimsInAdjudication}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            {metrics.claimsReadyForSubmission} ready, {metrics.claimsSubmitted} submitted
          </div>
        </Card>

        <Card style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Approval Rate / Clean Claims
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#16a34a', marginTop: '0.25rem' }}>
            {metrics.approvalRatePercentage}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Denial rate: {metrics.denialRatePercentage}% ({metrics.activeAppealsCount} in appeal)
          </div>
        </Card>

        <Card style={{ padding: '1.25rem', borderLeft: '4px solid #06b6d4' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Payer Receivables
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0891b2', marginTop: '0.25rem' }}>
            ${metrics.outstandingPayerReceivables.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Avg days to pay: {metrics.avgAdjudicationDays}d
          </div>
        </Card>
      </div>

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: Recent Claims Stream */}
        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
              Recent Insurance Claims Stream
            </h3>
            <Button variant="outline" size="sm" onClick={() => onOpenTab('claims')}>
              View All Claims ({claims.length})
            </Button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Claim #</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Patient / MRN</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Payer</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Total Claim</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Approved</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentClaims.map((claim) => (
                  <tr key={claim.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#2563eb' }}>
                      {claim.claimNumber}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <div>{claim.patientName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{claim.patientMrn}</div>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{claim.payerName}</td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 600 }}>
                      ${claim.totalClaimAmount.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>
                      ${claim.approvedAmount.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
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
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      <Button variant="outline" size="sm" onClick={() => onSelectClaim(claim.id)}>
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right Column: Pre-Auth Alerts & Quick Checks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                Pre-Authorizations Pending
              </h3>
              <Button variant="outline" size="sm" onClick={() => onOpenTab('authorizations')}>
                All ({authorizations.length})
              </Button>
            </div>

            {pendingAuths.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', padding: '1rem' }}>
                Zero pending pre-authorizations.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pendingAuths.map((auth) => (
                  <div
                    key={auth.id}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span>{auth.patientName}</span>
                      <span style={{ color: '#d97706' }}>${auth.requestedAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                      {auth.requestedServices}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#2563eb', marginTop: '0.2rem' }}>
                      {auth.payerName} • {auth.authorizationNumber}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card style={{ padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
              Recent Real-Time Eligibility Inquiries
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              {eligibilityChecks.slice(0, 3).map((chk) => (
                <div key={chk.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{chk.patientName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{chk.payerName}</div>
                  </div>
                  <Badge variant={chk.eligibilityStatus === 'ELIGIBLE' ? 'success' : 'warning'}>
                    {chk.eligibilityStatus}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
