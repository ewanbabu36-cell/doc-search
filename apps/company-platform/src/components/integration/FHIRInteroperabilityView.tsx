import React from 'react';
import type {
  FHIRCapabilityDto,
  FHIRResourceConfigurationDto
} from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Alert
} from '@docsearch/ui-kit';

export interface FHIRInteroperabilityViewProps {
  capabilities: FHIRCapabilityDto[];
  resourceConfigs: FHIRResourceConfigurationDto[];
}

export const FHIRInteroperabilityView: React.FC<FHIRInteroperabilityViewProps> = ({
  capabilities,
  resourceConfigs
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="FHIR R4 US Core Interoperability Configuration">
        This is an interoperability gateway control plane, NOT a clinical record viewer. <strong>Zero patient records or clinical observations are stored or displayed within the Company Platform.</strong>
      </Alert>

      {/* FHIR Capabilities */}
      <Card
        title="FHIR R4 Capability Statements & Gateway Modes"
        subtitle="Conformance profiles, supported interaction paradigms, and US Core validation baselines"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Capability Reference</TableHead>
                <TableHead>FHIR Version</TableHead>
                <TableHead>Gateway Mode</TableHead>
                <TableHead>Interactions Supported</TableHead>
                <TableHead>Resource Types</TableHead>
                <TableHead>Last Verified</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {capabilities.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <code style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {c.capabilityReference}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="primary">{c.fhirVersion}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    <Badge variant="neutral">{c.capabilityMode}</Badge>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {c.readSupported && <Badge variant="success">Read</Badge>}
                      {c.searchSupported && <Badge variant="success">Search</Badge>}
                      {c.createSupported && <Badge variant="primary">Create</Badge>}
                      {c.updateSupported && <Badge variant="primary">Update</Badge>}
                      {c.batchSupported && <Badge variant="neutral">Batch</Badge>}
                    </div>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {c.resourceTypes.join(', ')}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                    {c.lastVerifiedAt ? new Date(c.lastVerifiedAt).toLocaleDateString() : 'Pending'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'ONLINE' ? 'success' : 'neutral'}>
                      {c.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Resource Configurations */}
      <Card
        title="Configured FHIR Resource Access & Validation Profiles"
        subtitle="Granular search, read, write, and export gates per FHIR resource definition"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>FHIR Resource</TableHead>
                <TableHead>Access Status</TableHead>
                <TableHead>Read</TableHead>
                <TableHead>Search</TableHead>
                <TableHead>Write</TableHead>
                <TableHead>Validation Standard</TableHead>
                <TableHead>Mapping Schema</TableHead>
                <TableHead>Governance Policy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resourceConfigs.map((rc) => (
                <TableRow key={rc.id}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{rc.resourceType}</strong>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        rc.status === 'ENABLED'
                          ? 'success'
                          : rc.status === 'READ_ONLY'
                          ? 'primary'
                          : 'neutral'
                      }
                    >
                      {rc.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rc.readEnabled ? 'success' : 'danger'}>
                      {rc.readEnabled ? 'Allowed' : 'Blocked'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rc.searchEnabled ? 'success' : 'danger'}>
                      {rc.searchEnabled ? 'Allowed' : 'Blocked'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rc.writeEnabled ? 'primary' : 'neutral'}>
                      {rc.writeEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {rc.validationMode}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {rc.mappingReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {rc.governancePolicyReference}
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
