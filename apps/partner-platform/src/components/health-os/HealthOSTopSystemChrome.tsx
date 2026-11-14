import React, { useState, useEffect } from 'react';
import { type HospitalStaffUser } from '../auth/HospitalStaffLogin.js';
import { type ActivePatientTab } from './health-os-types.js';
import './health-os.css';

export interface HealthOSTopSystemChromeProps {
  hospitalName?: string | undefined;
  currentUser: HospitalStaffUser;
  onLogout: () => void;
  activeModuleName?: string | undefined;
  // Multi-Patient Pinned Tabstrip
  patientTabs?: ActivePatientTab[];
  activePatientTabId?: string | null;
  onSelectPatientTab?: (encounterId: string) => void;
  onClosePatientTab?: (encounterId: string) => void;
  onNewPatientTab?: () => void;
  onOpenCommandPalette?: () => void;
}

const STAFF_PERSONAS = [
  { role: 'DOCTOR', label: '🩺 Doctor Desk', roleTitle: 'Consultant Physician', department: 'Clinical OPD' },
  { role: 'NURSE', label: '👩‍⚕️ Nursing Station', roleTitle: 'Staff Nurse In-Charge', department: 'Inpatient Ward' },
  { role: 'RECEPTIONIST', label: '📇 Front Desk', roleTitle: 'Front Desk Lead', department: 'Patient Reception' },
  { role: 'CASHIER', label: '💳 Cashier Counter', roleTitle: 'Billing Cashier', department: 'Accounts & Billing' },
  { role: 'PHARMACIST', label: '💊 Pharmacy POS', roleTitle: 'Registered Pharmacist', department: 'Pharmacy Dispensary' },
  { role: 'LAB_TECHNICIAN', label: '🧪 Pathology LIMS', roleTitle: 'Chief Lab Technologist', department: 'Diagnostic Pathology' },
  { role: 'RADIOLOGIST', label: '🩻 Radiologist PACS', roleTitle: 'Consultant Radiologist', department: 'Radiology & Imaging' },
  { role: 'HOSPITAL_ADMIN', label: '👔 Hospital Admin', roleTitle: 'Medical Superintendent', department: 'Hospital Administration' }
];

export const HealthOSTopSystemChrome: React.FC<HealthOSTopSystemChromeProps> = ({
  hospitalName = 'DocSearch Apollo Multispecialty Hospital',
  currentUser,
  onLogout,
  activeModuleName,
  patientTabs = [],
  activePatientTabId,
  onSelectPatientTab,
  onClosePatientTab,
  onNewPatientTab,
  onOpenCommandPalette,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePersonaSelect = (selectedRole: string) => {
    const target = STAFF_PERSONAS.find((p) => p.role === selectedRole);
    if (!target) return;
    const switchedUser: HospitalStaffUser = {
      ...currentUser,
      role: target.role,
      roleTitle: target.roleTitle,
      department: target.department
    };
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('docsearch:switch-staff-user', {
          detail: switchedUser
        })
      );
    }
  };

  const displayHospital = currentUser?.tenantName || hospitalName;
  const staffRole = currentUser?.roleTitle || currentUser?.role || 'Staff Doctor';

  // Normalize current role for select value
  const currentRoleNormalized = (() => {
    const r = (currentUser.role || '').toUpperCase();
    if (r.includes('NURSE')) return 'NURSE';
    if (r.includes('RECEPT') || r.includes('FRONT') || r.includes('DESK') || r.includes('REGISTR') || r.includes('CLERK')) return 'RECEPTIONIST';
    if (r.includes('CASHIER') || r.includes('BILLING') || r.includes('ACCOUNTS')) return 'CASHIER';
    if (r.includes('PHARMAC') || r.includes('CHEMIST') || r.includes('DRUGGIST') || r.includes('DISPENSER')) return 'PHARMACIST';
    if (r.includes('LAB') || r.includes('PATHO') || r.includes('TECHNICIAN')) return 'LAB_TECHNICIAN';
    if (r.includes('ADMIN') || r.includes('EXECUTIVE') || r.includes('DIRECTOR') || r.includes('SUPER')) return 'HOSPITAL_ADMIN';
    return 'DOCTOR';
  })();

  return (
    <header className="hos-top-chrome">
      {/* 1. Left: Hospital Identity & Omnipresent Command Search Button */}
      <div className="hos-chrome-left">
        <div className="hos-brand-badge">
          <span>🏥</span>
          <span>DOC SEARCH</span>
        </div>

        <div className="hos-facility-info">
          <span className="hos-facility-name" title={displayHospital}>
            {displayHospital}
          </span>
          <div className="hos-facility-status">
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#34d399', display: 'inline-block' }} />
            <span>HealthOS Live • PostgreSQL 18.4</span>
            {activeModuleName && (
              <>
                <span style={{ color: '#64748b' }}>•</span>
                <span className="hos-active-module-pill">{activeModuleName}</span>
              </>
            )}
          </div>
        </div>

        {/* Global Omnipresent Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="hos-command-search-btn"
          title="Universal Spotlight Command Palette (Ctrl+K or Cmd+K)"
        >
          <span>🔍</span>
          <span className="hos-command-search-text">Search...</span>
          <kbd className="hos-kbd-shortcut">Ctrl K</kbd>
        </button>
      </div>

      {/* 2. Center: Multi-Patient Pinned Tabstrip (VS Code / Browser-in-Browser Ergonomics) */}
      <div className="hos-chrome-center">
        <div className="hos-patient-tabstrip" role="tablist" aria-label="Active Patient Encounters">
          {patientTabs.map((tab) => {
            const isActive = tab.encounterId === activePatientTabId;
            const acuityColor =
              tab.acuity === 'EMERGENCY' ? '#ef4444' : tab.acuity === 'URGENT' ? '#f59e0b' : '#10b981';
            return (
              <div
                key={tab.encounterId}
                className={`hos-patient-tab ${isActive ? 'hos-patient-tab-active' : ''}`}
                onClick={() => onSelectPatientTab?.(tab.encounterId)}
                role="tab"
                aria-selected={isActive}
                title={`${tab.patientName} (${tab.mrn}) • Acuity: ${tab.acuity}`}
              >
                <span
                  className="hos-tab-acuity-dot"
                  style={{
                    backgroundColor: acuityColor,
                    boxShadow: tab.acuity === 'EMERGENCY' ? '0 0 6px #ef4444' : undefined
                  }}
                />
                <span className="hos-tab-patient-name">{tab.patientName}</span>
                <span className="hos-tab-token-badge">
                  {tab.bedNumber || (tab.mrn ? tab.mrn.slice(-4) : 'OPD')}
                </span>
                <button
                  type="button"
                  className="hos-tab-close-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClosePatientTab?.(tab.encounterId);
                  }}
                  title={`Close ${tab.patientName}'s workspace`}
                >
                  ✕
                </button>
              </div>
            );
          })}
          <button
            type="button"
            className="hos-patient-tab-add"
            onClick={onNewPatientTab || onOpenCommandPalette}
            title="Open / Switch another patient chart (Ctrl+K)"
          >
            +
          </button>
        </div>
      </div>

      {/* 3. Right: Quick Persona Switcher, Staff Profile Pill, Clock & Logout */}
      <div className="hos-chrome-right">
        {/* Quick Staff Persona Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            value={currentRoleNormalized}
            onChange={(e) => handlePersonaSelect(e.target.value)}
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.12)'
            }}
            title="Switch Staff Persona (De-Clutter Test Switcher)"
          >
            {STAFF_PERSONAS.map((p) => (
              <option key={p.role} value={p.role} style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* User Pill */}
        <div className="hos-user-pill">
          <div className="hos-user-avatar">
            👨‍⚕️
          </div>
          <div className="hos-user-details">
            <span className="hos-user-name">
              {currentUser.name}
            </span>
            <span className="hos-user-role">
              {staffRole}
            </span>
          </div>
        </div>

        {/* Live Clock */}
        <div className="hos-clock-pill">
          {timeStr || '12:00 PM'}
        </div>

        {/* Direct Logout Action */}
        <button
          onClick={onLogout}
          className="hos-logout-btn"
          title="Sign out of HealthOS"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
