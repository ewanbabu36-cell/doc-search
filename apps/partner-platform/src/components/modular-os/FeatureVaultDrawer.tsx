import React, { useState, useMemo } from 'react';
import {
  FEATURE_REGISTRY,
  ROLE_PRESET_CONFIGURATIONS,
  type FeatureCategory,
  type ModularFeatureAction,
} from './registry/feature-registry.js';
import { useHapticSoundFeedback } from './hooks/useHapticSoundFeedback.js';

export interface FeatureVaultDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onPinToDock: (action: ModularFeatureAction) => void;
  onSelectAction: (action: ModularFeatureAction) => void;
  onApplyPreset: (presetKey: string) => void;
  onRestoreDefaults: () => void;
  dockItemIds: string[];
}

export const FeatureVaultDrawer: React.FC<FeatureVaultDrawerProps> = ({
  isOpen,
  onClose,
  onPinToDock,
  onSelectAction,
  onApplyPreset,
  onRestoreDefaults,
  dockItemIds,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<FeatureCategory | 'ALL'>('ALL');
  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  const categories: (FeatureCategory | 'ALL')[] = [
    'ALL',
    'CLINICAL',
    'INPATIENT',
    'PHARMACY',
    'BILLING',
    'EMERGENCY',
    'EXECUTIVE',
  ];

  const filteredActions = useMemo(() => {
    return FEATURE_REGISTRY.filter((action) => {
      const matchesCategory = selectedCategory === 'ALL' || action.category === selectedCategory;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        action.label.toLowerCase().includes(term) ||
        action.shortLabel.toLowerCase().includes(term) ||
        action.description.toLowerCase().includes(term) ||
        action.tags.some((tag) => tag.toLowerCase().includes(term));
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl h-full bg-slate-950/95 backdrop-blur-2xl border-l border-white/20 p-6 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg flex items-center justify-center">
              <span className="text-xl">📱</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Feature Vault</h2>
              <p className="text-xs text-slate-400">150+ Modular Healthcare Tools & Actions</p>
            </div>
          </div>
          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div className="pt-4 pb-3">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search actions, tools, registers (e.g. Rx, Bed, Cashier, Triage)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                playClick();
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Role Presets Section */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 mb-3">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role Presets</span>
            <button
              onClick={() => {
                playClick();
                triggerHaptic(20);
                onRestoreDefaults();
              }}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
            >
              Reset Defaults
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(ROLE_PRESET_CONFIGURATIONS).map(([key, config]) => (
              <button
                key={key}
                onClick={() => {
                  playClick();
                  triggerHaptic(15);
                  onApplyPreset(key);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-xs font-medium text-slate-200 hover:text-white transition-all flex items-center justify-between"
              >
                <span>{config.name}</span>
                <span className="text-slate-500 text-[10px]">Apply ➔</span>
              </button>
            ))}
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {filteredActions.map((action) => {
            const isPinned = dockItemIds.includes(action.id);
            return (
              <div
                key={action.id}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 transition-all flex items-center justify-between gap-3 group"
              >
                <div
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => {
                    playClick();
                    onSelectAction(action);
                  }}
                >
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${action.gradient} p-0.5 shadow-md flex-shrink-0 flex items-center justify-center text-white`}
                  >
                    <div className="w-full h-full rounded-[14px] bg-black/25 flex items-center justify-center font-bold text-sm">
                      {action.shortLabel.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white group-hover:text-blue-400 transition-colors">
                        {action.label}
                      </span>
                      {action.badgeTelemetryKey && (
                        <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-slate-400 text-[9px] font-mono">
                          Live Data
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{action.description}</p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <button
                    onClick={() => {
                      if (!isPinned) {
                        onPinToDock(action);
                      }
                    }}
                    disabled={isPinned}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isPinned
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md active:scale-95'
                    }`}
                  >
                    {isPinned ? '✓ In Dock' : '+ Pin'}
                  </button>
                </div>
              </div>
            );
          })}
          {filteredActions.length === 0 && (
            <div className="py-16 text-center text-slate-400 text-sm">
              No matching tools found for "{searchTerm}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
