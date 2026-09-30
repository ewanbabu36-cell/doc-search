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
  selectSize?: 'sm' | 'md' | 'lg' | undefined;
}

const selectSizeMap = {
  sm: { height: '32px', fontSize: '0.8125rem', padding: '4px 28px 4px 8px' },
  md: { height: '40px', fontSize: '0.875rem', padding: '8px 36px 8px 12px' },
  lg: { height: '48px', fontSize: '1rem', padding: '12px 40px 12px 16px' }
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, hasError = false, placeholder, selectSize = 'md', disabled, className = '', style, ...props }, ref) => {
    const sizeConfig = selectSizeMap[selectSize];

    return (
      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
        <select
          ref={ref}
          disabled={disabled}
          aria-invalid={hasError}
          className={`ds-interactive ds-input ${className}`}
          style={{
            width: '100%',
            height: sizeConfig.height,
            padding: sizeConfig.padding,
            fontSize: sizeConfig.fontSize,
            fontFamily: 'inherit',
            color: 'var(--ds-color-text-primary)',
            backgroundColor: disabled ? 'var(--ds-color-surface-subtle)' : 'var(--ds-surface-glass, var(--ds-color-surface))',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: hasError ? 'var(--ds-color-danger, #ef4444)' : 'var(--ds-color-border)',
            borderRadius: '8px',
            appearance: 'none',
            outline: 'none',
            boxShadow: 'var(--ds-depth-subtle, var(--ds-shadow-sm)), var(--ds-specular-edge-subtle)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'border-color var(--ds-motion-fast, 120ms ease), box-shadow var(--ds-motion-fast, 120ms ease)',
            ...style
          }}
          {...props}
        >
          {placeholder && (
            <option
              value=""
              disabled
              style={{
                backgroundColor: 'var(--ds-color-surface, #121826)',
                color: 'var(--ds-color-text-muted, #94a3b8)'
              }}
            >
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
              style={{
                backgroundColor: 'var(--ds-color-surface, #121826)',
                color: 'var(--ds-color-text-primary, #f8fafc)'
              }}
            >
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
