import React, { useState } from 'react';
import type {
  PatientDto,
  CreatePatientRequest,
  UpdatePatientRequest,
  AddPatientIdentifierRequest,
  AddEmergencyContactRequest,
  AddPatientConsentRequest,
  AddPatientInsuranceRequest,
  SearchPatientRequest
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
  TableCell,
  Dropdown,
  Alert
} from '@docsearch/ui-kit';
import { FastOpdRegistrationDrawer } from '../common/FastOpdRegistrationDrawer.js';
import { CreatePatientDialog } from '../dialogs/CreatePatientDialog.js';
import { EditPatientDialog } from '../dialogs/EditPatientDialog.js';
import { AddIdentifierDialog } from '../dialogs/AddIdentifierDialog.js';
import { AddEmergencyContactDialog } from '../dialogs/AddEmergencyContactDialog.js';
import { AddConsentDialog } from '../dialogs/AddConsentDialog.js';
import { AddInsuranceDialog } from '../dialogs/AddInsuranceDialog.js';
import { isDestructiveActionAllowed } from '../../utils/partnerRolePermissions.js';
import { isFullPhoneViewAllowed } from '../../utils/partnerRolePermissions.js';

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
  onSearchPatients?: ((req: SearchPatientRequest) => Promise<PatientDto[]>) | undefined;
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
  onAddInsurance,
  onSearchPatients
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [dobFilter, setDobFilter] = useState('');
  const [remoteSearchResults, setRemoteSearchResults] = useState<PatientDto[] | null>(null);
  const [isSearchingServer, setIsSearchingServer] = useState(false);

  // Dialog States
  const [isFastOpdOpen, setIsFastOpdOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<PatientDto | null>(null);
  const [identPatient, setIdentPatient] = useState<PatientDto | null>(null);
  const [emergPatient, setEmergPatient] = useState<PatientDto | null>(null);
  const [consentPatient, setConsentPatient] = useState<PatientDto | null>(null);
  const [insurancePatient, setInsurancePatient] = useState<PatientDto | null>(null);

  const handleRemoteSearch = async () => {
    if (!onSearchPatients || !searchTerm.trim()) {
      setRemoteSearchResults(null);
      return;
    }
    setIsSearchingServer(true);
    try {
      const res = await onSearchPatients({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        query: searchTerm.trim(),
        dateOfBirth: dobFilter || undefined,
        pageIndex: 0,
        pageSize: 50
      });
      setRemoteSearchResults(res || []);
    } catch {
      setRemoteSearchResults([]);
    } finally {
      setIsSearchingServer(false);
    }
  };

  const basePatients = remoteSearchResults !== null ? remoteSearchResults : patients;
  const filteredPatients = basePatients.filter((p) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      const match =
        p.fullName.toLowerCase().includes(term) ||
        p.mrn.toLowerCase().includes(term) ||
        p.patientCode.toLowerCase().includes(term) ||
        (p.primaryContact?.primaryMobile && p.primaryContact.primaryMobile.includes(term)) ||
        (p.primaryContact?.email && p.primaryContact.email.toLowerCase().includes(term)) ||
        (p.identifiers && p.identifiers.some(
          (i) => i.identifierValue.toLowerCase().includes(term) || i.identifierType.toLowerCase().includes(term)
        )) ||
        (p.primaryAddress?.city && p.primaryAddress.city.toLowerCase().includes(term)) ||
        (p.primaryAddress?.state && p.primaryAddress.state.toLowerCase().includes(term)) ||
        p.dateOfBirth.includes(term);
      if (!match) return false;
    }
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (genderFilter !== 'ALL' && p.gender !== genderFilter) return false;
    if (dobFilter && p.dateOfBirth !== dobFilter) return false;
    return true;
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setGenderFilter('ALL');
    setDobFilter('');
    setRemoteSearchResults(null);
  };

  const handleExportCsv = () => {
    const headers = [
      'UHID',
      'Clinical MRN',
      'Full Name',
      'Date of Birth',
      'Gender',
      'Blood Group',
      'Primary Mobile',
      'Email',
      'Street Address',
      'City',
      'State',
      'Postal Code',
      'National Identifiers (ABHA / Aadhaar)',
      'Status',
      'Registration Date'
    ];
    const rows = filteredPatients.map((p) => [
      `"${p.mrn}"`,
      `"${p.patientCode}"`,
      `"${p.fullName.replace(/"/g, '""')}"`,
      `"${p.dateOfBirth}"`,
      `"${p.gender}"`,
      `"${p.bloodGroup || ''}"`,
      `"${p.primaryContact?.primaryMobile || ''}"`,
      `"${p.primaryContact?.email || ''}"`,
      `"${((p.primaryAddress?.addressLine1 || '') + (p.primaryAddress?.addressLine2 ? ' ' + p.primaryAddress.addressLine2 : '')).replace(/"/g, '""')}"`,
      `"${p.primaryAddress?.city || ''}"`,
      `"${p.primaryAddress?.state || ''}"`,
      `"${p.primaryAddress?.postalCode || ''}"`,
      `"${(p.identifiers || []).map((i) => `${i.identifierType}:${i.identifierValue}`).join('; ')}"`,
      `"${p.status}"`,
      `"${(p as any).createdAt ? new Date((p as any).createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `docsearch-patient-directory-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isExportAuthorized = (() => {
    if (isDestructiveActionAllowed(actorRole)) return true;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('docsearch_partner_staff_auth');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.permissions?.canExportPatientData === true) return true;
          if (isDestructiveActionAllowed(parsed?.role)) return true;
        }
      } catch {}
    }
    return false;
  })();

  const canViewFullMobile = isFullPhoneViewAllowed(actorRole);

  const maskPhone = (phone?: string) => {
    if (!phone) return '—';
    if (canViewFullMobile) return phone;
    const clean = phone.trim();
    if (clean.length <= 5) return '•••••';
    return `${clean.slice(0, 5)} •••••`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Patient Master Index & Registry Directory
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
            Canonical patient records, fuzzy demographic search (UHID, Name, Mobile, ABHA, Aadhaar), and cross-facility linkages
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {isExportAuthorized ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={filteredPatients.length === 0}
              style={{
                minHeight: '34px',
                fontWeight: 700,
                backgroundColor: 'rgba(56, 189, 248, 0.08)',
                borderColor: 'rgba(56, 189, 248, 0.4)',
                color: '#38BDF8',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Zero Vendor Lock-in: 1-Click Export entire patient directory to open standard CSV"
            >
              <span>📥</span>
              <span>Export CSV ({filteredPatients.length})</span>
              <span style={{ fontSize: '0.625rem', backgroundColor: 'rgba(56, 189, 248, 0.2)', padding: '1px 5px', borderRadius: '4px' }}>
                Zero Lock-in
              </span>
            </Button>
          ) : (
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#EF4444',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                minHeight: '34px',
                boxSizing: 'border-box'
              }}
              title="Data-Theft Protection: Exporting bulk patient phone records is restricted to Admins & Clinic Owners."
            >
              <span>🛡️</span>
              <span>Export Protected (Admin Only)</span>
            </div>
          )}
          <Button variant="primary" size="sm" onClick={() => setIsFastOpdOpen(true)} style={{ minHeight: '34px', fontWeight: 700 }}>
            ⚡ Express OPD Intake (2-Click)
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(true)} style={{ minHeight: '34px', fontWeight: 700 }}>
            📋 Full Registration (Detailed)
          </Button>
        </div>
      </div>

      {/* Receptionist Guidance Banner */}
      <Alert type="info" title="Receptionist Fast Intake Workflow">
        Always perform a lookup by UHID, Phone, Name, or National ID (Aadhaar / ABHA) prior to creating a new profile to prevent accidental duplicate MRN creation and fractured medical records.
      </Alert>

      {/* Unified Fast Search & Filter Toolbar */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px', color: 'var(--ds-color-text-primary)' }}>
              🔍 Universal Patient Search (UHID, Name, Phone, ABHA, Aadhaar, City)
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void handleRemoteSearch();
                    }
                  }}
                  placeholder="Type UHID, Mobile, Full Name, ABHA address, Aadhaar, or City..."
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setRemoteSearchResults(null);
                    }}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--ds-color-text-muted)',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.9rem'
                    }}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
              {onSearchPatients && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => void handleRemoteSearch()}
                  isLoading={isSearchingServer}
                  style={{ minHeight: '34px', whiteSpace: 'nowrap', fontWeight: 700 }}
                  title="Query database via backend REST API"
                >
                  🔍 Query Server
                </Button>
              )}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px', color: 'var(--ds-color-text-primary)' }}>
              Date of Birth (DOB)
            </label>
            <Input
              type="date"
              value={dobFilter}
              onChange={(e) => setDobFilter(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px', color: 'var(--ds-color-text-primary)' }}>
              Gender Filter
            </label>
            <Select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Genders' },
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
                { value: 'OTHER', label: 'Other / Non-Binary' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px', color: 'var(--ds-color-text-primary)' }}>
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

          {(searchTerm || statusFilter !== 'ALL' || genderFilter !== 'ALL' || dobFilter) && (
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                style={{ minHeight: '34px', width: '100%', fontWeight: 600 }}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Patients Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>UHID</TableHead>
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
                    <TableCell
                      onClick={() => onSelectPatient(p.id)}
                      style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--ds-color-primary)' }}
                      title="Click to open patient profile dossier"
                    >
                      {p.mrn}
                    </TableCell>
                    <TableCell
                      onClick={() => onSelectPatient(p.id)}
                      style={{ cursor: 'pointer' }}
                      title="Click to open patient profile dossier"
                    >
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{p.fullName}</strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        DOB: {p.dateOfBirth} ({p.gender}) · Blood: {p.bloodGroup ?? 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      <strong title={canViewFullMobile ? "Full mobile number" : "Protected under Anti-Poaching Security Policy"}>
                        {maskPhone(p.primaryContact?.primaryMobile)}
                      </strong>
                      {!canViewFullMobile && p.primaryContact?.primaryMobile && (
                        <span style={{ display: 'block', fontSize: '0.625rem', color: '#b91c1c', fontWeight: 600, marginTop: '2px' }}>
                          🔒 Masked (Anti-Theft)
                        </span>
                      )}
                      {p.primaryContact?.email && (
                        <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                          {canViewFullMobile ? p.primaryContact.email : '•••••@••••.•••'}
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
                      <Dropdown
                        align="right"
                        trigger={
                          <Button variant="outline" size="sm" style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            ⋮ Actions
                          </Button>
                        }
                        items={[
                          { id: 'profile', label: 'View Profile Dossier', icon: '👤', onClick: () => onSelectPatient(p.id) },
                          { id: 'edit', label: 'Edit Demographics', icon: '✏️', onClick: () => setEditPatient(p) },
                          'divider',
                          { id: 'ident', label: '+ Attach ID / ABHA', icon: '🪪', onClick: () => setIdentPatient(p) },
                          { id: 'emerg', label: '+ Emergency Contact', icon: '🚨', onClick: () => setEmergPatient(p) },
                          { id: 'consent', label: '+ Manage Consents', icon: '📝', onClick: () => setConsentPatient(p) },
                          { id: 'insurance', label: '+ Attach Insurance Policy', icon: '🛡️', onClick: () => setInsurancePatient(p) }
                        ]}
                      />
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

      {/* Express Fast OPD Intake Drawer */}
      <FastOpdRegistrationDrawer
        isOpen={isFastOpdOpen}
        onClose={() => setIsFastOpdOpen(false)}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />
    </div>
  );
};
