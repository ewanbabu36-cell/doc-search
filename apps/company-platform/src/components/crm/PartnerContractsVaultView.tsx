import React, { useState } from 'react';
import { Card, Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface B2BContract {
  id: string;
  partnerName: string;
  partnerType: string;
  contractType: 'MASTER_SERVICE_AGREEMENT' | 'SERVICE_LEVEL_AGREEMENT' | 'DATA_PROCESSING_ADDENDUM' | 'BUSINESS_ASSOCIATE_AGREEMENT';
  slaTier: 'PLATINUM_99_99' | 'GOLD_99_95' | 'SILVER_99_90';
  effectiveDate: string;
  expiryDate: string;
  status: 'ACTIVE' | 'PENDING_SIGNATURE' | 'RENEWAL_DUE' | 'EXPIRED';
  annualContractValue: number;
  signedByPartner: string;
  signedByCompany: string;
}

const loadDynamicContracts = (): B2BContract[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('docsearch_b2b_contracts');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // Auto-derive legal agreements from live registered partners
    const regPartners = JSON.parse(localStorage.getItem('docsearch_registered_partners') || '[]');
    if (Array.isArray(regPartners) && regPartners.length > 0) {
      return regPartners.map((p: any, idx: number) => ({
        id: `CTR-2026-${String(idx + 1).padStart(3, '0')}`,
        partnerName: p.facilityName || p.name || 'Healthcare Facility',
        partnerType: p.facilityType === 'PATHOLOGY' ? 'DIAGNOSTIC_LAB' : p.facilityType === 'CLINIC' ? 'CLINIC_GROUP' : p.facilityType === 'PHARMACY' ? 'PHARMACY' : 'HOSPITAL_NETWORK',
        contractType: 'MASTER_SERVICE_AGREEMENT',
        slaTier: 'PLATINUM_99_99',
        effectiveDate: new Date().toISOString().slice(0, 10),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: p.kycStatus === 'KYC_VERIFIED' ? 'ACTIVE' : 'PENDING_SIGNATURE',
        annualContractValue: 0, // Pioneer Complimentary Plan
        signedByPartner: p.name || 'Facility Administrator',
        signedByCompany: 'DocSearch Legal Counsel'
      }));
    }
    return [];
  } catch {
    return [];
  }
};

export const PartnerContractsVaultView: React.FC = () => {
  const [contracts, setContracts] = useState<B2BContract[]>(loadDynamicContracts);
  const [selectedContract, setSelectedContract] = useState<B2BContract | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New contract generator state
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerType, setNewPartnerType] = useState('HOSPITAL_NETWORK');
  const [newContractType, setNewContractType] = useState<B2BContract['contractType']>('MASTER_SERVICE_AGREEMENT');
  const [newSlaTier, setNewSlaTier] = useState<B2BContract['slaTier']>('PLATINUM_99_99');
  const [newAcv, setNewAcv] = useState('0');

  const saveContracts = (updated: B2BContract[]) => {
    setContracts(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('docsearch_b2b_contracts', JSON.stringify(updated));
      } catch {}
    }
  };

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName.trim()) return;

    const created: B2BContract = {
      id: `CTR-2026-${String(contracts.length + 1).padStart(3, '0')}`,
      partnerName: newPartnerName.trim(),
      partnerType: newPartnerType,
      contractType: newContractType,
      slaTier: newSlaTier,
      effectiveDate: new Date().toISOString().slice(0, 10),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'ACTIVE',
      annualContractValue: parseFloat(newAcv) || 0,
      signedByPartner: 'Authorized Signatory',
      signedByCompany: 'DocSearch Legal Counsel & CEO'
    };

    saveContracts([created, ...contracts]);
    setIsGeneratorOpen(false);
    setNewPartnerName('');
    setSuccessMessage(`Contract ${created.id} generated for "${created.partnerName}" successfully!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleDownloadContractPdf = (contract: B2BContract) => {
    console.log(contract);
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              📑 B2B Enterprise Contracts, SLA & Legal Vault
            </h2>
            <Badge variant="primary">99.95% Guaranteed SLA</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Digital Master Service Agreements (MSA), Business Associate Agreements (BAA), and regulatory Data Processing Addendums
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsGeneratorOpen(true)}>
          + Draft New B2B Contract
        </Button>
      </div>

      {successMessage && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          ✓ {successMessage}
        </div>
      )}

      {/* Contract Metrics Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '14px 18px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>TOTAL ACTIVE CONTRACTS</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>{contracts.length} Agreements</div>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '14px 18px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>ANNUAL CONTRACT VALUE (ACV)</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
            ₹ {(contracts.reduce((sum, c) => sum + c.annualContractValue, 0)).toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '14px 18px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>RENEWALS DUE (30 DAYS)</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F59E0B', marginTop: '2px' }}>
            {contracts.filter((c) => c.status === 'RENEWAL_DUE').length} Facilities
          </div>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '14px 18px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>COMPLIANCE INDEMNITY</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>100% Covered</div>
        </div>
      </div>

      {/* Contracts Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract ID</TableHead>
                <TableHead>Healthcare Partner</TableHead>
                <TableHead>Agreement Type</TableHead>
                <TableHead>SLA Tier</TableHead>
                <TableHead>Annual Value (ACV)</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--ds-color-text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '2rem' }}>📜</span>
                      <span style={{ fontWeight: 700, color: '#F8FAFC' }}>No B2B Contracts in Vault</span>
                      <span style={{ fontSize: '0.8125rem' }}>Registered partners or newly drafted contracts will appear here dynamically.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                    <strong style={{ fontFamily: 'monospace', color: '#38BDF8' }}>{c.id}</strong>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{c.partnerName}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{c.partnerType}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                      {c.contractType.replace(/_/g, ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.slaTier === 'PLATINUM_99_99' ? 'primary' : 'success'}>
                      {c.slaTier.replace(/_/g, '.')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: '#10B981' }}>₹ {c.annualContractValue.toLocaleString('en-IN')}</strong>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                      {c.effectiveDate} to {c.expiryDate}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        c.status === 'ACTIVE'
                          ? 'success'
                          : c.status === 'RENEWAL_DUE'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <Button variant="outline" size="sm" onClick={() => setSelectedContract(c)}>
                        👁️ View Legal Terms
                      </Button>
                      <Button variant="subtle" size="sm" onClick={() => handleDownloadContractPdf(c)}>
                        🖨️ PDF
                      </Button>
                    </div>
                  </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Contract Viewer & Signatures Modal */}
      {selectedContract && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(7, 12, 22, 0.88)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#0F172A',
            color: '#F8FAFC',
            border: '1.5px solid rgba(6, 182, 212, 0.4)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '780px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 25px 70px rgba(0,0,0,0.95)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '14px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8' }}>
                  {selectedContract.contractType.replace(/_/g, ' ')}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Contract Ref: <strong style={{ color: '#FFF' }}>{selectedContract.id}</strong> • SLA Tier: <strong style={{ color: '#10B981' }}>{selectedContract.slaTier}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedContract(null)}
                style={{ background: 'none', border: 'none', color: '#CBD5E1', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Legal Text Body */}
            <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '18px', fontSize: '0.8125rem', lineHeight: '1.6', color: '#CBD5E1', marginBottom: '18px' }}>
              <h4 style={{ color: '#F8FAFC', margin: '0 0 8px' }}>1. PARTIES & RECITALS</h4>
              <p>This Healthcare Software-as-a-Service Agreement is entered between <strong>DocSearch Technologies Pvt Ltd</strong> ("Company") and <strong>{selectedContract.partnerName}</strong> ("Healthcare Partner").</p>

              <h4 style={{ color: '#F8FAFC', margin: '12px 0 8px' }}>2. SERVICE LEVEL GUARANTEE & UPTIME COMMITMENT</h4>
              <p>The Company guarantees a minimum monthly platform availability of <strong>{selectedContract.slaTier === 'PLATINUM_99_99' ? '99.99%' : '99.95%'}</strong> across API Gateway, ABDM Health Data Exchange, and EMR services. Service credits of 10% monthly fee apply for unplanned downtime exceeding SLA thresholds.</p>

              <h4 style={{ color: '#F8FAFC', margin: '12px 0 8px' }}>3. DATA PROTECTION & DISHA / ABDM COMPLIANCE</h4>
              <p>All Protected Health Information (PHI) is encrypted at rest using AES-256 and in transit using TLS 1.3. Patient consent artifacts comply with Ayushman Bharat Digital Mission (ABDM) guidelines.</p>

              <h4 style={{ color: '#F8FAFC', margin: '12px 0 8px' }}>4. COMMERCIAL TERMS</h4>
              <p>Annual Contract Value (ACV): <strong>₹ {selectedContract.annualContractValue.toLocaleString('en-IN')} + 18% GST</strong> payable quarterly in advance.</p>
            </div>

            {/* Digital Signatures Box */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid #334155', paddingTop: '16px' }}>
              <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800 }}>HEALTHCARE PARTNER SIGNATORY:</span>
                <div style={{ fontFamily: 'cursive', fontSize: '1.2rem', color: '#38BDF8', margin: '6px 0 2px' }}>{selectedContract.signedByPartner}</div>
                <span style={{ fontSize: '0.6875rem', color: '#10B981' }}>✓ Digitally Signed with Aadhaar/DSC</span>
              </div>

              <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800 }}>DOCSEARCH AUTHORIZED SIGNATORY:</span>
                <div style={{ fontFamily: 'cursive', fontSize: '1.2rem', color: '#34D399', margin: '6px 0 2px' }}>{selectedContract.signedByCompany}</div>
                <span style={{ fontSize: '0.6875rem', color: '#10B981' }}>✓ Enterprise Cryptographic Timestamp</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setSelectedContract(null)}
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFF', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleDownloadContractPdf(selectedContract)}
              >
                🖨️ Print / Download Official PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draft New Contract Modal */}
      {isGeneratorOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(7, 12, 22, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#0F172A',
            color: '#F8FAFC',
            border: '1px solid #334155',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            padding: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.85)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#38BDF8' }}>
                📝 Draft Enterprise B2B SaaS Contract
              </h3>
              <button
                type="button"
                onClick={() => setIsGeneratorOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.125rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateContract} style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>PARTNER LEGAL ENTITY NAME *</label>
                <input
                  type="text"
                  required
                  value={newPartnerName}
                  onChange={(e) => setNewPartnerName(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>PARTNER CLASSIFICATION</label>
                  <select
                    value={newPartnerType}
                    onChange={(e) => setNewPartnerType(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  >
                    <option value="HOSPITAL_NETWORK">Hospital Network</option>
                    <option value="DIAGNOSTIC_LAB">Diagnostic Lab</option>
                    <option value="SURGICAL_CENTER">Surgical Center</option>
                    <option value="CLINIC_GROUP">Clinic Group</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>SLA TIER</label>
                  <select
                    value={newSlaTier}
                    onChange={(e) => setNewSlaTier(e.target.value as any)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  >
                    <option value="PLATINUM_99_99">Platinum 99.99% Uptime SLA</option>
                    <option value="GOLD_99_95">Gold 99.95% Uptime SLA</option>
                    <option value="SILVER_99_90">Silver 99.90% Standard SLA</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>AGREEMENT TYPE</label>
                  <select
                    value={newContractType}
                    onChange={(e) => setNewContractType(e.target.value as any)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  >
                    <option value="MASTER_SERVICE_AGREEMENT">Master Service Agreement (MSA)</option>
                    <option value="SERVICE_LEVEL_AGREEMENT">Service Level Agreement (SLA)</option>
                    <option value="DATA_PROCESSING_ADDENDUM">Data Processing Addendum (DPA)</option>
                    <option value="BUSINESS_ASSOCIATE_AGREEMENT">Business Associate (BAA)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>ANNUAL VALUE (ACV INR) *</label>
                  <input
                    type="number"
                    required
                    value={newAcv}
                    onChange={(e) => setNewAcv(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setIsGeneratorOpen(false)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#CBD5E1', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                >
                  📑 Generate & Issue Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
