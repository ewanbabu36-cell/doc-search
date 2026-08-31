import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { SupportTicketDto, TicketCategory, TicketPriority } from '@docsearch/api-contracts';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTicket: SupportTicketDto) => void;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    partnerTradeName: 'Apex Heart Hospital',
    title: 'Zebra 2D Barcode Scanner WebUSB Driver Assistance',
    category: 'TECHNICAL_INCIDENT' as TicketCategory,
    priority: 'HIGH' as TicketPriority,
    description: 'Hospital reception wants to calibrate 2D scanner for 1-Second ABHA Scan & Share kiosk.'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const created: SupportTicketDto = {
        id: '11111111-1111-4111-8111-' + Math.floor(100000000000 + Math.random() * 900000000000),
        ticketNumber: 'TICK-' + Math.floor(1000 + Math.random() * 9000),
        partnerId: '11111111-1111-4111-8111-111111111101',
        partnerTradeName: formData.partnerTradeName,
        partnerTenantSlug: 'apex-heart',
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        status: 'OPEN',
        slaStatus: 'WITHIN_SLA',
        assignedAgentEmail: 'pooja.support@docsearch.in',
        submittedByEmail: 'admin@apexheart.org',
        submittedByName: 'Dr. Vikram Malhotra',
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
        boxShadow: '0 25px 70px rgba(0,0,0,0.9)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
              🎧 Open New Hospital Support Ticket
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
              Log a partner incident, technical query, or hardware setup request with SLA tracking.
            </p>
          </div>
          <button onClick={onClose} style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>HOSPITAL / PARTNER NAME *</label>
              <Input required value={formData.partnerTradeName} onChange={(e) => setFormData({ ...formData, partnerTradeName: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>TICKET CATEGORY</label>
              <Select
                options={[
                  { label: 'Technical Incident', value: 'TECHNICAL_INCIDENT' },
                  { label: 'FHIR / HL7 Integration', value: 'INTEGRATION_FHIR_HL7' },
                  { label: 'User Access & RBAC', value: 'USER_ACCESS_RBAC' },
                  { label: 'Commercial & Billing', value: 'COMMERCIAL_BILLING' }
                ]}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as TicketCategory })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>TITLE / SUBJECT *</label>
            <Input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>DESCRIPTION</label>
            <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px' }}>
            <Button type="button" variant="outline" size="md" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" size="md" disabled={isSubmitting} style={{ backgroundColor: '#38BDF8', borderColor: '#38BDF8', color: '#070C16', fontWeight: 800 }}>
              {isSubmitting ? 'Opening Ticket...' : '🚀 Open Support Ticket'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
