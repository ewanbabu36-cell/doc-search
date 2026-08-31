import React, { useState } from 'react';
import type { AISafetyEventDto } from '@docsearch/api-contracts';
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

export interface AISafetyCenterViewProps {
  safetyEvents: AISafetyEventDto[];
  onAcknowledge: (eventId: string, reason: string) => Promise<void>;
  onResolve: (eventId: string, notes: string) => Promise<void>;
}

export const AISafetyCenterView: React.FC<AISafetyCenterViewProps> = ({
  safetyEvents,
  onAcknowledge,
  onResolve
}) => {
  const [actingId, setActingId] = useState<string | null>(null);

  const handleAck = async (id: string) => {
    setActingId(id);
    try {
      await onAcknowledge(id, 'Acknowledged by AI safety officer.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to acknowledge safety event');
    } finally {
      setActingId(null);
    }
  };

  const handleRes = async (id: string) => {
    setActingId(id);
    try {
      await onResolve(id, 'Investigated and verified against governance policy.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to resolve safety event');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="warning" title="AI Safety Monitoring Center">
        Real-time interception of policy boundary violations, prohibited prompt attempts, and human-in-the-loop escalation queues.
      </Alert>

      <Card
        title="AI Safety Incident Feed & Governance Queue"
        subtitle="Operational event feed of intercepted prompt anomalies, safety gate interventions, and resolution workflows"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Code</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Target Entity</TableHead>
                <TableHead>Incident Narrative</TableHead>
                <TableHead>Recommended Action</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safetyEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero safety anomalies recorded.
                  </TableCell>
                </TableRow>
              ) : (
                safetyEvents.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {s.eventCode}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          s.severity === 'CRITICAL' || s.severity === 'HIGH'
                            ? 'danger'
                            : s.severity === 'WARNING'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {s.severity}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>{s.category}</TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {s.modelCode ?? s.promptTemplateCode ?? 'Platform Gate'}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', maxWidth: '280px' }}>
                      {s.description}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-primary)', maxWidth: '220px' }}>
                      {s.recommendedAction}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.status === 'RESOLVED' ? 'success' : s.status === 'ACKNOWLEDGED' ? 'primary' : 'warning'}>
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {s.status === 'OPEN' && (
                          <Button
                            variant="outline"
                            size="sm"
                            isLoading={actingId === s.id}
                            onClick={() => handleAck(s.id)}
                          >
                            Ack
                          </Button>
                        )}
                        {s.status !== 'RESOLVED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            isLoading={actingId === s.id}
                            onClick={() => handleRes(s.id)}
                          >
                            Resolve
                          </Button>
                        )}
                        {s.status === 'RESOLVED' && (
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
