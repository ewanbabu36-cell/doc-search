import React, { useState } from 'react';
import type {
  OperationalFacilityDto,
  OperationalOrganizationDto,
  CreateOperationalFacilityRequest
} from '@docsearch/api-contracts';
import {
  Card,
  Button,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';
import { FacilityCreateDialog } from '../dialogs/FacilityCreateDialog.js';

export interface FacilityDirectoryViewProps {
  facilities: OperationalFacilityDto[];
  activeOrganization: OperationalOrganizationDto | null;
  tenantId: string;
  actorId: string;
  actorRole: string;
  onCreateFacility: (req: CreateOperationalFacilityRequest) => Promise<void>;
  onSelectFacility: (facilityId: string) => void;
}

export const FacilityDirectoryView: React.FC<FacilityDirectoryViewProps> = ({
  facilities,
  activeOrganization,
  tenantId,
  actorId,
  actorRole,
  onCreateFacility,
  onSelectFacility
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Physical Branch & Facility Directory
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
            Outpatient clinics, surgery pavilions, diagnostic centers, and hospital campus locations
          </span>
        </div>
        {activeOrganization && (
          <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
            📍 Register Facility Branch
          </Button>
        )}
      </div>

      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facility Code</TableHead>
                <TableHead>Branch Name</TableHead>
                <TableHead>Healthcare Type</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>City, State</TableHead>
                <TableHead>Contact Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facilities.map((fac) => (
                <TableRow key={fac.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {fac.facilityCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{fac.facilityName}</strong>
                    <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                      {fac.addressStreet}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{fac.facilityType}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {fac.organizationName ?? 'Organization'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {fac.addressCity}, {fac.addressState}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {fac.contactPhone}
                  </TableCell>
                  <TableCell>
                    <Badge variant={fac.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {fac.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectFacility(fac.id)}
                    >
                      Select
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {isCreateOpen && activeOrganization && (
        <FacilityCreateDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          tenantId={tenantId}
          organization={activeOrganization}
          actorId={actorId}
          actorRole={actorRole}
          onCreateFacility={onCreateFacility}
        />
      )}
    </div>
  );
};
