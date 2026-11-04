import React, { useState, useMemo } from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';

export interface PharmacyBatchItem {
  id: string;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  currentStock: number;
  unitPrice: number;
  mrp: number;
  locationRack?: string;
}

export interface PharmacyDispenseDrug {
  id: string;
  tradeName: string;
  genericName: string;
  dosageForm: string; // Tablet, Syrup, Injection, etc.
  strength: string;
  scheduleCategory?: 'NONE' | 'SCHEDULE_H' | 'SCHEDULE_H1' | 'SCHEDULE_X';
  batches: PharmacyBatchItem[];
}

export interface DispenseRecordPayload {
  drugId: string;
  batchId: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  patientName: string;
  patientPhone: string;
  doctorName?: string | undefined;
  doctorRegistrationNumber?: string | undefined;
  scheduleComplianceAcknowledged?: boolean | undefined;
}

export interface PharmacyDispenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  drug: PharmacyDispenseDrug | null;
  defaultPatient?: { name: string; phone: string; uhid?: string } | null;
  onConfirmDispense: (payload: DispenseRecordPayload) => Promise<void> | void;
}

export const PharmacyDispenseModal: React.FC<PharmacyDispenseModalProps> = ({
  isOpen,
  onClose,
  drug,
  defaultPatient,
  onConfirmDispense
}) => {
  if (!isOpen || !drug) return null;

  const isControlledSchedule =
    drug.scheduleCategory === 'SCHEDULE_H1' || drug.scheduleCategory === 'SCHEDULE_X';
  const isScheduleH = drug.scheduleCategory === 'SCHEDULE_H';

  // FIFO Batch Selection: Sort batches by nearest expiryDate where stock > 0
  const fifoSortedBatches = useMemo(() => {
    return [...(drug.batches || [])]
      .filter((b) => b.currentStock > 0)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [drug.batches]);

  const defaultBatch = fifoSortedBatches[0] || null;

  const [selectedBatchId, setSelectedBatchId] = useState<string>(defaultBatch?.id || '');
  const [dispenseQty, setDispenseQty] = useState<number>(1);
  const [patientName, setPatientName] = useState<string>(defaultPatient?.name || '');
  const [patientPhone, setPatientPhone] = useState<string>(defaultPatient?.phone || '');
  const [doctorName, setDoctorName] = useState<string>('');
  const [doctorRegistrationNumber, setDoctorRegistrationNumber] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const activeBatch = fifoSortedBatches.find((b) => b.id === selectedBatchId) || defaultBatch;

  const handleDispense = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!activeBatch) {
      setErrorMsg('No available batch in stock with valid inventory.');
      return;
    }

    if (dispenseQty <= 0) {
      setErrorMsg('Dispense quantity must be at least 1.');
      return;
    }

    if (dispenseQty > activeBatch.currentStock) {
      setErrorMsg(`Insufficient stock in Batch ${activeBatch.batchNumber}. Available: ${activeBatch.currentStock}.`);
      return;
    }

    if (!patientName.trim()) {
      setErrorMsg('Patient Name is mandatory for dispensing.');
      return;
    }

    // CDSCO Rule 65 Mandatory Check for Schedule H1 / Schedule X
    if (isControlledSchedule) {
      if (!doctorName.trim()) {
        setErrorMsg(`Prescribing Doctor Name is mandatory for ${drug.scheduleCategory} restricted drugs.`);
        return;
      }
      if (!doctorRegistrationNumber.trim()) {
        setErrorMsg(`Doctor State Medical Council / NMC Registration Number is mandatory under Schedule H1/X audit law.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onConfirmDispense({
        drugId: drug.id,
        batchId: activeBatch.id,
        batchNumber: activeBatch.batchNumber,
        quantity: dispenseQty,
        unitPrice: activeBatch.unitPrice,
        totalPrice: activeBatch.unitPrice * dispenseQty,
        patientName,
        patientPhone,
        doctorName: doctorName.trim() || undefined,
        doctorRegistrationNumber: doctorRegistrationNumber.trim() || undefined,
        scheduleComplianceAcknowledged: isControlledSchedule || isScheduleH
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to complete drug dispense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1rem'
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#f8fafc' }}>
                {drug.tradeName}
              </h2>
              {isControlledSchedule && (
                <Badge variant="danger" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {drug.scheduleCategory} (RESTRICTED)
                </Badge>
              )}
              {isScheduleH && (
                <Badge variant="warning" style={{ fontSize: '0.75rem' }}>
                  SCHEDULE H (Rx ONLY)
                </Badge>
              )}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              {drug.genericName} • {drug.strength} • {drug.dosageForm}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '1.5rem',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              color: '#fca5a5',
              padding: '0.75rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleDispense}>
          {/* Batch Selection (FIFO Recommendation) */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
              SELECT BATCH (Auto-Sorted by FIFO Expiry)
            </label>
            {fifoSortedBatches.length === 0 ? (
              <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }}>Out of Stock across all batches!</p>
            ) : (
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  fontSize: '0.9rem'
                }}
              >
                {fifoSortedBatches.map((b, idx) => (
                  <option key={b.id} value={b.id}>
                    {idx === 0 ? '★ [FIFO FIRST] ' : ''}Batch: {b.batchNumber} | Exp: {b.expiryDate} | Stock: {b.currentStock} | ₹{b.mrp}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quantity & Pricing */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                DISPENSE QTY
              </label>
              <input
                type="number"
                min="1"
                max={activeBatch?.currentStock || 1}
                value={dispenseQty}
                onChange={(e) => setDispenseQty(parseInt(e.target.value, 10) || 1)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                TOTAL AMOUNT
              </label>
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: '#38bdf8'
                }}
              >
                ₹{((activeBatch?.unitPrice || 0) * dispenseQty).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Patient Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                PATIENT NAME *
              </label>
              <input
                type="text"
                placeholder="Full Name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                PHONE NUMBER
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          {/* Schedule H1 / Schedule X Statutory Section */}
          {isControlledSchedule && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem'
              }}
            >
              <div style={{ color: '#f87171', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '8px' }}>
                ⚖ CDSCO SCHEDULE H1 / X STATUTORY REGISTER COMPLIANCE
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#fca5a5', marginBottom: '4px' }}>
                    DOCTOR NAME *
                  </label>
                  <input
                    type="text"
                    placeholder="Dr. S. K. Gupta"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      backgroundColor: '#1e293b',
                      color: '#f8fafc',
                      border: '1px solid #ef4444',
                      borderRadius: '4px',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#fca5a5', marginBottom: '4px' }}>
                    DOCTOR REGISTRATION NO. *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DMC-2019-8812"
                    value={doctorRegistrationNumber}
                    onChange={(e) => setDoctorRegistrationNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      backgroundColor: '#1e293b',
                      color: '#f8fafc',
                      border: '1px solid #ef4444',
                      borderRadius: '4px',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting || fifoSortedBatches.length === 0}
            >
              {isSubmitting ? 'Recording Dispense...' : 'Confirm & Dispense'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
