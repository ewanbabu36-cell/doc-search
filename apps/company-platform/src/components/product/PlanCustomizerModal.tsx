import React, { useState, useEffect } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { PlanDto, ProductDto, PlanStatus } from '@docsearch/api-contracts';

interface PlanCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedPlan: PlanDto) => void;
  initialPlan?: PlanDto | null;
  products: ProductDto[];
}

export const PlanCustomizerModal: React.FC<PlanCustomizerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialPlan,
  products
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    productId: products[0]?.id || '11111111-1111-4111-8111-111111111111',
    description: '',
    version: '1.0.0',
    status: 'ACTIVE' as PlanStatus,
    priceInr: 799,
    billingCycle: 'ANNUAL',
    freeConsults: 3,
    doctorPayoutInr: 220,
    labDiscountPct: 25,
    pharmaDiscountPct: 20,
    features: ['OPD EMR Desk', 'Hinglish AI Voice Scribe', 'Dynamic UPI QR', 'Free Home Sample Collection']
  });

  useEffect(() => {
    if (initialPlan) {
      setFormData({
        name: initialPlan.name,
        code: initialPlan.code,
        productId: initialPlan.productId,
        description: initialPlan.description,
        version: initialPlan.version || '1.0.0',
        status: initialPlan.status,
        priceInr: Number((initialPlan.metadata as any)?.priceInr) || 799,
        billingCycle: 'ANNUAL',
        freeConsults: Number((initialPlan.metadata as any)?.freeConsults) || 3,
        doctorPayoutInr: Number((initialPlan.metadata as any)?.doctorPayoutInr) || 220,
        labDiscountPct: Number((initialPlan.metadata as any)?.labDiscountPct) || 25,
        pharmaDiscountPct: Number((initialPlan.metadata as any)?.pharmaDiscountPct) || 20,
        features: ((initialPlan.metadata as any)?.features as string[]) || ['OPD EMR Desk', 'Hinglish AI Voice Scribe']
      });
    } else {
      setFormData({
        name: '',
        code: '',
        productId: products[0]?.id || '11111111-1111-4111-8111-111111111111',
        description: '',
        version: '1.0.0',
        status: 'ACTIVE',
        priceInr: 799,
        billingCycle: 'ANNUAL',
        freeConsults: 3,
        doctorPayoutInr: 220,
        labDiscountPct: 25,
        pharmaDiscountPct: 20,
        features: ['OPD EMR Desk', 'Hinglish AI Voice Scribe', 'Dynamic UPI QR', 'Free Home Sample Collection']
      });
    }
  }, [initialPlan, products]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const selectedProd = products.find((p) => p.id === formData.productId);
      const saved: PlanDto = {
        id: initialPlan?.id || '11111111-1111-4111-8111-' + Math.floor(100000000000 + Math.random() * 900000000000),
        productId: formData.productId,
        productName: selectedProd?.name || 'DocSearch Enterprise Healthcare Platform',
        code: formData.code || 'PLAN_CUSTOM_' + Date.now(),
        name: formData.name || 'Custom Care Plan',
        description: formData.description || 'Custom tailored healthcare subscription plan with tailored quotas.',
        status: formData.status,
        version: formData.version,
        entitlementCount: formData.features.length + 3,
        metadata: {
          priceInr: formData.priceInr,
          billingCycle: formData.billingCycle,
          freeConsults: formData.freeConsults,
          doctorPayoutInr: formData.doctorPayoutInr,
          labDiscountPct: formData.labDiscountPct,
          pharmaDiscountPct: formData.pharmaDiscountPct,
          features: formData.features
        },
        createdAt: initialPlan?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setIsSubmitting(false);
      onSuccess(saved);
      onClose();
    }, 500);
  };

  const availableFeatures = [
    'OPD EMR Desk',
    'Hinglish AI Voice Scribe',
    'Dynamic UPI QR Billing',
    'Free Home Sample Collection',
    '1-Click WebRTC Video Consult',
    'ABDM 14-Digit ABHA Kiosk',
    'Inpatient Ward & Bed ADT',
    'LIMS Lab & Pathology Sync',
    'Radiology DICOM Viewer',
    'ICU Live Telemetry Alarms'
  ];

  const handleToggleFeature = (f: string) => {
    const exists = formData.features.includes(f);
    setFormData({
      ...formData,
      features: exists ? formData.features.filter((item) => item !== f) : [...formData.features, f]
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#0F172A',
        border: '2px solid #06B6D4',
        borderRadius: '20px',
        maxWidth: '750px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        boxShadow: '0 25px 70px rgba(0,0,0,0.9)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>⚙️</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                {initialPlan ? '✏️ Customize Plan & Pricing' : '➕ Create New Subscription Plan / Tier'}
              </h2>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
              Define pricing, doctor payouts, discounts, and feature entitlements for patients or hospitals.
            </p>
          </div>
          <button onClick={onClose} style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.5rem', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>PLAN NAME *</label>
              <Input required placeholder="e.g. Gold Family Health Pass" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>PLAN CODE (UPPERCASE) *</label>
              <Input required placeholder="e.g. PLAN_GOLD_FAMILY" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>PRODUCT LINE</label>
              <Select
                options={products.map((p) => ({ label: p.name, value: p.id }))}
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>PLAN STATUS</label>
              <Select
                options={[
                  { label: 'Active', value: 'ACTIVE' },
                  { label: 'Draft', value: 'DRAFT' },
                  { label: 'Deprecated', value: 'DEPRECATED' }
                ]}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as PlanStatus })}
              />
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '12px', padding: '14px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
              💰 Pricing, Doctor Payout & Discount Splits
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>PLAN PRICE (₹)</label>
                <Input type="number" min="0" value={formData.priceInr} onChange={(e) => setFormData({ ...formData, priceInr: Number(e.target.value) })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>FREE CONSULTS</label>
                <Input type="number" min="0" value={formData.freeConsults} onChange={(e) => setFormData({ ...formData, freeConsults: Number(e.target.value) })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>DR. PAYOUT / VISIT (₹)</label>
                <Input type="number" min="0" value={formData.doctorPayoutInr} onChange={(e) => setFormData({ ...formData, doctorPayoutInr: Number(e.target.value) })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>LAB DISCOUNT (%)</label>
                <Input type="number" min="0" max="100" value={formData.labDiscountPct} onChange={(e) => setFormData({ ...formData, labDiscountPct: Number(e.target.value) })} />
              </div>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              ✓ Included Feature Grants ({formData.features.length} Enabled):
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '140px', overflowY: 'auto' }}>
              {availableFeatures.map((f) => {
                const isChecked = formData.features.includes(f);
                return (
                  <label
                    key={f}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.12)' : 'rgba(30, 41, 59, 0.4)',
                      border: isChecked ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.06)',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.6875rem',
                      color: isChecked ? '#FFF' : '#94A3B8'
                    }}
                  >
                    <input type="checkbox" checked={isChecked} onChange={() => handleToggleFeature(f)} />
                    <span>{f}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px' }}>
            <Button type="button" variant="outline" size="md" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" size="md" disabled={isSubmitting} style={{ backgroundColor: '#06B6D4', borderColor: '#06B6D4', color: '#070C16', fontWeight: 800 }}>
              {isSubmitting ? 'Saving Plan...' : '💾 Save & Publish Plan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
