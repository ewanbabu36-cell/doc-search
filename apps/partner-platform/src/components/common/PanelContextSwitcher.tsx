import React from 'react';
import type {
  PanelContextDto,
  OperationalPartnerDto,
  OperationalOrganizationDto,
  OperationalFacilityDto
} from '@docsearch/api-contracts';
import { Card, Badge, Select } from '@docsearch/ui-kit';

export interface PanelContextSwitcherProps {
  context: PanelContextDto;
  partners: OperationalPartnerDto[];
  organizations: OperationalOrganizationDto[];
  facilities: OperationalFacilityDto[];
  onContextChange: (newContext: Partial<PanelContextDto>) => void;
}

export const PanelContextSwitcher: React.FC<PanelContextSwitcherProps> = ({
  context,
  partners,
  organizations,
  facilities,
  onContextChange
}) => {
  const displayPartners = partners.length > 0
    ? partners
    : [{
        id: context.activePartnerId || context.activeTenantId,
        partnerCode: `PRT-${(context.activeTenantId || '').substring(0, 8).toUpperCase() || 'MAIN'}`,
        legalBusinessName: context.activeTenantName || 'Healthcare Network'
      } as any];

  const partnerOptions = displayPartners.map((p) => {
    const code = p.partnerCode || (p as any).code || `PRT-${p.id ? p.id.substring(0, 8).toUpperCase() : 'MAIN'}`;
    const name = p.legalBusinessName || (p as any).legalName || (p as any).tradeName || context.activeTenantName || 'Healthcare Facility';
    return {
      value: p.id,
      label: `${code} — ${name}`
    };
  });

  const filteredOrgs = organizations.filter((o) => !context.activePartnerId || o.partnerId === context.activePartnerId);
  const displayOrgs = filteredOrgs.length > 0 ? filteredOrgs : organizations;
  const orgOptions = displayOrgs.length > 0
    ? displayOrgs.map((o) => ({
        value: o.id,
        label: `${o.organizationCode || 'ORG'} — ${o.organizationName || 'Organization'} (${o.organizationType || 'CLINIC'})`
      }))
    : [{
        value: context.activeOrganizationId || 'org-main',
        label: `${context.activeOrganizationName || context.activeTenantName || 'Primary Healthcare Organization'} (CLINIC)`
      }];

  const filteredFacilities = facilities.filter(
    (f) =>
      (!context.activePartnerId || f.partnerId === context.activePartnerId) &&
      (!context.activeOrganizationId || f.organizationId === context.activeOrganizationId)
  );
  const displayFacilities = filteredFacilities.length > 0 ? filteredFacilities : facilities;
  const facOptions = displayFacilities.length > 0
    ? displayFacilities.map((f) => ({
        value: f.id,
        label: `${f.facilityCode || 'LOC'} — ${f.facilityName || 'Primary Location'}`
      }))
    : [{
        value: context.activeFacilityId || 'loc-main',
        label: `${context.activeFacilityName || context.activeTenantName || 'Primary Location / Branch'}`
      }];

  const handlePartnerChange = (partnerId: string) => {
    const selected = displayPartners.find((p) => p.id === partnerId);
    const orgs = displayOrgs.filter((o) => o.partnerId === partnerId);
    const firstOrg = orgs[0] || displayOrgs[0];
    const firstFac = displayFacilities.find((f) => f.partnerId === partnerId && f.organizationId === firstOrg?.id) || displayFacilities[0];

    onContextChange({
      activePartnerId: partnerId,
      activePartnerName: selected?.legalBusinessName ?? selected?.legalName ?? 'Partner',
      activeOrganizationId: firstOrg?.id,
      activeOrganizationName: firstOrg?.organizationName,
      activeFacilityId: firstFac?.id,
      activeFacilityName: firstFac?.facilityName
    });
  };

  const handleOrgChange = (orgId: string) => {
    const selected = displayOrgs.find((o) => o.id === orgId);
    const facs = displayFacilities.filter((f) => f.organizationId === orgId);
    const firstFac = facs[0] || displayFacilities[0];

    onContextChange({
      activeOrganizationId: orgId,
      activeOrganizationName: selected?.organizationName,
      activeFacilityId: firstFac?.id,
      activeFacilityName: firstFac?.facilityName
    });
  };

  const handleFacilityChange = (facId: string) => {
    const selected = displayFacilities.find((f) => f.id === facId);
    onContextChange({
      activeFacilityId: facId,
      activeFacilityName: selected?.facilityName
    });
  };

  const currentPartnerVal = partnerOptions.some((o) => o.value === context.activePartnerId)
    ? context.activePartnerId
    : partnerOptions[0]?.value;

  const currentOrgVal = orgOptions.some((o) => o.value === context.activeOrganizationId)
    ? context.activeOrganizationId
    : orgOptions[0]?.value;

  const currentFacVal = facOptions.some((o) => o.value === context.activeFacilityId)
    ? context.activeFacilityId
    : facOptions[0]?.value;

  return (
    <Card padding="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              🎯 Active Operational Scope:
            </span>
            <Badge variant="primary">{context.userRole}</Badge>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              {context.userEmail}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>Tenant:</span>
            <strong style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-primary)' }}>
              {context.activeTenantName}
            </strong>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Active Partner Network
            </label>
            <Select
              value={currentPartnerVal}
              onChange={(e) => handlePartnerChange(e.target.value)}
              options={partnerOptions}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Active Clinic / Hospital Organization
            </label>
            <Select
              value={currentOrgVal ?? ''}
              onChange={(e) => handleOrgChange(e.target.value)}
              options={orgOptions}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Active Facility Branch
            </label>
            <Select
              value={currentFacVal ?? ''}
              onChange={(e) => handleFacilityChange(e.target.value)}
              options={facOptions}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
