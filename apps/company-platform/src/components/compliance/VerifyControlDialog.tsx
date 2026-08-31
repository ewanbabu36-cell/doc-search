import React, { useState } from 'react';
import type { ComplianceControlDto, VerificationStatus } from '@docsearch/api-contracts';
import { Dialog, Button, FormField, Select, Badge, Alert } from '@docsearch/ui-kit';

export interface VerifyControlDialogProps {
  isOpen: boolean;
  onClose: () => void;
  control: ComplianceControlDto;
  onVerify: (
    controlId: string,
    verificationType: string,
    status: VerificationStatus,
    evidenceReference: string,
    findings: string,
    reason: string
  ) => Promise<void>;
}

export const VerifyControlDialog: React.FC<VerifyControlDialogProps> = ({
  isOpen,
  onClose,
  control,
  onVerify
}) => {
  const [status, setStatus] = useState<VerificationStatus>('VERIFIED');
  const [verificationType, setVerificationType] = useState('TECHNICAL_EVALUATION');
  const [evidenceReference, setEvidenceReference] = useState('');
  const [findings, setFindings] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceReference.trim() || !findings.trim() || !reason.trim()) {
      setError('Evidence reference, audit findings, and mandatory justification reason are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onVerify(
        control.id,
        verificationType,
        status,
        evidenceReference.trim(),
        findings.trim(),
        reason.trim()
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Control verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Compliance Control Verification"
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Record Verification
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Formal Verification Record">
          Recording a compliance verification updates the control posture and logs an immutable entry to <code>core.audit_events</code>.
        </Alert>

        {error && (
          <Alert type="error" title="Validation Error">
            {error}
          </Alert>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--ds-color-text-muted)' }}>Target Control:</span>
          <code style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700' }}>{control.controlCode}</code>
          <Badge variant="neutral">{control.controlCategory}</Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <FormField label="Verification Status" required>
            <Select
              options={[
                { label: 'Verified / Valid', value: 'VERIFIED' },
                { label: 'Requires Review', value: 'REQUIRES_REVIEW' },
                { label: 'Failed / Evidence Deficient', value: 'FAILED' }
              ]}
              value={status}
              onChange={(e) => setStatus(e.target.value as VerificationStatus)}
            />
          </FormField>

          <FormField label="Verification Method" required>
            <Select
              options={[
                { label: 'Technical Evaluation', value: 'TECHNICAL_EVALUATION' },
                { label: 'Formal Evidence Audit', value: 'FORMAL_EVIDENCE_AUDIT' },
                { label: 'Automated CI/CD Validation', value: 'AUTOMATED_CI_VALIDATION' },
                { label: 'Third-Party Attestation', value: 'THIRD_PARTY_ATTESTATION' }
              ]}
              value={verificationType}
              onChange={(e) => setVerificationType(e.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Evidence Artifact Reference" required helperText="e.g. DOC-REF-EVAL-2026 or AUDIT-SIG-001">
          <input
            type="text"
            required
            value={evidenceReference}
            onChange={(e) => setEvidenceReference(e.target.value)}
            placeholder="e.g. AUDIT-SIG-SOC2-Q2-2026"
            className="ds-interactive"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '0.875rem',
              fontFamily: 'var(--ds-font-mono)',
              color: 'var(--ds-color-text-primary)',
              backgroundColor: 'var(--ds-color-surface)',
              border: '1px solid var(--ds-color-border)',
              borderRadius: '6px'
            }}
          />
        </FormField>

        <FormField label="Verification Findings & Notes" required>
          <textarea
            required
            rows={3}
            value={findings}
            onChange={(e) => setFindings(e.target.value)}
            placeholder="Document technical assertions, sample size, or test results..."
            className="ds-interactive"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              color: 'var(--ds-color-text-primary)',
              backgroundColor: 'var(--ds-color-surface)',
              border: '1px solid var(--ds-color-border)',
              borderRadius: '6px',
              resize: 'vertical'
            }}
          />
        </FormField>

        <FormField label="Governance Justification Reason" required helperText="Mandatory reason written to audit trail.">
          <input
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Annual control testing completed with zero non-conformances."
            className="ds-interactive"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              color: 'var(--ds-color-text-primary)',
              backgroundColor: 'var(--ds-color-surface)',
              border: '1px solid var(--ds-color-border)',
              borderRadius: '6px'
            }}
          />
        </FormField>
      </form>
    </Dialog>
  );
};
