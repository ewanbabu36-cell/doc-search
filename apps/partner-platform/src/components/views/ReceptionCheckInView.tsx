import React, { useState } from 'react';
import type {
  PatientDto,
  DoctorProfileDto,
  OperationalDepartmentDto,
  CreateEncounterRequest
} from '@docsearch/api-contracts';
import { Card, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface ReceptionCheckInViewProps {
  patients: PatientDto[];
  doctors: DoctorProfileDto[];
  departments: OperationalDepartmentDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  actorId: string;
  actorRole: string;
  onRegisterAndCheckIn: (req: CreateEncounterRequest) => Promise<void>;
  onNavigateToQueue: () => void;
}

export const ReceptionCheckInView: React.FC<ReceptionCheckInViewProps> = ({
  patients,
  doctors,
  departments,
  tenantId,
  partnerId,
  organizationId,
  branchId,
  actorId,
  actorRole,
  onRegisterAndCheckIn,
  onNavigateToQueue
}) => {
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id ?? '');
  const [selectedDeptId, setSelectedDeptId] = useState(departments[0]?.id ?? '');
  const [selectedDocId, setSelectedDocId] = useState(doctors[0]?.id ?? '');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [triageVitals, setTriageVitals] = useState('BP: 120/80 mmHg, HR: 74 bpm, SpO2: 98%');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToken, setSuccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const matchedPatients = patients.filter((p) => {
    if (!patientSearch) return true;
    const q = patientSearch.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.mrn.toLowerCase().includes(q) ||
      (p.primaryContact?.primaryMobile && p.primaryContact.primaryMobile.includes(q))
    );
  });

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) ?? patients[0] ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setError('Please select a patient from the Master Patient Index.');
      return;
    }
    if (!selectedDeptId) {
      setError('Please select a clinical department.');
      return;
    }
    if (!chiefComplaint.trim()) {
      setError('Chief complaint / reason for visit is required.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onRegisterAndCheckIn({
        actorId,
        actorRole,
        tenantId,
        partnerId,
        organizationId,
        branchId,
        departmentId: selectedDeptId,
        patientId: selectedPatientId,
        encounterType: 'WALK_IN',
        priority: 'ROUTINE',
        consultationMode: 'IN_PERSON',
        chiefComplaint,
        triageNotes: triageVitals,
        autoCheckIn: true,
        reason: 'Fast reception intake and check-in token issuance',
        ...(selectedDocId ? { doctorId: selectedDocId } : {})
      });
      setSuccessToken('Token issued successfully');
      setChiefComplaint('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete reception check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
          Reception Fast Intake & Check-In Desk
        </h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
          Rapid outpatient walk-in intake, triage vital logging, and automated OPD queue token generation
        </span>
      </div>

      {successToken && (
        <Alert type="success" title="Patient Checked-In & Queue Token Generated">
          Patient has been routed to the department queue. You can monitor their position in the live OPD Queue board.
          <div style={{ marginTop: '8px' }}>
            <Button variant="primary" size="sm" onClick={onNavigateToQueue}>
              View Live OPD Queue
            </Button>
          </div>
        </Alert>
      )}

      {error && <Alert type="error" title="Intake Error">{error}</Alert>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Left Column: Patient Search & Picker */}
        <Card title="1. Select Patient (MPI Retrieval)" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                Search Patient (Name, MRN, Mobile)
              </label>
              <Input
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Type to filter patients..."
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                Select Matching Patient *
              </label>
              <Select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                options={matchedPatients.map((p) => ({
                  value: p.id,
                  label: `${p.fullName} (${p.mrn}) — ${p.primaryContact?.primaryMobile ?? 'No Phone'}`
                }))}
              />
            </div>

            {selectedPatient && (
              <div style={{ border: '1px solid var(--ds-color-border)', borderRadius: '6px', padding: '12px', background: 'var(--ds-color-surface-hover)' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: '700', color: 'var(--ds-color-text-muted)', display: 'block' }}>
                  CONFIRMED PATIENT IDENTITY
                </span>
                <strong style={{ fontSize: '0.9375rem', color: 'var(--ds-color-text-primary)' }}>
                  {selectedPatient.fullName}
                </strong>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                  MRN: <code>{selectedPatient.mrn}</code> · DOB: {selectedPatient.dateOfBirth} ({selectedPatient.gender})
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)', marginTop: '2px' }}>
                  Mobile: {selectedPatient.primaryContact?.primaryMobile ?? '—'}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Right Column: Routing & Triage */}
        <Card title="2. Clinical Routing & Triage Vitals" padding="md">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  Clinical Department *
                </label>
                <Select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  options={departments.map((d) => ({
                    value: d.id,
                    label: d.departmentName
                  }))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  Consulting Physician
                </label>
                <Select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  options={[
                    { value: '', label: '— Next Available Doctor —' },
                    ...doctors.map((doc) => ({
                      value: doc.id,
                      label: `${doc.fullName} (${doc.primarySpecialty})`
                    }))
                  ]}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                Chief Complaint / Presenting Symptoms *
              </label>
              <Input
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="e.g. Acute upper respiratory infection, fever and body aches"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                Triage Vitals / Reception Notes
              </label>
              <Input
                value={triageVitals}
                onChange={(e) => setTriageVitals(e.target.value)}
                placeholder="e.g. BP 120/80 mmHg, HR 74 bpm, SpO2 98%"
              />
            </div>

            <div style={{ marginTop: '8px' }}>
              <Button variant="primary" size="md" type="submit" isLoading={isSubmitting} style={{ width: '100%' }}>
                🎟️ Register & Issue OPD Queue Token
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
