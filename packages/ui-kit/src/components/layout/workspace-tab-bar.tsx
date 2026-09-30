import React, { useRef } from 'react';

export interface WorkspaceTabItem {
  id: string;
  title: string;
  icon?: React.ReactNode | undefined;
  badge?: string | undefined;
  isClosable?: boolean | undefined;
}

export interface WorkspaceTabBarProps {
  tabs: WorkspaceTabItem[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab?: ((tabId: string) => void) | undefined;
  onCloseOtherTabs?: (() => void) | undefined;
  onNewTask?: (() => void) | undefined;
  newTaskLabel?: string | undefined;
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
}

export const WorkspaceTabBar: React.FC<WorkspaceTabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onCloseOtherTabs,
  onNewTask,
  newTaskLabel = 'New Tab',
  className = '',
  style = {}
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current && e.deltaY !== 0) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  if (!tabs || tabs.length === 0) return null;

  return (
    <nav
      aria-label="Multi-task workspace tabs"
      className={`ds-workspace-tab-bar ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--ds-surface-l3, rgba(15, 23, 42, 0.9))',
        borderBottom: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))',
        padding: '3px 12px',
        gap: '8px',
        minHeight: '38px',
        maxHeight: '40px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none',
        zIndex: 900,
        ...style
      }}
    >
      {/* Scrollable Tabs List */}
      <div
        ref={scrollRef}
        onWheel={handleWheel}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          flex: '1 1 auto',
          minWidth: 0,
          paddingRight: '6px'
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const closable = tab.isClosable !== false && tabs.length > 1;

          return (
            <div
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={0}
              onClick={() => onSelectTab(tab.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectTab(tab.id);
                }
              }}
              title={tab.title}
              className="ds-workspace-tab ds-interactive"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '4px 10px',
                borderRadius: '7px',
                fontSize: '0.78rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                maxWidth: '220px',
                minWidth: '80px',
                transition: 'all 0.15s ease',
                position: 'relative',
                backgroundColor: isActive
                  ? 'rgba(56, 189, 248, 0.14)'
                  : 'rgba(255, 255, 255, 0.03)',
                color: isActive ? '#38BDF8' : 'var(--ds-color-text-muted, #94A3B8)',
                border: isActive
                  ? '1px solid rgba(56, 189, 248, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.06)',
                boxShadow: isActive
                  ? '0 1px 6px rgba(56, 189, 248, 0.2)'
                  : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.07)';
                  e.currentTarget.style.color = '#F8FAFC';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.color = 'var(--ds-color-text-muted, #94A3B8)';
                }
              }}
            >
              {/* Tab Icon */}
              {tab.icon && (
                <span style={{ fontSize: '0.85rem', lineHeight: 1, flexShrink: 0 }}>
                  {tab.icon}
                </span>
              )}

              {/* Tab Title */}
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1
                }}
              >
                {tab.title}
              </span>

              {/* Optional Status Badge */}
              {tab.badge && (
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(56, 189, 248, 0.2)',
                    color: '#38BDF8',
                    flexShrink: 0
                  }}
                >
                  {tab.badge}
                </span>
              )}

              {/* Active Glow Bar Indicator */}
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-1px',
                    left: '8px',
                    right: '8px',
                    height: '2px',
                    backgroundColor: '#38BDF8',
                    borderRadius: '2px',
                    boxShadow: '0 0 6px #38BDF8'
                  }}
                />
              )}

              {/* Close Tab Button */}
              {closable && onCloseTab && (
                <button
                  type="button"
                  aria-label={`Close tab ${tab.title}`}
                  title="Close tab"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="ds-tab-close-btn"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '1px 4px',
                    borderRadius: '4px',
                    color: isActive ? '#38BDF8' : '#94A3B8',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    lineHeight: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.7,
                    transition: 'all 0.12s ease',
                    marginLeft: '2px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)';
                    e.currentTarget.style.color = '#EF4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.7';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = isActive ? '#38BDF8' : '#94A3B8';
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Optional Close Other Tabs Action */}
      {tabs.length > 1 && onCloseOtherTabs && (
        <button
          type="button"
          onClick={onCloseOtherTabs}
          className="ds-interactive"
          title="Close all other tabs except the active tab"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            color: '#FCA5A5',
            fontSize: '0.7rem',
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.18)';
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.borderColor = '#EF4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
            e.currentTarget.style.color = '#FCA5A5';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
          }}
        >
          <span>✕</span>
          <span>Close Others</span>
        </button>
      )}

      {/* New Task Launcher Button */}
      {onNewTask && (
        <button
          type="button"
          onClick={onNewTask}
          className="ds-interactive ds-spring-press"
          title="Open new workspace tab"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px dashed rgba(56, 189, 248, 0.4)',
            backgroundColor: 'rgba(56, 189, 248, 0.06)',
            color: '#38BDF8',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.15)';
            e.currentTarget.style.borderColor = '#38BDF8';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.06)';
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
            e.currentTarget.style.color = '#38BDF8';
          }}
        >
          <span style={{ fontSize: '0.85rem', lineHeight: 1 }}>➕</span>
          <span>{newTaskLabel}</span>
        </button>
      )}
    </nav>
  );
};
