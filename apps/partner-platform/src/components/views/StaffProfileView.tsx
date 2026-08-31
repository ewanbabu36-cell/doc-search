import React from 'react';
import type {
  OperationalStaffDto,
  StaffRoleAssignmentDto,
  StaffCredentialDto,
  StaffTransferDto,
  OperationalStaffAuditTraceDto
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
  TableCell
} from '@docsearch/ui-kit';

export interface StaffProfileViewProps {
  staff: OperationalStaffDto | null;
  roleAssignments: StaffRoleAssignmentDto[];
  credentials: StaffCredentialDto[];
  transfers: StaffTransferDto[];
  auditTraces: OperationalStaffAuditTraceDto[];
}

export const StaffProfileView: React.FC<StaffProfileViewProps> = ({
  staff,
  roleAssignments,
  credentials,
  transfers,
  auditTraces
}) => {
  if (!staff) {
    return (
      <Card padding="lg">
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--ds-color-text-muted)' }}>
          Please select a staff member from the Staff Directory or Overview to view their complete profile.
        </div>
      </Card>
    );
  }

  const staffRoles = roleAssignments.filter((r) => r.staffId === staff.id);
  const staffCreds = credentials.filter((c) => c.staffId === staff.id);
  const staffTransfers = transfers.filter((t) => t.staffId === staff.id);
  const staffAudits = auditTraces.filter((a) => a.staffId === staff.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Profile Card */}
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
                {staff.fullName}
              </h2>
              <Badge variant="neutral">{staff.staffType}</Badge>
              <Badge variant={staff.employmentStatus === 'ACTIVE' ? 'success' : staff.employmentStatus === 'ON_LEAVE' ? 'primary' : 'warning'}>
                {staff.employmentStatus}
              </Badge>
              <Badge variant={staff.credentialStatus === 'VERIFIED' ? 'success' : 'warning'}>
                Lic: {staff.credentialStatus}
              </Badge>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
              Staff Code: <code>{staff.staffCode}</code> · Role: <strong>{staff.primaryRole}</strong> (Data Scope: <code>{staff.activeRoleScope}</code>)
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)', display: 'block' }}>
              Contact
            </span>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--ds-color-text-primary)' }}>
              {staff.workEmail}
            </span>
            {staff.workPhone && (
              <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)', display: 'block' }}>
                {staff.workPhone}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Profile Overview Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <Card title="Organization & Department Scope" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.6875rem' }}>Assigned Organization</span>
              <strong>{staff.organizationName ?? 'Organization'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.6875rem' }}>Physical Facility Branch</span>
              <strong>{staff.branchName ?? 'Branch Facility'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.6875rem' }}>Department</span>
              <strong>{staff.departmentName ?? 'Clinical Department'}</strong>
            </div>
          </div>
        </Card>

        <Card title="Employment & Classification" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.6875rem' }}>Employment Type</span>
              <strong>{staff.employmentType}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.6875rem' }}>Joining Date</span>
              <strong>{new Date(staff.joiningDate).toLocaleDateString()}</strong>
            </div>
            {staff.professionalProfileRef && (
              <div>
                <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.6875rem' }}>Profile URI</span>
                <code style={{ fontSize: '0.75rem' }}>{staff.professionalProfileRef}</code>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Role & Scope Assignments Table */}
      <Card
        title="Assigned Roles & Data Scopes"
        subtitle="Role privileges and data scope isolation boundaries"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Code</TableHead>
                <TableHead>Data Scope</TableHead>
                <TableHead>Primary Role</TableHead>
                <TableHead>Effective From</TableHead>
                <TableHead>Assigned By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '16px' }}>
                    Zero role assignments found.
                  </TableCell>
                </TableRow>
              ) : (
                staffRoles.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell style={{ fontWeight: '600' }}>{r.roleCode}</TableCell>
                    <TableCell><Badge variant="primary">{r.dataScope}</Badge></TableCell>
                    <TableCell>{r.isPrimary ? <Badge variant="success">PRIMARY</Badge> : <Badge variant="neutral">SECONDARY</Badge>}</TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>{new Date(r.effectiveFrom).toLocaleDateString()}</TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>{r.assignedBy}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Professional Credentials Table */}
      <Card
        title="Professional Licenses & Credentials"
        subtitle="Audited state licenses, board certifications, and verification states"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Registration Number</TableHead>
                <TableHead>Issuing Board</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Verification Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffCreds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '16px' }}>
                    Zero credentials registered.
                  </TableCell>
                </TableRow>
              ) : (
                staffCreds.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell style={{ fontWeight: '600', fontSize: '0.8125rem' }}>{c.credentialType}</TableCell>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem' }}>{c.registrationNumber}</TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>{c.issuingAuthority}</TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>
                      {new Date(c.issueDate).toLocaleDateString()} — {new Date(c.expiryDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.verificationStatus === 'VERIFIED' ? 'success' : c.verificationStatus === 'PENDING' ? 'warning' : 'danger'}>
                        {c.verificationStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Transfers History */}
      {staffTransfers.length > 0 && (
        <Card title="Transfer & Relocation History" padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>From Location</TableHead>
                  <TableHead>To Location</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Authorized By & Justification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffTransfers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell><Badge variant="neutral">{t.transferType}</Badge></TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>{t.fromBranchName} · {t.fromDepartmentName}</TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>{t.toBranchName} · {t.toDepartmentName}</TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>{new Date(t.effectiveDate).toLocaleDateString()}</TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>
                      <strong>{t.authorizedBy}</strong>: {t.justification}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Staff Audit Log */}
      {staffAudits.length > 0 && (
        <Card title="Staff Audit Trace" padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trace ID</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Justification</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffAudits.map((a) => (
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
