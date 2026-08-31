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

export interface ConsentCenterViewProps {
  patients: PatientDto[];
  onSelectPatient: (patientId: string) => void;
}

export const ConsentCenterView: React.FC<ConsentCenterViewProps> = ({
  patients,
  onSelectPatient
}) => {
  const allConsents = patients.flatMap((p) =>
    p.consents.map((c) => ({
      ...c,
      patientName: p.fullName,
      mrn: p.mrn
    }))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
          Patient Consent Directives & Authorizations
        </h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
          Legally binding patient consents for treatment, communications, telehealth encounters, and health data sharing
        </span>
      </div>

      <Alert type="info" title="Audited Consent Directives">
        Patient consent directives ensure HIPAA compliance and establish auditable records before executing treatment encounters or digital messaging.
      </Alert>

      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consent Directive Type</TableHead>
                <TableHead>Associated Patient & MRN</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>Recorded By</TableHead>
                <TableHead>Document Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allConsents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero consent directives recorded.
                  </TableCell>
                </TableRow>
              ) : (
                allConsents.map((c) => (
                  <TableRow
                    key={c.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectPatient(c.patientId)}
                  >
                    <TableCell style={{ fontWeight: '600', fontSize: '0.8125rem' }}>
                      {c.consentType}
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{c.patientName}</strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        MRN: <code>{c.mrn}</code>
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.consentStatus === 'GRANTED' ? 'success' : 'warning'}>
                        {c.consentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {new Date(c.effectiveDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>
                      {c.recordedBy}
                    </TableCell>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem' }}>
                      {c.auditReference ?? 'ELECTRONIC_SIGNATURE'}
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
