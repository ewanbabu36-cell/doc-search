import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface PoshMember {
  role: string;
  name: string;
  designationAffiliation: string;
  contactEmail: string;
  status: 'ACTIVE_STATUTORY_MEMBER';
}

const MEMBERS: PoshMember[] = [
  {
    role: 'Presiding Officer (Senior Woman Executive)',
    name: 'Dr. Suniti Singhania',
    designationAffiliation: 'VP - Clinical Operations & Governance',
    contactEmail: 'suniti.s@docsearch.internal',
    status: 'ACTIVE_STATUTORY_MEMBER'
  },
  {
    role: 'External Member (NGO / Legal Advocate)',
    name: 'Advocate Radhika Swaminathan',
    designationAffiliation: 'High Court Advocate & Women Rights Activist',
    contactEmail: 'radhika.swaminathan@legaladvocates.org',
    status: 'ACTIVE_STATUTORY_MEMBER'
  },
  {
    role: 'Internal Member (HR Lead)',
    name: 'Deepak Sharma',
    designationAffiliation: 'Head of People & Culture',
    contactEmail: 'deepak.s@docsearch.internal',
    status: 'ACTIVE_STATUTORY_MEMBER'
  }
];

export const PoshEthicsVigilanceView: React.FC = () => {
  const [certNotice, setCertNotice] = useState<string | null>(null);

  const handleIssuePoshCertificate = () => {
    setCertNotice('✓ Annual POSH Act 2013 Statutory Compliance Certificate generated with 100% staff training completion!');
    setTimeout(() => setCertNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              ⚖️ Statutory POSH & Corporate Ethics Vigilance Desk
            </h2>
            <Badge variant="success">● POSH Act 2013 & Internal Complaints Committee Active</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Statutory Internal Complaints Committee (ICC), anonymous whistleblower grievance handling, and annual workplace safety certification
          </p>
        </div>

        <button
          type="button"
          onClick={handleIssuePoshCertificate}
          style={{ backgroundColor: '#10B981', color: '#070C16', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 900, fontSize: '0.8125rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' }}
        >
          ⚖️ Issue POSH Annual Compliance Certificate
        </button>
      </div>

      {certNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {certNotice}
        </div>
      )}

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>STAFF TRAINING COMPLETION</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>100.0% Certified</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>All 240 internal employees</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>PENDING GRIEVANCES</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>0 Open Cases</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Zero workplace harassment incidents</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>ICC EXTERNAL INDEPENDENCE</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>100% Compliant</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Third-party NGO legal member active</span>
        </div>
      </div>

      {/* ICC Committee Table */}
      <Card title="📜 Internal Complaints Committee (ICC) Statutory Members" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Statutory Committee Role</TableHead>
                <TableHead>Member Name</TableHead>
                <TableHead>Designation & Organization</TableHead>
                <TableHead>Official Contact</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MEMBERS.map((m) => (
                <TableRow key={m.contactEmail}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{m.role}</strong>
                  </TableCell>
                  <TableCell style={{ fontWeight: 700, color: '#38BDF8' }}>
                    {m.name}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>
                    {m.designationAffiliation}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontFamily: 'monospace', color: '#94A3B8' }}>
                    {m.contactEmail}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Badge variant="success">✓ ACTIVE ICC</Badge>
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
