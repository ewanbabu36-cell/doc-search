import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';

export interface BedTurnaroundPrediction {
  id: string;
  bedCode: string;
  wardName: string;
  floor: string;
  patientName: string;
  uhid: string;
  primaryCondition: string;
  currentVitals: {
    bp: string;
    spo2: number;
    hr: number;
    painScore: number;
  };
  recoveryScorePercent: number;
  predictedDischargeTime: string;
  hoursUntilDischarge: number;
  recommendedCleaningProtocol: 'TERMINAL_UV_DISINFECTION' | 'STANDARD_TERMINAL_CLEAN';
  housekeepingStatus: 'ALERT_PENDING' | 'TEAM_STAGED' | 'IN_CLEANING' | 'CERTIFIED_AVAILABLE';
  assignedHousekeeper?: string;
  downtimeSavedMinutes: number;
}

export interface BleAssetItem {
  id: string;
  name: string;
  tagId: string;
  assetType: 'CRASH_CART' | 'OXYGEN_CYLINDER' | 'TRANSPORT_VENTILATOR' | 'DEFIBRILLATOR';
  floor: 'GROUND' | 'FLOOR_1' | 'FLOOR_2' | 'FLOOR_3';
  roomZone: string;
  xPercent: number; // blueprint X coordinates 0-100
  yPercent: number; // blueprint Y coordinates 0-100
  batteryPercent: number;
  rssiSignalDbm: number;
  lastPingSecondsAgo: number;
  // Specific to O2 Cylinders
  o2PressurePsi?: number;
  isO2Empty?: boolean;
  // Specific to Crash Carts
  codeBlueReady?: boolean;
  defibrillatorBatteryPercent?: number;
  assignedWard: string;
}

const INITIAL_BED_PREDICTIONS: BedTurnaroundPrediction[] = [
  {
    id: 'PRED-302',
    bedCode: 'Bed 302-ICU',
    wardName: 'Intensive Care Unit (ICU Pod A)',
    floor: '2nd Floor',
    patientName: 'Ramesh Kumar (56M)',
    uhid: 'UHID-2026-CARD-091',
    primaryCondition: 'Post-PTCA Stenting Day 3 (Weaned to Room Air)',
    currentVitals: { bp: '124/78', spo2: 99, hr: 72, painScore: 1 },
    recoveryScorePercent: 94,
    predictedDischargeTime: '02:00 PM (In ~3.5 Hours)',
    hoursUntilDischarge: 3.5,
    recommendedCleaningProtocol: 'TERMINAL_UV_DISINFECTION',
    housekeepingStatus: 'ALERT_PENDING',
    downtimeSavedMinutes: 45
  },
  {
    id: 'PRED-104',
    bedCode: 'Bed 104-SURG',
    wardName: 'General Surgical Ward',
    floor: '3rd Floor',
    patientName: 'Rahul Verma (38M)',
    uhid: 'UHID-2026-9041',
    primaryCondition: 'Post-Lap Appendectomy (Tolerating Oral Diet)',
    currentVitals: { bp: '120/76', spo2: 98, hr: 74, painScore: 1 },
    recoveryScorePercent: 96,
    predictedDischargeTime: '03:15 PM (In ~4.5 Hours)',
    hoursUntilDischarge: 4.5,
    recommendedCleaningProtocol: 'STANDARD_TERMINAL_CLEAN',
    housekeepingStatus: 'ALERT_PENDING',
    downtimeSavedMinutes: 38
  },
  {
    id: 'PRED-208',
    bedCode: 'Bed 208-CARD',
    wardName: 'Cardiology Step-Down Ward',
    floor: '2nd Floor',
    patientName: 'Shanti Devi (68F)',
    uhid: 'UHID-2026-9042',
    primaryCondition: 'Acute Decompensated CHF (Dyspnea Resolved)',
    currentVitals: { bp: '122/80', spo2: 97, hr: 68, painScore: 0 },
    recoveryScorePercent: 91,
    predictedDischargeTime: '04:30 PM (In ~6 Hours)',
    hoursUntilDischarge: 5.8,
    recommendedCleaningProtocol: 'STANDARD_TERMINAL_CLEAN',
    housekeepingStatus: 'ALERT_PENDING',
    downtimeSavedMinutes: 40
  }
];

const INITIAL_BLE_ASSETS: BleAssetItem[] = [
  // 2nd Floor (ICU & Step-Down)
  {
    id: 'BLE-CC-01',
    name: 'Crash Cart #CC-01 (ICU Pod A)',
    tagId: 'BLE-TAG-8812-CC',
    assetType: 'CRASH_CART',
    floor: 'FLOOR_2',
    roomZone: 'ICU Central Nursing Station',
    xPercent: 52,
    yPercent: 44,
    batteryPercent: 98,
    rssiSignalDbm: -54,
    lastPingSecondsAgo: 2,
    codeBlueReady: true,
    defibrillatorBatteryPercent: 100,
    assignedWard: 'Intensive Care Unit'
  },
  {
    id: 'BLE-O2-201',
    name: 'Oxygen Cylinder #O2-D-201 (Jumbo D)',
    tagId: 'BLE-TAG-1049-O2',
    assetType: 'OXYGEN_CYLINDER',
    floor: 'FLOOR_2',
    roomZone: 'ICU Bay 2 (Near Bed 302)',
    xPercent: 32,
    yPercent: 30,
    batteryPercent: 88,
    rssiSignalDbm: -62,
    lastPingSecondsAgo: 5,
    o2PressurePsi: 1980,
    isO2Empty: false,
    assignedWard: 'Intensive Care Unit'
  },
  {
    id: 'BLE-TV-02',
    name: 'Hamilton Transport Ventilator #TV-02',
    tagId: 'BLE-TAG-4921-TV',
    assetType: 'TRANSPORT_VENTILATOR',
    floor: 'FLOOR_2',
    roomZone: 'ICU Equipment Alcove',
    xPercent: 78,
    yPercent: 68,
    batteryPercent: 92,
    rssiSignalDbm: -58,
    lastPingSecondsAgo: 3,
    assignedWard: 'Intensive Care Unit'
  },

  // Ground Floor (ER & Trauma)
  {
    id: 'BLE-CC-02',
    name: 'Emergency Trauma Crash Cart #CC-02',
    tagId: 'BLE-TAG-9011-CC',
    assetType: 'CRASH_CART',
    floor: 'GROUND',
    roomZone: 'ER Trauma Resuscitation Bay 1',
    xPercent: 45,
    yPercent: 38,
    batteryPercent: 95,
    rssiSignalDbm: -48,
    lastPingSecondsAgo: 1,
    codeBlueReady: true,
    defibrillatorBatteryPercent: 96,
    assignedWard: 'Emergency Department'
  },
  {
    id: 'BLE-O2-104',
    name: 'Oxygen Cylinder #O2-B-104 (Type B)',
    tagId: 'BLE-TAG-3312-O2',
    assetType: 'OXYGEN_CYLINDER',
    floor: 'GROUND',
    roomZone: 'ER Observation Bay (Cubicle 4)',
    xPercent: 24,
    yPercent: 62,
    batteryPercent: 72,
    rssiSignalDbm: -66,
    lastPingSecondsAgo: 4,
    o2PressurePsi: 15, // CRITICAL EMPTY! (<200 PSI)
    isO2Empty: true,
    assignedWard: 'Emergency Department'
  },
  {
    id: 'BLE-O2-109',
    name: 'Oxygen Cylinder #O2-B-109 (Type B)',
    tagId: 'BLE-TAG-3319-O2',
    assetType: 'OXYGEN_CYLINDER',
    floor: 'GROUND',
    roomZone: 'ER Ambulance Triage Airway Bay',
    xPercent: 72,
    yPercent: 25,
    batteryPercent: 84,
    rssiSignalDbm: -55,
    lastPingSecondsAgo: 2,
    o2PressurePsi: 450,
    isO2Empty: false,
    assignedWard: 'Emergency Department'
  },

  // 1st Floor (OT Complex)
  {
    id: 'BLE-CC-03',
    name: 'OT Sterile Corridor Crash Cart #CC-03',
    tagId: 'BLE-TAG-7712-CC',
    assetType: 'CRASH_CART',
    floor: 'FLOOR_1',
    roomZone: 'OT 2 Sterile Airlock Corridor',
    xPercent: 50,
    yPercent: 50,
    batteryPercent: 99,
    rssiSignalDbm: -51,
    lastPingSecondsAgo: 2,
    codeBlueReady: true,
    defibrillatorBatteryPercent: 100,
    assignedWard: 'Operation Theatre Complex'
  },
  {
    id: 'BLE-O2-302',
    name: 'Oxygen Cylinder #O2-D-302 (Type D Backup)',
    tagId: 'BLE-TAG-8841-O2',
    assetType: 'OXYGEN_CYLINDER',
    floor: 'FLOOR_1',
    roomZone: 'Recovery PACU Bay 3',
    xPercent: 68,
    yPercent: 35,
    batteryPercent: 90,
    rssiSignalDbm: -60,
    lastPingSecondsAgo: 6,
    o2PressurePsi: 1850,
    isO2Empty: false,
    assignedWard: 'Operation Theatre Complex'
  }
];

export const SmartHospitalIotBedOrchestrationView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'PREDICTIVE_BEDS' | 'BLE_BLUEPRINT'>('PREDICTIVE_BEDS');

  // Predictive Bed State
  const [bedPredictions, setBedPredictions] = useState<BedTurnaroundPrediction[]>(INITIAL_BED_PREDICTIONS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Blueprint Map State
  const [activeFloor, setActiveFloor] = useState<'GROUND' | 'FLOOR_1' | 'FLOOR_2' | 'FLOOR_3'>('FLOOR_2');
  const [assetFilter, setAssetFilter] = useState<'ALL' | 'CRASH_CART' | 'OXYGEN_CYLINDER' | 'EMPTY_O2'>('ALL');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>('BLE-CC-01');
  const [bleAssets, setBleAssets] = useState<BleAssetItem[]>(INITIAL_BLE_ASSETS);
  const [isBeeperSounding, setIsBeeperSounding] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 7000);
  };

  // 1-Click: Early Housekeeping Dispatch Handler
  const handleDispatchEarlyCleaning = (bedId: string) => {
    setBedPredictions((prev) =>
      prev.map((b) =>
        b.id === bedId
          ? {
              ...b,
              housekeepingStatus: 'TEAM_STAGED',
              assignedHousekeeper: 'Sunil Pawar (Housekeeping Senior Lead + UV-C Robot #03)'
            }
          : b
      )
    );
    const target = bedPredictions.find((b) => b.id === bedId);
    showToast(`⚡ Housekeeping Pre-Cleaning Team Staged for ${target?.bedCode}! Alert sent 4h prior to discharge.`);
  };

  // 1-Click: Dispatch Porter to Swap Empty O2 Cylinder
  const handleSwapO2Cylinder = (assetId: string) => {
    setBleAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? {
              ...a,
              o2PressurePsi: 2000,
              isO2Empty: false
            }
          : a
      )
    );
    showToast(`🤿 Biomedical Porter Dispatched! Empty Cylinder ${assetId} swapped with fresh 2000 PSI cylinder.`);
  };

  // 1-Click: Sound BLE Beeper
  const handleSoundBeeper = (assetId: string) => {
    setIsBeeperSounding(assetId);
    showToast(`🔔 Audio Beacon Triggered! BLE Tag on ${assetId} is beeping with high-pitch pulse.`);
    setTimeout(() => {
      setIsBeeperSounding(null);
    }, 4000);
  };

  const currentFloorAssets = bleAssets.filter((a) => {
    if (a.floor !== activeFloor) return false;
    if (assetFilter === 'CRASH_CART') return a.assetType === 'CRASH_CART';
    if (assetFilter === 'OXYGEN_CYLINDER') return a.assetType === 'OXYGEN_CYLINDER';
    if (assetFilter === 'EMPTY_O2') return a.isO2Empty;
    return true;
  });

  const selectedAsset = bleAssets.find((a) => a.id === selectedAssetId) || currentFloorAssets[0] || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F2027 100%)',
          border: '1.5px solid #818CF8',
          borderRadius: '16px',
          padding: '20px 24px',
          boxShadow: '0 8px 32px rgba(129, 140, 248, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #818CF8, #4F46E5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              boxShadow: '0 0 20px rgba(129, 140, 248, 0.5)'
            }}
          >
            📡
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#F8FAFC' }}>
                Smart Hospital IoT & Autonomous Bed Orchestration
              </h2>
              <span
                style={{
                  backgroundColor: 'rgba(129, 140, 248, 0.2)',
                  color: '#A5B4FC',
                  border: '1px solid #818CF8',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}
              >
                RTLS & PREDICTIVE AI
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', color: '#C7D2FE', fontSize: '0.8125rem' }}>
              4-Hour AI Predictive Bed Turnaround (40-55% Downtime Reduction) & Real-Time BLE Blueprint Tracking for Crash Carts & O2 Cylinders
            </p>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#0B132B', padding: '4px', borderRadius: '10px' }}>
          <button
            onClick={() => setActiveSubTab('PREDICTIVE_BEDS')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeSubTab === 'PREDICTIVE_BEDS' ? '#4F46E5' : 'transparent',
              color: activeSubTab === 'PREDICTIVE_BEDS' ? '#FFFFFF' : '#94A3B8',
              fontWeight: 800,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🛌</span> Predictive Bed Turnaround ({bedPredictions.length})
          </button>
          <button
            onClick={() => setActiveSubTab('BLE_BLUEPRINT')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeSubTab === 'BLE_BLUEPRINT' ? '#4F46E5' : 'transparent',
              color: activeSubTab === 'BLE_BLUEPRINT' ? '#FFFFFF' : '#94A3B8',
              fontWeight: 800,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🗺️</span> BLE Blueprint Map ({bleAssets.length} Assets)
          </button>
        </div>
      </div>

      {/* Floating Notification Banner */}
      {toastMessage && (
        <div
          style={{
            backgroundColor: '#064E3B',
            border: '1.5px solid #10B981',
            color: '#A7F3D0',
            padding: '12px 18px',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 700,
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>📡</span>
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'transparent', border: 'none', color: '#A7F3D0', cursor: 'pointer', fontWeight: 800, fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* SUB-TAB 1: PREDICTIVE BED TURNAROUND */}
      {activeSubTab === 'PREDICTIVE_BEDS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* KPI Metrics Dashboard */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>AVERAGE BED TURNOVER DOWNTIME</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
                38 Mins <span style={{ fontSize: '0.8125rem', color: '#6EE7B7', fontWeight: 700 }}>(-55% Drop)</span>
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>Benchmark baseline: 85 mins manual turnover</span>
            </div>

            <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>AI PREDICTIVE LEAD TIME</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#38BDF8', marginTop: '4px' }}>
                4.0 Hours
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#7DD3FC' }}>Advance notice sent to Housekeeping</span>
            </div>

            <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>BEDS PREDICTED FOR DISCHARGE</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>
                {bedPredictions.length} Beds (Next 6h)
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#FCD34D' }}>Recovery score &gt; 90% verified</span>
            </div>

            <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>ICU TERMINAL UV-C STAGED</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#A855F7', marginTop: '4px' }}>
                1 Unit Active
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#D8B4FE' }}>UV-C Robot #03 allocated for Bed 302</span>
            </div>
          </div>

          {/* Predictive Bed Table */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC' }}>
                  Real-Time Clinical Recovery & Early Discharge Predictions
                </h3>
                <p style={{ margin: '4px 0 0 0', color: '#94A3B8', fontSize: '0.8125rem' }}>
                  AI monitors weaning parameters, vital stability, and post-op markers to alert housekeeping 4 hours prior to physical discharge.
                </p>
              </div>
              <Badge variant="primary">AI CONTINUOUS SCANNING</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {bedPredictions.map((b) => (
                <div
                  key={b.id}
                  style={{
                    backgroundColor: '#1E293B',
                    border: b.housekeepingStatus === 'TEAM_STAGED' ? '1.5px solid #10B981' : '1px solid #334155',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(160px, 1.2fr) minmax(200px, 1.5fr) minmax(180px, 1.2fr) minmax(160px, 1fr) auto',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  {/* Bed & Ward */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>🛏️</span>
                      <span style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '1rem' }}>{b.bedCode}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                      {b.wardName} · {b.floor}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 600 }}>
                      Patient: {b.patientName}
                    </span>
                  </div>

                  {/* Clinical Recovery & Vitals */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Recovery Score:</span>
                      <strong style={{ color: '#10B981', fontSize: '0.875rem' }}>{b.recoveryScorePercent}%</strong>
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>
                      Vitals: BP {b.currentVitals.bp} · SpO2 {b.currentVitals.spo2}% · HR {b.currentVitals.hr} · Pain {b.currentVitals.painScore}/10
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: '#A78BFA', fontWeight: 600 }}>
                      {b.primaryCondition}
                    </span>
                  </div>

                  {/* Predicted Discharge & Downtime Saved */}
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>PREDICTED DISCHARGE</span>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#F59E0B', marginTop: '2px' }}>
                      🕒 {b.predictedDischargeTime}
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700 }}>
                      ⚡ Saves ~{b.downtimeSavedMinutes} mins bed downtime
                    </span>
                  </div>

                  {/* Housekeeping Cleaning Protocol & Status */}
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>CLEANING PROTOCOL</span>
                    <span
                      style={{
                        backgroundColor: b.recommendedCleaningProtocol === 'TERMINAL_UV_DISINFECTION' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                        color: b.recommendedCleaningProtocol === 'TERMINAL_UV_DISINFECTION' ? '#D8B4FE' : '#7DD3FC',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        display: 'inline-block',
                        marginTop: '2px'
                      }}
                    >
                      {b.recommendedCleaningProtocol === 'TERMINAL_UV_DISINFECTION' ? '🔬 UV-C Terminal Sanitization' : '🧹 Standard Disinfection'}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: b.housekeepingStatus === 'TEAM_STAGED' ? '#10B981' : '#FBBF24', display: 'block', marginTop: '4px', fontWeight: 700 }}>
                      {b.housekeepingStatus === 'TEAM_STAGED' ? '✓ CLEANING TEAM STAGED' : '⚠️ ADVANCE ALERT PENDING'}
                    </span>
                  </div>

                  {/* Action Button */}
                  <div>
                    {b.housekeepingStatus === 'ALERT_PENDING' ? (
                      <Button
                        variant="primary"
                        onClick={() => handleDispatchEarlyCleaning(b.id)}
                        style={{
                          backgroundColor: '#4F46E5',
                          borderColor: '#4338CA',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          padding: '8px 12px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        ⚡ Dispatch Early Alert
                      </Button>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ backgroundColor: '#064E3B', color: '#6EE7B7', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-block' }}>
                          ✓ Staged ({b.assignedHousekeeper?.slice(0, 11)}...)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BLE BLUEPRINT MAP & ASSET TRACKER */}
      {activeSubTab === 'BLE_BLUEPRINT' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 2fr) minmax(320px, 1fr)', gap: '20px' }}>
          {/* Left: Interactive Hospital Floor Blueprint */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #334155',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC' }}>
                  Interactive Hospital Architectural Blueprint Map
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Real-time Bluetooth Low Energy (BLE) asset beacons with indoor positioning
                </span>
              </div>

              {/* Floor Switcher */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['GROUND', 'FLOOR_1', 'FLOOR_2', 'FLOOR_3'] as const).map((fl) => (
                  <button
                    key={fl}
                    onClick={() => setActiveFloor(fl)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: activeFloor === fl ? '1.5px solid #818CF8' : '1px solid #334155',
                      backgroundColor: activeFloor === fl ? '#312E81' : '#1E293B',
                      color: activeFloor === fl ? '#E0E7FF' : '#94A3B8',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    {fl === 'GROUND' ? 'Ground (ER)' : fl === 'FLOOR_1' ? '1st (OT)' : fl === 'FLOOR_2' ? '2nd (ICU)' : '3rd (Wards)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Asset Filters */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(['ALL', 'CRASH_CART', 'OXYGEN_CYLINDER', 'EMPTY_O2'] as const).map((fil) => (
                <button
                  key={fil}
                  onClick={() => setAssetFilter(fil)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: assetFilter === fil ? '1px solid #38BDF8' : '1px solid #1E293B',
                    backgroundColor: assetFilter === fil ? 'rgba(56, 189, 248, 0.2)' : '#0F172A',
                    color: assetFilter === fil ? '#7DD3FC' : '#64748B',
                    fontWeight: 700,
                    fontSize: '0.6875rem',
                    cursor: 'pointer'
                  }}
                >
                  {fil === 'ALL'
                    ? 'All Assets'
                    : fil === 'CRASH_CART'
                    ? '🚨 Crash Carts (Defibrillators)'
                    : fil === 'OXYGEN_CYLINDER'
                    ? '🤿 O2 Cylinders'
                    : '⚠️ Empty O2 Alert (<200 PSI)'}
                </button>
              ))}
            </div>

            {/* Interactive Blueprint Canvas Map */}
            <div
              style={{
                position: 'relative',
                height: '460px',
                backgroundColor: '#020617',
                border: '2px solid #1E293B',
                borderRadius: '14px',
                overflow: 'hidden',
                backgroundImage: 'radial-gradient(rgba(129, 140, 248, 0.15) 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }}
            >
              {/* Floor Plan Architectural Markings */}
              {activeFloor === 'FLOOR_2' && (
                <>
                  <div style={{ position: 'absolute', top: '10px', left: '10px', border: '1px dashed #334155', padding: '8px', width: '38%', height: '42%', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 800 }}>ICU POD A (Beds 301-306)</span>
                  </div>
                  <div style={{ position: 'absolute', top: '10px', right: '10px', border: '1px dashed #334155', padding: '8px', width: '38%', height: '42%', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 800 }}>ICU POD B (Isolation Cubicles)</span>
                  </div>
                  <div style={{ position: 'absolute', top: '48%', left: '30%', width: '40%', height: '24%', border: '1.5px solid #38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.05)', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#7DD3FC', fontWeight: 900 }}>CENTRAL NURSING COMMAND STATION</span>
                  </div>
                  <div style={{ position: 'absolute', bottom: '10px', left: '10px', border: '1px dashed #334155', padding: '8px', width: '45%', height: '24%', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 800 }}>CARDIOLOGY STEP-DOWN BEDS</span>
                  </div>
                  <div style={{ position: 'absolute', bottom: '10px', right: '10px', border: '1px dashed #334155', padding: '8px', width: '45%', height: '24%', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 800 }}>BIOMEDICAL EQUIPMENT ALCOVE</span>
                  </div>
                </>
              )}

              {activeFloor === 'GROUND' && (
                <>
                  <div style={{ position: 'absolute', top: '10px', left: '10px', border: '1px dashed #EF4444', padding: '8px', width: '45%', height: '45%', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#F87171', fontWeight: 900 }}>ER RESUSCITATION & TRAUMA BAY</span>
                  </div>
                  <div style={{ position: 'absolute', top: '10px', right: '10px', border: '1px dashed #334155', padding: '8px', width: '45%', height: '45%', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 800 }}>AMBULANCE TRIAGE DOCK</span>
                  </div>
                  <div style={{ position: 'absolute', bottom: '10px', left: '10px', border: '1px dashed #334155', padding: '8px', width: '92%', height: '42%', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 800 }}>OPD OBSERVATION & AIRWAY CORRIDOR</span>
                  </div>
                </>
              )}

              {activeFloor === 'FLOOR_1' && (
                <>
                  <div style={{ position: 'absolute', top: '10px', left: '10px', border: '1px dashed #334155', padding: '8px', width: '42%', height: '42%', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 800 }}>OPERATION THEATRE 1 (STERILE)</span>
                  </div>
                  <div style={{ position: 'absolute', top: '10px', right: '10px', border: '1px dashed #334155', padding: '8px', width: '42%', height: '42%', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 800 }}>OPERATION THEATRE 2 (STERILE)</span>
                  </div>
                  <div style={{ position: 'absolute', bottom: '10px', left: '10px', border: '1px dashed #334155', padding: '8px', width: '92%', height: '45%', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 800 }}>PACU POST-ANESTHESIA RECOVERY</span>
                  </div>
                </>
              )}

              {activeFloor === 'FLOOR_3' && (
                <div style={{ position: 'absolute', inset: '10px', border: '1px dashed #334155', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 800 }}>INPATIENT GENERAL SURGICAL & MEDICAL WARDS (Rooms 301 - 324)</span>
                </div>
              )}

              {/* Dynamic BLE Asset Pins */}
              {currentFloorAssets.map((asset) => {
                const isSelected = asset.id === selectedAssetId;
                const isBeeperActive = isBeeperSounding === asset.id;

                return (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAssetId(asset.id)}
                    style={{
                      position: 'absolute',
                      left: `${asset.xPercent}%`,
                      top: `${asset.yPercent}%`,
                      transform: 'translate(-50%, -50%)',
                      cursor: 'pointer',
                      zIndex: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Pulsing Beacon Circle */}
                    <div
                      style={{
                        width: isSelected ? '46px' : '38px',
                        height: isSelected ? '46px' : '38px',
                        borderRadius: '50%',
                        backgroundColor:
                          asset.isO2Empty
                            ? '#EF4444'
                            : asset.assetType === 'CRASH_CART'
                            ? '#F59E0B'
                            : '#10B981',
                        border: isSelected ? '3px solid #FFFFFF' : '2px solid #0F172A',
                        boxShadow:
                          asset.isO2Empty || isBeeperActive
                            ? '0 0 25px rgba(239, 68, 68, 0.9)'
                            : isSelected
                            ? '0 0 20px rgba(255, 255, 255, 0.8)'
                            : '0 4px 10px rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        animation: asset.isO2Empty || isBeeperActive ? 'pulse 1s infinite' : 'none'
                      }}
                    >
                      {asset.assetType === 'CRASH_CART' ? '🚨' : asset.assetType === 'OXYGEN_CYLINDER' ? '🤿' : '📟'}
                    </div>

                    {/* Mini Label */}
                    <div
                      style={{
                        backgroundColor: '#0F172A',
                        border: isSelected ? '1px solid #FFFFFF' : '1px solid #334155',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '0.625rem',
                        color: asset.isO2Empty ? '#F87171' : '#F8FAFC',
                        fontWeight: 800,
                        marginTop: '4px',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
                      }}
                    >
                      {asset.name.split(' ')[0]} {asset.name.split(' ')[1]}
                      {asset.isO2Empty && ' (EMPTY!)'}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6875rem', color: '#64748B' }}>
              <span>📍 Coordinates calibrated via 16x BLE Gateway Anchors</span>
              <span>Showing {currentFloorAssets.length} active BLE beacons on this floor</span>
            </div>
          </div>

          {/* Right: Selected Asset Telemetry & Action Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {selectedAsset ? (
              <div
                style={{
                  backgroundColor: '#0F172A',
                  border: selectedAsset.isO2Empty ? '2px solid #EF4444' : '1.5px solid #38BDF8',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: selectedAsset.isO2Empty ? '0 0 30px rgba(239, 68, 68, 0.3)' : '0 8px 30px rgba(0,0,0,0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700 }}>
                      BLE ASSET TELEMETRY
                    </span>
                    <h3 style={{ margin: '2px 0 0 0', fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC' }}>
                      {selectedAsset.name}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      {selectedAsset.tagId} · {selectedAsset.roomZone}
                    </span>
                  </div>

                  <span
                    style={{
                      backgroundColor: selectedAsset.isO2Empty ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: selectedAsset.isO2Empty ? '#F87171' : '#6EE7B7',
                      border: selectedAsset.isO2Empty ? '1px solid #EF4444' : '1px solid #10B981',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.6875rem',
                      fontWeight: 800
                    }}
                  >
                    {selectedAsset.isO2Empty ? 'CRITICAL EMPTY' : 'ONLINE READY'}
                  </span>
                </div>

                {/* Specific O2 Cylinder Metric */}
                {selectedAsset.assetType === 'OXYGEN_CYLINDER' && (
                  <div
                    style={{
                      backgroundColor: selectedAsset.isO2Empty ? 'rgba(239, 68, 68, 0.15)' : '#1E293B',
                      border: selectedAsset.isO2Empty ? '1.5px solid #EF4444' : '1px solid #334155',
                      borderRadius: '12px',
                      padding: '14px'
                    }}
                  >
                    <span style={{ fontSize: '0.6875rem', color: selectedAsset.isO2Empty ? '#FCA5A5' : '#94A3B8', fontWeight: 700 }}>
                      DIGITAL MANIFOLD PRESSURE GAUGE
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 900, color: selectedAsset.isO2Empty ? '#EF4444' : '#10B981' }}>
                        {selectedAsset.o2PressurePsi} PSI
                      </span>
                      <span style={{ fontSize: '0.75rem', color: selectedAsset.isO2Empty ? '#F87171' : '#6EE7B7', fontWeight: 700 }}>
                        {selectedAsset.isO2Empty ? '⚠️ EMPTY (Below 200 PSI Threshold)' : '✓ High Capacity (Full)'}
                      </span>
                    </div>

                    <div style={{ height: '8px', backgroundColor: '#0F172A', borderRadius: '4px', overflow: 'hidden', marginTop: '8px' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(((selectedAsset.o2PressurePsi || 0) / 2000) * 100, 100)}%`,
                          backgroundColor: selectedAsset.isO2Empty ? '#EF4444' : '#10B981'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Specific Crash Cart Metric */}
                {selectedAsset.assetType === 'CRASH_CART' && (
                  <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Defibrillator Certification:</span>
                      <strong style={{ color: '#10B981', fontSize: '0.8125rem' }}>✓ Certified / Daily Self-Test Passed</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Defibrillator Battery:</span>
                      <strong style={{ color: '#F8FAFC', fontSize: '0.8125rem' }}>{selectedAsset.defibrillatorBatteryPercent}% Charged</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Airway & Suction Kit:</span>
                      <strong style={{ color: '#38BDF8', fontSize: '0.8125rem' }}>Intact / Sealed Seal #88124</strong>
                    </div>
                  </div>
                )}

                {/* Technical Telemetry Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.75rem' }}>
                  <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '8px' }}>
                    <span style={{ color: '#94A3B8', display: 'block' }}>BLE Tag Battery:</span>
                    <span style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.9375rem', marginTop: '2px', display: 'block' }}>
                      🔋 {selectedAsset.batteryPercent}%
                    </span>
                  </div>

                  <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '8px' }}>
                    <span style={{ color: '#94A3B8', display: 'block' }}>Signal Strength:</span>
                    <span style={{ color: '#10B981', fontWeight: 800, fontSize: '0.9375rem', marginTop: '2px', display: 'block' }}>
                      📶 {selectedAsset.rssiSignalDbm} dBm
                    </span>
                  </div>

                  <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '8px' }}>
                    <span style={{ color: '#94A3B8', display: 'block' }}>Assigned Department:</span>
                    <span style={{ color: '#CBD5E1', fontWeight: 600, marginTop: '2px', display: 'block' }}>
                      {selectedAsset.assignedWard}
                    </span>
                  </div>

                  <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '8px' }}>
                    <span style={{ color: '#94A3B8', display: 'block' }}>Last Gateway Ping:</span>
                    <span style={{ color: '#CBD5E1', fontWeight: 600, marginTop: '2px', display: 'block' }}>
                      {selectedAsset.lastPingSecondsAgo}s ago (Live Heartbeat)
                    </span>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  {selectedAsset.isO2Empty && (
                    <Button
                      variant="primary"
                      onClick={() => handleSwapO2Cylinder(selectedAsset.id)}
                      style={{
                        backgroundColor: '#EF4444',
                        borderColor: '#DC2626',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '0.8125rem',
                        padding: '10px',
                        boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
                      }}
                    >
                      ⚡ Dispatch Porter to Swap Empty O2 Cylinder
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => handleSoundBeeper(selectedAsset.id)}
                    style={{
                      borderColor: '#F59E0B',
                      color: '#FBBF24',
                      fontWeight: 800,
                      fontSize: '0.8125rem',
                      padding: '10px'
                    }}
                  >
                    🔔 Sound Proximity Beeper on BLE Tag (Locate Equipment)
                  </Button>

                  {selectedAsset.assetType === 'CRASH_CART' && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        showToast(`🚨 CODE BLUE DRILL INITIATED: Audio alert sounding at ${selectedAsset.roomZone}!`);
                      }}
                      style={{
                        borderColor: '#EF4444',
                        color: '#F87171',
                        fontWeight: 800,
                        fontSize: '0.8125rem',
                        padding: '10px'
                      }}
                    >
                      🚨 Trigger Code Blue Drill (Dispatch Nearest Team)
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontStyle: 'italic' }}>
                Select an asset pin on the floor map to inspect live BLE telemetry.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
