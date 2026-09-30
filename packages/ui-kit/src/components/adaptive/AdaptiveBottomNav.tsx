import React from 'react';

export interface BottomNavDestination {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number | undefined;
  onClick?: () => void;
}

export interface AdaptiveBottomNavProps {
  destinations: BottomNavDestination[];
  activeId: string;
  onChange?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const AdaptiveBottomNav: React.FC<AdaptiveBottomNavProps> = ({
  destinations,
  activeId,
  onChange,
  className = '',
  style = {}
}) => {
  return (
    <nav
      className={`ds-adaptive-bottom-nav ${className}`}
      aria-label="Bottom Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: 'var(--ds-surface-container-high, rgba(18, 24, 38, 0.96))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 8px',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 900,
        boxShadow: 'var(--ds-elevation-3, 0 -3px 12px rgba(0, 0, 0, 0.3))',
        ...style
      }}
    >
      {destinations.map((dest) => {
        const isActive = dest.id === activeId;

        return (
          <button
            key={dest.id}
            type="button"
            className="ds-touch-target ds-state-layer"
            onClick={() => {
              dest.onClick?.();
              onChange?.(dest.id);
            }}
            style={{
              flex: 1,
              maxWidth: '96px',
              height: '52px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
              color: isActive ? 'var(--ds-color-primary, #38BDF8)' : 'var(--ds-color-text-secondary, #94A3B8)',
              transition: 'color 160ms cubic-bezier(0.2, 0, 0, 1)'
            }}
            aria-selected={isActive}
            aria-label={dest.label}
          >
            {/* Active Pill Indicator */}
            <div
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px 18px',
                borderRadius: '16px',
                backgroundColor: isActive
                  ? 'var(--ds-color-primary-subtle, rgba(2, 132, 199, 0.2))'
                  : 'transparent',
                transition: 'background-color 200ms cubic-bezier(0.2, 0, 0, 1)',
                fontSize: '1.2rem'
              }}
            >
              {dest.icon}

              {/* Badge */}
              {dest.badge !== undefined && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '8px',
                    backgroundColor: 'var(--ds-color-danger, #EF4444)',
                    color: '#FFFFFF',
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    minWidth: '16px',
                    height: '16px',
                    borderRadius: '8px',
                    padding: '0 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                  }}
                >
                  {dest.badge}
                </span>
              )}
            </div>

            {/* Label */}
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '0.01em',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '80px'
              }}
            >
              {dest.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
