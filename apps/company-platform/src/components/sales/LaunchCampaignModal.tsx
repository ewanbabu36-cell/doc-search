import React, { useState, useEffect } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { CampaignDto, CampaignType, CampaignStatus } from '@docsearch/api-contracts';

interface LaunchCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedCampaign: CampaignDto) => void;
  initialCampaign?: CampaignDto | null;
}

export const LaunchCampaignModal: React.FC<LaunchCampaignModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCampaign
}) => {
  const [formData, setFormData] = useState({
    name: '2026 Q3 Doctor EMR & Voice Scribe Field Drive',
    type: 'ENTERPRISE_HOSPITAL_OUTREACH' as CampaignType,
    targetSegment: 'Private Clinics & Multi-speciality Hospital Networks',
    ownerEmail: 'motu.sales@docsearch.in',
    status: 'ACTIVE' as CampaignStatus,
    budgetInr: 75000,
    channels: 'WhatsApp Verified Bot + Doctor Field Visits (Motu)',
    description: 'Empower local OPD clinics with 1-Click Hinglish Voice Scribe & ABDM ABHA Kiosk demonstration.'
  });

  useEffect(() => {
    if (initialCampaign) {
      setFormData({
        name: initialCampaign.name,
        type: initialCampaign.type,
        targetSegment: initialCampaign.targetSegment,
        ownerEmail: initialCampaign.ownerEmail,
        status: initialCampaign.status,
        budgetInr: Number((initialCampaign.metadata as any)?.budgetInr) || 75000,
        channels: ((initialCampaign.metadata as any)?.channels as string) || 'WhatsApp Bot + Field Visits',
        description: initialCampaign.description
      });
    } else {
      setFormData({
        name: '2026 Q3 Doctor EMR & Voice Scribe Field Drive',
        type: 'ENTERPRISE_HOSPITAL_OUTREACH',
        targetSegment: 'Private Clinics & Multi-speciality Hospital Networks',
        ownerEmail: 'motu.sales@docsearch.in',
        status: 'ACTIVE',
        budgetInr: 75000,
        channels: 'WhatsApp Verified Bot + Doctor Field Visits (Motu)',
        description: 'Empower local OPD clinics with 1-Click Hinglish Voice Scribe & ABDM ABHA Kiosk demonstration.'
      });
    }
  }, [initialCampaign]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const now = new Date();
      const end = new Date();
      end.setMonth(now.getMonth() + 3);

      const saved: CampaignDto = {
        id: initialCampaign?.id || '11111111-1111-4111-8111-' + Math.floor(100000000000 + Math.random() * 900000000000),
        name: formData.name,
        type: formData.type,
        status: formData.status,
        targetSegment: formData.targetSegment,
        startDate: initialCampaign?.startDate || now.toISOString(),
        endDate: initialCampaign?.endDate || end.toISOString(),
        ownerEmail: formData.ownerEmail,
        description: formData.description,
        metadata: {
          budgetInr: formData.budgetInr,
          channels: formData.channels
        },
        createdAt: initialCampaign?.createdAt || now.toISOString(),
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
        maxWidth: '700px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '26px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 25px 70px rgba(0,0,0,0.9)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>📢</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                {initialCampaign ? '✏️ Edit Marketing Campaign' : '🚀 Launch New Marketing & Doctor Outreach Campaign'}
              </h2>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
              Plan, broadcast, and execute doctor outreach, clinic acquisition drives, and hospital webinars.
            </p>
          </div>
          <button onClick={onClose} style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.5rem', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
              CAMPAIGN NAME *
            </label>
            <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                CAMPAIGN TYPE
              </label>
              <Select
                options={[
                  { label: 'Enterprise Hospital Outreach', value: 'ENTERPRISE_HOSPITAL_OUTREACH' },
                  { label: 'Clinic Summit & Doctor Invitation', value: 'CLINIC_SUMMIT_INVITATION' },
                  { label: 'Digital Health Showcase', value: 'DIGITAL_HEALTH_SHOWCASE' },
                  { label: 'Product Release Announcement', value: 'PRODUCT_RELEASE_ANNOUNCEMENT' },
                  { label: 'Partner Expansion Drive', value: 'PARTNER_EXPANSION' }
                ]}
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as CampaignType })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                CAMPAIGN STATUS
              </label>
              <Select
                options={[
                  { label: 'Active (Live)', value: 'ACTIVE' },
                  { label: 'Scheduled', value: 'SCHEDULED' },
                  { label: 'Draft', value: 'DRAFT' },
                  { label: 'Paused', value: 'PAUSED' },
                  { label: 'Completed', value: 'COMPLETED' }
                ]}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as CampaignStatus })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                TARGET HEALTHCARE SEGMENT *
              </label>
              <Input required value={formData.targetSegment} onChange={(e) => setFormData({ ...formData, targetSegment: e.target.value })} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                CAMPAIGN OWNER EMAIL *
              </label>
              <Input required type="email" value={formData.ownerEmail} onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                ESTIMATED BUDGET (₹)
              </label>
              <Input type="number" min="0" value={formData.budgetInr} onChange={(e) => setFormData({ ...formData, budgetInr: Number(e.target.value) })} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                MARKETING CHANNELS
              </label>
              <Input value={formData.channels} onChange={(e) => setFormData({ ...formData, channels: e.target.value })} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
              DESCRIPTION & GOAL
            </label>
            <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px' }}>
            <Button type="button" variant="outline" size="md" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" size="md" disabled={isSubmitting} style={{ backgroundColor: '#06B6D4', borderColor: '#06B6D4', color: '#070C16', fontWeight: 800 }}>
              {isSubmitting ? 'Launching...' : '🚀 Launch Campaign'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
