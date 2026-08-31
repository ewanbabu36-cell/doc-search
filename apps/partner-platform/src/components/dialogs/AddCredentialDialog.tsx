import React, { useState } from 'react';
import type {
  OperationalStaffDto,
  StaffCredentialType,
  AddStaffCredentialRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface AddCredentialDialogProps {
  isOpen: boolean;
  onClose: () => void;
  staff: OperationalStaffDto;
  actorId: string;
  actorRole: string;
  onAddCredential: (req: AddStaffCredentialRequest) => Promise<void>;
}

export const AddCredentialDialog: React.FC<AddCredentialDialogProps> = ({
  isOpen,
  onClose,
  staff,
  actorId,
  actorRole,
  onAddCredential
}) => {
  const [credentialType, setCredentialType] = useState<StaffCredentialType>('MEDICAL_LICENSE');
  const [regNumber, setRegNumber] = useState('');
  const [authority, setAuthority] = useState('Medical Board of California');
  const [issueDate, setIssueDate] = useState('2024-01-01');
  const [expiryDate, setExpiryDate] = useState('2027-01-01');
  const [docRef, setDocRef] = useState('');
  const [reason, setReason] = useState('Submitting professional clinical license');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNumber || regNumber.trim().length < 2) {
      setError('Registration number is required.');
      return;
    }
    if (!authority || authority.trim().length < 2) {
      setError('Issuing authority is required.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onAddCredential({
        actorId,
        actorRole,
        tenantId: staff.tenantId,
        partnerId: staff.partnerId,
        organizationId: staff.organizationId,
        staffId: staff.id,
        credentialType,
        registrationNumber: regNumber,
        issuingAuthority: authority,
        issueDate: new Date(issueDate).toISOString(),
        expiryDate: new Date(expiryDate).toISOString(),
        documentReference: docRef || undefined,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add credential');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Professional Credential: ${staff.fullName}`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Submit Credential
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Audited Credential Filing">
          New credentials enter a <code>PENDING</code> state until verified by a designated credentialing officer.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Credential Classification *
          </label>
          <Select
            value={credentialType}
            onChange={(e) => setCredentialType(e.target.value as StaffCredentialType)}
            options={[
              { value: 'MEDICAL_LICENSE', label: 'State Medical License (Physician / Surgeon)' },
              { value: 'SPECIALTY_BOARD_CERTIFICATION', label: 'Specialty Board Certification (ABMS / AOBS)' },
              { value: 'NURSING_LICENSE', label: 'Registered Nursing License (RN / APRN)' },
              { value: 'PHARMACY_LICENSE', label: 'Registered Pharmacist License (RPh)' },
              { value: 'LAB_TECH_CERTIFICATE', label: 'Medical Laboratory Scientist (ASCP MLS)' },
              { value: 'BLS_ACLS_CERTIFICATE', label: 'Life Support Certification (BLS / ACLS)' },
              { value: 'DEA_REGISTRATION', label: 'DEA Controlled Substance Registration' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Registration / License Reference Number *
          </label>
          <Input
            value={regNumber}
            onChange={(e) => setRegNumber(e.target.value)}
            placeholder="e.g. MED-CA-2026-8812 — Sample Ref"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Issuing Authority / Board *
          </label>
          <Input
            value={authority}
            onChange={(e) => setAuthority(e.target.value)}
            placeholder="e.g. Medical Board of California"
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Issue Date *
            </label>
            <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Expiry Date *
            </label>
            <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Document Evidence Reference (Optional)
          </label>
          <Input
            value={docRef}
            onChange={(e) => setDocRef(e.target.value)}
            placeholder="e.g. docsearch://credentials/apex/license-scan.pdf"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Primary medical license submitted for clinical privileges"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
