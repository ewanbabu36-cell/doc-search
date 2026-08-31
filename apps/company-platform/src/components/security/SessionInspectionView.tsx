import React, { useState } from 'react';
import type { SecuritySessionDto } from '@docsearch/api-contracts';
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
import { SessionTerminationDialog } from './SessionTerminationDialog.js';

export interface SessionInspectionViewProps {
  sessions: SecuritySessionDto[];
  onTerminateSession: (sessionId: string, reason: string) => Promise<void>;
}

export const SessionInspectionView: React.FC<SessionInspectionViewProps> = ({
  sessions,
  onTerminateSession
}) => {
  const [selectedSession, setSelectedSession] = useState<SecuritySessionDto | null>(null);

  const handleTerminate = async (sessionId: string, reason: string) => {
    await onTerminateSession(sessionId, reason);
    setSelectedSession(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Zero-Secret Session Telemetry">
        Active administrator and operator sessions are monitored via cryptographic IP and device fingerprint hashes. <strong>Raw session tokens and passwords are never displayed or stored in plaintext.</strong>
      </Alert>

      <Card
        title="Active Operator Sessions & Access Inspection"
        subtitle="Live authentication session states, hardware token verification, and privileged termination controls"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Account</TableHead>
                <TableHead>Auth Method</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Device & Agent Summary</TableHead>
                <TableHead>Started At</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Expires At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No active sessions found.
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{s.userEmail}</strong>
                    </TableCell>
                    <TableCell>
                      <Badge variant="primary">{s.authenticationMethod}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{s.scope}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {s.userAgentSummary}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                      {new Date(s.startedAt).toLocaleTimeString()}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                      {new Date(s.lastActivityAt).toLocaleTimeString()}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                      {new Date(s.expiresAt).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.status === 'ACTIVE' ? 'success' : 'danger'}>
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {s.status === 'ACTIVE' ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setSelectedSession(s)}
                        >
                          Terminate
                        </Button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                          Terminated
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {selectedSession && (
        <SessionTerminationDialog
          isOpen={Boolean(selectedSession)}
          onClose={() => setSelectedSession(null)}
          session={selectedSession}
          onTerminate={handleTerminate}
        />
      )}
    </div>
  );
};
