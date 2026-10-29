import React from 'react';
import { type HealthOSAppItem } from './health-os-types.js';
import { HEALTH_OS_APPS } from './health-os-registry.js';
import './health-os.css';

export interface HealthOSHomescreenProps {
  onLaunchApp: (app: HealthOSAppItem) => void;
  onOpenAppDrawer: () => void;
  hospitalName?: string | undefined;
}

export const HealthOSHomescreen: React.FC<HealthOSHomescreenProps> = ({
  onLaunchApp,
  onOpenAppDrawer,
  hospitalName = 'DocSearch Apollo Multispecialty Hospital',
}) => {
  const coreApps = HEALTH_OS_APPS.filter((a) => a.isCoreHomeApp);

  const todayDateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="hos-homescreen-container">
      {/* 1. Top Section: Hospital Ambient Glance HUD */}
      <div>
        <div className="hos-hud-date">
          {todayDateStr}
        </div>
        <h1 className="hos-hud-facility">
          {hospitalName}
        </h1>

        {/* 3 Quick-Glance Telemetry Hospital Widgets */}
        <div className="hos-widgets-grid">
          {/* Widget 1: Live OPD Token Queue */}
          <div
            onClick={() => {
              const opdApp = HEALTH_OS_APPS.find((a) => a.id === 'encounters-visits');
              if (opdApp) onLaunchApp(opdApp);
            }}
            className="hos-widget-card"
          >
            <div className="hos-widget-header">
              <div className="hos-widget-header-title">
                <span>⏱️</span>
                <span>OPD Token Queue</span>
              </div>
              <span className="hos-widget-status" style={{ color: '#34d399' }}>Room 4 Active</span>
            </div>
            <div className="hos-widget-body">
              <div>
                <div className="hos-widget-caption">Now Calling</div>
                <div className="hos-widget-val">Token #42</div>
                <div className="hos-widget-sub">Amit Verma (34M)</div>
              </div>
              <span className="hos-widget-action-pill">
                Call Next ➔
              </span>
            </div>
          </div>

          {/* Widget 2: Bed Census HUD */}
          <div
            onClick={() => {
              const ipdApp = HEALTH_OS_APPS.find((a) => a.id === 'inpatient-management');
              if (ipdApp) onLaunchApp(ipdApp);
            }}
            className="hos-widget-card"
          >
            <div className="hos-widget-header">
              <div className="hos-widget-header-title">
                <span>🛏️</span>
                <span>Inpatient Bed Census</span>
              </div>
              <span className="hos-widget-status" style={{ color: '#cbd5e1' }}>180/200</span>
            </div>
            <div className="hos-widget-body">
              <div>
                <div className="hos-widget-caption">Occupancy Rate</div>
                <div className="hos-widget-val" style={{ color: '#f43f5e' }}>90% Full</div>
                <div className="hos-widget-sub" style={{ color: '#34d399' }}>20 Beds Vacant</div>
              </div>
              <span className="hos-widget-action-pill" style={{ background: 'rgba(244, 63, 94, 0.25)', color: '#fda4af' }}>
                Census ➔
              </span>
            </div>
          </div>

          {/* Widget 3: Cashier Desk Collections */}
          <div
            onClick={() => {
              const billingApp = HEALTH_OS_APPS.find((a) => a.id === 'billing-revenue-cycle');
              if (billingApp) onLaunchApp(billingApp);
            }}
            className="hos-widget-card"
          >
            <div className="hos-widget-header">
              <div className="hos-widget-header-title">
                <span>💳</span>
                <span>Cashier Counter Desk</span>
              </div>
              <span className="hos-widget-status" style={{ color: '#34d399' }}>Shift #1 Open</span>
            </div>
            <div className="hos-widget-body">
              <div>
                <div className="hos-widget-caption">Today's Collections</div>
                <div className="hos-widget-val" style={{ color: '#34d399' }}>₹1,48,250</div>
                <div className="hos-widget-sub">UPI: ₹78k • Cash: ₹32k</div>
              </div>
              <span className="hos-widget-action-pill" style={{ background: 'rgba(16, 185, 129, 0.25)', color: '#6ee7b7' }}>
                Billing ➔
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Middle Section: Android Pristine Core App Grid (7 Hospital Products) */}
      <div className="hos-apps-section">
        <div className="hos-apps-heading">
          Hospital Operating Applications
        </div>
        <div className="hos-apps-grid">
          {coreApps.map((app) => (
            <button
              key={app.id}
              onClick={() => onLaunchApp(app)}
              className="hos-app-btn"
            >
              <div
                className="hos-app-squircle"
                style={{
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
              <span className="hos-app-label">
                {app.shortLabel}
              </span>
              <span className="hos-app-badge">
                {app.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Bottom Section: Master App Drawer Button */}
      <div className="hos-drawer-pill-wrap">
        <button
          onClick={onOpenAppDrawer}
          className="hos-drawer-pill-btn"
        >
          <span style={{ color: '#60a5fa' }}>:::</span>
          <span>All Hospital Applications</span>
          <span style={{ color: '#94a3b8', fontWeight: 400 }}>({HEALTH_OS_APPS.length} Apps)</span>
        </button>
      </div>
    </div>
  );
};
