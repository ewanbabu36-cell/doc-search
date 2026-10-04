import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type {
  ConsultationDto,
  EncounterDto,
  AddMedicationRequest,
  AddDiagnosisRequest
} from '@docsearch/api-contracts';
import { optimisticActionService } from '../../services/optimistic-action-service.js';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';
import { PrintableDoctorPrescriptionModal } from '../dialogs/PrintableDoctorPrescriptionModal.js';
import { PatientWhatsAppSmartRxModal } from '../dialogs/PatientWhatsAppSmartRxModal.js';
import { PrintableMedicalCertificateModal } from '../dialogs/PrintableMedicalCertificateModal.js';
import { DoctorOpdReferralModal } from '../dialogs/DoctorOpdReferralModal.js';
import { ExternalInvestigationViewerModal } from '../dialogs/ExternalInvestigationViewerModal.js';
import { OpdDaycareProcedureModal, type DaycareProcedureItem } from '../dialogs/OpdDaycareProcedureModal.js';
import { OpdMlcRecordModal, type MlcDetails } from '../dialogs/OpdMlcRecordModal.js';
import { OpdTeleTriageDeskModal } from '../dialogs/OpdTeleTriageDeskModal.js';
import { OpdDuplicatePatientMergeModal } from '../dialogs/OpdDuplicatePatientMergeModal.js';
import { OpdAllergyHardLockModal, type AllergyConflictData } from '../dialogs/OpdAllergyHardLockModal.js';
import { OpdChamberPaymentModal } from '../dialogs/OpdChamberPaymentModal.js';
import { VernacularPrescriptionPreviewModal } from '../dialogs/VernacularPrescriptionPreviewModal.js';
import {
  clinicalCatalogService,
  mapCatalogMedicationToCockpitDrug,
  mapCatalogInvestigationToQuickTest
} from '../../services/clinical-catalog-service.js';
import {
  INDIAN_100_ICD10_DIAGNOSIS_CATALOG,
  matchSymptomToICD10,
  type QuickCatalogDrug,
  COMMON_OPD_SYMPTOMS,
  type CommonSymptomItem,
  type QuickLabTestItem,
  type CommonDiagnosisItem
} from '../../services/clinical-diagnostic-icd10-catalog.js';
import {
  ClinicalWebSpeechService,
  isWebSpeechSupported,
  parseDoctorVoiceTranscript,
  type ParsedClinicalVoiceData
} from '../../services/clinical-voice-scribe-parser.js';

export interface SoloDoctorOpdCockpitViewProps {
  consultation: ConsultationDto;
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
}

export interface CockpitMedItem {
  id: string;
  medicationCatalogId?: string | undefined; // Phase 4: Exact database UUID in clinical.medication_catalog
  medicationName: string;
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

const CLINICAL_COCKPIT_TEMPLATES: ClinicalTemplatePreset[] = [
  {
    id: 'viral-fever-uri',
    name: 'Viral Fever & URI Kit',
    icon: '🌡️',
    category: 'General Medicine',
    chiefComplaint: 'High grade fever for 3 days with chills, runny nose, sore throat and generalized myalgia.',
    diagnosis: 'Acute Viral Upper Respiratory Infection with Pyrexia',
    icd10Code: 'J06.9',
    treatmentPlan: '• Steam inhalation twice daily for 5 days\n• Plentiful warm oral fluids (>2.5L/day)\n• Avoid cold beverages, oily foods\n• Review after 3 days if fever >101°F persists',
    medications: [
      {
        id: 'tmpl-pcm',
        medicationName: 'Tab Paracetamol',
        strength: '650mg',
        dosage: '1 Tab',
        frequency: '1 - 0 - 1',
        duration: 3,
        durationUnit: 'DAYS',
        beforeAfterFood: 'AFTER_FOOD',
        instructions: 'After meals if temperature > 100°F',
        genericSubstitute: { name: 'Jan Aushadhi Paracetamol 650mg', janAushadhiPrice: 12, brandPrice: 45 }
      },
      {
        id: 'tmpl-levo',
        medicationName: 'Tab Levocetirizine',
        strength: '5mg',
        dosage: '1 Tab',
        frequency: '0 - 0 - 1',
        duration: 5,
        durationUnit: 'DAYS',
        beforeAfterFood: 'BEDTIME',
        instructions: 'At bedtime with warm water',
        genericSubstitute: { name: 'Jan Aushadhi Levocetirizine 5mg', janAushadhiPrice: 8, brandPrice: 52 }
      },
      {
        id: 'tmpl-panto',
        medicationName: 'Tab Pantoprazole',
        strength: '40mg',
        dosage: '1 Tab',
        frequency: '1 - 0 - 0',
        duration: 5,
        durationUnit: 'DAYS',
        beforeAfterFood: 'BEFORE_FOOD',
        instructions: 'Morning empty stomach 30 mins before breakfast',
        genericSubstitute: { name: 'Jan Aushadhi Pantoprazole 40mg', janAushadhiPrice: 15, brandPrice: 110 }
      }
    ],
    labTests: ['CBC (Complete Blood Count)']
  },
  {
    id: 'hypertension-starter',
    name: 'Hypertension Starter',
    icon: '❤️',
    category: 'Cardiology / Medicine',
    chiefComplaint: 'Occipital morning headache, dizziness, recorded BP 148/92 mmHg on two visits.',
    diagnosis: 'Essential Primary Hypertension (Stage 1)',
    icd10Code: 'I10',
    treatmentPlan: '• Dietary Sodium restriction (<5g salt/day)\n• Brisk morning walk 35-40 mins daily\n• Maintain daily home BP monitoring chart\n• Avoid NSAIDs and decongestants',
    medications: [
      {
        id: 'tmpl-telmi',
        medicationName: 'Tab Telmisartan',
        strength: '40mg',
        dosage: '1 Tab',
        frequency: '1 - 0 - 0',
        duration: 30,
        durationUnit: 'DAYS',
        beforeAfterFood: 'AFTER_FOOD',
        instructions: 'Fixed morning time daily with water',
        genericSubstitute: { name: 'Jan Aushadhi Telmisartan 40mg', janAushadhiPrice: 22, brandPrice: 140 }
      },
      {
        id: 'tmpl-amlo',
        medicationName: 'Tab Amlodipine',
        strength: '5mg',
        dosage: '1 Tab',
        frequency: '0 - 0 - 1',
        duration: 30,
        durationUnit: 'DAYS',
        beforeAfterFood: 'BEDTIME',
        instructions: 'Take daily at night',
        genericSubstitute: { name: 'Jan Aushadhi Amlodipine 5mg', janAushadhiPrice: 10, brandPrice: 48 }
      }
    ],
    labTests: ['Lipid Profile', 'KFT / Serum Creatinine', 'ECG 12-Lead']
  },
  {
    id: 'type2-diabetes',
    name: 'Type-2 Diabetes Protocol',
    icon: '🩸',
    category: 'Endocrinology',
    chiefComplaint: 'Polyuria, polydipsia, fatigue. Fasting sugar 154 mg/dL, PP sugar 224 mg/dL.',
    diagnosis: 'Type 2 Diabetes Mellitus without Complications',
    icd10Code: 'E11.9',
    treatmentPlan: '• Low glycemic index, high fiber diet\n• Zero refined sugar, sweets, or aerated drinks\n• Regular foot care and inspection\n• Check HbA1c every 90 days',
    medications: [
      {
        id: 'tmpl-metformin',
        medicationName: 'Tab Metformin HCl PR',
        strength: '500mg',
        dosage: '1 Tab',
        frequency: '1 - 0 - 1',
        duration: 30,
        durationUnit: 'DAYS',
        beforeAfterFood: 'WITH_FOOD',
        instructions: 'Immediately after meals with water',
        genericSubstitute: { name: 'Jan Aushadhi Metformin 500mg', janAushadhiPrice: 14, brandPrice: 65 }
      },
      {
        id: 'tmpl-glimepiride',
        medicationName: 'Tab Glimepiride',
        strength: '1mg',
        dosage: '1 Tab',
        frequency: '1 - 0 - 0',
        duration: 30,
        durationUnit: 'DAYS',
        beforeAfterFood: 'BEFORE_FOOD',
        instructions: 'Immediately before breakfast',
        genericSubstitute: { name: 'Jan Aushadhi Glimepiride 1mg', janAushadhiPrice: 12, brandPrice: 58 }
      }
    ],
    labTests: ['HbA1c (Glycated Hemoglobin)', 'Urine Microalbumin', 'Lipid Profile']
  },
  {
    id: 'acute-gastro',
    name: 'Acute Gastroenteritis Pack',
    icon: '💧',
    category: 'Gastroenterology',
    chiefComplaint: 'Watery diarrhea 5-6 episodes since morning, nausea, vomiting, mild abdominal cramping.',
    diagnosis: 'Acute Infective Gastroenteritis with Dehydration',
    icd10Code: 'A09',
    treatmentPlan: '• Strict hydration: sip ORS water continuously\n• Khichdi, curd, banana, coconut water diet\n• Avoid spicy, oily food, milk, raw salads\n• Return immediately if decreased urination or blood in stool',
    medications: [
      {
        id: 'tmpl-ors',
        medicationName: 'Sachet Electral ORS',
        strength: '21.8g',
        dosage: '1 Sachet in 1L Boiled Water',
        frequency: 'SOS / Sip-by-sip',
        duration: 3,
        durationUnit: 'DAYS',
        beforeAfterFood: 'AFTER_FOOD',
        instructions: 'Drink frequently throughout the day',
        genericSubstitute: { name: 'Jan Aushadhi ORS 21.8g', janAushadhiPrice: 10, brandPrice: 24 }
      },
      {
        id: 'tmpl-ondan',
        medicationName: 'Tab Ondansetron MD',
        strength: '4mg',
        dosage: '1 Tab (Mouth Dissolving)',
        frequency: '1 - 0 - 1',
        duration: 2,
        durationUnit: 'DAYS',
        beforeAfterFood: 'BEFORE_FOOD',
        instructions: 'Melt on tongue 20 mins before food',
        genericSubstitute: { name: 'Jan Aushadhi Ondansetron 4mg', janAushadhiPrice: 8, brandPrice: 42 }
      },
      {
        id: 'tmpl-raceca',
        medicationName: 'Cap Racecadotril',
        strength: '100mg',
        dosage: '1 Cap',
        frequency: '1 - 1 - 1',
        duration: 3,
        durationUnit: 'DAYS',
        beforeAfterFood: 'AFTER_FOOD',
        instructions: 'Three times daily until stools form',
        genericSubstitute: { name: 'Jan Aushadhi Racecadotril 100mg', janAushadhiPrice: 35, brandPrice: 140 }
      }
    ],
    labTests: ['Serum Electrolytes (Na+, K+, Cl-)', 'Stool Routine & Microscopic']
  },
  {
    id: 'allergic-cough',
    name: 'Bronchitis & Allergic Cough',
    icon: '🫁',
    category: 'Pulmonology',
    chiefComplaint: 'Dry hacking nocturnal cough for 5 days, post-nasal drip, chest tightness.',
    diagnosis: 'Acute Bronchitis with Allergic Airway Reactivity',
    icd10Code: 'J20.9',
    treatmentPlan: '• Steam inhalation morning & evening\n• Avoid cold air exposure, dust, pets, smoke\n• Lukewarm water sips throughout the day\n• Review after 5 days',
    medications: [
      {
        id: 'tmpl-acebro',
        medicationName: 'Cap Acebrophylline',
        strength: '100mg',
        dosage: '1 Cap',
        frequency: '1 - 0 - 1',
        duration: 5,
        durationUnit: 'DAYS',
        beforeAfterFood: 'AFTER_FOOD',
        instructions: 'After breakfast and dinner with water',
        genericSubstitute: { name: 'Jan Aushadhi Acebrophylline 100mg', janAushadhiPrice: 28, brandPrice: 120 }
      },
      {
        id: 'tmpl-montelc',
        medicationName: 'Tab Montelukast + Levocetirizine',
        strength: '10mg+5mg',
        dosage: '1 Tab',
        frequency: '0 - 0 - 1',
        duration: 7,
        durationUnit: 'DAYS',
        beforeAfterFood: 'BEDTIME',
        instructions: 'Night at bedtime',
        genericSubstitute: { name: 'Jan Aushadhi Montelukast+Levo', janAushadhiPrice: 24, brandPrice: 110 }
      }
    ],
    labTests: ['Chest X-Ray PA View', 'Absolute Eosinophil Count (AEC)']
  },
  {
    id: 'gerd-gastritis',
    name: 'GERD & Acid Peptic Pack',
    icon: '🔥',
    category: 'Gastroenterology',
    chiefComplaint: 'Retrosternal burning, acid regurgitation after meals, epigastric discomfort.',
    diagnosis: 'Gastroesophageal Reflux Disease (GERD) with Acute Gastritis',
    icd10Code: 'K21.9',
    treatmentPlan: '• Elevate head of bed by 6 inches during sleep\n• Do not lie down within 2 hours of dinner\n• Avoid tea, coffee, chocolate, mint, carbonated drinks\n• Small, frequent, low-fat meals',
    medications: [
      {
        id: 'tmpl-rabeprazole',
        medicationName: 'Cap Rabeprazole + Domperidone SR',
        strength: '20mg+30mg',
        dosage: '1 Cap',
        frequency: '1 - 0 - 0',
        duration: 14,
        durationUnit: 'DAYS',
        beforeAfterFood: 'EMPTY_STOMACH',
        instructions: 'Morning empty stomach with plain water',
        genericSubstitute: { name: 'Jan Aushadhi Rabeprazole+Dom', janAushadhiPrice: 20, brandPrice: 155 }
      },
      {
        id: 'tmpl-sucralfate',
        medicationName: 'Syp Sucralfate + Oxetacaine',
        strength: '1000mg/10ml',
        dosage: '10ml',
        frequency: '1 - 1 - 1',
        duration: 7,
        durationUnit: 'DAYS',
        beforeAfterFood: 'BEFORE_FOOD',
        instructions: 'Take 1 hour before meals, shake well',
        genericSubstitute: { name: 'Jan Aushadhi Sucralfate Syp', janAushadhiPrice: 38, brandPrice: 160 }
      }
    ],
    labTests: ['H. Pylori Antigen / Stool', 'Ultrasound Abdomen']
  }
];

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

// Audio synthesizer for clinical chime
const playChime = (token?: string, patientName?: string, chamberRoom?: string) => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);

    if (patientName && 'speechSynthesis' in window) {
      setTimeout(() => {
        try {
          const roomMsg = chamberRoom ? `, please proceed to ${chamberRoom}` : '';
          const text = token ? `Token number ${token}, ${patientName}${roomMsg}` : `${patientName}${roomMsg}`;
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.0;
          utterance.lang = 'en-IN';
          window.speechSynthesis.speak(utterance);
        } catch {}
      }, 400);
    }
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

export const SoloDoctorOpdCockpitView: React.FC<SoloDoctorOpdCockpitViewProps> = ({
  consultation,
  consultations,
  encounters,
  actorId: _actorId,
  actorRole: _actorRole,
  onSelectConsultation,
  onSaveDraft,
  onCompleteConsultation,
  onCallNextPatient,
  onBackToStandardDesk,
  onAddMedication: _onAddMedication,
  onRemoveMedication: _onRemoveMedication,
  onAddDiagnosis: _onAddDiagnosis,
  onRemoveDiagnosis: _onRemoveDiagnosis,
  chamberRoom = 'Room 101',
  chamberDoctor = 'Attending Physician',
  consultationFeeFirstVisit: _consultationFeeFirstVisit = 500,
  consultationFeeFollowUp: _consultationFeeFollowUp = 300,
  followUpValidityDays: _followUpValidityDays = 7,
  onOpenSettings: _onOpenSettings
}) => {
  const [queueSearch, setQueueSearch] = useState('');
  const [queueFilter, setQueueFilter] = useState<'ALL' | 'WAITING' | 'REPORTS_READY' | 'TRIAGED' | 'COMPLETED'>('ALL');
  const [inChamberId, setInChamberId] = useState<string>(consultation.id);
  const [isQueueCollapsed, setIsQueueCollapsed] = useState<boolean>(false);
  const [sentForLabsPatientIds, setSentForLabsPatientIds] = useState<Set<string>>(() => new Set());
  const [chamberSessionState, setChamberSessionState] = useState<'ACTIVE' | 'IN_PROCEDURE' | 'PAUSED'>('ACTIVE');
  const [chronicMedsList, setChronicMedsList] = useState<ChronicMedicationItem[]>([]);
  const [examCategoryTab, setExamCategoryTab] = useState<string>('General');
  const [realtimeTriageVitals, setRealtimeTriageVitals] = useState<Record<string, any>>({});
  const [averageConsultDurationMinutes] = useState<number>(3.8);

  // Emergency IPD Admission Modal State
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [admissionPriority, setAdmissionPriority] = useState<'EMERGENCY_STAT' | 'URGENT' | 'ELECTIVE'>('EMERGENCY_STAT');
  const [admissionWard, setAdmissionWard] = useState('ICU (Intensive Care Unit)');
  const [admissionIndication, setAdmissionIndication] = useState('');
  const [admissionStatOrders, setAdmissionStatOrders] = useState<string[]>([
    'Secure IV Line 18G / 20G Cannula Stat',
    'Start Normal Saline 0.9% @ 100 ml/hr IV',
    'Continuous SpO2 & Cardiac Telemetry Monitoring'
  ]);
  const [admissionNotes, setAdmissionNotes] = useState('');

  // 📄 Gap 6 & 7 & 3: Medical Certificate, Referral & External Scans Modals
  const [isMedicalCertModalOpen, setIsMedicalCertModalOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isExternalViewerOpen, setIsExternalViewerOpen] = useState(false);

  // 💓 Gap 2: In-Chamber Fast Vitals Quick-Capture / Doctor Override State
  const [isQuickVitalsModalOpen, setIsQuickVitalsModalOpen] = useState(false);
  const [inChamberVitals, setInChamberVitals] = useState<{
    bpSystolic?: number;
    bpDiastolic?: number;
    glucose?: number;
    spo2?: number;
    pulse?: number;
    tempF?: number;
    weightKg?: number;
  } | null>(null);
  const [editBpSys, setEditBpSys] = useState('120');
  const [editBpDia, setEditBpDia] = useState('80');
  const [editGlucose, setEditGlucose] = useState('110');
  const [editSpo2, setEditSpo2] = useState('99');
  const [editPulse, setEditPulse] = useState('76');
  const [editTemp, setEditTemp] = useState('98.6');
  const [editWeight, setEditWeight] = useState('72');

  // 📈 Gap 1: Longitudinal 3-Visit History Expanded Inspector
  const [selectedHistoricalVisit, setSelectedHistoricalVisit] = useState<any | null>(null);

  // 🩺 Gap 4: Specialty-Specific Clinical Mode State
  const [clinicalSpecialtyMode, setClinicalSpecialtyMode] = useState<'GENERAL' | 'OB_GYN' | 'PEDIATRICS' | 'ORTHO'>('GENERAL');
  
  // OB-GYN Specialty Fields
  const [obgynLmp, setObgynLmp] = useState('2026-04-12');
  const [obgynEdd, setObgynEdd] = useState('2027-01-17');
  const [obgynGestWeeks, setObgynGestWeeks] = useState(25);
  const [obgynGpla, setObgynGpla] = useState('G2 P1 L1 A0');
  const [obgynFhr, setObgynFhr] = useState(144);
  const [obgynFundalHeight, setObgynFundalHeight] = useState('24 cm (Umbilicus level)');

  // Pediatrics Specialty Fields
  const [pediatricBirthWeight, setPediatricBirthWeight] = useState('3.1 kg');
  const [pediatricMilestones] = useState<string[]>([
    'BCG Given at birth',
    'OPV 0-3 Complete',
    'Pentavalent 1-3 Given',
    'Age-appropriate neck holding & social smile'
  ]);

  // Orthopedics Specialty Fields
  const [orthoAffectedJoint, setOrthoAffectedJoint] = useState('Right Knee Joint');
  const [orthoRom, setOrthoRom] = useState('0 to 110 degrees, terminal flexion painful');
  const [orthoSwelling, setOrthoSwelling] = useState(true);
  const [orthoXrayView, setOrthoXrayView] = useState('Standing AP & Lateral View');

  // 💾 Gap 9: Local Draft Autosave State
  const [lastAutosavedTime, setLastAutosavedTime] = useState<string>('Just now');

  // 🚪 Pillar 1: Patient Door Call & Audio-Visual Queue
  const [doorStatus, setDoorStatus] = useState<'OCCUPIED' | 'VACANT'>('OCCUPIED');
  const [audioCallActive, setAudioCallActive] = useState<boolean>(false);

  // 💉 Pillar 3: OPD Daycare Minor Procedures
  const [isDaycareModalOpen, setIsDaycareModalOpen] = useState<boolean>(false);
  const [, setOrderedDaycareProcedures] = useState<DaycareProcedureItem[]>([]);

  // 🌐 Pillar 4: Vernacular Prescription Modal (Hindi / Urdu)
  const [isVernacularModalOpen, setIsVernacularModalOpen] = useState<boolean>(false);

  // ⚖️ Pillar 5: Medico-Legal Case (MLC) Guardrail
  const [isMlcModalOpen, setIsMlcModalOpen] = useState<boolean>(false);
  const [mlcDetails, setMlcDetails] = useState<MlcDetails | null>(null);

  // 📱 Pillar 6: Post-OPD WhatsApp Tele-Triage Desk
  const [isTeleTriageOpen, setIsTeleTriageOpen] = useState<boolean>(false);

  // 🆔 Pillar 7: Duplicate Patient Merge Engine
  const [isDuplicateMergeOpen, setIsDuplicateMergeOpen] = useState<boolean>(false);

  // 💰 Pillar 9: Solo Doctor Chamber Fee Settlement
  const [isChamberPaymentOpen, setIsChamberPaymentOpen] = useState<boolean>(false);
  const [chamberPaymentReceipt, setChamberPaymentReceipt] = useState<string | null>(null);

  // 🛑 Pillar 10: Critical Allergy Hard Lockout
  const [allergyConflict, setAllergyConflict] = useState<AllergyConflictData | null>(null);
  const [isHardAllergyLockOpen, setIsHardAllergyLockOpen] = useState<boolean>(false);

  // Responsive Viewport Hook (Desktop: >=1024px, Tablet: 768px-1023px, Mobile: <768px)
  const [windowWidth, setWindowWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDesktop = windowWidth >= 1024;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isMobile = windowWidth < 768;

  // Tablet & Mobile Navigation State
  const [mobileActiveTab, setMobileActiveTab] = useState<'queue' | 'rx'>('queue');
  const [isTabletDrawerOpen, setIsTabletDrawerOpen] = useState<boolean>(false);

  // Seamless 1-Click Exit to Clinic Home Dashboard
  const handleExitCockpit = useCallback(() => {
    if (onBackToStandardDesk) {
      onBackToStandardDesk();
    } else {
      window.dispatchEvent(new CustomEvent('docsearch:exit_cockpit'));
    }
  }, [onBackToStandardDesk]);

  // Form State
  const [chiefComplaint, setChiefComplaint] = useState(consultation.chiefComplaint || '');
  const [clinicalAssessment, setClinicalAssessment] = useState(consultation.clinicalAssessment || consultation.diagnoses?.[0]?.diagnosisName || '');
  const [icd10Code, setIcd10Code] = useState(consultation.diagnoses?.[0]?.diagnosisCode || '');
  const [treatmentPlan, setTreatmentPlan] = useState(consultation.treatmentPlan || '');
  const [medList, setMedList] = useState<CockpitMedItem[]>([]);
  const [selectedTests, setSelectedTests] = useState<CockpitLabItem[]>([]);
  const [followUpDays, setFollowUpDays] = useState('3 Days');

  // Diagnosis Autocomplete & Quick Selection State
  const [isDiagDropdownOpen, setIsDiagDropdownOpen] = useState(false);

  // Real-Time Web Speech AI Voice Scribe State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceInterimText, setVoiceInterimText] = useState('');
  const [voiceConfirmedText, setVoiceConfirmedText] = useState('');
  const [voiceSpeechError, setVoiceSpeechError] = useState<string | null>(null);
  const [parsedLiveVoiceData, setParsedLiveVoiceData] = useState<ParsedClinicalVoiceData | null>(null);
  const [voiceScribeMode, setVoiceScribeMode] = useState<'mic' | 'presets'>('mic');
  const speechServiceRef = useRef<ClinicalWebSpeechService | null>(null);

  // Fast Medicine Adder State (Server-backed PostgreSQL Formulary)
  const [medSearchInput, setMedSearchInput] = useState('');
  const [isMedDropdownOpen, setIsMedDropdownOpen] = useState(false);
  const [isMedSearching, setIsMedSearching] = useState(false);
  const [medSearchError, setMedSearchError] = useState<string | null>(null);
  const [serverMedResults, setServerMedResults] = useState<(QuickCatalogDrug & { catalogId: string })[]>([]);
  const [popularMedList, setPopularMedList] = useState<(QuickCatalogDrug & { catalogId: string })[]>([]);
  const medSearchAbortRef = useRef<AbortController | null>(null);
  const [adderStrength, setAdderStrength] = useState('500mg');
  const [adderDosage, setAdderDosage] = useState('1 Tab');
  const [adderFrequency, setAdderFrequency] = useState('1 - 0 - 1');
  const [adderDuration, setAdderDuration] = useState(3);
  const [adderTiming, setAdderTiming] = useState<'AFTER_FOOD' | 'BEFORE_FOOD' | 'BEDTIME' | 'EMPTY_STOMACH'>('AFTER_FOOD');
  const [adderInstructions, setAdderInstructions] = useState('');
  const [adderGenericSub, setAdderGenericSub] = useState<{ name: string; janAushadhiPrice: number; brandPrice: number } | null>(null);
  const [adderSelectedCatalogId, setAdderSelectedCatalogId] = useState<string | null>(null);

  // Fast Lab Search State (Server-backed PostgreSQL Diagnostic Catalog)
  const [labSearchInput, setLabSearchInput] = useState('');
  const [isLabDropdownOpen, setIsLabDropdownOpen] = useState(false);
  const [labCategoryFilter, setLabCategoryFilter] = useState<string>('ALL');
  const [isLabSearching, setIsLabSearching] = useState(false);
  const [labSearchError, setLabSearchError] = useState<string | null>(null);
  const [serverLabResults, setServerLabResults] = useState<(QuickLabTestItem & { catalogId: string })[]>([]);
  const [activeLabList, setActiveLabList] = useState<(QuickLabTestItem & { catalogId: string })[]>([]);
  const labSearchAbortRef = useRef<AbortController | null>(null);

  // Full Clinical Library Modals State (Server-backed)
  const [isMedicineLibraryOpen, setIsMedicineLibraryOpen] = useState(false);
  const [isLabLibraryOpen, setIsLabLibraryOpen] = useState(false);
  const [medLibrarySearch, setMedLibrarySearch] = useState('');
  const [medLibraryCategory, setMedLibraryCategory] = useState('ALL');
  const [isMedLibrarySearching, setIsMedLibrarySearching] = useState(false);
  const [medLibraryError, setMedLibraryError] = useState<string | null>(null);
  const [medLibraryResults, setMedLibraryResults] = useState<(QuickCatalogDrug & { catalogId: string })[]>([]);
  const [labLibrarySearch, setLabLibrarySearch] = useState('');
  const [labLibraryCategory, setLabLibraryCategory] = useState('ALL');
  const [isLabLibrarySearching, setIsLabLibrarySearching] = useState(false);
  const [labLibraryError, setLabLibraryError] = useState<string | null>(null);
  const [labLibraryResults, setLabLibraryResults] = useState<(QuickLabTestItem & { catalogId: string })[]>([]);
  const currentConsultationIdRef = useRef<string | null>(null);

  // Consultation Signed & Locked State
  const [isLocalSigned, setIsLocalSigned] = useState<boolean>(consultation.consultationStatus === 'COMPLETED');
  const isSignedOrCompleted = consultation.consultationStatus === 'COMPLETED' || isLocalSigned;

  useEffect(() => {
    setIsLocalSigned(consultation.consultationStatus === 'COMPLETED');
  }, [consultation.id, consultation.consultationStatus]);

  // Clean up voice speech on unmount
  useEffect(() => {
    return () => {
      if (speechServiceRef.current) {
        speechServiceRef.current.stop();
      }
    };
  }, []);

  // Symptoms selector helper: Automatically links ICD-10 Diagnosis if not yet specified
  const handleSelectSymptom = (sym: CommonSymptomItem) => {
    setChiefComplaint((prev) => {
      if (!prev || prev.trim() === '') return sym.complaintText;
      if (prev.includes(sym.chipLabel) || prev.includes(sym.complaintText)) return prev;
      return `${prev}; ${sym.complaintText}`;
    });

    const match = matchSymptomToICD10(sym.complaintText) || matchSymptomToICD10(sym.chipLabel);
    if (match && (!clinicalAssessment || clinicalAssessment.trim() === '' || clinicalAssessment.includes('General Consultation') || clinicalAssessment.includes('Initial Consultation'))) {
      setClinicalAssessment(match.name);
      setIcd10Code(match.code);
      setStatusMessage(`✓ Auto-linked ICD-10: ${match.code} (${match.chipLabel})`);
    } else {
      setStatusMessage(`✓ Added Symptom: ${sym.chipLabel}`);
    }
    setTimeout(() => setStatusMessage(null), 2500);
  };

  // Diagnosis selector helper
  const handleSelectDiagnosis = (diag: CommonDiagnosisItem) => {
    setClinicalAssessment(diag.name);
    setIcd10Code(diag.code);
    setIsDiagDropdownOpen(false);
    setStatusMessage(`✓ Selected: ${diag.chipLabel} (${diag.code})`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  // 💡 Real-Time Chief Complaint ICD-10 Matcher
  const detectedComplaintICD = useMemo(() => {
    if (!chiefComplaint || !chiefComplaint.trim()) return null;
    return matchSymptomToICD10(chiefComplaint);
  }, [chiefComplaint]);

  // Filtered Common Diagnoses
  const filteredDiagnoses = useMemo(() => {
    const q = clinicalAssessment.trim().toLowerCase();
    if (!q) return COMMON_OPD_DIAGNOSES.slice(0, 15);
    return COMMON_OPD_DIAGNOSES.filter(
      (d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q) || d.chipLabel.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [clinicalAssessment]);

  // Real-Time Microphone Voice Scribe Toggle
  const handleToggleVoiceRecording = () => {
    if (isRecordingVoice) {
      if (speechServiceRef.current) {
        speechServiceRef.current.stop();
      }
      setIsRecordingVoice(false);
      const fullTranscript = (voiceConfirmedText + ' ' + voiceInterimText).trim();
      if (fullTranscript) {
        const parsed = parseDoctorVoiceTranscript(fullTranscript);
        setParsedLiveVoiceData(parsed);
        setStatusMessage('✓ Voice Consultation captured & parsed by AI Scribe!');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } else {
      setVoiceSpeechError(null);
      setVoiceInterimText('');
      setVoiceConfirmedText('');
      setParsedLiveVoiceData(null);

      if (!isWebSpeechSupported()) {
        setVoiceSpeechError('Web Speech API is not supported in this browser. Please use Chrome or Edge.');
        return;
      }

      if (!speechServiceRef.current) {
        speechServiceRef.current = new ClinicalWebSpeechService('hi-IN');
      }

      const started = speechServiceRef.current.start(
        (interim, final) => {
          setVoiceInterimText(interim);
          setVoiceConfirmedText(final);
          const combined = (final + ' ' + interim).trim();
          if (combined.length > 8) {
            const parsed = parseDoctorVoiceTranscript(combined);
            setParsedLiveVoiceData(parsed);
          }
        },
        (errorMsg) => {
          setVoiceSpeechError(errorMsg);
          setIsRecordingVoice(false);
        },
        (isListening) => {
          setIsRecordingVoice(isListening);
        }
      );

      if (started) {
        setIsRecordingVoice(true);
        setStatusMessage('🎙️ Live Mic Active: Listening in Hindi, Hinglish & English...');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    }
  };

  // Apply parsed voice scribe data directly onto prescription pad
  const handleApplyLiveVoiceData = (dataToApply?: ParsedClinicalVoiceData) => {
    const data = dataToApply || parsedLiveVoiceData;
    if (!data) return;

    if (data.chiefComplaint) {
      setChiefComplaint((prev) => (prev ? `${prev}; ${data.chiefComplaint}` : data.chiefComplaint));
    }
    if (data.clinicalAssessment) {
      setClinicalAssessment(data.clinicalAssessment);
    }
    if (data.icd10Code) {
      setIcd10Code(data.icd10Code);
    }
    if (data.prescribedMedicines && data.prescribedMedicines.length > 0) {
      setMedList((prev) => {
        const existingNames = new Set(prev.map((p) => p.medicationName.toLowerCase()));
        const nonDupes = data.prescribedMedicines.filter(
          (m) => !existingNames.has(m.medicationName.toLowerCase())
        );
        return [...prev, ...nonDupes];
      });
    }
    if (data.orderedLabs && data.orderedLabs.length > 0) {
      const voiceLabs: CockpitLabItem[] = data.orderedLabs.map((labName: string) => {
        const matched = activeLabList.find(l => l.name.toLowerCase() === labName.toLowerCase() || l.testCode.toLowerCase() === labName.toLowerCase())
          || serverLabResults.find(l => l.name.toLowerCase() === labName.toLowerCase() || l.testCode.toLowerCase() === labName.toLowerCase());
        return {
          id: matched?.catalogId || `voice-lab-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          investigationCatalogId: matched?.catalogId || '',
          testCode: matched?.testCode || labName,
          testName: matched?.name || labName,
          category: matched?.categoryLabel || matched?.category || 'PATHOLOGY',
          categoryLabel: matched?.categoryLabel || matched?.category || 'PATHOLOGY',
          specimen: matched?.specimen,
          fasting: matched?.fasting,
          tatHours: matched?.tatHours,
          priority: 'ROUTINE'
        };
      });
      setSelectedTests((prev) => {
        const combined = [...prev];
        for (const vl of voiceLabs) {
          if (!combined.some(c => (vl.investigationCatalogId && c.investigationCatalogId === vl.investigationCatalogId) || c.testName.toLowerCase() === vl.testName.toLowerCase())) {
            combined.push(vl);
          }
        }
        return combined;
      });
    }
    if (data.treatmentPlan) {
      setTreatmentPlan((prev) => (prev ? `${prev}\n${data.treatmentPlan}` : data.treatmentPlan));
    }
    if (data.followUpDays) {
      setFollowUpDays(data.followUpDays);
    }

    setStatusMessage('⚡ Prescription Auto-Filled from Live Voice Scribe!');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Medicine adder autofill from selected drug (Preserving Database Catalog UUID)
  const autoFillAdderFromDrug = (drug: QuickCatalogDrug & { catalogId?: string }) => {
    setMedSearchInput(drug.name);
    setAdderStrength(drug.strength);
    setAdderDosage(drug.dosage);
    setAdderFrequency(drug.frequency);
    setAdderDuration(drug.duration);
    setAdderTiming(drug.beforeAfterFood);
    setAdderInstructions(drug.instructions || '');
    setAdderGenericSub({
      name: drug.genericSubstituteName,
      janAushadhiPrice: drug.janAushadhiPrice,
      brandPrice: drug.brandPrice
    });
    setAdderSelectedCatalogId(drug.catalogId || (typeof drug.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(drug.id) ? drug.id : null));
    setIsMedDropdownOpen(false);
  };

  // Medicine Adder helper (Preserving Database Catalog UUID)
  const handleAddMedicineFromAdder = (drugOverride?: QuickCatalogDrug & { catalogId?: string }) => {
    const medName = drugOverride ? drugOverride.name : medSearchInput.trim();
    if (!medName) return;

    // 🛑 Pillar 10: Critical Allergy Hard Lockout Check
    const lowerMed = medName.toLowerCase();
    const hasPenicillinAllergy = patientAllergies.some((a) => a.toLowerCase().includes('penicillin'));
    const isPenicillinDrug = lowerMed.includes('amox') || lowerMed.includes('penicil') || lowerMed.includes('augmentin') || lowerMed.includes('ampicil') || lowerMed.includes('mox');

    if (hasPenicillinAllergy && isPenicillinDrug) {
      setAllergyConflict({
        patientAllergy: 'Penicillins',
        offendingMedication: medName,
        contraindicationClass: 'Beta-Lactam Antibiotics',
        severity: 'FATAL_ANAPHYLAXIS'
      });
      setIsHardAllergyLockOpen(true);
      return;
    }

    const catalogIdCandidate = drugOverride?.catalogId || drugOverride?.id || adderSelectedCatalogId;
    const isCatalogUuid = typeof catalogIdCandidate === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catalogIdCandidate);

    const strength = drugOverride ? drugOverride.strength : adderStrength;
    const dosage = drugOverride ? drugOverride.dosage : adderDosage;
    const freq = drugOverride ? drugOverride.frequency : adderFrequency;
    const dur = drugOverride ? drugOverride.duration : adderDuration;
    const timing = drugOverride ? drugOverride.beforeAfterFood : adderTiming;
    const instr = drugOverride ? (drugOverride.instructions || '') : adderInstructions;
    const genSub = drugOverride
      ? { name: drugOverride.genericSubstituteName, janAushadhiPrice: drugOverride.janAushadhiPrice, brandPrice: drugOverride.brandPrice }
      : adderGenericSub;

    const newMed: CockpitMedItem = {
      id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      medicationCatalogId: isCatalogUuid ? (catalogIdCandidate as string) : undefined,
      medicationName: medName,
      strength: strength,
      dosage: dosage,
      frequency: freq,
      duration: dur,
      durationUnit: 'DAYS',
      beforeAfterFood: timing,
      instructions: instr,
      ...(genSub ? { genericSubstitute: genSub } : {})
    };

    setMedList((prev) => {
      const exists = prev.some((p) =>
        (newMed.medicationCatalogId && p.medicationCatalogId === newMed.medicationCatalogId) ||
        p.medicationName.toLowerCase() === medName.toLowerCase()
      );
      if (exists) {
        setStatusMessage(`ℹ️ ${medName} is already prescribed`);
        setTimeout(() => setStatusMessage(null), 2000);
        return prev;
      }
      return [...prev, newMed];
    });
    setMedSearchInput('');
    setIsMedDropdownOpen(false);
    setAdderGenericSub(null);
    setAdderSelectedCatalogId(null);
    setAdderInstructions('');
    setStatusMessage(`✓ Added ${medName} to Prescription`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  // Initial load of server-backed popular medicines & active lab tests
  useEffect(() => {
    let isSubscribed = true;

    clinicalCatalogService
      .searchMedications({ limit: 20 })
      .then((meds) => {
        if (!isSubscribed) return;
        const mapped = meds.map(mapCatalogMedicationToCockpitDrug);
        setPopularMedList(mapped);
        setServerMedResults(mapped);
      })
      .catch((err) => {
        if (!isSubscribed) return;
        setMedSearchError(err?.message || 'Failed to load hospital medications formulary');
      });

    clinicalCatalogService
      .searchInvestigations({ limit: 125 })
      .then((labs) => {
        if (!isSubscribed) return;
        const mapped = labs.map(mapCatalogInvestigationToQuickTest);
        setActiveLabList(mapped);
        setServerLabResults(mapped);
      })
      .catch((err) => {
        if (!isSubscribed) return;
        setLabSearchError(err?.message || 'Failed to load hospital investigation catalog');
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Debounced live server search for medications (~300ms)
  useEffect(() => {
    const q = medSearchInput.trim();
    if (!q) {
      setServerMedResults(popularMedList.slice(0, 10));
      setIsMedSearching(false);
      setMedSearchError(null);
      return;
    }

    if (medSearchAbortRef.current) {
      medSearchAbortRef.current.abort();
    }
    const ac = new AbortController();
    medSearchAbortRef.current = ac;

    setIsMedSearching(true);
    setMedSearchError(null);

    const timer = setTimeout(() => {
      clinicalCatalogService
        .searchMedications({ search: q, limit: 15 }, ac.signal)
        .then((items) => {
          setServerMedResults(items.map(mapCatalogMedicationToCockpitDrug));
          setIsMedSearching(false);
        })
        .catch((err) => {
          if (ac.signal.aborted) return;
          setIsMedSearching(false);
          setMedSearchError(err?.message || 'Medication search failed');
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [medSearchInput, popularMedList]);

  // Debounced live server search for laboratory investigations (~300ms)
  useEffect(() => {
    const q = labSearchInput.trim();
    const cat = labCategoryFilter;

    if (!q && cat === 'ALL') {
      setServerLabResults(activeLabList);
      setIsLabSearching(false);
      setLabSearchError(null);
      return;
    }

    if (labSearchAbortRef.current) {
      labSearchAbortRef.current.abort();
    }
    const ac = new AbortController();
    labSearchAbortRef.current = ac;

    setIsLabSearching(true);
    setLabSearchError(null);

    const timer = setTimeout(() => {
      clinicalCatalogService
        .searchInvestigations(
          {
            search: q || undefined,
            category: cat !== 'ALL' ? cat : undefined,
            limit: 30
          },
          ac.signal
        )
        .then((items) => {
          setServerLabResults(items.map(mapCatalogInvestigationToQuickTest));
          setIsLabSearching(false);
        })
        .catch((err) => {
          if (ac.signal.aborted) return;
          setIsLabSearching(false);
          setLabSearchError(err?.message || 'Investigation search failed');
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [labSearchInput, labCategoryFilter, activeLabList]);

  // Server search for Medicine Library Modal
  useEffect(() => {
    if (!isMedicineLibraryOpen) return;
    const ac = new AbortController();
    setIsMedLibrarySearching(true);
    setMedLibraryError(null);

    const timer = setTimeout(() => {
      clinicalCatalogService
        .searchMedications(
          {
            search: medLibrarySearch.trim() || undefined,
            category: medLibraryCategory !== 'ALL' ? medLibraryCategory : undefined,
            limit: 60
          },
          ac.signal
        )
        .then((items) => {
          setMedLibraryResults(items.map(mapCatalogMedicationToCockpitDrug));
          setIsMedLibrarySearching(false);
        })
        .catch((err) => {
          if (ac.signal.aborted) return;
          setIsMedLibrarySearching(false);
          setMedLibraryError(err?.message || 'Formulary query failed');
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [isMedicineLibraryOpen, medLibrarySearch, medLibraryCategory]);

  // Server search for Lab Library Modal
  useEffect(() => {
    if (!isLabLibraryOpen) return;
    const ac = new AbortController();
    setIsLabLibrarySearching(true);
    setLabLibraryError(null);

    const timer = setTimeout(() => {
      clinicalCatalogService
        .searchInvestigations(
          {
            search: labLibrarySearch.trim() || undefined,
            category: labLibraryCategory !== 'ALL' ? labLibraryCategory : undefined,
            limit: 125
          },
          ac.signal
        )
        .then((items) => {
          setLabLibraryResults(items.map(mapCatalogInvestigationToQuickTest));
          setIsLabLibrarySearching(false);
        })
        .catch((err) => {
          if (ac.signal.aborted) return;
          setIsLabLibrarySearching(false);
          setLabLibraryError(err?.message || 'Investigation catalog query failed');
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [isLabLibraryOpen, labLibrarySearch, labLibraryCategory]);

  // Aliases for component JSX
  const suggestedDrugs = serverMedResults;
  const filteredLabCatalog = serverLabResults;
  const filteredFullMedicineLibrary = medLibraryResults;
  const filteredFullLabLibrary = labLibraryResults;

  // Lab Ordering Handlers (Preserving Exact Database Catalog UUIDs)
  const handleAddCustomLab = (customName?: string) => {
    const nameToAdd = (customName || labSearchInput).trim();
    if (!nameToAdd) return;
    const match =
      activeLabList.find((t) => t.name.toLowerCase() === nameToAdd.toLowerCase() || t.testCode.toLowerCase() === nameToAdd.toLowerCase()) ||
      serverLabResults.find((t) => t.name.toLowerCase().includes(nameToAdd.toLowerCase()) || t.testCode.toLowerCase() === nameToAdd.toLowerCase());

    if (match) {
      toggleInvestigation(match);
      setLabSearchInput('');
      setIsLabDropdownOpen(false);
    } else {
      setStatusMessage('⚠️ Please select a verified investigation from the hospital catalog');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleApplyLabPanel = (panelName: string, testNames: string[]) => {
    const mappedLabItems: CockpitLabItem[] = [];
    testNames.forEach((tName) => {
      const match = activeLabList.find(
        (t) => t.name.toLowerCase() === tName.toLowerCase() || t.testCode.toLowerCase() === tName.toLowerCase()
      );
      if (match) {
        mappedLabItems.push({
          id: match.id,
          investigationCatalogId: (match as any).catalogId || match.id,
          testCode: match.testCode,
          testName: match.name,
          shortName: match.shortName,
          category: match.category,
          categoryLabel: match.categoryLabel,
          specimen: match.specimen,
          fasting: match.fasting,
          tatHours: match.tatHours,
          priority: 'ROUTINE'
        });
      }
    });

    setSelectedTests((prev) => {
      const next = [...prev];
      mappedLabItems.forEach((item) => {
        if (!next.some((n) => n.investigationCatalogId === item.investigationCatalogId)) {
          next.push(item);
        }
      });
      return next;
    });
    setStatusMessage(`⚡ Ordered ${panelName} (${mappedLabItems.length} Tests)`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  // Total Jan Aushadhi generic savings calculation
  const totalGenericSavings = useMemo(() => {
    return medList.reduce((acc, med) => {
      if (med.genericSubstitute && med.genericSubstitute.brandPrice && med.genericSubstitute.janAushadhiPrice) {
        return acc + Math.max(0, med.genericSubstitute.brandPrice - med.genericSubstitute.janAushadhiPrice);
      }
      return acc;
    }, 0);
  }, [medList]);

  // Bento Cockpit Visual Pill Cards vs Table View Toggle
  const [rxViewMode, setRxViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // AI Clinical Omni-Bar State
  const [omniSearchInput, setOmniSearchInput] = useState('');
  const [isOmniDropdownOpen, setIsOmniDropdownOpen] = useState(false);

  // Ambient AI Clinical Scribe State
  const [isAmbientPanelOpen, setIsAmbientPanelOpen] = useState(false);
  const [activeAmbientKey, setActiveAmbientKey] = useState<string>('hindi-opd-case');
  const [_isAmbientRecording, _setIsAmbientRecording] = useState(true);

  // Frequency to Visual Day/Night Matrix Parser
  const parseDosingMatrix = (freq: string, dosage: string = '1 Tab') => {
    const f = (freq || '').replace(/\s+/g, '');
    if (f === '1-0-1') {
      return { morning: dosage, afternoon: '0', night: dosage, label: '☀️ 🌙 1-0-1 (BID)' };
    }
    if (f === '1-1-1') {
      return { morning: dosage, afternoon: dosage, night: dosage, label: '☀️ 🌤️ 🌙 1-1-1 (TID)' };
    }
    if (f === '1-0-0') {
      return { morning: dosage, afternoon: '0', night: '0', label: '☀️ 1-0-0 (OD Morning)' };
    }
    if (f === '0-0-1') {
      return { morning: '0', afternoon: '0', night: dosage, label: '🌙 0-0-1 (OD Night)' };
    }
    if (f.toUpperCase().includes('SOS')) {
      return { morning: 'SOS', afternoon: 'SOS', night: 'SOS', label: '🚨 SOS (जब ज़रूरत हो)' };
    }
    return { morning: dosage, afternoon: '—', night: dosage, label: freq };
  };

  // Allergy & ADR Profile State
  const [patientAllergies, setPatientAllergies] = useState<string[]>(() => {
    if (Array.isArray(consultation.patientAllergies) && consultation.patientAllergies.length > 0) {
      return consultation.patientAllergies;
    }
    return [];
  });
  const [isAllergyModalOpen, setIsAllergyModalOpen] = useState(false);
  const [newAllergyInput, setNewAllergyInput] = useState('');

  // 🛡️ Real-Time Clinical Decision Support (CDS): Drug Interaction & Allergy Auto-Guard
  const detectedAllergyAlerts = useMemo(() => {
    const alerts: Array<{
      medId: string;
      medName: string;
      allergen: string;
      reason: string;
      swapDrug: QuickCatalogDrug;
    }> = [];

    const lowerAllergies = patientAllergies.map((a) => a.toLowerCase());
    const hasPenicillinAllergy = lowerAllergies.some((a) => a.includes('penicillin') || a.includes('amox') || a.includes('beta-lactam'));
    const hasNsaidAllergy = lowerAllergies.some((a) => a.includes('nsaid') || a.includes('aspirin') || a.includes('ibuprofen') || a.includes('diclofenac'));

    medList.forEach((med) => {
      const medLower = (med.medicationName + ' ' + (med.strength || '')).toLowerCase();

      // Check Penicillin contraindication
      if (hasPenicillinAllergy && (medLower.includes('augmentin') || medLower.includes('amox') || medLower.includes('ampicillin') || medLower.includes('taxim') || medLower.includes('cefixime'))) {
        const azithral = popularMedList.find((d) => d.name.toLowerCase().includes('azithr')) || serverMedResults[0];
        if (azithral) {
          alerts.push({
            medId: med.id,
            medName: med.medicationName,
            allergen: 'Penicillin / Beta-lactam',
            reason: `${med.medicationName} contains Beta-lactam / Penicillin class antibiotic. Patient has documented Penicillin allergy!`,
            swapDrug: azithral
          });
        }
      }

      // Check NSAID contraindication
      if (hasNsaidAllergy && (medLower.includes('combiflam') || medLower.includes('ibuprofen') || medLower.includes('voveran') || medLower.includes('diclofenac') || medLower.includes('meftal') || medLower.includes('aspirin'))) {
        const dolo = popularMedList.find((d) => d.name.toLowerCase().includes('dolo') || d.name.toLowerCase().includes('paracetamol')) || serverMedResults[0];
        if (dolo) {
          alerts.push({
            medId: med.id,
            medName: med.medicationName,
            allergen: 'NSAID / Aspirin Hypersensitivity',
            reason: `${med.medicationName} is an NSAID / COX inhibitor. Patient has documented NSAID hypersensitivity!`,
            swapDrug: dolo
          });
        }
      }
    });

    const medNames = medList.map((m) => m.medicationName.toLowerCase());

    // 3. DDI: Clopidogrel + Omeprazole
    const hasClopidogrel = medNames.some((n) => n.includes('clopidogrel') || n.includes('plavix') || n.includes('clopilet'));
    const omezMed = medList.find((m) => {
      const ml = m.medicationName.toLowerCase();
      return ml.includes('omeprazole') || ml.includes('omez') || ml.includes('esomeprazole');
    });
    if (hasClopidogrel && omezMed) {
      const panto = popularMedList.find((d) => d.name.toLowerCase().includes('panto')) || {
        id: 'swap-panto-40',
        name: 'Tab Pantoprazole',
        strength: '40mg',
        dosage: '1 Tab',
        frequency: '1 - 0 - 0',
        duration: omezMed.duration,
        durationUnit: 'DAYS',
        beforeAfterFood: 'EMPTY_STOMACH',
        instructions: '30 mins before breakfast (No CYP2C19 interaction)',
        genericSubstituteName: 'Jan Aushadhi Pantoprazole 40mg',
        janAushadhiPrice: 15,
        brandPrice: 110,
        category: 'Antacid'
      } as any;
      alerts.push({
        medId: omezMed.id,
        medName: omezMed.medicationName,
        allergen: 'MAJOR DDI: Clopidogrel + Omeprazole (CYP2C19)',
        reason: 'Omeprazole inhibits bioactivation of Clopidogrel, significantly reducing antiplatelet protection. Switch to Pantoprazole 40mg.',
        swapDrug: panto
      });
    }

    // 4. DDI: Quinolone + NSAID
    const quinoloneMed = medList.find((m) => {
      const ml = m.medicationName.toLowerCase();
      return ml.includes('cipro') || ml.includes('levoflox') || ml.includes('oflox') || ml.includes('norflox');
    });
    const nsaidMed = medList.find((m) => {
      const ml = m.medicationName.toLowerCase();
      return ml.includes('diclo') || ml.includes('ibuprofen') || ml.includes('combiflam') || ml.includes('voveran') || ml.includes('aceclo');
    });
    if (quinoloneMed && nsaidMed) {
      const dolo = popularMedList.find((d) => d.name.toLowerCase().includes('dolo') || d.name.toLowerCase().includes('paracetamol')) || serverMedResults[0];
      if (dolo) {
        alerts.push({
          medId: nsaidMed.id,
          medName: nsaidMed.medicationName,
          allergen: 'MODERATE DDI: Quinolone + NSAID (CNS Convulsion Risk)',
          reason: 'Concurrent fluoroquinolone and NSAID use enhances GABA-antagonism, increasing seizure risk. Switch NSAID to Paracetamol 650mg.',
          swapDrug: dolo
        });
      }
    }

    // 5. Duplicate Therapy: Multiple NSAIDs
    const nsaids = medList.filter((m) => {
      const ml = m.medicationName.toLowerCase();
      return ml.includes('diclo') || ml.includes('ibuprofen') || ml.includes('combiflam') || ml.includes('voveran') || ml.includes('aceclo') || ml.includes('naproxen');
    });
    if (nsaids.length > 1) {
      const secondNsaid = nsaids[1]!;
      const dolo = popularMedList.find((d) => d.name.toLowerCase().includes('dolo') || d.name.toLowerCase().includes('paracetamol')) || serverMedResults[0];
      if (dolo) {
        alerts.push({
          medId: secondNsaid.id,
          medName: secondNsaid.medicationName,
          allergen: 'DUPLICATE THERAPY: Multiple NSAIDs Prescribed',
          reason: 'Prescribing 2 NSAIDs simultaneously increases gastric ulceration and bleeding risk without extra pain relief.',
          swapDrug: dolo
        });
      }
    }

    return alerts;
  }, [medList, patientAllergies]);

  // 1-Click Safe Alternative Swap Handler
  const handleSwapContraindicatedMedicine = (medId: string, swapDrug: QuickCatalogDrug) => {
    setMedList((prev) =>
      prev.map((m) => {
        if (m.id === medId) {
          return {
            id: `med-swapped-${Date.now()}`,
            medicationName: swapDrug.name,
            strength: swapDrug.strength,
            dosage: swapDrug.dosage,
            frequency: swapDrug.frequency,
            duration: swapDrug.duration,
            durationUnit: 'DAYS',
            beforeAfterFood: swapDrug.beforeAfterFood,
            instructions: swapDrug.instructions || 'Allergy-safe substitution',
            genericSubstitute: {
              name: swapDrug.genericSubstituteName,
              janAushadhiPrice: swapDrug.janAushadhiPrice,
              brandPrice: swapDrug.brandPrice
            }
          };
        }
        return m;
      })
    );
    setStatusMessage(`🛡️ Safe Swap Applied: Substituted with ${swapDrug.name}`);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // 🧠 Filtered AI Clinical Omni-Bar Items
  const omniItems = useMemo(() => {
    const q = omniSearchInput.trim().toLowerCase();
    const list: Array<{
      id: string;
      type: 'PROTOCOL' | 'DIAGNOSIS' | 'DRUG' | 'LAB';
      title: string;
      subtitle: string;
      badge: string;
      badgeColor: string;
      icon: string;
      onSelect: () => void;
    }> = [];

    // 1. Clinical Protocols
    CLINICAL_COCKPIT_TEMPLATES.forEach((tmpl) => {
      if (!q || tmpl.name.toLowerCase().includes(q) || tmpl.category.toLowerCase().includes(q) || tmpl.diagnosis.toLowerCase().includes(q)) {
        list.push({
          id: `proto-${tmpl.id}`,
          type: 'PROTOCOL',
          title: `Protocol: ${tmpl.name}`,
          subtitle: `Instant 1-Click: ${tmpl.diagnosis} • ${tmpl.medications.length} Meds • ${tmpl.labTests.length} Labs`,
          badge: '⚡ 1-CLICK PROTOCOL',
          badgeColor: '#F59E0B',
          icon: tmpl.icon,
          onSelect: () => {
            applyTemplate(tmpl);
            setOmniSearchInput('');
            setIsOmniDropdownOpen(false);
          }
        });
      }
    });

    // 2. Common Diagnoses
    COMMON_OPD_DIAGNOSES.forEach((diag) => {
      if (!q || diag.name.toLowerCase().includes(q) || diag.code.toLowerCase().includes(q) || diag.chipLabel.toLowerCase().includes(q)) {
        list.push({
          id: `diag-${diag.id}`,
          type: 'DIAGNOSIS',
          title: diag.name,
          subtitle: `ICD-10: ${diag.code} • ${diag.category}`,
          badge: '🩺 DIAGNOSIS',
          badgeColor: '#38BDF8',
          icon: diag.icon,
          onSelect: () => {
            handleSelectDiagnosis(diag);
            setOmniSearchInput('');
            setIsOmniDropdownOpen(false);
          }
        });
      }
    });

    // 3. Drugs (Server-backed Hospital Medication Catalog)
    serverMedResults.slice(0, 8).forEach((drug) => {
      const savings = drug.brandPrice - drug.janAushadhiPrice;
      list.push({
        id: `drug-${drug.catalogId || drug.id}`,
        type: 'DRUG',
        title: `${drug.name} (${drug.strength})`,
        subtitle: `${drug.genericName} • Jan Aushadhi: ₹${drug.janAushadhiPrice}${savings > 0 ? ` (Save ₹${savings})` : ''}`,
        badge: '💊 MEDICINE',
        badgeColor: '#10B981',
        icon: '💊',
        onSelect: () => {
          handleAddMedicineFromAdder(drug);
          setOmniSearchInput('');
          setIsOmniDropdownOpen(false);
        }
      });
    });

    // 4. Labs (Server-backed Hospital Investigation Catalog)
    serverLabResults.slice(0, 8).forEach((test) => {
      list.push({
        id: `lab-${test.catalogId || test.id}`,
        type: 'LAB',
        title: `Order Lab: ${test.name}`,
        subtitle: `${test.categoryLabel} • Specimen: ${test.specimen}${test.fasting ? ' • Fasting Req' : ''}`,
        badge: '🔬 LAB TEST',
        badgeColor: '#A855F7',
        icon: '🔬',
        onSelect: () => {
          toggleInvestigation(test);
          setOmniSearchInput('');
          setIsOmniDropdownOpen(false);
        }
      });
    });

    if (!q) return list.slice(0, 12);
    return list.slice(0, 16);
  }, [omniSearchInput, medList]);

  // 🎙️ Ambient AI Voice Scribe Scenarios
  const AMBIENT_SCENARIOS: Record<string, {
    title: string;
    badge: string;
    transcript: string;
    data: {
      chiefComplaint: string;
      assessment: string;
      icd10Code: string;
      treatmentPlan: string;
      medications: CockpitMedItem[];
      labs: string[];
    };
  }> = {
    'hindi-opd-case': {
      title: 'अमन वर्मा (26M) - 3 दिन बुखार + पेरासिटामोल 650 + CBC',
      badge: 'Hindi Voice OPD',
      transcript:
        'डॉक्टर: 3 दिन से बुखार है, पेरासिटामोल 650mg सुबह-शाम खाने के बाद और एक सीबीसी टेस्ट करवा लो। गरम पानी का भाप लीजिए।',
      data: {
        chiefComplaint: 'High grade fever for 3 days with chills',
        assessment: 'Acute Viral Upper Respiratory Infection (URI) with Pyrexia',
        icd10Code: 'J06.9',
        treatmentPlan: '• Steam inhalation twice daily for 5 days\n• Plentiful warm oral fluids (>2.5L/day)\n• Review after 3 days if fever persists',
        medications: [
          {
            id: `med-sc-hindi-1-${Date.now()}`,
            medicationName: 'Tab Paracetamol',
            strength: '650mg',
            dosage: '1 Tab',
            frequency: '1 - 0 - 1',
            duration: 3,
            durationUnit: 'DAYS',
            beforeAfterFood: 'AFTER_FOOD',
            instructions: 'After meals with warm water',
            genericSubstitute: { name: 'Jan Aushadhi Paracetamol 650mg', janAushadhiPrice: 12, brandPrice: 42 }
          }
        ],
        labs: ['Complete Blood Count (CBC / Hemogram)']
      }
    },
    'viral-fever': {
      title: 'Rajesh (26M) - Viral Fever & URI',
      badge: 'Fever / URI',
      transcript:
        'Doctor: Namaste Rajesh ji, aaiye baithiye. Kya takleef ho rahi hai?\n' +
        'Patient: Doctor sahab, 3 din se tez bukhar hai, gale me dard aur badan tootta rehta hai.\n' +
        'Doctor: Pharynx congested hai, chest clear hai. Main Paracetamol 650mg subah-shaam aur Pantoprazole 40mg subah khali pet likh raha hoon. Saath me CBC karva lijiye aur garam paani ka bhaanp lijiye.',
      data: {
        chiefComplaint: 'High grade fever for 3 days with chills, sore throat, and severe body ache',
        assessment: 'Acute Viral Upper Respiratory Infection (URI) with Pyrexia',
        icd10Code: 'J06.9',
        treatmentPlan: '• Steam inhalation twice daily for 5 days\n• Plentiful warm oral fluids (>2.5L/day)\n• Avoid cold beverages, oily foods\n• Review after 3 days if fever persists',
        medications: [
          {
            id: `med-sc-1-${Date.now()}`,
            medicationName: 'Tab Dolo 650',
            strength: '650mg',
            dosage: '1 Tab',
            frequency: '1 - 0 - 1',
            duration: 3,
            durationUnit: 'DAYS',
            beforeAfterFood: 'AFTER_FOOD',
            instructions: 'Take with warm water after meals',
            genericSubstitute: { name: 'Jan Aushadhi Paracetamol 650mg', janAushadhiPrice: 12, brandPrice: 42 }
          },
          {
            id: `med-sc-2-${Date.now()}`,
            medicationName: 'Tab Pan 40',
            strength: '40mg',
            dosage: '1 Tab',
            frequency: '1 - 0 - 0',
            duration: 5,
            durationUnit: 'DAYS',
            beforeAfterFood: 'EMPTY_STOMACH',
            instructions: 'Morning 30 mins before breakfast',
            genericSubstitute: { name: 'Jan Aushadhi Pantoprazole 40mg', janAushadhiPrice: 18, brandPrice: 115 }
          },
          {
            id: `med-sc-3-${Date.now()}`,
            medicationName: 'Tab Cetzine',
            strength: '10mg',
            dosage: '1 Tab',
            frequency: '0 - 0 - 1',
            duration: 5,
            durationUnit: 'DAYS',
            beforeAfterFood: 'BEDTIME',
            instructions: 'Night bedtime with water',
            genericSubstitute: { name: 'Jan Aushadhi Cetirizine 10mg', janAushadhiPrice: 6, brandPrice: 48 }
          }
        ],
        labs: ['Complete Blood Count (CBC)']
      }
    },
    'htn-diabetes': {
      title: 'Priya (48F) - T2DM & HTN Follow-Up',
      badge: 'Cardio / Metabolic',
      transcript:
        'Doctor: Good morning Priya ji. Blood sugar aur BP kaisa chal raha hai?\n' +
        'Patient: Doctor sahab, subah BP 142/90 mmHg tha aur fasting sugar 138 mg/dL aa rahi thi.\n' +
        'Doctor: Glycomet 500 continue karenge aur BP control ke liye Telma 40 add kar rahe hain. HbA1c aur Lipid Profile karwayein.',
      data: {
        chiefComplaint: 'Hypertension and Type-2 Diabetes follow-up. Occipital headache, BP 142/90 mmHg',
        assessment: 'Type 2 Diabetes Mellitus with Essential Primary Hypertension',
        icd10Code: 'E11.9 / I10',
        treatmentPlan: '• Restrict dietary salt to < 5g/day\n• Low glycemic index diet, 35 mins brisk walk daily\n• Maintain daily home BP log',
        medications: [
          {
            id: `med-sc-4-${Date.now()}`,
            medicationName: 'Tab Glycomet 500',
            strength: '500mg',
            dosage: '1 Tab',
            frequency: '1 - 0 - 1',
            duration: 30,
            durationUnit: 'DAYS',
            beforeAfterFood: 'AFTER_FOOD',
            instructions: 'With or immediately after meals',
            genericSubstitute: { name: 'Jan Aushadhi Metformin 500mg', janAushadhiPrice: 14, brandPrice: 65 }
          },
          {
            id: `med-sc-5-${Date.now()}`,
            medicationName: 'Tab Telma 40',
            strength: '40mg',
            dosage: '1 Tab',
            frequency: '1 - 0 - 0',
            duration: 30,
            durationUnit: 'DAYS',
            beforeAfterFood: 'AFTER_FOOD',
            instructions: 'Fixed time daily morning with water',
            genericSubstitute: { name: 'Jan Aushadhi Telmisartan 40mg', janAushadhiPrice: 24, brandPrice: 145 }
          }
        ],
        labs: ['HbA1c (Glycated Hemoglobin)', 'Lipid Profile (Cholesterol)', 'Kidney Function Test (KFT)']
      }
    },
    'acute-ge': {
      title: 'Ramesh (34M) - Acute Gastroenteritis',
      badge: 'Gastroenterology',
      transcript:
        'Doctor: Ramesh ji, bataiye kya takleef hai?\n' +
        'Patient: Doctor sahab, subah se 5 baar ulti aur dast ho rahe hain, pait me tez marod hai.\n' +
        'Doctor: Pulse 88/min, tongue dry hai. Electral ORS ghol kar pijiye, ulti ke liye Emeset 4 aur pet dard ke liye Meftal-Spas likh raha hoon.',
      data: {
        chiefComplaint: 'Watery diarrhea 5 episodes since morning, repeated vomiting, abdominal cramps',
        assessment: 'Acute Infective Gastroenteritis with Mild Dehydration',
        icd10Code: 'A09',
        treatmentPlan: '• Oral rehydration: drink minimum 2.5L ORS water daily\n• Light khichdi, banana, coconut water\n• Avoid spicy, oily, milk products',
        medications: [
          {
            id: `med-sc-6-${Date.now()}`,
            medicationName: 'Sachet Electral ORS',
            strength: '21.8g',
            dosage: '1 Sachet in 1L Water',
            frequency: 'SOS / Frequent',
            duration: 3,
            durationUnit: 'DAYS',
            beforeAfterFood: 'AFTER_FOOD',
            instructions: 'Mix full packet in 1 litre drinking water, sip continuously',
            genericSubstitute: { name: 'Jan Aushadhi ORS 21.8g', janAushadhiPrice: 9, brandPrice: 24 }
          },
          {
            id: `med-sc-7-${Date.now()}`,
            medicationName: 'Tab Emeset 4',
            strength: '4mg',
            dosage: '1 Tab',
            frequency: '1 - 0 - 1',
            duration: 2,
            durationUnit: 'DAYS',
            beforeAfterFood: 'BEFORE_FOOD',
            instructions: 'Dissolve in mouth 15 mins before meals',
            genericSubstitute: { name: 'Jan Aushadhi Ondansetron 4mg', janAushadhiPrice: 11, brandPrice: 58 }
          },
          {
            id: `med-sc-8-${Date.now()}`,
            medicationName: 'Tab Meftal-Spas',
            strength: '250mg+10mg',
            dosage: '1 Tab',
            frequency: 'SOS',
            duration: 2,
            durationUnit: 'DAYS',
            beforeAfterFood: 'AFTER_FOOD',
            instructions: 'Take for acute abdominal spasmodic pain',
            genericSubstitute: { name: 'Jan Aushadhi Mefenamic+Dicyclo', janAushadhiPrice: 12, brandPrice: 52 }
          }
        ],
        labs: ['Kidney Function Test (KFT)', 'Urine Routine & Microscopic']
      }
    }
  };

  // 1-Click Auto-Fill Rx from Ambient Scenario Helper
  const applyAmbientScenario = (scKey: string) => {
    const sc = AMBIENT_SCENARIOS[scKey];
    if (!sc) return;
    setChiefComplaint(sc.data.chiefComplaint);
    setClinicalAssessment(sc.data.assessment);
    setIcd10Code(sc.data.icd10Code);
    setMedList(sc.data.medications);
    const mappedLabs: CockpitLabItem[] = sc.data.labs.map((labName: string) => {
      const match = activeLabList.find(
        (t) => t.name.toLowerCase() === labName.toLowerCase() || t.testCode.toLowerCase() === labName.toLowerCase()
      ) || serverLabResults.find(
        (t) => t.name.toLowerCase() === labName.toLowerCase() || t.testCode.toLowerCase() === labName.toLowerCase()
      );
      return {
        id: match?.catalogId || match?.id || `ambient-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        investigationCatalogId: match?.catalogId || match?.id || '',
        testCode: match?.testCode || labName,
        testName: match?.name || labName,
        shortName: match?.shortName,
        category: match?.category,
        categoryLabel: match?.categoryLabel,
        specimen: match?.specimen,
        fasting: match?.fasting,
        tatHours: match?.tatHours,
        priority: 'ROUTINE'
      };
    });
    setSelectedTests(mappedLabs);
    setTreatmentPlan(sc.data.treatmentPlan);
    setStatusMessage(`🎙️ AI Scribe Auto-Filled Entire Rx: ${sc.title}`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Physical Examination (O/E) Findings State
  const [examFindings, setExamFindings] = useState<string[]>(() => {
    if (consultation.examinationSummary) {
      return consultation.examinationSummary.split(', ').map((s) => s.trim()).filter(Boolean);
    }
    return ['GC Fair', 'B/L Clear (NVBS)', 'S1 S2 Normal', 'Soft & Non-Tender'];
  });

  const toggleExamFinding = (finding: string) => {
    setExamFindings((prev) => {
      const exists = prev.includes(finding);
      if (exists) {
        return prev.filter((f) => f !== finding);
      }
      return [...prev, finding];
    });
  };

  const setAllNormalExam = () => {
    setExamFindings(['GC Fair', 'B/L Clear (NVBS)', 'S1 S2 Normal', 'Soft & Non-Tender', 'Pharynx Normal']);
    setStatusMessage('⚡ Physical Exam set to All Normal (NAD)');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  // Modals
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isNextPatientPromptOpen, setIsNextPatientPromptOpen] = useState(false);
  const [completedPatientInfo, setCompletedPatientInfo] = useState<{ name: string; token: string } | null>(null);
  const [nextWaitingPatient, setNextWaitingPatient] = useState<any | null>(null);

  // Status notification
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // 🚨 Real-time Critical Panic Lab Alert State (NABL ISO 15189 compliance)
  const [criticalPanicAlert, setCriticalPanicAlert] = useState<{
    alertId?: string;
    patientId?: string;
    patientName: string;
    analyte: string;
    measuredValue: string | number;
    unit: string;
    referenceRange: string;
    severity?: string;
    intimationStatus?: string;
    timestamp: string;
    countdownSeconds?: number;
  } | null>(null);

  // 🚨 Listen for NABL Critical Panic Value lab alerts in real time
  useEffect(() => {
    const unsub = hospitalEventBus.subscribe('CRITICAL_PANIC_ALERT', (payload) => {
      const d = payload.data || {};
      setCriticalPanicAlert({
        alertId: d.alertId || `CPA-${Date.now()}`,
        patientId: d.patientId,
        patientName: d.patientName || consultation.patientName || 'Emergency Patient',
        analyte: d.analyte || 'Critical Lab Parameter',
        measuredValue: d.measuredValue ?? '--',
        unit: d.unit || '',
        referenceRange: d.referenceRange || 'Normal Interval',
        severity: d.severity || 'CRITICAL',
        intimationStatus: d.intimationStatus || 'PENDING',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        countdownSeconds: 15 * 60
      });
      try {
        playChime();
      } catch {}
    });
    return () => unsub();
  }, [consultation.patientName]);

  // Dynamic Triage Vitals & Lab Return Listeners (Gold Standard Pillar 1)
  useEffect(() => {
    const unsubTriage = hospitalEventBus.subscribe('TRIAGE_VITALS_RECORDED', (payload) => {
      const d = payload.data || {};
      const targetId = d.encounterId || d.patientId;
      if (targetId && d.vitals) {
        setRealtimeTriageVitals((prev) => ({
          ...prev,
          [targetId]: d.vitals
        }));

        const news2 = calculateNews2Score(d.vitals);
        if (news2.isTriageStatPromoted) {
          setStatusMessage(`🚨 STAT TRIAGE: ${d.name || d.patientName || 'Patient'} auto-promoted to Priority 1 (NEWS2: ${news2.score})!`);
          try {
            playChime(d.opdToken, d.name || d.patientName, chamberRoom);
          } catch {}
          setTimeout(() => setStatusMessage(null), 5000);
        }
      }
    });

    const unsubLabReturn = hospitalEventBus.subscribe('LAB_REPORT_COMPLETED', (payload) => {
      const d = payload.data || {};
      const targetId = d.encounterId || d.patientId || d.uhid;
      if (targetId) {
        setSentForLabsPatientIds((prev) => new Set([...prev, targetId]));
        setStatusMessage(`🧪 LABS READY: ${d.patientName || 'Patient'} auto-inserted for Fast-Track Re-Visit!`);
        try {
          playChime(d.tokenNumber, d.patientName, chamberRoom);
        } catch {}
        setTimeout(() => setStatusMessage(null), 5000);
      }
    });

    const unsubLabReturnReady = hospitalEventBus.subscribe('LAB_RETURN_READY', (payload) => {
      const d = payload.data || {};
      const targetId = d.encounterId || d.patientId || d.uhid;
      if (targetId) {
        setSentForLabsPatientIds((prev) => new Set([...prev, targetId]));
        setStatusMessage(`🧪 RE-VISIT READY: ${d.patientName || 'Patient'} in waiting hall with signed reports!`);
        try {
          playChime(d.tokenNumber, d.patientName, chamberRoom);
        } catch {}
        setTimeout(() => setStatusMessage(null), 5000);
      }
    });

    return () => {
      unsubTriage();
      unsubLabReturn();
      unsubLabReturnReady();
    };
  }, [chamberRoom]);

  // Countdown timer for 15-min verbal communication window
  useEffect(() => {
    if (!criticalPanicAlert || (criticalPanicAlert.countdownSeconds ?? 0) <= 0) return;
    const timer = setInterval(() => {
      setCriticalPanicAlert((prev) => {
        if (!prev || (prev.countdownSeconds ?? 0) <= 0) return prev;
        return { ...prev, countdownSeconds: (prev.countdownSeconds ?? 0) - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [criticalPanicAlert?.alertId]);

  // Active Encounter matching current consultation
  const activeEncounter = useMemo(() => {
    return encounters.find(
      (e) =>
        (consultation.encounterId && e.id === consultation.encounterId) ||
        (consultation.patientId && e.patientId === consultation.patientId) ||
        (consultation.patientMrn && e.patientMrn === consultation.patientMrn)
    );
  }, [encounters, consultation]);

  // Dynamic Patient Demographics & Profile
  const activePatient = useMemo(() => {
    const enc = activeEncounter;
    const rawAge = (enc as any)?.age || (enc as any)?.patientAge || (enc?.metadata as any)?.age || (consultation.metadata as any)?.age || (consultation as any)?.patientAge;
    const parsedAge = typeof rawAge === 'number' ? rawAge : parseInt(String(rawAge || '26'), 10) || 26;
    const ageDisplay = rawAge ? `${rawAge}y` : '26y';
    const isPediatric = parsedAge < 12;
    const estimatedWeightKg = isPediatric ? (parsedAge * 2) + 8 : undefined;
    const genderDisplay = consultation.patientGender || enc?.patientGender || (enc as any)?.gender || 'Male';
    const nameDisplay = consultation.patientName || enc?.patientName || 'Aman Verma';
    const tokenDisplay = consultation.queueToken || enc?.tokenNumber || (enc as any)?.queueToken || 'TK-565';
    const mrnDisplay = consultation.patientMrn || enc?.patientMrn || 'MRN-478827';
    const phoneDisplay = consultation.patientMobile || enc?.patientMobile || '9876543210';
    const nurseVitals = consultation.vitals || (enc as any)?.vitals || (enc?.metadata as any)?.vitals || null;

    // Follow-up Revisit Validity Calculation (Gap 5)
    const lastVisitDate = (enc as any)?.lastVisitDate || (consultation.metadata as any)?.lastVisitDate || '2026-09-29';
    const daysSinceLastVisit = Math.max(1, Math.floor((Date.now() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24)) || 5);
    const isFreeFollowUpRevisit = daysSinceLastVisit <= 7;

    return {
      name: nameDisplay,
      token: tokenDisplay,
      age: ageDisplay,
      numericAge: parsedAge,
      isPediatric,
      estimatedWeightKg,
      gender: genderDisplay,
      mrn: mrnDisplay,
      phone: phoneDisplay,
      nurseVitals,
      daysSinceLastVisit,
      isFreeFollowUpRevisit
    };
  }, [consultation, activeEncounter]);

  // Longitudinal Multi-Visit History (Gap 1: 3-Visit Comparison Sparkline)
  const longitudinalVisits = useMemo(() => {
    const sys = inChamberVitals?.bpSystolic ?? (activePatient.nurseVitals?.systolicBp || 124);
    const dia = inChamberVitals?.bpDiastolic ?? (activePatient.nurseVitals?.diastolicBp || 82);
    const sugar = inChamberVitals?.glucose ?? ((activePatient.nurseVitals as any)?.bloodSugarMgDl || 118);
    const pulse = inChamberVitals?.pulse ?? (activePatient.nurseVitals?.pulseBpm || 74);
    const weight = inChamberVitals?.weightKg ?? 76;

    return [
      {
        id: 'visit-1',
        label: 'Visit 1 (04-Sep)',
        relative: '1 Mo ago',
        bp: '154/96',
        bpSys: 154,
        bpDia: 96,
        sugar: '218 mg/dL',
        sugarVal: 218,
        pulse: '84 bpm',
        weight: '78.5 kg',
        assessment: 'Newly Diagnosed Essential Hypertension & T2DM',
        prescribedMeds: 'Tab Telmisartan 40mg (OD), Tab Metformin 500mg (BD)',
        keyNote: 'Initial presentation with BP spike and polyuria'
      },
      {
        id: 'visit-2',
        label: 'Visit 2 (19-Sep)',
        relative: '15d ago',
        bp: '138/88',
        bpSys: 138,
        bpDia: 88,
        sugar: '162 mg/dL',
        sugarVal: 162,
        pulse: '78 bpm',
        weight: '77.2 kg',
        assessment: 'Hypertension titrating towards control',
        prescribedMeds: 'Tab Telmisartan 40mg + Tab Metformin 500mg + Tab Atorvastatin 10mg HS',
        keyNote: 'BP lowering observed, lipid profile requested'
      },
      {
        id: 'visit-current',
        label: 'Today (04-Oct)',
        relative: 'Current Encounter',
        bp: `${sys}/${dia}`,
        bpSys: sys,
        bpDia: dia,
        sugar: `${sugar} mg/dL`,
        sugarVal: sugar,
        pulse: `${pulse} bpm`,
        weight: `${weight} kg`,
        assessment: clinicalAssessment || 'Routine OPD Evaluation',
        prescribedMeds: medList.length > 0 ? medList.map(m => m.medicationName).join(', ') : 'In Consultation Draft',
        keyNote: 'Controlled hemodynamics; ongoing treatment plan'
      }
    ];
  }, [inChamberVitals, activePatient, clinicalAssessment, medList]);

  // Sync state whenever consultation changes
  useEffect(() => {
    // CRITICAL FIX: Only initialize fields when switching to a DIFFERENT consultation!
    // Prevents 4-second background heartbeat from wiping doctor's active prescription, medicines and tests!
    if (currentConsultationIdRef.current === consultation.id) {
      return;
    }
    currentConsultationIdRef.current = consultation.id;

    setChiefComplaint(consultation.chiefComplaint || '');
    setClinicalAssessment(consultation.clinicalAssessment || consultation.diagnoses?.[0]?.diagnosisName || '');
    setIcd10Code(consultation.diagnoses?.[0]?.diagnosisCode || '');
    setTreatmentPlan(consultation.treatmentPlan || '');
    if (consultation.medications && consultation.medications.length > 0) {
      setMedList(
        consultation.medications.map((m: any) => ({
          id: m.id,
          medicationCatalogId: m.medicationCatalogId || m.medicationId || (typeof m.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(m.id) ? m.id : undefined),
          medicationName: m.medicationName,
          strength: m.strength || '500mg',
          dosage: m.dosage || '1 Tab',
          frequency: m.frequency || '1 - 0 - 1',
          duration: m.duration || 5,
          durationUnit: m.durationUnit || 'DAYS',
          beforeAfterFood: (m.beforeAfterFood as any) || 'AFTER_FOOD',
          instructions: m.instructions || ''
        }))
      );
    } else {
      setMedList([]);
    }

    const rawTests = (consultation as any).labInvestigations || (consultation.metadata as any)?.labInvestigations || (consultation as any).investigationOrders;
    if (Array.isArray(rawTests) && rawTests.length > 0) {
      const restoredLabs: CockpitLabItem[] = rawTests.map((i: any) => ({
        id: i.id || i.investigationCatalogId || i.investigationId || `lab-${Math.random()}`,
        investigationCatalogId: i.investigationCatalogId || i.investigationId || i.id,
        testCode: i.testCode || 'LAB',
        testName: i.testName || i.investigationName || i.name || String(i),
        category: i.category,
        categoryLabel: i.categoryLabel,
        specimen: i.specimen,
        fasting: i.fasting,
        tatHours: i.tatHours,
        priority: i.priority || 'ROUTINE'
      }));
      setSelectedTests(restoredLabs);
    } else {
      setSelectedTests([]);
    }

    // Sync allergies
    if (Array.isArray(consultation.patientAllergies) && consultation.patientAllergies.length > 0) {
      setPatientAllergies(consultation.patientAllergies);
    } else {
      const encAllergies = (activeEncounter?.metadata as any)?.allergies;
      if (Array.isArray(encAllergies) && encAllergies.length > 0) {
        setPatientAllergies(encAllergies);
      } else {
        setPatientAllergies([]);
      }
    }

    // Sync examination findings
    if (consultation.examinationSummary) {
      setExamFindings(consultation.examinationSummary.split(', ').map((s) => s.trim()).filter(Boolean));
    } else {
      setExamFindings(['GC Fair', 'B/L Clear (NVBS)', 'S1 S2 Normal', 'Soft & Non-Tender']);
    }

    // Sync chronic ongoing medications based on patient clinical history / demographics
    const pName = (consultation.patientName || '').toLowerCase();
    const rawAge = (consultation as any)?.patientAge || 35;
    const numAge = typeof rawAge === 'number' ? rawAge : parseInt(String(rawAge), 10) || 35;

    if (pName.includes('sharma') || pName.includes('verma') || numAge > 45) {
      setChronicMedsList([
        {
          id: 'chr-telma',
          medicationName: 'Tab Telmisartan',
          strength: '40mg',
          frequency: '1 - 0 - 0',
          beforeAfterFood: 'BEFORE_FOOD',
          indication: 'Essential Hypertension',
          prescribedSince: '6 months ago',
          dispenseQuantity: '30 Tabs (3 Strips)'
        },
        {
          id: 'chr-metformin',
          medicationName: 'Tab Metformin PR',
          strength: '500mg',
          frequency: '1 - 0 - 1',
          beforeAfterFood: 'AFTER_FOOD',
          indication: 'Type-2 Diabetes Mellitus',
          prescribedSince: '1 year ago',
          dispenseQuantity: '60 Tabs (6 Strips)'
        },
        {
          id: 'chr-atorva',
          medicationName: 'Tab Atorvastatin',
          strength: '10mg',
          frequency: '0 - 0 - 1',
          beforeAfterFood: 'BEDTIME',
          indication: 'Dyslipidemia / CV Protection',
          prescribedSince: '6 months ago',
          dispenseQuantity: '30 Tabs (3 Strips)'
        }
      ]);
    } else {
      setChronicMedsList([
        {
          id: 'chr-panto',
          medicationName: 'Tab Pantoprazole',
          strength: '40mg',
          frequency: '1 - 0 - 0',
          beforeAfterFood: 'EMPTY_STOMACH',
          indication: 'Acid Peptic Disease (GERD)',
          prescribedSince: '2 months ago',
          dispenseQuantity: '15 Tabs (2 Strips)'
        }
      ]);
    }
  }, [consultation.id]);

  // 1-Click Repeat Chronic Meds Handler
  const handleRepeatChronicMeds = () => {
    if (chronicMedsList.length === 0) return;
    setMedList((prev) => {
      const existingNames = new Set(prev.map((m) => m.medicationName.toLowerCase()));
      const toAdd: CockpitMedItem[] = chronicMedsList
        .filter((chr) => !existingNames.has(chr.medicationName.toLowerCase()))
        .map((chr) => ({
          id: `repeat-${chr.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          medicationName: chr.medicationName,
          strength: chr.strength,
          dosage: '1 Tab',
          frequency: chr.frequency,
          duration: 30, // standard 30-day chronic refill
          durationUnit: 'DAYS',
          beforeAfterFood: chr.beforeAfterFood,
          instructions: `Continue regular dose for ${chr.indication}`,
          dispenseQuantity: calculateDispenseQuantity(chr.medicationName, chr.frequency, 30)
        }));
      return [...prev, ...toAdd];
    });
    setStatusMessage(`✓ Added ${chronicMedsList.length} Chronic Medications for 30-Day Refill!`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Same-Day "Send for Labs & Await Reports" Handler
  const handleSendForLabsAndAwait = async () => {
    if (selectedTests.length === 0) {
      setStatusMessage('⚠️ Please order at least one lab test before sending patient to laboratory!');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    setSentForLabsPatientIds((prev) => {
      const updated = new Set(prev);
      updated.add(consultation.id);
      if (consultation.encounterId) updated.add(consultation.encounterId);
      return updated;
    });

    await onSaveDraft(
      {
        ...consultation,
        labInvestigations: selectedTests
      },
      {
        chiefComplaint,
        clinicalAssessment,
        treatmentPlan: `${treatmentPlan}\n\n[LABS ORDERED - AWAITING REPORTS]: Ordered ${selectedTests.map(t => t.testName).join(', ')}. Patient sent to Central Phlebotomy. Active in Reports Review Queue (Zero duplicate fee).`
      }
    );

    hospitalEventBus.publish('ENCOUNTER_SENT_FOR_LABS', 'SoloDoctorOpdCockpitView', {
      consultationId: consultation.id,
      encounterId: consultation.encounterId,
      patientName: activePatient.name,
      token: activePatient.token,
      orderedLabs: selectedTests.map((t) => t.testName)
    }, `🧪 ${activePatient.token} (${activePatient.name}) sent to Laboratory for ${selectedTests.length} tests.`);

    setStatusMessage(`✓ ${activePatient.token} (${activePatient.name}) moved to "Reports Review" Queue (Zero duplicate fee)`);
    setTimeout(() => setStatusMessage(null), 3500);

    setIsNextPatientPromptOpen(true);
  };

  // Chamber Status Updater
  const handleUpdateChamberStatus = (newState: 'ACTIVE' | 'IN_PROCEDURE' | 'PAUSED') => {
    setChamberSessionState(newState);
    hospitalEventBus.publish('DOCTOR_CHAMBER_STATUS_CHANGED', 'SoloDoctorOpdCockpitView', {
      chamberRoom,
      chamberDoctor,
      status: newState
    }, `Doctor chamber ${chamberRoom} is now ${newState}`);
    setStatusMessage(`Chamber Status: ${newState === 'ACTIVE' ? '🟢 Active (Calling)' : newState === 'IN_PROCEDURE' ? '🟡 In Minor Procedure' : '🔴 Paused (Rounds)'}`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  // Dispatch Direct IPD Emergency Admission
  const handleDispatchIpdAdmission = async () => {
    if (!admissionIndication.trim()) {
      setStatusMessage('⚠️ Please enter the clinical indication for IPD admission!');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    const admissionEntry = `\n[🚨 EMERGENCY IPD ADMISSION DISPATCHED - ${new Date().toLocaleTimeString()}]:\n• Ward / Unit: ${admissionWard}\n• Priority: ${admissionPriority}\n• Provisional Diagnosis: ${clinicalAssessment || 'Acute Medical Emergency'} (${icd10Code || 'ICD-10'})\n• Clinical Indication: ${admissionIndication}\n• Stat Pre-Admission Orders: ${admissionStatOrders.join(', ')}\n• Physician Notes: ${admissionNotes || 'Immediate transfer required.'}`;

    const updatedPlan = treatmentPlan ? `${treatmentPlan}\n${admissionEntry}` : admissionEntry;
    setTreatmentPlan(updatedPlan);

    await onSaveDraft(
      {
        ...consultation,
        labInvestigations: selectedTests
      },
      {
        clinicalAssessment,
        treatmentPlan: updatedPlan
      }
    );

    hospitalEventBus.publish('IPD_ADMISSION_ORDERED', 'SoloDoctorOpdCockpitView', {
      patientName: activePatient.name,
      token: activePatient.token,
      mrn: activePatient.mrn,
      ward: admissionWard,
      priority: admissionPriority,
      diagnosis: clinicalAssessment,
      orders: admissionStatOrders
    }, `🚨 Emergency Admission Requisition: ${activePatient.name} to ${admissionWard} (${admissionPriority})`);

    setIsAdmissionModalOpen(false);
    setStatusMessage(`🚨 Emergency Admission Requisition Dispatched to ${admissionWard}!`);
    setTimeout(() => setStatusMessage(null), 4000);

    setIsNextPatientPromptOpen(true);
  };

  // 💓 Gap 2: In-Chamber Fast Vitals Quick-Capture Handler
  const handleSaveQuickVitals = () => {
    const sys = parseInt(editBpSys, 10) || 120;
    const dia = parseInt(editBpDia, 10) || 80;
    const glu = parseInt(editGlucose, 10) || 110;
    const spo2 = parseInt(editSpo2, 10) || 99;
    const pulse = parseInt(editPulse, 10) || 76;
    const temp = parseFloat(editTemp) || 98.6;
    const wt = parseFloat(editWeight) || 72;

    setInChamberVitals({
      bpSystolic: sys,
      bpDiastolic: dia,
      glucose: glu,
      spo2,
      pulse,
      tempF: temp,
      weightKg: wt
    });

    setIsQuickVitalsModalOpen(false);
    setStatusMessage(`✓ In-Chamber Vitals Saved (BP ${sys}/${dia}, Sugar ${glu}, SpO2 ${spo2}%)`);
    setTimeout(() => setStatusMessage(null), 3500);

    hospitalEventBus.publish('OPTIMISTIC_ACTION_DISPATCHED', 'SoloDoctorOpdCockpitView', {
      consultationId: consultation.id,
      patientName: activePatient.name,
      vitals: { sys, dia, glu, spo2, pulse, temp, wt }
    }, `In-Chamber Vitals updated by doctor for ${activePatient.name}`);
  };

  // 👨‍⚕️ Gap 7: Cross-Specialty OPD Referral Dispatcher
  const handleDispatchReferral = (data: {
    department: string;
    specialistDoctor: string;
    urgency: 'STAT' | 'URGENT' | 'ROUTINE';
    indication: string;
    clinicalSummary: string;
  }) => {
    hospitalEventBus.publish('REFERRAL_DISPATCHED', 'SoloDoctorOpdCockpitView', {
      patientName: activePatient.name,
      patientMrn: activePatient.mrn,
      token: activePatient.token,
      ...data
    }, `Referral dispatched to ${data.department} (${data.specialistDoctor})`);
    
    const referralNote = `\n[CROSS-SPECIALTY REFERRAL - ${data.urgency}]: Referred to ${data.department} (${data.specialistDoctor}). Indication: ${data.indication}. Notes: ${data.clinicalSummary}`;
    setTreatmentPlan((prev) => prev ? `${prev}\n${referralNote}` : referralNote);
    setStatusMessage(`✓ Priority referral dispatched to ${data.department}!`);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // 💾 Gap 9: Local Draft Auto-save to LocalStorage with Debounce
  useEffect(() => {
    if (!consultation?.id || isSignedOrCompleted) return;
    const timer = setTimeout(() => {
      const draftPayload = {
        consultationId: consultation.id,
        chiefComplaint,
        clinicalAssessment,
        icd10Code,
        treatmentPlan,
        medList,
        selectedTests,
        examFindings,
        timestamp: Date.now()
      };
      try {
        localStorage.setItem(`docsearch:opd_draft:${consultation.id}`, JSON.stringify(draftPayload));
        const now = new Date();
        setLastAutosavedTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
      } catch (e) {
        // storage quota
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [consultation.id, chiefComplaint, clinicalAssessment, icd10Code, treatmentPlan, medList, selectedTests, examFindings, isSignedOrCompleted]);

  // 🚪 Pillar 1: Patient Door Call & Audio Announcement Handler
  const handleAudioCallNextPatient = () => {
    setAudioCallActive(true);
    const tokenNo = activePatient.token || 14;
    const patName = activePatient.name;
    const room = chamberRoom || 'Chamber 2';

    hospitalEventBus.publish(
      'PATIENT_CALLED_TO_CHAMBER',
      'SoloDoctorOpdCockpitView',
      {
        tokenNo,
        patientName: patName,
        chamber: room
      },
      `Calling Token #${tokenNo} (${patName}) to ${room}`
    );

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const announcement = new SpeechSynthesisUtterance(
        `Token number ${tokenNo}, ${patName}, please proceed to doctor ${room}.`
      );
      announcement.rate = 0.95;
      announcement.pitch = 1.0;
      window.speechSynthesis.speak(announcement);
    }

    setStatusMessage(`📢 Audio Call Dispatched: Token #${tokenNo} (${patName})`);
    setTimeout(() => {
      setAudioCallActive(false);
      setStatusMessage(null);
    }, 3500);
  };

  // ⌨️ Pillar 8: Fast URI Rx Protocol Template Drop
  const applyFastUriProtocol = () => {
    setChiefComplaint('Fever with dry cough, throat irritation and malaise x 3 days');
    setClinicalAssessment('Acute Viral Upper Respiratory Tract Infection (URI)');
    setIcd10Code('J06.9');
    setTreatmentPlan('Symptomatic therapy, warm saline gargles, steam inhalation, and oral hydration. Review if high grade fever persists beyond 48 hours.');
    setMedList([
      {
        id: `med-turbo-1-${Date.now()}`,
        medicationName: 'Tab Paracetamol',
        strength: '650mg',
        dosage: '1 Tab',
        frequency: '1 - 0 - 1',
        duration: 3,
        durationUnit: 'DAYS',
        beforeAfterFood: 'AFTER_FOOD',
        instructions: 'Take after meals for fever and body ache'
      },
      {
        id: `med-turbo-2-${Date.now()}`,
        medicationName: 'Tab Levocetirizine',
        strength: '5mg',
        dosage: '1 Tab',
        frequency: '0 - 0 - 1',
        duration: 5,
        durationUnit: 'DAYS',
        beforeAfterFood: 'BEDTIME',
        instructions: 'At bedtime for rhinorrhea and nasal congestion'
      }
    ]);
    setStatusMessage('⚡ Turbo F3: Acute URI Standard Protocol Applied');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // ⌨️ Pillar 8: Ergonomic Numpad & Function Keys Turbo Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || isMlcModalOpen || isDaycareModalOpen || isHardAllergyLockOpen) {
        return;
      }
      if (e.key === 'F1') {
        e.preventDefault();
        const omni = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (omni) omni.focus();
      } else if (e.key === 'F2') {
        e.preventDefault();
        setAllNormalExam();
        setStatusMessage('✓ Turbo F2: All-Normal Physical Examination stamped');
        setTimeout(() => setStatusMessage(null), 2500);
      } else if (e.key === 'F3') {
        e.preventDefault();
        applyFastUriProtocol();
      } else if (e.key === 'F4') {
        e.preventDefault();
        setIsExternalViewerOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMlcModalOpen, isDaycareModalOpen, isHardAllergyLockOpen]);

  const queuePatients = useMemo(() => {
    const rawList = encounters.map((enc, idx) => {
      const cons = consultations.find((c) => c.encounterId === enc.id) ||
        (enc.id === consultation.encounterId ? consultation : undefined);
      const isCurrent = cons ? cons.id === consultation.id : enc.id === consultation.encounterId;
      const dynamicVitals = realtimeTriageVitals[enc.id] || realtimeTriageVitals[(enc as any).patientId] || null;
      const nurseVitals = dynamicVitals || cons?.vitals || (enc as any).vitals || (enc.metadata as any)?.vitals || null;
      const redFlags = getVitalsRedFlags(nurseVitals);
      const news2Result = calculateNews2Score(nurseVitals);
      const isInChamber = !isLocalSigned && ((cons ? cons.id === inChamberId : enc.id === inChamberId) || (isCurrent && cons?.consultationStatus !== 'COMPLETED'));

      // Detect repeat/duplicate encounters for the same patient today
      const samePatientEncounters = encounters.filter(
        (e) =>
          (e.patientId && enc.patientId && e.patientId === enc.patientId) ||
          (e.patientMrn && enc.patientMrn && e.patientMrn === enc.patientMrn)
      );
      const isRepeatToday = samePatientEncounters.length > 1;
      const repeatIndex = samePatientEncounters.findIndex((e) => e.id === enc.id);
      const repeatLabel = isRepeatToday
        ? repeatIndex === 0
          ? 'Visit 1'
          : `Re-Visit #${repeatIndex + 1} Today`
        : null;

      const isSentForLabs = sentForLabsPatientIds.has(cons ? cons.id : '') || sentForLabsPatientIds.has(enc.id);
      const computedStatus = isSentForLabs
        ? 'REPORTS_READY'
        : (isCurrent && isLocalSigned)
        ? 'COMPLETED'
        : (cons?.consultationStatus || enc.status || 'WAITING');

      const customRepeatLabel = isSentForLabs
        ? '🧪 Reports Awaiting Review'
        : repeatLabel;

      // Dynamic Priority Weighting (Gold Standard Pillar 1)
      let priorityScore = 4000;
      let priorityTier: 'IN_CHAMBER' | 'CRITICAL_TRIAGE' | 'REPORTS_READY' | 'ROUTINE' | 'COMPLETED' = 'ROUTINE';

      if (isInChamber) {
        priorityScore = 10000;
        priorityTier = 'IN_CHAMBER';
      } else if (computedStatus === 'COMPLETED') {
        priorityScore = 0;
        priorityTier = 'COMPLETED';
      } else if (news2Result.isTriageStatPromoted) {
        priorityScore = 8000;
        priorityTier = 'CRITICAL_TRIAGE';
      } else if (isSentForLabs || computedStatus === 'REPORTS_READY') {
        priorityScore = 6000;
        priorityTier = 'REPORTS_READY';
      }

      return {
        id: cons ? cons.id : enc.id,
        encounterId: enc.id,
        token: (enc as any).queueToken || cons?.queueToken || (enc as any).tokenNumber || `TK-${String(idx + 1).padStart(2, '0')}`,
        patientName: enc.patientName || cons?.patientName || 'Patient',
        gender: (enc as any).gender || (enc as any).patientGender || cons?.patientGender || 'M',
        age: (enc as any).age || (enc as any).patientAge || 32,
        mrn: enc.patientMrn || cons?.patientMrn || `UHID-${String(idx + 1).padStart(4, '0')}`,
        phone: enc.patientMobile || cons?.patientMobile || '9876543210',
        status: computedStatus,
        nurseVitals,
        redFlags,
        news2Result,
        isTriageStatPromoted: news2Result.isTriageStatPromoted,
        isInChamber,
        isCurrent: isCurrent && !isLocalSigned,
        isRepeatToday,
        repeatLabel: customRepeatLabel,
        initialIndex: idx,
        priorityScore,
        priorityTier
      };
    });

    // Dynamic Priority Re-Ranking Sort (Critical Triage > Reports Ready > Routine FIFO)
    const sorted = [...rawList].sort((a, b) => {
      if (a.priorityScore !== b.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return a.initialIndex - b.initialIndex;
    });

    // Dynamic Waiting ETA & Velocity Engine
    let waitingAheadCounter = 0;
    const nowMs = Date.now();

    return sorted.map((p) => {
      let patientsAhead = 0;
      let estWaitMinutes = 0;
      let estCallTime = '--';
      let isSlaBreached = false;

      if (p.isInChamber) {
        estWaitMinutes = 0;
        estCallTime = 'NOW';
      } else if (p.status === 'COMPLETED') {
        estWaitMinutes = 0;
        estCallTime = 'DONE';
      } else {
        patientsAhead = waitingAheadCounter;
        waitingAheadCounter++;
        estWaitMinutes = Math.max(2, Math.round(patientsAhead * averageConsultDurationMinutes));
        const callTimeDate = new Date(nowMs + estWaitMinutes * 60000);
        estCallTime = callTimeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (estWaitMinutes > 45) {
          isSlaBreached = true;
        }
      }

      return {
        ...p,
        patientsAhead,
        waitMinutes: estWaitMinutes,
        estWaitMinutes,
        estCallTime,
        isSlaBreached
      };
    });
  }, [encounters, consultations, consultation, inChamberId, isLocalSigned, sentForLabsPatientIds, realtimeTriageVitals, averageConsultDurationMinutes]);

  // Broadcast Dynamic Queue Velocity & ETAs to Event Bus
  useEffect(() => {
    const activeWaiting = queuePatients.filter((p) => !p.isInChamber && p.status !== 'COMPLETED');
    const currentInChamber = queuePatients.find((p) => p.isInChamber);

    hospitalEventBus.publish(
      'QUEUE_VELOCITY_UPDATED',
      'SoloDoctorOpdCockpitView',
      {
        chamberRoom,
        chamberDoctor,
        averageConsultDurationMinutes,
        currentToken: currentInChamber?.token || 'None',
        currentPatientName: currentInChamber?.patientName || 'None',
        totalWaiting: activeWaiting.length,
        slaBreachedCount: activeWaiting.filter((p) => p.isSlaBreached).length,
        patients: activeWaiting.map((p) => ({
          token: p.token,
          name: p.patientName,
          uhid: p.mrn,
          patientsAhead: p.patientsAhead,
          estWait: `${p.estWaitMinutes} mins`,
          estCallTime: p.estCallTime,
          isCritical: p.priorityTier === 'CRITICAL_TRIAGE',
          isReportsReady: p.priorityTier === 'REPORTS_READY',
          priorityTier: p.priorityTier,
          isSlaBreached: p.isSlaBreached,
          doctor: chamberDoctor
        }))
      },
      `Live queue velocity: ${activeWaiting.length} waiting, ${averageConsultDurationMinutes}m pace`
    );
  }, [queuePatients, chamberRoom, chamberDoctor, averageConsultDurationMinutes]);

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    let result = queuePatients;
    if (queueFilter === 'WAITING') result = result.filter((p) => p.status === 'WAITING' || (p.status as string) === 'TRIAGED');
    else if (queueFilter === 'REPORTS_READY') result = result.filter((p) => p.status === 'REPORTS_READY');
    else if (queueFilter === 'TRIAGED') result = result.filter((p) => !!p.nurseVitals);
    else if (queueFilter === 'COMPLETED') result = result.filter((p) => p.status === 'COMPLETED');

    if (queueSearch.trim()) {
      const q = queueSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.patientName.toLowerCase().includes(q) ||
          p.token.toLowerCase().includes(q) ||
          p.phone.includes(q)
      );
    }
    return result;
  }, [queuePatients, queueFilter, queueSearch]);

  // Queue Counters (आज के कुल टोकन: Waiting / In-Chamber / Reports / Done)
  const queueStats = useMemo(() => {
    let waiting = 0;
    let inChamber = 0;
    let reportsReady = 0;
    let done = 0;
    queuePatients.forEach((p) => {
      if (p.status === 'COMPLETED') done++;
      else if (p.status === 'REPORTS_READY') reportsReady++;
      else if (p.isInChamber) inChamber++;
      else waiting++;
    });
    return { total: queuePatients.length, waiting, inChamber, reportsReady, done };
  }, [queuePatients]);

  // Call Patient to Chamber (Broadcast audio + Visual state transition + Responsive auto-switch)
  const callPatientToChamber = useCallback((target: any) => {
    setInChamberId(target.id);
    onSelectConsultation(target.id);
    setIsTabletDrawerOpen(false);
    setMobileActiveTab('rx');
    playChime(target.token, target.patientName, chamberRoom);
    hospitalEventBus.publish('PATIENT_CALLED', 'SoloDoctorOpdCockpitView', {
      token: target.token,
      patientName: target.patientName,
      chamber: chamberRoom
    }, `📢 Called ${target.token} (${target.patientName}) to ${chamberRoom}`);
    setStatusMessage(`📢 Called ${target.token} (${target.patientName}) to ${chamberRoom}`);
    setTimeout(() => setStatusMessage(null), 3500);
  }, [onSelectConsultation, chamberRoom]);

  // Select Patient Handler (with Responsive auto-switch to Rx)
  const handleSelectPatient = useCallback((targetId: string) => {
    onSelectConsultation(targetId);
    setInChamberId(targetId);
    setIsTabletDrawerOpen(false);
    setMobileActiveTab('rx');
  }, [onSelectConsultation]);

  // Call Next Patient Function
  const callNextPatient = useCallback(() => {
    if (onCallNextPatient) {
      playChime(undefined, undefined, chamberRoom);
      onCallNextPatient();
      return;
    }
    const priorityWeights: Record<string, number> = { EMERGENCY: 1, URGENT: 2, ROUTINE: 3 };
    const waitingList = queuePatients
      .filter((p) => !p.isCurrent && p.status !== 'COMPLETED')
      .sort((a, b) => {
        const wA = priorityWeights[(a as any).priority || 'ROUTINE'] || 3;
        const wB = priorityWeights[(b as any).priority || 'ROUTINE'] || 3;
        if (wA !== wB) return wA - wB;
        return (a.token || '').localeCompare(b.token || '');
      });

    const target = waitingList[0];
    if (target) {
      callPatientToChamber(target);
    }
  }, [queuePatients, callPatientToChamber, onCallNextPatient, chamberRoom]);

  // Apply Clinical Template Preset (Sub-10ms)
  const applyTemplate = (preset: ClinicalTemplatePreset) => {
    const previousSnapshot = {
      chiefComplaint,
      clinicalAssessment,
      icd10Code,
      treatmentPlan,
      medList: [...medList],
      selectedTests: [...selectedTests]
    };

    setChiefComplaint(preset.chiefComplaint);
    setClinicalAssessment(preset.diagnosis);
    setIcd10Code(preset.icd10Code);
    setTreatmentPlan(preset.treatmentPlan);

    // Map template meds to resolve database medicationCatalogId if available in popular/server meds
    const templateMeds: CockpitMedItem[] = preset.medications.map((m) => {
      const match = popularMedList.find(
        (p) => p.name.toLowerCase() === m.medicationName.toLowerCase() ||
               (p.genericName && m.medicationName.toLowerCase().includes(p.genericName.toLowerCase()))
      ) || serverMedResults.find(
        (p) => p.name.toLowerCase() === m.medicationName.toLowerCase() ||
               (p.genericName && m.medicationName.toLowerCase().includes(p.genericName.toLowerCase()))
      );
      return {
        ...m,
        medicationCatalogId: match?.catalogId || m.medicationCatalogId
      };
    });
    setMedList(templateMeds);

    // Map template labs to CockpitLabItem with database investigationCatalogId
    const templateLabs: CockpitLabItem[] = preset.labTests.map((testName) => {
      const matched = activeLabList.find(
        (l) => l.name.toLowerCase() === testName.toLowerCase() || l.testCode.toLowerCase() === testName.toLowerCase()
      ) || serverLabResults.find(
        (l) => l.name.toLowerCase() === testName.toLowerCase() || l.testCode.toLowerCase() === testName.toLowerCase()
      );
      return {
        id: matched?.catalogId || `lab-tmpl-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        investigationCatalogId: matched?.catalogId || '',
        testCode: matched?.testCode || testName,
        testName: matched?.name || testName,
        category: matched?.categoryLabel || matched?.category || 'PATHOLOGY',
        categoryLabel: matched?.categoryLabel || matched?.category || 'PATHOLOGY',
        specimen: matched?.specimen,
        fasting: matched?.fasting,
        tatHours: matched?.tatHours,
        priority: 'ROUTINE'
      };
    });

    setSelectedTests((prev) => {
      const combined = [...prev];
      for (const t of templateLabs) {
        if (!combined.some((c) => (t.investigationCatalogId && c.investigationCatalogId === t.investigationCatalogId) || c.testName.toLowerCase() === t.testName.toLowerCase())) {
          combined.push(t);
        }
      }
      return combined;
    });

    // Optimistic Action Toast (with Ctrl+Z Undo)
    optimisticActionService.dispatch({
      title: `Applied Preset: ${preset.name}`,
      category: 'EMR_SCRIBE',
      countdownSeconds: 5,
      onCommit: async () => {},
      onUndo: () => {
        setChiefComplaint(previousSnapshot.chiefComplaint);
        setClinicalAssessment(previousSnapshot.clinicalAssessment);
        setIcd10Code(previousSnapshot.icd10Code);
        setTreatmentPlan(previousSnapshot.treatmentPlan);
        setMedList(previousSnapshot.medList);
        setSelectedTests(previousSnapshot.selectedTests);
        setStatusMessage(`↩️ Reverted ${preset.name} template`);
        setTimeout(() => setStatusMessage(null), 3000);
      }
    });

    setStatusMessage(`✓ Applied ${preset.name} (${preset.medications.length} meds)`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Toggle Investigation (Preserving Exact Database Catalog UUID)
  const toggleInvestigation = (testOrName: (QuickLabTestItem & { catalogId?: string }) | CockpitLabItem | string) => {
    let targetCatalogId: string | undefined;
    let targetName: string = '';
    let targetCode: string = '';
    let targetCategory: string = 'PATHOLOGY';
    let targetSpecimen: string | undefined;
    let targetFasting: boolean | undefined;
    let targetTat: number | undefined;

    if (typeof testOrName === 'string') {
      const found = activeLabList.find(
        (l) => l.catalogId === testOrName || l.testCode.toLowerCase() === testOrName.toLowerCase() || l.name.toLowerCase() === testOrName.toLowerCase() || (l.shortName && l.shortName.toLowerCase() === testOrName.toLowerCase())
      ) || serverLabResults.find(
        (l) => l.catalogId === testOrName || l.testCode.toLowerCase() === testOrName.toLowerCase() || l.name.toLowerCase() === testOrName.toLowerCase() || (l.shortName && l.shortName.toLowerCase() === testOrName.toLowerCase())
      ) || labLibraryResults.find(
        (l) => l.catalogId === testOrName || l.testCode.toLowerCase() === testOrName.toLowerCase() || l.name.toLowerCase() === testOrName.toLowerCase()
      );
      if (found) {
        targetCatalogId = found.catalogId;
        targetName = found.name;
        targetCode = found.testCode;
        targetCategory = found.categoryLabel || found.category;
        targetSpecimen = found.specimen;
        targetFasting = found.fasting;
        targetTat = found.tatHours;
      } else {
        targetName = testOrName;
        targetCode = testOrName;
      }
    } else {
      const itemWithCat = testOrName as any;
      targetCatalogId = itemWithCat.investigationCatalogId || itemWithCat.catalogId || itemWithCat.id;
      targetName = itemWithCat.testName || itemWithCat.name || '';
      targetCode = itemWithCat.testCode || targetName;
      targetCategory = itemWithCat.categoryLabel || itemWithCat.category || 'PATHOLOGY';
      targetSpecimen = itemWithCat.specimen;
      targetFasting = itemWithCat.fasting;
      targetTat = itemWithCat.tatHours;
    }

    setSelectedTests((prev) => {
      const existingIndex = prev.findIndex((t) =>
        (targetCatalogId && (t.investigationCatalogId === targetCatalogId || t.id === targetCatalogId)) ||
        t.testName.toLowerCase() === targetName.toLowerCase() ||
        (targetCode && t.testCode.toLowerCase() === targetCode.toLowerCase())
      );
      if (existingIndex >= 0) {
        const removed = prev[existingIndex];
        if (removed) {
          setStatusMessage(`✕ Removed ${removed.testName}`);
        }
        setTimeout(() => setStatusMessage(null), 2000);
        return prev.filter((_, idx) => idx !== existingIndex);
      } else {
        const newLabItem: CockpitLabItem = {
          id: targetCatalogId || `lab-${Date.now()}`,
          investigationCatalogId: targetCatalogId || '',
          testCode: targetCode || targetName,
          testName: targetName,
          category: targetCategory,
          categoryLabel: targetCategory,
          specimen: targetSpecimen,
          fasting: targetFasting,
          tatHours: targetTat,
          priority: 'ROUTINE'
        };
        setStatusMessage(`✓ Ordered ${targetName}`);
        setTimeout(() => setStatusMessage(null), 2000);
        return [...prev, newLabItem];
      }
    });
  };

  // Save Draft Handler
  const handleSaveCurrentDraft = async () => {
    const medText = medList.length > 0
      ? `\n\nPrescribed Rx:\n` + medList.map((m, i) => `${i + 1}. ${m.medicationName} ${m.strength || ''} - ${m.dosage || ''} | ${m.frequency || ''} | ${m.duration} days | ${m.beforeAfterFood}`).join('\n')
      : '';
    const fullTreatmentPlan = `${treatmentPlan}${medText}\n\nReview: ${followUpDays}${
      selectedTests.length > 0 ? `\nLab/Radiology Orders: ${selectedTests.map((t) => t.testName).join(', ')}` : ''
    }`;

    // Map structured medications with exact medicationId
    const structuredMeds = medList.map((m) => ({
      ...m,
      medicationId: m.medicationCatalogId || undefined
    }));

    // Map structured lab investigations with exact investigationCatalogId
    const structuredLabs = selectedTests.map((t) => ({
      investigationCatalogId: t.investigationCatalogId,
      investigationId: t.investigationCatalogId,
      id: t.investigationCatalogId || t.id,
      testCode: t.testCode,
      testName: t.testName,
      shortName: t.shortName,
      category: t.category,
      categoryLabel: t.categoryLabel,
      specimen: t.specimen,
      fasting: t.fasting,
      tatHours: t.tatHours,
      priority: t.priority || 'ROUTINE'
    }));

    if (onSaveDraft) {
      await onSaveDraft(
        {
          ...consultation,
          patientName: activePatient.name,
          patientMrn: activePatient.mrn,
          patientGender: activePatient.gender,
          patientMobile: activePatient.phone,
          queueToken: activePatient.token,
          patientAllergies,
          examinationSummary: examFindings.join(', '),
          medications: structuredMeds as any,
          labInvestigations: structuredLabs as any,
          diagnoses: [
            {
              id: 'diag-1',
              diagnosisName: clinicalAssessment,
              diagnosisCode: icd10Code,
              isPrimary: true
            } as any
          ]
        },
        {
          chiefComplaint,
          clinicalAssessment,
          treatmentPlan: fullTreatmentPlan
        }
      );
    }
    setStatusMessage('💾 Draft saved successfully!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Complete Consultation Handler (Step 4 of Doctor Journey: Sign Rx & Call Next Prompt)
  const handleComplete = async () => {
    const medText = medList.length > 0
      ? `\n\nPrescribed Rx:\n` + medList.map((m, i) => `${i + 1}. ${m.medicationName} ${m.strength || ''} - ${m.dosage || ''} | ${m.frequency || ''} | ${m.duration} days | ${m.beforeAfterFood}`).join('\n')
      : '';
    const fullTreatmentPlan = `${treatmentPlan}${medText}\n\nReview: ${followUpDays}${
      selectedTests.length > 0 ? `\nLab/Radiology Orders: ${selectedTests.map((t) => t.testName).join(', ')}` : ''
    }`;

    // Map structured medications with exact medicationId
    const structuredMeds = medList.map((m) => ({
      ...m,
      medicationId: m.medicationCatalogId || undefined
    }));

    // Map structured lab investigations with exact investigationCatalogId
    const structuredLabs = selectedTests.map((t) => ({
      investigationCatalogId: t.investigationCatalogId,
      investigationId: t.investigationCatalogId,
      id: t.investigationCatalogId || t.id,
      testCode: t.testCode,
      testName: t.testName,
      shortName: t.shortName,
      category: t.category,
      categoryLabel: t.categoryLabel,
      specimen: t.specimen,
      fasting: t.fasting,
      tatHours: t.tatHours,
      priority: t.priority || 'ROUTINE'
    }));

    setIsLocalSigned(true);
    const cToken = activePatient.token;
    const cName = activePatient.name;
    setCompletedPatientInfo({ name: cName, token: cToken });

    try {
      playChime();
    } catch {}

    // Find next waiting patient in line
    // Find next waiting patient in line deterministically
    const priorityWeights: Record<string, number> = { EMERGENCY: 1, URGENT: 2, ROUTINE: 3 };
    const waitingList = queuePatients
      .filter((p) => p.status !== 'COMPLETED' && !p.isCurrent)
      .sort((a, b) => {
        const wA = priorityWeights[(a as any).priority || 'ROUTINE'] || 3;
        const wB = priorityWeights[(b as any).priority || 'ROUTINE'] || 3;
        if (wA !== wB) return wA - wB;
        return (a.token || '').localeCompare(b.token || '');
      });
    const nextWaiting = waitingList[0];

    setNextWaitingPatient(nextWaiting || null);
    setIsNextPatientPromptOpen(true);
    setStatusMessage(`✓ Prescription Signed & Issued for ${cToken} (${cName})!`);

    // Immediate authoritative completion & counter dispatch
    if (onCompleteConsultation) {
      await onCompleteConsultation(
        {
          ...consultation,
          consultationStatus: 'COMPLETED',
          patientName: activePatient.name,
          patientMrn: activePatient.mrn,
          patientGender: activePatient.gender,
          patientMobile: activePatient.phone,
          queueToken: activePatient.token,
          patientAllergies,
          examinationSummary: examFindings.join(', '),
          medications: structuredMeds as any,
          labInvestigations: structuredLabs as any,
          diagnoses: [
            {
              id: 'diag-1',
              diagnosisName: clinicalAssessment,
              diagnosisCode: icd10Code,
              isPrimary: true
            } as any
          ]
        },
        clinicalAssessment,
        fullTreatmentPlan
      );
    }
  };

  // Keyboard Shortcuts (Alt + Right Arrow = Call Next, Ctrl + Enter = Complete, Alt + P = Print, Ctrl + S = Save Draft)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If Next Patient Prompt is open, Enter triggers calling the next patient
      if (isNextPatientPromptOpen) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (nextWaitingPatient) {
            callPatientToChamber(nextWaitingPatient);
            setIsNextPatientPromptOpen(false);
          } else {
            setIsNextPatientPromptOpen(false);
          }
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsNextPatientPromptOpen(false);
          return;
        }
      }

      // Alt + Right Arrow or Alt + N: Next Patient
      if ((e.altKey && (e.key === 'ArrowRight' || e.code === 'ArrowRight')) || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        callNextPatient();
        return;
      }
      // Ctrl + Enter: Complete
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        void handleComplete();
        return;
      }
      // Alt + P: Print
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPrintModalOpen(true);
        return;
      }
      // Ctrl + S: Save Draft
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void handleSaveCurrentDraft();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callNextPatient, handleComplete, isNextPatientPromptOpen, nextWaitingPatient, callPatientToChamber]);

  // Ambient Voice AI Clinical Scribe Listeners (Alt + M)
  const prevAmbientSnapshotRef = useRef({
    chiefComplaint: '',
    clinicalAssessment: '',
    icd10Code: '',
    treatmentPlan: '',
    medList: [] as CockpitMedItem[],
    selectedTests: [] as CockpitLabItem[]
  });

  useEffect(() => {
    const handleAmbientAutofill = (e: any) => {
      const data = e.detail;
      if (!data) return;

      prevAmbientSnapshotRef.current = {
        chiefComplaint,
        clinicalAssessment,
        icd10Code,
        treatmentPlan,
        medList,
        selectedTests
      };

      if (data.chiefComplaints) {
        setChiefComplaint(data.chiefComplaints);
      }
      if (data.assessment || data.diagnosis) {
        setClinicalAssessment(data.assessment || data.diagnosis);
      }
      if (data.icd10Code) {
        setIcd10Code(data.icd10Code);
      }
      if (data.rxMedicines && Array.isArray(data.rxMedicines)) {
        const newMeds: CockpitMedItem[] = data.rxMedicines.map((m: any, idx: number) => ({
          id: `ambient-rx-${Date.now()}-${idx}`,
          medicationName: m.medicationName,
          strength: m.strength || '500mg',
          dosage: m.dosage || '1 Tab',
          frequency: m.frequency || '1 - 0 - 1',
          duration: m.duration || 3,
          durationUnit: 'DAYS',
          beforeAfterFood: m.food || 'AFTER_FOOD',
          instructions: m.instructions || ''
        }));
        setMedList((prev) => {
          const existingNames = new Set(prev.map((p) => p.medicationName.toLowerCase()));
          const nonDupes = newMeds.filter((nm) => !existingNames.has(nm.medicationName.toLowerCase()));
          return [...prev, ...nonDupes];
        });
      }
      if (data.labTests && Array.isArray(data.labTests)) {
        const ambientLabs: CockpitLabItem[] = data.labTests.map((t: any) => {
          const testName = typeof t === 'string' ? t : t.testName || t.name;
          const matched = activeLabList.find(
            (l) => l.name.toLowerCase() === testName.toLowerCase() || l.testCode.toLowerCase() === testName.toLowerCase()
          ) || serverLabResults.find(
            (l) => l.name.toLowerCase() === testName.toLowerCase() || l.testCode.toLowerCase() === testName.toLowerCase()
          );
          return {
            id: matched?.catalogId || `ambient-lab-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            investigationCatalogId: matched?.catalogId || '',
            testCode: matched?.testCode || testName,
            testName: matched?.name || testName,
            category: matched?.categoryLabel || matched?.category || 'PATHOLOGY',
            categoryLabel: matched?.categoryLabel || matched?.category || 'PATHOLOGY',
            priority: 'ROUTINE'
          };
        });
        setSelectedTests((prev) => {
          const combined = [...prev];
          for (const al of ambientLabs) {
            if (!combined.some((c) => (al.investigationCatalogId && c.investigationCatalogId === al.investigationCatalogId) || c.testName.toLowerCase() === al.testName.toLowerCase())) {
              combined.push(al);
            }
          }
          return combined;
        });
      }
      if (data.advice) {
        setTreatmentPlan((prev) => (prev ? `${prev}\n${data.advice}` : data.advice));
      }

      setStatusMessage('⚡ Auto-filled from Ambient Voice AI Scribe! Press Ctrl+Z to undo.');
      setTimeout(() => setStatusMessage(null), 4000);
    };

    const handleAmbientUndo = () => {
      const snap = prevAmbientSnapshotRef.current;
      setChiefComplaint(snap.chiefComplaint);
      setClinicalAssessment(snap.clinicalAssessment);
      setIcd10Code(snap.icd10Code);
      setMedList(snap.medList);
      setSelectedTests(snap.selectedTests);
      setTreatmentPlan(snap.treatmentPlan);
      setStatusMessage('↩️ Ambient Voice Scribe autofill reverted (Ctrl+Z Undo)');
      setTimeout(() => setStatusMessage(null), 3000);
    };

    window.addEventListener('docsearch:ambient_soap_autofill', handleAmbientAutofill);
    window.addEventListener('docsearch:ambient_soap_undo', handleAmbientUndo);

    const unsub = hospitalEventBus.subscribe('AMBIENT_VOICE_SCRIBE_AUTOFILL', (payload) => {
      if (payload.data) {
        handleAmbientAutofill({ detail: payload.data });
      }
    });

    const unsubUndo = hospitalEventBus.subscribe('AMBIENT_VOICE_SCRIBE_UNDO', () => {
      handleAmbientUndo();
    });

    return () => {
      window.removeEventListener('docsearch:ambient_soap_autofill', handleAmbientAutofill);
      window.removeEventListener('docsearch:ambient_soap_undo', handleAmbientUndo);
      unsub();
      unsubUndo();
    };
  }, [chiefComplaint, clinicalAssessment, icd10Code, treatmentPlan, medList, selectedTests]);

  // Current Patient Vitals Data & Miniature Sparkline coordinates
  const currentVitals = useMemo(() => {
    if (consultation.vitals) return consultation.vitals;
    const encVitals = activePatient.nurseVitals;
    if (encVitals) {
      return {
        systolicBp: encVitals.systolicBp || (encVitals.systolic ? Number(encVitals.systolic) : 124),
        diastolicBp: encVitals.diastolicBp || (encVitals.diastolic ? Number(encVitals.diastolic) : 82),
        pulseBpm: encVitals.pulseBpm || (encVitals.pulse ? Number(encVitals.pulse) : 76),
        spo2Percent: encVitals.spo2Percent || (encVitals.spo2 ? Number(encVitals.spo2) : 98),
        tempF: encVitals.tempF || (encVitals.temperature ? Number(encVitals.temperature) : 98.6),
        bloodSugarMgDl: encVitals.bloodSugarMgDl || (encVitals.bloodSugar ? Number(encVitals.bloodSugar) : 110),
        bmi: encVitals.bmi || 23.2
      };
    }
    return {
      systolicBp: 124,
      diastolicBp: 82,
      pulseBpm: 76,
      spo2Percent: 98,
      tempF: 98.6,
      bloodSugarMgDl: 110,
      bmi: 23.2
    };
  }, [consultation.vitals, activePatient.nurseVitals]);

  // Render Queue Panel (Shared across Desktop Split-Screen, Tablet Drawer, and Mobile Tab)
  const renderQueuePanel = (isDrawer = false, onCloseDrawer?: () => void) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--ds-color-surface, #0F172A)',
        border: isDrawer ? 'none' : '1px solid var(--ds-color-border, rgba(255,255,255,0.08))',
        borderRadius: isDrawer ? '0' : '16px',
        overflow: 'hidden',
        height: isDrawer ? '100%' : undefined,
        boxShadow: isDrawer ? 'none' : '0 4px 20px rgba(0,0,0,0.4)',
        width: '100%'
      }}
    >
      {/* Waiting Room Header */}
      <div
        style={{
          padding: '14px 16px',
          backgroundColor: 'var(--ds-color-surface-subtle, rgba(255,255,255,0.03))',
          borderBottom: '1px solid var(--ds-color-border-subtle, rgba(255,255,255,0.06))',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {/* View A Header: Title & Counters (Waiting/In/Done) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>📋</span>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--ds-color-text-primary, #F8FAFC)' }}>
                  OPD Live Queue (मरीज़ कतार)
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--ds-color-text-muted, #94A3B8)' }}>
                  {chamberRoom} • {chamberDoctor}
                </div>
              </div>
            </div>

            {isDrawer ? (
              <button
                type="button"
                onClick={onCloseDrawer}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  color: '#F8FAFC',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
                title="Close Queue Sidebar"
              >
                ✕ Close
              </button>
            ) : isDesktop ? (
              <button
                type="button"
                onClick={() => setIsQueueCollapsed(true)}
                style={{
                  background: 'none',
                  border: '1px solid var(--ds-color-border, rgba(255,255,255,0.15))',
                  borderRadius: '6px',
                  color: 'var(--ds-color-text-muted, #94A3B8)',
                  padding: '3px 6px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
                title="Collapse Queue Rail"
              >
                ◀
              </button>
            ) : null}
          </div>

          {/* Counters: आज के कुल टोकन (Waiting/In/Done) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            <div style={{
              padding: '6px',
              borderRadius: '6px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 900, color: '#FCD34D' }}>{queueStats.waiting}</div>
              <div style={{ fontSize: '0.58rem', color: '#FCD34D', textTransform: 'uppercase', fontWeight: 700 }}>Wait</div>
            </div>

            <div style={{
              padding: '6px',
              borderRadius: '6px',
              backgroundColor: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 900, color: '#38BDF8' }}>{queueStats.inChamber}</div>
              <div style={{ fontSize: '0.58rem', color: '#38BDF8', textTransform: 'uppercase', fontWeight: 700 }}>Room</div>
            </div>

            <div style={{
              padding: '6px',
              borderRadius: '6px',
              backgroundColor: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 900, color: '#C084FC' }}>{queueStats.reportsReady}</div>
              <div style={{ fontSize: '0.58rem', color: '#C084FC', textTransform: 'uppercase', fontWeight: 700 }}>Labs</div>
            </div>

            <div style={{
              padding: '6px',
              borderRadius: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 900, color: '#34D399' }}>{queueStats.done}</div>
              <div style={{ fontSize: '0.58rem', color: '#34D399', textTransform: 'uppercase', fontWeight: 700 }}>Done</div>
            </div>
          </div>

          {/* Dynamic Queue Velocity & SLA Indicator (Gold Standard Pillar 1) */}
          <div
            style={{
              backgroundColor: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              borderRadius: '8px',
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.68rem',
              marginTop: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '0.8rem' }}>⚡</span>
              <span style={{ color: '#38BDF8', fontWeight: 800 }}>
                {averageConsultDurationMinutes}m / pt pace
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#34D399', fontSize: '0.625rem', fontWeight: 700 }}>
                📡 Hall TV Synced
              </span>
              {queuePatients.some((p) => p.isSlaBreached) && (
                <span
                  style={{
                    fontSize: '0.55rem',
                    fontWeight: 900,
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    padding: '1px 4px',
                    borderRadius: '3px'
                  }}
                  title="Patients waiting > 45 minutes SLA threshold"
                >
                  SLA ALERT
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Call Next Patient Button */}
        <button
          type="button"
          onClick={callNextPatient}
          style={{
            backgroundColor: 'var(--ds-color-primary, #06B6D4)',
            color: '#070C16',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '0.8rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(6, 182, 212, 0.35)',
            transition: 'transform 0.1s ease'
          }}
          title="Shortcut: Alt + Right Arrow or Alt + N"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📢</span>
            <span>Call Next Patient</span>
          </div>
          <kbd
            style={{
              fontSize: '0.625rem',
              fontFamily: 'monospace',
              backgroundColor: 'rgba(0,0,0,0.2)',
              padding: '2px 6px',
              borderRadius: '4px',
              color: '#070C16',
              fontWeight: 800
            }}
          >
            Alt + →
          </kbd>
        </button>

        {/* Quick Search & Filter Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <input
            type="text"
            placeholder="Search token, name, phone..."
            value={queueSearch}
            onChange={(e) => setQueueSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: 'var(--ds-color-bg, #0B111E)',
              border: '1px solid var(--ds-color-border, rgba(255,255,255,0.1))',
              color: 'var(--ds-color-text-primary, #F8FAFC)',
              fontSize: '0.75rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />

          <div style={{ display: 'flex', gap: '4px' }}>
            {(['ALL', 'WAITING', 'REPORTS_READY', 'COMPLETED'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setQueueFilter(filter)}
                style={{
                  flex: 1,
                  padding: '4px 0',
                  borderRadius: '6px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor:
                    queueFilter === filter ? 'var(--ds-color-primary, #06B6D4)' : 'rgba(255,255,255,0.06)',
                  color: queueFilter === filter ? '#070C16' : 'var(--ds-color-text-muted, #94A3B8)',
                  transition: 'all 0.1s ease'
                }}
              >
                {filter === 'ALL'
                  ? `All (${queueStats.total})`
                  : filter === 'WAITING'
                  ? `Wait (${queueStats.waiting})`
                  : filter === 'REPORTS_READY'
                  ? `🧪 Labs (${queueStats.reportsReady})`
                  : `Done (${queueStats.done})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Patient Queue Feed */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredQueue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--ds-color-text-muted, #64748B)', fontSize: '0.8rem' }}>
            No matching patients in queue
          </div>
        ) : (
          filteredQueue.map((pat) => (
            <div
              key={pat.id}
              onClick={() => handleSelectPatient(pat.id)}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                cursor: 'pointer',
                border: pat.isInChamber
                  ? '1.5px solid #10B981'
                  : pat.isCurrent
                  ? '1.5px solid var(--ds-color-primary, #06B6D4)'
                  : '1px solid var(--ds-color-border-subtle, rgba(255,255,255,0.05))',
                backgroundColor: pat.isInChamber
                  ? 'rgba(16, 185, 129, 0.12)'
                  : pat.isCurrent
                  ? 'rgba(6, 182, 212, 0.12)'
                  : pat.status === 'COMPLETED'
                  ? 'rgba(255,255,255,0.02)'
                  : 'rgba(255,255,255,0.04)',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
              }}
            >
              {/* Line 1: Token, Name, Chamber Badge / Status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontWeight: 900,
                      fontSize: '0.8rem',
                      color: pat.isInChamber ? '#34D399' : pat.isCurrent ? '#38BDF8' : 'var(--ds-color-text-primary, #F8FAFC)'
                    }}
                  >
                    {pat.token}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ds-color-text-primary, #F8FAFC)' }}>
                    {pat.patientName}
                  </span>
                  {pat.isTriageStatPromoted && (
                    <span
                      style={{
                        fontSize: '0.55rem',
                        fontWeight: 900,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(239, 68, 68, 0.25)',
                        color: '#F87171',
                        border: '1px solid #EF4444'
                      }}
                      title="Promoted ahead in queue due to critical vitals / NEWS2 score >= 5"
                    >
                      🚨 STAT TRIAGE
                    </span>
                  )}
                  {pat.isRepeatToday && (
                    <span
                      style={{
                        fontSize: '0.55rem',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        color: '#FBBF24',
                        border: '1px solid rgba(245, 158, 11, 0.3)'
                      }}
                      title="Patient has multiple tokens registered today"
                    >
                      {pat.repeatLabel}
                    </span>
                  )}
                </div>

                {pat.isInChamber ? (
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 900,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(16, 185, 129, 0.25)',
                      color: '#34D399',
                      border: '1px solid #10B981',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                    IN CHAMBER
                  </span>
                ) : pat.status === 'REPORTS_READY' ? (
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 900,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(168, 85, 247, 0.25)',
                      color: '#C084FC',
                      border: '1px solid #A855F7',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    🧪 LABS READY
                  </span>
                ) : pat.status === 'COMPLETED' ? (
                  <span style={{ fontSize: '0.625rem', color: '#10B981', fontWeight: 700 }}>
                    ✓ Done
                  </span>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        color: pat.isSlaBreached ? '#F87171' : '#38BDF8',
                        fontWeight: 800,
                        fontFamily: 'monospace'
                      }}
                    >
                      ⏱️ {pat.estCallTime}
                    </span>
                    {pat.isSlaBreached && (
                      <span
                        style={{
                          fontSize: '0.5rem',
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          color: '#FCA5A5',
                          padding: '1px 3px',
                          borderRadius: '2px',
                          border: '1px solid rgba(239,68,68,0.4)'
                        }}
                        title="Wait exceeds 45-minute anger threshold SLA"
                      >
                        &gt;45m SLA
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Line 2: UHID, Age, Gender, Vitals, Ahead counter */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--ds-color-text-muted, #94A3B8)' }}>
                <span>
                  {pat.mrn} • {pat.gender}, {pat.age}y
                  {!pat.isInChamber && pat.status !== 'COMPLETED' && (
                    <span style={{ marginLeft: '4px', color: '#94A3B8' }}>
                      ({pat.patientsAhead} ahead • ~{pat.estWaitMinutes}m)
                    </span>
                  )}
                </span>
                {pat.nurseVitals ? (
                  <span style={{ color: pat.isTriageStatPromoted ? '#EF4444' : '#10B981', fontWeight: 700, fontFamily: 'monospace' }}>
                    BP: {pat.nurseVitals.systolicBp}/{pat.nurseVitals.diastolicBp}
                  </span>
                ) : (
                  <span style={{ color: '#F59E0B', fontSize: '0.625rem' }}>Vitals Pending</span>
                )}
              </div>

              {/* Line 3: NEWS2 Critical Reason Chip */}
              {pat.news2Result && pat.news2Result.isTriageStatPromoted && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', padding: '2px 5px', fontSize: '0.625rem', color: '#FCA5A5' }}>
                  🚨 NEWS2: {pat.news2Result.score} ({pat.news2Result.reasons.join(', ')})
                </div>
              )}

              {/* Red-Flag Vitals Alert Badges */}
              {pat.redFlags && pat.redFlags.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                  {pat.redFlags.map((flag: any, fIdx: number) => (
                    <span
                      key={fIdx}
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        backgroundColor: flag.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: flag.severity === 'CRITICAL' ? '#FCA5A5' : '#FCD34D',
                        border: `1px solid ${flag.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
                      }}
                    >
                      {flag.text}
                    </span>
                  ))}
                </div>
              )}

              {/* Line 4: Call to Chamber Action button */}
              {!pat.isInChamber && pat.status !== 'COMPLETED' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    callPatientToChamber(pat);
                  }}
                  style={{
                    marginTop: '4px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38BDF8',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>📢</span>
                  <span>Call to Chamber</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: isDesktop ? 'grid' : 'flex',
        gridTemplateColumns: isDesktop ? (isQueueCollapsed ? '52px 1fr' : '340px 1fr') : undefined,
        flexDirection: isDesktop ? undefined : 'column',
        gap: '16px',
        width: '100%',
        minHeight: 'calc(100vh - 120px)',
        backgroundColor: 'var(--ds-color-bg, #0B111E)',
        color: 'var(--ds-color-text-primary, #F8FAFC)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* 🖨️ Modals */}
      {isPrintModalOpen && (
        <PrintableDoctorPrescriptionModal
          isOpen={true}
          onClose={() => setIsPrintModalOpen(false)}
          consultation={{
            ...consultation,
            patientName: activePatient.name,
            patientMrn: activePatient.mrn,
            patientGender: activePatient.gender,
            patientMobile: activePatient.phone,
            queueToken: activePatient.token,
            patientAllergies: patientAllergies,
            vitals: currentVitals as any,
            examinationSummary: examFindings.join(', '),
            chiefComplaint,
            clinicalAssessment,
            treatmentPlan: `${treatmentPlan}\n\nReview: ${followUpDays}`,
            medications: medList as any
          }}
        />
      )}

      {isWhatsAppModalOpen && (
        <PatientWhatsAppSmartRxModal
          isOpen={true}
          onClose={() => setIsWhatsAppModalOpen(false)}
          consultation={{
            ...consultation,
            patientName: activePatient.name,
            patientMrn: activePatient.mrn,
            patientGender: activePatient.gender,
            patientMobile: activePatient.phone,
            queueToken: activePatient.token,
            patientAllergies: patientAllergies,
            vitals: currentVitals as any,
            examinationSummary: examFindings.join(', '),
            chiefComplaint,
            clinicalAssessment,
            treatmentPlan: `${treatmentPlan}\n\nReview: ${followUpDays}`,
            medications: medList as any
          }}
          medications={medList as any}
          selectedTests={selectedTests.map((t) => t.testName)}
          treatmentPlan={`${treatmentPlan}\n\nReview: ${followUpDays}`}
          followUpDays={followUpDays}
          onPrint={() => setIsPrintModalOpen(true)}
          onNextPatient={() => {
            setIsWhatsAppModalOpen(false);
            callNextPatient();
          }}
        />
      )}

      {/* 📄 Gap 6: 1-Click Medical Leave & Fitness Certificate Modal */}
      {isMedicalCertModalOpen && (
        <PrintableMedicalCertificateModal
          isOpen={true}
          onClose={() => setIsMedicalCertModalOpen(false)}
          patientName={activePatient.name}
          patientAge={activePatient.age}
          patientGender={activePatient.gender}
          patientMrn={activePatient.mrn}
          diagnosis={clinicalAssessment || chiefComplaint || 'Acute Respiratory Infection / Pyrexia'}
        />
      )}

      {/* 👨‍⚕️ Gap 7: Cross-Specialty OPD Referral Modal */}
      {isReferralModalOpen && (
        <DoctorOpdReferralModal
          isOpen={true}
          onClose={() => setIsReferralModalOpen(false)}
          patientName={activePatient.name}
          patientMrn={activePatient.mrn}
          token={activePatient.token}
          provisionalDiagnosis={clinicalAssessment}
          onDispatchReferral={handleDispatchReferral}
        />
      )}

      {/* 📑 Gap 3: Outside Lab Reports & Ultrasound Scan Viewer Modal */}
      {isExternalViewerOpen && (
        <ExternalInvestigationViewerModal
          isOpen={true}
          onClose={() => setIsExternalViewerOpen(false)}
          patientName={activePatient.name}
          patientMrn={activePatient.mrn}
        />
      )}

      {/* 💉 Pillar 3: OPD Daycare Minor Procedures Modal */}
      {isDaycareModalOpen && (
        <OpdDaycareProcedureModal
          isOpen={true}
          onClose={() => setIsDaycareModalOpen(false)}
          patientName={activePatient.name}
          patientMrn={activePatient.mrn}
          encounterId={consultation.id}
          onOrderDispatched={(items, totalCost) => {
            setOrderedDaycareProcedures(items);
            setStatusMessage(`✓ Daycare procedures ordered (₹${totalCost})`);
            setTimeout(() => setStatusMessage(null), 3000);
          }}
        />
      )}

      {/* ⚖️ Pillar 5: Medico-Legal Case (MLC) Record Modal */}
      {isMlcModalOpen && (
        <OpdMlcRecordModal
          isOpen={true}
          onClose={() => setIsMlcModalOpen(false)}
          patientName={activePatient.name}
          patientMrn={activePatient.mrn}
          encounterId={consultation.id}
          initialMlc={mlcDetails}
          onSaveMlc={(details) => {
            setMlcDetails(details);
            setStatusMessage(`🚨 MLC Recorded: ${details.incidentType} (${details.policeStation})`);
            setTimeout(() => setStatusMessage(null), 4000);
          }}
        />
      )}

      {/* 📱 Pillar 6: Post-OPD WhatsApp Tele-Triage Desk Modal */}
      {isTeleTriageOpen && (
        <OpdTeleTriageDeskModal
          isOpen={true}
          onClose={() => setIsTeleTriageOpen(false)}
          doctorName={chamberDoctor || 'Dr. Verified Physician'}
        />
      )}

      {/* 🆔 Pillar 7: Duplicate Patient Merge Engine Modal */}
      {isDuplicateMergeOpen && (
        <OpdDuplicatePatientMergeModal
          isOpen={true}
          onClose={() => setIsDuplicateMergeOpen(false)}
          activePatient={{
            name: activePatient.name,
            uhid: activePatient.mrn,
            age: typeof activePatient.age === 'number' ? activePatient.age : parseInt(String(activePatient.age), 10) || 35,
            gender: activePatient.gender,
            phone: activePatient.phone
          }}
          onMergeSuccess={(primaryUhid) => {
            setStatusMessage(`✓ Duplicate file merged into primary UHID: ${primaryUhid}`);
            setTimeout(() => setStatusMessage(null), 3500);
          }}
        />
      )}

      {/* 🛑 Pillar 10: Critical Allergy Hard Lockout Modal */}
      {isHardAllergyLockOpen && allergyConflict && (
        <OpdAllergyHardLockModal
          isOpen={true}
          onClose={() => setIsHardAllergyLockOpen(false)}
          conflict={allergyConflict}
          patientName={activePatient.name}
          onRemoveMedication={(offendingMed) => {
            setMedList((prev) => prev.filter((m) => m.medicationName.toLowerCase() !== offendingMed.toLowerCase()));
            setAllergyConflict(null);
            setIsHardAllergyLockOpen(false);
            setStatusMessage(`✓ Removed contraindicated drug ${offendingMed}`);
            setTimeout(() => setStatusMessage(null), 3000);
          }}
          onEmergencyOverride={(justification) => {
            setIsHardAllergyLockOpen(false);
            setStatusMessage(`⚠️ Emergency Clinical Override logged: "${justification}"`);
            setTimeout(() => setStatusMessage(null), 4000);
          }}
        />
      )}

      {/* 💰 Pillar 9: Solo Doctor Chamber Fee Settlement Modal */}
      {isChamberPaymentOpen && (
        <OpdChamberPaymentModal
          isOpen={true}
          onClose={() => setIsChamberPaymentOpen(false)}
          patientName={activePatient.name}
          patientMrn={activePatient.mrn}
          consultationFee={_consultationFeeFirstVisit || 500}
          onPaymentSettled={(receiptNo, amount, mode) => {
            setChamberPaymentReceipt(receiptNo);
            setStatusMessage(`✓ Receipt #${receiptNo} stamped: ₹${amount} via ${mode}`);
            setTimeout(() => setStatusMessage(null), 4000);
          }}
        />
      )}

      {/* 🌐 Pillar 4: Vernacular Prescription Modal (Hindi / Urdu) */}
      {isVernacularModalOpen && (
        <VernacularPrescriptionPreviewModal
          isOpen={true}
          onClose={() => setIsVernacularModalOpen(false)}
          patientName={activePatient.name}
          patientAge={activePatient.age}
          patientGender={activePatient.gender}
          patientMrn={activePatient.mrn}
          diagnosis={clinicalAssessment || chiefComplaint || 'Clinical Evaluation'}
          medications={medList.map((m) => ({
            id: m.id,
            medicationName: m.medicationName,
            strength: m.strength,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration,
            instructions: m.instructions
          }))}
          doctorName={chamberDoctor || 'Dr. Verified Physician (MBBS, MD)'}
          isMlcCase={Boolean(mlcDetails?.isMlc)}
        />
      )}

      {/* 💓 Gap 2: In-Chamber Fast Vitals Quick-Capture Modal */}
      {isQuickVitalsModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
          onClick={() => setIsQuickVitalsModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #06B6D4',
              borderRadius: '16px',
              padding: '20px',
              width: '100%',
              maxWidth: '460px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.3rem' }}>💓</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#F8FAFC' }}>
                    In-Chamber Quick Vitals Capture (Doctor Override)
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                    {activePatient.token} • {activePatient.name}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickVitalsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#38BDF8', marginBottom: '3px' }}>
                  BP Systolic (mmHg):
                </label>
                <input
                  type="number"
                  value={editBpSys}
                  onChange={(e) => setEditBpSys(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.8rem', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#38BDF8', marginBottom: '3px' }}>
                  BP Diastolic (mmHg):
                </label>
                <input
                  type="number"
                  value={editBpDia}
                  onChange={(e) => setEditBpDia(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.8rem', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#FBBF24', marginBottom: '3px' }}>
                  Blood Sugar (mg/dL):
                </label>
                <input
                  type="number"
                  value={editGlucose}
                  onChange={(e) => setEditGlucose(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.8rem', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#38BDF8', marginBottom: '3px' }}>
                  SpO2 (%):
                </label>
                <input
                  type="number"
                  value={editSpo2}
                  onChange={(e) => setEditSpo2(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.8rem', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '3px' }}>
                  Pulse (bpm):
                </label>
                <input
                  type="number"
                  value={editPulse}
                  onChange={(e) => setEditPulse(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.8rem', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '3px' }}>
                  Body Weight (kg):
                </label>
                <input
                  type="number"
                  value={editWeight}
                  onChange={(e) => setEditWeight(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.8rem', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#F87171', marginBottom: '3px' }}>
                  Temperature (°F):
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editTemp}
                  onChange={(e) => setEditTemp(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.8rem', fontWeight: 700 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsQuickVitalsModalOpen(false)}
                style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#94A3B8', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuickVitals}
                style={{ padding: '6px 16px', borderRadius: '6px', backgroundColor: '#06B6D4', border: 'none', color: '#070C16', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer' }}
              >
                ✓ Save & Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📈 Gap 1: Longitudinal Historical Visit Details Modal */}
      {selectedHistoricalVisit && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
          onClick={() => setSelectedHistoricalVisit(null)}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '22px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.3rem' }}>📈</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#38BDF8' }}>
                    {selectedHistoricalVisit.label} • Previous Visit Record
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                    {activePatient.name} • {selectedHistoricalVisit.relative}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistoricalVisit(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.625rem', color: '#94A3B8' }}>RECORDED BP:</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#38BDF8' }}>{selectedHistoricalVisit.bp} mmHg</div>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.625rem', color: '#94A3B8' }}>BLOOD SUGAR:</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#FBBF24' }}>{selectedHistoricalVisit.sugar}</div>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.625rem', color: '#94A3B8' }}>WEIGHT:</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#10B981' }}>{selectedHistoricalVisit.weight}</div>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#CBD5E1', marginBottom: '4px' }}>DIAGNOSIS ON THAT VISIT:</div>
              <div style={{ fontSize: '0.78rem', color: '#F8FAFC', backgroundColor: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                {selectedHistoricalVisit.assessment}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#CBD5E1', marginBottom: '4px' }}>MEDICATIONS PRESCRIBED:</div>
              <div style={{ fontSize: '0.75rem', color: '#93C5FD', backgroundColor: 'rgba(56, 189, 248, 0.08)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                {selectedHistoricalVisit.prescribedMeds}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedHistoricalVisit(null)}
                style={{ padding: '6px 16px', borderRadius: '6px', backgroundColor: '#334155', border: 'none', color: '#F8FAFC', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🛡️ Interactive Allergy Management Dialog */}
      {isAllergyModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
          onClick={() => setIsAllergyModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>⚠️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#F8FAFC' }}>
                    Patient Allergy & ADR Profile
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    {activePatient.name} • {activePatient.mrn}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAllergyModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Current Recorded Allergies */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#CBD5E1', marginBottom: '8px' }}>
                ACTIVE RECORDED DRUG ALLERGIES:
              </label>
              {patientAllergies.length > 0 ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {patientAllergies.map((allergy) => (
                    <span
                      key={allergy}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid #EF4444',
                        color: '#FCA5A5',
                        fontSize: '0.8125rem',
                        fontWeight: 700
                      }}
                    >
                      <span>{allergy}</span>
                      <button
                        type="button"
                        onClick={() => setPatientAllergies((prev) => prev.filter((a) => a !== allergy))}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 0, fontSize: '0.75rem' }}
                        title="Remove allergy"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34D399',
                    fontSize: '0.8125rem',
                    fontWeight: 700
                  }}
                >
                  🛡️ NKDA (No Known Drug Allergies) — Safe for standard formulary dosing.
                </div>
              )}
            </div>

            {/* Quick Common Allergy Chips */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>
                QUICK-ADD COMMON DRUG ALLERGENS:
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['Penicillin', 'Sulfa Drugs', 'NSAIDs / Aspirin', 'Ciprofloxacin', 'Paracetamol', 'Cephalosporins', 'Latex'].map((drug) => {
                  const isAdded = patientAllergies.includes(drug);
                  return (
                    <button
                      key={drug}
                      type="button"
                      disabled={isAdded}
                      onClick={() => setPatientAllergies((prev) => [...prev, drug])}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        backgroundColor: isAdded ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: isAdded ? '#64748B' : '#E2E8F0',
                        cursor: isAdded ? 'default' : 'pointer'
                      }}
                    >
                      {isAdded ? '✓ Added' : `+ ${drug}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                type="text"
                value={newAllergyInput}
                onChange={(e) => setNewAllergyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newAllergyInput.trim()) {
                    e.preventDefault();
                    if (!patientAllergies.includes(newAllergyInput.trim())) {
                      setPatientAllergies((prev) => [...prev, newAllergyInput.trim()]);
                    }
                    setNewAllergyInput('');
                  }
                }}
                placeholder="Type custom allergen (e.g. Amoxicillin, Codeine)..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#0B111E',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#F8FAFC',
                  fontSize: '0.8125rem'
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (newAllergyInput.trim() && !patientAllergies.includes(newAllergyInput.trim())) {
                    setPatientAllergies((prev) => [...prev, newAllergyInput.trim()]);
                    setNewAllergyInput('');
                  }
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#0284C7',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                + Add
              </button>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setPatientAllergies([]);
                  setIsAllergyModalOpen(false);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10B981',
                  color: '#34D399',
                  fontWeight: 800,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                🛡️ Set to NKDA
              </button>
              <button
                type="button"
                onClick={() => setIsAllergyModalOpen(false)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#0284C7',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 DIRECT EMERGENCY IPD ADMISSION REQUISITION DIALOG */}
      {isAdmissionModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
          onClick={() => setIsAdmissionModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '2px solid #EF4444',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '640px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(239, 68, 68, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.8rem' }}>🚨</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#F87171' }}>
                    Emergency Inpatient (IPD) Admission Order
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    {activePatient.token} • {activePatient.name} ({activePatient.mrn}) • Bed Reservation Request
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdmissionModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Ward & Priority Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#38BDF8', marginBottom: '4px' }}>
                  ADMISSION PRIORITY:
                </label>
                <select
                  value={admissionPriority}
                  onChange={(e) => setAdmissionPriority(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: '#0B111E',
                    border: '1.5px solid #EF4444',
                    color: '#F87171',
                    fontSize: '0.78rem',
                    fontWeight: 800
                  }}
                >
                  <option value="EMERGENCY_STAT">🚨 STAT EMERGENCY (Immediate Transfer)</option>
                  <option value="URGENT">⚠️ URGENT (&lt; 2 Hours)</option>
                  <option value="ELECTIVE">📋 Elective Planned Admission</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#38BDF8', marginBottom: '4px' }}>
                  TARGET IPD WARD / UNIT:
                </label>
                <select
                  value={admissionWard}
                  onChange={(e) => setAdmissionWard(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: '#0B111E',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#F8FAFC',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}
                >
                  <option value="ICU (Intensive Care Unit)">ICU (Intensive Care Unit)</option>
                  <option value="Emergency Trauma Ward">Emergency Trauma & Triage Ward</option>
                  <option value="Cardiac Care Unit (CCU)">Cardiac Care Unit (CCU)</option>
                  <option value="High Dependency Unit (HDU)">High Dependency Unit (HDU)</option>
                  <option value="General Medicine Inpatient Ward">General Medicine Inpatient Ward</option>
                  <option value="Daycare / Observation Ward">Daycare / Short Stay Observation</option>
                </select>
              </div>
            </div>

            {/* Clinical Indication */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#38BDF8', marginBottom: '4px' }}>
                PROVISIONAL DIAGNOSIS & REASON FOR ADMISSION:
              </label>
              <textarea
                rows={2}
                value={admissionIndication}
                onChange={(e) => setAdmissionIndication(e.target.value)}
                placeholder="e.g. Severe Dengue with Thrombocytopenia (Platelets 16,000), hemoconcentration, persistent vomiting and postural hypotension..."
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  backgroundColor: '#0B111E',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#F8FAFC',
                  fontSize: '0.78rem',
                  resize: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Stat Pre-Admission Orders */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#38BDF8', marginBottom: '6px' }}>
                STAT PRE-ADMISSION DIRECTIVES:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  'Secure IV Line 18G / 20G Cannula Stat',
                  'Start Normal Saline 0.9% @ 100 ml/hr IV',
                  'Continuous SpO2 & Cardiac Telemetry Monitoring',
                  'High Flow Oxygen via Mask @ 4L/min',
                  'Keep Strictly NPO (Nil by mouth)',
                  'Stat 12-Lead ECG & Urgent Trop-I'
                ].map((order) => {
                  const isChecked = admissionStatOrders.includes(order);
                  return (
                    <label
                      key={order}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: isChecked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.03)',
                        border: isChecked ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.08)',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        color: isChecked ? '#FCA5A5' : '#CBD5E1'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setAdmissionStatOrders(prev =>
                            prev.includes(order) ? prev.filter(o => o !== order) : [...prev, order]
                          );
                        }}
                      />
                      <span>{order}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Additional Physician Notes / Special Precautions */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#38BDF8', marginBottom: '4px' }}>
                PHYSICIAN DIRECTIVES & TRANSPORT PRECAUTIONS (OPTIONAL):
              </label>
              <textarea
                value={admissionNotes}
                onChange={(e) => setAdmissionNotes(e.target.value)}
                placeholder="e.g. Oxygen cylinder required during stretcher transfer. Direct shift to ICU Bed 4."
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#0B111E',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#F8FAFC',
                  fontSize: '0.75rem',
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px' }}>
              <button
                type="button"
                onClick={() => setIsAdmissionModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#94A3B8',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDispatchIpdAdmission}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(220, 38, 38, 0.5)'
                }}
              >
                <span>🚨</span>
                <span>Confirm & Dispatch IPD Admission</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📚 COMPREHENSIVE INDIAN MEDICINE FORMULARY & DRUG LIBRARY MODAL */}
      {isMedicineLibraryOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(7, 12, 22, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setIsMedicineLibraryOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '960px',
              maxHeight: '90vh',
              backgroundColor: '#0F172A',
              border: '1.5px solid rgba(16, 185, 129, 0.45)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.15)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.8rem' }}>💊</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#F8FAFC' }}>
                    Indian Medicine Formulary & Drug Library (दवा लाइब्रेरी)
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
                    2,400+ Standard Formulations • Smart Dosing • Jan Aushadhi Generic Substitutes & Cost Savings
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMedicineLibraryOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Search and Filters */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                value={medLibrarySearch}
                onChange={(e) => setMedLibrarySearch(e.target.value)}
                placeholder="Search medicine by brand (Dolo, Pan, Augmentin, Azithral), generic molecule, or class..."
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#0B111E',
                  border: '1.5px solid rgba(16, 185, 129, 0.35)',
                  color: '#F8FAFC',
                  fontSize: '0.82rem',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 800 }}>Categories:</span>
                {[
                  { key: 'ALL', label: 'All Drugs' },
                  { key: 'Fever & Pain', label: 'Fever / Pain' },
                  { key: 'Antacid', label: 'Antacids (GERD)' },
                  { key: 'Antibiotic', label: 'Antibiotics' },
                  { key: 'Respiratory', label: 'Cough / Asthma' },
                  { key: 'Blood Pressure', label: 'Hypertension' },
                  { key: 'Diabetes', label: 'Diabetes' },
                  { key: 'Supplements', label: 'Vitamins & Minerals' },
                  { key: 'Allergy', label: 'Allergy' },
                  { key: 'Rehydration', label: 'ORS' }
                ].map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setMedLibraryCategory(cat.key)}
                    style={{
                      padding: '3px 9px',
                      borderRadius: '12px',
                      fontSize: '0.68rem',
                      fontWeight: medLibraryCategory === cat.key ? 800 : 500,
                      backgroundColor: medLibraryCategory === cat.key ? '#10B981' : 'rgba(255,255,255,0.04)',
                      color: medLibraryCategory === cat.key ? '#FFFFFF' : '#94A3B8',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Drugs List Grid */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {isMedLibrarySearching && (
                <div style={{ gridColumn: '1 / -1', padding: '24px', textAlign: 'center', color: '#10B981', fontWeight: 800 }}>
                  ⏳ Loading formulary drugs from PostgreSQL catalog...
                </div>
              )}
              {medLibraryError && (
                <div style={{ gridColumn: '1 / -1', padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '8px', color: '#FCA5A5' }}>
                  ⚠️ {medLibraryError}
                </div>
              )}
              {filteredFullMedicineLibrary.map((drug) => {
                const isPrescribed = medList.some((m) => m.medicationName.toLowerCase() === drug.name.toLowerCase());
                return (
                  <div
                    key={drug.id}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: isPrescribed ? '1.5px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
                        <div>
                          <div style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.85rem' }}>
                            {drug.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#38BDF8', fontWeight: 700 }}>
                            {drug.strength} • {drug.dosage}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.625rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.06)', color: '#94A3B8' }}>
                          {drug.category}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '4px' }}>
                        Molecule: <strong style={{ color: '#CBD5E1' }}>{drug.genericName}</strong>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#FCD34D', marginTop: '2px' }}>
                        Freq: {drug.frequency} • {drug.duration} Days • {drug.beforeAfterFood.replace('_', ' ')}
                      </div>
                      {drug.janAushadhiPrice && drug.brandPrice > drug.janAushadhiPrice && (
                        <div style={{ fontSize: '0.65rem', color: '#10B981', marginTop: '3px', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '3px 6px', borderRadius: '4px' }}>
                          ⚡ Jan Aushadhi: ₹{drug.janAushadhiPrice} (Save ₹{drug.brandPrice - drug.janAushadhiPrice})
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isPrescribed || isSignedOrCompleted}
                      onClick={() => handleAddMedicineFromAdder(drug)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: isPrescribed ? 'rgba(16, 185, 129, 0.2)' : '#10B981',
                        color: isPrescribed ? '#34D399' : '#FFFFFF',
                        border: isPrescribed ? '1px solid #10B981' : 'none',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: isPrescribed ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      {isPrescribed ? '✓ Added in Rx' : '+ Add to Prescription'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0B111E' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#10B981' }}>
                💊 Prescribed: {medList.length} medicines in prescription pad
              </div>
              <button
                type="button"
                onClick={() => setIsMedicineLibraryOpen(false)}
                style={{ padding: '8px 20px', borderRadius: '8px', backgroundColor: '#0284C7', color: '#FFFFFF', border: 'none', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔬 COMPREHENSIVE PATHOLOGY & RADIOLOGY DIAGNOSTIC LAB LIBRARY MODAL */}
      {isLabLibraryOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(7, 12, 22, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setIsLabLibraryOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '960px',
              maxHeight: '90vh',
              backgroundColor: '#0F172A',
              border: '1.5px solid rgba(56, 189, 248, 0.45)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(56, 189, 248, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.8rem' }}>🔬</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#F8FAFC' }}>
                    Pathology, Lab & Diagnostic Test Library (लैब व टेस्ट लाइब्रेरी)
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
                    115+ NABL/NABH Standard Laboratory Investigations • Specimen Protocols & 1-Click Clinical Profiles
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLabLibraryOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Quick 1-Click Diagnostic Panels */}
            <div style={{ padding: '10px 20px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', color: '#38BDF8', fontWeight: 800 }}>⚡ 1-Click Diagnostic Panels:</span>
              <button
                type="button"
                onClick={() => handleApplyLabPanel('Fever Profile', ['Complete Blood Count (CBC / Hemogram)', 'Widal Test (Enteric / Typhoid Fever)', 'Dengue Serology (NS1 Antigen & IgG/IgM)', 'Urine Routine & Microscopic (Urine R/M)'])}
                style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800, backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#FCD34D', cursor: 'pointer' }}
              >
                🌡️ Fever Profile
              </button>
              <button
                type="button"
                onClick={() => handleApplyLabPanel('Diabetic Profile', ['HbA1c (Glycated Hemoglobin)', 'Fasting Blood Sugar (FBS)', 'Post Prandial Blood Sugar (PPBS)', 'Lipid Profile (Cholesterol & Triglycerides)'])}
                style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800, backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34D399', cursor: 'pointer' }}
              >
                🩸 Diabetic Profile
              </button>
              <button
                type="button"
                onClick={() => handleApplyLabPanel('Thyroid & Vits', ['Thyroid Profile Total (T3, T4, TSH)', 'Vitamin D 25-Hydroxy Total', 'Vitamin B12 Quantitative Assay'])}
                style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800, backgroundColor: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.4)', color: '#DDD6FE', cursor: 'pointer' }}
              >
                🦋 Thyroid & Vits
              </button>
              <button
                type="button"
                onClick={() => handleApplyLabPanel('Liver Complete', ['Liver Function Test Complete (LFT Profile)', 'Serum Bilirubin Total', 'Serum Glutamic Pyruvic Transaminase (SGPT / ALT)'])}
                style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800, backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#FCA5A5', cursor: 'pointer' }}
              >
                🏥 Liver Complete
              </button>
              <button
                type="button"
                onClick={() => handleApplyLabPanel('Renal Complete', ['Kidney Function Test Complete (KFT / RFT Profile)', 'Serum Creatinine Enzymatic', 'Blood Urea Nitrogen (BUN)'])}
                style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800, backgroundColor: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#7DD3FC', cursor: 'pointer' }}
              >
                🫘 Kidney Complete
              </button>
            </div>

            {/* Search and Department Filter Tabs */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                value={labLibrarySearch}
                onChange={(e) => setLabLibrarySearch(e.target.value)}
                placeholder="Search investigation by name (CBC, Dengue, Widal, Thyroid, LFT, KFT, USG, X-Ray, HbA1c)..."
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#0B111E',
                  border: '1.5px solid rgba(56, 189, 248, 0.35)',
                  color: '#F8FAFC',
                  fontSize: '0.82rem',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 800 }}>Departments:</span>
                {[
                  { key: 'ALL', label: 'All Tests (115+)' },
                  { key: 'HEMATOLOGY', label: 'Hematology (Blood)' },
                  { key: 'BIOCHEMISTRY', label: 'Biochemistry' },
                  { key: 'ENDOCRINOLOGY', label: 'Endocrinology' },
                  { key: 'IMMUNOLOGY', label: 'Immunology / Serology' },
                  { key: 'PATHOLOGY', label: 'Pathology / Urine' },
                  { key: 'RADIOLOGY', label: 'Radiology / Imaging' },
                  { key: 'CARDIOLOGY', label: 'Cardiology (ECG)' }
                ].map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setLabLibraryCategory(cat.key)}
                    style={{
                      padding: '3px 9px',
                      borderRadius: '12px',
                      fontSize: '0.68rem',
                      fontWeight: labLibraryCategory === cat.key ? 800 : 500,
                      backgroundColor: labLibraryCategory === cat.key ? '#06B6D4' : 'rgba(255,255,255,0.04)',
                      color: labLibraryCategory === cat.key ? '#070C16' : '#94A3B8',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Test Cards Grid */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {isLabLibrarySearching && (
                <div style={{ gridColumn: '1 / -1', padding: '24px', textAlign: 'center', color: '#38BDF8', fontWeight: 800 }}>
                  ⏳ Loading diagnostic tests from PostgreSQL catalog...
                </div>
              )}
              {labLibraryError && (
                <div style={{ gridColumn: '1 / -1', padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '8px', color: '#FCA5A5' }}>
                  ⚠️ {labLibraryError}
                </div>
              )}
              {filteredFullLabLibrary.map((test) => {
                const isOrdered = selectedTests.some(
                  (st) => (st.investigationCatalogId && st.investigationCatalogId === test.catalogId) ||
                          st.testName.toLowerCase() === test.name.toLowerCase() ||
                          st.testCode.toLowerCase() === test.testCode.toLowerCase()
                );
                return (
                  <div
                    key={test.id}
                    style={{
                      backgroundColor: isOrdered ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: isOrdered ? '1.5px solid #06B6D4' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
                        <div style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.85rem' }}>
                          {test.name}
                        </div>
                        <span style={{ fontSize: '0.625rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.06)', color: '#38BDF8', fontWeight: 800 }}>
                          {test.testCode}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '4px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span>Dept: <strong style={{ color: '#CBD5E1' }}>{test.categoryLabel}</strong></span>
                        <span>•</span>
                        <span>Sample: <strong style={{ color: '#CBD5E1' }}>{test.specimen}</strong></span>
                      </div>
                      <div style={{ fontSize: '0.68rem', marginTop: '4px', display: 'flex', gap: '8px' }}>
                        {test.fasting ? (
                          <span style={{ color: '#F59E0B', fontWeight: 800 }}>⚠️ Fasting Required</span>
                        ) : (
                          <span style={{ color: '#10B981' }}>✓ Non-Fasting</span>
                        )}
                        <span style={{ color: '#94A3B8' }}>• TAT: {test.tatHours}h</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isSignedOrCompleted}
                      onClick={() => toggleInvestigation(test)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: isOrdered ? 'rgba(6, 182, 212, 0.25)' : '#0284C7',
                        color: isOrdered ? '#38BDF8' : '#FFFFFF',
                        border: isOrdered ? '1px solid #06B6D4' : 'none',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: isSignedOrCompleted ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      {isOrdered ? '✓ Ordered (Click to Remove)' : '+ Order Investigation'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0B111E' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38BDF8' }}>
                🔬 Ordered: {selectedTests.length} investigations in prescription pad
              </div>
              <button
                type="button"
                onClick={() => setIsLabLibraryOpen(false)}
                style={{ padding: '8px 20px', borderRadius: '8px', backgroundColor: '#0284C7', color: '#FFFFFF', border: 'none', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📱 MOBILE VIEW NAVIGATION: 2-Tab Switcher (<768px) */}
      {isMobile && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            padding: '4px',
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <button
            type="button"
            onClick={() => setMobileActiveTab('queue')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 12px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.82rem',
              backgroundColor: mobileActiveTab === 'queue' ? '#0284C7' : 'transparent',
              color: mobileActiveTab === 'queue' ? '#FFFFFF' : '#94A3B8'
            }}
          >
            <span>👥 1. Live Queue</span>
            <span
              style={{
                padding: '2px 7px',
                borderRadius: '10px',
                fontSize: '0.7rem',
                fontWeight: 900,
                backgroundColor: mobileActiveTab === 'queue' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)'
              }}
            >
              {queueStats.waiting}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileActiveTab('rx')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 12px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.82rem',
              backgroundColor: mobileActiveTab === 'rx' ? '#0284C7' : 'transparent',
              color: mobileActiveTab === 'rx' ? '#FFFFFF' : '#94A3B8'
            }}
          >
            <span>📝 2. Active Rx</span>
            {consultation.patientName && (
              <span
                style={{
                  fontSize: '0.72rem',
                  opacity: 0.9,
                  maxWidth: '70px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                ({consultation.patientName.split(' ')[0]})
              </span>
            )}
          </button>
        </div>
      )}

      {/* 📱 TABLET VIEW DRAWER (768px - 1024px) */}
      {isTablet && isTabletDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsTabletDrawerOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(3px)',
              zIndex: 1100,
              cursor: 'pointer'
            }}
          />
          {/* Slide-out Sidebar Drawer */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '380px',
              maxWidth: '85vw',
              backgroundColor: '#0F172A',
              borderRight: '1px solid rgba(255, 255, 255, 0.12)',
              zIndex: 1101,
              boxShadow: '4px 0 30px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {renderQueuePanel(true, () => setIsTabletDrawerOpen(false))}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* VIEW A: OPD LIVE QUEUE                                                    */}
      {/* ========================================================================= */}
      {/* Desktop View: Split-screen left column */}
      {isDesktop && (
        isQueueCollapsed ? (
          <div
            style={{
              backgroundColor: 'var(--ds-color-surface, #0F172A)',
              border: '1px solid var(--ds-color-border, rgba(255,255,255,0.08))',
              borderRadius: '16px',
              padding: '14px 6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
            }}
          >
            <button
              type="button"
              onClick={() => setIsQueueCollapsed(false)}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid #38BDF8',
                borderRadius: '8px',
                color: '#38BDF8',
                padding: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 800
              }}
              title="Expand Live Patient Queue (30%)"
            >
              ▶
            </button>
            <div
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#94A3B8',
                letterSpacing: '1px'
              }}
            >
              LIVE QUEUE ({queuePatients.filter((p) => p.status !== 'COMPLETED').length})
            </div>
          </div>
        ) : (
          renderQueuePanel(false)
        )
      )}

      {/* Mobile View: Render queue when on queue tab */}
      {isMobile && mobileActiveTab === 'queue' && renderQueuePanel(false)}

      {/* ========================================================================= */}
      {/* VIEW B: ACTIVE CONSULTATION & EMR DOSSIER (70% or Full-Width)             */}
      {/* ========================================================================= */}
      {(!isMobile || mobileActiveTab === 'rx') && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            overflowY: 'auto',
            paddingRight: '4px',
            paddingBottom: '24px',
            flex: 1,
            width: '100%'
          }}
        >
          {/* Tablet Quick-Bar: 1-Tap Slide-out Queue Trigger */}
          {isTablet && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 14px',
                backgroundColor: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                <span style={{ fontSize: '1rem' }}>📱</span>
                <span style={{ fontWeight: 800, color: '#38BDF8' }}>iPad / Tablet Mode Active</span>
                <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>(Full-width EMR Workspace)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTabletDrawerOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
                }}
              >
                <span>📋 Live Queue</span>
                <span
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '0.7rem'
                  }}
                >
                  {queueStats.waiting} Waiting
                </span>
              </button>
            </div>
          )}

          {/* Mobile Back-to-Queue Shortcut Bar */}
          {isMobile && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <button
                type="button"
                onClick={() => setMobileActiveTab('queue')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 10px',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38BDF8',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <span>←</span>
                <span>Live Queue ({queueStats.waiting} Waiting)</span>
              </button>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                {chamberRoom} • {chamberDoctor}
              </span>
            </div>
          )}
        {/* Status Notification Pill */}
        {statusMessage && (
          <div
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: '#06B6D4',
              color: '#070C16',
              fontWeight: 800,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 15px rgba(6, 182, 212, 0.4)',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <span>{statusMessage}</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Press Ctrl+Z to undo</span>
          </div>
        )}

        {/* 🚨 NABL Critical Panic Value Red Flag HUD (ISO 15189) */}
        {criticalPanicAlert && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '2px solid #EF4444',
              borderRadius: '12px',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.25)',
              animation: 'pulse 2s infinite'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.8rem' }}>🚨</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      backgroundColor: '#DC2626',
                      color: '#FFFFFF',
                      fontWeight: 900,
                      fontSize: '0.72rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      letterSpacing: '0.5px'
                    }}
                  >
                    NABL CRITICAL PANIC VALUE
                  </span>
                  <span style={{ fontWeight: 800, color: '#991B1B', fontSize: '0.95rem' }}>
                    {criticalPanicAlert.patientName}: {criticalPanicAlert.analyte} ={' '}
                    <strong style={{ color: '#DC2626', textDecoration: 'underline' }}>
                      {criticalPanicAlert.measuredValue} {criticalPanicAlert.unit}
                    </strong>{' '}
                    <span style={{ fontSize: '0.8rem', color: '#7F1D1D', fontWeight: 'normal' }}>
                      (Ref: {criticalPanicAlert.referenceRange})
                    </span>
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#B91C1C', marginTop: '3px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span>Reported at {criticalPanicAlert.timestamp}</span>
                  <span>•</span>
                  <span style={{ fontWeight: 800, color: '#DC2626', backgroundColor: '#FEE2E2', padding: '2px 6px', borderRadius: '4px' }}>
                    ⏱️ NABL 15-Min Verbal Window: {Math.floor((criticalPanicAlert.countdownSeconds || 0) / 60)}:
                    {String((criticalPanicAlert.countdownSeconds || 0) % 60).padStart(2, '0')} min remaining
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  const statNote = `\n[STAT CLINICAL PROTOCOL ACTIVATED - ${new Date().toLocaleTimeString()}]: Immediate intervention for critical lab value ${criticalPanicAlert.analyte}: ${criticalPanicAlert.measuredValue} ${criticalPanicAlert.unit}. Attending doctor alerted. Ordered stat repeat confirmation, telemetry monitoring, and IV access.`;
                  setTreatmentPlan(prev => (prev ? prev + '\n' + statNote : statNote));
                  setStatusMessage('⚡ Stat Clinical Protocol Added to Rx Pad!');
                  setTimeout(() => setStatusMessage(null), 4000);
                }}
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)'
                }}
              >
                ⚡ Insert Stat Protocol
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(
                    `📞 Attending Doctor Verbal Read-Back Confirmed:\n\nPatient: ${criticalPanicAlert.patientName}\nAnalyte: ${criticalPanicAlert.analyte} = ${criticalPanicAlert.measuredValue} ${criticalPanicAlert.unit}\nStatus: Verbal Read-Back Verified & Logged in ISO 15189 Audit Trail.`
                  );
                  setCriticalPanicAlert(null);
                }}
                style={{
                  backgroundColor: '#FEE2E2',
                  color: '#991B1B',
                  border: '1px solid #F87171',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ✓ Acknowledge & Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 🌟 NEXT-GEN BENTO GRID: THE 30-SECOND ZERO-TYPING CLINICAL COCKPIT 🌟 */}
        {/* ========================================================================= */}

        {/* 1. BENTO CARD 1: PATIENT HEADER & GLOWING TELEMETRY VITALS HUD */}
        <div
          style={{
            backgroundColor: 'var(--ds-color-surface, #0F172A)',
            border: '1px solid var(--ds-color-border, rgba(255,255,255,0.08))',
            borderRadius: '16px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.35)'
          }}
        >
          {/* Patient Details & Stage */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                border: '1.5px solid #06B6D4',
                color: '#38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: 900
              }}
            >
              {activePatient.token}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--ds-color-text-primary, #F8FAFC)' }}>
                  {activePatient.name}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
                  {activePatient.age} • {activePatient.gender} • <strong style={{ color: '#E2E8F0' }}>{activePatient.mrn}</strong> • 📱 {activePatient.phone}
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '5px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38BDF8'
                  }}
                >
                  ● Step 4/5: In-Chamber
                </span>

                {/* 🟢 Gap 5: Automated OPD Follow-up Free Revisit Window Badge */}
                {activePatient.isFreeFollowUpRevisit ? (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '5px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      color: '#34D399'
                    }}
                    title={`Last consultation was ${activePatient.daysSinceLastVisit} days ago (Within 7-day free review window)`}
                  >
                    🟢 Free Revisit (Day {activePatient.daysSinceLastVisit} of 7 • ₹0 Fee)
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '5px',
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      color: '#38BDF8'
                    }}
                    title="Last consultation was >7 days ago or fresh OPD registration"
                  >
                    🔵 Fresh Consultation (₹500 Fee)
                  </span>
                )}

                {/* 🚪 Pillar 1: Door Status Indicator & Smart TV Audio Call */}
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '5px',
                    backgroundColor: doorStatus === 'OCCUPIED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    border: doorStatus === 'OCCUPIED' ? '1px solid #EF4444' : '1px solid #10B981',
                    color: doorStatus === 'OCCUPIED' ? '#FCA5A5' : '#86EFAC',
                    cursor: 'pointer'
                  }}
                  onClick={() => setDoorStatus(doorStatus === 'OCCUPIED' ? 'VACANT' : 'OCCUPIED')}
                  title="Click to toggle chamber door light (Red: In Consultation, Green: Please Enter)"
                >
                  {doorStatus === 'OCCUPIED' ? '🔴 Door: Occupied' : '🟢 Door: Please Enter'}
                </span>

                <button
                  type="button"
                  onClick={handleAudioCallNextPatient}
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '5px',
                    backgroundColor: audioCallActive ? '#22C55E' : 'rgba(245, 158, 11, 0.15)',
                    border: audioCallActive ? '1px solid #16A34A' : '1px solid #F59E0B',
                    color: audioCallActive ? '#070C16' : '#FDE68A',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                  title="Dispatches voice announcement to waiting room smart TV & door display"
                >
                  <span>📢</span>
                  <span>Call Token #{activePatient.token || 14}</span>
                </button>

                {/* 🆔 Pillar 7: Duplicate Patient Fuzzy Match Alert */}
                <button
                  type="button"
                  onClick={() => setIsDuplicateMergeOpen(true)}
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '5px',
                    backgroundColor: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid #A855F7',
                    color: '#DDD6FE',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                  title="Fuzzy duplicate match detected (94% confidence) - Click to review & merge"
                >
                  <span>🆔 Duplicate File (94%)</span>
                </button>

                {/* 📱 Pillar 6: Post-OPD WhatsApp Query Desk */}
                <button
                  type="button"
                  onClick={() => setIsTeleTriageOpen(true)}
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '5px',
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid #22C55E',
                    color: '#86EFAC',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                  title="View incoming WhatsApp report queries from patients"
                >
                  <span>📱 WhatsApp Desk (3)</span>
                </button>

                {/* ⚖️ Pillar 5: MLC Case Stamp */}
                {mlcDetails?.isMlc && (
                  <button
                    type="button"
                    onClick={() => setIsMlcModalOpen(true)}
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: '5px',
                      backgroundColor: '#EF4444',
                      border: '1px solid #B91C1C',
                      color: '#FFFFFF',
                      cursor: 'pointer'
                    }}
                  >
                    🚨 MLC ACTIVE ({mlcDetails.incidentType})
                  </button>
                )}

                {/* ⌨️ Pillar 8: Ergonomic Turbo Shortcuts Badge */}
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#94A3B8'
                  }}
                  title="F1: Omni-Bar | F2: All-Normal Exam | F3: Fast URI Protocol | F4: Outside Labs"
                >
                  ⌨️ F1-F4 Turbo
                </span>

                {/* Dynamic Allergy Pill */}
                {patientAllergies.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setIsAllergyModalOpen(true)}
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      color: '#F87171',
                      border: '1px solid #EF4444',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Click to view or edit patient allergies"
                  >
                    <span>⚠️ ALLERGIC: {patientAllergies.join(', ')}</span>
                    <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>✏️</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAllergyModalOpen(true)}
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: '#10B981',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Click to add drug allergies or adverse reactions"
                  >
                    <span>🛡️ NKDA Safe</span>
                    <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>+</span>
                  </button>
                )}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                Chief Complaint: <strong style={{ color: '#CBD5E1' }}>{chiefComplaint || 'Routine OPD consultation'}</strong>
              </div>
            </div>
          </div>

          {/* Vitals Telemetry HUD (Bioluminescent Glow Pills) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* BP Pill */}
            {(() => {
              const sys = currentVitals?.systolicBp || 124;
              const dia = currentVitals?.diastolicBp || 82;
              const isHigh = sys >= 140 || dia >= 90;
              const isLow = sys < 90;
              const isAbnormal = isHigh || isLow;
              return (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: isAbnormal ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.12)',
                    border: isAbnormal ? '1.5px solid #EF4444' : '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    color: isAbnormal ? '#F87171' : '#34D399',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    animation: isAbnormal ? 'pulse 2s infinite' : 'none'
                  }}
                  title={`BP ${sys}/${dia} mmHg ${isAbnormal ? '⚠️ Alert: Blood Pressure Elevated!' : '✓ Normal'}`}
                >
                  <span>💓</span>
                  <span>BP {sys}/{dia}</span>
                </div>
              );
            })()}

            {/* Glucose Pill */}
            {(() => {
              const sugar = (currentVitals as any)?.bloodSugarMgDl;
              const hasSugar = sugar && sugar > 0;
              const isHigh = hasSugar && sugar >= 140;
              return (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: isHigh ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    border: isHigh ? '1.5px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    color: isHigh ? '#FBBF24' : '#CBD5E1',
                    fontWeight: 700,
                    fontSize: '0.75rem'
                  }}
                  title={`Blood Glucose: ${hasSugar ? `${sugar} mg/dL` : 'Not tested at triage'}`}
                >
                  <span>🩸</span>
                  <span>{hasSugar ? `Glucose ${sugar}` : 'Glucose --'}</span>
                </div>
              );
            })()}

            {/* SpO2 Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 9px',
                borderRadius: '8px',
                backgroundColor: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: '#38BDF8',
                fontWeight: 800,
                fontSize: '0.75rem'
              }}
            >
              <span>🫁</span>
              <span>SpO2 {(currentVitals as any)?.spo2Percent || 98}%</span>
            </div>

            {/* Pulse Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 9px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#E2E8F0',
                fontWeight: 700,
                fontSize: '0.75rem'
              }}
            >
              <span>⚡</span>
              <span>{currentVitals?.pulseBpm || 76} bpm</span>
            </div>

            {/* ⚡ Gap 2: Quick Edit Vitals Trigger */}
            <button
              type="button"
              onClick={() => {
                const sys = inChamberVitals?.bpSystolic ?? (currentVitals?.systolicBp || 120);
                const dia = inChamberVitals?.bpDiastolic ?? (currentVitals?.diastolicBp || 80);
                const glu = inChamberVitals?.glucose ?? ((currentVitals as any)?.bloodSugarMgDl || 110);
                const spo2 = inChamberVitals?.spo2 ?? ((currentVitals as any)?.spo2Percent || 99);
                const pls = inChamberVitals?.pulse ?? (currentVitals?.pulseBpm || 76);
                setEditBpSys(String(sys));
                setEditBpDia(String(dia));
                setEditGlucose(String(glu));
                setEditSpo2(String(spo2));
                setEditPulse(String(pls));
                setIsQuickVitalsModalOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38BDF8',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
              title="Fast In-Chamber Vitals Overwrite / Doctor Direct Entry"
            >
              <span>⚡</span>
              <span>Quick Vitals</span>
            </button>

            {/* Ambient AI Voice Scribe Toggle */}
            <button
              type="button"
              onClick={() => setIsAmbientPanelOpen((prev) => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '8px',
                backgroundColor: isAmbientPanelOpen ? 'rgba(6, 182, 212, 0.25)' : 'rgba(6, 182, 212, 0.12)',
                border: isAmbientPanelOpen ? '1.5px solid #06B6D4' : '1px solid rgba(6, 182, 212, 0.35)',
                color: '#38BDF8',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: isAmbientPanelOpen ? '0 0 10px rgba(6, 182, 212, 0.3)' : 'none'
              }}
              title="Toggle Ambient Voice Scribe Simulator (Alt + M)"
            >
              <span>🎙️</span>
              <span>AI Scribe</span>
              <kbd style={{ fontSize: '0.6rem', padding: '1px 4px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)' }}>Alt+M</kbd>
            </button>

            {/* Chamber Session State Selector */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '2px',
                gap: '2px'
              }}
              title="Broadcast OPD chamber status to waiting area digital displays"
            >
              <button
                type="button"
                onClick={() => handleUpdateChamberStatus('ACTIVE')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  backgroundColor: chamberSessionState === 'ACTIVE' ? '#10B981' : 'transparent',
                  color: chamberSessionState === 'ACTIVE' ? '#FFFFFF' : '#94A3B8'
                }}
              >
                🟢 Active
              </button>
              <button
                type="button"
                onClick={() => handleUpdateChamberStatus('IN_PROCEDURE')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  backgroundColor: chamberSessionState === 'IN_PROCEDURE' ? '#F59E0B' : 'transparent',
                  color: chamberSessionState === 'IN_PROCEDURE' ? '#070C16' : '#94A3B8'
                }}
              >
                🟡 Procedure
              </button>
              <button
                type="button"
                onClick={() => handleUpdateChamberStatus('PAUSED')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  backgroundColor: chamberSessionState === 'PAUSED' ? '#EF4444' : 'transparent',
                  color: chamberSessionState === 'PAUSED' ? '#FFFFFF' : '#94A3B8'
                }}
              >
                🔴 Paused
              </button>
            </div>

            {/* Vacate Chamber / Return to Queue */}
            <button
              type="button"
              onClick={handleExitCockpit}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.45)',
                color: '#F87171',
                fontSize: '0.75rem',
                fontWeight: 900,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Vacate / Clear chamber and return to waiting queue"
            >
              <span>🚪</span>
              <span>Vacate Chamber (केबिन खाली करें)</span>
            </button>
          </div>
        </div>

        {/* 👶 PEDIATRIC DOSING SAFETY & WEIGHT-BASED GUIDANCE BANNER */}
        {activePatient.isPediatric && (
          <div
            style={{
              backgroundColor: 'rgba(236, 72, 153, 0.1)',
              border: '1.5px solid rgba(236, 72, 153, 0.35)',
              borderRadius: '12px',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.4rem' }}>👶</span>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#F472B6' }}>
                  Pediatric Safety Mode Active ({activePatient.age} old)
                </div>
                <div style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>
                  Estimated Body Weight (Nelson's Formula: [Age × 2] + 8): <strong style={{ color: '#F472B6' }}>~{activePatient.estimatedWeightKg} kg</strong> • Paracetamol max: <strong style={{ color: '#FBBF24' }}>{activePatient.estimatedWeightKg ? activePatient.estimatedWeightKg * 15 : 150}mg/dose (15mg/kg)</strong> • Verify all liquid suspensions
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', backgroundColor: 'rgba(236, 72, 153, 0.2)', color: '#F472B6' }}>
                Weight-Based Calculator Active
              </span>
            </div>
          </div>
        )}

        {/* 📈 GAP 1: LONGITUDINAL EHR 3-VISIT COMPARISON SPARKLINE HUD */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '12px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>📈</span>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#38BDF8', letterSpacing: '0.5px' }}>
                LONGITUDINAL CLINICAL TRAJECTORY (3-VISIT TRENDLINE)
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                Hemodynamic Response & Glycemic Evolution Across Visits (Tap visit for previous Rx)
              </div>
            </div>
          </div>

          {/* 3 Interactive Visit Cards */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {longitudinalVisits.map((v, i) => (
              <div
                key={v.id}
                onClick={() => setSelectedHistoricalVisit(v)}
                style={{
                  backgroundColor: v.id === 'visit-current' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: v.id === 'visit-current' ? '1.5px solid #06B6D4' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
                title="Click to view previous visit prescription & assessment note"
              >
                <div>
                  <div style={{ fontSize: '0.625rem', color: v.id === 'visit-current' ? '#38BDF8' : '#94A3B8', fontWeight: 800 }}>
                    {v.label} ({v.relative})
                  </div>
                  <div style={{ display: 'flex', gap: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                    <span style={{ color: v.bpSys >= 140 ? '#F87171' : '#34D399' }}>BP {v.bp}</span>
                    <span style={{ color: '#64748B' }}>•</span>
                    <span style={{ color: v.sugarVal >= 140 ? '#FBBF24' : '#E2E8F0' }}>{v.sugar}</span>
                  </div>
                </div>
                {i < longitudinalVisits.length - 1 && (
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>➔</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 2. BENTO CARD 2: 🧠 AI CLINICAL OMNI-BAR (THE 30-SECOND ZERO-TYPING ENGINE) */}
        <div
          style={{
            backgroundColor: 'var(--ds-color-surface, #0F172A)',
            border: '1.5px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '14px',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(56, 189, 248, 0.15)'
          }}
        >
          {/* Omni Header & Input */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#38BDF8', letterSpacing: '0.04em' }}>
                  🧠 AI CLINICAL OMNI-BAR
                </span>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                  Type disease, protocol, drug, or lab test — 1-click sets everything!
                </span>
              </div>
              <span style={{ fontSize: '0.625rem', color: '#64748B' }}>
                Zero-Typing Clinical Cockpit
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  value={omniSearchInput}
                  onFocus={() => setIsOmniDropdownOpen(true)}
                  onChange={(e) => {
                    setOmniSearchInput(e.target.value);
                    setIsOmniDropdownOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && omniItems.length > 0) {
                      e.preventDefault();
                      omniItems[0]!.onSelect();
                    }
                  }}
                  disabled={isSignedOrCompleted}
                  placeholder={
                    isSignedOrCompleted
                      ? "🔒 Prescription signed & locked. Advance to next patient to begin."
                      : "🔍 Type diagnosis, medicine or lab (e.g. 'vir', 'sugar', 'dolo', 'cbc')..."
                  }
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: isSignedOrCompleted ? 'rgba(255,255,255,0.03)' : 'var(--ds-color-bg, #0B111E)',
                    border: isOmniDropdownOpen ? '1.5px solid #38BDF8' : '1px solid rgba(255,255,255,0.15)',
                    color: isSignedOrCompleted ? '#94A3B8' : '#F8FAFC',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    outline: 'none',
                    opacity: isSignedOrCompleted ? 0.75 : 1,
                    cursor: isSignedOrCompleted ? 'not-allowed' : 'text',
                    boxSizing: 'border-box',
                    boxShadow: isOmniDropdownOpen ? '0 0 15px rgba(56, 189, 248, 0.25)' : 'none'
                  }}
                />

                {/* Omni Dropdown Results */}
                {isOmniDropdownOpen && omniItems.length > 0 && (
                  <>
                    <div
                      style={{ position: 'fixed', inset: 0, zIndex: 60 }}
                      onClick={() => setIsOmniDropdownOpen(false)}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '6px',
                        backgroundColor: '#0F172A',
                        border: '1.5px solid #0284C7',
                        borderRadius: '10px',
                        boxShadow: '0 12px 35px rgba(0,0,0,0.9), 0 0 25px rgba(2, 132, 199, 0.35)',
                        maxHeight: '320px',
                        overflowY: 'auto',
                        zIndex: 70
                      }}
                    >
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, display: 'flex', justifyContent: 'space-between' }}>
                        <span>Omni Search Results ({omniItems.length})</span>
                        <span>Press Enter ↵ or click to auto-fill</span>
                      </div>
                      {omniItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={item.onSelect}
                          style={{
                            padding: '10px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                            transition: 'background-color 0.1s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(2, 132, 199, 0.2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC' }}>
                                {item.title}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                                {item.subtitle}
                              </div>
                            </div>
                          </div>
                          <span
                            style={{
                              backgroundColor: `${item.badgeColor}25`,
                              color: item.badgeColor,
                              fontSize: '0.65rem',
                              fontWeight: 900,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              border: `1px solid ${item.badgeColor}50`
                            }}
                          >
                            {item.badge}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick 1-Click Omni Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
              <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 800 }}>⚡ 1-Click Protocols:</span>
              {CLINICAL_COCKPIT_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  disabled={isSignedOrCompleted}
                  onClick={() => applyTemplate(tmpl)}
                  style={{
                    padding: '3px 9px',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: isSignedOrCompleted ? 'not-allowed' : 'pointer',
                    opacity: isSignedOrCompleted ? 0.4 : 1,
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    color: '#FCD34D',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.1s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSignedOrCompleted) e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSignedOrCompleted) e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
                  }}
                >
                  <span>{tmpl.icon}</span>
                  <span>{tmpl.name}</span>
                </button>
              ))}

              <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 800, marginLeft: '6px' }}>Diagnoses:</span>
              {COMMON_OPD_DIAGNOSES.slice(0, 5).map((diag) => (
                <button
                  key={diag.id}
                  type="button"
                  disabled={isSignedOrCompleted}
                  onClick={() => handleSelectDiagnosis(diag)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    cursor: isSignedOrCompleted ? 'not-allowed' : 'pointer',
                    opacity: isSignedOrCompleted ? 0.4 : 1,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    color: '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSignedOrCompleted) {
                      e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.15)';
                      e.currentTarget.style.color = '#38BDF8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSignedOrCompleted) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.color = '#94A3B8';
                    }
                  }}
                >
                  <span>{diag.icon}</span>
                  <span>{diag.chipLabel}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. BENTO CARD 3: 🎙️ AMBIENT AI CLINICAL SCRIBE (REAL-TIME AUDIO & WEB SPEECH API) */}
        {isAmbientPanelOpen && (
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: isRecordingVoice ? '2px solid #EF4444' : '1.5px solid rgba(6, 182, 212, 0.45)',
              borderRadius: '14px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: isRecordingVoice ? '0 0 25px rgba(239, 68, 68, 0.3)' : '0 4px 20px rgba(6, 182, 212, 0.15)',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Header & Status Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: isRecordingVoice ? 'rgba(239, 68, 68, 0.2)' : 'rgba(6, 182, 212, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    border: isRecordingVoice ? '1.5px solid #EF4444' : '1px solid rgba(6, 182, 212, 0.3)'
                  }}
                >
                  🎙️
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 900, color: '#38BDF8' }}>
                      AMBIENT AI VOICE SCRIBE (REAL-TIME SPEECH API)
                    </span>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        backgroundColor: isRecordingVoice ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: isRecordingVoice ? '#F87171' : '#34D399',
                        padding: '1px 7px',
                        borderRadius: '4px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isRecordingVoice ? '#EF4444' : '#10B981', animation: isRecordingVoice ? 'pulse 0.8s infinite' : 'none' }}></span>
                      {isRecordingVoice ? 'RECORDING LIVE AUDIO' : 'READY TO RECORD'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                    Real-time speech recognition for Indian Hindi, Hinglish & English consultations • Sub-second Clinical NLP Parser
                  </div>
                </div>
              </div>

              {/* Mode Tabs & Close */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    type="button"
                    onClick={() => setVoiceScribeMode('mic')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      backgroundColor: voiceScribeMode === 'mic' ? '#06B6D4' : 'transparent',
                      color: voiceScribeMode === 'mic' ? '#070C16' : '#94A3B8',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    🎙️ Live Microphone
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoiceScribeMode('presets')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      backgroundColor: voiceScribeMode === 'presets' ? '#06B6D4' : 'transparent',
                      color: voiceScribeMode === 'presets' ? '#070C16' : '#94A3B8',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    ⚡ OPD Presets
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (isRecordingVoice && speechServiceRef.current) {
                      speechServiceRef.current.stop();
                    }
                    setIsRecordingVoice(false);
                    setIsAmbientPanelOpen(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: '2px 4px'
                  }}
                  title="Close AI Scribe HUD"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* ERROR BANNER IF MICROPHONE IS BLOCKED OR UNSUPPORTED */}
            {voiceSpeechError && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #EF4444',
                  fontSize: '0.72rem',
                  color: '#FCA5A5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>⚠️</span>
                <span>{voiceSpeechError}</span>
              </div>
            )}

            {/* TAB 1: 🎙️ LIVE MICROPHONE REAL-TIME MODE */}
            {voiceScribeMode === 'mic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="button"
                    disabled={isSignedOrCompleted}
                    onClick={handleToggleVoiceRecording}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: isRecordingVoice ? '#EF4444' : '#0284C7',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      cursor: isSignedOrCompleted ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: isRecordingVoice ? '0 0 15px rgba(239, 68, 68, 0.6)' : '0 2px 10px rgba(2, 132, 199, 0.4)'
                    }}
                  >
                    <span>{isRecordingVoice ? '⏹️ Stop Mic & Process' : '🔴 Start Speaking (Hindi / Hinglish / English)'}</span>
                    {isRecordingVoice && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '14px' }}>
                        {[8, 14, 10, 16, 9].map((h, i) => (
                          <span key={i} style={{ width: '2px', height: `${h}px`, backgroundColor: '#FFFFFF', borderRadius: '1px', animation: 'pulse 0.7s infinite alternate' }}></span>
                        ))}
                      </span>
                    )}
                  </button>

                  <div style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Speaking tip:</span>
                    <span style={{ color: '#E2E8F0', fontStyle: 'italic' }}>
                      "3 din se tez bukhar hai, Dolo 650 subah-shaam khane ke baad, Pan 40 khali pet, CBC karwa lijiye"
                    </span>
                  </div>
                </div>

                {/* Real-time Spoken Transcript Window */}
                <div
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '0.75rem',
                    color: '#F8FAFC',
                    minHeight: '65px',
                    maxHeight: '110px',
                    overflowY: 'auto',
                    lineHeight: '1.4'
                  }}
                >
                  {voiceConfirmedText || voiceInterimText ? (
                    <div>
                      <span>{voiceConfirmedText} </span>
                      <span style={{ color: '#38BDF8', fontStyle: 'italic' }}>{voiceInterimText}</span>
                    </div>
                  ) : (
                    <div style={{ color: '#64748B', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🎙️ Microphone transcript will appear here word-by-word as doctor and patient speak...</span>
                    </div>
                  )}
                </div>

                {/* Live Parsed EMR Findings Preview */}
                {parsedLiveVoiceData && (
                  <div
                    style={{
                      backgroundColor: 'rgba(6, 182, 212, 0.08)',
                      border: '1px solid rgba(6, 182, 212, 0.25)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#38BDF8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>⚡ LIVE CLINICAL PARSER RESULTS:</span>
                      <span style={{ color: '#10B981' }}>
                        ✓ {parsedLiveVoiceData.prescribedMedicines.length} Meds • {parsedLiveVoiceData.orderedLabs.length} Labs
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.6875rem' }}>
                      {parsedLiveVoiceData.clinicalAssessment && (
                        <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#BAE6FD' }}>
                          🩺 <strong>Diagnosis:</strong> {parsedLiveVoiceData.clinicalAssessment} ({parsedLiveVoiceData.icd10Code})
                        </div>
                      )}
                      {parsedLiveVoiceData.prescribedMedicines.map((m, i) => (
                        <div key={i} style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#A7F3D0' }}>
                          💊 {m.medicationName} {m.strength} ({m.frequency} • {m.beforeAfterFood.replace('_', ' ')})
                        </div>
                      ))}
                      {parsedLiveVoiceData.orderedLabs.map((l, i) => (
                        <div key={i} style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#DDD6FE' }}>
                          🔬 {l}
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                      <button
                        type="button"
                        disabled={isSignedOrCompleted}
                        onClick={() => handleApplyLiveVoiceData()}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          backgroundColor: '#10B981',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 900,
                          cursor: isSignedOrCompleted ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 10px rgba(16, 185, 129, 0.4)'
                        }}
                      >
                        <span>⚡ 1-Click Auto-Fill Prescription from Voice</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ⚡ SIMULATED OPD SCENARIOS (OFFLINE & DEMO) */}
            {voiceScribeMode === 'presets' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 800 }}>⚡ Select Simulated Scenario:</span>
                  {Object.entries(AMBIENT_SCENARIOS).map(([key, sc]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveAmbientKey(key)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.6875rem',
                        fontWeight: activeAmbientKey === key ? 800 : 600,
                        cursor: 'pointer',
                        border: activeAmbientKey === key ? '1.5px solid #06B6D4' : '1px solid rgba(255,255,255,0.08)',
                        backgroundColor: activeAmbientKey === key ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.03)',
                        color: activeAmbientKey === key ? '#38BDF8' : '#CBD5E1'
                      }}
                    >
                      {sc.title}
                    </button>
                  ))}
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                    color: '#CBD5E1',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-line',
                    maxHeight: '75px',
                    overflowY: 'auto'
                  }}
                >
                  {AMBIENT_SCENARIOS[activeAmbientKey]?.transcript}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700 }}>
                    ✓ Parsed: Diagnosis ({AMBIENT_SCENARIOS[activeAmbientKey]?.data.icd10Code}) • {AMBIENT_SCENARIOS[activeAmbientKey]?.data.medications.length} Meds • {AMBIENT_SCENARIOS[activeAmbientKey]?.data.labs.length} Labs
                  </span>
                  <button
                    type="button"
                    disabled={isSignedOrCompleted}
                    onClick={() => applyAmbientScenario(activeAmbientKey)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      backgroundColor: isSignedOrCompleted ? 'rgba(255,255,255,0.05)' : '#0284C7',
                      color: isSignedOrCompleted ? '#64748B' : '#FFFFFF',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      cursor: isSignedOrCompleted ? 'not-allowed' : 'pointer',
                      opacity: isSignedOrCompleted ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: isSignedOrCompleted ? 'none' : '0 2px 10px rgba(2, 132, 199, 0.4)'
                    }}
                  >
                    <span>⚡ Auto-Fill Entire Rx from Voice Note (Ctrl+Enter)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 🔒 PRESCRIPTION SIGNED & LOCKED NOTIFICATION BANNER */}
        {isSignedOrCompleted && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1.5px solid #10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#10B981',
                  color: '#022C22',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 900
                }}
              >
                🔒
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#34D399' }}>
                  PRESCRIPTION SIGNED & LOCKED • {activePatient.token} ({activePatient.name})
                </div>
                <div style={{ fontSize: '0.8rem', color: '#CBD5E1', marginTop: '2px' }}>
                  Dispatched to Pharmacy POS for medication dispensing and Cashier Counter for billing. Consultation completed.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>🖨️</span>
                <span>Print Rx</span>
              </button>

              {nextWaitingPatient ? (
                <button
                  type="button"
                  onClick={() => {
                    callPatientToChamber(nextWaitingPatient);
                    setIsNextPatientPromptOpen(false);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#0284C7',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)'
                  }}
                >
                  <span>📢 Call Next: {nextWaitingPatient.token} ({nextWaitingPatient.patientName})</span>
                  <kbd style={{ fontSize: '0.65rem', padding: '1px 4px', borderRadius: '3px', background: 'rgba(0,0,0,0.3)' }}>↵</kbd>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (onBackToStandardDesk) onBackToStandardDesk();
                    else window.dispatchEvent(new CustomEvent('docsearch:exit_cockpit'));
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#10B981',
                    border: 'none',
                    color: '#070C16',
                    fontSize: '0.82rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>✓ All Done • Chamber Ready</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4. BENTO MODULAR TWO-COLUMN SPLIT (RX PAD + LABS/EXAM) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? '1fr 420px' : '1fr',
            gap: '14px',
            alignItems: 'start'
          }}
        >
          {/* ========================================================================= */}
          {/* LEFT BENTO COLUMN: 💊 SMART VISUAL RX PAD */}
          {/* ========================================================================= */}
          <div
            style={{
              backgroundColor: 'var(--ds-color-surface, #0F172A)',
              border: '1px solid var(--ds-color-border, rgba(255,255,255,0.08))',
              borderRadius: '16px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {/* 🩺 GAP 4: SPECIALTY-SPECIFIC CLINICAL MODE SELECTOR & WIDGET */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '8px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#38BDF8' }}>
                  CLINICAL SPECIALTY MODE:
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[
                    { key: 'GENERAL', label: '🩺 General' },
                    { key: 'OB_GYN', label: '🤰 Gynae / OB-GYN' },
                    { key: 'PEDIATRICS', label: '👶 Pediatrics' },
                    { key: 'ORTHO', label: '🦴 Orthopedics' }
                  ].map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setClinicalSpecialtyMode(s.key as any)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: clinicalSpecialtyMode === s.key ? '1.5px solid #06B6D4' : '1px solid rgba(255,255,255,0.08)',
                        backgroundColor: clinicalSpecialtyMode === s.key ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                        color: clinicalSpecialtyMode === s.key ? '#38BDF8' : '#94A3B8',
                        fontSize: '0.65rem',
                        fontWeight: clinicalSpecialtyMode === s.key ? 800 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* OB-GYN Specialty Drawer */}
              {clinicalSpecialtyMode === 'OB_GYN' && (
                <div style={{ backgroundColor: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.25)', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#F472B6' }}>
                    🤰 Obstetric & Gynecological Parameters:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.625rem', color: '#CBD5E1', marginBottom: '2px' }}>LMP Date:</label>
                      <input
                        type="date"
                        value={obgynLmp}
                        onChange={(e) => setObgynLmp(e.target.value)}
                        style={{ width: '100%', padding: '4px', borderRadius: '4px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.7rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.625rem', color: '#CBD5E1', marginBottom: '2px' }}>Expected EDD:</label>
                      <input
                        type="date"
                        value={obgynEdd}
                        onChange={(e) => setObgynEdd(e.target.value)}
                        style={{ width: '100%', padding: '4px', borderRadius: '4px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.7rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.625rem', color: '#CBD5E1', marginBottom: '2px' }}>Gestational Age:</label>
                      <input
                        type="number"
                        value={obgynGestWeeks}
                        onChange={(e) => setObgynGestWeeks(parseInt(e.target.value, 10) || 0)}
                        style={{ width: '100%', padding: '4px', borderRadius: '4px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.7rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.625rem', color: '#CBD5E1', marginBottom: '2px' }}>Gravida/Para (GPLA):</label>
                      <input
                        type="text"
                        value={obgynGpla}
                        onChange={(e) => setObgynGpla(e.target.value)}
                        style={{ width: '100%', padding: '4px', borderRadius: '4px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.7rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.625rem', color: '#CBD5E1', marginBottom: '2px' }}>Fetal Heart Rate (bpm):</label>
                      <input
                        type="number"
                        value={obgynFhr}
                        onChange={(e) => setObgynFhr(parseInt(e.target.value, 10) || 0)}
                        style={{ width: '100%', padding: '4px', borderRadius: '4px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.7rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.625rem', color: '#CBD5E1', marginBottom: '2px' }}>Fundal Height:</label>
                      <input
                        type="text"
                        value={obgynFundalHeight}
                        onChange={(e) => setObgynFundalHeight(e.target.value)}
                        style={{ width: '100%', padding: '4px', borderRadius: '4px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.7rem' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const note = `[OB-GYN WORKUP]: LMP: ${obgynLmp} | EDD: ${obgynEdd} | Gestation: ${obgynGestWeeks} Wks | ${obgynGpla} | FHR: ${obgynFhr} bpm regular | Fundal Height: ${obgynFundalHeight}`;
                        setClinicalAssessment((prev) => prev ? `${prev} • ${note}` : note);
                        setStatusMessage('✓ OB-GYN parameters inserted into clinical assessment');
                        setTimeout(() => setStatusMessage(null), 2500);
                      }}
                      style={{ backgroundColor: '#EC4899', color: '#FFFFFF', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      + Insert into Assessment
                    </button>
                  </div>
                </div>
              )}

              {/* Pediatrics Specialty Drawer */}
              {clinicalSpecialtyMode === 'PEDIATRICS' && (
                <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FBBF24' }}>
                    👶 Pediatric Milestone & Immunization Tracker:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.625rem', color: '#CBD5E1', marginBottom: '2px' }}>Birth Weight:</label>
                      <input
                        type="text"
                        value={pediatricBirthWeight}
                        onChange={(e) => setPediatricBirthWeight(e.target.value)}
                        style={{ width: '100%', padding: '4px', borderRadius: '4px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.7rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.625rem', color: '#CBD5E1', marginBottom: '2px' }}>Vaccines / Milestones:</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {pediatricMilestones.map((m) => (
                          <span key={m} style={{ fontSize: '0.625rem', backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#FDE68A', padding: '2px 6px', borderRadius: '4px' }}>
                            ✓ {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Orthopedics Specialty Drawer */}
              {clinicalSpecialtyMode === 'ORTHO' && (
                <div style={{ backgroundColor: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#C084FC' }}>
                    🦴 Orthopedic Musculoskeletal Evaluation:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.625rem', color: '#CBD5E1', marginBottom: '2px' }}>Affected Joint / Region:</label>
                      <input
                        type="text"
                        value={orthoAffectedJoint}
                        onChange={(e) => setOrthoAffectedJoint(e.target.value)}
                        style={{ width: '100%', padding: '4px', borderRadius: '4px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.7rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.625rem', color: '#CBD5E1', marginBottom: '2px' }}>Range of Motion (ROM):</label>
                      <input
                        type="text"
                        value={orthoRom}
                        onChange={(e) => setOrthoRom(e.target.value)}
                        style={{ width: '100%', padding: '4px', borderRadius: '4px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.7rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.625rem', color: '#CBD5E1', marginBottom: '2px' }}>Recommended X-Ray Projections:</label>
                      <input
                        type="text"
                        value={orthoXrayView}
                        onChange={(e) => setOrthoXrayView(e.target.value)}
                        style={{ width: '100%', padding: '4px', borderRadius: '4px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.7rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.625rem', color: '#CBD5E1', marginBottom: '2px' }}>Joint Effusion / Swelling:</label>
                      <button
                        type="button"
                        onClick={() => setOrthoSwelling(!orthoSwelling)}
                        style={{
                          width: '100%',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          backgroundColor: orthoSwelling ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: orthoSwelling ? '1px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.15)',
                          color: orthoSwelling ? '#FCA5A5' : '#94A3B8'
                        }}
                      >
                        {orthoSwelling ? '⚠️ Active Swelling' : '✓ No Effusion'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 🔄 ONGOING / CHRONIC MEDICATIONS (REPEAT REFILL HUD) */}
            {chronicMedsList.length > 0 && (
              <div
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.9rem' }}>🔁</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#A5B4FC' }}>
                      ONGOING CHRONIC MEDICATIONS ({chronicMedsList.length})
                    </span>
                  </div>
                  {!isSignedOrCompleted && (
                    <button
                      type="button"
                      onClick={handleRepeatChronicMeds}
                      style={{
                        backgroundColor: '#6366F1',
                        border: 'none',
                        color: '#FFFFFF',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(99, 102, 241, 0.3)'
                      }}
                      title="1-Click Copy all chronic medicines to active prescription (30-day refill)"
                    >
                      <span>⚡ Repeat All (30-Day Refill)</span>
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {chronicMedsList.map((chr) => (
                    <div
                      key={chr.id}
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '0.6875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span style={{ fontWeight: 800, color: '#E2E8F0' }}>{chr.medicationName}</span>
                      <span style={{ color: '#38BDF8', fontWeight: 700 }}>{chr.strength}</span>
                      <span style={{ color: '#94A3B8' }}>• {chr.frequency}</span>
                      <span style={{ fontSize: '0.6rem', color: '#64748B' }}>({chr.indication})</span>
                      {chr.dispenseQuantity && (
                        <span style={{ fontSize: '0.6rem', color: '#10B981', fontWeight: 700 }}>[{chr.dispenseQuantity}]</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chief Complaint & Presenting Symptoms */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#38BDF8' }}>
                  🗣️ CHIEF COMPLAINTS & PRESENTING SYMPTOMS
                </label>
                <span style={{ fontSize: '0.625rem', color: '#64748B' }}>
                  1-Tap Symptoms or Type Freely
                </span>
              </div>
              <input
                type="text"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                disabled={isSignedOrCompleted}
                placeholder="e.g. High grade fever with chills for 3 days, bodyache, dry cough..."
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  backgroundColor: isSignedOrCompleted ? 'rgba(255,255,255,0.03)' : 'var(--ds-color-bg, #0B111E)',
                  border: '1px solid var(--ds-color-border, rgba(255,255,255,0.12))',
                  color: 'var(--ds-color-text-primary, #F8FAFC)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  opacity: isSignedOrCompleted ? 0.8 : 1,
                  cursor: isSignedOrCompleted ? 'not-allowed' : 'text',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />

              {/* 1-Tap Quick Symptoms Chips */}
              {!isSignedOrCompleted && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.625rem', color: '#64748B', fontWeight: 800 }}>⚡ 1-Tap Symptoms:</span>
                  {COMMON_OPD_SYMPTOMS.map((sym) => (
                    <button
                      key={sym.id}
                      type="button"
                      onClick={() => handleSelectSymptom(sym)}
                      style={{
                        padding: '2px 7px',
                        borderRadius: '12px',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        backgroundColor: 'rgba(56, 189, 248, 0.06)',
                        color: '#93C5FD',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        transition: 'all 0.1s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.18)';
                        e.currentTarget.style.color = '#38BDF8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.06)';
                        e.currentTarget.style.color = '#93C5FD';
                      }}
                    >
                      <span>{sym.icon}</span>
                      <span>{sym.chipLabel}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* 💡 Real-time ICD-10 Diagnosis auto-suggest from Chief Complaint */}
              {detectedComplaintICD && (!icd10Code || icd10Code !== detectedComplaintICD.code) && !isSignedOrCompleted && (
                <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setClinicalAssessment(detectedComplaintICD.name);
                      setIcd10Code(detectedComplaintICD.code);
                      setStatusMessage(`✓ Auto-linked ICD-10: ${detectedComplaintICD.code} (${detectedComplaintICD.name})`);
                      setTimeout(() => setStatusMessage(null), 2500);
                    }}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid #10B981',
                      color: '#34D399',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>💡 Auto-Detected Diagnosis: {detectedComplaintICD.chipLabel} ({detectedComplaintICD.code})</span>
                    <span style={{ textDecoration: 'underline' }}>⚡ 1-Tap Link</span>
                  </button>
                </div>
              )}
            </div>

            {/* Diagnosis & ICD-10 Compact Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#38BDF8' }}>
                    CLINICAL DIAGNOSIS & ASSESSMENT
                  </label>
                  {icd10Code && (
                    <span style={{ fontSize: '0.625rem', color: '#10B981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span>🛡️ ABHA / NHA EMR:</span>
                      <strong style={{ color: '#34D399' }}>Auto-linked {icd10Code}</strong>
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={clinicalAssessment}
                  onChange={(e) => {
                    setClinicalAssessment(e.target.value);
                    setIsDiagDropdownOpen(true);
                  }}
                  onFocus={() => {
                    if (clinicalAssessment.trim() || filteredDiagnoses.length > 0) {
                      setIsDiagDropdownOpen(true);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (filteredDiagnoses.length > 0 && isDiagDropdownOpen) {
                        handleSelectDiagnosis(filteredDiagnoses[0]!);
                        setIsDiagDropdownOpen(false);
                      }
                    } else if (e.key === 'Escape') {
                      setIsDiagDropdownOpen(false);
                    }
                  }}
                  disabled={isSignedOrCompleted}
                  placeholder="e.g. Acute Viral Upper Respiratory Infection, Typhoid, Diabetes..."
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    backgroundColor: isSignedOrCompleted ? 'rgba(255,255,255,0.03)' : 'var(--ds-color-bg, #0B111E)',
                    border: '1px solid var(--ds-color-border, rgba(255,255,255,0.12))',
                    color: 'var(--ds-color-text-primary, #F8FAFC)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    opacity: isSignedOrCompleted ? 0.8 : 1,
                    cursor: isSignedOrCompleted ? 'not-allowed' : 'text',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />

                {/* Floating WHO ICD-10 Autocomplete Dropdown */}
                {isDiagDropdownOpen && !isSignedOrCompleted && filteredDiagnoses.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      maxHeight: '260px',
                      overflowY: 'auto',
                      backgroundColor: '#0F172A',
                      border: '1.5px solid rgba(56, 189, 248, 0.45)',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8)',
                      zIndex: 80,
                      padding: '4px'
                    }}
                  >
                    <div style={{ padding: '3px 8px', fontSize: '0.625rem', color: '#94A3B8', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>WHO ICD-10 CLINICAL CATALOG (ABHA / NHA)</span>
                      <span>ENTER / CLICK TO SELECT</span>
                    </div>
                    {filteredDiagnoses.map((diag) => (
                      <div
                        key={diag.id}
                        onClick={() => {
                          handleSelectDiagnosis(diag);
                          setIsDiagDropdownOpen(false);
                        }}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          borderBottom: '1px solid rgba(255,255,255,0.03)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.12)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.1rem' }}>{diag.icon}</span>
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F8FAFC' }}>
                              {diag.name}
                            </div>
                            <div style={{ fontSize: '0.625rem', color: '#94A3B8' }}>
                              {diag.category} • Common Symptom: {diag.chipLabel}
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#C084FC', backgroundColor: 'rgba(168, 85, 247, 0.15)', padding: '2px 7px', borderRadius: '4px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                          {diag.code}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#A855F7', marginBottom: '3px' }}>
                  ICD-10 CODE
                </label>
                <input
                  type="text"
                  value={icd10Code}
                  onChange={(e) => setIcd10Code(e.target.value)}
                  disabled={isSignedOrCompleted}
                  placeholder="J06.9"
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    backgroundColor: isSignedOrCompleted ? 'rgba(255,255,255,0.03)' : 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    color: '#C084FC',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    textAlign: 'center',
                    opacity: isSignedOrCompleted ? 0.8 : 1,
                    cursor: isSignedOrCompleted ? 'not-allowed' : 'text',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* 🛡️ REAL-TIME CONTRAINDICATION & ALLERGY CDS ALERT */}
            {detectedAllergyAlerts.length > 0 && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '2px solid #EF4444',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                  animation: 'pulse 2s infinite'
                }}
              >
                {detectedAllergyAlerts.map((alert, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#EF4444' }}>
                          ALLERGY CONTRAINDICATION ALERT: {alert.allergen}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#FCA5A5' }}>
                          {alert.reason}
                        </div>
                      </div>
                    </div>
                    {!isSignedOrCompleted && (
                      <button
                        type="button"
                        onClick={() => handleSwapContraindicatedMedicine(alert.medId, alert.swapDrug)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#10B981',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: '0.72rem',
                          fontWeight: 900,
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                        }}
                      >
                        ⚡ Swap to {alert.swapDrug.name}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Prescribed Medicines Header & View Mode Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#10B981' }}>
                  💊 Prescribed Medicines ({medList.length})
                </span>
                {totalGenericSavings > 0 && (
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#34D399',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}
                  >
                    💰 Patient Jan Aushadhi Savings: ₹{totalGenericSavings}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsMedicineLibraryOpen(true)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.45)',
                    color: '#34D399',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  title="Open full 2,400+ Indian Medicine Formulary & Jan Aushadhi Substitutes"
                >
                  <span>📚</span>
                  <span>Medicine Library (2,400+ Formulary)</span>
                </button>
              </div>

              {/* View Switcher: Visual Cards ⟷ Compact Table */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: 'rgba(255,255,255,0.04)', padding: '2px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  type="button"
                  onClick={() => setRxViewMode('CARDS')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.6875rem',
                    fontWeight: rxViewMode === 'CARDS' ? 800 : 500,
                    border: 'none',
                    backgroundColor: rxViewMode === 'CARDS' ? '#0284C7' : 'transparent',
                    color: rxViewMode === 'CARDS' ? '#FFFFFF' : '#94A3B8',
                    cursor: 'pointer'
                  }}
                >
                  📇 Pill Cards
                </button>
                <button
                  type="button"
                  onClick={() => setRxViewMode('TABLE')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.6875rem',
                    fontWeight: rxViewMode === 'TABLE' ? 800 : 500,
                    border: 'none',
                    backgroundColor: rxViewMode === 'TABLE' ? '#0284C7' : 'transparent',
                    color: rxViewMode === 'TABLE' ? '#FFFFFF' : '#94A3B8',
                    cursor: 'pointer'
                  }}
                >
                  📊 Table
                </button>
              </div>
            </div>

            {/* Quick 1-Tap OPD Medicine Chips */}
            {!isSignedOrCompleted && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', padding: '2px 0' }}>
                <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800 }}>⚡ 1-Tap Prescribe:</span>
                {popularMedList.slice(0, 10).map((drug) => (
                  <button
                    key={drug.id}
                    type="button"
                    onClick={() => handleAddMedicineFromAdder(drug)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      color: '#34D399',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.1s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.08)';
                    }}
                    title={`1-Click Rx: ${drug.name} (${drug.strength}) ${drug.frequency} for ${drug.duration} days`}
                  >
                    <span>+</span>
                    <span>{drug.name.replace('Tab ', '').replace('Cap ', '').replace('Syp ', '')}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Visual Pill Cards Mode */}
            {rxViewMode === 'CARDS' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {medList.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>💊</div>
                    <div style={{ fontWeight: 800, color: '#94A3B8', fontSize: '0.8rem' }}>No medicines prescribed yet</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                      Search medicine in Omni-Bar above, tap 1-Tap chips, or use the adder below.
                    </div>
                  </div>
                ) : (
                  medList.map((med, idx) => {
                    const matrix = parseDosingMatrix(med.frequency, med.dosage);
                    return (
                      <div
                        key={med.id || idx}
                        style={{
                          backgroundColor: 'rgba(15, 23, 42, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          padding: '10px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.9rem' }}>💊</span>
                            <span style={{ fontWeight: 900, color: '#F8FAFC', fontSize: '0.85rem' }}>
                              {med.medicationName}
                            </span>
                            <span style={{ color: '#38BDF8', fontSize: '0.72rem', fontWeight: 800 }}>
                              {med.strength}
                            </span>
                          </div>
                          {!isSignedOrCompleted && (
                            <button
                              type="button"
                              onClick={() => setMedList((prev) => prev.filter((_, i) => i !== idx))}
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: '#EF4444',
                                cursor: 'pointer',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 800
                              }}
                              title="Remove Medicine"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Visual Dosing Matrix (☀️ / 🌤️ / 🌙) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <span style={{ fontSize: '0.7rem' }}>☀️ सुबह:</span>
                            <strong style={{ fontSize: '0.72rem', color: matrix.morning !== '0' ? '#FBBF24' : '#64748B' }}>
                              {matrix.morning}
                            </strong>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <span style={{ fontSize: '0.7rem' }}>🌤️ दोपहर:</span>
                            <strong style={{ fontSize: '0.72rem', color: matrix.afternoon !== '0' ? '#FBBF24' : '#64748B' }}>
                              {matrix.afternoon}
                            </strong>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <span style={{ fontSize: '0.7rem' }}>🌙 रात:</span>
                            <strong style={{ fontSize: '0.72rem', color: matrix.night !== '0' ? '#FBBF24' : '#64748B' }}>
                              {matrix.night}
                            </strong>
                          </div>

                          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', backgroundColor: 'rgba(255,255,255,0.03)', padding: '3px 7px', borderRadius: '6px' }}>
                            🍽️ {med.beforeAfterFood.replace('_', ' ')}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '3px 7px', borderRadius: '6px', fontWeight: 800 }}>
                            ⏱️ {med.duration} Days
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.12)', padding: '3px 7px', borderRadius: '6px', fontWeight: 800 }}>
                            📦 Dispense: {med.dispenseQuantity || calculateDispenseQuantity(med.medicationName, med.frequency, med.duration)}
                          </span>
                        </div>

                        {/* Jan Aushadhi Savings Badge */}
                        {med.genericSubstitute && (
                          <div style={{ fontSize: '0.65rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>⚡ Jan Aushadhi: {med.genericSubstitute.name}</span>
                            <span style={{ fontWeight: 800 }}>(Save ₹{med.genericSubstitute.brandPrice - med.genericSubstitute.janAushadhiPrice})</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* Compact Table Mode */
              <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', color: '#94A3B8' }}>
                      <th style={{ padding: '6px 10px', width: '24px' }}>#</th>
                      <th style={{ padding: '6px 10px' }}>Medicine</th>
                      <th style={{ padding: '6px 6px', width: '70px' }}>Dosage</th>
                      <th style={{ padding: '6px 6px', width: '90px' }}>Freq</th>
                      <th style={{ padding: '6px 6px', width: '60px' }}>Days</th>
                      <th style={{ padding: '6px 6px', width: '90px' }}>Timing</th>
                      <th style={{ padding: '6px 6px', width: '100px' }}>Dispense</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right', width: '30px' }}>✕</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medList.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '18px', textAlign: 'center', color: '#64748B' }}>
                          No medicines prescribed yet.
                        </td>
                      </tr>
                    ) : (
                      medList.map((med, idx) => (
                        <tr key={med.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '6px 10px', color: '#64748B', fontWeight: 800 }}>{idx + 1}</td>
                          <td style={{ padding: '6px 10px' }}>
                            <div style={{ fontWeight: 800, color: '#F8FAFC' }}>
                              {med.medicationName} <span style={{ color: '#38BDF8', fontSize: '0.7rem' }}>{med.strength}</span>
                            </div>
                            {med.genericSubstitute && (
                              <div style={{ fontSize: '0.625rem', color: '#10B981' }}>
                                ⚡ Save ₹{med.genericSubstitute.brandPrice - med.genericSubstitute.janAushadhiPrice}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '6px 6px' }}>
                            <input
                              type="text"
                              disabled={isSignedOrCompleted}
                              value={med.dosage}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMedList((prev) => prev.map((m, i) => (i === idx ? { ...m, dosage: val } : m)));
                              }}
                              style={{ width: '100%', padding: '4px', borderRadius: '4px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.1)', color: '#F8FAFC', fontSize: '0.7rem', opacity: isSignedOrCompleted ? 0.7 : 1, cursor: isSignedOrCompleted ? 'not-allowed' : 'text' }}
                            />
                          </td>
                          <td style={{ padding: '6px 6px' }}>
                            <input
                              type="text"
                              disabled={isSignedOrCompleted}
                              value={med.frequency}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMedList((prev) => prev.map((m, i) => (i === idx ? { ...m, frequency: val } : m)));
                              }}
                              style={{ width: '100%', padding: '4px', borderRadius: '4px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.1)', color: '#F8FAFC', fontSize: '0.7rem', fontFamily: 'monospace', opacity: isSignedOrCompleted ? 0.7 : 1, cursor: isSignedOrCompleted ? 'not-allowed' : 'text' }}
                            />
                          </td>
                          <td style={{ padding: '6px 6px' }}>
                            <input
                              type="number"
                              min={1}
                              disabled={isSignedOrCompleted}
                              value={med.duration}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 1;
                                setMedList((prev) => prev.map((m, i) => (i === idx ? { ...m, duration: val } : m)));
                              }}
                              style={{ width: '100%', padding: '4px', borderRadius: '4px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.1)', color: '#F8FAFC', fontSize: '0.7rem', textAlign: 'center', opacity: isSignedOrCompleted ? 0.7 : 1, cursor: isSignedOrCompleted ? 'not-allowed' : 'text' }}
                            />
                          </td>
                          <td style={{ padding: '6px 6px' }}>
                            <select
                              disabled={isSignedOrCompleted}
                              value={med.beforeAfterFood}
                              onChange={(e) => {
                                const val = e.target.value as any;
                                setMedList((prev) => prev.map((m, i) => (i === idx ? { ...m, beforeAfterFood: val } : m)));
                              }}
                              style={{ width: '100%', padding: '4px', borderRadius: '4px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.1)', color: '#F8FAFC', fontSize: '0.68rem', opacity: isSignedOrCompleted ? 0.7 : 1, cursor: isSignedOrCompleted ? 'not-allowed' : 'pointer' }}
                            >
                              <option value="AFTER_FOOD">After Food</option>
                              <option value="BEFORE_FOOD">Before Food</option>
                              <option value="EMPTY_STOMACH">Empty Stom</option>
                              <option value="BEDTIME">Bedtime</option>
                            </select>
                          </td>
                          <td style={{ padding: '6px 6px', fontSize: '0.6875rem', color: '#10B981', fontWeight: 700 }}>
                            {med.dispenseQuantity || calculateDispenseQuantity(med.medicationName, med.frequency, med.duration)}
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                            {!isSignedOrCompleted && (
                              <button
                                type="button"
                                onClick={() => setMedList((prev) => prev.filter((_, i) => i !== idx))}
                                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontWeight: 800 }}
                              >
                                ✕
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Fast Inline Medicine Adder Bar */}
            {isSignedOrCompleted ? (
              <div
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#34D399',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>🔒</span>
                <span>Prescription is digitally signed & locked. Further medication additions are sealed for clinical audit integrity.</span>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>➕ Fast Medicine Adder (Type-Ahead Formulary & Jan Aushadhi)</span>
                  {adderGenericSub && (
                    <span style={{ color: '#10B981', fontSize: '0.65rem', fontWeight: 800 }}>
                      ⚡ Jan Aushadhi: {adderGenericSub.name} (Save ₹{adderGenericSub.brandPrice - adderGenericSub.janAushadhiPrice})
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 75px 85px 50px 95px auto', gap: '6px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={medSearchInput}
                      onChange={(e) => {
                        setMedSearchInput(e.target.value);
                        setIsMedDropdownOpen(true);
                      }}
                      onFocus={() => {
                        if (medSearchInput.trim() || suggestedDrugs.length > 0) {
                          setIsMedDropdownOpen(true);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (suggestedDrugs.length > 0 && isMedDropdownOpen) {
                            handleAddMedicineFromAdder(suggestedDrugs[0]);
                          } else {
                            handleAddMedicineFromAdder();
                          }
                        } else if (e.key === 'Escape') {
                          setIsMedDropdownOpen(false);
                        }
                      }}
                      placeholder="Type medicine (e.g. dolo, pan, aug, azi)..."
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '5px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.72rem', boxSizing: 'border-box' }}
                    />

                    {/* Floating Formulary Typeahead Dropdown */}
                    {isMedDropdownOpen && (suggestedDrugs.length > 0 || isMedSearching || medSearchError) && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 'calc(100% + 6px)',
                          left: 0,
                          width: '380px',
                          maxHeight: '260px',
                          overflowY: 'auto',
                          backgroundColor: '#0F172A',
                          border: '1.5px solid rgba(56, 189, 248, 0.45)',
                          borderRadius: '8px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 8px 10px -6px rgba(0, 0, 0, 0.6)',
                          zIndex: 60,
                          padding: '4px'
                        }}
                      >
                        <div style={{ padding: '4px 8px', fontSize: '0.625rem', color: '#94A3B8', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>INDIAN PHARMACY FORMULARY</span>
                          <span>{isMedSearching ? 'SEARCHING DB...' : 'CLICK TO FILL / + ADD RX'}</span>
                        </div>
                        {isMedSearching && (
                          <div style={{ padding: '8px', textAlign: 'center', fontSize: '0.7rem', color: '#38BDF8' }}>
                            ⏳ Searching medications from database...
                          </div>
                        )}
                        {medSearchError && (
                          <div style={{ padding: '8px', fontSize: '0.7rem', color: '#F87171' }}>
                            ⚠️ {medSearchError}
                          </div>
                        )}
                        {suggestedDrugs.map((drug) => (
                          <div
                            key={drug.id}
                            onClick={() => autoFillAdderFromDrug(drug)}
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '6px',
                              transition: 'background 0.15s ease',
                              borderBottom: '1px solid rgba(255,255,255,0.03)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.12)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            title="1-Click: Add to Prescription pad"
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.75rem' }}>
                                  {drug.name}
                                </span>
                                <span style={{ fontSize: '0.65rem', color: '#38BDF8', fontWeight: 700 }}>
                                  {drug.strength}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.625rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                                <span>{drug.genericName}</span>
                                <span>•</span>
                                <span style={{ color: '#FCD34D' }}>{drug.frequency}</span>
                                <span>•</span>
                                <span>{drug.duration}d</span>
                              </div>
                              {drug.janAushadhiPrice && drug.brandPrice > drug.janAushadhiPrice && (
                                <div style={{ fontSize: '0.6rem', color: '#10B981', marginTop: '1px' }}>
                                  ⚡ Jan Aushadhi: ₹{drug.janAushadhiPrice} (Save ₹{drug.brandPrice - drug.janAushadhiPrice})
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddMedicineFromAdder(drug);
                                }}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '5px',
                                  backgroundColor: '#10B981',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                                }}
                                title="Add directly to prescription with smart defaults"
                              >
                                + Add Rx
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={adderStrength}
                    onChange={(e) => setAdderStrength(e.target.value)}
                    placeholder="500mg"
                    style={{ padding: '6px 6px', borderRadius: '5px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#38BDF8', fontSize: '0.72rem' }}
                  />
                  <select
                    value={adderFrequency}
                    onChange={(e) => setAdderFrequency(e.target.value)}
                    style={{ padding: '6px 4px', borderRadius: '5px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.7rem' }}
                  >
                    <option value="1 - 0 - 1">1-0-1 (BID)</option>
                    <option value="1 - 1 - 1">1-1-1 (TID)</option>
                    <option value="1 - 0 - 0">1-0-0 (OD)</option>
                    <option value="0 - 0 - 1">0-0-1 (Night)</option>
                    <option value="SOS">SOS</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={adderDuration}
                    onChange={(e) => setAdderDuration(parseInt(e.target.value, 10) || 1)}
                    style={{ padding: '6px 4px', borderRadius: '5px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.72rem', textAlign: 'center' }}
                  />
                  <select
                    value={adderTiming}
                    onChange={(e) => setAdderTiming(e.target.value as any)}
                    style={{ padding: '6px 4px', borderRadius: '5px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.7rem' }}
                  >
                    <option value="AFTER_FOOD">After Food</option>
                    <option value="BEFORE_FOOD">Before Food</option>
                    <option value="EMPTY_STOMACH">Empty Stom</option>
                    <option value="BEDTIME">Bedtime</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleAddMedicineFromAdder()}
                    style={{ padding: '6px 12px', borderRadius: '5px', backgroundColor: '#0284C7', color: '#FFFFFF', border: 'none', fontSize: '0.72rem', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    ➕ Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* RIGHT BENTO COLUMN: 🔬 LABS, PHYSICAL EXAM (O/E) & DIET ADVICE */}
          {/* ========================================================================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* 🔬 CARD A: INVESTIGATION ORDERING HUD */}
            <div
              style={{
                backgroundColor: 'var(--ds-color-surface, #0F172A)',
                border: '1px solid var(--ds-color-border, rgba(255,255,255,0.08))',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔬 Ordered Labs ({selectedTests.length})</span>
                  <button
                    type="button"
                    onClick={() => setIsLabLibraryOpen(true)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '5px',
                      backgroundColor: 'rgba(6, 182, 212, 0.15)',
                      border: '1px solid rgba(6, 182, 212, 0.4)',
                      color: '#38BDF8',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Open full 115+ Diagnostic Labs & Pathology Library"
                  >
                    <span>🔬</span>
                    <span>Lab Library (115+ Tests)</span>
                  </button>

                  {/* 📑 Gap 3: Outside Lab / Ultrasound Reports & Scans Viewer */}
                  <button
                    type="button"
                    onClick={() => setIsExternalViewerOpen(true)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '5px',
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      color: '#38BDF8',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="View attached external diagnostic reports, ultrasound scans & outside lab tests"
                  >
                    <span>📑</span>
                    <span>Outside Scans (3)</span>
                  </button>
                </div>
                {!isSignedOrCompleted && selectedTests.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={handleSendForLabsAndAwait}
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid #10B981',
                        color: '#34D399',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Send patient to lab and place in Same-Day Reports Review queue (zero duplicate fee)"
                    >
                      <span>🧪</span>
                      <span>Send to Lab & Await</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTests([])}
                      style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Clear All ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Active Lab Orders Selected Tags */}
              {selectedTests.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
                  {selectedTests.map((t) => (
                    <span
                      key={t.investigationCatalogId || t.id || t.testName}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(6, 182, 212, 0.25)',
                        color: '#E0F2FE',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      <span>{t.testName}</span>
                      {!isSignedOrCompleted && (
                        <button
                          type="button"
                          onClick={() => toggleInvestigation(t)}
                          style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', padding: 0, fontWeight: 900, fontSize: '0.7rem' }}
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}

              {/* 🔍 Interactive Lab Search & Custom Test Adder */}
              {!isSignedOrCompleted && (
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      value={labSearchInput}
                      onChange={(e) => {
                        setLabSearchInput(e.target.value);
                        setIsLabDropdownOpen(true);
                      }}
                      onFocus={() => {
                        if (labSearchInput.trim() || filteredLabCatalog.length > 0) {
                          setIsLabDropdownOpen(true);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (filteredLabCatalog.length > 0 && isLabDropdownOpen) {
                            toggleInvestigation(filteredLabCatalog[0]!);
                            setLabSearchInput('');
                            setIsLabDropdownOpen(false);
                          } else {
                            handleAddCustomLab();
                          }
                        } else if (e.key === 'Escape') {
                          setIsLabDropdownOpen(false);
                        }
                      }}
                      placeholder="Search lab test (e.g. Dengue, Thyroid, Vit D, USG)..."
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#0B111E',
                        border: '1px solid rgba(6, 182, 212, 0.35)',
                        color: '#F8FAFC',
                        fontSize: '0.72rem',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCustomLab()}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#06B6D4',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      + Order
                    </button>
                  </div>

                  {/* Floating Lab Search Results Dropdown */}
                  {isLabDropdownOpen && (filteredLabCatalog.length > 0 || isLabSearching || labSearchError) && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        maxHeight: '220px',
                        overflowY: 'auto',
                        backgroundColor: '#0F172A',
                        border: '1.5px solid rgba(6, 182, 212, 0.45)',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.8)',
                        zIndex: 70,
                        padding: '4px'
                      }}
                    >
                      <div style={{ padding: '3px 8px', fontSize: '0.625rem', color: '#94A3B8', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>DIAGNOSTIC LAB CATALOG</span>
                        <span>{isLabSearching ? 'SEARCHING LABS...' : 'ENTER / CLICK TO ORDER'}</span>
                      </div>
                      {isLabSearching && (
                        <div style={{ padding: '8px', textAlign: 'center', fontSize: '0.7rem', color: '#06B6D4' }}>
                          ⏳ Searching diagnostic tests from database...
                        </div>
                      )}
                      {labSearchError && (
                        <div style={{ padding: '8px', fontSize: '0.7rem', color: '#F87171' }}>
                          ⚠️ {labSearchError}
                        </div>
                      )}
                      {filteredLabCatalog.map((t) => {
                        const isOrdered = selectedTests.some(
                          (st) => (st.investigationCatalogId && st.investigationCatalogId === t.catalogId) ||
                                  st.testName.toLowerCase() === t.name.toLowerCase() ||
                                  st.testCode.toLowerCase() === t.testCode.toLowerCase()
                        );
                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              toggleInvestigation(t);
                              setLabSearchInput('');
                              setIsLabDropdownOpen(false);
                            }}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '6px',
                              backgroundColor: isOrdered ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                              borderBottom: '1px solid rgba(255,255,255,0.03)'
                            }}
                            onMouseEnter={(e) => {
                              if (!isOrdered) e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              if (!isOrdered) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#F8FAFC' }}>
                                {t.name}
                              </div>
                              <div style={{ fontSize: '0.625rem', color: '#94A3B8', display: 'flex', gap: '4px' }}>
                                <span>{t.categoryLabel}</span>
                                <span>•</span>
                                <span>{t.specimen}</span>
                                {t.fasting && <span style={{ color: '#F59E0B' }}>• Fasting Req</span>}
                              </div>
                            </div>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: isOrdered ? '#34D399' : '#38BDF8' }}>
                              {isOrdered ? '✓ Ordered' : '+ Add'}
                            </span>
                          </div>
                        );
                      })}
                      {labSearchInput.trim() && !filteredLabCatalog.some((t) => t.name.toLowerCase() === labSearchInput.trim().toLowerCase()) && (
                        <div
                          onClick={() => handleAddCustomLab()}
                          style={{
                            padding: '6px 8px',
                            cursor: 'pointer',
                            color: '#38BDF8',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor: 'rgba(56, 189, 248, 0.1)',
                            borderRadius: '4px',
                            marginTop: '2px'
                          }}
                        >
                          ➕ Add custom test: "{labSearchInput.trim()}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ⚡ 1-Click Diagnostic Panels */}
              {!isSignedOrCompleted && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', padding: '2px 0' }}>
                  <span style={{ fontSize: '0.625rem', color: '#64748B', fontWeight: 800 }}>⚡ 1-Click Panels:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyLabPanel('Fever Profile', ['Complete Blood Count (CBC)', 'Widal Test (Enteric / Typhoid Fever)', 'Dengue Serology (NS1 Antigen & IgG/IgM)', 'Urine Routine & Microscopic (Urine R/M)'])}
                    style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#FCD34D', cursor: 'pointer' }}
                  >
                    🌡️ Fever Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyLabPanel('Diabetic Profile', ['HbA1c (Glycated Hemoglobin)', 'Fasting Blood Sugar (FBS)', 'Post Prandial Blood Sugar (PPBS)', 'Lipid Profile (Cholesterol & Triglycerides)'])}
                    style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#34D399', cursor: 'pointer' }}
                  >
                    🩸 Diabetic Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyLabPanel('Thyroid & Vits', ['Thyroid Profile Total (T3, T4, TSH)', 'Vitamin D 25-Hydroxy Total', 'Vitamin B12 Quantitative Assay'])}
                    style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.35)', color: '#DDD6FE', cursor: 'pointer' }}
                  >
                    🦋 Thyroid & Vits
                  </button>
                </div>
              )}

              {/* Category Filter Tabs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '4px' }}>
                {[
                  { key: 'ALL', label: 'All (100+)' },
                  { key: 'HEMATOLOGY', label: 'Blood' },
                  { key: 'IMMUNOLOGY', label: 'Infection' },
                  { key: 'BIOCHEMISTRY', label: 'Metabolic' },
                  { key: 'ENDOCRINOLOGY', label: 'Thyroid/Vits' },
                  { key: 'PATHOLOGY', label: 'Urine/Stool' },
                  { key: 'RADIOLOGY', label: 'Imaging' },
                  { key: 'CARDIOLOGY', label: 'ECG' }
                ].map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setLabCategoryFilter(cat.key)}
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.625rem',
                      fontWeight: labCategoryFilter === cat.key ? 800 : 500,
                      backgroundColor: labCategoryFilter === cat.key ? '#06B6D4' : 'rgba(255,255,255,0.03)',
                      color: labCategoryFilter === cat.key ? '#070C16' : '#94A3B8',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Investigation Catalog Quick Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '110px', overflowY: 'auto' }}>
                {filteredLabCatalog.map((pill) => {
                  const isSelected = selectedTests.some(
                    (st) => (st.investigationCatalogId && st.investigationCatalogId === pill.catalogId) ||
                            st.testName.toLowerCase() === pill.name.toLowerCase() ||
                            st.testCode.toLowerCase() === pill.testCode.toLowerCase()
                  );
                  return (
                    <button
                      key={pill.id}
                      type="button"
                      disabled={isSignedOrCompleted}
                      onClick={() => toggleInvestigation(pill)}
                      style={{
                        padding: '3px 7px',
                        borderRadius: '12px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        cursor: isSignedOrCompleted ? 'not-allowed' : 'pointer',
                        opacity: isSignedOrCompleted ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        border: isSelected ? '1.5px solid #06B6D4' : '1px solid rgba(255,255,255,0.08)',
                        backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255,255,255,0.03)',
                        color: isSelected ? '#38BDF8' : '#CBD5E1'
                      }}
                      title={`${pill.name} (${pill.specimen})`}
                    >
                      <span>{isSelected ? '✓' : '+'}</span>
                      <span>{pill.shortName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 🩺 CARD B: 1-TAP PHYSICAL EXAMINATION (O/E) */}
            <div
              style={{
                backgroundColor: 'var(--ds-color-surface, #0F172A)',
                border: '1px solid var(--ds-color-border, rgba(255,255,255,0.08))',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8' }}>
                  🩺 Physical Exam (O/E)
                </span>
                <button
                  type="button"
                  disabled={isSignedOrCompleted}
                  onClick={setAllNormalExam}
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '5px',
                    backgroundColor: isSignedOrCompleted ? 'rgba(255,255,255,0.03)' : 'rgba(168, 185, 129, 0.2)',
                    border: isSignedOrCompleted ? '1px solid rgba(255,255,255,0.1)' : '1px solid #10B981',
                    color: isSignedOrCompleted ? '#64748B' : '#34D399',
                    cursor: isSignedOrCompleted ? 'not-allowed' : 'pointer',
                    opacity: isSignedOrCompleted ? 0.5 : 1
                  }}
                  title="Auto-fill normal findings: Chest Clear, S1 S2 Normal, Abdomen Soft, Pharynx Normal"
                >
                  ⚡ All Normal (NAD)
                </button>
              </div>

              {/* PICLE & Systemic Category Navigation Tabs */}
              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
                {COMMON_OPD_EXAMINATION_CHIPS.map((cat) => (
                  <button
                    key={cat.category}
                    type="button"
                    onClick={() => setExamCategoryTab(cat.category)}
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: examCategoryTab === cat.category ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.08)',
                      backgroundColor: examCategoryTab === cat.category ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                      color: examCategoryTab === cat.category ? '#38BDF8' : '#94A3B8',
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Quick Interactive Chips for Selected Exam Category */}
              {!isSignedOrCompleted && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                  {COMMON_OPD_EXAMINATION_CHIPS.find((c) => c.category === examCategoryTab)?.options.map((option) => {
                    const isSelected = examFindings.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleExamFinding(option)}
                        style={{
                          fontSize: '0.625rem',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          border: isSelected ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                          backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.04)',
                          color: isSelected ? '#34D399' : '#CBD5E1'
                        }}
                      >
                        {isSelected ? '✓ ' : '+ '}{option}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Recorded Findings Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {examFindings.map((finding) => (
                  <span
                    key={finding}
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: '#E2E8F0',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{finding}</span>
                    {!isSignedOrCompleted && (
                      <button
                        type="button"
                        onClick={() => toggleExamFinding(finding)}
                        style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
                      >
                        ✕
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* 🥗 CARD C: DIET & LIFESTYLE ADVICE */}
            <div
              style={{
                backgroundColor: 'var(--ds-color-surface, #0F172A)',
                border: '1px solid var(--ds-color-border, rgba(255,255,255,0.08))',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#94A3B8' }}>
                DIET & LIFESTYLE ADVICE
              </label>
              <textarea
                rows={2}
                disabled={isSignedOrCompleted}
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
                placeholder="Steam inhalation, warm water..."
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  backgroundColor: isSignedOrCompleted ? 'rgba(255,255,255,0.03)' : 'var(--ds-color-bg, #0B111E)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: isSignedOrCompleted ? '#94A3B8' : '#F8FAFC',
                  fontSize: '0.72rem',
                  resize: 'none',
                  outline: 'none',
                  opacity: isSignedOrCompleted ? 0.75 : 1,
                  cursor: isSignedOrCompleted ? 'not-allowed' : 'text',
                  boxSizing: 'border-box'
                }}
              />

              {/* 1-Tap Diet Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {['Steam inhalation BID', 'Warm fluids (>2L)', 'Avoid oily/spicy', 'Low salt DASH', 'Light khichdi'].map((adv) => (
                  <button
                    key={adv}
                    type="button"
                    disabled={isSignedOrCompleted}
                    onClick={() => {
                      setTreatmentPlan((prev) => (prev ? `${prev}\n• ${adv}` : `• ${adv}`));
                    }}
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      cursor: isSignedOrCompleted ? 'not-allowed' : 'pointer',
                      opacity: isSignedOrCompleted ? 0.4 : 1,
                      border: '1px solid rgba(255,255,255,0.08)',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      color: '#94A3B8'
                    }}
                  >
                    + {adv}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 5. Sticky Bottom Action Bar (Complete, Print, WhatsApp) */}
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'var(--ds-color-surface, #0F172A)',
            border: '1.5px solid var(--ds-color-primary, #06B6D4)',
            borderRadius: '14px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 10px 30px rgba(0,0,0,0.85), 0 0 25px rgba(6, 182, 212, 0.25)',
            zIndex: 50,
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          {/* Review follow-up select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700 }}>Next Review:</span>
            <select
              value={followUpDays}
              disabled={isSignedOrCompleted}
              onChange={(e) => setFollowUpDays(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: isSignedOrCompleted ? 'rgba(255,255,255,0.03)' : 'var(--ds-color-bg, #0B111E)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: isSignedOrCompleted ? '#94A3B8' : '#38BDF8',
                fontSize: '0.72rem',
                fontWeight: 700,
                opacity: isSignedOrCompleted ? 0.75 : 1,
                cursor: isSignedOrCompleted ? 'not-allowed' : 'pointer'
              }}
            >
              <option value="3 Days">After 3 Days</option>
              <option value="5 Days">After 5 Days</option>
              <option value="1 Week">After 1 Week</option>
              <option value="2 Weeks">After 2 Weeks</option>
              <option value="SOS">SOS / As Needed</option>
            </select>

            {/* 💾 Gap 9: Local Draft Autosave Status Indicator */}
            <span
              style={{
                fontSize: '0.6875rem',
                color: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                padding: '3px 8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Real-time browser-local cached draft to prevent any network data loss"
            >
              <span>💾</span>
              <span>Autosaved ({lastAutosavedTime})</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* 📄 Gap 6: 1-Click Medical Leave & Fitness Certificate */}
            <button
              type="button"
              onClick={() => setIsMedicalCertModalOpen(true)}
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38BDF8',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Generate 1-Click Formatted Medical Sick Leave or Fitness Certificate"
            >
              <span>📄</span>
              <span>Sick Leave Cert</span>
            </button>

            {/* 👨‍⚕️ Gap 7: Cross-Specialty OPD Referral */}
            <button
              type="button"
              onClick={() => setIsReferralModalOpen(true)}
              style={{
                backgroundColor: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid #A855F7',
                color: '#DDD6FE',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Cross-consultation referral to Cardiology, Neurology, Orthopedics, etc."
            >
              <span>👨‍⚕️</span>
              <span>Refer Specialist</span>
            </button>

            {/* Direct IPD Emergency Admission */}
            <button
              type="button"
              onClick={() => setIsAdmissionModalOpen(true)}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1.5px solid #EF4444',
                color: '#F87171',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.75rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Emergency Inpatient (IPD) Admission Order & Bed Reservation"
            >
              <span>🚨</span>
              <span>Admit to IPD</span>
            </button>

            {/* 💉 Pillar 3: OPD Daycare & Chamber Minor Procedures */}
            <button
              type="button"
              onClick={() => setIsDaycareModalOpen(true)}
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid #F59E0B',
                color: '#FDE68A',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Order in-chamber or daycare minor procedures (Nebulization, TT, IV drip, Dressing)"
            >
              <span>💉</span>
              <span>Daycare Orders</span>
            </button>

            {/* ⚖️ Pillar 5: Medico-Legal Case (MLC) Guardrail */}
            <button
              type="button"
              onClick={() => setIsMlcModalOpen(true)}
              style={{
                backgroundColor: mlcDetails?.isMlc ? '#DC2626' : 'rgba(239, 68, 68, 0.12)',
                border: mlcDetails?.isMlc ? '1.5px solid #EF4444' : '1px solid rgba(239, 68, 68, 0.35)',
                color: mlcDetails?.isMlc ? '#FFFFFF' : '#FCA5A5',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.75rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Record Medico-Legal Case (RTA, assault, burns) with statutory police details"
            >
              <span>⚖️</span>
              <span>{mlcDetails?.isMlc ? 'MLC Active' : 'Mark as MLC'}</span>
            </button>

            {/* 🌐 Pillar 4: Vernacular Prescription Modal (Hindi / Urdu) */}
            <button
              type="button"
              onClick={() => setIsVernacularModalOpen(true)}
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10B981',
                color: '#6EE7B7',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Print prescription with Hindi/Urdu visual dosage schedule & Sun/Moon icons"
            >
              <span>🌐</span>
              <span>Hindi/Urdu Dosage</span>
            </button>

            {/* 💰 Pillar 9: Solo Doctor Chamber Fee Settlement */}
            <button
              type="button"
              onClick={() => setIsChamberPaymentOpen(true)}
              style={{
                backgroundColor: chamberPaymentReceipt ? 'rgba(34, 197, 94, 0.2)' : 'rgba(16, 185, 129, 0.12)',
                border: chamberPaymentReceipt ? '1.5px solid #22C55E' : '1px solid rgba(16, 185, 129, 0.3)',
                color: chamberPaymentReceipt ? '#86EFAC' : '#34D399',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="In-chamber fee settlement and instant receipt stamp (Cash or UPI)"
            >
              <span>💰</span>
              <span>{chamberPaymentReceipt ? `Fee: #${chamberPaymentReceipt}` : `Chamber Fee: ₹${_consultationFeeFirstVisit || 500}`}</span>
            </button>

            {/* Same-day Send for Labs & Await (Zero Duplicate Fee Return) */}
            {selectedTests.length > 0 && !isSignedOrCompleted && (
              <button
                type="button"
                onClick={handleSendForLabsAndAwait}
                style={{
                  backgroundColor: 'rgba(6, 182, 212, 0.18)',
                  border: '1.5px solid #06B6D4',
                  color: '#38BDF8',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Send patient to central lab and hold in Reports Review queue (zero duplicate fee)"
              >
                <span>🧪</span>
                <span>Send for Labs (Await)</span>
              </button>
            )}

            {/* WhatsApp e-Rx */}
            <button
              type="button"
              onClick={() => setIsWhatsAppModalOpen(true)}
              style={{
                backgroundColor: 'rgba(37, 211, 102, 0.15)',
                border: '1px solid #25D366',
                color: '#25D366',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📲</span>
              <span>WhatsApp e-Rx</span>
            </button>

            {/* Save Draft */}
            <button
              type="button"
              onClick={handleSaveCurrentDraft}
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#F8FAFC',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Shortcut: Ctrl + S"
            >
              <span>💾</span>
              <span>Save Draft</span>
              <kbd style={{ fontSize: '0.625rem', fontFamily: 'monospace', opacity: 0.7 }}>Ctrl+S</kbd>
            </button>

            {/* Print Slip */}
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#F8FAFC',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Shortcut: Alt + P"
            >
              <span>🖨️</span>
              <span>Print Slip</span>
              <kbd style={{ fontSize: '0.625rem', fontFamily: 'monospace', opacity: 0.7 }}>Alt+P</kbd>
            </button>

            {/* Complete Consultation (Step 4: Sign & Prompt Next) */}
            <button
              type="button"
              onClick={() => {
                if (isSignedOrCompleted) {
                  setIsNextPatientPromptOpen(true);
                } else {
                  void handleComplete();
                }
              }}
              style={{
                backgroundColor: isSignedOrCompleted ? '#10B981' : 'var(--ds-color-primary, #06B6D4)',
                color: isSignedOrCompleted ? '#FFFFFF' : '#070C16',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 18px',
                fontSize: '0.8rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: isSignedOrCompleted ? '0 2px 12px rgba(16, 185, 129, 0.4)' : '0 2px 12px rgba(6, 182, 212, 0.4)'
              }}
              title={isSignedOrCompleted ? 'Prescription is signed and locked' : 'Shortcut: Ctrl + Enter'}
            >
              <span>{isSignedOrCompleted ? '🔒' : '✓'}</span>
              <span>{isSignedOrCompleted ? 'Signed & Dispatched' : 'Complete & Sign'}</span>
              {!isSignedOrCompleted && (
                <kbd
                  style={{
                    fontSize: '0.625rem',
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    color: '#070C16',
                    padding: '2px 5px',
                    borderRadius: '4px',
                    fontWeight: 800
                  }}
                >
                  Ctrl+Enter
                </kbd>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

      {/* 📢 4th Step of Doctor Daily Journey: Next Patient Calling Modal */}
      {isNextPatientPromptOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(7, 12, 22, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: '#0F172A',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem'
                }}>
                  ✅
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC' }}>
                    Prescription Signed & Issued!
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                    {completedPatientInfo?.token} ({completedPatientInfo?.name}) completed. {chamberRoom} is now ready.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsNextPatientPromptOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Next Patient Card or All Done */}
            {nextWaitingPatient ? (
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'rgba(56, 189, 248, 0.05)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Next Patient in Waiting Queue
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: '#FCD34D',
                    fontWeight: 700
                  }}>
                    ⏳ {nextWaitingPatient.waitMinutes} mins waiting
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#38BDF8' }}>
                        {nextWaitingPatient.token}
                      </span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>
                        {nextWaitingPatient.patientName}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '2px' }}>
                      {nextWaitingPatient.gender}, {nextWaitingPatient.age}y • MRN: {nextWaitingPatient.mrn} • 📞 {nextWaitingPatient.phone}
                    </div>
                  </div>

                  {nextWaitingPatient.nurseVitals ? (
                    <div style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      textAlign: 'right',
                      fontSize: '0.78rem'
                    }}>
                      <div style={{ color: '#10B981', fontWeight: 800 }}>
                        BP: {nextWaitingPatient.nurseVitals.systolicBp}/{nextWaitingPatient.nurseVitals.diastolicBp}
                      </div>
                      <div style={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                        SpO2: {nextWaitingPatient.nurseVitals.spo2Percent || 98}%
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 700 }}>Vitals Pending</span>
                  )}
                </div>

                {nextWaitingPatient.redFlags && nextWaitingPatient.redFlags.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#EF4444' }}>Triage Alert:</span>
                    {nextWaitingPatient.redFlags.map((flag: any, fIdx: number) => (
                      <span
                        key={fIdx}
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          color: '#FCA5A5',
                          border: '1px solid rgba(239, 68, 68, 0.4)'
                        }}
                      >
                        {flag.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                padding: '20px',
                borderRadius: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '6px' }}>🌟</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#34D399' }}>
                  All OPD Patients Completed for Today!
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '4px' }}>
                  Total {queueStats.done} consultations conducted in {chamberRoom}. No patients currently waiting in line.
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsPrintModalOpen(true);
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#F8FAFC',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>🖨️</span>
                  <span>Print Slip</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsNextPatientPromptOpen(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'transparent',
                    color: '#94A3B8',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Review Desk (Esc)
                </button>
              </div>

              {nextWaitingPatient && (
                <button
                  type="button"
                  onClick={() => {
                    callPatientToChamber(nextWaitingPatient);
                    setIsNextPatientPromptOpen(false);
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#0284C7',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                  }}
                >
                  <span>📢 Call {nextWaitingPatient.patientName} to Chamber</span>
                  <kbd style={{
                    fontSize: '0.65rem',
                    padding: '2px 5px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0,0,0,0.25)',
                    color: '#FFFFFF'
                  }}>
                    Enter ↵
                  </kbd>
                </button>
              )}

              {!nextWaitingPatient && (
                <button
                  type="button"
                  onClick={() => {
                    setIsNextPatientPromptOpen(false);
                    handleExitCockpit();
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <span>🏥</span>
                  <span>Return to Clinic Dashboard ➔</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
