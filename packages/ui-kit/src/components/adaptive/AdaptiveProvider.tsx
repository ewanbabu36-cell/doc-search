import React, { createContext, useContext, useState, useEffect } from 'react';

export type DeviceClass = 'mobile' | 'tablet' | 'desktop';
export type ScreenOrientation = 'portrait' | 'landscape';

export interface AdaptiveContextValue {
  deviceClass: DeviceClass;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  orientation: ScreenOrientation;
  screenWidth: number;
  screenHeight: number;
}

const defaultAdaptiveValue: AdaptiveContextValue = {
  deviceClass: 'desktop',
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isTouch: false,
  orientation: 'landscape',
  screenWidth: 1440,
  screenHeight: 900
};

const AdaptiveContext = createContext<AdaptiveContextValue>(defaultAdaptiveValue);

export interface AdaptiveProviderProps {
  children: React.ReactNode;
}

export const AdaptiveProvider: React.FC<AdaptiveProviderProps> = ({ children }) => {
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveContextValue>(() => {
    if (typeof window === 'undefined') return defaultAdaptiveValue;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    const orientation: ScreenOrientation = width > height ? 'landscape' : 'portrait';

    let deviceClass: DeviceClass = 'desktop';
    if (width < 768) {
      deviceClass = 'mobile';
    } else if (width <= 1024) {
      deviceClass = 'tablet';
    }

    return {
      deviceClass,
      isMobile: deviceClass === 'mobile',
      isTablet: deviceClass === 'tablet',
      isDesktop: deviceClass === 'desktop',
      isTouch,
      orientation,
      screenWidth: width,
      screenHeight: height
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
      const orientation: ScreenOrientation = width > height ? 'landscape' : 'portrait';

      let deviceClass: DeviceClass = 'desktop';
      if (width < 768) {
        deviceClass = 'mobile';
      } else if (width <= 1024) {
        deviceClass = 'tablet';
      }

      setAdaptiveState({
        deviceClass,
        isMobile: deviceClass === 'mobile',
        isTablet: deviceClass === 'tablet',
        isDesktop: deviceClass === 'desktop',
        isTouch,
        orientation,
        screenWidth: width,
        screenHeight: height
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return (
    <AdaptiveContext.Provider value={adaptiveState}>
      {children}
    </AdaptiveContext.Provider>
  );
};

export const useAdaptiveLayout = (): AdaptiveContextValue => {
  const context = useContext(AdaptiveContext);
  if (!context) {
    return defaultAdaptiveValue;
  }
  return context;
};
