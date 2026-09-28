import React from 'react';
import { Skeleton } from '../feedback/skeleton';

export type CardVariant =
  | 'surface'
  | 'glass'
  | 'elevated'
  | 'alert'
  | 'interactive'
  | 'metric'
  | 'dashboard'
  | 'warning';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode | undefined;
  subtitle?: React.ReactNode | undefined;
  actions?: React.ReactNode | undefined;
  footer?: React.ReactNode | undefined;
  padding?: 'none' | 'sm' | 'md' | 'lg' | undefined;
  hoverable?: boolean | undefined;
  variant?: CardVariant | undefined;
  isSelected?: boolean | undefined;
  isLoading?: boolean | undefined;
  overflow?: 'hidden' | 'visible' | 'auto' | undefined;
}

const paddingMap = {
  none: '0',
  sm: '12px',
  md: '20px',
  lg: '28px'
};

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  actions,
  footer,
  padding = 'md',
  hoverable = false,
  variant = 'surface',
  isSelected = false,
  isLoading = false,
  overflow = 'hidden',
  children,
  className = '',
  style,
  ...props
}) => {
  const isInteractive = hoverable || variant === 'interactive';
  const variantClass =
    variant === 'glass'
      ? 'ds-glass-card ds-surface-l3'
      : variant === 'elevated'
      ? 'ds-surface-l4'
      : variant === 'alert'
      ? 'ds-surface-l5'
      : variant === 'warning'
      ? 'ds-surface-l3'
      : 'ds-surface-l3';

  return (
    <div
      className={`ds-card ${variantClass} ${isInteractive ? 'ds-spotlight-card ds-interactive' : ''} ${className}`}
      data-card="true"
      style={{
        backgroundColor: variant === 'alert'
          ? 'rgba(239, 68, 68, 0.1)'
          : variant === 'warning'
          ? 'var(--ds-status-warning-subtle, rgba(245, 158, 11, 0.1))'
          : variant === 'glass'
          ? 'var(--ds-surface-glass, rgba(18, 24, 38, 0.75))'
          : variant === 'elevated'
          ? 'var(--ds-surface-glass-elevated, rgba(24, 34, 52, 0.9))'
          : 'var(--ds-color-surface)',
        border: isSelected
          ? '1px solid var(--ds-color-primary, #0284c7)'
          : variant === 'alert'
          ? '1px solid rgba(239, 68, 68, 0.4)'
          : variant === 'warning'
          ? '1px solid rgba(245, 158, 11, 0.4)'
          : '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))',
        borderRadius: '16px',
        boxShadow: isSelected
          ? '0 0 0 1px var(--ds-color-primary, #0284c7), var(--ds-shadow-md)'
          : variant === 'elevated'
          ? 'var(--ds-shadow-lg), var(--ds-specular-edge, inset 0 1px 0 0 rgba(255, 255, 255, 0.12))'
          : 'var(--ds-shadow-base), var(--ds-specular-edge, inset 0 1px 0 0 rgba(255, 255, 255, 0.1))',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        display: 'flex',
        flexDirection: 'column',
        overflow,
        position: 'relative',
        cursor: isInteractive ? 'pointer' : undefined,
        transition: 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms cubic-bezier(0.16, 1, 0.3, 1), border-color 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        ...style
      }}
      {...props}
    >
      {(title || subtitle || actions) && (
        <div
          style={{
            padding: paddingMap[padding],
            borderBottom: '1px solid var(--ds-color-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div>
            {title && (
              <h3
                style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--ds-color-text-primary)'
                }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '0.8125rem',
                  color: 'var(--ds-color-text-muted)'
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{actions}</div>}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: paddingMap[padding], display: 'flex', flexDirection: 'column', gap: '10px', flex: '1 1 auto' }}>
          <Skeleton variant="rounded" height="20px" width="60%" />
          <Skeleton variant="text" height="14px" width="90%" />
          <Skeleton variant="text" height="14px" width="75%" />
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <Skeleton variant="rounded" height="30px" width="80px" />
            <Skeleton variant="rounded" height="30px" width="80px" />
          </div>
        </div>
      ) : (
        <div style={{ padding: paddingMap[padding], flex: '1 1 auto' }}>{children}</div>
      )}

      {footer && (
        <div
          style={{
            padding: paddingMap[padding],
            borderTop: '1px solid var(--ds-color-border-subtle)',
            backgroundColor: 'var(--ds-color-surface-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px'
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};
