import React from 'react';
import {
  FEATURE_REGISTRY,
  type ModularFeatureAction,
} from './registry/feature-registry.js';
import { useHapticSoundFeedback } from './hooks/useHapticSoundFeedback.js';

export interface SmartFolderBubbleProps {
  folderName: string;
  itemIds: string[];
  onClose: () => void;
  onSelectItem: (action: ModularFeatureAction) => void;
  onRemoveFolder?: () => void;
}

export const SmartFolderBubble: React.FC<SmartFolderBubbleProps> = ({
  folderName,
  itemIds,
  onClose,
  onSelectItem,
  onRemoveFolder,
}) => {
  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  const actions = itemIds
    .map((id) => FEATURE_REGISTRY.find((a) => a.id === id))
    .filter(Boolean) as ModularFeatureAction[];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center pb-28 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-80 p-5 rounded-3xl bg-slate-900/90 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-4 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="font-bold text-sm text-white tracking-wide">{folderName}</span>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded-md hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {actions.map((act) => (
            <button
              key={act.id}
              onClick={() => {
                playClick();
                triggerHaptic(15);
                onSelectItem(act);
              }}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 transition-all transform hover:-translate-y-1 active:scale-95 group"
            >
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${act.gradient} p-0.5 shadow-lg flex items-center justify-center text-white`}
              >
                <div className="w-full h-full rounded-[14px] bg-black/20 flex items-center justify-center font-bold text-base">
                  {act.shortLabel.substring(0, 2).toUpperCase()}
                </div>
              </div>
              <span className="text-[10px] font-semibold text-slate-300 text-center leading-tight line-clamp-1 group-hover:text-white">
                {act.shortLabel}
              </span>
            </button>
          ))}
        </div>

        {onRemoveFolder && (
          <div className="pt-2 border-t border-white/10 flex justify-end">
            <button
              onClick={() => {
                playClick();
                onRemoveFolder();
              }}
              className="text-[11px] text-rose-400 hover:text-rose-300 font-medium"
            >
              Ungroup Folder
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
