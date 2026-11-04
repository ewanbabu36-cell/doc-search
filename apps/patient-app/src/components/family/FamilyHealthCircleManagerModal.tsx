import React, { useState, useEffect } from 'react';

export interface FamilyCircleMember {
  id: string;
  name: string;
  relationship: 'SELF' | 'FATHER' | 'MOTHER' | 'SPOUSE' | 'SON' | 'DAUGHTER' | 'OTHER';
  relationshipLabel: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  abhaId: string;
  abhaAddress: string;
  chronicTags: string[];
  activeRxCount: number;
  labReportCount: number;
  avatarIcon: string;
  isPrimaryAccountHolder: boolean;
}

const DEFAULT_FAMILY_CIRCLE: FamilyCircleMember[] = [
  {
    id: 'fam-self-001',
    name: 'Rajesh Sharma',
    relationship: 'SELF',
    relationshipLabel: 'Self (Account Holder)',
    age: 48,
    gender: 'MALE',
    abhaId: '91-8765-4321-9876',
    abhaAddress: 'rajesh.sharma@abdm',
    chronicTags: ['Type 2 Diabetes', 'Mild HTN'],
    activeRxCount: 3,
    labReportCount: 5,
    avatarIcon: '👨',
    isPrimaryAccountHolder: true
  },
  {
    id: 'fam-father-002',
    name: 'Rameshwar Sharma',
    relationship: 'FATHER',
    relationshipLabel: 'Pita Ji (Father)',
    age: 74,
    gender: 'MALE',
    abhaId: '91-1122-3344-5566',
    abhaAddress: 'rameshwar.74@abdm',
    chronicTags: ['Post-CABG Cardiac', 'Hypertension', 'Prostate'],
    activeRxCount: 5,
    labReportCount: 12,
    avatarIcon: '👴',
    isPrimaryAccountHolder: false
  },
  {
    id: 'fam-mother-003',
    name: 'Kamla Devi',
    relationship: 'MOTHER',
    relationshipLabel: 'Mata Ji (Mother)',
    age: 70,
    gender: 'FEMALE',
    abhaId: '91-9988-7766-5544',
    abhaAddress: 'kamla.devi@abdm',
    chronicTags: ['Hypothyroidism', 'Osteoarthritis Knees'],
    activeRxCount: 4,
    labReportCount: 8,
    avatarIcon: '👵',
    isPrimaryAccountHolder: false
  },
  {
    id: 'fam-child-004',
    name: 'Ananya Sharma',
    relationship: 'DAUGHTER',
    relationshipLabel: 'Beti (Daughter)',
    age: 12,
    gender: 'FEMALE',
    abhaId: '91-3344-5566-7788',
    abhaAddress: 'ananya.child@abdm',
    chronicTags: ['Pediatric Immunization Vault', 'Allergic Rhinitis'],
    activeRxCount: 1,
    labReportCount: 3,
    avatarIcon: '👧',
    isPrimaryAccountHolder: false
  }
];

export interface FamilyHealthCircleManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMemberId?: string | undefined;
  onSelectActiveMember?: ((member: FamilyCircleMember) => void) | undefined;
}

export const FamilyHealthCircleManagerModal: React.FC<FamilyHealthCircleManagerModalProps> = ({
  isOpen,
  onClose,
  activeMemberId = 'fam-self-001',
  onSelectActiveMember
}) => {
  const [members, setMembers] = useState<FamilyCircleMember[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('docsearch_family_circle');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_FAMILY_CIRCLE;
  });

  const [currentSelectedId, setCurrentSelectedId] = useState<string>(activeMemberId);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // New member form fields
  const [newName, setNewName] = useState<string>('');
  const [newRelation, setNewRelation] = useState<FamilyCircleMember['relationship']>('SPOUSE');
  const [newAge, setNewAge] = useState<string>('');
  const [newGender, setNewGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('FEMALE');
  const [newAbha, setNewAbha] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('docsearch_family_circle', JSON.stringify(members));
      } catch {}
    }
  }, [members]);

  const handleSwitchProfile = (member: FamilyCircleMember) => {
    setCurrentSelectedId(member.id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('docsearch_active_family_member', JSON.stringify(member));
        window.dispatchEvent(
          new CustomEvent('docsearch:family_member_switched', { detail: member })
        );
      } catch {}
    }
    if (onSelectActiveMember) {
      onSelectActiveMember(member);
    }
    onClose();
  };

  const handleAddNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const relationMap: Record<FamilyCircleMember['relationship'], { label: string; icon: string }> = {
      SELF: { label: 'Self', icon: '👤' },
      FATHER: { label: 'Pita Ji (Father)', icon: '👴' },
      MOTHER: { label: 'Mata Ji (Mother)', icon: '👵' },
      SPOUSE: { label: 'Spouse (Partner)', icon: '👩' },
      SON: { label: 'Beta (Son)', icon: '👦' },
      DAUGHTER: { label: 'Beti (Daughter)', icon: '👧' },
      OTHER: { label: 'Family Relative', icon: '🧑' }
    };

    const newMember: FamilyCircleMember = {
      id: `fam-member-${Date.now()}`,
      name: newName.trim(),
      relationship: newRelation,
      relationshipLabel: relationMap[newRelation].label,
      age: parseInt(newAge, 10) || 30,
      gender: newGender,
      abhaId: newAbha.trim() || `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      abhaAddress: `${newName.toLowerCase().replace(/\s+/g, '.')}.${Math.floor(Math.random() * 99)}@abdm`,
      chronicTags: ['General Health Vault'],
      activeRxCount: 0,
      labReportCount: 0,
      avatarIcon: relationMap[newRelation].icon,
      isPrimaryAccountHolder: false
    };

    setMembers((prev) => [...prev, newMember]);
    setShowAddForm(false);
    setNewName('');
    setNewAge('');
    setNewAbha('');
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(2, 6, 23, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '750px',
          maxHeight: '88vh',
          backgroundColor: '#0F172A',
          border: '1.5px solid #0284C7',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(2, 132, 199, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            backgroundColor: '#090D16',
            borderBottom: '1px solid #1E293B',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>👨‍👩‍👧‍👦</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#F8FAFC' }}>
                Family Health Circle & Proxy Vault
              </h3>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Switch active family profile • Dedicated ABHA Cards • Separate Rx & Lab Vaults
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* BODY: FAMILY MEMBERS CARDS LIST */}
        <div
          style={{
            padding: '18px 20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {members.map((m) => {
            const isActive = m.id === currentSelectedId;

            return (
              <div
                key={m.id}
                style={{
                  backgroundColor: isActive ? 'rgba(2, 132, 199, 0.15)' : '#1E293B',
                  border: isActive ? '2px solid #0284C7' : '1px solid #334155',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Member Identity & ABHA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1.5px solid rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      flexShrink: 0
                    }}
                  >
                    {m.avatarIcon}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#F8FAFC' }}>
                        {m.name}
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: m.isPrimaryAccountHolder ? '#0284C7' : 'rgba(255, 255, 255, 0.08)',
                          color: '#FFFFFF',
                          fontWeight: 700
                        }}
                      >
                        {m.relationshipLabel}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                      {m.age} Yrs • {m.gender} | <span style={{ color: '#38BDF8', fontFamily: 'monospace' }}>ABHA: {m.abhaId}</span>
                    </div>

                    {/* Chronic tags */}
                    <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {m.chronicTags.map((tag, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.65rem',
                            backgroundColor: 'rgba(56, 189, 248, 0.1)',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            color: '#38BDF8',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontWeight: 600
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Switch Profile Button */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  {isActive ? (
                    <span
                      style={{
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      ✓ Active Profile
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSwitchProfile(m)}
                      style={{
                        backgroundColor: '#0284C7',
                        border: 'none',
                        color: '#FFFFFF',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      Switch To This Profile →
                    </button>
                  )}

                  <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                    {m.activeRxCount} Prescriptions • {m.labReportCount} Lab Reports
                  </div>
                </div>
              </div>
            );
          })}

          {/* ADD NEW MEMBER COLLAPSIBLE FORM */}
          {showAddForm ? (
            <form
              onSubmit={handleAddNewMember}
              style={{
                backgroundColor: '#090D16',
                border: '1.5px dashed #0284C7',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#38BDF8' }}>
                Add Household Family Member
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '3px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Meera Sharma"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: '#FFF',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '3px' }}>
                    Relationship
                  </label>
                  <select
                    value={newRelation}
                    onChange={(e) => setNewRelation(e.target.value as any)}
                    style={{
                      width: '100%',
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: '#FFF',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  >
                    <option value="FATHER">Pita Ji (Father)</option>
                    <option value="MOTHER">Mata Ji (Mother)</option>
                    <option value="SPOUSE">Pati / Patni (Spouse)</option>
                    <option value="SON">Beta (Son)</option>
                    <option value="DAUGHTER">Beti (Daughter)</option>
                    <option value="OTHER">Other Relative</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '3px' }}>
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    required
                    placeholder="e.g. 45"
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: '#FFF',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '3px' }}>
                    Gender
                  </label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as any)}
                    style={{
                      width: '100%',
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: '#FFF',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  >
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '3px' }}>
                    ABHA ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="91-XXXX-XXXX-XXXX"
                    value={newAbha}
                    onChange={(e) => setNewAbha(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: '#FFF',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #334155',
                    color: '#94A3B8',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#10B981',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '6px 16px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  + Add To Circle
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1.5px dashed #334155',
                borderRadius: '12px',
                padding: '12px',
                color: '#38BDF8',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>+ Add Another Family Member / Dependent</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
