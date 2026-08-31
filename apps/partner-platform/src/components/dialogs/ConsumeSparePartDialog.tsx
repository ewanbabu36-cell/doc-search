import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { BiomedicalAssetDto, SparePartDto, ConsumeSparePartRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  assets: BiomedicalAssetDto[];
  spareParts: SparePartDto[];
  onClose: () => void;
  onSubmit: (data: ConsumeSparePartRequest) => Promise<void>;
}

export const ConsumeSparePartDialog: React.FC<Props> = ({ isOpen, assets, spareParts, onClose, onSubmit }) => {
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || '');
  const [selectedPartId, setSelectedPartId] = useState(spareParts[0]?.id || '');
  const [quantityUsed, setQuantityUsed] = useState(1);
  const [usedByEngineer, setUsedByEngineer] = useState('Er. Rajesh Nair (BME)');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        assetId: selectedAssetId,
        partId: selectedPartId,
        quantityUsed,
        usedByEngineer
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Consume Replacement Spare Part</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Target Asset</label>
            <Select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              options={assets.map((a) => ({ value: a.id, label: `${a.assetCode} - ${a.assetName}` }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Spare Part Item</label>
            <Select
              value={selectedPartId}
              onChange={(e) => setSelectedPartId(e.target.value)}
              options={spareParts.map((p) => ({ value: p.id, label: `${p.partName} (Qty: ${p.quantityOnHand} @ ₹${p.unitCost})` }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity Used</label>
            <Input type="number" min="1" value={String(quantityUsed)} onChange={(e) => setQuantityUsed(Number(e.target.value))} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Engineer Authorizing Consumption</label>
            <Input value={usedByEngineer} onChange={(e) => setUsedByEngineer(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Consuming...' : 'Confirm Consumption'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
