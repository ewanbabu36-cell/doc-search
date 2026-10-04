import React, { useState, useMemo } from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';

export type DepartmentKey = 'ALL' | 'HEMATOLOGY' | 'BIOCHEMISTRY' | 'MICROBIOLOGY' | 'HISTOPATHOLOGY';
export type WorklistFilterKey = 'CRITICAL_FIRST' | 'ABNORMAL' | 'BIOPSY' | 'ROUTINE' | 'ALL';

export interface SpecimenParameter {
  name: string;
  value: string;
  unit: string;
  refRange: string;
  flag: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' | 'ABNORMAL' | 'BIOPSY';
  machineFlag: string;
  serumIndices: string;
}

export interface DeltaVisit {
  visitLabel: string;
  date: string;
  value: number;
  displayValue: string;
  deltaPercent?: string;
}

export interface SpecimenAuditStep {
  time: string;
  action: string;
  actor: string;
  details: string;
}

export interface RichSpecimenRecord {
  id: string;
  orderNumber: string;
  accessionNumber: string;
  barcode: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  patientAge: string;
  patientGender: 'MALE' | 'FEMALE' | 'OTHER';
  department: 'HEMATOLOGY' | 'BIOCHEMISTRY' | 'MICROBIOLOGY' | 'HISTOPATHOLOGY';
  filterCategory: 'CRITICAL' | 'ABNORMAL' | 'BIOPSY' | 'ROUTINE';
  priority: 'STAT' | 'ROUTINE';
  isCritical: boolean;
  status: 'RESULT_READY' | 'PROCESSING' | 'SAMPLE_COLLECTED' | 'VERIFIED' | 'CANCELLED';
  statusLabel: string;
  orderingDoctorName: string;
  wardOrLocation: string;
  specimenType: string;
  tubeType: string;
  collectionTime: string;
  intakeTime: string;
  analyzerMachine: string;
  clinicalHistory: string;
  parameters: SpecimenParameter[];
  deltaCheck: {
    biomarker: string;
    unit: string;
    alertMessage: string;
    isViolation: boolean;
    visits: DeltaVisit[];
  };
  auditHistory: SpecimenAuditStep[];
  pathologistImpression: string;
  reflexOptions: string[];
}

export const TARGET_SPECIMENS: RichSpecimenRecord[] = [
  // 1. Critical First - Serum Potassium Hyperkalemia (Biochemistry)
  {
    id: 'SPEC-90414',
    orderNumber: 'ORD-LAB-90414',
    accessionNumber: 'LAB-2026-90414',
    barcode: 'BC-90414-POT',
    patientId: 'PAT-33019',
    patientName: 'Deepak Gupta',
    patientMrn: 'MRN-33019',
    patientAge: '62 Y',
    patientGender: 'MALE',
    department: 'BIOCHEMISTRY',
    filterCategory: 'CRITICAL',
    priority: 'STAT',
    isCritical: true,
    status: 'RESULT_READY',
    statusLabel: 'CRITICAL PANIC (Call Desk Required)',
    orderingDoctorName: 'Dr. Vivek Sharma, MD (Cardiology)',
    wardOrLocation: 'Coronary Care Unit (CCU - Bed 3)',
    specimenType: 'Venous Blood (Serum)',
    tubeType: 'Gold SST Vacutainer (Gel Separator)',
    collectionTime: 'Today 08:30 AM',
    intakeTime: 'Today 08:52 AM',
    analyzerMachine: 'Roche Cobas 6000 (ISE + c501 Chemistry)',
    clinicalHistory: '62M with ischemic cardiomyopathy, Left Ventricular Ejection Fraction 35%, admitted with sudden palpitations, profound lethargy. Current medications: Spironolactone 25mg, Enalapril 10mg, Digoxin 0.125mg. Indication: Emergent Electrolyte Assessment.',
    parameters: [
      {
        name: 'Serum Potassium (ISE Direct)',
        value: '6.80',
        unit: 'mEq/L',
        refRange: '3.50 - 5.10',
        flag: 'CRITICAL',
        machineFlag: 'CRIT-HIGH [Cobas ISE Rack 2, Slot 4]',
        serumIndices: 'Lipemia: 0, Icterus: 0, Hemolysis: Absent (H:0)'
      },
      {
        name: 'Serum Sodium (ISE Direct)',
        value: '132.0',
        unit: 'mEq/L',
        refRange: '135.0 - 145.0',
        flag: 'LOW',
        machineFlag: 'L [Cobas ISE]',
        serumIndices: 'Normal'
      },
      {
        name: 'Serum Creatinine (Jaffe)',
        value: '2.10',
        unit: 'mg/dL',
        refRange: '0.70 - 1.20',
        flag: 'HIGH',
        machineFlag: 'H [Roche c501]',
        serumIndices: 'Normal'
      },
      {
        name: 'Blood Urea Nitrogen (BUN)',
        value: '48.0',
        unit: 'mg/dL',
        refRange: '8.0 - 20.0',
        flag: 'HIGH',
        machineFlag: 'H [Roche c501]',
        serumIndices: 'Normal'
      },
      {
        name: 'Estimated GFR (CKD-EPI)',
        value: '32.0',
        unit: 'mL/min/1.73m²',
        refRange: '> 60.0',
        flag: 'LOW',
        machineFlag: 'L [Calculated Parameter]',
        serumIndices: 'Stage 3b CKD'
      }
    ],
    deltaCheck: {
      biomarker: 'Serum Potassium (mEq/L)',
      unit: 'mEq/L',
      alertMessage: 'CRITICAL PANIC VALUE: Potassium > 6.5 mEq/L poses imminent risk of ventricular fibrillation/asystole. Mandatory telephonic read-back required per NABL ISO-15189 clause 5.8.2.',
      isViolation: true,
      visits: [
        { visitLabel: 'Visit 1 (2 months ago)', date: '04 Aug 2026', value: 4.20, displayValue: '4.20 mEq/L' },
        { visitLabel: 'Visit 2 (2 weeks ago)', date: '18 Sep 2026', value: 4.80, displayValue: '4.80 mEq/L', deltaPercent: '+14.3%' },
        { visitLabel: 'Visit 3 (Today)', date: '04 Oct 2026', value: 6.80, displayValue: '6.80 mEq/L', deltaPercent: '+41.7% surge' }
      ]
    },
    auditHistory: [
      { time: '08:30 AM', action: 'Venipuncture Draw', actor: 'Phlebotomist Anita V.', details: 'Vacutainer Gold SST barcode BC-90414-POT scanned' },
      { time: '08:52 AM', action: 'Centrifugation', actor: 'Technician Suresh K.', details: 'Centrifuged at 3000 RPM (Zero hemolysis confirmed)' },
      { time: '09:14 AM', action: 'Cobas 6000 ISE Run', actor: 'Host Query ASTM', details: 'Dual ISE electrode test confirmed 6.80 mEq/L' },
      { time: '09:16 AM', action: 'LIMS Panic Flagging', actor: 'Rules Engine v2.4', details: 'Critical Panic limit (>6.5) triggered call desk workflow' },
      { time: '09:18 AM', action: 'Pathologist Intake', actor: 'Dr. Shahab (MD)', details: 'Awaiting telephonic read-back log & digital sign-off' }
    ],
    pathologistImpression: 'Marked life-threatening hyperkalemia (6.8 mEq/L) with moderate azotemia in a patient on potassium-sparing medications. Telephonic verbal notification logged to CCU. Immediate ECG and anti-hyperkalemic measures advised.',
    reflexOptions: [
      'Reflex Serum Calcium (Ionized & Total)',
      'Reflex High-Sensitivity Troponin-I STAT',
      'Reflex Arterial Blood Gas (ABG Electrolytes)'
    ]
  },

  // 2. Abnormal / Delta Check Surge - Serum Creatinine (Biochemistry)
  {
    id: 'SPEC-90413',
    orderNumber: 'ORD-LAB-90413',
    accessionNumber: 'LAB-2026-90413',
    barcode: 'BC-90413-CRE',
    patientId: 'PAT-77341',
    patientName: 'Mohammad Rizwan',
    patientMrn: 'MRN-77341',
    patientAge: '58 Y',
    patientGender: 'MALE',
    department: 'BIOCHEMISTRY',
    filterCategory: 'ABNORMAL',
    priority: 'STAT',
    isCritical: false,
    status: 'RESULT_READY',
    statusLabel: 'DELTA CHECK EXCEPTION (+209% Surge)',
    orderingDoctorName: 'Dr. Neha Gupta, MD (Nephrology)',
    wardOrLocation: 'Cardiothoracic ICU (CTICU - Bed 4)',
    specimenType: 'Serum Clot Activator',
    tubeType: 'Plain Red Top Vacutainer',
    collectionTime: 'Today 08:15 AM',
    intakeTime: 'Today 08:40 AM',
    analyzerMachine: 'Roche Cobas c311 Clinical Chemistry',
    clinicalHistory: '58M, Type-2 Diabetes Mellitus x 12 yrs, Hypertension. Day 3 post-CABG. Oliguria (urine output <25 mL/hr over past 8 hours). Indication: Evaluate sudden deterioration of renal function.',
    parameters: [
      {
        name: 'Serum Creatinine (Enzymatic)',
        value: '3.40',
        unit: 'mg/dL',
        refRange: '0.70 - 1.20',
        flag: 'HIGH',
        machineFlag: 'H [Cobas c311 Channel 4]',
        serumIndices: 'H:0, I:0, L:0'
      },
      {
        name: 'Blood Urea Nitrogen',
        value: '78.0',
        unit: 'mg/dL',
        refRange: '8.0 - 20.0',
        flag: 'HIGH',
        machineFlag: 'H [Cobas c311]',
        serumIndices: 'Normal'
      },
      {
        name: 'Serum Uric Acid',
        value: '9.40',
        unit: 'mg/dL',
        refRange: '3.50 - 7.20',
        flag: 'HIGH',
        machineFlag: 'H [Cobas c311]',
        serumIndices: 'Normal'
      },
      {
        name: 'Serum Phosphorus',
        value: '5.80',
        unit: 'mg/dL',
        refRange: '2.50 - 4.50',
        flag: 'HIGH',
        machineFlag: 'H [Cobas c311]',
        serumIndices: 'Normal'
      },
      {
        name: 'eGFR (CKD-EPI 2021)',
        value: '17.0',
        unit: 'mL/min/1.73m²',
        refRange: '> 90.0',
        flag: 'CRITICAL',
        machineFlag: 'CRIT-LOW [Calculated]',
        serumIndices: 'KDIGO Stage 3 AKI'
      }
    ],
    deltaCheck: {
      biomarker: 'Serum Creatinine (mg/dL)',
      unit: 'mg/dL',
      alertMessage: 'DELTA CHECK RULE VIOLATION: >200% acute surge within 30 days (0.90 -> 3.40 mg/dL). Analyzer rerun on second channel confirmed 3.39 mg/dL. Genuine Acute Kidney Injury (AKI).',
      isViolation: true,
      visits: [
        { visitLabel: 'Visit 1 (3 months ago)', date: '08 Jul 2026', value: 0.90, displayValue: '0.90 mg/dL' },
        { visitLabel: 'Visit 2 (1 month ago)', date: '02 Sep 2026', value: 1.10, displayValue: '1.10 mg/dL', deltaPercent: '+22.2%' },
        { visitLabel: 'Visit 3 (Today)', date: '04 Oct 2026', value: 3.40, displayValue: '3.40 mg/dL', deltaPercent: '+209.1% surge' }
      ]
    },
    auditHistory: [
      { time: '08:15 AM', action: 'Sample Collection', actor: 'Phlebotomist Rajesh K.', details: 'Drawn from central venous catheter in CTICU' },
      { time: '08:42 AM', action: 'Accession Intake', actor: 'Reception Desk', details: 'Barcode verified and logged into LIMS queue' },
      { time: '09:02 AM', action: 'Roche c311 Primary Run', actor: 'Automated Analyzer', details: 'Measured 3.40 mg/dL Creatinine' },
      { time: '09:08 AM', action: 'Automated Delta Check', actor: 'Rules Engine v2.4', details: 'Acute shift flagged vs Sep 02 baseline (1.10 mg/dL)' },
      { time: '09:12 AM', action: 'Duplicate Machine Rerun', actor: 'Cobas Auto-Dilution', details: 'Channel 2 duplicate confirmed 3.39 mg/dL' }
    ],
    pathologistImpression: 'Severe acute azotemia consistent with post-operative Acute Kidney Injury (KDIGO Stage 3) superimposed on diabetic nephropathy. Pre-analytical artifact excluded by rerun. Nephrology consult recommended.',
    reflexOptions: [
      'Reflex Spot Urine Protein/Creatinine Ratio',
      'Reflex Urine Microscopic Examination (Casts & Sediment)',
      'Reflex Serum Cystatin C (Confirmatory GFR)'
    ]
  },

  // 3. Biopsy - Squamous Cell Carcinoma (Histopathology)
  {
    id: 'SPEC-90417',
    orderNumber: 'ORD-LAB-90417',
    accessionNumber: 'LAB-2026-90417',
    barcode: 'BC-90417-BIO',
    patientId: 'PAT-92014',
    patientName: 'Rameshwar Nath',
    patientMrn: 'MRN-92014',
    patientAge: '64 Y',
    patientGender: 'MALE',
    department: 'HISTOPATHOLOGY',
    filterCategory: 'BIOPSY',
    priority: 'STAT',
    isCritical: false,
    status: 'RESULT_READY',
    statusLabel: 'BIOPSY HISTOPATHOLOGY (Malignancy Staged)',
    orderingDoctorName: 'Dr. Arvind Saxena, MS, MCh (Oncology)',
    wardOrLocation: 'Surgical Oncology OT-2 / Day Care',
    specimenType: 'Tissue Biopsy (Tongue Wedge)',
    tubeType: '10% Neutral Buffered Formalin Container',
    collectionTime: 'Yesterday 04:30 PM',
    intakeTime: 'Yesterday 05:10 PM',
    analyzerMachine: 'Digital Pathology / WSI Slide Scanner (40x Leica)',
    clinicalHistory: '64M, Chronic beedi smoker (40 pack-years). Non-healing indurated ulcerated lesion (2.2 x 1.6 cm) over left lateral border of anterior tongue x 3 months. No palpable cervical lymphadenopathy. Indication: Incisional Diagnostic Biopsy.',
    parameters: [
      {
        name: 'Specimen Gross Dimensions',
        value: '1.2 x 0.8 x 0.5 cm',
        unit: 'cm',
        refRange: 'Gross Tissue Description',
        flag: 'BIOPSY',
        machineFlag: 'Cassette #H-26-90417 (Blocks B1, B2)',
        serumIndices: 'Formalin Fixed'
      },
      {
        name: 'Histological Type',
        value: 'Invasive Squamous Cell Carcinoma',
        unit: 'WHO Grade II',
        refRange: 'Normal Squamous Mucosa',
        flag: 'ABNORMAL',
        machineFlag: 'Moderately Differentiated (Keratinizing)',
        serumIndices: 'Malignancy Confirmed'
      },
      {
        name: 'Mitotic Count',
        value: '6',
        unit: '/ 10 HPF',
        refRange: '0 - 1 / 10 HPF',
        flag: 'HIGH',
        machineFlag: 'Atypical Tri-polar Mitoses Seen',
        serumIndices: 'High Proliferation'
      },
      {
        name: 'Perineural Invasion (PNI)',
        value: 'Present (Positive)',
        unit: 'Status',
        refRange: 'Absent',
        flag: 'HIGH',
        machineFlag: 'Tumor Nests Abutting Nerve Fibers',
        serumIndices: 'High-Risk Factor'
      },
      {
        name: 'Deep Surgical Margin',
        value: 'Involved (Incisional Biopsy)',
        unit: 'Clearance',
        refRange: 'Clear (> 0.5 cm)',
        flag: 'HIGH',
        machineFlag: 'Subepithelial Stroma Infiltrated',
        serumIndices: 'Wide Excision Required'
      }
    ],
    deltaCheck: {
      biomarker: 'Histopathological Stage Progression',
      unit: 'Stage',
      alertMessage: 'MALIGNANT TRANSFORMATION DETECTED: Patient progressed from Severe Dysplasia / CIS (April 2026 biopsy) to Invasive Moderately Differentiated Squamous Cell Carcinoma.',
      isViolation: true,
      visits: [
        { visitLabel: 'Visit 1 (1 year ago)', date: '12 Nov 2025', value: 1.0, displayValue: 'Mild Dysplasia' },
        { visitLabel: 'Visit 2 (6 months ago)', date: '15 Apr 2026', value: 2.0, displayValue: 'Severe Dysplasia / CIS', deltaPercent: 'Progression' },
        { visitLabel: 'Visit 3 (Today)', date: '04 Oct 2026', value: 3.0, displayValue: 'Invasive SCC pT2', deltaPercent: 'Malignant' }
      ]
    },
    auditHistory: [
      { time: 'Yesterday 04:30 PM', action: 'Tissue Excision', actor: 'Dr. Arvind Saxena', details: 'Incisional wedge placed in 10% neutral buffered formalin' },
      { time: 'Yesterday 05:30 PM', action: 'Gross Accessioning', actor: 'Dr. Shahab (MD)', details: 'Cassette #H-26-90417 prepared (2 blocks)' },
      { time: 'Today 06:00 AM', action: 'Microtomy & Staining', actor: 'Technician Ramesh B.', details: 'Sectioned at 4 microns & stained with Hematoxylin-Eosin' },
      { time: 'Today 08:30 AM', action: 'Whole Slide Imaging (WSI)', actor: 'Digital WSI Scanner', details: 'Digitized at 40x magnification (0.25 µm/pixel resolution)' },
      { time: 'Today 09:30 AM', action: 'Microscopic Diagnosis', actor: 'Dr. Shahab (MD)', details: 'Diagnostic sign-off ready with Class-3 DSC Token' }
    ],
    pathologistImpression: 'MODERATELY DIFFERENTIATED SQUAMOUS CELL CARCINOMA (INVASIVE), LEFT LATERAL BORDER OF TONGUE. Perineural invasion identified. Staging correlate: pT2. Immediate tumor board review and wide local excision with ipsilateral neck dissection advised.',
    reflexOptions: [
      'Reflex IHC: p16 (HPV Surrogate Marker)',
      'Reflex IHC: Ki-67 Proliferation Index',
      'Reflex IHC: p53 / Cyclin D1 Oncoprotein Panel'
    ]
  },

  // 4. Abnormal - Severe Thrombocytopenia with PBS Review (Hematology)
  {
    id: 'SPEC-90410',
    orderNumber: 'ORD-LAB-90410',
    accessionNumber: 'LAB-2026-90410',
    barcode: 'BC-90410-PLT',
    patientId: 'PAT-41029',
    patientName: 'Suresh Rao',
    patientMrn: 'MRN-41029',
    patientAge: '54 Y',
    patientGender: 'MALE',
    department: 'HEMATOLOGY',
    filterCategory: 'ABNORMAL',
    priority: 'STAT',
    isCritical: true,
    status: 'RESULT_READY',
    statusLabel: 'SEVERE THROMBOCYTOPENIA (Smear Verified)',
    orderingDoctorName: 'Dr. Rajesh Sharma, MD (Internal Medicine)',
    wardOrLocation: 'Medical Ward A - Bed 12',
    specimenType: 'Whole Blood (Venous)',
    tubeType: 'Lavender EDTA K2 Vacutainer',
    collectionTime: 'Today 08:00 AM',
    intakeTime: 'Today 08:20 AM',
    analyzerMachine: 'Sysmex XN-550 Automated Hematology System',
    clinicalHistory: '54M, Marked fatigue, progressive pallor, lower limb petechiae x 2 weeks. Epistaxis 2 days ago. No splenomegaly. Indication: CBC, ESR, and Peripheral Blood Smear Examination.',
    parameters: [
      {
        name: 'Hemoglobin (Hb)',
        value: '7.80',
        unit: 'g/dL',
        refRange: '13.0 - 17.0',
        flag: 'LOW',
        machineFlag: 'L [Sysmex SLS-Hb]',
        serumIndices: 'Microcytic Hypochromic'
      },
      {
        name: 'Total Leukocyte Count (TLC)',
        value: '2,800',
        unit: '/µL',
        refRange: '4,000 - 11,000',
        flag: 'LOW',
        machineFlag: 'L [Sysmex Flow Cytometry]',
        serumIndices: 'Leukopenia'
      },
      {
        name: 'Platelet Count (PLT)',
        value: '28,000',
        unit: '/µL',
        refRange: '150,000 - 450,000',
        flag: 'CRITICAL',
        machineFlag: 'CRIT-LOW [Sysmex Optical PLT-F]',
        serumIndices: 'No Platelet Clumping'
      },
      {
        name: 'Mean Corpuscular Volume (MCV)',
        value: '72.4',
        unit: 'fL',
        refRange: '80.0 - 96.0',
        flag: 'LOW',
        machineFlag: 'L [Sysmex Impedance]',
        serumIndices: 'Microcytosis'
      },
      {
        name: 'Peripheral Blood Smear (PBS)',
        value: 'Bicytopenia, Marked PLT Depletion',
        unit: 'Microscopy',
        refRange: 'Normal Trilineage Morphology',
        flag: 'ABNORMAL',
        machineFlag: 'Eyepiece 100x Oil Immersion Verified',
        serumIndices: '1-2 PLT / Oil Immersion Field'
      }
    ],
    deltaCheck: {
      biomarker: 'Platelet Count (/µL)',
      unit: '/µL',
      alertMessage: 'STEEP PLATELET DROP: Platelet count fell from 185,000 to 28,000 /µL over 6 months (-84.9% decline). Sysmex Optical PLT-F channel excludes EDTA-dependent pseudo-thrombocytopenia.',
      isViolation: true,
      visits: [
        { visitLabel: 'Visit 1 (6 months ago)', date: '10 Apr 2026', value: 185000, displayValue: '185,000 /µL' },
        { visitLabel: 'Visit 2 (2 months ago)', date: '12 Aug 2026', value: 92000, displayValue: '92,000 /µL', deltaPercent: '-50.3%' },
        { visitLabel: 'Visit 3 (Today)', date: '04 Oct 2026', value: 28000, displayValue: '28,000 /µL', deltaPercent: '-69.6% drop' }
      ]
    },
    auditHistory: [
      { time: '08:00 AM', action: 'Phlebotomy Venipuncture', actor: 'Phlebotomist Anita V.', details: 'EDTA tube inverted 8 times (No microclots detected)' },
      { time: '08:22 AM', action: 'Sysmex XN-550 Run', actor: 'Sysmex ASTM Link', details: 'Automated flags: Leukopenia, Thrombocytopenia' },
      { time: '08:35 AM', action: 'Optical PLT-F Rerun', actor: 'Automated Analyzer', details: 'Fluorescence channel confirmed 28,000 /µL' },
      { time: '08:45 AM', action: 'Leishman Stained Smear', actor: 'Technician Suresh K.', details: 'Thin peripheral film prepared and stained' },
      { time: '09:10 AM', action: 'Microscopic Examination', actor: 'Dr. Shahab (MD)', details: 'True thrombocytopenia confirmed on 100x oil immersion' }
    ],
    pathologistImpression: 'Severe thrombocytopenia with moderate microcytic anemia (Bicytopenia). True platelet depletion confirmed on peripheral smear examination. Bone marrow examination and urgent hematology consultation advised.',
    reflexOptions: [
      'Reflex Reticulocyte Count & Immature Reticulocyte Fraction (IRF)',
      'Reflex Serum Ferritin & Total Iron Binding Capacity',
      'Reflex Direct Antiglobulin Test (Coombs Test)'
    ]
  },

  // 5. Abnormal - Urine Culture E. coli (Microbiology)
  {
    id: 'SPEC-90418',
    orderNumber: 'ORD-LAB-90418',
    accessionNumber: 'LAB-2026-90418',
    barcode: 'BC-90418-MIC',
    patientId: 'PAT-55102',
    patientName: 'Pooja Sharma',
    patientMrn: 'MRN-55102',
    patientAge: '34 Y',
    patientGender: 'FEMALE',
    department: 'MICROBIOLOGY',
    filterCategory: 'ABNORMAL',
    priority: 'ROUTINE',
    isCritical: false,
    status: 'RESULT_READY',
    statusLabel: 'BACTERIURIA (>10^5 CFU/mL E. coli)',
    orderingDoctorName: 'Dr. Sunita Kapoor, MD (OBGYN)',
    wardOrLocation: 'Antenatal OPD Clinic #2',
    specimenType: 'Midstream Clean Catch Urine',
    tubeType: 'Sterile Urine Container (Boricon)',
    collectionTime: 'Yesterday 10:30 AM',
    intakeTime: 'Yesterday 11:00 AM',
    analyzerMachine: 'BioMérieux VITEK-2 Automated ID & AST System',
    clinicalHistory: '34F, Gravida 2 Para 1 at 28 weeks gestation. Dysuria, suprapubic cramping, increased frequency x 4 days. Dipstick: Nitrite Positive, Leukocyte Esterase 2+. Indication: Urine Culture & Antimicrobial Susceptibility Testing.',
    parameters: [
      {
        name: 'Urine Gram Stain Smear',
        value: 'Gram-Negative Bacilli (3+)',
        unit: 'Microscopy',
        refRange: 'No Bacteria Seen',
        flag: 'HIGH',
        machineFlag: 'Pus Cells: 25-30/HPF, RBCs: 6-8/HPF',
        serumIndices: 'Active Infection'
      },
      {
        name: 'Colony Count (CLED Agar)',
        value: '> 100,000',
        unit: 'CFU/mL',
        refRange: '< 10,000 CFU/mL',
        flag: 'HIGH',
        machineFlag: 'Significant Bacteriuria (Pure Growth)',
        serumIndices: 'Lactose Fermenter'
      },
      {
        name: 'Organism Identification',
        value: 'Escherichia coli (99% ID)',
        unit: 'Pathogen',
        refRange: 'Sterile',
        flag: 'ABNORMAL',
        machineFlag: 'VITEK-2 GN Card Identification',
        serumIndices: 'Uropathogen'
      },
      {
        name: 'Nitrofurantoin Susceptibility',
        value: 'Sensitive (MIC <= 16)',
        unit: 'CLSI M100',
        refRange: 'Sensitive',
        flag: 'NORMAL',
        machineFlag: 'Pregnancy Category B Safe',
        serumIndices: 'First-Line Oral'
      },
      {
        name: 'Fosfomycin Susceptibility',
        value: 'Sensitive (MIC <= 32)',
        unit: 'CLSI M100',
        refRange: 'Sensitive',
        flag: 'NORMAL',
        machineFlag: 'Single Dose Oral Sachet Safe',
        serumIndices: 'Oral Option'
      }
    ],
    deltaCheck: {
      biomarker: 'Urine Colony Count (CFU/mL)',
      unit: 'CFU/mL',
      alertMessage: 'NEW SIGNIFICANT INFECTION: Prior antenatal urine cultures were sterile (<1,000 CFU/mL). Acute symptomatic gestational urinary tract infection.',
      isViolation: true,
      visits: [
        { visitLabel: 'Visit 1 (6 months ago)', date: '14 Apr 2026', value: 0, displayValue: '0 CFU/mL (Sterile)' },
        { visitLabel: 'Visit 2 (3 months ago)', date: '20 Jul 2026', value: 500, displayValue: '500 CFU/mL (Normal)' },
        { visitLabel: 'Visit 3 (Today)', date: '04 Oct 2026', value: 120000, displayValue: '>100,000 CFU/mL', deltaPercent: 'Active Growth' }
      ]
    },
    auditHistory: [
      { time: 'Yesterday 10:30 AM', action: 'Clean Catch Collection', actor: 'Nurse Sunita D.', details: 'Midstream clean catch urine collected' },
      { time: 'Yesterday 11:15 AM', action: 'Agar Inoculation', actor: 'Technician Rohit S.', details: 'Calibrated loop inoculated on CLED & MacConkey agar' },
      { time: 'Today 07:30 AM', action: 'Colony Inspection', actor: 'Microbiologist Dr. P.', details: 'Significant yellow lactose-fermenting colonies noted' },
      { time: 'Today 08:00 AM', action: 'VITEK-2 AST Run', actor: 'Automated VITEK-2', details: 'GN & AST-N280 cards evaluated per CLSI guidelines' },
      { time: 'Today 09:45 AM', action: 'Susceptibility Sign-Off', actor: 'Dr. Shahab (MD)', details: 'Antimicrobial guide tailored for pregnancy' }
    ],
    pathologistImpression: 'Significant growth of Escherichia coli (>100,000 CFU/mL) in pregnancy. Sensitive to oral Nitrofurantoin and Fosfomycin (Pregnancy Category B). Fluoroquinolones resistant. Obstetrician advised to initiate safe antimicrobial therapy.',
    reflexOptions: [
      'Reflex Extended Spectrum Beta-Lactamase (ESBL) Phenotypic Confirmation',
      'Reflex Repeat Urine Culture (Post-Therapy Test of Cure)'
    ]
  },

  // 6. Routine - Normal Thyroid Profile (Biochemistry)
  {
    id: 'SPEC-90415',
    orderNumber: 'ORD-LAB-90415',
    accessionNumber: 'LAB-2026-90415',
    barcode: 'BC-90415-THY',
    patientId: 'PAT-66120',
    patientName: 'Sunita Devi',
    patientMrn: 'MRN-66120',
    patientAge: '46 Y',
    patientGender: 'FEMALE',
    department: 'BIOCHEMISTRY',
    filterCategory: 'ROUTINE',
    priority: 'ROUTINE',
    isCritical: false,
    status: 'RESULT_READY',
    statusLabel: 'NORMAL THYROID PANEL (Sign-Off Ready)',
    orderingDoctorName: 'Dr. Alok Nath, MD (Endocrinology)',
    wardOrLocation: 'Endocrine OPD Room 104',
    specimenType: 'Venous Blood (Serum)',
    tubeType: 'Serum SST Gold Top Vacutainer',
    collectionTime: 'Today 07:45 AM',
    intakeTime: 'Today 08:15 AM',
    analyzerMachine: 'Roche Cobas e411 Chemiluminescence Immunoassay (ECLIA)',
    clinicalHistory: '46F, Known case of primary hypothyroidism on Levothyroxine 75 mcg daily x 2 years. Asymptomatic, good medication compliance. Indication: Annual thyroid replacement monitoring.',
    parameters: [
      {
        name: 'TSH - Ultrasensitive 3rd Gen',
        value: '2.14',
        unit: 'µIU/mL',
        refRange: '0.45 - 4.50',
        flag: 'NORMAL',
        machineFlag: 'NORMAL [Cobas e411 ECLIA]',
        serumIndices: 'H:0, I:0, L:0'
      },
      {
        name: 'Total Triiodothyronine (T3)',
        value: '1.20',
        unit: 'ng/mL',
        refRange: '0.80 - 2.00',
        flag: 'NORMAL',
        machineFlag: 'NORMAL [Cobas e411]',
        serumIndices: 'Normal'
      },
      {
        name: 'Total Thyroxine (T4)',
        value: '8.40',
        unit: 'µg/dL',
        refRange: '5.10 - 14.10',
        flag: 'NORMAL',
        machineFlag: 'NORMAL [Cobas e411]',
        serumIndices: 'Normal'
      },
      {
        name: 'Anti-Thyroid Peroxidase (Anti-TPO)',
        value: '16.4',
        unit: 'IU/mL',
        refRange: '< 34.0',
        flag: 'NORMAL',
        machineFlag: 'NORMAL [ECLIA]',
        serumIndices: 'Non-reactive'
      }
    ],
    deltaCheck: {
      biomarker: 'Serum TSH (µIU/mL)',
      unit: 'µIU/mL',
      alertMessage: 'EUTHYROID STABILIZATION: Stable euthyroid hormone levels maintained on current replacement therapy.',
      isViolation: false,
      visits: [
        { visitLabel: 'Visit 1 (1 year ago)', date: '18 Sep 2025', value: 8.40, displayValue: '8.40 µIU/mL (Hypothyroid)' },
        { visitLabel: 'Visit 2 (6 months ago)', date: '22 Mar 2026', value: 3.60, displayValue: '3.60 µIU/mL (Improving)' },
        { visitLabel: 'Visit 3 (Today)', date: '04 Oct 2026', value: 2.14, displayValue: '2.14 µIU/mL (Euthyroid)' }
      ]
    },
    auditHistory: [
      { time: '07:45 AM', action: 'Venipuncture Draw', actor: 'Phlebotomist Anita V.', details: 'Fasting venous blood drawn in Gold SST tube' },
      { time: '08:20 AM', action: 'Centrifugation', actor: 'Technician Suresh K.', details: 'Centrifuged at 3000 RPM (Clear serum)' },
      { time: '08:50 AM', action: 'Cobas e411 ECLIA Run', actor: 'Chemiluminescence Link', details: 'All calibrators and controls within ±1.0 SD' },
      { time: '09:15 AM', action: 'Delta Check Check', actor: 'LIMS Engine', details: 'Delta within acceptable biological variation' },
      { time: '09:20 AM', action: 'Sign-Off Ready', actor: 'Dr. Shahab (MD)', details: 'Ready for Class-3 DSC digital sign-off' }
    ],
    pathologistImpression: 'Normal thyroid profile indicating optimal Levothyroxine substitution therapy. Continue current 75 mcg daily dosage and repeat in 12 months.',
    reflexOptions: [
      'Reflex Free T4 & Free T3 (if clinically indicated)'
    ]
  },

  // 7. Routine - Glycated Hemoglobin HbA1c (Biochemistry)
  {
    id: 'SPEC-90408',
    orderNumber: 'ORD-LAB-90408',
    accessionNumber: 'LAB-2026-90408',
    barcode: 'BC-90408-A1C',
    patientId: 'PAT-21098',
    patientName: 'Vikram Singh',
    patientMrn: 'MRN-21098',
    patientAge: '51 Y',
    patientGender: 'MALE',
    department: 'BIOCHEMISTRY',
    filterCategory: 'ROUTINE',
    priority: 'ROUTINE',
    isCritical: false,
    status: 'VERIFIED',
    statusLabel: 'AUTO-DISPATCHED (WhatsApp & Portal QR)',
    orderingDoctorName: 'Dr. Rajesh Sharma, MD (Internal Med)',
    wardOrLocation: 'General Medicine OPD Room 12',
    specimenType: 'Whole Blood (Venous)',
    tubeType: 'Whole Blood EDTA K2 Vacutainer',
    collectionTime: 'Today 07:30 AM',
    intakeTime: 'Today 08:00 AM',
    analyzerMachine: 'Bio-Rad D-10 Automated HPLC Analyzer',
    clinicalHistory: '51M, Known Type 2 Diabetes Mellitus x 5 yrs on Metformin 1000mg BD. Routine quarterly glycemic review.',
    parameters: [
      {
        name: 'HbA1c (Glycated Hemoglobin)',
        value: '6.40',
        unit: '%',
        refRange: '4.00 - 5.60 Non-Diabetic, <7.00 Target',
        flag: 'NORMAL',
        machineFlag: 'NORMAL [Bio-Rad D-10 HPLC]',
        serumIndices: 'NGSP Certified'
      },
      {
        name: 'Estimated Average Glucose (eAG)',
        value: '137.0',
        unit: 'mg/dL',
        refRange: '70.0 - 140.0',
        flag: 'NORMAL',
        machineFlag: 'Calculated (ADA Formula)',
        serumIndices: 'Optimal Target'
      },
      {
        name: 'Fasting Blood Sugar (FBS)',
        value: '112.0',
        unit: 'mg/dL',
        refRange: '70.0 - 100.0',
        flag: 'HIGH',
        machineFlag: 'H [Roche Hexokinase]',
        serumIndices: 'Impaired Fasting'
      }
    ],
    deltaCheck: {
      biomarker: 'HbA1c (%)',
      unit: '%',
      alertMessage: 'PROGRESSIVE GLYCEMIC IMPROVEMENT: Sustained decline from 7.6% -> 6.9% -> 6.4% over past 6 months.',
      isViolation: false,
      visits: [
        { visitLabel: 'Visit 1 (6 months ago)', date: '12 Apr 2026', value: 7.60, displayValue: '7.60%' },
        { visitLabel: 'Visit 2 (3 months ago)', date: '15 Jul 2026', value: 6.90, displayValue: '6.90%' },
        { visitLabel: 'Visit 3 (Today)', date: '04 Oct 2026', value: 6.40, displayValue: '6.40%' }
      ]
    },
    auditHistory: [
      { time: '07:30 AM', action: 'Phlebotomy Intake', actor: 'Phlebotomist Anita V.', details: 'EDTA tube collected and inverted' },
      { time: '08:10 AM', action: 'Bio-Rad D-10 Run', actor: 'HPLC Ion-Exchange', details: 'HbA1c chromatogram sharp without variant hemoglobin' },
      { time: '08:45 AM', action: 'Digital Sign-Off', actor: 'Dr. Shahab (MD)', details: 'Class-3 DSC Token applied' },
      { time: '08:46 AM', action: 'Multi-Channel Dispatch', actor: 'Automated Dispatcher', details: 'WhatsApp PDF, Portal sync, SMS with NABL verification QR sent' }
    ],
    pathologistImpression: 'Good glycemic control achieved on current therapeutic regimen. Continue current management and monitor quarterly.',
    reflexOptions: [
      'Reflex Lipid Profile STAT',
      'Reflex Urine Microalbumin/Creatinine Ratio'
    ]
  }
];

export interface PathologistTargetCockpitViewProps {
  facilityName?: string;
  staffName?: string;
  qcApproved: boolean;
  onToggleQcApproved: () => void;
  onOpenQcModal: () => void;
  onOpenRejectModal: (order?: any) => void;
  onOpenPanicModal: (order?: any) => void;
  onOpenBatchDscModal: () => void;
  onOpenWsiModal: () => void;
  onOpenDeltaModal: (order?: any) => void;
  onNavigateModule: (moduleKey: any, subTab?: string) => void;
  triggerToast: (msg: string) => void;
  activeRolePerspective: 'PATHOLOGIST' | 'TECHNICIAN' | 'PHLEBOTOMIST';
  onChangeRolePerspective: (role: 'PATHOLOGIST' | 'TECHNICIAN' | 'PHLEBOTOMIST') => void;
}

export const PathologistTargetCockpitView: React.FC<PathologistTargetCockpitViewProps> = ({
  facilityName = 'Apex PathLabs & Molecular Diagnostics',
  staffName = 'Dr. Shahab (MD Pathologist, Lab Director)',
  qcApproved,
  onOpenQcModal,
  onOpenRejectModal,
  onOpenPanicModal,
  onOpenBatchDscModal,
  onOpenDeltaModal,
  onOpenWsiModal,
  triggerToast,
  activeRolePerspective,
  onChangeRolePerspective
}) => {
  // Navigation & Filtering State
  const [selectedDept, setSelectedDept] = useState<DepartmentKey>('ALL');
  const [worklistFilter, setWorklistFilter] = useState<WorklistFilterKey>('CRITICAL_FIRST');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecimenId, setSelectedSpecimenId] = useState<string>('SPEC-90414');

  // Modals for Bottom Action Bar
  const [isReflexModalOpen, setIsReflexModalOpen] = useState(false);
  const [selectedReflexTest, setSelectedReflexTest] = useState('');
  const [reflexJustification, setReflexJustification] = useState('');

  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);
  const [repeatProtocol, setRepeatProtocol] = useState<'1_TO_2_DILUTION' | '1_TO_10_DILUTION' | 'PLAIN_REPEAT' | 'REDRAW_REQUEST'>('1_TO_2_DILUTION');
  const [repeatNotes, setRepeatNotes] = useState('');

  // Pathologist Editable Impression Notes
  const [impressionNotes, setImpressionNotes] = useState<Record<string, string>>({});

  // Filtered Specimen Worklist
  const filteredWorklist = useMemo(() => {
    return TARGET_SPECIMENS.filter((specimen) => {
      // Department Filter
      if (selectedDept !== 'ALL' && specimen.department !== selectedDept) {
        return false;
      }

      // Worklist Priority Filter
      if (worklistFilter === 'CRITICAL_FIRST' && !specimen.isCritical && specimen.filterCategory !== 'CRITICAL') {
        // In Critical First view, show criticals, or if none, fallback
      } else if (worklistFilter === 'ABNORMAL' && specimen.filterCategory !== 'ABNORMAL' && !specimen.isCritical) {
        return false;
      } else if (worklistFilter === 'BIOPSY' && specimen.filterCategory !== 'BIOPSY') {
        return false;
      } else if (worklistFilter === 'ROUTINE' && specimen.filterCategory !== 'ROUTINE') {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          specimen.accessionNumber.toLowerCase().includes(q) ||
          specimen.patientName.toLowerCase().includes(q) ||
          specimen.patientMrn.toLowerCase().includes(q) ||
          specimen.barcode.toLowerCase().includes(q) ||
          specimen.specimenType.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    }).sort((a, b) => {
      // Always bubble Critical to the top
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;
      return 0;
    });
  }, [selectedDept, worklistFilter, searchQuery]);

  // Active Selected Specimen
  const activeSpecimen: RichSpecimenRecord = useMemo(() => {
    const found = TARGET_SPECIMENS.find((s) => s.id === selectedSpecimenId);
    if (found) return found;
    if (filteredWorklist[0]) return filteredWorklist[0];
    return TARGET_SPECIMENS[0]!;
  }, [selectedSpecimenId, filteredWorklist]);

  // Current Impression for Active Specimen
  const currentImpression = impressionNotes[activeSpecimen.id] !== undefined
    ? impressionNotes[activeSpecimen.id]
    : activeSpecimen.pathologistImpression;

  // Department counts
  const deptCounts = useMemo(() => {
    return {
      ALL: TARGET_SPECIMENS.length,
      HEMATOLOGY: TARGET_SPECIMENS.filter((s) => s.department === 'HEMATOLOGY').length,
      BIOCHEMISTRY: TARGET_SPECIMENS.filter((s) => s.department === 'BIOCHEMISTRY').length,
      MICROBIOLOGY: TARGET_SPECIMENS.filter((s) => s.department === 'MICROBIOLOGY').length,
      HISTOPATHOLOGY: TARGET_SPECIMENS.filter((s) => s.department === 'HISTOPATHOLOGY').length
    };
  }, []);

  // Handlers for Bottom Action Bar
  const handleConfirmReflex = () => {
    if (!selectedReflexTest) {
      triggerToast('⚠️ Please choose a reflex test from the accredited catalog.');
      return;
    }
    triggerToast(`🧪 Reflex Test Ordered: "${selectedReflexTest}" added to accession ${activeSpecimen.accessionNumber}. Transmitted to analyzer rack.`);
    setIsReflexModalOpen(false);
    setSelectedReflexTest('');
    setReflexJustification('');
  };

  const handleConfirmRepeat = () => {
    const protocolLabel =
      repeatProtocol === '1_TO_2_DILUTION' ? '1:2 Automated Dilution' :
      repeatProtocol === '1_TO_10_DILUTION' ? '1:10 Linearity Dilution' :
      repeatProtocol === 'PLAIN_REPEAT' ? 'Plain Duplicate Run' : 'Phlebotomy Redraw Request';
    triggerToast(`🔁 ASTM Directive Sent: ${protocolLabel} queued on ${activeSpecimen.analyzerMachine}.`);
    setIsRepeatModalOpen(false);
    setRepeatNotes('');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        color: '#F8FAFC',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* =========================================================================
          TOP BAR: Lab Name | Department Filter | Analyzer Status | Pathologist Profile & DSC
          ========================================================================= */}
      <header
        className="ds-glass-panel"
        style={{
          borderRadius: '16px',
          padding: '12px 20px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.92) 100%)',
          border: '1.5px solid rgba(168, 85, 247, 0.35)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        {/* Left: Lab Name & NABL Accreditation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.35rem',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)'
            }}
          >
            🔬
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
                {facilityName}
              </span>
              <Badge variant="primary" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', borderColor: '#10B981', fontSize: '0.68rem', fontWeight: 700 }}>
                NABL ISO-15189
              </Badge>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
              Accredited Clinical Pathology &amp; Molecular Diagnostics Laboratory • Station #01
            </div>
          </div>
        </div>

        {/* Center: Department Filter Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          {(
            [
              { key: 'ALL', label: 'All Depts', icon: '🌐' },
              { key: 'HEMATOLOGY', label: 'Hematology', icon: '🩸' },
              { key: 'BIOCHEMISTRY', label: 'Biochemistry', icon: '🧪' },
              { key: 'MICROBIOLOGY', label: 'Microbiology', icon: '🧫' },
              { key: 'HISTOPATHOLOGY', label: 'Histopath', icon: '🔬' }
            ] as const
          ).map((dept) => {
            const isSelected = selectedDept === dept.key;
            return (
              <button
                key={dept.key}
                type="button"
                onClick={() => {
                  setSelectedDept(dept.key);
                  triggerToast(`Filtered by ${dept.label} Department`);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '7px',
                  border: isSelected ? '1px solid #A855F7' : '1px solid transparent',
                  backgroundColor: isSelected ? 'rgba(168, 85, 247, 0.28)' : 'transparent',
                  color: isSelected ? '#F8FAFC' : '#94A3B8',
                  fontSize: '0.75rem',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{dept.icon}</span>
                <span>{dept.label}</span>
                <span
                  style={{
                    backgroundColor: isSelected ? '#A855F7' : 'rgba(255, 255, 255, 0.08)',
                    color: isSelected ? '#FFF' : '#94A3B8',
                    padding: '1px 5px',
                    borderRadius: '10px',
                    fontSize: '0.65rem',
                    fontWeight: 800
                  }}
                >
                  {deptCounts[dept.key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Analyzer Status (ASTM) + Pathologist Profile & DSC Token */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Analyzer Status (ASTM Connected) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
            <div style={{ fontSize: '0.72rem', color: '#6EE7B7', fontWeight: 800 }}>
              ASTM/HL7 CONNECTED
            </div>
            <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>(3/3 Online)</span>
          </div>

          {/* Pathologist Profile & DSC Token Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px 10px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(168, 85, 247, 0.25)',
                border: '1px solid #A855F7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem'
              }}
            >
              👨‍⚕️
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#F8FAFC' }}>
                {staffName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
                <span style={{ fontSize: '0.68rem', color: '#C084FC', fontWeight: 700 }}>
                  🔑 DSC Token: ACTIVE
                </span>
                <span style={{ fontSize: '0.62rem', color: '#64748B' }}>• Class-3 USB PKI</span>
              </div>
            </div>
          </div>

          {/* Role Switcher Pill for Testing Cross-Role Navigation */}
          <div style={{ display: 'flex', gap: '2px', backgroundColor: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => onChangeRolePerspective('PATHOLOGIST')}
              title="Pathologist Cockpit View"
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeRolePerspective === 'PATHOLOGIST' ? '#7C3AED' : 'transparent',
                color: '#FFF',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🔬 Cockpit
            </button>
            <button
              type="button"
              onClick={() => onChangeRolePerspective('TECHNICIAN')}
              title="Switch to Technician Workbench"
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeRolePerspective === 'TECHNICIAN' ? '#0284C7' : 'transparent',
                color: '#94A3B8',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ⚙️ Tech
            </button>
            <button
              type="button"
              onClick={() => onChangeRolePerspective('PHLEBOTOMIST')}
              title="Switch to Phlebotomy Desk"
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeRolePerspective === 'PHLEBOTOMIST' ? '#D97706' : 'transparent',
                color: '#94A3B8',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🩸 Phleb
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          ROW 1 (Governance & Quality Status):
          Daily QC Status | Sample Rejection Rate | Critical Panic Calls Pending | Pending Pathologist Approval
          ========================================================================= */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '12px'
        }}
      >
        {/* 1. Daily QC Status (All instruments calibrated) */}
        <Card
          padding="md"
          className="ds-glass-panel ds-interactive"
          style={{
            cursor: 'pointer',
            border: '1.5px solid rgba(56, 189, 248, 0.35)',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(15, 23, 42, 0.85) 100%)',
            transition: 'all 0.15s ease'
          }}
          onClick={onOpenQcModal}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#7DD3FC', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Daily QC Status
            </span>
            <span style={{ fontSize: '1.2rem' }}>📊</span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: qcApproved ? '#34D399' : '#F59E0B', margin: '6px 0 2px' }}>
            {qcApproved ? 'PASS (±1.2 SD)' : 'QC PENDING'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#CBD5E1', fontWeight: 600 }}>
            All instruments calibrated • Westgard 1-2s Clear
          </div>
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>Sysmex XN, Cobas 6000 Racks</span>
            <span style={{ fontSize: '0.68rem', color: '#38BDF8', fontWeight: 700 }}>Inspect QC ➔</span>
          </div>
        </Card>

        {/* 2. Sample Rejection Rate (< 1%) */}
        <Card
          padding="md"
          className="ds-glass-panel ds-interactive"
          style={{
            cursor: 'pointer',
            border: '1.5px solid rgba(245, 158, 11, 0.35)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.85) 100%)',
            transition: 'all 0.15s ease'
          }}
          onClick={() => onOpenRejectModal(TARGET_SPECIMENS[0]!)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#FCD34D', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Sample Rejection Rate
            </span>
            <span style={{ fontSize: '1.2rem' }}>🚫</span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#F59E0B', margin: '6px 0 2px' }}>
            0.42% <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34D399' }}>(Target &lt; 1%)</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#CBD5E1', fontWeight: 600 }}>
            Pre-analytic tube integrity: 3 rejected / 718 total
          </div>
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>Microclot &amp; Hemolysis log</span>
            <span style={{ fontSize: '0.68rem', color: '#FBBF24', fontWeight: 700 }}>View Rejections ➔</span>
          </div>
        </Card>

        {/* 3. Critical Panic Calls Pending (Urgent physician intimation) */}
        <Card
          padding="md"
          className="ds-glass-panel ds-interactive"
          style={{
            cursor: 'pointer',
            border: '1.5px solid rgba(239, 68, 68, 0.45)',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(15, 23, 42, 0.85) 100%)',
            boxShadow: '0 4px 18px rgba(239, 68, 68, 0.2)',
            transition: 'all 0.15s ease'
          }}
          onClick={() => onOpenPanicModal(TARGET_SPECIMENS[0]!)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#FCA5A5', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Critical Panic Calls Pending
            </span>
            <span style={{ fontSize: '1.2rem' }}>🚨</span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#EF4444', margin: '6px 0 2px' }}>
            2 Urgent Intimations
          </div>
          <div style={{ fontSize: '0.72rem', color: '#FCA5A5', fontWeight: 600 }}>
            Mandatory read-back logged per NABL 5.8.2
          </div>
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: '#CBD5E1' }}>Potassium &amp; Platelet Criticals</span>
            <span style={{ fontSize: '0.68rem', color: '#F87171', fontWeight: 800 }}>Open Call Desk ➔</span>
          </div>
        </Card>

        {/* 4. Pending Pathologist Approval (Waiting for MD sign-off) */}
        <Card
          padding="md"
          className="ds-glass-panel ds-interactive"
          style={{
            cursor: 'pointer',
            border: '1.5px solid rgba(168, 85, 247, 0.45)',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(15, 23, 42, 0.85) 100%)',
            transition: 'all 0.15s ease'
          }}
          onClick={onOpenBatchDscModal}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#D8B4FE', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pending Pathologist Approval
            </span>
            <span style={{ fontSize: '1.2rem' }}>✍️</span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#A855F7', margin: '6px 0 2px' }}>
            8 Reports Waiting
          </div>
          <div style={{ fontSize: '0.72rem', color: '#C4B5FD', fontWeight: 600 }}>
            Waiting for MD sign-off • DSC Token Ready
          </div>
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>Biochemistry, Heme, Biopsy</span>
            <span style={{ fontSize: '0.68rem', color: '#C084FC', fontWeight: 800 }}>Batch Sign-Off ➔</span>
          </div>
        </Card>
      </section>

      {/* =========================================================================
          ROW 2 (Main Operating Workspace):
          Left: Specimen Worklist | Center: Result Review Panel | Right: Delta Check & Audit History
          ========================================================================= */}
      <main
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1.15fr) minmax(440px, 1.95fr) minmax(320px, 1.35fr)',
          gap: '16px',
          alignItems: 'start'
        }}
      >
        {/* =====================================================================
            LEFT COLUMN: Specimen Worklist
            Filter by: Critical First, Abnormal, Biopsy, Routine
            ===================================================================== */}
        <section
          className="ds-glass-panel"
          style={{
            borderRadius: '16px',
            backgroundColor: 'rgba(18, 24, 38, 0.85)',
            border: '1.5px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            maxHeight: '740px'
          }}
        >
          {/* Worklist Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#F8FAFC' }}>
                  Specimen Worklist
                </span>
                <Badge variant="neutral" style={{ fontSize: '0.65rem' }}>
                  {filteredWorklist.length} Specimens
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenWsiModal}
                style={{ fontSize: '0.68rem', padding: '3px 8px', borderColor: '#A855F7', color: '#D8B4FE' }}
                title="Whole Slide Imaging & Peripheral Blood Smear Examination"
              >
                🔬 WSI Viewer
              </Button>
            </div>

            {/* Filter Pills: Critical First, Abnormal, Biopsy, Routine */}
            <div style={{ display: 'flex', gap: '4px', marginTop: '10px', flexWrap: 'wrap' }}>
              {(
                [
                  { key: 'CRITICAL_FIRST', label: 'Critical First', icon: '🚨' },
                  { key: 'ABNORMAL', label: 'Abnormal', icon: '⚠️' },
                  { key: 'BIOPSY', label: 'Biopsy', icon: '🔬' },
                  { key: 'ROUTINE', label: 'Routine', icon: '📋' },
                  { key: 'ALL', label: 'All', icon: '🌐' }
                ] as const
              ).map((f) => {
                const isActive = worklistFilter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setWorklistFilter(f.key)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: isActive ? '1px solid #A855F7' : '1px solid rgba(255, 255, 255, 0.08)',
                      backgroundColor: isActive ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255, 255, 255, 0.03)',
                      color: isActive ? '#F8FAFC' : '#94A3B8',
                      fontSize: '0.68rem',
                      fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <span>{f.icon} </span>
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div style={{ marginTop: '10px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '7px', fontSize: '0.75rem', color: '#64748B' }}>
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search barcode, accession, patient..."
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 28px',
                  borderRadius: '7px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  color: '#F8FAFC',
                  fontSize: '0.75rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Specimen Items List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredWorklist.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748B', fontSize: '0.78rem' }}>
                No specimens found matching the selected filter.
              </div>
            ) : (
              filteredWorklist.map((specimen) => {
                const isSelected = activeSpecimen.id === specimen.id;
                const isCrit = specimen.isCritical;
                const isBio = specimen.filterCategory === 'BIOPSY';
                const isAbn = specimen.filterCategory === 'ABNORMAL';

                return (
                  <div
                    key={specimen.id}
                    onClick={() => {
                      setSelectedSpecimenId(specimen.id);
                      triggerToast(`Selected: ${specimen.patientName} (${specimen.accessionNumber})`);
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      border: isSelected
                        ? '1.5px solid #A855F7'
                        : isCrit
                        ? '1px solid rgba(239, 68, 68, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                      backgroundColor: isSelected
                        ? 'rgba(168, 85, 247, 0.22)'
                        : isCrit
                        ? 'rgba(239, 68, 68, 0.08)'
                        : 'rgba(255, 255, 255, 0.02)',
                      boxShadow: isSelected ? '0 4px 16px rgba(168, 85, 247, 0.3)' : undefined,
                      transition: 'all 0.12s ease',
                      position: 'relative'
                    }}
                  >
                    {/* Top Row: Accession & Urgency Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#38BDF8', fontSize: '0.76rem' }}>
                        {specimen.accessionNumber}
                      </span>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {specimen.priority === 'STAT' && (
                          <span style={{ backgroundColor: '#EF4444', color: '#FFF', fontSize: '0.6rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px' }}>
                            STAT
                          </span>
                        )}
                        <Badge
                          variant={isCrit ? 'critical' : isBio ? 'primary' : isAbn ? 'warning' : 'neutral'}
                          style={{ fontSize: '0.62rem' }}
                        >
                          {specimen.department}
                        </Badge>
                      </div>
                    </div>

                    {/* Middle Row: Patient Name & Age/Gender */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                      <strong style={{ fontSize: '0.82rem', color: '#F8FAFC' }}>
                        {specimen.patientName}
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                        {specimen.patientAge} • {specimen.patientGender === 'MALE' ? 'M' : 'F'}
                      </span>
                    </div>

                    {/* Subtitle: Test Parameter / Summary Value */}
                    <div style={{ fontSize: '0.7rem', color: '#CBD5E1', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {specimen.parameters[0]?.name}: <strong style={{ color: isCrit ? '#EF4444' : isAbn ? '#F59E0B' : '#34D399' }}>{specimen.parameters[0]?.value} {specimen.parameters[0]?.unit}</strong>
                    </div>

                    {/* Bottom Status Ribbon */}
                    <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem' }}>
                      <span style={{ color: isCrit ? '#FCA5A5' : '#94A3B8' }}>
                        {specimen.statusLabel}
                      </span>
                      <span style={{ color: '#64748B' }}>
                        {specimen.collectionTime}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* =====================================================================
            CENTER COLUMN: Result Review Panel
            Patient history + current test values + machine flags + reference range flags
            ===================================================================== */}
        <section
          className="ds-glass-panel"
          style={{
            borderRadius: '16px',
            backgroundColor: 'rgba(18, 24, 38, 0.85)',
            border: '1.5px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            maxHeight: '740px'
          }}
        >
          {/* Patient Demographic & Order Header Banner */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC' }}>
                    {activeSpecimen.patientName}
                  </h2>
                  <Badge variant="primary" style={{ fontSize: '0.68rem' }}>
                    {activeSpecimen.patientMrn}
                  </Badge>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    ({activeSpecimen.patientAge} • {activeSpecimen.patientGender})
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#CBD5E1', marginTop: '3px' }}>
                  Referring Doctor: <strong style={{ color: '#E2E8F0' }}>{activeSpecimen.orderingDoctorName}</strong> • {activeSpecimen.wardOrLocation}
                </div>
              </div>

              {/* Barcode & Specimen Info */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38BDF8', fontSize: '0.8rem' }}>
                  {activeSpecimen.barcode}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                  {activeSpecimen.specimenType} • {activeSpecimen.tubeType}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '1px' }}>
                  Analyzer: {activeSpecimen.analyzerMachine}
                </div>
              </div>
            </div>
          </div>

          {/* Clinical History & Indications Box */}
          <div
            style={{
              padding: '10px 18px',
              backgroundColor: 'rgba(56, 189, 248, 0.06)',
              borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
              fontSize: '0.75rem',
              color: '#CBD5E1',
              lineHeight: '1.45'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38BDF8', fontWeight: 700, marginBottom: '2px' }}>
              <span>🩺</span>
              <span>PATIENT CLINICAL HISTORY &amp; TEST INDICATION:</span>
            </div>
            {activeSpecimen.clinicalHistory}
          </div>

          {/* Current Test Values Table with Machine Flags & Ref Ranges */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '12px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Observed Test Values &amp; Raw Machine Flags
              </span>
              <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                ASTM Protocol Query v4.2
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid rgba(255, 255, 255, 0.12)' }}>
                  <th style={{ padding: '8px 10px', fontSize: '0.7rem', color: '#94A3B8', fontWeight: 800 }}>TEST PARAMETER</th>
                  <th style={{ padding: '8px 10px', fontSize: '0.7rem', color: '#94A3B8', fontWeight: 800 }}>OBSERVED RESULT</th>
                  <th style={{ padding: '8px 10px', fontSize: '0.7rem', color: '#94A3B8', fontWeight: 800 }}>REFERENCE RANGE</th>
                  <th style={{ padding: '8px 10px', fontSize: '0.7rem', color: '#94A3B8', fontWeight: 800 }}>ANALYZER FLAGS &amp; INDICES</th>
                  <th style={{ padding: '8px 10px', fontSize: '0.7rem', color: '#94A3B8', fontWeight: 800, textAlign: 'right' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {activeSpecimen.parameters.map((param, idx) => {
                  const isParamCrit = param.flag === 'CRITICAL';
                  const isParamHigh = param.flag === 'HIGH';
                  const isParamLow = param.flag === 'LOW';
                  const isParamAbn = param.flag === 'ABNORMAL';

                  const resultColor =
                    isParamCrit ? '#EF4444' : isParamHigh || isParamLow ? '#F59E0B' : isParamAbn ? '#C084FC' : '#34D399';

                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        backgroundColor: isParamCrit ? 'rgba(239, 68, 68, 0.08)' : undefined
                      }}
                    >
                      {/* Parameter Name */}
                      <td style={{ padding: '10px', fontSize: '0.76rem', color: '#F8FAFC', fontWeight: 700 }}>
                        {param.name}
                      </td>

                      {/* Observed Result with Unit */}
                      <td style={{ padding: '10px' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 900, color: resultColor }}>
                          {param.value}
                        </span>
                        {param.unit && (
                          <span style={{ fontSize: '0.7rem', color: '#94A3B8', marginLeft: '4px' }}>
                            {param.unit}
                          </span>
                        )}
                      </td>

                      {/* Reference Interval */}
                      <td style={{ padding: '10px', fontSize: '0.72rem', color: '#CBD5E1' }}>
                        {param.refRange}
                      </td>

                      {/* Machine Flags & Serum Indices */}
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 700 }}>
                          {param.machineFlag}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#64748B' }}>
                          {param.serumIndices}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <Badge
                          variant={
                            isParamCrit ? 'critical' : isParamHigh || isParamLow ? 'warning' : isParamAbn ? 'primary' : 'success'
                          }
                          style={{ fontSize: '0.65rem' }}
                        >
                          {param.flag}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pathologist Clinical Impression & Interpretive Comments */}
            <div
              style={{
                marginTop: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#C084FC', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>✍️</span>
                  <span>PATHOLOGIST CLINICAL IMPRESSION &amp; INTERPRETIVE NOTES:</span>
                </span>
                <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                  Will be cryptographically embedded with Class-3 DSC
                </span>
              </div>
              <textarea
                value={currentImpression}
                onChange={(e) => {
                  setImpressionNotes((prev) => ({
                    ...prev,
                    [activeSpecimen.id]: e.target.value
                  }));
                }}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  color: '#F8FAFC',
                  fontSize: '0.75rem',
                  lineHeight: '1.4',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </section>

        {/* =====================================================================
            RIGHT COLUMN: Delta Check & Audit History
            Pichle 3 visits ki test values ka comparison graph + Chain of custody
            ===================================================================== */}
        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            maxHeight: '740px',
            overflowY: 'auto'
          }}
        >
          {/* DELTA CHECK COMPARISON GRAPH (Pichle 3 visits ki test values ka comparison graph) */}
          <div
            className="ds-glass-panel"
            style={{
              borderRadius: '16px',
              backgroundColor: 'rgba(18, 24, 38, 0.85)',
              border: activeSpecimen.deltaCheck.isViolation
                ? '1.5px solid rgba(239, 68, 68, 0.45)'
                : '1.5px solid rgba(56, 189, 248, 0.35)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1rem' }}>📈</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#F8FAFC' }}>
                  Delta Check Comparison
                </span>
              </div>
              <Badge
                variant={activeSpecimen.deltaCheck.isViolation ? 'critical' : 'success'}
                style={{ fontSize: '0.62rem' }}
              >
                {activeSpecimen.deltaCheck.isViolation ? 'VIOLATION DETECTED' : 'DELTA CLEAR'}
              </Badge>
            </div>

            <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
              Biomarker: <strong style={{ color: '#38BDF8' }}>{activeSpecimen.deltaCheck.biomarker}</strong> across last 3 patient visits:
            </div>

            {/* Visual Trend Bars (Pichle 3 visits ki test values) */}
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                borderRadius: '10px',
                padding: '12px 14px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {activeSpecimen.deltaCheck.visits.map((visit, i) => {
                  const isCurrent = i === activeSpecimen.deltaCheck.visits.length - 1;
                  return (
                    <div
                      key={i}
                      style={{
                        backgroundColor: isCurrent
                          ? activeSpecimen.deltaCheck.isViolation
                            ? 'rgba(239, 68, 68, 0.2)'
                            : 'rgba(56, 189, 248, 0.2)'
                          : 'rgba(255, 255, 255, 0.04)',
                        border: isCurrent
                          ? activeSpecimen.deltaCheck.isViolation
                            ? '1px solid #EF4444'
                            : '1px solid #38BDF8'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{visit.visitLabel}</div>
                      <div style={{ fontSize: '0.62rem', color: '#64748B', marginBottom: '4px' }}>{visit.date}</div>
                      <div
                        style={{
                          fontSize: '0.92rem',
                          fontWeight: 900,
                          color: isCurrent
                            ? activeSpecimen.deltaCheck.isViolation
                              ? '#EF4444'
                              : '#38BDF8'
                            : '#F8FAFC'
                        }}
                      >
                        {visit.displayValue}
                      </div>
                      {visit.deltaPercent && (
                        <div
                          style={{
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            color: activeSpecimen.deltaCheck.isViolation ? '#FCA5A5' : '#34D399',
                            marginTop: '2px'
                          }}
                        >
                          {visit.deltaPercent}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Graphical Delta Shift Bar */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94A3B8', marginBottom: '3px' }}>
                  <span>Baseline</span>
                  <span>Shift Variance</span>
                  <span style={{ color: activeSpecimen.deltaCheck.isViolation ? '#EF4444' : '#34D399' }}>
                    Current Run
                  </span>
                </div>
                <div style={{ height: '6px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden', position: 'relative' }}>
                  <div
                    style={{
                      height: '100%',
                      width: activeSpecimen.deltaCheck.isViolation ? '85%' : '45%',
                      backgroundColor: activeSpecimen.deltaCheck.isViolation ? '#EF4444' : '#34D399',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>

              {/* Multi-Visit Slope Velocity & Telemetry Badges */}
              <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.65rem' }}>
                <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  📈 Slope Velocity: {activeSpecimen.deltaCheck.isViolation ? '+1.14 unit / week (Acute Surge)' : '+0.04 unit / week (Stable)'}
                </span>
                <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  ⚡ Analyzer Rerun: Matched (Hemolysis / Pseudovariance Ruled Out)
                </span>
                {activeSpecimen.deltaCheck.isViolation && (
                  <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#F87171', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    ⚠️ Risk: KDIGO AKI / Arrhythmia Dynamic Threshold Breached
                  </span>
                )}
              </div>
            </div>

            {/* Delta Check Rule Explanation & Warning */}
            <div
              style={{
                backgroundColor: activeSpecimen.deltaCheck.isViolation
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(16, 185, 129, 0.08)',
                border: activeSpecimen.deltaCheck.isViolation
                  ? '1px solid rgba(239, 68, 68, 0.25)'
                  : '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '8px',
                padding: '8px 10px',
                fontSize: '0.72rem',
                color: '#CBD5E1',
                lineHeight: '1.4'
              }}
            >
              {activeSpecimen.deltaCheck.alertMessage}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenDeltaModal(activeSpecimen)}
              style={{
                fontSize: '0.72rem',
                borderColor: '#A855F7',
                color: '#D8B4FE',
                alignSelf: 'flex-start'
              }}
            >
              📈 Inspect Full Delta Log ➔
            </Button>
          </div>

          {/* AUDIT HISTORY & SPECIMEN CHAIN OF CUSTODY */}
          <div
            className="ds-glass-panel"
            style={{
              borderRadius: '16px',
              backgroundColor: 'rgba(18, 24, 38, 0.85)',
              border: '1.5px solid rgba(255, 255, 255, 0.08)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#F8FAFC' }}>
                Chain of Custody &amp; Verification Log
              </span>
              <span style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 700 }}>● ISO-15189 Audit Trail</span>
            </div>

            {/* Stepper Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeSpecimen.auditHistory.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    position: 'relative'
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: idx === activeSpecimen.auditHistory.length - 1 ? '#A855F7' : '#10B981',
                      color: '#FFF',
                      fontSize: '0.62rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      marginTop: '2px',
                      flexShrink: 0
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '6px 8px', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.72rem', color: '#F8FAFC' }}>{step.action}</strong>
                      <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{step.time}</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#CBD5E1', marginTop: '2px' }}>
                      {step.details}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#64748B', marginTop: '1px' }}>
                      Actor: {step.actor}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================================
          BOTTOM ACTION BAR (Sticky Bar):
          [Reflex Test Order] | [Request Repeat/Dilution] | [Log Panic Call] | [Digitally Sign & Dispatch]
          ========================================================================= */}
      <footer
        className="ds-glass-panel"
        style={{
          position: 'sticky',
          bottom: '8px',
          zIndex: 900,
          borderRadius: '14px',
          padding: '12px 20px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 27, 75, 0.96) 100%)',
          border: '1.5px solid rgba(168, 85, 247, 0.45)',
          boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Selected Specimen Context Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            Action Target:
          </div>
          <strong style={{ fontSize: '0.85rem', color: '#F8FAFC' }}>
            {activeSpecimen.patientName} ({activeSpecimen.accessionNumber})
          </strong>
          <Badge variant={activeSpecimen.isCritical ? 'critical' : 'primary'} style={{ fontSize: '0.65rem' }}>
            {activeSpecimen.department}
          </Badge>
        </div>

        {/* 4 Bottom Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* 1. Reflex Test Order */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReflexModalOpen(true)}
            style={{
              borderColor: 'rgba(56, 189, 248, 0.5)',
              color: '#38BDF8',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              fontWeight: 800,
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🧪</span>
            <span>Reflex Test Order</span>
          </Button>

          {/* 2. Request Repeat / Dilution */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRepeatModalOpen(true)}
            style={{
              borderColor: 'rgba(245, 158, 11, 0.5)',
              color: '#FCD34D',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              fontWeight: 800,
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🔁</span>
            <span>Request Repeat / Dilution</span>
          </Button>

          {/* 3. Log Panic Call (Read-Back Logged) */}
          <Button
            size="sm"
            onClick={() => onOpenPanicModal(activeSpecimen)}
            style={{
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)'
            }}
          >
            <span>📞</span>
            <span>Log Panic Call</span>
          </Button>

          {/* 4. Digitally Sign & Dispatch */}
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenBatchDscModal}
            style={{
              backgroundColor: '#7C3AED',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 16px rgba(124, 58, 237, 0.45)'
            }}
          >
            <span>✍️</span>
            <span>Digitally Sign &amp; Dispatch</span>
          </Button>
        </div>
      </footer>

      {/* =========================================================================
          INTERACTIVE MODAL: Reflex Test Order
          ========================================================================= */}
      {isReflexModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10006,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            className="ds-glass-panel"
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: '#0F172A',
              border: '2px solid #38BDF8',
              borderRadius: '18px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 60px rgba(56, 189, 248, 0.35)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.8rem' }}>🧪</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#7DD3FC' }}>
                    ORDER REFLEX INVESTIGATION
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                    Accredited Laboratory Automatic Reflex Testing Protocol
                  </div>
                </div>
              </div>
              <Badge variant="info">NABL Reflex Rules</Badge>
            </div>

            <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                Patient: <strong style={{ color: '#F8FAFC' }}>{activeSpecimen.patientName}</strong> ({activeSpecimen.accessionNumber})
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                Department: {activeSpecimen.department} • Machine: {activeSpecimen.analyzerMachine}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                Select Accredited Reflex Test:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {activeSpecimen.reflexOptions.map((opt, i) => (
                  <label
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: selectedReflexTest === opt ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: selectedReflexTest === opt ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="reflexTestChoice"
                      checked={selectedReflexTest === opt}
                      onChange={() => setSelectedReflexTest(opt)}
                    />
                    <span style={{ fontSize: '0.76rem', color: '#F8FAFC', fontWeight: selectedReflexTest === opt ? 700 : 500 }}>
                      {opt}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>
                Clinical Justification Notes:
              </label>
              <input
                type="text"
                value={reflexJustification}
                onChange={(e) => setReflexJustification(e.target.value)}
                placeholder="E.g., Reflex confirmation per KDIGO AKI or critical electrolyte algorithm"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  color: '#F8FAFC',
                  fontSize: '0.75rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
              <Button variant="outline" size="sm" onClick={() => setIsReflexModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmReflex}
                style={{ backgroundColor: '#0284C7', color: '#FFF', fontWeight: 800 }}
              >
                Add Reflex Order &amp; Transmit ➔
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          INTERACTIVE MODAL: Request Repeat / Dilution
          ========================================================================= */}
      {isRepeatModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10006,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            className="ds-glass-panel"
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: '#0F172A',
              border: '2px solid #F59E0B',
              borderRadius: '18px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 60px rgba(245, 158, 11, 0.35)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.8rem' }}>🔁</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#FCD34D' }}>
                    REQUEST SPECIMEN RE-RUN / DILUTION
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                    Automated ASTM Analyzer Re-Queue Directive
                  </div>
                </div>
              </div>
              <Badge variant="warning">Analytical Precision</Badge>
            </div>

            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                Specimen Accession: <strong style={{ color: '#F8FAFC' }}>{activeSpecimen.accessionNumber}</strong>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                Primary Analyzer: {activeSpecimen.analyzerMachine}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                Re-Run Protocol:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { key: '1_TO_2_DILUTION', label: '1:2 Automated Dilution (Roche / Sysmex)' },
                  { key: '1_TO_10_DILUTION', label: '1:10 Linearity Range Dilution' },
                  { key: 'PLAIN_REPEAT', label: 'Duplicate Plain Repeat (Precision verification)' },
                  { key: 'REDRAW_REQUEST', label: 'Phlebotomy Redraw Request (Artifact / Clot / Hemolysis)' }
                ].map((item) => (
                  <label
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: repeatProtocol === item.key ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: repeatProtocol === item.key ? '1.5px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="repeatProtocolChoice"
                      checked={repeatProtocol === item.key}
                      onChange={() => setRepeatProtocol(item.key as any)}
                    />
                    <span style={{ fontSize: '0.76rem', color: '#F8FAFC', fontWeight: repeatProtocol === item.key ? 700 : 500 }}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>
                Internal Lab Log Note:
              </label>
              <input
                type="text"
                value={repeatNotes}
                onChange={(e) => setRepeatNotes(e.target.value)}
                placeholder="E.g., High parameter rerun to verify linearity before reporting"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  color: '#F8FAFC',
                  fontSize: '0.75rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
              <Button variant="outline" size="sm" onClick={() => setIsRepeatModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmRepeat}
                style={{ backgroundColor: '#D97706', color: '#FFF', fontWeight: 800 }}
              >
                Transmit ASTM Re-run Directive ➔
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
