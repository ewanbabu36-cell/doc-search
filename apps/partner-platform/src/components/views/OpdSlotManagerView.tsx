import React, { useState } from 'react';
import type {
  OpdSlotDto,
  DoctorProfileDto,
  BlockOpdSlotRequest,
  UnblockOpdSlotRequest
} from '@docsearch/api-contracts';
import {
  Card,
  Button,
  Badge,
  Alert,
  Select,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';
import { BlockSlotDialog } from '../dialogs/BlockSlotDialog.js';

export interface OpdSlotManagerViewProps {
  slots: OpdSlotDto[];
  doctors: DoctorProfileDto[];
  actorId: string;
  actorRole: string;
  onBlockSlot: (req: BlockOpdSlotRequest) => Promise<void>;
  onUnblockSlot: (req: UnblockOpdSlotRequest) => Promise<void>;
}

export const OpdSlotManagerView: React.FC<OpdSlotManagerViewProps> = ({
  slots,
  doctors,
  actorId,
  actorRole,
  onBlockSlot,
  onUnblockSlot
}) => {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedSlot, setSelectedSlot] = useState<OpdSlotDto | null>(null);

  const filteredSlots = slots.filter((s) => {
    if (statusFilter !== 'ALL' && s.bookingStatus !== statusFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Discrete OPD Slot Manager
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
            Real-time appointment slot states, blockings, and doctor leave conflict markers
          </span>
        </div>
      </div>

      <Alert type="info" title="OPD Slot Control Plane">
        Slots generated from recurring schedule templates represent bookable units. Unscheduled procedure holds or sudden doctor commitments can be marked as blocked with audit justifications.
      </Alert>

      {/* Filter */}
      <Card padding="md">
        <div style={{ maxWidth: '280px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
            Slot Booking Status
          </label>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Slot States' },
              { value: 'AVAILABLE', label: 'Available (Open for booking)' },
              { value: 'BOOKED', label: 'Booked (Patient Assigned)' },
              { value: 'BLOCKED', label: 'Blocked (Emergency / Reserved)' },
              { value: 'LEAVE_CONFLICT', label: 'Leave Conflict (Doctor on Leave)' }
            ]}
          />
        </div>
      </Card>

      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slot Date</TableHead>
                <TableHead>Time Window</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Booking State</TableHead>
                <TableHead>Details / Notes</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSlots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero OPD slots matching filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSlots.map((s) => {
                  const doc = doctors.find((d) => d.id === s.doctorId);
                  return (
                    <TableRow key={s.id}>
                      <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.8125rem' }}>
                        {s.slotDate}
                      </TableCell>
                      <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.8125rem' }}>
                        {s.startTime} — {s.endTime}
                      </TableCell>
                      <TableCell>
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>
                          {doc?.fullName ?? s.doctorName ?? 'Doctor'}
                        </strong>
                      </TableCell>
                      <TableCell><Badge variant="neutral">{s.consultationMode}</Badge></TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            s.bookingStatus === 'AVAILABLE'
                              ? 'success'
                              : s.bookingStatus === 'BOOKED'
                              ? 'primary'
                              : s.bookingStatus === 'BLOCKED'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {s.bookingStatus}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ fontSize: '0.75rem' }}>
                        {s.patientReference ? (
                          <span>Patient Ref: <code>{s.patientReference}</code></span>
                        ) : s.blockReason ? (
                          <span style={{ color: 'var(--ds-color-danger)' }}>{s.blockReason}</span>
                        ) : (
                          <span style={{ color: 'var(--ds-color-text-muted)' }}>Open for patient self-booking</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {s.bookingStatus === 'AVAILABLE' ? (
                          <Button variant="outline" size="sm" onClick={() => setSelectedSlot(s)}>
                            Block Slot
                          </Button>
                        ) : s.bookingStatus === 'BLOCKED' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onUnblockSlot({
                                actorId,
                                actorRole,
                                tenantId: s.tenantId,
                                partnerId: s.partnerId,
                                organizationId: s.organizationId,
                                slotId: s.id,
                                reason: 'Unblocked by clinic administrator'
                              })
                            }
                          >
                            Unblock
                          </Button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>Locked</span>
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

      {selectedSlot && (
        <BlockSlotDialog
          isOpen={Boolean(selectedSlot)}
          onClose={() => setSelectedSlot(null)}
          slot={selectedSlot}
          actorId={actorId}
          actorRole={actorRole}
          onBlockSlot={onBlockSlot}
        />
      )}
    </div>
  );
};
