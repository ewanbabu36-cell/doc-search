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
  TableCell
} from '@docsearch/ui-kit';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';
import type { PartnerModuleKey } from '../PartnerPlatformShell.js';

export type HospitalLoopMode = 'OPD' | 'IPD';

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

  const currentSteps = loopMode === 'OPD' ? opdSteps : ipdSteps;

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

      {/* INTERACTIVE CLOSED-LOOP PIPELINE CARD */}
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
                    <span style={{ fontWeight: 800, color: isActive ? '#0369A1' : isCompleted ? '#065F46' : '#334155', fontSize: '0.9rem' }}>
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
