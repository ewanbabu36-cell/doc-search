import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { OTScheduleDto, RecordConsumableUsageRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  schedule: OTScheduleDto | null;
  onSubmit: (req: RecordConsumableUsageRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const RecordConsumableUsageDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  schedule,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [itemCode, setItemCode] = useState('CSM-VICRYL-2-0');
  const [itemName, setItemName] = useState('Vicryl 2-0 Suture Packet');
  const [batchNumber, setBatchNumber] = useState('BATCH-2026-VC');
  const [quantity, setQuantity] = useState('2');
  const [unitPrice, setUnitPrice] = useState('650');
  const [recordedBy, setRecordedBy] = useState('Nurse Jennifer Adams');
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
        itemCode,
        itemName,
        batchNumber,
        quantityUsed: parseFloat(quantity) || 1,
        unitOfMeasure: 'PACK',
        unitPrice: parseFloat(unitPrice) || 650,
        recordedBy
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Record Consumable Usage</h2>
        <p className="text-xs text-gray-500 mb-4">{schedule.patientName} — {schedule.procedureName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Item Code</label>
              <Input value={itemCode} onChange={(e) => setItemCode(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Item Name</label>
              <Input value={itemName} onChange={(e) => setItemName(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Batch #</label>
              <Input value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity</label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Unit Price (₹)</label>
              <Input type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Recorded By Nurse</label>
            <Input value={recordedBy} onChange={(e) => setRecordedBy(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Deducting...' : 'Deduct from OT Inventory'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
