import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon?: React.ReactNode | undefined;
  isActive?: boolean | undefined;
  badge?: React.ReactNode | undefined;
  onClick?: (() => void) | undefined;
  href?: string | undefined;
}

export interface NavSection {
  title?: string | undefined;
  items: NavItem[];
}

export interface SidebarProps {
  brand?: React.ReactNode | undefined;
  sections: NavSection[];
  isCollapsed?: boolean | undefined;
  onItemClick?: ((item: NavItem) => void) | undefined;
  className?: string | undefined;
}

export const Sidebar: React.FC<SidebarProps> = ({
  brand,
  sections,
  isCollapsed = false,
  onItemClick,
  className = ''
}) => {
  return (
    <aside
      className={`ds-sidebar ds-scrollable-y ${className}`}
      style={{
        width: isCollapsed ? '68px' : '260px',
        backgroundColor: 'var(--ds-color-surface)',
        borderRight: '1px solid var(--ds-color-border)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        overflowX: 'hidden'
      }}
    >
      {brand && (
        <div
          style={{
            height: '60px',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid var(--ds-color-border-subtle)',
            flexShrink: 0
          }}
        >
          {brand}
        </div>
      )}

      <nav style={{ padding: '12px 8px', flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {sections.map((section, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {section.title && !isCollapsed && (
              <div
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--ds-color-text-muted)',
                  padding: '4px 8px'
                }}
              >
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const active = item.isActive;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.onClick?.();
                    onItemClick?.(item);
                  }}
                  className="ds-interactive"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    gap: '10px',
                    width: '100%',
                    padding: isCollapsed ? '10px' : '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid transparent',
                    backgroundColor: active ? 'var(--ds-color-surface-selected)' : 'transparent',
                    color: active ? 'var(--ds-color-primary)' : 'var(--ds-color-text-secondary)',
                    fontWeight: active ? '600' : '500',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  title={isCollapsed ? item.label : undefined}
                >
                  {item.icon && <span style={{ display: 'inline-flex', flexShrink: 0 }}>{item.icon}</span>}
                  {!isCollapsed && <span style={{ flex: '1 1 auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>}
                  {!isCollapsed && item.badge && <span>{item.badge}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
};
