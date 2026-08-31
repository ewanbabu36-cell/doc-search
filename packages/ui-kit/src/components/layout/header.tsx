import React from 'react';

export interface HeaderProps {
  title?: React.ReactNode | undefined;
  organizationSlot?: React.ReactNode | undefined;
  userSlot?: React.ReactNode | undefined;
  themeSlot?: React.ReactNode | undefined;
  onMenuToggle?: (() => void) | undefined;
  className?: string | undefined;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  organizationSlot,
  userSlot,
  themeSlot,
  onMenuToggle,
  className = ''
}) => {
  return (
    <header
      className={`ds-header ${className}`}
      style={{
        minHeight: '60px',
        backgroundColor: 'var(--ds-color-surface)',
        borderBottom: '1px solid var(--ds-color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: 'var(--ds-shadow-sm)',
        flexWrap: 'wrap',
        gap: '10px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flexShrink: 1 }}>
        {onMenuToggle && (
          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={onMenuToggle}
            className="ds-interactive"
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              border: '1px solid var(--ds-color-border-subtle)',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ds-color-text-primary)',
              flexShrink: 0
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        {title && (
          <div
            className="ds-header-title"
            style={{
              fontWeight: '700',
              fontSize: '1rem',
              color: 'var(--ds-color-text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {title}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
        {organizationSlot && <div className="ds-hide-on-mobile">{organizationSlot}</div>}
        {themeSlot && <div>{themeSlot}</div>}
        {userSlot && <div>{userSlot}</div>}
      </div>
    </header>
  );
};
