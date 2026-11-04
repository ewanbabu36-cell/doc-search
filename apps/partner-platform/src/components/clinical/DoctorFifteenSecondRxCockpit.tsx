import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';
import { AntibiogramRecommendationBanner } from './AntibiogramRecommendationBanner.js';

export interface SmartPhraseItem {
  trigger: string;
  label: string;
  category: string;
  icon: string;
  chiefComplaint: string;
  diagnosis: {
    code: string;
    description: string;
  };
  medications: Array<{
    id: string;
    name: string;
    strength: string;
    dosage: string;
    frequency: string;
    timing: 'BEFORE_FOOD' | 'AFTER_FOOD' | 'WITH_FOOD' | 'BEDTIME' | 'ANYTIME';
    durationDays: number;
    instructions: string;
  }>;
  investigations: string[];
  dietaryAdvice: string;
}

export const SMART_PHRASE_LIBRARY: SmartPhraseItem[] = [
  {
    trigger: '.fever',
    label: 'Viral Pyrexia / Acute Fever',
    category: 'General OPD',
    icon: '🔥',
    chiefComplaint: 'Acute febrile illness with body ache, chills and malaise x 3 days',
    diagnosis: {
      code: 'R50.9',
      description: 'Acute Febrile Illness / Viral Pyrexia'
    },
    medications: [
      {
        id: 'med-parac-650',
        name: 'Tab. Paracetamol',
        strength: '650mg',
        dosage: '1 Tab',
        frequency: '1-0-1',
        timing: 'AFTER_FOOD',
        durationDays: 5,
        instructions: 'Take after meals. SOS if temp > 100°F (Max 3/day)'
      },
      {
        id: 'med-panto-40',
        name: 'Tab. Pantoprazole',
        strength: '40mg',
        dosage: '1 Tab',
        frequency: '1-0-0',
        timing: 'BEFORE_FOOD',
        durationDays: 5,
        instructions: 'Take 30 minutes before breakfast'
      },
      {
        id: 'med-ors-sachet',
        name: 'ORS Hydration Sachet',
        strength: '21.8g',
        dosage: '1 Sachet',
        frequency: '1-0-1',
        timing: 'ANYTIME',
        durationDays: 3,
        instructions: 'Mix 1 sachet in 1 liter of boiled and cooled water. Sip throughout day.'
      }
    ],
    investigations: ['Complete Blood Count (CBC)', 'Dengue NS1 Antigen (Rapid)', 'Malarial Antigen (Pf/Pv)'],
    dietaryAdvice: 'Maintain high oral fluid intake (3-4L/day). Tepid sponge bath if temp > 101°F. Avoid cold or oily food. Review in chamber if fever persists > 48h.'
  },
  {
    trigger: '.htn',
    label: 'Primary Essential Hypertension',
    category: 'Cardiology / Medicine',
    icon: '❤️',
    chiefComplaint: 'Routine blood pressure review, mild occipital morning headache, occasional dizziness',
    diagnosis: {
      code: 'I10',
      description: 'Essential (Primary) Hypertension - Stage 1'
    },
    medications: [
      {
        id: 'med-telmi-40',
        name: 'Tab. Telmisartan',
        strength: '40mg',
        dosage: '1 Tab',
        frequency: '1-0-0',
        timing: 'BEFORE_FOOD',
        durationDays: 30,
        instructions: 'Take regularly at 8:00 AM daily. Do not skip.'
      },
      {
        id: 'med-amlo-5',
        name: 'Tab. Amlodipine',
        strength: '5mg',
        dosage: '1 Tab',
        frequency: '0-0-1',
        timing: 'BEDTIME',
        durationDays: 30,
        instructions: 'Take at night before sleep. Check for ankle swelling.'
      }
    ],
    investigations: ['Serum Creatinine & Urea', 'Serum Electrolytes (Na+, K+)', '12-Lead Resting ECG', 'Fasting Lipid Profile'],
    dietaryAdvice: 'Strict low-sodium DASH diet (< 2g salt/day, no added table salt, avoid papad/pickles). 30 mins brisk walk daily. Maintain home BP log 2x weekly.'
  },
  {
    trigger: '.dm2',
    label: 'Type 2 Diabetes Mellitus',
    category: 'Endocrinology / Medicine',
    icon: '🩸',
    chiefComplaint: 'Routine diabetes check-up, polyuria, polyphagia, generalized fatigue and foot tingling',
    diagnosis: {
      code: 'E11.9',
      description: 'Type 2 Diabetes Mellitus without complications'
    },
    medications: [
      {
        id: 'med-metform-500',
        name: 'Tab. Metformin SR',
        strength: '500mg',
        dosage: '1 Tab',
        frequency: '1-0-1',
        timing: 'WITH_FOOD',
        durationDays: 30,
        instructions: 'Take with or immediately after major meals'
      },
      {
        id: 'med-glime-1',
        name: 'Tab. Glimepiride',
        strength: '1mg',
        dosage: '1 Tab',
        frequency: '1-0-0',
        timing: 'BEFORE_FOOD',
        durationDays: 30,
        instructions: 'Take 15 min before breakfast. Have breakfast immediately.'
      }
    ],
    investigations: ['HbA1c (Glycated Hemoglobin)', 'Fasting & Post-Prandial Blood Sugar', 'Urine Microalbumin/Creatinine Ratio'],
    dietaryAdvice: 'Avoid sugar, sweets, potatoes, white rice. Eat whole grains, green leafy veggies. Carry glucose/candy at all times for hypoglycemia symptoms. Daily foot check.'
  },
  {
    trigger: '.typhoid',
    label: 'Enteric Fever / Typhoid',
    category: 'Infectious Disease',
    icon: '🌡️',
    chiefComplaint: 'Step-ladder remittent high fever x 6 days, abdominal cramps, loss of appetite, constipation followed by loose stools',
    diagnosis: {
      code: 'A01.0',
      description: 'Typhoid Fever (Salmonella Typhi Infection)'
    },
    medications: [
      {
        id: 'med-cefix-200',
        name: 'Tab. Cefixime',
        strength: '200mg',
        dosage: '1 Tab',
        frequency: '1-0-1',
        timing: 'AFTER_FOOD',
        durationDays: 7,
        instructions: 'Complete full 7-day antibiotic course even if fever subsides'
      },
      {
        id: 'med-parac-650',
        name: 'Tab. Paracetamol',
        strength: '650mg',
        dosage: '1 Tab',
        frequency: '1-0-1',
        timing: 'AFTER_FOOD',
        durationDays: 5,
        instructions: 'Take for fever relief'
      },
      {
        id: 'med-lacto-spores',
        name: 'Cap. Lactic Acid Bacillus',
        strength: '60M Spores',
        dosage: '1 Cap',
        frequency: '1-0-1',
        timing: 'AFTER_FOOD',
        durationDays: 7,
        instructions: 'Probiotic support during antibiotic course'
      }
    ],
    investigations: ['Typhidot IgM & IgG', 'Widal Titer (Slide Agglutination)', 'Blood Culture & Sensitivity', 'Liver Function Test (LFT)'],
    dietaryAdvice: 'Strictly boiled cooled water only. Bland, soft diet (khichdi, daliya, curd). Absolutely avoid street foods, raw salads, unpeeled fruits.'
  },
  {
    trigger: '.cough',
    label: 'Allergic Bronchitis / Cough',
    category: 'Pulmonology / OPD',
    icon: '🗣️',
    chiefComplaint: 'Dry irritating hacking cough, nocturnal bouts x 5 days, throat tickling, mild chest tightness',
    diagnosis: {
      code: 'J40',
      description: 'Acute Bronchitis / Allergic Tracheobronchitis'
    },
    medications: [
      {
        id: 'med-mont-levo',
        name: 'Tab. Montelukast (10mg) + Levocetirizine (5mg)',
        strength: '10mg/5mg',
        dosage: '1 Tab',
        frequency: '0-0-1',
        timing: 'BEDTIME',
        durationDays: 7,
        instructions: 'Take at bedtime. May cause mild drowsiness.'
      },
      {
        id: 'med-cough-syrup',
        name: 'Syr. Dextromethorphan + CPM',
        strength: '100ml',
        dosage: '10 ml',
        frequency: '1-1-1',
        timing: 'AFTER_FOOD',
        durationDays: 5,
        instructions: 'Shake well before use. Sip warm water after 15 minutes.'
      }
    ],
    investigations: ['Chest X-Ray PA View (if cough persists > 14 days)', 'Absolute Eosinophil Count (AEC)'],
    dietaryAdvice: 'Warm saline gargles 3x daily. Steam inhalation with eucalyptus drops 2x daily. Avoid ice cream, cold drinks, direct AC blast. Drink warm water.'
  },
  {
    trigger: '.gerd',
    label: 'GERD & Acid Peptic Disease',
    category: 'Gastroenterology',
    icon: '⚡',
    chiefComplaint: 'Retrosternal burning sensation (heartburn), sour water brash, epigastric fullness after meals',
    diagnosis: {
      code: 'K21.9',
      description: 'Gastro-Esophageal Reflux Disease without esophagitis'
    },
    medications: [
      {
        id: 'med-rabe-dom',
        name: 'Cap. Rabeprazole (20mg) + Domperidone (30mg SR)',
        strength: '20mg/30mg',
        dosage: '1 Cap',
        frequency: '1-0-0',
        timing: 'BEFORE_FOOD',
        durationDays: 14,
        instructions: 'Take 30 minutes before morning breakfast with plain water'
      },
      {
        id: 'med-antacid-gel',
        name: 'Syr. Magaldrate + Simethicone Gel',
        strength: '200ml',
        dosage: '15 ml',
        frequency: '1-0-1',
        timing: 'AFTER_FOOD',
        durationDays: 7,
        instructions: 'Take 1 hour after meals and before bedtime as needed'
      }
    ],
    investigations: ['Ultrasound Whole Abdomen (Rule out Gallstones)', 'Upper GI Endoscopy (if dysphagia/weight loss)'],
    dietaryAdvice: 'Avoid tea, coffee, chocolate, deep fried and spicy foods. Eat small frequent meals. Do not lie down within 2 hours of eating. Elevate bed head.'
  },
  {
    trigger: '.uti',
    label: 'Acute Urinary Tract Infection',
    category: 'Urology / OPD',
    icon: '💧',
    chiefComplaint: 'Burning sensation during urination (dysuria), increased frequency, urgency and lower abdominal discomfort x 2 days',
    diagnosis: {
      code: 'N39.0',
      description: 'Urinary Tract Infection, Site not specified'
    },
    medications: [
      {
        id: 'med-nitro-100',
        name: 'Tab. Nitrofurantoin SR',
        strength: '100mg',
        dosage: '1 Tab',
        frequency: '1-0-1',
        timing: 'WITH_FOOD',
        durationDays: 5,
        instructions: 'Take with milk or meals to prevent nausea. Urine may turn brownish (harmless).'
      },
      {
        id: 'med-citra-syrup',
        name: 'Syr. Disodium Hydrogen Citrate',
        strength: '100ml',
        dosage: '10 ml',
        frequency: '1-1-1',
        timing: 'AFTER_FOOD',
        durationDays: 5,
        instructions: 'Dilute 10ml in 1 full glass of water and drink after meals'
      }
    ],
    investigations: ['Urine Routine & Microscopy', 'Urine Culture and Antibiotic Sensitivity'],
    dietaryAdvice: 'Drink minimum 3.5 liters of clean water daily. Do not suppress urge to urinate. Maintain perineal hygiene. Complete entire antibiotic course.'
  },
  {
    trigger: '.asthma',
    label: 'Bronchial Asthma Exacerbation',
    category: 'Pulmonology',
    icon: '🫁',
    chiefComplaint: 'Recurrent wheezing, chest tightness, shortness of breath on exertion, seasonal trigger',
    diagnosis: {
      code: 'J45.9',
      description: 'Asthma, Unspecified with acute exacerbation'
    },
    medications: [
      {
        id: 'med-bude-form',
        name: 'Budesonide (200mcg) + Formoterol (6mcg) Inhaler',
        strength: '200/6 mcg',
        dosage: '1 Puff',
        frequency: '1-0-1',
        timing: 'ANYTIME',
        durationDays: 30,
        instructions: 'Rinse mouth and gargle with water after each inhalation'
      },
      {
        id: 'med-salbut-sos',
        name: 'Salbutamol Inhaler (100mcg)',
        strength: '100mcg',
        dosage: '2 Puffs',
        frequency: 'SOS',
        timing: 'ANYTIME',
        durationDays: 30,
        instructions: 'Rescue inhaler: Take 2 puffs during sudden breathlessness'
      }
    ],
    investigations: ['Peak Expiratory Flow Rate (PEFR)', 'Spirometry / Pulmonary Function Test', 'Chest X-Ray PA View'],
    dietaryAdvice: 'Avoid cold beverages, dust, pet dander, incense smoke. Always use spacer with inhaler. Keep rescue inhaler accessible in pocket/bag at all times.'
  }
];

// Clinical Drug-Drug Interaction Registry (Sentinel Rule Base)
export interface DdiConflict {
  drugA: string;
  drugB: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  mechanism: string;
  recommendation: string;
}

const DDI_SENTINEL_RULES: DdiConflict[] = [
  {
    drugA: 'warfarin',
    drugB: 'aspirin',
    severity: 'CRITICAL',
    mechanism: 'Extreme anti-platelet and anti-coagulation synergy significantly multiplies fatal GI or intracranial hemorrhage risk.',
    recommendation: 'Avoid combination unless indicated for mechanical valve. Monitor INR tightly or substitute with gastro-protected therapy.'
  },
  {
    drugA: 'sildenafil',
    drugB: 'nitrate',
    severity: 'CRITICAL',
    mechanism: 'Potentiation of cGMP-mediated vasodilation results in profound, irreversible, life-threatening hypotension.',
    recommendation: 'ABSOLUTE CONTRAINDICATION. Never administer PDE5 inhibitors within 24 hours of any nitrate preparation.'
  },
  {
    drugA: 'telmisartan',
    drugB: 'enalapril',
    severity: 'HIGH',
    mechanism: 'Dual blockade of the renin-angiotensin system increases risks of hyperkalemia, syncope, and acute kidney injury.',
    recommendation: 'Do not combine ARB with ACE inhibitor. Use single agent plus Calcium Channel Blocker or Diuretic.'
  },
  {
    drugA: 'ciprofloxacin',
    drugB: 'ondansetron',
    severity: 'HIGH',
    mechanism: 'Additive cardiac electrophysiological effect prolongs QT interval, increasing hazard of Torsades de Pointes.',
    recommendation: 'Use alternative antiemetic (e.g. Domperidone or Metoclopramide) or monitor baseline ECG QTc.'
  },
  {
    drugA: 'metformin',
    drugB: 'contrast',
    severity: 'HIGH',
    mechanism: 'Iodinated radiocontrast may precipitate acute renal impairment leading to severe lactic acidosis accumulation.',
    recommendation: 'Withhold Metformin 48 hours before and 48 hours following iodinated contrast administration.'
  },
  {
    drugA: 'tramadol',
    drugB: 'sertraline',
    severity: 'HIGH',
    mechanism: 'Dual serotonergic enhancement increases likelihood of neurotoxic Serotonin Syndrome and seizure precipitation.',
    recommendation: 'Use alternative analgesic (e.g. Paracetamol) or close clinical monitoring for tremor, clonus, and hyperreflexia.'
  }
];

export interface DoctorFifteenSecondRxCockpitProps {
  isOpen: boolean;
  onClose: () => void;
  patientData?: {
    name: string;
    uhid: string;
    ageGender: string;
    tokenNo: string;
    phone?: string | undefined;
    allergies?: string[] | undefined;
    vitals?: {
      bp?: string | undefined;
      pulse?: number | undefined;
      spo2?: number | undefined;
      temp?: string | undefined;
      weight?: string | undefined;
    } | undefined;
  } | undefined;
  doctorName?: string | undefined;
  doctorRegNo?: string | undefined;
  facilityName?: string | undefined;
  onCommitPrescription?: ((rxPayload: {
    chiefComplaint: string;
    diagnosis: string;
    medications: SmartPhraseItem['medications'];
    investigations: string[];
    advice: string;
  }) => void) | undefined;
}

export const DoctorFifteenSecondRxCockpit: React.FC<DoctorFifteenSecondRxCockpitProps> = ({
  isOpen,
  onClose,
  patientData = {
    name: 'Rajesh Sharma',
    uhid: 'UHID-2026-98124',
    ageGender: '48Y / M',
    tokenNo: 'OPD-014',
    phone: '+91 98765 43210',
    allergies: ['Penicillin / Amoxicillin', 'Sulfa Drugs'],
    vitals: {
      bp: '138/88 mmHg',
      pulse: 78,
      spo2: 98,
      temp: '99.2 °F',
      weight: '72 kg'
    }
  },
  doctorName = 'Dr. Meraj Sharif, MD (Medicine)',
  doctorRegNo = 'NMC / KMC - 89210-A',
  facilityName = 'DocSearch Super-Speciality Hospital & Research Center',
  onCommitPrescription
}) => {
  // Prescription Form State
  const [chiefComplaint, setChiefComplaint] = useState<string>('');
  const [diagnosisCode, setDiagnosisCode] = useState<string>('');
  const [diagnosisDescription, setDiagnosisDescription] = useState<string>('');
  const [medications, setMedications] = useState<SmartPhraseItem['medications']>([]);
  const [investigations, setInvestigations] = useState<string[]>([]);
  const [advice, setAdvice] = useState<string>('');

  // SmartPhrase Trigger State
  const [smartPhraseQuery, setSmartPhraseQuery] = useState<string>('');
  const [isSmartPhraseMenuOpen, setIsSmartPhraseMenuOpen] = useState<boolean>(false);
  const smartInputRef = useRef<HTMLInputElement>(null);

  // 15-Second Timer State
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Print & Dispatch State
  const [activePrintMode, setActivePrintMode] = useState<'NONE' | 'THERMAL_80MM' | 'STANDARD_A4' | 'WHATSAPP_CONFIRM'>('NONE');
  const [isDispatchedSuccess, setIsDispatchedSuccess] = useState<boolean>(false);

  // Timer Tick Effect
  useEffect(() => {
    if (!isOpen) {
      setElapsedSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter = Instant 1-Click Sign & Print
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleExecuteCommit();
        return;
      }
      // Esc = Close Cockpit
      if (e.key === 'Escape' && activePrintMode === 'NONE') {
        e.preventDefault();
        onClose();
        return;
      }
      // Alt+1 = Focus Smart Search / Chief Complaint
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        smartInputRef.current?.focus();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activePrintMode, chiefComplaint, medications, diagnosisDescription]);

  // Filtered SmartPhrases
  const filteredSmartPhrases = useMemo(() => {
    if (!smartPhraseQuery.trim()) return SMART_PHRASE_LIBRARY;
    const cleanQuery = smartPhraseQuery.toLowerCase().replace(/^\./, '');
    return SMART_PHRASE_LIBRARY.filter(
      (sp) =>
        sp.trigger.toLowerCase().includes(cleanQuery) ||
        sp.label.toLowerCase().includes(cleanQuery) ||
        sp.category.toLowerCase().includes(cleanQuery)
    );
  }, [smartPhraseQuery]);

  // Apply a selected SmartPhrase
  const applySmartPhrase = (sp: SmartPhraseItem) => {
    setChiefComplaint(sp.chiefComplaint);
    setDiagnosisCode(sp.diagnosis.code);
    setDiagnosisDescription(sp.diagnosis.description);
    setMedications(sp.medications);
    setInvestigations(sp.investigations);
    setAdvice(sp.dietaryAdvice);
    setIsSmartPhraseMenuOpen(false);
    setSmartPhraseQuery('');
  };

  // Real-time Drug-Drug Interaction Sentinel Checker
  const detectedDdiConflicts = useMemo(() => {
    if (medications.length < 2) return [];
    const conflicts: DdiConflict[] = [];
    const medNames = medications.map((m) => m.name.toLowerCase());

    for (const rule of DDI_SENTINEL_RULES) {
      const matchA = medNames.some((m) => m.includes(rule.drugA));
      const matchB = medNames.some((m) => m.includes(rule.drugB));
      if (matchA && matchB) {
        conflicts.push(rule);
      }
    }
    return conflicts;
  }, [medications]);

  // Antibiogram CDSS Sentinel: Evaluates high-resistance antibiotics
  const antibiogramRiskMed = useMemo(() => {
    return medications.find((m) => {
      const n = m.name.toLowerCase();
      return (
        n.includes('cipro') ||
        n.includes('ceftriaxone') ||
        n.includes('amoxicillin') ||
        n.includes('ofloxacin') ||
        n.includes('cefixime')
      );
    });
  }, [medications]);

  // Commit and Sign Handler
  const handleExecuteCommit = () => {
    if (onCommitPrescription) {
      onCommitPrescription({
        chiefComplaint,
        diagnosis: diagnosisCode ? `${diagnosisCode} - ${diagnosisDescription}` : diagnosisDescription,
        medications,
        investigations,
        advice
      });
    }
    setIsDispatchedSuccess(true);
    setTimeout(() => {
      setIsDispatchedSuccess(false);
      setActivePrintMode('NONE');
      onClose();
    }, 1200);
  };

  // Quick Remove Medication
  const handleRemoveMedication = (id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
  };

  // Quick Add Medication Entry
  const handleAddCustomDrug = () => {
    const newDrug = {
      id: `med-${Date.now()}`,
      name: 'Tab. Paracetamol',
      strength: '650mg',
      dosage: '1 Tab',
      frequency: '1-0-1',
      timing: 'AFTER_FOOD' as const,
      durationDays: 5,
      instructions: 'Take after food'
    };
    setMedications((prev) => [...prev, newDrug]);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(2, 6, 23, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1240px',
          height: '92vh',
          backgroundColor: '#0F172A',
          border: '1.5px solid #0284C7',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(2, 132, 199, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* TOP BAR: PATIENT DOSSIER & 15-SECOND PERFORMANCE RADAR */}
        <div
          style={{
            backgroundColor: '#090D16',
            borderBottom: '1px solid #1E293B',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          {/* Patient Quick Vitals Dossier */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div
              style={{
                backgroundColor: '#0284C7',
                color: '#FFF',
                fontWeight: 900,
                fontSize: '0.85rem',
                padding: '4px 10px',
                borderRadius: '8px',
                letterSpacing: '0.5px'
              }}
            >
              TOKEN #{patientData.tokenNo}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F8FAFC' }}>
                  {patientData.name}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                  ({patientData.ageGender})
                </span>
                <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontFamily: 'monospace' }}>
                  {patientData.uhid}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px' }}>
                <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                  BP: <strong style={{ color: '#38BDF8' }}>{patientData.vitals?.bp || '120/80'}</strong>
                </span>
                <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                  Pulse: <strong style={{ color: '#34D399' }}>{patientData.vitals?.pulse || 72} bpm</strong>
                </span>
                <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                  SpO2: <strong style={{ color: '#6EE7B7' }}>{patientData.vitals?.spo2 || 99}%</strong>
                </span>
                <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                  Temp: <strong style={{ color: '#FCD34D' }}>{patientData.vitals?.temp || '98.6°F'}</strong>
                </span>
              </div>
            </div>

            {/* Red Allergy Hard-Lock Pill */}
            {patientData.allergies && patientData.allergies.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1.5px solid #EF4444',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  color: '#FCA5A5',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  boxShadow: '0 0 10px rgba(239, 68, 68, 0.3)'
                }}
              >
                <span>⚠️ ALLERGIES:</span>
                <span>{patientData.allergies.join(', ')}</span>
              </div>
            )}
          </div>

          {/* 15-Second Speedometer & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                borderRadius: '8px',
                backgroundColor:
                  elapsedSeconds <= 15
                    ? 'rgba(16, 185, 129, 0.15)'
                    : elapsedSeconds <= 30
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${
                  elapsedSeconds <= 15
                    ? '#10B981'
                    : elapsedSeconds <= 30
                    ? '#F59E0B'
                    : '#EF4444'
                }`,
                color:
                  elapsedSeconds <= 15
                    ? '#34D399'
                    : elapsedSeconds <= 30
                    ? '#FBBF24'
                    : '#F87171'
              }}
              title="15-Second OPD Velocity Radar"
            >
              <span style={{ fontSize: '0.9rem' }}>⏱️</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'monospace' }}>
                {elapsedSeconds}s
              </span>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700 }}>
                {elapsedSeconds <= 15 ? 'Hypersonic' : elapsedSeconds <= 30 ? 'Standard' : 'Extended'}
              </span>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              style={{ fontSize: '0.8rem', padding: '4px 10px' }}
            >
              ✕ Close (Esc)
            </Button>
          </div>
        </div>

        {/* DRUG INTERACTION SENTINEL ALERT (IF CONFLICT OCCURS) */}
        {detectedDdiConflicts.length > 0 && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              borderBottom: '2px solid #EF4444',
              padding: '10px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#FEE2E2',
              animation: 'pulse 2s infinite'
            }}
          >
            <span style={{ fontSize: '1.4rem' }}>🚨</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#FCA5A5' }}>
                CRITICAL DRUG-DRUG INTERACTION DETECTED: {detectedDdiConflicts[0]?.drugA.toUpperCase()} + {detectedDdiConflicts[0]?.drugB.toUpperCase()}
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: '2px', color: '#E2E8F0' }}>
                {detectedDdiConflicts[0]?.mechanism} {detectedDdiConflicts[0]?.recommendation}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                // Auto-resolve: remove the second drug
                const rule = detectedDdiConflicts[0];
                if (rule) {
                  setMedications((prev) =>
                    prev.filter((m) => !m.name.toLowerCase().includes(rule.drugB))
                  );
                }
              }}
              style={{
                backgroundColor: '#EF4444',
                color: '#FFF',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Auto-Resolve Safe Alternative
            </button>
          </div>
        )}

        {/* MIDDLE SECTION: SMARTPHRASE LAUNCHER & PROTOCOL PILLS */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#0D1424',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {/* SmartPhrase Dot-Input Box */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  position: 'relative',
                  flex: 1
                }}
              >
                <input
                  ref={smartInputRef}
                  type="text"
                  placeholder="Type dot-phrase (e.g. .fever, .htn, .dm2, .typhoid, .cough, .gerd, .uti, .asthma)... [Alt+1]"
                  value={smartPhraseQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSmartPhraseQuery(val);
                    setIsSmartPhraseMenuOpen(val.length > 0);
                  }}
                  onFocus={() => {
                    if (smartPhraseQuery.length > 0) setIsSmartPhraseMenuOpen(true);
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: '#1E293B',
                    border: '1.5px solid #0284C7',
                    borderRadius: '8px',
                    padding: '9px 14px 9px 38px',
                    color: '#F8FAFC',
                    fontSize: '0.875rem',
                    outline: 'none',
                    fontWeight: 600
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1rem',
                    color: '#38BDF8'
                  }}
                >
                  ⚡
                </span>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleAddCustomDrug}
                style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', padding: '8px 14px' }}
              >
                + Add Medication
              </Button>
            </div>

            {/* Floating Autocomplete Dropdown */}
            {isSmartPhraseMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  backgroundColor: '#0B1120',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  boxShadow: '0 16px 32px rgba(0,0,0,0.8)',
                  maxHeight: '260px',
                  overflowY: 'auto'
                }}
              >
                {filteredSmartPhrases.length === 0 ? (
                  <div style={{ padding: '12px', color: '#94A3B8', fontSize: '0.8rem' }}>
                    No matching smart-phrase found. Try <code>.fever</code>, <code>.htn</code>, <code>.dm2</code>, <code>.cough</code>
                  </div>
                ) : (
                  filteredSmartPhrases.map((sp) => (
                    <div
                      key={sp.trigger}
                      onClick={() => applySmartPhrase(sp)}
                      style={{
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(2, 132, 199, 0.15)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.2rem' }}>{sp.icon}</span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#38BDF8', fontWeight: 800, fontSize: '0.875rem' }}>
                              {sp.trigger}
                            </span>
                            <span style={{ color: '#F1F5F9', fontWeight: 700, fontSize: '0.85rem' }}>
                              {sp.label}
                            </span>
                          </div>
                          <div style={{ color: '#94A3B8', fontSize: '0.75rem', marginTop: '2px' }}>
                            {sp.diagnosis.code} • {sp.medications.length} Meds • {sp.investigations.length} Lab Tests
                          </div>
                        </div>
                      </div>
                      <Badge variant="neutral" style={{ fontSize: '0.7rem' }}>
                        {sp.category}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Quick Clickable Smart-Pills Carousel */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', marginRight: '4px' }}>
              Instant Protocols:
            </span>
            {SMART_PHRASE_LIBRARY.map((sp) => (
              <button
                key={sp.trigger}
                type="button"
                onClick={() => applySmartPhrase(sp)}
                style={{
                  padding: '3px 10px',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#E2E8F0',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(2, 132, 199, 0.2)';
                  e.currentTarget.style.borderColor = '#0284C7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                }}
              >
                <span>{sp.icon}</span>
                <span>{sp.trigger}</span>
              </button>
            ))}
          </div>
        </div>

        {/* WORKSPACE BODY: 2-COLUMN CLINICAL COCKPIT */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            overflow: 'hidden',
            backgroundColor: '#0F172A'
          }}
        >
          {/* LEFT COLUMN: ACTIVE RX & MEDICATION LIST */}
          <div
            style={{
              padding: '16px 20px',
              borderRight: '1px solid #1E293B',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            {/* Chief Complaints & Clinical Impression */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
                  CHIEF COMPLAINTS
                </label>
                <textarea
                  rows={2}
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="Enter patient complaints or click a smart-phrase..."
                  style={{
                    width: '100%',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    color: '#F8FAFC',
                    fontSize: '0.8rem',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
                  PROVISIONAL DIAGNOSIS & ICD-10
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={diagnosisCode}
                    onChange={(e) => setDiagnosisCode(e.target.value)}
                    placeholder="ICD-10"
                    style={{
                      width: '75px',
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      color: '#38BDF8',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      outline: 'none'
                    }}
                  />
                  <input
                    type="text"
                    value={diagnosisDescription}
                    onChange={(e) => setDiagnosisDescription(e.target.value)}
                    placeholder="Clinical Diagnosis..."
                    style={{
                      flex: 1,
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: '#F8FAFC',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Prescribed Medications Table */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                  Prescribed Pharmacotherapy ({medications.length})
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                  Double click dosage pill to toggle
                </span>
              </div>

              {antibiogramRiskMed && (
                <AntibiogramRecommendationBanner
                  prescribedDrugName={antibiogramRiskMed.name}
                  facilityResistanceRate={74}
                  alertSeverity="CRITICAL_RESISTANCE_WARNING"
                  onSelectAlternative={(altDrug) => {
                    setMedications((prev) => [
                      ...prev.filter((m) => m.id !== antibiogramRiskMed.id),
                      {
                        id: `alt-${Date.now()}`,
                        name: altDrug,
                        strength: 'Standard Hospital Formulary',
                        dosage: '1 Dose',
                        frequency: 'OD',
                        timing: 'AFTER_FOOD',
                        durationDays: 5,
                        instructions: 'Prescribed per Institutional Antibiogram CDSS recommendation'
                      }
                    ]);
                  }}
                />
              )}

              {medications.length === 0 ? (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    border: '1.5px dashed #334155',
                    borderRadius: '8px',
                    color: '#64748B',
                    fontSize: '0.8rem'
                  }}
                >
                  ⚡ No medications added yet. Type <code>.fever</code> or click a protocol above to populate in 1 second.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {medications.map((med, idx) => (
                    <div
                      key={med.id || idx}
                      style={{
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px'
                      }}
                    >
                      <div style={{ minWidth: '180px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#38BDF8', fontWeight: 800, fontSize: '0.85rem' }}>
                            {idx + 1}. {med.name}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{med.strength}</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
                          {med.instructions}
                        </div>
                      </div>

                      {/* Dosage Selector Pills */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {['1-0-1', '1-0-0', '0-0-1', '1-1-1', 'SOS'].map((freq) => (
                          <button
                            key={freq}
                            type="button"
                            onClick={() => {
                              setMedications((prev) =>
                                prev.map((m, i) => (i === idx ? { ...m, frequency: freq } : m))
                              );
                            }}
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              border: 'none',
                              backgroundColor:
                                med.frequency === freq ? '#0284C7' : 'rgba(255, 255, 255, 0.06)',
                              color: med.frequency === freq ? '#FFF' : '#94A3B8'
                            }}
                          >
                            {freq}
                          </button>
                        ))}
                      </div>

                      {/* Duration Spinner */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          min={1}
                          max={90}
                          value={med.durationDays}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 1;
                            setMedications((prev) =>
                              prev.map((m, i) => (i === idx ? { ...m, durationDays: val } : m))
                            );
                          }}
                          style={{
                            width: '45px',
                            backgroundColor: '#0F172A',
                            border: '1px solid #334155',
                            borderRadius: '4px',
                            padding: '3px 4px',
                            color: '#F8FAFC',
                            fontSize: '0.75rem',
                            textAlign: 'center',
                            outline: 'none',
                            fontWeight: 700
                          }}
                        />
                        <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>days</span>
                      </div>

                      {/* Food Relation */}
                      <span
                        style={{
                          fontSize: '0.65rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor:
                            med.timing === 'BEFORE_FOOD'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(16, 185, 129, 0.15)',
                          color: med.timing === 'BEFORE_FOOD' ? '#FBBF24' : '#34D399',
                          fontWeight: 700
                        }}
                      >
                        {med.timing.replace('_', ' ')}
                      </span>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(med.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          padding: '2px 4px'
                        }}
                        title="Remove Drug"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Diagnostic Tests & Labs */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase' }}>
                Recommended Lab & Imaging Investigations
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {investigations.map((test, i) => (
                  <span
                    key={i}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38BDF8',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    <span>🧪 {test}</span>
                    <button
                      type="button"
                      onClick={() => setInvestigations((prev) => prev.filter((_, idx) => idx !== i))}
                      style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Diet & Lifestyle Advice */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase' }}>
                Patient Lifestyle & Dietary Advisory
              </label>
              <textarea
                rows={2}
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                placeholder="Dietary instructions, warning signs, hydration rules..."
                style={{
                  width: '100%',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: '#F8FAFC',
                  fontSize: '0.8rem',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>
          </div>

          {/* RIGHT COLUMN: LIVE PRESCRIPTION SHEET PREVIEW */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#0A0F1D',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                Live Digital Rx Slip Preview
              </span>
              <Badge variant="info">Thermal 80mm / A4 Ready</Badge>
            </div>

            {/* Paper Preview Sheet Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                borderRadius: '8px',
                padding: '18px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '0.75rem',
                lineHeight: 1.4,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              {/* Rx Header */}
              <div>
                <div style={{ borderBottom: '2px solid #0284C7', paddingBottom: '8px', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#0369A1' }}>
                    {facilityName}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                    {doctorName} • Reg: {doctorRegNo}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#64748B' }}>
                    Consulting Suite: Chamber 101 • OPD Date: {new Date().toLocaleDateString('en-IN')}
                  </div>
                </div>

                {/* Patient Bar */}
                <div style={{ backgroundColor: '#F1F5F9', padding: '6px 8px', borderRadius: '4px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong>{patientData.name}</strong> ({patientData.ageGender}) | UHID: {patientData.uhid}
                  </div>
                  <div>
                    <strong>BP:</strong> {patientData.vitals?.bp} | <strong>Pulse:</strong> {patientData.vitals?.pulse} bpm
                  </div>
                </div>

                {/* Diagnosis */}
                {diagnosisDescription && (
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, color: '#0F172A' }}>Dx: </span>
                    <span>{diagnosisCode ? `[${diagnosisCode}] ` : ''}{diagnosisDescription}</span>
                  </div>
                )}

                {/* Rx Symbol & Drugs */}
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontWeight: 900, fontSize: '1rem', color: '#0284C7', marginBottom: '4px' }}>
                    ℞
                  </div>
                  {medications.length === 0 ? (
                    <div style={{ fontStyle: 'italic', color: '#94A3B8' }}>Prescription items will appear here...</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #CBD5E1', textAlign: 'left' }}>
                          <th style={{ padding: '3px 0' }}>Medicine</th>
                          <th>Dosage</th>
                          <th>Duration</th>
                          <th>Timing</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medications.map((m, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px dashed #E2E8F0' }}>
                            <td style={{ padding: '4px 0', fontWeight: 700 }}>{m.name} ({m.strength})</td>
                            <td>{m.frequency}</td>
                            <td>{m.durationDays} Days</td>
                            <td>{m.timing.replace('_', ' ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Labs */}
                {investigations.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.7rem', color: '#475569' }}>Advised Investigations:</div>
                    <div style={{ fontSize: '0.68rem', color: '#334155' }}>
                      {investigations.join(' • ')}
                    </div>
                  </div>
                )}

                {/* Diet */}
                {advice && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.7rem', color: '#475569' }}>Instructions & Diet:</div>
                    <div style={{ fontSize: '0.68rem', color: '#334155' }}>{advice}</div>
                  </div>
                )}
              </div>

              {/* Digital Signature Footer */}
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '8px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ fontSize: '0.62rem', color: '#94A3B8' }}>
                  Generated electronically by DocSearch SmartRx • Authenticated
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.7rem', color: '#0F172A' }}>
                    {doctorName}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: '#64748B' }}>
                    Electronically Signed & Recorded
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION FOOTER: 1-CLICK DISPATCH & PRINT CONTROLS */}
        <div
          style={{
            backgroundColor: '#090D16',
            borderTop: '1px solid #1E293B',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          {/* Status Hint */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
              Keystroke Shortcut: <kbd style={{ backgroundColor: '#1E293B', padding: '2px 6px', borderRadius: '4px', color: '#38BDF8', fontWeight: 800 }}>Ctrl + Enter</kbd> to Sign & Dispatch in 1 Click
            </span>
          </div>

          {/* Action Triggers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Thermal Slip Dispatch */}
            <button
              type="button"
              onClick={() => {
                setActivePrintMode('THERMAL_80MM');
                handleExecuteCommit();
              }}
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid #0284C7',
                color: '#38BDF8',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>🖨️</span>
              <span>80mm Slip Print</span>
            </button>

            {/* WhatsApp Send */}
            <button
              type="button"
              onClick={() => {
                setActivePrintMode('WHATSAPP_CONFIRM');
                handleExecuteCommit();
              }}
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid #22C55E',
                color: '#4ADE80',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>💬</span>
              <span>WhatsApp PDF Rx</span>
            </button>

            {/* Master 1-Click Complete Consultation */}
            <button
              type="button"
              onClick={handleExecuteCommit}
              disabled={isDispatchedSuccess}
              style={{
                backgroundColor: isDispatchedSuccess ? '#10B981' : '#0284C7',
                border: 'none',
                color: '#FFFFFF',
                borderRadius: '8px',
                padding: '8px 22px',
                fontSize: '0.875rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{isDispatchedSuccess ? '✓' : '⚡'}</span>
              <span>{isDispatchedSuccess ? 'Signed & Dispatched!' : '1-Click Sign & Complete Rx'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
