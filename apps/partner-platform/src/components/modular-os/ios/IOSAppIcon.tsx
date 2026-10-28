import React, { useRef } from 'react';
import { type ModularFeatureAction } from '../registry/feature-registry.js';
import { IOSIconRenderer } from './IOSIconRenderer.js';
import { useHapticSoundFeedback } from '../hooks/useHapticSoundFeedback.js';

export interface IOSAppIconProps {
  action: ModularFeatureAction;
  onLaunch: (action: ModularFeatureAction) => void;
  onDelete?: ((id: string) => void) | undefined;
  isJiggleMode?: boolean | undefined;
  onStartJiggle?: (() => void) | undefined;
  badgeValue?: string | number | null | undefined;
  size?: ('sm' | 'md' | 'lg') | undefined;
  hideLabel?: boolean | undefined;
  index?: number | undefined;
}

export const IOSAppIcon: React.FC<IOSAppIconProps> = ({
  action,
  onLaunch,
  onDelete,
  isJiggleMode = false,
  onStartJiggle,
  badgeValue,
  size = 'md',
  hideLabel = false,
  index = 0,
}) => {
  const { playClick, triggerHaptic } = useHapticSoundFeedback();
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDown = () => {
    if (onStartJiggle && !isJiggleMode) {
      longPressTimerRef.current = setTimeout(() => {
        triggerHaptic(50);
        onStartJiggle();
      }, 550);
    }
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isJiggleMode) {
      e.stopPropagation();
      return;
    }
    playClick();
    triggerHaptic(15);
    onLaunch(action);
  };

  // Dimension settings for pure Apple iOS squircle proportions
  const sizeMap = {
    sm: { iconBox: 'w-12 h-12', radius: 'rounded-[14px]', iconSize: 22, text: 'text-[11px] max-w-[64px]' },
    md: { iconBox: 'w-16 h-16', radius: 'rounded-[18px]', iconSize: 28, text: 'text-[12px] max-w-[80px]' },
    lg: { iconBox: 'w-20 h-20', radius: 'rounded-[22px]', iconSize: 36, text: 'text-[13px] max-w-[90px]' },
  };

  const currentSize = sizeMap[size];

  // Alternating jiggle delay to make it feel organic like genuine Apple iOS
  const jiggleDelay = `${((index % 4) * -0.1).toFixed(2)}s`;

  return (
    <div
      className={`flex flex-col items-center gap-1.5 select-none relative group cursor-pointer ${
        isJiggleMode ? 'ios-jiggle-active' : ''
      }`}
      style={{
        animationDelay: isJiggleMode ? jiggleDelay : undefined,
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(e) => {
        e.preventDefault();
        if (onStartJiggle && !isJiggleMode) {
          triggerHaptic(30);
          onStartJiggle();
        }
      }}
    >
      {/* Minus (-) Delete badge in Jiggle Edit Mode */}
      {isJiggleMode && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            playClick();
            triggerHaptic(20);
            onDelete(action.id);
          }}
          className="absolute -top-1.5 -left-1.5 z-30 w-5 h-5 rounded-full bg-slate-600/90 text-white flex items-center justify-center font-bold text-xs shadow-md border border-white/40 hover:bg-red-500 hover:scale-110 active:scale-95 transition-all"
          title="Remove App"
        >
          <span className="leading-none -mt-0.5">−</span>
        </button>
      )}

      {/* Notification badge at top-right */}
      {Boolean(badgeValue) && !isJiggleMode && (
        <div className="absolute -top-1 -right-1 z-20 min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg border border-white/60 animate-in zoom-in-75 duration-200">
          {badgeValue}
        </div>
      )}

      {/* Squircle App Container */}
      <div
        onClick={handleClick}
        className={`relative ${currentSize.iconBox} ${currentSize.radius} bg-gradient-to-br ${action.gradient} p-[1px] shadow-[0_8px_20px_-4px_rgba(0,0,0,0.5)] border border-white/20 transition-all duration-200 transform group-hover:scale-105 active:scale-95 group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.65)] overflow-hidden flex items-center justify-center`}
      >
        {/* Apple Gloss Specular Top Sheen */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0.08) 42%, rgba(0, 0, 0, 0.1) 60%, rgba(0, 0, 0, 0.25) 100%)',
          }}
        />

        {/* Icon & Label */}
        <div className="relative z-10 text-white flex items-center justify-center filter drop-shadow">
          <IOSIconRenderer iconName={action.icon} size={currentSize.iconSize} />
        </div>
      </div>

      {/* Crisp iOS Typography Label */}
      {!hideLabel && (
        <span
          className={`font-medium ${currentSize.text} text-slate-100 text-center leading-tight tracking-tight truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] transition-colors group-hover:text-white`}
        >
          {action.shortLabel || action.label}
        </span>
      )}
    </div>
  );
};
