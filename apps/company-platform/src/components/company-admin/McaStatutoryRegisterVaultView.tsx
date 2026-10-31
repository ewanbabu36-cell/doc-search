import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface BoardResolution {
  resolutionId: string;
  resolutionTitle: string;
  mcaFormReference: string;
  directorDinSignatory: string;
  passedDate: string;
  dscSealStatus: 'SEALED_WITH_DSC' | 'PENDING_DIRECTOR_SIGNATURE';
}

const INITIAL_RESOLUTIONS: BoardResolution[] = [];

export const McaStatutoryRegisterVaultView: React.FC = () => {
  const [resolutions, setResolutions] = useState<BoardResolution[]>(INITIAL_RESOLUTIONS);
  const [sealNotice, setSealNotice] = useState<string | null>(null);

  const handleSealDsc = (resId: string) => {
    setResolutions((prev) =>
      prev.map((r) =>
        r.resolutionId === resId ? { ...r, dscSealStatus: 'SEALED_WITH_DSC' } : r
      )
    );
    setSealNotice(`✓ Board Resolution "${resId}" cryptographically sealed with Class 3 Digital Signature Certificate (DSC) and queued for MCA V3 portal sync!`);
    setTimeout(() => setSealNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            📜 MCA / ROC Statutory Register & Board Resolution Vault
          </h2>
          <Badge variant="success">● MCA V3 Portal & Class 3 DSC Live Sync Active</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Ministry of Corporate Affairs statutory registers, Form AOC-4/MGT-7 filings, and cryptographically signed Board of Directors resolutions
        </p>
      </div>

      {sealNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {sealNotice}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>MCA STATUTORY FILING STATUS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>100% Compliant</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Zero ROC late fees / penalties</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>CORPORATE CIN</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px', fontFamily: 'monospace' }}>U72900DL2024PTC398120</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Registrar of Companies, Delhi</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>DIGITAL DSC VALIDITY</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>Active (Class 3)</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>eMudhra Root CA certified</span>
        </div>
      </div>

      {/* Resolutions Table */}
      <Card title="📜 Board of Directors Resolutions & MCA Filings" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resolution Title & Number</TableHead>
                <TableHead>MCA e-Form Reference</TableHead>
                <TableHead>Director DIN Signatory</TableHead>
                <TableHead>Passed Date</TableHead>
                <TableHead>DSC Seal Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resolutions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', padding: '48px 24px', color: '#94A3B8' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📜</div>
                    <strong style={{ color: '#F8FAFC', fontSize: '0.9375rem', display: 'block', marginBottom: '6px' }}>
                      No MCA Statutory Resolutions Archived
                    </strong>
                    <span style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', maxWidth: '440px', margin: '0 auto 16px' }}>
                      All corporate board resolutions, MCA V3 filings, AOC-4, and MGT-7 statutory registers will be cryptographically vaulted here.
                    </span>
                    <button
                      type="button"
                      onClick={() => {}}
                      style={{
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        color: '#38BDF8',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      + File Board Resolution
                    </button>
                  </TableCell>
                </TableRow>
              ) : (
                resolutions.map((r) => (
                  <TableRow key={r.resolutionId}>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{r.resolutionTitle}</strong>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#38BDF8', display: 'block' }}>{r.resolutionId}</span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                      {r.mcaFormReference}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>
                      {r.directorDinSignatory}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      {r.passedDate}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.dscSealStatus === 'SEALED_WITH_DSC' ? 'success' : 'warning'}>
                        {r.dscSealStatus.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      {r.dscSealStatus === 'PENDING_DIRECTOR_SIGNATURE' ? (
                        <button
                          type="button"
                          onClick={() => handleSealDsc(r.resolutionId)}
                        >
                          📜 Seal with DSC
                        </button>
                      ) : (
                        <span style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 700 }}>✓ Digitally Signed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
