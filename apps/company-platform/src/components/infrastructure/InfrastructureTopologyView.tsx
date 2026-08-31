import React, { useState } from 'react';
import type {
  InfrastructureRegionDto,
  InfrastructureClusterDto,
  InfrastructureNodeDto,
  InfrastructureServiceDto,
  InfrastructureDatabaseDto
} from '@docsearch/api-contracts';
import { Card, Badge, Select, Input } from '@docsearch/ui-kit';

export interface InfrastructureTopologyViewProps {
  regions: InfrastructureRegionDto[];
  clusters: InfrastructureClusterDto[];
  nodes: InfrastructureNodeDto[];
  services: InfrastructureServiceDto[];
  databases: InfrastructureDatabaseDto[];
}

export const InfrastructureTopologyView: React.FC<InfrastructureTopologyViewProps> = ({
  regions,
  clusters,
  nodes,
  services,
  databases
}) => {
  const [selectedRegionId, setSelectedRegionId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRegions = regions.filter((r) => selectedRegionId === 'ALL' || r.id === selectedRegionId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Topology Filter Bar */}
      <Card padding="md">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search topology by cluster, node, or service name..."
            style={{ flex: '1', minWidth: '240px' }}
          />
          <Select
            value={selectedRegionId}
            onChange={(e) => setSelectedRegionId(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Regions' },
              ...regions.map((r) => ({ value: r.id, label: `${r.regionName} (${r.regionCode})` }))
            ]}
          />
        </div>
      </Card>

      {/* Regional Topology Tree */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {filteredRegions.map((region) => {
          const regionClusters = clusters.filter((c) => c.regionId === region.id);

          return (
            <Card
              key={region.id}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🌐</span>
                  <span>{region.regionName}</span>
                  <Badge variant={region.isPrimary ? 'primary' : 'warning'}>
                    {region.isPrimary ? 'PRIMARY REGION' : 'DR STANDBY REGION'}
                  </Badge>
                  <Badge variant={region.status === 'ACTIVE' ? 'success' : 'neutral'}>{region.status}</Badge>
                </div>
              }
              subtitle={`${region.provider} • Geographic Placement: ${region.geographicReference}`}
              padding="lg"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {regionClusters.map((cluster) => {
                  const clusterNodes = nodes.filter((n) => n.clusterId === cluster.id);
                  const clusterServices = services.filter((s) => s.clusterId === cluster.id);
                  const regionDbs = databases.filter((db) => db.regionId === region.id);

                  return (
                    <div
                      key={cluster.id}
                      style={{
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid var(--ds-color-border)',
                        backgroundColor: 'var(--ds-color-surface)'
                      }}
                    >
                      {/* Cluster Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '1rem', color: 'var(--ds-color-text-primary)' }}>
                              {cluster.clusterName}
                            </strong>
                            <Badge variant="neutral">{cluster.orchestrationType}</Badge>
                            <Badge variant="neutral">{cluster.clusterType}</Badge>
                            <Badge variant={cluster.status === 'HEALTHY' ? 'success' : 'warning'}>
                              {cluster.status}
                            </Badge>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-color-text-muted)' }}>
                            {cluster.clusterCode} • Version: {cluster.versionReference} • Nodes: {clusterNodes.length}
                          </span>
                        </div>
                      </div>

                      {/* Cluster Hierarchy Grid */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                          gap: '12px',
                          marginTop: '12px'
                        }}
                      >
                        {/* Compute Nodes Box */}
                        <div
                          style={{
                            padding: '12px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--ds-color-surface-subtle)',
                            border: '1px solid var(--ds-color-border-subtle)'
                          }}
                        >
                          <strong style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px', color: 'var(--ds-color-text-primary)' }}>
                            🖥️ Compute Nodes ({clusterNodes.length})
                          </strong>
                          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                            {clusterNodes.map((n) => (
                              <li key={n.id} style={{ marginBottom: '4px' }}>
                                <strong style={{ color: 'var(--ds-color-text-primary)' }}>{n.nodeCode}</strong> ({n.instanceReference} - {n.cpuCapacity} / {n.memoryCapacity})
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Services Box */}
                        <div
                          style={{
                            padding: '12px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--ds-color-surface-subtle)',
                            border: '1px solid var(--ds-color-border-subtle)'
                          }}
                        >
                          <strong style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px', color: 'var(--ds-color-text-primary)' }}>
                            ⚙️ Container Services ({clusterServices.length})
                          </strong>
                          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                            {clusterServices.map((s) => (
                              <li key={s.id} style={{ marginBottom: '4px' }}>
                                <strong style={{ color: 'var(--ds-color-text-primary)' }}>{s.serviceName}</strong> ({s.versionReference} • {s.status})
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Databases Box */}
                        <div
                          style={{
                            padding: '12px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--ds-color-surface-subtle)',
                            border: '1px solid var(--ds-color-border-subtle)'
                          }}
                        >
                          <strong style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px', color: 'var(--ds-color-text-primary)' }}>
                            🗄️ Regional Databases ({regionDbs.length})
                          </strong>
                          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                            {regionDbs.map((db) => (
                              <li key={db.id} style={{ marginBottom: '4px' }}>
                                <strong style={{ color: 'var(--ds-color-text-primary)' }}>{db.databaseName}</strong> ({db.engineVersion} • {db.replicationMode})
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
