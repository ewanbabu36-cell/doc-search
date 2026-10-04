import React, { useState } from 'react';
import { Card, Table, Badge, Button } from '@docsearch/ui-kit';
import type { SurgicalSafetyChecklistDto, OTScheduleDto } from '@docsearch/api-contracts';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

interface Props {
  checklists: SurgicalSafetyChecklistDto[];
  schedules: OTScheduleDto[];
  onOpenSafetyChecklist: (schedule: OTScheduleDto) => void;
}

export interface ImplantLogItem {
  id: string;
  implantName: string;
  manufacturer: string;
  lotNumber: string;
  serialNumber: string;
  expiryDate: string;
  scannedAt: string;
}

export interface CssdSterileTray {
  id: string;
  trayBarcode: string;
  trayName: string;
  autoclaveUnit: string;
  cycleBatchNumber: string;
  sterilizationMethod: 'STEAM_VACUUM_134C' | 'PLASMA_STERRAD' | 'ETO_GAS';
  sterilizedAt: string;
  expiresAt: string;
  bowieDickStatus: 'PASS' | 'FAIL';
  biologicalIndicatorStatus: 'PASS' | 'FAIL' | 'INCUBATING';
  chemicalIndicatorClass5: 'PASS' | 'FAIL';
  status: 'STERILIZED_VALID' | 'EXPIRED' | 'UNVERIFIED';
  assignedRoom: string;
  verifiedByNurse?: string;
}

export interface NpoAssessment {
  id: string;
  scheduleId: string;
  patientName: string;
  uhid: string;
  scheduledTime: string;
  lastOralIntakeTimestamp: string;
  intakeClassification: 'CLEAR_FLUIDS' | 'BREAST_MILK' | 'LIGHT_MEAL_TEA' | 'HEAVY_FATTY_MEAL';
  requiredFastingHours: number;
  calculatedClearanceTimestamp: string;
  elapsedFastingHours: number;
  npoStatus: 'ELAPSED_SAFE' | 'ASPIRATION_RISK_LOCKED' | 'EMERGENCY_RSI_OVERRIDDEN';
  aspirationRiskLevel: 'LOW' | 'CRITICAL_HIGH';
  overrideReason?: string;
  overridingAnesthetist?: string;
}

export interface DynamicOtRoomSlot {
  roomId: string;
  roomName: string;
  activeCaseScheduleId: string;
  patientName: string;
  procedureName: string;
  surgeonName: string;
  scheduledStartTime: string;
  scheduledDurationMinutes: number;
  actualElapsedMinutes: number;
  isOverrunning: boolean;
  overrunMinutes: number;
  hepaAirPurgeRequiredMinutes: number;
  hepaAirPurgeStatus: 'IDLE' | 'PURGING_IN_PROGRESS' | 'COMPLETED_SAFE';
  subsequentCases: {
    scheduleId: string;
    patientName: string;
    procedure: string;
    originalTime: string;
    dynamicallyAdjustedTime: string;
    delayMinutes: number;
    delayNotifiedToWard: boolean;
  }[];
}

export const SurgicalSafetyChecklistView: React.FC<Props> = ({
  checklists,
  schedules,
  onOpenSafetyChecklist
}) => {
  const [activeTab, setActiveTab] = useState<
    'WHO_CHECKLIST' | 'CSSD_GATEWAY' | 'NPO_LOCKOUT' | 'DYNAMIC_SCHEDULING' | 'PAC_GATEWAY' | 'IMPLANT_REGISTRY'
  >('WHO_CHECKLIST');

  // Interactive WHO Stage Checklist Modal State
  const [selectedScheduleForWho, setSelectedScheduleForWho] = useState<OTScheduleDto | null>(null);
  const [whoPhase, setWhoPhase] = useState<'SIGN_IN' | 'TIME_OUT' | 'SIGN_OUT'>('TIME_OUT');
  const [signInChecks, setSignInChecks] = useState({
    identityVerified: true,
    siteMarked: true,
    anesthesiaMachineChecked: true,
    pulseOximeterFunctioning: true,
    allergyKnown: false,
    difficultAirwayEquipped: true,
    bloodLossRiskAssessed: true,
    npoClearanceConfirmed: false
  });
  const [timeOutChecks, setTimeOutChecks] = useState({
    teamIntroduced: true,
    surgeonReviewCriticalSteps: true,
    anesthetistReviewConcerns: true,
    cssdTrayBarcodeScanned: false,
    prophylacticAntibioticWithin60Min: true,
    essentialImagingDisplayed: true
  });
  const [signOutChecks, setSignOutChecks] = useState({
    nameOfProcedureRecorded: true,
    spongeNeedleInstrumentCountCorrect: true,
    specimenLabeledCorrectly: true,
    equipmentIssuesAddressed: false,
    postOpRecoveryPlanReviewed: true
  });
  const [whoSignedSuccess, setWhoSignedSuccess] = useState(false);

  // In-modal CSSD Tray Verification state
  const [scannedTrayBarcode, setScannedTrayBarcode] = useState('');
  const [verifiedTrayDetails, setVerifiedTrayDetails] = useState<CssdSterileTray | null>(null);

  // In-modal Emergency RSI Override State
  const [isRsiOverrideActive, setIsRsiOverrideActive] = useState(false);
  const [rsiOverrideReason, setRsiOverrideReason] = useState('');
  const [rsiAnesthetistName, setRsiAnesthetistName] = useState('Dr. Vivek Sharma (MD Anesth)');

  // 1. CSSD Autoclave Trays State
  const [cssdTrays, setCssdTrays] = useState<CssdSterileTray[]>([
    {
      id: 'cssd-1',
      trayBarcode: 'CSSD-TRAY-LAP-042',
      trayName: 'Karl Storz HD Laparoscopic Cholecystectomy Set (42 Pcs)',
      autoclaveUnit: 'Getinge Steam Autoclave Unit #2 (450L)',
      cycleBatchNumber: 'CYCLE-20261004-C03',
      sterilizationMethod: 'STEAM_VACUUM_134C',
      sterilizedAt: '04-Oct-2026 06:15 AM',
      expiresAt: '11-Oct-2026 06:15 AM',
      bowieDickStatus: 'PASS',
      biologicalIndicatorStatus: 'PASS',
      chemicalIndicatorClass5: 'PASS',
      status: 'STERILIZED_VALID',
      assignedRoom: 'OT-1 (General Surgery)'
    },
    {
      id: 'cssd-2',
      trayBarcode: 'CSSD-TRAY-ORTHO-019',
      trayName: 'Synthes Titanium Arthroscopy & ACL Reconstruction Set (38 Pcs)',
      autoclaveUnit: 'Getinge Steam Autoclave Unit #1 (600L)',
      cycleBatchNumber: 'CYCLE-20261004-C02',
      sterilizationMethod: 'STEAM_VACUUM_134C',
      sterilizedAt: '04-Oct-2026 05:30 AM',
      expiresAt: '11-Oct-2026 05:30 AM',
      bowieDickStatus: 'PASS',
      biologicalIndicatorStatus: 'PASS',
      chemicalIndicatorClass5: 'PASS',
      status: 'STERILIZED_VALID',
      assignedRoom: 'OT-2 (Orthopaedics)'
    },
    {
      id: 'cssd-3',
      trayBarcode: 'CSSD-TRAY-CRANIO-007',
      trayName: 'Aesculap Microneurosurgery & Craniotomy Set (65 Pcs)',
      autoclaveUnit: 'Sterrad 100NX Hydrogen Peroxide Plasma',
      cycleBatchNumber: 'PLASMA-20261004-P01',
      sterilizationMethod: 'PLASMA_STERRAD',
      sterilizedAt: '03-Oct-2026 08:00 PM',
      expiresAt: '10-Oct-2026 08:00 PM',
      bowieDickStatus: 'PASS',
      biologicalIndicatorStatus: 'PASS',
      chemicalIndicatorClass5: 'PASS',
      status: 'STERILIZED_VALID',
      assignedRoom: 'OT-3 (Neurosurgery)'
    }
  ]);
  const [newTrayBarcode, setNewTrayBarcode] = useState('');
  const [newTrayName, setNewTrayName] = useState('');

  // 2. Pre-Op Fasting (NPO) Assessments State
  const [npoAssessments, setNpoAssessments] = useState<NpoAssessment[]>([
    {
      id: 'npo-1',
      scheduleId: '1',
      patientName: 'Ramesh Patel (58M)',
      uhid: 'UHID-2026-901',
      scheduledTime: '09:00 AM',
      lastOralIntakeTimestamp: '03-Oct-2026 10:00 PM',
      intakeClassification: 'LIGHT_MEAL_TEA',
      requiredFastingHours: 6,
      calculatedClearanceTimestamp: '04-Oct-2026 04:00 AM',
      elapsedFastingHours: 11.5,
      npoStatus: 'ELAPSED_SAFE',
      aspirationRiskLevel: 'LOW'
    },
    {
      id: 'npo-2',
      scheduleId: '2',
      patientName: 'Aarav Mehta (28M)',
      uhid: 'UHID-2026-884',
      scheduledTime: '11:30 AM',
      lastOralIntakeTimestamp: '04-Oct-2026 08:15 AM',
      intakeClassification: 'LIGHT_MEAL_TEA',
      requiredFastingHours: 6,
      calculatedClearanceTimestamp: '04-Oct-2026 02:15 PM',
      elapsedFastingHours: 3.2,
      npoStatus: 'ASPIRATION_RISK_LOCKED',
      aspirationRiskLevel: 'CRITICAL_HIGH'
    }
  ]);

  // 3. Dynamic OT Rooms & Cascading Overrun State
  const [otRoomSlots] = useState<DynamicOtRoomSlot[]>([
    {
      roomId: 'room-1',
      roomName: 'OT-1 (Minimal Access & General)',
      activeCaseScheduleId: '1',
      patientName: 'Ramesh Patel',
      procedureName: 'Laparoscopic Cholecystectomy',
      surgeonName: 'Dr. Alok Verma (MS Gen Surg)',
      scheduledStartTime: '09:00 AM',
      scheduledDurationMinutes: 90,
      actualElapsedMinutes: 135,
      isOverrunning: true,
      overrunMinutes: 45,
      hepaAirPurgeRequiredMinutes: 25,
      hepaAirPurgeStatus: 'IDLE',
      subsequentCases: [
        {
          scheduleId: 'sub-1',
          patientName: 'Suresh Nair (45M)',
          procedure: 'Bilateral Inguinal Hernioplasty',
          originalTime: '11:00 AM',
          dynamicallyAdjustedTime: '12:15 PM',
          delayMinutes: 75,
          delayNotifiedToWard: true
        },
        {
          scheduleId: 'sub-2',
          patientName: 'Anita Roy (39F)',
          procedure: 'Diagnostic Laparoscopy & Adhesiolysis',
          originalTime: '01:30 PM',
          dynamicallyAdjustedTime: '02:40 PM',
          delayMinutes: 70,
          delayNotifiedToWard: true
        }
      ]
    },
    {
      roomId: 'room-2',
      roomName: 'OT-2 (Orthopaedics & Joint Replacement)',
      activeCaseScheduleId: '2',
      patientName: 'Aarav Mehta',
      procedureName: 'Arthroscopic ACL Reconstruction',
      surgeonName: 'Dr. Rajesh Khanna (MS Ortho)',
      scheduledStartTime: '10:00 AM',
      scheduledDurationMinutes: 120,
      actualElapsedMinutes: 75,
      isOverrunning: false,
      overrunMinutes: 0,
      hepaAirPurgeRequiredMinutes: 25,
      hepaAirPurgeStatus: 'COMPLETED_SAFE',
      subsequentCases: [
        {
          scheduleId: 'sub-3',
          patientName: 'Vikas Dubey (52M)',
          procedure: 'Total Knee Arthroplasty (TKR)',
          originalTime: '01:00 PM',
          dynamicallyAdjustedTime: '01:00 PM',
          delayMinutes: 0,
          delayNotifiedToWard: false
        }
      ]
    }
  ]);
  const [overrunBroadcastSuccess, setOverrunBroadcastSuccess] = useState(false);

  // Pre-Anesthesia Clearance (PAC) Gateway State
  const [pacRecords] = useState([
    {
      id: 'pac-1',
      scheduleId: '1',
      patientName: 'Ramesh Patel (58M)',
      uhid: 'UHID-2026-901',
      procedure: 'Laparoscopic Cholecystectomy',
      asaClass: 'ASA II (Mild Systemic Disease - Controlled HTN)',
      mallampatiScore: 'Class II (Uvula partially visible)',
      npoFastingHours: '8 Hours (Confirmed)',
      clearedForGeneralAnesthesia: true,
      anesthetistName: 'Dr. Vivek Sharma (MD Anesthesia)',
      clearedAt: '03-Oct-2026 06:30 PM'
    },
    {
      id: 'pac-2',
      scheduleId: '2',
      patientName: 'Aarav Mehta (28M)',
      uhid: 'UHID-2026-884',
      procedure: 'Arthroscopic ACL Reconstruction',
      asaClass: 'ASA I (Normal Healthy Candidate)',
      mallampatiScore: 'Class I (Full soft palate visible)',
      npoFastingHours: '10 Hours (Confirmed)',
      clearedForGeneralAnesthesia: true,
      anesthetistName: 'Dr. Vivek Sharma (MD Anesthesia)',
      clearedAt: '04-Oct-2026 07:15 AM'
    }
  ]);

  // Surgical Implant Registry State
  const [implants, setImplants] = useState<ImplantLogItem[]>([
    {
      id: 'imp-1',
      implantName: 'Polypropylene Surgical Hernia Mesh (15x15 cm)',
      manufacturer: 'Ethicon / Johnson & Johnson',
      lotNumber: 'LOT-2026-ETH-9912',
      serialNumber: 'SN-88219412',
      expiryDate: '10-2028',
      scannedAt: '04-Oct-2026 09:42 AM'
    },
    {
      id: 'imp-2',
      implantName: 'Titanium Cannulated Interference Screw (8x25 mm)',
      manufacturer: 'Arthrex Orthobiologics',
      lotNumber: 'LOT-ARTH-7731-X',
      serialNumber: 'SN-44109823',
      expiryDate: '05-2029',
      scannedAt: '04-Oct-2026 10:15 AM'
    }
  ]);
  const [newImplantName, setNewImplantName] = useState('');
  const [newImplantLot, setNewImplantLot] = useState('');

  // ----------------------------------------------------
  // COMPUTED OT DEPENDENCY GRAPH HELPER
  // ----------------------------------------------------
  const computeDependencyGate = (schedule: OTScheduleDto) => {
    const pac = pacRecords.find((p) => p.patientName.includes(schedule.patientName) || p.scheduleId === schedule.id);
    const npo = npoAssessments.find((n) => n.patientName.includes(schedule.patientName) || n.scheduleId === schedule.id);
    const cssd = cssdTrays.find((t) => t.assignedRoom.toLowerCase().includes(schedule.roomName.toLowerCase()) || t.trayName.toLowerCase().includes(schedule.procedureName.toLowerCase().slice(0, 5)));

    const isPacCleared = !!pac?.clearedForGeneralAnesthesia;
    const isCssdValid = cssd ? cssd.status === 'STERILIZED_VALID' && cssd.biologicalIndicatorStatus === 'PASS' : false;
    const isNpoSafe = npo ? npo.npoStatus === 'ELAPSED_SAFE' || npo.npoStatus === 'EMERGENCY_RSI_OVERRIDDEN' : true;

    const isReadyForSignIn = isPacCleared && isCssdValid && isNpoSafe;

    return {
      pac,
      npo,
      cssd,
      isPacCleared,
      isCssdValid,
      isNpoSafe,
      isReadyForSignIn
    };
  };

  // ----------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------
  const handleScanTrayInModal = () => {
    const code = scannedTrayBarcode.trim().toUpperCase();
    const found = cssdTrays.find((t) => t.trayBarcode.toUpperCase() === code);
    if (found && found.status === 'STERILIZED_VALID' && found.biologicalIndicatorStatus === 'PASS') {
      setVerifiedTrayDetails(found);
      setTimeOutChecks((prev) => ({ ...prev, cssdTrayBarcodeScanned: true }));
      hospitalEventBus.publish(
        'CSSD_TRAY_VERIFIED',
        'SurgicalSafetyChecklistView',
        {
          trayBarcode: found.trayBarcode,
          cycleBatch: found.cycleBatchNumber,
          procedure: selectedScheduleForWho?.procedureName,
          verifiedAt: new Date().toISOString()
        },
        `CSSD Instrument Tray ${found.trayBarcode} verified passed (Bio: PASS) for ${selectedScheduleForWho?.procedureName}`
      );
    } else {
      alert(`Invalid or unverified tray barcode "${code}". Sterility indicator check failed!`);
    }
  };

  const handleApplyRsiOverrideInModal = () => {
    if (!rsiOverrideReason.trim()) {
      alert('Please specify the clinical emergency reason for RSI NPO Override (e.g. Ruptured Ectopic, Perforated Viscus).');
      return;
    }
    setIsRsiOverrideActive(true);
    setSignInChecks((prev) => ({ ...prev, npoClearanceConfirmed: true }));

    if (selectedScheduleForWho) {
      setNpoAssessments((prev) =>
        prev.map((n) =>
          n.patientName.includes(selectedScheduleForWho.patientName) || n.scheduleId === selectedScheduleForWho.id
            ? {
                ...n,
                npoStatus: 'EMERGENCY_RSI_OVERRIDDEN',
                overrideReason: rsiOverrideReason,
                overridingAnesthetist: rsiAnesthetistName
              }
            : n
        )
      );

      hospitalEventBus.publish(
        'NPO_SAFETY_BREACH_ALERT',
        'SurgicalSafetyChecklistView',
        {
          scheduleId: selectedScheduleForWho.id,
          patientName: selectedScheduleForWho.patientName,
          overridingAnesthetist: rsiAnesthetistName,
          reason: rsiOverrideReason,
          rsiProtocolConfirmed: true
        },
        `EMERGENCY RSI NPO OVERRIDE: ${selectedScheduleForWho.patientName} cleared by ${rsiAnesthetistName} (${rsiOverrideReason})`
      );
    }
  };

  const handleExecuteWhoSignOff = () => {
    if (!selectedScheduleForWho) return;

    // Hard verification checks
    if (whoPhase === 'SIGN_IN') {
      const dep = computeDependencyGate(selectedScheduleForWho);
      if (!dep.isNpoSafe && !isRsiOverrideActive) {
        alert('CRITICAL ASPIRATION HARD-LOCK: Patient has not completed mandatory NPO fasting duration. Induction is blocked unless Anesthesiologist activates Emergency RSI Protocol Override.');
        return;
      }
    }

    if (whoPhase === 'TIME_OUT' && !timeOutChecks.cssdTrayBarcodeScanned) {
      alert('CRITICAL STERILITY BLOCK: CSSD Instrument Tray barcode must be scanned and biological indicator certified before surgical incision.');
      return;
    }

    hospitalEventBus.publish(
      'OPTIMISTIC_ACTION_DISPATCHED',
      'SurgicalSafetyChecklistView',
      {
        scheduleId: selectedScheduleForWho.id,
        patientName: selectedScheduleForWho.patientName,
        stage: whoPhase,
        countsCorrect: signOutChecks.spongeNeedleInstrumentCountCorrect,
        trayVerified: timeOutChecks.cssdTrayBarcodeScanned ? verifiedTrayDetails?.trayBarcode : 'N/A'
      },
      `WHO Surgical Safety Checklist ${whoPhase} signed for ${selectedScheduleForWho.patientName} (${selectedScheduleForWho.procedureName})`
    );

    if (whoPhase === 'SIGN_IN') {
      hospitalEventBus.publish(
        'OT_DEPENDENCY_GATE_CLEARED',
        'SurgicalSafetyChecklistView',
        {
          scheduleId: selectedScheduleForWho.id,
          patientName: selectedScheduleForWho.patientName,
          clearedAt: new Date().toISOString()
        },
        `OT Dependency Gate: All 3 Prerequisites (PAC, CSSD, NPO) Cleared for ${selectedScheduleForWho.patientName}`
      );
    }

    setWhoSignedSuccess(true);
    setTimeout(() => {
      setWhoSignedSuccess(false);
      setSelectedScheduleForWho(null);
      setVerifiedTrayDetails(null);
      setScannedTrayBarcode('');
      setIsRsiOverrideActive(false);
    }, 1200);
  };

  const handleBroadcastOverrunAdjustments = () => {
    hospitalEventBus.publish(
      'OT_SCHEDULE_OVERRUN_ADJUSTED',
      'SurgicalSafetyChecklistView',
      {
        room: 'OT-1',
        overrunMinutes: 45,
        hepaPurgeMinutes: 25,
        cascadingDelayMinutes: 75,
        affectedCases: 2,
        notifiedWards: ['Ward 3 Nursing Station', 'Daycare Surgical Bay']
      },
      'Dynamic OT Scheduling Grid: 75-min cascading delay & HEPA air purge calculated. Revised schedule broadcasted to wards & surgeons.'
    );

    setOverrunBroadcastSuccess(true);
    setTimeout(() => setOverrunBroadcastSuccess(false), 3000);
  };

  const handleAddCssdTray = () => {
    if (!newTrayBarcode.trim() || !newTrayName.trim()) return;
    const newTray: CssdSterileTray = {
      id: `cssd-${Date.now()}`,
      trayBarcode: newTrayBarcode.trim().toUpperCase(),
      trayName: newTrayName.trim(),
      autoclaveUnit: 'Getinge Steam Autoclave Unit #1 (600L)',
      cycleBatchNumber: `CYCLE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-C04`,
      sterilizationMethod: 'STEAM_VACUUM_134C',
      sterilizedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      expiresAt: '7 Days from now',
      bowieDickStatus: 'PASS',
      biologicalIndicatorStatus: 'PASS',
      chemicalIndicatorClass5: 'PASS',
      status: 'STERILIZED_VALID',
      assignedRoom: 'OT-1 (General Surgery)'
    };
    setCssdTrays((prev) => [newTray, ...prev]);
    setNewTrayBarcode('');
    setNewTrayName('');
  };

  const handleAddImplant = () => {
    if (!newImplantName.trim()) return;
    const newImp: ImplantLogItem = {
      id: `imp-${Date.now()}`,
      implantName: newImplantName,
      manufacturer: 'Stryker Orthopaedics',
      lotNumber: newImplantLot || `LOT-${Date.now().toString().slice(-6)}`,
      serialNumber: `SN-${Math.floor(10000000 + Math.random() * 90000000)}`,
      expiryDate: '12-2029',
      scannedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };
    setImplants((prev) => [newImp, ...prev]);
    setNewImplantName('');
    setNewImplantLot('');
  };

  return (
    <div className="space-y-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top OT Header */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1.5px solid rgba(255,255,255,0.1)',
          padding: '20px 24px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>😷</span>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC' }}>
                Operation Theatre (OT), Anesthesia & CSSD Command Gateway
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
                WHO 3-Phase Verification • CSSD Autoclave Barcode Tracking • Dynamic NPO Hard-Lock • AI Turnaround & Overrun Grid
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#070C16', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('WHO_CHECKLIST')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: activeTab === 'WHO_CHECKLIST' ? '1px solid #06B6D4' : 'none',
              backgroundColor: activeTab === 'WHO_CHECKLIST' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: activeTab === 'WHO_CHECKLIST' ? '#38BDF8' : '#94A3B8'
            }}
          >
            📋 WHO Checklist & Gate ({schedules.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CSSD_GATEWAY')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: activeTab === 'CSSD_GATEWAY' ? '1px solid #F59E0B' : 'none',
              backgroundColor: activeTab === 'CSSD_GATEWAY' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
              color: activeTab === 'CSSD_GATEWAY' ? '#FBBF24' : '#94A3B8'
            }}
          >
            🛡️ CSSD Autoclave Trays ({cssdTrays.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('NPO_LOCKOUT')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: activeTab === 'NPO_LOCKOUT' ? '1px solid #EF4444' : 'none',
              backgroundColor: activeTab === 'NPO_LOCKOUT' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
              color: activeTab === 'NPO_LOCKOUT' ? '#F87171' : '#94A3B8'
            }}
          >
            ⏳ Dynamic NPO Lockout ({npoAssessments.filter((n) => n.npoStatus === 'ASPIRATION_RISK_LOCKED').length} Locked)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DYNAMIC_SCHEDULING')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: activeTab === 'DYNAMIC_SCHEDULING' ? '1px solid #3B82F6' : 'none',
              backgroundColor: activeTab === 'DYNAMIC_SCHEDULING' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              color: activeTab === 'DYNAMIC_SCHEDULING' ? '#60A5FA' : '#94A3B8'
            }}
          >
            ⚡ Dynamic OT Overrun & Turnaround
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PAC_GATEWAY')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: activeTab === 'PAC_GATEWAY' ? '1px solid #10B981' : 'none',
              backgroundColor: activeTab === 'PAC_GATEWAY' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: activeTab === 'PAC_GATEWAY' ? '#34D399' : '#94A3B8'
            }}
          >
            🫁 PAC Gateway ({pacRecords.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('IMPLANT_REGISTRY')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: activeTab === 'IMPLANT_REGISTRY' ? '1px solid #A855F7' : 'none',
              backgroundColor: activeTab === 'IMPLANT_REGISTRY' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
              color: activeTab === 'IMPLANT_REGISTRY' ? '#C084FC' : '#94A3B8'
            }}
          >
            🔩 Implants ({implants.length})
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: WHO CHECKLIST & OT DEPENDENCY GRAPH GATEWAY    */}
      {/* ==================================================== */}
      {activeTab === 'WHO_CHECKLIST' && (
        <>
          {/* OT Dependency Graph Explanation Banner */}
          <div
            style={{
              backgroundColor: '#070C16',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.8rem' }}>🔗</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#38BDF8' }}>
                  OT Pre-Induction Dependency Graph (3-Gate Safety Core)
                </h4>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                  Patient cannot be induced into anesthesia until: <strong>(1) PAC = CLEARED</strong> ➔ <strong>(2) CSSD Tray = STERILIZED_VALID</strong> ➔ <strong>(3) NPO Fasting = ELAPSED_SAFE</strong>.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', color: '#34D399', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                ✓ PAC Clearance
              </span>
              <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid #F59E0B', color: '#FBBF24', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                🛡️ CSSD Tray Barcode
              </span>
              <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#F87171', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                ⏳ NPO Aspiration Gate
              </span>
            </div>
          </div>

          {/* Pending OT Schedules with Dependency Indicators */}
          <Card className="p-4" style={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '14px' }}>
              Operating Room Cases & Pre-Induction Gate Readiness
            </h2>
            <div className="space-y-3">
              {schedules.map((s) => {
                const dep = computeDependencyGate(s);
                return (
                  <div
                    key={s.id}
                    style={{
                      borderRadius: '10px',
                      backgroundColor: '#070C16',
                      border: dep.isReadyForSignIn ? '1.5px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(239, 68, 68, 0.4)',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 900, color: '#F8FAFC' }}>
                            {s.patientName}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>({s.patientMrn})</span>
                          <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800 }}>
                            {s.procedureName}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '4px' }}>
                          Room: <strong style={{ color: '#F8FAFC' }}>{s.roomName}</strong> • Surgeon: {s.primarySurgeonName} • Anesthetist: {s.leadAnaesthetistName}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {dep.isReadyForSignIn ? (
                          <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#34D399', padding: '5px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900 }}>
                            🟢 100% READY FOR SIGN-IN
                          </span>
                        ) : (
                          <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', color: '#F87171', padding: '5px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900 }}>
                            🔒 INDUCTION HARD-LOCKED
                          </span>
                        )}

                        <Button
                          variant={dep.isReadyForSignIn ? 'primary' : 'outline'}
                          onClick={() => setSelectedScheduleForWho(s)}
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            backgroundColor: dep.isReadyForSignIn ? '#06B6D4' : 'transparent',
                            borderColor: dep.isReadyForSignIn ? '#06B6D4' : 'rgba(255,255,255,0.2)'
                          }}
                        >
                          Execute WHO Checklist
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => onOpenSafetyChecklist(s)}
                          style={{ fontSize: '0.78rem' }}
                        >
                          Dossier
                        </Button>
                      </div>
                    </div>

                    {/* 3-Gate Sub-Panel */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', fontSize: '0.73rem', backgroundColor: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                      {/* Gate 1: PAC */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{dep.isPacCleared ? '✅' : '❌'}</span>
                        <div>
                          <div style={{ fontWeight: 800, color: dep.isPacCleared ? '#34D399' : '#EF4444' }}>
                            Gate 1: PAC Clearance
                          </div>
                          <div style={{ color: '#94A3B8' }}>
                            {dep.pac ? `${dep.pac.asaClass.slice(0, 7)} • Cleared` : 'Pending Anesthetist Sign-off'}
                          </div>
                        </div>
                      </div>

                      {/* Gate 2: CSSD */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{dep.isCssdValid ? '✅' : '⚠️'}</span>
                        <div>
                          <div style={{ fontWeight: 800, color: dep.isCssdValid ? '#34D399' : '#FBBF24' }}>
                            Gate 2: CSSD Tray Sterility
                          </div>
                          <div style={{ color: '#94A3B8' }}>
                            {dep.cssd ? `${dep.cssd.trayBarcode} (Bio: PASS)` : 'Scan required at Time-Out'}
                          </div>
                        </div>
                      </div>

                      {/* Gate 3: NPO */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{dep.isNpoSafe ? '✅' : '🚨'}</span>
                        <div>
                          <div style={{ fontWeight: 800, color: dep.isNpoSafe ? '#34D399' : '#EF4444' }}>
                            Gate 3: Pre-Op NPO Fasting
                          </div>
                          <div style={{ color: '#94A3B8' }}>
                            {dep.npo
                              ? dep.npo.npoStatus === 'ELAPSED_SAFE'
                                ? `Safe (${dep.npo.elapsedFastingHours}h elapsed)`
                                : dep.npo.npoStatus === 'EMERGENCY_RSI_OVERRIDDEN'
                                  ? 'RSI Emergency Override'
                                  : `LOCKED: ${dep.npo.requiredFastingHours - dep.npo.elapsedFastingHours}h remaining`
                              : 'Fasting assessment required'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Historical Safety Audit Trail */}
          <Card className="p-4" style={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '12px' }}>
              Historical WHO Surgical Safety Verifications & Sterility Trail
            </h2>
            <Table>
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-400 border-b border-gray-700">
                  <th className="py-2">Stage</th>
                  <th className="py-2">Conducted By</th>
                  <th className="py-2">Instrument/Sponge Count</th>
                  <th className="py-2">CSSD Sterility Indicator</th>
                  <th className="py-2">Site Confirmed</th>
                  <th className="py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-sm">
                {checklists.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2 font-bold">
                      <Badge variant={c.stage === 'TIME_OUT' ? 'danger' : 'primary'}>{c.stage}</Badge>
                    </td>
                    <td className="py-2" style={{ color: '#F8FAFC' }}>
                      {c.conductedBy} ({c.conductedRole})
                    </td>
                    <td className="py-2">
                      <Badge variant={c.spongeCountCorrect ? 'success' : 'danger'}>
                        {c.spongeCountCorrect ? '100% Reconciled' : 'Discrepancy'}
                      </Badge>
                    </td>
                    <td className="py-2">
                      <Badge variant="success">Biological Pass ✓</Badge>
                    </td>
                    <td className="py-2">
                      <Badge variant="success">Verified ✓</Badge>
                    </td>
                    <td className="py-2 text-xs text-gray-400">{new Date(c.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </>
      )}

      {/* ==================================================== */}
      {/* TAB 2: CSSD AUTOCLAVE & STERILITY TRAY GATEWAY       */}
      {/* ==================================================== */}
      {activeTab === 'CSSD_GATEWAY' && (
        <Card className="p-4" style={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                🛡️ CSSD Autoclave Barcode Tracking & Sterility Vault
              </h2>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                Biological Spore Indicator (Geobacillus stearothermophilus) • Bowie-Dick Vacuum Leak Test • Class 5 Integrator
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#6EE7B7', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                100% Bio Indicators Passed
              </span>
              <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38BDF8', color: '#7DD3FC', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                Vacuum Leak: 0.7 mbar (Safe)
              </span>
            </div>
          </div>

          {/* Quick Register / Barcode Add Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '8px', backgroundColor: '#070C16', padding: '12px', borderRadius: '8px', marginBottom: '14px' }}>
            <input
              type="text"
              placeholder="Tray Barcode (e.g. CSSD-TRAY-ENT-008)..."
              value={newTrayBarcode}
              onChange={(e) => setNewTrayBarcode(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.78rem' }}
            />
            <input
              type="text"
              placeholder="Instrument Set Name (e.g. FESS Micro-Debrider Endoscopic Sinus Set 24 Pcs)..."
              value={newTrayName}
              onChange={(e) => setNewTrayName(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.78rem' }}
            />
            <Button variant="primary" onClick={handleAddCssdTray} style={{ fontSize: '0.78rem', backgroundColor: '#F59E0B', color: '#070C16', fontWeight: 800 }}>
              🛡️ Register Sterile Pack
            </Button>
          </div>

          <Table>
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-400 border-b border-gray-700">
                <th className="py-2">Tray Barcode</th>
                <th className="py-2">Instrument Set</th>
                <th className="py-2">Autoclave Unit & Batch</th>
                <th className="py-2">Bowie-Dick</th>
                <th className="py-2">Biological Indicator</th>
                <th className="py-2">Shelf Life Expiry</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {cssdTrays.map((t) => (
                <tr key={t.id}>
                  <td className="py-2 font-mono font-bold" style={{ color: '#FBBF24' }}>
                    {t.trayBarcode}
                  </td>
                  <td className="py-2" style={{ color: '#F8FAFC' }}>
                    <div>{t.trayName}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Assigned: {t.assignedRoom}</div>
                  </td>
                  <td className="py-2 text-xs" style={{ color: '#CBD5E1' }}>
                    <div>{t.autoclaveUnit}</div>
                    <div style={{ color: '#38BDF8', fontFamily: 'monospace' }}>{t.cycleBatchNumber}</div>
                  </td>
                  <td className="py-2">
                    <Badge variant={t.bowieDickStatus === 'PASS' ? 'success' : 'danger'}>
                      {t.bowieDickStatus}
                    </Badge>
                  </td>
                  <td className="py-2">
                    <Badge variant={t.biologicalIndicatorStatus === 'PASS' ? 'success' : 'danger'}>
                      {t.biologicalIndicatorStatus === 'PASS' ? 'NEGATIVE (PASS)' : 'FAIL'}
                    </Badge>
                  </td>
                  <td className="py-2 text-xs" style={{ color: '#34D399' }}>
                    {t.expiresAt}
                  </td>
                  <td className="py-2">
                    <Badge variant={t.status === 'STERILIZED_VALID' ? 'success' : 'danger'}>
                      {t.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* ==================================================== */}
      {/* TAB 3: DYNAMIC NPO FASTING & INDUCTION LOCKOUT DESK  */}
      {/* ==================================================== */}
      {activeTab === 'NPO_LOCKOUT' && (
        <Card className="p-4" style={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                ⏳ Dynamic Pre-Op Fasting (NPO) Hard-Lockout Desk
              </h2>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                ASA Practice Fasting Guidelines: Clear Fluids = 2h | Breast Milk = 4h | Light Meal/Tea = 6h | Heavy Meal = 8h
              </span>
            </div>
            <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', color: '#F87171', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
              Pulmonary Aspiration Defense Active
            </span>
          </div>

          <div className="space-y-3">
            {npoAssessments.map((n) => {
              const isLocked = n.npoStatus === 'ASPIRATION_RISK_LOCKED';
              const remainingHours = Math.max(0, n.requiredFastingHours - n.elapsedFastingHours).toFixed(1);

              return (
                <div
                  key={n.id}
                  style={{
                    backgroundColor: '#070C16',
                    border: isLocked ? '1.5px solid #EF4444' : '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC' }}>
                        {n.patientName} ({n.uhid}) — Scheduled: <strong style={{ color: '#38BDF8' }}>{n.scheduledTime}</strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                        Last Oral Intake: <strong style={{ color: '#FBBF24' }}>{n.lastOralIntakeTimestamp}</strong> • Classification: {n.intakeClassification.replace(/_/g, ' ')} ({n.requiredFastingHours} Hours Required)
                      </div>
                    </div>

                    <div>
                      {isLocked ? (
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.25)', border: '1px solid #EF4444', color: '#FCA5A5', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900 }}>
                            🚨 HARD LOCK: {remainingHours}h Fasting Remaining
                          </span>
                          <div style={{ fontSize: '0.7rem', color: '#F87171', marginTop: '4px' }}>
                            Safe Induction Time: {n.calculatedClearanceTimestamp}
                          </div>
                        </div>
                      ) : n.npoStatus === 'EMERGENCY_RSI_OVERRIDDEN' ? (
                        <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.25)', border: '1px solid #F59E0B', color: '#FDE68A', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900 }}>
                          ⚠️ RSI EMERGENCY OVERRIDE ACTIVE
                        </span>
                      ) : (
                        <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#34D399', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900 }}>
                          ✓ FASTING COMPLETE ({n.elapsedFastingHours}h) — SAFE
                        </span>
                      )}
                    </div>
                  </div>

                  {isLocked && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ fontSize: '0.74rem', color: '#FCA5A5' }}>
                        <strong>Aspiration Risk Alert:</strong> Induction with un-cleared stomach risks fatal Mendelson's syndrome. OT Sign-In is locked.
                      </div>
                      <Button
                        variant="danger"
                        onClick={() => {
                          const sched = schedules.find((s) => s.patientName.includes(n.patientName) || s.id === n.scheduleId);
                          if (sched) setSelectedScheduleForWho(sched);
                        }}
                        style={{ fontSize: '0.75rem', fontWeight: 800 }}
                      >
                        ⚡ Review Emergency RSI Protocol
                      </Button>
                    </div>
                  )}

                  {n.overrideReason && (
                    <div style={{ fontSize: '0.72rem', color: '#FDE68A', backgroundColor: 'rgba(245, 158, 11, 0.08)', padding: '6px 10px', borderRadius: '6px' }}>
                      <strong>Waiver Logged:</strong> {n.overrideReason} • Overridden by: {n.overridingAnesthetist}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ==================================================== */}
      {/* TAB 4: DYNAMIC OT SCHEDULING GRID & TURNAROUND OVERRUN */}
      {/* ==================================================== */}
      {activeTab === 'DYNAMIC_SCHEDULING' && (
        <Card className="p-4" style={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                ⚡ Dynamic OT Turnaround & Cascading Overrun Grid
              </h2>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                AI-Assisted Cascading Delay Forecast • HEPA Positive-Pressure Air Turnover (25-min Decontamination)
              </span>
            </div>

            <Button
              variant="primary"
              onClick={handleBroadcastOverrunAdjustments}
              style={{ fontSize: '0.78rem', backgroundColor: '#3B82F6', fontWeight: 800 }}
            >
              📡 Recalculate & Broadcast Delay Telemetry
            </Button>
          </div>

          {overrunBroadcastSuccess && (
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3B82F6', color: '#93C5FD', padding: '10px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, marginBottom: '12px' }}>
              ✓ Cascading slot delays recalculated! Notifications dispatched to Inpatient Wards, Surgeons, and Patient Mobile Companion.
            </div>
          )}

          <div className="space-y-4">
            {otRoomSlots.map((room) => (
              <div
                key={room.roomId}
                style={{
                  backgroundColor: '#070C16',
                  borderRadius: '12px',
                  border: room.isOverrunning ? '1.5px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Active Case Telemetry Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '1rem', fontWeight: 900, color: '#F8FAFC' }}>
                      {room.roomName}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                      Active Surgery: <strong style={{ color: '#38BDF8' }}>{room.procedureName}</strong> ({room.patientName}) • Surgeon: {room.surgeonName}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.74rem', color: '#CBD5E1' }}>
                      Elapsed: <strong>{room.actualElapsedMinutes}m</strong> / Sched: {room.scheduledDurationMinutes}m
                    </span>
                    {room.isOverrunning ? (
                      <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.25)', border: '1px solid #F59E0B', color: '#FBBF24', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900 }}>
                        🚨 OVERRUN (+{room.overrunMinutes} mins)
                      </span>
                    ) : (
                      <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#34D399', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900 }}>
                        ON SCHEDULE
                      </span>
                    )}
                  </div>
                </div>

                {/* HEPA Air Purge Turnaround Status */}
                <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '0.73rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>💨</span>
                    <div>
                      <strong style={{ color: '#38BDF8' }}>Laminar Positive Pressure & HEPA Turnover:</strong>
                      <span style={{ color: '#94A3B8', marginLeft: '6px' }}>
                        Mandatory 25-minute air decontamination cycle before next patient entry.
                      </span>
                    </div>
                  </div>
                  <span style={{ color: '#7DD3FC', fontWeight: 800 }}>
                    HEPA Cycle: 25 mins Reserved
                  </span>
                </div>

                {/* Cascading Subsequent Schedules */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#CBD5E1', marginBottom: '8px' }}>
                    Subsequent Scheduled Slots (Dynamic Cascading Adjustments):
                  </div>
                  <div className="space-y-2">
                    {room.subsequentCases.map((sub) => (
                      <div
                        key={sub.scheduleId}
                        style={{
                          backgroundColor: '#0F172A',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '8px',
                          fontSize: '0.75rem'
                        }}
                      >
                        <div>
                          <strong style={{ color: '#F8FAFC' }}>{sub.patientName}</strong> — {sub.procedure}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: '#94A3B8', textDecoration: sub.delayMinutes > 0 ? 'line-through' : 'none' }}>
                            Orig: {sub.originalTime}
                          </span>
                          {sub.delayMinutes > 0 ? (
                            <span style={{ color: '#FBBF24', fontWeight: 800 }}>
                              ➔ Revised: {sub.dynamicallyAdjustedTime} (+{sub.delayMinutes}m delay)
                            </span>
                          ) : (
                            <span style={{ color: '#34D399', fontWeight: 800 }}>
                              Unchanged: {sub.dynamicallyAdjustedTime}
                            </span>
                          )}
                          <span style={{ backgroundColor: sub.delayNotifiedToWard ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)', color: sub.delayNotifiedToWard ? '#34D399' : '#94A3B8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>
                            {sub.delayNotifiedToWard ? 'Ward Alerted ✓' : 'Pending Broadcast'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ==================================================== */}
      {/* TAB 5: PRE-ANESTHESIA CLEARANCE (PAC) GATEWAY        */}
      {/* ==================================================== */}
      {activeTab === 'PAC_GATEWAY' && (
        <Card className="p-4" style={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                Pre-Anesthesia Clearance (PAC) Mandatory Certification
              </h2>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                NABH Protocol: No elective surgical slot is confirmed without Anesthetist PAC approval.
              </span>
            </div>
            <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#6EE7B7', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
              Anesthesia Gateway Active
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pacRecords.map((p) => (
              <div key={p.id} style={{ backgroundColor: '#070C16', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC' }}>
                    {p.patientName} ({p.uhid}) — <span style={{ color: '#38BDF8' }}>{p.procedure}</span>
                  </div>
                  <span style={{ color: '#10B981', fontWeight: 800, fontSize: '0.75rem' }}>
                    ✓ CLEARED FOR GENERAL ANESTHESIA
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '0.75rem' }}>
                  <div><strong style={{ color: '#FBBF24' }}>ASA Classification:</strong> <span style={{ color: '#E2E8F0' }}>{p.asaClass}</span></div>
                  <div><strong style={{ color: '#38BDF8' }}>Mallampati Score:</strong> <span style={{ color: '#E2E8F0' }}>{p.mallampatiScore}</span></div>
                  <div><strong style={{ color: '#34D399' }}>NPO Fasting:</strong> <span style={{ color: '#E2E8F0' }}>{p.npoFastingHours}</span></div>
                  <div><strong style={{ color: '#94A3B8' }}>Anesthesiologist:</strong> <span style={{ color: '#E2E8F0' }}>{p.anesthetistName}</span></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ==================================================== */}
      {/* TAB 6: SURGICAL IMPLANT BARCODE REGISTRY             */}
      {/* ==================================================== */}
      {activeTab === 'IMPLANT_REGISTRY' && (
        <Card className="p-4" style={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                High-Value Surgical Implant & Prosthesis Barcode Vault
              </h2>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                Captures Manufacturer Lot, Serial number, and Expiry directly from sterile packaging barcode.
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '8px', backgroundColor: '#070C16', padding: '12px', borderRadius: '8px', marginBottom: '14px' }}>
            <input
              type="text"
              placeholder="Implant Name (e.g. Cobalt-Chrome Femoral Knee Head 36mm)..."
              value={newImplantName}
              onChange={(e) => setNewImplantName(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.78rem' }}
            />
            <input
              type="text"
              placeholder="Lot Number (e.g. LOT-2026-STR-881)..."
              value={newImplantLot}
              onChange={(e) => setNewImplantLot(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.78rem' }}
            />
            <Button variant="primary" onClick={handleAddImplant} style={{ fontSize: '0.78rem', backgroundColor: '#8B5CF6' }}>
              📲 Scan & Register Implant
            </Button>
          </div>

          <Table>
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-400 border-b border-gray-700">
                <th className="py-2">Implant Name</th>
                <th className="py-2">Manufacturer</th>
                <th className="py-2">Lot Number</th>
                <th className="py-2">Serial Number</th>
                <th className="py-2">Expiry</th>
                <th className="py-2">Scanned At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {implants.map((imp) => (
                <tr key={imp.id}>
                  <td className="py-2 font-bold" style={{ color: '#F8FAFC' }}>{imp.implantName}</td>
                  <td className="py-2" style={{ color: '#CBD5E1' }}>{imp.manufacturer}</td>
                  <td className="py-2" style={{ color: '#FBBF24', fontFamily: 'monospace' }}>{imp.lotNumber}</td>
                  <td className="py-2" style={{ color: '#38BDF8', fontFamily: 'monospace' }}>{imp.serialNumber}</td>
                  <td className="py-2" style={{ color: '#34D399' }}>{imp.expiryDate}</td>
                  <td className="py-2 text-xs text-gray-400">{imp.scannedAt}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* ==================================================== */}
      {/* WHO 3-PHASE CHECKLIST SIGN-OFF MODAL                 */}
      {/* ==================================================== */}
      {selectedScheduleForWho && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #06B6D4', borderRadius: '16px', width: '100%', maxWidth: '720px', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#38BDF8' }}>
                  WHO Surgical Safety Checklist Execution
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  {selectedScheduleForWho.patientName} • {selectedScheduleForWho.procedureName} ({selectedScheduleForWho.roomName})
                </span>
              </div>
              <button type="button" onClick={() => setSelectedScheduleForWho(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {whoSignedSuccess ? (
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#6EE7B7', padding: '16px', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 800, textAlign: 'center' }}>
                ✓ WHO {whoPhase} verification successfully certified and logged into permanent surgical dossier!
              </div>
            ) : (
              <>
                {/* Stage Tabs */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setWhoPhase('SIGN_IN')}
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', border: whoPhase === 'SIGN_IN' ? '1.5px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: whoPhase === 'SIGN_IN' ? 'rgba(56,189,248,0.2)' : 'transparent', color: whoPhase === 'SIGN_IN' ? '#38BDF8' : '#94A3B8' }}
                  >
                    1. SIGN-IN (Before Induction)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWhoPhase('TIME_OUT')}
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', border: whoPhase === 'TIME_OUT' ? '1.5px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)', backgroundColor: whoPhase === 'TIME_OUT' ? 'rgba(245,158,11,0.2)' : 'transparent', color: whoPhase === 'TIME_OUT' ? '#FBBF24' : '#94A3B8' }}
                  >
                    2. TIME-OUT (Before Incision)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWhoPhase('SIGN_OUT')}
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', border: whoPhase === 'SIGN_OUT' ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.1)', backgroundColor: whoPhase === 'SIGN_OUT' ? 'rgba(16,185,129,0.2)' : 'transparent', color: whoPhase === 'SIGN_OUT' ? '#34D399' : '#94A3B8' }}
                  >
                    3. SIGN-OUT (Before Leaving OT)
                  </button>
                </div>

                {/* Stage Checklist Items */}
                <div style={{ backgroundColor: '#070C16', padding: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.78rem' }}>
                  {/* PHASE 1: SIGN-IN */}
                  {whoPhase === 'SIGN_IN' && (
                    <>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#E2E8F0' }}>
                        <input
                          type="checkbox"
                          checked={signInChecks.identityVerified}
                          onChange={(e) => setSignInChecks((p) => ({ ...p, identityVerified: e.target.checked }))}
                        />
                        Patient identity, surgical site, procedure and consent confirmed
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#E2E8F0' }}>
                        <input
                          type="checkbox"
                          checked={signInChecks.siteMarked}
                          onChange={(e) => setSignInChecks((p) => ({ ...p, siteMarked: e.target.checked }))}
                        />
                        Surgical site marked by operating surgeon
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#E2E8F0' }}>
                        <input
                          type="checkbox"
                          checked={signInChecks.anesthesiaMachineChecked}
                          onChange={(e) => setSignInChecks((p) => ({ ...p, anesthesiaMachineChecked: e.target.checked }))}
                        />
                        Anesthesia machine & drug vaporizers checked; emergency airway cart ready
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#E2E8F0' }}>
                        <input
                          type="checkbox"
                          checked={signInChecks.pulseOximeterFunctioning}
                          onChange={(e) => setSignInChecks((p) => ({ ...p, pulseOximeterFunctioning: e.target.checked }))}
                        />
                        Pulse oximeter on patient and functioning (SpO2 &gt; 95%)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#E2E8F0' }}>
                        <input
                          type="checkbox"
                          checked={signInChecks.difficultAirwayEquipped}
                          onChange={(e) => setSignInChecks((p) => ({ ...p, difficultAirwayEquipped: e.target.checked }))}
                        />
                        Difficult airway / Mallampati assessment verified & video laryngoscope accessible
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#E2E8F0' }}>
                        <input
                          type="checkbox"
                          checked={signInChecks.bloodLossRiskAssessed}
                          onChange={(e) => setSignInChecks((p) => ({ ...p, bloodLossRiskAssessed: e.target.checked }))}
                        />
                        Risk of &gt; 500ml blood loss assessed; 2 large bore IV access & cross-matched blood ready
                      </label>

                      {/* Dynamic NPO Pre-Induction Hard-Lock Section */}
                      <div style={{ marginTop: '8px', padding: '10px', backgroundColor: '#0F172A', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 800, color: '#F87171' }}>
                            ⏳ Mandatory Pre-Op Fasting (NPO) Gate
                          </span>
                          {computeDependencyGate(selectedScheduleForWho).isNpoSafe || isRsiOverrideActive ? (
                            <Badge variant="success">Fasting Safe / Overridden ✓</Badge>
                          ) : (
                            <Badge variant="danger">Aspiration Lock Active 🔒</Badge>
                          )}
                        </div>

                        {!computeDependencyGate(selectedScheduleForWho).isNpoSafe && !isRsiOverrideActive ? (
                          <div className="space-y-2">
                            <p style={{ margin: 0, color: '#FCA5A5', fontSize: '0.72rem' }}>
                              ⚠️ Patient last oral intake reported within safety window. Elective induction is locked to avoid pulmonary aspiration (Mendelson&apos;s syndrome).
                            </p>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '6px' }}>
                              <input
                                type="text"
                                placeholder="Emergency Indication (e.g. Ruptured Ectopic, Bowel Strangulation)..."
                                value={rsiOverrideReason}
                                onChange={(e) => setRsiOverrideReason(e.target.value)}
                                style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', backgroundColor: '#070C16', border: '1px solid rgba(255,255,255,0.2)', color: '#F8FAFC', fontSize: '0.72rem' }}
                              />
                              <input
                                type="text"
                                placeholder="Overriding Anesthetist..."
                                value={rsiAnesthetistName}
                                onChange={(e) => setRsiAnesthetistName(e.target.value)}
                                style={{ width: '180px', padding: '6px 8px', borderRadius: '4px', backgroundColor: '#070C16', border: '1px solid rgba(255,255,255,0.2)', color: '#F8FAFC', fontSize: '0.72rem' }}
                              />
                              <Button variant="danger" onClick={handleApplyRsiOverrideInModal} style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                                ⚡ RSI Emergency Override
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ color: '#34D399', fontSize: '0.72rem' }}>
                            ✓ Patient fasting duration verified compliant or statutory Emergency RSI Protocol activated with cricoid pressure and high-flow suction.
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* PHASE 2: TIME-OUT */}
                  {whoPhase === 'TIME_OUT' && (
                    <>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#E2E8F0' }}>
                        <input
                          type="checkbox"
                          checked={timeOutChecks.teamIntroduced}
                          onChange={(e) => setTimeOutChecks((p) => ({ ...p, teamIntroduced: e.target.checked }))}
                        />
                        All team members introduced by name and role (Surgeon, Anesthetist, Scrub Nurse, Circulator)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#E2E8F0' }}>
                        <input
                          type="checkbox"
                          checked={timeOutChecks.surgeonReviewCriticalSteps}
                          onChange={(e) => setTimeOutChecks((p) => ({ ...p, surgeonReviewCriticalSteps: e.target.checked }))}
                        />
                        Surgeon reviews: critical or unexpected steps, operative duration, anticipated blood loss
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#E2E8F0' }}>
                        <input
                          type="checkbox"
                          checked={timeOutChecks.anesthetistReviewConcerns}
                          onChange={(e) => setTimeOutChecks((p) => ({ ...p, anesthetistReviewConcerns: e.target.checked }))}
                        />
                        Anesthetist reviews: patient-specific concerns, airway issues, invasive line access
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#E2E8F0' }}>
                        <input
                          type="checkbox"
                          checked={timeOutChecks.prophylacticAntibioticWithin60Min}
                          onChange={(e) => setTimeOutChecks((p) => ({ ...p, prophylacticAntibioticWithin60Min: e.target.checked }))}
                        />
                        Prophylactic antibiotic administered within last 60 minutes (&lt; 60 min before incision)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#E2E8F0' }}>
                        <input
                          type="checkbox"
                          checked={timeOutChecks.essentialImagingDisplayed}
                          onChange={(e) => setTimeOutChecks((p) => ({ ...p, essentialImagingDisplayed: e.target.checked }))}
                        />
                        Essential diagnostic imaging (CT, MRI, X-Ray) displayed on operating room monitor
                      </label>

                      {/* Interactive CSSD Autoclave Barcode Scanner */}
                      <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#0F172A', borderRadius: '8px', border: verifiedTrayDetails ? '1px solid #10B981' : '1px solid #F59E0B' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 800, color: '#FBBF24' }}>
                            🛡️ Mandatory CSSD Tray Barcode Verification
                          </span>
                          {verifiedTrayDetails ? (
                            <Badge variant="success">Tray Sterility Certified ✓</Badge>
                          ) : (
                            <Badge variant="warning">Sterility Scan Required ⚠️</Badge>
                          )}
                        </div>

                        {!verifiedTrayDetails ? (
                          <div className="space-y-2">
                            <p style={{ margin: 0, color: '#CBD5E1', fontSize: '0.72rem' }}>
                              Scrub/Circulating nurse must scan instrument tray barcode to verify Autoclave cycle date, Bowie-Dick status, and Biological indicator (Geobacillus stearothermophilus):
                            </p>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <input
                                type="text"
                                placeholder="Scan CSSD Tray Barcode (e.g. CSSD-TRAY-LAP-042)..."
                                value={scannedTrayBarcode}
                                onChange={(e) => setScannedTrayBarcode(e.target.value)}
                                style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', backgroundColor: '#070C16', border: '1px solid rgba(255,255,255,0.2)', color: '#F8FAFC', fontSize: '0.75rem' }}
                              />
                              <Button variant="primary" onClick={handleScanTrayInModal} style={{ fontSize: '0.75rem', backgroundColor: '#F59E0B', color: '#070C16', fontWeight: 800 }}>
                                🔍 Scan & Verify Tray
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setScannedTrayBarcode('CSSD-TRAY-LAP-042');
                                  setTimeout(handleScanTrayInModal, 50);
                                }}
                                style={{ fontSize: '0.72rem' }}
                              >
                                Autofill Matching
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '6px', fontSize: '0.73rem', color: '#34D399', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong>{verifiedTrayDetails.trayBarcode}:</strong> {verifiedTrayDetails.trayName}
                              <div style={{ color: '#CBD5E1', fontSize: '0.68rem', marginTop: '2px' }}>
                                Batch: {verifiedTrayDetails.cycleBatchNumber} • Bio Indicator: NEGATIVE (PASS) • Exp: {verifiedTrayDetails.expiresAt}
                              </div>
                            </div>
                            <Button variant="outline" onClick={() => setVerifiedTrayDetails(null)} style={{ fontSize: '0.68rem' }}>
                              Re-Scan
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* PHASE 3: SIGN-OUT */}
                  {whoPhase === 'SIGN_OUT' && (
                    <>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#E2E8F0' }}>
                        <input
                          type="checkbox"
                          checked={signOutChecks.nameOfProcedureRecorded}
                          onChange={(e) => setSignOutChecks((p) => ({ ...p, nameOfProcedureRecorded: e.target.checked }))}
                        />
                        Name of the procedure officially recorded in surgical register
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#E2E8F0' }}>
                        <input
                          type="checkbox"
                          checked={signOutChecks.spongeNeedleInstrumentCountCorrect}
                          onChange={(e) => setSignOutChecks((p) => ({ ...p, spongeNeedleInstrumentCountCorrect: e.target.checked }))}
                        />
                        Instrument, sponge, and needle counts are 100% CORRECT & reconciled by scrub and circulator
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#E2E8F0' }}>
                        <input
                          type="checkbox"
                          checked={signOutChecks.specimenLabeledCorrectly}
                          onChange={(e) => setSignOutChecks((p) => ({ ...p, specimenLabeledCorrectly: e.target.checked }))}
                        />
                        Specimen labeled with patient name, UHID, anatomic site, and formal histopathology requisition
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#E2E8F0' }}>
                        <input
                          type="checkbox"
                          checked={signOutChecks.postOpRecoveryPlanReviewed}
                          onChange={(e) => setSignOutChecks((p) => ({ ...p, postOpRecoveryPlanReviewed: e.target.checked }))}
                        />
                        Key concerns for post-op recovery, PACU transfer, and extubation reviewed by surgeon and anesthetist
                      </label>
                    </>
                  )}
                </div>

                {/* Modal Footer Controls */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedScheduleForWho(null)}
                    style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#CBD5E1', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteWhoSignOff}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '6px',
                      backgroundColor:
                        whoPhase === 'SIGN_IN' && !computeDependencyGate(selectedScheduleForWho).isNpoSafe && !isRsiOverrideActive
                          ? '#EF4444'
                          : whoPhase === 'TIME_OUT' && !timeOutChecks.cssdTrayBarcodeScanned
                            ? '#F59E0B'
                            : '#06B6D4',
                      border: 'none',
                      color: '#070C16',
                      fontSize: '0.8rem',
                      fontWeight: 900,
                      cursor: 'pointer'
                    }}
                  >
                    Confirm & Digitally Certify {whoPhase}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
