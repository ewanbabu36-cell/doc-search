import React, { useState } from 'react';
import { useHapticSoundFeedback } from './hooks/useHapticSoundFeedback.js';

export interface DynamicIslandProps {
  patientName?: string;
  wardBed?: string;
  heartRate?: number;
  allergyNotice?: string;
  activeContextType?: 'CLINICAL' | 'CASHIER' | 'EMERGENCY';
  cashierTotal?: string;
}

export const DynamicIslandHUD: React.FC<DynamicIslandProps> = ({
  patientName = 'Ramesh Kumar',
  wardBed = 'Ward 4B / Bed 12',
  heartRate = 78,
  allergyNotice = 'Penicillin Allergy',
  activeContextType = 'CLINICAL',
  cashierTotal = '₹1,24,500',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  const toggleExpand = () => {
    playClick();
    triggerHaptic(12);
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      onClick={toggleExpand}
      className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 cursor-pointer select-none transition-all duration-300 ease-out 
        bg-slate-950/85 backdrop-blur-2xl border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.6)]
        hover:border-white/40 ${
          isExpanded
            ? 'w-[480px] p-4 rounded-3xl'
            : 'w-auto px-4 py-1.5 rounded-full flex items-center gap-3'
        }`}
      title="Click to toggle Dynamic Island HUD"
    >
      {!isExpanded ? (
        // Compact Pill View
        <div className="flex items-center gap-2.5 text-xs font-medium text-slate-200">
          <span className="flex items-center gap-1 text-rose-400 font-semibold tracking-wide">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-mono">{heartRate} bpm</span>
          </span>

          <span className="h-3 w-px bg-white/20" />

          {activeContextType === 'CLINICAL' && (
            <span className="truncate max-w-[140px] text-slate-100 font-semibold">
              {patientName}
            </span>
          )}

          {activeContextType === 'CASHIER' && (
            <span className="text-amber-400 font-mono font-semibold">
              Shift: {cashierTotal}
            </span>
          )}

          {activeContextType === 'EMERGENCY' && (
            <span className="text-rose-400 font-semibold uppercase tracking-wider">
              🚨 Code Blue Ready
            </span>
          )}

          <span className="h-3 w-px bg-white/20" />

          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
            {allergyNotice}
          </span>
        </div>
      ) : (
        // Expanded Medical Telemetry Dashboard
        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-sm text-white">{patientName}</span>
              <span className="text-xs text-slate-400 font-mono">({wardBed})</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded-md hover:bg-white/10"
            >
              Minimize ✕
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Pulse Rate</div>
              <div className="text-base font-bold font-mono text-rose-400">{heartRate} <span className="text-[10px]">bpm</span></div>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Oxygen SpO2</div>
              <div className="text-base font-bold font-mono text-cyan-400">99%</div>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Blood Pressure</div>
              <div className="text-base font-bold font-mono text-amber-400">120/80</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="px-2 py-1 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              ⚠️ Critical Alert: {allergyNotice}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  playClick();
                  window.location.href = '/partner/clinical/consultations/new-rx';
                }}
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md"
              >
                Stat Rx
              </button>
              <button
                onClick={() => {
                  playClick();
                  window.location.href = '/partner/clinical-investigation';
                }}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20"
              >
                Lab Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
