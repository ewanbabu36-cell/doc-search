import React, { useState } from 'react';
import { UniversalAccountSettingsModal } from './common/UniversalAccountSettingsModal.js';
import { GlobalCurrencyLocaleProvider } from './common/GlobalCurrencyLocaleContext.js';
import { AccessibilityLocaleToolbar } from './common/AccessibilityLocaleToolbar.js';
import {
  AppShell,
  Header,
  Sidebar,
  ContentArea,
  Badge,
  Button,
  Card,
  useTheme,
  themes
} from '@docsearch/ui-kit';
import { buildPhase1NavSections, PHASE_1_DOMAINS } from '../navigation/phase1-nav.js';
import { ExecutiveCommandCenter } from './executive/ExecutiveCommandCenter.js';
import { PartnerLifecycleManager } from './crm/PartnerLifecycleManager.js';
import { ProductDomainManager } from './product/ProductDomainManager.js';
import { FinanceDomainManager } from './billing/FinanceDomainManager.js';
import { SalesMarketingDomainManager } from './sales/SalesMarketingDomainManager.js';
import { CustomerSuccessDomainManager } from './support/CustomerSuccessDomainManager.js';
import { CommunicationDomainManager } from './communication/CommunicationDomainManager.js';
import { AnalyticsDomainManager } from './analytics/AnalyticsDomainManager.js';
import { AIDomainManager } from './ai/AIDomainManager.js';
import { SecurityDomainManager } from './security/SecurityDomainManager.js';
import { ComplianceDomainManager } from './compliance/ComplianceDomainManager.js';
import { IntegrationDomainManager } from './integration/IntegrationDomainManager.js';
import { PlatformEngineeringDomainManager } from './platform-engineering/PlatformEngineeringDomainManager.js';
import { InfrastructureDomainManager } from './infrastructure/InfrastructureDomainManager.js';
import { CompanyAdminDomainManager } from './company-admin/CompanyAdminDomainManager.js';
import { CompanyGrowthEngineDomainManager } from './growth/CompanyGrowthEngineDomainManager.js';

export interface CompanyShellProps {
  currentUser?: { name: string; email: string; role: string; roleTitle: string } | undefined;
  onLogout?: () => void;
}

const getThemeLabel = (t: string) => {
  switch (t) {
    case themes.ADVANCE_PRO: return '✨ Theme: Advance Pro';
    case themes.NORDIC_PURE: return '🏥 Theme: Nordic Pure';
    case themes.OCEANIC_NAVY: return '🌊 Theme: Oceanic Navy';
    case themes.AYUR_WELLNESS: return '🌿 Theme: Ayur Wellness';
    case themes.CYBER_SURGEON: return '💜 Theme: Cyber Surgeon';
    case themes.ROSE_CARE: return '🌸 Theme: Rose Care';
    case themes.BLACK_WHITE: return '🏁 Theme: B&W';
    default: return '🎨 Switch Theme';
  }
};

export const CompanyShell: React.FC<CompanyShellProps> = ({ currentUser, onLogout }) => {
  const [activeDomainId, setActiveDomainId] = useState<string>('executive-command-center');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const { theme, toggleTheme } = useTheme();

  const navSections = buildPhase1NavSections(activeDomainId, (domainId) => {
    setActiveDomainId(domainId);
  });

  const activeDomain = PHASE_1_DOMAINS.find((d) => d.id === activeDomainId);

  return (
    <GlobalCurrencyLocaleProvider>
      <AppShell
        sidebar={
          <Sidebar
            brand={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--ds-color-primary)',
                    color: 'var(--ds-color-primary-foreground)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '0.875rem'
                  }}
                >
                  DS
                </div>
                {!isSidebarCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.9375rem', color: 'var(--ds-color-text-primary)' }}>
                      Company Platform
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                      Enterprise Governance
                    </span>
                  </div>
                )}
              </div>
            }
            sections={navSections}
            isCollapsed={isSidebarCollapsed}
          />
        }
        header={
          <Header
            title="Company Platform"
            onMenuToggle={() => setIsSidebarCollapsed((prev) => !prev)}
            organizationSlot={
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>Tenant:</span>
                <Badge variant="neutral">Doc Search HQ (Platform Scope)</Badge>
              </div>
            }
            themeSlot={
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                title="Cycle theme (Advance Pro / Light / B&W)"
              >
                {getThemeLabel(theme)}
              </Button>
            }
            userSlot={
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '0.875rem',
                    boxShadow: '0 0 10px rgba(6, 182, 212, 0.35)'
                  }}
                >
                  👑
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
                    {currentUser?.name || 'Dr. Alok Sharma (Founder)'}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: '#06B6D4', fontWeight: 600 }}>
                    {currentUser?.role || 'SUPER_ADMIN'} • {currentUser?.roleTitle || 'Founder & CEO'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(true)}
                  style={{
                    backgroundColor: 'rgba(6, 182, 212, 0.15)',
                    border: '1px solid #06B6D4',
                    color: '#38BDF8',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Account Settings (Bank, Address, Password)"
                >
                  <span>⚙️</span> Settings
                </button>
                {onLogout && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onLogout}
                    style={{ fontSize: '0.75rem', marginLeft: '6px' }}
                    title="Sign out of Founder HQ"
                  >
                    Logout
                  </Button>
                )}
              </div>
            }
          />
        }
      >
        <AccessibilityLocaleToolbar />
        <ContentArea maxWidth="xl" padding="lg">
          {activeDomainId === 'growth-engine' ? (
            <CompanyGrowthEngineDomainManager />
          ) : activeDomainId === 'executive-command-center' ? (
            <ExecutiveCommandCenter />
          ) : activeDomainId === 'crm-partner-lifecycle' ? (
            <PartnerLifecycleManager />
          ) : activeDomainId === 'product-plans-entitlements' ? (
            <ProductDomainManager />
          ) : activeDomainId === 'subscription-billing-finance' ? (
            <FinanceDomainManager />
          ) : activeDomainId === 'sales-marketing' ? (
            <SalesMarketingDomainManager />
          ) : activeDomainId === 'customer-success-support' ? (
            <CustomerSuccessDomainManager />
          ) : activeDomainId === 'communication-content' ? (
            <CommunicationDomainManager />
          ) : activeDomainId === 'analytics-bi-intelligence' ? (
            <AnalyticsDomainManager />
          ) : activeDomainId === 'ai-platform-governance' ? (
            <AIDomainManager />
          ) : activeDomainId === 'security-rbac-policy-audit' ? (
            <SecurityDomainManager />
          ) : activeDomainId === 'compliance-data-governance' ? (
            <ComplianceDomainManager />
          ) : activeDomainId === 'api-integration-interoperability' ? (
            <IntegrationDomainManager />
          ) : activeDomainId === 'platform-engineering' ? (
            <PlatformEngineeringDomainManager />
          ) : activeDomainId === 'infrastructure-monitoring-dr' ? (
            <InfrastructureDomainManager />
          ) : activeDomainId === 'company-admin-governance' ? (
            <CompanyAdminDomainManager />
          ) : (
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{activeDomain?.icon}</span>
                  <span>{activeDomain?.title}</span>
                  <Badge variant="neutral">Planned</Badge>
                </div>
              }
              subtitle={activeDomain?.description}
              padding="lg"
            >
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'var(--ds-color-text-muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '2rem' }}>{activeDomain?.icon}</div>
                <h3 style={{ margin: 0, color: 'var(--ds-color-text-primary)' }}>
                  {activeDomain?.title} Module
                </h3>
                <p style={{ margin: 0, maxWidth: '500px', fontSize: '0.875rem' }}>
                  This operational module is currently being provisioned.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveDomainId('executive-command-center')}
                >
                  Return to Executive & Command Center
                </Button>
              </div>
            </Card>
          )}
        </ContentArea>
        <UniversalAccountSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          currentUser={currentUser}
        />
      </AppShell>
    </GlobalCurrencyLocaleProvider>
  );
};
