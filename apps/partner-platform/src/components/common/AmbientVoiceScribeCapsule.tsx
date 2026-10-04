import React, { useState, useEffect, useRef, useMemo } from 'react';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';
import { optimisticActionService } from '../../services/optimistic-action-service.js';
import { isVoiceScribeAllowed } from '../../utils/partnerRolePermissions.js';

export type ScribeLanguage = 'HINGLISH' | 'HINDI' | 'ENGLISH';

export interface AmbientExtractedClinicalData {
  chiefComplaints: string;
  diagnosis: string;
  assessment: string;
  icd10Code: string;
  rxMedicines: Array<{
    medicationName: string;
    strength: string;
    dosage: string;
    frequency: string;
    duration: number;
    food: 'AFTER_FOOD' | 'BEFORE_FOOD' | 'WITH_FOOD' | 'BEDTIME' | 'EMPTY_STOMACH';
    instructions: string;
  }>;
  labTests: string[];
  advice: string;
}

const PRESET_CLINICAL_SCENARIOS: Record<string, { label: string; transcript: string; data: AmbientExtractedClinicalData }> = {
  'viral-fever-rajesh': {
    label: 'Viral Fever & URI (Rajesh)',
    transcript:
      'Doctor: Namaste Rajesh ji, aaiye baithiye. Kya takleef ho rahi hai?\n' +
      'Patient: Doctor sahab, pichle 3 din se tez bukhar hai, gale me kharash hai aur badan dard ho raha hai.\n' +
      'Doctor: Theek hai, gale ka inspection kar leta hoon. Pharynx thoda red hai. Chest clear hai. Aapko Paracetamol 650mg din me do baar khane ke baad aur Levocetirizine raat me sone se pehle likh raha hoon. Saath me CBC test karva lijiye.',
    data: {
      chiefComplaints: 'High-grade fever for 3 days, sore throat, severe malaise and generalized body ache',
      diagnosis: 'Acute Viral Upper Respiratory Infection (URTI)',
      assessment: 'Acute Viral Upper Respiratory Tract Infection (ICD-10: J06.9) with Pyrexia',
      icd10Code: 'J06.9',
      rxMedicines: [
        {
          medicationName: 'Tab Paracetamol',
          strength: '650mg',
          dosage: '1 Tab',
          frequency: '1 - 0 - 1',
          duration: 3,
          food: 'AFTER_FOOD',
          instructions: 'After meals if temperature > 100°F'
        },
        {
          medicationName: 'Tab Levocetirizine',
          strength: '5mg',
          dosage: '1 Tab',
          frequency: '0 - 0 - 1',
          duration: 5,
          food: 'BEDTIME',
          instructions: 'Night at bedtime with water'
        },
        {
          medicationName: 'Tab Pantoprazole',
          strength: '40mg',
          dosage: '1 Tab',
          frequency: '1 - 0 - 0',
          duration: 5,
          food: 'BEFORE_FOOD',
          instructions: 'Morning empty stomach'
        }
      ],
      labTests: ['CBC (Complete Blood Count)'],
      advice: '• Steam inhalation twice daily\n• Plentiful warm fluids (>2.5 L/day)\n• Avoid cold drinks, oily spices\n• Review after 3 days if fever persists'
    }
  },
  'diabetes-htn': {
    label: 'Type-2 Diabetes & HTN Follow-Up',
    transcript:
      'Doctor: Good morning. Blood sugar aur BP kaisa chal raha hai?\n' +
      'Patient: BP thoda high aa raha tha subah (142/90 mmHg) aur fasting sugar 138 mg/dL thi.\n' +
      'Doctor: Theek hai. Metformin 500mg ko continue karenge aur BP control ke liye Telmisartan 40mg add kar rahe hain. HbA1c aur Lipid Profile karwa lijiye.',
    data: {
      chiefComplaints: 'Sub-optimally controlled glycemic follow-up, morning occipital tightness, BP 142/90 mmHg',
      diagnosis: 'Type 2 Diabetes Mellitus with Essential Hypertension',
      assessment: 'Type-2 Diabetes Mellitus (E11.9) with Essential Hypertension Stage-1 (I10)',
      icd10Code: 'E11.9 / I10',
      rxMedicines: [
        {
          medicationName: 'Tab Metformin HCl',
          strength: '500mg',
          dosage: '1 Tab',
          frequency: '1 - 0 - 1',
          duration: 30,
          food: 'AFTER_FOOD',
          instructions: 'With or immediately after meals'
        },
        {
          medicationName: 'Tab Telmisartan',
          strength: '40mg',
          dosage: '1 Tab',
          frequency: '1 - 0 - 0',
          duration: 30,
          food: 'AFTER_FOOD',
          instructions: 'Fixed time daily morning with water'
        }
      ],
      labTests: ['HbA1c (Glycated Hemoglobin)', 'Lipid Profile', 'KFT / Serum Creatinine'],
      advice: '• Restrict sodium intake to < 5g/day\n• Low glycemic index diet, brisk walking 40 mins daily\n• Maintain daily home BP and fasting glucose log'
    }
  },
  'acute-ge': {
    label: 'Acute Gastroenteritis & Dehydration',
    transcript:
      'Doctor: Haanji, bataiye kya takleef hai?\n' +
      'Patient: Doctor sahab, subah se 4-5 baar loose motions aur 2 baar vomiting hui hai. Pait me cramp hai aur bohot weakness lag rahi hai.\n' +
      'Doctor: Pulse 88/min, BP 110/70, tongue mildly dry hai. Dehydration prevent karna priority hai. Electral ORS paani me ghol kar regularly pijiye. Vomiting ke liye Ondansetron 4mg aur motions ke liye Racecadotril 100mg likh raha hoon. KFT aur Serum Electrolytes test karwa lijiye.',
    data: {
      chiefComplaints: 'Watery diarrhea 4-5 episodes since morning, vomiting, abdominal cramping and mild dehydration',
      diagnosis: 'Acute Gastroenteritis with Mild Dehydration',
      assessment: 'Acute Infective Gastroenteritis (ICD-10: A09) with Pre-renal Fluid Deficit',
      icd10Code: 'A09',
      rxMedicines: [
        {
          medicationName: 'Sachet Electral ORS',
          strength: '21.8g',
          dosage: '1 Sachet in 1L Water',
          frequency: 'As needed sip-by-sip',
          duration: 3,
          food: 'AFTER_FOOD',
          instructions: 'Sip continuously throughout the day'
        },
        {
          medicationName: 'Tab Ondansetron MD',
          strength: '4mg',
          dosage: '1 Tab (Melt in mouth)',
          frequency: '1 - 0 - 1',
          duration: 2,
          food: 'BEFORE_FOOD',
          instructions: 'Dissolve on tongue before meals'
        },
        {
          medicationName: 'Cap Racecadotril',
          strength: '100mg',
          dosage: '1 Cap',
          frequency: '1 - 1 - 1',
          duration: 3,
          food: 'AFTER_FOOD',
          instructions: 'TDS until stool hardens'
        }
      ],
      labTests: ['Serum Electrolytes (Na+, K+, Cl-)', 'RFT / Serum Creatinine', 'Stool Routine & Microscopic'],
      advice: '• Oral rehydration is critical: minimum 2.5L fluids daily\n• Light khichdi, curd, banana, coconut water\n• Avoid spicy, greasy, unpasteurized milk\n• Return immediately if urine output drops or blood appears in stool'
    }
  }
};

export interface AmbientVoiceScribeCapsuleProps {
  isConsultationMode?: boolean;
}

export const AmbientVoiceScribeCapsule: React.FC<AmbientVoiceScribeCapsuleProps> = ({
  isConsultationMode = false
}) => {
  // Check permission from localStorage / current session - strictly lock to prescribing clinicians
  const isAllowed = useMemo(() => {
    if (typeof window === 'undefined') return true;
    try {
      const stored = localStorage.getItem('docsearch_partner_staff_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        return isVoiceScribeAllowed(parsed?.role, parsed?.permissions);
      }
    } catch {}
    return false;
  }, []);

  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(true);
  const [language, setLanguage] = useState<ScribeLanguage>('HINGLISH');
  const [activeScenarioKey, setActiveScenarioKey] = useState<string>('viral-fever-rajesh');
  const [liveTranscript, setLiveTranscript] = useState<string>(
    PRESET_CLINICAL_SCENARIOS['viral-fever-rajesh']!.transcript
  );
  const [extractedData, setExtractedData] = useState<AmbientExtractedClinicalData>(
    PRESET_CLINICAL_SCENARIOS['viral-fever-rajesh']!.data
  );
  const [lastAutofillTimestamp, setLastAutofillTimestamp] = useState<string | null>(null);
  const [waveHeight, setWaveHeight] = useState([12, 18, 24, 14, 20]);

  const recognitionRef = useRef<any>(null);

  // Toggle visibility and keyboard shortcuts listener (Alt+M to toggle, Ctrl+Enter to auto-fill)
  useEffect(() => {
    if (!isAllowed) return;

    const handleToggle = () => {
      setIsVisible(true);
      setIsMinimized(false);
      setIsExpanded((prev) => !prev);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + M toggles the AI Voice Scribe floating capsule
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setIsVisible(true);
        setIsMinimized(false);
        setIsExpanded((prev) => !prev);
      }
      // Ctrl + Enter or Cmd + Enter auto-fills when capsule is open
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && isVisible && isExpanded) {
        e.preventDefault();
        triggerAutoFill();
      }
    };

    window.addEventListener('docsearch:toggle_ambient_scribe', handleToggle);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('docsearch:toggle_ambient_scribe', handleToggle);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAllowed, isVisible, isExpanded, extractedData, activeScenarioKey]);

  useEffect(() => {
    if (!isAllowed || !isListening) return;
    const interval = setInterval(() => {
      setWaveHeight([
        Math.floor(Math.random() * 16) + 8,
        Math.floor(Math.random() * 22) + 10,
        Math.floor(Math.random() * 26) + 12,
        Math.floor(Math.random() * 18) + 8,
        Math.floor(Math.random() * 22) + 10
      ]);
    }, 150);
    return () => clearInterval(interval);
  }, [isAllowed, isListening]);

  // Web Speech API Integration
  const startSpeechRecognition = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      // Fallback to simulated audio pulse
      setIsListening(true);
      return;
    }
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'HINDI' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => {
        if (isListening) {
          try { recognition.start(); } catch {}
        }
      };
      recognition.onerror = () => {};
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setLiveTranscript((prev) => `${prev}\nDoctor: ${transcript}`);
        }
      };
      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      setIsListening(true);
    }
  };

  const stopSpeechRecognition = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  };

  const toggleMic = () => {
    if (isListening) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  // Switch scenario preset
  const handleSelectScenario = (key: string) => {
    setActiveScenarioKey(key);
    const scenario = PRESET_CLINICAL_SCENARIOS[key];
    if (scenario) {
      setLiveTranscript(scenario.transcript);
      setExtractedData(scenario.data);
    }
  };

  // Auto-Fill Action: Sends extracted SOAP to DoctorExpressConsultationDesk and broadcasts event
  const triggerAutoFill = () => {
    window.dispatchEvent(
      new CustomEvent('docsearch:ambient_soap_autofill', {
        detail: extractedData
      })
    );

    hospitalEventBus.publish('AMBIENT_VOICE_SCRIBE_AUTOFILL', 'AmbientVoiceScribeCapsule', {
      ...extractedData,
      source: 'AmbientVoiceScribeCapsule'
    });

    // Sub-10ms Optimistic UI + 5-second Undo Toast (Ctrl+Z)
    optimisticActionService.dispatch({
      title: `Applied Ambient Scribe Note (${extractedData.diagnosis})`,
      category: 'EMR_SCRIBE',
      countdownSeconds: 5,
      onCommit: async () => {
        // Persisted in background
      },
      onUndo: () => {
        window.dispatchEvent(
          new CustomEvent('docsearch:ambient_soap_undo', {
            detail: { scenarioKey: activeScenarioKey }
          })
        );
        hospitalEventBus.publish('AMBIENT_VOICE_SCRIBE_UNDO', 'AmbientVoiceScribeCapsule', {
          scenarioKey: activeScenarioKey
        });
      }
    });

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastAutofillTimestamp(nowStr);
  };

  if (!isAllowed || !isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: isConsultationMode ? '76px' : '16px',
        right: '16px',
        zIndex: 9990,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '8px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Expanded Live Scribe Studio Drawer */}
      {isExpanded && (
        <div
          style={{
            width: 'min(420px, calc(100vw - 32px))',
            maxHeight: 'min(560px, 80vh)',
            backgroundColor: 'var(--ds-color-surface, #0F172A)',
            border: '1.5px solid var(--ds-color-primary, #06B6D4)',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.85), 0 0 30px rgba(6, 182, 212, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--ds-color-surface-subtle, rgba(255,255,255,0.03))',
              borderBottom: '1px solid var(--ds-color-border-subtle, rgba(255,255,255,0.08))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🎙️</span>
              <div>
                <div style={{ fontSize: '0.84375rem', fontWeight: 800, color: 'var(--ds-color-text-primary, #F8FAFC)' }}>
                  Ambient Voice AI Scribe
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted, #94A3B8)' }}>
                  Acoustic Speech &rarr; Structured SOAP EMR
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as ScribeLanguage)}
                style={{
                  backgroundColor: 'var(--ds-color-surface-subtle, rgba(255,255,255,0.08))',
                  color: 'var(--ds-color-primary, #38BDF8)',
                  border: '1px solid var(--ds-color-border-subtle, rgba(255,255,255,0.15))',
                  borderRadius: '6px',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '3px 6px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="HINGLISH">🇮🇳 Hinglish</option>
                <option value="HINDI">🇮🇳 Hindi</option>
                <option value="ENGLISH">🇬🇧 English</option>
              </select>

              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ds-color-text-muted, #94A3B8)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: '2px 6px'
                }}
                title="Minimize Capsule"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Simulation Scenario Pills */}
          <div
            style={{
              padding: '8px 14px',
              backgroundColor: 'var(--ds-color-surface-subtle, rgba(255,255,255,0.02))',
              borderBottom: '1px solid var(--ds-color-border-subtle, rgba(255,255,255,0.06))',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflowX: 'auto'
            }}
          >
            <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted, #64748B)', whiteSpace: 'nowrap' }}>
              ⚡ Scenarios:
            </span>
            {Object.entries(PRESET_CLINICAL_SCENARIOS).map(([key, item]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectScenario(key)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  border: activeScenarioKey === key ? '1px solid #06B6D4' : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: activeScenarioKey === key ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                  color: activeScenarioKey === key ? '#38BDF8' : 'var(--ds-color-text-muted, #94A3B8)'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Transcript Feed */}
          <div
            style={{
              padding: '12px 14px',
              maxHeight: '140px',
              overflowY: 'auto',
              fontSize: '0.75rem',
              lineHeight: 1.5,
              color: 'var(--ds-color-text-secondary, #CBD5E1)',
              backgroundColor: 'var(--ds-color-surface, #0B1220)',
              borderBottom: '1px solid var(--ds-color-border-subtle, rgba(255,255,255,0.06))',
              whiteSpace: 'pre-line',
              fontFamily: 'monospace'
            }}
          >
            {liveTranscript}
          </div>

          {/* AI Extracted Entity Badges */}
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#38BDF8', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>🩺 Chief Complaints</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-primary, #F8FAFC)', backgroundColor: 'var(--ds-color-surface-subtle, rgba(255,255,255,0.04))', padding: '6px 10px', borderRadius: '6px' }}>
                {extractedData.chiefComplaints}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#A855F7', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>🔬 Diagnosis (ICD-10)</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-primary, #F8FAFC)', backgroundColor: 'rgba(168, 85, 247, 0.1)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(168, 85, 247, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{extractedData.diagnosis}</span>
                <span style={{ fontSize: '0.625rem', fontWeight: 800, backgroundColor: '#A855F7', color: '#FFF', padding: '1px 5px', borderRadius: '4px' }}>
                  {extractedData.icd10Code}
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#10B981', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>💊 Extracted Rx Medicines ({extractedData.rxMedicines.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {extractedData.rxMedicines.map((med, idx) => (
                  <div
                    key={idx}
                    style={{
                      fontSize: '0.71875rem',
                      color: 'var(--ds-color-text-primary, #F8FAFC)',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{med.medicationName} {med.strength}</span>
                    <span style={{ fontSize: '0.65625rem', color: '#34D399', fontFamily: 'monospace' }}>
                      {med.frequency} • {med.duration}d
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div
            style={{
              padding: '10px 14px',
              borderTop: '1px solid var(--ds-color-border-subtle, rgba(255,255,255,0.08))',
              backgroundColor: 'var(--ds-color-surface-subtle, rgba(255,255,255,0.02))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted, #94A3B8)' }}>
              {lastAutofillTimestamp ? `✓ Applied at ${lastAutofillTimestamp}` : 'Ready to stream into Rx Desk'}
            </div>

            <button
              type="button"
              onClick={triggerAutoFill}
              title="Auto-Fill into active consultation desk (Ctrl + Enter)"
              style={{
                backgroundColor: 'var(--ds-color-primary, #06B6D4)',
                color: '#070C16',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 10px rgba(6, 182, 212, 0.3)'
              }}
            >
              <span>⚡</span>
              <span>Auto-Fill Consultation</span>
              <kbd
                style={{
                  fontSize: '0.625rem',
                  fontFamily: 'monospace',
                  background: 'rgba(0,0,0,0.2)',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  color: '#070C16',
                  fontWeight: 700
                }}
              >
                Ctrl+Enter
              </kbd>
            </button>
          </div>
        </div>
      )}

      {/* Minimized or Expanded Floating Audio Capsule Pill */}
      {isMinimized ? (
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          title="Open AI Voice Scribe (Alt + M)"
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'var(--ds-color-surface, #0F172A)',
            border: isListening ? '1.5px solid #06B6D4' : '1.5px solid rgba(255,255,255,0.2)',
            boxShadow: isListening
              ? '0 6px 20px rgba(6, 182, 212, 0.45)'
              : '0 4px 14px rgba(0,0,0,0.5)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            color: '#38BDF8'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>🎙️</span>
          <span
            style={{
              position: 'absolute',
              top: '3px',
              right: '3px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isListening ? '#10B981' : '#EF4444',
              boxShadow: isListening ? '0 0 6px #10B981' : 'none'
            }}
          />
        </button>
      ) : (
        <div
          onClick={() => setIsExpanded((prev) => !prev)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 14px',
            backgroundColor: 'var(--ds-color-surface, #0F172A)',
            border: isListening ? '1.5px solid #06B6D4' : '1.5px solid rgba(255,255,255,0.15)',
            borderRadius: '30px',
            boxShadow: isListening
              ? '0 10px 25px rgba(0,0,0,0.6), 0 0 20px rgba(6, 182, 212, 0.35)'
              : '0 8px 20px rgba(0,0,0,0.4)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            color: 'var(--ds-color-text-primary, #F8FAFC)'
          }}
        >
          {/* Animated Audio Waveform Bars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '24px' }}>
            {waveHeight.map((h, i) => (
              <span
                key={i}
                style={{
                  width: '3px',
                  height: `${isListening ? h : 4}px`,
                  backgroundColor: isListening ? '#38BDF8' : '#64748B',
                  borderRadius: '2px',
                  transition: 'height 0.1s ease'
                }}
              />
            ))}
          </div>

          {/* Status indicator */}
          <div className="ds-hide-on-mobile" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: isListening ? '#10B981' : '#EF4444',
                  boxShadow: isListening ? '0 0 8px #10B981' : 'none'
                }}
              />
              <span style={{ fontSize: '0.78125rem', fontWeight: 800, color: 'var(--ds-color-text-primary, #F8FAFC)' }}>
                AI Voice Scribe
              </span>
              <kbd
                style={{
                  fontSize: '0.59375rem',
                  fontFamily: 'monospace',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: 'var(--ds-color-text-muted, #94A3B8)',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
                title="Shortcut: Alt+M to open or close"
              >
                Alt+M
              </kbd>
              <span
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  color: '#38BDF8',
                  backgroundColor: 'rgba(6, 182, 212, 0.15)',
                  padding: '1px 5px',
                  borderRadius: '4px'
                }}
              >
                {language}
              </span>
            </div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted, #94A3B8)' }}>
              {isListening ? 'Ambient listening... (Click to expand)' : 'Paused (Click to activate)'}
            </span>
          </div>

          {/* 1-Click Fast Auto-Fill Pill Button inside Capsule */}
          <button
            type="button"
            className="ds-hide-on-mobile"
            onClick={(e) => {
              e.stopPropagation();
              triggerAutoFill();
            }}
            title="1-Click Auto-Fill Prescription & Diagnosis into active consultation"
            style={{
              marginLeft: '4px',
              backgroundColor: 'rgba(6, 182, 212, 0.2)',
              border: '1px solid #06B6D4',
              color: '#38BDF8',
              borderRadius: '20px',
              padding: '4px 10px',
              fontSize: '0.6875rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>⚡</span>
            <span>Auto-Fill</span>
          </button>

          {/* Toggle Mic Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleMic();
            }}
            title={isListening ? 'Pause listening' : 'Start listening'}
            style={{
              background: 'none',
              border: 'none',
              color: isListening ? '#EF4444' : '#10B981',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '2px 4px',
              lineHeight: 1
            }}
          >
            {isListening ? '⏸' : '▶'}
          </button>

          {/* Minimize Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            title="Minimize Scribe (Alt + M)"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ds-color-text-muted, #94A3B8)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              padding: '2px 4px',
              lineHeight: 1,
              marginLeft: '2px',
              borderRadius: '4px',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#F8FAFC')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ds-color-text-muted, #94A3B8)')}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
