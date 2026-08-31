import React, { useState } from 'react';
import { Card, Button, Badge, Input, Select } from '@docsearch/ui-kit';

export type MedicalSpecialty =
  | 'GENERAL_MEDICINE'
  | 'PEDIATRICS'
  | 'CARDIOLOGY'
  | 'OPHTHALMOLOGY'
  | 'ORTHOPEDICS'
  | 'OB_GYN'
  | 'DENTISTRY'
  | 'DERMATOLOGY';

export interface SpecialtyAdaptiveEMREngineProps {
  currentSpecialty?: MedicalSpecialty;
  patientAgeYears?: number;
  
  onApplySpecialtyFindings: (text: string) => void;
}

export const SpecialtyAdaptiveEMREngine: React.FC<SpecialtyAdaptiveEMREngineProps> = ({
  currentSpecialty = 'GENERAL_MEDICINE',
  patientAgeYears = 32,
  
  onApplySpecialtyFindings
}) => {
  const [specialty, setSpecialty] = useState<MedicalSpecialty>(currentSpecialty);

  // Pediatrics State
  const [childWeightKg, setChildWeightKg] = useState<number>(12);
  const [selectedVaccines, setSelectedVaccines] = useState<string[]>(['BCG', 'Polio (OPV)', 'Pentavalent 1']);

  // Ophthalmology State
  const [eyeRefraction, setEyeRefraction] = useState({
    rightSph: '-1.50',
    rightCyl: '-0.50',
    rightAxis: '90°',
    rightVA: '6/6',
    rightIOP: '14 mmHg',
    leftSph: '-1.75',
    leftCyl: '-0.25',
    leftAxis: '85°',
    leftVA: '6/6',
    leftIOP: '15 mmHg'
  });

  // Cardiology State
  const [systolicBP, setSystolicBP] = useState<number>(130);
  const [diastolicBP, setDiastolicBP] = useState<number>(85);
  const [pulseRate, setPulseRate] = useState<number>(76);
  const [nyhaClass, setNyhaClass] = useState<string>('CLASS_I');

  // OB-GYN State
  const [lmpDate, setLmpDate] = useState<string>('2026-04-15');
  const [gplaScore, setGplaScore] = useState<string>('G2 P1 L1 A0');

  // Orthopedics State
  const [painVasScore, setPainVasScore] = useState<number>(6);
  const [affectedJoint, setAffectedJoint] = useState<string>('Right Knee');
  const [romFlexion, setRomFlexion] = useState<number>(110);

  // Dental State
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([16, 26, 36]);
  const [dentalProcedure, setDentalProcedure] = useState<string>('Class II Composite Restoration');

  // Dermatology State
  const [lesionType, setLesionType] = useState<string>('Maculopapular Rash');
  const [lesionSite, setLesionSite] = useState<string>('Bilateral Forearms & Torso');

  // 1. Pediatric Dosing Calculator
  const calcParacetamolDose = () => (childWeightKg * 15).toFixed(0); // 15 mg/kg
  const calcAmoxicillinDose = () => (childWeightKg * 40).toFixed(0); // 40 mg/kg

  // 2. OB-GYN EDD Calculator (Naegele's Rule: +1 year, -3 months, +7 days)
  const calcEDD = () => {
    try {
      const d = new Date(lmpDate);
      if (isNaN(d.getTime())) return '2027-01-22';
      d.setDate(d.getDate() + 280);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '2027-01-22';
    }
  };

  // 3. Cardiology Stage Classifier
  const getCardioRiskLabel = () => {
    if (systolicBP >= 140 || diastolicBP >= 90) return { label: 'Stage 2 Hypertension', color: '#EF4444' };
    if (systolicBP >= 130 || diastolicBP >= 80) return { label: 'Stage 1 Hypertension', color: '#F59E0B' };
    if (systolicBP >= 120 && diastolicBP < 80) return { label: 'Elevated BP', color: '#38BDF8' };
    return { label: 'Normal Healthy BP', color: '#10B981' };
  };

  const handlePushToRx = () => {
    let summary = '';
    if (specialty === 'PEDIATRICS') {
      summary = `[Pediatric Assessment]: Weight ${childWeightKg}kg. Calculated Doses: Syrup Paracetamol (250mg/5ml) = ${(Number(calcParacetamolDose()) / 50).toFixed(1)}ml TDS, Syrup Amox-Clav = ${(Number(calcAmoxicillinDose()) / 45.7).toFixed(1)}ml BD. Vaccination Status: ${selectedVaccines.join(', ')}.`;
    } else if (specialty === 'OPHTHALMOLOGY') {
      summary = `[Eye Refraction Snellen]: OD (Right): Sph ${eyeRefraction.rightSph}, Cyl ${eyeRefraction.rightCyl} @ ${eyeRefraction.rightAxis} (VA: ${eyeRefraction.rightVA}, IOP: ${eyeRefraction.rightIOP}). OS (Left): Sph ${eyeRefraction.leftSph}, Cyl ${eyeRefraction.leftCyl} @ ${eyeRefraction.leftAxis} (VA: ${eyeRefraction.leftVA}, IOP: ${eyeRefraction.leftIOP}).`;
    } else if (specialty === 'CARDIOLOGY') {
      summary = `[Cardiovascular Evaluation]: BP ${systolicBP}/${diastolicBP} mmHg (${getCardioRiskLabel().label}), Pulse ${pulseRate} bpm. NYHA Functional Category: ${nyhaClass}. Advised ECG & Lipid Profile monitoring.`;
    } else if (specialty === 'OB_GYN') {
      summary = `[Antenatal Record]: LMP: ${lmpDate}, Expected Delivery Date (EDD): ${calcEDD()}. Obstetric Score: ${gplaScore}. Routine Fetal Well-being & Iron/Folic Acid supplementation prescribed.`;
    } else if (specialty === 'ORTHOPEDICS') {
      summary = `[Orthopedic Examination]: Affected Area: ${affectedJoint}. Visual Pain VAS: ${painVasScore}/10. Joint ROM Flexion: ${romFlexion}°. Recommended Physiotherapy & NSAID pain protocol.`;
    } else if (specialty === 'DENTISTRY') {
      summary = `[Dental Charting]: Involved Teeth: FDI #${selectedTeeth.join(', #')}. Planned Procedure: ${dentalProcedure}. Local antiseptic mouthwash & hygiene instructions given.`;
    } else if (specialty === 'DERMATOLOGY') {
      summary = `[Dermatological Findings]: Primary Morphology: ${lesionType} distributed over ${lesionSite}. Recommended topical barrier repair and antihistamine therapy.`;
    } else {
      summary = `[General Medicine]: Vitals & systemic examination completed. Routine metabolic panel & symptom-oriented treatment advised.`;
    }

    onApplySpecialtyFindings(summary);
  };

  return (
    <Card padding="md" style={{ border: '2px solid rgba(6, 182, 212, 0.4)', backgroundColor: '#0B132B', borderRadius: '16px' }}>
      
      {/* Header with Specialty Mode Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.5rem' }}>🩺</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#F8FAFC' }}>
              Specialty-Adaptive Clinical Co-Pilot
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Dynamic specialty layout, calculators, and automated clinical documentation
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1' }}>Active Specialty:</label>
          <Select
            options={[
              { label: '🩺 General Medicine / Internal', value: 'GENERAL_MEDICINE' },
              { label: '👶 Pediatrics (Child Care)', value: 'PEDIATRICS' },
              { label: '❤️ Cardiology (Heart & BP)', value: 'CARDIOLOGY' },
              { label: '👁️ Ophthalmology (Eye Vision)', value: 'OPHTHALMOLOGY' },
              { label: '🦴 Orthopedics (Bone & Joint)', value: 'ORTHOPEDICS' },
              { label: '🤰 OB-GYN & Maternity', value: 'OB_GYN' },
              { label: '🦷 Dental & Maxillofacial', value: 'DENTISTRY' },
              { label: '🧠 Dermatology (Skin & Hair)', value: 'DERMATOLOGY' }
            ]}
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value as MedicalSpecialty)}
          />
        </div>
      </div>

      {/* 1. PEDIATRICS UI */}
      {specialty === 'PEDIATRICS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge variant="warning">👶 Pediatric Dosing & Immunization Studio</Badge>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Patient Age: {patientAgeYears} Yrs</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                CHILD WEIGHT (KG) *
              </label>
              <Input
                type="number"
                min="1"
                max="80"
                value={childWeightKg}
                onChange={(e) => setChildWeightKg(Number(e.target.value))}
              />
            </div>

            <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase' }}>Paracetamol Syrup (250mg/5ml)</span>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#F8FAFC', marginTop: '2px' }}>
                {(Number(calcParacetamolDose()) / 50).toFixed(1)} mL <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94A3B8' }}>(TDS / 8 Hourly)</span>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#A7F3D0', textTransform: 'uppercase' }}>Amoxicillin-Clav Syrup (457mg/5ml)</span>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#F8FAFC', marginTop: '2px' }}>
                {(Number(calcAmoxicillinDose()) / 45.7).toFixed(1)} mL <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94A3B8' }}>(BD / 12 Hourly)</span>
              </div>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
              ✓ National Immunization Checklist:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['BCG', 'Polio (OPV)', 'Hepatitis B', 'Pentavalent 1', 'Pentavalent 2', 'Rotavirus', 'PCV', 'MMR (9 Months)', 'DPT Booster'].map((v) => {
                const isSelected = selectedVaccines.includes(v);
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      setSelectedVaccines((prev) => isSelected ? prev.filter((x) => x !== v) : [...prev, v]);
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: isSelected ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.4)',
                      color: isSelected ? '#A7F3D0' : '#94A3B8'
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '} {v}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. OPHTHALMOLOGY UI */}
      {specialty === 'OPHTHALMOLOGY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Badge variant="primary">👁️ Binocular Refraction & Snellen Acuity Grid</Badge>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Right Eye OD */}
            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8', display: 'block', marginBottom: '8px' }}>
                OD — RIGHT EYE (Oculus Dexter)
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>SPH</label>
                  <Input value={eyeRefraction.rightSph} onChange={(e) => setEyeRefraction({ ...eyeRefraction, rightSph: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>CYL</label>
                  <Input value={eyeRefraction.rightCyl} onChange={(e) => setEyeRefraction({ ...eyeRefraction, rightCyl: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>AXIS</label>
                  <Input value={eyeRefraction.rightAxis} onChange={(e) => setEyeRefraction({ ...eyeRefraction, rightAxis: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>VISUAL ACUITY</label>
                  <Input value={eyeRefraction.rightVA} onChange={(e) => setEyeRefraction({ ...eyeRefraction, rightVA: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>IOP PRESSURE</label>
                  <Input value={eyeRefraction.rightIOP} onChange={(e) => setEyeRefraction({ ...eyeRefraction, rightIOP: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Left Eye OS */}
            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8', display: 'block', marginBottom: '8px' }}>
                OS — LEFT EYE (Oculus Sinister)
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>SPH</label>
                  <Input value={eyeRefraction.leftSph} onChange={(e) => setEyeRefraction({ ...eyeRefraction, leftSph: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>CYL</label>
                  <Input value={eyeRefraction.leftCyl} onChange={(e) => setEyeRefraction({ ...eyeRefraction, leftCyl: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>AXIS</label>
                  <Input value={eyeRefraction.leftAxis} onChange={(e) => setEyeRefraction({ ...eyeRefraction, leftAxis: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>VISUAL ACUITY</label>
                  <Input value={eyeRefraction.leftVA} onChange={(e) => setEyeRefraction({ ...eyeRefraction, leftVA: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>IOP PRESSURE</label>
                  <Input value={eyeRefraction.leftIOP} onChange={(e) => setEyeRefraction({ ...eyeRefraction, leftIOP: e.target.value })} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. CARDIOLOGY UI */}
      {specialty === 'CARDIOLOGY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge variant="danger">❤️ Cardiovascular Hemodynamics & Risk Stratification</Badge>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: getCardioRiskLabel().color }}>
              ● {getCardioRiskLabel().label}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>SYSTOLIC BP (mmHg)</label>
              <Input type="number" value={systolicBP} onChange={(e) => setSystolicBP(Number(e.target.value))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>DIASTOLIC BP (mmHg)</label>
              <Input type="number" value={diastolicBP} onChange={(e) => setDiastolicBP(Number(e.target.value))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>PULSE RATE (bpm)</label>
              <Input type="number" value={pulseRate} onChange={(e) => setPulseRate(Number(e.target.value))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>NYHA HEART FAILURE CLASS</label>
              <Select
                options={[
                  { label: 'Class I (No Limitation)', value: 'CLASS_I' },
                  { label: 'Class II (Mild Shortness of Breath)', value: 'CLASS_II' },
                  { label: 'Class III (Marked Limitation)', value: 'CLASS_III' },
                  { label: 'Class IV (Symptoms at Rest)', value: 'CLASS_IV' }
                ]}
                value={nyhaClass}
                onChange={(e) => setNyhaClass(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. OB-GYN UI */}
      {specialty === 'OB_GYN' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Badge variant="warning">🤰 Antenatal & Obstetric Gestational Calculator</Badge>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>LAST MENSTRUAL PERIOD (LMP) *</label>
              <Input type="date" value={lmpDate} onChange={(e) => setLmpDate(e.target.value)} />
            </div>
            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#FCD34D', textTransform: 'uppercase' }}>Expected Delivery Date (EDD)</span>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#F8FAFC', marginTop: '2px' }}>
                {calcEDD()}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>OBSTETRIC SCORE (GPLA)</label>
              <Input value={gplaScore} onChange={(e) => setGplaScore(e.target.value)} placeholder="e.g. G2 P1 L1 A0" />
            </div>
          </div>
        </div>
      )}

      {/* 5. ORTHOPEDICS UI */}
      {specialty === 'ORTHOPEDICS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Badge variant="primary">🦴 Joint Range of Motion (ROM) & Visual Pain VAS</Badge>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>AFFECTED JOINT / LIMB</label>
              <Input value={affectedJoint} onChange={(e) => setAffectedJoint(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                VISUAL PAIN VAS ({painVasScore}/10)
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={painVasScore}
                onChange={(e) => setPainVasScore(Number(e.target.value))}
                style={{ width: '100%', marginTop: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>FLEXION ANGLE (°)</label>
              <Input type="number" value={romFlexion} onChange={(e) => setRomFlexion(Number(e.target.value))} />
            </div>
          </div>
        </div>
      )}

      {/* 6. DENTISTRY UI */}
      {specialty === 'DENTISTRY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '8px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1' }}>Planned Dental Procedure</label>
          <Input value={dentalProcedure} onChange={(e) => setDentalProcedure(e.target.value)} />
        </div>
      )}
      {specialty === 'DENTISTRY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Badge variant="neutral">🦷 32-Tooth Universal FDI Charting</Badge>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
              Select Involved Teeth Quadrants:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38].map((t) => {
                const isSelected = selectedTeeth.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTeeth((prev) => isSelected ? prev.filter((x) => x !== t) : [...prev, t])}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '6px',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #06B6D4' : '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.3)' : 'rgba(30, 41, 59, 0.5)',
                      color: isSelected ? '#FFF' : '#94A3B8'
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 7. DERMATOLOGY UI */}
      {specialty === 'DERMATOLOGY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Badge variant="primary">🧠 Cutaneous Lesion Morphology & Site Map</Badge>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>PRIMARY MORPHOLOGY</label>
              <Input value={lesionType} onChange={(e) => setLesionType(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>ANATOMICAL DISTRIBUTION</label>
              <Input value={lesionSite} onChange={(e) => setLesionSite(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action: Push Findings to Prescription */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handlePushToRx}
          style={{ backgroundColor: '#06B6D4', borderColor: '#06B6D4', color: '#070C16', fontWeight: 800 }}
        >
          ⚡ Append ${specialty.replace('_', ' ')} Findings to Prescription Note
        </Button>
      </div>
    </Card>
  );
};
