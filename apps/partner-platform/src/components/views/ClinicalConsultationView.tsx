import { DrugInteractionJanAushadhiEngine } from './DrugInteractionJanAushadhiEngine.js';
import { SpecialtyAdaptiveEMREngine } from './SpecialtyAdaptiveEMREngine.js';
import React, { useState } from 'react';
import type {
  ConsultationDto,
  ConsultationMedicationDto,
  ConsultationDiagnosisDto
} from '@docsearch/api-contracts';
import { Card, Button, Badge, Tabs } from '@docsearch/ui-kit';

export interface ClinicalConsultationViewProps {
  consultation: ConsultationDto | null;
  actorId: string;
  actorRole: string;
  onStartConsultation: (consultation: ConsultationDto) => void;
  onSaveDraft: (consultation: ConsultationDto, draftData: Partial<ConsultationDto>) => void;
  onOpenAddVitals: (consultation: ConsultationDto) => void;
  onOpenAddDiagnosis: (consultation: ConsultationDto) => void;
  onRemoveDiagnosis: (consultation: ConsultationDto, diagnosisId: string) => void;
  onOpenAddMedication: (consultation: ConsultationDto) => void;
  onOpenEditMedication: (consultation: ConsultationDto, medication: ConsultationMedicationDto) => void;
  onDiscontinueMedication: (consultation: ConsultationDto, medication: ConsultationMedicationDto) => void;
  onOpenAddInstruction: (consultation: ConsultationDto) => void;
  onOpenCreateFollowUp: (consultation: ConsultationDto) => void;
  onOpenCompleteConsultation: (consultation: ConsultationDto, assessment: string, treatmentPlan: string) => void;
  onOpenAmendConsultation: (consultation: ConsultationDto) => void;
  onOpenCreateInvestigationOrder?: (consultation: ConsultationDto) => void;
}

export const ClinicalConsultationView: React.FC<ClinicalConsultationViewProps> = ({
  consultation,
  onStartConsultation,
  onSaveDraft,
  onOpenAddVitals,
  onOpenAddDiagnosis,
  onRemoveDiagnosis,
  onOpenAddMedication,
  onOpenEditMedication,
  onDiscontinueMedication,
  onOpenAddInstruction,
  onOpenCreateFollowUp,
  onOpenCompleteConsultation,
  onOpenAmendConsultation,
  onOpenCreateInvestigationOrder
}) => {
  const [activeSection, setActiveSection] = useState<'notes' | 'vitals' | 'diagnoses' | 'medications' | 'investigations' | 'instructions' | 'plan'>('notes');
  const [chiefComplaint, setChiefComplaint] = useState(consultation?.chiefComplaint ?? '');
  const [hpi, setHpi] = useState(consultation?.historyOfPresentIllness ?? '');
  const [medicalHist, setMedicalHist] = useState(consultation?.medicalHistory ?? '');
  const [surgicalHist, setSurgicalHist] = useState(consultation?.surgicalHistory ?? '');
  const [familyHist, setFamilyHist] = useState(consultation?.familyHistory ?? '');
  const [socialHist, setSocialHist] = useState(consultation?.socialHistory ?? '');
  const [assessment, setAssessment] = useState(consultation?.clinicalAssessment ?? '');
  const [treatmentPlan, setTreatmentPlan] = useState(consultation?.treatmentPlan ?? '');

  if (!consultation) {
    return (
      <Card padding="lg">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🩺</div>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 600 }}>No Consultation Record Selected</h3>
          <p style={{ margin: 0, color: 'var(--ds-color-text-muted)' }}>
            Select an active patient or encounter from the Doctor Worklist to begin or view a clinical consultation.
          </p>
        </div>
      </Card>
    );
  }

  const isCompleted = consultation.consultationStatus === 'COMPLETED';

  const handleSaveDraftClick = () => {
    onSaveDraft(consultation, {
      chiefComplaint,
      historyOfPresentIllness: hpi,
      medicalHistory: medicalHist,
      surgicalHistory: surgicalHist,
      familyHistory: familyHist,
      socialHistory: socialHist,
      clinicalAssessment: assessment,
      treatmentPlan
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <SpecialtyAdaptiveEMREngine
        patientAgeYears={32}
        
        onApplySpecialtyFindings={(findings) => {
          setAssessment((prev) => (prev ? prev + '\n\n' + findings : findings));
        }}
      />

      <DrugInteractionJanAushadhiEngine
        onSubstituteGeneric={(genericName, strength) => {
          setTreatmentPlan((prev) => (prev ? prev + '\n• Rx (Jan Aushadhi Generic): ' + genericName + ' ' + strength : '• Rx (Jan Aushadhi Generic): ' + genericName + ' ' + strength));
        }}
      />

      {/* Patient & Encounter Master Header */}
      <Card padding="md" style={{ borderLeft: isCompleted ? '6px solid #16a34a' : '6px solid var(--ds-color-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ds-color-text-primary)' }}>
                {consultation.patientName}
              </span>
              <Badge variant="primary">{consultation.patientGender ?? 'UNKNOWN'}</Badge>
              {consultation.queueToken && <Badge variant="warning">Token: {consultation.queueToken}</Badge>}
              <Badge variant={isCompleted ? 'success' : 'neutral'}>{consultation.consultationStatus}</Badge>
              {consultation.isAmended && <Badge variant="warning">Amended v{consultation.version}</Badge>}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)', marginTop: '4px' }}>
              <span><strong>MRN:</strong> {consultation.patientMrn}</span>
              <span><strong>DOB:</strong> {consultation.patientDob ?? '—'}</span>
              <span><strong>Encounter:</strong> {consultation.encounterNumber}</span>
              <span><strong>Physician:</strong> {consultation.doctorName} ({consultation.doctorSpecialty})</span>
              <span><strong>Branch:</strong> {consultation.branchName ?? 'Apex Care Center'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {consultation.consultationStatus === 'DRAFT' && (
              <Button size="sm" variant="primary" onClick={() => onStartConsultation(consultation)}>
                ▶️ Start Consultation
              </Button>
            )}

            {!isCompleted && (
              <>
                <Button size="sm" variant="outline" onClick={handleSaveDraftClick}>
                  💾 Save Draft
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onOpenCompleteConsultation(consultation, assessment, treatmentPlan)}
                >
                  🔒 Complete & Sign
                </Button>
              </>
            )}

            {isCompleted && (
              <Button size="sm" variant="outline" onClick={() => onOpenAmendConsultation(consultation)}>
                📝 Addendum / Amend
              </Button>
            )}
          </div>
        </div>

        {/* Prominent Allergy Alert Banner */}
        {consultation.patientAllergies.length > 0 && (
          <div style={{ marginTop: '12px', background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '6px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1rem' }}>⚠️</span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#991b1b' }}>
              DOCUMENTED ALLERGIES: {consultation.patientAllergies.join(' · ')}
            </span>
          </div>
        )}
      </Card>

      {/* Navigation Tabs for Consultation Sections */}
      <Tabs
        tabs={[
          { id: 'notes', label: '📝 Clinical History' },
          { id: 'vitals', label: '💓 Vitals & Exam' },
          { id: 'diagnoses', label: `🔬 Diagnoses (${consultation.diagnoses.length})` },
          { id: 'medications', label: `💊 Prescriptions (${consultation.medications.length})` },
          { id: 'investigations', label: '🔬 Diagnostic Orders' },
          { id: 'instructions', label: '📋 Instructions & Care' },
          { id: 'plan', label: '🎯 Assessment & Plan' }
        ]}
        activeTabId={activeSection}
        onTabChange={(tabId: string) => setActiveSection(tabId as typeof activeSection)}
      />

      {/* Section 1: Clinical Notes & History */}
      {activeSection === 'notes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card title="Chief Complaint & History of Present Illness (HPI)" padding="md">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Chief Complaint *
                </label>
                <textarea
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  disabled={isCompleted}
                  rows={2}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--ds-color-border)', fontFamily: 'inherit', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  History of Present Illness (HPI)
                </label>
                <textarea
                  value={hpi}
                  onChange={(e) => setHpi(e.target.value)}
                  disabled={isCompleted}
                  rows={4}
                  placeholder="Detailed chronological progression of symptoms..."
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--ds-color-border)', fontFamily: 'inherit', fontSize: '0.875rem' }}
                />
              </div>
            </div>
          </Card>

          <Card title="Background Medical, Surgical & Family History" padding="md">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Past Medical History
                </label>
                <textarea
                  value={medicalHist}
                  onChange={(e) => setMedicalHist(e.target.value)}
                  disabled={isCompleted}
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--ds-color-border)', fontFamily: 'inherit', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Past Surgical History
                </label>
                <textarea
                  value={surgicalHist}
                  onChange={(e) => setSurgicalHist(e.target.value)}
                  disabled={isCompleted}
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--ds-color-border)', fontFamily: 'inherit', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Family Medical History
                </label>
                <textarea
                  value={familyHist}
                  onChange={(e) => setFamilyHist(e.target.value)}
                  disabled={isCompleted}
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--ds-color-border)', fontFamily: 'inherit', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Social & Occupational History
                </label>
                <textarea
                  value={socialHist}
                  onChange={(e) => setSocialHist(e.target.value)}
                  disabled={isCompleted}
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--ds-color-border)', fontFamily: 'inherit', fontSize: '0.875rem' }}
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Section 2: Vitals & Physical Exam */}
      {activeSection === 'vitals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>💓 Clinical Vitals & Observations</h3>
              {!isCompleted && (
                <Button size="sm" variant="primary" onClick={() => onOpenAddVitals(consultation)}>
                  + Record / Edit Vitals
                </Button>
              )}
            </div>
            {consultation.vitals ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginTop: '8px' }}>
                <div style={{ background: 'var(--ds-color-bg-secondary)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>Blood Pressure</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ds-color-primary)' }}>
                    {consultation.vitals.systolicBp ?? '—'}/{consultation.vitals.diastolicBp ?? '—'} <span style={{ fontSize: '0.75rem' }}>mmHg</span>
                  </div>
                </div>

                <div style={{ background: 'var(--ds-color-bg-secondary)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>Pulse Rate</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    {consultation.vitals.pulseBpm ?? '—'} <span style={{ fontSize: '0.75rem' }}>bpm</span>
                  </div>
                </div>

                <div style={{ background: 'var(--ds-color-bg-secondary)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>Temperature</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    {consultation.vitals.temperatureCelsius ?? '—'} <span style={{ fontSize: '0.75rem' }}>°C</span>
                  </div>
                </div>

                <div style={{ background: 'var(--ds-color-bg-secondary)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>Oxygen (SpO2)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    {consultation.vitals.oxygenSaturationPercent ?? '—'} <span style={{ fontSize: '0.75rem' }}>%</span>
                  </div>
                </div>

                <div style={{ background: 'var(--ds-color-bg-secondary)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>BMI / Weight</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    {consultation.vitals.bmi ?? '—'} <span style={{ fontSize: '0.75rem' }}>({consultation.vitals.weightKg ?? '—'}kg)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--ds-color-text-muted)' }}>
                No vitals recorded yet. Click "Record Vitals" to enter blood pressure, pulse, temperature, and SpO2.
              </div>
            )}
          </Card>

          <Card title="🩺 Physical Examination Findings" padding="md">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.875rem' }}>
              <div>
                <strong>General Appearance:</strong> {consultation.examination?.generalAppearance ?? 'Alert, oriented, no acute distress.'}
              </div>
              <div>
                <strong>Cardiovascular:</strong> {consultation.examination?.cardiovascular ?? 'S1/S2 audible, regular rate and rhythm.'}
              </div>
              <div>
                <strong>Respiratory:</strong> {consultation.examination?.respiratory ?? 'Bilateral clear breath sounds, no rales/wheezing.'}
              </div>
              <div>
                <strong>Abdomen:</strong> {consultation.examination?.abdomen ?? 'Soft, non-tender, non-distended.'}
              </div>
              <div>
                <strong>Neurological:</strong> {consultation.examination?.neurological ?? 'Grossly intact.'}
              </div>
              <div>
                <strong>Musculoskeletal:</strong> {consultation.examination?.musculoskeletal ?? 'Full range of motion.'}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Section 3: Diagnoses */}
      {activeSection === 'diagnoses' && (
        <Card padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>🔬 Documented Diagnoses & ICD Registry</h3>
            {!isCompleted && (
              <Button size="sm" variant="primary" onClick={() => onOpenAddDiagnosis(consultation)}>
                + Add Diagnosis
              </Button>
            )}
          </div>
          {consultation.diagnoses.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {consultation.diagnoses.map((d: ConsultationDiagnosisDto) => (
                <div
                  key={d.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--ds-color-border)',
                    background: d.isPrimary ? 'var(--ds-color-bg-secondary)' : 'transparent'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--ds-color-primary)' }}>
                        [{d.diagnosisCode}]
                      </span>
                      <strong style={{ fontSize: '0.9375rem' }}>{d.diagnosisName}</strong>
                      <Badge variant={d.isPrimary ? 'primary' : 'neutral'}>{d.diagnosisType}</Badge>
                      <Badge variant={d.clinicalStatus === 'ACTIVE' ? 'warning' : 'neutral'}>{d.clinicalStatus}</Badge>
                    </div>
                    {d.notes && (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)', marginTop: '4px' }}>
                        Notes: {d.notes}
                      </div>
                    )}
                  </div>

                  {!isCompleted && (
                    <Button size="sm" variant="danger" onClick={() => onRemoveDiagnosis(consultation, d.id)}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--ds-color-text-muted)' }}>
              No diagnoses entered. Click "+ Add Diagnosis" to add ICD-coded findings.
            </div>
          )}
        </Card>
      )}

      {/* Section 4: Medications / Prescriptions */}
      {activeSection === 'medications' && (
        <Card padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>💊 Prescriptions & Medication Orders</h3>
            {!isCompleted && (
              <Button size="sm" variant="primary" onClick={() => onOpenAddMedication(consultation)}>
                + Prescribe Medication
              </Button>
            )}
          </div>
          {consultation.medications.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {consultation.medications.map((m: ConsultationMedicationDto) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--ds-color-border)',
                    background: m.status === 'DISCONTINUED' ? '#fef2f2' : 'transparent'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '1rem', color: 'var(--ds-color-text-primary)' }}>
                        {m.medicationName} ({m.strength})
                      </strong>
                      <Badge variant="primary">{m.route}</Badge>
                      <Badge variant={m.status === 'ACTIVE' ? 'success' : 'danger'}>{m.status}</Badge>
                      {m.asNeeded && <Badge variant="warning">PRN</Badge>}
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)', marginTop: '4px' }}>
                      <strong>Sig:</strong> {m.dosage} · {m.frequency} · {m.beforeAfterFood.replace('_', ' ')} · Duration: {m.duration} {m.durationUnit.toLowerCase()} (Qty: {m.quantity})
                    </div>

                    {m.instructions && (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>
                        Instructions: {m.instructions}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {!isCompleted && m.status === 'ACTIVE' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => onOpenEditMedication(consultation, m)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => onDiscontinueMedication(consultation, m)}>
                          Discontinue
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--ds-color-text-muted)' }}>
              No medications prescribed. Click "+ Prescribe Medication" to issue digital orders.
            </div>
          )}
        </Card>
      )}

      {/* Section 5: Diagnostic & Laboratory Investigation Orders */}
      {activeSection === 'investigations' && (
        <Card padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 600 }}>🔬 Diagnostic & Laboratory Investigation Orders</h3>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                Order clinical laboratory tests, diagnostic imaging panels, and review active findings.
              </p>
            </div>
            {!isCompleted && onOpenCreateInvestigationOrder && (
              <Button size="sm" variant="primary" onClick={() => onOpenCreateInvestigationOrder(consultation)}>
                + Order Diagnostic Investigation
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '14px', backgroundColor: 'var(--ds-color-bg-subtle, #f8fafc)', borderRadius: '6px', border: '1px solid var(--ds-color-border-subtle, #e2e8f0)', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600 }}>Investigation Test Ordering Protocol</span>
                <Badge variant="primary">Integrated Order Entry</Badge>
              </div>
              <p style={{ margin: 0, color: 'var(--ds-color-text-secondary, #475569)', fontSize: '0.8125rem' }}>
                All ordered laboratory assays link directly to patient encounter <strong>{consultation.encounterNumber}</strong> and patient MRN <strong>{consultation.patientMrn}</strong>. Specimen accessioning and phlebotomy workflows are automatically notified upon order placement.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Section 6: Instructions & Follow-up */}
      {activeSection === 'instructions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>📋 Patient Instructions & Lifestyle Guidance</h3>
              {!isCompleted && (
                <Button size="sm" variant="primary" onClick={() => onOpenAddInstruction(consultation)}>
                  Edit Instructions
                </Button>
              )}
            </div>
            {consultation.instructions ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                <div><strong>Patient Instruction:</strong> {consultation.instructions.patientInstruction ?? '—'}</div>
                <div><strong>Dietary:</strong> {consultation.instructions.dietInstruction ?? '—'}</div>
                <div><strong>Physical Activity:</strong> {consultation.instructions.activityInstruction ?? '—'}</div>
                <div><strong>Warning Signs / Red Flags:</strong> {consultation.instructions.warningSignInstruction ?? '—'}</div>
                <div><strong>Home Care:</strong> {consultation.instructions.homeCareInstruction ?? '—'}</div>
              </div>
            ) : (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--ds-color-text-muted)' }}>
                No patient instructions documented yet.
              </div>
            )}
          </Card>

          <Card padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>📅 Follow-Up Plan & Next Review</h3>
              {!isCompleted && (
                <Button size="sm" variant="primary" onClick={() => onOpenCreateFollowUp(consultation)}>
                  Edit Follow-Up
                </Button>
              )}
            </div>
            {consultation.followUp ? (
              <div style={{ fontSize: '0.875rem' }}>
                <div><strong>Follow-Up Required:</strong> {consultation.followUp.followUpRequired ? 'YES' : 'NO'}</div>
                <div><strong>Recommended Window:</strong> {consultation.followUp.recommendedWindow ?? '—'} (Date: {consultation.followUp.recommendedDate ?? '—'})</div>
                <div><strong>Reason:</strong> {consultation.followUp.reason}</div>
                {consultation.followUp.notes && <div><strong>Notes:</strong> {consultation.followUp.notes}</div>}
              </div>
            ) : (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--ds-color-text-muted)' }}>
                No follow-up recommendations configured.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Section 6: Assessment & Treatment Plan */}
      {activeSection === 'plan' && (
        <Card title="🎯 Clinical Synthesis, Assessment & Treatment Plan" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                Clinical Assessment & Diagnosis Synthesis *
              </label>
              <textarea
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                disabled={isCompleted}
                rows={4}
                placeholder="Diagnostic conclusions, clinical reasoning, disease severity..."
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--ds-color-border)', fontFamily: 'inherit', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                Treatment & Management Plan *
              </label>
              <textarea
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
                disabled={isCompleted}
                rows={4}
                placeholder="Therapeutic actions, ordered diagnostics, patient monitoring..."
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--ds-color-border)', fontFamily: 'inherit', fontSize: '0.875rem' }}
              />
            </div>

            {!isCompleted && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <Button variant="outline" onClick={handleSaveDraftClick}>
                  💾 Save Progress
                </Button>
                <Button
                  variant="primary"
                  onClick={() => onOpenCompleteConsultation(consultation, assessment, treatmentPlan)}
                >
                  🔒 Sign & Finalize EMR
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
