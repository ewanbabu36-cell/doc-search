import React from 'react';
import { useEffectIntensity } from './EffectIntensityContext';

export interface ScanEffectProps {
  active?: boolean;
  color?: string;
  direction?: 'horizontal' | 'vertical';
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const ScanEffect: React.FC<ScanEffectProps> = ({
  active = false,
  color = '#06B6D4',
  direction = 'horizontal',
  speed = 2.2,
  className = '',
  style = {}
}) => {
  const { prefersReducedMotion } = useEffectIntensity();

  // Strictly only render when actively processing
  if (!active || prefersReducedMotion) return null;

  const isHorizontal = direction === 'horizontal';

  return (
    <div
      className={`ds-scan-container ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 5,
        borderRadius: 'inherit',
        ...style
      }}
    >
      <div
        style={{
          position: 'absolute',
          ...(isHorizontal
            ? {
                top: 0,
                bottom: 0,
                width: '60px',
                background: `linear-gradient(90deg, transparent 0%, ${color}20 50%, ${color}60 90%, #FFFFFF 100%)`,
                boxShadow: `0 0 16px ${color}80`,
                animation: `ds-scan-horizontal ${speed}s linear infinite`
              }
            : {
                left: 0,
                right: 0,
                height: '60px',
                background: `linear-gradient(180deg, transparent 0%, ${color}20 50%, ${color}60 90%, #FFFFFF 100%)`,
                boxShadow: `0 0 16px ${color}80`,
                animation: `ds-scan-vertical ${speed}s linear infinite`
              })
        }}
      />
    </div>
  );
};
