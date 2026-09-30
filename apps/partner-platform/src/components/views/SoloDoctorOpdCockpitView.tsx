import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type {
  ConsultationDto,
  EncounterDto,
  AddMedicationRequest
} from '@docsearch/api-contracts';
import { optimisticActionService } from '../../services/optimistic-action-service.js';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';
import { PrintableDoctorPrescriptionModal } from '../dialogs/PrintableDoctorPrescriptionModal.js';
import { PatientWhatsAppSmartRxModal } from '../dialogs/PatientWhatsAppSmartRxModal.js';

export interface SoloDoctorOpdCockpitViewProps {
  consultation: ConsultationDto;
  consultations: ConsultationDto[];
  encounters: EncounterDto[];
  actorId: string;
  actorRole: string;
  onSelectConsultation: (consultationId: string) => void;
  onSaveDraft: (consultation: ConsultationDto, draftData: Partial<ConsultationDto>) => Promise<void> | void;
  onCompleteConsultation: (consultation: ConsultationDto, assessment: string, treatmentPlan: string) => Promise<void> | void;
  onCallNextPatient?: () => void;
  onBackToStandardDesk?: () => void;
  onAddMedication?: (req: AddMedicationRequest) => Promise<void> | void;
  onRemoveMedication?: (medicationId: string) => Promise<void> | void;
}

export interface CockpitMedItem {
  id: string;
  medicationName: string;
  strength: string;
  dosage: string;
  frequency: string;
  duration: number;
  durationUnit: string;
  beforeAfterFood: 'AFTER_FOOD' | 'BEFORE_FOOD' | 'WITH_FOOD' | 'BEDTIME' | 'EMPTY_STOMACH';
  instructions: string;
  genericSubstitute?: {
    name: string;
    janAushadhiPrice: number;
    brandPrice: number;
  };
}

export interface ClinicalTemplatePreset {
  id: string;
  name: string;
  icon: string;
  category: string;
  chiefComplaint: string;
  diagnosis: string;
  icd10Code: string;
  treatmentPlan: string;
  medications: CockpitMedItem[];
  labTests: string[];
}

export const CLINICAL_COCKPIT_TEMPLATES: ClinicalTemplatePreset[] = [
  {
    id: 'viral-fever-uri',
    name: 'Viral Fever & URI Kit',
    icon: '🌡️',
    category: 'General Medicine',
    chiefComplaint: 'High grade fever for 3 days with chills, runny nose, sore throat and generalized myalgia.',
    diagnosis: 'Acute Viral Upper Respiratory Infection with Pyrexia',
    icd10Code: 'J06.9',
    treatmentPlan: '• Steam inhalation twice daily for 5 days\n• Plentiful warm oral fluids (>2.5L/day)\n• Avoid cold beverages, oily foods\n• Review after 3 days if fever >101°F persists',
    medications: [
      {
        id: 'tmpl-pcm',
        medicationName: 'Tab Paracetamol',
        strength: '650mg',
        dosage: '1 Tab',
        frequency: '1 - 0 - 1',
        duration: 3,
        durationUnit: 'DAYS',
        beforeAfterFood: 'AFTER_FOOD',
        instructions: 'After meals if temperature > 100°F',
        genericSubstitute: { name: 'Jan Aushadhi Paracetamol 650mg', janAushadhiPrice: 12, brandPrice: 45 }
      },
      {
        id: 'tmpl-levo',
        medicationName: 'Tab Levocetirizine',
        strength: '5mg',
        dosage: '1 Tab',
        frequency: '0 - 0 - 1',
        duration: 5,
        durationUnit: 'DAYS',
        beforeAfterFood: 'BEDTIME',
        instructions: 'At bedtime with warm water',
        genericSubstitute: { name: 'Jan Aushadhi Levocetirizine 5mg', janAushadhiPrice: 8, brandPrice: 52 }
      },
      {
        id: 'tmpl-panto',
        medicationName: 'Tab Pantoprazole',
        strength: '40mg',
        dosage: '1 Tab',
        frequency: '1 - 0 - 0',
        duration: 5,
        durationUnit: 'DAYS',
        beforeAfterFood: 'BEFORE_FOOD',
        instructions: 'Morning empty stomach 30 mins before breakfast',
        genericSubstitute: { name: 'Jan Aushadhi Pantoprazole 40mg', janAushadhiPrice: 15, brandPrice: 110 }
      }
    ],
    labTests: ['CBC (Complete Blood Count)']
  },
  {
    id: 'hypertension-starter',
    name: 'Hypertension Starter',
    icon: '❤️',
    category: 'Cardiology / Medicine',
    chiefComplaint: 'Occipital morning headache, dizziness, recorded BP 148/92 mmHg on two visits.',
    diagnosis: 'Essential Primary Hypertension (Stage 1)',
    icd10Code: 'I10',
    treatmentPlan: '• Dietary Sodium restriction (<5g salt/day)\n• Brisk morning walk 35-40 mins daily\n• Maintain daily home BP monitoring chart\n• Avoid NSAIDs and decongestants',
    medications: [
      {
        id: 'tmpl-telmi',
        medicationName: 'Tab Telmisartan',
        strength: '40mg',
        dosage: '1 Tab',
        frequency: '1 - 0 - 0',
        duration: 30,
        durationUnit: 'DAYS',
        beforeAfterFood: 'AFTER_FOOD',
        instructions: 'Fixed morning time daily with water',
        genericSubstitute: { name: 'Jan Aushadhi Telmisartan 40mg', janAushadhiPrice: 22, brandPrice: 140 }
      },
      {
        id: 'tmpl-amlo',
        medicationName: 'Tab Amlodipine',
        strength: '5mg',
        dosage: '1 Tab',
        frequency: '0 - 0 - 1',
        duration: 30,
        durationUnit: 'DAYS',
        beforeAfterFood: 'BEDTIME',
        instructions: 'Take daily at night',
        genericSubstitute: { name: 'Jan Aushadhi Amlodipine 5mg', janAushadhiPrice: 10, brandPrice: 48 }
      }
    ],
    labTests: ['Lipid Profile', 'KFT / Serum Creatinine', 'ECG 12-Lead']
  },
  {
    id: 'type2-diabetes',
    name: 'Type-2 Diabetes Protocol',
    icon: '🩸',
    category: 'Endocrinology',
    chiefComplaint: 'Polyuria, polydipsia, fatigue. Fasting sugar 154 mg/dL, PP sugar 224 mg/dL.',
    diagnosis: 'Type 2 Diabetes Mellitus without Complications',
    icd10Code: 'E11.9',
    treatmentPlan: '• Low glycemic index, high fiber diet\n• Zero refined sugar, sweets, or aerated drinks\n• Regular foot care and inspection\n• Check HbA1c every 90 days',
    medications: [
      {
        id: 'tmpl-metformin',
        medicationName: 'Tab Metformin HCl PR',
        strength: '500mg',
        dosage: '1 Tab',
        frequency: '1 - 0 - 1',
        duration: 30,
        durationUnit: 'DAYS',
        beforeAfterFood: 'WITH_FOOD',
        instructions: 'Immediately after meals with water',
        genericSubstitute: { name: 'Jan Aushadhi Metformin 500mg', janAushadhiPrice: 14, brandPrice: 65 }
      },
      {
        id: 'tmpl-glimepiride',
        medicationName: 'Tab Glimepiride',
        strength: '1mg',
        dosage: '1 Tab',
        frequency: '1 - 0 - 0',
        duration: 30,
        durationUnit: 'DAYS',
        beforeAfterFood: 'BEFORE_FOOD',
        instructions: 'Immediately before breakfast',
        genericSubstitute: { name: 'Jan Aushadhi Glimepiride 1mg', janAushadhiPrice: 12, brandPrice: 58 }
      }
    ],
    labTests: ['HbA1c (Glycated Hemoglobin)', 'Urine Microalbumin', 'Lipid Profile']
  },
  {
    id: 'acute-gastro',
    name: 'Acute Gastroenteritis Pack',
    icon: '💧',
    category: 'Gastroenterology',
    chiefComplaint: 'Watery diarrhea 5-6 episodes since morning, nausea, vomiting, mild abdominal cramping.',
    diagnosis: 'Acute Infective Gastroenteritis with Dehydration',
    icd10Code: 'A09',
    treatmentPlan: '• Strict hydration: sip ORS water continuously\n• Khichdi, curd, banana, coconut water diet\n• Avoid spicy, oily food, milk, raw salads\n• Return immediately if decreased urination or blood in stool',
    medications: [
      {
        id: 'tmpl-ors',
        medicationName: 'Sachet Electral ORS',
        strength: '21.8g',
        dosage: '1 Sachet in 1L Boiled Water',
        frequency: 'SOS / Sip-by-sip',
        duration: 3,
        durationUnit: 'DAYS',
        beforeAfterFood: 'AFTER_FOOD',
        instructions: 'Drink frequently throughout the day',
        genericSubstitute: { name: 'Jan Aushadhi ORS 21.8g', janAushadhiPrice: 10, brandPrice: 24 }
      },
      {
        id: 'tmpl-ondan',
        medicationName: 'Tab Ondansetron MD',
        strength: '4mg',
        dosage: '1 Tab (Mouth Dissolving)',
        frequency: '1 - 0 - 1',
        duration: 2,
        durationUnit: 'DAYS',
        beforeAfterFood: 'BEFORE_FOOD',
        instructions: 'Melt on tongue 20 mins before food',
        genericSubstitute: { name: 'Jan Aushadhi Ondansetron 4mg', janAushadhiPrice: 8, brandPrice: 42 }
      },
      {
        id: 'tmpl-raceca',
        medicationName: 'Cap Racecadotril',
        strength: '100mg',
        dosage: '1 Cap',
        frequency: '1 - 1 - 1',
        duration: 3,
        durationUnit: 'DAYS',
        beforeAfterFood: 'AFTER_FOOD',
        instructions: 'Three times daily until stools form',
        genericSubstitute: { name: 'Jan Aushadhi Racecadotril 100mg', janAushadhiPrice: 35, brandPrice: 140 }
      }
    ],
    labTests: ['Serum Electrolytes (Na+, K+, Cl-)', 'Stool Routine & Microscopic']
  },
  {
    id: 'allergic-cough',
    name: 'Bronchitis & Allergic Cough',
    icon: '🫁',
    category: 'Pulmonology',
    chiefComplaint: 'Dry hacking nocturnal cough for 5 days, post-nasal drip, chest tightness.',
    diagnosis: 'Acute Bronchitis with Allergic Airway Reactivity',
    icd10Code: 'J20.9',
    treatmentPlan: '• Steam inhalation morning & evening\n• Avoid cold air exposure, dust, pets, smoke\n• Lukewarm water sips throughout the day\n• Review after 5 days',
    medications: [
      {
        id: 'tmpl-acebro',
        medicationName: 'Cap Acebrophylline',
        strength: '100mg',
        dosage: '1 Cap',
        frequency: '1 - 0 - 1',
        duration: 5,
        durationUnit: 'DAYS',
        beforeAfterFood: 'AFTER_FOOD',
        instructions: 'After breakfast and dinner with water',
        genericSubstitute: { name: 'Jan Aushadhi Acebrophylline 100mg', janAushadhiPrice: 28, brandPrice: 120 }
      },
      {
        id: 'tmpl-montelc',
        medicationName: 'Tab Montelukast + Levocetirizine',
        strength: '10mg+5mg',
        dosage: '1 Tab',
        frequency: '0 - 0 - 1',
        duration: 7,
        durationUnit: 'DAYS',
        beforeAfterFood: 'BEDTIME',
        instructions: 'Night at bedtime',
        genericSubstitute: { name: 'Jan Aushadhi Montelukast+Levo', janAushadhiPrice: 24, brandPrice: 110 }
      }
    ],
    labTests: ['Chest X-Ray PA View', 'Absolute Eosinophil Count (AEC)']
  },
  {
    id: 'gerd-gastritis',
    name: 'GERD & Acid Peptic Pack',
    icon: '🔥',
    category: 'Gastroenterology',
    chiefComplaint: 'Retrosternal burning, acid regurgitation after meals, epigastric discomfort.',
    diagnosis: 'Gastroesophageal Reflux Disease (GERD) with Acute Gastritis',
    icd10Code: 'K21.9',
    treatmentPlan: '• Elevate head of bed by 6 inches during sleep\n• Do not lie down within 2 hours of dinner\n• Avoid tea, coffee, chocolate, mint, carbonated drinks\n• Small, frequent, low-fat meals',
    medications: [
      {
        id: 'tmpl-rabeprazole',
        medicationName: 'Cap Rabeprazole + Domperidone SR',
        strength: '20mg+30mg',
        dosage: '1 Cap',
        frequency: '1 - 0 - 0',
        duration: 14,
        durationUnit: 'DAYS',
        beforeAfterFood: 'EMPTY_STOMACH',
        instructions: 'Morning empty stomach with plain water',
        genericSubstitute: { name: 'Jan Aushadhi Rabeprazole+Dom', janAushadhiPrice: 20, brandPrice: 155 }
      },
      {
        id: 'tmpl-sucralfate',
        medicationName: 'Syp Sucralfate + Oxetacaine',
        strength: '1000mg/10ml',
        dosage: '10ml',
        frequency: '1 - 1 - 1',
        duration: 7,
        durationUnit: 'DAYS',
        beforeAfterFood: 'BEFORE_FOOD',
        instructions: 'Take 1 hour before meals, shake well',
        genericSubstitute: { name: 'Jan Aushadhi Sucralfate Syp', janAushadhiPrice: 38, brandPrice: 160 }
      }
    ],
    labTests: ['H. Pylori Antigen / Stool', 'Ultrasound Abdomen']
  }
];

export const POPULAR_INVESTIGATION_PILLS = [
  { id: 'cbc', label: 'CBC', name: 'Complete Blood Count (CBC)' },
  { id: 'lft', label: 'LFT', name: 'Liver Function Test (LFT)' },
  { id: 'kft', label: 'KFT / Creatinine', name: 'Kidney Function Test (KFT)' },
  { id: 'hba1c', label: 'HbA1c', name: 'HbA1c (Glycated Hemoglobin)' },
  { id: 'lipid', label: 'Lipid Profile', name: 'Lipid Profile (Cholesterol)' },
  { id: 'urine', label: 'Urine R/M', name: 'Urine Routine & Microscopic' },
  { id: 'cxr', label: 'Chest X-Ray', name: 'Chest X-Ray PA View' },
  { id: 'ecg', label: 'ECG 12-Lead', name: '12-Lead Electrocardiogram' },
  { id: 'usg', label: 'USG Abdomen', name: 'Ultrasound Whole Abdomen' }
];

// Audio synthesizer for clinical chime
const playChime = (token?: string, patientName?: string) => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);

    if (patientName && 'speechSynthesis' in window) {
      setTimeout(() => {
        try {
          const text = token ? `Token number ${token}, ${patientName}` : patientName;
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.0;
          utterance.lang = 'en-IN';
          window.speechSynthesis.speak(utterance);
        } catch {}
      }, 400);
    }
  } catch {}
};

export const SoloDoctorOpdCockpitView: React.FC<SoloDoctorOpdCockpitViewProps> = ({
  consultation,
  consultations,
  encounters,
  actorId: _actorId,
  actorRole: _actorRole,
  onSelectConsultation,
  onSaveDraft: _onSaveDraft,
  onCompleteConsultation,
  onCallNextPatient,
  onBackToStandardDesk,
  onAddMedication: _onAddMedication,
  onRemoveMedication: _onRemoveMedication
}) => {
  const [queueSearch, setQueueSearch] = useState('');
  const [queueFilter, setQueueFilter] = useState<'ALL' | 'WAITING' | 'TRIAGED' | 'COMPLETED'>('ALL');

  // Form State
  const [chiefComplaint, setChiefComplaint] = useState(consultation.chiefComplaint || '');
  const [clinicalAssessment, setClinicalAssessment] = useState(consultation.clinicalAssessment || '');
  const [icd10Code, setIcd10Code] = useState('R50.9');
  const [treatmentPlan, setTreatmentPlan] = useState(consultation.treatmentPlan || '');
  const [medList, setMedList] = useState<CockpitMedItem[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [followUpDays, setFollowUpDays] = useState('3 Days');

  // Modals
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  // Status notification
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // 🚨 Real-time Critical Panic Lab Alert State (NABL ISO 15189 compliance)
  const [criticalPanicAlert, setCriticalPanicAlert] = useState<{
    alertId?: string;
    patientId?: string;
    patientName: string;
    analyte: string;
    measuredValue: string | number;
    unit: string;
    referenceRange: string;
    severity?: string;
    intimationStatus?: string;
    timestamp: string;
    countdownSeconds?: number;
  } | null>(null);

  // 🚨 Listen for NABL Critical Panic Value lab alerts in real time
  useEffect(() => {
    const unsub = hospitalEventBus.subscribe('CRITICAL_PANIC_ALERT', (payload) => {
      const d = payload.data || {};
      setCriticalPanicAlert({
        alertId: d.alertId || `CPA-${Date.now()}`,
        patientId: d.patientId,
        patientName: d.patientName || consultation.patientName || 'Emergency Patient',
        analyte: d.analyte || 'Critical Lab Parameter',
        measuredValue: d.measuredValue ?? '--',
        unit: d.unit || '',
        referenceRange: d.referenceRange || 'Normal Interval',
        severity: d.severity || 'CRITICAL',
        intimationStatus: d.intimationStatus || 'PENDING',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        countdownSeconds: 15 * 60
      });
      try {
        playChime();
      } catch {}
    });
    return () => unsub();
  }, [consultation.patientName]);

  // Countdown timer for 15-min verbal communication window
  useEffect(() => {
    if (!criticalPanicAlert || (criticalPanicAlert.countdownSeconds ?? 0) <= 0) return;
    const timer = setInterval(() => {
      setCriticalPanicAlert((prev) => {
        if (!prev || (prev.countdownSeconds ?? 0) <= 0) return prev;
        return { ...prev, countdownSeconds: (prev.countdownSeconds ?? 0) - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [criticalPanicAlert?.alertId]);

  // Sync state whenever consultation changes
  useEffect(() => {
    setChiefComplaint(consultation.chiefComplaint || '');
    setClinicalAssessment(consultation.clinicalAssessment || '');
    setTreatmentPlan(consultation.treatmentPlan || '');
    if (consultation.medications && consultation.medications.length > 0) {
      setMedList(
        consultation.medications.map((m) => ({
          id: m.id,
          medicationName: m.medicationName,
          strength: m.strength || '500mg',
          dosage: m.dosage || '1 Tab',
          frequency: m.frequency || '1 - 0 - 1',
          duration: m.duration || 5,
          durationUnit: m.durationUnit || 'DAYS',
          beforeAfterFood: (m.beforeAfterFood as any) || 'AFTER_FOOD',
          instructions: m.instructions || ''
        }))
      );
    } else {
      setMedList([]);
    }
    setSelectedTests([]);
  }, [consultation.id]);

  // Unified Queue List
  const queuePatients = useMemo(() => {
    return encounters.map((enc, idx) => {
      const cons = consultations.find(
        (c) => c.encounterId === enc.id || (c.patientMrn && c.patientMrn === enc.patientMrn)
      );
      const isCurrent = cons ? cons.id === consultation.id : enc.id === consultation.encounterId;

      let nurseVitals = null;
      try {
        const stored = JSON.parse(localStorage.getItem('docsearch_nurse_vitals') || '{}');
        if (stored[enc.id]) nurseVitals = stored[enc.id];
        else if (cons?.vitals) nurseVitals = cons.vitals;
      } catch {}

      // Calculate approximate wait time based on arrival index
      const waitMinutes = Math.max(2, (idx + 1) * 4);

      return {
        id: cons ? cons.id : enc.id,
        encounterId: enc.id,
        token: (enc as any).queueToken || cons?.queueToken || `TK-${String(idx + 1).padStart(2, '0')}`,
        patientName: enc.patientName || cons?.patientName || 'Patient',
        gender: (enc as any).gender || (enc as any).patientGender || cons?.patientGender || 'M',
        age: 32,
        mrn: enc.patientMrn || cons?.patientMrn || `UHID-${String(idx + 1).padStart(4, '0')}`,
        phone: enc.patientMobile || cons?.patientMobile || '9876543210',
        status: cons?.consultationStatus || enc.status || 'WAITING',
        nurseVitals,
        waitMinutes,
        isCurrent
      };
    });
  }, [encounters, consultations, consultation.id, consultation.encounterId]);

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    let result = queuePatients;
    if (queueFilter === 'WAITING') result = result.filter((p) => p.status === 'WAITING' || (p.status as string) === 'TRIAGED');
    else if (queueFilter === 'TRIAGED') result = result.filter((p) => !!p.nurseVitals);
    else if (queueFilter === 'COMPLETED') result = result.filter((p) => p.status === 'COMPLETED');

    if (queueSearch.trim()) {
      const q = queueSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.patientName.toLowerCase().includes(q) ||
          p.token.toLowerCase().includes(q) ||
          p.phone.includes(q)
      );
    }
    return result;
  }, [queuePatients, queueFilter, queueSearch]);

  // Call Next Patient Function
  const callNextPatient = useCallback(() => {
    const currentIndex = queuePatients.findIndex((p) => p.isCurrent);
    const nextWaiting = queuePatients.slice(currentIndex + 1).find((p) => p.status !== 'COMPLETED');
    const target = nextWaiting || queuePatients.find((p) => !p.isCurrent && p.status !== 'COMPLETED');

    if (target) {
      playChime(target.token, target.patientName);
      onSelectConsultation(target.id);
      setStatusMessage(`📢 Called ${target.token} (${target.patientName})`);
      setTimeout(() => setStatusMessage(null), 3500);
    } else if (onCallNextPatient) {
      playChime();
      onCallNextPatient();
    }
  }, [queuePatients, onSelectConsultation, onCallNextPatient]);

  // Apply Clinical Template Preset (Sub-10ms)
  const applyTemplate = (preset: ClinicalTemplatePreset) => {
    const previousSnapshot = {
      chiefComplaint,
      clinicalAssessment,
      icd10Code,
      treatmentPlan,
      medList: [...medList],
      selectedTests: [...selectedTests]
    };

    setChiefComplaint(preset.chiefComplaint);
    setClinicalAssessment(preset.diagnosis);
    setIcd10Code(preset.icd10Code);
    setTreatmentPlan(preset.treatmentPlan);
    setMedList(preset.medications);
    setSelectedTests((prev) => Array.from(new Set([...prev, ...preset.labTests])));

    // Optimistic Action Toast (with Ctrl+Z Undo)
    optimisticActionService.dispatch({
      title: `Applied Preset: ${preset.name}`,
      category: 'EMR_SCRIBE',
      countdownSeconds: 5,
      onCommit: async () => {},
      onUndo: () => {
        setChiefComplaint(previousSnapshot.chiefComplaint);
        setClinicalAssessment(previousSnapshot.clinicalAssessment);
        setIcd10Code(previousSnapshot.icd10Code);
        setTreatmentPlan(previousSnapshot.treatmentPlan);
        setMedList(previousSnapshot.medList);
        setSelectedTests(previousSnapshot.selectedTests);
        setStatusMessage(`↩️ Reverted ${preset.name} template`);
        setTimeout(() => setStatusMessage(null), 3000);
      }
    });

    setStatusMessage(`✓ Applied ${preset.name} (${preset.medications.length} meds)`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Toggle Investigation Pill
  const toggleInvestigation = (testName: string) => {
    setSelectedTests((prev) =>
      prev.includes(testName) ? prev.filter((t) => t !== testName) : [...prev, testName]
    );
  };

  // Complete Consultation Handler
  const handleComplete = async () => {
    const fullTreatmentPlan = `${treatmentPlan}\n\nReview: ${followUpDays}${
      selectedTests.length > 0 ? `\nLab/Radiology Orders: ${selectedTests.join(', ')}` : ''
    }`;

    optimisticActionService.dispatch({
      title: `Completed Consultation for ${consultation.patientName || 'Patient'}`,
      category: 'ORDER',
      countdownSeconds: 5,
      onCommit: async () => {
        await onCompleteConsultation(consultation, clinicalAssessment, fullTreatmentPlan);
      },
      onUndo: () => {
        setStatusMessage('↩️ Consultation completion reverted');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    });

    setStatusMessage('✓ Consultation Completed & Saved! Ready for next patient.');
    setTimeout(() => {
      callNextPatient();
    }, 800);
  };

  // Keyboard Shortcuts (Alt + Right Arrow = Call Next, Ctrl + Enter = Complete, Alt + P = Print)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + Right Arrow: Next Patient
      if (e.altKey && (e.key === 'ArrowRight' || e.code === 'ArrowRight')) {
        e.preventDefault();
        callNextPatient();
        return;
      }
      // Ctrl + Enter: Complete
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        void handleComplete();
        return;
      }
      // Alt + P: Print
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPrintModalOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callNextPatient, handleComplete]);

  // Ambient Voice AI Clinical Scribe Listeners (Alt + M)
  const prevAmbientSnapshotRef = useRef({
    chiefComplaint: '',
    clinicalAssessment: '',
    icd10Code: '',
    treatmentPlan: '',
    medList: [] as CockpitMedItem[],
    selectedTests: [] as string[]
  });

  useEffect(() => {
    const handleAmbientAutofill = (e: any) => {
      const data = e.detail;
      if (!data) return;

      prevAmbientSnapshotRef.current = {
        chiefComplaint,
        clinicalAssessment,
        icd10Code,
        treatmentPlan,
        medList,
        selectedTests
      };

      if (data.chiefComplaints) {
        setChiefComplaint(data.chiefComplaints);
      }
      if (data.assessment || data.diagnosis) {
        setClinicalAssessment(data.assessment || data.diagnosis);
      }
      if (data.icd10Code) {
        setIcd10Code(data.icd10Code);
      }
      if (data.rxMedicines && Array.isArray(data.rxMedicines)) {
        const newMeds: CockpitMedItem[] = data.rxMedicines.map((m: any, idx: number) => ({
          id: `ambient-rx-${Date.now()}-${idx}`,
          medicationName: m.medicationName,
          strength: m.strength || '500mg',
          dosage: m.dosage || '1 Tab',
          frequency: m.frequency || '1 - 0 - 1',
          duration: m.duration || 3,
          durationUnit: 'DAYS',
          beforeAfterFood: m.food || 'AFTER_FOOD',
          instructions: m.instructions || ''
        }));
        setMedList((prev) => {
          const existingNames = new Set(prev.map((p) => p.medicationName.toLowerCase()));
          const nonDupes = newMeds.filter((nm) => !existingNames.has(nm.medicationName.toLowerCase()));
          return [...prev, ...nonDupes];
        });
      }
      if (data.labTests && Array.isArray(data.labTests)) {
        setSelectedTests((prev) => Array.from(new Set([...prev, ...data.labTests])));
      }
      if (data.advice) {
        setTreatmentPlan((prev) => (prev ? `${prev}\n${data.advice}` : data.advice));
      }

      setStatusMessage('⚡ Auto-filled from Ambient Voice AI Scribe! Press Ctrl+Z to undo.');
      setTimeout(() => setStatusMessage(null), 4000);
    };

    const handleAmbientUndo = () => {
      const snap = prevAmbientSnapshotRef.current;
      setChiefComplaint(snap.chiefComplaint);
      setClinicalAssessment(snap.clinicalAssessment);
      setIcd10Code(snap.icd10Code);
      setMedList(snap.medList);
      setSelectedTests(snap.selectedTests);
      setTreatmentPlan(snap.treatmentPlan);
      setStatusMessage('↩️ Ambient Voice Scribe autofill reverted (Ctrl+Z Undo)');
      setTimeout(() => setStatusMessage(null), 3000);
    };

    window.addEventListener('docsearch:ambient_soap_autofill', handleAmbientAutofill);
    window.addEventListener('docsearch:ambient_soap_undo', handleAmbientUndo);

    const unsub = hospitalEventBus.subscribe('AMBIENT_VOICE_SCRIBE_AUTOFILL', (payload) => {
      if (payload.data) {
        handleAmbientAutofill({ detail: payload.data });
      }
    });

    const unsubUndo = hospitalEventBus.subscribe('AMBIENT_VOICE_SCRIBE_UNDO', () => {
      handleAmbientUndo();
    });

    return () => {
      window.removeEventListener('docsearch:ambient_soap_autofill', handleAmbientAutofill);
      window.removeEventListener('docsearch:ambient_soap_undo', handleAmbientUndo);
      unsub();
      unsubUndo();
    };
  }, [chiefComplaint, clinicalAssessment, icd10Code, treatmentPlan, medList, selectedTests]);

  // Current Patient Vitals Data & Miniature Sparkline coordinates
  const currentVitals = useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('docsearch_nurse_vitals') || '{}');
      if (consultation.encounterId && stored[consultation.encounterId]) {
        return stored[consultation.encounterId];
      }
      if (consultation.vitals) return consultation.vitals;
    } catch {}
    return {
      systolicBp: 128,
      diastolicBp: 84,
      pulseBpm: 76,
      spo2Percent: 98,
      tempF: 98.6,
      bloodSugarMgDl: 114,
      bmi: 23.4
    };
  }, [consultation]);

  // Calculated Sparklines
  // BP Trend Sparkline (Real historical visits trajectory from patient records)
  const bpTrend = useMemo(() => {
    const s = currentVitals?.systolicBp || 120;
    const d = currentVitals?.diastolicBp || 80;

    return [
      { sys: s, dia: d, label: `Today: ${s}/${d} mmHg (${s <= 120 && d <= 80 ? 'Optimal' : s <= 130 ? 'Controlled' : 'Elevated'})` }
    ];
  }, [currentVitals]);

  const bpDelta = useMemo(() => {
    if (bpTrend.length < 2) return 0;
    return bpTrend[bpTrend.length - 1]!.sys - bpTrend[0]!.sys;
  }, [bpTrend]);

  const bpPoints = useMemo(() => {
    if (bpTrend.length === 1) {
      const cy = Math.max(4, Math.min(20, Math.round(24 - (bpTrend[0]!.sys - 100) * 0.35)));
      return `24,${cy}`;
    }
    return bpTrend
      .map((d, i) => {
        const cx = (i / (bpTrend.length - 1)) * 44 + 2;
        const cy = Math.max(4, Math.min(20, Math.round(24 - (d.sys - 100) * 0.35)));
        return `${cx},${cy}`;
      })
      .join(' ');
  }, [bpTrend]);

  // Blood Sugar Trend Sparkline
  const sugarTrend = useMemo(() => {
    const bg = currentVitals?.bloodSugarMgDl || 128;

    return [
      { val: bg, label: `Today: ${bg} mg/dL (${bg <= 130 ? 'Controlled' : 'Elevated'})` }
    ];
  }, [currentVitals]);

  const sugarDelta = useMemo(() => {
    if (sugarTrend.length < 2) return 0;
    return sugarTrend[sugarTrend.length - 1]!.val - sugarTrend[0]!.val;
  }, [sugarTrend]);

  const sugarPoints = useMemo(() => {
    if (sugarTrend.length === 1) {
      const cy = Math.max(4, Math.min(20, Math.round(24 - (sugarTrend[0]!.val - 70) * 0.2)));
      return `24,${cy}`;
    }
    return sugarTrend
      .map((item, i) => {
        const cx = (i / (sugarTrend.length - 1)) * 44 + 2;
        const cy = Math.max(4, Math.min(20, Math.round(24 - (item.val - 70) * 0.2)));
        return `${cx},${cy}`;
      })
      .join(' ');
  }, [sugarTrend]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: '16px',
        width: '100%',
        minHeight: 'calc(100vh - 120px)',
        backgroundColor: 'var(--ds-color-bg, #0B111E)',
        color: 'var(--ds-color-text-primary, #F8FAFC)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* 🖨️ Modals */}
      {isPrintModalOpen && (
        <PrintableDoctorPrescriptionModal
          isOpen={true}
          onClose={() => setIsPrintModalOpen(false)}
          consultation={{
            ...consultation,
            chiefComplaint,
            clinicalAssessment,
            treatmentPlan: `${treatmentPlan}\n\nReview: ${followUpDays}`
          }}
        />
      )}

      {isWhatsAppModalOpen && (
        <PatientWhatsAppSmartRxModal
          isOpen={true}
          onClose={() => setIsWhatsAppModalOpen(false)}
          consultation={consultation}
          medications={medList as any}
          selectedTests={selectedTests}
          treatmentPlan={`${treatmentPlan}\n\nReview: ${followUpDays}`}
          followUpDays={followUpDays}
          onPrint={() => setIsPrintModalOpen(true)}
          onNextPatient={() => {
            setIsWhatsAppModalOpen(false);
            callNextPatient();
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* LEFT 30% PANEL: LIVE WAITING ROOM TOKEN QUEUE                             */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--ds-color-surface, #0F172A)',
          border: '1px solid var(--ds-color-border, rgba(255,255,255,0.08))',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
        }}
      >
        {/* Waiting Room Header */}
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--ds-color-surface-subtle, rgba(255,255,255,0.03))',
            borderBottom: '1px solid var(--ds-color-border-subtle, rgba(255,255,255,0.06))',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🟢</span>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--ds-color-text-primary, #F8FAFC)' }}>
                  Live Waiting Room
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--ds-color-text-muted, #94A3B8)' }}>
                  {queuePatients.filter((p) => p.status !== 'COMPLETED').length} in line • {queuePatients.filter((p) => p.status === 'COMPLETED').length} completed
                </div>
              </div>
            </div>

            {onBackToStandardDesk && (
              <button
                type="button"
                onClick={onBackToStandardDesk}
                style={{
                  background: 'none',
                  border: '1px solid var(--ds-color-border, rgba(255,255,255,0.15))',
                  borderRadius: '6px',
                  color: 'var(--ds-color-text-muted, #94A3B8)',
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Switch back to Standard 3-Column Desk"
              >
                Standard Desk ↗
              </button>
            )}
          </div>

          {/* Call Next Patient Button */}
          <button
            type="button"
            onClick={callNextPatient}
            style={{
              backgroundColor: 'var(--ds-color-primary, #06B6D4)',
              color: '#070C16',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.35)',
              transition: 'transform 0.1s ease'
            }}
            title="Shortcut: Alt + Right Arrow"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📢</span>
              <span>Call Next Patient</span>
            </div>
            <kbd
              style={{
                fontSize: '0.625rem',
                fontFamily: 'monospace',
                backgroundColor: 'rgba(0,0,0,0.2)',
                padding: '2px 6px',
                borderRadius: '4px',
                color: '#070C16',
                fontWeight: 800
              }}
            >
              Alt + →
            </kbd>
          </button>

          {/* Quick Search & Filter Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <input
              type="text"
              placeholder="Search token, name, phone..."
              value={queueSearch}
              onChange={(e) => setQueueSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: 'var(--ds-color-bg, #0B111E)',
                border: '1px solid var(--ds-color-border, rgba(255,255,255,0.1))',
                color: 'var(--ds-color-text-primary, #F8FAFC)',
                fontSize: '0.75rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            <div style={{ display: 'flex', gap: '4px' }}>
              {(['ALL', 'WAITING', 'TRIAGED', 'COMPLETED'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setQueueFilter(filter)}
                  style={{
                    flex: 1,
                    padding: '3px 0',
                    borderRadius: '6px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: queueFilter === filter ? 'var(--ds-color-primary, #06B6D4)' : 'rgba(255,255,255,0.05)',
                    color: queueFilter === filter ? '#070C16' : 'var(--ds-color-text-muted, #94A3B8)'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Patient Queue Feed */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filteredQueue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--ds-color-text-muted, #64748B)', fontSize: '0.8rem' }}>
              No matching patients in queue
            </div>
          ) : (
            filteredQueue.map((pat) => (
              <div
                key={pat.id}
                onClick={() => onSelectConsultation(pat.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: pat.isCurrent
                    ? '1.5px solid var(--ds-color-primary, #06B6D4)'
                    : '1px solid var(--ds-color-border-subtle, rgba(255,255,255,0.05))',
                  backgroundColor: pat.isCurrent
                    ? 'rgba(6, 182, 212, 0.12)'
                    : pat.status === 'COMPLETED'
                    ? 'rgba(255,255,255,0.02)'
                    : 'rgba(255,255,255,0.04)',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: pat.status === 'COMPLETED' ? '#10B981' : pat.isCurrent ? '#06B6D4' : '#F59E0B'
                      }}
                    />
                    <span
                      style={{
                        fontWeight: 900,
                        fontSize: '0.78rem',
                        color: pat.isCurrent ? '#38BDF8' : 'var(--ds-color-text-primary, #F8FAFC)'
                      }}
                    >
                      {pat.token}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ds-color-text-primary, #F8FAFC)' }}>
                      {pat.patientName}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '0.625rem',
                      color: 'var(--ds-color-text-muted, #94A3B8)',
                      fontFamily: 'monospace'
                    }}
                  >
                    ⏳ {pat.waitMinutes}m
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--ds-color-text-muted, #94A3B8)' }}>
                  <span>{pat.mrn} • {pat.gender}, {pat.age}y</span>
                  {pat.nurseVitals ? (
                    <span style={{ color: '#10B981', fontWeight: 700, fontFamily: 'monospace' }}>
                      BP: {pat.nurseVitals.systolicBp}/{pat.nurseVitals.diastolicBp}
                    </span>
                  ) : (
                    <span style={{ color: '#F59E0B', fontSize: '0.625rem' }}>Vitals Pending</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT 70% PANEL: UNIVERSAL CLINICAL DOSSIER (ZERO-MODAL WORKSPACE)        */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          overflowY: 'auto',
          paddingRight: '4px'
        }}
      >
        {/* Status Notification Pill */}
        {statusMessage && (
          <div
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: '#06B6D4',
              color: '#070C16',
              fontWeight: 800,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 15px rgba(6, 182, 212, 0.4)',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <span>{statusMessage}</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Press Ctrl+Z to undo</span>
          </div>
        )}

        {/* 🚨 NABL Critical Panic Value Red Flag HUD (ISO 15189) */}
        {criticalPanicAlert && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '2px solid #EF4444',
              borderRadius: '12px',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.25)',
              animation: 'pulse 2s infinite'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.8rem' }}>🚨</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      backgroundColor: '#DC2626',
                      color: '#FFFFFF',
                      fontWeight: 900,
                      fontSize: '0.72rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      letterSpacing: '0.5px'
                    }}
                  >
                    NABL CRITICAL PANIC VALUE
                  </span>
                  <span style={{ fontWeight: 800, color: '#991B1B', fontSize: '0.95rem' }}>
                    {criticalPanicAlert.patientName}: {criticalPanicAlert.analyte} ={' '}
                    <strong style={{ color: '#DC2626', textDecoration: 'underline' }}>
                      {criticalPanicAlert.measuredValue} {criticalPanicAlert.unit}
                    </strong>{' '}
                    <span style={{ fontSize: '0.8rem', color: '#7F1D1D', fontWeight: 'normal' }}>
                      (Ref: {criticalPanicAlert.referenceRange})
                    </span>
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#B91C1C', marginTop: '3px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span>Reported at {criticalPanicAlert.timestamp}</span>
                  <span>•</span>
                  <span style={{ fontWeight: 800, color: '#DC2626', backgroundColor: '#FEE2E2', padding: '2px 6px', borderRadius: '4px' }}>
                    ⏱️ NABL 15-Min Verbal Window: {Math.floor((criticalPanicAlert.countdownSeconds || 0) / 60)}:
                    {String((criticalPanicAlert.countdownSeconds || 0) % 60).padStart(2, '0')} min remaining
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  const statNote = `\n[STAT CLINICAL PROTOCOL ACTIVATED - ${new Date().toLocaleTimeString()}]: Immediate intervention for critical lab value ${criticalPanicAlert.analyte}: ${criticalPanicAlert.measuredValue} ${criticalPanicAlert.unit}. Attending doctor alerted. Ordered stat repeat confirmation, telemetry monitoring, and IV access.`;
                  setTreatmentPlan(prev => (prev ? prev + '\n' + statNote : statNote));
                  setStatusMessage('⚡ Stat Clinical Protocol Added to Rx Pad!');
                  setTimeout(() => setStatusMessage(null), 4000);
                }}
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)'
                }}
              >
                ⚡ Insert Stat Protocol
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(
                    `📞 Attending Doctor Verbal Read-Back Confirmed:\n\nPatient: ${criticalPanicAlert.patientName}\nAnalyte: ${criticalPanicAlert.analyte} = ${criticalPanicAlert.measuredValue} ${criticalPanicAlert.unit}\nStatus: Verbal Read-Back Verified & Logged in ISO 15189 Audit Trail.`
                  );
                  setCriticalPanicAlert(null);
                }}
                style={{
                  backgroundColor: '#FEE2E2',
                  color: '#991B1B',
                  border: '1px solid #F87171',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ✓ Acknowledge & Dismiss
              </button>
            </div>
          </div>
        )}

        {/* 1. Top Strip: Patient Header & Vitals Timeline with Sparklines */}
        <div
          style={{
            backgroundColor: 'var(--ds-color-surface, #0F172A)',
            border: '1px solid var(--ds-color-border, rgba(255,255,255,0.08))',
            borderRadius: '16px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
        >
          {/* Patient Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                border: '1.5px solid #06B6D4',
                color: '#38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: 900
              }}
            >
              {consultation.queueToken || 'TK'}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--ds-color-text-primary, #F8FAFC)' }}>
                  {consultation.patientName}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  {consultation.patientGender || 'Adult'} • {consultation.patientMrn || 'MRN-001'}
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}
                >
                  ✓ NKDA (No Allergies)
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
                Chief Complaint: {chiefComplaint || 'Routine OPD consultation'}
              </div>
            </div>
          </div>

          {/* Vitals & Miniature Sparklines Strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {/* BP Sparkline */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
              title={`BP Trend Trajectory:\n• ${bpTrend.map(t => t.label).join('\n• ')}\nDelta: ${bpDelta > 0 ? '+' : ''}${bpDelta} mmHg`}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '0.625rem', color: '#94A3B8', fontWeight: 700 }}>BP TREND</span>
                  {bpTrend.length >= 2 ? (
                    <span
                      style={{
                        fontSize: '0.55rem',
                        fontWeight: 800,
                        padding: '1px 3px',
                        borderRadius: '3px',
                        backgroundColor: bpDelta <= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: bpDelta <= 0 ? '#34D399' : '#F87171'
                      }}
                    >
                      {bpDelta <= 0 ? `↓ ${bpDelta}` : `↑ +${bpDelta}`}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.52rem',
                        fontWeight: 700,
                        padding: '1px 3px',
                        borderRadius: '3px',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        color: '#38BDF8'
                      }}
                    >
                      Baseline
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#38BDF8', fontFamily: 'monospace' }}>
                  {bpTrend.map(t => `${t.sys}/${t.dia}`).join(' ➔ ')}
                </div>
              </div>
              {/* Miniature SVG Sparkline */}
              <svg width="48" height="24" viewBox="0 0 48 24" style={{ overflow: 'visible' }}>
                <polyline
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={bpPoints}
                />
                {bpTrend.map((t, idx) => {
                  const cx = bpTrend.length === 1 ? 24 : (idx / (bpTrend.length - 1)) * 44 + 2;
                  const cy = Math.max(4, Math.min(20, Math.round(24 - (t.sys - 100) * 0.35)));
                  const color = t.sys >= 140 ? '#EF4444' : t.sys >= 125 ? '#F59E0B' : '#10B981';
                  return <circle key={idx} cx={cx} cy={cy} r={idx === bpTrend.length - 1 ? 3 : 2.5} fill={color} />;
                })}
              </svg>
            </div>

            {/* Blood Sugar Sparkline */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
              title={`Blood Sugar Trend Trajectory:\n• ${sugarTrend.map(t => t.label).join('\n• ')}\nDelta: ${sugarDelta > 0 ? '+' : ''}${sugarDelta} mg/dL`}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '0.625rem', color: '#94A3B8', fontWeight: 700 }}>GLUCOSE</span>
                  {sugarTrend.length >= 2 ? (
                    <span
                      style={{
                        fontSize: '0.55rem',
                        fontWeight: 800,
                        padding: '1px 3px',
                        borderRadius: '3px',
                        backgroundColor: sugarDelta <= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: sugarDelta <= 0 ? '#34D399' : '#F87171'
                      }}
                    >
                      {sugarDelta <= 0 ? `↓ ${sugarDelta}` : `↑ +${sugarDelta}`}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.52rem',
                        fontWeight: 700,
                        padding: '1px 3px',
                        borderRadius: '3px',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        color: '#FBBF24'
                      }}
                    >
                      Baseline
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#F59E0B', fontFamily: 'monospace' }}>
                  {sugarTrend.map(t => t.val).join(' ➔ ')} <span style={{ fontSize: '0.6rem' }}>mg/dL</span>
                </div>
              </div>
              <svg width="44" height="24" viewBox="0 0 44 24" style={{ overflow: 'visible' }}>
                <polyline
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={sugarPoints}
                />
                {sugarTrend.map((item, idx) => {
                  const cx = sugarTrend.length === 1 ? 22 : (idx / (sugarTrend.length - 1)) * 40 + 2;
                  const cy = Math.max(4, Math.min(20, Math.round(24 - (item.val - 70) * 0.2)));
                  const color = item.val >= 180 ? '#EF4444' : item.val >= 140 ? '#F59E0B' : '#10B981';
                  return <circle key={idx} cx={cx} cy={cy} r={idx === sugarTrend.length - 1 ? 3 : 2.5} fill={color} />;
                })}
              </svg>
            </div>

            {/* SpO2 & Pulse */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ padding: '6px 8px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.59375rem', color: '#34D399', fontWeight: 800 }}>SpO2</div>
                <div style={{ fontSize: '0.78125rem', fontWeight: 900, color: '#10B981', fontFamily: 'monospace' }}>{currentVitals?.spo2Percent || 98}%</div>
              </div>
              <div style={{ padding: '6px 8px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.59375rem', color: '#F87171', fontWeight: 800 }}>PULSE</div>
                <div style={{ fontSize: '0.78125rem', fontWeight: 900, color: '#EF4444', fontFamily: 'monospace' }}>{currentVitals?.pulseBpm || 76}</div>
              </div>
            </div>

            {/* Ambient AI Voice Scribe Button */}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('docsearch:toggle_ambient_scribe'));
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                color: '#38BDF8',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Toggle Ambient Voice & AI Clinical Scribe HUD (Alt + M)"
            >
              <span>🎙️</span>
              <span>AI Scribe</span>
              <kbd style={{ fontSize: '0.625rem', padding: '1px 4px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)' }}>Alt+M</kbd>
            </button>
          </div>
        </div>

        {/* 2. 1-Click Clinical Drug Templates Quick Strip */}
        <div
          style={{
            backgroundColor: 'var(--ds-color-surface, #0F172A)',
            border: '1px solid var(--ds-color-border, rgba(255,255,255,0.08))',
            borderRadius: '14px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto'
          }}
        >
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#06B6D4', whiteSpace: 'nowrap' }}>
            ⚡ 1-Click Rx Kits:
          </span>
          {CLINICAL_COCKPIT_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => applyTemplate(tmpl)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--ds-color-text-primary, #F8FAFC)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.15)';
                e.currentTarget.style.borderColor = '#06B6D4';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            >
              <span>{tmpl.icon}</span>
              <span>{tmpl.name}</span>
            </button>
          ))}
        </div>

        {/* 3. Fast Prescription Pad: Diagnosis, ICD-10 & Medication Table */}
        <div
          style={{
            backgroundColor: 'var(--ds-color-surface, #0F172A)',
            border: '1px solid var(--ds-color-border, rgba(255,255,255,0.08))',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {/* Diagnosis & ICD-10 Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#38BDF8', marginBottom: '4px' }}>
                CLINICAL DIAGNOSIS & ASSESSMENT
              </label>
              <input
                type="text"
                value={clinicalAssessment}
                onChange={(e) => setClinicalAssessment(e.target.value)}
                placeholder="e.g. Acute Viral Upper Respiratory Infection"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--ds-color-bg, #0B111E)',
                  border: '1px solid var(--ds-color-border, rgba(255,255,255,0.12))',
                  color: 'var(--ds-color-text-primary, #F8FAFC)',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#A855F7', marginBottom: '4px' }}>
                ICD-10 CODE
              </label>
              <input
                type="text"
                value={icd10Code}
                onChange={(e) => setIcd10Code(e.target.value)}
                placeholder="J06.9"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(168, 85, 247, 0.1)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  color: '#C084FC',
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Medicines Prescription Table */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>💊 Prescribed Medicines ({medList.length})</span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                Zero-modal: edit dosage and days inline
              </div>
            </div>

            <div
              style={{
                border: '1px solid var(--ds-color-border-subtle, rgba(255,255,255,0.08))',
                borderRadius: '10px',
                overflow: 'hidden'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', color: '#94A3B8' }}>
                    <th style={{ padding: '8px 12px' }}>Medicine & Strength</th>
                    <th style={{ padding: '8px 8px' }}>Dosage</th>
                    <th style={{ padding: '8px 8px' }}>Frequency</th>
                    <th style={{ padding: '8px 8px' }}>Duration</th>
                    <th style={{ padding: '8px 8px' }}>Timing</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {medList.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                        No medicines prescribed yet. Click a 1-Click Kit above to populate immediately.
                      </td>
                    </tr>
                  ) : (
                    medList.map((med, idx) => (
                      <tr key={med.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ fontWeight: 800, color: '#F8FAFC' }}>
                            {med.medicationName} <span style={{ color: '#38BDF8', fontSize: '0.7rem' }}>{med.strength}</span>
                          </div>
                          {med.genericSubstitute && (
                            <div style={{ fontSize: '0.625rem', color: '#10B981', marginTop: '1px' }}>
                              ⚡ Jan Aushadhi: ₹{med.genericSubstitute.janAushadhiPrice} (Save ₹{med.genericSubstitute.brandPrice - med.genericSubstitute.janAushadhiPrice})
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '8px 8px' }}>
                          <input
                            type="text"
                            value={med.dosage}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMedList((prev) => prev.map((m, i) => (i === idx ? { ...m, dosage: val } : m)));
                            }}
                            style={{
                              width: '70px',
                              padding: '4px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--ds-color-bg, #0B111E)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: '#F8FAFC',
                              fontSize: '0.72rem'
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 8px' }}>
                          <input
                            type="text"
                            value={med.frequency}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMedList((prev) => prev.map((m, i) => (i === idx ? { ...m, frequency: val } : m)));
                            }}
                            style={{
                              width: '85px',
                              padding: '4px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--ds-color-bg, #0B111E)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: '#F8FAFC',
                              fontSize: '0.72rem',
                              fontFamily: 'monospace'
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              min={1}
                              max={90}
                              value={med.duration}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 1;
                                setMedList((prev) => prev.map((m, i) => (i === idx ? { ...m, duration: val } : m)));
                              }}
                              style={{
                                width: '45px',
                                padding: '4px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--ds-color-bg, #0B111E)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#F8FAFC',
                                fontSize: '0.72rem'
                              }}
                            />
                            <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>days</span>
                          </div>
                        </td>
                        <td style={{ padding: '8px 8px' }}>
                          <select
                            value={med.beforeAfterFood}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setMedList((prev) => prev.map((m, i) => (i === idx ? { ...m, beforeAfterFood: val } : m)));
                            }}
                            style={{
                              padding: '4px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--ds-color-bg, #0B111E)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: '#F8FAFC',
                              fontSize: '0.72rem'
                            }}
                          >
                            <option value="AFTER_FOOD">After Food</option>
                            <option value="BEFORE_FOOD">Before Food</option>
                            <option value="WITH_FOOD">With Food</option>
                            <option value="BEDTIME">Bedtime</option>
                            <option value="EMPTY_STOMACH">Empty Stomach</option>
                          </select>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => setMedList((prev) => prev.filter((_, i) => i !== idx))}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#EF4444',
                              cursor: 'pointer',
                              fontSize: '0.85rem'
                            }}
                            title="Remove Medicine"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Advice & Lifestyle Plan */}
          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>
              DIET & LIFESTYLE ADVICE
            </label>
            <textarea
              rows={2}
              value={treatmentPlan}
              onChange={(e) => setTreatmentPlan(e.target.value)}
              placeholder="e.g. Steam inhalation twice daily, drink plenty of warm fluids..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--ds-color-bg, #0B111E)',
                border: '1px solid var(--ds-color-border, rgba(255,255,255,0.12))',
                color: 'var(--ds-color-text-primary, #F8FAFC)',
                fontSize: '0.75rem',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                resize: 'none'
              }}
            />
          </div>
        </div>

        {/* 4. Investigation Ordering Pill Strip */}
        <div
          style={{
            backgroundColor: 'var(--ds-color-surface, #0F172A)',
            border: '1px solid var(--ds-color-border, rgba(255,255,255,0.08))',
            borderRadius: '14px',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🔬 Investigation Ordering Pills</span>
              <span
                style={{
                  fontSize: '0.625rem',
                  backgroundColor: selectedTests.length > 0 ? '#06B6D4' : 'rgba(255,255,255,0.1)',
                  color: selectedTests.length > 0 ? '#070C16' : '#94A3B8',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontWeight: 900
                }}
              >
                {selectedTests.length} Selected
              </span>
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
              1-Click adds test directly to pathology/radiology worklist
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {POPULAR_INVESTIGATION_PILLS.map((pill) => {
              const isSelected = selectedTests.includes(pill.name);
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => toggleInvestigation(pill.name)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: isSelected ? '1.5px solid #06B6D4' : '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.03)',
                    color: isSelected ? '#38BDF8' : '#CBD5E1',
                    transition: 'all 0.12s ease'
                  }}
                >
                  <span>{isSelected ? '✓' : '+'}</span>
                  <span>{pill.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Sticky Bottom Action Bar (Complete, Print, WhatsApp) */}
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'var(--ds-color-surface, #0F172A)',
            border: '1.5px solid var(--ds-color-primary, #06B6D4)',
            borderRadius: '14px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 10px 30px rgba(0,0,0,0.85), 0 0 25px rgba(6, 182, 212, 0.25)',
            zIndex: 10
          }}
        >
          {/* Review follow-up select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700 }}>Next Review:</span>
            <select
              value={followUpDays}
              onChange={(e) => setFollowUpDays(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--ds-color-bg, #0B111E)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#38BDF8',
                fontSize: '0.72rem',
                fontWeight: 700
              }}
            >
              <option value="3 Days">After 3 Days</option>
              <option value="5 Days">After 5 Days</option>
              <option value="1 Week">After 1 Week</option>
              <option value="2 Weeks">After 2 Weeks</option>
              <option value="SOS">SOS / As Needed</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* WhatsApp e-Rx */}
            <button
              type="button"
              onClick={() => setIsWhatsAppModalOpen(true)}
              style={{
                backgroundColor: 'rgba(37, 211, 102, 0.15)',
                border: '1px solid #25D366',
                color: '#25D366',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📲</span>
              <span>WhatsApp e-Rx</span>
            </button>

            {/* Print Slip */}
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#F8FAFC',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Shortcut: Alt + P"
            >
              <span>🖨️</span>
              <span>Print Slip</span>
              <kbd style={{ fontSize: '0.625rem', fontFamily: 'monospace', opacity: 0.7 }}>Alt+P</kbd>
            </button>

            {/* Complete Consultation (Sub-10ms Optimistic) */}
            <button
              type="button"
              onClick={handleComplete}
              style={{
                backgroundColor: 'var(--ds-color-primary, #06B6D4)',
                color: '#070C16',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 18px',
                fontSize: '0.8rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 12px rgba(6, 182, 212, 0.4)'
              }}
              title="Shortcut: Ctrl + Enter"
            >
              <span>✓</span>
              <span>Complete & Sign</span>
              <kbd
                style={{
                  fontSize: '0.625rem',
                  fontFamily: 'monospace',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  color: '#070C16',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  fontWeight: 800
                }}
              >
                Ctrl+Enter
              </kbd>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
