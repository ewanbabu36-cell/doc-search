import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';

export interface CityCohortElasticity {
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

export interface HyperlocalPincodeNode {
  pincode: string;
  locality: string;
  city: string;
  purchasingPowerIndex: string;
  currentPriceInr: number;
  aiOptimizedPriceInr: number;
  surgeReason: string;
  status: 'ACTIVE_MICRO_PRICE' | 'DEFAULT_CITY_PRICE';
}

export interface SeasonalSurgeRule {
  seasonId: string;
  name: string;
  icon: string;
  monthsActive: string;
  triggerCondition: string;
  discountOrPerk: string;
  recommendedPriceInr: number;
  status: 'SCHEDULED' | 'LIVE_SURGE';
}

export interface CompetitorBenchmark {
  competitorName: string;
  planName: string;
  priceInr: number;
  featuresSummary: string;
  docSearchAdvantage: string;
  pricingStrategy: 'UNDERCUT' | 'PREMIUM_POSITION' | 'MATCH';
}

export interface GeoAbTestExperiment {
  testId: string;
  testCity: string;
  variantA: { priceInr: number; trafficPercent: number; conversions: number; conversionRate: string };
  variantB: { priceInr: number; trafficPercent: number; conversions: number; conversionRate: string };
  pValConfidence: string;
  winnerVariant: 'VARIANT_A' | 'VARIANT_B' | 'INSUFFICIENT_DATA';
  status: 'RUNNING' | 'CONCLUDED';
}

export const AiPriceElasticityRecommenderView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<
    'REGIONAL_COHORTS' | 'HYPERLOCAL_PINCODE' | 'SEASONAL_SURGE' | 'EXIT_INTENT_RADAR' | 'COMPETITOR_BENCHMARK' | 'GEO_AB_TESTING'
  >('REGIONAL_COHORTS');

  const [deployNotice, setDeployNotice] = useState<string | null>(null);

  // 1. City Cohorts State
  const [cohorts, setCohorts] = useState<CityCohortElasticity[]>([
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
  ]);

  // 2. Interactive Price Elasticity Curve Simulator State
  const [testPrice, setTestPrice] = useState<number>(599);
  const baselineSubscribers = 28400;
  const priceRatio = testPrice / 799;
  const elasticityFactor = -2.1;
  const simulatedSubscribers = Math.round(baselineSubscribers * Math.pow(priceRatio, elasticityFactor));
  const simulatedMonthlyGmv = simulatedSubscribers * (testPrice / 12);
  const simulatedNetRevenue = simulatedMonthlyGmv * 0.15;

  // 3. Hyperlocal Pincode State
  const [pincodes, setPincodes] = useState<HyperlocalPincodeNode[]>([
    {
      pincode: '110017',
      locality: 'Saket & Greater Kailash',
      city: 'South Delhi',
      purchasingPowerIndex: 'VERY HIGH (Tier-1+)',
      currentPriceInr: 799,
      aiOptimizedPriceInr: 899,
      surgeReason: 'High demand for doorstep home phlebotomy & senior care specialist priority',
      status: 'ACTIVE_MICRO_PRICE'
    },
    {
      pincode: '110092',
      locality: 'Laxmi Nagar & Anand Vihar',
      city: 'East Delhi',
      purchasingPowerIndex: 'MODERATE (Price Sensitive)',
      currentPriceInr: 799,
      aiOptimizedPriceInr: 549,
      surgeReason: 'Price elasticity -2.8. ₹549 unlocks 55% surge in pharmacy prescription refills',
      status: 'ACTIVE_MICRO_PRICE'
    },
    {
      pincode: '400050',
      locality: 'Bandra West & Khar',
      city: 'Mumbai',
      purchasingPowerIndex: 'VERY HIGH (HNW Zone)',
      currentPriceInr: 799,
      aiOptimizedPriceInr: 999,
      surgeReason: 'High demand for 60-min express medicine delivery & private tele-consult room',
      status: 'ACTIVE_MICRO_PRICE'
    },
    {
      pincode: '560066',
      locality: 'Whitefield & ITPL',
      city: 'Bengaluru',
      purchasingPowerIndex: 'TECH PROFESSIONAL',
      currentPriceInr: 799,
      aiOptimizedPriceInr: 949,
      surgeReason: 'Bundled mental health & 24x7 ergonomic physiotherapy consultation priority',
      status: 'ACTIVE_MICRO_PRICE'
    }
  ]);

  // 4. Seasonal Surge Rules State
  const [seasonalSurges, setSeasonalSurges] = useState<SeasonalSurgeRule[]>([
    {
      seasonId: 'SURGE-MONSOON-01',
      name: 'Monsoon Dengue & Platelet Care Pass',
      icon: '🌧️ 🦟',
      monthsActive: 'July – October (Annual)',
      triggerCondition: 'City Platelet/CBC lab booking volume > 300% of baseline',
      discountOrPerk: 'Unlimited Free Platelet & CBC Tests + 24x7 Pediatrician Emergency Call',
      recommendedPriceInr: 649,
      status: 'LIVE_SURGE'
    },
    {
      seasonId: 'SURGE-WINTER-02',
      name: 'Winter Smog & Respiratory Care Shield',
      icon: '🌫️ 🫁',
      monthsActive: 'November – January (Delhi-NCR & North Zone)',
      triggerCondition: 'City AQI > 350 for 3 consecutive days',
      discountOrPerk: 'Free Spirometry/Chest X-Ray Voucher + Nebulizer Home Delivery at 30% Off',
      recommendedPriceInr: 699,
      status: 'SCHEDULED'
    },
    {
      seasonId: 'SURGE-SUMMER-03',
      name: 'Summer Pediatric Heatwave Hydration Pass',
      icon: '☀️ 👶',
      monthsActive: 'April – June (National)',
      triggerCondition: 'Ambient Temperature > 42°C',
      discountOrPerk: 'Free Pediatric Gastro Tele-Consults + ORS & Electrolyte Care Kit Delivery',
      recommendedPriceInr: 499,
      status: 'SCHEDULED'
    }
  ]);

  // 5. Exit-Intent Flash Discount State
  const [exitIntentEnabled, setExitIntentEnabled] = useState(true);
  const [idleThresholdSecs, setIdleThresholdSecs] = useState(35);
  const [flashDiscountPriceInr, setFlashDiscountPriceInr] = useState(649);
  const [flashTimerMins, setFlashTimerMins] = useState(10);
  const [exitIntentRecoveredCount, setExitIntentRecoveredCount] = useState(1842);

  // 6. Competitor Benchmark State
  const [competitors] = useState<CompetitorBenchmark[]>([
    {
      competitorName: 'Tata 1mg',
      planName: '1mg Care Plan',
      priceInr: 499,
      featuresSummary: 'Pharmacy 7% extra off + 1 free basic lab test',
      docSearchAdvantage: 'DocSearch includes 3 FREE In-Clinic Doctor Consults + Live Video Stream vs 0 in 1mg',
      pricingStrategy: 'PREMIUM_POSITION'
    },
    {
      competitorName: 'Apollo 24|7',
      planName: 'Apollo Circle Membership',
      priceInr: 799,
      featuresSummary: 'Free delivery + 15% pharmacy cashback + priority call',
      docSearchAdvantage: 'Multi-Hospital network (AIIMS, Medanta, Apollo, Fortis) vs Apollo-only single network',
      pricingStrategy: 'MATCH'
    },
    {
      competitorName: 'Practo',
      planName: 'Practo Plus Tele-Pass',
      priceInr: 999,
      featuresSummary: 'Unlimited chat with general physician',
      docSearchAdvantage: 'Super-specialist video consultations (Neuro, Cardio) at ₹599/₹799 vs General GP only',
      pricingStrategy: 'UNDERCUT'
    }
  ]);

  // 7. Geo A/B Testing State
  const [abExperiments, setAbExperiments] = useState<GeoAbTestExperiment[]>([
    {
      testId: 'EXP-GEO-JAIPUR',
      testCity: 'Jaipur & Jodhpur (Rajasthan Cohort)',
      variantA: { priceInr: 599, trafficPercent: 50, conversions: 840, conversionRate: '8.4%' },
      variantB: { priceInr: 649, trafficPercent: 50, conversions: 790, conversionRate: '7.9%' },
      pValConfidence: 'p = 0.024 (97.6% Statistical Confidence)',
      winnerVariant: 'VARIANT_A',
      status: 'RUNNING'
    },
    {
      testId: 'EXP-GEO-PUNE',
      testCity: 'Pune Hinjewadi & Viman Nagar',
      variantA: { priceInr: 799, trafficPercent: 50, conversions: 520, conversionRate: '5.2%' },
      variantB: { priceInr: 999, trafficPercent: 50, conversions: 610, conversionRate: '6.1% (Includes Mental Health)' },
      pValConfidence: 'p = 0.012 (98.8% Statistical Confidence)',
      winnerVariant: 'VARIANT_B',
      status: 'RUNNING'
    }
  ]);

  // Actions
  const handleDeployAllRecommendations = () => {
    setCohorts((prev) =>
      prev.map((c) => ({ ...c, status: 'GEO_ACTIVE', currentPriceInr: c.aiRecommendedPriceInr }))
    );
    setDeployNotice('✓ All AI Dynamic Geo-Pricing recommendations successfully applied across 24 Indian cities!');
  };

  const handleDeploySingleGeoPrice = (cohortId: string, newPrice: number) => {
    setCohorts((prev) =>
      prev.map((c) => (c.id === cohortId ? { ...c, status: 'GEO_ACTIVE', currentPriceInr: newPrice } : c))
    );
    setDeployNotice(`✓ AI Dynamic Geo-Price (₹${newPrice}) successfully deployed to Edge CDN for "${cohortId}"!`);
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
            <span style={{ fontSize: '1.75rem' }}>🤖</span>
            <div>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                AI Dynamic Price Elasticity & City-Wise Geo-Pricing Recommender
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
                XGBoost v4.2 Price Elasticity Engine with Pincode Micro-Pricing, Monsoon Surge Triggers, Exit-Intent Flash Recovery, and Geo A/B Testing.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="primary" onClick={handleDeployAllRecommendations}>
            ⚡ Apply All AI Geo-Pricing Recommendations
          </Button>
        </div>
      </div>

      {deployNotice && (
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
          <span>{deployNotice}</span>
          <button
            type="button"
            onClick={() => setDeployNotice(null)}
            style={{ background: 'none', border: 'none', color: '#6EE7B7', cursor: 'pointer', fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1.5px solid #10B981', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>
            TIER-2 CONVERSION SURGE
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
            +42.8% Surge
          </div>
          <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px' }}>
            Price cut from ₹799 → ₹599 in Tier-2/3
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(6, 182, 212, 0.35)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '0.6875rem', color: '#67E8F9', fontWeight: 800, textTransform: 'uppercase' }}>
            PROJECTED NET GMV EXPANSION
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#06B6D4', marginTop: '4px' }}>
            +₹28.0 L / mo
          </div>
          <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px' }}>
            Combined across 24 Indian cities
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '0.6875rem', color: '#FCD34D', fontWeight: 800, textTransform: 'uppercase' }}>
            EXIT-INTENT CARTS RECOVERED
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>
            {exitIntentRecoveredCount.toLocaleString('en-IN')} Passes
          </div>
          <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px' }}>
            ₹649 Flash AI Trigger (10m timer)
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(139, 92, 246, 0.35)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '0.6875rem', color: '#C084FC', fontWeight: 800, textTransform: 'uppercase' }}>
            ELASTICITY ACCURACY SCORE
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#A855F7', marginTop: '4px' }}>
            98.4%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px' }}>
            Trained on 142K patient purchase journeys
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { id: 'REGIONAL_COHORTS' as const, label: '🏙️ 1. Regional City Cohorts & Curve' },
          { id: 'HYPERLOCAL_PINCODE' as const, label: '📍 2. Pin-Code Micro-Pricing' },
          { id: 'SEASONAL_SURGE' as const, label: '🌧️ 3. Seasonal & Climate Surge' },
          { id: 'EXIT_INTENT_RADAR' as const, label: '🛒 4. Exit-Intent Flash Recovery' },
          { id: 'COMPETITOR_BENCHMARK' as const, label: '🏆 5. Competitor Radar' },
          { id: 'GEO_AB_TESTING' as const, label: '🧪 6. Geo A/B Testing Split' }
        ].map((tab) => {
          const isSelected = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                border: isSelected ? '1.5px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
                color: isSelected ? '#FFFFFF' : '#94A3B8',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: Regional City Cohorts & Elasticity Curve Simulator */}
      {/* ========================================================================= */}
      {activeSubTab === 'REGIONAL_COHORTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Cohorts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
            {cohorts.map((cohort) => {
              const isActive = cohort.status === 'GEO_ACTIVE';
              return (
                <div
                  key={cohort.id}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: isActive ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '14px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#FFFFFF' }}>{cohort.cohortName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>{cohort.citiesIncluded}</div>
                      </div>
                      <Badge variant={isActive ? 'success' : 'warning'}>{cohort.status}</Badge>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '14px 0' }}>
                      <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Current Price</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FCD34D' }}>₹{cohort.currentPriceInr}</div>
                      </div>

                      <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>AI Recommended</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981' }}>₹{cohort.aiRecommendedPriceInr}</div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#CBD5E1', lineHeight: 1.5 }}>
                      💡 <strong>Rationale:</strong> {cohort.rationale}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '10px', color: '#38BDF8' }}>
                      <span>Elasticity: {cohort.elasticityCoefficient}</span>
                      <span>{cohort.predictedConversionSurge}</span>
                    </div>
                  </div>

                  <div>
                    {isActive ? (
                      <Badge variant="success">GEO-PRICING ACTIVE ON CDN</Badge>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={() => handleDeploySingleGeoPrice(cohort.id, cohort.aiRecommendedPriceInr)}
                      >
                        ⚡ Deploy ₹{cohort.aiRecommendedPriceInr} to Edge CDN
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Elasticity Curve Simulator */}
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: '1.5px solid rgba(6, 182, 212, 0.35)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', marginBottom: '8px' }}>
              🧪 Interactive Price Elasticity Curve Simulator
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: '0 0 16px 0' }}>
              Drag the price slider to simulate subscriber volume changes, monthly gross merchandise value (GMV), and DocSearch platform take-rate margin.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.875rem', color: '#E2E8F0', fontWeight: 600 }}>Test Price Point:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34D399' }}>₹{testPrice} / Year</span>
            </div>
            <input
              type="range"
              min="299"
              max="1499"
              step="50"
              value={testPrice}
              onChange={(e) => setTestPrice(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#10B981', cursor: 'pointer', marginBottom: '20px' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>SIMULATED ACTIVE SUBSCRIBERS</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', marginTop: '2px' }}>
                  {simulatedSubscribers.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#34D399' }}>
                  {testPrice < 799 ? `+${Math.round(((simulatedSubscribers - baselineSubscribers) / baselineSubscribers) * 100)}% Conversion Lift` : `${Math.round(((simulatedSubscribers - baselineSubscribers) / baselineSubscribers) * 100)}% Volume Change`}
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>SIMULATED MONTHLY GMV</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>
                  ₹{(simulatedMonthlyGmv / 100000).toFixed(2)} Lakh
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Across all healthcare spend</div>
              </div>

              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>NET PLATFORM TAKE-RATE (15%)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
                  ₹{(simulatedNetRevenue / 100000).toFixed(2)} Lakh/mo
                </div>
                <div style={{ fontSize: '0.75rem', color: '#34D399' }}>Direct SaaS Revenue</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: Pin-Code Hyperlocal Micro-Pricing */}
      {/* ========================================================================= */}
      {activeSubTab === 'HYPERLOCAL_PINCODE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', padding: '18px' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#38BDF8', marginBottom: '6px', textTransform: 'uppercase' }}>
              📍 Pin-Code Level Micro-Demographic Pricing Engine
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: 0 }}>
              AI analyzes local area purchasing power index (PPI), pharmacy density, and hospital proximity at exact 6-digit postal code granularity to dynamically optimize checkout conversion.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {pincodes.map((pin) => (
              <div
                key={pin.pincode}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#FFFFFF' }}>
                      {pin.locality} ({pin.city})
                    </div>
                    <Badge variant="primary">PIN: {pin.pincode}</Badge>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#38BDF8', marginTop: '2px', fontWeight: 600 }}>
                    {pin.purchasingPowerIndex}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '10px', borderRadius: '8px', margin: '12px 0' }}>
                    <div>
                      <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Base City Price:</span>
                      <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#FCD34D' }}>₹{pin.currentPriceInr}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Micro-Optimized Price:</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34D399' }}>₹{pin.aiOptimizedPriceInr}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#CBD5E1', lineHeight: 1.5 }}>
                    🔍 {pin.surgeReason}
                  </div>
                </div>

                <Button
                  variant="secondary"
                  onClick={() => {
                    setPincodes(pincodes.map((p) => (p.pincode === pin.pincode ? { ...p, currentPriceInr: pin.aiOptimizedPriceInr } : p)));
                    setDeployNotice(`⚡ Micro-Price ₹${pin.aiOptimizedPriceInr} locked for Pincode ${pin.pincode} (${pin.locality})!`);
                  }}
                >
                  ⚡ Lock Pincode Price (₹{pin.aiOptimizedPriceInr})
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: Seasonal & Climate Surge Dynamic Pricing */}
      {/* ========================================================================= */}
      {activeSubTab === 'SEASONAL_SURGE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', padding: '18px' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#38BDF8', marginBottom: '6px', textTransform: 'uppercase' }}>
              🌧️ Seasonal Disease Epidemic & Weather Triggers
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: 0 }}>
              Automated triggers adjusting membership benefits and pricing during monsoon dengue waves, severe winter smog (AQI &gt; 350), and extreme summer heatwaves.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {seasonalSurges.map((surge) => {
              const isLive = surge.status === 'LIVE_SURGE';
              return (
                <div
                  key={surge.seasonId}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: isLive ? '1.5px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '14px',
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '14px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.5rem' }}>{surge.icon}</span>
                      <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#FFFFFF' }}>{surge.name}</span>
                      <Badge variant={isLive ? 'success' : 'neutral'}>{surge.status}</Badge>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#38BDF8', marginTop: '4px' }}>
                      Active Window: <strong>{surge.monthsActive}</strong>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#E2E8F0', marginTop: '6px' }}>
                      ⚡ <strong>Auto-Trigger:</strong> {surge.triggerCondition}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#34D399', marginTop: '2px' }}>
                      🎁 <strong>Bundled Benefit:</strong> {surge.discountOrPerk}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Surge Promo Price</div>
                      <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#FCD34D' }}>₹{surge.recommendedPriceInr} / Pass</div>
                    </div>
                    <Button
                      variant={isLive ? 'secondary' : 'primary'}
                      onClick={() => {
                        setSeasonalSurges(seasonalSurges.map((s) => (s.seasonId === surge.seasonId ? { ...s, status: isLive ? 'SCHEDULED' : 'LIVE_SURGE' } : s)));
                        setDeployNotice(`🌧️ "${surge.name}" promo state toggled to ${isLive ? 'SCHEDULED' : 'LIVE_SURGE'}!`);
                      }}
                    >
                      {isLive ? '⏸️ Pause Surge Promo' : '🚀 Activate Seasonal Surge'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: Exit-Intent Flash Recovery */}
      {/* ========================================================================= */}
      {activeSubTab === 'EXIT_INTENT_RADAR' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1.5px solid rgba(245, 158, 11, 0.4)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#FBBF24', textTransform: 'uppercase' }}>
              🛒 Cart Abandonment & Exit-Intent Rules
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: 0 }}>
              Detects users pausing on checkout without clicking Pay or moving their cursor outside viewport to trigger a personalized dynamic flash offer.
            </p>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.8125rem', color: '#E2E8F0' }}>Idle Trigger Threshold:</span>
                <span style={{ fontWeight: 800, color: '#38BDF8' }}>{idleThresholdSecs} seconds</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={idleThresholdSecs}
                onChange={(e) => setIdleThresholdSecs(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#06B6D4' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.8125rem', color: '#E2E8F0' }}>Flash Offer Price:</span>
                <span style={{ fontWeight: 800, color: '#34D399' }}>₹{flashDiscountPriceInr} (Standard: ₹799)</span>
              </div>
              <input
                type="range"
                min="499"
                max="749"
                step="50"
                value={flashDiscountPriceInr}
                onChange={(e) => setFlashDiscountPriceInr(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#10B981' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.8125rem', color: '#E2E8F0' }}>Countdown Urgency Window:</span>
                <span style={{ fontWeight: 800, color: '#F59E0B' }}>{flashTimerMins} Minutes</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={flashTimerMins}
                onChange={(e) => setFlashTimerMins(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#F59E0B' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.8125rem', color: '#FFFFFF', fontWeight: 600 }}>Exit-Intent AI Engine:</span>
              <button
                type="button"
                onClick={() => setExitIntentEnabled(!exitIntentEnabled)}
                style={{
                  backgroundColor: exitIntentEnabled ? '#10B981' : 'rgba(51, 65, 85, 0.6)',
                  color: exitIntentEnabled ? '#000' : '#E2E8F0',
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {exitIntentEnabled ? 'ACTIVE' : 'DISABLED'}
              </button>
            </div>
          </div>

          {/* Live Simulated Modal Preview */}
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', border: '1.5px solid #F59E0B', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem' }}>🎁</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', marginTop: '8px' }}>
              Wait! Special One-Time Offer for You!
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#94A3B8', maxWidth: '320px', margin: '8px 0 16px 0' }}>
              Complete your Gold Family Care Pass right now for only <strong style={{ color: '#34D399', fontSize: '1.125rem' }}>₹{flashDiscountPriceInr}</strong> instead of ₹799!
            </p>
            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid #F59E0B', padding: '6px 14px', borderRadius: '9999px', color: '#FCD34D', fontSize: '0.8125rem', fontWeight: 800, marginBottom: '16px' }}>
              ⏱️ Offer Expires in: {flashTimerMins}:00 Minutes
            </div>
            <Button variant="primary" onClick={() => setExitIntentRecoveredCount(exitIntentRecoveredCount + 1)}>
              ⚡ Claim Flash Discount (₹{flashDiscountPriceInr})
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: Competitor Intelligence Radar */}
      {/* ========================================================================= */}
      {activeSubTab === 'COMPETITOR_BENCHMARK' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', padding: '18px' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#38BDF8', marginBottom: '6px', textTransform: 'uppercase' }}>
              🏆 Real-Time Competitor Pricing Benchmark Radar
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: 0 }}>
              Live monitoring of direct healthcare care plan competitors in India to maintain optimal price-to-value dominance.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {competitors.map((comp) => (
              <div
                key={comp.competitorName}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#FFFFFF' }}>{comp.competitorName}</div>
                    <Badge variant={comp.pricingStrategy === 'UNDERCUT' ? 'success' : comp.pricingStrategy === 'PREMIUM_POSITION' ? 'primary' : 'neutral'}>
                      {comp.pricingStrategy}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{comp.planName}</div>

                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', margin: '10px 0' }}>
                    ₹{comp.priceInr} / Year
                  </div>

                  <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '10px', borderRadius: '8px', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '10px' }}>
                    <strong>Competitor Scope:</strong> {comp.featuresSummary}
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: '#34D399', lineHeight: 1.5 }}>
                    ✨ <strong>DocSearch Advantage:</strong> {comp.docSearchAdvantage}
                  </div>
                </div>

                <Button variant="secondary" onClick={() => setDeployNotice(`📊 Re-aligned strategy against ${comp.competitorName}!`)}>
                  🔄 Refresh Benchmark Live Feed
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 6: Geo A/B Testing Split */}
      {/* ========================================================================= */}
      {activeSubTab === 'GEO_AB_TESTING' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', padding: '18px' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#38BDF8', marginBottom: '6px', textTransform: 'uppercase' }}>
              🧪 Automated 50/50 Geo-Cohort A/B Testing Split Engine
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: 0 }}>
              Randomized A/B traffic split at city level determining the revenue-maximizing price point with verified statistical confidence.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {abExperiments.map((exp) => (
              <div
                key={exp.testId}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(139, 92, 246, 0.35)',
                  borderRadius: '14px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#FFFFFF' }}>{exp.testCity}</span>
                      <Badge variant="primary">{exp.testId}</Badge>
                      <Badge variant="success">{exp.status}</Badge>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#C084FC', marginTop: '2px' }}>
                      Statistical Confidence: <strong>{exp.pValConfidence}</strong>
                    </div>
                  </div>

                  <Badge variant="success">WINNER: {exp.winnerVariant}</Badge>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Variant A */}
                  <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '12px', borderRadius: '10px', border: exp.winnerVariant === 'VARIANT_A' ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>VARIANT A ({exp.variantA.trafficPercent}% Traffic)</div>
                    <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#FFFFFF', marginTop: '2px' }}>₹{exp.variantA.priceInr}</div>
                    <div style={{ fontSize: '0.8125rem', color: '#34D399', marginTop: '4px' }}>
                      Conversions: <strong>{exp.variantA.conversions}</strong> ({exp.variantA.conversionRate})
                    </div>
                  </div>

                  {/* Variant B */}
                  <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '12px', borderRadius: '10px', border: exp.winnerVariant === 'VARIANT_B' ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>VARIANT B ({exp.variantB.trafficPercent}% Traffic)</div>
                    <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#FFFFFF', marginTop: '2px' }}>₹{exp.variantB.priceInr}</div>
                    <div style={{ fontSize: '0.8125rem', color: '#38BDF8', marginTop: '4px' }}>
                      Conversions: <strong>{exp.variantB.conversions}</strong> ({exp.variantB.conversionRate})
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setAbExperiments((prev) =>
                        prev.map((e) => (e.testId === exp.testId ? { ...e, status: 'CONCLUDED' } : e))
                      );
                      setDeployNotice(`🏆 Locked winning price variant for ${exp.testCity} across all users! Experiment status marked CONCLUDED.`);
                    }}
                  >
                    🏆 Lock & Deploy Winner ({exp.winnerVariant === 'VARIANT_A' ? `₹${exp.variantA.priceInr}` : `₹${exp.variantB.priceInr}`})
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
