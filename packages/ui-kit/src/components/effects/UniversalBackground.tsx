import React from 'react';
import { useEffectIntensity } from './EffectIntensityContext';
import { ParticleNetwork } from './ParticleNetwork';

export interface UniversalBackgroundProps {
  children?: React.ReactNode;
  showGrid?: boolean;
  showParticles?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const UniversalBackground: React.FC<UniversalBackgroundProps> = ({
  children,
  showGrid = true,
  showParticles = true,
  className = '',
  style = {}
}) => {
  const { isCommand, canUseParticles, prefersReducedMotion } = useEffectIntensity();

  return (
    <div
      className={`ds-universal-bg ${className}`}
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--ds-color-bg, #0B0F17)',
        overflowX: 'hidden',
        ...style
      }}
    >
      {/* Layer 1: Ambient Radial Light Sweeps */}
      <div
        className="ds-ambient-lighting"
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
          opacity: isCommand ? 0.9 : 0.6
        }}
      >
        {/* Top-Left Cerulean Radial Aura */}
        <div
          style={{
            position: 'absolute',
            top: '-20vw',
            left: '-10vw',
            width: '60vw',
            height: '60vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(2, 132, 199, 0.08) 0%, rgba(2, 132, 199, 0) 70%)',
            filter: 'blur(60px)',
            transform: 'translateZ(0)'
          }}
        />

        {/* Bottom-Right Indigo Radial Aura */}
        <div
          style={{
            position: 'absolute',
            bottom: '-25vw',
            right: '-15vw',
            width: '70vw',
            height: '70vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, rgba(99, 102, 241, 0) 70%)',
            filter: 'blur(80px)',
            transform: 'translateZ(0)'
          }}
        />
      </div>

      {/* Layer 2: Subtle Technical Grid Pattern */}
      {showGrid && (
        <div
          className="ds-technical-grid"
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 1,
            backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.018) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(255, 255, 255, 0.018) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 60%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 60%, transparent 100%)'
          }}
        />
      )}

      {/* Layer 3: Optional Ambient Particle Network (Command Intensity Only) */}
      {showParticles && isCommand && canUseParticles && !prefersReducedMotion && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 2,
            opacity: 0.35
          }}
        >
          <ParticleNetwork particleCount={25} maxDistance={100} />
        </div>
      )}

      {/* Layer 4: Content Workspace Layer */}
      <div
        className="ds-workspace-content"
        style={{
          position: 'relative',
          zIndex: 10,
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </div>
    </div>
  );
};
