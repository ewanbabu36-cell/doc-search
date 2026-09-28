import React from 'react';

export type BadgeVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'critical'
  | 'info'
  | 'active'
  | 'inactive'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'draft'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant | undefined;
  size?: BadgeSize | undefined;
  icon?: React.ReactNode | undefined;
  pulse?: boolean | undefined;
  glow?: boolean | undefined;
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
  },
  critical: {
    backgroundColor: 'var(--ds-status-critical-subtle, rgba(220, 38, 38, 0.15))',
    color: 'var(--ds-status-critical, #dc2626)',
    borderColor: 'rgba(220, 38, 38, 0.4)'
  },
  info: {
    backgroundColor: 'var(--ds-status-info-subtle, rgba(14, 165, 233, 0.15))',
    color: 'var(--ds-status-info, #0ea5e9)',
    borderColor: 'rgba(14, 165, 233, 0.4)'
  },
  active: {
    backgroundColor: 'var(--ds-status-active-subtle, rgba(2, 132, 199, 0.15))',
    color: 'var(--ds-status-active, #0284c7)',
    borderColor: 'rgba(2, 132, 199, 0.4)'
  },
  inactive: {
    backgroundColor: 'var(--ds-status-inactive-subtle, rgba(100, 116, 139, 0.15))',
    color: 'var(--ds-status-inactive, #64748b)',
    borderColor: 'rgba(100, 116, 139, 0.3)'
  },
  pending: {
    backgroundColor: 'var(--ds-status-pending-subtle, rgba(245, 158, 11, 0.15))',
    color: 'var(--ds-status-pending, #f59e0b)',
    borderColor: 'rgba(245, 158, 11, 0.4)'
  },
  approved: {
    backgroundColor: 'var(--ds-status-approved-subtle, rgba(16, 185, 129, 0.15))',
    color: 'var(--ds-status-approved, #10b981)',
    borderColor: 'rgba(16, 185, 129, 0.4)'
  },
  rejected: {
    backgroundColor: 'var(--ds-status-rejected-subtle, rgba(239, 68, 68, 0.15))',
    color: 'var(--ds-status-rejected, #ef4444)',
    borderColor: 'rgba(239, 68, 68, 0.4)'
  },
  draft: {
    backgroundColor: 'var(--ds-status-draft-subtle, rgba(148, 163, 184, 0.15))',
    color: 'var(--ds-status-draft, #94a3b8)',
    borderColor: 'rgba(148, 163, 184, 0.3)'
  },
  processing: {
    backgroundColor: 'var(--ds-status-processing-subtle, rgba(14, 165, 233, 0.15))',
    color: 'var(--ds-status-processing, #0ea5e9)',
    borderColor: 'rgba(14, 165, 233, 0.4)'
  },
  completed: {
    backgroundColor: 'var(--ds-status-completed-subtle, rgba(16, 185, 129, 0.15))',
    color: 'var(--ds-status-completed, #10b981)',
    borderColor: 'rgba(16, 185, 129, 0.4)'
  },
  failed: {
    backgroundColor: 'var(--ds-status-failed-subtle, rgba(239, 68, 68, 0.15))',
    color: 'var(--ds-status-failed, #ef4444)',
    borderColor: 'rgba(239, 68, 68, 0.4)'
  },
  expired: {
    backgroundColor: 'var(--ds-status-expired-subtle, rgba(100, 116, 139, 0.15))',
    color: 'var(--ds-status-expired, #64748b)',
    borderColor: 'rgba(100, 116, 139, 0.3)'
  }
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  pulse = false,
  glow = false,
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
        gap: '5px',
        fontSize: size === 'sm' ? '0.6875rem' : '0.725rem',
        fontWeight: 700,
        padding: size === 'sm' ? '1px 6px' : '2px 8px',
        borderRadius: '9999px',
        borderWidth: '1px',
        borderStyle: 'solid',
        lineHeight: '1.25',
        letterSpacing: '0.02em',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: glow ? '0 0 10px currentColor' : undefined,
        ...badgeStyles[variant],
        ...style
      }}
      {...props}
    >
      {pulse && (
        <span
          className="ds-pulse-indicator"
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            boxShadow: '0 0 6px currentColor'
          }}
        />
      )}
      {icon}
      {children}
    </span>
  );
};
