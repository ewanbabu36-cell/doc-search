import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { InpatientAdmissionDto, InpatientNursingAssessmentDto, InpatientVitalObservationDto, InpatientDoctorRoundDto } from '@docsearch/api-contracts';

export interface AdmissionDetailViewProps {
  admission: InpatientAdmissionDto | null;
  assessments: InpatientNursingAssessmentDto[];
  vitals: InpatientVitalObservationDto[];
  rounds: InpatientDoctorRoundDto[];
  onBack: () => void;
  onOpenTransfer: () => void;
  onOpenRecordVital: () => void;
  onOpenDoctorRound: () => void;
  onOpenRequestDischarge: () => void;
}

export const AdmissionDetailView: React.FC<AdmissionDetailViewProps> = ({
  admission,
  assessments,
  vitals,
  rounds,
  onBack,
  onOpenTransfer,
  onOpenRecordVital,
  onOpenDoctorRound,
  onOpenRequestDischarge
}) => {
  if (!admission) return null;

  const patientAssessments = assessments.filter((a) => a.admissionId === admission.id);
  const patientVitals = vitals.filter((v) => v.admissionId === admission.id);
  const patientRounds = rounds.filter((r) => r.admissionId === admission.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="outline" size="sm" onClick={onBack}>← Back to Inpatients</Button>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Inpatient Electronic Record — {admission.patientName} ({admission.patientMrn})
          </h2>
          <Badge variant={admission.status === 'ADMITTED' ? 'success' : 'warning'}>{admission.status}</Badge>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="outline" onClick={onOpenTransfer}>⇄ Transfer Ward / Bed</Button>
          <Button variant="outline" onClick={onOpenRecordVital}>📊 Chart Vitals</Button>
          <Button variant="outline" onClick={onOpenDoctorRound}>🩺 Doctor Round</Button>
          <Button variant="primary" onClick={onOpenRequestDischarge}>🚪 Order Discharge</Button>
        </div>
      </div>

      {/* Patient Header Card */}
      <Card style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
          <div><strong>Admission Number:</strong> {admission.admissionNumber}</div>
          <div><strong>Current Location:</strong> {admission.wardName} (Bed {admission.bedCode})</div>
          <div><strong>Attending Consultant:</strong> {admission.attendingConsultantName}</div>
          <div><strong>Admitted Date:</strong> {new Date(admission.admissionDateTime).toLocaleDateString()}</div>
          <div><strong>Payer Type:</strong> {admission.payerType} ({admission.payerName || 'Self'})</div>
          <div><strong>Primary Diagnosis:</strong> {admission.primaryDiagnosis}</div>
        </div>
      </Card>

      {/* Tabs / Clinical Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Doctor Rounds History */}
        <Card style={{ padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600 }}>Doctor Daily Rounds ({patientRounds.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {patientRounds.map((r) => (
              <div key={r.id} style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '4px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>{r.doctorName}</span>
                  <span style={{ color: '#64748b' }}>{new Date(r.roundTimestamp).toLocaleString()}</span>
                </div>
                <div style={{ marginTop: '0.25rem' }}><strong>Impression:</strong> {r.clinicalImpression}</div>
                <div style={{ marginTop: '0.25rem', color: '#475569' }}><strong>Plan:</strong> {r.treatmentPlanUpdates}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Vitals History */}
        <Card style={{ padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600 }}>Recent Vitals & Observations ({patientVitals.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {patientVitals.map((v) => (
              <div key={v.id} style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '4px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>BP:</strong> {v.systolicBpMmHg}/{v.diastolicBpMmHg} mmHg • <strong>HR:</strong> {v.pulseBpm} BPM • <strong>SpO2:</strong> {v.spo2Percentage}%</span>
                  <span style={{ color: '#64748b' }}>{new Date(v.recordedAt).toLocaleTimeString()}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Recorded by {v.recordedBy} — {v.notes || 'Normal'}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Nursing Assessments */}
      <Card style={{ padding: '1rem' }}>
        <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600 }}>Nursing Care Assessments ({patientAssessments.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {patientAssessments.map((a) => (
            <div key={a.id} style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '4px', fontSize: '0.85rem' }}>
              <div><strong>{a.assessmentType} ({a.shiftType})</strong> by {a.assessedBy}</div>
              <div style={{ marginTop: '0.25rem', color: '#334155' }}>{a.nursingSummary}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Morse Fall Score: {a.fallRiskScore} ({a.fallRiskLevel}) • Braden Scale: {a.pressureInjuryRiskScore} ({a.pressureInjuryRiskLevel})</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};