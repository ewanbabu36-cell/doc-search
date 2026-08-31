import React, { useState } from 'react';
import type {
  DoctorLeaveDto,
  DoctorProfileDto,
  AddDoctorLeaveRequest,
  ApproveDoctorLeaveRequest
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
import { AddDoctorLeaveDialog } from '../dialogs/AddDoctorLeaveDialog.js';

export interface LeaveCalendarViewProps {
  leaves: DoctorLeaveDto[];
  doctors: DoctorProfileDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | undefined;
  actorId: string;
  actorRole: string;
  onAddLeave: (req: AddDoctorLeaveRequest) => Promise<void>;
  onApproveLeave: (req: ApproveDoctorLeaveRequest) => Promise<void>;
}

export const LeaveCalendarView: React.FC<LeaveCalendarViewProps> = ({
  leaves,
  doctors,
  tenantId,
  partnerId,
  organizationId,
  branchId,
  actorId,
  actorRole,
  onAddLeave,
  onApproveLeave
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Doctor Leave & Exclusion Windows
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
            Planned leaves, medical conferences, and emergency absences with automatic slot conflict blocking
          </span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)}>
          🌴 Record Doctor Leave
        </Button>
      </div>

      <Alert type="info" title="Automatic Slot Conflict Protection">
        Approved doctor leaves automatically block all overlapping OPD slots and notify clinic triage coordinators of coverage gaps.
      </Alert>

      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Affected Slots</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason & Authorizer</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero doctor leave records filed.
                  </TableCell>
                </TableRow>
              ) : (
                leaves.map((l) => {
                  const doc = doctors.find((d) => d.id === l.doctorId);
                  return (
                    <TableRow key={l.id}>
                      <TableCell>
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>
                          {doc?.fullName ?? l.doctorName ?? 'Doctor'}
                        </strong>
                      </TableCell>
                      <TableCell><Badge variant="neutral">{l.leaveType}</Badge></TableCell>
                      <TableCell style={{ fontSize: '0.8125rem' }}>{new Date(l.startDate).toLocaleDateString()}</TableCell>
                      <TableCell style={{ fontSize: '0.8125rem' }}>{new Date(l.endDate).toLocaleDateString()}</TableCell>
                      <TableCell style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--ds-color-danger)' }}>
                        {l.affectedSlotsCount} slots blocked
                      </TableCell>
                      <TableCell>
                        <Badge variant={l.approvalStatus === 'APPROVED' ? 'success' : l.approvalStatus === 'PENDING' ? 'warning' : 'danger'}>
                          {l.approvalStatus}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ fontSize: '0.75rem', maxWidth: '240px' }}>
                        <strong>{l.approvedBy ?? 'Pending'}:</strong> {l.reason}
                      </TableCell>
                      <TableCell>
                        {l.approvalStatus === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                onApproveLeave({
                                  actorId,
                                  actorRole,
                                  tenantId,
                                  partnerId,
                                  leaveId: l.id,
                                  approvalStatus: 'APPROVED',
                                  reason: 'Approved by clinical coordinator'
                                })
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                onApproveLeave({
                                  actorId,
                                  actorRole,
                                  tenantId,
                                  partnerId,
                                  leaveId: l.id,
                                  approvalStatus: 'REJECTED',
                                  reason: 'Rejected due to critical staffing shortage'
                                })
                              }
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>Settled</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {isAddOpen && (
        <AddDoctorLeaveDialog
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          tenantId={tenantId}
          partnerId={partnerId}
          organizationId={organizationId}
          branchId={branchId}
          actorId={actorId}
          actorRole={actorRole}
          doctors={doctors}
          onAddLeave={onAddLeave}
        />
      )}
    </div>
  );
};
