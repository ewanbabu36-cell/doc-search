import React, { useState } from 'react';
import type {
  AIModelDto,
  AIModelLifecycleStatus,
  AIModelDeploymentStatus,
  AIRiskClassification
} from '@docsearch/api-contracts';
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

export interface AIModelRegistryViewProps {
  models: AIModelDto[];
  onSelectModel: (modelId: string) => void;
}

export const AIModelRegistryView: React.FC<AIModelRegistryViewProps> = ({
  models,
  onSelectModel
}) => {
  const [search, setSearch] = useState('');
  const [lifecycleFilter, setLifecycleFilter] = useState<AIModelLifecycleStatus | 'ALL'>('ALL');
  const [deploymentFilter, setDeploymentFilter] = useState<AIModelDeploymentStatus | 'ALL'>('ALL');
  const [riskFilter, setRiskFilter] = useState<AIRiskClassification | 'ALL'>('ALL');

  const filtered = models.filter((m) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !m.modelCode.toLowerCase().includes(q) &&
        !m.modelName.toLowerCase().includes(q) &&
        !m.provider.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (lifecycleFilter !== 'ALL' && m.lifecycleStatus !== lifecycleFilter) return false;
    if (deploymentFilter !== 'ALL' && m.deploymentStatus !== deploymentFilter) return false;
    if (riskFilter !== 'ALL' && m.riskClassification !== riskFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Search & Filters */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Search Models
            </label>
            <Input
              placeholder="Search by model code, name, or provider..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Lifecycle Status
            </label>
            <Select
              options={[
                { label: 'All Lifecycles', value: 'ALL' },
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Draft', value: 'DRAFT' },
                { label: 'Deprecated', value: 'DEPRECATED' },
                { label: 'Retired', value: 'RETIRED' }
              ]}
              value={lifecycleFilter}
              onChange={(e) => setLifecycleFilter(e.target.value as AIModelLifecycleStatus | 'ALL')}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Deployment Tier
            </label>
            <Select
              options={[
                { label: 'All Deployments', value: 'ALL' },
                { label: 'Production', value: 'PRODUCTION' },
                { label: 'Staging', value: 'STAGING' },
                { label: 'Sandbox', value: 'SANDBOX' },
                { label: 'Not Deployed', value: 'NOT_DEPLOYED' }
              ]}
              value={deploymentFilter}
              onChange={(e) => setDeploymentFilter(e.target.value as AIModelDeploymentStatus | 'ALL')}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Risk Tier
            </label>
            <Select
              options={[
                { label: 'All Risk Tiers', value: 'ALL' },
                { label: 'Low Administrative', value: 'LOW_ADMINISTRATIVE' },
                { label: 'Moderate Operational', value: 'MODERATE_OPERATIONAL' },
                { label: 'High Clinical Context', value: 'HIGH_CLINICAL_CONTEXT' }
              ]}
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as AIRiskClassification | 'ALL')}
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
                <TableHead>Model Identifier</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Capability</TableHead>
                <TableHead>Risk Classification</TableHead>
                <TableHead>Deployment</TableHead>
                <TableHead>Production Ready</TableHead>
                <TableHead>Clinical Context</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No AI models match the search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.8125rem' }}>
                          {m.modelCode}
                        </span>
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>{m.modelName}</strong>
                      </div>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>{m.provider}</TableCell>
                    <TableCell>
                      <Badge variant="neutral">{m.capabilityClassification}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.riskClassification === 'HIGH_CLINICAL_CONTEXT' ? 'danger' : 'neutral'}>
                        {m.riskClassification}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.deploymentStatus === 'PRODUCTION' ? 'primary' : 'neutral'}>
                        {m.deploymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.approvedForProduction ? 'success' : 'neutral'}>
                        {m.approvedForProduction ? 'Approved' : 'Restricted'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.approvedForClinicalContext ? 'warning' : 'neutral'}>
                        {m.approvedForClinicalContext ? 'Assistive Only' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => onSelectModel(m.id)}>
                        Inspect
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
