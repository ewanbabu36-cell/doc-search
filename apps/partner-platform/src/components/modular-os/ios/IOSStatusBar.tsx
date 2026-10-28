import React, { useState, useEffect } from 'react';
import { useHapticSoundFeedback } from '../hooks/useHapticSoundFeedback.js';

export interface IOSStatusBarProps {
  hospitalName?: string;
  onOpenControlCenter: () => void;
  onOpenWallpaperModal: () => void;
  activeContextType?: 'CLINICAL' | 'CASHIER' | 'EMERGENCY';
  patientName?: string;
  heartRate?: number;
}

export const IOSStatusBar: React.FC<IOSStatusBarProps> = ({
  hospitalName = 'DocSearch Apollo Medical Center',
  onOpenControlCenter,
  onOpenWallpaperModal,
  activeContextType = 'CLINICAL',
  patientName = 'Ramesh Kumar',
  heartRate = 78,
}) => {
  const [timeStr, setTimeStr] = useState<string>('9:41');
  const [isDynamicIslandExpanded, setIsDynamicIslandExpanded] = useState<boolean>(false);
  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 h-10 z-50 px-6 flex items-center justify-between select-none text-[13px] font-semibold text-white pointer-events-auto">
      {/* 1. Left: iOS Clock & Carrier */}
      <div className="flex items-center gap-3">
        <span className="font-bold tracking-tight text-white font-mono text-[14px]">
          {timeStr}
        </span>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-white/80 font-medium">
          <span className="tracking-wide">{hospitalName}</span>
          <span className="text-white/60">5G</span>
          <svg className="w-2.5 h-2.5 text-blue-400 rotate-45 -mt-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
          </svg>
        </div>
      </div>

      {/* 2. Center: Apple Dynamic Island (Pitch Black Glass Pill) */}
      <div className="absolute left-1/2 -translate-x-1/2 top-1.5 z-50">
        <div
          onClick={() => {
            playClick();
            triggerHaptic(15);
            setIsDynamicIslandExpanded(!isDynamicIslandExpanded);
          }}
          className={`cursor-pointer bg-black text-white border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center ${
            isDynamicIslandExpanded
              ? 'w-[420px] p-4 rounded-[28px]'
              : 'px-3.5 py-1.5 rounded-full gap-2.5 hover:scale-[1.03] active:scale-95'
          }`}
        >
          {/* Subtle sensor camera cutout */}
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-800 flex-shrink-0" />

          {!isDynamicIslandExpanded ? (
            // Compact pill view
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-rose-400 font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                <span>{heartRate}</span>
              </span>

              <span className="h-2.5 w-px bg-white/20" />

              {activeContextType === 'CLINICAL' && (
                <span className="truncate max-w-[120px] text-white/90 text-[11px] font-medium">
                  {patientName}
                </span>
              )}

              {activeContextType === 'CASHIER' && (
                <span className="text-amber-400 text-[11px] font-mono font-semibold">
                  Cashier Active
                </span>
              )}

              {activeContextType === 'EMERGENCY' && (
                <span className="text-rose-400 text-[11px] font-bold uppercase tracking-wider">
                  Code Blue
                </span>
              )}
            </div>
          ) : (
            // Expanded Island view
            <div className="w-full space-y-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-sm text-white">{patientName}</span>
                  <span className="text-xs text-white/50">(Ward 4B / Bed 12)</span>
                </div>
                <button
                  onClick={() => setIsDynamicIslandExpanded(false)}
                  className="text-xs text-white/60 hover:text-white px-2 py-0.5 rounded-full bg-white/10"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-white/50 uppercase font-semibold">Pulse</div>
                  <div className="text-base font-bold font-mono text-rose-400">{heartRate} bpm</div>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-white/50 uppercase font-semibold">SpO2</div>
                  <div className="text-base font-bold font-mono text-cyan-400">99%</div>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-white/50 uppercase font-semibold">Blood Pressure</div>
                  <div className="text-base font-bold font-mono text-amber-300">120/80</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Right: iOS Status Icons & Control Center Trigger */}
      <div className="flex items-center gap-3">
        {/* Signal Bars (4 bars) */}
        <div className="flex items-end gap-0.5 h-3">
          <span className="w-1 h-1.5 rounded-sm bg-white" />
          <span className="w-1 h-2 rounded-sm bg-white" />
          <span className="w-1 h-2.5 rounded-sm bg-white" />
          <span className="w-1 h-3 rounded-sm bg-white" />
        </div>

        {/* Wi-Fi with Live PostgreSQL connection indicator */}
        <div className="flex items-center gap-1" title="PostgreSQL 18.4 Connected">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Battery Indicator with Fill */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono font-bold text-white/90">100%</span>
          <div className="w-6 h-3 rounded-[4px] border border-white/70 p-0.5 flex items-center relative">
            <div className="w-full h-full bg-emerald-400 rounded-[2px]" />
            <div className="absolute -right-1 top-1 h-1 w-0.5 bg-white/70 rounded-r-sm" />
          </div>
        </div>

        {/* Wallpaper Studio Quick Trigger */}
        <button
          onClick={() => {
            playClick();
            triggerHaptic(15);
            onOpenWallpaperModal();
          }}
          className="flex items-center justify-center w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 border border-white/20 transition-all text-white/90"
          title="Wallpaper & Visual Canvas"
        >
          🖼️
        </button>

        {/* Control Center Pull-Down Pill Trigger */}
        <button
          onClick={() => {
            playClick();
            triggerHaptic(20);
            onOpenControlCenter();
          }}
          className="flex items-center justify-center w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 border border-white/20 transition-all text-white/90"
          title="Open iOS Control Center"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
        </button>
      </div>
    </header>
  );
};
