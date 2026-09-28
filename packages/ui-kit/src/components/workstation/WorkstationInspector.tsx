import React from 'react';

export interface WorkstationInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  width?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const WorkstationInspector: React.FC<WorkstationInspectorProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  actions,
  children,
  width = '360px',
  className = '',
  style = {}
}) => {
  if (!isOpen) return null;

  return (
    <aside
      className={`ds-inspector-pane ${className}`}
      style={{
        width,
        flexShrink: 0,
        backgroundColor: 'var(--ds-surface-l3, rgba(22, 27, 34, 0.95))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderLeft: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.1))',
        boxShadow: 'var(--ds-shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.4))',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        zIndex: 25,
        ...style
      }}
    >
      {/* Inspector Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.08))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          flexShrink: 0
        }}
      >
        <div style={{ minWidth: 0, flex: '1 1 auto' }}>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ds-color-text-primary, #F8FAFC)' }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #94A3B8)', marginTop: '2px' }}>
              {subtitle}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {actions}
          <button
            type="button"
            onClick={onClose}
            className="ds-interactive ds-spring-press"
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--ds-color-text-muted, #94A3B8)',
              padding: '4px 6px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              lineHeight: 1
            }}
            title="Close Inspector"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Inspector Body */}
      <div
        style={{
          flex: '1 1 auto',
          overflowY: 'auto',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {children}
      </div>
    </aside>
  );
};
