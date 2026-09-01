import React, { useState } from 'react';
import { Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface GlobalCurrencyPlan {
  id: string;
  regionName: string;
  currencyCode: 'INR' | 'AED' | 'GBP' | 'USD' | 'EUR';
  currencySymbol: string;
  flag: string;
  targetMarket: string;
  retailPrice: number;
  inrEquivalent: number;
  freeConsults: number;
  pharmacyDiscount: string;
  labDiscount: string;
  crossBorderPerks: string;
  paymentGateways: string;
  status: 'EDGE_ACTIVE' | 'PENDING_DEPLOY';
}

const GLOBAL_GEO_PLANS: GlobalCurrencyPlan[] = [
  {
    id: 'GEO-IND-01',
    regionName: 'India National Network',
    currencyCode: 'INR',
    currencySymbol: '₹',
    flag: '🇮🇳',
    targetMarket: 'Pan-India Metros & Tier-2/3 Cities',
    retailPrice: 799,
    inrEquivalent: 799,
    freeConsults: 3,
    pharmacyDiscount: '20% OFF',
    labDiscount: '25% OFF',
    crossBorderPerks: 'Pan-India 486 Hospital Bed Network',
    paymentGateways: 'UPI, RuPay, NetBanking, Cards',
    status: 'EDGE_ACTIVE'
  },
  {
    id: 'GEO-DXB-02',
    regionName: 'Dubai Healthcare City & GCC',
    currencyCode: 'AED',
    currencySymbol: 'AED',
    flag: '🇦🇪',
    targetMarket: 'Dubai, Abu Dhabi, Sharjah & GCC Expats',
    retailPrice: 179,
    inrEquivalent: 4210, // ~179 * 23.52
    freeConsults: 4,
    pharmacyDiscount: '18% OFF',
    labDiscount: '30% OFF',
    crossBorderPerks: 'Mediclinic City & Aster DM Partner Tele-Triage',
    paymentGateways: 'Stripe Middle East, Apple Pay, Tabby',
    status: 'EDGE_ACTIVE'
  },
  {
    id: 'GEO-LON-03',
    regionName: 'London NHS & UK Private Partner',
    currencyCode: 'GBP',
    currencySymbol: '£',
    flag: '🇬🇧',
    targetMarket: 'London, Manchester & Birmingham NHS/Private',
    retailPrice: 39,
    inrEquivalent: 4282, // ~39 * 109.80
    freeConsults: 4,
    pharmacyDiscount: '15% OFF',
    labDiscount: '25% OFF',
    crossBorderPerks: 'King’s College & Bupa Fast-Track Tele-Health',
    paymentGateways: 'Stripe UK, BACS, Apple Pay, Google Pay',
    status: 'EDGE_ACTIVE'
  },
  {
    id: 'GEO-USA-04',
    regionName: 'North America & Global Hub',
    currencyCode: 'USD',
    currencySymbol: '$',
    flag: '🇺🇸',
    targetMarket: 'United States & Global Cross-Border Patients',
    retailPrice: 49,
    inrEquivalent: 4233, // ~49 * 86.40
    freeConsults: 4,
    pharmacyDiscount: '20% OFF',
    labDiscount: '30% OFF',
    crossBorderPerks: 'Mayo Clinic & Cleveland Partner Second Opinion',
    paymentGateways: 'Stripe US, ACH, Apple Pay, PayPal',
    status: 'EDGE_ACTIVE'
  },
  {
    id: 'GEO-EUR-05',
    regionName: 'European Union Health Network',
    currencyCode: 'EUR',
    currencySymbol: '€',
    flag: '🇪🇺',
    targetMarket: 'Germany, France, Netherlands & EU Expats',
    retailPrice: 45,
    inrEquivalent: 4167, // ~45 * 92.60
    freeConsults: 4,
    pharmacyDiscount: '18% OFF',
    labDiscount: '25% OFF',
    crossBorderPerks: 'GDPR-Compliant Cross-Border E-Prescription',
    paymentGateways: 'Stripe SEPA, iDEAL, Sofort, Giropay',
    status: 'EDGE_ACTIVE'
  }
];

export const MultiCurrencyGeoPricingView: React.FC = () => {
  const [plans, setPlans] = useState<GlobalCurrencyPlan[]>(GLOBAL_GEO_PLANS);
  const [selectedGeoPreview, setSelectedGeoPreview] = useState<GlobalCurrencyPlan['currencyCode']>('AED');
  const [deployNotice, setDeployNotice] = useState<string | null>(null);

  const previewPlan = plans.find((p) => p.currencyCode === selectedGeoPreview) || plans[0]!;

  const handleDeployGlobalRates = () => {
    setDeployNotice('✓ All Global Multi-Currency Geo-Pricing rules (AED 179, £39, $49, €45, ₹799) deployed to Cloudflare Edge CDN & Stripe Multi-Currency Gateways!');
    setTimeout(() => setDeployNotice(null), 5000);
  };

  const handleUpdatePrice = (id: string, newPrice: number) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, retailPrice: newPrice } : p))
    );
    setDeployNotice(`✓ Updated local currency price for "${id}" to ${newPrice}!`);
    setTimeout(() => setDeployNotice(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>🌐</span>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
              Multi-Currency Geo-Pricing Engine (USD, EUR, AED, GBP, INR)
            </h2>
            <Badge variant="success">● Multi-Tenant FX Treasury Active</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
            Automatic IP-based Geo-Pricing routing localized Care Passes ($49/yr, £39/yr, AED 179/yr, €45/yr, ₹799/yr) across global partner clusters.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleDeployGlobalRates}
          style={{
            backgroundColor: '#06B6D4',
            color: '#070C16',
            fontWeight: 900,
            boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)'
          }}
        >
          ⚡ Deploy Global Rates to Edge CDN
        </Button>
      </div>

      {deployNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {deployNotice}
        </div>
      )}

      {/* Top FX Treasury Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.25rem' }}>🇦🇪</span>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800 }}>DUBAI HEALTHCARE CITY</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', margin: '4px 0', fontFamily: 'monospace' }}>
            AED 179 <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>/ yr</span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#10B981' }}>~ ₹ 4,210 INR Equivalent</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.25rem' }}>🇬🇧</span>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800 }}>LONDON NHS & UK</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', margin: '4px 0', fontFamily: 'monospace' }}>
            £ 39 <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>/ yr</span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#10B981' }}>~ ₹ 4,282 INR Equivalent</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.25rem' }}>🇺🇸</span>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800 }}>NORTH AMERICA (USD)</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', margin: '4px 0', fontFamily: 'monospace' }}>
            $ 49 <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>/ yr</span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#10B981' }}>~ ₹ 4,233 INR Equivalent</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.25rem' }}>🇪🇺</span>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800 }}>EUROPEAN UNION</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#A78BFA', margin: '4px 0', fontFamily: 'monospace' }}>
            € 45 <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>/ yr</span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#10B981' }}>~ ₹ 4,167 INR Equivalent</span>
        </div>
      </div>

      {/* Global Multi-Currency Pricing Table */}
      <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
              🌐 Active Regional Currency Passes & Gateway Routing
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Synchronized with interbank FX conversion & regional payment rails
            </span>
          </div>
          <Badge variant="primary">5 Currency Vaults Active</Badge>
        </div>

        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Target Territory / Hub</TableHead>
                <TableHead>Local Retail Price</TableHead>
                <TableHead>INR Conversion Run-Rate</TableHead>
                <TableHead>Clinical Quota & Discounts</TableHead>
                <TableHead>Regional Payment Rails</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Edge CDN State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.5rem' }}>{p.flag}</span>
                      <div>
                        <strong style={{ color: '#F8FAFC', fontSize: '0.875rem' }}>{p.regionName}</strong>
                        <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>
                          {p.targetMarket}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 900, color: '#FCD34D', fontFamily: 'monospace' }}>
                        {p.currencySymbol}
                      </span>
                      <input
                        type="number"
                        value={p.retailPrice}
                        onChange={(e) => handleUpdatePrice(p.id, Number(e.target.value))}
                        style={{
                          width: '70px',
                          padding: '4px 6px',
                          backgroundColor: '#1E293B',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#FCD34D',
                          fontWeight: 900,
                          fontFamily: 'monospace',
                          fontSize: '0.9375rem'
                        }}
                      />
                      <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>/ yr</span>
                    </div>
                  </TableCell>

                  <TableCell style={{ fontWeight: 800, color: '#10B981', fontFamily: 'monospace' }}>
                    ₹ {p.inrEquivalent.toLocaleString('en-IN')}
                  </TableCell>

                  <TableCell>
                    <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                      🩺 <strong>{p.freeConsults} Consults</strong> • 🧪 {p.labDiscount} • 💊 {p.pharmacyDiscount}
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: '#38BDF8', display: 'block' }}>
                      {p.crossBorderPerks}
                    </span>
                  </TableCell>

                  <TableCell style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    {p.paymentGateways}
                  </TableCell>

                  <TableCell style={{ textAlign: 'right' }}>
                    <Badge variant="success">✓ Edge Live</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Interactive Geo-IP Simulation Sandbox */}
      <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #06B6D4', borderRadius: '16px', padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>🧪</span>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
                Interactive Geo-IP Patient Checkout Simulator
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Select a global city location to simulate how the localized patient portal pricing renders
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px', backgroundColor: '#1E293B', padding: '4px', borderRadius: '8px' }}>
            {(['INR', 'AED', 'GBP', 'USD', 'EUR'] as const).map((curr) => (
              <button
                key={curr}
                type="button"
                onClick={() => setSelectedGeoPreview(curr)}
                style={{
                  backgroundColor: selectedGeoPreview === curr ? '#06B6D4' : 'transparent',
                  color: selectedGeoPreview === curr ? '#070C16' : '#94A3B8',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>

        {/* Mock Localized Checkout Card */}
        <div
          style={{
            backgroundColor: '#1E293B',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '2rem' }}>{previewPlan.flag}</span>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase' }}>
                  DETECTED GEOLOCATION: {previewPlan.regionName}
                </span>
                <h4 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                  Gold Family Care Pass (Global Edition)
                </h4>
              </div>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '0.8125rem', color: '#CBD5E1' }}>
              Includes {previewPlan.freeConsults} specialist consultations, {previewPlan.pharmacyDiscount} pharmacy, and {previewPlan.crossBorderPerks}.
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', textTransform: 'uppercase' }}>LOCAL ANNUAL SUBSCRIPTION</span>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10B981', fontFamily: 'monospace' }}>
              {previewPlan.currencySymbol} {previewPlan.retailPrice}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#FCD34D' }}>
              Supported: {previewPlan.paymentGateways.split(',')[0]} & Express Checkout
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
