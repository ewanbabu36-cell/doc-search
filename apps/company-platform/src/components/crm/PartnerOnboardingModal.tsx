import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { PartnerType, PartnerProfileDto } from '@docsearch/api-contracts';
import { partnerService } from '../../services/partner-service.js';

interface PartnerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPartner: PartnerProfileDto) => void;
}

export const PartnerOnboardingModal: React.FC<PartnerOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    legalName: '',
    tradeName: '',
    partnerType: 'HOSPITAL_NETWORK' as PartnerType,
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    branchCount: 1,
    city: 'New Delhi',
    state: 'Delhi',
    gstin: '07AAAAA0000A1Z5',
    panNumber: 'ABCDE1234F'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const created: PartnerProfileDto = {
        id: '11111111-1111-4111-8111-' + Math.floor(100000000000 + Math.random() * 900000000000),
        tenantId: '11111111-1111-4111-8111-111111111111',
        tenantSlug: (formData.tradeName || 'hospital').toLowerCase().replace(/\s+/g, '-'),
        legalName: formData.legalName || 'Apex Apollo Healthcare Pvt Ltd',
        tradeName: formData.tradeName || formData.legalName || 'Apex Apollo Hospital',
        partnerType: formData.partnerType,
        lifecycleStatus: 'ONBOARDING',
        verificationStatus: 'IN_REVIEW',
        onboardingStep: 'ORGANIZATION_PROFILE',
        onboardingProgressPercent: 25,
        primaryContact: {
          name: formData.contactName || 'Dr. Vikram Malhotra',
          email: formData.contactEmail || 'admin@apexapollo.org',
          phone: formData.contactPhone || '+91 98765 43210',
          roleTitle: 'Hospital Administrator'
        },
        branchCount: Number(formData.branchCount) || 1,
        userCount: 12,
        metadata: {
          city: formData.city,
          state: formData.state,
          gstin: formData.gstin,
          pan: formData.panNumber
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setIsSubmitting(false);
      partnerService.addPartner(created);
      onSuccess(created);
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
        gap: '20px',
        boxShadow: '0 25px 70px rgba(0,0,0,0.9)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.75rem' }}>🏥</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                Onboard New Healthcare Partner / Hospital Lead
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
              Register hospital network, diagnostic chain, or clinic group into DocSearch Partner Ecosystem.
            </p>
          </div>
          <button onClick={onClose} style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.5rem', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>LEGAL ENTITY NAME *</label>
              <Input required placeholder="e.g. Apex Apollo Healthcare Pvt Ltd" value={formData.legalName} onChange={(e) => setFormData({ ...formData, legalName: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>BRAND / TRADE NAME *</label>
              <Input required placeholder="e.g. Apex Hospital South Delhi" value={formData.tradeName} onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>PARTNER CLASSIFICATION *</label>
              <Select
                options={[
                  { label: 'Hospital Network', value: 'HOSPITAL_NETWORK' },
                  { label: 'Clinic Group', value: 'CLINIC_GROUP' },
                  { label: 'Surgical Center', value: 'SURGICAL_CENTER' },
                  { label: 'Diagnostic Pathology Lab', value: 'DIAGNOSTIC_LAB' },
                  { label: 'Individual Specialist Practice', value: 'INDIVIDUAL_PRACTICE' }
                ]}
                value={formData.partnerType}
                onChange={(e) => setFormData({ ...formData, partnerType: e.target.value as PartnerType })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>NUMBER OF BRANCHES / UNITS</label>
              <Input type="number" min="1" max="100" value={formData.branchCount} onChange={(e) => setFormData({ ...formData, branchCount: Number(e.target.value) })} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#06B6D4', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
              Primary Contact & Nodal Officer
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>CONTACT PERSON *</label>
                <Input required placeholder="Dr. Rajesh / Administrator" value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>WORK EMAIL *</label>
                <Input required type="email" placeholder="admin@hospital.com" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>PHONE NUMBER *</label>
                <Input required placeholder="+91 98765 43210" value={formData.contactPhone} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', marginTop: '8px' }}>
            <Button type="button" variant="outline" size="md" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" size="md" disabled={isSubmitting} style={{ backgroundColor: '#06B6D4', borderColor: '#06B6D4', color: '#070C16', fontWeight: 800 }}>
              {isSubmitting ? 'Registering Partner...' : '🚀 Submit & Onboard Hospital'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
