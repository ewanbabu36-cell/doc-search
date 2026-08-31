import React, { useState } from 'react';
import type {
  PatientDto,
  PatientConsentType,
  AddPatientConsentRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface AddConsentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientDto;
  actorId: string;
  actorRole: string;
  onAddConsent: (req: AddPatientConsentRequest) => Promise<void>;
}

export const AddConsentDialog: React.FC<AddConsentDialogProps> = ({
  isOpen,
  onClose,
  patient,
  actorId,
  actorRole,
  onAddConsent
}) => {
  const [consentType, setConsentType] = useState<PatientConsentType>('GENERAL_REGISTRATION');
  const [auditRef, setAuditRef] = useState(`CNS-DOC-${Math.floor(100 + Math.random() * 900)}`);
  const [reason, setReason] = useState('Patient signed electronic consent directive');
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
      await onAddConsent({
        actorId,
        actorRole,
        tenantId: patient.tenantId,
        partnerId: patient.partnerId,
        organizationId: patient.organizationId,
        patientId: patient.id,
        consentType,
        consentStatus: 'GRANTED',
        auditReference: auditRef || undefined,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record consent');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Patient Consent: ${patient.fullName}`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Record Granted Consent
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Audited Consent Directives">
          Records legally binding patient authorizations for clinical care, digital communications, telehealth encounters, and health data exchange.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Consent Directive Classification *
          </label>
          <Select
            value={consentType}
            onChange={(e) => setConsentType(e.target.value as PatientConsentType)}
            options={[
              { value: 'GENERAL_REGISTRATION', label: 'General Treatment & Clinic Registration Consent' },
              { value: 'COMMUNICATION_SMS_EMAIL', label: 'Digital Communication Consent (SMS, Email, Reminders)' },
              { value: 'DATA_SHARING_HIE', label: 'Health Information Exchange (HIE) Data Sharing Consent' },
              { value: 'TELEHEALTH_CONSENT', label: 'Virtual Telehealth Encounter Consent' },
              { value: 'TREATMENT_DISCLOSURE', label: 'Medical Treatment & Procedure Disclosure Consent' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Physical / Electronic Document Reference *
          </label>
          <Input value={auditRef} onChange={(e) => setAuditRef(e.target.value)} required />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Patient executed signed HIPAA treatment authorization form"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
