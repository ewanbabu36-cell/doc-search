import React, { useState, useEffect } from 'react';
import {
  Card,
  Badge,
  Button,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import type { ExecutiveCommandSnapshotDto } from '@docsearch/api-contracts';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface PredictiveBedVacationItem {
  id: string;
  bedCode: string;
  wardUnit: string;
  unitType: 'ICU' | 'HDU' | 'GENERAL_WARD' | 'POST_OP';
  hasVentilator: boolean;
  ventilatorModel?: string | undefined;
  currentPatientName: string;
  currentPatientUhid: string;
  admissionDiagnosis: string;
  dischargeMilestoneStep: number; // 1: Doctor Signed, 2: Pharmacy Clearance, 3: TPA Final Sanction, 4: Housekeeping
  milestoneDescription: string;
  projectedVacateTime: string;
  estimatedMinutesRemaining: number;
  reservationStatus: 'OPEN_PROJECTED' | 'PRE_ALLOCATED_CASUALTY' | 'HOLD_FOR_AMBULANCE';
  allocatedTo?: string | undefined;
}

interface Props {
  snapshot: ExecutiveCommandSnapshotDto;
}

export const RealtimeHospitalCommandWallView: React.FC<Props> = ({ snapshot }) => {
  // 5-Second WebSocket Telemetry Heartbeat State
  const [pulseCount, setPulseCount] = useState(1);
  const [lastPulseTime, setLastPulseTime] = useState<string>(new Date().toLocaleTimeString());
  const [isPulseActive, setIsPulseActive] = useState(true);

  // Dynamic Occupancy & Velocity Counts (Live Streaming Simulation)
  const [opdFootfall, setOpdFootfall] = useState(184);
  const [erOccupancy, setErOccupancy] = useState(14);
  const [icuBedsOccupied, setIcuBedsOccupied] = useState(snapshot.icuBedsOccupied || 18);
  const [ventilatorsInUse, setVentilatorsInUse] = useState(snapshot.ventilatorsInUse || 12);
  const [pendingPharmacyPacks, setPendingPharmacyPacks] = useState(28);
  const [statLabCountdowns, setStatLabCountdowns] = useState(14);

  // Predictive Bed Turnaround Pipeline (Solving ICU Bed Crisis Blindspot)
  const [predictiveBeds, setPredictiveBeds] = useState<PredictiveBedVacationItem[]>([
    {
      id: 'BED-ICU-04',
      bedCode: 'ICU Bed 04',
      wardUnit: 'Main Medical ICU (Level 3)',
      unitType: 'ICU',
      hasVentilator: true,
      ventilatorModel: 'Hamilton G5 (#V-08)',
      currentPatientName: 'Ramesh Verma',
      currentPatientUhid: 'DS-9912',
      admissionDiagnosis: 'Post-CABG Day 4 / Stabilized',
      dischargeMilestoneStep: 3,
      milestoneDescription: 'TPA Final Sanction in Progress (Sanction bundle sent to Star Health)',
      projectedVacateTime: '01:30 PM',
      estimatedMinutesRemaining: 28,
      reservationStatus: 'PRE_ALLOCATED_CASUALTY',
      allocatedTo: 'ER Bay 02: Severe ARDS Pneumonia (SpO2 82%)'
    },
    {
      id: 'BED-ICU-09',
      bedCode: 'ICU Bed 09',
      wardUnit: 'Trauma & Surgical ICU',
      unitType: 'ICU',
      hasVentilator: true,
      ventilatorModel: 'Dräger Evita V300 (#V-02)',
      currentPatientName: 'Mohan Lal',
      currentPatientUhid: 'DS-4482',
      admissionDiagnosis: 'Severe Sepsis Recovery / Weaned',
      dischargeMilestoneStep: 2,
      milestoneDescription: 'Step-Down to HDU Ordered (Awaiting HDU receiving bed prep)',
      projectedVacateTime: '02:15 PM',
      estimatedMinutesRemaining: 73,
      reservationStatus: 'HOLD_FOR_AMBULANCE',
      allocatedTo: 'Inbound ALS Ambulance #04: Severe Shock / ETA 18 mins'
    },
    {
      id: 'BED-WRD-12',
      bedCode: 'Ward 3B, Bed 12',
      wardUnit: 'Surgical Inpatient Ward',
      unitType: 'GENERAL_WARD',
      hasVentilator: false,
      currentPatientName: 'Suresh Gupta',
      currentPatientUhid: 'DS-7714',
      admissionDiagnosis: 'Lap Cholecystectomy Post-Op Day 2',
      dischargeMilestoneStep: 4,
      milestoneDescription: 'Housekeeping UV-C Terminal Sanitization Active',
      projectedVacateTime: '01:15 PM',
      estimatedMinutesRemaining: 12,
      reservationStatus: 'OPEN_PROJECTED'
    },
    {
      id: 'BED-HDU-06',
      bedCode: 'HDU Bed 06',
      wardUnit: 'Step-Down High Dependency Unit',
      unitType: 'HDU',
      hasVentilator: false,
      currentPatientName: 'Anita Devi',
      currentPatientUhid: 'DS-3301',
      admissionDiagnosis: 'Diabetic Ketoacidosis Resolved',
      dischargeMilestoneStep: 3,
      milestoneDescription: 'Cash Counter Final Bill Clearance Underway',
      projectedVacateTime: '02:00 PM',
      estimatedMinutesRemaining: 58,
      reservationStatus: 'OPEN_PROJECTED'
    }
  ]);

  const [preAllocationNotice, setPreAllocationNotice] = useState<string | null>(null);

  // Live 5-Second Telemetry WebSocket Simulator
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setLastPulseTime(now.toLocaleTimeString());
      setPulseCount((prev) => prev + 1);
      setIsPulseActive(true);

      // Minor realistic jitter to mimic live hospital data
      setOpdFootfall((prev) => Math.max(160, prev + (Math.random() > 0.5 ? 1 : -1)));
      setPendingPharmacyPacks((prev) => Math.max(18, prev + (Math.random() > 0.6 ? 1 : -1)));
      setStatLabCountdowns((prev) => Math.max(8, prev + (Math.random() > 0.6 ? 1 : -1)));

      // Publish live heartbeat on hospital event bus
      hospitalEventBus.publish(
        'HOSPITAL_HEARTBEAT_PULSED',
        'ExecutiveCommandWall',
        {
          timestamp: now.toISOString(),
          opdFootfall,
          erOccupancy,
          icuOccupancyPct: ((icuBedsOccupied / 20) * 100).toFixed(1),
          ventilatorsInUse,
          pendingPharmacyPacks,
          statLabCountdowns
        },
        `📡 Executive Heartbeat Pulse #${pulseCount}: ICU ${icuBedsOccupied}/20 occupied (${ventilatorsInUse} vents active), ER ${erOccupancy}/16 bays.`
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [pulseCount, opdFootfall, erOccupancy, icuBedsOccupied, ventilatorsInUse, pendingPharmacyPacks, statLabCountdowns]);

  // Handle Bed Pre-Allocation to resolve Casualty ICU crisis
  const handlePreAllocateBed = (bedId: string, erPatientLabel: string) => {
    setErOccupancy((prev) => Math.max(0, prev - 1));
    setVentilatorsInUse((prev) => Math.min(14, prev + 1));
    setPredictiveBeds((prev) =>
      prev.map((b) =>
        b.id === bedId
          ? {
              ...b,
              reservationStatus: 'PRE_ALLOCATED_CASUALTY',
              allocatedTo: erPatientLabel
            }
          : b
      )
    );

    const targetBed = predictiveBeds.find((b) => b.id === bedId);
    const bedName = targetBed ? targetBed.bedCode : bedId;

    hospitalEventBus.publish(
      'ICU_BED_CRISIS_RESOLVED',
      'ExecutiveCommandWall',
      {
        bedId,
        bedCode: bedName,
        allocatedTo: erPatientLabel,
        projectedVacateTime: targetBed?.projectedVacateTime
      },
      `🚨 ICU Bed Crisis Resolved: ${bedName} pre-allocated to ${erPatientLabel} (Projected vacate: ${targetBed?.projectedVacateTime}).`
    );

    setPreAllocationNotice(`✓ ${bedName} successfully pre-allocated to ${erPatientLabel}. Casualty monitor updated.`);
    setTimeout(() => setPreAllocationNotice(null), 5000);
  };

  // Accelerate TPA Clearance to free ICU Bed 04 faster
  const handleAccelerateTpa = (bedId: string) => {
    setIcuBedsOccupied((prev) => Math.max(0, prev - 1));
    setPredictiveBeds((prev) =>
      prev.map((b) =>
        b.id === bedId
          ? {
              ...b,
              dischargeMilestoneStep: 4,
              milestoneDescription: '⚡ TPA Clearance Accelerated by Executive Command • Terminal Clean Assigned',
              projectedVacateTime: '01:18 PM',
              estimatedMinutesRemaining: 15
            }
          : b
      )
    );

    hospitalEventBus.publish(
      'EXECUTIVE_BOTTLENECK_DISPATCHED',
      'ExecutiveCommandWall',
      { bedId, action: 'ACCELERATE_TPA_CLEARANCE' },
      `🚀 Executive Command: TPA Final Sanction expedited for ICU Bed 04 to release life-support ventilator 15 mins early.`
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Telemetry Header & WebSocket Connection Bar */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(15, 23, 42, 0.98) 100%)',
        border: '1.5px solid rgba(14, 165, 233, 0.35)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.6rem' }}>🖥️</span>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
              Executive Situational Command Wall & Live Bed Telemetry
            </h1>
            <Badge variant="primary">WebSocket Live Mesh: 5s Pulse</Badge>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: 0 }}>
            Real-time hospital operating heartbeat, occupancy heatmaps, and AI predictive bed turnaround engine.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            backgroundColor: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: '10px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isPulseActive ? '#10B981' : '#64748B',
              boxShadow: isPulseActive ? '0 0 10px #10B981' : 'none'
            }} />
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              <div>Heartbeat: <strong style={{ color: '#F8FAFC' }}>{lastPulseTime}</strong> (Packet #{pulseCount})</div>
              <div style={{ fontSize: '0.68rem', color: '#38BDF8' }}>Latency: 12ms • Zero Packet Loss</div>
            </div>
          </div>
        </div>
      </div>

      {preAllocationNotice && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          border: '1.5px solid #10B981',
          color: '#10B981',
          fontSize: '0.85rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>✓</span>
          <span>{preAllocationNotice}</span>
        </div>
      )}

      {/* Emergency Active Code Alert Banner */}
      {snapshot.activeEmergencyCodes && snapshot.activeEmergencyCodes.length > 0 && (
        <div style={{
          padding: '14px 18px',
          backgroundColor: '#991B1B',
          borderRadius: '12px',
          border: '1.5px solid #EF4444',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.8rem' }}>🚨</span>
            <div>
              <span style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.95rem', display: 'block' }}>
                ACTIVE EMERGENCY CODE: {snapshot.activeEmergencyCodes[0]?.codeType}
              </span>
              <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                Location: {snapshot.activeEmergencyCodes[0]?.location} • Declared: {snapshot.activeEmergencyCodes[0]?.declaredAt.replace('T', ' ').substring(0, 16)}
              </span>
            </div>
          </div>
          <Badge variant="danger">IMMEDIATE STAT ESCALATION</Badge>
        </div>
      )}

      {/* 6-Sector Real-Time Occupancy Heatmap Matrix */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '1.2rem' }}>💓</span>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
            Live Hospital Heartbeat Telemetry Heatmap (5-Second Pulse)
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          
          {/* Sector 1: OPD Footfall */}
          <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                1. OPD Ambulatory Footfall
              </span>
              <Badge variant="success">Normal Flow</Badge>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#38BDF8', marginTop: '4px' }}>
              {opdFootfall} Active
            </div>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px' }}>
              38 waiting in lounges • Avg Wait: <strong>14.2 mins</strong>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '2px' }}>
              Consultation Velocity: 4.8 patients / doc / hr
            </div>
          </Card>

          {/* Sector 2: Emergency Casualty & NEDOCS */}
          <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                2. ER & Trauma Casualty
              </span>
              <Badge variant="danger">NEDOCS: 148</Badge>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#EF4444', marginTop: '4px' }}>
              {erOccupancy} / 16 Bays (87.5%)
            </div>
            <div style={{ fontSize: '0.75rem', color: '#FCA5A5', marginTop: '4px' }}>
              <strong>3 Severe Pneumonia patients</strong> awaiting ICU step-up
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>
              Red Triage Resus: 2 • Ambulance Inbound: 1 (ETA 18m)
            </div>
          </Card>

          {/* Sector 3: ICU Bed & Life-Support Ventilators */}
          <Card style={{ backgroundColor: '#0F172A', border: '1.5px solid #EF4444', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 800, textTransform: 'uppercase' }}>
                3. ICU Bed & Life-Support
              </span>
              <Badge variant="danger">ICU CRISIS</Badge>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#EF4444', marginTop: '4px' }}>
              {icuBedsOccupied} / 20 Beds (90%)
            </div>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px' }}>
              Ventilators: <strong style={{ color: '#EF4444' }}>{ventilatorsInUse} / 14 In Use</strong> (85.7%)
            </div>
            <div style={{ fontSize: '0.7rem', color: '#FCD34D', marginTop: '2px' }}>
              ⚠️ Critical Buffer: 2 physical open beds vs 3 urgent ER indents
            </div>
          </Card>

          {/* Sector 4: Operating Theatre Complex */}
          <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                4. OT Surgical Suites
              </span>
              <Badge variant="primary">5 / 6 Active</Badge>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#A855F7', marginTop: '4px' }}>
              {snapshot.surgeriesInProgressCount || 5} Surgeries
            </div>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px' }}>
              Case Overruns: <strong style={{ color: '#F59E0B' }}>2 cases delayed (+45m & +70m)</strong>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>
              PAC Clearances today: 12 • CSSD autoclave pass: 100%
            </div>
          </Card>

          {/* Sector 5: Central Pharmacy Fast-Pack Desk */}
          <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                5. Pharmacy Ward Fast-Pack
              </span>
              <Badge variant="success">Fast Velocity</Badge>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
              {pendingPharmacyPacks} Packs Queue
            </div>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px' }}>
              Dose Packing Velocity: <strong>6.8 mins / pack</strong>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#38BDF8', marginTop: '2px' }}>
              Discharge Medication Clearance: 18 slips finalized
            </div>
          </Card>

          {/* Sector 6: STAT Diagnostic Labs & PACS */}
          <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                6. STAT Diagnostics & PACS
              </span>
              <Badge variant="warning">TAT Priority</Badge>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>
              {statLabCountdowns} STAT Samples
            </div>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px' }}>
              Trauma Bay Scans: <strong>3 CT Brain in Queue</strong>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#EF4444', marginTop: '2px' }}>
              Critical Panic Alert: Potassium 6.8 mEq/L (Readback done)
            </div>
          </Card>

        </div>
      </div>

      {/* Predictive Bed Turnaround Engine (Solving ICU Bed Crisis Blindspot) */}
      <Card style={{ backgroundColor: '#0F172A', border: '1.5px solid #38BDF8', borderRadius: '16px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.3rem' }}>🛏️</span>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
                AI Predictive Bed Turnaround Engine • ICU Crisis Resolver
              </h2>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
              Eliminates the casualty blindspot by projecting exact bed vacation countdowns based on doctor discharge sign-off, pharmacy clearance, and TPA settlement.
            </p>
          </div>

          <Badge variant="primary">Forward Prediction Horizon: 2 Hours</Badge>
        </div>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bed & Unit</TableHead>
                <TableHead>Life-Support Ventilator</TableHead>
                <TableHead>Current Patient & Clinical Status</TableHead>
                <TableHead>Discharge Pipeline Progress</TableHead>
                <TableHead>Projected Vacate Time</TableHead>
                <TableHead>Casualty Reservation Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Executive Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {predictiveBeds.map((bed) => (
                <TableRow key={bed.id}>
                  <TableCell>
                    <div style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.88rem' }}>{bed.bedCode}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{bed.wardUnit}</div>
                    <Badge variant={bed.unitType === 'ICU' ? 'danger' : bed.unitType === 'HDU' ? 'warning' : 'neutral'}>
                      {bed.unitType}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {bed.hasVentilator ? (
                      <div>
                        <Badge variant="primary">VENTILATOR READY</Badge>
                        <div style={{ fontSize: '0.7rem', color: '#38BDF8', marginTop: '2px', fontWeight: 600 }}>
                          {bed.ventilatorModel}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#64748B', fontSize: '0.75rem' }}>No Ventilator</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.82rem' }}>
                      {bed.currentPatientName} ({bed.currentPatientUhid})
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                      {bed.admissionDiagnosis}
                    </div>
                  </TableCell>

                  <TableCell style={{ minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38BDF8' }}>
                        Step {bed.dischargeMilestoneStep} of 4
                      </span>
                    </div>
                    {/* 4-Segment Progress Bar */}
                    <div style={{ display: 'flex', gap: '3px', width: '100%', height: '6px', backgroundColor: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ flex: 1, backgroundColor: bed.dischargeMilestoneStep >= 1 ? '#10B981' : 'transparent' }} />
                      <div style={{ flex: 1, backgroundColor: bed.dischargeMilestoneStep >= 2 ? '#10B981' : 'transparent' }} />
                      <div style={{ flex: 1, backgroundColor: bed.dischargeMilestoneStep >= 3 ? '#10B981' : 'transparent' }} />
                      <div style={{ flex: 1, backgroundColor: bed.dischargeMilestoneStep >= 4 ? '#10B981' : 'transparent' }} />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#CBD5E1', marginTop: '4px' }}>
                      {bed.milestoneDescription}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#10B981' }}>
                      {bed.projectedVacateTime}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#FCD34D', fontWeight: 700 }}>
                      ⏱️ In ~{bed.estimatedMinutesRemaining} mins
                    </div>
                  </TableCell>

                  <TableCell>
                    {bed.reservationStatus === 'PRE_ALLOCATED_CASUALTY' ? (
                      <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '6px 8px', borderRadius: '6px', border: '1px solid #EF4444' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#EF4444' }}>
                          🔒 PRE-ALLOCATED TO ER
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#FCA5A5', marginTop: '2px' }}>
                          {bed.allocatedTo}
                        </div>
                      </div>
                    ) : bed.reservationStatus === 'HOLD_FOR_AMBULANCE' ? (
                      <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', padding: '6px 8px', borderRadius: '6px', border: '1px solid #F59E0B' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#F59E0B' }}>
                          🚑 AMBULANCE HOLD
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#FDE68A', marginTop: '2px' }}>
                          {bed.allocatedTo}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="success">AVAILABLE FOR PRE-ALLOCATION</Badge>
                    )}
                  </TableCell>

                  <TableCell style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                      {bed.reservationStatus === 'OPEN_PROJECTED' ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handlePreAllocateBed(bed.id, 'ER Bay 03: Severe Pneumonia Transfer')}
                          style={{ fontWeight: 800, fontSize: '0.72rem' }}
                        >
                          ⚡ Pre-Allocate for ER
                        </Button>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>✓ Reserved</span>
                      )}

                      {bed.id === 'BED-ICU-04' && bed.dischargeMilestoneStep === 3 && (
                        <button
                          type="button"
                          onClick={() => handleAccelerateTpa(bed.id)}
                          style={{
                            padding: '3px 8px',
                            backgroundColor: 'rgba(56, 189, 248, 0.15)',
                            border: '1px solid #38BDF8',
                            borderRadius: '4px',
                            color: '#38BDF8',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          🚀 Accelerate TPA (-13m)
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
