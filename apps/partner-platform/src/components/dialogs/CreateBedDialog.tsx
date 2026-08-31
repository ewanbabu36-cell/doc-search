import React, { useState } from 'react';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';
import type { CreateBedRequest, InpatientWardDto, BedType, BedClass } from '@docsearch/api-contracts';

export interface CreateBedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: CreateBedRequest) => Promise<void>;
  wards: InpatientWardDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateBedDialog: React.FC<CreateBedDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  wards,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [wardId, setWardId] = useState(wards[0]?.id || '');
  const [bedCode, setBedCode] = useState('');
  const [bedNumber, setBedNumber] = useState('');
  const [bedType, setBedType] = useState<BedType>('STANDARD_ELECTRIC');
  const [bedClass, setBedClass] = useState<BedClass>('GENERAL');
  const [dailyChargeRate, setDailyChargeRate] = useState('180.00');
  const [hasOxygenPort, setHasOxygenPort] = useState(true);
  const [hasSuctionPort, setHasSuctionPort] = useState(true);
  const [hasVentilator, setHasVentilator] = useState(false);
  const [hasCardiacMonitor, setHasCardiacMonitor] = useState(false);
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
        wardId: wardId || wards[0]?.id || '',
        bedCode: bedCode.trim().toUpperCase(),
        bedNumber: bedNumber.trim(),
        bedType,
        bedClass,
        genderEligibility: 'ALL',
        hasOxygenPort,
        hasSuctionPort,
        hasVentilator,
        hasCardiacMonitor,
        dailyChargeRate: parseFloat(dailyChargeRate) || 180.00
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create bed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Register Bed in Ward Roster">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Target Ward *</label>
            <Select value={wardId} onChange={(e) => setWardId(e.target.value)} options={wards.map((w) => ({ value: w.id, label: w.wardName }))} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Bed Identifier Code *</label>
            <Input value={bedCode} onChange={(e) => setBedCode(e.target.value)} placeholder="e.g. ICU-BED-05" required />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Bed Number</label>
            <Input value={bedNumber} onChange={(e) => setBedNumber(e.target.value)} placeholder="e.g. 05" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Bed Type</label>
            <Select value={bedType} onChange={(e) => setBedType(e.target.value as BedType)} options={[
              { value: 'STANDARD_ELECTRIC', label: 'Standard Electric' },
              { value: 'ICU_CRITICAL', label: 'ICU Critical' },
              { value: 'ISOLATION_BED', label: 'Isolation' },
              { value: 'BARIATRIC', label: 'Bariatric' }
            ]} />
          </div>
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
            <input type="checkbox" checked={hasOxygenPort} onChange={(e) => setHasOxygenPort(e.target.checked)} /> Oxygen Port Connected
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={hasSuctionPort} onChange={(e) => setHasSuctionPort(e.target.checked)} /> Vacuum Suction Line
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={hasVentilator} onChange={(e) => setHasVentilator(e.target.checked)} /> Mechanical Ventilator
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={hasCardiacMonitor} onChange={(e) => setHasCardiacMonitor(e.target.checked)} /> Multipara Cardiac Monitor
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Registering...' : 'Register Bed'}</Button>
        </div>
      </form>
    </Dialog>
  );
};