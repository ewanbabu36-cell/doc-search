import React from 'react';
import type { PatientDto } from '@docsearch/api-contracts';
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
import { maskAadhaarNumber, maskAbhaAddress } from '@docsearch/shared-core';

export interface PatientIdentifierCenterViewProps {
  patients: PatientDto[];
  onSelectPatient: (patientId: string) => void;
}

export const PatientIdentifierCenterView: React.FC<PatientIdentifierCenterViewProps> = ({
  patients,
  onSelectPatient
}) => {
  const allIdentifiers = patients.flatMap((p) =>
    p.identifiers.map((ident) => ({
      ...ident,
      patientName: p.fullName,
      mrn: p.mrn,
      patientStatus: p.status
    }))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
          Patient Identifier Registry
        </h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
          Consolidated registry of MRNs, National IDs, Driver Licenses, and Insurance Member references
        </span>
      </div>

      <Alert type="info" title="Privacy Protected Identifier Storage">
        Identifiers are indexed and scoped to tenant/organization boundaries. Government identity values are protected from unauthorized cross-tenant exposure.
      </Alert>

      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identifier Type</TableHead>
                <TableHead>Identifier Value</TableHead>
                <TableHead>Associated Patient & MRN</TableHead>
                <TableHead>Issuing Authority</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allIdentifiers.map((i) => (
                <TableRow
                  key={i.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectPatient(i.patientId)}
                >
                  <TableCell style={{ fontWeight: '600', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{i.identifierType}</span>
                      {(i.identifierType.includes('AADHAAR') || i.identifierType.includes('NATIONAL_ID') || i.identifierType.includes('ABHA')) && (
                        <span style={{ fontSize: '0.625rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid #10B981', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>
                          🔒 MASKED
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.8125rem' }}>
                    {i.identifierType.includes('AADHAAR') || i.identifierType.includes('NATIONAL_ID')
                      ? maskAadhaarNumber(i.identifierValue)
                      : i.identifierType.includes('ABHA')
                      ? maskAbhaAddress(i.identifierValue)
                      : i.identifierValue}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{i.patientName}</strong>
                    <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                      MRN: <code>{i.mrn}</code>
                    </span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {i.issuingAuthority ?? 'Healthcare Alliance'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={i.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {i.status}
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
