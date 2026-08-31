import React, { useState } from 'react';
import type {
  ConsultationDto,
  InvestigationOrderDto
} from '@docsearch/api-contracts';
import { Card, Badge, Button, Select } from '@docsearch/ui-kit';

export interface PatientClinicalTimelineViewProps {
  consultations: ConsultationDto[];
  investigations?: InvestigationOrderDto[];
  onSelectConsultation: (id: string) => void;
  onSelectInvestigation?: (id: string) => void;
}

export const PatientClinicalTimelineView: React.FC<PatientClinicalTimelineViewProps> = ({
  consultations,
  investigations = [],
  onSelectConsultation,
  onSelectInvestigation
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(consultations[0]?.patientId ?? '');

  // Unique patients
  const patientMap = new Map<string, { name: string; mrn: string }>();
  consultations.forEach((c) => {
    if (!patientMap.has(c.patientId)) {
      patientMap.set(c.patientId, { name: c.patientName, mrn: c.patientMrn });
    }
  });
  investigations.forEach((inv) => {
    if (!patientMap.has(inv.patientId)) {
      patientMap.set(inv.patientId, { name: inv.patientName, mrn: inv.patientMrn });
    }
  });

  const patientOptions = Array.from(patientMap.entries()).map(([id, info]) => ({
    value: id,
    label: `${info.name} (MRN: ${info.mrn})`
  }));

  const patientConsultations = consultations.filter((c) => !selectedPatientId || c.patientId === selectedPatientId);
  const patientInvestigations = investigations.filter((inv) => !selectedPatientId || inv.patientId === selectedPatientId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 700 }}>
              📜 Patient Longitudinal Clinical Timeline
            </h3>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
              Chronological medical history, past diagnoses, treatment progression, and prescription evolutions.
            </p>
          </div>

          <div style={{ minWidth: '280px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px', color: 'var(--ds-color-text-muted)' }}>
              Select Patient
            </label>
            <Select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              options={patientOptions}
            />
          </div>
        </div>
      </Card>

      {/* Timeline Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {patientConsultations.map((c) => (
          <Card key={c.id} padding="md" style={{ borderLeft: '4px solid var(--ds-color-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ds-color-primary)' }}>
                    {c.consultationNumber}
                  </span>
                  <Badge variant="primary">{c.consultationType}</Badge>
                  <Badge variant={c.consultationStatus === 'COMPLETED' ? 'success' : 'warning'}>{c.consultationStatus}</Badge>
                  {c.isAmended && <Badge variant="warning">Version {c.version}</Badge>}
                  <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                    • {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div style={{ marginTop: '8px', fontSize: '0.875rem' }}>
                  <strong>Attending:</strong> {c.doctorName} ({c.doctorSpecialty}) · <strong>Encounter:</strong> {c.encounterNumber}
                </div>

                <div style={{ marginTop: '6px', fontSize: '0.875rem' }}>
                  <strong>Chief Complaint:</strong> {c.chiefComplaint}
                </div>

                {c.clinicalAssessment && (
                  <div style={{ marginTop: '4px', fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
                    <strong>Assessment:</strong> {c.clinicalAssessment}
                  </div>
                )}

                {/* Diagnoses summary */}
                {c.diagnoses.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {c.diagnoses.map((d) => (
                      <Badge key={d.id} variant="neutral">
                        [{d.diagnosisCode}] {d.diagnosisName}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Medications summary */}
                {c.medications.length > 0 && (
                  <div style={{ marginTop: '6px', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                    <strong>Rx Prescriptions:</strong> {c.medications.map((m) => `${m.medicationName} (${m.strength})`).join(', ')}
                  </div>
                )}
              </div>

              <Button size="sm" variant="outline" onClick={() => onSelectConsultation(c.id)}>
                View Complete Dossier
              </Button>
            </div>
          </Card>
        ))}

        {patientConsultations.length === 0 && (
          <Card padding="lg">
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--ds-color-text-muted)' }}>
              No consultation records found for selected patient.
            </div>
          </Card>
        )}

        {/* Diagnostic Investigations Timeline */}
        {patientInvestigations.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 700 }}>
              🔬 Diagnostic & Laboratory Investigation Orders ({patientInvestigations.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {patientInvestigations.map((inv) => (
                <Card key={inv.id} padding="md" style={{ borderLeft: '4px solid #8b5cf6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem', fontFamily: 'monospace' }}>
                          {inv.orderNumber}
                        </span>
                        <span style={{ fontWeight: 600 }}>{inv.investigationName}</span>
                        <Badge variant="neutral">{inv.investigationCategory}</Badge>
                        <Badge variant={inv.status === 'REVIEWED' ? 'success' : inv.status === 'CANCELLED' ? 'danger' : 'warning'}>
                          {inv.status === 'ORDERED' && 'Investigation Ordered'}
                          {inv.status === 'SAMPLE_REQUIRED' && 'Sample Required'}
                          {inv.status === 'SAMPLE_COLLECTED' && 'Specimen Collected'}
                          {inv.status === 'PROCESSING' && 'In Processing'}
                          {inv.status === 'RESULT_READY' && 'Result Available'}
                          {inv.status === 'VERIFIED' && 'Result Verified'}
                          {inv.status === 'REVIEWED' && 'Result Reviewed'}
                          {inv.status === 'CANCELLED' && 'Cancelled'}
                        </Badge>
                        {inv.isCritical && <Badge variant="danger">🚨 Critical Value</Badge>}
                      </div>

                      <div style={{ fontSize: '0.8125rem', marginTop: '6px', color: 'var(--ds-color-text-secondary)' }}>
                        <strong>Doctor:</strong> {inv.orderingDoctorName} · <strong>Indication:</strong> {inv.clinicalIndication}
                      </div>

                      {inv.results.length > 0 && (
                        <div style={{ marginTop: '6px', fontSize: '0.8125rem' }}>
                          <strong>Results:</strong> {inv.results.map((r) => `${r.parameterName}: ${r.resultValue} ${r.unit ?? ''} [${r.abnormalFlag}]`).join(' · ')}
                        </div>
                      )}
                    </div>

                    {onSelectInvestigation && (
                      <Button size="sm" variant="outline" onClick={() => onSelectInvestigation(inv.id)}>
                        View Investigation
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
