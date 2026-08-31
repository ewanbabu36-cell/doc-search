import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { BiomedicalAssetDto, CreateCondemnationRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  asset: BiomedicalAssetDto;
  onClose: () => void;
  onSubmit: (data: CreateCondemnationRequest) => Promise<void>;
}

export const ProposeCondemnationDialog: React.FC<Props> = ({ isOpen, asset, onClose, onSubmit }) => {
  const [reasonForCondemnation, setReasonForCondemnation] = useState('Beyond economical repair (BER); mainboard failure; OEM spares discontinued.');
  const [condemnationBoardChairman, setCondemnationBoardChairman] = useState('Dr. Alok Verma (Medical Director)');
  const [estimatedScrapValue, setEstimatedScrapValue] = useState(15000);
  const [hazardousDisposalProtocol, setHazardousDisposalProtocol] = useState('Authorized E-waste recycling protocol with PCB decontamination');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        assetId: asset.id,
        reasonForCondemnation,
        condemnationBoardChairman,
        estimatedScrapValue,
        hazardousDisposalProtocol
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Propose Asset Condemnation / Decommissioning</h2>
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs space-y-1">
          <p><strong>Equipment:</strong> {asset.assetName} ({asset.assetCode})</p>
          <p><strong>Installed:</strong> {asset.installationDate} | Purchase: ₹{asset.purchaseCost.toLocaleString()}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Condemnation</label>
            <Input value={reasonForCondemnation} onChange={(e) => setReasonForCondemnation(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Condemnation Board Chairman</label>
            <Input value={condemnationBoardChairman} onChange={(e) => setCondemnationBoardChairman(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Estimated Scrap / Salvage Value (₹)</label>
              <Input type="number" value={String(estimatedScrapValue)} onChange={(e) => setEstimatedScrapValue(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Disposal Protocol</label>
              <Input value={hazardousDisposalProtocol} onChange={(e) => setHazardousDisposalProtocol(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit to Board'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
