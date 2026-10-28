import React, { useState, useEffect } from 'react';
import { useHapticSoundFeedback } from '../hooks/useHapticSoundFeedback.js';

export interface AndroidStatusBarProps {
  hospitalName?: string;
  onOpenWallpaperModal: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
}

export const AndroidStatusBar: React.FC<AndroidStatusBarProps> = ({
  hospitalName = 'DocSearch Apollo Medical Center',
  onOpenWallpaperModal,
  onOpenNotifications,
  unreadNotificationsCount = 3,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 h-7 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-white/10 px-4 flex items-center justify-between select-none text-[11px] font-medium text-slate-300">
      {/* Left: Hospital Brand & Live DB Indicator */}
      <div className="flex items-center gap-3">
        <span className="font-bold text-white tracking-wide flex items-center gap-1.5">
          <span className="text-sm">🏥</span>
          <span className="truncate max-w-[200px]">{hospitalName}</span>
        </span>
        <span className="h-3 w-px bg-white/20" />
        <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live PG 18.4</span>
        </span>
      </div>

      {/* Center: Shift Countdown */}
      <div className="hidden md:flex items-center gap-2">
        <div className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[10px] flex items-center gap-1.5">
          <span className="text-amber-400">⏱️</span>
          <span>Shift Remaining:</span>
          <span className="font-mono font-bold text-amber-300">04h 15m</span>
        </div>
      </div>

      {/* Right: Controls, Notifications & Time */}
      <div className="flex items-center gap-3">
        {/* Sound toggle */}
        <button
          onClick={() => {
            playClick();
            setSoundEnabled(!soundEnabled);
          }}
          className="text-slate-400 hover:text-white transition-colors"
          title={soundEnabled ? 'Acoustic Cues Enabled' : 'Muted'}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>

        {/* Wallpaper Engine Trigger */}
        <button
          onClick={() => {
            playClick();
            triggerHaptic(12);
            onOpenWallpaperModal();
          }}
          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold border border-white/15 transition-all active:scale-95"
          title="Change Wallpaper & Blur"
        >
          <span>🖼️</span>
          <span className="hidden sm:inline">Wallpaper</span>
        </button>

        {/* Notification Bell */}
        <button
          onClick={() => {
            playClick();
            onOpenNotifications?.();
          }}
          className="relative text-slate-400 hover:text-white transition-colors"
          title="Notifications"
        >
          <span>🔔</span>
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-rose-600 text-white text-[8px] font-bold flex items-center justify-center">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        <span className="h-3 w-px bg-white/20" />

        {/* Live Clock */}
        <span className="font-mono font-bold text-slate-100 text-[11px] tracking-tight">
          {timeStr || '07:45 PM'}
        </span>
      </div>
    </header>
  );
};
