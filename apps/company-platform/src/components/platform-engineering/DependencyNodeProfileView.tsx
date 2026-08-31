import React from 'react';
import type { DependencyNodeDto, DependencyEdgeDto } from '@docsearch/api-contracts';
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
  TableCell
} from '@docsearch/ui-kit';

export interface DependencyNodeProfileViewProps {
  node: DependencyNodeDto;
  incomingEdges: DependencyEdgeDto[];
  outgoingEdges: DependencyEdgeDto[];
  onBack: () => void;
}

export const DependencyNodeProfileView: React.FC<DependencyNodeProfileViewProps> = ({
  node,
  incomingEdges,
  outgoingEdges,
  onBack
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Button variant="outline" size="sm" onClick={onBack}>
              ← Back to Graph
            </Button>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              {node.name}
            </h1>
            <Badge variant="primary">{node.nodeType}</Badge>
            <Badge variant={node.status === 'HEALTHY' ? 'success' : 'warning'}>{node.status}</Badge>
          </div>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-color-text-muted)' }}>
            Code: {node.nodeCode} • Version: {node.version}
          </span>
        </div>
      </div>

      {/* Outgoing Dependencies */}
      <Card
        title="Direct Dependencies (Outgoing)"
        subtitle={`Packages and modules required by ${node.name}`}
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Target Module</TableHead>
                <TableHead>Dependency Type</TableHead>
                <TableHead>Version Constraint</TableHead>
                <TableHead>Dev Dependency</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outgoingEdges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero direct outgoing dependencies.
                  </TableCell>
                </TableRow>
              ) : (
                outgoingEdges.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell style={{ fontWeight: '600', color: 'var(--ds-color-text-primary)' }}>
                      {e.targetNodeName ?? 'Target Node'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{e.dependencyType}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {e.versionConstraint}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {e.isDevDependency ? 'Yes' : 'No'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={e.status === 'SATISFIED' ? 'success' : 'warning'}>
                        {e.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Incoming Dependents */}
      <Card
        title="Inward Dependents (Consumers)"
        subtitle={`Applications and packages that import ${node.name}`}
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consumer Module</TableHead>
                <TableHead>Dependency Type</TableHead>
                <TableHead>Constraint</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomingEdges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero inward consumers (top-level application or standalone library).
                  </TableCell>
                </TableRow>
              ) : (
                incomingEdges.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell style={{ fontWeight: '600', color: 'var(--ds-color-text-primary)' }}>
                      {e.sourceNodeName ?? 'Source Node'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{e.dependencyType}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {e.versionConstraint}
                    </TableCell>
                    <TableCell>
                      <Badge variant={e.status === 'SATISFIED' ? 'success' : 'warning'}>
                        {e.status}
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
