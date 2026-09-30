import React from 'react';
import { useEffectIntensity } from './EffectIntensityContext';

export type GlassDepth = 'base' | 'workspace' | 'card' | 'elevated' | 'modal' | 'critical';

export interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  depth?: GlassDepth;
  blur?: number;
  glow?: boolean | string;
  specularEdge?: boolean;
  children?: React.ReactNode;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  depth = 'card',
  blur,
  glow,
  specularEdge = true,
  className = '',
  style = {},
  children,
  ...restProps
}) => {
  const { isOperational } = useEffectIntensity();

  // Controlled blur & background based on depth and operational intensity
  const getGlassStyles = (): React.CSSProperties => {
    switch (depth) {
      case 'base':
        return {
          backgroundColor: 'var(--ds-surface-l1, #0B0F17)',
          border: 'none',
          boxShadow: 'none'
        };
      case 'workspace':
        return {
          backgroundColor: isOperational ? 'var(--ds-surface-l2, #121826)' : 'rgba(18, 24, 38, 0.72)',
          backdropFilter: isOperational ? 'none' : `blur(${blur ?? 20}px) saturate(180%)`,
          WebkitBackdropFilter: isOperational ? 'none' : `blur(${blur ?? 20}px) saturate(180%)`,
          border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))'
        };
      case 'elevated':
        return {
          backgroundColor: isOperational ? 'var(--ds-surface-l4, #182234)' : 'var(--ds-surface-l4, rgba(24, 34, 52, 0.88))',
          backdropFilter: isOperational ? 'none' : `blur(${blur ?? 24}px) saturate(180%)`,
          WebkitBackdropFilter: isOperational ? 'none' : `blur(${blur ?? 24}px) saturate(180%)`,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: `0 16px 40px -8px rgba(0, 0, 0, 0.5), ${specularEdge ? 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12)' : ''}`
        };
      case 'modal':
        return {
          backgroundColor: isOperational ? 'var(--ds-surface-l4, #121826)' : 'var(--ds-surface-l4, rgba(18, 24, 38, 0.94))',
          backdropFilter: isOperational ? 'none' : `blur(${blur ?? 32}px) saturate(190%)`,
          WebkitBackdropFilter: isOperational ? 'none' : `blur(${blur ?? 32}px) saturate(190%)`,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: `0 24px 64px -12px rgba(0, 0, 0, 0.75), 0 8px 24px -4px rgba(0, 0, 0, 0.35), ${specularEdge ? 'inset 0 1px 0 0 rgba(255, 255, 255, 0.15)' : ''}`
        };
      case 'critical':
        return {
          backgroundColor: isOperational ? 'rgba(239, 68, 68, 0.16)' : 'rgba(239, 68, 68, 0.1)',
          backdropFilter: isOperational ? 'none' : `blur(${blur ?? 20}px)`,
          WebkitBackdropFilter: isOperational ? 'none' : `blur(${blur ?? 20}px)`,
          border: '1px solid rgba(239, 68, 68, 0.4)',
          boxShadow: '0 8px 28px -4px rgba(239, 68, 68, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        };
      case 'card':
      default:
        return {
          backgroundColor: isOperational ? 'var(--ds-surface-l2, #121826)' : 'var(--ds-surface-l3, rgba(18, 24, 38, 0.75))',
          backdropFilter: isOperational ? 'none' : `blur(${blur ?? 20}px) saturate(180%)`,
          WebkitBackdropFilter: isOperational ? 'none' : `blur(${blur ?? 20}px) saturate(180%)`,
          border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))',
          boxShadow: `0 4px 20px -2px rgba(0, 0, 0, 0.3), ${specularEdge ? 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)' : ''}`
        };
    }
  };

  const glowStyle: React.CSSProperties = typeof glow === 'string'
    ? { boxShadow: `0 4px 24px -2px ${glow}` }
    : glow
    ? { boxShadow: '0 4px 24px -2px rgba(2, 132, 199, 0.25)' }
    : {};

  return (
    <div
      className={`ds-glass-surface ${className}`}
      style={{
        borderRadius: depth === 'modal' ? '24px' : '16px',
        position: 'relative',
        transition: 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        ...getGlassStyles(),
        ...glowStyle,
        ...style
      }}
      {...restProps}
    >
      {children}
    </div>
  );
};
