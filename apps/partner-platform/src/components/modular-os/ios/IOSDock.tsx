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

// Curated Hospital Core Dock Apps (Real Clinical Operations)
export const HOSPITAL_CORE_DOCK_APPS: ModularFeatureAction[] = [
  {
    id: 'clinical_opd_queue',
    label: 'OPD Queue',
    shortLabel: 'OPD Queue',
    category: 'CLINICAL',
    jewelTheme: 'sapphire',
    gradient: 'from-blue-500 via-indigo-600 to-blue-700',
    icon: 'calendar_badge',
    route: '/partner/clinical/consultations',
    description: 'Active OPD token queue with patient chime',
    tags: ['opd', 'queue', 'consultation']
  },
  {
    id: 'clinical_rx_pad',
    label: 'Smart Rx Pad',
    shortLabel: 'Rx Pad',
    category: 'CLINICAL',
    jewelTheme: 'emerald',
    gradient: 'from-emerald-400 via-green-500 to-emerald-600',
    icon: 'rx_symbol',
    route: '/partner/clinical/consultations/new-rx',
    description: 'AI-assisted prescription generator with drug interactions',
    tags: ['rx', 'prescription', 'doctor']
  },
  {
    id: 'ipd_bed_census',
    label: 'Bed Census',
    shortLabel: 'Bed Census',
    category: 'INPATIENT',
    jewelTheme: 'sapphire',
    gradient: 'from-blue-500 via-blue-600 to-indigo-600',
    icon: 'bed',
    route: '/partner/inpatient',
    description: 'Real-time ward, bed census & occupancy matrix',
    tags: ['bed', 'census', 'ward']
  },
  {
    id: 'emergency_manchester_triage',
    label: 'ER Triage',
    shortLabel: 'ER Triage',
    category: 'EMERGENCY',
    jewelTheme: 'ruby',
    gradient: 'from-red-500 via-rose-600 to-red-700',
    icon: 'heart_filled',
    route: '/partner/emergency',
    description: 'Emergency Manchester Triage & resuscitation intake',
    tags: ['emergency', 'triage', 'trauma']
  },
  {
    id: 'billing_cashier_desk',
    label: 'Billing Desk',
    shortLabel: 'Billing Desk',
    category: 'BILLING',
    jewelTheme: 'teal',
    gradient: 'from-teal-400 via-emerald-500 to-teal-700',
    icon: 'creditcard',
    route: '/partner/billing',
    description: 'Cashier sessions, instant patient receipts and GST invoicing',
    tags: ['billing', 'cashier', 'receipts']
  },
  {
    id: 'pharmacy_pos_checkout',
    label: 'Pharmacy POS',
    shortLabel: 'Pharmacy POS',
    category: 'PHARMACY',
    jewelTheme: 'amber',
    gradient: 'from-amber-400 via-orange-500 to-amber-600',
    icon: 'droplet',
    route: '/partner/pharmacy',
    description: 'Barcode dispensing POS & generic drug substitutions',
    tags: ['pharmacy', 'dispense', 'pos']
  },
  {
    id: 'clinical_lab_requisitions',
    label: 'Lab & Diagnostics',
    shortLabel: 'LIS Lab',
    category: 'CLINICAL',
    jewelTheme: 'cyan',
    gradient: 'from-cyan-400 via-sky-500 to-blue-600',
    icon: 'activity',
    route: '/partner/lab',
    description: 'LIS pathology, biochemistry & radiology requisitions',
    tags: ['lab', 'pathology', 'diagnostics']
  }
];

export const IPADOS_REFERENCE_DOCK_APPS = HOSPITAL_CORE_DOCK_APPS;

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

        {/* Pinned App Icons (Hospital Modules) */}
        <div className="flex items-center gap-3">
          {appsToDisplay.map((action, idx) => (
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
          ))}
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
