import React, { useState, useEffect } from 'react';
import { type Language, translations } from '../i18n.js';
import { type PatientProfile, patientApiService } from '../services/patient-api.js';

interface Props {
  language: Language;
  onLanguageToggle: () => void;
  patient: PatientProfile;
  onSelectPatient: (patient: PatientProfile) => void;
  onLogout: () => void;
  onBack: () => void;
}

export const PatientProfileScreen: React.FC<Props> = ({
  language,
  onLanguageToggle,
  patient,
  onSelectPatient,
  onLogout,
  onBack
}) => {
  const t = translations[language];
  const [familyMembers, setFamilyMembers] = useState<PatientProfile[]>([]);
  const [isLoadingFamily, setIsLoadingFamily] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAge, setNewMemberAge] = useState('');
  const [newMemberGender, setNewMemberGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [newMemberRelation, setNewMemberRelation] = useState('Spouse');
  const [copySuccess, setCopySuccess] = useState(false);

  // Generate deterministic official ABHA ID for patient
  const cleanDigits = (patient.uhid || patient.id).replace(/\D/g, '') || '918201942188';
  const paddedDigits = (cleanDigits + '91820194218841').slice(0, 14);
  const abhaNumber = `${paddedDigits.slice(0, 2)}-${paddedDigits.slice(2, 6)}-${paddedDigits.slice(6, 10)}-${paddedDigits.slice(10, 14)}`;
  const abhaAddress = `${patient.fullName.toLowerCase().replace(/[^a-z0-9]/g, '.') || 'patient'}@abdm`;

  useEffect(() => {
    let isMounted = true;
    setIsLoadingFamily(true);
    patientApiService.getFamilyMembers(patient.phone).then((members) => {
      if (isMounted) {
        setFamilyMembers(members);
        setIsLoadingFamily(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [patient.phone]);

  const handleCopyAbha = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(abhaNumber);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const added = await patientApiService.addFamilyMember(patient.phone, {
      fullName: `${newMemberName.trim()} (${newMemberRelation})`,
      age: parseInt(newMemberAge, 10) || 35,
      gender: newMemberGender,
      relationship: newMemberRelation
    });

    if (added) {
      setFamilyMembers((prev) => [...prev, added]);
      setShowAddMemberModal(false);
      setNewMemberName('');
      setNewMemberAge('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B0F19', color: '#F8FAFC', padding: '16px 16px 100px 16px', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Header with Back button and Language toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#F8FAFC',
            padding: '8px 14px',
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>←</span>
          <span>{language === 'hi' ? 'वापस' : 'Back'}</span>
        </button>

        <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0, color: '#F8FAFC' }}>
          👤 {t.profile}
        </h2>

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
      </div>

      {/* 2. Official Government ABHA Digital Health ID Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #064E3B 0%, #065F46 50%, #047857 100%)',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 8px 30px rgba(6, 95, 70, 0.35)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Tricolor Ribbon on Top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', display: 'flex' }}>
          <div style={{ flex: 1, backgroundColor: '#FF9933' }} />
          <div style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
          <div style={{ flex: 1, backgroundColor: '#138808' }} />
        </div>

        {/* ABHA Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', paddingTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>🇮🇳</span>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#A7F3D0', letterSpacing: '0.05em' }}>
                NATIONAL HEALTH AUTHORITY
              </div>
              <div style={{ fontSize: '0.625rem', color: '#D1FAE5', opacity: 0.85 }}>
                Ayushman Bharat Digital Mission (ABDM)
              </div>
            </div>
          </div>
          <span
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              fontSize: '0.625rem',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            ✓ VERIFIED
          </span>
        </div>

        {/* Card Body: Avatar & Name */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              border: '2px solid rgba(255, 255, 255, 0.25)'
            }}
          >
            {patient.gender === 'FEMALE' ? '👩' : '👨'}
          </div>

          <div>
            <div style={{ fontSize: '1.1875rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
              {patient.fullName}
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#D1FAE5', display: 'flex', gap: '10px', marginTop: '2px' }}>
              <span>{patient.age} Yrs • {patient.gender}</span>
              <span>• Blood: <strong>{patient.bloodGroup}</strong></span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#A7F3D0', fontFamily: 'monospace', marginTop: '2px' }}>
              UHID: {patient.uhid}
            </div>
          </div>
        </div>

        {/* ABHA 14-Digit Number Box */}
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            borderRadius: '12px',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}
        >
          <div>
            <div style={{ fontSize: '0.625rem', color: '#A7F3D0', fontWeight: 700 }}>
              {t.abhaNumber}
            </div>
            <div style={{ fontSize: '1.0625rem', fontWeight: 900, letterSpacing: '0.12em', color: '#FFFFFF', fontFamily: 'monospace' }}>
              {abhaNumber}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#D1FAE5', marginTop: '2px' }}>
              ABHA Address: <strong style={{ color: '#FCD34D' }}>{abhaAddress}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyAbha}
            style={{
              backgroundColor: copySuccess ? '#10B981' : 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.6875rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {copySuccess ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6875rem', color: '#D1FAE5' }}>
          <span>🟢 {t.abhaLinked}</span>
          <span style={{ opacity: 0.9 }}>Government of India</span>
        </div>
      </div>

      {/* 3. Clinical & Medical Flags Box */}
      <div
        style={{
          backgroundColor: '#1E293B',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🛡️</span>
          <span>{t.medicalFlags}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px', padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1rem' }}>⚠️</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#FCA5A5' }}>
                {language === 'hi' ? 'दवा एलर्जी (Allergies)' : 'Known Allergies'}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#EF4444' }}>
              {patient.allergies.join(', ') || 'None Recorded'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '10px', padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1rem' }}>🩺</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#FCD34D' }}>
                {language === 'hi' ? 'पुरानी बीमारी (Chronic Conditions)' : 'Chronic Conditions'}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F59E0B' }}>
              Type 2 Diabetes • BP
            </span>
          </div>
        </div>
      </div>

      {/* 4. Family Members Linked to this Phone Number */}
      <div
        style={{
          backgroundColor: '#1E293B',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>👨‍👩‍👧‍👦</span>
            <span>{t.familyProfiles} ({familyMembers.length || 1})</span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddMemberModal(true)}
            style={{
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38BDF8',
              padding: '4px 10px',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            {t.addMember}
          </button>
        </div>

        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '12px' }}>
          {language === 'hi'
            ? `मोबाइल +91 ${patient.phone} से जुड़े परिवार के सभी मरीज़:`
            : `All patients linked under mobile +91 ${patient.phone}:`}
        </div>

        {isLoadingFamily ? (
          <div style={{ textAlign: 'center', padding: '16px', color: '#94A3B8', fontSize: '0.8125rem' }}>
            {language === 'hi' ? 'परिवार सूची लोड हो रही है...' : 'Loading family members...'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {familyMembers.map((mem) => {
              const isCurrent = mem.id === patient.id;
              return (
                <div
                  key={mem.id}
                  style={{
                    backgroundColor: isCurrent ? 'rgba(56, 189, 248, 0.12)' : '#0F172A',
                    border: isCurrent ? '2px solid #0284C7' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: isCurrent ? '#0284C7' : '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem'
                      }}
                    >
                      {mem.gender === 'FEMALE' ? '👩' : '👨'}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
                        {mem.fullName}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                        {mem.age} Yrs • UHID: {mem.uhid}
                      </div>
                      {mem.activeToken && (
                        <span style={{ display: 'inline-block', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', fontSize: '0.625rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', marginTop: '3px' }}>
                          🟢 Token {mem.activeToken.tokenNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  {isCurrent ? (
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.2)', padding: '4px 10px', borderRadius: '8px' }}>
                      ✓ {language === 'hi' ? 'सक्रिय' : 'Active'}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectPatient(mem)}
                      style={{
                        backgroundColor: '#1E293B',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#F8FAFC',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {t.switchMember} ➔
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Emergency SOS Contact Person */}
      <div
        style={{
          backgroundColor: '#1E293B',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🚨</span>
          <span>{t.emergencyContact}</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', borderRadius: '12px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
              Amit Kumar (Son)
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
              +91 98765 00000 • 24x7 Emergency Contact
            </div>
          </div>

          <a
            href="tel:+919876500000"
            style={{
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              textDecoration: 'none',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>📞</span>
            <span>Call</span>
          </a>
        </div>
      </div>

      {/* 6. Logout Button */}
      <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
        <button
          type="button"
          onClick={onLogout}
          style={{
            width: '100%',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#EF4444',
            padding: '14px',
            borderRadius: '14px',
            fontSize: '0.9375rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>🚪</span>
          <span>{language === 'hi' ? 'लॉगआउट करें (Logout)' : 'Logout of Account'}</span>
        </button>
      </div>

      {/* Add Family Member Modal */}
      {showAddMemberModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: '#0F172A',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '24px 20px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#F8FAFC' }}>
                {t.addMember}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMember} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  {language === 'hi' ? 'मरीज का नाम (Full Name)' : 'Member Name'}
                </label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder={language === 'hi' ? 'उदा. सुनीता देवी' : 'e.g. Sunita Devi'}
                  style={{
                    width: '100%',
                    backgroundColor: '#1E293B',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '12px',
                    color: '#F8FAFC',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                    {language === 'hi' ? 'उम्र (Age)' : 'Age'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={120}
                    value={newMemberAge}
                    onChange={(e) => setNewMemberAge(e.target.value)}
                    placeholder="35"
                    style={{
                      width: '100%',
                      backgroundColor: '#1E293B',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      padding: '12px',
                      color: '#F8FAFC',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                    {language === 'hi' ? 'लिंग (Gender)' : 'Gender'}
                  </label>
                  <select
                    value={newMemberGender}
                    onChange={(e) => setNewMemberGender(e.target.value as any)}
                    style={{
                      width: '100%',
                      backgroundColor: '#1E293B',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      padding: '12px',
                      color: '#F8FAFC',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="FEMALE">{language === 'hi' ? 'महिला (Female)' : 'Female'}</option>
                    <option value="MALE">{language === 'hi' ? 'पुरुष (Male)' : 'Male'}</option>
                    <option value="OTHER">{language === 'hi' ? 'अन्य (Other)' : 'Other'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  {language === 'hi' ? 'रिश्ता (Relation)' : 'Relationship'}
                </label>
                <select
                  value={newMemberRelation}
                  onChange={(e) => setNewMemberRelation(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#1E293B',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '12px',
                    color: '#F8FAFC',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Spouse">{language === 'hi' ? 'पति / पत्नी (Spouse)' : 'Spouse'}</option>
                  <option value="Child">{language === 'hi' ? 'बेटा / बेटी (Child)' : 'Child'}</option>
                  <option value="Parent">{language === 'hi' ? 'माता / पिता (Parent)' : 'Parent'}</option>
                  <option value="Sibling">{language === 'hi' ? 'भाई / बहन (Sibling)' : 'Sibling'}</option>
                  <option value="Other">{language === 'hi' ? 'अन्य परिजन (Other)' : 'Other'}</option>
                </select>
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginTop: '6px'
                }}
              >
                + {language === 'hi' ? 'सदस्य जोड़ें' : 'Save Family Member'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
