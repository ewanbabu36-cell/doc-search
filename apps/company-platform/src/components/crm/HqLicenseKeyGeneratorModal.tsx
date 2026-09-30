import React, { useState } from 'react';

export interface HqLicenseKeyGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPartner?: {
    id: string;
    name?: string;
    legalName?: string;
    tradeName?: string;
    organizationType?: string;
  } | null;
}

export const HqLicenseKeyGeneratorModal: React.FC<HqLicenseKeyGeneratorModalProps> = ({
  isOpen,
  onClose,
  initialPartner
}) => {
  const [machineFingerprint, setMachineFingerprint] = useState('');
  const [partnerName, setPartnerName] = useState(
    initialPartner?.legalName || initialPartner?.tradeName || initialPartner?.name || 'Authorized Clinic'
  );
  const [planTier, setPlanTier] = useState('Doctor OPD Clinic Pro');
  const [validityDays, setValidityDays] = useState(365);
  const [maxDoctors, setMaxDoctors] = useState(5);
  const [maxBranches, setMaxBranches] = useState(1);
  const [maxSeats, setMaxSeats] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!machineFingerprint.trim()) {
      setErrorMsg('Partner machine fingerprint is required for hardware node-locking.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const token = localStorage.getItem('docsearch_auth_token');
      const res = await fetch('/api/v1/company/license/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          partnerId: initialPartner?.id || 'partner-manual',
          tenantId: initialPartner?.id || '44444444-4444-4444-8444-444444444444',
          tenantName: partnerName,
          machineFingerprint: machineFingerprint.trim().toUpperCase(),
          planTier,
          maxSeats: Number(maxSeats),
          validityDays: Number(validityDays),
          maxDoctors: Number(maxDoctors),
          maxBranches: Number(maxBranches)
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setGeneratedKey(json.data.licenseKey);
        setGeneratedToken(json.data.licenseToken);
        setExpiryDate(json.data.expiryDate);
      } else {
        setErrorMsg(json.error?.message || json.message || 'Failed to generate license key.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error generating license.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadLicFile = () => {
    if (!generatedKey || !generatedToken) return;
    const envelope = {
      format: 'DOCSEARCH_AIRGAP_ENVELOPE_V1',
      licenseKey: generatedKey,
      partnerId: initialPartner?.id || 'partner-manual',
      tenantId: initialPartner?.id || '44444444-4444-4444-8444-444444444444',
      tenantName: partnerName,
      planTier,
      maxSeats: Number(maxSeats),
      boundNodes: [
        {
          nodeId: 'node-primary',
          deviceName: 'Primary Workstation',
          machineFingerprint: machineFingerprint.trim().toUpperCase(),
          boundAt: new Date().toISOString(),
          lastHeartbeatAt: new Date().toISOString(),
          status: 'ACTIVE'
        }
      ],
      maxDoctors: Number(maxDoctors),
      maxBranches: Number(maxBranches),
      maxConcurrentUsers: 50,
      issuedAt: new Date().toISOString(),
      expiryDate: expiryDate || new Date(Date.now() + Number(validityDays) * 86400000).toISOString(),
      gracePeriodDays: 15,
      features: ['OPD_CONSULTATION', 'PHARMACY_POS', 'EMR', 'DIGITAL_RX'],
      signature: generatedToken.split('.')[2] || 'SIG-VALID'
    };

    const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `docsearch-license-${generatedKey}.lic`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: '#1E293B',
          border: '1.5px solid #334155',
          borderRadius: '16px',
          maxWidth: '600px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: 'rgba(168, 85, 247, 0.15)',
            borderBottom: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>👑</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#F8FAFC' }}>
                HQ Cryptographic Offline License Issuer
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#C084FC' }}>
                Hardware Node-Locked License Key Generator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.4rem',
              color: '#94A3B8',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '75vh', overflowY: 'auto' }}>
          {errorMsg && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#FCA5A5', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem' }}>
              {errorMsg}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
              Partner / Facility Legal Name
            </label>
            <input
              type="text"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
              Customer's Machine Node Fingerprint (MPR-XXXX-XXXX-XXXX) *
            </label>
            <input
              type="text"
              placeholder="e.g. MPR-5F54-2EB5-76C0"
              value={machineFingerprint}
              onChange={(e) => setMachineFingerprint(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#0F172A', border: '1px solid #38BDF8', color: '#38BDF8', fontFamily: 'monospace', fontWeight: 700 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                Plan Tier
              </label>
              <select
                value={planTier}
                onChange={(e) => setPlanTier(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF' }}
              >
                <option value="Doctor OPD Clinic Pro">Doctor OPD Clinic Pro</option>
                <option value="Retail Pharmacy POS Suite">Retail Pharmacy POS Suite</option>
                <option value="Pathology Pro & LIMS">Pathology Pro & LIMS</option>
                <option value="Hospital Enterprise Edition">Hospital Enterprise Edition</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                Validity Duration
              </label>
              <select
                value={validityDays}
                onChange={(e) => setValidityDays(Number(e.target.value))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF' }}
              >
                <option value={30}>30 Days (Demo / Monthly)</option>
                <option value={90}>90 Days (Quarterly)</option>
                <option value={365}>365 Days (1 Year Annual)</option>
                <option value={1095}>1095 Days (3 Years Multi-Year)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                Device Seats (Terminals)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={maxSeats}
                onChange={(e) => setMaxSeats(Number(e.target.value))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#0F172A', border: '1px solid #38BDF8', color: '#38BDF8', fontWeight: 700 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                Doctor Limit
              </label>
              <input
                type="number"
                value={maxDoctors}
                onChange={(e) => setMaxDoctors(Number(e.target.value))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                Branch Limit
              </label>
              <input
                type="number"
                value={maxBranches}
                onChange={(e) => setMaxBranches(Number(e.target.value))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF' }}
              />
            </div>
          </div>

          {/* Generated Key Section */}
          {generatedToken && (
            <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '10px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34D399', textTransform: 'uppercase' }}>
                  ✓ Cryptographically Signed Offline License
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  Expires: {expiryDate ? new Date(expiryDate).toLocaleDateString() : ''}
                </span>
              </div>

              {generatedKey && (
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginBottom: '6px' }}>
                  License Key ID: <strong style={{ color: '#38BDF8', fontFamily: 'monospace' }}>{generatedKey}</strong> • Seats: <strong style={{ color: '#FCD34D' }}>{maxSeats} Terminals</strong>
                </div>
              )}

              <textarea
                readOnly
                rows={3}
                value={generatedToken}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', backgroundColor: '#020617', border: '1px solid #334155', color: '#A7F3D0', fontFamily: 'monospace', fontSize: '0.72rem' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleDownloadLicFile}
                  style={{
                    backgroundColor: '#0284C7',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '7px 14px',
                    color: '#FFF',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  📥 Download .lic Package File
                </button>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  style={{
                    backgroundColor: '#10B981',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '7px 14px',
                    color: '#064E3B',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  {copied ? '✓ Copied Token!' : '📋 Copy Token String'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', backgroundColor: 'rgba(0,0,0,0.2)', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ backgroundColor: 'transparent', border: '1px solid #475569', color: '#CBD5E1', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !machineFingerprint.trim()}
            style={{ backgroundColor: '#A855F7', border: 'none', color: '#FFF', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 800 }}
          >
            {isGenerating ? 'Signing License...' : '👑 Generate Signed Node-Locked Key'}
          </button>
        </div>
      </div>
    </div>
  );
};
