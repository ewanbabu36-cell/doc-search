import React, { useState } from 'react';

export interface AllergyConflictData {
  patientAllergy: string;
  offendingMedication: string;
  contraindicationClass: string;
  severity: 'FATAL_ANAPHYLAXIS' | 'SEVERE_ANGIOEDEMA' | 'STEVENS_JOHNSON' | 'MODERATE_RASH';
}

export interface OpdAllergyHardLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflict: AllergyConflictData | null;
  patientName: string;
  onRemoveMedication: (medicationName: string) => void;
  onEmergencyOverride: (justification: string) => void;
}

export const OpdAllergyHardLockModal: React.FC<OpdAllergyHardLockModalProps> = ({
  isOpen,
  onClose,
  conflict,
  patientName,
  onRemoveMedication,
  onEmergencyOverride
}) => {
  const [overrideJustification, setOverrideJustification] = useState('');
  const [showOverrideInput, setShowOverrideInput] = useState(false);

  if (!isOpen || !conflict) return null;

  const handleConfirmOverride = () => {
    if (!overrideJustification.trim()) return;
    onEmergencyOverride(overrideJustification);
    onClose();
  };

  const handleRemove = () => {
    onRemoveMedication(conflict.offendingMedication);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001,
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '2.5px solid #EF4444',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '650px',
          boxShadow: '0 0 80px rgba(239, 68, 68, 0.6)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Urgent Pulsing Hazard Header */}
        <div
          style={{
            backgroundColor: '#DC2626',
            color: '#FFFFFF',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>🛑</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, letterSpacing: '0.04em' }}>
                CRITICAL ALLERGY ALERT — HARD CLINICAL LOCKOUT
              </h3>
              <span style={{ fontSize: '0.72rem', opacity: 0.9 }}>
                Action blocked by Clinical Pharmacovigilance Rule Engine
              </span>
            </div>
          </div>
          <span style={{ backgroundColor: '#7F1D1D', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 900 }}>
            {conflict.severity.replace('_', ' ')}
          </span>
        </div>

        {/* Content Details */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1.5px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '14px 18px',
              fontSize: '0.85rem',
              color: '#FCA5A5',
              lineHeight: 1.5
            }}
          >
            Patient <strong>{patientName}</strong> has documented high-risk hypersensitivity to{' '}
            <strong style={{ color: '#FFFFFF', textDecoration: 'underline' }}>{conflict.patientAllergy}</strong>.
            <br />
            Selected prescription drug{' '}
            <strong style={{ color: '#FFFFFF', textDecoration: 'underline' }}>{conflict.offendingMedication}</strong> belongs
            to cross-reacting class <strong>{conflict.contraindicationClass}</strong> and risks precipitating fatal
            anaphylactic shock or airway compromise.
          </div>

          {!showOverrideInput ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={handleRemove}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#22C55E',
                  border: 'none',
                  color: '#070C16',
                  fontSize: '0.9rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)'
                }}
              >
                <span>✓</span>
                <span>(Recommended) Remove {conflict.offendingMedication} from Prescription</span>
              </button>

              <button
                type="button"
                onClick={() => setShowOverrideInput(true)}
                style={{
                  width: '100%',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#94A3B8',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                Request High-Risk Emergency Clinical Override (Logged in Audit Vault)
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#070C16', padding: '14px', borderRadius: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F87171' }}>
                Statutory Override Justification (Stored Permanently in Legal EMR Audit Log):
              </label>
              <input
                type="text"
                placeholder="e.g. Skin prick test negative / Hydrocortisone pre-medication administered"
                value={overrideJustification}
                onChange={(e) => setOverrideJustification(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#0F172A',
                  border: '1px solid #EF4444',
                  color: '#F8FAFC',
                  fontSize: '0.8rem'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowOverrideInput(false)}
                  style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#CBD5E1', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!overrideJustification.trim()}
                  onClick={handleConfirmOverride}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '6px',
                    backgroundColor: '#EF4444',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: !overrideJustification.trim() ? 'not-allowed' : 'pointer',
                    opacity: !overrideJustification.trim() ? 0.5 : 1
                  }}
                >
                  Confirm Emergency Override
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
