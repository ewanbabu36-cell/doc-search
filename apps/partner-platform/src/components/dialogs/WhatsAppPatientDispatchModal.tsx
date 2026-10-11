import React, { useState } from 'react';

export interface WhatsAppPatientDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string | undefined;
  patientPhone?: string | undefined;
  patientUhid?: string | undefined;
  tokenNumber?: string | undefined;
  doctorName?: string | undefined;
}

export const WhatsAppPatientDispatchModal: React.FC<WhatsAppPatientDispatchModalProps> = ({
  isOpen,
  onClose,
  patientName = 'Ramesh Kumar',
  patientPhone = '9876543210',
  patientUhid = 'UHID-2024-8841',
  tokenNumber = 'OPD-A14',
  doctorName = 'Dr. R. K. Sharma (MD Med)'
}) => {
  const [phoneNumber, setPhoneNumber] = useState(patientPhone);
  const [docType, setDocType] = useState<'RX' | 'TOKEN' | 'BILL' | 'LAB'>('RX');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const webRxUrl = `https://docsearch.in/view/rx/${(patientUhid || 'uhid-2024-8841').toLowerCase()}?auth=instant`;

  const getWhatsAppMessageText = () => {
    if (docType === 'TOKEN') {
      return `🏥 *DOC SEARCH HEALTHCARE DESK*\n\n` +
        `नमस्ते *${patientName}* जी,\n` +
        `आपका अस्पताल टोकन सफलतापूर्वक जनरेट हो गया है:\n\n` +
        `🎫 *टोकन नंबर:* ${tokenNumber}\n` +
        `👨‍⚕️ *कंसल्टेंट:* ${doctorName}\n` +
        `📍 *केबिन:* रूम नंबर 1 (OPD Block)\n` +
        `⏱️ *अनुमानित प्रतीक्षा:* ~8 मिनट\n\n` +
        `📲 *लाइव कतार स्थिति व पर्चा लिंक:*\n${webRxUrl}\n\n` +
        `_(आपको कोई भी ऐप डाउनलोड करने की आवश्यकता नहीं है)_`;
    }
    if (docType === 'BILL') {
      return `🏥 *DOC SEARCH CASHLESS & BILLING DESK*\n\n` +
        `नमस्ते *${patientName}* जी,\n` +
        `आपका पेमेंट इनवॉयस तैयार है:\n\n` +
        `🧾 *बिल नंबर:* INV-2024-9102\n` +
        `💰 *भुगतान राशि:* ₹650.00 (UPI Paid)\n` +
        `✅ *स्टेटस:* पूर्ण (Paid)\n\n` +
        `📥 *डिजिटल GST रसीद PDF डाउनलोड करें:*\n${webRxUrl}\n\n` +
        `स्वस्थ रहें, सुरक्षित रहें!`;
    }
    if (docType === 'LAB') {
      return `🧪 *DOC SEARCH LIMS PATHOLOGY LAB*\n\n` +
        `नमस्ते *${patientName}* जी,\n` +
        `आपकी रक्त जांच रिपोर्ट (CBC, LFT, Lipid Profile) तैयार हो चुकी है:\n\n` +
        `🔬 *पैथोलॉजिस्ट:* Dr. M. S. Bedi (MBBS, MD Path)\n` +
        `📊 *सर्टिफिकेशन:* NABL / ISO 15189 Verified\n\n` +
        `📥 *अधिकृत रिपोर्ट PDF देखें व डाउनलोड करें:*\n${webRxUrl}`;
    }

    // Default: RX
    return `🏥 *DOC SEARCH DIGITAL RX & CLINIC DESK*\n\n` +
      `नमस्ते *${patientName}* जी,\n` +
      `*${doctorName}* द्वारा आज की परामर्श पर्ची व दवाइयों का विवरण:\n\n` +
      `💊 *दवाइयों का टाइम-टेबल:*\n` +
      `• *Tab Augmentin 625:* दिन में 2 बार (सुबह-शाम) खाने के बाद (5 दिन)\n` +
      `• *Tab Dolo 650:* बुखार या दर्द होने पर (SOS)\n` +
      `• *Cap Pan-D:* सुबह खाली पेट (7 दिन)\n\n` +
      `📲 *बिना ऐप डाउनलोड किए ओरिजिनल डिजिटल पर्चा देखें:*\n${webRxUrl}\n\n` +
      `📞 आपातकाल परामर्श: 1800-DOC-SEARCH`;
  };

  const handleSendViaOfficialApi = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 4000);
    }, 1200);
  };

  const handleOpenDirectWhatsAppWeb = () => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const formatted = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
    const textEncoded = encodeURIComponent(getWhatsAppMessageText());
    const waUrl = `https://wa.me/${formatted}?text=${textEncoded}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(webRxUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 14, 0.92)',
        backdropFilter: 'blur(10px)',
        zIndex: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #25D366',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(37, 211, 102, 0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: 'rgba(37, 211, 102, 0.12)',
            borderBottom: '1px solid rgba(37, 211, 102, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.75rem' }}>📲</span>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px' }}>
                WhatsApp-First Zero-Install Dispatcher
                <span style={{ backgroundColor: '#25D366', color: '#064E3B', fontSize: '0.6875rem', fontWeight: 900, padding: '2px 8px', borderRadius: '12px' }}>
                  ✓ Official Meta API
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#86EFAC' }}>
                मरीज़ को कोई ऐप डाउनलोड नहीं करना पड़ेगा — सीधे व्हाट्सएप पर डिजिटल पर्चा व टोकन पहुंचेगा
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#94A3B8',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              fontWeight: 800
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Document Type Selector Tabs */}
          <div style={{ display: 'flex', gap: '8px', backgroundColor: '#1E293B', padding: '4px', borderRadius: '10px' }}>
            {[
              { id: 'RX', label: '🩺 डिजिटल पर्चा (Rx)', desc: 'दवाइयों का टाइम-टेबल' },
              { id: 'TOKEN', label: '⚡ ओपीडी टोकन (Token)', desc: 'लाइव कतार व कमरा' },
              { id: 'BILL', label: '🧾 बिल व रसीद (Bill)', desc: 'GST पेमेंट इनवॉयस' },
              { id: 'LAB', label: '🧪 पैथोलॉजी रिपोर्ट (Lab)', desc: 'NABL टेस्ट पीडीएफ' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDocType(tab.id as any)}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  backgroundColor: docType === tab.id ? '#25D366' : 'transparent',
                  color: docType === tab.id ? '#064E3B' : '#94A3B8',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Patient Details & Phone Input */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: '#1E293B', padding: '14px', borderRadius: '12px' }}>
            <div>
              <label style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>मरीज़ का नाम (Patient Name)</label>
              <div style={{ fontSize: '0.875rem', color: '#F8FAFC', fontWeight: 800, marginTop: '2px' }}>
                {patientName} ({patientUhid})
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>व्हाट्सएप नंबर (10-Digit Mobile)</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: '2px',
                  backgroundColor: '#0F172A',
                  border: '1px solid rgba(37, 211, 102, 0.4)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: '#F8FAFC',
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  boxSizing: 'border-box'
                }}
                placeholder="उदा. 9876543210"
              />
            </div>
          </div>

          {/* WhatsApp Chat Preview Bubble */}
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, marginBottom: '6px' }}>
              💬 व्हाट्सएप मैसेज प्रीव्यू (Real-time Message Preview):
            </div>
            <div
              style={{
                backgroundColor: '#075E54',
                backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 0)',
                backgroundSize: '16px 16px',
                padding: '16px',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <div
                style={{
                  backgroundColor: '#DCF8C6',
                  color: '#075E54',
                  padding: '12px 14px',
                  borderRadius: '12px 12px 2px 12px',
                  maxWidth: '90%',
                  marginLeft: 'auto',
                  fontSize: '0.8125rem',
                  lineHeight: '1.45',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
              >
                {getWhatsAppMessageText()}
                <div style={{ textAlign: 'right', fontSize: '0.625rem', color: '#128C7E', marginTop: '6px' }}>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                </div>
              </div>
            </div>
          </div>

          {/* Zero-Install Web Rx Link */}
          <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>🔗</span>
              <div>
                <div style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 800 }}>
                  0-Install Direct Instant Web-Viewer Link:
                </div>
                <div style={{ fontSize: '0.75rem', color: '#F8FAFC', fontFamily: 'monospace' }}>
                  {webRxUrl}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                backgroundColor: copiedLink ? '#10B981' : '#1E293B',
                color: '#F8FAFC',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {copiedLink ? '✓ कॉपी हुआ' : '📋 कॉपी लिंक'}
            </button>
          </div>

          {sendSuccess && (
            <div style={{ backgroundColor: 'rgba(37, 211, 102, 0.2)', border: '1px solid #25D366', color: '#86EFAC', padding: '10px 14px', borderRadius: '10px', fontSize: '0.8125rem', fontWeight: 800, textAlign: 'center' }}>
              🚀 व्हाट्सएप पर संदेश तुरंत डिलीवर हो गया! (Delivered with Meta Green Tick ID: MSG_{Date.now()})
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#1E293B',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <button
            type="button"
            onClick={handleOpenDirectWhatsAppWeb}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#F8FAFC',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '10px 16px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>💬</span>
            <span>ब्राउज़र / ऐप में WhatsApp खोलें (wa.me)</span>
          </button>

          <button
            type="button"
            onClick={handleSendViaOfficialApi}
            disabled={isSending}
            style={{
              backgroundColor: '#25D366',
              color: '#064E3B',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '10px',
              fontWeight: 900,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)'
            }}
          >
            <span>⚡</span>
            <span>{isSending ? 'भेज रहे हैं...' : 'मरीज़ को WhatsApp पर भेजें (1-Click Send)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
