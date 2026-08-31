import React from 'react';
import type { PatientMergeEventDto } from '@docsearch/api-contracts';
import {
  Card,
  Alert,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';


export interface PatientMergeHistoryViewProps {
  mergeEvents: PatientMergeEventDto[];
}

export const PatientMergeHistoryView: React.FC<PatientMergeHistoryViewProps> = ({ mergeEvents }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
          Audited Patient Merge Ledger
        </h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
          Historical record of duplicate consolidation events, canonical MRN assignments, and snapshot archives
        </span>
      </div>

      <Alert type="info" title="Reversible Reference Preservation">
        Duplicate patient records are preserved with status <code>MERGED</code> pointing to the canonical identity. Encounter and diagnostic history remain intact with audit traceability.
      </Alert>

      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Canonical MRN</TableHead>
                <TableHead>Merged Duplicate MRN</TableHead>
                <TableHead>Authorizing Actor</TableHead>
                <TableHead>Merge Justification</TableHead>
                <TableHead>Correlation ID</TableHead>
                <TableHead>Merged At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mergeEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero patient merge events recorded.
                  </TableCell>
                </TableRow>
              ) : (
                mergeEvents.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-success)', fontFamily: 'var(--ds-font-mono)' }}>
                        {m.canonicalMrn ?? 'Canonical MRN'}
                      </strong>
                    </TableCell>
                    <TableCell>
                      <span style={{ color: 'var(--ds-color-text-muted)', fontFamily: 'var(--ds-font-mono)', textDecoration: 'line-through' }}>
                        {m.mergedMrn ?? 'Merged MRN'}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      <strong>{m.actorId}</strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        {m.actorRole}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', maxWidth: '300px' }}>
                      {m.mergeReason}
                    </TableCell>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem' }}>
                      {m.correlationId}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(m.mergedAt).toLocaleString()}
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
