import React, { useState } from 'react';
import type {
  IntegrationProviderDto,
  IntegrationType,
  IntegrationProtocol
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

export interface IntegrationProviderListViewProps {
  providers: IntegrationProviderDto[];
  onSelectProvider: (providerId: string) => void;
}

export const IntegrationProviderListView: React.FC<IntegrationProviderListViewProps> = ({
  providers,
  onSelectProvider
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<IntegrationType | 'ALL'>('ALL');
  const [protocolFilter, setProtocolFilter] = useState<IntegrationProtocol | 'ALL'>('ALL');

  const filtered = providers.filter((p) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !p.providerCode.toLowerCase().includes(q) &&
        !p.providerName.toLowerCase().includes(q) &&
        !p.description.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (typeFilter !== 'ALL' && p.integrationType !== typeFilter) return false;
    if (protocolFilter !== 'ALL' && p.protocol !== protocolFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Search & Filters */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Search Providers
            </label>
            <Input
              placeholder="Search by code, provider name, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Integration Type
            </label>
            <Select
              options={[
                { label: 'All Types', value: 'ALL' },
                { label: 'EHR / EMR System', value: 'EHR_EMR' },
                { label: 'Lab System', value: 'LAB_SYSTEM' },
                { label: 'Billing Clearinghouse', value: 'BILLING_CLEARINGHOUSE' },
                { label: 'Notification Gateway', value: 'NOTIFICATION_GATEWAY' },
                { label: 'Custom REST API', value: 'CUSTOM_REST_API' }
              ]}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as IntegrationType | 'ALL')}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Protocol
            </label>
            <Select
              options={[
                { label: 'All Protocols', value: 'ALL' },
                { label: 'FHIR R4', value: 'FHIR_R4' },
                { label: 'HL7 v2.x', value: 'HL7_V2' },
                { label: 'REST JSON', value: 'REST_JSON' },
                { label: 'Webhook', value: 'WEBHOOK' }
              ]}
              value={protocolFilter}
              onChange={(e) => setProtocolFilter(e.target.value as IntegrationProtocol | 'ALL')}
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
                <TableHead>Provider Code & Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Protocol</TableHead>
                <TableHead>Endpoints</TableHead>
                <TableHead>Active Connections</TableHead>
                <TableHead>Lead Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No integration providers match criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <code style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                          {p.providerCode}
                        </code>
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>{p.providerName}</strong>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="primary">{p.integrationType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{p.protocol}</Badge>
                    </TableCell>
                    <TableCell style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                      {p.endpointsCount}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--ds-color-success)', fontWeight: '700' }}>
                        {p.activeConnectionsCount}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {p.ownerEmail}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => onSelectProvider(p.id)}>
                        Inspect Provider
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
