import React, { useState } from 'react';
import { type HealthOSAppItem } from './health-os-types.js';
import { getAppsForStaff, resolveStaffPersona } from './health-os-registry.js';
import type { OrganizationWorkspaceType, HospitalStaffUser } from '../auth/HospitalStaffLogin.js';
import './health-os.css';

export interface HealthOSAppDrawerProps {
  isOpen: boolean;
  onSelectApp: (app: HealthOSAppItem) => void;
  onClose: () => void;
  profile?: OrganizationWorkspaceType | undefined;
  currentUser?: HospitalStaffUser | undefined;
}

export const HealthOSAppDrawer: React.FC<HealthOSAppDrawerProps> = ({
  isOpen,
  onSelectApp,
  onClose,
  profile = 'HOSPITAL',
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const persona = resolveStaffPersona(currentUser?.role);
  const profileApps = getAppsForStaff(profile, currentUser?.role);

  const filteredApps = profileApps.filter((app) =>
    app.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.shortLabel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const drawerSubtitle = (() => {
    switch (profile) {
      case 'CLINIC':
        return 'All OPD consultation, token queue, ABHA & clinic tools';
      case 'PATHOLOGY':
        return 'All LIMS, accessioning, analyzer & diagnostic tools';
      case 'PHARMACY':
        return 'All retail pharmacy POS, inventory & chemist tools';
      case 'HOSPITAL':
      default:
        switch (persona) {
          case 'DOCTOR':
            return 'Doctor OPD consultation, inpatient rounds & clinical diagnostic tools';
          case 'NURSE':
            return 'Nursing care, ward bed census, vitals HUD & emergency triage tools';
          case 'RECEPTIONIST':
            return 'Patient registration, ABHA locker, token queue & doctor rosters';
          case 'CASHIER':
            return 'Fast cashier counter billing, daily cash ledger & shift handover';
          case 'PHARMACIST':
            return 'Pharmacy POS, prescription dispensing queue & medicine stock';
          case 'LAB_TECHNICIAN':
            return 'Pathology LIMS, specimen collection, analyzer workbench & reports';
          case 'HOSPITAL_ADMIN':
          default:
            return 'All clinical, pharmacy, diagnostic & hospital operations tools';
        }
    }
  })();

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
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.15rem 0 0 0' }}>{drawerSubtitle}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="hos-drawer-search-wrap">
              <span className="hos-drawer-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search tools & apps..."
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

        {/* All Profile- & Role-Scoped Apps Grid */}
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
              <div className="hos-drawer-card-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="hos-drawer-card-label">{app.label}</span>
                  {app.badge && (
                    <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: 999, background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontWeight: 700 }}>
                      {app.badge}
                    </span>
                  )}
                </div>
                <span className="hos-drawer-card-desc">{app.description}</span>
              </div>
            </button>
          ))}

          {filteredApps.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              No applications found matching "{searchTerm}" for your clearance level.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
