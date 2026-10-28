import React, { useState, useMemo } from 'react';
import {
  FEATURE_REGISTRY,
  type FeatureCategory,
  type ModularFeatureAction,
} from '../registry/feature-registry.js';
import { useHapticSoundFeedback } from '../hooks/useHapticSoundFeedback.js';

export interface AndroidAppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchApp: (action: ModularFeatureAction) => void;
  onAddToDesktop: (action: ModularFeatureAction) => void;
  onPinToDock: (action: ModularFeatureAction) => void;
  desktopIconIds: string[];
  dockItemIds: string[];
}

export const AndroidAppDrawer: React.FC<AndroidAppDrawerProps> = ({
  isOpen,
  onClose,
  onLaunchApp,
  onAddToDesktop,
  onPinToDock,
  desktopIconIds,
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

  const filtered = useMemo(() => {
    return FEATURE_REGISTRY.filter((action) => {
      const matchCat = selectedCategory === 'ALL' || action.category === selectedCategory;
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        action.label.toLowerCase().includes(term) ||
        action.shortLabel.toLowerCase().includes(term) ||
        action.description.toLowerCase().includes(term) ||
        action.tags.some((t) => t.toLowerCase().includes(term));
      return matchCat && matchSearch;
    });
  }, [searchTerm, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[85vh] h-full rounded-t-[36px] bg-slate-950/95 backdrop-blur-2xl border-t border-x border-white/20 p-6 flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.8)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Android Drawer Grab Handle */}
        <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mb-4 cursor-pointer" onClick={onClose} />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              ⋮⋮⋮
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">All Applications & Tools</h2>
              <p className="text-xs text-slate-400">150+ Hospital Services • Add to Home or Dock</p>
            </div>
          </div>
          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div className="py-3">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search by name, symptom, drug, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
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

        {/* Apps Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 pr-1 py-2">
          {filtered.map((action) => {
            const onDesktop = desktopIconIds.includes(action.id);
            const inDock = dockItemIds.includes(action.id);

            return (
              <div
                key={action.id}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 transition-all flex items-center justify-between gap-3 group"
              >
                <div
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => {
                    playClick();
                    triggerHaptic(15);
                    onLaunchApp(action);
                    onClose();
                  }}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.gradient} p-0.5 shadow-md flex-shrink-0 flex items-center justify-center text-white`}
                  >
                    <div className="w-full h-full rounded-[14px] bg-black/25 flex items-center justify-center font-bold text-sm">
                      {action.shortLabel.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-white group-hover:text-blue-400 transition-colors">
                      {action.label}
                    </div>
                    <div className="text-xs text-slate-400 line-clamp-1">{action.description}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => {
                      if (!onDesktop) {
                        onAddToDesktop(action);
                      }
                    }}
                    disabled={onDesktop}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                      onDesktop
                        ? 'bg-white/5 text-slate-500 border border-white/5 cursor-default'
                        : 'bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/10 active:scale-95'
                    }`}
                    title={onDesktop ? 'Already on Home Screen' : 'Add to Home Screen'}
                  >
                    {onDesktop ? '✓ Home' : '+ Home'}
                  </button>

                  <button
                    onClick={() => {
                      if (!inDock) {
                        onPinToDock(action);
                      }
                    }}
                    disabled={inDock}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                      inDock
                        ? 'bg-white/5 text-slate-500 border border-white/5 cursor-default'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md active:scale-95'
                    }`}
                    title={inDock ? 'Already in Dock' : 'Pin to Bottom Dock'}
                  >
                    {inDock ? '✓ Dock' : '+ Dock'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
