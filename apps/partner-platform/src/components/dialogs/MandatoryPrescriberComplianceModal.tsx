import React, { useState, useEffect, useRef } from 'react';
import {
  cdscoInspectionAuditService,
  type ControlledScheduleCategory,
  type FrequentPrescriberDoctor
} from '../../services/cdsco-inspection-audit-service.js';

export interface MandatoryPrescriberComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerDrugName?: string;
  triggerSchedule?: ControlledScheduleCategory;
  initialDoctorName?: string;
  initialDoctorNmcReg?: string;
  onConfirmPrescriber: (doctorName: string, doctorNmcReg: string, clinicAddress?: string) => void;
}

export const MandatoryPrescriberComplianceModal: React.FC<MandatoryPrescriberComplianceModalProps> = ({
  isOpen,
  onClose,
  triggerDrugName = 'Controlled Prescription Medication',
  triggerSchedule = 'SCHEDULE_H1',
  initialDoctorName = '',
  initialDoctorNmcReg = '',
  onConfirmPrescriber
}) => {
  const [doctorName, setDoctorName] = useState(initialDoctorName);
  const [doctorNmcReg, setDoctorNmcReg] = useState(initialDoctorNmcReg);
  const [clinicAddress, setClinicAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [frequentDoctors, setFrequentDoctors] = useState<FrequentPrescriberDoctor[]>([]);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDoctorName(initialDoctorName);
      setDoctorNmcReg(initialDoctorNmcReg);
      setClinicAddress('');
      setError(null);
      setFrequentDoctors(cdscoInspectionAuditService.getFrequentDoctors());
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialDoctorName, initialDoctorNmcReg]);

  if (!isOpen) return null;

  const handleSelectFrequentDoc = (doc: FrequentPrescriberDoctor) => {
    setDoctorName(doc.name);
    setDoctorNmcReg(doc.nmcRegNo);
    setClinicAddress(`${doc.clinicHospital}, ${doc.location}`);
    setError(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!doctorName.trim()) {
      setError('Doctor Name enter karna anivarya hai (Mandatory under Rule 65).');
      return;
    }

    if (!doctorNmcReg.trim()) {
      setError('Doctor ka NMC ya State Medical Council Registration No. enter karein.');
      return;
    }

    onConfirmPrescriber(doctorName.trim(), doctorNmcReg.trim(), clinicAddress.trim());
    onClose();
  };

  const getScheduleBadge = (sched: ControlledScheduleCategory) => {
    switch (sched) {
      case 'SCHEDULE_H1':
        return (
          <span
            style={{
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: '0.72rem',
              padding: '3px 8px',
              borderRadius: '4px',
              letterSpacing: '0.05em'
            }}
          >
            ⚠️ SCHEDULE H1 (ANTIBIOTIC / SEDATIVE)
          </span>
        );
      case 'SCHEDULE_X':
        return (
          <span
            style={{
              backgroundColor: '#7E22CE',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: '0.72rem',
              padding: '3px 8px',
              borderRadius: '4px',
              letterSpacing: '0.05em'
            }}
          >
            🔒 SCHEDULE X (NARCOTIC / PSYCHOTROPIC)
          </span>
        );
      case 'SCHEDULE_H':
      default:
        return (
          <span
            style={{
              backgroundColor: '#F59E0B',
              color: '#000000',
              fontWeight: 900,
              fontSize: '0.72rem',
              padding: '3px 8px',
              borderRadius: '4px',
              letterSpacing: '0.05em'
            }}
          >
            📋 SCHEDULE H (PRESCRIPTION ONLY)
          </span>
        );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(5px)',
        zIndex: 10005,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: '620px',
          maxWidth: '100%',
          backgroundColor: '#0F172A',
          border: '1.5px solid #EF4444',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(239, 68, 68, 0.25), 0 10px 30px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#1E1B4B',
            borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>⚖️</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ color: '#F8FAFC', fontSize: '1.05rem' }}>
                  CDSCO Statutory Prescriber Guard
                </strong>
                <span
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid #EF4444',
                    color: '#FCA5A5',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                >
                  RULE 65(9) MANDATORY
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                Dispensing controlled medication requires Registered Medical Practitioner (RMP) details
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Trigger Drug Information Banner */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: '#CBD5E1', textTransform: 'uppercase', fontWeight: 700 }}>
              Triggered By Medication in POS Cart:
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC', marginTop: '2px' }}>
              {triggerDrugName}
            </div>
          </div>
          <div>{getScheduleBadge(triggerSchedule)}</div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #EF4444',
                color: '#FCA5A5',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Quick Doctor Chips for 1-Click Speed */}
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: '#38BDF8', fontWeight: 800, marginBottom: '6px' }}>
              ⚡ 1-CLICK POPULAR LOCAL PRESCRIBERS (Frequent Doctors):
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {frequentDoctors.slice(0, 4).map((doc, idx) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => handleSelectFrequentDoc(doc)}
                  style={{
                    backgroundColor: doctorNmcReg === doc.nmcRegNo ? '#0369A1' : '#1E293B',
                    border: doctorNmcReg === doc.nmcRegNo ? '1.5px solid #38BDF8' : '1px solid #334155',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    color: '#F8FAFC',
                    fontSize: '0.75rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontWeight: 700 }}>
                    <span style={{ color: '#F59E0B', marginRight: '4px' }}>[{idx + 1}]</span>
                    {doc.name}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                    Reg: <span style={{ color: '#34D399', fontFamily: 'monospace' }}>{doc.nmcRegNo}</span> • {doc.specialty.split('&')[0]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Inputs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#E2E8F0', fontWeight: 700, marginBottom: '4px' }}>
                Prescribing Doctor Name *
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="e.g. Dr. Rajesh Sharma, MD"
                style={{
                  width: '100%',
                  backgroundColor: '#1E293B',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#F8FAFC',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#E2E8F0', fontWeight: 700, marginBottom: '4px' }}>
                NMC / State Medical Council Reg # *
              </label>
              <input
                type="text"
                value={doctorNmcReg}
                onChange={(e) => setDoctorNmcReg(e.target.value)}
                placeholder="e.g. NMC-DEL-48219"
                style={{
                  width: '100%',
                  backgroundColor: '#1E293B',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#34D399',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, marginBottom: '4px' }}>
              Hospital / Clinic Name & Address (Optional)
            </label>
            <input
              type="text"
              value={clinicAddress}
              onChange={(e) => setClinicAddress(e.target.value)}
              placeholder="e.g. Sharma Chest Clinic, Rohini Sector 14"
              style={{
                width: '100%',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '7px 12px',
                color: '#CBD5E1',
                fontSize: '0.8rem'
              }}
            />
          </div>

          {/* Statutory Law Notice */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#1E293B',
              borderRadius: '8px',
              border: '1px dashed #64748B',
              fontSize: '0.72rem',
              color: '#94A3B8',
              lineHeight: 1.4
            }}
          >
            ⚖️ <strong>Drugs & Cosmetics Rules, 1945 — Rule 65(9):</strong> Every licensed chemist (Form 20B/21B) must record the name & address of the prescriber along with their qualification and State/NMC Registration Number for Schedule H1 substances. This record must be preserved for a minimum of <strong>3 years</strong>.
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #475569',
                color: '#CBD5E1',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Cancel / Back to Cart
            </button>

            <button
              type="submit"
              style={{
                backgroundColor: '#10B981',
                color: '#000000',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              <span>✓ Verify Prescriber (Enter)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
