import React, { useState, useEffect } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  InvestigationCatalogDto,
  InvestigationPanelDto,
  CreateInvestigationOrderRequest
} from '@docsearch/api-contracts';

export interface CreateInvestigationOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateInvestigationOrderRequest) => Promise<void>;
  catalog: InvestigationCatalogDto[];
  panels: InvestigationPanelDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | undefined;
  defaultPatientId?: string;
  defaultEncounterId?: string;
  defaultConsultationId?: string;
  defaultDoctorId?: string;
}

const DEFAULT_INDICATION_LIBRARY = [
  'Fever evaluation / Pyrexia of Unknown Origin (PUO)',
  'Routine Health Screening / Annual Wellness CBC',
  'Suspected Anemia / Fatigue & Weakness',
  'Pre-Operative Fitness / Anesthesia PAC Clearance',
  'Suspected Viral Infection / Dengue / Typhoid Workup',
  'Acute Abdominal Pain / Gastric Distress',
  'Diabetes Mellitus Glycemic Monitoring (HbA1c / Sugar)',
  'Chest Pain / Exertional Dyspnea Evaluation',
  'Hypertension & Renal Function Evaluation',
  'Skin Rash / Allergic Reaction / Eosinophilia',
  'Post-Treatment Follow-up & Recovery Assessment'
];

const DEFAULT_DOCTOR_LIBRARY = [
  'Dr. Rajesh Sharma, MD (Consultant Physician)',
  'Dr. Priya Nair, MS (General Surgeon)',
  'Dr. Vikram Malhotra, MD (Cardiologist)',
  'Dr. Sneha Verma, DGO (Gynecologist)',
  'Dr. Arvind Mehta, DMRD (Radiologist)',
  'Self / Walk-in Patient (Direct)'
];

export const CreateInvestigationOrderDialog: React.FC<CreateInvestigationOrderDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  catalog,
  panels,
  tenantId,
  partnerId,
  organizationId,
  branchId,
  defaultPatientId = '55555555-1111-4555-8555-111111111101',
  defaultEncounterId = 'eeee1111-1111-4eee-8eee-111111111101',
  defaultConsultationId,
  defaultDoctorId = 'aaaa1111-1111-4aaa-8aaa-111111111101'
}) => {
  // Patient Demographics
  const [patientName, setPatientName] = useState<string>('Amit Kumar');
  const [patientAge, setPatientAge] = useState<string>('28');
  const [patientGender, setPatientGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [patientPhone, setPatientPhone] = useState<string>('9876543210');

  // Referring Doctor Library state
  const [doctorList, setDoctorList] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('docsearch_pathology_referring_doctors');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return DEFAULT_DOCTOR_LIBRARY;
  });

  const [referringDoctor, setReferringDoctor] = useState<string>(doctorList[0] || DEFAULT_DOCTOR_LIBRARY[0] || '');
  const [isAddingDoctor, setIsAddingDoctor] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorClinic, setNewDoctorClinic] = useState('');

  // Investigation & Clinical Details
  const [selectedInvestigationId, setSelectedInvestigationId] = useState<string>(catalog[0]?.id || '');
  const [selectedPanelId, setSelectedPanelId] = useState<string>('');
  const [priority, setPriority] = useState<'ROUTINE' | 'URGENT' | 'STAT' | 'EMERGENCY'>('ROUTINE');
    // Clinical Indication Library state
  const [indicationList, setIndicationList] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('docsearch_pathology_clinical_indications');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return DEFAULT_INDICATION_LIBRARY;
  });

  const [clinicalIndication, setClinicalIndication] = useState<string>(indicationList[0] || DEFAULT_INDICATION_LIBRARY[0] || 'fever');
  const [diagnosisContext, setDiagnosisContext] = useState<string>('');
  const [fastingConfirmed, setFastingConfirmed] = useState<boolean>(false);
  const [justification, setJustification] = useState<string>('Walk-in patient CBC test request');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (catalog.length > 0 && !selectedInvestigationId) {
      setSelectedInvestigationId(catalog[0]?.id || '');
    }
  }, [catalog, selectedInvestigationId, isOpen]);

  const selectedInv = catalog.find((c) => c.id === selectedInvestigationId);

  // Add new doctor to lab library permanently
  const handleSaveNewDoctor = () => {
    if (!newDoctorName.trim()) return;
    const formatted = newDoctorClinic.trim()
      ? `${newDoctorName.trim()} (${newDoctorClinic.trim()})`
      : newDoctorName.trim();

    if (!doctorList.includes(formatted)) {
      const updated = [formatted, ...doctorList];
      setDoctorList(updated);
      setReferringDoctor(formatted);
      if (typeof window !== 'undefined') {
        localStorage.setItem('docsearch_pathology_referring_doctors', JSON.stringify(updated));
      }
    } else {
      setReferringDoctor(formatted);
    }

    setNewDoctorName('');
    setNewDoctorClinic('');
    setIsAddingDoctor(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setError('Patient Full Name is required.');
      return;
    }
    const effectiveInvestigationId = selectedInvestigationId || catalog[0]?.id || '';
    if (!effectiveInvestigationId) {
      setError('Please select an investigation test.');
      return;
    }
    if (!clinicalIndication.trim()) {
      setError('Clinical indication / reason for order is required.');
      return;
    }
    if (!justification.trim()) {
      setError('Clinical justification is required for audit traceability.');
      return;
    }

        // Auto-save new clinical indication into lab library
    if (clinicalIndication.trim() && !indicationList.includes(clinicalIndication.trim())) {
      const updatedIndications = [clinicalIndication.trim(), ...indicationList];
      setIndicationList(updatedIndications);
      if (typeof window !== 'undefined') {
        localStorage.setItem('docsearch_pathology_clinical_indications', JSON.stringify(updatedIndications));
      }
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        patientId: defaultPatientId,
        patientName,
        patientAge,
        patientGender,
        patientPhone,
        orderingDoctorName: referringDoctor,
        referringDoctor,
        encounterId: defaultEncounterId,
        consultationId: defaultConsultationId,
        orderingDoctorId: defaultDoctorId,
        investigationId: effectiveInvestigationId,
        panelId: selectedPanelId || undefined,
        priority,
        clinicalIndication,
        diagnosisContext: diagnosisContext || undefined,
        specimenType: selectedInv?.specimenType || 'WHOLE_BLOOD',
        fastingConfirmed,
        actorId: 'dr.sarah.jenkins@docsearch.docsearch.health',
        actorRole: 'ATTENDING_DOCTOR',
        justification
      });
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to create investigation order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="🔬 Place Diagnostic / Laboratory Investigation Order"
      maxWidth="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{ backgroundColor: '#06B6D4', borderColor: '#06B6D4', color: '#070C16', fontWeight: 900 }}
          >
            {isSubmitting ? 'Placing Order...' : 'Submit Order'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        {/* 1. Patient & Demographics Information Card */}
        <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.75)', border: '1.5px solid rgba(6, 182, 212, 0.3)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.1rem' }}>👤</span>
            <strong style={{ fontSize: '0.875rem', color: '#38BDF8', textTransform: 'uppercase' }}>
              Patient Demographics & Referral Details
            </strong>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                PATIENT FULL NAME *
              </label>
              <Input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Amit Kumar"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                AGE (YRS) *
              </label>
              <Input
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                placeholder="28"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                GENDER *
              </label>
              <Select
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value as any)}
                options={[
                  { label: 'Male', value: 'MALE' },
                  { label: 'Female', value: 'FEMALE' },
                  { label: 'Other', value: 'OTHER' }
                ]}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                MOBILE NUMBER (FOR WHATSAPP PDF)
              </label>
              <Input
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="9876543210"
              />
            </div>

            {/* Referring Doctor Dropdown + Add Doctor to Library */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1' }}>
                  REFERRING DOCTOR (SAVED LIBRARY)
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingDoctor(!isAddingDoctor)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38BDF8',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {isAddingDoctor ? '✕ Cancel' : '➕ Add New Doctor'}
                </button>
              </div>

              {!isAddingDoctor ? (
                <Select
                  value={referringDoctor}
                  onChange={(e) => setReferringDoctor(e.target.value)}
                  options={doctorList.map((doc) => ({
                    label: doc,
                    value: doc
                  }))}
                />
              ) : (
                <div style={{ backgroundColor: '#0F172A', border: '1px solid #06B6D4', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '6px' }}>
                    <Input
                      value={newDoctorName}
                      onChange={(e) => setNewDoctorName(e.target.value)}
                      placeholder="Doctor Name (e.g. Dr. Alok Verma)"
                    />
                    <Input
                      value={newDoctorClinic}
                      onChange={(e) => setNewDoctorClinic(e.target.value)}
                      placeholder="Specialty / Clinic Name"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleSaveNewDoctor}
                    style={{ backgroundColor: '#10B981', borderColor: '#10B981', color: '#070C16', fontWeight: 800 }}
                  >
                    💾 Save to Lab Doctor Library
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Investigation Test Selection */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
            SELECT INVESTIGATION / LAB TEST *
          </label>
          <Select
            value={selectedInvestigationId}
            onChange={(e) => setSelectedInvestigationId(e.target.value)}
            options={catalog.map((inv) => ({
              label: `[${inv.category}] ${inv.testCode} — ${inv.testName} (${inv.specimenType})`,
              value: inv.id
            }))}
          />
        </div>

        {selectedInv && (
          <div style={{ padding: '12px 14px', backgroundColor: 'rgba(30, 41, 59, 0.85)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '8px', fontSize: '0.8125rem', color: '#F8FAFC' }}>
            <div><span style={{ color: '#94A3B8' }}>Department:</span> <strong style={{ color: '#38BDF8' }}>{selectedInv.department}</strong></div>
            <div style={{ marginTop: '3px' }}><span style={{ color: '#94A3B8' }}>Specimen Requirement:</span> <strong style={{ color: '#A7F3D0' }}>{selectedInv.sampleVolume || selectedInv.specimenType}</strong></div>
            {selectedInv.preparationRequirements && (
              <div style={{ marginTop: '3px', color: '#FCD34D' }}>
                <strong>Prep:</strong> {selectedInv.preparationRequirements}
              </div>
            )}
            {selectedInv.fastingRequired && (
              <div style={{ marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={fastingConfirmed}
                    onChange={(e) => setFastingConfirmed(e.target.checked)}
                  />
                  <span style={{ color: '#F8FAFC' }}>Confirm patient 10-12 hr fasting status verified</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* 3. Panel & Priority */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
              LINKED INVESTIGATION PANEL (OPTIONAL)
            </label>
            <Select
              value={selectedPanelId}
              onChange={(e) => setSelectedPanelId(e.target.value)}
              options={[
                { label: 'None (Single Investigation)', value: '' },
                ...panels.map((p) => ({ label: `${p.panelCode} — ${p.panelName}`, value: p.id }))
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
              ORDER PRIORITY *
            </label>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              options={[
                { label: 'Routine (Standard TAT)', value: 'ROUTINE' },
                { label: 'Urgent (Priority Processing)', value: 'URGENT' },
                { label: 'STAT (Immediate Action Required)', value: 'STAT' },
                { label: 'Emergency (Crash Cart / Triage)', value: 'EMERGENCY' }
              ]}
            />
          </div>
        </div>

        {/* 4. Clinical Indication & Smart Suggestion Library */}
        <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.75)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase' }}>
              🎯 CLINICAL INDICATION / DIAGNOSTIC OBJECTIVE *
            </label>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Auto-saved to Lab Suggestion Library</span>
          </div>

          {/* Quick Pre-set Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[
              { label: '🔥 Fever / Infection', val: 'Fever evaluation / Pyrexia of Unknown Origin (PUO)' },
              { label: '🩸 Suspected Anemia', val: 'Suspected Anemia / Fatigue & Weakness' },
              { label: '🏥 Routine CBC Check', val: 'Routine Health Screening / Annual Wellness CBC' },
              { label: '💉 Pre-Op Fitness', val: 'Pre-Operative Fitness / Anesthesia PAC Clearance' },
              { label: '🦠 Viral / Dengue', val: 'Suspected Viral Infection / Dengue / Typhoid Workup' }
            ].map((chip) => (
              <button
                key={chip.val}
                type="button"
                onClick={() => setClinicalIndication(chip.val)}
                style={{
                  backgroundColor: clinicalIndication === chip.val ? '#0284C7' : 'rgba(15, 23, 42, 0.8)',
                  color: clinicalIndication === chip.val ? '#FFFFFF' : '#CBD5E1',
                  border: clinicalIndication === chip.val ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Dropdown Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '4px' }}>
              Select from Saved Indication Library:
            </label>
            <Select
              value={clinicalIndication}
              onChange={(e) => setClinicalIndication(e.target.value)}
              options={[
                ...indicationList.map((ind) => ({ label: ind, value: ind })),
                { label: '✍️ Type Custom Indication Below...', value: 'custom' }
              ]}
            />
          </div>

          {/* Custom Input with Datalist Autocomplete */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '4px' }}>
              Or Type / Edit Specific Diagnostic Reason (Auto-Suggests):
            </label>
            <input
              list="clinical-indication-suggestions"
              value={clinicalIndication === 'custom' ? '' : clinicalIndication}
              onChange={(e) => setClinicalIndication(e.target.value)}
              placeholder="e.g. High grade intermittent fever with chills for 3 days"
              required
              style={{
                width: '100%',
                backgroundColor: 'var(--ds-color-surface, #0F172A)',
                color: '#F8FAFC',
                border: '1px solid var(--ds-color-border, rgba(255,255,255,0.15))',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
            <datalist id="clinical-indication-suggestions">
              {indicationList.map((ind, i) => (
                <option key={i} value={ind} />
              ))}
            </datalist>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
            CLINICAL DIAGNOSIS CONTEXT / ICD-10 CODE
          </label>
          <Input
            value={diagnosisContext}
            onChange={(e) => setDiagnosisContext(e.target.value)}
            placeholder="e.g. R50.9 Fever unspecified, I10 Essential Hypertension"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
            AUDIT JUSTIFICATION *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Reason for placing diagnostic order..."
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
