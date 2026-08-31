import React, { useState } from 'react';
import type { AIGovernancePolicyDto, AIGovernancePolicyStatus } from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  Button,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';
import { PolicyTransitionDialog } from './PolicyTransitionDialog.js';

export interface AIGovernanceViewProps {
  policies: AIGovernancePolicyDto[];
  onTransitionPolicy: (policyId: string, toStatus: AIGovernancePolicyStatus, reason: string) => Promise<void>;
}

export const AIGovernanceView: React.FC<AIGovernanceViewProps> = ({
  policies,
  onTransitionPolicy
}) => {
  const [selectedPolicy, setSelectedPolicy] = useState<AIGovernancePolicyDto | null>(null);

  const handleTransition = async (toStatus: AIGovernancePolicyStatus, reason: string) => {
    if (!selectedPolicy) return;
    await onTransitionPolicy(selectedPolicy.id, toStatus, reason);
    setSelectedPolicy(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card
        title="AI Governance Policies & Safety Boundaries"
        subtitle="Institutional safety mandates, human oversight rules, and non-negotiable prohibited clinical use cases"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy Code & Name</TableHead>
                <TableHead>Policy Type</TableHead>
                <TableHead>Risk Classification</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Human Oversight</TableHead>
                <TableHead>Clinical Safety Boundary Mandate</TableHead>
                <TableHead>Approved By</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No governance policies registered.
                  </TableCell>
                </TableRow>
              ) : (
                policies.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                          {p.policyCode}
                        </span>
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>{p.name}</strong>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{p.policyType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.riskLevel === 'HIGH_CLINICAL_CONTEXT' ? 'danger' : 'neutral'}>
                        {p.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'APPROVED' ? 'success' : 'neutral'}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.humanOversightRequired ? 'warning' : 'neutral'}>
                        {p.humanOversightRequired ? 'Mandatory' : 'Optional'}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', maxWidth: '280px' }}>
                      <p style={{ margin: 0, color: 'var(--ds-color-text-primary)' }}>
                        {p.clinicalSafetyBoundary}
                      </p>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                      {p.approvedByEmail ?? 'Pending Review'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPolicy(p)}
                      >
                        Change Status
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {selectedPolicy && (
        <PolicyTransitionDialog
          isOpen={Boolean(selectedPolicy)}
          onClose={() => setSelectedPolicy(null)}
          policy={selectedPolicy}
          onTransition={handleTransition}
        />
      )}
    </div>
  );
};
