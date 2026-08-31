import React, { useState } from 'react';
import type { ApiRouteDto, ApiRouteStatus } from '@docsearch/api-contracts';
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
  TableCell
} from '@docsearch/ui-kit';

export interface ApiRouteRegistryViewProps {
  routes: ApiRouteDto[];
  onSelectRoute: (routeId: string) => void;
}

export const ApiRouteRegistryView: React.FC<ApiRouteRegistryViewProps> = ({
  routes,
  onSelectRoute
}) => {
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<ApiRouteStatus | 'ALL'>('ALL');

  const uniqueDomains = Array.from(new Set(routes.map((r) => r.domain)));

  const filtered = routes.filter((r) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !r.routeCode.toLowerCase().includes(q) &&
        !r.pathPattern.toLowerCase().includes(q) &&
        !r.serviceName.toLowerCase().includes(q) &&
        !r.description.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (domainFilter !== 'ALL' && r.domain !== domainFilter) return false;
    if (methodFilter !== 'ALL' && r.method !== methodFilter) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Search & Filters */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Search Routes
            </label>
            <Input
              placeholder="Search by path, code, or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              HTTP Method
            </label>
            <Select
              options={[
                { label: 'All Methods', value: 'ALL' },
                { label: 'GET', value: 'GET' },
                { label: 'POST', value: 'POST' },
                { label: 'PUT', value: 'PUT' },
                { label: 'PATCH', value: 'PATCH' },
                { label: 'DELETE', value: 'DELETE' }
              ]}
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Domain
            </label>
            <Select
              options={[
                { label: 'All Domains', value: 'ALL' },
                ...uniqueDomains.map((d) => ({ label: d, value: d }))
              ]}
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Route Status
            </label>
            <Select
              options={[
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Deprecated', value: 'DEPRECATED' },
                { label: 'Sunset', value: 'SUNSET' },
                { label: 'Experimental', value: 'EXPERIMENTAL' }
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ApiRouteStatus | 'ALL')}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method & Path Pattern</TableHead>
                <TableHead>Service & Domain</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Auth Required</TableHead>
                <TableHead>Required Permission</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No API routes match filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge variant={r.method === 'GET' ? 'primary' : r.method === 'POST' ? 'success' : 'warning'}>
                          {r.method}
                        </Badge>
                        <code style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.8125rem' }}>
                          {r.pathPattern}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-primary)' }}>
                          {r.serviceName}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                          {r.domain}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {r.version}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.authenticationRequired ? 'primary' : 'neutral'}>
                        {r.authenticationRequired ? 'JWT' : 'Public'}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {r.requiredPermission ?? 'None'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{r.environment}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => onSelectRoute(r.id)}>
                        Inspect Route
                      </Button>
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
