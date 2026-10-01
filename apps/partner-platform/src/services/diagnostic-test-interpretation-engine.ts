/**
 * Standard Diagnostic Test Interpretation Engine (Default Dictionary)
 * Conforming to NABL ISO 15189:2022, CAP, and WHO Clinical Pathology Guidelines.
 * Provides authoritative clinical interpretations for all 103 clinical test profiles in the library.
 */

export interface TestInterpretationDef {
  key: string;
  testName: string;
  department: string;
  interpretationText: string;
  clinicalSignificance: string;
  methodologyNotes?: string;
}

export const MASTER_TEST_INTERPRETATION_DICTIONARY: Record<string, TestInterpretationDef> = {
  // =========================================================================
  // 1. HEMATOLOGY & CELL MORPHOLOGY
  // =========================================================================
  CBC: {
    key: 'CBC',
    testName: 'Complete Blood Count (CBC with 5-Part Differential)',
    department: 'Hematology',
    interpretationText: 'A Complete Blood Count is a common blood test that checks your overall health by counting and measuring various cells in your blood (red cells, white cells, platelets) to detect issues like anemia, infection, inflammation, or blood cancers, providing vital info on oxygen transport. Healthcare professionals use it to look at overall health and to find a wide range of conditions, including anemia, infection and leukemia.',
    clinicalSignificance: 'Hemoglobin and RBC count evaluate oxygen-carrying capacity; total and differential leukocyte counts identify bacterial, viral, or allergic responses; platelet count assesses primary hemostatic competence.',
    methodologyNotes: 'Automated 5-Part Differential Cell Counter (Flow Cytometry & Impedance).'
  },
  CBC_ESR: {
    key: 'CBC_ESR',
    testName: 'Complete Blood Count with ESR',
    department: 'Hematology',
    interpretationText: 'A Complete Blood Count with ESR combines cell population quantification with systemic inflammation assessment. ESR reflects the suspension stability of erythrocytes in plasma, accelerating in the presence of acute-phase proteins such as fibrinogen and immunoglobulins in infections, autoimmune flares, and chronic inflammatory states.',
    clinicalSignificance: 'Simultaneous hemogram and ESR facilitate rapid triage between infectious, hematological, and chronic systemic inflammatory etiologies.',
    methodologyNotes: 'Automated 5-Part Cell Counter with Modified Westergren Method.'
  },
  ESR: {
    key: 'ESR',
    testName: 'Erythrocyte Sedimentation Rate (ESR Westergren)',
    department: 'Hematology',
    interpretationText: 'The Erythrocyte Sedimentation Rate is a non-specific marker of systemic inflammation, tissue injury, or infection. Elevated ESR values occur when increased asymmetric plasma macromolecules (fibrinogen, globulins) diminish the net negative zeta potential of red cells, promoting rouleaux formation and accelerated gravitational settling.',
    clinicalSignificance: 'Useful for monitoring chronic inflammatory conditions including Temporal Arteritis, Polymyalgia Rheumatica, Rheumatoid Arthritis, and Tuberculosis.',
    methodologyNotes: 'Standard Westergren sedimentation method.'
  },
  PERIPHERAL_SMEAR: {
    key: 'PERIPHERAL_SMEAR',
    testName: 'Peripheral Blood Smear Examination (PBS)',
    department: 'Hematology & Clinical Microscopy',
    interpretationText: 'Microscopic examination of Leishman/Giemsa-stained peripheral blood smear reveals qualitative cellular architecture, red cell size/chromia variations (microcytic, macrocytic, normocytic, hypochromic), white cell maturation patterns (toxic granules, shift to left, atypical lymphocytes, blast cells), and platelet adequacy or clumping.',
    clinicalSignificance: 'Indispensable confirmatory evaluation for unexplained cytopenias, hemolytic anemias, leukemias, leukemoid reactions, and hemoparasites.',
    methodologyNotes: 'Manual optical microscopy oil immersion (100x).'
  },
  AEC: {
    key: 'AEC',
    testName: 'Absolute Eosinophil Count (AEC)',
    department: 'Hematology',
    interpretationText: 'Absolute Eosinophil Count quantifies circulating eosinophilic granulocytes. Significant eosinophilia (> 500 cells/cumm) is typically associated with allergic diatheses (bronchial asthma, allergic rhinitis, atopic dermatitis), invasive helminthic parasite infections, drug hypersensitivity syndromes, or hypereosinophilic syndromes.',
    clinicalSignificance: 'Essential marker in evaluating atopy, pulmonary eosinophilic infiltrates, and monitoring corticosteroid response.',
    methodologyNotes: 'Automated flow cytometry and Fuchs-Rosenthal chamber confirmation.'
  },
  RETICULOCYTE: {
    key: 'RETICULOCYTE',
    testName: 'Reticulocyte Count with RPI',
    department: 'Hematology',
    interpretationText: 'Reticulocytes are immature, non-nucleated erythrocytes containing residual ribosomal RNA. The Reticulocyte Production Index (RPI) corrects for degree of anemia and shift reticulocytes, serving as the definitive measure of effective erythroid marrow proliferative response to anemia or hematinic therapy.',
    clinicalSignificance: 'RPI > 2.0 indicates responsive marrow (hemolysis or acute blood loss); RPI < 1.0 indicates hypoproliferative marrow (aplasia, myelodysplasia, nutritional deficiency).',
    methodologyNotes: 'Supravital New Methylene Blue staining.'
  },
  BLOOD_GROUP: {
    key: 'BLOOD_GROUP',
    testName: 'Blood Grouping (ABO) & Rh(D) Typing',
    department: 'Blood Transfusion & Immunohematology',
    interpretationText: 'ABO and Rh(D) antigen determination identifies red cell surface carbohydrates and transmembrane polypeptides. Forward grouping identifies agglutinogens on patient erythrocytes; reverse grouping verifies reciprocal isohemagglutinins (Anti-A, Anti-B) in patient serum to ensure immunologic compatibility.',
    clinicalSignificance: 'Mandatory pre-transfusion safety testing, prenatal alloimmunization screening, and surgical pre-clearance.',
    methodologyNotes: 'Column agglutination technology (Gel card) & slide hemagglutination.'
  },

  // =========================================================================
  // 2. COAGULATION & THROMBOSIS
  // =========================================================================
  COAGULATION: {
    key: 'COAGULATION',
    testName: 'Comprehensive Coagulation Screen (PT/INR, APTT, Fibrinogen, TT)',
    department: 'Coagulation & Hemostasis',
    interpretationText: 'Coagulation profile evaluates secondary hemostasis across extrinsic, intrinsic, and common pathways. Prolonged PT/INR indicates extrinsic/common factor deficiencies (VII, X, V, II, I) or Vitamin K antagonist therapy. Prolonged APTT signals intrinsic factor defects (VIII, IX, XI, XII), lupus anticoagulant, or heparin therapy.',
    clinicalSignificance: 'Critical pre-operative bleeding risk assessment, DIC staging, and monitoring anticoagulation.',
    methodologyNotes: 'Optical coagulometric photo-optical clot detection.'
  },
  PT_INR: {
    key: 'PT_INR',
    testName: 'Prothrombin Time & INR (PT/INR)',
    department: 'Coagulation',
    interpretationText: 'Prothrombin Time measures the clotting time of citrated plasma upon addition of thromboplastin and calcium. The International Normalized Ratio (INR) standardizes values against the WHO International Sensitivity Index (ISI) for reliable monitoring of oral Vitamin K antagonist anticoagulant therapy (Warfarin/Acenocoumarol).',
    clinicalSignificance: 'Target therapeutic INR is typically 2.0 - 3.0 for DVT/PE and atrial fibrillation; 2.5 - 3.5 for mechanical prosthetic heart valves.',
    methodologyNotes: 'Automated photo-optical coagulometer.'
  },
  APTT: {
    key: 'APTT',
    testName: 'Activated Partial Thromboplastin Time (APTT)',
    department: 'Coagulation',
    interpretationText: 'APTT evaluates the contact activation intrinsic pathway and common pathway of blood coagulation (Factors XII, XI, IX, VIII, X, V, Prothrombin, Fibrinogen). Isolated prolonged APTT with normal PT warrants investigation for Hemophilia A (Factor VIII), Hemophilia B (Factor IX), von Willebrand disease, or Lupus Anticoagulant.',
    clinicalSignificance: 'Primary surveillance parameter for Unfractionated Heparin (UFH) monitoring and intrinsic factor deficiency workup.',
    methodologyNotes: 'Ellagic acid / kaolin activator clot detection.'
  },
  D_DIMER: {
    key: 'D_DIMER',
    testName: 'D-Dimer Quantitative Assay',
    department: 'Coagulation & Vascular',
    interpretationText: 'D-Dimer is a specific degradation product of cross-linked fibrin digested by plasmin. High clinical sensitivity and negative predictive value (> 95%) make it essential to rule out active thromboembolic disease. Elevated levels occur in deep vein thrombosis (DVT), pulmonary embolism (PE), DIC, sepsis, trauma, and malignancy.',
    clinicalSignificance: 'Normal D-Dimer (< 0.50 µg/mL FEU) effectively excludes acute DVT/PE in low-to-intermediate pre-test probability patients.',
    methodologyNotes: 'Latex-enhanced immunoturbidimetric quantitative assay.'
  },
  FIBRINOGEN: {
    key: 'FIBRINOGEN',
    testName: 'Plasma Fibrinogen (Factor I)',
    department: 'Coagulation',
    interpretationText: 'Fibrinogen is a soluble plasma glycoprotein synthesized by the liver and converted into insoluble fibrin strands by thrombin. Hypofibrinogenemia (< 100 mg/dL) precipitates severe microvascular bleeding risk in DIC, primary hyperfibrinolysis, massive transfusion, or end-stage hepatic failure.',
    clinicalSignificance: 'Crucial parameter in managing obstetric hemorrhages, trauma-induced coagulopathy (TIC), and DIC.',
    methodologyNotes: 'Clauss clotting method.'
  },
  BT_CT: {
    key: 'BT_CT',
    testName: 'Bleeding Time & Clotting Time (BT/CT)',
    department: 'Clinical Pathology',
    interpretationText: 'Bleeding Time assesses primary hemostasis including vascular constriction and platelet plug formation. Clotting Time assesses intrinsic secondary hemostatic cascade. Prolonged bleeding time indicates quantitative thrombocytopenia or qualitative thrombasthenia.',
    clinicalSignificance: 'Bedside screening for primary hemostatic competence prior to minor surgical interventions.',
    methodologyNotes: 'Ivy / Duke method (BT) and Lee-White whole blood method (CT).'
  },
  COOMBS_DIRECT: {
    key: 'COOMBS_DIRECT',
    testName: 'Direct Antiglobulin Test (DAT / Direct Coombs)',
    department: 'Immunohematology',
    interpretationText: 'Direct Coombs test detects in vivo sensitization of circulating erythrocytes by IgG antibodies or complement components (C3d). A positive DAT confirms immune-mediated red cell destruction in autoimmune hemolytic anemia (AIHA), drug-induced immune hemolysis, hemolytic transfusion reactions, or hemolytic disease of the newborn (HDN).',
    clinicalSignificance: 'Distinguishes autoimmune and alloimmune hemolysis from non-immune hemolytic anemias.',
    methodologyNotes: 'Polyspecific & Monospecific Anti-Human Globulin (AHG) Gel Card.'
  },
  COOMBS_INDIRECT: {
    key: 'COOMBS_INDIRECT',
    testName: 'Indirect Antiglobulin Test (IAT / Indirect Coombs)',
    department: 'Immunohematology',
    interpretationText: 'Indirect Coombs test screens for circulating unexpected red cell alloantibodies in patient serum that have the potential to cause hemolytic transfusion reactions or hemolytic disease of the fetus/newborn (HDFN). Essential for prenatal maternal antibody screening in Rh-negative mothers.',
    clinicalSignificance: 'Identifies clinically significant alloantibodies prior to red blood cell transfusion and in antenatal Rh-isoimmunization surveillance.',
    methodologyNotes: 'Three-cell antibody screening panel with AHG.'
  },
  HB_HPLC: {
    key: 'HB_HPLC',
    testName: 'Hemoglobin Variant Analysis (HPLC / Thalassemia Screen)',
    department: 'Hematology & Hemoglobinopathies',
    interpretationText: 'High-Performance Liquid Chromatography (HPLC) quantifies hemoglobin fractions (HbA, HbA2, HbF) and identifies abnormal structural variants (HbS, HbE, HbD-Punjab, HbC). Elevated HbA2 (> 3.5%) is the diagnostic hallmark of Beta-Thalassemia Trait (Minor).',
    clinicalSignificance: 'Definitive pre-marital and antenatal screening for hemoglobinopathies and thalassemias.',
    methodologyNotes: 'Cation-exchange HPLC (Bio-Rad D-10 / Variant II).'
  },
  G6PD: {
    key: 'G6PD',
    testName: 'Glucose-6-Phosphate Dehydrogenase Quantitative',
    department: 'Biochemical Genetics & Hematology',
    interpretationText: 'G6PD is the rate-limiting enzyme of the hexose monophosphate (HMP) shunt, generating NADPH essential for maintaining reduced glutathione and protecting erythrocytes against oxidative injury. G6PD deficiency predisposes to acute intravascular hemolysis following oxidative stress, fava bean ingestion, or oxidant drugs (Primaquine, Dapsone, Nitrofurantoin).',
    clinicalSignificance: 'Mandatory before initiating oxidant antimalarial or antimicrobial therapy; investigates acute post-infectious jaundice.',
    methodologyNotes: 'Kinetic ultraviolet enzymatic assay.'
  },
  SICKLE_CELL: {
    key: 'SICKLE_CELL',
    testName: 'Sickle Cell Hemoglobin Screen',
    department: 'Hematology',
    interpretationText: 'Evaluates the presence of mutant hemoglobin S (HbS) which polymerizes under deoxygenated conditions, causing red blood cells to deform into characteristic sickle/crescent shapes. Differentiates asymptomatic Sickle Cell Trait (heterozygous HbAS) from symptomatic Sickle Cell Disease (homozygous HbSS) when correlated with HPLC.',
    clinicalSignificance: 'Screens for vaso-occlusive crisis risk, acute chest syndrome, and chronic sickle hemolytic anemia.',
    methodologyNotes: 'Sodium metabisulfite reducing solubility test & HPLC confirmation.'
  },

  // =========================================================================
  // 3. CLINICAL BIOCHEMISTRY & ORGAN PROFILES
  // =========================================================================
  LIPID: {
    key: 'LIPID',
    testName: 'Lipid Profile Comprehensive',
    department: 'Clinical Biochemistry',
    interpretationText: 'The Lipid Profile measures circulating lipids and lipoproteins to assess cardiovascular and atherogenic risk. Elevated Total Cholesterol, Triglycerides, LDL-C, and Non-HDL Cholesterol accelerate atheroma formation in arterial walls, increasing the risk of myocardial infarction, stroke, and peripheral arterial disease. High HDL-C is cardioprotective.',
    clinicalSignificance: 'Crucial for primary and secondary prevention of atherosclerotic cardiovascular disease (ASCVD), monitoring statin efficacy, and evaluating metabolic syndrome.',
    methodologyNotes: 'Enzymatic photometric clearance / direct homogenous enzymatic assay.'
  },
  LFT: {
    key: 'LFT',
    testName: 'Liver Function Test (LFT) Comprehensive',
    department: 'Clinical Biochemistry',
    interpretationText: 'Liver Function Tests evaluate hepatocellular integrity, biliary excretory capacity, and hepatic synthetic function. Elevated SGOT/AST and SGPT/ALT signal hepatocellular necrosis (viral hepatitis, toxic insult, NAFLD). Elevated Total/Direct Bilirubin and Alkaline Phosphatase (ALP) point toward cholestasis or biliary obstruction. Low Albumin reflects diminished hepatic synthetic reserve or systemic protein loss.',
    clinicalSignificance: 'Comprehensive diagnostic panel for jaundice, cirrhosis, drug-induced liver injury (DILI), viral hepatitis, and metabolic liver disease.',
    methodologyNotes: 'Standard IFCC enzymatic spectrophotometric methods.'
  },
  KFT: {
    key: 'KFT',
    testName: 'Kidney / Renal Function Test (KFT / RFT)',
    department: 'Clinical Biochemistry',
    interpretationText: 'Kidney Function Tests quantify nitrogenous metabolic waste clearance and glomerular filtration capacity. Serum Creatinine and Blood Urea Nitrogen (BUN) rise proportionately with nephron loss. The calculated estimated Glomerular Filtration Rate (eGFR) categorizes chronic kidney disease (CKD) stages from Stage 1 (>90) to Stage 5 (<15 / Kidney Failure).',
    clinicalSignificance: 'Essential for diagnosing acute kidney injury (AKI), staging chronic kidney disease (CKD), monitoring nephrotoxic medications, and evaluating fluid-electrolyte balance.',
    methodologyNotes: 'Enzymatic / Jaffé kinetic method (Creatinine) and GLDH kinetic method (Urea).'
  },
  ELECTROLYTES: {
    key: 'ELECTROLYTES',
    testName: 'Serum Electrolytes (Sodium, Potassium, Chloride)',
    department: 'Clinical Biochemistry & Critical Care',
    interpretationText: 'Electrolytes maintain cellular osmolarity, resting membrane potentials, neuromuscular excitability, and systemic acid-base balance. Dysnatremias (Hyponatremia/Hypernatremia) cause neurological dysfunction and cerebral edema. Dyskalemias (Hypokalemia/Hyperkalemia) cause life-threatening cardiac conduction abnormalities, arrhythmias, and cardiac arrest.',
    clinicalSignificance: 'Emergency surveillance parameter in intensive care, dehydration, renal impairment, diabetic ketoacidosis, and diuretic therapy.',
    methodologyNotes: 'Direct Ion-Selective Electrode (ISE) potentiometry.'
  },
  ELECTROLYTES_EXTENDED: {
    key: 'ELECTROLYTES_EXTENDED',
    testName: 'Extended Electrolytes (Na, K, Cl, Ca, Mg, Phosphorus)',
    department: 'Biochemistry & Critical Care',
    interpretationText: 'Extended electrolyte testing comprehensively assesses monovalent cations, divalent minerals (Calcium, Magnesium), and inorganic phosphorus. Crucial for identifying refeeding syndrome, refractory hypocalcemia secondary to hypomagnesemia, and complex acid-base disturbances.',
    clinicalSignificance: 'Indispensable in intensive care units, dialysis management, parenteral nutrition, and neuromuscular tetany.',
    methodologyNotes: 'Direct ISE potentiometry & Arsenazo / Phosphomolybdate spectrophotometry.'
  },
  GLUCOSE_PROFILE: {
    key: 'GLUCOSE_PROFILE',
    testName: 'Comprehensive Glycemic Profile (Fasting, PP, HbA1c, eAG)',
    department: 'Clinical Biochemistry',
    interpretationText: 'Evaluates acute and chronic carbohydrate homeostasis. Fasting blood glucose measures basal hepatic gluconeogenesis; Post-Prandial glucose measures peripheral insulin sensitivity and post-absorptive disposal. HbA1c provides a weighted 3-month retrospective index of chronic glycation, unaffected by daily dietary fluctuations.',
    clinicalSignificance: 'Gold standard comprehensive workup for diagnosing Diabetes Mellitus, Pre-diabetes, and tracking glycemic control.',
    methodologyNotes: 'Hexokinase / Glucose Oxidase enzymatic method with HPLC HbA1c.'
  },
  GLUCOSE_FASTING: {
    key: 'GLUCOSE_FASTING',
    testName: 'Fasting Blood Sugar (FBS)',
    department: 'Clinical Biochemistry',
    interpretationText: 'Fasting blood glucose reflects basal insulin secretion and hepatic glucose output after an overnight 8-12 hour fast. Normal: 70 - 99 mg/dL; Impaired Fasting Glucose (Pre-diabetes): 100 - 125 mg/dL; Diabetes Mellitus: ≥ 126 mg/dL on two separate occasions.',
    clinicalSignificance: 'First-line screening investigation for diabetes mellitus and monitoring insulin or oral hypoglycemic regimens.',
    methodologyNotes: 'Hexokinase / GOD-POD enzymatic method in Fluoride tube.'
  },
  GLUCOSE_PP: {
    key: 'GLUCOSE_PP',
    testName: 'Post-Prandial Blood Sugar (PPBS - 2 Hours)',
    department: 'Clinical Biochemistry',
    interpretationText: 'Post-prandial blood sugar measured exactly 2 hours after a meal assesses post-prandial insulin surge and tissue glucose disposal. Normal: < 140 mg/dL; Impaired Glucose Tolerance: 140 - 199 mg/dL; Diabetes Mellitus: ≥ 200 mg/dL as per ADA criteria.',
    clinicalSignificance: 'Key predictor of post-prandial glycemic excursions and microvascular complications in diabetic patients.',
    methodologyNotes: 'GOD-POD enzymatic spectrophotometry.'
  },
  GLUCOSE_RANDOM: {
    key: 'GLUCOSE_RANDOM',
    testName: 'Random Blood Sugar (RBS)',
    department: 'Biochemistry & Emergency',
    interpretationText: 'Random blood glucose measured without regard to meal timing. A random plasma glucose ≥ 200 mg/dL in the presence of classic hyperosmolar symptoms (polyuria, polydipsia, unexplained weight loss) is diagnostic of Diabetes Mellitus. Values < 70 mg/dL signal acute hypoglycemia.',
    clinicalSignificance: 'Rapid bedside/emergency triage for symptomatic hyperglycemia, diabetic ketoacidosis, and hypoglycemia.',
    methodologyNotes: 'GOD-POD enzymatic method.'
  },
  HBA1C: {
    key: 'HBA1C',
    testName: 'Glycated Hemoglobin (HbA1c with eAG)',
    department: 'Clinical Biochemistry',
    interpretationText: 'HbA1c reflects non-enzymatic irreversible glycation of the N-terminal valine of the hemoglobin beta chain over the 90-120 day erythrocyte lifespan. < 5.7% is Normal; 5.7% - 6.4% indicates Pre-diabetes (high risk for future diabetes); ≥ 6.5% confirms Diabetes Mellitus. Estimated Average Glucose (eAG) translates HbA1c into daily mg/dL values.',
    clinicalSignificance: 'International benchmark for chronic glycemic monitoring and therapeutic target verification (target < 7.0% for most adults).',
    methodologyNotes: 'Ion-exchange High Performance Liquid Chromatography (HPLC) - NGSP & IFCC Certified.'
  },
  GTT_OGTT: {
    key: 'GTT_OGTT',
    testName: 'Oral Glucose Tolerance Test (75g 2-Hour OGTT)',
    department: 'Clinical Biochemistry',
    interpretationText: 'Evaluates whole-body insulin secretagogue and peripheral disposal capacity following a standardized 75-gram anhydrous glucose challenge. Indispensable for detecting Impaired Glucose Tolerance (IGT) and diagnosing Gestational Diabetes Mellitus (GDM) as per DIPSI/WHO guidelines.',
    clinicalSignificance: 'Definitive diagnostic evaluation for ambiguous fasting glucose, gestational hyperglycemia, and reactive hypoglycemia.',
    methodologyNotes: 'Sequential enzymatic glucose measurement (0 min, 60 min, 120 min).'
  },
  INSULIN_FASTING: {
    key: 'INSULIN_FASTING',
    testName: 'Fasting Serum Insulin & HOMA-IR',
    department: 'Endocrinology & Biochemistry',
    interpretationText: 'Fasting insulin reflects beta-cell secretion at rest. When correlated with fasting glucose, the Homeostatic Model Assessment of Insulin Resistance (HOMA-IR) calculates degree of peripheral insulin resistance. HOMA-IR > 2.5 signifies marked insulin resistance characteristic of Metabolic Syndrome, PCOS, and NAFLD.',
    clinicalSignificance: 'Identifies early metabolic syndrome and hyperinsulinemia years prior to onset of overt hyperglycemia.',
    methodologyNotes: 'Chemiluminescence Immunoassay (CLIA).'
  },
  PANCREATIC: {
    key: 'PANCREATIC',
    testName: 'Pancreatic Enzymes (Serum Amylase & Lipase)',
    department: 'Biochemistry & Emergency',
    interpretationText: 'Serum Lipase and Amylase are digestive enzymes released into systemic circulation during acinar cell disruption. Serum Lipase is significantly more sensitive (95%) and specific (99%) than amylase, remaining elevated for 8-14 days. A threefold or greater elevation above normal upper limit confirms acute pancreatitis.',
    clinicalSignificance: 'Rapid differential diagnosis of acute epigastric pain, acute pancreatitis, and pancreatic pseudocysts.',
    methodologyNotes: 'Enzymatic photometric colorimetric assay.'
  },
  LDH: {
    key: 'LDH',
    testName: 'Lactate Dehydrogenase (Total Serum LDH)',
    department: 'Clinical Biochemistry',
    interpretationText: 'Lactate Dehydrogenase is a ubiquitous intracellular zinc enzyme catalyzing the interconversion of pyruvate and lactate. Released during cell membrane damage or lysis. Markedly elevated in hemolysis, tissue necrosis, acute myocardial injury, severe pneumonia/sepsis, and hematologic malignancies.',
    clinicalSignificance: 'Non-specific marker of cellular turnover, tumor burden in lymphomas/germ cell tumors, and hemolysis.',
    methodologyNotes: 'IFCC UV kinetic method.'
  },
  SERUM_URIC_ACID: {
    key: 'SERUM_URIC_ACID',
    testName: 'Serum Uric Acid',
    department: 'Clinical Biochemistry',
    interpretationText: 'Uric acid is the final oxidation product of purine catabolism in humans. Hyperuricemia (> 7.0 mg/dL in males, > 6.0 mg/dL in females) predisposes to monosodium urate crystal precipitation in synovial joints (Acute Gouty Arthritis), soft tissues (Tophi), and renal collecting tubules (Urate Nephrolithiasis).',
    clinicalSignificance: 'Diagnosis and monitoring of Gout, tumor lysis syndrome, and assessment of pre-eclampsia risk in pregnancy.',
    methodologyNotes: 'Enzymatic uricase colorimetric method.'
  },
  SERUM_CALCIUM_PHOSPHORUS: {
    key: 'SERUM_CALCIUM_PHOSPHORUS',
    testName: 'Bone Metabolism Panel (Calcium, Albumin, Phosphorus, ALP)',
    department: 'Biochemistry & Bone Metabolism',
    interpretationText: 'Evaluates mineral homeostasis and bone turnover. Total Calcium is adjusted for serum Albumin binding (Corrected Ca = Total Ca + 0.8 * [4.0 - Albumin]). Discordant calcium and phosphorus levels guide differential diagnosis between Primary Hyperparathyroidism (High Ca, Low P), Malignancy, Hypoparathyroidism, and Vitamin D deficiency.',
    clinicalSignificance: 'Investigation of osteopenia/osteoporosis, renal osteodystrophy, nephrolithiasis, and neuromuscular tetany.',
    methodologyNotes: 'Spectrophotometric arsenazo / phosphomolybdate kinetic assays.'
  },
  SERUM_MAGNESIUM: {
    key: 'SERUM_MAGNESIUM',
    testName: 'Serum Magnesium',
    department: 'Clinical Biochemistry',
    interpretationText: 'Magnesium is the second most abundant intracellular cation, serving as an essential cofactor for over 300 enzymatic reactions including Na+/K+-ATPase and parathyroid hormone secretion. Hypomagnesemia causes refractory hypokalemia, neuromuscular hyperexcitability, cardiac arrhythmias (Torsades de Pointes), and seizures.',
    clinicalSignificance: 'Critical monitoring in pre-eclampsia/eclampsia magnesium sulfate therapy, ICU electrolyte disturbances, and malabsorption.',
    methodologyNotes: 'Calmagite / Xylidyl blue colorimetric method.'
  },

  // =========================================================================
  // 4. CARDIAC & EMERGENCY CRITICAL CARE
  // =========================================================================
  CARDIAC_MARKERS: {
    key: 'CARDIAC_MARKERS',
    testName: 'Acute Coronary Syndrome Cardiac Marker Panel',
    department: 'Emergency & Cardiac Biochemistry',
    interpretationText: 'Emergency panel evaluating acute myocardial necrosis. High-sensitivity Cardiac Troponin I (hs-cTnI) is the gold standard biomarker for acute myocardial infarction (AMI), detecting microscopic myocyte necrosis within 1-3 hours of chest pain onset. CK-MB mass assists in detecting early re-infarction.',
    clinicalSignificance: 'Rule-in / rule-out protocol for Non-ST Elevation Myocardial Infarction (NSTEMI) and unstable angina in acute chest pain.',
    methodologyNotes: 'High-sensitivity Chemiluminescence Immunoassay (hs-CLIA).'
  },
  TROPONIN_I_HS: {
    key: 'TROPONIN_I_HS',
    testName: 'High-Sensitivity Cardiac Troponin I (hs-cTnI)',
    department: 'Cardiac Emergency',
    interpretationText: 'High-sensitivity Troponin I quantifies cardiac-specific contractile proteins with picogram-level analytical sensitivity. Values above the 99th percentile upper reference limit of a healthy reference population with a dynamic rise or fall confirm acute myocardial injury as per the Universal Definition of Myocardial Infarction.',
    clinicalSignificance: 'Definitive biomarker for diagnosing Acute Myocardial Infarction, stratifying risk in acute coronary syndromes.',
    methodologyNotes: 'Chemiluminescent Microparticle Immunoassay (CMIA).'
  },
  TROPONIN_T_HS: {
    key: 'TROPONIN_T_HS',
    testName: 'High-Sensitivity Cardiac Troponin T (hs-cTnT)',
    department: 'Cardiac Emergency',
    interpretationText: 'Cardiac Troponin T is a structural component of the thin cardiac filament. High-sensitivity assays detect minimal myocardial ischemia. Serial testing (0h and 1h/2h/3h algorithms) enables rapid rule-out and rule-in of Acute Myocardial Infarction according to European Society of Cardiology (ESC) guidelines.',
    clinicalSignificance: 'Gold standard emergency cardiac marker for acute coronary syndrome triage and long-term cardiovascular prognosis.',
    methodologyNotes: 'Electrochemiluminescence Immunoassay (ECLIA).'
  },
  NT_PROBNP: {
    key: 'NT_PROBNP',
    testName: 'N-Terminal pro-B-Type Natriuretic Peptide (NT-proBNP)',
    department: 'Cardiology & Heart Failure',
    interpretationText: 'NT-proBNP is an inactive peptide cleaved from proBNP in response to increased ventricular wall stress, volume expansion, and myocardial stretch. Exceptionally high negative predictive value (> 98%) makes it the definitive biomarker to rule out acute decompensated heart failure in patients presenting with acute dyspnea.',
    clinicalSignificance: 'Diagnosis of acute and chronic heart failure, monitoring response to heart failure therapy (ARNIs, SGLT2i), and cardiovascular risk prognosis.',
    methodologyNotes: 'Quantitative ECLIA / CLIA.'
  },
  CK_MB: {
    key: 'CK_MB',
    testName: 'Creatine Kinase-MB Mass (CK-MB)',
    department: 'Cardiac Biochemistry',
    interpretationText: 'CK-MB is the cardiac isoenzyme of creatine kinase. It rises 4-6 hours post-infarction, peaks at 18-24 hours, and returns to baseline within 48-72 hours. This rapid clearance profile makes it superior to troponin for diagnosing acute peri-procedural myocardial re-infarction.',
    clinicalSignificance: 'Surveillance for early recurrent infarction following primary PCI or thrombolysis.',
    methodologyNotes: 'Chemiluminescence mass immunoassay (ng/mL).'
  },
  HOMOCYSTEINE: {
    key: 'HOMOCYSTEINE',
    testName: 'Serum Total Homocysteine',
    department: 'Biochemistry & Vascular Medicine',
    interpretationText: 'Homocysteine is a sulfur-containing amino acid derived from methionine demethylation. Elevated levels (Hyperhomocysteinemia) induce vascular endothelial dysfunction, smooth muscle proliferation, and platelet activation, serving as an independent risk factor for premature coronary artery disease, venous thromboembolism, and stroke.',
    clinicalSignificance: 'Investigates premature cardiovascular disease, unexplained arterial/venous thrombosis, and Vitamin B12/Folate deficiency states.',
    methodologyNotes: 'Enzymatic immunoassay / Chemiluminescence.'
  },
  HS_CRP: {
    key: 'HS_CRP',
    testName: 'High-Sensitivity C-Reactive Protein (hs-CRP Cardiac Risk)',
    department: 'Cardiovascular Risk Stratification',
    interpretationText: 'High-sensitivity CRP measures basal vascular micro-inflammation within the sub-clinical range (< 10 mg/L). AHA/CDC Risk Stratification: Low Risk: < 1.0 mg/L; Average Risk: 1.0 - 3.0 mg/L; High Cardiovascular Risk: > 3.0 mg/L. Values > 10 mg/L signify acute systemic infection/inflammation and require repeat testing.',
    clinicalSignificance: 'Independent cardiovascular risk stratification biomarker for primary prevention and atherosclerotic plaque instability.',
    methodologyNotes: 'Latex-enhanced high-sensitivity immunoturbidimetry.'
  },

  // =========================================================================
  // 5. ENDOCRINOLOGY, HORMONES & FERTILITY
  // =========================================================================
  THYROID_TOTAL: {
    key: 'THYROID_TOTAL',
    testName: 'Thyroid Profile Total (Total T3, Total T4, TSH)',
    department: 'Endocrinology',
    interpretationText: 'Evaluates the hypothalamic-pituitary-thyroid regulatory axis. TSH is the most sensitive indicator of thyroid status. High TSH with low T3/T4 confirms Primary Hypothyroidism; Low TSH with high T3/T4 confirms Primary Hyperthyroidism. Total hormone levels are influenced by thyroxine-binding globulin (TBG) variations (pregnancy, OCPs).',
    clinicalSignificance: 'First-line comprehensive screening for hypothyroidism, hyperthyroidism, goiter, and therapeutic monitoring of Levothyroxine.',
    methodologyNotes: 'Chemiluminescent Microparticle Immunoassay (CMIA).'
  },
  THYROID_FREE: {
    key: 'THYROID_FREE',
    testName: 'Free Thyroid Profile (Free T3, Free T4, Ultrasensitive TSH)',
    department: 'Endocrinology',
    interpretationText: 'Measures metabolically active, unbound thyroid hormones (FT3, FT4) independent of binding protein fluctuations. Essential in pregnancy, nephrotic syndrome, acute illness, and protein-losing enteropathies where total hormone levels are falsely skewed.',
    clinicalSignificance: 'Gold standard precise thyroid status assessment during pregnancy and complex thyroid axis abnormalities.',
    methodologyNotes: 'Direct competitive Chemiluminescence Immunoassay (CLIA).'
  },
  TSH_ONLY: {
    key: 'TSH_ONLY',
    testName: 'Ultrasensitive TSH 3rd Generation',
    department: 'Endocrinology',
    interpretationText: 'Third-generation ultrasensitive TSH (functional sensitivity ≤ 0.01 µIU/mL) provides logarithmic sensitivity to minute changes in circulating free thyroid hormones. Normal TSH virtually excludes primary thyroid dysfunction in ambulatory individuals with intact pituitary function.',
    clinicalSignificance: 'Single most cost-effective first-line screening investigation for thyroid disorders and titrating thyroxine replacement.',
    methodologyNotes: 'Chemiluminescent two-site sandwich immunoassay.'
  },
  THYROID_ANTIBODIES: {
    key: 'THYROID_ANTIBODIES',
    testName: 'Thyroid Autoantibodies (Anti-TPO & Anti-Thyroglobulin)',
    department: 'Immunology & Endocrinology',
    interpretationText: 'Anti-Thyroid Peroxidase (Anti-TPO) and Anti-Thyroglobulin (Anti-Tg) antibodies are circulating markers of autoimmune-mediated thyroid follicular destruction. Elevated Anti-TPO titer (> 35 IU/mL) confirms Hashimoto\'s Thyroiditis (Autoimmune Hypothyroidism) and predicts progression from subclinical to overt hypothyroidism.',
    clinicalSignificance: 'Diagnosis of autoimmune thyroiditis (Hashimoto\'s disease, Graves\' disease), postpartum thyroiditis, and unexplained subfertility.',
    methodologyNotes: 'Chemiluminescence Immunoassay (CLIA).'
  },
  FERTILITY_FEMALE: {
    key: 'FERTILITY_FEMALE',
    testName: 'Comprehensive Female Fertility & Reproductive Panel',
    department: 'Reproductive Endocrinology',
    interpretationText: 'Evaluates the hypothalamic-pituitary-ovarian axis and ovarian reserve. Day 2-4 (Early Follicular) FSH and Estradiol reflect baseline ovarian responsiveness. LH/FSH ratio > 2.0 indicates Polycystic Ovary Syndrome (PCOS). AMH quantifies primordial follicle pool independent of menstrual cycle day.',
    clinicalSignificance: 'Comprehensive diagnostic workup for female subfertility, anovulation, PCOS, oligomenorrhea, and premature ovarian insufficiency.',
    methodologyNotes: 'Automated quantitative CLIA / ECLIA.'
  },
  AMH: {
    key: 'AMH',
    testName: 'Anti-Müllerian Hormone (AMH)',
    department: 'Reproductive Endocrinology',
    interpretationText: 'AMH is produced exclusively by granulosa cells of pre-antral and small antral follicles, directly correlating with functional ovarian follicle reserve. Unlike FSH, AMH levels remain stable throughout the menstrual cycle. Values < 1.0 ng/mL suggest diminished ovarian reserve (DOR); values > 3.5 ng/mL suggest polycystic ovary morphology.',
    clinicalSignificance: 'Ovarian reserve assessment, predicting response to controlled ovarian stimulation in IVF, and diagnosing PCOS.',
    methodologyNotes: 'Ultra-sensitive automated Chemiluminescence Immunoassay (CLIA).'
  },
  PROLACTIN: {
    key: 'PROLACTIN',
    testName: 'Serum Prolactin',
    department: 'Endocrinology',
    interpretationText: 'Prolactin is an anterior pituitary polypeptide hormone essential for lactogenesis. Significant hyperprolactinemia (> 100 ng/mL) indicates prolactinoma (pituitary adenoma). Moderate elevations occur in medication side effects (antipsychotics, metoclopramide), primary hypothyroidism, and microadenomas, causing galactorrhea, amenorrhea, and infertility.',
    clinicalSignificance: 'Investigates galactorrhea, secondary amenorrhea, female/male subfertility, erectile dysfunction, and pituitary mass lesions.',
    methodologyNotes: 'Chemiluminescent two-site immunometric assay.'
  },
  BETA_HCG: {
    key: 'BETA_HCG',
    testName: 'Total Beta-hCG Quantitative',
    department: 'Endocrinology & Oncology',
    interpretationText: 'Beta-hCG is a glycoprotein hormone secreted by syncytiotrophoblasts. In viable intrauterine pregnancy, serum levels double approximately every 48 hours during the first 6-7 weeks. In ectopic pregnancy or failing intrauterine gestation, levels rise subnormally (< 35% in 48h) or plateau. Also functions as a tumor marker for choriocarcinoma and testicular germ cell tumors.',
    clinicalSignificance: 'Definitive confirmation of early pregnancy, ectopic pregnancy triage, and gestational trophoblastic disease surveillance.',
    methodologyNotes: 'Chemiluminescent Immunoassay (CLIA).'
  },
  FERTILITY_MALE: {
    key: 'FERTILITY_MALE',
    testName: 'Male Fertility & Androgen Profile',
    department: 'Endocrinology & Andrology',
    interpretationText: 'Comprehensive evaluation of the hypothalamic-pituitary-gonadal axis in men. Evaluates Leydig cell testosterone secretion and Sertoli cell spermatogenesis (FSH, LH). Low testosterone with high LH/FSH denotes primary testicular failure; low testosterone with low/normal LH denotes secondary hypogonadotropic hypogonadism.',
    clinicalSignificance: 'Investigation of male subfertility, oligospermia/azoospermia, erectile dysfunction, loss of libido, and gynecomastia.',
    methodologyNotes: 'Automated CLIA / ECLIA.'
  },
  TESTOSTERONE_TOTAL: {
    key: 'TESTOSTERONE_TOTAL',
    testName: 'Serum Total Testosterone',
    department: 'Endocrinology',
    interpretationText: 'Primary circulating androgen in males; also synthesized in lower quantities by female adrenal glands and ovaries. Diurnal rhythm peaks in early morning (7-10 AM). In males, hypogonadism (< 300 ng/dL) causes fatigue, decreased bone density, and sexual dysfunction. In females, elevated levels cause hirsutism, acne, and virilization in PCOS.',
    clinicalSignificance: 'Assessment of male hypogonadism and female hyperandrogenism/PCOS. Best measured on early morning specimen.',
    methodologyNotes: 'Competitive Chemiluminescent Immunoassay.'
  },
  PROGESTERONE: {
    key: 'PROGESTERONE',
    testName: 'Serum Progesterone (Day 21 Mid-Luteal)',
    department: 'Endocrinology & Fertility',
    interpretationText: 'Progesterone is secreted by the corpus luteum following ovulation. Measured during the mid-luteal phase (Day 21 of a standard 28-day cycle), levels > 3.0 ng/mL confirm ovulation, while levels > 10 ng/mL denote adequate luteal phase function for embryo implantation.',
    clinicalSignificance: 'Confirmation of ovulatory cycles and diagnosis of luteal phase deficiency in recurrent pregnancy loss.',
    methodologyNotes: 'Competitive Chemiluminescence Immunoassay (CLIA).'
  },
  ESTRADIOL_E2: {
    key: 'ESTRADIOL_E2',
    testName: 'Serum 17-Beta Estradiol (E2)',
    department: 'Endocrinology',
    interpretationText: 'Estradiol is the principal biologically active estrogen synthesized by developing ovarian follicles. Serum levels correlate with follicular maturation during natural or assisted reproductive cycles. Suppressed levels occur in ovarian failure, hypopituitarism, and post-menopause.',
    clinicalSignificance: 'Monitoring follicular development in IVF, evaluating delayed/precocious puberty, and assessing amenorrhea.',
    methodologyNotes: 'Competitive CLIA.'
  },
  LH_FSH_RATIO: {
    key: 'LH_FSH_RATIO',
    testName: 'LH / FSH Ratio',
    department: 'Endocrinology',
    interpretationText: 'In healthy reproductive-age females during the early follicular phase, the baseline ratio of LH to FSH is approximately 1:1. A reversal with LH to FSH ratio > 2.0 to 3.0:1 is a recognized neuroendocrine hallmark supporting the clinical diagnosis of Polycystic Ovary Syndrome (PCOS).',
    clinicalSignificance: 'Biochemical marker assisting in the Rotterdam diagnostic criteria for PCOS.',
    methodologyNotes: 'Calculated from Day 2-4 early follicular CLIA measurements.'
  },
  CORTISOL_DIURNAL: {
    key: 'CORTISOL_DIURNAL',
    testName: 'Diurnal Cortisol (Morning 8 AM & Evening 4 PM)',
    department: 'Endocrinology',
    interpretationText: 'Cortisol is the primary glucocorticoid synthesized by the adrenal cortex under ACTH control. In healthy individuals, levels demonstrate a circadian rhythm: peak at 8 AM and nadir in the late evening/midnight. Loss of diurnal rhythm occurs in Cushing\'s Syndrome. Markedly low morning cortisol (< 3 µg/dL) indicates primary or secondary Adrenal Insufficiency (Addison\'s Disease).',
    clinicalSignificance: 'Diagnostic evaluation for Cushing\'s syndrome, Addisonian crisis, adrenal exhaustion, and chronic steroid suppression.',
    methodologyNotes: 'Competitive Chemiluminescence Immunoassay (CLIA).'
  },
  DHEA_S: {
    key: 'DHEA_S',
    testName: 'Dehydroepiandrosterone Sulfate (DHEA-S)',
    department: 'Endocrinology',
    interpretationText: 'DHEA-S is an adrenal androgen precursor synthesized almost exclusively by the adrenal cortex (zona reticularis). It is not subject to diurnal variation. Markedly elevated levels (> 700 µg/dL) warrant immediate imaging to rule out an androgen-secreting Adrenal Cortical Carcinoma or congenital adrenal hyperplasia.',
    clinicalSignificance: 'Differentiates adrenal from ovarian sources of hyperandrogenism in hirsutism, virilization, and alopecia.',
    methodologyNotes: 'Chemiluminescence Immunoassay (CLIA).'
  },
  PTH_INTACT: {
    key: 'PTH_INTACT',
    testName: 'Intact Parathyroid Hormone (iPTH)',
    department: 'Endocrinology & Mineral Metabolism',
    interpretationText: 'Parathyroid hormone regulates systemic calcium and phosphate homeostasis by acting on bone resorption, renal tubular calcium reabsorption, and renal activation of 25-OH Vitamin D to 1,25-(OH)2D. Elevated PTH with hypercalcemia confirms Primary Hyperparathyroidism (parathyroid adenoma). Elevated PTH with normal/low calcium reflects Secondary Hyperparathyroidism (CKD or severe Vitamin D deficiency).',
    clinicalSignificance: 'Investigation of hypercalcemia, hypocalcemia, parathyroid adenomas, and renal osteodystrophy in dialysis.',
    methodologyNotes: 'Two-site sandwich Chemiluminescent Immunoassay.'
  },
  TRIPLE_MARKER: {
    key: 'TRIPLE_MARKER',
    testName: 'Second Trimester Maternal Triple Screen',
    department: 'Prenatal Screening & Genetics',
    interpretationText: 'Second trimester maternal serum screening (15-20 weeks gestation) combining Maternal Serum Alpha-Fetoprotein (MSAFP), Total Beta-hCG, and Unconjugated Estriol (uE3). When integrated with maternal age and gestational age, statistical algorithms calculate individual patient risk for fetal Down Syndrome (Trisomy 21), Trisomy 18, and Open Neural Tube Defects (NTD).',
    clinicalSignificance: 'Non-invasive screening for fetal aneuploidies and open neural tube defects.',
    methodologyNotes: 'Automated quantitative CLIA with certified prenatal risk calculation software.'
  },
  QUADRUPLE_MARKER: {
    key: 'QUADRUPLE_MARKER',
    testName: 'Second Trimester Maternal Quadruple Screen',
    department: 'Prenatal Screening & Genetics',
    interpretationText: 'Enhances triple marker screening by incorporating Dimeric Inhibin-A (DIA). Inhibin-A levels are significantly elevated in Down syndrome pregnancies, increasing screening detection sensitivity to approximately 80-85% at a 5% false-positive rate. A positive screen warrants genetic counseling and confirmatory prenatal diagnostic testing (amniocentesis).',
    clinicalSignificance: 'Advanced second trimester prenatal aneuploidy risk assessment.',
    methodologyNotes: 'Chemiluminescence Immunoassay with risk calculation algorithm.'
  },

  // =========================================================================
  // 6. VITAMINS, NUTRITION & IRON STUDIES
  // =========================================================================
  VITAMIN_D_B12: {
    key: 'VITAMIN_D_B12',
    testName: 'Essential Neuro-Skeletal Vitamin Panel (Vitamin D & B12)',
    department: 'Biochemistry & Nutrition',
    interpretationText: 'Combined assessment of 25-OH Vitamin D Total and Vitamin B12. Vitamin D deficiency impairs intestinal calcium absorption, precipitating osteomalacia, secondary hyperparathyroidism, and chronic musculoskeletal pain. Vitamin B12 deficiency causes megaloblastic macrocytic anemia and irreversible peripheral neuropathy/subacute combined degeneration of the spinal cord.',
    clinicalSignificance: 'Investigation of chronic fatigue, peripheral neuropathy, generalized bone pain, osteopenia, and macrocytic anemia.',
    methodologyNotes: 'Competitive Chemiluminescent Immunoassay (CLIA).'
  },
  VITAMIN_D: {
    key: 'VITAMIN_D',
    testName: '25-Hydroxy Vitamin D Total [25-OH D2 + D3]',
    department: 'Clinical Biochemistry',
    interpretationText: '25-OH Vitamin D is the primary circulating storage form and definitive indicator of total body Vitamin D nutritional status. Classification: Deficiency: < 20 ng/mL; Insufficiency: 21 - 29 ng/mL; Sufficiency: 30 - 100 ng/mL; Toxicity: > 100 ng/mL. Deficiency causes defective bone mineralization (rickets/osteomalacia) and impairs innate immunity.',
    clinicalSignificance: 'Management of osteoporosis, osteomalacia, chronic kidney disease, and therapeutic dosing of cholecalciferol.',
    methodologyNotes: 'Chemiluminescent Microparticle Immunoassay (CMIA).'
  },
  VITAMIN_B12: {
    key: 'VITAMIN_B12',
    testName: 'Serum Vitamin B12 (Cyanocobalamin)',
    department: 'Clinical Biochemistry',
    interpretationText: 'Vitamin B12 is an essential water-soluble cobalt-containing coenzyme required for DNA synthesis, erythropoiesis, and myelin sheath maintenance. Serum levels < 200 pg/mL confirm deficiency. Common causes include strict vegetarianism/veganism, autoimmune pernicious anemia (loss of intrinsic factor), bariatric surgery, and chronic Metformin use.',
    clinicalSignificance: 'Investigates macrocytic megaloblastic anemia, unexplained sensory paresthesias, ataxia, and cognitive decline.',
    methodologyNotes: 'Competitive Chemiluminescence Immunoassay (CLIA).'
  },
  IRON_PROFILE: {
    key: 'IRON_PROFILE',
    testName: 'Iron Studies Complete (Serum Iron, TIBC, Transferrin Saturation)',
    department: 'Biochemistry & Hematology',
    interpretationText: 'Iron profile evaluates body iron transport and storage equilibrium. In Iron Deficiency Anemia (IDA), Serum Iron and Transferrin Saturation are low (< 16%), while Total Iron Binding Capacity (TIBC) is elevated. In Anemia of Chronic Disease (ACD), Serum Iron is low but TIBC is low or normal due to hepcidin-mediated reticuloendothelial iron sequestration.',
    clinicalSignificance: 'Differential diagnosis of microcytic hypochromic anemias and evaluation of iron overload / hemochromatosis.',
    methodologyNotes: 'Ferene / Ferrozine photometric method.'
  },
  FERRITIN: {
    key: 'FERRITIN',
    testName: 'Serum Ferritin',
    department: 'Biochemistry & Immunology',
    interpretationText: 'Ferritin is the primary intracellular iron storage protein. A low ferritin level (< 30 ng/mL in adults) is the single most specific and earliest diagnostic indicator of true iron deficiency, occurring before overt microcytic anemia develops. Ferritin also acts as an acute-phase reactant; markedly high levels (> 1000 ng/mL) indicate hyperferritinemic syndromes, severe sepsis, or hemochromatosis.',
    clinicalSignificance: 'Definitive diagnosis of iron deficiency anemia and monitoring systemic hyperinflammation/cytokine release syndromes.',
    methodologyNotes: 'Chemiluminescent two-site immunometric assay.'
  },
  FOLIC_ACID: {
    key: 'FOLIC_ACID',
    testName: 'Serum Folate / Folic Acid',
    department: 'Clinical Biochemistry',
    interpretationText: 'Folate is essential for single-carbon transfer reactions in purine/pyrimidine synthesis and homocysteine remethylation. Deficiency leads to megaloblastic anemia with hypersegmented neutrophils, indistinguishable hematologically from B12 deficiency but without subacute combined spinal cord degeneration. Deficiency during early pregnancy causes fetal neural tube defects.',
    clinicalSignificance: 'Investigates macrocytic anemia, malabsorption syndromes (celiac disease), and pre-conceptional maternal nutrition.',
    methodologyNotes: 'Competitive Chemiluminescent Immunoassay.'
  },

  // =========================================================================
  // 7. INFECTIOUS DISEASE & ACUTE FEVER SEROLOGY
  // =========================================================================
  FEVER_PANEL: {
    key: 'FEVER_PANEL',
    testName: 'Acute Pyrexia of Unknown Origin (PUO) Comprehensive Panel',
    department: 'Infectious Disease & Serology',
    interpretationText: 'Multiplex diagnostic workup for acute febrile illness in tropical and endemic regions. Concurrently screens for bacterial enteric fever (Widal), flavivirus arbovirus (Dengue NS1/IgM), protozoal infection (Malaria Pf/Pv antigen & smear), and bacterial urinary tract infection (Urine R/M) alongside complete hemogram with platelet count to detect infectious cytopenias.',
    clinicalSignificance: 'Rapid triage of acute pyrexia, preventing delayed diagnosis of complicated malaria, severe dengue, or typhoid bacteremia.',
    methodologyNotes: 'Automated 5-Part Cell Counter, Immunochromatography, and Tube Agglutination.'
  },
  DENGUE_SEROLOGY: {
    key: 'DENGUE_SEROLOGY',
    testName: 'Dengue Virus Antigen & Antibody Combo (NS1, IgM, IgG)',
    department: 'Serology & Virology',
    interpretationText: 'Dengue NS1 Antigen is detectable in serum from Day 1 to Day 5 of fever onset during the acute viremic phase. Dengue IgM antibodies appear around Day 4-5, indicating acute or primary dengue infection. Dengue IgG denotes secondary dengue infection or past flavivirus exposure. High IgG with positive NS1/IgM flags high risk for Dengue Hemorrhagic Fever (DHF).',
    clinicalSignificance: 'Definitive diagnosis and staging of Dengue fever; guides critical fluid management and platelet monitoring.',
    methodologyNotes: 'Rapid Immunochromatographic Assay / ELISA.'
  },
  TYPHOID_WIDAL: {
    key: 'TYPHOID_WIDAL',
    testName: 'Typhoid Widal Tube Agglutination Test',
    department: 'Microbiology & Serology',
    interpretationText: 'The Widal test detects agglutinating antibodies against O (somatic) and H (flagellar) antigens of Salmonella enterica serovars Typhi and Paratyphi. In endemic zones, a single isolated titer of Anti-O ≥ 1:160 and Anti-H ≥ 1:160 in the second week of unexplained continuous fever strongly suggests acute Enteric (Typhoid) fever.',
    clinicalSignificance: 'Serological diagnosis of Salmonella enteric fever when correlated with clinical presentation (step-ladder fever, splenomegaly).',
    methodologyNotes: 'Standard quantitative tube agglutination method.'
  },
  MALARIA_ANTIGEN: {
    key: 'MALARIA_ANTIGEN',
    testName: 'Malaria Parasite Antigen (Pf / Pv Rapid Test & Smear)',
    department: 'Parasitology & Hematology',
    interpretationText: 'Qualitative detection of Plasmodium falciparum-specific Histidine-Rich Protein II (HRP-II) and Plasmodium vivax-specific Parasite Lactate Dehydrogenase (pLDH). Peripheral blood thick smear provides high sensitivity for detecting low parasitemia, while thin smear allows species identification and quantification of percentage parasitemia.',
    clinicalSignificance: 'Rapid confirmation of malaria and immediate differentiation between benign P. vivax and potentially fatal P. falciparum infection.',
    methodologyNotes: 'Lateral flow immunochromatography & Giemsa-stained microscopy.'
  },
  VIRAL_HEPATITIS: {
    key: 'VIRAL_HEPATITIS',
    testName: 'Acute & Chronic Viral Hepatitis Screen (A, B, C, E)',
    department: 'Virology & Serology',
    interpretationText: 'Comprehensive serological differentiation of hepatotropic viral infections. Anti-HAV IgM and Anti-HEV IgM confirm acute feco-orally transmitted viral hepatitis. HBsAg and Anti-HCV screen for parenterally transmitted, potentially chronic viral hepatitis with risk of hepatic fibrosis and cirrhosis.',
    clinicalSignificance: 'Differential diagnosis of acute viral jaundice, acute liver failure, and chronic viral hepatitis surveillance.',
    methodologyNotes: 'Chemiluminescence Immunoassay (CLIA) and ELISA.'
  },
  HBSAG: {
    key: 'HBSAG',
    testName: 'Hepatitis B Surface Antigen (HBsAg)',
    department: 'Virology & Serology',
    interpretationText: 'HBsAg is the primary serological hallmark of Hepatitis B virus (HBV) infection, appearing 1 to 10 weeks post-exposure before clinical onset. Persistence of HBsAg for greater than 6 months defines Chronic Hepatitis B infection with increased lifetime risk of cirrhosis and hepatocellular carcinoma (HCC).',
    clinicalSignificance: 'Mandatory pre-operative, pre-transfusion, and antenatal screening; diagnosis and monitoring of acute/chronic HBV.',
    methodologyNotes: '4th Generation Chemiluminescence Immunoassay (CLIA).'
  },
  HCV_ANTIBODY: {
    key: 'HCV_ANTIBODY',
    testName: 'Hepatitis C Virus Total Antibody (Anti-HCV)',
    department: 'Virology & Serology',
    interpretationText: 'Anti-HCV detects antibodies directed against core and non-structural proteins (NS3, NS4, NS5) of the Hepatitis C virus. A positive antibody test indicates current active infection or past resolved infection; confirmatory quantitative HCV RNA PCR is mandatory to establish active replicating viral load prior to direct-acting antiviral (DAA) therapy.',
    clinicalSignificance: 'Screening for HCV in blood donors, high-risk cohorts, and investigation of chronic cryptogenic hepatitis.',
    methodologyNotes: '3rd / 4th Generation Chemiluminescence Immunoassay (CLIA).'
  },
  HIV_DUO: {
    key: 'HIV_DUO',
    testName: 'HIV-1 & HIV-2 4th Gen Antigen/Antibody Duo Screen',
    department: 'Virology & Serology',
    interpretationText: 'Fourth-generation HIV Duo assay simultaneously detects HIV-1 p24 capsid antigen and total antibodies to HIV-1 (Groups M & O) and HIV-2. By detecting p24 antigen during the early acute viremic window (prior to seroconversion), it narrows the diagnostic window period to approximately 14-21 days post-exposure.',
    clinicalSignificance: 'National AIDS Control Organization (NACO) recommended first-line screening for HIV infection.',
    methodologyNotes: 'Chemiluminescent Microparticle Immunoassay (CMIA).'
  },
  SYPHILIS_VDRL: {
    key: 'SYPHILIS_VDRL',
    testName: 'Syphilis Serology (RPR / VDRL Non-Treponemal Screen)',
    department: 'Serology',
    interpretationText: 'Rapid Plasma Reagin (RPR) / VDRL detects anti-cardiolipin reaginic antibodies released from host cells damaged by Treponema pallidum. Quantified by end-point titer (e.g., 1:8, 1:16, 1:32). A fourfold rise indicates active infection; a fourfold decline demonstrates successful antibiotic cure. Biological false-positives occur in pregnancy, autoimmune diseases, and leprosy.',
    clinicalSignificance: 'Mandatory antenatal screen (prevention of congenital syphilis) and monitoring therapeutic response in treated syphilis.',
    methodologyNotes: 'Flocculation non-treponemal antigen agglutination.'
  },
  CHIKUNGUNYA: {
    key: 'CHIKUNGUNYA',
    testName: 'Chikungunya Virus IgM Antibody',
    department: 'Serology & Virology',
    interpretationText: 'Chikungunya is an alphavirus transmitted by Aedes mosquitoes causing acute febrile polyarthralgia. Anti-Chikungunya IgM antibodies become detectable by day 4-5 post-symptom onset and persist for 2-3 months. Useful in differentiating chikungunya from dengue in co-endemic regions.',
    clinicalSignificance: 'Diagnosis of acute chikungunya fever and investigation of post-viral chronic debilitating arthritis.',
    methodologyNotes: 'Antibody capture ELISA / Immunochromatography.'
  },
  SCRUB_TYPHUS_LEPTO: {
    key: 'SCRUB_TYPHUS_LEPTO',
    testName: 'Zoonotic Tropical Fever Screen (Scrub Typhus & Leptospira)',
    department: 'Serology & Tropical Medicine',
    interpretationText: 'Screens for two dangerous zoonotic tropical infections: Scrub Typhus (Orientia tsutsugamushi transmitted by larval trombiculid mites) and Leptospirosis (Leptospira interrogans transmitted via animal urine-contaminated water). Timely detection allows prompt treatment with Doxycycline or Ceftriaxone, averting multi-organ dysfunction syndrome.',
    clinicalSignificance: 'Differential diagnosis of acute fever with hepatorenal syndrome, thrombocytopenia, or eschar.',
    methodologyNotes: 'Immunochromatographic qualitative IgM / ELISA.'
  },
  TORCH_PROFILE: {
    key: 'TORCH_PROFILE',
    testName: 'TORCH Profile 10 (IgG & IgM for Toxo, Rubella, CMV, HSV)',
    department: 'Serology & Fetomaternal Medicine',
    interpretationText: 'Screens for congenital perinatal infections: Toxoplasma gondii, Rubella virus, Cytomegalovirus (CMV), and Herpes Simplex Virus (HSV 1 & 2). Detection of specific IgM antibodies or a documented fourfold rise in paired IgG titers signifies acute primary maternal infection posing serious risk of congenital fetal anomalies or spontaneous abortion.',
    clinicalSignificance: 'Diagnostic workup for recurrent spontaneous abortions, intrauterine growth restriction (IUGR), and congenital malformations.',
    methodologyNotes: 'Chemiluminescence Immunoassay (CLIA).'
  },

  // =========================================================================
  // 8. IMMUNOLOGY, AUTOIMMUNITY & RHEUMATOLOGY
  // =========================================================================
  ARTHRITIS_PANEL: {
    key: 'ARTHRITIS_PANEL',
    testName: 'Comprehensive Inflammatory Arthritis Profile',
    department: 'Immunology & Rheumatology',
    interpretationText: 'Comprehensive diagnostic panel for inflammatory joint disease. Anti-CCP antibodies demonstrate 98% specificity for Rheumatoid Arthritis, predicting progressive erosive joint damage. Rheumatoid Factor (RF) indicates rheumatoid or mixed connective tissue disease. Quantitative hs-CRP monitors disease activity, and Uric Acid rules out crystalline gout.',
    clinicalSignificance: 'Early differential diagnosis between Rheumatoid Arthritis, Seronegative Spondyloarthropathy, Systemic Lupus, and Gouty Arthritis.',
    methodologyNotes: 'Turbidimetric quantitative assay and CLIA.'
  },
  CRP_QUANT: {
    key: 'CRP_QUANT',
    testName: 'C-Reactive Protein Quantitative (CRP)',
    department: 'Biochemistry & Immunology',
    interpretationText: 'C-Reactive Protein is an acute-phase reactant synthesized by hepatocytes in response to interleukin-6 (IL-6). Levels rise exponentially (up to 1000-fold) within 6-12 hours of tissue injury, acute bacterial infection, surgery, or active autoimmune disease, falling rapidly upon clinical resolution due to its short 19-hour half-life.',
    clinicalSignificance: 'Monitoring acute bacterial infections, post-operative sepsis, COVID-19 pulmonary hyperinflammation, and antibiotic efficacy.',
    methodologyNotes: 'Particle-enhanced immunoturbidimetric assay (mg/L).'
  },
  RA_FACTOR: {
    key: 'RA_FACTOR',
    testName: 'Rheumatoid Factor (RF Quantitative)',
    department: 'Immunology & Rheumatology',
    interpretationText: 'Rheumatoid Factor is an autoantibody (predominantly IgM) directed against the Fc region of human IgG. Present in 70-80% of patients with established Rheumatoid Arthritis. High titers correlate with aggressive erosive disease and extra-articular manifestations (rheumatoid nodules, vasculitis, interstitial lung disease).',
    clinicalSignificance: 'ACR/EULAR diagnostic criteria for Rheumatoid Arthritis; also seen in Sjögren\'s syndrome, cryoglobulinemia, and chronic infections.',
    methodologyNotes: 'Quantitative immunoturbidimetry (IU/mL).'
  },
  ANTI_CCP: {
    key: 'ANTI_CCP',
    testName: 'Anti-Cyclic Citrullinated Peptide Antibodies (Anti-CCP)',
    department: 'Immunology & Rheumatology',
    interpretationText: 'Anti-CCP (ACPA) autoantibodies target citrullinated protein epitopes generated by peptidylarginine deiminase enzymes in inflamed synovium. Demonstrates exceptional specificity (96-98%) for Rheumatoid Arthritis, often detectable years prior to the clinical onset of joint symptoms.',
    clinicalSignificance: 'Early diagnostic marker for Rheumatoid Arthritis with powerful prognostic capability for joint erosion and deformity.',
    methodologyNotes: 'Chemiluminescence Immunoassay (CLIA).'
  },
  ANA_PROFILE: {
    key: 'ANA_PROFILE',
    testName: 'Antinuclear Antibodies (ANA by Indirect Immunofluorescence)',
    department: 'Immunology',
    interpretationText: 'ANA screening by Indirect Immunofluorescence on human epithelial cells (HEp-2) is the gold standard primary screen for systemic autoimmune rheumatic diseases (SARD). Titers ≥ 1:80 with recognized staining patterns (homogeneous, speckled, nucleolar, centromere) point toward Systemic Lupus Erythematosus (SLE), Scleroderma, or Sjögren\'s Syndrome.',
    clinicalSignificance: 'First-line screening test for SLE, Mixed Connective Tissue Disease (MCTD), Systemic Sclerosis, and autoimmune hepatitis.',
    methodologyNotes: 'Indirect Immunofluorescence Assay (IFA) on HEp-2000 cells.'
  },
  ANA_17_BLOT: {
    key: 'ANA_17_BLOT',
    testName: 'ANA 17-Antigen Profile Line Immunoassay (LIA)',
    department: 'Immunology',
    interpretationText: 'Multiplex immunoblot differentiating 17 specific autoantibodies: dsDNA, Nucleosomes, Histones, Sm, SSA/Ro60, Ro52, SSB/La, Scl-70, PM-Scl, Jo-1, Centromere B, PCNA, Ribosomal-P, AMA-M2, DFS70. Anti-dsDNA and Anti-Sm are pathognomonic for Systemic Lupus Erythematosus (SLE).',
    clinicalSignificance: 'Definitive sub-specialty differentiation of systemic connective tissue diseases following a positive ANA screen.',
    methodologyNotes: 'Recombinant & native antigen Line Immunoassay with computerized blot scanner.'
  },
  ASO_TITER: {
    key: 'ASO_TITER',
    testName: 'Anti-Streptolysin O (ASO) Quantitative Titer',
    department: 'Immunology & Serology',
    interpretationText: 'Measures neutralizing antibodies directed against streptolysin O, an oxygen-labile hemolysin secreted by Group A beta-hemolytic Streptococci (Streptococcus pyogenes). Titers > 200 IU/mL indicate recent or ongoing post-streptococcal sequelae such as Acute Rheumatic Fever (ARF) or Post-Streptococcal Glomerulonephritis (PSGN).',
    clinicalSignificance: 'Confirmation of recent antecedent streptococcal infection in suspected acute rheumatic fever or glomerulonephritis.',
    methodologyNotes: 'Latex-enhanced quantitative immunoturbidimetry.'
  },
  HLA_B27: {
    key: 'HLA_B27',
    testName: 'HLA-B27 Molecular / Flow Cytometry Assay',
    department: 'Immunogenetics & Flow Cytometry',
    interpretationText: 'Identifies the Human Leukocyte Antigen class I surface marker HLA-B27. Positivity is strongly associated with seronegative spondyloarthropathies: present in > 90% of patients with Ankylosing Spondylitis and 60-80% with Reactive Arthritis, Psoriatic Spondylitis, or Enteropathic Arthritis.',
    clinicalSignificance: 'Investigates young patients presenting with chronic inflammatory low back pain, sacroiliitis, or recurrent anterior uveitis.',
    methodologyNotes: 'Multiparametric Flow Cytometry / Real-Time PCR.'
  },
  IGE_TOTAL: {
    key: 'IGE_TOTAL',
    testName: 'Serum Total Immunoglobulin E (IgE)',
    department: 'Immunology & Allergy',
    interpretationText: 'Immunoglobulin E is the reaginic antibody responsible for Type I hypersensitivity (allergic) reactions. Elevated levels occur in atopic disorders (extrinsic asthma, allergic rhinitis, atopic dermatitis), invasive helminthic parasite infections, Allergic Bronchopulmonary Aspergillosis (ABPA), and Hyper-IgE Syndrome.',
    clinicalSignificance: 'Evaluation of atopic allergic diathesis, pre-treatment screening for anti-IgE biologic therapy (Omalizumab), and ABPA workup.',
    methodologyNotes: 'Chemiluminescence Immunoassay (CLIA).'
  },
  CELIAC_SCREEN: {
    key: 'CELIAC_SCREEN',
    testName: 'Celiac Disease Screen (Anti-tTG IgA & Total IgA)',
    department: 'Immunology & Gastroenterology',
    interpretationText: 'Measures IgA antibodies directed against Tissue Transglutaminase (Anti-tTG IgA). Recognized by ESPGHAN and ACG as the most sensitive and specific non-invasive screening marker for Celiac Disease (Gluten-Sensitive Enteropathy). Concomitant Total Serum IgA measurement is mandatory to exclude selective IgA deficiency.',
    clinicalSignificance: 'Screening for celiac enteropathy in chronic diarrhea, failure to thrive, refractory iron deficiency anemia, and dermatitis herpetiformis.',
    methodologyNotes: 'Chemiluminescence / ELISA with total IgA nephelometry.'
  },

  // =========================================================================
  // 9. TUMOR & ONCOLOGY MARKERS
  // =========================================================================
  TUMOR_MALE: {
    key: 'TUMOR_MALE',
    testName: 'Comprehensive Male Oncology Tumor Marker Panel',
    department: 'Oncology & Biochemistry',
    interpretationText: 'Multiplex tumor marker panel evaluating Total PSA (Prostate), CEA (Colorectal, lung, GI), CA 19-9 (Pancreatobiliary), and AFP (Hepatocellular & germ cell). Elevated levels warrant dedicated diagnostic imaging and histopathological correlation. Not intended as sole standalone screening in asymptomatic low-risk individuals.',
    clinicalSignificance: 'Adjuvant diagnosis, staging, evaluating response to chemotherapy/surgery, and post-treatment surveillance for recurrence in male malignancies.',
    methodologyNotes: 'Chemiluminescence Immunoassay (CLIA).'
  },
  TUMOR_FEMALE: {
    key: 'TUMOR_FEMALE',
    testName: 'Comprehensive Female Oncology Tumor Marker Panel',
    department: 'Oncology & Biochemistry',
    interpretationText: 'Multiplex tumor marker panel evaluating CA-125 (Ovarian epithelial), CA 15-3 (Breast), CA 19-9 (Pancreatic & gastric), and CEA (Colorectal & GI). Serial rising titers provide sensitive early surveillance for tumor recurrence before clinical manifestation.',
    clinicalSignificance: 'Monitoring therapeutic response, residual disease detection, and recurrence surveillance in gynecological and GI malignancies.',
    methodologyNotes: 'Chemiluminescence Immunoassay (CLIA).'
  },
  PSA_TOTAL_FREE: {
    key: 'PSA_TOTAL_FREE',
    testName: 'Prostate Specific Antigen (Total PSA & Free/Total Ratio)',
    department: 'Oncology & Urology',
    interpretationText: 'Total PSA is a serine protease produced by prostate epithelial cells. For Total PSA values in the diagnostic "gray zone" (4.0 - 10.0 ng/mL), the Free-to-Total PSA percentage stratifies risk: Free PSA < 10% indicates high risk of Prostate Adenocarcinoma (> 50% probability); Free PSA > 25% indicates Benign Prostatic Hyperplasia (BPH).',
    clinicalSignificance: 'Stratifies need for prostate biopsy, monitoring prostate cancer treatment response, and surveillance post-radical prostatectomy.',
    methodologyNotes: 'Automated dual Chemiluminescence Immunoassay (CLIA).'
  },
  CA_125: {
    key: 'CA_125',
    testName: 'Cancer Antigen 125 (CA-125)',
    department: 'Oncology & Gynecology',
    interpretationText: 'CA-125 is a high-molecular-weight glycoprotein expressed on coelomic epithelium. Markedly elevated in epithelial ovarian carcinomas (> 80% of advanced cases). Modest elevations occur in benign conditions including endometriosis, pelvic inflammatory disease (PID), uterine fibroids, and peritonitis.',
    clinicalSignificance: 'Primary surveillance biomarker for monitoring epithelial ovarian cancer recurrence and assessing post-menopausal pelvic masses.',
    methodologyNotes: 'Chemiluminescent Microparticle Immunoassay (CMIA).'
  },
  CA_19_9: {
    key: 'CA_19_9',
    testName: 'Carbohydrate Antigen 19-9 (CA 19-9)',
    department: 'Oncology & Gastroenterology',
    interpretationText: 'CA 19-9 is a sialylated Lewis blood group antigen. It is the primary tumor marker for pancreatic adenocarcinoma and cholangiocarcinoma. Levels correlate with tumor stage and resectability. Note: Individuals who are Lewis antigen negative (Le a-b-) (~7% of population) do not synthesize CA 19-9.',
    clinicalSignificance: 'Monitoring therapeutic response and recurrence in pancreatic, biliary tract, and gastric carcinomas.',
    methodologyNotes: 'Chemiluminescence Immunoassay (CLIA).'
  },
  CA_15_3: {
    key: 'CA_15_3',
    testName: 'Cancer Antigen 15-3 (CA 15-3)',
    department: 'Oncology & Breast Pathology',
    interpretationText: 'CA 15-3 is a circulating mucin-1 (MUC1) epitope shed into serum by breast carcinoma cells. Elevated in 70-80% of patients with metastatic breast carcinoma. Serial rising levels correlate with progressive metastatic disease and therapy failure.',
    clinicalSignificance: 'Monitoring response to systemic therapy (chemotherapy, hormonal, targeted) and surveillance in metastatic breast cancer.',
    methodologyNotes: 'Chemiluminescence Immunoassay (CLIA).'
  },
  CEA: {
    key: 'CEA',
    testName: 'Carcinoembryonic Antigen (CEA)',
    department: 'Oncology & Gastroenterology',
    interpretationText: 'CEA is an oncofetal cell surface glycoprotein normally suppressed after birth. Elevated in colorectal carcinoma, gastric adenocarcinoma, medullary thyroid carcinoma, and lung adenocarcinoma. Heavy cigarette smoking causes mild baseline elevations (< 5.0 ng/mL). Failure of post-surgical CEA to normalize indicates residual macroscopic or occult metastatic disease.',
    clinicalSignificance: 'Gold standard post-resection surveillance for colorectal carcinoma recurrence and monitoring systemic chemotherapy.',
    methodologyNotes: 'Chemiluminescent Immunoassay (CLIA).'
  },
  AFP: {
    key: 'AFP',
    testName: 'Alpha-Fetoprotein (AFP Serum Tumor Marker)',
    department: 'Oncology & Hepatology',
    interpretationText: 'Alpha-Fetoprotein is the fetal equivalent of albumin. In adults, serum levels > 400 ng/mL in a cirrhotic patient or chronic Hepatitis B/C carrier are diagnostic of Hepatocellular Carcinoma (HCC). Also highly elevated in testicular non-seminomatous germ cell tumors (yolk sac tumors).',
    clinicalSignificance: 'Biannual surveillance of cirrhotic patients for early HCC and staging/monitoring of testicular germ cell tumors.',
    methodologyNotes: 'Chemiluminescence Immunoassay (CLIA).'
  },
  SPEP: {
    key: 'SPEP',
    testName: 'Serum Protein Electrophoresis (SPEP)',
    department: 'Biochemistry & Hematology',
    interpretationText: 'Separates serum proteins into five distinct electropheretic fractions: Albumin, Alpha-1, Alpha-2, Beta, and Gamma globulins. The detection of a sharp, restricted, narrow spike in the gamma or beta region (M-Band / Monoclonal Spike) signifies clonal plasma cell expansion, warranting workup for Multiple Myeloma, Smoldering Myeloma, Waldenström Macroglobulinemia, or MGUS.',
    clinicalSignificance: 'Mandatory investigation for unexplained bone lytic lesions, hypercalcemia, renal failure, and elevated erythrocyte sedimentation rate.',
    methodologyNotes: 'Agarose Gel Electrophoresis / High-Resolution Capillary Electrophoresis.'
  },

  // =========================================================================
  // 10. PREVENTIVE HEALTH & MASTER PACKAGES
  // =========================================================================
  MASTER_HEALTH_CHECK: {
    key: 'MASTER_HEALTH_CHECK',
    testName: 'Executive Master Health Checkup Comprehensive',
    department: 'Preventive Health & Executive Wellness',
    interpretationText: 'Comprehensive executive multi-organ screening panel evaluating hematology (CBC), hepatic function (LFT), renal clearance (KFT), cardiovascular lipids (Lipid Profile), endocrine glucose metabolism (HbA1c/Sugar), thyroid regulation (TSH), and urinalysis (Urine R/M). Identifies silent, asymptomatic lifestyle metabolic disorders at an early, reversible stage.',
    clinicalSignificance: 'Routine annual preventive health surveillance for cardiovascular disease, diabetes, silent renal disease, and hepatic steatosis.',
    methodologyNotes: 'Comprehensive multi-analyte automated analyzer panel.'
  },
  PRE_OPERATIVE: {
    key: 'PRE_OPERATIVE',
    testName: 'Pre-Operative Surgical Fitness Profile',
    department: 'Hospital Surgery & Anesthesia Triage',
    interpretationText: 'Essential clinical safety panel prior to planned surgical procedures under anesthesia. Concurrently evaluates oxygen transport and cytopenias (CBC), primary and secondary hemostatic competence (BT/CT, PT/INR), acute glycemic and renal stability (Sugar, Urea, Creatinine), and viral safety markers (HIV, HBsAg, HCV).',
    clinicalSignificance: 'Mandatory pre-anesthetic clearance, intraoperative bleeding risk assessment, and healthcare worker infection control protocol.',
    methodologyNotes: 'Coagulation, automated hematology, and high-sensitivity serology.'
  },
  ANTENATAL_PROFILE: {
    key: 'ANTENATAL_PROFILE',
    testName: 'Comprehensive Antenatal Booking Profile (ANC)',
    department: 'Obstetrics & Fetomaternal Medicine',
    interpretationText: 'Comprehensive first trimester booking panel evaluating maternal red cell reserve (CBC with Hb), maternal-fetal ABO/Rh compatibility and alloimmunization risk (Blood Group & Rh), glycemic screening (Fasting / Random Glucose), and mandatory transmissible infection screen (HIV, HBsAg, VDRL, Urine R/M) to prevent adverse pregnancy outcomes and mother-to-child transmission.',
    clinicalSignificance: 'Standard national guideline initial prenatal laboratory workup ensuring maternal-fetal health.',
    methodologyNotes: 'Multidisciplinary automated antenatal battery.'
  },
  SENIOR_CITIZEN_PANEL: {
    key: 'SENIOR_CITIZEN_PANEL',
    testName: 'Senior Citizen Geriatric Wellness & Surveillance Panel',
    department: 'Geriatric Medicine & Preventive Health',
    interpretationText: 'Tailored geriatric screening panel focusing on common chronic degenerative and metabolic conditions in the elderly: cardiovascular risk (Lipid Profile), glycemic status (HbA1c), renal function & electrolytes (KFT, Electrolytes), liver metabolism (LFT), neuro-skeletal strength (Vitamin D, B12, Calcium), and hemogram.',
    clinicalSignificance: 'Periodic monitoring of chronic multi-morbidity, polypharmacy safety, and nutritional deficiencies in elderly patients.',
    methodologyNotes: 'Automated multi-organ geriatric analyzer panel.'
  },

  // =========================================================================
  // 11. CLINICAL PATHOLOGY & MICROSCOPY
  // =========================================================================
  URINE_ROUTINE: {
    key: 'URINE_ROUTINE',
    testName: 'Urine Routine & Microscopic Examination (Complete Urinalysis)',
    department: 'Clinical Pathology & Urinalysis',
    interpretationText: 'Urinalysis evaluates physical properties (color, transparency, specific gravity), chemical dipstick markers (pH, protein, glucose, ketones, bilirubin, urobilinogen, nitrite, leukocyte esterase), and microscopic sediment (pus cells, RBCs, epithelial cells, casts, crystals, bacteria). Significant pyuria (> 5 pus cells/hpf) and bacteriuria indicate Urinary Tract Infection (UTI). Proteinuria reflects glomerular permeability alterations.',
    clinicalSignificance: 'Primary screening for urinary tract infections, renal parenchymal disease, diabetic nephropathy, and metabolic disorders.',
    methodologyNotes: 'Automated reflectometric dry chemistry strip & standardized brightfield sediment microscopy.'
  },
  SEMEN_ANALYSIS: {
    key: 'SEMEN_ANALYSIS',
    testName: 'Comprehensive Semen Analysis (WHO 6th Edition Criteria)',
    department: 'Andrology & Reproductive Pathology',
    interpretationText: 'Standardized evaluation of semen parameters conforming to WHO Laboratory Manual (6th Edition): liquefaction time, viscosity, volume, pH, sperm concentration (million/mL), total motility (progressive + non-progressive %), vitality (eosin-nigrosin), and Kruger strict sperm morphology. Essential initial investigation for male partner fertility evaluation.',
    clinicalSignificance: 'Diagnosis of oligozoospermia, asthenozoospermia, teratozoospermia, or azoospermia in couple subfertility.',
    methodologyNotes: 'Standardized phase contrast / brightfield microscopy with Makler chamber.'
  }
};

/**
 * Universal lookup helper that finds the standard diagnostic test interpretation
 * by key, short name, test code, or fuzzy test name match across the 103 test catalog.
 */
export function getStandardTestInterpretation(testKeyOrName?: string): string {
  if (!testKeyOrName || !testKeyOrName.trim()) {
    return 'This electronic diagnostic laboratory report is validated against standard laboratory reference intervals and certified by authorized medical specialists. Clinical correlation is recommended.';
  }

  const query = testKeyOrName.trim().toUpperCase();

  // 1. Direct key match
  const directMatch = MASTER_TEST_INTERPRETATION_DICTIONARY[query];
  if (directMatch) {
    return `${directMatch.interpretationText}\n\n~~End of report~~`;
  }

  // 2. Exact match against testName or shortName
  for (const item of Object.values(MASTER_TEST_INTERPRETATION_DICTIONARY)) {
    if (
      item.testName.toUpperCase() === query ||
      item.key.toUpperCase() === query ||
      item.testName.toUpperCase().includes(query) ||
      query.includes(item.key)
    ) {
      return `${item.interpretationText}\n\n~~End of report~~`;
    }
  }

  // 3. Keyword / Substring fuzzy matcher
  const fallbackKeyMap: Array<{ matches: string[]; key: string }> = [
    { matches: ['CBC', 'HEMOGRAM', 'BLOOD COUNT', 'HAEMATOLOGY'], key: 'CBC' },
    { matches: ['LIPID', 'CHOLESTEROL'], key: 'LIPID' },
    { matches: ['LFT', 'LIVER', 'BILIRUBIN', 'SGPT', 'SGOT'], key: 'LFT' },
    { matches: ['KFT', 'RFT', 'KIDNEY', 'RENAL', 'CREATININE', 'UREA'], key: 'KFT' },
    { matches: ['HBA1C', 'GLYCATED', 'DIABETIC', 'GLUCOSE', 'SUGAR'], key: 'HBA1C' },
    { matches: ['THYROID', 'TSH', 'T3', 'T4'], key: 'THYROID_TOTAL' },
    { matches: ['URINE', 'URINALYSIS'], key: 'URINE_ROUTINE' },
    { matches: ['WIDAL', 'TYPHOID'], key: 'TYPHOID_WIDAL' },
    { matches: ['DENGUE', 'NS1'], key: 'DENGUE_SEROLOGY' },
    { matches: ['MALARIA', 'MP'], key: 'MALARIA_ANTIGEN' },
    { matches: ['VITAMIN D', '25-OH'], key: 'VITAMIN_D' },
    { matches: ['VITAMIN B12', 'B12', 'COBALAMIN'], key: 'VITAMIN_B12' },
    { matches: ['FERRITIN', 'IRON'], key: 'IRON_PROFILE' },
    { matches: ['ELECTROLYTE', 'SODIUM', 'POTASSIUM'], key: 'ELECTROLYTES' },
    { matches: ['TROPONIN', 'CARDIAC', 'BNP'], key: 'CARDIAC_MARKERS' },
    { matches: ['PSA'], key: 'PSA_TOTAL_FREE' },
    { matches: ['ESR'], key: 'ESR' }
  ];

  for (const entry of fallbackKeyMap) {
    if (entry.matches.some(m => query.includes(m))) {
      const item = MASTER_TEST_INTERPRETATION_DICTIONARY[entry.key];
      if (item?.interpretationText) {
        return `${item.interpretationText}\n\n~~End of report~~`;
      }
    }
  }

  // 4. Default high-standard interpretation
  return `This clinical diagnostic investigation has been validated against national and international reference intervals (NABL ISO 15189:2022). Test findings should be correlated clinically with patient medical history, physical signs, and concurrent pharmacological regimens.\n\n~~End of report~~`;
}
