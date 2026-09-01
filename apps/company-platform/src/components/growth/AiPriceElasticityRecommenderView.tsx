import React, { useState } from 'react';
import { Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface CityCohortElasticity {
  id: string;
  cohortName: string;
  tier: 'TIER_1_METRO' | 'TIER_2_GROWTH' | 'CYBER_HUB';
  citiesIncluded: string;
  currentPriceInr: number;
  aiRecommendedPriceInr: number;
  currentDropoffRate: string;
  predictedConversionSurge: string;
  projectedGmvImpact: string;
  elasticityCoefficient: number;
  rationale: string;
  status: 'PENDING_DEPLOYMENT' | 'GEO_ACTIVE';
}

const INITIAL_COHORTS: CityCohortElasticity[] = [
  {
    id: 'COHORT-TIER2',
    cohortName: 'Tier-2 & Tier-3 Growth Cities',
    tier: 'TIER_2_GROWTH',
    citiesIncluded: 'Lucknow, Jaipur, Patna, Indore, Nagpur, Guwahati, Ranchi',
    currentPriceInr: 799,
    aiRecommendedPriceInr: 599,
    currentDropoffRate: '64.2% Checkout Drop-off',
    predictedConversionSurge: '+ 42.8% Conversion Surge',
    projectedGmvImpact: '+ ₹ 18.6 Lakhs / mo Net Growth',
    elasticityCoefficient: -2.45,
    rationale: 'High price sensitivity threshold at ₹799. Lowering price to ₹599 unlocks the massive family health adoption flywheel and multiplies repeat pharmacy refills.',
    status: 'PENDING_DEPLOYMENT'
  },
  {
    id: 'COHORT-TIER1',
    cohortName: 'Tier-1 Metros (High Purchasing Power)',
    tier: 'TIER_1_METRO',
    citiesIncluded: 'Delhi-NCR, Mumbai MMR, Bengaluru',
    currentPriceInr: 799,
    aiRecommendedPriceInr: 799,
    currentDropoffRate: '21.4% Checkout Drop-off',
    predictedConversionSurge: 'Optimal Baseline (0% Churn)',
    projectedGmvImpact: 'Maximizes 84.5% SaaS Margin',
    elasticityCoefficient: -0.82,
    rationale: 'Pricing is inelastic. Focus on value additions (Priority Doctor Chamber Tokens & Express 60-min delivery) rather than discounts.',
    status: 'GEO_ACTIVE'
  },
  {
    id: 'COHORT-CYBER',
    cohortName: 'Corporate & Cyber Technology Hubs',
    tier: 'CYBER_HUB',
    citiesIncluded: 'Hyderabad Cyberabad, Pune Hinjewadi, Whitefield BLR',
    currentPriceInr: 799,
    aiRecommendedPriceInr: 999,
    currentDropoffRate: '14.8% Checkout Drop-off',
    predictedConversionSurge: '+ 21.0% Net EBITDA Growth',
    projectedGmvImpact: '+ ₹ 9.4 Lakhs / mo Net Expansion',
    elasticityCoefficient: -0.48,
    rationale: 'High willingness to pay for premium 24/7 tele-mental health, nutritionist passes, and home sample collection.',
    status: 'PENDING_DEPLOYMENT'
  }
];

export const AiPriceElasticityRecommenderView: React.FC = () => {
  const [cohorts, setCohorts] = useState<CityCohortElasticity[]>(INITIAL_COHORTS);
  const [deployNotice, setDeployNotice] = useState<string | null>(null);

  // Interactive Price Elasticity Curve Simulator
  const [testPrice, setTestPrice] = useState<number>(599);

  // Elasticity Simulation Math
  const baselineSubscribers = 28400; // Gold Plan baseline
  const priceRatio = testPrice / 799;
  const elasticityFactor = -2.1;
  const simulatedSubscribers = Math.round(baselineSubscribers * Math.pow(priceRatio, elasticityFactor));
  const simulatedMonthlyGmv = simulatedSubscribers * (testPrice / 12);
  const simulatedNetRevenue = simulatedMonthlyGmv * 0.15; // 15% take-rate

  const handleDeployGeoPrice = (cohortId: string, newPrice: number) => {
    setCohorts((prev) =>
      prev.map((c) => (c.id === cohortId ? { ...c, status: 'GEO_ACTIVE', currentPriceInr: newPrice } : c))
    );
    setDeployNotice(`✓ AI Dynamic Geo-Price (₹${newPrice}) successfully deployed to Edge CDN for "${cohortId}"!`);
    setTimeout(() => setDeployNotice(null), 5000);
  };

  const handleDeployAllRecommendations = () => {
    setCohorts((prev) =>
      prev.map((c) => ({ ...c, status: 'GEO_ACTIVE', currentPriceInr: c.aiRecommendedPriceInr }))
    );
    setDeployNotice('✓ All AI Dynamic Geo-Pricing recommendations successfully applied across 24 Indian cities!');
    setTimeout(() => setDeployNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>🤖</span>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
              AI Dynamic Price Elasticity & City-Wise Geo-Pricing Recommender
            </h2>
            <Badge variant="primary">XGBoost Model v4.2 • 98.4% Confidence</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
            Automated machine learning intelligence analyzing purchasing power, checkout abandonment, and elasticity thresholds to maximize adoption and ARR.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleDeployAllRecommendations}
          style={{
            backgroundColor: '#10B981',
            color: '#070C16',
            fontWeight: 900,
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
          }}
        >
          ⚡ Apply All AI Geo-Pricing Recommendations
        </Button>
      </div>

      {deployNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {deployNotice}
        </div>
      )}

      {/* Top 3 Summary Highlight Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '14px', padding: '18px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>
            TIER-2 CONVERSION BOOST
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10B981', margin: '4px 0', fontFamily: 'monospace' }}>
            + 42.8% Surge
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            Price reduction from ₹799 $\rightarrow$ ₹599 in Lucknow, Jaipur, Patna
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #06B6D4', borderRadius: '14px', padding: '18px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#67E8F9', fontWeight: 800, textTransform: 'uppercase' }}>
            PROJECTED NET GMV EXPANSION
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#06B6D4', margin: '4px 0', fontFamily: 'monospace' }}>
            + ₹ 28.0 L / mo
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            High volume adoption drives pharmacy refills & lab orders
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #F59E0B', borderRadius: '14px', padding: '18px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#FCD34D', fontWeight: 800, textTransform: 'uppercase' }}>
            ELASTICITY ACCURACY SCORE
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F59E0B', margin: '4px 0', fontFamily: 'monospace' }}>
            98.4% Verified
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            Based on 48,200 active patient checkout cohorts
          </span>
        </div>
      </div>

      {/* City Cohort AI Recommendations Table */}
      <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
              📍 Regional City Cohort Price Elasticity Matrix
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Gold Family Care Pass Dynamic Geo-Fence Rules
            </span>
          </div>
          <Badge variant="success">Edge Geo-IP DNS Enabled</Badge>
        </div>

        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Target Regional Cohort</TableHead>
                <TableHead>Current Price</TableHead>
                <TableHead>AI Recommended Price</TableHead>
                <TableHead>Predicted Conversion Impact</TableHead>
                <TableHead>Projected GMV Delta</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Geo-Deploy Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cohorts.map((c) => {
                const isTier2 = c.tier === 'TIER_2_GROWTH';
                const isDeployActive = c.status === 'GEO_ACTIVE';

                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ color: '#F8FAFC', fontSize: '0.875rem' }}>{c.cohortName}</strong>
                          <Badge variant={isTier2 ? 'warning' : 'primary'}>{c.tier}</Badge>
                        </div>
                        <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                          {c.citiesIncluded}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: '#CBD5E1', display: 'block', marginTop: '4px', fontStyle: 'italic' }}>
                          💡 {c.rationale}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell style={{ fontWeight: 800, color: '#94A3B8', fontSize: '0.9375rem', fontFamily: 'monospace' }}>
                      ₹{c.currentPriceInr} / yr
                    </TableCell>

                    <TableCell style={{ fontWeight: 900, color: isTier2 ? '#10B981' : '#38BDF8', fontSize: '1.0625rem', fontFamily: 'monospace' }}>
                      ₹{c.aiRecommendedPriceInr} / yr
                    </TableCell>

                    <TableCell>
                      <span style={{ fontWeight: 800, color: isTier2 ? '#10B981' : '#38BDF8' }}>
                        {c.predictedConversionSurge}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>
                        {c.currentDropoffRate}
                      </span>
                    </TableCell>

                    <TableCell style={{ fontWeight: 800, color: '#FCD34D' }}>
                      {c.projectedGmvImpact}
                    </TableCell>

                    <TableCell style={{ textAlign: 'right' }}>
                      {isDeployActive ? (
                        <Badge variant="success">✓ Geo-Active (₹{c.currentPriceInr})</Badge>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleDeployGeoPrice(c.id, c.aiRecommendedPriceInr)}
                          style={{
                            backgroundColor: '#EAB308',
                            color: '#000',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            padding: '4px 10px'
                          }}
                        >
                          ⚡ Deploy ₹{c.aiRecommendedPriceInr}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Interactive Elasticity Curve Simulator */}
      <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '16px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
              🧪 Interactive Price Elasticity Curve Simulator
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Drag slider to simulate subscriber volume, GMV, and net revenue at different retail price points
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>Simulated Price:</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981', fontFamily: 'monospace' }}>
              ₹{testPrice} / year
            </span>
          </div>
        </div>

        {/* Slider */}
        <div style={{ marginBottom: '16px' }}>
          <input
            type="range"
            min="399"
            max="1299"
            step="50"
            value={testPrice}
            onChange={(e) => setTestPrice(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#10B981', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#64748B', marginTop: '4px' }}>
            <span>₹399 (Mass Adoption)</span>
            <span>₹599 (Tier-2 Sweet Spot 🎯)</span>
            <span>₹799 (Metro Standard)</span>
            <span>₹999 (Cyber Premium)</span>
            <span>₹1299 (VIP Chronic)</span>
          </div>
        </div>

        {/* Live Simulator Forecast Outputs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '12px' }}>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>PREDICTED SUBSCRIBERS</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px', fontFamily: 'monospace' }}>
              {simulatedSubscribers.toLocaleString('en-IN')} families
            </div>
            <span style={{ fontSize: '0.6875rem', color: testPrice <= 599 ? '#10B981' : '#94A3B8' }}>
              {testPrice <= 599 ? '🚀 +40%+ Volume surge' : 'Baseline metro rate'}
            </span>
          </div>

          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '12px' }}>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>MONTHLY GROSS GMV</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981', marginTop: '2px', fontFamily: 'monospace' }}>
              ₹{(simulatedMonthlyGmv / 100000).toFixed(1)} Lakhs / mo
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#CBD5E1' }}>Care Pass revenue flow</span>
          </div>

          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '12px' }}>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>NET SAAS COMMISSION (15%)</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px', fontFamily: 'monospace' }}>
              ₹{(simulatedNetRevenue / 100000).toFixed(1)} Lakhs / mo
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#CBD5E1' }}>DocSearch net take-rate</span>
          </div>
        </div>
      </div>
    </div>
  );
};
