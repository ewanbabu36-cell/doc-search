import React from 'react';
import { Spinner } from './spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'outline' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  isLoading?: boolean | undefined;
  leftIcon?: React.ReactNode | undefined;
  rightIcon?: React.ReactNode | undefined;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: 'var(--ds-color-primary)',
    color: 'var(--ds-color-primary-foreground)',
    borderColor: 'transparent'
  },
  secondary: {
    backgroundColor: 'var(--ds-color-secondary)',
    color: 'var(--ds-color-secondary-foreground)',
    borderColor: 'transparent'
  },
  subtle: {
    backgroundColor: 'var(--ds-color-surface-subtle)',
    color: 'var(--ds-color-text-primary)',
    borderColor: 'var(--ds-color-border-subtle)'
  },
  outline: {
    backgroundColor: 'transparent',
    color: 'var(--ds-color-text-primary)',
    borderColor: 'var(--ds-color-border)'
  },
  danger: {
    backgroundColor: 'var(--ds-color-danger)',
    color: 'var(--ds-color-danger-foreground)',
    borderColor: 'transparent'
  }
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: '0.875rem', height: '32px', minWidth: '32px' },
  md: { padding: '8px 16px', fontSize: '0.9375rem', height: '40px', minWidth: '40px' },
  lg: { padding: '12px 20px', fontSize: '1rem', height: '48px', minWidth: '48px' }
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      style,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={`ds-interactive ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontFamily: 'inherit',
          fontWeight: '500',
          borderRadius: '6px',
          borderWidth: '1px',
          borderStyle: 'solid',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.6 : 1,
          boxShadow: 'var(--ds-shadow-sm)',
          ...sizeStyles[size],
          ...variantStyles[variant],
          ...style
        }}
        {...props}
      >
        {isLoading ? <Spinner size={size === 'lg' ? 'md' : 'sm'} /> : leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
