import React, { useState } from 'react';
import type { SecurityUserRoleDto } from '@docsearch/api-contracts';
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

export interface UserAccessViewProps {
  userRoles: SecurityUserRoleDto[];
}

export const UserAccessView: React.FC<UserAccessViewProps> = ({ userRoles }) => {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'PRIVILEGED' | 'STANDARD'>('ALL');

  const filtered = userRoles.filter((ur) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !ur.userEmail.toLowerCase().includes(q) &&
        !ur.roleCode.toLowerCase().includes(q) &&
        !ur.scopeReference.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (riskFilter === 'PRIVILEGED' && !ur.isHighRisk) return false;
    if (riskFilter === 'STANDARD' && ur.isHighRisk) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Search & Filters */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Search Users & Roles
            </label>
            <Input
              placeholder="Search by user email, role, or scope..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Privilege Level
            </label>
            <Select
              options={[
                { label: 'All Privilege Tiers', value: 'ALL' },
                { label: 'Privileged / High Risk Only', value: 'PRIVILEGED' },
                { label: 'Standard Users Only', value: 'STANDARD' }
              ]}
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as 'ALL' | 'PRIVILEGED' | 'STANDARD')}
            />
          </div>
        </div>
      </Card>

      {/* User Access Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Account</TableHead>
                <TableHead>Assigned Role</TableHead>
                <TableHead>Scope Boundary</TableHead>
                <TableHead>Privilege Tier</TableHead>
                <TableHead>Assigned At</TableHead>
                <TableHead>Expires At</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No user access assignments found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((ur) => (
                  <TableRow key={ur.id}>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{ur.userEmail}</strong>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                          {ur.roleCode}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                          {ur.roleName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.8125rem' }}>{ur.scopeReference}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', display: 'block' }}>
                        ({ur.scopeType})
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ur.isHighRisk ? 'danger' : 'neutral'}>
                        {ur.isHighRisk ? 'Privileged' : 'Standard'}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                      {new Date(ur.assignedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                      {ur.expiresAt ? new Date(ur.expiresAt).toLocaleDateString() : 'Permanent'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ur.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {ur.status}
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
