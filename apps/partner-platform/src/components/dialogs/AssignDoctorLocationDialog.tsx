import React, { useState } from 'react';
import type {
  DoctorProfileDto,
  AssignDoctorLocationRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface AssignDoctorLocationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorProfileDto;
  actorId: string;
  actorRole: string;
  organizations: { id: string; organizationName: string }[];
  facilities: { id: string; facilityName: string; organizationId: string }[];
  departments: { id: string; departmentName: string; organizationId: string }[];
  onAssignLocation: (req: AssignDoctorLocationRequest) => Promise<void>;
}

export const AssignDoctorLocationDialog: React.FC<AssignDoctorLocationDialogProps> = ({
  isOpen,
  onClose,
  doctor,
  actorId,
  actorRole,
  organizations,
  facilities,
  departments,
  onAssignLocation
}) => {
  const [toOrgId, setToOrgId] = useState(doctor.organizationId);
  const filteredFacilities = facilities.filter((f) => f.organizationId === toOrgId);
  const filteredDepartments = departments.filter((d) => d.organizationId === toOrgId);

  const [toBranchId, setToBranchId] = useState(filteredFacilities[0]?.id ?? doctor.branchId);
  const [toDeptId, setToDeptId] = useState(filteredDepartments[0]?.id ?? doctor.departmentId);
  const [reason, setReason] = useState('Doctor facility and department assignment');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOrgChange = (newOrgId: string) => {
    setToOrgId(newOrgId);
    const facs = facilities.filter((f) => f.organizationId === newOrgId);
    const depts = departments.filter((d) => d.organizationId === newOrgId);
    if (facs[0]) setToBranchId(facs[0].id);
    if (depts[0]) setToDeptId(depts[0].id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toBranchId) {
      setError('Destination facility branch is required.');
      return;
    }
    if (!toDeptId) {
      setError('Destination department is required.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onAssignLocation({
        actorId,
        actorRole,
        tenantId: doctor.tenantId,
        partnerId: doctor.partnerId,
        doctorId: doctor.id,
        toOrganizationId: toOrgId,
        toBranchId,
        toDepartmentId: toDeptId,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reassign doctor location');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Reassign Clinical Location: ${doctor.fullName}`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Confirm Reassignment
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="warning" title="Audited Clinical Duty Assignment">
          Reassigning doctor branch or department updates active consultation rooms and patient queue routing rules.
        </Alert>

        {error && <Alert type="error" title="Assignment Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Current Assigned Facility
          </label>
          <Input
            value={`${doctor.branchName ?? 'Branch'} · ${doctor.departmentName ?? 'Department'}`}
            readOnly
            disabled
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Target Organization *
          </label>
          <Select
            value={toOrgId}
            onChange={(e) => handleOrgChange(e.target.value)}
            options={organizations.map((o) => ({
              value: o.id,
              label: o.organizationName
            }))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Target Facility Branch *
            </label>
            <Select
              value={toBranchId}
              onChange={(e) => setToBranchId(e.target.value)}
              options={filteredFacilities.map((f) => ({
                value: f.id,
                label: f.facilityName
              }))}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Target Clinical Department *
            </label>
            <Select
              value={toDeptId}
              onChange={(e) => setToDeptId(e.target.value)}
              options={filteredDepartments.map((d) => ({
                value: d.id,
                label: d.departmentName
              }))}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Assigned attending physician to Westside clinic for expanded morning coverage"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
