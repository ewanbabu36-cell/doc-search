import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Input
} from '@docsearch/ui-kit';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';
import type { PartnerModuleKey } from '../PartnerPlatformShell.js';

export type HospitalLoopMode = 'OPD' | 'IPD' | 'FIVE_CLOSED_LOOP_ENGINES' | 'AUDIT_MATRIX' | 'PHASED_ROLLOUT';

export interface AuditMatrixRow {
  department: string;
  icon: string;
  currentBaseline: string;
  goldStandard: string;
  dynamicSolution: string;
  impactBadge: string;
}

export const hospitalAuditMatrixData: AuditMatrixRow[] = [
  {
    department: 'OPD Queue',
    icon: '🩺',
    currentBaseline: 'FIFO list, basic priority tags, audio call',
    goldStandard: 'Vitals-driven dynamic re-ranking & live waiting ETA',
    dynamicSolution: 'NEWS2 score > 5 par emergency position 1 promotion; moving average consultation time ETA engine',
    impactBadge: 'Zero Waiting Chaos'
  },
  {
    department: 'Pathology LIMS',
    icon: '🧪',
    currentBaseline: 'Manual value entry, basic panic alert',
    goldStandard: 'ASTM/HL7 analyzer auto-sync, phone readback audit',
    dynamicSolution: 'Direct bi-directional serial bridge; 15-min countdown timer with Medical Superintendent escalation',
    impactBadge: 'Zero Transcription Error'
  },
  {
    department: 'IPD Nursing',
    icon: '🛏️',
    currentBaseline: 'e-MAR, 5-Rights scanner, I/O chart',
    goldStandard: 'Closed-loop pharmacy delivery tracking, dynamic sepsis alarm',
    dynamicSolution: 'Dispense-to-MAR state tracking; automated deterioration alert push to On-Duty Medical Officer',
    impactBadge: 'Bedside Safety SLA'
  },
  {
    department: 'Emergency / Trauma',
    icon: '🚑',
    currentBaseline: '5-level triage, crash cart checklist',
    goldStandard: 'Pre-hospital ambulance telemetry, instant police MLC',
    dynamicSolution: 'Inbound 12-lead ECG monitor bridge; auto-replenish crash cart order on unseal trigger',
    impactBadge: 'Golden Hour Rescue'
  },
  {
    department: 'Operation Theatre',
    icon: '🔪',
    currentBaseline: 'WHO checklist, PAC clearance gateway',
    goldStandard: 'CSSD autoclave barcode link, dynamic slot overrun engine',
    dynamicSolution: 'Autoclave biological indicator pass verification gate; NPO fasting countdown hard lockout',
    impactBadge: 'Zero Surgical SSI'
  },
  {
    department: 'Central Pharmacy',
    icon: '💊',
    currentBaseline: 'Schedule H1 register, CDSCO vault, FEFO',
    goldStandard: 'OCR wholesale invoice GRN, dynamic velocity reordering',
    dynamicSolution: 'Moving velocity consumption forecasting; automated discharge unused ward medication return',
    impactBadge: 'Zero Stock-Out & Pilferage'
  },
  {
    department: 'Blood Bank',
    icon: '🩸',
    currentBaseline: 'Component inventory, cross-match tags',
    goldStandard: 'Bedside 2-step barcode verification, cold-chain alert',
    dynamicSolution: 'Mismatch audio alarm lockout; 48-hr platelet expiry waterfall reallocation alert',
    impactBadge: 'Zero ABO Incompatibility'
  },
  {
    department: 'Radiology (RIS)',
    icon: '🩻',
    currentBaseline: 'Manual report upload, order desk',
    goldStandard: 'Embedded zero-footprint web DICOM viewer, trauma SLA',
    dynamicSolution: 'Modality Worklist (MWL) auto-binding; trauma scans 30-minute priority reporting queue',
    impactBadge: '< 30m STAT Head Turnaround'
  },
  {
    department: 'Biomedical Assets',
    icon: '📟',
    currentBaseline: 'Asset inventory list, breakdown status',
    goldStandard: 'Machine QR code incident logging, PPM expiry lockout',
    dynamicSolution: 'QR-scan breakdown ticketing with MTTR SLA; overdue calibration equipment quarantine lock',
    impactBadge: '99.8% Critical Uptime'
  },
  {
    department: 'Infection Control',
    icon: '🛡️',
    currentBaseline: 'Manual incident forms, infection logs',
    goldStandard: 'Automated device-day HAI trigger, barcoded BMW audit',
    dynamicSolution: 'Catheter/Ventilator-day surveillance engine; digital weighing scale manifest reconciliation',
    impactBadge: 'Zero HAI & Pollution Penalties'
  },
  {
    department: 'TPA / Cashless',
    icon: '📑',
    currentBaseline: 'Pre-auth bundles, PMJAY card check',
    goldStandard: 'Real-time pre-auth utilization meter, co-pay estimator',
    dynamicSolution: '80% limit reach par automated enhancement bundle draft; transparent out-of-pocket breakdown',
    impactBadge: 'Zero Discharge Bill Dispute'
  },
  {
    department: 'Revenue / Galla',
    icon: '💰',
    currentBaseline: 'Standard invoices, manual shift cash tally',
    goldStandard: 'Clinical action auto-posting, blind cash reconciliation',
    dynamicSolution: 'Zero-manual-entry clinical event billing hooks; dual-blind count cashier closure with manager override',
    impactBadge: 'Zero Cash Discrepancy'
  },
  {
    department: 'Executive Telemetry',
    icon: '📈',
    currentBaseline: 'Retrospective summary charts',
    goldStandard: 'Live real-time hospital heartbeat & predictive bed availability',
    dynamicSolution: 'Real-time WebSocket occupancy heatmap; machine-learning predicted bed discharge velocity',
    impactBadge: 'Sub-Second Situational Awareness'
  }
];

export interface RolloutDeliverable {
  title: string;
  detail: string;
  done: boolean;
}

export interface RolloutPhase {
  phaseKey: string;
  name: string;
  timeline: string;
  icon: string;
  focus: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED';
  deliverables: RolloutDeliverable[];
  keyPerformanceMetric: string;
  riskMitigation: string;
}

export const hospitalRolloutPhases: RolloutPhase[] = [
  {
    phaseKey: 'PHASE_A',
    name: 'Phase A: Core Clinical Foundation & Queue De-escalation',
    timeline: 'Day 1 - 7',
    icon: '🩺',
    focus: 'OPD Cockpit, Audio Tokens, Triage NEWS2 Auto-Reranking & Pharmacy FEFO Registers',
    status: 'COMPLETED',
    deliverables: [
      { title: 'OPD Cockpit Audio Token Calling & Chamber Traffic Lights', detail: 'Automated bilingual token voice announcements with red/green chamber indicator lights.', done: true },
      { title: 'Turbo Keyboard Shortcuts for Clinicians', detail: 'Rapid diagnosis search, standard dosage presets, and sub-second prescription generation.', done: true },
      { title: 'Reception Vitals Triage & Automatic Queue Promotion', detail: 'NEWS2 > 5 cases immediately elevated to Position #1 in doctor consultation queue.', done: true },
      { title: 'In-House Pharmacy FEFO & Schedule H1 Registers', detail: 'First-Expiry-First-Out batch selection and CDSCO-compliant habit-forming drug audit vault.', done: true }
    ],
    keyPerformanceMetric: 'Average OPD waiting time reduced from 75m to < 22m; zero unmonitored critical patients.',
    riskMitigation: 'Reception staff dual-screen training with pre-printed barcode stickers to avoid rush-hour bottlenecks.'
  },
  {
    phaseKey: 'PHASE_B',
    name: 'Phase B: Inpatient Safety & Closed-Loop Administration',
    timeline: 'Day 8 - 21',
    icon: '🛏️',
    focus: 'Ward Bedside 5-Rights e-MAR, Fluid I/O Balance, SBAR Shift Handover & LIMS Analyzer Sync',
    status: 'COMPLETED',
    deliverables: [
      { title: 'Ward Bedside 5-Rights Wristband Barcode Scanner & e-MAR', detail: 'Patient wristband scan + drug vial scan mandatory before injection administration.', done: true },
      { title: 'Fluid Intake/Output Dynamic Balance Charting', detail: 'Real-time cumulative fluid deficit/overload calculation with acute oliguria alert (< 0.5 mL/kg/h).', done: true },
      { title: 'SBAR Structured Nursing Shift Handover Protocol', detail: 'Situation, Background, Assessment, Recommendation digitized transfer with biometric sign-off.', done: true },
      { title: 'LIMS Bi-Directional Analyzer Bridge & 15-Min Panic Readback', detail: 'Direct ASTM/HL7 serial sync from Sysmex/Roche analyzers with mandatory phone readback timer.', done: true }
    ],
    keyPerformanceMetric: 'Zero bedside medication administration errors; Sepsis door-to-antimicrobial time < 55 mins.',
    riskMitigation: 'Bedside Android barcode scanners equipped with offline fallback cache during Wi-Fi packet drops.'
  },
  {
    phaseKey: 'PHASE_C',
    name: 'Phase C: Surgical, Emergency & Regulatory Hard-Gates',
    timeline: 'Day 22 - 35',
    icon: '🔪',
    focus: 'Casualty ESI Triage, Crash Cart Telemetry, OT CSSD Autoclave Gates & TPA Pre-Auth Locks',
    status: 'IN_PROGRESS',
    deliverables: [
      { title: 'Emergency ESI 5-Level Triage & Inbound Ambulance ECG', detail: '108 ALS monitor telemetry stream directly to Casualty resuscitation wall.', done: true },
      { title: 'Daily Digital Crash Cart Seal Verification & Auto-Replenish', detail: 'Physical seal break triggers automated pharmacy replacement indent within 5 minutes.', done: true },
      { title: 'OT WHO 3-Phase Verification & NPO Fasting Lockout', detail: 'Anesthesia lock active until 6-hour fasting timer complete and CSSD biological pass verified.', done: true },
      { title: 'TPA IRDAI Pre-Auth Bundles & Ayushman PMJAY Code Lock', detail: 'National Health Claims Exchange (NHCX) JSON payload digest with ICD-10/PCS package validation.', done: true }
    ],
    keyPerformanceMetric: '100% surgical sterility verification compliance; STEMI door-to-balloon time < 45 mins.',
    riskMitigation: 'Emergency PAC override allowed only with Chief Anaesthetist biometric authorization.'
  },
  {
    phaseKey: 'PHASE_D',
    name: 'Phase D: Enterprise Telemetry, Anti-Leakage & Accreditation',
    timeline: 'Day 36 - 45',
    icon: '📈',
    focus: 'Point-of-Care Charge Binding, Cashier Blind Dual-Count & Executive Situational Wall',
    status: 'SCHEDULED',
    deliverables: [
      { title: 'Clinical-Action-to-Financial Auto-Posting Hooks', detail: 'Bedside dressing, nebulization, doctor rounds auto-charged with zero manual cashier re-entry.', done: true },
      { title: 'Cashier Blind Dual-Count Shift Drawer Reconciliation', detail: 'Cashier physical denomination entry without viewing system balance; discrepancy lock.', done: true },
      { title: 'Executive Situational Command Wall (Hospital Heartbeat)', detail: 'Sub-second WebSocket occupancy heatmap for ICU, ER, OT, and Ward vacancy projections.', done: true },
      { title: 'Predictive Bed Turnaround & 45-Minute Discharge Pipeline', detail: 'Doctor discharge intention spawns 4 parallel tasks across Pharmacy, Labs, TPA, and Housekeeping.', done: true }
    ],
    keyPerformanceMetric: 'Unbilled clinical revenue leakage dropped to 0%; bed turnover accelerated by 35%; full NABH digital audit readiness.',
    riskMitigation: 'Daily financial audit cross-match between nursing consumables consumption and central warehouse ledger.'
  }
];

export interface LoopStepStatus {
  stepNumber: number;
  title: string;
  subtitle: string;
  icon: string;
  department: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  latencyLabel: string;
  timestamp?: string;
  details?: string;
}

export interface LiveTelemetryRecord {
  id: string;
  timestamp: string;
  mode: HospitalLoopMode;
  uhid: string;
  tokenOrBed: string;
  patientName: string;
  event: string;
  sourceDepartment: string;
  targetDepartment: string;
  turnaroundTime: string;
  status: 'DISPATCHED' | 'PROCESSED' | 'ALERTED' | 'DISPENSED' | 'SETTLED';
}

export const MOCK_TELEMETRY_LOG: LiveTelemetryRecord[] = [];

export interface HospitalInHouseClosedLoopViewProps {
  tenantId?: string;
  facilityName?: string;
  onNavigateModule?: (moduleKey: PartnerModuleKey, subTab?: string) => void;
}

export const HospitalInHouseClosedLoopView: React.FC<HospitalInHouseClosedLoopViewProps> = ({
  facilityName = 'Apex Multi-Speciality Hospital & Trauma Care',
  onNavigateModule
}) => {
  const [loopMode, setLoopMode] = useState<HospitalLoopMode>('OPD');
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [telemetryLogs, setTelemetryLogs] = useState<LiveTelemetryRecord[]>(MOCK_TELEMETRY_LOG);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => setToastNotification(null), 3500);
  };

  useEffect(() => {
    const unsub = hospitalEventBus.subscribe('*', (payload) => {
      const d = payload.data || {};
      const newRec: LiveTelemetryRecord = {
        id: `TEL-${Date.now().toString().slice(-4)}`,
        timestamp: payload.timestamp || new Date().toLocaleTimeString(),
        mode: loopMode,
        uhid: d.uhid || d.patientMrn || 'UHID-LIVE',
        tokenOrBed: d.tokenNumber ? `Token ${d.tokenNumber}` : (d.bedNumber || 'OPD Walk-in'),
        patientName: d.patientName || 'Patient',
        event: payload.summaryText || payload.type,
        sourceDepartment: payload.sourceModule || 'Clinical System',
        targetDepartment: 'Central EHR',
        turnaroundTime: '< 0.1s',
        status: payload.type === 'BILL_SETTLED' ? 'SETTLED' : payload.type === 'PRESCRIPTION_DISPENSED' ? 'DISPENSED' : 'PROCESSED'
      };
      setTelemetryLogs((prev) => [newRec, ...prev.slice(0, 49)]);
    });

    return () => unsub();
  }, [loopMode]);

  // --- 5 Closed-Loop Feedback Engines State ---
  // Engine 1: Clinical-to-Financial
  const [nebulizerMaskScanned, setNebulizerMaskScanned] = useState(false);
  const [chamberDressingPerformed, setChamberDressingPerformed] = useState(false);
  const [runningFolioAmount, setRunningFolioAmount] = useState(14200);

  // Engine 2: Vitals-to-Intervention Telemetry (RRS / NEWS2)
  const [rrsCodeBlueActive, setRrsCodeBlueActive] = useState(false);
  const [patient3News2, setPatient3News2] = useState(9);
  const [rrsResponseSeconds, setRrsResponseSeconds] = useState(180);

  // Engine 3: Consumption-Velocity Predictive Inventory
  const [poDraftGenerated, setPoDraftGenerated] = useState(false);
  const [isDengueSurgeActive, setIsDengueSurgeActive] = useState(false);

  // Engine 4: Bed Turnaround & Discharge Velocity
  const [dischargeSpawned, setDischargeSpawned] = useState(false);
  const [dischargeMinutes] = useState(45);

  // Engine 5: Tamper-Evident Forensic Audit & Break-Glass Gate
  const [isBreakGlassUnlocked, setIsBreakGlassUnlocked] = useState(false);
  const [showBreakGlassModal, setShowBreakGlassModal] = useState(false);
  const [breakGlassReason, setBreakGlassReason] = useState('ACUTE_CARDIOPULMONARY_RESUSCITATION');
  const [breakGlassPin, setBreakGlassPin] = useState('');
  const [forensicWatermarkHash, setForensicWatermarkHash] = useState<string | null>(null);

  // System-Wide Audit Matrix Filter State
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

  const filteredAuditData = hospitalAuditMatrixData.filter((row) => {
    if (!auditSearchQuery.trim()) return true;
    const q = auditSearchQuery.toLowerCase();
    return (
      row.department.toLowerCase().includes(q) ||
      row.currentBaseline.toLowerCase().includes(q) ||
      row.goldStandard.toLowerCase().includes(q) ||
      row.dynamicSolution.toLowerCase().includes(q) ||
      row.impactBadge.toLowerCase().includes(q)
    );
  });

  // Handlers for 5 Closed-Loop Engines
  const handleScanNebulizerSeal = () => {
    setNebulizerMaskScanned(true);
    setRunningFolioAmount((prev) => prev + 435);
    hospitalEventBus.publish(
      'CLINICAL_SERVICE_AUTO_CHARGED',
      'ClosedLoopEngine',
      { action: 'NEBULIZATION_SESSION', barcode: '#NEB-9021', amount: 435 },
      '⚡ Bedside Nebulizer Mask Scan: ₹435 auto-posted to running IPD bill.'
    );
    showToast('✓ Nebulizer Mask Scan: ₹435 auto-posted to IPD Folio (Zero Leakage)!');
  };

  const handlePerformChamberDressing = () => {
    setChamberDressingPerformed(true);
    setRunningFolioAmount((prev) => prev + 450);
    hospitalEventBus.publish(
      'CLINICAL_SERVICE_AUTO_CHARGED',
      'ClosedLoopEngine',
      { action: 'MINOR_DRESSING_PROCEDURE', location: 'Chamber 102', amount: 450 },
      '⚡ Doctor Chamber Dressing: ₹450 auto-posted to Patient Ledger.'
    );
    showToast('✓ Chamber Minor Dressing: ₹450 auto-posted to patient ledger!');
  };

  const handleTriggerRrsCodeBlue = () => {
    setRrsCodeBlueActive(true);
    setPatient3News2(9);
    setRrsResponseSeconds(222);
    hospitalEventBus.publish(
      'RAPID_RESPONSE_SYSTEM_ACTIVATED',
      'RrsEngine',
      {
        patient: 'Mohd. Irfan',
        bed: 'Ward 4B Bed 11',
        news2Score: 9,
        triad: 'Septic Shock (BP 82/54, Pulse 132, SpO2 84%)'
      },
      '🚨 RRS / CODE-BLUE INITIATED: Mohd. Irfan NEWS2 score 9. ICU Intensivist & Senior Nurse paged!'
    );
    showToast('🚨 RAPID RESPONSE SYSTEM ACTIVATED: Acoustic push sent to ICU Intensivist!');
  };

  const handleAcknowledgeRrs = () => {
    setRrsCodeBlueActive(false);
    showToast('✓ ICU Intensivist & Senior Nurse Arrived at Bedside (Turnaround: 3m 42s)');
  };

  const handleGeneratePredictivePo = () => {
    setPoDraftGenerated(true);
    hospitalEventBus.publish(
      'PREDICTIVE_INVENTORY_PO_DRAFTED',
      'PredictiveInventoryEngine',
      {
        item: 'Bone Cement with Gentamicin',
        quantity: 6,
        supplier: 'Stryker Ortho',
        deliverySla: '4 Hours Emergency Lock'
      },
      '📦 Predictive PO #PO-8821 Auto-Generated for 5 Scheduled TKRs tomorrow.'
    );
    showToast('✓ Predictive PO #PO-8821 Auto-Drafted to Stryker (6 Packs Bone Cement / 4h Lock)!');
  };

  const handleToggleDengueSurge = () => {
    const nextState = !isDengueSurgeActive;
    setIsDengueSurgeActive(nextState);
    showToast(nextState ? '🦟 Dengue Surge Protocol Active: ROP auto-elevated 10x (500 units)!' : 'Seasonal Surge Normal');
  };

  const handleSpawnDischargePipeline = () => {
    setDischargeSpawned(true);
    hospitalEventBus.publish(
      'DISCHARGE_VELOCITY_PARALLEL_SPAWNED',
      'DischargeVelocityEngine',
      {
        patient: 'Suresh Gupta',
        bed: 'Ward 3B Bed 12',
        spawnedTasks: ['PHARMACY_RETURN', 'DIAGNOSTICS_SIGNOFF', 'TPA_NHCX_DISPATCH', 'HOUSEKEEPING_UV_ALERT']
      },
      '⚡ 4 Parallel Discharge Workflows Spawned: Turnaround reduced from 5h to 45 mins.'
    );
    showToast('⚡ Doctor Discharge Intention: 4 Parallel Tasks Spawned across Pharmacy, Labs, TPA & Housekeeping!');
  };

  const handleExecuteBreakGlass = () => {
    if (!breakGlassPin.trim()) return;
    const hash = 'SHA256:' + Math.random().toString(16).substring(2, 10) + '98a4f10c';
    setForensicWatermarkHash(hash);
    setIsBreakGlassUnlocked(true);
    setShowBreakGlassModal(false);
    hospitalEventBus.publish(
      'BREAK_GLASS_OVERRIDE_RECORDED',
      'BreakGlassGate',
      {
        patient: 'Hon. Dignitary (Suite 501)',
        justification: breakGlassReason,
        actor: 'Dr. Aryan Sharma (Consultant)',
        auditHash: hash
      },
      '🔓 Break-Glass Emergency Override: VIP Suite 501 unmasked with forensic watermark.'
    );
    hospitalEventBus.publish(
      'FORENSIC_WATERMARK_EMBEDDED',
      'BreakGlassGate',
      {
        watermark: 'USER: DR_ARYAN_SHARMA | IP: 10.240.12.84 | 2026-10-04 14:29:06 | UHID: DS-VIP-001',
        auditHash: hash
      },
      '🛡️ Forensic Invisible Watermark embedded across screen.'
    );
    showToast('🔓 Break-Glass Emergency Override Granted • Forensic Watermark Active!');
  };

  // OPD Pipeline Steps Definition
  const opdSteps: LoopStepStatus[] = [
    {
      stepNumber: 1,
      title: '1. OPD Reception & Token Intake',
      subtitle: 'UHID: 2026-00891 + OPD Token A-104 generated. Patient queued for Dr. Aryan Sharma.',
      icon: '📇',
      department: 'Central Reception',
      status: activeStepIndex >= 1 ? 'COMPLETED' : activeStepIndex === 0 ? 'ACTIVE' : 'PENDING',
      latencyLabel: 'Zero Setup Lag',
      details: 'Instant UHID Barcode generated. Demographics cached in Unified Hospital DB.'
    },
    {
      stepNumber: 2,
      title: '2. Doctor OPD Desk (Test Prescribed)',
      subtitle: 'Doctor examines patient and prescribes In-House CBC, Dengue NS1 & KFT tests.',
      icon: '🩺',
      department: 'Doctor OPD Desk (Room 102)',
      status: activeStepIndex >= 2 ? 'COMPLETED' : activeStepIndex === 1 ? 'ACTIVE' : 'PENDING',
      latencyLabel: '< 0.05s Dispatch',
      details: 'Digital requisition pushed directly to In-House Phlebotomy queue.'
    },
    {
      stepNumber: 3,
      title: '3. In-House Phlebotomy & Pathology LIMS',
      subtitle: 'Patient walks to adjacent booth. Sample drawn, barcoded, and processed by In-House Pathologist.',
      icon: '🔬',
      department: 'Pathology LIMS Workbench',
      status: activeStepIndex >= 3 ? 'COMPLETED' : activeStepIndex === 2 ? 'ACTIVE' : 'PENDING',
      latencyLabel: '20-30 Mins in Hospital (vs 24h Outside)',
      details: 'Automated analyzer interface. Pathologist signs off with digital signature.'
    },
    {
      stepNumber: 4,
      title: '4. Sub-Second Reactive Alert (Loop-Back)',
      subtitle: 'Event bus triggers instant glowing notification banner on Doctor Desk: "🔔 Report Ready for Ramesh Kumar".',
      icon: '⚡',
      department: 'Real-Time Event Bus',
      status: activeStepIndex >= 4 ? 'COMPLETED' : activeStepIndex === 3 ? 'ACTIVE' : 'PENDING',
      latencyLabel: 'Sub-Second (0.04s)',
      details: 'No page refresh required. Doctor clicks banner to inspect lab values side-by-side.'
    },
    {
      stepNumber: 5,
      title: '5. Doctor Reviews & Final Rx Issued',
      subtitle: 'Doctor evaluates CBC & Dengue results, finalizes medication prescription (Paracetamol + Pantoprazole).',
      icon: '📋',
      department: 'Doctor OPD Desk',
      status: activeStepIndex >= 5 ? 'COMPLETED' : activeStepIndex === 4 ? 'ACTIVE' : 'PENDING',
      latencyLabel: '1-Click Rx Push',
      details: 'Prescription routed directly to In-House Ground Floor Pharmacy POS queue.'
    },
    {
      stepNumber: 6,
      title: '6. In-House Pharmacy POS (Dispensing)',
      subtitle: 'Hospital Pharmacy dispenses medicines with 1-click batch deduction and barcode packing.',
      icon: '💊',
      department: 'In-House Pharmacy POS',
      status: activeStepIndex >= 6 ? 'COMPLETED' : activeStepIndex === 5 ? 'ACTIVE' : 'PENDING',
      latencyLabel: '< 1 min Counter Time',
      details: 'Medicines packed with digital receipt. Charges appended to Central Patient Folio.'
    },
    {
      stepNumber: 7,
      title: '7. Central Billing & Patient Exit Desk',
      subtitle: 'Single consolidated bill (Consultation + Lab + Pharmacy) settled via UPI/Cash/TPA. 1-Click Print all docs.',
      icon: '🖨️',
      department: 'Central Cashier & Help Desk',
      status: activeStepIndex >= 7 ? 'COMPLETED' : activeStepIndex === 6 ? 'ACTIVE' : 'PENDING',
      latencyLabel: '1-Click Discharge',
      details: 'Single consolidated receipt. Patient exits with printed Prescription + Lab Report + Hospital Bill.'
    }
  ];

  // IPD Pipeline Steps Definition
  const ipdSteps: LoopStepStatus[] = [
    {
      stepNumber: 1,
      title: '1. Inpatient Admission & Bed Allocation',
      subtitle: 'Patient admitted to Ward 4, Bed ICU-03 under Dr. Rajesh Saxena (Critical Care).',
      icon: '🛏️',
      department: 'Inpatient ADT Desk',
      status: activeStepIndex >= 1 ? 'COMPLETED' : activeStepIndex === 0 ? 'ACTIVE' : 'PENDING',
      latencyLabel: 'Continuous Bed Tracking',
      details: 'Active Patient Context synced across ICU monitors, nursing station, and doctor tablets.'
    },
    {
      stepNumber: 2,
      title: '2. Bedside Doctor Round & STAT Lab Orders',
      subtitle: 'Doctor on morning rounds orders emergency STAT Troponin-I, ABG, and Electrolytes.',
      icon: '👨‍⚕️',
      department: 'ICU Workstation Tablet',
      status: activeStepIndex >= 2 ? 'COMPLETED' : activeStepIndex === 1 ? 'ACTIVE' : 'PENDING',
      latencyLabel: 'Direct Bedside Entry',
      details: 'Order flagged as STAT Priority with red highlight in Pathology queue.'
    },
    {
      stepNumber: 3,
      title: '3. Bedside Nurse Phlebotomy & Sample Dispatch',
      subtitle: 'Ward nurse collects blood sample in vacutainer at bedside, dispatched via hospital pneumatic chute.',
      icon: '🩸',
      department: 'ICU Nursing Bay',
      status: activeStepIndex >= 3 ? 'COMPLETED' : activeStepIndex === 2 ? 'ACTIVE' : 'PENDING',
      latencyLabel: '3 mins transit',
      details: 'Sample barcode scanned at ICU bedside; instantly logged as RECEIVED at lab.'
    },
    {
      stepNumber: 4,
      title: '4. In-House Pathology STAT Analysis & Verification',
      subtitle: 'Emergency sample run on rapid analyzers. Pathologist verifies report within 12 minutes.',
      icon: '🧪',
      department: 'Pathology LIMS Workbench',
      status: activeStepIndex >= 4 ? 'COMPLETED' : activeStepIndex === 3 ? 'ACTIVE' : 'PENDING',
      latencyLabel: 'STAT Turnaround: 12 Mins',
      details: 'Normal values & critical alarms auto-flagged. Pathologist clicks "Verify & Publish".'
    },
    {
      stepNumber: 5,
      title: '5. Sub-Second Alert on Doctor Tablet',
      subtitle: 'Instant push alert wakes up ICU Doctor tablet: "🚨 Critical Troponin-I Ready for Bed ICU-03".',
      icon: '🔔',
      department: 'Real-Time Event Bus',
      status: activeStepIndex >= 5 ? 'COMPLETED' : activeStepIndex === 4 ? 'ACTIVE' : 'PENDING',
      latencyLabel: 'Sub-Second (0.02s)',
      details: 'Doctor reviews values immediately without having to call or walk to the lab.'
    },
    {
      stepNumber: 6,
      title: '6. Medication Chart Update & Pharmacy Ward Indent',
      subtitle: 'Doctor updates digital MAR (Medication Administration Record); auto-indents IV Heparin & Atorvastatin.',
      icon: '📋',
      department: 'Doctor Tablet / EMR',
      status: activeStepIndex >= 6 ? 'COMPLETED' : activeStepIndex === 5 ? 'ACTIVE' : 'PENDING',
      latencyLabel: 'Direct Indent Push',
      details: 'In-House Pharmacy receives emergency ICU indent on high-priority screen.'
    },
    {
      stepNumber: 7,
      title: '7. In-House Pharmacy Ward Delivery & Dispensing',
      subtitle: 'Hospital Pharmacy packs IV infusion drugs and dispatches to ICU Nurse station within 5 minutes.',
      icon: '💊',
      department: 'In-House Inpatient Pharmacy',
      status: activeStepIndex >= 7 ? 'COMPLETED' : activeStepIndex === 6 ? 'ACTIVE' : 'PENDING',
      latencyLabel: 'Pneumatic Delivery',
      details: 'Nurse scans drug barcode at bedside before administering to the patient.'
    },
    {
      stepNumber: 8,
      title: '8. Central Running IPD Folio & TPA Cashless',
      subtitle: 'All items (Bed charges, STAT labs, IV medications) auto-accumulate in single IPD running bill.',
      icon: '📑',
      department: 'Central Billing & TPA Desk',
      status: activeStepIndex >= 8 ? 'COMPLETED' : activeStepIndex === 7 ? 'ACTIVE' : 'PENDING',
      latencyLabel: 'Zero Leakage Billing',
      details: '1-Click TPA insurance pre-auth sync; zero unbilled pharmacy or lab items at discharge.'
    }
  ];

  const currentSteps = loopMode === 'IPD' ? ipdSteps : opdSteps;

  // Run Real-Time Closed-Loop Simulation
  const handleRunSimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setActiveStepIndex(0);

    const isOpd = loopMode === 'OPD';
    const patientName = isOpd ? 'Ramesh Kumar' : 'Kailash Nath';
    const uhid = isOpd ? 'UHID-2026-00891' : 'UHID-2026-00742';
    const tokenOrBed = isOpd ? 'Token A-104' : 'Bed ICU-03';

    showToast(`🚀 Starting Live In-House ${loopMode} Closed-Loop Simulation...`);

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      // Step 1: Intake / Bed
      setActiveStepIndex(1);
      hospitalEventBus.publish(
        'PATIENT_SELECTED',
        isOpd ? 'OPD_RECEPTION' : 'INPATIENT_ADT',
        { uhid, name: patientName, tokenOrBed },
        `${isOpd ? 'OPD Token' : 'Bed'} registered for ${patientName} (${uhid})`
      );
      await sleep(1000);

      // Step 2: Doctor Orders Tests
      setActiveStepIndex(2);
      hospitalEventBus.publish(
        'LAB_ORDER_CREATED',
        'DOCTOR_OPD_DESK',
        {
          uhid,
          patientName,
          tests: isOpd ? ['CBC with Platelets', 'Dengue NS1 Antigen', 'KFT'] : ['STAT Troponin-I', 'ABG', 'Serum Electrolytes']
        },
        `Digital Lab Requisition pushed to In-House Lab for ${patientName}`
      );
      await sleep(1200);

      // Step 3: In-House Phlebotomy & Lab Processing
      setActiveStepIndex(3);
      await sleep(1200);

      // Step 4: Sub-Second Reactive Alert
      setActiveStepIndex(4);
      hospitalEventBus.publish(
        'LAB_REPORT_COMPLETED',
        'IN_HOUSE_PATHOLOGY_LIMS',
        {
          uhid,
          patientName,
          orderId: `LAB-ORD-${Date.now().toString().slice(-4)}`,
          investigationName: isOpd ? 'CBC + Dengue NS1 + KFT' : 'STAT Troponin-I & ABG',
          isInternal: true
        },
        `🔔 Sub-Second Alert: In-House Lab Report Ready for ${patientName}`
      );
      showToast(`🔔 Sub-Second Alert: Lab Report Ready for ${patientName} on Doctor Desk!`);
      await sleep(1200);

      // Step 5: Doctor Final Rx
      setActiveStepIndex(5);
      hospitalEventBus.publish(
        'PRESCRIPTION_ISSUED',
        'DOCTOR_DESK',
        {
          uhid,
          patientName,
          medicines: isOpd ? ['Paracetamol 650mg', 'Pantoprazole 40mg', 'ORS'] : ['IV Heparin Infusion', 'Atorvastatin 40mg']
        },
        `Prescription dispatched to In-House Pharmacy for ${patientName}`
      );
      await sleep(1200);

      // Step 6: In-House Pharmacy POS Dispense
      setActiveStepIndex(6);
      hospitalEventBus.publish(
        'PRESCRIPTION_DISPENSED',
        'IN_HOUSE_PHARMACY_POS',
        { uhid, patientName, status: isOpd ? 'DISPENSED' : 'DELIVERED_TO_WARD' },
        `Medicines dispensed by In-House Pharmacy for ${patientName}`
      );
      await sleep(1200);

      // Step 7: Central Billing / IPD Folio
      setActiveStepIndex(7);
      if (!isOpd) {
        // Step 8 for IPD
        await sleep(800);
        setActiveStepIndex(8);
      }
      hospitalEventBus.publish(
        'BILL_SETTLED',
        'CENTRAL_CASHIER_BILLING',
        { uhid, patientName, mode: 'UNIFIED_HOSPITAL_FOLIO', amount: isOpd ? 950 : 18500 },
        `Unified Hospital Bill settled for ${patientName} (${uhid})`
      );

      // Append new telemetry entry to the top
      const newEntry: LiveTelemetryRecord = {
        id: `TEL-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toLocaleTimeString(),
        mode: loopMode,
        uhid,
        tokenOrBed,
        patientName,
        event: isOpd ? 'Consolidated OPD Bill Settled (Doctor + Lab + Rx)' : 'STAT IPD Loop Completed & Folio Synced',
        sourceDepartment: 'Central Cashier & Help Desk',
        targetDepartment: isOpd ? 'Patient Exit' : 'Running IPD Folio',
        turnaroundTime: isOpd ? '28m 45s (In-House)' : '16m 12s (STAT Bedside)',
        status: 'SETTLED'
      };

      setTelemetryLogs((prev) => [newEntry, ...prev]);
      showToast(`🎉 Live In-House ${loopMode} Closed-Loop Simulation Completed Successfully!`);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '20px 24px 60px',
        maxWidth: '1600px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Toast Notification */}
      {toastNotification && (
        <div
          style={{
            position: 'fixed',
            top: '85px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#0F172A',
            border: '1.5px solid #10B981',
            borderRadius: '10px',
            padding: '12px 20px',
            color: '#F8FAFC',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.9rem',
            fontWeight: 700
          }}
        >
          <span>⚡</span>
          <span>{toastNotification}</span>
        </div>
      )}

      {/* HEADER & WORKSPACE HERO BANNER */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          backgroundColor: '#0B132B',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '16px',
          padding: '22px 26px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid #38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.85rem'
              }}
            >
              🔄
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 900, color: '#FFFFFF', fontSize: '1.25rem', letterSpacing: '0.4px' }}>
                  IN-HOUSE CLOSED-LOOP PIPELINE (MULTI-SPECIALITY HOSPITAL)
                </span>
                <Badge variant="primary" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                  Unified Database
                </Badge>
                <Badge variant="success" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                  Sub-Second Reactive
                </Badge>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '4px' }}>
                {facilityName} — Ek hi unified system me Doctor OPD Desk, In-House Phlebotomy/Lab, In-House Pharmacy POS aur Central Cashier ka seamless closed loop.
              </div>
            </div>
          </div>

          {/* OPD vs IPD Mode Switcher */}
          {/* OPD vs IPD vs 5 Closed-Loop Engines Mode Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1E293B', padding: '6px', borderRadius: '12px', border: '1px solid #334155' }}>
            <button
              type="button"
              onClick={() => {
                setLoopMode('OPD');
                setActiveStepIndex(0);
              }}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: loopMode === 'OPD' ? '#0284C7' : 'transparent',
                color: loopMode === 'OPD' ? '#FFFFFF' : '#94A3B8',
                fontWeight: 800,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              🩺 OPD In-House Loop
            </button>
            <button
              type="button"
              onClick={() => {
                setLoopMode('IPD');
                setActiveStepIndex(0);
              }}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: loopMode === 'IPD' ? '#7C3AED' : 'transparent',
                color: loopMode === 'IPD' ? '#FFFFFF' : '#94A3B8',
                fontWeight: 800,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              🛏️ IPD Bedside Loop (ICU/Wards)
            </button>
            <button
              type="button"
              onClick={() => {
                setLoopMode('FIVE_CLOSED_LOOP_ENGINES');
              }}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: loopMode === 'FIVE_CLOSED_LOOP_ENGINES' ? '#10B981' : 'transparent',
                color: loopMode === 'FIVE_CLOSED_LOOP_ENGINES' ? '#FFFFFF' : '#94A3B8',
                fontWeight: 800,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              ⚙️ 5 Closed-Loop Engines
            </button>
            <button
              type="button"
              onClick={() => {
                setLoopMode('AUDIT_MATRIX');
              }}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: loopMode === 'AUDIT_MATRIX' ? '#F59E0B' : 'transparent',
                color: loopMode === 'AUDIT_MATRIX' ? '#FFFFFF' : '#94A3B8',
                fontWeight: 800,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              📊 System Audit Matrix (13 Pillars)
            </button>
            <button
              type="button"
              onClick={() => {
                setLoopMode('PHASED_ROLLOUT');
              }}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: loopMode === 'PHASED_ROLLOUT' ? '#EC4899' : 'transparent',
                color: loopMode === 'PHASED_ROLLOUT' ? '#FFFFFF' : '#94A3B8',
                fontWeight: 800,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              🚀 Phased Rollout (Day 1 - 45)
            </button>
          </div>
        </div>

        {/* 4 Superpowers of Multi-Speciality Hospital */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginTop: '4px' }}>
          <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: '#38BDF8', fontSize: '0.85rem' }}>
              <span>🌐</span> Unified Hospital Database
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
              Doctor, Lab, Chemist, Cashier sab ek hi single-source-of-truth database par realtime kaam karte hain.
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: '#34D399', fontSize: '0.85rem' }}>
              <span>⚡</span> Sub-Second Reactive Alert
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
              Lab Pathologist ke report sign-off karte hi Doctor ki screen par sub-second alert popup flash hota hai.
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: '#FBBF24', fontSize: '0.85rem' }}>
              <span>🩸</span> Hospital Phlebotomy Booth
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
              OPD room ke bagal me blood draw, 20-30 minute me report ready. Patient ko bahar bhatakna nahi padta.
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: '#A78BFA', fontSize: '0.85rem' }}>
              <span>🧾</span> Centralized Unified Billing
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
              Doctor + Lab + Medicines ka ek combined consolidated bill counter par pay hota hai ya TPA claim hota hai.
            </div>
          </div>
        </div>
      </div>

      {/* PHASED ROLLOUT ROADMAP VS 13-PILLAR AUDIT MATRIX VS 5 CLOSED-LOOP FEEDBACK ENGINES VS STEPPER PIPELINE */}
      {loopMode === 'PHASED_ROLLOUT' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Banner */}
          <Card style={{ padding: '24px', borderRadius: '16px', border: '1.5px solid #EC4899', backgroundColor: '#FDF2F8', boxShadow: '0 4px 20px rgba(236,72,153,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.6rem' }}>🚀</span>
                  <span style={{ fontWeight: 900, fontSize: '1.25rem', color: '#9D174D' }}>
                    PHASED OPERATIONAL ROLLOUT & GROUND-REALITY ROADMAP (DAY 1 - 45)
                  </span>
                  <Badge variant="primary" style={{ backgroundColor: '#EC4899', color: '#FFFFFF' }}>4 Sequential Phases</Badge>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#BE185D', marginTop: '4px' }}>
                  Is pure dynamic ecosystem ko ground par implement karne ke liye 4 sequential phases mein execute kiya jata hai.
                </div>
              </div>

              {/* Progress Metric */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: '#FFFFFF', padding: '10px 18px', borderRadius: '12px', border: '1px solid #FBCFE8' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#9D174D', fontWeight: 800, textTransform: 'uppercase' }}>Rollout Velocity</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#BE185D' }}>Phase C Active (Day 28 / 45)</div>
                </div>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '4px solid #EC4899', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem', color: '#9D174D' }}>
                  78%
                </div>
              </div>
            </div>
          </Card>

          {/* 4 PHASES GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
            {hospitalRolloutPhases.map((phase) => {
              const isCompleted = phase.status === 'COMPLETED';
              const isInProgress = phase.status === 'IN_PROGRESS';

              return (
                <Card
                  key={phase.phaseKey}
                  style={{
                    padding: '22px',
                    borderRadius: '16px',
                    border: isInProgress ? '2px solid #EC4899' : isCompleted ? '1.5px solid #10B981' : '1px solid #E2E8F0',
                    backgroundColor: isInProgress ? '#FFFDF5' : '#FFFFFF',
                    boxShadow: isInProgress ? '0 8px 24px rgba(236,72,153,0.12)' : '0 2px 12px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: isCompleted ? 'rgba(16,185,129,0.12)' : isInProgress ? 'rgba(236,72,153,0.12)' : 'rgba(100,116,139,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                        {phase.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>
                          {phase.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                          Timeline: <strong style={{ color: '#0F172A' }}>{phase.timeline}</strong>
                        </div>
                      </div>
                    </div>
                    <Badge variant={isCompleted ? 'success' : isInProgress ? 'warning' : 'neutral'} style={{ fontSize: '0.72rem' }}>
                      {isCompleted ? '✓ Done' : isInProgress ? '● In Progress' : '⏳ Scheduled'}
                    </Badge>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#475569', backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontWeight: 600 }}>
                    🎯 Focus: {phase.focus}
                  </div>

                  {/* Deliverables Checklist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase' }}>
                      Key Deliverables ({phase.deliverables.filter(d => d.done).length}/{phase.deliverables.length})
                    </div>
                    {phase.deliverables.map((d, dIdx) => (
                      <div key={dIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.75rem' }}>
                        <span style={{ color: d.done ? '#10B981' : '#94A3B8', fontWeight: 900 }}>{d.done ? '✓' : '○'}</span>
                        <div>
                          <strong style={{ color: '#0F172A' }}>{d.title}:</strong>{' '}
                          <span style={{ color: '#64748B' }}>{d.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* KPI Metric */}
                  <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px dashed #E2E8F0', fontSize: '0.74rem' }}>
                    <div style={{ color: '#065F46', fontWeight: 700, backgroundColor: '#F0FDF4', padding: '6px 8px', borderRadius: '6px', marginBottom: '6px' }}>
                      📊 Metric: {phase.keyPerformanceMetric}
                    </div>
                    <div style={{ color: '#92400E', fontWeight: 600, backgroundColor: '#FFFBEB', padding: '6px 8px', borderRadius: '6px' }}>
                      🛡️ Ground Risk Mitigation: {phase.riskMitigation}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : loopMode === 'AUDIT_MATRIX' ? (
        <Card style={{ padding: '24px', borderRadius: '16px', border: '1.5px solid #F59E0B', backgroundColor: '#FFFFFF', boxShadow: '0 4px 20px rgba(245,158,11,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>📊</span>
                <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#0F172A' }}>
                  SYSTEM-WIDE AUDIT MATRIX: "ABHI KAISA HAI" VS "KAISA HONA CHAHIYE"
                </span>
                <Badge variant="warning">13 Hospital Pillars</Badge>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '4px' }}>
                Hospital ke 13 key departments ka ground friction, baseline status, target gold standard, aur dynamic data-driven automated operational solution.
              </div>
            </div>

            <div style={{ minWidth: '300px' }}>
              <Input
                placeholder="🔍 Search department, baseline or solution..."
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ width: '180px' }}>Hospital Department</TableHead>
                  <TableHead style={{ width: '240px' }}>Abhi Kaisa Hai (Current Baseline)</TableHead>
                  <TableHead style={{ width: '280px' }}>Kaisa Hona Chahiye (Gold Standard Target)</TableHead>
                  <TableHead>Dynamic Data-Driven Solution (Operational Implementation)</TableHead>
                  <TableHead style={{ width: '160px' }}>Operational Impact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAuditData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                      No matching departments found for "{auditSearchQuery}".
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAuditData.map((row) => (
                    <TableRow key={row.department}>
                      <TableCell style={{ fontWeight: 800, color: '#0F172A', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.35rem' }}>{row.icon}</span>
                          <span>{row.department}</span>
                        </div>
                      </TableCell>
                      <TableCell style={{ fontSize: '0.82rem', color: '#64748B', verticalAlign: 'top', lineHeight: 1.4 }}>
                        <div style={{ backgroundColor: '#F8FAFC', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          {row.currentBaseline}
                        </div>
                      </TableCell>
                      <TableCell style={{ fontSize: '0.82rem', color: '#0F172A', fontWeight: 600, verticalAlign: 'top', lineHeight: 1.4 }}>
                        <div style={{ backgroundColor: '#EFF6FF', padding: '8px 10px', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                          {row.goldStandard}
                        </div>
                      </TableCell>
                      <TableCell style={{ fontSize: '0.82rem', color: '#1E293B', verticalAlign: 'top', lineHeight: 1.4 }}>
                        <div style={{ backgroundColor: '#F0FDF4', padding: '8px 10px', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                          {row.dynamicSolution}
                        </div>
                      </TableCell>
                      <TableCell style={{ verticalAlign: 'top' }}>
                        <Badge variant="success" style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                          ✓ {row.impactBadge}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : loopMode === 'FIVE_CLOSED_LOOP_ENGINES' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Banner */}
          <Card style={{ padding: '22px 24px', borderRadius: '16px', border: '1.5px solid #10B981', backgroundColor: '#F0FDF4' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.5rem' }}>⚙️</span>
                  <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#065F46' }}>
                    REAL-TIME ARCHITECTURE: 5 CLOSED-LOOP FEEDBACK ENGINES
                  </span>
                  <Badge variant="success">Zero-Latency Event Bus Active</Badge>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#047857', marginTop: '4px' }}>
                  Static software se dynamic hospital intelligence platform: Point-of-care actions, continuous vitals telemetry, surgery consumption forecast, parallel discharge pipeline, aur forensic tamper-proof audit trails.
                </div>
              </div>
            </div>
          </Card>

          {/* GRID OF THE 5 ENGINES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>
            
            {/* ENGINE 1: Clinical-to-Financial Closed Loop */}
            <Card style={{ padding: '22px', borderRadius: '16px', border: '1.5px solid #0284C7', backgroundColor: '#FFFFFF', boxShadow: '0 4px 16px rgba(2,132,199,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(2,132,199,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                    💳
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>
                      1. Clinical-to-Financial Closed Loop
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      Anti-Leakage Engine: POC Action-to-Ledger Binding
                    </div>
                  </div>
                </div>
                <Badge variant="primary">Zero Cashier Re-Entry</Badge>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Active IPD Bed: Ward 4B Bed 11 (Mohd. Irfan)</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F172A' }}>Folio: ₹{runningFolioAmount.toLocaleString()}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>• Bedside Base Stay: ₹14,200 (Auto-accrued)</div>
                  {nebulizerMaskScanned && <div style={{ color: '#0284C7', fontWeight: 700 }}>• Bedside Nebulizer Mask Scan (#NEB-9021): +₹435 (Auto-Posted)</div>}
                  {chamberDressingPerformed && <div style={{ color: '#0284C7', fontWeight: 700 }}>• Doctor Chamber Minor Dressing (Chamber 102): +₹450 (Auto-Posted)</div>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Button
                  variant="outline"
                  disabled={nebulizerMaskScanned}
                  onClick={handleScanNebulizerSeal}
                  style={{ flex: 1, padding: '10px 14px', fontSize: '0.8rem', fontWeight: 700, borderColor: '#0284C7', color: nebulizerMaskScanned ? '#94A3B8' : '#0284C7' }}
                >
                  {nebulizerMaskScanned ? '✓ Nebulizer Billed (₹435)' : '📱 Scan Nebulizer Seal'}
                </Button>
                <Button
                  variant="outline"
                  disabled={chamberDressingPerformed}
                  onClick={handlePerformChamberDressing}
                  style={{ flex: 1, padding: '10px 14px', fontSize: '0.8rem', fontWeight: 700, borderColor: '#0284C7', color: chamberDressingPerformed ? '#94A3B8' : '#0284C7' }}
                >
                  {chamberDressingPerformed ? '✓ Dressing Billed (₹450)' : '🩺 Sign Chamber Dressing Note'}
                </Button>
              </div>
            </Card>

            {/* ENGINE 2: Vitals-to-Intervention Telemetry (RRS / NEWS2) */}
            <Card style={{ padding: '22px', borderRadius: '16px', border: rrsCodeBlueActive ? '2px solid #EF4444' : '1.5px solid #F59E0B', backgroundColor: rrsCodeBlueActive ? '#FEF2F2' : '#FFFFFF', boxShadow: rrsCodeBlueActive ? '0 0 20px rgba(239,68,68,0.25)' : '0 4px 16px rgba(245,158,11,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: rrsCodeBlueActive ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                    {rrsCodeBlueActive ? '🚨' : '💓'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>
                      2. Vitals-to-Intervention Telemetry
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      Rapid Response System (RRS) & NEWS2 Scoring
                    </div>
                  </div>
                </div>
                <Badge variant={rrsCodeBlueActive ? 'danger' : 'warning'}>
                  {rrsCodeBlueActive ? '🚨 CODE-BLUE ACTIVE' : `NEWS2: ${patient3News2} (CRITICAL)`}
                </Badge>
              </div>

              <div style={{ backgroundColor: rrsCodeBlueActive ? '#FEE2E2' : '#FFFBEB', padding: '14px', borderRadius: '12px', border: rrsCodeBlueActive ? '1px solid #F87171' : '1px solid #FDE68A', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: rrsCodeBlueActive ? '#991B1B' : '#92400E', marginBottom: '6px' }}>
                  Bed: Ward 4B Bed 11 • Mohd. Irfan (Septic Shock Triad)
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  <div>BP: <strong style={{ color: '#EF4444' }}>82/54 mmHg</strong></div>
                  <div>Pulse: <strong style={{ color: '#EF4444' }}>132 bpm</strong></div>
                  <div>SpO2: <strong style={{ color: '#EF4444' }}>84% (Room Air)</strong></div>
                  <div>RR: <strong style={{ color: '#EF4444' }}>28 /min</strong></div>
                </div>
                {rrsCodeBlueActive && (
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #F87171', fontSize: '0.75rem', color: '#991B1B', fontWeight: 700 }}>
                    ⏱️ Intensivist Paged • Bedside Mobilization SLA: {Math.floor(rrsResponseSeconds / 60)}m {rrsResponseSeconds % 60}s remaining!
                  </div>
                )}
              </div>

              <div>
                {rrsCodeBlueActive ? (
                  <Button
                    variant="primary"
                    onClick={handleAcknowledgeRrs}
                    style={{ width: '100%', padding: '10px', fontSize: '0.825rem', fontWeight: 800, backgroundColor: '#10B981', color: '#FFFFFF' }}
                  >
                    ✓ Acknowledge ICU Intensivist Bedside Arrival
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    onClick={handleTriggerRrsCodeBlue}
                    style={{ width: '100%', padding: '10px', fontSize: '0.825rem', fontWeight: 800, backgroundColor: '#EF4444', color: '#FFFFFF' }}
                  >
                    🚨 Trigger NEWS2 Rapid Response / Code-Blue
                  </Button>
                )}
              </div>
            </Card>

            {/* ENGINE 3: Consumption-Velocity Predictive Inventory Engine */}
            <Card style={{ padding: '22px', borderRadius: '16px', border: '1.5px solid #8B5CF6', backgroundColor: '#FFFFFF', boxShadow: '0 4px 16px rgba(139,92,246,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                    📦
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>
                      3. Consumption-Velocity Predictive Inventory
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      OT Schedule Buffer & Seasonal Epidemic Slope
                    </div>
                  </div>
                </div>
                <Badge variant="primary">{isDengueSurgeActive ? '10x Surge Slope' : 'Dynamic ROP'}</Badge>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                  Tomorrow's OT Schedule: 5 Total Knee Replacements (TKRs)
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '6px' }}>
                  • Bone Cement Required: 6 packs | Current Stock: 2 packs (Shortfall: 4 packs)
                </div>
                <div style={{ fontSize: '0.75rem', color: isDengueSurgeActive ? '#DC2626' : '#64748B', fontWeight: isDengueSurgeActive ? 800 : 500 }}>
                  • Seasonal Buffer: {isDengueSurgeActive ? '🦟 Dengue Outbreak Mode (Paracetamol ROP 50 ➔ 500 strips)' : 'Standard Weekly Reorder Level (50 strips)'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Button
                  variant="outline"
                  disabled={poDraftGenerated}
                  onClick={handleGeneratePredictivePo}
                  style={{ flex: 1, padding: '10px 12px', fontSize: '0.8rem', fontWeight: 700, borderColor: '#8B5CF6', color: poDraftGenerated ? '#94A3B8' : '#8B5CF6' }}
                >
                  {poDraftGenerated ? '✓ PO-8821 Auto-Drafted' : '📦 Auto-Draft Predictive PO'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleToggleDengueSurge}
                  style={{ flex: 1, padding: '10px 12px', fontSize: '0.8rem', fontWeight: 700, borderColor: isDengueSurgeActive ? '#EF4444' : '#64748B', color: isDengueSurgeActive ? '#EF4444' : '#475569' }}
                >
                  {isDengueSurgeActive ? '🦟 Dengue Surge: ON (10x)' : '🦟 Dengue Surge: Normal'}
                </Button>
              </div>
            </Card>

            {/* ENGINE 4: Bed Turnaround & Discharge Velocity Pipeline */}
            <Card style={{ padding: '22px', borderRadius: '16px', border: '1.5px solid #10B981', backgroundColor: '#FFFFFF', boxShadow: '0 4px 16px rgba(16,185,129,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                    ⚡
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>
                      4. Bed Turnaround & Discharge Velocity Pipeline
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      4 Parallel Workflows: 5h Serial Delay ➔ {dischargeMinutes} Mins
                    </div>
                  </div>
                </div>
                <Badge variant={dischargeSpawned ? 'success' : 'neutral'}>
                  {dischargeSpawned ? '⚡ 4 Tasks Parallel' : 'Discharge Ready'}
                </Badge>
              </div>

              <div style={{ backgroundColor: '#F0FDF4', padding: '14px', borderRadius: '12px', border: '1px solid #BBF7D0', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#166534', marginBottom: '6px' }}>
                  Patient: Suresh Gupta • Ward 3B Bed 12 (Discharge Fit)
                </div>
                <div style={{ fontSize: '0.75rem', color: '#374151', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>1. Pharmacy: {dischargeSpawned ? '✓ Unused Antibiotics credited (-₹780)' : 'Pending medication reconciliation'}</div>
                  <div>2. Diagnostics: {dischargeSpawned ? '✓ Final Blood Sugar & LFT Signed-Off' : 'Pending final validation'}</div>
                  <div>3. TPA Desk: {dischargeSpawned ? '✓ NHCX Discharge Pre-Auth Bundle Dispatched' : 'Awaiting final summary'}</div>
                  <div>4. Housekeeping: {dischargeSpawned ? '✓ UV-C Sanitization Team Paged (Vacate in 15m)' : 'Idle'}</div>
                </div>
              </div>

              <div>
                <Button
                  variant="primary"
                  disabled={dischargeSpawned}
                  onClick={handleSpawnDischargePipeline}
                  style={{ width: '100%', padding: '10px', fontSize: '0.825rem', fontWeight: 800, backgroundColor: dischargeSpawned ? '#64748B' : '#10B981', color: '#FFFFFF' }}
                >
                  {dischargeSpawned ? '✓ 4 Parallel Workflows Active (45m Velocity)' : '⚡ Doctor Signs "Discharge Intention"'}
                </Button>
              </div>
            </Card>

            {/* ENGINE 5: Tamper-Evident Forensic Audit & Break-Glass Gate */}
            <Card style={{ padding: '22px', borderRadius: '16px', border: isBreakGlassUnlocked ? '1.5px solid #F59E0B' : '1.5px solid #64748B', backgroundColor: isBreakGlassUnlocked ? '#FFFBEB' : '#F8FAFC', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
              
              {/* Visual Forensic Watermark overlay when unlocked */}
              {isBreakGlassUnlocked && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    opacity: 0.12,
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    color: '#DC2626',
                    transform: 'rotate(-12deg)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    lineHeight: 2.2,
                    userSelect: 'none'
                  }}
                >
                  <span>DR_ARYAN_SHARMA | IP: 10.240.12.84 | 2026-10-04 | UHID: DS-VIP-001</span>
                  <span>FORENSIC TAMPER AUDIT LOGGED • UNAUTHORIZED CAPTURE IS PUNISHABLE UNDER IT ACT 66</span>
                  <span>DR_ARYAN_SHARMA | IP: 10.240.12.84 | 2026-10-04 | UHID: DS-VIP-001</span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: isBreakGlassUnlocked ? 'rgba(245,158,11,0.2)' : 'rgba(100,116,139,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                    {isBreakGlassUnlocked ? '🔓' : '🔒'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>
                      5. Tamper-Evident Forensic Audit & Break-Glass Gate
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      VIP Privacy Shield & Camera Leak Forensic Stamp
                    </div>
                  </div>
                </div>
                <Badge variant={isBreakGlassUnlocked ? 'warning' : 'neutral'}>
                  {isBreakGlassUnlocked ? '🔓 OVERRIDE UNLOCKED' : '🔒 VIP SHIELDED'}
                </Badge>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                  Restricted Patient: Hon. Dignitary • Suite 501 (UHID: DS-VIP-001)
                </div>
                {isBreakGlassUnlocked ? (
                  <div style={{ fontSize: '0.75rem', color: '#92400E' }}>
                    <div>• Unlocked by: <strong>Dr. Aryan Sharma (Consultant)</strong></div>
                    <div>• Justification: <strong>{breakGlassReason}</strong></div>
                    <div>• Forensic Hash: <strong style={{ fontFamily: 'monospace' }}>{forensicWatermarkHash}</strong></div>
                    <div>• Anti-Leak Watermark: Active across viewing layer.</div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Record is encrypted and shielded under Hospital VIP Data Protection. Regular staff access is blocked. Emergency access requires authenticated Break-Glass justification.
                  </div>
                )}
              </div>

              <div>
                {isBreakGlassUnlocked ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsBreakGlassUnlocked(false);
                      setForensicWatermarkHash(null);
                      showToast('🔒 VIP Record Re-Shielded & Audit Closed.');
                    }}
                    style={{ width: '100%', padding: '10px', fontSize: '0.825rem', fontWeight: 800, borderColor: '#F59E0B', color: '#B45309' }}
                  >
                    🔒 Re-Shield Record & Terminate Session
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    onClick={() => setShowBreakGlassModal(true)}
                    style={{ width: '100%', padding: '10px', fontSize: '0.825rem', fontWeight: 800, backgroundColor: '#DC2626', color: '#FFFFFF' }}
                  >
                    🚨 Break-Glass Emergency Override
                  </Button>
                )}
              </div>
            </Card>

          </div>

          {/* BREAK-GLASS MODAL */}
          {showBreakGlassModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '20px'
              }}
            >
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  maxWidth: '520px',
                  width: '100%',
                  padding: '24px',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
                  border: '2px solid #DC2626'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '1.8rem' }}>🚨</span>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#991B1B' }}>
                      BREAK-GLASS EMERGENCY OVERRIDE
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      VIP Record Access: Suite 501 • UHID: DS-VIP-001
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#FEF2F2', padding: '12px 14px', borderRadius: '10px', border: '1px solid #FECACA', fontSize: '0.78rem', color: '#991B1B', marginBottom: '16px', lineHeight: 1.4 }}>
                  ⚠️ <strong>LEGAL WARNING:</strong> This override is monitored by the Medical Superintendent & IT Forensic Desk. A permanent audit log will record your Doctor ID, Terminal IP, and exact timestamp.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                      Clinical Emergency Justification:
                    </label>
                    <select
                      value={breakGlassReason}
                      onChange={(e) => setBreakGlassReason(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#0F172A',
                        backgroundColor: '#FFFFFF'
                      }}
                    >
                      <option value="ACUTE_CARDIOPULMONARY_RESUSCITATION">Acute Cardiopulmonary Resuscitation / Code-Blue</option>
                      <option value="EMERGENCY_OT_INTAKE">Emergency OT / Acute Trauma Intake</option>
                      <option value="ON_DUTY_MEDICO_LEGAL_CONSULTATION">On-Duty Medico-Legal / Clinical Audit Review</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                      Authorized Consultant PIN:
                    </label>
                    <Input
                      type="password"
                      placeholder="Enter 4-Digit Security PIN (e.g. 7492)"
                      value={breakGlassPin}
                      onChange={(e) => setBreakGlassPin(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <Button
                    variant="outline"
                    onClick={() => setShowBreakGlassModal(false)}
                    style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    disabled={!breakGlassPin.trim()}
                    onClick={handleExecuteBreakGlass}
                    style={{ padding: '8px 18px', fontSize: '0.85rem', fontWeight: 800, backgroundColor: '#DC2626', color: '#FFFFFF' }}
                  >
                    🔓 Confirm Break-Glass
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* INTERACTIVE CLOSED-LOOP PIPELINE CARD (OPD / IPD) */
        <Card style={{ padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.3rem' }}>{loopMode === 'OPD' ? '🩺' : '🛏️'}</span>
                <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0F172A' }}>
                  {loopMode === 'OPD' ? 'OPD In-House Closed Loop Sequence' : 'IPD Bedside Closed Loop Sequence (ICU & Wards)'}
                </span>
                <Badge variant={loopMode === 'OPD' ? 'primary' : 'warning'}>
                  {loopMode === 'OPD' ? '7 In-House Stages' : '8 In-House Stages'}
                </Badge>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '3px' }}>
                {loopMode === 'OPD'
                  ? 'Mareez doctor ko dikhata hai ➔ In-house lab me sample deta hai ➔ Sub-second alert par doctor final dawai likhta hai ➔ Pharmacy se dawai lekar exit counter par print leta hai.'
                  : 'Doctor round par test likhta hai ➔ Ward nurse bedside sample leti hai ➔ Report doctor tablet par aati hai ➔ Pharmacy dawai ward me deliver karti hai.'}
              </div>
            </div>

            {/* SIMULATION TRIGGER BUTTON */}
            <Button
              variant="primary"
              disabled={isSimulating}
              onClick={handleRunSimulation}
              style={{
                padding: '10px 22px',
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: isSimulating ? '#64748B' : loopMode === 'OPD' ? '#0284C7' : '#7C3AED',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
              }}
            >
              <span>{isSimulating ? '⏳' : '⚡'}</span>
              <span>{isSimulating ? 'Simulation Running...' : `Run Live ${loopMode} Closed Loop`}</span>
            </Button>
          </div>

          {/* STEPPER PIPELINE GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(260px, 1fr))`, gap: '14px' }}>
            {currentSteps.map((step) => {
              const isCompleted = step.status === 'COMPLETED';
              const isActive = step.status === 'ACTIVE';

              return (
                <div
                  key={step.stepNumber}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '16px',
                    borderRadius: '12px',
                    border: isActive
                      ? '2px solid #0284C7'
                      : isCompleted
                      ? '1.5px solid #10B981'
                      : '1px solid #E2E8F0',
                    backgroundColor: isActive
                      ? '#F0F9FF'
                      : isCompleted
                      ? '#F0FDF4'
                      : '#F8FAFC',
                    boxShadow: isActive ? '0 6px 20px rgba(2, 132, 199, 0.18)' : 'none',
                    position: 'relative',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.35rem' }}>{step.icon}</span>
                      <span style={{ fontWeight: 800, color: isActive ? '#0369A1' : isCompleted ? '#065F46' : 'var(--ds-color-text-secondary, #94a3b8)', fontSize: '0.9rem' }}>
                        {step.title}
                      </span>
                    </div>
                    <Badge variant={isCompleted ? 'success' : isActive ? 'primary' : 'neutral'} style={{ fontSize: '0.7rem' }}>
                      {isCompleted ? '✓ Done' : isActive ? '● Active' : 'Pending'}
                    </Badge>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.4 }}>
                    {step.subtitle}
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                    <span style={{ fontWeight: 700, color: '#64748B' }}>{step.department}</span>
                    <span style={{ fontWeight: 800, color: isActive ? '#0284C7' : isCompleted ? '#10B981' : '#94A3B8' }}>
                      ⏱️ {step.latencyLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* QUICK LAUNCHERS INTO ACTUAL LIVE HOSPITAL DESKS */}
      <Card style={{ padding: '20px 24px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🚀</span> Quick Jump to Live Hospital Desks (Single-Click Access)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}>
          <Button
            variant="outline"
            onClick={() => onNavigateModule && onNavigateModule('opd-one-flow-express')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '10px 14px', fontWeight: 700, fontSize: '0.825rem' }}
          >
            <span>⚡</span> OPD 1-Flow Express
          </Button>

          <Button
            variant="outline"
            onClick={() => onNavigateModule && onNavigateModule('clinical-consultation')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '10px 14px', fontWeight: 700, fontSize: '0.825rem' }}
          >
            <span>🩺</span> Doctor OPD Desk
          </Button>

          <Button
            variant="outline"
            onClick={() => onNavigateModule && onNavigateModule('clinical-investigation')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '10px 14px', fontWeight: 700, fontSize: '0.825rem' }}
          >
            <span>🧪</span> Pathology LIMS Workbench
          </Button>

          <Button
            variant="outline"
            onClick={() => onNavigateModule && onNavigateModule('pharmacy-medication')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '10px 14px', fontWeight: 700, fontSize: '0.825rem' }}
          >
            <span>💊</span> In-House Pharmacy POS
          </Button>

          <Button
            variant="outline"
            onClick={() => onNavigateModule && onNavigateModule('help-desk-exit-hub')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '10px 14px', fontWeight: 700, fontSize: '0.825rem' }}
          >
            <span>🖨️</span> Central Exit & Print Hub
          </Button>

          <Button
            variant="outline"
            onClick={() => onNavigateModule && onNavigateModule('inpatient-management')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '10px 14px', fontWeight: 700, fontSize: '0.825rem' }}
          >
            <span>🛏️</span> Inpatient Beds & ADT
          </Button>
        </div>
      </Card>

      {/* REAL-TIME CLOSED-LOOP TELEMETRY LOG */}
      <Card style={{ padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📡</span> Live Closed-Loop Dispatch & Telemetry Stream
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
              Real-time audit log of all in-house events, laboratory sign-offs, and pharmacy dispatches.
            </div>
          </div>
          <Badge variant="success">● Live Event Bus Stream</Badge>
        </div>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>UHID / Token / Bed</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead>Event Description</TableHead>
                <TableHead>Source Dept</TableHead>
                <TableHead>Target Dept</TableHead>
                <TableHead>Turnaround</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {telemetryLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748B' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>📡</div>
                    <strong style={{ color: '#94A3B8', fontSize: '0.85rem' }}>No Telemetry Pulses Yet</strong>
                    <p style={{ fontSize: '0.74rem', margin: '4px 0 0' }}>Live operational events across Registration, Triage, Doctor Desk, Lab, and Pharmacy will stream here in real time.</p>
                  </TableCell>
                </TableRow>
              ) : (
                telemetryLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell style={{ fontSize: '0.8rem', color: '#64748B', fontFamily: 'monospace' }}>
                    {log.timestamp}
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.mode === 'OPD' ? 'primary' : 'warning'} style={{ fontSize: '0.72rem' }}>
                      {log.mode}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0F172A' }}>
                    <div>{log.uhid}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{log.tokenOrBed}</div>
                  </TableCell>
                  <TableCell style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    {log.patientName}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.82rem', color: '#1E293B', fontWeight: 600 }}>
                    {log.event}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8rem', color: '#475569' }}>
                    {log.sourceDepartment}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8rem', color: '#475569' }}>
                    {log.targetDepartment}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284C7' }}>
                    {log.turnaroundTime}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        log.status === 'SETTLED'
                          ? 'success'
                          : log.status === 'ALERTED'
                          ? 'info'
                          : log.status === 'DISPENSED'
                          ? 'primary'
                          : 'neutral'
                      }
                      style={{ fontSize: '0.7rem' }}
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
