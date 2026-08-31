import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { OTScheduleDto, CreateSurgicalImplantRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  schedule: OTScheduleDto | null;
  onSubmit: (req: CreateSurgicalImplantRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateImplantRecordDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  schedule,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [implantName, setImplantName] = useState('Porous Coated Femoral Component (Size 4)');
  const [implantType, setImplantType] = useState('ORTHOPAEDIC_IMPLANT');
  const [manufacturer, setManufacturer] = useState('Stryker Orthopaedics');
  const [model, setModel] = useState('TRICONE-442');
  const [lot, setLot] = useState('LOT-88219');
  const [site, setSite] = useState('Right Distal Femur');
  const [vendor, setVendor] = useState('Apex Surgical Technologies');
  const [cost, setCost] = useState('45000');
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
        implantName,
        implantType,
        manufacturerName: manufacturer,
        modelNumber: model,
        serialOrLotNumber: lot,
        anatomicPlacementSite: site,
        implantedBySurgeon: schedule.primarySurgeonName,
        supplierOrVendor: vendor,
        unitCost: parseFloat(cost) || 45000
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Record Implant & Prosthesis</h2>
        <p className="text-xs text-gray-500 mb-4">{schedule.patientName} — {schedule.procedureName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Implant / Device Description</label>
              <Input value={implantName} onChange={(e) => setImplantName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Implant Type</label>
              <Input value={implantType} onChange={(e) => setImplantType(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Manufacturer</label>
              <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Model Number</label>
              <Input value={model} onChange={(e) => setModel(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Batch / Serial / Lot #</label>
              <Input value={lot} onChange={(e) => setLot(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Anatomic Placement Site</label>
              <Input value={site} onChange={(e) => setSite(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Supplier / Vendor</label>
              <Input value={vendor} onChange={(e) => setVendor(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Unit Cost (₹)</label>
              <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Recording...' : 'Register Implant Usage'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
