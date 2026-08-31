import React from 'react';
import type { ApiRateLimitPolicyDto } from '@docsearch/api-contracts';
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

export interface ApiRateLimitViewProps {
  policies: ApiRateLimitPolicyDto[];
}

export const ApiRateLimitView: React.FC<ApiRateLimitViewProps> = ({
  policies
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="API Gateway Rate Limiting & Quotas">
        Gateway rate limiters protect against algorithmic abuse, brute-force token generation, and runaway batch synchronization jobs. Quotas operate at Platform, Partner, and Endpoint levels.
      </Alert>

      <Card
        title="Active API Gateway Rate Limiting & Traffic Shaping Policies"
        subtitle="Token bucket thresholds, burst tolerances, and HTTP 429 backpressure actions"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy Code & Name</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Scope Reference</TableHead>
                <TableHead>Rate Limit Threshold</TableHead>
                <TableHead>Burst Limit</TableHead>
                <TableHead>Throttle Action</TableHead>
                <TableHead>Lead Owner</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <code style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                        {p.policyCode}
                      </code>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{p.name}</strong>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="primary">{p.scopeType}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {p.scopeReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                    {p.limitValue.toLocaleString()} req / {p.period.toLowerCase()}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.875rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {p.burstLimit.toLocaleString()} req
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.action === 'BLOCK_429' ? 'danger' : 'warning'}>
                      {p.action}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {p.ownerEmail}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {p.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
