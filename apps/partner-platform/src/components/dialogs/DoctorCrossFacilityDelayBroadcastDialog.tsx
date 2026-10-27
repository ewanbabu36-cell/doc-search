import React, { useState } from 'react';
import { Dialog, Button, Alert } from '@docsearch/ui-kit';

export interface DoctorCrossFacilityDelayBroadcastDialogProps {
  isOpen: boolean;
  onClose: () => void;
  doctorId?: string;
  doctorName?: string;
  targetFacilityName?: string;
}

export const DoctorCrossFacilityDelayBroadcastDialog: React.FC<DoctorCrossFacilityDelayBroadcastDialogProps> = ({
  isOpen,
  onClose,
  doctorId = 'doc-visiting-01',
  doctorName = 'Dr. Vikram Malhotra (Orthopedic Surgeon)',
  targetFacilityName = 'DocSearch West Clinic OPD'
}) => {
  const [sourceFacility, setSourceFacility] = useState('Apex City Hospital (Main Operation Theatre)');
  const [delayMinutes, setDelayMinutes] = useState(45);
  const [delayReason, setDelayReason] = useState('Emergency revision knee arthroplasty bleeding management in OT-2');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResultMessage(null);

    try {
      const response = await fetch('/api/v1/partner/roster/cross-facility-delay-cascade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId,
          doctorName,
          sourceFacilityName: sourceFacility,
          targetFacilityName,
          delayMinutes: Number(delayMinutes),
          delayReason
        })
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to broadcast cross-facility delay.');
      }

      setResultMessage(
        `⚡ Delay Cascade Active: ${json.data.affectedTokensCount} patient tokens at ${targetFacilityName} protected and shifted by ${delayMinutes} minutes. Automated WhatsApp delay notices dispatched!`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Broadcast failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Cross-Facility Visiting Doctor Smart Roster & Delay Cascade"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleBroadcast} disabled={isSubmitting}>
            {isSubmitting ? 'Cascading Delay...' : '⚡ Broadcast Emergency Delay'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        {resultMessage && <Alert type="success">{resultMessage}</Alert>}

        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
          <div style={{ fontWeight: 700, color: '#92400e' }}>
            Visiting Doctor Emergency Protocol Active
          </div>
          <div style={{ color: '#b45309', marginTop: '2px' }}>
            When a consultant is detained in emergency surgery at another hospital, tokens at the target clinic are automatically protected and shifted, preventing waiting room chaos.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Doctor
            </label>
            <input
              type="text"
              value={doctorName}
              readOnly
              style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '0.85rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Target Facility OPD
            </label>
            <input
              type="text"
              value={targetFacilityName}
              readOnly
              style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Current Detaining Facility / OT Room *
            </label>
            <input
              type="text"
              value={sourceFacility}
              onChange={(e) => setSourceFacility(e.target.value)}
              required
              style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Estimated Delay (Minutes) *
            </label>
            <input
              type="number"
              min="10"
              max="240"
              step="5"
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(parseInt(e.target.value, 10) || 0)}
              required
              style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
            Clinical Delay Justification (Preserved for Patient Notice & Hospital Audit) *
          </label>
          <input
            type="text"
            value={delayReason}
            onChange={(e) => setDelayReason(e.target.value)}
            required
            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>
      </form>
    </Dialog>
  );
};
