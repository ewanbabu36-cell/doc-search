import React, { useState } from 'react';
import { Button, Input, Badge } from '@docsearch/ui-kit';
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

  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAiExtract = (textToParse: string) => {
    if (!textToParse.trim()) return;
    setIsAiProcessing(true);

    setTimeout(() => {
      // 1. Email extraction
      const emailMatch = textToParse.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const contactEmail = emailMatch ? emailMatch[0] : '';

      // 2. Phone extraction (10-digit Indian mobile or +91 format)
      const phoneMatch = textToParse.match(/(?:\+91[\s-]?)?[6789]\d{9}/);
      const contactPhone = phoneMatch ? (phoneMatch[0].startsWith('+91') ? phoneMatch[0] : `+91 ${phoneMatch[0]}`) : '';

      // 3. Clean string without email and phone for name parsing
      let clean = textToParse
        .replace(emailMatch ? emailMatch[0] : '', '')
        .replace(phoneMatch ? phoneMatch[0] : '', '')
        .trim();

      // 4. Contact / Doctor Name extraction
      let contactName = '';
      const drMatch = clean.match(/(?:Dr\.?|Doctor|Prof\.?|Mr\.?|Ms\.?|Haji)\s+[A-Za-z]+(?:\s+[A-Za-z]+)*/i);
      if (drMatch) {
        contactName = drMatch[0].trim();
      }

      // 5. Organization / Clinic / Pharmacy extraction
      let orgName = '';
      const orgMatch = clean.match(/([A-Za-z0-9&'\s]+(?:\s+(?:Hospital|Clinic|Care|Medical|Agency|Pharmacy|Lab|Diagnostic|Center|Centre|Institute|Health|Nursing|Multispeciality|Polyclinic))(?:\s+[A-Za-z]+)*)/i);
      if (orgMatch) {
        orgName = orgMatch[0].trim();
      }

      // Fallback extraction by comma or tokens if not matched by regex
      if (!contactName || !orgName) {
        const parts = textToParse.split(/[,;\n]/).map((p) => p.trim()).filter(Boolean);
        for (const p of parts) {
          if (!p.includes('@') && !p.match(/\d{5,}/)) {
            const low = p.toLowerCase();
            if (
              !orgName &&
              (low.includes('hospital') ||
                low.includes('clinic') ||
                low.includes('medical') ||
                low.includes('agency') ||
                low.includes('pharmacy') ||
                low.includes('lab'))
            ) {
              orgName = p;
            } else if (
              !contactName &&
              (low.startsWith('dr') ||
                low.startsWith('haji') ||
                low.includes('sharma') ||
                low.includes('verma') ||
                low.includes('singh') ||
                low.includes('patel') ||
                p.split(' ').length <= 3)
            ) {
              contactName = p;
            }
          }
        }
      }

      if (!orgName && clean) {
        const tokens = clean.split(/[,;\n]/).map((t) => t.trim()).filter(Boolean);
        orgName = tokens[0] || 'New Healthcare Lead';
      }

      setFormData((prev) => ({
        ...prev,
        organizationName: orgName || prev.organizationName,
        contactName: contactName || prev.contactName,
        contactEmail: contactEmail || prev.contactEmail,
        contactPhone: contactPhone || prev.contactPhone,
        source: textToParse.toLowerCase().includes('referral')
          ? 'PARTNER_REFERRAL'
          : textToParse.toLowerCase().includes('conference') || textToParse.toLowerCase().includes('event')
          ? 'HEALTHCARE_CONFERENCE'
          : 'INBOUND_WEB'
      }));

      setIsAiProcessing(false);
      setAiNotice(`✓ AI Success: Auto-extracted "${orgName || 'Facility'}" and "${contactName || 'Contact'}"!`);
      setTimeout(() => setAiNotice(null), 5000);
    }, 400);
  };

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
        metadata: { aiExtracted: true, aiPromptSnippet: aiPrompt.slice(0, 100) },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setIsSubmitting(false);
      onSuccess(created);
      onClose();
    }, 500);
  };

  return (
    <div
      style={{
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
      }}
    >
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '2px solid #06B6D4',
          borderRadius: '20px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 25px 70px rgba(0,0,0,0.9)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '12px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                ➕ Add New Sales Lead / Clinic Prospect
              </h2>
              <Badge variant="success">🤖 AI-Powered</Badge>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
              Add via AI Natural Language Prompt or fill out details manually.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.25rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* AI Smart Lead Intake Box */}
        <div
          style={{
            backgroundColor: 'rgba(6, 182, 212, 0.08)',
            border: '1.5px dashed #06B6D4',
            borderRadius: '12px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8' }}>
              ✨ AI Smart Intake (Paste unstructured text, visiting card, or WhatsApp message)
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Zero Manual Typing</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="e.g. Dr. A.K. Verma, Apex Heart Hospital Lucknow, 9876543210, alok@apex.org"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#F8FAFC',
                fontSize: '0.8125rem',
                outline: 'none'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAiExtract(aiPrompt);
                }
              }}
            />
            <button
              type="button"
              onClick={() => handleAiExtract(aiPrompt)}
              disabled={isAiProcessing || !aiPrompt.trim()}
              style={{
                backgroundColor: '#06B6D4',
                color: '#070C16',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 900,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {isAiProcessing ? '⚡ Parsing...' : '⚡ AI Auto-Fill'}
            </button>
          </div>

          {/* Preset Prompts for Instant Testing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>Quick AI Try:</span>
            {[
              {
                label: '🏥 Metro Heart Clinic',
                text: 'Dr. Amit Roy, Metro Specialty Heart Clinic Patna, 9811223344, amit@metroclinic.in'
              },
              {
                label: '💊 Haji Medical Agency',
                text: 'Haji Mohammad, Haji Medical Agency Pharmacy Store, 9812345678, haji@agency.com'
              },
              {
                label: '🔬 City Diagnostic Lab',
                text: 'Dr. Neha Kapoor, City Diagnostic & Imaging Lab, 9899001122, info@citylab.org'
              }
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setAiPrompt(p.text);
                  handleAiExtract(p.text);
                }}
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  color: '#94A3B8',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {aiNotice && (
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10B981',
                borderRadius: '6px',
                padding: '6px 10px',
                color: '#A7F3D0',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              {aiNotice}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#CBD5E1',
                  marginBottom: '4px'
                }}
              >
                FACILITY / CLINIC NAME *
              </label>
              <Input
                required
                placeholder="e.g. Apex Heart & Multispeciality"
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#CBD5E1',
                  marginBottom: '4px'
                }}
              >
                KEY DOCTOR / CONTACT PERSON *
              </label>
              <Input
                required
                placeholder="e.g. Dr. Rajesh Sharma, MD"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#CBD5E1',
                  marginBottom: '4px'
                }}
              >
                EMAIL ADDRESS *
              </label>
              <Input
                required
                type="email"
                placeholder="dr.sharma@apex.org"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#CBD5E1',
                  marginBottom: '4px'
                }}
              >
                PHONE NUMBER *
              </label>
              <Input
                required
                placeholder="+91 98765 43210"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              paddingTop: '14px'
            }}
          >
            <Button type="button" variant="outline" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              style={{
                backgroundColor: '#06B6D4',
                borderColor: '#06B6D4',
                color: '#070C16',
                fontWeight: 800
              }}
            >
              {isSubmitting ? 'Saving Lead...' : '🚀 Create Sales Lead'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

