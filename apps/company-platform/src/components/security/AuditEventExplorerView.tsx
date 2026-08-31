import React, { useState } from 'react';
import {
  Card,
  Input,
  Select,
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

export interface AuditEventItem {
  id: string;
  timestamp: string;
  actorEmail: string;
  domain: string;
  action: string;
  resource: string;
  result: 'SUCCESS' | 'DENIED' | 'FAILED';
  reason: string;
  correlationId: string;
}

const mockAuditTrail: AuditEventItem[] = [
  {
    id: 'evt-20260829-001842',
    timestamp: '2026-08-29T12:00:00.000Z',
    actorEmail: 'executive.lead@docsearch.internal',
    domain: 'SECURITY',
    action: 'POLICY_TRANSITION',
    resource: 'POL-SEC-MFA-001',
    result: 'SUCCESS',
    reason: 'Enforced hardware security key MFA mandate across all admin scopes.',
    correlationId: 'corr-892f07c8-001'
  },
  {
    id: 'evt-20260829-001843',
    timestamp: '2026-08-29T12:15:00.000Z',
    actorEmail: 'cmo.safety@docsearch.internal',
    domain: 'AI_GOVERNANCE',
    action: 'PROMPT_APPROVAL',
    resource: 'TMPL-SUMMARIZE-DISCHARGE (v1.0.0)',
    result: 'SUCCESS',
    reason: 'Verified clinical anti-diagnosis safety boundaries for production release.',
    correlationId: 'corr-892f07c8-002'
  },
  {
    id: 'evt-20260829-001844',
    timestamp: '2026-08-29T13:10:00.000Z',
    actorEmail: 'unknown.intruder@external-probe.net',
    domain: 'API_GATEWAY',
    action: 'BULK_DATA_EXPORT_REQUEST',
    resource: 'company.analytics_reports',
    result: 'DENIED',
    reason: 'Blocked by POL-SEC-EXPORT-001 rate limiter; unauthorized external IP.',
    correlationId: 'corr-892f07c8-003'
  }
];

export const AuditEventExplorerView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [resultFilter, setResultFilter] = useState('ALL');

  const filtered = mockAuditTrail.filter((evt) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !evt.actorEmail.toLowerCase().includes(q) &&
        !evt.resource.toLowerCase().includes(q) &&
        !evt.reason.toLowerCase().includes(q) &&
        !evt.correlationId.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (domainFilter !== 'ALL' && evt.domain !== domainFilter) return false;
    if (resultFilter !== 'ALL' && evt.result !== resultFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Alert type="info" title="Authoritative Audit Source">
        All entries are sourced directly from the immutable <code>core.audit_events</code> PostgreSQL write stream. Audit history cannot be edited, overwritten, or deleted by any administrative role.
      </Alert>

      {/* Search & Filters */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Search Audit Stream
            </label>
            <Input
              placeholder="Search by actor, resource, reason, or correlation ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Domain
            </label>
            <Select
              options={[
                { label: 'All Domains', value: 'ALL' },
                { label: 'Security', value: 'SECURITY' },
                { label: 'AI Governance', value: 'AI_GOVERNANCE' },
                { label: 'API Gateway', value: 'API_GATEWAY' },
                { label: 'CRM', value: 'CRM' }
              ]}
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Result
            </label>
            <Select
              options={[
                { label: 'All Results', value: 'ALL' },
                { label: 'Success', value: 'SUCCESS' },
                { label: 'Denied / Blocked', value: 'DENIED' },
                { label: 'Failed', value: 'FAILED' }
              ]}
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor Account</TableHead>
                <TableHead>Domain & Action</TableHead>
                <TableHead>Target Resource</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Governance Rationale</TableHead>
                <TableHead>Correlation ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No audit records match search filter.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((evt) => (
                  <TableRow key={evt.id}>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(evt.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{evt.actorEmail}</strong>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
                          {evt.domain}
                        </span>
                        <code style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem', fontWeight: '600' }}>
                          {evt.action}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {evt.resource}
                    </TableCell>
                    <TableCell>
                      <Badge variant={evt.result === 'SUCCESS' ? 'success' : evt.result === 'DENIED' ? 'danger' : 'warning'}>
                        {evt.result}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', maxWidth: '300px' }}>
                      {evt.reason}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-color-text-muted)' }}>
                      {evt.correlationId}
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
