import React, { useState } from 'react';
import { Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface AbVariant {
  id: string;
  label: string; // "Variant A (Control)" or "Variant B (Challenger)"
  name: string;
  priceInr: number;
  trafficAllocationPercent: number;
  impressions: number;
  conversions: number;
  conversionRatePercent: number;
  totalGmvInr: number;
  netSaaSRevenueInr: number;
  isWinning?: boolean;
}

export interface AbExperiment {
  id: string;
  title: string;
  hypothesis: string;
  status: 'RUNNING' | 'WINNER_DECLARED' | 'PAUSED';
  statisticalSignificance: string;
  sampleSize: number;
  variants: AbVariant[];
  winningVariantId?: string;
}

const INITIAL_EXPERIMENTS: AbExperiment[] = [
  {
    id: 'EXP-GOLD-799-VS-899',
    title: 'Gold Care Pass: ₹799 vs ₹899 Revenue Maximization Test',
    hypothesis: 'Testing whether a ₹100 price increase with "Priority Chamber Token" badge yields higher total net SaaS revenue despite a marginal conversion dip.',
    status: 'RUNNING',
    statisticalSignificance: '99.2% Bayesian Significance (p < 0.01)',
    sampleSize: 28400,
    winningVariantId: 'VAR-B',
    variants: [
      {
        id: 'VAR-A',
        label: 'Variant A (Control)',
        name: 'Gold Family Care Pass',
        priceInr: 799,
        trafficAllocationPercent: 50,
        impressions: 14200,
        conversions: 1846,
        conversionRatePercent: 13.0,
        totalGmvInr: 1474954,
        netSaaSRevenueInr: 221243,
        isWinning: false
      },
      {
        id: 'VAR-B',
        label: 'Variant B (Challenger 🚀)',
        name: 'Gold Family Health Shield + Priority Token',
        priceInr: 899,
        trafficAllocationPercent: 50,
        impressions: 14200,
        conversions: 1732,
        conversionRatePercent: 12.2,
        totalGmvInr: 1557068,
        netSaaSRevenueInr: 233560,
        isWinning: true
      }
    ]
  },
  {
    id: 'EXP-SILVER-NAMING',
    title: 'Silver Essential: Name Framing & Clinic Home Pass Test',
    hypothesis: 'Testing if mentioning "Free Home Lab Sample" in plan title lifts checkout conversion for individual working professionals.',
    status: 'RUNNING',
    statisticalSignificance: '96.8% Statistical Significance',
    sampleSize: 16800,
    winningVariantId: 'VAR-SILVER-B',
    variants: [
      {
        id: 'VAR-SILVER-A',
        label: 'Variant A (Control)',
        name: 'Silver Essential Pass',
        priceInr: 299,
        trafficAllocationPercent: 50,
        impressions: 8400,
        conversions: 1176,
        conversionRatePercent: 14.0,
        totalGmvInr: 351624,
        netSaaSRevenueInr: 52743,
        isWinning: false
      },
      {
        id: 'VAR-SILVER-B',
        label: 'Variant B (Challenger 🚀)',
        name: 'Silver Home Lab & Doctor Care Pass',
        priceInr: 349,
        trafficAllocationPercent: 50,
        impressions: 8400,
        conversions: 1310,
        conversionRatePercent: 15.6,
        totalGmvInr: 457190,
        netSaaSRevenueInr: 68578,
        isWinning: true
      }
    ]
  }
];

export const PlanAbTestingEngineView: React.FC = () => {
  const [experiments, setExperiments] = useState<AbExperiment[]>(INITIAL_EXPERIMENTS);
  const [deployNotice, setDeployNotice] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [newExpTitle, setNewExpTitle] = useState('Platinum VIP: ₹1,499 vs ₹1,799 Margin Test');
  const [newExpVarAPrice, setNewExpVarAPrice] = useState(1499);
  const [newExpVarBPrice, setNewExpVarBPrice] = useState(1799);

  const handleDeclareWinner = (expId: string, winningVariantId: string) => {
    setExperiments((prev) =>
      prev.map((exp) => {
        if (exp.id !== expId) return exp;
        return {
          ...exp,
          status: 'WINNER_DECLARED',
          variants: exp.variants.map((v) => ({
            ...v,
            trafficAllocationPercent: v.id === winningVariantId ? 100 : 0
          }))
        };
      })
    );
    setDeployNotice(`🏆 Winner declared for "${expId}"! 100% of patient traffic automatically routed to ${winningVariantId} on edge routers.`);
    setTimeout(() => setDeployNotice(null), 5000);
  };

  const handleCreateExperiment = () => {
    const created: AbExperiment = {
      id: `EXP-${Date.now()}`,
      title: newExpTitle,
      hypothesis: `Testing pricing optimization between ₹${newExpVarAPrice} and ₹${newExpVarBPrice}.`,
      status: 'RUNNING',
      statisticalSignificance: 'Collecting baseline telemetry (0% sample)',
      sampleSize: 0,
      winningVariantId: 'VAR-B',
      variants: [
        {
          id: 'VAR-A',
          label: 'Variant A (Control)',
          name: 'Platinum Chronic Senior Pass',
          priceInr: newExpVarAPrice,
          trafficAllocationPercent: 50,
          impressions: 0,
          conversions: 0,
          conversionRatePercent: 0,
          totalGmvInr: 0,
          netSaaSRevenueInr: 0,
          isWinning: false
        },
        {
          id: 'VAR-B',
          label: 'Variant B (Challenger)',
          name: 'Platinum 24/7 Dedicated Care Concierge',
          priceInr: newExpVarBPrice,
          trafficAllocationPercent: 50,
          impressions: 0,
          conversions: 0,
          conversionRatePercent: 0,
          totalGmvInr: 0,
          netSaaSRevenueInr: 0,
          isWinning: true
        }
      ]
    };
    setExperiments((prev) => [created, ...prev]);
    setIsCreateModalOpen(false);
    setDeployNotice('✓ New A/B split experiment launched live on Edge Router!');
    setTimeout(() => setDeployNotice(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>📊</span>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
              Live A/B Testing Engine for Plan Names & Pricing
            </h2>
            <Badge variant="primary">Multi-Armed Bandit • Bayesian Engine</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
            Run live randomized 50/50 split experiments on pricing (₹799 vs ₹899) and value propositions to maximize conversion velocity and net SaaS revenue.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          style={{
            backgroundColor: '#EAB308',
            color: '#000',
            fontWeight: 900,
            boxShadow: '0 4px 14px rgba(234, 179, 8, 0.4)'
          }}
        >
          ➕ Launch New A/B Experiment
        </Button>
      </div>

      {deployNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {deployNotice}
        </div>
      )}

      {/* Top 3 Metric Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>
            WINNING NET REVENUE LIFT
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#10B981', margin: '4px 0', fontFamily: 'monospace' }}>
            + 5.57% Net Lift
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            ₹899 variant generated ₹82,114 higher GMV despite 0.8% lower checkout count
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
            TOTAL TESTED AUDIENCE
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#F8FAFC', margin: '4px 0', fontFamily: 'monospace' }}>
            45,200 Patients
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            Randomized deterministic cookie hashes
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
            BAYESIAN DECISION CONFIDENCE
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#FCD34D', margin: '4px 0', fontFamily: 'monospace' }}>
            99.2% Statistical Power
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            Ready for automated 100% winner rollout
          </span>
        </div>
      </div>

      {/* Experiments Cards */}
      {experiments.map((exp) => {
        const isWinnerDeclared = exp.status === 'WINNER_DECLARED';
        const winningVar = exp.variants.find((v) => v.id === exp.winningVariantId);

        return (
          <div
            key={exp.id}
            style={{
              backgroundColor: '#0F172A',
              border: isWinnerDeclared ? '1.5px solid #10B981' : '1px solid #334155',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* Exp Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, color: '#F8FAFC' }}>
                    {exp.title}
                  </h3>
                  <Badge variant={isWinnerDeclared ? 'success' : 'primary'}>
                    {exp.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
                  {exp.hypothesis}
                </p>
                <span style={{ fontSize: '0.75rem', color: '#FCD34D', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                  ⚡ {exp.statisticalSignificance} • Sample Size: {exp.sampleSize.toLocaleString('en-IN')} Visitors
                </span>
              </div>

              {!isWinnerDeclared && winningVar && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDeclareWinner(exp.id, winningVar.id)}
                  style={{
                    backgroundColor: '#10B981',
                    color: '#070C16',
                    fontWeight: 900,
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  🏆 Auto-Rollout 100% Traffic to {winningVar.label.split(' ')[0]} {winningVar.label.split(' ')[1]}
                </Button>
              )}
            </div>

            {/* Variants Side-by-Side Comparison Table */}
            <TableContainer style={{ border: '1px solid #334155', borderRadius: '12px' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test Variant</TableHead>
                    <TableHead>Tested Price</TableHead>
                    <TableHead>Edge Split</TableHead>
                    <TableHead>Impressions</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>Conversion Rate</TableHead>
                    <TableHead>Realized Gross GMV</TableHead>
                    <TableHead style={{ textAlign: 'right' }}>Net SaaS Revenue (15%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exp.variants.map((v) => {
                    const isWinner = v.isWinning;

                    return (
                      <TableRow key={v.id} style={{ backgroundColor: isWinner ? 'rgba(16, 185, 129, 0.08)' : 'transparent' }}>
                        <TableCell>
                          <div>
                            <strong style={{ color: isWinner ? '#10B981' : '#F8FAFC' }}>{v.label}</strong>
                            <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>{v.name}</span>
                          </div>
                        </TableCell>

                        <TableCell style={{ fontWeight: 900, color: '#FCD34D', fontFamily: 'monospace', fontSize: '1rem' }}>
                          ₹{v.priceInr} / yr
                        </TableCell>

                        <TableCell style={{ fontWeight: 700, color: '#38BDF8' }}>
                          {v.trafficAllocationPercent}% Traffic
                        </TableCell>

                        <TableCell style={{ color: '#CBD5E1', fontFamily: 'monospace' }}>
                          {v.impressions.toLocaleString('en-IN')}
                        </TableCell>

                        <TableCell style={{ fontWeight: 800, color: '#F8FAFC', fontFamily: 'monospace' }}>
                          {v.conversions.toLocaleString('en-IN')}
                        </TableCell>

                        <TableCell style={{ fontWeight: 800, color: isWinner ? '#10B981' : '#CBD5E1' }}>
                          {v.conversionRatePercent.toFixed(1)}%
                        </TableCell>

                        <TableCell style={{ fontWeight: 800, color: isWinner ? '#10B981' : '#CBD5E1', fontFamily: 'monospace' }}>
                          ₹{v.totalGmvInr.toLocaleString('en-IN')}
                        </TableCell>

                        <TableCell style={{ textAlign: 'right', fontWeight: 900, color: isWinner ? '#10B981' : '#38BDF8', fontFamily: 'monospace', fontSize: '1rem' }}>
                          ₹{v.netSaaSRevenueInr.toLocaleString('en-IN')}
                          {isWinner && <span style={{ color: '#10B981', fontSize: '0.75rem', marginLeft: '6px' }}>🏆 WINNER</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        );
      })}

      {/* Create Experiment Modal */}
      {isCreateModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '2px solid #EAB308',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '560px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                ➕ Launch New A/B Split Experiment
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 800, marginBottom: '4px' }}>EXPERIMENT TITLE</label>
                <input
                  type="text"
                  value={newExpTitle}
                  onChange={(e) => setNewExpTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#FFF' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 800, marginBottom: '4px' }}>VARIANT A PRICE (₹)</label>
                  <input
                    type="number"
                    value={newExpVarAPrice}
                    onChange={(e) => setNewExpVarAPrice(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#FCD34D', fontWeight: 800 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 800, marginBottom: '4px' }}>VARIANT B PRICE (₹)</label>
                  <input
                    type="number"
                    value={newExpVarBPrice}
                    onChange={(e) => setNewExpVarBPrice(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid #EAB308', borderRadius: '6px', color: '#10B981', fontWeight: 800 }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button variant="secondary" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateExperiment}
                style={{ backgroundColor: '#EAB308', color: '#000', fontWeight: 900 }}
              >
                🚀 Deploy Experiment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
