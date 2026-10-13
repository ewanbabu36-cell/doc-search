import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Table, Badge, Button } from '@docsearch/ui-kit';
import type { EmergencyAmbulanceTransferDto, EmergencyEncounterDto } from '@docsearch/api-contracts';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface AmbulanceTransferViewProps {
  transfers: EmergencyAmbulanceTransferDto[];
  encounters: EmergencyEncounterDto[];
  onDispatchAmbulance: (enc: EmergencyEncounterDto) => void;
  onRefresh?: (() => void) | undefined;
}

export interface InboundAmbulanceTelemetry {
  id: string;
  callSign: string;
  vehicleNumber: string;
  ambulanceType: 'ALS_CARDIAC_ICU' | 'ALS_TRAUMA' | 'BLS_TRANSPORT' | 'NEONATAL_NICU';
  driverName: string;
  paramedicName: string;
  paramedicContact: string;
  patientName: string;
  patientAgeGender: string;
  chiefComplaint: string;
  triageCategory: 'RED_IMMEDIATE' | 'YELLOW_URGENT' | 'GREEN_DELAYED';
  etaSeconds: number;
  speedKmph: number;
  currentLocation: string;
  hospitalDistanceKm: number;
  vitalTelemetry: {
    hr: number;
    spo2: number;
    bp: string;
    map: number;
    rr: number;
    gcs: number;
    gcsBreakdown: string;
    bloodGlucose: number;
    ecgInterpretation: string;
    oxygenFlow: string;
    ivAccess: string;
  };
  preHospitalActions: string[];
  preActivationStatus: 'NONE' | 'CATH_LAB_PRE_ACTIVATED' | 'TRAUMA_BAY_PREPPED' | 'STROKE_CT_CLEARED';
}

export const AmbulanceTransferView: React.FC<AmbulanceTransferViewProps> = ({
  transfers,
  encounters,
  onDispatchAmbulance
}) => {
  const [activeTab, setActiveTab] = useState<'INBOUND_HUD' | 'OUTBOUND_TRANSFERS'>('INBOUND_HUD');
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string>('AMB-108-ALPHA');
  const [soundMuted, setSoundMuted] = useState(false);
  const [activationNotice, setActivationNotice] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'RED_IMMEDIATE' | 'YELLOW_URGENT'>('ALL');

  // Inbound Ambulances State
  const [inboundFleet, setInboundFleet] = useState<InboundAmbulanceTelemetry[]>([
    {
      id: 'AMB-108-ALPHA',
      callSign: 'Ambulance 108 Alpha (Cardiac ALS)',
      vehicleNumber: 'MH-02-CB-1080',
      ambulanceType: 'ALS_CARDIAC_ICU',
      driverName: 'Ramesh Sawant',
      paramedicName: 'EMT Vikrant More (ACLS Certified)',
      paramedicContact: '+91 98201 12345',
      patientName: 'Harish Chandra Gupta',
      patientAgeGender: '58y / Male',
      chiefComplaint: 'Acute Crushing Retrosternal Chest Pain radiating to left jaw • Diaphoresis',
      triageCategory: 'RED_IMMEDIATE',
      etaSeconds: 340, // ~5m 40s
      speedKmph: 72,
      currentLocation: 'Western Express Highway • Approaching Flyover (2.4 km out)',
      hospitalDistanceKm: 2.4,
      vitalTelemetry: {
        hr: 118,
        spo2: 93,
        bp: '90/58',
        map: 68,
        rr: 26,
        gcs: 15,
        gcsBreakdown: 'E4 V5 M6',
        bloodGlucose: 148,
        ecgInterpretation: 'Acute Extensive Anterior STEMI • ST-Elevation V1-V4: 4.5mm',
        oxygenFlow: 'High Flow Non-Rebreather Mask @ 12 L/min',
        ivAccess: '18G Left Forearm • Normal Saline KVO'
      },
      preHospitalActions: [
        'Aspirin 300mg Soluble PO Administered',
        'Clopidogrel 300mg PO Administered',
        'Atorvastatin 80mg PO Administered',
        'Sublingual Nitroglycerin withheld due to SBP < 100 mmHg'
      ],
      preActivationStatus: 'NONE'
    },
    {
      id: 'AMB-102-BRAVO',
      callSign: 'Ambulance 102 Bravo (Trauma ALS)',
      vehicleNumber: 'MH-04-TR-1022',
      ambulanceType: 'ALS_TRAUMA',
      driverName: 'Sanjay Jadhav',
      paramedicName: 'EMT Shrikant Shinde (ITLS Certified)',
      paramedicContact: '+91 98202 67890',
      patientName: 'Kunal Deshmukh',
      patientAgeGender: '27y / Male',
      chiefComplaint: 'High-speed two-wheeler rollover • Severe head trauma • Open right femur fracture',
      triageCategory: 'RED_IMMEDIATE',
      etaSeconds: 615, // ~10m 15s
      speedKmph: 64,
      currentLocation: 'Eastern Freeway Corridor • Green Corridor Enabled (5.8 km out)',
      hospitalDistanceKm: 5.8,
      vitalTelemetry: {
        hr: 132,
        spo2: 95,
        bp: '84/50',
        map: 61,
        rr: 28,
        gcs: 9,
        gcsBreakdown: 'E2 V2 M5 (Deteriorating)',
        bloodGlucose: 110,
        ecgInterpretation: 'Sinus Tachycardia • Hypovolemic Shock Waveform',
        oxygenFlow: 'Bag-Valve-Mask Assist @ 15 L/min',
        ivAccess: 'Dual 16G Antecubital Lines • 500ml Ringer Lactate Bolus'
      },
      preHospitalActions: [
        'Rigid Cervical Collar Applied',
        'Right Femur Hare Traction Splint Locked',
        'Direct Combat Application Tourniquet (CAT) on thigh',
        'Tranexamic Acid (TXA) 1g IV Bolus Started'
      ],
      preActivationStatus: 'NONE'
    },
    {
      id: 'AMB-104-CHARLIE',
      callSign: 'Ambulance 104 Charlie (Stroke ALS)',
      vehicleNumber: 'MH-01-ST-1044',
      ambulanceType: 'ALS_CARDIAC_ICU',
      driverName: 'Santosh Pawar',
      paramedicName: 'EMT Meena Pillai',
      paramedicContact: '+91 98203 11223',
      patientName: 'Sunita Mehra',
      patientAgeGender: '71y / Female',
      chiefComplaint: 'Sudden onset right-sided hemiplegia & global aphasia • Last Seen Normal: 45m ago',
      triageCategory: 'RED_IMMEDIATE',
      etaSeconds: 980, // ~16m 20s
      speedKmph: 58,
      currentLocation: 'Link Road Junction • Dense Traffic (8.1 km out)',
      hospitalDistanceKm: 8.1,
      vitalTelemetry: {
        hr: 82,
        spo2: 97,
        bp: '184/102',
        map: 129,
        rr: 18,
        gcs: 11,
        gcsBreakdown: 'E3 V1 M7',
        bloodGlucose: 126,
        ecgInterpretation: 'Atrial Fibrillation (Controlled Ventricular Response)',
        oxygenFlow: 'Nasal Cannula @ 2 L/min',
        ivAccess: '20G Right Hand • Saline Lock'
      },
      preHospitalActions: [
        'LVO Cincinnati Prehospital Stroke Scale: 3/3 Positive',
        'Head elevated 30 degrees',
        'Point of Care Glucose verified: 126 mg/dL (Hypoglycemia ruled out)'
      ],
      preActivationStatus: 'NONE'
    }
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live ticking countdown for inbound ambulances (1 second intervals)
  useEffect(() => {
    const timer = setInterval(() => {
      setInboundFleet((prev) =>
        prev.map((amb) => {
          const newEta = Math.max(0, amb.etaSeconds - 1);
          const newDist = Math.max(0.1, Number((amb.hospitalDistanceKm - 0.015).toFixed(1)));
          return {
            ...amb,
            etaSeconds: newEta,
            hospitalDistanceKm: newDist
          };
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentAmbulance = inboundFleet.find((a) => a.id === selectedAmbulanceId) || inboundFleet[0]!;

  // Web Audio arrival alert chime
  const playArrivalSiren = useCallback(() => {
    if (soundMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.25);
      osc.frequency.linearRampToValueAtTime(660, ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // Audio fallback
    }
  }, [soundMuted]);

  // Live Oscilloscope ECG Waveform stream for selected inbound ambulance
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let x = 0;
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#05070A';
    ctx.fillRect(0, 0, width, height);

    const isStemi = currentAmbulance.vitalTelemetry.ecgInterpretation.includes('STEMI');
    const isAfib = currentAmbulance.vitalTelemetry.ecgInterpretation.includes('Fibrillation');

    const render = () => {
      ctx.fillStyle = 'rgba(5, 7, 10, 0.12)';
      ctx.fillRect(x, 0, 8, height);

      // Grid line
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.lineWidth = 1;

      // Draw ECG Lead II Stream
      ctx.beginPath();
      ctx.strokeStyle = isStemi ? '#EF4444' : '#10B981';
      ctx.lineWidth = 2;
      ctx.shadowColor = isStemi ? '#EF4444' : '#10B981';
      ctx.shadowBlur = 4;

      const midY = height * 0.35;
      let y = midY;
      const cycle = x % 75;

      if (isStemi) {
        // Tombstone ST Elevation Waveform
        if (cycle > 12 && cycle < 18) y = midY - 4; // P
        else if (cycle === 22) y = midY + 6; // Q
        else if (cycle === 24) y = midY - 42; // R Peak
        else if (cycle === 26) y = midY - 22; // ST High Elevation
        else if (cycle > 26 && cycle < 38) y = midY - 24; // Elevated ST segment
      } else if (isAfib) {
        // Chaotic baseline
        y = midY + (Math.random() - 0.5) * 6;
        if (cycle === 22) y = midY - 32;
        else if (cycle === 24) y = midY + 12;
      } else {
        // Normal sinus
        if (cycle > 14 && cycle < 20) y = midY - 4;
        else if (cycle === 24) y = midY + 6;
        else if (cycle === 26) y = midY - 36;
        else if (cycle === 28) y = midY + 14;
        else if (cycle > 32 && cycle < 42) y = midY - 8;
      }

      ctx.moveTo(x === 0 ? 0 : x - 2, y);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Pleth SpO2 Stream (Cyan)
      ctx.beginPath();
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 1.4;
      ctx.shadowColor = '#06B6D4';
      ctx.shadowBlur = 3;
      const plethY = height * 0.75 + Math.sin((x % 50) * 0.12) * 16;
      ctx.moveTo(x === 0 ? 0 : x - 2, plethY);
      ctx.lineTo(x, plethY);
      ctx.stroke();

      ctx.shadowBlur = 0;
      x = (x + 2) % width;
      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [currentAmbulance.id, currentAmbulance.vitalTelemetry.ecgInterpretation]);

  // Pre-activation triggers
  const handlePreActivateCathLab = () => {
    playArrivalSiren();
    setInboundFleet((prev) =>
      prev.map((a) => (a.id === currentAmbulance.id ? { ...a, preActivationStatus: 'CATH_LAB_PRE_ACTIVATED' } : a))
    );
    hospitalEventBus.publish('CATH_LAB_PRE_ACTIVATED', 'AmbulanceTransferView', {
      ambulanceId: currentAmbulance.id,
      patientName: currentAmbulance.patientName,
      diagnosis: currentAmbulance.vitalTelemetry.ecgInterpretation,
      etaSeconds: currentAmbulance.etaSeconds,
      timestamp: new Date().toISOString()
    });
    setActivationNotice(`⚡ Cath Lab 1 Activated for ${currentAmbulance.patientName}! On-call interventional team alerted.`);
    setTimeout(() => setActivationNotice(null), 6000);
  };

  const handlePreActivateTraumaBay = () => {
    playArrivalSiren();
    setInboundFleet((prev) =>
      prev.map((a) => (a.id === currentAmbulance.id ? { ...a, preActivationStatus: 'TRAUMA_BAY_PREPPED' } : a))
    );
    hospitalEventBus.publish('EMERGENCY_TRIAGE_ALERT', 'AmbulanceTransferView', {
      ambulanceId: currentAmbulance.id,
      location: 'Resuscitation Bay 1',
      severity: 'TRAUMA_STAT_RED',
      timestamp: new Date().toISOString()
    });
    setActivationNotice(`🚨 Trauma Bay 1 & Massive Transfusion Protocol (MTP) pre-activated for ${currentAmbulance.patientName}!`);
    setTimeout(() => setActivationNotice(null), 6000);
  };

  const handlePreActivateStrokeCT = () => {
    playArrivalSiren();
    setInboundFleet((prev) =>
      prev.map((a) => (a.id === currentAmbulance.id ? { ...a, preActivationStatus: 'STROKE_CT_CLEARED' } : a))
    );
    hospitalEventBus.publish('EMERGENCY_TRIAGE_ALERT', 'AmbulanceTransferView', {
      ambulanceId: currentAmbulance.id,
      location: '128-Slice CT Radiology',
      severity: 'CODE_STROKE_FAST',
      timestamp: new Date().toISOString()
    });
    setActivationNotice(`🧠 Code Stroke Team & CT Scanner Cleared for ${currentAmbulance.patientName}!`);
    setTimeout(() => setActivationNotice(null), 6000);
  };

  const handleShareSbarWhatsApp = () => {
    const amb = currentAmbulance;
    const mins = Math.floor(amb.etaSeconds / 60);
    const secs = amb.etaSeconds % 60;
    const text = encodeURIComponent(
      `🚑 *DOCSEARCH PRE-HOSPITAL INBOUND TELEMETRY SBAR*\n` +
      `• *Ambulance*: ${amb.callSign} (${amb.vehicleNumber})\n` +
      `• *ETA*: ${mins}m ${secs}s (${amb.hospitalDistanceKm} km out @ ${amb.speedKmph} km/h)\n` +
      `• *Patient*: ${amb.patientName} (${amb.patientAgeGender})\n` +
      `• *Situation*: ${amb.chiefComplaint}\n` +
      `• *Triage*: ${amb.triageCategory} (GCS: ${amb.vitalTelemetry.gcs} [${amb.vitalTelemetry.gcsBreakdown}])\n` +
      `• *Vitals*: HR ${amb.vitalTelemetry.hr} | BP ${amb.vitalTelemetry.bp} (MAP ${amb.vitalTelemetry.map}) | SpO2 ${amb.vitalTelemetry.spo2}%\n` +
      `• *ECG*: ${amb.vitalTelemetry.ecgInterpretation}\n` +
      `• *Pre-Hospital Interventions*: ${amb.preHospitalActions.join(' • ')}\n` +
      `• *Paramedic*: ${amb.paramedicName} (${amb.paramedicContact})\n\n` +
      `_Pre-activated in DocSearch Autonomous Hospital OS for zero ER bay delay._`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const filteredInbound = inboundFleet.filter((a) => {
    if (filterCategory === 'RED_IMMEDIATE') return a.triageCategory === 'RED_IMMEDIATE';
    if (filterCategory === 'YELLOW_URGENT') return a.triageCategory === 'YELLOW_URGENT';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Top Banner Alert */}
      {activationNotice && (
        <div
          style={{
            backgroundColor: '#065F46',
            color: '#ECFDF5',
            padding: '12px 18px',
            borderRadius: '10px',
            fontWeight: 800,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 16px rgba(6, 95, 70, 0.4)'
          }}
        >
          <span>{activationNotice}</span>
          <button
            type="button"
            onClick={() => setActivationNotice(null)}
            style={{ background: 'none', border: 'none', color: '#A7F3D0', cursor: 'pointer', fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.6rem' }}>🚑</span>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC' }}>
                Paramedic Pre-Hospital Ambulance Inbound Telemetry HUD & Transit Radar
              </h1>
              <p style={{ margin: '2px 0 0', color: '#94A3B8', fontSize: '0.8125rem' }}>
                Continuous 5G streaming vital telemetry, live GPS ETA tracking, and pre-arrival Cath Lab / Trauma / Stroke activations.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Audio Chime Mute */}
          <button
            type="button"
            onClick={() => setSoundMuted(!soundMuted)}
            style={{
              backgroundColor: soundMuted ? '#1E293B' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${soundMuted ? '#334155' : '#10B981'}`,
              color: soundMuted ? '#94A3B8' : '#34D399',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {soundMuted ? '🔇 Audio Muted' : '🔔 Inbound Audio Radar ON'}
          </button>

          {/* Tab Switcher */}
          <div style={{ display: 'flex', backgroundColor: '#0B0F19', padding: '3px', borderRadius: '8px', border: '1px solid #1E293B' }}>
            <button
              type="button"
              onClick={() => setActiveTab('INBOUND_HUD')}
              style={{
                backgroundColor: activeTab === 'INBOUND_HUD' ? '#DC2626' : 'transparent',
                color: activeTab === 'INBOUND_HUD' ? '#FFF' : '#94A3B8',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🚨 Inbound 5G Radar ({inboundFleet.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('OUTBOUND_TRANSFERS')}
              style={{
                backgroundColor: activeTab === 'OUTBOUND_TRANSFERS' ? '#DC2626' : 'transparent',
                color: activeTab === 'OUTBOUND_TRANSFERS' ? '#FFF' : '#94A3B8',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🔄 Outbound Inter-Hospital ({transfers.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'INBOUND_HUD' && (
        <>
          {/* Triage Filter Bar */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Triage Filter:</span>
            {(['ALL', 'RED_IMMEDIATE', 'YELLOW_URGENT'] as const).map((cat) => {
              const isAct = filterCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  style={{
                    backgroundColor: isAct ? '#DC2626' : '#1E293B',
                    color: isAct ? '#FFF' : '#94A3B8',
                    border: isAct ? '1px solid #EF4444' : '1px solid #334155',
                    borderRadius: '6px',
                    padding: '3px 10px',
                    fontSize: '0.72rem',
                    fontWeight: isAct ? 800 : 500,
                    cursor: 'pointer'
                  }}
                >
                  {cat === 'ALL' && 'All Inbound (3)'}
                  {cat === 'RED_IMMEDIATE' && '🔴 Red Immediate (Stat)'}
                  {cat === 'YELLOW_URGENT' && '🟡 Yellow Urgent'}
                </button>
              );
            })}
          </div>

          {/* Inbound Fleet Selector Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {filteredInbound.map((amb) => {
              const isSelected = selectedAmbulanceId === amb.id;
              const mins = Math.floor(amb.etaSeconds / 60);
              const secs = amb.etaSeconds % 60;
              const isUrgent = amb.etaSeconds <= 300; // < 5 mins
              return (
                <div
                  key={amb.id}
                  onClick={() => setSelectedAmbulanceId(amb.id)}
                  style={{
                    backgroundColor: isSelected ? 'rgba(220, 38, 38, 0.15)' : '#070C18',
                    border: isSelected ? '2px solid #EF4444' : isUrgent ? '1.5px solid #F59E0B' : '1px solid #1E293B',
                    borderRadius: '12px',
                    padding: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxShadow: isSelected ? '0 0 20px rgba(220, 38, 38, 0.3)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: '0.875rem', color: '#F8FAFC' }}>{amb.callSign}</strong>
                      <div style={{ fontSize: '0.72rem', color: '#38BDF8', fontFamily: 'monospace' }}>
                        {amb.vehicleNumber} • {amb.ambulanceType.replace(/_/g, ' ')}
                      </div>
                    </div>
                    <Badge variant={amb.triageCategory === 'RED_IMMEDIATE' ? 'danger' : 'warning'}>
                      {mins}m {secs < 10 ? `0${secs}` : secs}s ETA
                    </Badge>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#F8FAFC', fontWeight: 700 }}>
                    {amb.patientName} ({amb.patientAgeGender})
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {amb.chiefComplaint}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0B0F19', padding: '6px 8px', borderRadius: '6px', fontSize: '0.7rem' }}>
                    <span style={{ color: '#10B981', fontWeight: 800 }}>
                      ❤️ {amb.vitalTelemetry.hr} bpm • 🫁 {amb.vitalTelemetry.spo2}%
                    </span>
                    <span style={{ color: '#F59E0B', fontWeight: 700 }}>
                      BP {amb.vitalTelemetry.bp} • GCS {amb.vitalTelemetry.gcs}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6875rem', color: '#64748B' }}>
                    <span>📍 {amb.hospitalDistanceKm} km out</span>
                    <span>⚡ {amb.speedKmph} km/h</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2-Column Deep Telemetry HUD & Resuscitation Pre-Activation Suite */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px' }}>
            {/* Left: Continuous Telemetry Oscilloscope & Vital Signs Grid */}
            <div
              style={{
                backgroundColor: '#05070A',
                border: '2px solid rgba(220, 38, 38, 0.4)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.9), 0 0 30px rgba(220, 38, 38, 0.15)'
              }}
            >
              {/* Monitor Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E293B', paddingBottom: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 900, color: '#F8FAFC' }}>
                      {currentAmbulance.callSign}
                    </span>
                    <Badge variant="danger">5G INBOUND LIVE</Badge>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#38BDF8', marginTop: '2px' }}>
                    Patient: <strong>{currentAmbulance.patientName}</strong> ({currentAmbulance.patientAgeGender})
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>ESTIMATED HOSPITAL ARRIVAL:</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#EF4444', fontFamily: 'monospace' }}>
                    {Math.floor(currentAmbulance.etaSeconds / 60)}m {currentAmbulance.etaSeconds % 60}s
                  </div>
                </div>
              </div>

              {/* Animated Canvas Waveform Frame */}
              <div style={{ position: 'relative', width: '100%', height: '220px', backgroundColor: '#05070A', borderRadius: '10px', overflow: 'hidden', border: '1px solid #1E293B' }}>
                <canvas ref={canvasRef} width={500} height={220} style={{ width: '100%', height: '100%' }} />

                {/* Waveform Labels Overlay */}
                <div style={{ position: 'absolute', top: '10px', left: '12px', fontSize: '0.6875rem', color: '#EF4444', fontWeight: 800 }}>
                  AMBULANCE MONITOR LEAD II • {currentAmbulance.vitalTelemetry.ecgInterpretation}
                </div>
                <div style={{ position: 'absolute', top: '120px', left: '12px', fontSize: '0.6875rem', color: '#06B6D4', fontWeight: 800 }}>
                  PLETH (SpO2: {currentAmbulance.vitalTelemetry.spo2}%) • PULSE SYNC
                </div>
              </div>

              {/* Parameter Numbers Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', textAlign: 'center' }}>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '6px' }}>
                  <div style={{ fontSize: '0.58rem', color: '#A7F3D0', fontWeight: 700 }}>HR</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#10B981', fontFamily: 'monospace' }}>
                    {currentAmbulance.vitalTelemetry.hr}
                  </div>
                  <div style={{ fontSize: '0.58rem', color: '#94A3B8' }}>bpm</div>
                </div>

                <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '8px', padding: '6px' }}>
                  <div style={{ fontSize: '0.58rem', color: '#BAE6FD', fontWeight: 700 }}>SpO2</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#06B6D4', fontFamily: 'monospace' }}>
                    {currentAmbulance.vitalTelemetry.spo2}%
                  </div>
                  <div style={{ fontSize: '0.58rem', color: '#94A3B8' }}>sat</div>
                </div>

                <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', padding: '6px' }}>
                  <div style={{ fontSize: '0.58rem', color: '#FDE68A', fontWeight: 700 }}>NIBP</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#F59E0B', fontFamily: 'monospace', marginTop: '2px' }}>
                    {currentAmbulance.vitalTelemetry.bp}
                  </div>
                  <div style={{ fontSize: '0.58rem', color: '#94A3B8' }}>MAP {currentAmbulance.vitalTelemetry.map}</div>
                </div>

                <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '8px', padding: '6px' }}>
                  <div style={{ fontSize: '0.58rem', color: '#E9D5FF', fontWeight: 700 }}>GCS</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#C084FC', fontFamily: 'monospace' }}>
                    {currentAmbulance.vitalTelemetry.gcs}
                  </div>
                  <div style={{ fontSize: '0.58rem', color: '#94A3B8' }}>/ 15</div>
                </div>

                <div style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', padding: '6px' }}>
                  <div style={{ fontSize: '0.58rem', color: '#FECDD3', fontWeight: 700 }}>GLUCOSE</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#FB7185', fontFamily: 'monospace' }}>
                    {currentAmbulance.vitalTelemetry.bloodGlucose}
                  </div>
                  <div style={{ fontSize: '0.58rem', color: '#94A3B8' }}>mg/dL</div>
                </div>
              </div>
            </div>

            {/* Right: Pre-Arrival Team Activations & SBAR Actions */}
            <div
              style={{
                backgroundColor: '#0F172A',
                border: '1px solid #334155',
                borderRadius: '16px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E293B', paddingBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase' }}>
                  ⚡ Pre-Hospital Door-to-Needle Activation Suite
                </span>
                <Badge variant={currentAmbulance.preActivationStatus === 'NONE' ? 'neutral' : 'success'}>
                  {currentAmbulance.preActivationStatus.replace(/_/g, ' ')}
                </Badge>
              </div>

              {/* Paramedic SBAR Summary Block */}
              <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px', fontSize: '0.78rem' }}>
                <strong style={{ color: '#38BDF8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '2px' }}>
                  Chief Clinical Emergency:
                </strong>
                <div style={{ color: '#F8FAFC', fontWeight: 700 }}>{currentAmbulance.chiefComplaint}</div>

                <div style={{ marginTop: '8px', borderTop: '1px solid #334155', paddingTop: '6px' }}>
                  <strong style={{ color: '#A7F3D0', fontSize: '0.6875rem' }}>Paramedic In-Route Actions:</strong>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0, color: '#CBD5E1', fontSize: '0.72rem' }}>
                    {currentAmbulance.preHospitalActions.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Transit Logistics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
                <div style={{ backgroundColor: '#1E293B', padding: '8px 10px', borderRadius: '6px' }}>
                  <span style={{ color: '#94A3B8', fontSize: '0.6875rem', display: 'block' }}>Paramedic in Charge:</span>
                  <strong style={{ color: '#F8FAFC' }}>{currentAmbulance.paramedicName}</strong>
                  <div style={{ color: '#38BDF8', fontSize: '0.6875rem', marginTop: '2px' }}>{currentAmbulance.paramedicContact}</div>
                </div>

                <div style={{ backgroundColor: '#1E293B', padding: '8px 10px', borderRadius: '6px' }}>
                  <span style={{ color: '#94A3B8', fontSize: '0.6875rem', display: 'block' }}>Current GPS Corridors:</span>
                  <strong style={{ color: '#FCD34D' }}>{currentAmbulance.currentLocation}</strong>
                  <div style={{ color: '#94A3B8', fontSize: '0.6875rem', marginTop: '2px' }}>Speed: {currentAmbulance.speedKmph} km/h</div>
                </div>
              </div>

              {/* Pre-Hospital Action Triggers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                <strong style={{ color: '#EF4444', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  1-Tap Hospital Specialized Team Pre-Activations:
                </strong>

                {currentAmbulance.vitalTelemetry.ecgInterpretation.includes('STEMI') && (
                  <Button
                    variant="danger"
                    size="md"
                    onClick={handlePreActivateCathLab}
                    style={{ width: '100%', fontWeight: 800, fontSize: '0.8125rem' }}
                  >
                    ⚡ Pre-Activate Cath Lab (Code STEMI • Primary PCI)
                  </Button>
                )}

                {currentAmbulance.ambulanceType === 'ALS_TRAUMA' && (
                  <Button
                    variant="danger"
                    size="md"
                    onClick={handlePreActivateTraumaBay}
                    style={{ width: '100%', fontWeight: 800, fontSize: '0.8125rem' }}
                  >
                    🚨 Pre-Activate Trauma Resuscitation Bay 1 (Code Red)
                  </Button>
                )}

                {currentAmbulance.chiefComplaint.includes('hemiplegia') && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handlePreActivateStrokeCT}
                    style={{ width: '100%', fontWeight: 800, fontSize: '0.8125rem', backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}
                  >
                    🧠 Pre-Activate Code Stroke & Clear 128-Slice CT
                  </Button>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareSbarWhatsApp}
                    style={{ fontWeight: 800, fontSize: '0.75rem', borderColor: '#22C55E', color: '#4ADE80' }}
                  >
                    💬 WhatsApp SBAR to ER HOD
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    style={{ fontWeight: 700, fontSize: '0.75rem' }}
                  >
                    🖨️ Print Pre-Hospital Handover Slip
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* OUTBOUND INTER-HOSPITAL TRANSFERS TAB */}
      {activeTab === 'OUTBOUND_TRANSFERS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Dispatch Section */}
          <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', padding: '16px', borderRadius: '12px' }}>
            <h2 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC' }}>
              Dispatch Outbound Tertiary Referral Transfer
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {encounters.length === 0 ? (
                <div style={{ color: '#94A3B8', fontSize: '0.78rem', padding: '12px', textAlign: 'center' }}>
                  No active emergency encounters pending tertiary transfer.
                </div>
              ) : (
                encounters.map((e) => (
                  <div
                    key={e.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155'
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontWeight: 800, color: '#F8FAFC', fontSize: '0.85rem' }}>
                        {e.patientName} ({e.patientMrn})
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>{e.chiefComplaint}</p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onDispatchAmbulance(e)}
                      style={{ backgroundColor: '#0284C7', borderColor: '#0284C7', fontWeight: 800 }}
                    >
                      Dispatch Transfer
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Transfers Log */}
          <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', backgroundColor: '#0B0F19', borderBottom: '1px solid #1E293B' }}>
              <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC' }}>
                Tertiary & Inter-Hospital Ambulance Transfer Log
              </h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <thead>
                  <tr style={{ textAlign: 'left', fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', backgroundColor: '#1E293B' }}>
                    <th style={{ padding: '10px 14px' }}>Transfer #</th>
                    <th style={{ padding: '10px 14px' }}>Patient</th>
                    <th style={{ padding: '10px 14px' }}>Ambulance</th>
                    <th style={{ padding: '10px 14px' }}>Route</th>
                    <th style={{ padding: '10px 14px' }}>Accompanying Paramedic</th>
                    <th style={{ padding: '10px 14px' }}>Status</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.78rem' }}>
                  {transfers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>
                        No outbound ambulance transfers logged.
                      </td>
                    </tr>
                  ) : (
                    transfers.map((t) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 800, color: '#38BDF8', fontFamily: 'monospace' }}>
                          {t.transferCode}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#F8FAFC' }}>{t.patientName}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#CBD5E1' }}>{t.ambulanceNumber}</td>
                        <td style={{ padding: '10px 14px', color: '#94A3B8' }}>
                          {t.sendingFacility} → {t.receivingFacility}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#94A3B8' }}>{t.accompanyingParamedic}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <Badge variant="success">{t.status}</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
