import React from 'react';
import { type HealthOSRecentTask, type HealthOSAppItem } from './health-os-types.js';

export interface HealthOSRecentsDeckProps {
  isOpen: boolean;
  tasks: HealthOSRecentTask[];
  activeTaskId?: string | undefined;
  onSelectTask: (app: HealthOSAppItem) => void;
  onCloseTask: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export const HealthOSRecentsDeck: React.FC<HealthOSRecentsDeckProps> = ({
  isOpen,
  tasks,
  activeTaskId,
  onSelectTask,
  onCloseTask,
  onClearAll,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-45 pt-16 pb-20 px-4 flex flex-col justify-between bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-200 select-none pointer-events-auto"
      onClick={onClose}
    >
      {/* 1. Header: Switcher Title & Count */}
      <div
        className="max-w-4xl mx-auto w-full flex items-center justify-between px-4 pb-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-blue-400">
            <span className="w-1.5 h-4 rounded-full bg-blue-400" />
            <span className="w-1.5 h-4 rounded-full bg-blue-400" />
            <span className="w-1.5 h-4 rounded-full bg-blue-400" />
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">Active Healthcare Tasks</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
            {tasks.length} running
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
          title="Exit Switcher"
        >
          ✕
        </button>
      </div>

      {/* 2. Center: Horizontal Multitasking Card Carousel */}
      <div
        className="flex-1 flex items-center justify-center overflow-x-auto py-6 px-4 scrollbar-none"
        onClick={(e) => e.stopPropagation()}
      >
        {tasks.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-white/10 flex items-center justify-center text-3xl text-slate-400">
              🏥
            </div>
            <h3 className="text-base font-bold text-white">No Hospital Tasks in Background</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Tap any hospital app icon on the Homescreen to launch tasks into the multitasking switcher.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-6 max-w-full">
            {tasks.map((task) => {
              const { app, lastActiveTime } = task;
              const isCurrent = app.id === activeTaskId;

              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(app)}
                  className={`relative w-64 md:w-72 h-96 rounded-[28px] p-4 flex flex-col justify-between cursor-pointer transition-all duration-200 transform hover:-translate-y-2 hover:scale-[1.02] shadow-[0_20px_50px_rgba(0,0,0,0.8)] group overflow-hidden ${
                    isCurrent
                      ? 'bg-slate-900/95 border-2 border-blue-400 shadow-blue-500/20'
                      : 'bg-slate-900/85 hover:bg-slate-900/95 border border-white/20'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${app.gradient} flex items-center justify-center text-lg text-white shadow`}>
                        {app.icon}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block leading-tight truncate max-w-[130px]">
                          {app.shortLabel}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {lastActiveTime || 'Active Now'}
                        </span>
                      </div>
                    </div>

                    {/* Kill app button [ ✕ ] */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloseTask(task.id);
                      }}
                      className="w-6 h-6 rounded-full bg-white/10 hover:bg-red-500 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                      title="Close Task"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Card Body: Simulated Live Task Preview */}
                  <div className="flex-1 my-3 rounded-2xl bg-black/40 border border-white/10 p-3.5 flex flex-col justify-between text-left overflow-hidden">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>{app.category}</span>
                        <span className="text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live State Preserved
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-200 line-clamp-2">
                        {app.description}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-white/10">
                      <div className="h-2 w-3/4 rounded bg-white/20" />
                      <div className="h-2 w-1/2 rounded bg-white/15" />
                      <div className="h-2 w-5/6 rounded bg-white/10" />
                    </div>

                    <div className="text-[10px] font-mono text-blue-300 truncate pt-1">
                      {app.route}
                    </div>
                  </div>

                  {/* Card Footer: Tap to Open Indicator */}
                  <div className="text-center">
                    <span className="text-[11px] font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
                      Tap to resume task
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Footer: Clear All Button */}
      {tasks.length > 0 && (
        <div
          className="max-w-xs mx-auto w-full flex justify-center pb-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClearAll}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold text-xs backdrop-blur-2xl border border-white/20 shadow-xl transition-all cursor-pointer"
            title="Close all background tasks"
          >
            <span>🧹</span>
            <span>Clear All Tasks</span>
          </button>
        </div>
      )}
    </div>
  );
};
