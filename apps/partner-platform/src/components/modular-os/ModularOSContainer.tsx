import React, { useState, useEffect } from 'react';
import { useWorkspaceLayout } from './hooks/useWorkspaceLayout.js';
import { IOSStatusBar } from './ios/IOSStatusBar.js';
import { IOSSpringboard } from './ios/IOSSpringboard.js';
import { IOSDock } from './ios/IOSDock.js';
import { IOSSpotlightSearch } from './ios/IOSSpotlightSearch.js';
import { IOSControlCenter } from './ios/IOSControlCenter.js';
import { IOSAppLibrary } from './ios/IOSAppLibrary.js';
import { IOSAppWindow } from './ios/IOSAppWindow.js';
import { WallpaperEngineModal, WALLPAPER_PRESETS } from './wallpaper/WallpaperEngine.js';
import { FEATURE_REGISTRY, type ModularFeatureAction } from './registry/feature-registry.js';

export interface ModularOSContainerProps {
  children?: React.ReactNode;
  activeContextType?: 'CLINICAL' | 'CASHIER' | 'EMERGENCY';
  hospitalName?: string;
  staffName?: string;
  staffRole?: string;
  onLockScreen?: () => void;
  onSelectModuleRoute?: (route: string) => void;
}

export const ModularOSContainer: React.FC<ModularOSContainerProps> = ({
  children,
  activeContextType = 'CLINICAL',
  hospitalName = 'DocSearch Apollo Medical Center',
  staffName = 'Dr. Apollo (Chief Medical Officer)',
  staffRole = 'Chief Medical Officer',
  onLockScreen,
  onSelectModuleRoute,
}) => {
  const {
    dockItems,
    desktopIcons,
    wallpaperId,
    customWallpaperUrl,
    wallpaperBlurPx,
    isWallpaperModalOpen,
    isEditMode: isJiggleMode,
    setIsWallpaperModalOpen,
    setIsEditMode: setIsJiggleMode,
    removeFromDock,
    addToDesktop,
    removeFromDesktop,
    setWallpaperPreset,
    setCustomWallpaper,
    setWallpaperBlur,
  } = useWorkspaceLayout();

  const [isSpotlightOpen, setIsSpotlightOpen] = useState<boolean>(false);
  const [isControlCenterOpen, setIsControlCenterOpen] = useState<boolean>(false);
  const [isAppLibraryOpen, setIsAppLibraryOpen] = useState<boolean>(false);
  const [activeAppAction, setActiveAppAction] = useState<ModularFeatureAction | null>(null);

  // Global keyboard shortcuts (Cmd+K / Ctrl+K for Spotlight)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSpotlightOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Map dock slot items to feature actions
  const dockActions: ModularFeatureAction[] = dockItems
    .map((item) => item.action || FEATURE_REGISTRY.find((a) => a.id === item.id || a.id === item.actionId))
    .filter((a): a is ModularFeatureAction => Boolean(a));

  // Fallback default dock actions if empty
  const effectiveDockActions: ModularFeatureAction[] =
    dockActions.length > 0
      ? dockActions
      : FEATURE_REGISTRY.filter((a) =>
          ['clinical_opd_queue', 'clinical_rx_pad', 'ipd_bed_census', 'billing_cashier_desk', 'emergency_manchester_triage'].includes(a.id)
        );

  const handleLaunchApp = (action: ModularFeatureAction) => {
    setActiveAppAction(action);
    if (onSelectModuleRoute) {
      onSelectModuleRoute(action.route);
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', action.route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleCloseActiveApp = () => {
    setActiveAppAction(null);
  };

  // Active Wallpaper Style
  const activePreset = WALLPAPER_PRESETS.find((p) => p.id === wallpaperId) || WALLPAPER_PRESETS[0]!;
  const wallpaperBackgroundStyle: React.CSSProperties = customWallpaperUrl
    ? {
        backgroundImage: `url(${customWallpaperUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: activePreset.gradientCss,
      };

  return (
    <div
      className="relative min-h-screen text-slate-100 flex flex-col font-sans select-none overflow-x-hidden transition-all duration-500"
      style={wallpaperBackgroundStyle}
    >
      {/* Acrylic Glass Blur Overlay */}
      {wallpaperBlurPx > 0 && (
        <div
          className="fixed inset-0 pointer-events-none z-0 backdrop-blur-md"
          style={{ backdropFilter: `blur(${wallpaperBlurPx}px)` }}
        />
      )}

      {/* 1. iOS Top Status Bar & Dynamic Island */}
      <IOSStatusBar
        hospitalName={hospitalName}
        onOpenControlCenter={() => setIsControlCenterOpen(true)}
        onOpenWallpaperModal={() => setIsWallpaperModalOpen(true)}
        activeContextType={activeContextType}
      />

      {/* 2. Apple iOS Springboard Canvas (Active when no app window is open) */}
      {!activeAppAction && (
        <main className="relative z-10 flex-1 pt-12 pb-32 max-w-7xl mx-auto w-full">
          <IOSSpringboard
            desktopIcons={desktopIcons}
            onLaunchApp={handleLaunchApp}
            onRemoveFromDesktop={removeFromDesktop}
            onOpenSpotlight={() => setIsSpotlightOpen(true)}
            isJiggleMode={isJiggleMode}
            onSetJiggleMode={setIsJiggleMode}
            onOpenAppLibrary={() => setIsAppLibraryOpen(true)}
          />
        </main>
      )}

      {/* 3. Floating Frosted Glass iPadOS / iOS Dock */}
      {!activeAppAction && (
        <IOSDock
          dockActions={effectiveDockActions}
          onLaunchApp={handleLaunchApp}
          onOpenAppLibrary={() => setIsAppLibraryOpen(true)}
          isJiggleMode={isJiggleMode}
          onStartJiggle={() => setIsJiggleMode(true)}
          onRemoveFromDock={removeFromDock}
        />
      )}

      {/* 4. Active iOS App Window (When an app is launched) */}
      {activeAppAction && (
        <IOSAppWindow
          action={activeAppAction}
          onClose={handleCloseActiveApp}
        >
          {children ? children : (
            <div className="p-8 text-center text-white space-y-4">
              <h3 className="text-xl font-bold">{activeAppAction.label}</h3>
              <p className="text-sm text-white/60">{activeAppAction.description}</p>
              <div className="text-xs font-mono text-emerald-400 bg-emerald-950/60 p-4 rounded-xl border border-emerald-500/30 max-w-md mx-auto">
                Route: {activeAppAction.route}
              </div>
            </div>
          )}
        </IOSAppWindow>
      )}

      {/* 5. Apple Spotlight Search Modal */}
      <IOSSpotlightSearch
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        onLaunchApp={handleLaunchApp}
      />

      {/* 6. Apple iOS Control Center Flyout */}
      <IOSControlCenter
        isOpen={isControlCenterOpen}
        onClose={() => setIsControlCenterOpen(false)}
        onOpenWallpaperModal={() => setIsWallpaperModalOpen(true)}
        staffName={staffName}
        staffRole={staffRole}
        onLockScreen={onLockScreen}
      />

      {/* 7. Apple iOS App Library Modal */}
      <IOSAppLibrary
        isOpen={isAppLibraryOpen}
        onClose={() => setIsAppLibraryOpen(false)}
        onLaunchApp={handleLaunchApp}
        onPinToHome={addToDesktop}
      />

      {/* 8. Wallpaper Engine Personalization Modal */}
      <WallpaperEngineModal
        isOpen={isWallpaperModalOpen}
        onClose={() => setIsWallpaperModalOpen(false)}
        activeWallpaperId={wallpaperId}
        customWallpaperUrl={customWallpaperUrl}
        wallpaperBlurPx={wallpaperBlurPx}
        onSelectPreset={setWallpaperPreset}
        onSetCustomUrl={setCustomWallpaper}
        onChangeBlur={setWallpaperBlur}
      />
    </div>
  );
};
