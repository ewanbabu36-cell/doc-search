import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';
import { useGlobalLocale } from '../common/GlobalCurrencyLocaleContext.js';
import {
  riskManagementService,
  type CompanyRiskOverviewDto
} from '../../services/risk-management-service.js';
import { DepartmentOpexMatrixView } from './DepartmentOpexMatrixView.js';
import { generateAndDownloadInvestorDeckPdf } from '../../utils/clientInvestorDeckPdf.js';

export const RealtimeEbitdaUnitEconomicsView: React.FC = () => {
  const { formatMoney } = useGlobalLocale();
  const [overview, setOverview] = useState<CompanyRiskOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await riskManagementService.getOverview();
        if (active) setOverview(data);
      } catch (err) {
        if (active) setErrorMsg(err instanceof Error ? err.message : 'Unable to load unit economics.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleExportInvestorDeck = () => {
    if (!overview) return;
    const { pnl } = overview;
    generateAndDownloadInvestorDeckPdf({
      generatedDate: new Date().toLocaleDateString('en-US', { dateStyle: 'full' }),
      arrAmount: formatMoney(pnl.contractedArrInr),
      gmvRunRate: formatMoney(pnl.partnerClinicalGmvInr * 12),
      grossMargin: `${pnl.grossMarginPercent}% Gross Margin`,
      ebitdaMargin: `${pnl.ebitdaMarginPercent}% EBITDA Margin`,
      freeCashflow: `${pnl.netProfitLossInr >= 0 ? '+' : '-'} ${formatMoney(Math.abs(pnl.netProfitLossInr))} / mo`,
      monthlyNetRevenue: formatMoney(pnl.totalRecognizedRevenueInr),
      monthlyOpex: formatMoney(pnl.totalOpexInr)
    });
    setExportNotice('Financial telemetry summary PDF exported.');
    setTimeout(() => setExportNotice(null), 4000);
  };

  if (loading) {
    return (
      <Card title="Live CFO EBITDA & Unit Economics">
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ds-color-text-muted)' }}>
          Loading live unit economics from PostgreSQL...
        </div>
      </Card>
    );
  }

  if (errorMsg || !overview) {
    return (
      <Card title="Live CFO EBITDA & Unit Economics">
        <div style={{ padding: '24px', color: '#EF4444', fontWeight: 700 }}>
          {errorMsg || 'No live economics data returned.'}
        </div>
      </Card>
    );
  }

  const { pnl, partnerSummary } = overview;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              Live CFO Economics, P&amp;L &amp; Burn Telemetry
            </h2>
            <Badge variant={pnl.netProfitLossInr >= 0 ? 'success' : 'danger'}>
              {pnl.netProfitLossInr >= 0 ? 'Net Profitable' : `Burn ₹${pnl.monthlyBurnRateInr.toLocaleString('en-IN')}/mo`}
            </Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Authoritative PostgreSQL calculations across subscriptions, collected payments, receivables, clinical GMV &amp; recorded costs.
          </p>
        </div>

        <Button variant="success" size="sm" onClick={handleExportInvestorDeck}>
          Export Financial Summary PDF
        </Button>
      </div>

      {exportNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', fontSize: '0.875rem', fontWeight: 700 }}>
          {exportNotice}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>CONTRACTED ARR</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
            {formatMoney(pnl.contractedArrInr)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>
            MRR: {formatMoney(pnl.contractedMrrInr)} ({partnerSummary.totalPartners} total partners)
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>GROSS MARGIN</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>{pnl.grossMarginPercent}%</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>
            EBITDA Margin: {pnl.ebitdaMarginPercent}%
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>NET PROFIT / (BURN)</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: pnl.netProfitLossInr >= 0 ? '#10B981' : '#EF4444', marginTop: '2px' }}>
            {pnl.netProfitLossInr >= 0 ? '+' : '-'} {formatMoney(Math.abs(pnl.netProfitLossInr))}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>
            Direct Leakage Exposure: {formatMoney(pnl.totalDirectLeakageExposureInr)}
          </span>
        </div>
      </div>

      <DepartmentOpexMatrixView overview={overview} />

      <Card title="PostgreSQL Financial Metrics Summary" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: 0 }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Live Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Collected SaaS Cash</TableCell>
                <TableCell style={{ fontWeight: 700 }}>{formatMoney(pnl.collectedCashInr)}</TableCell>
                <TableCell><Badge variant="neutral">LIVE DB</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Overdue B2B Receivables</TableCell>
                <TableCell style={{ fontWeight: 700, color: pnl.overdueReceivablesInr > 0 ? '#EF4444' : '#10B981' }}>{formatMoney(pnl.overdueReceivablesInr)}</TableCell>
                <TableCell><Badge variant={pnl.overdueReceivablesInr > 0 ? 'danger' : 'success'}>{pnl.overdueReceivablesInr > 0 ? 'ACTION REQUIRED' : 'CLEAR'}</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Partner Clinical GMV &amp; Take-Rate (2.5%)</TableCell>
                <TableCell style={{ fontWeight: 700 }}>{formatMoney(pnl.partnerClinicalGmvInr)} ({formatMoney(pnl.platformTakeRateInr)} take-rate)</TableCell>
                <TableCell><Badge variant="neutral">REALTIME SQL</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
