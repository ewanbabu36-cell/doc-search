import React, { useState } from 'react';

export interface PharmaDistributorFranchiseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PharmaDistributorFranchiseModal: React.FC<PharmaDistributorFranchiseModalProps> = ({
  isOpen,
  onClose
}) => {
  const [partnerDistributorName, setPartnerDistributorName] = useState('Kalyan Medico Super-Stockist & Wholesale Hub');
  const [cityTerritory, setCityTerritory] = useState('Agra - Mathura - Aligarh Zone (UP West)');
  const [attachedChemistsCount] = useState(142);
  const [activeMrAgentsCount] = useState(18);
  const [bountyEarned] = useState(213000);
  const [copiedPitchDeck, setCopiedPitchDeck] = useState(false);

  if (!isOpen) return null;

  const handleCopyPitchLink = () => {
    navigator.clipboard.writeText('https://docsearch.in/mr-field-kit/doctor-pitch-deck-hindi.pdf');
    setCopiedPitchDeck(true);
    setTimeout(() => setCopiedPitchDeck(false), 3000);
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
          border: '1px solid #8B5CF6',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: 'rgba(139, 92, 246, 0.12)',
            borderBottom: '1px solid rgba(139, 92, 246, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.75rem' }}>🤝</span>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px' }}>
                B2B Pharma Distributor & MR Field Network Franchise
                <span style={{ backgroundColor: '#8B5CF6', color: '#EDE9FE', fontSize: '0.6875rem', fontWeight: 900, padding: '2px 8px', borderRadius: '12px' }}>
                  Feet-on-Street Solver
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#C4B5FD' }}>
                स्थानीय दवा डिस्ट्रीब्यूटर व मेडिकल रिप्रेजेंटेटिव्स (MR) द्वारा 10x तेज क्लिनिक ऑनबोर्डिंग
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
          {/* Strategy Rationale Box */}
          <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '12px', padding: '12px 16px' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8', marginBottom: '4px' }}>
              💡 हेल्थटेक में जीत का फॉर्मूला: 'होलसेलर + MR पावर्ड डिस्ट्रिब्यूशन'
            </div>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1', lineHeight: '1.4' }}>
              डॉक्टर और केमिस्ट फेसबुक विज्ञापन देखकर सॉफ्टवेयर नहीं खरीदते। जब शहर का प्रमुख <strong>दवा होलसेलर</strong> अपने केमिस्टों को कहता है — <em>"DOC SEARCH लगाओ, तुम्हारा बिल 1-क्लिक में हमारे पास आएगा"</em>, और उसका MR क्लिनिक जाकर 10 मिनट में लैपटॉप में चालू कर देता है, तो ऑनबोर्डिंग 100% सफल होती है।
            </div>
          </div>

          {/* Territory & Distributor Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>संबद्ध केमिस्ट व क्लिनिक</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>
                {attachedChemistsCount} रिटेलर्स
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700 }}>
                ✓ 92% एक्टिव डिजिटल PO
              </div>
            </div>

            <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>फील्ड MR एजेंट्स (Feet-on-Street)</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#A78BFA', marginTop: '2px' }}>
                {activeMrAgentsCount} एजेंट्स
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#CBD5E1', fontWeight: 700 }}>
                प्रति दिन 6-8 क्लिनिक विज़िट्स
              </div>
            </div>

            <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>MR इंसेंटिव व कमीशन पूल</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
                ₹{bountyEarned.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#34D399', fontWeight: 700 }}>
                ₹1,500 प्रति क्लिनिक ऑनबोर्डिंग
              </div>
            </div>
          </div>

          {/* Territory Config */}
          <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>पार्टनर सुपर-स्टॉकिस्ट / होलसेलर नाम</label>
              <input
                type="text"
                value={partnerDistributorName}
                onChange={(e) => setPartnerDistributorName(e.target.value)}
                style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid rgba(139, 92, 246, 0.4)', borderRadius: '6px', padding: '6px 10px', color: '#F8FAFC', fontSize: '0.75rem', fontWeight: 800, boxSizing: 'border-box', marginTop: '2px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>शहर / टेरिटरी ज़ोन</label>
              <input
                type="text"
                value={cityTerritory}
                onChange={(e) => setCityTerritory(e.target.value)}
                style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid rgba(139, 92, 246, 0.4)', borderRadius: '6px', padding: '6px 10px', color: '#F8FAFC', fontSize: '0.75rem', fontWeight: 800, boxSizing: 'border-box', marginTop: '2px' }}
              />
            </div>
          </div>

          {/* MR Field Kit Downloads */}
          <div style={{ border: '1px dashed rgba(139, 92, 246, 0.4)', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(139, 92, 246, 0.05)' }}>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F8FAFC' }}>
                📑 MR फील्ड किट व डॉक्टर पिच डेक (Hindi + English)
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>
                3-मिनट का डॉक्टर डेमो स्क्रिप्ट, 1-पेज का क्लिनिक पम्पलेट, और ज़ीरो-कॉस्ट पायलट वाउचर
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyPitchLink}
              style={{
                backgroundColor: copiedPitchDeck ? '#10B981' : '#8B5CF6',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {copiedPitchDeck ? '✓ लिंक कॉपी हुआ' : '📥 किट लिंक कॉपी करें'}
            </button>
          </div>
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
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            ✓ 0.5% डिजिटल सप्लाई चेन रॉयल्टी ऑटो-कैलकुलेटेड
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#8B5CF6',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.8125rem',
              cursor: 'pointer'
            }}
          >
            पूर्ण (Close Franchise Hub)
          </button>
        </div>
      </div>
    </div>
  );
};
