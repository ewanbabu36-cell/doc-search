import React, { useState } from 'react';
import { type HealthOSAppItem } from './health-os-types.js';
import { HEALTH_OS_APPS } from './health-os-registry.js';

export interface HealthOSAppDrawerProps {
  isOpen: boolean;
  onSelectApp: (app: HealthOSAppItem) => void;
  onClose: () => void;
}

export const HealthOSAppDrawer: React.FC<HealthOSAppDrawerProps> = ({
  isOpen,
  onSelectApp,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredApps = HEALTH_OS_APPS.filter((app) =>
    app.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-45 pt-16 pb-20 px-4 md:px-8 bg-slate-950/90 backdrop-blur-3xl animate-in fade-in duration-200 select-none overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="max-w-4xl mx-auto w-full py-4 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-xl text-blue-400">
              📱
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">DocSearch Master App Drawer</h2>
              <p className="text-xs text-slate-400">All clinical, pharmacy, diagnostic & hospital operations tools</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search hospital app..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className="w-full sm:w-64 px-3.5 py-1.5 pl-9 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-400"
              />
              <span className="absolute left-3 top-2 text-xs text-slate-400">🔍</span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
              title="Close Drawer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* All Apps Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredApps.map((app) => (
            <button
              key={app.id}
              onClick={() => onSelectApp(app)}
              className="flex flex-col items-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400/50 transition-all text-center group cursor-pointer active:scale-95"
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${app.gradient} flex items-center justify-center text-2xl text-white shadow-lg group-hover:scale-105 transition-transform`}
              >
                {app.icon}
              </div>
              <span className="mt-2.5 text-xs font-bold text-white group-hover:text-blue-300 line-clamp-1">
                {app.shortLabel}
              </span>
              <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                {app.category}
              </span>
              {app.badge && (
                <span className="mt-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-emerald-400">
                  {app.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
