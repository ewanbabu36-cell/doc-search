import React, { useState } from 'react';
import { type HealthOSAppItem } from './health-os-types.js';
import { HEALTH_OS_APPS } from './health-os-registry.js';
import './health-os.css';

export interface HealthOSAppDrawerProps {
  isOpen: boolean;
  onSelectApp: (app: HealthOSAppItem) => void;
  onClose: () => void;
}

export const HealthOSAppDrawer: React.FC<HealthOSAppDrawerProps> = ({
  isOpen,
  onSelectApp,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredApps = HEALTH_OS_APPS.filter((app) =>
    app.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="hos-drawer-overlay" onClick={onClose}>
      <div className="hos-drawer-window" onClick={(e) => e.stopPropagation()}>
        {/* Header & Search */}
        <div className="hos-drawer-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(37,99,235,0.25)', border: '1px solid rgba(96,165,250,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
              📱
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>DocSearch Master App Drawer</h2>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.15rem 0 0 0' }}>All clinical, pharmacy, diagnostic & hospital operations tools</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="hos-drawer-search-wrap">
              <span className="hos-drawer-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search hospital app..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className="hos-drawer-search-input"
              />
            </div>

            <button
              onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              title="Close Drawer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* All Apps Grid */}
        <div className="hos-drawer-grid">
          {filteredApps.map((app) => (
            <button
              key={app.id}
              onClick={() => onSelectApp(app)}
              className="hos-drawer-card"
            >
              <div
                className="hos-app-squircle"
                style={{
                  width: 52,
                  height: 52,
                  fontSize: '1.5rem',
                  background: app.id === 'billing-revenue-cycle'
                    ? 'linear-gradient(135deg, #2563eb, #4338ca)'
                    : app.id === 'encounters-visits'
                    ? 'linear-gradient(135deg, #0284c7, #2563eb)'
                    : app.id === 'clinical-consultation'
                    ? 'linear-gradient(135deg, #10b981, #0f766e)'
                    : app.id === 'pharmacy-medication'
                    ? 'linear-gradient(135deg, #9333ea, #4f46e5)'
                    : app.id === 'clinical-investigation'
                    ? 'linear-gradient(135deg, #f59e0b, #ea580c)'
                    : app.id === 'inpatient-management'
                    ? 'linear-gradient(135deg, #f43f5e, #be123c)'
                    : 'linear-gradient(135deg, #334155, #0f172a)'
                }}
              >
                {app.icon}
              </div>
              <span style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: '#ffffff' }}>
                {app.shortLabel}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                {app.category}
              </span>
              {app.badge && (
                <span style={{ marginTop: '0.35rem', fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 9999, background: 'rgba(255,255,255,0.08)', color: '#34d399' }}>
                  {app.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
