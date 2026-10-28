import React, { useState, useEffect } from 'react';
import { useHapticSoundFeedback } from '../hooks/useHapticSoundFeedback.js';

// ----------------- WIDGET 1: DIGITAL CLOCK (9:41 AM, Tuesday, Oct 24) -----------------
export const DigitalClockWidget: React.FC = () => {
  const [time, setTime] = useState<string>('9:41 AM');
  const [dateStr, setDateStr] = useState<string>('Tuesday, Oct 24');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[156px] rounded-[26px] bg-white/15 backdrop-blur-2xl border border-white/20 p-6 flex flex-col items-center justify-center shadow-[0_12px_40px_rgba(0,0,0,0.35)] select-none transition-transform hover:scale-[1.01]">
      <div className="text-5xl font-bold tracking-tight text-white drop-shadow-md font-sans">
        {time || '9:41 AM'}
      </div>
      <div className="text-[15px] font-medium text-white/80 mt-2 tracking-tight">
        {dateStr || 'Tuesday, Oct 24'}
      </div>
    </div>
  );
};

// ----------------- WIDGET 2: CALENDAR MONTH VIEW (Tuesday 24 Oct) -----------------
export const CalendarMonthWidget: React.FC = () => {
  const daysHeader = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // October 2026 grid representation (or standard visual month matching reference)
  // Matching reference: Row 1: 1-6 (starts on Mon), etc.
  const calendarRows = [
    ['', '1', '2', '3', '4', '5', '6'],
    ['7', '8', '9', '10', '11', '12', '13'],
    ['14', '15', '16', '17', '18', '19', '20'],
    ['21', '22', '23', '24', '25', '26', '27'],
    ['28', '29', '30', '31', '', '', ''],
  ];

  return (
    <div className="h-[156px] rounded-[26px] bg-white/15 backdrop-blur-2xl border border-white/20 px-6 py-4 flex items-center justify-between shadow-[0_12px_40px_rgba(0,0,0,0.35)] select-none transition-transform hover:scale-[1.01]">
      {/* Left side: Date callout */}
      <div className="flex flex-col justify-center pr-3 border-r border-white/15">
        <div className="text-5xl font-black text-white tracking-tight leading-none">
          24
        </div>
        <div className="text-sm font-semibold text-white/90 mt-1.5 leading-tight">
          Tuesday
        </div>
        <div className="text-xs font-medium text-white/60">
          Oct 24
        </div>
      </div>

      {/* Right side: Mini Month Calendar Grid */}
      <div className="flex-1 pl-4 flex flex-col justify-center">
        {/* Day Header Row */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {daysHeader.map((d, i) => (
            <span key={i} className="text-[10px] font-bold text-white/45">
              {d}
            </span>
          ))}
        </div>

        {/* Date Rows */}
        <div className="space-y-0.5">
          {calendarRows.map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-7 gap-1 text-center">
              {row.map((day, cIdx) => {
                const isSelected = day === '24';
                return (
                  <div
                    key={cIdx}
                    className="flex items-center justify-center h-4 text-[10px] font-medium"
                  >
                    {isSelected ? (
                      <span className="w-4 h-4 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center shadow-sm">
                        {day}
                      </span>
                    ) : (
                      <span className={day ? 'text-white/80' : 'text-transparent'}>
                        {day}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ----------------- WIDGET 3: BED OCCUPANCY CONCENTRIC RINGS (Apple Fitness Style) -----------------
export const BedOccupancyConcentricRingsWidget: React.FC = () => {
  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  // Ring Circumferences:
  // Ring 1 (Outer - ICU Magenta): Radius = 36, C = 2 * PI * 36 = 226.2, 85% filled -> dashoffset = 226.2 * (1 - 0.85) = 33.93
  // Ring 2 (Middle - HDU Amber): Radius = 27, C = 2 * PI * 27 = 169.65, 72% filled -> dashoffset = 169.65 * (1 - 0.72) = 47.5
  // Ring 3 (Inner - General Cyan): Radius = 18, C = 2 * PI * 18 = 113.1, 91% filled -> dashoffset = 113.1 * (1 - 0.91) = 10.18

  return (
    <div
      onClick={() => {
        playClick();
        triggerHaptic(15);
      }}
      className="h-[156px] rounded-[26px] bg-white/15 backdrop-blur-2xl border border-white/20 px-6 py-4 flex items-center justify-between shadow-[0_12px_40px_rgba(0,0,0,0.35)] select-none transition-transform hover:scale-[1.01] cursor-pointer"
    >
      {/* Left side: Concentric Activity / Census Rings */}
      <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background Track 1 (Outer - Magenta) */}
          <circle
            cx="50"
            cy="50"
            r="38"
            stroke="rgba(244, 63, 94, 0.2)"
            strokeWidth="7"
            fill="transparent"
          />
          {/* Active Ring 1 (Magenta - 85%) */}
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

          {/* Background Track 2 (Middle - Amber) */}
          <circle
            cx="50"
            cy="50"
            r="28"
            stroke="rgba(245, 158, 11, 0.2)"
            strokeWidth="7"
            fill="transparent"
          />
          {/* Active Ring 2 (Amber - 72%) */}
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

          {/* Background Track 3 (Inner - Cyan) */}
          <circle
            cx="50"
            cy="50"
            r="18"
            stroke="rgba(6, 182, 212, 0.2)"
            strokeWidth="7"
            fill="transparent"
          />
          {/* Active Ring 3 (Cyan - 91%) */}
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
      </div>

      {/* Right side: Legend and percentages */}
      <div className="flex flex-col justify-center space-y-1.5 pl-4 flex-1">
        <div>
          <div className="text-xs font-bold text-white leading-tight">ICU</div>
          <div className="text-[11px] font-semibold text-[#f43f5e]">Magenta/85%</div>
        </div>

        <div>
          <div className="text-xs font-bold text-white leading-tight">HDU</div>
          <div className="text-[11px] font-semibold text-[#f59e0b]">Amber/72%</div>
        </div>

        <div>
          <div className="text-xs font-bold text-white leading-tight">General</div>
          <div className="text-[11px] font-semibold text-[#06b6d4]">Cyan/91%</div>
        </div>
      </div>
    </div>
  );
};

// Backward compatible aliases
export const BedOccupancyWidget: React.FC<any> = BedOccupancyConcentricRingsWidget;
export const CashierRevenueWidget: React.FC<any> = CalendarMonthWidget;
