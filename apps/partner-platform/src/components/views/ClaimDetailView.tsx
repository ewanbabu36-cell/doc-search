import React from 'react';
import {
  Card,
  Button,
  Badge
} from '@docsearch/ui-kit';
import type {
  InsuranceClaimDto,
  InsuranceClaimSubmissionDto,
  InsuranceClaimAdjudicationDto,
  InsuranceClaimDenialDto,
  InsuranceClaimAppealDto,
  InsuranceSettlementDto
} from '@docsearch/api-contracts';

export interface ClaimDetailViewProps {
  claim: InsuranceClaimDto | null;
  submissions: InsuranceClaimSubmissionDto[];
  adjudications: InsuranceClaimAdjudicationDto[];
  denials: InsuranceClaimDenialDto[];
  appeals: InsuranceClaimAppealDto[];
  settlements: InsuranceSettlementDto[];
  onBackToDirectory: () => void;
  onOpenValidateClaim: () => void;
  onOpenSubmitClaim: () => void;
  onOpenAdjudicateClaim: () => void;
  onOpenRecordDenial: () => void;
  onOpenCreateAppeal: () => void;
  onOpenRecordSettlement: () => void;
  onOpenAmendClaim: () => void;
  onOpenCancelClaim: () => void;
}

export const ClaimDetailView: React.FC<ClaimDetailViewProps> = ({
  claim,
  submissions,
  adjudications,
  denials,
  appeals,
  settlements,
  onBackToDirectory,
  onOpenValidateClaim,
  onOpenSubmitClaim,
  onOpenAdjudicateClaim,
  onOpenRecordDenial,
  onOpenCreateAppeal,
  onOpenRecordSettlement,
  onOpenAmendClaim,
  onOpenCancelClaim
}) => {
  if (!claim) {
    return (
      <Card style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#64748b' }}>No insurance claim selected.</p>
        <Button variant="outline" onClick={onBackToDirectory}>
          Back to Claims Directory
        </Button>
      </Card>
    );
  }

  const claimSubmissions = submissions.filter((s) => s.claimId === claim.id);
  const claimAdjudications = adjudications.filter((a) => a.claimId === claim.id);
  const claimDenials = denials.filter((d) => d.claimId === claim.id);
  const claimAppeals = appeals.filter((ap) => ap.claimId === claim.id);
  const claimSettlements = settlements.filter((st) => st.claimId === claim.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="outline" size="sm" onClick={onBackToDirectory}>
            ← Back
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>
                Claim {claim.claimNumber}
              </h2>
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
            </div>
            <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
              {claim.payerName} ({claim.payerCode}) • Created on {new Date(claim.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {claim.status === 'READY_FOR_SUBMISSION' && (
            <>
              <Button variant="outline" onClick={onOpenValidateClaim}>
                🔍 Scrubber Check
              </Button>
              <Button variant="primary" onClick={onOpenSubmitClaim}>
                Transmit to Payer
              </Button>
            </>
          )}

          {claim.status === 'SUBMITTED' && (
            <>
              <Button variant="danger" onClick={onOpenRecordDenial}>
                Record Denial
              </Button>
              <Button variant="primary" onClick={onOpenAdjudicateClaim}>
                Record Adjudication
              </Button>
            </>
          )}

          {claim.status === 'DENIED' && claimDenials.length > 0 && (
            <Button variant="primary" onClick={onOpenCreateAppeal}>
              Lodge Dispute Appeal
            </Button>
          )}

          {claim.status === 'APPROVED' && (
            <Button variant="primary" onClick={onOpenRecordSettlement}>
              Record EFT Settlement
            </Button>
          )}

          {claim.status !== 'SETTLED' && claim.status !== 'CLOSED' && (
            <>
              <Button variant="outline" onClick={onOpenAmendClaim}>
                Amend Dossier
              </Button>
              <Button variant="danger" onClick={onOpenCancelClaim}>
                Cancel Claim
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Claim Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <Card style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Patient Information</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginTop: '0.2rem' }}>
            {claim.patientName}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            MRN: {claim.patientMrn}
          </div>
        </Card>

        <Card style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Policy & Member ID</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginTop: '0.2rem' }}>
            {claim.policyNumber}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#2563eb' }}>
            {claim.payerName}
          </div>
        </Card>

        <Card style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Billed vs Approved</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginTop: '0.2rem' }}>
            ${claim.totalClaimAmount.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#16a34a' }}>
            Approved: ${claim.approvedAmount.toFixed(2)}
          </div>
        </Card>

        <Card style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Patient Responsibility</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#d97706', marginTop: '0.2rem' }}>
            ${claim.patientResponsibility.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Adjustment: ${claim.adjustmentAmount.toFixed(2)}
          </div>
        </Card>
      </div>

      {/* Itemized Claim Services */}
      <Card style={{ padding: '1.25rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
          Itemized Billable Services & Adjudication Breakdown
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>Code</th>
                <th style={{ padding: '0.5rem' }}>Description</th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Unit Price</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Billed</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Approved</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Patient Due</th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {claim.items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>{item.serviceCode}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>{item.serviceDescription}</td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>${item.unitPrice.toFixed(2)}</td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: 600 }}>
                    ${item.billedAmount.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>
                    ${item.approvedAmount.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', color: '#d97706' }}>
                    ${item.patientResponsibility.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                    <Badge variant={item.status === 'APPROVED' ? 'success' : item.status === 'DENIED' ? 'danger' : 'primary'}>
                      {item.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Two-Column Audit / Adjudication Ledger */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left: Submissions & Adjudication Logs */}
        <Card style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
            EDI Transmissions & Adjudication Advice
          </h3>
          {claimSubmissions.length === 0 && claimAdjudications.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No electronic transmissions recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              {claimSubmissions.map((sub) => (
                <div key={sub.id} style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span>{sub.submissionNumber}</span>
                    <Badge variant="primary">{sub.transmissionStatus}</Badge>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Ack: {sub.acknowledgementReference || 'Pending'} • {sub.payerAcknowledgement}
                  </div>
                </div>
              ))}
              {claimAdjudications.map((adj) => (
                <div key={adj.id} style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#166534' }}>
                    <span>EOB: {adj.adjudicationReference}</span>
                    <Badge variant="success">{adj.adjudicationStatus}</Badge>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '0.2rem' }}>
                    Approved: ${adj.approvedAmount.toFixed(2)} | Denied: ${adj.deniedAmount.toFixed(2)}
                  </div>
                  {adj.payerRemarks && (
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.2rem', fontStyle: 'italic' }}>
                      &ldquo;{adj.payerRemarks}&rdquo;
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Right: Denials, Appeals & Settlements */}
        <Card style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
            Denials, Appeals & Bank Settlements
          </h3>
          {claimDenials.length === 0 && claimAppeals.length === 0 && claimSettlements.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No denial or settlement records attached.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              {claimDenials.map((den) => (
                <div key={den.id} style={{ padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#991b1b' }}>
                    <span>Denial: {den.denialNumber} ({den.denialCode})</span>
                    <span>${den.deniedAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#991b1b', marginTop: '0.2rem' }}>
                    {den.denialReason}
                  </div>
                </div>
              ))}
              {claimAppeals.map((apl) => (
                <div key={apl.id} style={{ padding: '0.75rem', backgroundColor: '#fffbeb', borderRadius: '6px', border: '1px solid #fef3c7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#92400e' }}>
                    <span>Appeal: {apl.appealNumber} (L{apl.appealLevel})</span>
                    <Badge variant="warning">{apl.status}</Badge>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '0.2rem' }}>
                    Reason: {apl.appealReason}
                  </div>
                </div>
              ))}
              {claimSettlements.map((stl) => (
                <div key={stl.id} style={{ padding: '0.75rem', backgroundColor: '#f0f9ff', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#075985' }}>
                    <span>EFT: {stl.settlementReference}</span>
                    <span>${stl.settlementAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#075985', marginTop: '0.2rem' }}>
                    Bank Reference: {stl.paymentReference || 'Direct Deposit'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
