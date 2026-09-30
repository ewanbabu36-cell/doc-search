import React, { useState } from 'react';
import type {
  PatientDto,
  EmergencyRelationship,
  AddEmergencyContactRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';
import { AuditJustificationField } from '../common/AuditJustificationField.js';

export interface AddEmergencyContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientDto;
  actorId: string;
  actorRole: string;
  onAddEmergencyContact: (req: AddEmergencyContactRequest) => Promise<void>;
}

export const AddEmergencyContactDialog: React.FC<AddEmergencyContactDialogProps> = ({
  isOpen,
  onClose,
  patient,
  actorId,
  actorRole,
  onAddEmergencyContact
}) => {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState<EmergencyRelationship>('SPOUSE');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [address, setAddress] = useState('');
  const [reason, setReason] = useState('Primary emergency contact recorded for clinical escalation.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Emergency contact name is required.');
      return;
    }
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      setError('A valid 10-digit Indian mobile number is required (starts with 6, 7, 8, or 9).');
      return;
    }
    if (altPhone && altPhone.trim() && (altPhone.trim().length !== 10 || !/^[6-9]/.test(altPhone.trim()))) {
      setError('Alternate phone must be a valid 10-digit Indian mobile number.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onAddEmergencyContact({
        actorId,
        actorRole,
        tenantId: patient.tenantId,
        partnerId: patient.partnerId,
        patientId: patient.id,
        contactName: name,
        relationship: relation,
        primaryPhone: phone,
        alternatePhone: altPhone || undefined,
        address: address || undefined,
        isPrimary: true,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add emergency contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Emergency Contact: ${patient.fullName}`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting} disabled={isSubmitting}>
            Save Emergency Contact
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Audited Emergency Contact Association">
          Emergency contacts are accessible during urgent hospital admissions, clinical crisis notifications, and patient triage escalation.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Full Contact Name *
          </label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Relationship to Patient *
            </label>
            <Select
              value={relation}
              onChange={(e) => setRelation(e.target.value as EmergencyRelationship)}
              options={[
                { value: 'SPOUSE', label: 'Spouse' },
                { value: 'PARENT', label: 'Parent' },
                { value: 'SIBLING', label: 'Sibling' },
                { value: 'CHILD', label: 'Child' },
                { value: 'GUARDIAN', label: 'Guardian / Caregiver' },
                { value: 'FRIEND', label: 'Friend' },
                { value: 'OTHER', label: 'Other' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Primary Phone (10-Digit Mobile) *
            </label>
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => {
                let digits = e.target.value.replace(/\D/g, '');
                if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
                else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
                setPhone(digits.slice(0, 10));
              }}
              required
              leftElement={<span style={{ fontWeight: 800, color: 'var(--ds-color-primary, #38BDF8)', fontSize: '0.75rem' }}>+91</span>}
              style={{ paddingLeft: '44px', fontFamily: 'monospace' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Alternate Phone (10-Digit Mobile)
            </label>
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="98765 43210"
              value={altPhone}
              onChange={(e) => {
                let digits = e.target.value.replace(/\D/g, '');
                if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
                else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
                setAltPhone(digits.slice(0, 10));
              }}
              leftElement={<span style={{ fontWeight: 800, color: 'var(--ds-color-primary, #38BDF8)', fontSize: '0.75rem' }}>+91</span>}
              style={{ paddingLeft: '44px', fontFamily: 'monospace' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Residential / Work Address
          </label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>

        <AuditJustificationField
          label="Audit Reason"
          value={reason}
          onChange={setReason}
          defaultJustification="Primary emergency contact recorded for clinical escalation."
        />
      </form>
    </Dialog>
  );
};
