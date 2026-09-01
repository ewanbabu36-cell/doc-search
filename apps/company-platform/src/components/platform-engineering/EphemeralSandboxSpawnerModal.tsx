import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSpawnSuccess: (sandboxUrl: string) => void;
}

export const EphemeralSandboxSpawnerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSpawnSuccess
}) => {
  const [branchName, setBranchName] = useState('feature/fhir-abdm-v2-enhancements');
  const [datasetPreset, setDatasetPreset] = useState('MOCK_HOSPITAL_CHAIN_DELHI');
  const [ttlHours, setTtlHours] = useState('4');
  const [includeMockServices, setIncludeMockServices] = useState(true);
  const [isSpawning, setIsSpawning] = useState(false);
  const [spawnedInfo, setSpawnedInfo] = useState<{
    url: string;
    expiresIn: string;
    clusterNamespace: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSpawn = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSpawning(true);

    setTimeout(() => {
      setIsSpawning(false);
      const prId = Math.floor(100 + Math.random() * 900);
      const generated = {
        url: `https://pr-${prId}.sandbox.docsearch.internal`,
        expiresIn: `${ttlHours} Hours (Auto-Destroy Active)`,
        clusterNamespace: `ephemeral-pr-${prId}`
      };
      setSpawnedInfo(generated);
      onSpawnSuccess(generated.url);
    }, 450);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(7, 12, 22, 0.9)',
      backdropFilter: 'blur(8px)',
      zIndex: 10012,
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
        maxWidth: '620px',
        padding: '26px',
        boxShadow: '0 25px 80px rgba(6, 182, 212, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚡ Ephemeral Sandbox Environment Spawner
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Provision isolated on-demand staging environments with automated TTL teardown
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

        {!spawnedInfo ? (
          <form onSubmit={handleSpawn} style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>GIT BRANCH / COMMIT REF *</label>
              <input
                type="text"
                required
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF', fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>SAMPLE DATASET PRESET *</label>
                <select
                  value={datasetPreset}
                  onChange={(e) => setDatasetPreset(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                >
                  <option value="MOCK_HOSPITAL_CHAIN_DELHI">Apollo & Fortis Multi-Branch Preset</option>
                  <option value="PATHOLOGY_NETWORK_MUMBAI">Metropolis & Suburban Labs Preset</option>
                  <option value="BLANK_HEALTHCARE_TENANT">Clean Empty Production DB Seed</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>AUTO-DESTROY LIFESPAN (TTL)</label>
                <select
                  value={ttlHours}
                  onChange={(e) => setTtlHours(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                >
                  <option value="2">2 Hours (Quick PR Review)</option>
                  <option value="4">4 Hours (Standard QA Testing)</option>
                  <option value="8">8 Hours (Full Working Day)</option>
                  <option value="24">24 Hours (Overnight Performance Run)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <input
                type="checkbox"
                id="mockServices"
                checked={includeMockServices}
                onChange={(e) => setIncludeMockServices(e.target.checked)}
              />
              <label htmlFor="mockServices" style={{ color: '#CBD5E1', cursor: 'pointer' }}>
                Provision Mock LIMS Blood Analyzers & ABDM Sandbox Gateways
              </label>
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
                disabled={isSpawning}
                style={{ backgroundColor: '#06B6D4', color: '#070C16', border: 'none', borderRadius: '6px', padding: '8px 22px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)' }}
              >
                {isSpawning ? '⚡ Provisioning K8s Pods...' : '🚀 Spawn Ephemeral Environment'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem' }}>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '8px', padding: '10px 14px', color: '#A7F3D0', fontWeight: 700 }}>
              ✓ Ephemeral Staging Sandbox Provisioned & Online!
            </div>

            <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <span style={{ color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 800 }}>LIVE PREVIEW URL:</span>
                <div style={{ fontFamily: 'monospace', color: '#38BDF8', fontWeight: 800, fontSize: '0.9375rem' }}>{spawnedInfo.url}</div>
              </div>

              <div>
                <span style={{ color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 800 }}>CLUSTER NAMESPACE:</span>
                <div style={{ fontFamily: 'monospace', color: '#CBD5E1' }}>{spawnedInfo.clusterNamespace}</div>
              </div>

              <div>
                <span style={{ color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 800 }}>TTL LIFESPAN:</span>
                <div style={{ color: '#FCD34D', fontWeight: 700 }}>{spawnedInfo.expiresIn}</div>
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
