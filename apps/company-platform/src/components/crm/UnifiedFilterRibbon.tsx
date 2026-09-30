import React from 'react';

export type UnifiedPartnerFilterType = 'ALL' | 'KYC_PENDING' | 'FREE' | 'ENTERPRISE_PRO';

export interface UnifiedFilterRibbonProps {
  activeFilter: UnifiedPartnerFilterType;
  counts: {
    all: number;
    kycPending: number;
    free: number;
    enterprisePro: number;
  };
  onSelectFilter: (filter: UnifiedPartnerFilterType) => void;
  style?: React.CSSProperties;
}

export const UnifiedFilterRibbon: React.FC<UnifiedFilterRibbonProps> = ({
  activeFilter,
  counts,
  onSelectFilter,
  style
}) => {
  const pills = [
    {
      id: 'ALL' as const,
      label: 'All',
      icon: '📋',
      count: counts.all,
      activeColor: '#38BDF8',
      activeBg: 'rgba(56, 189, 248, 0.2)',
      activeBorder: '#38BDF8'
    },
    {
      id: 'KYC_PENDING' as const,
      label: 'KYC Pending',
      icon: '⏳',
      count: counts.kycPending,
      activeColor: '#FCD34D',
      activeBg: 'rgba(245, 158, 11, 0.2)',
      activeBorder: '#F59E0B'
    },
    {
      id: 'FREE' as const,
      label: 'Hospital Free Tier',
      icon: '🟢',
      count: counts.free,
      activeColor: '#34D399',
      activeBg: 'rgba(16, 185, 129, 0.2)',
      activeBorder: '#10B981'
    },
    {
      id: 'ENTERPRISE_PRO' as const,
      label: 'Enterprise Pro',
      icon: '🟣',
      count: counts.enterprisePro,
      activeColor: '#C084FC',
      activeBg: 'rgba(168, 85, 247, 0.2)',
      activeBorder: '#A855F7'
    }
  ];

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: '#070C16',
        border: '1px solid #1E293B',
        borderRadius: '10px',
        padding: '3px',
        gap: '4px',
        flexWrap: 'wrap',
        ...style
      }}
    >
      {pills.map((pill) => {
        const isActive = activeFilter === pill.id;
        return (
          <button
            key={pill.id}
            type="button"
            onClick={() => onSelectFilter(pill.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '7px',
              border: `1px solid ${isActive ? pill.activeBorder : 'transparent'}`,
              backgroundColor: isActive ? pill.activeBg : 'transparent',
              color: isActive ? pill.activeColor : '#94A3B8',
              fontSize: '0.78rem',
              fontWeight: isActive ? 800 : 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#F1F5F9';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#94A3B8';
              }
            }}
          >
            <span>{pill.icon}</span>
            <span>{pill.label}</span>
            <span
              style={{
                backgroundColor: isActive ? pill.activeColor : '#1E293B',
                color: isActive ? '#06101E' : '#94A3B8',
                fontSize: '0.6875rem',
                fontWeight: 900,
                padding: '1px 6px',
                borderRadius: '999px',
                marginLeft: '2px'
              }}
            >
              {pill.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
