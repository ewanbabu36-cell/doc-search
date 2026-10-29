import React from 'react';
import { type HealthOSRecentTask, type HealthOSAppItem } from './health-os-types.js';
import './health-os.css';

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
    <div className="hos-recents-overlay" onClick={onClose}>
      {/* 1. Header: Switcher Title & Count */}
      <div className="hos-recents-header" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="hos-nav-recents-icon" style={{ color: '#60a5fa' }}>
            <span className="hos-nav-recents-bar" />
            <span className="hos-nav-recents-bar" />
            <span className="hos-nav-recents-bar" />
          </div>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Active Healthcare Tasks</h2>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 9999, background: 'rgba(255,255,255,0.1)', color: '#cbd5e1' }}>
            {tasks.length} running
          </span>
        </div>

        <button
          onClick={onClose}
          style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
          title="Exit Switcher"
        >
          ✕
        </button>
      </div>

      {/* 2. Center: Horizontal Multitasking Card Carousel */}
      <div className="hos-recents-carousel" onClick={(e) => e.stopPropagation()}>
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div style={{ width: 64, height: 64, margin: '0 auto 1rem auto', borderRadius: 20, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
              🏥
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.5rem 0' }}>No Hospital Tasks in Background</h3>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: 300, margin: '0 auto' }}>
              Tap any hospital app icon on the Homescreen to launch tasks into the multitasking switcher.
            </p>
          </div>
        ) : (
          tasks.map((task) => {
            const { app, lastActiveTime } = task;
            const isCurrent = app.id === activeTaskId;

            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(app)}
                className={`hos-recent-card ${isCurrent ? 'hos-recent-card-active' : ''}`}
              >
                {/* Card Header */}
                <div className="hos-recent-card-header">
                  <div className="hos-recent-app-identity">
                    <div
                      className="hos-recent-app-icon"
                      style={{
                        background: app.id === 'billing-revenue-cycle'
                          ? 'linear-gradient(135deg, #2563eb, #4338ca)'
                          : app.id === 'clinical-consultation'
                          ? 'linear-gradient(135deg, #10b981, #0f766e)'
                          : app.id === 'encounters-visits'
                          ? 'linear-gradient(135deg, #0284c7, #2563eb)'
                          : app.id === 'pharmacy-medication'
                          ? 'linear-gradient(135deg, #9333ea, #4f46e5)'
                          : 'linear-gradient(135deg, #334155, #0f172a)'
                      }}
                    >
                      {app.icon}
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ffffff', display: 'block' }}>
                        {app.shortLabel}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block' }}>
                        {lastActiveTime || 'Active Now'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTask(task.id);
                    }}
                    className="hos-recent-kill-btn"
                    title="Close Task"
                  >
                    ✕
                  </button>
                </div>

                {/* Card Body: Task State Preview */}
                <div className="hos-recent-body">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                      <span>{app.category}</span>
                      <span style={{ color: '#34d399', fontWeight: 700 }}>● Live State Preserved</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#cbd5e1', marginTop: '0.5rem', lineHeight: 1.4 }}>
                      {app.description}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem', fontSize: '0.68rem', fontFamily: 'monospace', color: '#93c5fd' }}>
                    {app.route}
                  </div>
                </div>

                {/* Card Footer: Tap to Open */}
                <div style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#60a5fa' }}>
                  Tap to resume task
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Footer: Clear All Button */}
      {tasks.length > 0 && (
        <div className="hos-clear-all-wrap" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClearAll} className="hos-clear-all-btn">
            <span>🧹</span>
            <span>Clear All Tasks</span>
          </button>
        </div>
      )}
    </div>
  );
};
