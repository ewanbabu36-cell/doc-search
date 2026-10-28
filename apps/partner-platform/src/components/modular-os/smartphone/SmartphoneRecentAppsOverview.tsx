import React from 'react';
import { type ModularFeatureAction } from '../registry/feature-registry.js';
import { type RunningAppSession } from '../hooks/useSmartphoneOS.js';
import { IOSIconRenderer } from '../ios/IOSIconRenderer.js';
import { useHapticSoundFeedback } from '../hooks/useHapticSoundFeedback.js';

export interface SmartphoneRecentAppsOverviewProps {
  isOpen: boolean;
  runningApps: RunningAppSession[];
  activeActionId?: string | undefined;
  onSelectApp: (action: ModularFeatureAction) => void;
  onKillApp: (actionId: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export const SmartphoneRecentAppsOverview: React.FC<SmartphoneRecentAppsOverviewProps> = ({
  isOpen,
  runningApps,
  activeActionId,
  onSelectApp,
  onKillApp,
  onClearAll,
  onClose,
}) => {
  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 pt-12 pb-16 px-4 flex flex-col justify-between bg-black/70 backdrop-blur-3xl animate-in fade-in duration-200 select-none pointer-events-auto"
      onClick={onClose}
    >
      {/* 1. Header: Multitasking Switcher Title & Count */}
      <div
        className="max-w-4xl mx-auto w-full flex items-center justify-between px-4 pb-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 text-blue-400">
            <span className="w-1 h-3.5 rounded-full bg-blue-400" />
            <span className="w-1 h-3.5 rounded-full bg-blue-400" />
            <span className="w-1 h-3.5 rounded-full bg-blue-400" />
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">Recent Open Apps</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
            {runningApps.length} active
          </span>
        </div>

        <button
          onClick={() => {
            playClick();
            onClose();
          }}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-colors"
          title="Close Switcher"
        >
          ✕
        </button>
      </div>

      {/* 2. Center: Horizontal Multitasking Card Carousel */}
      <div
        className="flex-1 flex items-center justify-center overflow-x-auto py-6 px-4 scrollbar-none"
        onClick={(e) => e.stopPropagation()}
      >
        {runningApps.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-white/10 flex items-center justify-center text-2xl text-slate-400">
              📱
            </div>
            <h3 className="text-base font-bold text-white">No Recent Apps Running</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Tap any app icon on the Home Screen to launch tasks into the background multitasker.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-6 max-w-full">
            {runningApps.map((session) => {
              const { action, lastActiveTime } = session;
              const isCurrent = action.id === activeActionId;

              return (
                <div
                  key={action.id}
                  onClick={() => {
                    playClick();
                    triggerHaptic(15);
                    onSelectApp(action);
                  }}
                  className={`relative w-64 md:w-72 h-96 rounded-[32px] p-4 flex flex-col justify-between cursor-pointer transition-all duration-200 transform hover:-translate-y-2 hover:scale-[1.02] shadow-[0_20px_50px_rgba(0,0,0,0.7)] group overflow-hidden ${
                    isCurrent
                      ? 'bg-slate-900/90 border-2 border-blue-400 shadow-blue-500/20'
                      : 'bg-slate-900/80 hover:bg-slate-900/95 border border-white/20'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${action.gradient} p-0.5 flex items-center justify-center text-white shadow`}>
                        <IOSIconRenderer iconName={action.icon} size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block leading-tight truncate max-w-[120px]">
                          {action.shortLabel || action.label}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {lastActiveTime || 'Running'}
                        </span>
                      </div>
                    </div>

                    {/* Kill app button [ ✕ ] */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playClick();
                        triggerHaptic(20);
                        onKillApp(action.id);
                      }}
                      className="w-6 h-6 rounded-full bg-white/10 hover:bg-red-500 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-colors"
                      title="Kill App"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Card Body: Realistic App Snapshot Mock */}
                  <div className="flex-1 my-3 rounded-2xl bg-black/40 border border-white/10 p-3 flex flex-col justify-between text-left overflow-hidden relative">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>{action.category}</span>
                        <span className="text-emerald-400">● Warm</span>
                      </div>
                      <p className="text-xs font-medium text-slate-200 line-clamp-2">
                        {action.description}
                      </p>
                    </div>

                    {/* Miniature simulated module rows */}
                    <div className="space-y-1.5 pt-2 border-t border-white/10">
                      <div className="h-2 w-3/4 rounded bg-white/20" />
                      <div className="h-2 w-1/2 rounded bg-white/15" />
                      <div className="h-2 w-5/6 rounded bg-white/10" />
                    </div>

                    <div className="text-[10px] font-mono text-blue-300 truncate pt-1">
                      {action.route}
                    </div>
                  </div>

                  {/* Card Footer: Tap to Open Indicator */}
                  <div className="text-center">
                    <span className="text-[11px] font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
                      Tap to open
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Footer: Clear All Button */}
      {runningApps.length > 0 && (
        <div
          className="max-w-xs mx-auto w-full flex justify-center pb-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              playClick();
              triggerHaptic(30);
              onClearAll();
            }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold text-xs backdrop-blur-2xl border border-white/20 shadow-xl transition-all"
            title="Close all background apps"
          >
            <span>🧹</span>
            <span>Clear All Apps</span>
          </button>
        </div>
      )}
    </div>
  );
};
