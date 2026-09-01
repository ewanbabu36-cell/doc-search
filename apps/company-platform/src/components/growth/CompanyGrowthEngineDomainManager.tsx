import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';
import { HyperlocalClinicSeoRankView } from './HyperlocalClinicSeoRankView.js';
import { DoctorAffiliateReferralEngineView } from './DoctorAffiliateReferralEngineView.js';
import { HospitalWhiteLabelStudioView } from './HospitalWhiteLabelStudioView.js';
import { AiPriceElasticityRecommenderView } from './AiPriceElasticityRecommenderView.js';

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

export const CompanyGrowthEngineDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PLAN_STUDIO' | 'AI_ELASTICITY' | 'WHITE_LABEL' | 'SEO_BOOSTER' | 'AFFILIATE_ENGINE' | 'BROADCAST_CAMPAIGNS' | 'PARTNER_PAYOUTS'>('PLAN_STUDIO');

  // Dynamic Plans Catalog State (Fully Editable & Addable)
  const [plans, setPlans] = useState<CarePlan[]>([
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
      activeSubscribers: 14200
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
      activeSubscribers: 28400
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
      activeSubscribers: 5600
    }
  ]);

  // Modal / Editing State
  const [editingPlan, setEditingPlan] = useState<CarePlan | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPublishSuccess, setIsPublishSuccess] = useState(false);

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

  const handleSaveEdit = () => {
    if (!editingPlan) return;
    setPlans((prev) => prev.map((p) => (p.id === editingPlan.id ? editingPlan : p)));
    setEditingPlan(null);
    setIsPublishSuccess(true);
    setTimeout(() => setIsPublishSuccess(false), 3000);
  };

  const handleCreatePlan = () => {
    const created: CarePlan = {
      id: `PLAN-0${plans.length + 1}`,
      name: newPlan.name || 'Custom Care Plan',
      badge: newPlan.badge || 'Special Pass',
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
    setPlans((prev) => [...prev, created]);
    setIsCreateOpen(false);
    setIsPublishSuccess(true);
    setTimeout(() => setIsPublishSuccess(false), 3000);
  };

  const handleDeletePlan = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    setIsPublishSuccess(true);
    setTimeout(() => setIsPublishSuccess(false), 3000);
  };

  const handleToggleStatus = (id: string) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: p.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : p))
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
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
            <Badge variant="warning">Founder Central Tower</Badge>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: 0 }}>
            Centrally create, edit, customize prices, free consult quotas, and partner margin splits across all network hospitals, labs, and pharmacies.
          </p>
        </div>

        {/* Global GMV Metrics */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>TOTAL NETWORK MONTHLY GMV</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981', fontFamily: 'monospace' }}>₹1.48 Crore / mo</div>
          </div>
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>DOCSEARCH 15% NET TAKE RATE</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FCD34D', fontFamily: 'monospace' }}>₹22.4 Lakhs / mo</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', overflowX: 'auto' }}>
        {[
          { id: 'PLAN_STUDIO', label: '⚙️ Plan Studio & Customizer (Live Editor)' },
          { id: 'AI_ELASTICITY', label: '🤖 AI Dynamic Price Elasticity' },
          { id: 'WHITE_LABEL', label: '🎨 Hospital White-Label Studio' },
          { id: 'SEO_BOOSTER', label: '📍 Hyperlocal Clinic SEO' },
          { id: 'AFFILIATE_ENGINE', label: '🔗 Doctor Affiliate Referral Engine' },
          { id: 'OVERVIEW', label: '📊 Network GMV & Growth KPIs' },
          { id: 'BROADCAST_CAMPAIGNS', label: '📢 City-Wide WhatsApp Broadcast Engine' },
          { id: 'PARTNER_PAYOUTS', label: '💸 Partner Settlements Board (Doctors/Labs/Pharma)' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as typeof activeTab)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: activeTab === t.id ? '#EAB308' : 'rgba(30, 41, 59, 0.6)',
              color: activeTab === t.id ? '#000000' : '#CBD5E1',
              fontSize: '0.8125rem',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Live Sync Banner */}
      {isPublishSuccess && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✓</span> All plan customizations published live across Patient Portals, Doctor EMRs, and WhatsApp Bots!
        </div>
      )}

      {/* Tab: AI Dynamic Price Elasticity */}
      {activeTab === 'AI_ELASTICITY' && (
        <AiPriceElasticityRecommenderView />
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
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase' }}>
                Active Membership Plans ({plans.length} Configured)
              </span>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Every plan's price, doctor payout, lab discounts, and quotas are fully editable.</div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              style={{ fontWeight: 800, backgroundColor: '#EAB308', borderColor: '#EAB308', color: '#000' }}
            >
              ➕ Create New Custom Plan
            </Button>
          </div>

          {/* Dynamic Plans Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            {plans.map((p) => {
              const netMargin = p.priceInr - (p.doctorPayoutPerConsult * p.freeConsults * 0.7);
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
                    boxShadow: p.status === 'ACTIVE' ? '0 10px 30px rgba(0,0,0,0.6)' : 'none'
                  }}
                >
                  {/* Plan Top Header */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#F8FAFC' }}>{p.name}</span>
                      <Badge variant={p.status === 'ACTIVE' ? 'success' : 'warning'}>{p.status}</Badge>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 600 }}>{p.badge}</div>

                    {/* Price & Economics */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                      <div>
                        <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FCD34D', fontFamily: 'monospace' }}>
                          ₹{p.priceInr}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}> / {p.durationMonths} months</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.625rem', color: '#94A3B8', fontWeight: 700 }}>EST. NET SAAS MARGIN</div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10B981', fontFamily: 'monospace' }}>
                          ~₹{Math.round(netMargin)} / pass
                        </div>
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
                      style={{ fontWeight: 600 }}
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
            maxWidth: '650px',
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
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 900, color: '#F8FAFC' }}>
                ✏️ Customize Plan: {editingPlan.name}
              </h2>
              <button
                onClick={() => setEditingPlan(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8125rem' }}>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>PLAN NAME</label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>BADGE / TARGET</label>
                <input
                  type="text"
                  value={editingPlan.badge}
                  onChange={(e) => setEditingPlan({ ...editingPlan, badge: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>RETAIL PRICE (₹/YEAR)</label>
                <input
                  type="number"
                  value={editingPlan.priceInr}
                  onChange={(e) => setEditingPlan({ ...editingPlan, priceInr: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid #EAB308', borderRadius: '6px', color: '#FCD34D', fontWeight: 'bold' }}
                />
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
            </div>

            {/* Checkbox Features */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.8125rem', color: '#CBD5E1' }}>
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
                style={{ backgroundColor: '#EAB308', borderColor: '#EAB308', color: '#000', fontWeight: 800 }}
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
            maxWidth: '650px',
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
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 900, color: '#F8FAFC' }}>
                ➕ Create New Custom Membership Plan
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8125rem' }}>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>PLAN NAME</label>
                <input
                  type="text"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  placeholder="e.g. Women Wellness Pass"
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>BADGE / TARGET</label>
                <input
                  type="text"
                  value={newPlan.badge}
                  onChange={(e) => setNewPlan({ ...newPlan, badge: e.target.value })}
                  placeholder="e.g. Moms & Maternity"
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>RETAIL PRICE (₹/YEAR)</label>
                <input
                  type="number"
                  value={newPlan.priceInr}
                  onChange={(e) => setNewPlan({ ...newPlan, priceInr: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid #38BDF8', borderRadius: '6px', color: '#38BDF8', fontWeight: 'bold' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>FREE CONSULTATIONS QUOTA</label>
                <input
                  type="number"
                  value={newPlan.freeConsults}
                  onChange={(e) => setNewPlan({ ...newPlan, freeConsults: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>LAB DISCOUNT %</label>
                <input
                  type="number"
                  value={newPlan.labDiscountPercent}
                  onChange={(e) => setNewPlan({ ...newPlan, labDiscountPercent: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>PHARMACY DISCOUNT %</label>
                <input
                  type="number"
                  value={newPlan.pharmacyDiscountPercent}
                  onChange={(e) => setNewPlan({ ...newPlan, pharmacyDiscountPercent: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px' }}>
              <Button variant="outline" size="md" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleCreatePlan}
                style={{ backgroundColor: '#38BDF8', borderColor: '#38BDF8', color: '#000', fontWeight: 800 }}
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
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F8FAFC', margin: '4px 0', fontFamily: 'monospace' }}>48,200</div>
              <span style={{ fontSize: '0.75rem', color: '#10B981' }}>+14.2% month-over-month growth</span>
            </div>
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '18px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>MONTHLY PHARMACY REFILLS</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#38BDF8', margin: '4px 0', fontFamily: 'monospace' }}>18,920</div>
              <span style={{ fontSize: '0.75rem', color: '#10B981' }}>84.6% repeat retention rate</span>
            </div>
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '18px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>HOME LAB COLLECTIONS DISPATCHED</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#C084FC', margin: '4px 0', fontFamily: 'monospace' }}>6,410</div>
              <span style={{ fontSize: '0.75rem', color: '#10B981' }}>Avg order value: ₹899</span>
            </div>
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '18px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>ACTIVE NETWORK PARTNERS</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FCD34D', margin: '4px 0', fontFamily: 'monospace' }}>142 Centers</div>
              <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>68 Doctors • 42 Labs • 32 Pharmas</span>
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
              {broadcastSent ? '✓ Broadcast Dispatched to 28,400 Patients!' : '🚀 Launch Mass WhatsApp Campaign'}
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
              {payoutsSettled ? '✓ All ₹2.42 Lakhs Settled via Instant UPI / NEFT!' : '⚡ Settle All ₹2.42 Lakhs via Instant Gateway'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
