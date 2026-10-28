import React from 'react';
import { useHapticSoundFeedback } from '../hooks/useHapticSoundFeedback.js';

export interface WallpaperPreset {
  id: string;
  name: string;
  category: 'DARK_OLED' | 'MEDICAL' | 'ABSTRACT' | 'LIGHT';
  gradientCss: string;
  previewColor: string;
}

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: 'OLED_COSMIC_BLUE',
    name: 'OLED Cosmic Cobalt',
    category: 'DARK_OLED',
    gradientCss: 'radial-gradient(ellipse at top, #1e1b4b 0%, #0b0f19 60%, #020617 100%)',
    previewColor: '#1e1b4b',
  },
  {
    id: 'MEDICAL_FROST_BOKEH',
    name: 'Medical Frost & Cyan',
    category: 'MEDICAL',
    gradientCss: 'radial-gradient(circle at 80% 20%, #0f766e 0%, #042f2e 50%, #021a1a 100%)',
    previewColor: '#0f766e',
  },
  {
    id: 'EMERALD_NEURAL_WAVE',
    name: 'Emerald Bio-Wave',
    category: 'ABSTRACT',
    gradientCss: 'linear-gradient(135deg, #064e3b 0%, #022c22 45%, #052e16 100%)',
    previewColor: '#064e3b',
  },
  {
    id: 'OBSIDIAN_MINIMALIST',
    name: 'Obsidian Titanium',
    category: 'DARK_OLED',
    gradientCss: 'linear-gradient(180deg, #18181b 0%, #09090b 60%, #000000 100%)',
    previewColor: '#18181b',
  },
  {
    id: 'DAYLIGHT_PAPER_WHITE',
    name: 'Daylight Clinical Ivory',
    category: 'LIGHT',
    gradientCss: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 60%, #cbd5e1 100%)',
    previewColor: '#e2e8f0',
  },
];

export interface WallpaperEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWallpaperId: string;
  customWallpaperUrl?: string | null;
  wallpaperBlurPx: number;
  onSelectPreset: (id: string) => void;
  onSetCustomUrl: (url: string) => void;
  onChangeBlur: (blurPx: number) => void;
}

export const WallpaperEngineModal: React.FC<WallpaperEngineModalProps> = ({
  isOpen,
  onClose,
  activeWallpaperId,
  customWallpaperUrl,
  wallpaperBlurPx,
  onSelectPreset,
  onSetCustomUrl,
  onChangeBlur,
}) => {
  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg p-6 rounded-3xl bg-slate-950/90 backdrop-blur-2xl border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.8)] space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🖼️</span>
            <div>
              <h3 className="font-bold text-base text-white">Wallpaper & Visual Canvas</h3>
              <p className="text-xs text-slate-400">Android OS Desktop Personalization</p>
            </div>
          </div>
          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Wallpaper Presets Grid */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Curated 4K Themes
          </label>
          <div className="grid grid-cols-3 gap-3">
            {WALLPAPER_PRESETS.map((preset) => {
              const isSelected = activeWallpaperId === preset.id && !customWallpaperUrl;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    playClick();
                    triggerHaptic(15);
                    onSelectPreset(preset.id);
                  }}
                  className={`h-20 rounded-2xl p-2 relative flex flex-col justify-end text-left border transition-all transform hover:scale-[1.02] active:scale-95 overflow-hidden ${
                    isSelected
                      ? 'border-blue-400 ring-2 ring-blue-500 shadow-lg'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                  style={{ background: preset.gradientCss }}
                >
                  <div className="absolute inset-0 bg-black/20" />
                  <span className="relative z-10 text-[11px] font-bold text-white drop-shadow">
                    {preset.name}
                  </span>
                  {isSelected && (
                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Wallpaper URL Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Custom Hospital Wallpaper URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://images.unsplash.com/... or hospital CDN"
              defaultValue={customWallpaperUrl || ''}
              onBlur={(e) => onSetCustomUrl(e.target.value.trim())}
              className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Blur & Acrylic Frosted Glass Slider */}
        <div className="space-y-2 bg-white/5 p-3 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Frosted Glass Acrylic Blur</span>
            <span className="font-mono text-blue-400 font-bold">{wallpaperBlurPx} px</span>
          </div>
          <input
            type="range"
            min={0}
            max={25}
            value={wallpaperBlurPx}
            onChange={(e) => onChangeBlur(Number(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-medium">
            <span>Sharp 4K Photo (0px)</span>
            <span>Ultra Glass Blur (25px)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
