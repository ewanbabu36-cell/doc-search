import React from 'react';
import type { OperationalFacilityDto } from '@docsearch/api-contracts';
import { Card, Badge, Alert } from '@docsearch/ui-kit';

export interface FacilityOverviewViewProps {
  facility: OperationalFacilityDto | null;
}

export const FacilityOverviewView: React.FC<FacilityOverviewViewProps> = ({ facility }) => {
  if (!facility) {
    return (
      <Card padding="lg">
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--ds-color-text-muted)' }}>
          Please select an active Facility Branch from the context switcher above.
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
                {facility.facilityName}
              </h2>
              <Badge variant="primary">{facility.facilityType}</Badge>
              <Badge variant={facility.status === 'ACTIVE' ? 'success' : 'neutral'}>
                {facility.status}
              </Badge>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
              Parent Organization: <strong>{facility.organizationName ?? 'Organization'}</strong> · Code: <code>{facility.facilityCode}</code>
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)', display: 'block' }}>
              Operational Contact
            </span>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--ds-color-text-primary)' }}>
              {facility.contactPhone}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)', display: 'block' }}>
              {facility.contactEmail}
            </span>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <Card title="Physical Facility Location" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Street Address</span>
              <strong>{facility.addressStreet}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.75rem' }}>City, State & Postal</span>
              <strong>{facility.addressCity}, {facility.addressState} {facility.addressPostalCode} ({facility.addressCountry})</strong>
            </div>
          </div>
        </Card>

        <Card title="Operational Readiness" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
            <Alert type="info" title="Physical Scope Enforced">
              Doctor rosters, appointment queues, vitals capture, and consultation encounters will be strictly bounded to this branch.
            </Alert>
          </div>
        </Card>
      </div>
    </div>
  );
};
