import React from 'react';

export interface HealthOSNavigationBarProps {
  onPressRecent: () => void;
  onPressHome: () => void;
  onPressBack: () => void;
  isRecentsOpen?: boolean | undefined;
  hasActiveApp?: boolean | undefined;
}

export const HealthOSNavigationBar: React.FC<HealthOSNavigationBarProps> = ({
  onPressRecent,
  onPressHome,
  onPressBack,
  isRecentsOpen = false,
  hasActiveApp = false,
}) => {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 h-13 z-50 bg-slate-950/90 backdrop-blur-2xl border-t border-white/10 px-6 flex items-center justify-around select-none shadow-[0_-8px_30px_rgba(0,0,0,0.7)]"
      aria-label="Android System 3-Button Navigation Bar"
    >
      {/* 1. Left Button: [ ||| ] Multitasking Recents Overview */}
      <button
        onClick={onPressRecent}
        className={`w-16 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
          isRecentsOpen
            ? 'bg-blue-600/30 border border-blue-400 text-blue-400 shadow-md shadow-blue-500/20'
            : 'hover:bg-white/10 text-slate-300 hover:text-white'
        }`}
        title="Recent Apps & Tasks Switcher [ ||| ]"
      >
        <div className="flex items-center gap-1">
          <span className="w-1 h-4 rounded-full bg-current transition-transform duration-200" />
          <span className="w-1 h-4 rounded-full bg-current transition-transform duration-200" />
          <span className="w-1 h-4 rounded-full bg-current transition-transform duration-200" />
        </div>
      </button>

      {/* 2. Middle Button: [ ○ ] Home Screen / Apps Menu */}
      <button
        onClick={onPressHome}
        className="w-16 h-10 rounded-xl flex items-center justify-center hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer group"
        title="Return to Homescreen [ ○ ] / Apps Menu"
      >
        <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center group-hover:scale-110 transition-transform">
          {hasActiveApp && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          )}
        </div>
      </button>

      {/* 3. Right Button: [ ◂ ] Universal Back Key */}
      <button
        onClick={onPressBack}
        className="w-16 h-10 rounded-xl flex items-center justify-center hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer group"
        title="Universal Back Key [ ◂ ]"
      >
        <svg
          className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </nav>
  );
};
