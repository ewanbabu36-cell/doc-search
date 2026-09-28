import React, { useEffect } from 'react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode | undefined;
  children: React.ReactNode;
  footer?: React.ReactNode | undefined;
  position?: 'right' | 'bottom' | undefined;
  width?: string | undefined;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  position = 'right',
  width = '380px'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
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

  const isBottom = position === 'bottom';

  return (
    <div
      className="ds-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          position: 'fixed',
          backgroundColor: 'var(--ds-surface-glass-elevated, var(--ds-color-surface))',
          backdropFilter: 'blur(28px) saturate(190%)',
          WebkitBackdropFilter: 'blur(28px) saturate(190%)',
          borderLeft: isBottom ? 'none' : '1px solid var(--ds-color-border-strong, var(--ds-color-border))',
          borderTop: isBottom ? '1px solid var(--ds-color-border-strong, var(--ds-color-border))' : 'none',
          boxShadow: 'var(--ds-depth-high, var(--ds-shadow-xl)), var(--ds-specular-edge, inset 0 1px 0 0 rgba(255, 255, 255, 0.12))',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 'var(--ds-z-drawer, 70)' as any,
          ...(isBottom
            ? { bottom: 0, left: 0, right: 0, maxHeight: '80vh' }
            : { top: 0, right: 0, bottom: 0, width, maxWidth: '100vw' })
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--ds-color-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {title && (
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: 'var(--ds-color-text-primary)' }}>
              {title}
            </h3>
          )}
          <button
            type="button"
            aria-label="Close drawer"
            onClick={onClose}
            className="ds-interactive"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.25rem',
              color: 'var(--ds-color-text-muted)'
            }}
          >
            ✕
          </button>
        </div>

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
