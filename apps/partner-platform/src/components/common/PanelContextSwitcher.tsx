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
  const filteredOrgs = organizations.filter((o) => o.partnerId === context.activePartnerId);
  const filteredFacilities = facilities.filter(
    (f) =>
      f.partnerId === context.activePartnerId &&
      (!context.activeOrganizationId || f.organizationId === context.activeOrganizationId)
  );

  const handlePartnerChange = (partnerId: string) => {
    const selected = partners.find((p) => p.id === partnerId);
    const orgs = organizations.filter((o) => o.partnerId === partnerId);
    const firstOrg = orgs[0];
    const firstFac = facilities.find((f) => f.partnerId === partnerId && f.organizationId === firstOrg?.id);

    onContextChange({
      activePartnerId: partnerId,
      activePartnerName: selected?.legalBusinessName ?? 'Partner',
      activeOrganizationId: firstOrg?.id,
      activeOrganizationName: firstOrg?.organizationName,
      activeFacilityId: firstFac?.id,
      activeFacilityName: firstFac?.facilityName
    });
  };

  const handleOrgChange = (orgId: string) => {
    const selected = organizations.find((o) => o.id === orgId);
    const facs = facilities.filter((f) => f.organizationId === orgId);
    const firstFac = facs[0];

    onContextChange({
      activeOrganizationId: orgId,
      activeOrganizationName: selected?.organizationName,
      activeFacilityId: firstFac?.id,
      activeFacilityName: firstFac?.facilityName
    });
  };

  const handleFacilityChange = (facId: string) => {
    const selected = facilities.find((f) => f.id === facId);
    onContextChange({
      activeFacilityId: facId,
      activeFacilityName: selected?.facilityName
    });
  };

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
              value={context.activePartnerId}
              onChange={(e) => handlePartnerChange(e.target.value)}
              options={partners.map((p) => ({
                value: p.id,
                label: `${p.partnerCode} — ${p.legalBusinessName}`
              }))}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Active Clinic / Hospital Organization
            </label>
            <Select
              value={context.activeOrganizationId ?? ''}
              onChange={(e) => handleOrgChange(e.target.value)}
              options={filteredOrgs.map((o) => ({
                value: o.id,
                label: `${o.organizationCode} — ${o.organizationName} (${o.organizationType})`
              }))}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Active Facility Branch
            </label>
            <Select
              value={context.activeFacilityId ?? ''}
              onChange={(e) => handleFacilityChange(e.target.value)}
              options={filteredFacilities.map((f) => ({
                value: f.id,
                label: `${f.facilityCode} — ${f.facilityName}`
              }))}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
