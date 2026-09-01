import React, { useState } from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';

interface WhiteLabelConfig {
  hospitalName: string;
  brandTagline: string;
  logoUrl: string;
  primaryColorHex: string;
  accentColorHex: string;
  customCnameDomain: string;
  sslStatus: 'PROVISIONED_ACTIVE' | 'PENDING_DNS_VERIFICATION';
  smsSenderId: string;
  supportEmail: string;
  isPublished: boolean;
}

const PRESET_COLORS = [
  { name: 'DocSearch Cyan', primary: '#06B6D4', accent: '#3B82F6' },
  { name: 'Apollo Emerald', primary: '#059669', accent: '#10B981' },
  { name: 'Mayo Navy', primary: '#1E40AF', accent: '#60A5FA' },
  { name: 'Cleveland Crimson', primary: '#DC2626', accent: '#F87171' },
  { name: 'Max Purple Care', primary: '#7C3AED', accent: '#A78BFA' }
];

export const HospitalWhiteLabelStudioView: React.FC = () => {
  const [config, setConfig] = useState<WhiteLabelConfig>({
    hospitalName: 'Apollo Hospitals & Medical Centers',
    brandTagline: 'Touching Lives, Transforming Healthcare',
    logoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=150&auto=format&fit=crop&q=80',
    primaryColorHex: '#059669',
    accentColorHex: '#10B981',
    customCnameDomain: 'portal.apollohospitals.com',
    sslStatus: 'PROVISIONED_ACTIVE',
    smsSenderId: 'APOLLO',
    supportEmail: 'care@apollohospitals.com',
    isPublished: true
  });

  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const handleSaveWhiteLabel = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveNotice(`✓ White-Label Theme successfully compiled and deployed to Edge CDN for "${config.customCnameDomain}"!`);
    setTimeout(() => setSaveNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            🎨 Enterprise Hospital White-Label & Brand Customization Studio
          </h2>
          <Badge variant="success">● Multi-Tenant Edge Theme Engine Active</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Enable hospitals and clinics to fully white-label the patient portal, doctor EMR, and custom CNAME domains with their own brand identity
        </p>
      </div>

      {saveNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {saveNotice}
        </div>
      )}

      {/* Grid: Editor Form + Live Interactive Preview Mockup */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
        {/* Left: Customizer Controls */}
        <Card title="⚙️ Hospital Brand & Domain Settings">
          <form onSubmit={handleSaveWhiteLabel} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem' }}>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px', fontWeight: 700 }}>HOSPITAL / CLINIC DISPLAY NAME *</label>
              <input
                type="text"
                required
                value={config.hospitalName}
                onChange={(e) => setConfig({ ...config, hospitalName: e.target.value })}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF', fontSize: '0.8125rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px', fontWeight: 700 }}>BRAND TAGLINE</label>
              <input
                type="text"
                value={config.brandTagline}
                onChange={(e) => setConfig({ ...config, brandTagline: e.target.value })}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF', fontSize: '0.8125rem' }}
              />
            </div>

            {/* Brand Colors Preset */}
            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '6px', fontWeight: 700 }}>PRIMARY BRAND COLOR THEME</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {PRESET_COLORS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setConfig({ ...config, primaryColorHex: p.primary, accentColorHex: p.accent })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#1E293B',
                      border: config.primaryColorHex === p.primary ? `2px solid ${p.primary}` : '1px solid #475569',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      color: '#E2E8F0',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: p.primary }} />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom CNAME Domain */}
            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px', fontWeight: 700 }}>CUSTOM WHITE-LABEL CNAME DOMAIN *</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  required
                  value={config.customCnameDomain}
                  onChange={(e) => setConfig({ ...config, customCnameDomain: e.target.value })}
                  style={{ flex: 1, backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#38BDF8', fontFamily: 'monospace', fontSize: '0.8125rem' }}
                />
                <Badge variant="success">✓ SSL Auto-Issued</Badge>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px', fontWeight: 700 }}>SMS / WHATSAPP SENDER ID</label>
                <input
                  type="text"
                  maxLength={6}
                  value={config.smsSenderId}
                  onChange={(e) => setConfig({ ...config, smsSenderId: e.target.value.toUpperCase() })}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF', fontWeight: 800 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px', fontWeight: 700 }}>PATIENT SUPPORT EMAIL</label>
                <input
                  type="email"
                  value={config.supportEmail}
                  onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              style={{
                backgroundColor: config.primaryColorHex,
                color: '#FFF',
                fontWeight: 900,
                marginTop: '8px',
                boxShadow: `0 4px 16px ${config.primaryColorHex}66`
              }}
            >
              🚀 Save & Deploy Hospital White-Label Theme
            </Button>
          </form>
        </Card>

        {/* Right: Live Interactive White-Label Mockup */}
        <Card title="📱 Live Hospital White-Label Preview Mockup">
          <div
            style={{
              backgroundColor: '#070C16',
              border: `2px solid ${config.primaryColorHex}`,
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: `0 10px 40px ${config.primaryColorHex}33`
            }}
          >
            {/* Mock Hospital Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: config.primaryColorHex,
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '1rem'
                  }}
                >
                  {config.hospitalName.charAt(0)}
                </div>
                <div>
                  <strong style={{ color: '#FFF', fontSize: '0.9375rem', display: 'block' }}>{config.hospitalName}</strong>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{config.brandTagline}</span>
                </div>
              </div>

              <span style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6875rem', color: config.accentColorHex, fontFamily: 'monospace' }}>
                {config.customCnameDomain}
              </span>
            </div>

            {/* Mock Patient Portal Card */}
            <div style={{ backgroundColor: '#0F172A', borderRadius: '10px', padding: '14px', border: '1px solid #1E293B' }}>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800 }}>PATIENT SELF-SERVICE HUB</span>
              <h4 style={{ margin: '4px 0 8px', color: '#FFF' }}>Book OPD & Video Consultation</h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#CBD5E1', lineHeight: '1.4' }}>
                Connect with 450+ Top Specialists at {config.hospitalName}. Zero waiting time with instant digital prescription.
              </p>
              <button
                type="button"
                style={{
                  backgroundColor: config.primaryColorHex,
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  marginTop: '10px',
                  cursor: 'pointer'
                }}
              >
                Book Instant Appointment
              </button>
            </div>

            {/* Mock SMS notification */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px', borderLeft: `3px solid ${config.accentColorHex}`, fontSize: '0.75rem' }}>
              <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.6875rem' }}>WhatsApp Sender ID: <strong>{config.smsSenderId}</strong></span>
              <span style={{ color: '#E2E8F0', marginTop: '2px', display: 'block' }}>
                &ldquo;Dear Patient, your consultation with Dr. Mehta at {config.hospitalName} is confirmed for 4:00 PM.&rdquo;
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
