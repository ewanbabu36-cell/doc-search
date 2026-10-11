import React, { useState } from 'react';
import { type Language, translations } from '../i18n.js';
import { type PatientProfile } from '../services/patient-api.js';

interface Props {
  language: Language;
  onLanguageToggle: () => void;
  patient: PatientProfile;
  onNavigate: (screen: 'QUEUE' | 'PARCHI' | 'DAWA' | 'VIDEO') => void;
  onLogout: () => void;
}

export const PatientHomeScreen: React.FC<Props> = ({ language, onLanguageToggle, patient, onNavigate, onLogout }) => {
  const t = translations[language];
  const [showQrPass, setShowQrPass] = useState(false);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B0F19', color: '#F8FAFC', padding: '20px 16px', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>{t.welcome},</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>{patient.fullName}</div>
          <div style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700, fontFamily: 'monospace' }}>{patient.uhid}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={onLanguageToggle}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#F8FAFC',
              padding: '6px 12px',
              borderRadius: '16px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {language === 'hi' ? '🇮🇳 English' : '🇮🇳 हिंदी'}
          </button>

          <button
            type="button"
            onClick={() => setShowQrPass(true)}
            style={{
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38BDF8',
              padding: '6px 10px',
              borderRadius: '16px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title={t.emergencyPass}
          >
            QR Pass
          </button>

          <button
            type="button"
            onClick={onLogout}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: 'none',
              color: '#F87171',
              padding: '6px 10px',
              borderRadius: '16px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Dynamic Hero Card: Live Hospital Token Card */}
      {patient.activeToken && (
        <div
          onClick={() => onNavigate('QUEUE')}
          style={{
            backgroundColor: '#1E293B',
            border: '2px solid #0284C7',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(2, 132, 199, 0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ⚡ {t.activeHospitalVisit}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '3px 8px', borderRadius: '6px' }}>
              ● Live in Queue
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>{t.tokenNumber}</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#F8FAFC', lineHeight: 1.1 }}>
                #{patient.activeToken.tokenNumber}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#E2E8F0', marginTop: '6px', fontWeight: 700 }}>
                {patient.activeToken.doctorName}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#38BDF8' }}>
                Room {patient.activeToken.chamberRoom}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FBBF24' }}>
                {patient.activeToken.patientsAhead}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>
                {t.patientsAhead}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 800, marginTop: '8px' }}>
                Track Live ➔
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Card 2: Next Medicine Due */}
      <div
        onClick={() => onNavigate('DAWA')}
        style={{
          backgroundColor: '#1E293B',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          padding: '16px 18px',
          marginBottom: '24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '1.75rem' }}>🌤️</span>
          <div>
            <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
              {t.nextMedicine}
            </div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#F8FAFC' }}>
              Paracetamol 650mg (1 Tab)
            </div>
            <div style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 600 }}>
              1:30 PM • {t.afterMeals}
            </div>
          </div>
        </div>
        <span style={{ color: '#38BDF8', fontSize: '0.875rem', fontWeight: 800 }}>➔</span>
      </div>

      {/* 4 Big Main Action Tiles (Fat-Finger Friendly) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', flex: 1 }}>
        <button
          type="button"
          onClick={() => onNavigate('QUEUE')}
          style={{
            backgroundColor: '#1E293B',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '20px 16px',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '130px'
          }}
        >
          <span style={{ fontSize: '2rem' }}>⚡</span>
          <div>
            <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#F8FAFC' }}>{t.myToken}</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>Live queue & buzzer</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('PARCHI')}
          style={{
            backgroundColor: '#1E293B',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '20px 16px',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '130px'
          }}
        >
          <span style={{ fontSize: '2rem' }}>📄</span>
          <div>
            <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#F8FAFC' }}>{t.myRecords}</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>Digital Rx & Lab PDFs</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('DAWA')}
          style={{
            backgroundColor: '#1E293B',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '20px 16px',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '130px'
          }}
        >
          <span style={{ fontSize: '2rem' }}>💊</span>
          <div>
            <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#F8FAFC' }}>{t.medicines}</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>Dose schedule & refill</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('VIDEO')}
          style={{
            backgroundColor: '#1E293B',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '20px 16px',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '130px'
          }}
        >
          <span style={{ fontSize: '2rem' }}>📹</span>
          <div>
            <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#F8FAFC' }}>{t.videoConsult}</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>1-Click video chamber</div>
          </div>
        </button>
      </div>

      {/* Emergency QR Pass Modal */}
      {showQrPass && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#1E293B', borderRadius: '24px', padding: '28px', maxWidth: '360px', width: '100%', textAlign: 'center', border: '2px solid #0284C7' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '6px' }}>{t.emergencyPass}</h3>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '20px' }}>{t.emergencyNotice}</p>

            <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '16px', display: 'inline-block', marginBottom: '20px' }}>
              <div style={{ width: '160px', height: '160px', backgroundColor: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 700 }}>
                [QR: {patient.uhid}]
              </div>
            </div>

            <div style={{ textAlign: 'left', backgroundColor: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '12px', fontSize: '0.8125rem', marginBottom: '20px' }}>
              <div><strong>Name:</strong> {patient.fullName} ({patient.age}y/{patient.gender[0]})</div>
              <div><strong>UHID:</strong> {patient.uhid}</div>
              <div><strong>Blood Group:</strong> <span style={{ color: '#F87171', fontWeight: 800 }}>{patient.bloodGroup}</span></div>
              <div><strong>Allergies:</strong> {patient.allergies.join(', ')}</div>
            </div>

            <button
              type="button"
              onClick={() => setShowQrPass(false)}
              style={{ width: '100%', backgroundColor: '#0284C7', color: '#F8FAFC', border: 'none', padding: '14px', borderRadius: '14px', fontWeight: 800, cursor: 'pointer' }}
            >
              Close QR Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
