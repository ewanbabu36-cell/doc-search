import React, { useState, useEffect } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';

export const WaitingRoomTvDisplayView: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentChamber1Token, setCurrentChamber1Token] = useState({
    tokenNum: 9,
    patientName: 'Rahul Verma',
    doctor: 'Dr. Rajesh Sharma, MD',
    specialty: 'General Medicine & OPD',
    room: 'CHAMBER 1',
    status: 'NOW CALLING'
  });

  const [chambers] = useState([
    { id: 1, room: 'CHAMBER 1', doctor: 'Dr. Rajesh Sharma, MD', dept: 'General Medicine', currentToken: 'TKN-009', status: 'IN_CONSULTATION', patient: 'Rahul Verma' },
    { id: 2, room: 'CHAMBER 2', doctor: 'Dr. Sarah Jenkins, MD', dept: 'Cardiology Clinic', currentToken: 'TKN-004', status: 'IN_CONSULTATION', patient: 'Anjali Gupta' },
    { id: 3, room: 'CHAMBER 3', doctor: 'Dr. Marcus Vance, MD', dept: 'Pediatrics OPD', currentToken: 'TKN-007', status: 'IN_CONSULTATION', patient: 'Master Aarav Patel' }
  ]);

  const [upcomingQueue, setUpcomingQueue] = useState([
    { token: 'TKN-010', name: 'Vikram Mehta', doctor: 'Dr. Rajesh Sharma', chamber: 'Chamber 1', est: '5 mins' },
    { id: 2, token: 'TKN-011', name: 'Sunita Rao', doctor: 'Dr. Sarah Jenkins', chamber: 'Chamber 2', est: '10 mins' },
    { id: 3, token: 'TKN-012', name: 'Kavita Joshi', doctor: 'Dr. Rajesh Sharma', chamber: 'Chamber 1', est: '15 mins' },
    { id: 4, token: 'TKN-013', name: 'Deepak Chopra', doctor: 'Dr. Marcus Vance', chamber: 'Chamber 3', est: '20 mins' },
    { id: 5, token: 'TKN-014', name: 'Pooja Agarwal', doctor: 'Dr. Rajesh Sharma', chamber: 'Chamber 1', est: '25 mins' }
  ]);

  const [voiceLanguage, setVoiceLanguage] = useState<'EN' | 'HI'>('HI');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Live Clock Interval
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio API Synthesized Hospital Chime Sound
  const playHospitalChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Two-tone airport / hospital chime (Ding-Dong: 587Hz -> 880Hz)
      playTone(587.33, 0, 0.4);
      playTone(880, 0.25, 0.6);
    } catch (e) {}
  };

  // Web Speech API Voice Announcement
  const speakTokenAnnouncement = (tokenNum: number, patient: string, room: string) => {
    playHospitalChime();
    setIsSpeaking(true);

    setTimeout(() => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();

        let utteranceText = '';
        if (voiceLanguage === 'HI') {
          utteranceText = `टोकन नंबर ${tokenNum}, ${patient}, कृपया ${room} में पधारें।`;
        } else {
          utteranceText = `Token Number ${tokenNum}, ${patient}, please proceed to ${room}.`;
        }

        const utterance = new SpeechSynthesisUtterance(utteranceText);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.lang = voiceLanguage === 'HI' ? 'hi-IN' : 'en-IN';

        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
      } else {
        setIsSpeaking(false);
      }
    }, 400);
  };

  const handleNextPatient = () => {
    const nextNum = currentChamber1Token.tokenNum + 1;
    const nextPatient = upcomingQueue[0] || { name: 'Patient Next', token: `TKN-0${nextNum}` };

    const updated = {
      tokenNum: nextNum,
      patientName: nextPatient.name,
      doctor: 'Dr. Rajesh Sharma, MD',
      specialty: 'General Medicine & OPD',
      room: 'CHAMBER 1',
      status: 'NOW CALLING'
    };

    setCurrentChamber1Token(updated);
    setUpcomingQueue((prev) => prev.slice(1));
    speakTokenAnnouncement(nextNum, nextPatient.name, 'Chamber 1');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div style={{
      backgroundColor: '#070C16',
      color: '#F8FAFC',
      borderRadius: '20px',
      border: '1px solid rgba(56, 189, 248, 0.25)',
      padding: '24px',
      boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 35px rgba(6, 182, 212, 0.15)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      position: 'relative'
    }}>
      
      {/* TV Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)'
          }}>
            📺
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
              APEX MULTI-SPECIALTY CLINIC & HOSPITAL
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Live Smart TV OPD Token Calling Display & Voice HUD System
            </div>
          </div>
        </div>

        {/* Live Clock & Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '1rem',
            fontWeight: 800,
            fontFamily: 'monospace',
            color: '#38BDF8'
          }}>
            🕒 {currentTime.toLocaleTimeString()}
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <Button
              variant={voiceLanguage === 'HI' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setVoiceLanguage('HI')}
              style={{ fontSize: '0.75rem', fontWeight: 700 }}
            >
              🇮🇳 हिन्दी Voice
            </Button>
            <Button
              variant={voiceLanguage === 'EN' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setVoiceLanguage('EN')}
              style={{ fontSize: '0.75rem', fontWeight: 700 }}
            >
              🇬🇧 English Voice
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            style={{ fontSize: '0.75rem' }}
          >
            ⛶ Fullscreen TV Mode
          </Button>
        </div>
      </div>

      {/* Hero: Active Calling Token Spotlight */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '2px solid #06B6D4',
        borderRadius: '20px',
        padding: '28px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        alignItems: 'center',
        boxShadow: '0 0 35px rgba(6, 182, 212, 0.25)',
        position: 'relative'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 12px #10B981',
              animation: 'pulse 1.5s infinite'
            }} />
            <Badge variant="success">🔔 NOW CALLING / पधारें</Badge>
            {isSpeaking && <Badge variant="warning">📢 Speaking Voice Call...</Badge>}
          </div>

          <div style={{ fontSize: '0.875rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
            Token Number
          </div>
          <div style={{
            fontSize: '4.5rem',
            fontWeight: 900,
            color: '#38BDF8',
            fontFamily: 'monospace',
            lineHeight: 1,
            margin: '8px 0',
            textShadow: '0 0 30px rgba(56, 189, 248, 0.6)'
          }}>
            TKN-{String(currentChamber1Token.tokenNum).padStart(3, '0')}
          </div>

          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC' }}>
            Patient: {currentChamber1Token.patientName}
          </div>
        </div>

        {/* Doctor & Chamber Details */}
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
            Proceed Directly To
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10B981', margin: '4px 0' }}>
            {currentChamber1Token.room}
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#E2E8F0' }}>
            {currentChamber1Token.doctor}
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#38BDF8', marginTop: '2px' }}>
            {currentChamber1Token.specialty}
          </div>

          {/* Interactive Trigger Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => speakTokenAnnouncement(currentChamber1Token.tokenNum, currentChamber1Token.patientName, currentChamber1Token.room)}
              style={{ fontWeight: 800 }}
            >
              📢 Re-Announce Voice Call
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPatient}
              style={{ fontWeight: 800, borderColor: '#10B981', color: '#A7F3D0' }}
            >
              ⏭️ Call Next (TKN-{String(currentChamber1Token.tokenNum + 1).padStart(3, '0')})
            </Button>
          </div>
        </div>
      </div>

      {/* Multi-Chamber Status Grid & Upcoming Waiting Line */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Left: Active OPD Chambers */}
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏥</span> Active Doctor Chambers Status
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {chambers.map((c) => (
              <div
                key={c.id}
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#38BDF8' }}>{c.room}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#E2E8F0', fontWeight: 600 }}>{c.doctor}</div>
                  <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{c.dept}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981', fontFamily: 'monospace' }}>
                    {c.id === 1 ? `TKN-${String(currentChamber1Token.tokenNum).padStart(3, '0')}` : c.currentToken}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                    {c.id === 1 ? currentChamber1Token.patientName : c.patient}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Upcoming In-Lobby Queue */}
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⏳</span> Next In Line (Waiting In Lobby)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {upcomingQueue.slice(0, 4).map((q, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.4)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: '#F59E0B', fontFamily: 'monospace' }}>
                    {q.token}
                  </span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#E2E8F0' }}>{q.name}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  {q.chamber} • <strong style={{ color: '#38BDF8' }}>~{q.est}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Health Ticker */}
      <div style={{
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: '10px',
        padding: '10px 16px',
        fontSize: '0.8125rem',
        color: '#E2E8F0',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ fontWeight: 800, color: '#38BDF8', whiteSpace: 'nowrap' }}>📢 HEALTH NOTICE:</span>
        <div style={{ color: '#CBD5E1', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>
          Free Blood Sugar & BP Screening Camp available at Counter 4 • Ayushman Bharat (ABHA) digital registration open at Reception Desk • Please wear mask if you have cough or fever.
        </div>
      </div>
    </div>
  );
};
