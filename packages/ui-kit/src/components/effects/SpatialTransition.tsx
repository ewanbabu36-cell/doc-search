import React, { useState, useEffect, useRef } from 'react';
import { useEffectIntensity } from './EffectIntensityContext';

export interface SpatialTransitionProps {
  transitionKey: string | number;
  duration?: number; // ms, default 240ms (180-350ms target)
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const SpatialTransition: React.FC<SpatialTransitionProps> = ({
  transitionKey,
  duration = 240,
  children,
  className = '',
  style = {}
}) => {
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const prevKeyRef = useRef<string | number>(transitionKey);
  const { prefersReducedMotion } = useEffectIntensity();

  useEffect(() => {
    if (prefersReducedMotion) {
      prevKeyRef.current = transitionKey;
      return;
    }

    if (prevKeyRef.current !== transitionKey) {
      prevKeyRef.current = transitionKey;
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, duration);
      return () => clearTimeout(timer);
    }
    return () => {};
  }, [transitionKey, duration, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return <div className={className} style={style}>{children}</div>;
  }

  return (
    <div
      className={`ds-spatial-transition ${className}`}
      style={{
        opacity: isTransitioning ? 0.88 : 1,
        transform: isTransitioning ? 'scale(0.996) translateY(2px)' : 'scale(1) translateY(0)',
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        ...style
      }}
    >
      {children}
    </div>
  );
};
