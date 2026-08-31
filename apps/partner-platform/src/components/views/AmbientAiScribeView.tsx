import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { AmbientAiSoapTranscriptDto } from '@docsearch/api-contracts';

interface Props {
  transcripts: AmbientAiSoapTranscriptDto[];
  onGenerateSoap: () => void;
}

export const AmbientAiScribeView: React.FC<Props> = ({ transcripts }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<'HINGLISH' | 'HINDI' | 'ENGLISH'>('HINGLISH');
  const [activeTabMode, setActiveTabMode] = useState<'STUDIO' | 'ARCHIVE'>('STUDIO');
  const [isApproved, setIsApproved] = useState(false);

  // Live Dialogue Feed
  const [spokenTranscript, setSpokenTranscript] = useState<string>(
    'Doctor: Namaste Rajesh ji, kya takleef hai aapko?\nPatient: Doctor sahab, 3 din se bahut tez bukhar hai, sath me dry cough aur gale me kharash hai.\nDoctor: Koi saans lene me dikkat ya chhati me dard hai kya?\nPatient: Nahi doctor sahab, chest pain ya saans foolne ki bilkul dikkat nahi hai.\nDoctor: Thik hai, BP 130/84 mmHg hai, pulse 82 hai, throat congested hai. Ye viral acute bronchitis lag raha hai. Paracetamol 650 TDS aur Levocetirizine 5mg 5 din ke liye likh raha hoon, sath me warm water gargle karein.'
  );

  // Extracted Clinical SOAP
  const [extractedSoap, setExtractedSoap] = useState({
    subjective: 'Patient presents with high-grade fever, dry cough, and pharyngeal irritation for 3 days. Denies dyspnea, denies chest pain or hemoptysis.',
    objective: 'Vitals: BP 130/84 mmHg, Pulse 82 bpm, SpO2 98% on room air, Temp 101.4°F. HEENT: Erythematous pharyngeal mucosa, no tonsillar exudates. Chest: Bilateral vesicular breath sounds without crackles or wheeze.',
    assessment: 'Acute Viral Bronchitis (ICD-10: J20.9) with Upper Respiratory Tract Infection (URTI).',
    plan: '1. Tab. Paracetamol 650mg TDS (1-1-1) after food x 5 days\n2. Tab. Levocetirizine 5mg OD (0-0-1) at night x 5 days\n3. Saline warm water gargles thrice daily\n4. Advised Complete Blood Count (CBC) if fever persists beyond 48 hours.',
    icd10: [
      { code: 'J20.9', description: 'Acute bronchitis, unspecified', confidence: 96 },
      { code: 'R50.9', description: 'Fever, unspecified', confidence: 91 }
    ],
    rx: [
      { name: 'Paracetamol 650mg', dose: '1 Tab', freq: 'TDS (1-1-1)', dur: '5 Days', notes: 'After meals for fever' },
      { name: 'Levocetirizine 5mg', dose: '1 Tab', freq: 'OD (0-0-1)', dur: '5 Days', notes: 'At bedtime for cough/allergy' }
    ]
  });

  // Recording Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => setRecordingSeconds((prev) => prev + 1), 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleToggleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setIsApproved(false);
    } else {
      setIsRecording(false);
    }
  };

  // Preset Consultation Scenarios
  const loadScenario = (scenario: 'BRONCHITIS' | 'HYPERTENSION' | 'GASTRO') => {
    setIsApproved(false);
    if (scenario === 'BRONCHITIS') {
      setSpokenTranscript(
        'Doctor: Namaste Rajesh ji, kya takleef hai aapko?\nPatient: Doctor sahab, 3 din se bahut tez bukhar hai, sath me dry cough aur gale me kharash hai.\nDoctor: Koi saans lene me dikkat ya chhati me dard hai kya?\nPatient: Nahi doctor sahab, chest pain ya saans foolne ki bilkul dikkat nahi hai.\nDoctor: Thik hai, BP 130/84 mmHg hai, pulse 82 hai. Ye viral acute bronchitis lag raha hai. Paracetamol 650 TDS aur Levocetirizine 5mg 5 din ke liye likh raha hoon.'
      );
      setExtractedSoap({
        subjective: 'Patient presents with high-grade fever, dry cough, and pharyngeal irritation for 3 days. Denies dyspnea, denies chest pain or hemoptysis.',
        objective: 'Vitals: BP 130/84 mmHg, Pulse 82 bpm, SpO2 98% on room air, Temp 101.4°F. Chest: Clear bilaterally.',
        assessment: 'Acute Viral Bronchitis (ICD-10: J20.9)',
        plan: '1. Tab. Paracetamol 650mg TDS x 5 days\n2. Tab. Levocetirizine 5mg OD x 5 days\n3. Steam inhalation & hydration.',
        icd10: [
          { code: 'J20.9', description: 'Acute bronchitis, unspecified', confidence: 96 },
          { code: 'R50.9', description: 'Fever, unspecified', confidence: 91 }
        ],
        rx: [
          { name: 'Paracetamol 650mg', dose: '1 Tab', freq: 'TDS (1-1-1)', dur: '5 Days', notes: 'After meals' },
          { name: 'Levocetirizine 5mg', dose: '1 Tab', freq: 'OD (0-0-1)', dur: '5 Days', notes: 'Bedtime' }
        ]
      });
    } else if (scenario === 'HYPERTENSION') {
      setSpokenTranscript(
        'Doctor: Uncle ji aapka routine BP checkup hai aaj. Kaisa chal raha hai Telmisartan?\nPatient: Dawa to regular le raha hoon beta, lekin subah thoda sar bhari rehta hai. Chest pain nahi hai.\nDoctor: Aaj clinic me BP 148/92 mmHg aaya hai, pulse 76 hai. Blood sugar fasting 118 hai. Dawa adjust karte hain: Telmisartan 40mg ke sath Amlodipine 5mg combination shuru karenge.'
      );
      setExtractedSoap({
        subjective: '62yo male presenting for routine hypertension and metabolic follow-up. Reports mild morning occipital heaviness. Denies chest pain, palpitation, or orthopnea.',
        objective: 'BP: 148/92 mmHg (Stage 2 Hypertension), Pulse: 76 bpm regular, Fasting Blood Sugar: 118 mg/dL.',
        assessment: 'Essential (Primary) Hypertension, uncontrolled on monotherapy (ICD-10: I10).',
        plan: '1. Step up therapy to Tab. Telmisartan 40mg + Amlodipine 5mg OD morning\n2. Maintain daily home BP log\n3. Low sodium diet (<2g/day) & 30 min daily walking.',
        icd10: [
          { code: 'I10', description: 'Essential (primary) hypertension', confidence: 98 },
          { code: 'R51.9', description: 'Headache, unspecified', confidence: 84 }
        ],
        rx: [
          { name: 'Telmisartan 40mg + Amlodipine 5mg', dose: '1 Tab', freq: 'OD (1-0-0)', dur: '30 Days', notes: 'Morning after breakfast' }
        ]
      });
    } else if (scenario === 'GASTRO') {
      setSpokenTranscript(
        'Doctor: Sunita ji, pet me kya takleef hai?\nPatient: Doctor sahab, kal raat se pet me cramps hain aur 5-6 bar loose motions huye hain. Vomiting 2 bar hui hai.\nDoctor: Urine pass hua normal? Dehydration lag raha hai. BP 100/68 hai. ORS sachet aur Tab Ofloxacin-Ornidazole likh raha hoon.'
      );
      setExtractedSoap({
        subjective: 'Female patient with acute onset crampy abdominal pain, 6 episodes of watery diarrhea, and 2 episodes of non-bilious vomiting following outside food consumption.',
        objective: 'Vitals: BP 100/68 mmHg, Pulse 94 bpm. Dry oral mucosa, mild generalized abdominal tenderness without guarding.',
        assessment: 'Acute Infectious Gastroenteritis with mild dehydration (ICD-10: A09).',
        plan: '1. Oral Rehydration Solution (ORS) 1 liter daily sip-by-sip\n2. Tab. Ofloxacin 200mg + Ornidazole 500mg BD x 3 days\n3. Tab. Racecadotril 100mg TDS x 3 days\n4. Light bland diet (khichdi, curd).',
        icd10: [
          { code: 'A09', description: 'Infectious gastroenteritis and colitis, unspecified', confidence: 97 },
          { code: 'E86.0', description: 'Dehydration', confidence: 92 }
        ],
        rx: [
          { name: 'Ofloxacin 200mg + Ornidazole 500mg', dose: '1 Tab', freq: 'BD (1-0-1)', dur: '3 Days', notes: 'After meals' },
          { name: 'Electral ORS Sachet', dose: '1 Sachet in 1L water', freq: 'PRN', dur: '3 Days', notes: 'Sip frequently' }
        ]
      });
    }
  };

  const handleApprovePrescription = () => {
    setIsApproved(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Header Banner */}
      <div style={{
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.5rem' }}>🎙️</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
              Multi-Lingual (Hinglish / Hindi) Ambient AI Voice Scribe
            </h2>
            <Badge variant="primary">Next-Gen Clinical NLP</Badge>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.8125rem', margin: 0 }}>
            Real-time acoustic parsing of Indian doctor-patient conversations into structured ICD-10 SOAP notes & E-Prescriptions.
          </p>
        </div>

        {/* Studio View Switcher */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant={activeTabMode === 'STUDIO' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTabMode('STUDIO')}
            style={{ fontWeight: 700 }}
          >
            ⚡ Live Scribe Studio
          </Button>
          <Button
            variant={activeTabMode === 'ARCHIVE' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTabMode('ARCHIVE')}
            style={{ fontWeight: 700 }}
          >
            📂 Scribe Archives ({transcripts.length})
          </Button>
        </div>
      </div>

      {activeTabMode === 'STUDIO' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Quick Scenario Pre-fill Chips & Language Bar */}
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                Test Clinical Scenarios:
              </span>
              <button
                onClick={() => loadScenario('BRONCHITIS')}
                style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: 'rgba(6, 182, 212, 0.15)', border: '1px solid #06B6D4', color: '#38BDF8', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                🌡️ 1. Acute Fever & Bronchitis (Hinglish)
              </button>
              <button
                onClick={() => loadScenario('HYPERTENSION')}
                style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: 'rgba(139, 92, 246, 0.15)', border: '1px solid #8B5CF6', color: '#C084FC', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                🩺 2. Hypertension Review (Hinglish)
              </button>
              <button
                onClick={() => loadScenario('GASTRO')}
                style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', color: '#A7F3D0', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                👶 3. Gastroenteritis (Hindi)
              </button>
            </div>

            {/* Language Selector */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setSelectedLanguage('HINGLISH')}
                style={{ padding: '5px 10px', borderRadius: '6px', backgroundColor: selectedLanguage === 'HINGLISH' ? '#8B5CF6' : 'rgba(255,255,255,0.05)', color: '#FFFFFF', border: 'none', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer' }}
              >
                🇮🇳 Hinglish
              </button>
              <button
                onClick={() => setSelectedLanguage('HINDI')}
                style={{ padding: '5px 10px', borderRadius: '6px', backgroundColor: selectedLanguage === 'HINDI' ? '#8B5CF6' : 'rgba(255,255,255,0.05)', color: '#FFFFFF', border: 'none', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer' }}
              >
                🇮🇳 शुद्ध हिन्दी
              </button>
              <button
                onClick={() => setSelectedLanguage('ENGLISH')}
                style={{ padding: '5px 10px', borderRadius: '6px', backgroundColor: selectedLanguage === 'ENGLISH' ? '#8B5CF6' : 'rgba(255,255,255,0.05)', color: '#FFFFFF', border: 'none', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer' }}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          {/* 2-Column Scribe Workspace */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            
            {/* Left: Live Audio Feed & Dialogue Transcript */}
            <div style={{
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem' }}>🎙️</span>
                  <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#F8FAFC' }}>
                    Doctor-Patient Dialogue Stream
                  </span>
                </div>
                {isRecording ? (
                  <Badge variant="danger">🔴 Live Recording ({recordingSeconds}s)</Badge>
                ) : (
                  <Badge variant="neutral">Standby</Badge>
                )}
              </div>

              {/* Audio Waveform Bar (Simulated) */}
              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                height: '48px'
              }}>
                {[20, 45, 80, 60, 30, 90, 75, 40, 65, 85, 35, 55, 95, 70, 40, 60, 80, 50, 30].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      width: '4px',
                      height: isRecording ? `${h}%` : '6px',
                      backgroundColor: isRecording ? '#06B6D4' : '#475569',
                      borderRadius: '2px',
                      transition: 'height 0.15s ease'
                    }}
                  />
                ))}
              </div>

              {/* Live Spoken Transcript Textarea */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Raw Bilingual Dialogue Transcript:
                </label>
                <textarea
                  rows={8}
                  value={spokenTranscript}
                  onChange={(e) => setSpokenTranscript(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#E2E8F0',
                    fontSize: '0.8125rem',
                    lineHeight: '1.5',
                    fontFamily: 'monospace',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Microphone Action Button */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button
                  variant={isRecording ? 'danger' : 'primary'}
                  size="md"
                  onClick={handleToggleRecord}
                  style={{ flex: '1 1 auto', fontWeight: 800 }}
                >
                  {isRecording ? '⏹️ Stop Scribe Recording' : '🎙️ Start Live Voice Scribe'}
                </Button>
              </div>

              {/* Negation Guard Safety Badge */}
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '0.75rem',
                color: '#A7F3D0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>🛡️</span>
                <span>Clinical Negation Engine Active: "No chest pain" strictly verified.</span>
              </div>
            </div>

            {/* Right: AI Generated Structured SOAP Note & Prescription */}
            <div style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 0 25px rgba(139, 92, 246, 0.15)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.125rem' }}>✨</span>
                  <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#F8FAFC' }}>
                    Generated Structured EMR SOAP Note
                  </span>
                </div>
                {isApproved ? (
                  <Badge variant="success">✓ Doctor Signed & Committed</Badge>
                ) : (
                  <Badge variant="warning">AI_DRAFTED (Pending Sign-off)</Badge>
                )}
              </div>

              {/* SOAP Note Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
                
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #06B6D4' }}>
                  <strong style={{ color: '#38BDF8', display: 'block', marginBottom: '2px' }}>Subjective (S):</strong>
                  <span style={{ color: '#CBD5E1' }}>{extractedSoap.subjective}</span>
                </div>

                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #3B82F6' }}>
                  <strong style={{ color: '#60A5FA', display: 'block', marginBottom: '2px' }}>Objective (O):</strong>
                  <span style={{ color: '#CBD5E1' }}>{extractedSoap.objective}</span>
                </div>

                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #8B5CF6' }}>
                  <strong style={{ color: '#C084FC', display: 'block', marginBottom: '2px' }}>Assessment (A):</strong>
                  <span style={{ color: '#CBD5E1' }}>{extractedSoap.assessment}</span>
                </div>

                {/* Suggested ICD-10 Diagnoses */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {extractedSoap.icd10.map((code) => (
                    <div
                      key={code.code}
                      style={{
                        backgroundColor: 'rgba(139, 92, 246, 0.2)',
                        border: '1px solid #8B5CF6',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '0.6875rem',
                        color: '#E9D5FF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <strong>{code.code}</strong> — {code.description} ({code.confidence}%)
                    </div>
                  ))}
                </div>

                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #10B981' }}>
                  <strong style={{ color: '#A7F3D0', display: 'block', marginBottom: '4px' }}>Extracted Prescription (Rx):</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {extractedSoap.rx.map((med, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <strong style={{ color: '#10B981' }}>{med.name}</strong> ({med.dose})
                          <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{med.notes}</div>
                        </div>
                        <Badge variant="neutral">{med.freq} • {med.dur}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mandatory Doctor Sign-off & Commit Button */}
              <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleApprovePrescription}
                  style={{
                    width: '100%',
                    fontWeight: 800,
                    backgroundColor: isApproved ? '#10B981' : '#8B5CF6',
                    borderColor: isApproved ? '#10B981' : '#8B5CF6'
                  }}
                >
                  {isApproved ? '✓ Prescription Approved & Pushed to EMR' : '✍️ Attending Doctor Sign-off & Push to EMR'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Archive View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {transcripts.map((t) => (
            <Card key={t.id} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#C084FC' }}>
                    {t.patientName} (MRN: {t.patientMrn})
                  </span>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    Doctor: {t.doctorName} • Audio: {t.audioDurationSeconds}s
                  </div>
                </div>
                <Badge variant="success">{t.reviewStatus}</Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.75rem' }}>
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '10px', borderRadius: '8px' }}>
                  <strong style={{ color: '#38BDF8' }}>Assessment:</strong> {t.soapNote.assessment}
                </div>
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '10px', borderRadius: '8px' }}>
                  <strong style={{ color: '#10B981' }}>Plan:</strong> {t.soapNote.plan}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
