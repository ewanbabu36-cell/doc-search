import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';
import {
  riskManagementService,
  type CostLedgerEntryDto,
  type CompanyRiskOverviewDto
} from '../../services/risk-management-service.js';

export const CloudFinopsCostOptimizerView: React.FC = () => {
  const [overview, setOverview] = useState<CompanyRiskOverviewDto | null>(null);
  const [infraEntries, setInfraEntries] = useState<CostLedgerEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadCosts = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [ov, cloud, ai] = await Promise.all([
        riskManagementService.getOverview(),
        riskManagementService.listCosts({ category: 'CLOUD_INFRA' }),
        riskManagementService.listCosts({ category: 'AI_INFERENCE' })
      ]);
      setOverview(ov);
      setInfraEntries([...cloud, ...ai]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load infrastructure & AI costs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCosts();
  }, []);

  if (loading) {
    return (
      <Card title="Infrastructure & AI COGS Optimizer">
        <div style={{ padding: '20px', color: 'var(--ds-color-text-muted)' }}>
          Querying PostgreSQL cost ledger...
        </div>
      </Card>
    );
  }

  const cloudTotal = overview?.costBreakdown.find((c) => c.category === 'CLOUD_INFRA')?.amountInr || 0;
  const aiTotal = overview?.costBreakdown.find((c) => c.category === 'AI_INFERENCE')?.amountInr || 0;
  const freeTierCap = Number(overview?.activePolicy.freeTierMonthlyCogsCapInr || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
            Infrastructure &amp; AI Inference Cost Ledger (FinOps)
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Live PostgreSQL COGS spend across compute/storage, PostgreSQL 18.4 replicas &amp; AI inference metering (zero hardcoded cloud spend estimates).
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={loadCosts}>
          Refresh Ledger
        </Button>
      </div>

      {errorMsg && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #EF4444', color: '#EF4444', fontWeight: 700 }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800 }}>RECORDED CLOUD INFRA</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F8FAFC', marginTop: '4px' }}>
            ₹{cloudTotal.toLocaleString('en-IN')}
          </div>
        </div>
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800 }}>RECORDED AI INFERENCE</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '4px' }}>
            ₹{aiTotal.toLocaleString('en-IN')}
          </div>
        </div>
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800 }}>FREE-TIER COGS GUARDRAIL CAP</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
            ₹{freeTierCap.toLocaleString('en-IN')} / mo
          </div>
        </div>
      </div>

      {infraEntries.length === 0 ? (
        <Card title="Cloud & AI Cost Entries">
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ds-color-text-muted)' }}>
            No <code>CLOUD_INFRA</code> or <code>AI_INFERENCE</code> entries recorded yet in <code>company.company_cost_ledger</code>.
          </div>
        </Card>
      ) : (
        <Card title={`Recorded Infrastructure & AI Spend (${infraEntries.length})`} padding="none">
          <TableContainer style={{ border: 'none', borderRadius: 0 }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Amount (INR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {infraEntries.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell><Badge variant="warning">{row.category}</Badge></TableCell>
                    <TableCell>{row.billingPeriod}</TableCell>
                    <TableCell>{row.description || '-'}</TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{row.source}</TableCell>
                    <TableCell style={{ textAlign: 'right', fontWeight: 800 }}>₹{Number(row.amountInr).toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </div>
  );
};
