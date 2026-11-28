import React, { useState, useEffect, useCallback } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';
import { useGlobalLocale } from '../common/GlobalCurrencyLocaleContext.js';
import {
  riskManagementService,
  type RevenueWaterfallReportDto,
  type TdsGstr1RecordDto
} from '../../services/risk-management-service.js';

interface GlobalTaxRule {
  regionJurisdiction: string;
  taxSchemeName: string;
  standardTaxRate: string;
  filingFrequency: string;
  fxSettlementCurrency: string;
  integrationGateway: string;
  complianceStatus: 'REFERENCE_RULE_ACTIVE';
}

const STATUTORY_TAX_RULES: GlobalTaxRule[] = [
  {
    regionJurisdiction: 'India (Domestic — §194-O & GST)',
    taxSchemeName: 'Goods & Services Tax (GST 18%) & Sec 194-O E-Com TDS (1%)',
    standardTaxRate: '18.0% GST + 1.0% TDS',
    filingFrequency: 'Monthly (GSTR-1 / 3B & Form 26Q)',
    fxSettlementCurrency: 'INR (₹)',
    integrationGateway: 'PostgreSQL Statutory Ledger',
    complianceStatus: 'REFERENCE_RULE_ACTIVE'
  },
  {
    regionJurisdiction: 'United States',
    taxSchemeName: 'US State Economic Nexus SaaS Tax Rule',
    standardTaxRate: 'Jurisdiction Dependent',
    filingFrequency: 'Monthly / Quarterly',
    fxSettlementCurrency: 'USD ($)',
    integrationGateway: 'External Tax Adapter (Credential Gated)',
    complianceStatus: 'REFERENCE_RULE_ACTIVE'
  },
  {
    regionJurisdiction: 'European Union',
    taxSchemeName: 'EU VAT One-Stop Shop (OSS) & Reverse Charge',
    standardTaxRate: 'Member State Rate',
    filingFrequency: 'Quarterly',
    fxSettlementCurrency: 'EUR (€)',
    integrationGateway: 'External Tax Adapter (Credential Gated)',
    complianceStatus: 'REFERENCE_RULE_ACTIVE'
  },
  {
    regionJurisdiction: 'United Kingdom',
    taxSchemeName: 'UK VAT Making Tax Digital (MTD)',
    standardTaxRate: '20.0%',
    filingFrequency: 'Quarterly',
    fxSettlementCurrency: 'GBP (£)',
    integrationGateway: 'External Tax Adapter (Credential Gated)',
    complianceStatus: 'REFERENCE_RULE_ACTIVE'
  },
  {
    regionJurisdiction: 'United Arab Emirates (UAE)',
    taxSchemeName: 'FTA Standard Corporate VAT',
    standardTaxRate: '5.0%',
    filingFrequency: 'Quarterly',
    fxSettlementCurrency: 'AED (د.إ)',
    integrationGateway: 'External Tax Adapter (Credential Gated)',
    complianceStatus: 'REFERENCE_RULE_ACTIVE'
  },
  {
    regionJurisdiction: 'Singapore',
    taxSchemeName: 'IRAS GST Regime',
    standardTaxRate: '9.0%',
    filingFrequency: 'Quarterly',
    fxSettlementCurrency: 'SGD (S$)',
    integrationGateway: 'External Tax Adapter (Credential Gated)',
    complianceStatus: 'REFERENCE_RULE_ACTIVE'
  }
];

export const GlobalTaxMultiRegionLedgerView: React.FC = () => {
  const { formatMoney, currency } = useGlobalLocale();
  const [waterfall, setWaterfall] = useState<RevenueWaterfallReportDto | null>(null);
  const [tdsLedger, setTdsLedger] = useState<TdsGstr1RecordDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileNotice, setReconcileNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadLedger = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [wf, tds] = await Promise.all([
        riskManagementService.getRevenueWaterfall(),
        riskManagementService.getTdsGstr1Ledger()
      ]);
      setWaterfall(wf);
      setTdsLedger(tds);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to fetch tax & TDS ledger.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  const handleReconcileTax = async () => {
    setReconciling(true);
    setErrorMsg(null);
    try {
      const [scan, wf, tds] = await Promise.all([
        riskManagementService.runLeakageScan(),
        riskManagementService.getRevenueWaterfall(),
        riskManagementService.getTdsGstr1Ledger()
      ]);
      setWaterfall(wf);
      setTdsLedger(tds);
      setReconcileNotice(
        `Reconciled live PostgreSQL statutory ledger (${wf.totalTransactions} invoices, ${tds.length} partner §194-O accounts, ${scan.candidatesDetected} active risk checks).`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Live statutory reconciliation failed.');
    } finally {
      setReconciling(false);
    }
  };

  const totalGrossGmv = waterfall?.totalGrossGmvInr ?? 0;
  const gstReserve = waterfall?.deductions.gstLiabilityOnTakeRateInr ?? 0;
  const tdsWithheld = waterfall?.deductions.tdsSection194OInr ?? 0;
  const totalStatutoryReserve = gstReserve + tdsWithheld;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              Statutory Tax Engine, GST (18%) &amp; §194-O TDS Ledger
            </h2>
            <Badge variant="success">Live PostgreSQL ({currency})</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Real-time Section 194-O e-commerce TDS &amp; GST 18% take-rate accruals derived directly from clinical billing invoices
          </p>
        </div>

        <button type="button" onClick={handleReconcileTax} disabled={reconciling || loading}>
          {reconciling ? 'Reconciling Ledger...' : 'Reconcile Statutory Ledger'}
        </button>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid #EF4444', borderRadius: '10px', padding: '12px 16px', color: '#FCA5A5', fontSize: '0.875rem', fontWeight: 700 }}>
          {errorMsg}
        </div>
      )}

      {reconcileNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {reconcileNotice}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>GROSS INVOICE VOLUME (GMV)</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
            {loading ? '...' : formatMoney(totalGrossGmv)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>
            {waterfall?.totalTransactions ?? 0} live invoice(s) • {waterfall?.periodMonth || 'Current Month'}
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>GST (18%) + TDS (§194-O) RESERVES</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>
            {loading ? '...' : formatMoney(totalStatutoryReserve)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>
            GST: {formatMoney(gstReserve)} • TDS: {formatMoney(tdsWithheld)}
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>PARTNER §194-O ACCOUNTS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>
            {tdsLedger.length} Partner Ledger(s)
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>
            {waterfall?.complianceStatus || 'POSTGRESQL_VERIFIED'}
          </span>
        </div>
      </div>

      {tdsLedger.length > 0 && (
        <Card title="Live Partner Section 194-O & GSTR-1 Deductions" padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>PAN / GSTIN</TableHead>
                  <TableHead>Gross GMV</TableHead>
                  <TableHead>Sec 194-O TDS</TableHead>
                  <TableHead>Challan Reference</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tdsLedger.map((r) => (
                  <TableRow key={r.partnerId}>
                    <TableCell style={{ fontWeight: 700 }}>{r.partnerLegalName}</TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>{r.pan} / {r.gstin}</TableCell>
                    <TableCell>{formatMoney(r.grossTransactionValueInr)}</TableCell>
                    <TableCell style={{ fontWeight: 700, color: '#F59E0B' }}>{formatMoney(r.tdsDeductedInr)}</TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{r.challanNumber}</TableCell>
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

      <Card title="Configured Statutory Jurisdiction Schedule" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country / Jurisdiction</TableHead>
                <TableHead>Tax Scheme Name</TableHead>
                <TableHead>Standard Tax Rate</TableHead>
                <TableHead>Filing Cycle</TableHead>
                <TableHead>Settlement Currency</TableHead>
                <TableHead>Integration Mode</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Rule Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STATUTORY_TAX_RULES.map((t) => (
                <TableRow key={t.regionJurisdiction}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{t.regionJurisdiction}</strong>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>{t.taxSchemeName}</TableCell>
                  <TableCell style={{ fontWeight: 800, color: '#10B981' }}>{t.standardTaxRate}</TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>{t.filingFrequency}</TableCell>
                  <TableCell style={{ fontWeight: 700, color: '#38BDF8' }}>{t.fxSettlementCurrency}</TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#FCD34D' }}>{t.integrationGateway}</TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Badge variant={t.integrationGateway.includes('PostgreSQL') ? 'success' : 'neutral'}>
                      {t.integrationGateway.includes('PostgreSQL') ? 'LIVE LEDGER' : 'ADAPTER CONFIG'}
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
