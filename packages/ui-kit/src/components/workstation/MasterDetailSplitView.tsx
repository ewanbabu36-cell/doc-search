import React, { useState } from 'react';

export interface MasterDetailSplitViewProps {
  masterTitle?: React.ReactNode;
  masterSubtitle?: React.ReactNode;
  masterActions?: React.ReactNode;
  masterContent: React.ReactNode;
  detailTitle?: React.ReactNode;
  detailSubtitle?: React.ReactNode;
  detailActions?: React.ReactNode;
  detailContent: React.ReactNode;
  emptyDetailMessage?: string;
  hasSelection?: boolean;
  masterWidth?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const MasterDetailSplitView: React.FC<MasterDetailSplitViewProps> = ({
  masterTitle,
  masterSubtitle,
  masterActions,
  masterContent,
  detailTitle,
  detailSubtitle,
  detailActions,
  detailContent,
  emptyDetailMessage = 'Select an item from the list to inspect clinical records and telemetry details.',
  hasSelection = true,
  masterWidth = '380px',
  className = '',
  style = {}
}) => {
  const [isMasterCollapsed, setIsMasterCollapsed] = useState(false);

  return (
    <div
      className={`ds-split-view ${className}`}
      style={{
        display: 'flex',
        width: '100%',
        minHeight: '520px',
        backgroundColor: 'var(--ds-color-bg, #0D1117)',
        border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.1))',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: 'var(--ds-shadow-base, 0 2px 8px rgba(0, 0, 0, 0.3))',
        ...style
      }}
    >
      {/* Master Left Pane */}
      <div
        className="ds-master-pane"
        style={{
          width: isMasterCollapsed ? '48px' : masterWidth,
          flexShrink: 0,
          borderRight: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.1))',
          backgroundColor: 'var(--ds-surface-l2, rgba(22, 27, 34, 0.95))',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 140ms cubic-bezier(0.1, 0.9, 0.2, 1)',
          overflow: 'hidden'
        }}
      >
        {/* Master Header */}
        <div
          style={{
            padding: '12px 14px',
            borderBottom: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexShrink: 0
          }}
        >
          {!isMasterCollapsed && (
            <div style={{ minWidth: 0, flex: '1 1 auto' }}>
              {masterTitle && (
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ds-color-text-primary, #F8FAFC)' }}>
                  {masterTitle}
                </div>
              )}
              {masterSubtitle && (
                <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #94A3B8)', marginTop: '2px' }}>
                  {masterSubtitle}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: 'auto' }}>
            {!isMasterCollapsed && masterActions}
            <button
              type="button"
              onClick={() => setIsMasterCollapsed(!isMasterCollapsed)}
              className="ds-interactive ds-spring-press"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.1))',
                borderRadius: '6px',
                padding: '4px 6px',
                color: 'var(--ds-color-text-muted, #94A3B8)',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
              title={isMasterCollapsed ? 'Expand List' : 'Collapse List'}
            >
              {isMasterCollapsed ? '▶' : '◀'}
            </button>
          </div>
        </div>

        {/* Master Content Area */}
        {!isMasterCollapsed && (
          <div
            style={{
              flex: '1 1 auto',
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '6px'
            }}
          >
            {masterContent}
          </div>
        )}
      </div>

      {/* Detail Right Pane */}
      <div
        className="ds-detail-pane"
        style={{
          flex: '1 1 auto',
          minWidth: 0,
          backgroundColor: 'var(--ds-surface-l1, #0D1117)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {hasSelection ? (
          <>
            {/* Detail Header */}
            <div
              style={{
                padding: '12px 20px',
                borderBottom: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.1))',
                backgroundColor: 'var(--ds-surface-l2, rgba(22, 27, 34, 0.75))',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
                flexShrink: 0
              }}
            >
              <div>
                {detailTitle && (
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ds-color-text-primary, #F8FAFC)' }}>
                    {detailTitle}
                  </div>
                )}
                {detailSubtitle && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--ds-color-text-muted, #94A3B8)', marginTop: '2px' }}>
                    {detailSubtitle}
                  </div>
                )}
              </div>

              {detailActions && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {detailActions}
                </div>
              )}
            </div>

            {/* Detail Body */}
            <div
              style={{
                flex: '1 1 auto',
                overflowY: 'auto',
                padding: '18px 22px'
              }}
            >
              {detailContent}
            </div>
          </>
        ) : (
          <div
            style={{
              flex: '1 1 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              textAlign: 'center',
              color: 'var(--ds-color-text-muted, #94A3B8)'
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '14px', opacity: 0.6 }}>📋</div>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: '#F1F5F9', marginBottom: '6px' }}>
              No Item Selected
            </div>
            <div style={{ fontSize: '0.875rem', maxWidth: '380px', lineHeight: 1.5 }}>
              {emptyDetailMessage}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
