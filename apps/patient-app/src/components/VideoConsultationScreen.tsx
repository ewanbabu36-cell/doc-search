import React, { useState, useEffect, useRef } from 'react';
import { type Language, translations } from '../i18n.js';
import { telemedicineWebRtcClient, type TeleLivePrescription } from '../services/telemedicine-webrtc-client.js';

interface Props {
  language: Language;
  onBack: () => void;
}

export const VideoConsultationScreen: React.FC<Props> = ({ language, onBack }) => {
  const t = translations[language];
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showLiveRxDrawer, setShowLiveRxDrawer] = useState(true);
  const [liveRx, setLiveRx] = useState<TeleLivePrescription | null>(null);
  const [callConnected, setCallConnected] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const CALL_ID = 'TELE-2026-9042';

  // Call duration counter
  useEffect(() => {
    let timer: any;
    if (isCallActive) {
      timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isCallActive]);

  // WebRTC signaling and media stream lifecycle
  useEffect(() => {
    if (!isCallActive) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      telemedicineWebRtcClient.stopSignalPolling();
      setCallConnected(false);
      return;
    }

    let unpoll: (() => void) | null = null;

    const setupCall = async () => {
      // 1. Join session on gateway
      await telemedicineWebRtcClient.joinSession(CALL_ID, 'Dr. Vivek Sharma', 'Ramesh Kumar');

      // 2. Acquire patient media stream
      const stream = await telemedicineWebRtcClient.getMediaStream(!isMuted, !isVideoOff);
      mediaStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Simulate doctor remote stream after short connection handoff
      setTimeout(async () => {
        const docStream = await telemedicineWebRtcClient.getMediaStream(true, true);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = docStream;
        }
        setCallConnected(true);
      }, 1200);

      // 3. Start signaling poll to receive doctor's live Rx updates
      unpoll = telemedicineWebRtcClient.startSignalPolling(
        CALL_ID,
        'PATIENT',
        {
          onRxSync: (rx) => {
            setLiveRx(rx);
            setShowLiveRxDrawer(true);
          },
          onStatusChange: (status: string) => {
            if (status === 'COMPLETED') {
              setIsCallActive(false);
            }
          }
        },
        1000
      );
    };

    void setupCall();

    return () => {
      if (unpoll) unpoll();
      telemedicineWebRtcClient.stopSignalPolling();
    };
  }, [isCallActive]);

  const handleToggleMute = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  const handleToggleVideo = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff;
      });
    }
    setIsVideoOff(!isVideoOff);
  };

  const handleEndCall = async () => {
    await telemedicineWebRtcClient.endSession(CALL_ID, callDuration, 'Patient ended video consultation call.');
    setIsCallActive(false);
    alert(
      language === 'hi'
        ? 'कॉल समाप्त हो गई है। डॉक्टर का डिजिटल पर्चा "मेरी पर्ची" में सुरक्षित कर दिया गया है!'
        : 'Call ended. Doctor prescription has been saved to "Meri Parchi"!'
    );
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B0F19', color: '#F8FAFC', padding: '16px 12px', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#F8FAFC',
            padding: '8px 14px',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          ← {language === 'hi' ? 'वापस' : 'Back'}
        </button>
        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#38BDF8' }}>
          {t.videoConsult}
        </span>
        {isCallActive && (
          <span style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 800, backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '4px 8px', borderRadius: '8px' }}>
            ● {formatTimer(callDuration)}
          </span>
        )}
      </div>

      {!isCallActive ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '20px' }}>
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              border: '3px solid #0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3.5rem',
              marginBottom: '20px',
              boxShadow: '0 0 30px rgba(2, 132, 199, 0.3)'
            }}
          >
            👨‍⚕️
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '6px' }}>Dr. Vivek Sharma</h2>
          <p style={{ fontSize: '0.9rem', color: '#38BDF8', fontWeight: 600, marginBottom: '4px' }}>MD General Medicine • Chamber #102</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#34D399', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '24px' }}>
            <span>🔒</span>
            <span>256-Bit Encrypted WebRTC Peer-to-Peer</span>
          </div>

          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', maxWidth: '320px', marginBottom: '32px' }}>
            {language === 'hi'
              ? 'हाई-डेफिनिशन वीडियो कॉल और कॉल के दौरान लाइव पर्चा सीधे स्क्रीन पर प्राप्त करें।'
              : 'HD video consultation with real-time live digital prescription sync directly on your screen.'}
          </p>

          <button
            type="button"
            onClick={() => setIsCallActive(true)}
            style={{
              width: '100%',
              maxWidth: '360px',
              backgroundColor: '#10B981',
              color: '#F8FAFC',
              border: 'none',
              borderRadius: '16px',
              padding: '16px',
              fontSize: '1.1rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
            }}
          >
            <span>📹</span>
            <span>{t.startVideo}</span>
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', borderRadius: '20px', overflow: 'hidden', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
          
          {/* Main Video View (Doctor Video) */}
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
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

            {/* Doctor Info Pill */}
            <div style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>👨‍⚕️</span>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#F8FAFC' }}>Dr. Vivek Sharma</div>
                <div style={{ fontSize: '0.68rem', color: callConnected ? '#34D399' : '#F59E0B', fontWeight: 700 }}>
                  {callConnected ? '● HD 720p Connected' : 'Connecting...'}
                </div>
              </div>
            </div>

            {/* Self Video PIP (Patient View) */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '90px',
                height: '130px',
                backgroundColor: '#1E293B',
                borderRadius: '12px',
                border: '2px solid rgba(56, 189, 248, 0.5)',
                overflow: 'hidden',
                boxShadow: '0 8px 20px rgba(0,0,0,0.6)'
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
              <div style={{ position: 'absolute', bottom: '4px', left: '6px', fontSize: '0.62rem', fontWeight: 800, color: '#F8FAFC', backgroundColor: 'rgba(0,0,0,0.6)', padding: '1px 4px', borderRadius: '4px' }}>
                You
              </div>
            </div>
          </div>

          {/* In-Call Real-Time Live Prescription Drawer */}
          {liveRx && showLiveRxDrawer && (
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderTop: '2px solid #0284C7',
                padding: '12px 14px',
                maxHeight: '190px',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase' }}>
                  ⚡ {language === 'hi' ? 'लाइव डॉक्टर पर्चा (रियल-टाइम सिंक)' : 'Live Doctor Prescription (Synced)'}
                </span>
                <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                  Dx: {liveRx.diagnosis}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {liveRx.medications.map((m, idx) => (
                  <div key={idx} style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', padding: '6px 10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#F8FAFC' }}>{m.drug}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{m.dose} • {m.days}</div>
                    </div>
                    {m.savingsPercent > 0 && (
                      <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                        Save {m.savingsPercent}% (Jan Aushadhi)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '14px', backgroundColor: '#0B0F19' }}>
            <button
              type="button"
              onClick={handleToggleMute}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: isMuted ? '#EF4444' : 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                color: '#F8FAFC',
                fontSize: '1.2rem',
                cursor: 'pointer'
              }}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🎙️'}
            </button>

            <button
              type="button"
              onClick={handleToggleVideo}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: isVideoOff ? '#EF4444' : 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                color: '#F8FAFC',
                fontSize: '1.2rem',
                cursor: 'pointer'
              }}
              title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
            >
              {isVideoOff ? '🚫' : '📹'}
            </button>

            <button
              type="button"
              onClick={() => setShowLiveRxDrawer(!showLiveRxDrawer)}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: showLiveRxDrawer ? '#0284C7' : 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                color: '#F8FAFC',
                fontSize: '1.2rem',
                cursor: 'pointer'
              }}
              title="Toggle Live Rx"
            >
              📝
            </button>

            <button
              type="button"
              onClick={handleEndCall}
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#EF4444',
                border: 'none',
                color: '#F8FAFC',
                fontSize: '1.3rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
              }}
              title={t.endCall}
            >
              📞
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
