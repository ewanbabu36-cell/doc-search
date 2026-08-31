import React, { useState } from 'react';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';
import type { CreateAdmissionRequest, InpatientWardType, BedClass } from '@docsearch/api-contracts';

export interface CreateAdmissionRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: CreateAdmissionRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateAdmissionRequestDialog: React.FC<CreateAdmissionRequestDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [patientName, setPatientName] = useState('');
  const [patientMrn, setPatientMrn] = useState('');
  const [referringDoctorName, setReferringDoctorName] = useState('Dr. Robert Chen, MD');
  const [admittingDoctorName, setAdmittingDoctorName] = useState('Dr. Jonathan Reed, MD');
  const [department, setDepartment] = useState('Cardiology & Intensive Care');
  const [specialty, setSpecialty] = useState('Cardiology');
  const [requestedWardType, setRequestedWardType] = useState<InpatientWardType>('ICU');
  const [requestedBedClass, setRequestedBedClass] = useState<BedClass>('ICU');
  const [admissionSource, setAdmissionSource] = useState('OPD');
  const [priority, setPriority] = useState('ROUTINE');
  const [isEmergency, setIsEmergency] = useState(false);
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState('');
  const [admissionReason, setAdmissionReason] = useState('');
  const [expectedLengthOfStayDays, setExpectedLengthOfStayDays] = useState('3');
  const [insurancePreAuthRef, setInsurancePreAuthRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        patientId: 'pat-' + Math.random().toString(36).substring(2, 9),
        patientName,
        patientMrn,
        referringDoctorName,
        admittingDoctorName,
        department,
        specialty,
        requestedWardType,
        requestedBedClass,
        admissionSource,
        priority,
        isEmergency,
        provisionalDiagnosis,
        admissionReason,
        expectedLengthOfStayDays: parseInt(expectedLengthOfStayDays, 10) || 3,
        insurancePreAuthRef: insurancePreAuthRef || undefined
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create admission request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Create Inpatient Admission Request">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Patient Name *</label>
            <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Patient MRN *</label>
            <Input value={patientMrn} onChange={(e) => setPatientMrn(e.target.value)} placeholder="e.g. MRN-2026-1188" required />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Referring Doctor</label>
            <Input value={referringDoctorName} onChange={(e) => setReferringDoctorName(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Admitting Doctor *</label>
            <Input value={admittingDoctorName} onChange={(e) => setAdmittingDoctorName(e.target.value)} required />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Department</label>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Specialty</label>
            <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} required />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Requested Ward Type</label>
            <Select value={requestedWardType} onChange={(e) => setRequestedWardType(e.target.value as InpatientWardType)} options={[
              { value: 'GENERAL', label: 'General' },
              { value: 'SEMI_PRIVATE', label: 'Semi-Private' },
              { value: 'PRIVATE', label: 'Private' },
              { value: 'DELUXE', label: 'Deluxe' },
              { value: 'ICU', label: 'ICU' },
              { value: 'HDU', label: 'HDU' },
              { value: 'ISOLATION', label: 'Isolation' }
            ]} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Bed Class</label>
            <Select value={requestedBedClass} onChange={(e) => setRequestedBedClass(e.target.value as BedClass)} options={[
              { value: 'GENERAL', label: 'General' },
              { value: 'SEMI_PRIVATE', label: 'Semi-Private' },
              { value: 'PRIVATE', label: 'Private' },
              { value: 'DELUXE', label: 'Deluxe' },
              { value: 'ICU', label: 'ICU' },
              { value: 'HDU', label: 'HDU' }
            ]} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Priority</label>
            <Select value={priority} onChange={(e) => setPriority(e.target.value)} options={[
              { value: 'ROUTINE', label: 'Routine' },
              { value: 'URGENT', label: 'Urgent' },
              { value: 'STAT_EMERGENCY', label: 'STAT Emergency' }
            ]} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Admission Source</label>
            <Select value={admissionSource} onChange={(e) => setAdmissionSource(e.target.value)} options={[
              { value: 'OPD', label: 'OPD Consultation' },
              { value: 'EMERGENCY', label: 'Emergency Room' },
              { value: 'DIRECT_TRANSFER', label: 'Direct External Transfer' },
              { value: 'POST_OP', label: 'Post-Operative Recovery' }
            ]} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Expected LOS (Days)</label>
            <Input type="number" value={expectedLengthOfStayDays} onChange={(e) => setExpectedLengthOfStayDays(e.target.value)} required />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Provisional Clinical Diagnosis *</label>
          <Input value={provisionalDiagnosis} onChange={(e) => setProvisionalDiagnosis(e.target.value)} placeholder="e.g. Acute Coronary Syndrome" required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Clinical Admission Justification *</label>
          <Input value={admissionReason} onChange={(e) => setAdmissionReason(e.target.value)} placeholder="Indication for inpatient admission" required />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#dc2626', fontWeight: 600 }}>
            <input type="checkbox" checked={isEmergency} onChange={(e) => setIsEmergency(e.target.checked)} />
            🚨 Critical STAT / Emergency Admission
          </label>
          <div style={{ width: '50%' }}>
            <Input value={insurancePreAuthRef} onChange={(e) => setInsurancePreAuthRef(e.target.value)} placeholder="TPA Pre-Authorization Number (Optional)" />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Request'}</Button>
        </div>
      </form>
    </Dialog>
  );
};