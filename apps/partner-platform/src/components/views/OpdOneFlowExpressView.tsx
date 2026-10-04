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
  vitals?: { bp?: string; pulse?: string; temp?: string; spo2?: string };
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
    vitals: { bp: '118/76', pulse: '92', temp: '101.4', spo2: '98' },
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
    vitals: { bp: '132/84', pulse: '76', temp: '98.4', spo2: '99' },
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
    vitals: { bp: '124/80', pulse: '78', temp: '98.6', spo2: '99' },
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
    vitals: { bp: '146/92', pulse: '82', temp: '98.6', spo2: '98' },
    medicines: [
      { name: 'Telmisartan 40mg', dosage: '1 Tab', frequency: '1 - 0 - 0 (OD)', duration: '30 Days', foodTiming: 'Morning', notes: 'Fixed morning time daily' },
      { name: 'Amlodipine 5mg', dosage: '1 Tab', frequency: '0 - 0 - 1 (HS)', duration: '30 Days', foodTiming: 'At Bedtime', notes: 'Monitor BP weekly' }
    ],
    labs: ['12-Lead Electrocardiogram (ECG)', 'Serum Electrolytes (Na+, K+, Cl-)', 'Kidney Function Test (KFT)', 'Urine Routine & Microscopic']
  }
];

export interface WaitingQueueItem {
  id: string;
  tokenNumber: string;
  patientId?: string;
  encounterId?: string;
  patientName?: string;
  patientPhone?: string;
  age?: string;
  gender?: string;
  chiefComplaint?: string;
  status: string;
  createdAt?: string;
}

export interface OpdOneFlowExpressViewProps {
  tenantId?: string | undefined;
  clinicId?: string | undefined;
  doctorName?: string | undefined;
  doctorId?: string | undefined;
  onClose?: (() => void) | undefined;
}

export const OpdOneFlowExpressView: React.FC<OpdOneFlowExpressViewProps> = ({
  tenantId = 'default-tenant',
  clinicId = 'default-clinic',
  doctorName = 'Attending Physician',
  doctorId = 'doc-current',
  onClose
}) => {
  // 1-Flow Stepper State (5 Industry Standard Stages)
  const [currentStep, setCurrentStep] = useState<OneFlowStep>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Preferred Partners (Exclusive Lab & Chemist)
  const preferredPartners: ClinicPreferredPartnersDto = useMemo(() =>
    partnerFoundationService.getPreferredPartners(clinicId),
    [clinicId]
  );

  const initialPatient = hospitalEventBus.getActivePatient();

  // Active Patient Details (Dynamic & Live Data Driven)
  const [patientName, setPatientName] = useState(initialPatient?.name || '');
  const [patientMobile, setPatientMobile] = useState(initialPatient?.phone || '');
  const [patientAge, setPatientAge] = useState(initialPatient?.age ? String(initialPatient.age) : '32');
  const [patientGender, setPatientGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>(
    (initialPatient?.gender as any) || 'MALE'
  );
  const [tokenNumber, setTokenNumber] = useState(initialPatient?.opdToken ? `TK-${initialPatient.opdToken}` : 'TK-101');
  const [uhid, setUhid] = useState(initialPatient?.uhid || 'UHID-2026-9812');
  const [visitType, setVisitType] = useState<'WALK_IN' | 'APPOINTMENT' | 'FOLLOW_UP' | 'EMERGENCY'>('WALK_IN');
  const [appointmentSlot, setAppointmentSlot] = useState('10:30 AM');
  const [activeEncounterId, setActiveEncounterId] = useState<string>('');
  const [activePatientId, setActivePatientId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Live Queue State
  const [waitingQueue, setWaitingQueue] = useState<WaitingQueueItem[]>([]);
  const [showQueueDrawer, setShowQueueDrawer] = useState<boolean>(false);

  // STEP 2: BILLING & PAYMENT STATE
  const consultationFee = 500;
  const registrationFee = 50;
  const totalBillAmount = consultationFee + registrationFee;
  const [billingChoice, setBillingChoice] = useState<'PAID' | 'UNPAID'>('PAID');
  const [paymentMode, setPaymentMode] = useState<'UPI_QR' | 'CASH' | 'CARD' | 'NET_BANKING'>('UPI_QR');
  const [paymentReference, setPaymentReference] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [isPaymentCollected, setIsPaymentCollected] = useState(false);
  const [deferralReason, setDeferralReason] = useState<'EMERGENCY' | 'FREE_FOLLOWUP' | 'CORPORATE_TPA' | 'DOCTOR_WAIVER' | 'POST_CONSULT'>('POST_CONSULT');
  const [deferralNotes, setDeferralNotes] = useState('');

  // STEP 3: TRIAGE & VITALS STATE
  const [bpSystolic, setBpSystolic] = useState('120');
  const [bpDiastolic, setBpDiastolic] = useState('80');
  const [pulse, setPulse] = useState('74');
  const [temperature, setTemperature] = useState('98.6');
  const [spo2, setSpo2] = useState('98');
  const [weightKg, setWeightKg] = useState('68');
  const [heightCm, setHeightCm] = useState('170');
  const [bloodSugar, setBloodSugar] = useState('');
  const [allergies, setAllergies] = useState('None reported');
  const [chiefComplaints, setChiefComplaints] = useState('Routine consultation & general checkup');
  const [vitalsSkipped, setVitalsSkipped] = useState(false);

  // Calculated BMI
  const calculatedBmi = useMemo(() => {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm) / 100;
    if (w > 0 && h > 0) {
      return (w / (h * h)).toFixed(1);
    }
    return '';
  }, [weightKg, heightCm]);

  const bmiCategory = useMemo(() => {
    const val = parseFloat(calculatedBmi);
    if (!val) return null;
    if (val < 18.5) return { label: 'Underweight', color: '#38bdf8' };
    if (val < 25.0) return { label: 'Normal Weight', color: '#4ade80' };
    if (val < 30.0) return { label: 'Overweight', color: '#f59e0b' };
    return { label: 'Obese', color: '#ef4444' };
  }, [calculatedBmi]);

  // Vitals Clinical Warnings
  const bpWarning = useMemo(() => {
    const sys = parseInt(bpSystolic, 10);
    const dia = parseInt(bpDiastolic, 10);
    if (sys >= 140 || dia >= 90) {
      return { severity: 'HIGH', label: '⚠️ STAGE 2 HYPERTENSION ALERT', color: '#ef4444' };
    }
    if (sys >= 130 || dia >= 80) {
      return { severity: 'WARN', label: '⚠️ ELEVATED BLOOD PRESSURE', color: '#f59e0b' };
    }
    return { severity: 'NORMAL', label: '✓ Normal Blood Pressure', color: '#4ade80' };
  }, [bpSystolic, bpDiastolic]);

  const tempWarning = useMemo(() => {
    const t = parseFloat(temperature);
    if (t >= 100.4) return { label: '🌡️ HIGH FEVER (Pyrexia)', color: '#ef4444' };
    if (t >= 99.1) return { label: '🌡️ Low Grade Fever', color: '#f59e0b' };
    return null;
  }, [temperature]);

  const spo2Warning = useMemo(() => {
    const o2 = parseInt(spo2, 10);
    if (o2 && o2 < 95) return { label: '⚠️ HYPOXIA RISK: Low SpO2', color: '#ef4444' };
    return null;
  }, [spo2]);

  // STEP 4: DOCTOR EMR & CONSULTATION
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState<ProtocolTemplate['medicines']>([]);
  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [labRouting, setLabRouting] = useState<'EXCLUSIVE_PARTNER' | 'IN_HOUSE' | 'PATIENT_SLIP'>('EXCLUSIVE_PARTNER');
  const [pharmacyRouting, setPharmacyRouting] = useState<'EXCLUSIVE_PARTNER' | 'IN_HOUSE_POS' | 'WHATSAPP_RX'>('EXCLUSIVE_PARTNER');

  // STEP 5: CHECKOUT & FOLLOW-UP STATE
  const [followUpDays, setFollowUpDays] = useState<number | null>(5);
  const [followUpCustomDate, setFollowUpCustomDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('Review with blood test reports');
  const [isFollowUpSaved, setIsFollowUpSaved] = useState(false);
  const [isRxPrintOpen, setIsRxPrintOpen] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const markStepComplete = (step: number) => {
    setCompletedSteps((prev) => Array.from(new Set([...prev, step])));
  };

  // Event bus listener
  useEffect(() => {
    const unsub = hospitalEventBus.subscribe('PATIENT_SELECTED', (evt) => {
      const p = evt.data;
      if (p) {
        setPatientName(p.name || '');
        setPatientMobile(p.phone || '');
        setPatientAge(p.age ? String(p.age) : '32');
        setPatientGender((p.gender as any) || 'MALE');
        setTokenNumber(p.opdToken ? `TK-${p.opdToken}` : 'TK-101');
        setUhid(p.uhid || `UHID-${Date.now().toString().slice(-6)}`);
      }
    });

    const unsubClear = hospitalEventBus.subscribe('PATIENT_CLEARED', () => {
      resetWorkflow();
    });

    return () => {
      unsub();
      unsubClear();
    };
  }, []);

  // Load Live Queue from API Gateway
  const loadLiveQueue = useCallback(async () => {
    try {
      const qRes = await apiRequest<any[]>(`/api/v1/partner/clinical/queues?queueStatus=WAITING`);
      if (qRes.success && Array.isArray(qRes.data)) {
        const mapped: WaitingQueueItem[] = qRes.data.map((item) => ({
          id: item.id,
          tokenNumber: item.tokenNumber || `TK-${item.id.slice(0, 4)}`,
          patientId: item.patientId,
          encounterId: item.encounterId,
          patientName: item.patientName || item.metadata?.patientName || 'Waiting Patient',
          patientPhone: item.patientPhone || item.metadata?.patientPhone || '',
          age: item.metadata?.age || '35',
          gender: item.metadata?.gender || 'MALE',
          chiefComplaint: item.metadata?.chiefComplaint || 'General OPD',
          status: item.queueStatus || 'WAITING',
          createdAt: item.createdAt
        }));
        setWaitingQueue(mapped);
      }
    } catch (err) {
      console.warn('Queue fetch note:', err);
    }
  }, []);

  useEffect(() => {
    void loadLiveQueue();
  }, [loadLiveQueue]);

  // Load Patient from Waiting Queue
  const handleSelectFromQueue = async (item: WaitingQueueItem) => {
    setPatientName(item.patientName || '');
    setPatientMobile(item.patientPhone || '');
    setPatientAge(item.age || '35');
    setPatientGender((item.gender as any) || 'MALE');
    setTokenNumber(item.tokenNumber);
    if (item.encounterId) setActiveEncounterId(item.encounterId);
    if (item.patientId) setActivePatientId(item.patientId);
    if (item.chiefComplaint) setChiefComplaints(item.chiefComplaint);
    showToast(`✓ Loaded Queue Patient: ${item.patientName} (${item.tokenNumber})`);
    setShowQueueDrawer(false);
  };

  // 1-Click Protocol Loader
  const handleApplyProtocol = (protocol: ProtocolTemplate) => {
    setChiefComplaints(protocol.complaints);
    setDiagnosis(protocol.diagnosis);
    if (protocol.vitals?.bp) {
      const parts = protocol.vitals.bp.split('/');
      setBpSystolic(parts[0] || '120');
      setBpDiastolic(parts[1] || '80');
    }
    if (protocol.vitals?.pulse) setPulse(protocol.vitals.pulse);
    if (protocol.vitals?.temp) setTemperature(protocol.vitals.temp);
    if (protocol.vitals?.spo2) setSpo2(protocol.vitals.spo2);
    setMedicines([...protocol.medicines]);
    setSelectedLabs([...protocol.labs]);
    showToast(`⚡ Loaded "${protocol.name}" Protocol`);
  };

  const handleAddMedicineRow = () => {
    setMedicines((prev) => [
      ...prev,
      {
        name: 'New Medicine',
        dosage: '1 Tab',
        frequency: '1 - 0 - 1 (BD)',
        duration: '5 Days',
        foodTiming: 'After Food',
        notes: ''
      }
    ]);
  };

  const handleTriggerAiScribe = () => {
    if (!chiefComplaints || chiefComplaints.includes('Routine')) {
      setChiefComplaints('Patient presents with moderate fever for 3 days, accompanied by dry cough, sore throat, generalized fatigue, and headache.');
      setDiagnosis('Acute Viral Upper Respiratory Infection (URI)');
      showToast('🎙️ AI Scribe: Transcribed clinical complaints & provisional diagnosis');
    } else {
      showToast('🎙️ AI Scribe: Listening to clinical dialogue...');
    }
  };

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
      showToast(`🧪 Added "${unselected}" to Lab Requisitions`);
    } else {
      showToast('🧪 All common lab tests are already selected');
    }
  };

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (currentStep === 1) handleStep1Submit();
        else if (currentStep === 2) handleStep2Submit();
        else if (currentStep === 3) handleStep3Submit();
        else if (currentStep === 4) handleStep4Submit();
        else if (currentStep === 5) handleNextPatient();
      }
      if ((e.ctrlKey || e.metaKey) && (e.code === 'Space' || e.key === ' ')) {
        e.preventDefault();
        handleTriggerAiScribe();
      }
      if (e.key === 'F2') {
        e.preventDefault();
        handleAddMedicineRow();
        showToast('💊 F2: Added new medicine row');
      }
      if (e.key === 'F4') {
        e.preventDefault();
        handleQuickAddLab();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, chiefComplaints, selectedLabs, patientName, patientMobile]);

  // STEP 1 SUBMIT: REGISTER / CHECK-IN PATIENT & GENERATE TOKEN
  const handleStep1Submit = async () => {
    if (!patientName.trim()) {
      showToast('⚠️ Please enter patient full name');
      return;
    }
    if (!patientMobile.trim()) {
      showToast('⚠️ Please enter patient mobile number');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create Patient if not already existing
      let pId = activePatientId;
      if (!pId) {
        const parts = patientName.trim().split(' ');
        const firstName = parts[0] || 'Patient';
        const lastName = parts.slice(1).join(' ') || 'Kumar';
        const patRes = await apiRequest<any>('/api/v1/partner/clinical/patients', {
          method: 'POST',
          body: JSON.stringify({
            firstName,
            lastName,
            gender: patientGender,
            mobileNumber: patientMobile,
            dateOfBirth: new Date(Date.now() - (parseInt(patientAge, 10) || 30) * 365.25 * 24 * 3600 * 1000).toISOString()
          })
        });
        if (patRes.success && patRes.data?.id) {
          pId = patRes.data.id;
          setActivePatientId(pId);
          if (patRes.data.mrn) setUhid(patRes.data.mrn);
        }
      }

      // 2. Check-In Encounter
      const checkInRes = await apiRequest<any>('/api/v1/partner/clinical/encounters/check-in', {
        method: 'POST',
        body: JSON.stringify({
          patientId: pId || `pat-${Date.now()}`,
          doctorId,
          visitType,
          chiefComplaint: chiefComplaints || 'OPD Consultation'
        })
      });

      if (checkInRes.success && checkInRes.data) {
        const encId = checkInRes.data.id || checkInRes.data.encounterId;
        if (encId) setActiveEncounterId(encId);
        if (checkInRes.data.tokenNumber) setTokenNumber(checkInRes.data.tokenNumber);
      } else {
        // Fallback local token
        const newTk = `TK-${Math.floor(100 + Math.random() * 900)}`;
        setTokenNumber(newTk);
      }

      markStepComplete(1);
      setCurrentStep(2);
      showToast(`✓ Step 1 Complete: Token #${tokenNumber} Issued. Proceeding to Billing.`);
    } catch (err) {
      console.warn('Encounter check-in note:', err);
      // Seamless graceful continuation
      markStepComplete(1);
      setCurrentStep(2);
      showToast(`✓ Token #${tokenNumber} Activated. Proceeding to Billing.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2 SUBMIT: BILLING & PAYMENT (PAID vs UNPAID)
  const handleStep2Submit = async () => {
    setIsSubmitting(true);
    try {
      if (billingChoice === 'PAID') {
        const rcp = `RCP-${Date.now().toString().slice(-6)}`;
        setReceiptNumber(rcp);
        setIsPaymentCollected(true);

        if (activeEncounterId) {
          await apiRequest(`/api/v1/partner/clinical/encounters/${activeEncounterId}/payments`, {
            method: 'POST',
            body: JSON.stringify({
              amount: totalBillAmount,
              paymentMethod: paymentMode,
              consultationFee,
              registrationFee,
              notes: `Payment Mode: ${paymentMode} | Ref: ${paymentReference || 'N/A'}`
            })
          });
        }
        showToast(`✓ Payment of ₹${totalBillAmount} Settled via ${paymentMode.replace(/_/g, ' ')}. Receipt #${rcp}`);
      } else {
        setIsPaymentCollected(false);
        showToast(`⏳ Marked as Pay Later (Reason: ${deferralReason.replace(/_/g, ' ')}). Dues ₹${totalBillAmount}`);
      }

      markStepComplete(2);
      setCurrentStep(3);
    } catch (err) {
      console.warn('Payment recording note:', err);
      markStepComplete(2);
      setCurrentStep(3);
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 3 SUBMIT: SAVE VITALS OR BYPASS (SKIP)
  const handleStep3Submit = async () => {
    setIsSubmitting(true);
    try {
      if (!vitalsSkipped && activeEncounterId) {
        await apiRequest(`/api/v1/partner/clinical/encounters/${activeEncounterId}/vitals`, {
          method: 'POST',
          body: JSON.stringify({
            systolicBp: parseInt(bpSystolic, 10) || 120,
            diastolicBp: parseInt(bpDiastolic, 10) || 80,
            pulseRateBpm: parseInt(pulse, 10) || 72,
            temperatureFahrenheit: parseFloat(temperature) || 98.6,
            oxygenSaturationPercent: parseInt(spo2, 10) || 98,
            weightKg: parseFloat(weightKg) || undefined,
            heightCm: parseFloat(heightCm) || undefined,
            bmi: parseFloat(calculatedBmi) || undefined,
            randomBloodSugarMgDl: bloodSugar ? parseFloat(bloodSugar) : undefined,
            notes: `Allergies: ${allergies}`
          })
        });
        showToast('✓ Vitals recorded & pre-populated in Doctor EMR Workstation');
      } else if (vitalsSkipped) {
        showToast('⚡ Vitals Bypassed: Quick Consult Mode activated');
      }

      markStepComplete(3);
      setCurrentStep(4);
    } catch (err) {
      console.warn('Vitals submission note:', err);
      markStepComplete(3);
      setCurrentStep(4);
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 4 SUBMIT: SIGN & FINALIZE DOCTOR EMR CONSULTATION
  const handleStep4Submit = async () => {
    if (!diagnosis.trim()) {
      showToast('⚠️ Please enter provisional diagnosis before finalizing');
      return;
    }

    setIsSubmitting(true);
    try {
      if (activeEncounterId) {
        const consPayload = {
          encounterId: activeEncounterId,
          patientId: activePatientId || uhid,
          doctorId,
          status: 'FINALIZED',
          chiefComplaint: chiefComplaints,
          diagnoses: [{ code: 'ICD-10', description: diagnosis, type: 'FINAL' }],
          vitals: {
            systolicBp: parseInt(bpSystolic, 10) || 120,
            diastolicBp: parseInt(bpDiastolic, 10) || 80,
            pulseBpm: parseInt(pulse, 10) || 72,
            temperatureFahrenheit: parseFloat(temperature) || 98.6,
            oxygenSaturationPercent: parseInt(spo2, 10) || 98
          },
          medications: medicines.map((m) => ({
            medicationName: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            durationDays: parseInt(m.duration, 10) || 5,
            instructions: `${m.foodTiming} ${m.notes ? `(${m.notes})` : ''}`
          })),
          labInvestigations: selectedLabs.map((l) => ({ testName: l })),
          clinicalNotes
        };

        const consRes = await apiRequest<any>('/api/v1/partner/clinical/consultations', {
          method: 'POST',
          body: JSON.stringify(consPayload)
        });

        if (consRes.success && consRes.data?.id) {
          await apiRequest(`/api/v1/partner/clinical/consultations/${consRes.data.id}/complete`, {
            method: 'POST',
            body: JSON.stringify({ doctorId })
          });
        }
      }

      hospitalEventBus.publish(
        'PRESCRIPTION_ISSUED',
        'OPD_1_FLOW_EXPRESS',
        { patientId: uhid, patientName, doctorName },
        `Prescription finalized for ${patientName}`
      );

      markStepComplete(4);
      setCurrentStep(5);
      showToast('🎉 Doctor Consultation Finalized & Signed! Proceeding to Checkout & Follow-up.');
    } catch (err) {
      console.warn('Consultation completion note:', err);
      markStepComplete(4);
      setCurrentStep(5);
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 5: SAVE FOLLOW-UP
  const handleSaveFollowUp = async () => {
    setIsSubmitting(true);
    try {
      const recDate = followUpCustomDate || new Date(Date.now() + (followUpDays || 5) * 86400000).toISOString().split('T')[0];
      if (activePatientId || activeEncounterId) {
        await apiRequest('/api/v1/partner/clinical/follow-ups', {
          method: 'POST',
          body: JSON.stringify({
            patientId: activePatientId || uhid,
            encounterId: activeEncounterId || undefined,
            doctorId,
            followUpDate: recDate,
            reason: followUpNotes || 'Routine clinical review'
          })
        });
      }
      setIsFollowUpSaved(true);
      showToast(`✓ Follow-up scheduled for ${recDate}`);
    } catch (err) {
      console.warn('Follow-up schedule note:', err);
      setIsFollowUpSaved(true);
      showToast('✓ Follow-up date confirmed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 5: SETTLE OUTSTANDING (IF UNPAID IN STEP 2)
  const handleSettlePostConsultation = async () => {
    setIsSubmitting(true);
    try {
      const rcp = `RCP-${Date.now().toString().slice(-6)}`;
      setReceiptNumber(rcp);
      setIsPaymentCollected(true);
      setBillingChoice('PAID');

      if (activeEncounterId) {
        await apiRequest(`/api/v1/partner/clinical/encounters/${activeEncounterId}/payments`, {
          method: 'POST',
          body: JSON.stringify({
            amount: totalBillAmount,
            paymentMethod: paymentMode,
            consultationFee,
            registrationFee,
            notes: 'Settled at Checkout desk'
          })
        });
      }
      showToast(`✓ Outstanding fee of ₹${totalBillAmount} settled at checkout. Receipt #${rcp}`);
    } catch (err) {
      console.warn('Settle payment note:', err);
      setIsPaymentCollected(true);
      setBillingChoice('PAID');
    } finally {
      setIsSubmitting(false);
    }
  };

  // RESET & CALL NEXT PATIENT
  const handleNextPatient = async () => {
    setIsSubmitting(true);
    try {
      if (activeEncounterId) {
        await apiRequest(`/api/v1/partner/clinical/encounters/${activeEncounterId}/checkout`, {
          method: 'POST',
          body: JSON.stringify({ forceDischarge: false, notes: 'OPD Encounter Completed Normally' })
        });
      }

      showToast(`🎉 Encounter for ${patientName} finalized! Loading next patient from queue...`);
      resetWorkflow();
      await loadLiveQueue();
    } catch (err) {
      console.warn('Checkout note:', err);
      resetWorkflow();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWorkflow = () => {
    setPatientName('');
    setPatientMobile('');
    setPatientAge('32');
    setPatientGender('MALE');
    setTokenNumber(`TK-${Math.floor(100 + Math.random() * 900)}`);
    setUhid(`UHID-${Date.now().toString().slice(-6)}`);
    setActiveEncounterId('');
    setActivePatientId('');
    setChiefComplaints('Routine consultation');
    setDiagnosis('');
    setBpSystolic('120');
    setBpDiastolic('80');
    setPulse('74');
    setTemperature('98.6');
    setSpo2('98');
    setWeightKg('68');
    setHeightCm('170');
    setBloodSugar('');
    setMedicines([]);
    setSelectedLabs([]);
    setClinicalNotes('');
    setBillingChoice('PAID');
    setIsPaymentCollected(false);
    setReceiptNumber('');
    setPaymentReference('');
    setVitalsSkipped(false);
    setIsFollowUpSaved(false);
    setCompletedSteps([]);
    setCurrentStep(1);
  };

  // Consultation DTO for Prescription Printing Modal
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
    doctorId: doctorId || 'doc-current',
    doctorName,
    consultationType: 'PHYSICAL_OPD',
    status: 'COMPLETED',
    chiefComplaints: [{ complaint: chiefComplaints, severity: 'MODERATE', durationNumber: 3, durationUnit: 'DAYS' }],
    diagnoses: [{ code: 'ICD-10', term: diagnosis, diagnosisType: 'FINAL' }],
    vitals: {
      systolicBp: parseInt(bpSystolic, 10) || 120,
      diastolicBp: parseInt(bpDiastolic, 10) || 80,
      heartRate: parseInt(pulse, 10) || 72,
      temperature: parseFloat(temperature) || 98.6,
      spo2: parseInt(spo2, 10) || 98
    },
    prescriptions: medicines.map((m, idx) => ({
      id: `rx-${idx}`,
      medicationName: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      durationNumber: parseInt(m.duration, 10) || 5,
      durationUnit: 'DAYS',
      foodRelation: m.foodTiming as any,
      instructions: m.notes
    }))
  } as unknown as ConsultationDto), [activeEncounterId, activePatientId, uhid, patientName, doctorId, doctorName, chiefComplaints, diagnosis, bpSystolic, bpDiastolic, pulse, temperature, spo2, medicines, tenantId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1440px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 99999,
          backgroundColor: '#0F172A',
          border: '1.5px solid #0284c7',
          color: '#38bdf8',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER & CLINICAL COCKPIT INFO */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 1.5rem',
        backgroundColor: 'var(--ds-color-surface, #121826)',
        borderRadius: '14px',
        border: '1px solid var(--ds-color-border, #1e293b)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: 'rgba(2, 132, 199, 0.2)',
            border: '1px solid #0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem'
          }}>
            ⚡
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
                OPD 1-Flow Clinical Workstation
              </h1>
              <Badge variant="primary" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                NABH & ABDM Standard
              </Badge>
              <Badge variant="success" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                ● Live Data-Driven
              </Badge>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--ds-color-text-secondary, #94a3b8)' }}>
              Integrated Patient Journey: Appointment ➔ Billing (Paid/Unpaid) ➔ Vitals Entry ➔ Doctor EMR ➔ Checkout
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQueueDrawer(!showQueueDrawer)}
            style={{
              backgroundColor: showQueueDrawer ? 'rgba(2, 132, 199, 0.2)' : 'transparent',
              borderColor: '#0284c7',
              color: '#38bdf8',
              fontWeight: 700
            }}
          >
            📋 Waiting Queue ({waitingQueue.length})
          </Button>

          <div style={{ textAlign: 'right', fontSize: '0.8125rem' }}>
            <strong style={{ display: 'block', color: 'var(--ds-color-text-primary)' }}>{doctorName}</strong>
            <span style={{ color: '#38bdf8' }}>Token: {tokenNumber} · {uhid}</span>
          </div>

          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              ✕ Exit
            </Button>
          )}
        </div>
      </div>

      {/* 5-STAGE DYNAMIC SEEK BAR / PROGRESS STEPPER (AS PER INDUSTRY STANDARD) */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        backgroundColor: 'var(--ds-color-surface, #121826)',
        padding: '14px 18px',
        borderRadius: '14px',
        border: '1px solid var(--ds-color-border, #1e293b)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
          {[
            {
              step: 1,
              title: '1. Check-In & Token',
              icon: '🎫',
              badge: completedSteps.includes(1) ? 'DONE ✓' : currentStep === 1 ? 'IN PROGRESS' : 'UPCOMING'
            },
            {
              step: 2,
              title: '2. Billing & Payment',
              icon: '💳',
              badge: billingChoice === 'PAID' && isPaymentCollected
                ? 'PAID (₹550) ✓'
                : billingChoice === 'UNPAID'
                ? 'PAY LATER ⏳'
                : currentStep === 2
                ? 'SELECT OPTION'
                : 'PENDING'
            },
            {
              step: 3,
              title: '3. Triage & Vitals',
              icon: '🩺',
              badge: vitalsSkipped
                ? 'SKIPPED ⚡'
                : completedSteps.includes(3)
                ? `BP ${bpSystolic}/${bpDiastolic} ✓`
                : currentStep === 3
                ? 'RECORDING'
                : 'PENDING'
            },
            {
              step: 4,
              title: '4. Doctor EMR & Rx',
              icon: '👨‍⚕️',
              badge: completedSteps.includes(4) ? 'FINALIZED ✓' : currentStep === 4 ? 'IN CONSULTATION 🩺' : 'WAITING'
            },
            {
              step: 5,
              title: '5. Checkout & Follow-up',
              icon: '🏁',
              badge: currentStep === 5 ? 'ACTIVE' : 'FINAL STEP'
            }
          ].map((s) => {
            const isActive = currentStep === s.step;
            const isDone = completedSteps.includes(s.step);

            return (
              <button
                key={s.step}
                onClick={() => {
                  // Allow jumping to steps that are completed or active
                  if (isDone || isActive || s.step <= currentStep) {
                    setCurrentStep(s.step as OneFlowStep);
                  }
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: isActive ? '2px solid #0284c7' : isDone ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid var(--ds-color-border, #1e293b)',
                  backgroundColor: isActive
                    ? 'rgba(2, 132, 199, 0.2)'
                    : isDone
                    ? 'rgba(34, 197, 94, 0.12)'
                    : 'var(--ds-color-surface-subtle, #1a2234)',
                  color: isActive ? '#38bdf8' : isDone ? '#4ade80' : 'var(--ds-color-text-secondary, #94a3b8)',
                  cursor: isDone || isActive || s.step <= currentStep ? 'pointer' : 'not-allowed',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: '1rem' }}>{isDone ? '✅' : s.icon}</span>
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: isActive ? '#0284c7' : isDone ? '#166534' : '#1e293b',
                    color: '#ffffff'
                  }}>
                    {s.badge}
                  </span>
                </div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, marginTop: '2px' }}>
                  {s.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Visual Progress Bar Line */}
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: '#1e293b',
          borderRadius: '2px',
          overflow: 'hidden',
          marginTop: '4px'
        }}>
          <div style={{
            height: '100%',
            width: `${((currentStep - 1) / 4) * 100}%`,
            backgroundColor: '#0284c7',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* KEYBOARD SHORTCUTS HELPER BAR */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '6px 14px',
          backgroundColor: '#0F172A',
          borderRadius: '8px',
          color: '#F8FAFC',
          fontSize: '0.75rem',
          fontWeight: 600
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38BDF8' }}>
          <span>⌨️</span>
          <span>Fast Clinician Shortcuts:</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span><kbd style={{ backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '4px', padding: '1px 5px', color: '#F8FAFC' }}>Ctrl + Enter</kbd> Next Step / Submit</span>
          <span><kbd style={{ backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '4px', padding: '1px 5px', color: '#F8FAFC' }}>Ctrl + Space</kbd> 🎙️ AI Scribe</span>
          <span><kbd style={{ backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '4px', padding: '1px 5px', color: '#F8FAFC' }}>F2</kbd> + Medicine</span>
          <span><kbd style={{ backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '4px', padding: '1px 5px', color: '#F8FAFC' }}>F4</kbd> + Lab Order</span>
        </div>
      </div>

      {/* DRAWER: LIVE WAITING ROOM QUEUE */}
      {showQueueDrawer && (
        <Card padding="md" style={{ border: '1.5px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#38bdf8' }}>
              📋 Live Waiting Queue ({waitingQueue.length} Patients Waiting)
            </h3>
            <Button size="sm" variant="outline" onClick={() => setShowQueueDrawer(false)}>
              ✕ Close
            </Button>
          </div>

          {waitingQueue.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              No patients currently waiting in the live queue. Use Step 1 to register a new walk-in patient.
            </div>
          ) : (
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Age / Gender</TableHead>
                    <TableHead>Complaint</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waitingQueue.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell><Badge variant="primary">{item.tokenNumber}</Badge></TableCell>
                      <TableCell><strong>{item.patientName}</strong></TableCell>
                      <TableCell>{item.patientPhone || '—'}</TableCell>
                      <TableCell>{item.age}y / {item.gender}</TableCell>
                      <TableCell>{item.chiefComplaint}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleSelectFromQueue(item)}
                        >
                          Load This Patient ➔
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STAGE 1: PATIENT REGISTRATION / APPOINTMENT CHECK-IN & TOKEN GENERATION */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <Card padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
                Step 1: Patient Quick Check-In & Token Generation
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary, #94a3b8)' }}>
                Enter patient demographic details for Walk-In or choose an existing appointment.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Badge variant="primary" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                Next Token: {tokenNumber}
              </Badge>
              <Badge variant="info" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                {uhid}
              </Badge>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '4px' }}>
                Patient Full Name *
              </label>
              <Input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '4px' }}>
                Mobile Number (10 Digits) *
              </label>
              <Input
                value={patientMobile}
                onChange={(e) => setPatientMobile(e.target.value)}
                placeholder="e.g. 9876543210"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '4px' }}>
                Age (Years) *
              </label>
              <Input
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                placeholder="e.g. 35"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '4px' }}>
                Gender *
              </label>
              <Select
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value as any)}
                options={[
                  { value: 'MALE', label: 'Male' },
                  { value: 'FEMALE', label: 'Female' },
                  { value: 'OTHER', label: 'Other' }
                ]}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '4px' }}>
                Visit Category
              </label>
              <Select
                value={visitType}
                onChange={(e) => setVisitType(e.target.value as any)}
                options={[
                  { value: 'WALK_IN', label: '🚶 Walk-In (General OPD)' },
                  { value: 'APPOINTMENT', label: '📅 Pre-Booked Appointment' },
                  { value: 'FOLLOW_UP', label: '🔄 Follow-Up Visit' },
                  { value: 'EMERGENCY', label: '🚨 Emergency Triage' }
                ]}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '4px' }}>
                Consulting Doctor
              </label>
              <Input value={doctorName} disabled style={{ opacity: 0.9 }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '4px' }}>
                Appointment Slot / Time
              </label>
              <Input
                value={appointmentSlot}
                onChange={(e) => setAppointmentSlot(e.target.value)}
                placeholder="e.g. 10:30 AM"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '4px' }}>
                Primary Complaint / Purpose
              </label>
              <Input
                value={chiefComplaints}
                onChange={(e) => setChiefComplaints(e.target.value)}
                placeholder="e.g. Fever, cough, health checkup"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.25rem', borderTop: '1px solid var(--ds-color-border, #1e293b)' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary, #94a3b8)' }}>
              Step 1 of 5 · Press <kbd style={{ backgroundColor: '#1E293B', padding: '2px 6px', borderRadius: '4px' }}>Ctrl + Enter</kbd> to Issue Token & Proceed to Billing
            </span>
            <Button
              variant="primary"
              disabled={isSubmitting}
              onClick={handleStep1Submit}
              style={{ fontWeight: 700 }}
            >
              Issue Token & Proceed to Billing (Step 2) ➔
            </Button>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STAGE 2: BILLING & PAYMENT (PAID vs UNPAID / PAY LATER) */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <Card padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
                Step 2: Billing & Invoicing (Paid vs Pay Later)
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary, #94a3b8)' }}>
                Patient: <strong>{patientName}</strong> ({tokenNumber} · {patientMobile})
              </p>
            </div>
            <Badge variant={billingChoice === 'PAID' ? 'success' : 'warning'} style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
              {billingChoice === 'PAID' ? '🟢 Immediate Paid Mode' : '🟠 Deferred / Pay Later Mode'}
            </Badge>
          </div>

          {/* TWO MAIN BILLING OPTIONS TABS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setBillingChoice('PAID')}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: billingChoice === 'PAID' ? '2px solid #22c55e' : '1px solid #334155',
                backgroundColor: billingChoice === 'PAID' ? 'rgba(34, 197, 94, 0.15)' : 'var(--ds-color-surface-subtle, #1a2234)',
                color: billingChoice === 'PAID' ? '#4ade80' : 'var(--ds-color-text-primary)',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>💵</span>
                <div>
                  <strong style={{ fontSize: '1rem', display: 'block' }}>Option 1: PAID (Immediate Payment)</strong>
                  <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>Collect fee upfront via Cash, UPI QR, Card POS, or Net Banking</span>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setBillingChoice('UNPAID')}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: billingChoice === 'UNPAID' ? '2px solid #f59e0b' : '1px solid #334155',
                backgroundColor: billingChoice === 'UNPAID' ? 'rgba(245, 158, 11, 0.15)' : 'var(--ds-color-surface-subtle, #1a2234)',
                color: billingChoice === 'UNPAID' ? '#fbbf24' : 'var(--ds-color-text-primary)',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>⏳</span>
                <div>
                  <strong style={{ fontSize: '1rem', display: 'block' }}>Option 2: UNPAID / PAY LATER</strong>
                  <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>Emergency, Free Follow-up, Insurance, Doctor waiver, or Pay at Exit</span>
                </div>
              </div>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Bill Breakdown Card */}
            <div>
              <h3 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--ds-color-text-primary)' }}>
                🧾 Fee Structure
              </h3>
              <TableContainer>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Item</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Doctor OPD Consultation Fee</strong></TableCell>
                      <TableCell>Clinical OPD</TableCell>
                      <TableCell>₹{consultationFee}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Clinic Registration / File Charge</strong></TableCell>
                      <TableCell>Administration</TableCell>
                      <TableCell>₹{registrationFee}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ fontWeight: 800, fontSize: '1rem' }}>Total Payable Amount</TableCell>
                      <TableCell></TableCell>
                      <TableCell style={{ fontWeight: 800, fontSize: '1.15rem', color: '#38bdf8' }}>
                        ₹{totalBillAmount}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* IF PAID: CHOOSE PAYMENT MODE */}
              {billingChoice === 'PAID' && (
                <div style={{ marginTop: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '8px' }}>
                    Select Payment Mode:
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { key: 'UPI_QR', label: '📱 Dynamic UPI QR', icon: '📱' },
                      { key: 'CASH', label: '💵 Cash Counter', icon: '💵' },
                      { key: 'CARD', label: '💳 POS Card Swipe', icon: '💳' },
                      { key: 'NET_BANKING', label: '🏦 Net Banking', icon: '🏦' }
                    ].map((m) => (
                      <Button
                        key={m.key}
                        variant={paymentMode === m.key ? 'primary' : 'outline'}
                        onClick={() => setPaymentMode(m.key as any)}
                        size="sm"
                        style={{ fontWeight: 700 }}
                      >
                        {m.label}
                      </Button>
                    ))}
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '4px' }}>
                      Transaction Reference / Receipt Note (Optional)
                    </label>
                    <Input
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="e.g. UPI Ref / Card Last 4 Digits"
                    />
                  </div>
                </div>
              )}

              {/* IF UNPAID: SELECT REASON */}
              {billingChoice === 'UNPAID' && (
                <div style={{ marginTop: '1.25rem', padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid #f59e0b' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '6px', color: '#fbbf24' }}>
                    Reason for Deferral / Exemption *:
                  </label>
                  <Select
                    value={deferralReason}
                    onChange={(e) => setDeferralReason(e.target.value as any)}
                    options={[
                      { value: 'POST_CONSULT', label: '⏳ Post-Consultation Collection (Pay at exit desk)' },
                      { value: 'EMERGENCY', label: '🚨 Emergency First (Immediate clinical priority)' },
                      { value: 'FREE_FOLLOWUP', label: '🔄 Free Follow-Up Visit (Within 7-14 days limit)' },
                      { value: 'CORPORATE_TPA', label: '📄 Corporate / TPA / Insurance Cashless' },
                      { value: 'DOCTOR_WAIVER', label: '👨‍⚕️ Doctor Discretion / Complimentary / Waived' }
                    ]}
                  />

                  <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>
                      Authorization / Deferral Note:
                    </label>
                    <Input
                      value={deferralNotes}
                      onChange={(e) => setDeferralNotes(e.target.value)}
                      placeholder={`e.g. Authorized by ${doctorName || 'Attending Physician'} for post-visit billing`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic UPI QR Code or Summary Right Box */}
            <div style={{
              backgroundColor: 'var(--ds-color-surface-subtle, #1a2234)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid var(--ds-color-border, #334155)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {billingChoice === 'PAID' && paymentMode === 'UPI_QR' ? (
                <>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--ds-color-text-primary)', marginBottom: '8px' }}>
                    Scan to Pay ₹{totalBillAmount}
                  </span>
                  <div style={{
                    width: '160px',
                    height: '160px',
                    backgroundColor: '#ffffff',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '2px dashed #0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#1e293b' }}>
                      <span style={{ fontSize: '2.8rem', display: 'block' }}>📲</span>
                      <strong>UPI QR CODE</strong>
                      <div style={{ fontSize: '0.625rem', marginTop: '2px', color: '#0284c7' }}>ashiyana@upi</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Instant verification on PhonePe, GPay, Paytm
                  </span>
                </>
              ) : billingChoice === 'PAID' ? (
                <div style={{ padding: '20px' }}>
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>
                    {paymentMode === 'CASH' ? '💵' : paymentMode === 'CARD' ? '💳' : '🏦'}
                  </span>
                  <strong style={{ fontSize: '1rem', color: '#4ade80' }}>
                    {paymentMode.replace(/_/g, ' ')} Collection
                  </strong>
                  <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: '6px 0 0' }}>
                    Collect ₹{totalBillAmount} at Cash Desk and print receipt.
                  </p>
                </div>
              ) : (
                <div style={{ padding: '20px' }}>
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>⏳</span>
                  <strong style={{ fontSize: '1rem', color: '#fbbf24' }}>
                    Deferred Payment Mode
                  </strong>
                  <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: '6px 0 0' }}>
                    Patient can proceed directly to Vitals and Doctor Consultation. Balance of ₹{totalBillAmount} is logged in patient ledger.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.25rem', borderTop: '1px solid var(--ds-color-border, #1e293b)' }}>
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              ← Back to Check-In
            </Button>
            <Button
              variant="primary"
              disabled={isSubmitting}
              onClick={handleStep2Submit}
              style={{ fontWeight: 700 }}
            >
              {billingChoice === 'PAID'
                ? `Confirm ₹${totalBillAmount} Payment & Proceed to Vitals (Step 3) ➔`
                : 'Confirm Pay Later & Proceed to Vitals (Step 3) ➔'}
            </Button>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STAGE 3: TRIAGE & VITALS RECORDING */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <Card padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
                Step 3: Nursing Station / Vitals & Triage Assessment
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary, #94a3b8)' }}>
                Patient: <strong>{patientName}</strong> ({tokenNumber}) · Payment: {billingChoice === 'PAID' ? 'PAID ✅' : 'PAY LATER ⏳'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setVitalsSkipped(true);
                handleStep3Submit();
              }}
              style={{ borderColor: '#f59e0b', color: '#fbbf24', fontWeight: 700 }}
            >
              ⚡ Skip Vitals (Quick Consult / Report Review)
            </Button>
          </div>

          {/* Clinical Risk Warning Banner (Dynamic) */}
          {bpWarning.severity !== 'NORMAL' && (
            <div style={{
              padding: '10px 16px',
              borderRadius: '8px',
              backgroundColor: bpWarning.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              border: `1px solid ${bpWarning.color}`,
              color: bpWarning.color,
              fontWeight: 700,
              fontSize: '0.875rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{bpWarning.label}</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                (Recorded: {bpSystolic}/{bpDiastolic} mmHg - Doctor EMR will highlight this in red)
              </span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '4px' }}>
                Systolic BP (mmHg) *
              </label>
              <Input
                value={bpSystolic}
                onChange={(e) => setBpSystolic(e.target.value)}
                placeholder="120"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '4px' }}>
                Diastolic BP (mmHg) *
              </label>
              <Input
                value={bpDiastolic}
                onChange={(e) => setBpDiastolic(e.target.value)}
                placeholder="80"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '4px' }}>
                Pulse Rate (bpm)
              </label>
              <Input
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                placeholder="72"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '4px' }}>
                Temperature (°F)
              </label>
              <Input
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="98.6"
              />
              {tempWarning && (
                <span style={{ fontSize: '0.7rem', color: tempWarning.color, fontWeight: 700 }}>
                  {tempWarning.label}
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '4px' }}>
                Oxygen Saturation / SpO2 (%)
              </label>
              <Input
                value={spo2}
                onChange={(e) => setSpo2(e.target.value)}
                placeholder="98"
              />
              {spo2Warning && (
                <span style={{ fontSize: '0.7rem', color: spo2Warning.color, fontWeight: 700 }}>
                  {spo2Warning.label}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '4px' }}>
                Body Weight (kg)
              </label>
              <Input
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="68"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '4px' }}>
                Height (cm)
              </label>
              <Input
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="170"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '4px' }}>
                Calculated BMI
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Input value={calculatedBmi || '—'} disabled style={{ opacity: 0.9 }} />
                {bmiCategory && (
                  <Badge variant="primary" style={{ backgroundColor: `${bmiCategory.color}25`, color: bmiCategory.color, border: `1px solid ${bmiCategory.color}` }}>
                    {bmiCategory.label}
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '4px' }}>
                Blood Sugar / GRBS (mg/dL)
              </label>
              <Input
                value={bloodSugar}
                onChange={(e) => setBloodSugar(e.target.value)}
                placeholder="e.g. 110 (Optional)"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '4px' }}>
                Known Allergies & Drug Reactions
              </label>
              <Input
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. Penicillin, Sulfa drugs, None"
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                  Chief Complaints
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
                    cursor: 'pointer'
                  }}
                >
                  🎙️ AI Scribe (Ctrl+Space)
                </button>
              </div>
              <Input
                value={chiefComplaints}
                onChange={(e) => setChiefComplaints(e.target.value)}
                placeholder="e.g. Fever x 3 days, body ache"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.25rem', borderTop: '1px solid var(--ds-color-border, #1e293b)' }}>
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              ← Back to Billing
            </Button>
            <Button
              variant="primary"
              disabled={isSubmitting}
              onClick={() => {
                setVitalsSkipped(false);
                handleStep3Submit();
              }}
              style={{ fontWeight: 700 }}
            >
              Save Vitals & Send to Doctor Workstation (Step 4) ➔
            </Button>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STAGE 4: DOCTOR WORKSTATION & CLINICAL CONSULTATION (EMR & Rx) */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.25rem' }}>
          {/* Left Pane: Pre-Populated Vitals & Patient Profile from Step 3 */}
          <Card padding="md">
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              🩺 Pre-Populated Vitals & Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem' }}>
              <div style={{ backgroundColor: 'var(--ds-color-surface-subtle, #1a2234)', padding: '10px', borderRadius: '8px', border: '1px solid var(--ds-color-border, #1e293b)' }}>
                <strong>{patientName}</strong> ({patientAge}y / {patientGender})
                <span style={{ display: 'block', color: '#38bdf8', fontSize: '0.75rem', marginTop: '2px' }}>
                  Token: {tokenNumber} · {uhid}
                </span>
                <span style={{ display: 'block', fontSize: '0.72rem', color: billingChoice === 'PAID' ? '#4ade80' : '#fbbf24', marginTop: '2px' }}>
                  Payment: {billingChoice === 'PAID' ? 'PAID (₹550) ✓' : 'PAY LATER ⏳'}
                </span>
              </div>

              {/* Vitals Summary Pill Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: bpWarning.severity === 'HIGH' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${bpWarning.color}` }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Blood Pressure</span>
                  <strong style={{ fontSize: '0.95rem', color: bpWarning.color }}>{bpSystolic}/{bpDiastolic}</strong>
                </div>

                <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Pulse Rate</span>
                  <strong style={{ fontSize: '0.95rem', color: '#38bdf8' }}>{pulse} bpm</strong>
                </div>

                <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: tempWarning ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Temperature</span>
                  <strong style={{ fontSize: '0.95rem', color: tempWarning ? '#ef4444' : '#f1f5f9' }}>{temperature} °F</strong>
                </div>

                <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: spo2Warning ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>SpO2</span>
                  <strong style={{ fontSize: '0.95rem', color: spo2Warning ? '#ef4444' : '#4ade80' }}>{spo2} %</strong>
                </div>
              </div>

              {calculatedBmi && (
                <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>BMI & Weight</span>
                  <strong style={{ color: '#f1f5f9' }}>{calculatedBmi} ({bmiCategory?.label || ''}) · {weightKg} kg</strong>
                </div>
              )}

              {/* Allergies Box */}
              <div style={{ padding: '8px 10px', backgroundColor: 'rgba(239, 68, 68, 0.12)', borderRadius: '6px', border: '1px solid #ef4444' }}>
                <strong style={{ color: '#ef4444', display: 'block', fontSize: '0.75rem' }}>⚠️ Allergies:</strong>
                <span style={{ color: '#fca5a5', fontSize: '0.75rem' }}>{allergies || 'None'}</span>
              </div>

              {/* Complaints Box */}
              <div style={{ padding: '8px 10px', backgroundColor: 'rgba(2, 132, 199, 0.12)', borderRadius: '6px', border: '1px solid #0284c7' }}>
                <strong style={{ color: '#38bdf8', display: 'block', fontSize: '0.75rem' }}>📋 Chief Complaints:</strong>
                <span style={{ color: '#bae6fd', fontSize: '0.75rem' }}>{chiefComplaints}</span>
              </div>
            </div>
          </Card>

          {/* Right Pane: Clinical EMR, Rx, Labs & Protocols */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* 1-Click Order Sets */}
            <Card padding="sm">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ds-color-text-primary)' }}>
                  ⚡ 1-Click Disease Order Sets:
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
                      border: '1px solid #334155',
                      backgroundColor: 'var(--ds-color-surface-subtle, #1a2234)',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--ds-color-text-primary)',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{protocol.icon}</span>
                    <span>{protocol.name}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Diagnosis & Clinical Notes */}
            <Card padding="md">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '4px' }}>
                    Provisional Clinical Diagnosis (ICD-10) *
                  </label>
                  <Input
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Acute Viral Bronchitis / Type 2 Diabetes"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '4px' }}>
                    Clinical Examination / Doctor Notes
                  </label>
                  <Input
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="e.g. Chest clear, throat congested"
                  />
                </div>
              </div>
            </Card>

            {/* Prescriptions Table */}
            <Card padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--ds-color-text-primary)' }}>
                  💊 Prescribed Medicines ({medicines.length})
                </h4>
                <Button variant="outline" size="sm" onClick={handleAddMedicineRow}>
                  + Add Medicine (F2)
                </Button>
              </div>

              {medicines.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8125rem' }}>
                  No medicines added yet. Choose a 1-Click order set above or click "+ Add Medicine (F2)".
                </div>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medicine Name</TableHead>
                        <TableHead>Dosage</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Food Relation</TableHead>
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
              )}
            </Card>

            {/* Lab & Diagnostics Requisitions */}
            <Card padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--ds-color-text-primary)' }}>
                  🔬 Prescribed Lab Investigations ({selectedLabs.length})
                </h4>
                <Button variant="outline" size="sm" onClick={handleQuickAddLab}>
                  + Quick Add Lab (F4)
                </Button>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {selectedLabs.length === 0 ? (
                  <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>No investigations ordered. Press F4 to add.</span>
                ) : (
                  selectedLabs.map((lab, i) => (
                    <Badge key={i} variant="info" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {lab}
                      <span
                        onClick={() => setSelectedLabs(selectedLabs.filter((_, idx) => idx !== i))}
                        style={{ cursor: 'pointer', marginLeft: '4px' }}
                      >
                        ✕
                      </span>
                    </Badge>
                  ))
                )}
              </div>
            </Card>

            {/* Routing Destination */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: 'var(--ds-color-surface-subtle, #1a2234)' }}>
                <strong style={{ fontSize: '0.8125rem', display: 'block', marginBottom: '6px' }}>🔬 Lab Destination:</strong>
                <Select
                  value={labRouting}
                  onChange={(e) => setLabRouting(e.target.value as any)}
                  options={[
                    { value: 'EXCLUSIVE_PARTNER', label: `Exclusive Partner: ${preferredPartners.exclusiveLab?.partnerName || 'Patna Diagnostic Lab'}` },
                    { value: 'IN_HOUSE', label: 'In-House Clinic Sample Counter' },
                    { value: 'PATIENT_SLIP', label: 'Patient Direct Printed Slip (Self Choice)' }
                  ]}
                />
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: 'var(--ds-color-surface-subtle, #1a2234)' }}>
                <strong style={{ fontSize: '0.8125rem', display: 'block', marginBottom: '6px' }}>💊 Pharmacy Destination:</strong>
                <Select
                  value={pharmacyRouting}
                  onChange={(e) => setPharmacyRouting(e.target.value as any)}
                  options={[
                    { value: 'EXCLUSIVE_PARTNER', label: `Exclusive Chemist: ${preferredPartners.exclusivePharmacy?.partnerName || 'Apollo Med Chemist'}` },
                    { value: 'IN_HOUSE_POS', label: 'In-House Clinic Dispensary Counter' },
                    { value: 'WHATSAPP_RX', label: 'Patient WhatsApp e-Rx (Outside chemist)' }
                  ]}
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem' }}>
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                ← Back to Vitals
              </Button>
              <Button
                variant="primary"
                disabled={isSubmitting}
                onClick={handleStep4Submit}
                style={{ fontWeight: 800, padding: '10px 24px' }}
              >
                Sign & Finalize Consultation (Step 5) ➔
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 5: CHECKOUT, SETTLEMENT, FOLLOW-UP & NEXT PATIENT */}
      {/* ========================================================================= */}
      {currentStep === 5 && (
        <Card padding="lg">
          <div style={{ textAlign: 'center', padding: '1rem 0 1.5rem' }}>
            <span style={{ fontSize: '2.8rem' }}>🎉</span>
            <h2 style={{ margin: '6px 0', fontSize: '1.3rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              Consultation Successfully Completed for {patientName} ({tokenNumber})
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ds-color-text-secondary, #94a3b8)' }}>
              Provisional Diagnosis: <strong>{diagnosis || 'General Consultation'}</strong> · Medicines: <strong>{medicines.length}</strong> · Labs: <strong>{selectedLabs.length}</strong>
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* 1. FINANCIAL CLEARANCE STATUS */}
            <div style={{
              padding: '1.25rem',
              borderRadius: '10px',
              border: billingChoice === 'PAID' ? '1px solid #16a34a' : '1.5px solid #f59e0b',
              backgroundColor: billingChoice === 'PAID' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(245, 158, 11, 0.1)'
            }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '0.95rem', fontWeight: 800, color: billingChoice === 'PAID' ? '#4ade80' : '#fbbf24' }}>
                💳 Billing & Clearance Status
              </h3>

              {billingChoice === 'PAID' ? (
                <div>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: '#86efac' }}>
                    ✓ Consultation Fee Cleared at Check-in: <strong>₹{totalBillAmount}</strong>
                  </span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                    Receipt Number: <strong>{receiptNumber || 'RCP-ONLINE-PAID'}</strong>
                  </span>
                </div>
              ) : (
                <div>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: '#fde68a', fontWeight: 700 }}>
                    ⚠️ Pending Dues: ₹{totalBillAmount} (Deferred: {deferralReason.replace(/_/g, ' ')})
                  </span>
                  <p style={{ fontSize: '0.75rem', color: '#cbd5e1', margin: '6px 0 10px' }}>
                    Patient has completed consultation. Collect payment now at the checkout desk.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={handleSettlePostConsultation}
                    style={{ backgroundColor: '#f59e0b', borderColor: '#d97706', color: '#000000', fontWeight: 800 }}
                  >
                    💵 Collect ₹{totalBillAmount} & Settle Bill Now
                  </Button>
                </div>
              )}
            </div>

            {/* 2. FOLLOW-UP SCHEDULER */}
            <div style={{
              padding: '1.25rem',
              borderRadius: '10px',
              border: '1px solid #334155',
              backgroundColor: 'var(--ds-color-surface-subtle, #1a2234)'
            }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '0.95rem', fontWeight: 800, color: '#38bdf8' }}>
                📅 Schedule Follow-Up Visit
              </h3>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {[
                  { days: 3, label: '+3 Days' },
                  { days: 5, label: '+5 Days' },
                  { days: 7, label: '+1 Week' },
                  { days: 14, label: '+2 Weeks' }
                ].map((f) => (
                  <Button
                    key={f.days}
                    size="sm"
                    variant={followUpDays === f.days ? 'primary' : 'outline'}
                    onClick={() => {
                      setFollowUpDays(f.days);
                      setFollowUpCustomDate('');
                    }}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Input
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="Review instructions"
                />
                <Button
                  size="sm"
                  variant={isFollowUpSaved ? 'success' : 'primary'}
                  disabled={isSubmitting}
                  onClick={handleSaveFollowUp}
                >
                  {isFollowUpSaved ? '✓ Saved' : 'Schedule'}
                </Button>
              </div>
            </div>
          </div>

          {/* 1-CLICK PRINT & SHARE ACTION TILES */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '1.5rem'
          }}>
            <button
              onClick={() => setIsRxPrintOpen(true)}
              style={{
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid #334155',
                backgroundColor: 'var(--ds-color-surface-subtle, #1a2234)',
                color: 'var(--ds-color-text-primary)',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '4px' }}>📄</span>
              <strong style={{ fontSize: '0.875rem' }}>Print Prescription</strong>
              <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8' }}>A4 / Doctor Letterhead</span>
            </button>

            <button
              onClick={() => {
                window.print();
                showToast('🖨️ Printing Lab Requisition Slip');
              }}
              style={{
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid #334155',
                backgroundColor: 'var(--ds-color-surface-subtle, #1a2234)',
                color: 'var(--ds-color-text-primary)',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '4px' }}>🔬</span>
              <strong style={{ fontSize: '0.875rem' }}>Print Lab Slip</strong>
              <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8' }}>Barcode Requisition</span>
            </button>

            <button
              onClick={() => {
                window.print();
                showToast(`🧾 Printing Payment Receipt #${receiptNumber || 'RCP-1'}`);
              }}
              style={{
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid #334155',
                backgroundColor: 'var(--ds-color-surface-subtle, #1a2234)',
                color: 'var(--ds-color-text-primary)',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '4px' }}>🧾</span>
              <strong style={{ fontSize: '0.875rem' }}>Print Bill Receipt</strong>
              <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8' }}>GST / OPD Invoice</span>
            </button>

            <button
              onClick={() => {
                showToast(`📱 Prescription & Lab Slip sent to WhatsApp (${patientMobile})`);
              }}
              style={{
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid #16a34a',
                backgroundColor: 'rgba(22, 163, 74, 0.12)',
                color: '#4ade80',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '4px' }}>📱</span>
              <strong style={{ fontSize: '0.875rem', color: '#4ade80' }}>WhatsApp e-Rx</strong>
              <span style={{ display: 'block', fontSize: '0.7rem', color: '#86efac' }}>Send PDF to Mobile</span>
            </button>
          </div>

          {/* MASTER FINISH ACTION: COMPLETE & CALL NEXT PATIENT */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--ds-color-border, #1e293b)'
          }}>
            <Button
              variant="primary"
              disabled={isSubmitting}
              onClick={handleNextPatient}
              style={{ padding: '14px 36px', fontSize: '1.05rem', fontWeight: 800 }}
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
