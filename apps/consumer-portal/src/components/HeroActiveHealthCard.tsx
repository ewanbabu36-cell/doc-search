import React from 'react';

export interface HeroActiveHealthCardProps {
  patientName: string;
  uhid: string;
  // Circular ring metrics
  healthPassTitle?: string;
  validityDaysLeft?: number;
  totalValidityDays?: number;
  adherenceRatePct?: number; // 0 to 100
  ringMode?: 'VALIDITY' | 'ADHERENCE';
  // Up-next milestone metrics
  upNextMilestone?: {
    doctorName: string;
    department: string;
    chamberNumber: string;
    patientTokenNumber: string;
    currentRunningToken: string;
    estimatedWaitMinutes: number;
    opdStatus: 'CONSULTING' | 'WAITING' | 'UPCOMING' | 'COMPLETED';
  };
  onManagePass?: () => void;
  onViewDirections?: () => void;
  onRefreshQueue?: () => void;
  isDarkMode?: boolean;
}

export const HeroActiveHealthCard: React.FC<HeroActiveHealthCardProps> = ({
  patientName,
  uhid,
  healthPassTitle = 'DocSearch Family Health Shield',
  validityDaysLeft = 248,
  totalValidityDays = 365,
  adherenceRatePct = 92,
  ringMode = 'VALIDITY',
  upNextMilestone = {
    doctorName: 'Dr. Vivek Sharma',
    department: 'General Surgery & OPD',
    chamberNumber: 'Chamber 04 (1st Floor)',
    patientTokenNumber: '#18',
    currentRunningToken: '#14',
    estimatedWaitMinutes: 12,
    opdStatus: 'CONSULTING'
  },
  onManagePass,
  onViewDirections,
  onRefreshQueue,
  isDarkMode = true
}) => {
  // SVG Circular Ring Calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const progressRatio =
    ringMode === 'VALIDITY'
      ? Math.max(0, Math.min(1, validityDaysLeft / totalValidityDays))
      : Math.max(0, Math.min(1, adherenceRatePct / 100));
  const strokeDashoffset = circumference - progressRatio * circumference;

  const bgGradient = isDarkMode
    ? 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)'
    : 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 50%, #F8FAFC 100%)';

  const textColor = isDarkMode ? '#F8FAFC' : '#0F172A';
  const subTextColor = isDarkMode ? '#94A3B8' : '#475569';
  const cardBorder = isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(99, 102, 241, 0.2)';

  return (
    <div
      role="region"
      aria-label="Active Health Status and Live Milestone"
      style={{
        background: bgGradient,
        borderRadius: '24px',
        padding: '20px',
        color: textColor,
        border: cardBorder,
        boxShadow: isDarkMode
          ? '0 12px 36px -4px rgba(15, 23, 42, 0.8), 0 0 20px rgba(99, 102, 241, 0.15)'
          : '0 12px 30px -4px rgba(99, 102, 241, 0.12)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Decorative ambient flare */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* Top Section: Active Snapshot Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 900
              }}
            >
              ✓
            </span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#10B981' }}>
              ACTIVE CARE PASS
            </span>
          </div>
          <h2 style={{ margin: '4px 0 0 0', fontSize: '1.125rem', fontWeight: 800, color: textColor }}>
            {healthPassTitle}
          </h2>
          <div style={{ fontSize: '0.75rem', color: subTextColor, marginTop: '2px' }}>
            Patient: <strong style={{ color: textColor }}>{patientName}</strong> • UHID: {uhid}
          </div>
        </div>

        {/* Circular SVG Progress Ring */}
        <div style={{ position: 'relative', width: '92px', height: '92px', flexShrink: 0 }}>
          <svg width="92" height="92" viewBox="0 0 92 92" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background circle track */}
            <circle
              cx="46"
              cy="46"
              r={radius}
              fill="transparent"
              stroke={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.15)'}
              strokeWidth="7"
            />
            {/* Active progress stroke */}
            <circle
              cx="46"
              cy="46"
              r={radius}
              fill="transparent"
              stroke="url(#activeMetricGradient)"
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
            <defs>
              <linearGradient id="activeMetricGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4F46E5" />
                <stop offset="50%" stopColor="#818CF8" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
          </svg>
          {/* Centered Ring Text */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}
          >
            <span style={{ fontSize: '1rem', fontWeight: 900, lineHeight: 1, color: textColor }}>
              {ringMode === 'VALIDITY' ? validityDaysLeft : `${adherenceRatePct}%`}
            </span>
            <span style={{ fontSize: '0.625rem', fontWeight: 700, color: subTextColor, marginTop: '2px' }}>
              {ringMode === 'VALIDITY' ? 'DAYS LEFT' : 'DOSES TAKEN'}
            </span>
          </div>
        </div>
      </div>

      {/* Up-Next Milestone: Live OPD Chamber Queue Snapshot */}
      {upNextMilestone && (
        <div
          style={{
            backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            padding: '14px 16px',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(99, 102, 241, 0.15)',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  boxShadow: '0 0 10px #10B981',
                  display: 'inline-block',
                  animation: 'docsearchPulse 2s infinite'
                }}
              />
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#10B981', letterSpacing: '0.04em' }}>
                LIVE OPD QUEUE RUNNING
              </span>
            </div>
            {onRefreshQueue && (
              <button
                type="button"
                onClick={onRefreshQueue}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#818CF8',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                🔄 Refresh
              </button>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: textColor }}>
                {upNextMilestone.doctorName}
              </div>
              <div style={{ fontSize: '0.75rem', color: subTextColor, marginTop: '1px' }}>
                {upNextMilestone.department} • <strong>{upNextMilestone.chamberNumber}</strong>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    color: '#818CF8',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 800
                  }}
                >
                  Your: {upNextMilestone.patientTokenNumber}
                </span>
                <span
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    color: '#34D399',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 800
                  }}
                >
                  Now: {upNextMilestone.currentRunningToken}
                </span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#F59E0B', fontWeight: 700, marginTop: '4px' }}>
                ⏳ Est. Wait: ~{upNextMilestone.estimatedWaitMinutes} mins
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons Row */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="button"
          onClick={onManagePass}
          style={{
            flex: 1,
            backgroundColor: isDarkMode ? '#312E81' : '#4F46E5',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
            transition: 'transform 0.15s ease'
          }}
          onMouseDown={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(0.97)')}
          onMouseUp={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
        >
          🛡️ Manage Health Pass
        </button>

        <button
          type="button"
          onClick={onViewDirections}
          style={{
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
            color: textColor,
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          📍 Chamber Route
        </button>
      </div>

      <style>{`
        @keyframes docsearchPulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};
