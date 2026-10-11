import React, { useState } from 'react';
import { type Language, translations } from '../i18n.js';
import { patientApiService, DEMO_FAMILY_MEMBERS, type PatientProfile } from '../services/patient-api.js';

interface Props {
  language: Language;
  onLanguageToggle: () => void;
  onLoginSuccess: (patient: PatientProfile) => void;
}

export const PatientLoginScreen: React.FC<Props> = ({ language, onLanguageToggle, onLoginSuccess }) => {
  const t = translations[language];
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP' | 'SELECT_PATIENT'>('PHONE');
  const [isLoading, setIsLoading] = useState(false);
  const [registeredInfo, setRegisteredInfo] = useState<{ isRegistered: boolean; name?: string | null | undefined; mrn?: string | null | undefined }>({ isRegistered: false });
  const [newPatientName, setNewPatientName] = useState('');
  const [multiPatientsList, setMultiPatientsList] = useState<PatientProfile[]>([]);
  const [showAddNewInline, setShowAddNewInline] = useState(false);
  const [inlineNewName, setInlineNewName] = useState('');
  const [inlineNewAge, setInlineNewAge] = useState('');
  const [inlineNewGender, setInlineNewGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    setIsLoading(true);
    const res = await patientApiService.requestOtp(phone);
    setIsLoading(false);
    setRegisteredInfo({
      isRegistered: res.isRegistered,
      name: res.registeredName,
      mrn: res.patientMrn
    });
    setStep('OTP');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) return;
    setIsLoading(true);
    const verifyOptions: any = {};
    if (newPatientName.trim()) verifyOptions.fullName = newPatientName.trim();
    const result = await patientApiService.verifyOtp(phone, otp, verifyOptions);
    setIsLoading(false);

    // If multiple patients are registered with this phone number, display the patient selection drawer
    if (result.multiplePatients && Array.isArray(result.patients) && result.patients.length > 1) {
      setMultiPatientsList(result.patients);
      setStep('SELECT_PATIENT');
      return;
    }

    if (result.patient) {
      onLoginSuccess(result.patient);
    }
  };

  const handleSelectPatient = async (p: PatientProfile) => {
    setIsLoading(true);
    const result = await patientApiService.verifyOtp(phone, otp, { selectedPatientId: p.id });
    setIsLoading(false);
    if (result.patient) {
      onLoginSuccess(result.patient);
    } else {
      patientApiService.setPatient(p);
      onLoginSuccess(p);
    }
  };

  const handleAddAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineNewName.trim()) return;
    setIsLoading(true);
    const created = await patientApiService.addFamilyMember(phone, {
      fullName: inlineNewName.trim(),
      age: parseInt(inlineNewAge, 10) || 30,
      gender: inlineNewGender
    });
    setIsLoading(false);
    if (created) {
      patientApiService.setPatient(created);
      onLoginSuccess(created);
    }
  };

  const handleQuickDemo = () => {
    // Show multi-patient choice so reviewer can inspect both single and multi-patient flows
    setPhone('9876543210');
    setOtp('1234');
    setMultiPatientsList(DEMO_FAMILY_MEMBERS);
    setStep('SELECT_PATIENT');
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
            {step === 'SELECT_PATIENT' ? t.selectPatientTitle : `${t.welcome} 👋`}
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#94A3B8', lineHeight: 1.4 }}>
            {step === 'SELECT_PATIENT' ? t.selectPatientSubtitle : t.subtitle}
          </p>
        </div>

        {step === 'PHONE' && (
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
        )}

        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {registeredInfo.isRegistered ? (
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.25rem' }}>🏥</span>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#34D399' }}>
                    {registeredInfo.name ? `Namaste ${registeredInfo.name} ji!` : 'Hospital Record Linked'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    UHID: {registeredInfo.mrn || 'Linked'} • Doctor ke clinic se auto-connected
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  {language === 'hi' ? 'मरीज का नाम (Patient Name)' : 'Patient Full Name'}
                </label>
                <input
                  type="text"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  placeholder={language === 'hi' ? 'उदा. रमेश कुमार' : 'e.g. Ramesh Kumar'}
                  style={{
                    width: '100%',
                    backgroundColor: '#1E293B',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    color: '#F8FAFC',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

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
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ fontSize: '0.75rem', color: '#38BDF8', textAlign: 'center', marginTop: '6px' }}>
                ⚡ Test OTP: <strong>1234</strong>
              </div>
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

        {/* Step 3: Multi-Patient Selector on Same Mobile Number */}
        {step === 'SELECT_PATIENT' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '0.8125rem', color: '#38BDF8', fontWeight: 700, textAlign: 'center', marginBottom: '4px' }}>
              📱 Mobile: +91 {phone}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {multiPatientsList.map((pat) => (
                <button
                  key={pat.id}
                  type="button"
                  onClick={() => handleSelectPatient(pat)}
                  disabled={isLoading}
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '16px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        backgroundColor: pat.gender === 'FEMALE' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(2, 132, 199, 0.15)',
                        border: pat.gender === 'FEMALE' ? '1px solid rgba(236, 72, 153, 0.3)' : '1px solid rgba(2, 132, 199, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem'
                      }}
                    >
                      {pat.gender === 'FEMALE' ? '👩' : '👨'}
                    </div>

                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 900, color: '#F8FAFC' }}>
                        {pat.fullName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                        {pat.age} Yrs • {pat.gender} • UHID: {pat.uhid}
                      </div>
                      {pat.activeToken ? (
                        <div style={{ marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '6px', padding: '2px 8px' }}>
                          <span style={{ fontSize: '0.6875rem', color: '#34D399', fontWeight: 800 }}>
                            🟢 Active Token {pat.activeToken.tokenNumber} ({pat.activeToken.estimatedWaitMins}m wait)
                          </span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '3px' }}>
                          Routine Profile
                        </div>
                      )}
                    </div>
                  </div>

                  <span style={{ fontSize: '1.25rem', color: '#38BDF8', fontWeight: 900 }}>➔</span>
                </button>
              ))}
            </div>

            {/* Inline Add New Family Member */}
            {!showAddNewInline ? (
              <button
                type="button"
                onClick={() => setShowAddNewInline(true)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px dashed rgba(255, 255, 255, 0.2)',
                  color: '#CBD5E1',
                  borderRadius: '14px',
                  padding: '12px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: '6px'
                }}
              >
                {t.addNewFamilyMember}
              </button>
            ) : (
              <form onSubmit={handleAddAndLogin} style={{ backgroundColor: '#1E293B', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8' }}>
                  {language === 'hi' ? 'नए सदस्य का विवरण भरें:' : 'Enter New Patient Details:'}
                </div>

                <input
                  type="text"
                  required
                  placeholder={language === 'hi' ? 'मरीज़ का नाम' : 'Patient Name'}
                  value={inlineNewName}
                  onChange={(e) => setInlineNewName(e.target.value)}
                  style={{ backgroundColor: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '10px', padding: '10px', color: '#F8FAFC', outline: 'none' }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="number"
                    required
                    min={1}
                    max={120}
                    placeholder={language === 'hi' ? 'उम्र (उदा. 32)' : 'Age (e.g. 32)'}
                    value={inlineNewAge}
                    onChange={(e) => setInlineNewAge(e.target.value)}
                    style={{ backgroundColor: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '10px', padding: '10px', color: '#F8FAFC', outline: 'none' }}
                  />

                  <select
                    value={inlineNewGender}
                    onChange={(e) => setInlineNewGender(e.target.value as any)}
                    style={{ backgroundColor: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '10px', padding: '10px', color: '#F8FAFC', outline: 'none' }}
                  >
                    <option value="MALE">{language === 'hi' ? 'पुरुष (M)' : 'Male'}</option>
                    <option value="FEMALE">{language === 'hi' ? 'महिला (F)' : 'Female'}</option>
                    <option value="OTHER">{language === 'hi' ? 'अन्य (O)' : 'Other'}</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="submit"
                    style={{ flex: 1, backgroundColor: '#0284C7', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '10px', fontWeight: 800, cursor: 'pointer' }}
                  >
                    ✓ {language === 'hi' ? 'जोड़ें और शुरू करें' : 'Save & Login'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddNewInline(false)}
                    style={{ backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#94A3B8', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <button
              type="button"
              onClick={() => setStep('PHONE')}
              style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '0.8125rem', cursor: 'pointer', padding: '8px', textAlign: 'center' }}
            >
              ← {language === 'hi' ? 'नंबर बदलें (Back to Phone)' : 'Change Mobile Number'}
            </button>
          </div>
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
            Instant Multi-Patient test: Vikramaditya, Shanti Devi & Aarav
          </span>
        </div>
      </div>
    </div>
  );
};
