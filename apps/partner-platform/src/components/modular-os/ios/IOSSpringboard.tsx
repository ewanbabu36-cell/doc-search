import React, { useRef } from 'react';
import { FEATURE_REGISTRY, type ModularFeatureAction } from '../registry/feature-registry.js';
import { IOSAppIcon } from './IOSAppIcon.js';
import { DigitalClockWidget, BedOccupancyWidget, CashierRevenueWidget } from '../widgets/DesktopWidgets.js';
import { useHapticSoundFeedback } from '../hooks/useHapticSoundFeedback.js';
import type { DesktopIconItem } from '../hooks/useWorkspaceLayout.js';

export interface IOSSpringboardProps {
  desktopIcons: DesktopIconItem[];
  onLaunchApp: (action: ModularFeatureAction) => void;
  onRemoveFromDesktop: (id: string) => void;
  onOpenSpotlight: () => void;
  isJiggleMode: boolean;
  onSetJiggleMode: (val: boolean) => void;
  onOpenAppLibrary: () => void;
}

export const IOSSpringboard: React.FC<IOSSpringboardProps> = ({
  desktopIcons,
  onLaunchApp,
  onRemoveFromDesktop,
  onOpenSpotlight,
  isJiggleMode,
  onSetJiggleMode,
  onOpenAppLibrary,
}) => {
  const { playClick, triggerHaptic } = useHapticSoundFeedback();
  const touchStartYRef = useRef<number | null>(null);

  // Swipe down on Springboard triggers Spotlight Search
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current !== null && e.changedTouches[0]) {
      const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
      if (deltaY > 80 && !isJiggleMode) {
        // Dragged down
        playClick();
        triggerHaptic(20);
        onOpenSpotlight();
      }
      touchStartYRef.current = null;
    }
  };

  return (
    <div
      className="relative w-full min-h-[calc(100vh-140px)] flex flex-col justify-between py-6 px-4 md:px-12 select-none pointer-events-auto"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => {
        e.preventDefault();
        if (!isJiggleMode) {
          triggerHaptic(30);
          onSetJiggleMode(true);
        }
      }}
    >
      {/* 1. Jiggle Mode Top Bar Controls */}
      {isJiggleMode && (
        <div className="fixed top-12 inset-x-6 z-40 flex items-center justify-between animate-in fade-in duration-200">
          <button
            onClick={() => {
              playClick();
              onOpenAppLibrary();
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg active:scale-95 transition-all"
          >
            <span>+</span>
            <span>Add Apps</span>
          </button>

          <button
            onClick={() => {
              playClick();
              triggerHaptic(20);
              onSetJiggleMode(false);
            }}
            className="px-5 py-1.5 rounded-full bg-white/25 hover:bg-white/35 text-white font-bold text-xs backdrop-blur-xl border border-white/30 shadow-lg active:scale-95 transition-all"
          >
            Done
          </button>
        </div>
      )}

      {/* 2. Top Section: Apple iOS Smart Glass Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto w-full mb-8">
        <DigitalClockWidget />
        <BedOccupancyWidget />
        <div className="hidden lg:block">
          <CashierRevenueWidget />
        </div>
      </div>

      {/* 3. Center Section: Apple iOS Springboard App Grid */}
      <div className="flex-1 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-6 gap-y-7 justify-items-center">
          {desktopIcons.map((item, idx) => {
            const action = FEATURE_REGISTRY.find((a) => a.id === item.id);
            if (!action) return null;

            return (
              <IOSAppIcon
                key={action.id}
                action={action}
                onLaunch={onLaunchApp}
                onDelete={onRemoveFromDesktop}
                isJiggleMode={isJiggleMode}
                onStartJiggle={() => onSetJiggleMode(true)}
                size="md"
                index={idx}
              />
            );
          })}
        </div>
      </div>

      {/* 4. Bottom Page Indicators & Spotlight Search Pill */}
      <div className="pt-6 pb-2 flex flex-col items-center justify-center gap-2">
        <button
          onClick={() => {
            playClick();
            triggerHaptic(15);
            onOpenSpotlight();
          }}
          className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 border border-white/20 text-white/90 text-[11px] font-semibold backdrop-blur-xl shadow transition-all group"
          title="Spotlight Search (Cmd+K)"
        >
          <span className="text-xs group-hover:scale-110 transition-transform">🔍</span>
          <span>Search</span>
        </button>

        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white shadow-sm" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
        </div>
      </div>
    </div>
  );
};
