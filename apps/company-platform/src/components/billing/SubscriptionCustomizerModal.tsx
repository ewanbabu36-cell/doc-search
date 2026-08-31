import React, { useState, useEffect } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { SubscriptionDto, SubscriptionStatus, BillingCycle } from '@docsearch/api-contracts';

interface SubscriptionCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedSubscription: SubscriptionDto) => void;
  initialSubscription?: SubscriptionDto | null;
}

export const SubscriptionCustomizerModal: React.FC<SubscriptionCustomizerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialSubscription
}) => {
  const [formData, setFormData] = useState({
    partnerTradeName: 'Apex Apollo Hospital Network',
    partnerTenantSlug: 'apex-apollo',
    productName: 'DocSearch Enterprise Healthcare Platform',
    planName: 'Gold Family Health & Hospital Suite',
    planVersion: '1.0.0',
    billingCycle: 'YEARLY' as BillingCycle,
    status: 'ACTIVE' as SubscriptionStatus,
    contractValueInr: 250000,
    discountInr: 15000,
    paymentMethod: 'UPI_AUTODEPOSIT_NET30',
    renewalMonths: 12
  });

  useEffect(() => {
    if (initialSubscription) {
      setFormData({
        partnerTradeName: initialSubscription.partnerTradeName,
        partnerTenantSlug: initialSubscription.partnerTenantSlug,
        productName: initialSubscription.productName,
        planName: initialSubscription.planName,
        planVersion: initialSubscription.planVersion,
        billingCycle: initialSubscription.billingCycle,
        status: initialSubscription.status,
        contractValueInr: Number((initialSubscription.metadata as any)?.contractValueInr) || 250000,
        discountInr: Number((initialSubscription.metadata as any)?.discountInr) || 0,
        paymentMethod: ((initialSubscription.metadata as any)?.paymentMethod as string) || 'UPI_AUTODEPOSIT_NET30',
        renewalMonths: 12
      });
    } else {
      setFormData({
        partnerTradeName: 'Apex Apollo Hospital Network',
        partnerTenantSlug: 'apex-apollo',
        productName: 'DocSearch Enterprise Healthcare Platform',
        planName: 'Gold Family Health & Hospital Suite',
        planVersion: '1.0.0',
        billingCycle: 'YEARLY',
        status: 'ACTIVE',
        contractValueInr: 250000,
        discountInr: 15000,
        paymentMethod: 'UPI_AUTODEPOSIT_NET30',
        renewalMonths: 12
      });
    }
  }, [initialSubscription]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const now = new Date();
      const renewal = new Date();
      renewal.setMonth(now.getMonth() + formData.renewalMonths);

      const saved: SubscriptionDto = {
        id: initialSubscription?.id || '11111111-1111-4111-8111-' + Math.floor(100000000000 + Math.random() * 900000000000),
        partnerId: initialSubscription?.partnerId || '11111111-1111-4111-8111-111111111101',
        partnerTradeName: formData.partnerTradeName,
        partnerTenantSlug: formData.partnerTenantSlug,
        productId: initialSubscription?.productId || '11111111-1111-4111-8111-111111111111',
        productName: formData.productName,
        planId: initialSubscription?.planId || '11111111-1111-4111-8111-111111111122',
        planName: formData.planName,
        planVersion: formData.planVersion,
        status: formData.status,
        billingCycle: formData.billingCycle,
        startDate: initialSubscription?.startDate || now.toISOString(),
        renewalDate: renewal.toISOString(),
        metadata: {
          contractValueInr: formData.contractValueInr,
          discountInr: formData.discountInr,
          paymentMethod: formData.paymentMethod
        },
        createdAt: initialSubscription?.createdAt || now.toISOString(),
        updatedAt: now.toISOString()
      };

      setIsSubmitting(false);
      onSuccess(saved);
      onClose();
    }, 500);
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
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>💳</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                {initialSubscription ? '✏️ Customize Healthcare Subscription Contract' : '➕ Create New Healthcare Partner Subscription'}
              </h2>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
              Manage commercial SaaS contract terms, renewal cycles, custom discounts, and payment mandates.
            </p>
          </div>
          <button onClick={onClose} style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.5rem', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                HEALTHCARE PARTNER / HOSPITAL *
              </label>
              <Input
                required
                value={formData.partnerTradeName}
                onChange={(e) => setFormData({
                  ...formData,
                  partnerTradeName: e.target.value,
                  partnerTenantSlug: e.target.value.toLowerCase().replace(/\s+/g, '-')
                })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                PRODUCT SUITE
              </label>
              <Select
                options={[
                  { label: 'DocSearch Enterprise Healthcare Platform', value: 'DocSearch Enterprise Healthcare Platform' },
                  { label: 'DocSearch Clinical AI & Voice Scribe Suite', value: 'DocSearch Clinical AI & Voice Scribe Suite' },
                  { label: 'DocSearch Interoperability & ABDM Gateway', value: 'DocSearch Interoperability & ABDM Gateway' }
                ]}
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                ASSIGNED PLAN TIER *
              </label>
              <Select
                options={[
                  { label: 'Gold Family Care & Hospital Tier', value: 'Gold Family Health & Hospital Suite' },
                  { label: 'Enterprise Hospital Network Tier (YEARLY)', value: 'Enterprise Hospital Network Tier' },
                  { label: 'Regional Clinic Group Tier (MONTHLY)', value: 'Regional Clinic Group Tier' },
                  { label: 'Silver Essential OPD Tier', value: 'Silver Essential OPD Tier' },
                  { label: 'Platinum Senior Care Tier', value: 'Platinum Senior Care Tier' }
                ]}
                value={formData.planName}
                onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                BILLING CYCLE
              </label>
              <Select
                options={[
                  { label: 'Yearly (Annual Contract)', value: 'YEARLY' },
                  { label: 'Monthly Recurring', value: 'MONTHLY' },
                  { label: 'Quarterly', value: 'QUARTERLY' },
                  { label: 'Custom Milestone', value: 'CUSTOM' }
                ]}
                value={formData.billingCycle}
                onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as BillingCycle })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                CONTRACT STATUS
              </label>
              <Select
                options={[
                  { label: 'Active', value: 'ACTIVE' },
                  { label: 'Pending Signature', value: 'PENDING' },
                  { label: 'Paused', value: 'PAUSED' },
                  { label: 'Suspended', value: 'SUSPENDED' }
                ]}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as SubscriptionStatus })}
              />
            </div>
          </div>

          {/* Financials Box */}
          <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '12px', padding: '14px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
              💰 Commercial Terms & Concessions
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>CONTRACT VALUE (₹)</label>
                <Input type="number" min="0" value={formData.contractValueInr} onChange={(e) => setFormData({ ...formData, contractValueInr: Number(e.target.value) })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>SPECIAL DISCOUNT (₹)</label>
                <Input type="number" min="0" value={formData.discountInr} onChange={(e) => setFormData({ ...formData, discountInr: Number(e.target.value) })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>PAYMENT METHOD</label>
                <Select
                  options={[
                    { label: 'UPI Auto-Mandate (Instant)', value: 'UPI_MANDATE' },
                    { label: 'Net-30 Invoice Payout', value: 'NET_30_INVOICE' },
                    { label: 'Direct Bank NEFT/RTGS', value: 'BANK_NEFT' }
                  ]}
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px' }}>
            <Button type="button" variant="outline" size="md" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" size="md" disabled={isSubmitting} style={{ backgroundColor: '#06B6D4', borderColor: '#06B6D4', color: '#070C16', fontWeight: 800 }}>
              {isSubmitting ? 'Activating Contract...' : '💾 Save & Enforce Subscription'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
