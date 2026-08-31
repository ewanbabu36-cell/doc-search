import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Badge
} from '@docsearch/ui-kit';
import type {
  InsuranceAuthorizationDto
} from '@docsearch/api-contracts';

export interface AuthorizationWorkbenchViewProps {
  authorizations: InsuranceAuthorizationDto[];
  onOpenCreateAuth: () => void;
  onSubmitAuth: (auth: InsuranceAuthorizationDto) => void;
  onApproveAuth: (auth: InsuranceAuthorizationDto) => void;
  onDenyAuth: (auth: InsuranceAuthorizationDto) => void;
}

export const AuthorizationWorkbenchView: React.FC<AuthorizationWorkbenchViewProps> = ({
  authorizations,
  onOpenCreateAuth,
  onSubmitAuth,
  onApproveAuth,
  onDenyAuth
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = authorizations.filter((a) =>
    a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.patientMrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.payerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.authorizationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.requestedServices.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Clinical Prior-Authorization Workbench
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Pre-authorization pipeline for inpatient admissions, planned surgical procedures, and advanced diagnostic imaging.
          </p>
        </div>
        <Button variant="primary" onClick={onOpenCreateAuth}>
          + Request Prior-Authorization
        </Button>
      </div>

      <Card style={{ padding: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
          Search Authorizations by Patient, Pre-Auth #, Service, or Payer
        </label>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="e.g. AUTH-TPA, Gastroscopy, Marcus Holloway"
        />
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
        {filtered.map((auth) => (
          <Card key={auth.id} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2563eb' }}>
                  {auth.authorizationNumber}
                </span>
                <Badge
                  variant={
                    auth.status === 'APPROVED'
                      ? 'success'
                      : auth.status === 'DENIED'
                      ? 'danger'
                      : auth.status === 'PENDING'
                      ? 'warning'
                      : 'primary'
                  }
                >
                  {auth.status}
                </Badge>
              </div>

              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 600, color: '#0f172a' }}>
                {auth.patientName}
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                {auth.patientMrn} • {auth.payerName} ({auth.policyNumber})
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', margin: '0.75rem 0' }}>
                <div><strong>Planned Service:</strong> {auth.requestedServices}</div>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.2rem' }}>
                  <strong>ICD-10:</strong> {auth.diagnosisContext}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.4rem' }}>
                  <span>Requested: <strong>${auth.requestedAmount.toFixed(2)}</strong></span>
                  <span style={{ color: '#16a34a' }}>Approved: <strong>${auth.approvedAmount.toFixed(2)}</strong></span>
                </div>
                {auth.payerRemarks && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem', fontStyle: 'italic' }}>
                    &ldquo;{auth.payerRemarks}&rdquo;
                  </div>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              {auth.status === 'REQUESTED' && (
                <Button variant="primary" size="sm" onClick={() => onSubmitAuth(auth)}>
                  Transmit to Payer
                </Button>
              )}
              {auth.status === 'PENDING' && (
                <>
                  <Button variant="danger" size="sm" onClick={() => onDenyAuth(auth)}>
                    Record Denial
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => onApproveAuth(auth)}>
                    Record Approval
                  </Button>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
