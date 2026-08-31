import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { OTScheduleDto, AssignSurgicalTeamRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  schedule: OTScheduleDto | null;
  onSubmit: (req: AssignSurgicalTeamRequest) => Promise<void>;
  tenantId: string;
}

export const AssignSurgicalTeamDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  schedule,
  onSubmit,
  tenantId
}) => {
  const [primarySurgeon, setPrimarySurgeon] = useState(schedule?.primarySurgeonName || '');
  const [assistantSurgeon, setAssistantSurgeon] = useState(schedule?.assistantSurgeonName || 'Dr. Allison Cameron');
  const [leadAnaesthetist, setLeadAnaesthetist] = useState(schedule?.leadAnaesthetistName || '');
  const [scrubNurse, setScrubNurse] = useState(schedule?.scrubNurseName || '');
  const [circulatingNurse, setCirculatingNurse] = useState(schedule?.circulatingNurseName || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !schedule) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        scheduleId: schedule.id,
        tenantId,
        primarySurgeonName: primarySurgeon,
        assistantSurgeonName: assistantSurgeon,
        leadAnaesthetistName: leadAnaesthetist,
        scrubNurseName: scrubNurse,
        circulatingNurseName: circulatingNurse,
        assignedBy: 'OT Manager'
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Assign Surgical Team</h2>
        <p className="text-xs text-gray-500 mb-4">{schedule.scheduleNumber} — {schedule.procedureName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Lead Surgeon</label>
            <Input value={primarySurgeon} onChange={(e) => setPrimarySurgeon(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assistant Surgeon</label>
            <Input value={assistantSurgeon} onChange={(e) => setAssistantSurgeon(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Lead Anaesthetist</label>
            <Input value={leadAnaesthetist} onChange={(e) => setLeadAnaesthetist(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Scrub Nurse</label>
              <Input value={scrubNurse} onChange={(e) => setScrubNurse(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Circulating Nurse</label>
              <Input value={circulatingNurse} onChange={(e) => setCirculatingNurse(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Assigning...' : 'Save Assignments'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
