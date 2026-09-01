import React, { useState } from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';

interface ClinicalSimulationResult {
  differentialDiagnosis: string[];
  suggestedInvestigations: string[];
  contraindicationWarning: string | null;
  icdCodes: string[];
  latencyMs: number;
  tokensConsumed: number;
  hallucinationConfidencePct: number;
  modelUsed: string;
}

export const AiClinicalPlaygroundView: React.FC = () => {
  const [selectedCase, setSelectedCase] = useState<'DIABETES_NEPHRO' | 'CARDIAC_TRIAGE' | 'PEDIATRIC_FEVER'>('DIABETES_NEPHRO');
  const [patientVitals, setPatientVitals] = useState('Age 54, Male | BP: 142/88 mmHg | Fasting Sugar: 210 mg/dL | Serum Creatinine: 2.1 mg/dL');
  const [patientSymptoms, setPatientSymptoms] = useState('Patient reports bilateral pedal edema, fatigue for 3 weeks, and nocturia. Currently taking Metformin 1000mg BD.');
  const [selectedModel, setSelectedModel] = useState('Med-PaLM 2 Clinical');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<ClinicalSimulationResult | null>(null);

  const handleRunSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setSimResult(null);

    setTimeout(() => {
      setIsSimulating(false);
      if (selectedCase === 'DIABETES_NEPHRO') {
        setSimResult({
          differentialDiagnosis: [
            'Diabetic Kidney Disease (CKD Stage 3a)',
            'Hypertensive Nephrosclerosis',
            'Metformin-Associated Lactic Acidosis Risk'
          ],
          suggestedInvestigations: [
            'Urinary Albumin-to-Creatinine Ratio (UACR)',
            'Estimated GFR (eGFR Calculation)',
            'Renal Ultrasound (Bilateral Kidneys)',
            'HbA1c & Serum Electrolytes (Potassium)'
          ],
          contraindicationWarning: 'CRITICAL: Serum Creatinine is 2.1 mg/dL (eGFR <30-45 mL/min). Metformin must be dose-reduced or discontinued to avoid lactic acidosis.',
          icdCodes: ['E11.22 (Type 2 Diabetes with Diabetic CKD)', 'N18.30 (CKD Stage 3)', 'I10 (Essential Hypertension)'],
          latencyMs: 142,
          tokensConsumed: 485,
          hallucinationConfidencePct: 99.85,
          modelUsed: selectedModel
        });
      } else if (selectedCase === 'CARDIAC_TRIAGE') {
        setSimResult({
          differentialDiagnosis: [
            'Atypical Angina Pectoris / Coronary Artery Disease',
            'Gastroesophageal Reflux Disease (GERD)',
            'Costochondritis'
          ],
          suggestedInvestigations: [
            'High-Sensitivity Troponin-I (Serial 0 & 3 hr)',
            '12-Lead Electrocardiogram (ECG)',
            'Echocardiography (2D-Echo with LVEF)'
          ],
          contraindicationWarning: 'Caution: In suspected acute coronary syndrome, avoid NSAIDs for chest pain relief.',
          icdCodes: ['I20.9 (Angina Pectoris)', 'K21.9 (GERD)', 'R07.9 (Chest Pain Unspecified)'],
          latencyMs: 128,
          tokensConsumed: 420,
          hallucinationConfidencePct: 99.92,
          modelUsed: selectedModel
        });
      } else {
        setSimResult({
          differentialDiagnosis: [
            'Viral Exanthem / Dengue Fever',
            'Measles / Rubella Syndrome',
            'Roseola Infantum'
          ],
          suggestedInvestigations: [
            'Complete Blood Count (CBC) with Platelet Count',
            'Dengue NS1 Antigen & IgM Serology',
            'Liver Function Test (SGPT/SGOT)'
          ],
          contraindicationWarning: 'CRITICAL: In pediatric fevers with suspected viral vector/dengue, NEVER prescribe Aspirin or Ibuprofen (Reye Syndrome & Bleed Risk). Prescribe Paracetamol only.',
          icdCodes: ['A90 (Dengue Fever)', 'B08.2 (Exanthema Subitum)', 'R50.9 (Fever Unspecified)'],
          latencyMs: 115,
          tokensConsumed: 390,
          hallucinationConfidencePct: 99.96,
          modelUsed: selectedModel
        });
      }
    }, 450);
  };

  const handleCaseChange = (c: 'DIABETES_NEPHRO' | 'CARDIAC_TRIAGE' | 'PEDIATRIC_FEVER') => {
    setSelectedCase(c);
    setSimResult(null);
    if (c === 'DIABETES_NEPHRO') {
      setPatientVitals('Age 54, Male | BP: 142/88 mmHg | Fasting Sugar: 210 mg/dL | Serum Creatinine: 2.1 mg/dL');
      setPatientSymptoms('Patient reports bilateral pedal edema, fatigue for 3 weeks, and nocturia. Currently taking Metformin 1000mg BD.');
    } else if (c === 'CARDIAC_TRIAGE') {
      setPatientVitals('Age 48, Female | BP: 158/96 mmHg | Pulse: 94 bpm | SpO2: 98% on room air');
      setPatientSymptoms('Substernal retrosternal chest tightness radiating to left jaw during exertion, relieved by 10 mins rest.');
    } else {
      setPatientVitals('Age 4, Male | Temperature: 102.4°F | Pulse: 118 bpm | CRT: <2 sec');
      setPatientSymptoms('High-grade fever for 4 days, maculopapular rash on trunk and arms, mild abdominal discomfort.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            🩺 Clinical AI Playground & Diagnostic Co-Pilot Simulator
          </h2>
          <Badge variant="success">Med-PaLM 2 / GPT-4o-Med Active</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Interactive clinical testbed for evaluating AI differential diagnoses, drug interaction guardrails, and ICD-11 coding precision
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr', gap: '20px' }}>
        {/* Left Column: Input Simulator */}
        <Card title="⚡ Patient Case Formulation & Model Selection" padding="lg">
          <form onSubmit={handleRunSimulation} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem' }}>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px', fontWeight: 700 }}>SAMPLE CLINICAL SCENARIOS:</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleCaseChange('DIABETES_NEPHRO')}
                  style={{ backgroundColor: selectedCase === 'DIABETES_NEPHRO' ? 'rgba(6, 182, 212, 0.2)' : '#1E293B', border: `1px solid ${selectedCase === 'DIABETES_NEPHRO' ? '#06B6D4' : '#334155'}`, color: selectedCase === 'DIABETES_NEPHRO' ? '#38BDF8' : '#CBD5E1', borderRadius: '6px', padding: '6px 10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  🧪 Diabetic Nephropathy
                </button>
                <button
                  type="button"
                  onClick={() => handleCaseChange('CARDIAC_TRIAGE')}
                  style={{ backgroundColor: selectedCase === 'CARDIAC_TRIAGE' ? 'rgba(6, 182, 212, 0.2)' : '#1E293B', border: `1px solid ${selectedCase === 'CARDIAC_TRIAGE' ? '#06B6D4' : '#334155'}`, color: selectedCase === 'CARDIAC_TRIAGE' ? '#38BDF8' : '#CBD5E1', borderRadius: '6px', padding: '6px 10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  ❤️ Angina Cardiac Triage
                </button>
                <button
                  type="button"
                  onClick={() => handleCaseChange('PEDIATRIC_FEVER')}
                  style={{ backgroundColor: selectedCase === 'PEDIATRIC_FEVER' ? 'rgba(6, 182, 212, 0.2)' : '#1E293B', border: `1px solid ${selectedCase === 'PEDIATRIC_FEVER' ? '#06B6D4' : '#334155'}`, color: selectedCase === 'PEDIATRIC_FEVER' ? '#38BDF8' : '#CBD5E1', borderRadius: '6px', padding: '6px 10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  👶 Pediatric Fever & Rash
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>AI MEDICAL FOUNDATION MODEL *</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
              >
                <option value="Med-PaLM 2 Clinical">Google Med-PaLM 2 (Clinical Diagnostic Fine-Tuned)</option>
                <option value="Claude 3.5 Sonnet Medical">Anthropic Claude 3.5 Sonnet (Medical Protocol)</option>
                <option value="OpenAI GPT-4o Healthcare">OpenAI GPT-4o Healthcare (Zero Data Retention)</option>
                <option value="BioBERT-Clinical-OnPrem">BioBERT Local On-Premise Engine (Zero Cloud)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>PATIENT VITALS & CLINICAL PARAMETERS *</label>
              <input
                type="text"
                required
                value={patientVitals}
                onChange={(e) => setPatientVitals(e.target.value)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>SYMPTOMS & CURRENT MEDICATIONS *</label>
              <textarea
                rows={3}
                required
                value={patientSymptoms}
                onChange={(e) => setPatientSymptoms(e.target.value)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF', resize: 'vertical' }}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSimulating}
              style={{ backgroundColor: '#06B6D4', color: '#070C16', fontWeight: 900, marginTop: '4px' }}
            >
              {isSimulating ? '⚡ Running Clinical Diagnostics Inference...' : '✨ Run AI Clinical Diagnostic Simulation'}
            </Button>
          </form>
        </Card>

        {/* Right Column: Inference Output */}
        <Card title="🔬 AI Inference Synthesis & Diagnostic Summary" padding="lg">
          {simResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem' }}>
              {/* Telemetry Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px' }}>
                <span style={{ color: '#10B981', fontWeight: 800 }}>⚡ Latency: {simResult.latencyMs}ms</span>
                <span style={{ color: '#38BDF8', fontFamily: 'monospace' }}>Confidence: {simResult.hallucinationConfidencePct}%</span>
                <span style={{ color: '#94A3B8' }}>{simResult.tokensConsumed} Tokens</span>
              </div>

              {/* Contraindication Warning Alert */}
              {simResult.contraindicationWarning && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1.5px solid #EF4444', borderRadius: '8px', padding: '10px 14px', color: '#FCA5A5', lineHeight: '1.4' }}>
                  🚨 <strong>SAFETY CONTRAINDICATION:</strong> {simResult.contraindicationWarning}
                </div>
              )}

              {/* Differential Diagnosis */}
              <div style={{ backgroundColor: '#1E293B', borderRadius: '8px', padding: '12px', border: '1px solid #334155' }}>
                <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                  Differential Diagnosis Suggestions:
                </span>
                <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px', color: '#F8FAFC' }}>
                  {simResult.differentialDiagnosis.map((d, i) => (
                    <li key={i}><strong style={{ color: '#FFF' }}>{d}</strong></li>
                  ))}
                </ul>
              </div>

              {/* Suggested Investigations */}
              <div style={{ backgroundColor: '#1E293B', borderRadius: '8px', padding: '12px', border: '1px solid #334155' }}>
                <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                  Recommended Clinical Investigations & Labs:
                </span>
                <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px', color: '#CBD5E1' }}>
                  {simResult.suggestedInvestigations.map((inv, i) => (
                    <li key={i}>{inv}</li>
                  ))}
                </ul>
              </div>

              {/* ICD-11 Codes */}
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
                  Suggested ICD-10 / ICD-11 Diagnostic Codes:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {simResult.icdCodes.map((code, i) => (
                    <Badge key={i} variant="primary">{code}</Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px 10px', color: '#94A3B8' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🩺</div>
              <span style={{ fontSize: '0.8125rem' }}>
                Select a clinical scenario and click <strong>"Run AI Clinical Diagnostic Simulation"</strong> to evaluate AI diagnosis, investigations, and drug contraindications.
              </span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
