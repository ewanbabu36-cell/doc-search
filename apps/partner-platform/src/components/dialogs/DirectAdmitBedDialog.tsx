import React, { useState } from 'react';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';
import type { InpatientBedDto, InpatientWardDto } from '@docsearch/api-contracts';

export interface DirectAdmitBedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    patientName: string;
    patientMrn: string;
    patientAge: number;
    patientGender: 'M' | 'F' | 'OTHER';
    bedId: string;
    wardId: string;
    admittingDoctorName: string;
    department: string;
    provisionalDiagnosis: string;
    admissionType: 'EMERGENCY' | 'ELECTIVE';
    expectedLengthOfStayDays: number;
  }) => Promise<void>;
  bed: InpatientBedDto | null;
  wards: InpatientWardDto[];
  tenantId: string;
  partnerId?: string;
}

export const DirectAdmitBedDialog: React.FC<DirectAdmitBedDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  bed,
  wards: _wards
}) => {
  const [patientName, setPatientName] = useState('');
  const [patientMrn, setPatientMrn] = useState(`MRN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [patientAge, setPatientAge] = useState('42');
  const [patientGender, setPatientGender] = useState<'M' | 'F' | 'OTHER'>('M');
  const [admittingDoctorName, setAdmittingDoctorName] = useState('Dr. Rajesh Verma, MD (Internal Med)');
  const [department, setDepartment] = useState('General Medicine');
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState('');
  const [admissionType, setAdmissionType] = useState<'EMERGENCY' | 'ELECTIVE'>('EMERGENCY');
  const [expectedStayDays, setExpectedStayDays] = useState('3');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !bed) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setError('Patient name is required');
      return;
    }
    if (!provisionalDiagnosis.trim()) {
      setError('Provisional diagnosis / admission reason is required');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        patientName: patientName.trim(),
        patientMrn: patientMrn.trim(),
        patientAge: parseInt(patientAge, 10) || 30,
        patientGender,
        bedId: bed.id,
        wardId: bed.wardId,
        admittingDoctorName,
        department,
        provisionalDiagnosis: provisionalDiagnosis.trim(),
        admissionType,
        expectedLengthOfStayDays: parseInt(expectedStayDays, 10) || 3
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Admission process failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`🏥 Direct Bed Admission — ${bed.bedCode}`}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '640px' }}>
        {error && <Alert type="error">{error}</Alert>}

        {/* Selected Bed Summary Card */}
        <div style={{
          backgroundColor: '#F0FDF4',
          border: '1.5px solid #86EFAC',
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.85rem'
        }}>
          <div>
            <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.95rem' }}>
              Ward: {bed.wardName} | Bed Code: {bed.bedCode}
            </div>
            <div style={{ color: '#15803D', marginTop: '2px', fontSize: '0.78rem' }}>
              Class: {bed.bedClass} • Oxygen Port: {bed.hasOxygenPort ? 'Available ✅' : 'None ❌'} • Ventilator: {bed.hasVentilator ? 'Enabled ✅' : 'No'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ backgroundColor: '#22C55E', color: '#FFFFFF', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
              READY TO ADMIT
            </span>
            <div style={{ fontSize: '0.75rem', color: '#15803D', marginTop: '3px' }}>
              ₹{bed.dailyChargeRate || 2000}/day
            </div>
          </div>
        </div>

        {/* Patient Core Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.25rem' }}>
              Patient Full Name *
            </label>
            <Input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="e.g. Robert Smith"
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.25rem' }}>
              MRN / UHID Number *
            </label>
            <Input
              value={patientMrn}
              onChange={(e) => setPatientMrn(e.target.value)}
              placeholder="MRN-2026-..."
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.25rem' }}>
              Age *
            </label>
            <Input
              type="number"
              min="0"
              max="125"
              value={patientAge}
              onChange={(e) => setPatientAge(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.25rem' }}>
              Gender *
            </label>
            <Select
              value={patientGender}
              onChange={(e) => setPatientGender(e.target.value as 'M' | 'F' | 'OTHER')}
              options={[
                { value: 'M', label: 'Male' },
                { value: 'F', label: 'Female' },
                { value: 'OTHER', label: 'Other' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.25rem' }}>
              Admission Type
            </label>
            <Select
              value={admissionType}
              onChange={(e) => setAdmissionType(e.target.value as 'EMERGENCY' | 'ELECTIVE')}
              options={[
                { value: 'EMERGENCY', label: '🚨 Emergency' },
                { value: 'ELECTIVE', label: '🗓️ Elective' }
              ]}
            />
          </div>
        </div>

        {/* Doctor & Department */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.25rem' }}>
              Admitting Doctor *
            </label>
            <Select
              value={admittingDoctorName}
              onChange={(e) => setAdmittingDoctorName(e.target.value)}
              options={[
                { value: 'Dr. Rajesh Verma, MD (Internal Med)', label: 'Dr. Rajesh Verma, MD (Internal Med)' },
                { value: 'Dr. Priya Nair, MD (Critical Care)', label: 'Dr. Priya Nair, MD (Critical Care)' },
                { value: 'Dr. Amitabh Sen, MS (General Surgery)', label: 'Dr. Amitabh Sen, MS (General Surgery)' },
                { value: 'Dr. Sunita Rao, DNB (Paediatrics)', label: 'Dr. Sunita Rao, DNB (Paediatrics)' },
                { value: 'Dr. Vikram Malhotra, MCh (Orthopaedics)', label: 'Dr. Vikram Malhotra, MCh (Orthopaedics)' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.25rem' }}>
              Department
            </label>
            <Select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              options={[
                { value: 'General Medicine', label: 'General Medicine' },
                { value: 'Intensive Care Unit (ICU)', label: 'Intensive Care Unit (ICU)' },
                { value: 'Emergency Medicine', label: 'Emergency Medicine' },
                { value: 'General Surgery', label: 'General Surgery' },
                { value: 'Cardiology', label: 'Cardiology' },
                { value: 'Orthopaedics', label: 'Orthopaedics' },
                { value: 'Pulmonology', label: 'Pulmonology' }
              ]}
            />
          </div>
        </div>

        {/* Clinical Reason / Provisional Diagnosis */}
        <div>
          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.25rem' }}>
            Provisional Diagnosis / Chief Complaints *
          </label>
          <Input
            value={provisionalDiagnosis}
            onChange={(e) => setProvisionalDiagnosis(e.target.value)}
            placeholder="e.g. Acute Febrile Illness, SpO2 91%, IV Antibiotics & hydration required"
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.25rem' }}>
              Expected Stay (in Days)
            </label>
            <Input
              type="number"
              min="1"
              max="60"
              value={expectedStayDays}
              onChange={(e) => setExpectedStayDays(e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting}
            style={{ backgroundColor: '#16A34A', borderColor: '#16A34A', fontWeight: 700 }}
          >
            {isSubmitting ? 'Admitting Patient...' : `✅ Confirm Admission to ${bed.bedCode}`}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
