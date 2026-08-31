import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { CreateSparePartRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSparePartRequest) => Promise<void>;
}

export const RegisterSparePartDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [partCode, setPartCode] = useState('');
  const [partName, setPartName] = useState('');
  const [compatibleModelsInput, setCompatibleModelsInput] = useState('Hamilton-G5, Hamilton-C6');
  const [manufacturer, setManufacturer] = useState('Hamilton Medical');
  const [quantityOnHand, setQuantityOnHand] = useState(5);
  const [minimumThresholdQuantity, setMinimumThresholdQuantity] = useState(2);
  const [unitCost, setUnitCost] = useState(18500);
  const [storageBinLocation, setStorageBinLocation] = useState('BME-STORE-A1');
  const [isCriticalSpare, setIsCriticalSpare] = useState(true);
  const [leadTimeDays, setLeadTimeDays] = useState(7);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        partCode,
        partName,
        compatibleModels: compatibleModelsInput.split(',').map((m) => m.trim()),
        manufacturer,
        quantityOnHand,
        minimumThresholdQuantity,
        unitCost,
        storageBinLocation,
        isCriticalSpare,
        leadTimeDays
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900">Add Biomedical Spare Part / Component</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Part SKU / Code</label>
            <Input value={partCode} onChange={(e) => setPartCode(e.target.value)} placeholder="e.g. SP-VENT-VALVE-02" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Part Description</label>
            <Input value={partName} onChange={(e) => setPartName(e.target.value)} placeholder="e.g. O2 Cell Sensor" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Compatible Models (comma separated)</label>
            <Input value={compatibleModelsInput} onChange={(e) => setCompatibleModelsInput(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Manufacturer</label>
              <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Storage Bin</label>
              <Input value={storageBinLocation} onChange={(e) => setStorageBinLocation(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Qty</label>
              <Input type="number" value={String(quantityOnHand)} onChange={(e) => setQuantityOnHand(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Min Threshold</label>
              <Input type="number" value={String(minimumThresholdQuantity)} onChange={(e) => setMinimumThresholdQuantity(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Unit Cost (₹)</label>
              <Input type="number" value={String(unitCost)} onChange={(e) => setUnitCost(Number(e.target.value))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Lead Time (Days)</label>
              <Input type="number" value={String(leadTimeDays)} onChange={(e) => setLeadTimeDays(Number(e.target.value))} required />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="crit-chk" checked={isCriticalSpare} onChange={(e) => setIsCriticalSpare(e.target.checked)} className="rounded" />
              <label htmlFor="crit-chk" className="text-xs font-semibold text-gray-700">Critical Life-Support Spare</label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Spare Part'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
