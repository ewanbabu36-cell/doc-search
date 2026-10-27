import React from 'react';

export interface QuickActionItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
  badgeTextColor?: string;
  bgGradient?: string;
  onClick: () => void;
}

export interface QuickActionGridProps {
  onActionClick?: (actionId: string) => void;
  isDarkMode?: boolean;
}

export const QuickActionGrid: React.FC<QuickActionGridProps> = ({
  onActionClick,
  isDarkMode = true
}) => {
  const actions: QuickActionItem[] = [
    {
      id: 'BOOK_OPD',
      title: 'Book OPD',
      subtitle: 'Doctor Chamber',
      icon: '🩺',
      badge: 'Zero Waiting',
      badgeColor: '#10B981',
      badgeTextColor: '#FFFFFF',
      bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)',
      onClick: () => onActionClick?.('BOOK_OPD')
    },
    {
      id: 'INSTANT_VIDEO',
      title: 'Video Consult',
      subtitle: 'Instant Connect',
      icon: '⚡',
      badge: 'Connect in 2m',
      badgeColor: '#6366F1',
      badgeTextColor: '#FFFFFF',
      bgGradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(79, 70, 229, 0.05) 100%)',
      onClick: () => onActionClick?.('INSTANT_VIDEO')
    },
    {
      id: 'JAN_AUSHADHI',
      title: 'Generic Rx',
      subtitle: 'PMBJP Jan Aushadhi',
      icon: '💊',
      badge: 'Save 75%',
      badgeColor: '#F59E0B',
      badgeTextColor: '#000000',
      bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%)',
      onClick: () => onActionClick?.('JAN_AUSHADHI')
    },
    {
      id: 'HOME_LAB_TEST',
      title: 'Blood Test',
      subtitle: 'Home Phlebotomy',
      icon: '🧪',
      badge: 'NABL Certified',
      badgeColor: '#06B6D4',
      badgeTextColor: '#FFFFFF',
      bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(8, 145, 178, 0.05) 100%)',
      onClick: () => onActionClick?.('HOME_LAB_TEST')
    },
    {
      id: 'EMERGENCY_SOS',
      title: 'Emergency SOS',
      subtitle: 'Ambulance 108',
      icon: '🚨',
      badge: 'High Priority',
      badgeColor: '#EF4444',
      badgeTextColor: '#FFFFFF',
      bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.08) 100%)',
      onClick: () => onActionClick?.('EMERGENCY_SOS')
    },
    {
      id: 'ABHA_LOCKER',
      title: 'ABHA Locker',
      subtitle: 'Govt Records',
      icon: '📂',
      badge: 'Govt Linked',
      badgeColor: '#8B5CF6',
      badgeTextColor: '#FFFFFF',
      bgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.05) 100%)',
      onClick: () => onActionClick?.('ABHA_LOCKER')
    },
    {
      id: 'CARE_PASS',
      title: 'Care Pass',
      subtitle: 'Annual Shield',
      icon: '🛡️',
      badge: '₹999/Yr',
      badgeColor: '#EC4899',
      badgeTextColor: '#FFFFFF',
      bgGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(219, 39, 119, 0.05) 100%)',
      onClick: () => onActionClick?.('CARE_PASS')
    },
    {
      id: 'SURGERY_EMI',
      title: '0% Surgery EMI',
      subtitle: 'Pre-Approved',
      icon: '🏥',
      badge: 'Instant Approval',
      badgeColor: '#10B981',
      badgeTextColor: '#FFFFFF',
      bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(4, 120, 87, 0.06) 100%)',
      onClick: () => onActionClick?.('SURGERY_EMI')
    }
  ];

  const textColor = isDarkMode ? '#F8FAFC' : '#0F172A';
  const subTextColor = isDarkMode ? '#94A3B8' : '#64748B';
  const cardBorder = isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)';

  return (
    <div
      role="region"
      aria-label="High Frequency Clinical Actions"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '10px',
        padding: '4px 0'
      }}
    >
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={action.onClick}
          style={{
            background: isDarkMode ? '#1E293B' : '#FFFFFF',
            border: cardBorder,
            borderRadius: '20px',
            padding: '12px 6px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            position: 'relative',
            cursor: 'pointer',
            minHeight: '94px',
            boxShadow: isDarkMode
              ? '0 4px 12px rgba(0, 0, 0, 0.2)'
              : '0 4px 12px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden'
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(0.94)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
          onTouchStart={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(0.94)';
          }}
          onTouchEnd={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
        >
          {/* Subtle Ambient Squircle Background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: action.bgGradient,
              opacity: 0.8,
              pointerEvents: 'none'
            }}
          />

          {/* Micro-Badge */}
          {action.badge && (
            <span
              style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                backgroundColor: action.badgeColor || '#4F46E5',
                color: action.badgeTextColor || '#FFFFFF',
                fontSize: '0.5625rem',
                fontWeight: 900,
                padding: '1px 5px',
                borderRadius: '6px',
                lineHeight: 1.2,
                boxShadow: `0 2px 6px ${action.badgeColor}40`,
                whiteSpace: 'nowrap'
              }}
            >
              {action.badge}
            </span>
          )}

          {/* Icon in Squircle Container */}
          <div
            style={{
              fontSize: '1.5rem',
              lineHeight: 1,
              marginBottom: '6px',
              zIndex: 2,
              filter: isDarkMode ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' : 'none'
            }}
          >
            {action.icon}
          </div>

          {/* Action Title */}
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: textColor,
              lineHeight: 1.2,
              zIndex: 2
            }}
          >
            {action.title}
          </span>

          {/* Action Subtitle */}
          {action.subtitle && (
            <span
              style={{
                fontSize: '0.625rem',
                color: subTextColor,
                marginTop: '2px',
                lineHeight: 1.1,
                zIndex: 2
              }}
            >
              {action.subtitle}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
