import React, { createContext, useContext, useState, useMemo } from 'react';

export type EffectIntensityLevel = 'operational' | 'management' | 'command';
export type EffectIntensity = EffectIntensityLevel | 1 | 2 | 3;

export interface EffectIntensityContextValue {
  intensity: 1 | 2 | 3;
  level: EffectIntensityLevel;
  setIntensity: (intensity: EffectIntensity) => void;
  isOperational: boolean;
  isManagement: boolean;
  isCommand: boolean;
  canUse3D: boolean;
  canUseParticles: boolean;
  prefersReducedMotion: boolean;
}

const normalizeIntensity = (input: EffectIntensity): { intensity: 1 | 2 | 3; level: EffectIntensityLevel } => {
  if (input === 1 || input === 'operational') return { intensity: 1, level: 'operational' };
  if (input === 2 || input === 'management') return { intensity: 2, level: 'management' };
  return { intensity: 3, level: 'command' };
};

const EffectIntensityContext = createContext<EffectIntensityContextValue>({
  intensity: 2,
  level: 'management',
  setIntensity: () => {},
  isOperational: false,
  isManagement: true,
  isCommand: false,
  canUse3D: true,
  canUseParticles: true,
  prefersReducedMotion: false
});

export interface EffectIntensityProviderProps {
  initialIntensity?: EffectIntensity;
  children: React.ReactNode;
}

export const EffectIntensityProvider: React.FC<EffectIntensityProviderProps> = ({
  initialIntensity = 'management',
  children
}) => {
  const [currentIntensity, setCurrentIntensity] = useState<EffectIntensity>(initialIntensity);

  // Check prefers-reduced-motion media query
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const { intensity, level } = useMemo(() => normalizeIntensity(currentIntensity), [currentIntensity]);

  const value = useMemo<EffectIntensityContextValue>(() => {
    const isOperational = intensity === 1;
    const isManagement = intensity === 2;
    const isCommand = intensity === 3;

    return {
      intensity,
      level,
      setIntensity: setCurrentIntensity,
      isOperational,
      isManagement,
      isCommand,
      canUse3D: !prefersReducedMotion && (isManagement || isCommand),
      canUseParticles: !prefersReducedMotion && isCommand,
      prefersReducedMotion
    };
  }, [intensity, level, prefersReducedMotion]);

  return (
    <EffectIntensityContext.Provider value={value}>
      <div data-fx-intensity={intensity} data-fx-level={level} style={{ display: 'contents' }}>
        {children}
      </div>
    </EffectIntensityContext.Provider>
  );
};

export const useEffectIntensity = (): EffectIntensityContextValue => {
  return useContext(EffectIntensityContext);
};
