import React from 'react';
import type { PartnerProfileDto, OpportunityDto } from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface PartnerSalesViewProps {
  partners: PartnerProfileDto[];
  opportunities: OpportunityDto[];
}

export const PartnerSalesView: React.FC<PartnerSalesViewProps> = ({
  partners,
  opportunities
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Card
        title="Enterprise Accounts & Partner Sales Portfolio"
        subtitle="Sales-oriented perspective of existing B2B healthcare partners (Reusing CRM entity foundation)"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner Account</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>CRM Lifecycle Status</TableHead>
                <TableHead>Scoped Facilities</TableHead>
                <TableHead>Primary Executive Contact</TableHead>
                <TableHead>Active Opportunities</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No healthcare partner accounts found.
                  </TableCell>
                </TableRow>
              ) : (
                partners.map((p) => {
                  const partnerOpps = opportunities.filter((o) => o.partnerId === p.id);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ color: 'var(--ds-color-text-primary)' }}>{p.tradeName}</strong>
                          <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                            {p.tenantSlug}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">{p.partnerType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.lifecycleStatus === 'ACTIVE' ? 'success' : 'primary'}>
                          {p.lifecycleStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontWeight: '500' }}>{p.branchCount} branches</span>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8125rem' }}>
                          <span>{p.primaryContact.name}</span>
                          <span style={{ color: 'var(--ds-color-text-muted)' }}>{p.primaryContact.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {partnerOpps.length > 0 ? (
                          <Badge variant="success">{partnerOpps.length} Open Deal(s)</Badge>
                        ) : (
                          <span style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.8125rem' }}>No open deals</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
