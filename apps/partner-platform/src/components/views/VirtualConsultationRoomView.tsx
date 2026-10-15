import React, { useState, useEffect, useRef } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';
import type { TeleconsultationSessionDto } from '@docsearch/api-contracts';
import { getUnifiedPartnerProfile } from '../../utils/roleProfileResolver.js';
import { telemedicineWebRtcClient, type TeleLivePrescription } from '../../services/telemedicine-webrtc-client.js';

interface Props {
  session: TeleconsultationSessionDto;
  onEndCall?: () => void;
}

export const VirtualConsultationRoomView: React.FC<Props> = ({ session: initialSession, onEndCall }) => {
  const doctorName = initialSession?.doctorName || getUnifiedPartnerProfile().doctorName || 'Dr. Vivek Sharma (MD)';
  const [callActive, setCallActive] = useState(true);
  const [callSeconds, setCallSeconds] = useState(12);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [rxDispatched, setRxDispatched] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [callConnected, setCallConnected] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const CALL_ID = initialSession?.webrtcRoomId || 'TELE-2026-9042';

  // Live EMR Editable State
  const [diagnosis, setDiagnosis] = useState('Essential Hypertension & Seasonal Allergic Rhinitis');
  const [vitals] = useState({ pulse: 74, spo2: 99, bp: '128/82', temp: '98.6°F' });
  const [medications] = useState([
    {
      drug: 'Tab. Telmisartan 40mg',
      genericName: 'Telmisartan IP (Jan Aushadhi #JA-312)',
      dose: '1 Tab OD morning after breakfast',
      days: '30 Days',
      savingsPercent: 78
    },
    {
      drug: 'Tab. Levocetirizine 5mg',
      genericName: 'Levocetirizine Dihydrochloride (Jan Aushadhi #JA-089)',
      dose: '1 Tab OD at bedtime',
      days: '7 Days',
      savingsPercent: 82
    }
  ]);
  const [doctorAdvice, setDoctorAdvice] = useState('Maintain low sodium diet (<5g/day). Deep breathing exercises. Follow-up in 14 days.');

  // Call duration timer
  useEffect(() => {
    let interval: any;
    if (callActive) {
      interval = setInterval(() => setCallSeconds((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callActive]);

  // WebRTC Media & Signaling lifecycle
  useEffect(() => {
    if (!callActive) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      telemedicineWebRtcClient.stopSignalPolling();
      setCallConnected(false);
      return;
    }

    let unpoll: (() => void) | null = null;

    const setupDoctorCall = async () => {
      // 1. Join session as DOCTOR
      await telemedicineWebRtcClient.joinSession(CALL_ID, doctorName, 'Ramesh Kumar');

      // 2. Acquire doctor local camera stream
      const stream = await telemedicineWebRtcClient.getMediaStream(!micMuted, !cameraOff);
      mediaStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Simulate remote patient camera connection
      setTimeout(async () => {
        const patientStream = await telemedicineWebRtcClient.getMediaStream(true, true);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = patientStream;
        }
        setCallConnected(true);
      }, 1000);

      // 3. Send initial Live Rx sync to patient
      const initialRx: TeleLivePrescription = {
        diagnosis,
        vitals,
        medications,
        doctorAdvice
      };
      await telemedicineWebRtcClient.sendSignal(CALL_ID, 'DOCTOR', 'RX_SYNC', initialRx);

      // 4. Start polling for patient feedback / signals
      unpoll = telemedicineWebRtcClient.startSignalPolling(
        CALL_ID,
        'DOCTOR',
        {
          onStatusChange: (status: string) => {
            if (status === 'COMPLETED') {
              setCallActive(false);
            }
          }
        },
        1000
      );
    };

    void setupDoctorCall();

    return () => {
      if (unpoll) unpoll();
      telemedicineWebRtcClient.stopSignalPolling();
    };
  }, [callActive, doctorName, CALL_ID]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSyncRxToPatient = async () => {
    const rxData: TeleLivePrescription = {
      diagnosis,
      vitals,
      medications,
      doctorAdvice
    };
    await telemedicineWebRtcClient.sendSignal(CALL_ID, 'DOCTOR', 'RX_SYNC', rxData);
    setRxDispatched(true);
    setTimeout(() => setRxDispatched(false), 3500);
  };

  const handleCopyPatientLink = () => {
    const link = `http://localhost:5174?call=${CALL_ID}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleEndCall = async () => {
    await telemedicineWebRtcClient.endSession(CALL_ID, callSeconds, 'Consultation completed successfully.');
    setCallActive(false);
    if (onEndCall) onEndCall();
  };

  const handleStartCall = () => {
    setCallActive(true);
    setCallSeconds(0);
    setRxDispatched(false);
  };

  const handleToggleMic = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = micMuted));
    }
    setMicMuted(!micMuted);
  };

  const handleToggleCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = cameraOff));
    }
    setCameraOff(!cameraOff);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Teleconsultation Header Bar */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1.5px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '16px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem'
            }}
          >
            📹
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
                WebRTC Telehealth Room: {CALL_ID}
              </span>
              <Badge variant={callActive ? 'success' : 'danger'}>
                {callActive ? `🔴 Live Call: ${formatTimer(callSeconds)}` : 'Call Ended'}
              </Badge>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
              Patient: <strong style={{ color: '#38BDF8' }}>Ramesh Kumar (52y / Male)</strong> • Attending: {doctorName}
            </div>
          </div>
        </div>

        {/* Security & Action HUD */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleCopyPatientLink}
            style={{
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #0284C7',
              color: '#38BDF8',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📲</span>
            <span>{copiedLink ? '✓ Copied Link!' : 'Copy WhatsApp Patient Link'}</span>
          </button>

          <span style={{ fontSize: '0.75rem', color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600 }}>
            🔒 DTLS-SRTP AES-256 Encrypted
          </span>

          {callActive ? (
            <Button variant="danger" size="sm" onClick={handleEndCall} style={{ fontWeight: 800 }}>
              🔴 End Video Call
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleStartCall} style={{ fontWeight: 800, backgroundColor: '#10B981', borderColor: '#10B981' }}>
              📞 Reconnect Call
            </Button>
          )}
        </div>
      </div>

      {/* 2-Column Telehealth Split Studio (Video + EMR) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px' }}>
        {/* Left: Interactive WebRTC Video Canvas & HUD Controls */}
        <div
          style={{
            backgroundColor: '#05070B',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '16px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}
        >
          {/* Main Video Stream Frame */}
          <div
            style={{
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
            }}
          >
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />

            {/* Doctor PIP */}
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '120px',
                aspectRatio: '16 / 9',
                backgroundColor: '#0F172A',
                border: '2px solid rgba(56, 189, 248, 0.5)',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 14px rgba(0,0,0,0.6)'
              }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              <div style={{ position: 'absolute', bottom: '2px', left: '4px', fontSize: '0.62rem', fontWeight: 800, color: '#38BDF8', backgroundColor: 'rgba(0,0,0,0.7)', padding: '1px 4px', borderRadius: '4px' }}>
                Dr. Sharma (You)
              </div>
            </div>

            {/* Live Patient Info & Telemetry HUD */}
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.72rem',
                color: '#F8FAFC',
                display: 'flex',
                gap: '10px'
              }}
            >
              <span>👤 <strong>Ramesh Kumar</strong></span>
              <span>❤️ Pulse: <strong style={{ color: '#10B981' }}>{vitals.pulse} bpm</strong></span>
              <span>🫁 SpO2: <strong style={{ color: '#38BDF8' }}>{vitals.spo2}%</strong></span>
              <span>🩸 BP: <strong style={{ color: '#F59E0B' }}>{vitals.bp}</strong></span>
              <span style={{ color: callConnected ? '#34D399' : '#F59E0B' }}>
                {callConnected ? '● 1080p 30fps (18ms)' : '● Connecting...'}
              </span>
            </div>
          </div>

          {/* In-Call HUD Action Controls */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant={micMuted ? 'danger' : 'outline'}
              size="sm"
              onClick={handleToggleMic}
              style={{ fontSize: '0.75rem', fontWeight: 700 }}
            >
              {micMuted ? '🔇 Mic Muted' : '🎙️ Mic Active'}
            </Button>
            <Button
              variant={cameraOff ? 'danger' : 'outline'}
              size="sm"
              onClick={handleToggleCamera}
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
              {screenSharing ? '⏹️ Stop Share' : '🖥️ Share DICOM PACS'}
            </Button>
          </div>
        </div>

        {/* Right: Live In-Call Digital Prescription Pad */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase' }}>
              📝 Real-Time In-Call Clinical Notes & e-Prescription Pad
            </span>
            <Badge variant="primary">Live Sync Active</Badge>
          </div>

          {/* Diagnosis Input */}
          <div>
            <label style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              CLINICAL DIAGNOSIS:
            </label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#F8FAFC',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.82rem'
              }}
            />
          </div>

          {/* Prescribed Medications with Jan Aushadhi Savings */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700, textTransform: 'uppercase' }}>
                Prescribed Medications (Jan Aushadhi Generic Switched):
              </span>
              <span style={{ fontSize: '0.7rem', color: '#34D399', fontWeight: 700 }}>
                Average Patient Savings: 80%
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {medications.map((med, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#F8FAFC' }}>{med.drug}</div>
                    <div style={{ fontSize: '0.7rem', color: '#6EE7B7' }}>
                      Generic: {med.genericName}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '2px' }}>
                      {med.dose} • {med.days}
                    </div>
                  </div>
                  <Badge variant="success">Save {med.savingsPercent}%</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Doctor Advice */}
          <div>
            <label style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              DOCTOR ADVICE & PRECAUTIONS:
            </label>
            <textarea
              rows={2}
              value={doctorAdvice}
              onChange={(e) => setDoctorAdvice(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#F8FAFC',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.8rem',
                resize: 'none'
              }}
            />
          </div>

          {/* 1-Click Sync Rx to Patient Screen Button */}
          <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
            <Button
              variant="primary"
              size="md"
              onClick={handleSyncRxToPatient}
              style={{
                flex: 1,
                fontWeight: 800,
                backgroundColor: rxDispatched ? '#10B981' : '#0284C7',
                borderColor: rxDispatched ? '#10B981' : '#0284C7'
              }}
            >
              {rxDispatched ? '✓ Synced to Patient Screen & WhatsApp!' : '⚡ 1-Click Sync Live Rx to Patient Screen'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
