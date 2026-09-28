import React, { useState, useEffect } from 'react';
import type { PromotionalCampaignConfig, CampaignCalculatedMetrics } from '@docsearch/shared-core';

export interface LaunchOfferFlashTakeoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimOffer: () => void;
  campaign: PromotionalCampaignConfig;
  metrics: CampaignCalculatedMetrics;
}

export const LaunchOfferFlashTakeoverModal: React.FC<LaunchOfferFlashTakeoverModalProps> = ({
  isOpen,
  onClose,
  onClaimOffer,
  campaign,
  metrics
}) => {
  const [activeTab, setActiveTab] = useState<'OFFER' | 'REFERRAL'>('OFFER');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999999,
        backgroundColor: 'rgba(5, 10, 24, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.25s ease-out',
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 50%, #022c22 100%)',
          border: '2px solid rgba(16, 185, 129, 0.45)',
          borderRadius: '24px',
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.85), 0 0 50px rgba(16, 185, 129, 0.25)',
          color: '#F8FAFC',
          overflow: 'hidden',
          position: 'relative',
          margin: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top Glow Ribbon */}
        <div
          style={{
            height: '4px',
            background: 'linear-gradient(90deg, #10B981, #06B6D4, #8B5CF6, #F59E0B)'
          }}
        />

        {/* Header Bar with Cancel / Skip Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 28px 12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '999px',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                color: '#6EE7B7',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  boxShadow: '0 0 10px #10B981'
                }}
              />
              ⚡ Exclusive Launch Initiative
            </span>
            <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
              First 100 Healthcare Partners Only
            </span>
          </div>

          {/* Cancel / Skip Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Skip and explore landing page"
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#CBD5E1',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.color = '#F87171';
              e.currentTarget.style.borderColor = '#EF4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#CBD5E1';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            <span>Skip to Website</span>
            <span style={{ fontSize: '1rem', fontWeight: 900 }}>✕</span>
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '28px 32px 32px' }}>
          {/* Main Title & Subtitle */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1
              style={{
                margin: '0 0 10px',
                fontSize: '2rem',
                fontWeight: 900,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #FFFFFF 30%, #6EE7B7 70%, #38BDF8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Claim ₹0 Early-Adopter Access to India&apos;s Next-Gen Healthcare Platform
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: '1rem',
                color: '#CBD5E1',
                maxWidth: '720px',
                marginLeft: 'auto',
                marginRight: 'auto',
                lineHeight: 1.5
              }}
            >
              Transform your Hospital, Clinic, Pathology Lab, or Pharmacy with ABDM M1-M3, AI Scribe, EMR, LIS, and FEFO POS.
              <strong style={{ color: '#34D399' }}> 100% Free Launch Access (Free for Now — Secure Your Spot Before Standard Subscriptions Begin) </strong> under the Founder Early-Bird Allocation.
            </p>
          </div>

          {/* Offer & Referral Switcher Tabs */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '24px'
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('OFFER')}
              style={{
                padding: '10px 22px',
                borderRadius: '12px',
                border: activeTab === 'OFFER' ? '2px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: activeTab === 'OFFER' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                color: activeTab === 'OFFER' ? '#6EE7B7' : '#94A3B8',
                fontWeight: 800,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>🎁 1. ₹0 Early-Adopter Launch Access (Free for Now)</span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#065F46',
                  color: '#A7F3D0'
                }}
              >
                100% OFF
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('REFERRAL')}
              style={{
                padding: '10px 22px',
                borderRadius: '12px',
                border: activeTab === 'REFERRAL' ? '2px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: activeTab === 'REFERRAL' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                color: activeTab === 'REFERRAL' ? '#FCD34D' : '#94A3B8',
                fontWeight: 800,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>💰 2. Partner Referral Bounty</span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#78350F',
                  color: '#FDE68A'
                }}
              >
                Up to ₹10,000 / Ref
              </span>
            </button>
          </div>

          {activeTab === 'OFFER' ? (
            /* TAB 1: LAUNCH OFFER & SCARCITY ENGINE */
            <div>
              {/* Urgency & Scarcity Progress Bar */}
              <div
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '16px',
                  padding: '18px 24px',
                  marginBottom: '24px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#CBD5E1', fontWeight: 700 }}>
                      🔥 Claimed Founder Allocations:
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: '#34D399', fontWeight: 900 }}>
                      {metrics.claimedCount} / {campaign.targetSeats} Seats ({metrics.percentageClaimed}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '999px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${metrics.percentageClaimed}%`,
                        background: 'linear-gradient(90deg, #10B981, #06B6D4)',
                        borderRadius: '999px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#F87171', fontWeight: 700, marginTop: '6px' }}>
                    ⚠️ Only {metrics.remainingSeats} free seats left across India
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ⏳ Offer Window Closes In:
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '4px',
                      fontSize: '1.125rem',
                      fontWeight: 900,
                      color: '#F59E0B'
                    }}
                  >
                    <span>{metrics.daysLeft}d</span>:
                    <span>{String(metrics.hoursLeft).padStart(2, '0')}h</span>:
                    <span>{String(metrics.minutesLeft).padStart(2, '0')}m</span>:
                    <span>{String(metrics.secondsLeft).padStart(2, '0')}s</span>
                  </div>
                </div>
              </div>

              {/* 3 Core Value Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '16px',
                  marginBottom: '28px'
                }}
              >
                <div
                  style={{
                    backgroundColor: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    gap: '12px'
                  }}
                >
                  <span style={{ fontSize: '1.75rem' }}>🎁</span>
                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#FFFFFF' }}>
                      ₹0 Monthly Subscription
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '4px', lineHeight: 1.4 }}>
                      Standard fee of <s style={{ color: '#EF4444' }}>₹4,999/mo</s> permanently waived for Early-Bird partners.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    gap: '12px'
                  }}
                >
                  <span style={{ fontSize: '1.75rem' }}>⚡</span>
                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#FFFFFF' }}>
                      Full Clinical Tech Suite
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '4px', lineHeight: 1.4 }}>
                      LIS with Bidirectional Analyzers, OPD AI Scribe, Bed Census, and FEFO Pharmacy POS included.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    gap: '12px'
                  }}
                >
                  <span style={{ fontSize: '1.75rem' }}>🛡️</span>
                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#FFFFFF' }}>
                      Zero Lock-In & Free Setup
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '4px', lineHeight: 1.4 }}>
                      Dedicated onboarding manager, 24x7 WhatsApp technical assistance, and ABDM M1-M3 certification.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: PARTNER REFERRAL BOUNTY PROGRAM */
            <div style={{ marginBottom: '28px' }}>
              <div
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '1.5px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '1.125rem', fontWeight: 900, color: '#FCD34D', marginBottom: '4px' }}>
                  🤝 Grow India&apos;s Largest Healthcare Network & Earn Direct Payouts
                </div>
                <div style={{ fontSize: '0.875rem', color: '#E2E8F0' }}>
                  Refer peer clinics, pathology laboratories, and pharmacies to DOC SEARCH and receive direct bank payouts per verified facility!
                </div>
              </div>

              {/* 3 Referral Bounty Tiers */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '16px',
                  marginBottom: '16px'
                }}
              >
                {/* Doctor Tier */}
                <div
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    border: '2px solid #38BDF8',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🩺</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Doctor / Clinic Referral
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF', margin: '6px 0' }}>
                    ₹10,000
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.4 }}>
                    Disbursed directly into your account for every verified Doctor / OPD clinic onboarded.
                  </div>
                </div>

                {/* Pathology Tier */}
                <div
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    border: '2px solid #A855F7',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔬</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#C084FC', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Pathology Lab Referral
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF', margin: '6px 0' }}>
                    ₹5,000
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.4 }}>
                    Disbursed directly into your account for every verified Pathology / Diagnostic Centre onboarded.
                  </div>
                </div>

                {/* Pharmacy Tier */}
                <div
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    border: '2px solid #10B981',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💊</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Pharmacy / Medical Store
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF', margin: '6px 0' }}>
                    ₹5,000
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.4 }}>
                    Disbursed directly into your account for every verified Chemist / Hospital Pharmacy onboarded.
                  </div>
                </div>
              </div>

              {/* T&C Notice */}
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#94A3B8',
                  textAlign: 'center',
                  padding: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px'
                }}
              >
                * <strong>Terms & Conditions Apply</strong>: Referral bounty disbursed via NEFT/IMPS after the referred healthcare facility successfully completes valid license verification (NABL / State Medical Council / Drug License Form 20/21) and first 30 days of active clinical platform usage.
              </div>
            </div>
          )}

          {/* Bottom Action CTAs */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <button
              type="button"
              onClick={onClaimOffer}
              style={{
                width: '100%',
                maxWidth: '540px',
                padding: '16px 28px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)',
                color: '#FFFFFF',
                fontSize: '1.125rem',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4), 0 0 20px rgba(5, 150, 105, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                letterSpacing: '-0.01em',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(16, 185, 129, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
              }}
            >
              <span>🎁 Claim Free Founder Seat & Register Facility Now</span>
              <span style={{ fontSize: '1.25rem' }}>➔</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '6px 12px'
              }}
            >
              No thanks, continue exploring the platform
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
