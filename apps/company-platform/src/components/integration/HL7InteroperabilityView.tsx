import React from 'react';
import type { HL7EndpointDto } from '@docsearch/api-contracts';
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

export interface HL7InteroperabilityViewProps {
  hl7Endpoints: HL7EndpointDto[];
}

export const HL7InteroperabilityView: React.FC<HL7InteroperabilityViewProps> = ({
  hl7Endpoints
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Zero-PHI HL7 v2 Control Plane">
        Doc Search manages HL7 v2 interface engine routing topologies, acknowledgement protocols, and facility mappings. <strong>Payload content is excluded from Company Platform control-plane storage.</strong>
      </Alert>

      <Card
        title="Active HL7 v2 Interface Endpoints & MLLP Adapters"
        subtitle="Inbound ADT, ORM, and ORU feeds mapped from connected healthcare provider facilities"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>HL7 Endpoint Code</TableHead>
                <TableHead>Connection</TableHead>
                <TableHead>HL7 Standard</TableHead>
                <TableHead>Configured Message Types</TableHead>
                <TableHead>Transport Protocol</TableHead>
                <TableHead>ACK Mode</TableHead>
                <TableHead>Facility Reference</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hl7Endpoints.map((ep) => (
                <TableRow key={ep.id}>
                  <TableCell>
                    <code style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {ep.endpointCode}
                    </code>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {ep.connectionCode ?? 'Primary Gateway Connection'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="primary">{ep.hl7Version}</Badge>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {ep.messageTypes.map((mt, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.6875rem',
                            fontFamily: 'var(--ds-font-mono)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--ds-color-surface-subtle)',
                            border: '1px solid var(--ds-color-border-subtle)'
                          }}
                        >
                          {mt}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    <code>{ep.transportProtocol}</code>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {ep.acknowledgementMode}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {ep.facilityReference}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ep.status === 'ONLINE' ? 'success' : 'neutral'}>
                      {ep.status}
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
