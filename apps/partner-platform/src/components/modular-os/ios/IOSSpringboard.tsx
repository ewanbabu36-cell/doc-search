import React, { useRef } from 'react';
import { FEATURE_REGISTRY, type ModularFeatureAction } from '../registry/feature-registry.js';
import { IOSAppIcon } from './IOSAppIcon.js';
import { DigitalClockWidget, CalendarMonthWidget, BedOccupancyConcentricRingsWidget } from '../widgets/DesktopWidgets.js';
import { useHapticSoundFeedback } from '../hooks/useHapticSoundFeedback.js';
import type { DesktopIconItem } from '../hooks/useWorkspaceLayout.js';

export interface IOSSpringboardProps {
  desktopIcons?: DesktopIconItem[];
  onLaunchApp: (action: ModularFeatureAction) => void;
  onRemoveFromDesktop?: (id: string) => void;
  onOpenSpotlight: () => void;
  isJiggleMode: boolean;
  onSetJiggleMode: (val: boolean) => void;
  onOpenAppLibrary: () => void;
}

// 17 Curated iPadOS Springboard Apps matching reference image (media_1793203668480_1adc1d85.jpg)
export const IPADOS_REFERENCE_GRID_APPS: ModularFeatureAction[] = [
  // --- ROW 1 ---
  {
    id: 'docsearch_patient_360',
    label: 'DocSearch:\nPatient 360',
    shortLabel: 'DocSearch:\nPatient 360',
    category: 'CLINICAL',
    jewelTheme: 'cyan',
    gradient: 'from-zinc-900 via-slate-900 to-black',
    icon: 'usercheck',
    route: '/partner/clinical/patients',
    description: 'Longitudinal universal patient electronic medical record',
    tags: ['patient', '360', 'emr']
  },
  {
    id: 'docsearch_home_app',
    label: 'DocSearch',
    shortLabel: 'DocSearch',
    category: 'CLINICAL',
    jewelTheme: 'sapphire',
    gradient: 'from-sky-400 via-blue-500 to-blue-600',
    icon: 'droplet',
    route: '/partner/clinical/consultations',
    description: 'DocSearch Core Clinical Operating Suite',
    tags: ['docsearch', 'core']
  },
  {
    id: 'vitals_telemetry_app',
    label: 'Vitals Telemetry',
    shortLabel: 'Vitals Telemetry',
    category: 'CLINICAL',
    jewelTheme: 'cyan',
    gradient: 'from-zinc-950 via-zinc-900 to-black',
    icon: 'activity',
    route: '/partner/clinical/vitals',
    description: 'Real-time bedside vitals monitor & ICU telemetry HUD',
    tags: ['vitals', 'telemetry', 'spo2']
  },
  {
    id: 'outpatient_queue_app',
    label: 'Outpatient Queue',
    shortLabel: 'Outpatient Queue',
    category: 'CLINICAL',
    jewelTheme: 'sapphire',
    gradient: 'from-white via-slate-100 to-slate-200 text-blue-600',
    icon: 'calendar_badge',
    route: '/partner/clinical/consultations',
    description: 'Active OPD token queue with patient chime',
    tags: ['opd', 'queue', 'tokens']
  },
  {
    id: 'smart_rx_pad_app',
    label: 'Smart Rx Pad',
    shortLabel: 'Smart Rx Pad',
    category: 'CLINICAL',
    jewelTheme: 'emerald',
    gradient: 'from-emerald-400 via-green-500 to-emerald-600',
    icon: 'rx_symbol',
    route: '/partner/clinical/consultations/new-rx',
    description: 'AI-assisted prescription generator with drug interactions',
    tags: ['rx', 'prescription', 'doctor']
  },
  {
    id: 'vitals_pulse_app',
    label: 'Vitals',
    shortLabel: 'Vitals',
    category: 'CLINICAL',
    jewelTheme: 'amethyst',
    gradient: 'from-violet-500 via-purple-600 to-indigo-700',
    icon: 'activity',
    route: '/partner/clinical/vitals',
    description: 'Rapid multi-parameter vitals recorder',
    tags: ['vitals', 'quick']
  },

  // --- ROW 2 ---
  {
    id: 'smart_rx_pad_heart',
    label: 'Smart Rx Pad',
    shortLabel: 'Smart Rx Pad',
    category: 'CLINICAL',
    jewelTheme: 'rose',
    gradient: 'from-white via-rose-50 to-rose-100',
    icon: 'heart_filled',
    route: '/partner/clinical/consultations/new-rx',
    description: 'Cardiology specific prescription pad & protocols',
    tags: ['rx', 'heart', 'cardio']
  },
  {
    id: 'emergency_manchester_triage',
    label: 'Manchester Triage',
    shortLabel: 'Manchester Triage',
    category: 'EMERGENCY',
    jewelTheme: 'amber',
    gradient: 'from-amber-500 via-orange-500 to-red-600',
    icon: 'alerttriangle',
    route: '/partner/emergency',
    description: 'Standard 5-level clinical acuity sorting',
    tags: ['triage', 'emergency']
  },
  {
    id: 'ipd_bed_census_app',
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
    id: 'staff_scheduling_app',
    label: 'Staff Scheduling',
    shortLabel: 'Staff Scheduling',
    category: 'CLINICAL',
    jewelTheme: 'amethyst',
    gradient: 'from-indigo-600 via-purple-700 to-indigo-900',
    icon: 'calendar',
    route: '/partner/roster',
    description: 'Physician & nursing on-call duty roster',
    tags: ['roster', 'shifts', 'doctor']
  },
  {
    id: 'clinical_radiology_viewer',
    label: 'Imaging Viewer',
    shortLabel: 'Imaging Viewer',
    category: 'CLINICAL',
    jewelTheme: 'cyan',
    gradient: 'from-zinc-950 via-slate-900 to-black',
    icon: 'imaging_scan',
    route: '/partner/radiology',
    description: 'Zero-footprint web DICOM, MRI, CT & X-Ray viewer',
    tags: ['dicom', 'radiology', 'pacs']
  },
  {
    id: 'billing_snapshot_app',
    label: 'Billing',
    shortLabel: 'Billing',
    category: 'BILLING',
    jewelTheme: 'teal',
    gradient: 'from-teal-400 via-emerald-500 to-teal-700',
    icon: 'camera',
    route: '/partner/billing',
    description: 'Quick billing charge slips & cashier snapshot',
    tags: ['billing', 'cashier']
  },

  // --- ROW 3 ---
  {
    id: 'clinical_ehr_cloud',
    label: 'EHR',
    shortLabel: 'EHR',
    category: 'CLINICAL',
    jewelTheme: 'sapphire',
    gradient: 'from-zinc-950 via-neutral-900 to-black',
    icon: 'cloud_caduceus',
    route: '/partner/clinical/patients',
    description: 'Cloud health records sync & ABDM gateway',
    tags: ['ehr', 'cloud', 'abdm']
  },
  {
    id: 'electronic_health_records_app',
    label: 'Electronic Health\nRecords',
    shortLabel: 'Electronic Health\nRecords',
    category: 'CLINICAL',
    jewelTheme: 'sapphire',
    gradient: 'from-blue-500 via-sky-600 to-blue-700',
    icon: 'briefcase_medical',
    route: '/partner/mrd',
    description: 'Medical Records Department physical & digital repository',
    tags: ['mrd', 'records']
  },
  {
    id: 'billing_portal_app',
    label: 'Billing Portal',
    shortLabel: 'Billing Portal',
    category: 'BILLING',
    jewelTheme: 'teal',
    gradient: 'from-teal-400 via-emerald-500 to-cyan-600',
    icon: 'creditcard',
    route: '/partner/billing',
    description: 'Unified billing receipts, advances & corporate ledgers',
    tags: ['billing', 'portal']
  },
  {
    id: 'telehealth_vc_app',
    label: 'Telehealth VC',
    shortLabel: 'Telehealth VC',
    category: 'CLINICAL',
    jewelTheme: 'sapphire',
    gradient: 'from-blue-600 via-indigo-600 to-blue-800',
    icon: 'video',
    route: '/partner/telemedicine',
    description: 'End-to-end encrypted HD video consultations',
    tags: ['telehealth', 'video']
  },
  {
    id: 'lab_results_app',
    label: 'Lab Results',
    shortLabel: 'Lab Results',
    category: 'CLINICAL',
    jewelTheme: 'rose',
    gradient: 'from-fuchsia-500 via-purple-600 to-pink-600',
    icon: 'flaskconical',
    route: '/partner/clinical-investigation',
    description: 'Laboratory pathology, biochemistry & hematology findings',
    tags: ['lab', 'results', 'lis']
  },
];

export const IOSSpringboard: React.FC<IOSSpringboardProps> = ({
  desktopIcons,
  onLaunchApp,
  onRemoveFromDesktop,
  onOpenSpotlight,
  isJiggleMode,
  onSetJiggleMode,
  onOpenAppLibrary,
}) => {
  const { playClick, triggerHaptic } = useHapticSoundFeedback();
  const touchStartYRef = useRef<number | null>(null);

  // Swipe down on Springboard triggers Spotlight Search
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current !== null && e.changedTouches[0]) {
      const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
      if (deltaY > 80 && !isJiggleMode) {
        playClick();
        triggerHaptic(20);
        onOpenSpotlight();
      }
      touchStartYRef.current = null;
    }
  };

  // If user has customized their desktop icons, resolve them; otherwise use reference set
  const appsToRender: ModularFeatureAction[] =
    desktopIcons && desktopIcons.length >= 10
      ? desktopIcons
          .map((item) => FEATURE_REGISTRY.find((a) => a.id === item.id) || IPADOS_REFERENCE_GRID_APPS.find((a) => a.id === item.id))
          .filter((a): a is ModularFeatureAction => Boolean(a))
      : IPADOS_REFERENCE_GRID_APPS;

  return (
    <div
      className="relative w-full flex flex-col justify-between pt-1 pb-6 px-4 md:px-8 select-none pointer-events-auto"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => {
        e.preventDefault();
        if (!isJiggleMode) {
          triggerHaptic(30);
          onSetJiggleMode(true);
        }
      }}
    >
      {/* 1. Jiggle Mode Top Bar Controls */}
      {isJiggleMode && (
        <div className="fixed top-12 inset-x-6 z-40 flex items-center justify-between animate-in fade-in duration-200">
          <button
            onClick={() => {
              playClick();
              onOpenAppLibrary();
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg active:scale-95 transition-all"
          >
            <span>+</span>
            <span>Add Apps</span>
          </button>

          <button
            onClick={() => {
              playClick();
              triggerHaptic(20);
              onSetJiggleMode(false);
            }}
            className="px-5 py-1.5 rounded-full bg-white/25 hover:bg-white/35 text-white font-bold text-xs backdrop-blur-xl border border-white/30 shadow-lg active:scale-95 transition-all"
          >
            Done
          </button>
        </div>
      )}

      {/* 2. Top Row: Exactly 3 Apple iOS Smart Glass Widgets side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-[1100px] mx-auto w-full mb-6">
        <DigitalClockWidget />
        <CalendarMonthWidget />
        <BedOccupancyConcentricRingsWidget />
      </div>

      {/* 3. Center Section: 3 rows x 6 columns Authentic iPadOS App Grid */}
      <div className="flex-1 max-w-[1100px] mx-auto w-full my-auto">
        <div className="grid grid-cols-6 gap-x-6 gap-y-7 justify-items-center">
          {appsToRender.map((action, idx) => (
            <IOSAppIcon
              key={action.id + idx}
              action={action}
              onLaunch={onLaunchApp}
              onDelete={onRemoveFromDesktop}
              isJiggleMode={isJiggleMode}
              onStartJiggle={() => onSetJiggleMode(true)}
              size="md"
              index={idx}
            />
          ))}
        </div>
      </div>

      {/* 4. Page Indicator Dots (••) Centered below Grid */}
      <div className="pt-4 pb-16 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
        <span className="w-2 h-2 rounded-full bg-white/35" />
      </div>
    </div>
  );
};
