import React, { useState } from 'react';
import { useHapticSoundFeedback } from '../hooks/useHapticSoundFeedback.js';

export interface IOSControlCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWallpaperModal: () => void;
  staffName?: string | undefined;
  staffRole?: string | undefined;
  onLockScreen?: (() => void) | undefined;
}

export const IOSControlCenter: React.FC<IOSControlCenterProps> = ({
  isOpen,
  onClose,
  onOpenWallpaperModal,
  staffName = 'Dr. Apex / Apollo Staff',
  staffRole = 'Chief Medical Officer',
  onLockScreen,
}) => {
  const [wifiEnabled, setWifiEnabled] = useState<boolean>(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState<boolean>(true);
  const [cellularEnabled, setCellularEnabled] = useState<boolean>(true);
  const [airplaneEnabled, setAirplaneEnabled] = useState<boolean>(false);
  const [activeFocus, setActiveFocus] = useState<string>('Clinical Focus');
  const [brightness, setBrightness] = useState<number>(85);
  const [volume, setVolume] = useState<number>(90);

  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end p-4 md:p-6 bg-black/40 backdrop-blur-2xl animate-in fade-in duration-200 select-none pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[36px] bg-slate-950/80 backdrop-blur-3xl border border-white/20 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.85)] space-y-4 animate-in slide-in-from-top-6 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title and Close Pill */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎛️</span>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Control Center</h3>
              <p className="text-[11px] text-white/50">DocSearch iOS Environment</p>
            </div>
          </div>
          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>

        {/* 1. Connectivity 2x2 Glass Card & Sliders */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Connectivity 2x2 Card */}
          <div className="p-3 rounded-3xl bg-white/10 border border-white/15 grid grid-cols-2 gap-2.5">
            {/* Airplane Mode */}
            <button
              onClick={() => {
                playClick();
                triggerHaptic(15);
                setAirplaneEnabled(!airplaneEnabled);
              }}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                airplaneEnabled ? 'bg-amber-500 text-white' : 'bg-white/15 text-white/80'
              }`}
              title="Airplane Mode"
            >
              ✈️
            </button>

            {/* Cellular DocSearch 5G */}
            <button
              onClick={() => {
                playClick();
                triggerHaptic(15);
                setCellularEnabled(!cellularEnabled);
              }}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                cellularEnabled ? 'bg-emerald-500 text-white' : 'bg-white/15 text-white/80'
              }`}
              title="Cellular 5G"
            >
              📶
            </button>

            {/* Wi-Fi Live PostgreSQL 18.4 */}
            <button
              onClick={() => {
                playClick();
                triggerHaptic(15);
                setWifiEnabled(!wifiEnabled);
              }}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                wifiEnabled ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40' : 'bg-white/15 text-white/80'
              }`}
              title="Wi-Fi (PostgreSQL Live)"
            >
              📡
            </button>

            {/* Bluetooth Soundbox */}
            <button
              onClick={() => {
                playClick();
                triggerHaptic(15);
                setBluetoothEnabled(!bluetoothEnabled);
              }}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                bluetoothEnabled ? 'bg-blue-600 text-white' : 'bg-white/15 text-white/80'
              }`}
              title="Soundbox Bluetooth"
            >
              🔊
            </button>
          </div>

          {/* Vertical Sliders (Brightness & Volume) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Brightness Slider */}
            <div className="relative h-28 rounded-3xl bg-white/10 border border-white/15 overflow-hidden flex flex-col justify-end p-2 group">
              <div
                className="absolute inset-x-0 bottom-0 bg-white transition-all duration-150"
                style={{ height: `${brightness}%` }}
              />
              <div className="relative z-10 text-center pointer-events-none">
                <span className={`text-base ${brightness > 50 ? 'text-black' : 'text-white'}`}>
                  ☀️
                </span>
                <span className={`block text-[10px] font-bold ${brightness > 50 ? 'text-black/80' : 'text-white/80'}`}>
                  {brightness}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-ns-resize"
              />
            </div>

            {/* Soundbox Volume Slider */}
            <div className="relative h-28 rounded-3xl bg-white/10 border border-white/15 overflow-hidden flex flex-col justify-end p-2 group">
              <div
                className="absolute inset-x-0 bottom-0 bg-white transition-all duration-150"
                style={{ height: `${volume}%` }}
              />
              <div className="relative z-10 text-center pointer-events-none">
                <span className={`text-base ${volume > 50 ? 'text-black' : 'text-white'}`}>
                  🔉
                </span>
                <span className={`block text-[10px] font-bold ${volume > 50 ? 'text-black/80' : 'text-white/80'}`}>
                  {volume}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-ns-resize"
              />
            </div>
          </div>
        </div>

        {/* 2. Focus Mode Glass Tile */}
        <div className="p-3.5 rounded-3xl bg-white/10 border border-white/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🌙</span>
            <div>
              <span className="text-xs font-bold text-white block">Focus Mode</span>
              <span className="text-[11px] text-purple-300 font-medium">{activeFocus}</span>
            </div>
          </div>
          <button
            onClick={() => {
              playClick();
              triggerHaptic(15);
              const modes = ['Clinical Focus', 'Emergency Priority', 'Night Shift', 'Do Not Disturb'];
              const nextIndex = (modes.indexOf(activeFocus) + 1) % modes.length;
              setActiveFocus(modes[nextIndex] || 'Clinical Focus');
            }}
            className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white font-medium border border-white/10 transition-colors"
          >
            Switch
          </button>
        </div>

        {/* 3. Wallpaper Engine & Personalization Shortcut */}
        <button
          onClick={() => {
            playClick();
            triggerHaptic(15);
            onOpenWallpaperModal();
            onClose();
          }}
          className="w-full p-3.5 rounded-3xl bg-gradient-to-r from-blue-600/30 to-purple-600/30 hover:from-blue-600/40 hover:to-purple-600/40 border border-white/20 flex items-center justify-between text-left transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🖼️</span>
            <div>
              <span className="text-xs font-bold text-white block">Wallpaper & Theme Studio</span>
              <span className="text-[11px] text-white/60">iOS 18 Dynamic Gradients & Blur</span>
            </div>
          </div>
          <span className="text-white/60 text-xs">➔</span>
        </button>

        {/* 4. Active Staff Profile & Lock Screen */}
        <div className="p-3.5 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs border border-white/20">
              {staffName.charAt(0)}
            </div>
            <div>
              <span className="text-xs font-bold text-white block leading-tight truncate max-w-[130px]">
                {staffName}
              </span>
              <span className="text-[10px] text-white/50 block">{staffRole}</span>
            </div>
          </div>

          {onLockScreen && (
            <button
              onClick={() => {
                playClick();
                triggerHaptic(25);
                onLockScreen();
                onClose();
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-medium transition-colors"
              title="Lock Screen"
            >
              <span>🔒</span>
              <span>Lock</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
