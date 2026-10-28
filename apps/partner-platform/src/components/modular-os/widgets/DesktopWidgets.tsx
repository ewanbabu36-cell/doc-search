import React, { useState, useEffect } from 'react';
import { useHapticSoundFeedback } from '../hooks/useHapticSoundFeedback.js';

// ----------------- WIDGET 1: DIGITAL CLOCK & SHIFT -----------------
export const DigitalClockWidget: React.FC = () => {
  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-5 rounded-3xl bg-slate-950/60 backdrop-blur-2xl border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.5)] select-none">
      <div className="flex items-center justify-between pb-1">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Hospital Standard Time</span>
        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] font-bold">
          IST (UTC+5:30)
        </span>
      </div>
      <div className="text-4xl font-extrabold font-mono text-white tracking-tight drop-shadow-md">
        {time || '07:45 PM'}
      </div>
      <div className="text-xs font-medium text-slate-300 mt-1">{dateStr || 'Wednesday, 28 October 2026'}</div>
      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px]">
        <span className="text-slate-400">Current Phase:</span>
        <span className="font-semibold text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Evening Rounds & OPD Handover
        </span>
      </div>
    </div>
  );
};

// ----------------- WIDGET 2: BED OCCUPANCY DIAL -----------------
export interface BedOccupancyWidgetProps {
  totalBeds?: number;
  occupiedBeds?: number;
  icuOccupied?: number;
}

export const BedOccupancyWidget: React.FC<BedOccupancyWidgetProps> = ({
  totalBeds = 156,
  occupiedBeds = 148,
  icuOccupied = 18,
}) => {
  const percentage = Math.round((occupiedBeds / totalBeds) * 100);
  const vacant = totalBeds - occupiedBeds;
  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  return (
    <div className="p-5 rounded-3xl bg-slate-950/60 backdrop-blur-2xl border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.5)] select-none">
      <div className="flex items-center justify-between pb-2">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bed Census Gauge</span>
        <span className="text-[10px] font-bold text-rose-400 animate-pulse">High Surge</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Animated Circular Progress Gauge */}
        <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="7"
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke="#06b6d4"
              strokeWidth="7"
              strokeDasharray={213}
              strokeDashoffset={213 - (213 * percentage) / 100}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-base font-extrabold text-white font-mono">{percentage}%</span>
            <span className="text-[8px] text-slate-400 uppercase font-semibold">Full</span>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-slate-300">Occupied:</span>
            <span className="font-bold font-mono text-white">{occupiedBeds}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Vacant:</span>
            <span className="font-bold font-mono text-emerald-400">{vacant} beds</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-slate-300">ICU Active:</span>
            <span className="font-bold font-mono text-rose-400">{icuOccupied} beds</span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-white/10 flex justify-end">
        <button
          onClick={() => {
            playClick();
            triggerHaptic(15);
            window.location.href = '/partner/inpatient/admissions';
          }}
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          <span>Rapid Admit</span>
          <span>➔</span>
        </button>
      </div>
    </div>
  );
};

// ----------------- WIDGET 3: CASHIER SHIFT REVENUE -----------------
export const CashierRevenueWidget: React.FC = () => {
  return (
    <div className="p-4 rounded-3xl bg-slate-950/60 backdrop-blur-2xl border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.5)] select-none">
      <div className="flex items-center justify-between pb-1">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Today's Collections</span>
        <span className="text-amber-400 text-xs">💳</span>
      </div>
      <div className="text-2xl font-black font-mono text-amber-400">₹1,48,250</div>
      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
        <span>UPI: <b className="text-white font-mono">₹92.4k</b></span>
        <span>Cash: <b className="text-white font-mono">₹41.8k</b></span>
        <span>Card: <b className="text-white font-mono">₹14.0k</b></span>
      </div>
    </div>
  );
};
