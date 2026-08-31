import React, { useState } from 'react';
import type {
  StaffCredentialDto,
  StaffCredentialVerificationStatus,
  VerifyStaffCredentialRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface VerifyCredentialDialogProps {
  isOpen: boolean;
  onClose: () => void;
  credential: StaffCredentialDto;
  actorId: string;
  actorRole: string;
  onVerifyCredential: (req: VerifyStaffCredentialRequest) => Promise<void>;
}

export const VerifyCredentialDialog: React.FC<VerifyCredentialDialogProps> = ({
  isOpen,
  onClose,
  credential,
  actorId,
  actorRole,
  onVerifyCredential
}) => {
  const [verificationStatus, setVerificationStatus] = useState<StaffCredentialVerificationStatus>('VERIFIED');
  const [verificationRef, setVerificationRef] = useState(`ver-board-check-${Math.floor(1000 + Math.random() * 9000)}`);
  const [reason, setReason] = useState('Primary source credentialing verification');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onVerifyCredential({
        actorId,
        actorRole,
        tenantId: credential.tenantId,
        partnerId: credential.partnerId,
        organizationId: credential.organizationId,
        credentialId: credential.id,
        verificationStatus,
        verificationReference: verificationRef,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify credential');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Verify Clinical Credential: ${credential.registrationNumber}`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Record Verification
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="warning" title="Primary Source Verification Governance">
          Verifying a clinical credential approves the staff member's legal qualifications for active clinical encounters and prescriptions.
        </Alert>

        {error && <Alert type="error" title="Verification Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Issuing Board & Classification
          </label>
          <Input
            value={`${credential.credentialType} — ${credential.issuingAuthority}`}
            readOnly
            disabled
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Verification Decision *
          </label>
          <Select
            value={verificationStatus}
            onChange={(e) => setVerificationStatus(e.target.value as StaffCredentialVerificationStatus)}
            options={[
              { value: 'VERIFIED', label: 'Verified (Primary source check confirmed valid)' },
              { value: 'PENDING', label: 'Pending (Under review)' },
              { value: 'EXPIRED', label: 'Expired (Past validity date)' },
              { value: 'REVOKED', label: 'Revoked / Sanctioned (Privileges suspended)' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Verification Reference / Check ID *
          </label>
          <Input value={verificationRef} onChange={(e) => setVerificationRef(e.target.value)} required />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Online primary source license search confirmed active with no sanctions"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
