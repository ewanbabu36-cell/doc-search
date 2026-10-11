import React, { useState } from 'react';
import { type Language, translations } from '../i18n.js';

interface Props {
  language: Language;
  onBack: () => void;
}

export const VideoConsultationScreen: React.FC<Props> = ({ language, onBack }) => {
  const t = translations[language];
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B0F19', color: '#F8FAFC', padding: '20px 16px', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#F8FAFC',
            padding: '8px 14px',
            borderRadius: '12px',
            fontSize: '0.9375rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          ← {language === 'hi' ? 'वापस' : 'Back'}
        </button>
        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#38BDF8' }}>
          {t.videoConsult}
        </span>
        <div style={{ width: '60px' }} />
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
              marginBottom: '24px'
            }}
          >
            👨‍⚕️
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '8px' }}>Dr. Vivek Sharma</h2>
          <p style={{ fontSize: '0.9375rem', color: '#38BDF8', fontWeight: 600, marginBottom: '4px' }}>MD General Medicine • Room 102</p>
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', maxWidth: '320px', marginBottom: '32px' }}>
            Encrypted WebRTC peer-to-peer video connection. High definition video & direct digital prescription.
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
              borderRadius: '18px',
              padding: '18px',
              fontSize: '1.125rem',
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', borderRadius: '24px', overflow: 'hidden', backgroundColor: '#1E293B' }}>
          {/* Main Video View (Doctor Video) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A', position: 'relative' }}>
            <div style={{ fontSize: '5rem', marginBottom: '12px' }}>👨‍⚕️</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>Dr. Vivek Sharma</div>
            <div style={{ fontSize: '0.8125rem', color: '#10B981', fontWeight: 700, marginTop: '4px' }}>
              ● {t.videoActive}
            </div>

            {/* Self Video PIP (Picture-in-Picture) */}
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                width: '100px',
                height: '140px',
                backgroundColor: '#334155',
                borderRadius: '14px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.5)'
              }}
            >
              <span style={{ fontSize: '2rem' }}>🧑</span>
              <span style={{ fontSize: '0.625rem', color: '#94A3B8', marginTop: '4px' }}>You</span>
            </div>
          </div>

          {/* Call Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', padding: '20px', backgroundColor: '#1E293B' }}>
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: isMuted ? '#EF4444' : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#F8FAFC',
                fontSize: '1.25rem',
                cursor: 'pointer'
              }}
            >
              {isMuted ? '🔇' : '🎙️'}
            </button>

            <button
              type="button"
              onClick={() => setIsVideoOff(!isVideoOff)}
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: isVideoOff ? '#EF4444' : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#F8FAFC',
                fontSize: '1.25rem',
                cursor: 'pointer'
              }}
            >
              {isVideoOff ? '🚫' : '📹'}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsCallActive(false);
                alert('Call ended. Doctor prescription has been saved to "Meri Parchi"!');
              }}
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: '#EF4444',
                border: 'none',
                color: '#F8FAFC',
                fontSize: '1.25rem',
                cursor: 'pointer'
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
