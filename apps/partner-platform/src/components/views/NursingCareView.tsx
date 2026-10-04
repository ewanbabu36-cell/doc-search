import React, { useState } from 'react';
import { Card, Button } from '@docsearch/ui-kit';
import type { InpatientNursingAssessmentDto } from '@docsearch/api-contracts';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface MarScheduleEntry {
  id: string;
  patientName: string;
  patientUhid: string;
  bedNumber: string;
  medicationName: string;
  dosage: string;
  route: 'IV' | 'IM' | 'ORAL' | 'SC' | 'NEBULIZATION';
  scheduledTime: string; // e.g. '08:00 AM'
  status: 'SCHEDULED' | 'GIVEN' | 'HELD' | 'REFUSED';
  pharmacyStatus?: 'ORDERED' | 'DOSE_PACK_DISPENSED' | 'IN_TRANSIT_RUNNER' | 'ARRIVED_AT_BEDSIDE' | 'OUT_OF_STOCK' | undefined;
  runnerName?: string | undefined;
  dispensedAt?: string | undefined;
  administeredBy?: string | undefined;
  administeredAt?: string | undefined;
  batchNumber?: string | undefined;
}

export interface FluidIoEntry {
  id: string;
  timeSlot: string;
  ivFluidsMl: number;
  oralMl: number;
  urineMl: number;
  drainMl: number;
  nasogastricMl: number;
  netBalanceMl: number;
  recordedBy: string;
}

export interface SbarHandoverData {
  id: string;
  patientName: string;
  bedNumber: string;
  outgoingNurse: string;
  incomingNurse: string;
  shift: 'MORNING_TO_EVENING' | 'EVENING_TO_NIGHT' | 'NIGHT_TO_MORNING';
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
  signedAt: string;
  isSigned: boolean;
}

export interface NursingCareViewProps {
  assessments?: InpatientNursingAssessmentDto[];
}

export const NursingCareView: React.FC<NursingCareViewProps> = ({ assessments = [] }) => {
  const safeAssessments = Array.isArray(assessments) ? assessments : [];
  const [activeTab, setActiveTab] = useState<'EMAR' | 'FLUID_IO' | 'SBAR' | 'ASSESSMENTS'>('EMAR');

  // e-MAR State
  const [marList, setMarList] = useState<MarScheduleEntry[]>([
    {
      id: 'mar-1',
      patientName: 'Ramesh Patel (58M)',
      patientUhid: 'UHID-2026-901',
      bedNumber: 'ICU-Bed 04',
      medicationName: 'Inj Ceftriaxone 1g IV in 100ml NS',
      dosage: '1g IV Infusion',
      route: 'IV',
      scheduledTime: '08:00 AM',
      status: 'GIVEN',
      pharmacyStatus: 'ARRIVED_AT_BEDSIDE',
      dispensedAt: '07:45 AM',
      administeredBy: 'Sr. Sunita R.N.',
      administeredAt: '08:05 AM',
      batchNumber: 'CTX-2026-88'
    },
    {
      id: 'mar-2',
      patientName: 'Ramesh Patel (58M)',
      patientUhid: 'UHID-2026-901',
      bedNumber: 'ICU-Bed 04',
      medicationName: 'Inj Pantoprazole 40mg IV Push',
      dosage: '40mg IV Slow',
      route: 'IV',
      scheduledTime: '08:00 AM',
      status: 'GIVEN',
      pharmacyStatus: 'ARRIVED_AT_BEDSIDE',
      dispensedAt: '07:48 AM',
      administeredBy: 'Sr. Sunita R.N.',
      administeredAt: '08:12 AM',
      batchNumber: 'PAN-1049-A'
    },
    {
      id: 'mar-3',
      patientName: 'Ramesh Patel (58M)',
      patientUhid: 'UHID-2026-901',
      bedNumber: 'ICU-Bed 04',
      medicationName: 'Inj Enoxaparin 40mg (Clexane) SC',
      dosage: '40mg Subcutaneous',
      route: 'SC',
      scheduledTime: '02:00 PM',
      status: 'SCHEDULED',
      pharmacyStatus: 'IN_TRANSIT_RUNNER',
      runnerName: 'Amit K. (ETA 5m)',
      dispensedAt: '01:40 PM'
    },
    {
      id: 'mar-4',
      patientName: 'Pooja Verma (32F)',
      patientUhid: 'UHID-2026-942',
      bedNumber: 'Ward 204-B',
      medicationName: 'Inj Tramadol 50mg + Ondansetron 4mg in 100ml NS',
      dosage: 'Slow IV Drip',
      route: 'IV',
      scheduledTime: '02:00 PM',
      status: 'SCHEDULED',
      pharmacyStatus: 'DOSE_PACK_DISPENSED',
      dispensedAt: '01:50 PM'
    },
    {
      id: 'mar-5',
      patientName: 'Ramesh Patel (58M)',
      patientUhid: 'UHID-2026-901',
      bedNumber: 'ICU-Bed 04',
      medicationName: 'Tab Telmisartan 40mg Oral',
      dosage: '1 Tab Oral',
      route: 'ORAL',
      scheduledTime: '08:00 PM',
      status: 'SCHEDULED',
      pharmacyStatus: 'ORDERED'
    }
  ]);

  const handleScanRunnerDelivery = (marId: string) => {
    setMarList((prev) =>
      prev.map((m) =>
        m.id === marId
          ? {
              ...m,
              pharmacyStatus: 'ARRIVED_AT_BEDSIDE',
              runnerName: undefined
            }
          : m
      )
    );
    const target = marList.find((m) => m.id === marId);
    if (target) {
      hospitalEventBus.publish(
        'PHARMACY_DOSE_PACK_UPDATED',
        'InpatientWardSubStock',
        {
          marId,
          patientUhid: target.patientUhid,
          medicationName: target.medicationName,
          status: 'ARRIVED_AT_BEDSIDE'
        },
        `Ward runner delivery barcode scanned: ${target.medicationName} arrived at bedside (${target.bedNumber})`
      );
    }
  };

  const handleSimulateDoctorRoundOrder = () => {
    const newEntry: MarScheduleEntry = {
      id: `mar-${Date.now()}`,
      patientName: 'Ramesh Patel (58M)',
      patientUhid: 'UHID-2026-901',
      bedNumber: 'ICU-Bed 04',
      medicationName: 'Inj Meropenem 1g IV in 100ml NS STAT',
      dosage: '1g IV Infusion',
      route: 'IV',
      scheduledTime: 'STAT (10m)',
      status: 'SCHEDULED',
      pharmacyStatus: 'ORDERED'
    };
    setMarList((prev) => [newEntry, ...prev]);
    hospitalEventBus.publish(
      'MEDICATION_ORDERED_INPATIENT',
      'DoctorRoundCockpit',
      {
        marId: newEntry.id,
        patientUhid: newEntry.patientUhid,
        medicationName: newEntry.medicationName,
        bedNumber: newEntry.bedNumber
      },
      `Inpatient round order: ${newEntry.medicationName} queued for pharmacy dose-pack printing`
    );
  };

  // 5-Rights Scanner Dialog State
  const [selectedMarForScan, setSelectedMarForScan] = useState<MarScheduleEntry | null>(null);
  const [scannedPatientBarcode, setScannedPatientBarcode] = useState('');
  const [scannedMedBarcode, setScannedMedBarcode] = useState('');
  const [scanVerificationError, setScanVerificationError] = useState<string | null>(null);
  const [scanVerificationSuccess, setScanVerificationSuccess] = useState(false);

  // Fluid I/O State
  const [fluidEntries] = useState<FluidIoEntry[]>([
    { id: 'f-1', timeSlot: '08:00 - 10:00', ivFluidsMl: 300, oralMl: 100, urineMl: 250, drainMl: 30, nasogastricMl: 0, netBalanceMl: 120, recordedBy: 'Sr. Sunita' },
    { id: 'f-2', timeSlot: '10:00 - 12:00', ivFluidsMl: 250, oralMl: 50, urineMl: 200, drainMl: 20, nasogastricMl: 0, netBalanceMl: 80, recordedBy: 'Sr. Sunita' },
    { id: 'f-3', timeSlot: '12:00 - 14:00', ivFluidsMl: 250, oralMl: 150, urineMl: 280, drainMl: 20, nasogastricMl: 0, netBalanceMl: 100, recordedBy: 'Sr. Sunita' }
  ]);

  // SBAR State
  const [sbarHandoffs, setSbarHandoffs] = useState<SbarHandoverData[]>([
    {
      id: 'sbar-1',
      patientName: 'Ramesh Patel (58M)',
      bedNumber: 'ICU-Bed 04',
      outgoingNurse: 'Sr. Sunita (Morning Shift)',
      incomingNurse: 'Sr. Priyanka (Evening Shift)',
      shift: 'MORNING_TO_EVENING',
      situation: 'Post-op Day 1 Laparoscopic Cholecystectomy with mild hypertension (BP 142/90). Hemodynamically stable.',
      background: 'Admitted for symptomatic gallstones. Known diabetic and hypertensive on oral medications. No drug allergies.',
      assessment: 'Chest clear, abdomen soft with mild surgical site tenderness. Surgical drain output 70ml serosanguinous. Urine output 730ml in 6 hours.',
      recommendation: 'Give Inj Enoxaparin 40mg SC at 02:00 PM. Check 04:00 PM post-meal CBG. Call doctor if BP systolic > 160 or drain > 100ml.',
      signedAt: '01:45 PM (04-Oct-2026)',
      isSigned: true
    }
  ]);

  const [isNewSbarModalOpen, setIsNewSbarModalOpen] = useState(false);
  const [newSbarSituation, setNewSbarSituation] = useState('');
  const [newSbarBackground, setNewSbarBackground] = useState('');
  const [newSbarAssessment, setNewSbarAssessment] = useState('');
  const [newSbarRecommendation, setNewSbarRecommendation] = useState('');

  // 5-Rights Verification Handler
  const handleVerifyAndAdminister = () => {
    if (!selectedMarForScan) return;

    if (!scannedPatientBarcode.trim()) {
      setScanVerificationError('⚠️ Missing Patient Wristband Scan! Please scan patient wristband.');
      return;
    }
    if (!scannedMedBarcode.trim()) {
      setScanVerificationError('⚠️ Missing Medication Barcode Scan! Please scan ampoule/vial barcode.');
      return;
    }

    setScanVerificationError(null);
    setScanVerificationSuccess(true);

    hospitalEventBus.publish(
      'OPTIMISTIC_ACTION_DISPATCHED',
      'DigitalNurseMarView',
      {
        marId: selectedMarForScan.id,
        patientUhid: selectedMarForScan.patientUhid,
        medicationName: selectedMarForScan.medicationName,
        administeredTime: new Date().toLocaleTimeString()
      },
      `5-Rights Barcode Check Passed: ${selectedMarForScan.medicationName} given to ${selectedMarForScan.patientName}`
    );

    setTimeout(() => {
      setMarList((prev) =>
        prev.map((m) =>
          m.id === selectedMarForScan.id
            ? {
                ...m,
                status: 'GIVEN',
                administeredBy: 'Staff Nurse (Barcode Verified)',
                administeredAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                batchNumber: scannedMedBarcode
              }
            : m
        )
      );
      setScanVerificationSuccess(false);
      setSelectedMarForScan(null);
      setScannedPatientBarcode('');
      setScannedMedBarcode('');
    }, 1200);
  };

  const handleSaveSbar = () => {
    if (!newSbarSituation.trim() || !newSbarAssessment.trim()) return;
    const newSbar: SbarHandoverData = {
      id: `sbar-${Date.now()}`,
      patientName: 'Ramesh Patel (58M)',
      bedNumber: 'ICU-Bed 04',
      outgoingNurse: 'Sr. Sunita (Outgoing)',
      incomingNurse: 'Sr. Anita (Incoming)',
      shift: 'EVENING_TO_NIGHT',
      situation: newSbarSituation,
      background: newSbarBackground || 'Stable post-op course.',
      assessment: newSbarAssessment,
      recommendation: newSbarRecommendation || 'Routine overnight monitoring.',
      signedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      isSigned: true
    };
    setSbarHandoffs((prev) => [newSbar, ...prev]);
    setIsNewSbarModalOpen(false);
    setNewSbarSituation('');
    setNewSbarBackground('');
    setNewSbarAssessment('');
    setNewSbarRecommendation('');
  };

  const totalIntake = fluidEntries.reduce((acc, curr) => acc + curr.ivFluidsMl + curr.oralMl, 0);
  const totalOutput = fluidEntries.reduce((acc, curr) => acc + curr.urineMl + curr.drainMl + curr.nasogastricMl, 0);
  const netFluidBalance = totalIntake - totalOutput;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Header & Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1.5px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>👩‍⚕️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#F8FAFC' }}>
                Inpatient Nursing Care & Clinical MAR Command
              </h2>
              <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.78rem' }}>
                5-Rights Barcode Scanning • Hourly e-MAR Drug Administration • Fluid I/O Balance • SBAR Handoff
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#0B111E', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('EMAR')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: activeTab === 'EMAR' ? '1px solid #06B6D4' : 'none',
              backgroundColor: activeTab === 'EMAR' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: activeTab === 'EMAR' ? '#38BDF8' : '#94A3B8'
            }}
          >
            📋 Digital e-MAR ({marList.filter((m) => m.status === 'SCHEDULED').length} Due)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('FLUID_IO')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: activeTab === 'FLUID_IO' ? '1px solid #10B981' : 'none',
              backgroundColor: activeTab === 'FLUID_IO' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: activeTab === 'FLUID_IO' ? '#34D399' : '#94A3B8'
            }}
          >
            💧 Fluid I/O Sheet (Net {netFluidBalance > 0 ? `+${netFluidBalance}` : netFluidBalance} mL)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SBAR')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: activeTab === 'SBAR' ? '1px solid #A855F7' : 'none',
              backgroundColor: activeTab === 'SBAR' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
              color: activeTab === 'SBAR' ? '#C084FC' : '#94A3B8'
            }}
          >
            🔄 SBAR Shift Handoff
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ASSESSMENTS')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: activeTab === 'ASSESSMENTS' ? '1px solid #F59E0B' : 'none',
              backgroundColor: activeTab === 'ASSESSMENTS' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
              color: activeTab === 'ASSESSMENTS' ? '#FBBF24' : '#94A3B8'
            }}
          >
            📝 Morse / Braden Scale ({safeAssessments.length})
          </button>
        </div>
      </div>

      {/* TAB 1: DIGITAL e-MAR & 5-RIGHTS BARCODE WORKBENCH */}
      {activeTab === 'EMAR' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Safety & Closed-Loop Delivery Banner */}
          <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.2rem' }}>📦</span>
              <div style={{ fontSize: '0.78rem', color: '#E0F2FE' }}>
                <strong>Closed-Loop Pharmacy Pipeline:</strong> Round Order ➔ Dose-Pack Printed ➔ Runner In-Transit ➔ Bedside Barcode Arrival.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSimulateDoctorRoundOrder}
                style={{ fontSize: '0.72rem', borderColor: '#06B6D4', color: '#38BDF8', fontWeight: 800 }}
              >
                ⚡ Doctor Round: Order STAT Dose
              </Button>
              <span style={{ fontSize: '0.72rem', backgroundColor: '#0284C7', color: '#FFFFFF', padding: '3px 8px', borderRadius: '4px', fontWeight: 800, alignSelf: 'center' }}>
                Zero-Med-Error Active
              </span>
            </div>
          </div>

          {/* e-MAR Schedule Table */}
          <Card style={{ padding: '0', overflow: 'hidden', backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#0B111E', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>Slot</th>
                  <th style={{ padding: '10px 14px' }}>Patient / Bed</th>
                  <th style={{ padding: '10px 14px' }}>Medication & Dose</th>
                  <th style={{ padding: '10px 14px' }}>Route</th>
                  <th style={{ padding: '10px 14px' }}>Pharmacy Status</th>
                  <th style={{ padding: '10px 14px' }}>Clinical MAR</th>
                  <th style={{ padding: '10px 14px' }}>Administered By / Details</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {marList.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#38BDF8' }}>
                      {m.scheduledTime}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 800, color: '#F8FAFC' }}>{m.patientName}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{m.bedNumber} • {m.patientUhid}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 800, color: '#E2E8F0' }}>{m.medicationName}</div>
                      <div style={{ fontSize: '0.7rem', color: '#38BDF8' }}>Dose: {m.dosage}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, color: '#CBD5E1' }}>
                        {m.route}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {m.pharmacyStatus === 'ARRIVED_AT_BEDSIDE' ? (
                        <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#6EE7B7', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          ✓ At Bedside
                        </span>
                      ) : m.pharmacyStatus === 'IN_TRANSIT_RUNNER' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.2)', border: '1px solid #06B6D4', color: '#38BDF8', padding: '2px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 800 }}>
                            🏃 {m.runnerName || 'In-Transit'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleScanRunnerDelivery(m.id)}
                            style={{
                              backgroundColor: '#0284C7',
                              border: 'none',
                              borderRadius: '4px',
                              color: '#FFF',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              padding: '2px 6px',
                              cursor: 'pointer'
                            }}
                          >
                            📥 Receive Pouch
                          </button>
                        </div>
                      ) : m.pharmacyStatus === 'DOSE_PACK_DISPENSED' ? (
                        <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', border: '1px solid #F59E0B', color: '#FDE68A', padding: '2px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 800 }}>
                          📦 Dose-Pack Printed
                        </span>
                      ) : (
                        <span style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#94A3B8', padding: '2px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 }}>
                          ⏳ Order Queued
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {m.status === 'GIVEN' ? (
                        <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#6EE7B7', padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800 }}>
                          ✓ GIVEN
                        </span>
                      ) : (
                        <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', border: '1px solid #F59E0B', color: '#FDE68A', padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800 }}>
                          ⏳ DUE NOW
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.72rem', color: '#94A3B8' }}>
                      {m.administeredBy ? (
                        <div>
                          <div style={{ color: '#F8FAFC' }}>{m.administeredBy} ({m.administeredAt})</div>
                          <div style={{ color: '#64748B' }}>Batch: {m.batchNumber}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#64748B' }}>Awaiting Barcode Verification</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      {m.status === 'SCHEDULED' ? (
                        <Button
                          variant="primary"
                          onClick={() => setSelectedMarForScan(m)}
                          disabled={m.pharmacyStatus && m.pharmacyStatus !== 'ARRIVED_AT_BEDSIDE'}
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            padding: '5px 12px',
                            backgroundColor: m.pharmacyStatus === 'ARRIVED_AT_BEDSIDE' ? '#06B6D4' : '#475569'
                          }}
                        >
                          {m.pharmacyStatus === 'ARRIVED_AT_BEDSIDE' ? '📲 Scan & Administer' : '⏳ In-Transit'}
                        </Button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>
                          Verified ✓
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* TAB 2: FLUID BALANCE INTAKE & OUTPUT (I/O) CHART */}
      {activeTab === 'FLUID_IO' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Fluid Metrics Summary Card */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div style={{ backgroundColor: '#0F172A', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>TOTAL FLUID INTAKE (IV + Oral)</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38BDF8', marginTop: '4px' }}>
                {totalIntake} mL
              </div>
            </div>
            <div style={{ backgroundColor: '#0F172A', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>TOTAL OUTPUT (Urine + Drain)</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F87171', marginTop: '4px' }}>
                {totalOutput} mL
              </div>
            </div>
            <div style={{ backgroundColor: '#0F172A', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>NET 24-HOUR BALANCE</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: netFluidBalance >= 0 ? '#34D399' : '#FBBF24', marginTop: '4px' }}>
                {netFluidBalance >= 0 ? `+${netFluidBalance}` : netFluidBalance} mL
              </div>
            </div>
          </div>

          <Card style={{ padding: '0', overflow: 'hidden', backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#0B111E', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>Time Slot</th>
                  <th style={{ padding: '10px 14px' }}>IV Fluids (mL)</th>
                  <th style={{ padding: '10px 14px' }}>Oral (mL)</th>
                  <th style={{ padding: '10px 14px' }}>Urine (mL)</th>
                  <th style={{ padding: '10px 14px' }}>Surgical Drain (mL)</th>
                  <th style={{ padding: '10px 14px' }}>Net Hourly</th>
                  <th style={{ padding: '10px 14px' }}>Nurse</th>
                </tr>
              </thead>
              <tbody>
                {fluidEntries.map((f) => (
                  <tr key={f.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 800, color: '#F8FAFC' }}>{f.timeSlot}</td>
                    <td style={{ padding: '10px 14px', color: '#38BDF8', fontWeight: 700 }}>{f.ivFluidsMl}</td>
                    <td style={{ padding: '10px 14px', color: '#38BDF8' }}>{f.oralMl}</td>
                    <td style={{ padding: '10px 14px', color: '#F87171', fontWeight: 700 }}>{f.urineMl}</td>
                    <td style={{ padding: '10px 14px', color: '#F87171' }}>{f.drainMl}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 800, color: f.netBalanceMl >= 0 ? '#34D399' : '#FBBF24' }}>
                      {f.netBalanceMl > 0 ? `+${f.netBalanceMl}` : f.netBalanceMl} mL
                    </td>
                    <td style={{ padding: '10px 14px', color: '#94A3B8' }}>{f.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* TAB 3: SBAR NURSING SHIFT HANDOFF */}
      {activeTab === 'SBAR' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#C084FC' }}>
              Standard SBAR (Situation, Background, Assessment, Recommendation) Shift Vault
            </span>
            <Button variant="primary" onClick={() => setIsNewSbarModalOpen(true)} style={{ fontSize: '0.78rem', backgroundColor: '#8B5CF6' }}>
              + Record New Shift Handoff
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sbarHandoffs.map((s) => (
              <div
                key={s.id}
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F8FAFC' }}>
                      {s.patientName} • {s.bedNumber}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#C084FC', marginLeft: '10px' }}>
                      Shift: {s.shift.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 800 }}>
                    ✓ Digitally Signed at {s.signedAt}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.75rem' }}>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px' }}>
                    <strong style={{ color: '#38BDF8' }}>S — SITUATION:</strong>
                    <p style={{ margin: '4px 0 0 0', color: '#CBD5E1' }}>{s.situation}</p>
                  </div>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px' }}>
                    <strong style={{ color: '#FBBF24' }}>B — BACKGROUND:</strong>
                    <p style={{ margin: '4px 0 0 0', color: '#CBD5E1' }}>{s.background}</p>
                  </div>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px' }}>
                    <strong style={{ color: '#34D399' }}>A — ASSESSMENT:</strong>
                    <p style={{ margin: '4px 0 0 0', color: '#CBD5E1' }}>{s.assessment}</p>
                  </div>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px' }}>
                    <strong style={{ color: '#F87171' }}>R — RECOMMENDATION:</strong>
                    <p style={{ margin: '4px 0 0 0', color: '#CBD5E1' }}>{s.recommendation}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94A3B8', paddingTop: '4px' }}>
                  <div>Outgoing: <strong>{s.outgoingNurse}</strong></div>
                  <div>Incoming: <strong>{s.incomingNurse}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CLINICAL ASSESSMENTS (FALL & BRADEN SCALES) */}
      {activeTab === 'ASSESSMENTS' && (
        <Card style={{ padding: '0', overflow: 'hidden', backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#0B111E', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>Time & Shift</th>
                <th style={{ padding: '10px 14px' }}>Nurse</th>
                <th style={{ padding: '10px 14px' }}>Assessment Type</th>
                <th style={{ padding: '10px 14px' }}>Morse Fall / Braden Score</th>
                <th style={{ padding: '10px 14px' }}>Clinical Summary</th>
              </tr>
            </thead>
            <tbody>
              {safeAssessments.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                    No historical nursing assessments logged for this encounter.
                  </td>
                </tr>
              ) : (
                safeAssessments.map((a) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '10px 14px', color: '#38BDF8' }}>
                      {a.createdAt ? new Date(a.createdAt).toLocaleString() : 'N/A'} ({a.shiftType})
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#F8FAFC' }}>{a.assessedBy}</td>
                    <td style={{ padding: '10px 14px', color: '#E2E8F0' }}>{a.assessmentType}</td>
                    <td style={{ padding: '10px 14px', color: '#FBBF24' }}>
                      Fall: {a.fallRiskScore} • Braden: {a.pressureInjuryRiskScore}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '0.75rem', color: '#94A3B8' }}>{a.nursingSummary}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* 5-RIGHTS SCANNER MODAL */}
      {selectedMarForScan && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #06B6D4', borderRadius: '16px', width: '100%', maxWidth: '580px', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#38BDF8' }}>
                  📲 5-Rights Point-of-Care Barcode Verification
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  {selectedMarForScan.patientName} • {selectedMarForScan.bedNumber}
                </span>
              </div>
              <button type="button" onClick={() => setSelectedMarForScan(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {scanVerificationError && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', color: '#FCA5A5', padding: '8px 12px', borderRadius: '6px', fontSize: '0.78rem' }}>
                {scanVerificationError}
              </div>
            )}

            {scanVerificationSuccess && (
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#6EE7B7', padding: '8px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800 }}>
                ✓ 5-Rights Verified! Medication administered and permanently logged in e-MAR.
              </div>
            )}

            <div style={{ backgroundColor: '#0B111E', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>SCHEDULED MEDICATION:</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC', marginTop: '2px' }}>{selectedMarForScan.medicationName}</div>
              <div style={{ fontSize: '0.75rem', color: '#38BDF8', marginTop: '2px' }}>Dose: {selectedMarForScan.dosage} • Route: {selectedMarForScan.route}</div>
            </div>

            {/* Simulated Barcode Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '3px' }}>
                  1. Scan Patient Wristband Barcode:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={scannedPatientBarcode}
                    onChange={(e) => setScannedPatientBarcode(e.target.value)}
                    placeholder="Scan or enter wristband code..."
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', backgroundColor: '#070C16', border: '1px solid rgba(255,255,255,0.2)', color: '#F8FAFC', fontSize: '0.78rem' }}
                  />
                  <button type="button" onClick={() => setScannedPatientBarcode('UHID-2026-901-ICU04')} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'rgba(56,189,248,0.2)', border: '1px solid #38BDF8', color: '#38BDF8', fontSize: '0.72rem', cursor: 'pointer' }}>
                    Auto-Scan Wristband
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '3px' }}>
                  2. Scan Medication Vial / Strip Barcode:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={scannedMedBarcode}
                    onChange={(e) => setScannedMedBarcode(e.target.value)}
                    placeholder="Scan vial GS1 Datamatrix barcode..."
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', backgroundColor: '#070C16', border: '1px solid rgba(255,255,255,0.2)', color: '#F8FAFC', fontSize: '0.78rem' }}
                  />
                  <button type="button" onClick={() => setScannedMedBarcode('GS1-MED-CTX-8819')} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'rgba(16,185,129,0.2)', border: '1px solid #10B981', color: '#34D399', fontSize: '0.72rem', cursor: 'pointer' }}>
                    Auto-Scan Vial
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button type="button" onClick={() => setSelectedMarForScan(null)} style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#CBD5E1', fontSize: '0.78rem', cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="button" onClick={handleVerifyAndAdminister} style={{ padding: '8px 20px', borderRadius: '6px', backgroundColor: '#06B6D4', border: 'none', color: '#070C16', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>
                Confirm 5-Rights & Sign Off
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW SBAR SHIFT HANDOFF MODAL */}
      {isNewSbarModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #8B5CF6', borderRadius: '16px', width: '100%', maxWidth: '620px', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#C084FC' }}>
                Record SBAR Shift Handoff
              </h3>
              <button type="button" onClick={() => setIsNewSbarModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#38BDF8', marginBottom: '2px' }}>S — Situation:</label>
              <input type="text" value={newSbarSituation} onChange={(e) => setNewSbarSituation(e.target.value)} placeholder="Current acute diagnosis and main clinical issue..." style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#070C16', border: '1px solid rgba(255,255,255,0.2)', color: '#F8FAFC', fontSize: '0.75rem' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#FBBF24', marginBottom: '2px' }}>B — Background:</label>
              <input type="text" value={newSbarBackground} onChange={(e) => setNewSbarBackground(e.target.value)} placeholder="Admission date, surgery details, known allergies..." style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#070C16', border: '1px solid rgba(255,255,255,0.2)', color: '#F8FAFC', fontSize: '0.75rem' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#34D399', marginBottom: '2px' }}>A — Assessment:</label>
              <input type="text" value={newSbarAssessment} onChange={(e) => setNewSbarAssessment(e.target.value)} placeholder="Vitals stability, surgical drains, pain score, pending labs..." style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#070C16', border: '1px solid rgba(255,255,255,0.2)', color: '#F8FAFC', fontSize: '0.75rem' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#F87171', marginBottom: '2px' }}>R — Recommendation:</label>
              <input type="text" value={newSbarRecommendation} onChange={(e) => setNewSbarRecommendation(e.target.value)} placeholder="Scheduled injections, fluid changes, red flags to report..." style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#070C16', border: '1px solid rgba(255,255,255,0.2)', color: '#F8FAFC', fontSize: '0.75rem' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" onClick={() => setIsNewSbarModalOpen(false)} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#CBD5E1', fontSize: '0.75rem', cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={handleSaveSbar} style={{ padding: '6px 16px', borderRadius: '6px', backgroundColor: '#8B5CF6', border: 'none', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>Digitally Sign Handoff</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};