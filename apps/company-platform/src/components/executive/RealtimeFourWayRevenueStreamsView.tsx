import React, { useState } from 'react';
import { Card, Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';
import { useGlobalLocale } from '../common/GlobalCurrencyLocaleContext.js';

export interface RevenueStreamItem {
  id: string;
  streamName: string;
  category: 'OPD' | 'LIMS' | 'IPD' | 'PHARMACY';
  icon: string;
  monthlyVolume: string;
  monthlyGmvInr: number;
  takeRatePercent: number;
  netRevenueInr: number;
  momGrowth: string;
  accentColor: string;
  description: string;
}

export const REVENUE_STREAMS: RevenueStreamItem[] = [
  {
    id: 'STREAM-OPD',
    streamName: 'Doctor OPD Consultations',
    category: 'OPD',
    icon: '🩺',
    monthlyVolume: '42,800 Completed Consults (15,160/hr peak)',
    monthlyGmvInr: 34240000,
    takeRatePercent: 15.0,
    netRevenueInr: 5136000,
    momGrowth: '+ 22.4% MoM',
    accentColor: '#06B6D4',
    description: 'Digital token queue, specialist consult fees & video tele-consultations'
  },
  {
    id: 'STREAM-LIMS',
    streamName: 'Pathology Diagnostics (LIMS)',
    category: 'LIMS',
    icon: '🧪',
    monthlyVolume: '28,500 Lab Investigation Orders / Day',
    monthlyGmvInr: 39900000,
    takeRatePercent: 18.0,
    netRevenueInr: 7182000,
    momGrowth: '+ 31.8% MoM',
    accentColor: '#10B981',
    description: 'Automated CBC, LFT, KFT analyzers & downloadable vector PDF reports'
  },
  {
    id: 'STREAM-IPD',
    streamName: 'Inpatient (IPD) Bed Occupancy',
    category: 'IPD',
    icon: '🛏️',
    monthlyVolume: '3,120 Hospital Admissions (14,280 Bed-Days)',
    monthlyGmvInr: 62400000,
    takeRatePercent: 10.0,
    netRevenueInr: 6240000,
    momGrowth: '+ 18.6% MoM',
    accentColor: '#F59E0B',
    description: 'ICU, Deluxe & General ward daily bed allocation ledger auto-sync'
  },
  {
    id: 'STREAM-PHARMACY',
    streamName: 'Pharmacy E-Prescription Sales',
    category: 'PHARMACY',
    icon: '💊',
    monthlyVolume: '51,400 Prescriptions Dispensed (99.4% Stock)',
    monthlyGmvInr: 41120000,
    takeRatePercent: 12.0,
    netRevenueInr: 4934400,
    momGrowth: '+ 26.2% MoM',
    accentColor: '#A78BFA',
    description: 'Doctor digital prescription auto-sync, barcode batch stock decrement'
  }
];

export const RealtimeFourWayRevenueStreamsView: React.FC = () => {
  const { formatMoney } = useGlobalLocale();
  const [timeHorizon, setTimeHorizon] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUAL'>('MONTHLY');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const multiplier = timeHorizon === 'MONTHLY' ? 1 : timeHorizon === 'QUARTERLY' ? 3 : 12;
  const horizonLabel = timeHorizon === 'MONTHLY' ? 'Monthly' : timeHorizon === 'QUARTERLY' ? 'Quarterly (Q3)' : 'Annualized ARR';

  const totalGmv = REVENUE_STREAMS.reduce((acc, s) => acc + s.monthlyGmvInr * multiplier, 0);
  const totalNetRevenue = REVENUE_STREAMS.reduce((acc, s) => acc + s.netRevenueInr * multiplier, 0);
  const blendedTakeRate = ((totalNetRevenue / totalGmv) * 100).toFixed(1);

  // 1-Click Export Financial Matrix CSV
  const handleExportCsv = () => {
    const headers = ['Revenue Stream', 'Category', 'Volume Throughput', 'Gross GMV (INR)', 'Take-Rate (%)', 'Net Revenue (INR)', 'MoM Growth'];
    const rows = REVENUE_STREAMS.map((s) => [
      `"${s.streamName}"`,
      s.category,
      `"${s.monthlyVolume}"`,
      s.monthlyGmvInr * multiplier,
      `${s.takeRatePercent}%`,
      s.netRevenueInr * multiplier,
      `"${s.momGrowth}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DocSearch-4Way-Revenue-Matrix-${timeHorizon}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportNotice(`✓ Successfully exported 4-Way Consolidated Revenue Matrix (${horizonLabel}) to CSV!`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Time Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              💰 Consolidated 4-Way Real-Time Revenue Matrix
            </h2>
            <Badge variant="success">● Live Financial Ledger Sync</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Real-time cashflow realization across OPD Consultations, LIMS Pathology, IPD Bed Occupancy, and Pharmacy Dispensation
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Time Horizon Filter */}
          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#0F172A', padding: '4px', borderRadius: '8px', border: '1px solid #334155' }}>
            <button
              type="button"
              onClick={() => setTimeHorizon('MONTHLY')}
              style={{
                backgroundColor: timeHorizon === 'MONTHLY' ? '#06B6D4' : 'transparent',
                color: timeHorizon === 'MONTHLY' ? '#070C16' : '#94A3B8',
                fontWeight: 800,
                fontSize: '0.75rem',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              📅 Monthly
            </button>
            <button
              type="button"
              onClick={() => setTimeHorizon('QUARTERLY')}
              style={{
                backgroundColor: timeHorizon === 'QUARTERLY' ? '#06B6D4' : 'transparent',
                color: timeHorizon === 'QUARTERLY' ? '#070C16' : '#94A3B8',
                fontWeight: 800,
                fontSize: '0.75rem',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              📊 Quarterly (Q3)
            </button>
            <button
              type="button"
              onClick={() => setTimeHorizon('ANNUAL')}
              style={{
                backgroundColor: timeHorizon === 'ANNUAL' ? '#06B6D4' : 'transparent',
                color: timeHorizon === 'ANNUAL' ? '#070C16' : '#94A3B8',
                fontWeight: 800,
                fontSize: '0.75rem',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              📈 Annualized ARR
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCsv}
            style={{ fontWeight: 700 }}
          >
            📥 Export CSV
          </Button>
        </div>
      </div>

      {exportNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {exportNotice}
        </div>
      )}

      {/* Top Total Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>
            TOTAL GROSS NETWORK GMV ({horizonLabel.toUpperCase()})
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
            {formatMoney(totalGmv)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Across all connected healthcare partners</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #06B6D4', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#67E8F9', fontWeight: 800, textTransform: 'uppercase' }}>
            DOCSEARCH NET COMMISSION ({horizonLabel.toUpperCase()})
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#06B6D4', marginTop: '2px' }}>
            {formatMoney(totalNetRevenue)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Blended platform take-rate: {blendedTakeRate}%</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
            FASTEST GROWING STREAM
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>
            🧪 Pathology LIMS
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>+ 31.8% MoM surge in automated orders</span>
        </div>
      </div>

      {/* Multi-Segment Colored Share Distribution Bar */}
      <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '14px', padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
            📊 Revenue Share Distribution by Operational Domain
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>100% Consolidated Healthcare GMV</span>
        </div>

        {/* Segmented Bar */}
        <div style={{ width: '100%', height: '16px', borderRadius: '8px', overflow: 'hidden', display: 'flex' }}>
          {REVENUE_STREAMS.map((stream) => {
            const sharePercent = ((stream.monthlyGmvInr / (totalGmv / multiplier)) * 100).toFixed(1);
            return (
              <div
                key={stream.id}
                style={{
                  width: `${sharePercent}%`,
                  backgroundColor: stream.accentColor,
                  height: '100%',
                  transition: 'width 0.4s ease'
                }}
                title={`${stream.streamName}: ${sharePercent}% Share`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '12px', fontSize: '0.75rem' }}>
          {REVENUE_STREAMS.map((stream) => {
            const sharePercent = ((stream.monthlyGmvInr / (totalGmv / multiplier)) * 100).toFixed(1);
            return (
              <div key={stream.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: stream.accentColor }} />
                <span style={{ color: '#E2E8F0', fontWeight: 700 }}>{stream.icon} {stream.streamName}:</span>
                <span style={{ color: stream.accentColor, fontWeight: 800 }}>{sharePercent}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Revenue Table */}
      <Card title="📜 Operational Revenue Stream Breakdown" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Revenue Stream Domain</TableHead>
                <TableHead>Volume Throughput ({horizonLabel})</TableHead>
                <TableHead>Gross Merchandise Value (GMV)</TableHead>
                <TableHead>Take-Rate %</TableHead>
                <TableHead>Net Platform Revenue</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Growth Trajectory</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {REVENUE_STREAMS.map((s) => {
                const gmv = s.monthlyGmvInr * multiplier;
                const net = s.netRevenueInr * multiplier;

                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.25rem' }}>{s.icon}</span>
                        <div>
                          <strong style={{ color: 'var(--ds-color-text-primary)' }}>{s.streamName}</strong>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)', display: 'block' }}>
                            {s.description}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell style={{ fontWeight: 700, color: 'var(--ds-color-text-primary)' }}>
                      {s.monthlyVolume}
                    </TableCell>
                    <TableCell style={{ fontWeight: 800, color: '#10B981', fontSize: '0.9375rem' }}>
                      {formatMoney(gmv)}
                    </TableCell>
                    <TableCell style={{ fontWeight: 700, color: '#38BDF8' }}>
                      {s.takeRatePercent}% Net
                    </TableCell>
                    <TableCell style={{ fontWeight: 900, color: '#06B6D4', fontSize: '0.9375rem' }}>
                      {formatMoney(net)}
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <Badge variant="success">
                        {s.momGrowth}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
