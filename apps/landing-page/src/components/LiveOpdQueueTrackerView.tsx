import React, { useState, useEffect, useMemo } from 'react';
import { DocSearchLogo, Button, Badge } from '@docsearch/ui-kit';

export interface LiveOpdQueueTrackerViewProps {
  initialTokenNumber?: string;
  initialDoctorName?: string;
  initialDepartment?: string;
  initialRoomNumber?: string;
  initialPatientName?: string;
  onBackToHome?: () => void;
}

export const LiveOpdQueueTrackerView: React.FC<LiveOpdQueueTrackerViewProps> = ({
  initialTokenNumber,
  initialDoctorName,
  initialDepartment,
  initialRoomNumber,
  initialPatientName,
  onBackToHome
}) => {
  // Parse URL query parameters if available
  const queryParams = useMemo(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return {
        token: p.get('token') || p.get('t') || initialTokenNumber || '14',
        doctor: p.get('doc') || p.get('doctor') || initialDoctorName || 'Dr. Rajesh Sharma, MD (Med)',
        dept: p.get('dept') || initialDepartment || 'General Medicine & Diabetology',
        room: p.get('room') || initialRoomNumber || 'Chamber 104 (1st Floor, Wing B)',
        patient: p.get('name') || p.get('patient') || initialPatientName || 'Rahul Verma',
        facility: p.get('facility') || 'Apex Medicity Multi-Speciality Hospital & Trauma Centre'
      };
    }
    return {
      token: initialTokenNumber || '14',
      doctor: initialDoctorName || 'Dr. Rajesh Sharma, MD (Med)',
      dept: initialDepartment || 'General Medicine & Diabetology',
      room: initialRoomNumber || 'Chamber 104 (1st Floor, Wing B)',
      patient: initialPatientName || 'Rahul Verma',
      facility: 'Apex Medicity Multi-Speciality Hospital & Trauma Centre'
    };
  }, [initialTokenNumber, initialDoctorName, initialDepartment, initialRoomNumber, initialPatientName]);

  const [tokenInput, setTokenInput] = useState(queryParams.token);
  const [activeToken, setActiveToken] = useState(queryParams.token);
  const [currentServing, setCurrentServing] = useState(11);
  const [isAudibleAlertOn, setIsAudibleAlertOn] = useState(true);
  const [isCalled, setIsCalled] = useState(false);
  const [wheelchairRequested, setWheelchairRequested] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());

  // Numerical token comparison
  const parsedMyToken = parseInt(activeToken.replace(/\D/g, ''), 10) || 14;
  const patientsAhead = Math.max(0, parsedMyToken - currentServing);
  const estimatedWaitMinutes = isCalled ? 0 : patientsAhead * 4;

  // Beep synthesizer using Web Audio API
  const playCallChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch {
      // AudioContext unavailable or restricted
    }
  };

  useEffect(() => {
    if (patientsAhead === 0 && !isCalled) {
      setIsCalled(true);
      if (isAudibleAlertOn) {
        playCallChime();
      }
    }
  }, [patientsAhead, isCalled, isAudibleAlertOn]);

  const handleSimulateQueueStep = () => {
    if (currentServing < parsedMyToken) {
      const nextServing = currentServing + 1;
      setCurrentServing(nextServing);
      setLastRefreshed(new Date().toLocaleTimeString());
      if (nextServing === parsedMyToken) {
        setIsCalled(true);
        if (isAudibleAlertOn) playCallChime();
      }
    } else {
      // Reset for demo loop
      setCurrentServing(Math.max(1, parsedMyToken - 3));
      setIsCalled(false);
      setLastRefreshed(new Date().toLocaleTimeString());
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🏥 *DocSearch Live OPD Queue Tracker*\n\n` +
      `• Patient: *${queryParams.patient}*\n` +
      `• Token Number: *#${activeToken}*\n` +
      `• Doctor: *${queryParams.doctor}*\n` +
      `• Room: *${queryParams.room}*\n` +
      `• Currently Serving: *#${currentServing}* (${patientsAhead} patients ahead)\n` +
      `• Est. Wait Time: *~${estimatedWaitMinutes} mins*\n\n` +
      `Track Live in Real-Time: ${window.location.origin}/?view=track-token&token=${activeToken}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#090D16',
        color: '#F8FAFC',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 16px 48px',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Navbar */}
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <DocSearchLogo size="sm" clickable redirectUrl="/" />
          <Badge variant="primary">LIVE OPD RADAR</Badge>
        </div>
        {onBackToHome && (
          <button
            onClick={onBackToHome}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#94A3B8',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            ← Exit
          </button>
        )}
      </div>

      {/* Main Patient Card Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {/* Hospital Letterhead Header */}
        <div
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '16px 18px',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#38BDF8' }}>
              {queryParams.facility}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
              Autonomous OPD Queue Orchestrator • 0ms Live Refresh
            </div>
          </div>
          <span style={{ fontSize: '1.4rem' }}>🏥</span>
        </div>

        {/* Big Glowing Live Token Hero Banner */}
        <div
          style={{
            background: isCalled
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: isCalled ? '2px solid #10B981' : '1.5px solid rgba(56, 189, 248, 0.4)',
            boxShadow: isCalled
              ? '0 0 35px rgba(16, 185, 129, 0.4)'
              : '0 12px 36px rgba(0, 0, 0, 0.5)',
            borderRadius: '20px',
            padding: '24px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {isCalled && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                backgroundColor: '#10B981',
                color: '#064E3B',
                fontWeight: 900,
                fontSize: '0.75rem',
                padding: '4px',
                letterSpacing: '0.05em'
              }}
            >
              📢 IT'S YOUR TURN — PLEASE PROCEED TO ROOM NOW
            </div>
          )}

          <div style={{ marginTop: isCalled ? '12px' : '0' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8' }}>
              Your OPD Queue Token
            </span>
            <div
              style={{
                fontSize: '3.6rem',
                fontWeight: 900,
                color: isCalled ? '#6EE7B7' : '#FFFFFF',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                textShadow: isCalled ? '0 0 20px rgba(16, 185, 129, 0.6)' : 'none'
              }}
            >
              #{activeToken}
            </div>
            <div style={{ fontSize: '0.88rem', color: '#CBD5E1', fontWeight: 600 }}>
              {queryParams.patient}
            </div>
          </div>

          {/* Real-Time Metrics Strip */}
          <div
            style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
              borderRadius: '12px',
              padding: '12px 8px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Now Serving</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8' }}>
                #{currentServing}
              </div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.1)', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Ahead of You</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: patientsAhead === 0 ? '#10B981' : '#F59E0B' }}>
                {patientsAhead === 0 ? '0 (YOU)' : `${patientsAhead} Patients`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Est. Wait Time</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                {isCalled ? '0m' : `~${estimatedWaitMinutes}m`}
              </div>
            </div>
          </div>

          {/* Live Animation Status Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: isCalled ? '#10B981' : '#38BDF8',
                boxShadow: `0 0 10px ${isCalled ? '#10B981' : '#38BDF8'}`
              }}
            />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: isCalled ? '#6EE7B7' : '#BAE6FD' }}>
              {isCalled ? 'DOCTOR IS READY • ENTER CONSULTATION ROOM' : 'WAITING IN LOBBY • KEEP YOUR PHONE HANDY'}
            </span>
          </div>
        </div>

        {/* Doctor & Chamber Details Box */}
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                Consulting Physician
              </span>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>
                {queryParams.doctor}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#38BDF8', marginTop: '2px' }}>
                {queryParams.dept}
              </div>
            </div>
            <span style={{ fontSize: '1.8rem' }}>🩺</span>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '10px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>📍</span>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Consultation Chamber</div>
              <strong style={{ fontSize: '0.85rem', color: '#E0F2FE' }}>{queryParams.room}</strong>
            </div>
          </div>
        </div>

        {/* OPD Care Journey Timeline */}
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
            <span>Care Journey Steps</span>
            <span style={{ fontSize: '0.7rem', color: '#34D399' }}>Live Synced</span>
          </div>

          {[
            { title: 'ABDM Fast-Track Token Generated', desc: 'Scan & share profile verified', status: 'DONE' },
            { title: 'Triage Station Vitals Check', desc: 'BP: 122/80 • SpO2: 99% • Pulse: 72 bpm', status: 'DONE' },
            { title: 'Doctor Chamber Consultation', desc: isCalled ? 'Called to chamber — enter now' : `${patientsAhead} patients ahead in queue`, status: isCalled ? 'ACTIVE' : 'PENDING' },
            { title: 'Pharmacy & Smart WhatsApp Rx Exit', desc: 'Stamped Rx & medicine ready at counter', status: 'PENDING' }
          ].map((step, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: step.status === 'DONE' ? '#10B981' : step.status === 'ACTIVE' ? '#38BDF8' : '#334155',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  flexShrink: 0
                }}
              >
                {step.status === 'DONE' ? '✓' : idx + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: step.status === 'ACTIVE' ? '#38BDF8' : '#F1F5F9' }}>
                  {step.title}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Controls & Zero-App WhatsApp Share */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Button
            variant="primary"
            size="md"
            onClick={handleShareWhatsApp}
            style={{
              backgroundColor: '#10B981',
              borderColor: '#10B981',
              fontWeight: 800,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px'
            }}
          >
            <span>📱</span>
            <span>Share Live Queue Link on WhatsApp</span>
          </Button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAudibleAlertOn(!isAudibleAlertOn)}
              style={{ fontSize: '0.78rem', fontWeight: 700 }}
            >
              {isAudibleAlertOn ? '🔔 Sound Alert (On)' : '🔕 Sound Alert (Muted)'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWheelchairRequested(!wheelchairRequested)}
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: wheelchairRequested ? '#34D399' : '#CBD5E1',
                borderColor: wheelchairRequested ? '#10B981' : 'rgba(255,255,255,0.15)'
              }}
            >
              {wheelchairRequested ? '✓ Wheelchair Attendant Dispatched' : '♿ Need Wheelchair'}
            </Button>
          </div>
        </div>

        {/* Interactive Demo Simulator / Token Switcher */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
              Live Stream Status: Last refreshed at {lastRefreshed}
            </span>
            <button
              onClick={() => setLastRefreshed(new Date().toLocaleTimeString())}
              style={{ background: 'transparent', border: 'none', color: '#38BDF8', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 700 }}
            >
              ↻ Refresh
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Track token #..."
              style={{
                flex: 1,
                backgroundColor: '#0F172A',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#FFF',
                padding: '6px 10px',
                fontSize: '0.8rem'
              }}
            />
            <button
              onClick={() => {
                if (tokenInput.trim()) {
                  setActiveToken(tokenInput.trim());
                  setIsCalled(false);
                }
              }}
              style={{
                backgroundColor: '#0284C7',
                border: 'none',
                borderRadius: '6px',
                color: '#FFF',
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Track
            </button>
            <button
              onClick={handleSimulateQueueStep}
              style={{
                backgroundColor: '#475569',
                border: 'none',
                borderRadius: '6px',
                color: '#FFF',
                padding: '6px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Simulate Queue Movement / Doctor Calling Token"
            >
              ⚡ Next Token
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#64748B', marginTop: '6px' }}>
          DocSearch Autonomous Healthcare OS • Zero-App Patient Experience
        </div>
      </div>
    </div>
  );
};
