import React, { useState } from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { InpatientDoctorRoundDto, InpatientAdmissionDto } from '@docsearch/api-contracts';

export interface DoctorRoundsViewProps {
  rounds: InpatientDoctorRoundDto[];
  admissions?: InpatientAdmissionDto[];
  onOpenDoctorRound?: (adm: InpatientAdmissionDto) => void;
}

export const DoctorRoundsView: React.FC<DoctorRoundsViewProps> = ({
  rounds = [],
  admissions = [],
  onOpenDoctorRound
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'TODAY'>('ALL');
  const safeRounds = Array.isArray(rounds) ? rounds : [];
  const safeAdmissions = Array.isArray(admissions) ? admissions : [];
  const activePatients = safeAdmissions.filter((a) => a?.status === 'ADMITTED' || a?.status === 'DISCHARGE_PLANNED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--ds-color-text-primary, #f8fafc)' }}>
            👨‍⚕️ Doctor Daily Inpatient Rounds
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Clinical examination of admitted patients, SOAP progress notes, treatment modifications, and discharge readiness assessment.
          </p>
        </div>
      </div>

      {/* Active Inpatients Awaiting Rounds */}
      {activePatients.length > 0 && onOpenDoctorRound && (
        <Card style={{ padding: '1.25rem', backgroundColor: '#F8FAFC', border: '1.5px solid #CBD5E1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <strong style={{ fontSize: '0.9375rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🩺 Active Inpatients for Daily Rounds:</span>
              <Badge variant="primary">{activePatients.length} Patients</Badge>
            </strong>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Perform bedside evaluation and enter clinical round note</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
            {activePatients.map((adm) => (
              <div
                key={adm.id}
                style={{
                  backgroundColor: 'var(--ds-color-surface-subtle, #182234)',
                  border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ds-color-text-primary, #f8fafc)' }}>
                    {adm.patientName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #94a3b8)' }}>
                    Ward: <strong>{adm.wardName}</strong> • Bed: <strong style={{ color: 'var(--ds-color-accent, #38bdf8)' }}>{adm.bedCode}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary, #cbd5e1)', marginTop: '2px' }}>
                    {adm.primaryDiagnosis}
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onOpenDoctorRound(adm)}
                  style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', padding: '6px 10px' }}
                >
                  + Add Round Note
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recorded Rounds Feed */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1E293B' }}>
          📋 Recorded Clinical Progress Notes
        </h3>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeFilter === 'ALL' ? '#0284C7' : '#E2E8F0',
              color: activeFilter === 'ALL' ? '#FFF' : '#475569',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            All Rounds ({safeRounds.length})
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {safeRounds.length === 0 ? (
          <Card style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
            No doctor round notes recorded today. Click on a patient above to enter bedside progress notes.
          </Card>
        ) : (
          safeRounds.map((r) => (
            <Card key={r.id} style={{ padding: '1.25rem', borderLeft: '4px solid #0284C7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#0F172A', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.9375rem' }}>
                  {r.doctorName} ({r.doctorSpecialty}) • <Badge variant="neutral">{r.roundType}</Badge>
                </span>
                <span style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 500 }}>
                  ⏰ {new Date(r.roundTimestamp).toLocaleString()}
                </span>
              </div>

              <div style={{ margin: '0.75rem 0', fontSize: '0.85rem', lineHeight: '1.5' }}>
                {r.subjectiveAssessment && (
                  <div style={{ marginBottom: '4px' }}>
                    <strong style={{ color: '#475569' }}>Subjective (Patient Condition):</strong> {r.subjectiveAssessment}
                  </div>
                )}
                {r.objectiveClinicalFindings && (
                  <div style={{ marginBottom: '4px' }}>
                    <strong style={{ color: '#475569' }}>Objective (Clinical Findings):</strong> {r.objectiveClinicalFindings}
                  </div>
                )}
                <div style={{ marginBottom: '4px' }}>
                  <strong style={{ color: '#0369A1' }}>Assessment (Diagnostic Impression):</strong> {r.clinicalImpression}
                </div>
                <div style={{ color: '#047857' }}>
                  <strong>Plan (Treatment & Medications):</strong> {r.treatmentPlanUpdates}
                </div>
                {r.medicationAdjustments && (
                  <div style={{ marginTop: '4px', color: '#B45309' }}>
                    <strong>Medication Adjustments:</strong> {r.medicationAdjustments}
                  </div>
                )}
              </div>

              {r.dischargeReadinessScore && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', marginTop: '6px' }}>
                  <span style={{ color: '#64748B' }}>Discharge Readiness:</span>
                  <span style={{ fontWeight: 800, color: r.dischargeReadinessScore >= 80 ? '#16A34A' : '#D97706' }}>
                    {r.dischargeReadinessScore}%
                  </span>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};