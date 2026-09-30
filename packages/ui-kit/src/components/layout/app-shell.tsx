import React from 'react';
import { UniversalBackground } from '../effects/UniversalBackground';
import { EffectIntensityProvider, type EffectIntensityLevel } from '../effects/EffectIntensityContext';

export interface AppShellProps {
  header?: React.ReactNode | undefined;
  sidebar?: React.ReactNode | undefined;
  children: React.ReactNode;
  className?: string | undefined;
  showBackground?: boolean | undefined;
  showGrid?: boolean | undefined;
  showParticles?: boolean | undefined;
  intensity?: EffectIntensityLevel | undefined;
  isMobileDrawerOpen?: boolean | undefined;
  onCloseMobileDrawer?: (() => void) | undefined;
}

export const AppShell: React.FC<AppShellProps> = ({
  header,
  sidebar,
  children,
  className = '',
  showBackground = true,
  showGrid = true,
  showParticles = true,
  intensity,
  isMobileDrawerOpen = false,
  onCloseMobileDrawer
}) => {
  // Close mobile drawer on Escape key press
  React.useEffect(() => {
    if (!isMobileDrawerOpen || !onCloseMobileDrawer) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobileDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileDrawerOpen, onCloseMobileDrawer]);

  const shellContent = (
    <div
      className={`ds-app-shell ${className}`}
      style={{
        display: 'flex',
        height: '100vh',
        maxHeight: '100vh',
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden',
        backgroundColor: showBackground ? 'transparent' : 'var(--ds-color-bg)'
      }}
    >
      {/* 1. Desktop / Tablet Sidebar (Hidden on < 768px via responsive CSS) */}
      {sidebar && (
        <div className="ds-app-shell-sidebar-desktop">
          {sidebar}
        </div>
      )}

      {/* 2. Mobile Off-Canvas Drawer (< 768px) with Backdrop */}
      {sidebar && (
        <div
          className={`ds-app-shell-sidebar-mobile ${isMobileDrawerOpen ? 'ds-mobile-drawer-open' : ''}`}
          aria-hidden={!isMobileDrawerOpen}
        >
          {/* Touch-to-dismiss Backdrop */}
          <div
            className="ds-mobile-drawer-backdrop"
            onClick={onCloseMobileDrawer}
          />
          {/* Slide-In Drawer Container */}
          <div className="ds-mobile-drawer-content">
            <div className="ds-mobile-drawer-close-row">
              <button
                type="button"
                className="ds-mobile-drawer-close-btn"
                onClick={onCloseMobileDrawer}
                aria-label="Close navigation menu"
              >
                ✕
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      )}

      {/* Main Workspace Column */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: '1 1 0%',
          minWidth: 0,
          height: '100vh',
          maxHeight: '100vh',
          width: '100%',
          overflowX: 'hidden',
          overflowY: 'auto'
        }}
      >
        {header && (
          <div style={{ flexShrink: 0, zIndex: 1000, width: '100%', position: 'sticky', top: 0 }}>
            {header}
          </div>
        )}
        <div
          style={{
            flex: '1 1 auto',
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            width: '100%'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );

  const wrappedWithBg = showBackground ? (
    <UniversalBackground showGrid={showGrid} showParticles={showParticles} style={{ height: '100vh', maxHeight: '100vh', overflow: 'hidden' }}>
      {shellContent}
    </UniversalBackground>
  ) : (
    shellContent
  );

  if (intensity) {
    return <EffectIntensityProvider initialIntensity={intensity}>{wrappedWithBg}</EffectIntensityProvider>;
  }

  return wrappedWithBg;
};

