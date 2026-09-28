import React, { useState } from 'react';
import { Button, Input, Badge } from '@docsearch/ui-kit';
import type { InvestigationOrderDto } from '@docsearch/api-contracts';
import { clinicalInvestigationService } from '../../services/clinical-investigation-service.js';
import { getUnifiedPartnerProfile } from '../../utils/roleProfileResolver.js';

interface CriticalPanicIntimationModalProps {
  isOpen: boolean;
  order: InvestigationOrderDto | null;
  onClose: () => void;
  onIntimated: (orderId: string) => void;
}

export const CriticalPanicIntimationModal: React.FC<CriticalPanicIntimationModalProps> = ({
  isOpen,
  order,
  onClose,
  onIntimated
}) => {
  const partnerProfile = getUnifiedPartnerProfile();
  const criticalResults = order?.results?.filter((r) => r.isCritical) || [];

  const [doctorName, setDoctorName] = useState(order?.orderingDoctorName || (partnerProfile.doctorName ? `${partnerProfile.doctorName}, MD` : 'Treating Clinician'));
  const [doctorPhone, setDoctorPhone] = useState(partnerProfile.contactPhone ? partnerProfile.contactPhone.replace(/\D/g, '').slice(-10) : '9811234567');
  const [callerStaffName, setCallerStaffName] = useState(partnerProfile.technicianName || 'Senior Lab Technologist');
  const [readBackConfirmed, setReadBackConfirmed] = useState(true);
  const [notes, setNotes] = useState('Spoke with attending clinician. Explained severe panic findings; verbal read-back completed.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await clinicalInvestigationService.logPanicIntimation(order.id, {
        doctorName,
        doctorPhone,
        callerStaffName,
        readBackConfirmed,
        criticalParameters: criticalResults.map((r) => `${r.parameterName}: ${r.resultValue} ${r.unit || ''}`),
        notes
      });
      onIntimated(order.id);
      onClose();
    } catch (err) {
      console.error('Failed to log panic intimation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#0F172A',
        border: '2px solid #EF4444',
        borderRadius: '16px',
        maxWidth: '650px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 0 40px rgba(239, 68, 68, 0.4)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(239, 68, 68, 0.3)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.75rem', animation: 'pulse 1s infinite' }}>🚨</span>
            <div>
              <h3 style={{ margin: 0, color: '#F87171', fontSize: '1.125rem', fontWeight: 900 }}>
                NABL Critical Panic Value — Telephonic Intimation
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                ISO 15189 Mandatory Verbal Read-Back Communication Record
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {/* Patient & Order Details Banner */}
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px dashed #EF4444', borderRadius: '8px', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <strong style={{ color: '#F8FAFC', fontSize: '0.875rem' }}>
              Patient: {order.patientName} ({order.patientGender || 'Adult'} · MRN: {order.patientMrn})
            </strong>
            <Badge variant="danger">Order #{order.orderNumber}</Badge>
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>
            Test: <strong>{order.investigationName}</strong> ({order.investigationCategory})
          </div>
        </div>

        {/* Critical Parameters Flagged */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FCA5A5', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            CRITICAL PANIC ANALYTES DETECTED:
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {criticalResults.map((r, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', padding: '8px 12px', borderRadius: '6px', borderLeft: '4px solid #EF4444' }}>
                <div>
                  <span style={{ color: '#F8FAFC', fontWeight: 700, fontSize: '0.875rem' }}>{r.parameterName}</span>
                  <span style={{ color: '#94A3B8', fontSize: '0.75rem', marginLeft: '8px' }}>(Ref: {r.referenceRange || 'Standard'})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#EF4444', fontFamily: 'monospace', fontWeight: 900, fontSize: '1rem' }}>
                    {r.resultValue} {r.unit || ''}
                  </span>
                  <Badge variant="danger">🚨 PANIC</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Intimation Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                DOCTOR TELEPHONED *
              </label>
              <Input
                required
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="e.g. Dr. Rajesh Sharma, MD"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                DOCTOR PHONE NUMBER (10-DIGIT MOBILE) *
              </label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    padding: '8px 10px',
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRight: 'none',
                    borderRadius: '6px 0 0 6px',
                    color: '#38BDF8',
                    fontSize: '0.8125rem',
                    fontWeight: 700
                  }}
                >
                  +91
                </span>
                <input
                  type="tel"
                  required
                  value={doctorPhone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setDoctorPhone(digits.slice(0, 10));
                  }}
                  maxLength={10}
                  placeholder="98112 34567"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '0 6px 6px 0',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#FFF',
                    fontSize: '0.8125rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
              LAB TECHNOLOGIST / CALLER NAME *
            </label>
            <Input
              required
              value={callerStaffName}
              onChange={(e) => setCallerStaffName(e.target.value)}
              placeholder="e.g. Duty Lab Technologist"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10B981', padding: '10px 14px', borderRadius: '8px' }}>
            <input
              type="checkbox"
              id="readback"
              checked={readBackConfirmed}
              onChange={(e) => setReadBackConfirmed(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="readback" style={{ color: '#A7F3D0', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer' }}>
              ✓ Verbal Read-Back Confirmed (Doctor listened and repeated critical analyte figures back)
            </label>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
              CLINICAL COMMUNICATION NOTES
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Clinician alerted, admitted to Emergency Care unit."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={isSubmitting || !readBackConfirmed}
              style={{ backgroundColor: '#EF4444', borderColor: '#EF4444', color: '#FFFFFF', fontWeight: 800 }}
            >
              {isSubmitting ? 'Logging Intimation...' : '📞 Sign & Log Verbal Intimation Record'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
