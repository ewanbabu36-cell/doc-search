import React, { useState } from 'react';
import type {
  DoctorProfileDto,
  DoctorSpecializationDto,
  CreateDoctorProfileRequest,
  UpdateDoctorProfileRequest,
  AddDoctorLeaveRequest,
  CreateDoctorScheduleRequest,
  AssignDoctorLocationRequest
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
import { CreateDoctorProfileDialog } from '../dialogs/CreateDoctorProfileDialog.js';
import { EditDoctorProfileDialog } from '../dialogs/EditDoctorProfileDialog.js';
import { AddDoctorLeaveDialog } from '../dialogs/AddDoctorLeaveDialog.js';
import { CreateScheduleDialog } from '../dialogs/CreateScheduleDialog.js';
import { AssignDoctorLocationDialog } from '../dialogs/AssignDoctorLocationDialog.js';

export interface DoctorDirectoryViewProps {
  doctors: DoctorProfileDto[];
  specializations: DoctorSpecializationDto[];
  staffMembers: { id: string; fullName: string; staffCode: string; departmentId: string }[];
  departments: { id: string; departmentName: string }[];
  organizations: { id: string; organizationName: string }[];
  facilities: { id: string; facilityName: string; organizationId: string }[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  actorId: string;
  actorRole: string;
  onSelectDoctor: (doctorId: string) => void;
  onCreateDoctor: (req: CreateDoctorProfileRequest) => Promise<void>;
  onUpdateDoctor: (req: UpdateDoctorProfileRequest) => Promise<void>;
  onAddLeave: (req: AddDoctorLeaveRequest) => Promise<void>;
  onCreateSchedule: (req: CreateDoctorScheduleRequest) => Promise<void>;
  onAssignLocation: (req: AssignDoctorLocationRequest) => Promise<void>;
}

export const DoctorDirectoryView: React.FC<DoctorDirectoryViewProps> = ({
  doctors,
  specializations,
  staffMembers,
  departments,
  organizations,
  facilities,
  tenantId,
  partnerId,
  organizationId,
  branchId,
  actorId,
  actorRole,
  onSelectDoctor,
  onCreateDoctor,
  onUpdateDoctor,
  onAddLeave,
  onCreateSchedule,
  onAssignLocation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<DoctorProfileDto | null>(null);
  const [leaveDoc, setLeaveDoc] = useState<DoctorProfileDto | null>(null);
  const [scheduleDoc, setScheduleDoc] = useState<DoctorProfileDto | null>(null);
  const [locationDoc, setLocationDoc] = useState<DoctorProfileDto | null>(null);

  const filteredDoctors = doctors.filter((d) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const match =
        d.fullName.toLowerCase().includes(term) ||
        d.doctorCode.toLowerCase().includes(term) ||
        d.primarySpecialty.toLowerCase().includes(term) ||
        d.medicalLicenseNumber.toLowerCase().includes(term);
      if (!match) return false;
    }
    if (specialtyFilter !== 'ALL' && d.primarySpecialty !== specialtyFilter) return false;
    if (availabilityFilter !== 'ALL' && d.availabilityStatus !== availabilityFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Attending Physician & Doctor Registry
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
            Clinical credentials, specialization classifications, consultation privileges, and location assignments
          </span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
          🩺 Register New Doctor
        </Button>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Search Doctors
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, code, or license..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Specialty
            </label>
            <Select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Specialties' },
                ...specializations.map((s) => ({
                  value: s.specialtyName,
                  label: s.specialtyName
                }))
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Availability
            </label>
            <Select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Availability States' },
                { value: 'AVAILABLE', label: 'Available (Accepting Consults)' },
                { value: 'BUSY', label: 'Busy' },
                { value: 'ON_LEAVE', label: 'On Leave' },
                { value: 'BLOCKED', label: 'Blocked' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Doctors Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Doctor Name & Qualification</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Department & Branch</TableHead>
                <TableHead>Consultation Modes</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDoctors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero doctors found matching filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDoctors.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {d.doctorCode}
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{d.fullName}</strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        {d.qualification} · Lic: {d.medicalLicenseNumber}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {d.primarySpecialty}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      <strong>{d.departmentName ?? 'Department'}</strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        {d.branchName ?? 'Branch Facility'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {d.consultationModes.map((m) => (
                          <Badge key={m} variant="neutral">{m}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.availabilityStatus === 'AVAILABLE' ? 'success' : d.availabilityStatus === 'ON_LEAVE' ? 'primary' : 'warning'}>
                        {d.availabilityStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        <Button variant="outline" size="sm" onClick={() => onSelectDoctor(d.id)}>
                          Profile
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setEditDoc(d)}>
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setScheduleDoc(d)}>
                          Schedule
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setLeaveDoc(d)}>
                          Leave
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setLocationDoc(d)}>
                          Location
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

      {/* Dialog Modals */}
      {isCreateOpen && (
        <CreateDoctorProfileDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          tenantId={tenantId}
          partnerId={partnerId}
          organizationId={organizationId}
          branchId={branchId}
          actorId={actorId}
          actorRole={actorRole}
          staffMembers={staffMembers}
          departments={departments}
          specializations={specializations}
          onCreateDoctor={onCreateDoctor}
        />
      )}

      {editDoc && (
        <EditDoctorProfileDialog
          isOpen={Boolean(editDoc)}
          onClose={() => setEditDoc(null)}
          doctor={editDoc}
          actorId={actorId}
          actorRole={actorRole}
          onUpdateDoctor={onUpdateDoctor}
        />
      )}

      {leaveDoc && (
        <AddDoctorLeaveDialog
          isOpen={Boolean(leaveDoc)}
          onClose={() => setLeaveDoc(null)}
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

      {scheduleDoc && (
        <CreateScheduleDialog
          isOpen={Boolean(scheduleDoc)}
          onClose={() => setScheduleDoc(null)}
          tenantId={tenantId}
          partnerId={partnerId}
          organizationId={organizationId}
          branchId={branchId}
          actorId={actorId}
          actorRole={actorRole}
          doctors={doctors}
          onCreateSchedule={onCreateSchedule}
        />
      )}

      {locationDoc && (
        <AssignDoctorLocationDialog
          isOpen={Boolean(locationDoc)}
          onClose={() => setLocationDoc(null)}
          doctor={locationDoc}
          actorId={actorId}
          actorRole={actorRole}
          organizations={organizations}
          facilities={facilities}
          departments={departments.map((d) => ({ ...d, organizationId }))}
          onAssignLocation={onAssignLocation}
        />
      )}
    </div>
  );
};
