import React, { useState } from 'react';
import type {
  OperationalPartnerDto,
  CreateOperationalPartnerRequest,
  UpdateOperationalPartnerRequest
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
import { PartnerCreateDialog } from '../dialogs/PartnerCreateDialog.js';
import { PartnerStatusDialog } from '../dialogs/PartnerStatusDialog.js';

export interface PartnerDirectoryViewProps {
  partners: OperationalPartnerDto[];
  tenantId: string;
  actorId: string;
  actorRole: string;
  onCreatePartner: (req: CreateOperationalPartnerRequest) => Promise<void>;
  onUpdatePartner: (req: UpdateOperationalPartnerRequest) => Promise<void>;
}

export const PartnerDirectoryView: React.FC<PartnerDirectoryViewProps> = ({
  partners,
  tenantId,
  actorId,
  actorRole,
  onCreatePartner,
  onUpdatePartner
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<OperationalPartnerDto | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Operational Healthcare Partner Registry
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
            Partner networks, clinical contracts, and multi-facility ownership boundaries
          </span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
          🏥 Onboard New Partner
        </Button>
      </div>

      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner Code</TableHead>
                <TableHead>Legal Business Name</TableHead>
                <TableHead>Healthcare Model</TableHead>
                <TableHead>Contact Email</TableHead>
                <TableHead>Contract Ref</TableHead>
                <TableHead>Subscription Ref</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((p) => (
                <TableRow key={p.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {p.partnerCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{p.legalBusinessName}</strong>
                    {p.contactPhone && (
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        {p.contactPhone}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{p.partnerType}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {p.contactEmail}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {p.contractReference ?? '—'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {p.subscriptionReference ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'ACTIVE' ? 'success' : p.status === 'ONBOARDING' ? 'primary' : 'warning'}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPartner(p)}
                    >
                      Status
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {isCreateOpen && (
        <PartnerCreateDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          tenantId={tenantId}
          actorId={actorId}
          actorRole={actorRole}
          onCreatePartner={onCreatePartner}
        />
      )}

      {selectedPartner && (
        <PartnerStatusDialog
          isOpen={Boolean(selectedPartner)}
          onClose={() => setSelectedPartner(null)}
          partner={selectedPartner}
          actorId={actorId}
          actorRole={actorRole}
          onUpdatePartner={onUpdatePartner}
        />
      )}
    </div>
  );
};
