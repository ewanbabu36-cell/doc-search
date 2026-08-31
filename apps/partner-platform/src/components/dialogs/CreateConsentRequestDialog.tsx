import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { CreateConsentRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateConsentRequest) => Promise<void>;
}

export const CreateConsentRequestDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [patientAbhaAddress, setPatientAbhaAddress] = useState('gopal.krishna@abdm');
  const [requesterHipOrHiu, setRequesterHipOrHiu] = useState('AIIMS New Delhi (HIU-001)');
  const [purposeCode, setPurposeCode] = useState<'CARETREAT' | 'PUBHLTH' | 'BTCHQ' | 'DSRCH'>('CARETREAT');
  const [purposeDescription, setPurposeDescription] = useState('Second Opinion for Coronary Angiography');
  const [dateFrom, setDateFrom] = useState('2025-01-01');
  const [dateTo, setDateTo] = useState('2026-08-30');
  const [dataEraseDate, setDataEraseDate] = useState('2026-11-30');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        patientAbhaAddress,
        requesterHipOrHiu,
        purposeCode,
        purposeDescription,
        dateFrom,
        dateTo,
        dataEraseDate,
        careContextRefs: ['VISIT-OPD-2026-8819', 'DIAG-LAB-2026-4412']
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-emerald-900">🛡️ Create ABDM Consent Request (HIU Gateway)</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Patient ABHA Address</label>
            <Input value={patientAbhaAddress} onChange={(e) => setPatientAbhaAddress(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Requesting HIU Facility</label>
            <Input value={requesterHipOrHiu} onChange={(e) => setRequesterHipOrHiu(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Date From</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Date To</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Purpose Code</label>
              <Select
                value={purposeCode}
                onChange={(e) => setPurposeCode(e.target.value as 'CARETREAT' | 'PUBHLTH' | 'BTCHQ' | 'DSRCH')}
                options={[
                  { value: 'CARETREAT', label: 'Care & Treatment' },
                  { value: 'PUBHLTH', label: 'Public Health Tracking' },
                  { value: 'BTCHQ', label: 'Healthcare Quality' },
                  { value: 'DSRCH', label: 'Clinical Research' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Auto-Erase Date</label>
              <Input type="date" value={dataEraseDate} onChange={(e) => setDataEraseDate(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Purpose Description</label>
            <Input value={purposeDescription} onChange={(e) => setPurposeDescription(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Broadcasting...' : 'Send Consent Request'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
