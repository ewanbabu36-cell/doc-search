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

export interface InsuranceCenterViewProps {
  patients: PatientDto[];
  onSelectPatient: (patientId: string) => void;
}

export const InsuranceCenterView: React.FC<InsuranceCenterViewProps> = ({
  patients,
  onSelectPatient
}) => {
  const allPolicies = patients.flatMap((p) =>
    p.insurancePolicies.map((ins) => ({
      ...ins,
      patientName: p.fullName,
      mrn: p.mrn
    }))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
          Insurance & Third-Party Payer Policies
        </h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
          Payer coverages, policy contracts, member subscriber IDs, and TPA eligibility statuses
        </span>
      </div>

      <Alert type="info" title="Payer Foundation">
        Maintains insurance policy metadata for hospital billing and eligibility verification. Comprehensive claim submissions belong to Claims & Payer Management.
      </Alert>

      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insurance Payer & Plan</TableHead>
                <TableHead>Policy & Member ID</TableHead>
                <TableHead>Associated Patient & MRN</TableHead>
                <TableHead>TPA Administrator</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Eligibility</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPolicies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero third-party insurance policies attached to patient records.
                  </TableCell>
                </TableRow>
              ) : (
                allPolicies.map((ins) => (
                  <TableRow
                    key={ins.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectPatient(ins.patientId)}
                  >
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{ins.payerName}</strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        {ins.planName}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.8125rem' }}>
                      Pol: <strong>{ins.policyNumber}</strong><br />
                      Mem: {ins.memberId}
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{ins.patientName}</strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        MRN: <code>{ins.mrn}</code>
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>
                      {ins.tpaName ?? 'Direct Payer Interface'}
                    </TableCell>
                    <TableCell><Badge variant="neutral">{ins.coverageType}</Badge></TableCell>
                    <TableCell><Badge variant="success">{ins.eligibilityStatus}</Badge></TableCell>
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
