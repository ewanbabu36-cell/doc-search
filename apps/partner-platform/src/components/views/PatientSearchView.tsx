import React, { useState } from 'react';
import type { PatientDto, SearchPatientRequest } from '@docsearch/api-contracts';
import {
  Card,
  Button,
  Badge,
  Input,
  Alert,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface PatientSearchViewProps {
  tenantId: string;
  partnerId: string;
  organizationId: string;
  onSearchPatients: (req: SearchPatientRequest) => Promise<PatientDto[]>;
  onSelectPatient: (patientId: string) => void;
}

export const PatientSearchView: React.FC<PatientSearchViewProps> = ({
  tenantId,
  partnerId,
  organizationId,
  onSearchPatients,
  onSelectPatient
}) => {
  const [query, setQuery] = useState('');
  const [mrn, setMrn] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [results, setResults] = useState<PatientDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await onSearchPatients({
        tenantId,
        partnerId,
        organizationId,
        query: query || undefined,
        mrn: mrn || undefined,
        name: name || undefined,
        mobile: mobile || undefined,
        dateOfBirth: dob || undefined,
        pageIndex: 0,
        pageSize: 50
      });
      setResults(res);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setMrn('');
    setName('');
    setMobile('');
    setDob('');
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
          Fast Reception Patient Search
        </h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
          Instant Master Patient Index retrieval by MRN, National ID, Patient Name, Date of Birth, or Phone
        </span>
      </div>

      <Alert type="info" title="Receptionist Fast Intake Workflow">
        Always perform a patient lookup prior to registering a new individual to prevent accidental duplicate MRN creation and split clinical records.
      </Alert>

      {/* Search Form */}
      <Card padding="md">
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Quick Universal Search (MRN, Name, Phone, National ID)
            </label>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type MRN, name, phone, or ID reference..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>MRN</label>
              <Input value={mrn} onChange={(e) => setMrn(e.target.value)} placeholder="DS-ORG001-XXXXXX" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="First or Last Name" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>Mobile Phone</label>
              <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+1 (555) 000-0000" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>Date of Birth</label>
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
            <Button variant="outline" size="sm" type="button" onClick={handleClear}>
              Clear
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSearching}>
              🔍 Search Patient Index
            </Button>
          </div>
        </form>
      </Card>

      {/* Results */}
      {hasSearched && (
        <Card
          title={`Search Results (${results.length} Matches)`}
          subtitle="Click on a patient record to open the complete Master Patient Index dossier"
          padding="none"
        >
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MRN</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Date of Birth / Gender</TableHead>
                  <TableHead>Mobile Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                      No patients matched your search criteria. You may proceed to register a new patient.
                    </TableCell>
                  </TableRow>
                ) : (
                  results.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                        {p.mrn}
                      </TableCell>
                      <TableCell>
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>{p.fullName}</strong>
                      </TableCell>
                      <TableCell style={{ fontSize: '0.8125rem' }}>
                        {p.dateOfBirth} ({p.gender})
                      </TableCell>
                      <TableCell style={{ fontSize: '0.8125rem' }}>
                        {p.primaryContact?.primaryMobile ?? '—'}
                      </TableCell>
                      <TableCell style={{ fontSize: '0.75rem' }}>
                        {p.primaryAddress ? `${p.primaryAddress.city}, ${p.primaryAddress.state}` : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.status === 'ACTIVE'
                              ? 'success'
                              : p.status === 'DUPLICATE_REVIEW'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="primary" size="sm" onClick={() => onSelectPatient(p.id)}>
                          Open Dossier
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </div>
  );
};
