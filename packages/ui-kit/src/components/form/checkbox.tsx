import React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string | undefined;
  description?: string | undefined;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, disabled, className = '', style, id, ...props }, ref) => {
    const inputId = id || (label ? `cb-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <label
        htmlFor={inputId}
        className={`ds-interactive ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'flex-start',
          gap: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          userSelect: 'none',
          fontSize: '0.875rem',
          ...style
        }}
      >
        <input
          ref={ref}
          type="checkbox"
          id={inputId}
          disabled={disabled}
          style={{
            marginTop: '2px',
            width: '18px',
            height: '18px',
            accentColor: 'var(--ds-color-primary)',
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
          {...props}
        />
        {(label || description) && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {label && (
              <span style={{ fontWeight: '500', color: 'var(--ds-color-text-primary)' }}>
                {label}
              </span>
            )}
            {description && (
              <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                {description}
              </span>
            )}
          </div>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
