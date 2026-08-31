import React from 'react';
import type { AIUsageQuotaDto } from '@docsearch/api-contracts';
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

export interface AIUsageQuotaViewProps {
  quotas: AIUsageQuotaDto[];
}

export const AIUsageQuotaView: React.FC<AIUsageQuotaViewProps> = ({ quotas }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="AI Consumption Telemetry Notice">
        <strong>Live AI usage telemetry is not connected (Live Telemetry — Live Telemetry).</strong> Quota thresholds defined below represent configured rate-limiting and token governance parameters enforced at the Fastify gateway layer.
      </Alert>

      <Card
        title="AI Usage Quotas & Boundary Allocations"
        subtitle="Operational token limits, maximum daily request allowances, and automated gateway throttle thresholds"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scope Type</TableHead>
                <TableHead>Scope Target / Reference</TableHead>
                <TableHead>Target Model</TableHead>
                <TableHead>Quota Resource Type</TableHead>
                <TableHead>Configured Limit</TableHead>
                <TableHead>Warning Threshold</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No AI usage quotas configured.
                  </TableCell>
                </TableRow>
              ) : (
                quotas.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell>
                      <Badge variant="neutral">{q.scopeType}</Badge>
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{q.scopeReference}</strong>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {q.modelCode ?? 'All Models in Scope'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="primary">{q.quotaType}</Badge>
                    </TableCell>
                    <TableCell style={{ fontWeight: '700', fontSize: '0.9375rem' }}>
                      {q.limitValue.toLocaleString()}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-warning)', fontWeight: '500' }}>
                      {q.warningThreshold.toLocaleString()}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>{q.period}</TableCell>
                    <TableCell>
                      <Badge variant={q.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {q.status}
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
