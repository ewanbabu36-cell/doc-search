import React, { useState, useEffect } from 'react';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';
import type { UpdateWardRequest, InpatientWardDto, InpatientCareLevel } from '@docsearch/api-contracts';

export interface EditWardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: UpdateWardRequest) => Promise<void>;
  ward: InpatientWardDto | null;
  tenantId: string;
}

export const EditWardDialog: React.FC<EditWardDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  ward,
  tenantId
}) => {
  const [wardName, setWardName] = useState('');
  const [careLevel, setCareLevel] = useState<InpatientCareLevel>('TERTIARY_CARE');
  const [nursingStationName, setNursingStationName] = useState('');
  const [isolationCapable, setIsolationCapable] = useState(false);
  const [ventilatorCapable, setVentilatorCapable] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ward) {
      setWardName(ward.wardName);
      setCareLevel(ward.careLevel);
      setNursingStationName(ward.nursingStationName);
      setIsolationCapable(ward.isolationCapable);
      setVentilatorCapable(ward.ventilatorCapable);
      setIsActive(ward.isActive);
    }
  }, [ward]);

  if (!ward) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        wardId: ward.id,
        tenantId,
        wardName,
        careLevel,
        nursingStationName,
        isolationCapable,
        ventilatorCapable,
        isActive
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update ward');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Edit Ward — ${ward.wardCode}` }>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Ward Name</label>
          <Input value={wardName} onChange={(e) => setWardName(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Care Level</label>
          <Select value={careLevel} onChange={(e) => setCareLevel(e.target.value as InpatientCareLevel)} options={[
            { value: 'LEVEL_1_OBSERVATION', label: 'Level 1 Observation' },
            { value: 'LEVEL_2_STEPDOWN', label: 'Level 2 Stepdown' },
            { value: 'LEVEL_3_ICU', label: 'Level 3 Intensive Care' },
            { value: 'TERTIARY_CARE', label: 'Tertiary Medical/Surgical' }
          ]} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Nursing Station Name</label>
          <Input value={nursingStationName} onChange={(e) => setNursingStationName(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <input type="checkbox" checked={isolationCapable} onChange={(e) => setIsolationCapable(e.target.checked)} />
            Isolation Capable
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <input type="checkbox" checked={ventilatorCapable} onChange={(e) => setVentilatorCapable(e.target.checked)} />
            Ventilator Capable
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active Ward Status
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </form>
    </Dialog>
  );
};