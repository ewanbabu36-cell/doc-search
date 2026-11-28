import type {
  ConsultationDto,
  EncounterDto,
  AddMedicationRequest,
  AddDiagnosisRequest
} from '@docsearch/api-contracts';
import { INDIAN_100_ICD10_DIAGNOSIS_CATALOG } from '../../services/clinical-diagnostic-icd10-catalog.js';
import { opdVoiceCallerService } from '../../services/opd-voice-caller.service.js';

export interface ClinicalQuickProtocol {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  medications: Array<{
    medicationName: string;
    strength: string;
    dosage: string;
    frequency: string;
    duration: number;
    timing: 'BEFORE_FOOD' | 'AFTER_FOOD' | 'EMPTY_STOMACH' | 'BEDTIME' | 'WITH_FOOD';
    instructions: string;
  }>;
}

export const INDIAN_CLINIC_QUICK_PROTOCOLS: ClinicalQuickProtocol[] = [
  {
    id: 'proto-viral-fever',
    name: 'Acute Viral Fever / URI',
    category: 'General',
    icon: '⚡',
    description: 'Paracetamol 650mg + Levocetirizine 5mg + Pantoprazole 40mg',
    medications: [
      { medicationName: 'Tab Dolo 650', strength: '650mg', dosage: '1 Tab', frequency: '1 - 0 - 1 - 0', duration: 3, timing: 'AFTER_FOOD', instructions: 'Take with warm water for fever & body pain' },
      { medicationName: 'Tab Levocet 5', strength: '5mg', dosage: '1 Tab', frequency: '0 - 0 - 1', duration: 5, timing: 'BEDTIME', instructions: 'Take at night for runny nose / sneezing' },
      { medicationName: 'Tab Pan 40', strength: '40mg', dosage: '1 Tab', frequency: '1 - 0 - 0', duration: 5, timing: 'EMPTY_STOMACH', instructions: 'Morning before breakfast to prevent gastric irritation' }
    ]
  },
  {
    id: 'proto-gerd',
    name: 'Acid Peptic Disorder / GERD',
    category: 'Gastroenterology',
    icon: '⚡',
    description: 'Pan-D + Digene Gel + Sucralfate',
    medications: [
      { medicationName: 'Cap Pan-D', strength: '40mg+30mg', dosage: '1 Cap', frequency: '1 - 0 - 0', duration: 7, timing: 'EMPTY_STOMACH', instructions: 'Empty stomach 30 mins before food' },
      { medicationName: 'Gel Digene Mint', strength: '200ml', dosage: '10 ml', frequency: '1 - 1 - 1', duration: 5, timing: 'AFTER_FOOD', instructions: '2 teaspoons after meals and at bedtime' }
    ]
  },
  {
    id: 'proto-gastro',
    name: 'Acute Diarrhea / AGE',
    category: 'Gastroenterology',
    icon: '⚡',
    description: 'Oflox-OZ + Racecadotril + ORS',
    medications: [
      { medicationName: 'Tab Oflox-OZ', strength: '200mg+500mg', dosage: '1 Tab', frequency: '1 - 0 - 1', duration: 5, timing: 'AFTER_FOOD', instructions: 'Twice daily after meals' },
      { medicationName: 'Cap Racecadotril 100', strength: '100mg', dosage: '1 Cap', frequency: '1 - 1 - 1', duration: 3, timing: 'BEFORE_FOOD', instructions: 'Before food for anti-secretory diarrhea control' },
      { medicationName: 'ORS Sachet', strength: '21.8g', dosage: '1 Pkt', frequency: '1 - 1 - 1', duration: 3, timing: 'WITH_FOOD', instructions: 'Dissolve in 1 liter clean water, sip frequently' }
    ]
  },
  {
    id: 'proto-htn-refill',
    name: 'Hypertension Refill (HTN)',
    category: 'Cardiology',
    icon: '⚡',
    description: 'Telmisartan 40mg + Amlodipine 5mg (30 Days)',
    medications: [
      { medicationName: 'Tab Telma 40', strength: '40mg', dosage: '1 Tab', frequency: '1 - 0 - 0', duration: 30, timing: 'BEFORE_FOOD', instructions: 'Morning before breakfast daily' },
      { medicationName: 'Tab Amlong 5', strength: '5mg', dosage: '1 Tab', frequency: '0 - 0 - 1', duration: 30, timing: 'BEDTIME', instructions: 'Night bedtime for 24h BP control' }
    ]
  },
  {
    id: 'proto-t2dm-refill',
    name: 'Type 2 Diabetes Refill (T2DM)',
    category: 'Endocrinology',
    icon: '⚡',
    description: 'Metformin 500mg SR + Glimepiride 1mg (30 Days)',
    medications: [
      { medicationName: 'Tab Glycomet 500 SR', strength: '500mg', dosage: '1 Tab', frequency: '1 - 0 - 1', duration: 30, timing: 'AFTER_FOOD', instructions: 'Twice daily with breakfast and dinner' },
      { medicationName: 'Tab Glycomet GP 1', strength: '500mg+1mg', dosage: '1 Tab', frequency: '1 - 0 - 0', duration: 30, timing: 'BEFORE_FOOD', instructions: 'Morning 15 mins before breakfast' }
    ]
  },
  {
    id: 'proto-peds-cold',
    name: 'Pediatric Cough & Cold',
    category: 'Pediatrics',
    icon: '⚡',
    description: 'Syp Paracetamol + Syp Montair-LC + Nasal Drops',
    medications: [
      { medicationName: 'Syp Calpol 250/5ml', strength: '250mg/5ml', dosage: '5 ml', frequency: '1 - 1 - 1', duration: 3, timing: 'AFTER_FOOD', instructions: 'Give every 6-8 hours for fever/body pain' },
      { medicationName: 'Syp Montair-LC Kid', strength: '2.5mg+4mg', dosage: '2.5 ml', frequency: '0 - 0 - 1', duration: 5, timing: 'BEDTIME', instructions: 'Give at night for allergic cough & congestion' },
      { medicationName: 'Nasoclear Saline Drops', strength: '0.65% w/v', dosage: '2 drops', frequency: '1 - 1 - 1 - 1', duration: 3, timing: 'AFTER_FOOD', instructions: '2 drops in each nostril before feeding / sleep' }
    ]
  }
];

export interface SoloDoctorOpdCockpitViewProps {
  consultation: ConsultationDto | null;
  consultations: ConsultationDto[];
  encounters: EncounterDto[];
  actorId: string;
  actorRole: string;
  onSelectConsultation: (consultationId: string) => void;
  onSaveDraft: (consultation: ConsultationDto & { labInvestigations?: any }, draftData: Partial<ConsultationDto>) => Promise<void> | void;
  onCompleteConsultation: (consultation: ConsultationDto & { labInvestigations?: any }, assessment: string, treatmentPlan: string) => Promise<void> | void;
  onCallNextPatient?: () => void;
  onBackToStandardDesk?: () => void;
  onAddMedication?: (req: AddMedicationRequest) => Promise<void> | void;
  onRemoveMedication?: (medicationId: string) => Promise<void> | void;
  onAddDiagnosis?: (req: AddDiagnosisRequest) => Promise<void> | void;
  onRemoveDiagnosis?: (diagnosisId: string) => Promise<void> | void;
  chamberRoom?: string;
  chamberDoctor?: string;
  consultationFeeFirstVisit?: number;
  consultationFeeFollowUp?: number;
  followUpValidityDays?: number;
  onOpenSettings?: () => void;
  onQuickRegisterWalkIn?: ((patientData: { name: string; mobile: string; age: number; gender: string; complaint: string; fee?: number | undefined; }) => Promise<void>) | undefined;
}

export interface CockpitMedItem {
  id: string;
  medicationCatalogId?: string | undefined; // Phase 4: Exact database UUID in clinical.medication_catalog
  medicationName: string;
  genericName?: string | undefined;
  strength: string;
  dosage: string;
  frequency: string;
  duration: number;
  durationUnit: string;
  beforeAfterFood: 'AFTER_FOOD' | 'BEFORE_FOOD' | 'WITH_FOOD' | 'BEDTIME' | 'EMPTY_STOMACH';
  instructions: string;
  genericSubstitute?: {
    name: string;
    janAushadhiPrice: number;
    brandPrice: number;
  } | undefined;
  dispenseQuantity?: string | undefined;
}

export interface ChronicMedicationItem {
  id: string;
  medicationName: string;
  strength: string;
  frequency: string;
  beforeAfterFood: 'AFTER_FOOD' | 'BEFORE_FOOD' | 'WITH_FOOD' | 'BEDTIME' | 'EMPTY_STOMACH';
  indication: string;
  prescribedSince?: string;
  dispenseQuantity?: string;
}

export const calculateDispenseQuantity = (medicationName: string, frequency: string, duration: number): string => {
  const nameLower = medicationName.toLowerCase();
  const isLiquid = nameLower.includes('syp') || nameLower.includes('syrup') || nameLower.includes('susp') || nameLower.includes('drops') || nameLower.includes('solution') || nameLower.includes('soln');
  const isInhaler = nameLower.includes('inhaler') || nameLower.includes('rotacap') || nameLower.includes('respule') || nameLower.includes('spray');
  const isOintment = nameLower.includes('oint') || nameLower.includes('cream') || nameLower.includes('gel');

  if (isLiquid) {
    return '1 Bottle (60ml/100ml)';
  }
  if (isInhaler) {
    return '1 Inhaler (MDI Device)';
  }
  if (isOintment) {
    return '1 Tube (15g/30g)';
  }

  let dailyUnits = 1;
  const freqClean = frequency.replace(/\s+/g, '');
  if (freqClean.includes('1-1-1-1') || freqClean.toLowerCase().includes('qid')) dailyUnits = 4;
  else if (freqClean.includes('1-1-1') || freqClean.toLowerCase().includes('tds')) dailyUnits = 3;
  else if (freqClean.includes('1-0-1') || freqClean.toLowerCase().includes('bd')) dailyUnits = 2;
  else if (freqClean.includes('1-0-0') || freqClean.includes('0-0-1') || freqClean.toLowerCase().includes('od') || freqClean.toLowerCase().includes('hs')) dailyUnits = 1;
  else if (freqClean.toLowerCase().includes('sos')) dailyUnits = 1;

  const total = Math.max(1, dailyUnits * Math.max(1, duration));
  const strips = Math.ceil(total / 10);
  return `${total} Tabs (${strips} Strip${strips > 1 ? 's' : ''})`;
};

export interface CockpitLabItem {
  id: string; // Database UUID in clinical.investigation_catalog
  investigationCatalogId: string; // Exact database UUID
  testCode: string;
  testName: string;
  shortName?: string | undefined;
  category?: string | undefined;
  categoryLabel?: string | undefined;
  specimen?: string | undefined;
  fasting?: boolean | undefined;
  tatHours?: number | undefined;
  priority?: string | undefined;
}

export interface ClinicalTemplatePreset {
  id: string;
  name: string;
  icon: string;
  category: string;
  chiefComplaint: string;
  diagnosis: string;
  icd10Code: string;
  treatmentPlan: string;
  medications: CockpitMedItem[];
  labTests: string[];
}

export const CLINICAL_COCKPIT_TEMPLATES: ClinicalTemplatePreset[] = [];

export const POPULAR_INVESTIGATION_PILLS = [
  { id: 'cbc', label: 'CBC', name: 'Complete Blood Count (CBC)' },
  { id: 'lft', label: 'LFT', name: 'Liver Function Test (LFT)' },
  { id: 'kft', label: 'KFT / Creatinine', name: 'Kidney Function Test (KFT)' },
  { id: 'hba1c', label: 'HbA1c', name: 'HbA1c (Glycated Hemoglobin)' },
  { id: 'lipid', label: 'Lipid Profile', name: 'Lipid Profile (Cholesterol)' },
  { id: 'urine', label: 'Urine R/M', name: 'Urine Routine & Microscopic' },
  { id: 'cxr', label: 'Chest X-Ray', name: 'Chest X-Ray PA View' },
  { id: 'ecg', label: 'ECG 12-Lead', name: '12-Lead Electrocardiogram' },
  { id: 'usg', label: 'USG Abdomen', name: 'Ultrasound Whole Abdomen' }
];

export const COMMON_OPD_DIAGNOSES = INDIAN_100_ICD10_DIAGNOSIS_CATALOG;

// Audio synthesizer for clinical chime & bilingual Hindi/English token announcements
export const playChime = (token?: string, patientName?: string, chamberRoom?: string, doctorName?: string) => {
  if (token) {
    void opdVoiceCallerService.announceToken({
      tokenNumber: token,
      patientName: patientName || 'Patient',
      roomNumber: chamberRoom || 'Chamber 1',
      doctorName: doctorName || 'Attending Physician'
    });
  } else {
    void opdVoiceCallerService.playChime();
  }
};

// Urgent double-tone chime (F5 -> C6) for Emergency STAT triage alerts
export const playEmergencyStatChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    // Urgent double tone: F5 (698.46 Hz) for 0.18s, then C6 (1046.50 Hz) for 0.35s
    osc.frequency.setValueAtTime(698.46, ctx.currentTime);
    osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.32, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.58);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.58);
  } catch {}
};

export interface VitalsRedFlag {
  severity: 'CRITICAL' | 'WARNING';
  label: string;
  text: string;
}

export const getVitalsRedFlags = (vitals: any): VitalsRedFlag[] => {
  if (!vitals) return [];
  const flags: VitalsRedFlag[] = [];
  const sys = Number(vitals.systolicBp || 0);
  const dia = Number(vitals.diastolicBp || 0);
  const spo2 = Number(vitals.spo2Percent || vitals.oxygenSaturationPercent || 0);
  const pulse = Number(vitals.pulseBpm || 0);
  const temp = Number(vitals.tempF || 0);
  const sugar = Number(vitals.bloodSugarMgDl || 0);

  if (sys >= 160 || dia >= 100) {
    flags.push({ severity: 'CRITICAL', label: 'Hypertensive Stage 2', text: `🚨 BP ${sys}/${dia} (High Risk)` });
  } else if (sys >= 140 || dia >= 90) {
    flags.push({ severity: 'WARNING', label: 'Elevated BP', text: `⚠️ BP ${sys}/${dia}` });
  } else if (sys > 0 && sys < 90) {
    flags.push({ severity: 'CRITICAL', label: 'Hypotension', text: `🚨 Low BP ${sys}/${dia}` });
  }

  if (spo2 > 0 && spo2 < 92) {
    flags.push({ severity: 'CRITICAL', label: 'Severe Hypoxia', text: `🚨 SpO2 ${spo2}% (Critical)` });
  } else if (spo2 > 0 && spo2 < 95) {
    flags.push({ severity: 'WARNING', label: 'Mild Hypoxia', text: `⚠️ SpO2 ${spo2}%` });
  }

  if (pulse > 110) {
    flags.push({ severity: 'WARNING', label: 'Tachycardia', text: `⚠️ Pulse ${pulse} bpm` });
  } else if (pulse > 0 && pulse < 50) {
    flags.push({ severity: 'WARNING', label: 'Bradycardia', text: `⚠️ Pulse ${pulse} bpm` });
  }

  if (temp >= 101) {
    flags.push({ severity: 'CRITICAL', label: 'High Pyrexia', text: `🚨 Fever ${temp}°F` });
  } else if (temp >= 99.5) {
    flags.push({ severity: 'WARNING', label: 'Low Fever', text: `⚠️ Fever ${temp}°F` });
  }

  if (sugar >= 250) {
    flags.push({ severity: 'CRITICAL', label: 'Severe Hyperglycemia', text: `🚨 Sugar ${sugar} mg/dL` });
  } else if (sugar > 0 && sugar < 70) {
    flags.push({ severity: 'CRITICAL', label: 'Hypoglycemia', text: `🚨 Low Sugar ${sugar} mg/dL` });
  }

  return flags;
};

export interface News2ScoreResult {
  score: number;
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH_CRITICAL';
  reasons: string[];
  isTriageStatPromoted: boolean;
}

export const calculateNews2Score = (vitals: any): News2ScoreResult => {
  if (!vitals) return { score: 0, riskTier: 'LOW', reasons: [], isTriageStatPromoted: false };
  let score = 0;
  const reasons: string[] = [];

  const sys = Number(vitals.systolicBp || 0);
  const dia = Number(vitals.diastolicBp || 0);
  const spo2 = Number(vitals.spo2Percent || vitals.oxygenSaturationPercent || 0);
  const pulse = Number(vitals.pulseBpm || 0);
  const temp = Number(vitals.tempF || 0);
  const rr = Number(vitals.respiratoryRateBpm || vitals.respiratoryRate || 0);
  const sugar = Number(vitals.bloodSugarMgDl || 0);

  // Systolic BP
  if (sys > 0) {
    if (sys <= 90) { score += 3; reasons.push('Severe Hypotension (BP ≤90)'); }
    else if (sys <= 100) { score += 2; reasons.push('Hypotension (BP 91-100)'); }
    else if (sys <= 110) { score += 1; }
    else if (sys >= 180 || dia >= 110) { score += 3; reasons.push(`Hypertensive Crisis (${sys}/${dia})`); }
    else if (sys >= 160 || dia >= 100) { score += 2; reasons.push(`Stage 2 HTN (${sys}/${dia})`); }
  }

  // SpO2
  if (spo2 > 0) {
    if (spo2 <= 91) { score += 3; reasons.push(`Critical Hypoxia (SpO2 ${spo2}%)`); }
    else if (spo2 <= 93) { score += 2; reasons.push(`Hypoxia (SpO2 ${spo2}%)`); }
    else if (spo2 <= 95) { score += 1; }
  }

  // Pulse
  if (pulse > 0) {
    if (pulse <= 40) { score += 3; reasons.push(`Severe Bradycardia (${pulse} bpm)`); }
    else if (pulse <= 50) { score += 1; }
    else if (pulse >= 131) { score += 3; reasons.push(`Severe Tachycardia (${pulse} bpm)`); }
    else if (pulse >= 111) { score += 2; reasons.push(`Tachycardia (${pulse} bpm)`); }
    else if (pulse >= 91) { score += 1; }
  }

  // Temperature
  if (temp > 0) {
    if (temp <= 95) { score += 3; reasons.push(`Hypothermia (${temp}°F)`); }
    else if (temp >= 102.5) { score += 2; reasons.push(`High Hyperpyrexia (${temp}°F)`); }
    else if (temp >= 100.5) { score += 1; }
  }

  // Respiratory Rate
  if (rr > 0) {
    if (rr <= 8 || rr >= 25) { score += 3; reasons.push(`Abnormal Resp Rate (${rr}/min)`); }
    else if (rr >= 21) { score += 2; }
  }

  // Blood Sugar emergencies
  if (sugar > 0) {
    if (sugar < 60) { score += 3; reasons.push(`Hypoglycemia (${sugar} mg/dL)`); }
    else if (sugar >= 300) { score += 2; reasons.push(`Severe Hyperglycemia (${sugar} mg/dL)`); }
  }

  const isTriageStatPromoted = score >= 5 || reasons.some(r => r.includes('Crisis') || r.includes('Critical') || r.includes('Severe'));
  const riskTier: 'LOW' | 'MEDIUM' | 'HIGH_CRITICAL' = isTriageStatPromoted ? 'HIGH_CRITICAL' : score >= 3 ? 'MEDIUM' : 'LOW';

  return { score, riskTier, reasons, isTriageStatPromoted };
};

export const COMMON_OPD_EXAMINATION_CHIPS = [
  {
    category: 'General',
    label: 'General / PICLE',
    options: [
      'GC Fair',
      'Febrile',
      'Pallor - Nil',
      'Pallor + (Mild)',
      'Icterus - Nil',
      'Icterus + (Scleral)',
      'Cyanosis - Nil',
      'Clubbing - Nil',
      'Lymphadenopathy - Nil',
      'Pedal Edema - Nil',
      'Pedal Edema + (Bilateral Pitting)',
      'Hydration Adequate',
      'Dehydrated'
    ]
  },
  {
    category: 'Chest / Resp',
    label: 'Chest / Resp',
    options: [
      'B/L Clear (NVBS)',
      'Wheeze + (Bilateral)',
      'Crepitations + (Basal)',
      'Ronchi +',
      'Air Entry Equal B/L',
      'Tachypnea'
    ]
  },
  {
    category: 'CVS',
    label: 'CVS',
    options: [
      'S1 S2 Normal',
      'No Murmur Heard',
      'Tachycardia',
      'Bradycardia',
      'Regular Rhythm'
    ]
  },
  {
    category: 'Abdomen (P/A)',
    label: 'Abdomen (P/A)',
    options: [
      'Soft & Non-Tender',
      'Epigastric Tenderness',
      'RIF Tenderness (McBurney)',
      'No Organomegaly',
      'Hepatomegaly +',
      'Bowel Sounds Normal'
    ]
  },
  {
    category: 'Throat / ENT',
    label: 'Throat / ENT',
    options: [
      'Pharynx Normal',
      'Throat Congested',
      'Tonsils Inflamed / Cryptic',
      'Ear Tympanic Clear',
      'Post-nasal Drip'
    ]
  }
];

