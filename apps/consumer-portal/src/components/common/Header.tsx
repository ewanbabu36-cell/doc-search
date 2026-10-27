import React, { useState } from 'react';

export interface FamilyMemberProfile {
  id: string;
  fullName: string;
  relationship: 'SELF' | 'SPOUSE' | 'FATHER' | 'MOTHER' | 'SON' | 'DAUGHTER' | 'OTHER';
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  uhid: string;
  chronicTags: string[];
  carePassBadge?: string;
  walletAllowanceMonthly?: number;
  walletAllowanceSpent?: number;
  avatarColor?: string;
}

export interface HeaderProps {
  hospitalName?: string;
  branchName?: string;
  activeMember: FamilyMemberProfile;
  familyMembers: FamilyMemberProfile[];
  onSelectMember: (member: FamilyMemberProfile) => void;
  onAddFamilyMember?: () => void;
  onEmergencySos?: () => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  isDarkMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  hospitalName = 'Apex Medicity Multi-Specialty Hospital',
  branchName = 'South Delhi Super Care Hub',
  activeMember,
  familyMembers,
  onSelectMember,
  onAddFamilyMember,
  onEmergencySos,
  unreadNotificationsCount = 2,
  onOpenNotifications,
  isDarkMode = true
}) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const getRelationshipLabel = (rel: FamilyMemberProfile['relationship']) => {
    switch (rel) {
      case 'SELF': return 'Self';
      case 'SPOUSE': return 'Spouse';
      case 'FATHER': return 'Father';
      case 'MOTHER': return 'Mother';
      case 'SON': return 'Son';
      case 'DAUGHTER': return 'Daughter';
      default: return 'Family';
    }
  };

  const getMemberIcon = (rel: FamilyMemberProfile['relationship'], gender: string) => {
    if (rel === 'SELF') return '👤';
    if (rel === 'FATHER') return '👴';
    if (rel === 'MOTHER') return '👵';
    if (rel === 'SPOUSE') return gender === 'FEMALE' ? '👩' : '👨';
    if (rel === 'SON') return '👦';
    if (rel === 'DAUGHTER') return '👧';
    return '🧑';
  };

  const textColor = isDarkMode ? '#F8FAFC' : '#0F172A';
  const subTextColor = isDarkMode ? '#94A3B8' : '#64748B';

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backgroundColor: isDarkMode ? 'rgba(11, 15, 25, 0.92)' : 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {/* Top Row: Hospital Trust Branding & Action Icons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>🏥</span>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: textColor, lineHeight: 1.2 }}>
                {hospitalName}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700 }}>
                ● OPD Live • {branchName}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Notification Bell */}
            <button
              type="button"
              onClick={onOpenNotifications}
              aria-label="View notifications"
              style={{
                position: 'relative',
                background: isDarkMode ? '#1E293B' : '#F1F5F9',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.06)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1rem',
                color: textColor
              }}
            >
              🔔
              {unreadNotificationsCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '10px',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Emergency SOS Button */}
            {onEmergencySos && (
              <button
                type="button"
                onClick={onEmergencySos}
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '7px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 10px rgba(220, 38, 38, 0.4)'
                }}
              >
                🚨 SOS 108
              </button>
            )}
          </div>
        </div>

        {/* Bottom Row: 1-Tap Family Health Tree Switcher Pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            type="button"
            onClick={() => setIsSheetOpen(true)}
            aria-label="Switch family member profile"
            style={{
              background: isDarkMode
                ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.25) 0%, rgba(30, 41, 59, 0.8) 100%)'
                : 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
              border: isDarkMode ? '1px solid rgba(129, 140, 248, 0.4)' : '1px solid rgba(79, 70, 229, 0.3)',
              borderRadius: '20px',
              padding: '6px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.15)'
            }}
          >
            <span style={{ fontSize: '1rem' }}>{getMemberIcon(activeMember.relationship, activeMember.gender)}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: textColor }}>
                  {activeMember.fullName} ({getRelationshipLabel(activeMember.relationship)})
                </span>
                <span style={{ fontSize: '0.6875rem', color: '#818CF8', fontWeight: 700 }}>
                  ▼
                </span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: subTextColor }}>
                {activeMember.age}y • UHID: {activeMember.uhid}
              </div>
            </div>
          </button>

          {activeMember.carePassBadge && (
            <span
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.6875rem',
                fontWeight: 800,
                letterSpacing: '0.03em'
              }}
            >
              ★ {activeMember.carePassBadge}
            </span>
          )}
        </div>
      </header>

      {/* Animated Bottom-Sheet Modal for Family Switcher */}
      {isSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="family-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setIsSheetOpen(false)}
        >
          <div
            style={{
              backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
              borderTopLeftRadius: '28px',
              borderTopRightRadius: '28px',
              borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #E2E8F0',
              padding: '20px 20px 32px 20px',
              maxHeight: '80vh',
              overflowY: 'auto',
              color: textColor,
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab handle indicator */}
            <div
              style={{
                width: '40px',
                height: '4px',
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                borderRadius: '2px',
                margin: '0 auto 16px auto'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 id="family-modal-title" style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800 }}>
                  👨‍👩‍👧 Family Health Tree
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: subTextColor }}>
                  Select a profile to switch active appointments, prescriptions, and health wallet allowance.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsSheetOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.25rem',
                  color: subTextColor,
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* List of Family Members */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {familyMembers.map((member) => {
                const isSelected = member.id === activeMember.id;
                return (
                  <div
                    key={member.id}
                    onClick={() => {
                      onSelectMember(member);
                      setIsSheetOpen(false);
                    }}
                    style={{
                      background: isSelected
                        ? isDarkMode
                          ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.25) 0%, rgba(30, 41, 59, 0.8) 100%)'
                          : '#EEF2FF'
                        : isDarkMode
                          ? '#1E293B'
                          : '#F8FAFC',
                      border: isSelected
                        ? '2px solid #818CF8'
                        : isDarkMode
                          ? '1px solid rgba(255, 255, 255, 0.08)'
                          : '1px solid #E2E8F0',
                      borderRadius: '16px',
                      padding: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          backgroundColor: member.avatarColor || '#4F46E5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.25rem',
                          color: '#FFFFFF'
                        }}
                      >
                        {getMemberIcon(member.relationship, member.gender)}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: textColor }}>
                            {member.fullName}
                          </span>
                          <span
                            style={{
                              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                              color: textColor,
                              fontSize: '0.625rem',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '6px'
                            }}
                          >
                            {getRelationshipLabel(member.relationship)}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: subTextColor, marginTop: '2px' }}>
                          {member.age} yrs • {member.gender} • UHID: {member.uhid}
                        </div>

                        {/* Chronic / Health tags */}
                        {member.chronicTags && member.chronicTags.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                            {member.chronicTags.map((tag, idx) => (
                              <span
                                key={idx}
                                style={{
                                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                  color: '#F59E0B',
                                  fontSize: '0.625rem',
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: '6px'
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {isSelected ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#10B981',
                            color: '#FFFFFF',
                            fontSize: '12px',
                            fontWeight: 900
                          }}
                        >
                          ✓
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#818CF8', fontWeight: 700 }}>
                          Switch ➔
                        </span>
                      )}

                      {member.walletAllowanceMonthly !== undefined && (
                        <div style={{ fontSize: '0.625rem', color: subTextColor, marginTop: '4px' }}>
                          Wallet: ₹{member.walletAllowanceMonthly - (member.walletAllowanceSpent || 0)} left
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Family Member CTA */}
            {onAddFamilyMember && (
              <button
                type="button"
                onClick={() => {
                  setIsSheetOpen(false);
                  onAddFamilyMember();
                }}
                style={{
                  width: '100%',
                  marginTop: '16px',
                  backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                  border: isDarkMode ? '1px dashed #818CF8' : '1px dashed #4F46E5',
                  color: isDarkMode ? '#818CF8' : '#4F46E5',
                  borderRadius: '16px',
                  padding: '12px',
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                ➕ Add Another Family Member
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
