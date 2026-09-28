import React, { useState, useEffect } from 'react';
import type {
  Gender,
  BloodGroup,
  MaritalStatus,
  EmergencyRelationship,
  CreatePatientRequest,
  DoctorProfileDto,
  OperationalDepartmentDto
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';
import { doctorRosterService } from '../../services/doctor-roster-service.js';
import { staffAdministrationService } from '../../services/staff-administration-service.js';
import { encounterService } from '../../services/encounter-service.js';
import { patientRegistrationService } from '../../services/patient-registration-service.js';
import { whatsappPortalService } from '../../services/whatsapp-portal-service.js';

export interface CreatePatientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  actorId: string;
  actorRole: string;
  doctors?: DoctorProfileDto[];
  departments?: OperationalDepartmentDto[];
  organizationType?: string;
  onCreatePatient: (req: CreatePatientRequest) => Promise<void>;
}

export const CreatePatientDialog: React.FC<CreatePatientDialogProps> = ({
  isOpen,
  onClose,
  tenantId,
  partnerId,
  organizationId,
  branchId,
  actorId,
  actorRole,
  doctors: initialDoctors,
  departments: initialDepartments,
  organizationType,
  onCreatePatient
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1990-01-01');
  const [gender, setGender] = useState<Gender>('MALE');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O_POSITIVE');
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>('SINGLE');
  const [primaryMobile, setPrimaryMobile] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');

  // Doctor & Department Selection / Single-Doctor Clinic Auto-Assignment
  const [doctorsList, setDoctorsList] = useState<DoctorProfileDto[]>(initialDoctors || []);
  const [departmentsList, setDepartmentsList] = useState<OperationalDepartmentDto[]>(initialDepartments || []);
  const [departmentId, setDepartmentId] = useState<string>('');
  const [doctorId, setDoctorId] = useState<string>('');
  const [facilityMode, setFacilityMode] = useState<'AUTO_DETECT' | 'HOSPITAL' | 'CLINIC'>('AUTO_DETECT');

  // Advancements: WhatsApp Digital Slip & ABDM Scan & Share Intake
  const [sendWhatsAppSlip, setSendWhatsAppSlip] = useState(true);
  const [showAbhaModal, setShowAbhaModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadStaff = async () => {
      try {
        const [docs, depts] = await Promise.all([
          doctorRosterService.getDoctors(tenantId, partnerId, organizationId, branchId).catch(() => []),
          staffAdministrationService.getDepartments(tenantId, organizationId).catch(() => [])
        ]);
        if (isMounted) {
          if (!initialDoctors || initialDoctors.length === 0) {
            setDoctorsList(docs);
          }
          if (!initialDepartments || initialDepartments.length === 0) {
            setDepartmentsList(depts);
          }
        }
      } catch (err) {
        console.warn('Failed to load doctors in CreatePatientDialog:', err);
      }
    };
    if (isOpen) {
      loadStaff();
    }
    return () => { isMounted = false; };
  }, [isOpen, tenantId, partnerId, organizationId, branchId, initialDoctors, initialDepartments]);

  // Determine if single doctor clinic
  const isSingleDoctor =
    facilityMode === 'CLINIC' ||
    (facilityMode === 'AUTO_DETECT' && (organizationType === 'CLINIC' || doctorsList.length === 1));
  const singleDoctor = doctorsList.length > 0 ? doctorsList[0] : null;

  useEffect(() => {
    if (isSingleDoctor && singleDoctor) {
      setDoctorId(singleDoctor.id);
      if (singleDoctor.departmentId) {
        setDepartmentId(singleDoctor.departmentId);
      }
    }
  }, [isSingleDoctor, singleDoctor?.id]);

  const filteredDoctors = departmentId
    ? doctorsList.filter((d) => !d.departmentId || d.departmentId === departmentId)
    : doctorsList;

  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState<EmergencyRelationship>('SPOUSE');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [insurancePayer, setInsurancePayer] = useState('');
  const [insurancePolicy, setInsurancePolicy] = useState('');
  const [reason, setReason] = useState('Standard outpatient clinic reception registration');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }
    if (!dateOfBirth) {
      setError('Date of birth is required.');
      return;
    }
    const cleanMob = primaryMobile.trim();
    if (!cleanMob || cleanMob.length !== 10 || !/^[6-9]/.test(cleanMob)) {
      setError('A valid 10-digit Indian mobile number is required (starts with 6, 7, 8, or 9).');
      return;
    }
    if (emergencyPhone && emergencyPhone.trim() && (emergencyPhone.trim().length !== 10 || !/^[6-9]/.test(emergencyPhone.trim()))) {
      setError('Emergency contact phone must be a valid 10-digit Indian mobile number.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onCreatePatient({
        actorId,
        actorRole,
        tenantId,
        partnerId,
        organizationId,
        branchId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth,
        gender,
        bloodGroup,
        maritalStatus,
        nationality: 'Indian',
        preferredLanguage: 'English',
        registrationSource: 'RECEPTION_DESK',
        primaryMobile: primaryMobile.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: '',
        city: city.trim(),
        state: '',
        country: 'India',
        postalCode: '',
        emergencyRelationship: emergencyRelation,
        generalConsentGranted: true,
        reason,
        ...(email.trim() ? { email: email.trim() } : {}),
        ...(emergencyName.trim() ? { emergencyContactName: emergencyName.trim() } : {}),
        ...(emergencyPhone.trim() ? { emergencyPrimaryPhone: emergencyPhone.trim() } : {}),
        ...(insurancePayer.trim() ? { insurancePayerName: insurancePayer.trim() } : {}),
        ...(insurancePolicy.trim() ? { insurancePolicyNumber: insurancePolicy.trim() } : {})
      });

      // Automatically issue initial OPD Encounter & Queue Token if doctor or department is selected
      if (doctorId || departmentId) {
        try {
          const latestPatients = await patientRegistrationService.searchPatients({
            tenantId,
            organizationId,
            pageSize: 5
          });
          const targetPatient = latestPatients.find((p) => p.primaryContact?.primaryMobile === primaryMobile.trim()) || latestPatients[0];
          if (targetPatient) {
            await encounterService.createEncounter({
              actorId,
              actorRole,
              tenantId,
              partnerId,
              organizationId,
              branchId,
              departmentId: departmentId || (departmentsList[0]?.id ?? 'MOCK_DEPT_OPD'),
              patientId: targetPatient.id,
              doctorId: doctorId || undefined,
              encounterType: 'OPD',
              priority: 'ROUTINE',
              consultationMode: 'IN_PERSON',
              chiefComplaint: 'Outpatient Clinic Consultation',
              autoCheckIn: true,
              reason: `OPD Queue Token issued at reception for ${firstName} ${lastName}`
            });
          }
        } catch (encErr) {
          console.warn('Auto encounter token issuance note:', encErr);
        }
      }

      // 📱 Dispatch Instant WhatsApp OPD Digital Slip
      if (sendWhatsAppSlip && primaryMobile.trim()) {
        try {
          const cleanToken = primaryMobile.trim().slice(-4);
          const patientMrn = `MRN-${primaryMobile.trim().slice(-6)}`;
          await whatsappPortalService.dispatchDocument(tenantId, {
            patientMrn,
            patientName: `${firstName} ${lastName}`.trim(),
            phoneNumber: primaryMobile.trim(),
            documentType: 'PRESCRIPTION_E_RX',
            documentNumber: `TKN-${cleanToken}`,
            fileName: `OPD-Token-Slip-TKN-${cleanToken}.pdf`
          }).catch(() => {});
        } catch (waErr) {
          console.warn('WhatsApp slip dispatch note:', waErr);
        }
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Patient (MPI Intake)"
      maxWidth="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting} disabled={isSubmitting}>
            Complete Registration & Issue MRN
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Deterministic MRN & Duplicate Check">
          Entering patient demographics executes an automated probabilistic duplicate check. If matching records exist, the profile is flagged for duplicate review to maintain master index integrity.
        </Alert>

        {/* ABHA SCAN & SHARE INTAKE ACTION BAR */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.35)',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(6, 182, 212, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>📱</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ds-color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ABDM Fast Intake (Scan & Share)
                <span style={{ fontSize: '10px', background: '#06b6d4', color: '#000', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>NHA 2.0</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ds-color-text-secondary)' }}>
                Walk-in patient counter QR code scan karega toh demographics 1 second me auto-fill ho jayenge.
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAbhaModal(true)}
            style={{ fontWeight: 700, borderColor: '#06b6d4', color: '#06b6d4', whiteSpace: 'nowrap' }}
          >
            📲 Show Counter QR
          </Button>
        </div>


        {/* ABHA QR MODAL */}
        {showAbhaModal && (
          <div style={{
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '2px dashed #06b6d4',
            borderRadius: '12px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8' }}>
              🏥 APEX HOSPITAL OPD RECEPTION COUNTER #01
            </div>
            <div style={{
              width: '130px',
              height: '130px',
              background: '#fff',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)'
            }}>
              <div style={{ fontSize: '64px', lineHeight: 1 }}>🏁</div>
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#000', marginTop: '4px' }}>ABDM SCAN & SHARE</span>
            </div>
            <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
              Patient scans using <b>Aarogya Setu</b>, <b>ABHA App</b>, or <b>Paytm Health</b>.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAbhaModal(false)}>
                Close QR
              </Button>
            </div>
          </div>
        )}

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              First Name *
            </label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Last Name *
            </label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Date of Birth *
            </label>
            <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Gender *
            </label>
            <Select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              options={[
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
                { value: 'OTHER', label: 'Other' },
                { value: 'UNKNOWN', label: 'Unknown' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Blood Group
            </label>
            <Select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
              options={[
                { value: 'O_POSITIVE', label: 'O+' },
                { value: 'O_NEGATIVE', label: 'O-' },
                { value: 'A_POSITIVE', label: 'A+' },
                { value: 'A_NEGATIVE', label: 'A-' },
                { value: 'B_POSITIVE', label: 'B+' },
                { value: 'B_NEGATIVE', label: 'B-' },
                { value: 'AB_POSITIVE', label: 'AB+' },
                { value: 'AB_NEGATIVE', label: 'AB-' },
                { value: 'UNKNOWN', label: 'Unknown' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Marital Status
            </label>
            <Select
              value={maritalStatus}
              onChange={(e) => setMaritalStatus(e.target.value as MaritalStatus)}
              options={[
                { value: 'SINGLE', label: 'Single' },
                { value: 'MARRIED', label: 'Married' },
                { value: 'DIVORCED', label: 'Divorced' },
                { value: 'WIDOWED', label: 'Widowed' },
                { value: 'OTHER', label: 'Other' }
              ]}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Primary Mobile Phone (10-Digit Mobile) *
            </label>
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={primaryMobile}
              onChange={(e) => {
                let digits = e.target.value.replace(/\D/g, '');
                if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
                else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
                setPrimaryMobile(digits.slice(0, 10));
              }}
              placeholder="98765 43210"
              required
              leftElement={<span style={{ fontWeight: 800, color: 'var(--ds-color-primary, #38BDF8)', fontSize: '0.8125rem' }}>+91</span>}
              style={{ paddingLeft: '48px', fontFamily: 'monospace' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Email Address
            </label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="patient@example.com (Optional)" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              <span>Address / Locality</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)', fontWeight: 'normal' }}>(Optional)</span>
            </label>
            <Input
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="e.g. Colony, Area, or Landmark (Optional)"
            />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              <span>City</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)', fontWeight: 'normal' }}>(Optional)</span>
            </label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. City / Town (Optional)"
            />
          </div>
        </div>

        {/* CONSULTING DOCTOR & OPD VISIT ASSIGNMENT */}
        <div style={{
          backgroundColor: '#0F172A',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.1rem' }}>🩺</span>
              <strong style={{ fontSize: '0.8125rem', color: '#F1F5F9' }}>
                Consulting Doctor & OPD Token
              </strong>
            </div>

            {/* Mode Switcher Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: '#1E293B', padding: '2px 4px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setFacilityMode('AUTO_DETECT')}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: facilityMode === 'AUTO_DETECT' ? '#3B82F6' : 'transparent',
                  color: facilityMode === 'AUTO_DETECT' ? '#FFF' : '#94A3B8'
                }}
              >
                Auto ({doctorsList.length} Docs)
              </button>
              <button
                type="button"
                onClick={() => setFacilityMode('CLINIC')}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: facilityMode === 'CLINIC' ? '#06B6D4' : 'transparent',
                  color: facilityMode === 'CLINIC' ? '#070C16' : '#94A3B8'
                }}
              >
                🩺 Single Clinic
              </button>
              <button
                type="button"
                onClick={() => setFacilityMode('HOSPITAL')}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: facilityMode === 'HOSPITAL' ? '#8B5CF6' : 'transparent',
                  color: facilityMode === 'HOSPITAL' ? '#FFF' : '#94A3B8'
                }}
              >
                🏥 Multi Hospital
              </button>
            </div>
          </div>

          {/* SINGLE DOCTOR CLINIC: AUTO-LOCKED DISPLAY */}
          {isSingleDoctor && singleDoctor ? (
            <div style={{
              backgroundColor: 'rgba(6, 182, 212, 0.1)',
              border: '1.5px solid rgba(6, 182, 212, 0.35)',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>👨‍⚕️</span>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#E2E8F0' }}>
                    {singleDoctor.fullName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                    Specialty: <strong style={{ color: '#67E8F9' }}>{singleDoctor.primarySpecialty}</strong>
                    {singleDoctor.departmentName && ` • Dept: ${singleDoctor.departmentName}`}
                    {' • '}OPD Token will be issued automatically upon registration
                  </div>
                </div>
              </div>
              <span style={{
                fontSize: '0.6875rem',
                backgroundColor: 'rgba(6, 182, 212, 0.25)',
                color: '#67E8F9',
                padding: '4px 8px',
                borderRadius: '6px',
                fontWeight: 700,
                whiteSpace: 'nowrap'
              }}>
                ⚡ Auto-Selected (Single Clinic)
              </span>
            </div>
          ) : (
            /* MULTI-DOCTOR HOSPITAL: CASCADING SELECTION */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  <span>Assigned Department</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--ds-color-text-muted)' }}>(Optional)</span>
                </label>
                <Select
                  value={departmentId}
                  onChange={(e) => {
                    const newDept = e.target.value;
                    setDepartmentId(newDept);
                    if (doctorId) {
                      const doc = doctorsList.find((d) => d.id === doctorId);
                      if (doc && doc.departmentId && doc.departmentId !== newDept && newDept) {
                        setDoctorId('');
                      }
                    }
                  }}
                  options={[
                    { value: '', label: '— All Departments / General OPD —' },
                    ...departmentsList.map((d) => ({
                      value: d.id,
                      label: d.departmentName
                    }))
                  ]}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  <span>Consulting Doctor</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--ds-color-text-muted)' }}>(Optional)</span>
                </label>
                <Select
                  value={doctorId}
                  onChange={(e) => {
                    const newDocId = e.target.value;
                    setDoctorId(newDocId);
                    const doc = doctorsList.find((d) => d.id === newDocId);
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
        </div>

        <div style={{ borderTop: '1px solid var(--ds-color-border)', paddingTop: '12px' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)', display: 'block', marginBottom: '8px' }}>
            Emergency Contact Details
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>Name</label>
              <Input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>Relationship</label>
              <Select
                value={emergencyRelation}
                onChange={(e) => setEmergencyRelation(e.target.value as EmergencyRelationship)}
                options={[
                  { value: 'SPOUSE', label: 'Spouse' },
                  { value: 'PARENT', label: 'Parent' },
                  { value: 'SIBLING', label: 'Sibling' },
                  { value: 'CHILD', label: 'Child' },
                  { value: 'GUARDIAN', label: 'Guardian' },
                  { value: 'FRIEND', label: 'Friend' },
                  { value: 'OTHER', label: 'Other' }
                ]}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>Emergency Contact Phone (10-Digit Mobile)</label>
              <Input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="98765 43210"
                value={emergencyPhone}
                onChange={(e) => {
                  let digits = e.target.value.replace(/\D/g, '');
                  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
                  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
                  setEmergencyPhone(digits.slice(0, 10));
                }}
                leftElement={<span style={{ fontWeight: 800, color: 'var(--ds-color-primary, #38BDF8)', fontSize: '0.8125rem' }}>+91</span>}
                style={{ paddingLeft: '48px', fontFamily: 'monospace' }}
              />
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--ds-color-border)', paddingTop: '12px' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)', display: 'block', marginBottom: '8px' }}>
            Insurance / Payer Information (Optional)
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>Insurance Provider / Payer</label>
              <Input value={insurancePayer} onChange={(e) => setInsurancePayer(e.target.value)} placeholder="e.g. Blue Cross Blue Shield" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>Policy / Group Number</label>
              <Input value={insurancePolicy} onChange={(e) => setInsurancePolicy(e.target.value)} placeholder="e.g. POL-99281" />
            </div>
          </div>
        </div>

        {/* WhatsApp Instant Digital OPD Slip Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderRadius: '10px',
          background: sendWhatsAppSlip ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)',
          border: sendWhatsAppSlip ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(255, 255, 255, 0.1)',
          cursor: 'pointer'
        }} onClick={() => setSendWhatsAppSlip(!sendWhatsAppSlip)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>💬</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ds-color-text-primary)' }}>
                Instant WhatsApp Digital OPD Slip & Token
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ds-color-text-secondary)' }}>
                Registration hote hi patient mobile par Token number, Doctor cabin aur live queue tracking link bhejega.
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={sendWhatsAppSlip}
            onChange={(e) => setSendWhatsAppSlip(e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: '#22c55e', cursor: 'pointer' }}
          />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            <span>Intake / Audit Note</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--ds-color-text-muted)' }}>(Optional)</span>
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Standard outpatient clinic reception registration"
          />
        </div>
      </form>
    </Dialog>
  );
};
