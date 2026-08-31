import React, { useState } from 'react';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';
import type { CreateWardRequest, InpatientUnitDto, InpatientWardType, InpatientCareLevel } from '@docsearch/api-contracts';

export interface CreateWardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: CreateWardRequest) => Promise<void>;
  units: InpatientUnitDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateWardDialog: React.FC<CreateWardDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  units,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [unitId, setUnitId] = useState(units[0]?.id || '');
  const [wardCode, setWardCode] = useState('');
  const [wardName, setWardName] = useState('');
  const [wardType, setWardType] = useState<InpatientWardType>('GENERAL');
  const [careLevel, setCareLevel] = useState<InpatientCareLevel>('TERTIARY_CARE');
  const [building, setBuilding] = useState('Main Tower');
  const [floor, setFloor] = useState('Floor 3');
  const [nursingStationName, setNursingStationName] = useState('Station Central');
  const [totalBeds, setTotalBeds] = useState('10');
  const [isolationCapable, setIsolationCapable] = useState(false);
  const [ventilatorCapable, setVentilatorCapable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        unitId: unitId || units[0]?.id || '',
        wardCode: wardCode.trim().toUpperCase(),
        wardName: wardName.trim(),
        wardType,
        careLevel,
        genderPolicy: 'ALL',
        building,
        floor,
        nursingStationName,
        isolationCapable,
        ventilatorCapable,
        totalBeds: parseInt(totalBeds, 10) || 10
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register ward');
    } finally {
      setIsSubmitting(false)
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Register Inpatient Ward / Unit Floor">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Division Unit *</label>
            <Select value={unitId} onChange={(e) => setUnitId(e.target.value)} options={units.map((u) => ({ value: u.id, label: u.unitName }))} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Ward Code *</label>
            <Input value={wardCode} onChange={(e) => setWardCode(e.target.value)} placeholder="e.g. WARD-ICU-B" required />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Ward Name *</label>
          <Input value={wardName} onChange={(e) => setWardName(e.target.value)} placeholder="e.g. Intensive Coronary Care Unit" required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Ward Type *</label>
            <Select value={wardType} onChange={(e) => setWardType(e.target.value as InpatientWardType)} options={[
              { value: 'GENERAL', label: 'General Ward' },
              { value: 'SEMI_PRIVATE', label: 'Semi-Private' },
              { value: 'PRIVATE', label: 'Private Room' },
              { value: 'DELUXE', label: 'Deluxe Suite' },
              { value: 'ICU', label: 'ICU (Intensive Care)' },
              { value: 'HDU', label: 'HDU (High Dependency)' },
              { value: 'NICU', label: 'NICU (Neonatal ICU)' },
              { value: 'ISOLATION', label: 'Negative Pressure Isolation' }
            ]} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Care Level *</label>
            <Select value={careLevel} onChange={(e) => setCareLevel(e.target.value as InpatientCareLevel)} options={[
              { value: 'LEVEL_1_OBSERVATION', label: 'Level 1 Observation' },
              { value: 'LEVEL_2_STEPDOWN', label: 'Level 2 Stepdown' },
              { value: 'LEVEL_3_ICU', label: 'Level 3 Intensive Care' },
              { value: 'TERTIARY_CARE', label: 'Tertiary Medical/Surgical' }
            ]} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Building</label>
            <Input value={building} onChange={(e) => setBuilding(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Floor</label>
            <Input value={floor} onChange={(e) => setFloor(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Total Beds</label>
            <Input type="number" value={totalBeds} onChange={(e) => setTotalBeds(e.target.value)} required />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Nursing Station Name</label>
          <Input value={nursingStationName} onChange={(e) => setNursingStationName(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <input type="checkbox" checked={isolationCapable} onChange={(e) => setIsolationCapable(e.target.checked)} />
            Negative Pressure Isolation Capable
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <input type="checkbox" checked={ventilatorCapable} onChange={(e) => setVentilatorCapable(e.target.checked)} />
            Mechanical Ventilator Capable
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Register Ward'}</Button>
        </div>
      </form>
    </Dialog>
  );
};