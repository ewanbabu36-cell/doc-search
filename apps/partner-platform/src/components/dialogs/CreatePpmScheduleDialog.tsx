import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { BiomedicalAssetDto, CreatePpmScheduleRequest, PpmFrequency } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  assets: BiomedicalAssetDto[];
  onClose: () => void;
  onSubmit: (data: CreatePpmScheduleRequest) => Promise<void>;
}

export const CreatePpmScheduleDialog: React.FC<Props> = ({ isOpen, assets, onClose, onSubmit }) => {
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || '');
  const [frequency, setFrequency] = useState<PpmFrequency>('QUARTERLY');
  const [scheduledDueDate, setScheduledDueDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] || '2026-09-30');
  const [assignedEngineer, setAssignedEngineer] = useState('Er. Rajesh Nair (Sr. BME)');
  const [tasksInput, setTasksInput] = useState('Visual check, Battery discharge test, Sensor calibration, IEC 62353 safety test');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        assetId: selectedAssetId,
        frequency,
        scheduledDueDate,
        assignedEngineer,
        tasksChecklist: tasksInput.split(',').map((t) => t.trim())
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Schedule Preventive Maintenance (PPM)</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Target Biomedical Asset</label>
            <Select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              options={assets.map((a) => ({ value: a.id, label: `${a.assetCode} - ${a.assetName} (${a.departmentName})` }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">PPM Frequency</label>
              <Select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as PpmFrequency)}
                options={[
                  { value: 'MONTHLY', label: 'Monthly' },
                  { value: 'QUARTERLY', label: 'Quarterly' },
                  { value: 'SEMI_ANNUAL', label: 'Semi-Annual' },
                  { value: 'ANNUAL', label: 'Annual' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Scheduled Due Date</label>
              <Input type="date" value={scheduledDueDate} onChange={(e) => setScheduledDueDate(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned BME Engineer</label>
            <Input value={assignedEngineer} onChange={(e) => setAssignedEngineer(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tasks Checklist (comma separated)</label>
            <Input value={tasksInput} onChange={(e) => setTasksInput(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Scheduling...' : 'Schedule PPM'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
