import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { RecordQualityCheckRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  batchNumber: string;
  kitchenName: string;
  onClose: () => void;
  onSubmit: (data: RecordQualityCheckRequest) => Promise<void>;
}

export const QualityCheckDialog: React.FC<Props> = ({ isOpen, batchNumber, kitchenName, onClose, onSubmit }) => {
  const [hygieneCheckPassed, setHygieneCheckPassed] = useState(true);
  const [temperatureCheckPassed, setTemperatureCheckPassed] = useState(true);
  const [holdingTempC, setHoldingTempC] = useState(68.5);
  const [allergenSegregationPassed, setAllergenSegregationPassed] = useState(true);
  const [packagingIntegrityPassed, setPackagingIntegrityPassed] = useState(true);
  const [inspectorName, setInspectorName] = useState('Officer Kavita Roy');
  const [qualityStatus, setQualityStatus] = useState<'PENDING' | 'PASSED' | 'FAILED' | 'QUARANTINED'>('PASSED');
  const [notes, setNotes] = useState('HACCP standards fulfilled. Holding temperature > 65°C verified.');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        batchNumber,
        kitchenName,
        hygieneCheckPassed,
        temperatureCheckPassed,
        holdingTempC,
        allergenSegregationPassed,
        packagingIntegrityPassed,
        inspectorName,
        inspectorRole: 'FOOD_SAFETY_OFFICER',
        qualityStatus,
        notes
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Food Safety & HACCP Quality Audit</h2>
        <p className="text-xs text-gray-500">Batch: <strong>{batchNumber}</strong> | Facility: <strong>{kitchenName}</strong></p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input type="checkbox" checked={hygieneCheckPassed} onChange={(e) => setHygieneCheckPassed(e.target.checked)} className="rounded" />
              Kitchen Hygiene & Sanitization Standard Met
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input type="checkbox" checked={temperatureCheckPassed} onChange={(e) => setTemperatureCheckPassed(e.target.checked)} className="rounded" />
              Core & Hot Holding Temperature Verified (&gt; 65°C)
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input type="checkbox" checked={allergenSegregationPassed} onChange={(e) => setAllergenSegregationPassed(e.target.checked)} className="rounded" />
              Allergen Segregation & Zero Cross-Contamination Verified
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input type="checkbox" checked={packagingIntegrityPassed} onChange={(e) => setPackagingIntegrityPassed(e.target.checked)} className="rounded" />
              Tray Cloche & Seal Integrity Certified
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Holding Temperature Reading (°C)</label>
            <Input type="number" step="0.1" value={String(holdingTempC)} onChange={(e) => setHoldingTempC(Number(e.target.value))} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Food Safety Inspector Name</label>
            <Input value={inspectorName} onChange={(e) => setInspectorName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Overall Quality Decision</label>
            <Select
              value={qualityStatus}
              onChange={(e) => setQualityStatus(e.target.value as 'PENDING' | 'PASSED' | 'FAILED' | 'QUARANTINED')}
              options={[
                { value: 'PASSED', label: 'PASSED — Cleared for Ward Dispatch' },
                { value: 'FAILED', label: 'FAILED — Reject & Discard Batch' },
                { value: 'QUARANTINED', label: 'QUARANTINED — Under Secondary Review' }
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Audit Comments</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Recording...' : 'Submit Quality Check'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
