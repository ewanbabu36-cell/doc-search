import React, { useState } from 'react';
import type { EncounterReferralDto } from '@docsearch/api-contracts';
import {
  Card,
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

export interface ReferralCenterViewProps {
  referrals: EncounterReferralDto[];
  onSelectEncounter: (encounterId: string) => void;
}

export const ReferralCenterView: React.FC<ReferralCenterViewProps> = ({
  referrals
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filtered = referrals.filter((r) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        (r.patientName && r.patientName.toLowerCase().includes(q)) ||
        (r.patientMrn && r.patientMrn.toLowerCase().includes(q)) ||
        (r.referringDoctorName && r.referringDoctorName.toLowerCase().includes(q)) ||
        (r.destinationDepartmentName && r.destinationDepartmentName.toLowerCase().includes(q)) ||
        (r.destinationDoctorName && r.destinationDoctorName.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (typeFilter !== 'ALL' && r.referralType !== typeFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
          Clinical Referral Coordination Center
        </h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
          Tracking inbound and outbound specialist physician referrals, inter-department transfers, and tertiary center escalations
        </span>
      </div>

      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Search Referrals (Patient, Doctor, Department)
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search referrals..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Referral Type
            </label>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Referral Categories' },
                { value: 'INTERNAL_SPECIALIST', label: 'Internal Specialist' },
                { value: 'INTERNAL_DEPARTMENT', label: 'Internal Department' },
                { value: 'EXTERNAL_HOSPITAL', label: 'External Hospital' },
                { value: 'DIAGNOSTIC_CENTER', label: 'Diagnostic Center' }
              ]}
            />
          </div>
        </div>
      </Card>

      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Patient & MRN</TableHead>
                <TableHead>Referring Physician</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Type & Urgency</TableHead>
                <TableHead>Clinical Summary</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero referrals currently logged.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                      {new Date(r.referredAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <strong>{r.patientName ?? 'Patient'}</strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        MRN: <code>{r.patientMrn ?? 'N/A'}</code>
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {r.referringDoctorName ?? 'Attending Doctor'}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      <strong>{r.destinationDepartmentName ?? r.destinationFacilityName ?? 'Clinic'}</strong>
                      {r.destinationDoctorName && (
                        <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                          {r.destinationDoctorName}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{r.referralType}</Badge>
                      <span style={{ display: 'block', marginTop: '2px' }}>
                        <Badge variant={r.urgency === 'STAT' ? 'danger' : r.urgency === 'URGENT' ? 'warning' : 'neutral'}>
                          {r.urgency}
                        </Badge>
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', maxWidth: '300px' }}>
                      {r.clinicalSummary}
                    </TableCell>
                    <TableCell>
                      <Badge variant="warning">{r.referralStatus}</Badge>
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
