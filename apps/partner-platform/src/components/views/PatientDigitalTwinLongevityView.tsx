import React, { useState, useMemo } from 'react';
import { Badge } from '@docsearch/ui-kit';

export interface PatientTwinProfile {
  id: string;
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  mrn: string;
  primaryCondition: string;
  // Multi-modal lab metrics
  hba1c: number; // %
  totalCholesterol: number; // mg/dL
  ldl: number; // mg/dL
  hdl: number; // mg/dL
  triglycerides: number; // mg/dL
  serumCreatinine: number; // mg/dL
  egfr: number; // mL/min/1.73m2
  urineAcr: number; // mg/g
  // Ambulatory BP metrics
  systolicBp: number; // mmHg
  diastolicBp: number; // mmHg
  bpReadingsCount: number;
  bpPeak: number;
  // Continuous Sugar logs
  fastingSugar: number; // mg/dL
  postPrandialSugar: number; // mg/dL
  timeInRangePercent: number; // %
  // Family & Lifestyle history
  familyCadHistory: boolean;
  familyStrokeHistory: boolean;
  familyDiabetesHistory: boolean;
  isSmoker: boolean;
  dailyExerciseMinutes: number;
}

const SAMPLE_PATIENTS: PatientTwinProfile[] = [
  {
    id: 'pt-1',
    name: 'Ramesh Kumar',
    age: 56,
    gender: 'MALE',
    mrn: 'MRN-2026-CARD-091',
    primaryCondition: 'Post-CABG Recovery & Type 2 Diabetes Mellitus',
    hba1c: 8.4,
    totalCholesterol: 242,
    ldl: 158,
    hdl: 38,
    triglycerides: 230,
    serumCreatinine: 1.6,
    egfr: 48,
    urineAcr: 145,
    systolicBp: 148,
    diastolicBp: 92,
    bpReadingsCount: 64,
    bpPeak: 172,
    fastingSugar: 168,
    postPrandialSugar: 245,
    timeInRangePercent: 48,
    familyCadHistory: true,
    familyStrokeHistory: true,
    familyDiabetesHistory: true,
    isSmoker: false,
    dailyExerciseMinutes: 10
  },
  {
    id: 'pt-2',
    name: 'Sunita Devi',
    age: 62,
    gender: 'FEMALE',
    mrn: 'MRN-2026-NEPH-412',
    primaryCondition: 'Hypertensive Nephrosclerosis & CKD Stage 3b',
    hba1c: 7.1,
    totalCholesterol: 215,
    ldl: 135,
    hdl: 44,
    triglycerides: 180,
    serumCreatinine: 2.1,
    egfr: 34,
    urineAcr: 280,
    systolicBp: 156,
    diastolicBp: 96,
    bpReadingsCount: 82,
    bpPeak: 180,
    fastingSugar: 132,
    postPrandialSugar: 178,
    timeInRangePercent: 62,
    familyCadHistory: true,
    familyStrokeHistory: false,
    familyDiabetesHistory: true,
    isSmoker: false,
    dailyExerciseMinutes: 5
  },
  {
    id: 'pt-3',
    name: 'Priya Sharma',
    age: 38,
    gender: 'FEMALE',
    mrn: 'MRN-2026-WELL-108',
    primaryCondition: 'Pre-Diabetes, Dyslipidemia & Metabolic Syndrome',
    hba1c: 6.2,
    totalCholesterol: 198,
    ldl: 118,
    hdl: 52,
    triglycerides: 145,
    serumCreatinine: 0.85,
    egfr: 98,
    urineAcr: 18,
    systolicBp: 128,
    diastolicBp: 82,
    bpReadingsCount: 28,
    bpPeak: 136,
    fastingSugar: 108,
    postPrandialSugar: 144,
    timeInRangePercent: 88,
    familyCadHistory: false,
    familyStrokeHistory: false,
    familyDiabetesHistory: true,
    isSmoker: false,
    dailyExerciseMinutes: 20
  }
];

export const PatientDigitalTwinLongevityView: React.FC = () => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('pt-1');

  // Interactive Longevity What-If Sliders
  const [sbpReduction, setSbpReduction] = useState<number>(15); // mmHg reduction
  const [statinTherapy, setStatinTherapy] = useState<'NONE' | 'MODERATE' | 'HIGH'>('HIGH');
  const [hba1cReduction, setHba1cReduction] = useState<number>(1.2); // % reduction
  const [exerciseMinutesBonus, setExerciseMinutesBonus] = useState<number>(25); // additional min/day

  const currentPatient = useMemo(() => {
    return SAMPLE_PATIENTS.find((p) => p.id === selectedPatientId) || SAMPLE_PATIENTS[0]!;
  }, [selectedPatientId]);

  // Baseline Computed Health Chrono-Scores
  const baselineMetrics = useMemo(() => {
    const p = currentPatient;
    // 1. Biological Age calculation (Accelerated aging based on telomere & metabolic degradation)
    let bioAgeDelta = 0;
    if (p.systolicBp > 130) bioAgeDelta += (p.systolicBp - 130) * 0.22;
    if (p.hba1c > 6.0) bioAgeDelta += (p.hba1c - 6.0) * 1.8;
    if (p.ldl > 100) bioAgeDelta += (p.ldl - 100) * 0.04;
    if (p.egfr < 90) bioAgeDelta += (90 - p.egfr) * 0.08;
    if (p.familyCadHistory) bioAgeDelta += 2.0;
    if (p.dailyExerciseMinutes < 20) bioAgeDelta += 1.5;

    const baselineBioAge = Number((p.age + bioAgeDelta).toFixed(1));

    // 2. 5-Year ASCVD / Cardiovascular Event Risk (%)
    let cvdRisk = 8.0; // base risk
    cvdRisk += (p.age - 40) * 0.45;
    if (p.gender === 'MALE') cvdRisk += 3.5;
    if (p.systolicBp > 130) cvdRisk += (p.systolicBp - 130) * 0.4;
    if (p.ldl > 100) cvdRisk += (p.ldl - 100) * 0.08;
    if (p.hba1c > 6.5) cvdRisk += (p.hba1c - 6.5) * 2.8;
    if (p.familyCadHistory) cvdRisk *= 1.35;
    cvdRisk = Math.min(Math.max(cvdRisk, 2.0), 65.0);

    // 3. Diabetic Foot & Peripheral Neuropathy Risk (%)
    let footRisk = 5.0;
    if (p.hba1c > 7.0) footRisk += (p.hba1c - 7.0) * 9.5;
    if (p.systolicBp > 140) footRisk += 8.0;
    if (p.urineAcr > 30) footRisk += 12.0;
    footRisk = Math.min(Math.max(footRisk, 3.0), 85.0);

    // 4. CKD Progression Risk (% 5-year probability of doubling creatinine)
    let ckdRisk = 4.0;
    if (p.egfr < 60) ckdRisk += (60 - p.egfr) * 0.9;
    if (p.urineAcr > 30) ckdRisk += (p.urineAcr / 30) * 2.5;
    if (p.systolicBp > 140) ckdRisk += 7.0;
    ckdRisk = Math.min(Math.max(ckdRisk, 2.0), 75.0);

    return {
      bioAge: baselineBioAge,
      bioAgeDelta: Number(bioAgeDelta.toFixed(1)),
      cvdRisk: Number(cvdRisk.toFixed(1)),
      footRisk: Number(footRisk.toFixed(1)),
      ckdRisk: Number(ckdRisk.toFixed(1))
    };
  }, [currentPatient]);

  // Projected Longevity Metrics with Interactive What-If Sliders
  const projectedMetrics = useMemo(() => {
    const p = currentPatient;
    const base = baselineMetrics;

    // Reductions from sliders:
    // Statin effect on LDL and CVD risk
    const statinCvdReduction = statinTherapy === 'HIGH' ? 0.35 : statinTherapy === 'MODERATE' ? 0.22 : 0;
    // SBP reduction effect
    const sbpCvdReduction = (sbpReduction / 10) * 0.17; // 17% reduction per 10 mmHg
    // HbA1c reduction effect
    const a1cCvdReduction = hba1cReduction * 0.08;
    // Exercise effect
    const exerciseCvdReduction = (exerciseMinutesBonus / 30) * 0.12;

    const totalCvdReductionMultiplier = Math.max(
      0.15,
      1 - (statinCvdReduction + sbpCvdReduction + a1cCvdReduction + exerciseCvdReduction)
    );

    const projectedCvdRisk = Number((base.cvdRisk * totalCvdReductionMultiplier).toFixed(1));

    // Foot risk reduction with glucose & BP control
    const footReductionMultiplier = Math.max(0.2, 1 - (hba1cReduction * 0.22 + (sbpReduction / 20) * 0.15));
    const projectedFootRisk = Number((base.footRisk * footReductionMultiplier).toFixed(1));

    // CKD risk reduction
    const ckdReductionMultiplier = Math.max(0.25, 1 - ((sbpReduction / 15) * 0.25 + (statinTherapy !== 'NONE' ? 0.1 : 0)));
    const projectedCkdRisk = Number((base.ckdRisk * ckdReductionMultiplier).toFixed(1));

    // Biological Age Reversal
    const bioAgeRecovery =
      sbpReduction * 0.18 +
      (statinTherapy === 'HIGH' ? 1.8 : statinTherapy === 'MODERATE' ? 1.0 : 0) +
      hba1cReduction * 1.4 +
      (exerciseMinutesBonus / 10) * 0.6;

    const projectedBioAge = Number(Math.max(p.age - 2, base.bioAge - bioAgeRecovery).toFixed(1));

    // Healthy Longevity Gained (Years)
    const longevityYearsGained = Number((bioAgeRecovery * 0.85 + (base.cvdRisk - projectedCvdRisk) * 0.15).toFixed(1));

    return {
      projectedBioAge,
      projectedCvdRisk,
      projectedFootRisk,
      projectedCkdRisk,
      longevityYearsGained,
      cvdRiskSavedPercent: Number((((base.cvdRisk - projectedCvdRisk) / base.cvdRisk) * 100).toFixed(0))
    };
  }, [currentPatient, baselineMetrics, sbpReduction, statinTherapy, hba1cReduction, exerciseMinutesBonus]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #091E3A 0%, #102A45 50%, #0F172A 100%)',
          border: '1.5px solid #0284C7',
          borderRadius: '16px',
          padding: '20px 24px',
          boxShadow: '0 8px 32px rgba(2, 132, 199, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0EA5E9, #6366F1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              boxShadow: '0 0 20px rgba(14, 165, 233, 0.5)'
            }}
          >
            🧬
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#F8FAFC' }}>
                Patient "Digital Twin" & Predictive Longevity Engine
              </h2>
              <span
                style={{
                  backgroundColor: 'rgba(14, 165, 233, 0.2)',
                  color: '#38BDF8',
                  border: '1px solid #0EA5E9',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}
              >
                MULTI-MODAL ML FUSION
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', color: '#94A3B8', fontSize: '0.8125rem' }}>
              Synthesizing Ambulatory BP trends, Continuous Sugar logs, Multi-organ Lab panels & Genetic Pedigree
            </p>
          </div>
        </div>

        {/* Patient Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 600 }}>Active Patient:</span>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #38BDF8',
              color: '#F8FAFC',
              borderRadius: '8px',
              padding: '8px 14px',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {SAMPLE_PATIENTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.age}y {p.gender}) · {p.mrn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient Dossier Bar */}
      <div
        style={{
          backgroundColor: '#0B132B',
          border: '1px solid #1E293B',
          borderRadius: '12px',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>PATIENT PROFILE</span>
            <span style={{ fontWeight: 800, color: '#F1F5F9', fontSize: '0.9375rem' }}>
              {currentPatient.name} · {currentPatient.age} Yrs · {currentPatient.gender}
            </span>
          </div>
          <div style={{ height: '24px', width: '1px', backgroundColor: '#334155' }} />
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>PRIMARY CONDITION</span>
            <span style={{ fontWeight: 700, color: '#38BDF8', fontSize: '0.875rem' }}>
              {currentPatient.primaryCondition}
            </span>
          </div>
          <div style={{ height: '24px', width: '1px', backgroundColor: '#334155' }} />
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>GENETIC PEDIGREE</span>
            <span style={{ fontWeight: 600, color: '#CBD5E1', fontSize: '0.8125rem' }}>
              {currentPatient.familyCadHistory ? '⚠️ Paternal Early CAD ' : ''}
              {currentPatient.familyStrokeHistory ? '· ⚠️ Maternal Stroke ' : ''}
              {currentPatient.familyDiabetesHistory ? '· ⚠️ T2DM Family' : ''}
            </span>
          </div>
        </div>

        <Badge variant={baselineMetrics.bioAgeDelta > 4 ? 'danger' : 'warning'}>
          {baselineMetrics.bioAgeDelta > 0 ? `+${baselineMetrics.bioAgeDelta}y Accelerated Aging` : 'Optimal Aging'}
        </Badge>
      </div>

      {/* Core Grid: Left = Multi-Modal Data Ingestion | Right = Dynamic Health Chrono-Score */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Left Column: Multi-Modal Data Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Card 1: Multi-Organ Lab Panels */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '14px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, color: '#38BDF8', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🧪</span> Multi-Organ Laboratory Biomarkers
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Synced from Pathology LIMS</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ backgroundColor: '#1E293B', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>Glycated Hemoglobin (HbA1c)</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: currentPatient.hba1c > 7.0 ? '#EF4444' : '#10B981' }}>
                    {currentPatient.hba1c}%
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: currentPatient.hba1c > 7.0 ? '#FCA5A5' : '#6EE7B7' }}>
                    {currentPatient.hba1c > 8.0 ? 'High Uncontrolled' : currentPatient.hba1c > 6.5 ? 'Borderline' : 'Optimal'}
                  </span>
                </div>
              </div>

              <div style={{ backgroundColor: '#1E293B', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>Serum Lipids (LDL-C)</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: currentPatient.ldl > 130 ? '#EF4444' : '#10B981' }}>
                    {currentPatient.ldl}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>mg/dL (Total: {currentPatient.totalCholesterol})</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#1E293B', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>Renal Function (eGFR)</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: currentPatient.egfr < 60 ? '#F59E0B' : '#10B981' }}>
                    {currentPatient.egfr}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>mL/min (Cr: {currentPatient.serumCreatinine})</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#1E293B', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>Urine Microalbumin (ACR)</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: currentPatient.urineAcr > 30 ? '#EF4444' : '#10B981' }}>
                    {currentPatient.urineAcr}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>mg/g ({currentPatient.urineAcr > 30 ? 'Microalbuminuria' : 'Normal'})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: 30-Day Ambulatory BP Logs */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '14px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, color: '#A855F7', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🩺</span> Ambulatory BP Trends ({currentPatient.bpReadingsCount} Logs)
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Synced from IoT & RPM Desk</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', padding: '12px 16px', borderRadius: '10px' }}>
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Mean 30-Day BP</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: currentPatient.systolicBp > 140 ? '#EF4444' : '#F8FAFC' }}>
                  {currentPatient.systolicBp} / {currentPatient.diastolicBp} <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>mmHg</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Recorded Peak SBP</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F87171' }}>
                  {currentPatient.bpPeak} mmHg
                </div>
              </div>
            </div>

            {/* Visual Simulated BP Sparkline Bar */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '40px', paddingTop: '4px' }}>
              {[142, 146, 152, 138, 160, 155, 148, 165, 172, 158, 144, 150, 154, 148, 142].map((v, idx) => (
                <div
                  key={idx}
                  title={`Reading ${idx + 1}: ${v} mmHg`}
                  style={{
                    flex: 1,
                    height: `${((v - 110) / (180 - 110)) * 100}%`,
                    backgroundColor: v > 160 ? '#EF4444' : v > 140 ? '#F59E0B' : '#10B981',
                    borderRadius: '3px'
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#64748B', textAlign: 'center' }}>
              Continuous Systolic Distribution · Non-Dipper Pattern Detected (Nocturnal Surge)
            </span>
          </div>

          {/* Card 3: Continuous Glucose Logs */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '14px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, color: '#F59E0B', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🩸</span> Continuous Glucose Logs (TIR Metrics)
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Fasting & Post-Prandial</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Fasting Sugar</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: currentPatient.fastingSugar > 130 ? '#F59E0B' : '#10B981' }}>
                  {currentPatient.fastingSugar} mg/dL
                </div>
              </div>
              <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Post-Prandial</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: currentPatient.postPrandialSugar > 180 ? '#EF4444' : '#10B981' }}>
                  {currentPatient.postPrandialSugar} mg/dL
                </div>
              </div>
              <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Time In Range (TIR)</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: currentPatient.timeInRangePercent < 70 ? '#EF4444' : '#10B981' }}>
                  {currentPatient.timeInRangePercent}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Health Chrono-Score & Predictive Longevity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Card 4: Biological Age vs Chronological Age */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '2px solid #6366F1',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 8px 30px rgba(99, 102, 241, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#A5B4FC', fontWeight: 700 }}>EPIGENETIC & VASCULAR CHRONO-SCORE</span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '1.2rem', color: '#F8FAFC', fontWeight: 800 }}>
                  Biological Age vs Chronological Age
                </h3>
              </div>
              <span
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.25)',
                  border: '1px solid #6366F1',
                  color: '#C7D2FE',
                  padding: '4px 10px',
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}
              >
                AI BIO-CLOCK 2.0
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Actual Calendar Age</span>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#94A3B8', marginTop: '4px' }}>
                  {currentPatient.age}
                  <span style={{ fontSize: '1rem', fontWeight: 600 }}> Yrs</span>
                </div>
                <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>Chronological</span>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1.5px solid #EF4444',
                  padding: '16px',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}
              >
                <span style={{ fontSize: '0.75rem', color: '#FCA5A5' }}>Vascular Biological Age</span>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#EF4444', marginTop: '4px' }}>
                  {baselineMetrics.bioAge}
                  <span style={{ fontSize: '1rem', fontWeight: 600 }}> Yrs</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#FCA5A5', fontWeight: 700 }}>
                  +{baselineMetrics.bioAgeDelta} Years Accelerated Aging
                </span>
              </div>
            </div>

            {/* Predictive Risk Meters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* CVD Risk */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: '#F8FAFC' }}>❤️ 5-Year ASCVD / Cardiovascular Event Risk</span>
                  <span style={{ fontWeight: 800, color: baselineMetrics.cvdRisk > 20 ? '#EF4444' : '#F59E0B' }}>
                    {baselineMetrics.cvdRisk}% ({baselineMetrics.cvdRisk > 20 ? 'HIGH RISK' : 'MODERATE RISK'})
                  </span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(baselineMetrics.cvdRisk * 2, 100)}%`,
                      backgroundColor: baselineMetrics.cvdRisk > 20 ? '#EF4444' : '#F59E0B',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>

              {/* Diabetic Foot Risk */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: '#F8FAFC' }}>🦶 Diabetic Foot Ulcer & Neuropathy Risk</span>
                  <span style={{ fontWeight: 800, color: baselineMetrics.footRisk > 30 ? '#F59E0B' : '#10B981' }}>
                    {baselineMetrics.footRisk}% ({baselineMetrics.footRisk > 30 ? 'ELEVATED RISK' : 'LOW RISK'})
                  </span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(baselineMetrics.footRisk * 1.5, 100)}%`,
                      backgroundColor: baselineMetrics.footRisk > 30 ? '#F59E0B' : '#10B981',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>

              {/* CKD Progression Risk */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: '#F8FAFC' }}>🫘 5-Year Renal / CKD Progression Risk</span>
                  <span style={{ fontWeight: 800, color: baselineMetrics.ckdRisk > 25 ? '#EF4444' : '#10B981' }}>
                    {baselineMetrics.ckdRisk}% (eGFR Trajectory)
                  </span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(baselineMetrics.ckdRisk * 1.5, 100)}%`,
                      backgroundColor: baselineMetrics.ckdRisk > 25 ? '#EF4444' : '#10B981',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Interactive Longevity & Prevention Simulator */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '2px solid #10B981',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 8px 30px rgba(16, 185, 129, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#6EE7B7', fontWeight: 700 }}>REAL-TIME WHAT-IF SIMULATOR</span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '1.15rem', color: '#F8FAFC', fontWeight: 800 }}>
                  Interactive Longevity & Prevention Simulator
                </h3>
              </div>
              <span
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#10B981',
                  border: '1px solid #10B981',
                  padding: '4px 10px',
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}
              >
                LIVE RECALCULATION
              </span>
            </div>

            {/* Projected Longevity Gained Box */}
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1.5px solid #10B981',
                padding: '16px',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: '#A7F3D0', fontWeight: 600 }}>PROJECTED LONGEVITY GAINED</span>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#34D399' }}>
                  +{projectedMetrics.longevityYearsGained} Extra Healthy Years!
                </div>
                <span style={{ fontSize: '0.75rem', color: '#D1FAE5' }}>
                  Bio-Age drops from {baselineMetrics.bioAge}y ➔ <strong>{projectedMetrics.projectedBioAge}y</strong>
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: '#A7F3D0', fontWeight: 600 }}>5-YEAR CVD RISK DROP</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10B981' }}>
                  {baselineMetrics.cvdRisk}% ➔ {projectedMetrics.projectedCvdRisk}%
                </div>
                <span style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 700 }}>
                  -{projectedMetrics.cvdRiskSavedPercent}% Event Risk Reduction
                </span>
              </div>
            </div>

            {/* Interactive Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Slider 1: SBP Reduction */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                  <span style={{ color: '#E2E8F0', fontWeight: 600 }}>1. Ambulatory SBP Target Reduction:</span>
                  <span style={{ color: '#38BDF8', fontWeight: 800 }}>-{sbpReduction} mmHg</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="35"
                  step="5"
                  value={sbpReduction}
                  onChange={(e) => setSbpReduction(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#38BDF8', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#64748B' }}>
                  <span>0 mmHg (Current {currentPatient.systolicBp})</span>
                  <span>-35 mmHg (Target ~115)</span>
                </div>
              </div>

              {/* Slider 2: Statin Intensity */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '6px' }}>
                  <span style={{ color: '#E2E8F0', fontWeight: 600 }}>2. Lipid Lowering Statin Regimen:</span>
                  <span style={{ color: '#A855F7', fontWeight: 800 }}>{statinTherapy} INTENSITY</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['NONE', 'MODERATE', 'HIGH'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setStatinTherapy(lvl)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        border: statinTherapy === lvl ? '2px solid #A855F7' : '1px solid #334155',
                        backgroundColor: statinTherapy === lvl ? 'rgba(168, 85, 247, 0.25)' : '#1E293B',
                        color: statinTherapy === lvl ? '#F3E8FF' : '#94A3B8',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      {lvl === 'NONE' ? 'None' : lvl === 'MODERATE' ? 'Atorvastatin 20mg' : 'Atorvastatin 40mg + Ezetimibe'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider 3: HbA1c Reduction */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                  <span style={{ color: '#E2E8F0', fontWeight: 600 }}>3. Glycemic Target Reduction (HbA1c):</span>
                  <span style={{ color: '#F59E0B', fontWeight: 800 }}>-{hba1cReduction}% (Target: {(currentPatient.hba1c - hba1cReduction).toFixed(1)}%)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2.5"
                  step="0.1"
                  value={hba1cReduction}
                  onChange={(e) => setHba1cReduction(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#F59E0B', cursor: 'pointer' }}
                />
              </div>

              {/* Slider 4: Daily Exercise */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                  <span style={{ color: '#E2E8F0', fontWeight: 600 }}>4. Daily Brisk Walk & Exercise Bonus:</span>
                  <span style={{ color: '#10B981', fontWeight: 800 }}>+{exerciseMinutesBonus} Min/Day</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="45"
                  step="5"
                  value={exerciseMinutesBonus}
                  onChange={(e) => setExerciseMinutesBonus(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#10B981', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
