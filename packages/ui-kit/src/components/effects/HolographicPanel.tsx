import React from 'react';
import { GlassSurface } from './GlassSurface';

export interface HolographicPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  systemCode?: string;
  status?: string;
  statusColor?: string;
  cornerAccents?: boolean;
  headerSlot?: React.ReactNode;
  children?: React.ReactNode;
}

export const HolographicPanel: React.FC<HolographicPanelProps> = ({
  title,
  systemCode,
  status = 'NOMINAL',
  statusColor = '#06B6D4',
  cornerAccents = true,
  headerSlot,
  className = '',
  style = {},
  children,
  ...restProps
}) => {
  return (
    <GlassSurface
      depth="card"
      className={`ds-holographic-panel ${className}`}
      style={{
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        ...style
      }}
      {...restProps}
    >
      {/* Subtle Technical Corner Brackets */}
      {cornerAccents && (
        <>
          <span className="ds-hud-bracket top-left" />
          <span className="ds-hud-bracket top-right" />
          <span className="ds-hud-bracket bottom-left" />
          <span className="ds-hud-bracket bottom-right" />
        </>
      )}

      {/* Panel HUD Header Bar (optional) */}
      {(title || systemCode || status || headerSlot) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            backgroundColor: 'rgba(255, 255, 255, 0.015)',
            fontSize: '0.75rem',
            gap: '8px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {systemCode && (
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.625rem',
                  fontWeight: 800,
                  color: '#64748B',
                  letterSpacing: '0.06em'
                }}
              >
                [{systemCode}]
              </span>
            )}
            {title && (
              <span
                style={{
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: '#F8FAFC',
                  textTransform: 'uppercase'
                }}
              >
                {title}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {headerSlot}
            {status && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: statusColor,
                  backgroundColor: `${statusColor}15`,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: `1px solid ${statusColor}35`
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    backgroundColor: statusColor,
                    boxShadow: `0 0 5px ${statusColor}`
                  }}
                />
                {status}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Body */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </GlassSurface>
  );
};
