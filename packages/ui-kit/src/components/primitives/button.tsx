import React from 'react';
import { Spinner } from './spinner';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'subtle'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'link'
  | 'icon';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  isLoading?: boolean | undefined;
  isIconOnly?: boolean | undefined;
  leftIcon?: React.ReactNode | undefined;
  rightIcon?: React.ReactNode | undefined;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: 'var(--ds-color-primary)',
    color: 'var(--ds-color-primary-foreground, #ffffff)',
    borderColor: 'transparent'
  },
  secondary: {
    backgroundColor: 'var(--ds-color-secondary)',
    color: 'var(--ds-color-secondary-foreground, #ffffff)',
    borderColor: 'transparent'
  },
  subtle: {
    backgroundColor: 'var(--ds-color-surface-subtle)',
    color: 'var(--ds-color-text-primary)',
    borderColor: 'var(--ds-color-border-subtle, rgba(255, 255, 255, 0.08))'
  },
  outline: {
    backgroundColor: 'transparent',
    color: 'var(--ds-color-text-primary)',
    borderColor: 'var(--ds-color-border)'
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--ds-color-text-primary)',
    borderColor: 'transparent'
  },
  danger: {
    backgroundColor: 'var(--ds-color-danger)',
    color: 'var(--ds-color-danger-foreground, #ffffff)',
    borderColor: 'transparent'
  },
  success: {
    backgroundColor: 'var(--ds-color-success)',
    color: 'var(--ds-color-success-foreground, #ffffff)',
    borderColor: 'transparent'
  },
  link: {
    backgroundColor: 'transparent',
    color: 'var(--ds-color-primary)',
    borderColor: 'transparent',
    padding: '0',
    height: 'auto',
    minWidth: 'auto',
    textDecoration: 'underline'
  },
  icon: {
    backgroundColor: 'var(--ds-color-surface-subtle)',
    color: 'var(--ds-color-text-primary)',
    borderColor: 'var(--ds-color-border-subtle, rgba(255, 255, 255, 0.08))',
    padding: '0'
  }
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '0 12px', fontSize: '0.8125rem', height: '32px', minWidth: '32px' },
  md: { padding: '0 16px', fontSize: '0.875rem', height: '40px', minWidth: '40px' },
  lg: { padding: '0 24px', fontSize: '1rem', height: '48px', minWidth: '48px' }
};

const iconSquareStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { width: '32px', height: '32px', padding: 0 },
  md: { width: '40px', height: '40px', padding: 0 },
  lg: { width: '48px', height: '48px', padding: 0 }
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isIconOnly = false,
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
    const isIconMode = isIconOnly || variant === 'icon';

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        className={`ds-interactive ds-spring-press ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isIconMode ? '0px' : '8px',
          fontFamily: 'inherit',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          borderRadius: size === 'lg' ? '10px' : '8px',
          borderWidth: '1px',
          borderStyle: 'solid',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.55 : 1,
          boxShadow: variant === 'primary'
            ? '0 2px 6px -1px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            : variant === 'secondary'
            ? '0 2px 6px -1px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
            : variant === 'ghost' || variant === 'link'
            ? 'none'
            : 'var(--ds-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05))',
          transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          ...sizeStyles[size],
          ...(isIconMode ? iconSquareStyles[size] : {}),
          ...variantStyles[variant],
          ...style
        }}
        {...props}
      >
        {isLoading ? (
          <Spinner size={size === 'lg' ? 'md' : 'sm'} />
        ) : (
          leftIcon
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
