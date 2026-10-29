import React, { useState, useEffect } from 'react';
import { type HospitalStaffUser } from '../auth/HospitalStaffLogin.js';

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
    <header className="fixed top-0 inset-x-0 h-13 z-40 bg-slate-950/80 backdrop-blur-2xl border-b border-white/10 px-4 md:px-6 flex items-center justify-between select-none shadow-md">
      {/* 1. Left: Hospital Identity & Active Department */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-blue-600/25 border border-blue-500/40 text-blue-400 font-bold shadow-sm">
          <span className="text-base leading-none">🏥</span>
          <span className="text-xs font-black tracking-wider text-white">DOC SEARCH</span>
        </div>

        <div className="hidden sm:flex flex-col min-w-0">
          <span className="text-xs font-bold text-white tracking-tight truncate max-w-[200px] md:max-w-[320px]">
            {displayHospital}
          </span>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>HealthOS Live • PostgreSQL 18.4</span>
            {activeModuleName && (
              <>
                <span className="text-slate-500">•</span>
                <span className="text-blue-300 font-semibold truncate max-w-[140px]">{activeModuleName}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Right: Staff Profile Pill, Clock & Logout */}
      <div className="flex items-center gap-2.5 md:gap-4 flex-shrink-0">
        {/* User Pill */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs">
          <div className="w-6 h-6 rounded-lg bg-blue-600/40 border border-blue-400/50 flex items-center justify-center text-xs text-white font-bold">
            👨‍⚕️
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-white leading-tight truncate max-w-[160px]">
              {currentUser.name}
            </span>
            <span className="text-[10px] text-slate-400 leading-tight">
              {staffRole}
            </span>
          </div>
        </div>

        {/* Live Clock */}
        <div className="text-xs font-mono font-semibold text-slate-300 px-2 py-1 rounded-lg bg-white/5 border border-white/5">
          {timeStr || '12:00 PM'}
        </div>

        {/* Direct Logout Action */}
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          title="Sign out of HealthOS"
        >
          <span>🚪</span>
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
