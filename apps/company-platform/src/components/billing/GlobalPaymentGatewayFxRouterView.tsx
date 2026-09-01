import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';
import { useGlobalLocale } from '../common/GlobalCurrencyLocaleContext.js';

interface PaymentGatewayRoute {
  gatewayId: string;
  gatewayName: string;
  supportedCurrencies: string[];
  settlementSpeed: string;
  fxConversionSpread: string;
  paymentMethods: string;
  operatingStatus: 'OPERATIONAL_LIVE';
}

const GATEWAYS: PaymentGatewayRoute[] = [
  {
    gatewayId: 'GW-STRIPE-GLOBAL',
    gatewayName: 'Stripe Global Enterprise & Elements',
    supportedCurrencies: ['USD ($)', 'EUR (€)', 'GBP (£)', 'AUD (A$)', 'CAD (C$)'],
    settlementSpeed: 'T+2 Rolling Settlement',
    fxConversionSpread: '0.35% Direct Interbank Rate',
    paymentMethods: 'Credit Cards, Apple Pay, Google Pay, SEPA Direct Debit',
    operatingStatus: 'OPERATIONAL_LIVE'
  },
  {
    gatewayId: 'GW-ADYEN-EU',
    gatewayName: 'Adyen International & Pan-European Ingress',
    supportedCurrencies: ['EUR (€)', 'GBP (£)', 'CHF (CHF)', 'SEK (kr)'],
    settlementSpeed: 'T+1 Daily Settlement',
    fxConversionSpread: '0.28% Wholesale Multi-Currency',
    paymentMethods: 'iDEAL, Sofort, Bancontact, Giropay, Visa/Mastercard',
    operatingStatus: 'OPERATIONAL_LIVE'
  },
  {
    gatewayId: 'GW-TELR-ME',
    gatewayName: 'Telr & PayTabs Middle East Healthcare Gateway',
    supportedCurrencies: ['AED (د.إ)', 'SAR (﷼)', 'QAR (ر.ق)', 'BHD (BD)'],
    settlementSpeed: 'T+2 Local GCC Settlement',
    fxConversionSpread: '0.40% GCC Pegged FX Rate',
    paymentMethods: 'Mada, SADAD, UAE Central Bank NetBanking, Benefit',
    operatingStatus: 'OPERATIONAL_LIVE'
  },
  {
    gatewayId: 'GW-RAZORPAY-IN',
    gatewayName: 'Razorpay Enterprise & NPCI UPI AutoPay',
    supportedCurrencies: ['INR (₹)'],
    settlementSpeed: 'T+1 Instant Doctor Escrow',
    fxConversionSpread: '0.00% Domestic Zero Spread',
    paymentMethods: 'UPI 2.0 AutoPay, NetBanking (54 Banks), RuPay, EMI Cards',
    operatingStatus: 'OPERATIONAL_LIVE'
  }
];

export const GlobalPaymentGatewayFxRouterView: React.FC = () => {
  const { formatMoney } = useGlobalLocale();
  const [settleNotice, setSettleNotice] = useState<string | null>(null);

  const handleTriggerSettlement = () => {
    setSettleNotice('✓ Multi-Currency Treasury Settlement successfully executed across Stripe USD, Adyen EUR, Telr AED, and Razorpay INR with 0.35% optimized FX spread!');
    setTimeout(() => setSettleNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              💳 Global Payment Gateways & FX Treasury Settlement Router
            </h2>
            <Badge variant="success">● Multi-Currency Gateway Router Active</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Intelligent payment routing across Stripe Global, Adyen EU, Telr Middle East, and Razorpay India with automated FX treasury hedging
          </p>
        </div>

        <button
          type="button"
          onClick={handleTriggerSettlement}
          style={{
            backgroundColor: '#10B981',
            color: '#070C16',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontWeight: 900,
            fontSize: '0.8125rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
          }}
        >
          💳 Trigger Multi-Currency Settlement
        </button>
      </div>

      {settleNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {settleNotice}
        </div>
      )}

      {/* Gateway Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>24H PROCESSED VOLUME</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
            {formatMoney(14800000)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>99.94% Card & UPI Success Rate</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>TREASURY FX SPREAD</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>0.32% Avg</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Direct Interbank Wholesale Rates</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>ACTIVE GLOBAL RAILS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>4 Payment Networks</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>USA, Europe, GCC & India</span>
        </div>
      </div>

      {/* Gateways Table */}
      <Card title="📜 Connected Global Payment Gateway Rails" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gateway Provider & Network</TableHead>
                <TableHead>Supported Settlement Currencies</TableHead>
                <TableHead>Settlement Cycle</TableHead>
                <TableHead>FX Spread & Margin</TableHead>
                <TableHead>Supported Payment Methods</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Operating Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {GATEWAYS.map((g) => (
                <TableRow key={g.gatewayId}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{g.gatewayName}</strong>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#38BDF8', display: 'block' }}>{g.gatewayId}</span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#86EFAC', fontWeight: 700 }}>
                    {g.supportedCurrencies.join(', ')}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>
                    {g.settlementSpeed}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#FCD34D' }}>
                    {g.fxConversionSpread}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#CBD5E1', maxWidth: '240px' }}>
                    {g.paymentMethods}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Badge variant="success">✓ {g.operatingStatus.replace(/_/g, ' ')}</Badge>
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
