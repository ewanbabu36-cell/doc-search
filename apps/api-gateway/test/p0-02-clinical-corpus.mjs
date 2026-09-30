/**
 * DOC SEARCH - P0-02 Clinical Test Corpus and Benchmark Evaluation Engine
 * Representative, privacy-safe Indian clinical speech dataset covering:
 * Hindi, Hinglish, Indian-accent English, doctor dictation, patient history,
 * vitals, medications, dosages, frequencies, lab values, and numbers.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

export const P0_02_CORPUS_ITEMS = [
  // --------------------------------------------------------------------------
  // Category 1: Hinglish Patient History & Symptoms (5 items)
  // --------------------------------------------------------------------------
  {
    id: 'CORPUS-HINGLISH-001',
    language: 'HINGLISH',
    category: 'PATIENT_HISTORY',
    groundTruth: 'Patient ko teen din se bukhar hai aur gale me dard hai',
    expectedMedicines: [],
    expectedVitals: [],
    expectedNumerics: ['3'],
    expectedUnits: ['din'],
    criticalTerms: ['teen din', 'bukhar', 'gale me dard']
  },
  {
    id: 'CORPUS-HINGLISH-002',
    language: 'HINGLISH',
    category: 'PATIENT_HISTORY',
    groundTruth: 'Patient ko kal raat se severe chest pain aur sweating ho rahi hai',
    expectedMedicines: [],
    expectedVitals: [],
    expectedNumerics: [],
    expectedUnits: [],
    criticalTerms: ['kal raat', 'severe chest pain', 'sweating']
  },
  {
    id: 'CORPUS-HINGLISH-003',
    language: 'HINGLISH',
    category: 'PATIENT_HISTORY',
    groundTruth: 'Patient ko saans lene mein dikkat hai aur do din se khansi ho rahi hai',
    expectedMedicines: [],
    expectedVitals: [],
    expectedNumerics: ['2'],
    expectedUnits: ['din'],
    criticalTerms: ['saans lene mein dikkat', 'do din', 'khansi']
  },
  {
    id: 'CORPUS-HINGLISH-004',
    language: 'HINGLISH',
    category: 'PATIENT_HISTORY',
    groundTruth: 'Pet me tez dard ho raha hai aur subah se teen baar vomiting hui hai',
    expectedMedicines: [],
    expectedVitals: [],
    expectedNumerics: ['3'],
    expectedUnits: ['baar'],
    criticalTerms: ['pet me tez dard', 'subah se', 'vomiting']
  },
  {
    id: 'CORPUS-HINGLISH-005',
    language: 'HINGLISH',
    category: 'PATIENT_HISTORY',
    groundTruth: 'Patient ki age 58 years hai aur history of hypertension hai pichhle paanch saal se',
    expectedMedicines: [],
    expectedVitals: [],
    expectedNumerics: ['58', '5'],
    expectedUnits: ['years', 'saal'],
    criticalTerms: ['58 years', 'hypertension', 'paanch saal']
  },

  // --------------------------------------------------------------------------
  // Category 2: Hinglish Vitals & Observations (5 items)
  // --------------------------------------------------------------------------
  {
    id: 'CORPUS-HINGLISH-006',
    language: 'HINGLISH',
    category: 'VITALS_OBSERVATION',
    groundTruth: 'Patient ka BP 140 by 90 hai aur pulse rate 78 bpm hai',
    expectedMedicines: [],
    expectedVitals: [
      { param: 'BLOOD_PRESSURE', systolic: 140, diastolic: 90 },
      { param: 'HEART_RATE', rawValue: 78 }
    ],
    expectedNumerics: ['140', '90', '78'],
    expectedUnits: ['bpm'],
    criticalTerms: ['BP 140 by 90', 'pulse rate 78']
  },
  {
    id: 'CORPUS-HINGLISH-007',
    language: 'HINGLISH',
    category: 'VITALS_OBSERVATION',
    groundTruth: 'SpO2 96 percent hai room air par aur respiratory rate 18 breaths per minute hai',
    expectedMedicines: [],
    expectedVitals: [
      { param: 'SpO2', rawValue: 96 },
      { param: 'RESPIRATORY_RATE', rawValue: 18 }
    ],
    expectedNumerics: ['96', '18'],
    expectedUnits: ['%', 'breaths per minute'],
    criticalTerms: ['SpO2 96 percent', 'respiratory rate 18']
  },
  {
    id: 'CORPUS-HINGLISH-008',
    language: 'HINGLISH',
    category: 'VITALS_OBSERVATION',
    groundTruth: 'Body temperature 101.4 Fahrenheit hai high grade fever ke sath',
    expectedMedicines: [],
    expectedVitals: [{ param: 'TEMPERATURE', rawValue: 101.4 }],
    expectedNumerics: ['101.4'],
    expectedUnits: ['Fahrenheit'],
    criticalTerms: ['101.4 Fahrenheit', 'high grade fever']
  },
  {
    id: 'CORPUS-HINGLISH-009',
    language: 'HINGLISH',
    category: 'VITALS_OBSERVATION',
    groundTruth: 'Blood pressure 118 by 76 mmHg hai jo bilkul normal hai',
    expectedMedicines: [],
    expectedVitals: [{ param: 'BLOOD_PRESSURE', systolic: 118, diastolic: 76 }],
    expectedNumerics: ['118', '76'],
    expectedUnits: ['mmHg'],
    criticalTerms: ['118 by 76 mmHg', 'normal']
  },
  {
    id: 'CORPUS-HINGLISH-010',
    language: 'HINGLISH',
    category: 'VITALS_OBSERVATION',
    groundTruth: 'Pulse 110 beats per minute hai tachycardia present hai',
    expectedMedicines: [],
    expectedVitals: [{ param: 'HEART_RATE', rawValue: 110 }],
    expectedNumerics: ['110'],
    expectedUnits: ['beats per minute'],
    criticalTerms: ['Pulse 110', 'tachycardia']
  },

  // --------------------------------------------------------------------------
  // Category 3: Hinglish Doctor Dictation & Prescriptions (8 items)
  // --------------------------------------------------------------------------
  {
    id: 'CORPUS-HINGLISH-011',
    language: 'HINGLISH',
    category: 'PRESCRIPTION',
    groundTruth: 'Dolo 650 ek tablet SOS lena hai jab bukhar 100 se upar ho',
    expectedMedicines: ['Dolo 650'],
    expectedVitals: [],
    expectedNumerics: ['650', '1', '100'],
    expectedUnits: ['tablet'],
    criticalTerms: ['Dolo 650', 'SOS', 'bukhar 100']
  },
  {
    id: 'CORPUS-HINGLISH-012',
    language: 'HINGLISH',
    category: 'PRESCRIPTION',
    groundTruth: 'Telmisartan 40 mg subah nashte ke baad daily lena hai',
    expectedMedicines: ['Telmisartan'],
    expectedVitals: [],
    expectedNumerics: ['40'],
    expectedUnits: ['mg'],
    criticalTerms: ['Telmisartan', '40 mg', 'nashte ke baad']
  },
  {
    id: 'CORPUS-HINGLISH-013',
    language: 'HINGLISH',
    category: 'PRESCRIPTION',
    groundTruth: 'Pantoprazole 40 mg subah khali pet empty stomach lene ki advice di hai',
    expectedMedicines: ['Pantoprazole'],
    expectedVitals: [],
    expectedNumerics: ['40'],
    expectedUnits: ['mg'],
    criticalTerms: ['Pantoprazole', '40 mg', 'empty stomach']
  },
  {
    id: 'CORPUS-HINGLISH-014',
    language: 'HINGLISH',
    category: 'PRESCRIPTION',
    groundTruth: 'Augmentin 625 Duo ek tablet subah aur ek tablet sham ko khane ke baad dena',
    expectedMedicines: ['Augmentin 625 Duo'],
    expectedVitals: [],
    expectedNumerics: ['625', '1'],
    expectedUnits: ['tablet'],
    criticalTerms: ['Augmentin 625 Duo', 'khane ke baad']
  },
  {
    id: 'CORPUS-HINGLISH-015',
    language: 'HINGLISH',
    category: 'PRESCRIPTION',
    groundTruth: 'Azithromycin 500 mg once daily teen din ke liye start karein',
    expectedMedicines: ['Azithromycin'],
    expectedVitals: [],
    expectedNumerics: ['500', '3'],
    expectedUnits: ['mg', 'din'],
    criticalTerms: ['Azithromycin', '500 mg', 'once daily']
  },
  {
    id: 'CORPUS-HINGLISH-016',
    language: 'HINGLISH',
    category: 'PRESCRIPTION',
    groundTruth: 'Glycomet 500 mg ek tablet din me do baar after meals lena hai',
    expectedMedicines: ['Glycomet 500'],
    expectedVitals: [],
    expectedNumerics: ['500', '1', '2'],
    expectedUnits: ['mg', 'tablet'],
    criticalTerms: ['Glycomet 500', 'after meals']
  },
  {
    id: 'CORPUS-HINGLISH-017',
    language: 'HINGLISH',
    category: 'PRESCRIPTION',
    groundTruth: 'Montair-LC ek tablet raat ko sote samay paanch din ke liye lena hai',
    expectedMedicines: ['Montair-LC'],
    expectedVitals: [],
    expectedNumerics: ['1', '5'],
    expectedUnits: ['tablet', 'din'],
    criticalTerms: ['Montair-LC', 'paanch din']
  },
  {
    id: 'CORPUS-HINGLISH-018',
    language: 'HINGLISH',
    category: 'PRESCRIPTION',
    groundTruth: 'Pan 40 ek tablet subah empty stomach continue rakhein',
    expectedMedicines: ['Pan 40'],
    expectedVitals: [],
    expectedNumerics: ['40', '1'],
    expectedUnits: ['tablet'],
    criticalTerms: ['Pan 40', 'empty stomach']
  },

  // --------------------------------------------------------------------------
  // Category 4: Lab Reports & Diagnostics (4 items)
  // --------------------------------------------------------------------------
  {
    id: 'CORPUS-HINGLISH-019',
    language: 'HINGLISH',
    category: 'LAB_REPORT',
    groundTruth: 'Sugar fasting 126 mg per dl hai aur postprandial 180 mg per dl hai',
    expectedMedicines: [],
    expectedVitals: [],
    expectedNumerics: ['126', '180'],
    expectedUnits: ['mg/dL', 'mg per dl'],
    criticalTerms: ['Sugar fasting 126', 'postprandial 180']
  },
  {
    id: 'CORPUS-HINGLISH-020',
    language: 'HINGLISH',
    category: 'LAB_REPORT',
    groundTruth: 'Random blood sugar 240 mg per dl hai jo kafi elevated hai',
    expectedMedicines: [],
    expectedVitals: [{ param: 'BLOOD_GLUCOSE', rawValue: 240 }],
    expectedNumerics: ['240'],
    expectedUnits: ['mg/dL'],
    criticalTerms: ['Random blood sugar 240', 'elevated']
  },
  {
    id: 'CORPUS-HINGLISH-021',
    language: 'HINGLISH',
    category: 'LAB_REPORT',
    groundTruth: 'Serum creatinine 1.4 mg per dl hai aur blood urea 38 mg per dl hai',
    expectedMedicines: [],
    expectedVitals: [],
    expectedNumerics: ['1.4', '38'],
    expectedUnits: ['mg/dL', 'mg per dl'],
    criticalTerms: ['creatinine 1.4', 'urea 38']
  },
  {
    id: 'CORPUS-HINGLISH-022',
    language: 'HINGLISH',
    category: 'LAB_REPORT',
    groundTruth: 'Hemoglobin 11.2 gram per dl hai mild anemia present hai',
    expectedMedicines: [],
    expectedVitals: [],
    expectedNumerics: ['11.2'],
    expectedUnits: ['g/dL', 'gram per dl'],
    criticalTerms: ['Hemoglobin 11.2', 'anemia']
  },

  // --------------------------------------------------------------------------
  // Category 5: Pure Hindi Clinical Phrases (4 items)
  // --------------------------------------------------------------------------
  {
    id: 'CORPUS-HINDI-023',
    language: 'HINDI',
    category: 'PATIENT_HISTORY',
    groundTruth: 'Marij ko pichhle teen din se tez bukhar aur badan dard hai',
    expectedMedicines: [],
    expectedVitals: [],
    expectedNumerics: ['3'],
    expectedUnits: ['din'],
    criticalTerms: ['teen din', 'tez bukhar', 'badan dard']
  },
  {
    id: 'CORPUS-HINDI-024',
    language: 'HINDI',
    category: 'PATIENT_HISTORY',
    groundTruth: 'Chhati me tez jalan aur khana khane ke baad uljhan ho rahi hai',
    expectedMedicines: [],
    expectedVitals: [],
    expectedNumerics: [],
    expectedUnits: [],
    criticalTerms: ['chhati me tez jalan', 'khana khane ke baad']
  },
  {
    id: 'CORPUS-HINDI-025',
    language: 'HINDI',
    category: 'PATIENT_HISTORY',
    groundTruth: 'Doctor sahab saans phool rahi hai aur chalne me pareshani hoti hai',
    expectedMedicines: [],
    expectedVitals: [],
    expectedNumerics: [],
    expectedUnits: [],
    criticalTerms: ['saans phool rahi hai', 'chalne me pareshani']
  },
  {
    id: 'CORPUS-HINDI-026',
    language: 'HINDI',
    category: 'PATIENT_HISTORY',
    groundTruth: 'Dawa lene ke baad chakkar aa raha hai aur kamzori lag rahi hai',
    expectedMedicines: [],
    expectedVitals: [],
    expectedNumerics: [],
    expectedUnits: [],
    criticalTerms: ['chakkar aa raha hai', 'kamzori']
  },

  // --------------------------------------------------------------------------
  // Category 6: Indian-accent English Clinical Dictation (3 items)
  // --------------------------------------------------------------------------
  {
    id: 'CORPUS-ENGLISH-027',
    language: 'ENGLISH',
    category: 'DOCTOR_DICTATION',
    groundTruth: 'Patient presents with persistent dry cough and moderate fever since four days',
    expectedMedicines: [],
    expectedVitals: [],
    expectedNumerics: ['4'],
    expectedUnits: ['days'],
    criticalTerms: ['persistent dry cough', 'moderate fever', 'four days']
  },
  {
    id: 'CORPUS-ENGLISH-028',
    language: 'ENGLISH',
    category: 'DOCTOR_DICTATION',
    groundTruth: 'Blood pressure recorded as 130 over 85 mmHg in right arm sitting position',
    expectedMedicines: [],
    expectedVitals: [{ param: 'BLOOD_PRESSURE', systolic: 130, diastolic: 85 }],
    expectedNumerics: ['130', '85'],
    expectedUnits: ['mmHg'],
    criticalTerms: ['130 over 85 mmHg', 'sitting position']
  },
  {
    id: 'CORPUS-ENGLISH-029',
    language: 'ENGLISH',
    category: 'PRESCRIPTION',
    groundTruth: 'Advise Tab Calpol 650 twice daily and Syrup Ascoril five ml thrice daily',
    expectedMedicines: ['Calpol 650'],
    expectedVitals: [],
    expectedNumerics: ['650', '5'],
    expectedUnits: ['ml'],
    criticalTerms: ['Calpol 650', 'Ascoril', 'five ml']
  },

  // --------------------------------------------------------------------------
  // Category 7: Out-of-bounds Safety Anchors (2 items)
  // --------------------------------------------------------------------------
  {
    id: 'CORPUS-ANCHOR-030',
    language: 'HINGLISH',
    category: 'SAFETY_ANCHOR',
    groundTruth: 'Doctor reports patient SpO2 296 percent in room air',
    expectedMedicines: [],
    expectedVitals: [{ param: 'SpO2', rawValue: 296, status: 'REJECTED' }],
    expectedNumerics: ['296'],
    expectedUnits: ['%'],
    criticalTerms: ['SpO2 296 percent']
  },
  {
    id: 'CORPUS-ANCHOR-031',
    language: 'HINGLISH',
    category: 'SAFETY_ANCHOR',
    groundTruth: 'Patient BP is 80 over 120 recorded during examination',
    expectedMedicines: [],
    expectedVitals: [{ param: 'BLOOD_PRESSURE', systolic: 80, diastolic: 120, status: 'REJECTED' }],
    expectedNumerics: ['80', '120'],
    expectedUnits: ['mmHg'],
    criticalTerms: ['80 over 120']
  }
];

/**
 * Generate audio WAV fixtures using Windows SpeechSynthesizer
 */
export function generateCorpusAudio(outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const generatedFiles = [];

  for (const item of P0_02_CORPUS_ITEMS) {
    const audioPath = path.join(outputDir, `${item.id}.wav`);
    if (!fs.existsSync(audioPath)) {
      const escapedText = item.groundTruth.replace(/'/g, "''");
      const psScript = `Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.SetOutputToWaveFile('${audioPath.replace(/\\/g, '\\\\')}'); $s.Speak('${escapedText}'); $s.Dispose();`;
      execSync(`powershell -Command "${psScript}"`);
    }
    item.audioPath = audioPath;
    generatedFiles.push(audioPath);
  }

  return generatedFiles;
}

/**
 * Levenshtein distance calculation for string or token array
 */
export function levenshtein(a, b) {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = [];
  for (let i = 0; i <= an; i++) matrix[i] = [i];
  for (let j = 0; j <= bn; j++) matrix[0][j] = j;

  for (let i = 1; i <= an; i++) {
    for (let j = 1; j <= bn; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[an][bn];
}

/**
 * Tokenize string for Word Error Rate evaluation
 */
export function normalizeTokens(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Compute Word Error Rate (WER)
 */
export function computeWER(reference, hypothesis) {
  const refTokens = normalizeTokens(reference);
  const hypTokens = normalizeTokens(hypothesis);
  if (refTokens.length === 0) return hypTokens.length === 0 ? 0 : 1;
  const dist = levenshtein(refTokens, hypTokens);
  return dist / refTokens.length;
}

/**
 * Compute Character Error Rate (CER)
 */
export function computeCER(reference, hypothesis) {
  const refChars = reference.toLowerCase().replace(/\s+/g, '');
  const hypChars = hypothesis.toLowerCase().replace(/\s+/g, '');
  if (refChars.length === 0) return hypChars.length === 0 ? 0 : 1;
  const dist = levenshtein(refChars, hypChars);
  return dist / refChars.length;
}
