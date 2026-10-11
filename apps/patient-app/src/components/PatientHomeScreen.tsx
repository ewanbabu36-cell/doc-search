import React, { useState } from 'react';
import { type Language, translations } from '../i18n.js';
import { type PatientProfile } from '../services/patient-api.js';
import { speakAdvice } from '../utils/voice-assistant.js';
import { BookOpdModal } from './BookOpdModal.js';
import { EmergencySosModal } from './EmergencySosModal.js';
import { FamilyProfileSwitcherModal } from './FamilyProfileSwitcherModal.js';
import { DigitalReceiptModal } from './DigitalReceiptModal.js';

interface Props {
  language: Language;
  onLanguageToggle: () => void;
  patient: PatientProfile;
  onNavigate: (screen: 'QUEUE' | 'PARCHI' | 'DAWA' | 'VIDEO' | 'BOOK' | 'PROFILE') => void;
  onSelectPatient: (p: PatientProfile) => void;
}

export const PatientHomeScreen: React.FC<Props> = ({
  language,
  onLanguageToggle,
  patient,
  onNavigate,
  onSelectPatient
}) => {
  const t = translations[language];
  const [showQrPass, setShowQrPass] = useState(false);
  const [showEmergencySos, setShowEmergencySos] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Clean format token number to prevent ##14 bug
  const cleanTokenNumber = patient.activeToken?.tokenNumber
    ? patient.activeToken.tokenNumber.replace(/^#+/, '#')
    : '#14';

  const handleVoiceAdvice = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSpeaking(true);
    const textToSpeak =
      language === 'hi'
        ? `डॉक्टर विक्रम मल्होत्रा की सलाह: अगली दवा पैरासिटामोल 650 एमजी, दोपहर 1:30 बजे खाने के बाद 1 गोली लें।`
        : `Doctor Advice: Next medicine Paracetamol 650mg, take 1 tablet at 1:30 PM after food.`;
    speakAdvice(textToSpeak, language);
    setTimeout(() => setIsSpeaking(false), 5000);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B0F19', color: '#F8FAFC', padding: '16px 16px 90px 16px', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Hospital Trust Header & Emergency Action Bar */}
      <div
        style={{
          backgroundColor: '#1E293B',
          borderRadius: '16px',
          padding: '12px 14px',
          marginBottom: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.5rem' }}>🏥</span>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
              {t.hospitalName}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#34D399', fontWeight: 700 }}>
              {t.opdActiveStatus} • {t.branchName}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowEmergencySos(true)}
          style={{
            backgroundColor: '#DC2626',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            padding: '6px 10px',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(220, 38, 38, 0.4)'
          }}
        >
          🚨 SOS
        </button>
      </div>

      {/* 2. Patient Greeting & Family Switcher Pill */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>{t.welcome},</div>
          {/* Family Switcher Dropdown Pill */}
          <button
            type="button"
            onClick={() => setShowFamilyModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '20px',
              padding: '4px 12px',
              color: '#F8FAFC',
              fontSize: '1.125rem',
              fontWeight: 900,
              cursor: 'pointer',
              marginTop: '2px'
            }}
          >
            <span>{patient.fullName}</span>
            <span style={{ fontSize: '0.75rem', color: '#38BDF8' }}>▼</span>
          </button>
          <div style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700, fontFamily: 'monospace', marginTop: '2px' }}>
            {patient.uhid} • {patient.bloodGroup}
          </div>
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
            onClick={() => onNavigate('PROFILE')}
            style={{
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38BDF8',
              padding: '6px 10px',
              borderRadius: '16px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title={t.profile}
          >
            <span>👤</span>
            <span>{t.profile}</span>
          </button>
        </div>
      </div>

      {/* 3. Dynamic Hero Card: Live Hospital Token Card (Fixed ##14 to #14) */}
      {patient.activeToken ? (
        <div
          onClick={() => onNavigate('QUEUE')}
          style={{
            backgroundColor: '#1E293B',
            border: '2px solid #0284C7',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px',
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
              {/* Clean Single Hash */}
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#F8FAFC', lineHeight: 1.1 }}>
                {cleanTokenNumber}
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
      ) : (
        /* If no active token, prominent 1-Tap Booking Card */
        <div
          onClick={() => setShowBookModal(true)}
          style={{
            backgroundColor: 'rgba(2, 132, 199, 0.15)',
            border: '2px dashed #0284C7',
            borderRadius: '20px',
            padding: '18px 20px',
            marginBottom: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '2rem' }}>📅</span>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
                {t.bookOpdToken}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#38BDF8' }}>
                {language === 'hi' ? 'बिना लाइन लगे डॉक्टर का लाइव टोकन लें' : 'Skip the reception line • Instant Token'}
              </div>
            </div>
          </div>
          <span style={{ backgroundColor: '#0284C7', color: '#FFFFFF', padding: '6px 12px', borderRadius: '12px', fontSize: '0.8125rem', fontWeight: 800 }}>
            Book ➔
          </span>
        </div>
      )}

      {/* 4. Next Medicine Due with Voice Advice Button ("Doctor Ki Awaaz") */}
      <div
        onClick={() => onNavigate('DAWA')}
        style={{
          backgroundColor: '#1E293B',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          padding: '14px 18px',
          marginBottom: '16px',
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

        {/* 1-Tap Voice Advice Speaker */}
        <button
          type="button"
          onClick={handleVoiceAdvice}
          title={t.voicePrescription}
          style={{
            backgroundColor: isSpeaking ? '#10B981' : 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: isSpeaking ? '#FFFFFF' : '#38BDF8',
            borderRadius: '12px',
            padding: '8px 12px',
            fontSize: '0.8125rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>{isSpeaking ? '🔊' : '🗣️'}</span>
          <span>{isSpeaking ? 'बोल रहे हैं...' : language === 'hi' ? 'सुनें' : 'Listen'}</span>
        </button>
      </div>

      {/* 5. Fees Paid & Digital Slip Banner */}
      <div
        onClick={() => setShowReceiptModal(true)}
        style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '14px',
          padding: '10px 14px',
          marginBottom: '20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.125rem' }}>🧾</span>
          <div style={{ fontSize: '0.8125rem', color: '#34D399', fontWeight: 700 }}>
            {t.paidReceipt}: <strong>₹500</strong> Paid via UPI (Receipt #RCP-3817)
          </div>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 800 }}>View ➔</span>
      </div>

      {/* 6. 4 Main Action Tiles (Fat-Finger Friendly) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', flex: 1, marginBottom: '20px' }}>
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

      {/* Emergency SOS Modal */}
      {showEmergencySos && (
        <EmergencySosModal language={language} onClose={() => setShowEmergencySos(false)} />
      )}

      {/* Family Profile Switcher Modal */}
      {showFamilyModal && (
        <FamilyProfileSwitcherModal
          language={language}
          currentPatient={patient}
          onClose={() => setShowFamilyModal(false)}
          onSelectPatient={(selected) => onSelectPatient(selected)}
        />
      )}

      {/* Digital Receipt Slip Modal */}
      {showReceiptModal && (
        <DigitalReceiptModal language={language} patient={patient} onClose={() => setShowReceiptModal(false)} />
      )}

      {/* Book OPD Token Modal */}
      {showBookModal && (
        <BookOpdModal
          language={language}
          patient={patient}
          onClose={() => setShowBookModal(false)}
          onSuccess={(updated) => onSelectPatient(updated)}
        />
      )}
    </div>
  );
};
