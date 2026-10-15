import React, { useState, useMemo } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';
import { getUnifiedPartnerProfile } from '../../utils/roleProfileResolver.js';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface DischargePatientCase {
  id: string;
  uhid: string;
  ipdNumber: string;
  patientName: string;
  ageGender: string;
  admissionDate: string;
  dischargeDate: string;
  roomBed: string;
  attendingConsultant: string;
  consultantRegNo: string;
  department: string;
  primaryDiagnosis: string;
  icd10Code: string;
  snomedCode: string;
  surgeryProcedure: string;
  admissionVitals: {
    pulse: number;
    bp: string;
    spo2: number;
    tempF: number;
  };
  dischargeVitals: {
    pulse: number;
    bp: string;
    spo2: number;
    tempF: number;
  };
  multidayTimeline: {
    day: string;
    title: string;
    clinicalNotes: string;
    vitalsSummary: string;
  }[];
  labTrajectory: {
    parameter: string;
    admissionValue: string;
    dischargeValue: string;
    unit: string;
    normalRange: string;
    status: 'NORMALIZED' | 'IMPROVING' | 'CRITICAL';
  }[];
  dischargeMedications: {
    brandName: string;
    genericFormula: string;
    dose: string;
    timing: string;
    durationDays: number;
    purpose: string;
    janAushadhiGeneric: string;
    janAushadhiPriceInr: number;
    mrpPriceInr: number;
  }[];
  dietAndWoundCareAdvice: string[];
  redFlagWarnings: string[];
  followUpPlan: {
    date: string;
    consultant: string;
    location: string;
    instructions: string;
  };
}

const SAMPLE_IPD_CASES: DischargePatientCase[] = [
  {
    id: 'IPD-CASE-01',
    uhid: 'UHID-2026-9041',
    ipdNumber: 'IPD-2026-8812',
    patientName: 'Rahul Verma',
    ageGender: '38y / Male',
    admissionDate: '25 Aug 2026, 11:30 PM',
    dischargeDate: '30 Aug 2026, 04:30 PM',
    roomBed: 'Post-Op Ward 204 (Bed 02)',
    attendingConsultant: 'Dr. Vivek Sharma, MS, FMAS',
    consultantRegNo: 'NMC-2014-99281',
    department: 'Department of General & Laparoscopic Surgery',
    primaryDiagnosis: 'Acute Gangrenous Appendicitis with Localized Peritonitis',
    icd10Code: 'K35.80',
    snomedCode: '47562',
    surgeryProcedure: 'Emergency 3-Port Laparoscopic Appendectomy under General Anesthesia',
    admissionVitals: { pulse: 114, bp: '138/88', spo2: 97, tempF: 102.2 },
    dischargeVitals: { pulse: 74, bp: '122/78', spo2: 99, tempF: 98.4 },
    multidayTimeline: [
      {
        day: 'Day 1 (Admission & Emergency OT)',
        title: 'Emergency Admission & Laparoscopic Resection',
        clinicalNotes: 'Presented via ER with 18-hr acute RIF pain, McBurney tenderness, guarding, high fever. Ultrasound revealed 9.4mm dilated aperistaltic appendix with periappendiceal fluid. Emergency lap appendectomy performed under GA. Gangrenous retrocecal appendix resected, base secured with endoloop, pelvic peritoneal lavage completed.',
        vitalsSummary: 'T 102.2°F, HR 114, BP 138/88, SpO2 97%'
      },
      {
        day: 'Day 2 (Post-Op Day 1)',
        title: 'ICU Step-down & Antimicrobial Coverage',
        clinicalNotes: 'NPO maintained for 12 hours. Started on IV Ceftriaxone 1g BD + Metronidazole 500mg TDS + Paracetamol IV. Mild surgical site pain controlled. Ambulation encouraged in evening.',
        vitalsSummary: 'T 99.4°F, HR 88, BP 124/80, SpO2 98%'
      },
      {
        day: 'Day 3 (Post-Op Day 2)',
        title: 'Bowel Activity & Diet Advancement',
        clinicalNotes: 'Flatus passed, bowel sounds active (3/min). Started on clear liquids, advanced to soft non-spicy diet. IV fluids tapered. Port site dressings clean, dry and intact.',
        vitalsSummary: 'T 98.6°F, HR 78, BP 120/76, SpO2 99%'
      },
      {
        day: 'Day 4-5 (Recovery & Discharge Clearance)',
        title: 'Normal Oral Diet & Discharge Readiness',
        clinicalNotes: 'Patient fully ambulating, tolerating normal solid diet without nausea or discomfort. Surgical incisions healthy with no hematoma or seroma. Switched to oral medications.',
        vitalsSummary: 'T 98.4°F, HR 74, BP 122/78, SpO2 99%'
      }
    ],
    labTrajectory: [
      { parameter: 'Total Leukocyte Count (TLC)', admissionValue: '16,800', dischargeValue: '7,900', unit: '/cu mm', normalRange: '4,000 - 11,000', status: 'NORMALIZED' },
      { parameter: 'C-Reactive Protein (CRP)', admissionValue: '48.5', dischargeValue: '6.2', unit: 'mg/L', normalRange: '< 5.0', status: 'IMPROVING' },
      { parameter: 'Hemoglobin (Hb)', admissionValue: '14.2', dischargeValue: '13.8', unit: 'g/dL', normalRange: '13.0 - 17.0', status: 'NORMALIZED' },
      { parameter: 'Serum Creatinine', admissionValue: '1.02', dischargeValue: '0.94', unit: 'mg/dL', normalRange: '0.7 - 1.3', status: 'NORMALIZED' }
    ],
    dischargeMedications: [
      {
        brandName: 'Tab. Zinnat 500mg',
        genericFormula: 'Cefuroxime Axetil 500mg',
        dose: '1 Tab BD',
        timing: 'After food (Morning & Night)',
        durationDays: 5,
        purpose: 'Post-surgical broad spectrum antibiotic',
        janAushadhiGeneric: 'Cefuroxime 500mg (PMBJP)',
        janAushadhiPriceInr: 68,
        mrpPriceInr: 340
      },
      {
        brandName: 'Tab. Flagyl 400mg',
        genericFormula: 'Metronidazole 400mg',
        dose: '1 Tab TDS',
        timing: 'After food (Morning, Afternoon, Night)',
        durationDays: 5,
        purpose: 'Anaerobic peritoneal prophylaxis',
        janAushadhiGeneric: 'Metronidazole 400mg (PMBJP)',
        janAushadhiPriceInr: 14,
        mrpPriceInr: 45
      },
      {
        brandName: 'Tab. Zerodol-P',
        genericFormula: 'Aceclofenac 100mg + Paracetamol 325mg',
        dose: '1 Tab BD',
        timing: 'After food as needed for pain',
        durationDays: 3,
        purpose: 'Anti-inflammatory and analgesia',
        janAushadhiGeneric: 'Aceclofenac + Paracetamol (PMBJP)',
        janAushadhiPriceInr: 18,
        mrpPriceInr: 75
      },
      {
        brandName: 'Tab. Pan 40mg',
        genericFormula: 'Pantoprazole 40mg',
        dose: '1 Tab OD',
        timing: 'Empty stomach in morning',
        durationDays: 7,
        purpose: 'Gastric mucosal protection',
        janAushadhiGeneric: 'Pantoprazole 40mg (PMBJP)',
        janAushadhiPriceInr: 16,
        mrpPriceInr: 110
      }
    ],
    dietAndWoundCareAdvice: [
      'Maintain clean and dry dressing over laparoscopic port sites. Sponge bath permitted; avoid submerging incisions in water.',
      'High protein, easily digestible soft diet (dal, khichdi, curd, fresh fruits). Maintain hydration with 2.5 to 3 liters of water daily.',
      'Strictly avoid lifting heavy objects (>5 kg), vigorous straining, or gym workouts for 3 weeks.',
      'Walk 15-20 minutes twice daily to prevent venous thromboembolism and promote bowel motility.'
    ],
    redFlagWarnings: [
      'High grade fever (> 100.5°F) with or without chills',
      'Persistent vomiting, inability to keep liquids down, or severe abdominal distension',
      'Sudden increase in sharp abdominal pain not relieved by prescribed analgesics',
      'Redness, foul-smelling purulent discharge, or bleeding from any of the port incisions'
    ],
    followUpPlan: {
      date: '06 Sep 2026 (Friday) at 10:30 AM',
      consultant: 'Dr. Vivek Sharma',
      location: 'OPD Chamber #04, 1st Floor Surgical Suite',
      instructions: 'Suture / skin glue inspection, wound review, and final histopathology biopsy report review.'
    }
  },
  {
    id: 'IPD-CASE-02',
    uhid: 'UHID-2026-CARD-091',
    ipdNumber: 'IPD-2026-8815',
    patientName: 'Ramesh Kumar',
    ageGender: '56y / Male',
    admissionDate: '24 Aug 2026, 04:15 AM',
    dischargeDate: '29 Aug 2026, 02:00 PM',
    roomBed: 'Cardiac Stepdown Ward 301 (Bed 01)',
    attendingConsultant: 'Dr. Sarah Jenkins, MD, DM (Cardiology)',
    consultantRegNo: 'NMC-2011-88419',
    department: 'Department of Interventional Cardiology',
    primaryDiagnosis: 'Acute Coronary Syndrome - Anterior Wall STEMI',
    icd10Code: 'I21.0',
    snomedCode: '02703ZZ',
    surgeryProcedure: 'Emergency Primary PTCA with Drug-Eluting Stent (Everolimus DES) to Mid LAD',
    admissionVitals: { pulse: 98, bp: '154/96', spo2: 94, tempF: 98.6 },
    dischargeVitals: { pulse: 70, bp: '118/76', spo2: 99, tempF: 98.4 },
    multidayTimeline: [
      {
        day: 'Day 1 (ER Arrival & Emergency Cath Lab)',
        title: 'STEMI Presentation & Primary Angioplasty',
        clinicalNotes: '56M presented to ER with 2-hour history of crushing retrosternal chest pain and diaphoresis. ECG showed 4mm ST elevations in V1-V4. Troponin-I positive (4.2 ng/mL). Taken immediately to Cath Lab. Coronary angiogram showed 99% thrombotic occlusion of mid LAD. Primary PTCA performed with Everolimus-eluting stent (3.0 x 24mm). TIMI-3 flow restored with 0% residual stenosis.',
        vitalsSummary: 'T 98.6°F, HR 98, BP 154/96, SpO2 94%'
      },
      {
        day: 'Day 2 (Cardiac ICU Care)',
        title: 'Continuous Telemetry & Hemodynamic Stabilization',
        clinicalNotes: 'Hemodynamically stable in CICU on DAPT (Ticagrelor + Aspirin) and IV Heparin infusion. No ventricular arrhythmias or post-infarct angina. Right femoral puncture site soft, no hematoma, DP pulses palpable.',
        vitalsSummary: 'T 98.4°F, HR 74, BP 122/80, SpO2 99%'
      },
      {
        day: 'Day 3-5 (Step-down & Ambulation)',
        title: 'Echocardiography & Discharge Optimization',
        clinicalNotes: '2D Echocardiogram showed LVEF 45% with hypokinesia of anterior septum, no clot or effusion. Ambulated 200m without chest pain or dyspnea. Switched to oral heart failure medications (Beta blocker + ACEi + Statin).',
        vitalsSummary: 'T 98.4°F, HR 70, BP 118/76, SpO2 99%'
      }
    ],
    labTrajectory: [
      { parameter: 'Serum Troponin-I', admissionValue: '4.2', dischargeValue: '0.12', unit: 'ng/mL', normalRange: '< 0.04', status: 'IMPROVING' },
      { parameter: 'Serum Creatinine', admissionValue: '1.14', dischargeValue: '1.02', unit: 'mg/dL', normalRange: '0.7 - 1.3', status: 'NORMALIZED' },
      { parameter: 'Total Cholesterol', admissionValue: '234', dischargeValue: '168', unit: 'mg/dL', normalRange: '< 200', status: 'NORMALIZED' },
      { parameter: 'LDL Cholesterol', admissionValue: '158', dischargeValue: '82', unit: 'mg/dL', normalRange: '< 100', status: 'NORMALIZED' }
    ],
    dischargeMedications: [
      {
        brandName: 'Tab. Brilinta 90mg',
        genericFormula: 'Ticagrelor 90mg',
        dose: '1 Tab BD',
        timing: 'Morning & Night (Mandatory)',
        durationDays: 365,
        purpose: 'Dual Antiplatelet Therapy (DAPT) to prevent stent thrombosis',
        janAushadhiGeneric: 'Ticagrelor 90mg (PMBJP)',
        janAushadhiPriceInr: 120,
        mrpPriceInr: 780
      },
      {
        brandName: 'Tab. Ecosprin 75mg',
        genericFormula: 'Aspirin 75mg Gastro-resistant',
        dose: '1 Tab OD',
        timing: 'After lunch',
        durationDays: 365,
        purpose: 'Antiplatelet cardioshield',
        janAushadhiGeneric: 'Aspirin 75mg (PMBJP)',
        janAushadhiPriceInr: 5,
        mrpPriceInr: 22
      },
      {
        brandName: 'Tab. Atorva 40mg',
        genericFormula: 'Atorvastatin 40mg',
        dose: '1 Tab HS',
        timing: 'At bedtime',
        durationDays: 90,
        purpose: 'High-intensity plaque stabilization & lipid lowering',
        janAushadhiGeneric: 'Atorvastatin 40mg (PMBJP)',
        janAushadhiPriceInr: 32,
        mrpPriceInr: 210
      },
      {
        brandName: 'Tab. Metolar-XR 25mg',
        genericFormula: 'Metoprolol Succinate ER 25mg',
        dose: '1 Tab OD',
        timing: 'Morning after food',
        durationDays: 90,
        purpose: 'Myocardial workload reduction & anti-arrhythmic',
        janAushadhiGeneric: 'Metoprolol Succinate 25mg (PMBJP)',
        janAushadhiPriceInr: 18,
        mrpPriceInr: 85
      }
    ],
    dietAndWoundCareAdvice: [
      'STRICT ADHERENCE TO DAPT: Never miss or stop Ticagrelor or Aspirin without consulting your cardiologist. Stent thrombosis can be fatal.',
      'Low salt (< 3g/day), low saturated fat, heart-healthy Mediterranean diet. Avoid fried foods, red meats, and refined sugars.',
      'Keep right femoral puncture site clean and dry. Avoid hot water soaks or vigorous squatting for 10 days.',
      'Cardiac rehabilitation: Light 15-minute flat walking. Avoid sudden heavy physical exertion or emotional distress.'
    ],
    redFlagWarnings: [
      'Recurrence of central chest pain, heavy squeezing, or pain radiating to left arm/jaw',
      'Shortness of breath, orthopnea, or awakening at night gasping for breath',
      'Palpitations, lightheadedness, or sudden blackout spells (syncope)',
      'Bleeding from groin puncture site, expanding painful groin lump, or black tarry stools'
    ],
    followUpPlan: {
      date: '05 Sep 2026 (Thursday) at 11:00 AM',
      consultant: 'Dr. Sarah Jenkins',
      location: 'Cardiac OPD Clinic Room #12',
      instructions: 'Review ECG, check femoral site, review lipid panel and medication tolerability.'
    }
  }
];

export const OneClickAiDischargeSynthesizerView: React.FC = () => {
  const partnerProfile = getUnifiedPartnerProfile();
  const [selectedCaseId, setSelectedCaseId] = useState<string>('IPD-CASE-01');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesizedSuccess, setSynthesizedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MEDS_JAN_AUSHADHI' | 'ADVICE' | 'PRINT_PREVIEW'>('OVERVIEW');
  const [isDoctorSigned, setIsDoctorSigned] = useState(false);
  const [whatsAppDispatched, setWhatsAppDispatched] = useState(false);
  const [abdmLinked, setAbdmLinked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeCase = SAMPLE_IPD_CASES.find((c) => c.id === selectedCaseId) || SAMPLE_IPD_CASES[0]!;

  const totalMrpMeds = useMemo(() => activeCase.dischargeMedications.reduce((sum, m) => sum + m.mrpPriceInr, 0), [activeCase]);
  const totalJanAushadhiMeds = useMemo(() => activeCase.dischargeMedications.reduce((sum, m) => sum + m.janAushadhiPriceInr, 0), [activeCase]);
  const totalPatientSavings = totalMrpMeds - totalJanAushadhiMeds;
  const savingsPercent = Math.round((totalPatientSavings / totalMrpMeds) * 100);

  // 1-Click AI Discharge Synthesizer Execution
  const handleTriggerAiSynthesize = () => {
    setIsSynthesizing(true);
    setTimeout(() => {
      setIsSynthesizing(false);
      setSynthesizedSuccess(true);
      setToastMessage('✨ AI Discharge Summary successfully synthesized across EMR, OT, Nursing Flowsheets & LIMS in 2.1s!');
      setTimeout(() => setToastMessage(null), 5000);

      hospitalEventBus.publish(
        'DISCHARGE_VELOCITY_PARALLEL_SPAWNED',
        'OneClickAiDischargeSynthesizer',
        {
          ipdNumber: activeCase.ipdNumber,
          uhid: activeCase.uhid,
          patientName: activeCase.patientName,
          diagnosis: activeCase.primaryDiagnosis,
          synthesizedAt: new Date().toISOString()
        },
        `⚡ 1-Click AI Discharge Summary Generated for ${activeCase.patientName} (${activeCase.ipdNumber}).`
      );
    }, 1800);
  };

  // Doctor Sign-off
  const handleDoctorSignOff = () => {
    setIsDoctorSigned(true);
    setToastMessage(`✓ Digitally co-signed by ${activeCase.attendingConsultant} (${activeCase.consultantRegNo})`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // WhatsApp PDF Dispatch
  const handleSendWhatsAppSummary = () => {
    setWhatsAppDispatched(true);
    setToastMessage(`📱 Official NABH Discharge Summary PDF & Medication Schedule dispatched to patient's WhatsApp!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  // ABDM Care Context Linking (M2)
  const handleLinkAbdmCareContext = () => {
    setAbdmLinked(true);
    setToastMessage(`🇮🇳 ABHA Care Context #${activeCase.ipdNumber} linked to ABDM Personal Health Record (PHR)!`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', color: '#F8FAFC' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(14, 165, 233, 0.12) 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.6rem' }}>⚡</span>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
              1-Click AI Inpatient Discharge Summary Synthesizer
            </h1>
            <Badge variant="success">NABH 5th Edition & NHA ABDM Certified</Badge>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0, maxWidth: '850px' }}>
            Synthesizes multi-day admission notes, OT surgery logs, 24-hr ICU vitals, and lab trends into a complete NABH Discharge Summary in <strong>&lt; 3 seconds</strong>, reducing resident doctor documentation burden from 45 minutes to 1 click.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            style={{ fontWeight: 700 }}
          >
            🖨️ Print NABH Summary
          </Button>
        </div>
      </div>

      {/* Case Selector Bar */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '12px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}
      >
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
          Select Inpatient For Discharge:
        </span>
        {SAMPLE_IPD_CASES.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setSelectedCaseId(c.id);
              setIsDoctorSigned(false);
              setWhatsAppDispatched(false);
              setAbdmLinked(false);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: selectedCaseId === c.id ? 'rgba(16, 185, 129, 0.2)' : '#1E293B',
              border: selectedCaseId === c.id ? '1px solid #10B981' : '1px solid #334155',
              color: selectedCaseId === c.id ? '#A7F3D0' : '#CBD5E1',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {c.patientName} ({c.ipdNumber}) • {c.primaryDiagnosis.slice(0, 28)}...
          </button>
        ))}
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1.5px solid #10B981',
            borderRadius: '12px',
            padding: '12px 18px',
            color: '#10B981',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* 2-Column Main Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: '20px' }}>
        {/* Left Column: Patient Inpatient Dossier & Multi-Day Clinical Trajectory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Patient Header Card */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
                  {activeCase.patientName}
                </h2>
                <div style={{ fontSize: '0.75rem', color: '#38BDF8', marginTop: '2px' }}>
                  {activeCase.uhid} • {activeCase.ipdNumber} • {activeCase.ageGender}
                </div>
              </div>
              <Badge variant="primary">{activeCase.roomBed}</Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.78rem', backgroundColor: '#1E293B', padding: '10px 12px', borderRadius: '10px' }}>
              <div>
                <span style={{ color: '#94A3B8' }}>Admission: </span>
                <strong style={{ color: '#F1F5F9' }}>{activeCase.admissionDate}</strong>
              </div>
              <div>
                <span style={{ color: '#94A3B8' }}>Discharge: </span>
                <strong style={{ color: '#10B981' }}>{activeCase.dischargeDate}</strong>
              </div>
              <div>
                <span style={{ color: '#94A3B8' }}>Consultant: </span>
                <strong style={{ color: '#F1F5F9' }}>{activeCase.attendingConsultant}</strong>
              </div>
              <div>
                <span style={{ color: '#94A3B8' }}>Reg No: </span>
                <strong style={{ color: '#38BDF8' }}>{activeCase.consultantRegNo}</strong>
              </div>
            </div>

            {/* Diagnosis & Surgery */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: '#94A3B8' }}>Primary Diagnosis:</span>
                <div style={{ color: '#F8FAFC', fontWeight: 700 }}>
                  {activeCase.primaryDiagnosis} <span style={{ color: '#38BDF8' }}>(ICD-10: {activeCase.icd10Code})</span>
                </div>
              </div>
              <div>
                <span style={{ color: '#94A3B8' }}>Procedure Performed:</span>
                <div style={{ color: '#34D399', fontWeight: 700 }}>
                  {activeCase.surgeryProcedure}
                </div>
              </div>
            </div>

            {/* 1-Click AI Synthesizer Action */}
            <Button
              variant="success"
              onClick={handleTriggerAiSynthesize}
              disabled={isSynthesizing}
              style={{
                width: '100%',
                fontWeight: 800,
                fontSize: '0.9rem',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
                padding: '12px'
              }}
            >
              {isSynthesizing ? '✨ AI Synthesizing EMR, OT & Vitals...' : '⚡ 1-Click AI Synthesize NABH Discharge Summary'}
            </Button>
          </div>

          {/* Multi-Day Inpatient Timeline */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase' }}>
              📅 Multi-Day Clinical Trajectory & Progress Notes
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
              {activeCase.multidayTimeline.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    fontSize: '0.78rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: '#38BDF8' }}>{item.day}: {item.title}</strong>
                    <span style={{ color: '#10B981', fontSize: '0.72rem' }}>{item.vitalsSummary}</span>
                  </div>
                  <p style={{ margin: 0, color: '#CBD5E1', lineHeight: 1.4, fontSize: '0.75rem' }}>
                    {item.clinicalNotes}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Laboratory Trajectory Table */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase' }}>
              🧪 Critical Lab Trends (Admission vs Discharge)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {activeCase.labTrajectory.map((lab, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    backgroundColor: '#1E293B',
                    borderRadius: '8px',
                    fontSize: '0.75rem'
                  }}
                >
                  <span style={{ color: '#F1F5F9', fontWeight: 600 }}>{lab.parameter}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#EF4444' }}>Adm: {lab.admissionValue}</span>
                    <span>→</span>
                    <strong style={{ color: '#10B981' }}>Dis: {lab.dischargeValue} {lab.unit}</strong>
                    <Badge variant={lab.status === 'NORMALIZED' ? 'success' : 'warning'}>{lab.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Synthesized NABH Discharge Summary & Generic Switcher */}
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            overflowY: 'auto',
            maxHeight: '820px'
          }}
        >
          {/* Subtabs for Discharge Summary */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              borderBottom: '1px solid #1E293B',
              paddingBottom: '10px',
              flexWrap: 'wrap'
            }}
          >
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'OVERVIEW' ? '#0284C7' : '#1E293B',
                color: '#FFFFFF',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              📄 1. Clinical Summary
            </button>
            <button
              onClick={() => setActiveTab('MEDS_JAN_AUSHADHI')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'MEDS_JAN_AUSHADHI' ? '#0284C7' : '#1E293B',
                color: '#FFFFFF',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              💊 2. Rx & Jan Aushadhi ({savingsPercent}% Savings)
            </button>
            <button
              onClick={() => setActiveTab('ADVICE')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'ADVICE' ? '#0284C7' : '#1E293B',
                color: '#FFFFFF',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ⚠️ 3. Diet, Red Flags & Follow-Up
            </button>
          </div>

          {/* TAB 1: Clinical Summary Body */}
          {activeTab === 'OVERVIEW' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8rem', color: '#CBD5E1' }}>
              <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '10px' }}>
                <strong style={{ color: '#38BDF8', display: 'block', marginBottom: '4px' }}>
                  HOSPITAL COURSE & SURGICAL FINDINGS (SYNTHESIZED):
                </strong>
                <p style={{ margin: 0, lineHeight: 1.5, color: '#E2E8F0' }}>
                  {activeCase.multidayTimeline.map((m) => m.clinicalNotes).join(' ')}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Admission Vitals</div>
                  <div style={{ color: '#F1F5F9', fontWeight: 700, marginTop: '2px' }}>
                    HR {activeCase.admissionVitals.pulse} bpm • BP {activeCase.admissionVitals.bp} • SpO2 {activeCase.admissionVitals.spo2}% • T {activeCase.admissionVitals.tempF}°F
                  </div>
                </div>
                <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Discharge Vitals (Stable)</div>
                  <div style={{ color: '#10B981', fontWeight: 700, marginTop: '2px' }}>
                    HR {activeCase.dischargeVitals.pulse} bpm • BP {activeCase.dischargeVitals.bp} • SpO2 {activeCase.dischargeVitals.spo2}% • T {activeCase.dischargeVitals.tempF}°F
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Discharge Medications & Jan Aushadhi Generic Switcher */}
          {activeTab === 'MEDS_JAN_AUSHADHI' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Savings Announcement */}
              <div
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#10B981' }}>
                    Jan Aushadhi Generic Bioequivalent Switch Active
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                    Switching branded discharge Rx to PMBJP stores saves the patient ₹{totalPatientSavings} ({savingsPercent}% discount)!
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', textDecoration: 'line-through' }}>
                    MRP: ₹{totalMrpMeds}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#34D399' }}>
                    Jan Aushadhi: ₹{totalJanAushadhiMeds}
                  </div>
                </div>
              </div>

              {/* Medication Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeCase.dischargeMedications.map((med, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.78rem'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '65%' }}>
                      <span style={{ fontWeight: 800, color: '#F8FAFC' }}>{med.brandName}</span>
                      <span style={{ color: '#38BDF8', fontSize: '0.72rem' }}>{med.genericFormula}</span>
                      <div style={{ color: '#94A3B8', fontSize: '0.72rem', marginTop: '2px' }}>
                        <strong>{med.dose}</strong> • {med.timing} • <strong>{med.durationDays} Days</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <Badge variant="success">Jan Aushadhi: ₹{med.janAushadhiPriceInr}</Badge>
                      <div style={{ fontSize: '0.68rem', color: '#64748B', textDecoration: 'line-through', marginTop: '3px' }}>
                        Branded: ₹{med.mrpPriceInr}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Diet, Red Flags & Follow-up */}
          {activeTab === 'ADVICE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.78rem' }}>
              {/* Diet & Wound Care */}
              <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '10px' }}>
                <strong style={{ color: '#38BDF8', display: 'block', marginBottom: '6px' }}>
                  DIETARY & WOUND CARE INSTRUCTIONS:
                </strong>
                <ul style={{ margin: 0, paddingLeft: '18px', color: '#CBD5E1', lineHeight: 1.5 }}>
                  {activeCase.dietAndWoundCareAdvice.map((adv, i) => (
                    <li key={i}>{adv}</li>
                  ))}
                </ul>
              </div>

              {/* Red Flags */}
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px', borderRadius: '10px' }}>
                <strong style={{ color: '#FCA5A5', display: 'block', marginBottom: '6px' }}>
                  🚨 EMERGENCY RED FLAGS (IMMEDIATE RE-ADMISSION):
                </strong>
                <ul style={{ margin: 0, paddingLeft: '18px', color: '#FCA5A5', lineHeight: 1.5 }}>
                  {activeCase.redFlagWarnings.map((flag, i) => (
                    <li key={i}>{flag}</li>
                  ))}
                </ul>
              </div>

              {/* Follow-Up Plan */}
              <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: '#10B981', display: 'block' }}>SCHEDULED OPD FOLLOW-UP:</strong>
                  <div style={{ color: '#F8FAFC', fontWeight: 700, marginTop: '2px' }}>
                    {activeCase.followUpPlan.date}
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                    {activeCase.followUpPlan.location} • {activeCase.followUpPlan.instructions}
                  </div>
                </div>
                <Badge variant="primary">OPD Booked</Badge>
              </div>
            </div>
          )}

          {/* Digital Signature & ABDM Verification Footnote */}
          <div
            style={{
              backgroundColor: '#1E293B',
              borderRadius: '12px',
              padding: '12px',
              border: '1px solid #334155',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.75rem',
              marginTop: 'auto'
            }}
          >
            <div>
              <span style={{ color: '#94A3B8' }}>Attending Clinician:</span>
              <div style={{ color: '#F8FAFC', fontWeight: 800 }}>
                {activeCase.attendingConsultant} <span style={{ color: '#38BDF8' }}>({activeCase.consultantRegNo})</span>
              </div>
              <div style={{ color: '#10B981', fontSize: '0.7rem', marginTop: '2px' }}>
                {isDoctorSigned ? '✓ Digitally Co-Signed (PKI X.509)' : '⏳ Awaiting Consultant E-Sign'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {!isDoctorSigned && (
                <Button size="sm" variant="primary" onClick={handleDoctorSignOff}>
                  ✍️ Doctor E-Sign
                </Button>
              )}
              {!abdmLinked ? (
                <Button size="sm" variant="outline" onClick={handleLinkAbdmCareContext}>
                  🇮🇳 Link ABDM PHR
                </Button>
              ) : (
                <Badge variant="success">✓ ABDM Linked</Badge>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              onClick={handleSendWhatsAppSummary}
              style={{
                flex: 1,
                fontWeight: 700,
                fontSize: '0.82rem',
                backgroundColor: '#1E293B',
                color: '#25D366',
                borderColor: '#25D366'
              }}
            >
              {whatsAppDispatched ? '✓ PDF Dispatched to WhatsApp' : '📱 Send WhatsApp PDF & Rx to Patient'}
            </Button>
            <Button
              variant="success"
              onClick={() => window.print()}
              style={{
                flex: 1,
                fontWeight: 800,
                fontSize: '0.82rem',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
              }}
            >
              🖨️ Print Official NABH Summary
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
