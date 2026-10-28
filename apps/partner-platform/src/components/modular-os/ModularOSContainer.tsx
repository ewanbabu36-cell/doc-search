import React from 'react';
import { useWorkspaceLayout } from './hooks/useWorkspaceLayout.js';
import { DynamicIslandHUD } from './DynamicIslandHUD.js';
import { ModularDockBar } from './ModularDockBar.js';
import { FeatureVaultDrawer } from './FeatureVaultDrawer.js';
import { SmartFolderBubble } from './SmartFolderBubble.js';
import { AndroidStatusBar } from './status-bar/AndroidStatusBar.js';
import { DesktopHomeCanvas } from './desktop/DesktopHomeCanvas.js';
import { AndroidAppDrawer } from './drawer/AndroidAppDrawer.js';
import { WallpaperEngineModal, WALLPAPER_PRESETS } from './wallpaper/WallpaperEngine.js';
import { type ModularFeatureAction } from './registry/feature-registry.js';

export interface ModularOSContainerProps {
  children?: React.ReactNode;
  activeContextType?: 'CLINICAL' | 'CASHIER' | 'EMERGENCY';
  hospitalName?: string;
}

export const ModularOSContainer: React.FC<ModularOSContainerProps> = ({
  children,
  activeContextType = 'CLINICAL',
  hospitalName = 'DocSearch Apollo Medical Center',
}) => {
  const {
    dockItems,
    desktopIcons,
    wallpaperId,
    customWallpaperUrl,
    wallpaperBlurPx,
    isAppDrawerOpen,
    isWallpaperModalOpen,
    isVaultOpen,
    isEditMode,
    activeFolderModal,
    setIsAppDrawerOpen,
    setIsWallpaperModalOpen,
    setIsVaultOpen,
    setIsEditMode,
    setActiveFolderModal,
    addToDock,
    removeFromDock,
    addToDesktop,
    removeFromDesktop,
    setWallpaperPreset,
    setCustomWallpaper,
    setWallpaperBlur,
    applyPreset,
    restoreDefaults,
  } = useWorkspaceLayout();

  const handleLaunchApp = (action: ModularFeatureAction) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', action.route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const dockItemIds = dockItems.map((item) => item.action?.id || item.actionId || item.id);
  const desktopIconIds = desktopIcons.map((d) => d.id);

  // Active Wallpaper CSS
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

      {/* 1. Android Status Bar (Fixed at top-0) */}
      <AndroidStatusBar
        hospitalName={hospitalName}
        onOpenWallpaperModal={() => setIsWallpaperModalOpen(true)}
      />

      {/* 2. Dynamic Island HUD (Floating at top-10) */}
      <div className="pt-2">
        <DynamicIslandHUD activeContextType={activeContextType} />
      </div>

      {/* 3. Central Android OS Desktop Home Screen Canvas */}
      <main className="relative z-10 flex-1 pt-12 pb-28 max-w-7xl mx-auto w-full">
        {children ? (
          children
        ) : (
          <DesktopHomeCanvas
            desktopIcons={desktopIcons}
            onLaunchApp={handleLaunchApp}
            onRemoveFromDesktop={removeFromDesktop}
            onPinToDock={addToDock}
          />
        )}
      </main>

      {/* 4. Floating Bottom Dock with Center 9-Dots App Drawer */}
      <ModularDockBar
        dockItems={dockItems}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        onOpenVault={() => setIsVaultOpen(true)}
        onOpenAppDrawer={() => setIsAppDrawerOpen(true)}
        onSelectAction={handleLaunchApp}
        onOpenFolder={(folderId, folderName, itemIds) => {
          setActiveFolderModal({ id: folderId, name: folderName, itemIds });
        }}
        onRemoveItem={removeFromDock}
      />

      {/* 5. Authentic Android App Drawer (Opened via 9-Dots Launcher) */}
      <AndroidAppDrawer
        isOpen={isAppDrawerOpen}
        onClose={() => setIsAppDrawerOpen(false)}
        onLaunchApp={handleLaunchApp}
        onAddToDesktop={addToDesktop}
        onPinToDock={addToDock}
        desktopIconIds={desktopIconIds}
        dockItemIds={dockItemIds}
      />

      {/* 6. Wallpaper Engine & Personalization Modal */}
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

      {/* 7. Slide-over Feature Vault */}
      <FeatureVaultDrawer
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        onPinToDock={addToDock}
        onSelectAction={(action) => {
          handleLaunchApp(action);
          setIsVaultOpen(false);
        }}
        onApplyPreset={applyPreset}
        onRestoreDefaults={restoreDefaults}
        dockItemIds={dockItemIds}
      />

      {/* 8. Smart Folder Bubble */}
      {activeFolderModal && (
        <SmartFolderBubble
          folderName={activeFolderModal.name}
          itemIds={activeFolderModal.itemIds}
          onClose={() => setActiveFolderModal(null)}
          onSelectItem={(action) => {
            handleLaunchApp(action);
            setActiveFolderModal(null);
          }}
          onRemoveFolder={() => {
            removeFromDock(activeFolderModal.id);
            setActiveFolderModal(null);
          }}
        />
      )}
    </div>
  );
};
