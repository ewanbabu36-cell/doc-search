import React, { useState } from 'react';
import { Card, Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface CostLineItem {
  resource: string;
  provider: string;
  monthlyCost: string;
  utilizationPct: number;
  aiSavingRecommendation: string;
  potentialMonthlySaving: string;
}

const COST_ITEMS: CostLineItem[] = [
  {
    resource: 'AWS EKS Primary Cluster (m6i.2xlarge Worker Nodes)',
    provider: 'AWS ap-south-1 (Mumbai)',
    monthlyCost: '₹1,84,000',
    utilizationPct: 38,
    aiSavingRecommendation: 'Switch non-critical worker node pools to AWS Graviton (c7g.2xlarge) + Spot instances.',
    potentialMonthlySaving: '₹62,000 / mo'
  },
  {
    resource: 'MongoDB Atlas Dedicated Cluster (M40 Multi-Region)',
    provider: 'MongoDB Atlas Cloud',
    monthlyCost: '₹95,000',
    utilizationPct: 45,
    aiSavingRecommendation: 'Enable auto-tiering archival for medical audit logs older than 90 days to S3 Glacier.',
    potentialMonthlySaving: '₹34,000 / mo'
  },
  {
    resource: 'Google Cloud Vertex AI (Med-PaLM 2 Inference)',
    provider: 'GCP asia-south1',
    monthlyCost: '₹1,12,000',
    utilizationPct: 82,
    aiSavingRecommendation: 'Purchase 1-Year Committed Use Discount (CUD) for baseline 500k daily clinical queries.',
    potentialMonthlySaving: '₹38,000 / mo'
  },
  {
    resource: 'AWS S3 & Cloudflare CDN (DICOM & PACS Image Cache)',
    provider: 'Cloudflare / AWS S3',
    monthlyCost: '₹42,000',
    utilizationPct: 65,
    aiSavingRecommendation: 'Configure aggressive WebP/AVIF compression on static asset headers.',
    potentialMonthlySaving: '₹14,000 / mo'
  }
];

export const CloudFinopsCostOptimizerView: React.FC = () => {
  const [items] = useState<CostLineItem[]>(COST_ITEMS);
  const [appliedSavings, setAppliedSavings] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              ☁️ Cloud FinOps Multi-Cloud Cost Optimizer
            </h2>
            <Badge variant="warning">Monthly Run-Rate: ₹4,33,000</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Automated multi-cloud cost intelligence, over-provisioned node rightsizing, and committed use discounts
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setAppliedSavings(true)}
          style={{ backgroundColor: '#10B981', color: '#070C16', fontWeight: 900 }}
        >
          {appliedSavings ? '✓ FinOps Optimizations Queued' : '⚡ Apply All AI Cost Optimizations (-₹1,48,000/mo)'}
        </Button>
      </div>

      {appliedSavings && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          ✓ Terraform & CloudFormation PR created to downsize idle node pools and apply Graviton spot instances (Expected annual saving: ₹17.76 Lakhs)!
        </div>
      )}

      {/* Cost Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>CURRENT MONTHLY SPEND</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>₹4,33,000 / mo</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>AWS, GCP, Mongo & Cloudflare</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>POTENTIAL AI SAVINGS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>-₹1,48,000 / mo</div>
          <span style={{ fontSize: '0.75rem', color: '#A7F3D0', marginTop: '4px', display: 'block' }}>34.1% Cost reduction</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>COST PER PATIENT CONSULT</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>₹0.42 / Visit</div>
          <span style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '4px', display: 'block' }}>Industry benchmark: ₹2.80</span>
        </div>
      </div>

      {/* Breakdown Table */}
      <Card title="📜 Cloud Resource Cost Breakdown & Actionable Directives" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cloud Resource</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Monthly Cost</TableHead>
                <TableHead>AI Rightsizing Directive</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Est. Savings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.resource}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{it.resource}</strong>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {it.provider}
                  </TableCell>
                  <TableCell style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                    {it.monthlyCost}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#CBD5E1', maxWidth: '300px' }}>
                    {it.aiSavingRecommendation}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right', color: '#10B981', fontWeight: 800, fontFamily: 'monospace' }}>
                    {it.potentialMonthlySaving}
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
