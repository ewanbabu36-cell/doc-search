import React, { useState, useEffect } from 'react';
import {
  getPromotionalCampaign,
  calculateCampaignMetrics,
  fetchPromotionalCampaignRemote,
  PROMOTIONAL_CAMPAIGN_EVENT,
  type PromotionalCampaignConfig,
  type CampaignCalculatedMetrics
} from '@docsearch/shared-core';

export interface PartnerCampaignShowcasePanelProps {
  onClaimOffer?: () => void;
  className?: string;
  style?: React.CSSProperties;
  compact?: boolean;
  campaign?: PromotionalCampaignConfig;
  metrics?: CampaignCalculatedMetrics;
}

interface BedTierMetrics {
  beds: number;
  label: string;
  legacySoftwareAnnualCost: number;
  monthlyProcurementSavings: number;
  annualTotalBoost: number;
}

const BED_SAVINGS_TIERS: Record<number, BedTierMetrics> = {
  15: {
    beds: 15,
    label: '15 Beds (Nursing Home / Daycare)',
    legacySoftwareAnnualCost: 120000,
    monthlyProcurementSavings: 38000,
    annualTotalBoost: 576000
  },
  50: {
    beds: 50,
    label: '50 Beds (Community Hospital)',
    legacySoftwareAnnualCost: 360000,
    monthlyProcurementSavings: 125000,
    annualTotalBoost: 1860000
  },
  100: {
    beds: 100,
    label: '100 Beds (Multi-Specialty Hospital)',
    legacySoftwareAnnualCost: 720000,
    monthlyProcurementSavings: 260000,
    annualTotalBoost: 3840000
  },
  200: {
    beds: 200,
    label: '200+ Beds (Super-Specialty Hospital)',
    legacySoftwareAnnualCost: 1440000,
    monthlyProcurementSavings: 550000,
    annualTotalBoost: 8040000
  }
};

export const PartnerCampaignShowcasePanel: React.FC<PartnerCampaignShowcasePanelProps> = ({
  onClaimOffer,
  className = '',
  style = {},
  compact = false,
  campaign: propCampaign,
  metrics: propMetrics
}) => {
  const [internalCampaign, setInternalCampaign] = useState<PromotionalCampaignConfig>(
    propCampaign || getPromotionalCampaign()
  );
  const [internalMetrics, setInternalMetrics] = useState<CampaignCalculatedMetrics>(
    propMetrics || calculateCampaignMetrics(internalCampaign)
  );
  const [selectedBeds, setSelectedBeds] = useState<number>(50);

  useEffect(() => {
    if (propCampaign) setInternalCampaign(propCampaign);
  }, [propCampaign]);

  useEffect(() => {
    if (propMetrics) setInternalMetrics(propMetrics);
  }, [propMetrics]);

  useEffect(() => {
    let mounted = true;
    const syncCampaign = async () => {
      try {
        const remote = await fetchPromotionalCampaignRemote();
        if (mounted) {
          setInternalCampaign(remote);
          setInternalMetrics(calculateCampaignMetrics(remote));
        }
      } catch {
        if (mounted) {
          const current = getPromotionalCampaign();
          setInternalCampaign(current);
          setInternalMetrics(calculateCampaignMetrics(current));
        }
      }
    };

    if (!propCampaign) {
      syncCampaign();
      const interval = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return;
        syncCampaign();
      }, 30000);
      if (typeof window !== 'undefined') {
        window.addEventListener(PROMOTIONAL_CAMPAIGN_EVENT, syncCampaign);
      }
      return () => {
        mounted = false;
        clearInterval(interval);
        if (typeof window !== 'undefined') {
          window.removeEventListener(PROMOTIONAL_CAMPAIGN_EVENT, syncCampaign);
        }
      };
    }
    return undefined;
  }, [propCampaign]);

  const activeSavings = BED_SAVINGS_TIERS[selectedBeds] || BED_SAVINGS_TIERS[50]!;

  return (
    <div
      className={`ds-partner-campaign-showcase ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: compact ? '20px' : '28px 32px',
        color: '#F8FAFC',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        overflowY: 'auto',
        maxHeight: '100%',
        ...style
      }}
    >
      {/* 1. Header Branding & System Vision */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06B6D4 0%, #10B981 50%, #3B82F6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              flexShrink: 0
            }}
          >
            🏛️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                DOC SEARCH
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#34D399',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em'
                }}
              >
                100% FREE HOSPITAL OS
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
              National Sovereign Healthcare Infrastructure & Factory-Direct Sourcing Depot
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '4px 10px',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            color: '#34D399',
            fontWeight: 700
          }}
        >
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
          <span>Central Supply Depot Active</span>
        </div>
      </div>

      {/* 2. Top Campaign Hero Card: 100% Free Lifetime ERP Initiative */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 50%, rgba(12, 74, 110, 0.85) 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.5)',
          borderRadius: '16px',
          padding: '20px 22px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5), 0 0 24px rgba(16, 185, 129, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative Ambient Background Glow */}
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3), transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>🎁</span>
            <span
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.25)',
                color: '#6EE7B7',
                border: '1px solid #10B981',
                padding: '2px 10px',
                borderRadius: '9999px',
                fontSize: '0.6875rem',
                fontWeight: 900,
                letterSpacing: '0.05em'
              }}
            >
              ZERO SAAS BILLS • 100% FREE FOREVER
            </span>
          </div>

          {/* Guaranteed Model Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              padding: '3px 10px',
              borderRadius: '8px',
              color: '#38BDF8',
              fontSize: '0.75rem',
              fontWeight: 800
            }}
          >
            <span>🛡️ Lifetime License: ₹0</span>
          </div>
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 6px 0', lineHeight: 1.3 }}>
          Complete Hospital OS is 100% Free Forever <span style={{ color: '#FCD34D', fontSize: '0.9375rem', fontWeight: 700 }}>(Zero Software Fees)</span>
        </h2>
        <p style={{ fontSize: '0.8125rem', color: '#CBD5E1', margin: '0 0 14px 0', lineHeight: 1.5 }}>
          Unlimited Beds, OPD/IPD, OT, ICU, NABL LIMS, Cloud PACS & Ambient Voice AI. Completely free forever — monetized exclusively through direct factory-rate medicine & pathology chemical supply.
        </p>

        {/* 4 Feature Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '14px' }}>
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '6px 10px', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Software Cost</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 900, color: '#34D399' }}>₹0 / Year</div>
          </div>
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '6px 10px', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Bed Capacity</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 900, color: '#38BDF8' }}>Unlimited</div>
          </div>
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '6px 10px', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>B2B Wholesale</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 900, color: '#FBBF24' }}>40%–70% Off</div>
          </div>
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '6px 10px', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>ABDM & NHCX</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 900, color: '#C084FC' }}>Govt Certified</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '130px', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ width: `${internalMetrics.percentageClaimed}%`, height: '100%', backgroundColor: '#10B981', borderRadius: '9999px' }} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6EE7B7' }}>
              {internalMetrics.claimedCount} Facilities Live <span style={{ color: '#38BDF8', fontWeight: 700 }}>(National Network)</span>
            </span>
          </div>

          {onClaimOffer && (
            <button
              type="button"
              onClick={onClaimOffer}
              style={{
                backgroundColor: '#10B981',
                color: '#070C16',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#34D399')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#10B981')}
            >
              <span>Get 100% Free Lifetime ERP</span>
              <span>➔</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. The 3 Monopoly Sourcing & Healthcare Pillars */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>🏆</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Why DocSearch Sourcing Monopoly Beats Traditional SaaS
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700 }}>
            ● Zero Commissions • 100% Data Sovereignty
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          {/* Pillar 1: 100% Free Lifetime ERP */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: '1.5px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.4rem' }}>🏥</span>
              <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', fontSize: '0.625rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                HOSPITAL ERP
              </span>
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>
                100% Free Forever <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>HIS Suite</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px', lineHeight: 1.4 }}>
                IPD Bed Matrix, OT Rostering, ICU Flowsheets, IRDAI NHCX Cashless Pre-Auth & NABL LIMS. Zero annual license fees.
              </div>
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700, marginTop: '4px' }}>
              ✓ Saves ₹2L – ₹15L/yr on IT bills
            </div>
          </div>

          {/* Pillar 2: Factory Direct Medicine Depot */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: '1.5px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.4rem' }}>💊</span>
              <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#6EE7B7', fontSize: '0.625rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                BULK PHARMA DEPOT
              </span>
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#34D399', marginTop: '2px' }}>
                40%–70% Off MRP <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Direct Sourcing</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px', lineHeight: 1.4 }}>
                Factory-direct IV Infusions (NS/RL), Antibiotics, Cardiac/Diabetic Generics & Injectables with batch expiry tracking.
              </div>
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700, marginTop: '4px' }}>
              ✓ Guaranteed 24-hr Doorstep Dispatch
            </div>
          </div>

          {/* Pillar 3: Lab Reagents & Surgical Consumables */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: '1.5px solid rgba(139, 92, 246, 0.4)',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.4rem' }}>🧪</span>
              <span style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#C4B5FD', fontSize: '0.625rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                LAB & OT SUPPLIES
              </span>
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#C4B5FD', marginTop: '2px' }}>
                Smart Auto-GRN <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Zero-Typing Restock</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px', lineHeight: 1.4 }}>
                CBC Lyse & Diluent, LFT Kits, Rapid Cards, Syringes, Nitrile Gloves & Cannulas. 1-Click stock inwarding via barcode.
              </div>
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700, marginTop: '4px' }}>
              ✓ Auto-Reorder on Low Stock Alert
            </div>
          </div>

          {/* Pillar 4: ABDM DHIS & NHCX Cashless */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: '1.5px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.4rem' }}>🇮🇳</span>
              <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#FCD34D', fontSize: '0.625rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                NHA ABDM DHIS
              </span>
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FBBF24', marginTop: '2px' }}>
                ₹500 <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>/ 100 Consults</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px', lineHeight: 1.4 }}>
                Direct Government Cash Incentive under National Health Authority Digital Health Incentive Scheme (DHIS).
              </div>
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700, marginTop: '4px' }}>
              ✓ Direct to Hospital Bank Account (DBT)
            </div>
          </div>
        </div>
      </div>

      {/* 4. Interactive Hospital Bed & Sourcing Savings Slasher */}
      <div
        style={{
          backgroundColor: '#0B132B',
          border: '1.5px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '14px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🧮</span> Interactive Hospital Sourcing & IT Savings Calculator
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Select your facility bed capacity to view estimated annual bottom-line boost:
            </div>
          </div>

          <div
            style={{
              fontSize: '1.15rem',
              fontWeight: 900,
              color: '#34D399',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10B981',
              padding: '6px 14px',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end'
            }}
          >
            <div>+₹{(activeSavings.annualTotalBoost).toLocaleString('en-IN')} <span style={{ fontSize: '0.6875rem', color: '#A7F3D0' }}>/ Year</span></div>
            <div style={{ fontSize: '0.625rem', color: '#6EE7B7', fontWeight: 600 }}>Total Facility Financial Benefit</div>
          </div>
        </div>

        {/* Quick Bed Capacity Selectors */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[15, 50, 100, 200].map((num) => {
            const tier = BED_SAVINGS_TIERS[num]!;
            const isSelected = selectedBeds === num;
            return (
              <button
                key={num}
                type="button"
                onClick={() => setSelectedBeds(num)}
                style={{
                  flex: '1 1 120px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: isSelected ? '#047857' : 'rgba(30, 41, 59, 0.8)',
                  border: isSelected ? '1.5px solid #34D399' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: isSelected ? '#FFFFFF' : '#CBD5E1',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'center'
                }}
              >
                <div>{num} Beds {num === 200 ? '+' : ''}</div>
                <div style={{ fontSize: '0.6875rem', color: isSelected ? '#A7F3D0' : '#94A3B8', fontWeight: 600 }}>
                  Save ₹{(tier.annualTotalBoost / 100000).toFixed(1)}L/yr
                </div>
              </button>
            );
          })}
        </div>

        {/* Real-Time Breakdown Banner */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '8px',
            padding: '10px 12px',
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.75rem'
          }}
        >
          <div>
            <div style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>Software Cost (Practo/Insta)</div>
            <div style={{ color: '#F87171', textDecoration: 'line-through', fontWeight: 700 }}>₹{activeSavings.legacySoftwareAnnualCost.toLocaleString('en-IN')}/yr</div>
            <div style={{ color: '#34D399', fontWeight: 900 }}>₹0 (100% Free)</div>
          </div>
          <div>
            <div style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>Wholesale Medicine Savings</div>
            <div style={{ color: '#38BDF8', fontWeight: 800 }}>~₹{activeSavings.monthlyProcurementSavings.toLocaleString('en-IN')}/mo</div>
            <div style={{ color: '#64748B', fontSize: '0.625rem' }}>(Direct Factory Rate)</div>
          </div>
          <div>
            <div style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>Annual Procurement Gain</div>
            <div style={{ color: '#FBBF24', fontWeight: 900 }}>₹{(activeSavings.monthlyProcurementSavings * 12).toLocaleString('en-IN')}/yr</div>
            <div style={{ color: '#6EE7B7', fontSize: '0.625rem' }}>Direct Margin Retained</div>
          </div>
        </div>
      </div>

      {/* 5. Core Advanced Technology Highlights */}
      <div>
        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
          ⚡ Next-Gen Healthcare Technology Stack
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>🎙️</span>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC' }}>Ambient Clinical AI Scribe</div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Zero-typing voice consultation to FHIR SOAP EMR</div>
            </div>
          </div>

          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>🖨️</span>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC' }}>Hardware Agent Bridge (:18080)</div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Zero-driver ESC/POS thermal & ASTM analyzer sync</div>
            </div>
          </div>

          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>🪪</span>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC' }}>ABHA 2.0 & Insurance OCR</div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>5-second QR intake + instant policy card scan</div>
            </div>
          </div>

          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>📦</span>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC' }}>Automated B2B Auto-GRN</div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Predictive restocking with 1-click PO inwarding</div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Institutional Trust & Compliance Badges */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.6875rem',
          color: '#64748B'
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#94A3B8' }}>
          <span>🇮🇳</span> NHA ABDM Milestone 1-3 Certified
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#94A3B8' }}>
          <span>🔒</span> HIPAA / DISHA Healthcare Compliant
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#94A3B8' }}>
          <span>🛡️</span> 256-Bit Military Grade ECDH Encryption
        </span>
      </div>
    </div>
  );
};
