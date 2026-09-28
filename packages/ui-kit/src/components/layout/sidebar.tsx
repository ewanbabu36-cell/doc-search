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
  headerSlot?: React.ReactNode | undefined;
  sections: NavSection[];
  footerSlot?: React.ReactNode | undefined;
  isCollapsed?: boolean | undefined;
  onItemClick?: ((item: NavItem) => void) | undefined;
  className?: string | undefined;
  width?: string | number | undefined;
  style?: React.CSSProperties | undefined;
}

export const Sidebar: React.FC<SidebarProps> = ({
  brand,
  headerSlot,
  sections,
  footerSlot,
  isCollapsed = false,
  onItemClick,
  className = '',
  width,
  style
}) => {
  const sidebarWidth = width || (isCollapsed ? '68px' : '280px');
  return (
    <aside
      className={`ds-sidebar ${className}`}
      style={{
        width: sidebarWidth,
        backgroundColor: 'var(--ds-surface-l2, var(--ds-color-surface-subtle))',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderRight: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))',
        height: '100%',
        maxHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        ...style
      }}
    >
      {brand && (
        <div
          style={{
            height: '62px',
            padding: '0 18px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.06))',
            flexShrink: 0
          }}
        >
          {brand}
        </div>
      )}

      {headerSlot && (
        <div
          style={{
            padding: isCollapsed ? '8px 6px' : '10px 12px',
            borderBottom: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.06))',
            flexShrink: 0
          }}
        >
          {headerSlot}
        </div>
      )}

      <nav
        className="ds-scrollable-y"
        style={{
          padding: '14px 10px 24px',
          flex: '1 1 0%',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {sections.map((section, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {section.title && !isCollapsed && (
              <div
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--ds-color-text-muted)',
                  padding: '4px 10px',
                  marginBottom: '2px'
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
                  className="ds-interactive ds-spring-press"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    gap: '10px',
                    width: '100%',
                    padding: isCollapsed ? '10px' : '8px 12px',
                    borderRadius: '8px',
                    border: active ? '1px solid var(--ds-color-primary)' : '1px solid transparent',
                    backgroundColor: active ? 'var(--ds-color-primary-subtle, rgba(2, 132, 199, 0.15))' : 'transparent',
                    color: active ? 'var(--ds-color-primary)' : 'var(--ds-color-text-secondary)',
                    fontWeight: active ? '600' : '500',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  title={typeof item.label === 'string' ? item.label : undefined}
                >
                  {item.icon && <span style={{ display: 'inline-flex', flexShrink: 0, fontSize: '1rem', lineHeight: 1 }}>{item.icon}</span>}
                  {!isCollapsed && (
                    <span
                      style={{
                        flex: '1 1 auto',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={typeof item.label === 'string' ? item.label : undefined}
                    >
                      {item.label}
                    </span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, marginLeft: 'auto' }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {footerSlot && (
        <div
          style={{
            padding: isCollapsed ? '8px 4px' : '10px 12px',
            borderTop: '1px solid var(--ds-color-border)',
            backgroundColor: 'var(--ds-color-surface)',
            flexShrink: 0,
            position: 'relative',
            zIndex: 10,
            boxShadow: 'var(--ds-shadow-sm)'
          }}
        >
          {footerSlot}
        </div>
      )}
    </aside>
  );
};
