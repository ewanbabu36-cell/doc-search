import React, { useState } from 'react';
import type { GovernanceExceptionDto } from '@docsearch/api-contracts';
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
import { ExceptionReviewDialog } from './ExceptionReviewDialog.js';

export interface GovernanceExceptionViewProps {
  exceptions: GovernanceExceptionDto[];
  onReviewException: (
    exceptionId: string,
    decision: 'APPROVED' | 'REJECTED' | 'CLOSED',
    closureNotes: string,
    reason: string
  ) => Promise<void>;
}

export const GovernanceExceptionView: React.FC<GovernanceExceptionViewProps> = ({
  exceptions,
  onReviewException
}) => {
  const [selectedException, setSelectedException] = useState<GovernanceExceptionDto | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="warning" title="Governance Exceptions & Risk Register">
        Temporary exemptions from platform compliance baselines require formal operational justification, time-bounded expiration dates, and validated compensating controls.
      </Alert>

      <Card
        title="Active Governance Exceptions & Compensating Control Log"
        subtitle="Audited record of approved policy variances, compensating controls, and review decisions"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exception Code</TableHead>
                <TableHead>Title & Narrative</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Justification & Compensating Controls</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exceptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero governance exceptions recorded.
                  </TableCell>
                </TableRow>
              ) : (
                exceptions.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {e.exceptionCode}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', maxWidth: '240px' }}>
                      <strong style={{ color: 'var(--ds-color-text-primary)', display: 'block', marginBottom: '2px' }}>
                        {e.title}
                      </strong>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                        {e.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          e.riskLevel === 'CRITICAL'
                            ? 'danger'
                            : e.riskLevel === 'HIGH'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {e.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', maxWidth: '280px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)', fontWeight: '600' }}>
                            JUSTIFICATION:
                          </span>{' '}
                          {e.justification}
                        </div>
                        <div>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)', fontWeight: '600' }}>
                            COMPENSATING CONTROLS:
                          </span>{' '}
                          {e.compensatingControls}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {e.requestedByEmail}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                      {e.requestedExpirationDate ? new Date(e.requestedExpirationDate).toLocaleDateString() : 'Indefinite'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          e.status === 'APPROVED'
                            ? 'success'
                            : e.status === 'REQUESTED' || e.status === 'UNDER_REVIEW'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {e.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setSelectedException(e)}>
                        Review Decision
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {selectedException && (
        <ExceptionReviewDialog
          isOpen={Boolean(selectedException)}
          onClose={() => setSelectedException(null)}
          exception={selectedException}
          onReview={onReviewException}
        />
      )}
    </div>
  );
};
