import React, { useState, useEffect, useRef } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';

export const LiveIcuTelemetryCodeBlueView: React.FC = () => {
  const [selectedBed, setSelectedBed] = useState<'BED_01' | 'BED_04' | 'BED_07' | 'BED_09'>('BED_04');
  const [codeBlueActive, setCodeBlueActive] = useState(true);
  const [shockDelivered, setShockDelivered] = useState(false);
  const [epiGiven, setEpiGiven] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const bedsData = {
    BED_01: {
      bedName: 'ICU Bed 01 (Post-Surgical CCU)',
      patientName: 'Ramesh Patel',
      ageGender: '54y / Male',
      uhid: 'UHID-2026-8812',
      diagnosis: 'Post-CABG Day 1 (Coronary Artery Bypass Graft)',
      status: 'STABLE',
      news2Score: 1,
      hr: 76,
      spo2: 99,
      bp: '124/80',
      map: 95,
      rr: 16,
      temp: '98.6°F',
      rhythm: 'Normal Sinus Rhythm',
      infusions: 'Dextrose 5% @ 50 ml/hr',
      ventilator: 'Room Air (Spontaneous)'
    },
    BED_04: {
      bedName: 'ICU Bed 04 (High Dependency Critical)',
      patientName: 'Shanti Devi',
      ageGender: '68y / Female',
      uhid: 'UHID-2026-8814',
      diagnosis: 'Septic Shock with Acute Cardiac Decompensation & Hypoxia',
      status: codeBlueActive ? 'CRITICAL_CODE_BLUE' : 'RESUSCITATED_STABLE',
      news2Score: codeBlueActive ? 11 : 3,
      hr: codeBlueActive ? 148 : 84,
      spo2: codeBlueActive ? 84 : 96,
      bp: codeBlueActive ? '82/48' : '118/74',
      map: codeBlueActive ? 59 : 88,
      rr: codeBlueActive ? 32 : 18,
      temp: codeBlueActive ? '102.4°F' : '99.1°F',
      rhythm: codeBlueActive ? 'Ventricular Tachycardia (Wide QRS)' : 'Sinus Tachycardia (Controlled)',
      infusions: 'Noradrenaline @ 0.12 mcg/kg/min + Vasopressin',
      ventilator: codeBlueActive ? 'SIMV Mode • FiO2 80% • PEEP 12' : 'PSV Mode • FiO2 40%'
    },
    BED_07: {
      bedName: 'ICU Bed 07 (Respiratory Critical Care)',
      patientName: 'Anil Kapoor',
      ageGender: '42y / Male',
      uhid: 'UHID-2026-8819',
      diagnosis: 'Severe Acute Respiratory Distress Syndrome (ARDS)',
      status: 'GUARDED',
      news2Score: 5,
      hr: 92,
      spo2: 94,
      bp: '130/84',
      map: 99,
      rr: 24,
      temp: '99.8°F',
      rhythm: 'Sinus Tachycardia',
      infusions: 'Propofol @ 25 mcg/kg/min',
      ventilator: 'PRVC Mode • FiO2 50% • PEEP 10'
    },
    BED_09: {
      bedName: 'PICU Bed 09 (Pediatric Critical Care)',
      patientName: 'Master Kabir',
      ageGender: '3y / Male',
      uhid: 'UHID-2026-8822',
      diagnosis: 'Severe Acute Bronchiolitis with Subcostal Retractions',
      status: 'MONITORED',
      news2Score: 3,
      hr: 118,
      spo2: 97,
      bp: '96/60',
      map: 72,
      rr: 28,
      temp: '99.2°F',
      rhythm: 'Normal Pediatric Sinus Rhythm',
      infusions: 'Isolyte-P @ 35 ml/hr',
      ventilator: 'High-Flow Nasal Cannula (HFNC 12 L/min)'
    }
  };

  const current = bedsData[selectedBed];

  // Synthesize Web Audio API siren when Code Blue is triggered
  const playCodeBlueSiren = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1320, ctx.currentTime + 0.3);
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Real-time canvas ECG waveform animator
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let x = 0;
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#05070A';
    ctx.fillRect(0, 0, width, height);

    const render = () => {
      // Fade trailing line
      ctx.fillStyle = 'rgba(5, 7, 10, 0.08)';
      ctx.fillRect(x, 0, 8, height);

      // Draw Grid Lines
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.lineWidth = 1;

      // Draw ECG Lead II (Green)
      ctx.beginPath();
      ctx.strokeStyle = codeBlueActive && selectedBed === 'BED_04' ? '#EF4444' : '#10B981';
      ctx.lineWidth = 2;
      
      const midY = height * 0.25;
      let y = midY;
      const cycle = x % 80;

      if (codeBlueActive && selectedBed === 'BED_04') {
        // Ventricular Tachycardia Waveform (Sine / Wide QRS)
        y = midY + Math.sin(x * 0.15) * 35;
      } else {
        // Normal P-Q-R-S-T
        if (cycle > 20 && cycle < 28) y = midY - 6; // P Wave
        else if (cycle === 34) y = midY + 8; // Q
        else if (cycle === 37) y = midY - 45; // R Peak
        else if (cycle === 40) y = midY + 18; // S
        else if (cycle > 46 && cycle < 56) y = midY - 10; // T Wave
      }

      ctx.moveTo(x === 0 ? 0 : x - 2, y);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Draw SpO2 Pleth Waveform (Cyan)
      ctx.beginPath();
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 1.5;
      const plethY = height * 0.65 + Math.sin((x % 60) * 0.1) * (selectedBed === 'BED_04' && codeBlueActive ? 10 : 20);
      ctx.moveTo(x === 0 ? 0 : x - 2, plethY);
      ctx.lineTo(x, plethY);
      ctx.stroke();

      x = (x + 2) % width;
      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [codeBlueActive, selectedBed]);

  const handleDeliverShock = () => {
    setShockDelivered(true);
    playCodeBlueSiren();
    setTimeout(() => {
      setCodeBlueActive(false);
    }, 800);
  };

  const handleGiveEpinephrine = () => {
    setEpiGiven(true);
    setTimeout(() => setEpiGiven(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Header */}
      <div style={{
        backgroundColor: codeBlueActive && selectedBed === 'BED_04' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.1)',
        border: codeBlueActive && selectedBed === 'BED_04' ? '2px solid #EF4444' : '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        animation: codeBlueActive && selectedBed === 'BED_04' ? 'pulse 1.5s infinite' : 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '2rem' }}>{codeBlueActive && selectedBed === 'BED_04' ? '🚨' : '🫀'}</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
                Live ICU Bedside Telemetry & Code Blue Early Warning System
              </h2>
              <Badge variant={codeBlueActive && selectedBed === 'BED_04' ? 'danger' : 'success'}>
                {codeBlueActive && selectedBed === 'BED_04' ? 'CRITICAL: CODE BLUE ACTIVATED' : 'SMART ICU ONLINE'}
              </Badge>
            </div>
            <p style={{ color: '#94A3B8', fontSize: '0.8125rem', margin: 0 }}>
              Continuous multi-lead ECG, Plethysmography, EtCO2 waveforms & NEWS2 patient deterioration AI triage engine.
            </p>
          </div>
        </div>

        {/* Global Action */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant={codeBlueActive && selectedBed === 'BED_04' ? 'danger' : 'outline'}
            size="sm"
            onClick={() => {
              setCodeBlueActive(!codeBlueActive);
              if (!codeBlueActive) playCodeBlueSiren();
            }}
            style={{ fontWeight: 800 }}
          >
            {codeBlueActive && selectedBed === 'BED_04' ? '🚨 Code Blue Siren Active' : '⚡ Simulate Critical Code Blue'}
          </Button>
        </div>
      </div>

      {/* Multi-Bed Ward Selector Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
        {[
          { key: 'BED_01', name: 'Bed 01 (Post-CABG)', patient: 'Ramesh Patel', hr: 76, spo2: 99, status: 'STABLE', bg: 'rgba(16, 185, 129, 0.1)', border: '#10B981' },
          { key: 'BED_04', name: 'Bed 04 (Septic Shock)', patient: 'Shanti Devi', hr: codeBlueActive ? 148 : 84, spo2: codeBlueActive ? 84 : 96, status: codeBlueActive ? 'CODE BLUE' : 'STABLE', bg: codeBlueActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.1)', border: codeBlueActive ? '#EF4444' : '#10B981' },
          { key: 'BED_07', name: 'Bed 07 (ARDS Vent)', patient: 'Anil Kapoor', hr: 92, spo2: 94, status: 'GUARDED', bg: 'rgba(245, 158, 11, 0.1)', border: '#F59E0B' },
          { key: 'BED_09', name: 'PICU 09 (Pediatric)', patient: 'Master Kabir', hr: 118, spo2: 97, status: 'MONITORED', bg: 'rgba(56, 189, 248, 0.1)', border: '#38BDF8' }
        ].map((b) => (
          <div
            key={b.key}
            onClick={() => setSelectedBed(b.key as typeof selectedBed)}
            style={{
              backgroundColor: selectedBed === b.key ? b.bg : 'rgba(15, 23, 42, 0.6)',
              border: selectedBed === b.key ? `2px solid ${b.border}` : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '14px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: selectedBed === b.key ? '0 0 20px rgba(0,0,0,0.5)' : 'none'
            }}
          >
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>{b.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{b.patient}</div>
              <div style={{ fontSize: '0.6875rem', color: '#CBD5E1', marginTop: '4px' }}>
                ❤️ {b.hr} bpm • 🫁 {b.spo2}%
              </div>
            </div>
            <Badge variant={b.status === 'CODE BLUE' ? 'danger' : b.status === 'GUARDED' ? 'warning' : 'success'}>
              {b.status}
            </Badge>
          </div>
        ))}
      </div>

      {/* 2-Column Main Bedside Telemetry Station */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* Left: High-Tech ICU Canvas Waveform Monitor */}
        <div style={{
          backgroundColor: '#05070A',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '16px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.9), 0 0 30px rgba(16, 185, 129, 0.2)'
        }}>
          {/* Monitor Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
            <div>
              <span style={{ fontSize: '0.9375rem', fontWeight: 900, color: '#F8FAFC' }}>{current.bedName}</span>
              <div style={{ fontSize: '0.6875rem', color: '#38BDF8' }}>Patient: <strong>{current.patientName}</strong> ({current.ageGender}) • {current.uhid}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>NEWS2 RISK SCORE:</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: current.news2Score >= 7 ? '#EF4444' : current.news2Score >= 3 ? '#F59E0B' : '#10B981', fontFamily: 'monospace' }}>
                {current.news2Score} / 12 ({current.news2Score >= 7 ? 'HIGH RISK' : 'LOW RISK'})
              </div>
            </div>
          </div>

          {/* Animated Canvas Waveform Frame */}
          <div style={{ position: 'relative', width: '100%', height: '240px', backgroundColor: '#05070A', borderRadius: '10px', overflow: 'hidden', border: '1px solid #1E293B' }}>
            <canvas ref={canvasRef} width={500} height={240} style={{ width: '100%', height: '100%' }} />

            {/* Waveform Labels Overlay */}
            <div style={{ position: 'absolute', top: '10px', left: '12px', fontSize: '0.6875rem', color: codeBlueActive && selectedBed === 'BED_04' ? '#EF4444' : '#10B981', fontWeight: 800 }}>
              ECG LEAD II • {current.rhythm}
            </div>
            <div style={{ position: 'absolute', top: '130px', left: '12px', fontSize: '0.6875rem', color: '#06B6D4', fontWeight: 800 }}>
              PLETH (SpO2) • 100% PULSE SYNCHRONOUS
            </div>
          </div>

          {/* Real-Time Parameter Numbers Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '8px' }}>
              <div style={{ fontSize: '0.625rem', color: '#A7F3D0', fontWeight: 700 }}>PULSE / HR</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: codeBlueActive && selectedBed === 'BED_04' ? '#EF4444' : '#10B981', fontFamily: 'monospace' }}>
                {current.hr}
              </div>
              <div style={{ fontSize: '0.625rem', color: '#94A3B8' }}>bpm</div>
            </div>

            <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '8px', padding: '8px' }}>
              <div style={{ fontSize: '0.625rem', color: '#BAE6FD', fontWeight: 700 }}>SpO2 OXYGEN</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: current.spo2 < 90 ? '#EF4444' : '#06B6D4', fontFamily: 'monospace' }}>
                {current.spo2}%
              </div>
              <div style={{ fontSize: '0.625rem', color: '#94A3B8' }}>Pleth Sat</div>
            </div>

            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', padding: '8px' }}>
              <div style={{ fontSize: '0.625rem', color: '#FDE68A', fontWeight: 700 }}>ABP / NIBP</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F59E0B', fontFamily: 'monospace', marginTop: '2px' }}>
                {current.bp}
              </div>
              <div style={{ fontSize: '0.625rem', color: '#94A3B8' }}>MAP: {current.map}</div>
            </div>

            <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '8px', padding: '8px' }}>
              <div style={{ fontSize: '0.625rem', color: '#E9D5FF', fontWeight: 700 }}>RESP RATE</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#C084FC', fontFamily: 'monospace' }}>
                {current.rr}
              </div>
              <div style={{ fontSize: '0.625rem', color: '#94A3B8' }}>breaths/min</div>
            </div>
          </div>
        </div>

        {/* Right: Resuscitation Actions & Infusion Pump Controls */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase' }}>
              💉 Bedside Critical Care & Resuscitation Suite
            </span>
            <Badge variant="primary">ACLS Protocol Ready</Badge>
          </div>

          {/* Patient Clinical State */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '8px', fontSize: '0.8125rem' }}>
            <strong style={{ color: '#38BDF8', display: 'block', fontSize: '0.6875rem', textTransform: 'uppercase', marginBottom: '2px' }}>Clinical Diagnosis:</strong>
            <span style={{ color: '#F8FAFC', fontWeight: 700 }}>{current.diagnosis}</span>
          </div>

          {/* Ventilator & Infusion Pumps */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8125rem' }}>
            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '10px', borderRadius: '8px' }}>
              <span style={{ color: '#94A3B8', fontSize: '0.6875rem', display: 'block' }}>Mechanical Ventilator:</span>
              <strong style={{ color: '#A7F3D0' }}>{current.ventilator}</strong>
            </div>
            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '10px', borderRadius: '8px' }}>
              <span style={{ color: '#94A3B8', fontSize: '0.6875rem', display: 'block' }}>Vasoactive Infusion:</span>
              <strong style={{ color: '#FCD34D' }}>{current.infusions}</strong>
            </div>
          </div>

          {/* ACLS Emergency Resuscitation Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto', paddingTop: '10px' }}>
            <strong style={{ color: '#EF4444', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              Emergency Crisis Actions:
            </strong>

            <Button
              variant="danger"
              size="md"
              onClick={handleDeliverShock}
              style={{ width: '100%', fontWeight: 800 }}
            >
              {shockDelivered ? '⚡ 150J Biphasic Shock Delivered!' : '⚡ Deliver 150J Defibrillator Shock (Cardioversion)'}
            </Button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGiveEpinephrine}
                style={{ fontWeight: 700, fontSize: '0.75rem' }}
              >
                {epiGiven ? '✓ 1mg Epi Administered' : '💉 Bolus 1mg IV Epinephrine'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                style={{ fontWeight: 700, fontSize: '0.75rem' }}
              >
                🖨️ Print ECG Telemetry Strip
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
