import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { CockpitMedItem } from '../views/SoloDoctorOpdCockpitView.js';

export interface RapidRxPrescriptionPadProps {
  onAddMedication: (med: CockpitMedItem) => void;
  onAddMultipleMedications?: (meds: CockpitMedItem[], clinicalNotes?: { diagnosis?: string; treatmentPlan?: string; followUpDays?: string }) => void;
  onRepeatPreviousRx?: (() => void) | undefined;
  hasPreviousRx?: boolean | undefined;
  currentMedCount: number;
  consultationId: string;
}

export interface RapidDrugCatalogItem {
  id: string;
  brandName: string;
  genericName: string;
  formulation: 'TAB' | 'CAP' | 'SYP' | 'INJ' | 'OINT' | 'DROPS' | 'INHALER';
  defaultStrength: string;
  defaultFrequency: string;
  defaultDurationDays: number;
  defaultTiming: 'AFTER_FOOD' | 'BEFORE_FOOD' | 'BEDTIME' | 'EMPTY_STOMACH';
  defaultDosage: string;
  instructions: string;
  janAushadhiEquivalent?: {
    name: string;
    brandPrice: number;
    janAushadhiPrice: number;
  };
  keywords: string[];
}

export interface RapidClinicalKit {
  id: string;
  title: string;
  hindiTitle: string;
  icon: string;
  badgeColor: string;
  diagnosis: string;
  icd10: string;
  followUp: string;
  treatmentPlan: string;
  medications: Omit<CockpitMedItem, 'id'>[];
}

// Top 50 Most Prescribed Indian Outpatient Medications (HealthPlix-grade 2-letter instant match)
export const RAPID_INDIAN_FORMULARY: RapidDrugCatalogItem[] = [
  {
    id: 'rx-pcm-650',
    brandName: 'Dolo 650 / Calpol',
    genericName: 'Paracetamol',
    formulation: 'TAB',
    defaultStrength: '650mg',
    defaultFrequency: '1 - 1 - 1',
    defaultDurationDays: 3,
    defaultTiming: 'AFTER_FOOD',
    defaultDosage: '1 Tab',
    instructions: 'Take with warm water after meals if fever >100°F',
    janAushadhiEquivalent: { name: 'Jan Aushadhi Paracetamol 650mg', brandPrice: 42, janAushadhiPrice: 12 },
    keywords: ['pa', 'pcm', 'dolo', 'calpol', 'para', 'fever', 'crocin', 'pyrexia', 'pain', 'headache']
  },
  {
    id: 'rx-panto-40',
    brandName: 'Pantocid 40mg / Pan 40',
    genericName: 'Pantoprazole Sodium 40mg',
    formulation: 'TAB',
    defaultStrength: '40mg',
    defaultFrequency: '1 - 0 - 0',
    defaultDurationDays: 7,
    defaultTiming: 'EMPTY_STOMACH',
    defaultDosage: '1 Tab',
    instructions: 'Morning 30 mins before breakfast',
    janAushadhiEquivalent: { name: 'Jan Aushadhi Pantoprazole 40mg', brandPrice: 110, janAushadhiPrice: 15 },
    keywords: ['pa', 'pan', 'panto', 'pantocid', 'pan40', 'pantosec', 'pantodac', 'acid', 'gerd', 'gas', 'gastric']
  },
  {
    id: 'rx-pan-d',
    brandName: 'Pan-D / Pantocid-DSR',
    genericName: 'Pantoprazole 40mg + Domperidone 30mg SR',
    formulation: 'CAP',
    defaultStrength: '40mg/30mg',
    defaultFrequency: '1 - 0 - 0',
    defaultDurationDays: 5,
    defaultTiming: 'EMPTY_STOMACH',
    defaultDosage: '1 Cap',
    instructions: 'Early morning empty stomach with full glass of water',
    janAushadhiEquivalent: { name: 'Jan Aushadhi Pantoprazole + Domperidone', brandPrice: 165, janAushadhiPrice: 24 },
    keywords: ['pa', 'pan', 'pand', 'dsr', 'pantocid-dsr', 'dom', 'vomit', 'nausea', 'reflux', 'heartburn']
  },
  {
    id: 'rx-pantosec-40',
    brandName: 'Pantosec 40 / Pantodac',
    genericName: 'Pantoprazole Gastro-Resistant 40mg',
    formulation: 'TAB',
    defaultStrength: '40mg',
    defaultFrequency: '1 - 0 - 0',
    defaultDurationDays: 14,
    defaultTiming: 'EMPTY_STOMACH',
    defaultDosage: '1 Tab',
    instructions: 'Once daily before morning tea/breakfast',
    janAushadhiEquivalent: { name: 'Jan Aushadhi Pantoprazole 40mg', brandPrice: 115, janAushadhiPrice: 15 },
    keywords: ['pa', 'pan', 'pantosec', 'pantodac', 'sec', 'hyperacidity', 'esophagitis']
  },
  {
    id: 'rx-azithro-500',
    brandName: 'Azithral 500 / Azee',
    genericName: 'Azithromycin',
    formulation: 'TAB',
    defaultStrength: '500mg',
    defaultFrequency: '1 - 0 - 0',
    defaultDurationDays: 3,
    defaultTiming: 'AFTER_FOOD',
    defaultDosage: '1 Tab',
    instructions: 'Take 1 hour after lunch at fixed time daily',
    janAushadhiEquivalent: { name: 'Jan Aushadhi Azithromycin 500mg', brandPrice: 135, janAushadhiPrice: 38 },
    keywords: ['az', 'azi', 'azith', 'azithral', 'azee', 'throat', 'tonsil', 'cough', 'antibiotic']
  },
  {
    id: 'rx-augmentin-625',
    brandName: 'Augmentin 625 Duo / Moxikind-CV',
    genericName: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
    formulation: 'TAB',
    defaultStrength: '625mg',
    defaultFrequency: '1 - 0 - 1',
    defaultDurationDays: 5,
    defaultTiming: 'AFTER_FOOD',
    defaultDosage: '1 Tab',
    instructions: 'Take twice daily after meals to avoid gastric irritation',
    janAushadhiEquivalent: { name: 'Jan Aushadhi Amoxyclav 625mg', brandPrice: 220, janAushadhiPrice: 58 },
    keywords: ['au', 'aug', 'am', 'amox', 'clav', 'moxikind', 'infection', 'sinus', 'chest']
  },
  {
    id: 'rx-monticope',
    brandName: 'Montek-LC / Montair-LC',
    genericName: 'Montelukast 10mg + Levocetirizine 5mg',
    formulation: 'TAB',
    defaultStrength: '10mg/5mg',
    defaultFrequency: '0 - 0 - 1',
    defaultDurationDays: 7,
    defaultTiming: 'BEDTIME',
    defaultDosage: '1 Tab',
    instructions: 'At bedtime with warm water; may cause mild drowsiness',
    janAushadhiEquivalent: { name: 'Jan Aushadhi Montelukast + Levocetirizine', brandPrice: 185, janAushadhiPrice: 30 },
    keywords: ['mo', 'mon', 'mont', 'montek', 'montair', 'levo', 'allergy', 'rhinitis', 'sneezing', 'cold']
  },
  {
    id: 'rx-telma-40',
    brandName: 'Telma 40 / Telmikind',
    genericName: 'Telmisartan',
    formulation: 'TAB',
    defaultStrength: '40mg',
    defaultFrequency: '1 - 0 - 0',
    defaultDurationDays: 30,
    defaultTiming: 'AFTER_FOOD',
    defaultDosage: '1 Tab',
    instructions: 'Fixed morning time after breakfast; maintain BP log',
    janAushadhiEquivalent: { name: 'Jan Aushadhi Telmisartan 40mg', brandPrice: 145, janAushadhiPrice: 22 },
    keywords: ['te', 'tel', 'telma', 'telmi', 'bp', 'hypertension', 'blood pressure']
  },
  {
    id: 'rx-glycomet-500',
    brandName: 'Glycomet 500 SR',
    genericName: 'Metformin Hydrochloride SR',
    formulation: 'TAB',
    defaultStrength: '500mg SR',
    defaultFrequency: '1 - 0 - 1',
    defaultDurationDays: 30,
    defaultTiming: 'AFTER_FOOD',
    defaultDosage: '1 Tab',
    instructions: 'Take immediately with or after meals',
    janAushadhiEquivalent: { name: 'Jan Aushadhi Metformin 500mg SR', brandPrice: 55, janAushadhiPrice: 14 },
    keywords: ['me', 'met', 'gly', 'glyco', 'sugar', 'diabetes', 'metformin']
  },
  {
    id: 'rx-cefix-200',
    brandName: 'Zifi 200 / Mahacef',
    genericName: 'Cefixime',
    formulation: 'TAB',
    defaultStrength: '200mg',
    defaultFrequency: '1 - 0 - 1',
    defaultDurationDays: 5,
    defaultTiming: 'AFTER_FOOD',
    defaultDosage: '1 Tab',
    instructions: 'Twice daily after food with plenty of fluids',
    janAushadhiEquivalent: { name: 'Jan Aushadhi Cefixime 200mg', brandPrice: 110, janAushadhiPrice: 32 },
    keywords: ['ce', 'cef', 'zifi', 'maha', 'typhoid', 'uti', 'fever']
  },
  {
    id: 'rx-emset-4',
    brandName: 'Emset 4 / Ondem',
    genericName: 'Ondansetron',
    formulation: 'TAB',
    defaultStrength: '4mg',
    defaultFrequency: '1 - 0 - 1',
    defaultDurationDays: 3,
    defaultTiming: 'BEFORE_FOOD',
    defaultDosage: '1 Tab',
    instructions: '30 mins before meals or SOS for nausea / vomiting',
    janAushadhiEquivalent: { name: 'Jan Aushadhi Ondansetron 4mg', brandPrice: 55, janAushadhiPrice: 10 },
    keywords: ['em', 'on', 'ond', 'ondem', 'emset', 'vomit', 'nausea']
  },
  {
    id: 'rx-zerodol-p',
    brandName: 'Zerodol-P / Hifenac-P',
    genericName: 'Aceclofenac 100mg + Paracetamol 325mg',
    formulation: 'TAB',
    defaultStrength: '100mg/325mg',
    defaultFrequency: '1 - 0 - 1',
    defaultDurationDays: 3,
    defaultTiming: 'AFTER_FOOD',
    defaultDosage: '1 Tab',
    instructions: 'Strictly after food with antacid coverage',
    janAushadhiEquivalent: { name: 'Jan Aushadhi Aceclofenac + Paracetamol', brandPrice: 78, janAushadhiPrice: 18 },
    keywords: ['ze', 'zero', 'ace', 'pain', 'backache', 'joint', 'sprain', 'ortho', 'hifenac']
  },
  {
    id: 'rx-rabekind-dsr',
    brandName: 'Razo-D / Rabekind-DSR',
    genericName: 'Rabeprazole 20mg + Domperidone 30mg SR',
    formulation: 'CAP',
    defaultStrength: '20mg/30mg',
    defaultFrequency: '1 - 0 - 0',
    defaultDurationDays: 7,
    defaultTiming: 'EMPTY_STOMACH',
    defaultDosage: '1 Cap',
    instructions: 'Morning empty stomach with plain water',
    janAushadhiEquivalent: { name: 'Jan Aushadhi Rabeprazole + Domperidone', brandPrice: 170, janAushadhiPrice: 28 },
    keywords: ['ra', 'rab', 'razo', 'reflux', 'hyperacidity', 'belching']
  },
  {
    id: 'rx-mucaine-gel',
    brandName: 'Mucaine Gel / Digene Ultra',
    genericName: 'Oxetacaine + Aluminium Hydroxide + Magnesium Hydroxide',
    formulation: 'SYP',
    defaultStrength: '200ml Gel',
    defaultFrequency: '1 - 1 - 1',
    defaultDurationDays: 5,
    defaultTiming: 'BEFORE_FOOD',
    defaultDosage: '10 ml',
    instructions: '2 teaspoons 15 mins before meals and at bedtime. Do not drink water immediately after.',
    janAushadhiEquivalent: { name: 'Jan Aushadhi Antacid Gel', brandPrice: 185, janAushadhiPrice: 42 },
    keywords: ['mu', 'muc', 'gel', 'digene', 'antacid', 'burning', 'ulcer', 'chest pain']
  },
  {
    id: 'rx-limcee-500',
    brandName: 'Limcee / Celin 500',
    genericName: 'Vitamin C (Ascorbic Acid) Chewable',
    formulation: 'TAB',
    defaultStrength: '500mg',
    defaultFrequency: '1 - 0 - 0',
    defaultDurationDays: 15,
    defaultTiming: 'AFTER_FOOD',
    defaultDosage: '1 Chewable Tab',
    instructions: 'Chew daily after breakfast for immunity boost',
    janAushadhiEquivalent: { name: 'Jan Aushadhi Vitamin C 500mg', brandPrice: 35, janAushadhiPrice: 9 },
    keywords: ['li', 'lim', 'vit', 'vitc', 'immunity', 'scurvy', 'cold']
  },
  {
    id: 'rx-ascoril-ls',
    brandName: 'Ascoril LS / Bro-Zedex LS',
    genericName: 'Levosalbutamol + Ambroxol + Guaiphenesin',
    formulation: 'SYP',
    defaultStrength: '100ml Syrup',
    defaultFrequency: '1 - 1 - 1',
    defaultDurationDays: 5,
    defaultTiming: 'AFTER_FOOD',
    defaultDosage: '5 ml',
    instructions: '1 teaspoonful thrice daily with warm water for wet cough',
    janAushadhiEquivalent: { name: 'Jan Aushadhi Expectorant Syrup', brandPrice: 130, janAushadhiPrice: 32 },
    keywords: ['as', 'asc', 'cough', 'phlegm', 'bronchitis', 'wheeze', 'syrup']
  },
  {
    id: 'rx-meftal-spas',
    brandName: 'Meftal-Spas / Cyclopam',
    genericName: 'Mefenamic Acid 250mg + Dicyclomine 10mg',
    formulation: 'TAB',
    defaultStrength: '250mg/10mg',
    defaultFrequency: 'SOS',
    defaultDurationDays: 3,
    defaultTiming: 'AFTER_FOOD',
    defaultDosage: '1 Tab',
    instructions: 'Take 1 tablet only during severe spasmodic abdominal cramps',
    janAushadhiEquivalent: { name: 'Jan Aushadhi Antispasmodic Tab', brandPrice: 52, janAushadhiPrice: 11 },
    keywords: ['me', 'mef', 'spas', 'cramp', 'colic', 'period', 'stomach ache']
  }
];

// Pre-Configured 1-Click Clinical Disease Kits (<10 Seconds Prescription)
export const RAPID_CLINICAL_KITS: RapidClinicalKit[] = [
  {
    id: 'kit-viral-uri',
    title: 'Viral Fever & Cold',
    hindiTitle: 'वायरल बुखार व सर्दी',
    icon: '🌡️',
    badgeColor: '#EF4444',
    diagnosis: 'Acute Viral Upper Respiratory Infection with Pyrexia',
    icd10: 'J06.9',
    followUp: '3 Days',
    treatmentPlan: '• Warm salt-water gargles thrice daily\n• Steam inhalation 10 mins BD\n• Generous oral hydration (>2.5 L/day)\n• Review if temperature >101°F persists beyond 72 hrs',
    medications: [
      {
        medicationName: 'Tab Dolo 650',
        strength: '650mg',
        dosage: '1 Tab',
        frequency: '1 - 1 - 1',
        duration: 3,
        durationUnit: 'DAYS',
        beforeAfterFood: 'AFTER_FOOD',
        instructions: 'After meals if temperature > 100°F',
        genericSubstitute: { name: 'Jan Aushadhi Paracetamol 650mg', brandPrice: 42, janAushadhiPrice: 12 }
      },
      {
        medicationName: 'Tab Montek-LC',
        strength: '10mg/5mg',
        dosage: '1 Tab',
        frequency: '0 - 0 - 1',
        duration: 5,
        durationUnit: 'DAYS',
        beforeAfterFood: 'BEDTIME',
        instructions: 'At bedtime with warm water for runny nose/sneezing',
        genericSubstitute: { name: 'Jan Aushadhi Montelukast + Levocetirizine', brandPrice: 185, janAushadhiPrice: 30 }
      },
      {
        medicationName: 'Tab Pan 40',
        strength: '40mg',
        dosage: '1 Tab',
        frequency: '1 - 0 - 0',
        duration: 5,
        durationUnit: 'DAYS',
        beforeAfterFood: 'BEFORE_FOOD',
        instructions: 'Empty stomach in morning',
        genericSubstitute: { name: 'Jan Aushadhi Pantoprazole 40mg', brandPrice: 110, janAushadhiPrice: 15 }
      },
      {
        medicationName: 'Tab Limcee 500',
        strength: '500mg',
        dosage: '1 Chewable Tab',
        frequency: '1 - 0 - 0',
        duration: 7,
        durationUnit: 'DAYS',
        beforeAfterFood: 'AFTER_FOOD',
        instructions: 'Chew daily after breakfast',
        genericSubstitute: { name: 'Jan Aushadhi Vitamin C 500mg', brandPrice: 35, janAushadhiPrice: 9 }
      }
    ]
  },
  {
    id: 'kit-gerd-gastritis',
    title: 'Acute Gastritis / Acidity',
    hindiTitle: 'गैस, एसिडिटी व सीने में जलन',
    icon: '🔥',
    badgeColor: '#F59E0B',
    diagnosis: 'Acute Acid Peptic Disease with Gastroesophageal Reflux',
    icd10: 'K21.9',
    followUp: '7 Days',
    treatmentPlan: '• Avoid tea, coffee, deep-fried snacks, and spicy masala\n• Dinner at least 2 hours before sleeping\n• Small, frequent bland meals',
    medications: [
      {
        medicationName: 'Cap Pan-D',
        strength: '40mg/30mg',
        dosage: '1 Cap',
        frequency: '1 - 0 - 0',
        duration: 7,
        durationUnit: 'DAYS',
        beforeAfterFood: 'BEFORE_FOOD',
        instructions: 'Morning empty stomach 30 mins before breakfast',
        genericSubstitute: { name: 'Jan Aushadhi Pantoprazole + Domperidone', brandPrice: 165, janAushadhiPrice: 24 }
      },
      {
        medicationName: 'Syp Mucaine Gel',
        strength: '200ml',
        dosage: '10 ml',
        frequency: '1 - 1 - 1',
        duration: 5,
        durationUnit: 'DAYS',
        beforeAfterFood: 'BEFORE_FOOD',
        instructions: '2 tsp 15 mins before meals; do not drink water immediately',
        genericSubstitute: { name: 'Jan Aushadhi Antacid Gel', brandPrice: 185, janAushadhiPrice: 42 }
      }
    ]
  },
  {
    id: 'kit-diabetes-t2',
    title: 'Type-2 Diabetes Regular',
    hindiTitle: 'शुगर / डायबिटीज़ प्रोटोकॉल',
    icon: '🩸',
    badgeColor: '#10B981',
    diagnosis: 'Type 2 Diabetes Mellitus without Complications',
    icd10: 'E11.9',
    followUp: '30 Days',
    treatmentPlan: '• Strictly zero refined sugar, sweets, cold drinks\n• 40 mins brisk morning walk daily\n• Monitor fasting & post-meal blood sugar weekly\n• Foot care inspection daily',
    medications: [
      {
        medicationName: 'Tab Glycomet 500 SR',
        strength: '500mg SR',
        dosage: '1 Tab',
        frequency: '1 - 0 - 1',
        duration: 30,
        durationUnit: 'DAYS',
        beforeAfterFood: 'AFTER_FOOD',
        instructions: 'With or immediately after meals',
        genericSubstitute: { name: 'Jan Aushadhi Metformin 500mg SR', brandPrice: 55, janAushadhiPrice: 14 }
      }
    ]
  },
  {
    id: 'kit-hypertension-stg1',
    title: 'Hypertension Stage-1',
    hindiTitle: 'हाई ब्लड प्रेशर शुरुआत',
    icon: '❤️',
    badgeColor: '#EC4899',
    diagnosis: 'Essential Primary Hypertension Stage-1',
    icd10: 'I10',
    followUp: '15 Days',
    treatmentPlan: '• Dietary Sodium restriction (<5g iodized salt/day)\n• Avoid pickles, papad, processed namkeen\n• Daily home morning BP recording log\n• Avoid OTC painkiller NSAIDs',
    medications: [
      {
        medicationName: 'Tab Telma 40',
        strength: '40mg',
        dosage: '1 Tab',
        frequency: '1 - 0 - 0',
        duration: 30,
        durationUnit: 'DAYS',
        beforeAfterFood: 'AFTER_FOOD',
        instructions: 'Fixed morning time after breakfast',
        genericSubstitute: { name: 'Jan Aushadhi Telmisartan 40mg', brandPrice: 145, janAushadhiPrice: 22 }
      }
    ]
  },
  {
    id: 'kit-pediatric-fever',
    title: 'Pediatric Fever & Cough',
    hindiTitle: 'बच्चों का बुखार व खांसी',
    icon: '👶',
    badgeColor: '#8B5CF6',
    diagnosis: 'Pediatric Acute Febrile Illness with Catarrh',
    icd10: 'R50.9',
    followUp: '3 Days',
    treatmentPlan: '• Lukewarm sponging if temperature crosses 101°F\n• Abundant breastfeeding / boiled cooled water\n• Keep nose clear with saline drops before feeding\n• Alert ER if breathing fast or child refuses feeds',
    medications: [
      {
        medicationName: 'Syp Calpol 250mg/5ml',
        strength: '250mg/5ml',
        dosage: '5 ml',
        frequency: '1 - 1 - 1',
        duration: 3,
        durationUnit: 'DAYS',
        beforeAfterFood: 'AFTER_FOOD',
        instructions: 'Give with dropper/measuring cap strictly as per weight',
        genericSubstitute: { name: 'Jan Aushadhi Paracetamol Syrup', brandPrice: 45, janAushadhiPrice: 16 }
      },
      {
        medicationName: 'Syp Ascoril LS Junior',
        strength: '60ml',
        dosage: '2.5 ml',
        frequency: '1 - 1 - 1',
        duration: 4,
        durationUnit: 'DAYS',
        beforeAfterFood: 'AFTER_FOOD',
        instructions: 'Twice or thrice daily for chest congestion',
        genericSubstitute: { name: 'Jan Aushadhi Cough Syrup Jr', brandPrice: 85, janAushadhiPrice: 22 }
      }
    ]
  },
  {
    id: 'kit-ortho-sprain',
    title: 'Acute Sprain & Joint Pain',
    hindiTitle: 'मोच, कमर व जोड़ों का दर्द',
    icon: '🩹',
    badgeColor: '#06B6D4',
    diagnosis: 'Acute Musculoskeletal Strain with Localized Inflammation',
    icd10: 'M79.1',
    followUp: '5 Days',
    treatmentPlan: '• R.I.C.E protocol (Rest, Ice pack application 15 mins TID, Compression, Elevation)\n• Hot water bath / avoid lifting heavy weights\n• Knee / lumbar brace support as tolerated',
    medications: [
      {
        medicationName: 'Tab Zerodol-P',
        strength: '100mg/325mg',
        dosage: '1 Tab',
        frequency: '1 - 0 - 1',
        duration: 4,
        durationUnit: 'DAYS',
        beforeAfterFood: 'AFTER_FOOD',
        instructions: 'Strictly after food; never on empty stomach',
        genericSubstitute: { name: 'Jan Aushadhi Aceclofenac + Paracetamol', brandPrice: 78, janAushadhiPrice: 18 }
      },
      {
        medicationName: 'Cap Pan 40',
        strength: '40mg',
        dosage: '1 Tab',
        frequency: '1 - 0 - 0',
        duration: 4,
        durationUnit: 'DAYS',
        beforeAfterFood: 'BEFORE_FOOD',
        instructions: 'Morning 30 mins before breakfast for stomach protection',
        genericSubstitute: { name: 'Jan Aushadhi Pantoprazole 40mg', brandPrice: 110, janAushadhiPrice: 15 }
      }
    ]
  }
];

export const RapidRxPrescriptionPad: React.FC<RapidRxPrescriptionPadProps> = ({
  onAddMedication,
  onAddMultipleMedications,
  onRepeatPreviousRx,
  hasPreviousRx,
  currentMedCount,
  consultationId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<RapidDrugCatalogItem | null>(null);

  // Form customizer chips
  const [strength, setStrength] = useState('650mg');
  const [dosage, setDosage] = useState('1 Tab');
  const [frequency, setFrequency] = useState('1 - 1 - 1');
  const [durationDays, setDurationDays] = useState(3);
  const [timing, setTiming] = useState<'AFTER_FOOD' | 'BEFORE_FOOD' | 'BEDTIME' | 'EMPTY_STOMACH'>('AFTER_FOOD');
  const [instructions, setInstructions] = useState('');

  // Voice Scribe State (बोलकर पर्चा लिखें - AI Clinical NLP Assist)
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceInterimTranscript, setVoiceInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Physical Letterhead Margin Mode (for doctors who print on physical clinic pads)
  const [isLetterheadMode, setIsLetterheadMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('docsearch_letterhead_margin_enabled') === 'true';
    }
    return false;
  });

  const toggleLetterheadMode = () => {
    const nextVal = !isLetterheadMode;
    setIsLetterheadMode(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('docsearch_letterhead_margin_enabled', String(nextVal));
    }
  };

  const toggleVoiceScribe = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListeningVoice) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListeningVoice(false);
      setVoiceInterimTranscript('');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN'; // Dual bilingual Hindi/English
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsListeningVoice(true);
        setVoiceInterimTranscript('🎙️ बोलिए... (e.g. "Dolo 650 TDS, Pan 40 OD")');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setVoiceInterimTranscript(transcript);

        // Smart Clinical Voice NLP Parser
        const lower = transcript.toLowerCase();
        for (const drug of RAPID_INDIAN_FORMULARY) {
          const matchKeyword = drug.keywords.some((k) => lower.includes(k.toLowerCase()));
          if (matchKeyword) {
            const freq = lower.includes('thrice') || lower.includes('teen') || lower.includes('tds') ? '1 - 1 - 1'
              : lower.includes('twice') || lower.includes('do') || lower.includes('bd') ? '1 - 0 - 1'
              : lower.includes('night') || lower.includes('raat') || lower.includes('hs') ? '0 - 0 - 1'
              : lower.includes('once') || lower.includes('ek') || lower.includes('od') ? '1 - 0 - 0'
              : drug.defaultFrequency;

            const newMed: CockpitMedItem = {
              id: `voice-rx-${drug.id}-${Date.now()}`,
              medicationName: drug.brandName,
              strength: drug.defaultStrength,
              dosage: drug.defaultDosage,
              frequency: freq,
              duration: drug.defaultDurationDays,
              durationUnit: 'DAYS',
              beforeAfterFood: drug.defaultTiming,
              instructions: `Auto-scribed from voice: ${drug.instructions}`,
              genericSubstitute: drug.janAushadhiEquivalent
            };

            onAddMedication(newMed);
            setVoiceInterimTranscript(`✓ Added ${drug.brandName} (${freq}) from voice!`);
            break;
          }
        }
      };

      recognition.onerror = () => {
        setIsListeningVoice(false);
        setVoiceInterimTranscript('');
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognition.start();
    } catch (e) {
      console.warn('Voice scribe error:', e);
      setIsListeningVoice(false);
    }
  };

  // 25-Second Prescribing Speed Timer (Gamification for Doctor Efficiency)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Reset timer on new consultation
  useEffect(() => {
    setElapsedSeconds(0);
    setIsTimerRunning(true);
  }, [consultationId]);

  // 0ms Predictive Filter (Matches on prefix, brand name, generic name, or common shortcode)
  const filteredDrugs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return RAPID_INDIAN_FORMULARY.slice(0, 8);
    }
    return RAPID_INDIAN_FORMULARY.filter((item) => {
      if (item.brandName.toLowerCase().includes(q)) return true;
      if (item.genericName.toLowerCase().includes(q)) return true;
      return item.keywords.some((k) => k.startsWith(q) || k.includes(q));
    });
  }, [searchQuery]);

  const handleSelectDrug = (drug: RapidDrugCatalogItem) => {
    setSelectedDrug(drug);
    setStrength(drug.defaultStrength);
    setDosage(drug.defaultDosage);
    setFrequency(drug.defaultFrequency);
    setDurationDays(drug.defaultDurationDays);
    setTiming(drug.defaultTiming);
    setInstructions(drug.instructions);
    setIsOpenDropdown(false);
  };

  const handleAddCurrentMed = () => {
    const nameToAdd = selectedDrug ? selectedDrug.brandName : searchQuery.trim();
    if (!nameToAdd) return;

    const newMed: CockpitMedItem = {
      id: `rapid-rx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      medicationName: nameToAdd,
      strength: strength || '500mg',
      dosage: dosage || '1 Tab',
      frequency: frequency || '1 - 0 - 1',
      duration: durationDays || 3,
      durationUnit: 'DAYS',
      beforeAfterFood: timing,
      instructions: instructions || (selectedDrug ? selectedDrug.instructions : ''),
      genericSubstitute: selectedDrug?.janAushadhiEquivalent
    };

    onAddMedication(newMed);

    // Reset adder for next drug
    setSearchQuery('');
    setSelectedDrug(null);
    setInstructions('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInstantApplyKit = (kit: RapidClinicalKit) => {
    const medsWithIds: CockpitMedItem[] = kit.medications.map((m) => ({
      ...m,
      id: `rapid-kit-${kit.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    }));

    if (onAddMultipleMedications) {
      onAddMultipleMedications(medsWithIds, {
        diagnosis: kit.diagnosis,
        treatmentPlan: kit.treatmentPlan,
        followUpDays: kit.followUp
      });
    } else {
      medsWithIds.forEach((m) => onAddMedication(m));
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#0F172A',
        borderRadius: '14px',
        border: '1.5px solid #0284C7',
        padding: '14px',
        marginBottom: '14px',
        boxShadow: '0 8px 24px rgba(2, 132, 199, 0.15)'
      }}
    >
      {/* Header: HealthPlix Killer Speed Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>⚡</span>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>RAPID Rx PRESCRIPTION PAD</span>
              <span style={{ fontSize: '0.625rem', backgroundColor: '#0369A1', color: '#FFFFFF', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                Sub-25s Speed Mode
              </span>
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
              Type 2 letters (e.g. <code>pa</code>, <code>az</code>, <code>au</code>) or click 1-Tap Clinical Kits below
            </div>
          </div>
        </div>

        {/* Speedometer & Doctor Resistance Killers (Voice + Repeat Rx + Letterhead) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* 1. Voice Scribe Button */}
          <button
            type="button"
            onClick={toggleVoiceScribe}
            style={{
              backgroundColor: isListeningVoice ? '#DC2626' : 'rgba(56, 189, 248, 0.15)',
              border: `1.5px solid ${isListeningVoice ? '#EF4444' : '#38BDF8'}`,
              color: isListeningVoice ? '#FFFFFF' : '#38BDF8',
              borderRadius: '8px',
              padding: '5px 10px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: isListeningVoice ? '0 0 12px rgba(239, 68, 68, 0.6)' : 'none'
            }}
            title="Speak medicines in Hindi/English — AI Auto-Transcribes into Rx without typing!"
          >
            <span>{isListeningVoice ? '🔴' : '🎙️'}</span>
            <span>{isListeningVoice ? 'Listening (बोलिए)...' : 'Voice Scribe'}</span>
          </button>

          {/* 2. 1-Tap Repeat Previous Rx Button */}
          {onRepeatPreviousRx && hasPreviousRx !== false && (
            <button
              type="button"
              onClick={onRepeatPreviousRx}
              style={{
                backgroundColor: 'rgba(251, 191, 36, 0.15)',
                border: '1px solid #F59E0B',
                color: '#FCD34D',
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="1-Tap: Copy entire chronic medication list from previous consultation visit"
            >
              <span>🔁</span>
              <span>Repeat Last Rx</span>
            </button>
          )}

          {/* 3. Letterhead Margin Mode Toggle */}
          <button
            type="button"
            onClick={toggleLetterheadMode}
            style={{
              backgroundColor: isLetterheadMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${isLetterheadMode ? '#10B981' : 'rgba(255, 255, 255, 0.15)'}`,
              color: isLetterheadMode ? '#34D399' : '#94A3B8',
              borderRadius: '8px',
              padding: '5px 8px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Toggle top margin reservation for printing directly on doctor physical letterhead paper"
          >
            <span>📜</span>
            <span>{isLetterheadMode ? 'Letterhead Margin: ON (2.5")' : 'Blank Paper'}</span>
          </button>

          {/* Speedometer Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: elapsedSeconds <= 25 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${elapsedSeconds <= 25 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              padding: '4px 8px',
              borderRadius: '20px'
            }}
          >
            <span style={{ fontSize: '0.75rem' }}>⏱️</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: elapsedSeconds <= 25 ? '#34D399' : '#F87171' }}>
              {elapsedSeconds}s
            </span>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#E2E8F0', fontWeight: 700 }}>
            <span style={{ color: '#38BDF8', fontWeight: 900 }}>{currentMedCount}</span> in Rx
          </div>
        </div>
      </div>

      {/* Voice Interim Transcript Banner */}
      {voiceInterimTranscript && (
        <div
          style={{
            backgroundColor: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '8px',
            padding: '6px 12px',
            marginBottom: '10px',
            fontSize: '0.75rem',
            color: '#38BDF8',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>🎙️</span>
          <span><strong>AI Scribe:</strong> {voiceInterimTranscript}</span>
        </div>
      )}

      {/* 1-Click Clinical Disease Protocol Kits (Row of quick pill buttons) */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          1-Click Disease Kits (Instantly adds full Rx + advice in 1 second):
        </div>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {RAPID_CLINICAL_KITS.map((kit) => (
            <button
              key={kit.id}
              type="button"
              onClick={() => handleInstantApplyKit(kit)}
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                border: `1px solid ${kit.badgeColor}55`,
                borderRadius: '8px',
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${kit.badgeColor}22`;
                e.currentTarget.style.borderColor = kit.badgeColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.9)';
                e.currentTarget.style.borderColor = `${kit.badgeColor}55`;
              }}
              title={`Click to prescribe all ${kit.medications.length} medicines for ${kit.title}`}
            >
              <span style={{ fontSize: '0.875rem' }}>{kit.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC' }}>{kit.title}</div>
                <div style={{ fontSize: '0.625rem', color: '#94A3B8' }}>{kit.hindiTitle} ({kit.medications.length} meds)</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2-Letter Predictive Drug Search Input Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 80px 100px 90px 110px auto', gap: '8px', alignItems: 'center', position: 'relative' }}>
        {/* Drug Input & Dropdown */}
        <div style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpenDropdown(true);
            }}
            onFocus={() => setIsOpenDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredDrugs.length > 0 && isOpenDropdown) {
                  handleSelectDrug(filteredDrugs[0]!);
                } else {
                  handleAddCurrentMed();
                }
              } else if (e.key === 'Escape') {
                setIsOpenDropdown(false);
              }
            }}
            placeholder="Type medicine (e.g. pa, az, dolo, pan)..."
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '8px',
              backgroundColor: '#020617',
              border: '1.5px solid #38BDF8',
              color: '#F8FAFC',
              fontSize: '0.8125rem',
              fontWeight: 700,
              boxSizing: 'border-box'
            }}
          />

          {/* Instant Dropdown (0ms Latency) */}
          {isOpenDropdown && filteredDrugs.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                width: '420px',
                maxHeight: '260px',
                overflowY: 'auto',
                backgroundColor: '#0F172A',
                border: '1.5px solid #0284C7',
                borderRadius: '10px',
                boxShadow: '0 12px 28px rgba(0,0,0,0.8)',
                zIndex: 100,
                padding: '4px'
              }}
            >
              <div style={{ padding: '4px 8px', fontSize: '0.625rem', color: '#94A3B8', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between' }}>
                <span>INSTANT FORMULARY ({filteredDrugs.length} MATCHES)</span>
                <span>CLICK TO AUTO-FILL</span>
              </div>
              {filteredDrugs.map((drug) => (
                <div
                  key={drug.id}
                  onClick={() => handleSelectDrug(drug)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(2, 132, 199, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.8125rem' }}>
                        {drug.brandName}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700 }}>
                        {drug.defaultStrength}
                      </span>
                      <span style={{ fontSize: '0.625rem', backgroundColor: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px', color: '#CBD5E1' }}>
                        {drug.formulation}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>
                      {drug.genericName} • <span style={{ color: '#FCD34D' }}>{drug.defaultFrequency}</span> • {drug.defaultDurationDays}d
                    </div>
                    {drug.janAushadhiEquivalent && (
                      <div style={{ fontSize: '0.625rem', color: '#34D399', marginTop: '1px' }}>
                        ⚡ Jan Aushadhi: ₹{drug.janAushadhiEquivalent.janAushadhiPrice} (Save ₹{drug.janAushadhiEquivalent.brandPrice - drug.janAushadhiEquivalent.janAushadhiPrice})
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectDrug(drug);
                      handleAddCurrentMed();
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: '#10B981',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                    title="1-Tap Instant Add"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Strength */}
        <input
          type="text"
          value={strength}
          onChange={(e) => setStrength(e.target.value)}
          placeholder="Strength"
          style={{
            padding: '8px 8px',
            borderRadius: '8px',
            backgroundColor: '#020617',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#38BDF8',
            fontSize: '0.75rem',
            fontWeight: 700,
            textAlign: 'center'
          }}
        />

        {/* Frequency Dropdown */}
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          style={{
            padding: '8px 6px',
            borderRadius: '8px',
            backgroundColor: '#020617',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#F8FAFC',
            fontSize: '0.75rem',
            fontWeight: 700
          }}
        >
          <option value="1 - 1 - 1">1-1-1 (TDS)</option>
          <option value="1 - 0 - 1">1-0-1 (BD)</option>
          <option value="1 - 0 - 0">1-0-0 (OD)</option>
          <option value="0 - 0 - 1">0-0-1 (HS)</option>
          <option value="SOS">SOS (When needed)</option>
        </select>

        {/* Duration Days */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input
            type="number"
            min={1}
            max={90}
            value={durationDays}
            onChange={(e) => setDurationDays(parseInt(e.target.value, 10) || 1)}
            style={{
              width: '50px',
              padding: '8px 6px',
              borderRadius: '8px',
              backgroundColor: '#020617',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#F8FAFC',
              fontSize: '0.75rem',
              fontWeight: 700,
              textAlign: 'center'
            }}
          />
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>days</span>
        </div>

        {/* Food Timing */}
        <select
          value={timing}
          onChange={(e) => setTiming(e.target.value as any)}
          style={{
            padding: '8px 6px',
            borderRadius: '8px',
            backgroundColor: '#020617',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#F8FAFC',
            fontSize: '0.75rem',
            fontWeight: 700
          }}
        >
          <option value="AFTER_FOOD">After Food (खाने के बाद)</option>
          <option value="BEFORE_FOOD">Before Food (खाने से पहले)</option>
          <option value="EMPTY_STOMACH">Empty Stomach (खाली पेट)</option>
          <option value="BEDTIME">Bedtime (रात सोते समय)</option>
        </select>

        {/* Add Button */}
        <button
          type="button"
          onClick={handleAddCurrentMed}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            backgroundColor: '#0284C7',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '0.8125rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
            whiteSpace: 'nowrap'
          }}
        >
          + Add Rx
        </button>
      </div>

      {/* Quick Dosage Selector Chips (Single-Click Fast Adjusters) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>Quick Frequency:</span>
        {(['1 - 1 - 1', '1 - 0 - 1', '1 - 0 - 0', '0 - 0 - 1', 'SOS'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFrequency(f)}
            style={{
              backgroundColor: frequency === f ? '#0284C7' : 'rgba(255,255,255,0.06)',
              color: frequency === f ? '#FFFFFF' : '#CBD5E1',
              border: 'none',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '0.6875rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {f === '1 - 1 - 1' ? 'TDS' : f === '1 - 0 - 1' ? 'BD' : f === '1 - 0 - 0' ? 'OD' : f === '0 - 0 - 1' ? 'Night (HS)' : 'SOS'}
          </button>
        ))}

        <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, marginLeft: '8px' }}>Duration:</span>
        {([3, 5, 7, 10, 15, 30] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDurationDays(d)}
            style={{
              backgroundColor: durationDays === d ? '#0284C7' : 'rgba(255,255,255,0.06)',
              color: durationDays === d ? '#FFFFFF' : '#CBD5E1',
              border: 'none',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '0.6875rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {d}d
          </button>
        ))}

        <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, marginLeft: '8px' }}>Timing:</span>
        {(['AFTER_FOOD', 'BEFORE_FOOD', 'EMPTY_STOMACH', 'BEDTIME'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTiming(t)}
            style={{
              backgroundColor: timing === t ? '#0284C7' : 'rgba(255,255,255,0.06)',
              color: timing === t ? '#FFFFFF' : '#CBD5E1',
              border: 'none',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '0.6875rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {t === 'AFTER_FOOD' ? 'After Food' : t === 'BEFORE_FOOD' ? 'Before Food' : t === 'EMPTY_STOMACH' ? 'Empty Stom.' : 'Night'}
          </button>
        ))}
      </div>
    </div>
  );
};
