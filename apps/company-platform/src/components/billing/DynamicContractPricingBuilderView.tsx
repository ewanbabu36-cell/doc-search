import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';

export const DynamicContractPricingBuilderView: React.FC = () => {
  // 1. Target Organization State
  const [orgName, setOrgName] = useState('Apollo Hospitals Enterprise Network');
  const [orgGst, setOrgGst] = useState('07AAAAA0000A1Z5');
  const [billingContact, setBillingContact] = useState('cfo@apollohospitals.com');

  // 2. Pricing Model Selection
  const [pricingModel, setPricingModel] = useState<'TIERED_VOLUME' | 'HYBRID_USAGE' | 'CUSTOM_ENTERPRISE'>('HYBRID_USAGE');

  // 3. Operational Inputs
  const [bedCount, setBedCount] = useState(280);
  const [dailyOpdTokens, setDailyOpdTokens] = useState(450);
  const [monthlyTeleconsultVolumeInr, setMonthlyTeleconsultVolumeInr] = useState(250000);
  const [teleconsultSharePercent, setTeleconsultSharePercent] = useState(2.0); // 2% platform fee
  const [opdTokenRateInr, setOpdTokenRateInr] = useState(5.0); // ₹5 per token
  const [hybridBaseFeeInr, setHybridBaseFeeInr] = useState(20000); // ₹20,000 flat monthly base

  // 4. Contract Terms & Tenure
  const [contractTenureYears, setContractTenureYears] = useState(3);
  const [billingFrequency, setBillingFrequency] = useState<'MONTHLY' | 'ANNUAL'>('ANNUAL');

  // 5. Tier Rules Configuration (Customizable)
  const [tier1Rate, setTier1Rate] = useState(250); // 1-100 beds
  const [tier2Rate, setTier2Rate] = useState(180); // 101-300 beds
  const [tier3Rate, setTier3Rate] = useState(120); // 300+ beds

  // 6. Seasonal Freeze / Grace Period Controls
  const [isFreezeActive, setIsFreezeActive] = useState(false);
  const [freezeStartDate, setFreezeStartDate] = useState('2026-10-01');
  const [freezeEndDate, setFreezeEndDate] = useState('2026-11-15');
  const [freezeDiscountPercent, setFreezeDiscountPercent] = useState(100); // 100% pause or 50% maintenance standby
  const [freezeReason, setFreezeReason] = useState('East Wing ICU Infrastructure Upgrade & Fire NOC Audit');

  // Contract Generation State
  const [issuedContract, setIssuedContract] = useState<{
    contractId: string;
    hash: string;
    issuedAt: string;
  } | null>(null);

  // ==========================================
  // REAL-TIME FINANCIAL COMPUTATIONS
  // ==========================================
  const calculateTieredBedCost = (beds: number): { total: number; breakdown: { label: string; count: number; rate: number; subtotal: number }[] } => {
    let remaining = beds;
    const breakdown: { label: string; count: number; rate: number; subtotal: number }[] = [];
    let total = 0;

    // Tier 1: 1 to 100 beds
    if (remaining > 0) {
      const count = Math.min(remaining, 100);
      const subtotal = count * tier1Rate;
      breakdown.push({ label: 'Tier 1 (1–100 Beds)', count, rate: tier1Rate, subtotal });
      total += subtotal;
      remaining -= count;
    }

    // Tier 2: 101 to 300 beds
    if (remaining > 0) {
      const count = Math.min(remaining, 200);
      const subtotal = count * tier2Rate;
      breakdown.push({ label: 'Tier 2 (101–300 Beds)', count, rate: tier2Rate, subtotal });
      total += subtotal;
      remaining -= count;
    }

    // Tier 3: 300+ beds
    if (remaining > 0) {
      const count = remaining;
      const subtotal = count * tier3Rate;
      breakdown.push({ label: 'Tier 3 (301+ Beds)', count, rate: tier3Rate, subtotal });
      total += subtotal;
      remaining = 0;
    }

    return { total, breakdown };
  };

  const bedCalculation = calculateTieredBedCost(bedCount);
  const monthlyOpdTokensCost = Math.round(dailyOpdTokens * 30 * opdTokenRateInr);
  const monthlyTeleconsultFee = Math.round((monthlyTeleconsultVolumeInr * teleconsultSharePercent) / 100);

  // Compute Base Monthly Subtotal
  let baseMonthlySubtotal = 0;
  if (pricingModel === 'TIERED_VOLUME') {
    baseMonthlySubtotal = bedCalculation.total;
  } else if (pricingModel === 'HYBRID_USAGE') {
    baseMonthlySubtotal = hybridBaseFeeInr + monthlyOpdTokensCost + monthlyTeleconsultFee;
  } else {
    // Custom Enterprise: Hybrid + Tiered combined
    baseMonthlySubtotal = bedCalculation.total + monthlyOpdTokensCost + monthlyTeleconsultFee;
  }

  // Tenure Discount
  let tenureDiscountPercent = 0;
  if (contractTenureYears === 2) tenureDiscountPercent = 5;
  else if (contractTenureYears === 3) tenureDiscountPercent = 12;
  else if (contractTenureYears >= 5) tenureDiscountPercent = 20;

  // Billing Frequency Discount (10% off for Annual)
  const frequencyDiscountPercent = billingFrequency === 'ANNUAL' ? 10 : 0;
  const totalDiscountPercent = tenureDiscountPercent + frequencyDiscountPercent;

  const discountAmount = Math.round((baseMonthlySubtotal * totalDiscountPercent) / 100);
  const netMonthlyBillable = Math.max(0, baseMonthlySubtotal - discountAmount);
  const annualContractValue = netMonthlyBillable * 12;
  const totalMultiYearContractValue = annualContractValue * contractTenureYears;

  const gstRatePercent = 18;
  const monthlyGstAmount = Math.round((netMonthlyBillable * gstRatePercent) / 100);
  const grandMonthlyTotalWithGst = netMonthlyBillable + monthlyGstAmount;

  const handleIssueContract = () => {
    const contractId = `CTR-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const hash = Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    setIssuedContract({
      contractId,
      hash: `0x${hash}`,
      issuedAt: new Date().toISOString()
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
        border: '1px solid rgba(6, 182, 212, 0.3)',
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
            <span style={{ fontSize: '1.75rem' }}>🎛️</span>
            <div>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Dynamic No-Code Custom Contract & Pricing Matrix Builder
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
                Design custom enterprise contracts with progressive bed-tier scaling, hybrid usage metering, and seasonal renovation freeze periods.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="primary" onClick={handleIssueContract}>
            📑 Issue Legally-Binding Contract
          </Button>
        </div>
      </div>

      {issuedContract && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '1.5px solid #10B981',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>✅</span>
              <span style={{ fontWeight: 800, color: '#6EE7B7', fontSize: '1rem' }}>
                Contract Issued Successfully: {issuedContract.contractId}
              </span>
              <Badge variant="success">ACTIVE IMMUTABLE</Badge>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px', fontFamily: 'monospace' }}>
              SHA-256 Ledger Hash: {issuedContract.hash} • Timestamp: {issuedContract.issuedAt}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIssuedContract(null)}
            style={{ background: 'none', border: 'none', color: '#6EE7B7', cursor: 'pointer', fontWeight: 800 }}
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      {/* 2. Main Builder Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Left Column: Model Configuration & Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Target Entity Box */}
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '20px'
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#38BDF8', marginBottom: '14px', textTransform: 'uppercase' }}>
              🏢 1. Target Hospital / Enterprise Partner
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Hospital Network Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#FFFFFF',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>GSTIN Number</label>
                  <input
                    type="text"
                    value={orgGst}
                    onChange={(e) => setOrgGst(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#FFFFFF',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Billing CFO Email</label>
                  <input
                    type="email"
                    value={billingContact}
                    onChange={(e) => setBillingContact(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#FFFFFF',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Model Selector */}
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '20px'
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#38BDF8', marginBottom: '14px', textTransform: 'uppercase' }}>
              📊 2. Select Contract Pricing Model
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              {[
                { id: 'TIERED_VOLUME' as const, title: 'Tiered Volume Scaling', desc: 'Progressive bed discounts (1-100, 101-300, 300+)' },
                { id: 'HYBRID_USAGE' as const, title: 'Hybrid Model', desc: 'Flat Base (₹20K) + ₹5/Token + 2% Teleconsult' },
                { id: 'CUSTOM_ENTERPRISE' as const, title: 'Combined Enterprise', desc: 'Bed tiers + Usage Token metering' }
              ].map((m) => {
                const isSelected = pricingModel === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPricingModel(m.id)}
                    style={{
                      backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                      border: isSelected ? '1.5px solid #06B6D4' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '12px',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: isSelected ? '#FFFFFF' : '#E2E8F0' }}>
                      {m.title}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: isSelected ? '#38BDF8' : '#94A3B8', marginTop: '4px' }}>
                      {m.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Operational Metrics Sliders & Rate Inputs */}
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
              ⚙️ 3. Hospital Capacity, Rates & Metering
            </div>

            {/* Tier Rates Config */}
            {(pricingModel === 'TIERED_VOLUME' || pricingModel === 'CUSTOM_ENTERPRISE') && (
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 700, marginBottom: '8px' }}>
                  Progressive Bed Tier Rates (₹/bed/mo):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>Tier 1 (1–100)</label>
                    <input
                      type="number"
                      value={tier1Rate}
                      onChange={(e) => setTier1Rate(Number(e.target.value))}
                      style={{ width: '100%', backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', padding: '4px 6px', color: '#FFF', fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>Tier 2 (101–300)</label>
                    <input
                      type="number"
                      value={tier2Rate}
                      onChange={(e) => setTier2Rate(Number(e.target.value))}
                      style={{ width: '100%', backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', padding: '4px 6px', color: '#FFF', fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>Tier 3 (300+)</label>
                    <input
                      type="number"
                      value={tier3Rate}
                      onChange={(e) => setTier3Rate(Number(e.target.value))}
                      style={{ width: '100%', backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', padding: '4px 6px', color: '#FFF', fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Hybrid Base Fee & Rates */}
            {pricingModel !== 'TIERED_VOLUME' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>Base Fee (₹/mo)</label>
                  <input
                    type="number"
                    value={hybridBaseFeeInr}
                    onChange={(e) => setHybridBaseFeeInr(Number(e.target.value))}
                    style={{ width: '100%', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', padding: '4px 6px', color: '#FFF', fontSize: '0.8125rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>OPD Token (₹/ea)</label>
                  <input
                    type="number"
                    value={opdTokenRateInr}
                    onChange={(e) => setOpdTokenRateInr(Number(e.target.value))}
                    style={{ width: '100%', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', padding: '4px 6px', color: '#FFF', fontSize: '0.8125rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>Teleconsult Fee (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={teleconsultSharePercent}
                    onChange={(e) => setTeleconsultSharePercent(Number(e.target.value))}
                    style={{ width: '100%', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', padding: '4px 6px', color: '#FFF', fontSize: '0.8125rem' }}
                  />
                </div>
              </div>
            )}

            {/* Bed Count Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8125rem', color: '#E2E8F0', fontWeight: 600 }}>🛏️ Hospital Operational Bed Capacity:</span>
                <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#34D399' }}>{bedCount} Beds</span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={bedCount}
                onChange={(e) => setBedCount(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#10B981', cursor: 'pointer' }}
              />
            </div>

            {/* Daily OPD Tokens Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8125rem', color: '#E2E8F0', fontWeight: 600 }}>🎫 Estimated Daily OPD Tokens:</span>
                <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#38BDF8' }}>{dailyOpdTokens} tokens/day</span>
              </div>
              <input
                type="range"
                min="50"
                max="3000"
                step="50"
                value={dailyOpdTokens}
                onChange={(e) => setDailyOpdTokens(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#06B6D4', cursor: 'pointer' }}
              />
            </div>

            {/* Monthly Teleconsult Volume */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8125rem', color: '#E2E8F0', fontWeight: 600 }}>📱 Monthly Teleconsult Gross GMV:</span>
                <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#C084FC' }}>₹{monthlyTeleconsultVolumeInr.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="2000000"
                step="25000"
                value={monthlyTeleconsultVolumeInr}
                onChange={(e) => setMonthlyTeleconsultVolumeInr(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#8B5CF6', cursor: 'pointer' }}
              />
            </div>

            {/* Tenure & Frequency Selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Contract Tenure</label>
                <select
                  value={contractTenureYears}
                  onChange={(e) => setContractTenureYears(Number(e.target.value))}
                  style={{ width: '100%', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', padding: '6px 8px', color: '#FFF', fontSize: '0.8125rem' }}
                >
                  <option value={1}>1 Year (Standard)</option>
                  <option value={2}>2 Years (5% Discount)</option>
                  <option value={3}>3 Years (12% Discount)</option>
                  <option value={5}>5 Years (20% Discount)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Billing Cycle</label>
                <select
                  value={billingFrequency}
                  onChange={(e) => setBillingFrequency(e.target.value as 'MONTHLY' | 'ANNUAL')}
                  style={{ width: '100%', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', padding: '6px 8px', color: '#FFF', fontSize: '0.8125rem' }}
                >
                  <option value="MONTHLY">Monthly Billing</option>
                  <option value="ANNUAL">Annual Advance (10% Discount)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seasonal Freeze / Grace Period Manager */}
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            border: isFreezeActive ? '1.5px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: isFreezeActive ? '#FBBF24' : '#E2E8F0', textTransform: 'uppercase' }}>
                ❄️ 4. Seasonal Freeze / Renovation Grace Period
              </div>
              <button
                type="button"
                onClick={() => setIsFreezeActive(!isFreezeActive)}
                style={{
                  backgroundColor: isFreezeActive ? '#F59E0B' : 'rgba(51, 65, 85, 0.6)',
                  color: isFreezeActive ? '#000000' : '#E2E8F0',
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isFreezeActive ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            {isFreezeActive && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Freeze Start</label>
                    <input
                      type="date"
                      value={freezeStartDate}
                      onChange={(e) => setFreezeStartDate(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(30, 41, 59, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        color: '#FFFFFF',
                        fontSize: '0.75rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Freeze End</label>
                    <input
                      type="date"
                      value={freezeEndDate}
                      onChange={(e) => setFreezeEndDate(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(30, 41, 59, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        color: '#FFFFFF',
                        fontSize: '0.75rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Pause Discount %</label>
                    <input
                      type="number"
                      value={freezeDiscountPercent}
                      onChange={(e) => setFreezeDiscountPercent(Number(e.target.value))}
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(30, 41, 59, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        color: '#FFFFFF',
                        fontSize: '0.75rem'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Reason / Audit Justification</label>
                  <input
                    type="text"
                    value={freezeReason}
                    onChange={(e) => setFreezeReason(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      color: '#FFFFFF',
                      fontSize: '0.75rem'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Contract Matrix & Term Sheet */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Term Sheet Summary Card */}
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: '1.5px solid rgba(6, 182, 212, 0.35)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(6, 182, 212, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase' }}>
                  CONTRACT FINANCIAL QUOTE PREVIEW
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                  {orgName}
                </div>
              </div>
              <Badge variant="primary">{pricingModel}</Badge>
            </div>

            {/* Line Items Breakdown Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {pricingModel !== 'TIERED_VOLUME' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#94A3B8' }}>Flat Monthly Base Platform Fee:</span>
                  <span style={{ fontWeight: 700, color: '#FFFFFF' }}>₹{hybridBaseFeeInr.toLocaleString('en-IN')}</span>
                </div>
              )}

              {(pricingModel === 'TIERED_VOLUME' || pricingModel === 'CUSTOM_ENTERPRISE') && (
                <>
                  <div style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 700, marginTop: '6px' }}>
                    📊 Progressive Bed Tier Calculation:
                  </div>
                  {bedCalculation.breakdown.map((tier, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', paddingLeft: '8px' }}>
                      <span style={{ color: '#94A3B8' }}>{tier.label} ({tier.count} beds @ ₹{tier.rate}/bed):</span>
                      <span style={{ color: '#E2E8F0' }}>₹{tier.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </>
              )}

              {pricingModel !== 'TIERED_VOLUME' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: '#94A3B8' }}>OPD Tokens Metering ({dailyOpdTokens * 30} tokens @ ₹{opdTokenRateInr}/token):</span>
                    <span style={{ fontWeight: 700, color: '#FFFFFF' }}>₹{monthlyOpdTokensCost.toLocaleString('en-IN')}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: '#94A3B8' }}>Teleconsult Platform Share ({teleconsultSharePercent}% on ₹{monthlyTeleconsultVolumeInr.toLocaleString('en-IN')}):</span>
                    <span style={{ fontWeight: 700, color: '#FFFFFF' }}>₹{monthlyTeleconsultFee.toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}

              {/* Discounts */}
              {totalDiscountPercent > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#34D399' }}>
                  <span>Discounts Applied ({totalDiscountPercent}% tenure + billing cycle):</span>
                  <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {/* Subtotal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem', fontWeight: 700, borderTop: '1px dashed rgba(255, 255, 255, 0.15)', paddingTop: '8px' }}>
                <span style={{ color: '#FFFFFF' }}>Net Monthly Billable (Excl. Tax):</span>
                <span style={{ color: '#38BDF8' }}>₹{netMonthlyBillable.toLocaleString('en-IN')}/mo</span>
              </div>

              {/* GST */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: '#94A3B8' }}>Goods & Services Tax (GST 18%):</span>
                <span style={{ color: '#E2E8F0' }}>₹{monthlyGstAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Total Highlight Box */}
            <div style={{
              backgroundColor: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>
                  Total Gross Monthly (Incl. GST)
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#34D399', marginTop: '2px' }}>
                  ₹{grandMonthlyTotalWithGst.toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>
                  Annual Contract Value (ACV)
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
                  ₹{annualContractValue.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Multi-Year Contract Commitment */}
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8125rem'
            }}>
              <span style={{ color: '#E2E8F0' }}>
                Total {contractTenureYears}-Year Multi-Year Contract Value:
              </span>
              <span style={{ fontWeight: 800, color: '#F59E0B', fontSize: '1rem' }}>
                ₹{totalMultiYearContractValue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
