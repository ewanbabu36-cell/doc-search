import React from 'react';
import { useEffectIntensity } from './EffectIntensityContext';

export interface GlowEffectProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
  intensity?: 'subtle' | 'moderate' | 'high';
  pulse?: boolean;
  active?: boolean;
  blur?: number;
  children?: React.ReactNode;
}

export const GlowEffect: React.FC<GlowEffectProps> = ({
  color = 'rgba(6, 182, 212, 0.4)',
  intensity = 'subtle',
  pulse = false,
  active = true,
  blur,
  className = '',
  style = {},
  children,
  ...restProps
}) => {
  const { isOperational, prefersReducedMotion } = useEffectIntensity();

  if (!active) {
    return (
      <div className={className} style={style} {...restProps}>
        {children}
      </div>
    );
  }

  // Calculate blur radius & spread based on intensity
  const blurRadius = blur ?? (intensity === 'subtle' ? 12 : intensity === 'moderate' ? 20 : 28);
  const opacity = isOperational ? 0.3 : intensity === 'subtle' ? 0.5 : intensity === 'moderate' ? 0.75 : 1;

  const glowShadow = `0 0 ${blurRadius}px ${color}`;

  return (
    <div
      className={`ds-glow-container ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        boxShadow: glowShadow,
        opacity,
        animation: pulse && !prefersReducedMotion ? 'ds-breathe-glow 2.8s ease-in-out infinite alternate' : 'none',
        transition: 'box-shadow 0.2s ease, opacity 0.2s ease',
        ...style
      }}
      {...restProps}
    >
      {children}
    </div>
  );
};
