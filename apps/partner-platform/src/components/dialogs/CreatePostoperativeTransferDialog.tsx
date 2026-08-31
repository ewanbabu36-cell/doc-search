import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { OTScheduleDto, CreatePostoperativeTransferRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  schedule: OTScheduleDto | null;
  onSubmit: (req: CreatePostoperativeTransferRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreatePostoperativeTransferDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  schedule,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [destinationWard, setDestinationWard] = useState('Ward 4 (Post-Op Surgical)');
  const [destinationBed, setDestinationBed] = useState('BED-402');
  const [transferringNurse, setTransferringNurse] = useState('Nurse David Miller');
  const [receivingNurse, setReceivingNurse] = useState('Ward Nurse Clara Oswald');
  const [summary, setSummary] = useState('Aldrete 10/10; conscious, stable vitals, surgical dressing intact');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !schedule) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        scheduleId: schedule.id,
        patientId: schedule.patientId,
        patientName: schedule.patientName,
        originLocation: 'PACU_RECOVERY',
        destinationWardOrICU: destinationWard,
        destinationBedNumber: destinationBed,
        transferringNurse,
        receivingNurse,
        clinicalConditionSummary: summary
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Post-Operative Ward Handover</h2>
        <p className="text-xs text-gray-500 mb-4">{schedule.patientName} — Step down from PACU</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Destination Ward / ICU</label>
              <Input value={destinationWard} onChange={(e) => setDestinationWard(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Bed Number</label>
              <Input value={destinationBed} onChange={(e) => setDestinationBed(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Transferring Nurse (PACU)</label>
              <Input value={transferringNurse} onChange={(e) => setTransferringNurse(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Receiving Nurse (Ward/ICU)</label>
              <Input value={receivingNurse} onChange={(e) => setReceivingNurse(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Handover Clinical Summary</label>
            <Input value={summary} onChange={(e) => setSummary(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Completing...' : 'Execute Step-Down Transfer'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
