import React from 'react';
import {
  Card,
  Button,
  Badge
} from '@docsearch/ui-kit';
import type {
  ProcurementExceptionDto
} from '@docsearch/api-contracts';

export interface ProcurementExceptionsViewProps {
  exceptions: ProcurementExceptionDto[];
  onOpenResolveException: (exc: ProcurementExceptionDto) => void;
}

export const ProcurementExceptionsView: React.FC<ProcurementExceptionsViewProps> = ({
  exceptions,
  onOpenResolveException
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
          Procurement & Billing Discrepancy Exceptions
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
          Price overcharges, quantity variances, quality inspection failures, and unauthorized billing items.
        </p>
      </div>

      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Exception #</th>
                <th style={{ padding: '0.75rem 1rem' }}>Type & Severity</th>
                <th style={{ padding: '0.75rem 1rem' }}>Vendor</th>
                <th style={{ padding: '0.75rem 1rem' }}>Description</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Variance</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map((exc) => (
                <tr key={exc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#dc2626' }}>
                    {exc.exceptionNumber}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div>{exc.exceptionType.replace(/_/g, ' ')}</div>
                    <Badge variant={exc.severity === 'CRITICAL' || exc.severity === 'HIGH' ? 'danger' : 'warning'}>
                      {exc.severity}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{exc.vendorName || 'N/A'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#475569' }}>
                    {exc.description}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                    ${exc.varianceAmount.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <Badge variant={exc.status === 'CLOSED' || exc.status === 'VENDOR_CREDITED' ? 'success' : 'danger'}>
                      {exc.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    {exc.status !== 'CLOSED' && exc.status !== 'VENDOR_CREDITED' && (
                      <Button variant="primary" size="sm" onClick={() => onOpenResolveException(exc)}>
                        Resolve
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
