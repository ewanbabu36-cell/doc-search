import React, { useState, useEffect } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';
import { useGlobalLocale } from '../common/GlobalCurrencyLocaleContext.js';
import {
  riskManagementService,
  type CompanyRiskOverviewDto
} from '../../services/risk-management-service.js';

interface Props {
  overview?: CompanyRiskOverviewDto;
}

export const DepartmentOpexMatrixView: React.FC<Props> = ({ overview: initialOverview }) => {
  const { formatMoney } = useGlobalLocale();
  const [overview, setOverview] = useState<CompanyRiskOverviewDto | null>(initialOverview || null);
  const [loading, setLoading] = useState(!initialOverview);

  useEffect(() => {
    if (initialOverview) {
      setOverview(initialOverview);
      setLoading(false);
      return;
    }
    let active = true;
    riskManagementService
      .getOverview()
      .then((d) => {
        if (active) setOverview(d);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [initialOverview]);

  if (loading) {
    return (
      <Card title="Operational Expenditure & COGS Ledger Matrix">
        <div style={{ padding: '20px', color: 'var(--ds-color-text-muted)' }}>Loading live cost ledger...</div>
      </Card>
    );
  }

  const pnl = overview?.pnl;
  const rows = overview?.costBreakdown || [];
  const totalCost = pnl?.totalCostInr || 0;

  return (
    <Card title="PostgreSQL Cost Ledger Breakdown (Live COGS & OPEX)" padding="none">
      <TableContainer style={{ border: 'none', borderRadius: 0 }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ledger Category</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead>Entries Recorded</TableHead>
              <TableHead>Share of Spend</TableHead>
              <TableHead style={{ textAlign: 'right' }}>Total Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const pct = totalCost > 0 ? ((r.amountInr / totalCost) * 100).toFixed(1) : '0.0';
              return (
                <TableRow key={r.category}>
                  <TableCell style={{ fontWeight: 700 }}>{r.category}</TableCell>
                  <TableCell>
                    <Badge variant={r.isCogs ? 'warning' : 'neutral'}>{r.isCogs ? 'COGS' : 'OPEX'}</Badge>
                  </TableCell>
                  <TableCell>{r.entryCount}</TableCell>
                  <TableCell>{pct}%</TableCell>
                  <TableCell style={{ textAlign: 'right', fontWeight: 800 }}>
                    {formatMoney(r.amountInr)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};
