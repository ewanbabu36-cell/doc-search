import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  badge?: React.ReactNode | undefined;
  disabled?: boolean | undefined;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  className?: string | undefined;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  className = ''
}) => {
  return (
    <div
      role="tablist"
      className={`ds-tabs ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        borderBottom: '1px solid var(--ds-color-border)',
        overflowX: 'auto',
        overflowY: 'hidden'
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
              color: isActive ? 'var(--ds-color-primary)' : 'var(--ds-color-text-secondary)',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--ds-color-primary)' : '2px solid transparent',
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
};
