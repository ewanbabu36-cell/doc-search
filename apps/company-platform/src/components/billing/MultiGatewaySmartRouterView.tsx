import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';

export interface GatewayHealth {
  id: string;
  name: string;
  logo: string;
  currencySupport: string[];
  latencyMs: number;
  successRate: number;
  mdrRate: string;
  status: 'OPTIMAL' | 'DEGRADED' | 'STANDBY';
  trafficSharePercent: number;
}

export const MultiGatewaySmartRouterView: React.FC = () => {
  const [gateways, setGateways] = useState<GatewayHealth[]>([
    {
      id: 'RAZORPAY_INDIA',
      name: 'Razorpay Auto-Routing Node',
      logo: '🇮🇳 ⚡',
      currencySupport: ['INR (UPI/RuPay/NetBanking)'],
      latencyMs: 165,
      successRate: 99.98,
      mdrRate: '0.0% MDR (UPI / RuPay)',
      status: 'OPTIMAL',
      trafficSharePercent: 70
    },
    {
      id: 'CASHFREE_INDIA',
      name: 'Cashfree Payouts & Auto-Debit',
      logo: '🇮🇳 💳',
      currencySupport: ['INR (UPI Autopay / e-NACH)'],
      latencyMs: 192,
      successRate: 99.94,
      mdrRate: '0.0% MDR (Domestic RuPay)',
      status: 'OPTIMAL',
      trafficSharePercent: 30
    },
    {
      id: 'STRIPE_GLOBAL',
      name: 'Stripe Global Multi-Currency Gateway',
      logo: '🌍 🌐',
      currencySupport: ['USD', 'EUR', 'GBP', 'AED', 'SGD'],
      latencyMs: 380,
      successRate: 99.95,
      mdrRate: '2.9% + $0.30 (Cross-Border FX)',
      status: 'OPTIMAL',
      trafficSharePercent: 100
    }
  ]);

  const [autoFailoverEnabled, setAutoFailoverEnabled] = useState(true);
  const [latencyThresholdMs, setLatencyThresholdMs] = useState(800);
  const [domesticSplitRazorpay, setDomesticSplitRazorpay] = useState(70);

  // Live Payment Simulation State
  const [simCurrency, setSimCurrency] = useState<'INR' | 'USD' | 'AED'>('INR');
  const [simMethod, setSimMethod] = useState<'UPI' | 'RUPAY_CARD' | 'VISA_MASTERCARD'>('UPI');
  const [simAmount, setSimAmount] = useState(4999);
  const [simResult, setSimResult] = useState<{
    routedGateway: string;
    mdrSavedInr: number;
    latencyMs: number;
    path: string;
  } | null>(null);

  const handleSimulatePayment = () => {
    let routedGateway = '';
    let mdrSavedInr = 0;
    let latency = 165;
    let path = '';

    if (simCurrency === 'INR') {
      if (simMethod === 'UPI' || simMethod === 'RUPAY_CARD') {
        const rand = Math.random() * 100;
        if (rand < domesticSplitRazorpay) {
          routedGateway = 'Razorpay Node (0% MDR Engine)';
          latency = 165;
        } else {
          routedGateway = 'Cashfree Node (0% MDR Engine)';
          latency = 192;
        }
        mdrSavedInr = Math.round((simAmount * 1.8) / 100); // 1.8% standard card fee saved
        path = `Routing Decision: Domestic ${simMethod} detected -> Selected 0% MDR domestic pipe -> Settled via ${routedGateway}`;
      } else {
        routedGateway = 'Razorpay Domestic Visa/Mastercard';
        latency = 220;
        path = 'Routing Decision: Domestic Private Card -> Routed to lowest MDR interchange gateway';
      }
    } else {
      routedGateway = 'Stripe Global Gateway (FX Auto-Convert)';
      latency = 380;
      path = `Routing Decision: International Currency (${simCurrency}) -> Routed to Stripe multi-currency ledger`;
    }

    setSimResult({
      routedGateway,
      mdrSavedInr,
      latencyMs: latency,
      path
    });
  };

  const handleTriggerFailoverSim = () => {
    setGateways((prev) =>
      prev.map((g) =>
        g.id === 'RAZORPAY_INDIA'
          ? { ...g, latencyMs: 920, status: 'DEGRADED', trafficSharePercent: 0 }
          : g.id === 'CASHFREE_INDIA'
          ? { ...g, trafficSharePercent: 100 }
          : g
      )
    );
  };

  const handleResetGateways = () => {
    setGateways([
      {
        id: 'RAZORPAY_INDIA',
        name: 'Razorpay Auto-Routing Node',
        logo: '🇮🇳 ⚡',
        currencySupport: ['INR (UPI/RuPay/NetBanking)'],
        latencyMs: 165,
        successRate: 99.98,
        mdrRate: '0.0% MDR (UPI / RuPay)',
        status: 'OPTIMAL',
        trafficSharePercent: 70
      },
      {
        id: 'CASHFREE_INDIA',
        name: 'Cashfree Payouts & Auto-Debit',
        logo: '🇮🇳 💳',
        currencySupport: ['INR (UPI Autopay / e-NACH)'],
        latencyMs: 192,
        successRate: 99.94,
        mdrRate: '0.0% MDR (Domestic RuPay)',
        status: 'OPTIMAL',
        trafficSharePercent: 30
      },
      {
        id: 'STRIPE_GLOBAL',
        name: 'Stripe Global Multi-Currency Gateway',
        logo: '🌍 🌐',
        currencySupport: ['USD', 'EUR', 'GBP', 'AED', 'SGD'],
        latencyMs: 380,
        successRate: 99.95,
        mdrRate: '2.9% + $0.30 (Cross-Border FX)',
        status: 'OPTIMAL',
        trafficSharePercent: 100
      }
    ]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 50%, rgba(139, 92, 246, 0.15) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.75rem' }}>💳</span>
            <div>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Multi-Gateway Smart Payment Routing & 0% MDR Optimization
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
                Automated intelligent routing across Razorpay, Cashfree & Stripe with 0% MDR for Indian UPI/RuPay and zero-downtime auto-failover.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" onClick={handleTriggerFailoverSim}>
            ⚡ Simulate Latency Spike Failover
          </Button>
          <Button variant="primary" onClick={handleResetGateways}>
            🔄 Reset Gateways Health
          </Button>
        </div>
      </div>

      {/* Gateway Health Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {gateways.map((gw) => {
          const isOptimal = gw.status === 'OPTIMAL';
          return (
            <div
              key={gw.id}
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: isOptimal ? '1px solid rgba(16, 185, 129, 0.35)' : '1.5px solid rgba(239, 68, 68, 0.5)',
                borderRadius: '14px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{gw.logo}</span>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>{gw.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{gw.currencySupport.join(', ')}</div>
                    </div>
                  </div>
                  <Badge variant={isOptimal ? 'success' : 'danger'}>{gw.status}</Badge>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '16px 0' }}>
                  <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Live Latency</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 800, color: gw.latencyMs < 300 ? '#34D399' : '#EF4444' }}>
                      {gw.latencyMs} ms
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Success SLA</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#38BDF8' }}>
                      {gw.successRate}%
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#6EE7B7', fontWeight: 600 }}>
                  💰 Fee Model: {gw.mdrRate}
                </div>
              </div>

              <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Active Traffic Allocation:</span>
                <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: isOptimal ? '#34D399' : '#EF4444' }}>
                  {gw.trafficSharePercent}% Traffic
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Routing Rules & Payment Simulator Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Left: Routing Policies */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase' }}>
            ⚙️ Smart Routing Rules & Failover Policy
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8125rem', color: '#E2E8F0' }}>🇮🇳 Domestic Volume Split (Razorpay vs Cashfree):</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#34D399' }}>
                {domesticSplitRazorpay}% / {100 - domesticSplitRazorpay}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={domesticSplitRazorpay}
              onChange={(e) => setDomesticSplitRazorpay(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#10B981', cursor: 'pointer' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8125rem', color: '#E2E8F0' }}>⚡ Auto-Failover Latency Ceiling:</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F59E0B' }}>
                {latencyThresholdMs} ms
              </span>
            </div>
            <input
              type="range"
              min="300"
              max="1500"
              step="50"
              value={latencyThresholdMs}
              onChange={(e) => setLatencyThresholdMs(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#F59E0B', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '12px', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#FFFFFF' }}>0% MDR Priority Enforcement</div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Force UPI/RuPay transactions to bypass standard credit card interchange fees</div>
            </div>
            <Badge variant="success">ENABLED</Badge>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '12px', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#FFFFFF' }}>Zero-Downtime Auto-Failover</div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Reroute traffic automatically when latency exceeds {latencyThresholdMs}ms</div>
            </div>
            <button
              type="button"
              onClick={() => setAutoFailoverEnabled(!autoFailoverEnabled)}
              style={{
                backgroundColor: autoFailoverEnabled ? '#10B981' : 'rgba(51, 65, 85, 0.6)',
                color: autoFailoverEnabled ? '#000' : '#E2E8F0',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {autoFailoverEnabled ? 'ACTIVE' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Right: Payment Simulator */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          border: '1.5px solid rgba(6, 182, 212, 0.35)',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase' }}>
            🧪 Live Smart Routing Simulator
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Currency</label>
              <select
                value={simCurrency}
                onChange={(e) => setSimCurrency(e.target.value as 'INR' | 'USD' | 'AED')}
                style={{ width: '100%', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', padding: '6px 8px', color: '#FFF', fontSize: '0.8125rem' }}
              >
                <option value="INR">INR (₹ Indian Rupee)</option>
                <option value="USD">USD ($ US Dollar)</option>
                <option value="AED">AED (د.إ UAE Dirham)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Payment Method</label>
              <select
                value={simMethod}
                onChange={(e) => setSimMethod(e.target.value as any)}
                style={{ width: '100%', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', padding: '6px 8px', color: '#FFF', fontSize: '0.8125rem' }}
              >
                <option value="UPI">UPI / QR Code (0% MDR)</option>
                <option value="RUPAY_CARD">RuPay Debit Card (0% MDR)</option>
                <option value="VISA_MASTERCARD">Visa / Mastercard</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Transaction Amount</label>
            <input
              type="number"
              value={simAmount}
              onChange={(e) => setSimAmount(Number(e.target.value))}
              style={{ width: '100%', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', padding: '6px 8px', color: '#FFF', fontSize: '0.8125rem' }}
            />
          </div>

          <Button variant="primary" onClick={handleSimulatePayment}>
            ⚡ Route Simulated Payment
          </Button>

          {simResult && (
            <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '10px', padding: '12px', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Selected Gateway Node:</span>
                <span style={{ fontWeight: 800, color: '#34D399', fontSize: '0.875rem' }}>{simResult.routedGateway}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>0% MDR Fee Saved:</span>
                <span style={{ fontWeight: 800, color: '#F59E0B', fontSize: '0.875rem' }}>₹{simResult.mdrSavedInr.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#38BDF8', marginTop: '6px' }}>
                {simResult.path}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
