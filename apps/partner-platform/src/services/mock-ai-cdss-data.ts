import type {
  SepsisNews2AlertDto,
  DdiInteractionAssessmentDto,
  RenalDoseAdjustmentDto,
  AmbientAiSoapTranscriptDto,
  DiagnosticPanicValueAlertDto,
  CdssOverviewMetricsDto,
  CdssAuditTraceDto
} from '@docsearch/api-contracts';

export const mockCdssOverviewMetrics: CdssOverviewMetricsDto = {
  activeSepsisAlertsCount: 3,
  highRiskPatientsCount: 8,
  ddiInteractionsBlockedMonth: 142,
  ambientSoapNotesDraftedMonth: 380,
  criticalPanicValuesToday: 4,
  averageSepsisBundleCompliancePct: 96.4,
  physicianOverrideRatePct: 4.2,
  aiModelAccuracyPct: 98.1
};

export const mockSepsisAlerts: SepsisNews2AlertDto[] = [
  {
    id: 'sep-1111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    patientMrn: 'MRN-2026-9021',
    patientName: 'Gopal Krishna',
    bedNumber: 'Bed 304',
    wardName: 'Medical Inpatient Ward 3',
    news2Score: 8,
    qsofaScore: 2,
    riskGrade: 'HIGH_RISK_RED_ALERT_7_PLUS',
    respiratoryRate: 26,
    spO2Pct: 88,
    requiresSupplementalO2: true,
    systolicBp: 88,
    pulseRate: 124,
    temperatureCelsius: 39.2,
    consciousnessLevel: 'VOICE',
    serumLactateMmolL: 4.2,
    bundleChecklist: {
      bloodCulturesOrdered: true,
      lactateMeasured: true,
      ivAntibioticsGiven: true,
      ivFluidsAdministered: true,
      vasopressorsStarted: false
    },
    alertStatus: 'TRIGGERED_ACTIVE',
    triggeredAt: '2026-08-30T06:15:00.000Z',
    acknowledgedBy: null
  },
  {
    id: 'sep-1111-1111-4111-8111-111111111102',
    tenantId: '11111111-1111-4111-8111-111111111111',
    patientMrn: 'MRN-2026-8819',
    patientName: 'Meenakshi Sundaram',
    bedNumber: 'Bed 212',
    wardName: 'Surgical HDU',
    news2Score: 5,
    qsofaScore: 1,
    riskGrade: 'MEDIUM_RISK_5_6',
    respiratoryRate: 22,
    spO2Pct: 93,
    requiresSupplementalO2: false,
    systolicBp: 102,
    pulseRate: 98,
    temperatureCelsius: 38.4,
    consciousnessLevel: 'ALERT',
    serumLactateMmolL: 2.1,
    bundleChecklist: {
      bloodCulturesOrdered: true,
      lactateMeasured: true,
      ivAntibioticsGiven: false,
      ivFluidsAdministered: false,
      vasopressorsStarted: false
    },
    alertStatus: 'ACKNOWLEDGED_RRT_EN_ROUTE',
    triggeredAt: '2026-08-30T05:45:00.000Z',
    acknowledgedBy: 'Dr. Vivek Mehra'
  }
];

export const mockDdiAssessments: DdiInteractionAssessmentDto[] = [
  {
    id: 'ddi-1',
    drugA: 'Warfarin Sodium 5mg',
    drugB: 'Clarithromycin 500mg (Macrolide)',
    severityLevel: 'CONTRAINDICATED_FATAL',
    clinicalConsequence: 'Profound inhibition of CYP2C9 leading to massive surge in free Warfarin levels, severe INR elevation (> 8.0), and catastrophic internal bleeding risk.',
    mechanism: 'Potent hepatic CYP3A4 & CYP2C9 metabolism inhibition + gut flora Vitamin K depletion.',
    recommendedManagement: 'Strictly avoid combination. Prescribe Azithromycin as alternative macrolide or reduce Warfarin dose by 50% with daily INR monitoring.',
    evidenceReference: 'Micromedex / Lexicomp Category X'
  },
  {
    id: 'ddi-2',
    drugA: 'Ramipril 5mg (ACE Inhibitor)',
    drugB: 'Spironolactone 25mg (Aldosterone Antagonist)',
    severityLevel: 'MAJOR_CLINICAL_RISK',
    clinicalConsequence: 'Synergistic potassium retention causing life-threatening hyperkalemia (K+ > 6.5 mEq/L) and fatal cardiac arrhythmias.',
    mechanism: 'Dual blockade of renin-angiotensin-aldosterone system (RAAS) renal potassium excretion.',
    recommendedManagement: 'Monitor serum potassium and renal function (eGFR) at baseline and 1 week post-initiation.',
    evidenceReference: 'UpToDate DDI Severity: Major'
  },
  {
    id: 'ddi-3',
    drugA: 'Levothyroxine 100mcg',
    drugB: 'Calcium Carbonate 500mg',
    severityLevel: 'MODERATE_MONITOR_REQUIRED',
    clinicalConsequence: 'Chelation in the gastrointestinal tract resulting in significantly decreased absorption of thyroid hormone and elevated TSH.',
    mechanism: 'Insoluble physical chelate binding in the stomach.',
    recommendedManagement: 'Separate administration times by at least 4 hours.',
    evidenceReference: 'American Thyroid Association (ATA) Guidelines'
  }
];

export const mockRenalDoseAdjustments: RenalDoseAdjustmentDto[] = [
  {
    id: 'ren-1',
    patientMrn: 'MRN-2026-9021',
    patientName: 'Gopal Krishna',
    serumCreatinineMgDl: 2.8,
    estimatedGfrMlMin: 24.5,
    drugName: 'Meropenem IV 1g TDS',
    prescribedDose: '1g IV q8h (Standard Dose)',
    recommendedRenalDose: '500mg IV q12h (Renally Adjusted for eGFR < 25 mL/min)',
    adjustmentRationale: 'Prevent neurotoxicity and seizure threshold lowering due to reduced renal clearance.',
    severity: 'CRITICAL_TOXICITY_RISK'
  },
  {
    id: 'ren-2',
    patientMrn: 'MRN-2026-8819',
    patientName: 'Meenakshi Sundaram',
    serumCreatinineMgDl: 1.6,
    estimatedGfrMlMin: 42.0,
    drugName: 'Enoxaparin Sodium (LMWH)',
    prescribedDose: '60mg SC BD',
    recommendedRenalDose: '40mg SC OD (Anti-Xa Monitoring Required)',
    adjustmentRationale: 'Bioaccumulation of low molecular weight heparin in moderate renal impairment.',
    severity: 'MODERATE_ACCUMULATION'
  }
];

export const mockAmbientSoapTranscripts: AmbientAiSoapTranscriptDto[] = [
  {
    id: 'soap-1111-1111-4111-8111-111111111101',
    patientMrn: 'MRN-2026-9021',
    patientName: 'Gopal Krishna',
    doctorName: 'Dr. Sanjay Gupta',
    specialtyName: 'Cardiology',
    encounterTimestamp: '2026-08-30T06:20:00.000Z',
    audioDurationSeconds: 195,
    rawTranscriptExcerpt: "Doctor: Gopal ji, how have you been feeling since starting the new blood pressure medicine? Patient: Doctor, chest tightness is better, but I feel slight dizziness when I stand up quickly in the morning. Doctor: Let me check your sitting and standing BP... 118/74 sitting, 102/66 standing. Lungs are clear, bilateral basal vesicular breath sounds present...",
    soapNote: {
      subjective: "58-year-old male with known coronary artery disease and hypertension presents for follow-up. Reports resolution of exertional angina, but notes mild postural lightheadedness on rapid standing.",
      objective: "Vitals: BP Sitting 118/74 mmHg, Standing 102/66 mmHg (orthostatic drop 16 mmHg). Pulse: 64 bpm regular. Cardiovascular: S1 S2 heard, no murmur or gallop. Respiratory: Vesicular breath sounds bilaterally clear. Extremities: No pedal edema.",
      assessment: "1. Well-controlled Coronary Artery Disease. 2. Mild orthostatic hypotension secondary to antihypertensive titration.",
      plan: "1. Advise adequate hydration and slow postural changes. 2. Reduce Telmisartan from 80mg to 40mg OD. 3. Continue Atorvastatin 20mg and Aspirin 75mg. 4. Re-check BP chart in 2 weeks."
    },
    suggestedIcd10Codes: [
      { code: 'I25.10', description: 'Atherosclerotic heart disease of native coronary artery', confidencePct: 98.5 },
      { code: 'I95.1', description: 'Orthostatic hypotension', confidencePct: 94.2 }
    ],
    suggestedPrescriptions: [
      { drugName: 'Telmisartan 40mg', dosage: '1 Tablet', frequency: 'OD Morning', duration: '30 Days' },
      { drugName: 'Atorvastatin 20mg', dosage: '1 Tablet', frequency: 'OD Bedtime', duration: '30 Days' },
      { drugName: 'Aspirin 75mg', dosage: '1 Tablet', frequency: 'OD Post-lunch', duration: '30 Days' }
    ],
    reviewStatus: 'AI_DRAFTED'
  }
];

export const mockPanicValues: DiagnosticPanicValueAlertDto[] = [
  {
    id: 'pva-1',
    patientMrn: 'MRN-2026-9021',
    patientName: 'Gopal Krishna',
    location: 'Medical Ward 3 — Bed 304',
    testName: 'Serum Troponin I (High Sensitivity)',
    measuredValue: '1.45 ng/mL',
    referenceNormalRange: '0.00 - 0.04 ng/mL',
    panicThreshold: '> 0.10 ng/mL',
    category: 'CARDIAC_ENZYME_CRITICAL',
    urgencyLevel: 'CRITICAL_LIFE_THREAT',
    clinicalRiskSummary: 'Severe elevation consistent with acute myocardial infarction (NSTEMI/STEMI). Immediate STAT 12-lead ECG and Cardiology escalation required.',
    communicatedToDoctor: true,
    doctorName: 'Dr. Sanjay Gupta',
    alertTimestamp: '2026-08-30T06:22:00.000Z',
    acknowledgementTimestamp: null
  },
  {
    id: 'pva-2',
    patientMrn: 'MRN-2026-8819',
    patientName: 'Meenakshi Sundaram',
    location: 'Surgical HDU — Bed 212',
    testName: 'Serum Potassium (K+)',
    measuredValue: '6.7 mEq/L',
    referenceNormalRange: '3.5 - 5.0 mEq/L',
    panicThreshold: '> 6.0 mEq/L',
    category: 'ELECTROLYTE_LETHAL',
    urgencyLevel: 'CRITICAL_LIFE_THREAT',
    clinicalRiskSummary: 'Severe hyperkalemia with high risk of sine-wave ventricular arrhythmias. STAT Calcium Gluconate IV + Insulin-Dextrose infusion indicated.',
    communicatedToDoctor: true,
    doctorName: 'Dr. Vivek Mehra',
    alertTimestamp: '2026-08-30T05:50:00.000Z',
    acknowledgementTimestamp: '2026-08-30T05:52:00.000Z'
  }
];

export const mockCdssAuditTraces: CdssAuditTraceDto[] = [
  {
    id: 'cdss-tr-1111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    traceNumber: 'TRACE-CDSS-09912',
    action: 'SEPSIS_NEWS2_TRIGGERED',
    entityType: 'SEPSIS_ALERT',
    entityId: 'sep-1111-1111-4111-8111-111111111101',
    entityCode: 'NEWS2-SCORE-8',
    actorName: 'AI Clinical CDS Rules Engine',
    actorRole: 'SYSTEM_CDSS',
    justification: 'Automated evaluation detected NEWS2 Score of 8 (SpO2 88%, RR 26, HR 124, Lactate 4.2). Red alert dispatched to Rapid Response Team.',
    integrityHash: 'f4e8b01298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852c009',
    timestamp: '2026-08-30T06:15:00.000Z'
  }
];
