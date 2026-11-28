import React, { useState } from 'react';
import {
  Card,
  Badge,
  Button,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';
import {
  riskManagementService,
  type CompanyRiskOverviewDto,
  type CostCategory
} from '../../services/risk-management-service.js';

interface Props {
  overview: CompanyRiskOverviewDto;
  onRefresh: () => Promise<void>;
}

const CATEGORY_LABELS: Record<CostCategory, string> = {
  CLOUD_INFRA: 'Cloud Infrastructure & Hosting',
  AI_INFERENCE: 'AI Model Inference & Transcription',
  SMS_WHATSAPP: 'DLT SMS & WhatsApp API Credits',
  GATEWAY_MDR: 'Payment Gateway MDR & Bank Fees',
  PAYROLL_SUPPORT: 'Engineering, Support & Field Payroll',
  MARKETING_CAC: 'Partner Acquisition & Marketing CAC',
  REFUND_WRITEOFF: 'Refund Adjustments & Bad-Debt Write-Offs'
};

export const CompanyPnLEconomicsView: React.FC<Props> = ({ overview, onRefresh }) => {
  const { pnl, costBreakdown, partnerSummary, unitMarginLeaderboard, billingPeriod } = overview;

  const [category, setCategory] = useState<CostCategory>('CLOUD_INFRA');
  const [partnerId, setPartnerId] = useState<string>('');
  const [amountInr, setAmountInr] = useState<string>('');
  const [periodInput, setPeriodInput] = useState<string>(billingPeriod);
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleRecordCost = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amountInr);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFeedback({ ok: false, msg: 'Enter a valid positive INR cost amount.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const selectedPartner = unitMarginLeaderboard.find((p) => p.partnerId === partnerId);
      await riskManagementService.recordCost({
        category,
        partnerId: partnerId || null,
        tenantId: selectedPartner?.tenantId || null,
        amountInr: numericAmount,
        billingPeriod: periodInput,
        description: description.trim() || `${CATEGORY_LABELS[category]} (${periodInput})`,
        source: 'COMPANY_RISK_HQ_UI'
      });
      setAmountInr('');
      setDescription('');
      setFeedback({ ok: true, msg: `Recorded ₹${numericAmount.toLocaleString('en-IN')} to PostgreSQL cost ledger.` });
      await onRefresh();
    } catch (err) {
      setFeedback({
        ok: false,
        msg: err instanceof Error ? err.message : 'Failed to persist cost entry.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const profitLossColor = pnl.netProfitLossInr >= 0 ? '#10B981' : '#EF4444';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* P&L Waterfall Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <Card variant="elevated" style={{ padding: '16px', borderLeft: '4px solid #38BDF8' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
            Contracted ARR / MRR
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#38BDF8', marginTop: '4px' }}>
            ₹{pnl.contractedArrInr.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginTop: '4px' }}>
            MRR: ₹{pnl.contractedMrrInr.toLocaleString('en-IN')} ({partnerSummary.paidPartners} paid / {partnerSummary.freeTierPartners} free)
          </div>
        </Card>

        <Card variant="elevated" style={{ padding: '16px', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
            Collected Cash vs Receivables
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
            ₹{pnl.collectedCashInr.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: pnl.overdueReceivablesInr > 0 ? '#EF4444' : 'var(--ds-color-text-muted)', marginTop: '4px' }}>
            Pending: ₹{pnl.pendingReceivablesInr.toLocaleString('en-IN')} | Overdue: ₹{pnl.overdueReceivablesInr.toLocaleString('en-IN')}
          </div>
        </Card>

        <Card variant="elevated" style={{ padding: '16px', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
            Total COGS + OPEX Burn
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>
            ₹{pnl.totalCostInr.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginTop: '4px' }}>
            COGS: ₹{pnl.totalCogsInr.toLocaleString('en-IN')} | OPEX: ₹{pnl.totalOpexInr.toLocaleString('en-IN')}
          </div>
        </Card>

        <Card variant="elevated" style={{ padding: '16px', borderLeft: `4px solid ${profitLossColor}` }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
            Net Profit / (Loss)
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: profitLossColor, marginTop: '4px' }}>
            {pnl.netProfitLossInr >= 0 ? '+' : '-'}₹{Math.abs(pnl.netProfitLossInr).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginTop: '4px' }}>
            Gross Margin: {pnl.grossMarginPercent}% | EBITDA: {pnl.ebitdaMarginPercent}%
          </div>
        </Card>
      </div>

      {/* Clinical GMV Take-Rate & Direct Leakage Exposure Row */}
      <Card title="Clinical Ecosystem Take-Rate & Direct Leakage Exposure (Live SQL Aggregation)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', padding: '4px 0' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>Partner Clinical GMV</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>₹{pnl.partnerClinicalGmvInr.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>Platform Take-Rate (2.5%)</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#38BDF8' }}>₹{pnl.platformTakeRateInr.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>Sec 194-O TDS (0.1%)</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>₹{pnl.tdsSection194OInr.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>Discount & Waiver Loss</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#F59E0B' }}>₹{pnl.discountWaiverLossInr.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>Clinical Refunds Issued</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#EF4444' }}>₹{pnl.partnerClinicalRefundsInr.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>Total Leakage Exposure</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#EF4444' }}>₹{pnl.totalDirectLeakageExposureInr.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </Card>

      {/* Two-Column Cost Breakdown + Record Expense Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        <Card title="PostgreSQL Cost Ledger Breakdown (COGS vs OPEX)" padding="none">
          <TableContainer style={{ border: 'none', borderRadius: 0 }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Entries</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Total INR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costBreakdown.map((row) => (
                  <TableRow key={row.category}>
                    <TableCell>
                      <div style={{ fontWeight: 700 }}>{CATEGORY_LABELS[row.category] || row.category}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--ds-color-text-muted)' }}>{row.category}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.isCogs ? 'warning' : 'neutral'}>{row.isCogs ? 'COGS' : 'OPEX'}</Badge>
                    </TableCell>
                    <TableCell>{row.entryCount}</TableCell>
                    <TableCell style={{ textAlign: 'right', fontWeight: 800 }}>
                      ₹{row.amountInr.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Card title="Record Real Company Expense / Tenant COGS">
          <form onSubmit={handleRecordCost} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {feedback && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  backgroundColor: feedback.ok ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)',
                  border: `1px solid ${feedback.ok ? '#10B981' : '#EF4444'}`,
                  color: feedback.ok ? '#10B981' : '#EF4444'
                }}
              >
                {feedback.msg}
              </div>
            )}

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
              Cost Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CostCategory)}
                style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--ds-color-border)', background: 'var(--ds-color-surface)', color: 'var(--ds-color-text-primary)' }}
              >
                {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label} ({k})
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
              Attributed Partner (leave blank for Shared Platform OPEX)
              <select
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--ds-color-border)', background: 'var(--ds-color-surface)', color: 'var(--ds-color-text-primary)' }}
              >
                <option value="">Shared Platform Overhead (Unattributed)</option>
                {unitMarginLeaderboard.map((p) => (
                  <option key={p.partnerId} value={p.partnerId}>
                    {p.partnerName} ({p.planCode})
                  </option>
                ))}
              </select>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                Amount (INR)
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  placeholder="e.g. 4500"
                  value={amountInr}
                  onChange={(e) => setAmountInr(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--ds-color-border)', background: 'var(--ds-color-surface)', color: 'var(--ds-color-text-primary)' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                Billing Period (YYYY-MM)
                <input
                  type="text"
                  pattern="\d{4}-\d{2}"
                  required
                  value={periodInput}
                  onChange={(e) => setPeriodInput(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--ds-color-border)', background: 'var(--ds-color-surface)', color: 'var(--ds-color-text-primary)' }}
                />
              </label>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
              Description / Cloud Invoice Reference
              <input
                type="text"
                placeholder="e.g. Vertex AI inference + WhatsApp DLT credits"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--ds-color-border)', background: 'var(--ds-color-surface)', color: 'var(--ds-color-text-primary)' }}
              />
            </label>

            <Button type="submit" variant="primary" size="sm" disabled={submitting}>
              {submitting ? 'Persisting to PostgreSQL...' : 'Record to Company Cost Ledger'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
