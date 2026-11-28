import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';
import { useGlobalLocale } from '../common/GlobalCurrencyLocaleContext.js';
import {
  riskManagementService,
  type RevenueWaterfallReportDto
} from '../../services/risk-management-service.js';

export interface RevenueStreamItem {
  id: string;
  streamName: string;
  category: string;
  transactionCount: number;
  monthlyGmvInr: number;
  takeRatePercent: number;
  netRevenueInr: number;
  accentColor: string;
}

const ACCENT_PALETTE = ['#06B6D4', '#10B981', '#F59E0B', '#A78BFA', '#38BDF8'];

export const RealtimeFourWayRevenueStreamsView: React.FC = () => {
  const { formatMoney } = useGlobalLocale();
  const [timeHorizon, setTimeHorizon] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUAL'>('MONTHLY');
  const [report, setReport] = useState<RevenueWaterfallReportDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    riskManagementService
      .getRevenueWaterfall()
      .then((res) => {
        if (active) setReport(res);
      })
      .catch((err) => {
        if (active) setErrorMsg(err instanceof Error ? err.message : 'Unable to load revenue streams.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const streams: RevenueStreamItem[] = (report?.streams || []).map((s, idx) => ({
    id: `STREAM-${idx}-${s.streamName}`,
    streamName: s.streamName,
    category: s.streamName.toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 18),
    transactionCount: s.transactionCount,
    monthlyGmvInr: s.grossGmvInr,
    takeRatePercent: s.grossGmvInr > 0 ? Number(((s.platformTakeRateInr / s.grossGmvInr) * 100).toFixed(2)) : 0,
    netRevenueInr: s.platformTakeRateInr,
    accentColor: ACCENT_PALETTE[idx % ACCENT_PALETTE.length]!
  }));

  const multiplier = timeHorizon === 'MONTHLY' ? 1 : timeHorizon === 'QUARTERLY' ? 3 : 12;
  const horizonLabel = timeHorizon === 'MONTHLY' ? 'Monthly' : timeHorizon === 'QUARTERLY' ? 'Quarterly (3M)' : 'Annualized ARR';

  const totalGmv = streams.reduce((acc, s) => acc + s.monthlyGmvInr * multiplier, 0);
  const totalNetRevenue = streams.reduce((acc, s) => acc + s.netRevenueInr * multiplier, 0);
  const blendedTakeRate = totalGmv > 0 ? ((totalNetRevenue / totalGmv) * 100).toFixed(1) : '0.0';
  const topStream = [...streams].sort((a, b) => b.monthlyGmvInr - a.monthlyGmvInr)[0];

  const handleExportCsv = () => {
    const headers = ['Revenue Stream', 'Invoices', 'Gross GMV (INR)', 'Take-Rate (%)', 'Net Platform Revenue (INR)'];
    const rows = streams.map((s) => [
      `"${s.streamName}"`,
      String(s.transactionCount),
      String(s.monthlyGmvInr * multiplier),
      `${s.takeRatePercent}%`,
      String(s.netRevenueInr * multiplier)
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DocSearch-Revenue-Matrix-${timeHorizon}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportNotice(`Exported Consolidated Revenue Matrix (${horizonLabel}) CSV.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              Consolidated Real-Time Revenue Matrix
            </h2>
            <Badge variant="success">Live PostgreSQL Ledger</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Live realization across OPD, LIMS Pathology, IPD, and Pharmacy billing streams ({report?.periodMonth || 'Current Month'})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#0F172A', padding: '4px', borderRadius: '8px', border: '1px solid #334155' }}>
            {(['MONTHLY', 'QUARTERLY', 'ANNUAL'] as const).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setTimeHorizon(h)}
                style={{
                  backgroundColor: timeHorizon === h ? '#06B6D4' : 'transparent',
                  color: timeHorizon === h ? '#070C16' : '#94A3B8',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {h === 'MONTHLY' ? 'Monthly' : h === 'QUARTERLY' ? 'Quarterly' : 'Annualized'}
              </button>
            ))}
          </div>

          <Button variant="secondary" size="sm" onClick={handleExportCsv} disabled={streams.length === 0}>
            Export CSV
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid #EF4444', borderRadius: '10px', padding: '12px 16px', color: '#FCA5A5', fontSize: '0.875rem', fontWeight: 700 }}>
          {errorMsg}
        </div>
      )}

      {exportNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {exportNotice}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>
            TOTAL GROSS NETWORK GMV ({horizonLabel.toUpperCase()})
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
            {loading ? '...' : formatMoney(totalGmv)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>
            {report?.totalTransactions ?? 0} non-cancelled invoice(s)
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #06B6D4', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#67E8F9', fontWeight: 800, textTransform: 'uppercase' }}>
            NET PLATFORM TAKE-RATE ({horizonLabel.toUpperCase()})
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#06B6D4', marginTop: '2px' }}>
            {loading ? '...' : formatMoney(totalNetRevenue)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>
            Blended platform take-rate: {blendedTakeRate}%
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
            LARGEST REVENUE STREAM
          </span>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FCD34D', marginTop: '4px' }}>
            {topStream ? topStream.streamName : 'No active stream yet'}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>
            {topStream ? `${topStream.transactionCount} invoice(s)` : 'Awaiting live clinical transactions'}
          </span>
        </div>
      </div>

      {streams.length === 0 ? (
        <Card title="Operational Revenue Stream Breakdown">
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ds-color-text-muted)' }}>
            {loading ? 'Querying PostgreSQL billing streams...' : 'Zero clinical billing invoices recorded in PostgreSQL yet.'}
          </div>
        </Card>
      ) : (
        <>
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '14px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
                Revenue Share Distribution by Clinical Stream
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>100% Consolidated Clinical GMV</span>
            </div>

            <div style={{ width: '100%', height: '16px', borderRadius: '8px', overflow: 'hidden', display: 'flex' }}>
              {streams.map((stream) => {
                const denom = totalGmv / multiplier;
                const sharePercent = denom > 0 ? ((stream.monthlyGmvInr / denom) * 100).toFixed(1) : '0.0';
                return (
                  <div
                    key={stream.id}
                    style={{
                      width: `${sharePercent}%`,
                      backgroundColor: stream.accentColor,
                      height: '100%'
                    }}
                    title={`${stream.streamName}: ${sharePercent}% Share`}
                  />
                );
              })}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '12px', fontSize: '0.75rem' }}>
              {streams.map((stream) => {
                const denom = totalGmv / multiplier;
                const sharePercent = denom > 0 ? ((stream.monthlyGmvInr / denom) * 100).toFixed(1) : '0.0';
                return (
                  <div key={stream.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: stream.accentColor }} />
                    <span style={{ color: '#E2E8F0', fontWeight: 700 }}>{stream.streamName}:</span>
                    <span style={{ color: stream.accentColor, fontWeight: 800 }}>{sharePercent}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <Card title="Operational Revenue Stream Breakdown" padding="none">
            <TableContainer style={{ border: 'none', borderRadius: '0' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Revenue Stream</TableHead>
                    <TableHead>Invoices</TableHead>
                    <TableHead>Gross GMV</TableHead>
                    <TableHead>Take-Rate %</TableHead>
                    <TableHead style={{ textAlign: 'right' }}>Net Platform Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {streams.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell style={{ fontWeight: 700 }}>{s.streamName}</TableCell>
                      <TableCell>{s.transactionCount}</TableCell>
                      <TableCell style={{ fontWeight: 800, color: '#10B981' }}>{formatMoney(s.monthlyGmvInr * multiplier)}</TableCell>
                      <TableCell style={{ fontWeight: 700, color: '#38BDF8' }}>{s.takeRatePercent}%</TableCell>
                      <TableCell style={{ textAlign: 'right', fontWeight: 900, color: '#06B6D4' }}>{formatMoney(s.netRevenueInr * multiplier)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}
    </div>
  );
};
