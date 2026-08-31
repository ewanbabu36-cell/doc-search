import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { BiomedicalAssetDto, CreateSafetyTestRecordRequest, SafetyTestType } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  assets: BiomedicalAssetDto[];
  onClose: () => void;
  onSubmit: (data: CreateSafetyTestRecordRequest) => Promise<void>;
}

export const RecordSafetyTestDialog: React.FC<Props> = ({ isOpen, assets, onClose, onSubmit }) => {
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || '');
  const [testType, setTestType] = useState<SafetyTestType>('ELECTRICAL_SAFETY_IEC_62353');
  const [testStandard, setTestStandard] = useState('IEC 62353 / IEC 60601-1 Class I');
  const [earthResistanceOhms, setEarthResistanceOhms] = useState(0.085);
  const [chassisLeakageMicroAmps, setChassisLeakageMicroAmps] = useState(48.0);
  const [patientLeakageMicroAmps, setPatientLeakageMicroAmps] = useState(9.2);
  const [insulationResistanceMOhm, setInsulationResistanceMOhm] = useState(120.0);
  const [testedByEngineer, setTestedByEngineer] = useState('Er. Rajesh Nair (Sr. BME)');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0] || '2026-08-30');
  const [testPassed, setTestPassed] = useState(true);
  const [remarks, setRemarks] = useState('All leakage currents under 100 uA limit. Earth ground verified.');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        assetId: selectedAssetId,
        testType,
        testStandard,
        earthResistanceOhms,
        chassisLeakageMicroAmps,
        patientLeakageMicroAmps,
        insulationResistanceMOhm,
        testedByEngineer,
        testDate,
        testPassed,
        remarks
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900">Electrical & Radiation Safety Test (IEC / AERB)</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Target Asset</label>
            <Select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              options={assets.map((a) => ({ value: a.id, label: `${a.assetCode} - ${a.assetName}` }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Test Type</label>
              <Select
                value={testType}
                onChange={(e) => setTestType(e.target.value as SafetyTestType)}
                options={[
                  { value: 'ELECTRICAL_SAFETY_IEC_62353', label: 'IEC 62353 Electrical Safety' },
                  { value: 'EARTH_RESISTANCE', label: 'Protective Earth Resistance' },
                  { value: 'LEAKAGE_CURRENT', label: 'Chassis & Patient Leakage' },
                  { value: 'PERFORMANCE_OUTPUT_ACCURACY', label: 'Energy / Output Accuracy' },
                  { value: 'RADIATION_LEAKAGE_AERB', label: 'AERB Radiation Leakage' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Standard / Protocol</label>
              <Input value={testStandard} onChange={(e) => setTestStandard(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Earth Resistance (Ohms)</label>
              <Input type="number" step="0.001" value={String(earthResistanceOhms)} onChange={(e) => setEarthResistanceOhms(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Chassis Leakage (µA)</label>
              <Input type="number" step="0.1" value={String(chassisLeakageMicroAmps)} onChange={(e) => setChassisLeakageMicroAmps(Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Leakage (µA)</label>
              <Input type="number" step="0.1" value={String(patientLeakageMicroAmps)} onChange={(e) => setPatientLeakageMicroAmps(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Insulation Resistance (MΩ)</label>
              <Input type="number" step="1" value={String(insulationResistanceMOhm)} onChange={(e) => setInsulationResistanceMOhm(Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Testing Engineer</label>
              <Input value={testedByEngineer} onChange={(e) => setTestedByEngineer(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Test Date</label>
              <Input type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} required />
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <input type="checkbox" id="pass-test-chk" checked={testPassed} onChange={(e) => setTestPassed(e.target.checked)} className="rounded" />
            <label htmlFor="pass-test-chk" className="text-xs font-semibold text-gray-700">Safety Test Standards Verified & Passed</label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Remarks & Certificate Findings</label>
            <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Recording...' : 'Certify Safety Test'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
