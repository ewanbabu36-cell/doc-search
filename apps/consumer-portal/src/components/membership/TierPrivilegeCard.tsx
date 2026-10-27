import React from 'react';

export type HealthClubTier = 'SILVER' | 'GOLD' | 'PLATINUM' | 'BLACK';

export interface TierPrivilegeCardProps {
  currentTier?: HealthClubTier;
  membershipId?: string;
  patientName?: string;
  validThroughDate?: string;
  currentTierSpend?: number;
  nextTierSpendThreshold?: number;
  onExplorePrivileges?: () => void;
  onUpgradeTier?: () => void;
  isDarkMode?: boolean;
}

export const TierPrivilegeCard: React.FC<TierPrivilegeCardProps> = ({
  currentTier = 'PLATINUM',
  membershipId = 'DS-PLT-99482-VIP',
  patientName = 'Rahul Sharma',
  validThroughDate = 'OCT 2027',
  currentTierSpend = 18450,
  nextTierSpendThreshold = 25000,
  onExplorePrivileges,
  onUpgradeTier,
  isDarkMode = true
}) => {
  void isDarkMode;
  const getTierMetadata = (tier: HealthClubTier) => {
    switch (tier) {
      case 'BLACK':
        return {
          label: 'DOCSEARCH BLACK',
          subLabel: 'Ultra-Exclusive Private Health Club',
          gradient: 'linear-gradient(135deg, #09090B 0%, #18181B 40%, #27272A 70%, #09090B 100%)',
          accentColor: '#F59E0B',
          borderColor: 'rgba(245, 158, 11, 0.4)',
          textColor: '#FFFFFF',
          nextTier: null,
          badgeIcon: '👑'
        };
      case 'PLATINUM':
        return {
          label: 'DOCSEARCH PLATINUM',
          subLabel: 'Priority Family Care & Concierge',
          gradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #334155 70%, #0F172A 100%)',
          accentColor: '#38BDF8',
          borderColor: 'rgba(56, 189, 248, 0.4)',
          textColor: '#FFFFFF',
          nextTier: 'BLACK' as const,
          badgeIcon: '💎'
        };
      case 'GOLD':
        return {
          label: 'DOCSEARCH GOLD',
          subLabel: 'Preferred Healthcare Privilege',
          gradient: 'linear-gradient(135deg, #451A03 0%, #78350F 50%, #B45309 100%)',
          accentColor: '#FBBF24',
          borderColor: 'rgba(251, 191, 36, 0.4)',
          textColor: '#FFFFFF',
          nextTier: 'PLATINUM' as const,
          badgeIcon: '⭐'
        };
      default:
        return {
          label: 'DOCSEARCH SILVER',
          subLabel: 'Standard Wellness Membership',
          gradient: 'linear-gradient(135deg, #1E293B 0%, #334155 50%, #475569 100%)',
          accentColor: '#94A3B8',
          borderColor: 'rgba(148, 163, 184, 0.3)',
          textColor: '#FFFFFF',
          nextTier: 'GOLD' as const,
          badgeIcon: '🛡️'
        };
    }
  };

  const meta = getTierMetadata(currentTier);
  const progressPct = meta.nextTier
    ? Math.min(100, Math.round((currentTierSpend / nextTierSpendThreshold) * 100))
    : 100;

  const privileges = [
    { icon: '⚡', title: 'Zero Waiting OPD', desc: 'Direct chamber priority token' },
    { icon: '🧪', title: 'Free Home Draws', desc: 'Unlimited NABL blood pickups' },
    { icon: '💬', title: 'WhatsApp Concierge', desc: '24/7 dedicated doctor on chat' },
    { icon: '💊', title: 'Flat 20% Off', desc: 'Jan Aushadhi & Diagnostic tests' }
  ];

  return (
    <div
      role="region"
      aria-label="Health Club Tier and Privileges"
      style={{
        background: meta.gradient,
        border: `1px solid ${meta.borderColor}`,
        borderRadius: '24px',
        padding: '20px',
        color: meta.textColor,
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(56, 189, 248, 0.1)',
        position: 'relative',
        overflow: 'hidden',
        margin: '10px 0'
      }}
    >
      {/* Metallic gleam diagonal stripe */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'linear-gradient(60deg, transparent 40%, rgba(255, 255, 255, 0.06) 50%, transparent 60%)',
          pointerEvents: 'none'
        }}
      />

      {/* Card Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>{meta.badgeIcon}</span>
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 900,
                letterSpacing: '0.08em',
                color: meta.accentColor
              }}
            >
              {meta.label}
            </span>
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>
            {meta.subLabel}
          </div>
        </div>

        {/* Embossed Chip & Expiry */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '0.8125rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              color: meta.accentColor
            }}
          >
            {membershipId}
          </div>
          <div style={{ fontSize: '0.625rem', color: '#94A3B8', marginTop: '2px' }}>
            VALID THRU: {validThroughDate}
          </div>
        </div>
      </div>

      {/* Patient Name */}
      <div style={{ marginBottom: '16px' }}>
        <span style={{ fontSize: '0.6875rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Cardholder
        </span>
        <div style={{ fontSize: '1.125rem', fontWeight: 800, letterSpacing: '0.02em', color: '#FFFFFF' }}>
          {patientName}
        </div>
      </div>

      {/* 4-Item VIP Privilege Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          marginBottom: '18px'
        }}
      >
        {privileges.map((item, idx) => (
          <div
            key={idx}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '8px 10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ fontSize: '1.125rem' }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF' }}>
                {item.title}
              </div>
              <div style={{ fontSize: '0.625rem', color: '#94A3B8', lineHeight: 1.1 }}>
                {item.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress to Next Tier */}
      {meta.nextTier && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', marginBottom: '6px' }}>
            <span style={{ color: '#94A3B8' }}>
              Progress to <strong>{meta.nextTier}</strong> Tier:
            </span>
            <span style={{ fontWeight: 800, color: meta.accentColor }}>
              ₹{currentTierSpend.toLocaleString('en-IN')} / ₹{nextTierSpendThreshold.toLocaleString('en-IN')} ({progressPct}%)
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                background: `linear-gradient(90deg, #38BDF8 0%, ${meta.accentColor} 100%)`,
                borderRadius: '3px',
                transition: 'width 0.8s ease'
              }}
            />
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={onExplorePrivileges}
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '9px 12px',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          Explore All Privileges ➔
        </button>

        {meta.nextTier && onUpgradeTier && (
          <button
            type="button"
            onClick={onUpgradeTier}
            style={{
              backgroundColor: meta.accentColor,
              color: '#09090B',
              border: 'none',
              borderRadius: '12px',
              padding: '9px 14px',
              fontSize: '0.75rem',
              fontWeight: 900,
              cursor: 'pointer'
            }}
          >
            Instant Upgrade 👑
          </button>
        )}
      </div>
    </div>
  );
};
