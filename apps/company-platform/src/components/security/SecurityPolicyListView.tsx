import React, { useState } from 'react';
import type { SecurityPolicyDto, SecurityPolicyType, SecurityPolicySeverity } from '@docsearch/api-contracts';
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

export interface SecurityPolicyListViewProps {
  policies: SecurityPolicyDto[];
  onSelectPolicy: (policyId: string) => void;
}

export const SecurityPolicyListView: React.FC<SecurityPolicyListViewProps> = ({
  policies,
  onSelectPolicy
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<SecurityPolicyType | 'ALL'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<SecurityPolicySeverity | 'ALL'>('ALL');

  const filtered = policies.filter((p) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !p.policyCode.toLowerCase().includes(q) &&
        !p.name.toLowerCase().includes(q) &&
        !p.description.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (typeFilter !== 'ALL' && p.policyType !== typeFilter) return false;
    if (severityFilter !== 'ALL' && p.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Search & Filters */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Search Policies
            </label>
            <Input
              placeholder="Search by code, name, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Policy Type
            </label>
            <Select
              options={[
                { label: 'All Types', value: 'ALL' },
                { label: 'Access Control', value: 'ACCESS_CONTROL' },
                { label: 'Password / MFA', value: 'PASSWORD_SECURITY' },
                { label: 'Session Security', value: 'SESSION_SECURITY' },
                { label: 'API Security', value: 'API_SECURITY' },
                { label: 'Break Glass Access', value: 'BREAK_GLASS_ACCESS' }
              ]}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as SecurityPolicyType | 'ALL')}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Severity Level
            </label>
            <Select
              options={[
                { label: 'All Severities', value: 'ALL' },
                { label: 'Critical', value: 'CRITICAL' },
                { label: 'High', value: 'HIGH' },
                { label: 'Medium', value: 'MEDIUM' },
                { label: 'Low', value: 'LOW' }
              ]}
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as SecurityPolicySeverity | 'ALL')}
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
                <TableHead>Policy Code & Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Enforcement Mode</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No security policies found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                          {p.policyCode}
                        </span>
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>{p.name}</strong>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{p.policyType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.severity === 'CRITICAL' ? 'danger' : p.severity === 'HIGH' ? 'warning' : 'neutral'}>
                        {p.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.enforcementMode === 'BLOCKING' ? 'danger' : 'primary'}>
                        {p.enforcementMode}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', fontFamily: 'var(--ds-font-mono)' }}>
                      v{p.version}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                      {p.effectiveDate ? new Date(p.effectiveDate).toLocaleDateString() : 'Immediate'}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => onSelectPolicy(p.id)}>
                        Inspect & Rules
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
