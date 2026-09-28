import React, { useState, useEffect } from 'react';
import { useEffectIntensity } from './EffectIntensityContext';

export interface LightSweepProps {
  trigger?: 'hover' | 'active' | 'manual';
  sweep?: boolean;
  color?: string;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const LightSweep: React.FC<LightSweepProps> = ({
  trigger = 'hover',
  sweep = false,
  color = 'rgba(255, 255, 255, 0.25)',
  duration = 0.75,
  className = '',
  style = {}
}) => {
  const [isSweeping, setIsSweeping] = useState<boolean>(false);
  const { prefersReducedMotion } = useEffectIntensity();

  useEffect(() => {
    if (trigger === 'manual' || trigger === 'active') {
      if (sweep) {
        setIsSweeping(true);
        const timer = setTimeout(() => setIsSweeping(false), duration * 1000);
        return () => clearTimeout(timer);
      }
    }
    return () => {};
  }, [sweep, trigger, duration]);

  if (prefersReducedMotion) return null;

  return (
    <div
      className={`ds-light-sweep-container ${className} ${trigger === 'hover' ? 'ds-sweep-on-hover' : ''}`}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        borderRadius: 'inherit',
        zIndex: 4,
        ...style
      }}
    >
      <div
        className={`ds-light-sweep-bar ${isSweeping ? 'ds-sweeping' : ''}`}
        style={{
          position: 'absolute',
          top: '-50%',
          bottom: '-50%',
          width: '60px',
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          transform: 'rotate(25deg)',
          transition: `transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1)`,
          opacity: isSweeping || trigger === 'hover' ? 1 : 0
        }}
      />
    </div>
  );
};
