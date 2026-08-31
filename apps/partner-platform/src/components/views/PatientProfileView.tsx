import React from 'react';
import type { PatientDto, PatientRegistrationAuditTraceDto } from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface PatientProfileViewProps {
  patient: PatientDto | null;
  auditTraces: PatientRegistrationAuditTraceDto[];
}

export const PatientProfileView: React.FC<PatientProfileViewProps> = ({ patient, auditTraces }) => {
  if (!patient) {
    return (
      <Card padding="lg">
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--ds-color-text-muted)' }}>
          Please select a patient from the Directory or Search workspace to view their Master Patient Index dossier.
        </div>
      </Card>
    );
  }

  const patientAudits = auditTraces.filter((a) => a.patientId === patient.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Dossier Card */}
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
                {patient.fullName}
              </h2>
              <Badge
                variant={
                  patient.status === 'ACTIVE'
                    ? 'success'
                    : patient.status === 'DUPLICATE_REVIEW'
                    ? 'warning'
                    : patient.status === 'MERGED'
                    ? 'neutral'
                    : 'danger'
                }
              >
                {patient.status}
              </Badge>
              <Badge variant="primary">{patient.mrn}</Badge>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
              DOB: <strong>{patient.dateOfBirth}</strong> · Gender: <strong>{patient.gender}</strong> · Blood: <strong>{patient.bloodGroup ?? 'Unknown'}</strong> · Code: <code>{patient.patientCode}</code>
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)', display: 'block' }}>
              Facility Registration Scope
            </span>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--ds-color-text-primary)' }}>
              {patient.organizationName ?? 'Apex Clinics'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)', display: 'block' }}>
              {patient.branchName ?? 'Downtown Care Center'}
            </span>
          </div>
        </div>
      </Card>

      {/* Grid: Demographics, Contacts, Addresses */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <Card title="Demographics & Identity" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.6875rem' }}>Full Legal Name</span>
              <strong>{patient.firstName} {patient.middleName ? `${patient.middleName} ` : ''}{patient.lastName}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.6875rem' }}>Preferred Language & Nationality</span>
              <strong>{patient.preferredLanguage} · {patient.nationality ?? 'American'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.6875rem' }}>Marital Status & Occupation</span>
              <strong>{patient.maritalStatus ?? 'Single'} · {patient.occupation ?? 'Not specified'}</strong>
            </div>
          </div>
        </Card>

        <Card title="Contact & Residential Address" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.6875rem' }}>Primary Mobile Phone</span>
              <strong>{patient.primaryContact?.primaryMobile ?? '—'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.6875rem' }}>Email Address</span>
              <strong>{patient.primaryContact?.email ?? 'None on file'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.6875rem' }}>Residential Address</span>
              <strong>
                {patient.primaryAddress
                  ? `${patient.primaryAddress.addressLine1}, ${patient.primaryAddress.city}, ${patient.primaryAddress.state} ${patient.primaryAddress.postalCode}`
                  : 'None on file'}
              </strong>
            </div>
          </div>
        </Card>
      </div>

      {/* Emergency Contacts & Identifiers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <Card title="Emergency Contacts" padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact Name</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Phone Number</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patient.emergencyContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '12px' }}>
                      No emergency contacts recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  patient.emergencyContacts.map((ec) => (
                    <TableRow key={ec.id}>
                      <TableCell style={{ fontWeight: '600', fontSize: '0.8125rem' }}>{ec.contactName}</TableCell>
                      <TableCell><Badge variant="neutral">{ec.relationship}</Badge></TableCell>
                      <TableCell style={{ fontSize: '0.8125rem' }}>{ec.primaryPhone}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Card title="Patient Identifiers Registry" padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identifier Type</TableHead>
                  <TableHead>Identifier Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patient.identifiers.map((ident) => (
                  <TableRow key={ident.id}>
                    <TableCell style={{ fontWeight: '600', fontSize: '0.8125rem' }}>{ident.identifierType}</TableCell>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.8125rem' }}>{ident.identifierValue}</TableCell>
                    <TableCell><Badge variant="success">{ident.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </div>

      {/* Consents & Insurance Policies */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <Card title="Patient Consent Directives" padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Consent Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recorded Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patient.consents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '12px' }}>
                      No consent directives recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  patient.consents.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>{c.consentType}</TableCell>
                      <TableCell><Badge variant="success">{c.consentStatus}</Badge></TableCell>
                      <TableCell style={{ fontSize: '0.75rem' }}>{new Date(c.effectiveDate).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Card title="Insurance & Third-Party Payer Policies" padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payer / Plan</TableHead>
                  <TableHead>Policy & Member ID</TableHead>
                  <TableHead>Eligibility</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patient.insurancePolicies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '12px' }}>
                      Self-Pay (No insurance policies attached).
                    </TableCell>
                  </TableRow>
                ) : (
                  patient.insurancePolicies.map((ins) => (
                    <TableRow key={ins.id}>
                      <TableCell style={{ fontSize: '0.8125rem' }}>
                        <strong>{ins.payerName}</strong>
                        <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                          {ins.planName}
                        </span>
                      </TableCell>
                      <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem' }}>
                        Pol: {ins.policyNumber}<br />Mem: {ins.memberId}
                      </TableCell>
                      <TableCell><Badge variant="success">{ins.eligibilityStatus}</Badge></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </div>

      {/* Patient Specific Audit Logs */}
      {patientAudits.length > 0 && (
        <Card title="Patient Registration & Modification History" padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trace ID</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Justification</TableHead>
                  <TableHead>Occurred At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patientAudits.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem' }}>{a.traceId}</TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>{a.action}</TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>{a.actorId} ({a.actorRole})</TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>{a.justification}</TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                      {new Date(a.occurredAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </div>
  );
};
