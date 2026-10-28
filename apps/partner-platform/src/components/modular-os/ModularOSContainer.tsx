import React from 'react';
import { useWorkspaceLayout } from './hooks/useWorkspaceLayout.js';
import { DynamicIslandHUD } from './DynamicIslandHUD.js';
import { ModularDockBar } from './ModularDockBar.js';
import { FeatureVaultDrawer } from './FeatureVaultDrawer.js';
import { SmartFolderBubble } from './SmartFolderBubble.js';
import { type ModularFeatureAction } from './registry/feature-registry.js';

export interface ModularOSContainerProps {
  children?: React.ReactNode;
  activeContextType?: 'CLINICAL' | 'CASHIER' | 'EMERGENCY';
}

export const ModularOSContainer: React.FC<ModularOSContainerProps> = ({
  children,
  activeContextType = 'CLINICAL',
}) => {
  const {
    dockItems,
    isVaultOpen,
    isEditMode,
    activeFolderModal,
    setIsVaultOpen,
    setIsEditMode,
    setActiveFolderModal,
    addToDock,
    removeFromDock,
    applyPreset,
    restoreDefaults,
  } = useWorkspaceLayout();

  const handleSelectAction = (action: ModularFeatureAction) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', action.route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const dockItemIds = dockItems.map((item) => item.action?.id || item.actionId || item.id);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Dynamic Island HUD at Top Center */}
      <DynamicIslandHUD activeContextType={activeContextType} />

      {/* Main Workbench Workspace Canvas */}
      <main className="flex-1 pb-28 pt-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Floating Liquid Glass Dock Bar at Bottom Center */}
      <ModularDockBar
        dockItems={dockItems}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        onOpenVault={() => setIsVaultOpen(true)}
        onSelectAction={handleSelectAction}
        onOpenFolder={(folderId, folderName, itemIds) => {
          setActiveFolderModal({ id: folderId, name: folderName, itemIds });
        }}
        onRemoveItem={removeFromDock}
      />

      {/* Feature Vault App Drawer */}
      <FeatureVaultDrawer
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        onPinToDock={addToDock}
        onSelectAction={(action) => {
          handleSelectAction(action);
          setIsVaultOpen(false);
        }}
        onApplyPreset={applyPreset}
        onRestoreDefaults={restoreDefaults}
        dockItemIds={dockItemIds}
      />

      {/* Smart Folder Bubble Modal */}
      {activeFolderModal && (
        <SmartFolderBubble
          folderName={activeFolderModal.name}
          itemIds={activeFolderModal.itemIds}
          onClose={() => setActiveFolderModal(null)}
          onSelectItem={(action) => {
            handleSelectAction(action);
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
