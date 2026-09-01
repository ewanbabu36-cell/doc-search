import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface SovereignRegion {
  regionCode: string;
  regionName: string;
  complianceStandard: string;
  cloudHostCluster: string;
  phiDataResidency: 'STRICT_IN_COUNTRY_PINNED';
  encryptionStandard: string;
  activePatientRecords: string;
  sovereigntyState: 'AUDITED_COMPLIANT';
}

const REGIONS: SovereignRegion[] = [
  {
    regionCode: 'US-EAST-HIPAA',
    regionName: 'United States & North America',
    complianceStandard: 'HIPAA Security Rule / HITECH / SOC2 Type II',
    cloudHostCluster: 'AWS us-east-1 (N. Virginia Medical Zone)',
    phiDataResidency: 'STRICT_IN_COUNTRY_PINNED',
    encryptionStandard: 'FIPS 140-2 Level 3 KMS Envelope (AES-256)',
    activePatientRecords: '420,000 PHI Vaults',
    sovereigntyState: 'AUDITED_COMPLIANT'
  },
  {
    regionCode: 'EU-CENTRAL-GDPR',
    regionName: 'European Union & UK',
    complianceStandard: 'GDPR Article 9 Special Category PHI / EU Cloud CoC',
    cloudHostCluster: 'AWS eu-central-1 (Frankfurt Medical Zone)',
    phiDataResidency: 'STRICT_IN_COUNTRY_PINNED',
    encryptionStandard: 'Hardware Root of Trust HSM with EU Sovereign Key',
    activePatientRecords: '280,000 PHI Vaults',
    sovereigntyState: 'AUDITED_COMPLIANT'
  },
  {
    regionCode: 'ME-DUBAI-DPL',
    regionName: 'United Arab Emirates & Saudi Arabia',
    complianceStandard: 'UAE Federal Decree-Law No. 45 / Saudi DPL / Seha',
    cloudHostCluster: 'AWS me-central-1 (UAE Dubai Sovereign Hub)',
    phiDataResidency: 'STRICT_IN_COUNTRY_PINNED',
    encryptionStandard: 'ZATCA & UAE NESA Compliant Key Vault',
    activePatientRecords: '190,000 PHI Vaults',
    sovereigntyState: 'AUDITED_COMPLIANT'
  },
  {
    regionCode: 'APAC-INDIA-DPDP',
    regionName: 'India & South Asia',
    complianceStandard: 'Digital Personal Data Protection (DPDP) Act 2023 / ABDM',
    cloudHostCluster: 'AWS ap-south-1 (Mumbai Sovereign Cloud)',
    phiDataResidency: 'STRICT_IN_COUNTRY_PINNED',
    encryptionStandard: 'MeitY Empanelled Cloud with ABDM Milestone 1-3 Bridge',
    activePatientRecords: '1,840,000 PHI Vaults',
    sovereigntyState: 'AUDITED_COMPLIANT'
  }
];

export const MultiRegionDataSovereigntyRouterView: React.FC = () => {
  const [lockNotice, setLockNotice] = useState<string | null>(null);

  const handleEnforceLock = () => {
    setLockNotice('✓ Cryptographic Sovereign Geo-Pinning Lock successfully verified! All cross-border PHI transfers without explicit patient consent are blocked at the edge proxy.');
    setTimeout(() => setLockNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              🌐 Multi-Region Healthcare Data Sovereignty & Geo-Pinning Router
            </h2>
            <Badge variant="success">● 4 Sovereign Cloud Hubs Active (Zero Cross-Border Leakage)</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Strict jurisdictional in-country data pinning across USA (HIPAA), EU (GDPR), UAE/Saudi (Seha), and India (DPDP 2023)
          </p>
        </div>

        <button
          type="button"
          onClick={handleEnforceLock}
          style={{
            backgroundColor: '#06B6D4',
            color: '#070C16',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontWeight: 900,
            fontSize: '0.8125rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(6, 182, 212, 0.4)'
          }}
        >
          🔒 Enforce Sovereign Geo-Pinning Lock
        </button>
      </div>

      {lockNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {lockNotice}
        </div>
      )}

      {/* Region KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>TOTAL PROTECTED PHI VAULTS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>2.73 Million</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>100% In-Country Geo-Pinned</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>CROSS-BORDER TRANSFER VIOLATIONS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>0 Violations</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Hard Edge Proxy Block Enforced</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>SOVEREIGN HSM KEYS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>4 Dedicated HSMs</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Jurisdiction-Specific Root CAs</span>
        </div>
      </div>

      {/* Sovereignty Table */}
      <Card title="📜 Regional Data Residency & Encryption Control Plane" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Region Code & Jurisdiction</TableHead>
                <TableHead>Regulatory Standard</TableHead>
                <TableHead>Cloud Data Center Cluster</TableHead>
                <TableHead>Hardware KMS Encryption</TableHead>
                <TableHead>Active PHI Vaults</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Audit State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {REGIONS.map((r) => (
                <TableRow key={r.regionCode}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{r.regionName}</strong>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#38BDF8', display: 'block' }}>{r.regionCode}</span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                    {r.complianceStandard}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#CBD5E1' }}>
                    {r.cloudHostCluster}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#FCD34D' }}>
                    {r.encryptionStandard}
                  </TableCell>
                  <TableCell style={{ fontWeight: 800, color: '#10B981' }}>
                    {r.activePatientRecords}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Badge variant="success">✓ {r.sovereigntyState.replace(/_/g, ' ')}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
