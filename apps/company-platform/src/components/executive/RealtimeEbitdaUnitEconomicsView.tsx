import React from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface UnitEconomicMetric {
  metricName: string;
  currentValue: string;
  industryBenchmark: string;
  marginImpact: string;
  status: 'PROFITABLE_HEALTHY' | 'ON_TRACK';
}

const METRICS: UnitEconomicMetric[] = [
  {
    metricName: 'Gross Merchandise Value (GMV) Run-Rate',
    currentValue: '₹ 17.8 Crore / year',
    industryBenchmark: '₹ 10.0 Crore (Seed/Series A)',
    marginImpact: '+ 78.0% Above Target',
    status: 'PROFITABLE_HEALTHY'
  },
  {
    metricName: 'DocSearch Net Platform Take-Rate',
    currentValue: '15.2% Net Commission',
    industryBenchmark: '12.0% - 15.0% Healthcare Avg',
    marginImpact: 'High Operating Leverage',
    status: 'PROFITABLE_HEALTHY'
  },
  {
    metricName: 'Customer Acquisition Cost (CAC) vs. LTV Ratio',
    currentValue: '1 : 6.4 (₹420 CAC / ₹2,688 LTV)',
    industryBenchmark: '1 : 3.0 Standard SaaS Target',
    marginImpact: 'Organic Doctor Flywheel Driven',
    status: 'PROFITABLE_HEALTHY'
  },
  {
    metricName: 'Monthly Gross Burn vs. Free Cash Flow',
    currentValue: '+ ₹ 12.4 Lakhs / mo (Cash Positive)',
    industryBenchmark: 'Negative Burn',
    marginImpact: 'Zero Equity Dilution Risk',
    status: 'PROFITABLE_HEALTHY'
  }
];

export const RealtimeEbitdaUnitEconomicsView: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            💰 Real-Time Financial Burn Rate, EBITDA & Unit Economics Radar
          </h2>
          <Badge variant="success">● Cash-Flow Positive & Unit Profitable</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Executive financial oversight: gross margin realization, CAC to LTV efficiency, and EBITDA profitability trajectories
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>ANNUAL RECURRING REVENUE (ARR)</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>₹ 2.70 Crore</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>+ 28.4% MoM organic growth</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>GROSS PROFIT MARGIN</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>84.5% Margin</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Pure software & network take-rate</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>RUNWAY EXTENSION</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>Infinite Runway</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Self-sustaining cash flow positive</span>
        </div>
      </div>

      {/* Financial Table */}
      <Card title="📜 Unit Economics & Profitability Benchmarks" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Financial Metric</TableHead>
                <TableHead>Current Performance</TableHead>
                <TableHead>Industry Benchmark</TableHead>
                <TableHead>Operating Leverage & Margin Impact</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Audit State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {METRICS.map((m) => (
                <TableRow key={m.metricName}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{m.metricName}</strong>
                  </TableCell>
                  <TableCell style={{ fontWeight: 800, color: '#10B981', fontSize: '0.9375rem' }}>
                    {m.currentValue}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                    {m.industryBenchmark}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>
                    {m.marginImpact}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Badge variant="success">
                      ✓ {m.status.replace(/_/g, ' ')}
                    </Badge>
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
