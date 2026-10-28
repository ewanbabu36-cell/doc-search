import React, { useState, useEffect, useRef } from 'react';
import { FEATURE_REGISTRY, type ModularFeatureAction, type FeatureCategory } from '../registry/feature-registry.js';
import { IOSIconRenderer } from './IOSIconRenderer.js';
import { useHapticSoundFeedback } from '../hooks/useHapticSoundFeedback.js';

export interface IOSSpotlightSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchApp: (action: ModularFeatureAction) => void;
}

export const IOSSpotlightSearch: React.FC<IOSSpotlightSearchProps> = ({
  isOpen,
  onClose,
  onLaunchApp,
}) => {
  const [query, setQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<FeatureCategory | 'ALL'>('ALL');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filter actions based on query and category
  const filteredActions = FEATURE_REGISTRY.filter((action) => {
    const matchesCategory = selectedCategory === 'ALL' || action.category === selectedCategory;
    const q = query.trim().toLowerCase();
    if (!q) return matchesCategory;
    const matchesText =
      action.label.toLowerCase().includes(q) ||
      action.shortLabel.toLowerCase().includes(q) ||
      action.description.toLowerCase().includes(q) ||
      action.tags.some((tag) => tag.toLowerCase().includes(q));
    return matchesCategory && matchesText;
  }).slice(0, 8);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredActions.length ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredActions[selectedIndex];
      if (current) {
        playClick();
        triggerHaptic(15);
        onLaunchApp(current);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center pt-24 px-4 bg-black/50 backdrop-blur-2xl animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-[28px] bg-slate-900/80 backdrop-blur-3xl border border-white/25 shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col space-y-3 p-4"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Apple Spotlight Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 border border-white/15 shadow-inner">
          <svg className="w-5 h-5 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Spotlight Search — OPD, Vitals, Beds, Pharmacy, Billing, Lab..."
            className="w-full bg-transparent text-white placeholder-white/40 text-base font-medium outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-white/50 hover:text-white text-xs px-2 py-0.5 rounded-full bg-white/10"
            >
              Clear
            </button>
          )}
          <span className="text-[11px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
            ESC to Exit
          </span>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {(['ALL', 'CLINICAL', 'INPATIENT', 'PHARMACY', 'BILLING', 'EMERGENCY', 'EXECUTIVE'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                playClick();
                setSelectedCategory(cat);
                setSelectedIndex(0);
              }}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat === 'ALL' ? 'All Features' : cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="max-h-96 overflow-y-auto space-y-1.5 pt-1">
          {filteredActions.length === 0 ? (
            <div className="text-center py-8 text-white/50 text-sm">
              No matching hospital modules or actions found for "{query}".
            </div>
          ) : (
            filteredActions.map((action, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={action.id}
                  onClick={() => {
                    playClick();
                    triggerHaptic(15);
                    onLaunchApp(action);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-600/30 border border-blue-400/40 shadow-lg'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Squircle Mini Icon */}
                    <div className={`w-11 h-11 rounded-[12px] bg-gradient-to-br ${action.gradient} p-[1px] shadow flex items-center justify-center text-white relative overflow-hidden flex-shrink-0`}>
                      <div className="absolute top-0 inset-x-0 h-1/2 bg-white/20 pointer-events-none" />
                      <IOSIconRenderer iconName={action.icon} size={22} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">
                          {action.label}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                          {action.category}
                        </span>
                      </div>
                      <p className="text-xs text-white/60 line-clamp-1 max-w-md">
                        {action.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {action.hotkey && (
                      <kbd className="px-2 py-0.5 text-[10px] font-mono text-white/50 bg-white/10 rounded-md">
                        {action.hotkey}
                      </kbd>
                    )}
                    <span className="text-white/40 text-sm">➔</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
