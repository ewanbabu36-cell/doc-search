import React from 'react';
import { type HealthOSAppItem } from './health-os-types.js';
import { getCoreAppsForStaff, getAppsForStaff, resolveStaffPersona } from './health-os-registry.js';
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

  const staffRole = currentUser?.role;
  const persona = resolveStaffPersona(staffRole);

  const coreApps = getCoreAppsForStaff(effectiveProfile, staffRole);
  const totalAppsForStaff = getAppsForStaff(effectiveProfile, staffRole).length;

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
        // Hospital Workspace: Tailor heading to Persona
        switch (persona) {
          case 'DOCTOR':
            return {
              title: 'Clinician OPD & Patient Care Desk',
              subtitle: 'Doctor Smart Rx Pad • Token Caller • Telehealth Video • Zero Clutter',
              drawerLabel: 'Doctor Clinical Suite',
              sectionHeading: 'My Clinical Applications',
            };
          case 'NURSE':
            return {
              title: 'Nursing Station & Inpatient Ward',
              subtitle: 'Bed Census HUD • Manchester Triage • Ward Vitals HUD',
              drawerLabel: 'Nursing Station Tools',
              sectionHeading: 'Nursing & Ward Applications',
            };
          case 'RECEPTIONIST':
            return {
              title: 'Patient Front Desk & Express Registration',
              subtitle: 'ABHA Creation • OPD Token Generation • Doctor Rosters',
              drawerLabel: 'Front Desk Applications',
              sectionHeading: 'Front Desk & Reception Tools',
            };
          case 'CASHIER':
            return {
              title: 'Cashier Counter & POS Collections',
              subtitle: 'Instant UPI Settlement • Shift Cash Handover • Zero Distraction',
              drawerLabel: 'Cashier Applications',
              sectionHeading: 'Counter Billing Applications',
            };
          case 'PHARMACIST':
            return {
              title: 'Hospital Pharmacy Dispensary',
              subtitle: 'Real-Time Batch Stock • Schedule H1 • Fast POS Dispensing',
              drawerLabel: 'Pharmacy Tools',
              sectionHeading: 'Pharmacy Applications',
            };
          case 'LAB_TECHNICIAN':
            return {
              title: 'Pathology & LIMS Processing Center',
              subtitle: 'Phlebotomy Queue • Barcode Accessioning • Auto-Analyzer Integration',
              drawerLabel: 'Pathology Tools',
              sectionHeading: 'Diagnostic Laboratory Tools',
            };
          case 'RADIOLOGIST':
            return {
              title: 'Radiology Imaging & DICOM PACS Cockpit',
              subtitle: 'Modality Worklist (MWL) • STAT AI Copilot • Zero-Footprint PACS',
              drawerLabel: 'Radiology Applications',
              sectionHeading: 'Imaging & Diagnostics Applications',
            };
          case 'HOSPITAL_ADMIN':
          default:
            return {
              title: 'Multi-Specialty Hospital Command',
              subtitle: 'Inpatient Beds • OPD Queue • OT Suite • 100% Free Lifetime',
              drawerLabel: 'All Hospital Applications',
              sectionHeading: 'Hospital Operating Applications',
            };
        }
    }
  })();

  return (
    <div className="hos-homescreen-container">
      {/* 1. Top Section: Hospital Ambient Glance HUD */}
      <div>
        <div className="hos-hud-date">
          {todayDateStr} • <span style={{ color: '#34d399', fontWeight: 700 }}>Role: {persona.replace(/_/g, ' ')}</span>
        </div>
        <h1 className="hos-hud-facility">
          {hospitalName || profileDetails.title}
        </h1>

        {/* Tailored Glance Telemetry HUDs based on Medical Domain & Persona */}
        <div className="hos-widgets-grid">
          {/* ========================================================
              PROFILE 1: MULTI-SPECIALTY HOSPITAL (HOSPITAL)
              ======================================================== */}
          {effectiveProfile === 'HOSPITAL' && (
            <>
              {/* Doctor / Receptionist / Admin OPD Queue Widget */}
              {(persona === 'DOCTOR' || persona === 'RECEPTIONIST' || persona === 'CASHIER' || persona === 'HOSPITAL_ADMIN') && (
                <div
                  onClick={() => {
                    const opdApp = coreApps.find((a) => a.id === 'encounters-visits') || coreApps[0];
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
              )}

              {/* Nurse / Doctor / Admin Inpatient Bed Census Widget */}
              {(persona === 'NURSE' || persona === 'DOCTOR' || persona === 'HOSPITAL_ADMIN') && (
                <div
                  onClick={() => {
                    const ipdApp = coreApps.find((a) => a.id === 'inpatient-management') || coreApps[0];
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
              )}

              {/* Cashier / Admin Billing Collections Widget */}
              {(persona === 'CASHIER' || persona === 'HOSPITAL_ADMIN') && (
                <div
                  onClick={() => {
                    const billingApp = coreApps.find((a) => a.id === 'billing-revenue-cycle') || coreApps[0];
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
              )}

              {/* Pharmacist Live Stock & Expiry Widgets */}
              {persona === 'PHARMACIST' && (
                <>
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

              {/* Lab Technician LIMS Specimen Queue Widget */}
              {persona === 'LAB_TECHNICIAN' && (
                <div
                  onClick={() => {
                    const labApp = coreApps.find((a) => a.id === 'clinical-investigation') || coreApps[0];
                    if (labApp) onLaunchApp(labApp);
                  }}
                  className="hos-widget-card"
                >
                  <div className="hos-widget-header">
                    <div className="hos-widget-header-title">
                      <span>🧪</span>
                      <span>Specimen Accessioning</span>
                    </div>
                    <span className="hos-widget-status" style={{ color: '#38bdf8' }}>18 Pending</span>
                  </div>
                  <div className="hos-widget-body">
                    <div>
                      <div className="hos-widget-caption">Auto-Analyzer Queue</div>
                      <div className="hos-widget-val" style={{ color: '#38bdf8' }}>12 Tests Ready</div>
                      <div className="hos-widget-sub">CBC, LFT, Lipid Profile</div>
                    </div>
                    <span className="hos-widget-action-pill" style={{ background: 'rgba(56, 189, 248, 0.25)', color: '#7dd3fc' }}>
                      Process ➔
                    </span>
                  </div>
                </div>
              )}

              {/* Radiologist DICOM PACS Worklist Widget */}
              {persona === 'RADIOLOGIST' && (
                <div
                  onClick={() => {
                    const radApp = coreApps.find((a) => a.id === 'radiology-pacs') || coreApps[0];
                    if (radApp) onLaunchApp(radApp);
                  }}
                  className="hos-widget-card"
                >
                  <div className="hos-widget-header">
                    <div className="hos-widget-header-title">
                      <span>🩻</span>
                      <span>DICOM PACS Worklist</span>
                    </div>
                    <span className="hos-widget-status" style={{ color: '#f87171' }}>2 STAT Flags</span>
                  </div>
                  <div className="hos-widget-body">
                    <div>
                      <div className="hos-widget-caption">Today's Scans</div>
                      <div className="hos-widget-val" style={{ color: '#38bdf8' }}>14 Studies</div>
                      <div className="hos-widget-sub" style={{ color: '#fca5a5' }}>CT Brain (SDH) • Pneumothorax</div>
                    </div>
                    <span className="hos-widget-action-pill" style={{ background: 'rgba(56, 189, 248, 0.25)', color: '#7dd3fc' }}>
                      Open PACS ➔
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ========================================================
              PROFILE 2: SINGLE DOCTOR OPD CLINIC (CLINIC)
              ======================================================== */}
          {effectiveProfile === 'CLINIC' && (
            <>
              <div
                onClick={() => {
                  const opdApp = coreApps.find((a) => a.id === 'encounters-visits') || coreApps[0];
                  if (opdApp) onLaunchApp(opdApp);
                }}
                className="hos-widget-card"
              >
                <div className="hos-widget-header">
                  <div className="hos-widget-header-title">
                    <span>⏱️</span>
                    <span>OPD Token Live</span>
                  </div>
                  <span className="hos-widget-status" style={{ color: '#34d399' }}>Token #12</span>
                </div>
                <div className="hos-widget-body">
                  <div>
                    <div className="hos-widget-caption">Chamber 1</div>
                    <div className="hos-widget-val">Ramesh Patil</div>
                    <div className="hos-widget-sub">Follow-up Hypertension</div>
                  </div>
                  <span className="hos-widget-action-pill">
                    Call ➔
                  </span>
                </div>
              </div>

              <div
                onClick={() => {
                  const rxApp = coreApps.find((a) => a.id === 'clinical-consultation') || coreApps[0];
                  if (rxApp) onLaunchApp(rxApp);
                }}
                className="hos-widget-card"
              >
                <div className="hos-widget-header">
                  <div className="hos-widget-header-title">
                    <span>🩺</span>
                    <span>15-Sec SmartRx</span>
                  </div>
                  <span className="hos-widget-status" style={{ color: '#38bdf8' }}>AI Active</span>
                </div>
                <div className="hos-widget-body">
                  <div>
                    <div className="hos-widget-caption">Today's Consults</div>
                    <div className="hos-widget-val" style={{ color: '#38bdf8' }}>14 Completed</div>
                    <div className="hos-widget-sub">Avg Consult Time: 4.2m</div>
                  </div>
                  <span className="hos-widget-action-pill" style={{ background: 'rgba(56, 189, 248, 0.25)', color: '#7dd3fc' }}>
                    Consult ➔
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
              <div
                onClick={() => {
                  const labApp = coreApps.find((a) => a.id === 'clinical-investigation') || coreApps[0];
                  if (labApp) onLaunchApp(labApp);
                }}
                className="hos-widget-card"
              >
                <div className="hos-widget-header">
                  <div className="hos-widget-header-title">
                    <span>🧪</span>
                    <span>Sample Accessioning</span>
                  </div>
                  <span className="hos-widget-status" style={{ color: '#f59e0b' }}>18 Pending</span>
                </div>
                <div className="hos-widget-body">
                  <div>
                    <div className="hos-widget-caption">Auto-Analyzer Sync</div>
                    <div className="hos-widget-val" style={{ color: '#f59e0b' }}>ASTM E1381 Ready</div>
                    <div className="hos-widget-sub">Mindray BC-5000 Connected</div>
                  </div>
                  <span className="hos-widget-action-pill" style={{ background: 'rgba(245, 158, 11, 0.25)', color: '#fcd34d' }}>
                    Accession ➔
                  </span>
                </div>
              </div>

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
                    <span>NABL Panic Intimation</span>
                  </div>
                  <span className="hos-widget-status" style={{ color: '#34d399' }}>0 Open Critical</span>
                </div>
                <div className="hos-widget-body">
                  <div>
                    <div className="hos-widget-caption">Quality Control</div>
                    <div className="hos-widget-val" style={{ color: '#34d399' }}>100% Calibrated</div>
                    <div className="hos-widget-sub">ISO-15189 Audit Passed</div>
                  </div>
                  <span className="hos-widget-action-pill">
                    Audit ➔
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ========================================================
              PROFILE 4: RETAIL CHEMIST & PHARMACY POS (PHARMACY)
              ======================================================== */}
          {effectiveProfile === 'PHARMACY' && (
            <>
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

      {/* 2. Middle Section: Android Pristine Core App Grid Tailored to Profile & Role */}
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
                  background:
                    app.id === 'billing-revenue-cycle'
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
                      : app.id === 'patient-registration'
                      ? 'linear-gradient(135deg, #0d9488, #065f46)'
                      : app.id === 'patient-portal'
                      ? 'linear-gradient(135deg, #0284c7, #1e40af)'
                      : app.id === 'telemedicine-rpm'
                      ? 'linear-gradient(135deg, #3b82f6, #4f46e5)'
                      : app.id === 'emergency-trauma'
                      ? 'linear-gradient(135deg, #dc2626, #991b1b)'
                      : app.id === 'whatsapp-portal'
                      ? 'linear-gradient(135deg, #059669, #15803d)'
                      : app.id === 'offers-rewards-hub'
                      ? 'linear-gradient(135deg, #d97706, #a16207)'
                      : 'linear-gradient(135deg, #334155, #0f172a)',
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
          <span style={{ color: '#94a3b8', fontWeight: 400 }}>({totalAppsForStaff} Apps)</span>
        </button>
      </div>
    </div>
  );
};
