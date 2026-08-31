import React from 'react';

export type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant | undefined;
  icon?: React.ReactNode | undefined;
}

const badgeStyles: Record<BadgeVariant, React.CSSProperties> = {
  neutral: {
    backgroundColor: 'var(--ds-color-surface-subtle)',
    color: 'var(--ds-color-text-secondary)',
    borderColor: 'var(--ds-color-border)'
  },
  primary: {
    backgroundColor: 'var(--ds-color-primary-subtle)',
    color: 'var(--ds-color-primary)',
    borderColor: 'var(--ds-color-primary)'
  },
  success: {
    backgroundColor: 'var(--ds-color-success-subtle)',
    color: 'var(--ds-color-success)',
    borderColor: 'var(--ds-color-success)'
  },
  warning: {
    backgroundColor: 'var(--ds-color-warning-subtle)',
    color: 'var(--ds-color-warning)',
    borderColor: 'var(--ds-color-warning)'
  },
  danger: {
    backgroundColor: 'var(--ds-color-danger-subtle)',
    color: 'var(--ds-color-danger)',
    borderColor: 'var(--ds-color-danger)'
  }
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  icon,
  className = '',
  style,
  ...props
}) => {
  return (
    <span
      className={`ds-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.75rem',
        fontWeight: '600',
        padding: '2px 8px',
        borderRadius: '9999px',
        borderWidth: '1px',
        borderStyle: 'solid',
        lineHeight: '1.25',
        ...badgeStyles[variant],
        ...style
      }}
      {...props}
    >
      {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
