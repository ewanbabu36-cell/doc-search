import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { LeadDto, LeadSource } from '@docsearch/api-contracts';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newLead: LeadDto) => void;
}

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    organizationName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    source: 'INBOUND_WEB' as LeadSource,
    assignedOwnerEmail: 'motu.sales@docsearch.in'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const created: LeadDto = {
        id: '11111111-1111-4111-8111-' + Math.floor(100000000000 + Math.random() * 900000000000),
        organizationName: formData.organizationName || 'Dr. Sharma Heart Clinic',
        contactName: formData.contactName || 'Dr. Rajesh Sharma',
        contactEmail: formData.contactEmail || 'dr.rajesh@clinic.com',
        contactPhone: formData.contactPhone || '+91 98765 43210',
        source: formData.source,
        status: 'NEW',
        assignedOwnerEmail: formData.assignedOwnerEmail,
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setIsSubmitting(false);
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
        maxWidth: '650px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 25px 70px rgba(0,0,0,0.9)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
              ➕ Create New Sales Lead / Clinic Prospect
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
              Add a new doctor clinic, hospital branch, or diagnostic center into the sales pipeline.
            </p>
          </div>
          <button onClick={onClose} style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>FACILITY / CLINIC NAME *</label>
              <Input required placeholder="e.g. Apex Heart & Multispeciality" value={formData.organizationName} onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>KEY DOCTOR / CONTACT PERSON *</label>
              <Input required placeholder="e.g. Dr. Rajesh Sharma, MD" value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>EMAIL ADDRESS *</label>
              <Input required type="email" placeholder="dr.sharma@apex.org" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>PHONE NUMBER *</label>
              <Input required placeholder="+91 98765 43210" value={formData.contactPhone} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px' }}>
            <Button type="button" variant="outline" size="md" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" size="md" disabled={isSubmitting} style={{ backgroundColor: '#06B6D4', borderColor: '#06B6D4', color: '#070C16', fontWeight: 800 }}>
              {isSubmitting ? 'Saving Lead...' : '🚀 Create Sales Lead'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
