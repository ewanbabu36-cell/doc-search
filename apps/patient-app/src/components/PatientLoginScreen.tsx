import React, { useState } from 'react';
import { type Language, translations } from '../i18n.js';
import { patientApiService, DEMO_PATIENT, type PatientProfile } from '../services/patient-api.js';

interface Props {
  language: Language;
  onLanguageToggle: () => void;
  onLoginSuccess: (patient: PatientProfile) => void;
}

export const PatientLoginScreen: React.FC<Props> = ({ language, onLanguageToggle, onLoginSuccess }) => {
  const t = translations[language];
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    setIsLoading(true);
    await patientApiService.requestOtp(phone);
    setIsLoading(false);
    setStep('OTP');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) return;
    setIsLoading(true);
    const patient = await patientApiService.verifyOtp(phone, otp);
    setIsLoading(false);
    onLoginSuccess(patient);
  };

  const handleQuickDemo = () => {
    patientApiService.setPatient(DEMO_PATIENT);
    onLoginSuccess(DEMO_PATIENT);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0B0F19', color: '#F8FAFC', padding: '24px 20px' }}>
      {/* Top Header with Language Pill */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.75rem' }}>🏥</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#38BDF8' }}>DOC SEARCH</span>
        </div>
        <button
          type="button"
          onClick={onLanguageToggle}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#F8FAFC',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          {language === 'hi' ? '🇮🇳 English' : '🇮🇳 हिंदी'}
        </button>
      </div>

      {/* Main Content Box */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '420px', margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '8px', color: '#F8FAFC' }}>
            {t.welcome} 👋
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#94A3B8', lineHeight: 1.4 }}>
            {t.subtitle}
          </p>
        </div>

        {step === 'PHONE' ? (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '8px' }}>
                {t.enterMobile}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1E293B', border: '2px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', overflow: 'hidden' }}>
                <span style={{ padding: '0 16px', color: '#94A3B8', fontWeight: 700, fontSize: '1rem', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder={t.mobilePlaceholder}
                  autoFocus
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    padding: '16px',
                    color: '#F8FAFC',
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={phone.length < 10 || isLoading}
              style={{
                width: '100%',
                backgroundColor: phone.length === 10 ? '#0284C7' : '#334155',
                color: '#F8FAFC',
                border: 'none',
                borderRadius: '14px',
                padding: '16px',
                fontSize: '1.0625rem',
                fontWeight: 800,
                cursor: phone.length === 10 ? 'pointer' : 'not-allowed',
                boxShadow: phone.length === 10 ? '0 4px 14px rgba(2, 132, 199, 0.4)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {isLoading ? '...' : t.getOtp} ➔
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '8px' }}>
                {t.enterOtpFor} +91 {phone}
              </label>
              <input
                type="text"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • •"
                autoFocus
                style={{
                  width: '100%',
                  backgroundColor: '#1E293B',
                  border: '2px solid #0284C7',
                  borderRadius: '14px',
                  padding: '16px',
                  color: '#38BDF8',
                  fontSize: '1.75rem',
                  fontWeight: 900,
                  textAlign: 'center',
                  letterSpacing: '0.5em',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={otp.length < 4 || isLoading}
              style={{
                width: '100%',
                backgroundColor: otp.length === 4 ? '#10B981' : '#334155',
                color: '#F8FAFC',
                border: 'none',
                borderRadius: '14px',
                padding: '16px',
                fontSize: '1.0625rem',
                fontWeight: 800,
                cursor: otp.length === 4 ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease'
              }}
            >
              {isLoading ? '...' : t.verifyOtp} ✓
            </button>

            <button
              type="button"
              onClick={() => setStep('PHONE')}
              style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '0.875rem', cursor: 'pointer', padding: '8px' }}
            >
              ← Change Mobile Number
            </button>
          </form>
        )}

        {/* 1-Click Demo Login */}
        <div style={{ marginTop: '36px', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '24px' }}>
          <button
            type="button"
            onClick={handleQuickDemo}
            style={{
              width: '100%',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              border: '1px dashed rgba(56, 189, 248, 0.35)',
              color: '#38BDF8',
              borderRadius: '14px',
              padding: '14px',
              fontSize: '0.9375rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ⚡ {t.quickDemoLogin}
          </button>
          <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748B', marginTop: '6px' }}>
            Instant access to Token #14, Prescriptions & Reports
          </span>
        </div>
      </div>
    </div>
  );
};
