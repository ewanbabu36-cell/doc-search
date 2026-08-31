import React, { useState } from 'react';
import type { DependencyNodeDto, DependencyEdgeDto } from '@docsearch/api-contracts';
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface DependencyGraphViewProps {
  nodes: DependencyNodeDto[];
  edges: DependencyEdgeDto[];
  onSelectNode: (nodeId: string) => void;
}

export const DependencyGraphView: React.FC<DependencyGraphViewProps> = ({
  nodes,
  edges,
  onSelectNode
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filteredNodes = nodes.filter((n) => {
    const matchesSearch =
      n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.nodeCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || n.nodeType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Monorepo Hierarchy Card */}
      <Card title="Turborepo Monorepo Architecture Graph" padding="md">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            fontSize: '0.8125rem'
          }}
        >
          <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'var(--ds-color-surface-subtle)', border: '1px solid var(--ds-color-border-subtle)' }}>
            <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--ds-color-text-primary)' }}>
              Top-Level Applications (Leafs)
            </strong>
            <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--ds-color-text-secondary)' }}>
              <li><code>apps/company-platform</code> (React + Vite)</li>
              <li><code>apps/api-gateway</code> (Fastify 4 Gateway)</li>
              <li><code>apps/partner-platform</code> (React + Vite)</li>
            </ul>
          </div>

          <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'var(--ds-color-surface-subtle)', border: '1px solid var(--ds-color-border-subtle)' }}>
            <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--ds-color-text-primary)' }}>
              Core Workspace Packages
            </strong>
            <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--ds-color-text-secondary)' }}>
              <li><code>@docsearch/ui-kit</code> (Design System)</li>
              <li><code>@docsearch/auth</code> (RBAC & Permissions)</li>
              <li><code>@docsearch/database</code> (Drizzle ORM)</li>
              <li><code>@docsearch/api-contracts</code> (Zod Schemas)</li>
            </ul>
          </div>

          <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'var(--ds-color-surface-subtle)', border: '1px solid var(--ds-color-border-subtle)' }}>
            <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--ds-color-text-primary)' }}>
              Foundation Primitives (Root)
            </strong>
            <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--ds-color-text-secondary)' }}>
              <li><code>@docsearch/shared-core</code> (Zero-dependency base)</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Filter Bar */}
      <Card padding="md">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search dependency nodes by name or code..."
            style={{ flex: '1', minWidth: '240px' }}
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Node Types' },
              { value: 'APPLICATION', label: 'Applications' },
              { value: 'WORKSPACE_PACKAGE', label: 'Workspace Packages' },
              { value: 'EXTERNAL_NPM_PACKAGE', label: 'External NPM Packages' }
            ]}
          />
        </div>
      </Card>

      {/* Nodes Table */}
      <Card
        title="Workspace Dependency Nodes"
        subtitle="Graph vertices and internal linking configurations"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Node Code</TableHead>
                <TableHead>Module / Package Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Outgoing Dependencies</TableHead>
                <TableHead>Inward Consumers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNodes.map((n) => {
                const outCount = edges.filter((e) => e.sourceNodeId === n.id).length;
                const inCount = edges.filter((e) => e.targetNodeId === n.id).length;

                return (
                  <TableRow key={n.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {n.nodeCode}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => onSelectNode(n.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--ds-color-primary)',
                          fontWeight: '600',
                          cursor: 'pointer',
                          textAlign: 'left',
                          padding: 0,
                          fontSize: '0.8125rem'
                        }}
                      >
                        {n.name}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{n.nodeType}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {n.version}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {outCount} packages
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {inCount} consumers
                    </TableCell>
                    <TableCell>
                      <Badge variant={n.status === 'HEALTHY' ? 'success' : 'warning'}>
                        {n.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectNode(n.id)}
                      >
                        Inspect Node
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
