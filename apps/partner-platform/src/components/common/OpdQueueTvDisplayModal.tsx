import React, { useState, useEffect, useMemo } from 'react';
import { hospitalEventBus, type HospitalEventPayload } from '../../services/hospital-event-bus.js';
import { getUnifiedPartnerProfile } from '../../utils/roleProfileResolver.js';

export interface OpdQueueTvDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalName?: string;
}

export interface CallingToken {
  tokenNumber: number | string;
  patientName: string;
  uhid: string;
  doctorName: string;
  roomNumber: string;
  department: string;
  callTime: string;
}

export interface QueueItem {
  token: number | string;
  name: string;
  uhid: string;
  estWait: string;
  doctor: string;
  estCallTime?: string;
  patientsAhead?: number;
  priorityTier?: string;
  isCritical?: boolean;
  isReportsReady?: boolean;
}

export const OpdQueueTvDisplayModal: React.FC<OpdQueueTvDisplayModalProps> = ({
  isOpen,
  onClose,
  hospitalName
}) => {
  const partnerProfile = useMemo(() => getUnifiedPartnerProfile(), []);
  const effectiveHospitalName = (hospitalName && hospitalName !== 'METROPOLITAN MULTISPECIALTY HOSPITAL')
    ? hospitalName
    : (partnerProfile.entityLegalName || 'DocSearch Hospital & Medical Center');

  const [currentToken, setCurrentToken] = useState<CallingToken | null>(null);
  const [movingAvgPace, setMovingAvgPace] = useState<number>(3.8);

  const [queue, setQueue] = useState<QueueItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('docsearch_opd_queue');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  const [isMuted, setIsMuted] = useState(false);
  const [timeString, setTimeString] = useState(new Date().toLocaleTimeString());
  const [isCallingPulse, setIsCallingPulse] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen toggle error:', err);
    }
  };

  // Synchronize queue to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('docsearch_opd_queue', JSON.stringify(queue));
      } catch {}
    }
  }, [queue]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      setTimeString(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to Hospital Event Bus for token calling & registration events
  useEffect(() => {
    const unsubSelected = hospitalEventBus.subscribe('PATIENT_SELECTED', (payload: HospitalEventPayload) => {
      if (payload.data?.opdToken) {
        const tokenNum = payload.data.opdToken;
        setQueue((prev) => prev.filter((q) => q.token !== tokenNum));

        triggerCallToken({
          tokenNumber: tokenNum,
          patientName: payload.data.name || 'OPD Patient',
          uhid: payload.data.uhid || `UHID-2026-${tokenNum}`,
          doctorName: payload.data.doctorName || partnerProfile.doctorName || 'Assigned Consultant',
          roomNumber: payload.data.roomNumber || 'ROOM 101',
          department: payload.data.department || partnerProfile.doctorSpecialty || 'General & Specialty OPD',
          callTime: new Date().toLocaleTimeString()
        });
      }
    });

    const unsubCalled = hospitalEventBus.subscribe('PATIENT_CALLED', (payload: HospitalEventPayload) => {
      const data = payload.data || {};
      const tokenNum = data.tokenNumber || data.opdToken;
      if (tokenNum) {
        setQueue((prev) => prev.filter((q) => q.token !== tokenNum));
        triggerCallToken({
          tokenNumber: tokenNum,
          patientName: data.patientName || data.name || 'OPD Patient',
          uhid: data.uhid || `UHID-2026-${tokenNum}`,
          doctorName: data.doctorName || partnerProfile.doctorName || 'Consulting Physician',
          roomNumber: data.roomNumber || 'ROOM 101',
          department: data.department || partnerProfile.doctorSpecialty || 'General OPD Wing',
          callTime: new Date().toLocaleTimeString()
        });
      }
    });

    const unsubRegistered = hospitalEventBus.subscribe('PATIENT_REGISTERED', (payload: HospitalEventPayload) => {
      const data = payload.data || {};
      if (data.opdToken || data.tokenNumber) {
        const token = data.opdToken || data.tokenNumber;
        setQueue((prev) => {
          if (prev.some((item) => item.token === token)) return prev;
          return [
            ...prev,
            {
              token,
              name: data.patientName || data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'OPD Patient',
              uhid: data.uhid || data.mrn || `UHID-2026-${token}`,
              estWait: `${(prev.length + 1) * 8} mins`,
              doctor: data.doctorName || partnerProfile.doctorName || 'Room 101'
            }
          ];
        });
      }
    });

    const unsubVelocity = hospitalEventBus.subscribe('QUEUE_VELOCITY_UPDATED', (payload: HospitalEventPayload) => {
      const data = payload.data || {};
      if (Array.isArray(data.patients)) {
        setQueue(data.patients.map((p: any) => ({
          token: p.token,
          name: p.name,
          uhid: p.uhid,
          estWait: p.estWait || `${(p.patientsAhead || 0) * 4} mins`,
          estCallTime: p.estCallTime,
          patientsAhead: p.patientsAhead,
          doctor: p.doctor || partnerProfile.doctorName || 'Room 101',
          priorityTier: p.priorityTier,
          isCritical: p.isCritical,
          isReportsReady: p.isReportsReady
        })));
      }
      if (data.averageConsultDurationMinutes) {
        setMovingAvgPace(data.averageConsultDurationMinutes);
      }
    });

    return () => {
      unsubSelected();
      unsubCalled();
      unsubRegistered();
      unsubVelocity();
    };
  }, [partnerProfile]);

  const playVoiceAnnouncement = (token: CallingToken) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || isMuted) return;

    try {
      window.speechSynthesis.cancel(); // cancel pending speech
      const text = `Token Number ${token.tokenNumber}. ${token.patientName}. Please proceed to ${token.roomNumber}, ${token.doctorName}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis fallback
    }
  };

  const triggerCallToken = (token: CallingToken) => {
    setCurrentToken(token);
    setIsCallingPulse(true);
    playVoiceAnnouncement(token);
    setTimeout(() => setIsCallingPulse(false), 3000);
  };

  const handleManualNextToken = () => {
    if (queue.length > 0) {
      const nextPatient = queue[0];
      if (nextPatient) {
        const remaining = queue.slice(1).map((item, idx) => ({
          ...item,
          estWait: `${(idx + 1) * 8} mins`
        }));
        setQueue(remaining);

        triggerCallToken({
          tokenNumber: nextPatient.token,
          patientName: nextPatient.name,
          uhid: nextPatient.uhid,
          doctorName: partnerProfile.doctorName || 'Attending Physician',
          roomNumber: 'ROOM 101',
          department: partnerProfile.doctorSpecialty || 'General OPD Wing',
          callTime: new Date().toLocaleTimeString()
        });
        return;
      }
    }

    const currentRaw = currentToken?.tokenNumber;
    const currentParsed = typeof currentRaw === 'number' ? currentRaw : parseInt(String(currentRaw || '0').replace(/\D/g, ''), 10) || 0;
    const nextNum = currentParsed + 1;
    triggerCallToken({
      tokenNumber: nextNum,
      patientName: `Token #${nextNum}`,
      uhid: `UHID-2026-${1000 + nextNum}`,
      doctorName: partnerProfile.doctorName || 'Attending Physician',
      roomNumber: 'ROOM 101',
      department: partnerProfile.doctorSpecialty || 'General OPD Wing',
      callTime: new Date().toLocaleTimeString()
    });
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#020617',
        zIndex: 10001,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        overflow: 'hidden'
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          padding: '16px 32px',
          backgroundColor: '#0B1120',
          borderBottom: '2px solid #0284C7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              backgroundColor: '#0284C7',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              fontWeight: 900
            }}
          >
            🏥
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '0.5px' }}>
              {effectiveHospitalName}
            </h1>
            <div style={{ fontSize: '0.85rem', color: '#38BDF8', fontWeight: 700 }}>
              OPD SMART QUEUE DISPLAY & LIVE TOKEN CALLING SYSTEM
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#34D399', fontFamily: 'monospace' }}>
              {timeString}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{new Date().toDateString()}</div>
          </div>

          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            style={{
              backgroundColor: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              border: isMuted ? '1.5px solid #EF4444' : '1.5px solid #10B981',
              color: isMuted ? '#FCA5A5' : '#6EE7B7',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Toggle Voice Announcements"
          >
            <span>{isMuted ? '🔇 Audio Muted' : '🔊 Voice Calling ON'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            style={{
              backgroundColor: isFullscreen ? 'rgba(56, 189, 248, 0.25)' : 'rgba(56, 189, 248, 0.15)',
              border: '1.5px solid #38BDF8',
              color: '#38BDF8',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title={isFullscreen ? 'Exit Fullscreen TV Mode' : 'Expand to Fullscreen TV Display'}
          >
            <span>{isFullscreen ? '🗗 Exit Fullscreen' : '⛶ Fullscreen TV'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #EF4444',
              color: '#F87171',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            ✕ Exit TV Mode
          </button>
        </div>
      </div>

      {/* Main Waiting Room Content Grid */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '24px',
          padding: '32px',
          overflow: 'hidden'
        }}
      >
        {/* Left Hero: Currently Calling Token */}
        <div
          style={{
            backgroundColor: '#0F172A',
            border: isCallingPulse ? '3px solid #10B981' : '2px solid #0284C7',
            borderRadius: '24px',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: isCallingPulse ? '0 0 40px rgba(16, 185, 129, 0.4)' : '0 12px 48px rgba(0,0,0,0.6)',
            transition: 'all 0.3s ease'
          }}
        >
          {currentToken ? (
            <>
              {/* Top Banner of Hero */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div
                  style={{
                    backgroundColor: isCallingPulse ? '#10B981' : '#0284C7',
                    color: '#FFFFFF',
                    padding: '8px 24px',
                    borderRadius: '30px',
                    fontSize: '1.2rem',
                    fontWeight: 900,
                    letterSpacing: '1px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <span>🔔</span>
                  <span>NOW CALLING / KRPYA ANDAR JAYEIN</span>
                </div>

                <span style={{ fontSize: '0.9rem', color: '#94A3B8' }}>
                  Called at: <strong style={{ color: '#F8FAFC' }}>{currentToken.callTime}</strong>
                </span>
              </div>

              {/* Huge Token Number Display */}
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <div style={{ fontSize: '1.1rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800 }}>
                  OPD APPOINTMENT TOKEN NUMBER
                </div>
                <div
                  style={{
                    fontSize: '7rem',
                    fontWeight: 900,
                    color: '#38BDF8',
                    lineHeight: 1,
                    letterSpacing: '4px',
                    margin: '12px 0',
                    textShadow: '0 0 30px rgba(56, 189, 248, 0.4)'
                  }}
                >
                  #{currentToken.tokenNumber}
                </div>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#F8FAFC', marginBottom: '8px' }}>
                  {currentToken.patientName}
                </div>
                <div style={{ fontSize: '1.1rem', color: '#38BDF8', fontFamily: 'monospace' }}>
                  UHID: {currentToken.uhid}
                </div>
              </div>

              {/* Room & Doctor Indicator Box */}
              <div
                style={{
                  backgroundColor: '#1E293B',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                    CONSULTATION ROOM
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#FBBF24', marginTop: '4px' }}>
                    {currentToken.roomNumber}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#CBD5E1' }}>{currentToken.department}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                    ATTENDING SPECIALIST
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F8FAFC', marginTop: '4px' }}>
                    {currentToken.doctorName}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#34D399', fontWeight: 700 }}>● Doctor In Room & Available</div>
                </div>
              </div>

              {/* Quick Doctor Simulation Action */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Consultation Controls:
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => triggerCallToken(currentToken)}
                    style={{
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid #0284C7',
                      color: '#38BDF8',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    🔊 Re-Announce Current Token
                  </button>
                  <button
                    type="button"
                    onClick={handleManualNextToken}
                    style={{
                      backgroundColor: '#10B981',
                      border: 'none',
                      color: '#000',
                      padding: '8px 20px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    ➔ Call Next Patient
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: 'auto', textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '2px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', marginBottom: '24px' }}>
                🩺
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#F8FAFC', marginBottom: '8px' }}>
                OPD CONSULTATION DESK READY
              </div>
              <div style={{ fontSize: '1.05rem', color: '#94A3B8', maxWidth: '440px', lineHeight: 1.6, marginBottom: '24px' }}>
                Waiting for the attending specialist to call the next patient from the consultation cockpit. The patient token, name, and room will be automatically announced here.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '10px 20px', borderRadius: '30px', color: '#10B981', fontWeight: 800, fontSize: '0.9rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                <span>Live Hospital Event Bus Connected & Listening</span>
              </div>
              {queue.length > 0 && (
                <button
                  type="button"
                  onClick={handleManualNextToken}
                  style={{
                    marginTop: '24px',
                    backgroundColor: '#0284C7',
                    border: 'none',
                    color: '#FFF',
                    padding: '12px 28px',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                  }}
                >
                  📢 Call First Patient in Queue (#{queue[0]?.token})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Upcoming Queue & Waiting Estimates */}
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: '24px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1E293B', paddingBottom: '12px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#F8FAFC' }}>
                Next In Queue
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Aage Ke Patients • ⚡ Avg Pace: {movingAvgPace}m / pt</span>
            </div>
            <span
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid #0284C7',
                color: '#38BDF8',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 800
              }}
            >
              {queue.length} In Line
            </span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
            {queue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📋</div>
                <div style={{ fontWeight: 800, color: '#94A3B8', fontSize: '1.1rem', marginBottom: '6px' }}>
                  No Patients in Queue
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748B', maxWidth: '280px', lineHeight: 1.5 }}>
                  All patient tokens have been served. New OPD registrations will appear here in real time.
                </div>
              </div>
            ) : (
              queue.map((item) => (
              <div
                key={item.token}
                onClick={() =>
                  triggerCallToken({
                    tokenNumber: typeof item.token === 'number' ? item.token : parseInt(String(item.token).replace(/\D/g, ''), 10) || 1,
                    patientName: item.name,
                    uhid: item.uhid,
                    doctorName: partnerProfile.doctorName || 'Attending Physician',
                    roomNumber: 'ROOM 101',
                    department: partnerProfile.doctorSpecialty || 'General OPD Wing',
                    callTime: new Date().toLocaleTimeString()
                  })
                }
                style={{
                  backgroundColor: '#1E293B',
                  border: item.isCritical
                    ? '1.5px solid #EF4444'
                    : item.isReportsReady
                    ? '1.5px solid #A855F7'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(2, 132, 199, 0.2)';
                  e.currentTarget.style.borderColor = '#0284C7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1E293B';
                  e.currentTarget.style.borderColor = item.isCritical
                    ? '#EF4444'
                    : item.isReportsReady
                    ? '#A855F7'
                    : 'rgba(255, 255, 255, 0.06)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      backgroundColor: item.isCritical ? '#DC2626' : item.isReportsReady ? '#9333EA' : '#0284C7',
                      color: '#FFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '1.2rem'
                    }}
                  >
                    #{item.token}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ color: '#F8FAFC', fontSize: '1rem' }}>{item.name}</strong>
                      {item.isCritical && (
                        <span style={{ fontSize: '0.625rem', fontWeight: 900, backgroundColor: 'rgba(239,68,68,0.25)', color: '#F87171', border: '1px solid #EF4444', padding: '1px 5px', borderRadius: '4px' }}>
                          🚨 STAT PRIORITY
                        </span>
                      )}
                      {item.isReportsReady && (
                        <span style={{ fontSize: '0.625rem', fontWeight: 900, backgroundColor: 'rgba(168,85,247,0.25)', color: '#C084FC', border: '1px solid #A855F7', padding: '1px 5px', borderRadius: '4px' }}>
                          🧪 REPORTS READY
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      {item.uhid}
                      {typeof item.patientsAhead === 'number' && (
                        <span style={{ marginLeft: '6px', color: '#38BDF8' }}>
                          ({item.patientsAhead} ahead)
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      backgroundColor: item.isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      border: item.isCritical ? '1px solid #EF4444' : '1px solid #F59E0B',
                      color: item.isCritical ? '#FCA5A5' : '#FCD34D',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}
                  >
                    {item.estCallTime ? `⏱️ Call ~${item.estCallTime}` : `⏱️ ~${item.estWait}`}
                  </span>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '4px' }}>Click to Call ➔</div>
                </div>
              </div>
            )))}
          </div>

          {/* QR Code OPD Status Tracking Banner */}
          <div
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div style={{ fontSize: '2rem' }}>📱</div>
            <div style={{ fontSize: '0.78rem', color: '#CBD5E1', lineHeight: 1.4 }}>
              <strong>Track Queue on Phone:</strong> Patients can scan the QR on their token slip to monitor live queue status anywhere on hospital premises.
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Emergency & Advisory Ticker */}
      <div
        style={{
          backgroundColor: '#0B1120',
          borderTop: '1px solid #1E293B',
          padding: '10px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.85rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94A3B8' }}>
          <span style={{ color: '#F59E0B', fontWeight: 800 }}>📢 ADVISORY:</span>
          <span>Please keep your ABHA Card or UHID Token slip ready before entering the doctor consultation chamber.</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#F87171', fontWeight: 800 }}>🚨 Emergency Code: 108</span>
          <span style={{ color: '#64748B' }}>|</span>
          <span style={{ color: '#38BDF8', fontWeight: 700 }}>Powered by DocSearch Agentic Health OS</span>
        </div>
      </div>
    </div>
  );
};
