import React, { useState } from 'react';
import type { ComplianceOfficerDto, InternalEmployeeDto, ComplianceOfficerRole } from '@docsearch/api-contracts';
import {
  Card,
  Button,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';
import { OfficerAppointDialog } from './OfficerAppointDialog.js';

export interface ComplianceOfficerCenterViewProps {
  officers: ComplianceOfficerDto[];
  employees: InternalEmployeeDto[];
  onAppointOfficer: (
    officerCode: string,
    officerRole: ComplianceOfficerRole,
    employeeId: string,
    officerName: string,
    workEmail: string,
    regulatoryAuthorityReference: string,
    reason: string
  ) => Promise<void>;
}

export const ComplianceOfficerCenterView: React.FC<ComplianceOfficerCenterViewProps> = ({
  officers,
  employees,
  onAppointOfficer
}) => {
  const [isAppointModalOpen, setIsAppointModalOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Designated Corporate Compliance & Privacy Officers
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
            Statutory appointments registered with U.S. HHS OCR, UK ICO, and cybersecurity steering committees
          </span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsAppointModalOpen(true)}>
          🛡️ Appoint Compliance Officer
        </Button>
      </div>

      {/* Officers Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Officer Code</TableHead>
                <TableHead>Designated Officer</TableHead>
                <TableHead>Official Role</TableHead>
                <TableHead>Official Notice Email</TableHead>
                <TableHead>Appointment Date</TableHead>
                <TableHead>Regulatory Authority Reference</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {officers.map((o) => (
                <TableRow key={o.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {o.officerCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{o.officerName}</strong>
                  </TableCell>
                  <TableCell>
                    <Badge variant="primary">{o.officerRole}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {o.workEmail}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    {new Date(o.appointmentDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', maxWidth: '240px' }}>
                    {o.regulatoryAuthorityReference}
                  </TableCell>
                  <TableCell>
                    <Badge variant={o.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {o.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {isAppointModalOpen && (
        <OfficerAppointDialog
          isOpen={isAppointModalOpen}
          onClose={() => setIsAppointModalOpen(false)}
          employees={employees}
          onAppointOfficer={onAppointOfficer}
        />
      )}
    </div>
  );
};
