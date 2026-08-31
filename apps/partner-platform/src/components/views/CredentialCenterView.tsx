import React, { useState } from 'react';
import type {
  StaffCredentialDto,
  VerifyStaffCredentialRequest
} from '@docsearch/api-contracts';
import {
  Card,
  Button,
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
import { VerifyCredentialDialog } from '../dialogs/VerifyCredentialDialog.js';

export interface CredentialCenterViewProps {
  credentials: StaffCredentialDto[];
  actorId: string;
  actorRole: string;
  onVerifyCredential: (req: VerifyStaffCredentialRequest) => Promise<void>;
}

export const CredentialCenterView: React.FC<CredentialCenterViewProps> = ({
  credentials,
  actorId,
  actorRole,
  onVerifyCredential
}) => {
  const [selectedCred, setSelectedCred] = useState<StaffCredentialDto | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Professional Licensing & Credentialing Vault">
        Medical licenses, board certifications, nursing registrations, and clinical certificates undergo primary source verification before staff are authorized for independent patient encounters and prescriptions.
      </Alert>

      <Card
        title="Staff Credential Registry & Verification"
        subtitle="Licensing registration records, validity dates, and primary source verification states"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Credential Type</TableHead>
                <TableHead>Registration / License Ref</TableHead>
                <TableHead>Issuing Board</TableHead>
                <TableHead>Validity Period</TableHead>
                <TableHead>Verification Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credentials.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>
                      {c.staffName ?? 'Staff Member'}
                    </strong>
                  </TableCell>
                  <TableCell style={{ fontWeight: '600', fontSize: '0.8125rem' }}>
                    {c.credentialType}
                  </TableCell>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem' }}>
                    {c.registrationNumber}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {c.issuingAuthority}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    {new Date(c.issueDate).toLocaleDateString()} — {new Date(c.expiryDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.verificationStatus === 'VERIFIED' ? 'success' : c.verificationStatus === 'PENDING' ? 'warning' : 'danger'}>
                      {c.verificationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => setSelectedCred(c)}>
                      Verify
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {selectedCred && (
        <VerifyCredentialDialog
          isOpen={Boolean(selectedCred)}
          onClose={() => setSelectedCred(null)}
          credential={selectedCred}
          actorId={actorId}
          actorRole={actorRole}
          onVerifyCredential={onVerifyCredential}
        />
      )}
    </div>
  );
};
