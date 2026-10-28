import React, { useState, useEffect } from 'react';
import { useHapticSoundFeedback } from '../hooks/useHapticSoundFeedback.js';

export interface IOSStatusBarProps {
  hospitalName?: string | undefined;
  onOpenControlCenter: () => void;
  onOpenWallpaperModal: () => void;
  activeContextType?: ('CLINICAL' | 'CASHIER' | 'EMERGENCY') | undefined;
  patientName?: string | undefined;
  heartRate?: number | undefined;
  isPhoneFrameMode?: boolean | undefined;
  onTogglePhoneFrame?: (() => void) | undefined;
}

export const IOSStatusBar: React.FC<IOSStatusBarProps> = ({
  hospitalName = 'DocSearch Apollo 5G',
  onOpenControlCenter,
  onOpenWallpaperModal: _onOpenWallpaperModal,
  activeContextType: _activeContextType = 'CLINICAL',
  patientName = 'Ward 4B / Bed 12',
  heartRate = 78,
  isPhoneFrameMode = false,
  onTogglePhoneFrame,
}) => {
  const [timeStr, setTimeStr] = useState<string>('9:41');
  const [isDynamicIslandExpanded, setIsDynamicIslandExpanded] = useState<boolean>(false);
  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
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
    <header className="fixed top-0 inset-x-0 h-11 z-50 px-6 flex items-center justify-between select-none text-[13px] font-semibold text-white pointer-events-auto">
      {/* 1. Left: 9:41 .ill DocSearch Apollo 5G */}
      <div className="flex items-center gap-2.5">
        <span className="font-bold tracking-tight text-white font-sans text-[15px]">
          {timeStr || '9:41'}
        </span>

        {/* 4 Signal Bars */}
        <div className="flex items-end gap-0.5 h-3.5">
          <span className="w-1 h-1.5 rounded-[1px] bg-white" />
          <span className="w-1 h-2 rounded-[1px] bg-white" />
          <span className="w-1 h-2.5 rounded-[1px] bg-white" />
          <span className="w-1 h-3.5 rounded-[1px] bg-white" />
        </div>

        <span className="text-[13px] text-white/90 font-medium tracking-tight">
          {hospitalName}
        </span>
      </div>

      {/* 2. Center: Apple Dynamic Island (Pitch Black Pill) */}
      <div className="absolute left-1/2 -translate-x-1/2 top-1.5 z-50">
        <div
          onClick={() => {
            playClick();
            triggerHaptic(15);
            setIsDynamicIslandExpanded(!isDynamicIslandExpanded);
          }}
          className={`cursor-pointer bg-black text-white border border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.8)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center ${
            isDynamicIslandExpanded
              ? 'w-[420px] p-4 rounded-[28px]'
              : 'px-5 py-1.5 rounded-full min-w-[270px] justify-between gap-4 hover:scale-[1.02] active:scale-95'
          }`}
        >
          {!isDynamicIslandExpanded ? (
            // Authentic Dynamic Island compact layout matching reference
            <>
              {/* Left inside island: Heart with pulse + 78 bpm & Ward 4B / Bed 12 */}
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>

                <div className="flex flex-col text-left">
                  <div className="text-[14px] font-bold text-white tracking-tight leading-tight">
                    {heartRate} bpm
                  </div>
                  <div className="text-[10px] text-white/60 font-medium leading-none mt-0.5">
                    {patientName}
                  </div>
                </div>
              </div>

              {/* Right inside island: Green dot + Green Wi-Fi waves */}
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <line x1="12" y1="20" x2="12.01" y2="20" />
                </svg>
              </div>
            </>
          ) : (
            // Expanded Island view
            <div className="w-full space-y-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-sm text-white">Live Patient Telemetry</span>
                  <span className="text-xs text-white/50">({patientName})</span>
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

      {/* 3. Right: Signal bars, 100%, Battery Pill, and Quick Triggers */}
      <div className="flex items-center gap-3">
        {/* Signal Bars */}
        <div className="flex items-end gap-0.5 h-3.5">
          <span className="w-1 h-1.5 rounded-[1px] bg-white" />
          <span className="w-1 h-2 rounded-[1px] bg-white" />
          <span className="w-1 h-2.5 rounded-[1px] bg-white" />
          <span className="w-1 h-3.5 rounded-[1px] bg-white" />
        </div>

        {/* 100% and Battery */}
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-medium text-white">100%</span>
          <div className="w-6 h-3.5 rounded-[5px] border border-white/80 p-0.5 flex items-center relative">
            <div className="w-full h-full bg-white rounded-[2px]" />
            <div className="absolute -right-1 top-1 h-1.5 w-0.5 bg-white/80 rounded-r-sm" />
          </div>
        </div>

        {/* Quick Chassis Mode Toggle */}
        {onTogglePhoneFrame && (
          <button
            onClick={() => {
              playClick();
              triggerHaptic(15);
              onTogglePhoneFrame();
            }}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 border border-white/20 transition-all text-white/90 text-xs"
            title={isPhoneFrameMode ? 'Switch to Fullscreen Desktop OS' : 'Switch to iPad Pro Tablet Frame'}
          >
            {isPhoneFrameMode ? '🖥️' : '📱'}
          </button>
        )}

        {/* Control Center Pull-Down Trigger */}
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
