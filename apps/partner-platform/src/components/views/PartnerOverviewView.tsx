import React from 'react';
import type {
  PartnerFoundationOverviewDto,
  OperationalPartnerDto,
  OperationalOrganizationDto,
  OperationalFacilityDto
} from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  Alert,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface PartnerOverviewViewProps {
  overview: PartnerFoundationOverviewDto;
  partners: OperationalPartnerDto[];
  organizations: OperationalOrganizationDto[];
  facilities: OperationalFacilityDto[];
}

export const PartnerOverviewView: React.FC<PartnerOverviewViewProps> = ({
  overview,
  partners,
  organizations,
  facilities
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner Disclaimer */}
      <Alert type="info" title="Operational Healthcare Network — Live Telemetry">
        Real-time healthcare partner networks, clinic entities, hospital facilities, and module entitlement states synchronized with PostgreSQL database.
      </Alert>

      {/* KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Healthcare Partners
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              {overview.totalPartnersCount} Partners
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              {overview.activePartnersCount} Active Networks
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Organizations
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-primary)' }}>
              {overview.totalOrganizationsCount} Total
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              {overview.clinicCount} Clinics · {overview.hospitalCount} Hospitals
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Branch Facilities
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-success)' }}>
              {overview.totalFacilitiesCount} Facilities
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              {overview.activeFacilitiesCount} Open Locations
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Operational Entitlements
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              {overview.activeSubscriptionsCount} Subscriptions
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              100% Entitlement Compliance
            </span>
          </div>
        </Card>
      </div>

      {/* Operational Hierarchy Summary */}
      <Card
        title="Partner & Healthcare Entity Hierarchy"
        subtitle="Top-level partner networks and their associated clinic/hospital organizations and branch locations"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner Code</TableHead>
                <TableHead>Partner Business Legal Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact Email</TableHead>
                <TableHead>Organizations</TableHead>
                <TableHead>Total Facilities</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((p) => {
                const partnerOrgs = organizations.filter((o) => o.partnerId === p.id);
                const partnerFacs = facilities.filter((f) => f.partnerId === p.id);
                return (
                  <TableRow key={p.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {p.partnerCode}
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{p.legalBusinessName}</strong>
                      {p.contractReference && (
                        <span style={{ display: 'block', fontSize: '0.6875rem', fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-color-text-muted)' }}>
                          {p.contractReference}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{p.partnerType}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {p.contactEmail}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>
                      {partnerOrgs.length} orgs
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>
                      {partnerFacs.length} branches
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'ACTIVE' ? 'success' : p.status === 'ONBOARDING' ? 'primary' : 'warning'}>
                        {p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
