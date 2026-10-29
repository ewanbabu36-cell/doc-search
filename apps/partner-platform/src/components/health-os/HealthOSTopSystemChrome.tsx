import React, { useState, useEffect } from 'react';
import { type HospitalStaffUser } from '../auth/HospitalStaffLogin.js';
import './health-os.css';

export interface HealthOSTopSystemChromeProps {
  hospitalName?: string | undefined;
  currentUser: HospitalStaffUser;
  onLogout: () => void;
  activeModuleName?: string | undefined;
}

export const HealthOSTopSystemChrome: React.FC<HealthOSTopSystemChromeProps> = ({
  hospitalName = 'DocSearch Apollo Multispecialty Hospital',
  currentUser,
  onLogout,
  activeModuleName,
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

  const displayHospital = currentUser?.tenantName || hospitalName;
  const staffRole = currentUser?.roleTitle || currentUser?.role || 'Staff Doctor';

  return (
    <header className="hos-top-chrome">
      {/* 1. Left: Hospital Identity & Active Department */}
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
      </div>

      {/* 2. Right: Staff Profile Pill, Clock & Logout */}
      <div className="hos-chrome-right">
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
