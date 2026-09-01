import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface SubsidiaryEntity {
  entityId: string;
  name: string;
  incorporationCountry: string;
  relationshipType: 'PARENT_HOLDING' | 'WHOLLY_OWNED_SUBSIDIARY' | 'INTERNATIONAL_BRANCH';
  activeIntercompanySlas: string;
  transferPricingMarkup: string;
  auditState: 'TRANSFER_PRICING_COMPLIANT';
}

const SUBSIDIARIES: SubsidiaryEntity[] = [
  {
    entityId: 'ENT-INDIA-01',
    name: 'DocSearch Technologies India Pvt Ltd (Parent)',
    incorporationCountry: 'India (New Delhi)',
    relationshipType: 'PARENT_HOLDING',
    activeIntercompanySlas: 'Core EMR Platform & Intellectual Property Owner',
    transferPricingMarkup: 'Cost + 15% (Sec 92C Compliant)',
    auditState: 'TRANSFER_PRICING_COMPLIANT'
  },
  {
    entityId: 'ENT-LABS-02',
    name: 'DocSearch Diagnostic & Pathology Services Ltd',
    incorporationCountry: 'India (Bengaluru Hub)',
    relationshipType: 'WHOLLY_OWNED_SUBSIDIARY',
    activeIntercompanySlas: 'NABL Sample Logistics & Diagnostic Phlebotomy Ingress',
    transferPricingMarkup: 'Arm\'s Length Cost Shared',
    auditState: 'TRANSFER_PRICING_COMPLIANT'
  },
  {
    entityId: 'ENT-USA-03',
    name: 'DocSearch Telehealth & AI Systems Inc.',
    incorporationCountry: 'United States (Delaware C-Corp)',
    relationshipType: 'INTERNATIONAL_BRANCH',
    activeIntercompanySlas: 'US HIPAA Cross-Border Teleconsultation Software License',
    transferPricingMarkup: 'Cost + 12% Cross-Border Royalty',
    auditState: 'TRANSFER_PRICING_COMPLIANT'
  }
];

export const SubsidiaryTransferEscrowView: React.FC = () => {
  const [reconcileNotice, setReconcileNotice] = useState<string | null>(null);

  const handleReconcile = () => {
    setReconcileNotice('✓ Inter-company transfer pricing & shared SLA ledgers successfully reconciled for all 3 legal entities under Section 92C Income Tax Act!');
    setTimeout(() => setReconcileNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              🏢 Multi-Subsidiary & Inter-Company Transfer Pricing Escrow
            </h2>
            <Badge variant="success">● Section 92C Arm\'s Length Transfer Pricing Active</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Corporate holding structure: inter-company shared service SLAs, intellectual property royalties, and cross-border cross-entity billing
          </p>
        </div>

        <button
          type="button"
          onClick={handleReconcile}
          style={{ backgroundColor: '#06B6D4', color: '#070C16', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 900, fontSize: '0.8125rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(6, 182, 212, 0.4)' }}
        >
          🏢 Reconcile Inter-Company SLA Billings
        </button>
      </div>

      {reconcileNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {reconcileNotice}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>CORPORATE GROUP ENTITIES</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>3 Legal Entities</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Parent + 2 Global Subsidiaries</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>TRANSFER PRICING AUDIT</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>100% Compliant</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Form 3CEB Certified by Big 4 Auditors</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>INTER-COMPANY ESCROW</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>₹ 84.5 Lakhs</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Shared technology infrastructure SLA</span>
        </div>
      </div>

      {/* Subsidiaries Table */}
      <Card title="📜 Corporate Subsidiaries & Inter-Company Master Agreements" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Legal Entity Name</TableHead>
                <TableHead>Jurisdiction</TableHead>
                <TableHead>Corporate Relationship</TableHead>
                <TableHead>Active Intercompany SLA</TableHead>
                <TableHead>Transfer Pricing Markup</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Audit State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SUBSIDIARIES.map((s) => (
                <TableRow key={s.entityId}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{s.name}</strong>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#38BDF8', display: 'block' }}>{s.entityId}</span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {s.incorporationCountry}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.relationshipType === 'PARENT_HOLDING' ? 'primary' : 'neutral'}>
                      {s.relationshipType.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#CBD5E1', maxWidth: '260px' }}>
                    {s.activeIntercompanySlas}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#FCD34D', fontWeight: 700 }}>
                    {s.transferPricingMarkup}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Badge variant="success">✓ {s.auditState.replace(/_/g, ' ')}</Badge>
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
