import React from 'react';
import { Input, InputProps } from './input';

export interface IndianMobileInputProps extends Omit<InputProps, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  showValidationIndicator?: boolean;
}

/**
 * Standardized Indian 10-Digit Mobile Input Component
 * Enforces +91 country badge, numeric-only keystrokes, and 10-digit limit.
 */
export const IndianMobileInput = React.forwardRef<HTMLInputElement, IndianMobileInputProps>(
  (
    {
      value,
      onChange,
      showValidationIndicator = true,
      placeholder = '98765 43210',
      hasError,
      isSuccess,
      style,
      ...props
    },
    ref
  ) => {
    // Sanitize input: only numbers, strip +91/0 prefix if pasted, max 10 digits
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value.replace(/\D/g, '');
      if (raw.length === 12 && raw.startsWith('91')) {
        raw = raw.slice(2);
      } else if (raw.length === 11 && raw.startsWith('0')) {
        raw = raw.slice(1);
      }
      onChange(raw.slice(0, 10));
    };

    const isComplete = value.length === 10;
    const isValidFormat = isComplete && /^[6-9]/.test(value);
    const computedHasError = hasError !== undefined ? hasError : (value.length > 0 && !isComplete);
    const computedIsSuccess = isSuccess !== undefined ? isSuccess : (isComplete && isValidFormat);

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="numeric"
        maxLength={10}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        hasError={computedHasError}
        isSuccess={computedIsSuccess}
        leftElement={
          <span
            style={{
              fontWeight: 800,
              fontSize: '0.8125rem',
              color: 'var(--ds-color-primary, #38BDF8)',
              paddingRight: '6px',
              borderRight: '1px solid rgba(255, 255, 255, 0.15)',
              marginRight: '6px',
              userSelect: 'none'
            }}
          >
            🇮🇳 +91
          </span>
        }
        rightElement={
          showValidationIndicator && value.length > 0 ? (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: isValidFormat ? '#10B981' : '#EF4444',
                padding: '0 4px',
                userSelect: 'none'
              }}
            >
              {isValidFormat ? '✓ 10-Digit' : `${value.length}/10`}
            </span>
          ) : undefined
        }
        style={{
          paddingLeft: '68px',
          paddingRight: showValidationIndicator && value.length > 0 ? '60px' : undefined,
          fontFamily: 'monospace',
          letterSpacing: '0.04em',
          ...style
        }}
        {...props}
      />
    );
  }
);

IndianMobileInput.displayName = 'IndianMobileInput';
