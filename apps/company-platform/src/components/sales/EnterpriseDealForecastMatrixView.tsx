import React from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface DealForecast {
  dealId: string;
  clientName: string;
  contractTier: string;
  dealStage: 'CLINICAL_DEMO_50%' | 'SECURITY_NABH_AUDIT_75%' | 'LEGAL_BAA_PROCUREMENT_90%' | 'CLOSED_WON_100%';
  unweightedArr: string;
  probabilityWeightedArr: string;
  expectedCloseDays: number;
  executiveSponsor: string;
}

const DEALS: DealForecast[] = [
  {
    dealId: 'DEAL-ENT-01',
    clientName: 'Apollo Hospitals Group (50 Facilities)',
    contractTier: 'National Enterprise Master MSA',
    dealStage: 'LEGAL_BAA_PROCUREMENT_90%',
    unweightedArr: '₹ 1,20,00,000 / yr',
    probabilityWeightedArr: '₹ 1,08,00,000 / yr (90%)',
    expectedCloseDays: 6,
    executiveSponsor: 'Dr. Sangita Reddy (Joint Managing Director)'
  },
  {
    dealId: 'DEAL-ENT-02',
    clientName: 'Max Super Speciality Network',
    contractTier: 'Enterprise Growth + ICU Add-On',
    dealStage: 'SECURITY_NABH_AUDIT_75%',
    unweightedArr: '₹ 64,00,000 / yr',
    probabilityWeightedArr: '₹ 48,00,000 / yr (75%)',
    expectedCloseDays: 14,
    executiveSponsor: 'Chief Technology & Digital Health Officer'
  },
  {
    dealId: 'DEAL-ENT-03',
    clientName: 'Manipal Hospitals (South Cluster)',
    contractTier: 'Enterprise Multi-Tenant SaaS',
    dealStage: 'CLINICAL_DEMO_50%',
    unweightedArr: '₹ 48,00,000 / yr',
    probabilityWeightedArr: '₹ 24,00,000 / yr (50%)',
    expectedCloseDays: 28,
    executiveSponsor: 'Head of Clinical Governance & Quality'
  }
];

export const EnterpriseDealForecastMatrixView: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            📊 Enterprise Deal Stage & ARR Revenue Probability Forecast Matrix
          </h2>
          <Badge variant="success">● Probability Weighted ARR Forecasting Active</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Multi-stage healthcare enterprise contract forecasting: tracking sales cycle velocity, procurement blockers, and weighted ARR projections
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>TOTAL WEIGHTED PIPELINE ARR</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>₹ 1.80 Crore / yr</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Unweighted Total: ₹ 2.32 Crore / yr</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>AVERAGE SALES VELOCITY</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>24 Days</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>From Demo to Contract Signing</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>QUOTA ATTAINMENT RATE</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>142.8%</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Exceeding Q3 Sales Target</span>
        </div>
      </div>

      {/* Forecast Table */}
      <Card title="📜 Active Enterprise Healthcare Deals Pipeline" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hospital Client & Tier</TableHead>
                <TableHead>Deal Stage & Probability</TableHead>
                <TableHead>Unweighted ARR</TableHead>
                <TableHead>Probability-Weighted ARR</TableHead>
                <TableHead>Closing Window</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Executive Sponsor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEALS.map((d) => (
                <TableRow key={d.dealId}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{d.clientName}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>{d.contractTier}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.dealStage.includes('90%') ? 'success' : d.dealStage.includes('75%') ? 'primary' : 'warning'}>
                      {d.dealStage.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontWeight: 700 }}>
                    {d.unweightedArr}
                  </TableCell>
                  <TableCell style={{ fontWeight: 800, color: '#10B981', fontSize: '0.9375rem' }}>
                    {d.probabilityWeightedArr}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: '#38BDF8', fontWeight: 700 }}>
                    ~ {d.expectedCloseDays} Days
                  </TableCell>
                  <TableCell style={{ textAlign: 'right', fontSize: '0.75rem', color: '#CBD5E1' }}>
                    {d.executiveSponsor}
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
