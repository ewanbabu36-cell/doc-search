/**
 * Master Comprehensive Clinical Diagnostic Test & Parameter Library
 * Conforming to NABL ISO 15189:2022 and International Laboratory Medicine Standards
 * Contains exhaustive blood test profiles across all clinical pathology sub-specialties.
 */

export interface ClinicalParameterDef {
  id: string;
  code: string;
  name: string;
  unit: string;
  referenceRange: string;
  criticalLow?: number;
  criticalHigh?: number;
  defaultValue: string;
  flag?: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL';
  maleRange?: string;
  femaleRange?: string;
  defaultMaleValue?: string;
  defaultFemaleValue?: string;
}

export interface ClinicalTestProfileDef {
  key: string;
  name: string;
  shortName: string;
  department: string;
  category:
    | 'HEMATOLOGY'
    | 'BIOCHEMISTRY'
    | 'ENDOCRINOLOGY'
    | 'VITAMINS_IRON'
    | 'CLINICAL_PATHOLOGY'
    | 'INFECTIOUS_SEROLOGY'
    | 'IMMUNOLOGY'
    | 'TUMOR_MARKERS'
    | 'CARDIAC_CRITICAL'
    | 'PREVENTIVE_PACKAGES';
  specimen: string;
  tubeType: 'EDTA_LAVENDER' | 'SERUM_SST_GOLD' | 'FLUORIDE_GREY' | 'CITRATE_BLUE' | 'STERILE_CONTAINER' | 'HEPARIN_GREEN';
  tubeLabel: string;
  tubeColorHex: string;
  fastingRequired: boolean;
  preparation: string;
  parameters: ClinicalParameterDef[];
  price?: number;
}

export const CLINICAL_DEPARTMENTS = [
  { id: 'ALL', label: 'All Departments' },
  { id: 'HEMATOLOGY', label: '🩸 Hematology & Coagulation', icon: '🩸' },
  { id: 'BIOCHEMISTRY', label: '🧪 Clinical Biochemistry', icon: '🧪' },
  { id: 'CARDIAC_CRITICAL', label: '🫀 Cardiac & Emergency ICU', icon: '🫀' },
  { id: 'ENDOCRINOLOGY', label: '🧬 Endocrinology & Hormones', icon: '🧬' },
  { id: 'VITAMINS_IRON', label: '💊 Vitamins & Iron Studies', icon: '💊' },
  { id: 'INFECTIOUS_SEROLOGY', label: '🦠 Infectious Disease & Fever', icon: '🦠' },
  { id: 'IMMUNOLOGY', label: '🛡️ Immunology & Rheumatology', icon: '🛡️' },
  { id: 'TUMOR_MARKERS', label: '🎗️ Tumor & Oncology Markers', icon: '🎗️' },
  { id: 'PREVENTIVE_PACKAGES', label: '🏥 Master Health & Preventive Panels', icon: '🏥' },
  { id: 'CLINICAL_PATHOLOGY', label: '🔬 Urinalysis & Body Fluids', icon: '🔬' }
] as const;

export const MASTER_CLINICAL_TEST_LIBRARY: Record<string, ClinicalTestProfileDef> = {
  // =========================================================================
  // 1. HEMATOLOGY, CELL MORPHOLOGY & COAGULATION
  // =========================================================================
  CBC: {
    key: 'CBC',
    name: 'COMPLETE BLOOD COUNT (CBC WITH 5-PART DIFFERENTIAL)',
    shortName: 'CBC with 5-Diff',
    department: 'Hematology & Clinical Microscopy',
    category: 'HEMATOLOGY',
    specimen: 'EDTA Whole Blood (2.0 mL)',
    tubeType: 'EDTA_LAVENDER',
    tubeLabel: '💜 EDTA Lavender',
    tubeColorHex: '#A855F7',
    fastingRequired: false,
    preparation: 'Routine venipuncture, no fasting required.',
    parameters: [
      { id: '1', code: 'HB', name: 'Hemoglobin (Hb)', unit: 'g/dL', referenceRange: '13.0 - 17.0 (M) / 12.0 - 15.5 (F)', defaultValue: '14.2', criticalLow: 7.0, criticalHigh: 20.0, flag: 'NORMAL' },
      { id: '2', code: 'WBC', name: 'Total Leukocyte Count (WBC)', unit: '/cumm', referenceRange: '4,000 - 11,000', defaultValue: '7,800', criticalLow: 2000, criticalHigh: 30000, flag: 'NORMAL' },
      { id: '3', code: 'PLT', name: 'Platelet Count', unit: 'Lakhs/cumm', referenceRange: '1.50 - 4.50', defaultValue: '2.60', criticalLow: 0.5, criticalHigh: 10.0, flag: 'NORMAL' },
      { id: '4', code: 'RBC', name: 'Red Blood Cell (RBC) Count', unit: 'million/uL', referenceRange: '4.50 - 5.50 (M) / 4.00 - 5.00 (F)', defaultValue: '4.90', flag: 'NORMAL' },
      { id: '5', code: 'PCV', name: 'Packed Cell Volume (PCV / Hematocrit)', unit: '%', referenceRange: '40.0 - 50.0 (M) / 36.0 - 46.0 (F)', defaultValue: '42.5', flag: 'NORMAL' },
      { id: '6', code: 'MCV', name: 'Mean Corpuscular Volume (MCV)', unit: 'fL', referenceRange: '80.0 - 100.0', defaultValue: '86.7', flag: 'NORMAL' },
      { id: '7', code: 'MCH', name: 'Mean Corpuscular Hemoglobin (MCH)', unit: 'pg', referenceRange: '27.0 - 33.0', defaultValue: '29.0', flag: 'NORMAL' },
      { id: '8', code: 'MCHC', name: 'Mean Corpuscular Hb Conc (MCHC)', unit: 'g/dL', referenceRange: '32.0 - 36.0', defaultValue: '33.4', flag: 'NORMAL' },
      { id: '9', code: 'RDW', name: 'Red Cell Distribution Width (RDW-CV)', unit: '%', referenceRange: '11.5 - 14.5', defaultValue: '12.8', flag: 'NORMAL' },
      { id: '10', code: 'NEUT', name: 'Neutrophils', unit: '%', referenceRange: '40 - 75', defaultValue: '64', flag: 'NORMAL' },
      { id: '11', code: 'LYMPH', name: 'Lymphocytes', unit: '%', referenceRange: '20 - 45', defaultValue: '28', flag: 'NORMAL' },
      { id: '12', code: 'EOS', name: 'Eosinophils', unit: '%', referenceRange: '01 - 06', defaultValue: '04', flag: 'NORMAL' },
      { id: '13', code: 'MONO', name: 'Monocytes', unit: '%', referenceRange: '02 - 10', defaultValue: '04', flag: 'NORMAL' },
      { id: '14', code: 'BASO', name: 'Basophils', unit: '%', referenceRange: '00 - 01', defaultValue: '00', flag: 'NORMAL' }
    ]
  },
  CBC_ESR: {
    key: 'CBC_ESR',
    name: 'COMPLETE BLOOD COUNT WITH ESR (CBC + ESR WESTERGREN)',
    shortName: 'CBC + ESR Combined',
    department: 'Hematology & Clinical Microscopy',
    category: 'HEMATOLOGY',
    specimen: 'EDTA Whole Blood (3.0 mL)',
    tubeType: 'EDTA_LAVENDER',
    tubeLabel: '💜 EDTA Lavender',
    tubeColorHex: '#A855F7',
    fastingRequired: false,
    preparation: 'Routine venipuncture, complete hemogram and sedimentation rate.',
    parameters: [
      { id: '1', code: 'HB', name: 'Hemoglobin (Hb)', unit: 'g/dL', referenceRange: '13.0 - 17.0 (M) / 12.0 - 15.5 (F)', defaultValue: '13.8', criticalLow: 7.0, criticalHigh: 20.0, flag: 'NORMAL' },
      { id: '2', code: 'WBC', name: 'Total Leukocyte Count (WBC)', unit: '/cumm', referenceRange: '4,000 - 11,000', defaultValue: '8,200', criticalLow: 2000, criticalHigh: 30000, flag: 'NORMAL' },
      { id: '3', code: 'PLT', name: 'Platelet Count', unit: 'Lakhs/cumm', referenceRange: '1.50 - 4.50', defaultValue: '2.40', criticalLow: 0.5, criticalHigh: 10.0, flag: 'NORMAL' },
      { id: '4', code: 'RBC', name: 'Red Blood Cell (RBC) Count', unit: 'million/uL', referenceRange: '4.50 - 5.50', defaultValue: '4.75', flag: 'NORMAL' },
      { id: '5', code: 'PCV', name: 'Packed Cell Volume (PCV)', unit: '%', referenceRange: '40.0 - 50.0', defaultValue: '41.2', flag: 'NORMAL' },
      { id: '6', code: 'MCV', name: 'Mean Corpuscular Volume (MCV)', unit: 'fL', referenceRange: '80.0 - 100.0', defaultValue: '86.7', flag: 'NORMAL' },
      { id: '7', code: 'MCH', name: 'Mean Corpuscular Hemoglobin (MCH)', unit: 'pg', referenceRange: '27.0 - 33.0', defaultValue: '29.1', flag: 'NORMAL' },
      { id: '8', code: 'MCHC', name: 'Mean Corpuscular Hb Conc (MCHC)', unit: 'g/dL', referenceRange: '32.0 - 36.0', defaultValue: '33.5', flag: 'NORMAL' },
      { id: '9', code: 'RDW', name: 'Red Cell Distribution Width (RDW-CV)', unit: '%', referenceRange: '11.5 - 14.5', defaultValue: '13.0', flag: 'NORMAL' },
      { id: '10', code: 'NEUT', name: 'Neutrophils', unit: '%', referenceRange: '40 - 75', defaultValue: '65', flag: 'NORMAL' },
      { id: '11', code: 'LYMPH', name: 'Lymphocytes', unit: '%', referenceRange: '20 - 45', defaultValue: '27', flag: 'NORMAL' },
      { id: '12', code: 'EOS', name: 'Eosinophils', unit: '%', referenceRange: '01 - 06', defaultValue: '04', flag: 'NORMAL' },
      { id: '13', code: 'MONO', name: 'Monocytes', unit: '%', referenceRange: '02 - 10', defaultValue: '04', flag: 'NORMAL' },
      { id: '14', code: 'BASO', name: 'Basophils', unit: '%', referenceRange: '00 - 01', defaultValue: '00', flag: 'NORMAL' },
      { id: '15', code: 'ESR', name: 'ESR (Westergren Method - 1st Hour)', unit: 'mm/hr', referenceRange: '0 - 15 (M) / 0 - 20 (F)', defaultValue: '12', criticalHigh: 70, flag: 'NORMAL' }
    ]
  },
  ESR: {
    key: 'ESR',
    name: 'ERYTHROCYTE SEDIMENTATION RATE (ESR - WESTERGREN)',
    shortName: 'ESR (Westergren)',
    department: 'Hematology & Clinical Microscopy',
    category: 'HEMATOLOGY',
    specimen: 'EDTA Whole Blood / Citrated Blood (2.0 mL)',
    tubeType: 'EDTA_LAVENDER',
    tubeLabel: '💜 EDTA Lavender',
    tubeColorHex: '#A855F7',
    fastingRequired: false,
    preparation: 'Routine blood collection.',
    parameters: [
      { id: '1', code: 'ESR_1HR', name: 'ESR (End of 1st Hour)', unit: 'mm/hr', referenceRange: '0 - 15 (Male) / 0 - 20 (Female)', defaultValue: '12', criticalHigh: 70, flag: 'NORMAL' }
    ]
  },
  PERIPHERAL_SMEAR: {
    key: 'PERIPHERAL_SMEAR',
    name: 'PERIPHERAL BLOOD SMEAR EXAMINATION (PBS / PS FOR MP & MORPHOLOGY)',
    shortName: 'Peripheral Blood Smear (PBS)',
    department: 'Hematology & Clinical Microscopy',
    category: 'HEMATOLOGY',
    specimen: 'EDTA Whole Blood / Fresh Fingerprick Smear',
    tubeType: 'EDTA_LAVENDER',
    tubeLabel: '💜 EDTA Lavender',
    tubeColorHex: '#A855F7',
    fastingRequired: false,
    preparation: 'Leishman / Giemsa stained thin and thick peripheral smear.',
    parameters: [
      { id: '1', code: 'PS_RBC', name: 'RBC Morphology', unit: 'microscopy', referenceRange: 'Normocytic Normochromic', defaultValue: 'Normocytic Normochromic. No target cells or sickling seen.', flag: 'NORMAL' },
      { id: '2', code: 'PS_WBC', name: 'WBC Morphology', unit: 'microscopy', referenceRange: 'Normal distribution & maturity', defaultValue: 'Normal mature polymorphs, mature lymphocytes. No blast cells seen.', flag: 'NORMAL' },
      { id: '3', code: 'PS_PLT', name: 'Platelets on Smear', unit: 'microscopy', referenceRange: 'Adequate on smear (8-15 / OIF)', defaultValue: 'Adequate in numbers, normal granularity, no giant platelets.', flag: 'NORMAL' },
      { id: '4', code: 'PS_MP', name: 'Hemoparasites (Malaria / Filaria)', unit: 'microscopy', referenceRange: 'NOT SEEN', defaultValue: 'No Malarial Parasites (MP) or Microfilariae seen.', flag: 'NORMAL' },
      { id: '5', code: 'PS_IMPR', name: 'Microscopic Impression', unit: 'clinical', referenceRange: 'Normal Study', defaultValue: 'Normocytic normochromic blood picture. Platelets adequate.', flag: 'NORMAL' }
    ]
  },
  AEC: {
    key: 'AEC',
    name: 'ABSOLUTE EOSINOPHIL COUNT (AEC STAT)',
    shortName: 'Absolute Eosinophil Count',
    department: 'Hematology & Allergy Diagnostics',
    category: 'HEMATOLOGY',
    specimen: 'EDTA Whole Blood (2.0 mL)',
    tubeType: 'EDTA_LAVENDER',
    tubeLabel: '💜 EDTA Lavender',
    tubeColorHex: '#A855F7',
    fastingRequired: false,
    preparation: 'Routine collection for allergy, asthma, and parasitic eosinophilia workup.',
    parameters: [
      { id: '1', code: 'AEC_COUNT', name: 'Absolute Eosinophil Count (AEC)', unit: '/cumm', referenceRange: '40 - 440', defaultValue: '180', criticalHigh: 1500, flag: 'NORMAL' },
      { id: '2', code: 'WBC_TOT', name: 'Total Leukocyte Count', unit: '/cumm', referenceRange: '4,000 - 11,000', defaultValue: '7,400', flag: 'NORMAL' },
      { id: '3', code: 'EOS_PERC', name: 'Eosinophil Percentage', unit: '%', referenceRange: '1.0 - 6.0', defaultValue: '2.5', flag: 'NORMAL' }
    ]
  },
  RETICULOCYTE: {
    key: 'RETICULOCYTE',
    name: 'RETICULOCYTE COUNT & PRODUCTION INDEX (RPI)',
    shortName: 'Reticulocyte Count & RPI',
    department: 'Hematology & Bone Marrow Response',
    category: 'HEMATOLOGY',
    specimen: 'EDTA Whole Blood (2.0 mL)',
    tubeType: 'EDTA_LAVENDER',
    tubeLabel: '💜 EDTA Lavender',
    tubeColorHex: '#A855F7',
    fastingRequired: false,
    preparation: 'Supravital Brilliant Cresyl Blue / New Methylene Blue staining.',
    parameters: [
      { id: '1', code: 'RETIC_PERC', name: 'Reticulocyte Percentage', unit: '%', referenceRange: '0.5 - 2.0', defaultValue: '1.2', flag: 'NORMAL' },
      { id: '2', code: 'ARC', name: 'Absolute Reticulocyte Count (ARC)', unit: 'million/uL', referenceRange: '0.025 - 0.100', defaultValue: '0.055', flag: 'NORMAL' },
      { id: '3', code: 'CRC', name: 'Corrected Reticulocyte Count (CRC)', unit: '%', referenceRange: '0.5 - 2.0', defaultValue: '1.15', flag: 'NORMAL' },
      { id: '4', code: 'RPI', name: 'Reticulocyte Production Index (RPI)', unit: 'index', referenceRange: '> 2.0 (Adequate Marrow Response in Anemia)', defaultValue: '1.2', flag: 'NORMAL' }
    ]
  },
  BLOOD_GROUP: {
    key: 'BLOOD_GROUP',
    name: 'BLOOD GROUPING & Rh FACTOR (ABO & RhD TYPING)',
    shortName: 'Blood Group & RhD',
    department: 'Transfusion Medicine & Immunohematology',
    category: 'HEMATOLOGY',
    specimen: 'EDTA Whole Blood (2.0 mL)',
    tubeType: 'EDTA_LAVENDER',
    tubeLabel: '💜 EDTA Lavender',
    tubeColorHex: '#A855F7',
    fastingRequired: false,
    preparation: 'Standard forward and reverse typing.',
    parameters: [
      { id: '1', code: 'ABO_GRP', name: 'ABO Blood Group', unit: 'typing', referenceRange: 'A / B / AB / O', defaultValue: 'B', flag: 'NORMAL' },
      { id: '2', code: 'RH_FACT', name: 'Rh (D) Factor', unit: 'antigen', referenceRange: 'Positive / Negative', defaultValue: 'Positive (+)', flag: 'NORMAL' },
      { id: '3', code: 'FULL_GROUP', name: 'Final Group Interpretation', unit: 'clinical', referenceRange: 'Compatible Transfusion Typing', defaultValue: 'B Rh(D) Positive', flag: 'NORMAL' }
    ]
  },
  COAGULATION: {
    key: 'COAGULATION',
    name: 'COAGULATION PROFILE (PT / INR & APTT)',
    shortName: 'PT / INR & APTT Profile',
    department: 'Hematology & Coagulation',
    category: 'HEMATOLOGY',
    specimen: '3.2% Sodium Citrate Plasma (2.7 mL)',
    tubeType: 'CITRATE_BLUE',
    tubeLabel: '🔵 Citrate Blue',
    tubeColorHex: '#38BDF8',
    fastingRequired: false,
    preparation: 'Fill tube precisely to fill indicator line (1:9 ratio). Centrifuge promptly.',
    parameters: [
      { id: '1', code: 'PT_PAT', name: 'Prothrombin Time (Patient)', unit: 'seconds', referenceRange: '11.0 - 14.5', defaultValue: '12.4', flag: 'NORMAL' },
      { id: '2', code: 'PT_CTRL', name: 'Prothrombin Time (Control)', unit: 'seconds', referenceRange: '11.5 - 13.0', defaultValue: '12.0', flag: 'NORMAL' },
      { id: '3', code: 'INR', name: 'International Normalized Ratio (INR)', unit: 'ratio', referenceRange: '0.8 - 1.2 (Normal) / 2.0 - 3.0 (Therapeutic)', defaultValue: '1.03', criticalHigh: 4.5, flag: 'NORMAL' },
      { id: '4', code: 'APTT_PAT', name: 'APTT (Patient)', unit: 'seconds', referenceRange: '26.0 - 38.0', defaultValue: '30.2', flag: 'NORMAL' },
      { id: '5', code: 'APTT_CTRL', name: 'APTT (Control)', unit: 'seconds', referenceRange: '28.0 - 32.0', defaultValue: '29.5', flag: 'NORMAL' },
      { id: '6', code: 'APTT_RATIO', name: 'APTT Ratio', unit: 'ratio', referenceRange: '0.80 - 1.20', defaultValue: '1.02', flag: 'NORMAL' }
    ]
  },
  PT_INR: {
    key: 'PT_INR',
    name: 'PROTHROMBIN TIME WITH INR (PT / INR THERAPEUTIC MONITORING)',
    shortName: 'PT / INR Only',
    department: 'Hematology & Coagulation',
    category: 'HEMATOLOGY',
    specimen: '3.2% Sodium Citrate Plasma (2.7 mL)',
    tubeType: 'CITRATE_BLUE',
    tubeLabel: '🔵 Citrate Blue',
    tubeColorHex: '#38BDF8',
    fastingRequired: false,
    preparation: 'Routine Warfarin / Oral Anticoagulant Therapy monitoring.',
    parameters: [
      { id: '1', code: 'PT_PAT', name: 'Prothrombin Time (Patient)', unit: 'seconds', referenceRange: '11.0 - 14.5', defaultValue: '12.6', flag: 'NORMAL' },
      { id: '2', code: 'PT_CTRL', name: 'Prothrombin Time (Control)', unit: 'seconds', referenceRange: '11.5 - 13.0', defaultValue: '12.0', flag: 'NORMAL' },
      { id: '3', code: 'INR', name: 'International Normalized Ratio (INR)', unit: 'ratio', referenceRange: '0.85 - 1.15 (Normal) / 2.0 - 3.0 (On Warfarin)', defaultValue: '1.05', criticalHigh: 4.5, flag: 'NORMAL' },
      { id: '4', code: 'PT_ACT', name: 'Prothrombin Activity / Index', unit: '%', referenceRange: '70 - 120', defaultValue: '94', flag: 'NORMAL' }
    ]
  },
  APTT: {
    key: 'APTT',
    name: 'ACTIVATED PARTIAL THROMBOPLASTIN TIME (APTT / PTT)',
    shortName: 'APTT / PTT Only',
    department: 'Hematology & Coagulation',
    category: 'HEMATOLOGY',
    specimen: '3.2% Sodium Citrate Plasma (2.7 mL)',
    tubeType: 'CITRATE_BLUE',
    tubeLabel: '🔵 Citrate Blue',
    tubeColorHex: '#38BDF8',
    fastingRequired: false,
    preparation: 'Heparin therapy monitoring and intrinsic pathway screen.',
    parameters: [
      { id: '1', code: 'APTT_PAT', name: 'APTT (Patient)', unit: 'seconds', referenceRange: '26.0 - 38.0', defaultValue: '30.5', flag: 'NORMAL' },
      { id: '2', code: 'APTT_CTRL', name: 'APTT (Control)', unit: 'seconds', referenceRange: '28.0 - 32.0', defaultValue: '29.5', flag: 'NORMAL' },
      { id: '3', code: 'APTT_RATIO', name: 'APTT Ratio', unit: 'ratio', referenceRange: '0.80 - 1.20', defaultValue: '1.03', flag: 'NORMAL' }
    ]
  },
  D_DIMER: {
    key: 'D_DIMER',
    name: 'D-DIMER QUANTITATIVE (THROMBOSIS & DVT SCREEN)',
    shortName: 'D-Dimer Quantitative',
    department: 'Hematology & Coagulation',
    category: 'HEMATOLOGY',
    specimen: 'Sodium Citrate Plasma (2.0 mL)',
    tubeType: 'CITRATE_BLUE',
    tubeLabel: '🔵 Citrate Blue',
    tubeColorHex: '#38BDF8',
    fastingRequired: false,
    preparation: 'Centrifuge immediately to separate platelet-poor plasma.',
    parameters: [
      { id: '1', code: 'DDIMER', name: 'D-Dimer Quantitative', unit: 'ng/mL FEU', referenceRange: '< 500 (Normal / Exclusion)', defaultValue: '210', criticalHigh: 2000, flag: 'NORMAL' }
    ]
  },
  FIBRINOGEN: {
    key: 'FIBRINOGEN',
    name: 'PLASMA FIBRINOGEN (CLAUSS METHOD)',
    shortName: 'Plasma Fibrinogen',
    department: 'Hematology & Coagulation',
    category: 'HEMATOLOGY',
    specimen: '3.2% Sodium Citrate Plasma (2.0 mL)',
    tubeType: 'CITRATE_BLUE',
    tubeLabel: '🔵 Citrate Blue',
    tubeColorHex: '#38BDF8',
    fastingRequired: false,
    preparation: 'Coagulation assessment in DIC, pre-eclampsia, and hypercoagulability.',
    parameters: [
      { id: '1', code: 'FIB_CONC', name: 'Plasma Fibrinogen Activity', unit: 'mg/dL', referenceRange: '200 - 400', defaultValue: '290', criticalLow: 100, criticalHigh: 700, flag: 'NORMAL' }
    ]
  },
  BT_CT: {
    key: 'BT_CT',
    name: 'BLEEDING TIME & CLOTTING TIME (BT / CT)',
    shortName: 'Bleeding & Clotting Time',
    department: 'Hematology & Clinical Pathology',
    category: 'HEMATOLOGY',
    specimen: 'Capillary / Venous Blood (Bedside Method)',
    tubeType: 'EDTA_LAVENDER',
    tubeLabel: '💜 Bedside/Capillary',
    tubeColorHex: '#A855F7',
    fastingRequired: false,
    preparation: "Duke's earlobe / fingerprick method for BT, Lee & White glass tube method for CT.",
    parameters: [
      { id: '1', code: 'BT', name: 'Bleeding Time (BT)', unit: 'min:sec', referenceRange: '2:00 - 7:00 mins', defaultValue: '3:15 mins', criticalHigh: 15, flag: 'NORMAL' },
      { id: '2', code: 'CT', name: 'Clotting Time (CT)', unit: 'min:sec', referenceRange: '5:00 - 11:00 mins', defaultValue: '7:40 mins', criticalHigh: 20, flag: 'NORMAL' }
    ]
  },
  COOMBS_DIRECT: {
    key: 'COOMBS_DIRECT',
    name: 'DIRECT ANTIGLOBULIN TEST (DAT / DIRECT COOMBS TEST)',
    shortName: 'Direct Coombs Test (DAT)',
    department: 'Immunohematology & Blood Banking',
    category: 'HEMATOLOGY',
    specimen: 'EDTA Whole Blood (3.0 mL)',
    tubeType: 'EDTA_LAVENDER',
    tubeLabel: '💜 EDTA Lavender',
    tubeColorHex: '#A855F7',
    fastingRequired: false,
    preparation: 'Autoimmune hemolytic anemia (AIHA) and Hemolytic Disease of Newborn workup.',
    parameters: [
      { id: '1', code: 'DAT_POLY', name: 'Direct Antiglobulin Test (Polyspecific)', unit: 'agglutination', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '2', code: 'DAT_IGG', name: 'Anti-IgG Specific', unit: 'agglutination', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '3', code: 'DAT_C3D', name: 'Anti-C3d Specific', unit: 'agglutination', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' }
    ]
  },
  COOMBS_INDIRECT: {
    key: 'COOMBS_INDIRECT',
    name: 'INDIRECT ANTIGLOBULIN TEST (IAT / INDIRECT COOMBS TEST)',
    shortName: 'Indirect Coombs Test (IAT)',
    department: 'Immunohematology & Blood Banking',
    category: 'HEMATOLOGY',
    specimen: 'Serum & EDTA Blood (3.0 mL each)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Antenatal Rh antibody screening in Rh-negative mothers.',
    parameters: [
      { id: '1', code: 'IAT_SCREEN', name: 'Indirect Antiglobulin Screen (IAT)', unit: 'agglutination', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '2', code: 'IAT_TITER', name: 'Antibody Titer (if positive)', unit: 'titer', referenceRange: '< 1:2 (Negative)', defaultValue: 'Negative (< 1:2)', flag: 'NORMAL' }
    ]
  },
  HB_HPLC: {
    key: 'HB_HPLC',
    name: 'HEMOGLOBIN HPLC (THALASSEMIA & HEMOGLOBINOPATHY PROFILE)',
    shortName: 'Hemoglobin HPLC / Thalassemia',
    department: 'Hematology & Molecular Diagnostics',
    category: 'HEMATOLOGY',
    specimen: 'EDTA Whole Blood (3.0 mL)',
    tubeType: 'EDTA_LAVENDER',
    tubeLabel: '💜 EDTA Lavender',
    tubeColorHex: '#A855F7',
    fastingRequired: false,
    preparation: 'Bio-Rad Variant II HPLC Cation-Exchange Column method.',
    parameters: [
      { id: '1', code: 'HBA0', name: 'HbA0 Percentage', unit: '%', referenceRange: '84.0 - 88.0', defaultValue: '86.4', flag: 'NORMAL' },
      { id: '2', code: 'HBA2', name: 'HbA2 Percentage (Thalassemia Minor Marker)', unit: '%', referenceRange: '1.5 - 3.5 (Normal) / > 3.5 (Beta Thal Trait)', defaultValue: '2.4', criticalHigh: 4.0, flag: 'NORMAL' },
      { id: '3', code: 'HBF', name: 'Fetal Hemoglobin (HbF)', unit: '%', referenceRange: '< 1.0 (Adult)', defaultValue: '0.4', flag: 'NORMAL' },
      { id: '4', code: 'HBS_WIN', name: 'Variant Window (HbS / HbC / HbE / HbD)', unit: '%', referenceRange: 'NOT DETECTED', defaultValue: 'NOT DETECTED', flag: 'NORMAL' },
      { id: '5', code: 'HPLC_IMPR', name: 'HPLC Clinical Interpretation', unit: 'clinical', referenceRange: 'Normal Chromatogram', defaultValue: 'Normal Adult Hemoglobin pattern. No Beta Thalassemia trait or abnormal hemoglobin variant detected.', flag: 'NORMAL' }
    ]
  },
  G6PD: {
    key: 'G6PD',
    name: 'GLUCOSE-6-PHOSPHATE DEHYDROGENASE (G6PD QUANTITATIVE ENZYME)',
    shortName: 'G6PD Enzyme Quantitative',
    department: 'Hematology & Biochemical Genetics',
    category: 'HEMATOLOGY',
    specimen: 'EDTA Whole Blood (2.0 mL)',
    tubeType: 'EDTA_LAVENDER',
    tubeLabel: '💜 EDTA Lavender',
    tubeColorHex: '#A855F7',
    fastingRequired: false,
    preparation: 'Screening prior to administration of Primaquine, Dapsone, Rasburicase.',
    parameters: [
      { id: '1', code: 'G6PD_ACT', name: 'G6PD Enzyme Activity', unit: 'U/g Hb', referenceRange: '4.6 - 13.5 (Normal) / < 4.0 (Deficient)', defaultValue: '8.6', criticalLow: 3.0, flag: 'NORMAL' },
      { id: '2', code: 'HB_VAL', name: 'Simultaneous Hemoglobin', unit: 'g/dL', referenceRange: '12.0 - 16.0', defaultValue: '14.0', flag: 'NORMAL' }
    ]
  },
  SICKLE_CELL: {
    key: 'SICKLE_CELL',
    name: 'SICKLE CELL SCREEN (SICKLING TEST & SOLUBILITY TEST)',
    shortName: 'Sickle Cell Screen',
    department: 'Hematology & Clinical Microscopy',
    category: 'HEMATOLOGY',
    specimen: 'EDTA Whole Blood (2.0 mL)',
    tubeType: 'EDTA_LAVENDER',
    tubeLabel: '💜 EDTA Lavender',
    tubeColorHex: '#A855F7',
    fastingRequired: false,
    preparation: 'Sodium metabisulfite 2% reducing agent microscopic sickling test.',
    parameters: [
      { id: '1', code: 'SICKLE_PREP', name: 'Sickling Preparation Test (2% Metabisulfite)', unit: 'microscopy', referenceRange: 'NEGATIVE / NO SICKLING', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '2', code: 'HBS_SOLUB', name: 'Sickle Hemoglobin (HbS) Solubility Test', unit: 'turbidity', referenceRange: 'NEGATIVE / CLEAR', defaultValue: 'NEGATIVE', flag: 'NORMAL' }
    ]
  },

  // =========================================================================
  // 2. CLINICAL BIOCHEMISTRY & METABOLIC PANELS
  // =========================================================================
  LIPID: {
    key: 'LIPID',
    name: 'LIPID PROFILE COMPREHENSIVE (FASTING)',
    shortName: 'Lipid Profile Comprehensive',
    department: 'Clinical Biochemistry',
    category: 'BIOCHEMISTRY',
    specimen: 'Serum Fasting (3.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: true,
    preparation: '10 to 12 hours strict overnight water-only fasting prior to blood draw.',
    parameters: [
      { id: '1', code: 'CHOL', name: 'Total Cholesterol', unit: 'mg/dL', referenceRange: '< 200 (Desirable) / 200 - 239 (Borderline)', defaultValue: '175', criticalHigh: 350, flag: 'NORMAL' },
      { id: '2', code: 'TRIG', name: 'Triglycerides', unit: 'mg/dL', referenceRange: '< 150 (Normal) / 150 - 199 (Borderline)', defaultValue: '135', criticalHigh: 500, flag: 'NORMAL' },
      { id: '3', code: 'HDL', name: 'HDL Cholesterol (Good / Protective)', unit: 'mg/dL', referenceRange: '> 40 (Optimal Male) / > 50 (Female)', defaultValue: '48', criticalLow: 20, flag: 'NORMAL' },
      { id: '4', code: 'LDL', name: 'LDL Cholesterol (Bad - Friedewald Calculated)', unit: 'mg/dL', referenceRange: '< 100 (Optimal) / 100 - 129 (Near Optimal)', defaultValue: '100', criticalHigh: 220, flag: 'NORMAL' },
      { id: '5', code: 'VLDL', name: 'VLDL Cholesterol', unit: 'mg/dL', referenceRange: '< 30', defaultValue: '27', flag: 'NORMAL' },
      { id: '6', code: 'NON_HDL', name: 'Non-HDL Cholesterol', unit: 'mg/dL', referenceRange: '< 130', defaultValue: '127', flag: 'NORMAL' },
      { id: '7', code: 'CHOL_HDL', name: 'Total Cholesterol / HDL Ratio', unit: 'ratio', referenceRange: '< 4.5 (Normal Risk)', defaultValue: '3.6', flag: 'NORMAL' },
      { id: '8', code: 'LDL_HDL', name: 'LDL / HDL Ratio', unit: 'ratio', referenceRange: '< 3.0', defaultValue: '2.1', flag: 'NORMAL' }
    ]
  },
  LFT: {
    key: 'LFT',
    name: 'LIVER FUNCTION TEST (LFT COMPREHENSIVE WITH ENZYMES)',
    shortName: 'Liver Function Test (LFT)',
    department: 'Clinical Biochemistry',
    category: 'BIOCHEMISTRY',
    specimen: 'Serum (2.5 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Avoid alcohol and strenuous exercise 24 hours prior to blood draw.',
    parameters: [
      { id: '1', code: 'BIL_T', name: 'Bilirubin Total', unit: 'mg/dL', referenceRange: '0.2 - 1.2', defaultValue: '0.8', criticalHigh: 10.0, flag: 'NORMAL' },
      { id: '2', code: 'BIL_D', name: 'Bilirubin Direct (Conjugated)', unit: 'mg/dL', referenceRange: '0.0 - 0.3', defaultValue: '0.2', flag: 'NORMAL' },
      { id: '3', code: 'BIL_I', name: 'Bilirubin Indirect (Unconjugated)', unit: 'mg/dL', referenceRange: '0.2 - 0.9', defaultValue: '0.6', flag: 'NORMAL' },
      { id: '4', code: 'SGOT', name: 'SGOT / AST (Aspartate Aminotransferase)', unit: 'U/L', referenceRange: '10 - 40', defaultValue: '28', criticalHigh: 400, flag: 'NORMAL' },
      { id: '5', code: 'SGPT', name: 'SGPT / ALT (Alanine Aminotransferase)', unit: 'U/L', referenceRange: '10 - 45', defaultValue: '32', criticalHigh: 400, flag: 'NORMAL' },
      { id: '6', code: 'ALP', name: 'Alkaline Phosphatase (ALP)', unit: 'U/L', referenceRange: '40 - 129', defaultValue: '85', flag: 'NORMAL' },
      { id: '7', code: 'GGT', name: 'Gamma-Glutamyl Transferase (GGT)', unit: 'U/L', referenceRange: '10 - 55 (M) / 08 - 38 (F)', defaultValue: '26', flag: 'NORMAL' },
      { id: '8', code: 'PROT_T', name: 'Total Protein', unit: 'g/dL', referenceRange: '6.4 - 8.3', defaultValue: '7.2', flag: 'NORMAL' },
      { id: '9', code: 'ALB', name: 'Serum Albumin', unit: 'g/dL', referenceRange: '3.5 - 5.2', defaultValue: '4.4', criticalLow: 2.0, flag: 'NORMAL' },
      { id: '10', code: 'GLOB', name: 'Serum Globulin', unit: 'g/dL', referenceRange: '2.0 - 3.5', defaultValue: '2.8', flag: 'NORMAL' },
      { id: '11', code: 'AG_RATIO', name: 'Albumin / Globulin (A/G) Ratio', unit: 'ratio', referenceRange: '1.2 - 2.2', defaultValue: '1.57', flag: 'NORMAL' }
    ]
  },
  KFT: {
    key: 'KFT',
    name: 'KIDNEY FUNCTION TEST (KFT / RENAL PROFILE WITH eGFR)',
    shortName: 'Kidney Function Test (KFT)',
    department: 'Clinical Biochemistry',
    category: 'BIOCHEMISTRY',
    specimen: 'Serum (2.5 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Routine collection, maintain adequate hydration.',
    parameters: [
      { id: '1', code: 'UREA', name: 'Serum Urea', unit: 'mg/dL', referenceRange: '15.0 - 40.0', defaultValue: '28.0', criticalHigh: 120.0, flag: 'NORMAL' },
      { id: '2', code: 'BUN', name: 'Blood Urea Nitrogen (BUN)', unit: 'mg/dL', referenceRange: '7.0 - 20.0', defaultValue: '13.1', criticalHigh: 80.0, flag: 'NORMAL' },
      { id: '3', code: 'CREAT', name: 'Serum Creatinine', unit: 'mg/dL', referenceRange: '0.7 - 1.3 (M) / 0.5 - 1.1 (F)', defaultValue: '0.90', criticalLow: 0.3, criticalHigh: 4.0, flag: 'NORMAL' },
      { id: '4', code: 'URIC', name: 'Serum Uric Acid', unit: 'mg/dL', referenceRange: '3.5 - 7.2 (M) / 2.6 - 6.0 (F)', defaultValue: '5.2', flag: 'NORMAL' },
      { id: '5', code: 'CALC', name: 'Serum Calcium Total', unit: 'mg/dL', referenceRange: '8.5 - 10.5', defaultValue: '9.4', criticalLow: 6.5, criticalHigh: 13.0, flag: 'NORMAL' },
      { id: '6', code: 'PHOS', name: 'Serum Inorganic Phosphorus', unit: 'mg/dL', referenceRange: '2.5 - 4.5', defaultValue: '3.4', flag: 'NORMAL' },
      { id: '7', code: 'EGFR', name: 'eGFR (CKD-EPI 2021 Calculated)', unit: 'mL/min/1.73m²', referenceRange: '> 90 (Normal Kidney Function)', defaultValue: '105', criticalLow: 15, flag: 'NORMAL' }
    ]
  },
  ELECTROLYTES: {
    key: 'ELECTROLYTES',
    name: 'SERUM ELECTROLYTES PANEL (Na+, K+, Cl-, HCO3-)',
    shortName: 'Serum Electrolytes 4-Param',
    department: 'Clinical Biochemistry & Critical Care',
    category: 'BIOCHEMISTRY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Avoid gross hemolysis. Centrifuge promptly.',
    parameters: [
      { id: '1', code: 'NA', name: 'Serum Sodium (Na+)', unit: 'mEq/L', referenceRange: '136 - 145', defaultValue: '140', criticalLow: 120, criticalHigh: 160, flag: 'NORMAL' },
      { id: '2', code: 'K', name: 'Serum Potassium (K+)', unit: 'mEq/L', referenceRange: '3.5 - 5.1', defaultValue: '4.2', criticalLow: 2.8, criticalHigh: 6.5, flag: 'NORMAL' },
      { id: '3', code: 'CL', name: 'Serum Chloride (Cl-)', unit: 'mEq/L', referenceRange: '98 - 107', defaultValue: '102', flag: 'NORMAL' },
      { id: '4', code: 'HCO3', name: 'Serum Bicarbonate (HCO3-)', unit: 'mEq/L', referenceRange: '22 - 29', defaultValue: '25', criticalLow: 12, criticalHigh: 40, flag: 'NORMAL' }
    ]
  },
  ELECTROLYTES_EXTENDED: {
    key: 'ELECTROLYTES_EXTENDED',
    name: 'EXTENDED SERUM ELECTROLYTES & MINERALS (Na, K, Cl, Ca, Mg, Phos)',
    shortName: 'Extended Electrolytes & Minerals',
    department: 'Clinical Biochemistry & Critical Care',
    category: 'BIOCHEMISTRY',
    specimen: 'Serum (3.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Comprehensive electrolyte balance for ICU and renal patients.',
    parameters: [
      { id: '1', code: 'NA', name: 'Serum Sodium (Na+)', unit: 'mEq/L', referenceRange: '136 - 145', defaultValue: '140', criticalLow: 120, criticalHigh: 160, flag: 'NORMAL' },
      { id: '2', code: 'K', name: 'Serum Potassium (K+)', unit: 'mEq/L', referenceRange: '3.5 - 5.1', defaultValue: '4.2', criticalLow: 2.8, criticalHigh: 6.5, flag: 'NORMAL' },
      { id: '3', code: 'CL', name: 'Serum Chloride (Cl-)', unit: 'mEq/L', referenceRange: '98 - 107', defaultValue: '101', flag: 'NORMAL' },
      { id: '4', code: 'HCO3', name: 'Serum Bicarbonate (HCO3-)', unit: 'mEq/L', referenceRange: '22 - 29', defaultValue: '24', flag: 'NORMAL' },
      { id: '5', code: 'CA_ION', name: 'Ionized Calcium (iCa2+)', unit: 'mmol/L', referenceRange: '1.15 - 1.33', defaultValue: '1.24', criticalLow: 0.9, criticalHigh: 1.6, flag: 'NORMAL' },
      { id: '6', code: 'MG', name: 'Serum Magnesium (Mg2+)', unit: 'mg/dL', referenceRange: '1.7 - 2.4', defaultValue: '2.1', criticalLow: 1.0, criticalHigh: 4.5, flag: 'NORMAL' },
      { id: '7', code: 'PHOS', name: 'Inorganic Phosphorus', unit: 'mg/dL', referenceRange: '2.5 - 4.5', defaultValue: '3.5', flag: 'NORMAL' },
      { id: '8', code: 'ANION_GAP', name: 'Anion Gap (Calculated)', unit: 'mEq/L', referenceRange: '8 - 16', defaultValue: '13', flag: 'NORMAL' }
    ]
  },
  GLUCOSE_PROFILE: {
    key: 'GLUCOSE_PROFILE',
    name: 'DIABETIC PROFILE (FBS, PPBS & HbA1c WITH eAG)',
    shortName: 'Diabetic Profile & HbA1c',
    department: 'Clinical Biochemistry',
    category: 'BIOCHEMISTRY',
    specimen: 'Fluoride Plasma & EDTA Blood (2.0 mL each)',
    tubeType: 'FLUORIDE_GREY',
    tubeLabel: '⚪ Fluoride Grey',
    tubeColorHex: '#94A3B8',
    fastingRequired: true,
    preparation: 'FBS after 8-10h overnight fasting. PPBS drawn exactly 2 hours after starting breakfast meal.',
    parameters: [
      { id: '1', code: 'FBS', name: 'Fasting Blood Sugar (FBS)', unit: 'mg/dL', referenceRange: '70 - 99 (Normal) / 100 - 125 (Pre-Diabetic)', defaultValue: '92', criticalLow: 45, criticalHigh: 400, flag: 'NORMAL' },
      { id: '2', code: 'PPBS', name: 'Post-Prandial Blood Sugar (PPBS - 2 hrs)', unit: 'mg/dL', referenceRange: '< 140 (Normal) / 140 - 199 (Impaired)', defaultValue: '128', criticalLow: 50, criticalHigh: 450, flag: 'NORMAL' },
      { id: '3', code: 'HBA1C', name: 'Glycated Hemoglobin (HbA1c)', unit: '%', referenceRange: '< 5.7 (Normal) / 5.7 - 6.4 (Pre-Diabetic)', defaultValue: '5.6', criticalHigh: 13.0, flag: 'NORMAL' },
      { id: '4', code: 'EAG', name: 'Estimated Average Glucose (eAG - Nathan)', unit: 'mg/dL', referenceRange: '90 - 120', defaultValue: '114', flag: 'NORMAL' }
    ]
  },
  GLUCOSE_FASTING: {
    key: 'GLUCOSE_FASTING',
    name: 'FASTING BLOOD SUGAR (FBS / FASTING GLUCOSE)',
    shortName: 'Fasting Blood Sugar (FBS)',
    department: 'Clinical Biochemistry',
    category: 'BIOCHEMISTRY',
    specimen: 'Fluoride Plasma (2.0 mL)',
    tubeType: 'FLUORIDE_GREY',
    tubeLabel: '⚪ Fluoride Grey',
    tubeColorHex: '#94A3B8',
    fastingRequired: true,
    preparation: 'Strict 8 to 12 hours overnight fasting. Water permitted.',
    parameters: [
      { id: '1', code: 'FBS', name: 'Fasting Blood Glucose', unit: 'mg/dL', referenceRange: '70 - 99 (Normal) / 100 - 125 (Pre-Diabetes) / >= 126 (Diabetes)', defaultValue: '92', criticalLow: 45, criticalHigh: 400, flag: 'NORMAL' },
      { id: '2', code: 'FBS_URINE', name: 'Fasting Urine Glucose (Benedict)', unit: 'chemical', referenceRange: 'NIL / NEGATIVE', defaultValue: 'NIL', flag: 'NORMAL' }
    ]
  },
  GLUCOSE_PP: {
    key: 'GLUCOSE_PP',
    name: 'POST-PRANDIAL BLOOD SUGAR (PPBS - 2 HOURS POST MEAL)',
    shortName: 'Post-Prandial Sugar (PPBS)',
    department: 'Clinical Biochemistry',
    category: 'BIOCHEMISTRY',
    specimen: 'Fluoride Plasma (2.0 mL)',
    tubeType: 'FLUORIDE_GREY',
    tubeLabel: '⚪ Fluoride Grey',
    tubeColorHex: '#94A3B8',
    fastingRequired: false,
    preparation: 'Blood sample to be drawn exactly 2 hours after the start of a meal.',
    parameters: [
      { id: '1', code: 'PPBS', name: 'Post-Prandial Blood Glucose (2 hrs)', unit: 'mg/dL', referenceRange: '< 140 (Normal) / 140 - 199 (IGT) / >= 200 (Diabetes)', defaultValue: '125', criticalLow: 50, criticalHigh: 450, flag: 'NORMAL' },
      { id: '2', code: 'PPBS_URINE', name: 'PP Urine Glucose (Benedict)', unit: 'chemical', referenceRange: 'NIL / NEGATIVE', defaultValue: 'NIL', flag: 'NORMAL' }
    ]
  },
  GLUCOSE_RANDOM: {
    key: 'GLUCOSE_RANDOM',
    name: 'RANDOM BLOOD SUGAR (RBS / STAT GLUCOSE)',
    shortName: 'Random Blood Sugar (RBS)',
    department: 'Clinical Biochemistry',
    category: 'BIOCHEMISTRY',
    specimen: 'Fluoride Plasma / Venous Blood (2.0 mL)',
    tubeType: 'FLUORIDE_GREY',
    tubeLabel: '⚪ Fluoride Grey',
    tubeColorHex: '#94A3B8',
    fastingRequired: false,
    preparation: 'Drawn at any time regardless of food intake.',
    parameters: [
      { id: '1', code: 'RBS', name: 'Random Blood Glucose', unit: 'mg/dL', referenceRange: '70 - 140 (Normal Reference) / >= 200 (Hyperglycemia with symptoms)', defaultValue: '118', criticalLow: 45, criticalHigh: 400, flag: 'NORMAL' }
    ]
  },
  HBA1C: {
    key: 'HBA1C',
    name: 'GLYCATED HEMOGLOBIN (HbA1c WITH ESTIMATED AVERAGE GLUCOSE)',
    shortName: 'HbA1c & eAG Only',
    department: 'Clinical Biochemistry',
    category: 'BIOCHEMISTRY',
    specimen: 'EDTA Whole Blood (2.0 mL)',
    tubeType: 'EDTA_LAVENDER',
    tubeLabel: '💜 EDTA Lavender',
    tubeColorHex: '#A855F7',
    fastingRequired: false,
    preparation: 'NGSP certified ion-exchange HPLC method. No fasting required.',
    parameters: [
      { id: '1', code: 'HBA1C_VAL', name: 'HbA1c (Glycated Hemoglobin)', unit: '%', referenceRange: '< 5.7 (Normal) / 5.7 - 6.4 (Pre-Diabetic) / >= 6.5 (Diabetic)', defaultValue: '5.5', criticalHigh: 13.0, flag: 'NORMAL' },
      { id: '2', code: 'EAG_VAL', name: 'Estimated Average Glucose (eAG)', unit: 'mg/dL', referenceRange: '90 - 120 (Normal Glycemia)', defaultValue: '111', flag: 'NORMAL' }
    ]
  },
  GTT_OGTT: {
    key: 'GTT_OGTT',
    name: 'ORAL GLUCOSE TOLERANCE TEST (OGTT - 75g GLUCOSE LOAD)',
    shortName: 'Oral Glucose Tolerance (OGTT)',
    department: 'Clinical Biochemistry',
    category: 'BIOCHEMISTRY',
    specimen: 'Fluoride Plasma Samples (Fasting, 1h, 2h)',
    tubeType: 'FLUORIDE_GREY',
    tubeLabel: '⚪ Fluoride Grey',
    tubeColorHex: '#94A3B8',
    fastingRequired: true,
    preparation: 'Patient given 75g anhydrous glucose dissolved in 300ml water after fasting sample.',
    parameters: [
      { id: '1', code: 'GTT_0', name: 'Fasting Plasma Glucose (0 Hour)', unit: 'mg/dL', referenceRange: '< 95 (GDM Criteria) / < 100 (Routine)', defaultValue: '88', flag: 'NORMAL' },
      { id: '2', code: 'GTT_1', name: '1-Hour Plasma Glucose', unit: 'mg/dL', referenceRange: '< 180 (Normal Load Response)', defaultValue: '142', flag: 'NORMAL' },
      { id: '3', code: 'GTT_2', name: '2-Hour Plasma Glucose', unit: 'mg/dL', referenceRange: '< 140 (Normal) / 140 - 199 (Impaired) / >= 200 (Diabetic)', defaultValue: '124', flag: 'NORMAL' }
    ]
  },
  INSULIN_FASTING: {
    key: 'INSULIN_FASTING',
    name: 'FASTING SERUM INSULIN & HOMA-IR (INSULIN RESISTANCE INDEX)',
    shortName: 'Fasting Insulin & HOMA-IR',
    department: 'Clinical Biochemistry & Endocrinology',
    category: 'BIOCHEMISTRY',
    specimen: 'Serum & Fluoride Plasma Fasting (3.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: true,
    preparation: '10 hours overnight fasting for metabolic syndrome and PCOS assessment.',
    parameters: [
      { id: '1', code: 'INS_FAST', name: 'Fasting Serum Insulin (CLIA)', unit: 'uIU/mL', referenceRange: '2.6 - 24.9', defaultValue: '8.4', flag: 'NORMAL' },
      { id: '2', code: 'GLU_FAST', name: 'Fasting Blood Glucose', unit: 'mg/dL', referenceRange: '70 - 99', defaultValue: '90', flag: 'NORMAL' },
      { id: '3', code: 'HOMA_IR', name: 'HOMA-IR (Homeostatic Model Assessment)', unit: 'index', referenceRange: '< 2.0 (Normal Insulin Sensitivity) / > 2.5 (Insulin Resistant)', defaultValue: '1.87', flag: 'NORMAL' }
    ]
  },
  PANCREATIC: {
    key: 'PANCREATIC',
    name: 'PANCREATIC ENZYMES (SERUM AMYLASE & LIPASE)',
    shortName: 'Amylase & Lipase',
    department: 'Clinical Biochemistry',
    category: 'BIOCHEMISTRY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Acute abdominal pain diagnostic panel for acute pancreatitis.',
    parameters: [
      { id: '1', code: 'AMYLASE', name: 'Serum Amylase', unit: 'U/L', referenceRange: '28 - 100', defaultValue: '64', criticalHigh: 350, flag: 'NORMAL' },
      { id: '2', code: 'LIPASE', name: 'Serum Lipase (Pancreas Specific)', unit: 'U/L', referenceRange: '13 - 60', defaultValue: '34', criticalHigh: 250, flag: 'NORMAL' }
    ]
  },
  LDH: {
    key: 'LDH',
    name: 'LACTATE DEHYDROGENASE (LDH TOTAL ENZYME)',
    shortName: 'Serum LDH Total',
    department: 'Clinical Biochemistry & Oncology',
    category: 'BIOCHEMISTRY',
    specimen: 'Serum Unhemolyzed (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Strictly avoid hemolysis (RBCs contain high levels of LDH).',
    parameters: [
      { id: '1', code: 'LDH_TOT', name: 'Serum Lactate Dehydrogenase (LDH)', unit: 'U/L', referenceRange: '125 - 245', defaultValue: '185', criticalHigh: 600, flag: 'NORMAL' }
    ]
  },
  SERUM_URIC_ACID: {
    key: 'SERUM_URIC_ACID',
    name: 'SERUM URIC ACID (GOUT & HYPERURICEMIA SCREEN)',
    shortName: 'Serum Uric Acid',
    department: 'Clinical Biochemistry',
    category: 'BIOCHEMISTRY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Routine collection, joint pain / podagra evaluation.',
    parameters: [
      { id: '1', code: 'URIC_ACID', name: 'Serum Uric Acid', unit: 'mg/dL', referenceRange: '3.5 - 7.2 (Male) / 2.6 - 6.0 (Female)', defaultValue: '5.1', criticalHigh: 11.0, flag: 'NORMAL' }
    ]
  },
  SERUM_CALCIUM_PHOSPHORUS: {
    key: 'SERUM_CALCIUM_PHOSPHORUS',
    name: 'BONE MINERAL PROFILE (SERUM CALCIUM, PHOSPHORUS & ALP)',
    shortName: 'Bone Mineral Profile',
    department: 'Clinical Biochemistry',
    category: 'BIOCHEMISTRY',
    specimen: 'Serum Fasting (2.5 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: true,
    preparation: 'Morning fasting blood collection for metabolic bone diseases.',
    parameters: [
      { id: '1', code: 'CALC_TOT', name: 'Serum Calcium Total', unit: 'mg/dL', referenceRange: '8.5 - 10.5', defaultValue: '9.4', criticalLow: 6.5, criticalHigh: 13.0, flag: 'NORMAL' },
      { id: '2', code: 'PHOS_INORG', name: 'Serum Inorganic Phosphorus', unit: 'mg/dL', referenceRange: '2.5 - 4.5', defaultValue: '3.6', flag: 'NORMAL' },
      { id: '3', code: 'ALP_BONE', name: 'Alkaline Phosphatase (ALP)', unit: 'U/L', referenceRange: '40 - 129', defaultValue: '82', flag: 'NORMAL' }
    ]
  },
  SERUM_MAGNESIUM: {
    key: 'SERUM_MAGNESIUM',
    name: 'SERUM MAGNESIUM (Mg2+ QUANTITATIVE)',
    shortName: 'Serum Magnesium',
    department: 'Clinical Biochemistry & Critical Care',
    category: 'BIOCHEMISTRY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Arrhythmia, tetany, and muscle weakness evaluation.',
    parameters: [
      { id: '1', code: 'MAGNESIUM', name: 'Serum Magnesium', unit: 'mg/dL', referenceRange: '1.7 - 2.4', defaultValue: '2.1', criticalLow: 1.0, criticalHigh: 4.5, flag: 'NORMAL' }
    ]
  },

  // =========================================================================
  // 3. CARDIAC MARKERS & EMERGENCY ICU
  // =========================================================================
  CARDIAC_MARKERS: {
    key: 'CARDIAC_MARKERS',
    name: 'CARDIAC EMERGENCY INJURY PANEL (hs-Troponin I, CK-MB & NT-proBNP)',
    shortName: 'Cardiac Emergency Panel',
    department: 'Clinical Biochemistry & Critical Care',
    category: 'CARDIAC_CRITICAL',
    specimen: 'Serum or Heparin Plasma (3.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'STAT Emergency draw for acute chest pain / suspected Acute Coronary Syndrome.',
    parameters: [
      { id: '1', code: 'TROP_I', name: 'High-Sensitivity Troponin I (hs-cTnI)', unit: 'pg/mL', referenceRange: '< 15.6 (Male) / < 11.4 (Female)', defaultValue: '6.2', criticalHigh: 50.0, flag: 'NORMAL' },
      { id: '2', code: 'CKMB', name: 'Creatine Kinase-MB (CK-MB Mass)', unit: 'ng/mL', referenceRange: '< 5.0', defaultValue: '2.1', criticalHigh: 15.0, flag: 'NORMAL' },
      { id: '3', code: 'CPK_TOT', name: 'CPK Total (Creatine Phosphokinase)', unit: 'U/L', referenceRange: '39 - 308 (Male) / 26 - 192 (Female)', defaultValue: '110', criticalHigh: 1000, flag: 'NORMAL' },
      { id: '4', code: 'NT_PROBNP', name: 'NT-proBNP (Heart Failure Marker)', unit: 'pg/mL', referenceRange: '< 125 (Age < 75 yrs)', defaultValue: '68', criticalHigh: 900, flag: 'NORMAL' }
    ]
  },
  TROPONIN_I_HS: {
    key: 'TROPONIN_I_HS',
    name: 'HIGH-SENSITIVITY CARDIAC TROPONIN-I (hs-cTnI STAT)',
    shortName: 'hs-Troponin I STAT',
    department: 'Critical Care & Cardiac Biochemistry',
    category: 'CARDIAC_CRITICAL',
    specimen: 'Serum or Heparin Plasma (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Gold-standard quantitative myocardial necrosis biomarker.',
    parameters: [
      { id: '1', code: 'HS_TROP_I', name: 'hs-Troponin I (99th Percentile URL)', unit: 'pg/mL', referenceRange: '< 15.6 (Male) / < 11.4 (Female)', defaultValue: '5.8', criticalHigh: 50.0, flag: 'NORMAL' }
    ]
  },
  TROPONIN_T_HS: {
    key: 'TROPONIN_T_HS',
    name: 'HIGH-SENSITIVITY CARDIAC TROPONIN-T (hs-cTnT STAT)',
    shortName: 'hs-Troponin T STAT',
    department: 'Critical Care & Cardiac Biochemistry',
    category: 'CARDIAC_CRITICAL',
    specimen: 'Serum or Heparin Plasma (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Emergency acute myocardial infarction protocol.',
    parameters: [
      { id: '1', code: 'HS_TROP_T', name: 'hs-Troponin T (99th Percentile URL)', unit: 'ng/L', referenceRange: '< 14.0 (Normal Cutoff)', defaultValue: '6.4', criticalHigh: 52.0, flag: 'NORMAL' }
    ]
  },
  NT_PROBNP: {
    key: 'NT_PROBNP',
    name: 'NT-proBNP (N-TERMINAL PRO B-TYPE NATRIURETIC PEPTIDE)',
    shortName: 'NT-proBNP Heart Failure',
    department: 'Cardiac Biochemistry',
    category: 'CARDIAC_CRITICAL',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Evaluation of congestive heart failure and dyspnea of unknown origin.',
    parameters: [
      { id: '1', code: 'NT_PROBNP_VAL', name: 'NT-proBNP Level', unit: 'pg/mL', referenceRange: '< 125 (Age < 75) / < 450 (Age >= 75)', defaultValue: '72', criticalHigh: 900, flag: 'NORMAL' }
    ]
  },
  CK_MB: {
    key: 'CK_MB',
    name: 'CREATINE KINASE-MB & TOTAL CPK (CK-MB / CPK)',
    shortName: 'CK-MB & Total CPK',
    department: 'Cardiac Biochemistry',
    category: 'CARDIAC_CRITICAL',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Serial sampling at 0, 3, 6 hours for reinfarction / muscle injury.',
    parameters: [
      { id: '1', code: 'CPK_TOT', name: 'Total CPK (Creatine Kinase)', unit: 'U/L', referenceRange: '39 - 308 (Male) / 26 - 192 (Female)', defaultValue: '105', criticalHigh: 1000, flag: 'NORMAL' },
      { id: '2', code: 'CK_MB_MASS', name: 'CK-MB Mass', unit: 'ng/mL', referenceRange: '< 5.0', defaultValue: '2.4', criticalHigh: 15.0, flag: 'NORMAL' },
      { id: '3', code: 'CK_REL_IDX', name: 'CK-MB Relative Index', unit: '%', referenceRange: '< 3.0% (Cardiac Specificity)', defaultValue: '2.2%', flag: 'NORMAL' }
    ]
  },
  HOMOCYSTEINE: {
    key: 'HOMOCYSTEINE',
    name: 'SERUM HOMOCYSTEINE (CARDIOVASCULAR & THROMBOTIC RISK)',
    shortName: 'Serum Homocysteine',
    department: 'Clinical Biochemistry',
    category: 'CARDIAC_CRITICAL',
    specimen: 'Serum Fasting - Centrifuge & Separate Promptly (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: true,
    preparation: '10 hours fasting. Separate serum within 1 hour to prevent release from RBCs.',
    parameters: [
      { id: '1', code: 'HOMOCYST', name: 'Serum Homocysteine', unit: 'umol/L', referenceRange: '5.0 - 15.0 (Desirable) / > 30 (High Risk)', defaultValue: '9.8', criticalHigh: 50.0, flag: 'NORMAL' }
    ]
  },
  HS_CRP: {
    key: 'HS_CRP',
    name: 'HIGH SENSITIVITY C-REACTIVE PROTEIN (hs-CRP CARDIAC RISK)',
    shortName: 'hs-CRP Cardiac Risk',
    department: 'Cardiology & Clinical Biochemistry',
    category: 'CARDIAC_CRITICAL',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Patient must be free of acute infection, fever, or trauma.',
    parameters: [
      { id: '1', code: 'HS_CRP_VAL', name: 'hs-CRP (Cardiac Risk Stratification)', unit: 'mg/L', referenceRange: '< 1.0 (Low Risk) / 1.0 - 3.0 (Average) / > 3.0 (High Risk)', defaultValue: '0.85', criticalHigh: 10.0, flag: 'NORMAL' }
    ]
  },

  // =========================================================================
  // 4. ENDOCRINOLOGY, HORMONES & REPRODUCTIVE HEALTH
  // =========================================================================
  THYROID_TOTAL: {
    key: 'THYROID_TOTAL',
    name: 'THYROID PROFILE TOTAL (T3, T4 & TSH ULTRASENSITIVE)',
    shortName: 'Thyroid Profile Total',
    department: 'Immunology & Endocrinology',
    category: 'ENDOCRINOLOGY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Morning sample preferred before taking morning thyroxine medication.',
    parameters: [
      { id: '1', code: 'T3_TOT', name: 'Triiodothyronine (Total T3)', unit: 'ng/mL', referenceRange: '0.80 - 2.00', defaultValue: '1.25', flag: 'NORMAL' },
      { id: '2', code: 'T4_TOT', name: 'Thyroxine (Total T4)', unit: 'ug/dL', referenceRange: '5.1 - 14.1', defaultValue: '8.4', flag: 'NORMAL' },
      { id: '3', code: 'TSH', name: 'Thyroid Stimulating Hormone (TSH Ultrasensitive)', unit: 'uIU/mL', referenceRange: '0.35 - 4.94', defaultValue: '2.45', criticalLow: 0.05, criticalHigh: 20.0, flag: 'NORMAL' }
    ]
  },
  THYROID_FREE: {
    key: 'THYROID_FREE',
    name: 'FREE THYROID PANEL & ANTIBODIES (FT3, FT4, TSH & Anti-TPO)',
    shortName: 'Free T3, Free T4 & Anti-TPO',
    department: 'Immunology & Endocrinology',
    category: 'ENDOCRINOLOGY',
    specimen: 'Serum (2.5 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Preferred for pregnancy, thyroiditis, and borderline cases unaffected by TBG.',
    parameters: [
      { id: '1', code: 'FT3', name: 'Free Triiodothyronine (FT3)', unit: 'pg/mL', referenceRange: '2.3 - 4.2', defaultValue: '3.1', flag: 'NORMAL' },
      { id: '2', code: 'FT4', name: 'Free Thyroxine (FT4)', unit: 'ng/dL', referenceRange: '0.89 - 1.76', defaultValue: '1.24', flag: 'NORMAL' },
      { id: '3', code: 'TSH', name: 'TSH Ultrasensitive (3rd Gen)', unit: 'uIU/mL', referenceRange: '0.35 - 4.94', defaultValue: '2.10', flag: 'NORMAL' },
      { id: '4', code: 'ANTI_TPO', name: 'Anti-Thyroid Peroxidase (Anti-TPO)', unit: 'IU/mL', referenceRange: '< 34.0 (Negative)', defaultValue: '12.4', flag: 'NORMAL' }
    ]
  },
  TSH_ONLY: {
    key: 'TSH_ONLY',
    name: 'THYROID STIMULATING HORMONE (TSH ULTRASENSITIVE 3RD GEN)',
    shortName: 'TSH Ultrasensitive Only',
    department: 'Immunology & Endocrinology',
    category: 'ENDOCRINOLOGY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Chemiluminescent 3rd generation assay (Sensitivity 0.005 uIU/mL).',
    parameters: [
      { id: '1', code: 'TSH_STANDALONE', name: 'TSH Ultrasensitive (3rd Generation)', unit: 'uIU/mL', referenceRange: '0.35 - 4.94 (Euthyroid) / Trimester 1: 0.1 - 2.5', defaultValue: '2.35', criticalLow: 0.05, criticalHigh: 20.0, flag: 'NORMAL' }
    ]
  },
  THYROID_ANTIBODIES: {
    key: 'THYROID_ANTIBODIES',
    name: 'THYROID AUTOANTIBODIES (ANTI-TPO & ANTI-THYROGLOBULIN)',
    shortName: 'Thyroid Autoantibodies Profile',
    department: 'Immunology & Endocrinology',
    category: 'ENDOCRINOLOGY',
    specimen: 'Serum (2.5 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: "Hashimoto's thyroiditis and Graves' disease autoimmune evaluation.",
    parameters: [
      { id: '1', code: 'ANTI_TPO', name: 'Anti-Thyroid Peroxidase (Anti-TPO / Microsomal)', unit: 'IU/mL', referenceRange: '< 34.0 (Negative)', defaultValue: '14.2', flag: 'NORMAL' },
      { id: '2', code: 'ANTI_TG', name: 'Anti-Thyroglobulin (Anti-TG)', unit: 'IU/mL', referenceRange: '< 115.0 (Negative)', defaultValue: '22.6', flag: 'NORMAL' }
    ]
  },
  FERTILITY_FEMALE: {
    key: 'FERTILITY_FEMALE',
    name: 'FEMALE INFERTILITY & PCOS PROFILE (AMH, LH, FSH, PRL & E2)',
    shortName: 'Female Infertility & AMH',
    department: 'Reproductive Endocrinology',
    category: 'ENDOCRINOLOGY',
    specimen: 'Serum (3.5 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Optimal on Day 2 or 3 of menstrual cycle.',
    parameters: [
      { id: '1', code: 'AMH', name: 'Anti-Müllerian Hormone (AMH - Ovarian Reserve)', unit: 'ng/mL', referenceRange: '1.5 - 4.0 (Normal) / < 1.0 (Low Reserve)', defaultValue: '2.8', flag: 'NORMAL' },
      { id: '2', code: 'LH', name: 'Luteinizing Hormone (LH - Follicular)', unit: 'mIU/mL', referenceRange: '2.4 - 12.6', defaultValue: '5.6', flag: 'NORMAL' },
      { id: '3', code: 'FSH', name: 'Follicle Stimulating Hormone (FSH)', unit: 'mIU/mL', referenceRange: '3.5 - 12.5', defaultValue: '6.2', flag: 'NORMAL' },
      { id: '4', code: 'PRL', name: 'Serum Prolactin', unit: 'ng/mL', referenceRange: '4.8 - 23.3 (Non-pregnant)', defaultValue: '14.2', criticalHigh: 100.0, flag: 'NORMAL' },
      { id: '5', code: 'E2', name: 'Estradiol (E2 - Early Follicular)', unit: 'pg/mL', referenceRange: '24 - 150', defaultValue: '54', flag: 'NORMAL' },
      { id: '6', code: 'TESTO_TOT', name: 'Total Testosterone (Female)', unit: 'ng/dL', referenceRange: '15 - 70', defaultValue: '32', flag: 'NORMAL' }
    ]
  },
  AMH: {
    key: 'AMH',
    name: 'ANTI-MÜLLERIAN HORMONE (AMH - OVARIAN RESERVE MARKER)',
    shortName: 'AMH (Ovarian Reserve)',
    department: 'Reproductive Endocrinology',
    category: 'ENDOCRINOLOGY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Can be drawn on any day of menstrual cycle (cycle-independent).',
    parameters: [
      { id: '1', code: 'AMH_VAL', name: 'Anti-Müllerian Hormone (AMH)', unit: 'ng/mL', referenceRange: '1.5 - 4.0 (Normal) / 4.0 - 10.0 (High/PCOS) / < 1.0 (Low)', defaultValue: '2.65', flag: 'NORMAL' }
    ]
  },
  PROLACTIN: {
    key: 'PROLACTIN',
    name: 'SERUM PROLACTIN (HYPERPROLACTINEMIA & GALACTORRHEA)',
    shortName: 'Serum Prolactin',
    department: 'Reproductive Endocrinology',
    category: 'ENDOCRINOLOGY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Rest for 20-30 minutes before venipuncture (stress elevates prolactin).',
    parameters: [
      { id: '1', code: 'PROLACTIN_VAL', name: 'Serum Prolactin', unit: 'ng/mL', referenceRange: '4.8 - 23.3 (Female) / 4.0 - 15.2 (Male)', defaultValue: '12.8', criticalHigh: 100.0, flag: 'NORMAL' }
    ]
  },
  BETA_HCG: {
    key: 'BETA_HCG',
    name: 'BETA-hCG QUANTITATIVE (PREGNANCY & GESTATIONAL MARKER)',
    shortName: 'Beta-hCG Quantitative',
    department: 'Reproductive Endocrinology',
    category: 'ENDOCRINOLOGY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Confirmation of pregnancy, ectopic gestation, and gestational age monitoring.',
    parameters: [
      { id: '1', code: 'BHCG', name: 'Beta-Human Chorionic Gonadotropin (Beta-hCG)', unit: 'mIU/mL', referenceRange: '< 5.0 (Non-Pregnant) / > 25 (Positive for Pregnancy)', defaultValue: '845.0', flag: 'NORMAL' }
    ]
  },
  FERTILITY_MALE: {
    key: 'FERTILITY_MALE',
    name: 'MALE ANDROGEN & HYPOGONADISM PROFILE (TESTOSTERONE, SHBG, LH, FSH)',
    shortName: 'Male Androgen Profile',
    department: 'Reproductive Endocrinology & Andrology',
    category: 'ENDOCRINOLOGY',
    specimen: 'Serum Fasting Morning (3.5 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: true,
    preparation: 'Morning 7:00 AM - 10:00 AM collection required (diurnal testosterone peak).',
    parameters: [
      { id: '1', code: 'TESTO_TOT', name: 'Total Testosterone (Male)', unit: 'ng/dL', referenceRange: '280 - 1100', defaultValue: '540', criticalLow: 150, flag: 'NORMAL' },
      { id: '2', code: 'TESTO_FREE', name: 'Free Testosterone (Calculated / Dialysis)', unit: 'pg/mL', referenceRange: '47.0 - 244.0', defaultValue: '112.0', flag: 'NORMAL' },
      { id: '3', code: 'SHBG', name: 'Sex Hormone Binding Globulin (SHBG)', unit: 'nmol/L', referenceRange: '18.3 - 54.1', defaultValue: '34.2', flag: 'NORMAL' },
      { id: '4', code: 'LH_MALE', name: 'Luteinizing Hormone (LH)', unit: 'mIU/mL', referenceRange: '1.7 - 8.6', defaultValue: '4.8', flag: 'NORMAL' },
      { id: '5', code: 'FSH_MALE', name: 'Follicle Stimulating Hormone (FSH)', unit: 'mIU/mL', referenceRange: '1.5 - 12.4', defaultValue: '5.2', flag: 'NORMAL' },
      { id: '6', code: 'PRL_MALE', name: 'Serum Prolactin', unit: 'ng/mL', referenceRange: '4.0 - 15.2', defaultValue: '8.6', flag: 'NORMAL' }
    ]
  },
  TESTOSTERONE_TOTAL: {
    key: 'TESTOSTERONE_TOTAL',
    name: 'TOTAL TESTOSTERONE (SERUM TOTAL ANDROGEN)',
    shortName: 'Total Testosterone',
    department: 'Endocrinology & Andrology',
    category: 'ENDOCRINOLOGY',
    specimen: 'Serum Morning (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Morning blood draw 7 AM - 10 AM.',
    parameters: [
      { id: '1', code: 'TESTO_SERUM', name: 'Serum Total Testosterone', unit: 'ng/dL', referenceRange: '280 - 1100 (Adult Male) / 15 - 70 (Female)', defaultValue: '560', flag: 'NORMAL' }
    ]
  },
  PROGESTERONE: {
    key: 'PROGESTERONE',
    name: 'SERUM PROGESTERONE (OVULATION & DAY 21 LUTEAL ASSESSMENT)',
    shortName: 'Serum Progesterone',
    department: 'Reproductive Endocrinology',
    category: 'ENDOCRINOLOGY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Best sampled on Day 21 of 28-day menstrual cycle (mid-luteal phase).',
    parameters: [
      { id: '1', code: 'PROG_VAL', name: 'Serum Progesterone', unit: 'ng/mL', referenceRange: '1.8 - 24.0 (Mid-Luteal / Ovulatory) / < 0.8 (Follicular)', defaultValue: '12.4', flag: 'NORMAL' }
    ]
  },
  ESTRADIOL_E2: {
    key: 'ESTRADIOL_E2',
    name: 'SERUM ESTRADIOL (17-BETA ESTRADIOL / E2)',
    shortName: 'Serum Estradiol (E2)',
    department: 'Reproductive Endocrinology',
    category: 'ENDOCRINOLOGY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Follicular, mid-cycle surge, or IVF monitoring.',
    parameters: [
      { id: '1', code: 'E2_VAL', name: '17-Beta Estradiol (E2)', unit: 'pg/mL', referenceRange: '24 - 150 (Follicular) / 100 - 450 (Ovulatory Peak)', defaultValue: '68', flag: 'NORMAL' }
    ]
  },
  LH_FSH_RATIO: {
    key: 'LH_FSH_RATIO',
    name: 'LH & FSH PROFILE (LUTEINIZING & FOLLICLE STIMULATING HORMONES)',
    shortName: 'LH & FSH Duo',
    department: 'Reproductive Endocrinology',
    category: 'ENDOCRINOLOGY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Day 2-3 of menstrual cycle. LH:FSH ratio > 2:1 indicates PCOS.',
    parameters: [
      { id: '1', code: 'LH_VAL', name: 'Luteinizing Hormone (LH)', unit: 'mIU/mL', referenceRange: '2.4 - 12.6 (Follicular)', defaultValue: '5.4', flag: 'NORMAL' },
      { id: '2', code: 'FSH_VAL', name: 'Follicle Stimulating Hormone (FSH)', unit: 'mIU/mL', referenceRange: '3.5 - 12.5 (Follicular)', defaultValue: '6.1', flag: 'NORMAL' },
      { id: '3', code: 'LH_FSH_RATIO_VAL', name: 'LH : FSH Ratio', unit: 'ratio', referenceRange: '< 1.5 : 1 (Normal) / > 2.0 : 1 (PCOS Pattern)', defaultValue: '0.89', flag: 'NORMAL' }
    ]
  },
  CORTISOL_DIURNAL: {
    key: 'CORTISOL_DIURNAL',
    name: 'SERUM CORTISOL DIURNAL RHYTHM (8:00 AM & 4:00 PM)',
    shortName: 'Cortisol Diurnal Rhythm',
    department: 'Endocrinology & Adrenal Diagnostics',
    category: 'ENDOCRINOLOGY',
    specimen: 'Serum (2.0 mL each timepoint)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Avoid emotional / physical stress. Blood drawn at 8:00 AM and 4:00 PM.',
    parameters: [
      { id: '1', code: 'CORT_8AM', name: 'Serum Cortisol (8:00 AM Morning Peak)', unit: 'ug/dL', referenceRange: '6.2 - 19.4', defaultValue: '14.2', criticalLow: 2.0, criticalHigh: 35.0, flag: 'NORMAL' },
      { id: '2', code: 'CORT_4PM', name: 'Serum Cortisol (4:00 PM Afternoon Trough)', unit: 'ug/dL', referenceRange: '2.3 - 11.9', defaultValue: '6.8', flag: 'NORMAL' }
    ]
  },
  DHEA_S: {
    key: 'DHEA_S',
    name: 'DHEA-SULFATE (DEHYDROEPIANDROSTERONE SULFATE)',
    shortName: 'DHEA-Sulfate',
    department: 'Endocrinology & Adrenal Diagnostics',
    category: 'ENDOCRINOLOGY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Evaluation of adrenal hyperandrogenism, hirsutism, and CAH.',
    parameters: [
      { id: '1', code: 'DHEA_S_VAL', name: 'DHEA-Sulfate (DHEA-S)', unit: 'ug/dL', referenceRange: '80 - 560 (Male) / 35 - 430 (Female)', defaultValue: '210', flag: 'NORMAL' }
    ]
  },
  PTH_INTACT: {
    key: 'PTH_INTACT',
    name: 'PARATHYROID HORMONE INTACT (iPTH & CALCIUM CORRELATION)',
    shortName: 'Intact PTH (iPTH)',
    department: 'Endocrinology & Mineral Metabolism',
    category: 'ENDOCRINOLOGY',
    specimen: 'Serum or EDTA Plasma Frozen Promptly (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: true,
    preparation: 'Overnight fasting. Centrifuge and freeze serum immediately.',
    parameters: [
      { id: '1', code: 'IPTH_VAL', name: 'Intact Parathyroid Hormone (iPTH)', unit: 'pg/mL', referenceRange: '15.0 - 65.0', defaultValue: '34.5', criticalLow: 5.0, criticalHigh: 200.0, flag: 'NORMAL' },
      { id: '2', code: 'CALC_SERUM', name: 'Simultaneous Serum Calcium', unit: 'mg/dL', referenceRange: '8.5 - 10.5', defaultValue: '9.3', flag: 'NORMAL' }
    ]
  },
  TRIPLE_MARKER: {
    key: 'TRIPLE_MARKER',
    name: 'MATERNAL TRIPLE SCREEN (SECOND TRIMESTER PRENATAL RISK)',
    shortName: 'Triple Marker Maternal Screen',
    department: 'Reproductive Endocrinology & Prenatal Genetics',
    category: 'ENDOCRINOLOGY',
    specimen: 'Serum (3.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Gestational age 15 to 20 weeks with ultrasound biparietal diameter (BPD).',
    parameters: [
      { id: '1', code: 'AFP_MOM', name: 'Alpha-Fetoprotein (AFP)', unit: 'ng/mL / MoM', referenceRange: '0.5 - 2.5 MoM', defaultValue: '32.4 ng/mL (1.02 MoM)', flag: 'NORMAL' },
      { id: '2', code: 'BHCG_MOM', name: 'Beta-hCG Total', unit: 'mIU/mL / MoM', referenceRange: '0.5 - 2.0 MoM', defaultValue: '24,500 mIU/mL (1.10 MoM)', flag: 'NORMAL' },
      { id: '3', code: 'UE3_MOM', name: 'Unconjugated Estriol (uE3)', unit: 'ng/mL / MoM', referenceRange: '> 0.5 MoM', defaultValue: '1.85 ng/mL (0.95 MoM)', flag: 'NORMAL' },
      { id: '4', code: 'DOWNS_RISK', name: 'Calculated Down Syndrome Risk', unit: 'risk', referenceRange: '< 1:250 (Low Risk Cutoff)', defaultValue: '1 : 1,450 (LOW RISK)', flag: 'NORMAL' },
      { id: '5', code: 'NTD_RISK', name: 'Neural Tube Defect (NTD) Risk', unit: 'risk', referenceRange: '< 2.5 MoM (Low Risk)', defaultValue: 'LOW RISK', flag: 'NORMAL' }
    ]
  },
  QUADRUPLE_MARKER: {
    key: 'QUADRUPLE_MARKER',
    name: 'MATERNAL QUADRUPLE SCREEN (SECOND TRIMESTER PRENATAL RISK)',
    shortName: 'Quadruple Marker Maternal Screen',
    department: 'Reproductive Endocrinology & Prenatal Genetics',
    category: 'ENDOCRINOLOGY',
    specimen: 'Serum (3.5 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Gestational age 14 to 22 weeks. Requires maternal weight, diabetic status, USG dating.',
    parameters: [
      { id: '1', code: 'AFP_MOM', name: 'Alpha-Fetoprotein (AFP)', unit: 'ng/mL / MoM', referenceRange: '0.5 - 2.5 MoM', defaultValue: '34.2 ng/mL (1.05 MoM)', flag: 'NORMAL' },
      { id: '2', code: 'BHCG_MOM', name: 'Beta-hCG Total', unit: 'mIU/mL / MoM', referenceRange: '0.5 - 2.0 MoM', defaultValue: '22,400 mIU/mL (1.04 MoM)', flag: 'NORMAL' },
      { id: '3', code: 'UE3_MOM', name: 'Unconjugated Estriol (uE3)', unit: 'ng/mL / MoM', referenceRange: '> 0.5 MoM', defaultValue: '1.92 ng/mL (0.98 MoM)', flag: 'NORMAL' },
      { id: '4', code: 'INHIBIN_A', name: 'Inhibin-A', unit: 'pg/mL / MoM', referenceRange: '< 2.0 MoM', defaultValue: '142 pg/mL (0.92 MoM)', flag: 'NORMAL' },
      { id: '5', code: 'TRISOMY_RISK', name: 'Down Syndrome (Trisomy 21) Risk', unit: 'risk', referenceRange: '< 1:250 (Low Risk Cutoff)', defaultValue: '1 : 2,800 (LOW RISK)', flag: 'NORMAL' }
    ]
  },

  // =========================================================================
  // 5. VITAMINS, MINERALS & IRON STUDIES
  // =========================================================================
  VITAMIN_D_B12: {
    key: 'VITAMIN_D_B12',
    name: 'VITAMIN ESSENTIALS PANEL (25-OH VITAMIN D & VITAMIN B12)',
    shortName: 'Vitamin D3 & B12 Panel',
    department: 'Metabolic Endocrinology & Biochemistry',
    category: 'VITAMINS_IRON',
    specimen: 'Serum Light Protected (3.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Protect sample from direct sunlight.',
    parameters: [
      { id: '1', code: 'VIT_D', name: '25-Hydroxy Vitamin D (Total D2 + D3)', unit: 'ng/mL', referenceRange: '30.0 - 100.0 (Optimal) / < 20 (Deficient)', defaultValue: '38.4', criticalLow: 10.0, flag: 'NORMAL' },
      { id: '2', code: 'VIT_B12', name: 'Vitamin B12 (Cyanocobalamin)', unit: 'pg/mL', referenceRange: '211 - 911 (Normal) / < 200 (Deficient)', defaultValue: '412', criticalLow: 150, flag: 'NORMAL' },
      { id: '3', code: 'FOLATE', name: 'Serum Folate / Folic Acid', unit: 'ng/mL', referenceRange: '4.6 - 18.7', defaultValue: '9.2', flag: 'NORMAL' }
    ]
  },
  VITAMIN_D: {
    key: 'VITAMIN_D',
    name: '25-HYDROXY VITAMIN D TOTAL (D2 + D3 BY CLIA)',
    shortName: 'Vitamin D (25-OH Total)',
    department: 'Metabolic Endocrinology',
    category: 'VITAMINS_IRON',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Routine venipuncture for bone density, fatigue, and immunity workup.',
    parameters: [
      { id: '1', code: 'VIT_D_ONLY', name: '25-OH Vitamin D Total', unit: 'ng/mL', referenceRange: '< 20 (Deficient) / 20 - 29 (Insufficient) / 30 - 100 (Sufficient)', defaultValue: '36.8', criticalLow: 10.0, flag: 'NORMAL' }
    ]
  },
  VITAMIN_B12: {
    key: 'VITAMIN_B12',
    name: 'VITAMIN B12 (CYANOCOBALAMIN BY CLIA)',
    shortName: 'Vitamin B12 Only',
    department: 'Clinical Biochemistry & Hematology',
    category: 'VITAMINS_IRON',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Evaluation of megaloblastic anemia, neuropathy, and vegetarian diets.',
    parameters: [
      { id: '1', code: 'B12_ONLY', name: 'Vitamin B12 Level', unit: 'pg/mL', referenceRange: '211 - 911 (Normal) / < 200 (Deficient) / > 1500 (Elevated)', defaultValue: '385', criticalLow: 150, flag: 'NORMAL' }
    ]
  },
  IRON_PROFILE: {
    key: 'IRON_PROFILE',
    name: 'IRON DEFICIENCY ANEMIA PROFILE (FERRITIN, IRON, TIBC & SATURATION)',
    shortName: 'Iron Profile & Ferritin',
    department: 'Clinical Biochemistry & Hematology',
    category: 'VITAMINS_IRON',
    specimen: 'Serum Fasting (3.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: true,
    preparation: 'Early morning fasting draw is ideal (iron levels fluctuate diurnally).',
    parameters: [
      { id: '1', code: 'FERRITIN', name: 'Serum Ferritin', unit: 'ng/mL', referenceRange: '30 - 400 (Male) / 13 - 150 (Female)', defaultValue: '86', criticalLow: 10, flag: 'NORMAL' },
      { id: '2', code: 'FE', name: 'Serum Iron', unit: 'ug/dL', referenceRange: '65 - 175 (Male) / 50 - 170 (Female)', defaultValue: '95', flag: 'NORMAL' },
      { id: '3', code: 'TIBC', name: 'Total Iron Binding Capacity (TIBC)', unit: 'ug/dL', referenceRange: '250 - 450', defaultValue: '340', flag: 'NORMAL' },
      { id: '4', code: 'UIBC', name: 'Unsaturated Iron Binding Capacity (UIBC)', unit: 'ug/dL', referenceRange: '155 - 355', defaultValue: '245', flag: 'NORMAL' },
      { id: '5', code: 'TRANS_SAT', name: 'Transferrin Saturation Percentage', unit: '%', referenceRange: '20.0 - 50.0 (Normal) / < 15.0 (Iron Deficient)', defaultValue: '27.9', flag: 'NORMAL' }
    ]
  },
  FERRITIN: {
    key: 'FERRITIN',
    name: 'SERUM FERRITIN (IRON STORAGE & ACUTE PHASE REACTANT)',
    shortName: 'Serum Ferritin Only',
    department: 'Clinical Biochemistry & Hematology',
    category: 'VITAMINS_IRON',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Most sensitive test for iron deficiency stores and inflammatory hyperferritinemia.',
    parameters: [
      { id: '1', code: 'FERRITIN_VAL', name: 'Serum Ferritin', unit: 'ng/mL', referenceRange: '30 - 400 (Male) / 13 - 150 (Female)', defaultValue: '92', criticalLow: 10, criticalHigh: 1000, flag: 'NORMAL' }
    ]
  },
  FOLIC_ACID: {
    key: 'FOLIC_ACID',
    name: 'SERUM FOLATE / FOLIC ACID (MACROCYTIC ANEMIA WORKUP)',
    shortName: 'Serum Folate / Folic Acid',
    department: 'Clinical Biochemistry & Hematology',
    category: 'VITAMINS_IRON',
    specimen: 'Serum Light Protected (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: true,
    preparation: 'Protect from light. Fasting sample preferred.',
    parameters: [
      { id: '1', code: 'FOLATE_VAL', name: 'Serum Folate', unit: 'ng/mL', referenceRange: '4.6 - 18.7 (Normal) / < 3.0 (Deficient)', defaultValue: '8.4', criticalLow: 2.0, flag: 'NORMAL' }
    ]
  },

  // =========================================================================
  // 6. INFECTIOUS DISEASE, VECTOR-BORNE & FEVER SEROLOGY
  // =========================================================================
  FEVER_PANEL: {
    key: 'FEVER_PANEL',
    name: 'ACUTE FEVER & TROPICAL INFECTION PROFILE (DENGUE, MALARIA, TYPHOID, CHIKUNGUNYA)',
    shortName: 'Acute Fever Profile',
    department: 'Serology & Microbiology',
    category: 'INFECTIOUS_SEROLOGY',
    specimen: 'Serum & EDTA Blood (2.5 mL each)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Comprehensive acute pyrexia of unknown origin (PUO) screen.',
    parameters: [
      { id: '1', code: 'DENG_NS1', name: 'Dengue NS1 Early Antigen', unit: 'qualitative', referenceRange: 'NON-REACTIVE', defaultValue: 'NON-REACTIVE', flag: 'NORMAL' },
      { id: '2', code: 'DENG_IGM', name: 'Dengue IgM Antibodies', unit: 'qualitative', referenceRange: 'NON-REACTIVE', defaultValue: 'NON-REACTIVE', flag: 'NORMAL' },
      { id: '3', code: 'DENG_IGG', name: 'Dengue IgG Antibodies', unit: 'qualitative', referenceRange: 'NON-REACTIVE', defaultValue: 'NON-REACTIVE', flag: 'NORMAL' },
      { id: '4', code: 'MAL_PF', name: 'Malaria Rapid Card (P. falciparum HRP-2)', unit: 'qualitative', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '5', code: 'MAL_PV', name: 'Malaria Rapid Card (P. vivax pLDH)', unit: 'qualitative', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '6', code: 'TYPHI_IGM', name: 'Typhidot IgM (Salmonella typhi)', unit: 'qualitative', referenceRange: 'NON-REACTIVE', defaultValue: 'NON-REACTIVE', flag: 'NORMAL' },
      { id: '7', code: 'CHIK_IGM', name: 'Chikungunya IgM Antibodies', unit: 'qualitative', referenceRange: 'NON-REACTIVE', defaultValue: 'NON-REACTIVE', flag: 'NORMAL' }
    ]
  },
  DENGUE_SEROLOGY: {
    key: 'DENGUE_SEROLOGY',
    name: 'DENGUE DUO PROFILE (NS1 ANTIGEN + IgM & IgG ANTIBODIES)',
    shortName: 'Dengue Duo (NS1 + IgM + IgG)',
    department: 'Serology & Infectious Diseases',
    category: 'INFECTIOUS_SEROLOGY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'NS1 detectable from Day 1 to Day 5; IgM/IgG from Day 4 onwards.',
    parameters: [
      { id: '1', code: 'DENG_NS1', name: 'Dengue NS1 Antigen (Immunochromatography)', unit: 'qualitative', referenceRange: 'NON-REACTIVE / NEGATIVE', defaultValue: 'NON-REACTIVE', flag: 'NORMAL' },
      { id: '2', code: 'DENG_IGM', name: 'Dengue IgM Antibodies (Primary Infection)', unit: 'qualitative', referenceRange: 'NON-REACTIVE / NEGATIVE', defaultValue: 'NON-REACTIVE', flag: 'NORMAL' },
      { id: '3', code: 'DENG_IGG', name: 'Dengue IgG Antibodies (Secondary Infection)', unit: 'qualitative', referenceRange: 'NON-REACTIVE / NEGATIVE', defaultValue: 'NON-REACTIVE', flag: 'NORMAL' }
    ]
  },
  TYPHOID_WIDAL: {
    key: 'TYPHOID_WIDAL',
    name: 'TYPHOID WIDAL AGGLUTINATION TITER & TYPHIDOT IgM',
    shortName: 'Widal & Typhidot Profile',
    department: 'Serology & Enteric Diseases',
    category: 'INFECTIOUS_SEROLOGY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Tube / Slide Agglutination for Salmonella enteric fever.',
    parameters: [
      { id: '1', code: 'WIDAL_TO', name: 'Salmonella typhi "O" Antigen Titer', unit: 'titer', referenceRange: '< 1:80 (Negative) / >= 1:160 (Diagnostic)', defaultValue: '< 1:80', flag: 'NORMAL' },
      { id: '2', code: 'WIDAL_TH', name: 'Salmonella typhi "H" Antigen Titer', unit: 'titer', referenceRange: '< 1:80 (Negative) / >= 1:160 (Diagnostic)', defaultValue: '< 1:80', flag: 'NORMAL' },
      { id: '3', code: 'WIDAL_AH', name: 'Salmonella paratyphi "AH" Titer', unit: 'titer', referenceRange: '< 1:80 (Negative)', defaultValue: '< 1:80', flag: 'NORMAL' },
      { id: '4', code: 'WIDAL_BH', name: 'Salmonella paratyphi "BH" Titer', unit: 'titer', referenceRange: '< 1:80 (Negative)', defaultValue: '< 1:80', flag: 'NORMAL' },
      { id: '5', code: 'TYPHIDOT_IGM', name: 'Typhidot IgM Rapid Card', unit: 'qualitative', referenceRange: 'NON-REACTIVE', defaultValue: 'NON-REACTIVE', flag: 'NORMAL' }
    ]
  },
  MALARIA_ANTIGEN: {
    key: 'MALARIA_ANTIGEN',
    name: 'MALARIA DUAL ANTIGEN (Pf / Pv) & PERIPHERAL SMEAR FOR MP',
    shortName: 'Malaria Antigen & Smear (MP)',
    department: 'Serology & Parasitology',
    category: 'INFECTIOUS_SEROLOGY',
    specimen: 'EDTA Whole Blood (2.0 mL)',
    tubeType: 'EDTA_LAVENDER',
    tubeLabel: '💜 EDTA Lavender',
    tubeColorHex: '#A855F7',
    fastingRequired: false,
    preparation: 'STAT blood draw during fever spike for optimal parasite detection.',
    parameters: [
      { id: '1', code: 'MAL_PF_AG', name: 'P. falciparum Specific Antigen (HRP-2)', unit: 'antigen', referenceRange: 'NEGATIVE / NON-REACTIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '2', code: 'MAL_PV_AG', name: 'P. vivax / Pan Malaria Antigen (pLDH)', unit: 'antigen', referenceRange: 'NEGATIVE / NON-REACTIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '3', code: 'MP_SMEAR', name: 'Blood Smear for Malarial Parasites (Thick & Thin)', unit: 'microscopy', referenceRange: 'NO PARASITES DETECTED', defaultValue: 'NO MALARIAL PARASITES SEEN', flag: 'NORMAL' }
    ]
  },
  VIRAL_HEPATITIS: {
    key: 'VIRAL_HEPATITIS',
    name: 'VIRAL HEPATITIS SCREENING PANEL (HBsAg, HCV, HAV & HEV)',
    shortName: 'Viral Hepatitis Screen',
    department: 'Serology & Infectious Diseases',
    category: 'INFECTIOUS_SEROLOGY',
    specimen: 'Serum (3.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Standard ELISA / Chemiluminescence immunoassay.',
    parameters: [
      { id: '1', code: 'HBSAG', name: 'Hepatitis B Surface Antigen (HBsAg - CLIA)', unit: 'S/CO', referenceRange: '< 0.90 (Non-Reactive)', defaultValue: '0.12 (Non-Reactive)', flag: 'NORMAL' },
      { id: '2', code: 'ANTI_HCV', name: 'Hepatitis C Total Antibodies (Anti-HCV)', unit: 'S/CO', referenceRange: '< 0.90 (Non-Reactive)', defaultValue: '0.18 (Non-Reactive)', flag: 'NORMAL' },
      { id: '3', code: 'HAV_IGM', name: 'Hepatitis A Virus IgM (HAV-IgM)', unit: 'qualitative', referenceRange: 'NON-REACTIVE', defaultValue: 'NON-REACTIVE', flag: 'NORMAL' },
      { id: '4', code: 'HEV_IGM', name: 'Hepatitis E Virus IgM (HEV-IgM)', unit: 'qualitative', referenceRange: 'NON-REACTIVE', defaultValue: 'NON-REACTIVE', flag: 'NORMAL' }
    ]
  },
  HBSAG: {
    key: 'HBSAG',
    name: 'HEPATITIS B SURFACE ANTIGEN (HBsAg - AUSTRALIA ANTIGEN)',
    shortName: 'HBsAg Rapid / CLIA',
    department: 'Serology & Viral Diagnostics',
    category: 'INFECTIOUS_SEROLOGY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Mandatory pre-operative and blood donation viral screening.',
    parameters: [
      { id: '1', code: 'HBSAG_VAL', name: 'HBsAg (Chemiluminescent Immunoassay)', unit: 'S/CO', referenceRange: '< 0.90 (Non-Reactive) / >= 1.00 (Reactive)', defaultValue: '0.15 (Non-Reactive)', flag: 'NORMAL' },
      { id: '2', code: 'HBSAG_RAPID', name: 'HBsAg Rapid Immunochromatographic Card', unit: 'qualitative', referenceRange: 'NON-REACTIVE', defaultValue: 'NON-REACTIVE', flag: 'NORMAL' }
    ]
  },
  HCV_ANTIBODY: {
    key: 'HCV_ANTIBODY',
    name: 'HEPATITIS C VIRUS ANTIBODIES (ANTI-HCV TOTAL CLIA)',
    shortName: 'Anti-HCV Antibody',
    department: 'Serology & Viral Diagnostics',
    category: 'INFECTIOUS_SEROLOGY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Pre-operative and chronic liver disease screening.',
    parameters: [
      { id: '1', code: 'HCV_VAL', name: 'Hepatitis C Total Antibodies (Anti-HCV)', unit: 'S/CO', referenceRange: '< 0.90 (Non-Reactive) / >= 1.00 (Reactive)', defaultValue: '0.22 (Non-Reactive)', flag: 'NORMAL' }
    ]
  },
  HIV_DUO: {
    key: 'HIV_DUO',
    name: 'HIV 1 & 2 4TH GENERATION COMBO (p24 ANTIGEN + ANTIBODIES BY CLIA)',
    shortName: 'HIV 1 & 2 4th Gen Duo',
    department: 'Serology & Infectious Diseases',
    category: 'INFECTIOUS_SEROLOGY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Informed pre-test counseling. Detects p24 antigen as early as 2 weeks post-exposure.',
    parameters: [
      { id: '1', code: 'HIV_4TH', name: 'HIV 1 & 2 (p24 Antigen + Antibodies by CLIA)', unit: 'index', referenceRange: '< 0.90 (Non-Reactive) / >= 1.00 (Reactive)', defaultValue: '0.15 (Non-Reactive)', flag: 'NORMAL' },
      { id: '2', code: 'HIV_RAPID', name: 'HIV 1 & 2 Tri-line Rapid Card Screen', unit: 'qualitative', referenceRange: 'NON-REACTIVE', defaultValue: 'NON-REACTIVE', flag: 'NORMAL' }
    ]
  },
  SYPHILIS_VDRL: {
    key: 'SYPHILIS_VDRL',
    name: 'SYPHILIS SEROLOGY (VDRL / RPR FLOCULATION & TPHA SCREEN)',
    shortName: 'Syphilis (VDRL / RPR & TPHA)',
    department: 'Serology & STD Diagnostics',
    category: 'INFECTIOUS_SEROLOGY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Routine antenatal, pre-employment, and sexual health screening.',
    parameters: [
      { id: '1', code: 'VDRL_RPR', name: 'VDRL / RPR Flocculation Test', unit: 'qualitative', referenceRange: 'NON-REACTIVE', defaultValue: 'NON-REACTIVE', flag: 'NORMAL' },
      { id: '2', code: 'VDRL_TITER', name: 'VDRL Titer (if reactive)', unit: 'titer', referenceRange: 'Non-Reactive (< 1:2)', defaultValue: 'Non-Reactive (< 1:2)', flag: 'NORMAL' },
      { id: '3', code: 'TPHA_TREP', name: 'Treponema Pallidum Hemagglutination (TPHA)', unit: 'qualitative', referenceRange: 'NON-REACTIVE', defaultValue: 'NON-REACTIVE', flag: 'NORMAL' }
    ]
  },
  CHIKUNGUNYA: {
    key: 'CHIKUNGUNYA',
    name: 'CHIKUNGUNYA IgM ANTIBODIES (ELISA / RAPID)',
    shortName: 'Chikungunya IgM',
    department: 'Serology & Vector-Borne Diseases',
    category: 'INFECTIOUS_SEROLOGY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Acute polyarthralgia and fever workup after mosquito bite.',
    parameters: [
      { id: '1', code: 'CHIK_IGM_VAL', name: 'Chikungunya IgM Antibodies (Capture ELISA)', unit: 'ratio', referenceRange: '< 0.90 (Negative) / >= 1.10 (Positive)', defaultValue: '0.24 (Negative)', flag: 'NORMAL' }
    ]
  },
  SCRUB_TYPHUS_LEPTO: {
    key: 'SCRUB_TYPHUS_LEPTO',
    name: 'MONSOON & ZOONOTIC FEVER PANEL (SCRUB TYPHUS & LEPTOSPIRA IgM)',
    shortName: 'Scrub Typhus & Leptospira IgM',
    department: 'Serology & Tropical Infections',
    category: 'INFECTIOUS_SEROLOGY',
    specimen: 'Serum (2.5 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Post-flood / agricultural fever with myalgia or eschar.',
    parameters: [
      { id: '1', code: 'SCRUB_IGM', name: 'Scrub Typhus (Orientia tsutsugamushi) IgM', unit: 'qualitative', referenceRange: 'NON-REACTIVE', defaultValue: 'NON-REACTIVE', flag: 'NORMAL' },
      { id: '2', code: 'LEPTO_IGM', name: 'Leptospira IgM Antibodies (Leptospirosis)', unit: 'qualitative', referenceRange: 'NON-REACTIVE', defaultValue: 'NON-REACTIVE', flag: 'NORMAL' }
    ]
  },
  TORCH_PROFILE: {
    key: 'TORCH_PROFILE',
    name: 'TORCH 10-PARAMETER INFECTION PANEL (IgM & IgG COMPLETE)',
    shortName: 'TORCH 10 Panel',
    department: 'Serology & Prenatal Infections',
    category: 'INFECTIOUS_SEROLOGY',
    specimen: 'Serum (3.5 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Pre-conceptional and recurrent abortion evaluation.',
    parameters: [
      { id: '1', code: 'TOXO_IGM', name: 'Toxoplasma gondii IgM', unit: 'index', referenceRange: '< 0.80 (Negative)', defaultValue: '0.14 (Negative)', flag: 'NORMAL' },
      { id: '2', code: 'TOXO_IGG', name: 'Toxoplasma gondii IgG', unit: 'IU/mL', referenceRange: '< 1.6 (Negative)', defaultValue: '0.4 (Negative)', flag: 'NORMAL' },
      { id: '3', code: 'RUB_IGM', name: 'Rubella Virus IgM', unit: 'index', referenceRange: '< 0.80 (Negative)', defaultValue: '0.12 (Negative)', flag: 'NORMAL' },
      { id: '4', code: 'RUB_IGG', name: 'Rubella Virus IgG (Immunity Marker)', unit: 'IU/mL', referenceRange: '>= 10.0 (Immune)', defaultValue: '45.0 (Immune)', flag: 'NORMAL' },
      { id: '5', code: 'CMV_IGM', name: 'Cytomegalovirus (CMV) IgM', unit: 'index', referenceRange: '< 0.70 (Negative)', defaultValue: '0.18 (Negative)', flag: 'NORMAL' },
      { id: '6', code: 'CMV_IGG', name: 'Cytomegalovirus (CMV) IgG', unit: 'AU/mL', referenceRange: '< 6.0 (Negative)', defaultValue: '2.5 (Negative)', flag: 'NORMAL' },
      { id: '7', code: 'HSV1_IGM', name: 'Herpes Simplex Virus 1 (HSV-1) IgM', unit: 'index', referenceRange: '< 0.90 (Negative)', defaultValue: '0.22 (Negative)', flag: 'NORMAL' },
      { id: '8', code: 'HSV1_IGG', name: 'Herpes Simplex Virus 1 (HSV-1) IgG', unit: 'index', referenceRange: '< 0.90 (Negative)', defaultValue: '0.34 (Negative)', flag: 'NORMAL' },
      { id: '9', code: 'HSV2_IGM', name: 'Herpes Simplex Virus 2 (HSV-2) IgM', unit: 'index', referenceRange: '< 0.90 (Negative)', defaultValue: '0.15 (Negative)', flag: 'NORMAL' },
      { id: '10', code: 'HSV2_IGG', name: 'Herpes Simplex Virus 2 (HSV-2) IgG', unit: 'index', referenceRange: '< 0.90 (Negative)', defaultValue: '0.18 (Negative)', flag: 'NORMAL' }
    ]
  },

  // =========================================================================
  // 7. IMMUNOLOGY, RHEUMATOLOGY & AUTOIMMUNE
  // =========================================================================
  ARTHRITIS_PANEL: {
    key: 'ARTHRITIS_PANEL',
    name: 'RHEUMATOID ARTHRITIS & JOINT INFLAMMATION PANEL',
    shortName: 'Rheumatoid & Arthritis Panel',
    department: 'Immunology & Rheumatology',
    category: 'IMMUNOLOGY',
    specimen: 'Serum (2.5 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Autoimmune joint pain and swelling workup.',
    parameters: [
      { id: '1', code: 'RA_FACT', name: 'Rheumatoid Factor (RA Factor Quantitative)', unit: 'IU/mL', referenceRange: '< 14.0 (Negative)', defaultValue: '7.8', flag: 'NORMAL' },
      { id: '2', code: 'ANTI_CCP', name: 'Anti-Cyclic Citrullinated Peptide (Anti-CCP)', unit: 'U/mL', referenceRange: '< 17.0 (Negative) / > 17.0 (Positive)', defaultValue: '4.2', flag: 'NORMAL' },
      { id: '3', code: 'CRP_QUANT', name: 'C-Reactive Protein (CRP Quantitative)', unit: 'mg/L', referenceRange: '< 5.0 (Normal)', defaultValue: '2.1', criticalHigh: 100.0, flag: 'NORMAL' },
      { id: '4', code: 'URIC_ACID', name: 'Serum Uric Acid (Gout Screen)', unit: 'mg/dL', referenceRange: '3.5 - 7.2 (Male) / 2.6 - 6.0 (Female)', defaultValue: '5.1', flag: 'NORMAL' }
    ]
  },
  CRP_QUANT: {
    key: 'CRP_QUANT',
    name: 'C-REACTIVE PROTEIN QUANTITATIVE (CRP TURBIDIMETRY)',
    shortName: 'CRP Quantitative Only',
    department: 'Immunology & Clinical Biochemistry',
    category: 'IMMUNOLOGY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Acute phase inflammatory biomarker for infections and inflammatory flare-ups.',
    parameters: [
      { id: '1', code: 'CRP_VAL', name: 'C-Reactive Protein (Quantitative)', unit: 'mg/L', referenceRange: '< 5.0 (Normal Reference) / 10 - 50 (Mild Infection) / > 100 (Severe)', defaultValue: '2.4', criticalHigh: 100.0, flag: 'NORMAL' }
    ]
  },
  RA_FACTOR: {
    key: 'RA_FACTOR',
    name: 'RHEUMATOID FACTOR QUANTITATIVE (RF TURBIDIMETRIC)',
    shortName: 'RA Factor Quantitative',
    department: 'Immunology & Rheumatology',
    category: 'IMMUNOLOGY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Routine rheumatoid arthritis diagnostic marker.',
    parameters: [
      { id: '1', code: 'RF_VAL', name: 'Rheumatoid Factor (Quantitative)', unit: 'IU/mL', referenceRange: '< 14.0 (Negative) / >= 14.0 (Positive)', defaultValue: '8.2', flag: 'NORMAL' }
    ]
  },
  ANTI_CCP: {
    key: 'ANTI_CCP',
    name: 'ANTI-CYCLIC CITRULLINATED PEPTIDE (ANTI-CCP / ACPA)',
    shortName: 'Anti-CCP Antibodies',
    department: 'Immunology & Rheumatology',
    category: 'IMMUNOLOGY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'High-specificity marker for early erosive Rheumatoid Arthritis.',
    parameters: [
      { id: '1', code: 'ANTI_CCP_VAL', name: 'Anti-CCP Antibodies', unit: 'U/mL', referenceRange: '< 17.0 (Negative) / 17.0 - 30.0 (Equivocal) / > 30.0 (Positive)', defaultValue: '3.8', flag: 'NORMAL' }
    ]
  },
  ANA_PROFILE: {
    key: 'ANA_PROFILE',
    name: 'ANTINUCLEAR ANTIBODIES (ANA BY IFA / GOLD STANDARD)',
    shortName: 'ANA by IFA / Lupus Screen',
    department: 'Immunology & Autoimmune Serology',
    category: 'IMMUNOLOGY',
    specimen: 'Serum (2.5 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Indirect immunofluorescence assay on HEp-2 cell substrate.',
    parameters: [
      { id: '1', code: 'ANA_IFA', name: 'ANA by IFA (Titer / End-Point Dilution)', unit: 'titer', referenceRange: '< 1:100 (Negative)', defaultValue: 'Negative (< 1:100)', flag: 'NORMAL' },
      { id: '2', code: 'ANA_PATT', name: 'ANA Nuclear Fluorescence Pattern', unit: 'morphology', referenceRange: 'Negative / No Staining', defaultValue: 'No Pattern Observed', flag: 'NORMAL' },
      { id: '3', code: 'DSDNA', name: 'Anti-double stranded DNA (Anti-dsDNA)', unit: 'IU/mL', referenceRange: '< 25.0 (Negative)', defaultValue: '11.5', flag: 'NORMAL' }
    ]
  },
  ANA_17_BLOT: {
    key: 'ANA_17_BLOT',
    name: 'ANA COMPREHENSIVE 17-ANTIGEN IMMUNOBLOT PROFILE (LINE IMMUNOASSAY)',
    shortName: 'ANA 17-Antigen Blot',
    department: 'Immunology & Autoimmune Serology',
    category: 'IMMUNOLOGY',
    specimen: 'Serum (3.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Differentiation of Systemic Lupus Erythematosus, Sjogren, Scleroderma, MCTD, Myositis.',
    parameters: [
      { id: '1', code: 'BLOT_RNP', name: 'nRNP / Sm', unit: 'blot', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '2', code: 'BLOT_SM', name: 'Sm (Smith Antigen)', unit: 'blot', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '3', code: 'BLOT_SSA', name: 'SS-A / Ro60 Native', unit: 'blot', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '4', code: 'BLOT_RO52', name: 'Ro-52 Recombinant', unit: 'blot', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '5', code: 'BLOT_SSB', name: 'SS-B / La', unit: 'blot', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '6', code: 'BLOT_SCL70', name: 'Scl-70 (Topoisomerase I)', unit: 'blot', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '7', code: 'BLOT_PMSCL', name: 'PM-Scl', unit: 'blot', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '8', code: 'BLOT_JO1', name: 'Jo-1 (Histidyl-tRNA synthetase)', unit: 'blot', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '9', code: 'BLOT_CENTB', name: 'Centromere B (CENP-B)', unit: 'blot', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '10', code: 'BLOT_PCNA', name: 'PCNA (Proliferating Cell Nuclear Antigen)', unit: 'blot', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '11', code: 'BLOT_DSDNA', name: 'dsDNA (Double-Stranded DNA)', unit: 'blot', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '12', code: 'BLOT_NUCL', name: 'Nucleosomes', unit: 'blot', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '13', code: 'BLOT_HIST', name: 'Histones', unit: 'blot', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '14', code: 'BLOT_RIBP', name: 'Ribosomal P-Protein', unit: 'blot', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '15', code: 'BLOT_AMAM2', name: 'AMA-M2 (Mitochondrial M2)', unit: 'blot', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '16', code: 'BLOT_DFS70', name: 'DFS70 (Dense Fine Speckled 70)', unit: 'blot', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' }
    ]
  },
  ASO_TITER: {
    key: 'ASO_TITER',
    name: 'ANTI-STREPTOLYSIN O (ASO TITER QUANTITATIVE)',
    shortName: 'ASO Titer Quantitative',
    department: 'Immunology & Clinical Serology',
    category: 'IMMUNOLOGY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Post-streptococcal glomerulonephritis and rheumatic fever workup.',
    parameters: [
      { id: '1', code: 'ASO_VAL', name: 'ASO Titer (Quantitative Turbidimetry)', unit: 'IU/mL', referenceRange: '< 200 (Adult) / < 150 (Child)', defaultValue: '84', criticalHigh: 800, flag: 'NORMAL' }
    ]
  },
  HLA_B27: {
    key: 'HLA_B27',
    name: 'HLA-B27 ANKYLOSING SPONDYLITIS (FLOW CYTOMETRY / PCR)',
    shortName: 'HLA-B27 Spondylitis Screen',
    department: 'Immunology & Molecular Pathology',
    category: 'IMMUNOLOGY',
    specimen: 'EDTA Whole Blood (3.0 mL)',
    tubeType: 'EDTA_LAVENDER',
    tubeLabel: '💜 EDTA Lavender',
    tubeColorHex: '#A855F7',
    fastingRequired: false,
    preparation: 'Evaluation of ankylosing spondylitis, sacroliitis, and reactive arthritis.',
    parameters: [
      { id: '1', code: 'HLAB27_STATUS', name: 'HLA-B27 Antigen Status', unit: 'phenotyping', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '2', code: 'HLAB27_METHOD', name: 'Assay Methodology', unit: 'technology', referenceRange: 'Flow Cytometry / Real-Time PCR', defaultValue: 'Flow Cytometry (Specific monoclonal antibody)', flag: 'NORMAL' }
    ]
  },
  IGE_TOTAL: {
    key: 'IGE_TOTAL',
    name: 'IMMUNOGLOBULIN E TOTAL (SERUM IgE ALLERGY BIOMARKER)',
    shortName: 'Total Serum IgE',
    department: 'Immunology & Allergy Diagnostics',
    category: 'IMMUNOLOGY',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Atopic dermatitis, allergic rhinitis, bronchial asthma, and helminthic infection workup.',
    parameters: [
      { id: '1', code: 'IGE_VAL', name: 'Total Serum IgE', unit: 'IU/mL', referenceRange: '< 100 (Normal Non-Atopic) / > 150 (Atopic Diathesis)', defaultValue: '45.0', criticalHigh: 1000.0, flag: 'NORMAL' }
    ]
  },
  CELIAC_SCREEN: {
    key: 'CELIAC_SCREEN',
    name: 'CELIAC DISEASE SCREEN (ANTI-tTG IgA & TOTAL SERUM IgA)',
    shortName: 'Celiac Screen (tTG-IgA)',
    department: 'Immunology & Gastroenterology',
    category: 'IMMUNOLOGY',
    specimen: 'Serum (2.5 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Patient must be on a gluten-containing diet prior to blood test.',
    parameters: [
      { id: '1', code: 'TTG_IGA', name: 'Anti-Tissue Transglutaminase IgA (tTG-IgA)', unit: 'U/mL', referenceRange: '< 10.0 (Negative) / >= 10.0 (Positive)', defaultValue: '2.4', flag: 'NORMAL' },
      { id: '2', code: 'TOTAL_IGA', name: 'Total Serum IgA (Rule out IgA deficiency)', unit: 'mg/dL', referenceRange: '70 - 400', defaultValue: '185', flag: 'NORMAL' }
    ]
  },

  // =========================================================================
  // 8. TUMOR & ONCOLOGY BIOMARKERS
  // =========================================================================
  TUMOR_MALE: {
    key: 'TUMOR_MALE',
    name: 'PROSTATE & MALE ONCOLOGY SCREEN (TOTAL & FREE PSA + CEA)',
    shortName: 'PSA Total & Free PSA',
    department: 'Oncology & Immunochemistry',
    category: 'TUMOR_MARKERS',
    specimen: 'Serum (2.5 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Avoid digital rectal exam, cycling, or sexual activity 48h prior.',
    parameters: [
      { id: '1', code: 'PSA_TOT', name: 'Prostate Specific Antigen (PSA Total)', unit: 'ng/mL', referenceRange: '< 4.0 (Normal) / 4.0 - 10.0 (Borderline)', defaultValue: '1.24', criticalHigh: 20.0, flag: 'NORMAL' },
      { id: '2', code: 'PSA_FREE', name: 'Free PSA', unit: 'ng/mL', referenceRange: '0.10 - 0.80', defaultValue: '0.38', flag: 'NORMAL' },
      { id: '3', code: 'PSA_RATIO', name: 'Free / Total PSA Percentage Ratio', unit: '%', referenceRange: '> 25.0% (Low Malignancy Probability)', defaultValue: '30.6%', flag: 'NORMAL' },
      { id: '4', code: 'CEA', name: 'Carcinoembryonic Antigen (CEA - Colorectal)', unit: 'ng/mL', referenceRange: '< 3.0 (Non-Smoker) / < 5.0 (Smoker)', defaultValue: '1.8', flag: 'NORMAL' }
    ]
  },
  TUMOR_FEMALE: {
    key: 'TUMOR_FEMALE',
    name: 'FEMALE ONCOLOGY BIOMARKERS (CA-125, CA 15-3, CEA & AFP)',
    shortName: 'CA-125, CA 15-3 & CEA',
    department: 'Oncology & Immunochemistry',
    category: 'TUMOR_MARKERS',
    specimen: 'Serum (3.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Monitoring ovarian, breast, and gastrointestinal neoplasms.',
    parameters: [
      { id: '1', code: 'CA_125', name: 'CA-125 (Ovarian Cancer Biomarker)', unit: 'U/mL', referenceRange: '< 35.0', defaultValue: '14.2', criticalHigh: 150.0, flag: 'NORMAL' },
      { id: '2', code: 'CA_153', name: 'CA 15-3 (Breast Neoplasm Biomarker)', unit: 'U/mL', referenceRange: '< 30.0', defaultValue: '16.5', criticalHigh: 100.0, flag: 'NORMAL' },
      { id: '3', code: 'CEA', name: 'Carcinoembryonic Antigen (CEA)', unit: 'ng/mL', referenceRange: '< 3.0', defaultValue: '1.4', flag: 'NORMAL' },
      { id: '4', code: 'AFP', name: 'Alpha-Fetoprotein (AFP - Hepatic/Germ Cell)', unit: 'ng/mL', referenceRange: '< 7.0', defaultValue: '2.8', criticalHigh: 100.0, flag: 'NORMAL' }
    ]
  },
  PSA_TOTAL_FREE: {
    key: 'PSA_TOTAL_FREE',
    name: 'PROSTATE SPECIFIC ANTIGEN DUO (TOTAL & FREE PSA)',
    shortName: 'PSA Total & Free Ratio',
    department: 'Oncology & Urological Pathology',
    category: 'TUMOR_MARKERS',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Prostate cancer screening in men > 50 years (or > 45 with family history).',
    parameters: [
      { id: '1', code: 'PSA_TOTAL', name: 'Total PSA', unit: 'ng/mL', referenceRange: '< 4.0 (Normal) / 4.0 - 10.0 (Diagnostic Gray Zone)', defaultValue: '1.45', criticalHigh: 20.0, flag: 'NORMAL' },
      { id: '2', code: 'PSA_FREE', name: 'Free PSA', unit: 'ng/mL', referenceRange: '0.10 - 0.80', defaultValue: '0.42', flag: 'NORMAL' },
      { id: '3', code: 'PSA_PERCENT_FREE', name: 'Free / Total PSA Ratio', unit: '%', referenceRange: '> 25% (Favor Benign Prostatic Hyperplasia)', defaultValue: '28.9%', flag: 'NORMAL' }
    ]
  },
  CA_125: {
    key: 'CA_125',
    name: 'CA-125 (OVARIAN & PERITONEAL CANCER BIOMARKER)',
    shortName: 'CA-125 Biomarker',
    department: 'Oncology & Immunochemistry',
    category: 'TUMOR_MARKERS',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Ovarian epithelial carcinoma workup and pelvic mass evaluation.',
    parameters: [
      { id: '1', code: 'CA_125_VAL', name: 'Cancer Antigen 125 (CA-125)', unit: 'U/mL', referenceRange: '< 35.0', defaultValue: '12.8', criticalHigh: 150.0, flag: 'NORMAL' }
    ]
  },
  CA_19_9: {
    key: 'CA_19_9',
    name: 'CA 19-9 (PANCREATIC & GASTROINTESTINAL MALIGNANCY MARKER)',
    shortName: 'CA 19-9 (Pancreatic / GI)',
    department: 'Oncology & Immunochemistry',
    category: 'TUMOR_MARKERS',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Pancreatic ductal adenocarcinoma and cholangiocarcinoma surveillance.',
    parameters: [
      { id: '1', code: 'CA_199_VAL', name: 'Carbohydrate Antigen 19-9 (CA 19-9)', unit: 'U/mL', referenceRange: '< 37.0', defaultValue: '14.6', criticalHigh: 200.0, flag: 'NORMAL' }
    ]
  },
  CA_15_3: {
    key: 'CA_15_3',
    name: 'CA 15-3 (BREAST CARCINOMA SURVEILLANCE BIOMARKER)',
    shortName: 'CA 15-3 (Breast Cancer)',
    department: 'Oncology & Immunochemistry',
    category: 'TUMOR_MARKERS',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Therapeutic monitoring and recurrence detection in breast cancer.',
    parameters: [
      { id: '1', code: 'CA_153_VAL', name: 'Cancer Antigen 15-3 (CA 15-3)', unit: 'U/mL', referenceRange: '< 30.0', defaultValue: '15.2', criticalHigh: 100.0, flag: 'NORMAL' }
    ]
  },
  CEA: {
    key: 'CEA',
    name: 'CARCINOEMBRYONIC ANTIGEN (CEA - COLORECTAL & GI ONCOLOGY)',
    shortName: 'CEA (Colorectal Tumor)',
    department: 'Oncology & Immunochemistry',
    category: 'TUMOR_MARKERS',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Colorectal carcinoma staging, resection margin, and recurrence monitor.',
    parameters: [
      { id: '1', code: 'CEA_VAL', name: 'Carcinoembryonic Antigen (CEA)', unit: 'ng/mL', referenceRange: '< 3.0 (Non-Smoker) / < 5.0 (Smoker)', defaultValue: '1.45', criticalHigh: 20.0, flag: 'NORMAL' }
    ]
  },
  AFP: {
    key: 'AFP',
    name: 'ALPHA-FETOPROTEIN (AFP - HEPATOMA & GERM CELL ONCOLOGY)',
    shortName: 'AFP (Hepatoma / Germ Cell)',
    department: 'Oncology & Immunochemistry',
    category: 'TUMOR_MARKERS',
    specimen: 'Serum (2.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: false,
    preparation: 'Hepatocellular carcinoma (HCC) and non-seminomatous testicular tumor monitoring.',
    parameters: [
      { id: '1', code: 'AFP_VAL', name: 'Alpha-Fetoprotein (AFP)', unit: 'ng/mL', referenceRange: '< 7.0 (Normal Adult) / > 200 (Suggestive of HCC)', defaultValue: '2.6', criticalHigh: 100.0, flag: 'NORMAL' }
    ]
  },
  SPEP: {
    key: 'SPEP',
    name: 'SERUM PROTEIN ELECTROPHORESIS (SPEP WITH M-BAND DETECTION)',
    shortName: 'Serum Protein Electrophoresis (SPEP)',
    department: 'Immunochemistry & Hematology',
    category: 'TUMOR_MARKERS',
    specimen: 'Serum Fasting (3.0 mL)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 SST Gold/Red',
    tubeColorHex: '#EF4444',
    fastingRequired: true,
    preparation: 'Agarose gel / Capillary zone electrophoresis for Multiple Myeloma and paraproteinemia.',
    parameters: [
      { id: '1', code: 'SPEP_TP', name: 'Total Protein', unit: 'g/dL', referenceRange: '6.4 - 8.3', defaultValue: '7.1', flag: 'NORMAL' },
      { id: '2', code: 'SPEP_ALB', name: 'Albumin Fraction', unit: '%', referenceRange: '52.0 - 68.0', defaultValue: '60.4', flag: 'NORMAL' },
      { id: '3', code: 'SPEP_A1', name: 'Alpha-1 Globulin', unit: '%', referenceRange: '2.0 - 5.0', defaultValue: '3.2', flag: 'NORMAL' },
      { id: '4', code: 'SPEP_A2', name: 'Alpha-2 Globulin', unit: '%', referenceRange: '6.0 - 13.0', defaultValue: '9.4', flag: 'NORMAL' },
      { id: '5', code: 'SPEP_BETA', name: 'Beta Globulin (Beta 1 + 2)', unit: '%', referenceRange: '8.0 - 15.0', defaultValue: '11.2', flag: 'NORMAL' },
      { id: '6', code: 'SPEP_GAMMA', name: 'Gamma Globulin', unit: '%', referenceRange: '10.0 - 21.0', defaultValue: '15.8', flag: 'NORMAL' },
      { id: '7', code: 'SPEP_MSPIKE', name: 'M-Band / Monoclonal Paraprotein Spike', unit: 'morphology', referenceRange: 'ABSENT / NOT DETECTED', defaultValue: 'ABSENT', flag: 'NORMAL' },
      { id: '8', code: 'SPEP_IMPR', name: 'Electrophoresis Impression', unit: 'clinical', referenceRange: 'Normal Pattern', defaultValue: 'Normal electrophoretic protein pattern. No discrete monoclonal spike seen.', flag: 'NORMAL' }
    ]
  },

  // =========================================================================
  // 9. PREVENTIVE HEALTH, MASTER CHECKUP & SURGICAL CLEARANCE BLOOD PANELS
  // =========================================================================
  MASTER_HEALTH_CHECK: {
    key: 'MASTER_HEALTH_CHECK',
    name: 'EXECUTIVE MASTER HEALTH CHECKUP BLOOD PANEL (COMPREHENSIVE WELLNESS)',
    shortName: 'Executive Master Health Check',
    department: 'Multidisciplinary Laboratory Medicine',
    category: 'PREVENTIVE_PACKAGES',
    specimen: 'EDTA Blood, Fluoride Plasma & Serum Fasting (10.0 mL Total)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 Multi-Tube Draw',
    tubeColorHex: '#EF4444',
    fastingRequired: true,
    preparation: '10-12 hours strict overnight fasting. Comprehensive screening of all organ systems.',
    parameters: [
      { id: '1', code: 'HB', name: 'Hemoglobin (Hb)', unit: 'g/dL', referenceRange: '13.0 - 17.0', defaultValue: '14.2', flag: 'NORMAL' },
      { id: '2', code: 'WBC', name: 'Total Leukocyte Count (WBC)', unit: '/cumm', referenceRange: '4,000 - 11,000', defaultValue: '7,400', flag: 'NORMAL' },
      { id: '3', code: 'PLT', name: 'Platelet Count', unit: 'Lakhs/cumm', referenceRange: '1.50 - 4.50', defaultValue: '2.50', flag: 'NORMAL' },
      { id: '4', code: 'ESR', name: 'ESR 1st Hour', unit: 'mm/hr', referenceRange: '0 - 15', defaultValue: '10', flag: 'NORMAL' },
      { id: '5', code: 'FBS', name: 'Fasting Blood Sugar (FBS)', unit: 'mg/dL', referenceRange: '70 - 99', defaultValue: '92', flag: 'NORMAL' },
      { id: '6', code: 'HBA1C', name: 'Glycated Hemoglobin (HbA1c)', unit: '%', referenceRange: '< 5.7', defaultValue: '5.5', flag: 'NORMAL' },
      { id: '7', code: 'CHOL', name: 'Total Cholesterol', unit: 'mg/dL', referenceRange: '< 200', defaultValue: '172', flag: 'NORMAL' },
      { id: '8', code: 'TRIG', name: 'Triglycerides', unit: 'mg/dL', referenceRange: '< 150', defaultValue: '130', flag: 'NORMAL' },
      { id: '9', code: 'HDL', name: 'HDL Cholesterol', unit: 'mg/dL', referenceRange: '> 40', defaultValue: '48', flag: 'NORMAL' },
      { id: '10', code: 'LDL', name: 'LDL Cholesterol', unit: 'mg/dL', referenceRange: '< 100', defaultValue: '98', flag: 'NORMAL' },
      { id: '11', code: 'BIL_T', name: 'Bilirubin Total', unit: 'mg/dL', referenceRange: '0.2 - 1.2', defaultValue: '0.8', flag: 'NORMAL' },
      { id: '12', code: 'SGOT', name: 'SGOT / AST', unit: 'U/L', referenceRange: '10 - 40', defaultValue: '26', flag: 'NORMAL' },
      { id: '13', code: 'SGPT', name: 'SGPT / ALT', unit: 'U/L', referenceRange: '10 - 45', defaultValue: '30', flag: 'NORMAL' },
      { id: '14', code: 'ALP', name: 'Alkaline Phosphatase (ALP)', unit: 'U/L', referenceRange: '40 - 129', defaultValue: '78', flag: 'NORMAL' },
      { id: '15', code: 'UREA', name: 'Serum Urea', unit: 'mg/dL', referenceRange: '15 - 40', defaultValue: '26', flag: 'NORMAL' },
      { id: '16', code: 'CREAT', name: 'Serum Creatinine', unit: 'mg/dL', referenceRange: '0.7 - 1.3', defaultValue: '0.9', flag: 'NORMAL' },
      { id: '17', code: 'URIC', name: 'Serum Uric Acid', unit: 'mg/dL', referenceRange: '3.5 - 7.2', defaultValue: '5.0', flag: 'NORMAL' },
      { id: '18', code: 'TSH', name: 'TSH Ultrasensitive', unit: 'uIU/mL', referenceRange: '0.35 - 4.94', defaultValue: '2.20', flag: 'NORMAL' },
      { id: '19', code: 'VIT_D', name: '25-OH Vitamin D Total', unit: 'ng/mL', referenceRange: '30.0 - 100.0', defaultValue: '34.5', flag: 'NORMAL' },
      { id: '20', code: 'VIT_B12', name: 'Vitamin B12', unit: 'pg/mL', referenceRange: '211 - 911', defaultValue: '420', flag: 'NORMAL' }
    ]
  },
  PRE_OPERATIVE: {
    key: 'PRE_OPERATIVE',
    name: 'PRE-OPERATIVE SURGICAL CLEARANCE BLOOD PROFILE (PAC CLEARANCE)',
    shortName: 'Pre-Operative Clearance Panel',
    department: 'Surgical Pathology & Transfusion Medicine',
    category: 'PREVENTIVE_PACKAGES',
    specimen: 'EDTA Blood, Citrate Blood & Serum (6.0 mL Total)',
    tubeType: 'EDTA_LAVENDER',
    tubeLabel: '💜 Multi-Tube PAC',
    tubeColorHex: '#A855F7',
    fastingRequired: false,
    preparation: 'Routine pre-anesthetic clearance panel prior to elective or emergency surgery.',
    parameters: [
      { id: '1', code: 'HB', name: 'Hemoglobin (Hb)', unit: 'g/dL', referenceRange: '12.0 - 17.0', defaultValue: '13.8', flag: 'NORMAL' },
      { id: '2', code: 'WBC', name: 'Total Leukocyte Count (WBC)', unit: '/cumm', referenceRange: '4,000 - 11,000', defaultValue: '7,600', flag: 'NORMAL' },
      { id: '3', code: 'PLT', name: 'Platelet Count', unit: 'Lakhs/cumm', referenceRange: '1.50 - 4.50', defaultValue: '2.45', flag: 'NORMAL' },
      { id: '4', code: 'BLOOD_GRP', name: 'Blood Group & Rh Typing', unit: 'typing', referenceRange: 'A / B / AB / O & Rh(+/-)', defaultValue: 'B Rh Positive', flag: 'NORMAL' },
      { id: '5', code: 'PT_INR', name: 'Prothrombin Time (PT / INR)', unit: 'ratio', referenceRange: '0.85 - 1.20', defaultValue: '1.04', flag: 'NORMAL' },
      { id: '6', code: 'APTT', name: 'APTT Patient', unit: 'seconds', referenceRange: '26.0 - 38.0', defaultValue: '30.2', flag: 'NORMAL' },
      { id: '7', code: 'RBS', name: 'Random Blood Glucose', unit: 'mg/dL', referenceRange: '70 - 140', defaultValue: '112', flag: 'NORMAL' },
      { id: '8', code: 'CREAT', name: 'Serum Creatinine', unit: 'mg/dL', referenceRange: '0.7 - 1.3', defaultValue: '0.85', flag: 'NORMAL' },
      { id: '9', code: 'HIV', name: 'HIV 1 & 2 Antibody Screen', unit: 'qualitative', referenceRange: 'NON-REACTIVE', defaultValue: 'NON-REACTIVE', flag: 'NORMAL' },
      { id: '10', code: 'HBSAG', name: 'HBsAg Surface Antigen', unit: 'qualitative', referenceRange: 'NON-REACTIVE', defaultValue: 'NON-REACTIVE', flag: 'NORMAL' },
      { id: '11', code: 'HCV', name: 'Anti-HCV Total Antibodies', unit: 'qualitative', referenceRange: 'NON-REACTIVE', defaultValue: 'NON-REACTIVE', flag: 'NORMAL' }
    ]
  },
  ANTENATAL_PROFILE: {
    key: 'ANTENATAL_PROFILE',
    name: 'ANTENATAL CARE (ANC) FIRST TRIMESTER ROUTINE BLOOD PROFILE',
    shortName: 'Antenatal Profile (ANC Routine)',
    department: 'Obstetric & Gynecological Pathology',
    category: 'PREVENTIVE_PACKAGES',
    specimen: 'EDTA Blood & Serum (6.0 mL Total)',
    tubeType: 'EDTA_LAVENDER',
    tubeLabel: '💜 Multi-Tube ANC',
    tubeColorHex: '#A855F7',
    fastingRequired: true,
    preparation: 'Routine booking visit panel for all pregnant mothers.',
    parameters: [
      { id: '1', code: 'HB_ANC', name: 'Hemoglobin (Hb)', unit: 'g/dL', referenceRange: '11.0 - 14.5 (Pregnancy Target >= 11.0)', defaultValue: '12.4', criticalLow: 7.0, flag: 'NORMAL' },
      { id: '2', code: 'WBC_ANC', name: 'Total Leukocyte Count (WBC)', unit: '/cumm', referenceRange: '5,000 - 14,000 (Pregnancy Range)', defaultValue: '9,200', flag: 'NORMAL' },
      { id: '3', code: 'PLT_ANC', name: 'Platelet Count', unit: 'Lakhs/cumm', referenceRange: '1.50 - 4.50', defaultValue: '2.60', flag: 'NORMAL' },
      { id: '4', code: 'GRP_ANC', name: 'ABO & RhD Blood Group', unit: 'typing', referenceRange: 'Documented Typing', defaultValue: 'O Rh Positive', flag: 'NORMAL' },
      { id: '5', code: 'FBS_ANC', name: 'Fasting Blood Glucose (DIPSI / GDM Screen)', unit: 'mg/dL', referenceRange: '< 92 (Normal Gestational Fasting)', defaultValue: '84', flag: 'NORMAL' },
      { id: '6', code: 'TSH_ANC', name: 'TSH Ultrasensitive (Trimester 1 Target)', unit: 'uIU/mL', referenceRange: '0.10 - 2.50 (1st Trimester Target)', defaultValue: '1.85', flag: 'NORMAL' },
      { id: '7', code: 'HIV_ANC', name: 'HIV 1 & 2 Antibody Screen', unit: 'qualitative', referenceRange: 'NON-REACTIVE', defaultValue: 'NON-REACTIVE', flag: 'NORMAL' },
      { id: '8', code: 'HBSAG_ANC', name: 'HBsAg Rapid Screen', unit: 'qualitative', referenceRange: 'NON-REACTIVE', defaultValue: 'NON-REACTIVE', flag: 'NORMAL' },
      { id: '9', code: 'VDRL_ANC', name: 'VDRL / RPR Syphilis Screen', unit: 'qualitative', referenceRange: 'NON-REACTIVE', defaultValue: 'NON-REACTIVE', flag: 'NORMAL' }
    ]
  },
  SENIOR_CITIZEN_PANEL: {
    key: 'SENIOR_CITIZEN_PANEL',
    name: 'SENIOR CITIZEN COMPREHENSIVE GERIATRIC BLOOD PROFILE',
    shortName: 'Senior Citizen Geriatric Panel',
    department: 'Geriatric Laboratory Medicine',
    category: 'PREVENTIVE_PACKAGES',
    specimen: 'EDTA Blood, Fluoride Plasma & Serum (8.0 mL Total)',
    tubeType: 'SERUM_SST_GOLD',
    tubeLabel: '🔴 Multi-Tube Senior',
    tubeColorHex: '#EF4444',
    fastingRequired: true,
    preparation: 'Annual health audit for individuals aged 60 and above.',
    parameters: [
      { id: '1', code: 'HB', name: 'Hemoglobin (Hb)', unit: 'g/dL', referenceRange: '12.0 - 16.0', defaultValue: '13.2', flag: 'NORMAL' },
      { id: '2', code: 'ESR', name: 'ESR 1st Hour', unit: 'mm/hr', referenceRange: '0 - 25', defaultValue: '18', flag: 'NORMAL' },
      { id: '3', code: 'FBS', name: 'Fasting Blood Sugar', unit: 'mg/dL', referenceRange: '70 - 100', defaultValue: '96', flag: 'NORMAL' },
      { id: '4', code: 'HBA1C', name: 'HbA1c', unit: '%', referenceRange: '< 6.5 (Geriatric Target)', defaultValue: '5.8', flag: 'NORMAL' },
      { id: '5', code: 'CHOL', name: 'Total Cholesterol', unit: 'mg/dL', referenceRange: '< 200', defaultValue: '180', flag: 'NORMAL' },
      { id: '6', code: 'TRIG', name: 'Triglycerides', unit: 'mg/dL', referenceRange: '< 150', defaultValue: '140', flag: 'NORMAL' },
      { id: '7', code: 'CREAT', name: 'Serum Creatinine', unit: 'mg/dL', referenceRange: '0.6 - 1.2', defaultValue: '1.0', flag: 'NORMAL' },
      { id: '8', code: 'EGFR', name: 'eGFR (Calculated)', unit: 'mL/min/1.73m²', referenceRange: '> 60 (Age Adjusted)', defaultValue: '74', flag: 'NORMAL' },
      { id: '9', code: 'URIC', name: 'Serum Uric Acid', unit: 'mg/dL', referenceRange: '3.5 - 7.2', defaultValue: '5.4', flag: 'NORMAL' },
      { id: '10', code: 'ELECT_NA', name: 'Serum Sodium (Na+)', unit: 'mEq/L', referenceRange: '136 - 145', defaultValue: '139', flag: 'NORMAL' },
      { id: '11', code: 'ELECT_K', name: 'Serum Potassium (K+)', unit: 'mEq/L', referenceRange: '3.5 - 5.1', defaultValue: '4.3', flag: 'NORMAL' },
      { id: '12', code: 'HS_CRP', name: 'hs-CRP (Cardiovascular & Inflammation)', unit: 'mg/L', referenceRange: '< 3.0', defaultValue: '1.6', flag: 'NORMAL' },
      { id: '13', code: 'VIT_D', name: '25-OH Vitamin D', unit: 'ng/mL', referenceRange: '30.0 - 100.0', defaultValue: '28.5', flag: 'NORMAL' },
      { id: '14', code: 'VIT_B12', name: 'Vitamin B12', unit: 'pg/mL', referenceRange: '211 - 911', defaultValue: '360', flag: 'NORMAL' }
    ]
  },

  // =========================================================================
  // 10. CLINICAL PATHOLOGY (URINE & BODY FLUIDS)
  // =========================================================================
  URINE_ROUTINE: {
    key: 'URINE_ROUTINE',
    name: 'COMPLETE URINE ROUTINE & MICROSCOPIC EXAMINATION (U/M)',
    shortName: 'Complete Urinalysis',
    department: 'Clinical Pathology',
    category: 'CLINICAL_PATHOLOGY',
    specimen: 'Fresh Midstream Urine (20 mL)',
    tubeType: 'STERILE_CONTAINER',
    tubeLabel: '🟡 Sterile Container',
    tubeColorHex: '#EAB308',
    fastingRequired: false,
    preparation: 'Clean-catch first morning or mid-stream void in sterile container.',
    parameters: [
      { id: '1', code: 'U_COLOR', name: 'Color & Appearance', unit: 'physical', referenceRange: 'Pale Yellow, Clear', defaultValue: 'Pale Yellow, Clear', flag: 'NORMAL' },
      { id: '2', code: 'U_SG', name: 'Specific Gravity', unit: 'gravity', referenceRange: '1.010 - 1.030', defaultValue: '1.020', flag: 'NORMAL' },
      { id: '3', code: 'U_PH', name: 'Reaction (pH)', unit: 'pH', referenceRange: '5.0 - 7.5', defaultValue: '6.0', flag: 'NORMAL' },
      { id: '4', code: 'U_PROT', name: 'Chemical Protein / Albumin', unit: 'chemical', referenceRange: 'NIL / NEGATIVE', defaultValue: 'NIL', flag: 'NORMAL' },
      { id: '5', code: 'U_GLUC', name: 'Urine Glucose / Sugar', unit: 'chemical', referenceRange: 'NIL / NEGATIVE', defaultValue: 'NIL', flag: 'NORMAL' },
      { id: '6', code: 'U_KETO', name: 'Ketone Bodies', unit: 'chemical', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '7', code: 'U_BLOOD', name: 'Occult Blood', unit: 'chemical', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '8', code: 'U_LEUK', name: 'Leukocyte Esterase', unit: 'chemical', referenceRange: 'NEGATIVE', defaultValue: 'NEGATIVE', flag: 'NORMAL' },
      { id: '9', code: 'U_PUS', name: 'Pus Cells (WBCs)', unit: '/HPF', referenceRange: '0 - 5 / HPF', defaultValue: '1 - 2 / HPF', flag: 'NORMAL' },
      { id: '10', code: 'U_RBC', name: 'Red Blood Cells (RBCs)', unit: '/HPF', referenceRange: '0 - 2 / HPF', defaultValue: 'NIL', flag: 'NORMAL' },
      { id: '11', code: 'U_EPITH', name: 'Epithelial Cells', unit: '/HPF', referenceRange: '0 - 5 / HPF', defaultValue: '2 - 3 / HPF', flag: 'NORMAL' },
      { id: '12', code: 'U_CASTS', name: 'Casts & Crystals', unit: '/LPF', referenceRange: 'NIL / NOT SEEN', defaultValue: 'NOT SEEN', flag: 'NORMAL' }
    ]
  },
  SEMEN_ANALYSIS: {
    key: 'SEMEN_ANALYSIS',
    name: 'SEMEN ANALYSIS (WHO 6TH EDITION MANUAL CRITERIA)',
    shortName: 'Semen Analysis',
    department: 'Andrology & Clinical Pathology',
    category: 'CLINICAL_PATHOLOGY',
    specimen: 'Fresh Ejaculate (Sterile Container)',
    tubeType: 'STERILE_CONTAINER',
    tubeLabel: '🟡 Sterile Container',
    tubeColorHex: '#EAB308',
    fastingRequired: false,
    preparation: '3 to 5 days strict sexual abstinence prior to collection.',
    parameters: [
      { id: '1', code: 'SEM_VOL', name: 'Sample Volume', unit: 'mL', referenceRange: '>= 1.5 mL', defaultValue: '2.8 mL', flag: 'NORMAL' },
      { id: '2', code: 'SEM_PH', name: 'pH', unit: 'pH', referenceRange: '>= 7.2', defaultValue: '7.8', flag: 'NORMAL' },
      { id: '3', code: 'SEM_LIQ', name: 'Liquefaction Time', unit: 'minutes', referenceRange: '< 30 minutes', defaultValue: '20 mins', flag: 'NORMAL' },
      { id: '4', code: 'SEM_CONC', name: 'Total Sperm Concentration', unit: 'million/mL', referenceRange: '>= 15 million/mL', defaultValue: '48 million/mL', flag: 'NORMAL' },
      { id: '5', code: 'SEM_MOT_TOT', name: 'Total Motility (PR + NP)', unit: '%', referenceRange: '>= 40%', defaultValue: '62%', flag: 'NORMAL' },
      { id: '6', code: 'SEM_MOT_PROG', name: 'Progressive Motility (PR)', unit: '%', referenceRange: '>= 32%', defaultValue: '45%', flag: 'NORMAL' },
      { id: '7', code: 'SEM_MORPH', name: 'Normal Sperm Morphology (Tygerberg Kruger)', unit: '%', referenceRange: '>= 4%', defaultValue: '8%', flag: 'NORMAL' },
      { id: '8', code: 'SEM_VIT', name: 'Vitality (Live Spermatozoa)', unit: '%', referenceRange: '>= 54%', defaultValue: '74%', flag: 'NORMAL' }
    ]
  }
};

/**
 * Helper to search and filter library tests
 */
export function queryClinicalTestLibrary(category?: string, query?: string): ClinicalTestProfileDef[] {
  let list = Object.values(MASTER_CLINICAL_TEST_LIBRARY);
  if (category && category !== 'ALL') {
    list = list.filter((t) => t.category === category);
  }
  if (query && query.trim()) {
    const q = query.toLowerCase();
    list = list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.shortName.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q) ||
        t.parameters.some((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
    );
  }
  return list;
}

/**
 * Automatically resolve gender-specific biological reference intervals and normal values
 * Conforming to NABL ISO 15189:2022 clinical diagnostic laboratory standards.
 */
export function resolveGenderSpecificParameter(
  param: ClinicalParameterDef,
  gender: string
): { value: string; referenceRange: string; flag: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' } {
  const g = (gender || '').trim().toUpperCase();
  const isFemale = g.startsWith('F');
  const isMale = g.startsWith('M');

  let value = param.defaultValue;
  let referenceRange = param.referenceRange;

  // 1. Explicit range/default value overrides if configured
  if (isFemale) {
    if (param.femaleRange) referenceRange = param.femaleRange;
    if (param.defaultFemaleValue) value = param.defaultFemaleValue;
  } else if (isMale) {
    if (param.maleRange) referenceRange = param.maleRange;
    if (param.defaultMaleValue) value = param.defaultMaleValue;
  }

  // 2. Intelligent pattern extraction if combined range (e.g. "13.0 - 17.0 (M) / 12.0 - 15.5 (F)")
  const hasGenderInString = /\((?:M|Male)\)/i.test(referenceRange) && /\((?:F|Female)\)/i.test(referenceRange);
  if (hasGenderInString) {
    if (isFemale) {
      const femaleMatch = referenceRange.match(/(?:^|\/)\s*([0-9.<>\s-]+)\s*\((?:Female|F)\)/i)
        || referenceRange.match(/\((?:Female|F)\)\s*([0-9.<>\s-]+)/i)
        || referenceRange.match(/\/\s*([0-9.<>\s-]+)\s*(?:\(F|\(Female|$)/i);
      if (femaleMatch && femaleMatch[1]) {
        referenceRange = femaleMatch[1].trim();
      }
    } else if (isMale) {
      const maleMatch = referenceRange.match(/([0-9.<>\s-]+)\s*\((?:Male|M)\)/i)
        || referenceRange.match(/\((?:Male|M)\)\s*([0-9.<>\s-]+)/i)
        || referenceRange.match(/^([0-9.<>\s-]+)\s*(?:\(M|\(Male)/i);
      if (maleMatch && maleMatch[1]) {
        referenceRange = maleMatch[1].trim();
      }
    }
  }

  // 3. Clinical Standard Biological Norms by Analyte
  const code = (param.code || '').toUpperCase();
  const name = (param.name || '').toLowerCase();

  if (isFemale) {
    if (code === 'HB' || code === 'HB_ANC' || name.includes('hemoglobin') || name.includes('haemoglobin')) {
      if (!param.defaultFemaleValue) value = '13.2';
      if (!param.femaleRange && !hasGenderInString) referenceRange = '12.0 - 15.5';
    } else if (code === 'RBC' || name.includes('red blood cell')) {
      if (!param.defaultFemaleValue) value = '4.50';
      if (!param.femaleRange && !hasGenderInString) referenceRange = '4.00 - 5.00';
    } else if (code === 'PCV' || name.includes('hematocrit') || name.includes('packed cell')) {
      if (!param.defaultFemaleValue) value = '40.5';
      if (!param.femaleRange && !hasGenderInString) referenceRange = '36.0 - 46.0';
    } else if (code.includes('ESR') || name.includes('erythrocyte sedimentation')) {
      if (!param.defaultFemaleValue) value = '12';
      if (!param.femaleRange && !hasGenderInString) referenceRange = '0 - 20';
    } else if (code === 'CREAT' || name.includes('creatinine')) {
      if (!param.defaultFemaleValue) value = '0.80';
      if (!param.femaleRange && !hasGenderInString) referenceRange = '0.50 - 1.10';
    } else if (code === 'URIC' || code === 'URIC_ACID' || name.includes('uric acid')) {
      if (!param.defaultFemaleValue) value = '4.2';
      if (!param.femaleRange && !hasGenderInString) referenceRange = '2.6 - 6.0';
    } else if (code === 'GGT' || name.includes('glutamyl')) {
      if (!param.defaultFemaleValue) value = '20';
      if (!param.femaleRange && !hasGenderInString) referenceRange = '08 - 38';
    } else if (code === 'FERRITIN' || code === 'FERRITIN_VAL' || name.includes('ferritin')) {
      if (!param.defaultFemaleValue) value = '45';
      if (!param.femaleRange && !hasGenderInString) referenceRange = '13 - 150';
    } else if (code === 'FE' || name.includes('serum iron')) {
      if (!param.defaultFemaleValue) value = '85';
      if (!param.femaleRange && !hasGenderInString) referenceRange = '50 - 170';
    } else if (code === 'TROP_I' || code === 'HS_TROP_I' || name.includes('troponin i')) {
      if (!param.defaultFemaleValue) value = '4.8';
      if (!param.femaleRange && !hasGenderInString) referenceRange = '< 11.4';
    } else if (code === 'CPK_TOT' || name.includes('cpk') || name.includes('creatine kinase')) {
      if (!param.defaultFemaleValue) value = '85';
      if (!param.femaleRange && !hasGenderInString) referenceRange = '26 - 192';
    } else if (code === 'TESTO_TOT' || code === 'TESTO_SERUM' || name.includes('testosterone')) {
      if (!param.defaultFemaleValue) value = '32';
      if (!param.femaleRange && !hasGenderInString) referenceRange = '15 - 70';
    } else if (code === 'PRL' || code === 'PROLACTIN' || code === 'PROLACTIN_VAL' || name.includes('prolactin')) {
      if (!param.defaultFemaleValue) value = '14.2';
      if (!param.femaleRange && !hasGenderInString) referenceRange = '4.8 - 23.3';
    } else if (code === 'DHEA_S' || code === 'DHEA_S_VAL' || name.includes('dhea')) {
      if (!param.defaultFemaleValue) value = '180';
      if (!param.femaleRange && !hasGenderInString) referenceRange = '35 - 430';
    } else if (code === 'HDL' || name.includes('hdl')) {
      if (!param.defaultFemaleValue) value = '54';
      if (!param.femaleRange && !hasGenderInString) referenceRange = '> 50 (Optimal)';
    }
  } else if (isMale) {
    if (code === 'HB' || code === 'HB_ANC' || name.includes('hemoglobin') || name.includes('haemoglobin')) {
      if (!param.defaultMaleValue) value = '14.8';
      if (!param.maleRange && !hasGenderInString) referenceRange = '13.0 - 17.0';
    } else if (code === 'RBC' || name.includes('red blood cell')) {
      if (!param.defaultMaleValue) value = '5.10';
      if (!param.maleRange && !hasGenderInString) referenceRange = '4.50 - 5.50';
    } else if (code === 'PCV' || name.includes('hematocrit') || name.includes('packed cell')) {
      if (!param.defaultMaleValue) value = '45.0';
      if (!param.maleRange && !hasGenderInString) referenceRange = '40.0 - 50.0';
    } else if (code.includes('ESR') || name.includes('erythrocyte sedimentation')) {
      if (!param.defaultMaleValue) value = '8';
      if (!param.maleRange && !hasGenderInString) referenceRange = '0 - 15';
    } else if (code === 'CREAT' || name.includes('creatinine')) {
      if (!param.defaultMaleValue) value = '0.95';
      if (!param.maleRange && !hasGenderInString) referenceRange = '0.70 - 1.30';
    } else if (code === 'URIC' || code === 'URIC_ACID' || name.includes('uric acid')) {
      if (!param.defaultMaleValue) value = '5.2';
      if (!param.maleRange && !hasGenderInString) referenceRange = '3.5 - 7.2';
    } else if (code === 'GGT' || name.includes('glutamyl')) {
      if (!param.defaultMaleValue) value = '28';
      if (!param.maleRange && !hasGenderInString) referenceRange = '10 - 55';
    } else if (code === 'FERRITIN' || code === 'FERRITIN_VAL' || name.includes('ferritin')) {
      if (!param.defaultMaleValue) value = '120';
      if (!param.maleRange && !hasGenderInString) referenceRange = '30 - 400';
    } else if (code === 'FE' || name.includes('serum iron')) {
      if (!param.defaultMaleValue) value = '110';
      if (!param.maleRange && !hasGenderInString) referenceRange = '65 - 175';
    } else if (code === 'TROP_I' || code === 'HS_TROP_I' || name.includes('troponin i')) {
      if (!param.defaultMaleValue) value = '6.2';
      if (!param.maleRange && !hasGenderInString) referenceRange = '< 15.6';
    } else if (code === 'CPK_TOT' || name.includes('cpk') || name.includes('creatine kinase')) {
      if (!param.defaultMaleValue) value = '120';
      if (!param.maleRange && !hasGenderInString) referenceRange = '39 - 308';
    } else if (code === 'TESTO_TOT' || code === 'TESTO_SERUM' || name.includes('testosterone')) {
      if (!param.defaultMaleValue) value = '540';
      if (!param.maleRange && !hasGenderInString) referenceRange = '280 - 1100';
    } else if (code === 'PRL' || code === 'PROLACTIN' || code === 'PROLACTIN_VAL' || name.includes('prolactin')) {
      if (!param.defaultMaleValue) value = '8.5';
      if (!param.maleRange && !hasGenderInString) referenceRange = '4.0 - 15.2';
    } else if (code === 'DHEA_S' || code === 'DHEA_S_VAL' || name.includes('dhea')) {
      if (!param.defaultMaleValue) value = '280';
      if (!param.maleRange && !hasGenderInString) referenceRange = '80 - 560';
    } else if (code === 'HDL' || name.includes('hdl')) {
      if (!param.defaultMaleValue) value = '46';
      if (!param.maleRange && !hasGenderInString) referenceRange = '> 40 (Optimal)';
    }
  }

  // 4. Calculate flag against clean reference interval
  let flag: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' = 'NORMAL';
  const num = parseFloat(value);
  if (!isNaN(num) && referenceRange) {
    if (param.criticalLow !== undefined && num <= param.criticalLow) {
      flag = 'CRITICAL';
    } else if (param.criticalHigh !== undefined && num >= param.criticalHigh) {
      flag = 'CRITICAL';
    } else {
      const matchRange = referenceRange.match(/([0-9.]+)\s*-\s*([0-9.]+)/);
      if (matchRange && matchRange[1] && matchRange[2]) {
        const minVal = parseFloat(matchRange[1]);
        const maxVal = parseFloat(matchRange[2]);
        if (!isNaN(minVal) && !isNaN(maxVal)) {
          if (num < minVal) flag = 'LOW';
          else if (num > maxVal) flag = 'HIGH';
          else flag = 'NORMAL';
        }
      } else if (referenceRange.startsWith('<')) {
        const maxVal = parseFloat(referenceRange.replace('<', '').trim());
        if (!isNaN(maxVal) && num > maxVal) flag = 'HIGH';
      } else if (referenceRange.startsWith('>')) {
        const minVal = parseFloat(referenceRange.replace('>', '').trim());
        if (!isNaN(minVal) && num < minVal) flag = 'LOW';
      }
    }
  }

  return { value, referenceRange, flag };
}

const CUSTOM_TESTS_STORAGE_KEY = 'docsearch_custom_test_library';

/**
 * Retrieve custom test profiles saved dynamically by the laboratory
 */
export function getCustomTestLibrary(): Record<string, ClinicalTestProfileDef> {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(CUSTOM_TESTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (e) {
    console.error('Failed to load custom test library:', e);
    return {};
  }
}

/**
 * Persist a newly created or customized test profile
 */
export function saveCustomTestProfile(profile: ClinicalTestProfileDef): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const current = getCustomTestLibrary();
    current[profile.key] = profile;
    window.localStorage.setItem(CUSTOM_TESTS_STORAGE_KEY, JSON.stringify(current));
    // Trigger cross-window and in-page storage update event
    window.dispatchEvent(new Event('docsearch_custom_library_updated'));
  } catch (e) {
    console.error('Failed to save custom test profile:', e);
  }
}

/**
 * Delete a custom test profile
 */
export function deleteCustomTestProfile(key: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const current = getCustomTestLibrary();
    delete current[key];
    window.localStorage.setItem(CUSTOM_TESTS_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('docsearch_custom_library_updated'));
  } catch (e) {
    console.error('Failed to delete custom test profile:', e);
  }
}

/**
 * Returns merged dictionary of standard 55+ clinical profiles plus any user-customized/new profiles
 */
export function getMergedClinicalTestLibrary(): Record<string, ClinicalTestProfileDef> {
  const custom = getCustomTestLibrary();
  return {
    ...MASTER_CLINICAL_TEST_LIBRARY,
    ...custom
  };
}
