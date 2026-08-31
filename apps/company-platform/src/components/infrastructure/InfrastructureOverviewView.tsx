import React from 'react';
import type {
  InfrastructureOverviewDto,
  InfrastructureRegionDto,
  InfrastructureClusterDto,
  InfrastructureServiceDto,
  InfrastructureDatabaseDto,
  DisasterRecoveryPlanDto,
  InfrastructureIncidentDto
} from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  Alert,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface InfrastructureOverviewViewProps {
  overview: InfrastructureOverviewDto;
  regions: InfrastructureRegionDto[];
  clusters: InfrastructureClusterDto[];
  services: InfrastructureServiceDto[];
  databases: InfrastructureDatabaseDto[];
  drPlans: DisasterRecoveryPlanDto[];
  incidents: InfrastructureIncidentDto[];
}

export const InfrastructureOverviewView: React.FC<InfrastructureOverviewViewProps> = ({
  overview,
  regions,
  clusters,
  services: _services,
  databases,
  drPlans,
  incidents: _incidents
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner Disclaimers */}
      <Alert type="info" title="Live Telemetry — Live Telemetry">
        Infrastructure metrics, node capacities, and replication states shown below are development fixtures. <strong>Live infrastructure telemetry is not connected.</strong> Zero live cloud credentials or PHI data are handled.
      </Alert>

      {/* KPI Posture Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Multi-Region Topology
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              {overview.totalRegionsCount} Regions
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              1 Primary (us-east-1), 1 DR (us-west-2)
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Managed Clusters
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-primary)' }}>
              {overview.totalClustersCount} Clusters
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              {overview.totalNodesCount} Compute & Worker Nodes
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              DR Readiness Posture
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-success)' }}>
              Active (15m RTO)
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              Target RPO: 5m Continuous WAL
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Open Incidents & Alerts
            </span>
            <span
              style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                color: overview.openIncidentsCount > 0 ? 'var(--ds-color-danger)' : 'var(--ds-color-success)'
              }}
            >
              {overview.openIncidentsCount} Incidents
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              {overview.activeAlertsCount} Active Alerts
            </span>
          </div>
        </Card>
      </div>

      {/* Regional Topology Summary */}
      <Card
        title="Regional Infrastructure & Disaster Recovery Posture"
        subtitle="Primary and failover availability zones, cloud providers, and operational roles"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Region Code</TableHead>
                <TableHead>Region Name</TableHead>
                <TableHead>Cloud Provider</TableHead>
                <TableHead>Geographic Placement</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {reg.regionCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{reg.regionName}</strong>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{reg.provider}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {reg.geographicReference}
                  </TableCell>
                  <TableCell>
                    <Badge variant={reg.isPrimary ? 'primary' : 'warning'}>
                      {reg.isPrimary ? 'PRIMARY ACTIVE' : 'DISASTER RECOVERY STANDBY'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={reg.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {reg.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Cluster & Database Posture */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <Card title="EKS Cluster Inventory" subtitle="Active container orchestration clusters" padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cluster</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Nodes</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clusters.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <strong style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-primary)' }}>{c.clusterName}</strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-color-text-muted)' }}>
                        {c.clusterCode} • {c.versionReference}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {c.regionCode ?? 'us-east-1'}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>
                      {c.nodeCount} nodes
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'HEALTHY' ? 'success' : 'warning'}>
                        {c.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Card title="Database Infrastructure" subtitle="Managed PostgreSQL & Redis clusters" padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Database</TableHead>
                  <TableHead>Engine</TableHead>
                  <TableHead>Replication</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {databases.map((db) => (
                  <TableRow key={db.id}>
                    <TableCell>
                      <strong style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-primary)' }}>{db.databaseName}</strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-color-text-muted)' }}>
                        {db.databaseCode}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {db.engineVersion}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>
                      <Badge variant="neutral">{db.replicationMode}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={db.status === 'ONLINE' ? 'success' : 'warning'}>
                        {db.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </div>

      {/* DR Governance & Plans */}
      <Card
        title="Disaster Recovery Governance Plans"
        subtitle="RTO/RPO objectives, runbooks, and quarterly review compliance"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Code</TableHead>
                <TableHead>Plan Name</TableHead>
                <TableHead>RTO Target</TableHead>
                <TableHead>RPO Target</TableHead>
                <TableHead>Failover Strategy</TableHead>
                <TableHead>Next Review</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drPlans.map((p) => (
                <TableRow key={p.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {p.planCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{p.planName}</strong>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--ds-color-primary)' }}>
                    {p.rtoMinutes} minutes
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--ds-color-success)' }}>
                    {p.rpoMinutes} minutes
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{p.failoverStrategy}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    {new Date(p.nextReviewDue).toLocaleDateString()}
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
