import React, { useState } from 'react';
import type {
  EncounterDto,
  DoctorProfileDto,
  OperationalDepartmentDto,
  ReferralType,
  ReferralUrgency,
  ReferEncounterRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface ReferEncounterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  encounter: EncounterDto;
  departments: OperationalDepartmentDto[];
  doctors: DoctorProfileDto[];
  actorId: string;
  actorRole: string;
  onReferEncounter: (req: ReferEncounterRequest) => Promise<void>;
}

export const ReferEncounterDialog: React.FC<ReferEncounterDialogProps> = ({
  isOpen,
  onClose,
  encounter,
  departments,
  doctors,
  actorId,
  actorRole,
  onReferEncounter
}) => {
  const [referralType, setReferralType] = useState<ReferralType>('INTERNAL_SPECIALIST');
  const [destDeptId, setDestDeptId] = useState(departments[0]?.id ?? '');
  const [destDocId, setDestDocId] = useState(doctors[0]?.id ?? '');
  const [extFacility, setExtFacility] = useState('');
  const [urgency, setUrgency] = useState<ReferralUrgency>('ROUTINE');
  const [clinicalSummary, setClinicalSummary] = useState('');
  const [reason, setReason] = useState('Referred patient for subspecialist consultation');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicalSummary || clinicalSummary.trim().length < 3) {
      setError('Clinical summary and reason for referral are required.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onReferEncounter({
        actorId,
        actorRole,
        tenantId: encounter.tenantId,
        partnerId: encounter.partnerId,
        organizationId: encounter.organizationId,
        encounterId: encounter.id,
        referralType,
        clinicalSummary,
        urgency,
        reason,
        ...(destDeptId ? { destinationDepartmentId: destDeptId } : {}),
        ...(destDocId ? { destinationDoctorId: destDocId } : {}),
        ...(extFacility ? { destinationFacilityName: extFacility } : {})
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refer encounter');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Clinical Referral: ${encounter.patientName} (${encounter.encounterNumber})`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Generate Clinical Referral
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Audited Clinical Referral">
          Generates a tracked referral linking this encounter to an internal department, specialist doctor, or external facility.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Referral Destination Type *
            </label>
            <Select
              value={referralType}
              onChange={(e) => setReferralType(e.target.value as ReferralType)}
              options={[
                { value: 'INTERNAL_SPECIALIST', label: 'Internal Specialist Physician' },
                { value: 'INTERNAL_DEPARTMENT', label: 'Internal Department' },
                { value: 'EXTERNAL_HOSPITAL', label: 'External Hospital / Tertiary Center' },
                { value: 'DIAGNOSTIC_CENTER', label: 'Diagnostic / Imaging Facility' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Referral Urgency *
            </label>
            <Select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as ReferralUrgency)}
              options={[
                { value: 'ROUTINE', label: 'Routine (Within 7 Days)' },
                { value: 'URGENT', label: 'Urgent (Within 24 Hours)' },
                { value: 'STAT', label: 'STAT (Immediate Handover)' }
              ]}
            />
          </div>
        </div>

        {referralType !== 'EXTERNAL_HOSPITAL' && referralType !== 'DIAGNOSTIC_CENTER' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
                Destination Department
              </label>
              <Select
                value={destDeptId}
                onChange={(e) => setDestDeptId(e.target.value)}
                options={departments.map((d) => ({
                  value: d.id,
                  label: d.departmentName
                }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
                Destination Specialist
              </label>
              <Select
                value={destDocId}
                onChange={(e) => setDestDocId(e.target.value)}
                options={[
                  { value: '', label: '— Any Available Specialist —' },
                  ...doctors.map((doc) => ({
                    value: doc.id,
                    label: `${doc.fullName} (${doc.primarySpecialty})`
                  }))
                ]}
              />
            </div>
          </div>
        ) : (
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              External Hospital / Diagnostic Facility Name *
            </label>
            <Input
              value={extFacility}
              onChange={(e) => setExtFacility(e.target.value)}
              placeholder="e.g. University Hospital Advanced Imaging Center"
            />
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Clinical Summary & Reason for Referral *
          </label>
          <Input
            value={clinicalSummary}
            onChange={(e) => setClinicalSummary(e.target.value)}
            placeholder="e.g. Patient presents with exertional angina; refer for formal cardiology echocardiogram"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Escalated clinical referral by attending physician"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
