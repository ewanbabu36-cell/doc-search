import React, { useEffect, useState } from 'react';
import { type ModularFeatureAction } from '../registry/feature-registry.js';
import { IOSIconRenderer } from './IOSIconRenderer.js';
import { useHapticSoundFeedback } from '../hooks/useHapticSoundFeedback.js';

export interface IOSAppWindowProps {
  action: ModularFeatureAction;
  onClose: () => void;
  children: React.ReactNode;
}

export const IOSAppWindow: React.FC<IOSAppWindowProps> = ({
  action,
  onClose,
  children,
}) => {
  const [isStageManager, setIsStageManager] = useState<boolean>(false);
  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  // Escape key returns to iOS Springboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        playClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, playClick]);

  return (
    <div className="fixed inset-0 z-30 pt-10 pb-2 px-2 md:px-4 flex flex-col bg-slate-950/90 backdrop-blur-2xl animate-in zoom-in-95 duration-200 select-none pointer-events-auto">
      {/* 1. iOS App Window Navigation Bar */}
      <div className="h-11 px-4 rounded-t-2xl bg-slate-900/90 border border-white/15 flex items-center justify-between select-none">
        {/* Left: ‹ Home Springboard Pill */}
        <button
          onClick={() => {
            playClick();
            triggerHaptic(20);
            onClose();
          }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all active:scale-95"
          title="Return to iOS Springboard (Esc)"
        >
          <span className="text-sm leading-none">‹</span>
          <span>Home</span>
        </button>

        {/* Center: App Squircle & Title */}
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white shadow`}>
            <IOSIconRenderer iconName={action.icon} size={14} />
          </div>
          <span className="text-xs font-bold text-white tracking-tight">
            {action.label}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
            {action.category}
          </span>
        </div>

        {/* Right: Stage Manager & Close Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playClick();
              setIsStageManager(!isStageManager);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              isStageManager
                ? 'bg-blue-600 border-blue-400 text-white'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/15'
            }`}
            title="Toggle iPadOS Stage Manager Window Mode"
          >
            {isStageManager ? '⧉ Windowed' : '⛶ Fullscreen'}
          </button>

          <button
            onClick={() => {
              playClick();
              triggerHaptic(20);
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-white flex items-center justify-center text-xs border border-red-500/30 transition-all active:scale-95"
            title="Close App"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 2. Operational App Viewport (Hosting PartnerPlatformShell or domain view) */}
      <div
        className={`flex-1 overflow-auto bg-slate-900 border-x border-b border-white/15 transition-all ${
          isStageManager ? 'max-w-6xl mx-auto w-full my-2 rounded-2xl shadow-2xl' : 'rounded-b-2xl'
        }`}
      >
        {children}
      </div>

      {/* 3. Iconic Apple iOS Home Indicator Bar */}
      <div className="pt-2 flex flex-col items-center justify-center">
        <div
          onClick={() => {
            playClick();
            triggerHaptic(30);
            onClose();
          }}
          className="w-36 h-1.5 rounded-full bg-white/60 hover:bg-white active:scale-90 cursor-pointer shadow-[0_2px_10px_rgba(255,255,255,0.4)] transition-all hover:h-2"
          title="Click or drag to swipe up to Home Screen"
        />
      </div>
    </div>
  );
};
