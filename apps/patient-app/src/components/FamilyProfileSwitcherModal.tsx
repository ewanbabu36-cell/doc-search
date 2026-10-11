import React, { useState } from 'react';
import { type Language } from '../i18n.js';
import { type PatientProfile, patientApiService } from '../services/patient-api.js';

interface Props {
  language: Language;
  currentPatient: PatientProfile;
  onClose: () => void;
  onSelectPatient: (patient: PatientProfile) => void;
}

export const FamilyProfileSwitcherModal: React.FC<Props> = ({
  language,
  currentPatient,
  onClose,
  onSelectPatient
}) => {
  const [familyMembers, setFamilyMembers] = useState<PatientProfile[]>([currentPatient]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAge, setNewMemberAge] = useState('');
  const [newMemberRelation, setNewMemberRelation] = useState('Pita Ji (Father)');

  React.useEffect(() => {
    let active = true;
    patientApiService.getFamilyMembers(currentPatient.phone).then((m) => {
      if (active && m.length > 0) setFamilyMembers(m);
    });
    return () => {
      active = false;
    };
  }, [currentPatient.phone]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const added = await patientApiService.addFamilyMember(currentPatient.phone, {
      fullName: `${newMemberName.trim()} (${newMemberRelation})`,
      age: parseInt(newMemberAge, 10) || 50,
      gender: 'MALE',
      relationship: newMemberRelation
    });

    if (added) {
      setFamilyMembers((prev) => [...prev, added]);
    }
    setShowAddMember(false);
    setNewMemberName('');
    setNewMemberAge('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 210,
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
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '24px 20px 32px 20px',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.8)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
              {language === 'hi' ? '👨‍👩‍👧‍👦 परिवार के सदस्य (Family)' : '👨‍👩‍👧‍👦 Family Profiles'}
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
              {language === 'hi' ? 'एक ही मोबाइल से पूरे परिवार का इलाज' : 'Manage family health on one number'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94A3B8',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Members List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {familyMembers.map((member) => {
            const isCurrent = member.id === currentPatient.id;
            return (
              <div
                key={member.id}
                onClick={() => {
                  patientApiService.setPatient(member);
                  onSelectPatient(member);
                  onClose();
                }}
                style={{
                  backgroundColor: isCurrent ? 'rgba(2, 132, 199, 0.2)' : '#1E293B',
                  border: isCurrent ? '2px solid #0284C7' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  boxShadow: isCurrent ? '0 4px 14px rgba(2, 132, 199, 0.3)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: isCurrent ? '#0284C7' : '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem'
                    }}
                  >
                    {member.gender === 'FEMALE' ? '👵' : member.age < 12 ? '👶' : '👤'}
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
                      {member.fullName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      {member.age} वर्ष • {member.bloodGroup} • <span style={{ color: '#38BDF8' }}>{member.uhid}</span>
                    </div>
                    {member.activeToken && (
                      <div style={{ fontSize: '0.6875rem', color: '#34D399', fontWeight: 700, marginTop: '2px' }}>
                        ⚡ Live Token: {member.activeToken.tokenNumber} ({member.activeToken.doctorName.split(' ')[1] || 'Doctor'})
                      </div>
                    )}
                  </div>
                </div>

                {isCurrent && (
                  <span style={{ backgroundColor: '#10B981', color: '#FFFFFF', padding: '4px 10px', borderRadius: '12px', fontSize: '0.6875rem', fontWeight: 800 }}>
                    ACTIVE
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Member Toggle */}
        {!showAddMember ? (
          <button
            type="button"
            onClick={() => setShowAddMember(true)}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px dashed rgba(255, 255, 255, 0.25)',
              color: '#38BDF8',
              borderRadius: '16px',
              padding: '14px',
              fontSize: '0.9375rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            ➕ {language === 'hi' ? 'नया पारिवारिक सदस्य जोड़ें' : 'Add Family Member'}
          </button>
        ) : (
          <form onSubmit={handleAddMember} style={{ backgroundColor: '#1E293B', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
              {language === 'hi' ? 'नए सदस्य की जानकारी' : 'New Member Details'}
            </div>
            <input
              type="text"
              placeholder={language === 'hi' ? 'मरीज़ का नाम' : 'Patient Full Name'}
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              required
              style={{
                backgroundColor: '#0F172A',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                padding: '10px 12px',
                color: '#F8FAFC',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input
                type="number"
                placeholder={language === 'hi' ? 'उम्र (Age)' : 'Age'}
                value={newMemberAge}
                onChange={(e) => setNewMemberAge(e.target.value)}
                required
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: '#F8FAFC',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
              <select
                value={newMemberRelation}
                onChange={(e) => setNewMemberRelation(e.target.value)}
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: '#F8FAFC',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              >
                <option value="Mata Ji (Mother)">Mata Ji (Mother)</option>
                <option value="Pita Ji (Father)">Pita Ji (Father)</option>
                <option value="Patni (Wife)">Patni (Wife)</option>
                <option value="Pati (Husband)">Pati (Husband)</option>
                <option value="Beta (Son)">Beta (Son)</option>
                <option value="Beti (Daughter)">Beti (Daughter)</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {language === 'hi' ? 'सेव करें' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddMember(false)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#94A3B8',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
