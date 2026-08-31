import React, { useState } from 'react';
import type {
  ConsultationFeeMatrixDto,
  DoctorSpecializationDto,
  DoctorProfileDto,
  CreateConsultationFeeRequest
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
import { ConfigureFeeDialog } from '../dialogs/ConfigureFeeDialog.js';

export interface ConsultationFeeMatrixViewProps {
  fees: ConsultationFeeMatrixDto[];
  specializations: DoctorSpecializationDto[];
  doctors: DoctorProfileDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | undefined;
  actorId: string;
  actorRole: string;
  onCreateFee: (req: CreateConsultationFeeRequest) => Promise<void>;
}

export const ConsultationFeeMatrixView: React.FC<ConsultationFeeMatrixViewProps> = ({
  fees,
  specializations,
  doctors,
  tenantId,
  partnerId,
  organizationId,
  branchId,
  actorId,
  actorRole,
  onCreateFee
}) => {
  const [isConfigureOpen, setIsConfigureOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Consultation Fee Schedules
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
            Standardized pricing matrix for new patient appointments, follow-ups, and virtual teleconsultations
          </span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsConfigureOpen(true)}>
          💵 Configure Consultation Fee
        </Button>
      </div>

      <Alert type="info" title="Tiered Price Resolution">
        During patient booking and checkout, fees resolve from Doctor override → Specialty schedule → Branch baseline → Organization default.
      </Alert>

      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Specialty Scope</TableHead>
                <TableHead>Doctor Scope</TableHead>
                <TableHead>Consultation Type</TableHead>
                <TableHead>Base Fee Amount</TableHead>
                <TableHead>Follow-Up Window</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.map((f) => (
                <TableRow key={f.id}>
                  <TableCell style={{ fontWeight: '600', fontSize: '0.8125rem' }}>
                    {f.specialtyCode ?? 'Organization Wide'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {f.doctorId ? (
                      doctors.find((d) => d.id === f.doctorId)?.fullName ?? 'Doctor Override'
                    ) : (
                      <span style={{ color: 'var(--ds-color-text-muted)' }}>— All Doctors —</span>
                    )}
                  </TableCell>
                  <TableCell style={{ fontWeight: '600' }}>
                    {f.consultationType}
                  </TableCell>
                  <TableCell style={{ fontWeight: '700', color: 'var(--ds-color-primary)', fontSize: '0.9375rem' }}>
                    ${f.baseFeeAmount.toFixed(2)} {f.currency}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {f.followUpValidityDays} Days
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    {new Date(f.effectiveDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">{f.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {isConfigureOpen && (
        <ConfigureFeeDialog
          isOpen={isConfigureOpen}
          onClose={() => setIsConfigureOpen(false)}
          tenantId={tenantId}
          partnerId={partnerId}
          organizationId={organizationId}
          branchId={branchId}
          actorId={actorId}
          actorRole={actorRole}
          specializations={specializations}
          doctors={doctors}
          onCreateFee={onCreateFee}
        />
      )}
    </div>
  );
};
