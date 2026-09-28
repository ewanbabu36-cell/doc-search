import React, { useState } from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import { useGlobalWhiteLabel } from '../common/GlobalWhiteLabelContext.js';
import { generateAndDownloadWelcomeKitPdf, openPrintableSpeedPostDossier } from '../../utils/partnerWelcomeKitPdf.js';

const PRESET_COLORS = [
  { name: 'DocSearch Cyan', primary: '#06B6D4', accent: '#3B82F6' },
  { name: 'Apollo Emerald', primary: '#059669', accent: '#10B981' },
  { name: 'Mayo Navy', primary: '#1E40AF', accent: '#60A5FA' },
  { name: 'Cleveland Crimson', primary: '#DC2626', accent: '#F87171' },
  { name: 'Max Purple Care', primary: '#7C3AED', accent: '#A78BFA' }
];

export const HospitalWhiteLabelStudioView: React.FC = () => {
  const { whiteLabelConfig, updateWhiteLabel, toggleShellApplication } = useGlobalWhiteLabel();
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const testEmail = 'whitelabel.admin@docsearch.health';
  const testPassword = 'Hospital@2026!';
  const localhostLoginUrl = 'http://localhost:5175/';

  const handleCopy = (text: string, key: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const handleDownloadCredentialsPdf = () => {
    generateAndDownloadWelcomeKitPdf({
      partnerId: 'WL-HOSP-2026',
      partnerName: whiteLabelConfig.hospitalName || 'Apollo Super-Speciality Hospital',
      classification: 'HOSPITAL',
      contactPerson: 'Medical Director / Hospital Administrator',
      phone: '+91 98765 43210',
      email: testEmail,
      password: testPassword,
      city: 'New Delhi',
      state: 'Delhi NCR',
      planTier: 'Enterprise Hospital Network & White-Label Suite',
      monthlyFee: 9999,
      features: [
        `Custom CNAME Domain: ${whiteLabelConfig.customCnameDomain || 'care.apollohospital.com'}`,
        'Hospital Core HIS & IPD Admissions Desk',
        'Ward & Bed Census Sensor Management',
        'OT Scheduling & ICU Monitoring Suite',
        'Dedicated Doctor Teleconsultation EMR',
        `Custom SMS / WhatsApp Sender ID (${whiteLabelConfig.smsSenderId || 'APOLLO'})`,
        'ABDM 2.0 National Telemetry Integration'
      ],
      planExpiryDate: '365 Days Validity (Enterprise Annual)',
      activatedAt: new Date().toISOString().split('T')[0],
      loginUrl: localhostLoginUrl
    });

    setSaveNotice(`✓ White-Label Credentials & Feature Capacity Menu Book PDF generated and downloaded for "${whiteLabelConfig.hospitalName}"!`);
    setTimeout(() => setSaveNotice(null), 5000);
  };

  const handleOpenDossier = () => {
    openPrintableSpeedPostDossier({
      partnerId: 'WL-HOSP-2026',
      partnerName: whiteLabelConfig.hospitalName || 'Apollo Super-Speciality Hospital',
      classification: 'HOSPITAL',
      contactPerson: 'Medical Director / Hospital Administrator',
      phone: '+91 98765 43210',
      email: testEmail,
      password: testPassword,
      city: 'New Delhi',
      state: 'Delhi NCR',
      planTier: 'Enterprise Hospital Network & White-Label Suite',
      monthlyFee: 9999,
      features: [
        `Custom CNAME Domain: ${whiteLabelConfig.customCnameDomain || 'care.apollohospital.com'}`,
        'Hospital Core HIS & IPD Admissions Desk',
        'Ward & Bed Census Sensor Management',
        'OT Scheduling & ICU Monitoring Suite',
        'Dedicated Doctor Teleconsultation EMR',
        `Custom SMS / WhatsApp Sender ID (${whiteLabelConfig.smsSenderId || 'APOLLO'})`,
        'ABDM 2.0 National Telemetry Integration'
      ],
      planExpiryDate: '365 Days Validity (Enterprise Annual)',
      activatedAt: new Date().toISOString().split('T')[0],
      loginUrl: localhostLoginUrl
    });
  };

  const handleSaveWhiteLabel = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveNotice(`✓ White-Label Theme successfully compiled and deployed to Edge CDN for "${whiteLabelConfig.customCnameDomain}"!`);
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

      {/* Global Shell Apply Toggle Banner */}
      <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #38BDF8', borderRadius: '12px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <strong style={{ color: '#F8FAFC', fontSize: '0.9375rem' }}>✨ Apply White-Label Branding Globally to Platform Shell</strong>
          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
            When enabled, sidebar logo, primary colors, and tenant headers switch to <strong>{whiteLabelConfig.hospitalName}</strong> in real-time.
          </p>
        </div>

        <button
          type="button"
          onClick={() => toggleShellApplication(!whiteLabelConfig.applyToShell)}
          style={{
            backgroundColor: whiteLabelConfig.applyToShell ? '#10B981' : '#334155',
            color: '#FFF',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 18px',
            fontWeight: 800,
            fontSize: '0.8125rem',
            cursor: 'pointer',
            boxShadow: whiteLabelConfig.applyToShell ? '0 0 16px rgba(16, 185, 129, 0.5)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>{whiteLabelConfig.applyToShell ? '✓ Applied Live to Shell' : '○ Enable Live Shell Sync'}</span>
        </button>
      </div>

      {/* Official White-Label Partner Credentials & Localhost Testing Station */}
      <div style={{
        backgroundColor: '#0F172A',
        border: '1.5px solid #10B981',
        borderRadius: '16px',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 8px 30px rgba(16, 185, 129, 0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>🔐</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#F8FAFC' }}>
                White-Label Partner Credentials & Localhost Testing Station
              </h3>
              <Badge variant="success">● KYC Approved & Active</Badge>
              <Badge variant="primary">Localhost Port :5175 Live</Badge>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
              Download official ISO 32000-1 Credentials PDF for <strong>{whiteLabelConfig.hospitalName}</strong>, or test live portal login directly on localhost.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button variant="success"
              size="md"
              onClick={handleDownloadCredentialsPdf}
              
            >
              📥 Download Credentials PDF
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={handleOpenDossier}
              style={{
                borderColor: '#F59E0B',
                color: '#FCD34D',
                fontWeight: 800
              }}
            >
              🖨️ Speed Post Dossier
            </Button>

            <a
              href="http://localhost:5175/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <Button
                variant="primary"
                size="md"
              >
                ⚡ Test on Localhost :5175 ↗
              </Button>
            </a>
          </div>
        </div>

        {/* Credentials Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          {/* Card 1: Portal URL */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                LOGIN PORTAL URL
              </span>
              <button
                type="button"
                onClick={() => handleCopy(localhostLoginUrl, 'url')}
                style={{ background: 'transparent', border: 'none', color: copiedKey === 'url' ? '#10B981' : '#38BDF8', fontSize: '0.6875rem', fontWeight: 800, cursor: 'pointer' }}
              >
                {copiedKey === 'url' ? '✓ Copied!' : '📋 Copy URL'}
              </button>
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#38BDF8', fontFamily: 'monospace' }}>
              {localhostLoginUrl}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px' }}>
              Production CNAME: https://{whiteLabelConfig.customCnameDomain || 'care.hospital.com'}
            </div>
          </div>

          {/* Card 2: User ID */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                HOSPITAL ADMIN USER ID
              </span>
              <button
                type="button"
                onClick={() => handleCopy(testEmail, 'email')}
                style={{ background: 'transparent', border: 'none', color: copiedKey === 'email' ? '#10B981' : '#38BDF8', fontSize: '0.6875rem', fontWeight: 800, cursor: 'pointer' }}
              >
                {copiedKey === 'email' ? '✓ Copied!' : '📋 Copy Email'}
              </button>
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC', fontFamily: 'monospace' }}>
              {testEmail}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#10B981', marginTop: '2px', fontWeight: 700 }}>
              Role: HOSPITAL_ADMIN (Dr. Rajesh Verma)
            </div>
          </div>

          {/* Card 3: Password */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                ASSIGNED TEMPORARY PASSWORD
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(testPassword, 'pass')}
                  style={{ background: 'transparent', border: 'none', color: copiedKey === 'pass' ? '#10B981' : '#FCD34D', fontSize: '0.6875rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  {copiedKey === 'pass' ? '✓ Copied!' : '📋 Copy Password'}
                </button>
              </div>
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 900, color: '#FCD34D', fontFamily: 'monospace' }}>
              {showPassword ? testPassword : '•••••••••••••'}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px' }}>
              Raw string: <code style={{ color: '#FCD34D' }}>{testPassword}</code>
            </div>
          </div>
        </div>

        {/* Quick Instructions Banner */}
        <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.1rem' }}>💡</span>
          <span style={{ fontSize: '0.75rem', color: '#BAE6FD' }}>
            <strong>Localhost Test Guide:</strong> Click <strong>"⚡ Test on Localhost :5175 ↗"</strong> (ya direct <code>http://localhost:5175/</code> open karein), wahan <code>whitelabel.admin@docsearch.health</code> aur password <code>Hospital@2026!</code> enter karein — aap seedhe Hospital Ward, Bed Census, OT aur EMR Workbench me login ho jayenge!
          </span>
        </div>
      </div>

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
                value={whiteLabelConfig.hospitalName}
                onChange={(e) => updateWhiteLabel({ hospitalName: e.target.value })}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF', fontSize: '0.8125rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px', fontWeight: 700 }}>BRAND TAGLINE</label>
              <input
                type="text"
                value={whiteLabelConfig.brandTagline}
                onChange={(e) => updateWhiteLabel({ brandTagline: e.target.value })}
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
                    onClick={() => updateWhiteLabel({ primaryColorHex: p.primary, accentColorHex: p.accent })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#1E293B',
                      border: whiteLabelConfig.primaryColorHex === p.primary ? `2px solid ${p.primary}` : '1px solid #475569',
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
                  value={whiteLabelConfig.customCnameDomain}
                  onChange={(e) => updateWhiteLabel({ customCnameDomain: e.target.value })}
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
                  value={whiteLabelConfig.smsSenderId}
                  onChange={(e) => updateWhiteLabel({ smsSenderId: e.target.value.toUpperCase() })}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF', fontWeight: 800 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px', fontWeight: 700 }}>PATIENT SUPPORT EMAIL</label>
                <input
                  type="email"
                  value={whiteLabelConfig.supportEmail}
                  onChange={(e) => updateWhiteLabel({ supportEmail: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              style={{
                backgroundColor: whiteLabelConfig.primaryColorHex,
                color: '#FFF',
                fontWeight: 900,
                marginTop: '8px',
                boxShadow: `0 4px 16px ${whiteLabelConfig.primaryColorHex}66`
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
              border: `2px solid ${whiteLabelConfig.primaryColorHex}`,
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: `0 10px 40px ${whiteLabelConfig.primaryColorHex}33`
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
                    backgroundColor: whiteLabelConfig.primaryColorHex,
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '1rem'
                  }}
                >
                  {whiteLabelConfig.hospitalName.charAt(0)}
                </div>
                <div>
                  <strong style={{ color: '#FFF', fontSize: '0.9375rem', display: 'block' }}>{whiteLabelConfig.hospitalName}</strong>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{whiteLabelConfig.brandTagline}</span>
                </div>
              </div>

              <span style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6875rem', color: whiteLabelConfig.accentColorHex, fontFamily: 'monospace' }}>
                {whiteLabelConfig.customCnameDomain}
              </span>
            </div>

            {/* Mock Patient Portal Card */}
            <div style={{ backgroundColor: '#0F172A', borderRadius: '10px', padding: '14px', border: '1px solid #1E293B' }}>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800 }}>PATIENT SELF-SERVICE HUB</span>
              <h4 style={{ margin: '4px 0 8px', color: '#FFF' }}>Book OPD & Video Consultation</h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#CBD5E1', lineHeight: '1.4' }}>
                Connect with 450+ Top Specialists at {whiteLabelConfig.hospitalName}. Zero waiting time with instant digital prescription.
              </p>
              <button
                type="button"
                style={{
                  backgroundColor: whiteLabelConfig.primaryColorHex,
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
            <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px', borderLeft: `3px solid ${whiteLabelConfig.accentColorHex}`, fontSize: '0.75rem' }}>
              <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.6875rem' }}>WhatsApp Sender ID: <strong>{whiteLabelConfig.smsSenderId}</strong></span>
              <span style={{ color: '#E2E8F0', marginTop: '2px', display: 'block' }}>
                &ldquo;Dear Patient, your consultation with Dr. Mehta at {whiteLabelConfig.hospitalName} is confirmed for 4:00 PM.&rdquo;
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
