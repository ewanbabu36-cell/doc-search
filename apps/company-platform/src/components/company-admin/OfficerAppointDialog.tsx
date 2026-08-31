import React, { useState } from 'react';
import type { InternalEmployeeDto, ComplianceOfficerRole } from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface OfficerAppointDialogProps {
  isOpen: boolean;
  onClose: () => void;
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

export const OfficerAppointDialog: React.FC<OfficerAppointDialogProps> = ({
  isOpen,
  onClose,
  employees,
  onAppointOfficer
}) => {
  const [officerCode, setOfficerCode] = useState(`off-${Date.now().toString().slice(-4)}`);
  const [officerRole, setOfficerRole] = useState<ComplianceOfficerRole>('HIPAA_PRIVACY_OFFICER');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employees[0]?.id ?? '');
  const [regulatoryRef, setRegulatoryRef] = useState('U.S. HHS Office for Civil Rights (OCR) / HIPAA Entity Registry');
  const [reason, setReason] = useState('Formal corporate compliance appointment');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedEmp = employees.find((e) => e.id === selectedEmployeeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) {
      setError('Please select an active internal employee.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('A mandatory business justification is required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onAppointOfficer(
        officerCode,
        officerRole,
        selectedEmp.id,
        `${selectedEmp.firstName} ${selectedEmp.lastName}`,
        selectedEmp.workEmail,
        regulatoryRef,
        reason
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to appoint officer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Appoint Corporate Compliance Officer"
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Confirm Appointment
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Statutory Officer Designation">
          Appointing a HIPAA Privacy/Security Officer or Data Protection Officer records formal regulatory authority registration and updates enterprise compliance governance records.
        </Alert>

        {error && <Alert type="error" title="Appointment Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Officer Code *
          </label>
          <Input
            value={officerCode}
            onChange={(e) => setOfficerCode(e.target.value)}
            placeholder="e.g. off-hipaa-privacy"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Compliance Role *
          </label>
          <Select
            value={officerRole}
            onChange={(e) => setOfficerRole(e.target.value as ComplianceOfficerRole)}
            options={[
              { value: 'HIPAA_PRIVACY_OFFICER', label: 'HIPAA Privacy Officer (HHS OCR)' },
              { value: 'HIPAA_SECURITY_OFFICER', label: 'HIPAA Security Officer (NIST CSF)' },
              { value: 'CHIEF_COMPLIANCE_OFFICER', label: 'Chief Compliance Officer (CCO)' },
              { value: 'DATA_PROTECTION_OFFICER', label: 'Data Protection Officer (GDPR / UK ICO)' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Internal Employee Appointee *
          </label>
          <Select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            options={employees.map((emp) => ({
              value: emp.id,
              label: `${emp.firstName} ${emp.lastName} — ${emp.designationTitle} (${emp.workEmail})`
            }))}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Regulatory Authority Reference *
          </label>
          <Input
            value={regulatoryRef}
            onChange={(e) => setRegulatoryRef(e.target.value)}
            placeholder="e.g. U.S. HHS Office for Civil Rights / UK ICO Registration #..."
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Justification *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Formal board appointment of corporate privacy officer"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
