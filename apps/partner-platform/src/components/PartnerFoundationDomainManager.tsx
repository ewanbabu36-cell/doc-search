import { EnterpriseSecurityAuditStudio } from './views/EnterpriseSecurityAuditStudio.js';
import React, { useState, useEffect } from 'react';
import type {
  OperationalPartnerDto,
  OperationalOrganizationDto,
  OperationalFacilityDto,
  OperationalSubscriptionDto,
  OperationalAuditTraceDto,
  PartnerFoundationOverviewDto,
  PanelContextDto,
  CreateOperationalPartnerRequest,
  UpdateOperationalPartnerRequest,
  CreateOperationalOrganizationRequest,
  CreateOperationalFacilityRequest
} from '@docsearch/api-contracts';
import { partnerFoundationService } from '../services/partner-foundation-service.js';
import { PanelContextSwitcher } from './common/PanelContextSwitcher.js';
import { PartnerOverviewView } from './views/PartnerOverviewView.js';
import { PartnerDirectoryView } from './views/PartnerDirectoryView.js';
import { OrganizationDirectoryView } from './views/OrganizationDirectoryView.js';
import { OrganizationOverviewView } from './views/OrganizationOverviewView.js';
import { FacilityDirectoryView } from './views/FacilityDirectoryView.js';
import { FacilityOverviewView } from './views/FacilityOverviewView.js';
import { SubscriptionEntitlementView } from './views/SubscriptionEntitlementView.js';
import { OperationalAuditTraceView } from './views/OperationalAuditTraceView.js';
import { Tabs, Badge, Spinner, ErrorState } from '@docsearch/ui-kit';

type ActiveTab =
  | 'overview'
  | 'partners'
  | 'organizations'
  | 'org_details'
  | 'facilities'
  | 'facility_details'
  | 'subscriptions'
  | 'audit';

export const PartnerFoundationDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [context, setContext] = useState<PanelContextDto | null>(null);
  const [overview, setOverview] = useState<PartnerFoundationOverviewDto | null>(null);
  const [partners, setPartners] = useState<OperationalPartnerDto[]>([]);
  const [organizations, setOrganizations] = useState<OperationalOrganizationDto[]>([]);
  const [facilities, setFacilities] = useState<OperationalFacilityDto[]>([]);
  const [subscriptions, setSubscriptions] = useState<OperationalSubscriptionDto[]>([]);
  const [auditTraces, setAuditTraces] = useState<OperationalAuditTraceDto[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ctx = await partnerFoundationService.getPanelContext();
      setContext(ctx);

      const [overviewRes, partnersRes, orgsRes, facsRes, subsRes, tracesRes] = await Promise.all([
        partnerFoundationService.getOverview(ctx.activeTenantId),
        partnerFoundationService.getPartners(ctx.activeTenantId),
        partnerFoundationService.getOrganizations(ctx.activeTenantId),
        partnerFoundationService.getFacilities(ctx.activeTenantId),
        partnerFoundationService.getSubscriptions(ctx.activeTenantId),
        partnerFoundationService.getAuditTraces({
          tenantId: ctx.activeTenantId,
          partnerId: ctx.activePartnerId,
          organizationId: ctx.activeOrganizationId,
          branchId: ctx.activeFacilityId,
          pageIndex: 0,
          pageSize: 50
        })
      ]);

      setOverview(overviewRes);
      setPartners(partnersRes);
      setOrganizations(orgsRes);
      setFacilities(facsRes);
      setSubscriptions(subsRes);
      setAuditTraces(tracesRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Partner & Organization Foundation');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleContextChange = async (newContext: Partial<PanelContextDto>) => {
    const updated = await partnerFoundationService.setPanelContext(newContext);
    setContext(updated);
  };

  const handleCreatePartner = async (req: CreateOperationalPartnerRequest) => {
    const p = await partnerFoundationService.createPartner(req);
    setPartners((prev) => [...prev, p]);
  };

  const handleUpdatePartner = async (req: UpdateOperationalPartnerRequest) => {
    const updated = await partnerFoundationService.updatePartner(req);
    setPartners((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleCreateOrganization = async (req: CreateOperationalOrganizationRequest) => {
    const org = await partnerFoundationService.createOrganization(req);
    setOrganizations((prev) => [...prev, org]);
  };

  const handleCreateFacility = async (req: CreateOperationalFacilityRequest) => {
    const fac = await partnerFoundationService.createFacility(req);
    setFacilities((prev) => [...prev, fac]);
  };

  const handleSelectOrganization = (orgId: string) => {
    const selected = organizations.find((o) => o.id === orgId);
    if (selected) {
      void handleContextChange({
        activeOrganizationId: orgId,
        activeOrganizationName: selected.organizationName
      });
      setActiveTab('org_details');
    }
  };

  const handleSelectFacility = (facId: string) => {
    const selected = facilities.find((f) => f.id === facId);
    if (selected) {
      void handleContextChange({
        activeFacilityId: facId,
        activeFacilityName: selected.facilityName
      });
      setActiveTab('facility_details');
    }
  };

  if (isLoading && !context) {
    return (
      <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Spinner size="lg" />
        <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Loading Partner & Organization Foundation control plane...
        </span>
      </div>
    );
  }

  if (error && !context) {
    return (
      <ErrorState title="Partner Foundation Unavailable" message={error} onRetry={loadData} />
    );
  }

  const activePartner = partners.find((p) => p.id === context?.activePartnerId) ?? null;
  const activeOrg = organizations.find((o) => o.id === context?.activeOrganizationId) ?? null;
  const activeFac = facilities.find((f) => f.id === context?.activeFacilityId) ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Partner & Organization Foundation
          </h1>
          
          <Badge variant="warning">Development Preview (Sample Data)</Badge>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Operational hierarchy: Partner Healthcare Network → Clinic / Hospital Organization → Branch Facility
        </p>
      </div>

      {/* Panel Context Switcher */}
      {context && (
        <PanelContextSwitcher
          context={context}
          partners={partners}
          organizations={organizations}
          facilities={facilities}
          onContextChange={handleContextChange}
        />
      )}

      {/* Tabs */}
      <EnterpriseSecurityAuditStudio />

      <Tabs
        tabs={[
          {
            id: 'overview',
            label: '📊 Overview'
          },
          {
            id: 'partners',
            label: '🏥 Partners',
            badge: <Badge variant="neutral">{partners.length}</Badge>
          },
          {
            id: 'organizations',
            label: '🏢 Organizations',
            badge: <Badge variant="neutral">{organizations.length}</Badge>
          },
          {
            id: 'org_details',
            label: '🏥 Org Details'
          },
          {
            id: 'facilities',
            label: '📍 Facilities',
            badge: <Badge variant="neutral">{facilities.length}</Badge>
          },
          {
            id: 'facility_details',
            label: '🏬 Facility Details'
          },
          {
            id: 'subscriptions',
            label: '📑 Entitlements',
            badge: <Badge variant="neutral">{subscriptions.length}</Badge>
          },
          {
            id: 'audit',
            label: '🔍 Operational Audit',
            badge: <Badge variant="neutral">{auditTraces.length}</Badge>
          }
        ]}
        activeTabId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as ActiveTab)}
      />

      {/* Tab Contents */}
      {activeTab === 'overview' && overview && (
        <PartnerOverviewView
          overview={overview}
          partners={partners}
          organizations={organizations}
          facilities={facilities}
        />
      )}

      {activeTab === 'partners' && context && (
        <PartnerDirectoryView
          partners={partners}
          tenantId={context.activeTenantId}
          actorId={context.userRole}
          actorRole={context.userRole}
          onCreatePartner={handleCreatePartner}
          onUpdatePartner={handleUpdatePartner}
        />
      )}

      {activeTab === 'organizations' && context && (
        <OrganizationDirectoryView
          organizations={organizations}
          activePartner={activePartner}
          tenantId={context.activeTenantId}
          actorId={context.userRole}
          actorRole={context.userRole}
          onCreateOrganization={handleCreateOrganization}
          onSelectOrganization={handleSelectOrganization}
        />
      )}

      {activeTab === 'org_details' && (
        <OrganizationOverviewView
          organization={activeOrg}
          facilities={facilities}
        />
      )}

      {activeTab === 'facilities' && context && (
        <FacilityDirectoryView
          facilities={facilities}
          activeOrganization={activeOrg}
          tenantId={context.activeTenantId}
          actorId={context.userRole}
          actorRole={context.userRole}
          onCreateFacility={handleCreateFacility}
          onSelectFacility={handleSelectFacility}
        />
      )}

      {activeTab === 'facility_details' && (
        <FacilityOverviewView facility={activeFac} />
      )}

      {activeTab === 'subscriptions' && (
        <SubscriptionEntitlementView subscriptions={subscriptions} />
      )}

      {activeTab === 'audit' && (
        <OperationalAuditTraceView auditTraces={auditTraces} />
      )}
    </div>
  );
};
