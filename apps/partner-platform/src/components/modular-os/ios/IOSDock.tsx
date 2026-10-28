import React from 'react';
import { type ModularFeatureAction } from '../registry/feature-registry.js';
import { IOSAppIcon } from './IOSAppIcon.js';
import { useHapticSoundFeedback } from '../hooks/useHapticSoundFeedback.js';

export interface IOSDockProps {
  dockActions: ModularFeatureAction[];
  onLaunchApp: (action: ModularFeatureAction) => void;
  onOpenAppLibrary: () => void;
  isJiggleMode?: boolean;
  onStartJiggle?: () => void;
  onRemoveFromDock?: (id: string) => void;
}

export const IOSDock: React.FC<IOSDockProps> = ({
  dockActions,
  onLaunchApp,
  onOpenAppLibrary,
  isJiggleMode = false,
  onStartJiggle,
  onRemoveFromDock,
}) => {
  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 select-none pointer-events-auto">
      {/* Translucent Frosted Glass iPadOS Dock Pill */}
      <div className="px-5 py-3 rounded-[32px] bg-white/20 dark:bg-black/35 backdrop-blur-3xl border border-white/30 shadow-[0_25px_60px_rgba(0,0,0,0.6)] flex items-center gap-4 transition-all duration-300 relative group">
        {/* Dock Specular Edge Line */}
        <div className="absolute top-0 inset-x-8 h-px bg-white/40 pointer-events-none" />

        {/* Pinned App Icons (No labels in true Apple iOS fashion) */}
        <div className="flex items-center gap-3">
          {dockActions.map((action, idx) => (
            <IOSAppIcon
              key={action.id}
              action={action}
              onLaunch={onLaunchApp}
              onDelete={onRemoveFromDock}
              isJiggleMode={isJiggleMode}
              onStartJiggle={onStartJiggle}
              hideLabel={true}
              size="md"
              index={idx}
            />
          ))}
        </div>

        {/* Divider bar */}
        <div className="h-10 w-px bg-white/20 mx-0.5" />

        {/* Apple iOS App Library Trigger */}
        <button
          onClick={() => {
            playClick();
            triggerHaptic(20);
            onOpenAppLibrary();
          }}
          className="w-16 h-16 rounded-[18px] bg-gradient-to-br from-indigo-500/80 via-purple-600/80 to-blue-600/80 border border-white/30 shadow-[0_8px_20px_rgba(0,0,0,0.4)] flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95 relative overflow-hidden"
          title="App Library (All 150+ Apps)"
        >
          {/* Specular highlight */}
          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />

          {/* 2x2 Mini Folder Grid Preview */}
          <div className="grid grid-cols-2 gap-1.5 p-2 w-11 h-11 rounded-xl bg-black/30 backdrop-blur-sm">
            <span className="w-3.5 h-3.5 rounded-md bg-blue-400/90 shadow-sm" />
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-400/90 shadow-sm" />
            <span className="w-3.5 h-3.5 rounded-md bg-amber-400/90 shadow-sm" />
            <span className="w-3.5 h-3.5 rounded-md bg-rose-400/90 shadow-sm" />
          </div>
        </button>
      </div>
    </div>
  );
};
