import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FEATURE_REGISTRY,
  ROLE_PRESET_CONFIGURATIONS,
  type ModularFeatureAction,
} from '../registry/feature-registry.js';
import { useHapticSoundFeedback } from './useHapticSoundFeedback.js';

export interface DockSlotItem {
  id: string;
  actionId?: string | undefined;
  isFolder?: boolean | undefined;
  folderName?: string | undefined;
  folderItemIds?: string[] | undefined;
  action?: ModularFeatureAction | undefined;
}

export interface DesktopIconItem {
  id: string;
  gridX?: number | undefined;
  gridY?: number | undefined;
}

export interface WorkspaceCustomFolder {
  id: string;
  name: string;
  itemIds: string[];
}

export function useWorkspaceLayout() {
  const [dockItems, setDockItems] = useState<DockSlotItem[]>([]);
  const [headerItems, setHeaderItems] = useState<ModularFeatureAction[]>([]);
  const [desktopIcons, setDesktopIcons] = useState<DesktopIconItem[]>([
    { id: 'clinical_opd_queue' },
    { id: 'ipd_bed_census' },
    { id: 'pharmacy_pos_checkout' },
    { id: 'billing_cashier_desk' },
    { id: 'clinical_lab_requisitions' },
    { id: 'emergency_manchester_triage' },
  ]);
  const [customFolders, setCustomFolders] = useState<WorkspaceCustomFolder[]>([]);
  const [activePresetId, setActivePresetId] = useState<string>('CLINICAL_DEFAULT');
  const [themeVariant, setThemeVariant] = useState<string>('LIQUID_GLASS_DARK');
  const [wallpaperId, setWallpaperId] = useState<string>('IOS18_IRIDESCENT_MIDNIGHT');
  const [customWallpaperUrl, setCustomWallpaperUrl] = useState<string | null>(null);
  const [wallpaperBlurPx, setWallpaperBlurPx] = useState<number>(0);

  const [isAppDrawerOpen, setIsAppDrawerOpen] = useState<boolean>(false);
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState<boolean>(false);
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [activeFolderModal, setActiveFolderModal] = useState<WorkspaceCustomFolder | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { onDropSuccess, onDragStart, playClick } = useHapticSoundFeedback();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to resolve action
  const resolveAction = useCallback((id: string): ModularFeatureAction | undefined => {
    return FEATURE_REGISTRY.find((a) => a.id === id);
  }, []);

  // Hydrate from PostgreSQL via API Gateway
  const fetchLayout = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/partner/workspace/layout', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        const data = json?.data;
        if (data) {
          setActivePresetId(data.activePresetId || 'CLINICAL_DEFAULT');
          setThemeVariant(data.themeVariant || 'LIQUID_GLASS_DARK');
          setWallpaperId(data.wallpaperId || 'OLED_COSMIC_BLUE');
          setCustomWallpaperUrl(data.customWallpaperUrl || null);
          setWallpaperBlurPx(data.wallpaperBlurPx ?? 0);
          setCustomFolders(data.customFolders || []);

          if (Array.isArray(data.desktopIcons) && data.desktopIcons.length > 0) {
            setDesktopIcons(data.desktopIcons);
          }

          if (Array.isArray(data.dockSlots) && data.dockSlots.length > 0) {
            const mapped: DockSlotItem[] = data.dockSlots.map((slot: any) => {
              if (slot.isFolder) {
                return {
                  id: slot.id,
                  isFolder: true,
                  folderName: slot.folderName,
                  folderItemIds: slot.folderItemIds || [],
                };
              }
              const act = resolveAction(slot.id || slot.actionId);
              return {
                id: slot.id,
                actionId: slot.id,
                action: act,
              };
            });
            setDockItems(mapped);
          } else {
            applyPreset('CLINICAL_DEFAULT', false);
          }
        }
      }
    } catch (err) {
      console.warn('Layout fetch fallback note:', err);
      applyPreset('CLINICAL_DEFAULT', false);
    } finally {
      setIsLoading(false);
    }
  }, [resolveAction]);

  useEffect(() => {
    fetchLayout();
  }, [fetchLayout]);

  // Debounced cloud save
  const triggerCloudSave = useCallback(
    (
      newDock: DockSlotItem[],
      newDesktop: DesktopIconItem[],
      newFolders: WorkspaceCustomFolder[],
      preset: string,
      wId: string,
      customUrl: string | null,
      blurPx: number
    ) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const dockSlotsPayload = newDock.map((d) => {
            if (d.isFolder) {
              return {
                id: d.id,
                isFolder: true,
                folderName: d.folderName,
                folderItemIds: d.folderItemIds,
              };
            }
            return {
              id: d.action?.id || d.actionId || d.id,
              label: d.action?.shortLabel || d.action?.label,
            };
          });

          await fetch('/api/v1/partner/workspace/layout', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              activePresetId: preset,
              dockSlots: dockSlotsPayload,
              desktopIcons: newDesktop,
              customFolders: newFolders,
              wallpaperId: wId,
              customWallpaperUrl: customUrl,
              wallpaperBlurPx: blurPx,
              themeVariant,
            }),
          });
        } catch (err) {
          console.warn('Layout auto-save note:', err);
        }
      }, 800);
    },
    [themeVariant]
  );

  // Add to Dock
  const addToDock = useCallback(
    (action: ModularFeatureAction) => {
      onDragStart();
      setDockItems((prev) => {
        if (prev.some((item) => !item.isFolder && (item.action?.id === action.id || item.actionId === action.id))) {
          return prev;
        }
        if (prev.length >= 7) return prev;
        const updated: DockSlotItem[] = [...prev, { id: action.id, actionId: action.id, action }];
        onDropSuccess();
        triggerCloudSave(updated, desktopIcons, customFolders, activePresetId, wallpaperId, customWallpaperUrl, wallpaperBlurPx);
        return updated;
      });
    },
    [onDragStart, onDropSuccess, triggerCloudSave, desktopIcons, customFolders, activePresetId, wallpaperId, customWallpaperUrl, wallpaperBlurPx]
  );

  // Remove from Dock
  const removeFromDock = useCallback(
    (slotId: string) => {
      playClick();
      setDockItems((prev) => {
        const updated = prev.filter((item) => item.id !== slotId);
        triggerCloudSave(updated, desktopIcons, customFolders, activePresetId, wallpaperId, customWallpaperUrl, wallpaperBlurPx);
        return updated;
      });
    },
    [playClick, triggerCloudSave, desktopIcons, customFolders, activePresetId, wallpaperId, customWallpaperUrl, wallpaperBlurPx]
  );

  // Add to Desktop Home Screen
  const addToDesktop = useCallback(
    (action: ModularFeatureAction) => {
      onDropSuccess();
      setDesktopIcons((prev) => {
        if (prev.some((item) => item.id === action.id)) return prev;
        const updated = [...prev, { id: action.id }];
        triggerCloudSave(dockItems, updated, customFolders, activePresetId, wallpaperId, customWallpaperUrl, wallpaperBlurPx);
        return updated;
      });
    },
    [onDropSuccess, triggerCloudSave, dockItems, customFolders, activePresetId, wallpaperId, customWallpaperUrl, wallpaperBlurPx]
  );

  // Remove from Desktop Home Screen
  const removeFromDesktop = useCallback(
    (actionId: string) => {
      playClick();
      setDesktopIcons((prev) => {
        const updated = prev.filter((item) => item.id !== actionId);
        triggerCloudSave(dockItems, updated, customFolders, activePresetId, wallpaperId, customWallpaperUrl, wallpaperBlurPx);
        return updated;
      });
    },
    [playClick, triggerCloudSave, dockItems, customFolders, activePresetId, wallpaperId, customWallpaperUrl, wallpaperBlurPx]
  );

  // Wallpaper Controls
  const setWallpaperPreset = useCallback(
    (id: string) => {
      setWallpaperId(id);
      setCustomWallpaperUrl(null);
      triggerCloudSave(dockItems, desktopIcons, customFolders, activePresetId, id, null, wallpaperBlurPx);
    },
    [triggerCloudSave, dockItems, desktopIcons, customFolders, activePresetId, wallpaperBlurPx]
  );

  const setCustomWallpaper = useCallback(
    (url: string) => {
      setCustomWallpaperUrl(url || null);
      triggerCloudSave(dockItems, desktopIcons, customFolders, activePresetId, wallpaperId, url || null, wallpaperBlurPx);
    },
    [triggerCloudSave, dockItems, desktopIcons, customFolders, activePresetId, wallpaperId, wallpaperBlurPx]
  );

  const setWallpaperBlur = useCallback(
    (blurPx: number) => {
      setWallpaperBlurPx(blurPx);
      triggerCloudSave(dockItems, desktopIcons, customFolders, activePresetId, wallpaperId, customWallpaperUrl, blurPx);
    },
    [triggerCloudSave, dockItems, desktopIcons, customFolders, activePresetId, wallpaperId, customWallpaperUrl]
  );

  // Apply Role Preset
  const applyPreset = useCallback(
    (presetKey: keyof typeof ROLE_PRESET_CONFIGURATIONS | string, shouldSync = true) => {
      const preset = ROLE_PRESET_CONFIGURATIONS[presetKey as keyof typeof ROLE_PRESET_CONFIGURATIONS] || ROLE_PRESET_CONFIGURATIONS.CLINICAL_DEFAULT;
      setActivePresetId(preset.id);

      const newDock: DockSlotItem[] = preset.dockIds.map((id) => ({
        id,
        actionId: id,
        action: resolveAction(id),
      }));

      const newDesktop: DesktopIconItem[] = preset.dockIds.map((id) => ({ id }));
      const newHeader = preset.headerIds.map((id) => resolveAction(id)).filter(Boolean) as ModularFeatureAction[];

      setDockItems(newDock);
      setDesktopIcons(newDesktop);
      setHeaderItems(newHeader);
      playClick();

      if (shouldSync) {
        triggerCloudSave(newDock, newDesktop, [], preset.id, wallpaperId, customWallpaperUrl, wallpaperBlurPx);
      }
    },
    [resolveAction, playClick, triggerCloudSave, wallpaperId, customWallpaperUrl, wallpaperBlurPx]
  );

  const restoreDefaults = useCallback(() => {
    applyPreset('CLINICAL_DEFAULT', true);
  }, [applyPreset]);

  return {
    dockItems,
    headerItems,
    desktopIcons,
    customFolders,
    activePresetId,
    themeVariant,
    wallpaperId,
    customWallpaperUrl,
    wallpaperBlurPx,
    isAppDrawerOpen,
    isWallpaperModalOpen,
    isVaultOpen,
    isEditMode,
    activeFolderModal,
    isLoading,
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
  };
}
