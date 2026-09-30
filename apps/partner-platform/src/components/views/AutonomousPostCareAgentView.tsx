import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@docsearch/ui-kit';
import { getUnifiedPartnerProfile } from '../../utils/roleProfileResolver.js';

export interface PostCareChatMessage {
  id: string;
  sender: 'BOT' | 'PATIENT' | 'SYSTEM_ALERT';
  text: string;
  timestamp: string;
  isAudio?: boolean;
  audioDuration?: string;
  isSosAlert?: boolean;
}

export interface DischargedPatientContext {
  id: string;
  name: string;
  mrn: string;
  phone: string;
  dischargeDate: string;
  daysPostDischarge: number;
  dischargeDiagnosis: string;
  attendingPhysician: string;
  emergencyContact: string;
  gpsAddress: string;
}

const DEFAULT_PATIENT: DischargedPatientContext = {
  id: 'pt-post-01',
  name: 'Ramesh Kumar',
  mrn: 'MRN-2026-CARD-091',
  phone: '+91 98201 44521',
  dischargeDate: '2026-09-05 (48 hrs ago)',
  daysPostDischarge: 2,
  dischargeDiagnosis: 'Post-PTCA Stenting to LAD (Acute Coronary Syndrome)',
  attendingPhysician: 'Lead Consulting Cardiologist',
  emergencyContact: 'Mrs. Sunita Kumar (Wife): +91 98201 44522',
  gpsAddress: 'Flat 402, Lakeview Apartments, Hiranandani, Powai, Mumbai - 400076'
};

export const AutonomousPostCareAgentView: React.FC = () => {
  const partnerProfile = getUnifiedPartnerProfile();
  const effectiveDoctor = partnerProfile.doctorName ? `${partnerProfile.doctorName}${partnerProfile.doctorDegree ? `, ${partnerProfile.doctorDegree}` : ''}` : 'Lead Attending Physician';
  const effectiveFacility = partnerProfile.entityLegalName || 'Hospital Post-Care Unit';

  const [patient] = useState<DischargedPatientContext>(() => ({
    ...DEFAULT_PATIENT,
    attendingPhysician: effectiveDoctor
  }));

  const [messages, setMessages] = useState<PostCareChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'BOT',
      text: `Namaste Ramesh ji! 🙏 Main ${effectiveFacility} ka Autonomous Post-Care AI bol raha hoon.\n\nAapko hospital se discharge hue 2 din ho gaye hain. ${effectiveDoctor} ke care plan ke anusaar:\n\n1. Aaj aapka Blood Pressure (BP) kitna record hua?\n2. Kya aapne subah ki blood thinner (Ecosprin AV) aur BP ki dawa li?`,
      timestamp: 'Today, 09:30 AM'
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [activeSosTrigger, setActiveSosTrigger] = useState<{
    symptomFound: string[];
    vitalBreach: string | null;
    timestamp: string;
  } | null>(null);

  const [sosActionDispatched, setSosActionDispatched] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isBotTyping]);

  // Real-time NLP Triage & Vital Extraction
  const processPatientResponse = (text: string) => {
    const lower = text.toLowerCase();

    // 1. Vital extraction (Systolic & Diastolic BP)
    const bpMatch = lower.match(/(?:bp|pressure)?\s*(\d{2,3})\s*[\/\-,\s]\s*(\d{2,3})/) || lower.match(/(\d{3})/);
    let sbp: number | null = null;
    let dbp: number | null = null;
    let vitalBreach: string | null = null;

    if (bpMatch) {
      if (bpMatch[1]) sbp = parseInt(bpMatch[1], 10);
      if (bpMatch[2]) dbp = parseInt(bpMatch[2], 10);

      if (sbp && sbp > 160) {
        vitalBreach = `CRITICAL HYPERTENSIVE SURGE: SBP ${sbp} mmHg (Threshold > 160 mmHg)`;
      } else if (dbp && dbp > 100) {
        vitalBreach = `CRITICAL DIASTOLIC SURGE: DBP ${dbp} mmHg (Threshold > 100 mmHg)`;
      }
    }

    // 2. Red-Flag Symptom Extraction
    const redFlagKeywords = [
      { pattern: /(?:chhati|chati|chest)\s*(?:me\s*)?(?:halka\s*)?(?:dard|pain|discomfort)/, label: 'Acute Chest Pain / Angina' },
      { pattern: /(?:pasina|sweat|sweating|perspiration)/, label: 'Diaphoresis / Cold Sweats' },
      { pattern: /(?:saans|breath|breathing)\s*(?:me\s*)?(?:takleef|shortness|problem)/, label: 'Dyspnea / Shortness of Breath' },
      { pattern: /(?:sar\s*ghoom|giddiness|dizziness|behoshi|fainting|blackout)/, label: 'Presyncope / Giddiness' },
      { pattern: /(?:vomit|ulti|nausea)/, label: 'Nausea / Vomiting' }
    ];

    const detectedSymptoms = redFlagKeywords
      .filter((k) => k.pattern.test(lower))
      .map((k) => k.label);

    const isCritical = detectedSymptoms.length > 0 || vitalBreach !== null;

    setIsBotTyping(true);

    setTimeout(() => {
      setIsBotTyping(false);

      if (isCritical) {
        const triggerData = {
          symptomFound: detectedSymptoms,
          vitalBreach,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        setActiveSosTrigger(triggerData);
        setSosModalOpen(true);

        const botWarning = `🚨 **EMERGENCY SOS DISPATCHED TO HOSPITAL ER** 🚨\n\n` +
          `Ramesh ji, aapke lakshan ${detectedSymptoms.length > 0 ? `(${detectedSymptoms.join(', ')})` : ''} ${vitalBreach ? `aur ${vitalBreach}` : ''} gambhir ho sakte hain!\n\n` +
          `✅ Humne turant **Hospital Emergency Room (ER)** aur **${effectiveDoctor}** ko live SOS RED ALERT send kar diya hai.\n` +
          `🛑 Kripya bed par araam se let jayein, koi physical activity na karein.\n` +
          `📞 Hamari ER Medical Response Team aapko agle 60 seconds me call kar rahi hai.`;

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            sender: 'BOT',
            text: botWarning,
            timestamp: 'Just now',
            isSosAlert: true
          }
        ]);
      } else {
        // Normal reassuring check-in response
        const botReassurance = `Bahut badhiya Ramesh ji! 👍\n\n` +
          `Aapka BP normal range me hai aur aapne dawa time par li hai. Yeh heart recovery ke liye bahut accha hai.\n\n` +
          `✅ Care notes updated in Hospital EMR.\n` +
          `⏰ Agla automated check-in kal subah 09:30 AM par hoga. Koi bhi problem aane par 24x7 help ke liye "HELP" reply karein.`;

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            sender: 'BOT',
            text: botReassurance,
            timestamp: 'Just now'
          }
        ]);
      }
    }, 900);
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const newMsg: PostCareChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'PATIENT',
      text: text.trim(),
      timestamp: 'Just now'
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setInputMessage('');

    processPatientResponse(text.trim());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #064E3B 0%, #065F46 50%, #0F172A 100%)',
          border: '1.5px solid #10B981',
          borderRadius: '16px',
          padding: '20px 24px',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
            }}
          >
            🤖
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#F8FAFC' }}>
                Autonomous WhatsApp Post-Care Agent & Real-Time SOS Dispatch
              </h2>
              <span
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#6EE7B7',
                  border: '1px solid #10B981',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}
              >
                AUTONOMOUS CLINICAL NLP
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', color: '#A7F3D0', fontSize: '0.8125rem' }}>
              Autonomous post-discharge patient follow-up, symptom triage & instantaneous hospital ER red-alert escalation
            </p>
          </div>
        </div>

        {/* Discharge Status Badge */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              color: '#94A3B8'
            }}
          >
            Discharge Day <strong style={{ color: '#F8FAFC' }}>#{patient.daysPostDischarge}</strong> ({patient.dischargeDate})
          </span>
          <Button
            variant="outline"
            onClick={() => setSosModalOpen(true)}
            style={{ borderColor: '#EF4444', color: '#F87171', fontWeight: 800, fontSize: '0.8125rem' }}
          >
            🚨 View Live ER SOS Monitor
          </Button>
        </div>
      </div>

      {/* Main Grid: Left = WhatsApp Phone Simulator | Right = Clinical Triage Rules & Live Monitor */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 440px) 1fr', gap: '20px' }}>
        {/* WhatsApp Mobile Bezel Simulator */}
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '2px solid #334155',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            height: '620px'
          }}
        >
          {/* WhatsApp Header Bar */}
          <div
            style={{
              backgroundColor: '#075E54',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#FFFFFF'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#128C7E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1rem',
                  border: '1.5px solid #25D366'
                }}
              >
                DS
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9375rem', lineHeight: '1.1' }}>
                  DocSearch Post-Care AI
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#DCF8C6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#25D366', display: 'inline-block' }} />
                  Online · Verified Hospital Care Bot
                </div>
              </div>
            </div>

            <span style={{ fontSize: '1.1rem', cursor: 'pointer', opacity: 0.8 }}>⋮</span>
          </div>

          {/* Chat Messages Body */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#0B141A',
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 0)',
              backgroundSize: '20px 20px',
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === 'PATIENT' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  backgroundColor:
                    msg.sender === 'PATIENT'
                      ? '#005C4B'
                      : msg.isSosAlert
                      ? 'rgba(153, 27, 27, 0.85)'
                      : '#202C33',
                  border: msg.isSosAlert ? '1.5px solid #EF4444' : 'none',
                  color: '#E9EDEF',
                  borderRadius: msg.sender === 'PATIENT' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  padding: '10px 14px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                  fontSize: '0.84375rem',
                  lineHeight: '1.45',
                  wordBreak: 'break-word'
                }}
              >
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                <div
                  style={{
                    fontSize: '0.625rem',
                    color: '#8696A0',
                    textAlign: 'right',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '4px'
                  }}
                >
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'PATIENT' && <span style={{ color: '#53BDEB' }}>✓✓</span>}
                </div>
              </div>
            ))}

            {isBotTyping && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: '#202C33',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  color: '#8696A0',
                  fontSize: '0.75rem',
                  fontStyle: 'italic'
                }}
              >
                DocSearch AI is typing response...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Scenario Testing Chips */}
          <div
            style={{
              backgroundColor: '#111B21',
              padding: '8px 12px',
              borderTop: '1px solid #222E35',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto'
            }}
          >
            <button
              onClick={() => handleSendMessage('BP 120/80 hai, subah ki saari dawa le li hai. Tabiyat theek hai.')}
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid #10B981',
                color: '#6EE7B7',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.6875rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              🟢 Normal (120/80, Meds Taken)
            </button>
            <button
              onClick={() => handleSendMessage('Chhati me halka dard hai aur thoda pasina aa raha hai.')}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #EF4444',
                color: '#FCA5A5',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.6875rem',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              🔴 SOS: Chhati Me Dard (Chest Pain)
            </button>
            <button
              onClick={() => handleSendMessage('Subah se mera BP 175/105 aa raha hai aur sar ghoom raha hai.')}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #EF4444',
                color: '#FCA5A5',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.6875rem',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              🔴 SOS: BP 175/105 &gt; 160
            </button>
          </div>

          {/* Input Bar */}
          <div
            style={{
              backgroundColor: '#202C33',
              padding: '10px 14px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              placeholder="Reply in Hindi, Hinglish or English..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              style={{
                flex: 1,
                backgroundColor: '#2A3942',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#E9EDEF',
                fontSize: '0.84375rem',
                outline: 'none'
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              style={{
                backgroundColor: '#00A884',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,168,132,0.4)'
              }}
            >
              ➤
            </button>
          </div>
        </div>

        {/* Right Column: Real-Time Clinical SOS Dashboard & Patient Care Plan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Patient Header Card */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '16px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>POST-DISCHARGE TELEMETRY</span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '1.15rem', color: '#F8FAFC', fontWeight: 800 }}>
                  {patient.name} ({patient.mrn})
                </h3>
              </div>
              <span
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10B981',
                  color: '#6EE7B7',
                  padding: '3px 10px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                FOLLOW-UP ACTIVE
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div style={{ backgroundColor: '#1E293B', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Primary Diagnosis</span>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#38BDF8', marginTop: '2px' }}>
                  {patient.dischargeDiagnosis}
                </div>
              </div>

              <div style={{ backgroundColor: '#1E293B', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Attending Physician</span>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#E2E8F0', marginTop: '2px' }}>
                  {patient.attendingPhysician}
                </div>
              </div>

              <div style={{ backgroundColor: '#1E293B', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Emergency Contact</span>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#FCA5A5', marginTop: '2px' }}>
                  {patient.emergencyContact}
                </div>
              </div>

              <div style={{ backgroundColor: '#1E293B', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>GPS Geocoded Address</span>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginTop: '2px' }}>
                  {patient.gpsAddress}
                </div>
              </div>
            </div>
          </div>

          {/* Autonomous NLP Rules Matrix */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '16px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <span style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🧠</span> Autonomous Clinical NLP Triage Engine (Hindi / Hinglish / English)
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', fontWeight: 800, fontSize: '0.8125rem' }}>
                  <span>⚠️</span> Red Alert Triggers (Auto-ER SOS)
                </div>
                <ul style={{ margin: '8px 0 0 16px', padding: 0, fontSize: '0.75rem', color: '#CBD5E1', lineHeight: '1.6' }}>
                  <li><strong>SBP &gt; 160 mmHg</strong> or <strong>DBP &gt; 100 mmHg</strong> (Surge)</li>
                  <li>"Chhati me dard", "Chest pain", "Angina", "Bhaari-pan"</li>
                  <li>"Pasina", "Cold sweats", "Palpitations"</li>
                  <li>"Saans lene me dikkat", "Shortness of breath"</li>
                  <li>"Sar ghoom raha hai", "Giddiness", "Behoshi"</li>
                </ul>
              </div>

              <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: 800, fontSize: '0.8125rem' }}>
                  <span>✓</span> Safe Recovery Baseline
                </div>
                <ul style={{ margin: '8px 0 0 16px', padding: 0, fontSize: '0.75rem', color: '#CBD5E1', lineHeight: '1.6' }}>
                  <li>SBP between 100 – 135 mmHg</li>
                  <li>DBP between 60 – 85 mmHg</li>
                  <li>Confirmed adherence to morning medication</li>
                  <li>Absence of orthopnea, swelling, or angina</li>
                  <li>Next check-in scheduled automatically in 24 hrs</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Real-Time SOS Escalation Status Box */}
          <div
            style={{
              backgroundColor: activeSosTrigger ? 'rgba(239, 68, 68, 0.15)' : '#0F172A',
              border: activeSosTrigger ? '2px solid #EF4444' : '1px solid #1E293B',
              borderRadius: '16px',
              padding: '18px 20px',
              boxShadow: activeSosTrigger ? '0 0 25px rgba(239, 68, 68, 0.4)' : 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontWeight: 800,
                  color: activeSosTrigger ? '#F87171' : '#94A3B8',
                  fontSize: '0.9375rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>🚨</span> Real-Time Emergency SOS Alert Status
              </span>

              <span
                style={{
                  backgroundColor: activeSosTrigger ? '#EF4444' : '#1E293B',
                  color: '#FFFFFF',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}
              >
                {activeSosTrigger ? 'LIVE ER SOS FIRING' : 'IDLE / MONITORING'}
              </span>
            </div>

            {activeSosTrigger ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #EF4444' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F87171' }}>
                    TRIGGERED AT: {activeSosTrigger.timestamp}
                  </div>
                  {activeSosTrigger.vitalBreach && (
                    <div style={{ fontSize: '0.8125rem', color: '#FCA5A5', marginTop: '4px', fontWeight: 700 }}>
                      ⚡ {activeSosTrigger.vitalBreach}
                    </div>
                  )}
                  {activeSosTrigger.symptomFound.length > 0 && (
                    <div style={{ fontSize: '0.8125rem', color: '#FCA5A5', marginTop: '4px' }}>
                      ⚡ Symptoms Identified: <strong>{activeSosTrigger.symptomFound.join(', ')}</strong>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setSosActionDispatched('Ambulance #MH-02-ER-901 Dispatched to Powai via GPS');
                    }}
                    style={{ backgroundColor: '#EF4444', borderColor: '#DC2626', color: '#FFFFFF', fontWeight: 800, fontSize: '0.8125rem' }}
                  >
                    🚑 Dispatch Emergency Ambulance
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setSosActionDispatched('Initiating priority VoIP line to Patient (+91 98201 44521)...');
                    }}
                    style={{ borderColor: '#F59E0B', color: '#FBBF24', fontWeight: 800, fontSize: '0.8125rem' }}
                  >
                    📞 Connect Doctor Tele-Call
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setSosActionDispatched('Trauma Bay Bed #04 Reserved. Cardiologist Intimated.');
                    }}
                    style={{ borderColor: '#38BDF8', color: '#38BDF8', fontWeight: 800, fontSize: '0.8125rem' }}
                  >
                    🏥 Hold ER Resuscitation Bed
                  </Button>
                </div>

                {sosActionDispatched && (
                  <div
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid #10B981',
                      color: '#A7F3D0',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.8125rem',
                      fontWeight: 700
                    }}
                  >
                    ✅ {sosActionDispatched}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '0.8125rem', color: '#64748B', fontStyle: 'italic' }}>
                No active red-alert triggers. Click any of the pre-configured SOS buttons inside the WhatsApp simulator to test instantaneous emergency triage!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Flashing Full-Screen SOS Red Alert Modal */}
      {sosModalOpen && activeSosTrigger && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '3px solid #EF4444',
              borderRadius: '20px',
              maxWidth: '680px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 0 60px rgba(239, 68, 68, 0.6)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Flashing Siren Strobe Header */}
            <div
              style={{
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.8rem', animation: 'pulse 1s infinite' }}>🚨</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.5px' }}>
                    CRITICAL POST-DISCHARGE ER SOS ALERT
                  </h3>
                  <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                    Automated NLP Trigger · Hospital Emergency Department Notification
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSosModalOpen(false)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontWeight: 900
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1.5px solid #EF4444',
                  borderRadius: '12px',
                  padding: '14px 18px'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#FCA5A5', fontWeight: 700 }}>TRIGGER DETAILS</div>
                {activeSosTrigger.vitalBreach && (
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#EF4444', marginTop: '4px' }}>
                    ⚡ {activeSosTrigger.vitalBreach}
                  </div>
                )}
                {activeSosTrigger.symptomFound.length > 0 && (
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#F87171', marginTop: '4px' }}>
                    ⚡ Red-Flag Symptoms: {activeSosTrigger.symptomFound.join(' + ')}
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '6px' }}>
                  Patient texted: "<em>{messages[messages.length - 2]?.text || 'Critical complaint'}</em>"
                </div>
              </div>

              {/* Patient Emergency Information */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Patient Dossier</span>
                  <div style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.9375rem', marginTop: '2px' }}>
                    {patient.name} ({patient.mrn})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#38BDF8', marginTop: '2px' }}>
                    {patient.dischargeDiagnosis}
                  </div>
                </div>

                <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Patient Live Phone</span>
                  <div style={{ fontWeight: 800, color: '#10B981', fontSize: '0.9375rem', marginTop: '2px' }}>
                    {patient.phone}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                    Kin: {patient.emergencyContact}
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Emergency GPS Delivery Coordinates</span>
                <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.875rem', marginTop: '2px' }}>
                  📍 {patient.gpsAddress}
                </div>
              </div>

              {/* Instant Action Toolbar */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <Button
                  variant="primary"
                  onClick={() => {
                    setSosActionDispatched('Ambulance #MH-02-ER-901 Dispatched to Powai via GPS');
                    setSosModalOpen(false);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: '#EF4444',
                    borderColor: '#DC2626',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    padding: '12px',
                    fontSize: '0.875rem',
                    boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)'
                  }}
                >
                  🚑 Dispatch Hospital Ambulance
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSosActionDispatched(`Direct Tele-VoIP call launched with ${effectiveDoctor}`);
                    setSosModalOpen(false);
                  }}
                  style={{
                    flex: 1,
                    borderColor: '#F59E0B',
                    color: '#FBBF24',
                    fontWeight: 800,
                    padding: '12px',
                    fontSize: '0.875rem'
                  }}
                >
                  📞 Direct Doctor Tele-Call
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
