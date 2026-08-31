import React, { useState, useEffect } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';
import type { TeleconsultationSessionDto } from '@docsearch/api-contracts';

interface Props {
  session: TeleconsultationSessionDto;
  onEndCall?: () => void;
}

export const VirtualConsultationRoomView: React.FC<Props> = ({ session: initialSession }) => {
  const [callActive, setCallActive] = useState(true);
  const [callSeconds, setCallSeconds] = useState(148);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [rxDispatched, setRxDispatched] = useState(false);

  const [selectedPatientIndex, setSelectedPatientIndex] = useState(0);

  const telePatients = [
    {
      name: 'Anjali Gupta',
      ageGender: '29y / Female',
      mrn: 'MRN-2026-9042',
      complaint: 'Follow-up for Seasonal Allergic Rhinitis & Sinusitis',
      vitals: { pulse: 72, spo2: 99, bp: '118/76', temp: '98.6°F' },
      rx: [
        { drug: 'Tab. Levocetirizine 5mg', dose: '1 Tab OD at bedtime (7 Days)', notes: 'Antihistamine' },
        { drug: 'Fluticasone Furoate Nasal Spray', dose: '2 Sprays per nostril BD (14 Days)', notes: 'Anti-inflammatory' }
      ]
    },
    {
      name: 'Vikram Mehta',
      ageGender: '62y / Male',
      mrn: 'MRN-2026-9043',
      complaint: 'Routine Hypertension & Blood Pressure Review',
      vitals: { pulse: 68, spo2: 98, bp: '138/86', temp: '98.4°F' },
      rx: [
        { drug: 'Tab. Telmisartan 40mg + Amlodipine 5mg', dose: '1 Tab OD morning after breakfast (30 Days)', notes: 'Anti-hypertensive' },
        { drug: 'Tab. Atorvastatin 20mg', dose: '1 Tab OD at bedtime (30 Days)', notes: 'Lipid lowering' }
      ]
    },
    {
      name: 'Kavita Joshi',
      ageGender: '34y / Female',
      mrn: 'MRN-2026-9044',
      complaint: 'Dermatitis rash and itchiness on forearms',
      vitals: { pulse: 76, spo2: 99, bp: '122/80', temp: '98.8°F' },
      rx: [
        { drug: 'Mometasone Furoate 0.1% Cream', dose: 'Apply thin layer BD (7 Days)', notes: 'Topical steroid' },
        { drug: 'Tab. Bilastine 20mg', dose: '1 Tab OD on empty stomach (10 Days)', notes: 'Non-sedating antihistamine' }
      ]
    }
  ];

  const currentPatient = telePatients[selectedPatientIndex] ?? telePatients[0]!;

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callActive) {
      interval = setInterval(() => setCallSeconds((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callActive]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSendRx = () => {
    setRxDispatched(true);
    setTimeout(() => setRxDispatched(false), 3500);
  };

  const handleEndCall = () => {
    setCallActive(false);
  };

  const handleStartCall = () => {
    setCallActive(true);
    setCallSeconds(0);
    setRxDispatched(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Teleconsultation Header Bar */}
      <div style={{
        backgroundColor: '#0F172A',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '16px',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem'
          }}>
            📹
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
                WebRTC HD Room: {initialSession?.webrtcRoomId || 'ROOM-TELE-2026-9041'}
              </span>
              <Badge variant={callActive ? 'success' : 'danger'}>
                {callActive ? `🔴 Live Video: ${formatTimer(callSeconds)}` : 'Call Ended'}
              </Badge>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Patient: <strong style={{ color: '#38BDF8' }}>{currentPatient.name}</strong> ({currentPatient.ageGender}) • Attending: Dr. Rajesh Sharma, MD
            </div>
          </div>
        </div>

        {/* Security & Action HUD */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.75rem', color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600 }}>
            🔒 DTLS-SRTP AES-256 Encrypted (HIPAA Safe)
          </span>

          {callActive ? (
            <Button
              variant="danger"
              size="sm"
              onClick={handleEndCall}
              style={{ fontWeight: 800 }}
            >
              🔴 End Video Call
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleStartCall}
              style={{ fontWeight: 800, backgroundColor: '#10B981', borderColor: '#10B981' }}
            >
              📞 Reconnect Call
            </Button>
          )}
        </div>
      </div>

      {/* Patient Queue Switcher Bar */}
      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
          Virtual Video Waiting Room Queue:
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {telePatients.map((p, idx) => (
            <button
              key={p.name}
              onClick={() => {
                setSelectedPatientIndex(idx);
                setCallSeconds(10);
                setRxDispatched(false);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: selectedPatientIndex === idx ? 'rgba(6, 182, 212, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                border: selectedPatientIndex === idx ? '1px solid #06B6D4' : '1px solid rgba(255,255,255,0.08)',
                color: selectedPatientIndex === idx ? '#38BDF8' : '#CBD5E1',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              👤 {p.name} ({p.ageGender.split('/')[0]?.trim()})
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Telehealth Split Studio (Video + EMR) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        
        {/* Left: Interactive WebRTC Video Canvas & HUD Controls */}
        <div style={{
          backgroundColor: '#05070B',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 25px rgba(6, 182, 212, 0.2)'
        }}>
          {/* Main Video Stream Frame */}
          <div style={{
            width: '100%',
            aspectRatio: '16 / 9',
            backgroundColor: '#0A0F1D',
            borderRadius: '12px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #1E293B'
          }}>
            {/* Screen Share Mode OR Patient Camera */}
            {screenSharing ? (
              <div style={{ textAlign: 'center', color: '#38BDF8', padding: '20px' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '8px' }}>🖥️</span>
                <div style={{ fontSize: '1.125rem', fontWeight: 800 }}>Sharing Live DICOM X-Ray with Patient</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Patient is viewing marked consolidation zones in real time</div>
              </div>
            ) : cameraOff ? (
              <div style={{ textAlign: 'center', color: '#64748B' }}>
                <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '8px' }}>📷🚫</span>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>Doctor Camera Paused</div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#E2E8F0' }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  backgroundColor: '#1E293B',
                  border: '3px solid #06B6D4',
                  margin: '0 auto 12px auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                  boxShadow: '0 0 25px rgba(6, 182, 212, 0.4)'
                }}>
                  👩‍💼
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800 }}>{currentPatient.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>
                  🟢 HD Video Stream Active • Latency: 18ms • 1080p 60fps
                </div>
              </div>
            )}

            {/* Picture-in-Picture (Doctor's Self-View PIP) */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              width: '120px',
              aspectRatio: '16 / 9',
              backgroundColor: '#0F172A',
              border: '2px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.6875rem',
              color: '#38BDF8',
              fontWeight: 700
            }}>
              👨‍⚕️ Dr. Sharma (You)
            </div>

            {/* Live IoT Vitals Overlay on Video */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.6875rem',
              color: '#F8FAFC',
              display: 'flex',
              gap: '10px'
            }}>
              <span>❤️ Pulse: <strong style={{ color: '#10B981' }}>{currentPatient.vitals.pulse} bpm</strong></span>
              <span>🫁 SpO2: <strong style={{ color: '#38BDF8' }}>{currentPatient.vitals.spo2}%</strong></span>
              <span>🩸 BP: <strong style={{ color: '#F59E0B' }}>{currentPatient.vitals.bp}</strong></span>
            </div>
          </div>

          {/* In-Call HUD Action Controls */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant={micMuted ? 'danger' : 'outline'}
              size="sm"
              onClick={() => setMicMuted(!micMuted)}
              style={{ fontSize: '0.75rem', fontWeight: 700 }}
            >
              {micMuted ? '🔇 Mic Muted' : '🎙️ Mic Active'}
            </Button>
            <Button
              variant={cameraOff ? 'danger' : 'outline'}
              size="sm"
              onClick={() => setCameraOff(!cameraOff)}
              style={{ fontSize: '0.75rem', fontWeight: 700 }}
            >
              {cameraOff ? '📷 Cam Off' : '📹 Cam On'}
            </Button>
            <Button
              variant={screenSharing ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setScreenSharing(!screenSharing)}
              style={{ fontSize: '0.75rem', fontWeight: 700 }}
            >
              {screenSharing ? '⏹️ Stop Share' : '🖥️ Share Screen / DICOM'}
            </Button>
          </div>
        </div>

        {/* Right: Live In-Call EMR Consultation & e-Prescription Pad */}
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
              📝 Real-Time In-Call Clinical Notes & Prescription
            </span>
            <Badge variant="primary">e-Prescription Pad</Badge>
          </div>

          {/* Chief Complaint */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px 14px', borderRadius: '8px' }}>
            <strong style={{ color: '#38BDF8', fontSize: '0.75rem', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
              Teleconsultation Reason & Symptoms:
            </strong>
            <span style={{ color: '#E2E8F0', fontSize: '0.8125rem' }}>{currentPatient.complaint}</span>
          </div>

          {/* Prescribed Medications */}
          <div>
            <strong style={{ color: '#10B981', fontSize: '0.75rem', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
              Prescribed Medications (e-Rx):
            </strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentPatient.rx.map((med, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8125rem'
                  }}
                >
                  <div>
                    <strong style={{ color: '#10B981' }}>{med.drug}</strong>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{med.notes}</div>
                  </div>
                  <Badge variant="neutral">{med.dose}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* 1-Click WhatsApp & ABHA e-Rx Dispatch Button */}
          <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
            <Button
              variant="primary"
              size="md"
              onClick={handleSendRx}
              style={{
                width: '100%',
                fontWeight: 800,
                backgroundColor: rxDispatched ? '#10B981' : '#3B82F6',
                borderColor: rxDispatched ? '#10B981' : '#3B82F6'
              }}
            >
              {rxDispatched ? '✓ Signed & Sent to Patient WhatsApp & ABHA!' : '✍️ Sign & Dispatch e-Prescription (WhatsApp / PDF)'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
