import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, EffectIntensityProvider, DocSearch3DLogoLoader, type ThemeMode } from '@docsearch/ui-kit';
import { setupCrossBrowserThemeSync, persistCloudThemePreference } from './services/theme-sync-service.js';
const PartnerPlatformShell = React.lazy(() =>
  import('./components/PartnerPlatformShell.js').then((m) => ({ default: m.PartnerPlatformShell }))
);
import { HospitalStaffLogin, type HospitalStaffUser } from './components/auth/HospitalStaffLogin.js';
import { getUrlForModule } from './utils/urlRouter.js';
import { ensureAuthToken, isTokenExpired } from './services/api-client.js';
import { pwaCompanion } from './services/pwa-companion.js';
import '../../../packages/ui-kit/src/styles/themes.css';
import '../../../packages/ui-kit/src/styles/base.css';

// Initialize PWA Service Worker for 0ms instant loading and offline outbox
if (typeof window !== 'undefined') {
  void pwaCompanion.registerServiceWorker();
}


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<HospitalStaffUser | null>(() => {
    if (typeof window !== 'undefined') {
      // Clean state migration: Permanently wipe any legacy mock transactional data cached in localStorage
      if (localStorage.getItem('docsearch_mock_data_purged_v2') !== 'true') {
        const legacyMockKeys = [
          'docsearch_patients',
          'docsearch_patient_duplicate_candidates',
          'docsearch_patient_merge_events',
          'docsearch_patient_registration_audit_traces',
          'docsearch_consultations',
          'docsearch_consultation_vitals',
          'docsearch_consultation_diagnoses',
          'docsearch_consultation_prescriptions',
          'docsearch_consultation_orders',
          'docsearch_consultation_queues',
          'docsearch_clinical_notes',
          'docsearch_consultation_audit_traces',
          'docsearch_encounters',
          'docsearch_encounter_queues',
          'docsearch_encounter_timeline_events',
          'docsearch_encounter_audit_traces',
          'docsearch_investigation_orders',
          'docsearch_investigation_results',
          'docsearch_investigation_specimens',
          'docsearch_investigation_audit_traces',
          'docsearch_billing_charges',
          'docsearch_billing_invoices',
          'docsearch_billing_payments',
          'docsearch_billing_receipts',
          'docsearch_billing_refunds',
          'docsearch_billing_credit_notes',
          'docsearch_billing_debit_adjustments',
          'docsearch_billing_advances',
          'docsearch_billing_cashier_sessions',
          'docsearch_billing_reconciliations',
          'docsearch_billing_financial_transactions',
          'docsearch_billing_audit_traces',
          'docsearch_emergency_encounters',
          'docsearch_emergency_triage_assessments',
          'docsearch_emergency_resuscitations',
          'docsearch_emergency_observations',
          'docsearch_emergency_mlc_cases',
          'docsearch_emergency_ambulance_transfers',
          'docsearch_emergency_disaster_events',
          'docsearch_inpatient_admissions',
          'docsearch_inpatient_admission_requests',
          'docsearch_inpatient_transfers',
          'docsearch_inpatient_nursing_assessments',
          'docsearch_inpatient_vital_observations',
          'docsearch_inpatient_doctor_rounds',
          'docsearch_inpatient_discharge_plans',
          'docsearch_inpatient_discharge_summaries',
          'docsearch_inpatient_bed_blocks',
          'docsearch_insurance_policies',
          'docsearch_insurance_claims',
          'docsearch_insurance_submissions',
          'docsearch_insurance_adjudications',
          'docsearch_insurance_denials',
          'docsearch_insurance_appeals',
          'docsearch_insurance_settlements',
          'docsearch_insurance_reconciliations',
          'docsearch_insurance_documents',
          'docsearch_ot_schedules',
          'docsearch_ot_surgery_requests',
          'docsearch_ot_preop_assessments',
          'docsearch_ot_surgical_consents',
          'docsearch_ot_pacu_records',
          'docsearch_pharmacy_prescriptions',
          'docsearch_pharmacy_dispensing',
          'docsearch_pharmacy_substitutions',
          'docsearch_whatsapp_conversations',
          'docsearch_whatsapp_dispatches',
          'docsearch_whatsapp_queue_tokens',
          'docsearch_chamber_profile'
        ];
        for (const key of legacyMockKeys) {
          localStorage.removeItem(key);
        }
        localStorage.setItem('docsearch_mock_data_purged_v2', 'true');
      }

      // Zero-Trust Security: Immediately purge legacy mock presets
      const legacyKeywords = ['apex_mock', 'midahat_mock', 'fake_partner_corp'];
      const rawStored = localStorage.getItem('docsearch_partner_staff_auth');
      if (rawStored) {
        const lower = rawStored.toLowerCase();
        if (legacyKeywords.some((kw) => lower.includes(kw))) {
          localStorage.removeItem('docsearch_partner_staff_auth');
          localStorage.removeItem('docsearch_auth_token');
          return null;
        }
      }

      if (localStorage.getItem('docsearch_logged_out') === 'true') {
        return null;
      }

      // Check for token dispatched from Landing Page SSO Login
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenParam = urlParams.get('token');
        if (tokenParam) {
          localStorage.setItem('docsearch_auth_token', tokenParam);
          localStorage.removeItem('docsearch_logged_out');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {
        console.error('Error parsing token param:', e);
      }

      // Check existing local storage for authenticated staff session
      if (rawStored) {
        try {
          const parsed = JSON.parse(rawStored);
          if (parsed && (parsed.email || parsed.name || parsed.id)) {
            parsed.name = parsed.name || parsed.tenantName || (parsed.email ? parsed.email.split('@')[0] : 'Healthcare Staff');
            if (parsed.name.toLowerCase() === 'verified user' || parsed.name.toLowerCase() === 'verified') {
              parsed.name = parsed.tenantName || (parsed.email ? parsed.email.split('@')[0] : 'Healthcare Staff');
            }
            return parsed;
          }
        } catch (e) {}
      }

      return null;
    }
    return null;
  });

  // Verify JWT session on mount; if expired, auto-refresh to keep active staff unblocked
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('docsearch_partner_staff_auth');
      if (!stored) return;

      let staff: any = null;
      try {
        staff = JSON.parse(stored);
      } catch {}

      if (!staff?.email) return;

      // Active Revocation Check: Immediately terminate session if access was revoked by admin
      try {
        const rawStaff = localStorage.getItem('docsearch_partner_staff');
        if (rawStaff) {
          const staffList = JSON.parse(rawStaff);
          if (Array.isArray(staffList)) {
            const matched = staffList.find(
              (s: any) =>
                s.id === staff.id ||
                (s.workEmail && s.workEmail.toLowerCase() === staff.email.toLowerCase())
            );
            if (matched && (matched.isAccessRevoked || matched.employmentStatus === 'SUSPENDED' || matched.employmentStatus === 'TERMINATED')) {
              localStorage.removeItem('docsearch_partner_staff_auth');
              localStorage.removeItem('docsearch_auth_token');
              localStorage.setItem('docsearch_logged_out', 'true');
              setCurrentUser(null);
              return;
            }
          }
        }
      } catch {}

      const verifyOrRefresh = async () => {
        let token = localStorage.getItem('docsearch_auth_token');
        if (!token || isTokenExpired(token)) {
          token = await ensureAuthToken();
        }

        if (!token) {
          localStorage.removeItem('docsearch_partner_staff_auth');
          localStorage.removeItem('docsearch_auth_token');
          setCurrentUser(null);
          return;
        }

        try {
          const res = await fetch('/api/v1/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const json = await res.json();
          if (json.success && json.data) {
            const rawFullName = `${json.data.firstName || ''} ${json.data.lastName || ''}`.trim();
            const isPlaceholder = !rawFullName || rawFullName.toLowerCase() === 'verified user' || rawFullName.toLowerCase() === 'verified';
            const resolvedName = !isPlaceholder
              ? rawFullName
              : (staff?.name && staff.name.toLowerCase() !== 'verified user' && staff.name.toLowerCase() !== 'verified')
                ? staff.name
                : (json.data.tenantName || json.data.email);

            const verifiedUser: HospitalStaffUser = {
              id: json.data.id,
              category: 'HEALTHCARE',
              name: resolvedName,
              email: json.data.email,
              role: json.data.roles?.[0] || staff?.role || 'HOSPITAL_STAFF',
              roleTitle: staff?.roleTitle || (json.data.roles?.[0] ? json.data.roles[0].replace(/_/g, ' ') : 'Healthcare Staff'),
              department: staff?.department || 'Healthcare Operations',
              tenantName: json.data.tenantName || staff?.tenantName || 'Healthcare Facility',
              tenantId: json.data.tenantId || staff?.tenantId || '11111111-1111-4111-8111-111111111111',
              organizationType: json.data.organizationType || staff?.organizationType || 'HOSPITAL',
              allowedWorkspaces: staff?.allowedWorkspaces || ['HOSPITAL'],
              defaultModule: staff?.defaultModule || 'clinical-consultation',
              planTier: json.data.planTier || staff?.planTier || 'Standard',
              accessibleFeatures: json.data.accessibleFeatures || staff?.accessibleFeatures || ['Standard Suite'],
              restrictedFeatures: staff?.restrictedFeatures || [],
              kycStatus: json.data.kycStatus || (json.data.status === 'ACTIVE' ? 'KYC_VERIFIED' : staff?.kycStatus || 'PENDING_ADMIN_VERIFICATION')
            };
            setCurrentUser(verifiedUser);
            localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(verifiedUser));
          } else {
            const freshToken = await ensureAuthToken();
            if (!freshToken) {
              localStorage.removeItem('docsearch_partner_staff_auth');
              localStorage.removeItem('docsearch_auth_token');
              setCurrentUser(null);
            }
          }
        } catch {
          // Backend unreachable or offline, retain active session without disruption
        }
      };

      void verifyOrRefresh();
    }
  }, []);

  const handleLogin = (user: HospitalStaffUser) => {
    localStorage.removeItem('docsearch_logged_out');
    localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(user));
    setCurrentUser(user);

    // Force synchronize browser address bar to newly authenticated staff's authorized workspace and default module
    if (typeof window !== 'undefined' && user?.organizationType) {
      try {
        const canonicalUrl = getUrlForModule(
          user.organizationType,
          (user.defaultModule as any) || 'clinical-consultation'
        );
        window.history.replaceState({ path: canonicalUrl }, '', canonicalUrl);
      } catch (e) {
        window.history.replaceState({}, document.title, '/');
      }
    }
  };

  // Support instant session switching to any operational staff
  React.useEffect(() => {
    const handleSwitchStaff = (e: any) => {
      if (e?.detail) {
        handleLogin(e.detail);
      }
    };
    window.addEventListener('docsearch:switch-staff-user', handleSwitchStaff);
    return () => window.removeEventListener('docsearch:switch-staff-user', handleSwitchStaff);
  }, []);

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
      // Reset browser address bar completely so next login starts clean without lingering URL fragments
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, '/');
      }
    }
  };

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

  if (!currentUser) {
    return (
      <ThemeProvider cloudTheme={cloudTheme} onThemeChange={handleThemeChange}>
        <EffectIntensityProvider initialIntensity="command">
          <HospitalStaffLogin onLoginSuccess={handleLogin} />
        </EffectIntensityProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider cloudTheme={cloudTheme} onThemeChange={handleThemeChange}>
      <React.Suspense
        fallback={
          <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DocSearch3DLogoLoader mode="download" size="lg" />
          </div>
        }
      >
        <PartnerPlatformShell currentUser={currentUser} onLogout={handleLogout} />
      </React.Suspense>
    </ThemeProvider>
  );
};

// Error Boundary to prevent blank white screens under any circumstance
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
    } catch (e) {}
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
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '640px',
            width: '100%',
            backgroundColor: '#1e293b',
            border: '1px solid #ef4444',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px'
              }}>
                🏥
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                  DOC SEARCH — Partner Platform Shield
                </h2>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Clinical Governance & Self-Healing Console
                </span>
              </div>
            </div>

            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#fca5a5' }}>
                Module Initialization Notice
              </p>
              <code style={{ fontSize: '12px', color: '#fecaca', display: 'block', wordBreak: 'break-all' }}>
                {this.state.error?.message || 'An unexpected rendering error occurred.'}
              </code>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🔄 Reload Page
              </button>
              <button
                onClick={this.handleResetAndReload}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#334155',
                  color: '#f8fafc',
                  border: '1px solid #64748b',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🧹 Clear Storage & Launch Default Staff
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Global unhandled error fallback in case script fails prior to React mount
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const rootEl = document.getElementById('root');
    if (rootEl && rootEl.children.length === 0) {
      rootEl.innerHTML = `
        <div style="min-height: 100vh; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; font-family: sans-serif; padding: 20px;">
          <div style="max-width: 520px; background: #1e293b; border: 1px solid #3b82f6; border-radius: 12px; padding: 24px; text-align: center;">
            <h3 style="margin-top: 0; color: #60a5fa;">🏥 DOC SEARCH Partner Platform</h3>
            <p style="font-size: 14px; color: #cbd5e1;">A browser script error occurred during initialization.</p>
            <div style="text-align: left; background: #0f172a; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; color: #f87171; margin-bottom: 16px; overflow-x: auto;">
              ${event.message || 'Script error'}
            </div>
            <button onclick="localStorage.clear(); location.reload();" style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">
              🔄 Reset Cache & Reopen
            </button>
          </div>
        </div>
      `;
    }
  });
}

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

