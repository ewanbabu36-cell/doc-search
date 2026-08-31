import React from 'react';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  type?: AlertType | undefined;
  title?: React.ReactNode | undefined;
  children: React.ReactNode;
  icon?: React.ReactNode | undefined;
  onClose?: (() => void) | undefined;
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
}

const alertStyles: Record<AlertType, { bg: string; text: string; border: string }> = {
  info: {
    bg: 'var(--ds-color-surface-subtle)',
    text: 'var(--ds-color-text-primary)',
    border: 'var(--ds-color-border)'
  },
  success: {
    bg: 'var(--ds-color-success-subtle)',
    text: 'var(--ds-color-success)',
    border: 'var(--ds-color-success)'
  },
  warning: {
    bg: 'var(--ds-color-warning-subtle)',
    text: 'var(--ds-color-warning)',
    border: 'var(--ds-color-warning)'
  },
  error: {
    bg: 'var(--ds-color-danger-subtle)',
    text: 'var(--ds-color-danger)',
    border: 'var(--ds-color-danger)'
  }
};

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  icon,
  onClose,
  className = '',
  style
}) => {
  const styles = alertStyles[type];

  return (
    <div
      role="alert"
      className={`ds-alert ${className}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: styles.bg,
        borderLeft: `4px solid ${styles.border}`,
        borderRadius: '4px',
        fontSize: '0.875rem',
        ...style
      }}
    >
      {icon && <span style={{ flexShrink: 0, marginTop: '2px', color: styles.text }}>{icon}</span>}
      <div style={{ flex: '1 1 auto' }}>
        {title && <div style={{ fontWeight: '600', marginBottom: '2px', color: styles.text }}>{title}</div>}
        <div style={{ color: 'var(--ds-color-text-secondary)' }}>{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          aria-label="Dismiss alert"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            color: 'var(--ds-color-text-muted)'
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
};
