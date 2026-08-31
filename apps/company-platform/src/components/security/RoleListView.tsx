import React, { useState } from 'react';
import type { SecurityRoleDto, SecurityRoleType, SecurityScopeType } from '@docsearch/api-contracts';
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

export interface RoleListViewProps {
  roles: SecurityRoleDto[];
  onSelectRole: (roleId: string) => void;
}

export const RoleListView: React.FC<RoleListViewProps> = ({
  roles,
  onSelectRole
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<SecurityRoleType | 'ALL'>('ALL');
  const [scopeFilter, setScopeFilter] = useState<SecurityScopeType | 'ALL'>('ALL');

  const filtered = roles.filter((r) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !r.roleCode.toLowerCase().includes(q) &&
        !r.roleName.toLowerCase().includes(q) &&
        !r.description.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (typeFilter !== 'ALL' && r.roleType !== typeFilter) return false;
    if (scopeFilter !== 'ALL' && r.scopeType !== scopeFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Search & Filters */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Search Roles
            </label>
            <Input
              placeholder="Search by role code, name, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Role Type
            </label>
            <Select
              options={[
                { label: 'All Role Types', value: 'ALL' },
                { label: 'System', value: 'SYSTEM' },
                { label: 'Company', value: 'COMPANY' },
                { label: 'Custom', value: 'CUSTOM' },
                { label: 'Service', value: 'SERVICE' }
              ]}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as SecurityRoleType | 'ALL')}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Scope Level
            </label>
            <Select
              options={[
                { label: 'All Scopes', value: 'ALL' },
                { label: 'Platform', value: 'PLATFORM' },
                { label: 'Company', value: 'COMPANY' },
                { label: 'Branch', value: 'BRANCH' },
                { label: 'Partner', value: 'PARTNER' }
              ]}
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value as SecurityScopeType | 'ALL')}
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
                <TableHead>Role Code & Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Permission Count</TableHead>
                <TableHead>Assigned Users</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>System Role</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No security roles found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                          {r.roleCode}
                        </span>
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>{r.roleName}</strong>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{r.roleType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="primary">{r.scopeType}</Badge>
                    </TableCell>
                    <TableCell style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                      {r.permissionCount}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.875rem' }}>
                      {r.userCount} operators
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.isSystemRole ? 'primary' : 'neutral'}>
                        {r.isSystemRole ? 'Protected' : 'Custom'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => onSelectRole(r.id)}>
                        Inspect & Permissions
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
