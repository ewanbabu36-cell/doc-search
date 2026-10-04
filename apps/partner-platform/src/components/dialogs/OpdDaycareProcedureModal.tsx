import React, { useState } from 'react';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface DaycareProcedureItem {
  id: string;
  name: string;
  category: 'INJECTION' | 'NEBULIZATION' | 'IV_DRIP' | 'DRESSING' | 'DIAGNOSTIC';
  defaultCost: number;
  nursingInstructions: string;
}

export const COMMON_OPD_PROCEDURES: DaycareProcedureItem[] = [
  {
    id: 'proc-neb-1',
    name: 'Nebulization (Duolin + Budecort)',
    category: 'NEBULIZATION',
    defaultCost: 150,
    nursingInstructions: 'Administer 1 ampoule Duolin + 0.5mg Budecort via oxygen nebulizer over 15 mins. Monitor post-neb SpO2.'
  },
  {
    id: 'proc-tt-1',
    name: 'Tetanus Toxoid (TT 0.5ml IM)',
    category: 'INJECTION',
    defaultCost: 80,
    nursingInstructions: 'Give 0.5ml deep intramuscular in Left Deltoid muscle with aseptic technique.'
  },
  {
    id: 'proc-iv-drip-1',
    name: 'IV Dextrose Normal Saline (DNS 500ml) + Inj Ondansetron 4mg',
    category: 'IV_DRIP',
    defaultCost: 350,
    nursingInstructions: 'Cannulate with 20G/22G cannula. Infuse DNS 500ml over 60 mins. Inj Ondansetron 4mg IV slow push.'
  },
  {
    id: 'proc-inj-pain-1',
    name: 'Inj Diclofenac Sodium 75mg IM (Dynapar)',
    category: 'INJECTION',
    defaultCost: 120,
    nursingInstructions: 'Deep gluteal intragluteal injection in upper outer quadrant. Check for NSAID hypersensitivity.'
  },
  {
    id: 'proc-dressing-1',
    name: 'Aseptic Wound Dressing / Suture Removal',
    category: 'DRESSING',
    defaultCost: 250,
    nursingInstructions: 'Clean with Betadine & Normal Saline. Apply sterile gauze dressing with micropore tape.'
  },
  {
    id: 'proc-ecg-1',
    name: 'In-Chamber 12-Lead Electrocardiogram (ECG)',
    category: 'DIAGNOSTIC',
    defaultCost: 200,
    nursingInstructions: 'Perform standard 12-lead ECG immediately. Alert physician for ST elevation or acute arrhythmia.'
  },
  {
    id: 'proc-stix-1',
    name: 'Point-of-Care Capillary Blood Glucose (CBG Stix)',
    category: 'DIAGNOSTIC',
    defaultCost: 60,
    nursingInstructions: 'Perform capillary fingerstick blood glucose check. Record value immediately.'
  }
];

export interface OpdDaycareProcedureModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientMrn: string;
  encounterId: string;
  onOrderDispatched?: (procedures: DaycareProcedureItem[], totalCost: number) => void;
}

export const OpdDaycareProcedureModal: React.FC<OpdDaycareProcedureModalProps> = ({
  isOpen,
  onClose,
  patientName,
  patientMrn,
  encounterId,
  onOrderDispatched
}) => {
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [urgency, setUrgency] = useState<'STAT' | 'ROUTINE'>('STAT');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSuccessDispatched, setIsSuccessDispatched] = useState(false);

  if (!isOpen) return null;

  const toggleProcedure = (procId: string) => {
    setSelectedProcedures((prev) =>
      prev.includes(procId) ? prev.filter((id) => id !== procId) : [...prev, procId]
    );
  };

  const selectedItems = COMMON_OPD_PROCEDURES.filter((p) => selectedProcedures.includes(p.id));
  const totalCost = selectedItems.reduce((acc, curr) => acc + curr.defaultCost, 0);

  const handleDispatchOrder = () => {
    if (selectedItems.length === 0) return;

    hospitalEventBus.publish(
      'OPD_PROCEDURE_ORDERED',
      'OpdDaycareProcedureModal',
      {
        encounterId,
        patientName,
        patientMrn,
        urgency,
        procedures: selectedItems,
        totalCost,
        additionalNotes
      },
      `OPD Procedure Order for ${patientName}: ${selectedItems.map((p) => p.name).join(', ')} (₹${totalCost})`
    );

    if (onOrderDispatched) {
      onOrderDispatched(selectedItems, totalCost);
    }

    setIsSuccessDispatched(true);
    setTimeout(() => {
      setIsSuccessDispatched(false);
      onClose();
    }, 1500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1.5px solid rgba(245, 158, 11, 0.4)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px rgba(0,0,0,0.85)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(245, 158, 11, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>💉</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#FBBF24' }}>
                OPD Daycare & Chamber Minor Procedures Desk
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#CBD5E1' }}>
                Patient: <strong>{patientName}</strong> ({patientMrn}) • Nursing Queue & Auto-Billing
              </p>
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
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Urgency Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F8FAFC' }}>
              Execution Urgency:
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setUrgency('STAT')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: urgency === 'STAT' ? '1.5px solid #EF4444' : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: urgency === 'STAT' ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
                  color: urgency === 'STAT' ? '#FCA5A5' : '#94A3B8'
                }}
              >
                ⚡ STAT / Immediate Nurse Action
              </button>
              <button
                type="button"
                onClick={() => setUrgency('ROUTINE')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: urgency === 'ROUTINE' ? '1.5px solid #06B6D4' : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: urgency === 'ROUTINE' ? 'rgba(6, 182, 212, 0.25)' : 'transparent',
                  color: urgency === 'ROUTINE' ? '#38BDF8' : '#94A3B8'
                }}
              >
                Routine Daycare
              </button>
            </div>
          </div>

          {/* Procedure Selection Grid */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '8px' }}>
              Select Minor Procedures (Auto-adds to Daycare & Billing Desk):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '10px' }}>
              {COMMON_OPD_PROCEDURES.map((proc) => {
                const isChecked = selectedProcedures.includes(proc.id);
                return (
                  <div
                    key={proc.id}
                    onClick={() => toggleProcedure(proc.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: isChecked ? '1.5px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: isChecked ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isChecked ? '#FDE68A' : '#F8FAFC' }}>
                        {isChecked ? '✓ ' : '+ '} {proc.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34D399' }}>
                        ₹{proc.defaultCost}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#94A3B8', lineHeight: 1.3 }}>
                      {proc.nursingInstructions}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
              Specific Doctor Instructions for Daycare Nurse:
            </label>
            <input
              type="text"
              placeholder="e.g. Call doctor immediately if SpO2 remains < 92% post nebulization"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: '#070C16',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#F8FAFC',
                fontSize: '0.8rem'
              }}
            />
          </div>

          {/* Billing Summary Box */}
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '8px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', color: '#A7F3D0' }}>
                Selected Procedures: <strong>{selectedItems.length} items</strong>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                Hospital auto-billing capture avoids OPD revenue leakage
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Total Procedure Charges</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34D399' }}>
                ₹{totalCost}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#070C16'
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Notifies Daycare Nurse Station instantly via Hospital Event Bus
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#CBD5E1',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedItems.length === 0 || isSuccessDispatched}
              onClick={handleDispatchOrder}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                backgroundColor: isSuccessDispatched ? '#10B981' : '#F59E0B',
                border: 'none',
                color: '#070C16',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: selectedItems.length === 0 ? 'not-allowed' : 'pointer',
                opacity: selectedItems.length === 0 ? 0.5 : 1
              }}
            >
              {isSuccessDispatched ? '✓ Order Dispatched to Nurse' : `Dispatch Order (₹${totalCost})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
