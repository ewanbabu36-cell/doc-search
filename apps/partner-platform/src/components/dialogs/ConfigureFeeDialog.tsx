import React, { useState } from 'react';
import type {
  ConsultationType,
  CreateConsultationFeeRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface ConfigureFeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | undefined;
  actorId: string;
  actorRole: string;
  specializations: { specialtyCode: string; specialtyName: string }[];
  doctors: { id: string; fullName: string; doctorCode: string }[];
  onCreateFee: (req: CreateConsultationFeeRequest) => Promise<void>;
}

export const ConfigureFeeDialog: React.FC<ConfigureFeeDialogProps> = ({
  isOpen,
  onClose,
  tenantId,
  partnerId,
  organizationId,
  branchId,
  actorId,
  actorRole,
  specializations,
  doctors,
  onCreateFee
}) => {
  const [specialtyCode, setSpecialtyCode] = useState(specializations[0]?.specialtyCode ?? 'SPEC-CARDIO');
  const [doctorId, setDoctorId] = useState<string>('');
  const [consultationType, setConsultationType] = useState<ConsultationType>('NEW_PATIENT');
  const [baseFee, setBaseFee] = useState(120.0);
  const [validityDays, setValidityDays] = useState(14);
  const [reason, setReason] = useState('Consultation fee matrix schedule definition');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (baseFee < 0) {
      setError('Base fee amount must be non-negative.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onCreateFee({
        actorId,
        actorRole,
        tenantId,
        partnerId,
        organizationId,
        branchId: branchId || undefined,
        doctorId: doctorId ? doctorId : undefined,
        specialtyCode: specialtyCode || undefined,
        consultationType,
        currency: 'USD',
        baseFeeAmount: baseFee,
        followUpValidityDays: validityDays,
        effectiveDate: new Date().toISOString(),
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to configure fee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Consultation Fee Matrix"
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Save Fee Configuration
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Audited Financial Fee Schedule">
          Consultation fees dynamically resolve at the Doctor, Specialty, Branch, or Organization level during invoice generation.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Specialty Scope *
          </label>
          <Select
            value={specialtyCode}
            onChange={(e) => setSpecialtyCode(e.target.value)}
            options={specializations.map((s) => ({
              value: s.specialtyCode,
              label: `${s.specialtyName} (${s.specialtyCode})`
            }))}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Doctor Scope (Optional — Specific Doctor Override)
          </label>
          <Select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            options={[
              { value: '', label: '— All Doctors in Specialty / Branch —' },
              ...doctors.map((d) => ({
                value: d.id,
                label: `${d.fullName} (${d.doctorCode})`
              }))
            ]}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Consultation Type *
            </label>
            <Select
              value={consultationType}
              onChange={(e) => setConsultationType(e.target.value as ConsultationType)}
              options={[
                { value: 'NEW_PATIENT', label: 'New Patient OPD Consultation' },
                { value: 'FOLLOW_UP', label: 'Follow-Up Consultation' },
                { value: 'TELECONSULTATION', label: 'Virtual Teleconsultation' },
                { value: 'EMERGENCY', label: 'Emergency Walk-In Consultation' },
                { value: 'SECOND_OPINION', label: 'Specialist Second Opinion' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Base Fee Amount (USD $) *
            </label>
            <Input
              type="number"
              value={baseFee}
              onChange={(e) => setBaseFee(parseFloat(e.target.value) || 0)}
              required
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Follow-Up Validity (Days)
          </label>
          <Input
            type="number"
            value={validityDays}
            onChange={(e) => setValidityDays(parseInt(e.target.value, 10) || 14)}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Set baseline fee for new patient cardiology consults"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
