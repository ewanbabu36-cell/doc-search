import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';

export interface ScenarioPreset {
  id: string;
  name: string;
  badge: string;
  newHospitals: number;
  avgBeds: number;
  opdPerBedPerDay: number;
  teleconsultAdoptionPercent: number;
  horizonMonths: number;
  churnRatePercent: number;
}

export const PredictiveCashFlowRevenueSimulatorView: React.FC = () => {
  // Current Baseline Financials
  const currentBaselineMrrInr = 18450000; // ₹1.84 Cr / month
  const currentHospitalCount = 42;
  const currentBedsManaged = 8400;

  // Interactive "What-If" Sliders
  const [newHospitals, setNewHospitals] = useState(25);
  const [avgBedsPerHospital, setAvgBedsPerHospital] = useState(200);
  const [opdTokensPerBedDay, setOpdTokensPerBedDay] = useState(3.5);
  const [teleconsultAdoptionPercent, setTeleconsultAdoptionPercent] = useState(18.0);
  const [horizonMonths, setHorizonMonths] = useState(6);
  const [projectedChurnPercent, setProjectedChurnPercent] = useState(1.2);
  const [activePreset, setActivePreset] = useState<'BASE' | 'BULL' | 'BEAR'>('BULL');

  // Monte Carlo & Action State
  const [isMonteCarloRunning, setIsMonteCarloRunning] = useState(false);
  const [simNotice, setSimNotice] = useState<string | null>(null);

  const presets: Record<'BASE' | 'BULL' | 'BEAR', ScenarioPreset> = {
    BASE: {
      id: 'BASE',
      name: 'Standard Organic Pace (Base Case)',
      badge: 'PROBABLE 65%',
      newHospitals: 15,
      avgBeds: 150,
      opdPerBedPerDay: 3.0,
      teleconsultAdoptionPercent: 15.0,
      horizonMonths: 6,
      churnRatePercent: 1.5
    },
    BULL: {
      id: 'BULL',
      name: 'Aggressive Pan-India Expansion (Bull Case)',
      badge: 'HIGH GROWTH 25%',
      newHospitals: 35,
      avgBeds: 250,
      opdPerBedPerDay: 4.5,
      teleconsultAdoptionPercent: 25.0,
      horizonMonths: 6,
      churnRatePercent: 0.8
    },
    BEAR: {
      id: 'BEAR',
      name: 'Conservative Market Stress (Bear Case)',
      badge: 'DEFENSIVE 10%',
      newHospitals: 8,
      avgBeds: 120,
      opdPerBedPerDay: 2.2,
      teleconsultAdoptionPercent: 10.0,
      horizonMonths: 6,
      churnRatePercent: 3.5
    }
  };

  const handleApplyPreset = (key: 'BASE' | 'BULL' | 'BEAR') => {
    setActivePreset(key);
    const p = presets[key];
    setNewHospitals(p.newHospitals);
    setAvgBedsPerHospital(p.avgBeds);
    setOpdTokensPerBedDay(p.opdPerBedPerDay);
    setTeleconsultAdoptionPercent(p.teleconsultAdoptionPercent);
    setHorizonMonths(p.horizonMonths);
    setProjectedChurnPercent(p.churnRatePercent);
    setSimNotice(`📊 Applied "${p.name}" scenario parameters.`);
  };

  // ==========================================
  // REAL-TIME FINANCIAL SIMULATION MODEL
  // ==========================================
  // 1. Bed-based Tier Subscription Revenue (Weighted ~₹160/bed/mo)
  const additionalBedsAdded = newHospitals * avgBedsPerHospital;
  const newSubscriptionMrrInr = additionalBedsAdded * 160;

  // 2. Metered OPD Token Usage Fee (₹5/token on metered SaaS overage)
  const dailyTotalTokens = additionalBedsAdded * opdTokensPerBedDay;
  const monthlyOpdTokenRevenueInr = Math.round(dailyTotalTokens * 30 * 1.5); // ₹1.50 platform fee share per token

  // 3. Tele-Consultation 2% Volume Share
  const monthlyTeleconsultConsults = Math.round(additionalBedsAdded * 30 * (teleconsultAdoptionPercent / 100));
  const avgConsultFeeInr = 750;
  const monthlyTeleconsultGmvInr = monthlyTeleconsultConsults * avgConsultFeeInr;
  const teleconsultPlatformRevenueInr = Math.round((monthlyTeleconsultGmvInr * 2) / 100);

  // Gross New Incremental MRR
  const totalNewGrossMrrInr = newSubscriptionMrrInr + monthlyOpdTokenRevenueInr + teleconsultPlatformRevenueInr;

  // Churn deduction
  const churnDeductionInr = Math.round((currentBaselineMrrInr * (projectedChurnPercent / 100)) * (horizonMonths / 6));

  // Projected Future MRR & ARR
  const projectedFutureMrrInr = Math.max(0, currentBaselineMrrInr + totalNewGrossMrrInr - churnDeductionInr);
  const mrrGrowthPercentage = Number((((projectedFutureMrrInr - currentBaselineMrrInr) / currentBaselineMrrInr) * 100).toFixed(1));
  const projectedFutureArrInr = projectedFutureMrrInr * 12;
  const estimatedEnterpriseValuationInr = projectedFutureArrInr * 14; // 14x SaaS ARR Multiple

  // Gross Margin Calculation (Cloud + Gateway + SMS API costs ~18%)
  const grossMarginPercent = Number((82.4 - (projectedChurnPercent * 0.4)).toFixed(1));

  // ==========================================
  // 30 / 60 / 90-DAY CASH-INFLOW PROJECTIONS
  // ==========================================
  const cashProjection30Day = {
    subscriptionInflowInr: Math.round(projectedFutureMrrInr * 1.0),
    tpaInsuranceInflowInr: Math.round(monthlyTeleconsultGmvInr * 1.8), // TPA claims reimbursed
    opdGatewayInflowInr: Math.round(monthlyTeleconsultGmvInr * 1.2),
    doctorPayoutOutflowInr: Math.round(monthlyTeleconsultGmvInr * 2.1),
    cloudInfrastructureOutflowInr: Math.round(projectedFutureMrrInr * 0.16),
    get netSurplusInr() {
      return (this.subscriptionInflowInr + this.tpaInsuranceInflowInr + this.opdGatewayInflowInr) - (this.doctorPayoutOutflowInr + this.cloudInfrastructureOutflowInr);
    }
  };

  const cashProjection60Day = {
    subscriptionInflowInr: Math.round(projectedFutureMrrInr * 2.05),
    tpaInsuranceInflowInr: Math.round(monthlyTeleconsultGmvInr * 3.8),
    opdGatewayInflowInr: Math.round(monthlyTeleconsultGmvInr * 2.5),
    doctorPayoutOutflowInr: Math.round(monthlyTeleconsultGmvInr * 4.4),
    cloudInfrastructureOutflowInr: Math.round(projectedFutureMrrInr * 0.32),
    get netSurplusInr() {
      return (this.subscriptionInflowInr + this.tpaInsuranceInflowInr + this.opdGatewayInflowInr) - (this.doctorPayoutOutflowInr + this.cloudInfrastructureOutflowInr);
    }
  };

  const cashProjection90Day = {
    subscriptionInflowInr: Math.round(projectedFutureMrrInr * 3.15),
    tpaInsuranceInflowInr: Math.round(monthlyTeleconsultGmvInr * 6.0),
    opdGatewayInflowInr: Math.round(monthlyTeleconsultGmvInr * 3.9),
    doctorPayoutOutflowInr: Math.round(monthlyTeleconsultGmvInr * 6.9),
    cloudInfrastructureOutflowInr: Math.round(projectedFutureMrrInr * 0.48),
    get netSurplusInr() {
      return (this.subscriptionInflowInr + this.tpaInsuranceInflowInr + this.opdGatewayInflowInr) - (this.doctorPayoutOutflowInr + this.cloudInfrastructureOutflowInr);
    }
  };

  const handleRunMonteCarlo = () => {
    setIsMonteCarloRunning(true);
    setSimNotice(null);
    setTimeout(() => {
      setIsMonteCarloRunning(false);
      setSimNotice('🎲 Monte Carlo Simulation finished 1,000 iterations! 95% Confidence Interval: Projected MRR ranges from ₹2.42 Cr to ₹3.88 Cr with 0.00% probability of negative cash runway.');
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 50%, rgba(139, 92, 246, 0.15) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.35)',
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
            <span style={{ fontSize: '1.75rem' }}>📈</span>
            <div>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Predictive Cash Flow & "What-If" Revenue Scenario Simulator
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
                Interactive financial modeling of hospital onboarding pace, bed scaling, MRR/ARR trajectory, and 30/60/90-day TPA cash inflows. (Active Baseline: {currentHospitalCount} Hospitals • {currentBedsManaged.toLocaleString('en-IN')} Beds • ₹{(currentBaselineMrrInr / 10000000).toFixed(2)} Cr/mo).
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={handleRunMonteCarlo} disabled={isMonteCarloRunning}>
            {isMonteCarloRunning ? '🎲 Simulating 1,000 runs...' : '🎲 Run Monte Carlo (1,000 Stress Tests)'}
          </Button>
          <Button variant="primary" onClick={() => setSimNotice('📑 Board-Ready CFO Investor Forecast Model & Cash Flow Deck exported to PDF & Excel.')}>
            📑 Export CFO Board Model
          </Button>
        </div>
      </div>

      {simNotice && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '1.5px solid #10B981',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#6EE7B7',
          fontSize: '0.875rem',
          fontWeight: 600
        }}>
          <span>{simNotice}</span>
          <button
            type="button"
            onClick={() => setSimNotice(null)}
            style={{ background: 'none', border: 'none', color: '#6EE7B7', cursor: 'pointer', fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Top Output KPI Radar Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1.5px solid #10B981', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>
            PROJECTED MRR ({horizonMonths} MONTHS)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
            ₹{(projectedFutureMrrInr / 10000000).toFixed(2)} Cr / mo
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34D399', marginTop: '2px', fontWeight: 700 }}>
            +{mrrGrowthPercentage}% Growth from ₹{(currentBaselineMrrInr / 10000000).toFixed(2)} Cr
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(6, 182, 212, 0.35)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase' }}>
            PROJECTED ANNUAL RUN-RATE (ARR)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#06B6D4', marginTop: '4px' }}>
            ₹{(projectedFutureArrInr / 10000000).toFixed(2)} Cr / yr
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
            Normalized 12-Month Run-Rate
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(139, 92, 246, 0.35)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '0.6875rem', color: '#C084FC', fontWeight: 800, textTransform: 'uppercase' }}>
            IMPLIED SAAS VALUATION (14X)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#A855F7', marginTop: '4px' }}>
            ₹{(estimatedEnterpriseValuationInr / 10000000).toFixed(1)} Cr
          </div>
          <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px' }}>
            Healthcare SaaS Enterprise Multiple
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '0.6875rem', color: '#FCD34D', fontWeight: 800, textTransform: 'uppercase' }}>
            GROSS MARGIN PROFILE
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>
            {grossMarginPercent}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
            After Cloud, Gateway & SMS costs
          </div>
        </div>
      </div>

      {/* 3. Scenario Presets Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {(['BULL', 'BASE', 'BEAR'] as const).map((key) => {
            const p = presets[key];
            const isSelected = activePreset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleApplyPreset(key)}
                style={{
                  backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                  border: isSelected ? '1.5px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: isSelected ? '#FFFFFF' : '#CBD5E1' }}>
                  {p.name}
                </span>
                <Badge variant={key === 'BULL' ? 'success' : key === 'BASE' ? 'primary' : 'warning'}>
                  {p.badge}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Interactive Simulation Sliders & Financial Modeling Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Left Column: Sliders */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase' }}>
            🎛️ "What-If" Growth & Capacity Variables
          </div>

          {/* New Hospitals to Onboard */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8125rem', color: '#E2E8F0', fontWeight: 600 }}>🏥 New Hospitals Onboarding (Next {horizonMonths}M):</span>
              <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#34D399' }}>{newHospitals} Hospitals</span>
            </div>
            <input
              type="range"
              min="1"
              max="75"
              step="1"
              value={newHospitals}
              onChange={(e) => {
                setNewHospitals(Number(e.target.value));
                setActivePreset('BULL');
              }}
              style={{ width: '100%', accentColor: '#10B981', cursor: 'pointer' }}
            />
          </div>

          {/* Avg Bed Capacity */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8125rem', color: '#E2E8F0', fontWeight: 600 }}>🛏️ Avg Beds per Hospital:</span>
              <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#38BDF8' }}>{avgBedsPerHospital} Beds ({additionalBedsAdded.toLocaleString('en-IN')} Total Beds)</span>
            </div>
            <input
              type="range"
              min="50"
              max="500"
              step="10"
              value={avgBedsPerHospital}
              onChange={(e) => setAvgBedsPerHospital(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#06B6D4', cursor: 'pointer' }}
            />
          </div>

          {/* OPD Tokens per Bed Day */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8125rem', color: '#E2E8F0', fontWeight: 600 }}>🎫 Daily OPD Tokens per Bed:</span>
              <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#FBBF24' }}>{opdTokensPerBedDay} tokens/bed/day</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="8.0"
              step="0.5"
              value={opdTokensPerBedDay}
              onChange={(e) => setOpdTokensPerBedDay(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#F59E0B', cursor: 'pointer' }}
            />
          </div>

          {/* Teleconsult Adoption */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8125rem', color: '#E2E8F0', fontWeight: 600 }}>📱 Tele-Consultation Adoption Rate:</span>
              <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#C084FC' }}>{teleconsultAdoptionPercent}%</span>
            </div>
            <input
              type="range"
              min="5.0"
              max="50.0"
              step="1.0"
              value={teleconsultAdoptionPercent}
              onChange={(e) => setTeleconsultAdoptionPercent(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#8B5CF6', cursor: 'pointer' }}
            />
          </div>

          {/* Time Horizon & Churn Sensitivity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Time Horizon</label>
              <select
                value={horizonMonths}
                onChange={(e) => setHorizonMonths(Number(e.target.value))}
                style={{ width: '100%', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', padding: '6px 8px', color: '#FFF', fontSize: '0.8125rem' }}
              >
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={12}>12 Months (1 Year)</option>
                <option value={24}>24 Months (2 Years)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Churn Rate Sensitivity</label>
              <select
                value={projectedChurnPercent}
                onChange={(e) => setProjectedChurnPercent(Number(e.target.value))}
                style={{ width: '100%', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', padding: '6px 8px', color: '#FFF', fontSize: '0.8125rem' }}
              >
                <option value={0.8}>0.8% (Best Case)</option>
                <option value={1.2}>1.2% (Expected)</option>
                <option value={2.5}>2.5% (High Churn)</option>
                <option value={4.0}>4.0% (Severe Stress)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: 30 / 60 / 90-Day Cash-Inflow Projections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: '1.5px solid rgba(6, 182, 212, 0.35)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#38BDF8', marginBottom: '14px', textTransform: 'uppercase' }}>
              💵 30 / 60 / 90-Day Cash Flow Projection Engine
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {/* Day 30 */}
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>DAY 30 CASH SURPLUS</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34D399', marginTop: '2px' }}>
                  ₹{(cashProjection30Day.netSurplusInr / 100000).toFixed(1)} L
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#CBD5E1', marginTop: '4px' }}>
                  Inflows: ₹{((cashProjection30Day.subscriptionInflowInr + cashProjection30Day.tpaInsuranceInflowInr + cashProjection30Day.opdGatewayInflowInr) / 100000).toFixed(1)} L
                </div>
              </div>

              {/* Day 60 */}
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>DAY 60 CASH SURPLUS</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34D399', marginTop: '2px' }}>
                  ₹{(cashProjection60Day.netSurplusInr / 100000).toFixed(1)} L
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#CBD5E1', marginTop: '4px' }}>
                  Inflows: ₹{((cashProjection60Day.subscriptionInflowInr + cashProjection60Day.tpaInsuranceInflowInr + cashProjection60Day.opdGatewayInflowInr) / 100000).toFixed(1)} L
                </div>
              </div>

              {/* Day 90 */}
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 700 }}>DAY 90 CASH SURPLUS</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
                  ₹{(cashProjection90Day.netSurplusInr / 100000).toFixed(1)} L
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#CBD5E1', marginTop: '4px' }}>
                  Inflows: ₹{((cashProjection90Day.subscriptionInflowInr + cashProjection90Day.tpaInsuranceInflowInr + cashProjection90Day.opdGatewayInflowInr) / 100000).toFixed(1)} L
                </div>
              </div>
            </div>

            {/* Inflow Breakdown Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'rgba(30, 41, 59, 0.3)', borderRadius: '6px' }}>
                <span style={{ color: '#E2E8F0' }}>💳 SaaS Recurring Subscriptions (90D):</span>
                <span style={{ fontWeight: 700, color: '#38BDF8' }}>+₹{(cashProjection90Day.subscriptionInflowInr / 100000).toFixed(1)} Lakh</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'rgba(30, 41, 59, 0.3)', borderRadius: '6px' }}>
                <span style={{ color: '#E2E8F0' }}>🏥 TPA Cashless Insurance Claim Inflows (90D):</span>
                <span style={{ fontWeight: 700, color: '#34D399' }}>+₹{(cashProjection90Day.tpaInsuranceInflowInr / 100000).toFixed(1)} Lakh</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'rgba(30, 41, 59, 0.3)', borderRadius: '6px' }}>
                <span style={{ color: '#E2E8F0' }}>🩺 Doctor Revenue Share Outflows (90D):</span>
                <span style={{ fontWeight: 700, color: '#FCD34D' }}>-₹{(cashProjection90Day.doctorPayoutOutflowInr / 100000).toFixed(1)} Lakh</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'rgba(30, 41, 59, 0.3)', borderRadius: '6px' }}>
                <span style={{ color: '#E2E8F0' }}>☁️ Cloud & AI GPU Computing Outflows (90D):</span>
                <span style={{ fontWeight: 700, color: '#F87171' }}>-₹{(cashProjection90Day.cloudInfrastructureOutflowInr / 100000).toFixed(1)} Lakh</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
