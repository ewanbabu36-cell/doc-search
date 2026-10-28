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
    // Fullscreen Liquid Retina Desktop OS Mode
    return (
      <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden bg-[#070817]">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {children}
        </div>

        {/* 3-Button Navigation Bar at bottom */}
        <div className="sticky bottom-0 inset-x-0 z-50">
          {navigationBar}
        </div>
      </div>
    );
  }

  // Authentic Apple iPad Pro Landscape Tablet Chassis Mode (Matching Reference Image)
  return (
    <div className="min-h-screen w-full bg-[#030408] flex flex-col items-center justify-center p-2 md:p-6 select-none relative overflow-y-auto">
      {/* Top Floating Viewport Mode Switcher Pill */}
      <div className="fixed top-3 right-5 z-50 flex items-center gap-2">
        <button
          onClick={onTogglePhoneFrame}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-semibold backdrop-blur-2xl border border-white/20 shadow-xl transition-all"
          title="Toggle Fullscreen OS vs iPad Pro Tablet Frame"
        >
          <span>🖥️</span>
          <span>Switch to Fullscreen OS</span>
        </button>
      </div>

      {/* iPad Pro Space Black Aluminum Chassis Body */}
      <div className="relative w-full max-w-[1240px] h-[830px] rounded-[44px] bg-[#0c0d12] border-[16px] border-[#181920] shadow-[0_35px_120px_rgba(0,0,0,0.98)] ring-1 ring-white/15 flex overflow-hidden">
        {/* Left Bezel: Authentic Face ID & Camera Sensor Dot Cluster (as seen in reference) */}
        <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
          {/* Sensor Dot 1: Ambient Light */}
          <div className="w-1.5 h-1.5 rounded-full bg-[#050508] border border-zinc-700/80 shadow-inner" />
          {/* Sensor Dot 2: Front Camera Lens */}
          <div className="w-2.5 h-2.5 rounded-full bg-[#020204] border border-zinc-600 shadow-inner ring-1 ring-cyan-900/40 relative">
            <div className="w-1 h-1 rounded-full bg-blue-900/60 absolute top-0.5 left-0.5" />
          </div>
          {/* Sensor Dot 3: Infrared Projector */}
          <div className="w-1.5 h-1.5 rounded-full bg-[#050508] border border-zinc-700/80 shadow-inner" />
          {/* Sensor Dot 4: Mic pinhole */}
          <div className="w-1 h-1 rounded-full bg-[#020204]" />
        </div>

        {/* Liquid Retina Display Screen (Continuous curvature matching chassis) */}
        <div className="flex-1 rounded-[26px] overflow-hidden flex flex-col relative bg-[#070817] z-10 shadow-inner">
          {/* Display Internal Content */}
          <div className="flex-1 flex flex-col overflow-y-auto relative">
            {children}
          </div>

          {/* Bottom 3-Button Navigation Bar */}
          <div className="relative z-50">
            {navigationBar}
          </div>
        </div>
      </div>
    </div>
  );
};
