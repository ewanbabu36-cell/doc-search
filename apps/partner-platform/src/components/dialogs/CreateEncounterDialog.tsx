import React, { useState, useEffect } from 'react';
import type {
  PatientDto,
  DoctorProfileDto,
  OperationalDepartmentDto,
  EncounterType,
  EncounterPriority,
  EncounterConsultationMode,
  CreateEncounterRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface CreateEncounterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  actorId: string;
  actorRole: string;
  patients: PatientDto[];
  doctors: DoctorProfileDto[];
  departments: OperationalDepartmentDto[];
  organizationType?: string;
  initialPatientId?: string | undefined;
  onCreateEncounter: (req: CreateEncounterRequest) => Promise<void>;
}

export const CreateEncounterDialog: React.FC<CreateEncounterDialogProps> = ({
  isOpen,
  onClose,
  tenantId,
  partnerId,
  organizationId,
  branchId,
  actorId,
  actorRole,
  patients,
  doctors,
  departments,
  organizationType,
  initialPatientId,
  onCreateEncounter
}) => {
  const [patientId, setPatientId] = useState(initialPatientId ?? patients[0]?.id ?? '');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? '');
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? '');

  // Single-Doctor Clinic Auto-Detection
  const isSingleDoctor = organizationType === 'CLINIC' || doctors.length === 1;
  const singleDoctor = doctors.length > 0 ? doctors[0] : null;

  useEffect(() => {
    if (isSingleDoctor && singleDoctor) {
      setDoctorId(singleDoctor.id);
      if (singleDoctor.departmentId) {
        setDepartmentId(singleDoctor.departmentId);
      }
    }
  }, [isSingleDoctor, singleDoctor?.id]);

  const filteredDoctors = departmentId
    ? doctors.filter((d) => !d.departmentId || d.departmentId === departmentId)
    : doctors;
  const [encounterType, setEncounterType] = useState<EncounterType>('OPD');
  const [priority, setPriority] = useState<EncounterPriority>('ROUTINE');
  const [consultationMode, setConsultationMode] = useState<EncounterConsultationMode>('IN_PERSON');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [visitReason, setVisitReason] = useState('Scheduled Outpatient Consultation');
  const [triageNotes, setTriageNotes] = useState('Vitals: BP 120/80, HR 72, SpO2 99%');
  const [autoCheckIn, setAutoCheckIn] = useState(true);
  const [reason, setReason] = useState('Registered new outpatient clinical encounter');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      setError('Patient selection is mandatory.');
      return;
    }
    if (!departmentId) {
      setError('Department selection is mandatory.');
      return;
    }
    if (!chiefComplaint || chiefComplaint.trim().length < 2) {
      setError('Chief complaint / primary symptom description is required.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onCreateEncounter({
        actorId,
        actorRole,
        tenantId,
        partnerId,
        organizationId,
        branchId,
        departmentId,
        patientId,
        encounterType,
        priority,
        consultationMode,
        chiefComplaint,
        autoCheckIn,
        reason,
        ...(doctorId ? { doctorId } : {}),
        ...(visitReason ? { visitReason } : {}),
        ...(triageNotes ? { triageNotes } : {})
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create clinical encounter');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Clinical Encounter / Reception Registration"
      maxWidth="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting} disabled={isSubmitting}>
            {autoCheckIn ? 'Register & Check In to Queue' : 'Register Encounter (Pending Check-in)'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Audited Clinical Encounter Creation">
          Creating an encounter links the patient to a department, assigning an MRN-bound encounter ID and queue token.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Select Master Patient Index (MPI) Patient *
          </label>
          <Select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            options={patients.map((p) => ({
              value: p.id,
              label: `${p.fullName} (${p.mrn}) — DOB: ${p.dateOfBirth} (${p.gender})`
            }))}
          />
        </div>

        {isSingleDoctor && singleDoctor ? (
          <div style={{
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
            border: '1.5px solid rgba(6, 182, 212, 0.35)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.4rem' }}>🩺</span>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F1F5F9' }}>
                  Consulting Doctor: {singleDoctor.fullName}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Specialty: <strong style={{ color: '#67E8F9' }}>{singleDoctor.primarySpecialty}</strong>
                  {singleDoctor.departmentName && ` • Department: ${singleDoctor.departmentName}`}
                </div>
              </div>
            </div>
            <span style={{
              fontSize: '0.6875rem',
              backgroundColor: 'rgba(6, 182, 212, 0.25)',
              color: '#67E8F9',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: 700,
              border: '1px solid rgba(6, 182, 212, 0.4)'
            }}>
              ⚡ Auto-Selected (Single Doctor Clinic)
            </span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
                <span>Clinical Department *</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)' }}>
                  {filteredDoctors.length} Doctors Available
                </span>
              </label>
              <Select
                value={departmentId}
                onChange={(e) => {
                  const newDept = e.target.value;
                  setDepartmentId(newDept);
                  if (doctorId) {
                    const doc = doctors.find((d) => d.id === doctorId);
                    if (doc && doc.departmentId && doc.departmentId !== newDept) {
                      setDoctorId('');
                    }
                  }
                }}
                options={[
                  { value: '', label: '— All Departments / General OPD —' },
                  ...departments.map((d) => ({
                    value: d.id,
                    label: d.departmentName
                  }))
                ]}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
                <span>Attending / Consulting Doctor</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)' }}>(Optional)</span>
              </label>
              <Select
                value={doctorId}
                onChange={(e) => {
                  const newDocId = e.target.value;
                  setDoctorId(newDocId);
                  const doc = doctors.find((d) => d.id === newDocId);
                  if (doc && doc.departmentId) {
                    setDepartmentId(doc.departmentId);
                  }
                }}
                options={[
                  { value: '', label: '— Unassigned / General Pool —' },
                  ...filteredDoctors.map((doc) => ({
                    value: doc.id,
                    label: `${doc.fullName} (${doc.primarySpecialty})`
                  }))
                ]}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Encounter Type *
            </label>
            <Select
              value={encounterType}
              onChange={(e) => setEncounterType(e.target.value as EncounterType)}
              options={[
                { value: 'OPD', label: 'Outpatient (OPD)' },
                { value: 'WALK_IN', label: 'Walk-In Patient' },
                { value: 'FOLLOW_UP', label: 'Follow-Up Review' },
                { value: 'TELECONSULTATION', label: 'Teleconsultation' },
                { value: 'EMERGENCY', label: 'Emergency Triage' },
                { value: 'IPD', label: 'Inpatient Admission (IPD)' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Triage Priority *
            </label>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as EncounterPriority)}
              options={[
                { value: 'ROUTINE', label: 'Routine (Standard Queue)' },
                { value: 'URGENT', label: 'Urgent (Priority Calling)' },
                { value: 'EMERGENCY', label: 'Emergency (Immediate STAT)' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Consultation Mode *
            </label>
            <Select
              value={consultationMode}
              onChange={(e) => setConsultationMode(e.target.value as EncounterConsultationMode)}
              options={[
                { value: 'IN_PERSON', label: 'In-Person Consultation' },
                { value: 'TELEHEALTH', label: 'Virtual Telehealth' },
                { value: 'WALK_IN', label: 'Direct Walk-In' },
                { value: 'HOME_VISIT', label: 'Home Health Visit' }
              ]}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Chief Complaint & Primary Symptoms *
          </label>
          <Input
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            placeholder="e.g. Chest flutter on exertion and mild shortness of breath"
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Visit Reason / Category
            </label>
            <Input value={visitReason} onChange={(e) => setVisitReason(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Reception Triage / Initial Vitals Notes
            </label>
            <Input value={triageNotes} onChange={(e) => setTriageNotes(e.target.value)} />
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--ds-color-border)', paddingTop: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8125rem' }}>
            <input
              type="checkbox"
              checked={autoCheckIn}
              onChange={(e) => setAutoCheckIn(e.target.checked)}
            />
            <strong>Check-in patient immediately and generate OPD queue token</strong>
          </label>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Registered scheduled cardiology outpatient visit"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
