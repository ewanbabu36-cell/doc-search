import React, { useState } from 'react';
import type { SystemInsightDto } from '@docsearch/api-contracts';
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
  TableCell
} from '@docsearch/ui-kit';

export interface SystemInsightCenterViewProps {
  insights: SystemInsightDto[];
  onAcknowledge: (insightId: string, reason: string) => Promise<void>;
}

export const SystemInsightCenterView: React.FC<SystemInsightCenterViewProps> = ({
  insights,
  onAcknowledge
}) => {
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const handleAck = async (id: string) => {
    setSubmittingId(id);
    try {
      await onAcknowledge(id, 'Acknowledged by platform operations engineer.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to acknowledge alert');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <Card
      title="System Intelligence & Automated Architectural Insights"
      subtitle="Automated performance anomaly detectors, index optimization recommendations, and compliance warnings"
      padding="none"
    >
      <TableContainer style={{ border: 'none', borderRadius: '0' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Advisory Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Insight Narrative</TableHead>
              <TableHead>Recommended Action</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {insights.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                  No system intelligence insights detected.
                </TableCell>
              </TableRow>
            ) : (
              insights.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{i.title}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', display: 'block' }}>
                      Source: {i.sourceDomain}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{i.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        i.severity === 'ANOMALY_WARNING'
                          ? 'danger'
                          : i.severity === 'RECOMMENDATION'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {i.severity}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', maxWidth: '280px' }}>
                    {i.description}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-primary)', maxWidth: '240px' }}>
                    {i.recommendedAction}
                  </TableCell>
                  <TableCell>
                    <Badge variant={i.isAcknowledged ? 'success' : 'warning'}>
                      {i.isAcknowledged ? 'Acknowledged' : 'Pending Review'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {!i.isAcknowledged ? (
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={submittingId === i.id}
                        onClick={() => handleAck(i.id)}
                      >
                        Acknowledge
                      </Button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                        Reviewed
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
  );
};
