import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';
import { useGlobalLocale } from '../common/GlobalCurrencyLocaleContext.js';

export const EbitdaWhatIfSimulatorView: React.FC = () => {
  const { formatMoney } = useGlobalLocale();

  // Scenario Simulation Sliders
  const [hospitalsMonthly, setHospitalsMonthly] = useState<number>(25); // 10 to 100
  const [takeRatePercent, setTakeRatePercent] = useState<number>(15.2); // 8% to 25%
  const [opdGrowthRate, setOpdGrowthRate] = useState<number>(20); // 5% to 50%
  const [opexSavingsPercent, setOpexSavingsPercent] = useState<number>(15); // 0% to 40%

  // Baseline figures
  const baseMonthlyGmv = 177600000; // ₹ 17.76 Cr
  const baseMonthlyOpex = 2350000; // ₹ 23.5 Lakhs

  // Computed Projections
  const hospitalGrowthMultiplier = 1 + (hospitalsMonthly - 25) * 0.015;
  const opdGrowthMultiplier = 1 + (opdGrowthRate - 20) * 0.02;

  const simulatedMonthlyGmv = baseMonthlyGmv * hospitalGrowthMultiplier * opdGrowthMultiplier;
  const simulatedMonthlyNetRevenue = simulatedMonthlyGmv * (takeRatePercent / 100);
  const simulatedMonthlyOpex = baseMonthlyOpex * (1 - opexSavingsPercent / 100);
  const simulatedMonthlyEbitda = simulatedMonthlyNetRevenue - simulatedMonthlyOpex;
  const simulatedEbitdaMargin = ((simulatedMonthlyEbitda / simulatedMonthlyNetRevenue) * 100).toFixed(1);

  const annualizedSimulatedArr = simulatedMonthlyNetRevenue * 12;
  const annualizedSimulatedGmv = simulatedMonthlyGmv * 12;
  const annualizedFreeCashFlow = simulatedMonthlyEbitda * 12;

  // 12-Month Projections Array
  const months = ['M1 (Current)', 'M2', 'M3', 'M4', 'M5', 'M6 (H1)', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12 (FY27)'];
  const trajectoryData = months.map((m, idx) => {
    const compoundingFactor = Math.pow(1 + (opdGrowthRate / 100) / 12, idx);
    const monthGmv = simulatedMonthlyGmv * compoundingFactor;
    const monthNet = monthGmv * (takeRatePercent / 100);
    const monthOpex = simulatedMonthlyOpex * (1 + idx * 0.01);
    const monthEbitda = monthNet - monthOpex;
    return {
      month: m,
      gmv: monthGmv,
      netRevenue: monthNet,
      ebitda: monthEbitda
    };
  });

  const maxEbitda = Math.max(...trajectoryData.map((d) => d.ebitda));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              🎯 Interactive "What-If" EBITDA Scenario Simulator & 12-Month Trajectory
            </h3>
            <Badge variant="primary">Real-Time Financial Modeling</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Adjust hospital acquisition rate, take-rate commissions, and OPEX savings to project forward-looking profitability and ARR multiples
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setHospitalsMonthly(25);
            setTakeRatePercent(15.2);
            setOpdGrowthRate(20);
            setOpexSavingsPercent(15);
          }}
          style={{ fontWeight: 700 }}
        >
          🔄 Reset Simulation Defaults
        </Button>
      </div>

      {/* Sliders Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '14px',
          backgroundColor: '#0F172A',
          border: '1px solid #334155',
          borderRadius: '14px',
          padding: '18px'
        }}
      >
        {/* Slider 1: Hospital Additions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800 }}>
            <span style={{ color: '#E2E8F0' }}>🏥 Monthly Hospital Additions</span>
            <span style={{ color: '#10B981' }}>+{hospitalsMonthly} / month</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={hospitalsMonthly}
            onChange={(e) => setHospitalsMonthly(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#10B981', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Base: 25 hospital nodes / mo</span>
        </div>

        {/* Slider 2: Take-Rate % */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800 }}>
            <span style={{ color: '#E2E8F0' }}>💰 Average Take-Rate Margin</span>
            <span style={{ color: '#06B6D4' }}>{takeRatePercent.toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min="8"
            max="25"
            step="0.5"
            value={takeRatePercent}
            onChange={(e) => setTakeRatePercent(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#06B6D4', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Blended OPD, LIMS, IPD, Pharmacy</span>
        </div>

        {/* Slider 3: OPD & LIMS Growth */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800 }}>
            <span style={{ color: '#E2E8F0' }}>📈 Patient Consultation Growth</span>
            <span style={{ color: '#F59E0B' }}>+{opdGrowthRate}% MoM</span>
          </div>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={opdGrowthRate}
            onChange={(e) => setOpdGrowthRate(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#F59E0B', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Organic doctor discovery traffic</span>
        </div>

        {/* Slider 4: OPEX Savings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800 }}>
            <span style={{ color: '#E2E8F0' }}>📉 Cloud OPEX Optimization</span>
            <span style={{ color: '#A78BFA' }}>{opexSavingsPercent}% Savings</span>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            step="5"
            value={opexSavingsPercent}
            onChange={(e) => setOpexSavingsPercent(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#A78BFA', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Automated autoscaling efficiency</span>
        </div>
      </div>

      {/* Recalculated Forecast KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>
            PROJECTED ANNUAL ARR
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
            {formatMoney(annualizedSimulatedArr)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>
            From {formatMoney(simulatedMonthlyNetRevenue)} / mo Net
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #06B6D4', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#67E8F9', fontWeight: 800, textTransform: 'uppercase' }}>
            PROJECTED EBITDA MARGIN
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#06B6D4', marginTop: '2px' }}>
            {simulatedEbitdaMargin}% Margin
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>
            {formatMoney(simulatedMonthlyEbitda)} / mo Operating Profit
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #F59E0B', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#FCD34D', fontWeight: 800, textTransform: 'uppercase' }}>
            ANNUAL FREE CASH FLOW
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F59E0B', marginTop: '2px' }}>
            {formatMoney(annualizedFreeCashFlow)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>
            Zero venture debt or equity reliance
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
            GROSS NETWORK GMV RUN-RATE
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>
            {formatMoney(annualizedSimulatedGmv)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>
            100% Pan-India healthcare flow
          </span>
        </div>
      </div>

      {/* 12-Month Projected Trajectory Visual Chart */}
      <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '14px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
              📊 12-Month Projected Forward EBITDA & Net Revenue Trajectory
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
              Month-over-month compounding based on current simulator parameters
            </span>
          </div>
          <Badge variant="success">● Cash-Positive Curve</Badge>
        </div>

        {/* CSS/SVG Bar Projection Stream */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${months.length}, 1fr)`, gap: '8px', alignItems: 'flex-end', height: '180px', paddingTop: '20px', borderBottom: '1px solid #334155' }}>
          {trajectoryData.map((d) => {
            const barHeightPercent = Math.max(15, Math.round((d.ebitda / maxEbitda) * 100));

            return (
              <div
                key={d.month}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '0.625rem', color: '#10B981', fontWeight: 800 }}>
                  {formatMoney(Math.round(d.ebitda / 100000))}L
                </span>

                <div
                  style={{
                    width: '100%',
                    height: `${barHeightPercent}%`,
                    backgroundColor: '#10B981',
                    backgroundImage: 'linear-gradient(180deg, #34D399 0%, #059669 100%)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.4s ease',
                    boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)'
                  }}
                  title={`${d.month}: Net Revenue ${formatMoney(d.netRevenue)} • EBITDA ${formatMoney(d.ebitda)}`}
                />
              </div>
            );
          })}
        </div>

        {/* Month Labels */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${months.length}, 1fr)`, gap: '8px', marginTop: '8px', textAlign: 'center' }}>
          {trajectoryData.map((d) => (
            <span key={d.month} style={{ fontSize: '0.625rem', color: '#94A3B8', fontWeight: 700 }}>
              {d.month.split(' ')[0]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
