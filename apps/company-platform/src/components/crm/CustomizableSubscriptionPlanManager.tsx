import React, { useState, useEffect } from 'react';
import { apiCall, apiRequest } from '../../services/api-client.js';

export type VerticalType =
  | 'ALL'
  | 'HOSPITAL'
  | 'CLINIC'
  | 'PHARMACY'
  | 'PATHOLOGY'
  | 'COMBO_CLINIC_PATHOLOGY'
  | 'COMBO_CLINIC_PHARMACY';

export interface PlanDefinition {
  id: string;
  code: string;
  name: string;
  tier: 'SILVER' | 'GOLD' | 'PLATINUM' | string;
  vertical: string;
  badge: string;
  priceMonthly: number;
  priceAnnual: number;
  maxSeats: number;
  maxFacilities: number;
  storageGb: number;
  abdmTier: string;
  aiScribeQuotas: number;
  whatsAppQuota: number;
  isPopular: boolean;
  features: string[];
}

export interface TenureOption {
  code: 'HALF_YEARLY' | 'YEARLY' | 'TWO_YEARS' | 'THREE_YEARS' | 'FIVE_YEARS';
  label: string;
  months: number;
  durationDays: number;
  defaultDiscountPercent: number;
  badge: string;
  description: string;
}

const DEFAULT_TENURES: TenureOption[] = [
  { code: 'HALF_YEARLY', label: 'Half-Yearly (6 Months)', months: 6, durationDays: 180, defaultDiscountPercent: 0, badge: 'Flexible', description: 'Standard base rate with 6-month flexibility' },
  { code: 'YEARLY', label: '1 Year (12 Months)', months: 12, durationDays: 365, defaultDiscountPercent: 10, badge: '⭐ Standard Annual', description: 'Save 10% on annual upfront commitment' },
  { code: 'TWO_YEARS', label: '2 Years (24 Months)', months: 24, durationDays: 730, defaultDiscountPercent: 20, badge: '🏆 2-Year Lock-in', description: 'Save 20% with price-protection for 2 full years' },
  { code: 'THREE_YEARS', label: '3 Years (36 Months)', months: 36, durationDays: 1095, defaultDiscountPercent: 30, badge: '💎 3-Year Enterprise', description: 'Save 30% with multi-year rate lock & priority onboarding' },
  { code: 'FIVE_YEARS', label: '5 Years (60 Months)', months: 60, durationDays: 1825, defaultDiscountPercent: 40, badge: '👑 5-Year Institutional', description: 'Save 40% maximum savings & permanent dedicated support' }
];

export const CustomizableSubscriptionPlanManager: React.FC = () => {
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [selectedVertical, setSelectedVertical] = useState<VerticalType>('ALL');
  const [editingPlan, setEditingPlan] = useState<PlanDefinition | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // HQ Deal Desk & Negotiation States
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [selectedDealPlanId, setSelectedDealPlanId] = useState<string>('');
  const [selectedTenure, setSelectedTenure] = useState<'HALF_YEARLY' | 'YEARLY' | 'TWO_YEARS' | 'THREE_YEARS' | 'FIVE_YEARS'>('YEARLY');
  const [discountType, setDiscountType] = useState<'NONE' | 'FLAT_INR' | 'PERCENT' | 'LUMP_SUM'>('PERCENT');
  const [flatDiscountInr, setFlatDiscountInr] = useState<number>(0);
  const [percentDiscount, setPercentDiscount] = useState<number>(0);
  const [agreedLumpSum, setAgreedLumpSum] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState<string>('FULL_UPFRONT');
  const [negotiationNotes, setNegotiationNotes] = useState<string>('');
  const [isSubmittingDeal, setIsSubmittingDeal] = useState<boolean>(false);
  const [dealSuccessMsg, setDealSuccessMsg] = useState<string | null>(null);

  const loadAuthoritativeData = async () => {
    try {
      // 1. Load dynamic plans
      const res = await apiCall<any[]>('/api/v1/company/plans');
      if (Array.isArray(res) && res.length > 0) {
        const mapped: PlanDefinition[] = res.map((p) => {
          const meta = p.metadata || {};
          return {
            id: p.id,
            code: p.code,
            name: p.name,
            tier: meta.tier || (p.code?.includes('SILVER') ? 'SILVER' : p.code?.includes('GOLD') ? 'GOLD' : p.code?.includes('PLATINUM') ? 'PLATINUM' : 'STANDARD'),
            vertical: meta.vertical || (p.code?.includes('HOSP') ? 'HOSPITAL' : p.code?.includes('CP') ? 'COMBO_CLINIC_PATHOLOGY' : p.code?.includes('CRX') ? 'COMBO_CLINIC_PHARMACY' : p.code?.includes('PATH') ? 'PATHOLOGY' : p.code?.includes('PHARMA') ? 'PHARMACY' : 'CLINIC'),
            badge: meta.badge || (p.code?.includes('GOLD') ? '⭐ Most Popular' : p.code?.includes('PLATINUM') ? '👑 Enterprise' : '🥉 Starter'),
            priceMonthly: p.basePrice || 4999,
            priceAnnual: p.basePrice ? p.basePrice * 10 : 49990,
            maxSeats: p.maxDoctors || 5,
            maxFacilities: p.maxBranches || 1,
            storageGb: p.storageQuotaGb || 25,
            abdmTier: meta.abdmTier || 'M1-M3 Gateway',
            aiScribeQuotas: meta.aiScribeQuotas || 250,
            whatsAppQuota: p.monthlyWhatsAppCredits || 1000,
            isPopular: Boolean(meta.isPopular || p.code?.includes('GOLD')),
            features: meta.features || ['Universal Staff Directory & RBAC', 'Core Operational Module', 'Direct Cashier Billing']
          };
        });
        setPlans(mapped);
        if (mapped.length > 0 && !selectedDealPlanId && mapped[0]) {
          setSelectedDealPlanId(mapped[0].id);
        }
      }

      // 2. Load partners for Deal Desk
      const pRes = await apiRequest<any[]>('/api/v1/company/partners');
      if (pRes.success && Array.isArray(pRes.data)) {
        setPartners(pRes.data);
        if (pRes.data.length > 0 && !selectedPartnerId) {
          setSelectedPartnerId(pRes.data[0].id);
        }
      }
    } catch (e) {
      console.warn('Could not load plans or partners from backend API:', e);
    }
  };

  useEffect(() => {
    loadAuthoritativeData();
  }, []);

  const filteredPlans = plans.filter((p) => {
    if (selectedVertical === 'ALL') return true;
    return p.vertical === selectedVertical;
  });

  const handleSaveEdit = async () => {
    if (!editingPlan) return;
    try {
      if (editingPlan.id.length === 36) {
        // Real DB UUID: update via PUT
        await apiCall(`/api/v1/company/plans/${editingPlan.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: editingPlan.name,
            basePrice: editingPlan.priceMonthly,
            maxDoctors: editingPlan.maxSeats,
            maxBranches: editingPlan.maxFacilities,
            storageQuotaGb: editingPlan.storageGb,
            monthlyWhatsAppCredits: editingPlan.whatsAppQuota,
            metadata: {
              badge: editingPlan.badge,
              tier: editingPlan.tier,
              vertical: editingPlan.vertical,
              abdmTier: editingPlan.abdmTier,
              aiScribeQuotas: editingPlan.aiScribeQuotas,
              isPopular: editingPlan.isPopular,
              features: editingPlan.features
            }
          })
        });
      }
      setSaveToast(`Plan "${editingPlan.name}" updated successfully!`);
      setTimeout(() => setSaveToast(null), 3000);
      setEditingPlan(null);
      await loadAuthoritativeData();
    } catch (err) {
      console.error('Failed to save plan to backend:', err);
    }
  };

  // Deal Desk Calculations
  const dealPlan = plans.find((p) => p.id === selectedDealPlanId) || plans[0];
  const dealTenure: TenureOption = DEFAULT_TENURES.find((t) => t.code === selectedTenure) || DEFAULT_TENURES[1]!;
  const monthlyBase = dealPlan ? dealPlan.priceMonthly : 0;
  const totalGross = monthlyBase * dealTenure.months;
  const defaultTenureDiscountAmount = Math.round(totalGross * (dealTenure.defaultDiscountPercent / 100));
  const subtotalAfterTenure = totalGross - defaultTenureDiscountAmount;

  let calculatedFinalPayable = subtotalAfterTenure;
  let totalCalculatedSavings = defaultTenureDiscountAmount;

  if (discountType === 'LUMP_SUM' && agreedLumpSum > 0) {
    calculatedFinalPayable = agreedLumpSum;
    totalCalculatedSavings = totalGross - agreedLumpSum;
  } else if (discountType === 'FLAT_INR' && flatDiscountInr > 0) {
    calculatedFinalPayable = Math.max(0, subtotalAfterTenure - flatDiscountInr);
    totalCalculatedSavings = defaultTenureDiscountAmount + flatDiscountInr;
  } else if (discountType === 'PERCENT' && percentDiscount > 0) {
    const customPercentAmt = Math.round(subtotalAfterTenure * (percentDiscount / 100));
    calculatedFinalPayable = Math.max(0, subtotalAfterTenure - customPercentAmt);
    totalCalculatedSavings = defaultTenureDiscountAmount + customPercentAmt;
  }

  const effectiveMonthly = Math.round(calculatedFinalPayable / dealTenure.months);

  const handleAuthorizeDeal = async () => {
    if (!selectedPartnerId || !selectedDealPlanId) {
      alert('Please select both a Partner and a Plan Tier.');
      return;
    }
    setIsSubmittingDeal(true);
    setDealSuccessMsg(null);
    try {
      const payload: any = {
        partnerId: selectedPartnerId,
        planId: selectedDealPlanId,
        tenureCode: selectedTenure,
        paymentTerms,
        negotiationNotes
      };
      if (discountType === 'FLAT_INR') {
        payload.customDiscountAmount = flatDiscountInr;
      } else if (discountType === 'PERCENT') {
        payload.customDiscountPercent = percentDiscount;
      } else if (discountType === 'LUMP_SUM') {
        payload.agreedLumpSum = agreedLumpSum;
      }

      const res = await apiRequest('/api/v1/company/subscriptions/negotiate-deal', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        setDealSuccessMsg(`Contract successfully authorized! Partner final payable amount: ₹${calculatedFinalPayable.toLocaleString('en-IN')} for ${dealTenure.label}.`);
        setTimeout(() => setDealSuccessMsg(null), 6000);
      } else {
        alert(res.error?.message || 'Failed to authorize deal.');
      }
    } catch (err: any) {
      alert(err.message || 'Error communicating with Deal Desk service.');
    } finally {
      setIsSubmittingDeal(false);
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#070C16', color: '#F8FAFC', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#F8FAFC' }}>
              💎 Partner Plans, Profiles & Deal Desk Command Center
            </h2>
            <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10B981', border: '1px solid #10B981', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem', fontWeight: 800 }}>
              100% Dynamic PostgreSQL
            </span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
            Authoritative control across 6 Healthcare Profiles (4 Core + 2 Combos), 3 Dynamic Tiers (Silver, Gold, Platinum), and Year 2+ Negotiable Deal Desk.
          </p>
        </div>

        {saveToast && (
          <span style={{ fontSize: '0.8125rem', backgroundColor: '#10B981', color: '#070C16', padding: '6px 14px', borderRadius: '8px', fontWeight: 800 }}>
            ✓ {saveToast}
          </span>
        )}
      </div>

      {/* Profile Vertical Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {[
          { id: 'ALL', label: 'All Profiles' },
          { id: 'HOSPITAL', label: '🏥 Multi-Specialty Hospital' },
          { id: 'COMBO_CLINIC_PATHOLOGY', label: '🩺+🔬 Combo: Clinic & Lab' },
          { id: 'COMBO_CLINIC_PHARMACY', label: '🩺+💊 Combo: Clinic & Chemist' },
          { id: 'PATHOLOGY', label: '🔬 Pathology Lab (LIMS)' },
          { id: 'CLINIC', label: '🩺 Doctor OPD Clinic' },
          { id: 'PHARMACY', label: '💊 Pharmacy & Chemist' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedVertical(tab.id as VerticalType)}
            style={{
              backgroundColor: selectedVertical === tab.id ? '#06B6D4' : 'rgba(30, 41, 59, 0.6)',
              color: selectedVertical === tab.id ? '#070C16' : '#CBD5E1',
              border: selectedVertical === tab.id ? '1px solid #06B6D4' : '1px solid rgba(255,255,255,0.1)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Plan Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {filteredPlans.map((plan) => (
          <div
            key={plan.id}
            style={{
              backgroundColor: '#0F172A',
              border: plan.tier === 'PLATINUM' ? '2px solid #F59E0B' : plan.tier === 'GOLD' ? '2px solid #06B6D4' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
          >
            {plan.isPopular && (
              <span style={{ position: 'absolute', top: '-11px', right: '16px', backgroundColor: '#06B6D4', color: '#070C16', fontSize: '0.6875rem', fontWeight: 900, padding: '2px 10px', borderRadius: '12px' }}>
                MOST POPULAR
              </span>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.625rem', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {plan.vertical}
                  </span>
                  <h3 style={{ margin: '2px 0 0', fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC' }}>
                    {plan.name}
                  </h3>
                </div>
                <span style={{ fontSize: '0.6875rem', backgroundColor: 'rgba(255,255,255,0.1)', color: '#38BDF8', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                  {plan.badge}
                </span>
              </div>

              {/* Price Display */}
              <div style={{ margin: '14px 0', padding: '12px', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F8FAFC' }}>
                    ₹{plan.priceMonthly.toLocaleString('en-IN')}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>/ month</span>
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700, marginTop: '4px' }}>
                  🎁 1st Year: 100% Free Launch Benefit
                </div>
              </div>

              {/* Quotas & Entitlements */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '10px 0', margin: '12px 0', fontSize: '0.75rem', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>👥 <strong>Doctor / Staff Seats:</strong> {plan.maxSeats === 999 ? 'Unlimited' : `${plan.maxSeats} Seats`}</div>
                <div>🏥 <strong>Branches / Counters:</strong> {plan.maxFacilities === 999 ? 'Unlimited' : `${plan.maxFacilities} Allowed`}</div>
                <div>☁️ <strong>Vault Storage:</strong> {plan.storageGb} GB Cloud</div>
                <div>💬 <strong>WhatsApp Quota:</strong> {plan.whatsAppQuota.toLocaleString('en-IN')} / mo</div>
              </div>

              {/* Feature Highlights */}
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.6 }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ color: f.includes('Universal Staff') ? '#38BDF8' : '#94A3B8', fontWeight: f.includes('Universal Staff') ? 700 : 400 }}>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setEditingPlan(plan)}
              style={{
                marginTop: '16px',
                width: '100%',
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                color: '#38BDF8',
                border: '1px solid #06B6D4',
                borderRadius: '8px',
                padding: '8px',
                fontWeight: 800,
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              ✏️ Edit Pricing & Quotas
            </button>
          </div>
        ))}
      </div>

      {/* HQ DEAL DESK & NEGOTIATION CALCULATOR */}
      <div style={{ backgroundColor: '#0B132B', border: '1px solid #3B82F6', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>🤝</span>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#60A5FA' }}>
                HQ Deal Desk: Multi-Year Negotiable Contract Engine
              </h3>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
              Negotiate and lock in custom deals for Year 2+ renewals across Half-Yearly, 1-Year, 2-Year, 3-Year, and 5-Year tenures.
            </p>
          </div>

          {dealSuccessMsg && (
            <span style={{ backgroundColor: '#10B981', color: '#070C16', padding: '6px 14px', borderRadius: '8px', fontWeight: 800, fontSize: '0.8125rem' }}>
              ✓ {dealSuccessMsg}
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Column 1: Partner & Plan Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
                Select Partner Facility:
              </label>
              <select
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '8px', padding: '10px', color: '#FFF', fontSize: '0.8125rem' }}
              >
                {partners.length > 0 ? (
                  partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.legalName || p.tradeName} ({p.partnerType})
                    </option>
                  ))
                ) : (
                  <option value="partner-sample">Max Super Specialty Hospital / Apex Lab</option>
                )}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
                Target Plan & Tier:
              </label>
              <select
                value={selectedDealPlanId}
                onChange={(e) => setSelectedDealPlanId(e.target.value)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '8px', padding: '10px', color: '#FFF', fontSize: '0.8125rem' }}
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₹{p.priceMonthly.toLocaleString('en-IN')}/mo
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
                Payment Tenure (Duration):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {DEFAULT_TENURES.map((t) => (
                  <button
                    key={t.code}
                    type="button"
                    onClick={() => setSelectedTenure(t.code)}
                    style={{
                      padding: '8px 10px',
                      backgroundColor: selectedTenure === t.code ? '#2563EB' : '#1E293B',
                      color: selectedTenure === t.code ? '#FFFFFF' : '#94A3B8',
                      border: selectedTenure === t.code ? '1.5px solid #60A5FA' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div>{t.label}</div>
                    <div style={{ fontSize: '0.625rem', color: selectedTenure === t.code ? '#93C5FD' : '#34D399', marginTop: '2px' }}>
                      {t.defaultDiscountPercent > 0 ? `Save ${t.defaultDiscountPercent}%` : 'Base Rate'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Negotiation Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
                Negotiated Discount Type:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { id: 'PERCENT', label: '% Percentage Off' },
                  { id: 'FLAT_INR', label: '₹ Flat Cash Off' },
                  { id: 'LUMP_SUM', label: 'Agreed Lump Sum' }
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDiscountType(d.id as any)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: discountType === d.id ? 'rgba(59, 130, 246, 0.25)' : '#1E293B',
                      color: discountType === d.id ? '#60A5FA' : '#94A3B8',
                      border: discountType === d.id ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {discountType === 'PERCENT' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
                  Custom Additional Discount (%):
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={percentDiscount}
                  onChange={(e) => setPercentDiscount(Number(e.target.value))}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '8px', padding: '10px', color: '#FFF', fontSize: '0.875rem' }}
                  placeholder="e.g. 10 for extra 10% off"
                />
              </div>
            )}

            {discountType === 'FLAT_INR' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
                  Custom Flat Discount (₹):
                </label>
                <input
                  type="number"
                  min="0"
                  value={flatDiscountInr}
                  onChange={(e) => setFlatDiscountInr(Number(e.target.value))}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '8px', padding: '10px', color: '#FFF', fontSize: '0.875rem' }}
                  placeholder="e.g. 15000"
                />
              </div>
            )}

            {discountType === 'LUMP_SUM' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
                  Final Agreed Lump Sum Deal Amount (₹):
                </label>
                <input
                  type="number"
                  min="0"
                  value={agreedLumpSum}
                  onChange={(e) => setAgreedLumpSum(Number(e.target.value))}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '8px', padding: '10px', color: '#FFF', fontSize: '0.875rem' }}
                  placeholder="e.g. 150000"
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
                Payment Terms & Milestones:
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '8px', padding: '10px', color: '#FFF', fontSize: '0.8125rem' }}
              >
                <option value="FULL_UPFRONT">100% Upfront Advance (Maximum Savings)</option>
                <option value="SPLIT_50_50">50-50 Split (50% Advance, 50% Post-Migration)</option>
                <option value="QUARTERLY_PDC">Quarterly Post-Dated Cheques (PDC)</option>
                <option value="CUSTOM_TRUST_TERMS">Custom Healthcare Trust Milestones</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
                Negotiation Notes & Audit Trail:
              </label>
              <input
                type="text"
                value={negotiationNotes}
                onChange={(e) => setNegotiationNotes(e.target.value)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '8px', padding: '10px', color: '#FFF', fontSize: '0.8125rem' }}
                placeholder="e.g. Approved by Director for multi-facility expansion"
              />
            </div>
          </div>

          {/* Column 3: Live Deal Summary & Authorize Button */}
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', color: '#60A5FA', fontWeight: 800, textTransform: 'uppercase' }}>
                Live Deal Financial Summary
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#F8FAFC', margin: '4px 0 14px' }}>
                {dealPlan?.name}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Base Monthly Rate:</span>
                  <span>₹{monthlyBase.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Duration:</span>
                  <span>{dealTenure.months} Months ({dealTenure.label})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Gross Amount:</span>
                  <span>₹{totalGross.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34D399' }}>
                  <span>Total Discount Savings:</span>
                  <span>- ₹{totalCalculatedSavings.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Final Invoiced Payable
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#38BDF8', margin: '4px 0' }}>
                  ₹{calculatedFinalPayable.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Effective Rate: <strong>₹{effectiveMonthly.toLocaleString('en-IN')}</strong> / month
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAuthorizeDeal}
              disabled={isSubmittingDeal}
              style={{
                marginTop: '20px',
                backgroundColor: isSubmittingDeal ? '#475569' : '#10B981',
                color: '#070C16',
                border: 'none',
                borderRadius: '10px',
                padding: '14px',
                fontWeight: 900,
                fontSize: '0.875rem',
                cursor: isSubmittingDeal ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {isSubmittingDeal ? 'Processing Contract...' : '🤝 Authorize & Lock In Contract'}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 12000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #06B6D4', borderRadius: '14px', width: '100%', maxWidth: '520px', padding: '24px', color: '#FFF' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.15rem', fontWeight: 800 }}>✏️ Edit {editingPlan.name}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px' }}>Plan Name:</label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px', color: '#FFF' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px' }}>Monthly Price (₹):</label>
                  <input
                    type="number"
                    value={editingPlan.priceMonthly}
                    onChange={(e) => setEditingPlan({ ...editingPlan, priceMonthly: Number(e.target.value) })}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px' }}>Max Seats:</label>
                  <input
                    type="number"
                    value={editingPlan.maxSeats}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxSeats: Number(e.target.value) })}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px', color: '#FFF' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px' }}>Storage (GB):</label>
                  <input
                    type="number"
                    value={editingPlan.storageGb}
                    onChange={(e) => setEditingPlan({ ...editingPlan, storageGb: Number(e.target.value) })}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px' }}>WhatsApp Notifications/mo:</label>
                  <input
                    type="number"
                    value={editingPlan.whatsAppQuota}
                    onChange={(e) => setEditingPlan({ ...editingPlan, whatsAppQuota: Number(e.target.value) })}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px', color: '#FFF' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={handleSaveEdit}
                style={{ flex: 1, backgroundColor: '#10B981', color: '#070C16', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 800, cursor: 'pointer' }}
              >
                💾 Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#CBD5E1', border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
