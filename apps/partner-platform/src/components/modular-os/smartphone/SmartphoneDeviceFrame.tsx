import React from 'react';

export interface SmartphoneDeviceFrameProps {
  isPhoneFrameMode: boolean;
  onTogglePhoneFrame: () => void;
  children: React.ReactNode;
  navigationBar: React.ReactNode;
}

export const SmartphoneDeviceFrame: React.FC<SmartphoneDeviceFrameProps> = ({
  isPhoneFrameMode,
  onTogglePhoneFrame,
  children,
  navigationBar,
}) => {
  if (!isPhoneFrameMode) {
    // Fullscreen Desktop OS Mode
    return (
      <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {children}
        </div>

        {/* Fixed 3-Button Navigation Bar at bottom */}
        <div className="sticky bottom-0 inset-x-0 z-50">
          {navigationBar}
        </div>
      </div>
    );
  }

  // Smartphone Chassis Mode (Centering a physical phone body on screen)
  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-2 md:p-6 select-none relative overflow-y-auto">
      {/* Top Floating Viewport Mode Switcher Pill */}
      <div className="fixed top-3 right-4 z-50 flex items-center gap-2">
        <button
          onClick={onTogglePhoneFrame}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-semibold backdrop-blur-2xl border border-white/25 shadow-xl transition-all"
          title="Toggle Fullscreen Desktop OS vs Smartphone Frame"
        >
          <span>🖥️</span>
          <span>Switch to Fullscreen OS</span>
        </button>
      </div>

      {/* Titanium Smartphone Physical Chassis Body */}
      <div className="relative w-full max-w-[420px] h-[860px] rounded-[52px] border-[12px] border-zinc-800 bg-black shadow-[0_30px_100px_rgba(0,0,0,0.95)] flex flex-col justify-between overflow-hidden ring-1 ring-white/10">
        {/* Top Bezel Ear Speaker Grill & Camera Punch Hole */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 pointer-events-none">
          <div className="w-12 h-1 rounded-full bg-zinc-700/80" />
          <div className="w-3 h-3 rounded-full bg-zinc-900 border border-zinc-800" />
        </div>

        {/* Main Internal Screen */}
        <div className="flex-1 flex flex-col overflow-y-auto relative z-10">
          {children}
        </div>

        {/* Bottom 3-Button Smartphone Navigation Bar */}
        <div className="relative z-50">
          {navigationBar}
        </div>
      </div>
    </div>
  );
};
