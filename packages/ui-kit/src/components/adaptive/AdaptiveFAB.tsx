import React, { useState } from 'react';

export interface FABAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string | undefined;
}

export interface AdaptiveFABProps {
  icon: React.ReactNode;
  label?: string | undefined;
  onClick?: () => void | undefined;
  variant?: 'standard' | 'small' | 'extended' | undefined;
  color?: 'primary' | 'secondary' | 'surface' | 'danger' | undefined;
  actions?: FABAction[] | undefined;
  ariaLabel?: string | undefined;
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
}

export const AdaptiveFAB: React.FC<AdaptiveFABProps> = ({
  icon,
  label,
  onClick,
  variant = 'standard',
  color = 'primary',
  actions,
  ariaLabel = 'Floating Action Button',
  className = '',
  style = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasSpeedDial = Boolean(actions && actions.length > 0);

  const handleMainClick = () => {
    if (hasSpeedDial) {
      setIsOpen((prev) => !prev);
    } else {
      onClick?.();
    }
  };

  const colorStyles: Record<'primary' | 'secondary' | 'surface' | 'danger', { bg: string; text: string }> = {
    primary: {
      bg: 'var(--ds-color-primary, #0284C7)',
      text: '#FFFFFF'
    },
    secondary: {
      bg: 'var(--ds-surface-container-high, #1E293B)',
      text: '#F8FAFC'
    },
    surface: {
      bg: 'var(--ds-surface-container-highest, #334155)',
      text: '#F8FAFC'
    },
    danger: {
      bg: 'var(--ds-color-danger, #EF4444)',
      text: '#FFFFFF'
    }
  };

  const activeColor = colorStyles[color || 'primary'];

  const sizeStyles: Record<'standard' | 'small' | 'extended', React.CSSProperties> = {
    small: {
      width: '40px',
      height: '40px',
      borderRadius: '12px',
      fontSize: '1.1rem'
    },
    standard: {
      width: '56px',
      height: '56px',
      borderRadius: '16px',
      fontSize: '1.4rem'
    },
    extended: {
      minWidth: '56px',
      height: '48px',
      borderRadius: '24px',
      padding: '0 20px',
      fontSize: '0.875rem'
    }
  };

  const activeSize = sizeStyles[variant || 'standard'];

  return (
    <div
      className={`ds-adaptive-fab-wrapper ${className}`}
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '20px',
        zIndex: 850,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '12px',
        pointerEvents: 'none',
        ...style
      }}
    >
      {/* Speed Dial Action Items */}
      {hasSpeedDial && isOpen && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '10px',
            marginBottom: '4px',
            pointerEvents: 'auto'
          }}
        >
          {actions?.map((act) => (
            <div
              key={act.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span
                style={{
                  backgroundColor: 'rgba(18, 24, 38, 0.9)',
                  backdropFilter: 'blur(12px)',
                  color: '#F8FAFC',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  whiteSpace: 'nowrap'
                }}
              >
                {act.label}
              </span>
              <button
                type="button"
                onClick={() => {
                  act.onClick();
                  setIsOpen(false);
                }}
                className="ds-touch-target ds-state-layer"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: act.color || 'var(--ds-surface-container-high, #1E293B)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  boxShadow: 'var(--ds-elevation-3, 0 4px 12px rgba(0, 0, 0, 0.35))',
                  transition: 'transform 160ms cubic-bezier(0.2, 0, 0, 1)'
                }}
              >
                {act.icon}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        type="button"
        onClick={handleMainClick}
        className="ds-touch-target ds-state-layer"
        aria-label={ariaLabel}
        style={{
          ...activeSize,
          backgroundColor: activeColor.bg,
          color: activeColor.text,
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
          boxShadow: isOpen
            ? 'var(--ds-elevation-5, 0 8px 24px rgba(0, 0, 0, 0.45))'
            : 'var(--ds-elevation-3, 0 4px 14px rgba(0, 0, 0, 0.35))',
          pointerEvents: 'auto',
          transition: 'transform 200ms cubic-bezier(0.2, 0, 0, 1), box-shadow 200ms cubic-bezier(0.2, 0, 0, 1)'
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: hasSpeedDial && isOpen ? 'rotate(45deg)' : 'none',
            transition: 'transform 200ms cubic-bezier(0.2, 0, 0, 1)'
          }}
        >
          {icon}
        </span>
        {variant === 'extended' && label && (
          <span style={{ fontWeight: 600, letterSpacing: '0.01em' }}>{label}</span>
        )}
      </button>
    </div>
  );
};
