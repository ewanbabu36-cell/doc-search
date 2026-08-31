import React from 'react';
import { Button } from '../primitives/button';

export interface EmptyStateProps {
  icon?: React.ReactNode | undefined;
  title: string;
  description?: string | undefined;
  actionLabel?: string | undefined;
  onAction?: (() => void) | undefined;
  className?: string | undefined;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div
      className={`ds-empty-state ${className}`}
      style={{
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        backgroundColor: 'var(--ds-color-surface)',
        border: '1px dashed var(--ds-color-border)',
        borderRadius: '8px'
      }}
    >
      {icon && (
        <div
          style={{
            marginBottom: '16px',
            color: 'var(--ds-color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {icon}
        </div>
      )}
      <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: '600', color: 'var(--ds-color-text-primary)' }}>
        {title}
      </h4>
      {description && (
        <p style={{ margin: '0 0 20px 0', fontSize: '0.875rem', color: 'var(--ds-color-text-muted)', maxWidth: '400px' }}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
