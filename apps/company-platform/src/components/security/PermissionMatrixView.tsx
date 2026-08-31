import React, { useState } from 'react';
import type {
  SecurityPermissionDto,
  SecurityRoleDto,
  SecurityRolePermissionDto
} from '@docsearch/api-contracts';
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
  TableCell
} from '@docsearch/ui-kit';

export interface PermissionMatrixViewProps {
  permissions: SecurityPermissionDto[];
  roles: SecurityRoleDto[];
  rolePermissions: SecurityRolePermissionDto[];
}

export const PermissionMatrixView: React.FC<PermissionMatrixViewProps> = ({
  permissions,
  roles,
  rolePermissions
}) => {
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('ALL');

  const uniqueDomains = Array.from(new Set(permissions.map((p) => p.domain)));

  const filtered = permissions.filter((p) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !p.permissionCode.toLowerCase().includes(q) &&
        !p.permissionName.toLowerCase().includes(q) &&
        !p.resource.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (domainFilter !== 'ALL' && p.domain !== domainFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Search & Filters */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Search Permissions
            </label>
            <Input
              placeholder="Search by code, name, or resource..."
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
                ...uniqueDomains.map((d) => ({ label: d, value: d }))
              ]}
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Permission Matrix Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain & Resource</TableHead>
                <TableHead>Permission Code & Name</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Risk Classification</TableHead>
                <TableHead>Granted Roles</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No permissions match filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => {
                  const assignedRoles = rolePermissions
                    .filter((rp) => rp.permissionId === p.id)
                    .map((rp) => {
                      const r = roles.find((role) => role.id === rp.roleId);
                      return r ? r.roleCode : rp.roleId;
                    });

                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {p.domain}
                          </span>
                          <strong style={{ color: 'var(--ds-color-text-primary)' }}>{p.resource}</strong>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <code style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.8125rem' }}>
                            {p.permissionCode}
                          </code>
                          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                            {p.permissionName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="primary">{p.action}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.riskLevel === 'CRITICAL'
                              ? 'danger'
                              : p.riskLevel === 'HIGH'
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {p.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {assignedRoles.length === 0 ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                              Unassigned
                            </span>
                          ) : (
                            assignedRoles.map((rc, idx) => (
                              <Badge key={idx} variant="neutral">
                                {rc}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.status === 'ACTIVE' ? 'success' : 'neutral'}>
                          {p.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
