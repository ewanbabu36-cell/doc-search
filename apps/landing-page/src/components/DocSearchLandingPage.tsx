import React, { useState, useEffect, useRef } from 'react';
import { Badge, useTheme, themes, DocSearchLogo } from '@docsearch/ui-kit';

// Lazy-loaded heavy modals and full-page views to drastically reduce landing page bundle size
const UnifiedHealthcareLoginModal = React.lazy(() => import('./UnifiedHealthcareLoginModal.js').then(m => ({ default: m.UnifiedHealthcareLoginModal })));
const FullPageRegistrationView = React.lazy(() => import('./FullPageRegistrationView.js').then(m => ({ default: m.FullPageRegistrationView })));
const LaunchOfferFlashTakeoverModal = React.lazy(() => import('./LaunchOfferFlashTakeoverModal.js').then(m => ({ default: m.LaunchOfferFlashTakeoverModal })));
const LiveEmergencyBedRadarWidget = React.lazy(() => import('./LiveEmergencyBedRadarWidget.js').then(m => ({ default: m.LiveEmergencyBedRadarWidget })));
const AIReceptionistWidget = React.lazy(() => import('./AIReceptionistWidget.js').then(m => ({ default: m.AIReceptionistWidget })));
import { InteractiveClinicSandbox } from './InteractiveClinicSandbox.js';
import { AdaptiveRoiCalculator } from './AdaptiveRoiCalculator.js';
import {
  getPromotionalCampaign,
  fetchPromotionalCampaignRemote,
  calculateCampaignMetrics,
  PROMOTIONAL_CAMPAIGN_EVENT,
  type PromotionalCampaignConfig,
  type CampaignCalculatedMetrics
} from '@docsearch/shared-core';

export const DocSearchLandingPage: React.FC = () => {
  const { theme } = useTheme();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalInitialTab, setLoginModalInitialTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [isOmniCapsuleOpen, setIsOmniCapsuleOpen] = useState(false);
  const [isAiReceptionistOpen, setIsAiReceptionistOpen] = useState(false);
  const omniCapsuleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (omniCapsuleRef.current && !omniCapsuleRef.current.contains(e.target as Node)) {
        setIsOmniCapsuleOpen(false);
      }
    };
    if (isOmniCapsuleOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOmniCapsuleOpen]);

  // Dynamic Launch Offer Campaign & Urgency Engine (HQ Controlled)
  const [campaign, setCampaign] = useState<PromotionalCampaignConfig>(getPromotionalCampaign());
  const [campaignMetrics, setCampaignMetrics] = useState<CampaignCalculatedMetrics>(calculateCampaignMetrics(campaign));

  // Dedicated Full-Page View Mode ('LANDING' vs 'REGISTRATION')
  const [currentView, setCurrentView] = useState<'LANDING' | 'REGISTRATION'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'register' || params.get('register') === 'true') {
        return 'REGISTRATION';
      }
    }
    return 'LANDING';
  });

  // Welcome Flash Offer Takeover Modal State
  const [showFlashTakeover, setShowFlashTakeover] = useState(false);

  // Auto-flash offer takeover on first visit if offer is active
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem('docsearch_flash_offer_dismissed');
      if (!dismissed && campaign.status === 'ACTIVE') {
        setShowFlashTakeover(true);
      }
    } catch {}
  }, [campaign.status]);

  const handleCloseFlashTakeover = () => {
    setShowFlashTakeover(false);
    try {
      sessionStorage.setItem('docsearch_flash_offer_dismissed', 'true');
    } catch {}
  };

  const handleClaimFlashOffer = () => {
    setShowFlashTakeover(false);
    try {
      sessionStorage.setItem('docsearch_flash_offer_dismissed', 'true');
    } catch {}
    setCurrentView('REGISTRATION');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const openRegisterModal = () => {
    setCurrentView('REGISTRATION');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const openLoginModal = () => {
    setLoginModalInitialTab('LOGIN');
    setShowLoginModal(true);
  };

  useEffect(() => {
    let mounted = true;
    const updateCampaignState = async () => {
      try {
        const remote = await fetchPromotionalCampaignRemote();
        if (mounted) {
          setCampaign(remote);
          setCampaignMetrics(calculateCampaignMetrics(remote));
        }
      } catch {
        if (mounted) {
          const current = getPromotionalCampaign();
          setCampaign(current);
          setCampaignMetrics(calculateCampaignMetrics(current));
        }
      }
    };

    updateCampaignState();
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        updateCampaignState();
      }
    }, 60000);
    if (typeof window !== 'undefined') {
      window.addEventListener(PROMOTIONAL_CAMPAIGN_EVENT, updateCampaignState);
    }

    return () => {
      mounted = false;
      clearInterval(timer);
      if (typeof window !== 'undefined') {
        window.removeEventListener(PROMOTIONAL_CAMPAIGN_EVENT, updateCampaignState);
      }
    };
  }, []);

  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<'clinical' | 'ai_cdss' | 'abdm' | 'operations' | 'security'>('clinical');
  
  // Advancement States: Scroll, Navigation, FAQ, Pipeline & Demo Token
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [selectedPipelineStep, setSelectedPipelineStep] = useState<number>(0);
  const [generatedDemoToken, setGeneratedDemoToken] = useState<string>('VIP-HOSP-2026');

  // Interactive Body Symptom Explorer State
  const [selectedOrgan, setSelectedOrgan] = useState<'HEART' | 'BRAIN' | 'BONES' | 'PEDIATRICS' | 'EYES' | 'PATHOLOGY'>('HEART');
  const [symptomSearchQuery, setSymptomSearchQuery] = useState('');
  const [bookingNotice, setBookingNotice] = useState<string | null>(null);

  // AI Spotlight Cmd+K Modal & Video Hover Preview States
  const [showSpotlightModal, setShowSpotlightModal] = useState(false);
  const [videoPreviewDoctor, setVideoPreviewDoctor] = useState<{
    name: string;
    speciality: string;
    hospital: string;
    fee: number;
    greeting: string;
    avatar: string;
  } | null>(null);

  // Scroll listener for sticky dock & glass navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hash listener for navbar navigation and automated tab switching
  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash.toLowerCase();
      if (h === '#ai-cdss') {
        setActiveTab('ai_cdss');
        document.getElementById('command-center')?.scrollIntoView({ behavior: 'smooth' });
      } else if (h === '#abdm') {
        setActiveTab('abdm');
        document.getElementById('command-center')?.scrollIntoView({ behavior: 'smooth' });
      } else if (h === '#architecture') {
        document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' });
      } else if (h === '#faq') {
        document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSpotlightModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ROI Calculator State
    

  const [demoForm, setDemoForm] = useState({
    hospitalName: '',
    contactName: '',
    email: '',
    phone: '',
    bedCapacity: '100-300 Beds',
    notes: ''
  });

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoForm.hospitalName || !demoForm.phone) return;
    if (demoForm.phone.length !== 10 || !/^[6-9]/.test(demoForm.phone)) {
      alert('Kripya valid 10-digit Indian mobile number enter karein (starts with 6, 7, 8, or 9).');
      return;
    }

    const token = 'VIP-HOSP-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    setGeneratedDemoToken(token);

    const demoPayload = {
      id: 'demo-' + Date.now(),
      demoToken: token,
      ...demoForm,
      status: 'PENDING_DEMO',
      submittedAt: new Date().toISOString()
    };

    // 1. LocalStorage persistence
    try {
      const existing = JSON.parse(localStorage.getItem('docsearch_demo_requests') || '[]');
      existing.unshift(demoPayload);
      localStorage.setItem('docsearch_demo_requests', JSON.stringify(existing));
    } catch {
      // ignore
    }

    // 2. API Gateway sync to Fastify backend
    try {
      await fetch('/api/v1/auth/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoPayload)
      });
    } catch {
      // fallback
    }

    setDemoSubmitted(true);
  };

  const partnerPortalUrl = ((import.meta as any)?.env?.VITE_PARTNER_URL as string) || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5173' : '/partner/');
  const companyPortalUrl = ((import.meta as any)?.env?.VITE_COMPANY_URL as string) || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5174' : '/hq/');

  // Calculated ROI Metrics
      
  // Render Full-Page Dedicated Registration View
  if (currentView === 'REGISTRATION') {
    return (
      <React.Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090D16', color: '#06B6D4' }}>Loading Registration Suite...</div>}>
        <FullPageRegistrationView
          onBackToHome={() => {
            setCurrentView('LANDING');
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.delete('view');
              url.searchParams.delete('register');
              window.history.replaceState({}, document.title, url.pathname);
            }
          }}
          onOpenLogin={() => {
            setCurrentView('LANDING');
            openLoginModal();
          }}
          partnerPortalUrl={partnerPortalUrl}
          companyPortalUrl={companyPortalUrl}
        />
      </React.Suspense>
    );
  }

  return (
    <div style={{
      backgroundColor: '#070B14',
      color: '#F8FAFC',
      minHeight: '100vh',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflowX: 'hidden'
    }}>
      
      {/* Background Radial Glow Meshes */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '1200px',
        height: '600px',
        background: 'radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.18) 0%, rgba(59, 130, 246, 0.12) 35%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{
        position: 'fixed',
        bottom: 0,
        right: '-10%',
        width: '800px',
        height: '500px',
        background: 'radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* 1. TOP LIVE NOTIFICATION BANNER / DYNAMIC LAUNCH PROMO MARQUEE */}
      {campaign.status === 'ACTIVE' && !campaignMetrics.isExpired && !campaignMetrics.isLocked ? (
        <div style={{
          background: 'linear-gradient(90deg, #1E1B4B 0%, #0F172A 30%, #1E1B4B 70%, #064E3B 100%)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
          padding: '8px 20px',
          fontSize: '0.8125rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 60,
          boxShadow: '0 2px 14px rgba(0, 0, 0, 0.4)'
        }}>
          {/* Pulsing Live Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 10px #10B981'
            }} />
            <span style={{
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              color: '#34D399',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontWeight: 800,
              fontSize: '0.6875rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              {campaign.badgeText}
            </span>
          </div>

          {/* Offer Headline & Benefits */}
          <span style={{ color: '#F8FAFC', fontWeight: 600 }}>
            🎉 <strong>{campaign.title}:</strong> 100% Free {campaign.durationMonths}-Month {campaign.planName} Access (Worth ₹{campaign.originalPriceInr.toLocaleString('en-IN')})
          </span>

          {/* Seats Counter Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            padding: '2px 10px',
            borderRadius: '9999px',
            color: '#FCD34D',
            fontSize: '0.75rem',
            fontWeight: 800
          }}>
            <span>🎯</span>
            <span>{campaignMetrics.claimedCount} / {campaign.targetSeats} Seats Claimed</span>
            <span style={{ color: '#F87171' }}>• Only {campaignMetrics.remainingSeats} Left!</span>
          </div>

          {/* Countdown Clock */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '2px 10px',
            borderRadius: '6px',
            color: '#38BDF8',
            fontSize: '0.75rem',
            fontWeight: 800,
            fontFamily: 'monospace'
          }}>
            <span>⏳ Closes In:</span>
            <span>{campaignMetrics.formattedTimeLeft}</span>
          </div>

          {/* Direct CTA */}
          <button
            type="button"
            onClick={openRegisterModal}
            style={{
              backgroundColor: '#10B981',
              color: '#070B14',
              border: 'none',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontWeight: 800,
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
              transition: 'transform 0.15s ease'
            }}
          >
            <span>Claim Free Seat</span>
            <span>➔</span>
          </button>
        </div>
      ) : (
        <div style={{
          background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.25) 0%, rgba(59, 130, 246, 0.25) 50%, rgba(139, 92, 246, 0.25) 100%)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
          padding: '8px 20px',
          fontSize: '0.8125rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          position: 'relative',
          zIndex: 60
        }}>
          <span style={{
            backgroundColor: '#06B6D4',
            color: '#070B14',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontWeight: 700,
            fontSize: '0.6875rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            NEW RELEASE
          </span>
          <span style={{ color: '#E0F2FE', fontWeight: 500 }}>
            ✨ ABDM M1/M2/M3 National Health Gateway, Ambient Voice Scribe 3.0 & Hardware Bridge now live.
          </span>
          <a href="#simulator" style={{ color: '#38BDF8', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span>🎮 Try 10-Sec Live Demo →</span>
          </a>
        </div>
      )}

      {/* 2. GLASSMORPHIC TOP NAVBAR & RESPONSIVE LOGO ARCHITECTURE */}
      <style>{`
        /* ============================================================ */
        /* 🩺 DOC SEARCH - ADVANCED RESPONSIVE LOGO & NAVBAR RULES       */
        /* ============================================================ */

        .docsearch-header {
          padding: 14px 32px;
        }

        /* Brand Logo Interactive Link Container */
        .docsearch-brand-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          flex-shrink: 0;
          text-decoration: none;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .docsearch-brand-logo:hover {
          transform: translateY(-1px);
          opacity: 0.95;
        }

        /* Logo Glowing Hex/Rounded Icon */
        .docsearch-logo-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, #06B6D4 0%, #3B82F6 50%, #8B5CF6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.35rem;
          box-shadow: 0 0 22px rgba(6, 182, 212, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.25);
          flex-shrink: 0;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Logo Typography & Badge Layout */
        .docsearch-logo-text-group {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
        }
        .docsearch-logo-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: nowrap;
        }
        .docsearch-logo-title {
          font-size: 1.25rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          background: linear-gradient(90deg, #FFFFFF 0%, #E2E8F0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          white-space: nowrap;
          line-height: 1.2;
          transition: font-size 0.2s ease;
        }
        .docsearch-logo-badge {
          background-color: rgba(6, 182, 212, 0.15);
          color: #38BDF8;
          border: 1px solid rgba(56, 189, 248, 0.3);
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          white-space: nowrap;
          display: inline-block;
          transition: all 0.2s ease;
        }
        .docsearch-logo-subtitle {
          font-size: 0.75rem;
          color: #94A3B8;
          white-space: nowrap;
          line-height: 1.3;
          margin-top: 2px;
          transition: all 0.2s ease;
        }

        /* Desktop Navigation vs Mobile Drawers */
        .docsearch-desktop-nav {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .docsearch-mobile-toggle {
          display: none !important;
        }
        .docsearch-clock-badge {
          display: flex;
        }
        .docsearch-login-full {
          display: inline;
        }
        .docsearch-login-compact {
          display: none;
        }
        .docsearch-theme-label {
          display: inline;
        }

        /* 💻 Screen <= 1180px: Hide subtitle to protect logo from colliding with desktop nav */
        @media (max-width: 1180px) {
          .docsearch-logo-subtitle {
            display: none !important;
          }
        }

        /* 📱 Tablet Screen <= 1024px: Hide desktop nav links, reveal mobile toggle */
        @media (max-width: 1024px) {
          .docsearch-header {
            padding: 12px 20px !important;
          }
          .docsearch-desktop-nav {
            display: none !important;
          }
          .docsearch-mobile-toggle {
            display: flex !important;
          }
          .docsearch-logo-subtitle {
            display: none !important;
          }
        }

        /* 📱 Mobile Screen <= 768px: Proportional logo scale & clean layout */
        @media (max-width: 768px) {
          .docsearch-header {
            padding: 10px 16px !important;
          }
          .docsearch-brand-logo {
            gap: 10px !important;
          }
          .docsearch-logo-icon {
            width: 36px !important;
            height: 36px !important;
            font-size: 1.15rem !important;
            border-radius: 9px !important;
          }
          .docsearch-logo-title {
            font-size: 1.125rem !important;
          }
          .docsearch-logo-badge {
            font-size: 0.625rem !important;
            padding: 1px 6px !important;
          }
          .docsearch-clock-badge {
            display: none !important;
          }
          .docsearch-theme-label {
            display: none !important;
          }
        }

        /* 📲 Ultra-Compact Mobile <= 480px: Minimal single-row header */
        @media (max-width: 480px) {
          .docsearch-header {
            padding: 8px 12px !important;
          }
          .docsearch-brand-logo {
            gap: 8px !important;
          }
          .docsearch-logo-icon {
            width: 32px !important;
            height: 32px !important;
            font-size: 1rem !important;
            border-radius: 8px !important;
          }
          .docsearch-logo-title {
            font-size: 1.05rem !important;
            letter-spacing: -0.02em !important;
          }
          .docsearch-logo-badge {
            display: none !important;
          }
          .docsearch-login-full {
            display: none !important;
          }
          .docsearch-login-compact {
            display: inline !important;
          }
        }

        /* 📲 Mini Phone <= 360px */
        @media (max-width: 360px) {
          .docsearch-header {
            padding: 8px 8px !important;
          }
          .docsearch-brand-logo {
            gap: 6px !important;
          }
          .docsearch-logo-title {
            font-size: 0.95rem !important;
          }
        }

        /* ✦ Unified Omni-Action Capsule Responsive Styling */
        .docsearch-omni-capsule {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .docsearch-omni-menu {
          position: absolute;
          bottom: calc(100% + 10px);
          right: 0;
          width: 300px;
          max-width: calc(100vw - 32px);
          background-color: rgba(15, 23, 42, 0.97);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1.5px solid rgba(56, 189, 248, 0.4);
          border-radius: 18px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(6, 182, 212, 0.25);
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          animation: omniFadeInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes omniFadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* 📱 Screen <= 768px: Mobile Ergonomic Capsule Positioning */
        @media (max-width: 768px) {
          .docsearch-omni-capsule {
            bottom: 16px !important;
            right: 16px !important;
          }
          .docsearch-omni-menu {
            right: 0 !important;
            width: calc(100vw - 32px) !important;
          }
        }

        /* 📲 Screen <= 480px: Compact Viewport */
        @media (max-width: 480px) {
          .docsearch-omni-capsule {
            bottom: 12px !important;
            right: 12px !important;
          }
          .docsearch-omni-menu {
            width: calc(100vw - 24px) !important;
          }
        }
      `}</style>

      <header className="docsearch-header" style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(7, 11, 20, 0.85)',
        borderBottom: scrolled ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: scrolled ? '0 10px 30px rgba(0, 0, 0, 0.5)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.3s ease'
      }}>
        {/* Brand Logo - Universal Futuristic DocSearch Logo with Home Redirection */}
        <DocSearchLogo
          variant="full"
          size="md"
          badgeText="ENTERPRISE OS"
          redirectUrl="/"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        {/* Center Nav Links (Desktop Only - Clean Linear Style) */}
        <nav className="docsearch-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <a href="#overview" style={{ color: '#E2E8F0', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, transition: 'color 0.2s' }}>Overview</a>
          <a href="#simulator" style={{ color: '#38BDF8', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 800, transition: 'color 0.2s', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
            🎮 10-Sec Live Demo
          </a>
          <a href="#emergency" style={{ color: '#F87171', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 800, transition: 'color 0.2s', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>🚨 ICU Bed Radar</a>
          <a href="#architecture" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, transition: 'color 0.2s' }}>Architecture</a>
          <a href="#security" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, transition: 'color 0.2s' }}>Security</a>
        </nav>

        {/* Right CTA Actions - Clean Linear/Apple-Style (Demo CTA + Sign In) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Live Product Demo CTA */}
          <button
            type="button"
            onClick={() => setShowDemoModal(true)}
            style={{
              background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
              color: '#FFFFFF',
              padding: '8px 18px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.875rem',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <span>⚡</span>
            <span>Live Product Demo</span>
          </button>

          {/* Clean Sign In Button */}
          <button
            type="button"
            onClick={openLoginModal}
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
              color: '#F8FAFC',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.875rem',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <span>Sign In ➔</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="docsearch-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#F8FAFC',
              borderRadius: '8px',
              padding: '7px 10px',
              cursor: 'pointer',
              fontSize: '1.125rem',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Toggle navigation"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'rgba(7, 11, 20, 0.96)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '20px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)'
          }}>
            {[
              { label: '🎮 10-Sec Live Software Demo', href: '#simulator' },
              { label: 'Overview', href: '#overview' },
              { label: '🚨 ICU Bed Radar', href: '#emergency' },
              { label: 'Event Bus Pipeline', href: '#architecture' },
              { label: 'Ambient AI Scribe', href: '#ai-cdss', action: () => setActiveTab('ai_cdss') },
              { label: 'ABDM Health Gateway', href: '#abdm', action: () => setActiveTab('abdm') },
              { label: 'Hospital ROI Estimator', href: '#calculator' },
              { label: 'Executive FAQs', href: '#faq' },
              { label: 'Zero-Trust Security', href: '#security' }
            ].map((item, idx) => (
              <a
                key={idx}
                href={item.href}
                onClick={() => {
                  if (item.action) item.action();
                  setMobileMenuOpen(false);
                }}
                style={{
                  color: '#E2E8F0',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* 3. HERO SECTION WITH VIBRANT MEDICAL HUD */}
      <section id="overview" style={{ position: 'relative', padding: '80px 32px 60px 32px', zIndex: 10, maxWidth: '1360px', margin: '0 auto' }}>
        
        {/* Top Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{
            backgroundColor: 'rgba(6, 182, 212, 0.12)',
            border: '1px solid rgba(6, 182, 212, 0.35)',
            padding: '6px 16px',
            borderRadius: '9999px',
            fontSize: '0.8125rem',
            color: '#38BDF8',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚡ Real-Time Clinical Engine</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>|</span>
            <span>Zero-Data Loss Architecture</span>
          </div>

          <div style={{
            backgroundColor: 'rgba(139, 92, 246, 0.12)',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            padding: '6px 16px',
            borderRadius: '9999px',
            fontSize: '0.8125rem',
            color: '#C084FC',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🛡️ NABH, HIPAA & NRCES India Compliant</span>
          </div>
        </div>

        {/* Hero Title & Pitch */}
        <div style={{ textAlign: 'center', maxWidth: '980px', margin: '0 auto 40px auto' }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4.25rem)',
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: '-0.035em',
            marginBottom: '24px'
          }}>
            The Unified Intelligent{' '}
            <span style={{
              background: 'linear-gradient(135deg, #38BDF8 0%, #3B82F6 50%, #A855F7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(56, 189, 248, 0.3)'
            }}>
              Operating System
            </span>{' '}
            for Modern Hospitals.
          </h1>

          <p style={{
            fontSize: '1.1875rem',
            lineHeight: 1.6,
            color: '#94A3B8',
            maxWidth: '820px',
            margin: '0 auto 36px auto'
          }}>
            From <strong>OPD Triage</strong> and <strong>Inpatient Bed Census</strong> to <strong>Ambient AI Voice Scribe</strong>, <strong>ABDM National Health Stack (M1–M3)</strong>, <strong>RIS/PACS DICOM Imaging</strong>, and <strong>FEFO Pharmacy</strong> — DocSearch orchestrates your entire hospital ecosystem on a single, sub-millisecond multi-tenant cloud engine.
          </p>

          {/* Primary Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <a
              href="#simulator"
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                padding: '14px 28px',
                borderRadius: '10px',
                fontWeight: 900,
                fontSize: '1rem',
                textDecoration: 'none',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                boxShadow: '0 0 25px rgba(16, 185, 129, 0.45)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>🎮 Try 10-Sec Live Demo</span>
              <span>➔</span>
            </a>

            <button
              onClick={() => setShowDemoModal(true)}
              style={{
                background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                color: '#FFFFFF',
                padding: '14px 28px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 0 25px rgba(2, 132, 199, 0.45)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span>🚀 VIP Walkthrough</span>
            </button>

            <button
              type="button"
              onClick={openLoginModal}
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                color: '#F8FAFC',
                padding: '14px 24px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '1rem',
                border: '1.5px solid rgba(56, 189, 248, 0.35)',
                backdropFilter: 'blur(12px)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)'
              }}
            >
              <span>🔐 Doctor Portal</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* 🎯 DYNAMIC HERO LAUNCH OFFER & SCARCITY QUOTA CARD (HQ CONTROLLED)         */}
          {/* ========================================================================= */}
          {campaign.status === 'ACTIVE' && (
            <div
              style={{
                marginTop: '28px',
                width: '100%',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.9) 100%)',
                border: '1.5px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '16px',
                padding: '20px 24px',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5), 0 0 24px rgba(56, 189, 248, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                textAlign: 'left'
              }}
            >
              {/* Top Row: Title, Badge & Countdown */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10B981 0%, #0284C7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}>
                    🎁
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.0625rem', fontWeight: 900, color: '#FFFFFF' }}>
                        {campaign.title}
                      </span>
                      <span style={{
                        backgroundColor: campaignMetrics.isLocked || campaignMetrics.isExpired ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: campaignMetrics.isLocked || campaignMetrics.isExpired ? '#F87171' : '#34D399',
                        border: campaignMetrics.isLocked || campaignMetrics.isExpired ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        textTransform: 'uppercase'
                      }}>
                        {campaignMetrics.isLocked ? 'QUOTA FULFILLED' : campaignMetrics.isExpired ? 'OFFER EXPIRED' : campaign.badgeText}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '2px' }}>
                      {campaign.subtitle}
                    </div>
                  </div>
                </div>

                {/* Countdown pill */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  padding: '6px 14px',
                  borderRadius: '10px'
                }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>⏰ Closing In:</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 900, color: '#38BDF8', fontFamily: 'monospace' }}>
                    {campaignMetrics.formattedTimeLeft}
                  </span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.8125rem' }}>
                  <span style={{ fontWeight: 700, color: '#CBD5E1' }}>
                    🔥 Partner Adoption Quota: <strong style={{ color: '#38BDF8' }}>{campaignMetrics.claimedCount}</strong> of <strong style={{ color: '#FFFFFF' }}>{campaign.targetSeats}</strong> Seats Claimed
                  </span>
                  <span style={{ fontWeight: 800, color: campaignMetrics.percentageClaimed > 85 ? '#F87171' : '#34D399' }}>
                    {campaignMetrics.percentageClaimed}% Claimed • {campaignMetrics.remainingSeats} Free Slots Left!
                  </span>
                </div>

                {/* Visual Bar */}
                <div style={{
                  width: '100%',
                  height: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '9999px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(100, Math.max(5, campaignMetrics.percentageClaimed))}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #0284C7 0%, #06B6D4 50%, #10B981 100%)',
                    borderRadius: '9999px',
                    transition: 'width 0.5s ease',
                    boxShadow: '0 0 12px rgba(16, 185, 129, 0.6)'
                  }} />
                </div>
              </div>

              {/* Bottom perks & CTA */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                paddingTop: '6px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.75rem', color: '#94A3B8', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#10B981' }}>✓</span> ₹0 for {campaign.durationMonths} Months (Save ₹{campaign.originalPriceInr.toLocaleString('en-IN')})
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#10B981' }}>✓</span> Zero Credit Card Required
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#10B981' }}>✓</span> Instant Sandbox Provisioning
                  </span>
                </div>

                {campaignMetrics.isLocked || campaignMetrics.isExpired ? (
                  <button
                    type="button"
                    onClick={openLoginModal}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#94A3B8',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    View Standard Pricing & Onboarding →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={openRegisterModal}
                    style={{
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: '8px',
                      fontSize: '0.8125rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <span>⚡ Claim My Free Partner Seat ({campaignMetrics.remainingSeats} Left)</span>
                    <span>➔</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 🎮 ELEVATED 10-SEC LIVE CLINIC SIMULATOR (RANK #3 NEXT-GEN ADVANCEMENT)    */}
        {/* ========================================================================= */}
        <div id="simulator" style={{ margin: '48px 0 32px 0', width: '100%', scrollMarginTop: '90px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Badge variant="primary">🎮 10-SECOND LIVE CLINIC SIMULATOR</Badge>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.8vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.025em', margin: '14px 0 10px 0' }}>
              38 Text Cards Ke Badle — Homepage Par Hi Live Interactive Software Demo
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '1.0625rem', maxWidth: '780px', margin: '0 auto', lineHeight: 1.6 }}>
              Experience why <strong style={{ color: '#F8FAFC' }}>14,000+ Indian Doctors & Hospital Directors</strong> switched from legacy slow software.
              Test real OPD tokens, 1-click pediatric kits, 50-bed ward matrices, blister cuts, and ASTM analyzers in 10 seconds.
            </p>
          </div>

          <InteractiveClinicSandbox
            onOpenDemoModal={() => setShowDemoModal(true)}
            onOpenRegisterModal={openRegisterModal}
            partnerPortalUrl={partnerPortalUrl}
          />
        </div>

        {/* ========================================================================= */}
        {/* 🚨 24x7 LIVE EMERGENCY ICU & OXYGEN BED RADAR WIDGET                      */}
        {/* ========================================================================= */}
        <div id="emergency" style={{ margin: '36px 0 20px 0', width: '100%' }}>
          <React.Suspense fallback={<div style={{ minHeight: '120px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)' }} />}>
            <LiveEmergencyBedRadarWidget />
          </React.Suspense>
        </div>

        {/* ========================================================================= */}
        {/* 🏆 NATIONAL HEALTHCARE ACCREDITATIONS & COMPLIANCE TRUST BAR */}
        {/* ========================================================================= */}
        <div style={{
          margin: '36px 0 32px 0',
          padding: '20px 24px',
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
            VERIFIED HEALTHCARE INTEROPERABILITY & NATIONAL REGULATORY STANDARDS
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
            width: '100%'
          }}>
            {[
              { label: 'NHA ABDM Certified', sub: 'M1 • M2 • M3 Gateway', icon: '🇮🇳', color: '#F59E0B' },
              { label: 'NABH Digital Standards', sub: 'Clinical Care Ready', icon: '🏥', color: '#10B981' },
              { label: 'NABL ISO 15189', sub: 'Bidirectional Analyzers', icon: '🧪', color: '#EC4899' },
              { label: 'HIPAA & GDPR Compliant', sub: 'Zero-Trust PHI Cryptography', icon: '🔒', color: '#38BDF8' },
              { label: 'ISO/IEC 27001 Certified', sub: 'Multi-Tenant RLS Vault', icon: '🛡️', color: '#8B5CF6' },
              { label: 'HL7 FHIR R4 & DICOM 3.0', sub: 'NRCES Signed Bundles', icon: '⚡', color: '#06B6D4' }
            ].map((badge, bidx) => (
              <div
                key={bidx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: 'rgba(30, 41, 59, 0.6)',
                  border: `1px solid ${badge.color}30`,
                  padding: '8px 16px',
                  borderRadius: '12px',
                  transition: 'transform 0.2s',
                  minWidth: '180px'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{badge.icon}</span>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F8FAFC' }}>{badge.label}</div>
                  <div style={{ fontSize: '0.6875rem', color: badge.color, fontWeight: 600 }}>{badge.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* ✨ INTERACTIVE 3D BODY SYMPTOM EXPLORER & INSTANT DOCTOR SPOTLIGHT */}
        {/* ========================================================================= */}
        <div style={{
          backgroundColor: theme === themes.AURORA_GLOW ? 'rgba(15, 23, 42, 0.85)' : 'rgba(16, 23, 38, 0.75)',
          backdropFilter: 'blur(20px)',
          border: theme === themes.AURORA_GLOW ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: theme === themes.AURORA_GLOW
            ? '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 45px rgba(16, 185, 129, 0.25)'
            : '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 35px rgba(6, 182, 212, 0.15)',
          margin: '36px auto 40px auto'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>🩺</span>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
                  Interactive Symptom Explorer & Live Specialist Spotlight
                </h2>
                <span style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#34D399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  🟢 14,200+ Doctors Active
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
                Select a body system or symptom to instantly connect with verified Super-Specialists for zero-wait video consult or clinic visit.
              </p>
            </div>

            {/* Smart Search Filter Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                onClick={() => setShowSpotlightModal(true)}
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.7)',
                  border: '1.5px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(6, 182, 212, 0.2)'
                }}
              >
                <span>🔍 Search symptoms e.g. Chest pain, Fever...</span>
                <span style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: '#38BDF8'
                }}>
                  Cmd + K
                </span>
              </div>
            </div>
          </div>

          {bookingNotice && (
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid #10B981',
              borderRadius: '10px',
              padding: '10px 16px',
              marginBottom: '18px',
              color: '#6EE7B7',
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>{bookingNotice}</span>
              <button
                type="button"
                onClick={() => setBookingNotice(null)}
                style={{ background: 'none', border: 'none', color: '#6EE7B7', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Organ Selector Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {[
              { key: 'HEART' as const, label: 'Chest & Heart', icon: '❤️', subtitle: 'Cardiology' },
              { key: 'BRAIN' as const, label: 'Brain & Spine', icon: '🧠', subtitle: 'Neurology' },
              { key: 'BONES' as const, label: 'Joints & Bones', icon: '🦴', subtitle: 'Orthopedics' },
              { key: 'PEDIATRICS' as const, label: 'Child & Baby', icon: '👶', subtitle: 'Pediatrics' },
              { key: 'EYES' as const, label: 'Eyes & Vision', icon: '👁️', subtitle: 'Ophthalmology' },
              { key: 'PATHOLOGY' as const, label: 'Lab & Blood Test', icon: '🧪', subtitle: 'Diagnostics' }
            ].map((organ) => {
              const isSelected = selectedOrgan === organ.key;
              return (
                <button
                  key={organ.key}
                  type="button"
                  onClick={() => setSelectedOrgan(organ.key)}
                  style={{
                    backgroundColor: isSelected
                      ? theme === themes.AURORA_GLOW
                        ? 'rgba(16, 185, 129, 0.25)'
                        : 'rgba(6, 182, 212, 0.25)'
                      : 'rgba(30, 41, 59, 0.5)',
                    border: isSelected
                      ? theme === themes.AURORA_GLOW
                        ? '1.5px solid #10B981'
                        : '1.5px solid #06B6D4'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 4px 18px rgba(6, 182, 212, 0.3)' : 'none'
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{organ.icon}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: isSelected ? '#FFFFFF' : '#E2E8F0' }}>
                    {organ.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: isSelected ? '#38BDF8' : '#94A3B8' }}>
                    {organ.subtitle}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Matching Doctors & Action Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {selectedOrgan === 'HEART' && (
              <>
                <div style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ fontSize: '2rem' }}>👨‍⚕️</div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#FFFFFF' }}>Dr. Alok Verma</span>
                            <span title="Verified NMC Practitioner" style={{ color: '#F59E0B', fontSize: '0.875rem' }}>🏅</span>
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>MD, DM (Cardiology) • AIIMS Delhi</div>
                          <div style={{ fontSize: '0.75rem', color: '#38BDF8', marginTop: '2px' }}>⚡ 14 Yrs Exp • 1,420+ Consultations</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#34D399' }}>₹800</div>
                        <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>per consult</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', margin: '14px 0', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#38BDF8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem' }}>Chest Tightness</span>
                      <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#38BDF8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem' }}>ECG / Echo Triage</span>
                      <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#38BDF8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem' }}>Hypertension</span>
                      <button
                        type="button"
                        onClick={() => setVideoPreviewDoctor({
                          name: 'Dr. Alok Verma',
                          speciality: 'Interventional Cardiology • AIIMS Delhi',
                          hospital: 'AIIMS Super Speciality Hospital Delhi',
                          fee: 800,
                          greeting: 'Namaste! I am Dr. Alok Verma, Senior Interventional Cardiologist. If you are experiencing acute chest pain, high BP spikes, or breathlessness, I am ready for instant live video consult to review your ECG.',
                          avatar: '👨‍⚕️'
                        })}
                        style={{
                          backgroundColor: 'rgba(139, 92, 246, 0.2)',
                          color: '#C084FC',
                          border: '1px solid rgba(139, 92, 246, 0.35)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        ▶️ Video Intro
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setBookingNotice('✅ Instant Tele-Consult Connected with Dr. Alok Verma (Room ID: #TEL-CARD-918). Audio/Video stream active.')}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>📞 Instant Video Call (Ready in 5m)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingNotice('🏥 In-Clinic Token Confirmed at AIIMS Delhi for Today 5:30 PM. Token #OPD-24 sent to your SMS.')}
                      style={{
                        backgroundColor: 'rgba(51, 65, 85, 0.7)',
                        color: '#E2E8F0',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <span>🏥 In-Clinic</span>
                    </button>
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ fontSize: '2rem' }}>👩‍⚕️</div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#FFFFFF' }}>Dr. Sunita Deshmukh</span>
                            <span title="Verified NMC Practitioner" style={{ color: '#F59E0B', fontSize: '0.875rem' }}>🏅</span>
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>Director, Cardiac Electrophysiology • Medanta</div>
                          <div style={{ fontSize: '0.75rem', color: '#38BDF8', marginTop: '2px' }}>⚡ 19 Yrs Exp • 890+ Angioplasties</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#34D399' }}>₹950</div>
                        <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>per consult</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', margin: '14px 0', flexWrap: 'wrap' }}>
                      <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#38BDF8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem' }}>Arrhythmia</span>
                      <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#38BDF8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem' }}>Pacemaker Check</span>
                      <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#38BDF8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem' }}>Palpitations</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setBookingNotice('✅ Instant Tele-Consult Connected with Dr. Sunita Deshmukh. Video session starting.')}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <span>📞 Instant Video Call (Ready in 8m)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingNotice('🏥 Slot Booked at Medanta Gurugram for Today 6:00 PM.')}
                      style={{
                        backgroundColor: 'rgba(51, 65, 85, 0.7)',
                        color: '#E2E8F0',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <span>🏥 In-Clinic</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {selectedOrgan === 'BRAIN' && (
              <div style={{
                backgroundColor: 'rgba(30, 41, 59, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ fontSize: '2rem' }}>👨‍⚕️</div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#FFFFFF' }}>Dr. Vivek Sengupta</span>
                          <span title="Verified NMC Practitioner" style={{ color: '#F59E0B', fontSize: '0.875rem' }}>🏅</span>
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>Chief Neurosurgeon • Apollo Delhi</div>
                        <div style={{ fontSize: '0.75rem', color: '#38BDF8', marginTop: '2px' }}>⚡ 22 Yrs Exp • 2,100+ Neuro Surgeries</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#34D399' }}>₹1,200</div>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>per consult</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', margin: '14px 0', flexWrap: 'wrap' }}>
                    <span style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#C084FC', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem' }}>Migraine & Cluster</span>
                    <span style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#C084FC', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem' }}>Spine Disc Herniation</span>
                    <span style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#C084FC', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem' }}>Vertigo Triage</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setBookingNotice('✅ Dr. Vivek Sengupta is LIVE now in virtual clinic room #NEURO-88. Starting HD consult.')}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <span>📞 Instant Video Call (Active Now)</span>
                  </button>
                </div>
              </div>
            )}

            {selectedOrgan === 'BONES' && (
              <div style={{
                backgroundColor: 'rgba(30, 41, 59, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ fontSize: '2rem' }}>👨‍⚕️</div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#FFFFFF' }}>Dr. Rajesh Malhotra</span>
                          <span title="Verified NMC Practitioner" style={{ color: '#F59E0B', fontSize: '0.875rem' }}>🏅</span>
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>MS (Ortho), Arthroscopy Specialist • Max Healthcare</div>
                        <div style={{ fontSize: '0.75rem', color: '#38BDF8', marginTop: '2px' }}>⚡ 16 Yrs Exp • 1,840+ Joint Replacements</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#34D399' }}>₹700</div>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>per consult</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', margin: '14px 0', flexWrap: 'wrap' }}>
                    <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#38BDF8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem' }}>Knee Osteoarthritis</span>
                    <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#38BDF8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem' }}>Lower Back Pain</span>
                    <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#38BDF8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem' }}>ACL Tear</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setBookingNotice('✅ Connected with Dr. Rajesh Malhotra for Orthopedic assessment.')}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <span>📞 Instant Video Call (Ready in 10m)</span>
                  </button>
                </div>
              </div>
            )}

            {selectedOrgan === 'PEDIATRICS' && (
              <div style={{
                backgroundColor: 'rgba(30, 41, 59, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ fontSize: '2rem' }}>👩‍⚕️</div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#FFFFFF' }}>Dr. Ananya Sen</span>
                          <span title="Verified NMC Practitioner" style={{ color: '#F59E0B', fontSize: '0.875rem' }}>🏅</span>
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>MD (Pediatrics) • Fortis Memorial</div>
                        <div style={{ fontSize: '0.75rem', color: '#38BDF8', marginTop: '2px' }}>⚡ 11 Yrs Exp • 1,290+ Child Consults</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#34D399' }}>₹650</div>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>per consult</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', margin: '14px 0', flexWrap: 'wrap' }}>
                    <span style={{ backgroundColor: 'rgba(244, 63, 94, 0.15)', color: '#FB7185', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem' }}>Child High Fever</span>
                    <span style={{ backgroundColor: 'rgba(244, 63, 94, 0.15)', color: '#FB7185', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem' }}>Newborn Colic</span>
                    <span style={{ backgroundColor: 'rgba(244, 63, 94, 0.15)', color: '#FB7185', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem' }}>Vaccination Chart</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setBookingNotice('✅ Pediatric emergency consultation connected with Dr. Ananya Sen.')}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <span>📞 Instant Pediatric Video Call</span>
                  </button>
                </div>
              </div>
            )}

            {selectedOrgan === 'EYES' && (
              <div style={{
                backgroundColor: 'rgba(30, 41, 59, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ fontSize: '2rem' }}>👩‍⚕️</div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#FFFFFF' }}>Dr. Priya Nair</span>
                          <span title="Verified NMC Practitioner" style={{ color: '#F59E0B', fontSize: '0.875rem' }}>🏅</span>
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>MS (Ophthalmology) • Sankara Nethralaya</div>
                        <div style={{ fontSize: '0.75rem', color: '#38BDF8', marginTop: '2px' }}>⚡ 13 Yrs Exp • 920+ Lasik & Retina Cases</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#34D399' }}>₹500</div>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>per consult</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', margin: '14px 0', flexWrap: 'wrap' }}>
                    <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#38BDF8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem' }}>Cataract Evaluation</span>
                    <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#38BDF8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem' }}>Digital Eye Strain</span>
                    <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#38BDF8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem' }}>Glaucoma Check</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setBookingNotice('✅ Eye Consultation session connected with Dr. Priya Nair.')}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <span>📞 Instant Video Consult</span>
                  </button>
                </div>
              </div>
            )}

            {selectedOrgan === 'PATHOLOGY' && (
              <div style={{
                backgroundColor: 'rgba(30, 41, 59, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ fontSize: '2rem' }}>🧪</div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#FFFFFF' }}>Tata 1mg & SRL Diagnostics Hub</span>
                          <span title="NABL ISO 15189 Certified" style={{ color: '#10B981', fontSize: '0.875rem' }}>🛡️</span>
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>NABL ISO 15189 Certified Lab • Roche Cobas 8000 Analyzers</div>
                        <div style={{ fontSize: '0.75rem', color: '#38BDF8', marginTop: '2px' }}>⚡ Phlebotomist at doorstep in 30 Mins</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#34D399' }}>₹499</div>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>84 Parameters</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', margin: '14px 0', flexWrap: 'wrap' }}>
                    <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem' }}>Complete Hemogram (CBC)</span>
                    <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem' }}>Lipid & Liver Profile</span>
                    <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem' }}>HbA1c & Fasting Sugar</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setBookingNotice('🧪 Phlebotomist dispatched! ETA 26 mins to your address. Barcode #SMP-9182 generated.')}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <span>⚡ Book 30-Min Home Blood Sample</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. LIVE INTERACTIVE COMMAND CENTER HUD PREVIEW */}
        <div id="ai-cdss" style={{ position: 'relative', top: '-120px', visibility: 'hidden' }} />
        <div id="abdm" style={{ position: 'relative', top: '-120px', visibility: 'hidden' }} />
        <div id="command-center" style={{
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(6, 182, 212, 0.15)',
          marginTop: '20px'
        }}>
          {/* HUD Top Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '16px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#E2E8F0', letterSpacing: '0.02em' }}>
                LIVE HOSPITAL COMMAND TELEMETRY • FORTIS APEX MEDICAL CENTER (HFR: IN0710002981)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8125rem' }}>
              <span style={{ color: '#10B981', fontWeight: 600 }}>🟢 Fastify Gateway: 18ms</span>
              <span style={{ color: '#38BDF8', fontWeight: 600 }}>🛡️ RLS Tenant: ACTIVE</span>
              <span style={{ color: '#A855F7', fontWeight: 600 }}>🔐 SHA-256 Audit: CHAINED</span>
            </div>
          </div>

          {/* HUD 4-Column Live KPI Metric Widgets */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* Widget 1: Inpatient Bed Census */}
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Live Bed Census</span>
                <span style={{ fontSize: '0.75rem', color: '#3B82F6', fontWeight: 700 }}>284 / 300 Beds</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '6px' }}>
                94.7% <span style={{ fontSize: '0.8125rem', color: '#10B981', fontWeight: 600 }}>↑ +2.4% Today</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '94.7%', height: '100%', background: 'linear-gradient(90deg, #3B82F6, #06B6D4)', borderRadius: '3px' }} />
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '6px' }}>
                ICU Occupancy: 96.2% • General Ward: 92.1%
              </div>
            </div>

            {/* Widget 2: Ambient Voice Scribe Active */}
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Ambient AI Scribe</span>
                <span style={{ fontSize: '0.75rem', color: '#A855F7', fontWeight: 700 }}>Active Stream</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '6px' }}>
                312 <span style={{ fontSize: '0.875rem', color: '#C084FC', fontWeight: 600 }}>Notes Today</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🎙️ Dr. Amit Sen (Cardiology)</span>
                <span style={{ backgroundColor: '#10B981', width: '6px', height: '6px', borderRadius: '50%' }} />
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '4px' }}>
                Auto ICD-10 & Rx Extraction Active
              </div>
            </div>

            {/* Widget 3: Sepsis NEWS2 Early Warning */}
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>CDSS Sepsis Radar</span>
                <span style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 700 }}>NEWS2 &gt;= 7 Alert</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '6px' }}>
                3 <span style={{ fontSize: '0.8125rem', color: '#EF4444', fontWeight: 600 }}>Active Alerts</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#FCA5A5', fontWeight: 500 }}>
                ⚠️ Bed ICU-04: Sepsis 6 Care Bundle Dispatched
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '4px' }}>
                RR: 26 • SpO2: 89% • Lactate: 3.8 mmol/L
              </div>
            </div>

            {/* Widget 4: ABDM National Health Stack */}
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>ABDM NHA Gateway</span>
                <span style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 700 }}>M1 • M2 • M3</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '6px' }}>
                1,420 <span style={{ fontSize: '0.8125rem', color: '#FCD34D', fontWeight: 600 }}>ABHA Linked</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#FDE68A', fontWeight: 500 }}>
                ⚡ Scan & Share Counter Queue: 14 Tokens
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '4px' }}>
                FHIR R4 Document Bundles: 100% Signed
              </div>
            </div>
          </div>

          {/* Interactive Feature Demo Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '12px',
            marginBottom: '16px',
            overflowX: 'auto'
          }}>
            {[
              { key: 'clinical', label: '🩺 Clinical Desk & EHR' },
              { key: 'ai_cdss', label: '🎙️ Ambient AI Scribe & CDSS' },
              { key: 'abdm', label: '🇮🇳 ABDM Digital Health Stack' },
              { key: 'operations', label: '🏥 OT, ER, Blood Bank & LIMS' },
              { key: 'security', label: '🔐 Multi-Tenant Security & Audit' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'clinical' | 'ai_cdss' | 'abdm' | 'operations' | 'security')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: activeTab === tab.key ? '1px solid #06B6D4' : '1px solid transparent',
                  backgroundColor: activeTab === tab.key ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                  color: activeTab === tab.key ? '#38BDF8' : '#94A3B8',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Preview Panel */}
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '20px',
            minHeight: '180px'
          }}>
            {activeTab === 'clinical' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#38BDF8', fontSize: '1rem', fontWeight: 700 }}>
                    ⚡ Sub-Second SOAP Consultation Engine
                  </h4>
                  <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    Doctors generate complete clinical encounters in under 4 minutes. Real-time ICD-10 diagnostic indexing, dose calculators, and digital sign-off with tamper-evident audit logs.
                  </p>
                </div>
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, marginBottom: '4px' }}>LIVE SIMULATION</div>
                  <div style={{ fontSize: '0.8125rem', color: '#F1F5F9', fontFamily: 'monospace' }}>
                    PATIENT: Kavita Joshi (MRN-2026-9041)<br/>
                    DX: I50.9 Heart Failure • I10 Essential HTN<br/>
                    RX: Torsemide 10mg OD • Telmisartan 80mg OD
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai_cdss' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#C084FC', fontSize: '1rem', fontWeight: 700 }}>
                    🎙️ Voice Dialogue to Structured Clinical EHR
                  </h4>
                  <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    Live acoustic stream parsing preserves clinical negations ("no chest pain"), extracts prescriptions, and executes real-time Category-X lethal drug-interaction checks (e.g. Warfarin + Clarithromycin block).
                  </p>
                </div>
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 700, marginBottom: '4px' }}>SAFETY GUARD ACTIVATED</div>
                  <div style={{ fontSize: '0.8125rem', color: '#FCA5A5', fontFamily: 'monospace' }}>
                    [BLOCKED] Warfarin 5mg + Clarithromycin 500mg<br/>
                    RISK: Major Upper GI Hemorrhage (CYP3A4/2C9)<br/>
                    STATUS: Overridden with mandatory MD audit justification
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'abdm' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#FCD34D', fontSize: '1rem', fontWeight: 700 }}>
                    🇮🇳 Ayushman Bharat Digital Mission (M1, M2, M3)
                  </h4>
                  <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    Native support for Aadhaar OTP e-KYC ABHA generation, rapid counter Scan & Share QR triage, electronic consent artefacts, and NRCES signed FHIR R4 document bundles.
                  </p>
                </div>
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 700, marginBottom: '4px' }}>NHA TELEMETRY SPEC</div>
                  <div style={{ fontSize: '0.8125rem', color: '#FDE68A', fontFamily: 'monospace' }}>
                    ABHA: 91-4421-8890-7714 (@abdm)<br/>
                    CARE CONTEXT: VISIT-OPD-2026-9041 (HIP Linked)<br/>
                    FHIR: NRCES India DocumentBundle (SHA-256 Signed)
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'operations' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#34D399', fontSize: '1rem', fontWeight: 700 }}>
                    🏥 Synchronized Core Hospital Logistics
                  </h4>
                  <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    Seamless integration between OT surgical scheduling (PAC clearance), Emergency triage (ESI 1-5), ISBT-128 blood bank inventory, and phlebotomy barcode scanning.
                  </p>
                </div>
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, marginBottom: '4px' }}>OPERATION THEATRE SUITE</div>
                  <div style={{ fontSize: '0.8125rem', color: '#A7F3D0', fontFamily: 'monospace' }}>
                    OT-1: Laparoscopic Cholecystectomy (PAC: FIT)<br/>
                    BLOOD BANK: 2 Units PRBC (O+ve) Reserved<br/>
                    PACU: Aldrete Score 9/10 • Ready for Post-Op Transfer
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#38BDF8', fontSize: '1rem', fontWeight: 700 }}>
                    🔐 Zero-Trust Healthcare Security & Multi-Tenancy
                  </h4>
                  <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    PostgreSQL 16 Row-Level Security (RLS) guarantees zero cross-tenant data leakage. Refresh token rotation, high-entropy JWT secrets, and tamper-evident SHA-256 hash chains.
                  </p>
                </div>
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700, marginBottom: '4px' }}>SECURITY AUDIT GATES</div>
                  <div style={{ fontSize: '0.8125rem', color: '#BAE6FD', fontFamily: 'monospace' }}>
                    TESTS: 312 / 312 Passed (100%)<br/>
                    TYPECHECK: 0 Errors (13 Projects)<br/>
                    ESLINT: 0 Warnings (--max-warnings=0)
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. 38-MODULE ENTERPRISE ECOSYSTEM DIRECTORY */}
      <section id="modules" style={{ padding: '60px 32px 80px 32px', maxWidth: '1360px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          border: '1.5px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '20px',
          padding: '36px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(56, 189, 248, 0.1)'
        }}>
          <div>
            <Badge variant="primary">COMPLETE 38-MODULE HOSPITAL SUITE</Badge>
            <h2 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.02em', margin: '14px 0 8px 0' }}>
              Tested the 10-Second Demo? Explore All 38 Modules
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '1rem', maxWidth: '720px', margin: 0, lineHeight: 1.5 }}>
              From Emergency Resuscitation and OT Anesthesia Scheduling to Blood Bank Cross-Match, DICOM PACS Web Viewer, Central FEFO Pharmacy, and ABDM M1–M3 Gateways — experience the complete enterprise platform.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a
              href="#simulator"
              style={{
                padding: '12px 22px',
                borderRadius: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid #38BDF8',
                color: '#38BDF8',
                fontSize: '0.875rem',
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>🎮 Re-test 10-Sec Simulator</span>
            </a>

            <a
              href={partnerPortalUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                color: '#FFFFFF',
                fontSize: '0.875rem',
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)'
              }}
            >
              <span>Launch 38-Module Partner Desk ➔</span>
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 🔄 5B. REAL-TIME SYNCHRONIZED HOSPITAL EVENT BUS PIPELINE VISUALIZER */}
      {/* ========================================================================= */}
      <section id="architecture" style={{ padding: '80px 32px', maxWidth: '1360px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <Badge variant="primary">SUB-50MS EVENT BUS ARCHITECTURE</Badge>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '16px 0 12px 0' }}>
            How Every Hospital Department Synchronizes in Real-Time
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '1.0625rem', maxWidth: '720px', margin: '0 auto' }}>
            From the moment a patient presents at OPD reception to ambient AI SOAP generation, diagnostic LIMS/PACS sync, FEFO pharmacy dispensing, and cashless ABDM billing — zero data silos.
          </p>
        </div>

        {/* 6-Stage Interactive Pipeline Ribbon */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '28px'
        }}>
          {[
            { step: 1, title: '1. OPD Doctor Desk', badge: 'Patient Intake', icon: '🩺', color: '#06B6D4' },
            { step: 2, title: '2. Ambient AI Scribe', badge: 'SOAP & CDSS', icon: '🎙️', color: '#8B5CF6' },
            { step: 3, title: '3. Diagnostics & PACS', badge: 'Analyzer Barcode', icon: '🧪', color: '#EC4899' },
            { step: 4, title: '4. Pharmacy & OT', badge: 'FEFO Dispense', icon: '💊', color: '#10B981' },
            { step: 5, title: '5. TPA Cashless Billing', badge: 'PM-JAY Pre-Auth', icon: '💳', color: '#F97316' },
            { step: 6, title: '6. ABDM Gateway', badge: 'NRCES Signed', icon: '🇮🇳', color: '#F59E0B' }
          ].map((s, idx) => {
            const isSelected = selectedPipelineStep === idx;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => setSelectedPipelineStep(idx)}
                style={{
                  backgroundColor: isSelected ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.65)',
                  border: isSelected ? `2px solid ${s.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  padding: '16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  boxShadow: isSelected ? `0 8px 24px -4px ${s.color}40` : 'none',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: `${s.color}20`,
                    color: s.color,
                    border: `1px solid ${s.color}40`
                  }}>
                    {s.badge}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F8FAFC' }}>
                  {s.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Stage Deep-Dive Card */}
        {(() => {
          const pipelineDetails = [
            {
              step: 1,
              name: 'OPD Clinical Desk & ABHA Token Intake',
              icon: '🩺',
              color: '#06B6D4',
              desc: 'Patient presents at reception counter, scans Counter QR code via Aarogya Setu / ABHA app. Token is instantly assigned to Doctor Queue. Doctor opens longitudinal EHR with instant allergy radar.',
              outboundEvent: 'EVENT_BUS_OPD_CONSULTATION_BEGUN',
              latency: '< 15ms',
              payload: {
                patientId: 'PAT-IND-2026-904',
                abhaAddress: 'rahul.sharma@abdm',
                queueToken: '#OPD-18',
                vitals: { bp: '138/88 mmHg', pulse: '76 bpm', spO2: '99%' }
              },
              downstream: 'Auto-triggers Ambient AI Audio Transcription and pre-loads lab test bundles.'
            },
            {
              step: 2,
              name: 'Ambient AI Voice Scribe & Lethal DDI Safety Intercept',
              icon: '🎙️',
              color: '#8B5CF6',
              desc: 'Microphone captures bilingual physician-patient conversation. Speech is parsed in real-time into Subjective, Objective, Assessment, and Plan (SOAP). Flags Sepsis NEWS2 triggers and lethal Drug-Drug Interactions before doctor signs.',
              outboundEvent: 'EVENT_BUS_AI_SCRIBE_SOAP_STRUCTURED',
              latency: '< 28ms',
              payload: {
                soapSummary: 'Patient presents with retrosternal tightness radiating to left arm.',
                icd10DualCoder: ['I20.9 (Angina pectoris)', 'I10 (Essential hypertension)'],
                cdssWarnings: 'Lethal DDI alert: Patient on Warfarin — Clopidogrel flagged for major bleed risk.',
                doctorApprovalStatus: 'PENDING_PHYSICIAN_DIGITAL_SIGN'
              },
              downstream: 'Sends electronic stat vacutainer orders directly to Pathology LIMS and RIS PACS.'
            },
            {
              step: 3,
              name: 'Diagnostic Pathology LIMS & RIS Web PACS',
              icon: '🧪',
              color: '#EC4899',
              desc: 'Phlebotomist scans vacutainer sample barcode. Bidirectional Mindray/Roche analyzer ingests rack ID, executes Troponin-I & Lipid profiles, and returns digital results. Web DICOM streams X-Rays directly to Doctor OPD desk.',
              outboundEvent: 'EVENT_BUS_LIMS_PANIC_RESULT_DISPATCHED',
              latency: '< 18ms',
              payload: {
                sampleBarcode: 'VAC-2026-88129',
                analyzersInterfaced: 'Mindray BS-800M (Bidirectional ASTM E1394)',
                panicAlertTriggered: true,
                troponinValue: '1.24 ng/mL (Reference: < 0.04 ng/mL - CRITICAL)',
                radiologistSignOff: 'Dr. Neha Kapoor (DMRD, DNB)'
              },
              downstream: 'Triggers automated SMS panic notification to Doctor and queues Emergency Resuscitation.'
            },
            {
              step: 4,
              name: 'Pharmacy FEFO Dispensing & Central Supply',
              icon: '💊',
              color: '#10B981',
              desc: 'Prescription routes digitally to Central Pharmacy. System automatically binds First-Expired-First-Out (FEFO) batch numbers, calculates exact unit-dose sachet barcodes, and updates inventory stock registers.',
              outboundEvent: 'EVENT_BUS_PHARMACY_FEFO_DISPENSE_LOCKED',
              latency: '< 20ms',
              payload: {
                prescriptionRef: 'RX-9821-DELHI',
                fefoBatchAssigned: 'BATCH-2026-X8 (Expires in 14 months)',
                scheduleHRegister: 'Logged with Doctor Reg #NMC-19820-A',
                unitDoseSachetId: 'SACH-881204',
                stockDepletion: 'Auto-debited from Central Vault'
              },
              downstream: 'Generates universal consolidated charge sheet into Universal Billing Engine.'
            },
            {
              step: 5,
              name: 'Universal Billing & PM-JAY Cashless Claims Engine',
              icon: '💳',
              color: '#F97316',
              desc: 'Universal ledger aggregates room charges, surgical theater hours, medications, and laboratory fees into an itemized transparent bill. Executes PM-JAY / TPA cashless insurance pre-auth workflow in real-time.',
              outboundEvent: 'EVENT_BUS_TPA_PREAUTH_COMMITTED',
              latency: '< 34ms',
              payload: {
                chargeAggregation: '100% Itemized (Consult: ₹800 + Labs: ₹2400 + Meds: ₹1850)',
                insuranceScheme: 'PM-JAY Golden Card Verified',
                cashlessPreAuthRef: 'PMJAY-AUTH-2026-99018',
                patientCoPayPayable: '₹0 (100% Cashless Coverage)'
              },
              downstream: 'Prepares FHIR R4 document bundle for ABDM electronic consent transfer.'
            },
            {
              step: 6,
              name: 'ABDM National Health Gateway & NRCES FHIR R4',
              icon: '🇮🇳',
              color: '#F59E0B',
              desc: 'Transforms consultation encounters, lab reports, and discharge summaries into NRCES India compliant FHIR R4 bundles. Signs with hospital private key, encrypts via ECDH (secp256r1), and links to patient ABHA PHR.',
              outboundEvent: 'EVENT_BUS_ABDM_FHIR_BUNDLE_SEALED',
              latency: '< 22ms',
              payload: {
                abhaHipCareContext: 'FORTIS-CARE-CTX-99120',
                bundleFormat: 'FHIR R4 DiagnosticReport + Condition + MedicationRequest',
                digitalSignature: 'SHA-256 with RSA-2048 HSM Private Key',
                ecdhEncryption: 'ECDH prime256v1 AES-GCM-256 compliant'
              },
              downstream: 'Patient accesses complete verified health record on any ABHA PHR mobile app nationwide.'
            }
          ];

          const current = pipelineDetails[selectedPipelineStep] || pipelineDetails[0];
          if (!current) return null;

          return (
            <div style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: `1.5px solid ${current.color}60`,
              borderRadius: '20px',
              padding: '32px',
              boxShadow: `0 20px 50px -15px ${current.color}25`,
              backdropFilter: 'blur(20px)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '16px',
                    backgroundColor: `${current.color}20`,
                    border: `1px solid ${current.color}50`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.25rem'
                  }}>
                    {current.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: current.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      EVENT BUS PIPELINE STAGE #{current.step}
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC', margin: '4px 0 0 0' }}>
                      {current.name}
                    </h3>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.8125rem',
                    color: '#34D399',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
                    Latency: {current.latency}
                  </div>
                  <div style={{
                    backgroundColor: `${current.color}15`,
                    border: `1px solid ${current.color}35`,
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.8125rem',
                    color: current.color,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>⚡</span>
                    <span>{current.outboundEvent.replace(/EVENT_BUS_/g, '').replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </div>

              <p style={{ color: '#CBD5E1', fontSize: '1rem', lineHeight: 1.6, margin: '0 0 24px 0' }}>
                {current.desc}
              </p>

              {/* Visual Department Activity & Live Metrics Card */}
              <div style={{
                backgroundColor: '#0A101D',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '20px',
                marginBottom: '20px',
                background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.9) 0%, rgba(10, 16, 29, 0.95) 100%)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: current.color,
                      boxShadow: `0 0 10px ${current.color}`,
                      display: 'inline-block'
                    }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F1F5F9', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Live Department Output & Verified Records
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '0.6875rem',
                      color: '#10B981',
                      fontWeight: 700,
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <span>✓</span> Cryptographically Verified (SHA-256)
                    </span>
                    <span style={{
                      fontSize: '0.6875rem',
                      color: '#38BDF8',
                      fontWeight: 700,
                      backgroundColor: 'rgba(56, 189, 248, 0.12)',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(56, 189, 248, 0.3)'
                    }}>
                      ⚡ Real-Time Sync
                    </span>
                  </div>
                </div>

                {/* Human-Friendly Visual Metric Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '12px'
                }}>
                  {Object.entries(current.payload).map(([key, val], pidx) => {
                    const label = key
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (str) => str.toUpperCase())
                      .trim();

                    const isBool = typeof val === 'boolean';
                    const isObj = typeof val === 'object' && val !== null && !Array.isArray(val);
                    const isArr = Array.isArray(val);

                    return (
                      <div
                        key={pidx}
                        style={{
                          backgroundColor: 'rgba(30, 41, 59, 0.45)',
                          border: '1px solid rgba(255, 255, 255, 0.07)',
                          borderRadius: '10px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '6px'
                        }}
                      >
                        <div style={{
                          fontSize: '0.6875rem',
                          color: '#94A3B8',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          letterSpacing: '0.04em'
                        }}>
                          {label}
                        </div>

                        {isBool ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.8125rem',
                              fontWeight: 700,
                              backgroundColor: val ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: val ? '#F87171' : '#34D399',
                              border: `1px solid ${val ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                            }}>
                              {val ? '🚨 Active (Panic Alert Flagged)' : '✓ Normal'}
                            </span>
                          </div>
                        ) : isObj ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {Object.entries(val as Record<string, string>).map(([vKey, vVal], vIdx) => (
                              <span
                                key={vIdx}
                                style={{
                                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                                  border: '1px solid rgba(56, 189, 248, 0.25)',
                                  color: '#BAE6FD',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  padding: '4px 8px',
                                  borderRadius: '6px'
                                }}
                              >
                                {vKey.toUpperCase()}: {vVal}
                              </span>
                            ))}
                          </div>
                        ) : isArr ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {(val as string[]).map((chip, cIdx) => (
                              <span
                                key={cIdx}
                                style={{
                                  backgroundColor: `${current.color}15`,
                                  border: `1px solid ${current.color}35`,
                                  color: '#F1F5F9',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  padding: '4px 8px',
                                  borderRadius: '6px'
                                }}
                              >
                                {chip}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div style={{
                            fontSize: '0.875rem',
                            color: String(val).includes('CRITICAL') || String(val).includes('Lethal')
                              ? '#FCA5A5'
                              : String(val).includes('Verified') || String(val).includes('Cashless')
                              ? '#6EE7B7'
                              : '#F8FAFC',
                            fontWeight: 600,
                            lineHeight: 1.4,
                            wordBreak: 'break-word'
                          }}>
                            {String(val)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.8125rem',
                color: '#94A3B8'
              }}>
                <span style={{ color: '#38BDF8', fontWeight: 700 }}>↳ Downstream Impact:</span>
                <span>{current.downstream}</span>
              </div>
            </div>
          );
        })()}
      </section>

      {/* 6. INTERACTIVE ROI & HOSPITAL CAPACITY CALCULATOR */}
      <AdaptiveRoiCalculator onOpenDemoModal={() => setShowDemoModal(true)} />

      {/* 7. ENTERPRISE SECURITY & COMPLIANCE SECTION */}
      <section id="security" style={{ padding: '80px 32px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Badge variant="primary">GOVERNANCE & TRUST</Badge>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '14px 0 8px 0' }}>
            Built for National Scale & Enterprise Security
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '1rem', maxWidth: '640px', margin: '0 auto' }}>
            DocSearch complies with international healthcare data governance standards, zero-trust access control, and cryptographic immutability.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px'
        }}>
          {[
            { title: 'Row-Level Security (RLS)', desc: 'PostgreSQL 16 tenant & branch isolation policies enforced at the database engine level.', icon: '🛡️' },
            { title: 'NRCES India FHIR R4', desc: 'Compliant clinical document bundles with cryptographic SHA-256 digital signatures.', icon: '🇮🇳' },
            { title: 'Tamper-Evident Audit', desc: 'Every clinical, financial, AI and hardware event is immutably hashed in a cryptographic chain.', icon: '⛓️' },
            { title: 'ECDH End-to-End Encryption', desc: 'Health information transfers use elliptic curve Diffie-Hellman (prime256v1) + AES-GCM-256.', icon: '🔐' }
          ].map((sec, sidx) => (
            <div key={sidx} style={{
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '24px',
              textAlign: 'left'
            }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '12px' }}>{sec.icon}</span>
              <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 8px 0' }}>{sec.title}</h4>
              <p style={{ fontSize: '0.8125rem', color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>{sec.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ❓ 7B. HEALTHCARE LEADERSHIP & CLINICAL PROCUREMENT FAQS */}
      {/* ========================================================================= */}
      <section id="faq" style={{ padding: '80px 32px', maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Badge variant="primary">CLINICAL & PROCUREMENT CLEARANCE</Badge>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '16px 0 12px 0' }}>
            Frequently Asked Questions by Medical Directors & CIOs
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '1.0625rem', maxWidth: '640px', margin: '0 auto' }}>
            Clear, authoritative technical answers on data sovereignty, offline continuity, hardware compatibility, and clinician safety.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            {
              q: 'Can DocSearch continue functioning offline if the hospital internet drops?',
              a: 'Yes, absolutely. DocSearch is engineered with edge-resident local database replicas. If WAN connectivity fails, doctors continue writing OPD notes, nurses chart bedside vitals in IPD/ICU, phlebotomists scan vacutainer barcodes, and pharmacy FEFO dispensing proceeds uninterrupted. Once the hospital connection restores, our conflict-free event bus synchronizes all offline records with the central cloud vault, sealing every transaction with an immutable SHA-256 cryptographic hash.'
            },
            {
              q: 'Does the Ambient AI Voice Scribe prescribe medications autonomously?',
              a: 'Strictly no. DocSearch adheres to a non-negotiable "Physician-in-the-Loop" clinical safety mandate. The Ambient AI Scribe transcribes acoustic consultation dialogue into structured SOAP notes and identifies potential lethal drug interactions (e.g. Warfarin + NSAID) or Sepsis NEWS2 scores. However, no prescription, medication dosage, or stat order can be committed without explicit digital stamp authentication and review by the licensed treating doctor.'
            },
            {
              q: 'How does DocSearch connect to existing hardware (Zebra scanners, thermal label printers, DICOM)?',
              a: 'DocSearch uses native browser WebUSB, WebSerial, and WebHID driver bindings. Handheld Zebra/Honeywell 2D barcode scanners, TSC/Zebra direct thermal ZPL II label printers, and clinical chemistry analyzers connect directly through browser-level ports without requiring cumbersome third-party agent software, Java applets, or print server hardware.'
            },
            {
              q: 'How easily can our hospital migrate historical patient records from our legacy software?',
              a: 'DocSearch provides automated data ingestion pipelines supporting CSV, Excel, JSON, and HL7 FHIR R4 imports. Our deployment engineering team extracts and sanitizes previous OPD consultation registries, IPD bed histories, and pharmacy stock ledgers within 48 hours, ensuring zero data loss and seamless continuity from Day 1.'
            },
            {
              q: 'What is the commercial model after the Pioneer Free Onboarding Phase (first 10,000 partners)?',
              a: 'The Pioneer Phase is a complimentary onboarding tier for the first 10,000 registered healthcare partners to experience the full foundational DocSearch Operating System. As your hospital scales or requires high-throughput advanced capabilities (multi-bed ICU telemetry streams, high-volume Web PACS cloud storage, dedicated enterprise ABDM gateways), transparent, scalable subscription tiers are available with zero restrictive multi-year lock-ins.'
            }
          ].map((faq, fidx) => {
            const isOpen = openFaqIndex === fidx;
            return (
              <div
                key={fidx}
                style={{
                  backgroundColor: isOpen ? 'rgba(30, 41, 59, 0.8)' : 'rgba(15, 23, 42, 0.6)',
                  border: isOpen ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  transition: 'all 0.25s ease'
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : fidx)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#F8FAFC',
                    fontSize: '1.0625rem',
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: 'pointer',
                    gap: '16px'
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{
                    fontSize: '1.25rem',
                    color: isOpen ? '#38BDF8' : '#94A3B8',
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.25s ease'
                  }}>
                    ▼
                  </span>
                </button>
                {isOpen && (
                  <div style={{
                    padding: '0 24px 20px 24px',
                    color: '#CBD5E1',
                    fontSize: '0.9375rem',
                    lineHeight: 1.6,
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    paddingTop: '16px'
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. FOOTER WITH LIVE PORTAL LINKS */}
      <footer style={{
        backgroundColor: '#040711',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '48px 32px 32px 32px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px', marginBottom: '40px' }}>
          <div>
            <DocSearchLogo
              variant="full"
              size="md"
              badgeText="ENTERPRISE OS"
              redirectUrl="/"
              style={{ marginBottom: '14px' }}
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
            <p style={{ color: '#64748B', fontSize: '0.8125rem', lineHeight: 1.5, margin: 0 }}>
              The unified cloud operating system powering multi-specialty hospitals, medical colleges, and healthcare networks across India.
            </p>
          </div>

          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '12px' }}>Portals</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
              <a href={partnerPortalUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#38BDF8', textDecoration: 'none' }}>Hospital Platform</a>
              <a href={companyPortalUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>Company SaaS HQ</a>
              <a href="/api/health" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>API Gateway Telemetry</a>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '12px' }}>Clinical Standards</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem', color: '#94A3B8' }}>
              <span>ABDM M1 / M2 / M3 Gateway</span>
              <span>NRCES India FHIR R4</span>
              <span>ICD-10-CM Coding Workbench</span>
              <span>ISBT-128 Transfusion Standard</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '12px' }}>Deployment</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem', color: '#94A3B8' }}>
              <span>PostgreSQL 16 + RLS</span>
              <span>Redis 7 Caching & PubSub</span>
              <span>Fastify High-Performance REST</span>
              <span>Docker & Kubernetes Ready</span>
            </div>
          </div>
        </div>

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.75rem',
          color: '#64748B'
        }}>
          <div>
            © 2026 DocSearch Technologies Inc. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security Whitepaper</span>
            <span>ABDM Trust Registry</span>
          </div>
        </div>
      </footer>

      {/* 9. VIP DEMO MODAL POPUP */}
      {showDemoModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(12px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0F172A',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '540px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            position: 'relative'
          }}>
            <button
              onClick={() => { setShowDemoModal(false); setDemoSubmitted(false); }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '1.25rem',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>

            {!demoSubmitted ? (
              <>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC', margin: '0 0 8px 0' }}>
                  Schedule VIP Hospital Walkthrough
                </h3>
                <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: '0 0 24px 0' }}>
                  Experience live clinical consultation, bed management, and ABDM sandbox workflows tailored to your facility.
                </p>

                <form onSubmit={handleDemoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>Hospital / Network Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Apollo / Fortis / AIIMS"
                      value={demoForm.hospitalName}
                      onChange={(e) => setDemoForm({ ...demoForm, hospitalName: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#F8FAFC', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>Contact Name</label>
                      <input
                        required
                        type="text"
                        placeholder="Dr. / Director Name"
                        value={demoForm.contactName}
                        onChange={(e) => setDemoForm({ ...demoForm, contactName: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#F8FAFC', fontSize: '0.875rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>Work Email</label>
                      <input
                        required
                        type="email"
                        placeholder="doctor@hospital.org"
                        value={demoForm.email}
                        onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#F8FAFC', fontSize: '0.875rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>Mobile Phone (10-Digit Mobile) *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: '12px', color: '#38BDF8', fontWeight: 800, fontSize: '0.875rem' }}>+91</span>
                      <input
                        required
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="98765 43210"
                        value={demoForm.phone}
                        onChange={(e) => {
                          let digits = e.target.value.replace(/\D/g, '');
                          if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
                          else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
                          setDemoForm({ ...demoForm, phone: digits.slice(0, 10) });
                        }}
                        style={{ width: '100%', padding: '10px 14px 10px 48px', borderRadius: '8px', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#F8FAFC', fontSize: '0.875rem', fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>Bed Capacity</label>
                    <select
                      value={demoForm.bedCapacity}
                      onChange={(e) => setDemoForm({ ...demoForm, bedCapacity: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#F8FAFC', fontSize: '0.875rem' }}
                    >
                      <option value="50-100 Beds">50–100 Beds (Community Hospital)</option>
                      <option value="100-300 Beds">100–300 Beds (Multi-Specialty)</option>
                      <option value="300-800 Beds">300–800 Beds (Tertiary Care Network)</option>
                      <option value="800+ Beds">800+ Beds (Teaching Hospital / Medical College)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    style={{
                      marginTop: '8px',
                      background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
                      color: '#FFFFFF',
                      padding: '12px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.9375rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Confirm & Schedule Session →
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎟️</div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981', margin: '0 0 6px 0' }}>
                  VIP Hospital Walkthrough Confirmed!
                </h3>
                <p style={{ color: '#94A3B8', fontSize: '0.875rem', lineHeight: 1.5, margin: '0 0 18px 0' }}>
                  Your dedicated session has been registered in the DocSearch Priority Queue for <strong>{demoForm.hospitalName}</strong>.
                </p>

                {/* VIP Pass Card */}
                <div style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.75)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'left',
                  marginBottom: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>VIP DEMO ACCESS PASS</span>
                    <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', fontSize: '0.6875rem', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px' }}>
                      PRIORITY DISPATCH
                    </span>
                  </div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#38BDF8', fontFamily: 'monospace' }}>
                    {generatedDemoToken}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#E2E8F0' }}>
                    <strong>Hospital:</strong> {demoForm.hospitalName} ({demoForm.bedCapacity})
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#E2E8F0' }}>
                    <strong>Contact:</strong> {demoForm.contactName} ({demoForm.phone})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px', marginTop: '4px' }}>
                    Assigned Lead Architect: <strong>MERAJ SHARIF (Enterprise Solutions HQ)</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a
                    href={`https://wa.me/919999999999?text=Hello%20DocSearch,%20I%20have%20booked%20a%20VIP%20Demo%20for%20${encodeURIComponent(demoForm.hospitalName)}%20with%20Token%20${generatedDemoToken}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      backgroundColor: '#25D366',
                      color: '#070B14',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.8125rem',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>💬 WhatsApp VIP Desk</span>
                  </a>
                  <button
                    onClick={() => { setShowDemoModal(false); setDemoSubmitted(false); }}
                    style={{
                      backgroundColor: 'rgba(30, 41, 59, 0.8)',
                      color: '#F8FAFC',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      cursor: 'pointer'
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔍 3. FLOATING CMD+K AI SPOTLIGHT SEARCH MODAL */}
      {/* ========================================================================= */}
      {showSpotlightModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(4, 7, 13, 0.85)',
          backdropFilter: 'blur(16px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '80px'
        }}>
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: '1.5px solid rgba(6, 182, 212, 0.4)',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '680px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(6, 182, 212, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Search Input Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              gap: '12px'
            }}>
              <span style={{ fontSize: '1.25rem' }}>🔍</span>
              <input
                type="text"
                autoFocus
                placeholder="Search symptoms, doctors, tests, or hospitals..."
                value={symptomSearchQuery}
                onChange={(e) => setSymptomSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: '#FFFFFF',
                  fontSize: '1.0625rem',
                  fontWeight: 500
                }}
              />
              <button
                type="button"
                onClick={() => setShowSpotlightModal(false)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#94A3B8',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                ESC
              </button>
            </div>

            {/* Quick Symptom Filter Chips */}
            <div style={{ padding: '14px 20px', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>
                Instant Symptom Suggestions
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { label: '🔥 High Viral Fever', organ: 'PEDIATRICS' as const },
                  { label: '💓 Sudden Chest Tightness', organ: 'HEART' as const },
                  { label: '🧠 Severe Migraine & Aura', organ: 'BRAIN' as const },
                  { label: '🦴 Knee Joint Arthritis', organ: 'BONES' as const },
                  { label: '🧪 Full Body Blood Test (84 Tests)', organ: 'PATHOLOGY' as const },
                  { label: '👁️ Blurry Vision & Eye Strain', organ: 'EYES' as const }
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => {
                      setSelectedOrgan(chip.organ);
                      setShowSpotlightModal(false);
                      setBookingNotice(`🔍 Filtered specialists for: "${chip.label}"`);
                    }}
                    style={{
                      backgroundColor: 'rgba(6, 182, 212, 0.15)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      color: '#38BDF8',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Search Matches List */}
            <div style={{ padding: '16px 20px', maxHeight: '300px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, marginBottom: '10px', textTransform: 'uppercase' }}>
                Top Verified Specialists Online Now
              </div>

              {[
                { name: 'Dr. Alok Verma', role: 'Chief Cardiologist • AIIMS Delhi', badge: '🟢 Active Now', fee: '₹800', organ: 'HEART' as const, avatar: '👨‍⚕️' },
                { name: 'Dr. Vivek Sengupta', role: 'Senior Neurosurgeon • Apollo Delhi', badge: '⚡ Video Ready', fee: '₹1,200', organ: 'BRAIN' as const, avatar: '👨‍⚕️' },
                { name: 'Dr. Ananya Sen', role: 'Pediatric Specialist • Fortis Memorial', badge: '🟢 Active Now', fee: '₹650', organ: 'PEDIATRICS' as const, avatar: '👩‍⚕️' },
                { name: 'Tata 1mg Diagnostic Hub', role: 'NABL ISO 15189 Molecular Lab', badge: '⚡ 30m Doorstep', fee: '₹499', organ: 'PATHOLOGY' as const, avatar: '🧪' }
              ].map((doc) => (
                <div
                  key={doc.name}
                  onClick={() => {
                    setSelectedOrgan(doc.organ);
                    setShowSpotlightModal(false);
                    setBookingNotice(`Connected with ${doc.name} via AI Spotlight.`);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(30, 41, 59, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    marginBottom: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{doc.avatar}</span>
                    <div>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#FFFFFF' }}>{doc.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{doc.role}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#34D399' }}>{doc.fee}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#38BDF8' }}>{doc.badge}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⭐ 4. DOCTOR VIDEO INTRO & AUDIO WAVEFORM PREVIEW MODAL */}
      {/* ========================================================================= */}
      {videoPreviewDoctor && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(4, 7, 13, 0.88)',
          backdropFilter: 'blur(20px)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: '1.5px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 30px 70px rgba(0, 0, 0, 0.9), 0 0 50px rgba(16, 185, 129, 0.3)',
            overflow: 'hidden'
          }}>
            {/* Simulated Live Camera Stream Area */}
            <div style={{
              height: '240px',
              backgroundColor: '#0A1120',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.15) 0%, rgba(7, 11, 20, 0.9) 100%)'
            }}>
              {/* Live Tag */}
              <div style={{
                position: 'absolute',
                top: '14px',
                left: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #EF4444',
                padding: '3px 10px',
                borderRadius: '9999px',
                color: '#F87171',
                fontSize: '0.6875rem',
                fontWeight: 700
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                HD STREAM READY
              </div>

              {/* Verified Badge */}
              <div style={{
                position: 'absolute',
                top: '14px',
                right: '16px',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid #10B981',
                padding: '3px 10px',
                borderRadius: '9999px',
                color: '#6EE7B7',
                fontSize: '0.6875rem',
                fontWeight: 700
              }}>
                🏅 Verified NMC Practitioner
              </div>

              {/* Avatar Animation */}
              <div style={{
                fontSize: '4.5rem',
                filter: 'drop-shadow(0 0 25px rgba(16, 185, 129, 0.5))',
                marginBottom: '8px'
              }}>
                {videoPreviewDoctor.avatar}
              </div>

              <div style={{ fontSize: '1.1875rem', fontWeight: 800, color: '#FFFFFF' }}>
                {videoPreviewDoctor.name}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                {videoPreviewDoctor.speciality}
              </div>

              {/* Animated Simulated Audio Waveform */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '12px',
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                padding: '4px 14px',
                borderRadius: '9999px'
              }}>
                <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>🎙️ Live Intro Speaking:</span>
                {[12, 24, 18, 28, 14, 22, 10, 26, 16].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      width: '3px',
                      height: `${h}px`,
                      backgroundColor: '#34D399',
                      borderRadius: '2px'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Doctor Greeting Content */}
            <div style={{ padding: '24px' }}>
              <div style={{
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700, marginBottom: '4px' }}>
                  💬 DOCTOR'S PERSONAL MESSAGE:
                </div>
                <p style={{ color: '#E2E8F0', fontSize: '0.875rem', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                  "{videoPreviewDoctor.greeting}"
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Consultation Fee</div>
                  <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#34D399' }}>₹{videoPreviewDoctor.fee}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Expected Response Time</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#38BDF8' }}>⚡ Under 5 Minutes</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const doc = videoPreviewDoctor;
                    setVideoPreviewDoctor(null);
                    setBookingNotice(`✅ Instant Video Call Connected with ${doc.name}! Entering encrypted consultation room.`);
                  }}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px',
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  🚀 Connect Live Video Call Now
                </button>
                <button
                  type="button"
                  onClick={() => setVideoPreviewDoctor(null)}
                  style={{
                    backgroundColor: 'rgba(51, 65, 85, 0.7)',
                    color: '#E2E8F0',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    padding: '12px 20px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified Healthcare Login & Self-Registration Modal */}
      <React.Suspense fallback={null}>
        {showLoginModal && (
          <UnifiedHealthcareLoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            partnerPortalUrl={partnerPortalUrl}
            companyPortalUrl={companyPortalUrl}
            initialTab={loginModalInitialTab}
          />
        )}

        {/* 24x7 AI Receptionist & Virtual Healthcare Concierge */}
        {!showLoginModal && !showFlashTakeover && (
          <AIReceptionistWidget
            isOpenExternal={isAiReceptionistOpen}
            onCloseExternal={() => setIsAiReceptionistOpen(false)}
            hideFloatingButton={true}
          />
        )}

        {/* 1st-Visit Full-Screen Launch Offer Flash Takeover Modal */}
        {showFlashTakeover && (
          <LaunchOfferFlashTakeoverModal
            isOpen={showFlashTakeover}
            onClose={handleCloseFlashTakeover}
            onClaimOffer={handleClaimFlashOffer}
            campaign={campaign}
            metrics={campaignMetrics}
          />
        )}
      </React.Suspense>

      {/* ✦ UNIFIED FLOATING ACTION CAPSULE ("Omni-Action Capsule") */}
      {!showLoginModal && !showFlashTakeover && !isAiReceptionistOpen && !showDemoModal && !showSpotlightModal && !videoPreviewDoctor && (
        <div
          ref={omniCapsuleRef}
          className="docsearch-omni-capsule"
        >
          {/* Expanded Capsule Quick Menu */}
          {isOmniCapsuleOpen && (
            <div
              className="docsearch-omni-menu"
            >
              <div style={{ padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  ✦ Quick Access Tools
                </span>
                <span style={{ fontSize: '0.625rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#6EE7B7', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  24x7 Active
                </span>
              </div>

              {/* 1. AI Receptionist Trigger */}
              <button
                type="button"
                onClick={() => {
                  setIsOmniCapsuleOpen(false);
                  setIsAiReceptionistOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(6, 182, 212, 0.12)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  color: '#F8FAFC',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.25)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.12)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.1rem' }}>🤖</span>
                  <div>
                    <div style={{ color: '#38BDF8', fontWeight: 700 }}>AI Receptionist (Dr. Aanya)</div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Ask OPD fees, ICU beds, booking</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.625rem', backgroundColor: '#10B981', color: '#070C16', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                  ONLINE
                </span>
              </button>

              {/* 2. AI Symptom & Specialist Search (Cmd+K) */}
              <button
                type="button"
                onClick={() => {
                  setIsOmniCapsuleOpen(false);
                  setShowSpotlightModal(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#F8FAFC',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.6)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.1rem' }}>🔍</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>AI Symptom & Doctor Search</div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Instant specialists & labs</div>
                  </div>
                </div>
                <kbd style={{ fontSize: '0.625rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.15)' }}>Cmd+K</kbd>
              </button>

              {/* 3. Live Emergency Bed Radar */}
              <button
                type="button"
                onClick={() => {
                  setIsOmniCapsuleOpen(false);
                  const el = document.getElementById('emergency');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#F8FAFC',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.1rem' }}>🚨</span>
                  <div>
                    <div style={{ color: '#F87171', fontWeight: 700 }}>Emergency Bed Radar</div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Real-time ICU & ventilator count</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.625rem', backgroundColor: '#EF4444', color: '#FFF', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                  LIVE
                </span>
              </button>

              {/* 4. Launch Offer & Referral */}
              {campaign.status === 'ACTIVE' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOmniCapsuleOpen(false);
                    setShowFlashTakeover(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    color: '#F8FAFC',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>🎁</span>
                    <div>
                      <div style={{ color: '#34D399', fontWeight: 700 }}>Claim ₹0 Launch Offer</div>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Up to ₹10,000 referral reward</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.625rem', backgroundColor: '#10B981', color: '#070C16', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                    ₹0
                  </span>
                </button>
              )}

              {/* 5. Book VIP Demo */}
              <button
                type="button"
                onClick={() => {
                  setIsOmniCapsuleOpen(false);
                  setShowDemoModal(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#F1F5F9',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.6)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.1rem' }}>⚡</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>Book VIP Hospital Demo</div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Interactive walkthrough with team</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#38BDF8' }}>➔</span>
              </button>

              {/* 6. Partner Portal Link */}
              <button
                type="button"
                onClick={() => {
                  setIsOmniCapsuleOpen(false);
                  openLoginModal();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#F1F5F9',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.6)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.1rem' }}>🏥</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>Partner & Doctor Portal</div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Login to clinical operations</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#38BDF8' }}>➔</span>
              </button>
            </div>
          )}

          {/* Collapsed Floating Pill */}
          <button
            type="button"
            onClick={() => setIsOmniCapsuleOpen((prev) => !prev)}
            style={{
              backgroundColor: '#0F172A',
              border: isOmniCapsuleOpen ? '1.5px solid #38BDF8' : '1.5px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '9999px',
              padding: '10px 18px',
              color: '#FFFFFF',
              fontSize: '0.8125rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(6, 182, 212, 0.3)',
              cursor: 'pointer',
              backdropFilter: 'blur(16px)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            title="DocSearch Quick Tools: AI Receptionist, Symptom Search, Bed Radar, Offers, Demo"
          >
            <span style={{ fontSize: '1.1rem', color: '#38BDF8' }}>✦</span>
            <span>Quick Tools</span>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 8px #10B981'
              }}
            />
            <span
              style={{
                fontSize: '0.6rem',
                color: '#94A3B8',
                transform: isOmniCapsuleOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
            >
              ▲
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
