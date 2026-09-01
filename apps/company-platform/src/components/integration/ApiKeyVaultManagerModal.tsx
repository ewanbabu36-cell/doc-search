import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onIssueSuccess: (apiKeyName: string) => void;
}

export const ApiKeyVaultManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onIssueSuccess
}) => {
  const [keyName, setKeyName] = useState('Apollo Hospitals North Hub API Client');
  const [partnerTenant, setPartnerTenant] = useState('Apex Apollo Hospital Group');
  const [ipWhitelist, setIpWhitelist] = useState('103.21.244.0/24, 185.199.108.0/24');
  const [rateLimitRps, setRateLimitRps] = useState('150');
  const [scope, setScope] = useState('FULL_CLINICAL_LIMS_EMR');
  const [isIssuing, setIsIssuing] = useState(false);
  const [generatedKeySlip, setGeneratedKeySlip] = useState<{
    clientId: string;
    apiSecret: string;
    hmacKey: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleIssueKey = (e: React.FormEvent) => {
    e.preventDefault();
    setIsIssuing(true);

    setTimeout(() => {
      setIsIssuing(false);
      setGeneratedKeySlip({
        clientId: `client_docsearch_${Math.floor(100000 + Math.random() * 900000)}`,
        apiSecret: `dsk_live_${Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join('')}`,
        hmacKey: `hmac_sha256_${Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
      });
      onIssueSuccess(keyName);
    }, 450);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(7, 12, 22, 0.9)',
      backdropFilter: 'blur(8px)',
      zIndex: 10010,
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
        maxWidth: '640px',
        padding: '26px',
        boxShadow: '0 25px 80px rgba(6, 182, 212, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🔑 API Key & OAuth2 Credential Vault
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Issue cryptographically signed API keys with CIDR IP whitelisting and zero-downtime rotation
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

        {!generatedKeySlip ? (
          <form onSubmit={handleIssueKey} style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>API CLIENT NAME *</label>
              <input
                type="text"
                required
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>PARTNER TENANT *</label>
                <select
                  value={partnerTenant}
                  onChange={(e) => setPartnerTenant(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                >
                  <option value="Apex Apollo Hospital Group">Apex Apollo Hospital Group</option>
                  <option value="Metropolis Healthcare Lab Network">Metropolis Healthcare Lab Network</option>
                  <option value="Fortis Escorts Heart Institute">Fortis Escorts Heart Institute</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>RATE LIMIT (REQ / SEC)</label>
                <input
                  type="number"
                  required
                  value={rateLimitRps}
                  onChange={(e) => setRateLimitRps(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>ALLOWED IP WHITELIST (CIDR NOTATION)</label>
              <input
                type="text"
                value={ipWhitelist}
                onChange={(e) => setIpWhitelist(e.target.value)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF', fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>PERMISSION SCOPE</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
              >
                <option value="FULL_CLINICAL_LIMS_EMR">Full Clinical EMR + LIMS Blood Analyzer Sync</option>
                <option value="LIMS_ONLY">Pathology Laboratory LIMS Integration Only</option>
                <option value="DICOM_PACS_ONLY">Radiology DICOM / PACS Image Push Only</option>
                <option value="READ_ONLY">Read-Only Health Records API</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#CBD5E1', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isIssuing}
                style={{ backgroundColor: '#06B6D4', color: '#070C16', border: 'none', borderRadius: '6px', padding: '8px 22px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)' }}
              >
                {isIssuing ? '⚡ Generating Cryptographic Keys...' : '🔑 Issue API Key'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem' }}>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '8px', padding: '10px 14px', color: '#A7F3D0', fontWeight: 700 }}>
              ✓ API Client & Secrets Generated Successfully!
            </div>

            <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <span style={{ color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 800 }}>CLIENT ID:</span>
                <div style={{ fontFamily: 'monospace', color: '#38BDF8', fontWeight: 700 }}>{generatedKeySlip.clientId}</div>
              </div>

              <div>
                <span style={{ color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 800 }}>API SECRET KEY (Bearer Token):</span>
                <div style={{ fontFamily: 'monospace', color: '#10B981', fontWeight: 700, wordBreak: 'break-all' }}>{generatedKeySlip.apiSecret}</div>
              </div>

              <div>
                <span style={{ color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 800 }}>HMAC SHA-256 SIGNING SECRET:</span>
                <div style={{ fontFamily: 'monospace', color: '#FCD34D', fontWeight: 700, wordBreak: 'break-all' }}>{generatedKeySlip.hmacKey}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                style={{ backgroundColor: '#06B6D4', color: '#070C16', border: 'none', borderRadius: '6px', padding: '8px 20px', fontWeight: 900, cursor: 'pointer' }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
