import React, { useState, useEffect } from 'react';
import { type Language, translations } from '../i18n.js';
import { type PatientProfile, patientApiService } from '../services/patient-api.js';

interface Props {
  language: Language;
  patient: PatientProfile;
  onBack: () => void;
}

export const MyTokenQueueScreen: React.FC<Props> = ({ language, patient, onBack }) => {
  const t = translations[language];
  const [patientsAhead, setPatientsAhead] = useState(patient.activeToken?.patientsAhead ?? 2);
  const [isCalled, setIsCalled] = useState(patient.activeToken?.isCalled ?? false);
  const [isDelayed, setIsDelayed] = useState(false);

  // Real-time Live Queue Polling (every 5 seconds)
  useEffect(() => {
    let mounted = true;
    const interval = setInterval(async () => {
      const active = await patientApiService.pollActiveToken(patient.phone);
      if (mounted && active) {
        setPatientsAhead(active.patientsAhead);
        if (active.isCalled && !isCalled) {
          setIsCalled(true);
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 400]);
          }
        }
      }
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [patient.phone, isCalled]);

  const handleSimulateDoctorCall = () => {
    setIsCalled(true);
    setPatientsAhead(0);
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }
  };

  const handleDelay = async () => {
    setIsDelayed(true);
    setPatientsAhead((prev) => prev + 2);
    await patientApiService.sendDelayAlert(patient.phone, 5);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B0F19', color: '#F8FAFC', padding: '20px 16px', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
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
          {t.myToken}
        </span>
        <div style={{ width: '60px' }} />
      </div>

      {/* Buzzer Alert Banner if Doctor Called */}
      {isCalled && (
        <div
          style={{
            backgroundColor: '#10B981',
            color: '#064E3B',
            padding: '18px 20px',
            borderRadius: '18px',
            marginBottom: '20px',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
            animation: 'pulse 1.5s infinite'
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '4px' }}>🔔</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '6px' }}>
            {t.tokenBuzzerAlert}
          </div>
          <div style={{ fontSize: '0.9375rem', fontWeight: 700 }}>
            {patient.activeToken?.doctorName} • Room {patient.activeToken?.chamberRoom}
          </div>
        </div>
      )}

      {/* Main Circular Token Card */}
      <div
        style={{
          backgroundColor: '#1E293B',
          borderRadius: '24px',
          padding: '32px 20px',
          textAlign: 'center',
          border: isCalled ? '3px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
          marginBottom: '24px'
        }}
      >
        <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
          {t.tokenNumber}
        </div>

        {/* Circular Token Badge */}
        <div
          style={{
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            margin: '0 auto 20px auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isCalled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.12)',
            border: `6px solid ${isCalled ? '#10B981' : '#0284C7'}`
          }}
        >
          <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: isCalled ? '#34D399' : '#38BDF8' }}>TOKEN</span>
          <span style={{ fontSize: '3.75rem', fontWeight: 900, color: '#F8FAFC', lineHeight: 1 }}>
            #{patient.activeToken?.tokenNumber || '14'}
          </span>
        </div>

        {/* Doctor and Chamber Details */}
        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', marginBottom: '4px' }}>
          {patient.activeToken?.doctorName}
        </div>
        <div style={{ fontSize: '0.9375rem', color: '#38BDF8', fontWeight: 700, marginBottom: '20px' }}>
          📍 {t.doctorRoom}: {patient.activeToken?.chamberRoom}
        </div>

        {/* Queue Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px' }}>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '14px', borderRadius: '14px' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: patientsAhead === 0 ? '#10B981' : '#FBBF24' }}>
              {patientsAhead}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, marginTop: '2px' }}>
              {t.patientsAhead}
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '14px', borderRadius: '14px' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#38BDF8' }}>
              {patientsAhead * 6} {t.minutes}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, marginTop: '2px' }}>
              {t.estimatedWait}
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
        {!isCalled && (
          <button
            type="button"
            onClick={handleSimulateDoctorCall}
            style={{
              width: '100%',
              backgroundColor: '#10B981',
              color: '#F8FAFC',
              border: 'none',
              borderRadius: '16px',
              padding: '16px',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
            }}
          >
            <span>🔔 Simulate Doctor Calling Me (Live Demo)</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleDelay}
          disabled={isDelayed || isCalled}
          style={{
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: isDelayed ? '#64748B' : '#E2E8F0',
            borderRadius: '16px',
            padding: '14px',
            fontSize: '0.9375rem',
            fontWeight: 700,
            cursor: isDelayed ? 'not-allowed' : 'pointer'
          }}
        >
          {isDelayed ? '✓ Turn Delayed by 2 Positions' : `⏱️ ${t.lateButton}`}
        </button>
      </div>
    </div>
  );
};
