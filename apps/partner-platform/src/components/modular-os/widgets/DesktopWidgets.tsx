import React, { useState } from 'react';
import { useHapticSoundFeedback } from '../hooks/useHapticSoundFeedback.js';

export interface HospitalWidgetProps {
  onOpenModule?: (route: string) => void;
}

// ----------------- WIDGET 1: OPD TOKEN QUEUE CALLER -----------------
export const OpdTokenQueueWidget: React.FC<HospitalWidgetProps> = ({ onOpenModule }) => {
  const [currentToken, setCurrentToken] = useState<number>(42);
  const [waitingCount, setWaitingCount] = useState<number>(18);
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  const handleCallNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClick();
    triggerHaptic(25);
    setIsCalling(true);
    setCurrentToken((prev) => prev + 1);
    setWaitingCount((prev) => Math.max(0, prev - 1));
    setTimeout(() => setIsCalling(false), 2000);
  };

  const handleCardClick = () => {
    playClick();
    triggerHaptic(15);
    if (onOpenModule) {
      onOpenModule('/partner/clinical/consultations');
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="h-[156px] rounded-[26px] bg-white/15 backdrop-blur-2xl border border-white/20 p-4.5 flex flex-col justify-between shadow-[0_12px_40px_rgba(0,0,0,0.35)] select-none transition-transform hover:scale-[1.01] cursor-pointer group relative overflow-hidden"
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-white/90">
            OPD Token Queue
          </span>
        </div>
        <span className="text-[10px] font-mono text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30">
          Room 4 • Active
        </span>
      </div>

      {/* Center Calling Info */}
      <div className="flex items-center justify-between my-auto py-1">
        <div>
          <div className="text-[11px] font-medium text-white/60">Now Calling</div>
          <div className="text-3xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
            <span>Token #{currentToken}</span>
            {isCalling && (
              <span className="text-[10px] text-amber-300 font-sans font-bold animate-pulse">
                Calling 📢
              </span>
            )}
          </div>
          <div className="text-[11px] font-medium text-white/80 truncate max-w-[170px]">
            Amit Verma (34M) • Consult
          </div>
        </div>

        {/* Action Button: Call Next Token */}
        <button
          onClick={handleCallNext}
          className="flex flex-col items-center justify-center px-3 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs shadow-lg border border-blue-400/40 transition-all cursor-pointer"
          title="Announce & Call Next Patient"
        >
          <span className="text-base leading-none">📢</span>
          <span className="text-[10px] mt-1 whitespace-nowrap">Call Next</span>
        </button>
      </div>

      {/* Bottom Queue Stats */}
      <div className="flex items-center justify-between text-[11px] text-white/70 border-t border-white/10 pt-2 font-mono">
        <span className="flex items-center gap-1">
          <span className="text-white font-bold text-xs">{waitingCount}</span> waiting
        </span>
        <span>Avg: 8m</span>
        <span className="text-blue-300 font-sans font-semibold group-hover:underline">
          Open Queue ➔
        </span>
      </div>
    </div>
  );
};

// ----------------- WIDGET 2: INPATIENT BED OCCUPANCY & WARD CENSUS -----------------
export const BedOccupancyCensusWidget: React.FC<HospitalWidgetProps> = ({ onOpenModule }) => {
  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  const handleCardClick = () => {
    playClick();
    triggerHaptic(15);
    if (onOpenModule) {
      onOpenModule('/partner/inpatient');
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="h-[156px] rounded-[26px] bg-white/15 backdrop-blur-2xl border border-white/20 p-4 flex items-center justify-between shadow-[0_12px_40px_rgba(0,0,0,0.35)] select-none transition-transform hover:scale-[1.01] cursor-pointer group"
    >
      {/* Left side: Concentric Activity / Census Rings */}
      <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background Track 1 (Outer - ICU Magenta) */}
          <circle
            cx="50"
            cy="50"
            r="38"
            stroke="rgba(244, 63, 94, 0.2)"
            strokeWidth="7"
            fill="transparent"
          />
          {/* Active Ring 1 (Magenta - 85% ICU) */}
          <circle
            cx="50"
            cy="50"
            r="38"
            stroke="#f43f5e"
            strokeWidth="7"
            strokeDasharray={238.76}
            strokeDashoffset={35.8}
            strokeLinecap="round"
            fill="transparent"
            className="filter drop-shadow-[0_0_4px_rgba(244,63,94,0.6)]"
          />

          {/* Background Track 2 (Middle - HDU Amber) */}
          <circle
            cx="50"
            cy="50"
            r="28"
            stroke="rgba(245, 158, 11, 0.2)"
            strokeWidth="7"
            fill="transparent"
          />
          {/* Active Ring 2 (Amber - 72% HDU) */}
          <circle
            cx="50"
            cy="50"
            r="28"
            stroke="#f59e0b"
            strokeWidth="7"
            strokeDasharray={175.93}
            strokeDashoffset={49.26}
            strokeLinecap="round"
            fill="transparent"
            className="filter drop-shadow-[0_0_4px_rgba(245,158,11,0.6)]"
          />

          {/* Background Track 3 (Inner - General Cyan) */}
          <circle
            cx="50"
            cy="50"
            r="18"
            stroke="rgba(6, 182, 212, 0.2)"
            strokeWidth="7"
            fill="transparent"
          />
          {/* Active Ring 3 (Cyan - 91% General) */}
          <circle
            cx="50"
            cy="50"
            r="18"
            stroke="#06b6d4"
            strokeWidth="7"
            strokeDasharray={113.1}
            strokeDashoffset={10.18}
            strokeLinecap="round"
            fill="transparent"
            className="filter drop-shadow-[0_0_4px_rgba(6,182,212,0.6)]"
          />
        </svg>

        {/* Center Pill: Total 90% */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs font-black text-white font-mono leading-none">90%</span>
          <span className="text-[8px] text-white/60 uppercase">Census</span>
        </div>
      </div>

      {/* Right side: Ward Census Breakdown */}
      <div className="flex flex-col justify-between h-full pl-3 flex-1 py-1">
        <div className="flex items-center justify-between border-b border-white/10 pb-1">
          <span className="text-xs font-bold text-white uppercase tracking-wider">Bed Census</span>
          <span className="text-[10px] text-emerald-300 font-mono">180/200</span>
        </div>

        <div className="space-y-1 my-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/80 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#f43f5e]" /> ICU
            </span>
            <span className="font-mono font-semibold text-[#f43f5e]">18/20 (2 Vacant)</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/80 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> HDU
            </span>
            <span className="font-mono font-semibold text-[#f59e0b]">24/30 (6 Vacant)</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/80 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#06b6d4]" /> General
            </span>
            <span className="font-mono font-semibold text-[#06b6d4]">138/150</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-blue-300 font-semibold group-hover:underline pt-1 border-t border-white/10">
          <span>Rapid Admit Desk</span>
          <span>➔</span>
        </div>
      </div>
    </div>
  );
};

// ----------------- WIDGET 3: CASHIER DESK & BILLING REVENUE -----------------
export const HospitalCashierRevenueWidget: React.FC<HospitalWidgetProps> = ({ onOpenModule }) => {
  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  const handleCardClick = () => {
    playClick();
    triggerHaptic(15);
    if (onOpenModule) {
      onOpenModule('/partner/billing');
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="h-[156px] rounded-[26px] bg-white/15 backdrop-blur-2xl border border-white/20 p-4.5 flex flex-col justify-between shadow-[0_12px_40px_rgba(0,0,0,0.35)] select-none transition-transform hover:scale-[1.01] cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm leading-none">💳</span>
          <span className="text-xs font-bold uppercase tracking-wider text-white/90">
            Cashier Desk
          </span>
        </div>
        <span className="text-[10px] font-mono text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30">
          Shift #1 Open
        </span>
      </div>

      {/* Main Revenue Figure */}
      <div className="my-auto py-1">
        <div className="text-[11px] font-medium text-white/60">Today&apos;s Gross Collections</div>
        <div className="text-3xl font-black text-white font-mono tracking-tight text-emerald-300">
          ₹1,48,250
        </div>
      </div>

      {/* Split details */}
      <div className="grid grid-cols-3 gap-1 text-[10px] text-white/70 border-t border-white/10 pt-2 font-mono">
        <div>
          <span className="text-white/50 block">UPI/QR</span>
          <span className="font-semibold text-white">₹78,850</span>
        </div>
        <div>
          <span className="text-white/50 block">Cash</span>
          <span className="font-semibold text-white">₹32,400</span>
        </div>
        <div className="text-right">
          <span className="text-white/50 block">TPA Claim</span>
          <span className="font-semibold text-white">₹37,000</span>
        </div>
      </div>
    </div>
  );
};

// Backward compatible aliases
export const DigitalClockWidget: React.FC<HospitalWidgetProps> = OpdTokenQueueWidget;
export const CalendarMonthWidget: React.FC<HospitalWidgetProps> = HospitalCashierRevenueWidget;
export const BedOccupancyConcentricRingsWidget: React.FC<HospitalWidgetProps> = BedOccupancyCensusWidget;
export const BedOccupancyWidget: React.FC<HospitalWidgetProps> = BedOccupancyCensusWidget;
export const CashierRevenueWidget: React.FC<HospitalWidgetProps> = HospitalCashierRevenueWidget;
