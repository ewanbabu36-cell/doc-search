import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { MedicalRecordIndexDto, CreateRecordCompletionTaskRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record: MedicalRecordIndexDto | null;
  onSubmit: (req: CreateRecordCompletionTaskRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateRecordCompletionDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  record,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [deficiencyType, setDeficiencyType] = useState('MISSING_PHYSICIAN_SIGNATURE');
  const [staffName, setStaffName] = useState(record?.primaryAttendingDoctor || 'Dr. Evelyn Reed, MD');
  const [staffRole, setStaffRole] = useState('ATTENDING_PHYSICIAN');
  const [description, setDescription] = useState('Discharge summary and progress notes pending electronic authentication.');
  const [dueDate, setDueDate] = useState('2026-09-02T17:00:00.000Z');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        recordId: record.id,
        deficiencyType,
        responsibleStaffName: staffName,
        responsibleStaffRole: staffRole,
        description,
        dueDate
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Create Record Deficiency Task</h2>
        <p className="text-xs text-gray-500 mb-4">{record.recordNumber} — {record.patientName} ({record.patientMrn})</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Deficiency Category</label>
            <select value={deficiencyType} onChange={(e) => setDeficiencyType(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="MISSING_PHYSICIAN_SIGNATURE">Missing Physician Signature</option>
              <option value="INCOMPLETE_DISCHARGE_SUMMARY">Incomplete Discharge Summary</option>
              <option value="MISSING_OPERATIVE_NOTE">Missing Operative Note</option>
              <option value="MISSING_SURGICAL_CONSENT">Missing Surgical Consent</option>
              <option value="PENDING_PATHOLOGY_REPORT">Pending Diagnostic / Lab Confirmation</option>
              <option value="INCOMPLETE_NURSING_FLOWSHEET">Incomplete Nursing Flowsheet</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Responsible Clinician</label>
              <Input value={staffName} onChange={(e) => setStaffName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Clinician Role</label>
              <Input value={staffRole} onChange={(e) => setStaffRole(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Task Description & Deficiency Detail</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Resolution Deadline</label>
            <Input type="datetime-local" value={dueDate.slice(0, 16)} onChange={(e) => setDueDate(new Date(e.target.value).toISOString())} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Assign Deficiency Task'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
