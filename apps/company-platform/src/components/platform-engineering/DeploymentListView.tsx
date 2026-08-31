import React, { useState } from 'react';
import type { DeploymentDto, EnvironmentDto, DeploymentStrategy } from '@docsearch/api-contracts';
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
import { DeploymentPromotionDialog } from './DeploymentPromotionDialog.js';
import { DeploymentRollbackDialog } from './DeploymentRollbackDialog.js';

export interface DeploymentListViewProps {
  deployments: DeploymentDto[];
  environments: EnvironmentDto[];
  onPromoteDeployment: (targetEnvId: string, artifactRef: string, commitRef: string, strategy: DeploymentStrategy, reason: string) => Promise<void>;
  onRollbackDeployment: (deploymentId: string, rollbackArtifactRef: string, reason: string) => Promise<void>;
}

export const DeploymentListView: React.FC<DeploymentListViewProps> = ({
  deployments,
  environments,
  onPromoteDeployment,
  onRollbackDeployment
}) => {
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [selectedDeploymentForRollback, setSelectedDeploymentForRollback] = useState<DeploymentDto | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Workload Deployments & Release Rollouts
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
            Audited container deployment pipelines and multi-environment rollback controls
          </span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsPromoteDialogOpen(true)}>
          🚀 Promote New Deployment
        </Button>
      </div>

      {/* Deployments Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deployment Code</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Artifact Reference</TableHead>
                <TableHead>Commit SHA</TableHead>
                <TableHead>Strategy</TableHead>
                <TableHead>Deployed By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Deployed At</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deployments.map((d) => (
                <TableRow key={d.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {d.deploymentCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>
                      {d.environmentName ?? d.environmentType}
                    </strong>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {d.artifactReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {d.commitReference}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{d.deploymentStrategy}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {d.deployedByEmail}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        d.status === 'DEPLOYED'
                          ? 'success'
                          : d.status === 'ROLLED_BACK'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    {new Date(d.startedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {d.status === 'DEPLOYED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDeploymentForRollback(d)}
                      >
                        Rollback
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {isPromoteDialogOpen && (
        <DeploymentPromotionDialog
          isOpen={isPromoteDialogOpen}
          onClose={() => setIsPromoteDialogOpen(false)}
          environments={environments}
          onPromote={onPromoteDeployment}
        />
      )}

      {selectedDeploymentForRollback && (
        <DeploymentRollbackDialog
          isOpen={Boolean(selectedDeploymentForRollback)}
          onClose={() => setSelectedDeploymentForRollback(null)}
          deployment={selectedDeploymentForRollback}
          onRollback={onRollbackDeployment}
        />
      )}
    </div>
  );
};
