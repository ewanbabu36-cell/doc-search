import React, { useState, useEffect, useRef } from 'react';

export type SandboxPersona = 'SOLO_CLINIC' | 'HOSPITAL' | 'PHARMACY' | 'PATHOLOGY';

interface Props {
  onOpenDemoModal?: () => void;
  onOpenRegisterModal?: () => void;
  partnerPortalUrl?: string;
}

export const InteractiveClinicSandbox: React.FC<Props> = ({
  onOpenDemoModal,
  onOpenRegisterModal,
  partnerPortalUrl = 'http://localhost:5174'
}) => {
  const [activePersona, setActivePersona] = useState<SandboxPersona>('SOLO_CLINIC');

  // --- ⏱️ 10-Second Speed Challenge Engine ---
  const [challengeTimerActive, setChallengeTimerActive] = useState(false);
  const [challengeElapsedMs, setChallengeElapsedMs] = useState(0);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [completedTimeMs, setCompletedTimeMs] = useState<number | null>(null);
  const timerRef = useRef<any>(null);

  const startChallengeTimer = () => {
    if (challengeTimerActive || challengeCompleted) return;
    setChallengeTimerActive(true);
    const startTime = Date.now() - challengeElapsedMs;
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= 10000) {
        // capped at 10.0s
        setChallengeElapsedMs(10000);
      } else {
        setChallengeElapsedMs(elapsed);
      }
    }, 40);
  };

  const stopChallengeTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setChallengeTimerActive(false);
    setChallengeCompleted(true);
    setCompletedTimeMs(challengeElapsedMs || 3800);
    playVictoryChime();
  };

  const resetChallengeTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setChallengeTimerActive(false);
    setChallengeElapsedMs(0);
    setChallengeCompleted(false);
    setCompletedTimeMs(null);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // --- 🔊 Tactile Sound Synthesizer via Web Audio API ---
  const playTactileChime = (freq = 880, type: OscillatorType = 'sine', duration = 0.15) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // AudioContext restricted or unavailable
    }
  };

  const playVictoryChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.07, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.22);
      });
    } catch {
      // AudioContext unavailable
    }
  };

  // --- 🩺 Mode 1: Solo Doctor OPD Queue & Prescriptions ---
  const [soloQueue, setSoloQueue] = useState([
    { token: 'TK-12', name: 'Aarav Sharma', age: '4y', gender: 'M', complaint: 'Viral fever (101.4°F) & runny nose', vitals: 'Temp 101.4°F • SpO2 99% • Wt 16kg', status: 'WAITING' },
    { token: 'TK-13', name: 'Pooja Verma', age: '28y', gender: 'F', complaint: 'Acute migraine & nausea', vitals: 'BP 118/76 • Pulse 74', status: 'WAITING' },
    { token: 'TK-14', name: 'Rajesh Kumar', age: '52y', gender: 'M', complaint: 'Hypertension routine follow-up', vitals: 'BP 146/92 • BMI 27.2', status: 'WAITING' }
  ]);
  const [activePatient, setActivePatient] = useState<any>(null);
  const [prescribedDrugs, setPrescribedDrugs] = useState<Array<{ name: string; dose: string; generic: string; priceInr: number }>>([]);
  const [isGenericSwitched, setIsGenericSwitched] = useState(false);
  const [isRxFinalized, setIsRxFinalized] = useState(false);

  const handleCallNextPatient = () => {
    playTactileChime(987);
    startChallengeTimer();
    const next = soloQueue.find((p) => p.status === 'WAITING') || soloQueue[0];
    if (next) {
      setActivePatient(next);
      setSoloQueue((prev) =>
        prev.map((p) => (p.token === next.token ? { ...p, status: 'IN_CONSULT' } : p))
      );
      setPrescribedDrugs([]);
      setIsGenericSwitched(false);
      setIsRxFinalized(false);
    }
  };

  const handleApplyPediatricKit = () => {
    playTactileChime(1174);
    startChallengeTimer();
    setPrescribedDrugs([
      { name: 'Paracetamol 120mg/5ml Syrup', dose: '5 ml TDS x 3 days', generic: 'Acetaminophen (Jan Aushadhi)', priceInr: 18 },
      { name: 'ORS Sachet (WHO Formula)', dose: '1 pouch in 1L water ad libitum', generic: 'Oral Rehydration Salts', priceInr: 12 },
      { name: 'Cetirizine 2.5mg/5ml Syrup', dose: '2.5 ml at bedtime x 3 days', generic: 'Cetirizine Dihydrochloride', priceInr: 22 }
    ]);
  };

  const handleToggleJanAushadhi = () => {
    playTactileChime(1046);
    setIsGenericSwitched(!isGenericSwitched);
  };

  const handleFinalizeRx = () => {
    stopChallengeTimer();
    setIsRxFinalized(true);
    if (activePatient) {
      setSoloQueue((prev) =>
        prev.map((p) => (p.token === activePatient.token ? { ...p, status: 'COMPLETED' } : p))
      );
    }
  };

  // --- 🏥 Mode 2: Hospital Bed Matrix & Census ---
  const [beds, setBeds] = useState([
    { id: 'ICU-01', type: 'ICU', wing: 'Critical Care', patient: 'Ramesh Gupta (62y)', spo2: '94%', hr: '88', status: 'OCCUPIED', critical: true },
    { id: 'ICU-02', type: 'ICU', wing: 'Critical Care', patient: 'Anita Devi (48y)', spo2: '97%', hr: '76', status: 'OCCUPIED', critical: false },
    { id: 'ICU-03', type: 'ICU', wing: 'Critical Care', patient: null, spo2: '--', hr: '--', status: 'READY', critical: false },
    { id: 'ICU-04', type: 'ICU', wing: 'Critical Care', patient: 'Kiran Patel (71y)', spo2: '91%', hr: '102', status: 'OCCUPIED', critical: true },
    { id: 'DLX-01', type: 'Deluxe', wing: 'Floor 3', patient: 'Vikram Mehta (38y)', spo2: '99%', hr: '72', status: 'OCCUPIED', critical: false },
    { id: 'DLX-02', type: 'Deluxe', wing: 'Floor 3', patient: null, spo2: '--', hr: '--', status: 'CLEANING', critical: false },
    { id: 'GEN-01', type: 'General', wing: 'Ward A', patient: 'Suresh Patil (44y)', spo2: '98%', hr: '78', status: 'OCCUPIED', critical: false },
    { id: 'GEN-02', type: 'General', wing: 'Ward A', patient: 'Sunita Rao (32y)', spo2: '99%', hr: '80', status: 'OCCUPIED', critical: false },
    { id: 'GEN-03', type: 'General', wing: 'Ward A', patient: null, spo2: '--', hr: '--', status: 'EMPTY', critical: false },
    { id: 'GEN-04', type: 'General', wing: 'Ward A', patient: 'Deepak Shah (55y)', spo2: '96%', hr: '84', status: 'OCCUPIED', critical: false }
  ]);
  const [hospitalCensusOccupied, setHospitalCensusOccupied] = useState(47);
  const [emergencyAdmitted, setEmergencyAdmitted] = useState(false);
  const [hospitalAlertNote, setHospitalAlertNote] = useState<string | null>(null);

  const handleAdmitEmergencyPatient = () => {
    playTactileChime(784, 'triangle');
    startChallengeTimer();
    setBeds((prev) =>
      prev.map((b) =>
        b.id === 'ICU-03'
          ? {
              ...b,
              patient: 'Harish Rao (54y M, Acute STEMI)',
              spo2: '88% (O2 Mask 6L/m)',
              hr: '116 bpm',
              status: 'OCCUPIED',
              critical: true
            }
          : b
      )
    );
    setHospitalCensusOccupied(48);
    setEmergencyAdmitted(true);
    setHospitalAlertNote('✓ Emergency STEMI Admitted to ICU-03 • Real-time Telemetry, Vitals & MAR Dispatched');
    stopChallengeTimer();
  };

  // --- 💊 Mode 3: Pharmacy POS & Strip Fraction Cutting ---
  const [cart, setCart] = useState([
    { name: 'Augmentin 625mg (Amoxyclav)', batch: 'AUG-8821', exp: '11/27', packSize: 10, qtyTabs: 10, unitPrice: 20.45, isFraction: false },
    { name: 'Pan 40mg (Pantoprazole)', batch: 'PAN-3019', exp: '04/28', packSize: 15, qtyTabs: 15, unitPrice: 9.46, isFraction: false }
  ]);
  const [selectedFractionTabs, setSelectedFractionTabs] = useState<number>(4);
  const [isBlisterCutApplied, setIsBlisterCutApplied] = useState(false);
  const [posDispensed, setPosDispensed] = useState(false);

  const handleApplyBlisterFraction = (tabs: number) => {
    playTactileChime(1046);
    startChallengeTimer();
    setSelectedFractionTabs(tabs);
    setIsBlisterCutApplied(true);
    setCart((prev) => {
      const filtered = prev.filter((i) => !i.name.includes('Dolo 650'));
      return [
        ...filtered,
        {
          name: 'Dolo 650mg (Paracetamol)',
          batch: 'DOL-9942',
          exp: '08/28',
          packSize: 15,
          qtyTabs: tabs,
          unitPrice: 2.17,
          isFraction: tabs < 15
        }
      ];
    });
  };

  const calculateCartTotal = () => {
    const total = cart.reduce((acc, item) => acc + item.qtyTabs * item.unitPrice, 0);
    return total.toFixed(2);
  };

  const handleDispensePOS = () => {
    stopChallengeTimer();
    setPosDispensed(true);
  };

  // --- 🧪 Mode 4: Pathology ASTM Serial Packet Stream ---
  const [astmLogs] = useState<string[]>([
    'H|\\^&|||Mindray^BC-5000^1.0.4|||||||P|1',
    'P|1||UHID-8842||Gupta^Anil||19820514|M',
    'O|1|ACC-9921||^^^CBC^Complete Blood Count|R',
    'R|1|^^^WBC^White Blood Cells|7.4|10*3/uL|4.0-10.0|N|F',
    'R|2|^^^RBC^Red Blood Cells|4.82|10*6/uL|4.5-5.9|N|F',
    'R|3|^^^HGB^Hemoglobin|14.2|g/dL|13.0-17.5|N|F',
    'R|4|^^^PLT^Platelet Count|14|10*3/uL|150-450|LL*|F'
  ]);
  const [isPanicReported, setIsPanicReported] = useState(false);
  const [isLabSigned, setIsLabSigned] = useState(false);

  const handleTriggerPanic = () => {
    playTactileChime(440, 'sawtooth');
    startChallengeTimer();
    setIsPanicReported(true);
  };

  const handleSignOffReport = () => {
    stopChallengeTimer();
    setIsLabSigned(true);
  };

  return (
    <div
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(56, 189, 248, 0.4)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.85), 0 0 50px rgba(56, 189, 248, 0.15)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* ========================================================================= */}
      {/* 1. TOP SPEED CHALLENGE HUD & PERSONA SELECTOR                             */}
      {/* ========================================================================= */}
      <div
        style={{
          padding: '20px 28px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        {/* Left: Value proposition & Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: challengeTimerActive ? 'rgba(239, 68, 68, 0.2)' : challengeCompleted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.15)',
              border: challengeTimerActive ? '1px solid #EF4444' : challengeCompleted ? '1px solid #10B981' : '1px solid rgba(56, 189, 248, 0.4)',
              color: challengeTimerActive ? '#F87171' : challengeCompleted ? '#34D399' : '#38BDF8',
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.04em'
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: challengeTimerActive ? '#EF4444' : challengeCompleted ? '#10B981' : '#38BDF8',
                boxShadow: `0 0 10px ${challengeTimerActive ? '#EF4444' : challengeCompleted ? '#10B981' : '#38BDF8'}`,
                animation: challengeTimerActive ? 'pulse 1s infinite' : 'none'
              }}
            />
            {challengeCompleted
              ? `⚡ CHALLENGE PASSED: ${(completedTimeMs! / 1000).toFixed(1)}s`
              : challengeTimerActive
              ? `⏱️ LIVE TIMER: ${(challengeElapsedMs / 1000).toFixed(1)}s / 10.0s`
              : '⚡ 10-SECOND LIVE CLINIC CHALLENGE'}
          </div>

          <div style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>
            <strong style={{ color: '#FFFFFF' }}>38 Text Cards ke badle:</strong> Click below to test live clinical controls in 10s!
          </div>
        </div>

        {/* Right: Persona Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            gap: '4px',
            flexWrap: 'wrap'
          }}
        >
          {[
            { id: 'SOLO_CLINIC', label: '🩺 Solo OPD Doctor', target: 'e-Rx in 5s' },
            { id: 'HOSPITAL', label: '🏥 Hospital Director', target: 'ICU Bed in 4s' },
            { id: 'PHARMACY', label: '💊 Chemist POS', target: 'Blister Cut in 4s' },
            { id: 'PATHOLOGY', label: '🧪 Pathology LIMS', target: 'Panic Sign in 3s' }
          ].map((tab) => {
            const isSelected = activePersona === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  playTactileChime(600);
                  setActivePersona(tab.id as SandboxPersona);
                  resetChallengeTimer();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: isSelected ? 800 : 500,
                  border: 'none',
                  backgroundColor: isSelected ? '#38BDF8' : 'transparent',
                  color: isSelected ? '#070C16' : '#94A3B8',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 10px rgba(56, 189, 248, 0.35)' : 'none'
                }}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              playTactileChime(500);
              resetChallengeTimer();
            }}
            title="Reset Simulator"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '6px 8px',
              fontSize: '0.875rem'
            }}
          >
            🔄
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE WORKSPACE WORKFLOWS                                        */}
      {/* ========================================================================= */}
      <div style={{ padding: '24px 28px' }}>
        {/* ========================================================================= */}
        {/* MODE 1: SOLO PEDIATRIC & OPD DOCTOR WORKSPACE                             */}
        {/* ========================================================================= */}
        {activePersona === 'SOLO_CLINIC' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: '20px' }}>
            {/* Left Column: Live Queue */}
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F1F5F9', letterSpacing: '0.04em' }}>
                  OPD WAITING QUEUE (3)
                </span>
                <button
                  type="button"
                  onClick={handleCallNextPatient}
                  style={{
                    backgroundColor: '#10B981',
                    color: '#070C16',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 0 14px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <span>📢 Call Next Token</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {soloQueue.map((pt) => {
                  const isActive = activePatient?.token === pt.token;
                  return (
                    <div
                      key={pt.token}
                      onClick={() => {
                        playTactileChime(800);
                        startChallengeTimer();
                        setActivePatient(pt);
                        setIsRxFinalized(false);
                      }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: isActive
                          ? 'rgba(56, 189, 248, 0.18)'
                          : pt.status === 'COMPLETED'
                          ? 'rgba(16, 185, 129, 0.08)'
                          : 'rgba(255, 255, 255, 0.03)',
                        border: isActive
                          ? '1.5px solid #38BDF8'
                          : '1px solid rgba(255, 255, 255, 0.07)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#F8FAFC' }}>
                          {pt.token} · {pt.name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor:
                              pt.status === 'COMPLETED'
                                ? 'rgba(16, 185, 129, 0.2)'
                                : pt.status === 'IN_CONSULT'
                                ? 'rgba(56, 189, 248, 0.25)'
                                : 'rgba(255, 255, 255, 0.1)',
                            color:
                              pt.status === 'COMPLETED'
                                ? '#10B981'
                                : pt.status === 'IN_CONSULT'
                                ? '#38BDF8'
                                : '#94A3B8'
                          }}
                        >
                          {pt.status === 'IN_CONSULT' ? '🩺 ACTIVE' : pt.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '4px' }}>
                        {pt.age} ({pt.gender}) · {pt.complaint}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ fontSize: '0.6875rem', color: '#64748B', textAlign: 'center', marginTop: 'auto' }}>
                💡 Click "Call Next Token" to start the 10-second challenge!
              </div>
            </div>

            {/* Right Column: Clinical Dossier & 1-Click Rx */}
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                {/* Active Patient Vitals Strip */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingBottom: '12px',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#F8FAFC' }}>
                      {activePatient ? `${activePatient.name} (${activePatient.age}, ${activePatient.gender})` : 'Awaiting Patient Call'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#38BDF8', marginTop: '2px' }}>
                      {activePatient ? `Symptoms: ${activePatient.complaint}` : 'Click "Call Next Token" on the left queue to begin consult'}
                    </div>
                  </div>

                  {activePatient && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#F87171', fontSize: '0.75rem', fontWeight: 700 }}>
                        Temp: 101.4°F
                      </span>
                      <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', fontSize: '0.75rem', fontWeight: 700 }}>
                        SpO2: 99%
                      </span>
                      <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#C084FC', fontSize: '0.75rem', fontWeight: 700 }}>
                        Weight: 16 kg
                      </span>
                    </div>
                  )}
                </div>

                {/* 1-Click Clinical Protocol Kits */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                      1-CLICK CLINICAL PROTOCOL KITS (ZERO TYPING):
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleJanAushadhi}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isGenericSwitched ? '#34D399' : '#94A3B8',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>{isGenericSwitched ? '🌿 Jan Aushadhi Generic Mode (ON)' : '🔄 Switch to Jan Aushadhi'}</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleApplyPediatricKit}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(168, 85, 247, 0.2)',
                        border: '1px solid rgba(168, 85, 247, 0.45)',
                        color: '#C084FC',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>⚡ Apply "Viral Fever Pediatric Kit" (3 Drugs)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playTactileChime(1100);
                        startChallengeTimer();
                        setPrescribedDrugs([
                          { name: 'Amoxicillin Clavulanate 228mg/5ml', dose: '5 ml BD x 5 days', generic: 'Amoxyclav (Jan Aushadhi)', priceInr: 58 },
                          { name: 'Saline Nasal Spray 0.9%', dose: '2 drops each nostril TDS', generic: 'Normal Saline Drops', priceInr: 15 }
                        ]);
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        color: '#38BDF8',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      + Acute Bronchitis Kit
                    </button>
                  </div>
                </div>

                {/* Digital Prescription Pad */}
                <div
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    minHeight: '110px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>
                      STRUCTURED DIGITAL PRESCRIPTION PAD
                    </span>
                    {prescribedDrugs.length > 0 && (
                      <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>
                        Total Patient Cost: ₹{prescribedDrugs.reduce((a, b) => a + (isGenericSwitched ? Math.round(b.priceInr * 0.35) : b.priceInr), 0)} {isGenericSwitched && '(Saved 65%)'}
                      </span>
                    )}
                  </div>

                  {prescribedDrugs.length === 0 ? (
                    <div style={{ fontSize: '0.8125rem', color: '#475569', fontStyle: 'italic', padding: '16px 0' }}>
                      Click a protocol kit above to auto-populate pediatric dosing with zero manual typing...
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {prescribedDrugs.map((drug, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px 10px',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#10B981', fontWeight: 800 }}>✓</span>
                            <div>
                              <div style={{ fontSize: '0.8125rem', color: '#F1F5F9', fontWeight: 700 }}>
                                {isGenericSwitched ? drug.generic : drug.name}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{drug.dose}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: isGenericSwitched ? '#34D399' : '#CBD5E1', fontWeight: 700 }}>
                            ₹{isGenericSwitched ? Math.round(drug.priceInr * 0.35) : drug.priceInr}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Action & Speed Telemetry */}
              <div
                style={{
                  marginTop: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '16px'
                }}
              >
                {isRxFinalized ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#10B981', fontSize: '1.2rem' }}>🎉</span>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#10B981' }}>
                        Prescription Signed & WhatsApp Dispatched in {(challengeElapsedMs / 1000).toFixed(1)}s!
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                        Industry Average on legacy HMS: 8.5 minutes (106x faster)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                    ⚡ Single screen consultation • No modal popups • Zero lag
                  </div>
                )}

                <button
                  type="button"
                  disabled={!activePatient || prescribedDrugs.length === 0}
                  onClick={handleFinalizeRx}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    backgroundColor: activePatient && prescribedDrugs.length > 0 ? '#38BDF8' : 'rgba(255, 255, 255, 0.1)',
                    color: activePatient && prescribedDrugs.length > 0 ? '#070C16' : '#64748B',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                    border: 'none',
                    cursor: activePatient && prescribedDrugs.length > 0 ? 'pointer' : 'not-allowed',
                    boxShadow: activePatient && prescribedDrugs.length > 0 ? '0 0 20px rgba(56, 189, 248, 0.45)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  🚀 1-Click Finalize & Sign Rx
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 2: 50-BED MULTI-SPECIALTY HOSPITAL DIRECTOR MATRIX                   */}
        {/* ========================================================================= */}
        {activePersona === 'HOSPITAL' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F8FAFC' }}>
                    Hospital Bed Matrix & Live Ward Census (50 Beds)
                  </span>
                  <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                    NABH Telemetry: {hospitalCensusOccupied}/50 Beds ({((hospitalCensusOccupied / 50) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px' }}>
                  Live visual telemetry across Intensive Care (ICU), Deluxe Suites, General Wards & Isolation
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleAdmitEmergencyPatient}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    backgroundColor: emergencyAdmitted ? 'rgba(239, 68, 68, 0.25)' : '#EF4444',
                    color: '#FFF',
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    border: emergencyAdmitted ? '1px solid #EF4444' : 'none',
                    cursor: 'pointer',
                    boxShadow: '0 0 16px rgba(239, 68, 68, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>🚨</span>
                  <span>{emergencyAdmitted ? 'ICU Bed Allocated (STEMI Active)' : '1-Click Admit STEMI to ICU-03'}</span>
                </button>
              </div>
            </div>

            {hospitalAlertNote && (
              <div
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10B981',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  marginBottom: '16px',
                  color: '#6EE7B7',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>{hospitalAlertNote}</span>
                <span style={{ fontSize: '0.72rem', color: '#A7F3D0' }}>Telemetry Latency: 14ms</span>
              </div>
            )}

            {/* Visual Bed Grid Matrix */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '12px',
                marginBottom: '16px'
              }}
            >
              {beds.map((b) => {
                const isOccupied = b.status === 'OCCUPIED';
                const isCleaning = b.status === 'CLEANING';
                return (
                  <div
                    key={b.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      backgroundColor: isOccupied
                        ? b.critical
                          ? 'rgba(239, 68, 68, 0.18)'
                          : 'rgba(56, 189, 248, 0.14)'
                        : isCleaning
                        ? 'rgba(245, 158, 11, 0.12)'
                        : 'rgba(16, 185, 129, 0.12)',
                      border: isOccupied
                        ? b.critical
                          ? '1.5px solid rgba(239, 68, 68, 0.5)'
                          : '1px solid rgba(56, 189, 248, 0.35)'
                        : isCleaning
                        ? '1px solid rgba(245, 158, 11, 0.35)'
                        : '1px solid rgba(16, 185, 129, 0.35)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#F8FAFC' }}>
                        {b.id}
                      </span>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: isOccupied ? (b.critical ? '#EF4444' : '#38BDF8') : isCleaning ? '#F59E0B' : '#10B981',
                          boxShadow: `0 0 8px ${isOccupied ? (b.critical ? '#EF4444' : '#38BDF8') : isCleaning ? '#F59E0B' : '#10B981'}`
                        }}
                      />
                    </div>

                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>
                      {b.type} • {b.wing}
                    </div>

                    <div
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: isOccupied ? '#F1F5F9' : isCleaning ? '#FCD34D' : '#34D399',
                        marginTop: '8px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {b.patient || (isCleaning ? '🧹 Housekeeping Sanitize' : '🟢 Ready for Intake')}
                    </div>

                    {isOccupied && (
                      <div style={{ fontSize: '0.6875rem', color: b.critical ? '#FCA5A5' : '#7DD3FC', marginTop: '4px' }}>
                        SpO2: {b.spo2} • HR: {b.hr}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Director Telemetry Summary Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', gap: '18px', fontSize: '0.78rem', color: '#CBD5E1', flexWrap: 'wrap' }}>
                <span>🛡️ <strong>PostgreSQL RLS Multi-Tenant:</strong> Active</span>
                <span>⚡ <strong>Telemetry Turnaround:</strong> &lt; 18ms</span>
                <span>🔒 <strong>NABH Digital Bed Register:</strong> Auto-Logged</span>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#38BDF8', fontWeight: 700 }}>
                💡 Click "1-Click Admit STEMI to ICU-03" to test instant intake!
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 3: 24/7 RETAIL CHEMIST & PHARMACY BLISTER FRACTION POS               */}
        {/* ========================================================================= */}
        {activePersona === 'PHARMACY' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#F8FAFC' }}>
                    Chemist Fast POS & Strip-Fraction Blister Counter
                  </span>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    FEFO Batch Binding • 4/10 Cut-Strip Exact Unit Math • Barcode Scanner
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyBlisterFraction(4)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#38BDF8',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  ✂️ Simulate "Dolo 4/10 Cut"
                </button>
              </div>

              {/* Items Table */}
              <div
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 14px', backgroundColor: 'rgba(255, 255, 255, 0.04)', fontSize: '0.72rem', color: '#94A3B8', fontWeight: 800 }}>
                  <span>MEDICINE & FORMULATION</span>
                  <span>FEFO BATCH</span>
                  <span>QTY SOLD</span>
                  <span style={{ textAlign: 'right' }}>LINE TOTAL</span>
                </div>
                {cart.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '12px 14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '0.8125rem', color: '#E2E8F0', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{item.name}</div>
                      {item.isFraction && (
                        <span style={{ fontSize: '0.6875rem', color: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          ✂️ Blister Fraction ({item.qtyTabs}/{item.packSize} Tabs @ ₹{item.unitPrice}/tab)
                        </span>
                      )}
                    </div>
                    <span style={{ color: '#FCD34D', fontSize: '0.75rem', fontFamily: 'monospace' }}>{item.batch} ({item.exp})</span>
                    <span><strong>{item.qtyTabs}</strong> {item.qtyTabs === item.packSize ? 'Tabs (Full)' : 'Tabs (Cut)'}</span>
                    <span style={{ textAlign: 'right', fontWeight: 800, color: '#10B981' }}>₹{(item.qtyTabs * item.unitPrice).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Visual Blister Cut Studio (Rank #2 Innovation Highlighted!) */}
              <div
                style={{
                  marginTop: '16px',
                  padding: '14px 16px',
                  backgroundColor: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase' }}>
                      ✂️ INTERACTIVE BLISTER STRIP CUT STUDIO (DOLO 650MG):
                    </span>
                    {isBlisterCutApplied && (
                      <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', fontSize: '0.6875rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px' }}>
                        ✓ CUT APPLIED
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>
                    Unit Price: <strong>₹2.17 / tab</strong>
                  </span>
                </div>

                {/* Numbered Pill Bubbles with Cut Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((pillNum) => {
                    const isSelected = pillNum <= selectedFractionTabs;
                    const isCutBorder = pillNum === selectedFractionTabs && selectedFractionTabs < 15;
                    return (
                      <React.Fragment key={pillNum}>
                        <button
                          type="button"
                          onClick={() => handleApplyBlisterFraction(pillNum)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            border: isSelected ? '1.5px solid #10B981' : '1px solid rgba(255, 255, 255, 0.15)',
                            backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                            color: isSelected ? '#34D399' : '#64748B',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {pillNum}
                        </button>

                        {isCutBorder && (
                          <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px', color: '#F87171', fontWeight: 800, fontSize: '0.75rem' }}>
                            ✂️
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  Selling <strong>{selectedFractionTabs} of 15 tablets</strong> = ₹{(selectedFractionTabs * 2.17).toFixed(2)} (Patient saves ₹{((15 - selectedFractionTabs) * 2.17).toFixed(2)} compared to buying full box)
                </div>
              </div>
            </div>

            {/* POS Checkout & Thermal Slip */}
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
                  INSTANT THERMAL RECEIPT & UPI SETTLEMENT
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10B981', marginTop: '6px' }}>
                  ₹{calculateCartTotal()}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Inclusive of 12% GST • Sub-10ms Batch Deduct
                </div>

                {/* Simulated UPI QR Box */}
                <div
                  style={{
                    margin: '16px 0',
                    padding: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px dashed rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '1.75rem', marginBottom: '4px' }}>📱</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1' }}>
                    Dynamic UPI QR Ready
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                    Auto-reconciled with hospital cash galla
                  </div>
                </div>
              </div>

              <div>
                {posDispensed && (
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', borderRadius: '8px', padding: '10px', fontSize: '0.75rem', color: '#10B981', fontWeight: 800, textAlign: 'center', marginBottom: '10px' }}>
                    ✓ 80mm ESC/POS Slip Printed & Stock Auto-Debited!
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleDispensePOS}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#10B981',
                    color: '#070C16',
                    fontWeight: 900,
                    fontSize: '0.9375rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.45)'
                  }}
                >
                  ⚡ Fast Checkout (Sub-10ms)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 4: PATHOLOGY LAB & ASTM ANALYZER WORKSPACE                           */}
        {/* ========================================================================= */}
        {activePersona === 'PATHOLOGY' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#F8FAFC' }}>
                  Mindray BC-5000 ASTM Serial Bridge & Panic Intercept
                </span>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Standard Bidirectional ASTM E1381/E1394 LIMS Pipeline • NABL Critical Mandate
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleTriggerPanic}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: isPanicReported ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    color: '#F87171',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  🚨 Trigger Critical Panic Alert (PLT: 14k)
                </button>

                <button
                  type="button"
                  onClick={handleSignOffReport}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#10B981',
                    color: '#070C16',
                    fontSize: '0.78rem',
                    fontWeight: 900,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  ✓ NABL Sign-Off & WhatsApp Dispatch
                </button>
              </div>
            </div>

            {/* Panic Banner Alert if triggered */}
            {isPanicReported && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  border: '1.5px solid #EF4444',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.5rem' }}>🚨</span>
                  <div>
                    <div style={{ fontWeight: 800, color: '#F87171', fontSize: '0.875rem' }}>
                      CRITICAL NABL PANIC VALUE: Platelet Count is 14,000 /uL (Normal: 150,000 - 450,000)
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>
                      NABL 15-Minute Telephonic Mandate Activated • Attending: Dr. Aryan Sharma (OPD Desk)
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => alert('Automated audio PBX dispatch sent to attending Physician!')}
                  style={{
                    backgroundColor: '#EF4444',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  📞 Dispatch PBX Audio Alert
                </button>
              </div>
            )}

            {/* ASTM Terminal Frame */}
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '14px 18px',
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                color: '#38BDF8',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              {astmLogs.map((log, lidx) => (
                <div key={lidx} style={{ color: log.includes('PLT^Platelet') ? '#F87171' : '#38BDF8' }}>
                  {log}
                </div>
              ))}
            </div>

            {isLabSigned && (
              <div style={{ marginTop: '14px', padding: '12px 16px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', fontSize: '0.8125rem', color: '#10B981', fontWeight: 800 }}>
                ✓ Report verified by Pathologist with cryptographic SHA-256 signature and delivered to patient WhatsApp with QR verification!
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. POST-DEMO CELEBRATORY CONVERSION BANNER (HIGH CONVERSION HOOK)         */}
      {/* ========================================================================= */}
      {challengeCompleted && (
        <div
          style={{
            padding: '18px 28px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            borderTop: '1.5px solid #10B981',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem' }}>🎉</span>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#FFFFFF' }}>
                Challenge Completed in {completedTimeMs ? (completedTimeMs / 1000).toFixed(1) : '4.2'} Seconds!
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#A7F3D0' }}>
                You just completed in seconds what takes 8–15 minutes on legacy HMS systems.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {onOpenRegisterModal && (
              <button
                type="button"
                onClick={onOpenRegisterModal}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#10B981',
                  color: '#070C16',
                  fontWeight: 900,
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
                }}
              >
                ⚡ Claim 6 Months Free License ➔
              </button>
            )}

            {onOpenDemoModal && (
              <button
                type="button"
                onClick={onOpenDemoModal}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                📅 VIP Director Walkthrough
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BOTTOM DIRECT LAUNCH BAR                                               */}
      {/* ========================================================================= */}
      <div
        style={{
          padding: '16px 28px',
          backgroundColor: 'rgba(11, 17, 32, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
          Ready to deploy DocSearch to your hospital or clinic workstation?
        </span>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {onOpenDemoModal && (
            <button
              type="button"
              onClick={onOpenDemoModal}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#F1F5F9',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Book 1-on-1 VIP Walkthrough
            </button>
          )}

          <a
            href={partnerPortalUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              backgroundColor: '#38BDF8',
              color: '#070C16',
              fontSize: '0.8125rem',
              fontWeight: 900,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.35)'
            }}
          >
            Launch Full Partner Desk ➔
          </a>
        </div>
      </div>
    </div>
  );
};
