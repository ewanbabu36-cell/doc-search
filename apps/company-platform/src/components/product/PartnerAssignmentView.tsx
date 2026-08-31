import React from 'react';
import type { PartnerPlanAssignmentDto } from '@docsearch/api-contracts';
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

export interface PartnerAssignmentViewProps {
  assignments: PartnerPlanAssignmentDto[];
  onOpenAssignDialog: () => void;
}

export const PartnerAssignmentView: React.FC<PartnerAssignmentViewProps> = ({
  assignments,
  onOpenAssignDialog
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Partner Entitlement & Plan Assignments
          </h2>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Active SaaS tier assignments linking healthcare partner tenants to products and plans (Zero billing)
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={onOpenAssignDialog}>
          + Assign Plan to Partner
        </Button>
      </div>

      {/* Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Healthcare Partner</TableHead>
                <TableHead>Product Line</TableHead>
                <TableHead>Assigned Plan Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>Assigned By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No partner plan assignments found.
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>{a.partnerTradeName}</strong>
                        <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                          {a.partnerTenantSlug}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.8125rem' }}>{a.productName}</span>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ color: 'var(--ds-color-primary)' }}>{a.planName}</strong>
                        <Badge variant="neutral">v{a.planVersion}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.assignmentStatus === 'ACTIVE' ? 'success' : 'neutral'}>
                        {a.assignmentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                      {new Date(a.effectiveDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                      {a.assignedByEmail}
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
