import React from 'react';
import { type HealthOSAppItem } from './health-os-types.js';

export interface HealthOSAppWindowProps {
  app: HealthOSAppItem;
  onClose: () => void;
  onMinimize: () => void;
  children: React.ReactNode;
}

export const HealthOSAppWindow: React.FC<HealthOSAppWindowProps> = ({
  app,
  onClose,
  onMinimize,
  children,
}) => {
  return (
    <div className="fixed inset-0 top-13 bottom-13 z-30 bg-slate-950 flex flex-col select-none overflow-hidden animate-in fade-in duration-150">
      {/* Window Top Control Bar */}
      <div className="h-11 px-4 bg-slate-900 border-b border-white/10 flex items-center justify-between flex-shrink-0">
        {/* Left: Back Key & Module Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-bold transition-all cursor-pointer"
            title="Exit to Homescreen (Back)"
          >
            <span>◂</span>
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-base">{app.icon}</span>
            <span className="text-xs font-bold text-white tracking-tight truncate max-w-[200px] sm:max-w-none">
              {app.label}
            </span>
            <span className="hidden md:inline-block text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded bg-white/5">
              {app.category}
            </span>
          </div>
        </div>

        {/* Right: Window Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onMinimize}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
            title="Minimize to Homescreen [ 🗕 ]"
          >
            🗕
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
            title="Close Application [ ✕ ]"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Window Workspace Canvas (No Clunky Website Sidebars / Footers) */}
      <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100">
        {children}
      </div>
    </div>
  );
};
