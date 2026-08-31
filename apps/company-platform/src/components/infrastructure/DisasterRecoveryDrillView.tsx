import React, { useState } from 'react';
import type { DisasterRecoveryDrillDto } from '@docsearch/api-contracts';
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
  TableCell,
  Alert
} from '@docsearch/ui-kit';
import { DrillExecuteDialog } from './DrillExecuteDialog.js';

export interface DisasterRecoveryDrillViewProps {
  drills: DisasterRecoveryDrillDto[];
  onExecuteDrill: (drillId: string, reason: string) => Promise<void>;
}

export const DisasterRecoveryDrillView: React.FC<DisasterRecoveryDrillViewProps> = ({
  drills,
  onExecuteDrill
}) => {
  const [selectedDrillForExecution, setSelectedDrillForExecution] = useState<DisasterRecoveryDrillDto | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Quarterly Compliance DR Rehearsals">
        Disaster recovery simulations test automated DNS redirection, database replica promotion, and container restart SLAs without impacting production workloads.
      </Alert>

      <Card
        title="Disaster Recovery Drills & Tabletop Simulations"
        subtitle="Audited failover rehearsals, measured recovery time objectives, and post-drill findings"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drill Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Plan Reference</TableHead>
                <TableHead>Target RTO / RPO</TableHead>
                <TableHead>Measured RTO / RPO (Sample)</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Conducted By</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drills.map((d) => (
                <TableRow key={d.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {d.drillCode}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{d.drillType}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {d.planName ?? 'Tier-1 DR Plan'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {d.expectedRtoMinutes}m / {d.expectedRpoMinutes}m
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)', fontWeight: '600' }}>
                    {d.actualRtoMinutesReference ?? '—'} / {d.actualRpoReference ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.result === 'PASSED' ? 'success' : d.result === 'FAILED' ? 'danger' : 'neutral'}>
                      {d.result}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {d.conductedByEmail}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    {new Date(d.scheduledAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {d.status === 'SCHEDULED' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedDrillForExecution(d)}
                      >
                        Execute
                      </Button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                        Verified
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {selectedDrillForExecution && (
        <DrillExecuteDialog
          isOpen={Boolean(selectedDrillForExecution)}
          onClose={() => setSelectedDrillForExecution(null)}
          drill={selectedDrillForExecution}
          onExecuteDrill={onExecuteDrill}
        />
      )}
    </div>
  );
};
