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
      style={{
        height: '48px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(5, 7, 14, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.15)',
        padding: '0 2rem',
        userSelect: 'none',
        zIndex: 1000,
      }}
      aria-label="Smartphone OS Navigation Bar"
    >
      {/* 1. Left Button: [ ||| ] Recent Apps / Multitasking Overview */}
      <button
        onClick={onPressRecent}
        style={{
          width: '56px',
          height: '36px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isRecentOpen ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
          border: isRecentOpen ? '1px solid rgba(96, 165, 250, 0.5)' : 'none',
          color: isRecentOpen ? '#60a5fa' : '#cbd5e1',
          cursor: 'pointer',
        }}
        title="Recent Apps / Multitasking Overview [ ||| ]"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '4px', height: '16px', borderRadius: '9999px', backgroundColor: 'currentColor' }} />
          <span style={{ width: '4px', height: '16px', borderRadius: '9999px', backgroundColor: 'currentColor' }} />
          <span style={{ width: '4px', height: '16px', borderRadius: '9999px', backgroundColor: 'currentColor' }} />
        </div>
      </button>

      {/* 2. Middle Button: [ ○ ] Home Screen */}
      <button
        onClick={onPressHome}
        style={{
          width: '56px',
          height: '36px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          color: '#cbd5e1',
          cursor: 'pointer',
        }}
        title="Home Screen [ ○ ]"
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: '2px solid currentColor',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {hasActiveApp && (
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#60a5fa' }} />
          )}
        </div>
      </button>

      {/* 3. Right Button: [ ◁ ] Back Button */}
      <button
        onClick={onPressBack}
        style={{
          width: '56px',
          height: '36px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          color: '#cbd5e1',
          cursor: 'pointer',
        }}
        title="Back / Exit [ ◁ ]"
      >
        <svg
          style={{ width: '18px', height: '18px' }}
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
