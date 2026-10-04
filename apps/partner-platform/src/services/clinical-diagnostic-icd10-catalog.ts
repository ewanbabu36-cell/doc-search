/**
 * Comprehensive 100+ Indian Diagnostic Lab Test Master Catalog & WHO ICD-10 Clinical Dictionary
 * Classification: Operational Clinical Telemetry & ABHA / NHA EMR Standard Compliance
 */

export interface QuickLabTestItem {
  id: string;
  testCode: string;
  name: string;
  shortName: string;
  category: 'HEMATOLOGY' | 'BIOCHEMISTRY' | 'IMMUNOLOGY' | 'PATHOLOGY' | 'RADIOLOGY' | 'CARDIOLOGY' | 'ENDOCRINOLOGY';
  categoryLabel: string;
  specimen: string;
  fasting: boolean;
  tatHours: number;
}

export interface CommonDiagnosisItem {
  id: string;
  name: string;
  code: string;
  icon: string;
  chipLabel: string;
  category: string;
  symptoms: string[];
}

/**
 * 100+ Essential Laboratory, Pathology, and Radiology Investigations for Indian OPD
 */
export const INDIAN_100_OPD_LAB_CATALOG: QuickLabTestItem[] = [
  // --- 1. HEMATOLOGY & COAGULATION (15 Tests) ---
  { id: 'lab-cbc', testCode: 'CBC-001', name: 'Complete Blood Count (CBC / Hemogram)', shortName: 'CBC', category: 'HEMATOLOGY', categoryLabel: 'Blood', specimen: 'EDTA Whole Blood', fasting: false, tatHours: 4 },
  { id: 'lab-esr', testCode: 'ESR-002', name: 'Erythrocyte Sedimentation Rate (ESR)', shortName: 'ESR', category: 'HEMATOLOGY', categoryLabel: 'Blood', specimen: 'Citrate / EDTA Blood', fasting: false, tatHours: 3 },
  { id: 'lab-bg', testCode: 'BG-003', name: 'Blood Group ABO & Rh Factor Typing', shortName: 'Blood Group', category: 'HEMATOLOGY', categoryLabel: 'Blood', specimen: 'EDTA Blood', fasting: false, tatHours: 2 },
  { id: 'lab-psmp', testCode: 'PSMP-004', name: 'Peripheral Blood Smear for Morphology & MP', shortName: 'PBS / Smear', category: 'HEMATOLOGY', categoryLabel: 'Blood', specimen: 'EDTA Blood', fasting: false, tatHours: 4 },
  { id: 'lab-plt', testCode: 'PLT-005', name: 'Platelet Count Manual & Automated', shortName: 'Platelets', category: 'HEMATOLOGY', categoryLabel: 'Blood', specimen: 'EDTA Blood', fasting: false, tatHours: 2 },
  { id: 'lab-aec', testCode: 'AEC-006', name: 'Absolute Eosinophil Count (AEC)', shortName: 'AEC', category: 'HEMATOLOGY', categoryLabel: 'Blood', specimen: 'EDTA Blood', fasting: false, tatHours: 3 },
  { id: 'lab-retic', testCode: 'RETIC-007', name: 'Reticulocyte Count with Retic Index', shortName: 'Reticulocyte', category: 'HEMATOLOGY', categoryLabel: 'Blood', specimen: 'EDTA Blood', fasting: false, tatHours: 4 },
  { id: 'lab-ptinr', testCode: 'PT-008', name: 'Prothrombin Time with INR (PT / INR)', shortName: 'PT / INR', category: 'HEMATOLOGY', categoryLabel: 'Blood', specimen: 'Sodium Citrate', fasting: false, tatHours: 3 },
  { id: 'lab-aptt', testCode: 'APTT-009', name: 'Activated Partial Thromboplastin Time (aPTT)', shortName: 'aPTT', category: 'HEMATOLOGY', categoryLabel: 'Blood', specimen: 'Sodium Citrate', fasting: false, tatHours: 4 },
  { id: 'lab-btct', testCode: 'BTCT-010', name: 'Bleeding Time & Clotting Time (BT / CT)', shortName: 'BT / CT', category: 'HEMATOLOGY', categoryLabel: 'Blood', specimen: 'Fingerprick / Whole Blood', fasting: false, tatHours: 1 },
  { id: 'lab-ddimer', testCode: 'DDIM-011', name: 'D-Dimer Quantitative Assay', shortName: 'D-Dimer', category: 'HEMATOLOGY', categoryLabel: 'Blood', specimen: 'Citrate Plasma', fasting: false, tatHours: 3 },
  { id: 'lab-hbelect', testCode: 'HBE-012', name: 'Hemoglobin Electrophoresis (HPLC / Thalassemia)', shortName: 'Hb HPLC', category: 'HEMATOLOGY', categoryLabel: 'Blood', specimen: 'EDTA Blood', fasting: false, tatHours: 24 },
  { id: 'lab-sickle', testCode: 'SICK-013', name: 'Sickling Test / Sickle Cell Screening', shortName: 'Sickling Test', category: 'HEMATOLOGY', categoryLabel: 'Blood', specimen: 'EDTA Blood', fasting: false, tatHours: 4 },
  { id: 'lab-coombs-d', testCode: 'DAT-014', name: 'Direct Coombs Test (DAT)', shortName: 'Direct Coombs', category: 'HEMATOLOGY', categoryLabel: 'Blood', specimen: 'EDTA Blood', fasting: false, tatHours: 4 },
  { id: 'lab-coombs-i', testCode: 'IAT-015', name: 'Indirect Coombs Test (IAT / Antibody Screen)', shortName: 'Indirect Coombs', category: 'HEMATOLOGY', categoryLabel: 'Blood', specimen: 'Serum', fasting: false, tatHours: 4 },

  // --- 2. LIVER & HEPATOBILIARY (12 Tests) ---
  { id: 'lab-lft', testCode: 'LFT-020', name: 'Liver Function Test Complete (LFT Profile)', shortName: 'LFT Complete', category: 'BIOCHEMISTRY', categoryLabel: 'Liver', specimen: 'Serum', fasting: true, tatHours: 6 },
  { id: 'lab-bili-tot', testCode: 'BILI-021', name: 'Serum Bilirubin Total', shortName: 'Bilirubin Total', category: 'BIOCHEMISTRY', categoryLabel: 'Liver', specimen: 'Serum', fasting: true, tatHours: 2 },
  { id: 'lab-bili-dir', testCode: 'BILD-022', name: 'Serum Bilirubin Direct & Indirect', shortName: 'Bilirubin Direct', category: 'BIOCHEMISTRY', categoryLabel: 'Liver', specimen: 'Serum', fasting: true, tatHours: 2 },
  { id: 'lab-sgot', testCode: 'SGOT-023', name: 'Serum Glutamic Oxaloacetic Transaminase (SGOT / AST)', shortName: 'SGOT (AST)', category: 'BIOCHEMISTRY', categoryLabel: 'Liver', specimen: 'Serum', fasting: false, tatHours: 3 },
  { id: 'lab-sgpt', testCode: 'SGPT-024', name: 'Serum Glutamic Pyruvic Transaminase (SGPT / ALT)', shortName: 'SGPT (ALT)', category: 'BIOCHEMISTRY', categoryLabel: 'Liver', specimen: 'Serum', fasting: false, tatHours: 3 },
  { id: 'lab-alp', testCode: 'ALP-025', name: 'Alkaline Phosphatase (ALP)', shortName: 'Alk Phosphatase', category: 'BIOCHEMISTRY', categoryLabel: 'Liver', specimen: 'Serum', fasting: false, tatHours: 4 },
  { id: 'lab-ggt', testCode: 'GGT-026', name: 'Gamma Glutamyl Transferase (GGT)', shortName: 'GGT', category: 'BIOCHEMISTRY', categoryLabel: 'Liver', specimen: 'Serum', fasting: true, tatHours: 6 },
  { id: 'lab-protein', testCode: 'PROT-027', name: 'Total Protein, Albumin, Globulin & A/G Ratio', shortName: 'Total Protein & Albumin', category: 'BIOCHEMISTRY', categoryLabel: 'Liver', specimen: 'Serum', fasting: false, tatHours: 4 },
  { id: 'lab-albumin', testCode: 'ALB-028', name: 'Serum Albumin Quantitative', shortName: 'Serum Albumin', category: 'BIOCHEMISTRY', categoryLabel: 'Liver', specimen: 'Serum', fasting: false, tatHours: 2 },
  { id: 'lab-ldh', testCode: 'LDH-029', name: 'Lactate Dehydrogenase (LDH)', shortName: 'LDH', category: 'BIOCHEMISTRY', categoryLabel: 'Liver', specimen: 'Serum', fasting: false, tatHours: 4 },
  { id: 'lab-ammonia', testCode: 'AMM-030', name: 'Blood Ammonia (Hepatic Encephalopathy)', shortName: 'Blood Ammonia', category: 'BIOCHEMISTRY', categoryLabel: 'Liver', specimen: 'EDTA Plasma on Ice', fasting: true, tatHours: 2 },
  { id: 'lab-bileacids', testCode: 'SBA-031', name: 'Total Serum Bile Acids (Cholestasis of Pregnancy)', shortName: 'Serum Bile Acids', category: 'BIOCHEMISTRY', categoryLabel: 'Liver', specimen: 'Serum', fasting: true, tatHours: 12 },

  // --- 3. KIDNEY & RENAL FUNCTION (10 Tests) ---
  { id: 'lab-kft', testCode: 'KFT-035', name: 'Kidney Function Test Complete (KFT / RFT Profile)', shortName: 'KFT Complete', category: 'BIOCHEMISTRY', categoryLabel: 'Kidney', specimen: 'Serum', fasting: false, tatHours: 6 },
  { id: 'lab-creat', testCode: 'CREAT-036', name: 'Serum Creatinine with eGFR', shortName: 'Serum Creatinine', category: 'BIOCHEMISTRY', categoryLabel: 'Kidney', specimen: 'Serum', fasting: false, tatHours: 2 },
  { id: 'lab-urea', testCode: 'UREA-037', name: 'Blood Urea & Blood Urea Nitrogen (BUN)', shortName: 'Blood Urea / BUN', category: 'BIOCHEMISTRY', categoryLabel: 'Kidney', specimen: 'Serum', fasting: false, tatHours: 2 },
  { id: 'lab-uric', testCode: 'URIC-038', name: 'Serum Uric Acid (Hyperuricemia / Gout)', shortName: 'Serum Uric Acid', category: 'BIOCHEMISTRY', categoryLabel: 'Kidney', specimen: 'Serum', fasting: false, tatHours: 3 },
  { id: 'lab-electro', testCode: 'ELEC-039', name: 'Serum Electrolytes (Sodium, Potassium, Chloride)', shortName: 'Electrolytes (Na/K/Cl)', category: 'BIOCHEMISTRY', categoryLabel: 'Kidney', specimen: 'Serum', fasting: false, tatHours: 2 },
  { id: 'lab-calc', testCode: 'CALC-040', name: 'Serum Total Calcium & Ionized Calcium', shortName: 'Serum Calcium', category: 'BIOCHEMISTRY', categoryLabel: 'Kidney', specimen: 'Serum', fasting: false, tatHours: 3 },
  { id: 'lab-phos', testCode: 'PHOS-041', name: 'Serum Inorganic Phosphorus', shortName: 'Serum Phosphorus', category: 'BIOCHEMISTRY', categoryLabel: 'Kidney', specimen: 'Serum', fasting: true, tatHours: 4 },
  { id: 'lab-mag', testCode: 'MAG-042', name: 'Serum Magnesium Quantitative', shortName: 'Serum Magnesium', category: 'BIOCHEMISTRY', categoryLabel: 'Kidney', specimen: 'Serum', fasting: false, tatHours: 4 },
  { id: 'lab-urmicroalb', testCode: 'MALB-043', name: 'Urine Microalbumin to Creatinine Ratio (UACR)', shortName: 'Urine Microalbumin', category: 'BIOCHEMISTRY', categoryLabel: 'Kidney', specimen: 'Spot Early Morning Urine', fasting: false, tatHours: 4 },
  { id: 'lab-24uprot', testCode: 'U24P-044', name: '24-Hour Urinary Total Protein Quantification', shortName: '24-Hr Urine Protein', category: 'BIOCHEMISTRY', categoryLabel: 'Kidney', specimen: '24-Hour Urine Collection', fasting: false, tatHours: 12 },

  // --- 4. DIABETES & METABOLIC (10 Tests) ---
  { id: 'lab-fbs', testCode: 'FBS-050', name: 'Fasting Blood Sugar (FBS / Glucose Fasting)', shortName: 'Fasting Glucose (FBS)', category: 'BIOCHEMISTRY', categoryLabel: 'Diabetes', specimen: 'Fluoride Plasma', fasting: true, tatHours: 2 },
  { id: 'lab-ppbs', testCode: 'PPBS-051', name: 'Post Prandial Blood Sugar (PPBS 2-Hour Post Meal)', shortName: 'PP Blood Sugar (PPBS)', category: 'BIOCHEMISTRY', categoryLabel: 'Diabetes', specimen: 'Fluoride Plasma', fasting: false, tatHours: 2 },
  { id: 'lab-rbs', testCode: 'RBS-052', name: 'Random Blood Sugar (RBS)', shortName: 'Random Sugar (RBS)', category: 'BIOCHEMISTRY', categoryLabel: 'Diabetes', specimen: 'Fluoride Plasma', fasting: false, tatHours: 1 },
  { id: 'lab-hba1c', testCode: 'HBA1C-053', name: 'HbA1c Glycated Hemoglobin (HPLC Gold Standard)', shortName: 'HbA1c', category: 'BIOCHEMISTRY', categoryLabel: 'Diabetes', specimen: 'EDTA Blood', fasting: false, tatHours: 4 },
  { id: 'lab-gtt', testCode: 'GTT-054', name: 'Oral Glucose Tolerance Test (OGTT 75g WHO Protocol)', shortName: 'OGTT (75g Glucose)', category: 'BIOCHEMISTRY', categoryLabel: 'Diabetes', specimen: 'Fluoride Plasma (0, 1, 2 Hr)', fasting: true, tatHours: 4 },
  { id: 'lab-ins-f', testCode: 'INSF-055', name: 'Serum Fasting Insulin & HOMA-IR (Insulin Resistance)', shortName: 'Fasting Insulin', category: 'ENDOCRINOLOGY', categoryLabel: 'Diabetes', specimen: 'Serum', fasting: true, tatHours: 8 },
  { id: 'lab-cpep', testCode: 'CPEP-056', name: 'Serum C-Peptide Fasting', shortName: 'C-Peptide', category: 'ENDOCRINOLOGY', categoryLabel: 'Diabetes', specimen: 'Serum', fasting: true, tatHours: 8 },
  { id: 'lab-fruct', testCode: 'FRUCT-057', name: 'Serum Fructosamine (2-3 Week Glycemic Control)', shortName: 'Fructosamine', category: 'BIOCHEMISTRY', categoryLabel: 'Diabetes', specimen: 'Serum', fasting: false, tatHours: 8 },
  { id: 'lab-ketone', testCode: 'KETO-058', name: 'Beta-Hydroxybutyrate / Blood Ketones (DKA Screen)', shortName: 'Blood Ketones', category: 'BIOCHEMISTRY', categoryLabel: 'Diabetes', specimen: 'Serum / Capillary', fasting: false, tatHours: 1 },
  { id: 'lab-gad', testCode: 'GADA-059', name: 'Anti-GAD 65 Antibodies (Type 1 / LADA Diabetes)', shortName: 'Anti-GAD Antibodies', category: 'IMMUNOLOGY', categoryLabel: 'Diabetes', specimen: 'Serum', fasting: false, tatHours: 24 },

  // --- 5. CARDIAC & LIPIDS (9 Tests) ---
  { id: 'lab-lipid', testCode: 'LIPID-060', name: 'Lipid Profile Complete (Cholesterol, TG, HDL, LDL, VLDL)', shortName: 'Lipid Profile Complete', category: 'BIOCHEMISTRY', categoryLabel: 'Heart', specimen: 'Serum', fasting: true, tatHours: 6 },
  { id: 'lab-chol-tot', testCode: 'CHOL-061', name: 'Serum Total Cholesterol', shortName: 'Total Cholesterol', category: 'BIOCHEMISTRY', categoryLabel: 'Heart', specimen: 'Serum', fasting: true, tatHours: 3 },
  { id: 'lab-tg', testCode: 'TG-062', name: 'Serum Triglycerides', shortName: 'Triglycerides', category: 'BIOCHEMISTRY', categoryLabel: 'Heart', specimen: 'Serum', fasting: true, tatHours: 3 },
  { id: 'lab-tropi', testCode: 'TROPI-063', name: 'High-Sensitivity Troponin-I (hs-cTnI / Acute MI)', shortName: 'hs-Troponin I', category: 'CARDIOLOGY', categoryLabel: 'Heart', specimen: 'Serum / Heparin', fasting: false, tatHours: 1 },
  { id: 'lab-tropt', testCode: 'TROPT-064', name: 'Troponin-T Quantitative (cTnT)', shortName: 'Troponin T', category: 'CARDIOLOGY', categoryLabel: 'Heart', specimen: 'Heparin Plasma', fasting: false, tatHours: 1 },
  { id: 'lab-cpkmb', testCode: 'CKMB-065', name: 'Creatine Kinase-MB (CK-MB Mass / Isoenzyme)', shortName: 'CK-MB', category: 'CARDIOLOGY', categoryLabel: 'Heart', specimen: 'Serum', fasting: false, tatHours: 2 },
  { id: 'lab-ntbnp', testCode: 'BNP-066', name: 'NT-proBNP / BNP (Heart Failure Biomarker)', shortName: 'NT-proBNP', category: 'CARDIOLOGY', categoryLabel: 'Heart', specimen: 'EDTA Plasma', fasting: false, tatHours: 3 },
  { id: 'lab-hscrp', testCode: 'HSCRP-067', name: 'High Sensitivity CRP (hs-CRP Cardiac Risk)', shortName: 'hs-CRP (Cardiac)', category: 'CARDIOLOGY', categoryLabel: 'Heart', specimen: 'Serum', fasting: false, tatHours: 4 },
  { id: 'lab-homocys', testCode: 'HCYS-068', name: 'Serum Homocysteine (Vascular Thrombosis Risk)', shortName: 'Homocysteine', category: 'BIOCHEMISTRY', categoryLabel: 'Heart', specimen: 'EDTA Plasma on Ice', fasting: true, tatHours: 8 },

  // --- 6. THYROID, HORMONES & VITAMINS (14 Tests) ---
  { id: 'lab-thyroid', testCode: 'THY-070', name: 'Thyroid Profile Complete (Total T3, Total T4, TSH)', shortName: 'Thyroid Profile (T3/T4/TSH)', category: 'ENDOCRINOLOGY', categoryLabel: 'Hormones', specimen: 'Serum', fasting: false, tatHours: 6 },
  { id: 'lab-tsh', testCode: 'TSH-071', name: 'Ultrasensitive TSH (3rd Generation CLIA)', shortName: 'TSH Ultra', category: 'ENDOCRINOLOGY', categoryLabel: 'Hormones', specimen: 'Serum', fasting: false, tatHours: 4 },
  { id: 'lab-ft3ft4', testCode: 'FT34-072', name: 'Free T3 & Free T4 Profile (FT3 & FT4)', shortName: 'Free T3 / Free T4', category: 'ENDOCRINOLOGY', categoryLabel: 'Hormones', specimen: 'Serum', fasting: false, tatHours: 6 },
  { id: 'lab-atpo', testCode: 'ATPO-073', name: 'Anti-Thyroid Peroxidase Antibody (Anti-TPO / Hashimoto)', shortName: 'Anti-TPO Antibodies', category: 'IMMUNOLOGY', categoryLabel: 'Hormones', specimen: 'Serum', fasting: false, tatHours: 12 },
  { id: 'lab-vitd', testCode: 'VITD-074', name: 'Vitamin D 25-Hydroxy (25-OH Cholecalciferol)', shortName: 'Vitamin D3 (25-OH)', category: 'BIOCHEMISTRY', categoryLabel: 'Vitamins', specimen: 'Serum', fasting: false, tatHours: 6 },
  { id: 'lab-vitb12', testCode: 'VITB12-075', name: 'Vitamin B12 (Cyanocobalamin / Methylcobalamin)', shortName: 'Vitamin B12', category: 'BIOCHEMISTRY', categoryLabel: 'Vitamins', specimen: 'Serum', fasting: true, tatHours: 6 },
  { id: 'lab-ferritin', testCode: 'FERR-076', name: 'Serum Ferritin (Iron Storage Evaluation)', shortName: 'Serum Ferritin', category: 'BIOCHEMISTRY', categoryLabel: 'Vitamins', specimen: 'Serum', fasting: false, tatHours: 4 },
  { id: 'lab-iron-tibc', testCode: 'FE-077', name: 'Serum Iron, TIBC & Transferrin Saturation Index', shortName: 'Iron Studies (TIBC)', category: 'BIOCHEMISTRY', categoryLabel: 'Vitamins', specimen: 'Serum', fasting: true, tatHours: 6 },
  { id: 'lab-cortisol', testCode: 'CORT-078', name: 'Serum Cortisol Morning (8 AM Basal)', shortName: 'Morning Cortisol', category: 'ENDOCRINOLOGY', categoryLabel: 'Hormones', specimen: 'Serum', fasting: true, tatHours: 8 },
  { id: 'lab-prolactin', testCode: 'PRL-079', name: 'Serum Prolactin Quantitative', shortName: 'Prolactin', category: 'ENDOCRINOLOGY', categoryLabel: 'Hormones', specimen: 'Serum', fasting: true, tatHours: 6 },
  { id: 'lab-testo', testCode: 'TEST-080', name: 'Serum Total Testosterone & Free Testosterone', shortName: 'Total Testosterone', category: 'ENDOCRINOLOGY', categoryLabel: 'Hormones', specimen: 'Serum', fasting: true, tatHours: 8 },
  { id: 'lab-fshlh', testCode: 'FSHLH-081', name: 'FSH & LH (Follicle Stimulating & Luteinizing Hormone)', shortName: 'FSH / LH Profile', category: 'ENDOCRINOLOGY', categoryLabel: 'Hormones', specimen: 'Serum', fasting: false, tatHours: 6 },
  { id: 'lab-amh', testCode: 'AMH-082', name: 'Anti-Mullerian Hormone (AMH Ovarian Reserve)', shortName: 'AMH', category: 'ENDOCRINOLOGY', categoryLabel: 'Hormones', specimen: 'Serum', fasting: false, tatHours: 12 },
  { id: 'lab-psa', testCode: 'PSA-083', name: 'Prostate Specific Antigen Total & Free (PSA)', shortName: 'Total PSA', category: 'BIOCHEMISTRY', categoryLabel: 'Hormones', specimen: 'Serum', fasting: false, tatHours: 6 },

  // --- 7. INFECTIONS, FEVER & SEROLOGY (18 Tests) ---
  { id: 'lab-dengue', testCode: 'DEN-090', name: 'Dengue Serology (NS1 Antigen & IgG/IgM Combo)', shortName: 'Dengue NS1 Combo', category: 'IMMUNOLOGY', categoryLabel: 'Infection', specimen: 'Serum', fasting: false, tatHours: 2 },
  { id: 'lab-widal', testCode: 'WID-091', name: 'Widal Slide & Tube Agglutination Test (Typhoid)', shortName: 'Widal (Typhoid)', category: 'IMMUNOLOGY', categoryLabel: 'Infection', specimen: 'Serum', fasting: false, tatHours: 3 },
  { id: 'lab-typhi', testCode: 'TYPHI-092', name: 'Typhidot IgM & IgG Rapid Card (Enteric Fever)', shortName: 'Typhidot IgM/IgG', category: 'IMMUNOLOGY', categoryLabel: 'Infection', specimen: 'Serum', fasting: false, tatHours: 2 },
  { id: 'lab-malaria', testCode: 'MAL-093', name: 'Malaria Rapid Antigen Card (P. Vivax & P. Falciparum)', shortName: 'Malaria Card (Pv/Pf)', category: 'IMMUNOLOGY', categoryLabel: 'Infection', specimen: 'EDTA Whole Blood', fasting: false, tatHours: 1 },
  { id: 'lab-chiku', testCode: 'CHIK-094', name: 'Chikungunya IgM Antibody ELISA / Rapid', shortName: 'Chikungunya IgM', category: 'IMMUNOLOGY', categoryLabel: 'Infection', specimen: 'Serum', fasting: false, tatHours: 4 },
  { id: 'lab-crp', testCode: 'CRP-095', name: 'C-Reactive Protein Quantitative (CRP Inflammatory)', shortName: 'CRP Quantitative', category: 'IMMUNOLOGY', categoryLabel: 'Infection', specimen: 'Serum', fasting: false, tatHours: 3 },
  { id: 'lab-hbsag', testCode: 'HBS-096', name: 'Hepatitis B Surface Antigen (HBsAg Rapid / CLIA)', shortName: 'HBsAg (Hep-B)', category: 'IMMUNOLOGY', categoryLabel: 'Infection', specimen: 'Serum', fasting: false, tatHours: 2 },
  { id: 'lab-hcv', testCode: 'HCV-097', name: 'Anti-HCV Antibody (Hepatitis C Total Antibodies)', shortName: 'Anti-HCV (Hep-C)', category: 'IMMUNOLOGY', categoryLabel: 'Infection', specimen: 'Serum', fasting: false, tatHours: 3 },
  { id: 'lab-hav', testCode: 'HAV-098', name: 'Hepatitis A Virus IgM Antibody (Acute Hep-A Jaundice)', shortName: 'HAV IgM (Jaundice)', category: 'IMMUNOLOGY', categoryLabel: 'Infection', specimen: 'Serum', fasting: false, tatHours: 4 },
  { id: 'lab-hev', testCode: 'HEV-099', name: 'Hepatitis E Virus IgM Antibody (Enteric Hep-E)', shortName: 'HEV IgM', category: 'IMMUNOLOGY', categoryLabel: 'Infection', specimen: 'Serum', fasting: false, tatHours: 4 },
  { id: 'lab-hiv', testCode: 'HIV-100', name: 'HIV 1 & 2 4th Gen Antigen/Antibody Combo Rapid', shortName: 'HIV 1 & 2 Tridot', category: 'IMMUNOLOGY', categoryLabel: 'Infection', specimen: 'Serum', fasting: false, tatHours: 2 },
  { id: 'lab-vdrl', testCode: 'VDRL-101', name: 'VDRL / RPR Flocculation Test (Syphilis Screening)', shortName: 'VDRL / RPR', category: 'IMMUNOLOGY', categoryLabel: 'Infection', specimen: 'Serum', fasting: false, tatHours: 3 },
  { id: 'lab-scrub', testCode: 'SCRUB-102', name: 'Scrub Typhus IgM Antibody (Rickettsial Fever)', shortName: 'Scrub Typhus IgM', category: 'IMMUNOLOGY', categoryLabel: 'Infection', specimen: 'Serum', fasting: false, tatHours: 4 },
  { id: 'lab-lepto', testCode: 'LEP-103', name: 'Leptospira IgM Antibodies (Leptospirosis / Weils)', shortName: 'Leptospira IgM', category: 'IMMUNOLOGY', categoryLabel: 'Infection', specimen: 'Serum', fasting: false, tatHours: 4 },
  { id: 'lab-mantoux', testCode: 'MTX-104', name: 'Mantoux Tuberculin Skin Test (5 TU PPD)', shortName: 'Mantoux Test (PPD)', category: 'PATHOLOGY', categoryLabel: 'Infection', specimen: 'Intradermal Injection (48-72h Read)', fasting: false, tatHours: 48 },
  { id: 'lab-cbnaat', testCode: 'XPERT-105', name: 'GeneXpert MTB/RIF (CBNAAT Tuberculosis PCR)', shortName: 'GeneXpert MTB', category: 'PATHOLOGY', categoryLabel: 'Infection', specimen: 'Sputum / BAL / Pus', fasting: false, tatHours: 6 },
  { id: 'lab-afb', testCode: 'AFB-106', name: 'Sputum for Acid Fast Bacilli (AFB Smear ZN Stain)', shortName: 'Sputum AFB Stain', category: 'PATHOLOGY', categoryLabel: 'Infection', specimen: 'Early Morning Sputum', fasting: false, tatHours: 4 },
  { id: 'lab-covid', testCode: 'COV-107', name: 'COVID-19 RT-PCR / Rapid Antigen Detection', shortName: 'COVID-19 RT-PCR', category: 'IMMUNOLOGY', categoryLabel: 'Infection', specimen: 'Nasopharyngeal Swab', fasting: false, tatHours: 6 },

  // --- 8. CLINICAL PATHOLOGY, URINE & STOOL (8 Tests) ---
  { id: 'lab-urine', testCode: 'UR-110', name: 'Urine Routine & Microscopic Examination (Urine R/M)', shortName: 'Urine R/M Complete', category: 'PATHOLOGY', categoryLabel: 'Urine', specimen: 'Midstream Fresh Urine', fasting: false, tatHours: 2 },
  { id: 'lab-uricult', testCode: 'UC-111', name: 'Urine Culture & Antibiotic Sensitivity (C&S)', shortName: 'Urine Culture & Sensitivity', category: 'PATHOLOGY', categoryLabel: 'Urine', specimen: 'Sterile Midstream Urine', fasting: false, tatHours: 48 },
  { id: 'lab-upt', testCode: 'UPT-112', name: 'Urine Pregnancy Card Test (Rapid hCG Detection)', shortName: 'UPT Pregnancy Card', category: 'PATHOLOGY', categoryLabel: 'Urine', specimen: 'Early Morning Urine', fasting: false, tatHours: 1 },
  { id: 'lab-stool-rm', testCode: 'ST-113', name: 'Stool Routine, Microscopy, Ova & Cyst', shortName: 'Stool R/M (Ova/Cyst)', category: 'PATHOLOGY', categoryLabel: 'Stool', specimen: 'Fresh Stool Specimen', fasting: false, tatHours: 3 },
  { id: 'lab-stool-ob', testCode: 'FOBT-114', name: 'Stool Occult Blood Test (FOBT / GI Bleed Screen)', shortName: 'Stool Occult Blood', category: 'PATHOLOGY', categoryLabel: 'Stool', specimen: 'Fresh Stool', fasting: false, tatHours: 2 },
  { id: 'lab-stool-cult', testCode: 'SC-115', name: 'Stool Culture & Sensitivity (Enteric Pathogens)', shortName: 'Stool Culture', category: 'PATHOLOGY', categoryLabel: 'Stool', specimen: 'Stool in Cary-Blair', fasting: false, tatHours: 48 },
  { id: 'lab-semen', testCode: 'SEM-116', name: 'Semen Analysis Complete (WHO 6th Manual Parameters)', shortName: 'Semen Analysis', category: 'PATHOLOGY', categoryLabel: 'Andrology', specimen: 'Seminal Fluid (3d Abstinence)', fasting: false, tatHours: 4 },
  { id: 'lab-pap', testCode: 'PAP-117', name: 'Liquid Based Cytology Cervical Pap Smear (LBC Pap)', shortName: 'Cervical Pap Smear', category: 'PATHOLOGY', categoryLabel: 'Cytology', specimen: 'Endocervical Brush', fasting: false, tatHours: 48 },

  // --- 9. RHEUMATOLOGY & AUTOIMMUNE (6 Tests) ---
  { id: 'lab-ra', testCode: 'RF-120', name: 'Rheumatoid Factor Quantitative (RA Factor Turbidimetry)', shortName: 'RA Factor Quant', category: 'IMMUNOLOGY', categoryLabel: 'Joints', specimen: 'Serum', fasting: false, tatHours: 4 },
  { id: 'lab-anti-ccp', testCode: 'ACCP-121', name: 'Anti-Cyclic Citrullinated Peptide (Anti-CCP Antibodies)', shortName: 'Anti-CCP (Arthritis)', category: 'IMMUNOLOGY', categoryLabel: 'Joints', specimen: 'Serum', fasting: false, tatHours: 12 },
  { id: 'lab-ana', testCode: 'ANA-122', name: 'Antinuclear Antibody (ANA by IFA on Hep-2 Cells)', shortName: 'ANA IFA (Lupus)', category: 'IMMUNOLOGY', categoryLabel: 'Autoimmune', specimen: 'Serum', fasting: false, tatHours: 24 },
  { id: 'lab-aso', testCode: 'ASO-123', name: 'Anti-Streptolysin O Titer (ASO Quantitative)', shortName: 'ASO Titer', category: 'IMMUNOLOGY', categoryLabel: 'Joints', specimen: 'Serum', fasting: false, tatHours: 4 },
  { id: 'lab-hla-b27', testCode: 'HLA-124', name: 'HLA-B27 PCR (Ankylosing Spondylitis / Spondyloarthritis)', shortName: 'HLA-B27 PCR', category: 'IMMUNOLOGY', categoryLabel: 'Joints', specimen: 'EDTA Whole Blood', fasting: false, tatHours: 48 },
  { id: 'lab-ige', testCode: 'IGE-125', name: 'Total Serum IgE (Allergy & Atopy Evaluation)', shortName: 'Total Serum IgE', category: 'IMMUNOLOGY', categoryLabel: 'Allergy', specimen: 'Serum', fasting: false, tatHours: 6 },

  // --- 10. CARDIAC & RADIOLOGY IMAGING (16 Tests) ---
  { id: 'lab-ecg', testCode: 'ECG-130', name: '12-Lead Electrocardiogram Resting (ECG Recording)', shortName: '12-Lead ECG', category: 'CARDIOLOGY', categoryLabel: 'Heart', specimen: 'Non-Invasive Surface Leads', fasting: false, tatHours: 1 },
  { id: 'lab-echo', testCode: 'ECHO-131', name: '2D Echocardiography with Color Doppler (2D Echo)', shortName: '2D Echocardiography', category: 'CARDIOLOGY', categoryLabel: 'Heart', specimen: 'Transthoracic Ultrasound', fasting: false, tatHours: 2 },
  { id: 'lab-tmt', testCode: 'TMT-132', name: 'Treadmill Exercise Stress Test (TMT / Stress ECG)', shortName: 'TMT (Stress Test)', category: 'CARDIOLOGY', categoryLabel: 'Heart', specimen: 'Exercise Protocol', fasting: true, tatHours: 2 },
  { id: 'lab-cxr', testCode: 'CXR-133', name: 'Chest X-Ray PA View (Digital Radiography / DR)', shortName: 'Chest X-Ray PA', category: 'RADIOLOGY', categoryLabel: 'Imaging', specimen: 'Digital X-Ray Film', fasting: false, tatHours: 1 },
  { id: 'lab-xray-kub', testCode: 'XRKUB-134', name: 'X-Ray KUB View (Kidneys, Ureters, Bladder Calculus)', shortName: 'X-Ray KUB', category: 'RADIOLOGY', categoryLabel: 'Imaging', specimen: 'Digital X-Ray Film', fasting: true, tatHours: 1 },
  { id: 'lab-xray-cerv', testCode: 'XRCERV-135', name: 'X-Ray Cervical Spine AP & Lateral Views', shortName: 'X-Ray Cervical Spine', category: 'RADIOLOGY', categoryLabel: 'Imaging', specimen: 'Digital X-Ray Film', fasting: false, tatHours: 1 },
  { id: 'lab-xray-lumb', testCode: 'XRLUMB-136', name: 'X-Ray Lumbar Spine AP & Lateral Views', shortName: 'X-Ray Lumbar Spine', category: 'RADIOLOGY', categoryLabel: 'Imaging', specimen: 'Digital X-Ray Film', fasting: false, tatHours: 1 },
  { id: 'lab-xray-knee', testCode: 'XRKNEE-137', name: 'X-Ray Bilateral Knee Joints Standing AP & Lat', shortName: 'X-Ray Both Knees', category: 'RADIOLOGY', categoryLabel: 'Imaging', specimen: 'Digital X-Ray Film', fasting: false, tatHours: 1 },
  { id: 'lab-xray-pns', testCode: 'XRPNS-138', name: 'X-Ray Paranasal Sinuses (PNS Water\'s View)', shortName: 'X-Ray PNS (Sinus)', category: 'RADIOLOGY', categoryLabel: 'Imaging', specimen: 'Digital X-Ray Film', fasting: false, tatHours: 1 },
  { id: 'lab-usg', testCode: 'USG-139', name: 'Ultrasound Whole Abdomen & Pelvis (USG Abdomen)', shortName: 'USG Whole Abdomen', category: 'RADIOLOGY', categoryLabel: 'Imaging', specimen: 'Full Bladder + 4Hr Fasting', fasting: true, tatHours: 2 },
  { id: 'lab-usg-kub', testCode: 'USGKUB-140', name: 'Ultrasound KUB with Post-Void Residual Volume (PVR)', shortName: 'USG KUB & Prostate', category: 'RADIOLOGY', categoryLabel: 'Imaging', specimen: 'Full Bladder', fasting: false, tatHours: 2 },
  { id: 'lab-usg-pelv', testCode: 'USGPEL-141', name: 'Ultrasound Pelvis / Transvaginal Scan (TVS / TAS)', shortName: 'USG Pelvis / TVS', category: 'RADIOLOGY', categoryLabel: 'Imaging', specimen: 'Pelvic Sonography', fasting: false, tatHours: 2 },
  { id: 'lab-usg-scrot', testCode: 'USGSCR-142', name: 'Ultrasound Scrotum with Color Doppler (Varicocele/Torsion)', shortName: 'USG Scrotal Doppler', category: 'RADIOLOGY', categoryLabel: 'Imaging', specimen: 'Color Doppler Sonography', fasting: false, tatHours: 2 },
  { id: 'lab-ct-brain', testCode: 'CTBR-143', name: 'CT Scan Brain Plain (Head Injury / Stroke / CVA)', shortName: 'CT Brain Plain', category: 'RADIOLOGY', categoryLabel: 'Imaging', specimen: 'Non-Contrast Multi-Slice CT', fasting: false, tatHours: 2 },
  { id: 'lab-hrct', testCode: 'HRCT-144', name: 'High Resolution CT Chest (HRCT Thorax ILD/Infection)', shortName: 'HRCT Chest Thorax', category: 'RADIOLOGY', categoryLabel: 'Imaging', specimen: 'Multi-Slice Spiral CT', fasting: false, tatHours: 3 },
  { id: 'lab-mri-brain', testCode: 'MRIBR-145', name: 'MRI Brain Plain with DWI & MRA Sequences', shortName: 'MRI Brain Plain', category: 'RADIOLOGY', categoryLabel: 'Imaging', specimen: '1.5T / 3T Magnetic Resonance', fasting: false, tatHours: 4 }
];

/**
 * 100+ Essential WHO ICD-10 Diagnoses for Indian General & Specialist OPD
 * Fully compliant with ABHA, NHA, and Insurance EMR requirements.
 */
export const INDIAN_100_ICD10_DIAGNOSIS_CATALOG: CommonDiagnosisItem[] = [
  // --- 1. RESPIRATORY & ENT (14 Diagnoses) ---
  {
    id: 'diag-uri',
    name: 'Acute Viral Upper Respiratory Infection (URI)',
    code: 'J06.9',
    icon: '🌡️',
    chipLabel: 'Viral Fever / URI',
    category: 'Respiratory',
    symptoms: ['fever', 'chills', 'sore throat', 'runny nose', 'sneezing', 'cough', 'bodyache', 'malaise', 'cold']
  },
  {
    id: 'diag-pharyngitis',
    name: 'Acute Pharyngitis & Tonsillitis',
    code: 'J02.9',
    icon: '🗣️',
    chipLabel: 'Pharyngitis & Tonsillitis',
    category: 'ENT',
    symptoms: ['sore throat', 'throat pain', 'difficulty swallowing', 'deglutition', 'tonsil', 'hoarseness']
  },
  {
    id: 'diag-bronchitis',
    name: 'Acute Bronchitis & Productive Cough',
    code: 'J20.9',
    icon: '🫁',
    chipLabel: 'Acute Bronchitis',
    category: 'Respiratory',
    symptoms: ['cough', 'phlegm', 'sputum', 'wet cough', 'chest congestion', 'bronchitis']
  },
  {
    id: 'diag-asthma',
    name: 'Bronchial Asthma with Acute Exacerbation',
    code: 'J45.9',
    icon: '💨',
    chipLabel: 'Bronchial Asthma',
    category: 'Respiratory',
    symptoms: ['wheeze', 'wheezing', 'shortness of breath', 'breathlessness', 'chest tightness', 'asthma', 'night cough']
  },
  {
    id: 'diag-copd',
    name: 'Chronic Obstructive Pulmonary Disease (COPD Exacerbation)',
    code: 'J44.1',
    icon: '🫁',
    chipLabel: 'COPD Exacerbation',
    category: 'Respiratory',
    symptoms: ['chronic cough', 'heavy smoking', 'breathlessness', 'exertional dyspnea', 'copd', 'purulent sputum']
  },
  {
    id: 'diag-pneumonia',
    name: 'Community Acquired Pneumonia (CAP)',
    code: 'J18.9',
    icon: '🔥',
    chipLabel: 'Pneumonia (CAP)',
    category: 'Respiratory',
    symptoms: ['high fever', 'chills', 'chest pain', 'rusty sputum', 'tachypnea', 'crackles', 'pneumonia']
  },
  {
    id: 'diag-rhinitis',
    name: 'Allergic Rhinitis & Pollen Sensitization',
    code: 'J30.9',
    icon: '🤧',
    chipLabel: 'Allergic Rhinitis',
    category: 'Allergy',
    symptoms: ['sneezing', 'nasal itching', 'watery eyes', 'clear rhinorrhea', 'nasal blockage', 'allergy']
  },
  {
    id: 'diag-sinusitis',
    name: 'Acute Frontal & Maxillary Sinusitis',
    code: 'J01.9',
    icon: '🤕',
    chipLabel: 'Acute Sinusitis',
    category: 'ENT',
    symptoms: ['facial pain', 'sinus heaviness', 'headache', 'post nasal drip', 'yellow nasal discharge', 'sinus']
  },
  {
    id: 'diag-laryngitis',
    name: 'Acute Laryngitis with Vocal Dysphonia',
    code: 'J04.0',
    icon: '🎙️',
    chipLabel: 'Laryngitis (Voice Loss)',
    category: 'ENT',
    symptoms: ['voice loss', 'hoarseness', 'husky voice', 'throat irritation', 'larynx pain']
  },
  {
    id: 'diag-otitis-media',
    name: 'Acute Suppurative Otitis Media (ASOM)',
    code: 'H66.9',
    icon: '👂',
    chipLabel: 'Otitis Media (Earache)',
    category: 'ENT',
    symptoms: ['ear pain', 'earache', 'ear discharge', 'hearing fullness', 'ear blocked']
  },
  {
    id: 'diag-otitis-externa',
    name: 'Otitis Externa (Swimmer\'s Ear Infection)',
    code: 'H60.9',
    icon: '👂',
    chipLabel: 'Otitis Externa',
    category: 'ENT',
    symptoms: ['ear canal itching', 'tragus tenderness', 'ear swelling', 'outer ear pain']
  },
  {
    id: 'diag-epistaxis',
    name: 'Acute Epistaxis (Anterior Nosebleed)',
    code: 'R04.0',
    icon: '🩸',
    chipLabel: 'Epistaxis (Nosebleed)',
    category: 'ENT',
    symptoms: ['nose bleeding', 'bleeding nose', 'epistaxis', 'nasal hemorrhage']
  },
  {
    id: 'diag-croup',
    name: 'Acute Viral Laryngotracheobronchitis (Croup)',
    code: 'J05.0',
    icon: '🐕',
    chipLabel: 'Croup / Stridor',
    category: 'Pediatrics',
    symptoms: ['barking cough', 'stridor', 'noisy breathing', 'retractions in child']
  },
  {
    id: 'diag-tb',
    name: 'Pulmonary Tuberculosis (Confirmed or Presumptive)',
    code: 'A15.0',
    icon: '🦠',
    chipLabel: 'Pulmonary Tuberculosis',
    category: 'Infectious',
    symptoms: ['cough > 2 weeks', 'hemoptysis', 'evening pyrexia', 'night sweats', 'weight loss', 'anorexia', 'tb']
  },

  // --- 2. GASTROINTESTINAL & HEPATOBILIARY (13 Diagnoses) ---
  {
    id: 'diag-gastro',
    name: 'Acute Gastroenteritis & Diarrheal Illness',
    code: 'A09',
    icon: '💧',
    chipLabel: 'Acute Gastroenteritis',
    category: 'Gastroenterology',
    symptoms: ['loose motion', 'loose stools', 'watery diarrhea', 'vomiting', 'cramps', 'stomach infection', 'gastro']
  },
  {
    id: 'diag-gerd',
    name: 'GERD & Acid Peptic Dyspepsia',
    code: 'K21.9',
    icon: '⚡',
    chipLabel: 'GERD & Acidity',
    category: 'Gastroenterology',
    symptoms: ['acidity', 'gas', 'heartburn', 'chest burning', 'sour belching', 'indigestion', 'bloating', 'reflux']
  },
  {
    id: 'diag-gastritis',
    name: 'Acute Erosive Gastritis & Peptic Ulcer Disease',
    code: 'K29.7',
    icon: '🔥',
    chipLabel: 'Gastritis / Ulcer',
    category: 'Gastroenterology',
    symptoms: ['epigastric pain', 'stomach burning', 'severe nausea', 'hunger pain', 'gastric ulcer']
  },
  {
    id: 'diag-ibs',
    name: 'Irritable Bowel Syndrome (IBS Diarrhea/Constipation)',
    code: 'K58.9',
    icon: '🔄',
    chipLabel: 'Irritable Bowel (IBS)',
    category: 'Gastroenterology',
    symptoms: ['alternating constipation', 'mucus in stool', 'stress bloating', 'crampy bowel', 'incomplete evacuation']
  },
  {
    id: 'diag-constipation',
    name: 'Functional Constipation & Fecal Impaction',
    code: 'K59.0',
    icon: '🧱',
    chipLabel: 'Chronic Constipation',
    category: 'Gastroenterology',
    symptoms: ['hard stools', 'straining', 'infrequent bowel', 'constipation', 'abdominal fullness']
  },
  {
    id: 'diag-hemorrhoids',
    name: 'Hemorrhoids (Piles) & Perianal Fissure',
    code: 'K64.9',
    icon: '🩸',
    chipLabel: 'Hemorrhoids / Piles',
    category: 'Colorectal',
    symptoms: ['piles', 'rectal bleeding', 'painful defecation', 'anal fissure', 'perianal pain', 'fresh blood in stool']
  },
  {
    id: 'diag-cholecystitis',
    name: 'Calculous Cholecystitis & Biliary Colic',
    code: 'K80.2',
    icon: '🪨',
    chipLabel: 'Gallstones / Cholecystitis',
    category: 'Gastroenterology',
    symptoms: ['right upper quadrant pain', 'murphy sign', 'gallstone pain', 'fatty food intolerance', 'vomiting']
  },
  {
    id: 'diag-fatty-liver',
    name: 'Non-Alcoholic Fatty Liver Disease (NAFLD / Steatosis)',
    code: 'K76.0',
    icon: '🟡',
    chipLabel: 'Fatty Liver (NAFLD)',
    category: 'Hepatology',
    symptoms: ['fatty liver', 'elevated sgot sgpt', 'right hypochondriac fullness', 'sluggish digestion', 'metabolic syndrome']
  },
  {
    id: 'diag-hepatitis-a',
    name: 'Acute Viral Hepatitis (Infectious Jaundice)',
    code: 'B15.9',
    icon: '🟡',
    chipLabel: 'Viral Hepatitis / Jaundice',
    category: 'Hepatology',
    symptoms: ['jaundice', 'yellow sclera', 'dark yellow urine', 'anorexia', 'pale stools', 'high bilirubin']
  },
  {
    id: 'diag-pancreatitis',
    name: 'Acute Pancreatitis with Epigastric Radiating Pain',
    code: 'K85.9',
    icon: '💥',
    chipLabel: 'Acute Pancreatitis',
    category: 'Gastroenterology',
    symptoms: ['severe epigastric pain', 'pain radiating to back', 'intractable vomiting', 'high amylase lipase']
  },
  {
    id: 'diag-appendicitis',
    name: 'Acute Appendicitis (RIF McBurney Tenderness)',
    code: 'K35.8',
    icon: '🚨',
    chipLabel: 'Acute Appendicitis',
    category: 'Surgery',
    symptoms: ['right lower abdomen pain', 'rebound tenderness', 'mcburney pain', 'fever nausea', 'appendicitis']
  },
  {
    id: 'diag-dysentery',
    name: 'Amoebic & Bacillary Dysentery',
    code: 'A06.0',
    icon: '🩸',
    chipLabel: 'Dysentery (Blood/Mucus)',
    category: 'Infectious',
    symptoms: ['blood in loose stool', 'mucus stool', 'tenesmus', 'griping abdominal pain', 'dysentery']
  },
  {
    id: 'diag-worm',
    name: 'Intestinal Helminthiasis (Worm Infestation)',
    code: 'B82.9',
    icon: '🪱',
    chipLabel: 'Worm Infestation',
    category: 'Pediatrics',
    symptoms: ['perianal itching at night', 'grinding teeth', 'abdominal pica', 'worm in stool', 'poor appetite']
  },

  // --- 3. INFECTIOUS & FEVERS (11 Diagnoses) ---
  {
    id: 'diag-typhoid',
    name: 'Typhoid Fever / Enteric Infection',
    code: 'A01.0',
    icon: '🦠',
    chipLabel: 'Typhoid / Enteric Fever',
    category: 'Infectious',
    symptoms: ['typhoid', 'step ladder fever', 'continuous fever', 'headache', 'coated tongue', 'widal positive']
  },
  {
    id: 'diag-dengue',
    name: 'Dengue Fever without Warning Signs',
    code: 'A90',
    icon: '🦟',
    chipLabel: 'Dengue Fever',
    category: 'Infectious',
    symptoms: ['dengue', 'breakbone fever', 'retro-orbital headache', 'severe bodyache', 'petechiae', 'low platelets']
  },
  {
    id: 'diag-dengue-ws',
    name: 'Dengue with Warning Signs / DHF',
    code: 'A91',
    icon: '⚠️',
    chipLabel: 'Dengue Warning Signs',
    category: 'Infectious',
    symptoms: ['persistent vomiting', 'severe abdominal pain', 'fluid accumulation', 'mucosal bleeding', 'rapid platelet drop']
  },
  {
    id: 'diag-malaria-pv',
    name: 'Malaria Infection (P. Vivax / Falciparum)',
    code: 'B54',
    icon: '🦟',
    chipLabel: 'Malaria (Pv / Pf)',
    category: 'Infectious',
    symptoms: ['malaria', 'chills and rigor', 'high fever spikes', 'profuse sweating', 'splenomegaly', 'shivering']
  },
  {
    id: 'diag-chikungunya',
    name: 'Chikungunya Viral Arthropathy',
    code: 'A92.0',
    icon: '🦴',
    chipLabel: 'Chikungunya Fever',
    category: 'Infectious',
    symptoms: ['chikungunya', 'debilitating joint pain', 'fever with rash', 'wrist ankle swelling', 'severe arthralgia']
  },
  {
    id: 'diag-puo',
    name: 'Pyrexia of Unknown Origin (Undifferentiated Acute Fever)',
    code: 'R50.9',
    icon: '🌡️',
    chipLabel: 'PUO / Undifferentiated Fever',
    category: 'Infectious',
    symptoms: ['fever', 'pyrexia', 'body temperature high', 'sweats', 'fever spikes', 'shivering']
  },
  {
    id: 'diag-scrub-typhus',
    name: 'Scrub Typhus (Orientia Tsutsugamushi)',
    code: 'A75.3',
    icon: '🕷️',
    chipLabel: 'Scrub Typhus',
    category: 'Infectious',
    symptoms: ['eschar', 'black scab', 'fever with lymphadenopathy', 'mite bite', 'scrub typhus']
  },
  {
    id: 'diag-varicella',
    name: 'Varicella Zoster Infection (Chickenpox)',
    code: 'B01.9',
    icon: '🫧',
    chipLabel: 'Chickenpox (Varicella)',
    category: 'Infectious',
    symptoms: ['itchy blisters', 'dew drop on rose petal rash', 'fever with vesicles', 'chickenpox', 'crusting rash']
  },
  {
    id: 'diag-herpes-zoster',
    name: 'Herpes Zoster (Shingles Dermatomal Pain)',
    code: 'B02.9',
    icon: '⚡',
    chipLabel: 'Herpes Zoster (Shingles)',
    category: 'Neurology',
    symptoms: ['shingles', 'unilateral dermatomal rash', 'burning nerve pain', 'grouped vesicles on rib', 'post herpetic neuralgia']
  },
  {
    id: 'diag-measles',
    name: 'Measles Morbillivirus Infection',
    code: 'B05.9',
    icon: '🔴',
    chipLabel: 'Measles (Koplik Spots)',
    category: 'Pediatrics',
    symptoms: ['koplik spots', 'maculopapular rash', 'cough coryza conjunctivitis', 'high fever rash']
  },
  {
    id: 'diag-sepsis',
    name: 'Systemic Inflammatory Response / Sepsis',
    code: 'A41.9',
    icon: '🚨',
    chipLabel: 'Sepsis (Systemic Infection)',
    category: 'Critical Care',
    symptoms: ['altered sensorium', 'hypotension', 'hypothermia', 'severe tachycardia', 'tachypnea', 'prostration']
  },

  // --- 4. CARDIOVASCULAR & METABOLIC (11 Diagnoses) ---
  {
    id: 'diag-htn',
    name: 'Essential Primary Hypertension (Stage 1/2)',
    code: 'I10',
    icon: '❤️',
    chipLabel: 'Essential Hypertension',
    category: 'Cardiology',
    symptoms: ['high bp', 'hypertension', 'blood pressure high', 'occipital headache', 'head heaviness', 'dizziness']
  },
  {
    id: 'diag-t2dm',
    name: 'Type 2 Diabetes Mellitus without Complications',
    code: 'E11.9',
    icon: '🩸',
    chipLabel: 'Type 2 Diabetes',
    category: 'Endocrinology',
    symptoms: ['high sugar', 'diabetes', 'sugar test high', 'excessive thirst', 'frequent urination', 'weight loss', 'polyuria']
  },
  {
    id: 'diag-t1dm',
    name: 'Type 1 Diabetes Mellitus with Ketoacidosis Risk',
    code: 'E10.9',
    icon: '💉',
    chipLabel: 'Type 1 Diabetes (Childhood)',
    category: 'Endocrinology',
    symptoms: ['young age diabetes', 'insulin dependent', 'rapid wasting', 'dka risk', 'ketones']
  },
  {
    id: 'diag-dyslipidemia',
    name: 'Pure Hypercholesterolemia & Dyslipidemia',
    code: 'E78.0',
    icon: '🧈',
    chipLabel: 'Dyslipidemia / Cholesterol',
    category: 'Cardiology',
    symptoms: ['high cholesterol', 'high triglycerides', 'dyslipidemia', 'lipid abnormal', 'atherosclerosis risk']
  },
  {
    id: 'diag-ihd',
    name: 'Chronic Ischemic Heart Disease / Stable Angina',
    code: 'I25.9',
    icon: '💔',
    chipLabel: 'Ischemic Heart Disease (IHD)',
    category: 'Cardiology',
    symptoms: ['chest pain', 'chest heaviness', 'retrosternal pressure', 'angina on walking', 'radiation to left shoulder', 'sweating']
  },
  {
    id: 'diag-chf',
    name: 'Congestive Heart Failure with Fluid Overload',
    code: 'I50.9',
    icon: '🌊',
    chipLabel: 'Congestive Heart Failure',
    category: 'Cardiology',
    symptoms: ['bilateral pedal edema', 'orthopnea', 'pnd waking at night', 'swollen ankles', 'shortness of breath lying flat']
  },
  {
    id: 'diag-palpitations',
    name: 'Paroxysmal Supraventricular Tachycardia / Palpitations',
    code: 'R00.2',
    icon: '💓',
    chipLabel: 'Palpitations / Tachycardia',
    category: 'Cardiology',
    symptoms: ['palpitations', 'racing heart', 'fluttering chest', 'irregular heartbeat', 'anxiety pounding']
  },
  {
    id: 'diag-dvt',
    name: 'Deep Vein Thrombosis of Lower Extremity (DVT)',
    code: 'I80.2',
    icon: '🦵',
    chipLabel: 'Deep Vein Thrombosis (DVT)',
    category: 'Vascular',
    symptoms: ['unilateral calf swelling', 'calf tenderness on dorsiflexion', 'homan sign', 'warm swollen leg']
  },
  {
    id: 'diag-hypotension',
    name: 'Orthostatic Postural Hypotension / Syncope',
    code: 'I95.1',
    icon: '📉',
    chipLabel: 'Postural Hypotension / Faint',
    category: 'Cardiology',
    symptoms: ['blackout on standing', 'fainting', 'syncope', 'low bp', 'lightheadedness', 'giddiness']
  },
  {
    id: 'diag-hypothyroid',
    name: 'Primary Hypothyroidism (Hashimoto\'s)',
    code: 'E03.9',
    icon: '🐢',
    chipLabel: 'Primary Hypothyroidism',
    category: 'Endocrinology',
    symptoms: ['weight gain', 'cold intolerance', 'constipation', 'dry skin', 'hair fall', 'lethargy', 'high tsh', 'thyroid low']
  },
  {
    id: 'diag-hyperthyroid',
    name: 'Hyperthyroidism & Thyrotoxicosis',
    code: 'E05.9',
    icon: '⚡',
    chipLabel: 'Hyperthyroidism / Toxic',
    category: 'Endocrinology',
    symptoms: ['weight loss', 'heat intolerance', 'tremors', 'fine hand tremor', 'palpitations', 'insomnia', 'low tsh']
  },

  // --- 5. NEUROLOGY & HEADACHES (9 Diagnoses) ---
  {
    id: 'diag-migraine',
    name: 'Migraine without Aura & Hemicrania',
    code: 'G43.9',
    icon: '🤕',
    chipLabel: 'Migraine Headache',
    category: 'Neurology',
    symptoms: ['migraine', 'one sided headache', 'pulsating head pain', 'photophobia', 'nausea with headache', 'vomiting headache']
  },
  {
    id: 'diag-tension-headache',
    name: 'Tension-Type Headache & Stress Band Pain',
    code: 'G44.2',
    icon: '🧠',
    chipLabel: 'Tension Headache',
    category: 'Neurology',
    symptoms: ['tight band headache', 'dull aching head', 'stress headache', 'forehead pressure', 'scalp tenderness']
  },
  {
    id: 'diag-vertigo',
    name: 'Benign Paroxysmal Positional Vertigo (BPPV / Labyrinthitis)',
    code: 'H81.1',
    icon: '🌀',
    chipLabel: 'BPPV / Peripheral Vertigo',
    category: 'Neurology',
    symptoms: ['vertigo', 'room spinning', 'dizziness on turning head', 'nausea', 'unsteadiness', 'giddiness']
  },
  {
    id: 'diag-seizure',
    name: 'Generalized Tonic-Clonic Epilepsy / Seizure Disorder',
    code: 'G40.9',
    icon: '⚡',
    chipLabel: 'Epilepsy / Seizures',
    category: 'Neurology',
    symptoms: ['fits', 'seizures', 'convulsions', 'loss of consciousness', 'tongue bite', 'urinary incontinence during fit']
  },
  {
    id: 'diag-bell-palsy',
    name: 'Bell\'s Palsy (Idiopathic Facial Nerve Paralysis)',
    code: 'G51.0',
    icon: '😐',
    chipLabel: 'Bell\'s Palsy (Facial)',
    category: 'Neurology',
    symptoms: ['facial drooping', 'inability to close eye', 'mouth deviation', 'drooling', 'loss of forehead wrinkling']
  },
  {
    id: 'diag-stroke-tia',
    name: 'Transient Ischemic Attack (TIA / Warning Stroke)',
    code: 'G45.9',
    icon: '🚨',
    chipLabel: 'TIA / Stroke Warning',
    category: 'Neurology',
    symptoms: ['sudden weakness one side', 'arm weakness', 'speech slurring', 'face numbness', 'fast criteria']
  },
  {
    id: 'diag-sciatica',
    name: 'Sciatica & Lumbar Radiculopathy',
    code: 'M54.3',
    icon: '⚡',
    chipLabel: 'Sciatica (Nerve Pain)',
    category: 'Neurology',
    symptoms: ['sciatica', 'shooting leg pain', 'back pain radiating to foot', 'electric shock sensation in leg', 'tingling toes']
  },
  {
    id: 'diag-cts',
    name: 'Carpal Tunnel Syndrome (Median Nerve Compression)',
    code: 'G56.0',
    icon: '🖐️',
    chipLabel: 'Carpal Tunnel Syndrome',
    category: 'Neurology',
    symptoms: ['tingling in thumb and fingers', 'night hand numbness', 'dropping objects', 'thenar weakness']
  },
  {
    id: 'diag-insomnia',
    name: 'Primary Chronic Insomnia & Sleep Disruption',
    code: 'G47.0',
    icon: '🌙',
    chipLabel: 'Chronic Insomnia',
    category: 'Psychiatry',
    symptoms: ['cannot sleep', 'insomnia', 'waking up early', 'unrefreshing sleep', 'daytime fatigue']
  },

  // --- 6. MUSCULOSKELETAL & ORTHOPEDICS (9 Diagnoses) ---
  {
    id: 'diag-oa',
    name: 'Osteoarthritis & Knee / Joint Degeneration',
    code: 'M19.9',
    icon: '🦴',
    chipLabel: 'Knee Osteoarthritis',
    category: 'Orthopedics',
    symptoms: ['knee pain', 'joint pain', 'stiffness on sitting', 'crepitus', 'difficulty climbing stairs', 'knee swelling', 'joint ache']
  },
  {
    id: 'diag-lba',
    name: 'Lumbago & Acute Mechanical Lower Back Strain',
    code: 'M54.5',
    icon: '🧍',
    chipLabel: 'Lower Back Pain (LBA)',
    category: 'Orthopedics',
    symptoms: ['back pain', 'lower backache', 'lumbar spasm', 'back stiffness', 'pain on bending']
  },
  {
    id: 'diag-cervical',
    name: 'Cervical Spondylosis & Neck Muscle Spasm',
    code: 'M47.8',
    icon: '🦒',
    chipLabel: 'Cervical Spondylosis',
    category: 'Orthopedics',
    symptoms: ['neck pain', 'neck stiffness', 'shoulder blade ache', 'trapezius spasm', 'dizziness on looking up']
  },
  {
    id: 'diag-gout',
    name: 'Acute Gouty Arthritis & Podagra',
    code: 'M10.9',
    icon: '🦶',
    chipLabel: 'Gout (Uric Acid Attack)',
    category: 'Rheumatology',
    symptoms: ['great toe pain', 'swollen red big toe', 'high uric acid', 'excruciating joint inflammation overnight', 'podagra']
  },
  {
    id: 'diag-ra',
    name: 'Rheumatoid Polyarthritis (Seropositive)',
    code: 'M05.9',
    icon: '🤲',
    chipLabel: 'Rheumatoid Arthritis',
    category: 'Rheumatology',
    symptoms: ['bilateral wrist finger pain', 'morning stiffness > 1 hour', 'swollen mcp pip joints', 'swan neck deformity']
  },
  {
    id: 'diag-frozen-shoulder',
    name: 'Adhesive Capsulitis (Frozen Shoulder)',
    code: 'M75.0',
    icon: '🦾',
    chipLabel: 'Frozen Shoulder',
    category: 'Orthopedics',
    symptoms: ['shoulder restriction', 'cannot raise arm', 'night shoulder pain', 'inability to comb hair', 'stiff shoulder']
  },
  {
    id: 'diag-plantar',
    name: 'Plantar Fasciitis & Calcaneal Spur Pain',
    code: 'M72.2',
    icon: '👣',
    chipLabel: 'Plantar Fasciitis (Heel Pain)',
    category: 'Orthopedics',
    symptoms: ['first step morning heel pain', 'heel ache', 'pain walking on barefoot', 'calcaneal spur']
  },
  {
    id: 'diag-sprain',
    name: 'Acute Ankle / Ligament Sprain & Contusion',
    code: 'S93.4',
    icon: '🤕',
    chipLabel: 'Ankle Sprain / Twisting',
    category: 'Orthopedics',
    symptoms: ['twisted ankle', 'sudden swelling after trip', 'bruising ankle', 'cannot bear weight']
  },
  {
    id: 'diag-fibro',
    name: 'Fibromyalgia & Generalized Myofascial Pain',
    code: 'M79.7',
    icon: '⚡',
    chipLabel: 'Fibromyalgia / Body Pain',
    category: 'Rheumatology',
    symptoms: ['generalized bodyache', 'tender points', 'widespread muscle pain', 'chronic fatigue', 'brain fog']
  },

  // --- 7. GENITOURINARY & RENAL (8 Diagnoses) ---
  {
    id: 'diag-uti',
    name: 'Acute Urinary Tract Infection (Cystitis / UTI)',
    code: 'N39.0',
    icon: '🚽',
    chipLabel: 'Urinary Tract Infection (UTI)',
    category: 'Urology',
    symptoms: ['burning urine', 'dysuria', 'frequent urination', 'urinary urgency', 'lower abdominal pain', 'cloudy urine', 'uti']
  },
  {
    id: 'diag-renal-stone',
    name: 'Calculus of Kidney & Ureter (Renal Colic)',
    code: 'N20.1',
    icon: '🪨',
    chipLabel: 'Renal Stone (Kidney Colic)',
    category: 'Urology',
    symptoms: ['flank pain', 'severe loin to groin pain', 'blood in urine', 'hematuria', 'vomiting with kidney pain', 'kidney stone']
  },
  {
    id: 'diag-bph',
    name: 'Benign Prostatic Hyperplasia (BPH Prostatomegaly)',
    code: 'N40.1',
    icon: '💧',
    chipLabel: 'BPH / Enlarged Prostate',
    category: 'Urology',
    symptoms: ['poor urine stream', 'hesitancy', 'nocturia waking at night', 'dribbling after urine', 'prostate enlargement']
  },
  {
    id: 'diag-pyelo',
    name: 'Acute Pyelonephritis (Upper UTI with Flank Rigor)',
    code: 'N10',
    icon: '🔥',
    chipLabel: 'Acute Pyelonephritis',
    category: 'Urology',
    symptoms: ['high fever with rigor', 'costovertebral angle tenderness', 'severe loin tenderness', 'nausea with uti']
  },
  {
    id: 'diag-vaginitis',
    name: 'Candidal & Bacterial Vaginitis / Leucorrhea',
    code: 'N76.0',
    icon: '🌸',
    chipLabel: 'Vaginitis / Leucorrhea',
    category: 'Gynecology',
    symptoms: ['white discharge', 'vaginal itching', 'curdy white discharge', 'burning sensation', 'foul odor']
  },
  {
    id: 'diag-pcos',
    name: 'Polycystic Ovarian Syndrome (PCOS / PCOD)',
    code: 'E28.2',
    icon: '⭕',
    chipLabel: 'PCOS / PCOD',
    category: 'Gynecology',
    symptoms: ['irregular periods', 'delayed menses', 'facial hair acne', 'hirsutism', 'weight gain in female', 'pcod']
  },
  {
    id: 'diag-dysmenorrhea',
    name: 'Primary Dysmenorrhea & Menstrual Cramps',
    code: 'N94.6',
    icon: '🩸',
    chipLabel: 'Dysmenorrhea (Period Pain)',
    category: 'Gynecology',
    symptoms: ['severe period cramps', 'pain during menses', 'lower back cramps', 'menstrual pain']
  },
  {
    id: 'diag-aub',
    name: 'Abnormal Uterine Bleeding (Menorrhagia)',
    code: 'N93.9',
    icon: '🩸',
    chipLabel: 'Heavy Bleeding (AUB)',
    category: 'Gynecology',
    symptoms: ['heavy periods', 'clots in menses', 'prolonged bleeding', 'frequent menses', 'menorrhagia']
  },

  // --- 8. DERMATOLOGY & ALLERGIES (8 Diagnoses) ---
  {
    id: 'diag-tinea',
    name: 'Tinea Corporis & Cruris (Fungal Ringworm)',
    code: 'B35.9',
    icon: '🍄',
    chipLabel: 'Fungal Infection (Tinea)',
    category: 'Dermatology',
    symptoms: ['fungal ring', 'itchy groin', 'red ring on skin', 'severe itching in folds', 'dermatophyte infection', 'daadh']
  },
  {
    id: 'diag-scabies',
    name: 'Scabies Sarcoptic Mite Infestation',
    code: 'B86',
    icon: '🕷️',
    chipLabel: 'Scabies Infestation',
    category: 'Dermatology',
    symptoms: ['intense night itching', 'web spaces of fingers rash', 'burrows on wrist', 'family members itching']
  },
  {
    id: 'diag-urticaria',
    name: 'Acute Allergic Urticaria & Angioedema',
    code: 'L50.9',
    icon: '🔴',
    chipLabel: 'Urticaria (Allergic Hives)',
    category: 'Allergy',
    symptoms: ['itchy wheals', 'hives', 'red raised rash', 'allergy swellings', 'pitta rash', 'sudden skin bumps']
  },
  {
    id: 'diag-eczema',
    name: 'Atopic Dermatitis & Lichenified Eczema',
    code: 'L20.9',
    icon: '🧴',
    chipLabel: 'Atopic Eczema',
    category: 'Dermatology',
    symptoms: ['dry scaly skin', 'flexural rash behind knees', 'chronic itching', 'lichenified patches', 'eczema']
  },
  {
    id: 'diag-acne',
    name: 'Acne Vulgaris (Papulopustular Face Lesions)',
    code: 'L70.0',
    icon: '✨',
    chipLabel: 'Acne Vulgaris (Pimples)',
    category: 'Dermatology',
    symptoms: ['pimples', 'face acne', 'blackheads whiteheads', 'pus filled spots on cheeks', 'cystic lesions']
  },
  {
    id: 'diag-cellulitis',
    name: 'Acute Bacterial Cellulitis & Erysipelas',
    code: 'L03.9',
    icon: '🔥',
    chipLabel: 'Cellulitis (Skin Infection)',
    category: 'Dermatology',
    symptoms: ['red hot swollen leg', 'spreading redness on skin', 'fever with skin warmth', 'cellulitis', 'bacterial skin pain']
  },
  {
    id: 'diag-psoriasis',
    name: 'Plaque Psoriasis with Silvery Scales',
    code: 'L40.0',
    icon: '⚪',
    chipLabel: 'Plaque Psoriasis',
    category: 'Dermatology',
    symptoms: ['silvery scales', 'red plaques on elbows knees', 'auspitz sign', 'psoriasis patches', 'thick dry skin']
  },
  {
    id: 'diag-alopecia',
    name: 'Alopecia Areata & Telogen Effluvium',
    code: 'L65.9',
    icon: '💇',
    chipLabel: 'Hair Loss (Alopecia)',
    category: 'Dermatology',
    symptoms: ['patchy hair loss', 'coin shaped bald patch', 'excessive hair fall in bunch', 'alopecia']
  },

  // --- 9. HEMATOLOGY & GENERAL SIGNS (8 Diagnoses) ---
  {
    id: 'diag-anemia',
    name: 'Iron Deficiency Nutritional Anemia',
    code: 'D50.9',
    icon: '🩸',
    chipLabel: 'Iron Deficiency Anemia',
    category: 'Hematology',
    symptoms: ['low hemoglobin', 'fatigue', 'extreme tiredness', 'pale conjunctiva', 'breathlessness on walking', 'anemia', 'weakness']
  },
  {
    id: 'diag-b12-def',
    name: 'Vitamin B12 Deficiency & Peripheral Neuropathy',
    code: 'E53.8',
    icon: '⚡',
    chipLabel: 'Vitamin B12 Deficiency',
    category: 'Hematology',
    symptoms: ['tingling numbness in hands feet', 'burning soles of feet', 'gait unsteadiness', 'mouth ulcers', 'b12 low']
  },
  {
    id: 'diag-vitd-def',
    name: 'Vitamin D Deficiency & Osteopenia',
    code: 'E55.9',
    icon: '☀️',
    chipLabel: 'Vitamin D Deficiency',
    category: 'Endocrinology',
    symptoms: ['bone ache', 'fatigue', 'low back pain', 'muscle weakness', 'vit d low', 'osteopenia']
  },
  {
    id: 'diag-thrombocytopenia',
    name: 'Thrombocytopenia (Isolated Low Platelet Count)',
    code: 'D69.6',
    icon: '🩸',
    chipLabel: 'Thrombocytopenia',
    category: 'Hematology',
    symptoms: ['low platelets', 'gum bleeding', 'easy bruising', 'petechiae on legs', 'platelet dropped']
  },
  {
    id: 'diag-anxiety',
    name: 'Generalized Anxiety Disorder & Panic Attacks',
    code: 'F41.1',
    icon: '😰',
    chipLabel: 'Generalized Anxiety',
    category: 'Psychiatry',
    symptoms: ['restlessness', 'palpitations from worry', 'nervousness', 'panic sensation', 'excessive fear', 'anxiety']
  },
  {
    id: 'diag-depression',
    name: 'Major Depressive Episode (Mild to Moderate)',
    code: 'F32.9',
    icon: '🌧️',
    chipLabel: 'Depression / Low Mood',
    category: 'Psychiatry',
    symptoms: ['low mood', 'loss of interest', 'crying spells', 'anhedonia', 'hopelessness', 'chronic sad mood']
  },
  {
    id: 'diag-fatigue',
    name: 'Chronic Fatigue & Post-Viral Convalescence',
    code: 'R53.8',
    icon: '🔋',
    chipLabel: 'General Malaise / Fatigue',
    category: 'General',
    symptoms: ['weakness', 'fatigue', 'exhaustion', 'tired all day', 'post viral weakness', 'malaise']
  },
  {
    id: 'diag-weight-loss',
    name: 'Unintentional Weight Loss & Cachexia',
    code: 'R63.4',
    icon: '📉',
    chipLabel: 'Unintentional Weight Loss',
    category: 'General',
    symptoms: ['weight loss without diet', 'clothes getting loose', 'loss of appetite', 'wasting']
  }
];

/**
 * Intelligent Symptom-to-ICD-10 Matcher
 * Maps natural Hindi/English doctor speech or symptom input into an ABHA-compliant ICD-10 Diagnosis.
 */
export function matchSymptomToICD10(inputText: string): CommonDiagnosisItem | null {
  if (!inputText || !inputText.trim()) return null;
  const q = inputText.toLowerCase().trim();

  // 1. Direct code match (e.g. "J06.9", "E11.9", "I10", "A09", "A90")
  const directCode = INDIAN_100_ICD10_DIAGNOSIS_CATALOG.find((d) => d.code.toLowerCase() === q);
  if (directCode) return directCode;

  // 2. Direct name or chipLabel match
  const directName = INDIAN_100_ICD10_DIAGNOSIS_CATALOG.find(
    (d) => d.name.toLowerCase().includes(q) || d.chipLabel.toLowerCase().includes(q)
  );
  if (directName) return directName;

  // 3. Highest scoring symptom alias match
  let bestMatch: CommonDiagnosisItem | null = null;
  let bestScore = 0;

  for (const diag of INDIAN_100_ICD10_DIAGNOSIS_CATALOG) {
    let score = 0;
    for (const sym of diag.symptoms) {
      if (q.includes(sym) || sym.includes(q)) {
        score += sym.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = diag;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

export interface QuickCatalogDrug {
  id: string;
  name: string;
  genericName: string;
  strength: string;
  dosage: string;
  frequency: string;
  duration: number;
  beforeAfterFood: 'AFTER_FOOD' | 'BEFORE_FOOD' | 'BEDTIME' | 'EMPTY_STOMACH';
  instructions?: string;
  genericSubstituteName: string;
  brandPrice: number;
  janAushadhiPrice: number;
  category: string;
}

export const POPULAR_OPD_DRUGS: QuickCatalogDrug[] = [
  { id: 'drug-dolo650', name: 'Tab Dolo 650', genericName: 'Paracetamol', strength: '650mg', dosage: '1 Tab', frequency: '1 - 0 - 1', duration: 3, beforeAfterFood: 'AFTER_FOOD', instructions: 'Take with warm water after meals', genericSubstituteName: 'Jan Aushadhi Paracetamol 650mg', brandPrice: 42, janAushadhiPrice: 12, category: 'Fever & Pain' },
  { id: 'drug-pan40', name: 'Tab Pan 40', genericName: 'Pantoprazole', strength: '40mg', dosage: '1 Tab', frequency: '1 - 0 - 0', duration: 5, beforeAfterFood: 'EMPTY_STOMACH', instructions: 'Morning 30 mins before breakfast', genericSubstituteName: 'Jan Aushadhi Pantoprazole 40mg', brandPrice: 115, janAushadhiPrice: 18, category: 'Antacid' },
  { id: 'drug-pand', name: 'Cap Pan-D', genericName: 'Pantoprazole + Domperidone', strength: '40mg+30mg', dosage: '1 Cap', frequency: '1 - 0 - 0', duration: 7, beforeAfterFood: 'EMPTY_STOMACH', instructions: 'Morning before food', genericSubstituteName: 'Jan Aushadhi Panto-Dom SR', brandPrice: 175, janAushadhiPrice: 24, category: 'Antacid' },
  { id: 'drug-azithral500', name: 'Tab Azithral 500', genericName: 'Azithromycin', strength: '500mg', dosage: '1 Tab', frequency: '0 - 0 - 1', duration: 3, beforeAfterFood: 'AFTER_FOOD', instructions: 'Once daily at fixed evening time', genericSubstituteName: 'Jan Aushadhi Azithromycin 500mg', brandPrice: 128, janAushadhiPrice: 32, category: 'Antibiotic' },
  { id: 'drug-augmentin625', name: 'Tab Augmentin 625 Duo', genericName: 'Amoxycillin + Potassium Clavulanate', strength: '625mg', dosage: '1 Tab', frequency: '1 - 0 - 1', duration: 5, beforeAfterFood: 'AFTER_FOOD', instructions: 'Twice daily after meals', genericSubstituteName: 'Jan Aushadhi Amoxyclav 625mg', brandPrice: 205, janAushadhiPrice: 55, category: 'Antibiotic' },
  { id: 'drug-cetzine10', name: 'Tab Cetzine', genericName: 'Cetirizine HCl', strength: '10mg', dosage: '1 Tab', frequency: '0 - 0 - 1', duration: 5, beforeAfterFood: 'BEDTIME', instructions: 'At night before sleep', genericSubstituteName: 'Jan Aushadhi Cetirizine 10mg', brandPrice: 48, janAushadhiPrice: 6, category: 'Allergy' },
  { id: 'drug-montairlc', name: 'Tab Montair-LC', genericName: 'Montelukast + Levocetirizine', strength: '10mg+5mg', dosage: '1 Tab', frequency: '0 - 0 - 1', duration: 10, beforeAfterFood: 'BEDTIME', instructions: 'Night bedtime', genericSubstituteName: 'Jan Aushadhi Montelukast+Levo', brandPrice: 165, janAushadhiPrice: 28, category: 'Respiratory' },
  { id: 'drug-telma40', name: 'Tab Telma 40', genericName: 'Telmisartan', strength: '40mg', dosage: '1 Tab', frequency: '1 - 0 - 0', duration: 30, beforeAfterFood: 'AFTER_FOOD', instructions: 'Daily morning with water', genericSubstituteName: 'Jan Aushadhi Telmisartan 40mg', brandPrice: 145, janAushadhiPrice: 24, category: 'Blood Pressure' },
  { id: 'drug-amlong5', name: 'Tab Amlong 5', genericName: 'Amlodipine', strength: '5mg', dosage: '1 Tab', frequency: '0 - 0 - 1', duration: 30, beforeAfterFood: 'BEDTIME', instructions: 'Daily night bedtime', genericSubstituteName: 'Jan Aushadhi Amlodipine 5mg', brandPrice: 48, janAushadhiPrice: 9, category: 'Blood Pressure' },
  { id: 'drug-glycomet500', name: 'Tab Glycomet 500', genericName: 'Metformin HCl', strength: '500mg', dosage: '1 Tab', frequency: '1 - 0 - 1', duration: 30, beforeAfterFood: 'AFTER_FOOD', instructions: 'Immediately with or after meals', genericSubstituteName: 'Jan Aushadhi Metformin 500mg', brandPrice: 65, janAushadhiPrice: 14, category: 'Diabetes' },
  { id: 'drug-taximo200', name: 'Tab Taxim-O 200', genericName: 'Cefixime', strength: '200mg', dosage: '1 Tab', frequency: '1 - 0 - 1', duration: 5, beforeAfterFood: 'AFTER_FOOD', instructions: 'Complete full 5-day course', genericSubstituteName: 'Jan Aushadhi Cefixime 200mg', brandPrice: 180, janAushadhiPrice: 42, category: 'Antibiotic' },
  { id: 'drug-voveran50', name: 'Tab Voveran 50', genericName: 'Diclofenac Sodium', strength: '50mg', dosage: '1 Tab', frequency: '1 - 0 - 1', duration: 3, beforeAfterFood: 'AFTER_FOOD', instructions: 'Take only after food for pain', genericSubstituteName: 'Jan Aushadhi Diclofenac 50mg', brandPrice: 62, janAushadhiPrice: 8, category: 'Fever & Pain' },
  { id: 'drug-combiflam', name: 'Tab Combiflam', genericName: 'Ibuprofen + Paracetamol', strength: '400mg+325mg', dosage: '1 Tab', frequency: 'SOS', duration: 3, beforeAfterFood: 'AFTER_FOOD', instructions: 'Take after meals for fever/pain', genericSubstituteName: 'Jan Aushadhi Ibu+Paracetamol', brandPrice: 48, janAushadhiPrice: 9, category: 'Fever & Pain' },
  { id: 'drug-emeset4', name: 'Tab Emeset 4', genericName: 'Ondansetron MD', strength: '4mg', dosage: '1 Tab', frequency: '1 - 0 - 1', duration: 3, beforeAfterFood: 'BEFORE_FOOD', instructions: 'Dissolve in mouth 15 mins before food', genericSubstituteName: 'Jan Aushadhi Ondansetron 4mg', brandPrice: 58, janAushadhiPrice: 11, category: 'Nausea' },
  { id: 'drug-meftalspas', name: 'Tab Meftal-Spas', genericName: 'Mefenamic Acid + Dicyclomine', strength: '250mg+10mg', dosage: '1 Tab', frequency: 'SOS', duration: 2, beforeAfterFood: 'AFTER_FOOD', instructions: 'For acute abdominal spasmodic pain', genericSubstituteName: 'Jan Aushadhi Mefenamic+Dicyclo', brandPrice: 52, janAushadhiPrice: 12, category: 'Fever & Pain' },
  { id: 'drug-ascorild', name: 'Syp Ascoril-D', genericName: 'Dextromethorphan + Phenylephrine', strength: '100ml', dosage: '5 ml', frequency: '1 - 1 - 1', duration: 5, beforeAfterFood: 'AFTER_FOOD', instructions: 'Take 5ml thrice daily with warm water', genericSubstituteName: 'Jan Aushadhi Cough Syrup', brandPrice: 135, janAushadhiPrice: 35, category: 'Respiratory' },
  { id: 'drug-grilinctus', name: 'Syp Grilinctus-BM', genericName: 'Terbutaline + Bromhexine', strength: '100ml', dosage: '10 ml', frequency: '1 - 1 - 1', duration: 5, beforeAfterFood: 'AFTER_FOOD', instructions: 'Shake well before use', genericSubstituteName: 'Jan Aushadhi Cough Expectorant', brandPrice: 125, janAushadhiPrice: 32, category: 'Respiratory' },
  { id: 'drug-norfloxtz', name: 'Tab Norflox-TZ', genericName: 'Norfloxacin + Tinidazole', strength: '400mg+600mg', dosage: '1 Tab', frequency: '1 - 0 - 1', duration: 3, beforeAfterFood: 'AFTER_FOOD', instructions: 'Twice daily after food', genericSubstituteName: 'Jan Aushadhi Norflox-TZ', brandPrice: 110, janAushadhiPrice: 28, category: 'Antibiotic' },
  { id: 'drug-shelcal500', name: 'Tab Shelcal 500', genericName: 'Calcium Carbonate + Vit D3', strength: '500mg', dosage: '1 Tab', frequency: '0 - 1 - 0', duration: 30, beforeAfterFood: 'AFTER_FOOD', instructions: 'After lunch with water', genericSubstituteName: 'Jan Aushadhi Calcium 500mg', brandPrice: 132, janAushadhiPrice: 25, category: 'Supplements' },
  { id: 'drug-becosules', name: 'Cap Becosules', genericName: 'Vitamin B-Complex + Vitamin C', strength: 'Capsule', dosage: '1 Cap', frequency: '1 - 0 - 0', duration: 15, beforeAfterFood: 'AFTER_FOOD', instructions: 'Once daily after breakfast', genericSubstituteName: 'Jan Aushadhi B-Complex Forte', brandPrice: 55, janAushadhiPrice: 15, category: 'Supplements' },
  { id: 'drug-limcee', name: 'Tab Limcee 500', genericName: 'Vitamin C Chewable', strength: '500mg', dosage: '1 Tab', frequency: '0 - 1 - 0', duration: 15, beforeAfterFood: 'AFTER_FOOD', instructions: 'Chew 1 tablet daily', genericSubstituteName: 'Jan Aushadhi Vit C Chewable', brandPrice: 32, janAushadhiPrice: 10, category: 'Supplements' },
  { id: 'drug-ors', name: 'Sachet Electral ORS', genericName: 'Oral Rehydration Salts IP', strength: '21.8g', dosage: '1 Sachet in 1L Water', frequency: 'SOS / Frequent', duration: 3, beforeAfterFood: 'AFTER_FOOD', instructions: 'Mix full packet in 1 litre drinking water, sip continuously', genericSubstituteName: 'Jan Aushadhi ORS 21.8g', brandPrice: 24, janAushadhiPrice: 9, category: 'Rehydration' }
];

export interface CommonSymptomItem {
  id: string;
  chipLabel: string;
  icon: string;
  complaintText: string;
}

export const COMMON_OPD_SYMPTOMS: CommonSymptomItem[] = [
  { id: 'sym-fever', chipLabel: 'Fever 3 Days', icon: '🌡️', complaintText: 'High grade fever with chills and rigor for 3 days' },
  { id: 'sym-throat', chipLabel: 'Sore Throat & Cough', icon: '🗣️', complaintText: 'Dry hacking cough and painful throat deglutition for 4 days' },
  { id: 'sym-gerd', chipLabel: 'Acidity & Gas', icon: '⚡', complaintText: 'Severe retrosternal burning, sour belching and postprandial bloating' },
  { id: 'sym-headache', chipLabel: 'Frontal Headache', icon: '🤕', complaintText: 'Throbbing frontal headache and persistent generalised malaise' },
  { id: 'sym-gastro', chipLabel: 'Loose Stools & Cramps', icon: '💧', complaintText: 'Watery loose motions (4-5 episodes/day) with spasmodic cramps' },
  { id: 'sym-uti', chipLabel: 'Burning Urine', icon: '🚽', complaintText: 'Burning micturition, increased urinary frequency and pelvic discomfort' },
  { id: 'sym-bp', chipLabel: 'BP / Dizziness', icon: '❤️', complaintText: 'Occipital heaviness, elevated BP recordings, and exertion dizziness' },
  { id: 'sym-joint', chipLabel: 'Joint / Knee Pain', icon: '🦴', complaintText: 'Bilateral knee joint pain, morning stiffness and difficulty walking' },
  { id: 'sym-rash', chipLabel: 'Itching / Rash', icon: '🤧', complaintText: 'Pruritic erythematous skin rash with generalized itching' }
];

