import React from 'react';

export interface SmartphoneNavigationBarProps {
  onPressRecent: () => void;
  onPressHome: () => void;
  onPressBack: () => void;
  isRecentOpen?: boolean | undefined;
  hasActiveApp?: boolean | undefined;
}

export const SmartphoneNavigationBar: React.FC<SmartphoneNavigationBarProps> = ({
  onPressRecent,
  onPressHome,
  onPressBack,
  isRecentOpen = false,
  hasActiveApp = false,
}) => {
  return (
    <nav
      className="h-12 w-full z-50 bg-black/90 backdrop-blur-3xl border-t border-white/15 px-8 flex items-center justify-around select-none pointer-events-auto shadow-[0_-8px_30px_rgba(0,0,0,0.6)]"
      aria-label="Smartphone OS Navigation Bar"
    >
      {/* 1. Left Button: [ ||| ] Recent Apps / Multitasking Overview */}
      <button
        onClick={onPressRecent}
        className={`w-14 h-9 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-80 hover:bg-white/10 ${
          isRecentOpen ? 'bg-blue-600/30 text-blue-400 border border-blue-400/40 shadow-sm' : 'text-slate-300 hover:text-white'
        }`}
        title="Recent Apps / Multitasking Overview [ ||| ]"
      >
        <div className="flex items-center gap-1">
          <span className="w-1 h-4 rounded-full bg-current transition-all" />
          <span className="w-1 h-4 rounded-full bg-current transition-all" />
          <span className="w-1 h-4 rounded-full bg-current transition-all" />
        </div>
      </button>

      {/* 2. Middle Button: [ ○ ] Home Screen */}
      <button
        onClick={onPressHome}
        className="w-14 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-white transition-all duration-150 active:scale-80 hover:bg-white/10 group"
        title="Home Screen [ ○ ]"
      >
        <div className="w-5 h-5 rounded-full border-2 border-current group-hover:border-blue-400 group-hover:scale-110 transition-all flex items-center justify-center">
          {hasActiveApp && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          )}
        </div>
      </button>

      {/* 3. Right Button: [ ◁ ] Back Button */}
      <button
        onClick={onPressBack}
        className="w-14 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-white transition-all duration-150 active:scale-80 hover:bg-white/10 group"
        title="Back / Exit [ ◁ ]"
      >
        <svg
          className="w-4 h-4 text-current group-hover:-translate-x-0.5 transition-transform"
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
