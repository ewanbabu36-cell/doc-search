import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { BiomedicalAssetDto, CreateCalibrationRecordRequest, CalibrationStatus } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  assets: BiomedicalAssetDto[];
  onClose: () => void;
  onSubmit: (data: CreateCalibrationRecordRequest) => Promise<void>;
}

export const RecordCalibrationDialog: React.FC<Props> = ({ isOpen, assets, onClose, onSubmit }) => {
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || '');
  const [calibrationDate, setCalibrationDate] = useState(new Date().toISOString().split('T')[0] || '2026-08-30');
  const [validUntilDate, setValidUntilDate] = useState(new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0] || '2027-08-30');
  const [calibratedByAgency, setCalibratedByAgency] = useState('NABL Certified Biomedical Metrology Services Ltd');
  const [leadMetrologistName, setLeadMetrologistName] = useState('Dr. S. K. Bhattacharya');
  const [traceableStandardsUsed, setTraceableStandardsUsed] = useState('Fluke VT900A Gas Flow Analyzer, Fluke ProSim 8');
  const [tolerancesObserved, setTolerancesObserved] = useState('All output parameters within ±1.5% of reference standard');
  const [status, setStatus] = useState<CalibrationStatus>('CALIBRATED_PASS');
  const [safetyTestPassed, setSafetyTestPassed] = useState(true);
  const [remarks, setRemarks] = useState('Equipment compliant with ISO/IEC 17025 calibration standards.');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        assetId: selectedAssetId,
        calibrationDate,
        validUntilDate,
        calibratedByAgency,
        leadMetrologistName,
        traceableStandardsUsed,
        tolerancesObserved,
        status,
        safetyTestPassed,
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
        <h2 className="text-lg font-bold text-gray-900">Record Metrology Calibration Certificate</h2>
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">Calibration Date</label>
              <Input type="date" value={calibrationDate} onChange={(e) => setCalibrationDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Valid Until Date</label>
              <Input type="date" value={validUntilDate} onChange={(e) => setValidUntilDate(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Calibrating Agency</label>
              <Input value={calibratedByAgency} onChange={(e) => setCalibratedByAgency(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Lead Metrologist</label>
              <Input value={leadMetrologistName} onChange={(e) => setLeadMetrologistName(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Traceable Standards / Analyzers Used</label>
            <Input value={traceableStandardsUsed} onChange={(e) => setTraceableStandardsUsed(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Observed Tolerances</label>
            <Input value={tolerancesObserved} onChange={(e) => setTolerancesObserved(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Calibration Result</label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as CalibrationStatus)}
                options={[
                  { value: 'CALIBRATED_PASS', label: 'PASSED (Within Tolerance)' },
                  { value: 'CALIBRATED_WITH_DEVIATION', label: 'PASSED with Minor Deviation' },
                  { value: 'FAILED_UNSAFE', label: 'FAILED / UNSAFE FOR CLINICAL USE' }
                ]}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="saf-chk" checked={safetyTestPassed} onChange={(e) => setSafetyTestPassed(e.target.checked)} className="rounded" />
              <label htmlFor="saf-chk" className="text-xs font-semibold text-gray-700">Safety Test Cleared</label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Remarks & Certificate Notes</label>
            <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Recording...' : 'Register Calibration'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
