import React, { useState, useEffect } from 'react';
import { useHapticSoundFeedback } from '../hooks/useHapticSoundFeedback.js';

export interface IOSStatusBarProps {
  hospitalName?: string | undefined;
  staffName?: string | undefined;
  staffRole?: string | undefined;
  onOpenControlCenter?: (() => void) | undefined;
  onOpenWallpaperModal?: (() => void) | undefined;
  onLogout?: (() => void) | undefined;
  activeContextType?: ('CLINICAL' | 'CASHIER' | 'EMERGENCY') | undefined;
  patientName?: string | undefined;
  heartRate?: number | undefined;
  isPhoneFrameMode?: boolean | undefined;
  onTogglePhoneFrame?: (() => void) | undefined;
}

export const IOSStatusBar: React.FC<IOSStatusBarProps> = ({
  hospitalName = 'DocSearch Apollo Medical Center',
  staffName = 'Dr. Apollo (Chief Medical Officer)',
  staffRole = 'Chief Medical Officer',
  onOpenControlCenter,
  onOpenWallpaperModal,
  onLogout,
  activeContextType: _activeContextType = 'CLINICAL',
  patientName = 'Ward 4B / Bed 12',
  heartRate = 78,
  isPhoneFrameMode: _isPhoneFrameMode = false,
  onTogglePhoneFrame: _onTogglePhoneFrame,
}) => {
  const [timeStr, setTimeStr] = useState<string>('09:41');
  const [isDynamicIslandExpanded, setIsDynamicIslandExpanded] = useState<boolean>(false);
  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogoutClick = () => {
    playClick();
    triggerHaptic(30);
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('docsearch_partner_staff_auth');
      localStorage.removeItem('docsearch_auth_token');
      localStorage.setItem('docsearch_logged_out', 'true');
      window.location.href = '/';
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 h-12 z-50 px-5 flex items-center justify-between select-none text-[13px] font-semibold text-white pointer-events-auto bg-slate-950/70 backdrop-blur-2xl border-b border-white/10 shadow-lg">
      {/* 1. Left: Hospital Identity & Active Staff Session */}
      <div className="flex items-center gap-3">
        {/* Hospital Brand Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-300 font-bold shadow-sm">
          <span className="text-base leading-none">🏥</span>
          <span className="text-xs font-black tracking-wide text-white">DOC SEARCH</span>
        </div>

        {/* Tenant Name */}
        <div className="hidden md:flex flex-col text-left">
          <span className="text-[12px] font-bold text-white tracking-tight leading-tight">
            {hospitalName}
          </span>
          <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1 leading-none mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            PostgreSQL 18.4 Live • Shift: Active
          </span>
        </div>

        {/* Active Doctor / Staff Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 border border-white/15 text-xs text-slate-200">
          <span>👨‍⚕️</span>
          <span className="font-semibold text-white truncate max-w-[180px]">{staffName}</span>
          <span className="text-[10px] text-white/50 uppercase">({staffRole})</span>
        </div>
      </div>

      {/* 2. Center: Live Hospital Telemetry Pill (Clinical Heartbeat) */}
      <div className="absolute left-1/2 -translate-x-1/2 top-1.5 z-50">
        <div
          onClick={() => {
            playClick();
            triggerHaptic(15);
            setIsDynamicIslandExpanded(!isDynamicIslandExpanded);
          }}
          className={`cursor-pointer bg-black/90 text-white border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center ${
            isDynamicIslandExpanded
              ? 'w-[440px] p-4 rounded-[28px]'
              : 'px-4 py-1 rounded-full min-w-[280px] justify-between gap-4 hover:scale-[1.02] active:scale-95'
          }`}
        >
          {!isDynamicIslandExpanded ? (
            // Compact telemetry pill
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-500">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[13px] font-bold text-white leading-tight font-mono">{heartRate} bpm</span>
                  <span className="text-[10px] text-white/60 leading-none">{patientName}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-300">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  ICU Normal
                </span>
                <span className="text-white/40 font-mono text-[11px]">{timeStr}</span>
              </div>
            </>
          ) : (
            // Expanded Clinical Vitals HUD
            <div className="w-full space-y-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-sm text-white">Bedside ICU Telemetry</span>
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

      {/* 3. Right: Hospital Quick Tools & Prominent LOGOUT Button */}
      <div className="flex items-center gap-2.5">
        {/* System Time Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-slate-200">
          <span>🕒</span>
          <span>{timeStr} IST</span>
        </div>

        {/* Wallpaper engine modal trigger */}
        {onOpenWallpaperModal && (
          <button
            onClick={() => {
              playClick();
              triggerHaptic(15);
              onOpenWallpaperModal();
            }}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white border border-white/15 transition-all text-xs"
            title="Appearance / Visual Theme"
          >
            🖼️
          </button>
        )}

        {/* Control center trigger */}
        {onOpenControlCenter && (
          <button
            onClick={() => {
              playClick();
              triggerHaptic(20);
              onOpenControlCenter();
            }}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white border border-white/15 transition-all text-xs"
            title="Hospital Control Panel"
          >
            ⚙️
          </button>
        )}

        {/* PROMINENT LOGOUT BUTTON (Direct Single-Tap Exit) */}
        <button
          onClick={handleLogoutClick}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-500 text-white font-bold text-xs shadow-md border border-red-400/40 transition-all transform active:scale-95 cursor-pointer ml-1"
          title="Logout / End Staff Shift"
        >
          <span>🚪</span>
          <span className="tracking-wide">Logout</span>
        </button>
      </div>
    </header>
  );
};
