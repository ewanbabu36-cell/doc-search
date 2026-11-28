import React, { useState } from 'react';
import {
  Card,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';
import type { PartnerUnitEconomicsDto } from '../../services/risk-management-service.js';

interface Props {
  partners: PartnerUnitEconomicsDto[];
}

export const UnitMarginLeaderboardView: React.FC<Props> = ({ partners }) => {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'LOSS_MAKING' | 'FREE_BURN' | 'THIN_MARGIN' | 'PROFITABLE'>('ALL');

  const filtered = partners.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.partnerName.toLowerCase().includes(q) ||
      p.planCode.toLowerCase().includes(q) ||
      p.partnerType.toLowerCase().includes(q);
    const matchesRisk = riskFilter === 'ALL' || p.riskStatus === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <input
          type="text"
          placeholder="Search tenant by partner name, type or plan code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: '280px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--ds-color-border)', background: 'var(--ds-color-surface)', color: 'var(--ds-color-text-primary)' }}
        />
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value as any)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--ds-color-border)', background: 'var(--ds-color-surface)', color: 'var(--ds-color-text-primary)' }}
        >
          <option value="ALL">All Margin Tiers ({partners.length})</option>
          <option value="LOSS_MAKING">Loss-Making ({partners.filter((p) => p.riskStatus === 'LOSS_MAKING').length})</option>
          <option value="FREE_BURN">Free-Tier COGS Burn ({partners.filter((p) => p.riskStatus === 'FREE_BURN').length})</option>
          <option value="THIN_MARGIN">Thin Margin ({partners.filter((p) => p.riskStatus === 'THIN_MARGIN').length})</option>
          <option value="PROFITABLE">Profitable ({partners.filter((p) => p.riskStatus === 'PROFITABLE').length})</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card title="Per-Tenant Unit Economics">
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ds-color-text-muted)' }}>
            No partners found in PostgreSQL matching current filter.
          </div>
        </Card>
      ) : (
        <Card title={`Per-Tenant Unit Margin Leaderboard (${filtered.length} Tenants — Lowest Margin First)`} padding="none">
          <TableContainer style={{ border: 'none', borderRadius: 0 }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner / Facility</TableHead>
                  <TableHead>Plan & License</TableHead>
                  <TableHead>MRR</TableHead>
                  <TableHead>Attributed Cost</TableHead>
                  <TableHead>Net Margin</TableHead>
                  <TableHead>Overdue</TableHead>
                  <TableHead>Clinical Leakage</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Health Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.partnerId}>
                    <TableCell>
                      <div style={{ fontWeight: 700 }}>{p.partnerName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)' }}>
                        {p.partnerType} • Open Alerts: {p.openAlertCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>{p.planCode}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)' }}>
                        {p.licenseStatus} {p.isFreeTier ? '(Free Tier)' : ''}
                      </div>
                    </TableCell>
                    <TableCell style={{ fontWeight: 700 }}>
                      ₹{p.contractedMrrInr.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <div>₹{p.attributedCostInr.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--ds-color-text-muted)' }}>
                        COGS ₹{p.cogsInr.toLocaleString('en-IN')}
                      </div>
                    </TableCell>
                    <TableCell style={{ fontWeight: 900, color: p.netMarginInr >= 0 ? '#10B981' : '#EF4444' }}>
                      {p.netMarginInr >= 0 ? '+' : '-'}₹{Math.abs(p.netMarginInr).toLocaleString('en-IN')}
                      {p.grossMarginPercent !== null && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--ds-color-text-muted)', fontWeight: 600 }}>
                          {p.grossMarginPercent}% GM
                        </div>
                      )}
                    </TableCell>
                    <TableCell style={{ color: p.overdueReceivableInr > 0 ? '#EF4444' : 'var(--ds-color-text-muted)', fontWeight: p.overdueReceivableInr > 0 ? 800 : 400 }}>
                      ₹{p.overdueReceivableInr.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>
                      <div>Unbilled Encounters: <strong>{p.unbilledCompletedEncounters}</strong></div>
                      <div>Refund Rate: <strong>{p.refundRatePercent}%</strong> | Expired Loss: ₹{p.expiredBatchLossInr.toLocaleString('en-IN')}</div>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <Badge
                        variant={
                          p.riskStatus === 'PROFITABLE'
                            ? 'success'
                            : p.riskStatus === 'LOSS_MAKING' || p.riskStatus === 'FREE_BURN'
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {p.riskStatus}
                      </Badge>
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
