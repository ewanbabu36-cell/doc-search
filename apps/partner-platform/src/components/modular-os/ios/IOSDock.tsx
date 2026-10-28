import React from 'react';
import { type ModularFeatureAction } from '../registry/feature-registry.js';
import { IOSAppIcon } from './IOSAppIcon.js';
import { useHapticSoundFeedback } from '../hooks/useHapticSoundFeedback.js';

export interface IOSDockProps {
  dockActions?: ModularFeatureAction[];
  onLaunchApp: (action: ModularFeatureAction) => void;
  onOpenAppLibrary: () => void;
  isJiggleMode?: boolean;
  onStartJiggle?: () => void;
  onRemoveFromDock?: (id: string) => void;
}

// Curated iPadOS Native Dock Apps matching the reference image exactly
export const IPADOS_REFERENCE_DOCK_APPS: ModularFeatureAction[] = [
  {
    id: 'dock_messages',
    label: 'Messages',
    shortLabel: 'Messages',
    category: 'CLINICAL',
    jewelTheme: 'emerald',
    gradient: 'from-emerald-400 to-green-500',
    icon: 'messages',
    route: '/partner/clinical/whatsapp',
    description: 'Patient communications & instant clinical notifications',
    tags: ['messages', 'chat', 'sms']
  },
  {
    id: 'dock_mail',
    label: 'Mail',
    shortLabel: 'Mail',
    category: 'CLINICAL',
    jewelTheme: 'cyan',
    gradient: 'from-sky-400 to-blue-500',
    icon: 'mail',
    route: '/partner/clinical/referrals',
    description: 'Institutional medical referral dispatches and emails',
    tags: ['mail', 'email']
  },
  {
    id: 'dock_phone',
    label: 'Phone',
    shortLabel: 'Phone',
    category: 'CLINICAL',
    jewelTheme: 'emerald',
    gradient: 'from-green-400 to-emerald-600',
    icon: 'phone',
    route: '/partner/telemedicine',
    description: 'Direct telephony VoIP caller',
    tags: ['phone', 'call']
  },
  {
    id: 'dock_safari',
    label: 'Safari',
    shortLabel: 'Safari',
    category: 'CLINICAL',
    jewelTheme: 'sapphire',
    gradient: 'from-white via-slate-100 to-slate-200',
    icon: 'safari',
    route: '/partner/clinical/patients',
    description: 'Universal medical reference browser',
    tags: ['safari', 'browser']
  },
  {
    id: 'dock_calendar',
    label: 'Calendar',
    shortLabel: 'Calendar',
    category: 'CLINICAL',
    jewelTheme: 'sapphire',
    gradient: 'from-white via-slate-50 to-slate-100',
    icon: 'calendar',
    route: '/partner/roster',
    description: 'Doctor on-call roster and hospital schedules',
    tags: ['calendar', 'roster']
  },
  {
    id: 'dock_notes',
    label: 'Notes',
    shortLabel: 'Notes',
    category: 'CLINICAL',
    jewelTheme: 'amber',
    gradient: 'from-white via-amber-50 to-amber-100',
    icon: 'notes',
    route: '/partner/clinical/ai-scribe',
    description: 'Clinical consultation notes and voice scribe memos',
    tags: ['notes', 'scribe']
  },
];

export const IOSDock: React.FC<IOSDockProps> = ({
  dockActions,
  onLaunchApp,
  onOpenAppLibrary,
  isJiggleMode = false,
  onStartJiggle,
  onRemoveFromDock,
}) => {
  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  // Use the reference dock apps if no override is specified
  const appsToDisplay = dockActions && dockActions.length >= 4 ? dockActions : IPADOS_REFERENCE_DOCK_APPS;

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 select-none pointer-events-auto">
      {/* Translucent Frosted Glass iPadOS Dock Pill matching reference image */}
      <div className="px-5 py-2.5 rounded-[30px] bg-white/20 dark:bg-black/35 backdrop-blur-3xl border border-white/25 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex items-center gap-3.5 transition-all duration-300 relative group">
        {/* Specular hairline top reflection */}
        <div className="absolute top-0 inset-x-8 h-px bg-white/40 pointer-events-none" />

        {/* Pinned App Icons (No labels in genuine Apple iOS fashion) */}
        <div className="flex items-center gap-3">
          {appsToDisplay.map((action, idx) => {
            // Special custom rendering for Calendar icon: White background, red TUE header, large bold 24
            if (action.id === 'dock_calendar') {
              return (
                <div
                  key={action.id}
                  onClick={() => {
                    playClick();
                    triggerHaptic(15);
                    onLaunchApp(action);
                  }}
                  className="w-14 h-14 rounded-[16px] bg-white border border-white/40 shadow-[0_6px_16px_rgba(0,0,0,0.35)] flex flex-col items-center justify-between overflow-hidden cursor-pointer transform hover:scale-105 active:scale-95 transition-all"
                  title="Calendar"
                >
                  <div className="w-full bg-[#ef4444] text-[9px] font-bold text-white text-center py-0.5 tracking-wider uppercase">
                    TUE
                  </div>
                  <div className="text-2xl font-black text-slate-900 leading-none pb-2 font-sans">
                    24
                  </div>
                </div>
              );
            }

            return (
              <IOSAppIcon
                key={action.id}
                action={action}
                onLaunch={onLaunchApp}
                onDelete={onRemoveFromDock}
                isJiggleMode={isJiggleMode}
                onStartJiggle={onStartJiggle}
                hideLabel={true}
                size="md"
                index={idx}
              />
            );
          })}
        </div>

        {/* Subtle vertical divider bar */}
        <div className="h-9 w-px bg-white/25 mx-0.5" />

        {/* Apple iOS App Library Trigger */}
        <button
          onClick={() => {
            playClick();
            triggerHaptic(20);
            onOpenAppLibrary();
          }}
          className="w-14 h-14 rounded-[16px] bg-white/25 hover:bg-white/35 border border-white/30 shadow-[0_6px_16px_rgba(0,0,0,0.35)] flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95 relative overflow-hidden backdrop-blur-md"
          title="App Library (All Modules)"
        >
          {/* Specular highlight */}
          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />

          {/* 2x2 Mini Folder Grid Preview */}
          <div className="grid grid-cols-2 gap-1 p-1.5 w-9 h-9 rounded-xl bg-black/25">
            <span className="w-3 h-3 rounded-[3px] bg-blue-500 shadow-sm flex items-center justify-center text-[7px] font-bold text-white">A</span>
            <span className="w-3 h-3 rounded-[3px] bg-emerald-500 shadow-sm flex items-center justify-center text-[7px] font-bold text-white">💬</span>
            <span className="w-3 h-3 rounded-[3px] bg-rose-500 shadow-sm flex items-center justify-center text-[7px] font-bold text-white">📰</span>
            <span className="w-3 h-3 rounded-[3px] bg-purple-500 shadow-sm flex items-center justify-center text-[7px] font-bold text-white">❤️</span>
          </div>
        </button>
      </div>
    </div>
  );
};
