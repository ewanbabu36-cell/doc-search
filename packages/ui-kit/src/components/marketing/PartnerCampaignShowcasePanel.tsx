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
  const [selectedClinicsCount, setSelectedClinicsCount] = useState<number>(3);

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

  // Referral Income Formula: ₹10,000 per Clinic
  const calculatedIncome = selectedClinicsCount * 10000;

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
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 50%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              flexShrink: 0
            }}
          >
            🩺
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                DOC SEARCH
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(6, 182, 212, 0.2)',
                  color: '#38BDF8',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em'
                }}
              >
                MEDISPHERE OS
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '1px' }}>
              National Healthcare Infrastructure & Partner Growth Network
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
          <span>Live Partner Network Active</span>
        </div>
      </div>

      {/* 2. Top Campaign Hero Card: Founder Launch 100 Grant */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.9) 0%, rgba(15, 23, 42, 0.95) 50%, rgba(6, 78, 59, 0.9) 100%)',
          border: '1.5px solid rgba(245, 158, 11, 0.45)',
          borderRadius: '16px',
          padding: '20px 22px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5), 0 0 24px rgba(245, 158, 11, 0.15)',
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
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25), transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>🔥</span>
            <span
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.25)',
                color: '#FCD34D',
                border: '1px solid #F59E0B',
                padding: '2px 10px',
                borderRadius: '9999px',
                fontSize: '0.6875rem',
                fontWeight: 900,
                letterSpacing: '0.05em'
              }}
            >
              FOUNDER LAUNCH 100 GRANT
            </span>
          </div>

          {/* Countdown Clock */}
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
              fontWeight: 800,
              fontFamily: 'monospace'
            }}
          >
            <span>⏳ Closes in:</span>
            <span>{internalMetrics.formattedTimeLeft}</span>
          </div>
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 6px 0', lineHeight: 1.3 }}>
          100% Free 1-Year {internalCampaign.planName} <span style={{ color: '#FBBF24', fontSize: '1rem', fontWeight: 700 }}>(Worth ₹{internalCampaign.originalPriceInr.toLocaleString('en-IN')})</span>
        </h2>
        <p style={{ fontSize: '0.8125rem', color: '#CBD5E1', margin: '0 0 14px 0', lineHeight: 1.5 }}>
          {internalCampaign.subtitle} Instant onboarding with direct B2B channel partner referral rewards on inviting neighboring clinics.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          {/* Progress / Claimed Seats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '130px', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ width: `${internalMetrics.percentageClaimed}%`, height: '100%', backgroundColor: '#10B981', borderRadius: '9999px' }} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6EE7B7' }}>
              {internalMetrics.claimedCount} / {internalCampaign.targetSeats} Claimed <span style={{ color: '#F87171', fontWeight: 700 }}>(Only {internalMetrics.remainingSeats} Left!)</span>
            </span>
          </div>

          {/* Claim Button */}
          {onClaimOffer && (
            <button
              type="button"
              onClick={onClaimOffer}
              style={{
                backgroundColor: '#10B981',
                color: '#070C16',
                border: 'none',
                padding: '7px 16px',
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
              <span>Claim Free Seat</span>
              <span>➔</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Partner Incentive Plans & Bounties Catalog */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>💰</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Partner Cash Incentives & Referral Bounties
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700 }}>
            ● Direct Weekly UPI / Bank Payouts
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          {/* Doctor OPD Clinic Bounty */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: '1.5px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '12px',
              padding: '14px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.4rem' }}>🩺</span>
              <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', fontSize: '0.625rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                DOCTOR OPD
              </span>
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>
                ₹10,000 <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Cash Bounty</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px', lineHeight: 1.4 }}>
                For every Doctor OPD Clinic onboarded + Doctor locks in 100% Free Launch Access (Free for Now — Secure ₹0 Plan Before Paid Tiers Roll Out!)
              </div>
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>✓ Instant ₹10k Payout • </span>
              <span style={{ color: '#F59E0B', fontWeight: 800 }}>⚡ Limited Launch Cohort</span>
            </div>
          </div>

          {/* Multi-Specialty Hospital Grant */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: '1.5px solid rgba(139, 92, 246, 0.4)',
              borderRadius: '12px',
              padding: '14px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.4rem' }}>🏥</span>
              <span style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#C4B5FD', fontSize: '0.625rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                HOSPITAL HIS
              </span>
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#C4B5FD', marginTop: '2px' }}>
                ₹25,000 <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Cash Bounty</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px', lineHeight: 1.4 }}>
                For Multispecialty Hospitals, Nursing Homes & Inpatient Facilities with Ward/Bed Census.
              </div>
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700, marginTop: '4px' }}>
              ✓ Full ADT, OT, ICU & Nurse Station Setup
            </div>
          </div>

          {/* Pharmacy & Lab Bounty */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: '1.5px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '12px',
              padding: '14px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.4rem' }}>💊</span>
              <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#6EE7B7', fontSize: '0.625rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                PHARMACY & LAB
              </span>
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34D399', marginTop: '2px' }}>
                ₹5,000 <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Cash Bounty</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px', lineHeight: 1.4 }}>
                Retail Chemists, Medical Stores, Pathology Labs & Diagnostic Centers.
              </div>
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700, marginTop: '4px' }}>
              ✓ Barcode GST POS & NABL LIMS Included
            </div>
          </div>

          {/* ABDM DHIS Government Incentive */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: '1.5px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '12px',
              padding: '14px 14px',
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
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FBBF24', marginTop: '2px' }}>
                ₹500 <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>/ 100 Consults</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px', lineHeight: 1.4 }}>
                Direct Government Cash Incentive under National Health Authority Digital Health Incentive Scheme.
              </div>
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700, marginTop: '4px' }}>
              ✓ Direct to Hospital Bank Account (DBT)
            </div>
          </div>
        </div>
      </div>

      {/* 4. Interactive Referral Income Projector */}
      <div
        style={{
          backgroundColor: '#0B132B',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '14px',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC' }}>
              🧮 Interactive Partner Referral Income Calculator
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              How many doctor clinics or hospitals can you introduce this month?
            </div>
          </div>

          <div
            style={{
              fontSize: '1.15rem',
              fontWeight: 900,
              color: '#34D399',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10B981',
              padding: '4px 12px',
              borderRadius: '8px'
            }}
          >
            ₹{calculatedIncome.toLocaleString('en-IN')} <span style={{ fontSize: '0.6875rem', color: '#A7F3D0' }}>Direct Cash</span>
          </div>
        </div>

        {/* Quick Referral Count Selectors */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[1, 2, 3, 5, 10].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setSelectedClinicsCount(num)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: selectedClinicsCount === num ? '#0284C7' : 'rgba(30, 41, 59, 0.8)',
                border: selectedClinicsCount === num ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                color: selectedClinicsCount === num ? '#FFFFFF' : '#CBD5E1',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {num} {num === 1 ? 'Clinic' : 'Clinics'} (₹{(num * 10000).toLocaleString('en-IN')})
            </button>
          ))}
        </div>
      </div>

      {/* 5. Core Enterprise Clinical Features Grid */}
      <div>
        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
          ✨ Next-Gen Healthcare Stack Highlights
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>🎙️</span>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC' }}>Ambient Voice Scribe 3.0</div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Zero-typing consultation to SOAP notes</div>
            </div>
          </div>

          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>⚡</span>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC' }}>5-Sec ABDM Scan & Share</div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Zero queue front desk QR intake</div>
            </div>
          </div>

          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>🛏️</span>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC' }}>Live Bed Census & Wards</div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Real-time IPD, ICU & OT scheduling</div>
            </div>
          </div>

          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>🧾</span>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC' }}>Schedule H1 & GST POS</div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Automated CDSCO compliance register</div>
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
