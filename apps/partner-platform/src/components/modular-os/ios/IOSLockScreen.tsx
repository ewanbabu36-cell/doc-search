import React, { useState, useEffect } from 'react';
import { useHapticSoundFeedback } from '../hooks/useHapticSoundFeedback.js';

export interface IOSLockScreenProps {
  onUnlock: (selectedStaff?: any) => void;
  onOpenTraditionalLogin?: () => void;
  hospitalName?: string;
}

export const IOSLockScreen: React.FC<IOSLockScreenProps> = ({
  onUnlock,
  onOpenTraditionalLogin,
  hospitalName = 'DocSearch Apollo Medical Center',
}) => {
  const [timeStr, setTimeStr] = useState<string>('09:41');
  const [dateStr, setDateStr] = useState<string>('Tuesday, October 28');
  const [isFaceIdScanning, setIsFaceIdScanning] = useState<boolean>(false);
  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
      setDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleInstantUnlock = (staffPreset?: any) => {
    playClick();
    triggerHaptic(30);
    setIsFaceIdScanning(true);
    setTimeout(() => {
      onUnlock(staffPreset);
    }, 450);
  };

  const defaultProfiles = [
    {
      id: 'apollo-cmo',
      name: 'Dr. Apollo (Chief Medical Officer)',
      role: 'HOSPITAL_EXECUTIVE',
      roleTitle: 'Chief Medical Officer',
      email: 'cmo@apollo.docsearch.internal',
      organizationType: 'HOSPITAL',
      defaultModule: 'clinical-consultation',
    },
    {
      id: 'apollo-nurse',
      name: 'Sister Nancy (Head Triage Nurse)',
      role: 'HOSPITAL_NURSE',
      roleTitle: 'Head Triage Nurse',
      email: 'nurse@apollo.docsearch.internal',
      organizationType: 'HOSPITAL',
      defaultModule: 'nurse-vitals-triage',
    },
    {
      id: 'apollo-cashier',
      name: 'Cashier Sharma (Billing Counter)',
      role: 'HOSPITAL_CASHIER',
      roleTitle: 'Billing Cashier',
      email: 'cashier@apollo.docsearch.internal',
      organizationType: 'HOSPITAL',
      defaultModule: 'billing-revenue-cycle',
    },
    {
      id: 'apollo-pharma',
      name: 'Dr. Mehta (Chief Pharmacist)',
      role: 'HOSPITAL_PHARMACIST',
      roleTitle: 'Chief Pharmacist',
      email: 'pharma@apollo.docsearch.internal',
      organizationType: 'HOSPITAL',
      defaultModule: 'pharmacy-medication',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between py-12 px-6 select-none bg-gradient-to-b from-indigo-950 via-slate-950 to-black text-white pointer-events-auto">
      {/* 1. Top Section: Lock Icon & Face ID scan */}
      <div className="flex flex-col items-center gap-2 pt-4">
        <div className="flex items-center gap-1.5 text-white/70 text-xs font-semibold">
          <span>🏥</span>
          <span>{hospitalName}</span>
        </div>

        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-base">
          {isFaceIdScanning ? (
            <span className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          ) : (
            '🔒'
          )}
        </div>
      </div>

      {/* 2. Center: Large iOS Clock & Date */}
      <div className="flex flex-col items-center text-center space-y-1">
        <span className="text-sm md:text-base font-medium text-white/80 tracking-wide">
          {dateStr}
        </span>
        <h1 className="text-7xl md:text-9xl font-extrabold tracking-tighter text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] font-sans">
          {timeStr}
        </h1>

        {/* Live Triage Notification Banner */}
        <div className="mt-6 max-w-sm w-full p-3.5 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-xl flex items-center gap-3 text-left animate-in fade-in zoom-in-95 duration-300">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-lg flex-shrink-0 shadow">
            🚨
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Emergency Center</span>
              <span className="text-[10px] text-white/50">Live</span>
            </div>
            <p className="text-xs text-white/80 truncate">
              Triage Level 2 patient arrived in Red Resuscitation Bay
            </p>
          </div>
        </div>
      </div>

      {/* 3. Bottom: Quick Staff Unlock & Traditional Login */}
      <div className="flex flex-col items-center space-y-4 max-w-md mx-auto w-full pb-4">
        <div className="text-center">
          <span className="text-xs font-semibold text-white/60">
            Select Staff Role to Unlock Workstation
          </span>
        </div>

        {/* Quick Staff Profile Buttons */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          {defaultProfiles.map((p) => (
            <button
              key={p.id}
              onClick={() => handleInstantUnlock(p)}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-left transition-all active:scale-95 group"
            >
              <span className="text-xs font-bold text-white block group-hover:text-blue-300 transition-colors truncate">
                {p.name.split('(')[0]}
              </span>
              <span className="text-[10px] text-white/60 block truncate">
                {p.roleTitle}
              </span>
            </button>
          ))}
        </div>

        {/* Primary Unlock Button */}
        <button
          onClick={() => handleInstantUnlock(defaultProfiles[0])}
          className="w-full py-3.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm shadow-[0_10px_30px_rgba(37,99,235,0.4)] border border-white/20 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <span>Tap to Unlock Springboard</span>
          <span>➔</span>
        </button>

        {/* Traditional Credentials Fallback */}
        {onOpenTraditionalLogin && (
          <button
            onClick={() => {
              playClick();
              onOpenTraditionalLogin();
            }}
            className="text-xs text-white/50 hover:text-white underline transition-colors"
          >
            Staff Password Login & Registration
          </button>
        )}
      </div>
    </div>
  );
};
