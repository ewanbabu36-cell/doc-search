import React, { useState } from 'react';

export type ElevationLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface AdaptiveCardProps {
  title?: React.ReactNode | undefined;
  subtitle?: React.ReactNode | undefined;
  icon?: React.ReactNode | undefined;
  badge?: React.ReactNode | undefined;
  elevation?: ElevationLevel | undefined;
  isExpandable?: boolean | undefined;
  defaultExpanded?: boolean | undefined;
  headerActions?: React.ReactNode | undefined;
  footerActions?: React.ReactNode | undefined;
  children: React.ReactNode;
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
  onClick?: () => void | undefined;
}

export const AdaptiveCard: React.FC<AdaptiveCardProps> = ({
  title,
  subtitle,
  icon,
  badge,
  elevation = 1,
  isExpandable = false,
  defaultExpanded = true,
  headerActions,
  footerActions,
  children,
  className = '',
  style = {},
  onClick
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const elevationMap: Record<ElevationLevel, { shadow: string; surface: string }> = {
    0: {
      shadow: 'none',
      surface: 'var(--ds-surface-container-lowest, rgba(14, 18, 28, 0.6))'
    },
    1: {
      shadow: 'var(--ds-elevation-1, 0 1px 3px rgba(0, 0, 0, 0.2))',
      surface: 'var(--ds-surface-container-low, rgba(18, 24, 38, 0.75))'
    },
    2: {
      shadow: 'var(--ds-elevation-2, 0 3px 8px rgba(0, 0, 0, 0.25))',
      surface: 'var(--ds-surface-container, rgba(22, 30, 46, 0.85))'
    },
    3: {
      shadow: 'var(--ds-elevation-3, 0 6px 16px rgba(0, 0, 0, 0.3))',
      surface: 'var(--ds-surface-container-high, rgba(26, 36, 56, 0.9))'
    },
    4: {
      shadow: 'var(--ds-elevation-4, 0 8px 24px rgba(0, 0, 0, 0.35))',
      surface: 'var(--ds-surface-container-high, rgba(30, 42, 64, 0.95))'
    },
    5: {
      shadow: 'var(--ds-elevation-5, 0 12px 32px rgba(0, 0, 0, 0.4))',
      surface: 'var(--ds-surface-container-highest, rgba(34, 48, 72, 0.98))'
    }
  };

  const currentElevation = elevationMap[elevation] || elevationMap[1];

  return (
    <div
      className={`ds-adaptive-card ${className}`}
      onClick={onClick}
      style={{
        backgroundColor: currentElevation.surface,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))',
        borderRadius: '16px',
        boxShadow: currentElevation.shadow,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 200ms cubic-bezier(0.2, 0, 0, 1), transform 200ms cubic-bezier(0.2, 0, 0, 1), border-color 200ms cubic-bezier(0.2, 0, 0, 1)',
        ...style
      }}
    >
      {/* Header */}
      {(title || icon || badge || headerActions || isExpandable) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: isExpanded ? '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.05))' : 'none',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            {icon && (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--ds-color-primary-subtle, rgba(2, 132, 199, 0.15))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  flexShrink: 0
                }}
              >
                {icon}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {title && (
                  <span
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      color: 'var(--ds-color-text-primary, #F8FAFC)',
                      letterSpacing: '-0.01em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {title}
                  </span>
                )}
                {badge}
              </div>
              {subtitle && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--ds-color-text-muted, #94A3B8)',
                    marginTop: '1px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {subtitle}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {headerActions}
            {isExpandable && (
              <button
                type="button"
                className="ds-touch-target ds-state-layer"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded((prev) => !prev);
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--ds-color-text-secondary, #94A3B8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
                aria-label={isExpanded ? 'Collapse card' : 'Expand card'}
              >
                <span
                  style={{
                    transform: isExpanded ? 'rotate(180deg)' : 'none',
                    transition: 'transform 200ms cubic-bezier(0.2, 0, 0, 1)'
                  }}
                >
                  ▼
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Body */}
      {isExpanded && (
        <div style={{ padding: '16px 18px', flex: 1 }}>
          {children}
        </div>
      )}

      {/* Footer */}
      {isExpanded && footerActions && (
        <div
          style={{
            padding: '10px 18px',
            borderTop: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.05))',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
            flexWrap: 'wrap'
          }}
        >
          {footerActions}
        </div>
      )}
    </div>
  );
};
