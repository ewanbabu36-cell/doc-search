import React, { useState, useMemo } from 'react';
import type { HospitalStaffUser } from '../auth/HospitalStaffLogin.js';

export interface PartnerOffersRewardsHubProps {
  currentUser?: HospitalStaffUser | undefined;
  onNavigateToModule?: ((moduleKey: string) => void) | undefined;
}

interface OfferItem {
  id: string;
  category: 'DOCTOR' | 'PHARMACY' | 'HOSPITAL' | 'ABDM';
  title: string;
  tag: string;
  tagBg: string;
  tagColor: string;
  reward: string;
  rewardSubtitle: string;
  description: string;
  highlights: string[];
  terms: string;
  icon: string;
  actionText: string;
}

interface ReferralRecord {
  id: string;
  facilityName: string;
  type: string;
  doctorName: string;
  contactNumber: string;
  referredDate: string;
  status: 'PAYOUT_COMPLETED' | 'VERIFICATION_PENDING' | 'DOCUMENTS_SUBMITTED';
  payoutAmount: number;
}

export const PartnerOffersRewardsHub: React.FC<PartnerOffersRewardsHubProps> = ({
  currentUser
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'DOCTOR' | 'PHARMACY' | 'HOSPITAL' | 'ABDM'>('ALL');
  
  // Interactive Calculator States
  const [calcDoctors, setCalcDoctors] = useState(3);
  const [calcPharmacies, setCalcPharmacies] = useState(2);
  const [calcHospitals, setCalcHospitals] = useState(1);

  const referralCode = `DOC-REF-${currentUser?.id || 'PARTNER-2026'}`;
  const referralUrl = `http://localhost:5175?ref=${referralCode}&view=register`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsAppShare = (customText?: string) => {
    const defaultText = `🏥 *DOC SEARCH PARTNER INVITATION*\n\nDear Doctor / Healthcare Director,\n\nYou have been invited to claim a *100% Free Lifetime Enterprise Grant* on India's Next-Gen ABDM 2.0 & AI-powered Healthcare Platform (DOC SEARCH).\n\n✨ Key Highlights:\n- Ambient AI Voice Consultation Scribe & CDSS\n- ABDM M1-M3 Instant Integration\n- Digital Prescription Dispatch via WhatsApp\n- ₹0 Lifetime License Cost for Early Adopters\n\nClaim your facility seat now:\n👉 ${referralUrl}\n\nReferral Code: *${referralCode}*`;
    const message = encodeURIComponent(customText || defaultText);
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
  };

  // Sample tracked referrals
  const [referrals] = useState<ReferralRecord[]>([
    {
      id: 'REF-2026-081',
      facilityName: 'Dr. Sharma Heart Care Clinic',
      type: 'Doctor OPD Clinic',
      doctorName: 'Dr. Arun Sharma (Cardiologist)',
      contactNumber: '+91 98765 12340',
      referredDate: '2026-09-02',
      status: 'PAYOUT_COMPLETED',
      payoutAmount: 10000
    },
    {
      id: 'REF-2026-082',
      facilityName: 'Sanjeevani Medicos & Wellness',
      type: 'Retail Pharmacy',
      doctorName: 'Vikram Joshi (Proprietor)',
      contactNumber: '+91 98111 54321',
      referredDate: '2026-09-05',
      status: 'PAYOUT_COMPLETED',
      payoutAmount: 5000
    },
    {
      id: 'REF-2026-083',
      facilityName: 'Sunrise Infertility & Maternity Centre',
      type: 'Multispecialty Hospital',
      doctorName: 'Dr. Priya Mehta (Director)',
      contactNumber: '+91 97222 99881',
      referredDate: '2026-09-10',
      status: 'VERIFICATION_PENDING',
      payoutAmount: 25000
    },
    {
      id: 'REF-2026-084',
      facilityName: 'CarePlus Diagnostic & Scan Hub',
      type: 'Diagnostic Centre',
      doctorName: 'Dr. K. Ramachandran',
      contactNumber: '+91 99000 11223',
      referredDate: '2026-09-11',
      status: 'DOCUMENTS_SUBMITTED',
      payoutAmount: 5000
    }
  ]);

  const offers: OfferItem[] = [
    {
      id: 'offer-doctor-bounty',
      category: 'DOCTOR',
      title: 'Refer a Doctor OPD Clinic ➔ Get ₹10,000 Direct Cash',
      tag: '🩺 POPULAR OPD BOUNTY',
      tagBg: 'rgba(56, 189, 248, 0.15)',
      tagColor: '#38BDF8',
      reward: '₹10,000',
      rewardSubtitle: 'Direct Cash Transfer / Bank UPI',
      description: 'Help private doctors, general physicians and polyclinics modernize their practice with India’s most responsive EMR and AI Voice Scribe.',
      highlights: [
        'Instant ₹10,000 direct transfer upon regulatory license onboarding',
        'Referred doctor receives 100% Free Lifetime OPD software grant',
        'Ambient AI Voice Consultation Scribe included at ₹0 tier',
        'Automated WhatsApp Rx dispatch and ABDM Scan & Share integration'
      ],
      terms: 'Doctor facility must hold a valid clinical establishment registration or state medical council license. Payout released within 48 hours of verification.',
      icon: '🩺',
      actionText: 'Invite Doctor on WhatsApp'
    },
    {
      id: 'offer-pharmacy-bounty',
      category: 'PHARMACY',
      title: 'Refer a Retail Pharmacy or Lab ➔ Get ₹5,000 Direct Cash',
      tag: '💊 PHARMACY & LAB BOUNTY',
      tagBg: 'rgba(16, 185, 129, 0.15)',
      tagColor: '#10B981',
      reward: '₹5,000',
      rewardSubtitle: 'Direct Cash per Registered Store',
      description: 'Connect local chemist stores, hospital pharmacy counters, and pathology labs to the nationwide DOC SEARCH prescription fulfillment grid.',
      highlights: [
        '₹5,000 cash credit directly to your partner settlement bank account',
        'Pharmacy receives Schedule H1 Auto-Log and Barcode POS Billing suite',
        'Zero commission on direct doctor-routed digital e-prescriptions',
        'Real-time batch expiry tracking and automated re-ordering alerts'
      ],
      terms: 'Requires valid Form 20/21 Drug License or NABL accreditation for pathology centres. Instant credit upon verified inaugural bill generation.',
      icon: '💊',
      actionText: 'Invite Pharmacy on WhatsApp'
    },
    {
      id: 'offer-hospital-grant',
      category: 'HOSPITAL',
      title: 'Onboard a Multispecialty Hospital ➔ Get ₹25,000 Bounty',
      tag: '🏥 ENTERPRISE HOSPITAL GRANT',
      tagBg: 'rgba(139, 92, 246, 0.15)',
      tagColor: '#A78BFA',
      reward: '₹25,000',
      rewardSubtitle: 'Enterprise Institutional Bounty',
      description: 'Introduce nursing homes, surgical hospitals, or diagnostic chains to our complete NABH-ready IPD, OT, ICU, and Bed Census system.',
      highlights: [
        'High-ticket ₹25,000 cash bounty for 20+ bed healthcare facilities',
        'Hospital receives dedicated enterprise deployment support & training',
        'Full OT scheduling, ICU telemetry, Blood Bank and TPA Insurance module',
        'Real-time Executive Command Center with zero-trust clinical governance'
      ],
      terms: 'Facility must have 10+ operational beds and active Clinical Establishment Certificate. Payout executed post formal deployment signoff.',
      icon: '🏥',
      actionText: 'Invite Hospital Director'
    },
    {
      id: 'offer-abdm-dhis',
      category: 'ABDM',
      title: 'ABDM 2.0 Digital Health Incentive Scheme (DHIS)',
      tag: '🇮🇳 GOVT DHIS SUBSIDY',
      tagBg: 'rgba(245, 158, 11, 0.15)',
      tagColor: '#FBBF24',
      reward: '₹20 to ₹500',
      rewardSubtitle: 'Per 100 ABHA Linked Consultations',
      description: 'Official National Health Authority (NHA) digital health financial incentive credited directly from the Ministry of Health to your hospital bank account.',
      highlights: [
        'Direct government cash subsidies credited directly via NHA escrow',
        '₹20 to ₹50 per scan-and-share token generation',
        'DOC SEARCH is pre-certified for ABDM Milestone 1, 2, and 3',
        'Zero integration fees: All ABHA bridges and FHIR converters included free'
      ],
      terms: 'Subject to official NHA guidelines and state health mission validation. DOC SEARCH provides end-to-end automated documentation for DHIS claims.',
      icon: '🇮🇳',
      actionText: 'View ABDM DHIS Roadmap'
    }
  ];

  const filteredOffers = useMemo(() => {
    if (selectedFilter === 'ALL') return offers;
    return offers.filter((o) => o.category === selectedFilter);
  }, [offers, selectedFilter]);

  // Projected earnings calculation
  const totalProjected = useMemo(() => {
    return calcDoctors * 10000 + calcPharmacies * 5000 + calcHospitals * 25000;
  }, [calcDoctors, calcPharmacies, calcHospitals]);

  // Summary stats
  const totalPaidOut = referrals
    .filter((r) => r.status === 'PAYOUT_COMPLETED')
    .reduce((acc, curr) => acc + curr.payoutAmount, 0);

  const pendingPayout = referrals
    .filter((r) => r.status !== 'PAYOUT_COMPLETED')
    .reduce((acc, curr) => acc + curr.payoutAmount, 0);

  return (
    <div
      style={{
        padding: '28px 32px',
        maxWidth: '1360px',
        margin: '0 auto',
        color: '#FFFFFF',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      {/* 1. HERO BANNER WITH REFERRAL DESK */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
          border: '1.5px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '20px',
          padding: '32px 36px',
          marginBottom: '32px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px'
          }}
        >
          <div style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  color: '#FCD34D',
                  border: '1px solid #F59E0B',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  letterSpacing: '0.04em'
                }}
              >
                🎁 PARTNER REWARDS & PROMOTIONAL HUB
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#6EE7B7',
                  border: '1px solid #10B981',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}
              >
                ⚡ Live Bounties Active
              </span>
            </div>

            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                margin: '0 0 10px 0'
              }}
            >
              Healthcare Partner Growth & Offer Desk
            </h1>

            <p style={{ fontSize: '0.9375rem', color: '#94A3B8', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Earn direct bank cash bounties up to <strong style={{ color: '#FCD34D' }}>₹25,000 per facility</strong> by inviting doctors, clinics, pharmacies, and hospitals. Every facility you refer receives 100% free lifetime access under the <strong style={{ color: '#38BDF8' }}>Founder Launch 100 Grant</strong>.
            </p>

            {/* Quick Referral Link Container */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '8px 12px',
                maxWidth: '620px'
              }}
            >
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 700 }}>YOUR EXCLUSIVE INVITE LINK</div>
                <div
                  style={{
                    fontSize: '0.8125rem',
                    color: '#38BDF8',
                    fontFamily: 'monospace',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {referralUrl}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                title="Copy Referral Link"
                aria-label="Copy Referral Link"
                style={{
                  backgroundColor: copied ? '#10B981' : 'rgba(255, 255, 255, 0.08)',
                  border: copied ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{copied ? '✓ Copied' : '📋 Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleWhatsAppShare()}
                style={{
                  backgroundColor: '#25D366',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
                }}
              >
                <span>📲 Share WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Partner Stats Card */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '20px 24px',
              minWidth: '280px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
              Partner Financial Summary
            </div>

            <div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>TOTAL CASH BOUNTIES CREDITED</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10B981' }}>
                ₹{totalPaidOut.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>PENDING REVIEW</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#F59E0B' }}>
                  ₹{pendingPayout.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>FACILITIES</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#38BDF8' }}>
                  {referrals.length} Onboarded
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.6875rem',
                color: '#6EE7B7',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>🛡️</span>
              <span>Direct Bank Escrow Payouts</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTER BUTTONS FOR OFFERS */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {(['ALL', 'DOCTOR', 'PHARMACY', 'HOSPITAL', 'ABDM'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setSelectedFilter(filter)}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                backgroundColor: selectedFilter === filter ? '#0284C7' : 'rgba(255, 255, 255, 0.05)',
                border: selectedFilter === filter ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                color: selectedFilter === filter ? '#FFFFFF' : '#94A3B8',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {filter === 'ALL' && '✨ All Offers & Bounties'}
              {filter === 'DOCTOR' && '🩺 Doctor OPD (₹10k)'}
              {filter === 'PHARMACY' && '💊 Pharmacy & Lab (₹5k)'}
              {filter === 'HOSPITAL' && '🏥 Hospital Grant (₹25k)'}
              {filter === 'ABDM' && '🇮🇳 ABDM DHIS Scheme'}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('docsearch_open_referral_showcase'))}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid #F59E0B',
            color: '#FCD34D',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>📽️ Open Full-Screen Cinematic Showcase</span>
        </button>
      </div>

      {/* 3. ACTIVE OFFERS GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}
      >
        {filteredOffers.map((offer) => (
          <div
            key={offer.id}
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div>
              {/* Header Tag & Reward Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span
                  style={{
                    backgroundColor: offer.tagBg,
                    color: offer.tagColor,
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '0.6875rem',
                    fontWeight: 800
                  }}
                >
                  {offer.tag}
                </span>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981' }}>{offer.reward}</div>
                  <div style={{ fontSize: '0.625rem', color: '#94A3B8' }}>{offer.rewardSubtitle}</div>
                </div>
              </div>

              {/* Title & Description */}
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                {offer.title}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#94A3B8', lineHeight: 1.4, margin: '0 0 16px 0' }}>
                {offer.description}
              </p>

              {/* Key Highlights */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {offer.highlights.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.75rem', color: '#CBD5E1' }}>
                    <span style={{ color: '#10B981', flexShrink: 0 }}>✓</span>
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms & Action Button */}
            <div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B', lineHeight: 1.3, marginBottom: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px' }}>
                * {offer.terms}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#E2E8F0',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  📋 Copy Link
                </button>
                <button
                  type="button"
                  onClick={() => handleWhatsAppShare(`🏥 *Invitation for ${offer.title}*\n\nClaim your special healthcare partner onboarding grant here:\n👉 ${referralUrl}\n\nReferral Code: *${referralCode}*`)}
                  style={{
                    backgroundColor: '#10B981',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>📲 WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. INTERACTIVE EARNINGS ESTIMATOR */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1.5px solid rgba(14, 165, 233, 0.3)',
          borderRadius: '20px',
          padding: '28px 32px',
          marginBottom: '40px',
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr',
          gap: '32px',
          alignItems: 'center'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🧮</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
              Interactive Monthly Bounty Calculator
            </h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: '0 0 20px 0' }}>
            Adjust the sliders below to estimate your monthly cash bounty payout based on expected network referrals.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Slider 1: Doctors */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span style={{ color: '#CBD5E1' }}>🩺 Doctor OPD Clinics (₹10,000 each):</span>
                <strong style={{ color: '#38BDF8' }}>{calcDoctors} Clinics (₹{(calcDoctors * 10000).toLocaleString('en-IN')})</strong>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={calcDoctors}
                onChange={(e) => setCalcDoctors(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#38BDF8' }}
              />
            </div>

            {/* Slider 2: Pharmacies */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span style={{ color: '#CBD5E1' }}>💊 Pharmacies & Pathology Labs (₹5,000 each):</span>
                <strong style={{ color: '#10B981' }}>{calcPharmacies} Stores (₹{(calcPharmacies * 5000).toLocaleString('en-IN')})</strong>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={calcPharmacies}
                onChange={(e) => setCalcPharmacies(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#10B981' }}
              />
            </div>

            {/* Slider 3: Hospitals */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span style={{ color: '#CBD5E1' }}>🏥 Multispecialty Hospitals (₹25,000 each):</span>
                <strong style={{ color: '#A78BFA' }}>{calcHospitals} Hospitals (₹{(calcHospitals * 25000).toLocaleString('en-IN')})</strong>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                value={calcHospitals}
                onChange={(e) => setCalcHospitals(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#A78BFA' }}
              />
            </div>
          </div>
        </div>

        {/* Output Box */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1.5px solid #10B981',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.15)'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
            PROJECTED MONTHLY REWARD INCOME
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10B981', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            ₹{totalProjected.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '16px' }}>
            Automated direct credit to your registered Bank UPI / NEFT account within 48h of verification.
          </div>

          <button
            type="button"
            onClick={() => handleWhatsAppShare()}
            style={{
              width: '100%',
              backgroundColor: '#10B981',
              border: 'none',
              color: '#FFFFFF',
              padding: '10px 20px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>📲 Start Sharing & Earn ₹{totalProjected.toLocaleString('en-IN')}</span>
          </button>
        </div>
      </div>

      {/* 5. REFERRAL TRACKING & PAYOUT LEDGER */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 4px 0' }}>
              Your Tracked Healthcare Referrals & Payouts
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: 0 }}>
              Live status of referred clinics and facilities linked to code {referralCode}
            </p>
          </div>

          <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>
            ● Direct Escrow Settlement Active
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#64748B', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px' }}>Facility / Hospital Name</th>
                <th style={{ padding: '10px 12px' }}>Category</th>
                <th style={{ padding: '10px 12px' }}>Contact Person</th>
                <th style={{ padding: '10px 12px' }}>Referred Date</th>
                <th style={{ padding: '10px 12px' }}>Bounty Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Cash Bounty</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr
                  key={r.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  <td style={{ padding: '12px', fontWeight: 700, color: '#F8FAFC' }}>
                    {r.facilityName}
                  </td>
                  <td style={{ padding: '12px', color: '#94A3B8' }}>{r.type}</td>
                  <td style={{ padding: '12px', color: '#CBD5E1' }}>
                    <div>{r.doctorName}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>{r.contactNumber}</div>
                  </td>
                  <td style={{ padding: '12px', color: '#94A3B8' }}>{r.referredDate}</td>
                  <td style={{ padding: '12px' }}>
                    {r.status === 'PAYOUT_COMPLETED' && (
                      <span
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: '#6EE7B7',
                          border: '1px solid #10B981',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.6875rem',
                          fontWeight: 800
                        }}
                      >
                        ✓ Payout Credited
                      </span>
                    )}
                    {r.status === 'VERIFICATION_PENDING' && (
                      <span
                        style={{
                          backgroundColor: 'rgba(245, 158, 11, 0.15)',
                          color: '#FCD34D',
                          border: '1px solid #F59E0B',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.6875rem',
                          fontWeight: 800
                        }}
                      >
                        ⏳ License Verification
                      </span>
                    )}
                    {r.status === 'DOCUMENTS_SUBMITTED' && (
                      <span
                        style={{
                          backgroundColor: 'rgba(56, 189, 248, 0.15)',
                          color: '#7DD3FC',
                          border: '1px solid #38BDF8',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.6875rem',
                          fontWeight: 800
                        }}
                      >
                        📄 Document Review
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, color: '#10B981' }}>
                    ₹{r.payoutAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
