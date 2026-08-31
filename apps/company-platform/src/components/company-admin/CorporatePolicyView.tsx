import React, { useState } from 'react';
import type { CorporatePolicyDto } from '@docsearch/api-contracts';
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
import { PolicyApprovalDialog } from './PolicyApprovalDialog.js';

export interface CorporatePolicyViewProps {
  policies: CorporatePolicyDto[];
  onApprovePolicy: (policyId: string, resolutionReference: string, reason: string) => Promise<void>;
}

export const CorporatePolicyView: React.FC<CorporatePolicyViewProps> = ({
  policies,
  onApprovePolicy
}) => {
  const [selectedPolicy, setSelectedPolicy] = useState<CorporatePolicyDto | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card
        title="Corporate Policies & Bylaws Governance"
        subtitle="Articles of incorporation, internal bylaws, code of conduct, whistleblower policies, and review cycles"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy Code</TableHead>
                <TableHead>Policy Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Legal Entity</TableHead>
                <TableHead>Board Approval</TableHead>
                <TableHead>Next Review Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((p) => (
                <TableRow key={p.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {p.policyCode}
                  </TableCell>
                  <TableCell style={{ maxWidth: '240px' }}>
                    <strong style={{ color: 'var(--ds-color-text-primary)', display: 'block', marginBottom: '2px' }}>
                      {p.title}
                    </strong>
                    <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-color-text-muted)' }}>
                      {p.documentReference}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{p.category}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {p.versionReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {p.legalEntityName ?? 'Doc Search Inc.'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: p.approvedByBoardAt ? 'var(--ds-color-success)' : 'var(--ds-color-text-muted)' }}>
                    {p.approvedByBoardAt ? new Date(p.approvedByBoardAt).toLocaleDateString() : 'Pending Approval'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    {new Date(p.nextReviewDue).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'ACTIVE' ? 'success' : 'warning'}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.status === 'DRAFT' || p.status === 'UNDER_REVIEW' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedPolicy(p)}
                      >
                        Approve
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPolicy(p)}
                      >
                        Re-Sign
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {selectedPolicy && (
        <PolicyApprovalDialog
          isOpen={Boolean(selectedPolicy)}
          onClose={() => setSelectedPolicy(null)}
          policy={selectedPolicy}
          onApprovePolicy={onApprovePolicy}
        />
      )}
    </div>
  );
};
