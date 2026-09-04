import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Badge } from '@docsearch/ui-kit';
import type { LeadDto, LeadSource } from '@docsearch/api-contracts';

export interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newLead: LeadDto) => void;
  initialStartVoice?: boolean;
}

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialStartVoice = false
}) => {
  const [formData, setFormData] = useState({
    organizationName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    source: 'INBOUND_WEB' as LeadSource,
    assignedOwnerEmail: 'motu.sales@docsearch.in'
  });

  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleAiExtract = (textToParse: string) => {
    if (!textToParse.trim()) return;
    setIsAiProcessing(true);

    // Normalize spoken speech: e.g. "at" -> "@", "dot" -> "."
    const speechNormalized = textToParse
      .replace(/\s+at\s+/gi, '@')
      .replace(/\s+dot\s+/gi, '.');

    setTimeout(() => {
      // 1. Email extraction
      const emailMatch = speechNormalized.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const contactEmail = emailMatch ? emailMatch[0] : '';

      // 2. Phone extraction (10-digit Indian mobile or +91 format, tolerates spoken spaces)
      const rawDigits = speechNormalized.replace(/\D/g, '');
      let contactPhone = '';
      if (rawDigits.length >= 10) {
        const last10 = rawDigits.slice(-10);
        contactPhone = `+91 ${last10}`;
      } else {
        const phoneMatch = speechNormalized.match(/(?:\+91[\s-]?)?[6789]\d{9}/);
        if (phoneMatch) {
          contactPhone = phoneMatch[0].startsWith('+91') ? phoneMatch[0] : `+91 ${phoneMatch[0]}`;
        }
      }

      // 3. Clean string without email and phone for name parsing
      let clean = speechNormalized
        .replace(emailMatch ? emailMatch[0] : '', '')
        .replace(/\+?91[\s-]?\d{10}/g, '')
        .replace(/\d{10}/g, '')
        .trim();

      // 4. Contact / Doctor Name extraction
      let contactName = '';
      const drMatch = clean.match(/(?:Dr\.?|Doctor|Prof\.?|Mr\.?|Ms\.?|Haji)\s+[A-Za-z]+(?:\s+[A-Za-z]+)*/i);
      if (drMatch) {
        contactName = drMatch[0].trim();
      }

      // 5. Organization / Clinic / Pharmacy extraction
      let orgName = '';
      const orgMatch = clean.match(
        /([A-Za-z0-9&'\s]+(?:\s+(?:Hospital|Clinic|Care|Medical|Agency|Pharmacy|Lab|Diagnostic|Center|Centre|Institute|Health|Nursing|Multispeciality|Polyclinic))(?:\s+[A-Za-z]+)*)/i
      );
      if (orgMatch) {
        orgName = orgMatch[0].trim();
      }

      // Fallback extraction by comma or tokens if not matched by regex
      if (!contactName || !orgName) {
        const parts = speechNormalized.split(/[,;\n]/).map((p) => p.trim()).filter(Boolean);
        for (const p of parts) {
          if (!p.includes('@') && !p.match(/\d{5,}/)) {
            const low = p.toLowerCase();
            if (
              !orgName &&
              (low.includes('hospital') ||
                low.includes('clinic') ||
                low.includes('medical') ||
                low.includes('agency') ||
                low.includes('pharmacy') ||
                low.includes('lab'))
            ) {
              orgName = p;
            } else if (
              !contactName &&
              (low.startsWith('dr') ||
                low.startsWith('haji') ||
                low.includes('sharma') ||
                low.includes('verma') ||
                low.includes('singh') ||
                low.includes('patel') ||
                p.split(' ').length <= 3)
            ) {
              contactName = p;
            }
          }
        }
      }

      if (!orgName && clean) {
        const tokens = clean.split(/[,;\n]/).map((t) => t.trim()).filter(Boolean);
        orgName = tokens[0] || 'New Healthcare Lead';
      }

      setFormData((prev) => ({
        ...prev,
        organizationName: orgName || prev.organizationName,
        contactName: contactName || prev.contactName,
        contactEmail: contactEmail || prev.contactEmail,
        contactPhone: contactPhone || prev.contactPhone,
        source: speechNormalized.toLowerCase().includes('referral')
          ? 'PARTNER_REFERRAL'
          : speechNormalized.toLowerCase().includes('conference') || speechNormalized.toLowerCase().includes('event')
          ? 'HEALTHCARE_CONFERENCE'
          : 'INBOUND_WEB'
      }));

      setIsAiProcessing(false);
      setAiNotice(`✓ AI Success: Auto-extracted "${orgName || 'Facility'}" and "${contactName || 'Contact'}"!`);
      setTimeout(() => setAiNotice(null), 6000);
    }, 400);
  };

  const startVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setAiNotice('⚠️ Voice Speech Recognition is not supported by this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN'; // Indian English / Hindi / Hinglish friendly
      recognition.continuous = false;
      recognition.interimResults = true;
      recognitionRef.current = recognition;

      setIsListening(true);
      setAiNotice('🎙️ माइक चालू है... बोलिए: हॉस्पिटल, डॉक्टर का नाम, फ़ोन नंबर!');

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setAiPrompt(transcript);

        if (event.results[event.results.length - 1].isFinal) {
          setIsListening(false);
          handleAiExtract(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setAiNotice('⚠️ माइक की परमिशन बंद है। ब्राउज़र एड्रेस बार में Microphone Allow करें।');
        } else {
          setAiNotice(`⚠️ Voice Notice: ${event.error}. आप नीचे दिए Quick Voice सैम्पल्स पर क्लिक करके भी टेस्ट कर सकते हैं।`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      console.error(err);
      setIsListening(false);
      setAiNotice('⚠️ माइक शुरू नहीं हो सका।');
    }
  };

  const stopVoice = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    if (isOpen && initialStartVoice) {
      t = setTimeout(() => startVoice(), 300);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [isOpen, initialStartVoice]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const created: LeadDto = {
        id: '11111111-1111-4111-8111-' + Math.floor(100000000000 + Math.random() * 900000000000),
        organizationName: formData.organizationName || 'Dr. Sharma Heart Clinic',
        contactName: formData.contactName || 'Dr. Rajesh Sharma',
        contactEmail: formData.contactEmail || 'dr.rajesh@clinic.com',
        contactPhone: formData.contactPhone || '+91 98765 43210',
        source: formData.source,
        status: 'NEW',
        assignedOwnerEmail: formData.assignedOwnerEmail,
        metadata: { aiExtracted: true, aiPromptSnippet: aiPrompt.slice(0, 100) },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setIsSubmitting(false);
      onSuccess(created);
      onClose();
    }, 500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
          border: isListening ? '2px solid #EF4444' : '2px solid #06B6D4',
          borderRadius: '20px',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: isListening ? '0 0 35px rgba(239, 68, 68, 0.5)' : '0 25px 70px rgba(0,0,0,0.9)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '12px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                ➕ Add New Sales Lead / Clinic Prospect
              </h2>
              <Badge variant="success">🤖 AI & Voice Powered</Badge>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
              माइक पर बोलकर या AI प्रॉम्प्ट से एक सेकंड में Lead भरें।
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.25rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* AI Voice & Smart Lead Intake Box */}
        <div
          style={{
            backgroundColor: isListening ? 'rgba(239, 68, 68, 0.12)' : 'rgba(6, 182, 212, 0.08)',
            border: isListening ? '1.5px dashed #EF4444' : '1.5px dashed #06B6D4',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: isListening ? '#F87171' : '#38BDF8' }}>
              {isListening ? '🔴 माइक चालू है... बोलिए (Doctor Name, Hospital Name, Mobile, Email)' : '🎙️ बोलकर Lead जोड़ें (Voice AI Direct Speech)'}
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Hindi & English Speech Supported</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Big Voice Button */}
            <button
              type="button"
              onClick={isListening ? stopVoice : startVoice}
              style={{
                backgroundColor: isListening ? '#EF4444' : '#10B981',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 18px',
                fontWeight: 900,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isListening ? '0 0 16px rgba(239, 68, 68, 0.8)' : '0 0 10px rgba(16, 185, 129, 0.4)',
                whiteSpace: 'nowrap'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{isListening ? '⏹️' : '🎙️'}</span>
              <span>{isListening ? 'Stop (सुनना बंद करें)' : 'Speak (बोलकर भरें)'}</span>
            </button>

            <input
              type="text"
              placeholder="या यहाँ बोलें/पेस्ट करें: Dr. A.K. Verma, Apex Heart Hospital Lucknow, 9876543210..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#F8FAFC',
                fontSize: '0.8125rem',
                outline: 'none'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAiExtract(aiPrompt);
                }
              }}
            />

            <button
              type="button"
              onClick={() => handleAiExtract(aiPrompt)}
              disabled={isAiProcessing || !aiPrompt.trim()}
              style={{
                backgroundColor: '#06B6D4',
                color: '#070C16',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontWeight: 900,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {isAiProcessing ? '⚡ Parsing...' : '⚡ AI Fill'}
            </button>
          </div>

          {/* Quick Voice / Spoken Phrases Samples */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.6875rem', color: '#F59E0B', fontWeight: 700 }}>🗣️ Quick Spoken Samples (1-Click Try):</span>
            {[
              {
                label: '🏥 "Dr. Rajesh Sharma, Apex Hospital Lucknow, 9876543210"',
                text: 'Dr. Rajesh Sharma, Apex Heart Hospital Lucknow, 9876543210, dr.sharma at apex dot org'
              },
              {
                label: '💊 "Haji Mohammad, Haji Medical Agency Pharmacy Store, 9812345678"',
                text: 'Haji Mohammad, Haji Medical Agency Pharmacy Store, 9812345678, haji at agency dot com'
              }
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setAiPrompt(p.text);
                  handleAiExtract(p.text);
                }}
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: '#FCD34D',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {aiNotice && (
            <div
              style={{
                backgroundColor: isListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                border: isListening ? '1px solid #EF4444' : '1px solid #10B981',
                borderRadius: '6px',
                padding: '8px 12px',
                color: isListening ? '#FCA5A5' : '#A7F3D0',
                fontSize: '0.8125rem',
                fontWeight: 700
              }}
            >
              {aiNotice}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#CBD5E1',
                  marginBottom: '4px'
                }}
              >
                FACILITY / CLINIC NAME *
              </label>
              <Input
                required
                placeholder="e.g. Apex Heart & Multispeciality"
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#CBD5E1',
                  marginBottom: '4px'
                }}
              >
                KEY DOCTOR / CONTACT PERSON *
              </label>
              <Input
                required
                placeholder="e.g. Dr. Rajesh Sharma, MD"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#CBD5E1',
                  marginBottom: '4px'
                }}
              >
                EMAIL ADDRESS *
              </label>
              <Input
                required
                type="email"
                placeholder="dr.sharma@apex.org"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#CBD5E1',
                  marginBottom: '4px'
                }}
              >
                PHONE NUMBER *
              </label>
              <Input
                required
                placeholder="+91 98765 43210"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              paddingTop: '14px'
            }}
          >
            <Button type="button" variant="outline" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              style={{
                backgroundColor: '#06B6D4',
                borderColor: '#06B6D4',
                color: '#070C16',
                fontWeight: 800
              }}
            >
              {isSubmitting ? 'Saving Lead...' : '🚀 Create Sales Lead'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
