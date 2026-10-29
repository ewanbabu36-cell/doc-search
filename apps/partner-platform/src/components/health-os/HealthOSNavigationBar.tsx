import React from 'react';
import './health-os.css';

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
    <nav className="hos-nav-bar" aria-label="Android System 3-Button Navigation Bar">
      {/* 1. Left Button: [ ||| ] Multitasking Recents Overview */}
      <button
        onClick={onPressRecent}
        className={`hos-nav-btn ${isRecentsOpen ? 'hos-nav-btn-active' : ''}`}
        title="Recent Apps & Tasks Switcher [ ||| ]"
      >
        <div className="hos-nav-recents-icon">
          <span className="hos-nav-recents-bar" />
          <span className="hos-nav-recents-bar" />
          <span className="hos-nav-recents-bar" />
        </div>
      </button>

      {/* 2. Middle Button: [ ○ ] Home Screen / Apps Menu */}
      <button
        onClick={onPressHome}
        className="hos-nav-btn"
        title="Return to Homescreen [ ○ ] / Apps Menu"
      >
        <div className="hos-nav-home-icon">
          {hasActiveApp && <span className="hos-nav-home-dot" />}
        </div>
      </button>

      {/* 3. Right Button: [ ◂ ] Universal Back Key */}
      <button
        onClick={onPressBack}
        className="hos-nav-btn"
        title="Universal Back Key [ ◂ ]"
      >
        <svg
          className="hos-nav-back-icon"
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
