import React, { useState } from 'react';
import type { IntegrationIncidentDto } from '@docsearch/api-contracts';
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
import { IncidentActionDialog } from './IncidentActionDialog.js';

export interface IntegrationIncidentCenterViewProps {
  incidents: IntegrationIncidentDto[];
  onAcknowledgeIncident: (incidentId: string, assignedToEmail: string, reason: string) => Promise<void>;
  onResolveIncident: (incidentId: string, resolutionNotes: string, reason: string) => Promise<void>;
}

export const IntegrationIncidentCenterView: React.FC<IntegrationIncidentCenterViewProps> = ({
  incidents,
  onAcknowledgeIncident,
  onResolveIncident
}) => {
  const [selectedIncident, setSelectedIncident] = useState<IntegrationIncidentDto | null>(null);
  const [actionDialogMode, setActionDialogMode] = useState<'ACKNOWLEDGE' | 'RESOLVE'>('ACKNOWLEDGE');

  const handleOpenAction = (incident: IntegrationIncidentDto, mode: 'ACKNOWLEDGE' | 'RESOLVE') => {
    setSelectedIncident(incident);
    setActionDialogMode(mode);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="warning" title="Integration Incident & Degradation Center">
        All anomalies across FHIR bridge endpoints, MLLP socket listeners, webhook retries, and credential expirations are recorded and triaged here with audited corrective actions.
      </Alert>

      <Card
        title="Active Integration Incidents & Connectivity Alerts"
        subtitle="Audited incident triage records, assignee tracking, and operational post-mortems"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incident Code</TableHead>
                <TableHead>Title & Narrative</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Detected At</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero integration incidents logged.
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
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
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
        <IncidentActionDialog
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
