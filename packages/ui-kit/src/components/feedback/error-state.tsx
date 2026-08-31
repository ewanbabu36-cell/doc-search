import React from 'react';
import { Button } from '../primitives/button';

export interface ErrorStateProps {
  title?: string | undefined;
  message?: string | undefined;
  onRetry?: (() => void) | undefined;
  retryLabel?: string | undefined;
  className?: string | undefined;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this view.',
  onRetry,
  retryLabel = 'Retry',
  className = ''
}) => {
  return (
    <div
      role="alert"
      className={`ds-error-state ${className}`}
      style={{
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        backgroundColor: 'var(--ds-color-surface)',
        border: '1px solid var(--ds-color-danger)',
        borderRadius: '8px'
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: 'var(--ds-color-danger-subtle)',
          color: 'var(--ds-color-danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          fontSize: '1.25rem',
          fontWeight: '700'
        }}
      >
        !
      </div>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: '600', color: 'var(--ds-color-text-primary)' }}>
        {title}
      </h4>
      <p style={{ margin: '0 0 20px 0', fontSize: '0.875rem', color: 'var(--ds-color-text-muted)', maxWidth: '440px' }}>
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
};
