import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean | undefined;
  isSuccess?: boolean | undefined;
  inputSize?: 'sm' | 'md' | 'lg' | undefined;
  leftElement?: React.ReactNode | undefined;
  rightElement?: React.ReactNode | undefined;
}

const inputSizeMap = {
  sm: { height: '32px', fontSize: '0.8125rem', paddingY: '4px' },
  md: { height: '40px', fontSize: '0.875rem', paddingY: '8px' },
  lg: { height: '48px', fontSize: '1rem', paddingY: '12px' }
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      hasError = false,
      isSuccess = false,
      inputSize = 'md',
      leftElement,
      rightElement,
      disabled,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const sizeConfig = inputSizeMap[inputSize];
    const borderColor = hasError
      ? 'var(--ds-color-danger, #ef4444)'
      : isSuccess
      ? 'var(--ds-color-success, #10b981)'
      : 'var(--ds-color-border)';

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
              left: inputSize === 'sm' ? '8px' : '12px',
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
          className={`ds-interactive ds-input ${className}`}
          style={{
            width: '100%',
            height: sizeConfig.height,
            paddingLeft: leftElement ? (inputSize === 'sm' ? '28px' : '36px') : (inputSize === 'sm' ? '8px' : '12px'),
            paddingRight: rightElement ? (inputSize === 'sm' ? '28px' : '36px') : (inputSize === 'sm' ? '8px' : '12px'),
            paddingTop: sizeConfig.paddingY,
            paddingBottom: sizeConfig.paddingY,
            fontSize: sizeConfig.fontSize,
            fontFamily: 'inherit',
            color: 'var(--ds-color-text-primary)',
            backgroundColor: disabled ? 'var(--ds-color-surface-subtle)' : 'var(--ds-surface-glass, var(--ds-color-surface))',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor,
            borderRadius: '8px',
            outline: 'none',
            boxShadow: 'var(--ds-depth-subtle, var(--ds-shadow-sm)), var(--ds-specular-edge-subtle)',
            cursor: disabled ? 'not-allowed' : 'text',
            transition: 'border-color var(--ds-motion-fast, 120ms ease), box-shadow var(--ds-motion-fast, 120ms ease)',
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
