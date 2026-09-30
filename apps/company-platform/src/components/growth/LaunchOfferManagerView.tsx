import React, { useState, useEffect, useMemo } from 'react';
import { Badge, Button, Card } from '@docsearch/ui-kit';
import {
  type PromotionalCampaignConfig,
  getPromotionalCampaign,
  fetchPromotionalCampaignRemote,
  savePromotionalCampaign,
  calculateCampaignMetrics,
  DEFAULT_PROMOTIONAL_CAMPAIGN,
  PROMOTIONAL_CAMPAIGN_EVENT
} from '@docsearch/shared-core';

export interface RegistrationFormFieldRules {
  ownerAadhaar: 'MANDATORY' | 'OPTIONAL' | 'HIDDEN';
  aadhaarDocUpload: 'MANDATORY' | 'OPTIONAL' | 'HIDDEN';
  clinicalLicense: 'MANDATORY' | 'OPTIONAL' | 'HIDDEN';
  licenseDocUpload: 'MANDATORY' | 'OPTIONAL' | 'HIDDEN';
  gstinNumber: 'MANDATORY' | 'OPTIONAL' | 'HIDDEN';
  bedCapacity: 'MANDATORY' | 'OPTIONAL' | 'HIDDEN';
  mobileWhatsapp: 'MANDATORY' | 'OPTIONAL';
  cityState: 'MANDATORY' | 'OPTIONAL';
  passwordCreation: 'MANDATORY' | 'AUTO_GENERATE';
}

export interface RegistrationFormPolicy {
  showPlanSelection: boolean;
  showModuleSelection?: boolean;
  allowAdvancePayment: boolean;
  defaultPlanTier: string;
  bannerNotice: string;
  allowedFacilityTypes: ('HOSPITAL' | 'CLINIC' | 'PATHOLOGY' | 'PHARMACY')[];
  availablePlans?: any[];
  fieldRules: RegistrationFormFieldRules;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_REGISTRATION_FORM_POLICY: RegistrationFormPolicy = {
  showPlanSelection: true,
  showModuleSelection: false,
  allowAdvancePayment: true,
  defaultPlanTier: 'GROWTH',
  bannerNotice: 'Pioneer Free Onboarding Environment • Complimentary Full Software Access',
  allowedFacilityTypes: ['HOSPITAL', 'CLINIC', 'PATHOLOGY', 'PHARMACY'],
  fieldRules: {
    ownerAadhaar: 'MANDATORY',
    aadhaarDocUpload: 'MANDATORY',
    clinicalLicense: 'MANDATORY',
    licenseDocUpload: 'MANDATORY',
    gstinNumber: 'OPTIONAL',
    bedCapacity: 'OPTIONAL',
    mobileWhatsapp: 'MANDATORY',
    cityState: 'MANDATORY',
    passwordCreation: 'MANDATORY'
  }
};

export const LaunchOfferManagerView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'LAUNCH_OFFER' | 'FORM_CUSTOMIZER'>('LAUNCH_OFFER');

  // Launch Offer State
  const [campaign, setCampaign] = useState<PromotionalCampaignConfig>(() => getPromotionalCampaign());
  const [realRegisteredCount, setRealRegisteredCount] = useState<number>(0);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Registration Form Policy State
  const [formPolicy, setFormPolicy] = useState<RegistrationFormPolicy>(DEFAULT_REGISTRATION_FORM_POLICY);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  // Sync campaign from backend API /api/v1/auth/launch-offer
  useEffect(() => {
    fetchPromotionalCampaignRemote().then((remote) => {
      if (remote) setCampaign(remote);
    }).catch(() => {});
  }, []);

  // Sync registration form policy from backend API /api/v1/auth/registration-form-config
  const fetchFormPolicy = async () => {
    try {
      const res = await fetch('/api/v1/auth/registration-form-config');
      if (res.ok) {
        const json = (await res.json()) as any;
        if (json && json.success && json.data) {
          setFormPolicy(json.data);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchFormPolicy();
  }, []);

  // Read actual registered partners from storage
  const loadRegisteredPartnersCount = () => {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('docsearch_registered_partners');
        const list = raw ? JSON.parse(raw) : [];
        setRealRegisteredCount(Array.isArray(list) ? list.length : 0);
      }
    } catch {
      setRealRegisteredCount(0);
    }
  };

  useEffect(() => {
    loadRegisteredPartnersCount();
    const handleCampaignSync = (e: any) => {
      if (e.detail) {
        setCampaign(e.detail);
      }
    };
    window.addEventListener(PROMOTIONAL_CAMPAIGN_EVENT, handleCampaignSync);
    return () => window.removeEventListener(PROMOTIONAL_CAMPAIGN_EVENT, handleCampaignSync);
  }, []);

  // Compute live metrics
  const metrics = useMemo(() => {
    return calculateCampaignMetrics(campaign, realRegisteredCount);
  }, [campaign, realRegisteredCount]);

  const triggerNotice = (msg: string) => {
    setSaveSuccessNotice(msg);
    setTimeout(() => setSaveSuccessNotice(null), 3500);
  };

  const handleSaveCampaign = (newConfig?: PromotionalCampaignConfig) => {
    const targetConfig = newConfig || campaign;
    savePromotionalCampaign(targetConfig);
    setCampaign(targetConfig);
    triggerNotice(
      targetConfig.status === 'PAUSED'
        ? '⏸️ Launch Offer PAUSED! It is now immediately hidden from Landing Page and Registration Modal.'
        : '🚀 Campaign settings saved and pushed live to Landing Page & Registration Modal!'
    );
  };

  const handleSavePolicy = async (customPolicy?: RegistrationFormPolicy) => {
    const targetPolicy = customPolicy || formPolicy;
    setIsSavingPolicy(true);
    try {
      const res = await fetch('/api/v1/auth/registration-form-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(targetPolicy)
      });
      if (res.ok) {
        const json = (await res.json()) as any;
        if (json && json.success && json.data) {
          setFormPolicy(json.data);
        }
        triggerNotice('✅ Registration Form Policy saved! Fields, rules, and banner notice published live.');
      } else {
        triggerNotice('⚠️ Failed to save form policy to server.');
      }
    } catch {
      triggerNotice('⚠️ Network error saving form policy.');
    } finally {
      setIsSavingPolicy(false);
    }
  };

  const setDatePreset = (daysFromNow: number) => {
    const target = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}T23:59`;
    setCampaign((prev) => ({ ...prev, offerEndDate: formatted }));
  };

  const setEndOfMonth = () => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const year = lastDay.getFullYear();
    const month = String(lastDay.getMonth() + 1).padStart(2, '0');
    const day = String(lastDay.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}T23:59`;
    setCampaign((prev) => ({ ...prev, offerEndDate: formatted }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: '#F8FAFC' }}>
      {/* Toast Alert */}
      {saveSuccessNotice && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 99999,
            backgroundColor: 'rgba(16, 185, 129, 0.95)',
            backdropFilter: 'blur(16px)',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
            fontSize: '0.875rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* Sub-Tab Navigation Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '16px 20px',
          backgroundColor: '#0F172A',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('LAUNCH_OFFER')}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: activeSubTab === 'LAUNCH_OFFER' ? '1.5px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
              backgroundColor: activeSubTab === 'LAUNCH_OFFER' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30, 41, 59, 0.6)',
              color: activeSubTab === 'LAUNCH_OFFER' ? '#38BDF8' : '#94A3B8',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🎯 1. Launch Offer & Quota Manager</span>
            <Badge
              variant={campaign.status === 'ACTIVE' ? 'success' : 'neutral'}
            >
              {campaign.status}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('FORM_CUSTOMIZER')}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: activeSubTab === 'FORM_CUSTOMIZER' ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
              backgroundColor: activeSubTab === 'FORM_CUSTOMIZER' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.6)',
              color: activeSubTab === 'FORM_CUSTOMIZER' ? '#6EE7B7' : '#94A3B8',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>⚙️ 2. Registration Form Customizer & Field Policy</span>
            <span style={{ fontSize: '0.6875rem', backgroundColor: '#065F46', color: '#FFF', padding: '2px 6px', borderRadius: '4px' }}>
              LIVE
            </span>
          </button>
        </div>

        {/* Status Indicator */}
        <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
          Portal Sync: <strong style={{ color: '#10B981' }}>Connected (Port 5174 ⇄ Port 5175 via API:4000)</strong>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: LAUNCH OFFER & SCARCITY QUOTA MANAGER                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'LAUNCH_OFFER' && (
        <>
          {/* Header Banner */}
          <div
            style={{
              borderRadius: '16px',
              padding: '20px 24px',
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
                }}
              >
                🎯
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF' }}>
                    Launch Offer & Limited Seats Quota Engine
                  </h2>
                  <Badge
                    variant={campaign.status === 'ACTIVE' ? 'success' : 'neutral'}
                    style={{
                      backgroundColor: campaign.status === 'ACTIVE' ? '#059669' : '#EF4444',
                      color: '#FFF',
                      fontWeight: 800
                    }}
                  >
                    ● {campaign.status === 'ACTIVE' ? 'LIVE ON WEBSITE' : 'PAUSED (HIDDEN FROM USERS)'}
                  </Badge>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
                  Manage early-bird free licenses, seats quota, promotional countdown timer, and live conversion urgency across the Landing Page.
                </p>
              </div>
            </div>

            {/* Top Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Button
                variant={campaign.status === 'ACTIVE' ? 'outline' : 'primary'}
                size="sm"
                onClick={() => {
                  const toggledStatus: 'ACTIVE' | 'PAUSED' = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
                  const updated: PromotionalCampaignConfig = { ...campaign, status: toggledStatus };
                  handleSaveCampaign(updated);
                }}
                style={{
                  fontWeight: 800,
                  backgroundColor: campaign.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.2)' : '#10B981',
                  borderColor: campaign.status === 'ACTIVE' ? '#EF4444' : '#10B981',
                  color: '#FFFFFF'
                }}
              >
                {campaign.status === 'ACTIVE' ? '⏸️ Pause Campaign (Hide Offer)' : '▶️ Activate Campaign (Show Offer)'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSaveCampaign()}
                style={{
                  backgroundColor: '#0284C7',
                  borderColor: '#38BDF8',
                  fontWeight: 800,
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                }}
              >
                🚀 Push Live to Portals
              </Button>
            </div>
          </div>

          {/* Real-Time Live KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {/* Card 1: Target Seats */}
            <Card>
              <div style={{ padding: '16px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                  🎯 Target Seats Quota
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF', marginTop: '4px' }}>
                  {campaign.targetSeats} Facilities
                </div>
                <div style={{ fontSize: '0.75rem', color: '#38BDF8', marginTop: '4px' }}>
                  Configured maximum free partner licenses
                </div>
              </div>
            </Card>

            {/* Card 2: Total Claimed */}
            <Card>
              <div style={{ padding: '16px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                  🔥 Total Claimed Seats
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>
                  {metrics.totalClaimed} / {metrics.totalTarget}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                  Baseline ({campaign.claimedBaseline}) + Real Signups ({realRegisteredCount})
                </div>
              </div>
            </Card>

            {/* Card 3: Remaining Seats */}
            <Card>
              <div style={{ padding: '16px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                  ⚡ Remaining Free Slots
                </div>
                <div
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 900,
                    color: metrics.remainingSeats <= 10 ? '#EF4444' : '#10B981',
                    marginTop: '4px'
                  }}
                >
                  {metrics.remainingSeats} Left
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                  {metrics.percentClaimed}% Filled ({metrics.isLocked ? 'Auto-Locked' : 'Open for Claims'})
                </div>
              </div>
            </Card>

            {/* Card 4: Countdown Time Left */}
            <Card>
              <div style={{ padding: '16px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                  ⏳ Offer Expiry Clock
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#38BDF8', marginTop: '8px', fontFamily: 'monospace' }}>
                  {metrics.daysLeft}d : {metrics.hoursLeft}h : {metrics.minutesLeft}m : {metrics.secondsLeft}s
                </div>
                <div style={{ fontSize: '0.75rem', color: metrics.isExpired ? '#EF4444' : '#34D399', marginTop: '4px' }}>
                  {metrics.isExpired ? 'Offer Expired' : 'Ticking Live to Target Date'}
                </div>
              </div>
            </Card>
          </div>

          {/* Offer Controls Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
            {/* Left Column: Promotion Details & Quota */}
            <Card title="1. Campaign Copy & Quota Configuration">
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                    Campaign Title
                  </label>
                  <input
                    type="text"
                    value={campaign.title}
                    onChange={(e) => setCampaign({ ...campaign, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#0F172A',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#FFFFFF',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                    Offer Subtitle & Value Proposition
                  </label>
                  <input
                    type="text"
                    value={campaign.subtitle}
                    onChange={(e) => setCampaign({ ...campaign, subtitle: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#0F172A',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#FFFFFF',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                {/* Seat Controls: Target + Baseline */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                      🎯 Target Free Seats
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={campaign.targetSeats}
                      onChange={(e) => setCampaign({ ...campaign, targetSeats: parseInt(e.target.value, 10) || 1 })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#0F172A',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#FFFFFF',
                        fontSize: '1rem',
                        fontWeight: 800
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                      📊 Baseline Claimed Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={campaign.targetSeats}
                      value={campaign.claimedBaseline}
                      onChange={(e) => setCampaign({ ...campaign, claimedBaseline: parseInt(e.target.value, 10) || 0 })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#0F172A',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        color: '#FFFFFF',
                        fontSize: '1rem',
                        fontWeight: 800
                      }}
                    />
                  </div>
                </div>

                {/* Auto Lock Checkbox */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    checked={campaign.autoLockOnTargetReached}
                    onChange={(e) => setCampaign({ ...campaign, autoLockOnTargetReached: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#0284C7' }}
                  />
                  <span style={{ fontSize: '0.8125rem', color: '#CBD5E1', fontWeight: 600 }}>
                    Auto-Lock & Revert to Paid Pricing once Target Seats reach 0
                  </span>
                </label>
              </div>
            </Card>

            {/* Right Column: Closing Date, Time & Promo Settings */}
            <Card title="2. Date & Benefit Terms">
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                    ⏰ Offer Closing Date & Time (IST)
                  </label>
                  <input
                    type="datetime-local"
                    value={campaign.offerEndDate.slice(0, 16)}
                    onChange={(e) => setCampaign({ ...campaign, offerEndDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#0F172A',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#FFFFFF',
                      fontSize: '0.9rem',
                      fontWeight: 700
                    }}
                  />
                </div>

                {/* Quick Date Presets */}
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
                    Quick Presets:
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setDatePreset(3)}
                      style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', backgroundColor: '#1E293B', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.2)', cursor: 'pointer' }}
                    >
                      +3 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setDatePreset(7)}
                      style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', backgroundColor: '#1E293B', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.2)', cursor: 'pointer' }}
                    >
                      +7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setDatePreset(14)}
                      style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', backgroundColor: '#1E293B', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.2)', cursor: 'pointer' }}
                    >
                      +14 Days
                    </button>
                    <button
                      type="button"
                      onClick={setEndOfMonth}
                      style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', backgroundColor: '#1E293B', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)', cursor: 'pointer' }}
                    >
                      End of Month
                    </button>
                  </div>
                </div>

                {/* Plan Stated Value & Promo Code */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                      Stated Value (₹)
                    </label>
                    <input
                      type="number"
                      value={campaign.originalPriceInr}
                      onChange={(e) => setCampaign({ ...campaign, originalPriceInr: parseInt(e.target.value, 10) || 0 })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#0F172A',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#FFFFFF',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                      Promo Code
                    </label>
                    <input
                      type="text"
                      value={campaign.promoCode}
                      onChange={(e) => setCampaign({ ...campaign, promoCode: e.target.value.toUpperCase() })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#0F172A',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#10B981',
                        fontSize: '0.875rem',
                        fontWeight: 800
                      }}
                    />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                    Free Validity Period
                  </label>
                  <select
                    value={campaign.durationMonths}
                    onChange={(e) => setCampaign({ ...campaign, durationMonths: parseInt(e.target.value, 10) || 12 })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#0F172A',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#FFFFFF',
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}
                  >
                    <option value={6}>6 Months Free Enterprise Access</option>
                    <option value={12}>12 Months (1 Full Year) Free Enterprise Access (Recommended)</option>
                    <option value={24}>24 Months (2 Full Years) Free Enterprise Access</option>
                    <option value={999}>Lifetime Free for Early Partners</option>
                  </select>
                </div>
              </div>
            </Card>
          </div>

          {/* 3. Partner Referral Bounty Structure Card */}
          <Card title="3. Partner Referral Bounty Program Structure">
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.875rem', color: '#CBD5E1' }}>
                  Live bounty disbursement rules across Partner Platform idle screensavers and registration onboarding:
                </span>
                <Badge variant="success">● Active Policy</Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1.5px solid #38BDF8', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.5rem' }}>🩺</span>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase' }}>
                        Doctor / Clinic Referral
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', marginTop: '2px' }}>
                        ₹10,000
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '8px', lineHeight: 1.4 }}>
                    Direct payout disbursed upon verified medical council registration & 30 active OPD consultations.
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', border: '1.5px solid #C084FC', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.5rem' }}>🔬</span>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#C084FC', textTransform: 'uppercase' }}>
                        Pathology Lab Referral
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', marginTop: '2px' }}>
                        ₹5,000
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '8px', lineHeight: 1.4 }}>
                    Direct payout disbursed upon verified lab registration & 50 accessioned patient samples.
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1.5px solid #34D399', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.5rem' }}>💊</span>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34D399', textTransform: 'uppercase' }}>
                        Pharmacy / Store Referral
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', marginTop: '2px' }}>
                        ₹5,000
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '8px', lineHeight: 1.4 }}>
                    Direct payout disbursed upon valid Drug License (Form 20/21) verification & inventory dispensing.
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#94A3B8', backgroundColor: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px', lineHeight: 1.4 }}>
                * <strong>Terms & Conditions Apply</strong>: All referral bounties are credited directly to the partner&apos;s registered bank account via NEFT/IMPS after regulatory license validation and active 30-day clinical usage. DOC SEARCH reserves the right to audit fraudulent submissions.
              </div>
            </div>
          </Card>

          {/* Live Preview Box */}
          <Card title="3. Live Landing Page Preview">
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                Status: {campaign.status === 'ACTIVE' ? (
                  <strong style={{ color: '#10B981' }}>Active & Displayed on Landing Page</strong>
                ) : (
                  <strong style={{ color: '#F87171' }}>Paused (Banner & Scarcity Card are completely hidden on Landing Page)</strong>
                )}
              </span>

              {campaign.status === 'ACTIVE' ? (
                <>
                  {/* Simulated Marquee */}
                  <div
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      background: 'linear-gradient(90deg, #1E1B4B 0%, #0F172A 50%, #1E1B4B 100%)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ backgroundColor: '#EF4444', color: '#FFF', fontSize: '0.625rem', fontWeight: 900, padding: '2px 6px', borderRadius: '4px' }}>
                        {campaign.badgeText}
                      </span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F8FAFC' }}>
                        {campaign.title}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#FCD34D', fontWeight: 700 }}>
                        ⏳ {metrics.daysLeft}d : {metrics.hoursLeft}h : {metrics.minutesLeft}m left
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 800 }}>
                        🎯 {metrics.totalClaimed}/{metrics.totalTarget} Seats Claimed ({metrics.remainingSeats} Left!)
                      </span>
                      <button
                        type="button"
                        style={{
                          backgroundColor: '#0284C7',
                          border: 'none',
                          color: '#FFF',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        Claim Free Seat ➔
                      </button>
                    </div>
                  </div>

                  {/* Simulated Scarcity Progress Bar */}
                  <div
                    style={{
                      backgroundColor: '#0F172A',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      padding: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '8px' }}>
                      <span style={{ color: '#F8FAFC' }}>Early-Bird Seats Allocation Progress</span>
                      <span style={{ color: '#38BDF8' }}>{metrics.percentClaimed}% Filled</span>
                    </div>
                    <div style={{ height: '10px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${metrics.percentClaimed}%`,
                          background: 'linear-gradient(90deg, #10B981 0%, #38BDF8 70%, #F59E0B 100%)',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94A3B8', marginTop: '8px' }}>
                      <span>{metrics.totalClaimed} Facilities Onboarded</span>
                      <span style={{ color: '#F59E0B', fontWeight: 700 }}>Only {metrics.remainingSeats} Free Licenses Left</span>
                    </div>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    padding: '24px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px dashed #EF4444',
                    textAlign: 'center',
                    color: '#FCA5A5'
                  }}
                >
                  <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '6px' }}>⏸️</span>
                  <strong>Campaign is Currently PAUSED</strong>
                  <p style={{ margin: '6px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
                    The launch marquee and scarcity cards are hidden on the landing page. Click <strong>"▶️ Activate Campaign"</strong> above to resume the offer.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: REGISTRATION FORM CUSTOMIZER & FIELD POLICY                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'FORM_CUSTOMIZER' && (
        <>
          {/* Header Banner */}
          <div
            style={{
              borderRadius: '16px',
              padding: '20px 24px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10B981 0%, #0284C7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                }}
              >
                ⚙️
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF' }}>
                  Universal Registration Form Customizer
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
                  Make form fields mandatory, optional, or hidden. Control KYC rules, banner announcements, and self-checkout behavior on <code>http://localhost:5175/</code>.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => handleSavePolicy()}
              disabled={isSavingPolicy}
              style={{
                backgroundColor: '#10B981',
                borderColor: '#34D399',
                fontWeight: 800,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              {isSavingPolicy ? 'Saving...' : '💾 Save & Publish Form Policy Live'}
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
            {/* Field Requirement Rules Table */}
            <Card title="1. Form Field Rules (Mandatory / Optional / Hidden)">
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                  Choose requirement level for each registration step. Changes immediately adapt the registration modal on the landing page:
                </span>

                {[
                  {
                    key: 'ownerAadhaar',
                    label: '🪪 Owner Aadhaar Number',
                    desc: '12-digit Indian national identity verification',
                    options: ['MANDATORY', 'OPTIONAL', 'HIDDEN']
                  },
                  {
                    key: 'aadhaarDocUpload',
                    label: '📎 Aadhaar Card File Upload',
                    desc: 'PDF/PNG/JPG front & back identity proof',
                    options: ['MANDATORY', 'OPTIONAL', 'HIDDEN']
                  },
                  {
                    key: 'clinicalLicense',
                    label: '📜 Clinical / Medical Council License Number',
                    desc: 'NMC / CEA / Drug License number according to category',
                    options: ['MANDATORY', 'OPTIONAL', 'HIDDEN']
                  },
                  {
                    key: 'licenseDocUpload',
                    label: '📎 License Certificate Upload',
                    desc: 'Regulatory registration certificate PDF / scan',
                    options: ['MANDATORY', 'OPTIONAL', 'HIDDEN']
                  },
                  {
                    key: 'gstinNumber',
                    label: '🏢 GSTIN Tax Number',
                    desc: '15-digit Goods & Services Tax identification',
                    options: ['MANDATORY', 'OPTIONAL', 'HIDDEN']
                  },
                  {
                    key: 'bedCapacity',
                    label: '🛏️ Inpatient Bed Capacity',
                    desc: 'Relevant for hospitals and daycare centers',
                    options: ['MANDATORY', 'OPTIONAL', 'HIDDEN']
                  },
                  {
                    key: 'mobileWhatsapp',
                    label: '📱 WhatsApp Mobile Contact',
                    desc: 'Direct dispatch of verification OTP and panel credentials',
                    options: ['MANDATORY', 'OPTIONAL']
                  },
                  {
                    key: 'cityState',
                    label: '📍 City & State Location',
                    desc: 'Geographic facility mapping',
                    options: ['MANDATORY', 'OPTIONAL']
                  },
                  {
                    key: 'passwordCreation',
                    label: '🔑 Admin Password Policy',
                    desc: 'User sets password OR system auto-generates credentials',
                    options: ['MANDATORY', 'AUTO_GENERATE']
                  }
                ].map((item) => {
                  const currentValue = (formPolicy.fieldRules as any)[item.key];
                  return (
                    <div
                      key={item.key}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: '#0B132B',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                          {item.desc}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        {item.options.map((opt) => {
                          const isSelected = currentValue === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setFormPolicy({
                                  ...formPolicy,
                                  fieldRules: {
                                    ...formPolicy.fieldRules,
                                    [item.key]: opt
                                  }
                                });
                              }}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '0.6875rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                border: isSelected
                                  ? opt === 'MANDATORY'
                                    ? '1.5px solid #EF4444'
                                    : opt === 'HIDDEN'
                                    ? '1.5px solid #64748B'
                                    : '1.5px solid #10B981'
                                  : '1px solid rgba(255,255,255,0.1)',
                                backgroundColor: isSelected
                                  ? opt === 'MANDATORY'
                                    ? 'rgba(239, 68, 68, 0.25)'
                                    : opt === 'HIDDEN'
                                    ? 'rgba(100, 116, 139, 0.25)'
                                    : 'rgba(16, 185, 129, 0.25)'
                                  : '#0F172A',
                                color: isSelected
                                  ? opt === 'MANDATORY'
                                    ? '#FCA5A5'
                                    : opt === 'HIDDEN'
                                    ? '#94A3B8'
                                    : '#6EE7B7'
                                  : '#64748B'
                              }}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Form Experience & Notices */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Card title="2. Form Experience & Commercial Behavior">
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Banner Notice */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                      Form Header Announcement Banner Text
                    </label>
                    <textarea
                      rows={3}
                      value={formPolicy.bannerNotice}
                      onChange={(e) => setFormPolicy({ ...formPolicy, bannerNotice: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#0F172A',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#FFFFFF',
                        fontSize: '0.8125rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Plan Selection Mode */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formPolicy.showPlanSelection}
                      onChange={(e) => setFormPolicy({ ...formPolicy, showPlanSelection: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: '#10B981' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F8FAFC' }}>
                        Enable Subscription Plan Selection
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        If enabled, registering partner chooses their tier. If disabled, Option 1 Pure B2B is used (Founder assigns tier post-KYC).
                      </div>
                    </div>
                  </label>

                  {/* Allow Advance Payment */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formPolicy.allowAdvancePayment}
                      onChange={(e) => setFormPolicy({ ...formPolicy, allowAdvancePayment: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: '#10B981' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F8FAFC' }}>
                        Allow Fast-Track Advance Self-Checkout
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        Display Option 3 (Razorpay / UPI sandbox advance fee payment during onboarding).
                      </div>
                    </div>
                  </label>

                  {/* Allowed Facility Types */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                      Allowed Facility Categories for Registration
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {[
                        { id: 'HOSPITAL', label: '🏥 Hospital' },
                        { id: 'CLINIC', label: '🩺 Clinic' },
                        { id: 'PATHOLOGY', label: '🧪 Pathology' },
                        { id: 'PHARMACY', label: '💊 Pharmacy' }
                      ].map((cat) => {
                        const isChecked = formPolicy.allowedFacilityTypes.includes(cat.id as any);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              const exists = formPolicy.allowedFacilityTypes.includes(cat.id as any);
                              const updated = exists
                                ? formPolicy.allowedFacilityTypes.filter((t) => t !== cat.id)
                                : [...formPolicy.allowedFacilityTypes, cat.id as any];
                              if (updated.length > 0) {
                                setFormPolicy({ ...formPolicy, allowedFacilityTypes: updated });
                              }
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: isChecked ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                              backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.2)' : '#0F172A',
                              color: isChecked ? '#6EE7B7' : '#94A3B8'
                            }}
                          >
                            {cat.label} {isChecked ? '✓' : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Live Form Simulator Preview */}
              <Card title="3. Live Form Simulator Preview">
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      fontSize: '0.75rem',
                      color: '#6EE7B7'
                    }}
                  >
                    📢 <strong>Notice:</strong> {formPolicy.bannerNotice}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    Active Fields on Landing Page:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.75rem' }}>
                    <div>Facility Name: <strong style={{ color: '#EF4444' }}>* Mandatory</strong></div>
                    <div>Owner Name: <strong style={{ color: '#EF4444' }}>* Mandatory</strong></div>
                    <div>Email: <strong style={{ color: '#EF4444' }}>* Mandatory</strong></div>
                    <div>Mobile: <strong style={{ color: formPolicy.fieldRules.mobileWhatsapp === 'MANDATORY' ? '#EF4444' : '#10B981' }}>{formPolicy.fieldRules.mobileWhatsapp}</strong></div>
                    <div>City/State: <strong style={{ color: formPolicy.fieldRules.cityState === 'MANDATORY' ? '#EF4444' : '#10B981' }}>{formPolicy.fieldRules.cityState}</strong></div>
                    <div>License No.: <strong style={{ color: formPolicy.fieldRules.clinicalLicense === 'HIDDEN' ? '#64748B' : formPolicy.fieldRules.clinicalLicense === 'MANDATORY' ? '#EF4444' : '#10B981' }}>{formPolicy.fieldRules.clinicalLicense}</strong></div>
                    <div>License Doc: <strong style={{ color: formPolicy.fieldRules.licenseDocUpload === 'HIDDEN' ? '#64748B' : formPolicy.fieldRules.licenseDocUpload === 'MANDATORY' ? '#EF4444' : '#10B981' }}>{formPolicy.fieldRules.licenseDocUpload}</strong></div>
                    <div>Aadhaar KYC: <strong style={{ color: formPolicy.fieldRules.ownerAadhaar === 'HIDDEN' ? '#64748B' : formPolicy.fieldRules.ownerAadhaar === 'MANDATORY' ? '#EF4444' : '#10B981' }}>{formPolicy.fieldRules.ownerAadhaar}</strong></div>
                    <div>Aadhaar Doc: <strong style={{ color: formPolicy.fieldRules.aadhaarDocUpload === 'HIDDEN' ? '#64748B' : formPolicy.fieldRules.aadhaarDocUpload === 'MANDATORY' ? '#EF4444' : '#10B981' }}>{formPolicy.fieldRules.aadhaarDocUpload}</strong></div>
                    <div>GSTIN: <strong style={{ color: formPolicy.fieldRules.gstinNumber === 'HIDDEN' ? '#64748B' : formPolicy.fieldRules.gstinNumber === 'MANDATORY' ? '#EF4444' : '#10B981' }}>{formPolicy.fieldRules.gstinNumber}</strong></div>
                    <div>Bed Capacity: <strong style={{ color: formPolicy.fieldRules.bedCapacity === 'HIDDEN' ? '#64748B' : formPolicy.fieldRules.bedCapacity === 'MANDATORY' ? '#EF4444' : '#10B981' }}>{formPolicy.fieldRules.bedCapacity}</strong></div>
                    <div>Password: <strong style={{ color: formPolicy.fieldRules.passwordCreation === 'MANDATORY' ? '#EF4444' : '#38BDF8' }}>{formPolicy.fieldRules.passwordCreation}</strong></div>
                    <div>Plan Selection: <strong style={{ color: formPolicy.showPlanSelection ? '#10B981' : '#64748B' }}>{formPolicy.showPlanSelection ? 'ENABLED' : 'DISABLED'}</strong></div>
                    <div>Advance Payment: <strong style={{ color: formPolicy.allowAdvancePayment ? '#10B981' : '#64748B' }}>{formPolicy.allowAdvancePayment ? 'ENABLED' : 'DISABLED'}</strong></div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Sticky Bottom Save Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#0B1120',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '12px',
          padding: '14px 20px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
          {activeSubTab === 'LAUNCH_OFFER' ? (
            <>
              Last saved by: <strong style={{ color: '#CBD5E1' }}>{campaign.updatedBy}</strong> • Status:{' '}
              <strong style={{ color: campaign.status === 'ACTIVE' ? '#10B981' : '#F87171' }}>{campaign.status}</strong>
            </>
          ) : (
            <>
              Registration Policy: <strong style={{ color: '#10B981' }}>Live Synchronized with Port 5175</strong>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {activeSubTab === 'LAUNCH_OFFER' ? (
            <>
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  if (window.confirm('Reset offer to original launch defaults?')) {
                    handleSaveCampaign(DEFAULT_PROMOTIONAL_CAMPAIGN);
                  }
                }}
              >
                🔄 Reset to Defaults
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleSaveCampaign()}
                style={{
                  backgroundColor: '#0284C7',
                  borderColor: '#38BDF8',
                  fontWeight: 800,
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                }}
              >
                🚀 Save & Push Live to Website
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={() => handleSavePolicy()}
              disabled={isSavingPolicy}
              style={{
                backgroundColor: '#10B981',
                borderColor: '#34D399',
                fontWeight: 800,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              {isSavingPolicy ? 'Publishing...' : '💾 Save & Publish Form Policy Live'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
