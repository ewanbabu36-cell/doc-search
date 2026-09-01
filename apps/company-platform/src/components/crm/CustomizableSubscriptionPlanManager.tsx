import React, { useState } from 'react';

export interface PlanDefinition {
  id: string;
  name: string;
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

const DEFAULT_PLANS: PlanDefinition[] = [
  {
    id: 'starter',
    name: 'Starter Clinic / Solo Lab',
    badge: 'Standard Practice',
    priceMonthly: 2499,
    priceAnnual: 24990,
    maxSeats: 3,
    maxFacilities: 1,
    storageGb: 5,
    abdmTier: 'M1 Basic (ABHA Creation)',
    aiScribeQuotas: 50,
    whatsAppQuota: 500,
    isPopular: false,
    features: ['OPD EMR & Prescription (Rx)', 'Basic Billing & Cash Memo', 'Standard Email Support']
  },
  {
    id: 'pro',
    name: 'Professional Multi-Specialty',
    badge: 'Most Popular',
    priceMonthly: 7999,
    priceAnnual: 79990,
    maxSeats: 15,
    maxFacilities: 3,
    storageGb: 50,
    abdmTier: 'Full M1, M2, M3 (HIP/HIU)',
    aiScribeQuotas: 500,
    whatsAppQuota: 2500,
    isPopular: true,
    features: ['Full Pathology LIMS & Analyzer Sync', 'Gold Trust Badge & QR Seal', 'Priority 6-Hour SLA Support']
  },
  {
    id: 'enterprise',
    name: 'Enterprise Hospital Network',
    badge: 'Hospital Group',
    priceMonthly: 24999,
    priceAnnual: 249990,
    maxSeats: 999,
    maxFacilities: 999,
    storageGb: 500,
    abdmTier: 'Dedicated Gateway (M1-M3 FastTrack)',
    aiScribeQuotas: 5000,
    whatsAppQuota: 15000,
    isPopular: false,
    features: ['Multi-Branch Central Billing', '24x7 Dedicated TAM Support', 'Custom FHIR & HL7 Webhooks']
  }
];

const STORAGE_KEY = 'docsearch_custom_subscription_plans';

export const CustomizableSubscriptionPlanManager: React.FC = () => {
  const [plans, setPlans] = useState<PlanDefinition[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return DEFAULT_PLANS;
  });

  const [editingPlan, setEditingPlan] = useState<PlanDefinition | null>(null);
  const [saveToast, setSaveToast] = useState(false);

  const handleSaveEdit = () => {
    if (!editingPlan) return;
    const updated = plans.map((p) => (p.id === editingPlan.id ? editingPlan : p));
    setPlans(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    setEditingPlan(null);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleResetPlans = () => {
    setPlans(DEFAULT_PLANS);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#070C16', color: '#F8FAFC', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#F8FAFC' }}>
            💳 Subscription & License Tier Customizer
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
            Customize pricing, doctor seats, storage quotas, AI features and entitlements in real-time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {saveToast && (
            <span style={{ fontSize: '0.75rem', backgroundColor: '#10B981', color: '#FFF', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>
              ✓ Pricing & Quotas Updated!
            </span>
          )}
          <button
            type="button"
            onClick={handleResetPlans}
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#CBD5E1', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 14px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}
          >
            ↺ Reset Defaults
          </button>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              backgroundColor: '#0F172A',
              border: plan.isPopular ? '2px solid #06B6D4' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
          >
            {plan.isPopular && (
              <span style={{ position: 'absolute', top: '-12px', right: '20px', backgroundColor: '#06B6D4', color: '#070C16', fontSize: '0.6875rem', fontWeight: 900, padding: '2px 10px', borderRadius: '12px' }}>
                MOST POPULAR
              </span>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>{plan.name}</h3>
                <span style={{ fontSize: '0.6875rem', backgroundColor: 'rgba(255,255,255,0.1)', color: '#38BDF8', padding: '2px 8px', borderRadius: '6px' }}>{plan.badge}</span>
              </div>

              <div style={{ margin: '16px 0' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: '#38BDF8' }}>₹{plan.priceMonthly.toLocaleString('en-IN')}</span>
                <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}> / month</span>
                <div style={{ fontSize: '0.75rem', color: '#34D399', marginTop: '2px' }}>
                  Annual: ₹{plan.priceAnnual.toLocaleString('en-IN')} (Save 20%)
                </div>
              </div>

              {/* Quotas */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '12px 0', margin: '14px 0', fontSize: '0.75rem', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>👥 <strong>Doctor Seats:</strong> {plan.maxSeats === 999 ? 'Unlimited' : `${plan.maxSeats} Active Seats`}</div>
                <div>🏥 <strong>Facilities/Branches:</strong> {plan.maxFacilities === 999 ? 'Unlimited' : `${plan.maxFacilities} Branches`}</div>
                <div>☁️ <strong>Vault Storage:</strong> {plan.storageGb} GB</div>
                <div>🛡️ <strong>ABDM 2.0:</strong> {plan.abdmTier}</div>
                <div>🤖 <strong>AI Scribe:</strong> {plan.aiScribeQuotas} Transcripts/mo</div>
                <div>💬 <strong>WhatsApp Triggers:</strong> {plan.whatsAppQuota}/mo</div>
              </div>

              {/* Feature list */}
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.6 }}>
                {plan.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setEditingPlan(plan)}
              style={{
                marginTop: '20px',
                backgroundColor: '#06B6D4',
                color: '#070C16',
                border: 'none',
                borderRadius: '8px',
                padding: '10px',
                fontWeight: 800,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              ✏️ Edit Plan Pricing & Quotas
            </button>
          </div>
        ))}
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 12000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
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
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px' }}>Annual Price (₹):</label>
                  <input
                    type="number"
                    value={editingPlan.priceAnnual}
                    onChange={(e) => setEditingPlan({ ...editingPlan, priceAnnual: Number(e.target.value) })}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px', color: '#FFF' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px' }}>Max Seats:</label>
                  <input
                    type="number"
                    value={editingPlan.maxSeats}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxSeats: Number(e.target.value) })}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px' }}>Storage (GB):</label>
                  <input
                    type="number"
                    value={editingPlan.storageGb}
                    onChange={(e) => setEditingPlan({ ...editingPlan, storageGb: Number(e.target.value) })}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px', color: '#FFF' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px' }}>AI Scribe Quotas/mo:</label>
                  <input
                    type="number"
                    value={editingPlan.aiScribeQuotas}
                    onChange={(e) => setEditingPlan({ ...editingPlan, aiScribeQuotas: Number(e.target.value) })}
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
                style={{ flex: 1, backgroundColor: '#10B981', color: '#FFF', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 800, cursor: 'pointer' }}
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
