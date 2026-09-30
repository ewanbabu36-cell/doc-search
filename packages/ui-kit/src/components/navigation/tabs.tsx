import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  subtitle?: string | undefined;
  description?: string | undefined;
  icon?: React.ReactNode | undefined;
  badge?: React.ReactNode | undefined;
  disabled?: boolean | undefined;
  color?: string | undefined;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  className?: string | undefined;
  variant?: 'cards' | 'underline' | 'pills' | undefined;
  title?: string | undefined;
  columns?: number | undefined;
  hideHeader?: boolean | undefined;
}

const DEFAULT_GRADIENTS = [
  'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', // Blue
  'linear-gradient(135deg, #059669 0%, #10B981 100%)', // Emerald
  'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)', // Violet
  'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)', // Amber
  'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)', // Rose
  'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)', // Indigo
  'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)', // Teal
  'linear-gradient(135deg, #BE123C 0%, #E11D48 100%)', // Crimson
  'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)'  // Cyan
];

const FALLBACK_ICONS = ['📊', '⚡', '🏥', '💳', '🛡️', '🧬', '🤖', '📈', '🔬', '🌐', '🧩', '📋'];

// Helper to extract emoji icon from start of label string if present
const parseTabHeader = (rawLabel: string, userIcon?: React.ReactNode, index: number = 0) => {
  if (userIcon) {
    return { icon: userIcon, title: rawLabel };
  }

  // Check if string begins with an emoji/symbol
  const match = rawLabel.match(/^(\p{Extended_Pictographic}|\p{Emoji_Presentation})\s*(.*)$/u);
  if (match && match[1]) {
    const matchedText = match[2]?.trim();
    return {
      icon: match[1].trim(),
      title: matchedText ? matchedText : rawLabel
    };
  }

  return {
    icon: FALLBACK_ICONS[index % FALLBACK_ICONS.length] ?? '⚡',
    title: rawLabel
  };
};

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  className = '',
  variant = 'pills',
  title,
  columns,
  hideHeader = false
}) => {
  // 1. Modern Segmented Pills Variant (Default - Zero Horizontal Scrollbar)
  if (variant === 'pills') {
    return (
      <div
        role="tablist"
        className={`ds-tabs-pills ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '16px'
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => onTabChange(tab.id)}
              style={{
                padding: '8px 14px',
                fontSize: '0.85rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--ds-color-primary-foreground, #FFFFFF)' : 'var(--ds-color-text-secondary, #94A3B8)',
                backgroundColor: isActive ? 'var(--ds-color-primary, #0284C7)' : 'var(--ds-color-surface-subtle, #1E293B)',
                borderRadius: '8px',
                border: isActive ? '1px solid var(--ds-color-primary, #38BDF8)' : '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.08))',
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
                opacity: tab.disabled ? 0.45 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: isActive ? '0 2px 10px var(--ds-color-primary-subtle, rgba(2, 132, 199, 0.35))' : 'none',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive && !tab.disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--ds-color-surface-hover, #334155)';
                  e.currentTarget.style.color = 'var(--ds-color-text-primary, #F8FAFC)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive && !tab.disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--ds-color-surface-subtle, #1E293B)';
                  e.currentTarget.style.color = 'var(--ds-color-text-secondary, #94A3B8)';
                }
              }}
            >
              <span>{tab.label}</span>
              {tab.badge && <span>{tab.badge}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  // 2. Classic Underline variant (Zero Horizontal Scrollbar)
  if (variant === 'underline') {
    return (
      <div
        role="tablist"
        className={`ds-tabs ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          borderBottom: '1px solid var(--ds-color-border, #1E293B)',
          flexWrap: 'wrap',
          paddingBottom: '2px',
          marginBottom: '16px'
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => onTabChange(tab.id)}
              className="ds-interactive"
              style={{
                padding: '10px 16px',
                fontSize: '0.875rem',
                fontWeight: isActive ? '600' : '500',
                color: isActive ? 'var(--ds-color-primary, #38BDF8)' : 'var(--ds-color-text-secondary, #94A3B8)',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--ds-color-primary, #38BDF8)' : '2px solid transparent',
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
                opacity: tab.disabled ? 0.5 : 1,
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{tab.label}</span>
              {tab.badge && <span>{tab.badge}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  // 3. Card Matrix (Only when explicitly variant="cards")
  const activeTabItem = tabs.find((t) => t.id === activeTabId);
  const activeTitle = activeTabItem ? parseTabHeader(activeTabItem.label).title : '';

  return (
    <div
      role="tablist"
      className={`ds-tabs-card-matrix ${className}`}
      style={{
        backgroundColor: 'var(--ds-color-surface)',
        border: '1.5px solid var(--ds-color-border-strong, var(--ds-color-border))',
        borderRadius: '16px',
        padding: '14px 16px',
        boxShadow: 'var(--ds-shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '16px'
      }}
    >
      {/* Matrix Header Strip */}
      {!hideHeader && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1rem', color: 'var(--ds-color-primary, #06B6D4)' }}>⚡</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--ds-color-text-primary, #F8FAFC)', letterSpacing: '-0.01em' }}>
              {title || 'Operational Modules Matrix'}
            </span>
            <span
              style={{
                backgroundColor: 'var(--ds-color-primary-subtle, rgba(6, 182, 212, 0.15))',
                border: '1px solid var(--ds-color-border, rgba(6, 182, 212, 0.3))',
                color: 'var(--ds-color-primary, #38BDF8)',
                padding: '2px 8px',
                borderRadius: '8px',
                fontSize: '0.6875rem',
                fontWeight: 700
              }}
            >
              {tabs.length} Modules (Single Screen Matrix)
            </span>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #94A3B8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Active View:</span>
            <strong style={{ color: 'var(--ds-color-primary, #38BDF8)' }}>{activeTitle || activeTabId}</strong>
          </div>
        </div>
      )}

      {/* Responsive Card Matrix Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: columns
            ? `repeat(${columns}, minmax(0, 1fr))`
            : 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '10px'
        }}
      >
        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeTabId;
          const { icon, title: parsedTitle } = parseTabHeader(tab.label, tab.icon, idx);
          const bgGradient = tab.color || (DEFAULT_GRADIENTS[idx % DEFAULT_GRADIENTS.length] ?? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)');
          const subtitle = tab.subtitle || tab.description || 'Workspace & Telemetry';

          return (
            <div
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-disabled={tab.disabled}
              onClick={() => {
                if (!tab.disabled) onTabChange(tab.id);
              }}
              style={{
                backgroundColor: isActive ? 'var(--ds-color-surface-selected, rgba(6, 182, 212, 0.15))' : 'var(--ds-color-surface-subtle, #11182E)',
                border: isActive ? '1.5px solid var(--ds-color-primary, #06B6D4)' : '1px solid var(--ds-color-border-subtle, #1E293B)',
                borderRadius: '12px',
                padding: '11px 13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
                opacity: tab.disabled ? 0.45 : 1,
                transition: 'all 0.18s ease',
                boxShadow: isActive
                  ? '0 0 16px var(--ds-color-primary-subtle, rgba(6, 182, 212, 0.35))'
                  : 'var(--ds-shadow-sm)',
                transform: isActive ? 'translateY(-1px)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive && !tab.disabled) {
                  e.currentTarget.style.borderColor = 'var(--ds-color-primary, rgba(6, 182, 212, 0.5))';
                  e.currentTarget.style.backgroundColor = 'var(--ds-color-surface-hover, #16203B)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive && !tab.disabled) {
                  e.currentTarget.style.borderColor = 'var(--ds-color-border-subtle, #1E293B)';
                  e.currentTarget.style.backgroundColor = 'var(--ds-color-surface-subtle, #11182E)';
                  e.currentTarget.style.transform = 'none';
                }
              }}
            >
              {/* Left: Icon Box + Title & Subtitle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: bgGradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFF',
                    fontSize: '1.1rem',
                    flexShrink: 0,
                    boxShadow: 'var(--ds-shadow-sm)'
                  }}
                >
                  {icon}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: isActive ? 800 : 700,
                      color: isActive ? 'var(--ds-color-primary, #FFFFFF)' : 'var(--ds-color-text-primary, #F1F5F9)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={parsedTitle}
                  >
                    {parsedTitle}
                  </div>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      color: isActive ? 'var(--ds-color-primary, #93C5FD)' : 'var(--ds-color-text-muted, #94A3B8)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '1px'
                    }}
                  >
                    {subtitle}
                  </div>
                </div>
              </div>

              {/* Right: Badge + Active Indicator */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0, maxWidth: '140px' }}>
                {tab.badge && (
                  <div style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tab.badge}</div>
                )}
                {isActive ? (
                  <span style={{ fontSize: '0.625rem', color: 'var(--ds-color-primary, #06B6D4)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--ds-color-primary, #06B6D4)', boxShadow: '0 0 6px var(--ds-color-primary, #06B6D4)' }} />
                    Active
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748B)' }}>→</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
