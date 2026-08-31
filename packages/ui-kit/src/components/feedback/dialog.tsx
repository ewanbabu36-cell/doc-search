import React, { useEffect } from 'react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode | undefined;
  children: React.ReactNode;
  footer?: React.ReactNode | undefined;
  maxWidth?: 'sm' | 'md' | 'lg' | undefined;
  closeOnBackdropClick?: boolean | undefined;
}

const maxWidthMap = {
  sm: '400px',
  md: '540px',
  lg: '720px'
};

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
  closeOnBackdropClick = false
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="ds-backdrop"
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          width: '100%',
          maxWidth: maxWidthMap[maxWidth],
          maxHeight: '90vh',
          margin: '16px',
          backgroundColor: 'var(--ds-color-surface)',
          border: '1px solid var(--ds-color-border)',
          borderRadius: '8px',
          boxShadow: 'var(--ds-shadow-xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {title && (
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--ds-color-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: 'var(--ds-color-text-primary)' }}>
              {title}
            </h2>
            <button
              type="button"
              aria-label="Close dialog"
              onClick={onClose}
              className="ds-interactive"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.25rem',
                color: 'var(--ds-color-text-muted)',
                padding: '4px'
              }}
            >
              ✕
            </button>
          </div>
        )}

        <div style={{ padding: '20px', flex: '1 1 auto', overflowY: 'auto' }}>{children}</div>

        {footer && (
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--ds-color-border-subtle)',
              backgroundColor: 'var(--ds-color-surface-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '8px'
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
