import React, { useState } from 'react';
import type {
  PatientDto,
  CreatePatientRequest,
  UpdatePatientRequest,
  AddPatientIdentifierRequest,
  AddEmergencyContactRequest,
  AddPatientConsentRequest,
  AddPatientInsuranceRequest
} from '@docsearch/api-contracts';
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';
import { CreatePatientDialog } from '../dialogs/CreatePatientDialog.js';
import { EditPatientDialog } from '../dialogs/EditPatientDialog.js';
import { AddIdentifierDialog } from '../dialogs/AddIdentifierDialog.js';
import { AddEmergencyContactDialog } from '../dialogs/AddEmergencyContactDialog.js';
import { AddConsentDialog } from '../dialogs/AddConsentDialog.js';
import { AddInsuranceDialog } from '../dialogs/AddInsuranceDialog.js';

export interface PatientDirectoryViewProps {
  patients: PatientDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  actorId: string;
  actorRole: string;
  onSelectPatient: (patientId: string) => void;
  onCreatePatient: (req: CreatePatientRequest) => Promise<void>;
  onUpdatePatient: (req: UpdatePatientRequest) => Promise<void>;
  onAddIdentifier: (req: AddPatientIdentifierRequest) => Promise<void>;
  onAddEmergencyContact: (req: AddEmergencyContactRequest) => Promise<void>;
  onAddConsent: (req: AddPatientConsentRequest) => Promise<void>;
  onAddInsurance: (req: AddPatientInsuranceRequest) => Promise<void>;
}

export const PatientDirectoryView: React.FC<PatientDirectoryViewProps> = ({
  patients,
  tenantId,
  partnerId,
  organizationId,
  branchId,
  actorId,
  actorRole,
  onSelectPatient,
  onCreatePatient,
  onUpdatePatient,
  onAddIdentifier,
  onAddEmergencyContact,
  onAddConsent,
  onAddInsurance
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<PatientDto | null>(null);
  const [identPatient, setIdentPatient] = useState<PatientDto | null>(null);
  const [emergPatient, setEmergPatient] = useState<PatientDto | null>(null);
  const [consentPatient, setConsentPatient] = useState<PatientDto | null>(null);
  const [insurancePatient, setInsurancePatient] = useState<PatientDto | null>(null);

  const filteredPatients = patients.filter((p) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const match =
        p.fullName.toLowerCase().includes(term) ||
        p.mrn.toLowerCase().includes(term) ||
        p.patientCode.toLowerCase().includes(term) ||
        (p.primaryContact?.primaryMobile && p.primaryContact.primaryMobile.includes(term)) ||
        (p.primaryContact?.email && p.primaryContact.email.toLowerCase().includes(term));
      if (!match) return false;
    }
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Patient Master Index Directory
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
            Canonical patient records, demographic verifications, and cross-facility identifier linkages
          </span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
          ➕ Register New Patient
        </Button>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Search Patients
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by MRN, Name, Mobile, Email..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Patient Status
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Lifecycle Statuses' },
                { value: 'ACTIVE', label: 'Active Status' },
                { value: 'DUPLICATE_REVIEW', label: 'Duplicate Review Pending' },
                { value: 'MERGED', label: 'Merged / Retired Records' },
                { value: 'INACTIVE', label: 'Inactive' },
                { value: 'BLOCKED', label: 'Blocked' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Patients Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MRN</TableHead>
                <TableHead>Patient Name & DOB</TableHead>
                <TableHead>Primary Mobile & Email</TableHead>
                <TableHead>Identifiers</TableHead>
                <TableHead>Consents</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero patients found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {p.mrn}
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{p.fullName}</strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        DOB: {p.dateOfBirth} ({p.gender}) · Blood: {p.bloodGroup ?? 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      <strong>{p.primaryContact?.primaryMobile ?? '—'}</strong>
                      {p.primaryContact?.email && (
                        <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                          {p.primaryContact.email}
                        </span>
                      )}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {p.identifiers.length} attached
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      <Badge variant={p.consents.length > 0 ? 'success' : 'warning'}>
                        {p.consents.length} Granted
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.status === 'ACTIVE'
                            ? 'success'
                            : p.status === 'DUPLICATE_REVIEW'
                            ? 'warning'
                            : p.status === 'MERGED'
                            ? 'neutral'
                            : 'danger'
                        }
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        <Button variant="outline" size="sm" onClick={() => onSelectPatient(p.id)}>
                          Profile
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setEditPatient(p)}>
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setIdentPatient(p)}>
                          +ID
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setEmergPatient(p)}>
                          +Emerg
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setConsentPatient(p)}>
                          +Consent
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setInsurancePatient(p)}>
                          +Ins
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Dialogs */}
      {isCreateOpen && (
        <CreatePatientDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          tenantId={tenantId}
          partnerId={partnerId}
          organizationId={organizationId}
          branchId={branchId}
          actorId={actorId}
          actorRole={actorRole}
          onCreatePatient={onCreatePatient}
        />
      )}

      {editPatient && (
        <EditPatientDialog
          isOpen={Boolean(editPatient)}
          onClose={() => setEditPatient(null)}
          patient={editPatient}
          actorId={actorId}
          actorRole={actorRole}
          onUpdatePatient={onUpdatePatient}
        />
      )}

      {identPatient && (
        <AddIdentifierDialog
          isOpen={Boolean(identPatient)}
          onClose={() => setIdentPatient(null)}
          patient={identPatient}
          actorId={actorId}
          actorRole={actorRole}
          onAddIdentifier={onAddIdentifier}
        />
      )}

      {emergPatient && (
        <AddEmergencyContactDialog
          isOpen={Boolean(emergPatient)}
          onClose={() => setEmergPatient(null)}
          patient={emergPatient}
          actorId={actorId}
          actorRole={actorRole}
          onAddEmergencyContact={onAddEmergencyContact}
        />
      )}

      {consentPatient && (
        <AddConsentDialog
          isOpen={Boolean(consentPatient)}
          onClose={() => setConsentPatient(null)}
          patient={consentPatient}
          actorId={actorId}
          actorRole={actorRole}
          onAddConsent={onAddConsent}
        />
      )}

      {insurancePatient && (
        <AddInsuranceDialog
          isOpen={Boolean(insurancePatient)}
          onClose={() => setInsurancePatient(null)}
          patient={insurancePatient}
          actorId={actorId}
          actorRole={actorRole}
          onAddInsurance={onAddInsurance}
        />
      )}
    </div>
  );
};
