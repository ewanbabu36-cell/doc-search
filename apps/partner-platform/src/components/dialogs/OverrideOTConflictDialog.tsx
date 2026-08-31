import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { OverrideOTConflictRequest, OTScheduleDto } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  schedule: OTScheduleDto | null;
  onSubmit: (req: OverrideOTConflictRequest) => Promise<void>;
  tenantId: string;
}

export const OverrideOTConflictDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  schedule,
  onSubmit,
  tenantId
}) => {
  const [authorizedBy, setAuthorizedBy] = useState('Dr. Arthur Vance');
  const [authorizedRole, setAuthorizedRole] = useState('CHIEF_MEDICAL_OFFICER');
  const [conflictType, setConflictType] = useState('SCHEDULE_OVERLAP_OVERRIDE');
  const [justification, setJustification] = useState('Emergency prioritization approved by clinical directorship');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !schedule) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        scheduleId: schedule.id,
        tenantId,
        authorizedBy,
        authorizedRole,
        conflictType,
        justification
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-amber-600 mb-2">Override OT Scheduling Conflict</h2>
        <p className="text-xs text-gray-500 mb-4">{schedule.scheduleNumber} — {schedule.patientName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Conflict Type</label>
            <Input value={conflictType} onChange={(e) => setConflictType(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Authorizer Name</label>
              <Input value={authorizedBy} onChange={(e) => setAuthorizedBy(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Authorizer Role</label>
              <Input value={authorizedRole} onChange={(e) => setAuthorizedRole(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Override Justification</label>
            <Input value={justification} onChange={(e) => setJustification(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Applying...' : 'Apply Authorization Override'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
