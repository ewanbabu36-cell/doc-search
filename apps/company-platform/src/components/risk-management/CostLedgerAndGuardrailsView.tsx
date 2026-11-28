import React, { useState, useEffect } from 'react';
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
  type RiskPreventionPolicyDto,
  type CostLedgerEntryDto
} from '../../services/risk-management-service.js';

interface Props {
  policy: RiskPreventionPolicyDto;
  onRefresh: () => Promise<void>;
}

export const CostLedgerAndGuardrailsView: React.FC<Props> = ({ policy, onRefresh }) => {
  const [minMargin, setMinMargin] = useState(policy.minGrossMarginPercent);
  const [maxDiscount, setMaxDiscount] = useState(policy.maxDiscountPercentWithoutCfo);
  const [maxGraceDays, setMaxGraceDays] = useState(String(policy.maxGraceDaysBeforeThrottle));
  const [freeTierCap, setFreeTierCap] = useState(policy.freeTierMonthlyCogsCapInr);
  const [refundThreshold, setRefundThreshold] = useState(policy.partnerRefundSpikeThresholdPercent);
  const [autoThrottle, setAutoThrottle] = useState(policy.autoThrottleUnpaidOverdue);
  const [autoBlockMargin, setAutoBlockMargin] = useState(policy.autoBlockBelowMarginFloor);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [ledgerRows, setLedgerRows] = useState<CostLedgerEntryDto[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  const loadLedger = async () => {
    setLoadingLedger(true);
    try {
      const rows = await riskManagementService.listCosts();
      setLedgerRows(rows);
    } catch {
      setLedgerRows([]);
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      await riskManagementService.updatePolicy({
        minGrossMarginPercent: Number(minMargin),
        maxDiscountPercentWithoutCfo: Number(maxDiscount),
        maxGraceDaysBeforeThrottle: Number(maxGraceDays),
        freeTierMonthlyCogsCapInr: Number(freeTierCap),
        partnerRefundSpikeThresholdPercent: Number(refundThreshold),
        autoThrottleUnpaidOverdue: autoThrottle,
        autoBlockBelowMarginFloor: autoBlockMargin
      });
      setSaveMsg('Automated leakage prevention guardrails updated in PostgreSQL.');
      await onRefresh();
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Failed to update guardrails.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card title={`Automated Leakage Prevention Circuit Breakers (${policy.policyCode})`}>
        <form onSubmit={handleSavePolicy} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {saveMsg && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #10B981', backgroundColor: 'rgba(16,185,129,0.12)', fontWeight: 700, fontSize: '0.82rem' }}>
              {saveMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
              Min Gross Margin Floor (%)
              <input
                type="number"
                step="0.5"
                min="0"
                max="95"
                value={minMargin}
                onChange={(e) => setMinMargin(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--ds-color-border)', background: 'var(--ds-color-surface)', color: 'var(--ds-color-text-primary)' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
              Max Discount Without CFO (%)
              <input
                type="number"
                step="0.5"
                min="0"
                max="95"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--ds-color-border)', background: 'var(--ds-color-surface)', color: 'var(--ds-color-text-primary)' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
              Max Grace Days Before Throttle
              <input
                type="number"
                min="0"
                max="90"
                value={maxGraceDays}
                onChange={(e) => setMaxGraceDays(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--ds-color-border)', background: 'var(--ds-color-surface)', color: 'var(--ds-color-text-primary)' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
              Free-Tier Monthly COGS Cap (INR)
              <input
                type="number"
                step="100"
                min="0"
                value={freeTierCap}
                onChange={(e) => setFreeTierCap(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--ds-color-border)', background: 'var(--ds-color-surface)', color: 'var(--ds-color-text-primary)' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
              Refund Spike Alert Threshold (%)
              <input
                type="number"
                step="0.5"
                min="1"
                max="100"
                value={refundThreshold}
                onChange={(e) => setRefundThreshold(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--ds-color-border)', background: 'var(--ds-color-surface)', color: 'var(--ds-color-text-primary)' }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoBlockMargin}
                onChange={(e) => setAutoBlockMargin(e.target.checked)}
              />
              Auto-Block Subscription Discounts Breaching Margin Floor / CFO Cap
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoThrottle}
                onChange={(e) => setAutoThrottle(e.target.checked)}
              />
              Auto-Throttle Overdue Unpaid Accounts After Grace Window
            </label>
          </div>

          <div>
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              {saving ? 'Saving Guardrails...' : 'Save Automated Prevention Policy'}
            </Button>
          </div>
        </form>
      </Card>

      <Card title={`Company Cost Ledger Audit Trail (${ledgerRows.length} Entries)`} padding="none">
        {loadingLedger ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ds-color-text-muted)' }}>
            Loading cost ledger from PostgreSQL...
          </div>
        ) : ledgerRows.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ds-color-text-muted)' }}>
            Zero entries recorded yet in <code>company.company_cost_ledger</code>. Use Company P&amp;L tab to record infrastructure, AI, SMS, or payroll expenses.
          </div>
        ) : (
          <TableContainer style={{ border: 'none', borderRadius: 0 }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Source / Actor</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Amount (INR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.billingPeriod}</TableCell>
                    <TableCell>
                      <Badge variant="neutral">{row.category}</Badge>
                    </TableCell>
                    <TableCell>{row.description || '-'}</TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                      {row.source} ({row.createdBy})
                    </TableCell>
                    <TableCell style={{ textAlign: 'right', fontWeight: 800 }}>
                      ₹{Number(row.amountInr || 0).toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </div>
  );
};
