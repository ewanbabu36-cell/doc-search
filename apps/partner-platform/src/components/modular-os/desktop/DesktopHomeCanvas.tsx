import React, { useState } from 'react';
import {
  FEATURE_REGISTRY,
  type ModularFeatureAction,
} from '../registry/feature-registry.js';
import { DigitalClockWidget, BedOccupancyWidget } from '../widgets/DesktopWidgets.js';
import { useHapticSoundFeedback } from '../hooks/useHapticSoundFeedback.js';
import type { DesktopIconItem } from '../hooks/useWorkspaceLayout.js';

export interface DesktopHomeCanvasProps {
  desktopIcons: DesktopIconItem[];
  onLaunchApp: (action: ModularFeatureAction) => void;
  onRemoveFromDesktop: (id: string) => void;
  onPinToDock: (action: ModularFeatureAction) => void;
}

export const DesktopHomeCanvas: React.FC<DesktopHomeCanvasProps> = ({
  desktopIcons,
  onLaunchApp,
  onRemoveFromDesktop,
  onPinToDock,
}) => {
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    action: ModularFeatureAction | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    action: null,
  });

  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  const handleContextMenu = (e: React.MouseEvent, action: ModularFeatureAction) => {
    e.preventDefault();
    playClick();
    triggerHaptic(20);
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      action,
    });
  };

  const closeContextMenu = () => {
    if (contextMenu.visible) {
      setContextMenu((prev) => ({ ...prev, visible: false }));
    }
  };

  return (
    <div
      className="relative w-full min-h-[calc(100vh-140px)] flex flex-col justify-between py-6 px-4 md:px-10 select-none"
      onClick={closeContextMenu}
    >
      {/* Top Section: Android Desktop Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mb-8">
        <DigitalClockWidget />
        <BedOccupancyWidget />
      </div>

      {/* Center Section: Android Home Screen App Grid */}
      <div className="flex-1">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <span>📱</span>
            <span>Home Screen Apps</span>
          </span>
          <span className="text-[11px] text-slate-400">Right-click or hold an icon for options</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6 justify-items-center">
          {desktopIcons.map((item) => {
            const action = FEATURE_REGISTRY.find((a) => a.id === item.id);
            if (!action) return null;

            return (
              <div
                key={action.id}
                onContextMenu={(e) => handleContextMenu(e, action)}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <button
                  onClick={() => {
                    playClick();
                    triggerHaptic(15);
                    onLaunchApp(action);
                  }}
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${action.gradient} p-0.5 shadow-xl flex items-center justify-center transition-all transform group-hover:-translate-y-2 group-hover:scale-105 active:scale-95 group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.6)] relative overflow-hidden`}
                >
                  <div className="w-full h-full rounded-[14px] bg-black/25 flex items-center justify-center text-white relative">
                    {/* Top specular hairline */}
                    <div className="absolute top-0 inset-x-0 h-px bg-white/40" />
                    <span className="font-extrabold text-base tracking-tight drop-shadow">
                      {action.shortLabel.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                </button>

                <span className="text-xs font-semibold text-slate-200 text-center leading-tight max-w-[80px] line-clamp-1 group-hover:text-white group-hover:drop-shadow transition-colors">
                  {action.shortLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Android Context Menu */}
      {contextMenu.visible && contextMenu.action && (
        <div
          className="fixed z-50 w-48 py-2 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-white/20 shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-150"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10">
            {contextMenu.action.label}
          </div>
          <button
            onClick={() => {
              playClick();
              if (contextMenu.action) onLaunchApp(contextMenu.action);
              closeContextMenu();
            }}
            className="w-full px-3 py-1.5 text-left text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 flex items-center gap-2"
          >
            <span>🚀</span>
            <span>Launch App</span>
          </button>
          <button
            onClick={() => {
              playClick();
              if (contextMenu.action) onPinToDock(contextMenu.action);
              closeContextMenu();
            }}
            className="w-full px-3 py-1.5 text-left text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 flex items-center gap-2"
          >
            <span>📌</span>
            <span>Pin to Bottom Dock</span>
          </button>
          <button
            onClick={() => {
              playClick();
              if (contextMenu.action) onRemoveFromDesktop(contextMenu.action.id);
              closeContextMenu();
            }}
            className="w-full px-3 py-1.5 text-left text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 border-t border-white/10"
          >
            <span>🗑️</span>
            <span>Remove from Desktop</span>
          </button>
        </div>
      )}
    </div>
  );
};
