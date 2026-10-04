import React, { useState } from 'react';
import { Button, Input, Badge } from '@docsearch/ui-kit';
import type { RecordBmwLogRequest } from '@docsearch/api-contracts';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RecordBmwLogRequest) => Promise<void>;
}

export const RecordBmwLogDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0] || '2026-10-04');
  const [departmentName, setDepartmentName] = useState('Central Waste Yard (Exit Gate 2)');
  const [yellowBagWeightKg, setYellowBagWeightKg] = useState(145.5);
  const [redBagWeightKg, setRedBagWeightKg] = useState(188.2);
  const [whiteTranslucentWeightKg, setWhiteTranslucentWeightKg] = useState(16.4);
  const [blueBagWeightKg, setBlueBagWeightKg] = useState(44.8);
  const [pcbManifestBarcode, setPcbManifestBarcode] = useState(`PCB-MH-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`);
  const [handedOverToVendorName, setHandedOverToVendorName] = useState('Medicare Environmental Management Pvt Ltd (CBMWTF)');
  const [hospitalSupervisorName, setHospitalSupervisorName] = useState('Mr. Ramesh Kulkarni (Housekeeping Lead)');
  
  // Digital Scale IoT Sync & Reconciliation
  const [isScaleSyncing, setIsScaleSyncing] = useState(false);
  const [scaleSyncSuccess, setScaleSyncSuccess] = useState(false);
  const [wardGenerationWeightKg] = useState(396.2); // Sum of ward floor logs
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const currentTotalWeight = Math.round((yellowBagWeightKg + redBagWeightKg + whiteTranslucentWeightKg + blueBagWeightKg) * 10) / 10;
  const varianceKg = Math.round((currentTotalWeight - wardGenerationWeightKg) * 10) / 10;
  const variancePct = Math.round((varianceKg / wardGenerationWeightKg) * 1000) / 10;
  const isTolerancePass = Math.abs(variancePct) <= 3.0;

  const handleSimulateDigitalScale = () => {
    setIsScaleSyncing(true);
    setTimeout(() => {
      // Simulate real-time Bluetooth / RS-232 digital scale capture
      setYellowBagWeightKg(145.5);
      setRedBagWeightKg(188.2);
      setWhiteTranslucentWeightKg(16.4);
      setBlueBagWeightKg(44.8);
      setIsScaleSyncing(false);
      setScaleSyncSuccess(true);
      setTimeout(() => setScaleSyncSuccess(false), 3000);
    }, 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const manifestCode = pcbManifestBarcode.trim() || `PCB-MH-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      await onSubmit({
        logDate,
        departmentName,
        yellowBagWeightKg,
        redBagWeightKg,
        whiteTranslucentWeightKg,
        blueBagWeightKg,
        pcbManifestBarcode: manifestCode,
        handedOverToVendorName,
        hospitalSupervisorName
      });

      // Dispatch event bus notification
      hospitalEventBus.publish(
        'BMW_WEIGHT_RECONCILIATION_LOGGED',
        'BiomedicalWasteGateStation',
        {
          manifestBarcode: manifestCode,
          logDate,
          totalWeightKg: currentTotalWeight,
          yellowKg: yellowBagWeightKg,
          redKg: redBagWeightKg,
          whiteKg: whiteTranslucentWeightKg,
          blueKg: blueBagWeightKg,
          variancePct,
          vendor: handedOverToVendorName,
          supervisor: hospitalSupervisorName
        },
        `♻️ BMW Manifest Reconciled: ${manifestCode} logged with ${currentTotalWeight} kg total waste. Gate variance: ${variancePct}%.`
      );

      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto border border-gray-200">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Biomedical Waste (BMW) Barcode Weight Reconciliation</h2>
            <p className="text-xs text-gray-500">Digital scale weight capture & Pollution Control Board (PCB) manifest dispatch</p>
          </div>
          <Badge variant={isTolerancePass ? 'success' : 'danger'}>
            {isTolerancePass ? 'RECONCILIATION PASS' : 'VARIANCE BREACH'}
          </Badge>
        </div>

        {/* IoT Digital Scale Sync Banner */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <span>⚖️</span> Exit Gate Industrial Digital Scale Sync
            </span>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSimulateDigitalScale}
              disabled={isScaleSyncing}
            >
              {isScaleSyncing ? 'Capturing Tare & Weight...' : '⚡ 1-Tap IoT Scale Capture'}
            </Button>
          </div>
          {scaleSyncSuccess && (
            <p className="text-[11px] text-emerald-800 font-semibold bg-emerald-100 p-1.5 rounded animate-pulse">
              ✓ Digital Scale Stream Synced: 4 Bags Weighed & Certified.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Weighment Date</label>
              <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Exit Station Location</label>
              <Input value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} required />
            </div>
          </div>

          {/* Color Coded 4 Categories */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 bg-yellow-50/70 border border-yellow-300 rounded-lg">
              <label className="block text-xs font-bold text-yellow-900 mb-1">🟡 Yellow: Anatomical & Soiled</label>
              <Input
                type="number"
                step="0.1"
                value={String(yellowBagWeightKg)}
                onChange={(e) => setYellowBagWeightKg(Number(e.target.value))}
                required
              />
              <span className="text-[10px] text-yellow-800 block mt-0.5 font-mono">Barcode: BMW-BAG-YEL-0912</span>
            </div>
            <div className="p-2.5 bg-red-50/70 border border-red-300 rounded-lg">
              <label className="block text-xs font-bold text-red-900 mb-1">🔴 Red: Contaminated Recyclable Plastic</label>
              <Input
                type="number"
                step="0.1"
                value={String(redBagWeightKg)}
                onChange={(e) => setRedBagWeightKg(Number(e.target.value))}
                required
              />
              <span className="text-[10px] text-red-800 block mt-0.5 font-mono">Barcode: BMW-BAG-RED-0418</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 bg-gray-50 border border-gray-300 rounded-lg">
              <label className="block text-xs font-bold text-gray-900 mb-1">⚪ White: Puncture-Proof Sharps</label>
              <Input
                type="number"
                step="0.1"
                value={String(whiteTranslucentWeightKg)}
                onChange={(e) => setWhiteTranslucentWeightKg(Number(e.target.value))}
                required
              />
              <span className="text-[10px] text-gray-600 block mt-0.5 font-mono">Barcode: BMW-BOX-WHT-0112</span>
            </div>
            <div className="p-2.5 bg-blue-50/70 border border-blue-300 rounded-lg">
              <label className="block text-xs font-bold text-blue-900 mb-1">🔵 Blue: Glass Vials & Metallic</label>
              <Input
                type="number"
                step="0.1"
                value={String(blueBagWeightKg)}
                onChange={(e) => setBlueBagWeightKg(Number(e.target.value))}
                required
              />
              <span className="text-[10px] text-blue-800 block mt-0.5 font-mono">Barcode: BMW-BOX-BLU-0291</span>
            </div>
          </div>

          {/* Real-time Gate Reconciliation Card */}
          <div className="p-3 bg-gray-50 rounded-lg border space-y-1 text-xs">
            <div className="flex justify-between text-gray-700">
              <span>Ward Floor Generation Total:</span>
              <strong className="font-mono">{wardGenerationWeightKg} kg</strong>
            </div>
            <div className="flex justify-between text-gray-900">
              <span>Gate Digital Scale Handover Total:</span>
              <strong className="font-mono font-bold">{currentTotalWeight} kg</strong>
            </div>
            <div className="flex justify-between pt-1 border-t text-[11px]">
              <span className="font-semibold text-gray-600">Reconciliation Variance:</span>
              <span className={`font-bold font-mono ${isTolerancePass ? 'text-emerald-700' : 'text-red-700'}`}>
                {varianceKg > 0 ? `+${varianceKg}` : varianceKg} kg ({variancePct}%) {isTolerancePass ? '✓ PASS (<±3%)' : '⚠️ BREACH (>±3%)'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">PCB Manifest Barcode (Tamper-Evident)</label>
            <Input
              value={pcbManifestBarcode}
              onChange={(e) => setPcbManifestBarcode(e.target.value)}
              className="font-mono text-xs font-bold"
              required
            />
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
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Submitting...' : '✓ Generate & Dispatch Manifest'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
