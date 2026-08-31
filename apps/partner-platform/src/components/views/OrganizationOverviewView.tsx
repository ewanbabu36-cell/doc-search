import React from 'react';
import type {
  OperationalOrganizationDto,
  OperationalFacilityDto
} from '@docsearch/api-contracts';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface OrganizationOverviewViewProps {
  organization: OperationalOrganizationDto | null;
  facilities: OperationalFacilityDto[];
}

export const OrganizationOverviewView: React.FC<OrganizationOverviewViewProps> = ({
  organization,
  facilities
}) => {
  if (!organization) {
    return (
      <Card padding="lg">
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--ds-color-text-muted)' }}>
          Please select an active Clinic or Hospital organization from the context switcher above.
        </div>
      </Card>
    );
  }

  const orgFacilities = facilities.filter((f) => f.organizationId === organization.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
                {organization.organizationName}
              </h2>
              <Badge variant={organization.organizationType === 'HOSPITAL' ? 'primary' : 'neutral'}>
                {organization.organizationType}
              </Badge>
              <Badge variant={organization.status === 'ACTIVE' ? 'success' : 'warning'}>
                {organization.status}
              </Badge>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
              Partner: <strong>{organization.partnerName ?? 'Partner Network'}</strong> · Code: <code>{organization.organizationCode}</code>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)', display: 'block' }}>
                Contact
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-primary)' }}>
                {organization.contactEmail}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Card
        title={`Registered Facilities for ${organization.organizationName}`}
        subtitle="Physical branch clinics, inpatient hospital wards, and specialty centers"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facility Code</TableHead>
                <TableHead>Branch Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Contact Phone</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgFacilities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero facilities registered under this organization.
                  </TableCell>
                </TableRow>
              ) : (
                orgFacilities.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {f.facilityCode}
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{f.facilityName}</strong>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{f.facilityType}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>
                      {f.addressStreet}, {f.addressCity}, {f.addressState} {f.addressPostalCode}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {f.contactPhone}
                    </TableCell>
                    <TableCell>
                      <Badge variant={f.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {f.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
