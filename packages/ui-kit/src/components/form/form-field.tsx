import React from 'react';

export interface FormFieldProps {
  label?: string | undefined;
  htmlFor?: string | undefined;
  required?: boolean | undefined;
  error?: string | undefined;
  helperText?: string | undefined;
  children: React.ReactNode;
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required = false,
  error,
  helperText,
  children,
  className = '',
  style
}) => {
  return (
    <div
      className={`ds-form-field ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        width: '100%',
        ...style
      }}
    >
      {label && (
        <label
          htmlFor={htmlFor}
          style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'var(--ds-color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {label}
          {required && (
            <span style={{ color: 'var(--ds-color-danger)' }} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error && (
        <p
          role="alert"
          style={{
            margin: 0,
            fontSize: '0.75rem',
            fontWeight: '500',
            color: 'var(--ds-color-danger)'
          }}
        >
          {error}
        </p>
      )}
      {!error && helperText && (
        <p
          style={{
            margin: 0,
            fontSize: '0.75rem',
            color: 'var(--ds-color-text-muted)'
          }}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};
