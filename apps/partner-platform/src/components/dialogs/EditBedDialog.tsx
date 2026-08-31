import React, { useState, useEffect } from 'react';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';
import type { UpdateBedRequest, InpatientBedDto, BedType, BedClass } from '@docsearch/api-contracts';

export interface EditBedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: UpdateBedRequest) => Promise<void>;
  bed: InpatientBedDto | null;
  tenantId: string;
}

export const EditBedDialog: React.FC<EditBedDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  bed,
  tenantId
}) => {
  const [bedType, setBedType] = useState<BedType>('STANDARD_ELECTRIC');
  const [bedClass, setBedClass] = useState<BedClass>('GENERAL');
  const [dailyChargeRate, setDailyChargeRate] = useState('180.00');
  const [hasOxygenPort, setHasOxygenPort] = useState(true);
  const [hasSuctionPort, setHasSuctionPort] = useState(true);
  const [hasVentilator, setHasVentilator] = useState(false);
  const [hasCardiacMonitor, setHasCardiacMonitor] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bed) {
      setBedType(bed.bedType);
      setBedClass(bed.bedClass);
      setDailyChargeRate(bed.dailyChargeRate.toString());
      setHasOxygenPort(bed.hasOxygenPort);
      setHasSuctionPort(bed.hasSuctionPort);
      setHasVentilator(bed.hasVentilator);
      setHasCardiacMonitor(bed.hasCardiacMonitor);
      setIsActive(bed.isActive);
    }
  }, [bed]);

  if (!bed) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        bedId: bed.id,
        tenantId,
        bedType,
        bedClass,
        dailyChargeRate: parseFloat(dailyChargeRate) || 180,
        hasOxygenPort,
        hasSuctionPort,
        hasVentilator,
        hasCardiacMonitor,
        isActive
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update bed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Edit Bed — ${bed.bedCode}` }>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Bed Class</label>
            <Select value={bedClass} onChange={(e) => setBedClass(e.target.value as BedClass)} options={[
              { value: 'GENERAL', label: 'General' },
              { value: 'SEMI_PRIVATE', label: 'Semi-Private' },
              { value: 'PRIVATE', label: 'Private' },
              { value: 'DELUXE', label: 'Deluxe' },
              { value: 'ICU', label: 'ICU' },
              { value: 'HDU', label: 'HDU' }
            ]} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Daily Tariff ($)</label>
            <Input type="number" value={dailyChargeRate} onChange={(e) => setDailyChargeRate(e.target.value)} required />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={hasOxygenPort} onChange={(e) => setHasOxygenPort(e.target.checked)} /> Oxygen Port
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={hasSuctionPort} onChange={(e) => setHasSuctionPort(e.target.checked)} /> Vacuum Suction
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={hasVentilator} onChange={(e) => setHasVentilator(e.target.checked)} /> Ventilator Connected
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={hasCardiacMonitor} onChange={(e) => setHasCardiacMonitor(e.target.checked)} /> Cardiac Monitor
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Bed'}</Button>
        </div>
      </form>
    </Dialog>
  );
};