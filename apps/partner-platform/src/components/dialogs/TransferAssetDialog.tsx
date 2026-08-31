import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { BiomedicalAssetDto, CreateAssetTransferRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  asset: BiomedicalAssetDto;
  onClose: () => void;
  onSubmit: (data: CreateAssetTransferRequest) => Promise<void>;
}

export const TransferAssetDialog: React.FC<Props> = ({ isOpen, asset, onClose, onSubmit }) => {
  const [toDepartment, setToDepartment] = useState('Emergency Department (ED)');
  const [toLocation, setToLocation] = useState('Ground Floor, Trauma Bay 1');
  const [transferReason, setTransferReason] = useState('Urgent equipment reallocation for high patient acuity case');
  const [initiatedBy, setInitiatedBy] = useState('Dr. Suresh Menon (Clinical Lead)');
  const [approvedBy, setApprovedBy] = useState('Er. Rajesh Nair (BME)');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        assetId: asset.id,
        toDepartment,
        toLocation,
        transferReason,
        initiatedBy,
        approvedBy
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Transfer Asset ({asset.assetCode})</h2>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1">
          <p><strong>Equipment:</strong> {asset.assetName}</p>
          <p><strong>Current:</strong> {asset.departmentName} ({asset.physicalLocation})</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Destination Department</label>
            <Input value={toDepartment} onChange={(e) => setToDepartment(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Destination Room / Bed Location</label>
            <Input value={toLocation} onChange={(e) => setToLocation(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical / Operational Justification</label>
            <Input value={transferReason} onChange={(e) => setTransferReason(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Initiated By</label>
              <Input value={initiatedBy} onChange={(e) => setInitiatedBy(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Approved By</label>
              <Input value={approvedBy} onChange={(e) => setApprovedBy(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Transferring...' : 'Authorize Transfer'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
