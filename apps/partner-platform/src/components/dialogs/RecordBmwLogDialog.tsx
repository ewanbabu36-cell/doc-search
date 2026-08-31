import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { RecordBmwLogRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RecordBmwLogRequest) => Promise<void>;
}

export const RecordBmwLogDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0] || '2026-08-30');
  const [departmentName, setDepartmentName] = useState('Hospital Wide Central Waste Facility');
  const [yellowBagWeightKg, setYellowBagWeightKg] = useState(140.0);
  const [redBagWeightKg, setRedBagWeightKg] = useState(195.0);
  const [whiteTranslucentWeightKg, setWhiteTranslucentWeightKg] = useState(18.0);
  const [blueBagWeightKg, setBlueBagWeightKg] = useState(42.0);
  const [pcbManifestBarcode, setPcbManifestBarcode] = useState('');
  const [handedOverToVendorName, setHandedOverToVendorName] = useState('Medicare Environmental Management Pvt Ltd');
  const [hospitalSupervisorName, setHospitalSupervisorName] = useState('Mr. Ramesh Kulkarni (Housekeeping Lead)');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        logDate,
        departmentName,
        yellowBagWeightKg,
        redBagWeightKg,
        whiteTranslucentWeightKg,
        blueBagWeightKg,
        pcbManifestBarcode: pcbManifestBarcode || `PCB-MH-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
        handedOverToVendorName,
        hospitalSupervisorName
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900">Biomedical Waste (BMW) Daily Manifest & Weighment</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Log Date</label>
              <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Facility Point</label>
              <Input value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 bg-yellow-50 border border-yellow-300 rounded">
              <label className="block text-xs font-bold text-yellow-900 mb-1">🟡 Yellow (Anatomical/Soiled) (kg)</label>
              <Input type="number" step="0.5" value={String(yellowBagWeightKg)} onChange={(e) => setYellowBagWeightKg(Number(e.target.value))} required />
            </div>
            <div className="p-2 bg-red-50 border border-red-300 rounded">
              <label className="block text-xs font-bold text-red-900 mb-1">🔴 Red (Contaminated Plastic) (kg)</label>
              <Input type="number" step="0.5" value={String(redBagWeightKg)} onChange={(e) => setRedBagWeightKg(Number(e.target.value))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 bg-gray-50 border border-gray-300 rounded">
              <label className="block text-xs font-bold text-gray-900 mb-1">⚪ White (Sharps/Needles) (kg)</label>
              <Input type="number" step="0.5" value={String(whiteTranslucentWeightKg)} onChange={(e) => setWhiteTranslucentWeightKg(Number(e.target.value))} required />
            </div>
            <div className="p-2 bg-blue-50 border border-blue-300 rounded">
              <label className="block text-xs font-bold text-blue-900 mb-1">🔵 Blue (Glassware/Metallic) (kg)</label>
              <Input type="number" step="0.5" value={String(blueBagWeightKg)} onChange={(e) => setBlueBagWeightKg(Number(e.target.value))} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">PCB Manifest Barcode (auto if blank)</label>
            <Input value={pcbManifestBarcode} onChange={(e) => setPcbManifestBarcode(e.target.value)} placeholder="e.g. PCB-MH-2026-88129" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Authorized CBMWTF Vendor</label>
              <Input value={handedOverToVendorName} onChange={(e) => setHandedOverToVendorName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Hospital Sanitation Supervisor</label>
              <Input value={hospitalSupervisorName} onChange={(e) => setHospitalSupervisorName(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Recording...' : 'Log & Generate Manifest'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
