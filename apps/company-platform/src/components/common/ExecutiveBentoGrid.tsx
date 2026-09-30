import React from 'react';

export interface ExecutiveBentoGridProps {
  activeHospitals?: number;
  onlineHospitals?: number;
  offlineHospitals?: number;
  platformGmv?: string;
  settledToday?: string;
  bedOccupancyPercent?: number;
  occupiedBeds?: number;
  totalBeds?: number;
  criticalIcuBeds?: number;
  abdmTokensCount?: string;
  abdmTokensPerHour?: string;
  kycQueueCount?: number;
  systemHealth?: string;
  onKpiClick?: (kpiId: 'hospitals' | 'gmv' | 'beds' | 'abdm' | 'kyc' | 'health') => void;
}

export const ExecutiveBentoGrid: React.FC<ExecutiveBentoGridProps> = ({
  activeHospitals = 48,
  onlineHospitals = 42,
  offlineHospitals = 6,
  platformGmv = '₹2.48 Cr',
  settledToday = '₹18.4L',
  bedOccupancyPercent = 84.2,
  occupiedBeds = 1248,
  totalBeds = 1480,
  criticalIcuBeds = 38,
  abdmTokensCount = '142.8k',
  abdmTokensPerHour = '12.4k/hr',
  kycQueueCount: _kycQueueCount = 12,
  systemHealth: _systemHealth = '99.98%',
  onKpiClick
}) => {
  const cards = [
    // 1. 🏥 Active Hospitals Pulse (Online/Offline)
    {
      id: 'hospitals' as const,
      title: 'Active Hospitals Pulse',
      value: `${activeHospitals} Active`,
      subtext: `${onlineHospitals} Connected • ${offlineHospitals} Syncing • 98.4% uptime pulse`,
      trend: '+18% MoM',
      trendColor: '#38BDF8',
      trendBg: 'rgba(56, 189, 248, 0.15)',
      icon: '🏥',
      iconBg: 'rgba(14, 165, 233, 0.18)',
      iconColor: '#38BDF8',
      borderColor: 'rgba(56, 189, 248, 0.25)',
      accentColor: '#38BDF8',
      liveBadge: (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.6875rem',
            color: '#34D399',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '2px 7px',
            borderRadius: '999px',
            fontWeight: 800
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 6px #10B981',
              animation: 'dsPulseBeacon 1.8s infinite ease-in-out'
            }}
          />
          <span>{onlineHospitals} Online</span>
        </span>
      ),
      sparkline: (
        <svg width="100%" height="36" viewBox="0 0 160 36" preserveAspectRatio="none" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="bentoSparkBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d="M 0 30 Q 30 18, 60 22 T 110 14 T 160 4 L 160 36 L 0 36 Z" fill="url(#bentoSparkBlue)" />
          <path d="M 0 30 Q 30 18, 60 22 T 110 14 T 160 4" fill="none" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )
    },

    // 2. 💳 Platform GMV & Instant Settlement
    {
      id: 'gmv' as const,
      title: 'Platform GMV & Settlement',
      value: platformGmv,
      subtext: `${settledToday} Settled Today • T+0 Escrow Split`,
      trend: '+24% YoY',
      trendColor: '#34D399',
      trendBg: 'rgba(16, 185, 129, 0.15)',
      icon: '💳',
      iconBg: 'rgba(16, 185, 129, 0.18)',
      iconColor: '#34D399',
      borderColor: 'rgba(16, 185, 129, 0.25)',
      accentColor: '#10B981',
      liveBadge: (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.6875rem',
            color: '#34D399',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '2px 7px',
            borderRadius: '999px',
            fontWeight: 800
          }}
        >
          <span>⚡ Instant UPI</span>
        </span>
      ),
      sparkline: (
        <svg width="100%" height="36" viewBox="0 0 160 36" preserveAspectRatio="none" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="bentoSparkGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d="M 0 32 Q 35 20, 70 16 T 120 20 T 160 2 L 160 36 L 0 36 Z" fill="url(#bentoSparkGreen)" />
          <path d="M 0 32 Q 35 20, 70 16 T 120 20 T 160 2" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )
    },

    // 3. 🚨 National Emergency Bed Occupancy
    {
      id: 'beds' as const,
      title: 'National Bed Occupancy',
      value: `${bedOccupancyPercent}%`,
      subtext: `${occupiedBeds.toLocaleString()} / ${totalBeds.toLocaleString()} Beds • ${totalBeds - occupiedBeds} Available`,
      trend: `${criticalIcuBeds} ICU Low`,
      trendColor: '#F87171',
      trendBg: 'rgba(239, 68, 68, 0.15)',
      icon: '🚨',
      iconBg: 'rgba(239, 68, 68, 0.18)',
      iconColor: '#F87171',
      borderColor: 'rgba(239, 68, 68, 0.25)',
      accentColor: '#EF4444',
      liveBadge: (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.6875rem',
            color: '#F87171',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '2px 7px',
            borderRadius: '999px',
            fontWeight: 800
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#EF4444',
              boxShadow: '0 0 6px #EF4444',
              animation: 'dsPulseBeacon 1.2s infinite ease-in-out'
            }}
          />
          <span>ICU Alert</span>
        </span>
      ),
      sparkline: (
        <svg width="100%" height="36" viewBox="0 0 160 36" preserveAspectRatio="none" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="bentoSparkRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d="M 0 20 Q 40 32, 80 14 T 125 26 T 160 8 L 160 36 L 0 36 Z" fill="url(#bentoSparkRed)" />
          <path d="M 0 20 Q 40 32, 80 14 T 125 26 T 160 8" fill="none" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )
    },

    // 4. ⚡ Real-Time ABDM Token Transactions
    {
      id: 'abdm' as const,
      title: 'ABDM Token Transactions',
      value: abdmTokensCount,
      subtext: `${abdmTokensPerHour} Scan & Share • 0.02s Auth SLA`,
      trend: '+42% Growth',
      trendColor: '#C084FC',
      trendBg: 'rgba(168, 85, 247, 0.15)',
      icon: '⚡',
      iconBg: 'rgba(168, 85, 247, 0.18)',
      iconColor: '#C084FC',
      borderColor: 'rgba(168, 85, 247, 0.25)',
      accentColor: '#A855F7',
      liveBadge: (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.6875rem',
            color: '#C084FC',
            backgroundColor: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            padding: '2px 7px',
            borderRadius: '999px',
            fontWeight: 800
          }}
        >
          <span>Milestone 3</span>
        </span>
      ),
      sparkline: (
        <svg width="100%" height="36" viewBox="0 0 160 36" preserveAspectRatio="none" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="bentoSparkPurple" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A855F7" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d="M 0 24 Q 30 14, 60 20 T 105 10 T 160 4 L 160 36 L 0 36 Z" fill="url(#bentoSparkPurple)" />
          <path d="M 0 24 Q 30 14, 60 20 T 105 10 T 160 4" fill="none" stroke="#A855F7" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )
    }
  ];

  return (
    <>
      <style>{`
        @keyframes dsPulseBeacon {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
      `}</style>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '12px',
          width: '100%',
          marginBottom: '16px'
        }}
      >
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => onKpiClick?.(card.id as any)}
            style={{
              backgroundColor: '#0A101D',
              backgroundImage: 'linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 100%)',
              border: `1px solid ${card.borderColor}`,
              borderRadius: '12px',
              padding: '14px 16px 10px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
              cursor: onKpiClick ? 'pointer' : 'default',
              transition: 'all 0.18s ease-in-out',
              overflow: 'hidden',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 8px 24px ${card.accentColor}22`;
              e.currentTarget.style.borderColor = card.accentColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.35)';
              e.currentTarget.style.borderColor = card.borderColor;
            }}
          >
            {/* Top Header Row: Icon, Title & Live Indicator Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: card.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem'
                  }}
                >
                  {card.icon}
                </div>
                <span style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 600 }}>
                  {card.title}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {card.liveBadge}
                <span
                  style={{
                    fontSize: '0.6875rem',
                    color: card.trendColor,
                    backgroundColor: card.trendBg,
                    padding: '2px 7px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                >
                  <span>{card.trend}</span>
                  <span>↗</span>
                </span>
              </div>
            </div>

            {/* Metric Value & Context Subtitle */}
            <div>
              <div
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 900,
                  color: '#F8FAFC',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1
                }}
              >
                {card.value}
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: '#64748B',
                  marginTop: '4px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {card.subtext}
              </div>
            </div>

            {/* Sparkline Graphic Strip */}
            <div style={{ marginTop: '10px', height: '36px', width: '100%' }}>
              {card.sparkline}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
