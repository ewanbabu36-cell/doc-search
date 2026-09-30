import React, { useState } from 'react';
import { Badge, Button, DocSearchSpatialCore3D } from '@docsearch/ui-kit';
import { HyperlocalClinicSeoRankView } from './HyperlocalClinicSeoRankView.js';
import { DoctorAffiliateReferralEngineView } from './DoctorAffiliateReferralEngineView.js';
import { HospitalWhiteLabelStudioView } from './HospitalWhiteLabelStudioView.js';
import { AiPriceElasticityRecommenderView } from './AiPriceElasticityRecommenderView.js';
import { MultiCurrencyGeoPricingView } from './MultiCurrencyGeoPricingView.js';
import { PlanAbTestingEngineView } from './PlanAbTestingEngineView.js';
import { B2bCorporateWellnessCustomizerView } from './B2bCorporateWellnessCustomizerView.js';
import { LaunchOfferManagerView } from './LaunchOfferManagerView.js';

export interface CarePlan {
  id: string;
  name: string;
  badge: string;
  category: 'FAMILY' | 'INDIVIDUAL' | 'CHRONIC' | 'CORPORATE';
  priceInr: number;
  durationMonths: number;
  freeConsults: number;
  labDiscountPercent: number;
  pharmacyDiscountPercent: number;
  freeHomeCollection: boolean;
  freeExpressDelivery: boolean;
  priorityQueue: boolean;
  doctorPayoutPerConsult: number;
  labMarginPercent: number;
  pharmacyMarginPercent: number;
  status: 'ACTIVE' | 'PAUSED' | 'DRAFT';
  activeSubscribers: number;
}

export const DEFAULT_CARE_PLANS: CarePlan[] = [
  {
    id: 'PLAN-01',
    name: 'Silver Essential Pass',
    badge: 'Individual (1 Person)',
    category: 'INDIVIDUAL',
    priceInr: 299,
    durationMonths: 12,
    freeConsults: 1,
    labDiscountPercent: 15,
    pharmacyDiscountPercent: 15,
    freeHomeCollection: true,
    freeExpressDelivery: false,
    priorityQueue: false,
    doctorPayoutPerConsult: 180,
    labMarginPercent: 25,
    pharmacyMarginPercent: 15,
    status: 'ACTIVE',
    activeSubscribers: 0
  },
  {
    id: 'PLAN-02',
    name: 'Gold Family Care Pass',
    badge: 'Family of 4 (Best Seller)',
    category: 'FAMILY',
    priceInr: 799,
    durationMonths: 12,
    freeConsults: 3,
    labDiscountPercent: 25,
    pharmacyDiscountPercent: 20,
    freeHomeCollection: true,
    freeExpressDelivery: true,
    priorityQueue: true,
    doctorPayoutPerConsult: 220,
    labMarginPercent: 30,
    pharmacyMarginPercent: 18,
    status: 'ACTIVE',
    activeSubscribers: 0
  },
  {
    id: 'PLAN-03',
    name: 'Platinum Chronic Senior Care',
    badge: 'Elderly & Chronic (2 Seniors)',
    category: 'CHRONIC',
    priceInr: 1499,
    durationMonths: 12,
    freeConsults: 6,
    labDiscountPercent: 30,
    pharmacyDiscountPercent: 22,
    freeHomeCollection: true,
    freeExpressDelivery: true,
    priorityQueue: true,
    doctorPayoutPerConsult: 280,
    labMarginPercent: 35,
    pharmacyMarginPercent: 20,
    status: 'ACTIVE',
    activeSubscribers: 0
  }
];

export type GrowthTabId =
  | 'LAUNCH_OFFER_CONTROLLER'
  | 'PLAN_STUDIO'
  | 'AI_ELASTICITY'
  | 'MULTI_CURRENCY_GEO'
  | 'AB_TESTING'
  | 'B2B_CORPORATE'
  | 'WHITE_LABEL'
  | 'SEO_BOOSTER'
  | 'AFFILIATE_ENGINE'
  | 'OVERVIEW'
  | 'BROADCAST_CAMPAIGNS'
  | 'PARTNER_PAYOUTS';

export type GrowthCategory =
  | 'PLANS_PRICING'
  | 'B2B_ENTERPRISE'
  | 'ACQUISITION_SEO'
  | 'REVENUE_SETTLEMENTS';

interface GrowthCategoryConfig {
  id: GrowthCategory;
  label: string;
  icon: string;
  badge: string;
  defaultTab: GrowthTabId;
  tabIds: GrowthTabId[];
  tools: {
    id: GrowthTabId;
    label: string;
    icon: string;
    badge?: string;
  }[];
}

const GROWTH_CATEGORIES: GrowthCategoryConfig[] = [
  {
    id: 'PLANS_PRICING',
    label: 'Plans & Launch Offers',
    icon: '🏷️',
    badge: '5 Tools',
    defaultTab: 'LAUNCH_OFFER_CONTROLLER',
    tabIds: ['LAUNCH_OFFER_CONTROLLER', 'PLAN_STUDIO', 'AI_ELASTICITY', 'MULTI_CURRENCY_GEO', 'AB_TESTING'],
    tools: [
      { id: 'LAUNCH_OFFER_CONTROLLER', label: 'Launch Offer & Seats Controller', icon: '🔥', badge: 'FOMO Engine' },
      { id: 'PLAN_STUDIO', label: 'Plan Studio & Customizer', icon: '⚙️', badge: 'Live Editor' },
      { id: 'AI_ELASTICITY', label: 'AI Dynamic Price Elasticity', icon: '🤖', badge: 'AI Model' },
      { id: 'MULTI_CURRENCY_GEO', label: 'Multi-Currency Geo-Pricing', icon: '🌐', badge: 'Global' },
      { id: 'AB_TESTING', label: 'A/B Testing & Price Split', icon: '📊', badge: 'v1 vs v2' }
    ]
  },
  {
    id: 'B2B_ENTERPRISE',
    label: 'B2B & White-Label',
    icon: '🏢',
    badge: '2 Tools',
    defaultTab: 'B2B_CORPORATE',
    tabIds: ['B2B_CORPORATE', 'WHITE_LABEL'],
    tools: [
      { id: 'B2B_CORPORATE', label: 'B2B Corporate Wellness & Invoicing', icon: '🏢', badge: 'GST B2B' },
      { id: 'WHITE_LABEL', label: 'Hospital White-Label Studio', icon: '🎨', badge: 'Custom Portals' }
    ]
  },
  {
    id: 'ACQUISITION_SEO',
    label: 'Acquisition & Marketing',
    icon: '🚀',
    badge: '3 Tools',
    defaultTab: 'SEO_BOOSTER',
    tabIds: ['SEO_BOOSTER', 'AFFILIATE_ENGINE', 'BROADCAST_CAMPAIGNS'],
    tools: [
      { id: 'SEO_BOOSTER', label: 'Hyperlocal Clinic SEO', icon: '📍', badge: 'Page 1 Google' },
      { id: 'AFFILIATE_ENGINE', label: 'Doctor Affiliate Referral Engine', icon: '🔗', badge: 'Referrals' },
      { id: 'BROADCAST_CAMPAIGNS', label: 'City-Wide WhatsApp Broadcast', icon: '📢', badge: 'Mass Blast' }
    ]
  },
  {
    id: 'REVENUE_SETTLEMENTS',
    label: 'Revenue & Settlements',
    icon: '💰',
    badge: '2 Tools',
    defaultTab: 'OVERVIEW',
    tabIds: ['OVERVIEW', 'PARTNER_PAYOUTS'],
    tools: [
      { id: 'OVERVIEW', label: 'Network GMV & Growth KPIs', icon: '📊', badge: '15% Net Take' },
      { id: 'PARTNER_PAYOUTS', label: 'Partner Settlements Board', icon: '💸', badge: 'Escrow UPI' }
    ]
  }
];

function getCategoryForGrowthTab(tabId: GrowthTabId): GrowthCategory {
  if (['LAUNCH_OFFER_CONTROLLER', 'PLAN_STUDIO', 'AI_ELASTICITY', 'MULTI_CURRENCY_GEO', 'AB_TESTING'].includes(tabId)) {
    return 'PLANS_PRICING';
  }
  if (['B2B_CORPORATE', 'WHITE_LABEL'].includes(tabId)) {
    return 'B2B_ENTERPRISE';
  }
  if (['SEO_BOOSTER', 'AFFILIATE_ENGINE', 'BROADCAST_CAMPAIGNS'].includes(tabId)) {
    return 'ACQUISITION_SEO';
  }
  return 'REVENUE_SETTLEMENTS';
}

export interface CompanyGrowthEngineDomainManagerProps {
  currentUserRole?: string | undefined;
  currentUserName?: string | undefined;
  currentUserEmail?: string | undefined;
}

export const CompanyGrowthEngineDomainManager: React.FC<CompanyGrowthEngineDomainManagerProps> = ({
  currentUserRole = 'SUPER_ADMIN',
  currentUserName = 'MERAJ SHARIF',
  currentUserEmail = 'founder@docsearch.health'
}) => {
  const [activeTab, setActiveTab] = useState<GrowthTabId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('docsearch_growth_tab') as GrowthTabId | null;
      if (
        saved &&
        [
          'LAUNCH_OFFER_CONTROLLER',
          'PLAN_STUDIO',
          'AI_ELASTICITY',
          'MULTI_CURRENCY_GEO',
          'AB_TESTING',
          'B2B_CORPORATE',
          'WHITE_LABEL',
          'SEO_BOOSTER',
          'AFFILIATE_ENGINE',
          'OVERVIEW',
          'BROADCAST_CAMPAIGNS',
          'PARTNER_PAYOUTS'
        ].includes(saved)
      ) {
        return saved;
      }
    }
    return 'LAUNCH_OFFER_CONTROLLER';
  });

  const [activeCategory, setActiveCategory] = useState<GrowthCategory>(() => {
    return getCategoryForGrowthTab(activeTab);
  });

  const handleSelectTab = (tabId: GrowthTabId) => {
    setActiveTab(tabId);
    setActiveCategory(getCategoryForGrowthTab(tabId));
    if (typeof window !== 'undefined') {
      localStorage.setItem('docsearch_growth_tab', tabId);
    }
  };

  const handleSelectCategory = (catId: GrowthCategory) => {
    setActiveCategory(catId);
    const categoryConfig = GROWTH_CATEGORIES.find((c) => c.id === catId);
    if (categoryConfig && !categoryConfig.tabIds.includes(activeTab)) {
      handleSelectTab(categoryConfig.defaultTab);
    }
  };

  const normEmail = (currentUserEmail || '').toLowerCase();
  const isFounder =
    currentUserRole === 'SUPER_ADMIN_FOUNDER' ||
    currentUserRole === 'SUPER_ADMIN' ||
    currentUserRole === 'FOUNDER' ||
    normEmail === 'founder@docsearch.health' ||
    normEmail === 'meraj@docsearch.health';
  const [approvalNotice, setApprovalNotice] = useState<{
    status: 'SUBMITTED' | 'APPROVED';
    title: string;
    message: string;
    requestNumber?: string;
  } | null>(null);

  // Dynamic Plans Catalog State (Fully Persistent & Editable in LocalStorage)
  const [plans, setPlans] = useState<CarePlan[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('docsearch_growth_plans');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Failed to load growth plans from localStorage:', e);
      }
    }
    return DEFAULT_CARE_PLANS;
  });

  const savePlans = (updated: CarePlan[]) => {
    setPlans(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('docsearch_growth_plans', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist growth plans to localStorage:', e);
      }
    }
  };

  // Direct duration controller (Ghata / Badha)
  const handleAdjustDuration = (planId: string, deltaOrMonths: number, isAbsolute: boolean = false) => {
    const updated = plans.map((p) => {
      if (p.id !== planId) return p;
      let newMonths = isAbsolute ? deltaOrMonths : (p.durationMonths || 12) + deltaOrMonths;
      if (newMonths < 1) newMonths = 1;
      if (newMonths > 60) newMonths = 60;
      return { ...p, durationMonths: newMonths };
    });
    savePlans(updated);
  };

  const handleResetPlansToDefault = () => {
    if (confirm('Are you sure you want to reset all plans to factory defaults? Any custom created plans will be reset.')) {
      savePlans(DEFAULT_CARE_PLANS);
      setApprovalNotice({
        status: 'APPROVED',
        title: '↺ Plans Reset to Factory Defaults',
        message: 'All 3 default care passes restored successfully.'
      });
      setTimeout(() => setApprovalNotice(null), 4000);
    }
  };

  // Modal / Editing State
  const [editingPlan, setEditingPlan] = useState<CarePlan | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New Plan Form State
  const [newPlan, setNewPlan] = useState<Partial<CarePlan>>({
    name: 'Diabetes & Cardiac Shield',
    badge: 'Specialized Care',
    category: 'CHRONIC',
    priceInr: 999,
    durationMonths: 12,
    freeConsults: 4,
    labDiscountPercent: 30,
    pharmacyDiscountPercent: 20,
    freeHomeCollection: true,
    freeExpressDelivery: true,
    priorityQueue: true,
    doctorPayoutPerConsult: 240,
    labMarginPercent: 30,
    pharmacyMarginPercent: 18,
    status: 'ACTIVE'
  });

  // Broadcast state
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [broadcastCity] = useState('Delhi-NCR (28,400 Patients)');

  // Payout state
  const [payoutsSettled, setPayoutsSettled] = useState(false);

  const handleOpenEdit = (plan: CarePlan) => {
    setEditingPlan({ ...plan });
  };

  const handleSaveEdit = async () => {
    if (!editingPlan) return;
    const updated = plans.map((p) => (p.id === editingPlan.id ? editingPlan : p));
    savePlans(updated);
    setEditingPlan(null);
    setApprovalNotice({
      status: 'APPROVED',
      title: `✅ Plan "${editingPlan.name}" Updated Live`,
      message: `Plan "${editingPlan.name}" (Price: ₹${editingPlan.priceInr}, Duration: ${editingPlan.durationMonths} Mo) saved to persistent catalog.`
    });
    setTimeout(() => setApprovalNotice(null), 5000);
  };

  const handleCreatePlan = async () => {
    const created: CarePlan = {
      id: `PLAN-0${plans.length + 1}-${Date.now().toString().slice(-4)}`,
      name: newPlan.name?.trim() || 'Custom Care Plan',
      badge: newPlan.badge?.trim() || 'Special Pass',
      category: (newPlan.category as CarePlan['category']) || 'INDIVIDUAL',
      priceInr: Number(newPlan.priceInr) || 499,
      durationMonths: Number(newPlan.durationMonths) || 12,
      freeConsults: Number(newPlan.freeConsults) || 2,
      labDiscountPercent: Number(newPlan.labDiscountPercent) || 20,
      pharmacyDiscountPercent: Number(newPlan.pharmacyDiscountPercent) || 15,
      freeHomeCollection: Boolean(newPlan.freeHomeCollection),
      freeExpressDelivery: Boolean(newPlan.freeExpressDelivery),
      priorityQueue: Boolean(newPlan.priorityQueue),
      doctorPayoutPerConsult: Number(newPlan.doctorPayoutPerConsult) || 200,
      labMarginPercent: Number(newPlan.labMarginPercent) || 25,
      pharmacyMarginPercent: Number(newPlan.pharmacyMarginPercent) || 15,
      status: 'ACTIVE',
      activeSubscribers: 0
    };

    const updated = [...plans, created];
    savePlans(updated);
    setIsCreateOpen(false);

    // Reset form for next creation
    setNewPlan({
      name: '',
      badge: '',
      category: 'INDIVIDUAL',
      priceInr: 499,
      durationMonths: 12,
      freeConsults: 2,
      labDiscountPercent: 20,
      pharmacyDiscountPercent: 15,
      freeHomeCollection: true,
      freeExpressDelivery: false,
      priorityQueue: false,
      doctorPayoutPerConsult: 200,
      labMarginPercent: 25,
      pharmacyMarginPercent: 15,
      status: 'ACTIVE'
    });

    setApprovalNotice({
      status: 'APPROVED',
      title: `✅ New Plan "${created.name}" Created & Saved Live!`,
      message: `Plan "${created.name}" (Price: ₹${created.priceInr} / ${created.durationMonths} Months) is now permanently active in the catalog and will not disappear on refresh.`
    });
    setTimeout(() => setApprovalNotice(null), 6000);
  };

  const handleDeletePlan = (id: string) => {
    const planToDelete = plans.find((p) => p.id === id);
    if (!confirm(`Are you sure you want to permanently delete plan "${planToDelete?.name || id}"?`)) {
      return;
    }
    const updated = plans.filter((p) => p.id !== id);
    savePlans(updated);
    setApprovalNotice({
      status: 'APPROVED',
      title: '🗑️ Plan Deleted Successfully',
      message: `Plan "${planToDelete?.name || id}" has been removed from catalog.`
    });
    setTimeout(() => setApprovalNotice(null), 4000);
  };

  const handleToggleStatus = (id: string) => {
    const updated = plans.map((p) =>
      p.id === id ? { ...p, status: (p.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE') as CarePlan['status'] } : p
    );
    savePlans(updated);
    const target = updated.find((p) => p.id === id);
    setApprovalNotice({
      status: 'APPROVED',
      title: target?.status === 'ACTIVE' ? `▶️ Plan "${target.name}" Resumed` : `⏸️ Plan "${target?.name}" Paused`,
      message: `Plan status updated to ${target?.status}.`
    });
    setTimeout(() => setApprovalNotice(null), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 3D Spatial Feature Core: Growth Engine */}
      <DocSearchSpatialCore3D
        preset="growth-engine"
        height={360}
        interactive={true}
        onNodeClick={(id) => {
          if (id === 'care-pass') {
            handleSelectCategory('PLANS_PRICING');
            handleSelectTab('PLAN_STUDIO');
          } else if (id === 'commission-splits') {
            handleSelectCategory('ACQUISITION_SEO');
            handleSelectTab('AFFILIATE_ENGINE');
          } else if (id === 'whatsapp-broadcast') {
            handleSelectCategory('ACQUISITION_SEO');
            handleSelectTab('BROADCAST_CAMPAIGNS');
          } else if (id === 'dynamic-margins') {
            handleSelectCategory('PLANS_PRICING');
            handleSelectTab('AI_ELASTICITY');
          } else if (id === 'clinic-pipeline') {
            handleSelectCategory('B2B_ENTERPRISE');
            handleSelectTab('B2B_CORPORATE');
          } else if (id === 'instant-payouts') {
            handleSelectCategory('B2B_ENTERPRISE');
            handleSelectTab('WHITE_LABEL');
          } else if (id === 'expansion-kpis') {
            handleSelectCategory('PLANS_PRICING');
            handleSelectTab('LAUNCH_OFFER_CONTROLLER');
          }
        }}
      />
      
      {/* Dynamic Founder Governance Notice Banner */}
      {approvalNotice && (
        <div
          style={{
            backgroundColor: approvalNotice.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
            border: `1.5px solid ${approvalNotice.status === 'APPROVED' ? '#10B981' : '#EAB308'}`,
            borderRadius: '12px',
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.75rem' }}>{approvalNotice.status === 'APPROVED' ? '👑' : '📋'}</span>
            <div>
              <strong style={{ color: approvalNotice.status === 'APPROVED' ? '#6EE7B7' : '#FDE047', fontSize: '0.9375rem', display: 'block' }}>
                {approvalNotice.title}
              </strong>
              <span style={{ color: '#CBD5E1', fontSize: '0.8125rem' }}>
                {approvalNotice.message}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setApprovalNotice(null)}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div style={{
        backgroundColor: 'rgba(234, 179, 8, 0.12)',
        border: '1px solid rgba(234, 179, 8, 0.35)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.75rem' }}>👑</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
              Company Growth Engine & Plan Customizer HQ
            </h1>
            <Badge variant="warning">{isFounder ? 'Founder Master Tower' : `Operator Mode (${currentUserRole})`}</Badge>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: 0 }}>
            {isFounder
              ? 'Centrally create, edit, customize prices, free consult quotas, and partner margin splits across all network hospitals, labs, and pharmacies.'
              : `Logged in as ${currentUserName} (${currentUserRole}). You can prepare and fill plan customizations; all form submissions require Founder MERAJ SHARIF's approval.`}
          </p>
        </div>

        {/* Global GMV Metrics */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>TOTAL NETWORK MONTHLY GMV</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981', fontFamily: 'monospace' }}>₹0 / mo</div>
          </div>
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>DOCSEARCH 15% NET TAKE RATE</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FCD34D', fontFamily: 'monospace' }}>₹0 / mo</div>
          </div>
        </div>
      </div>

      {/* 2-Tier Categorized Growth Hub Navigation (Zero Horizontal Scrollbar) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Tier 1: 4 Main Strategic Growth Pillars */}
        <div
          role="tablist"
          aria-label="Growth Strategic Pillars"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '10px'
          }}
        >
          {GROWTH_CATEGORIES.map((cat) => {
            const isCatActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isCatActive}
                onClick={() => handleSelectCategory(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: isCatActive ? '1px solid #EAB308' : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: isCatActive ? 'rgba(234, 179, 8, 0.14)' : 'rgba(15, 23, 42, 0.85)',
                  color: isCatActive ? '#FDE047' : '#94A3B8',
                  fontWeight: isCatActive ? 800 : 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isCatActive ? '0 0 16px rgba(234, 179, 8, 0.22)' : 'none',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{cat.icon}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{
                      fontWeight: 800,
                      color: isCatActive ? '#FDE047' : '#E2E8F0',
                      letterSpacing: '0.01em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {cat.label}
                    </span>
                    <span style={{
                      fontSize: '0.6875rem',
                      color: isCatActive ? '#FEF08A' : '#64748B',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {cat.badge}
                    </span>
                  </div>
                </div>
                {isCatActive && (
                  <span style={{
                    fontSize: '0.6875rem',
                    color: '#EAB308',
                    fontWeight: 900,
                    letterSpacing: '0.05em',
                    backgroundColor: 'rgba(234, 179, 8, 0.15)',
                    padding: '2px 6px',
                    borderRadius: '9999px',
                    border: '1px solid rgba(234, 179, 8, 0.3)'
                  }}>
                    ● Active
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tier 2: Category Feature Tools (On-Screen, Wrap Gracefully, 0 Scrollbar) */}
        {(() => {
          const currentCatConfig = GROWTH_CATEGORIES.find((c) => c.id === activeCategory) ?? GROWTH_CATEGORIES[0];
          if (!currentCatConfig) return null;
          return (
            <div
              role="tablist"
              aria-label="Growth Sub Tools"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                padding: '8px 12px',
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 900, color: '#EAB308', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  ⚡ {currentCatConfig.label.toUpperCase()} SUITE:
                </span>
              </div>
              {currentCatConfig.tools.map((t) => {
                const isTabActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={isTabActive}
                    onClick={() => handleSelectTab(t.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      backgroundColor: isTabActive ? '#EAB308' : 'rgba(30, 41, 59, 0.7)',
                      color: isTabActive ? '#000000' : '#CBD5E1',
                      fontSize: '0.8125rem',
                      fontWeight: isTabActive ? 900 : 600,
                      border: isTabActive ? '1px solid #CA8A04' : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isTabActive ? '0 2px 10px rgba(234, 179, 8, 0.35)' : 'none'
                    }}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                    {t.badge && (
                      <span
                        style={{
                          fontSize: '0.625rem',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          backgroundColor: isTabActive ? 'rgba(0, 0, 0, 0.16)' : 'rgba(234, 179, 8, 0.15)',
                          color: isTabActive ? '#000000' : '#FDE047',
                          border: isTabActive ? '1px solid rgba(0, 0, 0, 0.25)' : '1px solid rgba(234, 179, 8, 0.3)'
                        }}
                      >
                        {t.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Tab: Launch Offer & Limited Seats Quota Controller */}
      {activeTab === 'LAUNCH_OFFER_CONTROLLER' && (
        <LaunchOfferManagerView />
      )}

      {/* Tab: AI Dynamic Price Elasticity */}
      {activeTab === 'AI_ELASTICITY' && (
        <AiPriceElasticityRecommenderView />
      )}

      {/* Tab: Multi-Currency Geo-Pricing */}
      {activeTab === 'MULTI_CURRENCY_GEO' && (
        <MultiCurrencyGeoPricingView />
      )}

      {/* Tab: A/B Testing & Price Split */}
      {activeTab === 'AB_TESTING' && (
        <PlanAbTestingEngineView />
      )}

      {/* Tab: B2B Corporate Wellness Customizer */}
      {activeTab === 'B2B_CORPORATE' && (
        <B2bCorporateWellnessCustomizerView />
      )}

      {/* Tab: White-Label Studio */}
      {activeTab === 'WHITE_LABEL' && (
        <HospitalWhiteLabelStudioView />
      )}

      {/* Tab: SEO Booster */}
      {activeTab === 'SEO_BOOSTER' && (
        <HyperlocalClinicSeoRankView />
      )}

      {/* Tab: Affiliate Referral Engine */}
      {activeTab === 'AFFILIATE_ENGINE' && (
        <DoctorAffiliateReferralEngineView />
      )}

      {/* Tab 1: Plan Studio & Customizer */}
      {activeTab === 'PLAN_STUDIO' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#F8FAFC', textTransform: 'uppercase' }}>
                  Active Membership Plans ({plans.length} Configured)
                </span>
                <Badge variant="success">● Real-Time LocalStorage Persistent</Badge>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                Every plan's price, duration (months), doctor payout, lab discounts, and quotas are fully editable, persistent across refreshes, and published to network.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetPlansToDefault}
                style={{ fontWeight: 700, borderColor: 'rgba(255,255,255,0.15)', color: '#94A3B8' }}
                title="Reset all plans to factory 3 passes"
              >
                ↺ Reset Factory Defaults
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                style={{ fontWeight: 800, backgroundColor: '#EAB308', borderColor: '#EAB308', color: '#000' }}
              >
                ➕ Create New Custom Plan
              </Button>
            </div>
          </div>

          {/* Dynamic Plans Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            {plans.map((p) => {
              const netMargin = p.priceInr - (p.doctorPayoutPerConsult * p.freeConsults * 0.7);
              const duration = p.durationMonths || 12;
              const monthlyRate = Math.round(p.priceInr / duration);

              return (
                <div
                  key={p.id}
                  style={{
                    backgroundColor: p.status === 'ACTIVE' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(15, 23, 42, 0.5)',
                    border: p.status === 'ACTIVE' ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    boxShadow: p.status === 'ACTIVE' ? '0 10px 30px rgba(0,0,0,0.6)' : 'none',
                    opacity: p.status === 'PAUSED' ? 0.8 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Plan Top Header */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#F8FAFC' }}>{p.name}</span>
                      <Badge variant={p.status === 'ACTIVE' ? 'success' : 'warning'}>{p.status}</Badge>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 600 }}>
                      {p.badge} • <span style={{ color: '#94A3B8' }}>{p.category}</span>
                    </div>

                    {/* Price & Economics */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '12px 0 6px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                      <div>
                        <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FCD34D', fontFamily: 'monospace' }}>
                          ₹{p.priceInr}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}> / {duration} {duration === 1 ? 'month' : 'months'}</span>
                        <div style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700 }}>
                          (₹{monthlyRate} / mo)
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.625rem', color: '#94A3B8', fontWeight: 700 }}>EST. NET SAAS MARGIN</div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10B981', fontFamily: 'monospace' }}>
                          ~₹{Math.round(netMargin)} / pass
                        </div>
                      </div>
                    </div>

                    {/* Interactive Months Adjuster (Ghata / Badha Controls on Card) */}
                    <div style={{
                      backgroundColor: 'rgba(30, 41, 59, 0.65)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      marginBottom: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#EAB308', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          📅 DURATION:
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)' }}>
                          <button
                            type="button"
                            onClick={() => handleAdjustDuration(p.id, -1)}
                            title="Decrease Duration (-1 Month)"
                            style={{ padding: '2px 8px', background: 'transparent', border: 'none', color: '#38BDF8', fontWeight: 900, fontSize: '0.9375rem', cursor: 'pointer' }}
                          >
                            −
                          </button>
                          <span style={{ padding: '2px 6px', fontSize: '0.75rem', fontWeight: 800, color: '#FCD34D', minWidth: '65px', textAlign: 'center', fontFamily: 'monospace' }}>
                            {duration} {duration === 1 ? 'Mo' : 'Mo'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAdjustDuration(p.id, 1)}
                            title="Increase Duration (+1 Month)"
                            style={{ padding: '2px 8px', background: 'transparent', border: 'none', color: '#38BDF8', fontWeight: 900, fontSize: '0.9375rem', cursor: 'pointer' }}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Quick Month Presets */}
                      <div style={{ display: 'flex', gap: '3px' }}>
                        {[1, 3, 6, 12, 24].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleAdjustDuration(p.id, m, true)}
                            title={`Set duration to ${m} months`}
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: duration === m ? '1px solid #EAB308' : '1px solid rgba(255,255,255,0.08)',
                              backgroundColor: duration === m ? 'rgba(234, 179, 8, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                              color: duration === m ? '#FDE047' : '#94A3B8',
                              fontSize: '0.625rem',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            {m}M
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Configured Patient Benefits Matrix */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '12px' }}>
                      <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '6px 10px', borderRadius: '6px' }}>
                        🩺 Free Consults: <strong style={{ color: '#FFF' }}>{p.freeConsults} visits</strong>
                      </div>
                      <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '6px 10px', borderRadius: '6px' }}>
                        🧪 Lab Discount: <strong style={{ color: '#38BDF8' }}>{p.labDiscountPercent}% OFF</strong>
                      </div>
                      <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '6px 10px', borderRadius: '6px' }}>
                        💊 Pharmacy Discount: <strong style={{ color: '#10B981' }}>{p.pharmacyDiscountPercent}% OFF</strong>
                      </div>
                      <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '6px 10px', borderRadius: '6px' }}>
                        🛵 Home Sample: <strong style={{ color: p.freeHomeCollection ? '#10B981' : '#94A3B8' }}>{p.freeHomeCollection ? 'Free' : 'Paid'}</strong>
                      </div>
                    </div>

                    {/* Financial Revenue Split Config */}
                    <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px', fontSize: '0.6875rem', color: '#94A3B8' }}>
                      <div>Doctor Payout: <strong style={{ color: '#FFF' }}>₹{p.doctorPayoutPerConsult} per consult</strong></div>
                      <div>Lab Margin Split: <strong style={{ color: '#FFF' }}>{p.labMarginPercent}% to Company</strong> • Pharma: <strong style={{ color: '#FFF' }}>{p.pharmacyMarginPercent}%</strong></div>
                      <div style={{ marginTop: '4px', color: '#A7F3D0' }}>Active Subscribers: <strong>{p.activeSubscribers.toLocaleString('en-IN')} families</strong></div>
                    </div>
                  </div>

                  {/* Plan Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(p)}
                      style={{ flex: 1, fontWeight: 700, borderColor: '#38BDF8', color: '#38BDF8' }}
                    >
                      ✏️ Edit Plan
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(p.id)}
                      style={{
                        fontWeight: 700,
                        borderColor: p.status === 'ACTIVE' ? '#64748B' : '#10B981',
                        color: p.status === 'ACTIVE' ? '#CBD5E1' : '#6EE7B7'
                      }}
                    >
                      {p.status === 'ACTIVE' ? '⏸️ Pause' : '▶️ Resume'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePlan(p.id)}
                      style={{ borderColor: '#EF4444', color: '#FCA5A5' }}
                      title="Delete Plan"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Plan Modal Drawer */}
      {editingPlan && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#0F172A',
            border: '2px solid #EAB308',
            borderRadius: '20px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.9)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>✏️</span>
                <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 900, color: '#F8FAFC' }}>
                  Customize Plan: {editingPlan.name}
                </h2>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8125rem' }}>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>PLAN NAME *</label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>BADGE / TARGET *</label>
                <input
                  type="text"
                  value={editingPlan.badge}
                  onChange={(e) => setEditingPlan({ ...editingPlan, badge: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>CATEGORY *</label>
                <select
                  value={editingPlan.category}
                  onChange={(e) => setEditingPlan({ ...editingPlan, category: e.target.value as CarePlan['category'] })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#38BDF8', fontWeight: 700 }}
                >
                  <option value="INDIVIDUAL">INDIVIDUAL (1 Person)</option>
                  <option value="FAMILY">FAMILY (Up to 4 Persons)</option>
                  <option value="CHRONIC">CHRONIC (Elderly & Chronic)</option>
                  <option value="CORPORATE">CORPORATE (Enterprise Group)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>RETAIL PRICE (₹) *</label>
                <input
                  type="number"
                  value={editingPlan.priceInr}
                  onChange={(e) => setEditingPlan({ ...editingPlan, priceInr: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid #EAB308', borderRadius: '6px', color: '#FCD34D', fontWeight: 'bold' }}
                />
              </div>

              {/* DURATION (MONTHS) CONTROLS */}
              <div style={{ gridColumn: 'span 2', backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <label style={{ display: 'block', color: '#EAB308', fontSize: '0.6875rem', fontWeight: 800, marginBottom: '6px', textTransform: 'uppercase' }}>
                  PLAN DURATION (MONTHS) — GHATA / BADHA KAREIN
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <button
                      type="button"
                      onClick={() => setEditingPlan({ ...editingPlan, durationMonths: Math.max(1, (editingPlan.durationMonths || 12) - 1) })}
                      style={{ padding: '6px 12px', background: 'transparent', border: 'none', color: '#38BDF8', fontWeight: 900, cursor: 'pointer', fontSize: '1rem' }}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={editingPlan.durationMonths || 12}
                      onChange={(e) => setEditingPlan({ ...editingPlan, durationMonths: Math.max(1, Number(e.target.value)) })}
                      style={{ width: '60px', padding: '6px 4px', backgroundColor: 'transparent', border: 'none', color: '#FCD34D', textAlign: 'center', fontWeight: 900, fontFamily: 'monospace' }}
                    />
                    <button
                      type="button"
                      onClick={() => setEditingPlan({ ...editingPlan, durationMonths: Math.min(60, (editingPlan.durationMonths || 12) + 1) })}
                      style={{ padding: '6px 12px', background: 'transparent', border: 'none', color: '#38BDF8', fontWeight: 900, cursor: 'pointer', fontSize: '1rem' }}
                    >
                      +
                    </button>
                  </div>

                  <span style={{ fontSize: '0.75rem', color: '#CBD5E1', fontWeight: 600 }}>Months</span>

                  {/* Quick preset buttons */}
                  <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                    {[1, 3, 6, 12, 24].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setEditingPlan({ ...editingPlan, durationMonths: m })}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: editingPlan.durationMonths === m ? '1px solid #EAB308' : '1px solid rgba(255,255,255,0.1)',
                          backgroundColor: editingPlan.durationMonths === m ? 'rgba(234, 179, 8, 0.2)' : '#1E293B',
                          color: editingPlan.durationMonths === m ? '#FDE047' : '#94A3B8',
                          fontWeight: 800,
                          fontSize: '0.6875rem',
                          cursor: 'pointer'
                        }}
                      >
                        {m} Mo
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>FREE CONSULTATIONS QUOTA</label>
                <input
                  type="number"
                  value={editingPlan.freeConsults}
                  onChange={(e) => setEditingPlan({ ...editingPlan, freeConsults: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>LAB DISCOUNT %</label>
                <input
                  type="number"
                  value={editingPlan.labDiscountPercent}
                  onChange={(e) => setEditingPlan({ ...editingPlan, labDiscountPercent: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>PHARMACY DISCOUNT %</label>
                <input
                  type="number"
                  value={editingPlan.pharmacyDiscountPercent}
                  onChange={(e) => setEditingPlan({ ...editingPlan, pharmacyDiscountPercent: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>DOCTOR PAYOUT PER CONSULT (₹)</label>
                <input
                  type="number"
                  value={editingPlan.doctorPayoutPerConsult}
                  onChange={(e) => setEditingPlan({ ...editingPlan, doctorPayoutPerConsult: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>COMPANY LAB MARGIN %</label>
                <input
                  type="number"
                  value={editingPlan.labMarginPercent}
                  onChange={(e) => setEditingPlan({ ...editingPlan, labMarginPercent: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>COMPANY PHARMACY MARGIN %</label>
                <input
                  type="number"
                  value={editingPlan.pharmacyMarginPercent}
                  onChange={(e) => setEditingPlan({ ...editingPlan, pharmacyMarginPercent: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>
            </div>

            {/* Checkbox Features */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.8125rem', color: '#CBD5E1', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editingPlan.freeHomeCollection}
                  onChange={(e) => setEditingPlan({ ...editingPlan, freeHomeCollection: e.target.checked })}
                />
                Free Home Lab Collection
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editingPlan.freeExpressDelivery}
                  onChange={(e) => setEditingPlan({ ...editingPlan, freeExpressDelivery: e.target.checked })}
                />
                60-Min Express Medicine Delivery
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editingPlan.priorityQueue}
                  onChange={(e) => setEditingPlan({ ...editingPlan, priorityQueue: e.target.checked })}
                />
                Priority OPD Chamber Queue
              </label>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px' }}>
              <Button variant="outline" size="md" onClick={() => setEditingPlan(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveEdit}
              >
                💾 Save & Publish Plan Updates
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Plan Modal */}
      {isCreateOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#0F172A',
            border: '2px solid #38BDF8',
            borderRadius: '20px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.9)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>➕</span>
                <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 900, color: '#F8FAFC' }}>
                  Create New Custom Membership Plan
                </h2>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8125rem' }}>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>PLAN NAME *</label>
                <input
                  type="text"
                  value={newPlan.name || ''}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  placeholder="e.g. Women Wellness Pass"
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>BADGE / TARGET *</label>
                <input
                  type="text"
                  value={newPlan.badge || ''}
                  onChange={(e) => setNewPlan({ ...newPlan, badge: e.target.value })}
                  placeholder="e.g. Moms & Maternity"
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>CATEGORY *</label>
                <select
                  value={newPlan.category || 'INDIVIDUAL'}
                  onChange={(e) => setNewPlan({ ...newPlan, category: e.target.value as CarePlan['category'] })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#38BDF8', fontWeight: 700 }}
                >
                  <option value="INDIVIDUAL">INDIVIDUAL (1 Person)</option>
                  <option value="FAMILY">FAMILY (Up to 4 Persons)</option>
                  <option value="CHRONIC">CHRONIC (Elderly & Chronic)</option>
                  <option value="CORPORATE">CORPORATE (Enterprise Group)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>RETAIL PRICE (₹) *</label>
                <input
                  type="number"
                  value={newPlan.priceInr || 499}
                  onChange={(e) => setNewPlan({ ...newPlan, priceInr: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid #38BDF8', borderRadius: '6px', color: '#38BDF8', fontWeight: 'bold' }}
                />
              </div>

              {/* DURATION (MONTHS) CONTROLS */}
              <div style={{ gridColumn: 'span 2', backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <label style={{ display: 'block', color: '#38BDF8', fontSize: '0.6875rem', fontWeight: 800, marginBottom: '6px', textTransform: 'uppercase' }}>
                  PLAN DURATION (MONTHS) — GHATA / BADHA KAREIN
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <button
                      type="button"
                      onClick={() => setNewPlan({ ...newPlan, durationMonths: Math.max(1, (newPlan.durationMonths || 12) - 1) })}
                      style={{ padding: '6px 12px', background: 'transparent', border: 'none', color: '#38BDF8', fontWeight: 900, cursor: 'pointer', fontSize: '1rem' }}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={newPlan.durationMonths || 12}
                      onChange={(e) => setNewPlan({ ...newPlan, durationMonths: Math.max(1, Number(e.target.value)) })}
                      style={{ width: '60px', padding: '6px 4px', backgroundColor: 'transparent', border: 'none', color: '#FCD34D', textAlign: 'center', fontWeight: 900, fontFamily: 'monospace' }}
                    />
                    <button
                      type="button"
                      onClick={() => setNewPlan({ ...newPlan, durationMonths: Math.min(60, (newPlan.durationMonths || 12) + 1) })}
                      style={{ padding: '6px 12px', background: 'transparent', border: 'none', color: '#38BDF8', fontWeight: 900, cursor: 'pointer', fontSize: '1rem' }}
                    >
                      +
                    </button>
                  </div>

                  <span style={{ fontSize: '0.75rem', color: '#CBD5E1', fontWeight: 600 }}>Months</span>

                  {/* Quick preset buttons */}
                  <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                    {[1, 3, 6, 12, 24].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setNewPlan({ ...newPlan, durationMonths: m })}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: (newPlan.durationMonths || 12) === m ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                          backgroundColor: (newPlan.durationMonths || 12) === m ? 'rgba(56, 189, 248, 0.2)' : '#1E293B',
                          color: (newPlan.durationMonths || 12) === m ? '#38BDF8' : '#94A3B8',
                          fontWeight: 800,
                          fontSize: '0.6875rem',
                          cursor: 'pointer'
                        }}
                      >
                        {m} Mo
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>FREE CONSULTATIONS QUOTA</label>
                <input
                  type="number"
                  value={newPlan.freeConsults || 2}
                  onChange={(e) => setNewPlan({ ...newPlan, freeConsults: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>LAB DISCOUNT %</label>
                <input
                  type="number"
                  value={newPlan.labDiscountPercent || 20}
                  onChange={(e) => setNewPlan({ ...newPlan, labDiscountPercent: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>PHARMACY DISCOUNT %</label>
                <input
                  type="number"
                  value={newPlan.pharmacyDiscountPercent || 15}
                  onChange={(e) => setNewPlan({ ...newPlan, pharmacyDiscountPercent: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>DOCTOR PAYOUT PER CONSULT (₹)</label>
                <input
                  type="number"
                  value={newPlan.doctorPayoutPerConsult || 200}
                  onChange={(e) => setNewPlan({ ...newPlan, doctorPayoutPerConsult: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>COMPANY LAB MARGIN %</label>
                <input
                  type="number"
                  value={newPlan.labMarginPercent || 25}
                  onChange={(e) => setNewPlan({ ...newPlan, labMarginPercent: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>COMPANY PHARMACY MARGIN %</label>
                <input
                  type="number"
                  value={newPlan.pharmacyMarginPercent || 15}
                  onChange={(e) => setNewPlan({ ...newPlan, pharmacyMarginPercent: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>
            </div>

            {/* Checkbox Features */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.8125rem', color: '#CBD5E1', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={Boolean(newPlan.freeHomeCollection)}
                  onChange={(e) => setNewPlan({ ...newPlan, freeHomeCollection: e.target.checked })}
                />
                Free Home Lab Collection
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={Boolean(newPlan.freeExpressDelivery)}
                  onChange={(e) => setNewPlan({ ...newPlan, freeExpressDelivery: e.target.checked })}
                />
                60-Min Express Medicine Delivery
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={Boolean(newPlan.priorityQueue)}
                  onChange={(e) => setNewPlan({ ...newPlan, priorityQueue: e.target.checked })}
                />
                Priority OPD Chamber Queue
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px' }}>
              <Button variant="outline" size="md" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleCreatePlan}
              >
                🚀 Create & Activate Plan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Overview & GMV */}
      {activeTab === 'OVERVIEW' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '18px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>ACTIVE ENROLLED FAMILIES</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F8FAFC', margin: '4px 0', fontFamily: 'monospace' }}>0</div>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Day-0 Slate: Ready for initial family enrollments</span>
            </div>
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '18px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>MONTHLY PHARMACY REFILLS</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#38BDF8', margin: '4px 0', fontFamily: 'monospace' }}>0</div>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>0 refills queued</span>
            </div>
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '18px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>HOME LAB COLLECTIONS DISPATCHED</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#C084FC', margin: '4px 0', fontFamily: 'monospace' }}>0</div>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>0 dispatches queued</span>
            </div>
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '18px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>ACTIVE NETWORK PARTNERS</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FCD34D', margin: '4px 0', fontFamily: 'monospace' }}>0 Centers</div>
              <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>0 Doctors • 0 Labs • 0 Pharmas</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: City-Wide WhatsApp Broadcast Engine */}
      {activeTab === 'BROADCAST_CAMPAIGNS' && (
        <div style={{
          backgroundColor: '#0F172A',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
            <div>
              <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#F8FAFC' }}>
                City-Wide WhatsApp Mass Campaign Broadcast Engine
              </span>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Push targeted campaigns to <strong style={{ color: '#38BDF8' }}>{broadcastCity}</strong> to drive footfall to network centers.</div>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setBroadcastSent(true);
                setTimeout(() => setBroadcastSent(false), 4000);
              }}
              style={{ fontWeight: 800, backgroundColor: '#22C55E', borderColor: '#22C55E', color: '#000' }}
            >
              {broadcastSent ? '✓ Broadcast Dispatched to 0 Patients!' : '🚀 Launch Mass WhatsApp Campaign (0 Enrolled)'}
            </Button>
          </div>
        </div>
      )}

      {/* Tab 4: Partner Settlements Board */}
      {activeTab === 'PARTNER_PAYOUTS' && (
        <div style={{
          backgroundColor: '#0F172A',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#F8FAFC' }}>
                Partner Doctors, Diagnostic Labs & Pharmacy Settlement Ledger
              </span>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Automated payouts for fulfilled Care Pass consultations, lab samples, and medicine deliveries.</div>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => setPayoutsSettled(true)}
              style={{ fontWeight: 800, backgroundColor: payoutsSettled ? '#10B981' : '#06B6D4', borderColor: payoutsSettled ? '#10B981' : '#06B6D4', color: '#070C16' }}
            >
              {payoutsSettled ? '✓ All ₹0 Settled via Instant UPI / NEFT!' : '⚡ Settle Pending Ledger (₹0 Balance)'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
