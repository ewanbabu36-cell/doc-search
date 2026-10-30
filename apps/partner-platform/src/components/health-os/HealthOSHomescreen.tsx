import React from 'react';
import { type HealthOSAppItem } from './health-os-types.js';
import { getCoreAppsForProfile, getAppsForProfile } from './health-os-registry.js';
import type { OrganizationWorkspaceType, HospitalStaffUser } from '../auth/HospitalStaffLogin.js';
import './health-os.css';

export interface HealthOSHomescreenProps {
  onLaunchApp: (app: HealthOSAppItem) => void;
  onOpenAppDrawer: () => void;
  hospitalName?: string | undefined;
  profile?: OrganizationWorkspaceType | undefined;
  currentUser?: HospitalStaffUser | undefined;
}

export const HealthOSHomescreen: React.FC<HealthOSHomescreenProps> = ({
  onLaunchApp,
  onOpenAppDrawer,
  hospitalName = 'DocSearch Apollo Multispecialty Hospital',
  profile = 'HOSPITAL',
  currentUser,
}) => {
  const effectiveProfile: OrganizationWorkspaceType =
    profile || currentUser?.organizationType || 'HOSPITAL';

  const coreApps = getCoreAppsForProfile(effectiveProfile);
  const totalAppsForProfile = getAppsForProfile(effectiveProfile).length;

  const todayDateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  // Resolve Profile-Specific Display Labels & Badges
  const profileDetails = (() => {
    switch (effectiveProfile) {
      case 'CLINIC':
        return {
          title: 'Single Doctor OPD Clinic',
          subtitle: 'Doctor Smart Rx Pad • OPD Token Caller • 100% Free Lifetime',
          drawerLabel: 'All Clinic Applications',
          sectionHeading: 'Clinic Operating Applications',
        };
      case 'PATHOLOGY':
        return {
          title: 'Diagnostic Pathology & LIMS Hub',
          subtitle: 'NABL Specimen Barcoding • Auto-Analyzer LIS • 100% Free Lifetime',
          drawerLabel: 'All Pathology Applications',
          sectionHeading: 'Pathology & Diagnostic Applications',
        };
      case 'PHARMACY':
        return {
          title: 'Retail Chemist & Dispensary POS',
          subtitle: 'High-Speed POS • FEFO Stock • Schedule H1 • 100% Free Lifetime',
          drawerLabel: 'All Pharmacy Applications',
          sectionHeading: 'Pharmacy POS & Dispensary Applications',
        };
      case 'HOSPITAL':
      default:
        return {
          title: 'Multi-Specialty Hospital Command',
          subtitle: 'Inpatient Beds • OPD Queue • OT Suite • 100% Free Lifetime',
          drawerLabel: 'All Hospital Applications',
          sectionHeading: 'Hospital Operating Applications',
        };
    }
  })();

  return (
    <div className="hos-homescreen-container">
      {/* 1. Top Section: Hospital Ambient Glance HUD */}
      <div>
        <div className="hos-hud-date">
          {todayDateStr} • <span style={{ color: '#34d399', fontWeight: 700 }}>100% Full Enterprise Free for Lifetime</span>
        </div>
        <h1 className="hos-hud-facility">
          {hospitalName || profileDetails.title}
        </h1>

        {/* 4 Distinct Glance Telemetry HUDs based on Medical Domain */}
        <div className="hos-widgets-grid">
          {/* ========================================================
              PROFILE 1: MULTI-SPECIALTY HOSPITAL (HOSPITAL)
              ======================================================== */}
          {effectiveProfile === 'HOSPITAL' && (
            <>
              {/* Widget 1: Hospital Live OPD Token Queue */}
              <div
                onClick={() => {
                  const opdApp = coreApps.find((a) => a.id === 'encounters-visits');
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
                  const ipdApp = coreApps.find((a) => a.id === 'inpatient-management');
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
                  const billingApp = coreApps.find((a) => a.id === 'billing-revenue-cycle');
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
            </>
          )}

          {/* ========================================================
              PROFILE 2: SINGLE DOCTOR CLINIC (CLINIC)
              ======================================================== */}
          {effectiveProfile === 'CLINIC' && (
            <>
              {/* Widget 1: Live OPD Token Calling */}
              <div
                onClick={() => {
                  const opdApp = coreApps.find((a) => a.id === 'encounters-visits') || coreApps[0];
                  if (opdApp) onLaunchApp(opdApp);
                }}
                className="hos-widget-card"
              >
                <div className="hos-widget-header">
                  <div className="hos-widget-header-title">
                    <span>🩺</span>
                    <span>OPD Consultation Desk</span>
                  </div>
                  <span className="hos-widget-status" style={{ color: '#38bdf8' }}>Dr. Desk Active</span>
                </div>
                <div className="hos-widget-body">
                  <div>
                    <div className="hos-widget-caption">Now Calling</div>
                    <div className="hos-widget-val" style={{ color: '#38bdf8' }}>Token #18</div>
                    <div className="hos-widget-sub">Pooja Gupta (28F) • Next: #19</div>
                  </div>
                  <span className="hos-widget-action-pill" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                    Rx Pad ➔
                  </span>
                </div>
              </div>

              {/* Widget 2: Today's OPD Appointments */}
              <div
                onClick={() => {
                  const consultApp = coreApps.find((a) => a.id === 'clinical-consultation') || coreApps[0];
                  if (consultApp) onLaunchApp(consultApp);
                }}
                className="hos-widget-card"
              >
                <div className="hos-widget-header">
                  <div className="hos-widget-header-title">
                    <span>📅</span>
                    <span>Today's Appointments</span>
                  </div>
                  <span className="hos-widget-status" style={{ color: '#34d399' }}>24 Total</span>
                </div>
                <div className="hos-widget-body">
                  <div>
                    <div className="hos-widget-caption">Patient Flow</div>
                    <div className="hos-widget-val" style={{ color: '#34d399' }}>16 Completed</div>
                    <div className="hos-widget-sub" style={{ color: '#cbd5e1' }}>8 Waiting in Lobby</div>
                  </div>
                  <span className="hos-widget-action-pill" style={{ background: 'rgba(16, 185, 129, 0.25)', color: '#6ee7b7' }}>
                    Queue ➔
                  </span>
                </div>
              </div>

              {/* Widget 3: Clinic Consultation Fee Till */}
              <div
                onClick={() => {
                  const billingApp = coreApps.find((a) => a.id === 'billing-revenue-cycle') || coreApps[0];
                  if (billingApp) onLaunchApp(billingApp);
                }}
                className="hos-widget-card"
              >
                <div className="hos-widget-header">
                  <div className="hos-widget-header-title">
                    <span>💰</span>
                    <span>Consultation Fee Till</span>
                  </div>
                  <span className="hos-widget-status" style={{ color: '#34d399' }}>UPI Till Active</span>
                </div>
                <div className="hos-widget-body">
                  <div>
                    <div className="hos-widget-caption">Today's Receipts</div>
                    <div className="hos-widget-val" style={{ color: '#34d399' }}>₹14,500</div>
                    <div className="hos-widget-sub">₹500 / Consult • 29 Receipts</div>
                  </div>
                  <span className="hos-widget-action-pill" style={{ background: 'rgba(16, 185, 129, 0.25)', color: '#6ee7b7' }}>
                    Till Receipts ➔
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ========================================================
              PROFILE 3: DIAGNOSTIC PATHOLOGY & LIMS (PATHOLOGY)
              ======================================================== */}
          {effectiveProfile === 'PATHOLOGY' && (
            <>
              {/* Widget 1: Phlebotomy & Sample Accession */}
              <div
                onClick={() => {
                  const labApp = coreApps.find((a) => a.id === 'clinical-investigation') || coreApps[0];
                  if (labApp) onLaunchApp(labApp);
                }}
                className="hos-widget-card"
              >
                <div className="hos-widget-header">
                  <div className="hos-widget-header-title">
                    <span>🩸</span>
                    <span>Phlebotomy & Samples</span>
                  </div>
                  <span className="hos-widget-status" style={{ color: '#f59e0b' }}>Barcodes Active</span>
                </div>
                <div className="hos-widget-body">
                  <div>
                    <div className="hos-widget-caption">Today Accessioned</div>
                    <div className="hos-widget-val" style={{ color: '#f59e0b' }}>84 Samples</div>
                    <div className="hos-widget-sub">12 In Phlebotomy • 4 Stat</div>
                  </div>
                  <span className="hos-widget-action-pill" style={{ background: 'rgba(245, 158, 11, 0.25)', color: '#fcd34d' }}>
                    Accession ➔
                  </span>
                </div>
              </div>

              {/* Widget 2: Analyzer Testing Workbenches */}
              <div
                onClick={() => {
                  const labApp = coreApps.find((a) => a.id === 'clinical-investigation') || coreApps[0];
                  if (labApp) onLaunchApp(labApp);
                }}
                className="hos-widget-card"
              >
                <div className="hos-widget-header">
                  <div className="hos-widget-header-title">
                    <span>🔬</span>
                    <span>Analyzer Workbenches</span>
                  </div>
                  <span className="hos-widget-status" style={{ color: '#34d399' }}>LIS Online</span>
                </div>
                <div className="hos-widget-body">
                  <div>
                    <div className="hos-widget-caption">Automated Tests</div>
                    <div className="hos-widget-val" style={{ color: '#34d399' }}>68 Verified</div>
                    <div className="hos-widget-sub">16 Running on Beckman Coulter</div>
                  </div>
                  <span className="hos-widget-action-pill" style={{ background: 'rgba(16, 185, 129, 0.25)', color: '#6ee7b7' }}>
                    Workbench ➔
                  </span>
                </div>
              </div>

              {/* Widget 3: NABL Panic Value Radar */}
              <div
                onClick={() => {
                  const labApp = coreApps.find((a) => a.id === 'clinical-investigation') || coreApps[0];
                  if (labApp) onLaunchApp(labApp);
                }}
                className="hos-widget-card"
              >
                <div className="hos-widget-header">
                  <div className="hos-widget-header-title">
                    <span>🚨</span>
                    <span>Panic Value Radar</span>
                  </div>
                  <span className="hos-widget-status" style={{ color: '#34d399' }}>All Clear</span>
                </div>
                <div className="hos-widget-body">
                  <div>
                    <div className="hos-widget-caption">Critical Telemetry</div>
                    <div className="hos-widget-val" style={{ color: '#34d399' }}>0 Pending</div>
                    <div className="hos-widget-sub">Avg NABL TAT: 42 Mins</div>
                  </div>
                  <span className="hos-widget-action-pill" style={{ background: 'rgba(16, 185, 129, 0.25)', color: '#6ee7b7' }}>
                    Dispatch ➔
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ========================================================
              PROFILE 4: RETAIL & HOSPITAL PHARMACY (PHARMACY)
              ======================================================== */}
          {effectiveProfile === 'PHARMACY' && (
            <>
              {/* Widget 1: Chemist Daily Cash Galla */}
              <div
                onClick={() => {
                  const billingApp = coreApps.find((a) => a.id === 'billing-revenue-cycle') || coreApps[0];
                  if (billingApp) onLaunchApp(billingApp);
                }}
                className="hos-widget-card"
              >
                <div className="hos-widget-header">
                  <div className="hos-widget-header-title">
                    <span>💵</span>
                    <span>Daily Cash Galla</span>
                  </div>
                  <span className="hos-widget-status" style={{ color: '#34d399' }}>Counter #1 Open</span>
                </div>
                <div className="hos-widget-body">
                  <div>
                    <div className="hos-widget-caption">Today's POS Sales</div>
                    <div className="hos-widget-val" style={{ color: '#34d399' }}>₹42,650</div>
                    <div className="hos-widget-sub">Cash: ₹18k • UPI: ₹24.6k</div>
                  </div>
                  <span className="hos-widget-action-pill" style={{ background: 'rgba(16, 185, 129, 0.25)', color: '#6ee7b7' }}>
                    POS Till ➔
                  </span>
                </div>
              </div>

              {/* Widget 2: Live Stock & Reorder Triggers */}
              <div
                onClick={() => {
                  const pharmaApp = coreApps.find((a) => a.id === 'pharmacy-medication') || coreApps[0];
                  if (pharmaApp) onLaunchApp(pharmaApp);
                }}
                className="hos-widget-card"
              >
                <div className="hos-widget-header">
                  <div className="hos-widget-header-title">
                    <span>💊</span>
                    <span>Medicine Live Stock</span>
                  </div>
                  <span className="hos-widget-status" style={{ color: '#a855f7' }}>1,420 Active SKUs</span>
                </div>
                <div className="hos-widget-body">
                  <div>
                    <div className="hos-widget-caption">Inventory Health</div>
                    <div className="hos-widget-val" style={{ color: '#fbbf24' }}>4 Reorder Alerts</div>
                    <div className="hos-widget-sub">Amoxicillin 500 & Paracetamol</div>
                  </div>
                  <span className="hos-widget-action-pill" style={{ background: 'rgba(168, 85, 247, 0.25)', color: '#d8b4fe' }}>
                    Stock ➔
                  </span>
                </div>
              </div>

              {/* Widget 3: Expiry Radar (<90 Days) */}
              <div
                onClick={() => {
                  const pharmaApp = coreApps.find((a) => a.id === 'pharmacy-medication') || coreApps[0];
                  if (pharmaApp) onLaunchApp(pharmaApp);
                }}
                className="hos-widget-card"
              >
                <div className="hos-widget-header">
                  <div className="hos-widget-header-title">
                    <span>⏳</span>
                    <span>Near-Expiry Radar</span>
                  </div>
                  <span className="hos-widget-status" style={{ color: '#fb7185' }}>&lt;90 Days</span>
                </div>
                <div className="hos-widget-body">
                  <div>
                    <div className="hos-widget-caption">FEFO Alert</div>
                    <div className="hos-widget-val" style={{ color: '#fb7185' }}>3 Batches</div>
                    <div className="hos-widget-sub">Return to Supplier Pending</div>
                  </div>
                  <span className="hos-widget-action-pill" style={{ background: 'rgba(251, 113, 133, 0.25)', color: '#fecdd3' }}>
                    Batches ➔
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. Middle Section: Android Pristine Core App Grid Tailored to Profile */}
      <div className="hos-apps-section">
        <div className="hos-apps-heading">
          {profileDetails.sectionHeading}
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

      {/* 3. Bottom Section: Profile-Scoped Master App Drawer Button */}
      <div className="hos-drawer-pill-wrap">
        <button
          onClick={onOpenAppDrawer}
          className="hos-drawer-pill-btn"
        >
          <span style={{ color: '#60a5fa' }}>:::</span>
          <span>{profileDetails.drawerLabel}</span>
          <span style={{ color: '#94a3b8', fontWeight: 400 }}>({totalAppsForProfile} Apps)</span>
        </button>
      </div>
    </div>
  );
};
