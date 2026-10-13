import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Badge, Button, Input } from '@docsearch/ui-kit';
import type { TransfusionRecordDto, BloodIssueDto, BloodComponentDto, TransfusionBloodGroup } from '@docsearch/api-contracts';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface TransfusionWorkbenchViewProps {
  transfusions: TransfusionRecordDto[];
  issues?: BloodIssueDto[] | undefined;
  components?: BloodComponentDto[] | undefined;
  onOpenObservation: (t: TransfusionRecordDto) => void;
  onOpenReaction: (t: TransfusionRecordDto) => void;
  onOpenNewTransfusion: () => void;
}

// Red Blood Cell ABO/Rh Compatibility Matrix
export const PRBC_COMPATIBILITY_MATRIX: Record<TransfusionBloodGroup, TransfusionBloodGroup[]> = {
  O_NEGATIVE: ['O_NEGATIVE'],
  O_POSITIVE: ['O_NEGATIVE', 'O_POSITIVE'],
  A_NEGATIVE: ['O_NEGATIVE', 'A_NEGATIVE'],
  A_POSITIVE: ['O_NEGATIVE', 'O_POSITIVE', 'A_NEGATIVE', 'A_POSITIVE'],
  B_NEGATIVE: ['O_NEGATIVE', 'B_NEGATIVE'],
  B_POSITIVE: ['O_NEGATIVE', 'O_POSITIVE', 'B_NEGATIVE', 'B_POSITIVE'],
  AB_NEGATIVE: ['O_NEGATIVE', 'A_NEGATIVE', 'B_NEGATIVE', 'AB_NEGATIVE'],
  AB_POSITIVE: [
    'O_NEGATIVE',
    'O_POSITIVE',
    'A_NEGATIVE',
    'A_POSITIVE',
    'B_NEGATIVE',
    'B_POSITIVE',
    'AB_NEGATIVE',
    'AB_POSITIVE'
  ]
};

export const TransfusionWorkbenchView: React.FC<TransfusionWorkbenchViewProps> = ({
  transfusions,
  issues = [],
  components = [],
  onOpenObservation,
  onOpenReaction,
  onOpenNewTransfusion
}) => {
  // Bedside 2-Step Barcode Scanner State
  const [patientScan, setPatientScan] = useState('MRN-772101');
  const [patientName, setPatientName] = useState('David K. Miller');
  const [patientBloodGroup, setPatientBloodGroup] = useState<TransfusionBloodGroup>('O_NEGATIVE');
  const [patientWardBed, setPatientWardBed] = useState('ICU Bed 204');

  const [unitScan, setUnitScan] = useState('PRBC-2026-08-001');
  const [unitBloodGroup, setUnitBloodGroup] = useState<TransfusionBloodGroup>('O_NEGATIVE');
  const [componentType, setComponentType] = useState('PACKED_RED_BLOOD_CELLS_PRBC');

  // Dual-Nurse Verification Lockout
  const [nurse1Name, setNurse1Name] = useState('Staff Nurse Priya Sharma, RN');
  const [nurse2Name, setNurse2Name] = useState('Senior Sister Anjali Verma, RN');
  const [dualNurseConfirmed, setDualNurseConfirmed] = useState(true);

  // Lock Token & Verification State
  const [verifiedToken, setVerifiedToken] = useState<string | null>('COMPAT-LOCK-ABO-88219');
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(
    'Dual-scan cross-match PASSED. Lock token COMPAT-LOCK-ABO-88219 armed.'
  );

  // Cold Chain Live Transit Timer (30-Minute Bedside Hang Rule)
  const [coldChainMinutesElapsed, setColdChainMinutesElapsed] = useState(14);
  const [coldBoxTempC] = useState(3.8);
  const [bleSensorId] = useState('BT-COLD-088');
  const [bleBattery] = useState(94);
  const [soundMuted, setSoundMuted] = useState(false);

  // Audio Confirmation & Alert Chime (Web Audio API)
  const playSafetySound = useCallback((isSuccess: boolean) => {
    if (soundMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      if (isSuccess) {
        // Melodic 2-tone chord
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start(ctx.currentTime + 0.1);
        osc1.stop(ctx.currentTime + 0.4);
        osc2.stop(ctx.currentTime + 0.4);
      } else {
        // Harsh dissonance buzzer
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ctx.currentTime);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      }
    } catch {
      // Audio policy fallback
    }
  }, [soundMuted]);

  // Cold-chain transit telemetry simulated calculations
  const inTransitIssues = useMemo(() => {
    return issues.map((iss) => {
      const elapsedMinutes = Math.max(1, Math.round((Date.now() - new Date(iss.issuedAt).getTime()) / 60000));
      const isColdChainBreach = elapsedMinutes > 30;
      const isColdChainWarning = elapsedMinutes >= 20 && elapsedMinutes <= 30;
      return {
        ...iss,
        elapsedMinutes,
        isColdChainBreach,
        isColdChainWarning
      };
    });
  }, [issues]);

  // Real-time 30-min timer increment
  useEffect(() => {
    const timer = setInterval(() => {
      setColdChainMinutesElapsed((prev) => (prev < 40 ? prev + 1 : prev));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Evaluate ABO compatibility for the scanner station
  const isCompatible = useMemo(() => {
    if (componentType.includes('PLASMA')) {
      if (unitBloodGroup.startsWith('AB')) return true;
      return patientBloodGroup === unitBloodGroup;
    }
    const compatibleDonors = PRBC_COMPATIBILITY_MATRIX[patientBloodGroup] || [];
    return compatibleDonors.includes(unitBloodGroup);
  }, [patientBloodGroup, unitBloodGroup, componentType]);

  const handleVerifyBedsideCrossMatch = () => {
    if (!isCompatible) {
      playSafetySound(false);
      setVerificationFeedback('FATAL ABO INCOMPATIBILITY! Transfusion strictly blocked by system safety gate.');
      setVerifiedToken(null);
      return;
    }

    if (!dualNurseConfirmed) {
      alert('NABH Transfusion Safety Policy requires Dual-Nurse sign-off before unlocking token.');
      return;
    }

    playSafetySound(true);
    const token = `COMPAT-LOCK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setVerifiedToken(token);
    setVerificationFeedback(`Dual-scan cross-match PASSED & DUAL-NURSE CERTIFIED. Lock token: ${token}`);

    hospitalEventBus.publish(
      'BLOOD_CROSS_MATCH_VERIFIED',
      'BEDSIDE_TRANSFUSION_WORKBENCH',
      {
        patientName,
        patientMrn: patientScan,
        unitScan,
        componentType,
        patientBloodGroup,
        unitBloodGroup,
        nurse1: nurse1Name,
        nurse2: nurse2Name,
        lockToken: token,
        timestamp: new Date().toISOString()
      },
      `Bedside 2-Step Barcode Cross-Match Verified: Patient ${patientName} (${patientBloodGroup}) matches Unit ${unitScan} (${unitBloodGroup}).`
    );
  };

  const handleBroadcastColdChainBreach = (iss: typeof inTransitIssues[0]) => {
    playSafetySound(false);
    hospitalEventBus.publish(
      'COLD_CHAIN_BREACH_ALERTED',
      'COLD_CHAIN_TRANSIT_MONITOR',
      {
        issueCode: iss.issueCode,
        componentCode: iss.componentCode,
        patientName: iss.patientName,
        patientMrn: iss.patientMrn,
        elapsedMinutes: iss.elapsedMinutes,
        destinationDepartment: iss.destinationDepartment,
        timestamp: new Date().toISOString()
      },
      `COLD-CHAIN BREACH ALERT: Unit ${iss.componentCode} issued to ${iss.destinationDepartment} has exceeded 30-min window (${iss.elapsedMinutes}m elapsed). Administration blocked.`
    );
    alert(`🚨 Cold-Chain Breach reported for Unit ${iss.componentCode}. Blood Bank Medical Officer notified.`);
  };

  const handleShareWhatsAppHemovigilance = (t: TransfusionRecordDto) => {
    const text = encodeURIComponent(
      `🚨 *DOCSEARCH HEMOVIGILANCE STAT ALERT*\n` +
      `• *Transfusion ID*: ${t.transfusionCode}\n` +
      `• *Patient*: ${t.patientName} (${t.bloodGroup.replace('_', ' ')}) • MRN: ${t.patientMrn}\n` +
      `• *Unit DIN*: ${t.componentCode} (${t.componentType.replace(/_/g, ' ')})\n` +
      `• *Administering Nurse*: ${t.administeredByNurse}\n` +
      `• *Incident Status*: HALTED DUE TO TRANSFUSION REACTION\n` +
      `• *Immediate Action*: Infusion clamped, Normal Saline KVO initiated, Blood bag & tubing quarantined for STAT DAT.\n\n` +
      `_Reported to Blood Bank Medical Officer on duty via DocSearch Hospital OS._`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Metrics
  const activeTransfusions = transfusions.filter((t) => t.status === 'IN_PROGRESS');
  const uneventfulTransfusions = transfusions.filter((t) => t.status === 'COMPLETED_UNEVENTFUL');
  const haltedTransfusions = transfusions.filter((t) => t.status === 'HALTED_DUE_TO_REACTION');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#F8FAFC' }}>
              🩸 Blood Bank Vein-to-Vein Cold Chain & Bedside Crossmatch Desk
            </h2>
            <Badge variant="danger">ISBT-128 Lockout Active</Badge>
          </div>
          <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '0.8125rem' }}>
            NABH / AABB Vein-to-Vein tracking: Donor phlebotomy ➔ Cold Vault (+2°C to +6°C) ➔ IoT BLE Cold Box ➔ Dual-Nurse Bedside Barcode Crossmatch.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setSoundMuted(!soundMuted)}
            style={{
              backgroundColor: soundMuted ? '#1E293B' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${soundMuted ? '#334155' : '#10B981'}`,
              color: soundMuted ? '#94A3B8' : '#34D399',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {soundMuted ? '🔇 Audio Muted' : '🔔 Crossmatch Audio Chime ON'}
          </button>

          <Badge variant="neutral">Bank Stock: {components.length} Units</Badge>

          <Button
            variant="primary"
            onClick={onOpenNewTransfusion}
            style={{ backgroundColor: '#DC2626', borderColor: '#DC2626', fontWeight: 800 }}
          >
            + Initiate Bedside Transfusion
          </Button>
        </div>
      </div>

      {/* VEIN-TO-VEIN 5-STAGE PIPELINE STEPPER */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC' }}>
            🔗 Vein-to-Vein Cold Chain Integrity Trace (Vein 1 ➔ Vein 2)
          </span>
          <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700 }}>
            BLE IoT Cold-Box: {bleSensorId} • Temp: {coldBoxTempC}°C • Battery: {bleBattery}%
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {[
            { step: '1', title: 'Donor Phlebotomy', desc: 'Blood bag collection & pilot tubes', status: 'COMPLETED', color: '#10B981' },
            { step: '2', title: 'Component Separation', desc: 'Centrifuged to PRBC/FFP/Platelets', status: 'COMPLETED', color: '#10B981' },
            { step: '3', title: 'Cold Vault (+2°C to +6°C)', desc: 'Validated temperature refrigeration', status: 'COMPLETED', color: '#10B981' },
            { step: '4', title: 'Cold-Box Active Transit', desc: `${coldChainMinutesElapsed}m elapsed (Limit: 30m)`, status: coldChainMinutesElapsed > 30 ? 'BREACHED' : 'IN_TRANSIT', color: coldChainMinutesElapsed > 30 ? '#EF4444' : '#F59E0B' },
            { step: '5', title: 'Bedside Barcode Lockout', desc: verifiedToken ? 'Dual-Scan Verified' : 'Scan Required', status: verifiedToken ? 'VERIFIED' : 'PENDING', color: verifiedToken ? '#10B981' : '#38BDF8' }
          ].map((s) => (
            <div
              key={s.step}
              style={{
                backgroundColor: '#1E293B',
                border: `1.5px solid ${s.color}`,
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: s.color, color: '#FFF', fontSize: '0.65rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.step}
                </span>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: s.color }}>{s.status}</span>
              </div>
              <strong style={{ fontSize: '0.78rem', color: '#F8FAFC', marginTop: '2px' }}>{s.title}</strong>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Telemetry Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid #0284C7', borderRadius: '10px', padding: '12px 16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8' }}>Active Bedside Infusions</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F8FAFC', marginTop: '4px' }}>{activeTransfusions.length} Running</div>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Continuous vitals monitoring</div>
        </div>

        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34D399' }}>Uneventful Completions</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F8FAFC', marginTop: '4px' }}>{uneventfulTransfusions.length} Safe</div>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Post-transfusion checks passed</div>
        </div>

        <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid #F59E0B', borderRadius: '10px', padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FBBF24' }}>Cold-Box In Transit</span>
            <Badge variant="warning">{30 - coldChainMinutesElapsed}m left</Badge>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F8FAFC', marginTop: '4px' }}>
            {coldChainMinutesElapsed}m / 30m
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>30-minute hang rule timer</div>
        </div>

        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '10px', padding: '12px 16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F87171' }}>Hemovigilance Reactions</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F8FAFC', marginTop: '4px' }}>{haltedTransfusions.length} Aborted</div>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Quarantined for STAT DAT & culture</div>
        </div>
      </div>

      {/* SECTION 1: BEDSIDE 2-STEP BARCODE CROSS-MATCH & DUAL-NURSE LOCKOUT */}
      <Card style={{ backgroundColor: '#0F172A', border: '2px solid #334155', borderRadius: '14px', padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #1E293B', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#DC2626', color: '#FFF', fontSize: '0.75rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              1
            </span>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Bedside 2-Step Barcode Cross-Match & ABO Dual-Nurse Verification Lockout
            </h3>
          </div>

          {verifiedToken ? (
            <Badge variant="success">🛡️ Locked Token: {verifiedToken}</Badge>
          ) : isCompatible ? (
            <Badge variant="warning">Verification Pending</Badge>
          ) : (
            <Badge variant="danger">ABO MISMATCH DETECTED</Badge>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Step 1A: Patient Wristband Barcode */}
          <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#F8FAFC' }}>
                Step 1: Patient Wristband Scan (UHID / MRN)
              </label>
              <span style={{ fontSize: '0.65rem', color: '#38BDF8', fontFamily: 'monospace' }}>ISBT-128 / Code 128</span>
            </div>

            <Input
              value={patientScan}
              onChange={(e) => setPatientScan(e.target.value)}
              placeholder="Scan Patient Wristband Barcode..."
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', marginTop: '4px' }}>
              <div>
                <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.6875rem' }}>Patient Name:</span>
                <input
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '4px', color: '#F8FAFC', padding: '4px 8px', width: '100%', fontSize: '0.75rem', fontWeight: 700 }}
                />
              </div>

              <div>
                <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.6875rem' }}>Recipient Blood Group:</span>
                <select
                  value={patientBloodGroup}
                  onChange={(e) => {
                    setPatientBloodGroup(e.target.value as TransfusionBloodGroup);
                    setVerifiedToken(null);
                  }}
                  style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '4px', color: '#F8FAFC', padding: '4px 8px', width: '100%', fontSize: '0.75rem', fontWeight: 800 }}
                >
                  <option value="O_NEGATIVE">O Negative (Universal Recipient PRBC)</option>
                  <option value="O_POSITIVE">O Positive</option>
                  <option value="A_POSITIVE">A Positive</option>
                  <option value="A_NEGATIVE">A Negative</option>
                  <option value="B_POSITIVE">B Positive</option>
                  <option value="B_NEGATIVE">B Negative</option>
                  <option value="AB_POSITIVE">AB Positive (Universal Recipient Whole)</option>
                  <option value="AB_NEGATIVE">AB Negative</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>
              <span>Ward / Bed:</span>
              <input
                value={patientWardBed}
                onChange={(e) => setPatientWardBed(e.target.value)}
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  color: '#38BDF8',
                  padding: '2px 6px',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}
              />
            </div>
          </div>

          {/* Step 1B: Blood Bag Barcode */}
          <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#F8FAFC' }}>
                Step 2: Blood Bag DIN Barcode Scan
              </label>
              <span style={{ fontSize: '0.65rem', color: '#F87171', fontFamily: 'monospace' }}>ISBT-128 Unit Barcode</span>
            </div>

            <Input
              value={unitScan}
              onChange={(e) => setUnitScan(e.target.value)}
              placeholder="Scan Blood Bag DIN Barcode..."
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', marginTop: '4px' }}>
              <div>
                <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.6875rem' }}>Component Type:</span>
                <select
                  value={componentType}
                  onChange={(e) => setComponentType(e.target.value)}
                  style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '4px', color: '#F8FAFC', padding: '4px 8px', width: '100%', fontSize: '0.75rem' }}
                >
                  <option value="PACKED_RED_BLOOD_CELLS_PRBC">PRBC (Packed Red Cells)</option>
                  <option value="SINGLE_DONOR_PLATELETS_SDP">SDP (Platelets)</option>
                  <option value="RANDOM_DONOR_PLATELETS_RDP">RDP (Platelets)</option>
                  <option value="FRESH_FROZEN_PLASMA_FFP">FFP (Fresh Frozen Plasma)</option>
                  <option value="CRYOPRECIPITATE">Cryoprecipitate</option>
                </select>
              </div>

              <div>
                <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.6875rem' }}>Donor Unit Blood Group:</span>
                <select
                  value={unitBloodGroup}
                  onChange={(e) => {
                    setUnitBloodGroup(e.target.value as TransfusionBloodGroup);
                    setVerifiedToken(null);
                  }}
                  style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '4px', color: '#F87171', padding: '4px 8px', width: '100%', fontSize: '0.75rem', fontWeight: 800 }}
                >
                  <option value="O_NEGATIVE">O Negative (Universal Donor PRBC)</option>
                  <option value="O_POSITIVE">O Positive</option>
                  <option value="A_POSITIVE">A Positive</option>
                  <option value="A_NEGATIVE">A Negative</option>
                  <option value="B_POSITIVE">B Positive</option>
                  <option value="B_NEGATIVE">B Negative</option>
                  <option value="AB_POSITIVE">AB Positive</option>
                  <option value="AB_NEGATIVE">AB Negative</option>
                </select>
              </div>
            </div>

            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
              Unit Lot: <strong style={{ color: '#F87171', fontFamily: 'monospace' }}>{unitScan}</strong>
            </div>
          </div>
        </div>

        {/* Dual-Nurse Sign-Off Panel */}
        <div style={{ backgroundColor: '#131D31', border: '1px solid #1E293B', borderRadius: '10px', padding: '12px 16px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38BDF8' }}>
              👩‍⚕️ Dual-Nurse Bedside Identity & Label Verification (NABH Mandatory)
            </span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.75rem', color: '#F8FAFC' }}>
              <input
                type="checkbox"
                checked={dualNurseConfirmed}
                onChange={(e) => setDualNurseConfirmed(e.target.checked)}
              />
              <span>Both Nurses Confirmed Verbal ID & Expiry Check</span>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.75rem' }}>
            <div>
              <span style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>Primary Administering Nurse:</span>
              <input
                value={nurse1Name}
                onChange={(e) => setNurse1Name(e.target.value)}
                style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '4px', color: '#F8FAFC', padding: '4px 8px', width: '100%', fontSize: '0.75rem' }}
              />
            </div>
            <div>
              <span style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>Witnessing Registered Nurse:</span>
              <input
                value={nurse2Name}
                onChange={(e) => setNurse2Name(e.target.value)}
                style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '4px', color: '#F8FAFC', padding: '4px 8px', width: '100%', fontSize: '0.75rem' }}
              />
            </div>
          </div>
        </div>

        {/* Compatibility Verdict Banner & Lock Action */}
        <div
          style={{
            marginTop: '14px',
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: isCompatible ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.18)',
            border: isCompatible ? '1.5px solid #10B981' : '2px solid #EF4444',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 900, color: isCompatible ? '#34D399' : '#F87171' }}>
                {isCompatible ? '✓ ABO/Rh SEROLOGIC COMPATIBILITY CONFIRMED' : '⛔ FATAL ABO/Rh INCOMPATIBILITY DETECTED!'}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                (Recipient: <strong>{patientBloodGroup.replace('_', ' ')}</strong> ↔ Donor Unit: <strong>{unitBloodGroup.replace('_', ' ')}</strong>)
              </span>
            </div>

            {verificationFeedback && (
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: isCompatible ? '#A7F3D0' : '#FCA5A5', fontWeight: 700 }}>
                {verificationFeedback}
              </p>
            )}

            {!isCompatible && (
              <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#F87171', fontWeight: 800 }}>
                Administration blocked! Administering this unit will induce an acute intravascular hemolytic reaction.
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              style={{ fontSize: '0.75rem' }}
            >
              🖨️ Print Verification Slip
            </Button>

            <Button
              variant={isCompatible ? 'primary' : 'outline'}
              size="sm"
              disabled={!isCompatible}
              onClick={handleVerifyBedsideCrossMatch}
              style={{
                backgroundColor: isCompatible ? '#10B981' : undefined,
                borderColor: isCompatible ? '#10B981' : undefined,
                fontWeight: 800,
                fontSize: '0.75rem'
              }}
            >
              {verifiedToken ? '✓ Re-Verify Dual Scan' : '⚡ Confirm Bedside Cross-Match'}
            </Button>
          </div>
        </div>
      </Card>

      {/* SECTION 2: COLD-BOX TRANSIT TELEMETRY (30-MINUTE BEDSIDE HANG RULE) */}
      {inTransitIssues.length > 0 && (
        <Card style={{ backgroundColor: '#0F172A', border: '1px solid #F59E0B', borderRadius: '14px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #1E293B', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#F59E0B', color: '#FFF', fontSize: '0.75rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                2
              </span>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: '#F8FAFC', textTransform: 'uppercase' }}>
                Cold-Box Transit Telemetry & 30-Minute Bedside Hang Rule
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#FBBF24', fontWeight: 700 }}>
              NABH Protocol: Hang unit within 30 min of refrigerator dispatch
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '10px' }}>
            {inTransitIssues.map((iss) => (
              <div
                key={iss.id}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: iss.isColdChainBreach ? '2px solid #EF4444' : iss.isColdChainWarning ? '1.5px solid #F59E0B' : '1px solid #10B981',
                  backgroundColor: iss.isColdChainBreach ? 'rgba(239, 68, 68, 0.15)' : '#1E293B',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.8rem', color: '#F8FAFC' }}>
                      {iss.componentCode}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>→ {iss.destinationDepartment}</span>
                    <Badge variant={iss.isColdChainBreach ? 'danger' : iss.isColdChainWarning ? 'warning' : 'success'}>
                      {iss.elapsedMinutes}m elapsed
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px' }}>
                    Patient: <strong>{iss.patientName}</strong> ({iss.patientMrn}) • Cold-Box Temp: {iss.transportBoxTemperatureC}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px' }}>
                    Issued: {new Date(iss.issuedAt).toLocaleTimeString()} by {iss.issuingTechnicianName}
                  </div>
                </div>

                <div>
                  {iss.isColdChainBreach ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleBroadcastColdChainBreach(iss)}
                      style={{ fontWeight: 800, fontSize: '0.72rem' }}
                    >
                      🚨 Report Breach
                    </Button>
                  ) : (
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34D399' }}>
                      ✓ Safe ({30 - iss.elapsedMinutes}m left)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* SECTION 3: ACTIVE BEDSIDE TRANSFUSIONS INFUSION GRID */}
      <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', backgroundColor: '#0B0F19', borderBottom: '1px solid #1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#0284C7', color: '#FFF', fontSize: '0.75rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              3
            </span>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: '#F8FAFC', textTransform: 'uppercase' }}>
              Bedside Transfusion Infusion Grid & Adverse Reaction Console
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Live bedside vital telemetry</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#1E293B', borderBottom: '1px solid #334155', color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 12px' }}>Transfusion ID</th>
                <th style={{ padding: '10px 12px' }}>Patient Name / MRN</th>
                <th style={{ padding: '10px 12px' }}>Component & DIN</th>
                <th style={{ padding: '10px 12px' }}>Administering Nurse</th>
                <th style={{ padding: '10px 12px' }}>Pre-Transfusion Vitals</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Bedside Actions</th>
              </tr>
            </thead>
            <tbody>
              {transfusions.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 800, color: '#38BDF8' }}>
                    {t.transfusionCode}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 800, color: '#F8FAFC' }}>{t.patientName}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                      {t.patientMrn} • {t.bloodGroup.replace('_', ' ')}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ color: '#F8FAFC', fontWeight: 700 }}>{t.componentType.replace(/_/g, ' ')}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.6875rem', color: '#F87171' }}>{t.componentCode}</div>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#CBD5E1' }}>{t.administeredByNurse}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>HR: {t.preTransfusionPulse} bpm</span> • BP: {t.preTransfusionBp} • Temp: {t.preTransfusionTempF}°F
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <Badge variant={t.status === 'COMPLETED_UNEVENTFUL' ? 'success' : t.status === 'IN_PROGRESS' ? 'primary' : 'danger'}>
                      {t.status.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      {t.status === 'IN_PROGRESS' && (
                        <Button variant="outline" size="sm" onClick={() => onOpenObservation(t)} style={{ fontSize: '0.72rem' }}>
                          Post-Vitals
                        </Button>
                      )}
                      <Button
                        variant={t.status === 'HALTED_DUE_TO_REACTION' ? 'outline' : 'danger'}
                        size="sm"
                        onClick={() => onOpenReaction(t)}
                        style={{ fontSize: '0.72rem', fontWeight: 800 }}
                      >
                        {t.status === 'HALTED_DUE_TO_REACTION' ? 'View Reaction' : '🚨 Abort & Report'}
                      </Button>
                      {t.status === 'HALTED_DUE_TO_REACTION' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShareWhatsAppHemovigilance(t)}
                          style={{ fontSize: '0.72rem', borderColor: '#22C55E', color: '#4ADE80' }}
                        >
                          💬 WhatsApp
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
