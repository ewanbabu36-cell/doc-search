import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { HospitalStaffUser } from '../auth/HospitalStaffLogin.js';
import type { PartnerModuleKey } from '../PartnerPlatformShell.js';
import { isPartnerModuleAllowed } from '../../utils/partnerRolePermissions.js';

export interface StaffOperationalRoleDashboardProps {
  currentUser?: HospitalStaffUser | undefined;
  onNavigateModule: (moduleKey: PartnerModuleKey, subTab?: string) => void;
  tenantId?: string | undefined;
  facilityName?: string | undefined;
}

type StaffArchetype =
  | 'FRONT_DESK'
  | 'NURSE'
  | 'DOCTOR'
  | 'PHARMACIST'
  | 'PATHOLOGIST_LAB_TECH'
  | 'RADIOLOGIST_TECH'
  | 'CASHIER_BILLING'
  | 'ADMINISTRATOR';

interface FlowStage {
  id: string;
  stageNumber: number;
  label: string;
  subtitle: string;
  icon: string;
  targetModule: PartnerModuleKey;
  targetSubTab?: string;
  archetype: StaffArchetype;
  color: string;
}

const FLOW_STAGES: FlowStage[] = [
  {
    id: 'stage-1',
    stageNumber: 1,
    label: 'Token & Registration',
    subtitle: 'Intake, Demographics & Fee',
    icon: '📇',
    targetModule: 'patient-registration',
    archetype: 'FRONT_DESK',
    color: '#0284c7'
  },
  {
    id: 'stage-2',
    stageNumber: 2,
    label: 'Vitals & Triage',
    subtitle: 'BP, Pulse, SpO2 & Chamber Escort',
    icon: '👩‍⚕️',
    targetModule: 'nurse-triage-station',
    archetype: 'NURSE',
    color: '#ec4899'
  },
  {
    id: 'stage-3',
    stageNumber: 3,
    label: 'Doctor Consultation',
    subtitle: 'Diagnosis, EMR & e-Prescription',
    icon: '🩺',
    targetModule: 'clinical-consultation',
    archetype: 'DOCTOR',
    color: '#10b981'
  },
  {
    id: 'stage-4',
    stageNumber: 4,
    label: 'Diagnostic Tests',
    subtitle: 'Pathology & Radiology Reports',
    icon: '🧪',
    targetModule: 'clinical-investigation',
    archetype: 'PATHOLOGIST_LAB_TECH',
    color: '#8b5cf6'
  },
  {
    id: 'stage-5',
    stageNumber: 5,
    label: 'Pharmacy & Billing',
    subtitle: 'Drug Dispensing & Counter Tally',
    icon: '💊',
    targetModule: 'pharmacy-medication',
    targetSubTab: 'pos',
    archetype: 'PHARMACIST',
    color: '#0d9488'
  }
];

function resolveStaffArchetype(role?: string, staffType?: string): StaffArchetype {
  const r = (role || '').toUpperCase();
  const st = (staffType || '').toUpperCase();

  if (r.includes('DOCTOR') || r.includes('PHYSICIAN') || r.includes('SURGEON') || st === 'DOCTOR') {
    if (r.includes('RADIOLOGIST')) return 'RADIOLOGIST_TECH';
    if (r.includes('PATHOLOGIST')) return 'PATHOLOGIST_LAB_TECH';
    return 'DOCTOR';
  }
  if (r.includes('NURSE') || st === 'NURSE') {
    return 'NURSE';
  }
  if (r.includes('PHARMAC') || r.includes('CHEMIST') || r.includes('DISPENSER') || st === 'PHARMACIST') {
    return 'PHARMACIST';
  }
  if (r.includes('LAB') || r.includes('PHLEBOTOM') || r.includes('PATHOL') || st === 'LAB_TECHNICIAN') {
    return 'PATHOLOGIST_LAB_TECH';
  }
  if (r.includes('RADIO') || r.includes('IMAGING') || r.includes('XRAY') || r.includes('CT_') || r.includes('MRI')) {
    return 'RADIOLOGIST_TECH';
  }
  if (r.includes('CASHIER') || r.includes('BILLING') || r.includes('ACCOUNT') || st === 'BILLING_OFFICER') {
    return 'CASHIER_BILLING';
  }
  if (r.includes('RECEPTION') || r.includes('FRONT_DESK') || r.includes('TOKEN') || st === 'RECEPTIONIST') {
    return 'FRONT_DESK';
  }
  return 'ADMINISTRATOR';
}

export const StaffOperationalRoleDashboard: React.FC<StaffOperationalRoleDashboardProps> = ({
  currentUser,
  onNavigateModule,
  facilityName
}) => {
  const archetype = resolveStaffArchetype(currentUser?.role, (currentUser as any)?.staffType);
  const perms = currentUser?.permissions;

  // Active Station mapping
  const activeStageIndex = (() => {
    switch (archetype) {
      case 'FRONT_DESK': return 0;
      case 'NURSE': return 1;
      case 'DOCTOR': return 2;
      case 'PATHOLOGIST_LAB_TECH':
      case 'RADIOLOGIST_TECH': return 3;
      case 'PHARMACIST':
      case 'CASHIER_BILLING': return 4;
      default: return -1;
    }
  })();

  const renderQuickActions = () => {
    switch (archetype) {
      case 'FRONT_DESK':
        return [
          {
            title: '📇 OPD Token & Intake',
            desc: 'Register new patient, issue token, and queue for nurse triage.',
            module: 'patient-registration' as PartnerModuleKey,
            color: '#0284c7',
            btnText: 'Open Token Desk'
          },
          {
            title: '⚡ Collect Consultation Fee',
            desc: 'Accept cash, UPI QR, or card payment for OPD consultation.',
            module: 'billing-revenue-cycle' as PartnerModuleKey,
            color: '#0284c7',
            btnText: 'Open Cashier'
          },
          {
            title: '⏱️ OPD Queue Dispatch',
            desc: 'View doctor chambers, patient queue, and call tokens.',
            module: 'encounters-visits' as PartnerModuleKey,
            color: '#0284c7',
            btnText: 'View Queue'
          },
          {
            title: '🇮🇳 ABDM ABHA Verification',
            desc: 'Scan Ayushman Bharat QR and create ABHA address.',
            module: 'abdm-fhir-gateway' as PartnerModuleKey,
            color: '#0284c7',
            btnText: 'ABDM Scan'
          }
        ];
      case 'NURSE':
        return [
          {
            title: '🩺 Record Vitals & Triage',
            desc: 'Log Blood Pressure, Pulse, SpO2, Temperature & Weight.',
            module: 'nurse-triage-station' as PartnerModuleKey,
            color: '#ec4899',
            btnText: 'Open Triage'
          },
          {
            title: '🚪 Chamber Escort Queue',
            desc: 'Call next prepared patient and direct them into doctor chamber.',
            module: 'encounters-visits' as PartnerModuleKey,
            color: '#ec4899',
            btnText: 'Chamber Escort'
          },
          {
            title: '🛏️ Inpatient Ward Care',
            desc: 'Nurse medication administration, IV fluids, and nursing notes.',
            module: 'inpatient-management' as PartnerModuleKey,
            color: '#ec4899',
            btnText: 'Ward Nursing'
          },
          {
            title: '🚨 Emergency Triage Bay',
            desc: 'Red / Yellow / Green trauma prioritization and rapid intake.',
            module: 'emergency-trauma' as PartnerModuleKey,
            color: '#ec4899',
            btnText: 'Trauma Bay'
          }
        ];
      case 'DOCTOR':
        return [
          {
            title: '🩺 Doctor OPD Desk & EMR',
            desc: 'Review patient history, vitals, symptoms, diagnosis, and issue digital prescriptions.',
            module: 'clinical-consultation' as PartnerModuleKey,
            color: '#10b981',
            btnText: 'Open Consultation'
          },
          {
            title: '🛏️ Inpatient Ward Rounds',
            desc: 'Daily bedside progress notes, vitals monitoring, and discharge summaries.',
            module: 'inpatient-management' as PartnerModuleKey,
            subTab: 'rounds',
            color: '#10b981',
            btnText: 'IPD Ward Rounds'
          },
          {
            title: '🔬 Order Lab & Radiology',
            desc: 'Order blood tests, imaging scans, and view past diagnostic history.',
            module: 'clinical-investigation' as PartnerModuleKey,
            color: '#10b981',
            btnText: 'Order Tests'
          },
          {
            title: '🎙️ AI Voice Clinical Scribe',
            desc: 'Auto-generate structured clinical notes from doctor-patient conversation.',
            module: 'ai-clinical-cdss' as PartnerModuleKey,
            color: '#10b981',
            btnText: 'AI Scribe'
          }
        ];
      case 'PHARMACIST':
        return [
          {
            title: '📋 Incoming e-Rx Queue',
            desc: 'Review doctor prescriptions, verify dosage, and prepare medicines.',
            module: 'pharmacy-medication' as PartnerModuleKey,
            subTab: 'prescriptions',
            color: '#0d9488',
            btnText: 'Open Rx Queue'
          },
          {
            title: '🛒 Pharmacy POS Counter',
            desc: 'Fast barcode scan checkout, batch/expiry print, and cash/UPI billing.',
            module: 'pharmacy-medication' as PartnerModuleKey,
            subTab: 'pos',
            color: '#0d9488',
            btnText: 'Open POS'
          },
          {
            title: '💊 Schedule H / Narcotics Vault',
            desc: 'Controlled drug dispensing verification with licensee sign-off.',
            module: 'pharmacy-medication' as PartnerModuleKey,
            subTab: 'narcotics',
            color: '#0d9488',
            btnText: 'Narcotics Register'
          },
          {
            title: '📦 Stock Expiry & Reorder',
            desc: 'Inspect near-expiry medicines, low stock alerts, and distributor replenishment.',
            module: 'pharmacy-medication' as PartnerModuleKey,
            subTab: 'expiry',
            color: '#0d9488',
            btnText: 'Stock Alerts'
          }
        ];
      case 'PATHOLOGIST_LAB_TECH':
        return [
          {
            title: '🩸 Phlebotomy & Sample Triage',
            desc: 'Collect blood/urine samples, print barcodes, and assign accession IDs.',
            module: 'clinical-investigation' as PartnerModuleKey,
            subTab: 'specimens',
            color: '#8b5cf6',
            btnText: 'Sample Collection'
          },
          {
            title: '🧪 Analyzer Workbench',
            desc: 'Input test parameters, run QC calibration, and review values.',
            module: 'clinical-investigation' as PartnerModuleKey,
            subTab: 'processing',
            color: '#8b5cf6',
            btnText: 'Enter Values'
          },
          {
            title: '✍️ NABL Digital Report Sign-off',
            desc: 'Review abnormal values and digitally sign final diagnostic reports.',
            module: 'clinical-investigation' as PartnerModuleKey,
            subTab: 'results',
            color: '#8b5cf6',
            btnText: 'Verify & Sign'
          },
          {
            title: '📲 WhatsApp Report Delivery',
            desc: 'Dispatch PDF lab reports directly to patient mobile on WhatsApp.',
            module: 'clinical-investigation' as PartnerModuleKey,
            subTab: 'reports',
            color: '#8b5cf6',
            btnText: 'Dispatch Reports'
          }
        ];
      case 'RADIOLOGIST_TECH':
        return [
          {
            title: '🩻 Modality Scan Queue',
            desc: 'Scheduled CT, MRI, Digital X-Ray & Ultrasound patient worklist.',
            module: 'radiology-imaging' as PartnerModuleKey,
            subTab: 'tech-worklist',
            color: '#f59e0b',
            btnText: 'Modality Queue'
          },
          {
            title: '🖥️ PACS DICOM Viewer',
            desc: 'Review high-resolution multi-slice radiological imaging studies.',
            module: 'radiology-imaging' as PartnerModuleKey,
            subTab: 'ai-chest-xray',
            color: '#f59e0b',
            btnText: 'Open PACS'
          },
          {
            title: '✍️ Sign Radiology Report',
            desc: 'AERB compliant clinical imaging impressions and digital sign-off.',
            module: 'radiology-imaging' as PartnerModuleKey,
            subTab: 'radiologist-workbench',
            color: '#f59e0b',
            btnText: 'Sign Scan Report'
          },
          {
            title: '⏱️ Modality Scheduling',
            desc: 'Manage slot bookings, contrast prep, and fasting instructions.',
            module: 'radiology-imaging' as PartnerModuleKey,
            subTab: 'scheduling',
            color: '#f59e0b',
            btnText: 'Book Slots'
          }
        ];
      case 'CASHIER_BILLING':
        return [
          {
            title: '⚡ Instant Bill Settlement',
            desc: 'Settle OPD/IPD invoices with cash, Dynamic UPI QR, or cards.',
            module: 'billing-revenue-cycle' as PartnerModuleKey,
            subTab: 'instant-settlement',
            color: '#2563eb',
            btnText: 'Settle Bill'
          },
          {
            title: '💵 Daily Counter Cash Ledger',
            desc: 'Real-time tally of cash drawer, digital payments, and receipts.',
            module: 'billing-revenue-cycle' as PartnerModuleKey,
            subTab: 'cash-ledger',
            color: '#2563eb',
            btnText: 'Cash Ledger'
          },
          {
            title: '📑 TPA / Insurance Claims Desk',
            desc: 'Cashless pre-auth requests, claim approvals, and TPA settlements.',
            module: 'billing-revenue-cycle' as PartnerModuleKey,
            subTab: 'claims-desk',
            color: '#2563eb',
            btnText: 'Insurance Desk'
          },
          {
            title: '🔄 Shift Handover Sign-off',
            desc: 'Mandatory reconciliation of counter cash before shift logout.',
            module: 'billing-revenue-cycle' as PartnerModuleKey,
            subTab: 'shift-handover',
            color: '#2563eb',
            btnText: 'Shift Sign-off'
          }
        ];
      default:
        return [
          {
            title: '👥 Staff Directory & RBAC',
            desc: 'Onboard personnel, adjust 4-tier security templates, and revoke access.',
            module: 'staff-administration' as PartnerModuleKey,
            subTab: 'directory',
            color: '#6366f1',
            btnText: 'Staff Administration'
          },
          {
            title: '👨‍⚕️ Doctor Duty Roster',
            desc: 'Manage OPD consultation chambers, slot schedules, and leaves.',
            module: 'doctor-management' as PartnerModuleKey,
            subTab: 'roster',
            color: '#6366f1',
            btnText: 'Doctor Roster'
          },
          {
            title: '📊 Executive Command Center',
            desc: 'Live facility telemetry, revenue velocity, bed occupancy, and KPIs.',
            module: 'executive-command-center' as PartnerModuleKey,
            color: '#6366f1',
            btnText: 'Executive Hub'
          },
          {
            title: '🏛️ Facility Governance',
            desc: 'Departments, branches, and ABDM Ayushman Bharat registry sync.',
            module: 'organization-foundation' as PartnerModuleKey,
            subTab: 'departments',
            color: '#6366f1',
            btnText: 'Facility Master'
          }
        ];
    }
  };

  const quickActions = renderQuickActions();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '16px',
        maxWidth: '1600px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* 1. STAFF HEADER & ACTIVE SHIFT STATUS */}
      <Card
        style={{
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid rgba(14, 165, 233, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          {/* Staff Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                flexShrink: 0
              }}
            >
              {archetype === 'DOCTOR' ? '🩺' : archetype === 'NURSE' ? '👩‍⚕️' : archetype === 'PHARMACIST' ? '💊' : archetype === 'PATHOLOGIST_LAB_TECH' ? '🔬' : archetype === 'RADIOLOGIST_TECH' ? '☢️' : archetype === 'CASHIER_BILLING' ? '⚡' : archetype === 'FRONT_DESK' ? '📇' : '🏛️'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary, #f8fafc)' }}>
                  {currentUser?.name || 'Healthcare Personnel'}
                </h1>
                <Badge variant="primary">
                  {currentUser?.roleTitle || currentUser?.role || 'Staff Role'}
                </Badge>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(34, 197, 94, 0.15)',
                    color: '#22c55e',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    fontWeight: 700
                  }}
                >
                  ● Active Shift
                </span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted, #94a3b8)', marginTop: '4px' }}>
                {currentUser?.department || 'Clinical Services'} • {facilityName || currentUser?.tenantName || 'Main Facility'}
              </div>
            </div>
          </div>

          {/* 4-Tier Security & Control Badges */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              alignItems: 'center'
            }}
          >
            {/* Tier 1 */}
            {perms?.canViewFullPhoneNumber ? (
              <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8', border: '1px solid rgba(2, 132, 199, 0.3)' }} title="Tier 1: Full Patient Mobile Number Unmasked">
                👁️ Full Contact
              </span>
            ) : (
              <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }} title="Tier 1: Patient Mobile Number Masked for Anti-Theft">
                🔒 Phone Masked
              </span>
            )}

            {perms?.canExportPatientData ? (
              <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }} title="Tier 1: Patient Data Export Allowed">
                ⚠️ Export Allowed
              </span>
            ) : (
              <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }} title="Tier 1: Patient Export Blocked (Anti-Theft)">
                🛡️ Export Blocked
              </span>
            )}

            {/* Tier 2 */}
            {perms?.canGiveDiscounts && (
              <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8', border: '1px solid rgba(2, 132, 199, 0.3)' }} title={`Tier 2: Max Discount Capped at ${perms.maxDiscountPercent}%`}>
                💰 Disc: {perms.maxDiscountPercent}%
              </span>
            )}

            {/* Tier 3 */}
            {perms?.canSignPrescriptions && (
              <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }} title="Tier 3: Clinical e-Prescription Signatory">
                🩺 Rx Signatory
              </span>
            )}
            {perms?.canSignLabReports && (
              <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }} title="Tier 3: NABL / AERB Diagnostic Signatory">
                ✍️ NABL/AERB Sign
              </span>
            )}
            {perms?.canDispenseRestrictedDrugs && (
              <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }} title="Tier 3: Schedule H & Narcotics Dispensing Authority">
                💊 Narcotics Disp
              </span>
            )}
            {perms?.canAccessAfterHours && (
              <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }} title="Tier 3: 24/7 Emergency Remote & After-Hours Access">
                🚨 24/7 Access
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* 2. REAL-WORLD 5-STAGE OPERATIONAL PATIENT FLOW TRACK (MOBILE FRIENDLY & TOUCH SWIPE) */}
      <Card
        style={{
          padding: '18px 20px',
          borderRadius: '16px',
          backgroundColor: 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.02))',
          border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.1))'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ds-color-text-primary, #f8fafc)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🔄</span>
              <span>Real-World Clinical & Operational Follow-Up Track</span>
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #94a3b8)' }}>
              End-to-end patient movement from reception arrival to medicine dispensing. Tap your active station to jump to workflow.
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-primary, #38bdf8)', fontWeight: 600 }}>
            👉 Swipe horizontally on mobile
          </span>
        </div>

        {/* Scrollable Pipeline Track */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            paddingBottom: '8px',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin'
          }}
        >
          {FLOW_STAGES.map((stage, idx) => {
            const isMyStation = idx === activeStageIndex;
            const isAllowed = isPartnerModuleAllowed(stage.targetModule, currentUser?.role, perms);

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => {
                  if (isAllowed) {
                    onNavigateModule(stage.targetModule, stage.targetSubTab);
                  }
                }}
                disabled={!isAllowed}
                style={{
                  flex: '0 0 220px',
                  minWidth: '220px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '14px',
                  borderRadius: '12px',
                  border: isMyStation
                    ? `2px solid ${stage.color}`
                    : isAllowed
                    ? '1px solid rgba(255, 255, 255, 0.12)'
                    : '1px dashed rgba(255, 255, 255, 0.05)',
                  backgroundColor: isMyStation
                    ? `${stage.color}15`
                    : isAllowed
                    ? 'rgba(0, 0, 0, 0.2)'
                    : 'rgba(0, 0, 0, 0.08)',
                  cursor: isAllowed ? 'pointer' : 'not-allowed',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  boxShadow: isMyStation ? `0 0 16px ${stage.color}30` : 'none',
                  opacity: isAllowed ? 1 : 0.45
                }}
              >
                {/* Station Tag */}
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      color: stage.color,
                      letterSpacing: '0.5px'
                    }}
                  >
                    STEP {stage.stageNumber}
                  </span>
                  {isMyStation ? (
                    <span
                      style={{
                        fontSize: '0.625rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: stage.color,
                        color: '#ffffff',
                        fontWeight: 800
                      }}
                    >
                      📍 YOUR STATION
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.625rem', color: 'var(--ds-color-text-muted)' }}>
                      {isAllowed ? 'Accessible' : 'Restricted'}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '1.2rem' }}>{stage.icon}</span>
                  <strong style={{ fontSize: '0.875rem', color: isMyStation ? stage.color : 'var(--ds-color-text-primary, #f8fafc)' }}>
                    {stage.label}
                  </strong>
                </div>

                <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted, #94a3b8)', lineHeight: 1.3 }}>
                  {stage.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 3. DYNAMIC TOUCH-FRIENDLY ROLE QUICK ACTIONS (GRID ADAPTS TO MOBILE) */}
      <div>
        <div style={{ marginBottom: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ds-color-text-primary, #f8fafc)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⚡</span>
            <span>Role Operational Workstations & Quick Actions</span>
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #94a3b8)' }}>
            Direct 1-touch actions tailored strictly to your duties and authorized permission tiers.
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '14px'
          }}
        >
          {quickActions.map((action, idx) => {
            const isAllowed = isPartnerModuleAllowed(action.module, currentUser?.role, perms);

            return (
              <Card
                key={idx}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  backgroundColor: 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.03))',
                  border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.1))',
                  opacity: isAllowed ? 1 : 0.45
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9375rem', fontWeight: 700, color: action.color }}>
                    {action.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--ds-color-text-secondary, #cbd5e1)', lineHeight: 1.4 }}>
                    {action.desc}
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (isAllowed) {
                      onNavigateModule(action.module, (action as any).subTab);
                    }
                  }}
                  disabled={!isAllowed}
                  style={{
                    minHeight: '44px',
                    width: '100%',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    backgroundColor: isAllowed ? action.color : 'rgba(255,255,255,0.1)',
                    borderColor: action.color
                  }}
                >
                  {isAllowed ? `${action.btnText} ➔` : '🔒 Module Restricted'}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
