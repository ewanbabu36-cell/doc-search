import React, { useState } from 'react';
import type { SecurityIncidentDto } from '@docsearch/api-contracts';
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
  TableCell,
  Alert
} from '@docsearch/ui-kit';

export interface SecurityIncidentCenterViewProps {
  incidents: SecurityIncidentDto[];
  onAcknowledge: (incidentId: string, reason: string) => Promise<void>;
  onResolve: (incidentId: string, resolutionNotes: string) => Promise<void>;
}

export const SecurityIncidentCenterView: React.FC<SecurityIncidentCenterViewProps> = ({
  incidents,
  onAcknowledge,
  onResolve
}) => {
  const [actingId, setActingId] = useState<string | null>(null);

  const handleAck = async (id: string) => {
    setActingId(id);
    try {
      await onAcknowledge(id, 'Security officer assigned and actively investigating incident.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to acknowledge incident');
    } finally {
      setActingId(null);
    }
  };

  const handleRes = async (id: string) => {
    setActingId(id);
    try {
      await onResolve(id, 'Mitigated and verified against security policy baseline.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to resolve incident');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="warning" title="Security Incident Queue">
        Administrative security incident queue capturing policy breaches, anomalous export triggers, and credential lifecycle warnings.
      </Alert>

      <Card
        title="Security Incident Feed & Response Center"
        subtitle="Operational event feed of intercepted security anomalies, gateway blocks, and resolution workflows"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incident Code</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Title & Narrative</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Assigned Lead</TableHead>
                <TableHead>Detected At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero security incidents recorded.
                  </TableCell>
                </TableRow>
              ) : (
                incidents.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {i.incidentCode}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          i.severity === 'CRITICAL' || i.severity === 'HIGH'
                            ? 'danger'
                            : i.severity === 'MEDIUM'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {i.severity}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {i.category}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', maxWidth: '280px' }}>
                      <strong style={{ color: 'var(--ds-color-text-primary)', display: 'block', marginBottom: '2px' }}>
                        {i.title}
                      </strong>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                        {i.description}
                      </p>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                      {i.source}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>
                      {i.assignedToEmail ?? 'Unassigned'}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(i.detectedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          i.status === 'RESOLVED'
                            ? 'success'
                            : i.status === 'INVESTIGATING'
                            ? 'primary'
                            : 'warning'
                        }
                      >
                        {i.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {i.status === 'OPEN' && (
                          <Button
                            variant="outline"
                            size="sm"
                            isLoading={actingId === i.id}
                            onClick={() => handleAck(i.id)}
                          >
                            Ack
                          </Button>
                        )}
                        {i.status !== 'RESOLVED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            isLoading={actingId === i.id}
                            onClick={() => handleRes(i.id)}
                          >
                            Resolve
                          </Button>
                        )}
                        {i.status === 'RESOLVED' && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                            Closed
                          </span>
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
    </div>
  );
};
