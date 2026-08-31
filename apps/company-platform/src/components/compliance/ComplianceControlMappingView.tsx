import React, { useState } from 'react';
import type {
  ComplianceControlMappingDto,
  ComplianceControlDto,
  ComplianceEvidenceDto
} from '@docsearch/api-contracts';
import {
  Card,
  Input,
  Select,
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

export interface ComplianceControlMappingViewProps {
  mappings: ComplianceControlMappingDto[];
  controls: ComplianceControlDto[];
  evidence: ComplianceEvidenceDto[];
  onMapEvidence: (controlId: string, evidenceId: string, notes: string, reason: string) => Promise<void>;
}

export const ComplianceControlMappingView: React.FC<ComplianceControlMappingViewProps> = ({
  mappings,
  controls,
  evidence,
  onMapEvidence
}) => {
  const [search, setSearch] = useState('');
  const [selectedControlId, setSelectedControlId] = useState(controls[0]?.id || '');
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(evidence[0]?.id || '');
  const [mappingNotes, setMappingNotes] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = mappings.filter((m) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !(m.controlCode && m.controlCode.toLowerCase().includes(q)) &&
        !(m.controlTitle && m.controlTitle.toLowerCase().includes(q)) &&
        !(m.evidenceCode && m.evidenceCode.toLowerCase().includes(q)) &&
        !(m.evidenceTitle && m.evidenceTitle.toLowerCase().includes(q))
      ) {
        return false;
      }
    }
    return true;
  });

  const handleCreateMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedControlId || !selectedEvidenceId || !reason.trim()) {
      setError('Please select both a control and an evidence artifact, with a mandatory governance reason.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onMapEvidence(selectedControlId, selectedEvidenceId, mappingNotes.trim(), reason.trim());
      setMappingNotes('');
      setReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mapping creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Control-to-Evidence Traceability Matrix">
        Each mapping explicitly correlates a compliance control requirement against cryptographic evidence references and audit attestations.
      </Alert>

      {/* Attach Evidence Card */}
      <Card title="Attach Evidence Artifact to Control" subtitle="Create audited linkage between a regulatory control and verification evidence" padding="md">
        <form onSubmit={handleCreateMapping} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {error && (
            <Alert type="error" title="Validation Error">
              {error}
            </Alert>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
                Target Control
              </label>
              <Select
                options={controls.map((c) => ({ label: `${c.controlCode} — ${c.title}`, value: c.id }))}
                value={selectedControlId}
                onChange={(e) => setSelectedControlId(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
                Supporting Evidence Artifact
              </label>
              <Select
                options={evidence.map((ev) => ({ label: `${ev.evidenceCode} — ${ev.title}`, value: ev.id }))}
                value={selectedEvidenceId}
                onChange={(e) => setSelectedEvidenceId(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
                Mapping Notes (Optional)
              </label>
              <Input
                placeholder="e.g. Primary operating policy attestation..."
                value={mappingNotes}
                onChange={(e) => setMappingNotes(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
                Governance Reason (Mandatory Audit)
              </label>
              <Input
                required
                placeholder="e.g. Attached annual review attestation per CC6.1..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <Button variant="primary" size="sm" onClick={handleCreateMapping} isLoading={isSubmitting}>
              Attach Evidence Mapping
            </Button>
          </div>
        </form>
      </Card>

      {/* Search Mappings */}
      <Card padding="md">
        <div style={{ maxWidth: '400px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
            Search Active Mappings
          </label>
          <Input
            placeholder="Search by control or evidence code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      {/* Mappings Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Control Code & Title</TableHead>
                <TableHead>Evidence Code & Title</TableHead>
                <TableHead>Evidence Type</TableHead>
                <TableHead>Mapping Notes</TableHead>
                <TableHead>Mapped By</TableHead>
                <TableHead>Mapped At</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No control mappings found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <code style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                          {m.controlCode}
                        </code>
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>{m.controlTitle}</strong>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <code style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                          {m.evidenceCode}
                        </code>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
                          {m.evidenceTitle}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="primary">{m.evidenceType ?? 'DOCUMENT'}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', maxWidth: '240px' }}>
                      {m.mappingNotes ?? 'Direct baseline linkage'}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {m.mappedByEmail}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                      {new Date(m.mappedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.mappingStatus === 'ACTIVE' ? 'success' : 'neutral'}>
                        {m.mappingStatus}
                      </Badge>
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
