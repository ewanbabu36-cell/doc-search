import React from 'react';
import { type HealthOSAppItem } from './health-os-types.js';
import { HEALTH_OS_APPS } from './health-os-registry.js';

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
    <div className="relative z-10 flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full px-4 md:px-6 py-6 pb-20 select-none">
      {/* 1. Top Section: Hospital Ambient Glance HUD */}
      <div className="space-y-4">
        {/* Date & Facility Pill */}
        <div className="text-center md:text-left space-y-1">
          <div className="text-xs font-semibold text-blue-400 uppercase tracking-widest">
            {todayDateStr}
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
            {hospitalName}
          </h1>
        </div>

        {/* 3 Quick-Glance Telemetry Hospital Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Widget 1: Live OPD Token Queue */}
          <div
            onClick={() => {
              const opdApp = HEALTH_OS_APPS.find((a) => a.id === 'encounters-visits');
              if (opdApp) onLaunchApp(opdApp);
            }}
            className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-white/10 hover:border-blue-500/40 transition-all cursor-pointer shadow-lg group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span>⏱️</span> OPD Token Queue
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Room 4 Active</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <div className="text-xs text-slate-400">Now Calling</div>
                <div className="text-xl font-black text-white tracking-tight">Token #42</div>
                <div className="text-[11px] text-slate-300 truncate max-w-[150px]">Amit Verma (34M)</div>
              </div>
              <span className="px-2 py-1 rounded-lg bg-blue-600/30 text-blue-300 text-xs font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
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
            className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-white/10 hover:border-rose-500/40 transition-all cursor-pointer shadow-lg group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5 text-rose-400">
                <span>🛏️</span> Inpatient Bed Census
              </span>
              <span className="text-[10px] text-slate-300 font-mono">180/200</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <div className="text-xs text-slate-400">Occupancy Rate</div>
                <div className="text-xl font-black text-white tracking-tight">90% Full</div>
                <div className="text-[11px] text-emerald-400">20 Beds Vacant</div>
              </div>
              <span className="px-2 py-1 rounded-lg bg-rose-600/30 text-rose-300 text-xs font-bold group-hover:bg-rose-600 group-hover:text-white transition-colors">
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
            className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer shadow-lg group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span>💳</span> Cashier Counter Desk
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Shift #1 Open</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <div className="text-xs text-slate-400">Today's Collections</div>
                <div className="text-xl font-black text-emerald-400 tracking-tight">₹1,48,250</div>
                <div className="text-[11px] text-slate-300">UPI: ₹78k • Cash: ₹32k</div>
              </div>
              <span className="px-2 py-1 rounded-lg bg-emerald-600/30 text-emerald-300 text-xs font-bold group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                Billing ➔
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Middle Section: Android Pristine Core App Grid (7 Hospital Products) */}
      <div className="my-8">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">
          Hospital Operating Applications
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 md:gap-5">
          {coreApps.map((app) => (
            <button
              key={app.id}
              onClick={() => onLaunchApp(app)}
              className="flex flex-col items-center p-3 rounded-2xl hover:bg-white/10 transition-all text-center group cursor-pointer active:scale-95"
            >
              <div
                className={`w-16 h-16 rounded-[22px] bg-gradient-to-br ${app.gradient} flex items-center justify-center text-3xl text-white shadow-xl shadow-black/40 group-hover:scale-110 group-hover:shadow-blue-500/30 transition-all duration-200 border border-white/20`}
              >
                {app.icon}
              </div>
              <span className="mt-2.5 text-xs font-bold text-white group-hover:text-blue-300 transition-colors leading-tight text-center">
                {app.shortLabel}
              </span>
              <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                {app.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Bottom Section: Master App Drawer Button */}
      <div className="flex justify-center mt-4">
        <button
          onClick={onOpenAppDrawer}
          className="flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-white/15 hover:border-blue-400/50 text-white font-bold text-xs shadow-xl backdrop-blur-2xl transition-all active:scale-95 cursor-pointer group"
        >
          <span className="text-blue-400 group-hover:rotate-90 transition-transform">:::</span>
          <span>All Hospital Applications</span>
          <span className="text-[10px] text-slate-400 font-normal">({HEALTH_OS_APPS.length} Apps)</span>
        </button>
      </div>
    </div>
  );
};
