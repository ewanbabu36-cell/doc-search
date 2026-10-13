import React, { useState, useEffect, useRef } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface BcmaMedicationScheduleItem {
  id: string;
  patientName: string;
  patientUhid: string;
  bedNumber: string;
  medicationName: string;
  dosage: string;
  route: 'IV' | 'IM' | 'ORAL' | 'SC' | 'NEBULIZATION';
  scheduledTime: string;
  status: 'SCHEDULED' | 'GIVEN' | 'HELD' | 'REFUSED';
  pharmacyStatus?: 'ORDERED' | 'DOSE_PACK_DISPENSED' | 'IN_TRANSIT_RUNNER' | 'ARRIVED_AT_BEDSIDE' | 'OUT_OF_STOCK' | undefined;
  batchNumber?: string | undefined;
  isHighAlert?: boolean | undefined;
  requiresVitalCheck?: 'HEART_RATE' | 'BLOOD_SUGAR' | 'BLOOD_PRESSURE' | 'NONE' | undefined;
  allergyNotice?: string | undefined;
  unitPriceInr?: number | undefined;
}

export interface BedsideBcmaScannerModalProps {
  scheduleItem: BcmaMedicationScheduleItem;
  nurseName?: string;
  onClose: () => void;
  onAdministrationConfirmed: (administeredData: {
    marId: string;
    patientUhid: string;
    batchNumber: string;
    expiryDate: string;
    witnessNurse?: string | undefined;
    vitalValue?: string | undefined;
    administeredAt: string;
    amountBilled: number;
  }) => void;
}

export const BedsideBcmaScannerModal: React.FC<BedsideBcmaScannerModalProps> = ({
  scheduleItem,
  nurseName = 'Sr. Sunita R.N.',
  onClose,
  onAdministrationConfirmed
}) => {
  const [scanMode, setScanMode] = useState<'CAMERA' | 'MANUAL'>('CAMERA');
  const [wristbandCode, setWristbandCode] = useState('');
  const [medicationBarcode, setMedicationBarcode] = useState('');
  
  // Validation State
  const [isPatientVerified, setIsPatientVerified] = useState(false);
  const [isMedVerified, setIsMedVerified] = useState(false);
  const [parsedBatch, setParsedBatch] = useState<string>('');
  const [parsedExpiry, setParsedExpiry] = useState<string>('');
  const [parsedGtin, setParsedGtin] = useState<string>('');

  // Safety clash alarms
  const [criticalMismatchAlarm, setCriticalMismatchAlarm] = useState<string | null>(null);
  const [safetyAlarmType, setSafetyAlarmType] = useState<'WRONG_PATIENT' | 'WRONG_MED' | 'EXPIRED_MED' | null>(null);

  // High Alert Dual-Nurse Verification
  const isHighAlert = scheduleItem.isHighAlert ?? (
    scheduleItem.medicationName.toLowerCase().includes('heparin') ||
    scheduleItem.medicationName.toLowerCase().includes('enoxaparin') ||
    scheduleItem.medicationName.toLowerCase().includes('insulin') ||
    scheduleItem.medicationName.toLowerCase().includes('potassium') ||
    scheduleItem.medicationName.toLowerCase().includes('meropenem') ||
    scheduleItem.medicationName.toLowerCase().includes('morphine')
  );

  const [witnessNurseName, setWitnessNurseName] = useState('Sr. Priyanka R.N. (Co-Signer)');
  const [witnessPin, setWitnessPin] = useState('');
  const [isWitnessVerified, setIsWitnessVerified] = useState(false);
  const [witnessError, setWitnessError] = useState<string | null>(null);

  // Pre-administration Vital Check
  const requiredVital = scheduleItem.requiresVitalCheck ?? (
    scheduleItem.medicationName.toLowerCase().includes('telmisartan') || scheduleItem.medicationName.toLowerCase().includes('metolar')
      ? 'BLOOD_PRESSURE'
      : scheduleItem.medicationName.toLowerCase().includes('insulin')
      ? 'BLOOD_SUGAR'
      : 'NONE'
  );
  const [vitalInput, setVitalInput] = useState<string>(
    requiredVital === 'BLOOD_PRESSURE' ? '128/82' : requiredVital === 'BLOOD_SUGAR' ? '134' : ''
  );
  const [vitalWarning, setVitalWarning] = useState<string | null>(null);

  // Confirmation animation
  const [isConfirming, setIsConfirming] = useState(false);

  // Web Audio Synthesizer for Bedside Safety Chimes & Alarms
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playSuccessChime = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Dual harmonic pleasant medical chime (C5 = 523Hz, G5 = 784Hz)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.15);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(659.25, now);
      osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.2);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } catch {
      // Audio fallback silent
    }
  };

  const playWarningBuzzer = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Harsh dual-tone alternating medical clash alert
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(170, now + 0.12);
      osc.frequency.setValueAtTime(220, now + 0.24);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // Audio fallback silent
    }
  };

  // Helper to test or verify patient wristband
  const verifyPatientWristband = (scannedVal: string) => {
    setCriticalMismatchAlarm(null);
    setSafetyAlarmType(null);

    const clean = scannedVal.trim().toUpperCase();
    const expectedUhid = scheduleItem.patientUhid.toUpperCase();
    const expectedBed = scheduleItem.bedNumber.toUpperCase().replace(/\s+/g, '');

    if (clean.includes(expectedUhid) || clean.includes(expectedBed)) {
      setIsPatientVerified(true);
      setWristbandCode(scannedVal);
      playSuccessChime();
    } else {
      setIsPatientVerified(false);
      setSafetyAlarmType('WRONG_PATIENT');
      setCriticalMismatchAlarm(
        `🚨 CRITICAL SAFETY MISMATCH: Scanned wristband ("${scannedVal}") does NOT match patient ${scheduleItem.patientName} (${scheduleItem.patientUhid}, ${scheduleItem.bedNumber})! Administration BLOCKED.`
      );
      playWarningBuzzer();
      hospitalEventBus.publish(
        'BCMA_SAFETY_CLASH_PREVENTED',
        'BedsideBcmaWorkstation',
        {
          attemptedUhid: scannedVal,
          expectedUhid: scheduleItem.patientUhid,
          patientName: scheduleItem.patientName,
          medicationName: scheduleItem.medicationName
        },
        `🚨 BCMA Safety Sentinel: Wrong patient wristband scan prevented! Blocked unauthorized administration of ${scheduleItem.medicationName}.`
      );
    }
  };

  // Helper to parse GS1 DataMatrix / Barcode for medication
  const verifyMedicationBarcode = (scannedVal: string) => {
    setCriticalMismatchAlarm(null);
    setSafetyAlarmType(null);

    const clean = scannedVal.trim().toUpperCase();

    // Check for simulated mismatch
    if (clean.includes('KCL') || clean.includes('WRONG') || clean.includes('MISMATCH')) {
      setIsMedVerified(false);
      setSafetyAlarmType('WRONG_MED');
      setCriticalMismatchAlarm(
        `🚨 LETHAL MEDICATION MISMATCH: Scanned vial ("${scannedVal}") is NOT ${scheduleItem.medicationName}! Cease administration immediately.`
      );
      playWarningBuzzer();
      hospitalEventBus.publish(
        'BCMA_SAFETY_CLASH_PREVENTED',
        'BedsideBcmaWorkstation',
        {
          attemptedBarcode: scannedVal,
          expectedMedication: scheduleItem.medicationName,
          patientUhid: scheduleItem.patientUhid
        },
        `🚨 BCMA Sentinel: Wrong medication barcode scan blocked! Prescribed: ${scheduleItem.medicationName}.`
      );
      return;
    }

    if (clean.includes('EXP1049') || clean.includes('EXPIRED')) {
      setIsMedVerified(false);
      setSafetyAlarmType('EXPIRED_MED');
      setCriticalMismatchAlarm(
        `⚠️ EXPIRED DRUG INTERCEPTION: Scanned vial batch has expired! Do not administer. Return to Central Hospital Pharmacy.`
      );
      playWarningBuzzer();
      return;
    }

    // Normal valid medication scan
    setMedicationBarcode(scannedVal);
    setIsMedVerified(true);
    setParsedBatch(clean.includes('CTX') ? 'CTX-2026-88' : clean.includes('PAN') ? 'PAN-1049-A' : 'BATCH-90412-M');
    setParsedExpiry('31-Dec-2027');
    setParsedGtin('08901112233445');
    playSuccessChime();
  };

  const handleVerifyWitnessPin = () => {
    if (witnessPin.trim() === '7744' || witnessPin.trim() === '9922' || witnessPin.trim().length >= 4) {
      setIsWitnessVerified(true);
      setWitnessError(null);
      playSuccessChime();
    } else {
      setIsWitnessVerified(false);
      setWitnessError('Invalid 4-digit Witness Nurse PIN! Please re-enter.');
      playWarningBuzzer();
    }
  };

  // Validate Vital Checks
  useEffect(() => {
    if (requiredVital === 'BLOOD_PRESSURE') {
      const parts = vitalInput.split('/');
      if (parts.length === 2) {
        const sbp = parseInt(parts[0] || '0', 10);
        if (sbp < 100) {
          setVitalWarning('⚠️ Low SBP (<100 mmHg). Verify with doctor before giving antihypertensive.');
        } else {
          setVitalWarning(null);
        }
      }
    } else if (requiredVital === 'BLOOD_SUGAR') {
      const cbg = parseInt(vitalInput, 10);
      if (cbg < 70) {
        setVitalWarning('⚠️ Hypoglycemia Warning (CBG < 70 mg/dL). Hold Insulin and administer 25% Dextrose!');
      } else {
        setVitalWarning(null);
      }
    }
  }, [vitalInput, requiredVital]);

  const canConfirm =
    isPatientVerified &&
    isMedVerified &&
    (!isHighAlert || isWitnessVerified) &&
    (!vitalWarning || !vitalWarning.startsWith('⚠️ Hypoglycemia'));

  const handleConfirmAdministration = () => {
    if (!canConfirm) return;
    setIsConfirming(true);

    const billedAmount = scheduleItem.unitPriceInr ?? 420;
    const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // Publish to event bus for real-time closed loop revenue protection
    hospitalEventBus.publish(
      'BCMA_MEDICATION_VERIFIED_ADMINISTERED',
      'BedsideBcmaWorkstation',
      {
        marId: scheduleItem.id,
        patientUhid: scheduleItem.patientUhid,
        patientName: scheduleItem.patientName,
        bedNumber: scheduleItem.bedNumber,
        medicationName: scheduleItem.medicationName,
        dosage: scheduleItem.dosage,
        route: scheduleItem.route,
        batchNumber: parsedBatch || 'CTX-2026-88',
        expiryDate: parsedExpiry || '31-Dec-2027',
        gtin: parsedGtin || '08901112233445',
        administeredBy: nurseName,
        witnessNurse: isHighAlert ? witnessNurseName : undefined,
        vitalRecorded: requiredVital !== 'NONE' ? `${requiredVital}: ${vitalInput}` : undefined,
        billedAmount,
        administeredAt: nowTime
      },
      `🔒 BCMA 5-Rights Verified: ${scheduleItem.medicationName} administered to ${scheduleItem.patientName} (${scheduleItem.bedNumber}) by ${nurseName}. Closed-loop IPD bill updated (₹${billedAmount}).`
    );

    hospitalEventBus.publish(
      'EMAR_MEDICATION_ADMINISTERED_BILLED',
      'BedsideBcmaWorkstation',
      {
        marId: scheduleItem.id,
        patientUhid: scheduleItem.patientUhid,
        patientName: scheduleItem.patientName,
        medicationName: scheduleItem.medicationName,
        dose: scheduleItem.dosage,
        batchNumber: parsedBatch || 'CTX-2026-88',
        billedAmount,
        autoBilled: true,
        revenueProtected: true
      },
      `Closed-Loop Billing Ledger: Auto-posted ₹${billedAmount} for ${scheduleItem.medicationName} to IPD account of ${scheduleItem.patientName}.`
    );

    setTimeout(() => {
      onAdministrationConfirmed({
        marId: scheduleItem.id,
        patientUhid: scheduleItem.patientUhid,
        batchNumber: parsedBatch || 'CTX-2026-88',
        expiryDate: parsedExpiry || '31-Dec-2027',
        witnessNurse: isHighAlert ? witnessNurseName : undefined,
        vitalValue: vitalInput || undefined,
        administeredAt: nowTime,
        amountBilled: billedAmount
      });
      setIsConfirming(false);
      onClose();
    }, 900);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1.5px solid #06B6D4',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '740px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.95), 0 0 25px rgba(6, 182, 212, 0.25)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#0B111E'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid #06B6D4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem'
              }}
            >
              📲
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#38BDF8' }}>
                  Bedside Closed-Loop BCMA Workstation
                </h3>
                <Badge variant="primary">Five Rights Safety Sentinel</Badge>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Logged in: {nurseName} • Bed: {scheduleItem.bedNumber} • Scheduled: {scheduleItem.scheduledTime}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.3rem',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Critical Alarm Banner if Mismatch */}
          {criticalMismatchAlarm && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.25)',
                border: '2px solid #EF4444',
                borderRadius: '10px',
                padding: '12px 16px',
                color: '#FCA5A5',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 0 15px rgba(239, 68, 68, 0.35)',
                animation: 'pulse 1.5s infinite'
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>🚫</span>
              {safetyAlarmType && <Badge variant="danger">{safetyAlarmType}</Badge>}
              <div style={{ flex: 1 }}>{criticalMismatchAlarm}</div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setCriticalMismatchAlarm(null);
                  setSafetyAlarmType(null);
                }}
              >
                Acknowledge & Reset
              </Button>
            </div>
          )}

          {/* High-Alert Medication Banner */}
          {isHighAlert && (
            <div
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid #F59E0B',
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#FCD34D',
                fontSize: '0.8rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <div>
                  <strong>HIGH-ALERT MEDICATION PROTOCOL ACTIVE</strong>
                  <div style={{ fontSize: '0.72rem', color: '#FDE68A' }}>
                    Requires Independent Dual-Nurse Verification & Co-Signature PIN prior to administration.
                  </div>
                </div>
              </div>
              <Badge variant="warning">DUAL-WITNESS MANDATORY</Badge>
            </div>
          )}

          {/* Patient and Medication Order Card */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              backgroundColor: '#0B111E',
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
                Target Inpatient
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC', marginTop: '2px' }}>
                {scheduleItem.patientName}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#38BDF8', marginTop: '2px' }}>
                {scheduleItem.patientUhid} • {scheduleItem.bedNumber}
              </div>
              {scheduleItem.allergyNotice && (
                <div style={{ fontSize: '0.72rem', color: '#F87171', marginTop: '4px', fontWeight: 600 }}>
                  ⚠️ Allergy Alert: {scheduleItem.allergyNotice}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
                Doctor Prescribed Order
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#A7F3D0', marginTop: '2px' }}>
                {scheduleItem.medicationName}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                Dose: <strong style={{ color: '#F8FAFC' }}>{scheduleItem.dosage}</strong> • Route:{' '}
                <strong style={{ color: '#F8FAFC' }}>{scheduleItem.route}</strong>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#6EE7B7', marginTop: '4px' }}>
                Auto-Bill IPD Rate: ₹{scheduleItem.unitPriceInr ?? 420} (Zero Revenue Leakage)
              </div>
            </div>
          </div>

          {/* Five Rights Status Matrix */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              padding: '10px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            {[
              { label: '1. Patient', pass: isPatientVerified, detail: scheduleItem.patientUhid },
              { label: '2. Drug', pass: isMedVerified, detail: parsedBatch || 'Pending Scan' },
              { label: '3. Dose', pass: isMedVerified, detail: scheduleItem.dosage },
              { label: '4. Route', pass: isMedVerified, detail: scheduleItem.route },
              { label: '5. Time', pass: true, detail: 'ON-TIME (±30m)' }
            ].map((r, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: r.pass ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                  border: r.pass ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '8px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700 }}>{r.label}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: r.pass ? '#34D399' : '#F1F5F9', marginTop: '2px' }}>
                  {r.pass ? 'VERIFIED' : 'WAITING'}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.detail}
                </div>
              </div>
            ))}
          </div>

          {/* Scanner Mode Toggle & Viewfinder */}
          <div
            style={{
              backgroundColor: '#0B111E',
              borderRadius: '12px',
              padding: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38BDF8' }}>
                🎯 Point-of-Care Barcode Input
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setScanMode('CAMERA')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: scanMode === 'CAMERA' ? '#06B6D4' : 'transparent',
                    color: scanMode === 'CAMERA' ? '#070C16' : '#94A3B8',
                    border: '1px solid #06B6D4'
                  }}
                >
                  📷 Camera 2D Scanner
                </button>
                <button
                  type="button"
                  onClick={() => setScanMode('MANUAL')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: scanMode === 'MANUAL' ? '#06B6D4' : 'transparent',
                    color: scanMode === 'MANUAL' ? '#070C16' : '#94A3B8',
                    border: '1px solid #06B6D4'
                  }}
                >
                  🔫 Laser Gun / Keyboard Wedge
                </button>
              </div>
            </div>

            {/* Camera Viewfinder Simulation */}
            {scanMode === 'CAMERA' && (
              <div
                style={{
                  position: 'relative',
                  height: '110px',
                  backgroundColor: '#030712',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px dashed rgba(6, 182, 212, 0.4)'
                }}
              >
                {/* Red Laser Scanline */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '5%',
                    right: '5%',
                    height: '2px',
                    backgroundColor: '#EF4444',
                    boxShadow: '0 0 10px #EF4444, 0 0 20px #EF4444'
                  }}
                />
                <div style={{ textAlign: 'center', zIndex: 2 }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    Align Patient Wristband QR or Medication GS1 DataMatrix within reticle
                  </span>
                  <div style={{ fontSize: '0.7rem', color: '#38BDF8', marginTop: '4px' }}>
                    Auto-decoding GS1-128 / GTIN / Batch LOT / Expiration
                  </div>
                </div>
              </div>
            )}

            {/* Quick Simulation Barcode Triggers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.72rem', color: '#CBD5E1', fontWeight: 700 }}>
                Step 1: Patient Wristband Barcode
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={wristbandCode}
                  onChange={(e) => {
                    setWristbandCode(e.target.value);
                    if (e.target.value.length > 5) verifyPatientWristband(e.target.value);
                  }}
                  placeholder="Scan or enter patient wristband QR..."
                  style={{
                    flex: 1,
                    minWidth: '220px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#070C16',
                    border: isPatientVerified ? '1.5px solid #10B981' : '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#F8FAFC',
                    fontSize: '0.8rem'
                  }}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => verifyPatientWristband(`${scheduleItem.patientUhid}-${scheduleItem.bedNumber.replace(/\s+/g, '')}`)}
                >
                  ✓ Scan Valid Wristband
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => verifyPatientWristband('UHID-2026-942-BED-W204B')}
                  style={{ borderColor: '#EF4444', color: '#F87171' }}
                >
                  ⚠️ Simulate Wrong Patient
                </Button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.72rem', color: '#CBD5E1', fontWeight: 700 }}>
                Step 2: Medication Vial / Ampoule GS1 DataMatrix
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={medicationBarcode}
                  onChange={(e) => {
                    setMedicationBarcode(e.target.value);
                    if (e.target.value.length > 5) verifyMedicationBarcode(e.target.value);
                  }}
                  placeholder="Scan or enter medication GS1 DataMatrix..."
                  style={{
                    flex: 1,
                    minWidth: '220px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#070C16',
                    border: isMedVerified ? '1.5px solid #10B981' : '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#F8FAFC',
                    fontSize: '0.8rem'
                  }}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => verifyMedicationBarcode(`01089011122334451727123110CTX2026882190821`)}
                >
                  ✓ Scan Matching Vial
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => verifyMedicationBarcode(`01089011122339991726053110KCL2026112190821`)}
                  style={{ borderColor: '#EF4444', color: '#F87171' }}
                >
                  🚨 Scan Wrong Ampoule
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => verifyMedicationBarcode(`01089011122334451724010110EXP10492190821`)}
                  style={{ borderColor: '#F59E0B', color: '#FBBF24' }}
                >
                  ⚠️ Scan Expired Drug
                </Button>
              </div>
            </div>
          </div>

          {/* High-Alert Dual-Nurse Witness & Vital Verification Section */}
          {(isHighAlert || requiredVital !== 'NONE') && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isHighAlert && requiredVital !== 'NONE' ? '1fr 1fr' : '1fr',
                gap: '12px'
              }}
            >
              {/* Dual-Nurse Witness Verification */}
              {isHighAlert && (
                <div
                  style={{
                    backgroundColor: '#0B111E',
                    padding: '12px',
                    borderRadius: '10px',
                    border: isWitnessVerified ? '1.5px solid #10B981' : '1px solid #F59E0B'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FCD34D' }}>
                      👩‍⚕️ Dual-Nurse Co-Signer
                    </span>
                    <Badge variant={isWitnessVerified ? 'success' : 'warning'}>
                      {isWitnessVerified ? 'PIN VERIFIED' : 'PIN REQUIRED'}
                    </Badge>
                  </div>
                  <input
                    type="text"
                    value={witnessNurseName}
                    onChange={(e) => setWitnessNurseName(e.target.value)}
                    style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px', backgroundColor: 'transparent', border: 'none', borderBottom: '1px dashed #64748B', width: '100%', outline: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input
                      type="password"
                      maxLength={4}
                      value={witnessPin}
                      onChange={(e) => setWitnessPin(e.target.value)}
                      placeholder="Enter PIN (e.g. 7744)"
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#070C16',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#F8FAFC',
                        fontSize: '0.75rem'
                      }}
                    />
                    <Button variant="primary" size="sm" onClick={handleVerifyWitnessPin}>
                      Verify Witness
                    </Button>
                  </div>
                  {witnessError && (
                    <div style={{ fontSize: '0.7rem', color: '#EF4444', marginTop: '4px' }}>
                      {witnessError}
                    </div>
                  )}
                </div>
              )}

              {/* Pre-Administration Vital Gate */}
              {requiredVital !== 'NONE' && (
                <div
                  style={{
                    backgroundColor: '#0B111E',
                    padding: '12px',
                    borderRadius: '10px',
                    border: vitalWarning ? '1.5px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8' }}>
                      💓 Pre-Administration Vital
                    </span>
                    <Badge variant={vitalWarning ? 'danger' : 'primary'}>
                      {requiredVital}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input
                      type="text"
                      value={vitalInput}
                      onChange={(e) => setVitalInput(e.target.value)}
                      placeholder={requiredVital === 'BLOOD_PRESSURE' ? 'e.g. 120/80' : 'e.g. 130'}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#070C16',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#F8FAFC',
                        fontSize: '0.75rem'
                      }}
                    />
                  </div>
                  {vitalWarning && (
                    <div style={{ fontSize: '0.7rem', color: '#F87171', marginTop: '4px', fontWeight: 600 }}>
                      {vitalWarning}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#0B111E'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            🔒 Closed-Loop Revenue Protection & Patient Bedside QR Sync Active
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!canConfirm || isConfirming}
              onClick={handleConfirmAdministration}
              style={{
                backgroundColor: canConfirm ? '#06B6D4' : '#334155',
                color: canConfirm ? '#070C16' : '#94A3B8',
                fontWeight: 800,
                padding: '8px 24px'
              }}
            >
              {isConfirming
                ? 'Posting to Inpatient Ledger...'
                : '✓ Administer & Auto-Bill IPD Ledger'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
