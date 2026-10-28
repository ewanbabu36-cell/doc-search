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

export interface WorkspaceCustomFolder {
  id: string;
  name: string;
  itemIds: string[];
}

export function useWorkspaceLayout() {
  const [dockItems, setDockItems] = useState<DockSlotItem[]>([]);
  const [headerItems, setHeaderItems] = useState<ModularFeatureAction[]>([]);
  const [customFolders, setCustomFolders] = useState<WorkspaceCustomFolder[]>([]);
  const [activePresetId, setActivePresetId] = useState<string>('CLINICAL_DEFAULT');
  const [themeVariant, setThemeVariant] = useState<string>('LIQUID_GLASS_DARK');
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [activeFolderModal, setActiveFolderModal] = useState<WorkspaceCustomFolder | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { onDropSuccess, onDragStart, playClick } = useHapticSoundFeedback();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to resolve an action from the registry
  const resolveAction = useCallback((id: string): ModularFeatureAction | undefined => {
    return FEATURE_REGISTRY.find((a) => a.id === id);
  }, []);

  // Hydrate layout from PostgreSQL API Gateway
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
          setCustomFolders(data.customFolders || []);

          // Map dock items
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
            // Apply default clinical preset
            applyPreset('CLINICAL_DEFAULT', false);
          }
        }
      }
    } catch (err) {
      console.warn('Silent fallback to local preset:', err);
      applyPreset('CLINICAL_DEFAULT', false);
    } finally {
      setIsLoading(false);
    }
  }, [resolveAction]);

  useEffect(() => {
    fetchLayout();
  }, [fetchLayout]);

  // Debounced cloud synchronization
  const triggerCloudSave = useCallback((newDock: DockSlotItem[], newFolders: WorkspaceCustomFolder[], preset: string) => {
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
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            activePresetId: preset,
            dockSlots: dockSlotsPayload,
            customFolders: newFolders,
            themeVariant,
          }),
        });
      } catch (err) {
        console.warn('Layout cloud sync note:', err);
      }
    }, 800);
  }, [themeVariant]);

  // Add an action into the dock
  const addToDock = useCallback((action: ModularFeatureAction) => {
    onDragStart();
    setDockItems((prev) => {
      if (prev.some((item) => !item.isFolder && (item.action?.id === action.id || item.actionId === action.id))) {
        return prev; // already present
      }
      if (prev.length >= 7) {
        // max dock capacity
        return prev;
      }
      const updated: DockSlotItem[] = [...prev, { id: action.id, actionId: action.id, action }];
      onDropSuccess();
      triggerCloudSave(updated, customFolders, activePresetId);
      return updated;
    });
  }, [onDragStart, onDropSuccess, triggerCloudSave, customFolders, activePresetId]);

  // Remove an item from the dock
  const removeFromDock = useCallback((slotId: string) => {
    playClick();
    setDockItems((prev) => {
      const updated = prev.filter((item) => item.id !== slotId);
      triggerCloudSave(updated, customFolders, activePresetId);
      return updated;
    });
  }, [playClick, triggerCloudSave, customFolders, activePresetId]);

  // Reorder dock items
  const reorderDock = useCallback((fromIndex: number, toIndex: number) => {
    setDockItems((prev) => {
      const cloned = [...prev];
      const [moved] = cloned.splice(fromIndex, 1);
      if (!moved) return prev;
      cloned.splice(toIndex, 0, moved);
      onDropSuccess();
      triggerCloudSave(cloned, customFolders, activePresetId);
      return cloned;
    });
  }, [onDropSuccess, triggerCloudSave, customFolders, activePresetId]);

  // Group two items into a Smart Folder
  const groupIntoFolder = useCallback((folderName: string, itemIds: string[]) => {
    const folderId = 'folder_' + Date.now();
    const newFolder: WorkspaceCustomFolder = {
      id: folderId,
      name: folderName,
      itemIds,
    };

    setCustomFolders((prev) => [...prev, newFolder]);
    setDockItems((prev) => {
      // Remove individual items and insert folder
      const filtered = prev.filter((item) => !itemIds.includes(item.action?.id || item.actionId || ''));
      const updated: DockSlotItem[] = [
        ...filtered,
        {
          id: folderId,
          isFolder: true,
          folderName,
          folderItemIds: itemIds,
        },
      ];
      onDropSuccess();
      triggerCloudSave(updated, [...customFolders, newFolder], activePresetId);
      return updated;
    });
  }, [onDropSuccess, triggerCloudSave, customFolders, activePresetId]);

  // Apply a role preset
  const applyPreset = useCallback((presetKey: keyof typeof ROLE_PRESET_CONFIGURATIONS | string, shouldSync = true) => {
    const preset = ROLE_PRESET_CONFIGURATIONS[presetKey as keyof typeof ROLE_PRESET_CONFIGURATIONS] || ROLE_PRESET_CONFIGURATIONS.CLINICAL_DEFAULT;
    setActivePresetId(preset.id);

    const newDock: DockSlotItem[] = preset.dockIds.map((id) => ({
      id,
      actionId: id,
      action: resolveAction(id),
    }));

    const newHeader = preset.headerIds.map((id) => resolveAction(id)).filter(Boolean) as ModularFeatureAction[];

    setDockItems(newDock);
    setHeaderItems(newHeader);
    playClick();

    if (shouldSync) {
      triggerCloudSave(newDock, [], preset.id);
    }
  }, [resolveAction, playClick, triggerCloudSave]);

  // Restore defaults
  const restoreDefaults = useCallback(() => {
    applyPreset('CLINICAL_DEFAULT', true);
  }, [applyPreset]);

  return {
    dockItems,
    headerItems,
    customFolders,
    activePresetId,
    themeVariant,
    isVaultOpen,
    isEditMode,
    activeFolderModal,
    isLoading,
    setIsVaultOpen,
    setIsEditMode,
    setActiveFolderModal,
    setThemeVariant,
    addToDock,
    removeFromDock,
    reorderDock,
    groupIntoFolder,
    applyPreset,
    restoreDefaults,
  };
}
