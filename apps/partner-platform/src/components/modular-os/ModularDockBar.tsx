import React from 'react';
import { type DockSlotItem } from './hooks/useWorkspaceLayout.js';
import { type ModularFeatureAction } from './registry/feature-registry.js';
import { useHapticSoundFeedback } from './hooks/useHapticSoundFeedback.js';

export interface ModularDockBarProps {
  dockItems: DockSlotItem[];
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onOpenVault: () => void;
  onOpenAppDrawer: () => void;
  onSelectAction: (action: ModularFeatureAction) => void;
  onOpenFolder: (folderId: string, folderName: string, itemIds: string[]) => void;
  onRemoveItem: (id: string) => void;
}

export const ModularDockBar: React.FC<ModularDockBarProps> = ({
  dockItems,
  isEditMode,
  onToggleEditMode,
  onOpenVault,
  onOpenAppDrawer,
  onSelectAction,
  onOpenFolder,
  onRemoveItem,
}) => {
  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  const getBadgeValue = (telemetryKey?: string): string | null => {
    switch (telemetryKey) {
      case 'waiting_patients':
        return '14';
      case 'critical_triage':
      case 'critical_emergency_cases':
        return '2 Stat';
      case 'schedule_h1':
      case 'schedule_h1_today_count':
        return 'H1';
      case 'cashier_shift_balance':
        return '₹1.2L';
      case 'bed_occupancy_rate':
        return '94%';
      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 select-none">
      <div className="px-4 py-2.5 rounded-3xl bg-slate-950/75 backdrop-blur-2xl border border-white/20 shadow-[0_16px_50px_rgba(0,0,0,0.7)] flex items-center gap-3 transition-all duration-200">
        {/* Core Android 9-Dots App Drawer Launcher Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => {
              playClick();
              triggerHaptic(20);
              onOpenAppDrawer();
            }}
            className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-0.5 shadow-xl flex items-center justify-center transition-all transform hover:-translate-y-1.5 active:scale-95 group"
            title="Open Android App Drawer (All 150+ Apps)"
          >
            <div className="w-full h-full rounded-[14px] bg-black/25 flex items-center justify-center text-white relative">
              <span className="font-extrabold text-lg tracking-tighter group-hover:scale-110 transition-transform">
                ⋮⋮⋮
              </span>
            </div>
          </button>
          <div className="text-center mt-1">
            <span className="text-[10px] font-bold text-blue-300">Apps</span>
          </div>
        </div>

        <div className="h-9 w-px bg-white/15 my-auto" />

        {/* Pinned Dock Icons */}
        {dockItems.map((slot) => {
          if (slot.isFolder) {
            return (
              <div key={slot.id} className="relative group">
                <button
                  onClick={() => {
                    playClick();
                    triggerHaptic(15);
                    onOpenFolder(slot.id, slot.folderName || 'Folder', slot.folderItemIds || []);
                  }}
                  className={`w-13 h-13 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 flex flex-col items-center justify-center transition-all transform hover:-translate-y-1.5 active:scale-95 shadow-lg ${
                    isEditMode ? 'animate-bounce' : ''
                  }`}
                  title={slot.folderName}
                >
                  <div className="grid grid-cols-2 gap-1 p-1 w-9 h-9 rounded-xl bg-black/40">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-400" />
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
                  </div>
                </button>
                <div className="text-center mt-1">
                  <span className="text-[10px] font-semibold text-slate-300 truncate max-w-[54px] block">
                    {slot.folderName}
                  </span>
                </div>
                {isEditMode && (
                  <button
                    onClick={() => onRemoveItem(slot.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          }

          const action = slot.action;
          if (!action) return null;

          const badge = getBadgeValue(action.badgeTelemetryKey);

          return (
            <div key={slot.id} className="relative group">
              <button
                onClick={() => {
                  playClick();
                  triggerHaptic(15);
                  onSelectAction(action);
                }}
                className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${action.gradient} p-0.5 shadow-xl flex items-center justify-center transition-all transform hover:-translate-y-1.5 active:scale-95 ${
                  isEditMode ? 'animate-pulse' : ''
                }`}
                title={`${action.label} - ${action.description}`}
              >
                <div className="w-full h-full rounded-[14px] bg-black/25 flex flex-col items-center justify-center text-white relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-px bg-white/40" />
                  <span className="font-bold text-sm tracking-tight">
                    {action.shortLabel.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              </button>

              {badge && (
                <span className="absolute -top-1.5 -right-1 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-mono font-bold shadow-md border border-white/20 animate-in fade-in">
                  {badge}
                </span>
              )}

              <div className="text-center mt-1">
                <span className="text-[10px] font-semibold text-slate-300 truncate max-w-[54px] block group-hover:text-white transition-colors">
                  {action.shortLabel}
                </span>
              </div>

              {isEditMode && (
                <button
                  onClick={() => onRemoveItem(slot.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}

        <div className="h-9 w-px bg-white/15 my-auto" />

        {/* Plus / Add Trigger */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => {
              playClick();
              triggerHaptic(15);
              onOpenVault();
            }}
            className="w-13 h-13 rounded-2xl border-2 border-dashed border-white/30 hover:border-blue-400 bg-white/5 hover:bg-blue-500/20 text-slate-300 hover:text-blue-300 flex items-center justify-center transition-all transform hover:-translate-y-1 active:scale-95 shadow-md"
            title="Open Feature Vault / Add Tools"
          >
            <span className="text-xl font-bold">+</span>
          </button>
          <div className="text-center mt-1">
            <span className="text-[10px] font-semibold text-slate-400">Add</span>
          </div>
        </div>

        {/* Edit Mode Toggle */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => {
              playClick();
              triggerHaptic(20);
              onToggleEditMode();
            }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              isEditMode
                ? 'bg-amber-500 text-black font-bold shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-slate-300'
            }`}
            title={isEditMode ? 'Finish Editing' : 'Customize Dock Layout'}
          >
            <span className="text-xs">{isEditMode ? '✓' : '✏️'}</span>
          </button>
          <div className="text-center mt-1">
            <span className="text-[9px] font-semibold text-slate-400">
              {isEditMode ? 'Done' : 'Edit'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
