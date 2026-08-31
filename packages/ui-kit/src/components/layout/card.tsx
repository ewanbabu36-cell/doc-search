import React from 'react';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode | undefined;
  subtitle?: React.ReactNode | undefined;
  actions?: React.ReactNode | undefined;
  footer?: React.ReactNode | undefined;
  padding?: 'none' | 'sm' | 'md' | 'lg' | undefined;
  hoverable?: boolean | undefined;
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
  children,
  className = '',
  style,
  ...props
}) => {
  return (
    <div
      className={`ds-card ${hoverable ? 'ds-interactive' : ''} ${className}`}
      style={{
        backgroundColor: 'var(--ds-color-surface)',
        border: '1px solid var(--ds-color-border)',
        borderRadius: '8px',
        boxShadow: 'var(--ds-shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
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

      <div style={{ padding: paddingMap[padding], flex: '1 1 auto' }}>{children}</div>

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
