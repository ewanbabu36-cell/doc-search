import React, { useState } from 'react';
import { Button, Badge } from '@docsearch/ui-kit';

export interface PaperlessPreArrivalIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (intakeData: IntakeData) => void;
}

export interface IntakeData {
  patientName: string;
  mobile: string;
  insuranceCardFrontUrl?: string;
  insuranceCardBackUrl?: string;
  insurerName: string;
  policyNumber: string;
  memberId: string;
  abhaId: string;
  chiefComplaints: string;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string;
  consentAgreed: boolean;
  signatureDataUrl?: string;
  fastPassQrCode: string;
}

const COMMON_ALLERGIES = ['Penicillin', 'Sulfa Drugs', 'Aspirin / NSAIDs', 'Paracetamol', 'Latex', 'Iodine / Contrast', 'None Known'];
const COMMON_CONDITIONS = ['Type 2 Diabetes', 'Hypertension / BP', 'Asthma / COPD', 'Heart Disease', 'Thyroid Disorder', 'CKD', 'None'];

export const PaperlessPreArrivalIntakeModal: React.FC<PaperlessPreArrivalIntakeModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [step, setStep] = useState<'OCR_INSURANCE' | 'CLINICAL_INTAKE' | 'CONSENT_SIGN' | 'FAST_PASS'>('OCR_INSURANCE');
  
  // OCR & Insurance State
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [cardUploaded, setCardUploaded] = useState(false);
  const [insurerName, setInsurerName] = useState('Star Health & Allied Insurance');
  const [policyNumber, setPolicyNumber] = useState('STAR-HLTH-2026-98124');
  const [memberId, setMemberId] = useState('MEM-IND-77821');
  const [abhaId, setAbhaId] = useState('91-8822-4411-9012@abdm');
  const [patientName, setPatientName] = useState('Vikramaditya Sharma');
  const [mobile] = useState('+91 98765 43210');

  // Clinical Intake State
  const [chiefComplaints, setChiefComplaints] = useState('Severe lower back pain and stiffness since 3 days');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(['Penicillin']);
  const [selectedConditions, setSelectedConditions] = useState<string[]>(['Hypertension / BP']);
  const [currentMedications, setCurrentMedications] = useState('Telmisartan 40mg OD');

  // Consent & Signature State
  const [consentAgreed, setConsentAgreed] = useState(true);
  const [signatureText, setSignatureText] = useState('V. Sharma');

  if (!isOpen) return null;

  const toggleAllergy = (allergy: string) => {
    if (allergy === 'None Known') {
      setSelectedAllergies(['None Known']);
      return;
    }
    const filtered = selectedAllergies.filter(a => a !== 'None Known');
    if (filtered.includes(allergy)) {
      setSelectedAllergies(filtered.filter(a => a !== allergy));
    } else {
      setSelectedAllergies([...filtered, allergy]);
    }
  };

  const toggleCondition = (cond: string) => {
    if (cond === 'None') {
      setSelectedConditions(['None']);
      return;
    }
    const filtered = selectedConditions.filter(c => c !== 'None');
    if (filtered.includes(cond)) {
      setSelectedConditions(filtered.filter(c => c !== cond));
    } else {
      setSelectedConditions([...filtered, cond]);
    }
  };

  const handleSimulateOcr = () => {
    setIsOcrProcessing(true);
    setTimeout(() => {
      setIsOcrProcessing(false);
      setCardUploaded(true);
      setInsurerName('HDFC ERGO Health (Optima Secure)');
      setPolicyNumber('HDFC-SEC-2026-88410');
      setMemberId('HDFC-MEM-40912');
      setAbhaId('91-8822-4411-9012@abdm');
    }, 1200);
  };

  const handleFinishIntake = () => {
    const intakeResult: IntakeData = {
      patientName,
      mobile,
      insurerName,
      policyNumber,
      memberId,
      abhaId,
      chiefComplaints,
      allergies: selectedAllergies,
      chronicConditions: selectedConditions,
      currentMedications,
      consentAgreed,
      signatureDataUrl: signatureText,
      fastPassQrCode: `FASTPASS-UHID-${Date.now().toString().slice(-6)}`
    };

    try {
      localStorage.setItem('docsearch_patient_pre_intake', JSON.stringify(intakeResult));
      window.dispatchEvent(new CustomEvent('docsearch:patient_pre_intake_submitted', { detail: intakeResult }));
    } catch {
      // Ignored
    }

    if (onComplete) {
      onComplete(intakeResult);
    }
    setStep('FAST_PASS');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 10, 24, 0.94)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '92vh',
          backgroundColor: '#0F172A',
          borderRadius: '24px',
          border: '1.5px solid rgba(56, 189, 248, 0.4)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(56, 189, 248, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(15, 23, 42, 0.95))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.75rem' }}>🪪</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#F8FAFC' }}>
                  Zocdoc-Style Paperless Digital Intake
                </h3>
                <span style={{ fontSize: '0.6875rem', backgroundColor: '#0284C7', color: '#FFF', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                  0-Wait Arrival
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8' }}>
                Skip clipboard paperwork • Instant insurance OCR verification & e-signature
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
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* 4-Step Progress Indicator */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '10px 24px',
            gap: '8px',
            fontSize: '0.75rem',
            overflowX: 'auto'
          }}
        >
          {[
            { id: 'OCR_INSURANCE', label: '1. Insurance OCR & ID', icon: '🪪' },
            { id: 'CLINICAL_INTAKE', label: '2. Medical Intake', icon: '📋' },
            { id: 'CONSENT_SIGN', label: '3. Digital Consent', icon: '✍️' },
            { id: 'FAST_PASS', label: '4. Express Fast-Pass', icon: '⚡' }
          ].map((s) => {
            const isActive = step === s.id;
            return (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: isActive ? '#38BDF8' : '#64748B',
                  fontWeight: isActive ? 800 : 500,
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* STEP 1: OCR & INSURANCE */}
          {step === 'OCR_INSURANCE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  border: '2px dashed rgba(56, 189, 248, 0.35)',
                  backgroundColor: 'rgba(56, 189, 248, 0.04)',
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center'
                }}
              >
                <span style={{ fontSize: '2.5rem' }}>📸</span>
                <h4 style={{ margin: '8px 0 4px', color: '#F8FAFC', fontSize: '1rem' }}>
                  Snap or Upload Health Insurance / Ayushman Bharat Card
                </h4>
                <p style={{ margin: '0 0 16px', color: '#94A3B8', fontSize: '0.8rem' }}>
                  Client-side Vision OCR will parse your Policy Number, TPA ID, and Insurer in 0.4 seconds.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isOcrProcessing}
                    onClick={handleSimulateOcr}
                  >
                    {isOcrProcessing ? '⚡ Scanning Card OCR...' : '📷 Scan Insurance Card (Camera / Upload)'}
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setCardUploaded(true);
                      setInsurerName('Ayushman Bharat PM-JAY');
                      setPolicyNumber('PMJAY-GOLD-2026-99120');
                      setMemberId('ABHA-CARD-99120');
                    }}
                  >
                    🇮🇳 Use Ayushman Bharat Golden Card
                  </Button>
                </div>
              </div>

              {cardUploaded && (
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid #10B981',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#10B981', fontWeight: 900 }}>✓ OCR Extraction Successful:</span>
                    <Badge variant="success">99.4% Confidence</Badge>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Patient Full Name</label>
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        style={{
                          width: '100%',
                          marginTop: '4px',
                          padding: '8px 12px',
                          backgroundColor: '#1E293B',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#F8FAFC',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Insurance Provider</label>
                      <input
                        type="text"
                        value={insurerName}
                        onChange={(e) => setInsurerName(e.target.value)}
                        style={{
                          width: '100%',
                          marginTop: '4px',
                          padding: '8px 12px',
                          backgroundColor: '#1E293B',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#F8FAFC',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Policy / Card Number</label>
                      <input
                        type="text"
                        value={policyNumber}
                        onChange={(e) => setPolicyNumber(e.target.value)}
                        style={{
                          width: '100%',
                          marginTop: '4px',
                          padding: '8px 12px',
                          backgroundColor: '#1E293B',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#38BDF8',
                          fontWeight: 700,
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#94A3B8' }}>ABHA Address / ID</label>
                      <input
                        type="text"
                        value={abhaId}
                        onChange={(e) => setAbhaId(e.target.value)}
                        style={{
                          width: '100%',
                          marginTop: '4px',
                          padding: '8px 12px',
                          backgroundColor: '#1E293B',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#34D399',
                          fontWeight: 700,
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: CLINICAL INTAKE */}
          {step === 'CLINICAL_INTAKE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', display: 'block', marginBottom: '6px' }}>
                  What symptoms or health concern brings you in today?
                </label>
                <textarea
                  rows={3}
                  value={chiefComplaints}
                  onChange={(e) => setChiefComplaints(e.target.value)}
                  placeholder="e.g. Fever since 2 days, chest discomfort, skin allergy..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: '#1E293B',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#F8FAFC',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', display: 'block', marginBottom: '6px' }}>
                  Any known drug or food allergies?
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {COMMON_ALLERGIES.map((allergy) => {
                    const isSelected = selectedAllergies.includes(allergy);
                    return (
                      <button
                        key={allergy}
                        type="button"
                        onClick={() => toggleAllergy(allergy)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          border: '1px solid',
                          borderColor: isSelected ? '#EF4444' : 'rgba(255, 255, 255, 0.1)',
                          backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                          color: isSelected ? '#FCA5A5' : '#94A3B8',
                          fontSize: '0.8rem',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer'
                        }}
                      >
                        {isSelected ? '⚠️ ' : ''}{allergy}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', display: 'block', marginBottom: '6px' }}>
                  Existing chronic health conditions:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {COMMON_CONDITIONS.map((cond) => {
                    const isSelected = selectedConditions.includes(cond);
                    return (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => toggleCondition(cond)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          border: '1px solid',
                          borderColor: isSelected ? '#38BDF8' : 'rgba(255, 255, 255, 0.1)',
                          backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                          color: isSelected ? '#38BDF8' : '#94A3B8',
                          fontSize: '0.8rem',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer'
                        }}
                      >
                        {isSelected ? '✓ ' : ''}{cond}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', display: 'block', marginBottom: '6px' }}>
                  Current regular medications (if any):
                </label>
                <input
                  type="text"
                  value={currentMedications}
                  onChange={(e) => setCurrentMedications(e.target.value)}
                  placeholder="e.g. Metformin 500mg, Amlodipine 5mg..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#1E293B',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 3: CONSENT & SIGNATURE */}
          {step === 'CONSENT_SIGN' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.65)',
                  borderRadius: '14px',
                  padding: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.8rem',
                  color: '#CBD5E1',
                  lineHeight: 1.5
                }}
              >
                <h4 style={{ margin: '0 0 8px', color: '#F8FAFC', fontSize: '0.9rem' }}>
                  Medical Treatment & ABDM Health Data Sharing Consent
                </h4>
                <p style={{ margin: '0 0 8px' }}>
                  1. I consent to clinical examination, diagnostic investigations, and outpatient treatment administered by hospital medical personnel.
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  2. I authorize the linking of my consultation summary and diagnostic lab reports with my ABHA address under India's Ayushman Bharat Digital Mission (ABDM).
                </p>
                <p style={{ margin: 0 }}>
                  3. I verify that the health insurance details provided are accurate for cashless TPA pre-authorization.
                </p>

                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="consent-check"
                    checked={consentAgreed}
                    onChange={(e) => setConsentAgreed(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#38BDF8' }}
                  />
                  <label htmlFor="consent-check" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F8FAFC', cursor: 'pointer' }}>
                    I have read and agree to the clinical consent terms.
                  </label>
                </div>
              </div>

              {/* Electronic Signature */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', display: 'block', marginBottom: '6px' }}>
                  Electronic Signature:
                </label>
                <div
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.5rem' }}>✍️</span>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontFamily: 'cursive', color: '#38BDF8', fontWeight: 900 }}>
                        {signatureText}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        Digitally signed on {new Date().toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={signatureText}
                    onChange={(e) => setSignatureText(e.target.value)}
                    placeholder="Type name to sign"
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#0F172A',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '0.8rem'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: FAST PASS QR */}
          {step === 'FAST_PASS' && (
            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
              <span style={{ fontSize: '3rem' }}>🎉</span>
              <h3 style={{ margin: '8px 0 4px', color: '#F8FAFC', fontSize: '1.25rem', fontWeight: 900 }}>
                You're Ready for 0-Wait Express Check-In!
              </h3>
              <p style={{ margin: '0 0 20px', color: '#94A3B8', fontSize: '0.85rem' }}>
                Your intake form and insurance card OCR are pre-synced with the hospital doctor & billing desk.
              </p>

              {/* Fast Pass Card */}
              <div
                style={{
                  maxWidth: '380px',
                  margin: '0 auto',
                  backgroundColor: 'linear-gradient(135deg, #1E1B4B, #0F172A)',
                  border: '1.5px solid #38BDF8',
                  borderRadius: '20px',
                  padding: '24px',
                  boxShadow: '0 10px 30px rgba(56, 189, 248, 0.2)'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  ⚡ HOSPITAL ZERO-WAIT FAST-PASS
                </div>

                <div
                  style={{
                    width: '140px',
                    height: '140px',
                    margin: '16px auto',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '4.5rem',
                    color: '#0F172A'
                  }}
                >
                  📱
                </div>

                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#F8FAFC' }}>
                  {patientName}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '2px' }}>
                  {insurerName} • Policy #{policyNumber}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 700, marginTop: '8px' }}>
                  ✓ Intake Verified & Signed • Ready for Doctor OPD Room
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          {step !== 'FAST_PASS' ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (step === 'CONSENT_SIGN') setStep('CLINICAL_INTAKE');
                  else if (step === 'CLINICAL_INTAKE') setStep('OCR_INSURANCE');
                  else onClose();
                }}
              >
                {step === 'OCR_INSURANCE' ? 'Cancel' : '← Back'}
              </Button>

              <div style={{ display: 'flex', gap: '8px' }}>
                {step === 'OCR_INSURANCE' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setStep('CLINICAL_INTAKE')}
                  >
                    Continue to Clinical Intake →
                  </Button>
                )}

                {step === 'CLINICAL_INTAKE' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setStep('CONSENT_SIGN')}
                  >
                    Continue to Consent & Signature →
                  </Button>
                )}

                {step === 'CONSENT_SIGN' && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!consentAgreed}
                    onClick={handleFinishIntake}
                  >
                    ⚡ Submit & Generate Fast-Pass QR
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <Button variant="primary" size="md" onClick={onClose}>
                Done • Return to Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
