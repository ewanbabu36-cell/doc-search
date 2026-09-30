import React, { useState } from 'react';

export interface WorkstationPanelProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
  onRefresh?: () => void;
  children: React.ReactNode;
  footerSlot?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const WorkstationPanel: React.FC<WorkstationPanelProps> = ({
  title,
  subtitle,
  icon,
  badge,
  actions,
  isCollapsible = false,
  defaultCollapsed = false,
  onRefresh,
  children,
  footerSlot,
  className = '',
  style = {}
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div
      className={`ds-workstation-panel ${className}`}
      style={{
        backgroundColor: 'var(--ds-surface-l2, rgba(22, 27, 34, 0.9))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.1))',
        borderRadius: '12px',
        boxShadow: 'var(--ds-shadow-base, 0 2px 8px rgba(0, 0, 0, 0.25))',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...style
      }}
    >
      {/* Window Title Bar */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: isCollapsed ? 'none' : '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.08))',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          flexWrap: 'wrap',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          {icon && (
            <span style={{ display: 'inline-flex', fontSize: '1rem', color: 'var(--ds-color-primary, #0078D4)' }}>
              {icon}
            </span>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ds-color-text-primary, #F8FAFC)' }}>
                {title}
              </span>
              {badge}
            </div>
            {subtitle && (
              <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #94A3B8)', marginTop: '1px' }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {/* Window Controls & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {actions}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="ds-interactive ds-spring-press"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.1))',
                borderRadius: '6px',
                padding: '3px 7px',
                color: 'var(--ds-color-text-muted, #94A3B8)',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
              title="Refresh Data"
            >
              🔄
            </button>
          )}

          {isCollapsible && (
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="ds-interactive ds-spring-press"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.1))',
                borderRadius: '6px',
                padding: '3px 7px',
                color: 'var(--ds-color-text-muted, #94A3B8)',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
              title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
            >
              {isCollapsed ? '▾' : '▴'}
            </button>
          )}
        </div>
      </div>

      {/* Panel Body */}
      {!isCollapsed && (
        <div style={{ flex: '1 1 auto', overflow: 'hidden' }}>
          {children}
        </div>
      )}

      {/* Optional Footer Strip */}
      {!isCollapsed && footerSlot && (
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.08))',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            fontSize: '0.75rem',
            color: 'var(--ds-color-text-muted, #94A3B8)'
          }}
        >
          {footerSlot}
        </div>
      )}
    </div>
  );
};
