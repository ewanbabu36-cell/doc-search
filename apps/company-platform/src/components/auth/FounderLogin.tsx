import React, { useState } from 'react';
import { HealthcareNetworkCore3D, ParticleNetwork, DocSearchLogo, DocSearch3DLogoLoader } from '@docsearch/ui-kit';

export interface FounderAuthUser {
  name: string;
  email: string;
  role: string;
  roleTitle: string;
  clearanceLevel: string;
}

interface FounderLoginProps {
  onLoginSuccess: (user: FounderAuthUser) => void;
}

const getRoleTitle = (role: string): string => {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Founder & SuperAdmin';
    case 'COMPANY_ADMIN':
      return 'Enterprise SaaS Administrator';
    case 'COMPLIANCE_OFFICER':
      return 'Chief Compliance & Security Officer';
    case 'FINANCE_CONTROLLER':
      return 'VP of SaaS Finance & Accounts';
    case 'HOSPITAL_ADMIN':
      return 'Hospital Executive Administrator';
    case 'DOCTOR':
      return 'Chief Medical Officer';
    default:
      return role ? role.replace(/_/g, ' ') : 'Executive Staff';
  }
};

const getClearanceLevel = (role: string): string => {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Master Level 5 (Unrestricted Global Scope)';
    case 'COMPANY_ADMIN':
      return 'Level 4 (Enterprise SaaS Ops)';
    case 'COMPLIANCE_OFFICER':
      return 'Level 4 (HIPAA, DPDP & Audit Vaults)';
    case 'FINANCE_CONTROLLER':
      return 'Level 4 (Settlements & GST Ledger)';
    default:
      return 'Level 3 (Operational Scope)';
  }
};

export const FounderLogin: React.FC<FounderLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setAuthError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    const normEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normEmail,
          password: password.trim()
        })
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.success) {
        setIsLoading(false);
        setAuthError(json.error?.message || json.message || 'Invalid credentials. Access denied.');
        return;
      }

      const userData = json.data?.user;
      if (!userData) {
        setIsLoading(false);
        setAuthError('User record not found in session response.');
        return;
      }

      if (json.data?.accessToken) {
        localStorage.setItem('docsearch_company_token', json.data.accessToken);
        localStorage.setItem('docsearch_company_session', JSON.stringify(userData));
      }

      const primaryRole = (userData.roles && userData.roles[0]) || 'SUPER_ADMIN';
      const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(' ').trim() || userData.email;

      setIsLoading(false);
      onLoginSuccess({
        name: fullName,
        email: userData.email,
        role: primaryRole,
        roleTitle: getRoleTitle(primaryRole),
        clearanceLevel: getClearanceLevel(primaryRole)
      });
    } catch (err: any) {
      setIsLoading(false);
      setAuthError('Central authentication gateway unreachable. Please ensure services are online.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#070B14',
        color: '#F8FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Background Radial Glow */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '900px',
          height: '500px',
          background: 'radial-gradient(circle at 50% 10%, rgba(6, 182, 212, 0.18) 0%, rgba(59, 130, 246, 0.1) 40%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Subtle Background Particle Network */}
      <ParticleNetwork particleCount={32} speed={0.2} />

      {/* Ambient 3D Healthcare Neural Core */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '760px',
          maxWidth: '100vw',
          height: '520px',
          opacity: 0.38,
          pointerEvents: 'none',
          zIndex: 1
        }}
      >
        <HealthcareNetworkCore3D mode="ambient" height={520} interactive={false} />
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(6, 182, 212, 0.15)',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Brand Header - Canonical Futuristic DocSearch Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '32px' }}>
          <DocSearchLogo
            variant="hero"
            size="lg"
            badgeText="ENTERPRISE HQ"
            redirectUrl="/"
            clickable={true}
          />
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#E2E8F0', margin: '14px 0 6px 0' }}>
            Executive & Founder Authentication
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.8125rem', margin: 0 }}>
            Central SuperAdmin Governance & Healthcare Multi-Tenant Engine
          </p>
        </div>

        {/* Dynamic Login Form */}
        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {authError && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                color: '#FCA5A5',
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>⚠️</span>
              <span>{authError}</span>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
              Executive Work Email
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '0.875rem' }}>
                ✉️
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. executive@docsearch.health"
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 38px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#F8FAFC',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease'
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1' }}>
                Security Key / Password
              </label>
              <span style={{ fontSize: '0.75rem', color: '#38BDF8' }}>Passkey Protected</span>
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '0.875rem' }}>
                🔒
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your master password"
                required
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 38px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#F8FAFC',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  padding: '4px'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '0.75rem',
              color: '#38BDF8',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>🛡️</span>
            <span>Zero-Trust PostgreSQL Row-Level Security (RLS) & SHA-256 Audit Active</span>
          </div>

          {isLoading ? (
            <div style={{ padding: '8px 0', width: '100%' }}>
              <DocSearch3DLogoLoader mode="login" size="sm" />
            </div>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '6px',
                background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
                color: '#FFFFFF',
                padding: '13px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.9375rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              🚀 Authenticate & Enter SaaS HQ
            </button>
          )}
        </form>

        {/* Portal Switcher Footnote */}
        <div
          style={{
            marginTop: '28px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: '#94A3B8'
          }}
        >
          <span>Looking for Hospital Platform?</span>
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#38BDF8', textDecoration: 'none', fontWeight: 600 }}
          >
            🏥 Open Hospital Portal →
          </a>
        </div>
      </div>
    </div>
  );
};
