import React, { useState, useEffect } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';

export interface VoiceAgentConfig {
  id: string;
  name: string;
  language: 'HINDI' | 'HINGLISH' | 'TAMIL' | 'TELUGU' | 'BENGALI' | 'ENGLISH';
  languageLabel: string;
  voiceGender: 'FEMALE_ANANYA' | 'MALE_ARAVIND' | 'FEMALE_PRIYA' | 'MALE_KAVIN';
  speedRate: number;
  triageSensitivity: 'HIGH_CRITICAL' | 'STANDARD_OPD' | 'CHRONIC_CARE';
  activeCallsToday: number;
  avgCallDurationSec: number;
  adherenceRatePercent: number;
}

const VOICE_PRESETS: VoiceAgentConfig[] = [
  {
    id: 'AGENT-HIN-01',
    name: 'Dr. Ananya AI (Hindi / Hinglish)',
    language: 'HINGLISH',
    languageLabel: '🇮🇳 Hindi & Hinglish',
    voiceGender: 'FEMALE_ANANYA',
    speedRate: 1.0,
    triageSensitivity: 'HIGH_CRITICAL',
    activeCallsToday: 4280,
    avgCallDurationSec: 114,
    adherenceRatePercent: 94.2
  },
  {
    id: 'AGENT-TAM-02',
    name: 'Dr. Priya AI (Tamil)',
    language: 'TAMIL',
    languageLabel: '🇮🇳 Tamil (தமிழ்)',
    voiceGender: 'FEMALE_PRIYA',
    speedRate: 0.95,
    triageSensitivity: 'HIGH_CRITICAL',
    activeCallsToday: 2150,
    avgCallDurationSec: 128,
    adherenceRatePercent: 92.8
  },
  {
    id: 'AGENT-TEL-03',
    name: 'Dr. Aravind AI (Telugu)',
    language: 'TELUGU',
    languageLabel: '🇮🇳 Telugu (తెలుగు)',
    voiceGender: 'MALE_ARAVIND',
    speedRate: 1.0,
    triageSensitivity: 'STANDARD_OPD',
    activeCallsToday: 1890,
    avgCallDurationSec: 105,
    adherenceRatePercent: 95.1
  },
  {
    id: 'AGENT-BEN-04',
    name: 'Dr. Kavin AI (Bengali)',
    language: 'BENGALI',
    languageLabel: '🇮🇳 Bengali (বাংলা)',
    voiceGender: 'MALE_KAVIN',
    speedRate: 1.0,
    triageSensitivity: 'CHRONIC_CARE',
    activeCallsToday: 1420,
    avgCallDurationSec: 132,
    adherenceRatePercent: 91.5
  }
];

export const AiVoiceWhatsAppAgentStudioView: React.FC = () => {
  const [agents, setAgents] = useState<VoiceAgentConfig[]>(VOICE_PRESETS);
  const [selectedAgent, setSelectedAgent] = useState<VoiceAgentConfig>(VOICE_PRESETS[0]!);
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [simulatedTranscript, setSimulatedTranscript] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // Call timer simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCalling) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isCalling]);

  const handleStartSimulatedCall = () => {
    setIsCalling(true);
    setSimulatedTranscript([
      `🤖 [${selectedAgent.name}]: "Namaste! Mai DocSearch Clinical AI bol rahi hoon. Aapko pichle 2 din se chest discomfort aur mild breathlessness ki complaint thi. Kya aap abhi safe feel kar rahe hain?"`,
      `👤 [Patient]: "Haan doctor, thoda bhari-pan lag raha hai jab mai stairs climb karta hoon."`,
      `🤖 [${selectedAgent.name}]: "Understood. AI Triage ne aapka ECG & Cardiology priority token issue kar diya hai. Safdarjung / Apollo Heart ER me direct pre-arrival notification bhej di gayi hai."`
    ]);
  };

  const handleEndCall = () => {
    setIsCalling(false);
    setNotice('✓ AI Triage call recorded, transcribed, and synced with EMR Doctor Dashboard!');
    setTimeout(() => setNotice(null), 5000);
  };

  const handleDeployAgent = () => {
    setNotice(`✓ Voice Agent "${selectedAgent.name}" deployed to National IVR & WhatsApp Gateways!`);
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>🤖</span>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
              AI Voice & WhatsApp Conversational Triage Agent Studio
            </h2>
            <Badge variant="primary">Multi-Lingual Clinical AI (Hindi/Tamil/Telugu/Bengali)</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
            Configure and simulate real-time AI voice agents conducting pre-OPD clinical triage, chronic medicine reminders, and red-flag emergency detection.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleDeployAgent}
          style={{
            backgroundColor: '#10B981',
            color: '#070C16',
            fontWeight: 900,
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
          }}
        >
          ⚡ Deploy Agent to National IVR Telephony
        </Button>
      </div>

      {notice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {notice}
        </div>
      )}

      {/* Top 3 High-Impact Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>
            ACTIVE AI TRIAGE CALLS TODAY
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#10B981', margin: '4px 0', fontFamily: 'monospace' }}>
            9,740 Calls
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            Zero human call-center queue latency
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
            MEDICATION ADHERENCE RECALL
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#38BDF8', margin: '4px 0', fontFamily: 'monospace' }}>
            94.2% Success
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            WhatsApp interactive response verification
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
            RED FLAG EMERGENCY DETECTION
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#EF4444', margin: '4px 0', fontFamily: 'monospace' }}>
            142 Interventions
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            Instant 108 ambulance dispatch routing
          </span>
        </div>
      </div>

      {/* Main Studio Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Left Column: Agent Selector & Flow Configuration */}
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
            🎙️ Multi-Lingual Agent Profile & Voice Engine
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {agents.map((ag) => (
              <div
                key={ag.id}
                onClick={() => setSelectedAgent(ag)}
                style={{
                  backgroundColor: selectedAgent.id === ag.id ? '#1E293B' : 'transparent',
                  border: selectedAgent.id === ag.id ? '1.5px solid #38BDF8' : '1px solid #334155',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ color: '#F8FAFC', fontSize: '0.875rem' }}>{ag.name}</strong>
                    <Badge variant={selectedAgent.id === ag.id ? 'primary' : 'neutral'}>
                      {ag.language}
                    </Badge>
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                    {ag.languageLabel} • Sensitivity: {ag.triageSensitivity}
                  </span>
                </div>

                <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 800, fontFamily: 'monospace' }}>
                  {ag.activeCallsToday} Calls
                </span>
              </div>
            ))}
          </div>

          {/* Configuration Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #334155', paddingTop: '14px' }}>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 800, marginBottom: '4px' }}>
                SPEECH SYNTHESIS SPEED (TTS RATE: {selectedAgent.speedRate}x)
              </label>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.05"
                value={selectedAgent.speedRate}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSelectedAgent({ ...selectedAgent, speedRate: val });
                  setAgents((prev) => prev.map((a) => (a.id === selectedAgent.id ? { ...a, speedRate: val } : a)));
                }}
                style={{ width: '100%', accentColor: '#38BDF8', cursor: 'pointer' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 800, marginBottom: '4px' }}>
                CLINICAL TRIAGE SENSITIVITY
              </label>
              <select
                value={selectedAgent.triageSensitivity}
                onChange={(e) => {
                  const val = e.target.value as VoiceAgentConfig['triageSensitivity'];
                  setSelectedAgent({ ...selectedAgent, triageSensitivity: val });
                  setAgents((prev) => prev.map((a) => (a.id === selectedAgent.id ? { ...a, triageSensitivity: val } : a)));
                }}
                style={{ width: '100%', padding: '8px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', color: '#FFF' }}
              >
                <option value="HIGH_CRITICAL">High Critical (Emergency Cardiac & Stroke Focus)</option>
                <option value="STANDARD_OPD">Standard OPD (General Physician & Pediatric)</option>
                <option value="CHRONIC_CARE">Chronic Care (Diabetes, Hypertension Adherence)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Live Call Simulation & Audio Waveform Console */}
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #38BDF8', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
                  📞 Interactive Live Voice Call Sandbox
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Active Agent: <strong style={{ color: '#38BDF8' }}>{selectedAgent.name}</strong>
                </span>
              </div>

              {isCalling && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', borderRadius: '12px', padding: '2px 8px', color: '#FCA5A5', fontSize: '0.75rem', fontWeight: 800 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444', animation: 'pulse 1s infinite' }} />
                  LIVE CALL ({Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')})
                </div>
              )}
            </div>

            {/* Simulated Animated Audio Waveform */}
            <div
              style={{
                height: '80px',
                backgroundColor: '#1E293B',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '0 20px',
                border: isCalling ? '1px solid #10B981' : '1px solid #334155'
              }}
            >
              {[18, 35, 60, 42, 75, 90, 65, 40, 80, 55, 30, 70, 85, 45, 20].map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: '6px',
                    height: isCalling ? `${h}%` : '10%',
                    backgroundColor: isCalling ? '#10B981' : '#475569',
                    borderRadius: '4px',
                    transition: 'height 0.2s ease',
                    boxShadow: isCalling ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none'
                  }}
                />
              ))}
            </div>

            {/* Transcript Stream */}
            <div
              style={{
                backgroundColor: '#1E293B',
                borderRadius: '12px',
                padding: '14px',
                marginTop: '14px',
                minHeight: '140px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.8125rem',
                color: '#CBD5E1',
                lineHeight: '1.5'
              }}
            >
              {simulatedTranscript.length === 0 ? (
                <span style={{ color: '#64748B', fontStyle: 'italic', textAlign: 'center', margin: 'auto' }}>
                  Click "Initiate Test Voice Call" to simulate real-time conversational triage with {selectedAgent.name}.
                </span>
              ) : (
                simulatedTranscript.map((t, idx) => (
                  <div key={idx} style={{ color: t.startsWith('🤖') ? '#38BDF8' : '#FCD34D' }}>
                    {t}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Call Controls */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {!isCalling ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleStartSimulatedCall}
                style={{
                  flex: 1,
                  backgroundColor: '#10B981',
                  color: '#070C16',
                  fontWeight: 900,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                }}
              >
                📞 Initiate Test AI Triage Voice Call
              </Button>
            ) : (
              <Button
                variant="danger"
                size="md"
                onClick={handleEndCall}
                style={{
                  flex: 1,
                  backgroundColor: '#EF4444',
                  color: '#FFF',
                  fontWeight: 900
                }}
              >
                🛑 End Voice Call & Sync EMR
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
