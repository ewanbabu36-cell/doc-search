import React, { useState } from 'react';
import type { DisasterRecoveryPlanDto } from '@docsearch/api-contracts';
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
import { FailoverActionDialog } from './FailoverActionDialog.js';

export interface DisasterRecoveryPlanViewProps {
  plans: DisasterRecoveryPlanDto[];
  onInitiateFailover: (planId: string, environment: string, reason: string) => Promise<void>;
}

export const DisasterRecoveryPlanView: React.FC<DisasterRecoveryPlanViewProps> = ({
  plans,
  onInitiateFailover
}) => {
  const [selectedPlanForFailover, setSelectedPlanForFailover] = useState<DisasterRecoveryPlanDto | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card
        title="Disaster Recovery Plans & Governance Specifications"
        subtitle="Tier-1 clinical service recovery objectives, automated runbook references, and failover triggers"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Code</TableHead>
                <TableHead>Plan Name & Scope</TableHead>
                <TableHead>Primary Region</TableHead>
                <TableHead>DR Target Region</TableHead>
                <TableHead>Target RTO</TableHead>
                <TableHead>Target RPO</TableHead>
                <TableHead>Strategy</TableHead>
                <TableHead>Runbook Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((p) => (
                <TableRow key={p.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {p.planCode}
                  </TableCell>
                  <TableCell style={{ maxWidth: '240px' }}>
                    <strong style={{ color: 'var(--ds-color-text-primary)', display: 'block', marginBottom: '2px' }}>
                      {p.planName}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                      {p.scope}
                    </span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {p.primaryRegionCode ?? 'us-east-1'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {p.drRegionCode ?? 'us-west-2'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--ds-color-primary)' }}>
                    {p.rtoMinutes} min
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--ds-color-success)' }}>
                    {p.rpoMinutes} min
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{p.failoverStrategy}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {p.runbookReference}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPlanForFailover(p)}
                    >
                      ⚡ Failover
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {selectedPlanForFailover && (
        <FailoverActionDialog
          isOpen={Boolean(selectedPlanForFailover)}
          onClose={() => setSelectedPlanForFailover(null)}
          plan={selectedPlanForFailover}
          onInitiateFailover={onInitiateFailover}
        />
      )}
    </div>
  );
};
