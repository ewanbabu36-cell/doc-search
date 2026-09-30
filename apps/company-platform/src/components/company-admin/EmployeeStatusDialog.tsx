import React, { useState } from 'react';
import type { InternalEmployeeDto, EmploymentStatus } from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface EmployeeStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employee: InternalEmployeeDto;
  onUpdateStatus: (employeeId: string, status: EmploymentStatus, reason: string) => Promise<void>;
}

export const EmployeeStatusDialog: React.FC<EmployeeStatusDialogProps> = ({
  isOpen,
  onClose,
  employee,
  onUpdateStatus
}) => {
  const [status, setStatus] = useState<EmploymentStatus>(employee.employmentStatus);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFounder =
    (employee.firstName?.toUpperCase() === 'MERAJ' && employee.lastName?.toUpperCase() === 'SHARIF') ||
    employee.workEmail?.toLowerCase() === 'founder@docsearch.health' ||
    employee.workEmail?.toLowerCase() === 'meraj@docsearch.health' ||
    Boolean((employee.metadata as any)?.isProtectedFounder);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFounder) {
      setError('IMMUTABLE FOUNDER SHIELD ACTIVE: Meraj Sharif is the Company Founder & Root Account. This profile cannot be modified, updated, deactivated, or removed.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('A mandatory business justification (at least 3 characters) is required for employee status changes.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onUpdateStatus(employee.id, status, reason);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update employee status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Update Employee Status: ${employee.firstName} ${employee.lastName}`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting} disabled={isFounder}>
            Save Status
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {isFounder && (
          <Alert type="warning" title="🛡️ IMMUTABLE FOUNDER SHIELD ACTIVE">
            <strong>MERAJ SHARIF</strong> is the corporate Founder & SuperAdmin root account. Status changes, suspensions, and terminations are strictly prohibited and locked by system governance.
          </Alert>
        )}
        <Alert type="info" title="Audited Corporate HR Action">
          Employee employment status transitions generate an authoritative cryptographic record in <code>core.audit_events</code>.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Employee Code & Designation
          </label>
          <Input
            value={`${employee.employeeCode} — ${employee.designationTitle} (${employee.departmentName})`}
            readOnly
            disabled
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Employment Status *
          </label>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as EmploymentStatus)}
            options={[
              { value: 'ACTIVE', label: 'Active Staff Member' },
              { value: 'ON_LEAVE', label: 'On Approved Leave' },
              { value: 'SUSPENDED', label: 'Suspended' },
              { value: 'TERMINATED', label: 'Terminated / Departed' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Justification *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Approved sabbatical, promotion transition, or formal departure"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
