import React, { useRef, useState, useCallback } from 'react';
import { useEffectIntensity } from './EffectIntensityContext';

export interface FloatingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  maxTilt?: number;
  lift?: number;
  lightReflection?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const FloatingCard: React.FC<FloatingCardProps> = ({
  maxTilt = 3.5,
  lift = -2,
  lightReflection = true,
  disabled = false,
  className = '',
  style = {},
  children,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  ...restProps
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<string>('none');
  const [sheenPosition, setSheenPosition] = useState<{ x: number; y: number; opacity: number }>({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const { isOperational, prefersReducedMotion } = useEffectIntensity();
  const shouldDisable3D = disabled || isOperational || prefersReducedMotion;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldDisable3D || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    const tiltX = ((y / rect.height) - 0.5) * -maxTilt;
    const tiltY = ((x / rect.width) - 0.5) * maxTilt;

    setTransform(`perspective(1000px) translateY(${lift}px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`);
    setSheenPosition({ x: xPercent, y: yPercent, opacity: 0.12 });

    onMouseMove?.(e);
  }, [shouldDisable3D, maxTilt, lift, onMouseMove]);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(true);
    if (!shouldDisable3D) {
      setTransform(`perspective(1000px) translateY(${lift}px)`);
    }
    onMouseEnter?.(e);
  }, [shouldDisable3D, lift, onMouseEnter]);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(false);
    setTransform('none');
    setSheenPosition({ x: 50, y: 50, opacity: 0 });
    onMouseLeave?.(e);
  }, [onMouseLeave]);

  return (
    <div
      ref={cardRef}
      className={`ds-floating-card ${className}`}
      style={{
        position: 'relative',
        transform: shouldDisable3D ? (isHovered ? `translateY(${lift}px)` : 'none') : transform,
        transformStyle: 'preserve-3d',
        transition: isHovered ? 'transform 0.08s ease-out, box-shadow 0.15s ease' : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease',
        boxShadow: isHovered
          ? '0 12px 32px rgba(0, 0, 0, 0.55), 0 0 16px rgba(6, 182, 212, 0.12)'
          : '0 4px 16px rgba(0, 0, 0, 0.35)',
        willChange: isHovered ? 'transform' : 'auto',
        ...style
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...restProps}
    >
      {/* Soft Specular Light Reflection Overlay */}
      {lightReflection && !shouldDisable3D && sheenPosition.opacity > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            pointerEvents: 'none',
            background: `radial-gradient(circle at ${sheenPosition.x}% ${sheenPosition.y}%, rgba(255, 255, 255, ${sheenPosition.opacity}) 0%, transparent 60%)`,
            zIndex: 1,
            transition: 'opacity 0.2s ease'
          }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
};
