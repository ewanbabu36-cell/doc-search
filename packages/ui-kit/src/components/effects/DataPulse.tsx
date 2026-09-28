import React from 'react';
import { useEffectIntensity } from './EffectIntensityContext';

export type DataPulseStatus = 'online' | 'processing' | 'active' | 'critical' | 'standby';

export interface DataPulseProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: DataPulseStatus;
  color?: string;
  label?: string;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

const STATUS_MAP: Record<DataPulseStatus, { color: string; label: string }> = {
  online: { color: '#10B981', label: 'System Online' },
  processing: { color: '#06B6D4', label: 'Processing' },
  active: { color: '#38BDF8', label: 'Active' },
  critical: { color: '#EF4444', label: 'Critical' },
  standby: { color: '#94A3B8', label: 'Standby' }
};

export const DataPulse: React.FC<DataPulseProps> = ({
  status = 'online',
  color,
  label,
  pulse = true,
  size = 'md',
  className = '',
  style = {},
  children,
  ...restProps
}) => {
  const { prefersReducedMotion } = useEffectIntensity();

  const cfg = STATUS_MAP[status] || STATUS_MAP.online;
  const activeColor = color || cfg.color;
  const activeLabel = label || cfg.label;

  const dotSize = size === 'sm' ? 6 : size === 'lg' ? 10 : 8;
  const fontSize = size === 'sm' ? '0.6875rem' : size === 'lg' ? '0.875rem' : '0.75rem';

  return (
    <span
      className={`ds-data-pulse ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize,
        fontWeight: 700,
        color: '#E2E8F0',
        ...style
      }}
      {...restProps}
    >
      <span
        style={{
          position: 'relative',
          display: 'inline-flex',
          width: dotSize,
          height: dotSize
        }}
      >
        {pulse && !prefersReducedMotion && (
          <span
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              backgroundColor: activeColor,
              opacity: 0.6,
              animation: 'ds-pulse-dot 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
          />
        )}
        <span
          style={{
            position: 'relative',
            display: 'inline-block',
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            backgroundColor: activeColor,
            boxShadow: `0 0 8px ${activeColor}`
          }}
        />
      </span>
      {children || <span>{activeLabel}</span>}
    </span>
  );
};
