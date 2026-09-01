import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyContent: (text: string) => void;
}

export const AiMultilingualCopywriterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onApplyContent
}) => {
  const [topic, setTopic] = useState('Dengue & Monsoon Fever Preventive Blood Test Camp');
  const [language, setLanguage] = useState<'Hindi' | 'English' | 'Hinglish' | 'Marathi' | 'Tamil' | 'Bengali'>('Hindi');
  const [tone, setTone] = useState<'EMPATHETIC_PATIENT' | 'SENIOR_CLINICAL' | 'URGENT_ALERT'>('EMPATHETIC_PATIENT');
  const [generatedOutput, setGeneratedOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      let content = '';
      if (language === 'Hindi') {
        content = `नमस्ते {{patient_name}},\n\nमानसून के मौसम में डेंगू और वायरल फीवर से बचाव के लिए {{hospital_name}} में निःशुल्क प्लेटलेट और सीबीसी हेल्थ चेकअप शुरू है।\n\nडॉक्टर से परामर्श या ब्लड टेस्ट बुक करने के लिए नीचे लिंक पर क्लिक करें:\n{{booking_link}}\n\n- स्वस्थ रहें, सुरक्षित रहें!\n{{hospital_name}} मेडिकल टीम`;
      } else if (language === 'Hinglish') {
        content = `Namaste {{patient_name}},\n\nMonsoon season me dengue & viral fever prevention ke liye {{hospital_name}} par special CBC & Platelet health checkup available hai.\n\nApna OPD consultation ya lab test book karne ke liye click karein:\n{{booking_link}}\n\n- Stay Healthy!\n{{hospital_name}}`;
      } else if (language === 'Marathi') {
        content = `नमस्कार {{patient_name}},\n\nपावसाळ्यात डेंग्यू व व्हायरल तापापासून संरक्षणासाठी {{hospital_name}} मध्ये मोफत सीबीसी तपासणी शिबीर सुरू आहे.\n\nडॉक्टरांचा सल्ला घेण्यासाठी खालील लिंकवर क्लिक करा:\n{{booking_link}}\n\n- {{hospital_name}} आरोग्य पथक`;
      } else {
        content = `Dear {{patient_name}},\n\nProtect yourself and your family this monsoon. {{hospital_name}} is conducting special preventive fever & CBC blood screening.\n\nBook your consultation or diagnostic test online:\n{{booking_link}}\n\n- Healthcare Team, {{hospital_name}}`;
      }
      setGeneratedOutput(content);
      setIsGenerating(false);
    }, 400);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(7, 12, 22, 0.9)',
      backdropFilter: 'blur(8px)',
      zIndex: 10002,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        border: '1.5px solid rgba(168, 85, 247, 0.6)',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '680px',
        padding: '24px',
        boxShadow: '0 25px 80px rgba(168, 85, 247, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#C084FC', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🤖 AI Multilingual Clinical Copywriter Co-Pilot
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Generate patient-friendly, localized SMS/WhatsApp copies in Indian regional languages
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem' }}>
          <div>
            <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>CAMPAIGN TOPIC & CLINICAL CONTEXT *</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>TARGET LANGUAGE *</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
              >
                <option value="Hindi">🇮🇳 Hindi (हिंदी)</option>
                <option value="Hinglish">🇮🇳 Hinglish (Conversational)</option>
                <option value="English">🇬🇧 English (Standard)</option>
                <option value="Marathi">🇮🇳 Marathi (मराठी)</option>
                <option value="Tamil">🇮🇳 Tamil (தமிழ்)</option>
                <option value="Bengali">🇮🇳 Bengali (বাংলা)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>TONE & READING LEVEL *</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
              >
                <option value="EMPATIENT">Empathetic Patient Care (Simple 6th Grade)</option>
                <option value="SENIOR_CLINICAL">Senior Clinical Physician Professional</option>
                <option value="URGENT_ALERT">Urgent Emergency Health Alert</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              style={{
                backgroundColor: '#A855F7',
                color: '#FFF',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 18px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)'
              }}
            >
              {isGenerating ? '⚡ AI Generating...' : '✨ Generate AI Copy'}
            </button>
          </div>

          {generatedOutput && (
            <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', border: '1px solid #475569' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.6875rem', color: '#C084FC', fontWeight: 800, textTransform: 'uppercase' }}>
                  AI Generated Message ({language}):
                </span>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                  {generatedOutput.length} Characters • 1 SMS Segment
                </span>
              </div>
              <textarea
                rows={5}
                value={generatedOutput}
                onChange={(e) => setGeneratedOutput(e.target.value)}
                style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '6px', padding: '10px', color: '#F8FAFC', lineHeight: '1.4' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    onApplyContent(generatedOutput);
                    onClose();
                  }}
                  style={{ backgroundColor: '#10B981', color: '#070C16', border: 'none', borderRadius: '6px', padding: '6px 14px', fontWeight: 800, cursor: 'pointer' }}
                >
                  ✓ Use This AI Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
