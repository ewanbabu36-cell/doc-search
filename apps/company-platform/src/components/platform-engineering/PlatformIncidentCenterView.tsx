import React, { useState } from 'react';
import type { PlatformIncidentDto } from '@docsearch/api-contracts';
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
import { PlatformIncidentActionDialog } from './PlatformIncidentActionDialog.js';

export interface PlatformIncidentCenterViewProps {
  incidents: PlatformIncidentDto[];
  onAcknowledgeIncident: (incidentId: string, assignedToEmail: string, reason: string) => Promise<void>;
  onResolveIncident: (incidentId: string, resolutionNotes: string, reason: string) => Promise<void>;
}

export const PlatformIncidentCenterView: React.FC<PlatformIncidentCenterViewProps> = ({
  incidents,
  onAcknowledgeIncident,
  onResolveIncident
}) => {
  const [selectedIncident, setSelectedIncident] = useState<PlatformIncidentDto | null>(null);
  const [actionDialogMode, setActionDialogMode] = useState<'ACKNOWLEDGE' | 'RESOLVE'>('ACKNOWLEDGE');

  const handleOpenAction = (incident: PlatformIncidentDto, mode: 'ACKNOWLEDGE' | 'RESOLVE') => {
    setSelectedIncident(incident);
    setActionDialogMode(mode);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="warning" title="Platform Incidents & Outage Center">
        All anomalies across build pipelines, CI/CD runners, container registry pulls, and cluster deployment rollouts are recorded and triaged here with audited corrective actions.
      </Alert>

      <Card
        title="Platform Incidents & Operational Triage"
        subtitle="Audited engineering incident tickets, post-mortem notes, and assignee tracking"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incident Code</TableHead>
                <TableHead>Title & Summary</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Detected At</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero active platform engineering incidents.
                  </TableCell>
                </TableRow>
              ) : (
                incidents.map((inc) => (
                  <TableRow key={inc.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {inc.incidentCode}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', maxWidth: '240px' }}>
                      <strong style={{ color: 'var(--ds-color-text-primary)', display: 'block', marginBottom: '2px' }}>
                        {inc.title}
                      </strong>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                        {inc.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{inc.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          inc.severity === 'CRITICAL'
                            ? 'danger'
                            : inc.severity === 'HIGH'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {inc.severity}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {inc.source}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(inc.detectedAt).toLocaleString()}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {inc.assignedToEmail ?? 'Unassigned'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          inc.status === 'RESOLVED'
                            ? 'success'
                            : inc.status === 'OPEN'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {inc.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {inc.status === 'OPEN' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenAction(inc, 'ACKNOWLEDGE')}
                          >
                            Acknowledge
                          </Button>
                        )}
                        {inc.status !== 'RESOLVED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenAction(inc, 'RESOLVE')}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {selectedIncident && (
        <PlatformIncidentActionDialog
          isOpen={Boolean(selectedIncident)}
          onClose={() => setSelectedIncident(null)}
          incident={selectedIncident}
          mode={actionDialogMode}
          onAcknowledge={onAcknowledgeIncident}
          onResolve={onResolveIncident}
        />
      )}
    </div>
  );
};
