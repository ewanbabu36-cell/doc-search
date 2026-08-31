import React, { useState } from 'react';
import type { EncounterAuditTraceDto } from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  Input,
  Select,
  Alert,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface EncounterAuditVaultViewProps {
  auditTraces: EncounterAuditTraceDto[];
}

export const EncounterAuditVaultView: React.FC<EncounterAuditVaultViewProps> = ({
  auditTraces
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filtered = auditTraces.filter((t) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        t.traceId.toLowerCase().includes(q) ||
        t.actorId.toLowerCase().includes(q) ||
        t.action.toLowerCase().includes(q) ||
        t.targetEntityId.toLowerCase().includes(q) ||
        t.justification.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (actionFilter !== 'ALL' && t.action !== actionFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
          Clinical Encounter Audit Vault
        </h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
          Cryptographic, tamper-evident audit ledger capturing every encounter registration, arrival check-in, physician assignment, and state transition
        </span>
      </div>

      <Alert type="info" title="Zero PII & HIPAA Audit Compliance">
        All mutations are cryptographically correlated with actor ID, role, mandatory audit justification, and precise timestamps.
      </Alert>

      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Search Audit Traces
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by trace ID, actor, target..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Action Type
            </label>
            <Select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Audited Actions' },
                { value: 'ENCOUNTER_CREATED', label: 'Encounter Created' },
                { value: 'PATIENT_CHECKED_IN', label: 'Patient Checked In' },
                { value: 'CONSULTATION_STARTED', label: 'Consultation Started' },
                { value: 'DOCTOR_ASSIGNED', label: 'Doctor Assigned' },
                { value: 'ENCOUNTER_CANCELLED', label: 'Encounter Cancelled' },
                { value: 'ENCOUNTER_REFERRED', label: 'Encounter Referred' },
                { value: 'ENCOUNTER_REASSIGNED', label: 'Encounter Reassigned' }
              ]}
            />
          </div>
        </div>
      </Card>

      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trace ID</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor & Role</TableHead>
                <TableHead>Target Entity</TableHead>
                <TableHead>Justification</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Occurred At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero audit traces found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem', fontWeight: '700' }}>
                      {t.traceId}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>
                      {t.action}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>
                      <strong>{t.actorId}</strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        {t.actorRole}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {t.targetEntity} / {t.targetEntityId}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', maxWidth: '280px' }}>
                      {t.justification}
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.operationStatus === 'SUCCESS' ? 'success' : 'danger'}>
                        {t.operationStatus}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                      {new Date(t.occurredAt).toLocaleString()}
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
