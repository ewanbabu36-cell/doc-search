import React, { useState } from 'react';
import type { CreateDoctorSpecializationRequest } from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface AddSpecializationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  actorId: string;
  actorRole: string;
  departments: { id: string; departmentName: string }[];
  onCreateSpecialization: (req: CreateDoctorSpecializationRequest) => Promise<void>;
}

export const AddSpecializationDialog: React.FC<AddSpecializationDialogProps> = ({
  isOpen,
  onClose,
  tenantId,
  partnerId,
  organizationId,
  actorId,
  actorRole,
  departments,
  onCreateSpecialization
}) => {
  const [deptId, setDeptId] = useState(departments[0]?.id ?? '');
  const [specCode, setSpecCode] = useState(`SPEC-${Math.floor(100 + Math.random() * 900)}`);
  const [specName, setSpecName] = useState('');
  const [isSurgical, setIsSurgical] = useState(false);
  const [slotDuration, setSlotDuration] = useState(15);
  const [maxPatients, setMaxPatients] = useState(30);
  const [reason, setReason] = useState('Registering clinical medical specialization');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!specName || specName.trim().length < 2) {
      setError('Specialty name is required.');
      return;
    }
    if (!deptId) {
      setError('Department selection is required.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onCreateSpecialization({
        actorId,
        actorRole,
        tenantId,
        partnerId,
        organizationId,
        departmentId: deptId,
        specialtyCode: specCode,
        specialtyName: specName,
        isSurgical,
        defaultSlotDuration: slotDuration,
        maxDailyPatients: maxPatients,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add specialization');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add Medical / Clinical Specialization"
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Add Specialization
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Clinical Specialization Catalog">
          Defines specialty categories, surgical indicators, and default OPD slot timings for clinical encounters.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Specialty Code *
            </label>
            <Input value={specCode} onChange={(e) => setSpecCode(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Specialty Name *
            </label>
            <Input
              value={specName}
              onChange={(e) => setSpecName(e.target.value)}
              placeholder="e.g. Pediatric Cardiology"
              required
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Associated Department *
          </label>
          <Select
            value={deptId}
            onChange={(e) => setDeptId(e.target.value)}
            options={departments.map((d) => ({
              value: d.id,
              label: d.departmentName
            }))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Surgical Specialty
            </label>
            <Select
              value={isSurgical ? 'TRUE' : 'FALSE'}
              onChange={(e) => setIsSurgical(e.target.value === 'TRUE')}
              options={[
                { value: 'FALSE', label: 'No (Medical/Non-Surgical)' },
                { value: 'TRUE', label: 'Yes (Surgical OPD / OR)' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Default Slot (Mins) *
            </label>
            <Input
              type="number"
              value={slotDuration}
              onChange={(e) => setSlotDuration(parseInt(e.target.value, 10) || 15)}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Max Daily Patients *
            </label>
            <Input
              type="number"
              value={maxPatients}
              onChange={(e) => setMaxPatients(parseInt(e.target.value, 10) || 30)}
              required
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Added sub-specialty catalog entry for pediatric cardiology services"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
