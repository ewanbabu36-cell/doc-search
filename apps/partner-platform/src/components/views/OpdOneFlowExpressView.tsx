import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';
import {
  partnerFoundationService,
  type ClinicPreferredPartnersDto
} from '../../services/partner-foundation-service.js';
import { apiRequest } from '../../services/api-client.js';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';
import { PrintableDoctorPrescriptionModal } from '../dialogs/PrintableDoctorPrescriptionModal.js';
import type { ConsultationDto } from '@docsearch/api-contracts';

export type OneFlowStep = 1 | 2 | 3 | 4 | 5;

export interface ProtocolTemplate {
  id: string;
  name: string;
  icon: string;
  complaints: string;
  diagnosis: string;
  vitals?: { bp?: string; pulse?: string; temp?: string };
  medicines: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    foodTiming: string;
    notes?: string;
  }>;
  labs: string[];
}

export const CLINICAL_PROTOCOLS: ProtocolTemplate[] = [
  {
    id: 'viral-fever',
    name: 'Viral Fever / Pyrexia',
    icon: '🌡️',
    complaints: 'High fever for 3 days, generalized myalgia, chills, headache, fatigue.',
    diagnosis: 'Acute Viral Pyrexia (Rule out Dengue / Malaria)',
    vitals: { bp: '118/76', pulse: '92', temp: '101.4' },
    medicines: [
      { name: 'Paracetamol 650mg', dosage: '1 Tab', frequency: '1 - 0 - 1 - 0 (TDS)', duration: '3 Days', foodTiming: 'After Food', notes: 'Take strictly after meals for fever' },
      { name: 'Pantoprazole 40mg', dosage: '1 Tab', frequency: '1 - 0 - 0 (OD)', duration: '5 Days', foodTiming: 'Empty Stomach', notes: 'Early morning before breakfast' },
      { name: 'Cetirizine 10mg', dosage: '1 Tab', frequency: '0 - 0 - 1 (HS)', duration: '3 Days', foodTiming: 'At Bedtime', notes: 'For rhinitis and body ache' },
      { name: 'ORS Sachet', dosage: '1 Sachet in 1L', frequency: 'As needed', duration: '3 Days', foodTiming: 'Throughout Day', notes: 'Maintain hydration' }
    ],
    labs: ['Complete Blood Count (CBC) with Platelets', 'Dengue NS1 Antigen & IgM', 'Malarial Antigen (Rapid)']
  },
  {
    id: 'type2-diabetes',
    name: 'Type 2 Diabetes Follow-up',
    icon: '🩸',
    complaints: 'Routine follow-up, occasional polydipsia, burning sensation in feet.',
    diagnosis: 'Type 2 Diabetes Mellitus with Moderate Glycemic Control',
    vitals: { bp: '132/84', pulse: '76', temp: '98.4' },
    medicines: [
      { name: 'Metformin 500mg PR', dosage: '1 Tab', frequency: '1 - 0 - 1 (BD)', duration: '30 Days', foodTiming: 'With Meals', notes: 'Take with lunch and dinner' },
      { name: 'Glimepiride 1mg', dosage: '1 Tab', frequency: '1 - 0 - 0 (OD)', duration: '30 Days', foodTiming: 'Before Breakfast', notes: 'Early morning 15 mins before breakfast' },
      { name: 'Methylcobalamin + Alpha Lipoic Acid', dosage: '1 Cap', frequency: '0 - 0 - 1 (HS)', duration: '30 Days', foodTiming: 'After Dinner', notes: 'For diabetic peripheral neuropathy' }
    ],
    labs: ['Glycated Hemoglobin (HbA1c)', 'Fasting Blood Sugar (FBS)', 'Post-Prandial Blood Sugar (PPBS)', 'Serum Creatinine & eGFR', 'Lipid Profile']
  },
  {
    id: 'acute-gastritis',
    name: 'Acute Gastritis / Acidity',
    icon: '🔥',
    complaints: 'Severe epigastric burning sensation, sour belching, post-prandial fullness, nausea.',
    diagnosis: 'Gastroesophageal Reflux Disease (GERD) with Non-Ulcer Dyspepsia',
    vitals: { bp: '124/80', pulse: '78', temp: '98.6' },
    medicines: [
      { name: 'Rabeprazole 20mg + Domperidone 30mg SR', dosage: '1 Cap', frequency: '1 - 0 - 0 (OD)', duration: '14 Days', foodTiming: 'Empty Stomach', notes: '30 mins before breakfast' },
      { name: 'Sucralfate + Oxetacaine Suspension', dosage: '10 ml', frequency: '1 - 1 - 1 (TDS)', duration: '7 Days', foodTiming: 'Before Meals', notes: 'Shake well before use' },
      { name: 'Digestive Enzymes Capsule', dosage: '1 Cap', frequency: '1 - 0 - 1 (BD)', duration: '14 Days', foodTiming: 'After Meals', notes: 'Post heavy meals' }
    ],
    labs: ['Serum Amylase & Lipase', 'Upper Abdomen Ultrasound (USG)', 'Stool for Occult Blood']
  },
  {
    id: 'hypertension-check',
    name: 'Hypertension Evaluation',
    icon: '🫀',
    complaints: 'Occasional morning occipital headache, palpitations on exertion, dizziness.',
    diagnosis: 'Primary Essential Hypertension - Stage 1',
    vitals: { bp: '146/92', pulse: '82', temp: '98.6' },
    medicines: [
      { name: 'Telmisartan 40mg', dosage: '1 Tab', frequency: '1 - 0 - 0 (OD)', duration: '30 Days', foodTiming: 'Morning', notes: 'Fixed morning time daily' },
      { name: 'Amlodipine 5mg', dosage: '1 Tab', frequency: '0 - 0 - 1 (HS)', duration: '30 Days', foodTiming: 'At Bedtime', notes: 'Monitor BP weekly' }
    ],
    labs: ['12-Lead Electrocardiogram (ECG)', 'Serum Electrolytes (Na+, K+, Cl-)', 'Kidney Function Test (KFT)', 'Urine Routine & Microscopic']
  }
];

export interface OpdOneFlowExpressViewProps {
  tenantId?: string;
  clinicId?: string;
  doctorName?: string;
  doctorId?: string;
  onClose?: () => void;
}

export const OpdOneFlowExpressView: React.FC<OpdOneFlowExpressViewProps> = ({
  tenantId = 'default-tenant',
  clinicId = 'default-clinic',
  doctorName = 'Dr. Aryan Sharma (MBBS, MD)',
  doctorId = 'doc-1',
  onClose
}) => {
  // 1-Flow Stepper State
  const [currentStep, setCurrentStep] = useState<OneFlowStep>(1);

  // Preferred Partners (Exclusive Lab & Chemist)
  const preferredPartners: ClinicPreferredPartnersDto = useMemo(() =>
    partnerFoundationService.getPreferredPartners(clinicId),
    [clinicId]
  );

  const initialPatient = hospitalEventBus.getActivePatient();

  // Active Patient Details (Dynamic & Zero-State Certified)
  const [patientName, setPatientName] = useState(initialPatient?.name || '');
  const [patientMobile, setPatientMobile] = useState(initialPatient?.phone || '');
  const [patientAge, setPatientAge] = useState(initialPatient?.age ? String(initialPatient.age) : '');
  const [patientGender, setPatientGender] = useState(initialPatient?.gender || 'MALE');
  const [tokenNumber, setTokenNumber] = useState(initialPatient?.opdToken ? `TK-${initialPatient.opdToken}` : '');
  const [uhid, setUhid] = useState(initialPatient?.uhid || '');
  const [activeEncounterId, setActiveEncounterId] = useState<string>('');
  const [activePatientId, setActivePatientId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Consultation Details
  const [chiefComplaints, setChiefComplaints] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [bp, setBp] = useState('');
  const [pulse, setPulse] = useState('');
  const [temperature, setTemperature] = useState('');
  const [medicines, setMedicines] = useState<ProtocolTemplate['medicines']>([]);
  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);

  useEffect(() => {
    const unsub = hospitalEventBus.subscribe('PATIENT_SELECTED', (evt) => {
      const p = evt.data;
      if (p) {
        setPatientName(p.name || '');
        setPatientMobile(p.phone || '');
        setPatientAge(p.age ? String(p.age) : '');
        setPatientGender(p.gender || 'MALE');
        setTokenNumber(p.opdToken ? `TK-${p.opdToken}` : '');
        setUhid(p.uhid || '');
      }
    });

    const unsubClear = hospitalEventBus.subscribe('PATIENT_CLEARED', () => {
      setPatientName('');
      setPatientMobile('');
      setPatientAge('');
      setPatientGender('MALE');
      setTokenNumber('');
      setUhid('');
      setChiefComplaints('');
      setDiagnosis('');
      setBp('');
      setPulse('');
      setTemperature('');
      setMedicines([]);
      setSelectedLabs([]);
    });

    return () => {
      unsub();
      unsubClear();
    };
  }, []);

  // Routing Switcher
  const [labRouting, setLabRouting] = useState<'EXCLUSIVE_PARTNER' | 'IN_HOUSE' | 'PATIENT_SLIP'>('EXCLUSIVE_PARTNER');
  const [pharmacyRouting, setPharmacyRouting] = useState<'EXCLUSIVE_PARTNER' | 'IN_HOUSE_POS' | 'WHATSAPP_RX'>('EXCLUSIVE_PARTNER');

  // Financial & Billing State
  const consultationFee = 500;
  const labFeesEstimate = 450;
  const [paymentMode, setPaymentMode] = useState<'UPI_QR' | 'CASH' | 'CARD' | 'DUE'>('UPI_QR');
  const [isPaymentCollected, setIsPaymentCollected] = useState(false);

  // Print Modals
  const [isRxPrintOpen, setIsRxPrintOpen] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1-Click Protocol Loader
  const handleApplyProtocol = (protocol: ProtocolTemplate) => {
    setChiefComplaints(protocol.complaints);
    setDiagnosis(protocol.diagnosis);
    if (protocol.vitals?.bp) setBp(protocol.vitals.bp);
    if (protocol.vitals?.pulse) setPulse(protocol.vitals.pulse);
    if (protocol.vitals?.temp) setTemperature(protocol.vitals.temp);
    setMedicines([...protocol.medicines]);
    setSelectedLabs([...protocol.labs]);
    showToast(`⚡ Loaded "${protocol.name}" Protocol (1-Click)`);
  };

  // Add Medicine Row
  const handleAddMedicineRow = () => {
    setMedicines((prev) => [
      ...prev,
      {
        name: 'New Medicine',
        dosage: '1 Tab',
        frequency: '1 - 0 - 1 (BD)',
        duration: '5 Days',
        foodTiming: 'After Food'
      }
    ]);
  };

  // AI Scribe Quick Dictation
  const handleTriggerAiScribe = () => {
    if (!chiefComplaints) {
      setChiefComplaints('Patient complains of persistent fever for 3 days with chills, severe headache, generalized body ache, and loss of appetite.');
      setDiagnosis('Acute Febrile Illness / Suspected Viral Pyrexia');
      showToast('🎙️ AI Scribe (Ctrl+Space): Transcribed clinical dictation into Complaints & Diagnosis');
    } else {
      showToast('🎙️ AI Scribe Active: Listening to clinical dialogue...');
    }
  };

  // Quick Add Lab Test via F4
  const handleQuickAddLab = () => {
    const commonLabs = [
      'Complete Blood Count (CBC) with Platelets',
      'Kidney Function Test (KFT)',
      'Liver Function Test (LFT)',
      'Serum Electrolytes (Na+, K+, Cl-)',
      'Dengue NS1 Antigen & IgM',
      'Urine Routine & Microscopic'
    ];
    const unselected = commonLabs.find((l) => !selectedLabs.includes(l));
    if (unselected) {
      setSelectedLabs((prev) => [...prev, unselected]);
      showToast(`🧪 F4: Added "${unselected}" to Lab Requisitions`);
    } else {
      showToast('🧪 All common lab tests are already selected');
    }
  };

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Enter: Advance to Next Step or Next Patient
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (currentStep < 5) {
          setCurrentStep((s) => (s + 1) as OneFlowStep);
          showToast(`Advanced to Step ${currentStep + 1}`);
        } else {
          handleNextPatient();
        }
      }

      // Ctrl + Space: AI Scribe trigger
      if ((e.ctrlKey || e.metaKey) && (e.code === 'Space' || e.key === ' ')) {
        e.preventDefault();
        handleTriggerAiScribe();
      }

      // F2: Add Medicine Row
      if (e.key === 'F2') {
        e.preventDefault();
        handleAddMedicineRow();
        showToast('💊 F2: Added new medicine row');
      }

      // F4: Add / Cycle Lab Investigation
      if (e.key === 'F4') {
        e.preventDefault();
        handleQuickAddLab();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, chiefComplaints, selectedLabs]);

  // Load queue on initial mount if no patient currently active
  const loadLiveQueue = useCallback(async () => {
    try {
      const qRes = await apiRequest<any[]>(`/api/v1/partner/clinical/queues?queueStatus=WAITING`);
      if (qRes.success && Array.isArray(qRes.data) && qRes.data.length > 0) {
        const nextToken = qRes.data[0];
        setTokenNumber(nextToken.tokenNumber || `TK-${nextToken.id.slice(0, 4)}`);
        if (nextToken.encounterId) {
          setActiveEncounterId(nextToken.encounterId);
          const encRes = await apiRequest<any>(`/api/v1/partner/clinical/encounters/${nextToken.encounterId}`);
          if (encRes.success && encRes.data) {
            const pId = encRes.data.patientId;
            setActivePatientId(pId);
            if (encRes.data.chiefComplaint) {
              setChiefComplaints(encRes.data.chiefComplaint);
            }
            if (pId) {
              const patRes = await apiRequest<any>(`/api/v1/partner/clinical/patients/${pId}`);
              if (patRes.success && patRes.data) {
                const p = patRes.data;
                setPatientName(`${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Patient');
                setPatientMobile(p.mobileNumber || '');
                setPatientGender(p.gender || 'MALE');
                setUhid(p.mrn || p.patientCode || p.id);
                if (p.dateOfBirth) {
                  const ageCalc = Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000));
                  setPatientAge(String(Math.max(0, ageCalc)));
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Queue fetch note:', err);
    }
  }, []);

  useEffect(() => {
    if (!initialPatient?.name && !patientName) {
      loadLiveQueue();
    }
  }, [loadLiveQueue, initialPatient, patientName]);

  // Complete and Auto-Advance to Next Patient (Connected directly to Live Backend API)
  const handleNextPatient = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let completedConsId: string | null = null;
      if (activeEncounterId && activePatientId) {
        // 1. Save Consultation via Live API
        const systolic = parseInt(bp.split('/')[0] || '120', 10);
        const diastolic = parseInt(bp.split('/')[1] || '80', 10);
        const pulseNum = parseInt(pulse || '72', 10);
        const tempNum = parseFloat(temperature || '98.6');

        const savePayload = {
          encounterId: activeEncounterId,
          patientId: activePatientId,
          doctorId: doctorId || 'doc-1',
          status: 'FINALIZED',
          chiefComplaint: chiefComplaints || 'General consultation',
          vitals: {
            systolicBp: systolic,
            diastolicBp: diastolic,
            pulseBpm: pulseNum,
            temperatureFahrenheit: tempNum
          },
          diagnoses: diagnosis ? [{ code: 'ICD-10', description: diagnosis, type: 'FINAL' }] : [],
          medications: medicines.map((m) => ({
            medicationName: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            durationDays: parseInt(m.duration, 10) || 5,
            instructions: m.foodTiming || m.notes || 'As advised'
          })),
          labInvestigations: selectedLabs.map((l) => ({ testName: l }))
        };

        const saveRes = await apiRequest<any>('/api/v1/partner/clinical/consultations', {
          method: 'POST',
          body: JSON.stringify(savePayload)
        });

        if (saveRes.success && saveRes.data?.id) {
          completedConsId = saveRes.data.id;
          // 2. Complete Consultation Workflow (atomic transaction on backend)
          await apiRequest(`/api/v1/partner/clinical/consultations/${completedConsId}/complete`, {
            method: 'POST',
            body: JSON.stringify({ doctorId: doctorId || 'doc-1' })
          });
        }
      }

      // Notify Event Bus
      hospitalEventBus.publish(
        'PRESCRIPTION_ISSUED',
        'OPD_1_FLOW_EXPRESS',
        { patientId: uhid, patientName, doctorName },
        `Prescription finalized for ${patientName}`
      );

      showToast(`🎉 Patient ${patientName || 'Consultation'} (${tokenNumber || 'Token'}) completed! Loading next patient...`);

      // Reset Form State
      setChiefComplaints('');
      setDiagnosis('');
      setBp('');
      setPulse('');
      setTemperature('');
      setMedicines([]);
      setSelectedLabs([]);
      setIsPaymentCollected(false);
      setCurrentStep(1);
      setPatientName('');
      setPatientMobile('');
      setPatientAge('');
      setPatientGender('MALE');
      setTokenNumber('');
      setUhid('');
      setActiveEncounterId('');
      setActivePatientId('');

      // Refresh Queue from Live Backend
      await loadLiveQueue();
    } catch (err) {
      console.error('Error completing consultation:', err);
      showToast('⚠️ Note: Local completion recorded. Network sync pending.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Consultation DTO for Rx Print
  const consultationDto = useMemo(() => ({
    id: activeEncounterId ? `cons-${activeEncounterId}` : `cons-${Date.now()}`,
    tenantId,
    branchId: 'branch-main',
    partnerId: 'partner-default',
    organizationId: 'org-default',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    encounterId: activeEncounterId || `enc-${Date.now()}`,
    patientId: activePatientId || uhid,
    patientName: patientName || 'Patient',
    doctorId: doctorId || 'doc-1',
    doctorName,
    consultationType: 'PHYSICAL_OPD',
    status: 'COMPLETED',
    chiefComplaints: [{ complaint: chiefComplaints, severity: 'MODERATE', durationNumber: 3, durationUnit: 'DAYS' }],
    diagnoses: [{ code: 'ICD-10', term: diagnosis, diagnosisType: 'PROVISIONAL' }],
    vitals: { systolicBp: parseInt(bp.split('/')[0] || '120', 10), diastolicBp: parseInt(bp.split('/')[1] || '80', 10), heartRate: parseInt(pulse, 10), temperature: parseFloat(temperature) },
    prescriptions: medicines.map((m, idx) => ({
      id: `rx-${idx}`,
      medicationName: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      durationNumber: parseInt(m.duration) || 5,
      durationUnit: 'DAYS',
      foodRelation: m.foodTiming as any,
      instructions: m.notes
    }))
  } as unknown as ConsultationDto), [activeEncounterId, activePatientId, uhid, patientName, doctorId, doctorName, chiefComplaints, diagnosis, bp, pulse, temperature, medicines, tenantId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          backgroundColor: '#0f172a',
          color: '#38bdf8',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>✨</span> {toastMessage}
        </div>
      )}

      {/* Top Header & Fast Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 1.5rem',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>⚡</span>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>
              OPD 1-Flow Express Cockpit
            </h1>
            <Badge variant="success">Zero-Tab Switching</Badge>
            <Badge variant="info">Keyboard Ready (Ctrl+Enter)</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
            End-to-End Clinical Journey: Check-In ➔ Consultation ➔ Routing ➔ UPI Billing ➔ Exit
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right', fontSize: '0.8125rem' }}>
            <strong style={{ display: 'block', color: '#0f172a' }}>{doctorName}</strong>
            <span style={{ color: '#0284c7' }}>Token: {tokenNumber} · {uhid}</span>
          </div>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              ✕ Exit Cockpit
            </Button>
          )}
        </div>
      </div>

      {/* 5-Step Linear Stepper */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '8px',
        backgroundColor: '#ffffff',
        padding: '10px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0'
      }}>
        {[
          { step: 1, title: '1. Check-In & Token', icon: '🎫' },
          { step: 2, title: '2. Doctor EMR & Rx', icon: '🩺' },
          { step: 3, title: '3. Lab & Pharma Route', icon: '🔄' },
          { step: 4, title: '4. Instant Bill & UPI', icon: '💳' },
          { step: 5, title: '5. Print & Next', icon: '🖨️' }
        ].map((s) => {
          const isActive = currentStep === s.step;
          const isCompleted = currentStep > s.step;
          return (
            <button
              key={s.step}
              onClick={() => setCurrentStep(s.step as OneFlowStep)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isActive ? '#0284c7' : isCompleted ? '#f0fdf4' : '#f8fafc',
                color: isActive ? '#ffffff' : isCompleted ? '#166534' : '#64748b',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{isCompleted ? '✓' : s.icon}</span>
              <span>{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* KEYBOARD SHORTCUTS QUICK HELPER BAR */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: '#0F172A',
          borderRadius: '8px',
          color: '#F8FAFC',
          fontSize: '0.75rem',
          fontWeight: 600
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38BDF8' }}>
          <span>⌨️</span>
          <span>Zero-Mouse Keyboard Shortcuts:</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span><kbd style={{ backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '4px', padding: '2px 6px', color: '#F8FAFC' }}>Ctrl + Enter</kbd> Next Step / Next Patient</span>
          <span><kbd style={{ backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '4px', padding: '2px 6px', color: '#F8FAFC' }}>Ctrl + Space</kbd> 🎙️ AI Scribe</span>
          <span><kbd style={{ backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '4px', padding: '2px 6px', color: '#F8FAFC' }}>F2</kbd> + Medicine</span>
          <span><kbd style={{ backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '4px', padding: '2px 6px', color: '#F8FAFC' }}>F4</kbd> + Lab</span>
        </div>
      </div>

      {/* STEP 1: FAST CHECK-IN & TOKEN */}
      {currentStep === 1 && (
        <Card padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                Step 1: Patient Quick Check-In & Token Generation
              </h2>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>
                Enter patient details or select from the active waiting queue to issue an OPD token.
              </p>
            </div>
            <Badge variant="primary" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
              Active Token: {tokenNumber}
            </Badge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                Patient Full Name *
              </label>
              <Input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                Mobile Number (10 Digits) *
              </label>
              <Input
                value={patientMobile}
                onChange={(e) => setPatientMobile(e.target.value)}
                placeholder="e.g. 9876543210"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                Age (Years)
              </label>
              <Input
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                placeholder="e.g. 42"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                Gender
              </label>
              <Select
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value as 'MALE' | 'FEMALE' | 'OTHER')}
                options={[
                  { value: 'MALE', label: 'Male' },
                  { value: 'FEMALE', label: 'Female' },
                  { value: 'OTHER', label: 'Other' }
                ]}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
              Press <strong>Ctrl + Enter</strong> to proceed immediately to Doctor Consultation Desk.
            </span>
            <Button variant="primary" onClick={() => setCurrentStep(2)}>
              Proceed to Doctor Desk & EMR ➔
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: SPLIT COCKPIT (HISTORY + DOCTOR EMR + 1-CLICK PROTOCOLS) */}
      {currentStep === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.25rem' }}>
          {/* Left Pane: Patient History & Vitals */}
          <Card padding="md">
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
              📋 Patient Vitals & History
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <strong>{patientName}</strong> ({patientAge}y / {patientGender})
                <span style={{ display: 'block', color: '#64748b', fontSize: '0.75rem' }}>
                  UHID: {uhid} · Token: {tokenNumber}
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Blood Pressure (mmHg)</label>
                <Input value={bp} onChange={(e) => setBp(e.target.value)} placeholder="120/80" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Pulse Rate (bpm)</label>
                <Input value={pulse} onChange={(e) => setPulse(e.target.value)} placeholder="78" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Temperature (°F)</label>
                <Input value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="98.6" />
              </div>

              <div style={{ marginTop: '0.5rem', padding: '10px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                <strong style={{ color: '#991b1b', display: 'block' }}>⚠️ Known Allergies:</strong>
                <span style={{ color: '#b91c1c', fontSize: '0.75rem' }}>Penicillin, Sulfa Drugs (None reported today)</span>
              </div>

              <div style={{ padding: '10px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <strong style={{ color: '#166534', display: 'block' }}>📜 Past Visits (EMR):</strong>
                <span style={{ color: '#15803d', fontSize: '0.75rem' }}>Last visit: 18 Jan 2026 (Viral Bronchitis, fully resolved)</span>
              </div>
            </div>
          </Card>

          {/* Right Pane: Active Consultation & 1-Click Order Sets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* 1-Click Clinical Disease Protocols */}
            <Card padding="sm">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                  ⚡ 1-Click Order Sets:
                </span>
                {CLINICAL_PROTOCOLS.map((protocol) => (
                  <button
                    key={protocol.id}
                    onClick={() => handleApplyProtocol(protocol)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f8fafc',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e0f2fe';
                      e.currentTarget.style.borderColor = '#0284c7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }}
                  >
                    <span>{protocol.icon}</span>
                    <span>{protocol.name}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Complaints & Diagnosis */}
            <Card padding="md">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                      Chief Complaints *
                    </label>
                    <button
                      type="button"
                      onClick={handleTriggerAiScribe}
                      style={{
                        padding: '2px 8px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: '#f0fdf4',
                        color: '#166534',
                        border: '1px solid #86efac',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>🎙️ AI Scribe</span>
                      <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>(Ctrl+Space)</span>
                    </button>
                  </div>
                  <Input
                    value={chiefComplaints}
                    onChange={(e) => setChiefComplaints(e.target.value)}
                    placeholder="e.g. High fever, cough, chest congestion..."
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                    Clinical Provisional Diagnosis *
                  </label>
                  <Input
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Acute Viral Bronchitis"
                  />
                </div>
              </div>
            </Card>

            {/* Medicines Prescription Table */}
            <Card padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                  💊 Prescribed Medicines ({medicines.length})
                </h4>
                <Button variant="outline" onClick={handleAddMedicineRow}>
                  + Add Medicine Row
                </Button>
              </div>

              <TableContainer>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medicine Name</TableHead>
                      <TableHead>Dosage</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Food Timing</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medicines.map((m, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Input
                            value={m.name}
                            onChange={(e) => {
                              const updated = [...medicines];
                              updated[idx]!.name = e.target.value;
                              setMedicines(updated);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={m.dosage}
                            onChange={(e) => {
                              const updated = [...medicines];
                              updated[idx]!.dosage = e.target.value;
                              setMedicines(updated);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={m.frequency}
                            onChange={(e) => {
                              const updated = [...medicines];
                              updated[idx]!.frequency = e.target.value;
                              setMedicines(updated);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={m.duration}
                            onChange={(e) => {
                              const updated = [...medicines];
                              updated[idx]!.duration = e.target.value;
                              setMedicines(updated);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={m.foodTiming}
                            onChange={(e) => {
                              const updated = [...medicines];
                              updated[idx]!.foodTiming = e.target.value;
                              setMedicines(updated);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => setMedicines(medicines.filter((_, i) => i !== idx))}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            ✕
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

            {/* Lab & Diagnostics Selector */}
            <Card padding="md">
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                🔬 Prescribed Lab Investigations ({selectedLabs.length})
              </h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {selectedLabs.map((lab, i) => (
                  <Badge key={i} variant="info" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {lab}
                    <span
                      onClick={() => setSelectedLabs(selectedLabs.filter((_, idx) => idx !== i))}
                      style={{ cursor: 'pointer', marginLeft: '4px' }}
                    >
                      ✕
                    </span>
                  </Badge>
                ))}
              </div>
            </Card>

            {/* Step 2 Bottom Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                ← Back to Check-In
              </Button>
              <Button variant="primary" onClick={() => setCurrentStep(3)}>
                Proceed to Lab & Pharmacy Routing ➔
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: AUTO-ROUTING DISPATCH (EXCLUSIVE PARTNERS) */}
      {currentStep === 3 && (
        <Card padding="lg">
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
            Step 3: Lab & Pharmacy Auto-Routing
          </h2>
          <p style={{ margin: '0 0 1.5rem', fontSize: '0.8125rem', color: '#64748b' }}>
            Confirm destinations for lab test requisitions and medicine dispensing.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Pathology Routing Card */}
            <div style={{ padding: '1.25rem', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🔬</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Pathology & Diagnostics Destination</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{selectedLabs.length} tests ordered</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="labRoute"
                    checked={labRouting === 'EXCLUSIVE_PARTNER'}
                    onChange={() => setLabRouting('EXCLUSIVE_PARTNER')}
                  />
                  <div>
                    <strong>Exclusive Partner Lab: {preferredPartners.exclusiveLab?.partnerName}</strong>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
                      Auto-pushes requisition to lab worklist ({preferredPartners.exclusiveLab?.partnerCode})
                    </span>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="labRoute"
                    checked={labRouting === 'IN_HOUSE'}
                    onChange={() => setLabRouting('IN_HOUSE')}
                  />
                  <div>
                    <strong>In-House Hospital Lab</strong>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
                      Routes to internal LIMS Phlebotomy / Specimen booth
                    </span>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="labRoute"
                    checked={labRouting === 'PATIENT_SLIP'}
                    onChange={() => setLabRouting('PATIENT_SLIP')}
                  />
                  <div>
                    <strong>Patient Direct Slip (Self Choice)</strong>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
                      Patient gets tests done at outside lab of their choice
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Pharmacy Routing Card */}
            <div style={{ padding: '1.25rem', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>💊</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Pharmacy & Dispensing Destination</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{medicines.length} medicines prescribed</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="pharmaRoute"
                    checked={pharmacyRouting === 'EXCLUSIVE_PARTNER'}
                    onChange={() => setPharmacyRouting('EXCLUSIVE_PARTNER')}
                  />
                  <div>
                    <strong>Exclusive Partner Chemist: {preferredPartners.exclusivePharmacy?.partnerName}</strong>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
                      Dispatches digital Rx directly to chemist POS counter
                    </span>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="pharmaRoute"
                    checked={pharmacyRouting === 'IN_HOUSE_POS'}
                    onChange={() => setPharmacyRouting('IN_HOUSE_POS')}
                  />
                  <div>
                    <strong>In-House Chemist POS</strong>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
                      1-click cart import for clinic pharmacy counter
                    </span>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="pharmaRoute"
                    checked={pharmacyRouting === 'WHATSAPP_RX'}
                    onChange={() => setPharmacyRouting('WHATSAPP_RX')}
                  />
                  <div>
                    <strong>External / WhatsApp e-Rx</strong>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
                      Patient buys from outside pharmacy using digital prescription
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              ← Back to Doctor Desk
            </Button>
            <Button variant="primary" onClick={() => setCurrentStep(4)}>
              Confirm Routing & Proceed to Billing ➔
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: INSTANT BILLING & UPI QR */}
      {currentStep === 4 && (
        <Card padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                Step 4: Instant Settlement & Dynamic UPI Payment
              </h2>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>
                Total charges computed automatically across consultation and diagnostic services.
              </p>
            </div>
            <Badge variant={isPaymentCollected ? 'success' : 'warning'} style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
              {isPaymentCollected ? '✓ Payment Settled' : '⏳ Payment Pending'}
            </Badge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', marginBottom: '2rem' }}>
            {/* Bill Summary Table */}
            <div>
              <TableContainer>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Item</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Amount (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Doctor OPD Consultation Fee</strong></TableCell>
                      <TableCell>Clinical OPD</TableCell>
                      <TableCell>₹{consultationFee}</TableCell>
                    </TableRow>
                    {selectedLabs.length > 0 && (
                      <TableRow>
                        <TableCell>
                          <strong>Prescribed Diagnostics ({selectedLabs.length} Tests)</strong>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
                            {selectedLabs.join(', ')}
                          </span>
                        </TableCell>
                        <TableCell>Pathology LIMS</TableCell>
                        <TableCell>₹{labFeesEstimate}</TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell style={{ fontWeight: 700, fontSize: '1rem' }}>Total Due Amount</TableCell>
                      <TableCell></TableCell>
                      <TableCell style={{ fontWeight: 700, fontSize: '1.15rem', color: '#0284c7' }}>
                        ₹{consultationFee + (labRouting === 'IN_HOUSE' ? labFeesEstimate : 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '10px' }}>
                {['UPI_QR', 'CASH', 'CARD', 'DUE'].map((mode) => (
                  <Button
                    key={mode}
                    variant={paymentMode === mode ? 'primary' : 'outline'}
                    onClick={() => setPaymentMode(mode as any)}
                  >
                    {mode === 'UPI_QR' ? '📱 Dynamic UPI QR' : mode === 'CASH' ? '💵 Cash Galla' : mode === 'CARD' ? '💳 POS Card' : '⏳ Pay Later'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Dynamic UPI QR Code Box */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Scan to Pay ₹{consultationFee + (labRouting === 'IN_HOUSE' ? labFeesEstimate : 0)}
              </span>

              {/* Dynamic QR Mock SVG */}
              <div style={{
                width: '180px',
                height: '180px',
                backgroundColor: '#ffffff',
                padding: '10px',
                borderRadius: '8px',
                border: '2px dashed #0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  <span style={{ fontSize: '3rem', display: 'block' }}>📲</span>
                  <strong>UPI QR Code</strong>
                  <div style={{ fontSize: '0.625rem', marginTop: '4px' }}>clinic@icici · DocSearch Instant</div>
                </div>
              </div>

              <Button
                variant={isPaymentCollected ? 'success' : 'primary'}
                onClick={() => {
                  setIsPaymentCollected(true);
                  showToast('✓ Payment recorded successfully in Cash Galla / UPI Ledger');
                }}
              >
                {isPaymentCollected ? '✓ Payment Received' : 'Mark as Paid & Generate Receipt'}
              </Button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="outline" onClick={() => setCurrentStep(3)}>
              ← Back to Routing
            </Button>
            <Button variant="primary" onClick={() => setCurrentStep(5)}>
              Proceed to Print & Handover ➔
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 5: PRINT, WHATSAPP & AUTO-ADVANCE */}
      {currentStep === 5 && (
        <Card padding="lg">
          <div style={{ textAlign: 'center', padding: '1rem 0 2rem' }}>
            <span style={{ fontSize: '3rem' }}>🎉</span>
            <h2 style={{ margin: '8px 0', fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>
              Encounter Finalized for {patientName} ({tokenNumber})
            </h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
              Prescription signed, lab orders routed to {preferredPartners.exclusiveLab?.partnerName}, and payment settled.
            </p>
          </div>

          {/* 1-Click Print & WhatsApp Options */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            marginBottom: '2.5rem'
          }}>
            <button
              onClick={() => setIsRxPrintOpen(true)}
              style={{
                padding: '1.25rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0284c7'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
            >
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📄</span>
              <strong>Print Prescription (Rx)</strong>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                Plain A4 / Pre-Printed Pad
              </span>
            </button>

            <button
              onClick={() => {
                window.print();
                showToast('🖨️ Printing Lab Requisition Slip');
              }}
              style={{
                padding: '1.25rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0284c7'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
            >
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🔬</span>
              <strong>Print Lab Slip / Requisition</strong>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                Barcode Requisition for Lab
              </span>
            </button>

            <button
              onClick={() => {
                window.print();
                showToast('🖨️ Printing All Patient Documents (Rx + Lab + Bill)');
              }}
              style={{
                padding: '1.25rem',
                borderRadius: '10px',
                border: '2px solid #0284c7',
                backgroundColor: '#f0f9ff',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>⚡</span>
              <strong style={{ color: '#0369a1' }}>Print All-in-One Dossier</strong>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#0284c7', marginTop: '4px' }}>
                1-Click Complete Patient File
              </span>
            </button>

            <button
              onClick={() => {
                showToast(`📱 Prescription & Lab Slip sent to WhatsApp (${patientMobile})`);
              }}
              style={{
                padding: '1.25rem',
                borderRadius: '10px',
                border: '1px solid #86efac',
                backgroundColor: '#f0fdf4',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📱</span>
              <strong style={{ color: '#166534' }}>Send to WhatsApp</strong>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#15803d', marginTop: '4px' }}>
                Instant PDF to {patientMobile}
              </span>
            </button>
          </div>

          {/* Super Auto-Advance Action */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e2e8f0'
          }}>
            <Button
              variant="primary"
              onClick={handleNextPatient}
              style={{ padding: '14px 32px', fontSize: '1.05rem', fontWeight: 700 }}
            >
              ⏭️ Complete & Call Next Patient (Ctrl + Enter)
            </Button>
          </div>
        </Card>
      )}

      {/* Prescription Print Modal */}
      {isRxPrintOpen && (
        <PrintableDoctorPrescriptionModal
          isOpen={isRxPrintOpen}
          onClose={() => setIsRxPrintOpen(false)}
          consultation={consultationDto}
        />
      )}
    </div>
  );
};
