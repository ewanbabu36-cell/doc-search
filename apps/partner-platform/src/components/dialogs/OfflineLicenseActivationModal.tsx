import React, { useState, useEffect } from 'react';
import { Button } from '@docsearch/ui-kit';

export interface OfflineLicenseActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivated?: () => void;
}

export const OfflineLicenseActivationModal: React.FC<OfflineLicenseActivationModalProps> = ({
  isOpen,
  onClose,
  onActivated
}) => {
  const [activeTab, setActiveTab] = useState<'TOKEN' | 'FILE'>('TOKEN');
  const [machineFingerprint, setMachineFingerprint] = useState<string>('');
  const [hostname, setHostname] = useState<string>('');
  const [licenseTokenInput, setLicenseTokenInput] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activatedData, setActivatedData] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setLicenseTokenInput('');
      setSelectedFileName(null);
      setFileContent(null);
      fetchFingerprint();
    }
  }, [isOpen]);

  const fetchFingerprint = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/license/machine-fingerprint');
      const json = await res.json();
      if (json.success && json.data) {
        setMachineFingerprint(json.data.fingerprint);
        setHostname(json.data.hostname);
      }
    } catch {
      setErrorMsg('Unable to query hardware telemetry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyFingerprint = () => {
    if (machineFingerprint) {
      navigator.clipboard.writeText(machineFingerprint);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      setErrorMsg(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          setFileContent(content);
        } catch {
          setErrorMsg('Failed to read license file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleActivateToken = async () => {
    if (!licenseTokenInput.trim()) {
      setErrorMsg('Please paste the offline license key provided by DocSearch HQ.');
      return;
    }

    setIsActivating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/v1/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseToken: licenseTokenInput.trim() })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMsg(json.message || 'License activated successfully!');
        setActivatedData(json.data);
        if (onActivated) onActivated();
      } else {
        setErrorMsg(json.error?.message || json.message || 'License activation failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error during license activation.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleActivateFile = async () => {
    if (!fileContent) {
      setErrorMsg('Please select or upload a valid .lic license file.');
      return;
    }

    setIsActivating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/v1/license/import-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileContent })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMsg(json.message || 'Air-gapped license package activated successfully!');
        setActivatedData(json.data);
        if (onActivated) onActivated();
      } else {
        setErrorMsg(json.error?.message || json.message || 'License file activation failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error during license activation.');
    } finally {
      setIsActivating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
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
          maxWidth: '640px',
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
            backgroundColor: 'rgba(2, 132, 199, 0.15)',
            borderBottom: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>🔒</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC' }}>
                Software License & Hardware Node-Lock
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>
                Enterprise Hardware Binding, Anti-Cloning & Air-Gapped Package Activation
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

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Machine Hardware Fingerprint Banner */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '10px',
              padding: '14px 16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🖥️ This Terminal Hardware Node ID:
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                Host: {hostname || 'Local-Node'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  color: '#F8FAFC',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  letterSpacing: '1.5px',
                  flex: 1
                }}
              >
                {isLoading ? 'Scanning hardware...' : (machineFingerprint || 'MPR-SCANNING')}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyFingerprint}
                disabled={!machineFingerprint}
                style={{ fontWeight: 700, fontSize: '0.78rem' }}
              >
                {copied ? '✓ Copied!' : '📋 Copy ID'}
              </Button>
            </div>

            <p style={{ margin: '8px 0 0', fontSize: '0.72rem', color: '#94A3B8' }}>
              Provide this <strong>Hardware Node ID</strong> to DOC SEARCH HQ to claim an authorized workstation seat.
            </p>
          </div>

          {/* Success Notification */}
          {successMsg && (
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1.5px solid #10B981',
                borderRadius: '8px',
                padding: '12px 14px',
                color: '#34D399',
                fontSize: '0.8125rem',
                fontWeight: 600,
                lineHeight: 1.4
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✅</span>
                <span>{successMsg}</span>
              </div>
              {activatedData && (
                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#A7F3D0' }}>
                  Plan: <strong>{activatedData.planTier}</strong> • Doctors Allowed: <strong>{activatedData.maxDoctors ?? 'Unlimited'}</strong> • Valid Until: <strong>{new Date(activatedData.expiryDate).toLocaleDateString()}</strong>
                </div>
              )}
            </div>
          )}

          {/* Error Notification */}
          {errorMsg && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1.5px solid #EF4444',
                borderRadius: '8px',
                padding: '12px 14px',
                color: '#FCA5A5',
                fontSize: '0.8125rem',
                fontWeight: 600,
                lineHeight: 1.4,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Dual Method Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('TOKEN')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                backgroundColor: activeTab === 'TOKEN' ? '#0284C7' : 'transparent',
                color: activeTab === 'TOKEN' ? '#FFF' : '#94A3B8'
              }}
            >
              🔑 Option 1: Digital License Token
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('FILE')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                backgroundColor: activeTab === 'FILE' ? '#0284C7' : 'transparent',
                color: activeTab === 'FILE' ? '#FFF' : '#94A3B8'
              }}
            >
              📥 Option 2: Air-Gapped .lic File
            </button>
          </div>

          {/* Tab 1: Token */}
          {activeTab === 'TOKEN' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                Paste Cryptographic License Token (DSLIC.xxxxx.xxxxx)
              </label>
              <textarea
                rows={4}
                value={licenseTokenInput}
                onChange={(e) => setLicenseTokenInput(e.target.value)}
                placeholder="Paste the DSLIC digital token received from DOC SEARCH HQ..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#F8FAFC',
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  outline: 'none'
                }}
              />
            </div>
          )}

          {/* Tab 2: File Import */}
          {activeTab === 'FILE' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                Upload Air-Gapped License Package (.lic file)
              </label>
              <div
                style={{
                  border: '2px dashed #475569',
                  borderRadius: '8px',
                  padding: '24px',
                  textAlign: 'center',
                  backgroundColor: 'rgba(15, 23, 42, 0.5)'
                }}
              >
                <input
                  type="file"
                  accept=".lic,.json"
                  onChange={handleFileChange}
                  id="lic-file-input"
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="lic-file-input"
                  style={{
                    display: 'inline-block',
                    padding: '8px 18px',
                    borderRadius: '6px',
                    backgroundColor: '#334155',
                    color: '#F8FAFC',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  📁 Select .lic File
                </label>
                {selectedFileName ? (
                  <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#38BDF8', fontWeight: 600 }}>
                    Selected: {selectedFileName}
                  </div>
                ) : (
                  <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                    Select the tamper-proof license file exported by DOC SEARCH HQ for air-gapped activation.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Security Guarantee Strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.72rem', color: '#94A3B8', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', flexWrap: 'wrap' }}>
            <span>🔒 Cryptographic HMAC-SHA256 Signature</span>
            <span>•</span>
            <span>⏱️ Anti-Clock Tamper Monotonic Ledger</span>
            <span>•</span>
            <span>🖥️ Hardware Node-Lock Protected</span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderTop: '1px solid #334155',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
          {activeTab === 'TOKEN' ? (
            <Button
              size="sm"
              variant="primary"
              onClick={handleActivateToken}
              disabled={isActivating || !licenseTokenInput.trim()}
              style={{ backgroundColor: '#0284C7', borderColor: '#0284C7', fontWeight: 800 }}
            >
              {isActivating ? 'Verifying Hardware & Activating...' : '🔑 Activate Token on This PC'}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              onClick={handleActivateFile}
              disabled={isActivating || !fileContent}
              style={{ backgroundColor: '#0284C7', borderColor: '#0284C7', fontWeight: 800 }}
            >
              {isActivating ? 'Verifying File Envelope & Activating...' : '📥 Import .lic File & Bind Node'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
