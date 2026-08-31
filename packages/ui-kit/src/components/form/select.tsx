import React from 'react';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean | undefined;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  hasError?: boolean | undefined;
  placeholder?: string | undefined;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, hasError = false, placeholder, disabled, className = '', style, ...props }, ref) => {
    return (
      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
        <select
          ref={ref}
          disabled={disabled}
          aria-invalid={hasError}
          className={`ds-interactive ${className}`}
          style={{
            width: '100%',
            height: '40px',
            padding: '8px 36px 8px 12px',
            fontSize: '0.9375rem',
            fontFamily: 'inherit',
            color: 'var(--ds-color-text-primary)',
            backgroundColor: disabled ? 'var(--ds-color-surface-subtle)' : 'var(--ds-color-surface)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: hasError ? 'var(--ds-color-danger)' : 'var(--ds-color-border)',
            borderRadius: '6px',
            appearance: 'none',
            outline: 'none',
            boxShadow: 'var(--ds-shadow-sm)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            ...style
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <div
          style={{
            position: 'absolute',
            right: '12px',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--ds-color-text-muted)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
