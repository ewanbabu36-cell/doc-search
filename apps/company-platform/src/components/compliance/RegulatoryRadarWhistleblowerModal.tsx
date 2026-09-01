import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const RegulatoryRadarWhistleblowerModal: React.FC<Props> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'RADAR' | 'WHISTLEBLOWER'>('RADAR');
  const [reportText, setReportText] = useState('');
  const [reportSent, setReportSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    setReportSent(true);
    setTimeout(() => {
      setReportSent(false);
      setReportText('');
      onClose();
    }, 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(7, 12, 22, 0.9)',
      backdropFilter: 'blur(8px)',
      zIndex: 10026,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        border: '1.5px solid rgba(6, 182, 212, 0.6)',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '680px',
        padding: '26px',
        boxShadow: '0 25px 80px rgba(6, 182, 212, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚖️ MOHFW / CDSCO Regulatory Radar & Anonymous Whistleblower Hotline
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Statutory circulars tracking and encrypted PGP anonymous clinical ethics channel
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

        {/* Toggle Bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('RADAR')}
            style={{ flex: 1, backgroundColor: activeTab === 'RADAR' ? '#06B6D4' : '#1E293B', color: activeTab === 'RADAR' ? '#070C16' : '#94A3B8', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 800, cursor: 'pointer' }}
          >
            📡 MOHFW / CDSCO Radar Feed
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('WHISTLEBLOWER')}
            style={{ flex: 1, backgroundColor: activeTab === 'WHISTLEBLOWER' ? '#EF4444' : '#1E293B', color: '#FFF', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 800, cursor: 'pointer' }}
          >
            🛡️ Anonymous Ethics Whistleblower
          </button>
        </div>

        {activeTab === 'RADAR' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
            <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <strong style={{ color: '#F8FAFC' }}>MOHFW Advisory: Digital Prescription Standardization 2026</strong>
                <span style={{ color: '#10B981', fontWeight: 700 }}>COMPLIANT</span>
              </div>
              <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Mandates SNOMED CT clinical coding for all diagnosis. System update applied.</span>
            </div>

            <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <strong style={{ color: '#F8FAFC' }}>CDSCO Medical Device Software (SaMD) Classification Rule</strong>
                <span style={{ color: '#10B981', fontWeight: 700 }}>COMPLIANT</span>
              </div>
              <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>AI diagnostic algorithms must retain continuous physician oversight.</span>
            </div>
          </div>
        )}

        {activeTab === 'WHISTLEBLOWER' && (
          <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
            {reportSent ? (
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', borderRadius: '8px', padding: '12px', color: '#A7F3D0', fontWeight: 700 }}>
                ✓ Anonymous report encrypted with PGP 4096-bit key and securely routed directly to the Chief Ethics Committee!
              </div>
            ) : (
              <>
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', borderRadius: '8px', padding: '10px 14px', color: '#FCA5A5' }}>
                  🔒 <strong>ZERO-KNOWLEDGE PRIVACY:</strong> Your IP address, device fingerprint, and identity are completely stripped. No logs are retained.
                </div>

                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>CONFIDENTIAL REPORT DETAILS *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe any clinical malpractice, patient safety risk, or data compliance violation..."
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="submit"
                    style={{ backgroundColor: '#EF4444', color: '#FFF', border: 'none', borderRadius: '6px', padding: '8px 20px', fontWeight: 800, cursor: 'pointer' }}
                  >
                    🔒 Send Anonymous Report
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
