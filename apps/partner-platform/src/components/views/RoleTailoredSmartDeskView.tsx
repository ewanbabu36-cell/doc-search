import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { HospitalStaffUser } from '../auth/HospitalStaffLogin.js';
import type { PartnerModuleKey, RolePerspective } from '../PartnerPlatformShell.js';

export interface RoleTailoredSmartDeskViewProps {
  currentRole: RolePerspective;
  onChangeRole: (role: RolePerspective) => void;
  currentUser?: HospitalStaffUser | undefined;
  onNavigateModule: (moduleKey: PartnerModuleKey, subTab?: string) => void;
  onOpenAllModulesDrawer: () => void;
  facilityName?: string | undefined;
  queueCount?: number;
  bedOccupancyRate?: number;
  panicAlertCount?: number;
  pharmacyDueCount?: number;
}

interface KillerTool {
  id: string;
  slotNumber: number;
  title: string;
  tagline: string;
  icon: string;
  color: string;
  targetModule: PartnerModuleKey;
  targetSubTab?: string;
  metricLabel: string;
  metricValue: string;
  metricBadge: string;
  quickActions: Array<{
    label: string;
    icon: string;
    targetModule: PartnerModuleKey;
    targetSubTab?: string;
  }>;
}

export const RoleTailoredSmartDeskView: React.FC<RoleTailoredSmartDeskViewProps> = ({
  currentRole,
  onChangeRole,
  currentUser,
  onNavigateModule,
  onOpenAllModulesDrawer,
  facilityName = 'DocSearch Apex Hospital & Medical Centre',
  queueCount: initialQueueCount = 0,
  bedOccupancyRate: initialBedOccupancyRate = 0,
  panicAlertCount: initialPanicAlertCount = 0,
  pharmacyDueCount: initialPharmacyDueCount = 0
}) => {
  const [telemetry, setTelemetry] = useState({
    queueCount: initialQueueCount,
    bedOccupancyRate: initialBedOccupancyRate,
    panicAlertCount: initialPanicAlertCount,
    pharmacyDueCount: initialPharmacyDueCount
  });

  useEffect(() => {
    let isMounted = true;
    async function loadTelemetry() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_auth_token') : null;
        const res = await fetch('/api/v1/partner/command-center/overview', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            setTelemetry({
              queueCount: json.data.activeEncounters ?? json.data.opdWaiting ?? initialQueueCount,
              bedOccupancyRate: json.data.bedOccupancyRate ?? initialBedOccupancyRate,
              panicAlertCount: json.data.criticalAlerts ?? initialPanicAlertCount,
              pharmacyDueCount: json.data.pendingPrescriptions ?? initialPharmacyDueCount
            });
          }
        }
      } catch {}
    }
    void loadTelemetry();
    return () => { isMounted = false; };
  }, [initialQueueCount, initialBedOccupancyRate, initialPanicAlertCount, initialPharmacyDueCount]);

  const { queueCount, bedOccupancyRate, panicAlertCount, pharmacyDueCount } = telemetry;

  // Determine active effective role
  const resolvedRole: RolePerspective = useMemo(() => {
    if (currentRole !== 'AUTO') return currentRole;
    const r = String(currentUser?.role || '').toUpperCase();
    if (r.includes('DOCTOR') || r.includes('PHYSICIAN') || r.includes('SURGEON')) return 'DOCTOR';
    if (r.includes('NURSE')) return 'NURSE';
    if (r.includes('PHARMAC') || r.includes('AUSHADHI')) return 'PHARMACY';
    if (r.includes('LAB') || r.includes('PATHO') || r.includes('RADIO')) return 'LAB';
    if (r.includes('FRONT') || r.includes('DESK') || r.includes('RECEPT')) return 'FRONT_DESK';
    return 'DOCTOR';
  }, [currentRole, currentUser?.role]);

  // The 4 Killer Tools for the active persona
  const killerTools: KillerTool[] = useMemo(() => {
    switch (resolvedRole) {
      case 'DOCTOR':
        return [
          {
            id: 'doc-1',
            slotNumber: 1,
            title: '1-Flow OPD Express & Consultation Desk',
            tagline: 'Zero mouse-click prescription pad with real-time drug interaction checks & Jan Aushadhi salt suggestions.',
            icon: '⚡',
            color: '#0284C7',
            targetModule: 'opd-one-flow-express',
            metricLabel: 'Patients Waiting',
            metricValue: `${queueCount} Arrived`,
            metricBadge: '⚡ Active Queue',
            quickActions: [
              { label: 'OPD Cockpit', icon: '🩺', targetModule: 'clinical-consultation' },
              { label: 'Rx Templates', icon: '📋', targetModule: 'clinical-consultation' }
            ]
          },
          {
            id: 'doc-2',
            slotNumber: 2,
            title: 'Live Patient Token Queue & Chamber Dispatch',
            tagline: 'Audio-chime token caller, patient arrival verification, and triage acuity indicators.',
            icon: '⏱️',
            color: '#0EA5E9',
            targetModule: 'encounters-visits',
            metricLabel: 'Avg Wait Time',
            metricValue: '8 mins',
            metricBadge: '● Live Token Stream',
            quickActions: [
              { label: 'Call Next', icon: '📢', targetModule: 'encounters-visits' },
              { label: 'Token Screen', icon: '📺', targetModule: 'encounters-visits' }
            ]
          },
          {
            id: 'doc-3',
            slotNumber: 3,
            title: 'Inpatient Bed Rounds & Clinical Census',
            tagline: 'Admitted ward patients under doctor care, daily clinical round progress notes, and discharge orders.',
            icon: '🛏️',
            color: '#10B981',
            targetModule: 'inpatient-management',
            targetSubTab: 'patient-census',
            metricLabel: 'Admitted Patients',
            metricValue: '18 Under Care',
            metricBadge: '✓ Rounds In Progress',
            quickActions: [
              { label: 'Round Notes', icon: '📝', targetModule: 'inpatient-management', targetSubTab: 'patient-census' },
              { label: 'Discharge Order', icon: '🚪', targetModule: 'inpatient-management', targetSubTab: 'discharge-workbench' }
            ]
          },
          {
            id: 'doc-4',
            slotNumber: 4,
            title: 'Telehealth Video & Remote Consult',
            tagline: '1-click WebRTC encrypted video consults, remote e-prescriptions, and ABHA care context linking.',
            icon: '📹',
            color: '#8B5CF6',
            targetModule: 'telemedicine-rpm',
            metricLabel: 'Tele-Appointments',
            metricValue: '3 Scheduled',
            metricBadge: '🌐 ABHA Connected',
            quickActions: [
              { label: 'Start Video Room', icon: '🎥', targetModule: 'telemedicine-rpm' },
              { label: 'WhatsApp Link', icon: '📲', targetModule: 'telemedicine-rpm' }
            ]
          }
        ];

      case 'NURSE':
        return [
          {
            id: 'nurse-1',
            slotNumber: 1,
            title: 'Emergency Nurse Triage Station',
            tagline: 'Red / Yellow / Green / Blue acuity categorization with automated Modified Early Warning Score (MEWS).',
            icon: '🚨',
            color: '#EF4444',
            targetModule: 'nurse-triage-station',
            metricLabel: 'Triage Queue',
            metricValue: '4 Pending',
            metricBadge: '● Red / Yellow Alert',
            quickActions: [
              { label: 'Triage Form', icon: '📋', targetModule: 'nurse-triage-station' },
              { label: 'Crash Cart', icon: '🛒', targetModule: 'emergency-trauma' }
            ]
          },
          {
            id: 'nurse-2',
            slotNumber: 2,
            title: 'Ward Bed Map & Bed Board',
            tagline: 'Visual floor plan with real-time bed status: Occupied, Vacant, Cleaning, and Reserved.',
            icon: '🛏️',
            color: '#06B6D4',
            targetModule: 'inpatient-management',
            targetSubTab: 'bed-board',
            metricLabel: 'Bed Occupancy',
            metricValue: `${bedOccupancyRate}% Occupied`,
            metricBadge: '4 Beds Vacant',
            quickActions: [
              { label: 'Floor Map', icon: '🗺️', targetModule: 'inpatient-management', targetSubTab: 'bed-board' },
              { label: 'Assign Bed', icon: '➕', targetModule: 'inpatient-management', targetSubTab: 'bed-board' }
            ]
          },
          {
            id: 'nurse-3',
            slotNumber: 3,
            title: 'Vitals Entry & Early Warning Radar',
            tagline: '1-click recording of BP, SpO2, Pulse, Temp, Blood Sugar with automated vital breach escalation.',
            icon: '🫀',
            color: '#EC4899',
            targetModule: 'nurse-triage-station',
            metricLabel: 'Abnormal Vitals',
            metricValue: '1 Critical Breach',
            metricBadge: '⚡ Instant Alert',
            quickActions: [
              { label: 'Log Vitals', icon: '🩺', targetModule: 'nurse-triage-station' },
              { label: 'Shift Handover', icon: '🔄', targetModule: 'nurse-triage-station' }
            ]
          },
          {
            id: 'nurse-4',
            slotNumber: 4,
            title: 'MAR (Medication Administration Record)',
            tagline: 'Scheduled medication doses, IV fluid drip tracking, barcode dose confirmation, and nursing sign-off.',
            icon: '💊',
            color: '#10B981',
            targetModule: 'inpatient-management',
            targetSubTab: 'nursing-care',
            metricLabel: 'Scheduled Doses',
            metricValue: '12 Due Next Hr',
            metricBadge: '✓ Verified by RN',
            quickActions: [
              { label: 'Dose Checklist', icon: '✅', targetModule: 'inpatient-management', targetSubTab: 'nursing-care' },
              { label: 'IV Fluid Log', icon: '💧', targetModule: 'inpatient-management', targetSubTab: 'nursing-care' }
            ]
          }
        ];

      case 'PHARMACY':
        return [
          {
            id: 'pharm-1',
            slotNumber: 1,
            title: 'Fast POS Dispense Counter & Decimal Billing',
            tagline: 'Blister-pack strip fraction & decimal tab billing, FEFO auto-selection, and instant thermal receipt printing.',
            icon: '🛒',
            color: '#0D9488',
            targetModule: 'pharmacy-medication',
            targetSubTab: 'pos',
            metricLabel: 'Prescriptions Due',
            metricValue: `${pharmacyDueCount} Dispenses Waiting`,
            metricBadge: '⚡ Fast Counter [F2]',
            quickActions: [
              { label: 'POS Counter', icon: '⚡', targetModule: 'pharmacy-medication', targetSubTab: 'pos' },
              { label: 'Khata Ledger', icon: '📒', targetModule: 'pharmacy-medication', targetSubTab: 'khata' }
            ]
          },
          {
            id: 'pharm-2',
            slotNumber: 2,
            title: 'Stock Inward & 1-Click Marg CSV Ingestion',
            tagline: 'Direct ingestion of Marg ERP invoices, distributor challans, batch expiry verification, and cost tracking.',
            icon: '📦',
            color: '#0284C7',
            targetModule: 'procurement-supply-chain',
            metricLabel: 'Pending Challans',
            metricValue: '2 Inward POs',
            metricBadge: '✓ 1-Click Ingest',
            quickActions: [
              { label: 'Upload Marg CSV', icon: '⬆️', targetModule: 'procurement-supply-chain' },
              { label: 'Stock Master', icon: '📑', targetModule: 'procurement-supply-chain' }
            ]
          },
          {
            id: 'pharm-3',
            slotNumber: 3,
            title: 'Expiry Radar & Epidemic Outbreak Alerts',
            tagline: '30/60/90-day expiry loss prevention radar combined with regional monsoon fever drug surge alerts.',
            icon: '⏳',
            color: '#F59E0B',
            targetModule: 'pharmacy-medication',
            targetSubTab: 'expiry',
            metricLabel: 'Expiring in 30d',
            metricValue: '3 Batches',
            metricBadge: '⚠️ Loss Prevention',
            quickActions: [
              { label: 'Expiry Batches', icon: '🔍', targetModule: 'pharmacy-medication', targetSubTab: 'expiry' },
              { label: 'Vendor Return', icon: '↩️', targetModule: 'pharmacy-medication', targetSubTab: 'expiry' }
            ]
          },
          {
            id: 'pharm-4',
            slotNumber: 4,
            title: 'CDSCO Schedule H1 & Cash Galla Ledger',
            tagline: 'Mandatory Schedule H/H1/X statutory dispensing register with doctor NMC Reg# & daily shift cash drawer tally.',
            icon: '📒',
            color: '#6366F1',
            targetModule: 'pharmacy-medication',
            targetSubTab: 'khata',
            metricLabel: 'Shift Cash Tally',
            metricValue: '₹14,250 Settled',
            metricBadge: '✓ CDSCO Compliant',
            quickActions: [
              { label: 'Galla Drawer', icon: '💰', targetModule: 'pharmacy-medication', targetSubTab: 'khata' },
              { label: 'H1 Register', icon: '📜', targetModule: 'pharmacy-medication', targetSubTab: 'khata' }
            ]
          }
        ];

      case 'LAB':
        return [
          {
            id: 'lab-1',
            slotNumber: 1,
            title: 'Phlebotomy Queue & Sample Barcoding',
            tagline: 'Sample collection triage, vacutainer tube labeling, barcode scan, and sample transport tracking.',
            icon: '🩸',
            color: '#DC2626',
            targetModule: 'clinical-investigation',
            targetSubTab: 'specimens',
            metricLabel: 'Samples Pending',
            metricValue: '6 Phlebotomy',
            metricBadge: '🏷️ Barcode Print',
            quickActions: [
              { label: 'Sample Intake', icon: '📥', targetModule: 'clinical-investigation', targetSubTab: 'specimens' },
              { label: 'Vacutainer Barcode', icon: '🏷️', targetModule: 'clinical-investigation', targetSubTab: 'specimens' }
            ]
          },
          {
            id: 'lab-2',
            slotNumber: 2,
            title: 'Analyzer Workbench & Auto-Sync Feed',
            tagline: 'Bidirectional ASTM/HL7 auto-analyzer sync, rapid batch test entry, and reference interval validation.',
            icon: '🧪',
            color: '#8B5CF6',
            targetModule: 'clinical-investigation',
            targetSubTab: 'processing',
            metricLabel: 'Tests In-Run',
            metricValue: '18 Analyzer Runs',
            metricBadge: '⚡ Auto-Sync Active',
            quickActions: [
              { label: 'Enter Results', icon: '✍️', targetModule: 'clinical-investigation', targetSubTab: 'processing' },
              { label: 'Analyzer Sync', icon: '🔄', targetModule: 'clinical-investigation', targetSubTab: 'processing' }
            ]
          },
          {
            id: 'lab-3',
            slotNumber: 3,
            title: 'NABL Sign-Off & Critical Panic Alerts',
            tagline: 'Pathologist digital signature verification, abnormal parameter highlights, and acoustic panic intimation.',
            icon: '🚨',
            color: '#EF4444',
            targetModule: 'clinical-investigation',
            targetSubTab: 'doctorReview',
            metricLabel: 'Critical Panic',
            metricValue: `${panicAlertCount} Panic Alerts`,
            metricBadge: '🚨 NABL Intimation',
            quickActions: [
              { label: 'Sign Reports', icon: '✅', targetModule: 'clinical-investigation', targetSubTab: 'doctorReview' },
              { label: 'Panic Center', icon: '🚨', targetModule: 'clinical-investigation', targetSubTab: 'critical' }
            ]
          },
          {
            id: 'lab-4',
            slotNumber: 4,
            title: 'Report Dispatch & Daily Lab Collection',
            tagline: '1-click WhatsApp automated report delivery, public QR verification, and lab billing collection tally.',
            icon: '📲',
            color: '#10B981',
            targetModule: 'clinical-investigation',
            targetSubTab: 'reports',
            metricLabel: 'Reports Ready',
            metricValue: '14 Dispatched',
            metricBadge: '💬 WhatsApp Sent',
            quickActions: [
              { label: 'Dispatch PDF', icon: '📄', targetModule: 'clinical-investigation', targetSubTab: 'reports' },
              { label: 'Lab Cashier', icon: '🧾', targetModule: 'clinical-investigation', targetSubTab: 'billing' }
            ]
          }
        ];

      default:
        // FRONT_DESK
        return [
          {
            id: 'fd-1',
            slotNumber: 1,
            title: 'Express OPD Registration & ABHA Scan',
            tagline: 'Scan Ayushman Bharat QR or mobile number for 15-second patient intake and digital token generation.',
            icon: '📇',
            color: '#0284C7',
            targetModule: 'patient-registration',
            metricLabel: 'Registered Today',
            metricValue: '48 Patients',
            metricBadge: '⚡ 15s Intake',
            quickActions: [
              { label: 'New Patient', icon: '➕', targetModule: 'patient-registration' },
              { label: 'ABHA Scan', icon: '🇮🇳', targetModule: 'abdm-fhir-gateway' }
            ]
          },
          {
            id: 'fd-2',
            slotNumber: 2,
            title: 'OPD Queue Dispatch & Token Caller',
            tagline: 'Live chamber queue management, doctor chamber assignment, and waiting room display feed.',
            icon: '⏱️',
            color: '#0EA5E9',
            targetModule: 'encounters-visits',
            metricLabel: 'Tokens In Queue',
            metricValue: `${queueCount} Waiting`,
            metricBadge: '● Live Stream',
            quickActions: [
              { label: 'Call Next', icon: '📢', targetModule: 'encounters-visits' },
              { label: 'Queue Display', icon: '📺', targetModule: 'encounters-visits' }
            ]
          },
          {
            id: 'fd-3',
            slotNumber: 3,
            title: 'Cashier & Instant UPI Fee Receipt',
            tagline: 'OPD consultation fee collection with instant Dynamic UPI QR code display and thermal receipt print.',
            icon: '⚡',
            color: '#10B981',
            targetModule: 'billing-revenue-cycle',
            metricLabel: 'Today Collected',
            metricValue: '₹28,600',
            metricBadge: '⚡ Instant UPI',
            quickActions: [
              { label: 'OPD Bill', icon: '🧾', targetModule: 'billing-revenue-cycle' },
              { label: 'Receipt Print', icon: '🖨️', targetModule: 'help-desk-exit-hub' }
            ]
          },
          {
            id: 'fd-4',
            slotNumber: 4,
            title: 'Doctor OPD Roster & Availability',
            tagline: 'Real-time doctor chamber schedules, leave status, consultation fee structure, and slot bookings.',
            icon: '📅',
            color: '#8B5CF6',
            targetModule: 'doctor-management',
            metricLabel: 'Doctors On Duty',
            metricValue: '12 Active Chambers',
            metricBadge: '✓ Chambers Armed',
            quickActions: [
              { label: 'Doctor Schedule', icon: '🕒', targetModule: 'doctor-management' },
              { label: 'Chamber Board', icon: '🚪', targetModule: 'doctor-management' }
            ]
          }
        ];
    }
  }, [resolvedRole, queueCount, bedOccupancyRate, panicAlertCount, pharmacyDueCount]);

  // Global Keyboard Accelerators for the 4 Killer Tools (Alt+1 to Alt+4 or numeric 1-4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.altKey || (!e.ctrlKey && !e.metaKey)) {
        if (e.key === '1' && killerTools[0]) {
          e.preventDefault();
          onNavigateModule(killerTools[0].targetModule, killerTools[0].targetSubTab);
        } else if (e.key === '2' && killerTools[1]) {
          e.preventDefault();
          onNavigateModule(killerTools[1].targetModule, killerTools[1].targetSubTab);
        } else if (e.key === '3' && killerTools[2]) {
          e.preventDefault();
          onNavigateModule(killerTools[2].targetModule, killerTools[2].targetSubTab);
        } else if (e.key === '4' && killerTools[3]) {
          e.preventDefault();
          onNavigateModule(killerTools[3].targetModule, killerTools[3].targetSubTab);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [killerTools, onNavigateModule]);

  const roleLabels: Record<RolePerspective, { label: string; icon: string; roleDesc: string }> = {
    AUTO: { label: 'Auto Detect', icon: '⚡', roleDesc: 'Auto-adapts to your staff account role' },
    DOCTOR: { label: 'Doctor Desk', icon: '🩺', roleDesc: 'Consultation EMR, Token Queue, Inpatient Rounds & Telehealth' },
    NURSE: { label: 'Nursing Station', icon: '👩‍⚕️', roleDesc: 'Acuity Triage, Bed Map, Rapid Vitals & MAR Medication Care' },
    PHARMACY: { label: 'Pharmacy POS', icon: '💊', roleDesc: 'Decimal Billing, Stock Inward, Expiry Radar & CDSCO H1' },
    LAB: { label: 'Pathology Lab', icon: '🧪', roleDesc: 'Phlebotomy, Analyzer Workbench, NABL Sign-off & Reports' },
    FRONT_DESK: { label: 'Front Desk', icon: '📇', roleDesc: '15s Intake, Token Dispatch, UPI Cashier & Doctor Rosters' },
    BILLING: { label: 'Cashier & Claims', icon: '💳', roleDesc: 'IPD/OPD Billing, TPA Claims & Instant UPI Settlement' },
    ADMIN: { label: 'Director Suite', icon: '🏛️', roleDesc: 'Hospital-Wide Telemetry, Revenue MIS & Compliance' }
  };

  return (
    <div
      style={{
        padding: '24px',
        maxWidth: '1520px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        fontFamily: 'inherit'
      }}
    >
      {/* 1. Header Banner & Persona Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '20px 24px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.12) 0%, rgba(14, 165, 233, 0.05) 50%, rgba(15, 23, 42, 0.6) 100%)',
          border: '1px solid var(--ds-color-border-subtle, rgba(56, 189, 248, 0.2))',
          boxShadow: 'var(--ds-shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              boxShadow: '0 4px 16px rgba(2, 132, 199, 0.35)'
            }}
          >
            {roleLabels[resolvedRole].icon}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: 'var(--ds-color-text-primary)' }}>
                {currentUser?.name ? `${currentUser.name}'s Smart Desk` : roleLabels[resolvedRole].label}
              </h1>
              <Badge variant="primary" style={{ fontSize: '0.7rem', padding: '2px 8px', fontWeight: 800 }}>
                ● 4 Killer Tools Active
              </Badge>
              <Badge variant="neutral" style={{ fontSize: '0.68rem', padding: '2px 8px', color: 'var(--ds-color-text-muted)' }}>
                38 Modules Condensed
              </Badge>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--ds-color-text-muted)' }}>
              {roleLabels[resolvedRole].roleDesc} • <strong style={{ color: 'var(--ds-color-text-primary)' }}>{facilityName}</strong>
            </p>
          </div>
        </div>

        {/* Persona Switcher Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {(['DOCTOR', 'NURSE', 'PHARMACY', 'LAB', 'FRONT_DESK'] as RolePerspective[]).map((rKey) => {
            const isSelected = resolvedRole === rKey;
            const rInfo = roleLabels[rKey];
            return (
              <button
                key={rKey}
                type="button"
                onClick={() => onChangeRole(rKey)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  border: isSelected ? '1.5px solid #38BDF8' : '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.08))',
                  backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.18)' : 'var(--ds-color-surface, rgba(255, 255, 255, 0.03))',
                  color: isSelected ? 'var(--ds-color-text-primary, #ffffff)' : 'var(--ds-color-text-muted, #94a3b8)',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 0 12px rgba(56, 189, 248, 0.25)' : 'none'
                }}
              >
                <span>{rInfo.icon}</span>
                <span>{rInfo.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Keyboard Accelerators Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          borderRadius: '10px',
          backgroundColor: 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.02))',
          border: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.05))',
          fontSize: '0.75rem',
          color: 'var(--ds-color-text-muted)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⌨️</span>
          <span>
            <strong>Pro Tip:</strong> Press <kbd style={{ padding: '1px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', fontWeight: 800 }}>1</kbd>, <kbd style={{ padding: '1px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', fontWeight: 800 }}>2</kbd>, <kbd style={{ padding: '1px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', fontWeight: 800 }}>3</kbd>, or <kbd style={{ padding: '1px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', fontWeight: 800 }}>4</kbd> on your keyboard to instantly launch any tool below.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Search All:</span>
          <kbd style={{ padding: '1px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38BDF8', fontWeight: 800 }}>Ctrl + K</kbd>
        </div>
      </div>

      {/* 3. The 4 Killer Tools Bento Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px'
        }}
      >
        {killerTools.map((tool) => (
          <Card
            key={tool.id}
            style={{
              padding: '24px',
              borderRadius: '16px',
              backgroundColor: 'var(--ds-color-surface)',
              border: `1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '18px',
              boxShadow: 'var(--ds-shadow-sm)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}
          >
            {/* Top Accent Stripe */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: `linear-gradient(90deg, ${tool.color}, transparent)`
              }}
            />

            {/* Header: Icon, Slot #, Title, Tagline */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: `${tool.color}18`,
                      border: `1px solid ${tool.color}35`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.3rem'
                    }}
                  >
                    {tool.icon}
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: tool.color,
                        letterSpacing: '0.05em'
                      }}
                    >
                      Killer Tool #{tool.slotNumber}
                    </span>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
                      {tool.title}
                    </h3>
                  </div>
                </div>

                <kbd
                  style={{
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.06))',
                    border: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.1))',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: 'var(--ds-color-text-muted)'
                  }}
                  title={`Press ${tool.slotNumber} or Alt+${tool.slotNumber}`}
                >
                  Alt+{tool.slotNumber}
                </kbd>
              </div>

              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--ds-color-text-muted)', lineHeight: 1.45 }}>
                {tool.tagline}
              </p>
            </div>

            {/* Telemetry Metric Pill */}
            <div
              style={{
                backgroundColor: 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.03))',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.05))'
              }}
            >
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase', display: 'block' }}>
                  {tool.metricLabel}
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--ds-color-text-primary)' }}>
                  {tool.metricValue}
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: `${tool.color}15`,
                  color: tool.color,
                  border: `1px solid ${tool.color}30`
                }}
              >
                {tool.metricBadge}
              </span>
            </div>

            {/* Quick Actions & Launch Button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tool.quickActions && tool.quickActions.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {tool.quickActions.map((qa, qIdx) => (
                    <button
                      key={qIdx}
                      type="button"
                      onClick={() => onNavigateModule(qa.targetModule, qa.targetSubTab)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.08))',
                        color: 'var(--ds-color-text-muted)',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.12s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = tool.color;
                        e.currentTarget.style.borderColor = `${tool.color}60`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--ds-color-text-muted)';
                        e.currentTarget.style.borderColor = 'var(--ds-color-border-subtle, rgba(255, 255, 255, 0.08))';
                      }}
                    >
                      <span>{qa.icon}</span>
                      <span>{qa.label}</span>
                    </button>
                  ))}
                </div>
              )}

              <Button
                variant="primary"
                onClick={() => onNavigateModule(tool.targetModule, tool.targetSubTab)}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: tool.color,
                  borderColor: tool.color,
                  boxShadow: `0 4px 14px ${tool.color}35`
                }}
              >
                <span>Launch {tool.title.split('&')[0]?.trim()}</span>
                <span>➔</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* 4. Docked Full Hospital ERP Bar (Access to the other 34 modules) */}
      <div
        style={{
          marginTop: '8px',
          padding: '16px 20px',
          borderRadius: '14px',
          backgroundColor: 'var(--ds-color-surface)',
          border: '1px dashed var(--ds-color-border, rgba(56, 189, 248, 0.3))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: 'var(--ds-shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              color: '#38BDF8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem'
            }}
          >
            📁
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
                Need Any Other Hospital Module?
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                34 Remaining Modules
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--ds-color-text-muted)' }}>
              100% of hospital ERP tools remain instantly accessible without cluttering your daily Smart Desk.
            </p>
          </div>
        </div>

        {/* Quick Shortcut Tags & Full Drawer Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { label: '🚑 Emergency', mod: 'emergency-trauma' as PartnerModuleKey },
            { label: '🩸 Blood Bank', mod: 'blood-bank-transfusion' as PartnerModuleKey },
            { label: '🔪 OT', mod: 'operation-theatre-management' as PartnerModuleKey },
            { label: '📋 MRD', mod: 'medical-records' as PartnerModuleKey },
            { label: '⚙️ BioMed', mod: 'asset-biomedical-maintenance' as PartnerModuleKey },
            { label: '💳 TPA Claims', mod: 'insurance-claims' as PartnerModuleKey }
          ].map((sc, scIdx) => (
            <button
              key={scIdx}
              type="button"
              onClick={() => onNavigateModule(sc.mod)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.04))',
                border: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.08))',
                color: 'var(--ds-color-text-muted)',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.12s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#38BDF8';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--ds-color-text-muted)';
                e.currentTarget.style.borderColor = 'var(--ds-color-border-subtle, rgba(255, 255, 255, 0.08))';
              }}
            >
              {sc.label}
            </button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAllModulesDrawer}
            style={{
              borderColor: '#38BDF8',
              color: '#38BDF8',
              fontWeight: 800,
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📁 Browse All 38 Modules</span>
            <span>➔</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
