import React, { useState } from 'react';
import {
  FEATURE_REGISTRY,
  type ModularFeatureAction,
  type FeatureCategory,
} from '../registry/feature-registry.js';
import { IOSAppIcon } from './IOSAppIcon.js';
import { useHapticSoundFeedback } from '../hooks/useHapticSoundFeedback.js';

export interface IOSAppLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchApp: (action: ModularFeatureAction) => void;
  onPinToHome?: (action: ModularFeatureAction) => void;
}

export const IOSAppLibrary: React.FC<IOSAppLibraryProps> = ({
  isOpen,
  onClose,
  onLaunchApp,
  onPinToHome,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCategory, setExpandedCategory] = useState<FeatureCategory | null>(null);
  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  if (!isOpen) return null;

  const categories: { key: FeatureCategory; title: string; icon: string }[] = [
    { key: 'CLINICAL', title: 'Clinical Suite', icon: '🩺' },
    { key: 'INPATIENT', title: 'Inpatient & OT', icon: '🏥' },
    { key: 'PHARMACY', title: 'Pharmacy & Lab', icon: '💊' },
    { key: 'BILLING', title: 'Billing & Finance', icon: '💳' },
    { key: 'EMERGENCY', title: 'Emergency Trauma', icon: '🚨' },
    { key: 'EXECUTIVE', title: 'Executive & Admin', icon: '📊' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-3xl animate-in fade-in duration-200 select-none overflow-y-auto px-4 md:px-12 py-8 pointer-events-auto"
      onClick={onClose}
    >
      <div className="max-w-5xl mx-auto w-full space-y-6" onClick={(e) => e.stopPropagation()}>
        {/* Top Header & Search Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>App Library</span>
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-white/70">
              {FEATURE_REGISTRY.length} Modules
            </span>
          </div>

          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/20 transition-all active:scale-95"
          >
            Done
          </button>
        </div>

        {/* Search input in App Library */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search App Library..."
            className="w-full px-10 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm outline-none focus:border-blue-400 focus:bg-white/15 transition-all"
          />
          <span className="absolute left-3.5 top-3.5 text-white/40 text-sm">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3 text-xs text-white/50 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Expanded Category Modal if clicked on 4th mini folder slot */}
        {expandedCategory ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <button
                onClick={() => setExpandedCategory(null)}
                className="text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                ← Back to Categories
              </button>
              <h3 className="text-lg font-bold text-white">
                {categories.find((c) => c.key === expandedCategory)?.title}
              </h3>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6 justify-items-center">
              {FEATURE_REGISTRY.filter((a) => a.category === expandedCategory).map((action, idx) => (
                <div key={action.id} className="flex flex-col items-center gap-1">
                  <IOSAppIcon
                    action={action}
                    onLaunch={(act) => {
                      onLaunchApp(act);
                      onClose();
                    }}
                    size="md"
                    index={idx}
                  />
                  {onPinToHome && (
                    <button
                      onClick={() => {
                        playClick();
                        triggerHaptic(15);
                        onPinToHome(action);
                      }}
                      className="text-[10px] text-blue-300 hover:text-blue-100 mt-0.5"
                    >
                      + Add to Home
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Grid of 2x2 Apple Category Folders */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const categoryActions = FEATURE_REGISTRY.filter((a) => {
                const matches = a.category === cat.key;
                if (!searchQuery) return matches;
                const q = searchQuery.toLowerCase();
                return (
                  matches &&
                  (a.label.toLowerCase().includes(q) ||
                    a.shortLabel.toLowerCase().includes(q) ||
                    a.description.toLowerCase().includes(q))
                );
              });

              if (categoryActions.length === 0) return null;

              const topThree = categoryActions.slice(0, 3);
              const remaining = categoryActions.slice(3);

              return (
                <div
                  key={cat.key}
                  className="p-4 rounded-[28px] bg-white/10 dark:bg-black/40 backdrop-blur-2xl border border-white/20 shadow-xl space-y-3 transition-all hover:border-white/35"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-bold text-xs text-white tracking-wide flex items-center gap-1.5">
                      <span>{cat.icon}</span>
                      <span>{cat.title}</span>
                    </span>
                    <span className="text-[10px] text-white/50">
                      {categoryActions.length} apps
                    </span>
                  </div>

                  {/* 2x2 Apple App Library Folder Grid */}
                  <div className="grid grid-cols-2 gap-3.5 justify-items-center">
                    {topThree.map((action, idx) => (
                      <IOSAppIcon
                        key={action.id}
                        action={action}
                        onLaunch={(act) => {
                          onLaunchApp(act);
                          onClose();
                        }}
                        size="md"
                        index={idx}
                      />
                    ))}

                    {/* 4th slot: Mini Folder Cluster */}
                    <div
                      onClick={() => {
                        playClick();
                        triggerHaptic(15);
                        setExpandedCategory(cat.key);
                      }}
                      className="flex flex-col items-center gap-1 cursor-pointer group"
                    >
                      <div className="w-16 h-16 rounded-[18px] bg-white/10 hover:bg-white/20 border border-white/20 shadow flex items-center justify-center transition-all group-hover:scale-105 active:scale-95">
                        <div className="grid grid-cols-2 gap-1 p-1.5 w-11 h-11 rounded-xl bg-black/40">
                          {remaining.slice(0, 4).map((r, i) => (
                            <div
                              key={i}
                              className={`rounded-sm bg-gradient-to-br ${r.gradient}`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-blue-300 group-hover:text-blue-100 transition-colors">
                        +{remaining.length || 0} More
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
