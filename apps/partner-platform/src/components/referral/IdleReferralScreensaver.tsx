import React, { useState, useEffect, useRef } from 'react';
import type { HospitalStaffUser } from '../auth/HospitalStaffLogin.js';

export interface IdleReferralScreensaverProps {
  currentUser?: HospitalStaffUser | undefined;
  idleTimeoutMs?: number; // default: 60,000ms (60s)
}

interface SlideData {
  id: string;
  tag: string;
  tagColor: string;
  tagBg: string;
  title: string;
  subtitle: string;
  rewardAmount: string;
  rewardSubtitle: string;
  icon: string;
  highlights: string[];
  tc: string;
}

export const IdleReferralScreensaver: React.FC<IdleReferralScreensaverProps> = ({
  currentUser,
  idleTimeoutMs = 60000
}) => {
  const [isIdle, setIsIdle] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<any>(null);

  const referralCode = `DOC-REF-${currentUser?.id || 'PARTNER-2026'}`;
  const referralUrl = `http://localhost:5175?ref=${referralCode}&view=register`;

  // Total 5 rich informative slides
  const slides: SlideData[] = [
    {
      id: 'doctor-bounty',
      tag: '🩺 DOCTOR & CLINIC BOUNTY',
      tagColor: '#38BDF8',
      tagBg: 'rgba(56, 189, 248, 0.15)',
      title: 'Refer a Doctor or OPD Clinic ➔ Get ₹10,000 Direct Cash',
      subtitle:
        'Help fellow physicians upgrade to India’s most intuitive OPD Desk with Ambient AI Voice Scribe, ICD-10 Dual-Coder, and ABDM M1-M3 certification.',
      rewardAmount: '₹10,000',
      rewardSubtitle: 'Direct NEFT / IMPS Bank Transfer per verified facility',
      icon: '🩺',
      highlights: [
        'Free Lifetime Setup for Referred Doctor',
        'AI Voice Scribe generates SOAP in 30 seconds',
        'Digital Prescriptions with WhatsApp PDF Delivery',
        'Direct Payout credited to your registered account'
      ],
      tc: '* Terms & Conditions Apply: Referral bonus disbursed via direct bank transfer upon successful medical council / clinic license verification and first 30 active OPD consultations.'
    },
    {
      id: 'pathology-bounty',
      tag: '🔬 PATHOLOGY & LIS BOUNTY',
      tagColor: '#C084FC',
      tagBg: 'rgba(168, 85, 247, 0.15)',
      title: 'Refer a Pathology Laboratory ➔ Get ₹5,000 Direct Cash',
      subtitle:
        'Empower diagnostic labs with Bidirectional Auto-Analyzer Interfacing, Barcode Tube Intake, Panic Alerts, and automated NABL audit trails.',
      rewardAmount: '₹5,000',
      rewardSubtitle: 'Direct NEFT / IMPS Bank Transfer per verified lab',
      icon: '🔬',
      highlights: [
        'Bidirectional RS232 / TCP Analyzer Fleet Sync',
        'NABL & ICMR Compliant Authorization Workflow',
        'Real-Time WhatsApp & SMS Report Dispatch',
        'Fast ₹5,000 credit once lab goes live'
      ],
      tc: '* Terms & Conditions Apply: Referral bonus disbursed upon valid laboratory establishment registration verification and 50 accessioned patient samples.'
    },
    {
      id: 'pharmacy-bounty',
      tag: '💊 PHARMACY & MEDICAL STORE BOUNTY',
      tagColor: '#34D399',
      tagBg: 'rgba(16, 185, 129, 0.15)',
      title: 'Refer a Pharmacy or Medical Store ➔ Get ₹5,000 Direct Cash',
      subtitle:
        'Equip chemists with lightning-fast Barcode POS billing, FEFO batch tracking, Scheduled H1 registers, and instant WhatsApp receipts.',
      rewardAmount: '₹5,000',
      rewardSubtitle: 'Direct NEFT / IMPS Bank Transfer per verified pharmacy',
      icon: '💊',
      highlights: [
        'High-Speed Thermal Barcode POS Billing',
        'FEFO Batch Expiry & Near-Expiry Clearance Radar',
        'Narcotic & Schedule H/H1 Digital Compliance Registers',
        '₹5,000 Direct Payout upon license approval'
      ],
      tc: '* Terms & Conditions Apply: Referral bonus disbursed upon valid Drug License (Form 20/21) verification and active inventory dispensing.'
    },
    {
      id: 'launch-allocation',
      tag: '🎁 EXCLUSIVE LAUNCH 100 QUOTA',
      tagColor: '#FBBF24',
      tagBg: 'rgba(245, 158, 11, 0.15)',
      title: 'Gift Your Healthcare Network Free Lifetime Platform Access',
      subtitle:
        'Your colleagues won’t pay a single rupee. They get 100% Free Lifetime Setup under the Founder Launch 100 Allocation before slots close.',
      rewardAmount: '₹0 / mo',
      rewardSubtitle: 'Standard ₹4,999/mo fee 100% waived for your invitees',
      icon: '🎁',
      highlights: [
        'First 100 Verified Partners Across India Only',
        'Zero Setup Cost • Zero Cloud Server Charges',
        'Dedicated Onboarding Relationship Manager',
        'Full Enterprise Access for Hospital, Clinic, Lab & Pharmacy'
      ],
      tc: '* Terms & Conditions Apply: Complimentary ₹0 lifetime grant is strictly limited to early-adopter healthcare facilities registered during the official promotional campaign window.'
    },
    {
      id: 'share-link',
      tag: '📲 YOUR UNIQUE REFERRAL DESK',
      tagColor: '#38BDF8',
      tagBg: 'rgba(56, 189, 248, 0.15)',
      title: 'Share Your Referral Link in 1-Click via WhatsApp',
      subtitle:
        'Track all your referred facilities in real-time. Direct bank payouts are initiated automatically upon regulatory license onboarding.',
      rewardAmount: 'Share Now',
      rewardSubtitle: `Your Code: ${referralCode}`,
      icon: '📲',
      highlights: [
        'Instant WhatsApp Invitation with Pre-filled Message',
        'Unique Referral Tracking Link with Auto-Applied Grant',
        'Automated Regulatory License Onboarding Tracking',
        'Direct Payout Notifications to your registered phone'
      ],
      tc: '* Terms & Conditions Apply: Only genuine licensed healthcare facilities qualify. DOC SEARCH reserves the right to withhold bounties in cases of duplicate or fraudulent submissions.'
    }
  ];

  // Activity detection: Resets timer on user input when screensaver is closed
  useEffect(() => {
    const resetIdleTimer = () => {
      // If screensaver is already active, DO NOT close on mouse movement!
      // The partner is actively reading the advertisement & offer.
      if (isIdle) return;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setIsIdle(true);
      }, idleTimeoutMs);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];
    events.forEach((evt) => window.addEventListener(evt, resetIdleTimer, { passive: true }));

    // Initialize timer on mount
    timerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, idleTimeoutMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((evt) => window.removeEventListener(evt, resetIdleTimer));
    };
  }, [idleTimeoutMs, isIdle]);

  // Listen for ESC key to close screensaver
  useEffect(() => {
    if (!isIdle) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsIdle(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isIdle]);

  // Listen for custom trigger event from Header or UI button
  useEffect(() => {
    const handleOpen = () => {
      setIsIdle(true);
    };
    window.addEventListener('docsearch_open_referral_showcase', handleOpen);
    return () => window.removeEventListener('docsearch_open_referral_showcase', handleOpen);
  }, []);

  // Auto-advance slides every 8 seconds when idle, but pause when hovered or manually paused
  useEffect(() => {
    if (!isIdle || isPaused) return;
    const slideTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(slideTimer);
  }, [isIdle, isPaused, slides.length]);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🏥 Hello Doctor / Healthcare Partner!\n\nJoin India's next-gen healthcare platform (DOC SEARCH) with 100% FREE Lifetime Access under the Founder Launch Offer.\n\nClaim your free seat here:\n${referralUrl}\n\nUse Referral Code: ${referralCode}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  if (!isIdle) {
    return (
      // Subtle test trigger badge in development / preview
      <div
        style={{
          position: 'fixed',
          bottom: '12px',
          right: '80px',
          zIndex: 9999
        }}
      >
        <button
          type="button"
          onClick={() => setIsIdle(true)}
          title="Click to preview Idle Referral Screensaver immediately"
          style={{
            padding: '5px 12px',
            borderRadius: '999px',
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#FCD34D',
            fontSize: '0.6875rem',
            fontWeight: 800,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>🎁</span>
          <span>Partner Offers & Bounties (₹10k / ₹5k)</span>
        </button>
      </div>
    );
  }

  const slide: SlideData = slides[currentSlide] || slides[0]!;

  return (
    <div
      role="dialog"
      aria-label="Partner Idle Referral Showcase"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(7, 11, 20, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '32px 48px',
        color: '#FFFFFF',
        fontFamily: 'Inter, system-ui, sans-serif',
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      {/* 1. TOP HEADER BAR */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10B981, #06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px'
            }}
          >
            🏥
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              DOC SEARCH PARTNER NETWORK
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Healthcare Professional Referral Program & Growth Bounty Desk
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Pause / Play status toggle */}
          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            title={isPaused ? "Click to resume auto-scroll" : "Click to pause slideshow"}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              backgroundColor: isPaused ? 'rgba(245, 158, 11, 0.18)' : 'rgba(16, 185, 129, 0.15)',
              border: isPaused ? '1px solid #F59E0B' : '1px solid #10B981',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: isPaused ? '#FCD34D' : '#6EE7B7',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{isPaused ? '⏸ Slideshow Paused (Hover / Reading)' : '▶ Auto-Advancing (8s)'}</span>
          </button>

          {/* Slide Navigation in Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              padding: '4px 10px',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <button
              type="button"
              onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '2px 6px',
                fontWeight: 800
              }}
              title="Previous Offer Slide"
            >
              ◀
            </button>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#E2E8F0', minWidth: '40px', textAlign: 'center' }}>
              {currentSlide + 1} / {slides.length}
            </span>
            <button
              type="button"
              onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '2px 6px',
                fontWeight: 800
              }}
              title="Next Offer Slide"
            >
              ▶
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsIdle(false)}
            style={{
              padding: '8px 20px',
              borderRadius: '999px',
              backgroundColor: '#10B981',
              border: 'none',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
            }}
            title="Press Esc or click to return to Clinical Desk"
          >
            <span>✕ Resume Clinical Desk (Esc)</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN SLIDE CONTENT CONTAINER */}
      <div
        style={{
          maxWidth: '1100px',
          width: '100%',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr',
          gap: '40px',
          alignItems: 'center',
          padding: '24px 0'
        }}
      >
        {/* Left: Headline, Subtitle, Highlights */}
        <div>
          <span
            style={{
              display: 'inline-block',
              padding: '5px 14px',
              borderRadius: '999px',
              backgroundColor: slide.tagBg,
              color: slide.tagColor,
              fontWeight: 900,
              fontSize: '0.75rem',
              letterSpacing: '0.05em',
              marginBottom: '16px'
            }}
          >
            {slide.tag}
          </span>

          <h2
            style={{
              fontSize: '2.5rem',
              fontWeight: 900,
              margin: '0 0 16px',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: '#FFFFFF'
            }}
          >
            {slide.title}
          </h2>

          <p
            style={{
              fontSize: '1.0625rem',
              color: '#CBD5E1',
              lineHeight: 1.5,
              margin: '0 0 24px'
            }}
          >
            {slide.subtitle}
          </p>

          {/* Feature Highlights Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
              marginBottom: '28px'
            }}
          >
            {slide.highlights.map((h, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '0.8125rem',
                  color: '#E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ color: '#10B981', fontWeight: 900 }}>✓</span>
                <span>{h}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleWhatsAppShare}
              style={{
                padding: '14px 28px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#25D366',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '0.9375rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(37, 211, 102, 0.35)'
              }}
            >
              <span>📲 Share on WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              style={{
                padding: '14px 24px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.9375rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>📋</span>
              <span>{copied ? '✓ Link Copied!' : 'Copy Invite Link'}</span>
            </button>
          </div>
        </div>

        {/* Right: Big Bounty Card */}
        <div
          style={{
            background: 'linear-gradient(145deg, #0F172A 0%, #1E1B4B 50%, #064E3B 100%)',
            border: `2px solid ${slide.tagColor}`,
            borderRadius: '24px',
            padding: '36px',
            textAlign: 'center',
            boxShadow: `0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px ${slide.tagBg}`
          }}
        >
          <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>{slide.icon}</div>

          <div
            style={{
              fontSize: '0.8125rem',
              fontWeight: 800,
              color: slide.tagColor,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Verified Referral Bounty
          </div>

          <div
            style={{
              fontSize: '3rem',
              fontWeight: 900,
              color: '#FFFFFF',
              margin: '8px 0',
              letterSpacing: '-0.02em'
            }}
          >
            {slide.rewardAmount}
          </div>

          <div style={{ fontSize: '0.875rem', color: '#CBD5E1', marginBottom: '24px' }}>
            {slide.rewardSubtitle}
          </div>

          {/* Referral Code Box */}
          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              border: '1px dashed rgba(255, 255, 255, 0.25)',
              borderRadius: '14px',
              padding: '14px',
              marginBottom: '20px'
            }}
          >
            <div style={{ fontSize: '0.6875rem', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>
              Your Unique Partner Referral Code:
            </div>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 900,
                color: '#FCD34D',
                letterSpacing: '0.08em',
                fontFamily: 'monospace'
              }}
            >
              {referralCode}
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            Share with colleagues • No limit on number of facilities you can refer!
          </div>
        </div>
      </div>

      {/* 3. BOTTOM CONTROLS & TERMS DISCLAIMER */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          alignItems: 'center'
        }}
      >
        {/* Carousel Slide Indicators & Prev/Next */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ‹
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                style={{
                  width: currentSlide === idx ? '28px' : '10px',
                  height: '10px',
                  borderRadius: '999px',
                  backgroundColor: currentSlide === idx ? '#10B981' : 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ›
          </button>
        </div>

        {/* T&C Notice */}
        <div style={{ fontSize: '0.6875rem', color: '#94A3B8', textAlign: 'center', maxWidth: '880px', lineHeight: 1.4 }}>
          {slide.tc}
        </div>
      </div>
    </div>
  );
};
