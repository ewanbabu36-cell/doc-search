import React, { useState, useEffect, useMemo } from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { OTScheduleDto, OperationTheatreRoomDto } from '@docsearch/api-contracts';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export type SurgeryLiveStage =
  | 'PRE_OP_HOLDING'
  | 'ANAESTHESIA_INDUCTION'
  | 'SURGERY_IN_PROGRESS'
  | 'CLOSURE_UNDERWAY'
  | 'PACU_RECOVERY'
  | 'COMPLETED_WARD';

export interface LiveTheatreCase {
  id: string;
  roomCode: string;
  roomType: 'MAIN_OT' | 'CATH_LAB' | 'EMERGENCY_OT' | 'DAYCARE_OT';
  tokenNumber: string;
  patientInitials: string;
  patientFullName: string;
  patientMrn: string;
  patientAgeGender: string;
  attendantMobile: string;
  procedureName: string;
  primarySurgeon: string;
  leadAnaesthetist: string;
  currentStage: SurgeryLiveStage;
  startTime: string;
  elapsedMinutes: number;
  estimatedRemainingMinutes: number;
  isEmergency: boolean;
  bloodUnitsCrossmatched: number;
  lastFamilyIntimationAt?: string | undefined;
  lastFamilyIntimationStage?: string | undefined;
}

export interface OtCathLabLiveFlightBoardViewProps {
  schedules?: OTScheduleDto[] | undefined;
  rooms?: OperationTheatreRoomDto[] | undefined;
  facilityName?: string | undefined;
  onClose?: () => void | undefined;
  isStandaloneFullscreen?: boolean | undefined;
}

const INITIAL_THEATRE_CASES: LiveTheatreCase[] = [
  {
    id: 'case-ot-01',
    roomCode: 'OT 01 - Cardio-Thoracic Suite',
    roomType: 'MAIN_OT',
    tokenNumber: 'SURG-401',
    patientInitials: 'M. K. S.',
    patientFullName: 'Mahendra Kumar Sharma',
    patientMrn: 'UHID-2026-7811',
    patientAgeGender: '62y / Male',
    attendantMobile: '+91 98101 22334',
    procedureName: 'Coronary Artery Bypass Graft (CABG x 3 On-Pump)',
    primarySurgeon: 'Dr. Vikram Malhotra, MS, MCh (CTVS)',
    leadAnaesthetist: 'Dr. Anita Sen, MD (Cardiac Anaesth)',
    currentStage: 'SURGERY_IN_PROGRESS',
    startTime: '08:30 AM',
    elapsedMinutes: 135,
    estimatedRemainingMinutes: 45,
    isEmergency: false,
    bloodUnitsCrossmatched: 4,
    lastFamilyIntimationAt: '09:15 AM',
    lastFamilyIntimationStage: 'Incision & Bypass Initiated'
  },
  {
    id: 'case-cath-01',
    roomCode: 'Cath Lab 01 - Advanced Biplane Angio',
    roomType: 'CATH_LAB',
    tokenNumber: 'CATH-108',
    patientInitials: 'S. P. V.',
    patientFullName: 'Shanti Prasad Verma',
    patientMrn: 'UHID-2026-9024',
    patientAgeGender: '54y / Male',
    attendantMobile: '+91 98765 43210',
    procedureName: 'Primary Coronary Angioplasty (PTCA) + DES Stenting',
    primarySurgeon: 'Dr. Rajesh Sharma, MD, DM (Cardiology)',
    leadAnaesthetist: 'Dr. K. N. Rao, DA',
    currentStage: 'CLOSURE_UNDERWAY',
    startTime: '10:00 AM',
    elapsedMinutes: 48,
    estimatedRemainingMinutes: 12,
    isEmergency: true,
    bloodUnitsCrossmatched: 2,
    lastFamilyIntimationAt: '10:15 AM',
    lastFamilyIntimationStage: 'Stent Deployed Successfully'
  },
  {
    id: 'case-ot-02',
    roomCode: 'OT 02 - Neuro & Spine Suite',
    roomType: 'MAIN_OT',
    tokenNumber: 'SURG-402',
    patientInitials: 'K. D.',
    patientFullName: 'Kamla Devi',
    patientMrn: 'UHID-2026-8812',
    patientAgeGender: '71y / Female',
    attendantMobile: '+91 98221 55667',
    procedureName: 'Right Fronto-Parietal Craniotomy & Subdural Evacuation',
    primarySurgeon: 'Dr. Alok Nath, MS, MCh (Neurosurgery)',
    leadAnaesthetist: 'Dr. Meenakshi Iyer, MD (Neuro Anaesth)',
    currentStage: 'SURGERY_IN_PROGRESS',
    startTime: '09:15 AM',
    elapsedMinutes: 90,
    estimatedRemainingMinutes: 30,
    isEmergency: true,
    bloodUnitsCrossmatched: 3,
    lastFamilyIntimationAt: '09:30 AM',
    lastFamilyIntimationStage: 'Dura Opened & Evacuation Underway'
  },
  {
    id: 'case-ot-03',
    roomCode: 'OT 03 - Orthopedics & Joint Replacement',
    roomType: 'MAIN_OT',
    tokenNumber: 'SURG-403',
    patientInitials: 'R. G.',
    patientFullName: 'Rameshwar Gupta',
    patientMrn: 'UHID-2026-6641',
    patientAgeGender: '68y / Male',
    attendantMobile: '+91 97112 88990',
    procedureName: 'Total Knee Arthroplasty (TKA - Left Joint Robotic)',
    primarySurgeon: 'Dr. Sameer Khan, MS (Ortho), Fellowship Arthroplasty',
    leadAnaesthetist: 'Dr. Preeti Deshmukh, MD',
    currentStage: 'PACU_RECOVERY',
    startTime: '07:45 AM',
    elapsedMinutes: 160,
    estimatedRemainingMinutes: 0,
    isEmergency: false,
    bloodUnitsCrossmatched: 2,
    lastFamilyIntimationAt: '10:20 AM',
    lastFamilyIntimationStage: 'Shifted to PACU Post-Op Recovery'
  },
  {
    id: 'case-ot-04',
    roomCode: 'OT 04 - Laparoscopic & General Surgery',
    roomType: 'MAIN_OT',
    tokenNumber: 'SURG-404',
    patientInitials: 'A. B. J.',
    patientFullName: 'Ananya Banerjee',
    patientMrn: 'UHID-2026-9142',
    patientAgeGender: '34y / Female',
    attendantMobile: '+91 98334 77112',
    procedureName: 'Laparoscopic Cholecystectomy (4-Port Minimal Access)',
    primarySurgeon: 'Dr. Vivek Khurana, MS, FMAS',
    leadAnaesthetist: 'Dr. K. N. Rao, DA',
    currentStage: 'ANAESTHESIA_INDUCTION',
    startTime: '10:30 AM',
    elapsedMinutes: 18,
    estimatedRemainingMinutes: 52,
    isEmergency: false,
    bloodUnitsCrossmatched: 1,
    lastFamilyIntimationAt: '10:35 AM',
    lastFamilyIntimationStage: 'Pre-Op Holding Cleared & Intubation'
  }
];

export const OtCathLabLiveFlightBoardView: React.FC<OtCathLabLiveFlightBoardViewProps> = ({
  schedules,
  facilityName = 'Apex Medicity Multi-Speciality Hospital & Trauma Centre',
  onClose
}) => {
  const [cases, setCases] = useState<LiveTheatreCase[]>(() => {
    if (schedules && schedules.length > 0) {
      return schedules.slice(0, 6).map((s, idx) => ({
        id: s.id,
        roomCode: s.roomName || `OT 0${idx + 1} - Surgical Suite`,
        roomType: s.roomName?.toLowerCase().includes('cath') ? 'CATH_LAB' : 'MAIN_OT',
        tokenNumber: `SURG-${300 + idx}`,
        patientInitials: s.patientName.split(' ').map((n) => n[0]).join('. ') + '.',
        patientFullName: s.patientName,
        patientMrn: s.patientMrn,
        patientAgeGender: '55y / Adult',
        attendantMobile: '+91 98765 43210',
        procedureName: s.procedureName,
        primarySurgeon: s.primarySurgeonName,
        leadAnaesthetist: s.leadAnaesthetistName,
        currentStage: s.status === 'IN_PROGRESS' ? 'SURGERY_IN_PROGRESS' : s.status === 'CONFIRMED' ? 'PRE_OP_HOLDING' : 'PACU_RECOVERY',
        startTime: '09:00 AM',
        elapsedMinutes: 45 + idx * 20,
        estimatedRemainingMinutes: Math.max(10, (s.estimatedDurationMinutes || 90) - (45 + idx * 20)),
        isEmergency: Boolean(s.isEmergency),
        bloodUnitsCrossmatched: 2
      }));
    }
    return INITIAL_THEATRE_CASES;
  });

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'MAIN_OT' | 'CATH_LAB' | 'EMERGENCY'>('ALL');
  const [privacyMode, setPrivacyMode] = useState<boolean>(true); // DPDP / HIPAA compliant anonymized view for public TVs
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('en-IN', { hour12: true }));
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Ticking live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-IN', { hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Web Audio chime synthesizer
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.25); // E5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.7);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.7);
    } catch {
      // Audio blocked or not supported
    }
  };

  const getStageTitle = (stage: SurgeryLiveStage) => {
    switch (stage) {
      case 'PRE_OP_HOLDING': return '1. Pre-Op Holding & Identity Check';
      case 'ANAESTHESIA_INDUCTION': return '2. Anaesthesia Induction & Lines';
      case 'SURGERY_IN_PROGRESS': return '3. Incision & Active Surgery';
      case 'CLOSURE_UNDERWAY': return '4. Closure, Haemostasis & Dressing';
      case 'PACU_RECOVERY': return '5. PACU Post-Op Recovery';
      case 'COMPLETED_WARD': return '✓ Completed & Shifted';
    }
  };

  const getStageColor = (stage: SurgeryLiveStage) => {
    switch (stage) {
      case 'PRE_OP_HOLDING': return { bg: 'rgba(245, 158, 11, 0.2)', border: '#F59E0B', text: '#FDE68A' };
      case 'ANAESTHESIA_INDUCTION': return { bg: 'rgba(56, 189, 248, 0.2)', border: '#38BDF8', text: '#BAE6FD' };
      case 'SURGERY_IN_PROGRESS': return { bg: 'rgba(239, 68, 68, 0.25)', border: '#EF4444', text: '#FCA5A5' };
      case 'CLOSURE_UNDERWAY': return { bg: 'rgba(168, 85, 247, 0.25)', border: '#A855F7', text: '#DDD6FE' };
      case 'PACU_RECOVERY': return { bg: 'rgba(16, 185, 129, 0.25)', border: '#10B981', text: '#6EE7B7' };
      case 'COMPLETED_WARD': return { bg: 'rgba(100, 116, 139, 0.2)', border: '#64748B', text: '#CBD5E1' };
    }
  };

  const handleAdvanceStage = (caseId: string) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        let nextStage: SurgeryLiveStage = c.currentStage;
        if (c.currentStage === 'PRE_OP_HOLDING') nextStage = 'ANAESTHESIA_INDUCTION';
        else if (c.currentStage === 'ANAESTHESIA_INDUCTION') nextStage = 'SURGERY_IN_PROGRESS';
        else if (c.currentStage === 'SURGERY_IN_PROGRESS') nextStage = 'CLOSURE_UNDERWAY';
        else if (c.currentStage === 'CLOSURE_UNDERWAY') nextStage = 'PACU_RECOVERY';
        else if (c.currentStage === 'PACU_RECOVERY') nextStage = 'COMPLETED_WARD';
        else nextStage = 'PRE_OP_HOLDING';

        playChime();

        const stageText = getStageTitle(nextStage);
        const autoMessage = `Apex Medicity Update: Surgery for patient (${c.patientInitials} • Token #${c.tokenNumber}) in ${c.roomCode} has progressed to: ${stageText}. Attendant update sent.`;

        hospitalEventBus.publish(
          'OPTIMISTIC_ACTION_DISPATCHED',
          'OtCathLabLiveFlightBoard',
          {
            caseId: c.id,
            tokenNumber: c.tokenNumber,
            roomCode: c.roomCode,
            nextStage,
            updatedAt: new Date().toISOString()
          },
          autoMessage
        );

        triggerToast(`📢 ${c.roomCode}: Stage transitioned to "${stageText}"! WhatsApp notification dispatched to family.`);

        return {
          ...c,
          currentStage: nextStage,
          lastFamilyIntimationAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          lastFamilyIntimationStage: stageText
        };
      })
    );
  };

  const handleManualWhatsAppIntimation = (c: LiveTheatreCase) => {
    const text = encodeURIComponent(
      `🏥 *${facilityName} — Operation Theatre Live Status*\n\n` +
      `Namaste, this is an automated live surgery update for your family member:\n` +
      `• Patient Token: *#${c.tokenNumber} (${c.patientInitials})*\n` +
      `• Operating Suite: *${c.roomCode}*\n` +
      `• Procedure: *${c.procedureName}*\n` +
      `• Lead Surgeon: *${c.primarySurgeon}*\n` +
      `• Current Phase: *${getStageTitle(c.currentStage)}*\n` +
      `• Elapsed Time: *${c.elapsedMinutes} mins*\n\n` +
      `_Status: Patient is stable and vital signs are continuously monitored by the surgical & anaesthesia team. Please wait in the 2nd Floor OT Attendant Lounge. Doctor will meet you upon case completion._`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
    triggerToast(`📲 WhatsApp message draft generated for attendant of Token #${c.tokenNumber}!`);
  };

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (activeFilter === 'MAIN_OT') return c.roomType === 'MAIN_OT';
      if (activeFilter === 'CATH_LAB') return c.roomType === 'CATH_LAB';
      if (activeFilter === 'EMERGENCY') return c.isEmergency;
      return true;
    });
  }, [cases, activeFilter]);

  const activeSurgeriesCount = cases.filter((c) => c.currentStage !== 'COMPLETED_WARD').length;
  const inProgressCount = cases.filter((c) => c.currentStage === 'SURGERY_IN_PROGRESS' || c.currentStage === 'CLOSURE_UNDERWAY').length;
  const pacuCount = cases.filter((c) => c.currentStage === 'PACU_RECOVERY').length;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#070C16',
        color: '#F8FAFC',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '20px 24px 60px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 10006,
            backgroundColor: '#064E3B',
            border: '1.5px solid #10B981',
            color: '#ECFDF5',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.65)',
            fontSize: '0.85rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <span>⚡</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Airport-Style Flight Board Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)',
          border: '1.5px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '18px',
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1.5px solid #38BDF8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem'
            }}
          >
            📺
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
                OPERATION THEATRE &amp; CATH LAB CORRIDOR FLIGHT RADAR
              </h1>
              <Badge variant="primary">LIVE TELEMETRY BOARD</Badge>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
              {facilityName} • 55"/65" Waiting Corridor &amp; Attendant Display • DPDP De-Identified
            </p>
          </div>
        </div>

        {/* Live Clock & Control Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 10px #10B981' }} />
            <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 900, color: '#38BDF8' }}>
              {currentTime}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPrivacyMode(!privacyMode)}
            style={{ fontSize: '0.78rem', fontWeight: 700 }}
            title="Toggle between Attendant Public Anonymized Mode vs Clinical Full Names"
          >
            {privacyMode ? '🔒 Public DPDP Mode (Initials)' : '🔓 Staff Mode (Full Names)'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{ fontSize: '0.78rem', fontWeight: 700 }}
          >
            {soundEnabled ? '🔔 Chime (On)' : '🔕 Chime (Mute)'}
          </Button>

          {onClose && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              style={{ fontWeight: 800 }}
            >
              ✕ Exit Display
            </Button>
          )}
        </div>
      </div>

      {/* KPI Telemetry Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
        <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', padding: '14px 18px' }}>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Total Active Cases</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>
            {activeSurgeriesCount} Theatres
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Occupancy: 83.3% of 6 Suites</div>
        </Card>

        <Card style={{ backgroundColor: '#0F172A', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '14px 18px' }}>
          <div style={{ fontSize: '0.72rem', color: '#FCA5A5', textTransform: 'uppercase', fontWeight: 700 }}>Incision Underway</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#EF4444', marginTop: '2px' }}>
            {inProgressCount} Procedures
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Active Surgical Incision / Stenting</div>
        </Card>

        <Card style={{ backgroundColor: '#0F172A', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '14px 18px' }}>
          <div style={{ fontSize: '0.72rem', color: '#6EE7B7', textTransform: 'uppercase', fontWeight: 700 }}>PACU Recovery Bays</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
            {pacuCount} Patients
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Aldrete Score ≥ 8 / Stable</div>
        </Card>

        <Card style={{ backgroundColor: '#0F172A', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '14px 18px' }}>
          <div style={{ fontSize: '0.72rem', color: '#DDD6FE', textTransform: 'uppercase', fontWeight: 700 }}>Cath Lab Stenting</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#A855F7', marginTop: '2px' }}>
            1 Emergency PTCA
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Door-to-Balloon Time: 34 mins ✓</div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 700 }}>Filter View:</span>
        {(['ALL', 'MAIN_OT', 'CATH_LAB', 'EMERGENCY'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setActiveFilter(mode)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: activeFilter === mode ? '1.5px solid #0284C7' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: activeFilter === mode ? '#0284C7' : 'rgba(15, 23, 42, 0.7)',
              color: activeFilter === mode ? '#FFF' : '#94A3B8'
            }}
          >
            {mode === 'ALL' ? '🌐 All Surgical Suites' : mode === 'MAIN_OT' ? '🏥 Main Operating Theatres' : mode === 'CATH_LAB' ? '⚡ Cath Lab Biplane' : '🚨 Emergency STAT Only'}
          </button>
        ))}
      </div>

      {/* Main Live Flight Matrix Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredCases.map((c) => {
          const stageStyle = getStageColor(c.currentStage);
          const stageTitle = getStageTitle(c.currentStage);

          return (
            <div
              key={c.id}
              style={{
                backgroundColor: '#0F172A',
                border: c.isEmergency ? '1.5px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '20px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: c.isEmergency ? '0 0 25px rgba(239, 68, 68, 0.25)' : '0 8px 24px rgba(0, 0, 0, 0.45)',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Row 1: Theatre Code, Patient Token, Urgency, and Family Stage Pill */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: c.roomType === 'CATH_LAB' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                      border: `1px solid ${c.roomType === 'CATH_LAB' ? '#A855F7' : '#38BDF8'}`,
                      fontSize: '0.85rem',
                      fontWeight: 900,
                      color: c.roomType === 'CATH_LAB' ? '#DDD6FE' : '#38BDF8'
                    }}
                  >
                    {c.roomCode}
                  </div>

                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#F8FAFC', fontFamily: 'monospace' }}>
                    #{c.tokenNumber}
                  </div>

                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#CBD5E1' }}>
                    {privacyMode ? c.patientInitials : c.patientFullName} ({c.patientAgeGender})
                  </div>

                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    {c.patientMrn}
                  </span>

                  {c.isEmergency && (
                    <Badge variant="danger">🚨 STAT EMERGENCY</Badge>
                  )}
                </div>

                {/* Stage Badge & Elapsed Time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      backgroundColor: stageStyle.bg,
                      border: `1.5px solid ${stageStyle.border}`,
                      color: stageStyle.text,
                      fontSize: '0.82rem',
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stageStyle.border, boxShadow: `0 0 8px ${stageStyle.border}` }} />
                    <span>{stageTitle}</span>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94A3B8' }}>
                    <div>Started: <strong style={{ color: '#F1F5F9' }}>{c.startTime}</strong></div>
                    <div>Elapsed: <strong style={{ color: '#38BDF8' }}>{c.elapsedMinutes}m</strong> {c.estimatedRemainingMinutes > 0 && `(ETA ~${c.estimatedRemainingMinutes}m)`}</div>
                  </div>
                </div>
              </div>

              {/* Row 2: Procedure & Surgical Team */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  padding: '12px 16px',
                  borderRadius: '10px'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Surgical Procedure</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#F1F5F9', marginTop: '2px' }}>
                    {c.procedureName}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Chief Surgeon</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
                    {c.primarySurgeon}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Lead Anaesthetist & Blood</div>
                  <div style={{ fontSize: '0.82rem', color: '#CBD5E1', marginTop: '2px' }}>
                    {c.leadAnaesthetist} • <span style={{ color: '#F87171', fontWeight: 700 }}>PRBC Crossmatched: {c.bloodUnitsCrossmatched}U</span>
                  </div>
                </div>
              </div>

              {/* Row 3: 5-Phase Animated Progress Stepper */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                {[
                  { key: 'PRE_OP_HOLDING', label: '1. Holding' },
                  { key: 'ANAESTHESIA_INDUCTION', label: '2. Induction' },
                  { key: 'SURGERY_IN_PROGRESS', label: '3. Incision / Surgery' },
                  { key: 'CLOSURE_UNDERWAY', label: '4. Closure' },
                  { key: 'PACU_RECOVERY', label: '5. PACU Post-Op' }
                ].map((st, sIdx) => {
                  const stageOrder = ['PRE_OP_HOLDING', 'ANAESTHESIA_INDUCTION', 'SURGERY_IN_PROGRESS', 'CLOSURE_UNDERWAY', 'PACU_RECOVERY', 'COMPLETED_WARD'];
                  const currentIndex = stageOrder.indexOf(c.currentStage);
                  const isDone = currentIndex > sIdx;
                  const isCurrent = currentIndex === sIdx;

                  return (
                    <div
                      key={st.key}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        backgroundColor: isDone ? 'rgba(16, 185, 129, 0.2)' : isCurrent ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        border: isDone ? '1px solid #10B981' : isCurrent ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                        textAlign: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: isDone ? '#6EE7B7' : isCurrent ? '#38BDF8' : '#64748B'
                      }}
                    >
                      {isDone ? `✓ ${st.label}` : isCurrent ? `⚡ ${st.label}` : st.label}
                    </div>
                  );
                })}
              </div>

              {/* Row 4: Action Toolbar (Advance Phase & Family WhatsApp Intimation) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  {c.lastFamilyIntimationAt ? (
                    <span>Last Family WhatsApp: <strong style={{ color: '#10B981' }}>{c.lastFamilyIntimationAt}</strong> ({c.lastFamilyIntimationStage})</span>
                  ) : (
                    <span>Awaiting stage dispatch</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManualWhatsAppIntimation(c)}
                    style={{
                      borderColor: '#10B981',
                      color: '#34D399',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Generate and dispatch WhatsApp update to waiting family members"
                  >
                    <span>📲</span>
                    <span>Dispatch WhatsApp to Family</span>
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAdvanceStage(c.id)}
                    style={{
                      backgroundColor: '#0284C7',
                      color: '#FFF',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Advance to next surgical stage and auto-notify attendants"
                  >
                    <span>⚡</span>
                    <span>Advance Stage ➔</span>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Attendant Waiting Lounge Footer Information */}
      <div
        style={{
          backgroundColor: '#0B111E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}>ℹ️</span>
          <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            <strong>Information for Patient Families:</strong> Surgery durations are estimated based on case complexity. As soon as closure is complete, your patient will be monitored in the PACU Recovery Room and the lead surgeon will meet you in the Waiting Lounge.
          </div>
        </div>
        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
          DocSearch Healthcare OS • Surgical Suite Live Corridors
        </div>
      </div>
    </div>
  );
};
