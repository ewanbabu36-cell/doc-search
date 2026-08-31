import React, { useState } from 'react';
import type {
  PatientDto,
  PatientIdentifierType,
  AddPatientIdentifierRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface AddIdentifierDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientDto;
  actorId: string;
  actorRole: string;
  onAddIdentifier: (req: AddPatientIdentifierRequest) => Promise<void>;
}

export const AddIdentifierDialog: React.FC<AddIdentifierDialogProps> = ({
  isOpen,
  onClose,
  patient,
  actorId,
  actorRole,
  onAddIdentifier
}) => {
  const [identType, setIdentType] = useState<PatientIdentifierType>('DRIVER_LICENSE_REF');
  const [identValue, setIdentValue] = useState('');
  const [authority, setAuthority] = useState('State DMV / Department of Transportation');
  const [reason, setReason] = useState('Attaching verified patient identification document');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identValue || identValue.trim().length < 2) {
      setError('Identifier value is required.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onAddIdentifier({
        actorId,
        actorRole,
        tenantId: patient.tenantId,
        partnerId: patient.partnerId,
        organizationId: patient.organizationId,
        patientId: patient.id,
        identifierType: identType,
        identifierValue: identValue,
        issuingAuthority: authority || undefined,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to attach identifier');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Patient Identifier: ${patient.fullName}`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Attach Identifier
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Audited Identifier Association">
          Identifiers enable rapid patient search and cross-facility MRN resolution while preserving strict privacy controls.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Identifier Type *
          </label>
          <Select
            value={identType}
            onChange={(e) => setIdentType(e.target.value as PatientIdentifierType)}
            options={[
              { value: 'DRIVER_LICENSE_REF', label: 'Driver License Reference' },
              { value: 'NATIONAL_HEALTH_ID', label: 'National Health ID (ABHA / NHS / SSN Ref)' },
              { value: 'PASSPORT_REF', label: 'Passport Reference' },
              { value: 'INSURANCE_MEMBER_ID', label: 'Insurance Member ID' },
              { value: 'EXTERNAL_HOSPITAL_ID', label: 'External Hospital MRN' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Identifier Value / Reference *
          </label>
          <Input
            value={identValue}
            onChange={(e) => setIdentValue(e.target.value)}
            placeholder="e.g. DL-CA-889100-REF"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Issuing Authority / Agency
          </label>
          <Input value={authority} onChange={(e) => setAuthority(e.target.value)} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Scanned and verified physical government ID card"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
