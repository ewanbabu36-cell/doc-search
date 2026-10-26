import React, { useState, useEffect, useMemo } from 'react';
import { hospitalEventBus, type HospitalEventPayload } from '../../services/hospital-event-bus.js';
import { getUnifiedPartnerProfile } from '../../utils/roleProfileResolver.js';

export interface HospitalQueueTvDisplayViewProps {
  hospitalName?: string;
  onExit?: () => void;
}

export interface ChamberStatus {
  chamberId: string;
  roomNumber: string;
  doctorName: string;
  specialty: string;
  currentToken: {
    tokenNumber: string | number;
    patientName: string;
    uhid: string;
    callTime: string;
  } | null;
  waitingTokens: {
    tokenNumber: string | number;
    patientName: string;
    estWait: string;
  }[];
  isCalling: boolean;
}

// Generate authentic dual-tone hospital chime using pure Web Audio API
export const playHospitalChimeDingDong = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const now = ctx.currentTime;

    // Tone 1: High chime "Ding" (880 Hz - A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Tone 2: Low chime "Dong" (587.33 Hz - D5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(587.33, now + 0.35);
    gain2.gain.setValueAtTime(0.35, now + 0.35);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.35);
    osc2.stop(now + 1.2);
  } catch (err) {
    console.warn('Web Audio chime playback error:', err);
  }
};

export type TvAnnouncementLanguage = 'HI' | 'BN' | 'MR' | 'TA' | 'TE' | 'EN';

// Multilingual regional voice announcement (Indic language followed by English)
export const playRegionalTokenAnnouncement = (
  tokenNumber: string | number,
  patientName: string,
  roomNumber: string,
  doctorName: string,
  isMuted: boolean,
  primaryLang: TvAnnouncementLanguage = 'HI'
) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || isMuted) return;

  try {
    window.speechSynthesis.cancel(); // Stop pending speech

    const cleanToken = String(tokenNumber).replace(/^#+/, '');
    const cleanRoom = String(roomNumber).replace(/^(room|रूम|कमरा)\s*/i, '');

    // 1. Primary Indic / Regional Language Announcement
    let regionalText = '';
    let regionalVoiceLang = 'hi-IN';

    switch (primaryLang) {
      case 'BN': // Bengali
        regionalText = `টোকেন নম্বর ${cleanToken}, ${patientName}। অনুগ্রহ করে রুম নম্বর ${cleanRoom}, ডক্টর ${doctorName}-এর কাছে আসুন।`;
        regionalVoiceLang = 'bn-IN';
        break;
      case 'MR': // Marathi
        regionalText = `टोकन क्रमांक ${cleanToken}, ${patientName}। कृपया खोली क्रमांक ${cleanRoom}, डॉक्टर ${doctorName} यांच्याकडे जावे।`;
        regionalVoiceLang = 'mr-IN';
        break;
      case 'TA': // Tamil
        regionalText = `டோக்கன் எண் ${cleanToken}, ${patientName}। தயவுசெய்து அறை எண் ${cleanRoom}, மருத்துவர் ${doctorName} அவர்களிடம் செல்லவும்।`;
        regionalVoiceLang = 'ta-IN';
        break;
      case 'TE': // Telugu
        regionalText = `టోకెన్ సంఖ్య ${cleanToken}, ${patientName}। దయచేసి గది సంఖ్య ${cleanRoom}, డాక్టర్ ${doctorName} వద్దకు వెళ్లండి।`;
        regionalVoiceLang = 'te-IN';
        break;
      case 'EN': // English Only
        regionalText = `Token number ${cleanToken}, ${patientName}. Please proceed to Room ${cleanRoom}, Dr. ${doctorName}.`;
        regionalVoiceLang = 'en-IN';
        break;
      case 'HI':
      default: // Hindi
        regionalText = `टोकन संख्या ${cleanToken}, ${patientName}। कृपया कमरा नंबर ${cleanRoom}, डॉक्टर ${doctorName} के पास पधारें।`;
        regionalVoiceLang = 'hi-IN';
        break;
    }

    const regionalUtterance = new SpeechSynthesisUtterance(regionalText);
    regionalUtterance.rate = 0.88;
    regionalUtterance.pitch = 1.05;
    regionalUtterance.lang = regionalVoiceLang;

    // 2. English Announcement (Secondary Follow-up, unless primary was EN)
    if (primaryLang !== 'EN') {
      const englishText = `Token number ${cleanToken}, ${patientName}. Please proceed to Room ${cleanRoom}, Dr. ${doctorName}.`;
      const englishUtterance = new SpeechSynthesisUtterance(englishText);
      englishUtterance.rate = 0.9;
      englishUtterance.pitch = 1.0;
      englishUtterance.lang = 'en-IN';

      regionalUtterance.onend = () => {
        setTimeout(() => {
          window.speechSynthesis.speak(englishUtterance);
        }, 300);
      };
    }

    window.speechSynthesis.speak(regionalUtterance);
  } catch (err) {
    console.warn('Speech synthesis announcement error:', err);
  }
};

// Backwards-compatible alias
export const playBilingualTokenAnnouncement = (
  tokenNumber: string | number,
  patientName: string,
  roomNumber: string,
  doctorName: string,
  isMuted: boolean,
  primaryLang: TvAnnouncementLanguage = 'HI'
) => playRegionalTokenAnnouncement(tokenNumber, patientName, roomNumber, doctorName, isMuted, primaryLang);

export const HospitalQueueTvDisplayView: React.FC<HospitalQueueTvDisplayViewProps> = ({
  hospitalName,
  onExit
}) => {
  const partnerProfile = useMemo(() => getUnifiedPartnerProfile(), []);
  const effectiveHospitalName = hospitalName || partnerProfile.entityLegalName || 'DocSearch Multispecialty Hospital';

  const [timeString, setTimeString] = useState<string>('');
  const [dateString, setDateString] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [themeMode] = useState<'OLED_DARK' | 'CYAN_HIGH_CONTRAST'>('OLED_DARK');
  const [selectedLanguage, setSelectedLanguage] = useState<TvAnnouncementLanguage>('HI');

  // Multi-Chamber State
  const [chambers, setChambers] = useState<ChamberStatus[]>([
    {
      chamberId: 'chamber-101',
      roomNumber: 'ROOM 101',
      doctorName: partnerProfile.doctorName || 'Dr. Vikram Malhotra',
      specialty: partnerProfile.doctorSpecialty || 'General Medicine & Diabetology',
      currentToken: {
        tokenNumber: '#14',
        patientName: 'Ramesh Kumar',
        uhid: 'UHID-2026-1014',
        callTime: 'Just now'
      },
      waitingTokens: [
        { tokenNumber: '#15', patientName: 'Sunita Devi', estWait: '4 mins' },
        { tokenNumber: '#16', patientName: 'Amit Verma', estWait: '10 mins' },
        { tokenNumber: '#17', patientName: 'Pooja Sharma', estWait: '18 mins' }
      ],
      isCalling: false
    },
    {
      chamberId: 'chamber-102',
      roomNumber: 'ROOM 102',
      doctorName: 'Dr. Ananya Sharma',
      specialty: 'Pediatrics & Child Health',
      currentToken: {
        tokenNumber: '#08',
        patientName: 'Baby Aarav (M/4y)',
        uhid: 'UHID-2026-1008',
        callTime: '2 mins ago'
      },
      waitingTokens: [
        { tokenNumber: '#09', patientName: 'Rohan Gupta', estWait: '6 mins' },
        { tokenNumber: '#10', patientName: 'Anvi Patel', estWait: '12 mins' }
      ],
      isCalling: false
    },
    {
      chamberId: 'chamber-103',
      roomNumber: 'ROOM 103',
      doctorName: 'Dr. Rajesh Gupta',
      specialty: 'Orthopedics & Joint Care',
      currentToken: {
        tokenNumber: '#22',
        patientName: 'Mohd. Salim',
        uhid: 'UHID-2026-1022',
        callTime: '5 mins ago'
      },
      waitingTokens: [
        { tokenNumber: '#23', patientName: 'Kailash Chand', estWait: '8 mins' },
        { tokenNumber: '#24', patientName: 'Manju Devi', estWait: '16 mins' }
      ],
      isCalling: false
    },
    {
      chamberId: 'chamber-104',
      roomNumber: 'ROOM 104',
      doctorName: 'Dr. Priya Sen',
      specialty: 'Cardiology & Heart Care',
      currentToken: {
        tokenNumber: '#05',
        patientName: 'Gurdeep Singh',
        uhid: 'UHID-2026-1005',
        callTime: '8 mins ago'
      },
      waitingTokens: [
        { tokenNumber: '#06', patientName: 'Meena Saxena', estWait: '5 mins' },
        { tokenNumber: '#07', patientName: 'Vinod Tiwari', estWait: '14 mins' }
      ],
      isCalling: false
    }
  ]);

  // Last Called Hero Banner Token (Large Flash Banner across Top of Screen)
  const [heroCalledToken, setHeroCalledToken] = useState<{
    tokenNumber: string | number;
    patientName: string;
    roomNumber: string;
    doctorName: string;
  } | null>(null);

  // Clock Ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
      setDateString(
        now.toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen to Hospital Event Bus for Live Calls, Completes, and SSE Bridging
  useEffect(() => {
    // Ensure SSE bridge is connected so cross-device events stream to TV display
    hospitalEventBus.initSseBridge();

    const unsubCalled = hospitalEventBus.subscribe('PATIENT_CALLED', (payload: HospitalEventPayload) => {
      const data = payload.data || {};
      const tokenNum = data.tokenNumber || data.token || data.opdToken;
      if (tokenNum) {
        handleCallEncounter({
          tokenNumber: String(tokenNum).startsWith('#') ? tokenNum : `#${tokenNum}`,
          patientName: data.patientName || data.name || 'OPD Patient',
          uhid: data.uhid || `UHID-2026-${tokenNum}`,
          roomNumber: data.roomNumber || data.chamber || 'ROOM 101',
          doctorName: data.doctorName || partnerProfile.doctorName || 'Attending Physician'
        });
      }
    });

    const unsubChamberCall = hospitalEventBus.subscribe('PATIENT_CALLED_TO_CHAMBER', (payload: HospitalEventPayload) => {
      const data = payload.data || {};
      const tokenNum = data.tokenNumber || data.token || data.opdToken;
      if (tokenNum) {
        handleCallEncounter({
          tokenNumber: String(tokenNum).startsWith('#') ? tokenNum : `#${tokenNum}`,
          patientName: data.patientName || data.name || 'OPD Patient',
          uhid: data.uhid || `UHID-2026-${tokenNum}`,
          roomNumber: data.roomNumber || data.chamber || 'ROOM 101',
          doctorName: data.doctorName || partnerProfile.doctorName || 'Attending Physician'
        });
      }
    });

    const unsubSelected = hospitalEventBus.subscribe('PATIENT_SELECTED', (payload: HospitalEventPayload) => {
      const data = payload.data || {};
      const tokenNum = data.tokenNumber || data.token || data.opdToken;
      if (tokenNum) {
        handleCallEncounter({
          tokenNumber: String(tokenNum).startsWith('#') ? tokenNum : `#${tokenNum}`,
          patientName: data.patientName || data.name || 'OPD Patient',
          uhid: data.uhid || `UHID-2026-${tokenNum}`,
          roomNumber: data.roomNumber || data.chamber || 'ROOM 101',
          doctorName: data.doctorName || partnerProfile.doctorName || 'Attending Physician'
        });
      }
    });

    const unsubCompleted = hospitalEventBus.subscribe('TOKEN_COMPLETED', (payload: HospitalEventPayload) => {
      const data = payload.data || {};
      const tokenNum = data.tokenNumber || data.token;
      if (tokenNum) {
        const formattedToken = String(tokenNum).startsWith('#') ? tokenNum : `#${tokenNum}`;
        setChambers((prev) =>
          prev.map((ch) => ({
            ...ch,
            currentToken: ch.currentToken?.tokenNumber === formattedToken ? null : ch.currentToken,
            waitingTokens: ch.waitingTokens.filter((w) => String(w.tokenNumber) !== formattedToken)
          }))
        );
      }
    });

    const unsubRx = hospitalEventBus.subscribe('PRESCRIPTION_ISSUED', (payload: HospitalEventPayload) => {
      const data = payload.data || {};
      const tokenNum = data.tokenNumber || data.token;
      if (tokenNum) {
        const formattedToken = String(tokenNum).startsWith('#') ? tokenNum : `#${tokenNum}`;
        setChambers((prev) =>
          prev.map((ch) => ({
            ...ch,
            currentToken: ch.currentToken?.tokenNumber === formattedToken ? null : ch.currentToken,
            waitingTokens: ch.waitingTokens.filter((w) => String(w.tokenNumber) !== formattedToken)
          }))
        );
      }
    });

    const unsubTokenGenerated = hospitalEventBus.subscribe('TOKEN_GENERATED', (payload: HospitalEventPayload) => {
      const data = payload.data || {};
      const tokenNum = data.tokenNumber || data.token;
      if (tokenNum) {
        const formattedToken = String(tokenNum).startsWith('#') ? tokenNum : `#${tokenNum}`;
        const chamberName = data.chamber || 'Room 101';
        setChambers((prev) =>
          prev.map((ch) => {
            if (
              ch.roomNumber.toLowerCase() === chamberName.toLowerCase() ||
              ch.chamberId === chamberName ||
              ch.doctorName === data.doctorName ||
              prev.length === 1
            ) {
              const alreadyExists = ch.waitingTokens.some((w) => String(w.tokenNumber) === formattedToken);
              if (alreadyExists) return ch;
              return {
                ...ch,
                waitingTokens: [
                  ...ch.waitingTokens,
                  {
                    tokenNumber: formattedToken,
                    patientName: data.patientName || 'OPD Patient',
                    uhid: data.uhid || `UHID-2026-${tokenNum}`,
                    estWait: '10 mins'
                  }
                ]
              };
            }
            return ch;
          })
        );
      }
    });

    return () => {
      unsubCalled();
      unsubChamberCall();
      unsubSelected();
      unsubCompleted();
      unsubRx();
      unsubTokenGenerated();
    };
  }, [partnerProfile]);

  const handleCallEncounter = (callData: {
    tokenNumber: string | number;
    patientName: string;
    uhid: string;
    roomNumber: string;
    doctorName: string;
  }) => {
    // 1. Play Ding-Dong Bell Chime immediately (<10ms)
    void playHospitalChimeDingDong();

    // 2. Bilingual Voice Callout (Hindi + English)
    setTimeout(() => {
      playRegionalTokenAnnouncement(
        callData.tokenNumber,
        callData.patientName,
        callData.roomNumber,
        callData.doctorName,
        isMuted,
        selectedLanguage
      );
    }, 600);

    // 3. Immediately set Top Screen Hero Calling Banner
    setHeroCalledToken(callData);

    // 4. Update Chamber State & Immediately Trigger Active Flash Animations
    setChambers((prev) => {
      // Find matching chamber index by normalized room or doctor
      const targetRoomNorm = (callData.roomNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const targetDocNorm = (callData.doctorName || '').toLowerCase().replace(/[^a-z]/g, '');

      let matchedIdx = prev.findIndex((ch) => {
        const chRoomNorm = ch.roomNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
        return targetRoomNorm && chRoomNorm && (targetRoomNorm === chRoomNorm || targetRoomNorm.includes(chRoomNorm) || chRoomNorm.includes(targetRoomNorm));
      });

      if (matchedIdx === -1 && targetDocNorm) {
        matchedIdx = prev.findIndex((ch) => {
          const chDocNorm = ch.doctorName.toLowerCase().replace(/[^a-z]/g, '');
          return chDocNorm && (targetDocNorm.includes(chDocNorm) || chDocNorm.includes(targetDocNorm));
        });
      }

      // If room not in existing grid, assign to chamber 0
      const targetIdx = matchedIdx >= 0 ? matchedIdx : 0;

      return prev.map((ch, idx) => {
        if (idx === targetIdx) {
          const remainingWaiting = ch.waitingTokens.filter(
            (w) => String(w.tokenNumber) !== String(callData.tokenNumber)
          );
          return {
            ...ch,
            currentToken: {
              tokenNumber: callData.tokenNumber,
              patientName: callData.patientName,
              uhid: callData.uhid,
              callTime: 'Just now'
            },
            waitingTokens: remainingWaiting,
            isCalling: true
          };
        }
        return ch;
      });
    });

    // Reset calling pulse after 8 seconds
    setTimeout(() => {
      setChambers((prev) =>
        prev.map((ch) => ({ ...ch, isCalling: false }))
      );
    }, 8000);
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen error:', err);
    }
  };

  // Trigger simulated call for testing / demonstration
  const handleTestCall = (chamberIndex: number) => {
    const targetChamber = chambers[chamberIndex];
    if (!targetChamber) return;
    const nextPatient = targetChamber.waitingTokens[0] || {
      tokenNumber: `#${Math.floor(Math.random() * 80) + 10}`,
      patientName: 'Demo Patient',
      estWait: '0 min'
    };

    handleCallEncounter({
      tokenNumber: nextPatient.tokenNumber,
      patientName: nextPatient.patientName,
      uhid: `UHID-2026-${nextPatient.tokenNumber.toString().replace(/\D/g, '')}`,
      roomNumber: targetChamber.roomNumber,
      doctorName: targetChamber.doctorName
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: themeMode === 'OLED_DARK' ? '#05070E' : '#0B1120',
        color: '#F8FAFC',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 32px',
        boxSizing: 'border-box',
        userSelect: 'none',
        overflow: 'hidden'
      }}
    >
      <style>{`
        @keyframes glowPulse {
          0% { transform: scale(1); box-shadow: 0 0 20px rgba(2, 132, 199, 0.4); border-color: #38BDF8; }
          50% { transform: scale(1.015); box-shadow: 0 0 45px rgba(245, 158, 11, 0.8), 0 0 20px rgba(56, 189, 248, 0.9); border-color: #F59E0B; }
          100% { transform: scale(1); box-shadow: 0 0 20px rgba(2, 132, 199, 0.4); border-color: #38BDF8; }
        }
        @keyframes flashNumber {
          0%, 100% { opacity: 1; transform: scale(1); color: #FCD34D; }
          50% { opacity: 0.25; transform: scale(1.08); color: #EF4444; }
        }
        @keyframes chamberCallingPulse {
          0%, 100% { box-shadow: 0 0 25px rgba(56, 189, 248, 0.4); border-color: #38BDF8; }
          50% { box-shadow: 0 0 55px rgba(245, 158, 11, 0.9), inset 0 0 25px rgba(245, 158, 11, 0.35); border-color: #F59E0B; }
        }
      `}</style>
      {/* 1. Header Bar: Hospital Branding, Live Clock & TV Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px solid rgba(56, 189, 248, 0.25)',
          paddingBottom: '18px',
          marginBottom: '20px'
        }}
      >
        {/* Hospital Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              backgroundColor: '#0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '30px',
              boxShadow: '0 4px 20px rgba(2, 132, 199, 0.5)'
            }}
          >
            ðŸ¥
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
              {effectiveHospitalName}
            </div>
            <div style={{ fontSize: '0.9375rem', color: '#38BDF8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981', animation: 'pulse 1.5s infinite' }}></span>
              <span>LIVE OPD WAITING LOUNGE QUEUE DISPLAY • लाइव ओपीडी प्रतीक्षालय टोकन प्रदर्शन</span>
            </div>
          </div>
        </div>

        {/* Date, Time & TV Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#F8FAFC', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
              {timeString || '12:00:00 PM'}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#94A3B8', fontWeight: 600 }}>
              {dateString}
            </div>
          </div>

          {/* Quick TV Control Buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            
            {/* Indic Language Selector */}
            <div style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '2px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              {(['HI', 'BN', 'MR', 'TA', 'TE', 'EN'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSelectedLanguage(lang)}
                  style={{
                    backgroundColor: selectedLanguage === lang ? '#0284C7' : 'transparent',
                    color: selectedLanguage === lang ? '#FFFFFF' : '#94A3B8',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                  title={`Voice caller in ${lang}`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsMuted((prev) => !prev)}
              style={{
                backgroundColor: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                border: `1px solid ${isMuted ? '🔇 Muted' : '🔊 Chime ON'}`,
                color: isMuted ? '#EF4444' : '#38BDF8',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Toggle Audio Buzzer & Voice"
            >
              {isMuted ? '🔇 Muted' : '🔊 Chime ON'}
            </button>

            <button
              type="button"
              onClick={() => handleTestCall(0)}
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10B981',
                color: '#10B981',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Test Ding-Dong Chime & Voice Call"
            >🔔 Test Chime</button>

            <button
              type="button"
              onClick={toggleFullscreen}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#F8FAFC',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Toggle Fullscreen (F11)"
            >
              {isFullscreen ? 'ðŸ—— Window' : 'â›¶ Fullscreen'}
            </button>

            {onExit && (
              <button
                type="button"
                onClick={onExit}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #EF4444',
                  color: '#EF4444',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >✕ Exit TV</button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Hero Calling Banner (Flashing Gold/Cyan Bar When Doctor Calls Token) */}
      {heroCalledToken && (
        <div
          style={{
            backgroundColor: '#0284C7',
            backgroundImage: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            borderRadius: '18px',
            padding: '16px 28px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 30px rgba(2, 132, 199, 0.5)',
            border: '2px solid #38BDF8',
            animation: 'glowPulse 2s infinite'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                backgroundColor: '#F59E0B',
                color: '#000000',
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '1.25rem',
                fontWeight: 900,
                letterSpacing: '0.05em'
              }}
            >
              NOW CALLING / à¤ªà¤§à¤¾à¤°à¥‡à¤‚ âž”
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF' }}>
                Token {heroCalledToken.tokenNumber}: {heroCalledToken.patientName}
              </div>
              <div style={{ fontSize: '1rem', color: '#E0F2FE', fontWeight: 600 }}>
                Please proceed immediately to <strong>{heroCalledToken.roomNumber}</strong> ({heroCalledToken.doctorName})
              </div>
            </div>
          </div>

          <div style={{
            fontSize: '3.5rem',
            fontWeight: 900,
            color: '#FCD34D',
            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
            animation: 'flashNumber 0.8s infinite'
          }}>
            {heroCalledToken.tokenNumber}
          </div>
        </div>
      )}

      {/* 3. Multi-Chamber Grid: 4 Large Chambers Visible from 30ft away */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          flex: 1,
          alignItems: 'stretch'
        }}
      >
        {chambers.map((ch, idx) => (
          <div
            key={ch.chamberId}
            style={{
              backgroundColor: ch.isCalling ? 'rgba(2, 132, 199, 0.25)' : '#0F172A',
              border: `2.5px solid ${ch.isCalling ? '🔔 CALLING' : '🟢 ACTIVE'}`,
              borderRadius: '20px',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: ch.isCalling
                ? '0 0 35px rgba(56, 189, 248, 0.4), inset 0 0 15px rgba(56, 189, 248, 0.2)'
                : '0 8px 24px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.3s ease',
              position: 'relative',
              animation: ch.isCalling ? 'chamberCallingPulse 1.2s infinite' : 'none'
            }}
          >
            {/* Chamber Header */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#38BDF8',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 900,
                    letterSpacing: '0.05em'
                  }}
                >
                  {ch.roomNumber}
                </span>

                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: ch.isCalling ? '#10B981' : '#94A3B8',
                    backgroundColor: ch.isCalling ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}
                >
                  {ch.isCalling ? '🔔 CALLING' : '🟢 ACTIVE'}
                </span>
              </div>

              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', marginBottom: '2px', lineHeight: 1.2 }}>
                {ch.doctorName}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 600 }}>
                {ch.specialty}
              </div>
            </div>

            {/* Current Serving Token (High Visibility 72px Display) */}
            <div
              style={{
                backgroundColor: '#020617',
                border: '2px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '16px',
                padding: '20px 14px',
                textAlign: 'center',
                margin: '18px 0'
              }}
            >
              <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                NOW SERVING / à¤…à¤‚à¤¦à¤° à¤¹à¥ˆà¤‚
              </div>
              <div
                style={{
                  fontSize: '4.5rem',
                  fontWeight: 900,
                  color: ch.isCalling ? '#38BDF8' : '#F8FAFC',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  textShadow: ch.isCalling ? '0 0 25px rgba(56, 189, 248, 0.8)' : 'none',
                  animation: ch.isCalling ? 'flashNumber 0.8s infinite' : 'none'
                }}
              >
                {ch.currentToken?.tokenNumber || '—'}
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#F1F5F9', marginTop: '10px' }}>
                {ch.currentToken?.patientName || 'Waiting for patient'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                {ch.currentToken?.uhid || ''}
              </div>
            </div>

            {/* Waiting Queue List */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>NEXT WAITING / आगामी कतार</span>
                <span>{ch.waitingTokens.length} waiting</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {ch.waitingTokens.slice(0, 3).map((w, wIdx) => (
                  <div
                    key={wIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 900, color: '#FBBF24', fontSize: '1rem' }}>
                        {w.tokenNumber}
                      </span>
                      <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{w.patientName}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>~{w.estWait}</span>
                  </div>
                ))}
                {ch.waitingTokens.length === 0 && (
                  <div style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#64748B', padding: '10px' }}>
                    Queue clear / à¤•à¥‹à¤ˆ à¤ªà¥à¤°à¤¤à¥€à¤•à¥à¤·à¤¾ à¤¨à¤¹à¥€à¤‚
                  </div>
                )}
              </div>
            </div>

            {/* Quick Test Call trigger button per chamber for staff demo */}
            <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => handleTestCall(idx)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px dashed rgba(255,255,255,0.2)',
                  color: '#94A3B8',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.6875rem',
                  cursor: 'pointer'
                }}
              >
                Call Next Token âž”
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Bottom Announcement Marquee Ticker */}
      <div
        style={{
          marginTop: '20px',
          backgroundColor: '#020617',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '12px',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          overflow: 'hidden'
        }}
      >
        <span
          style={{
            backgroundColor: '#DC2626',
            color: '#FFFFFF',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 900,
            whiteSpace: 'nowrap'
          }}
        >
          NOTICE / à¤¸à¥‚à¤šà¤¨à¤¾
        </span>
        <div style={{ fontSize: '0.9375rem', color: '#CBD5E1', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📢 कृपया अपना टोकन नंबर आने पर ही संबंधित परामर्श कक्ष में प्रवेश करें। आपातकालीन सहायता के लिए काउंटर नंबर 1 पर संपर्क करें। Please enter consulting chamber only when your token is called. Keep silence in the waiting area.</div>
      </div>
    </div>
  );
};
