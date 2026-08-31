import React from 'react';
import type { AIAuditTraceDto } from '@docsearch/api-contracts';
import {
  Card,
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

export interface AIAuditTraceViewProps {
  traces: AIAuditTraceDto[];
}

export const AIAuditTraceView: React.FC<AIAuditTraceViewProps> = ({ traces }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Zero-PHI Audit Ingestion Boundary">
        AI audit traces capture operational governance metadata, model versioning, safety gate decisions, and physician review statuses. <strong>Raw patient prompts and PHI are strictly excluded from audit streams.</strong>
      </Alert>

      <Card
        title="AI Inference Governance Audit Log"
        subtitle="Cryptographically tracked AI request lifecycles, safety gate outcomes, and human-in-the-loop review events"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trace ID</TableHead>
                <TableHead>Occurred At</TableHead>
                <TableHead>Actor / Partner</TableHead>
                <TableHead>Model & Version</TableHead>
                <TableHead>Safety Classification</TableHead>
                <TableHead>Request Status</TableHead>
                <TableHead>Outcome Status</TableHead>
                <TableHead>Human Review Status</TableHead>
                <TableHead>Environment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {traces.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No AI audit traces logged.
                  </TableCell>
                </TableRow>
              ) : (
                traces.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {t.traceId}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                      {new Date(t.occurredAt).toLocaleString()}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      <strong style={{ color: 'var(--ds-color-text-primary)', display: 'block' }}>
                        {t.partnerTradeName ?? 'Doc Search HQ'}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                        {t.actorEmail ?? 'System Service'}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      <span style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '600' }}>{t.modelCode}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', display: 'block' }}>
                        v{t.modelVersion}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.safetyClassification === 'HIGH_CLINICAL_CONTEXT' ? 'danger' : 'neutral'}>
                        {t.safetyClassification}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.requestStatus === 'COMPLETED' ? 'success' : 'danger'}>
                        {t.requestStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.outcomeStatus === 'PASSED_SAFETY_GATE' ? 'success' : 'warning'}>
                        {t.outcomeStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          t.humanReviewStatus === 'APPROVED_BY_HUMAN'
                            ? 'success'
                            : t.humanReviewStatus === 'PENDING_CLINICAL_LEAD'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {t.humanReviewStatus}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                      {t.environment}
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
