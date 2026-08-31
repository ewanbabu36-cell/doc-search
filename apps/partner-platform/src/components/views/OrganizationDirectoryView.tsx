import React, { useState } from 'react';
import type {
  OperationalOrganizationDto,
  OperationalPartnerDto,
  CreateOperationalOrganizationRequest
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
import { OrganizationCreateDialog } from '../dialogs/OrganizationCreateDialog.js';

export interface OrganizationDirectoryViewProps {
  organizations: OperationalOrganizationDto[];
  activePartner: OperationalPartnerDto | null;
  tenantId: string;
  actorId: string;
  actorRole: string;
  onCreateOrganization: (req: CreateOperationalOrganizationRequest) => Promise<void>;
  onSelectOrganization: (orgId: string) => void;
}

export const OrganizationDirectoryView: React.FC<OrganizationDirectoryViewProps> = ({
  organizations,
  activePartner,
  tenantId,
  actorId,
  actorRole,
  onCreateOrganization,
  onSelectOrganization
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Clinic & Hospital Organizations Directory
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
            Operational clinical organizations, inpatient hospitals, and specialty centers
          </span>
        </div>
        {activePartner && (
          <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
            🏢 Add Clinic / Hospital
          </Button>
        )}
      </div>

      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Org Code</TableHead>
                <TableHead>Organization Name</TableHead>
                <TableHead>Healthcare Type</TableHead>
                <TableHead>Parent Partner</TableHead>
                <TableHead>Contact Email</TableHead>
                <TableHead>Facility Count</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {org.organizationCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{org.organizationName}</strong>
                  </TableCell>
                  <TableCell>
                    <Badge variant={org.organizationType === 'HOSPITAL' ? 'primary' : 'neutral'}>
                      {org.organizationType}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {org.partnerName ?? 'Partner Network'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {org.contactEmail}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>
                    {org.facilityCount} facilities
                  </TableCell>
                  <TableCell>
                    <Badge variant={org.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {org.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectOrganization(org.id)}
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

      {isCreateOpen && activePartner && (
        <OrganizationCreateDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          tenantId={tenantId}
          partner={activePartner}
          actorId={actorId}
          actorRole={actorRole}
          onCreateOrganization={onCreateOrganization}
        />
      )}
    </div>
  );
};
