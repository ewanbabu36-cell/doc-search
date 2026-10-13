import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export type IcuBedKey = 'BED_204' | 'BED_01' | 'BED_04' | 'BED_07' | 'BED_09' | 'BED_12';

export interface IcuBedData {
  key: IcuBedKey;
  bedName: string;
  unit: string;
  patientName: string;
  ageGender: string;
  uhid: string;
  ipdNumber: string;
  diagnosis: string;
  status: 'STABLE' | 'GUARDED' | 'CRITICAL_CODE_BLUE' | 'SEPSIS_WARNING' | 'POST_RESUSCITATION';
  hr: number;
  spo2: number;
  bp: string;
  map: number;
  rr: number;
  temp: string;
  tempC: number;
  consciousness: 'ALERT' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE';
  onSupplementalOxygen: boolean;
  oxygenDevice: string;
  rhythm: string;
  infusions: string;
  ventilator: string;
  etco2: number;
}

export interface News2Result {
  score: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  color: string;
  breakdown: {
    respiration: number;
    spo2: number;
    oxygen: number;
    systolicBp: number;
    heartRate: number;
    consciousness: number;
    temperature: number;
  };
}

export interface QsofaResult {
  score: number;
  isSepsisAlert: boolean;
  criteria: string[];
}

export function calculateNEWS2(bed: {
  rr: number;
  spo2: number;
  onSupplementalOxygen: boolean;
  bp: string;
  hr: number;
  consciousness: 'ALERT' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE';
  tempC: number;
}): News2Result {
  let sbp = 120;
  const parts = bed.bp.split('/');
  if (parts[0]) {
    const parsed = parseInt(parts[0], 10);
    if (!isNaN(parsed)) sbp = parsed;
  }

  // Respiration rate
  let rrScore = 0;
  if (bed.rr <= 8) rrScore = 3;
  else if (bed.rr >= 9 && bed.rr <= 11) rrScore = 1;
  else if (bed.rr >= 12 && bed.rr <= 20) rrScore = 0;
  else if (bed.rr >= 21 && bed.rr <= 24) rrScore = 2;
  else rrScore = 3;

  // SpO2
  let spo2Score = 0;
  if (bed.spo2 <= 91) spo2Score = 3;
  else if (bed.spo2 >= 92 && bed.spo2 <= 93) spo2Score = 2;
  else if (bed.spo2 >= 94 && bed.spo2 <= 95) spo2Score = 1;
  else spo2Score = 0;

  // Supplemental Oxygen
  const o2Score = bed.onSupplementalOxygen ? 2 : 0;

  // Systolic BP
  let sbpScore = 0;
  if (sbp <= 90) sbpScore = 3;
  else if (sbp >= 91 && sbp <= 100) sbpScore = 2;
  else if (sbp >= 101 && sbp <= 110) sbpScore = 1;
  else if (sbp >= 111 && sbp <= 219) sbpScore = 0;
  else sbpScore = 3;

  // Pulse
  let hrScore = 0;
  if (bed.hr <= 40) hrScore = 3;
  else if (bed.hr >= 41 && bed.hr <= 50) hrScore = 1;
  else if (bed.hr >= 51 && bed.hr <= 90) hrScore = 0;
  else if (bed.hr >= 91 && bed.hr <= 110) hrScore = 1;
  else if (bed.hr >= 111 && bed.hr <= 130) hrScore = 2;
  else hrScore = 3;

  // AVPU Consciousness
  const avpuScore = bed.consciousness === 'ALERT' ? 0 : 3;

  // Temperature
  let tempScore = 0;
  if (bed.tempC <= 35.0) tempScore = 3;
  else if (bed.tempC >= 35.1 && bed.tempC <= 36.0) tempScore = 1;
  else if (bed.tempC >= 36.1 && bed.tempC <= 38.0) tempScore = 0;
  else if (bed.tempC >= 38.1 && bed.tempC <= 39.0) tempScore = 1;
  else tempScore = 2;

  const total = rrScore + spo2Score + o2Score + sbpScore + hrScore + avpuScore + tempScore;
  let risk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  let color = '#10B981';

  if (total >= 7 || rrScore === 3 || hrScore === 3 || sbpScore === 3) {
    risk = 'HIGH';
    color = '#EF4444';
  } else if (total >= 5) {
    risk = 'MEDIUM';
    color = '#F59E0B';
  }

  return {
    score: total,
    risk,
    color,
    breakdown: {
      respiration: rrScore,
      spo2: spo2Score,
      oxygen: o2Score,
      systolicBp: sbpScore,
      heartRate: hrScore,
      consciousness: avpuScore,
      temperature: tempScore
    }
  };
}

export function calculateQSOFA(bed: {
  rr: number;
  bp: string;
  consciousness: 'ALERT' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE';
}): QsofaResult {
  let sbp = 120;
  const parts = bed.bp.split('/');
  if (parts[0]) {
    const parsed = parseInt(parts[0], 10);
    if (!isNaN(parsed)) sbp = parsed;
  }

  const criteria: string[] = [];
  let score = 0;

  if (bed.rr >= 22) {
    score++;
    criteria.push('Tachypnea: RR ≥ 22/min');
  }
  if (sbp <= 100) {
    score++;
    criteria.push('Hypotension: SBP ≤ 100 mmHg');
  }
  if (bed.consciousness !== 'ALERT') {
    score++;
    criteria.push('Altered Mentation: GCS < 15 / Not Alert');
  }

  return {
    score,
    isSepsisAlert: score >= 2,
    criteria
  };
}

// Mini Waveform Canvas for each Bed in the Multi-Bed Wall
export const IcuBedWaveformMiniCanvas: React.FC<{
  rhythm: string;
  isCodeBlue: boolean;
  hr: number;
  width?: number;
  height?: number;
  accentColor?: string;
}> = ({ rhythm, isCodeBlue, hr, width = 320, height = 90, accentColor = '#10B981' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let x = 0;
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#05070A';
    ctx.fillRect(0, 0, w, h);

    const cycleLength = Math.max(30, Math.round((60 / Math.max(hr, 40)) * 60));

    const render = () => {
      // Clear sweep column with trail fade
      ctx.fillStyle = 'rgba(5, 7, 10, 0.15)';
      ctx.fillRect(x, 0, 10, h);

      // Draw faint phosphor grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();

      // Lead II ECG
      ctx.beginPath();
      ctx.strokeStyle = isCodeBlue ? '#EF4444' : accentColor;
      ctx.lineWidth = isCodeBlue ? 2.5 : 1.8;
      ctx.shadowColor = isCodeBlue ? '#EF4444' : accentColor;
      ctx.shadowBlur = 4;

      const midY = h * 0.4;
      let y = midY;
      const cycle = x % cycleLength;

      if (isCodeBlue) {
        // Ventricular Tachycardia Waveform
        y = midY + Math.sin(x * 0.22) * (h * 0.32);
      } else if (rhythm.includes('Bradycardia')) {
        // Slower conduction
        if (cycle > 12 && cycle < 18) y = midY - 3;
        else if (cycle === 22) y = midY + 4;
        else if (cycle === 24) y = midY - 24;
        else if (cycle === 26) y = midY + 8;
        else if (cycle > 30 && cycle < 38) y = midY - 5;
      } else if (rhythm.includes('Fibrillation')) {
        // Irregular baseline with quick QRS
        const noise = (Math.random() - 0.5) * 4;
        y = midY + noise;
        if (cycle === 20) y = midY - 26;
        else if (cycle === 22) y = midY + 9;
      } else {
        // Normal Sinus Rhythm P-Q-R-S-T
        if (cycle > 10 && cycle < 16) y = midY - 4; // P
        else if (cycle === 20) y = midY + 5; // Q
        else if (cycle === 22) y = midY - 28; // R Peak
        else if (cycle === 24) y = midY + 12; // S
        else if (cycle > 28 && cycle < 36) y = midY - 7; // T
      }

      ctx.moveTo(x === 0 ? 0 : x - 2, y);
      ctx.lineTo(x, y);
      ctx.stroke();

      // SpO2 Pleth Waveform (Cyan)
      ctx.beginPath();
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 1.2;
      ctx.shadowColor = '#06B6D4';
      ctx.shadowBlur = 2;
      const plethMid = h * 0.78;
      const plethY = plethMid + Math.sin((x % 45) * 0.14) * (isCodeBlue ? 4 : 10);
      ctx.moveTo(x === 0 ? 0 : x - 2, plethY);
      ctx.lineTo(x, plethY);
      ctx.stroke();

      // Reset shadow
      ctx.shadowBlur = 0;

      x = (x + 2) % w;
      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [rhythm, isCodeBlue, hr, accentColor]);

  return (
    <div style={{ position: 'relative', width: '100%', height: `${height}px`, backgroundColor: '#05070A', borderRadius: '6px', overflow: 'hidden' }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div style={{ position: 'absolute', top: '4px', left: '8px', fontSize: '0.625rem', color: isCodeBlue ? '#EF4444' : accentColor, fontWeight: 800 }}>
        ECG II • {isCodeBlue ? 'VFIB / VTACH' : rhythm}
      </div>
      <div style={{ position: 'absolute', bottom: '3px', right: '8px', fontSize: '0.6rem', color: '#06B6D4', fontWeight: 700 }}>
        PLETH • PULSE SYNC
      </div>
    </div>
  );
};

export interface LiveIcuTelemetryCodeBlueViewProps {
  initialBedId?: IcuBedKey | undefined;
  onClose?: (() => void) | undefined;
}

export const LiveIcuTelemetryCodeBlueView: React.FC<LiveIcuTelemetryCodeBlueViewProps> = ({
  initialBedId,
  onClose
}) => {
  const [viewMode, setViewMode] = useState<'WALL_GRID' | 'FOCUSED_COCKPIT'>('WALL_GRID');
  const [selectedBed, setSelectedBed] = useState<IcuBedKey>(initialBedId || 'BED_04');
  const [codeBlueActive, setCodeBlueActive] = useState(true);
  const [shockDelivered, setShockDelivered] = useState(false);
  const [epiGiven, setEpiGiven] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'SEPSIS' | 'STABLE'>('ALL');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSepsisModal, setShowSepsisModal] = useState(false);
  const [sepsisModalBed, setSepsisModalBed] = useState<IcuBedKey>('BED_04');
  const [sepsisBundleState, setSepsisBundleState] = useState({
    oxygen: true,
    cultures: true,
    antibiotics: true,
    fluids: true,
    lactate: true,
    urineOutput: false
  });
  const [bundleExecuted, setBundleExecuted] = useState(false);
  const [copiedAlert, setCopiedAlert] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Listen for Universal Command Palette "Bed 204" trigger
  useEffect(() => {
    const handleOpenBed = (e: Event) => {
      const custom = e as CustomEvent<{ bedNumber?: string; bedId?: string }>;
      const d = custom.detail;
      if (d?.bedNumber?.includes('204') || d?.bedId === 'BED_204') {
        setSelectedBed('BED_204');
        setViewMode('FOCUSED_COCKPIT');
      }
    };
    window.addEventListener('docsearch:open_bed_monitor', handleOpenBed);
    return () => window.removeEventListener('docsearch:open_bed_monitor', handleOpenBed);
  }, []);

  // Bed clinical database
  const bedsData: Record<IcuBedKey, IcuBedData> = {
    BED_204: {
      key: 'BED_204',
      bedName: 'ICU Bed 204 (CCU Telemetry)',
      unit: 'Coronary Care Unit',
      patientName: 'Suresh Verma',
      ageGender: '62y / Male',
      uhid: 'UHID-2026-0204',
      ipdNumber: 'IPD-CCU-8820',
      diagnosis: 'Acute Coronary Syndrome • Post-PCI Stent (LAD) Monitoring',
      status: 'STABLE',
      hr: 74,
      spo2: 98,
      bp: '120/80',
      map: 93,
      rr: 16,
      temp: '98.4°F',
      tempC: 36.9,
      consciousness: 'ALERT',
      onSupplementalOxygen: false,
      oxygenDevice: 'Room Air (Spontaneous)',
      rhythm: 'Normal Sinus Rhythm',
      infusions: 'Saline 0.9% @ 40 ml/hr • Eptifibatide @ 2 mcg/kg/min',
      ventilator: 'Room Air (Spontaneous)',
      etco2: 38
    },
    BED_01: {
      key: 'BED_01',
      bedName: 'ICU Bed 01 (Post-Surgical CCU)',
      unit: 'Cardiothoracic Surgery ICU',
      patientName: 'Ramesh Patel',
      ageGender: '54y / Male',
      uhid: 'UHID-2026-8812',
      ipdNumber: 'IPD-CTVS-4419',
      diagnosis: 'Post-CABG Day 1 (LIMA-LAD, SVG-OM) • Mediastinal Drainage 25ml/h',
      status: 'STABLE',
      hr: 76,
      spo2: 99,
      bp: '124/80',
      map: 95,
      rr: 16,
      temp: '98.6°F',
      tempC: 37.0,
      consciousness: 'ALERT',
      onSupplementalOxygen: true,
      oxygenDevice: 'Nasal Prongs 2 L/min',
      rhythm: 'Normal Sinus Rhythm',
      infusions: 'Dextrose 5% @ 50 ml/hr • Nitroglycerin @ 5 mcg/min',
      ventilator: 'Weaned • CPAP Mask on standby',
      etco2: 39
    },
    BED_04: {
      key: 'BED_04',
      bedName: 'ICU Bed 04 (High-Dependency Resuscitation)',
      unit: 'Medical Critical Care Unit',
      patientName: 'Shanti Devi',
      ageGender: '68y / Female',
      uhid: 'UHID-2026-8814',
      ipdNumber: 'IPD-MICU-9902',
      diagnosis: 'Urosepsis with Septic Shock • Severe Lactic Acidosis • Vasopressor Dependent',
      status: codeBlueActive ? 'CRITICAL_CODE_BLUE' : 'SEPSIS_WARNING',
      hr: codeBlueActive ? 148 : 96,
      spo2: codeBlueActive ? 84 : 95,
      bp: codeBlueActive ? '82/48' : '102/64',
      map: codeBlueActive ? 59 : 77,
      rr: codeBlueActive ? 32 : 24,
      temp: codeBlueActive ? '102.4°F' : '100.8°F',
      tempC: codeBlueActive ? 39.1 : 38.2,
      consciousness: codeBlueActive ? 'VOICE' : 'ALERT',
      onSupplementalOxygen: true,
      oxygenDevice: 'High Flow Reservoir Mask 15 L/min',
      rhythm: codeBlueActive ? 'Ventricular Tachycardia (Wide QRS)' : 'Sinus Tachycardia (Resuscitated)',
      infusions: 'Noradrenaline @ 0.18 mcg/kg/min • Vasopressin @ 0.03 U/min • Meropenem IV',
      ventilator: codeBlueActive ? 'SIMV Mode • FiO2 80% • PEEP 12' : 'PSV Mode • FiO2 50% • PEEP 8',
      etco2: codeBlueActive ? 22 : 32
    },
    BED_07: {
      key: 'BED_07',
      bedName: 'ICU Bed 07 (Respiratory Critical Care)',
      unit: 'Pulmonary Critical Care Unit',
      patientName: 'Anil Kapoor',
      ageGender: '42y / Male',
      uhid: 'UHID-2026-8819',
      ipdNumber: 'IPD-PICU-1123',
      diagnosis: 'Severe Acute Respiratory Distress Syndrome (ARDS) • Prone Ventilation Cycle',
      status: 'GUARDED',
      hr: 92,
      spo2: 94,
      bp: '130/84',
      map: 99,
      rr: 24,
      temp: '99.8°F',
      tempC: 37.7,
      consciousness: 'ALERT',
      onSupplementalOxygen: true,
      oxygenDevice: 'Mechanical Vent Invasive',
      rhythm: 'Sinus Tachycardia',
      infusions: 'Propofol @ 25 mcg/kg/min • Fentanyl @ 50 mcg/h',
      ventilator: 'PRVC Mode • FiO2 50% • PEEP 10 • Vt 420ml',
      etco2: 44
    },
    BED_09: {
      key: 'BED_09',
      bedName: 'PICU Bed 09 (Pediatric Critical Care)',
      unit: 'Pediatric Intensive Care Unit',
      patientName: 'Master Kabir',
      ageGender: '3y / Male',
      uhid: 'UHID-2026-8822',
      ipdNumber: 'IPD-PEDI-3301',
      diagnosis: 'Severe Acute Bronchiolitis with Subcostal Retractions • RSV Positive',
      status: 'GUARDED',
      hr: 118,
      spo2: 97,
      bp: '96/60',
      map: 72,
      rr: 28,
      temp: '99.2°F',
      tempC: 37.3,
      consciousness: 'ALERT',
      onSupplementalOxygen: true,
      oxygenDevice: 'High-Flow Nasal Cannula (HFNC 12 L/min, FiO2 35%)',
      rhythm: 'Normal Pediatric Sinus Rhythm',
      infusions: 'Isolyte-P @ 35 ml/hr',
      ventilator: 'HFNC Optiflow • 12 L/min',
      etco2: 36
    },
    BED_12: {
      key: 'BED_12',
      bedName: 'ICU Bed 12 (Neuro-Trauma ICU)',
      unit: 'Neuro Critical Care Unit',
      patientName: 'Gopal Krishnan',
      ageGender: '58y / Male',
      uhid: 'UHID-2026-9041',
      ipdNumber: 'IPD-NICU-6650',
      diagnosis: 'Acute Hemorrhagic Basal Ganglia Stroke • ICP Monitor in Situ • Cushing Watch',
      status: 'GUARDED',
      hr: 54,
      spo2: 98,
      bp: '168/94',
      map: 118,
      rr: 14,
      temp: '98.8°F',
      tempC: 37.1,
      consciousness: 'VOICE',
      onSupplementalOxygen: true,
      oxygenDevice: 'Venturi Mask 28%',
      rhythm: 'Sinus Bradycardia',
      infusions: 'Mannitol 20% 100ml Q8H • Labetalol Infusion @ 1 mg/min',
      ventilator: 'Spontaneous via Tracheostomy Collar',
      etco2: 34
    }
  };

  const currentBed = bedsData[selectedBed];

  // Synthesize Web Audio API siren when Code Blue or Sepsis Alert occurs
  const playCriticalSiren = useCallback((pitch = 880) => {
    if (audioMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(pitch * 1.5, ctx.currentTime + 0.3);
      osc.frequency.linearRampToValueAtTime(pitch, ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // Autoplay policy fallback
    }
  }, [audioMuted]);

  // Fullscreen trigger
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Canvas waveform animator for focused view
  useEffect(() => {
    if (viewMode !== 'FOCUSED_COCKPIT') return;
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

    const isBed4Active = codeBlueActive && selectedBed === 'BED_04';

    const render = () => {
      ctx.fillStyle = 'rgba(5, 7, 10, 0.08)';
      ctx.fillRect(x, 0, 10, height);

      // Grid
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.lineWidth = 1;

      // ECG Lead II
      ctx.beginPath();
      ctx.strokeStyle = isBed4Active ? '#EF4444' : '#10B981';
      ctx.lineWidth = isBed4Active ? 2.5 : 2;
      ctx.shadowColor = isBed4Active ? '#EF4444' : '#10B981';
      ctx.shadowBlur = 6;

      const midY = height * 0.28;
      let y = midY;
      const cycle = x % 80;

      if (isBed4Active) {
        y = midY + Math.sin(x * 0.18) * 42;
      } else if (currentBed.rhythm.includes('Bradycardia')) {
        if (cycle > 25 && cycle < 31) y = midY - 6;
        else if (cycle === 40) y = midY + 8;
        else if (cycle === 43) y = midY - 48;
        else if (cycle === 46) y = midY + 16;
        else if (cycle > 52 && cycle < 62) y = midY - 10;
      } else {
        if (cycle > 20 && cycle < 28) y = midY - 6;
        else if (cycle === 34) y = midY + 8;
        else if (cycle === 37) y = midY - 45;
        else if (cycle === 40) y = midY + 18;
        else if (cycle > 46 && cycle < 56) y = midY - 10;
      }

      ctx.moveTo(x === 0 ? 0 : x - 2, y);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Pleth SpO2
      ctx.beginPath();
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 1.6;
      ctx.shadowColor = '#06B6D4';
      ctx.shadowBlur = 4;
      const plethY = height * 0.70 + Math.sin((x % 60) * 0.1) * (isBed4Active ? 8 : 22);
      ctx.moveTo(x === 0 ? 0 : x - 2, plethY);
      ctx.lineTo(x, plethY);
      ctx.stroke();

      ctx.shadowBlur = 0;
      x = (x + 2) % width;
      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [viewMode, codeBlueActive, selectedBed, currentBed.rhythm]);

  const handleDeliverShock = () => {
    setShockDelivered(true);
    playCriticalSiren(1200);
    hospitalEventBus.publish('CRITICAL_PANIC_ALERT', 'LiveIcuTelemetryCodeBlueView', {
      bedId: 'BED_04',
      action: 'DEFIBRILLATOR_150J_SHOCK_DELIVERED',
      timestamp: new Date().toISOString()
    });
    setTimeout(() => {
      setCodeBlueActive(false);
    }, 900);
  };

  const handleGiveEpinephrine = () => {
    setEpiGiven(true);
    hospitalEventBus.publish('MEDICATION_ORDERED_INPATIENT', 'LiveIcuTelemetryCodeBlueView', {
      bedId: selectedBed,
      medication: 'Epinephrine 1mg IV Bolus',
      urgentStat: true
    });
    setTimeout(() => setEpiGiven(false), 3000);
  };

  const handleOpenSepsisModal = (bedKey: IcuBedKey) => {
    setSepsisModalBed(bedKey);
    setShowSepsisModal(true);
    setBundleExecuted(false);
  };

  const handleExecuteSepsisBundle = () => {
    setBundleExecuted(true);
    const target = bedsData[sepsisModalBed];
    hospitalEventBus.publish('SEPSIS_ALERT_TRIGGERED', 'LiveIcuTelemetryCodeBlueView', {
      bedId: sepsisModalBed,
      patientName: target.patientName,
      uhid: target.uhid,
      bundle: sepsisBundleState,
      timestamp: new Date().toISOString()
    });
    playCriticalSiren(940);
  };

  const handleShareWhatsAppAlert = (bedKey: IcuBedKey) => {
    const b = bedsData[bedKey];
    const news2 = calculateNEWS2(b);
    const qsofa = calculateQSOFA(b);
    const text = encodeURIComponent(
      `🚨 *DOCSEARCH CRITICAL ICU TELEMETRY ALERT*\n` +
      `• *Bed*: ${b.bedName} (${b.unit})\n` +
      `• *Patient*: ${b.patientName} (${b.ageGender}) • UHID: ${b.uhid}\n` +
      `• *Diagnosis*: ${b.diagnosis}\n` +
      `• *NEWS2 Score*: ${news2.score}/12 (${news2.risk} RISK)\n` +
      `• *qSOFA Score*: ${qsofa.score}/3 (${qsofa.isSepsisAlert ? '⚠️ SEPSIS ALERT' : 'Normal'})\n` +
      `• *Vitals*: HR ${b.hr} bpm | SpO2 ${b.spo2}% | BP ${b.bp} (MAP ${b.map}) | RR ${b.rr}/min | Temp ${b.temp}\n` +
      `• *Ventilator*: ${b.ventilator}\n` +
      `• *Infusion*: ${b.infusions}\n\n` +
      `_Immediate Intensivist / Medical Emergency Team bedside review requested via DocSearch Hospital OS._`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    setCopiedAlert(true);
    setTimeout(() => setCopiedAlert(false), 2500);
  };

  const allBedKeys = Object.keys(bedsData) as IcuBedKey[];
  const filteredBeds = allBedKeys.filter((key) => {
    const b = bedsData[key];
    const news2 = calculateNEWS2(b);
    const qsofa = calculateQSOFA(b);
    if (activeFilter === 'CRITICAL') return b.status === 'CRITICAL_CODE_BLUE' || news2.risk === 'HIGH';
    if (activeFilter === 'SEPSIS') return qsofa.isSepsisAlert || b.status === 'SEPSIS_WARNING';
    if (activeFilter === 'STABLE') return news2.risk === 'LOW' && !qsofa.isSepsisAlert;
    return true;
  });

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        backgroundColor: '#020617',
        color: '#F8FAFC',
        padding: '16px',
        borderRadius: '16px',
        border: '1px solid #1E293B',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)'
      }}
    >
      {/* Top Telemetry Flight Control Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: codeBlueActive && selectedBed === 'BED_04' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(15, 23, 42, 0.95)',
          border: codeBlueActive && selectedBed === 'BED_04' ? '2px solid #EF4444' : '1px solid #334155',
          borderRadius: '12px',
          padding: '12px 18px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.8rem' }}>{codeBlueActive && selectedBed === 'BED_04' ? '🚨' : '🫀'}</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', margin: 0, letterSpacing: '-0.02em' }}>
                Central ICU Multi-Bed Telemetry Waveform Wall & Code Blue Radar
              </h1>
              <Badge variant={codeBlueActive ? 'danger' : 'success'}>
                {codeBlueActive ? 'STAT CODE BLUE ACTIVE (BED 04)' : 'CENTRAL ICU ALL CLEAR'}
              </Badge>
              <span style={{ fontSize: '0.6875rem', color: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.12)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                NEWS2 / qSOFA Sepsis AI Engine 2.0
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
              Real-time multi-lead ECG Lead II, SpO2 Plethysmography, EtCO2 capnography & ACLS resuscitation flight desk
            </div>
          </div>
        </div>

        {/* Global Controls & Views Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Mode Switcher */}
          <div style={{ display: 'flex', backgroundColor: '#0B0F19', padding: '3px', borderRadius: '8px', border: '1px solid #1E293B' }}>
            <button
              type="button"
              onClick={() => setViewMode('WALL_GRID')}
              style={{
                backgroundColor: viewMode === 'WALL_GRID' ? '#4F46E5' : 'transparent',
                color: viewMode === 'WALL_GRID' ? '#FFF' : '#94A3B8',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>📺</span>
              <span>Waveform Wall (6 Beds)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('FOCUSED_COCKPIT')}
              style={{
                backgroundColor: viewMode === 'FOCUSED_COCKPIT' ? '#4F46E5' : 'transparent',
                color: viewMode === 'FOCUSED_COCKPIT' ? '#FFF' : '#94A3B8',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>🔬</span>
              <span>Bedside Cockpit ({selectedBed})</span>
            </button>
          </div>

          {/* Sound Mute / Unmute */}
          <button
            type="button"
            onClick={() => setAudioMuted(!audioMuted)}
            style={{
              backgroundColor: audioMuted ? '#1E293B' : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${audioMuted ? '#334155' : '#EF4444'}`,
              color: audioMuted ? '#94A3B8' : '#EF4444',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title={audioMuted ? 'Telemetry Siren Muted' : 'Telemetry Siren Armed'}
          >
            {audioMuted ? '🔇 Alarms Muted' : '🔔 Live Siren ON'}
          </button>

          {/* Code Blue Toggle Simulator */}
          <Button
            variant={codeBlueActive ? 'danger' : 'outline'}
            size="sm"
            onClick={() => {
              setCodeBlueActive(!codeBlueActive);
              if (!codeBlueActive) {
                playCriticalSiren(980);
                setSelectedBed('BED_04');
              }
            }}
            style={{ fontWeight: 800, fontSize: '0.75rem' }}
          >
            {codeBlueActive ? '🚨 Code Blue Triggered' : '⚡ Simulate Code Blue'}
          </Button>

          {/* Fullscreen Corridor TV Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              color: '#38BDF8',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Expand to Fullscreen Wall Monitor"
          >
            {isFullscreen ? '⛶ Exit Fullscreen' : '⛶ Fullscreen Wall Mode'}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #475569',
                color: '#94A3B8',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {/* Filter and Ward Summary Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          backgroundColor: '#0B0F19',
          border: '1px solid #1E293B',
          borderRadius: '10px',
          padding: '8px 14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Filter Telemetry:</span>
          {(['ALL', 'CRITICAL', 'SEPSIS', 'STABLE'] as const).map((filter) => {
            const isAct = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                style={{
                  backgroundColor: isAct ? '#38BDF8' : 'transparent',
                  color: isAct ? '#0F172A' : '#94A3B8',
                  border: isAct ? '1px solid #38BDF8' : '1px solid #334155',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '0.7rem',
                  fontWeight: isAct ? 800 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {filter === 'ALL' && 'All Beds (6)'}
                {filter === 'CRITICAL' && 'Critical & Code Blue (1)'}
                {filter === 'SEPSIS' && 'Sepsis Risk / qSOFA ≥ 2 (2)'}
                {filter === 'STABLE' && 'Stable (3)'}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.75rem' }}>
          <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }}></span>
            Normal Sinus: 4
          </span>
          <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444', display: 'inline-block' }}></span>
            Ventricular Arrhythmia / Stat: 1
          </span>
          <span style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B', display: 'inline-block' }}></span>
            Tachy/Brady Guarded: 1
          </span>
        </div>
      </div>

      {/* VIEW 1: CENTRAL MULTI-BED WAVEFORM WALL GRID */}
      {viewMode === 'WALL_GRID' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '14px'
          }}
        >
          {filteredBeds.map((key) => {
            const b = bedsData[key];
            const isCodeBlue = codeBlueActive && key === 'BED_04';
            const isSelected = selectedBed === key;
            const news2 = calculateNEWS2(b);
            const qsofa = calculateQSOFA(b);

            return (
              <div
                key={key}
                style={{
                  backgroundColor: isCodeBlue ? 'rgba(239, 68, 68, 0.08)' : '#070C18',
                  border: isCodeBlue ? '2px solid #EF4444' : isSelected ? '2px solid #38BDF8' : '1px solid #1E293B',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: isCodeBlue ? '0 0 25px rgba(239, 68, 68, 0.35)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Bed Header & Patient Pill */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #1E293B', paddingBottom: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#F8FAFC' }}>{b.bedName}</span>
                      {isCodeBlue && (
                        <span style={{ backgroundColor: '#EF4444', color: '#FFF', fontSize: '0.625rem', fontWeight: 900, padding: '1px 6px', borderRadius: '4px', animation: 'pulse 1s infinite' }}>
                          STAT CODE BLUE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                      <strong style={{ color: '#38BDF8' }}>{b.patientName}</strong> ({b.ageGender}) • {b.uhid}
                    </div>
                  </div>

                  {/* Sepsis & NEWS2 Badges */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span
                        style={{
                          backgroundColor: `${news2.color}22`,
                          color: news2.color,
                          border: `1px solid ${news2.color}`,
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}
                        title={`NEWS2 Breakdown: Resp ${news2.breakdown.respiration}, SpO2 ${news2.breakdown.spo2}, O2 ${news2.breakdown.oxygen}, SBP ${news2.breakdown.systolicBp}, HR ${news2.breakdown.heartRate}, Temp ${news2.breakdown.temperature}`}
                      >
                        NEWS2: {news2.score} ({news2.risk})
                      </span>
                      {qsofa.isSepsisAlert && (
                        <span
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.2)',
                            color: '#F87171',
                            border: '1px solid #EF4444',
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}
                        >
                          ⚠️ qSOFA: {qsofa.score}/3
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.625rem', color: '#64748B' }}>{b.unit}</span>
                  </div>
                </div>

                {/* Real-Time Waveform Mini Canvas */}
                <IcuBedWaveformMiniCanvas
                  rhythm={b.rhythm}
                  isCodeBlue={isCodeBlue}
                  hr={b.hr}
                  width={340}
                  height={82}
                  accentColor={news2.risk === 'HIGH' ? '#EF4444' : '#10B981'}
                />

                {/* Vitals Telemetry Numbers Bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', textAlign: 'center' }}>
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px', padding: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ fontSize: '0.58rem', color: '#6EE7B7', fontWeight: 700 }}>HR</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: isCodeBlue ? '#EF4444' : '#10B981', fontFamily: 'monospace' }}>
                      {b.hr}
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.08)', borderRadius: '6px', padding: '4px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                    <div style={{ fontSize: '0.58rem', color: '#67E8F9', fontWeight: 700 }}>SpO2</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: b.spo2 < 90 ? '#EF4444' : '#06B6D4', fontFamily: 'monospace' }}>
                      {b.spo2}%
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', borderRadius: '6px', padding: '4px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <div style={{ fontSize: '0.58rem', color: '#FCD34D', fontWeight: 700 }}>NIBP</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#F59E0B', fontFamily: 'monospace', marginTop: '2px' }}>
                      {b.bp}
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'rgba(192, 132, 252, 0.08)', borderRadius: '6px', padding: '4px', border: '1px solid rgba(192, 132, 252, 0.2)' }}>
                    <div style={{ fontSize: '0.58rem', color: '#E9D5FF', fontWeight: 700 }}>RR</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#C084FC', fontFamily: 'monospace' }}>
                      {b.rr}
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'rgba(148, 163, 184, 0.08)', borderRadius: '6px', padding: '4px', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                    <div style={{ fontSize: '0.58rem', color: '#CBD5E1', fontWeight: 700 }}>TEMP</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#CBD5E1', fontFamily: 'monospace', marginTop: '2px' }}>
                      {b.temp}
                    </div>
                  </div>
                </div>

                {/* Clinical Context Footnote */}
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0B0F19', padding: '4px 8px', borderRadius: '6px' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                    🫁 {b.ventilator}
                  </span>
                  <span style={{ color: '#FCD34D', fontWeight: 700 }}>MAP: {b.map}</span>
                </div>

                {/* Bed Quick Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: 'auto' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBed(key);
                      setViewMode('FOCUSED_COCKPIT');
                    }}
                    style={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      color: '#F8FAFC',
                      borderRadius: '6px',
                      padding: '5px 4px',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🔍 Cockpit Focus
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenSepsisModal(key)}
                    style={{
                      backgroundColor: qsofa.isSepsisAlert ? 'rgba(239, 68, 68, 0.2)' : '#1E293B',
                      border: `1px solid ${qsofa.isSepsisAlert ? '#EF4444' : '#334155'}`,
                      color: qsofa.isSepsisAlert ? '#EF4444' : '#CBD5E1',
                      borderRadius: '6px',
                      padding: '5px 4px',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🦠 Sepsis 6
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareWhatsAppAlert(key)}
                    style={{
                      backgroundColor: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                      color: '#4ADE80',
                      borderRadius: '6px',
                      padding: '5px 4px',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    💬 WhatsApp
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: FOCUSED BEDSIDE COCKPIT STATION */}
      {viewMode === 'FOCUSED_COCKPIT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Bed Quick Selector Bar */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {allBedKeys.map((key) => {
              const b = bedsData[key];
              const isSel = selectedBed === key;
              const isCrit = codeBlueActive && key === 'BED_04';
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedBed(key)}
                  style={{
                    backgroundColor: isSel ? '#4F46E5' : isCrit ? 'rgba(239, 68, 68, 0.2)' : '#0F172A',
                    border: isSel ? '2px solid #818CF8' : isCrit ? '2px solid #EF4444' : '1px solid #1E293B',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    color: '#F8FAFC',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: isSel ? 800 : 600,
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{isCrit ? '🚨' : '🛏️'}</span>
                  <span>{b.bedName}</span>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>({b.hr} bpm)</span>
                </button>
              );
            })}
          </div>

          {/* 2-Column Bedside Detailed Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px' }}>
            {/* Left: High-Res Continuous Oscilloscope Monitor */}
            <div
              style={{
                backgroundColor: '#05070A',
                border: '2px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.9), 0 0 30px rgba(16, 185, 129, 0.15)'
              }}
            >
              {/* Monitor Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 900, color: '#F8FAFC' }}>{currentBed.bedName}</span>
                    <Badge variant={currentBed.status === 'CRITICAL_CODE_BLUE' ? 'danger' : 'success'}>
                      {currentBed.status}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#38BDF8', marginTop: '2px' }}>
                    Patient: <strong>{currentBed.patientName}</strong> ({currentBed.ageGender}) • {currentBed.uhid} • {currentBed.ipdNumber}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  {(() => {
                    const n2 = calculateNEWS2(currentBed);
                    return (
                      <div>
                        <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>NEWS2 TRIAGE RISK:</span>
                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: n2.color, fontFamily: 'monospace' }}>
                          {n2.score} / 12 ({n2.risk})
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Animated Canvas Waveform Frame */}
              <div style={{ position: 'relative', width: '100%', height: '230px', backgroundColor: '#05070A', borderRadius: '10px', overflow: 'hidden', border: '1px solid #1E293B' }}>
                <canvas ref={canvasRef} width={500} height={230} style={{ width: '100%', height: '100%' }} />

                {/* Waveform Labels Overlay */}
                <div style={{ position: 'absolute', top: '10px', left: '12px', fontSize: '0.6875rem', color: codeBlueActive && selectedBed === 'BED_04' ? '#EF4444' : '#10B981', fontWeight: 800 }}>
                  ECG LEAD II • {currentBed.rhythm}
                </div>
                <div style={{ position: 'absolute', top: '130px', left: '12px', fontSize: '0.6875rem', color: '#06B6D4', fontWeight: 800 }}>
                  PLETH (SpO2) • 100% PULSE SYNCHRONOUS
                </div>
              </div>

              {/* Real-Time Parameter Numbers Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', textAlign: 'center' }}>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '8px' }}>
                  <div style={{ fontSize: '0.6rem', color: '#A7F3D0', fontWeight: 700 }}>HR / PULSE</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: codeBlueActive && selectedBed === 'BED_04' ? '#EF4444' : '#10B981', fontFamily: 'monospace' }}>
                    {currentBed.hr}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#94A3B8' }}>bpm</div>
                </div>

                <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '8px', padding: '8px' }}>
                  <div style={{ fontSize: '0.6rem', color: '#BAE6FD', fontWeight: 700 }}>SpO2 SAT</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: currentBed.spo2 < 90 ? '#EF4444' : '#06B6D4', fontFamily: 'monospace' }}>
                    {currentBed.spo2}%
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#94A3B8' }}>Pleth Sat</div>
                </div>

                <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', padding: '8px' }}>
                  <div style={{ fontSize: '0.6rem', color: '#FDE68A', fontWeight: 700 }}>ABP / NIBP</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#F59E0B', fontFamily: 'monospace', marginTop: '2px' }}>
                    {currentBed.bp}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#94A3B8' }}>MAP: {currentBed.map}</div>
                </div>

                <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '8px', padding: '8px' }}>
                  <div style={{ fontSize: '0.6rem', color: '#E9D5FF', fontWeight: 700 }}>RESP RATE</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#C084FC', fontFamily: 'monospace' }}>
                    {currentBed.rr}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#94A3B8' }}>breaths/min</div>
                </div>

                <div style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', padding: '8px' }}>
                  <div style={{ fontSize: '0.6rem', color: '#FECDD3', fontWeight: 700 }}>EtCO2</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#FB7185', fontFamily: 'monospace' }}>
                    {currentBed.etco2}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#94A3B8' }}>mmHg</div>
                </div>
              </div>
            </div>

            {/* Right: Resuscitation Actions, Infusion Pump & Sepsis Controls */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid #334155',
                borderRadius: '16px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase' }}>
                  💉 Bedside ACLS Resuscitation & Sepsis Defense Desk
                </span>
                <Badge variant="primary">ACLS 2026 Compliant</Badge>
              </div>

              {/* Patient Clinical State */}
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', padding: '12px', borderRadius: '8px', fontSize: '0.8125rem' }}>
                <strong style={{ color: '#38BDF8', display: 'block', fontSize: '0.6875rem', textTransform: 'uppercase', marginBottom: '2px' }}>
                  Clinical Admission Diagnosis:
                </strong>
                <span style={{ color: '#F8FAFC', fontWeight: 700 }}>{currentBed.diagnosis}</span>
              </div>

              {/* Ventilator & Infusion Pumps */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8125rem' }}>
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ color: '#94A3B8', fontSize: '0.6875rem', display: 'block' }}>Respiratory / Ventilator:</span>
                  <strong style={{ color: '#A7F3D0' }}>{currentBed.ventilator}</strong>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '2px' }}>Mode: {currentBed.oxygenDevice}</div>
                </div>
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ color: '#94A3B8', fontSize: '0.6875rem', display: 'block' }}>Vasoactive Infusion Line:</span>
                  <strong style={{ color: '#FCD34D' }}>{currentBed.infusions}</strong>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '2px' }}>Target MAP ≥ 65 mmHg</div>
                </div>
              </div>

              {/* Sepsis 6 Protocol Quick Activation Banner */}
              {(() => {
                const q = calculateQSOFA(currentBed);
                const n = calculateNEWS2(currentBed);
                if (q.isSepsisAlert || n.risk === 'HIGH') {
                  return (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ color: '#F87171', fontSize: '0.78rem' }}>⚠️ AUTOMATED SEPSIS DETERIORATION WARNING</strong>
                          <div style={{ fontSize: '0.6875rem', color: '#FCA5A5' }}>
                            {q.criteria.join(' • ')} (qSOFA: {q.score}/3)
                          </div>
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleOpenSepsisModal(selectedBed)}
                          style={{ fontWeight: 800, fontSize: '0.72rem' }}
                        >
                          ⚡ Sepsis 6 Bundle
                        </Button>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* ACLS Emergency Resuscitation Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                <strong style={{ color: '#EF4444', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  Stat Crisis Intervention Protocols:
                </strong>

                <Button
                  variant="danger"
                  size="md"
                  onClick={handleDeliverShock}
                  style={{ width: '100%', fontWeight: 800 }}
                >
                  {shockDelivered ? '⚡ 150J Biphasic Shock Delivered!' : '⚡ Deliver 150J Defibrillator Shock (Cardioversion)'}
                </Button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGiveEpinephrine}
                    style={{ fontWeight: 700, fontSize: '0.75rem' }}
                  >
                    {epiGiven ? '✓ 1mg Epi Administered' : '💉 Bolus 1mg IV Epinephrine'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShareWhatsAppAlert(selectedBed)}
                    style={{ fontWeight: 700, fontSize: '0.75rem' }}
                  >
                    {copiedAlert ? '✓ Alert Sent!' : '💬 WhatsApp Intensivist'}
                  </Button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    style={{ fontWeight: 700, fontSize: '0.75rem' }}
                  >
                    🖨️ Print ECG Telemetry Strip
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode('WALL_GRID')}
                    style={{ fontWeight: 700, fontSize: '0.75rem' }}
                  >
                    ← Back to 6-Bed Wall
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEPSIS 6 PROTOCOL BUNDLE MODAL */}
      {showSepsisModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '2px solid #EF4444',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 30px rgba(239, 68, 68, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.4rem' }}>🦠</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
                    Sepsis 6 Protocol Bundle & Golden Hour Resuscitation
                  </h3>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                  Target Bed: <strong style={{ color: '#38BDF8' }}>{bedsData[sepsisModalBed].bedName}</strong> • {bedsData[sepsisModalBed].patientName}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSepsisModal(false)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.75rem', color: '#FCA5A5' }}>
              <strong>Clinical Imperative:</strong> Complete the 3 Deliveries & 3 Takeaways within 60 minutes of alert trigger to reduce mortality by 46%.
            </div>

            {/* Sepsis 6 Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
              {[
                { key: 'oxygen', label: '1. Give High-Flow Oxygen', sub: 'Titrate to target SpO2 94-98% (88-92% in COPD)' },
                { key: 'cultures', label: '2. Take Blood Cultures (x2 Sets)', sub: 'Aerobic & anaerobic bottles prior to starting antibiotics' },
                { key: 'antibiotics', label: '3. Give Broad-Spectrum IV Antibiotics', sub: 'Per hospital formulary (e.g. Meropenem 1g IV Stat)' },
                { key: 'fluids', label: '4. Give IV Fluid Bolus', sub: 'Crystalloid 30 mL/kg (target MAP ≥ 65 mmHg)' },
                { key: 'lactate', label: '5. Measure Serum Lactate & Serial ABG', sub: 'Lactate > 2.0 mmol/L indicates cellular hypoperfusion' },
                { key: 'urineOutput', label: '6. Measure Strict Hourly Urine Output', sub: 'Indwelling Foley catheter (target ≥ 0.5 mL/kg/h)' }
              ].map((item) => {
                const k = item.key as keyof typeof sepsisBundleState;
                const checked = sepsisBundleState[k];
                return (
                  <label
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      backgroundColor: checked ? 'rgba(16, 185, 129, 0.1)' : '#1E293B',
                      border: checked ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #334155',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setSepsisBundleState({ ...sepsisBundleState, [k]: e.target.checked })}
                      style={{ marginTop: '3px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 800, color: checked ? '#A7F3D0' : '#F8FAFC' }}>{item.label}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{item.sub}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShareWhatsAppAlert(sepsisModalBed)}
                style={{ fontWeight: 700, fontSize: '0.75rem' }}
              >
                💬 Send SBAR WhatsApp
              </Button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSepsisModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleExecuteSepsisBundle}
                  style={{ fontWeight: 800 }}
                >
                  {bundleExecuted ? '✓ Sepsis 6 Orders Logged & Dispatched' : '⚡ Execute Stat Sepsis Orders'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
