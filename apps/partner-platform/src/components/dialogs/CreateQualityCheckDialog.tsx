import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { CreateQualityCheckRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: CreateQualityCheckRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateQualityCheckDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [equip, setEquip] = useState('Helmer Blood Refrigerator #1');
  const [type, setType] = useState<'DAILY_TEMPERATURE_CALIBRATION' | 'CENTRIFUGE_RPM_CHECK' | 'REAGENT_POSITIVE_NEGATIVE_CONTROL' | 'STERILITY_CULTURE_CHECK'>('DAILY_TEMPERATURE_CALIBRATION');
  const [param, setParam] = useState('Digital Sensor vs NIST Calibrated Thermometer');
  const [expected, setExpected] = useState('4.0°C ± 1.0°C');
  const [actual, setActual] = useState('3.9°C');
  const [passed, setPassed] = useState(true);
  const [tech, setTech] = useState('Samantha Ray, SBB');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        equipmentName: equip,
        checkType: type,
        parameterMeasured: param,
        expectedStandard: expected,
        actualReading: actual,
        isPassed: passed,
        technicianName: tech
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Record Quality Control (QC) Log</h2>
        <p className="text-xs text-gray-500 mb-4">Document daily equipment calibration and reagent controls</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Equipment Name</label>
              <Input value={equip} onChange={(e) => setEquip(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">QC Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as 'DAILY_TEMPERATURE_CALIBRATION' | 'CENTRIFUGE_RPM_CHECK' | 'REAGENT_POSITIVE_NEGATIVE_CONTROL' | 'STERILITY_CULTURE_CHECK')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="DAILY_TEMPERATURE_CALIBRATION">Daily Temp Calibration</option>
                <option value="CENTRIFUGE_RPM_CHECK">Centrifuge RPM Check</option>
                <option value="REAGENT_POSITIVE_NEGATIVE_CONTROL">Reagent Control Check</option>
                <option value="STERILITY_CULTURE_CHECK">Sterility Culture Check</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Parameter Measured</label>
            <Input value={param} onChange={(e) => setParam(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Expected Standard</label>
              <Input value={expected} onChange={(e) => setExpected(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Actual Reading</label>
              <Input value={actual} onChange={(e) => setActual(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Technologist</label>
              <Input value={tech} onChange={(e) => setTech(e.target.value)} required />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 text-xs font-bold text-green-900">
                <input type="checkbox" checked={passed} onChange={(e) => setPassed(e.target.checked)} className="rounded" />
                Passed Standard Specifications
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Logging...' : 'Log QC Calibration'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
