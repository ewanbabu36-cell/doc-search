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
  TableCell,
  Input
} from '@docsearch/ui-kit';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface ClinicalEncounterChargeBinding {
  id: string;
  eventType: 'DOCTOR_ROUND_COMPLETED' | 'ULTRASOUND_PERFORMED' | 'DRESSING_CHANGE_COMPLETED' | 'NEBULIZATION_GIVEN' | 'STAT_ABG_PERFORMED' | 'STAT_12LEAD_ECG';
  patientName: string;
  patientUhid: string;
  location: string;
  clinicianName: string;
  serviceDescription: string;
  tariffAmount: number;
  clinicalEvidence: string;
  timestamp: string;
  status: 'AUTO_POSTED' | 'UNBILLED_LEAKAGE';
  ledgerReference?: string | undefined;
}

export interface CashCounterShiftAudit {
  counterId: string;
  counterName: string;
  shiftName: string;
  cashierName: string;
  expectedDrawerCash: number;
  blindCountedCash: number | null;
  variance: number;
  status: 'OPEN' | 'BALANCED' | 'DISCREPANCY_LOCKED' | 'OVERRIDDEN_RESOLVED';
  discrepancyReason?: string | undefined;
  supervisorOverrideBy?: string | undefined;
}

export const RcmAntiLeakageDeskView: React.FC = () => {
  // Real-Time Auto-Posting Engine Switch
  const [isAutoPostingActive, setIsAutoPostingActive] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'UNBILLED' | 'AUTO_POSTED'>('ALL');

  // Clinical Encounter Stream (Action-to-Charge Binding Radar)
  const [encounters, setEncounters] = useState<ClinicalEncounterChargeBinding[]>([
    {
      id: 'ENC-901',
      eventType: 'DOCTOR_ROUND_COMPLETED',
      patientName: 'Ramesh Kumar',
      patientUhid: 'DS-9921',
      location: 'Ward 3B, Bed 12',
      clinicianName: 'Dr. Priya Nair (Sr. Consultant)',
      serviceDescription: 'Consultant Inpatient Daily Ward Round',
      tariffAmount: 1200,
      clinicalEvidence: 'Progress note signed: Post-laparoscopy Day 2, surgical drain minimal, vitals stable, oral diet initiated.',
      timestamp: '10:45 AM',
      status: 'AUTO_POSTED',
      ledgerReference: 'LED-TX-9912'
    },
    {
      id: 'ENC-902',
      eventType: 'ULTRASOUND_PERFORMED',
      patientName: 'Vikram Malhotra',
      patientUhid: 'DS-4482',
      location: 'ICU, Bed 04',
      clinicianName: 'Dr. S. K. Verma (Radiology)',
      serviceDescription: 'Bedside Portable Ultrasound (FAST Scan)',
      tariffAmount: 2800,
      clinicalEvidence: 'PACS DICOM study uploaded: Portable FAST scan completed at bedside. Zero billing charge entered by ward.',
      timestamp: '11:15 AM',
      status: 'UNBILLED_LEAKAGE'
    },
    {
      id: 'ENC-903',
      eventType: 'DRESSING_CHANGE_COMPLETED',
      patientName: 'Sunita Sharma',
      patientUhid: 'DS-7714',
      location: 'Female Surg Ward, Bed 08',
      clinicianName: 'Staff Nurse Sunita (RN)',
      serviceDescription: 'Complex Sterile Post-Op Wound Dressing',
      tariffAmount: 650,
      clinicalEvidence: 'Nursing e-MAR sheet: Abdominal dressing changed under aseptic conditions with sterile chlorhexidine kit.',
      timestamp: '11:50 AM',
      status: 'UNBILLED_LEAKAGE'
    },
    {
      id: 'ENC-904',
      eventType: 'NEBULIZATION_GIVEN',
      patientName: 'Mohd. Tariq',
      patientUhid: 'DS-1189',
      location: 'Ward 2A, Bed 06',
      clinicianName: 'Staff Nurse Rakesh (RN)',
      serviceDescription: 'Inpatient Jet Nebulization Therapy',
      tariffAmount: 350,
      clinicalEvidence: 'Nursing chart: 2.5ml Duolin jet nebulization administered, respiratory distress resolved.',
      timestamp: '12:20 PM',
      status: 'AUTO_POSTED',
      ledgerReference: 'LED-TX-9934'
    },
    {
      id: 'ENC-905',
      eventType: 'STAT_ABG_PERFORMED',
      patientName: 'Anjali Roy',
      patientUhid: 'DS-3302',
      location: 'Trauma Bay 01',
      clinicianName: 'Dr. Arvind Mehra (Emergency Reg.)',
      serviceDescription: 'Point-of-Care STAT Arterial Blood Gas (ABG)',
      tariffAmount: 1150,
      clinicalEvidence: 'Critical care POC analyzer slip: pH 7.29, pCO2 46, pO2 84, Lactate 3.1. Missing from patient billing ledger.',
      timestamp: '12:45 PM',
      status: 'UNBILLED_LEAKAGE'
    },
    {
      id: 'ENC-906',
      eventType: 'STAT_12LEAD_ECG',
      patientName: 'Harish Chandra',
      patientUhid: 'DS-6601',
      location: 'Cardiology Bay 02',
      clinicianName: 'Dr. Neha Kapoor (Cardiology)',
      serviceDescription: '12-Lead Emergency Electrocardiogram (ECG)',
      tariffAmount: 500,
      clinicalEvidence: '12-lead ECG trace synced: Sinus tachycardia, no ST segment elevation.',
      timestamp: '01:10 PM',
      status: 'AUTO_POSTED',
      ledgerReference: 'LED-TX-9948'
    }
  ]);

  // Cash Galla Counters State
  const [counters, setCounters] = useState<CashCounterShiftAudit[]>([
    {
      counterId: 'CTR-01',
      counterName: 'OPD Main Lobby',
      shiftName: 'Shift A (08:00 - 16:00)',
      cashierName: 'Pooja Sharma (#CSH-084)',
      expectedDrawerCash: 20150,
      blindCountedCash: 20150,
      variance: 0,
      status: 'BALANCED'
    },
    {
      counterId: 'CTR-02',
      counterName: 'Emergency & Casualty Desk',
      shiftName: 'Shift B (16:00 - 00:00)',
      cashierName: 'Rajesh Gupta (#CSH-092)',
      expectedDrawerCash: 42300,
      blindCountedCash: 39100,
      variance: -3200,
      status: 'DISCREPANCY_LOCKED',
      discrepancyReason: 'Unrecorded Emergency Cash Advance Refund to relative'
    },
    {
      counterId: 'CTR-03',
      counterName: 'IPD Pharmacy Night Desk',
      shiftName: 'Shift A (08:00 - 16:00)',
      cashierName: 'Anil Verma (#CSH-077)',
      expectedDrawerCash: 15400,
      blindCountedCash: 15400,
      variance: 0,
      status: 'BALANCED'
    }
  ]);

  // Supervisor Override State for Counter 02
  const [selectedCounterForOverride, setSelectedCounterForOverride] = useState<string | null>('CTR-02');
  const [supervisorPin, setSupervisorPin] = useState('');
  const [overrideReason, setOverrideReason] = useState('UNRECORDED_EMERGENCY_REFUND');
  const [overrideNotes, setOverrideNotes] = useState('Verified emergency trauma cash refund slip #REF-4410 signed by attendant.');
  const [overrideSuccessMessage, setOverrideSuccessMessage] = useState<string | null>(null);

  // Subscribe to external real-time events
  useEffect(() => {
    const unsubCharge = hospitalEventBus.subscribe('CLINICAL_SERVICE_AUTO_CHARGED', (payload) => {
      console.log('[RCM Desk] Real-time auto-charged event received:', payload);
    });

    const unsubOverride = hospitalEventBus.subscribe('CASHIER_VARIANCE_OVERRIDDEN', (payload) => {
      console.log('[RCM Desk] Real-time variance overridden:', payload);
    });

    return () => {
      uncharge();
      unsubOverride();
    };

    function uncharge() {
      unsubCharge();
    }
  }, []);

  // Compute Leakage Metrics
  const totalPreventedInr = encounters
    .filter((e) => e.status === 'AUTO_POSTED')
    .reduce((sum, e) => sum + e.tariffAmount, 0);

  const pendingLeakageInr = encounters
    .filter((e) => e.status === 'UNBILLED_LEAKAGE')
    .reduce((sum, e) => sum + e.tariffAmount, 0);

  const pendingLeakageCount = encounters.filter((e) => e.status === 'UNBILLED_LEAKAGE').length;

  // 1-Click Auto-Post Handler for single encounter
  const handleAutoPostEncounter = (id: string) => {
    const target = encounters.find((e) => e.id === id);
    if (!target) return;

    const updatedLedgerRef = `LED-TX-${Date.now().toString().slice(-4)}`;

    setEncounters((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, status: 'AUTO_POSTED', ledgerReference: updatedLedgerRef }
          : e
      )
    );

    hospitalEventBus.publish(
      'CLINICAL_SERVICE_AUTO_CHARGED',
      'RcmAntiLeakageDesk',
      {
        encounterId: target.id,
        eventType: target.eventType,
        patientName: target.patientName,
        patientUhid: target.patientUhid,
        serviceDescription: target.serviceDescription,
        tariffAmount: target.tariffAmount,
        ledgerReference: updatedLedgerRef
      },
      `⚡ Clinical Action Bound: ${target.serviceDescription} (₹${target.tariffAmount}) auto-posted to ${target.patientName} (${target.patientUhid}) unbilled ledger.`
    );
  };

  // Auto-Post All Pending Leakage Items
  const handleAutoPostAll = () => {
    const pending = encounters.filter((e) => e.status === 'UNBILLED_LEAKAGE');
    if (pending.length === 0) return;

    setEncounters((prev) =>
      prev.map((e) =>
        e.status === 'UNBILLED_LEAKAGE'
          ? { ...e, status: 'AUTO_POSTED', ledgerReference: `LED-TX-${Date.now().toString().slice(-4)}` }
          : e
      )
    );

    hospitalEventBus.publish(
      'CLINICAL_SERVICE_AUTO_CHARGED',
      'RcmAntiLeakageDesk',
      {
        recoveredCount: pending.length,
        totalRecoveredAmount: pendingLeakageInr
      },
      `⚡ Batch Anti-Leakage Binding: ${pending.length} uncaptured clinical services totaling ₹${pendingLeakageInr.toLocaleString('en-IN')} auto-posted to patient IPD accounts.`
    );
  };

  // Handle Supervisor PIN Override for Galla Discrepancy
  const handleExecuteSupervisorOverride = (counterId: string) => {
    if (!supervisorPin.trim()) return;

    setCounters((prev) =>
      prev.map((c) =>
        c.counterId === counterId
          ? {
              ...c,
              status: 'OVERRIDDEN_RESOLVED',
              supervisorOverrideBy: `Rajesh Malhotra (CAO) [PIN: ****] - Reason: ${overrideReason}`
            }
          : c
      )
    );

    hospitalEventBus.publish(
      'CASHIER_VARIANCE_OVERRIDDEN',
      'RcmAntiLeakageDesk',
      {
        counterId,
        supervisor: 'Rajesh Malhotra (CAO)',
        reason: overrideReason,
        notes: overrideNotes
      },
      `🛡️ Shift Lockout Overridden: Counter ${counterId} cash discrepancy authorized by Supervisor PIN.`
    );

    setOverrideSuccessMessage(`Counter ${counterId} discrepancy successfully authorized. Cashier shift closure unlocked.`);
    setTimeout(() => setOverrideSuccessMessage(null), 4000);
  };

  // Simulate New Incoming Bedside Clinical Encounter
  const handleSimulateNewEncounter = () => {
    const newId = `ENC-${Math.floor(100 + Math.random() * 900)}`;
    const newEncounter: ClinicalEncounterChargeBinding = {
      id: newId,
      eventType: 'DOCTOR_ROUND_COMPLETED',
      patientName: 'Kavita Singhal',
      patientUhid: 'DS-5520',
      location: 'Ward 4A, Bed 03',
      clinicianName: 'Dr. Anand Joshi (General Surg)',
      serviceDescription: 'Consultant Specialist Round & Drain Assessment',
      tariffAmount: 1200,
      clinicalEvidence: 'Doctor round clinical note saved: Surgical drain removed, wound dry, oral analgesics continued.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: isAutoPostingActive ? 'AUTO_POSTED' : 'UNBILLED_LEAKAGE',
      ledgerReference: isAutoPostingActive ? `LED-TX-${Date.now().toString().slice(-4)}` : undefined
    };

    setEncounters((prev) => [newEncounter, ...prev]);

    if (isAutoPostingActive) {
      hospitalEventBus.publish(
        'CLINICAL_SERVICE_AUTO_CHARGED',
        'RcmAntiLeakageDesk',
        newEncounter,
        `⚡ Real-time EMR Action Bound: Consultant Ward Round (₹1,200) auto-charged to Kavita Singhal (${newEncounter.patientUhid}).`
      );
    } else {
      hospitalEventBus.publish(
        'UNBILLED_LEAKAGE_DETECTED',
        'RcmAntiLeakageDesk',
        newEncounter,
        `⚠️ Revenue Leakage Detected: Consultant Ward Round for Kavita Singhal (₹1,200) completed but unbilled!`
      );
    }
  };

  const filteredEncounters = encounters.filter((e) => {
    if (filterType === 'UNBILLED') return e.status === 'UNBILLED_LEAKAGE';
    if (filterType === 'AUTO_POSTED') return e.status === 'AUTO_POSTED';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1.5px solid rgba(239, 68, 68, 0.35)',
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
            <span style={{ fontSize: '1.6rem' }}>🛡️</span>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
              Revenue Cycle Management (RCM) & Anti-Leakage Desk
            </h1>
            <Badge variant="danger">Zero Revenue Leakage Protocol</Badge>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: 0 }}>
            Automated clinical-action-to-charge binding engine for unbilled bedside services alongside blind dual-count cash galla reconciliation gates.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => setIsAutoPostingActive(!isAutoPostingActive)}
            style={{
              padding: '8px 14px',
              backgroundColor: isAutoPostingActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: `1.5px solid ${isAutoPostingActive ? '#10B981' : '#EF4444'}`,
              borderRadius: '8px',
              color: isAutoPostingActive ? '#10B981' : '#EF4444',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            {isAutoPostingActive ? '⚡ Auto-Posting Engine: ACTIVE' : '⏸️ Auto-Posting: SUSPENDED'}
          </button>

          <Button variant="outline" size="sm" onClick={handleSimulateNewEncounter} style={{ fontWeight: 700 }}>
            + Simulate EMR Clinical Action
          </Button>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
            🛡️ Recovered Revenue Today
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
            ₹{totalPreventedInr.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
            {encounters.filter((e) => e.status === 'AUTO_POSTED').length} clinical actions auto-bound to ledger
          </div>
        </Card>

        <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
            ⚠️ At-Risk Unbilled Leakage
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#EF4444', marginTop: '4px' }}>
            ₹{pendingLeakageInr.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#F87171', marginTop: '2px' }}>
            {pendingLeakageCount} performed clinical actions unbilled
          </div>
        </Card>

        <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
            💼 Cash Galla Audit Status
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>
            1 Discrepancy Gate
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
            Counter 02: -₹3,200 shortage requires Supervisor PIN
          </div>
        </Card>

        <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
            📊 Estimated Recovery Rate
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38BDF8', marginTop: '4px' }}>
            {((totalPreventedInr / (totalPreventedInr + pendingLeakageInr || 1)) * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
            Zero-entry clinical-action-to-charge capture
          </div>
        </Card>
      </div>

      {/* Pillar 12 Component 1: Clinical-Action-to-Charge Binding Radar */}
      <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>⚡</span>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                Point-of-Care Clinical-Action-to-Charge Binding Radar
              </h2>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
              Detects doctor ward rounds, bedside portable scans, dressing changes, and emergency POC procedures to eliminate 8-12% unbilled leakage.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#1E293B', padding: '3px', borderRadius: '6px' }}>
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: filterType === 'ALL' ? '#38BDF8' : 'transparent',
                  color: filterType === 'ALL' ? '#0F172A' : '#94A3B8'
                }}
              >
                All ({encounters.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('UNBILLED')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: filterType === 'UNBILLED' ? '#EF4444' : 'transparent',
                  color: filterType === 'UNBILLED' ? '#FFFFFF' : '#94A3B8'
                }}
              >
                Unbilled ({pendingLeakageCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('AUTO_POSTED')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: filterType === 'AUTO_POSTED' ? '#10B981' : 'transparent',
                  color: filterType === 'AUTO_POSTED' ? '#0F172A' : '#94A3B8'
                }}
              >
                Auto-Posted ({encounters.length - pendingLeakageCount})
              </button>
            </div>

            {pendingLeakageCount > 0 && (
              <Button variant="primary" size="sm" onClick={handleAutoPostAll} style={{ fontWeight: 800 }}>
                ⚡ Auto-Post All Unbilled (₹{pendingLeakageInr.toLocaleString('en-IN')})
              </Button>
            )}
          </div>
        </div>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Clinical Event & Inpatient</TableHead>
                <TableHead>Ward / Bed</TableHead>
                <TableHead>Clinical Evidence in EMR</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Tariff</TableHead>
                <TableHead>Binding Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEncounters.map((enc) => (
                <TableRow key={enc.id}>
                  <TableCell style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{enc.timestamp}</TableCell>
                  <TableCell>
                    <div style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.85rem' }}>{enc.serviceDescription}</div>
                    <div style={{ fontSize: '0.72rem', color: '#38BDF8' }}>
                      {enc.patientName} • {enc.patientUhid}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{enc.clinicianName}</div>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8rem', color: '#CBD5E1', fontWeight: 600 }}>{enc.location}</TableCell>
                  <TableCell style={{ fontSize: '0.74rem', color: '#94A3B8', maxWidth: '320px' }}>
                    <div style={{ fontStyle: 'italic' }}>"{enc.clinicalEvidence}"</div>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right', fontWeight: 900, color: '#10B981', fontSize: '0.9rem' }}>
                    ₹{enc.tariffAmount.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    {enc.status === 'AUTO_POSTED' ? (
                      <div>
                        <Badge variant="success">⚡ AUTO-POSTED</Badge>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '2px', fontFamily: 'monospace' }}>
                          {enc.ledgerReference}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="danger">⚠️ UNBILLED LEAKAGE</Badge>
                    )}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    {enc.status === 'UNBILLED_LEAKAGE' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAutoPostEncounter(enc.id)}
                        style={{ fontWeight: 700, fontSize: '0.72rem' }}
                      >
                        ⚡ Bind to IPD Bill
                      </Button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>✓ Bound</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Pillar 12 Component 2: Blind Dual-Count Shift Cash Reconciliation Gate */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
        
        {/* Left: Hospital Cash Galla Counters Status */}
        <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>💵</span>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                  Hospital Cash Galla Counters • Shift Tally Desk
                </h3>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                Blind dual-count protocol prevents shift handover until variance is reconciled or supervisor authorized.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {counters.map((c) => (
              <div
                key={c.counterId}
                onClick={() => setSelectedCounterForOverride(c.counterId)}
                style={{
                  backgroundColor: selectedCounterForOverride === c.counterId ? 'rgba(56, 189, 248, 0.12)' : '#1E293B',
                  borderRadius: '10px',
                  padding: '14px',
                  cursor: 'pointer',
                  border: selectedCounterForOverride === c.counterId
                    ? '1.5px solid #38BDF8'
                    : c.status === 'DISCREPANCY_LOCKED'
                    ? '1.5px solid #EF4444'
                    : '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.88rem' }}>{c.counterName}</span>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>({c.counterId})</span>
                  </div>
                  <Badge variant={c.status === 'BALANCED' ? 'success' : c.status === 'DISCREPANCY_LOCKED' ? 'danger' : 'primary'}>
                    {c.status === 'DISCREPANCY_LOCKED' ? '🚨 HARD LOCKOUT' : c.status === 'OVERRIDDEN_RESOLVED' ? 'AUTHORIZED OVERRIDE' : 'BALANCED'}
                  </Badge>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem', color: '#94A3B8' }}>
                  <div>Cashier: <strong style={{ color: '#F8FAFC' }}>{c.cashierName}</strong></div>
                  <div>Shift: <strong style={{ color: '#CBD5E1' }}>{c.shiftName}</strong></div>
                  <div>Expected Drawer: <strong style={{ color: '#38BDF8' }}>₹{c.expectedDrawerCash.toLocaleString('en-IN')}</strong></div>
                  <div>Counted Cash: <strong style={{ color: c.variance === 0 ? '#10B981' : '#EF4444' }}>
                    {c.blindCountedCash !== null ? `₹${c.blindCountedCash.toLocaleString('en-IN')}` : 'Pending'}
                  </strong></div>
                </div>

                {c.status === 'DISCREPANCY_LOCKED' && (
                  <div style={{
                    marginTop: '10px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #EF4444',
                    fontSize: '0.75rem',
                    color: '#FCA5A5'
                  }}>
                    <strong>🚨 Shortage Detected: -₹{Math.abs(c.variance).toLocaleString('en-IN')}</strong> (Drawer ₹39,100 vs Expected ₹42,300).
                    <div style={{ marginTop: '2px', color: '#CBD5E1' }}>
                      Next cashier shift login blocked. Supervisor Biometric / PIN authorization required.
                    </div>
                  </div>
                )}

                {c.status === 'OVERRIDDEN_RESOLVED' && c.supervisorOverrideBy && (
                  <div style={{
                    marginTop: '8px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10B981',
                    fontSize: '0.72rem',
                    color: '#10B981'
                  }}>
                    ✓ Shift Unlocked: {c.supervisorOverrideBy}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Right: Supervisor Biometric & PIN Discrepancy Gate */}
        <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🔒</span>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                Supervisor Discrepancy Override Gate
              </h3>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
              Statutory verification console for unresolved shift cash variances prior to shift changeover.
            </p>
          </div>

          {overrideSuccessMessage && (
            <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#10B981', fontSize: '0.8rem', fontWeight: 700 }}>
              {overrideSuccessMessage}
            </div>
          )}

          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
              Target Locked Counter: <strong style={{ color: '#F8FAFC' }}>Counter 02 (Emergency & Casualty Desk)</strong>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
              Flagged Discrepancy: <strong style={{ color: '#EF4444' }}>-₹3,200 Cash Shortage</strong>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '4px' }}>
                Discrepancy Justification Category *
              </label>
              <select
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#0F172A',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: '#F8FAFC',
                  fontSize: '0.8rem'
                }}
              >
                <option value="UNRECORDED_EMERGENCY_REFUND">Unrecorded Emergency Patient Refund</option>
                <option value="TRANSIT_CASH_FLOAT_MISMATCH">Transit Cash Float Mismatch</option>
                <option value="DRAWER_COUNT_INVESTIGATION">Counter Shortage Under Investigation</option>
                <option value="APPROVED_EXPENSE_VOUCHER">Approved Emergency Petty Expense Voucher</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '4px' }}>
                Supervisor Audit Remarks *
              </label>
              <Input
                value={overrideNotes}
                onChange={(e) => setOverrideNotes(e.target.value)}
                placeholder="Audit explanation for releasing shift lockout"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '4px' }}>
                Chief Accounts Officer / Supervisor PIN *
              </label>
              <Input
                type="password"
                placeholder="Enter 4-digit PIN (e.g. 9944)"
                value={supervisorPin}
                onChange={(e) => setSupervisorPin(e.target.value)}
              />
              <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
                Authorized Supervisor: <strong>Rajesh Malhotra (Chief Accounts Officer)</strong>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={() => handleExecuteSupervisorOverride(selectedCounterForOverride || 'CTR-02')}
              disabled={!supervisorPin.trim()}
              style={{ fontWeight: 800, marginTop: '6px' }}
            >
              🔓 Authorize Discrepancy & Release Shift Lock
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
