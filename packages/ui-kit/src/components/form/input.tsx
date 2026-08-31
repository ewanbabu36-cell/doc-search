import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean | undefined;
  leftElement?: React.ReactNode | undefined;
  rightElement?: React.ReactNode | undefined;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ hasError = false, leftElement, rightElement, disabled, className = '', style, ...props }, ref) => {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          width: '100%'
        }}
      >
        {leftElement && (
          <div
            style={{
              position: 'absolute',
              left: '12px',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              color: 'var(--ds-color-text-muted)'
            }}
          >
            {leftElement}
          </div>
        )}
        <input
          ref={ref}
          disabled={disabled}
          aria-invalid={hasError}
          className={`ds-interactive ${className}`}
          style={{
            width: '100%',
            height: '40px',
            paddingLeft: leftElement ? '36px' : '12px',
            paddingRight: rightElement ? '36px' : '12px',
            paddingTop: '8px',
            paddingBottom: '8px',
            fontSize: '0.9375rem',
            fontFamily: 'inherit',
            color: 'var(--ds-color-text-primary)',
            backgroundColor: disabled ? 'var(--ds-color-surface-subtle)' : 'var(--ds-color-surface)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: hasError ? 'var(--ds-color-danger)' : 'var(--ds-color-border)',
            borderRadius: '6px',
            outline: 'none',
            boxShadow: 'var(--ds-shadow-sm)',
            cursor: disabled ? 'not-allowed' : 'text',
            ...style
          }}
          {...props}
        />
        {rightElement && (
          <div
            style={{
              position: 'absolute',
              right: '12px',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--ds-color-text-muted)'
            }}
          >
            {rightElement}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
