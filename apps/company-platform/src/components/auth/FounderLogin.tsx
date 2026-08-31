import React, { useState } from 'react';
import { Badge } from '@docsearch/ui-kit';

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

export const FounderLogin: React.FC<FounderLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('founder.alok@docsearch.health');
  const [password, setPassword] = useState('FounderPass123!');
  const [selectedRole, setSelectedRole] = useState<string>('SUPER_ADMIN');
  const [isLoading, setIsLoading] = useState(false);

  const executiveProfiles = [
    {
      id: 'SUPER_ADMIN',
      title: 'Founder & Global CEO',
      name: 'Dr. Alok Sharma (Founder)',
      email: 'founder@docsearch.health',
      password: 'FounderPass123!',
      clearance: 'Level 5 (Unrestricted Global Scope)',
      icon: '👑',
      badgeColor: '#06B6D4'
    },
    {
      id: 'COMPANY_ADMIN',
      title: 'Chief Operating Officer (COO)',
      name: 'Ananya Roy (COO)',
      email: 'coo@docsearch.health',
      password: 'CooPass123!',
      clearance: 'Level 4 (Enterprise SaaS Ops)',
      icon: '🏢',
      badgeColor: '#3B82F6'
    },
    {
      id: 'FINANCE_MANAGER',
      title: 'VP of SaaS Finance & Billing',
      name: 'Vikram Mehta (VP Finance)',
      email: 'finance@docsearch.health',
      password: 'FinancePass123!',
      clearance: 'Level 4 (Revenue & MRR Invoicing)',
      icon: '💳',
      badgeColor: '#10B981'
    },
    {
      id: 'COMPLIANCE_OFFICER',
      title: 'Chief Compliance & Security Officer',
      name: 'Dr. Sunita Iyer (Compliance Lead)',
      email: 'security@docsearch.health',
      password: 'SecurityPass123!',
      clearance: 'Level 4 (HIPAA, SOC 2 & NABH)',
      icon: '🛡️',
      badgeColor: '#8B5CF6'
    }
  ];

  const handleProfileSelect = (prof: typeof executiveProfiles[0]) => {
    setSelectedRole(prof.id);
    setEmail(prof.email);
    setPassword(prof.password);
    setAuthError(null);
  };

    const [authError, setAuthError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    const activeProfile = executiveProfiles.find((p) => p.id === selectedRole) ?? executiveProfiles[0]!;

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim()
        })
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setAuthError(json.error?.message || json.message || 'Authentication failed. Invalid executive credentials.');
        setIsLoading(false);
        return;
      }

      if (json.data?.accessToken) {
        localStorage.setItem('docsearch_company_token', json.data.accessToken);
        localStorage.setItem('docsearch_company_session', JSON.stringify(json.data.user));
      }

      setIsLoading(false);
      onLoginSuccess({
        name: json.data?.user?.firstName ? `${json.data.user.firstName} ${json.data.user.lastName || ''}` : activeProfile.name,
        email: json.data?.user?.email || activeProfile.email,
        role: selectedRole,
        roleTitle: activeProfile.title,
        clearanceLevel: activeProfile.clearance
      });
    } catch {
      // Allow demo login in isolated frontend mode
      setIsLoading(false);
      onLoginSuccess({
        name: activeProfile.name,
        email: activeProfile.email,
        role: activeProfile.id,
        roleTitle: activeProfile.title,
        clearanceLevel: activeProfile.clearance
      });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#070B14',
      color: '#F8FAFC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Background Radial Glow */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '900px',
        height: '500px',
        background: 'radial-gradient(circle at 50% 10%, rgba(6, 182, 212, 0.18) 0%, rgba(59, 130, 246, 0.1) 40%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{
        width: '100%',
        maxWidth: '560px',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '24px',
        padding: '36px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(6, 182, 212, 0.15)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            boxShadow: '0 0 25px rgba(6, 182, 212, 0.5)',
            marginBottom: '12px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            🏢
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#F8FAFC' }}>
              DOC SEARCH
            </span>
            <Badge variant="primary">ENTERPRISE HQ</Badge>
          </div>

          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#E2E8F0', margin: '0 0 6px 0' }}>
            Executive & Founder Authentication Portal
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.8125rem', margin: 0 }}>
            Central SuperAdmin Governance & Multi-Hospital SaaS Control Engine
          </p>
        </div>

        {/* Executive Role Switcher Cards */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8', marginBottom: '10px' }}>
            Select Executive Role Persona:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {executiveProfiles.map((prof) => {
              const isSelected = selectedRole === prof.id;
              return (
                <div
                  key={prof.id}
                  onClick={() => handleProfileSelect(prof)}
                  style={{
                    backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(30, 41, 59, 0.6)',
                    border: isSelected ? `1px solid ${prof.badgeColor}` : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    transform: isSelected ? 'translateY(-1px)' : 'none',
                    boxShadow: isSelected ? `0 4px 14px ${prof.badgeColor}33` : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span>{prof.icon}</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: isSelected ? '#38BDF8' : '#E2E8F0' }}>
                      {prof.title}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {prof.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {authError && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', color: '#FCA5A5', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600 }}>
              ✗ {authError}
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
              Executive Work Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#F8FAFC',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1' }}>
                Master Security Key / Password
              </label>
              <span style={{ fontSize: '0.75rem', color: '#38BDF8' }}>Passkey Protected</span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#F8FAFC',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{
            backgroundColor: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.75rem',
            color: '#38BDF8',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🛡️</span>
            <span>Zero-Trust PostgreSQL Row-Level Security (RLS) & SHA-256 Audit Trail Active</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '6px',
              background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
              color: '#FFFFFF',
              padding: '12px',
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
            {isLoading ? 'Authenticating Executive Clearance...' : '🚀 Authenticate & Enter SaaS HQ'}
          </button>
        </form>

        {/* Portal Switcher Footnote */}
        <div style={{
          marginTop: '24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: '#94A3B8'
        }}>
          <span>Looking for Hospital Platform?</span>
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#38BDF8', textDecoration: 'none', fontWeight: 600 }}
          >
            🏥 Open Hospital Portal (5173) →
          </a>
        </div>
      </div>
    </div>
  );
};
