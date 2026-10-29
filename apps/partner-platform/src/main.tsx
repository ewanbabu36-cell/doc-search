import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, DocSearch3DLogoLoader, type ThemeMode } from '@docsearch/ui-kit';
import { setupCrossBrowserThemeSync, persistCloudThemePreference } from './services/theme-sync-service.js';
import { PartnerPlatformShell } from './components/PartnerPlatformShell.js';
const HospitalQueueTvDisplayView = React.lazy(() =>
  import('./components/views/HospitalQueueTvDisplayView.js').then((m) => ({ default: m.HospitalQueueTvDisplayView }))
);
import { type HospitalStaffUser } from './components/auth/HospitalStaffLogin.js';
import { HospitalPortalLandingPage } from './components/landing/HospitalPortalLandingPage.js';
import { ensureAuthToken, isTokenExpired } from './services/api-client.js';
import { pwaCompanion } from './services/pwa-companion.js';
import '../../../packages/ui-kit/src/styles/themes.css';
import '../../../packages/ui-kit/src/styles/base.css';

// Initialize PWA Service Worker for offline resilience and quick caching
if (typeof window !== 'undefined') {
  void pwaCompanion.registerServiceWorker();
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<HospitalStaffUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(true);
  const [cloudTheme, setCloudTheme] = useState<ThemeMode | undefined>(undefined);

  useEffect(() => {
    const cleanup = setupCrossBrowserThemeSync((newTheme) => {
      setCloudTheme(newTheme);
    });
    return cleanup;
  }, [currentUser]);

  const handleThemeChange = (newTheme: ThemeMode) => {
    void persistCloudThemePreference(newTheme);
  };

  // Secure Backend Authentication Handshake on Mount
  useEffect(() => {
    const verifyBackendSession = async () => {
      if (typeof window === 'undefined') {
        setIsBootstrapping(false);
        return;
      }

      // Check if staff explicitly logged out
      if (localStorage.getItem('docsearch_logged_out') === 'true') {
        localStorage.removeItem('docsearch_partner_staff_auth');
        localStorage.removeItem('docsearch_auth_token');
        setCurrentUser(null);
        setIsBootstrapping(false);
        return;
      }

      // Check for token dispatched via SSO URL query parameter
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenParam = urlParams.get('token');
        if (tokenParam) {
          localStorage.setItem('docsearch_auth_token', tokenParam);
          localStorage.removeItem('docsearch_logged_out');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {
        console.error('URL token error:', e);
      }

      let token = localStorage.getItem('docsearch_auth_token') || localStorage.getItem('auth_token');
      if (!token || isTokenExpired(token)) {
        token = await ensureAuthToken();
      }

      if (!token) {
        // No valid token: wipe unverified local state and show Public Landing Page
        localStorage.removeItem('docsearch_partner_staff_auth');
        localStorage.removeItem('docsearch_auth_token');
        setCurrentUser(null);
        setIsBootstrapping(false);
        return;
      }

      // Query Fastify API Gateway for authenticated user profile & roles
      try {
        const res = await fetch('/api/v1/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const json = await res.json().catch(() => null);

        if (res.ok && json?.success && json?.data) {
          const rawFullName = `${json.data.firstName || ''} ${json.data.lastName || ''}`.trim();
          const resolvedName = rawFullName || json.data.email?.split('@')[0] || 'Healthcare Staff';
          const primaryRole = (json.data.roles && json.data.roles[0]) || 'DOCTOR';

          const verifiedUser: HospitalStaffUser = {
            id: json.data.id,
            category: 'HEALTHCARE',
            name: resolvedName,
            email: json.data.email,
            role: primaryRole,
            roleTitle: primaryRole.replace(/_/g, ' '),
            department: json.data.department || 'Healthcare Operations',
            tenantName: json.data.tenantName || 'Apollo Multispecialty Hospital',
            tenantId: json.data.tenantId || '11111111-1111-4111-8111-111111111111',
            organizationType: json.data.organizationType || 'HOSPITAL',
            allowedWorkspaces: ['HOSPITAL'],
            defaultModule: 'clinical-consultation',
            planTier: json.data.planTier || 'Standard',
            accessibleFeatures: json.data.accessibleFeatures || ['Standard Suite'],
            restrictedFeatures: [],
            kycStatus: 'KYC_VERIFIED'
          };

          setCurrentUser(verifiedUser);
          localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(verifiedUser));
        } else {
          // Token is rejected or invalid
          localStorage.removeItem('docsearch_partner_staff_auth');
          localStorage.removeItem('docsearch_auth_token');
          setCurrentUser(null);
        }
      } catch (err) {
        // Backend not reachable or network failure
        console.warn('Backend session handshake warning:', err);
        localStorage.removeItem('docsearch_partner_staff_auth');
        localStorage.removeItem('docsearch_auth_token');
        setCurrentUser(null);
      } finally {
        setIsBootstrapping(false);
      }
    };

    void verifyBackendSession();
  }, []);

  const handleLogin = (user: HospitalStaffUser) => {
    localStorage.removeItem('docsearch_logged_out');
    localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(user));
    React.startTransition(() => {
      setCurrentUser(user);
    });

    // Dynamic Role-Based Initial Module Route Dispatcher
    const roleUpper = (user.role || '').toUpperCase();
    const deptUpper = (user.department || '').toUpperCase();
    let targetPath = '/partner/clinical/consultations'; // Default Doctor OPD Desk

    if (roleUpper.includes('NURSE') || deptUpper.includes('INPATIENT') || deptUpper.includes('WARD')) {
      targetPath = '/partner/inpatient';
    } else if (roleUpper.includes('CASHIER') || roleUpper.includes('FRONT_DESK') || deptUpper.includes('BILLING')) {
      targetPath = '/partner/billing';
    } else if (roleUpper.includes('PHARMAC') || deptUpper.includes('PHARMACY')) {
      targetPath = '/partner/pharmacy';
    } else if (roleUpper.includes('LAB') || roleUpper.includes('PATHOLOG') || deptUpper.includes('PATHOLOGY')) {
      targetPath = '/partner/lab';
    } else if (roleUpper.includes('ADMIN') || roleUpper.includes('EXECUTIVE') || roleUpper.includes('DIRECTOR')) {
      targetPath = '/partner/executive';
    }

    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({ path: targetPath }, '', targetPath);
      } catch {
        window.history.replaceState({}, document.title, targetPath);
      }
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('docsearch_auth_token');
      if (token) {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      localStorage.setItem('docsearch_logged_out', 'true');
      localStorage.removeItem('docsearch_partner_staff_auth');
      localStorage.removeItem('docsearch_auth_token');
      localStorage.removeItem('docsearch_user_session');
      setCurrentUser(null);
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, '/');
      }
    }
  };

  // Support instant session switching to any operational staff
  useEffect(() => {
    const handleSwitchStaff = (e: any) => {
      if (e?.detail) {
        React.startTransition(() => {
          handleLogin(e.detail);
        });
      }
    };
    window.addEventListener('docsearch:switch-staff-user', handleSwitchStaff);
    return () => window.removeEventListener('docsearch:switch-staff-user', handleSwitchStaff);
  }, []);

  // Waiting Room TV Display View Route
  const isTvDisplay = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/display/queue') ||
    window.location.pathname.startsWith('/tv') ||
    window.location.search.includes('view=tv-display')
  );

  if (isTvDisplay) {
    return (
      <ThemeProvider cloudTheme={cloudTheme} onThemeChange={handleThemeChange}>
        <React.Suspense
          fallback={
            <div style={{ minHeight: '100vh', background: '#05070E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DocSearch3DLogoLoader mode="download" size="lg" />
            </div>
          }
        >
          <HospitalQueueTvDisplayView onExit={() => { window.location.href = '/'; }} />
        </React.Suspense>
      </ThemeProvider>
    );
  }

  // Initializing secure session
  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-[#070913] flex flex-col items-center justify-center text-white space-y-4 select-none">
        <div className="relative">
          <div className="w-16 h-16 rounded-3xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-3xl shadow-xl shadow-blue-500/20 animate-pulse">
            🏥
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <div className="text-center">
          <div className="text-sm font-bold tracking-tight text-white">DocSearch Apollo Hospital</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 justify-center font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Connecting to PostgreSQL 18.4 Engine...</span>
          </div>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated Visitor -> Public Hospital Landing Page (Emergency, OPD schedule, Bed Census, Login / Register)
  if (!currentUser) {
    return (
      <ThemeProvider cloudTheme={cloudTheme} onThemeChange={handleThemeChange}>
        <HospitalPortalLandingPage onLoginSuccess={handleLogin} />
      </ThemeProvider>
    );
  }

  // 2. Authenticated Staff -> Pure Enterprise Hospital Management Platform Workspace (No Phone/OS Simulator)
  return (
    <ThemeProvider cloudTheme={cloudTheme} onThemeChange={handleThemeChange}>
      <PartnerPlatformShell currentUser={currentUser} onLogout={handleLogout} />
    </ThemeProvider>
  );
};

// Error Boundary to prevent blank screens
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('CRITICAL: Partner Platform Error Caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleResetAndReload = () => {
    try {
      localStorage.removeItem('docsearch_partner_staff_auth');
      localStorage.removeItem('docsearch_auth_token');
      localStorage.removeItem('docsearch_user_session');
    } catch {}
    window.location.href = '/';
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', color: '#f87171' }}>
              Hospital Platform Recovery Shield
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px', lineHeight: 1.6 }}>
              A temporary interface exception was intercepted to prevent system downtime. Click below to return to the Hospital Landing Page.
            </p>
            <button
              onClick={this.handleResetAndReload}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Reset Session & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
