import React from 'react';
import { type HealthOSAppItem } from './health-os-types.js';
import './health-os.css';

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
    <div className="hos-window-container">
      {/* Window Top Control Bar */}
      <div className="hos-window-header">
        {/* Left: Back Key & Module Identity */}
        <div className="hos-window-left">
          <button
            onClick={onClose}
            className="hos-window-back-btn"
            title="Exit to Homescreen (Back)"
          >
            <span>◂</span>
            <span>Back</span>
          </button>

          <div className="hos-window-title">
            <span>{app.icon}</span>
            <span>{app.label}</span>
            <span style={{ fontSize: '0.65rem', color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '0.15rem 0.45rem', borderRadius: 6, fontFamily: 'monospace' }}>
              {app.category}
            </span>
          </div>
        </div>

        {/* Right: Window Controls */}
        <div className="hos-window-controls">
          <button
            onClick={onMinimize}
            className="hos-window-ctrl-btn"
            title="Minimize to Homescreen [ 🗕 ]"
          >
            🗕
          </button>
          <button
            onClick={onClose}
            className="hos-window-ctrl-btn hos-window-ctrl-btn-close"
            title="Close Application [ ✕ ]"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Window Workspace Canvas (No Clunky Website Sidebars / Footers) */}
      <div className="hos-window-body">
        {children}
      </div>
    </div>
  );
};
