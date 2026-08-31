import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  ValidateClaimRequest,
  InsuranceClaimDto
} from '@docsearch/api-contracts';

export interface ValidateClaimDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: ValidateClaimRequest) => Promise<{ valid: boolean; validationErrors: string[] }>;
  claim: InsuranceClaimDto | null;
  tenantId: string;
}

export const ValidateClaimDialog: React.FC<ValidateClaimDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  claim,
  tenantId
}) => {
  const [justification, setJustification] = useState('Scrubber rules executed ahead of electronic clearinghouse dispatch.');
  const [validationResult, setValidationResult] = useState<{ valid: boolean; validationErrors: string[] } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!claim) return null;

  const handleValidate = async () => {
    setIsValidating(true);
    setError(null);
    try {
      const res = await onSubmit({
        tenantId,
        claimId: claim.id,
        actorId: 'Bob Rivera (Insurance Coordinator)',
        actorRole: 'Insurance Scrubber Engine',
        justification: justification.trim()
      });
      setValidationResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Validation failed.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Pre-Submission Scrubber & Validation — ${claim.claimNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isValidating}>
            Close
          </Button>
          {!validationResult && (
            <Button variant="primary" onClick={handleValidate} disabled={isValidating}>
              {isValidating ? 'Scrubbing...' : 'Run Scrubber Checks'}
            </Button>
          )}
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div><strong>Claim Number:</strong> {claim.claimNumber}</div>
            <div><strong>Patient:</strong> {claim.patientName}</div>
            <div><strong>Payer:</strong> {claim.payerName}</div>
            <div><strong>Policy #:</strong> {claim.policyNumber}</div>
            <div><strong>Total Claim:</strong> ${claim.totalClaimAmount.toFixed(2)}</div>
            <div><strong>ICD-10 Diagnosis:</strong> {claim.primaryDiagnosisCode}</div>
          </div>
        </div>

        {validationResult ? (
          <div>
            {validationResult.valid ? (
              <Alert type="success">
                <strong>Clean Claim Verified:</strong> 0 validation errors found. The claim meets all mandatory ANSI 837 EDI format requirements, policy validity, and clinical ICD-10 linkage rules. It is ready for transmission.
              </Alert>
            ) : (
              <Alert type="error">
                <strong>Scrubber Validation Errors ({validationResult.validationErrors.length}):</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
                  {validationResult.validationErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </Alert>
            )}
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '0.9rem', color: '#475569' }}>
              The claim scrubber executes automated checks including:
            </p>
            <ul style={{ fontSize: '0.85rem', color: '#64748b', paddingLeft: '1.25rem' }}>
              <li>Member policy active dates and priority ordering</li>
              <li>Valid primary ICD-10 coding and service item linkage</li>
              <li>Payer-specific pre-authorization requirements for procedures</li>
              <li>Tariff consistency against institutional fee schedules</li>
            </ul>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Audit Justification
              </label>
              <Input
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Audit scrubber rationale"
              />
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};
