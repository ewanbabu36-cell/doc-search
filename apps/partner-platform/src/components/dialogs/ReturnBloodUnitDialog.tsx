import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { BloodComponentDto, ReturnBloodUnitRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  unit: BloodComponentDto | null;
  onSubmit: (req: ReturnBloodUnitRequest) => Promise<void>;
  tenantId: string;
}

export const ReturnBloodUnitDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  unit,
  onSubmit,
  tenantId
}) => {
  const [nurse, setNurse] = useState('Nurse Lisa Monroe, RN');
  const [reason, setReason] = useState('Surgery concluded without requiring packed red blood cell transfusion.');
  const [coldChain, setColdChain] = useState(true);
  const [reEntry, setReEntry] = useState(true);
  const [officer, setOfficer] = useState('Samantha Ray, SBB');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !unit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        componentId: unit.id,
        returnedByNurse: nurse,
        returnReason: reason,
        transportTemperatureMaintained: coldChain,
        reEntryApproved: reEntry,
        evaluatingOfficer: officer
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Process Blood Unit Return</h2>
        <p className="text-xs text-gray-500 mb-4">{unit.componentCode} ({unit.bloodGroup})</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Returned By Nurse</label>
            <Input value={nurse} onChange={(e) => setNurse(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Return Reason</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <input type="checkbox" checked={coldChain} onChange={(e) => setColdChain(e.target.checked)} className="rounded" />
                Validated Cold-Chain &lt; 30 mins rule maintained
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <input type="checkbox" checked={reEntry} onChange={(e) => setReEntry(e.target.checked)} className="rounded" />
                Approve Re-Entry into Usable Stock
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Evaluating Blood Bank Officer</label>
            <Input value={officer} onChange={(e) => setOfficer(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Processing...' : 'Complete Return Assessment'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
