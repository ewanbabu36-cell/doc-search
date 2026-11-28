import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';
import {
  riskManagementService,
  type RevenueWaterfallReportDto,
  type TdsGstr1RecordDto
} from '../../services/risk-management-service.js';

export const GrossToNetRevenueWaterfallView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'waterfall' | 'tds_ledger'>('waterfall');
  const [report, setReport] = useState<RevenueWaterfallReportDto | null>(null);
  const [tdsLedger, setTdsLedger] = useState<TdsGstr1RecordDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      riskManagementService.getRevenueWaterfall(),
      riskManagementService.getTdsGstr1Ledger()
    ])
      .then(([wf, ledger]) => {
        if (!active) return;
        setReport(wf);
        setTdsLedger(ledger);
      })
      .catch((err) => {
        if (active) setErrorMsg(err instanceof Error ? err.message : 'Unable to load revenue waterfall.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <Card title="Gross-to-Net Revenue Waterfall & Section 194-O Ledger">
        <div style={{ padding: '24px', color: 'var(--ds-color-text-muted)' }}>
          Aggregating clinical billing &amp; Section 194-O ledgers from PostgreSQL...
        </div>
      </Card>
    );
  }

  if (errorMsg || !report) {
    return (
      <Card title="Gross-to-Net Revenue Waterfall">
        <div style={{ padding: '24px', color: '#EF4444', fontWeight: 700 }}>
          {errorMsg || 'Revenue waterfall unavailable.'}
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
            Gross-to-Net Revenue Take-Rate Waterfall &amp; Section 194-O Ledger ({report.periodMonth})
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--ds-color-text-muted)', marginTop: '4px' }}>
            Live Clinical Invoice Streams • {report.complianceStatus}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant={activeTab === 'waterfall' ? 'primary' : 'secondary'} size="sm" onClick={() => setActiveTab('waterfall')}>
            GMV Waterfall
          </Button>
          <Button variant={activeTab === 'tds_ledger' ? 'primary' : 'secondary'} size="sm" onClick={() => setActiveTab('tds_ledger')}>
            Section 194-O &amp; GSTR-1 ({tdsLedger.length})
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <Card variant="elevated" style={{ padding: '16px', borderLeft: '4px solid #38BDF8' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)', fontWeight: 700 }}>GROSS NETWORK GMV</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#38BDF8', marginTop: '4px' }}>
            ₹{report.totalGrossGmvInr.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>
            {report.totalTransactions} invoices aggregated
          </div>
        </Card>
        <Card variant="elevated" style={{ padding: '16px', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)', fontWeight: 700 }}>PLATFORM TAKE-RATE &amp; FACTORING</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
            ₹{report.platformNetRevenueInr.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>
            GST Liability (18%): ₹{report.deductions.gstLiabilityOnTakeRateInr.toLocaleString('en-IN')}
          </div>
        </Card>
        <Card variant="elevated" style={{ padding: '16px', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)', fontWeight: 700 }}>TDS WITHHELD (§194-O)</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>
            ₹{report.deductions.tdsSection194OInr.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>
            Net Partner Settlement: ₹{report.netPartnerDisbursementInr.toLocaleString('en-IN')}
          </div>
        </Card>
      </div>

      {activeTab === 'waterfall' ? (
        report.streams.length === 0 ? (
          <Card title="Revenue Streams">
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ds-color-text-muted)' }}>
              Zero non-cancelled clinical invoices in PostgreSQL for GMV waterfall aggregation.
            </div>
          </Card>
        ) : (
          <Card title="Real-Time GMV Stream Breakdown" padding="none">
            <TableContainer style={{ border: 'none', borderRadius: 0 }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clinical Stream</TableHead>
                    <TableHead>Invoices</TableHead>
                    <TableHead>Gross GMV</TableHead>
                    <TableHead>Gateway Fee</TableHead>
                    <TableHead>Platform Take-Rate</TableHead>
                    <TableHead>Sec 194-O TDS</TableHead>
                    <TableHead style={{ textAlign: 'right' }}>Net Partner Settlement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.streams.map((s) => (
                    <TableRow key={s.streamName}>
                      <TableCell style={{ fontWeight: 700 }}>{s.streamName}</TableCell>
                      <TableCell>{s.transactionCount}</TableCell>
                      <TableCell>₹{s.grossGmvInr.toLocaleString('en-IN')}</TableCell>
                      <TableCell>₹{s.gatewayFeeInr.toLocaleString('en-IN')}</TableCell>
                      <TableCell style={{ color: '#10B981', fontWeight: 700 }}>₹{s.platformTakeRateInr.toLocaleString('en-IN')}</TableCell>
                      <TableCell>₹{s.tdsSection194OInr.toLocaleString('en-IN')}</TableCell>
                      <TableCell style={{ textAlign: 'right', fontWeight: 800 }}>₹{s.netSettlementInr.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )
      ) : tdsLedger.length === 0 ? (
        <Card title="Section 194-O Partner Ledger">
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ds-color-text-muted)' }}>
            No partner GMV disbursements recorded yet in PostgreSQL.
          </div>
        </Card>
      ) : (
        <Card title="Partner Section 194-O TDS & GSTR-1 Ledger" padding="none">
          <TableContainer style={{ border: 'none', borderRadius: 0 }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>PAN / GSTIN</TableHead>
                  <TableHead>Gross GMV</TableHead>
                  <TableHead>TDS Deducted</TableHead>
                  <TableHead>Challan Ref</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Filing Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tdsLedger.map((r) => (
                  <TableRow key={r.partnerId}>
                    <TableCell style={{ fontWeight: 700 }}>{r.partnerLegalName}</TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>{r.pan} / {r.gstin}</TableCell>
                    <TableCell>₹{r.grossTransactionValueInr.toLocaleString('en-IN')}</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>₹{r.tdsDeductedInr.toLocaleString('en-IN')}</TableCell>
                    <TableCell>{r.challanNumber}</TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <Badge variant="neutral">{r.gstr1FilingStatus}</Badge>
                    </TableCell>
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
